import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { getKafkaService } from '../utils/kafka-mock';

export interface TradeCapture {
  source: 'MANUAL' | 'BROKER_API' | 'FIX_FEED' | 'FILE_UPLOAD' | 'CUSTODIAN_FEED';
  externalTradeId: string;
  portfolioId: string;
  securityId: string;
  transactionType: 'BUY' | 'SELL';
  quantity: Prisma.Decimal;
  price: Prisma.Decimal;
  tradeDate: Date;
  settleDate?: Date;
  fees?: Prisma.Decimal;
  taxes?: Prisma.Decimal;
  commission?: Prisma.Decimal;
  counterparty?: string;
  orderId?: string;
  executionId?: string;
  venue?: string;
  rawData?: any;
}

export interface TransactionMatch {
  status: 'MATCHED' | 'UNMATCHED' | 'PARTIAL_MATCH' | 'DISCREPANCY';
  systemTransaction?: any;
  externalTransaction?: any;
  differences?: {
    field: string;
    systemValue: any;
    externalValue: any;
  }[];
  confidence: number;
}

export interface SettlementInstruction {
  transactionId: string;
  instructionType: 'DVP' | 'FREE_DELIVERY' | 'CASH_SETTLEMENT';
  deliveryDate: Date;
  settlementAmount: Prisma.Decimal;
  custodian: string;
  account: string;
  status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'SETTLED' | 'FAILED';
  dtcNumber?: string;
  contraParty?: string;
  specialInstructions?: string;
}

export interface FailedTrade {
  transactionId: string;
  failureReason: 'INSUFFICIENT_CASH' | 'INSUFFICIENT_SECURITIES' | 'SYSTEM_ERROR' | 'COMPLIANCE_VIOLATION' | 'SETTLEMENT_FAIL' | 'PRICING_ERROR';
  failureDate: Date;
  resolutionActions: string[];
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  resolutionDate?: Date;
  notes?: string;
}

export class TransactionService {
  private prisma: PrismaClient;
  private kafkaService: any;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.kafkaService = getKafkaService();
  }

  // Trade capture from multiple sources
  async captureTradeFromSource(tradeData: TradeCapture): Promise<any> {
    try {
      logger.info('Capturing trade from source', {
        source: tradeData.source,
        externalTradeId: tradeData.externalTradeId,
        portfolioId: tradeData.portfolioId,
        quantity: tradeData.quantity.toString(),
      });

      // Validate portfolio exists and user has access
      const portfolio = await this.prisma.portfolio.findUnique({
        where: { id: tradeData.portfolioId }
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Validate security exists
      const security = await (this.prisma as any).security.findUnique({
        where: { id: tradeData.securityId }
      });

      if (!security) {
        throw new Error('Security not found');
      }

      // Check for duplicate external trade ID
      const existingTrade = await this.prisma.transaction.findFirst({
        where: {
          externalId: tradeData.externalTradeId,
          portfolioId: tradeData.portfolioId,
        }
      });

      if (existingTrade) {
        logger.warn('Duplicate trade capture attempt', {
          externalTradeId: tradeData.externalTradeId,
          existingTransactionId: existingTrade.id,
        });
        return existingTrade;
      }

      // Calculate settlement date if not provided
      const settleDate = tradeData.settleDate || this.calculateSettlementDate(tradeData.tradeDate, security.assetClass);

      // Calculate net amount
      const totalFees = (tradeData.fees || new Prisma.Decimal(0))
        .add(tradeData.taxes || new Prisma.Decimal(0))
        .add(tradeData.commission || new Prisma.Decimal(0));

      let netAmount = tradeData.quantity.mul(tradeData.price);
      
      if (tradeData.transactionType === 'BUY') {
        netAmount = netAmount.add(totalFees);
      } else {
        netAmount = netAmount.sub(totalFees);
      }

      // Create transaction with capture metadata
      const transaction = await this.prisma.transaction.create({
        data: {
          portfolioId: tradeData.portfolioId,
          // securityId: tradeData.securityId, // TODO: Add security relation to schema
          transactionType: tradeData.transactionType,
          transactionDate: tradeData.tradeDate,
          tradeDate: tradeData.tradeDate,
          settlementDate: tradeData.settleDate || new Date(tradeData.tradeDate.getTime() + 2 * 24 * 60 * 60 * 1000), // T+2 settlement
          quantity: tradeData.quantity,
          price: tradeData.price,
          fees: tradeData.fees || new Prisma.Decimal(0),
          taxes: tradeData.taxes || new Prisma.Decimal(0),
          commission: tradeData.commission || new Prisma.Decimal(0),
          netAmount,
          description: `${tradeData.transactionType} ${tradeData.quantity} ${security.symbol} @ ${tradeData.price} - ${tradeData.source}`,
          externalId: tradeData.externalTradeId,
          confirmationNumber: tradeData.executionId || tradeData.orderId,
          status: 'PENDING',
          symbol: security.symbol,
          tenantId: portfolio.tenantId,
          createdBy: 'system',
        },
        // include: {
        //   security: {
        //     select: {
        //       symbol: true,
        //       name: true,
        //     }
        //   }
        // } // TODO: Add security relation
      });

      // Publish trade capture event
      await this.kafkaService.publish('trade-captured', {
        transactionId: transaction.id,
        portfolioId: tradeData.portfolioId,
        source: tradeData.source,
        symbol: security.symbol,
        quantity: tradeData.quantity.toString(),
        price: tradeData.price.toString(),
        tradeDate: tradeData.tradeDate.toISOString(),
      });

      // Create settlement instruction for the trade
      await this.createSettlementInstruction({
        transactionId: transaction.id,
        instructionType: 'DVP',
        deliveryDate: settleDate,
        settlementAmount: netAmount,
        custodian: 'PRIMARY_CUSTODIAN', // This would be configurable
        account: (portfolio as any).accountNumber || 'DEFAULT',
        status: 'PENDING',
      });

      logger.info('Trade captured successfully', {
        transactionId: transaction.id,
        source: tradeData.source,
        externalTradeId: tradeData.externalTradeId,
      });

      return transaction;
    } catch (error: any) {
      logger.error('Error capturing trade from source', {
        source: tradeData.source,
        externalTradeId: tradeData.externalTradeId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Transaction matching and reconciliation
  async matchTransactions(
    portfolioId: string,
    externalTransactions: any[],
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<{
    matches: TransactionMatch[];
    unmatched: any[];
    summary: {
      totalExternal: number;
      totalMatched: number;
      totalUnmatched: number;
      totalDiscrepancies: number;
    };
  }> {
    try {
      logger.info('Starting transaction matching', {
        portfolioId,
        externalCount: externalTransactions.length,
        dateRange,
      });

      // Get system transactions for the period
      const systemTransactions = await this.prisma.transaction.findMany({
        where: {
          portfolioId,
          createdAt: { // TODO: Field doesn't exist, using createdAt instead of transactionDate
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          status: { not: 'CANCELLED' },
        },
        // include: {
        //   security: {
        //     select: {
        //       symbol: true,
        //       cusip: true,
        //       isin: true,
        //     }
        //   }
        // } // TODO: Add security relation
      });

      const matches: TransactionMatch[] = [];
      const unmatched: any[] = [];

      // Create matching algorithm
      for (const externalTx of externalTransactions) {
        const potentialMatches = this.findPotentialMatches(externalTx, systemTransactions);
        
        if (potentialMatches.length === 0) {
          unmatched.push(externalTx);
          matches.push({
            status: 'UNMATCHED',
            externalTransaction: externalTx,
            confidence: 0,
          });
          continue;
        }

        // Find best match based on multiple criteria
        const bestMatch = this.selectBestMatch(externalTx, potentialMatches);
        
        if (bestMatch) {
          const differences = this.identifyDifferences(externalTx, bestMatch.systemTx);
          
          matches.push({
            status: differences.length > 0 ? 'DISCREPANCY' : 'MATCHED',
            systemTransaction: bestMatch.systemTx,
            externalTransaction: externalTx,
            differences: differences.length > 0 ? differences : undefined,
            confidence: bestMatch.confidence,
          });
        } else {
          unmatched.push(externalTx);
          matches.push({
            status: 'UNMATCHED',
            externalTransaction: externalTx,
            confidence: 0,
          });
        }
      }

      const summary = {
        totalExternal: externalTransactions.length,
        totalMatched: matches.filter(m => m.status === 'MATCHED').length,
        totalUnmatched: matches.filter(m => m.status === 'UNMATCHED').length,
        totalDiscrepancies: matches.filter(m => m.status === 'DISCREPANCY').length,
      };

      // Store reconciliation results
      await this.storeReconciliationResults(portfolioId, matches, dateRange);

      logger.info('Transaction matching completed', {
        portfolioId,
        summary,
      });

      return {
        matches,
        unmatched,
        summary,
      };
    } catch (error: any) {
      logger.error('Error matching transactions', {
        portfolioId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Settlement tracking and confirmation
  async createSettlementInstruction(instruction: SettlementInstruction): Promise<any> {
    try {
      const settlement = await (this.prisma as any).settlementInstruction.create({
        data: {
          transactionId: instruction.transactionId,
          instructionType: instruction.instructionType,
          deliveryDate: instruction.deliveryDate,
          settlementAmount: instruction.settlementAmount,
          custodian: instruction.custodian,
          account: instruction.account,
          status: instruction.status,
          dtcNumber: instruction.dtcNumber,
          contraParty: instruction.contraParty,
          specialInstructions: instruction.specialInstructions,
          createdAt: new Date(),
        }
      });

      // Publish settlement instruction event
      await this.kafkaService.publish('settlement-instruction-created', {
        instructionId: settlement.id,
        transactionId: instruction.transactionId,
        deliveryDate: instruction.deliveryDate.toISOString(),
        amount: instruction.settlementAmount.toString(),
      });

      return settlement;
    } catch (error: any) {
      logger.error('Error creating settlement instruction', {
        transactionId: instruction.transactionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Track settlement status updates
  async updateSettlementStatus(
    instructionId: string,
    status: SettlementInstruction['status'],
    notes?: string
  ): Promise<any> {
    try {
      const updated = await (this.prisma as any).settlementInstruction.update({
        where: { id: instructionId },
        data: {
          status,
          updatedAt: new Date(),
          ...(notes && { notes }),
        },
        include: {
          transaction: {
            include: {
              security: {
                select: { symbol: true }
              }
            }
          }
        }
      });

      // Update transaction status if settlement is complete
      if (status === 'SETTLED') {
        await this.prisma.transaction.update({
          where: { id: updated.transactionId },
          data: { status: 'SETTLED' }
        });
      } else if (status === 'FAILED') {
        await this.prisma.transaction.update({
          where: { id: updated.transactionId },
          data: { status: 'FAILED' }
        });
      }

      // Publish settlement status event
      await this.kafkaService.publish('settlement-status-updated', {
        instructionId,
        transactionId: updated.transactionId,
        status,
        symbol: (updated as any).transaction?.security?.symbol || 'UNKNOWN',
      });

      logger.info('Settlement status updated', {
        instructionId,
        transactionId: updated.transactionId,
        status,
      });

      return updated;
    } catch (error: any) {
      logger.error('Error updating settlement status', {
        instructionId,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Failed trade management
  async createFailedTrade(failedTrade: FailedTrade): Promise<any> {
    try {
      const failed = await (this.prisma as any).failedTrade.create({
        data: {
          transactionId: failedTrade.transactionId,
          failureReason: failedTrade.failureReason,
          failureDate: failedTrade.failureDate,
          resolutionActions: failedTrade.resolutionActions,
          assignedTo: failedTrade.assignedTo,
          priority: failedTrade.priority,
          resolved: failedTrade.resolved,
          resolutionDate: failedTrade.resolutionDate,
          notes: failedTrade.notes,
          createdAt: new Date(),
        }
      });

      // Publish failed trade event
      await this.kafkaService.publish('trade-failed', {
        failedTradeId: failed.id,
        transactionId: failedTrade.transactionId,
        reason: failedTrade.failureReason,
        priority: failedTrade.priority,
      });

      return failed;
    } catch (error: any) {
      logger.error('Error creating failed trade record', {
        transactionId: failedTrade.transactionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Bulk transaction processing
  async processBulkTransactions(transactions: TradeCapture[]): Promise<{
    successful: any[];
    failed: Array<{ trade: TradeCapture; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    try {
      logger.info('Processing bulk transactions', {
        count: transactions.length,
      });

      const successful: any[] = [];
      const failed: Array<{ trade: TradeCapture; error: string }> = [];

      // Process transactions in batches to avoid overwhelming the system
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        batches.push(transactions.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (trade) => {
          try {
            const result = await this.captureTradeFromSource(trade);
            successful.push(result);
          } catch (error: any) {
            failed.push({
              trade,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });

        await Promise.allSettled(batchPromises);
      }

      const summary = {
        total: transactions.length,
        successful: successful.length,
        failed: failed.length,
      };

      logger.info('Bulk transaction processing completed', summary);

      return {
        successful,
        failed,
        summary,
      };
    } catch (error: any) {
      logger.error('Error processing bulk transactions', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Cash impact calculations
  async calculateCashImpact(
    portfolioId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<{
    totalCashIn: Prisma.Decimal;
    totalCashOut: Prisma.Decimal;
    netCashFlow: Prisma.Decimal;
    transactions: Array<{
      transactionId: string;
      date: Date;
      type: string;
      amount: Prisma.Decimal;
      description: string;
    }>;
  }> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          portfolioId,
          createdAt: { // TODO: Field doesn't exist, using createdAt instead of transactionDate
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          status: 'SETTLED',
        },
        // include: {
        //   security: {
        //     select: { symbol: true }
        //   }
        // }, // TODO: Add security relation
        orderBy: { createdAt: 'desc' } // TODO: Field doesn't exist, using createdAt
      });

      let totalCashIn = new Prisma.Decimal(0);
      let totalCashOut = new Prisma.Decimal(0);

      const impactTransactions = transactions.map(tx => {
        const amount = tx.netAmount || new Prisma.Decimal(0);
        
        // Determine cash flow direction
        let cashImpact = new Prisma.Decimal(0);
        if (['BUY', 'TRANSFER_IN', 'DEPOSIT'].includes(tx.transactionType)) {
          cashImpact = amount.negated(); // Cash out
          totalCashOut = totalCashOut.add(amount.abs());
        } else if (['SELL', 'TRANSFER_OUT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST'].includes(tx.transactionType)) {
          cashImpact = amount; // Cash in
          totalCashIn = totalCashIn.add(amount.abs());
        }

        return {
          transactionId: tx.id,
          date: tx.createdAt,
          type: tx.transactionType,
          amount: cashImpact,
          description: `${tx.transactionType} ${tx.quantity} ${(tx as any).security?.symbol || 'CASH'}`,
        };
      });

      const netCashFlow = totalCashIn.sub(totalCashOut);

      return {
        totalCashIn,
        totalCashOut,
        netCashFlow,
        transactions: impactTransactions,
      };
    } catch (error: any) {
      logger.error('Error calculating cash impact', {
        portfolioId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Helper methods
  private calculateSettlementDate(tradeDate: Date, assetClass: string): Date {
    const settleDate = new Date(tradeDate);
    
    // Standard settlement periods by asset class
    switch (assetClass) {
      case 'EQUITY':
      case 'ETF':
        settleDate.setDate(settleDate.getDate() + 2); // T+2
        break;
      case 'BOND':
      case 'CORPORATE_BOND':
        settleDate.setDate(settleDate.getDate() + 1); // T+1
        break;
      case 'GOVERNMENT_BOND':
        settleDate.setDate(settleDate.getDate() + 1); // T+1
        break;
      case 'MONEY_MARKET':
        // Same day settlement
        break;
      default:
        settleDate.setDate(settleDate.getDate() + 2); // Default T+2
    }

    // Skip weekends (simplified - doesn't account for holidays)
    while (settleDate.getDay() === 0 || settleDate.getDay() === 6) {
      settleDate.setDate(settleDate.getDate() + 1);
    }

    return settleDate;
  }

  private findPotentialMatches(externalTx: any, systemTransactions: any[]): any[] {
    return systemTransactions.filter(sysTx => {
      // Match by security identifier (symbol, CUSIP, or ISIN)
      const securityMatch = 
        sysTx.security.symbol === externalTx.symbol ||
        sysTx.security.cusip === externalTx.cusip ||
        sysTx.security.isin === externalTx.isin;

      // Match by date (within 3 days)
      const dateMatch = Math.abs(
        new Date(sysTx.transactionDate).getTime() - new Date(externalTx.tradeDate).getTime()
      ) <= (3 * 24 * 60 * 60 * 1000);

      return securityMatch && dateMatch;
    });
  }

  private selectBestMatch(externalTx: any, potentialMatches: any[]): { systemTx: any; confidence: number } | null {
    let bestMatch = null;
    let highestConfidence = 0;

    for (const sysTx of potentialMatches) {
      let confidence = 0;

      // Exact symbol match
      if (sysTx.security.symbol === externalTx.symbol) confidence += 30;
      
      // Exact quantity match
      if (sysTx.quantity.equals(new Prisma.Decimal(externalTx.quantity))) confidence += 25;
      
      // Exact price match
      if (sysTx.price?.equals(new Prisma.Decimal(externalTx.price))) confidence += 20;
      
      // Same transaction type
      if (sysTx.transactionType === externalTx.transactionType) confidence += 15;
      
      // Exact date match
      if (new Date(sysTx.transactionDate).toDateString() === new Date(externalTx.tradeDate).toDateString()) {
        confidence += 10;
      }

      if (confidence > highestConfidence && confidence >= 60) { // Minimum 60% confidence
        highestConfidence = confidence;
        bestMatch = { systemTx: sysTx, confidence };
      }
    }

    return bestMatch;
  }

  private identifyDifferences(externalTx: any, systemTx: any): Array<{ field: string; systemValue: any; externalValue: any }> {
    const differences = [];

    if (!systemTx.quantity.equals(new Prisma.Decimal(externalTx.quantity))) {
      differences.push({
        field: 'quantity',
        systemValue: systemTx.quantity.toNumber(),
        externalValue: externalTx.quantity,
      });
    }

    if (systemTx.price && !systemTx.price.equals(new Prisma.Decimal(externalTx.price))) {
      differences.push({
        field: 'price',
        systemValue: systemTx.price.toNumber(),
        externalValue: externalTx.price,
      });
    }

    if (systemTx.transactionType !== externalTx.transactionType) {
      differences.push({
        field: 'transactionType',
        systemValue: systemTx.transactionType,
        externalValue: externalTx.transactionType,
      });
    }

    return differences;
  }

  private async storeReconciliationResults(
    portfolioId: string,
    matches: TransactionMatch[],
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<any> {
    try {
      await (this.prisma as any).transactionReconciliation.create({
        data: {
          portfolioId,
          reconciliationDate: new Date(),
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          totalMatches: matches.filter(m => m.status === 'MATCHED').length,
          totalDiscrepancies: matches.filter(m => m.status === 'DISCREPANCY').length,
          totalUnmatched: matches.filter(m => m.status === 'UNMATCHED').length,
          results: JSON.stringify(matches),
        }
      });
    } catch (error: any) {
      logger.error('Error storing reconciliation results', {
        portfolioId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}



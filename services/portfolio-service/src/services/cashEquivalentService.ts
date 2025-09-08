import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { getKafkaService } from '../utils/kafka-mock';
import {
  MoneyMarketFund,
  SweepAccount,
  CashEquivalentPosition,
  CashEquivalentTransaction,
  YieldCalculation,
  CashEquivalentAsset
} from '../models/assets/MoneyMarketAssets';

export interface CreateMoneyMarketPositionRequest {
  portfolioId: string;
  tenantId: string;
  fundId: string;
  shares: number;
  marketValue: number;
  currentYield: number;
  createdBy: string;
}

export interface CreateSweepAccountRequest {
  portfolioId: string;
  tenantId: string;
  accountId: string;
  balance: number;
  currentRate: number;
  sweepThreshold: number;
  autoSweepEnabled: boolean;
  createdBy: string;
}

export interface SweepExecutionRequest {
  portfolioId: string;
  tenantId: string;
  amount: number;
  sweepType: 'AUTO' | 'MANUAL';
  triggerEvent?: string;
  executedBy: string;
}

export interface YieldDistributionRequest {
  positionId: string;
  distributionDate: Date;
  yieldRate: number;
  amount: number;
  distributionType: 'DIVIDEND' | 'INTEREST';
  tenantId: string;
  processedBy: string;
}

export class CashEquivalentService {
  private prisma: PrismaClient;
  private kafkaService: any;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.kafkaService = getKafkaService();
  }

  async createMoneyMarketPosition(request: CreateMoneyMarketPositionRequest): Promise<CashEquivalentPosition> {
    try {
      // Verify portfolio exists and user has access
      const portfolio = await this.prisma.portfolio.findFirst({
        where: {
          id: request.portfolioId,
          tenantId: request.tenantId
        }
      });

      if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
      }

      // Create position in the database
      const position = await this.prisma.position.create({
        data: {
          portfolioId: request.portfolioId,
          tenantId: request.tenantId,
          symbol: request.fundId,
          securityId: request.fundId,
          securityType: 'CASH', // We'll extend this enum later
          quantity: new Prisma.Decimal(request.shares),
          marketValue: new Prisma.Decimal(request.marketValue),
          costBasis: new Prisma.Decimal(request.marketValue), // MMFs typically at par
          averageCost: new Prisma.Decimal(1.0), // MMFs typically $1 per share
          lastPrice: new Prisma.Decimal(1.0),
          lastPriceDate: new Date(),
          isActive: true,
          isLong: true
        }
      });

      // Create enhanced cash equivalent position record
      const cashEquivalentPosition: CashEquivalentPosition = {
        id: position.id,
        portfolioId: request.portfolioId,
        tenantId: request.tenantId,
        assetType: 'MONEY_MARKET_FUND',
        assetId: request.fundId,
        symbol: request.fundId,
        shares: request.shares,
        marketValue: request.marketValue,
        currentYield: request.currentYield,
        costBasis: request.marketValue,
        liquidityTier: 'T0', // Money market funds typically same-day liquidity
        isActive: true,
        isPledged: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastPriceUpdate: new Date()
      };

      // Update portfolio cash balance and total value
      await this.updatePortfolioValuation(request.portfolioId, request.marketValue, 'ADD');

      // Publish event
      await this.publishEvent('cash_equivalent.position_created', {
        positionId: position.id,
        portfolioId: request.portfolioId,
        assetType: 'MONEY_MARKET_FUND',
        marketValue: request.marketValue
      });

      logger.info(`Money market position created: ${position.id} for portfolio ${request.portfolioId}`);
      return cashEquivalentPosition;

    } catch (error: any) {
      logger.error('Error creating money market position:', error);
      throw error;
    }
  }

  async createSweepAccount(request: CreateSweepAccountRequest): Promise<CashEquivalentPosition> {
    try {
      // Verify portfolio exists
      const portfolio = await this.prisma.portfolio.findFirst({
        where: {
          id: request.portfolioId,
          tenantId: request.tenantId
        }
      });

      if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
      }

      // Create position for sweep account
      const position = await this.prisma.position.create({
        data: {
          portfolioId: request.portfolioId,
          tenantId: request.tenantId,
          symbol: `SWEEP_${request.accountId}`,
          securityId: request.accountId,
          securityType: 'CASH',
          quantity: new Prisma.Decimal(request.balance),
          marketValue: new Prisma.Decimal(request.balance),
          costBasis: new Prisma.Decimal(request.balance),
          averageCost: new Prisma.Decimal(1.0),
          lastPrice: new Prisma.Decimal(1.0),
          lastPriceDate: new Date(),
          isActive: true,
          isLong: true
        }
      });

      // Create enhanced cash equivalent position
      const sweepPosition: CashEquivalentPosition = {
        id: position.id,
        portfolioId: request.portfolioId,
        tenantId: request.tenantId,
        assetType: 'SWEEP_ACCOUNT',
        assetId: request.accountId,
        symbol: `SWEEP_${request.accountId}`,
        balance: request.balance,
        marketValue: request.balance,
        currentYield: request.currentRate,
        costBasis: request.balance,
        liquidityTier: 'T0', // Sweep accounts have immediate liquidity
        isActive: true,
        isPledged: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastPriceUpdate: new Date()
      };

      // Update portfolio cash balance
      await this.updatePortfolioValuation(request.portfolioId, request.balance, 'ADD');

      await this.publishEvent('cash_equivalent.sweep_account_created', {
        positionId: position.id,
        portfolioId: request.portfolioId,
        accountId: request.accountId,
        balance: request.balance
      });

      logger.info(`Sweep account created: ${position.id} for portfolio ${request.portfolioId}`);
      return sweepPosition;

    } catch (error: any) {
      logger.error('Error creating sweep account:', error);
      throw error;
    }
  }

  async executeSweep(request: SweepExecutionRequest): Promise<CashEquivalentTransaction> {
    try {
      // Get sweep account position
      const sweepPosition = await this.prisma.position.findFirst({
        where: {
          portfolioId: request.portfolioId,
          tenantId: request.tenantId,
          symbol: { startsWith: 'SWEEP_' },
          isActive: true
        }
      });

      if (!sweepPosition) {
        throw new Error('No active sweep account found for portfolio');
      }

      // Create sweep transaction
      const sweepTransaction = await this.prisma.transaction.create({
        data: {
          portfolioId: request.portfolioId,
          positionId: sweepPosition.id,
          tenantId: request.tenantId,
          transactionType: request.amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
          symbol: sweepPosition.symbol,
          quantity: new Prisma.Decimal(Math.abs(request.amount)),
          price: new Prisma.Decimal(1.0),
          grossAmount: new Prisma.Decimal(Math.abs(request.amount)),
          netAmount: new Prisma.Decimal(Math.abs(request.amount)),
          transactionDate: new Date(),
          tradeDate: new Date(),
          settlementDate: new Date(), // Immediate settlement for sweeps
          status: 'SETTLED',
          isReconciled: true,
          reconciledAt: new Date(),
          createdBy: request.executedBy
        }
      });

      // Update position balance
      const newBalance = sweepPosition.quantity.toNumber() + request.amount;
      await this.prisma.position.update({
        where: { id: sweepPosition.id },
        data: {
          quantity: new Prisma.Decimal(newBalance),
          marketValue: new Prisma.Decimal(newBalance),
          costBasis: new Prisma.Decimal(newBalance),
          updatedAt: new Date()
        }
      });

      // Update portfolio cash balance
      await this.updatePortfolioValuation(request.portfolioId, request.amount, 'ADD');

      const cashEquivalentTransaction: CashEquivalentTransaction = {
        id: sweepTransaction.id,
        portfolioId: request.portfolioId,
        positionId: sweepPosition.id,
        tenantId: request.tenantId,
        transactionType: request.amount > 0 ? 'SWEEP_IN' : 'SWEEP_OUT',
        amount: Math.abs(request.amount),
        price: 1.0,
        tradeDate: new Date(),
        settlementDate: new Date(),
        sweepType: request.sweepType,
        triggerEvent: request.triggerEvent,
        status: 'SETTLED',
        createdAt: new Date(),
        processedAt: new Date(),
        createdBy: request.executedBy
      };

      await this.publishEvent('cash_equivalent.sweep_executed', {
        transactionId: sweepTransaction.id,
        portfolioId: request.portfolioId,
        amount: request.amount,
        sweepType: request.sweepType
      });

      logger.info(`Sweep executed: ${sweepTransaction.id} for ${request.amount} in portfolio ${request.portfolioId}`);
      return cashEquivalentTransaction;

    } catch (error: any) {
      logger.error('Error executing sweep:', error);
      throw error;
    }
  }

  async processYieldDistribution(request: YieldDistributionRequest): Promise<CashEquivalentTransaction> {
    try {
      // Get the position
      const position = await this.prisma.position.findFirst({
        where: {
          id: request.positionId,
          tenantId: request.tenantId,
          isActive: true
        }
      });

      if (!position) {
        throw new Error('Position not found');
      }

      // Create dividend/interest transaction
      const yieldTransaction = await this.prisma.transaction.create({
        data: {
          portfolioId: position.portfolioId,
          positionId: position.id,
          tenantId: request.tenantId,
          transactionType: request.distributionType === 'DIVIDEND' ? 'DIVIDEND' : 'INTEREST',
          symbol: position.symbol,
          quantity: new Prisma.Decimal(0), // No shares involved in distributions
          price: new Prisma.Decimal(0),
          grossAmount: new Prisma.Decimal(request.amount),
          netAmount: new Prisma.Decimal(request.amount),
          transactionDate: request.distributionDate,
          tradeDate: request.distributionDate,
          settlementDate: request.distributionDate,
          status: 'SETTLED',
          isReconciled: true,
          reconciledAt: new Date(),
          createdBy: request.processedBy
        }
      });

      // Update portfolio cash balance
      await this.updatePortfolioValuation(position.portfolioId, request.amount, 'ADD');

      const distributionTransaction: CashEquivalentTransaction = {
        id: yieldTransaction.id,
        portfolioId: position.portfolioId,
        positionId: position.id,
        tenantId: request.tenantId,
        transactionType: request.distributionType === 'DIVIDEND' ? 'DIVIDEND' : 'INTEREST',
        amount: request.amount,
        tradeDate: request.distributionDate,
        settlementDate: request.distributionDate,
        interestRate: request.yieldRate,
        status: 'SETTLED',
        createdAt: new Date(),
        processedAt: new Date(),
        createdBy: request.processedBy
      };

      await this.publishEvent('cash_equivalent.yield_distributed', {
        transactionId: yieldTransaction.id,
        positionId: request.positionId,
        amount: request.amount,
        distributionType: request.distributionType
      });

      logger.info(`Yield distribution processed: ${yieldTransaction.id} for position ${request.positionId}`);
      return distributionTransaction;

    } catch (error: any) {
      logger.error('Error processing yield distribution:', error);
      throw error;
    }
  }

  async calculateCurrentYield(positionId: string, tenantId: string): Promise<YieldCalculation> {
    try {
      // Get position and recent transactions
      const position = await this.prisma.position.findFirst({
        where: {
          id: positionId,
          tenantId,
          isActive: true
        }
      });

      if (!position) {
        throw new Error('Position not found');
      }

      // Get last 30 days of yield transactions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const yieldTransactions = await this.prisma.transaction.findMany({
        where: {
          positionId,
          tenantId,
          transactionType: { in: ['DIVIDEND', 'INTEREST'] },
          tradeDate: { gte: thirtyDaysAgo },
          status: 'SETTLED'
        },
        orderBy: { tradeDate: 'desc' }
      });

      // Calculate yields
      const totalYieldAmount = yieldTransactions.reduce(
        (sum, tx) => sum + tx.netAmount.toNumber(), 0
      );
      
      const marketValue = position.marketValue.toNumber();
      const periodDays = 30;
      const annualizationFactor = 365 / periodDays;
      
      const currentYield = marketValue > 0 ? (totalYieldAmount / marketValue) * annualizationFactor : 0;
      const effectiveYield = currentYield; // Simplified for cash equivalents
      const compoundYield = Math.pow(1 + (currentYield / 365), 365) - 1;

      const yieldCalculation: YieldCalculation = {
        positionId,
        calculationDate: new Date(),
        currentYield,
        effectiveYield,
        compoundYield,
        dividendYield: yieldTransactions.filter(tx => tx.transactionType === 'DIVIDEND')
          .reduce((sum, tx) => sum + tx.netAmount.toNumber(), 0) / marketValue * annualizationFactor,
        interestYield: yieldTransactions.filter(tx => tx.transactionType === 'INTEREST')
          .reduce((sum, tx) => sum + tx.netAmount.toNumber(), 0) / marketValue * annualizationFactor,
        feeAdjustedYield: currentYield, // Simplified - should account for fees
        periodDays,
        annualizationFactor,
        calculationMethod: 'SIMPLE',
        createdAt: new Date()
      };

      logger.info(`Yield calculated for position ${positionId}: ${(currentYield * 100).toFixed(2)}%`);
      return yieldCalculation;

    } catch (error: any) {
      logger.error('Error calculating yield:', error);
      throw error;
    }
  }

  async getCashEquivalentPositions(portfolioId: string, tenantId: string): Promise<CashEquivalentPosition[]> {
    try {
      const positions = await this.prisma.position.findMany({
        where: {
          portfolioId,
          tenantId,
          securityType: 'CASH',
          isActive: true,
          quantity: { gt: 0 }
        },
        orderBy: { marketValue: 'desc' }
      });

      return positions.map(pos => ({
        id: pos.id,
        portfolioId: pos.portfolioId,
        tenantId: pos.tenantId,
        assetType: pos.symbol.startsWith('SWEEP_') ? 'SWEEP_ACCOUNT' : 'MONEY_MARKET_FUND',
        assetId: pos.securityId || pos.symbol,
        symbol: pos.symbol,
        shares: pos.symbol.startsWith('SWEEP_') ? undefined : pos.quantity.toNumber(),
        balance: pos.symbol.startsWith('SWEEP_') ? pos.quantity.toNumber() : undefined,
        marketValue: pos.marketValue.toNumber(),
        currentYield: 0, // Would need to be calculated separately
        costBasis: pos.costBasis.toNumber(),
        liquidityTier: 'T0',
        isActive: pos.isActive,
        isPledged: false,
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt,
        lastPriceUpdate: pos.lastPriceDate || pos.updatedAt
      }));

    } catch (error: any) {
      logger.error('Error getting cash equivalent positions:', error);
      throw error;
    }
  }

  private async updatePortfolioValuation(portfolioId: string, amount: number, operation: 'ADD' | 'SUBTRACT'): Promise<any> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio) return;

    const currentCash = portfolio.cashBalance.toNumber();
    const currentTotal = portfolio.totalValue.toNumber();
    
    const cashChange = operation === 'ADD' ? amount : -amount;
    const newCashBalance = currentCash + cashChange;
    const newTotalValue = currentTotal + cashChange;

    await this.prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        cashBalance: new Prisma.Decimal(newCashBalance),
        totalValue: new Prisma.Decimal(newTotalValue),
        updatedAt: new Date()
      }
    });
  }

  private async publishEvent(eventType: string, data: any): Promise<any> {
    try {
      if (this.kafkaService.isConnected()) {
        await this.kafkaService.publishMessage('cash-equivalent-events', {
          eventType,
          data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      logger.error('Error publishing cash equivalent event:', error);
    }
  }
}



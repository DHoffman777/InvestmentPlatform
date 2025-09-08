import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface PositionAggregation {
  portfolioId: string;
  securityId: string;
  totalQuantity: Prisma.Decimal;
  averageCostBasis: Prisma.Decimal;
  totalCostBasis: Prisma.Decimal;
  currentMarketValue: Prisma.Decimal;
  unrealizedGainLoss: Prisma.Decimal;
  unrealizedGainLossPercentage: Prisma.Decimal;
  dayChange: Prisma.Decimal;
  dayChangePercentage: Prisma.Decimal;
  taxLots: any[];
}

export interface TaxLotMethod {
  method: 'FIFO' | 'LIFO' | 'HIFO' | 'SPECIFIC_ID' | 'AVERAGE_COST';
  quantity: Prisma.Decimal;
  costBasis: Prisma.Decimal;
  realizedGainLoss?: Prisma.Decimal;
}

export class PositionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Real-time position aggregation across multiple portfolios
  async getAggregatedPositions(
    tenantId: string, 
    portfolioIds?: string[], 
    assetClasses?: string[]
  ): Promise<PositionAggregation[]> {
    try {
      const whereClause: any = {
        portfolio: { tenantId },
        quantity: { gt: 0 }
      };

      if (portfolioIds && portfolioIds.length > 0) {
        whereClause.portfolioId = { in: portfolioIds };
      }

      if (assetClasses && assetClasses.length > 0) {
        whereClause.security = {
          assetClass: { in: assetClasses }
        };
      }

      const positions = await this.prisma.position.findMany({
        where: whereClause,
        include: {
          security: true,
          taxLots: {
            where: { quantity: { gt: 0 } },
            orderBy: { openDate: 'asc' }
          },
          portfolio: {
            select: { id: true, name: true }
          }
        }
      });

      // Group positions by security across portfolios
      const aggregatedMap = new Map<string, PositionAggregation>();

      positions.forEach(position => {
        const key = `${position.securityId}`;
        const existing = aggregatedMap.get(key);

        const quantity = position.quantity;
        const costBasis = position.costBasis || new Prisma.Decimal(0);
        const marketValue = position.marketValue || new Prisma.Decimal(0);
        const dayChange = position.dayChange || new Prisma.Decimal(0);

        if (existing) {
          // Aggregate existing position
          existing.totalQuantity = existing.totalQuantity.add(quantity);
          existing.totalCostBasis = existing.totalCostBasis.add(costBasis.mul(quantity));
          existing.currentMarketValue = existing.currentMarketValue.add(marketValue);
          existing.dayChange = existing.dayChange.add(dayChange);
          existing.taxLots.push(...position.taxLots);

          // Recalculate averages
          existing.averageCostBasis = existing.totalCostBasis.div(existing.totalQuantity);
          existing.unrealizedGainLoss = existing.currentMarketValue.sub(existing.totalCostBasis);
          existing.unrealizedGainLossPercentage = existing.totalCostBasis.gt(0) 
            ? existing.unrealizedGainLoss.div(existing.totalCostBasis).mul(100)
            : new Prisma.Decimal(0);
          existing.dayChangePercentage = existing.currentMarketValue.gt(0)
            ? existing.dayChange.div(existing.currentMarketValue.sub(existing.dayChange)).mul(100)
            : new Prisma.Decimal(0);
        } else {
          // Create new aggregation
          const totalCostBasis = costBasis.mul(quantity);
          const unrealizedGainLoss = marketValue.sub(totalCostBasis);
          
          aggregatedMap.set(key, {
            portfolioId: position.portfolioId,
            securityId: position.securityId || '',
            totalQuantity: quantity,
            averageCostBasis: costBasis,
            totalCostBasis,
            currentMarketValue: marketValue,
            unrealizedGainLoss,
            unrealizedGainLossPercentage: totalCostBasis.gt(0) 
              ? unrealizedGainLoss.div(totalCostBasis).mul(100)
              : new Prisma.Decimal(0),
            dayChange,
            dayChangePercentage: marketValue.gt(0)
              ? dayChange.div(marketValue.sub(dayChange)).mul(100)
              : new Prisma.Decimal(0),
            taxLots: position.taxLots
          });
        }
      });

      return Array.from(aggregatedMap.values());
    } catch (error: any) {
      logger.error('Error getting aggregated positions:', { tenantId, portfolioIds, error });
      throw error;
    }
  }

  // Calculate tax lots for a sale using specified method
  async calculateTaxLots(
    positionId: string,
    sellQuantity: Prisma.Decimal,
    method: TaxLotMethod['method'] = 'FIFO'
  ): Promise<TaxLotMethod[]> {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id: positionId },
        include: {
          taxLots: {
            where: { quantity: { gt: 0 } },
            orderBy: method === 'FIFO' ? { openDate: 'asc' } : 
                     method === 'LIFO' ? { openDate: 'desc' } :
                     method === 'HIFO' ? { costBasis: 'desc' } :
                     { openDate: 'asc' }
          }
        }
      });

      if (!position) {
        throw new Error('Position not found');
      }

      const availableQuantity = position.taxLots.reduce((sum, lot) => sum.add(lot.quantity), new Prisma.Decimal(0));
      
      if (sellQuantity.gt(availableQuantity)) {
        throw new Error('Insufficient quantity available for sale');
      }

      const selectedLots: TaxLotMethod[] = [];
      let remainingQuantity = sellQuantity;

      for (const taxLot of position.taxLots) {
        if (remainingQuantity.lte(0)) break;

        const lotQuantity = taxLot.quantity;
        const useQuantity = remainingQuantity.gte(lotQuantity) ? lotQuantity : remainingQuantity;

        selectedLots.push({
          method,
          quantity: useQuantity,
          costBasis: taxLot.costBasis.mul(useQuantity),
        });

        remainingQuantity = remainingQuantity.sub(useQuantity);
      }

      return selectedLots;
    } catch (error: any) {
      logger.error('Error calculating tax lots:', { positionId, sellQuantity, method, error });
      throw error;
    }
  }

  // Position reconciliation with custodian data
  async reconcilePositions(
    portfolioId: string,
    custodianPositions: Array<{
      symbol: string;
      quantity: number;
      marketValue: number;
      costBasis?: number;
    }>
  ): Promise<{
    matches: any[];
    discrepancies: any[];
    missing: any[];
    extra: any[];
  }> {
    try {
      const currentPositions = await this.prisma.position.findMany({
        where: { 
          portfolioId,
          quantity: { gt: 0 }
        },
        include: {
          security: {
            select: { symbol: true, name: true }
          }
        }
      });

      const matches: any[] = [];
      const discrepancies: any[] = [];
      const missing: any[] = [];
      const custodianMap = new Map(custodianPositions.map(p => [p.symbol, p]));
      const currentMap = new Map(currentPositions.map(p => [p.security?.symbol || '', p]));

      // Check for matches and discrepancies
      for (const [symbol, custodianPos] of custodianMap) {
        const currentPos = currentMap.get(symbol);
        
        if (!currentPos) {
          missing.push({
            symbol,
            custodianQuantity: custodianPos.quantity,
            custodianMarketValue: custodianPos.marketValue,
            systemQuantity: 0,
            systemMarketValue: 0,
          });
        } else {
          const quantityDiff = new Prisma.Decimal(custodianPos.quantity).sub(currentPos.quantity);
          const valueDiff = new Prisma.Decimal(custodianPos.marketValue).sub(currentPos.marketValue?.toNumber() || 0);
          
          if (quantityDiff.abs().gte(new Prisma.Decimal(0.01)) || valueDiff.abs().gte(new Prisma.Decimal(0.01))) {
            discrepancies.push({
              symbol,
              custodianQuantity: custodianPos.quantity,
              systemQuantity: currentPos.quantity.toNumber(),
              quantityDifference: quantityDiff.toNumber(),
              custodianMarketValue: custodianPos.marketValue,
              systemMarketValue: currentPos.marketValue?.toNumber() || 0,
              valueDifference: valueDiff.toNumber(),
            });
          } else {
            matches.push({
              symbol,
              quantity: custodianPos.quantity,
              marketValue: custodianPos.marketValue,
            });
          }
        }
      }

      // Check for extra positions in system
      const extra = currentPositions
        .filter(pos => !custodianMap.has(pos.security?.symbol || ''))
        .map(pos => ({
          symbol: pos.security?.symbol || '',
          systemQuantity: pos.quantity.toNumber(),
          systemMarketValue: pos.marketValue?.toNumber() || 0,
          custodianQuantity: 0,
          custodianMarketValue: 0,
        }));

      return { matches, discrepancies, missing, extra };
    } catch (error: any) {
      logger.error('Error reconciling positions:', { portfolioId, error });
      throw error;
    }
  }

  // Calculate position-level P&L
  async calculatePositionPnL(
    positionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    realizedPnL: Prisma.Decimal;
    unrealizedPnL: Prisma.Decimal;
    totalPnL: Prisma.Decimal;
    dividends: Prisma.Decimal;
    fees: Prisma.Decimal;
    transactions: any[];
  }> {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id: positionId },
        include: {
          transactions: {
            where: {
              transactionDate: {
                gte: startDate,
                lte: endDate
              }
            },
            orderBy: { transactionDate: 'desc' }
          }
        }
      });

      if (!position) {
        throw new Error('Position not found');
      }

      let realizedPnL = new Prisma.Decimal(0);
      let dividends = new Prisma.Decimal(0);
      let fees = new Prisma.Decimal(0);

      position.transactions.forEach(transaction => {
        if (transaction.transactionType === 'SELL') {
          // For sells, realized P&L is calculated elsewhere via tax lot matching
          // This is a simplified approach
          const saleProceeds = transaction.netAmount || new Prisma.Decimal(0);
          realizedPnL = realizedPnL.add(saleProceeds);
        } else if (transaction.transactionType === 'DIVIDEND' || transaction.transactionType === 'INTEREST') {
          dividends = dividends.add(transaction.netAmount || new Prisma.Decimal(0));
        }
        
        fees = fees.add(transaction.fees || new Prisma.Decimal(0));
      });

      const unrealizedPnL = position.gainLoss || new Prisma.Decimal(0);
      const totalPnL = realizedPnL.add(unrealizedPnL).add(dividends).sub(fees);

      return {
        realizedPnL,
        unrealizedPnL,
        totalPnL,
        dividends,
        fees,
        transactions: position.transactions
      };
    } catch (error: any) {
      logger.error('Error calculating position P&L:', { positionId, startDate, endDate, error });
      throw error;
    }
  }

  // Update position with latest market data
  async updatePositionMarketValue(positionId: string, marketPrice: Prisma.Decimal): Promise<any> {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id: positionId }
      });

      if (!position) {
        throw new Error('Position not found');
      }

      const newMarketValue = position.quantity.mul(marketPrice);
      const costBasis = position.costBasis?.mul(position.quantity) || new Prisma.Decimal(0);
      const gainLoss = newMarketValue.sub(costBasis);
      const gainLossPercentage = costBasis.gt(0) ? gainLoss.div(costBasis).mul(100) : new Prisma.Decimal(0);

      const previousMarketValue = position.marketValue || new Prisma.Decimal(0);
      const dayChange = newMarketValue.sub(previousMarketValue);
      const dayChangePercentage = previousMarketValue.gt(0) ? dayChange.div(previousMarketValue).mul(100) : new Prisma.Decimal(0);

      const updatedPosition = await this.prisma.position.update({
        where: { id: positionId },
        data: {
          marketValue: newMarketValue,
          gainLoss,
          gainLossPercentage,
          dayChange,
          updatedAt: new Date(),
        }
      });

      logger.info('Position market value updated', {
        positionId,
        marketPrice: marketPrice.toNumber(),
        newMarketValue: newMarketValue.toNumber(),
        gainLoss: gainLoss.toNumber(),
      });

      return updatedPosition;
    } catch (error: any) {
      logger.error('Error updating position market value:', { positionId, marketPrice, error });
      throw error;
    }
  }
}


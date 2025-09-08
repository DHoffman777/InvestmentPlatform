import { PrismaClient, Prisma } from '@prisma/client';
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
export declare class PositionService {
    private prisma;
    constructor(prisma: PrismaClient);
    getAggregatedPositions(tenantId: string, portfolioIds?: string[], assetClasses?: string[]): Promise<PositionAggregation[]>;
    calculateTaxLots(positionId: string, sellQuantity: Prisma.Decimal, method?: TaxLotMethod['method']): Promise<TaxLotMethod[]>;
    reconcilePositions(portfolioId: string, custodianPositions: Array<{
        symbol: string;
        quantity: number;
        marketValue: number;
        costBasis?: number;
    }>): Promise<{
        matches: any[];
        discrepancies: any[];
        missing: any[];
        extra: any[];
    }>;
    calculatePositionPnL(positionId: string, startDate: Date, endDate: Date): Promise<{
        realizedPnL: Prisma.Decimal;
        unrealizedPnL: Prisma.Decimal;
        totalPnL: Prisma.Decimal;
        dividends: Prisma.Decimal;
        fees: Prisma.Decimal;
        transactions: any[];
    }>;
    updatePositionMarketValue(positionId: string, marketPrice: Prisma.Decimal): Promise<any>;
}

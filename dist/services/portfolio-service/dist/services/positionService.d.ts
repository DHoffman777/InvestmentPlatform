export const __esModule: boolean;
export class PositionService {
    constructor(prisma: any);
    prisma: any;
    getAggregatedPositions(tenantId: any, portfolioIds: any, assetClasses: any): Promise<any[]>;
    calculateTaxLots(positionId: any, sellQuantity: any, method?: string): Promise<{
        method: string;
        quantity: any;
        costBasis: any;
    }[]>;
    reconcilePositions(portfolioId: any, custodianPositions: any): Promise<{
        matches: {
            symbol: any;
            quantity: any;
            marketValue: any;
        }[];
        discrepancies: {
            symbol: any;
            custodianQuantity: any;
            systemQuantity: any;
            quantityDifference: number;
            custodianMarketValue: any;
            systemMarketValue: any;
            valueDifference: number;
        }[];
        missing: {
            symbol: any;
            custodianQuantity: any;
            custodianMarketValue: any;
            systemQuantity: number;
            systemMarketValue: number;
        }[];
        extra: any;
    }>;
    calculatePositionPnL(positionId: any, startDate: any, endDate: any): Promise<{
        realizedPnL: import("@prisma/client/runtime/library").Decimal;
        unrealizedPnL: any;
        totalPnL: import("@prisma/client/runtime/library").Decimal;
        dividends: import("@prisma/client/runtime/library").Decimal;
        fees: import("@prisma/client/runtime/library").Decimal;
        transactions: any;
    }>;
    updatePositionMarketValue(positionId: any, marketPrice: any): Promise<any>;
}

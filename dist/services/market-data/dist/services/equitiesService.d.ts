export const __esModule: boolean;
export class EquitiesService {
    constructor(prisma: any);
    prisma: any;
    upsertEquity(equityData: any): Promise<any>;
    getEquityDetails(symbol: any): Promise<any>;
    searchEquities(filters: any): Promise<any>;
    getDividendHistory(symbol: any, limit?: number): Promise<any>;
    calculateDividendMetrics(symbol: any): Promise<{
        dividendYield: number;
        annualDividend: any;
        payoutRatio: number;
        dividendGrowthRate: number;
    }>;
    storeEquityMetadata(securityId: any, metadata: any): Promise<void>;
    getEquityMetadata(securityId: any): Promise<any>;
}

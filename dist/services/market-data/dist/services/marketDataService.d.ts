export const __esModule: boolean;
export class MarketDataService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    getRealtimeQuote(symbol: any): Promise<any>;
    getMultipleQuotes(symbols: any): Promise<any[]>;
    storeQuote(quoteData: any): Promise<any>;
    getHistoricalData(symbol: any, startDate: any, endDate: any, source: any): Promise<any>;
    storeHistoricalData(historicalData: any): Promise<any>;
    upsertSecurity(securityData: any): Promise<any>;
    searchSecurities(query: any, limit?: number): Promise<any>;
    getCorporateActions(symbol: any, startDate: any, endDate: any): Promise<any>;
    storeCorporateAction(corporateActionData: any): Promise<any>;
    isMarketOpen(market?: string): Promise<boolean>;
}

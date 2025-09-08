export const __esModule: boolean;
export class CashService {
    constructor(prisma: any);
    prisma: any;
    upsertCashEquivalent(cashData: any): Promise<any>;
    upsertTreasury(treasuryData: any): Promise<any>;
    searchCashInstruments(filters: any): Promise<any[]>;
    getCashInstrumentDetails(symbol: any): Promise<any>;
    getMoneyMarketRates(): Promise<{
        federalFundsRate: number;
        discountRate: number;
        primeRate: number;
        treasuryRates: {
            '1M': number;
            '3M': number;
            '6M': number;
            '1Y': number;
            '2Y': number;
            '5Y': number;
            '10Y': number;
            '30Y': number;
        };
        libor: {
            overnight: number;
            '1W': number;
            '1M': number;
            '3M': number;
            '6M': number;
            '1Y': number;
        };
        commercialPaper: {
            overnight: number;
            '30D': number;
            '60D': number;
            '90D': number;
        };
        certificatesOfDeposit: {
            '1M': number;
            '3M': number;
            '6M': number;
            '1Y': number;
        };
        asOfDate: Date;
    }>;
    storeCashMetadata(securityId: any, metadata: any): Promise<void>;
    getCashMetadata(securityId: any): Promise<any>;
}

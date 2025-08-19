import { PrismaClient, Security } from '@prisma/client';
import { Decimal } from 'decimal.js';
export interface EquityData {
    symbol: string;
    name: string;
    cusip?: string;
    isin?: string;
    sedol?: string;
    equityType: 'COMMON_STOCK' | 'PREFERRED_STOCK' | 'ADR' | 'GDR';
    exchange: string;
    currency?: string;
    country?: string;
    sector?: string;
    industry?: string;
    marketCap?: Decimal;
    sharesOutstanding?: Decimal;
    dividendYield?: Decimal;
    peRatio?: Decimal;
    pbRatio?: Decimal;
    beta?: Decimal;
    dividendFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'SPECIAL';
    isActive?: boolean;
    listingDate?: Date;
}
export interface PreferredStockData extends EquityData {
    equityType: 'PREFERRED_STOCK';
    dividendRate: Decimal;
    parValue: Decimal;
    callPrice?: Decimal;
    callDate?: Date;
    convertible?: boolean;
    conversionRatio?: Decimal;
    cumulative: boolean;
    perpetual: boolean;
    maturityDate?: Date;
}
export interface ADRData extends EquityData {
    equityType: 'ADR' | 'GDR';
    underlyingSymbol: string;
    underlyingExchange: string;
    underlyingCurrency: string;
    adrRatio: string;
    depositoryBank: string;
    level: 1 | 2 | 3;
    sponsored: boolean;
}
export declare class EquitiesService {
    private prisma;
    constructor(prisma: PrismaClient);
    upsertEquity(equityData: EquityData | PreferredStockData | ADRData): Promise<Security>;
    getEquityDetails(symbol: string): Promise<any>;
    searchEquities(filters: {
        query?: string;
        equityType?: 'COMMON_STOCK' | 'PREFERRED_STOCK' | 'ADR' | 'GDR';
        exchange?: string;
        sector?: string;
        country?: string;
        minMarketCap?: number;
        maxMarketCap?: number;
        limit?: number;
    }): Promise<Security[]>;
    getDividendHistory(symbol: string, limit?: number): Promise<any[]>;
    calculateDividendMetrics(symbol: string): Promise<{
        dividendYield: number | null;
        annualDividend: number | null;
        payoutRatio: number | null;
        dividendGrowthRate: number | null;
    }>;
    private storeEquityMetadata;
    private getEquityMetadata;
}

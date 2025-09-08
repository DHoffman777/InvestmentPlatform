import { PrismaClient, Security, Prisma } from '@prisma/client';
export interface ETFData {
    symbol: string;
    name: string;
    cusip?: string;
    isin?: string;
    fundType: 'ETF';
    exchange: string;
    currency?: string;
    country?: string;
    sector?: string;
    category?: string;
    managementFee: Prisma.Decimal;
    expenseRatio: Prisma.Decimal;
    trackingIndex?: string;
    assetClass: 'EQUITY_ETF' | 'BOND_ETF' | 'COMMODITY_ETF' | 'CURRENCY_ETF' | 'REAL_ESTATE_ETF' | 'MIXED_ETF';
    launchDate: Date;
    totalAssets?: Prisma.Decimal;
    investmentStyle?: string;
    marketCapFocus?: string;
    geographicFocus?: string;
    beta?: Prisma.Decimal;
    standardDeviation?: Prisma.Decimal;
    sharpeRatio?: Prisma.Decimal;
    dividendYield?: Prisma.Decimal;
}
export interface MutualFundData {
    symbol: string;
    name: string;
    cusip?: string;
    isin?: string;
    fundType: 'MUTUAL_FUND';
    shareClass: string;
    currency?: string;
    country?: string;
    managementFee: Prisma.Decimal;
    expenseRatio: Prisma.Decimal;
    frontLoad?: Prisma.Decimal;
    deferredLoad?: Prisma.Decimal;
    purchaseFee?: Prisma.Decimal;
    redemptionFee?: Prisma.Decimal;
    marketingFee?: Prisma.Decimal;
    assetClass: 'EQUITY_FUND' | 'BOND_FUND' | 'MONEY_MARKET_FUND' | 'BALANCED_FUND' | 'ALTERNATIVE_FUND';
    inceptionDate: Date;
    totalAssets?: Prisma.Decimal;
    minimumInvestment?: Prisma.Decimal;
    minimumAdditionalInvestment?: Prisma.Decimal;
    fundFamily?: string;
    fundManager?: string;
    investmentStyle?: string;
    morningstarRating?: number;
    morningstarCategory?: string;
    turnoverRatio?: Prisma.Decimal;
    beta?: Prisma.Decimal;
    standardDeviation?: Prisma.Decimal;
    sharpeRatio?: Prisma.Decimal;
    alphaRatio?: Prisma.Decimal;
    r2?: Prisma.Decimal;
    dividendFrequency?: string;
    capitalGainFrequency?: string;
    dividendYield?: Prisma.Decimal;
}
export interface FundSearchFilters {
    fundType?: 'ETF' | 'MUTUAL_FUND';
    assetClass?: string;
    minAUM?: number;
    maxExpenseRatio?: number;
    fundFamily?: string;
    investmentStyle?: string;
    marketCapFocus?: string;
    geographicFocus?: string;
    minRating?: number;
}
export interface FundPerformanceMetrics {
    returns: {
        oneDay: number;
        oneWeek: number;
        oneMonth: number;
        threeMonths: number;
        sixMonths: number;
        ytd: number;
        oneYear: number;
        threeYears: number;
        fiveYears: number;
        tenYears: number;
        sinceInception: number;
    };
    riskMetrics: {
        standardDeviation: number;
        beta: number;
        sharpeRatio: number;
        sortinoRatio: number;
        informationRatio: number;
        treynorRatio: number;
        maxDrawdown: number;
        upCapture: number;
        downCapture: number;
    };
    benchmarkComparison: {
        benchmarkSymbol: string;
        benchmarkName: string;
        excessReturn: number;
        trackingError: number;
        informationRatio: number;
    };
}
export declare class FundsService {
    private prisma;
    constructor(prisma?: PrismaClient);
    upsertETF(etfData: ETFData): Promise<Security>;
    upsertMutualFund(fundData: MutualFundData): Promise<Security>;
    searchFunds(filters: FundSearchFilters, limit?: number, offset?: number): Promise<any[]>;
    getFundDetails(symbol: string): Promise<any>;
    getFundFamilies(): Promise<{
        name: string;
        count: number;
        totalAUM: number;
    }[]>;
    private storeFundMetadata;
    private getFundMetadata;
    calculateFundPerformance(symbol: string, benchmarkSymbol?: string): Promise<FundPerformanceMetrics>;
}

import { PrismaClient, Security } from '@prisma/client';
import { Prisma } from '@prisma/client';
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
    aum: Prisma.Decimal;
    dividendYield?: Prisma.Decimal;
    distributionFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY';
    fundFamily: string;
    inceptionDate: Date;
    primaryBenchmark?: string;
    averageDailyVolume?: Prisma.Decimal;
    navFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    assetClass: 'EQUITY_ETF' | 'BOND_ETF' | 'COMMODITY_ETF' | 'CURRENCY_ETF' | 'REAL_ESTATE_ETF' | 'MIXED_ETF';
    investmentStyle?: 'GROWTH' | 'VALUE' | 'BLEND';
    marketCapFocus?: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MULTI_CAP';
    geographicFocus?: 'DOMESTIC' | 'INTERNATIONAL' | 'EMERGING_MARKETS' | 'GLOBAL';
    beta?: Prisma.Decimal;
    standardDeviation?: Prisma.Decimal;
    isActive?: boolean;
}
export interface MutualFundData {
    symbol: string;
    name: string;
    cusip?: string;
    isin?: string;
    fundType: 'MUTUAL_FUND';
    currency?: string;
    country?: string;
    sector?: string;
    category?: string;
    managementFee: Prisma.Decimal;
    expenseRatio: Prisma.Decimal;
    frontLoadFee?: Prisma.Decimal;
    backLoadFee?: Prisma.Decimal;
    redemptionFee?: Prisma.Decimal;
    aum: Prisma.Decimal;
    dividendYield?: Prisma.Decimal;
    distributionFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY';
    fundFamily: string;
    inceptionDate: Date;
    primaryBenchmark?: string;
    fundManager?: string;
    shareClass: 'A' | 'B' | 'C' | 'I' | 'R' | 'T' | 'Y';
    minimumInvestment: Prisma.Decimal;
    minimumSubsequent?: Prisma.Decimal;
    navFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    cutoffTime: string;
    settlementDays: number;
    assetClass: 'EQUITY_FUND' | 'BOND_FUND' | 'MONEY_MARKET_FUND' | 'BALANCED_FUND' | 'ALTERNATIVE_FUND';
    investmentStyle?: 'GROWTH' | 'VALUE' | 'BLEND';
    marketCapFocus?: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MULTI_CAP';
    geographicFocus?: 'DOMESTIC' | 'INTERNATIONAL' | 'EMERGING_MARKETS' | 'GLOBAL';
    beta?: Prisma.Decimal;
    standardDeviation?: Prisma.Decimal;
    morningstarRating?: 1 | 2 | 3 | 4 | 5;
    isActive?: boolean;
    isClosedToNewInvestors?: boolean;
}
export interface FundHolding {
    fundId: string;
    holdingName: string;
    ticker?: string;
    cusip?: string;
    isin?: string;
    weight: Prisma.Decimal;
    shares?: Prisma.Decimal;
    marketValue: Prisma.Decimal;
    sector?: string;
    country?: string;
    asOfDate: Date;
}
export interface FundPerformance {
    fundId: string;
    period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y' | 'YTD' | 'INCEPTION';
    totalReturn: Prisma.Decimal;
    annualizedReturn?: Prisma.Decimal;
    benchmark?: string;
    benchmarkReturn?: Prisma.Decimal;
    alpha?: Prisma.Decimal;
    beta?: Prisma.Decimal;
    sharpeRatio?: Prisma.Decimal;
    volatility?: Prisma.Decimal;
    maxDrawdown?: Prisma.Decimal;
    asOfDate: Date;
}
export declare class FundsService {
    private prisma;
    constructor(prisma: PrismaClient);
    upsertETF(etfData: ETFData): Promise<Security>;
    upsertMutualFund(fundData: MutualFundData): Promise<Security>;
    searchFunds(filters: {
        query?: string;
        fundType?: 'ETF' | 'MUTUAL_FUND';
        assetClass?: string;
        investmentStyle?: 'GROWTH' | 'VALUE' | 'BLEND';
        marketCapFocus?: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MULTI_CAP';
        geographicFocus?: 'DOMESTIC' | 'INTERNATIONAL' | 'EMERGING_MARKETS' | 'GLOBAL';
        fundFamily?: string;
        minAUM?: number;
        maxExpenseRatio?: number;
        minMorningstarRating?: number;
        limit?: number;
    }): Promise<any[]>;
    getFundDetails(symbol: string): Promise<any>;
    getFundFamilies(): Promise<{
        name: string;
        count: number;
        totalAUM: number;
    }[]>;
    private storeFundMetadata;
    private getFundMetadata;
}
//# sourceMappingURL=fundsService.d.ts.map
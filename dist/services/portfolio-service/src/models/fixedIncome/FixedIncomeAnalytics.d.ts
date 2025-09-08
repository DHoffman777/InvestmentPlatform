export declare enum BondType {
    GOVERNMENT = "GOVERNMENT",
    CORPORATE = "CORPORATE",
    MUNICIPAL = "MUNICIPAL",
    TREASURY = "TREASURY",
    AGENCY = "AGENCY",
    SUPRANATIONAL = "SUPRANATIONAL",
    MORTGAGE_BACKED = "MORTGAGE_BACKED",
    ASSET_BACKED = "ASSET_BACKED",
    CONVERTIBLE = "CONVERTIBLE",
    FLOATING_RATE = "FLOATING_RATE",
    ZERO_COUPON = "ZERO_COUPON"
}
export declare enum CreditRating {
    AAA = "AAA",
    AA_PLUS = "AA+",
    AA = "AA",
    AA_MINUS = "AA-",
    A_PLUS = "A+",
    A = "A",
    A_MINUS = "A-",
    BBB_PLUS = "BBB+",
    BBB = "BBB",
    BBB_MINUS = "BBB-",
    BB_PLUS = "BB+",
    BB = "BB",
    BB_MINUS = "BB-",
    B_PLUS = "B+",
    B = "B",
    B_MINUS = "B-",
    CCC_PLUS = "CCC+",
    CCC = "CCC",
    CCC_MINUS = "CCC-",
    CC = "CC",
    C = "C",
    D = "D",
    NR = "NR"
}
export declare enum YieldType {
    YIELD_TO_MATURITY = "YIELD_TO_MATURITY",
    YIELD_TO_WORST = "YIELD_TO_WORST",
    YIELD_TO_CALL = "YIELD_TO_CALL",
    YIELD_TO_PUT = "YIELD_TO_PUT",
    CURRENT_YIELD = "CURRENT_YIELD",
    RUNNING_YIELD = "RUNNING_YIELD",
    DISCOUNT_YIELD = "DISCOUNT_YIELD",
    TAX_EQUIVALENT_YIELD = "TAX_EQUIVALENT_YIELD",
    AFTER_TAX_YIELD = "AFTER_TAX_YIELD",
    OPTION_ADJUSTED_YIELD = "OPTION_ADJUSTED_YIELD"
}
export declare enum DurationType {
    MODIFIED_DURATION = "MODIFIED_DURATION",
    MACAULAY_DURATION = "MACAULAY_DURATION",
    EFFECTIVE_DURATION = "EFFECTIVE_DURATION",
    KEY_RATE_DURATION = "KEY_RATE_DURATION",
    OPTION_ADJUSTED_DURATION = "OPTION_ADJUSTED_DURATION",
    DOLLAR_DURATION = "DOLLAR_DURATION"
}
export declare enum CallType {
    CALL = "CALL",
    PUT = "PUT",
    SINK = "SINK",
    MAKE_WHOLE = "MAKE_WHOLE"
}
export declare enum PaymentFrequency {
    ANNUAL = "ANNUAL",
    SEMI_ANNUAL = "SEMI_ANNUAL",
    QUARTERLY = "QUARTERLY",
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
    DAILY = "DAILY",
    ZERO_COUPON = "ZERO_COUPON",
    IRREGULAR = "IRREGULAR"
}
export declare enum DayCountConvention {
    THIRTY_360 = "30/360",
    THIRTY_360_ISDA = "30/360 ISDA",
    THIRTY_E_360 = "30E/360",
    ACT_360 = "ACT/360",
    ACT_365 = "ACT/365",
    ACT_ACT = "ACT/ACT",
    ACT_ACT_ISDA = "ACT/ACT ISDA",
    BUS_252 = "BUS/252"
}
export interface FixedIncomeSecurityAnalytics {
    id: string;
    tenantId: string;
    securityId: string;
    cusip?: string;
    isin?: string;
    symbol?: string;
    issuerName: string;
    bondType: BondType;
    securityDescription: string;
    currency: string;
    country: string;
    sector?: string;
    industry?: string;
    issueDate: Date;
    maturityDate: Date;
    originalMaturity: number;
    remainingMaturity: number;
    faceValue: number;
    couponRate: number;
    paymentFrequency: PaymentFrequency;
    dayCountConvention: DayCountConvention;
    creditRatingMoody?: CreditRating;
    creditRatingSP?: CreditRating;
    creditRatingFitch?: CreditRating;
    seniority?: string;
    securityType?: string;
    isCallable: boolean;
    isPutable: boolean;
    callSchedule?: CallProvision[];
    putSchedule?: PutProvision[];
    currentPrice: number;
    priceDate: Date;
    accruedInterest: number;
    cleanPrice: number;
    dirtyPrice: number;
    spreadToTreasury?: number;
    spreadToBenchmark?: number;
    yieldAnalytics: YieldAnalytics;
    durationAnalytics: DurationAnalytics;
    convexityAnalytics: ConvexityAnalytics;
    creditAnalytics?: CreditAnalytics;
    optionAnalytics?: OptionAnalytics;
    lastAnalyzed: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface CallProvision {
    callDate: Date;
    callPrice: number;
    callType: CallType;
    noticeDays: number;
    isActive: boolean;
}
export interface PutProvision {
    putDate: Date;
    putPrice: number;
    noticeDays: number;
    isActive: boolean;
}
export interface YieldAnalytics {
    yieldToMaturity: number;
    yieldToWorst: number;
    yieldToCall?: number;
    yieldToPut?: number;
    currentYield: number;
    runningYield: number;
    discountYield?: number;
    taxEquivalentYield?: number;
    afterTaxYield?: number;
    optionAdjustedYield?: number;
    benchmarkYield?: number;
    yieldSpread?: number;
    zSpread?: number;
    optionAdjustedSpread?: number;
    assetSwapSpread?: number;
    municipalTaxRate?: number;
    federalTaxRate?: number;
    stateTaxRate?: number;
    calculationDate: Date;
    calculationMethod: string;
}
export interface DurationAnalytics {
    modifiedDuration: number;
    macaulayDuration: number;
    effectiveDuration?: number;
    optionAdjustedDuration?: number;
    dollarDuration: number;
    keyRateDurations?: KeyRateDuration[];
    dv01: number;
    pv01: number;
    calculationDate: Date;
    yieldShock: number;
}
export interface KeyRateDuration {
    maturity: string;
    duration: number;
}
export interface ConvexityAnalytics {
    convexity: number;
    effectiveConvexity?: number;
    optionAdjustedConvexity?: number;
    dollarConvexity: number;
    gamma: number;
    calculationDate: Date;
    yieldShock: number;
}
export interface CreditAnalytics {
    creditSpread: number;
    defaultProbability: number;
    recoveryRate: number;
    creditVaR: number;
    expectedLoss: number;
    unexpectedLoss: number;
    hazardRate: number;
    survivalProbability: number;
    ratingTransitionProbability?: RatingTransition[];
    calculationDate: Date;
    horizonDays: number;
    confidenceLevel: number;
}
export interface RatingTransition {
    fromRating: CreditRating;
    toRating: CreditRating;
    probability: number;
    timeHorizon: number;
}
export interface OptionAnalytics {
    optionValue: number;
    optionAdjustedPrice: number;
    impliedVolatility?: number;
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    rho?: number;
    callValue?: number;
    putValue?: number;
    calculationDate: Date;
    modelUsed: string;
}
export interface MortgageBackedAnalytics {
    weightedAverageMaturity: number;
    weightedAverageCoupon: number;
    weightedAverageLife: number;
    prepaymentSpeed: number;
    psa: number;
    principalPaydown: number;
    interestPayment: number;
    prepaymentAmount: number;
    optionAdjustedSpread: number;
    optionAdjustedDuration: number;
    optionAdjustedConvexity: number;
    calculationDate: Date;
}
export interface AssetBackedAnalytics {
    underlyingAssetType: string;
    collateralFactor: number;
    enhancementLevel: number;
    averageLife: number;
    subordination: number;
    excessSpread: number;
    reserveFund: number;
    expectedLossRate: number;
    worstCaseLossRate: number;
    breakEvenDefaultRate: number;
    calculationDate: Date;
}
export interface YieldCalculationRequest {
    securityId: string;
    price: number;
    settlementDate: Date;
    yieldTypes: YieldType[];
    taxRate?: number;
}
export interface YieldCalculationResult {
    securityId: string;
    calculationDate: Date;
    yields: {
        [key in YieldType]?: number;
    };
    warnings: string[];
    calculationTime: number;
}
export interface DurationConvexityRequest {
    securityId: string;
    price: number;
    yield: number;
    settlementDate: Date;
    yieldShock?: number;
    durationType: DurationType[];
}
export interface DurationConvexityResult {
    securityId: string;
    calculationDate: Date;
    durationMetrics: DurationAnalytics;
    convexityMetrics: ConvexityAnalytics;
    warnings: string[];
    calculationTime: number;
}
export interface CreditAnalysisRequest {
    securityId: string;
    horizonDays: number;
    confidenceLevel: number;
    recoveryRate?: number;
    includeRatingMigration?: boolean;
}
export interface CreditAnalysisResult {
    securityId: string;
    calculationDate: Date;
    creditMetrics: CreditAnalytics;
    warnings: string[];
    calculationTime: number;
}
export interface FixedIncomePortfolioAnalytics {
    portfolioId: string;
    tenantId: string;
    analysisDate: Date;
    portfolioYield: number;
    portfolioDuration: number;
    portfolioConvexity: number;
    portfolioSpread: number;
    interestRateVaR: number;
    creditVaR: number;
    totalVaR: number;
    sectorAllocation: SectorAllocation[];
    ratingAllocation: RatingAllocation[];
    maturityDistribution: MaturityBucket[];
    expectedCashFlows: CashFlowProjection[];
    stressTestResults: StressTestResult[];
    createdAt: Date;
    calculationTime: number;
}
export interface SectorAllocation {
    sector: string;
    marketValue: number;
    percentage: number;
    averageYield: number;
    averageDuration: number;
    averageRating: string;
}
export interface RatingAllocation {
    rating: CreditRating;
    marketValue: number;
    percentage: number;
    averageYield: number;
    averageDuration: number;
}
export interface MaturityBucket {
    bucketName: string;
    marketValue: number;
    percentage: number;
    averageYield: number;
    averageDuration: number;
}
export interface CashFlowProjection {
    paymentDate: Date;
    principalPayment: number;
    interestPayment: number;
    totalPayment: number;
    cumulativePrincipal: number;
    remainingBalance: number;
}
export interface StressTestResult {
    scenario: string;
    yieldShock: number;
    priceImpact: number;
    percentageImpact: number;
    durationContribution: number;
    convexityContribution: number;
}
export interface FixedIncomeSearchRequest {
    tenantId: string;
    bondTypes?: BondType[];
    creditRatings?: CreditRating[];
    maturityRange?: {
        min: Date;
        max: Date;
    };
    yieldRange?: {
        min: number;
        max: number;
    };
    durationRange?: {
        min: number;
        max: number;
    };
    sectors?: string[];
    issuers?: string[];
    currencies?: string[];
    isCallable?: boolean;
    isPutable?: boolean;
    limit?: number;
    offset?: number;
}
export interface FixedIncomeSearchResult {
    securities: FixedIncomeSecurityAnalytics[];
    total: number;
    aggregateAnalytics: {
        averageYield: number;
        averageDuration: number;
        averageConvexity: number;
        totalMarketValue: number;
    };
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

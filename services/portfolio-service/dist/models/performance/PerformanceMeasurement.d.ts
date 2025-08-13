export interface PerformancePeriod {
    id: string;
    tenantId: string;
    portfolioId: string;
    periodStart: Date;
    periodEnd: Date;
    periodType: PeriodType;
    timeWeightedReturn: number;
    moneyWeightedReturn: number;
    simpleReturn: number;
    logarithmicReturn: number;
    grossReturn: number;
    netReturn: number;
    managementFees: number;
    performanceFees: number;
    otherFees: number;
    preTaxReturn: number;
    afterTaxReturn: number;
    taxDrag: number;
    beginningValue: number;
    endingValue: number;
    averageValue: number;
    highWaterMark: number;
    totalCashFlows: number;
    netCashFlows: number;
    contributions: number;
    withdrawals: number;
    volatility: number;
    standardDeviation: number;
    downside_deviation: number;
    maxDrawdown: number;
    maxDrawdownDuration: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    informationRatio: number;
    treynorRatio: number;
    jensenAlpha: number;
    beta: number;
    benchmarkReturn: number;
    excessReturn: number;
    activeReturn: number;
    trackingError: number;
    securitySelection: number;
    assetAllocation: number;
    interactionEffect: number;
    totalAttribution: number;
    localCurrencyReturn: number;
    currencyReturn: number;
    totalReturn: number;
    dataQualityScore: number;
    calculationMethod: CalculationMethod;
    calculationDate: Date;
    isRebalancingPeriod: boolean;
    hasSignificantCashFlows: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    notes?: string;
}
export interface PerformanceAttribution {
    id: string;
    tenantId: string;
    performancePeriodId: string;
    portfolioId: string;
    attributionType: AttributionType;
    attributionLevel: AttributionLevel;
    sectors: SectorAttribution[];
    assetClasses: AssetClassAttribution[];
    securities: SecurityAttribution[];
    factors: FactorAttribution[];
    totalPortfolioReturn: number;
    benchmarkReturn: number;
    excessReturn: number;
    allocationEffect: number;
    selectionEffect: number;
    interactionEffect: number;
    currencyEffect: number;
    totalRisk: number;
    activeRisk: number;
    riskAttribution: RiskAttribution[];
    attributionPeriodStart: Date;
    attributionPeriodEnd: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface SectorAttribution {
    sectorId: string;
    sectorName: string;
    portfolioWeight: number;
    benchmarkWeight: number;
    activeWeight: number;
    portfolioReturn: number;
    benchmarkReturn: number;
    excessReturn: number;
    allocationEffect: number;
    selectionEffect: number;
    interactionEffect: number;
    totalContribution: number;
}
export interface AssetClassAttribution {
    assetClassId: string;
    assetClassName: string;
    portfolioWeight: number;
    benchmarkWeight: number;
    portfolioReturn: number;
    benchmarkReturn: number;
    allocationEffect: number;
    selectionEffect: number;
    totalContribution: number;
}
export interface SecurityAttribution {
    instrumentId: string;
    instrumentName: string;
    averageWeight: number;
    beginningWeight: number;
    endingWeight: number;
    securityReturn: number;
    contribution: number;
    specificReturn: number;
    systematicReturn: number;
}
export interface FactorAttribution {
    factorId: string;
    factorName: string;
    factorType: FactorType;
    portfolioExposure: number;
    benchmarkExposure: number;
    activeExposure: number;
    factorReturn: number;
    contribution: number;
    riskContribution: number;
}
export interface RiskAttribution {
    riskFactorId: string;
    riskFactorName: string;
    riskFactorType: RiskFactorType;
    riskContribution: number;
    marginalRisk: number;
    componentRisk: number;
    percentageContribution: number;
}
export interface BenchmarkComparison {
    id: string;
    tenantId: string;
    portfolioId: string;
    benchmarkId: string;
    comparisonPeriodStart: Date;
    comparisonPeriodEnd: Date;
    periodType: PeriodType;
    portfolioReturn: number;
    benchmarkReturn: number;
    excessReturn: number;
    portfolioVolatility: number;
    benchmarkVolatility: number;
    trackingError: number;
    portfolioSharpeRatio: number;
    benchmarkSharpeRatio: number;
    informationRatio: number;
    correlation: number;
    beta: number;
    alpha: number;
    rSquared: number;
    percentileRank: number;
    quartileRank: number;
    upCaptureRatio: number;
    downCaptureRatio: number;
    hitRate: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface PerformanceComposite {
    id: string;
    tenantId: string;
    compositeName: string;
    compositeDescription: string;
    isGipsCompliant: boolean;
    gipsVersion: string;
    compositeDefinition: string;
    inclusionCriteria: string;
    portfolioIds: string[];
    totalAssets: number;
    numberOfPortfolios: number;
    performancePeriods: CompositePerformancePeriod[];
    threeYearVolatility: number;
    dispersion: number;
    benchmarkId: string;
    benchmarkName: string;
    creationDate: Date;
    lastReviewDate: Date;
    nextReviewDate: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface CompositePerformancePeriod {
    id: string;
    compositeId: string;
    periodStart: Date;
    periodEnd: Date;
    grossReturn: number;
    netReturn: number;
    benchmarkReturn: number;
    volatility: number;
    dispersion: number;
    totalAssets: number;
    numberOfPortfolios: number;
    feesDeducted: number;
    isActualFees: boolean;
}
export interface PerformanceCalculationEngine {
    id: string;
    tenantId: string;
    calculationMethod: CalculationMethod;
    returnCalculationBasis: ReturnCalculationBasis;
    feeCalculationMethod: FeeCalculationMethod;
    valuationFrequency: ValuationFrequency;
    calculationFrequency: CalculationFrequency;
    cashFlowTiming: CashFlowTiming;
    significantCashFlowThreshold: number;
    attributionMethod: AttributionMethod;
    factorModel: FactorModel;
    riskFreeRate: number;
    confidenceLevel: number;
    defaultBenchmarkId: string;
    benchmarkRebalancingFrequency: RebalancingFrequency;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export declare enum PeriodType {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    SEMI_ANNUAL = "SEMI_ANNUAL",
    ANNUAL = "ANNUAL",
    INCEPTION_TO_DATE = "INCEPTION_TO_DATE",
    YEAR_TO_DATE = "YEAR_TO_DATE",
    CUSTOM = "CUSTOM"
}
export declare enum CalculationMethod {
    TIME_WEIGHTED = "TIME_WEIGHTED",
    MONEY_WEIGHTED = "MONEY_WEIGHTED",
    SIMPLE = "SIMPLE",
    LOGARITHMIC = "LOGARITHMIC",
    MODIFIED_DIETZ = "MODIFIED_DIETZ",
    TRUE_TIME_WEIGHTED = "TRUE_TIME_WEIGHTED"
}
export declare enum AttributionType {
    BRINSON_HOOD_BEEBOWER = "BRINSON_HOOD_BEEBOWER",
    BRINSON_FACHLER = "BRINSON_FACHLER",
    GEOMETRIC = "GEOMETRIC",
    ARITHMETIC = "ARITHMETIC",
    FACTOR_BASED = "FACTOR_BASED"
}
export declare enum AttributionLevel {
    ASSET_CLASS = "ASSET_CLASS",
    SECTOR = "SECTOR",
    SECURITY = "SECURITY",
    FACTOR = "FACTOR",
    CURRENCY = "CURRENCY"
}
export declare enum FactorType {
    FUNDAMENTAL = "FUNDAMENTAL",
    MACROECONOMIC = "MACROECONOMIC",
    STATISTICAL = "STATISTICAL",
    RISK = "RISK",
    STYLE = "STYLE"
}
export declare enum RiskFactorType {
    MARKET = "MARKET",
    SECTOR = "SECTOR",
    STYLE = "STYLE",
    CURRENCY = "CURRENCY",
    SPECIFIC = "SPECIFIC"
}
export declare enum ReturnCalculationBasis {
    TRADE_DATE = "TRADE_DATE",
    SETTLEMENT_DATE = "SETTLEMENT_DATE",
    BOOK_DATE = "BOOK_DATE"
}
export declare enum FeeCalculationMethod {
    ACTUAL = "ACTUAL",
    MODEL = "MODEL",
    HIGHEST_FEE = "HIGHEST_FEE",
    COMPOSITE_FEE = "COMPOSITE_FEE"
}
export declare enum ValuationFrequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY"
}
export declare enum CalculationFrequency {
    REAL_TIME = "REAL_TIME",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY"
}
export declare enum CashFlowTiming {
    BEGINNING_OF_DAY = "BEGINNING_OF_DAY",
    END_OF_DAY = "END_OF_DAY",
    ACTUAL_TIME = "ACTUAL_TIME",
    MODIFIED_DIETZ = "MODIFIED_DIETZ"
}
export declare enum AttributionMethod {
    BRINSON = "BRINSON",
    GEOMETRIC = "GEOMETRIC",
    FACTOR_BASED = "FACTOR_BASED"
}
export declare enum FactorModel {
    FAMA_FRENCH_3_FACTOR = "FAMA_FRENCH_3_FACTOR",
    FAMA_FRENCH_5_FACTOR = "FAMA_FRENCH_5_FACTOR",
    CARHART_4_FACTOR = "CARHART_4_FACTOR",
    CUSTOM = "CUSTOM"
}
export declare enum RebalancingFrequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    ANNUALLY = "ANNUALLY"
}
export interface CalculatePerformanceRequest {
    portfolioId: string;
    periodStart: Date;
    periodEnd: Date;
    periodType: PeriodType;
    calculationMethod: CalculationMethod;
    includeAttribution?: boolean;
    benchmarkId?: string;
    cashFlowTiming?: CashFlowTiming;
}
export interface PerformanceCalculationResult {
    performancePeriod: PerformancePeriod;
    attribution?: PerformanceAttribution;
    benchmarkComparison?: BenchmarkComparison;
    warnings: string[];
    calculationTime: number;
}
export interface PerformanceSearchRequest {
    portfolioIds?: string[];
    periodTypes?: PeriodType[];
    fromDate?: Date;
    toDate?: Date;
    benchmarkIds?: string[];
    minReturn?: number;
    maxReturn?: number;
    minSharpeRatio?: number;
    limit?: number;
    offset?: number;
}
export interface PerformanceSearchResult {
    performancePeriods: PerformancePeriod[];
    total: number;
    hasMore: boolean;
    searchCriteria: PerformanceSearchRequest;
}
export interface PerformanceSummary {
    portfolioId: string;
    portfolioName: string;
    latestReturn: number;
    latestPeriodEnd: Date;
    monthToDateReturn: number;
    quarterToDateReturn: number;
    yearToDateReturn: number;
    oneYearReturn: number;
    threeYearReturn: number;
    fiveYearReturn: number;
    sinceInceptionReturn: number;
    volatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
    benchmarkName: string;
    excessReturn: number;
    trackingError: number;
    informationRatio: number;
    currentValue: number;
    highWaterMark: number;
    lastCalculated: Date;
}

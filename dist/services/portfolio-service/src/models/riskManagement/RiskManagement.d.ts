export declare enum RiskType {
    MARKET_RISK = "MARKET_RISK",
    CREDIT_RISK = "CREDIT_RISK",
    LIQUIDITY_RISK = "LIQUIDITY_RISK",
    OPERATIONAL_RISK = "OPERATIONAL_RISK",
    CONCENTRATION_RISK = "CONCENTRATION_RISK",
    COUNTERPARTY_RISK = "COUNTERPARTY_RISK",
    CURRENCY_RISK = "CURRENCY_RISK",
    INTEREST_RATE_RISK = "INTEREST_RATE_RISK",
    MODEL_RISK = "MODEL_RISK",
    REGULATORY_RISK = "REGULATORY_RISK"
}
export declare enum RiskMeasurementMethod {
    VALUE_AT_RISK = "VALUE_AT_RISK",
    CONDITIONAL_VAR = "CONDITIONAL_VAR",
    EXPECTED_SHORTFALL = "EXPECTED_SHORTFALL",
    MONTE_CARLO = "MONTE_CARLO",
    HISTORICAL_SIMULATION = "HISTORICAL_SIMULATION",
    PARAMETRIC = "PARAMETRIC",
    STRESS_TEST = "STRESS_TEST",
    SCENARIO_ANALYSIS = "SCENARIO_ANALYSIS"
}
export declare enum ConfidenceLevel {
    NINETY_FIVE = 95,
    NINETY_NINE = 99,
    NINETY_NINE_NINE = 99.9
}
export declare enum TimeHorizon {
    ONE_DAY = "1D",
    ONE_WEEK = "1W",
    TWO_WEEKS = "2W",
    ONE_MONTH = "1M",
    THREE_MONTHS = "3M",
    SIX_MONTHS = "6M",
    ONE_YEAR = "1Y"
}
export declare enum RiskLimitType {
    ABSOLUTE_LIMIT = "ABSOLUTE_LIMIT",
    PERCENTAGE_LIMIT = "PERCENTAGE_LIMIT",
    VAR_LIMIT = "VAR_LIMIT",
    NOTIONAL_LIMIT = "NOTIONAL_LIMIT",
    CONCENTRATION_LIMIT = "CONCENTRATION_LIMIT",
    LEVERAGE_LIMIT = "LEVERAGE_LIMIT"
}
export declare enum AlertSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum LiquidityCategory {
    IMMEDIATE = "IMMEDIATE",// < 1 day
    HIGH = "HIGH",// 1-7 days
    MEDIUM = "MEDIUM",// 1-4 weeks
    LOW = "LOW",// 1-3 months
    ILLIQUID = "ILLIQUID"
}
export interface VaRCalculationRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    confidenceLevel: ConfidenceLevel;
    timeHorizon: TimeHorizon;
    method: RiskMeasurementMethod;
    includeStressTests?: boolean;
    excludePositions?: string[];
    customScenarios?: ScenarioDefinition[];
}
export interface VaRResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    confidenceLevel: ConfidenceLevel;
    timeHorizon: TimeHorizon;
    method: RiskMeasurementMethod;
    totalVaR: number;
    diversifiedVaR: number;
    undiversifiedVaR: number;
    diversificationBenefit: number;
    componentVaR: ComponentVaR[];
    marginalVaR: MarginalVaR[];
    incrementalVaR: IncrementalVaR[];
    backtestingResults?: BacktestingResult;
    modelAccuracy: number;
    calculationTime: number;
    dataQuality: DataQuality;
    assumptions: ModelAssumptions;
    createdAt: Date;
    calculatedBy: string;
}
export interface ComponentVaR {
    assetId?: string;
    assetClass?: string;
    sector?: string;
    geography?: string;
    currency?: string;
    componentType: string;
    componentName: string;
    var: number;
    percentOfTotal: number;
    correlation: number;
}
export interface MarginalVaR {
    positionId: string;
    instrumentId: string;
    symbol: string;
    marginalVaR: number;
    contribution: number;
    percentContribution: number;
}
export interface IncrementalVaR {
    positionId: string;
    instrumentId: string;
    symbol: string;
    incrementalVaR: number;
    portfolioVaRWithout: number;
    portfolioVaRWith: number;
}
export interface StressTestRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    stressScenarios: StressScenario[];
    includeHistoricalScenarios?: boolean;
    customFactorShocks?: FactorShock[];
}
export interface StressTestResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    scenarioResults: ScenarioResult[];
    worstCaseScenario: ScenarioResult;
    bestCaseScenario: ScenarioResult;
    averageImpact: number;
    stressedVaR: number;
    stressedVolatility: number;
    maxDrawdown: number;
    factorSensitivities: FactorSensitivity[];
    createdAt: Date;
    calculatedBy: string;
}
export interface StressScenario {
    id: string;
    name: string;
    description: string;
    scenarioType: 'HISTORICAL' | 'HYPOTHETICAL' | 'MONTE_CARLO';
    probability?: number;
    factorShocks: FactorShock[];
    historicalPeriod?: {
        startDate: Date;
        endDate: Date;
        eventName: string;
    };
}
export interface ScenarioResult {
    scenarioId: string;
    scenarioName: string;
    portfolioValue: number;
    portfolioChange: number;
    portfolioChangePercent: number;
    positionImpacts: PositionImpact[];
    varUnderScenario: number;
    volatilityUnderScenario: number;
    correlationChanges: CorrelationChange[];
}
export interface FactorShock {
    factorName: string;
    factorType: 'EQUITY_INDEX' | 'INTEREST_RATE' | 'CREDIT_SPREAD' | 'CURRENCY' | 'COMMODITY' | 'VOLATILITY';
    shockType: 'ABSOLUTE' | 'RELATIVE';
    shockValue: number;
    currency?: string;
    maturity?: string;
    region?: string;
}
export interface PositionImpact {
    positionId: string;
    instrumentId: string;
    symbol: string;
    currentValue: number;
    stressedValue: number;
    absoluteChange: number;
    percentChange: number;
    contributionToPortfolioChange: number;
}
export interface MonteCarloRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    numberOfSimulations: number;
    timeHorizon: TimeHorizon;
    confidenceLevel: ConfidenceLevel;
    useHistoricalCorrelations: boolean;
    correlationLookbackPeriod?: number;
    volatilityModel: 'HISTORICAL' | 'GARCH' | 'EWMA';
    includeJumpRisk?: boolean;
    includeFatTails?: boolean;
    randomSeed?: number;
}
export interface MonteCarloResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    numberOfSimulations: number;
    timeHorizon: TimeHorizon;
    expectedReturn: number;
    standardDeviation: number;
    skewness: number;
    kurtosis: number;
    var95: number;
    var99: number;
    cvar95: number;
    cvar99: number;
    expectedShortfall: number;
    percentiles: PercentileResult[];
    maxDrawdown: number;
    timeToRecovery: number;
    probabilityOfLoss: number;
    convergenceTest: ConvergenceTest;
    createdAt: Date;
    calculatedBy: string;
}
export interface PercentileResult {
    percentile: number;
    value: number;
}
export interface ConvergenceTest {
    hasConverged: boolean;
    convergenceThreshold: number;
    standardError: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
}
export interface CorrelationAnalysisRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    lookbackPeriod: number;
    includeAssetClasses?: boolean;
    includeSectors?: boolean;
    includeGeographies?: boolean;
    includeCurrencies?: boolean;
}
export interface CorrelationAnalysisResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    lookbackPeriod: number;
    positionCorrelations: CorrelationMatrix;
    assetClassCorrelations?: CorrelationMatrix;
    sectorCorrelations?: CorrelationMatrix;
    geographyCorrelations?: CorrelationMatrix;
    concentrationMetrics: ConcentrationMetrics;
    diversificationRatio: number;
    effectiveNumberOfBets: number;
    riskContributions: RiskContribution[];
    createdAt: Date;
    calculatedBy: string;
}
export interface CorrelationMatrix {
    assets: string[];
    matrix: number[][];
    eigenvalues: number[];
    principalComponents: PrincipalComponent[];
}
export interface PrincipalComponent {
    componentNumber: number;
    eigenvalue: number;
    varianceExplained: number;
    cumulativeVarianceExplained: number;
    loadings: ComponentLoading[];
}
export interface ComponentLoading {
    assetId: string;
    loading: number;
}
export interface ConcentrationMetrics {
    herfindahlIndex: number;
    top5Concentration: number;
    top10Concentration: number;
    effectiveNumberOfPositions: number;
    assetClassConcentration: CategoryConcentration[];
    sectorConcentration: CategoryConcentration[];
    geographyConcentration: CategoryConcentration[];
    currencyConcentration: CategoryConcentration[];
}
export interface CategoryConcentration {
    category: string;
    percentage: number;
    rank: number;
}
export interface LiquidityRiskRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    liquidationTimeframe: TimeHorizon;
    marketImpactModel: 'LINEAR' | 'SQUARE_ROOT' | 'POWER_LAW';
}
export interface LiquidityRiskResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    liquidationTimeframe: TimeHorizon;
    liquidityScore: number;
    averageDaysToLiquidate: number;
    liquidationCost: number;
    marketImpact: number;
    liquidityByAssetClass: LiquidityBreakdown[];
    liquidityBySector: LiquidityBreakdown[];
    liquidityBySize: LiquidityBreakdown[];
    positionLiquidity: PositionLiquidity[];
    liquidityUnderStress: LiquidityStressResult[];
    createdAt: Date;
    calculatedBy: string;
}
export interface LiquidityBreakdown {
    category: string;
    percentage: number;
    liquidityCategory: LiquidityCategory;
    averageDaysToLiquidate: number;
    estimatedCost: number;
}
export interface PositionLiquidity {
    positionId: string;
    instrumentId: string;
    symbol: string;
    marketValue: number;
    liquidityCategory: LiquidityCategory;
    daysToLiquidate: number;
    liquidationCost: number;
    marketImpact: number;
    averageDailyVolume: number;
    bidAskSpread: number;
    marketCapitalization?: number;
    floatPercentage?: number;
}
export interface LiquidityStressResult {
    stressScenario: string;
    liquidityScore: number;
    averageDaysToLiquidate: number;
    totalLiquidationCost: number;
    marketImpact: number;
}
export interface CreditRiskRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    includeImpliedRatings?: boolean;
    includeSovereignRisk?: boolean;
}
export interface CreditRiskResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    averageRating: string;
    averageRatingNumeric: number;
    creditScore: number;
    probabilityOfDefault: number;
    expectedLoss: number;
    unexpectedLoss: number;
    ratingDistribution: RatingDistribution[];
    issuerConcentration: IssuerConcentration[];
    sectorConcentration: CategoryConcentration[];
    geographyConcentration: CategoryConcentration[];
    creditVaR: number;
    migrationRisk: number;
    defaultRisk: number;
    positionCreditRisk: PositionCreditRisk[];
    createdAt: Date;
    calculatedBy: string;
}
export interface RatingDistribution {
    rating: string;
    ratingNumeric: number;
    percentage: number;
    marketValue: number;
    numberOfIssuers: number;
}
export interface IssuerConcentration {
    issuerId: string;
    issuerName: string;
    rating: string;
    exposure: number;
    percentage: number;
    probabilityOfDefault: number;
}
export interface PositionCreditRisk {
    positionId: string;
    instrumentId: string;
    issuerName: string;
    rating: string;
    ratingNumeric: number;
    marketValue: number;
    probabilityOfDefault: number;
    lossGivenDefault: number;
    expectedLoss: number;
    creditSpread: number;
    durationRisk: number;
}
export interface CounterpartyExposureRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    includeCollateral?: boolean;
    includeNetting?: boolean;
}
export interface CounterpartyExposureResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    totalGrossExposure: number;
    totalNetExposure: number;
    totalCollateral: number;
    netCreditExposure: number;
    counterpartyExposures: CounterpartyExposure[];
    largestExposure: number;
    averageExposure: number;
    exposureConcentration: number;
    exposureUnderStress: CounterpartyStressResult[];
    createdAt: Date;
    calculatedBy: string;
}
export interface CounterpartyExposure {
    counterpartyId: string;
    counterpartyName: string;
    counterpartyType: 'BANK' | 'BROKER' | 'CUSTODIAN' | 'CLEARINGHOUSE' | 'FUND' | 'CORPORATE' | 'SOVEREIGN';
    grossExposure: number;
    netExposure: number;
    collateralHeld: number;
    collateralPosted: number;
    netCreditExposure: number;
    rating: string;
    probabilityOfDefault: number;
    lossGivenDefault: number;
    expectedLoss: number;
    productExposures: ProductExposure[];
    nettingAgreements: NettingAgreement[];
    collateralAgreements: CollateralAgreement[];
}
export interface ProductExposure {
    productType: string;
    grossExposure: number;
    netExposure: number;
    numberOfTrades: number;
}
export interface NettingAgreement {
    agreementId: string;
    agreementType: string;
    coveragePercentage: number;
    nettingBenefit: number;
}
export interface CollateralAgreement {
    agreementId: string;
    collateralType: string;
    minimumTransferAmount: number;
    threshold: number;
    independentAmount: number;
}
export interface CounterpartyStressResult {
    stressScenario: string;
    totalNetExposure: number;
    largestExposure: number;
    expectedLoss: number;
}
export interface RiskLimit {
    id: string;
    tenantId: string;
    portfolioId?: string;
    limitName: string;
    limitType: RiskLimitType;
    riskType: RiskType;
    limitValue: number;
    warningThreshold: number;
    currency: string;
    assetClasses?: string[];
    sectors?: string[];
    geographies?: string[];
    counterparties?: string[];
    measurementFrequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    effectiveDate: Date;
    expirationDate?: Date;
    approvedBy: string;
    approvalDate: Date;
    reviewDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface RiskLimitMonitoringResult {
    id: string;
    portfolioId: string;
    tenantId: string;
    monitoringDate: Date;
    asOfDate: Date;
    activeLimitBreaches: LimitBreach[];
    warningLevelBreaches: LimitBreach[];
    limitUtilization: LimitUtilization[];
    utilizationTrend: UtilizationTrend[];
    createdAt: Date;
    monitoredBy: string;
}
export interface LimitBreach {
    limitId: string;
    limitName: string;
    limitType: RiskLimitType;
    limitValue: number;
    currentValue: number;
    utilizationPercentage: number;
    breachAmount: number;
    breachSeverity: AlertSeverity;
    contributingPositions: string[];
    recommendedActions: string[];
    firstBreachTime: Date;
    lastBreachTime: Date;
    breachDuration: number;
}
export interface LimitUtilization {
    limitId: string;
    limitName: string;
    limitValue: number;
    currentValue: number;
    utilizationPercentage: number;
    status: 'NORMAL' | 'WARNING' | 'BREACH';
    utilizationByCategory: CategoryUtilization[];
}
export interface CategoryUtilization {
    category: string;
    value: number;
    percentage: number;
}
export interface UtilizationTrend {
    date: Date;
    limitId: string;
    utilizationPercentage: number;
    value: number;
}
export interface ScenarioDefinition {
    name: string;
    description: string;
    factorShocks: FactorShock[];
    probability?: number;
}
export interface DataQuality {
    completeness: number;
    accuracy: number;
    timeliness: number;
    missingDataPoints: string[];
    qualityScore: number;
}
export interface ModelAssumptions {
    distributionAssumption: string;
    correlationModel: string;
    volatilityModel: string;
    lookbackPeriod: number;
    dataFrequency: string;
    adjustments: string[];
}
export interface BacktestingResult {
    testPeriod: {
        startDate: Date;
        endDate: Date;
    };
    numberOfExceptions: number;
    exceptionRate: number;
    expectedExceptionRate: number;
    kupiecTest: KupiecTest;
    christoffersenTest: ChristoffersenTest;
    isModelAccurate: boolean;
}
export interface KupiecTest {
    testStatistic: number;
    criticalValue: number;
    pValue: number;
    rejectNull: boolean;
}
export interface ChristoffersenTest {
    testStatistic: number;
    criticalValue: number;
    pValue: number;
    rejectNull: boolean;
}
export interface FactorSensitivity {
    factorName: string;
    sensitivity: number;
    contribution: number;
    percentContribution: number;
}
export interface CorrelationChange {
    asset1: string;
    asset2: string;
    baseCorrelation: number;
    stressedCorrelation: number;
    correlationChange: number;
}
export interface RiskContribution {
    assetId: string;
    symbol: string;
    riskContribution: number;
    percentContribution: number;
    marginalRisk: number;
}
export interface RiskAnalysisRequest {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    analysisTypes: RiskMeasurementMethod[];
    confidenceLevel?: ConfidenceLevel;
    timeHorizon?: TimeHorizon;
    includeStressTesting?: boolean;
    includeMonteCarloSimulation?: boolean;
    customParameters?: Record<string, any>;
}
export interface RiskAnalysisResponse {
    portfolioId: string;
    tenantId: string;
    calculationDate: Date;
    asOfDate: Date;
    varResults?: VaRResult;
    stressTestResults?: StressTestResult;
    monteCarloResults?: MonteCarloResult;
    correlationAnalysis?: CorrelationAnalysisResult;
    liquidityRisk?: LiquidityRiskResult;
    creditRisk?: CreditRiskResult;
    counterpartyExposure?: CounterpartyExposureResult;
    overallRiskScore: number;
    riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    keyRiskFactors: KeyRiskFactor[];
    recommendations: string[];
    calculationTime: number;
    dataQuality: DataQuality;
}
export interface KeyRiskFactor {
    riskType: RiskType;
    severity: AlertSeverity;
    description: string;
    contribution: number;
    mitigation?: string;
}
export interface RiskAnalysisSearchRequest {
    tenantId: string;
    portfolioIds?: string[];
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    riskTypes?: RiskType[];
    analysisTypes?: RiskMeasurementMethod[];
    riskRatings?: string[];
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface RiskAnalysisSearchResponse {
    analyses: RiskAnalysisResponse[];
    total: number;
    aggregations: {
        byRiskType: Record<RiskType, number>;
        byRiskRating: Record<string, number>;
        byPortfolio: Record<string, number>;
        averageRiskScore: number;
        totalVaR: number;
    };
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

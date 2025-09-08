// Risk Management Data Models
// Phase 4.3 - Comprehensive risk management system for enterprise investment platforms

// Base Risk Types and Enums
export enum RiskType {
  MARKET_RISK = 'MARKET_RISK',
  CREDIT_RISK = 'CREDIT_RISK',
  LIQUIDITY_RISK = 'LIQUIDITY_RISK',
  OPERATIONAL_RISK = 'OPERATIONAL_RISK',
  CONCENTRATION_RISK = 'CONCENTRATION_RISK',
  COUNTERPARTY_RISK = 'COUNTERPARTY_RISK',
  CURRENCY_RISK = 'CURRENCY_RISK',
  INTEREST_RATE_RISK = 'INTEREST_RATE_RISK',
  MODEL_RISK = 'MODEL_RISK',
  REGULATORY_RISK = 'REGULATORY_RISK'
}

export enum RiskMeasurementMethod {
  VALUE_AT_RISK = 'VALUE_AT_RISK',
  CONDITIONAL_VAR = 'CONDITIONAL_VAR',
  EXPECTED_SHORTFALL = 'EXPECTED_SHORTFALL',
  MONTE_CARLO = 'MONTE_CARLO',
  HISTORICAL_SIMULATION = 'HISTORICAL_SIMULATION',
  PARAMETRIC = 'PARAMETRIC',
  STRESS_TEST = 'STRESS_TEST',
  SCENARIO_ANALYSIS = 'SCENARIO_ANALYSIS'
}

export enum ConfidenceLevel {
  NINETY_FIVE = 95,
  NINETY_NINE = 99,
  NINETY_NINE_NINE = 99.9
}

export enum TimeHorizon {
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  TWO_WEEKS = '2W',
  ONE_MONTH = '1M',
  THREE_MONTHS = '3M',
  SIX_MONTHS = '6M',
  ONE_YEAR = '1Y'
}

export enum RiskLimitType {
  ABSOLUTE_LIMIT = 'ABSOLUTE_LIMIT',
  PERCENTAGE_LIMIT = 'PERCENTAGE_LIMIT',
  VAR_LIMIT = 'VAR_LIMIT',
  NOTIONAL_LIMIT = 'NOTIONAL_LIMIT',
  CONCENTRATION_LIMIT = 'CONCENTRATION_LIMIT',
  LEVERAGE_LIMIT = 'LEVERAGE_LIMIT'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum LiquidityCategory {
  IMMEDIATE = 'IMMEDIATE',        // < 1 day
  HIGH = 'HIGH',                  // 1-7 days
  MEDIUM = 'MEDIUM',              // 1-4 weeks
  LOW = 'LOW',                    // 1-3 months
  ILLIQUID = 'ILLIQUID'           // > 3 months
}

// Value at Risk Models
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
  
  // Main VaR Results
  totalVaR: number;
  diversifiedVaR: number;
  undiversifiedVaR: number;
  diversificationBenefit: number;
  
  // Component VaR
  componentVaR: ComponentVaR[];
  
  // Risk Contributions
  marginalVaR: MarginalVaR[];
  incrementalVaR: IncrementalVaR[];
  
  // Model Validation
  backtestingResults?: BacktestingResult;
  modelAccuracy: number;
  
  // Metadata
  calculationTime: number; // milliseconds
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
  securityId: string;
  symbol: string;
  marginalVaR: number;
  contribution: number;
  percentContribution: number;
}

export interface IncrementalVaR {
  positionId: string;
  securityId: string;
  symbol: string;
  incrementalVaR: number;
  portfolioVaRWithout: number;
  portfolioVaRWith: number;
}

// Stress Testing Models
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
  
  // Scenario Results
  scenarioResults: ScenarioResult[];
  
  // Summary Statistics
  worstCaseScenario: ScenarioResult;
  bestCaseScenario: ScenarioResult;
  averageImpact: number;
  
  // Risk Metrics Under Stress
  stressedVaR: number;
  stressedVolatility: number;
  maxDrawdown: number;
  
  // Factor Analysis
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
  
  // Market Factor Shocks
  factorShocks: FactorShock[];
  
  // Time Series Data (for historical scenarios)
  historicalPeriod?: {
    startDate: Date;
    endDate: Date;
    eventName: string;
  };
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  
  // Portfolio Impact
  portfolioValue: number;
  portfolioChange: number;
  portfolioChangePercent: number;
  
  // Position-Level Impact
  positionImpacts: PositionImpact[];
  
  // Risk Metrics Under Scenario
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
  securityId: string;
  symbol: string;
  currentValue: number;
  stressedValue: number;
  absoluteChange: number;
  percentChange: number;
  contributionToPortfolioChange: number;
}

// Monte Carlo Simulation Models
export interface MonteCarloRequest {
  portfolioId: string;
  tenantId: string;
  asOfDate: Date;
  numberOfSimulations: number;
  timeHorizon: TimeHorizon;
  confidenceLevel: ConfidenceLevel;
  
  // Model Parameters
  useHistoricalCorrelations: boolean;
  correlationLookbackPeriod?: number; // days
  volatilityModel: 'HISTORICAL' | 'GARCH' | 'EWMA';
  
  // Advanced Options
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
  
  // Distribution Statistics
  expectedReturn: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
  
  // Risk Metrics
  var95: number;
  var99: number;
  cvar95: number; // Conditional VaR
  cvar99: number;
  expectedShortfall: number;
  
  // Distribution Percentiles
  percentiles: PercentileResult[];
  
  // Path Statistics
  maxDrawdown: number;
  timeToRecovery: number;
  probabilityOfLoss: number;
  
  // Model Validation
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

// Correlation and Concentration Analysis
export interface CorrelationAnalysisRequest {
  portfolioId: string;
  tenantId: string;
  asOfDate: Date;
  lookbackPeriod: number; // days
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
  
  // Correlation Matrices
  positionCorrelations: CorrelationMatrix;
  assetClassCorrelations?: CorrelationMatrix;
  sectorCorrelations?: CorrelationMatrix;
  geographyCorrelations?: CorrelationMatrix;
  
  // Concentration Metrics
  concentrationMetrics: ConcentrationMetrics;
  
  // Diversification Analysis
  diversificationRatio: number;
  effectiveNumberOfBets: number;
  
  // Risk Contribution
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
  
  // By Category
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

// Liquidity Risk Assessment
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
  
  // Overall Liquidity Metrics
  liquidityScore: number; // 0-100
  averageDaysToLiquidate: number;
  liquidationCost: number;
  marketImpact: number;
  
  // Liquidity by Category
  liquidityByAssetClass: LiquidityBreakdown[];
  liquidityBySector: LiquidityBreakdown[];
  liquidityBySize: LiquidityBreakdown[];
  
  // Position-Level Liquidity
  positionLiquidity: PositionLiquidity[];
  
  // Stress Scenarios
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
  securityId: string;
  symbol: string;
  marketValue: number;
  liquidityCategory: LiquidityCategory;
  daysToLiquidate: number;
  liquidationCost: number;
  marketImpact: number;
  
  // Liquidity Factors
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

// Credit Risk Monitoring
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
  
  // Portfolio Credit Metrics
  averageRating: string;
  averageRatingNumeric: number;
  creditScore: number;
  probabilityOfDefault: number;
  expectedLoss: number;
  unexpectedLoss: number;
  
  // Rating Distribution
  ratingDistribution: RatingDistribution[];
  
  // Credit Concentration
  issuerConcentration: IssuerConcentration[];
  sectorConcentration: CategoryConcentration[];
  geographyConcentration: CategoryConcentration[];
  
  // Credit VaR
  creditVaR: number;
  migrationRisk: number;
  defaultRisk: number;
  
  // Position-Level Credit Risk
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
  securityId: string;
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

// Counterparty Exposure Tracking
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
  
  // Overall Exposure Metrics
  totalGrossExposure: number;
  totalNetExposure: number;
  totalCollateral: number;
  netCreditExposure: number;
  
  // Counterparty Breakdown
  counterpartyExposures: CounterpartyExposure[];
  
  // Risk Metrics
  largestExposure: number;
  averageExposure: number;
  exposureConcentration: number;
  
  // Stress Testing
  exposureUnderStress: CounterpartyStressResult[];
  
  createdAt: Date;
  calculatedBy: string;
}

export interface CounterpartyExposure {
  counterpartyId: string;
  counterpartyName: string;
  counterpartyType: 'BANK' | 'BROKER' | 'CUSTODIAN' | 'CLEARINGHOUSE' | 'FUND' | 'CORPORATE' | 'SOVEREIGN';
  
  // Exposure Amounts
  grossExposure: number;
  netExposure: number;
  collateralHeld: number;
  collateralPosted: number;
  netCreditExposure: number;
  
  // Risk Metrics
  rating: string;
  probabilityOfDefault: number;
  lossGivenDefault: number;
  expectedLoss: number;
  
  // Exposure Details
  productExposures: ProductExposure[];
  
  // Mitigation
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

// Risk Limits and Monitoring
export interface RiskLimit {
  id: string;
  tenantId: string;
  portfolioId?: string;
  
  // Limit Definition
  limitName: string;
  limitType: RiskLimitType;
  riskType: RiskType;
  
  // Limit Values
  limitValue: number;
  warningThreshold: number; // percentage of limit
  currency: string;
  
  // Scope
  assetClasses?: string[];
  sectors?: string[];
  geographies?: string[];
  counterparties?: string[];
  
  // Time Configuration
  measurementFrequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  effectiveDate: Date;
  expirationDate?: Date;
  
  // Approval and Governance
  approvedBy: string;
  approvalDate: Date;
  reviewDate?: Date;
  
  // Status
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
  
  // Limit Breaches
  activeLimitBreaches: LimitBreach[];
  warningLevelBreaches: LimitBreach[];
  
  // Utilization Summary
  limitUtilization: LimitUtilization[];
  
  // Trending
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
  
  // Contributing Factors
  contributingPositions: string[];
  recommendedActions: string[];
  
  // Timestamps
  firstBreachTime: Date;
  lastBreachTime: Date;
  breachDuration: number; // minutes
}

export interface LimitUtilization {
  limitId: string;
  limitName: string;
  limitValue: number;
  currentValue: number;
  utilizationPercentage: number;
  status: 'NORMAL' | 'WARNING' | 'BREACH';
  
  // Breakdown
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

// Supporting Types
export interface ScenarioDefinition {
  name: string;
  description: string;
  factorShocks: FactorShock[];
  probability?: number;
}

export interface DataQuality {
  completeness: number; // percentage
  accuracy: number; // percentage
  timeliness: number; // hours delay
  missingDataPoints: string[];
  qualityScore: number; // 0-100
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

// Request and Response Types for API
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
  
  // Risk Metrics
  varResults?: VaRResult;
  stressTestResults?: StressTestResult;
  monteCarloResults?: MonteCarloResult;
  correlationAnalysis?: CorrelationAnalysisResult;
  liquidityRisk?: LiquidityRiskResult;
  creditRisk?: CreditRiskResult;
  counterpartyExposure?: CounterpartyExposureResult;
  
  // Summary
  overallRiskScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  keyRiskFactors: KeyRiskFactor[];
  recommendations: string[];
  
  // Metadata
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

// Search and Filter Types
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
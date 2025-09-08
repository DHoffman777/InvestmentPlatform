// Performance Measurement Models and Types
// Comprehensive models for portfolio performance calculation and analysis

export interface PerformancePeriod {
  id: string;
  tenantId: string;
  portfolioId: string;
  
  // Period Definition
  periodStart: Date;
  periodEnd: Date;
  periodType: PeriodType;
  
  // Return Calculations
  timeWeightedReturn: number; // TWR as decimal (e.g., 0.08 for 8%)
  moneyWeightedReturn: number; // IRR as decimal
  simpleReturn: number;
  logarithmicReturn: number;
  
  // Gross vs Net Returns
  grossReturn: number;
  netReturn: number;
  managementFees: number;
  performanceFees: number;
  otherFees: number;
  
  // After-tax Returns
  preTaxReturn: number;
  afterTaxReturn: number;
  taxDrag: number;
  
  // Portfolio Values
  beginningValue: number;
  endingValue: number;
  averageValue: number;
  highWaterMark: number;
  
  // Cash Flow Information
  totalCashFlows: number;
  netCashFlows: number;
  contributions: number;
  withdrawals: number;
  
  // Risk Metrics
  volatility: number;
  standardDeviation: number;
  downside_deviation: number;
  maxDrawdown: number;
  maxDrawdownDuration: number; // days
  
  // Risk-Adjusted Performance
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  informationRatio: number;
  treynorRatio: number;
  jensenAlpha: number;
  beta: number;
  
  // Benchmark Comparison
  benchmarkReturn: number;
  excessReturn: number;
  activeReturn: number;
  trackingError: number;
  
  // Attribution Results
  securitySelection: number;
  assetAllocation: number;
  interactionEffect: number;
  totalAttribution: number;
  
  // Currency Impact (for multi-currency portfolios)
  localCurrencyReturn: number;
  currencyReturn: number;
  totalReturn: number;
  
  // Data Quality and Processing
  dataQualityScore: number;
  calculationMethod: CalculationMethod;
  calculationDate: Date;
  isRebalancingPeriod: boolean;
  hasSignificantCashFlows: boolean;
  
  // Metadata
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
  
  // Attribution Analysis
  attributionType: AttributionType;
  attributionLevel: AttributionLevel;
  
  // Sector/Asset Class Attribution
  sectors: SectorAttribution[];
  assetClasses: AssetClassAttribution[];
  securities: SecurityAttribution[];
  
  // Factor Attribution
  factors: FactorAttribution[];
  
  // Performance Decomposition
  totalPortfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  
  // Attribution Components
  allocationEffect: number;
  selectionEffect: number;
  interactionEffect: number;
  currencyEffect: number;
  
  // Risk Attribution
  totalRisk: number;
  activeRisk: number;
  riskAttribution: RiskAttribution[];
  
  // Period Information
  attributionPeriodStart: Date;
  attributionPeriodEnd: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SectorAttribution {
  sectorId: string;
  sectorName: string;
  
  // Weights
  portfolioWeight: number;
  benchmarkWeight: number;
  activeWeight: number;
  
  // Returns
  portfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  
  // Attribution Effects
  allocationEffect: number;
  selectionEffect: number;
  interactionEffect: number;
  totalContribution: number;
}

export interface AssetClassAttribution {
  assetClassId: string;
  assetClassName: string;
  
  // Weights and Returns
  portfolioWeight: number;
  benchmarkWeight: number;
  portfolioReturn: number;
  benchmarkReturn: number;
  
  // Attribution Effects
  allocationEffect: number;
  selectionEffect: number;
  totalContribution: number;
}

export interface SecurityAttribution {
  securityId: string;
  instrumentName: string;
  
  // Position Information
  averageWeight: number;
  beginningWeight: number;
  endingWeight: number;
  
  // Return Information
  securityReturn: number;
  contribution: number;
  
  // Attribution Details
  specificReturn: number;
  systematicReturn: number;
}

export interface FactorAttribution {
  factorId: string;
  factorName: string;
  factorType: FactorType;
  
  // Factor Exposure
  portfolioExposure: number;
  benchmarkExposure: number;
  activeExposure: number;
  
  // Factor Returns
  factorReturn: number;
  contribution: number;
  
  // Risk Contribution
  riskContribution: number;
}

export interface RiskAttribution {
  riskFactorId: string;
  riskFactorName: string;
  riskFactorType: RiskFactorType;
  
  // Risk Measures
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
  
  // Period Information
  comparisonPeriodStart: Date;
  comparisonPeriodEnd: Date;
  periodType: PeriodType;
  
  // Performance Comparison
  portfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  
  // Risk Comparison
  portfolioVolatility: number;
  benchmarkVolatility: number;
  trackingError: number;
  
  // Risk-Adjusted Comparison
  portfolioSharpeRatio: number;
  benchmarkSharpeRatio: number;
  informationRatio: number;
  
  // Statistical Measures
  correlation: number;
  beta: number;
  alpha: number;
  rSquared: number;
  
  // Performance Rankings
  percentileRank: number;
  quartileRank: number;
  
  // Hit Rate Analysis
  upCaptureRatio: number;
  downCaptureRatio: number;
  hitRate: number; // percentage of periods outperforming
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PerformanceComposite {
  id: string;
  tenantId: string;
  compositeName: string;
  compositeDescription: string;
  
  // GIPS Compliance
  isGipsCompliant: boolean;
  gipsVersion: string;
  compositeDefinition: string;
  inclusionCriteria: string;
  
  // Composite Portfolios
  portfolioIds: string[];
  totalAssets: number;
  numberOfPortfolios: number;
  
  // Performance History
  performancePeriods: CompositePerformancePeriod[];
  
  // Risk Metrics
  threeYearVolatility: number;
  dispersion: number; // asset-weighted standard deviation
  
  // Benchmark Information
  benchmarkId: string;
  benchmarkName: string;
  
  // Compliance
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
  
  // Period Information
  periodStart: Date;
  periodEnd: Date;
  
  // Composite Performance
  grossReturn: number;
  netReturn: number;
  benchmarkReturn: number;
  
  // Risk Metrics
  volatility: number;
  dispersion: number;
  
  // Assets
  totalAssets: number;
  numberOfPortfolios: number;
  
  // GIPS Requirements
  feesDeducted: number;
  isActualFees: boolean;
}

export interface PerformanceCalculationEngine {
  id: string;
  tenantId: string;
  
  // Calculation Configuration
  calculationMethod: CalculationMethod;
  returnCalculationBasis: ReturnCalculationBasis;
  feeCalculationMethod: FeeCalculationMethod;
  
  // Timing Settings
  valuationFrequency: ValuationFrequency;
  calculationFrequency: CalculationFrequency;
  
  // Cash Flow Settings
  cashFlowTiming: CashFlowTiming;
  significantCashFlowThreshold: number; // percentage
  
  // Attribution Settings
  attributionMethod: AttributionMethod;
  factorModel: FactorModel;
  
  // Risk Settings
  riskFreeRate: number;
  confidenceLevel: number; // for VaR calculations
  
  // Benchmark Settings
  defaultBenchmarkId: string;
  benchmarkRebalancingFrequency: RebalancingFrequency;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Enums

export enum PeriodType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
  INCEPTION_TO_DATE = 'INCEPTION_TO_DATE',
  YEAR_TO_DATE = 'YEAR_TO_DATE',
  CUSTOM = 'CUSTOM'
}

export enum CalculationMethod {
  TIME_WEIGHTED = 'TIME_WEIGHTED',
  MONEY_WEIGHTED = 'MONEY_WEIGHTED',
  SIMPLE = 'SIMPLE',
  LOGARITHMIC = 'LOGARITHMIC',
  MODIFIED_DIETZ = 'MODIFIED_DIETZ',
  TRUE_TIME_WEIGHTED = 'TRUE_TIME_WEIGHTED'
}

export enum AttributionType {
  BRINSON_HOOD_BEEBOWER = 'BRINSON_HOOD_BEEBOWER',
  BRINSON_FACHLER = 'BRINSON_FACHLER',
  GEOMETRIC = 'GEOMETRIC',
  ARITHMETIC = 'ARITHMETIC',
  FACTOR_BASED = 'FACTOR_BASED'
}

export enum AttributionLevel {
  ASSET_CLASS = 'ASSET_CLASS',
  SECTOR = 'SECTOR',
  SECURITY = 'SECURITY',
  FACTOR = 'FACTOR',
  CURRENCY = 'CURRENCY'
}

export enum FactorType {
  FUNDAMENTAL = 'FUNDAMENTAL',
  MACROECONOMIC = 'MACROECONOMIC',
  STATISTICAL = 'STATISTICAL',
  RISK = 'RISK',
  STYLE = 'STYLE'
}

export enum RiskFactorType {
  MARKET = 'MARKET',
  SECTOR = 'SECTOR',
  STYLE = 'STYLE',
  CURRENCY = 'CURRENCY',
  SPECIFIC = 'SPECIFIC'
}

export enum ReturnCalculationBasis {
  TRADE_DATE = 'TRADE_DATE',
  SETTLEMENT_DATE = 'SETTLEMENT_DATE',
  BOOK_DATE = 'BOOK_DATE'
}

export enum FeeCalculationMethod {
  ACTUAL = 'ACTUAL',
  MODEL = 'MODEL',
  HIGHEST_FEE = 'HIGHEST_FEE',
  COMPOSITE_FEE = 'COMPOSITE_FEE'
}

export enum ValuationFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY'
}

export enum CalculationFrequency {
  REAL_TIME = 'REAL_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export enum CashFlowTiming {
  BEGINNING_OF_DAY = 'BEGINNING_OF_DAY',
  END_OF_DAY = 'END_OF_DAY',
  ACTUAL_TIME = 'ACTUAL_TIME',
  MODIFIED_DIETZ = 'MODIFIED_DIETZ'
}

export enum AttributionMethod {
  BRINSON = 'BRINSON',
  GEOMETRIC = 'GEOMETRIC',
  FACTOR_BASED = 'FACTOR_BASED'
}

export enum FactorModel {
  FAMA_FRENCH_3_FACTOR = 'FAMA_FRENCH_3_FACTOR',
  FAMA_FRENCH_5_FACTOR = 'FAMA_FRENCH_5_FACTOR',
  CARHART_4_FACTOR = 'CARHART_4_FACTOR',
  CUSTOM = 'CUSTOM'
}

export enum RebalancingFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY'
}

// Request/Response Types

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
  calculationTime: number; // milliseconds
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
  
  // Latest Performance
  latestReturn: number;
  latestPeriodEnd: Date;
  
  // Multi-Period Returns
  monthToDateReturn: number;
  quarterToDateReturn: number;
  yearToDateReturn: number;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  sinceInceptionReturn: number;
  
  // Risk Metrics
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  
  // Benchmark Comparison
  benchmarkName: string;
  excessReturn: number;
  trackingError: number;
  informationRatio: number;
  
  // Assets
  currentValue: number;
  highWaterMark: number;
  
  lastCalculated: Date;
}
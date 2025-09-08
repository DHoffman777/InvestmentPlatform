// Fixed Income Analytics Data Models
// Comprehensive data structures for advanced fixed income analysis

export enum BondType {
  GOVERNMENT = 'GOVERNMENT',
  CORPORATE = 'CORPORATE',
  MUNICIPAL = 'MUNICIPAL',
  TREASURY = 'TREASURY',
  AGENCY = 'AGENCY',
  SUPRANATIONAL = 'SUPRANATIONAL',
  MORTGAGE_BACKED = 'MORTGAGE_BACKED',
  ASSET_BACKED = 'ASSET_BACKED',
  CONVERTIBLE = 'CONVERTIBLE',
  FLOATING_RATE = 'FLOATING_RATE',
  ZERO_COUPON = 'ZERO_COUPON'
}

export enum CreditRating {
  AAA = 'AAA',
  AA_PLUS = 'AA+',
  AA = 'AA',
  AA_MINUS = 'AA-',
  A_PLUS = 'A+',
  A = 'A',
  A_MINUS = 'A-',
  BBB_PLUS = 'BBB+',
  BBB = 'BBB',
  BBB_MINUS = 'BBB-',
  BB_PLUS = 'BB+',
  BB = 'BB',
  BB_MINUS = 'BB-',
  B_PLUS = 'B+',
  B = 'B',
  B_MINUS = 'B-',
  CCC_PLUS = 'CCC+',
  CCC = 'CCC',
  CCC_MINUS = 'CCC-',
  CC = 'CC',
  C = 'C',
  D = 'D',
  NR = 'NR'
}

export enum YieldType {
  YIELD_TO_MATURITY = 'YIELD_TO_MATURITY',
  YIELD_TO_WORST = 'YIELD_TO_WORST',
  YIELD_TO_CALL = 'YIELD_TO_CALL',
  YIELD_TO_PUT = 'YIELD_TO_PUT',
  CURRENT_YIELD = 'CURRENT_YIELD',
  RUNNING_YIELD = 'RUNNING_YIELD',
  DISCOUNT_YIELD = 'DISCOUNT_YIELD',
  TAX_EQUIVALENT_YIELD = 'TAX_EQUIVALENT_YIELD',
  AFTER_TAX_YIELD = 'AFTER_TAX_YIELD',
  OPTION_ADJUSTED_YIELD = 'OPTION_ADJUSTED_YIELD'
}

export enum DurationType {
  MODIFIED_DURATION = 'MODIFIED_DURATION',
  MACAULAY_DURATION = 'MACAULAY_DURATION',
  EFFECTIVE_DURATION = 'EFFECTIVE_DURATION',
  KEY_RATE_DURATION = 'KEY_RATE_DURATION',
  OPTION_ADJUSTED_DURATION = 'OPTION_ADJUSTED_DURATION',
  DOLLAR_DURATION = 'DOLLAR_DURATION'
}

export enum CallType {
  CALL = 'CALL',
  PUT = 'PUT',
  SINK = 'SINK',
  MAKE_WHOLE = 'MAKE_WHOLE'
}

export enum PaymentFrequency {
  ANNUAL = 'ANNUAL',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  QUARTERLY = 'QUARTERLY',
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY',
  ZERO_COUPON = 'ZERO_COUPON',
  IRREGULAR = 'IRREGULAR'
}

export enum DayCountConvention {
  THIRTY_360 = '30/360',
  THIRTY_360_ISDA = '30/360 ISDA',
  THIRTY_E_360 = '30E/360',
  ACT_360 = 'ACT/360',
  ACT_365 = 'ACT/365',
  ACT_ACT = 'ACT/ACT',
  ACT_ACT_ISDA = 'ACT/ACT ISDA',
  BUS_252 = 'BUS/252'
}

// Core Fixed Income Security Interface
export interface FixedIncomeSecurityAnalytics {
  id: string;
  tenantId: string;
  securityId: string;
  cusip?: string;
  isin?: string;
  symbol?: string;
  
  // Basic Security Information
  issuerName: string;
  bondType: BondType;
  securityDescription: string;
  currency: string;
  country: string;
  sector?: string;
  industry?: string;
  
  // Bond Characteristics
  issueDate: Date;
  maturityDate: Date;
  originalMaturity: number; // in years
  remainingMaturity: number; // in years
  faceValue: number;
  couponRate: number; // as decimal (e.g., 0.05 for 5%)
  paymentFrequency: PaymentFrequency;
  dayCountConvention: DayCountConvention;
  
  // Credit Information
  creditRatingMoody?: CreditRating;
  creditRatingSP?: CreditRating;
  creditRatingFitch?: CreditRating;
  seniority?: string;
  securityType?: string;
  
  // Callable/Putable Features
  isCallable: boolean;
  isPutable: boolean;
  callSchedule?: CallProvision[];
  putSchedule?: PutProvision[];
  
  // Pricing and Market Data
  currentPrice: number;
  priceDate: Date;
  accruedInterest: number;
  cleanPrice: number;
  dirtyPrice: number;
  spreadToTreasury?: number;
  spreadToBenchmark?: number;
  
  // Computed Analytics
  yieldAnalytics: YieldAnalytics;
  durationAnalytics: DurationAnalytics;
  convexityAnalytics: ConvexityAnalytics;
  creditAnalytics?: CreditAnalytics;
  optionAnalytics?: OptionAnalytics;
  
  // Metadata
  lastAnalyzed: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Call/Put Provision Structures
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

// Yield Analytics
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
  
  // Yield Curve Analysis
  benchmarkYield?: number;
  yieldSpread?: number;
  zSpread?: number;
  optionAdjustedSpread?: number;
  assetSwapSpread?: number;
  
  // Municipal Bond Specific
  municipalTaxRate?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
  
  calculationDate: Date;
  calculationMethod: string;
}

// Duration Analytics
export interface DurationAnalytics {
  modifiedDuration: number;
  macaulayDuration: number;
  effectiveDuration?: number;
  optionAdjustedDuration?: number;
  dollarDuration: number;
  
  // Key Rate Durations
  keyRateDurations?: KeyRateDuration[];
  
  // Risk Metrics
  dv01: number; // Dollar Value of 01 basis point
  pv01: number; // Present Value of 01 basis point
  
  calculationDate: Date;
  yieldShock: number; // basis points used for calculation
}

export interface KeyRateDuration {
  maturity: string; // e.g., '1Y', '2Y', '5Y', '10Y', '30Y'
  duration: number;
}

// Convexity Analytics
export interface ConvexityAnalytics {
  convexity: number;
  effectiveConvexity?: number;
  optionAdjustedConvexity?: number;
  dollarConvexity: number;
  
  // Second-order price sensitivity
  gamma: number;
  
  calculationDate: Date;
  yieldShock: number; // basis points used for calculation
}

// Credit Analytics
export interface CreditAnalytics {
  creditSpread: number;
  defaultProbability: number;
  recoveryRate: number;
  creditVaR: number;
  expectedLoss: number;
  unexpectedLoss: number;
  
  // Credit Curve Analysis
  hazardRate: number;
  survivalProbability: number;
  
  // Credit Rating Migration
  ratingTransitionProbability?: RatingTransition[];
  
  calculationDate: Date;
  horizonDays: number;
  confidenceLevel: number;
}

export interface RatingTransition {
  fromRating: CreditRating;
  toRating: CreditRating;
  probability: number;
  timeHorizon: number; // in years
}

// Option Analytics (for callable/putable bonds)
export interface OptionAnalytics {
  optionValue: number;
  optionAdjustedPrice: number;
  impliedVolatility?: number;
  
  // Greeks for embedded options
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  
  // Call/Put specific
  callValue?: number;
  putValue?: number;
  
  calculationDate: Date;
  modelUsed: string;
}

// Mortgage-Backed Securities Specific
export interface MortgageBackedAnalytics {
  weightedAverageMaturity: number;
  weightedAverageCoupon: number;
  weightedAverageLife: number;
  prepaymentSpeed: number; // CPR (Conditional Prepayment Rate)
  psa: number; // PSA (Public Securities Association) speed
  
  // Cash Flow Analysis
  principalPaydown: number;
  interestPayment: number;
  prepaymentAmount: number;
  
  // Option-Adjusted Metrics
  optionAdjustedSpread: number;
  optionAdjustedDuration: number;
  optionAdjustedConvexity: number;
  
  calculationDate: Date;
}

// Asset-Backed Securities Specific
export interface AssetBackedAnalytics {
  underlyingAssetType: string;
  collateralFactor: number;
  enhancementLevel: number;
  averageLife: number;
  
  // Credit Enhancement
  subordination: number;
  excessSpread: number;
  reserveFund: number;
  
  // Loss Analysis
  expectedLossRate: number;
  worstCaseLossRate: number;
  breakEvenDefaultRate: number;
  
  calculationDate: Date;
}

// Request/Response Interfaces
export interface YieldCalculationRequest {
  securityId: string;
  price: number;
  settlementDate: Date;
  yieldTypes: YieldType[];
  taxRate?: number; // for tax-equivalent yield
}

export interface YieldCalculationResult {
  securityId: string;
  calculationDate: Date;
  yields: { [key in YieldType]?: number };
  warnings: string[];
  calculationTime: number;
}

export interface DurationConvexityRequest {
  securityId: string;
  price: number;
  yield: number;
  settlementDate: Date;
  yieldShock?: number; // basis points, default 100
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
  
  // Portfolio-level metrics
  portfolioYield: number;
  portfolioDuration: number;
  portfolioConvexity: number;
  portfolioSpread: number;
  
  // Risk Metrics
  interestRateVaR: number;
  creditVaR: number;
  totalVaR: number;
  
  // Sector/Rating Breakdown
  sectorAllocation: SectorAllocation[];
  ratingAllocation: RatingAllocation[];
  maturityDistribution: MaturityBucket[];
  
  // Cash Flow Analysis
  expectedCashFlows: CashFlowProjection[];
  
  // Stress Testing
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
  bucketName: string; // e.g., "0-1Y", "1-3Y", "3-5Y", etc.
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
  yieldShock: number; // basis points
  priceImpact: number;
  percentageImpact: number;
  durationContribution: number;
  convexityContribution: number;
}

// Search and Filter Interfaces
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
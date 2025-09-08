// Structured Products Models
// Phase 4.1 - Comprehensive structured products support including structured notes, market-linked instruments, and exotic derivatives

// Structured Product Types
export enum StructuredProductType {
  STRUCTURED_NOTE = 'STRUCTURED_NOTE',
  MARKET_LINKED_CD = 'MARKET_LINKED_CD',
  REVERSE_CONVERTIBLE = 'REVERSE_CONVERTIBLE',
  AUTOCALLABLE = 'AUTOCALLABLE',
  BARRIER_OPTION = 'BARRIER_OPTION',
  EXOTIC_DERIVATIVE = 'EXOTIC_DERIVATIVE',
  EQUITY_LINKED = 'EQUITY_LINKED',
  RATE_LINKED = 'RATE_LINKED',
  COMMODITY_LINKED = 'COMMODITY_LINKED',
  CURRENCY_LINKED = 'CURRENCY_LINKED'
}

export enum BarrierType {
  KNOCK_IN = 'KNOCK_IN',
  KNOCK_OUT = 'KNOCK_OUT',
  UP_AND_IN = 'UP_AND_IN',
  UP_AND_OUT = 'UP_AND_OUT',
  DOWN_AND_IN = 'DOWN_AND_IN',
  DOWN_AND_OUT = 'DOWN_AND_OUT',
  DOUBLE_BARRIER = 'DOUBLE_BARRIER'
}

export enum PayoffType {
  FIXED_COUPON = 'FIXED_COUPON',
  FLOATING_COUPON = 'FLOATING_COUPON',
  PARTICIPATION = 'PARTICIPATION',
  LEVERAGED = 'LEVERAGED',
  CAPPED = 'CAPPED',
  FLOORED = 'FLOORED',
  DIGITAL = 'DIGITAL',
  BASKET = 'BASKET'
}

export enum ObservationFrequency {
  CONTINUOUS = 'CONTINUOUS',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  MATURITY_ONLY = 'MATURITY_ONLY'
}

export enum SettlementType {
  CASH = 'CASH',
  PHYSICAL = 'PHYSICAL',
  ELECTION = 'ELECTION'
}

export enum UnderlyingType {
  SINGLE_STOCK = 'SINGLE_STOCK',
  INDEX = 'INDEX',
  BASKET = 'BASKET',
  COMMODITY = 'COMMODITY',
  CURRENCY = 'CURRENCY',
  INTEREST_RATE = 'INTEREST_RATE',
  CREDIT = 'CREDIT',
  HYBRID = 'HYBRID'
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',
  CALLED = 'CALLED',
  DEFAULTED = 'DEFAULTED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

// Core Structured Product Definition
export interface StructuredProduct {
  id: string;
  tenantId: string;
  securityId: string;
  
  // Basic Information
  productName: string;
  productType: StructuredProductType;
  issuer: string;
  issuerId: string;
  cusip?: string;
  isin?: string;
  ticker?: string;
  
  // Financial Terms
  notionalAmount: number;
  currency: string;
  issueDate: Date;
  maturityDate: Date;
  minInvestment: number;
  incrementAmount?: number;
  
  // Payoff Structure
  payoffType: PayoffType;
  payoffFormula: string; // Mathematical expression
  payoffParameters: Record<string, any>;
  
  // Underlying Assets
  underlyingType: UnderlyingType;
  underlyingAssets: UnderlyingAsset[];
  
  // Barrier Features
  hasBarrier: boolean;
  barriers?: BarrierFeature[];
  
  // Coupon/Interest Features
  hasCoupon: boolean;
  coupons?: CouponStructure[];
  
  // Call/Put Features
  isCallable: boolean;
  isPutable: boolean;
  callSchedule?: CallSchedule[];
  putSchedule?: PutSchedule[];
  
  // Protection Features
  hasCapitalProtection: boolean;
  protectionLevel?: number; // Percentage of principal protected
  protectionType?: 'FULL' | 'PARTIAL' | 'CONDITIONAL';
  
  // Settlement
  settlementType: SettlementType;
  settlementDays: number;
  
  // Documentation
  termSheet: string; // JSON or document reference
  prospectus?: string;
  marketingMaterials?: string[];
  
  // Risk Assessment
  riskLevel: RiskLevel;
  riskFactors: string[];
  creditRating?: string;
  
  // Pricing
  currentPrice?: number;
  lastPriceUpdate?: Date;
  pricingModel?: string;
  pricingParameters?: Record<string, any>;
  
  // Status
  status: DocumentStatus;
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Underlying Asset Definition
export interface UnderlyingAsset {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  weight: number; // Weight in basket (percentage)
  
  // Reference Data
  exchange?: string;
  currency?: string;
  sector?: string;
  
  // Current Market Data
  currentPrice?: number;
  lastUpdate?: Date;
  
  // Strike/Reference Levels
  initialLevel?: number;
  strikeLevel?: number;
  
  // Volatility
  impliedVolatility?: number;
  historicalVolatility?: number;
  
  // Correlation (for basket products)
  correlationMatrix?: Record<string, number>;
}

// Barrier Feature Definition
export interface BarrierFeature {
  id: string;
  barrierType: BarrierType;
  level: number;
  rebate?: number; // Rebate paid if barrier is hit
  
  // Observation
  observationFrequency: ObservationFrequency;
  observationStartDate: Date;
  observationEndDate: Date;
  
  // Multiple Barriers
  upperBarrier?: number;
  lowerBarrier?: number;
  
  // American/European style
  isAmerican: boolean;
  
  // Status
  isActive: boolean;
  hasBeenHit: boolean;
  hitDate?: Date;
  hitLevel?: number;
  
  // Associated Actions
  knockInAction?: PayoffAction;
  knockOutAction?: PayoffAction;
}

// Coupon Structure Definition
export interface CouponStructure {
  id: string;
  couponType: 'FIXED' | 'FLOATING' | 'CONDITIONAL' | 'STEP_UP' | 'BARRIER_DEPENDENT';
  
  // Payment Details
  paymentDate: Date;
  couponRate?: number; // Fixed rate
  referenceRate?: string; // For floating coupons
  spread?: number; // Spread over reference rate
  
  // Conditional Logic
  condition?: string; // Formula or condition
  conditionParameters?: Record<string, any>;
  
  // Memory Feature
  hasMemory: boolean;
  accumulatedCoupons?: number;
  
  // Status
  isPaid: boolean;
  paidAmount?: number;
  paidDate?: Date;
  
  // Calculations
  calculatedRate?: number;
  calculatedAmount?: number;
  calculationDate?: Date;
}

// Call Schedule Definition
export interface CallSchedule {
  id: string;
  callDate: Date;
  callPrice: number;
  callType: 'MANDATORY' | 'OPTIONAL';
  
  // Conditions
  callCondition?: string;
  conditionParameters?: Record<string, any>;
  
  // Notice
  noticeDays: number;
  noticeDate?: Date;
  
  // Status
  isExercised: boolean;
  exerciseDate?: Date;
  exercisePrice?: number;
}

// Put Schedule Definition
export interface PutSchedule {
  id: string;
  putDate: Date;
  putPrice: number;
  putType: 'MANDATORY' | 'OPTIONAL';
  
  // Conditions
  putCondition?: string;
  conditionParameters?: Record<string, any>;
  
  // Notice
  noticeDays: number;
  noticeDate?: Date;
  
  // Status
  isExercised: boolean;
  exerciseDate?: Date;
  exercisePrice?: number;
}

// Payoff Action Definition
export interface PayoffAction {
  actionType: 'PAYOUT' | 'CONVERT' | 'TERMINATE' | 'CONTINUE';
  payoutAmount?: number;
  payoutFormula?: string;
  conversionRatio?: number;
  conversionAsset?: string;
}

// Market Data for Structured Products
export interface StructuredProductMarketData {
  id: string;
  productId: string;
  timestamp: Date;
  
  // Pricing
  theoreticalValue: number;
  marketPrice?: number;
  bid?: number;
  ask?: number;
  spread?: number;
  
  // Greeks (for derivatives)
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  
  // Risk Metrics
  impliedVolatility?: number;
  timeToMaturity?: number;
  
  // Underlying Levels
  underlyingLevels: Record<string, number>;
  
  // Barrier Status
  barrierDistances?: Record<string, number>;
  barrierProbabilities?: Record<string, number>;
  
  // Sensitivity Analysis
  priceScenarios?: PriceScenario[];
}

// Price Scenario for Stress Testing
export interface PriceScenario {
  scenarioName: string;
  underlyingChanges: Record<string, number>; // Percentage changes
  impliedVolChanges?: Record<string, number>;
  timeDecay?: number; // Days
  scenarioPrice: number;
  pnl: number;
}

// Valuation Model
export interface ValuationModel {
  id: string;
  modelName: string;
  modelType: 'MONTE_CARLO' | 'BINOMIAL' | 'TRINOMIAL' | 'PDE' | 'CLOSED_FORM' | 'EMPIRICAL';
  
  // Model Parameters
  parameters: Record<string, any>;
  
  // Monte Carlo Specific
  simulations?: number;
  timeSteps?: number;
  randomSeed?: number;
  
  // Calibration
  calibrationDate?: Date;
  calibrationMethod?: string;
  calibrationParameters?: Record<string, any>;
  
  // Validation
  backTestResults?: BackTestResult[];
  
  // Performance
  calculationTime?: number;
  convergenceMetrics?: Record<string, number>;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Back Test Result
export interface BackTestResult {
  testDate: Date;
  modelPrice: number;
  marketPrice: number;
  absoluteError: number;
  relativeError: number;
  
  // Statistical Measures
  rmse?: number;
  mae?: number;
  bias?: number;
  
  // Test Parameters
  testPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

// Position in Structured Product
export interface StructuredProductPosition {
  id: string;
  tenantId: string;
  portfolioId: string;
  productId: string;
  
  // Position Details
  quantity: number;
  notionalValue: number;
  averageCost: number;
  currentValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  
  // Acquisition
  acquisitionDate: Date;
  acquisitionPrice: number;
  
  // Current Status
  lastValuationDate: Date;
  lastValuationPrice: number;
  
  // Risk Metrics
  var95?: number; // Value at Risk
  var99?: number;
  expectedShortfall?: number;
  
  // Greeks Portfolio Level
  portfolioDelta?: number;
  portfolioGamma?: number;
  portfolioTheta?: number;
  portfolioVega?: number;
  
  // Monitoring
  pricingAlerts: PricingAlert[];
  barrierAlerts: BarrierAlert[];
  
  // Settlement
  pendingSettlement?: number;
  settledAmount?: number;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing Alert
export interface PricingAlert {
  id: string;
  alertType: 'STALE_PRICE' | 'PRICE_DEVIATION' | 'VOLATILITY_SPIKE' | 'MODEL_FAILURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  
  // Alert Data
  currentValue?: number;
  expectedValue?: number;
  deviation?: number;
  threshold?: number;
  
  // Timing
  alertTime: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  
  isActive: boolean;
}

// Barrier Alert
export interface BarrierAlert {
  id: string;
  barrierId: string;
  alertType: 'BARRIER_APPROACH' | 'BARRIER_HIT' | 'BARRIER_RECOVERY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Alert Data
  currentLevel: number;
  barrierLevel: number;
  distance: number;
  distancePercentage: number;
  
  // Timing
  alertTime: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  
  isActive: boolean;
}

// Document Parsing Result
export interface DocumentParsingResult {
  id: string;
  documentId: string;
  documentType: 'TERM_SHEET' | 'PROSPECTUS' | 'MARKETING' | 'LEGAL';
  
  // Parsing Status
  parsingStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  parsingEngine: string;
  
  // Extracted Data
  extractedTerms: Record<string, any>;
  structuredData: Partial<StructuredProduct>;
  
  // Confidence Scores
  extractionConfidence: Record<string, number>;
  overallConfidence: number;
  
  // Validation
  validationErrors: ValidationError[];
  validationWarnings: ValidationWarning[];
  
  // Processing Info
  processingStartTime: Date;
  processingEndTime?: Date;
  processingDuration?: number;
  
  // Human Review
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Validation Error
export interface ValidationError {
  field: string;
  errorType: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  suggestedFix?: string;
}

// Validation Warning
export interface ValidationWarning {
  field: string;
  warningType: string;
  message: string;
  impact: string;
}

// Issuer Credit Risk
export interface IssuerCreditRisk {
  issuerId: string;
  issuerName: string;
  
  // Credit Ratings
  moodysRating?: string;
  spRating?: string;
  fitchRating?: string;
  internalRating?: string;
  
  // Credit Metrics
  creditSpread: number;
  probabilityOfDefault: number;
  recoveryRate: number;
  creditVaR: number;
  
  // Exposure
  totalExposure: number;
  concentrationLimit: number;
  utilizationRatio: number;
  
  // Monitoring
  lastReviewDate: Date;
  nextReviewDate: Date;
  watchListStatus: 'NONE' | 'WATCH' | 'RESTRICTED' | 'PROHIBITED';
  
  // Historical Data
  ratingHistory: RatingEvent[];
  spreadHistory: SpreadHistory[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Rating Event
export interface RatingEvent {
  date: Date;
  agency: string;
  previousRating: string;
  newRating: string;
  action: 'UPGRADE' | 'DOWNGRADE' | 'AFFIRM' | 'WITHDRAWAL';
  outlook: 'POSITIVE' | 'NEGATIVE' | 'STABLE' | 'DEVELOPING';
  rationale?: string;
}

// Spread History
export interface SpreadHistory {
  date: Date;
  spread: number;
  benchmark: string;
  source: string;
}

// API Request/Response Types
export interface CreateStructuredProductRequest {
  productData: Omit<StructuredProduct, 'id' | 'createdAt' | 'updatedAt'>;
  underlyingAssets: Omit<UnderlyingAsset, 'id'>[];
  barriers?: Omit<BarrierFeature, 'id'>[];
  coupons?: Omit<CouponStructure, 'id'>[];
  callSchedule?: Omit<CallSchedule, 'id'>[];
  putSchedule?: Omit<PutSchedule, 'id'>[];
}

export interface StructuredProductValuationRequest {
  productId: string;
  valuationDate: Date;
  modelType?: string;
  scenarioAnalysis?: boolean;
  includeGreeks?: boolean;
  customParameters?: Record<string, any>;
}

export interface StructuredProductValuationResponse {
  productId: string;
  valuationDate: Date;
  theoreticalValue: number;
  marketData: StructuredProductMarketData;
  modelResults: Record<string, any>;
  scenarioAnalysis?: PriceScenario[];
  calculationTime: number;
  warnings?: string[];
}

export interface BarrierMonitoringRequest {
  productIds?: string[];
  portfolioIds?: string[];
  alertThreshold?: number; // Distance threshold for alerts
  includeHitBarriers?: boolean;
}

export interface BarrierMonitoringResponse {
  monitoringDate: Date;
  activeBarriers: BarrierStatus[];
  alerts: BarrierAlert[];
  summary: {
    totalBarriers: number;
    activeBarriers: number;
    approachingBarriers: number;
    hitBarriers: number;
  };
}

export interface BarrierStatus {
  productId: string;
  productName: string;
  barrierId: string;
  barrierType: BarrierType;
  barrierLevel: number;
  currentLevel: number;
  distance: number;
  distancePercentage: number;
  isApproaching: boolean;
  hasBeenHit: boolean;
  hitDate?: Date;
}

// Search and Filter Types
export interface StructuredProductSearchRequest {
  tenantId: string;
  productTypes?: StructuredProductType[];
  issuers?: string[];
  underlyingTypes?: UnderlyingType[];
  maturityDateRange?: {
    startDate: Date;
    endDate: Date;
  };
  riskLevels?: RiskLevel[];
  hasBarrier?: boolean;
  isCallable?: boolean;
  hasCapitalProtection?: boolean;
  status?: DocumentStatus[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface StructuredProductSearchResponse {
  products: StructuredProduct[];
  total: number;
  aggregations: {
    byProductType: Record<StructuredProductType, number>;
    byIssuer: Record<string, number>;
    byRiskLevel: Record<RiskLevel, number>;
    averageMaturity: number;
    totalNotional: number;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
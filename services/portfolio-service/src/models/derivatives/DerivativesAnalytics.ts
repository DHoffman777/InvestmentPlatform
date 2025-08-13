// Derivatives Analytics Data Models
// Phase 3.5 - Comprehensive derivatives support with options and futures

export enum DerivativeType {
  CALL_OPTION = 'CALL_OPTION',
  PUT_OPTION = 'PUT_OPTION',
  FUTURE = 'FUTURE',
  SWAP = 'SWAP',
  FORWARD = 'FORWARD',
  WARRANT = 'WARRANT',
  CONVERTIBLE_BOND = 'CONVERTIBLE_BOND'
}

export enum OptionStyle {
  AMERICAN = 'AMERICAN',
  EUROPEAN = 'EUROPEAN',
  BERMUDAN = 'BERMUDAN',
  ASIAN = 'ASIAN',
  BARRIER = 'BARRIER',
  EXOTIC = 'EXOTIC'
}

export enum ExerciseType {
  PHYSICAL_DELIVERY = 'PHYSICAL_DELIVERY',
  CASH_SETTLEMENT = 'CASH_SETTLEMENT',
  CHOICE_OF_SETTLEMENT = 'CHOICE_OF_SETTLEMENT'
}

export enum OptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  EXERCISED = 'EXERCISED',
  ASSIGNED = 'ASSIGNED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum MarginType {
  INITIAL_MARGIN = 'INITIAL_MARGIN',
  MAINTENANCE_MARGIN = 'MAINTENANCE_MARGIN',
  VARIATION_MARGIN = 'VARIATION_MARGIN',
  SPAN_MARGIN = 'SPAN_MARGIN',
  PORTFOLIO_MARGIN = 'PORTFOLIO_MARGIN'
}

export enum VolatilityModel {
  BLACK_SCHOLES = 'BLACK_SCHOLES',
  BINOMIAL = 'BINOMIAL',
  TRINOMIAL = 'TRINOMIAL',
  MONTE_CARLO = 'MONTE_CARLO',
  HESTON = 'HESTON',
  LOCAL_VOLATILITY = 'LOCAL_VOLATILITY'
}

export enum StrategyType {
  SINGLE_OPTION = 'SINGLE_OPTION',
  COVERED_CALL = 'COVERED_CALL',
  PROTECTIVE_PUT = 'PROTECTIVE_PUT',
  STRADDLE = 'STRADDLE',
  STRANGLE = 'STRANGLE',
  SPREAD_BULL_CALL = 'SPREAD_BULL_CALL',
  SPREAD_BULL_PUT = 'SPREAD_BULL_PUT',
  SPREAD_BEAR_CALL = 'SPREAD_BEAR_CALL',
  SPREAD_BEAR_PUT = 'SPREAD_BEAR_PUT',
  IRON_CONDOR = 'IRON_CONDOR',
  IRON_BUTTERFLY = 'IRON_BUTTERFLY',
  COLLAR = 'COLLAR',
  CUSTOM = 'CUSTOM'
}

// Core derivative instrument interface
export interface DerivativeInstrument {
  id: string;
  tenantId: string;
  instrumentId: string;
  symbol: string;
  underlyingSymbol: string;
  underlyingInstrumentId: string;
  
  // Basic derivative information
  derivativeType: DerivativeType;
  exchange: string;
  currency: string;
  country: string;
  
  // Contract specifications
  contractSize: number;
  multiplier: number;
  tickSize: number;
  tickValue: number;
  
  // Dates
  issueDate: Date;
  expirationDate: Date;
  lastTradingDate: Date;
  settlementDate: Date;
  
  // Status and lifecycle
  status: OptionStatus;
  isActive: boolean;
  
  // Market data
  currentPrice: number;
  underlyingPrice: number;
  priceDate: Date;
  
  // Risk and margin
  initialMargin?: number;
  maintenanceMargin?: number;
  marginRequirement?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Options-specific interface
export interface OptionContract extends DerivativeInstrument {
  // Option-specific fields
  optionType: 'CALL' | 'PUT';
  optionStyle: OptionStyle;
  strikePrice: number;
  exerciseType: ExerciseType;
  
  // Premium and intrinsic value
  premium: number;
  intrinsicValue: number;
  timeValue: number;
  
  // Greeks
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  
  // Volatility
  impliedVolatility: number;
  historicalVolatility?: number;
  volatilityModel: VolatilityModel;
  
  // Exercise and assignment
  canExercise: boolean;
  exerciseHistory?: ExerciseEvent[];
  assignmentHistory?: AssignmentEvent[];
  
  // Dividend adjustments
  dividendAmount?: number;
  exDividendDate?: Date;
  dividendAdjusted?: boolean;
}

// Futures-specific interface
export interface FutureContract extends DerivativeInstrument {
  // Futures-specific fields
  futureType: string; // e.g., 'COMMODITY', 'FINANCIAL', 'EQUITY_INDEX'
  deliveryMonth: string; // e.g., 'MAR2024', 'JUN2024'
  deliveryLocation?: string;
  
  // Pricing
  settlementPrice: number;
  dailySettlement: number;
  markToMarket: number;
  
  // Margin
  initialMarginRate: number;
  maintenanceMarginRate: number;
  variationMargin: number;
  
  // Limits
  dailyPriceLimit?: number;
  positionLimit?: number;
  
  // Delivery
  deliveryMethod: ExerciseType;
  firstNoticeDate?: Date;
  lastDeliveryDate?: Date;
  
  // Position tracking
  openInterest?: number;
  volume?: number;
}

// Greeks calculation result
export interface GreeksCalculation {
  id: string;
  tenantId: string;
  instrumentId: string;
  calculationDate: Date;
  
  // First-order Greeks
  delta: number;
  deltaCash?: number; // Delta in cash terms
  
  // Second-order Greeks  
  gamma: number;
  gammaCash?: number;
  
  // Time decay
  theta: number;
  thetaDaily?: number; // Theta per day
  
  // Volatility sensitivity
  vega: number;
  vegaPercent?: number; // Vega per 1% vol change
  
  // Interest rate sensitivity
  rho: number;
  rhoPercent?: number; // Rho per 1% rate change
  
  // Additional Greeks
  lambda?: number; // Leverage/elasticity
  epsilon?: number; // Dividend sensitivity
  volga?: number; // Vega of vega
  vanna?: number; // Delta of vega
  charm?: number; // Delta of theta
  color?: number; // Gamma of theta
  
  // Calculation parameters
  underlyingPrice: number;
  volatility: number;
  riskFreeRate: number;
  dividendYield?: number;
  timeToExpiration: number; // In years
  
  // Metadata
  calculationMethod: VolatilityModel;
  calculationTime: number; // Milliseconds
  warnings?: string[];
}

// Implied volatility analysis
export interface ImpliedVolatilityAnalysis {
  id: string;
  tenantId: string;
  instrumentId: string;
  analysisDate: Date;
  
  // Current IV metrics
  impliedVolatility: number;
  bidIV?: number;
  askIV?: number;
  midIV?: number;
  
  // Historical context
  historicalVolatility: number;
  ivRank: number; // 0-100 percentile rank
  ivPercentile: number; // 0-1 percentile
  
  // IV surface data
  atmIV: number; // At-the-money IV
  skew: number; // IV skew metric
  termStructure: IVTermStructurePoint[];
  
  // Volatility metrics
  realizedVolatility?: number;
  volOfVol?: number; // Volatility of volatility
  meanReversion?: number;
  
  // Statistical measures
  ivStandardDeviation: number;
  confidence95Upper: number;
  confidence95Lower: number;
  
  // Term structure
  frontMonthIV?: number;
  backMonthIV?: number;
  termStructureSlope?: number;
  
  // Analysis metadata
  dataPoints: number;
  calculationMethod: string;
  warnings?: string[];
}

export interface IVTermStructurePoint {
  daysToExpiration: number;
  impliedVolatility: number;
  strike?: number;
  optionType?: 'CALL' | 'PUT';
}

// Option strategy definition
export interface OptionStrategy {
  id: string;
  tenantId: string;
  portfolioId?: string;
  
  // Strategy details
  strategyName: string;
  strategyType: StrategyType;
  description?: string;
  
  // Component legs
  legs: StrategyLeg[];
  
  // Strategy metrics
  maxProfit: number;
  maxLoss: number;
  breakeven: number[];
  probabilityOfProfit?: number;
  
  // Greeks aggregation
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  netRho: number;
  
  // Cost and margin
  netPremium: number; // Net debit/credit
  marginRequirement: number;
  buyingPower: number;
  
  // Risk metrics
  riskRewardRatio?: number;
  maximumDrawdown?: number;
  
  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expirationDate?: Date;
}

export interface StrategyLeg {
  id: string;
  instrumentId: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  strikePrice?: number;
  expirationDate?: Date;
  optionType?: 'CALL' | 'PUT';
  
  // Pricing
  entryPrice: number;
  currentPrice: number;
  premium: number;
  
  // Greeks contribution
  deltaContribution: number;
  gammaContribution: number;
  thetaContribution: number;
  vegaContribution: number;
  rhoContribution: number;
}

// Margin calculation request and result
export interface MarginCalculationRequest {
  tenantId: string;
  portfolioId?: string;
  positions: MarginPosition[];
  marginType: MarginType;
  
  // Market data
  underlyingPrices: Record<string, number>;
  volatilities: Record<string, number>;
  interestRates: Record<string, number>;
  
  // Calculation parameters
  calculationDate?: Date;
  scenarioShifts?: MarginScenario[];
}

export interface MarginPosition {
  instrumentId: string;
  quantity: number;
  price: number;
  side: 'LONG' | 'SHORT';
}

export interface MarginScenario {
  name: string;
  underlyingShift: number; // Percentage
  volatilityShift: number; // Absolute
  timeDecay: number; // Days
}

export interface MarginCalculationResult {
  id: string;
  requestId: string;
  tenantId: string;
  calculationDate: Date;
  
  // Margin requirements
  initialMargin: number;
  maintenanceMargin: number;
  variationMargin: number;
  
  // Position-level margins
  positionMargins: PositionMargin[];
  
  // Portfolio-level metrics
  portfolioMargin: number;
  netLiquidationValue: number;
  excessLiquidity: number;
  
  // Risk metrics
  portfolioRisk: number;
  concentrationRisk: number;
  liquidityRisk: number;
  
  // SPAN margin (for exchanges that use it)
  spanMargin?: number;
  
  // Calculation metadata
  calculationMethod: string;
  riskArrays?: any; // Exchange-specific risk arrays
  warnings?: string[];
}

export interface PositionMargin {
  instrumentId: string;
  initialMargin: number;
  maintenanceMargin: number;
  riskContribution: number;
  hedgeCredit?: number;
}

// Exercise and assignment events
export interface ExerciseEvent {
  id: string;
  tenantId: string;
  instrumentId: string;
  portfolioId: string;
  
  // Exercise details
  exerciseDate: Date;
  exercisePrice: number;
  exerciseQuantity: number;
  exerciseType: ExerciseType;
  
  // Settlement
  settlementDate: Date;
  settlementAmount: number;
  
  // Related transactions
  stockTransactionId?: string;
  cashTransactionId?: string;
  
  // Status
  status: 'PENDING' | 'SETTLED' | 'FAILED';
  createdAt: Date;
}

export interface AssignmentEvent {
  id: string;
  tenantId: string;
  instrumentId: string;
  portfolioId: string;
  
  // Assignment details
  assignmentDate: Date;
  assignmentPrice: number;
  assignmentQuantity: number;
  assignmentType: ExerciseType;
  
  // Settlement
  settlementDate: Date;
  settlementAmount: number;
  
  // Related transactions
  stockTransactionId?: string;
  cashTransactionId?: string;
  
  // Status
  status: 'PENDING' | 'SETTLED' | 'FAILED';
  createdAt: Date;
}

// Mark-to-market valuation
export interface MarkToMarketValuation {
  id: string;
  tenantId: string;
  instrumentId: string;
  valuationDate: Date;
  
  // Pricing
  marketPrice: number;
  theoreticalPrice: number;
  intrinsicValue: number;
  timeValue: number;
  
  // P&L
  unrealizedPnL: number;
  dailyPnL: number;
  inceptionPnL: number;
  
  // Greeks P&L attribution
  deltaPnL: number;
  gammaPnL: number;
  thetaPnL: number;
  vegaPnL: number;
  rhoPnL: number;
  residualPnL: number;
  
  // Valuation parameters
  underlyingPrice: number;
  volatility: number;
  riskFreeRate: number;
  dividendYield?: number;
  timeToExpiration: number;
  
  // Valuation method
  pricingModel: VolatilityModel;
  confidence: number;
  
  // Metadata
  dataSource: string;
  calculationTime: number;
  warnings?: string[];
}

// Portfolio-level derivatives analytics
export interface DerivativesPortfolioAnalytics {
  id: string;
  tenantId: string;
  portfolioId: string;
  analysisDate: Date;
  
  // Portfolio composition
  totalPositions: number;
  totalNotional: number;
  totalMarketValue: number;
  
  // Asset allocation
  optionsAllocation: number;
  futuresAllocation: number;
  otherDerivativesAllocation: number;
  
  // Greeks aggregation
  portfolioDelta: number;
  portfolioGamma: number;
  portfolioTheta: number;
  portfolioVega: number;
  portfolioRho: number;
  
  // Risk metrics
  portfolioVaR: number;
  maxDrawdown: number;
  sharpeRatio: number;
  
  // Strategy analysis
  activeStrategies: number;
  strategyBreakdown: StrategyBreakdown[];
  
  // Margin utilization
  totalMarginUsed: number;
  availableMargin: number;
  marginUtilization: number; // Percentage
  
  // Expiration analysis
  nearTermExpirations: ExpirationBucket[];
  
  // Performance
  totalReturn: number;
  dailyPnL: number;
  monthlyPnL: number;
  yearToDatePnL: number;
  
  // Metadata
  lastUpdated: Date;
  dataQuality: number;
  warnings?: string[];
}

export interface StrategyBreakdown {
  strategyType: StrategyType;
  count: number;
  totalNotional: number;
  totalMargin: number;
  netPnL: number;
}

export interface ExpirationBucket {
  expirationDate: Date;
  daysToExpiration: number;
  positionCount: number;
  totalNotional: number;
  totalGamma: number;
  totalTheta: number;
  rollRisk: number;
}

// API Request/Response interfaces
export interface GreeksCalculationRequest {
  instrumentId: string;
  underlyingPrice?: number;
  volatility?: number;
  riskFreeRate?: number;
  dividendYield?: number;
  calculationMethod?: VolatilityModel;
}

export interface ImpliedVolatilityRequest {
  instrumentId: string;
  optionPrice: number;
  underlyingPrice?: number;
  timeToExpiration?: number;
  riskFreeRate?: number;
  dividendYield?: number;
}

export interface StrategyBuilderRequest {
  tenantId: string;
  portfolioId?: string;
  strategyType: StrategyType;
  underlyingSymbol: string;
  legs: StrategyLegRequest[];
  
  // Optional parameters
  targetPrice?: number;
  riskTolerance?: number;
  timeHorizon?: number;
}

export interface StrategyLegRequest {
  optionType?: 'CALL' | 'PUT';
  side: 'BUY' | 'SELL';
  quantity: number;
  strikePrice?: number;
  expirationDate?: Date;
  instrumentId?: string;
}

// Search and filtering interfaces
export interface DerivativesSearchRequest {
  tenantId: string;
  underlyingSymbol?: string;
  derivativeTypes?: DerivativeType[];
  optionTypes?: ('CALL' | 'PUT')[];
  
  // Price filters
  strikePriceMin?: number;
  strikePriceMax?: number;
  premiumMin?: number;
  premiumMax?: number;
  
  // Time filters
  expirationDateMin?: Date;
  expirationDateMax?: Date;
  daysToExpirationMin?: number;
  daysToExpirationMax?: number;
  
  // Greeks filters
  deltaMin?: number;
  deltaMax?: number;
  gammaMin?: number;
  gammaMax?: number;
  thetaMin?: number;
  thetaMax?: number;
  vegaMin?: number;
  vegaMax?: number;
  
  // IV filters
  impliedVolatilityMin?: number;
  impliedVolatilityMax?: number;
  
  // Liquidity filters
  volumeMin?: number;
  openInterestMin?: number;
  bidAskSpreadMax?: number;
  
  // Pagination
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface DerivativesSearchResult {
  instruments: DerivativeInstrument[];
  total: number;
  aggregateMetrics: {
    averageDelta: number;
    averageGamma: number;
    averageTheta: number;
    averageVega: number;
    averageIV: number;
    totalVolume: number;
    totalOpenInterest: number;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
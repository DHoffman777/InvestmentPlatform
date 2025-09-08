// Order Management System (OMS) Data Models
// Comprehensive order lifecycle management with multi-asset support

export interface Order {
  id: string;
  tenantId: string;
  portfolioId: string;
  securityId: string;
  
  // Order identification
  clientOrderId: string;
  exchangeOrderId?: string;
  parentOrderId?: string; // For child orders from block trades
  
  // Order details
  orderType: OrderType;
  orderSide: OrderSide;
  timeInForce: TimeInForce;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  
  // Pricing
  orderPrice?: number; // null for market orders
  stopPrice?: number; // for stop orders
  limitPrice?: number; // for limit orders
  averageFillPrice?: number;
  
  // Order status and lifecycle
  orderStatus: OrderStatus;
  orderState: OrderState;
  
  // Execution details
  executionInstructions?: ExecutionInstruction[];
  routingInstructions?: RoutingInstruction;
  
  // Timing
  orderDate: Date;
  expirationDate?: Date;
  submittedAt?: Date;
  acknowledgedAt?: Date;
  lastModifiedAt: Date;
  
  // Trading session
  tradingSession: TradingSession;
  
  // Risk and compliance
  preTradeCheckStatus: PreTradeCheckStatus;
  riskLimits?: RiskLimits;
  complianceFlags?: ComplianceFlag[];
  
  // Allocation (for block orders)
  allocations?: OrderAllocation[];
  allocationMethod?: AllocationMethod;
  
  // Audit and tracking
  createdBy: string;
  modifiedBy?: string;
  cancelledBy?: string;
  cancelReason?: string;
  
  // Market data context
  marketDataSnapshot?: {
    bidPrice?: number;
    askPrice?: number;
    lastPrice?: number;
    timestamp: Date;
  };
  
  // Settlement
  settlementDate?: Date;
  settlementCurrency: string;
  
  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderExecution {
  id: string;
  tenantId: string;
  orderId: string;
  
  // Execution details
  executionId: string;
  executionPrice: number;
  executionQuantity: number;
  executionTime: Date;
  
  // Venue information
  executionVenue: string;
  executionVenueType: ExecutionVenueType;
  
  // Trade details
  tradeId: string;
  contraParty?: string;
  
  // Fees and costs
  commission?: number;
  regulatoryFees?: number;
  exchangeFees?: number;
  otherFees?: number;
  totalCosts?: number;
  
  // Settlement
  settlementDate: Date;
  settlementStatus: SettlementStatus;
  
  // Audit
  reportedBy: string;
  reportedAt: Date;
  
  createdAt: Date;
}

export interface OrderAllocation {
  id: string;
  orderId: string;
  tenantId: string;
  
  // Allocation target
  portfolioId: string;
  accountId?: string;
  
  // Allocation amounts
  requestedQuantity: number;
  allocatedQuantity: number;
  allocatedValue: number;
  
  // Allocation method details
  allocationPercentage?: number;
  allocationPriority?: number;
  
  // Status
  allocationStatus: AllocationStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SmartOrderRouting {
  id: string;
  tenantId: string;
  orderId: string;
  
  // Routing strategy
  routingAlgorithm: RoutingAlgorithm;
  routingParameters: Record<string, any>;
  
  // Venue preferences
  preferredVenues: string[];
  excludedVenues: string[];
  
  // Execution strategy
  executionStrategy: ExecutionStrategy;
  participationRate?: number; // for TWAP/VWAP
  maxParticipationRate?: number;
  
  // Dark pool preferences
  useDarkPools: boolean;
  darkPoolMinSize?: number;
  
  // Timing constraints
  startTime?: Date;
  endTime?: Date;
  
  // Performance metrics
  implementationShortfall?: number;
  volumeWeightedAveragePrice?: number;
  timeWeightedAveragePrice?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderRisk {
  id: string;
  tenantId: string;
  orderId: string;
  
  // Risk assessments
  preTradeRiskScore: number;
  concentrationRisk: number;
  liquidityRisk: number;
  marketRisk: number;
  
  // Risk limits
  positionLimit?: number;
  exposureLimit?: number;
  volumeLimit?: number;
  
  // Breach tracking
  riskBreaches: RiskBreach[];
  
  // Risk monitoring
  lastRiskCheck: Date;
  nextRiskCheck?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Enums and Types

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  MARKET_ON_CLOSE = 'MARKET_ON_CLOSE',
  LIMIT_ON_CLOSE = 'LIMIT_ON_CLOSE',
  ICEBERG = 'ICEBERG',
  HIDDEN = 'HIDDEN',
  PEGGED = 'PEGGED',
  BRACKET = 'BRACKET',
  ONE_CANCELS_OTHER = 'ONE_CANCELS_OTHER',
  ALGORITHMIC = 'ALGORITHMIC'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
  BUY_TO_COVER = 'BUY_TO_COVER',
  SELL_SHORT = 'SELL_SHORT'
}

export enum TimeInForce {
  DAY = 'DAY',
  GOOD_TILL_CANCELED = 'GOOD_TILL_CANCELED',
  IMMEDIATE_OR_CANCEL = 'IMMEDIATE_OR_CANCEL',
  FILL_OR_KILL = 'FILL_OR_KILL',
  GOOD_TILL_DATE = 'GOOD_TILL_DATE',
  AT_THE_OPENING = 'AT_THE_OPENING',
  AT_THE_CLOSE = 'AT_THE_CLOSE'
}

export enum OrderStatus {
  PENDING_NEW = 'PENDING_NEW',
  NEW = 'NEW',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  PENDING_CANCEL = 'PENDING_CANCEL',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  CALCULATED = 'CALCULATED',
  STOPPED = 'STOPPED'
}

export enum OrderState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  SUBMITTED = 'SUBMITTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_MARKET = 'IN_MARKET',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum TradingSession {
  PRE_MARKET = 'PRE_MARKET',
  REGULAR = 'REGULAR',
  POST_MARKET = 'POST_MARKET',
  EXTENDED_HOURS = 'EXTENDED_HOURS'
}

export enum PreTradeCheckStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
  BYPASSED = 'BYPASSED'
}

export enum ExecutionVenueType {
  EXCHANGE = 'EXCHANGE',
  DARK_POOL = 'DARK_POOL',
  ECN = 'ECN',
  MARKET_MAKER = 'MARKET_MAKER',
  CROSSING_NETWORK = 'CROSSING_NETWORK',
  INTERNAL = 'INTERNAL'
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL'
}

export enum AllocationStatus {
  PENDING = 'PENDING',
  ALLOCATED = 'ALLOCATED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED'
}

export enum AllocationMethod {
  PROPORTIONAL = 'PROPORTIONAL',
  PRIORITY = 'PRIORITY',
  MANUAL = 'MANUAL',
  FIFO = 'FIFO',
  PRO_RATA = 'PRO_RATA'
}

export enum RoutingAlgorithm {
  SMART_ORDER_ROUTING = 'SMART_ORDER_ROUTING',
  TWAP = 'TWAP',
  VWAP = 'VWAP',
  IMPLEMENTATION_SHORTFALL = 'IMPLEMENTATION_SHORTFALL',
  PARTICIPATION_RATE = 'PARTICIPATION_RATE',
  ARRIVAL_PRICE = 'ARRIVAL_PRICE'
}

export enum ExecutionStrategy {
  AGGRESSIVE = 'AGGRESSIVE',
  PASSIVE = 'PASSIVE',
  NEUTRAL = 'NEUTRAL',
  OPPORTUNISTIC = 'OPPORTUNISTIC'
}

export interface ExecutionInstruction {
  type: ExecutionInstructionType;
  value?: string | number;
  priority: number;
}

export enum ExecutionInstructionType {
  NOT_HELD = 'NOT_HELD',
  WORK = 'WORK',
  GO_ALONG = 'GO_ALONG',
  OVER_THE_DAY = 'OVER_THE_DAY',
  HELD = 'HELD',
  PARTICIPATE_DONT_INITIATE = 'PARTICIPATE_DONT_INITIATE',
  STRICT_SCALE = 'STRICT_SCALE',
  TRY_TO_SCALE = 'TRY_TO_SCALE',
  STAY_ON_BID_SIDE = 'STAY_ON_BID_SIDE',
  STAY_ON_OFFER_SIDE = 'STAY_ON_OFFER_SIDE',
  NO_CROSS = 'NO_CROSS',
  OK_TO_CROSS = 'OK_TO_CROSS',
  CALL_FIRST = 'CALL_FIRST',
  PERCENT_OF_VOLUME = 'PERCENT_OF_VOLUME'
}

export interface RoutingInstruction {
  preferredVenues: string[];
  excludedVenues: string[];
  routingMethod: string;
  maxFloor?: number;
  reserveQuantity?: number;
}

export interface RiskLimits {
  maxOrderValue: number;
  maxOrderQuantity: number;
  maxPositionLimit: number;
  maxExposureLimit: number;
  concentrationLimit: number;
}

export interface ComplianceFlag {
  type: ComplianceFlagType;
  severity: ComplianceSeverity;
  description: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export enum ComplianceFlagType {
  RESTRICTED_LIST = 'RESTRICTED_LIST',
  CONCENTRATION_LIMIT = 'CONCENTRATION_LIMIT',
  SUITABILITY = 'SUITABILITY',
  WASH_SALE = 'WASH_SALE',
  BEST_EXECUTION = 'BEST_EXECUTION',
  REGULATORY_LIMIT = 'REGULATORY_LIMIT'
}

export enum ComplianceSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  BLOCKING = 'BLOCKING'
}

export interface RiskBreach {
  type: RiskBreachType;
  severity: RiskSeverity;
  description: string;
  breachValue: number;
  limitValue: number;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export enum RiskBreachType {
  POSITION_LIMIT = 'POSITION_LIMIT',
  EXPOSURE_LIMIT = 'EXPOSURE_LIMIT',
  CONCENTRATION_LIMIT = 'CONCENTRATION_LIMIT',
  VOLUME_LIMIT = 'VOLUME_LIMIT',
  LIQUIDITY_RISK = 'LIQUIDITY_RISK',
  MARKET_RISK = 'MARKET_RISK'
}

export enum RiskSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Request/Response Interfaces

export interface CreateOrderRequest {
  portfolioId: string;
  securityId: string;
  orderType: OrderType;
  orderSide: OrderSide;
  quantity: number;
  timeInForce: TimeInForce;
  orderPrice?: number;
  stopPrice?: number;
  limitPrice?: number;
  tradingSession?: TradingSession;
  executionInstructions?: ExecutionInstruction[];
  routingInstructions?: RoutingInstruction;
  expirationDate?: Date;
  allocations?: Omit<OrderAllocation, 'id' | 'orderId' | 'tenantId' | 'createdAt' | 'updatedAt'>[];
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ModifyOrderRequest {
  orderId: string;
  quantity?: number;
  orderPrice?: number;
  stopPrice?: number;
  limitPrice?: number;
  timeInForce?: TimeInForce;
  expirationDate?: Date;
  executionInstructions?: ExecutionInstruction[];
  routingInstructions?: RoutingInstruction;
}

export interface CancelOrderRequest {
  orderId: string;
  cancelReason?: string;
}

export interface OrderSearchRequest {
  portfolioIds?: string[];
  instrumentIds?: string[];
  orderTypes?: OrderType[];
  orderStatuses?: OrderStatus[];
  orderStates?: OrderState[];
  fromDate?: Date;
  toDate?: Date;
  createdBy?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface OrderSearchResult {
  orders: Order[];
  total: number;
  hasMore: boolean;
  searchCriteria: OrderSearchRequest;
}

export interface OrderValidationResult {
  orderId: string;
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  riskScore?: number;
  estimatedCosts?: OrderCostEstimate;
}

export interface OrderCostEstimate {
  estimatedCommission: number;
  estimatedFees: number;
  estimatedMarketImpact: number;
  estimatedTotalCost: number;
  priceImpactBps?: number;
}

export interface BestExecutionReport {
  orderId: string;
  executionQuality: ExecutionQuality;
  benchmarkComparison: BenchmarkComparison;
  venueAnalysis: VenueAnalysis[];
  recommendations: string[];
  generatedAt: Date;
}

export interface ExecutionQuality {
  implementation_shortfall: number;
  priceImprovement: number;
  fillRate: number;
  averageExecutionTime: number;
  slippage: number;
}

export interface BenchmarkComparison {
  vwap: number;
  twap: number;
  arrivalPrice: number;
  closePrice: number;
  performanceVsVwap: number;
  performanceVsTwap: number;
}

export interface VenueAnalysis {
  venue: string;
  fillRate: number;
  averagePrice: number;
  speedOfExecution: number;
  priceImprovement: number;
  marketShare: number;
}
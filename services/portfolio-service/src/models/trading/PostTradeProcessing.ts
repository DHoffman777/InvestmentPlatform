// Post-Trade Processing Data Models
// This module defines all data structures for post-trade processing including
// trade confirmation, settlement, custodian integration, and regulatory reporting

export enum TradeConfirmationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  AFFIRMED = 'AFFIRMED',
  REJECTED = 'REJECTED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED'
}

export enum TradeBreakType {
  PRICE_DISCREPANCY = 'PRICE_DISCREPANCY',
  QUANTITY_DISCREPANCY = 'QUANTITY_DISCREPANCY',
  SETTLEMENT_DISCREPANCY = 'SETTLEMENT_DISCREPANCY',
  MISSING_COUNTERPARTY = 'MISSING_COUNTERPARTY',
  INVALID_INSTRUMENT = 'INVALID_INSTRUMENT',
  DUPLICATE_TRADE = 'DUPLICATE_TRADE',
  LATE_MATCHING = 'LATE_MATCHING'
}

export enum TradeBreakSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TradeBreakStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED'
}

export enum SettlementInstructionType {
  DELIVERY_VERSUS_PAYMENT = 'DVP',
  RECEIVE_VERSUS_PAYMENT = 'RVP',
  FREE_OF_PAYMENT = 'FOP',
  DELIVERY_FREE_OF_PAYMENT = 'DFOP'
}

export enum SettlementInstructionStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  MATCHED = 'MATCHED',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum CustodianMessageType {
  SETTLEMENT_INSTRUCTION = 'SETTLEMENT_INSTRUCTION',
  POSITION_UPDATE = 'POSITION_UPDATE',
  CASH_BALANCE = 'CASH_BALANCE',
  CORPORATE_ACTION = 'CORPORATE_ACTION',
  TRADE_CONFIRMATION = 'TRADE_CONFIRMATION',
  ERROR_NOTIFICATION = 'ERROR_NOTIFICATION'
}

export enum CustodianMessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  RETRY = 'RETRY'
}

export enum RegulatoryReportType {
  FORM_13F = 'FORM_13F',
  FORM_PF = 'FORM_PF',
  BEST_EXECUTION = 'BEST_EXECUTION',
  TRADE_REPORTING_FACILITY = 'TRF',
  CONSOLIDATED_AUDIT_TRAIL = 'CAT',
  SWAP_DATA_REPOSITORY = 'SDR',
  TRANSACTION_REPORTING = 'TRANSACTION_REPORTING'
}

export enum RegulatoryReportStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  AMENDED = 'AMENDED'
}

export enum TransactionCostAnalysisType {
  IMPLEMENTATION_SHORTFALL = 'IMPLEMENTATION_SHORTFALL',
  VOLUME_WEIGHTED_AVERAGE_PRICE = 'VWAP',
  TIME_WEIGHTED_AVERAGE_PRICE = 'TWAP',
  ARRIVAL_PRICE = 'ARRIVAL_PRICE',
  MARKET_IMPACT = 'MARKET_IMPACT',
  TIMING_COST = 'TIMING_COST'
}

// Core Trade Confirmation Interface
export interface TradeConfirmation {
  id: string;
  tenantId: string;
  tradeId: string;
  orderId: string;
  executionId: string;
  
  // Trade Details
  securityId: string;
  quantity: number;
  price: number;
  grossAmount: number;
  netAmount: number;
  tradeDate: Date;
  settlementDate: Date;
  
  // Counterparty Information
  counterpartyId: string;
  counterpartyName: string;
  brokerDealerId?: string;
  
  // Confirmation Status
  confirmationStatus: TradeConfirmationStatus;
  confirmationMethod: string; // 'ELECTRONIC', 'MANUAL', 'PHONE', 'EMAIL'
  
  // Timing
  confirmationSentAt?: Date;
  confirmationReceivedAt?: Date;
  affirmedAt?: Date;
  
  // Settlement Instructions
  settlementInstructionId?: string;
  custodianInstructions?: any;
  
  // Commission and Fees
  commission: number;
  exchangeFees: number;
  regulatoryFees: number;
  otherFees: number;
  
  // Metadata
  confirmationReference: string;
  externalTradeId?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
}

// Settlement Instruction Interface
export interface SettlementInstruction {
  id: string;
  tenantId: string;
  tradeConfirmationId: string;
  
  // Instruction Type and Details
  instructionType: SettlementInstructionType;
  instructionStatus: SettlementInstructionStatus;
  
  // Settlement Details
  settlementDate: Date;
  securityId: string;
  quantity: number;
  settlementAmount: number;
  settlementCurrency: string;
  
  // Delivery Instructions
  deliveryAccount?: string;
  deliveryCustodian?: string;
  deliveryLocation?: string;
  
  // Receiving Instructions
  receiveAccount?: string;
  receiveCustodian?: string;
  receiveLocation?: string;
  
  // Cash Settlement
  cashAccount?: string;
  cashCurrency?: string;
  cashAmount?: number;
  
  // Processing
  sentToCustodianAt?: Date;
  acknowledgedAt?: Date;
  matchedAt?: Date;
  settledAt?: Date;
  
  // External References
  custodianReference?: string;
  dtcReference?: string;
  swiftReference?: string;
  
  // Metadata
  priority: number; // 1=highest, 5=lowest
  automaticRetry: boolean;
  maxRetries: number;
  retryCount: number;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Trade Break Management Interface
export interface TradeBreak {
  id: string;
  tenantId: string;
  tradeId: string;
  orderId?: string;
  executionId?: string;
  
  // Break Details
  breakType: TradeBreakType;
  severity: TradeBreakSeverity;
  status: TradeBreakStatus;
  
  // Discrepancy Information
  expectedValue: any;
  actualValue: any;
  discrepancyAmount?: number;
  discrepancyPercentage?: number;
  
  // Description and Resolution
  description: string;
  potentialCause?: string;
  resolutionNotes?: string;
  
  // Assignment and Tracking
  assignedTo?: string;
  reportedBy: string;
  reportedAt: Date;
  
  // Timeline
  detectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalatedAt?: Date;
  
  // Priority and SLA
  priority: number;
  slaDeadline: Date;
  
  // Related Records
  relatedBreakIds?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Custodian Integration Interface
export interface CustodianMessage {
  id: string;
  tenantId: string;
  custodianId: string;
  
  // Message Details
  messageType: CustodianMessageType;
  messageFormat: string; // 'FIX', 'SWIFT', 'XML', 'JSON', 'CSV'
  messageStatus: CustodianMessageStatus;
  
  // Content
  messageContent: any;
  rawMessage?: string;
  
  // Processing
  sentAt?: Date;
  acknowledgedAt?: Date;
  processedAt?: Date;
  
  // References
  externalReference?: string;
  relatedTradeId?: string;
  relatedOrderId?: string;
  
  // Error Handling
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Regulatory Reporting Interface
export interface RegulatoryReport {
  id: string;
  tenantId: string;
  reportType: RegulatoryReportType;
  reportStatus: RegulatoryReportStatus;
  
  // Report Period
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  reportingDate: Date;
  
  // Content
  reportData: any;
  reportSummary?: any;
  
  // Submission Details
  regulatorId: string; // SEC, FINRA, CFTC, etc.
  submissionId?: string;
  submittedAt?: Date;
  acknowledgedAt?: Date;
  
  // Review Process
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  
  // File Management
  reportFileName?: string;
  reportFileSize?: number;
  reportFileHash?: string;
  
  // Amendments
  isAmendment: boolean;
  originalReportId?: string;
  amendmentReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Cost Analysis Interface
export interface TransactionCostAnalysis {
  id: string;
  tenantId: string;
  orderId: string;
  
  // Analysis Type and Period
  analysisType: TransactionCostAnalysisType;
  analysisDate: Date;
  
  // Benchmark Data
  arrivalPrice: number;
  vwapPrice: number;
  twapPrice: number;
  closingPrice: number;
  
  // Execution Data
  averageExecutionPrice: number;
  totalExecutedQuantity: number;
  totalExecutionValue: number;
  
  // Cost Components
  marketImpactCost: number;
  timingCost: number;
  spreadCost: number;
  commissionCost: number;
  
  // Performance Metrics
  implementationShortfall: number;
  implementationShortfallBps: number;
  priceImprovementBps: number;
  
  // Benchmark Comparisons
  performanceVsVwap: number;
  performanceVsTwap: number;
  performanceVsArrival: number;
  performanceVsClose: number;
  
  // Market Context
  marketVolatility: number;
  averageDailyVolume: number;
  marketCapitalization?: number;
  
  // Attribution
  managerPerformance: number;
  marketMovement: number;
  timingDecision: number;
  
  // Metadata
  analysisNotes?: string;
  dataQualityScore: number;
  
  createdAt: Date;
  createdBy: string;
}

// Trade Matching Interface
export interface TradeMatch {
  id: string;
  tenantId: string;
  
  // Trade References
  internalTradeId: string;
  externalTradeId: string;
  counterpartyTradeId?: string;
  
  // Matching Status
  matchStatus: 'MATCHED' | 'UNMATCHED' | 'BREAK' | 'EXCEPTION';
  matchConfidence: number; // 0-100
  
  // Matched Fields
  instrumentMatched: boolean;
  quantityMatched: boolean;
  priceMatched: boolean;
  settlementDateMatched: boolean;
  counterpartyMatched: boolean;
  
  // Tolerance Settings Used
  priceToleranceBps: number;
  quantityToleranceShares: number;
  dateToleranceDays: number;
  
  // Discrepancies
  priceDiscrepancy?: number;
  quantityDiscrepancy?: number;
  dateDiscrepancy?: number;
  
  // Processing
  matchedAt: Date;
  matchedBy: string; // 'AUTOMATIC' or user ID
  reviewedBy?: string;
  
  // Break Management
  tradeBreakId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Interfaces

export interface CreateTradeConfirmationRequest {
  tradeId: string;
  orderId: string;
  executionId: string;
  counterpartyId: string;
  confirmationMethod: string;
  notes?: string;
}

export interface UpdateTradeConfirmationRequest {
  confirmationId: string;
  confirmationStatus: TradeConfirmationStatus;
  affirmedAt?: Date;
  notes?: string;
}

export interface CreateSettlementInstructionRequest {
  tradeConfirmationId: string;
  instructionType: SettlementInstructionType;
  deliveryAccount?: string;
  receiveAccount?: string;
  cashAccount?: string;
  priority?: number;
}

export interface CreateTradeBreakRequest {
  tradeId: string;
  breakType: TradeBreakType;
  severity: TradeBreakSeverity;
  description: string;
  expectedValue: any;
  actualValue: any;
  assignedTo?: string;
}

export interface SendCustodianMessageRequest {
  custodianId: string;
  messageType: CustodianMessageType;
  messageContent: any;
  relatedTradeId?: string;
  priority?: number;
}

export interface CreateRegulatoryReportRequest {
  reportType: RegulatoryReportType;
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  regulatorId: string;
  reportData: any;
}

export interface RunTransactionCostAnalysisRequest {
  orderId: string;
  analysisType: TransactionCostAnalysisType;
  benchmarkData?: any;
}

export interface TradeMatchingRequest {
  internalTradeId: string;
  externalTradeId: string;
  priceToleranceBps?: number;
  quantityToleranceShares?: number;
  dateToleranceDays?: number;
}

// Search and Filter Interfaces

export interface TradeConfirmationSearchRequest {
  portfolioIds?: string[];
  instrumentIds?: string[];
  counterpartyIds?: string[];
  confirmationStatuses?: TradeConfirmationStatus[];
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface TradeBreakSearchRequest {
  breakTypes?: TradeBreakType[];
  severities?: TradeBreakSeverity[];
  statuses?: TradeBreakStatus[];
  assignedTo?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SettlementInstructionSearchRequest {
  instructionTypes?: SettlementInstructionType[];
  statuses?: SettlementInstructionStatus[];
  custodians?: string[];
  fromSettlementDate?: Date;
  toSettlementDate?: Date;
  limit?: number;
  offset?: number;
}

// Response Interfaces

export interface PostTradeProcessingSummary {
  totalTradeConfirmations: number;
  pendingConfirmations: number;
  confirmedTrades: number;
  rejectedTrades: number;
  
  totalSettlementInstructions: number;
  pendingSettlements: number;
  settledInstructions: number;
  failedSettlements: number;
  
  totalTradeBreaks: number;
  openBreaks: number;
  criticalBreaks: number;
  averageResolutionTimeHours: number;
  
  regulatoryReportsThisPeriod: number;
  pendingReports: number;
  submittedReports: number;
}

export interface TradeConfirmationSearchResult {
  confirmations: TradeConfirmation[];
  total: number;
  hasMore: boolean;
  searchCriteria: TradeConfirmationSearchRequest;
}

export interface TradeBreakSearchResult {
  breaks: TradeBreak[];
  total: number;
  hasMore: boolean;
  searchCriteria: TradeBreakSearchRequest;
}

export interface SettlementInstructionSearchResult {
  instructions: SettlementInstruction[];
  total: number;
  hasMore: boolean;
  searchCriteria: SettlementInstructionSearchRequest;
}
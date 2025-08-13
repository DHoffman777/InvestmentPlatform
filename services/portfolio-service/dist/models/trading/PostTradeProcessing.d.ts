export declare enum TradeConfirmationStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    AFFIRMED = "AFFIRMED",
    REJECTED = "REJECTED",
    DISPUTED = "DISPUTED",
    CANCELLED = "CANCELLED"
}
export declare enum TradeBreakType {
    PRICE_DISCREPANCY = "PRICE_DISCREPANCY",
    QUANTITY_DISCREPANCY = "QUANTITY_DISCREPANCY",
    SETTLEMENT_DISCREPANCY = "SETTLEMENT_DISCREPANCY",
    MISSING_COUNTERPARTY = "MISSING_COUNTERPARTY",
    INVALID_INSTRUMENT = "INVALID_INSTRUMENT",
    DUPLICATE_TRADE = "DUPLICATE_TRADE",
    LATE_MATCHING = "LATE_MATCHING"
}
export declare enum TradeBreakSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum TradeBreakStatus {
    OPEN = "OPEN",
    INVESTIGATING = "INVESTIGATING",
    RESOLVED = "RESOLVED",
    ESCALATED = "ESCALATED",
    CLOSED = "CLOSED"
}
export declare enum SettlementInstructionType {
    DELIVERY_VERSUS_PAYMENT = "DVP",
    RECEIVE_VERSUS_PAYMENT = "RVP",
    FREE_OF_PAYMENT = "FOP",
    DELIVERY_FREE_OF_PAYMENT = "DFOP"
}
export declare enum SettlementInstructionStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    MATCHED = "MATCHED",
    SETTLED = "SETTLED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum CustodianMessageType {
    SETTLEMENT_INSTRUCTION = "SETTLEMENT_INSTRUCTION",
    POSITION_UPDATE = "POSITION_UPDATE",
    CASH_BALANCE = "CASH_BALANCE",
    CORPORATE_ACTION = "CORPORATE_ACTION",
    TRADE_CONFIRMATION = "TRADE_CONFIRMATION",
    ERROR_NOTIFICATION = "ERROR_NOTIFICATION"
}
export declare enum CustodianMessageStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    PROCESSED = "PROCESSED",
    FAILED = "FAILED",
    RETRY = "RETRY"
}
export declare enum RegulatoryReportType {
    FORM_13F = "FORM_13F",
    FORM_PF = "FORM_PF",
    BEST_EXECUTION = "BEST_EXECUTION",
    TRADE_REPORTING_FACILITY = "TRF",
    CONSOLIDATED_AUDIT_TRAIL = "CAT",
    SWAP_DATA_REPOSITORY = "SDR",
    TRANSACTION_REPORTING = "TRANSACTION_REPORTING"
}
export declare enum RegulatoryReportStatus {
    DRAFT = "DRAFT",
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    SUBMITTED = "SUBMITTED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    AMENDED = "AMENDED"
}
export declare enum TransactionCostAnalysisType {
    IMPLEMENTATION_SHORTFALL = "IMPLEMENTATION_SHORTFALL",
    VOLUME_WEIGHTED_AVERAGE_PRICE = "VWAP",
    TIME_WEIGHTED_AVERAGE_PRICE = "TWAP",
    ARRIVAL_PRICE = "ARRIVAL_PRICE",
    MARKET_IMPACT = "MARKET_IMPACT",
    TIMING_COST = "TIMING_COST"
}
export interface TradeConfirmation {
    id: string;
    tenantId: string;
    tradeId: string;
    orderId: string;
    executionId: string;
    instrumentId: string;
    quantity: number;
    price: number;
    grossAmount: number;
    netAmount: number;
    tradeDate: Date;
    settlementDate: Date;
    counterpartyId: string;
    counterpartyName: string;
    brokerDealerId?: string;
    confirmationStatus: TradeConfirmationStatus;
    confirmationMethod: string;
    confirmationSentAt?: Date;
    confirmationReceivedAt?: Date;
    affirmedAt?: Date;
    settlementInstructionId?: string;
    custodianInstructions?: any;
    commission: number;
    exchangeFees: number;
    regulatoryFees: number;
    otherFees: number;
    confirmationReference: string;
    externalTradeId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    modifiedBy?: string;
}
export interface SettlementInstruction {
    id: string;
    tenantId: string;
    tradeConfirmationId: string;
    instructionType: SettlementInstructionType;
    instructionStatus: SettlementInstructionStatus;
    settlementDate: Date;
    instrumentId: string;
    quantity: number;
    settlementAmount: number;
    settlementCurrency: string;
    deliveryAccount?: string;
    deliveryCustodian?: string;
    deliveryLocation?: string;
    receiveAccount?: string;
    receiveCustodian?: string;
    receiveLocation?: string;
    cashAccount?: string;
    cashCurrency?: string;
    cashAmount?: number;
    sentToCustodianAt?: Date;
    acknowledgedAt?: Date;
    matchedAt?: Date;
    settledAt?: Date;
    custodianReference?: string;
    dtcReference?: string;
    swiftReference?: string;
    priority: number;
    automaticRetry: boolean;
    maxRetries: number;
    retryCount: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface TradeBreak {
    id: string;
    tenantId: string;
    tradeId: string;
    orderId?: string;
    executionId?: string;
    breakType: TradeBreakType;
    severity: TradeBreakSeverity;
    status: TradeBreakStatus;
    expectedValue: any;
    actualValue: any;
    discrepancyAmount?: number;
    discrepancyPercentage?: number;
    description: string;
    potentialCause?: string;
    resolutionNotes?: string;
    assignedTo?: string;
    reportedBy: string;
    reportedAt: Date;
    detectedAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    escalatedAt?: Date;
    priority: number;
    slaDeadline: Date;
    relatedBreakIds?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface CustodianMessage {
    id: string;
    tenantId: string;
    custodianId: string;
    messageType: CustodianMessageType;
    messageFormat: string;
    messageStatus: CustodianMessageStatus;
    messageContent: any;
    rawMessage?: string;
    sentAt?: Date;
    acknowledgedAt?: Date;
    processedAt?: Date;
    externalReference?: string;
    relatedTradeId?: string;
    relatedOrderId?: string;
    errorCode?: string;
    errorMessage?: string;
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface RegulatoryReport {
    id: string;
    tenantId: string;
    reportType: RegulatoryReportType;
    reportStatus: RegulatoryReportStatus;
    reportingPeriodStart: Date;
    reportingPeriodEnd: Date;
    reportingDate: Date;
    reportData: any;
    reportSummary?: any;
    regulatorId: string;
    submissionId?: string;
    submittedAt?: Date;
    acknowledgedAt?: Date;
    preparedBy: string;
    reviewedBy?: string;
    approvedBy?: string;
    reportFileName?: string;
    reportFileSize?: number;
    reportFileHash?: string;
    isAmendment: boolean;
    originalReportId?: string;
    amendmentReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TransactionCostAnalysis {
    id: string;
    tenantId: string;
    orderId: string;
    analysisType: TransactionCostAnalysisType;
    analysisDate: Date;
    arrivalPrice: number;
    vwapPrice: number;
    twapPrice: number;
    closingPrice: number;
    averageExecutionPrice: number;
    totalExecutedQuantity: number;
    totalExecutionValue: number;
    marketImpactCost: number;
    timingCost: number;
    spreadCost: number;
    commissionCost: number;
    implementationShortfall: number;
    implementationShortfallBps: number;
    priceImprovementBps: number;
    performanceVsVwap: number;
    performanceVsTwap: number;
    performanceVsArrival: number;
    performanceVsClose: number;
    marketVolatility: number;
    averageDailyVolume: number;
    marketCapitalization?: number;
    managerPerformance: number;
    marketMovement: number;
    timingDecision: number;
    analysisNotes?: string;
    dataQualityScore: number;
    createdAt: Date;
    createdBy: string;
}
export interface TradeMatch {
    id: string;
    tenantId: string;
    internalTradeId: string;
    externalTradeId: string;
    counterpartyTradeId?: string;
    matchStatus: 'MATCHED' | 'UNMATCHED' | 'BREAK' | 'EXCEPTION';
    matchConfidence: number;
    instrumentMatched: boolean;
    quantityMatched: boolean;
    priceMatched: boolean;
    settlementDateMatched: boolean;
    counterpartyMatched: boolean;
    priceToleranceBps: number;
    quantityToleranceShares: number;
    dateToleranceDays: number;
    priceDiscrepancy?: number;
    quantityDiscrepancy?: number;
    dateDiscrepancy?: number;
    matchedAt: Date;
    matchedBy: string;
    reviewedBy?: string;
    tradeBreakId?: string;
    createdAt: Date;
    updatedAt: Date;
}
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

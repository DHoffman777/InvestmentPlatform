import { Decimal } from '@prisma/client/runtime/library';

export enum CustodianType {
  SCHWAB = 'SCHWAB',
  FIDELITY = 'FIDELITY', 
  PERSHING = 'PERSHING',
  BNY_MELLON = 'BNY_MELLON',
  STATE_STREET = 'STATE_STREET',
  JP_MORGAN = 'JP_MORGAN',
  NORTHERN_TRUST = 'NORTHERN_TRUST',
  CUSTOM = 'CUSTOM'
}

export enum CustodianConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
  SUSPENDED = 'SUSPENDED',
  MAINTENANCE = 'MAINTENANCE'
}

export enum APIConnectionType {
  REST_API = 'REST_API',
  SFTP = 'SFTP',
  FTP = 'FTP',
  WEBSOCKET = 'WEBSOCKET',
  DIRECT_CONNECT = 'DIRECT_CONNECT',
  FILE_BASED = 'FILE_BASED'
}

export enum DataFeedType {
  POSITIONS = 'POSITIONS',
  TRANSACTIONS = 'TRANSACTIONS',
  CASH_BALANCES = 'CASH_BALANCES',
  CORPORATE_ACTIONS = 'CORPORATE_ACTIONS',
  SETTLEMENTS = 'SETTLEMENTS',
  DIVIDENDS = 'DIVIDENDS',
  INTEREST = 'INTEREST',
  FEES = 'FEES',
  TAX_LOTS = 'TAX_LOTS',
  MARKET_DATA = 'MARKET_DATA'
}

export enum ReconciliationStatus {
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  PARTIALLY_MATCHED = 'PARTIALLY_MATCHED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  RESOLVED = 'RESOLVED',
  EXCEPTION = 'EXCEPTION'
}

export enum FileProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  SKIPPED = 'SKIPPED'
}

export interface CustodianConnection {
  id: string;
  tenantId: string;
  custodianType: CustodianType;
  custodianName: string;
  custodianCode: string;
  connectionType: APIConnectionType;
  connectionConfig: CustodianConnectionConfig;
  status: CustodianConnectionStatus;
  lastSuccessfulConnection: Date | null;
  lastConnectionAttempt: Date | null;
  connectionRetries: number;
  maxRetries: number;
  isActive: boolean;
  supportedFeatures: CustodianFeature[];
  rateLimits: RateLimit[];
  errorLog: ConnectionError[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CustodianConnectionConfig {
  baseUrl?: string;
  apiVersion?: string;
  authentication: AuthenticationConfig;
  endpoints: EndpointConfig;
  fileTransfer?: FileTransferConfig;
  dataMapping: DataMappingConfig;
  schedules: ScheduleConfig[];
  retryPolicy: RetryPolicy;
  timeouts: TimeoutConfig;
  encryption: EncryptionConfig;
}

export interface AuthenticationConfig {
  type: 'API_KEY' | 'OAUTH2' | 'CERTIFICATE' | 'BASIC_AUTH' | 'TOKEN';
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    certificatePath?: string;
    username?: string;
    password?: string;
    tokenEndpoint?: string;
    scope?: string;
  };
  tokenRefreshInterval?: number;
  expiresAt?: Date;
}

export interface EndpointConfig {
  positions: string;
  transactions: string;
  cashBalances: string;
  corporateActions: string;
  settlements: string;
  orderSubmission?: string;
  documentRetrieval?: string;
  accountInformation: string;
}

export interface FileTransferConfig {
  protocol: 'SFTP' | 'FTP' | 'FTPS';
  host: string;
  port: number;
  directory: string;
  archiveDirectory?: string;
  filePattern: string;
  compression?: 'ZIP' | 'GZIP' | 'NONE';
  encryption?: 'PGP' | 'AES' | 'NONE';
}

export interface DataMappingConfig {
  positionMapping: FieldMapping[];
  transactionMapping: FieldMapping[];
  cashBalanceMapping: FieldMapping[];
  corporateActionMapping: FieldMapping[];
  dateFormats: DateFormatConfig;
  numberFormats: NumberFormatConfig;
  customFields: CustomFieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'DECIMAL';
  required: boolean;
  transformation?: string;
  validation?: ValidationRule[];
}

export interface DateFormatConfig {
  inputFormat: string;
  outputFormat: string;
  timezone: string;
}

export interface NumberFormatConfig {
  decimalSeparator: string;
  thousandSeparator: string;
  negativeFormat: string;
  currencySymbol?: string;
}

export interface CustomFieldMapping {
  custodianField: string;
  portfolioField: string;
  fieldType: string;
  defaultValue?: string;
}

export interface ValidationRule {
  type: 'REQUIRED' | 'RANGE' | 'REGEX' | 'ENUM' | 'CUSTOM';
  parameter?: any;
  errorMessage: string;
}

export interface ScheduleConfig {
  feedType: DataFeedType;
  frequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';
  scheduledTime?: string;
  timezone: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface TimeoutConfig {
  connectionTimeout: number;
  readTimeout: number;
  requestTimeout: number;
}

export interface EncryptionConfig {
  inTransit: {
    protocol: 'TLS_1_2' | 'TLS_1_3';
    certificateValidation: boolean;
  };
  atRest: {
    algorithm: 'AES_256' | 'AES_128';
    keyRotationInterval: number;
  };
}

export interface CustodianFeature {
  feature: string;
  isSupported: boolean;
  version?: string;
  limitations?: string[];
}

export interface RateLimit {
  endpoint: string;
  requests: number;
  window: number;
  burst?: number;
}

export interface ConnectionError {
  timestamp: Date;
  errorCode: string;
  errorMessage: string;
  endpoint?: string;
  retryAttempt: number;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface PositionFeed {
  id: string;
  custodianConnectionId: string;
  tenantId: string;
  portfolioId: string;
  accountNumber: string;
  processingDate: Date;
  asOfDate: Date;
  feedType: DataFeedType;
  sourceFile?: string;
  recordCount: number;
  processedCount: number;
  errorCount: number;
  positions: CustodianPosition[];
  processingStatus: FileProcessingStatus;
  processingStarted: Date;
  processingCompleted?: Date;
  processingErrors: ProcessingError[];
  reconciliationResults: ReconciliationResult[];
  checksums: FileChecksum;
  createdAt: Date;
  processedBy: string;
}

export interface CustodianPosition {
  id: string;
  positionFeedId: string;
  custodianAccountId: string;
  symbol: string;
  cusip?: string;
  isin?: string;
  description: string;
  assetType: string;
  quantity: Decimal;
  unitPrice: Decimal;
  marketValue: Decimal;
  costBasis: Decimal;
  unrealizedGainLoss: Decimal;
  currency: string;
  settlementDate?: Date;
  maturityDate?: Date;
  dividendRate?: Decimal;
  yieldToMaturity?: Decimal;
  custodianSpecificData: Record<string, any>;
  taxLots: CustodianTaxLot[];
  lastUpdated: Date;
}

export interface CustodianTaxLot {
  id: string;
  custodianPositionId: string;
  lotNumber: string;
  quantity: Decimal;
  unitCost: Decimal;
  acquisitionDate: Date;
  shortTerm: boolean;
  originalQuantity: Decimal;
  adjustments: TaxLotAdjustment[];
}

export interface TaxLotAdjustment {
  id: string;
  adjustmentType: 'SPLIT' | 'DIVIDEND' | 'SPINOFF' | 'MERGER' | 'RETURN_OF_CAPITAL';
  adjustmentDate: Date;
  adjustmentRatio?: Decimal;
  adjustmentAmount?: Decimal;
  description: string;
}

export interface TransactionFeed {
  id: string;
  custodianConnectionId: string;
  tenantId: string;
  portfolioId: string;
  accountNumber: string;
  processingDate: Date;
  tradeDateFrom: Date;
  tradeDateTo: Date;
  feedType: DataFeedType;
  sourceFile?: string;
  recordCount: number;
  processedCount: number;
  errorCount: number;
  transactions: CustodianTransaction[];
  processingStatus: FileProcessingStatus;
  processingStarted: Date;
  processingCompleted?: Date;
  processingErrors: ProcessingError[];
  reconciliationResults: ReconciliationResult[];
  checksums: FileChecksum;
  createdAt: Date;
  processedBy: string;
}

export interface CustodianTransaction {
  id: string;
  transactionFeedId: string;
  custodianAccountId: string;
  custodianTransactionId: string;
  transactionType: string;
  symbol: string;
  cusip?: string;
  isin?: string;
  description: string;
  tradeDate: Date;
  settlementDate: Date;
  quantity: Decimal;
  unitPrice: Decimal;
  grossAmount: Decimal;
  netAmount: Decimal;
  fees: Decimal;
  commission: Decimal;
  taxes: Decimal;
  accrued_interest?: Decimal;
  currency: string;
  exchangeRate?: Decimal;
  orderNumber?: string;
  buySellIndicator: 'BUY' | 'SELL';
  custodianSpecificData: Record<string, any>;
  relatedTransactions: string[];
  lastUpdated: Date;
}

export interface CashBalanceFeed {
  id: string;
  custodianConnectionId: string;
  tenantId: string;
  portfolioId: string;
  accountNumber: string;
  processingDate: Date;
  asOfDate: Date;
  feedType: DataFeedType;
  sourceFile?: string;
  recordCount: number;
  processedCount: number;
  errorCount: number;
  balances: CustodianCashBalance[];
  processingStatus: FileProcessingStatus;
  processingStarted: Date;
  processingCompleted?: Date;
  processingErrors: ProcessingError[];
  reconciliationResults: ReconciliationResult[];
  checksums: FileChecksum;
  createdAt: Date;
  processedBy: string;
}

export interface CustodianCashBalance {
  id: string;
  cashBalanceFeedId: string;
  custodianAccountId: string;
  currency: string;
  accountType: 'CASH' | 'MARGIN' | 'SHORT' | 'DIVIDEND' | 'INTEREST';
  balance: Decimal;
  availableBalance: Decimal;
  pendingCredits: Decimal;
  pendingDebits: Decimal;
  interestRate?: Decimal;
  minimumBalance?: Decimal;
  lastUpdated: Date;
}

export interface CorporateActionFeed {
  id: string;
  custodianConnectionId: string;
  tenantId: string;
  portfolioId?: string;
  processingDate: Date;
  effectiveDateFrom: Date;
  effectiveDateTo: Date;
  feedType: DataFeedType;
  sourceFile?: string;
  recordCount: number;
  processedCount: number;
  errorCount: number;
  corporateActions: CustodianCorporateAction[];
  processingStatus: FileProcessingStatus;
  processingStarted: Date;
  processingCompleted?: Date;
  processingErrors: ProcessingError[];
  reconciliationResults: ReconciliationResult[];
  checksums: FileChecksum;
  createdAt: Date;
  processedBy: string;
}

export interface CustodianCorporateAction {
  id: string;
  corporateActionFeedId: string;
  custodianActionId: string;
  symbol: string;
  cusip?: string;
  isin?: string;
  actionType: 'DIVIDEND' | 'STOCK_SPLIT' | 'STOCK_DIVIDEND' | 'SPINOFF' | 'MERGER' | 'RIGHTS' | 'CALL' | 'TENDER';
  announcementDate: Date;
  exDate: Date;
  recordDate: Date;
  payableDate: Date;
  effectiveDate: Date;
  description: string;
  cashRate?: Decimal;
  stockRate?: Decimal;
  newSymbol?: string;
  exchangeRatio?: Decimal;
  currency: string;
  custodianSpecificData: Record<string, any>;
  lastUpdated: Date;
}

export interface ProcessingError {
  id: string;
  recordNumber: number;
  fieldName?: string;
  errorType: 'VALIDATION' | 'TRANSFORMATION' | 'BUSINESS_RULE' | 'SYSTEM';
  errorCode: string;
  errorMessage: string;
  rawData?: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface ReconciliationResult {
  id: string;
  feedId: string;
  reconciliationType: 'POSITION' | 'TRANSACTION' | 'CASH_BALANCE' | 'CORPORATE_ACTION';
  custodianRecord: Record<string, any>;
  portfolioRecord?: Record<string, any>;
  status: ReconciliationStatus;
  discrepancies: Discrepancy[];
  tolerance: Decimal;
  reconciledAt: Date;
  reconciledBy: string;
  notes?: string;
}

export interface Discrepancy {
  field: string;
  custodianValue: any;
  portfolioValue: any;
  difference: any;
  percentageDifference?: Decimal;
  withinTolerance: boolean;
}

export interface FileChecksum {
  md5?: string;
  sha256?: string;
  recordCount: number;
  totalAmount?: Decimal;
  balanceHash?: string;
}

export interface CustodianAPI {
  id: string;
  custodianConnectionId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestHeaders: Record<string, string>;
  requestBody?: Record<string, any>;
  responseHeaders?: Record<string, string>;
  responseBody?: Record<string, any>;
  statusCode?: number;
  responseTime: number;
  requestTimestamp: Date;
  responseTimestamp?: Date;
  success: boolean;
  errorMessage?: string;
  retryCount: number;
}

export interface OrderSubmission {
  id: string;
  custodianConnectionId: string;
  tenantId: string;
  portfolioId: string;
  internalOrderId: string;
  custodianOrderId?: string;
  symbol: string;
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  side: 'BUY' | 'SELL';
  quantity: Decimal;
  price?: Decimal;
  stopPrice?: Decimal;
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  orderStatus: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED';
  submissionStatus: 'PREPARING' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'FAILED';
  submittedAt?: Date;
  acknowledgedAt?: Date;
  filledQuantity?: Decimal;
  averageFillPrice?: Decimal;
  commissions?: Decimal;
  custodianSpecificData: Record<string, any>;
  submissionErrors: OrderSubmissionError[];
  createdAt: Date;
  updatedAt: Date;
  submittedBy: string;
}

export interface OrderSubmissionError {
  errorCode: string;
  errorMessage: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
  resolved: boolean;
}

export interface DocumentRetrieval {
  id: string;
  custodianConnectionId: string;
  tenantId: string;
  portfolioId?: string;
  documentType: 'STATEMENT' | 'CONFIRMATION' | 'TAX_DOCUMENT' | 'PROSPECTUS' | 'ANNUAL_REPORT' | 'PROXY';
  documentDate: Date;
  accountNumber?: string;
  symbol?: string;
  documentId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl?: string;
  localPath?: string;
  retrievalStatus: 'PENDING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';
  retrievedAt?: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  requestedBy: string;
}

export interface CustodianReportingConfig {
  custodianConnectionId: string;
  reportType: string;
  schedule: ScheduleConfig;
  recipients: string[];
  deliveryMethod: 'EMAIL' | 'SFTP' | 'API';
  template: string;
  parameters: Record<string, any>;
  lastGenerated?: Date;
  nextGeneration?: Date;
  isActive: boolean;
}

export interface CustodianBalanceReconciliation {
  id: string;
  tenantId: string;
  custodianConnectionId: string;
  portfolioId: string;
  reconciliationDate: Date;
  positionsReconciled: number;
  positionsMatched: number;
  positionsUnmatched: number;
  cashBalancesReconciled: number;
  cashBalancesMatched: number;
  cashBalancesUnmatched: number;
  totalDiscrepancies: number;
  materialDiscrepancies: number;
  reconciliationScore: Decimal;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NEEDS_REVIEW';
  startedAt: Date;
  completedAt?: Date;
  performedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  discrepancyReport: string;
}

export interface CustodianPerformanceMetrics {
  custodianConnectionId: string;
  metricDate: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  uptimePercentage: Decimal;
  dataQualityScore: Decimal;
  reconciliationAccuracy: Decimal;
  slaCompliance: Decimal;
  errorRate: Decimal;
  recordsProcessed: number;
  processingTime: number;
}

export interface CustodianAlert {
  id: string;
  custodianConnectionId: string;
  tenantId: string;
  alertType: 'CONNECTION_FAILED' | 'DATA_QUALITY' | 'RECONCILIATION_FAILED' | 'SLA_BREACH' | 'HIGH_ERROR_RATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  threshold?: Decimal;
  actualValue?: Decimal;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  escalated: boolean;
  escalatedAt?: Date;
  escalatedTo?: string;
  metadata: Record<string, any>;
}

// Request/Response Interfaces
export interface CustodianConnectionRequest {
  custodianType: CustodianType;
  custodianName: string;
  custodianCode: string;
  connectionType: APIConnectionType;
  connectionConfig: CustodianConnectionConfig;
  supportedFeatures: CustodianFeature[];
  rateLimits: RateLimit[];
}

export interface CustodianConnectionResponse {
  connection: CustodianConnection;
  testResults: ConnectionTestResult[];
}

export interface ConnectionTestResult {
  testType: 'AUTHENTICATION' | 'CONNECTIVITY' | 'DATA_RETRIEVAL' | 'ORDER_SUBMISSION';
  success: boolean;
  responseTime: number;
  errorMessage?: string;
  details?: Record<string, any>;
}

export interface DataFeedRequest {
  custodianConnectionId: string;
  feedType: DataFeedType;
  portfolioId?: string;
  accountNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  forceRefresh?: boolean;
}

export interface DataFeedResponse {
  feedId: string;
  status: FileProcessingStatus;
  recordCount: number;
  estimatedCompletion?: Date;
  errors: ProcessingError[];
}

export interface ReconciliationRequest {
  custodianConnectionId: string;
  portfolioId: string;
  reconciliationType: 'POSITION' | 'TRANSACTION' | 'CASH_BALANCE' | 'FULL';
  asOfDate: Date;
  tolerance: Decimal;
  includeExclusions: boolean;
}

export interface ReconciliationResponse {
  reconciliationId: string;
  status: ReconciliationStatus;
  summary: ReconciliationSummary;
  results: ReconciliationResult[];
}

export interface ReconciliationSummary {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  discrepancyCount: number;
  materialDiscrepancies: number;
  reconciledValue: Decimal;
  discrepancyAmount: Decimal;
  accuracyPercentage: Decimal;
}

export interface OrderSubmissionRequest {
  custodianConnectionId: string;
  portfolioId: string;
  orders: OrderDetails[];
  executionMode: 'IMMEDIATE' | 'SCHEDULED' | 'CONDITIONAL';
  scheduledTime?: Date;
  conditions?: OrderCondition[];
}

export interface OrderDetails {
  internalOrderId: string;
  symbol: string;
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  side: 'BUY' | 'SELL';
  quantity: Decimal;
  price?: Decimal;
  stopPrice?: Decimal;
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  accountNumber: string;
  specialInstructions?: string;
}

export interface OrderCondition {
  type: 'PRICE' | 'TIME' | 'VOLUME' | 'CUSTOM';
  parameter: string;
  value: any;
  operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
}

export interface OrderSubmissionResponse {
  submissionId: string;
  orderStatuses: OrderStatus[];
  overallStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  errors: OrderSubmissionError[];
}

export interface OrderStatus {
  internalOrderId: string;
  custodianOrderId?: string;
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED';
  rejectionReason?: string;
  filledQuantity?: Decimal;
  averageFillPrice?: Decimal;
}

export interface DocumentRetrievalRequest {
  custodianConnectionId: string;
  portfolioId?: string;
  documentType: 'STATEMENT' | 'CONFIRMATION' | 'TAX_DOCUMENT' | 'PROSPECTUS' | 'ANNUAL_REPORT' | 'PROXY';
  dateFrom?: Date;
  dateTo?: Date;
  accountNumber?: string;
  symbol?: string;
  deliveryMethod: 'DOWNLOAD_LINK' | 'LOCAL_STORAGE' | 'EMAIL';
}

export interface DocumentRetrievalResponse {
  requestId: string;
  documents: DocumentInfo[];
  status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  estimatedCompletion?: Date;
}

export interface DocumentInfo {
  documentId: string;
  fileName: string;
  fileSize: number;
  documentDate: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  status: 'PENDING' | 'AVAILABLE' | 'EXPIRED' | 'ERROR';
}
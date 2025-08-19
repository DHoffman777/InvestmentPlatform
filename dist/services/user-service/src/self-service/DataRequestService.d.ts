import { EventEmitter } from 'events';
export interface DataRequest {
    id: string;
    userId: string;
    tenantId: string;
    type: DataRequestType;
    status: RequestStatus;
    priority: RequestPriority;
    requestedAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    expiresAt?: Date;
    requestData: RequestData;
    processingDetails: ProcessingDetails;
    deliveryDetails: DeliveryDetails;
    legalBasis: LegalBasis;
    compliance: ComplianceInfo;
    auditTrail: RequestAuditEntry[];
    metadata: Record<string, any>;
}
export interface RequestData {
    categories: DataCategory[];
    dateRange?: DateRange;
    format: ExportFormat;
    includeMetadata: boolean;
    includeDeleted: boolean;
    includeArchived: boolean;
    specificFields?: string[];
    exclusions?: string[];
    filters: DataFilter[];
    grouping?: GroupingOptions;
    anonymization?: AnonymizationOptions;
    customInstructions?: string;
}
export interface ProcessingDetails {
    estimatedProcessingTime: number;
    actualProcessingTime?: number;
    recordsFound: number;
    recordsProcessed: number;
    recordsExported: number;
    recordsDeleted: number;
    recordsAnonymized: number;
    errors: ProcessingError[];
    warnings: ProcessingWarning[];
    completionPercentage: number;
    currentStage: ProcessingStage;
    stages: ProcessingStageInfo[];
    resourceUsage: ResourceUsage;
}
export interface DeliveryDetails {
    method: DeliveryMethod;
    destination: string;
    encryptionEnabled: boolean;
    encryptionKey?: string;
    passwordProtected: boolean;
    downloadUrl?: string;
    downloadExpiry?: Date;
    deliveredAt?: Date;
    accessCount: number;
    lastAccessedAt?: Date;
    deliveryAttempts: number;
    maxDeliveryAttempts: number;
    deliveryErrors: string[];
}
export interface LegalBasis {
    regulation: DataRegulation;
    article?: string;
    justification: string;
    lawfulBasis: LawfulBasis;
    consentEvidence?: ConsentEvidence;
    legitimateInterest?: LegitimateInterest;
    contractualBasis?: ContractualBasis;
    vitalInterest?: VitalInterest;
    publicTask?: PublicTask;
}
export interface ComplianceInfo {
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
    pipedaCompliant: boolean;
    lgpdCompliant: boolean;
    requiredNotifications: NotificationRequirement[];
    retentionPolicies: RetentionPolicy[];
    dataClassifications: DataClassification[];
    crossBorderTransfer: CrossBorderTransfer;
    thirdPartyDisclosure: ThirdPartyDisclosure[];
    dataMinimization: DataMinimization;
}
export interface RequestAuditEntry {
    id: string;
    timestamp: Date;
    action: RequestAction;
    performedBy: string;
    details: string;
    previousStatus?: RequestStatus;
    newStatus?: RequestStatus;
    ipAddress: string;
    userAgent: string;
    systemInfo: SystemInfo;
}
export interface DateRange {
    startDate: Date;
    endDate: Date;
    timezone: string;
}
export interface DataFilter {
    field: string;
    operator: FilterOperator;
    value: any;
    caseSensitive: boolean;
}
export interface GroupingOptions {
    groupBy: string[];
    aggregations: AggregationFunction[];
    sortBy: SortOptions[];
}
export interface AnonymizationOptions {
    method: AnonymizationMethod;
    fields: string[];
    preserveStatistics: boolean;
    hashingSalt?: string;
    customRules: AnonymizationRule[];
}
export interface ProcessingError {
    id: string;
    timestamp: Date;
    stage: ProcessingStage;
    errorCode: string;
    message: string;
    details: Record<string, any>;
    severity: ErrorSeverity;
    isRetryable: boolean;
    retryCount: number;
    resolved: boolean;
    resolution?: string;
}
export interface ProcessingWarning {
    id: string;
    timestamp: Date;
    stage: ProcessingStage;
    message: string;
    recommendation: string;
    impact: WarningImpact;
}
export interface ProcessingStageInfo {
    stage: ProcessingStage;
    status: StageStatus;
    startTime?: Date;
    endTime?: Date;
    progress: number;
    estimatedTimeRemaining: number;
    description: string;
    dependencies: ProcessingStage[];
}
export interface ResourceUsage {
    cpuTime: number;
    memoryUsage: number;
    diskUsage: number;
    networkTransfer: number;
    databaseQueries: number;
    apiCalls: number;
    cost: number;
}
export interface ConsentEvidence {
    consentId: string;
    consentDate: Date;
    consentMethod: ConsentMethod;
    consentVersion: string;
    consentText: string;
    withdrawalDate?: Date;
    isActive: boolean;
}
export interface LegitimateInterest {
    purpose: string;
    balancingTest: BalancingTest;
    dataSubjectRights: DataSubjectRight[];
    optOutMechanism: OptOutMechanism;
}
export interface ContractualBasis {
    contractId: string;
    contractType: ContractType;
    necessity: ContractNecessity;
    performanceRequired: boolean;
}
export interface VitalInterest {
    threatDescription: string;
    urgency: UrgencyLevel;
    alternativeMeans: string[];
    dataSubjectConsent: boolean;
}
export interface PublicTask {
    authority: string;
    legalBasis: string;
    publicInterest: string;
    necessity: TaskNecessity;
}
export interface NotificationRequirement {
    recipient: NotificationRecipient;
    method: NotificationMethod;
    timeframe: number;
    completed: boolean;
    completedAt?: Date;
    evidence?: string;
}
export interface RetentionPolicy {
    category: DataCategory;
    retentionPeriod: number;
    destructionMethod: DestructionMethod;
    exceptions: RetentionException[];
    complianceReferences: string[];
}
export interface DataClassification {
    category: DataCategory;
    sensitivity: SensitivityLevel;
    confidentiality: ConfidentialityLevel;
    integrityRequirement: IntegrityLevel;
    availabilityRequirement: AvailabilityLevel;
    regulatoryRequirements: string[];
}
export interface CrossBorderTransfer {
    isRequired: boolean;
    destinationCountries: string[];
    adequacyDecision: boolean;
    safeguards: TransferSafeguard[];
    derogations: TransferDerogation[];
    impactAssessment: TransferImpactAssessment;
}
export interface ThirdPartyDisclosure {
    recipient: string;
    purpose: string;
    legalBasis: LawfulBasis;
    dataCategories: DataCategory[];
    safeguards: DisclosureSafeguard[];
    contractualArrangements: string[];
}
export interface DataMinimization {
    purposeLimitation: boolean;
    dataRelevance: RelevanceAssessment;
    storageMinimization: StorageMinimization;
    accessLimitation: AccessLimitation;
    retentionMinimization: RetentionMinimization;
}
export interface SystemInfo {
    version: string;
    environment: string;
    requestId: string;
    sessionId?: string;
    correlationId?: string;
}
export interface SortOptions {
    field: string;
    direction: SortDirection;
    priority: number;
}
export interface AnonymizationRule {
    field: string;
    method: AnonymizationMethod;
    parameters: Record<string, any>;
    preserveFormat: boolean;
    consistency: boolean;
}
export interface BalancingTest {
    conductedAt: Date;
    conductedBy: string;
    factors: BalancingFactor[];
    conclusion: string;
    reviewDate: Date;
}
export interface DataSubjectRight {
    right: SubjectRight;
    isApplicable: boolean;
    mechanism: string;
    timeframe: number;
}
export interface OptOutMechanism {
    method: OptOutMethod;
    instructions: string;
    effectiveDate: Date;
    confirmationRequired: boolean;
}
export interface BalancingFactor {
    factor: string;
    weight: number;
    justification: string;
    impact: FactorImpact;
}
export interface TransferSafeguard {
    type: SafeguardType;
    description: string;
    implementation: string;
    effectiveDate: Date;
    reviewDate: Date;
}
export interface TransferDerogation {
    article: string;
    condition: string;
    justification: string;
    isOneOff: boolean;
    documentationReference: string;
}
export interface TransferImpactAssessment {
    conductedAt: Date;
    riskLevel: RiskLevel;
    mitigationMeasures: MitigationMeasure[];
    conclusion: string;
    reviewDate: Date;
}
export interface DisclosureSafeguard {
    type: SafeguardType;
    description: string;
    contractualProvision: string;
    monitoringMechanism: string;
}
export interface RelevanceAssessment {
    purpose: string;
    necessaryData: string[];
    excessiveData: string[];
    justification: string;
    reviewDate: Date;
}
export interface StorageMinimization {
    policy: string;
    implementation: string;
    monitoring: string;
    effectiveness: EffectivenessRating;
}
export interface AccessLimitation {
    accessControls: AccessControl[];
    needToKnowBasis: boolean;
    authorizedPersonnel: string[];
    accessLogging: boolean;
}
export interface RetentionMinimization {
    policy: string;
    automatedDeletion: boolean;
    reviewSchedule: string;
    exceptions: RetentionException[];
}
export interface AccessControl {
    type: AccessControlType;
    implementation: string;
    effectiveness: EffectivenessRating;
    lastReview: Date;
}
export interface RetentionException {
    reason: ExceptionReason;
    extendedPeriod: number;
    justification: string;
    approval: string;
    reviewDate: Date;
}
export interface MitigationMeasure {
    measure: string;
    implementation: string;
    effectiveness: EffectivenessRating;
    cost: number;
    timeframe: number;
}
export declare enum DataRequestType {
    EXPORT = "export",// GDPR Article 15, CCPA Right to Know
    DELETION = "deletion",// GDPR Article 17, CCPA Right to Delete
    RECTIFICATION = "rectification",// GDPR Article 16
    PORTABILITY = "portability",// GDPR Article 20, CCPA Right to Portability
    RESTRICTION = "restriction",// GDPR Article 18
    OBJECTION = "objection",// GDPR Article 21, CCPA Right to Opt-Out
    ANONYMIZATION = "anonymization",
    PSEUDONYMIZATION = "pseudonymization"
}
export declare enum RequestStatus {
    SUBMITTED = "submitted",
    VALIDATED = "validated",
    IN_PROGRESS = "in_progress",
    PROCESSING = "processing",
    COMPLETED = "completed",
    DELIVERED = "delivered",
    FAILED = "failed",
    CANCELLED = "cancelled",
    EXPIRED = "expired",
    PARTIALLY_COMPLETED = "partially_completed"
}
export declare enum RequestPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent",
    CRITICAL = "critical"
}
export declare enum DataCategory {
    PERSONAL_INFO = "personal_info",
    CONTACT_INFO = "contact_info",
    FINANCIAL_INFO = "financial_info",
    TRADING_DATA = "trading_data",
    PORTFOLIO_DATA = "portfolio_data",
    ACTIVITY_LOGS = "activity_logs",
    PREFERENCES = "preferences",
    DEVICE_INFO = "device_info",
    LOCATION_DATA = "location_data",
    BIOMETRIC_DATA = "biometric_data",
    HEALTH_DATA = "health_data",
    COMMUNICATION_DATA = "communication_data",
    METADATA = "metadata",
    SYSTEM_DATA = "system_data"
}
export declare enum ExportFormat {
    JSON = "json",
    XML = "xml",
    CSV = "csv",
    PDF = "pdf",
    EXCEL = "excel",
    PARQUET = "parquet",
    AVRO = "avro"
}
export declare enum ProcessingStage {
    VALIDATION = "validation",
    DATA_DISCOVERY = "data_discovery",
    LEGAL_REVIEW = "legal_review",
    DATA_EXTRACTION = "data_extraction",
    DATA_PROCESSING = "data_processing",
    ANONYMIZATION = "anonymization",
    FORMATTING = "formatting",
    QUALITY_CHECK = "quality_check",
    PACKAGING = "packaging",
    DELIVERY = "delivery",
    CLEANUP = "cleanup"
}
export declare enum DeliveryMethod {
    EMAIL = "email",
    SECURE_DOWNLOAD = "secure_download",
    SFTP = "sftp",
    API = "api",
    PHYSICAL_MEDIA = "physical_media",
    SECURE_PORTAL = "secure_portal"
}
export declare enum DataRegulation {
    GDPR = "gdpr",
    CCPA = "ccpa",
    PIPEDA = "pipeda",
    LGPD = "lgpd",
    PDPA_SINGAPORE = "pdpa_singapore",
    PDPB_INDIA = "pdpb_india",
    POPIA = "popia"
}
export declare enum LawfulBasis {
    CONSENT = "consent",
    CONTRACT = "contract",
    LEGAL_OBLIGATION = "legal_obligation",
    VITAL_INTERESTS = "vital_interests",
    PUBLIC_TASK = "public_task",
    LEGITIMATE_INTERESTS = "legitimate_interests"
}
export declare enum RequestAction {
    SUBMITTED = "submitted",
    VALIDATED = "validated",
    APPROVED = "approved",
    REJECTED = "rejected",
    STARTED_PROCESSING = "started_processing",
    COMPLETED_STAGE = "completed_stage",
    FAILED_STAGE = "failed_stage",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    EXTENDED = "extended"
}
export declare enum FilterOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains",
    STARTS_WITH = "starts_with",
    ENDS_WITH = "ends_with",
    IN = "in",
    NOT_IN = "not_in",
    REGEX = "regex",
    IS_NULL = "is_null",
    IS_NOT_NULL = "is_not_null"
}
export declare enum AggregationFunction {
    COUNT = "count",
    SUM = "sum",
    AVG = "avg",
    MIN = "min",
    MAX = "max",
    DISTINCT_COUNT = "distinct_count"
}
export declare enum AnonymizationMethod {
    REDACTION = "redaction",
    HASHING = "hashing",
    PSEUDONYMIZATION = "pseudonymization",
    GENERALIZATION = "generalization",
    SUPPRESSION = "suppression",
    NOISE_ADDITION = "noise_addition",
    TOKENIZATION = "tokenization",
    MASKING = "masking"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum WarningImpact {
    MINIMAL = "minimal",
    MODERATE = "moderate",
    SIGNIFICANT = "significant"
}
export declare enum StageStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    SKIPPED = "skipped"
}
export declare enum ConsentMethod {
    EXPLICIT = "explicit",
    IMPLIED = "implied",
    OPT_IN = "opt_in",
    OPT_OUT = "opt_out",
    GRANULAR = "granular"
}
export declare enum ContractType {
    SERVICE_AGREEMENT = "service_agreement",
    EMPLOYMENT = "employment",
    PARTNERSHIP = "partnership",
    LICENSING = "licensing",
    OTHER = "other"
}
export declare enum ContractNecessity {
    PERFORMANCE = "performance",
    PRE_CONTRACTUAL = "pre_contractual",
    POST_CONTRACTUAL = "post_contractual"
}
export declare enum UrgencyLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum TaskNecessity {
    ESSENTIAL = "essential",
    SUPPORTING = "supporting",
    ANCILLARY = "ancillary"
}
export declare enum NotificationRecipient {
    DATA_SUBJECT = "data_subject",
    REGULATORY_AUTHORITY = "regulatory_authority",
    THIRD_PARTY = "third_party",
    INTERNAL_TEAM = "internal_team"
}
export declare enum NotificationMethod {
    EMAIL = "email",
    POSTAL_MAIL = "postal_mail",
    PHONE = "phone",
    IN_APP = "in_app",
    WEBSITE_NOTICE = "website_notice",
    REGULATORY_PORTAL = "regulatory_portal"
}
export declare enum DestructionMethod {
    SECURE_DELETE = "secure_delete",
    PHYSICAL_DESTRUCTION = "physical_destruction",
    CRYPTOGRAPHIC_ERASURE = "cryptographic_erasure",
    OVERWRITING = "overwriting"
}
export declare enum SensitivityLevel {
    PUBLIC = "public",
    INTERNAL = "internal",
    CONFIDENTIAL = "confidential",
    RESTRICTED = "restricted",
    TOP_SECRET = "top_secret"
}
export declare enum ConfidentialityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export declare enum IntegrityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export declare enum AvailabilityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export declare enum SafeguardType {
    CONTRACTUAL = "contractual",
    TECHNICAL = "technical",
    ORGANIZATIONAL = "organizational",
    LEGAL = "legal"
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export declare enum EffectivenessRating {
    POOR = "poor",
    FAIR = "fair",
    GOOD = "good",
    EXCELLENT = "excellent"
}
export declare enum AccessControlType {
    ROLE_BASED = "role_based",
    ATTRIBUTE_BASED = "attribute_based",
    DISCRETIONARY = "discretionary",
    MANDATORY = "mandatory"
}
export declare enum ExceptionReason {
    LEGAL_REQUIREMENT = "legal_requirement",
    LITIGATION_HOLD = "litigation_hold",
    REGULATORY_INQUIRY = "regulatory_inquiry",
    AUDIT_REQUIREMENT = "audit_requirement",
    BUSINESS_NECESSITY = "business_necessity"
}
export declare enum SortDirection {
    ASC = "asc",
    DESC = "desc"
}
export declare enum SubjectRight {
    ACCESS = "access",
    RECTIFICATION = "rectification",
    ERASURE = "erasure",
    RESTRICTION = "restriction",
    PORTABILITY = "portability",
    OBJECTION = "objection",
    AUTOMATED_DECISION_MAKING = "automated_decision_making"
}
export declare enum OptOutMethod {
    EMAIL_LINK = "email_link",
    WEB_FORM = "web_form",
    PHONE = "phone",
    POSTAL_MAIL = "postal_mail",
    IN_APP = "in_app"
}
export declare enum FactorImpact {
    POSITIVE = "positive",
    NEGATIVE = "negative",
    NEUTRAL = "neutral"
}
export declare class DataRequestService extends EventEmitter {
    private dataRequests;
    private processingQueue;
    private dataCategories;
    private regulatoryTimeframes;
    constructor();
    submitDataRequest(userId: string, tenantId: string, requestType: DataRequestType, requestData: RequestData, legalBasis: LegalBasis, ipAddress: string, userAgent: string): Promise<DataRequest>;
    getDataRequest(requestId: string, userId: string): Promise<DataRequest | null>;
    getUserDataRequests(userId: string, tenantId: string, filter?: {
        type?: DataRequestType;
        status?: RequestStatus;
        dateRange?: DateRange;
        limit?: number;
    }): Promise<DataRequest[]>;
    cancelDataRequest(requestId: string, userId: string, reason: string, ipAddress: string, userAgent: string): Promise<boolean>;
    processDataRequest(requestId: string): Promise<void>;
    downloadRequestResult(requestId: string, userId: string, downloadToken?: string): Promise<{
        url: string;
        expiresAt: Date;
    } | null>;
    getRequestStatus(requestId: string, userId: string): Promise<{
        status: RequestStatus;
        progress: number;
        currentStage: ProcessingStage;
        estimatedCompletion?: Date;
        errors: ProcessingError[];
        warnings: ProcessingWarning[];
    } | null>;
    generateDataInventoryReport(userId: string, tenantId: string): Promise<{
        categories: Array<{
            category: DataCategory;
            recordCount: number;
            oldestRecord: Date;
            newestRecord: Date;
            sizeEstimate: number;
            sources: string[];
        }>;
        totalRecords: number;
        totalSize: number;
        retentionSummary: Record<DataCategory, number>;
        complianceStatus: Record<DataRegulation, boolean>;
    }>;
    private validateRequest;
    private calculateRequestPriority;
    private calculateExpiryDate;
    private estimateProcessingTime;
    private initializeProcessingStages;
    private generateComplianceInfo;
    private estimateRequestSize;
    private processStage;
    private processValidationStage;
    private processDataDiscoveryStage;
    private processLegalReviewStage;
    private processDataExtractionStage;
    private processDataProcessingStage;
    private processAnonymizationStage;
    private processFormattingStage;
    private processQualityCheckStage;
    private processPackagingStage;
    private processDeliveryStage;
    private processCleanupStage;
    private deliverResults;
    private addAuditEntry;
    private addProcessingError;
    private addProcessingWarning;
    private generateSecureDownloadUrl;
    private validateDownloadToken;
    private calculateProcessingCost;
    private hasRequestPermission;
    private isValidLegalBasis;
    private hasAccessToCategory;
    private sendRequestConfirmation;
    private sendCancellationNotification;
    private sendEmailDelivery;
    private setupSecureDownload;
    private delay;
    private initializeService;
    private startProcessingScheduler;
}

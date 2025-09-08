"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRequestService = exports.FactorImpact = exports.OptOutMethod = exports.SubjectRight = exports.SortDirection = exports.ExceptionReason = exports.AccessControlType = exports.EffectivenessRating = exports.RiskLevel = exports.SafeguardType = exports.AvailabilityLevel = exports.IntegrityLevel = exports.ConfidentialityLevel = exports.SensitivityLevel = exports.DestructionMethod = exports.NotificationMethod = exports.NotificationRecipient = exports.TaskNecessity = exports.UrgencyLevel = exports.ContractNecessity = exports.ContractType = exports.ConsentMethod = exports.StageStatus = exports.WarningImpact = exports.ErrorSeverity = exports.AnonymizationMethod = exports.AggregationFunction = exports.FilterOperator = exports.RequestAction = exports.LawfulBasis = exports.DataRegulation = exports.DeliveryMethod = exports.ProcessingStage = exports.ExportFormat = exports.DataCategory = exports.RequestPriority = exports.RequestStatus = exports.DataRequestType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
// Enums
var DataRequestType;
(function (DataRequestType) {
    DataRequestType["EXPORT"] = "export";
    DataRequestType["DELETION"] = "deletion";
    DataRequestType["RECTIFICATION"] = "rectification";
    DataRequestType["PORTABILITY"] = "portability";
    DataRequestType["RESTRICTION"] = "restriction";
    DataRequestType["OBJECTION"] = "objection";
    DataRequestType["ANONYMIZATION"] = "anonymization";
    DataRequestType["PSEUDONYMIZATION"] = "pseudonymization";
})(DataRequestType || (exports.DataRequestType = DataRequestType = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["SUBMITTED"] = "submitted";
    RequestStatus["VALIDATED"] = "validated";
    RequestStatus["IN_PROGRESS"] = "in_progress";
    RequestStatus["PROCESSING"] = "processing";
    RequestStatus["COMPLETED"] = "completed";
    RequestStatus["DELIVERED"] = "delivered";
    RequestStatus["FAILED"] = "failed";
    RequestStatus["CANCELLED"] = "cancelled";
    RequestStatus["EXPIRED"] = "expired";
    RequestStatus["PARTIALLY_COMPLETED"] = "partially_completed";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var RequestPriority;
(function (RequestPriority) {
    RequestPriority["LOW"] = "low";
    RequestPriority["NORMAL"] = "normal";
    RequestPriority["HIGH"] = "high";
    RequestPriority["URGENT"] = "urgent";
    RequestPriority["CRITICAL"] = "critical";
})(RequestPriority || (exports.RequestPriority = RequestPriority = {}));
var DataCategory;
(function (DataCategory) {
    DataCategory["PERSONAL_INFO"] = "personal_info";
    DataCategory["CONTACT_INFO"] = "contact_info";
    DataCategory["FINANCIAL_INFO"] = "financial_info";
    DataCategory["TRADING_DATA"] = "trading_data";
    DataCategory["PORTFOLIO_DATA"] = "portfolio_data";
    DataCategory["ACTIVITY_LOGS"] = "activity_logs";
    DataCategory["PREFERENCES"] = "preferences";
    DataCategory["DEVICE_INFO"] = "device_info";
    DataCategory["LOCATION_DATA"] = "location_data";
    DataCategory["BIOMETRIC_DATA"] = "biometric_data";
    DataCategory["HEALTH_DATA"] = "health_data";
    DataCategory["COMMUNICATION_DATA"] = "communication_data";
    DataCategory["METADATA"] = "metadata";
    DataCategory["SYSTEM_DATA"] = "system_data";
})(DataCategory || (exports.DataCategory = DataCategory = {}));
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["JSON"] = "json";
    ExportFormat["XML"] = "xml";
    ExportFormat["CSV"] = "csv";
    ExportFormat["PDF"] = "pdf";
    ExportFormat["EXCEL"] = "excel";
    ExportFormat["PARQUET"] = "parquet";
    ExportFormat["AVRO"] = "avro";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var ProcessingStage;
(function (ProcessingStage) {
    ProcessingStage["VALIDATION"] = "validation";
    ProcessingStage["DATA_DISCOVERY"] = "data_discovery";
    ProcessingStage["LEGAL_REVIEW"] = "legal_review";
    ProcessingStage["DATA_EXTRACTION"] = "data_extraction";
    ProcessingStage["DATA_PROCESSING"] = "data_processing";
    ProcessingStage["ANONYMIZATION"] = "anonymization";
    ProcessingStage["FORMATTING"] = "formatting";
    ProcessingStage["QUALITY_CHECK"] = "quality_check";
    ProcessingStage["PACKAGING"] = "packaging";
    ProcessingStage["DELIVERY"] = "delivery";
    ProcessingStage["CLEANUP"] = "cleanup";
})(ProcessingStage || (exports.ProcessingStage = ProcessingStage = {}));
var DeliveryMethod;
(function (DeliveryMethod) {
    DeliveryMethod["EMAIL"] = "email";
    DeliveryMethod["SECURE_DOWNLOAD"] = "secure_download";
    DeliveryMethod["SFTP"] = "sftp";
    DeliveryMethod["API"] = "api";
    DeliveryMethod["PHYSICAL_MEDIA"] = "physical_media";
    DeliveryMethod["SECURE_PORTAL"] = "secure_portal";
})(DeliveryMethod || (exports.DeliveryMethod = DeliveryMethod = {}));
var DataRegulation;
(function (DataRegulation) {
    DataRegulation["GDPR"] = "gdpr";
    DataRegulation["CCPA"] = "ccpa";
    DataRegulation["PIPEDA"] = "pipeda";
    DataRegulation["LGPD"] = "lgpd";
    DataRegulation["PDPA_SINGAPORE"] = "pdpa_singapore";
    DataRegulation["PDPB_INDIA"] = "pdpb_india";
    DataRegulation["POPIA"] = "popia";
})(DataRegulation || (exports.DataRegulation = DataRegulation = {}));
var LawfulBasis;
(function (LawfulBasis) {
    LawfulBasis["CONSENT"] = "consent";
    LawfulBasis["CONTRACT"] = "contract";
    LawfulBasis["LEGAL_OBLIGATION"] = "legal_obligation";
    LawfulBasis["VITAL_INTERESTS"] = "vital_interests";
    LawfulBasis["PUBLIC_TASK"] = "public_task";
    LawfulBasis["LEGITIMATE_INTERESTS"] = "legitimate_interests";
})(LawfulBasis || (exports.LawfulBasis = LawfulBasis = {}));
var RequestAction;
(function (RequestAction) {
    RequestAction["SUBMITTED"] = "submitted";
    RequestAction["VALIDATED"] = "validated";
    RequestAction["APPROVED"] = "approved";
    RequestAction["REJECTED"] = "rejected";
    RequestAction["STARTED_PROCESSING"] = "started_processing";
    RequestAction["COMPLETED_STAGE"] = "completed_stage";
    RequestAction["FAILED_STAGE"] = "failed_stage";
    RequestAction["DELIVERED"] = "delivered";
    RequestAction["CANCELLED"] = "cancelled";
    RequestAction["EXTENDED"] = "extended";
})(RequestAction || (exports.RequestAction = RequestAction = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "equals";
    FilterOperator["NOT_EQUALS"] = "not_equals";
    FilterOperator["GREATER_THAN"] = "greater_than";
    FilterOperator["LESS_THAN"] = "less_than";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["NOT_CONTAINS"] = "not_contains";
    FilterOperator["STARTS_WITH"] = "starts_with";
    FilterOperator["ENDS_WITH"] = "ends_with";
    FilterOperator["IN"] = "in";
    FilterOperator["NOT_IN"] = "not_in";
    FilterOperator["REGEX"] = "regex";
    FilterOperator["IS_NULL"] = "is_null";
    FilterOperator["IS_NOT_NULL"] = "is_not_null";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var AggregationFunction;
(function (AggregationFunction) {
    AggregationFunction["COUNT"] = "count";
    AggregationFunction["SUM"] = "sum";
    AggregationFunction["AVG"] = "avg";
    AggregationFunction["MIN"] = "min";
    AggregationFunction["MAX"] = "max";
    AggregationFunction["DISTINCT_COUNT"] = "distinct_count";
})(AggregationFunction || (exports.AggregationFunction = AggregationFunction = {}));
var AnonymizationMethod;
(function (AnonymizationMethod) {
    AnonymizationMethod["REDACTION"] = "redaction";
    AnonymizationMethod["HASHING"] = "hashing";
    AnonymizationMethod["PSEUDONYMIZATION"] = "pseudonymization";
    AnonymizationMethod["GENERALIZATION"] = "generalization";
    AnonymizationMethod["SUPPRESSION"] = "suppression";
    AnonymizationMethod["NOISE_ADDITION"] = "noise_addition";
    AnonymizationMethod["TOKENIZATION"] = "tokenization";
    AnonymizationMethod["MASKING"] = "masking";
})(AnonymizationMethod || (exports.AnonymizationMethod = AnonymizationMethod = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var WarningImpact;
(function (WarningImpact) {
    WarningImpact["MINIMAL"] = "minimal";
    WarningImpact["MODERATE"] = "moderate";
    WarningImpact["SIGNIFICANT"] = "significant";
})(WarningImpact || (exports.WarningImpact = WarningImpact = {}));
var StageStatus;
(function (StageStatus) {
    StageStatus["PENDING"] = "pending";
    StageStatus["IN_PROGRESS"] = "in_progress";
    StageStatus["COMPLETED"] = "completed";
    StageStatus["FAILED"] = "failed";
    StageStatus["SKIPPED"] = "skipped";
})(StageStatus || (exports.StageStatus = StageStatus = {}));
var ConsentMethod;
(function (ConsentMethod) {
    ConsentMethod["EXPLICIT"] = "explicit";
    ConsentMethod["IMPLIED"] = "implied";
    ConsentMethod["OPT_IN"] = "opt_in";
    ConsentMethod["OPT_OUT"] = "opt_out";
    ConsentMethod["GRANULAR"] = "granular";
})(ConsentMethod || (exports.ConsentMethod = ConsentMethod = {}));
var ContractType;
(function (ContractType) {
    ContractType["SERVICE_AGREEMENT"] = "service_agreement";
    ContractType["EMPLOYMENT"] = "employment";
    ContractType["PARTNERSHIP"] = "partnership";
    ContractType["LICENSING"] = "licensing";
    ContractType["OTHER"] = "other";
})(ContractType || (exports.ContractType = ContractType = {}));
var ContractNecessity;
(function (ContractNecessity) {
    ContractNecessity["PERFORMANCE"] = "performance";
    ContractNecessity["PRE_CONTRACTUAL"] = "pre_contractual";
    ContractNecessity["POST_CONTRACTUAL"] = "post_contractual";
})(ContractNecessity || (exports.ContractNecessity = ContractNecessity = {}));
var UrgencyLevel;
(function (UrgencyLevel) {
    UrgencyLevel["LOW"] = "low";
    UrgencyLevel["MEDIUM"] = "medium";
    UrgencyLevel["HIGH"] = "high";
    UrgencyLevel["CRITICAL"] = "critical";
})(UrgencyLevel || (exports.UrgencyLevel = UrgencyLevel = {}));
var TaskNecessity;
(function (TaskNecessity) {
    TaskNecessity["ESSENTIAL"] = "essential";
    TaskNecessity["SUPPORTING"] = "supporting";
    TaskNecessity["ANCILLARY"] = "ancillary";
})(TaskNecessity || (exports.TaskNecessity = TaskNecessity = {}));
var NotificationRecipient;
(function (NotificationRecipient) {
    NotificationRecipient["DATA_SUBJECT"] = "data_subject";
    NotificationRecipient["REGULATORY_AUTHORITY"] = "regulatory_authority";
    NotificationRecipient["THIRD_PARTY"] = "third_party";
    NotificationRecipient["INTERNAL_TEAM"] = "internal_team";
})(NotificationRecipient || (exports.NotificationRecipient = NotificationRecipient = {}));
var NotificationMethod;
(function (NotificationMethod) {
    NotificationMethod["EMAIL"] = "email";
    NotificationMethod["POSTAL_MAIL"] = "postal_mail";
    NotificationMethod["PHONE"] = "phone";
    NotificationMethod["IN_APP"] = "in_app";
    NotificationMethod["WEBSITE_NOTICE"] = "website_notice";
    NotificationMethod["REGULATORY_PORTAL"] = "regulatory_portal";
})(NotificationMethod || (exports.NotificationMethod = NotificationMethod = {}));
var DestructionMethod;
(function (DestructionMethod) {
    DestructionMethod["SECURE_DELETE"] = "secure_delete";
    DestructionMethod["PHYSICAL_DESTRUCTION"] = "physical_destruction";
    DestructionMethod["CRYPTOGRAPHIC_ERASURE"] = "cryptographic_erasure";
    DestructionMethod["OVERWRITING"] = "overwriting";
})(DestructionMethod || (exports.DestructionMethod = DestructionMethod = {}));
var SensitivityLevel;
(function (SensitivityLevel) {
    SensitivityLevel["PUBLIC"] = "public";
    SensitivityLevel["INTERNAL"] = "internal";
    SensitivityLevel["CONFIDENTIAL"] = "confidential";
    SensitivityLevel["RESTRICTED"] = "restricted";
    SensitivityLevel["TOP_SECRET"] = "top_secret";
})(SensitivityLevel || (exports.SensitivityLevel = SensitivityLevel = {}));
var ConfidentialityLevel;
(function (ConfidentialityLevel) {
    ConfidentialityLevel["LOW"] = "low";
    ConfidentialityLevel["MEDIUM"] = "medium";
    ConfidentialityLevel["HIGH"] = "high";
    ConfidentialityLevel["VERY_HIGH"] = "very_high";
})(ConfidentialityLevel || (exports.ConfidentialityLevel = ConfidentialityLevel = {}));
var IntegrityLevel;
(function (IntegrityLevel) {
    IntegrityLevel["LOW"] = "low";
    IntegrityLevel["MEDIUM"] = "medium";
    IntegrityLevel["HIGH"] = "high";
    IntegrityLevel["VERY_HIGH"] = "very_high";
})(IntegrityLevel || (exports.IntegrityLevel = IntegrityLevel = {}));
var AvailabilityLevel;
(function (AvailabilityLevel) {
    AvailabilityLevel["LOW"] = "low";
    AvailabilityLevel["MEDIUM"] = "medium";
    AvailabilityLevel["HIGH"] = "high";
    AvailabilityLevel["VERY_HIGH"] = "very_high";
})(AvailabilityLevel || (exports.AvailabilityLevel = AvailabilityLevel = {}));
var SafeguardType;
(function (SafeguardType) {
    SafeguardType["CONTRACTUAL"] = "contractual";
    SafeguardType["TECHNICAL"] = "technical";
    SafeguardType["ORGANIZATIONAL"] = "organizational";
    SafeguardType["LEGAL"] = "legal";
})(SafeguardType || (exports.SafeguardType = SafeguardType = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["VERY_HIGH"] = "very_high";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var EffectivenessRating;
(function (EffectivenessRating) {
    EffectivenessRating["POOR"] = "poor";
    EffectivenessRating["FAIR"] = "fair";
    EffectivenessRating["GOOD"] = "good";
    EffectivenessRating["EXCELLENT"] = "excellent";
})(EffectivenessRating || (exports.EffectivenessRating = EffectivenessRating = {}));
var AccessControlType;
(function (AccessControlType) {
    AccessControlType["ROLE_BASED"] = "role_based";
    AccessControlType["ATTRIBUTE_BASED"] = "attribute_based";
    AccessControlType["DISCRETIONARY"] = "discretionary";
    AccessControlType["MANDATORY"] = "mandatory";
})(AccessControlType || (exports.AccessControlType = AccessControlType = {}));
var ExceptionReason;
(function (ExceptionReason) {
    ExceptionReason["LEGAL_REQUIREMENT"] = "legal_requirement";
    ExceptionReason["LITIGATION_HOLD"] = "litigation_hold";
    ExceptionReason["REGULATORY_INQUIRY"] = "regulatory_inquiry";
    ExceptionReason["AUDIT_REQUIREMENT"] = "audit_requirement";
    ExceptionReason["BUSINESS_NECESSITY"] = "business_necessity";
})(ExceptionReason || (exports.ExceptionReason = ExceptionReason = {}));
var SortDirection;
(function (SortDirection) {
    SortDirection["ASC"] = "asc";
    SortDirection["DESC"] = "desc";
})(SortDirection || (exports.SortDirection = SortDirection = {}));
var SubjectRight;
(function (SubjectRight) {
    SubjectRight["ACCESS"] = "access";
    SubjectRight["RECTIFICATION"] = "rectification";
    SubjectRight["ERASURE"] = "erasure";
    SubjectRight["RESTRICTION"] = "restriction";
    SubjectRight["PORTABILITY"] = "portability";
    SubjectRight["OBJECTION"] = "objection";
    SubjectRight["AUTOMATED_DECISION_MAKING"] = "automated_decision_making";
})(SubjectRight || (exports.SubjectRight = SubjectRight = {}));
var OptOutMethod;
(function (OptOutMethod) {
    OptOutMethod["EMAIL_LINK"] = "email_link";
    OptOutMethod["WEB_FORM"] = "web_form";
    OptOutMethod["PHONE"] = "phone";
    OptOutMethod["POSTAL_MAIL"] = "postal_mail";
    OptOutMethod["IN_APP"] = "in_app";
})(OptOutMethod || (exports.OptOutMethod = OptOutMethod = {}));
var FactorImpact;
(function (FactorImpact) {
    FactorImpact["POSITIVE"] = "positive";
    FactorImpact["NEGATIVE"] = "negative";
    FactorImpact["NEUTRAL"] = "neutral";
})(FactorImpact || (exports.FactorImpact = FactorImpact = {}));
class DataRequestService extends events_1.EventEmitter {
    dataRequests = new Map();
    processingQueue = new Map();
    dataCategories = new Map();
    regulatoryTimeframes = new Map();
    constructor() {
        super();
        this.initializeService();
        this.startProcessingScheduler();
    }
    async submitDataRequest(userId, tenantId, requestType, requestData, legalBasis, ipAddress, userAgent) {
        // Validate request
        await this.validateRequest(userId, tenantId, requestType, requestData, legalBasis);
        // Create data request
        const request = {
            id: (0, crypto_1.randomUUID)(),
            userId,
            tenantId,
            type: requestType,
            status: RequestStatus.SUBMITTED,
            priority: this.calculateRequestPriority(requestType, legalBasis),
            requestedAt: new Date(),
            expiresAt: this.calculateExpiryDate(legalBasis.regulation),
            requestData,
            processingDetails: {
                estimatedProcessingTime: await this.estimateProcessingTime(requestData),
                recordsFound: 0,
                recordsProcessed: 0,
                recordsExported: 0,
                recordsDeleted: 0,
                recordsAnonymized: 0,
                errors: [],
                warnings: [],
                completionPercentage: 0,
                currentStage: ProcessingStage.VALIDATION,
                stages: this.initializeProcessingStages(requestType),
                resourceUsage: {
                    cpuTime: 0,
                    memoryUsage: 0,
                    diskUsage: 0,
                    networkTransfer: 0,
                    databaseQueries: 0,
                    apiCalls: 0,
                    cost: 0
                }
            },
            deliveryDetails: {
                method: requestData.format === ExportFormat.JSON ? DeliveryMethod.SECURE_DOWNLOAD : DeliveryMethod.EMAIL,
                destination: '', // Will be set during processing
                encryptionEnabled: true,
                passwordProtected: true,
                accessCount: 0,
                deliveryAttempts: 0,
                maxDeliveryAttempts: 3,
                deliveryErrors: []
            },
            legalBasis,
            compliance: await this.generateComplianceInfo(legalBasis, requestData),
            auditTrail: [
                {
                    id: (0, crypto_1.randomUUID)(),
                    timestamp: new Date(),
                    action: RequestAction.SUBMITTED,
                    performedBy: userId,
                    details: `Data request submitted: ${requestType}`,
                    newStatus: RequestStatus.SUBMITTED,
                    ipAddress,
                    userAgent,
                    systemInfo: {
                        version: '1.0.0',
                        environment: 'production',
                        requestId: (0, crypto_1.randomUUID)()
                    }
                }
            ],
            metadata: {
                submissionSource: 'self_service_portal',
                clientVersion: '1.0.0',
                requestSize: this.estimateRequestSize(requestData)
            }
        };
        this.dataRequests.set(request.id, request);
        // Add to processing queue
        this.processingQueue.set(request.id, request);
        // Send confirmation notifications
        await this.sendRequestConfirmation(request);
        this.emit('dataRequestSubmitted', request);
        return request;
    }
    async getDataRequest(requestId, userId) {
        const request = this.dataRequests.get(requestId);
        if (!request || request.userId !== userId) {
            return null;
        }
        return request;
    }
    async getUserDataRequests(userId, tenantId, filter = {}) {
        let requests = Array.from(this.dataRequests.values())
            .filter(req => req.userId === userId && req.tenantId === tenantId);
        if (filter.type) {
            requests = requests.filter(req => req.type === filter.type);
        }
        if (filter.status) {
            requests = requests.filter(req => req.status === filter.status);
        }
        if (filter.dateRange) {
            requests = requests.filter(req => req.requestedAt >= filter.dateRange.startDate &&
                req.requestedAt <= filter.dateRange.endDate);
        }
        requests = requests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
        if (filter.limit) {
            requests = requests.slice(0, filter.limit);
        }
        return requests;
    }
    async cancelDataRequest(requestId, userId, reason, ipAddress, userAgent) {
        const request = this.dataRequests.get(requestId);
        if (!request || request.userId !== userId) {
            return false;
        }
        // Check if request can be cancelled
        if (![RequestStatus.SUBMITTED, RequestStatus.VALIDATED, RequestStatus.IN_PROGRESS].includes(request.status)) {
            throw new Error('Request cannot be cancelled in current status');
        }
        // Update request status
        request.status = RequestStatus.CANCELLED;
        request.processedAt = new Date();
        // Add audit entry
        this.addAuditEntry(request, RequestAction.CANCELLED, userId, `Request cancelled: ${reason}`, request.status, RequestStatus.CANCELLED, ipAddress, userAgent);
        // Remove from processing queue
        this.processingQueue.delete(requestId);
        // Send cancellation notification
        await this.sendCancellationNotification(request, reason);
        this.emit('dataRequestCancelled', { request, reason });
        return true;
    }
    async processDataRequest(requestId) {
        const request = this.dataRequests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        if (request.status !== RequestStatus.SUBMITTED && request.status !== RequestStatus.VALIDATED) {
            throw new Error('Request is not in a processable state');
        }
        try {
            // Update status
            request.status = RequestStatus.IN_PROGRESS;
            request.processingDetails.currentStage = ProcessingStage.VALIDATION;
            this.addAuditEntry(request, RequestAction.STARTED_PROCESSING, 'system', 'Started processing data request', RequestStatus.SUBMITTED, RequestStatus.IN_PROGRESS, 'system', 'system');
            // Process each stage
            for (const stageInfo of request.processingDetails.stages) {
                if (stageInfo.status === StageStatus.COMPLETED)
                    continue;
                await this.processStage(request, stageInfo.stage);
                if (stageInfo.status === StageStatus.FAILED) {
                    request.status = RequestStatus.FAILED;
                    break;
                }
            }
            // Complete request if all stages successful
            if (request.status !== RequestStatus.FAILED) {
                request.status = RequestStatus.COMPLETED;
                request.completedAt = new Date();
                // Deliver results
                await this.deliverResults(request);
            }
            this.emit('dataRequestProcessed', request);
        }
        catch (error) {
            request.status = RequestStatus.FAILED;
            this.addProcessingError(request, ProcessingStage.DATA_PROCESSING, 'PROCESSING_ERROR', this.getErrorMessage(error), ErrorSeverity.CRITICAL);
            this.emit('dataRequestFailed', { request, error: this.getErrorMessage(error) });
        }
    }
    async downloadRequestResult(requestId, userId, downloadToken) {
        const request = this.dataRequests.get(requestId);
        if (!request || request.userId !== userId || request.status !== RequestStatus.DELIVERED) {
            return null;
        }
        // Validate download token if provided
        if (downloadToken && !this.validateDownloadToken(request, downloadToken)) {
            throw new Error('Invalid or expired download token');
        }
        // Check download expiry
        if (request.deliveryDetails.downloadExpiry && request.deliveryDetails.downloadExpiry < new Date()) {
            throw new Error('Download link has expired');
        }
        // Update access tracking
        request.deliveryDetails.accessCount++;
        request.deliveryDetails.lastAccessedAt = new Date();
        // Generate secure download URL
        const downloadUrl = this.generateSecureDownloadUrl(request);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        this.addAuditEntry(request, RequestAction.DELIVERED, userId, 'Result downloaded', undefined, undefined, 'unknown', 'unknown');
        this.emit('requestResultDownloaded', { request, downloadUrl });
        return { url: downloadUrl, expiresAt };
    }
    async getRequestStatus(requestId, userId) {
        const request = this.dataRequests.get(requestId);
        if (!request || request.userId !== userId) {
            return null;
        }
        let estimatedCompletion;
        if (request.status === RequestStatus.IN_PROGRESS) {
            const remainingTime = request.processingDetails.stages
                .filter(stage => stage.status !== StageStatus.COMPLETED)
                .reduce((sum, stage) => sum + stage.estimatedTimeRemaining, 0);
            estimatedCompletion = new Date(Date.now() + remainingTime * 60 * 1000);
        }
        return {
            status: request.status,
            progress: request.processingDetails.completionPercentage,
            currentStage: request.processingDetails.currentStage,
            estimatedCompletion,
            errors: request.processingDetails.errors,
            warnings: request.processingDetails.warnings
        };
    }
    async generateDataInventoryReport(userId, tenantId) {
        // Mock implementation - would integrate with actual data discovery services
        const categories = Object.values(DataCategory).map(category => ({
            category,
            recordCount: Math.floor(Math.random() * 10000),
            oldestRecord: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            newestRecord: new Date(),
            sizeEstimate: Math.floor(Math.random() * 1000000), // bytes
            sources: ['database', 'logs', 'cache']
        }));
        const totalRecords = categories.reduce((sum, cat) => sum + cat.recordCount, 0);
        const totalSize = categories.reduce((sum, cat) => sum + cat.sizeEstimate, 0);
        return {
            categories,
            totalRecords,
            totalSize,
            retentionSummary: categories.reduce((acc, cat) => {
                acc[cat.category] = 365; // Default 1 year retention  
                return acc;
            }, {}),
            complianceStatus: {
                [DataRegulation.GDPR]: true,
                [DataRegulation.CCPA]: true,
                [DataRegulation.PIPEDA]: false,
                [DataRegulation.LGPD]: false,
                [DataRegulation.PDPA_SINGAPORE]: false,
                [DataRegulation.PDPB_INDIA]: false,
                [DataRegulation.POPIA]: false
            }
        };
    }
    async validateRequest(userId, tenantId, requestType, requestData, legalBasis) {
        // Check user permissions
        if (!await this.hasRequestPermission(userId, tenantId, requestType)) {
            throw new Error('Insufficient permissions for this request type');
        }
        // Validate legal basis
        if (!this.isValidLegalBasis(requestType, legalBasis)) {
            throw new Error('Invalid legal basis for request type');
        }
        // Check request frequency limits
        const recentRequests = await this.getUserDataRequests(userId, tenantId, {
            dateRange: {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
                endDate: new Date(),
                timezone: 'UTC'
            }
        });
        if (recentRequests.length >= 5) { // Max 5 requests per month
            throw new Error('Request frequency limit exceeded');
        }
        // Validate data categories
        for (const category of requestData.categories) {
            if (!await this.hasAccessToCategory(userId, tenantId, category)) {
                throw new Error(`No access to data category: ${category}`);
            }
        }
    }
    calculateRequestPriority(requestType, legalBasis) {
        // Regulatory requirements have higher priority
        if (legalBasis.regulation === DataRegulation.GDPR || legalBasis.regulation === DataRegulation.CCPA) {
            return RequestPriority.HIGH;
        }
        // Deletion requests are typically urgent
        if (requestType === DataRequestType.DELETION) {
            return RequestPriority.HIGH;
        }
        return RequestPriority.NORMAL;
    }
    calculateExpiryDate(regulation) {
        const timeframes = this.regulatoryTimeframes.get(regulation) || 30;
        return new Date(Date.now() + timeframes * 24 * 60 * 60 * 1000);
    }
    async estimateProcessingTime(requestData) {
        let baseTime = 60; // Base 60 minutes
        // Adjust based on data categories
        baseTime += requestData.categories.length * 15;
        // Adjust based on format complexity
        if (requestData.format === ExportFormat.PDF)
            baseTime += 30;
        if (requestData.format === ExportFormat.EXCEL)
            baseTime += 20;
        // Adjust for anonymization
        if (requestData.anonymization)
            baseTime += 45;
        return baseTime;
    }
    initializeProcessingStages(requestType) {
        const commonStages = [
            {
                stage: ProcessingStage.VALIDATION,
                status: StageStatus.PENDING,
                progress: 0,
                estimatedTimeRemaining: 5,
                description: 'Validating request parameters and permissions',
                dependencies: []
            },
            {
                stage: ProcessingStage.DATA_DISCOVERY,
                status: StageStatus.PENDING,
                progress: 0,
                estimatedTimeRemaining: 15,
                description: 'Discovering data sources and records',
                dependencies: [ProcessingStage.VALIDATION]
            },
            {
                stage: ProcessingStage.LEGAL_REVIEW,
                status: StageStatus.PENDING,
                progress: 0,
                estimatedTimeRemaining: 10,
                description: 'Reviewing legal basis and compliance requirements',
                dependencies: [ProcessingStage.DATA_DISCOVERY]
            }
        ];
        // Add request-specific stages
        switch (requestType) {
            case DataRequestType.EXPORT:
            case DataRequestType.PORTABILITY:
                commonStages.push({
                    stage: ProcessingStage.DATA_EXTRACTION,
                    status: StageStatus.PENDING,
                    progress: 0,
                    estimatedTimeRemaining: 20,
                    description: 'Extracting data from sources',
                    dependencies: [ProcessingStage.LEGAL_REVIEW]
                }, {
                    stage: ProcessingStage.FORMATTING,
                    status: StageStatus.PENDING,
                    progress: 0,
                    estimatedTimeRemaining: 10,
                    description: 'Formatting data for export',
                    dependencies: [ProcessingStage.DATA_EXTRACTION]
                }, {
                    stage: ProcessingStage.PACKAGING,
                    status: StageStatus.PENDING,
                    progress: 0,
                    estimatedTimeRemaining: 5,
                    description: 'Packaging data for delivery',
                    dependencies: [ProcessingStage.FORMATTING]
                });
                break;
            case DataRequestType.DELETION:
                commonStages.push({
                    stage: ProcessingStage.DATA_PROCESSING,
                    status: StageStatus.PENDING,
                    progress: 0,
                    estimatedTimeRemaining: 30,
                    description: 'Processing deletion requests',
                    dependencies: [ProcessingStage.LEGAL_REVIEW]
                });
                break;
            case DataRequestType.ANONYMIZATION:
                commonStages.push({
                    stage: ProcessingStage.ANONYMIZATION,
                    status: StageStatus.PENDING,
                    progress: 0,
                    estimatedTimeRemaining: 25,
                    description: 'Anonymizing personal data',
                    dependencies: [ProcessingStage.LEGAL_REVIEW]
                });
                break;
        }
        // Add final stages
        commonStages.push({
            stage: ProcessingStage.QUALITY_CHECK,
            status: StageStatus.PENDING,
            progress: 0,
            estimatedTimeRemaining: 5,
            description: 'Performing quality checks',
            dependencies: commonStages.length > 0 ? [commonStages[commonStages.length - 1].stage] : []
        }, {
            stage: ProcessingStage.DELIVERY,
            status: StageStatus.PENDING,
            progress: 0,
            estimatedTimeRemaining: 3,
            description: 'Delivering results',
            dependencies: [ProcessingStage.QUALITY_CHECK]
        }, {
            stage: ProcessingStage.CLEANUP,
            status: StageStatus.PENDING,
            progress: 0,
            estimatedTimeRemaining: 2,
            description: 'Cleaning up temporary resources',
            dependencies: [ProcessingStage.DELIVERY]
        });
        return commonStages;
    }
    async generateComplianceInfo(legalBasis, requestData) {
        return {
            gdprCompliant: legalBasis.regulation === DataRegulation.GDPR,
            ccpaCompliant: legalBasis.regulation === DataRegulation.CCPA,
            pipedaCompliant: legalBasis.regulation === DataRegulation.PIPEDA,
            lgpdCompliant: legalBasis.regulation === DataRegulation.LGPD,
            requiredNotifications: [
                {
                    recipient: NotificationRecipient.DATA_SUBJECT,
                    method: NotificationMethod.EMAIL,
                    timeframe: 24,
                    completed: false
                }
            ],
            retentionPolicies: [],
            dataClassifications: requestData.categories.map(category => ({
                category,
                sensitivity: SensitivityLevel.CONFIDENTIAL,
                confidentiality: ConfidentialityLevel.HIGH,
                integrityRequirement: IntegrityLevel.HIGH,
                availabilityRequirement: AvailabilityLevel.MEDIUM,
                regulatoryRequirements: [legalBasis.regulation]
            })),
            crossBorderTransfer: {
                isRequired: false,
                destinationCountries: [],
                adequacyDecision: true,
                safeguards: [],
                derogations: [],
                impactAssessment: {
                    conductedAt: new Date(),
                    riskLevel: RiskLevel.LOW,
                    mitigationMeasures: [],
                    conclusion: 'No cross-border transfer required',
                    reviewDate: new Date()
                }
            },
            thirdPartyDisclosure: [],
            dataMinimization: {
                purposeLimitation: true,
                dataRelevance: {
                    purpose: 'Data subject request fulfillment',
                    necessaryData: requestData.categories.map(c => c.toString()),
                    excessiveData: [],
                    justification: 'All requested data is necessary for request fulfillment',
                    reviewDate: new Date()
                },
                storageMinimization: {
                    policy: 'Temporary storage only',
                    implementation: 'Data deleted after delivery',
                    monitoring: 'Automated cleanup process',
                    effectiveness: EffectivenessRating.EXCELLENT
                },
                accessLimitation: {
                    accessControls: [
                        {
                            type: AccessControlType.ROLE_BASED,
                            implementation: 'Role-based access control',
                            effectiveness: EffectivenessRating.GOOD,
                            lastReview: new Date()
                        }
                    ],
                    needToKnowBasis: true,
                    authorizedPersonnel: ['data_processor', 'compliance_officer'],
                    accessLogging: true
                },
                retentionMinimization: {
                    policy: 'Minimal retention for processing',
                    automatedDeletion: true,
                    reviewSchedule: 'Daily',
                    exceptions: []
                }
            }
        };
    }
    estimateRequestSize(requestData) {
        // Estimate size in bytes based on categories and filters
        let estimatedSize = 0;
        for (const category of requestData.categories) {
            switch (category) {
                case DataCategory.PERSONAL_INFO:
                    estimatedSize += 1024; // 1KB
                    break;
                case DataCategory.TRADING_DATA:
                    estimatedSize += 10240; // 10KB
                    break;
                case DataCategory.ACTIVITY_LOGS:
                    estimatedSize += 51200; // 50KB
                    break;
                default:
                    estimatedSize += 2048; // 2KB
            }
        }
        return estimatedSize;
    }
    async processStage(request, stage) {
        const stageInfo = request.processingDetails.stages.find(s => s.stage === stage);
        if (!stageInfo)
            return;
        stageInfo.status = StageStatus.IN_PROGRESS;
        stageInfo.startTime = new Date();
        request.processingDetails.currentStage = stage;
        try {
            switch (stage) {
                case ProcessingStage.VALIDATION:
                    await this.processValidationStage(request);
                    break;
                case ProcessingStage.DATA_DISCOVERY:
                    await this.processDataDiscoveryStage(request);
                    break;
                case ProcessingStage.LEGAL_REVIEW:
                    await this.processLegalReviewStage(request);
                    break;
                case ProcessingStage.DATA_EXTRACTION:
                    await this.processDataExtractionStage(request);
                    break;
                case ProcessingStage.DATA_PROCESSING:
                    await this.processDataProcessingStage(request);
                    break;
                case ProcessingStage.ANONYMIZATION:
                    await this.processAnonymizationStage(request);
                    break;
                case ProcessingStage.FORMATTING:
                    await this.processFormattingStage(request);
                    break;
                case ProcessingStage.QUALITY_CHECK:
                    await this.processQualityCheckStage(request);
                    break;
                case ProcessingStage.PACKAGING:
                    await this.processPackagingStage(request);
                    break;
                case ProcessingStage.DELIVERY:
                    await this.processDeliveryStage(request);
                    break;
                case ProcessingStage.CLEANUP:
                    await this.processCleanupStage(request);
                    break;
            }
            stageInfo.status = StageStatus.COMPLETED;
            stageInfo.endTime = new Date();
            stageInfo.progress = 100;
            this.addAuditEntry(request, RequestAction.COMPLETED_STAGE, 'system', `Completed stage: ${stage}`, undefined, undefined, 'system', 'system');
        }
        catch (error) {
            stageInfo.status = StageStatus.FAILED;
            stageInfo.endTime = new Date();
            this.addProcessingError(request, stage, 'STAGE_PROCESSING_ERROR', this.getErrorMessage(error), ErrorSeverity.HIGH);
            this.addAuditEntry(request, RequestAction.FAILED_STAGE, 'system', `Failed stage: ${stage} - ${this.getErrorMessage(error)}`, undefined, undefined, 'system', 'system');
        }
        // Update overall progress
        const completedStages = request.processingDetails.stages.filter(s => s.status === StageStatus.COMPLETED).length;
        request.processingDetails.completionPercentage = Math.round((completedStages / request.processingDetails.stages.length) * 100);
    }
    async processValidationStage(request) {
        // Simulate validation processing
        await this.delay(2000);
        // Add validation results
        request.processingDetails.recordsFound = Math.floor(Math.random() * 10000);
        if (request.processingDetails.recordsFound === 0) {
            this.addProcessingWarning(request, ProcessingStage.VALIDATION, 'No records found for specified criteria', 'Consider broadening search criteria', WarningImpact.MODERATE);
        }
    }
    async processDataDiscoveryStage(request) {
        await this.delay(3000);
        // Mock data discovery results
        const categoriesFound = request.requestData.categories.length;
        request.processingDetails.recordsFound = Math.floor(Math.random() * 5000) + 1000;
        // Update processing details
        request.processingDetails.resourceUsage.databaseQueries += categoriesFound * 10;
        request.processingDetails.resourceUsage.memoryUsage += 50;
    }
    async processLegalReviewStage(request) {
        await this.delay(1500);
        // Simulate legal review
        const hasComplexData = request.requestData.categories.includes(DataCategory.BIOMETRIC_DATA) ||
            request.requestData.categories.includes(DataCategory.HEALTH_DATA);
        if (hasComplexData) {
            this.addProcessingWarning(request, ProcessingStage.LEGAL_REVIEW, 'Complex data categories detected', 'Additional legal review may be required', WarningImpact.SIGNIFICANT);
        }
    }
    async processDataExtractionStage(request) {
        await this.delay(5000);
        // Simulate data extraction
        request.processingDetails.recordsProcessed = request.processingDetails.recordsFound;
        request.processingDetails.resourceUsage.diskUsage += request.processingDetails.recordsFound * 0.1; // KB per record
        request.processingDetails.resourceUsage.cpuTime += 30;
    }
    async processDataProcessingStage(request) {
        await this.delay(4000);
        if (request.type === DataRequestType.DELETION) {
            request.processingDetails.recordsDeleted = request.processingDetails.recordsFound;
        }
        request.processingDetails.resourceUsage.cpuTime += 60;
        request.processingDetails.resourceUsage.databaseQueries += request.processingDetails.recordsFound * 0.1;
    }
    async processAnonymizationStage(request) {
        await this.delay(6000);
        if (request.requestData.anonymization) {
            request.processingDetails.recordsAnonymized = request.processingDetails.recordsProcessed;
            request.processingDetails.resourceUsage.cpuTime += 90;
        }
    }
    async processFormattingStage(request) {
        await this.delay(2500);
        // Format-specific processing
        switch (request.requestData.format) {
            case ExportFormat.PDF:
                request.processingDetails.resourceUsage.cpuTime += 45;
                break;
            case ExportFormat.EXCEL:
                request.processingDetails.resourceUsage.cpuTime += 30;
                break;
            default:
                request.processingDetails.resourceUsage.cpuTime += 15;
        }
        request.processingDetails.recordsExported = request.processingDetails.recordsProcessed;
    }
    async processQualityCheckStage(request) {
        await this.delay(1000);
        // Simulate quality checks
        const errorRate = Math.random() * 0.1; // Up to 10% error rate
        if (errorRate > 0.05) { // 5% threshold
            this.addProcessingWarning(request, ProcessingStage.QUALITY_CHECK, `Data quality issues detected (${Math.round(errorRate * 100)}% error rate)`, 'Review data processing parameters', WarningImpact.MODERATE);
        }
    }
    async processPackagingStage(request) {
        await this.delay(1500);
        // Package data for delivery
        request.deliveryDetails.encryptionEnabled = true;
        request.deliveryDetails.passwordProtected = true;
        request.processingDetails.resourceUsage.diskUsage += request.processingDetails.recordsExported * 0.2;
    }
    async processDeliveryStage(request) {
        await this.delay(1000);
        // Set up delivery
        request.deliveryDetails.downloadUrl = this.generateSecureDownloadUrl(request);
        request.deliveryDetails.downloadExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        request.deliveryDetails.deliveredAt = new Date();
        request.status = RequestStatus.DELIVERED;
    }
    async processCleanupStage(request) {
        await this.delay(500);
        // Cleanup temporary resources
        request.processingDetails.resourceUsage.cost = this.calculateProcessingCost(request.processingDetails.resourceUsage);
    }
    async deliverResults(request) {
        switch (request.deliveryDetails.method) {
            case DeliveryMethod.EMAIL:
                await this.sendEmailDelivery(request);
                break;
            case DeliveryMethod.SECURE_DOWNLOAD:
                await this.setupSecureDownload(request);
                break;
            default:
                throw new Error(`Unsupported delivery method: ${request.deliveryDetails.method}`);
        }
    }
    addAuditEntry(request, action, performedBy, details, previousStatus, newStatus, ipAddress = 'system', userAgent = 'system') {
        const entry = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            action,
            performedBy,
            details,
            previousStatus,
            newStatus,
            ipAddress,
            userAgent,
            systemInfo: {
                version: '1.0.0',
                environment: 'production',
                requestId: request.id,
                correlationId: (0, crypto_1.randomUUID)()
            }
        };
        request.auditTrail.push(entry);
    }
    addProcessingError(request, stage, errorCode, message, severity) {
        const error = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            stage,
            errorCode,
            message,
            details: {},
            severity,
            isRetryable: severity !== ErrorSeverity.CRITICAL,
            retryCount: 0,
            resolved: false
        };
        request.processingDetails.errors.push(error);
    }
    addProcessingWarning(request, stage, message, recommendation, impact) {
        const warning = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            stage,
            message,
            recommendation,
            impact
        };
        request.processingDetails.warnings.push(warning);
    }
    generateSecureDownloadUrl(request) {
        // Generate secure download URL with token
        const token = (0, crypto_1.randomUUID)();
        return `https://secure-downloads.platform.com/data-requests/${request.id}/download?token=${token}`;
    }
    validateDownloadToken(request, token) {
        // Simplified token validation
        return token.length === 36; // UUID length
    }
    calculateProcessingCost(resourceUsage) {
        // Simple cost calculation
        const cpuCost = resourceUsage.cpuTime * 0.001; // $0.001 per second
        const memoryCost = (resourceUsage.memoryUsage / 1024) * 0.0001; // $0.0001 per GB-hour
        const diskCost = (resourceUsage.diskUsage / 1024) * 0.00001; // $0.00001 per GB
        const networkCost = (resourceUsage.networkTransfer / 1024) * 0.0001; // $0.0001 per GB
        return cpuCost + memoryCost + diskCost + networkCost;
    }
    async hasRequestPermission(userId, tenantId, requestType) {
        // Simplified permission check
        return true; // In real implementation, would check user roles and permissions
    }
    isValidLegalBasis(requestType, legalBasis) {
        // Simplified legal basis validation
        return Object.values(LawfulBasis).includes(legalBasis.lawfulBasis);
    }
    async hasAccessToCategory(userId, tenantId, category) {
        // Simplified category access check
        return true; // In real implementation, would check data access permissions
    }
    async sendRequestConfirmation(request) {
        // Mock email sending
        console.log(`Confirmation sent for request ${request.id} to user ${request.userId}`);
    }
    async sendCancellationNotification(request, reason) {
        // Mock email sending
        console.log(`Cancellation notification sent for request ${request.id}: ${reason}`);
    }
    async sendEmailDelivery(request) {
        // Mock email delivery
        console.log(`Results delivered via email for request ${request.id}`);
    }
    async setupSecureDownload(request) {
        // Mock secure download setup
        console.log(`Secure download setup for request ${request.id}`);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    initializeService() {
        // Initialize regulatory timeframes (in days)
        this.regulatoryTimeframes.set(DataRegulation.GDPR, 30);
        this.regulatoryTimeframes.set(DataRegulation.CCPA, 45);
        this.regulatoryTimeframes.set(DataRegulation.PIPEDA, 30);
        this.regulatoryTimeframes.set(DataRegulation.LGPD, 15);
        // Initialize data category mappings
        this.dataCategories.set(DataCategory.PERSONAL_INFO, ['users.personal_info']);
        this.dataCategories.set(DataCategory.CONTACT_INFO, ['users.contact_info']);
        this.dataCategories.set(DataCategory.FINANCIAL_INFO, ['users.financial_data', 'accounts']);
        this.dataCategories.set(DataCategory.TRADING_DATA, ['trades', 'orders', 'positions']);
        this.dataCategories.set(DataCategory.ACTIVITY_LOGS, ['activity_logs', 'audit_logs']);
    }
    startProcessingScheduler() {
        // Process requests every 30 seconds
        setInterval(async () => {
            const pendingRequests = Array.from(this.processingQueue.values())
                .filter(req => req.status === RequestStatus.SUBMITTED || req.status === RequestStatus.VALIDATED)
                .sort((a, b) => {
                // Sort by priority, then by submission time
                const priorityOrder = { critical: 0, urgent: 1, high: 2, normal: 3, low: 4 };
                const aPriority = priorityOrder[a.priority];
                const bPriority = priorityOrder[b.priority];
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                return a.requestedAt.getTime() - b.requestedAt.getTime();
            });
            // Process up to 3 requests concurrently
            const requestsToProcess = pendingRequests.slice(0, 3);
            for (const request of requestsToProcess) {
                if (request.status === RequestStatus.SUBMITTED || request.status === RequestStatus.VALIDATED) {
                    this.processDataRequest(request.id).catch(error => {
                        console.error(`Error processing request ${request.id}:`, error);
                    });
                }
            }
        }, 30000);
        // Cleanup expired requests every hour
        setInterval(() => {
            const now = new Date();
            for (const [id, request] of this.dataRequests.entries()) {
                if (request.expiresAt && request.expiresAt < now &&
                    ![RequestStatus.COMPLETED, RequestStatus.DELIVERED, RequestStatus.CANCELLED].includes(request.status)) {
                    request.status = RequestStatus.EXPIRED;
                    this.processingQueue.delete(id);
                    this.addAuditEntry(request, RequestAction.CANCELLED, 'system', 'Request expired due to timeout', request.status, RequestStatus.EXPIRED, 'system', 'system');
                    this.emit('dataRequestExpired', request);
                }
            }
        }, 60 * 60 * 1000);
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.DataRequestService = DataRequestService;

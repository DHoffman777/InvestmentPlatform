export declare enum DocumentType {
    IDENTIFICATION = "IDENTIFICATION",
    FINANCIAL_STATEMENT = "FINANCIAL_STATEMENT",
    TAX_DOCUMENT = "TAX_DOCUMENT",
    INVESTMENT_AGREEMENT = "INVESTMENT_AGREEMENT",
    COMPLIANCE_DOCUMENT = "COMPLIANCE_DOCUMENT",
    CORRESPONDENCE = "CORRESPONDENCE",
    TRADE_CONFIRMATION = "TRADE_CONFIRMATION",
    ACCOUNT_STATEMENT = "ACCOUNT_STATEMENT",
    PROSPECTUS = "PROSPECTUS",
    REGULATORY_FILING = "REGULATORY_FILING",
    SIGNATURE_CARD = "SIGNATURE_CARD",
    POWER_OF_ATTORNEY = "POWER_OF_ATTORNEY",
    BENEFICIARY_DESIGNATION = "BENEFICIARY_DESIGNATION",
    OTHER = "OTHER"
}
export declare enum DocumentStatus {
    UPLOADED = "UPLOADED",
    PROCESSING = "PROCESSING",
    PROCESSED = "PROCESSED",
    REVIEW_REQUIRED = "REVIEW_REQUIRED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    ARCHIVED = "ARCHIVED",
    EXPIRED = "EXPIRED"
}
export declare enum AccessLevel {
    PUBLIC = "PUBLIC",
    CLIENT_ONLY = "CLIENT_ONLY",
    ADVISOR_ONLY = "ADVISOR_ONLY",
    INTERNAL_ONLY = "INTERNAL_ONLY",
    RESTRICTED = "RESTRICTED",
    COMPLIANCE_ONLY = "COMPLIANCE_ONLY"
}
export declare enum DocumentFormat {
    PDF = "PDF",
    WORD = "WORD",
    EXCEL = "EXCEL",
    IMAGE = "IMAGE",
    TEXT = "TEXT",
    XML = "XML",
    JSON = "JSON",
    OTHER = "OTHER"
}
export interface DocumentMetadata {
    fileName: string;
    fileSize: number;
    mimeType: string;
    format: DocumentFormat;
    pageCount?: number;
    language?: string;
    encoding?: string;
    checksum: string;
    uploadDate: Date;
    lastModified: Date;
}
export interface DocumentClassification {
    type: DocumentType;
    subtype?: string;
    category: string;
    confidenceScore: number;
    classifiedBy: 'MANUAL' | 'AUTO' | 'ML_MODEL';
    classificationDate: Date;
    reviewRequired: boolean;
}
export interface ExtractionResult {
    field: string;
    value: string | number | boolean | Date;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    pageNumber?: number;
    extractionMethod: 'OCR' | 'FORM_FIELD' | 'PATTERN_MATCH' | 'ML_MODEL';
}
export interface DocumentValidation {
    isValid: boolean;
    validationDate: Date;
    validationRules: string[];
    violations: {
        rule: string;
        severity: 'ERROR' | 'WARNING' | 'INFO';
        message: string;
        field?: string;
    }[];
    validatedBy: string;
}
export interface DocumentRetention {
    retentionPeriod: number;
    disposalDate: Date;
    legalHold: boolean;
    holdReason?: string;
    holdDate?: Date;
    disposalMethod?: string;
    disposalApprover?: string;
}
export interface DocumentAccess {
    userId: string;
    accessLevel: AccessLevel;
    permissions: DocumentPermission[];
    grantedBy: string;
    grantedDate: Date;
    expirationDate?: Date;
    lastAccessed?: Date;
    accessCount: number;
}
export declare enum DocumentPermission {
    VIEW = "VIEW",
    DOWNLOAD = "DOWNLOAD",
    PRINT = "PRINT",
    SHARE = "SHARE",
    EDIT = "EDIT",
    DELETE = "DELETE",
    APPROVE = "APPROVE",
    REDACT = "REDACT"
}
export interface DocumentVersion {
    id: string;
    versionNumber: string;
    documentId: string;
    fileName: string;
    fileSize: number;
    storageLocation: string;
    checksum: string;
    createdDate: Date;
    createdBy: string;
    changeDescription?: string;
    isCurrentVersion: boolean;
    metadata: DocumentMetadata;
}
export interface DocumentAuditLog {
    id: string;
    documentId: string;
    action: DocumentAction;
    performedBy: string;
    performedDate: Date;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
}
export declare enum DocumentAction {
    UPLOAD = "UPLOAD",
    VIEW = "VIEW",
    DOWNLOAD = "DOWNLOAD",
    EDIT = "EDIT",
    DELETE = "DELETE",
    SHARE = "SHARE",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    ARCHIVE = "ARCHIVE",
    RESTORE = "RESTORE",
    CLASSIFY = "CLASSIFY",
    EXTRACT = "EXTRACT",
    VALIDATE = "VALIDATE",
    VERSION_CREATE = "VERSION_CREATE",
    ACCESS_GRANT = "ACCESS_GRANT",
    ACCESS_REVOKE = "ACCESS_REVOKE"
}
export interface ClientDocument {
    id: string;
    tenantId: string;
    clientId: string;
    portfolioId?: string;
    accountId?: string;
    title: string;
    description?: string;
    documentNumber?: string;
    externalReference?: string;
    fileName: string;
    originalFileName: string;
    storageLocation: string;
    storageProvider: 'LOCAL' | 'S3' | 'AZURE' | 'GCP';
    encryptionKey?: string;
    classification: DocumentClassification;
    metadata: DocumentMetadata;
    extractedData: ExtractionResult[];
    validation: DocumentValidation;
    status: DocumentStatus;
    workflowStage?: string;
    assignedTo?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    accessLevel: AccessLevel;
    accessControls: DocumentAccess[];
    retention: DocumentRetention;
    complianceFlags: string[];
    regulatoryTags: string[];
    parentDocumentId?: string;
    relatedDocuments: string[];
    linkedTransactions: string[];
    linkedPositions: string[];
    currentVersion: string;
    versions: DocumentVersion[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    searchableText: string;
    tags: string[];
    keywords: string[];
}
export interface DocumentSearchRequest {
    tenantId: string;
    clientId?: string;
    portfolioId?: string;
    accountId?: string;
    query?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    accessLevel?: AccessLevel;
    classification?: Partial<DocumentClassification>;
    tags?: string[];
    keywords?: string[];
    sortBy?: 'CREATED_DATE' | 'UPDATED_DATE' | 'TITLE' | 'TYPE' | 'STATUS';
    sortOrder?: 'ASC' | 'DESC';
    offset: number;
    limit: number;
}
export interface DocumentSearchResponse {
    documents: ClientDocument[];
    totalCount: number;
    facets: {
        types: {
            [key in DocumentType]?: number;
        };
        statuses: {
            [key in DocumentStatus]?: number;
        };
        accessLevels: {
            [key in AccessLevel]?: number;
        };
    };
    suggestions: string[];
}
export interface DocumentUploadRequest {
    tenantId: string;
    clientId: string;
    portfolioId?: string;
    accountId?: string;
    title: string;
    description?: string;
    documentType?: DocumentType;
    file: {
        name: string;
        size: number;
        mimeType: string;
        content: Buffer | string;
    };
    externalReference?: string;
    tags?: string[];
    accessLevel?: AccessLevel;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    autoClassify?: boolean;
    autoExtract?: boolean;
    autoValidate?: boolean;
}
export interface DocumentUploadResponse {
    document: ClientDocument;
    processingJobs: {
        classificationJobId?: string;
        extractionJobId?: string;
        validationJobId?: string;
    };
    warnings: string[];
}
export interface DocumentProcessingJob {
    id: string;
    documentId: string;
    jobType: 'CLASSIFICATION' | 'EXTRACTION' | 'VALIDATION' | 'OCR';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    startTime: Date;
    endTime?: Date;
    result?: any;
    error?: string;
    retryCount: number;
    maxRetries: number;
}
export interface DocumentTemplate {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    documentType: DocumentType;
    fields: {
        name: string;
        type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'CHOICE';
        required: boolean;
        validation?: string;
        extractionPattern?: string;
        defaultValue?: any;
    }[];
    modelId?: string;
    modelVersion?: string;
    accuracy?: number;
    usageCount: number;
    lastUsed?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isActive: boolean;
}
export interface BulkDocumentOperation {
    operationType: 'DELETE' | 'ARCHIVE' | 'APPROVE' | 'REJECT' | 'CHANGE_ACCESS';
    documentIds: string[];
    parameters?: Record<string, any>;
    performedBy: string;
    reason?: string;
}
export interface BulkOperationResult {
    totalProcessed: number;
    successful: number;
    failed: number;
    errors: {
        documentId: string;
        error: string;
    }[];
    results: {
        documentId: string;
        success: boolean;
        message?: string;
    }[];
}

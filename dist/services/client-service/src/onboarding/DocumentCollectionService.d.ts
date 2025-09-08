import { EventEmitter } from 'events';
export interface DocumentRequirement {
    id: string;
    type: DocumentType;
    name: string;
    description: string;
    required: boolean;
    acceptedFormats: string[];
    maxFileSize: number;
    validationRules: ValidationRule[];
    jurisdiction?: string;
    clientType?: 'individual' | 'entity' | 'trust' | 'partnership';
    accountType?: string[];
}
export interface DocumentSubmission {
    id: string;
    workflowId: string;
    requirementId: string;
    clientId: string;
    tenantId: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
    fileHash: string;
    submittedAt: Date;
    submittedBy: string;
    status: DocumentStatus;
    verificationResults: DocumentVerification[];
    metadata: Record<string, any>;
    expirationDate?: Date;
    replacedBy?: string;
    notes?: string;
}
export interface DocumentVerification {
    id: string;
    verifierId: string;
    verifierType: 'system' | 'human' | 'third_party';
    verificationType: VerificationType;
    status: VerificationStatus;
    confidence: number;
    results: Record<string, any>;
    verifiedAt: Date;
    notes?: string;
    flags: VerificationFlag[];
}
export interface ValidationRule {
    type: 'format' | 'content' | 'authenticity' | 'expiration' | 'custom';
    rule: string;
    parameters?: Record<string, any>;
    errorMessage: string;
}
export interface VerificationFlag {
    type: 'warning' | 'error' | 'info';
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export declare enum DocumentType {
    DRIVERS_LICENSE = "DRIVERS_LICENSE",
    PASSPORT = "PASSPORT",
    NATIONAL_ID = "NATIONAL_ID",
    BIRTH_CERTIFICATE = "BIRTH_CERTIFICATE",
    UTILITY_BILL = "UTILITY_BILL",
    BANK_STATEMENT = "BANK_STATEMENT",
    LEASE_AGREEMENT = "LEASE_AGREEMENT",
    PROPERTY_TAX_BILL = "PROPERTY_TAX_BILL",
    TAX_RETURN = "TAX_RETURN",
    W2_FORM = "W2_FORM",
    PAYSTUB = "PAYSTUB",
    EMPLOYMENT_LETTER = "EMPLOYMENT_LETTER",
    FINANCIAL_STATEMENT = "FINANCIAL_STATEMENT",
    ARTICLES_OF_INCORPORATION = "ARTICLES_OF_INCORPORATION",
    OPERATING_AGREEMENT = "OPERATING_AGREEMENT",
    TRUST_AGREEMENT = "TRUST_AGREEMENT",
    POWER_OF_ATTORNEY = "POWER_OF_ATTORNEY",
    EIN_LETTER = "EIN_LETTER",
    CORPORATE_RESOLUTION = "CORPORATE_RESOLUTION",
    BANK_ACCOUNT_STATEMENT = "BANK_ACCOUNT_STATEMENT",
    VOIDED_CHECK = "VOIDED_CHECK",
    WIRE_INSTRUCTIONS = "WIRE_INSTRUCTIONS",
    ACH_AUTHORIZATION = "ACH_AUTHORIZATION",
    INVESTMENT_POLICY_STATEMENT = "INVESTMENT_POLICY_STATEMENT",
    RISK_QUESTIONNAIRE = "RISK_QUESTIONNAIRE",
    INVESTMENT_EXPERIENCE_FORM = "INVESTMENT_EXPERIENCE_FORM",
    ACCREDITED_INVESTOR_CERT = "ACCREDITED_INVESTOR_CERT",
    FATCA_FORM = "FATCA_FORM",
    CRS_FORM = "CRS_FORM",
    BENEFICIAL_OWNERSHIP_FORM = "BENEFICIAL_OWNERSHIP_FORM",
    POLITICALLY_EXPOSED_PERSON_FORM = "POLITICALLY_EXPOSED_PERSON_FORM",
    OTHER = "OTHER"
}
export declare enum DocumentStatus {
    PENDING_SUBMISSION = "PENDING_SUBMISSION",
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED",
    REPLACED = "REPLACED"
}
export declare enum VerificationType {
    FORMAT_CHECK = "FORMAT_CHECK",
    CONTENT_EXTRACTION = "CONTENT_EXTRACTION",
    AUTHENTICITY_CHECK = "AUTHENTICITY_CHECK",
    BIOMETRIC_MATCH = "BIOMETRIC_MATCH",
    THIRD_PARTY_VERIFICATION = "THIRD_PARTY_VERIFICATION",
    MANUAL_REVIEW = "MANUAL_REVIEW",
    EXPIRATION_CHECK = "EXPIRATION_CHECK",
    COMPLETENESS_CHECK = "COMPLETENESS_CHECK"
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    PASSED = "PASSED",
    FAILED = "FAILED",
    REQUIRES_REVIEW = "REQUIRES_REVIEW",
    TIMEOUT = "TIMEOUT"
}
export declare class DocumentCollectionService extends EventEmitter {
    private requirements;
    private submissions;
    constructor();
    private initializeStandardRequirements;
    getRequirementsForClient(clientType: 'individual' | 'entity' | 'trust' | 'partnership', accountType: string, jurisdiction?: string): Promise<DocumentRequirement[]>;
    submitDocument(submission: Omit<DocumentSubmission, 'id' | 'submittedAt' | 'status' | 'verificationResults'>): Promise<DocumentSubmission>;
    private startVerification;
    private performFormatCheck;
    private performContentExtraction;
    private performAuthenticityCheck;
    private performExpirationCheck;
    private mockContentExtraction;
    getSubmissionsByWorkflow(workflowId: string): DocumentSubmission[];
    getSubmission(submissionId: string): DocumentSubmission | undefined;
    requestAdditionalDocument(workflowId: string, requirementId: string, reason: string): Promise<any>;
    getCompletionStatus(workflowId: string): Promise<{
        totalRequired: number;
        submitted: number;
        verified: number;
        rejected: number;
        pending: number;
        completionPercentage: number;
        missingRequirements: DocumentRequirement[];
    }>;
}

import { EventEmitter } from 'events';
import { ActivityData } from './ActivityTrackingService';
export interface PrivacyPolicy {
    id: string;
    name: string;
    description: string;
    version: string;
    tenantId: string;
    effectiveDate: Date;
    expirationDate?: Date;
    isActive: boolean;
    rules: PrivacyRule[];
    consentRequired: boolean;
    dataProcessingPurposes: string[];
    legalBasis: LegalBasis[];
    dataRetentionPeriod: number;
    thirdPartySharing: boolean;
    crossBorderTransfer: boolean;
    allowedJurisdictions: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface PrivacyRule {
    id: string;
    name: string;
    dataCategory: DataCategory;
    processingOperation: ProcessingOperation[];
    anonymizationMethod: AnonymizationMethod;
    retentionOverride?: number;
    accessRestrictions: AccessRestriction[];
    auditRequired: boolean;
    encryptionRequired: boolean;
    minimizationRules: MinimizationRule[];
}
export declare enum DataCategory {
    PERSONAL_IDENTIFIERS = "personal_identifiers",// Names, IDs, etc.
    CONTACT_INFORMATION = "contact_information",// Email, phone, address
    FINANCIAL_DATA = "financial_data",// Account numbers, transactions
    BEHAVIORAL_DATA = "behavioral_data",// Activity patterns, preferences  
    TECHNICAL_DATA = "technical_data",// IP addresses, device info
    LOCATION_DATA = "location_data",// Geographic information
    BIOMETRIC_DATA = "biometric_data",// Fingerprints, facial data
    HEALTH_DATA = "health_data",// Medical information
    COMMUNICATION_DATA = "communication_data",// Messages, call logs
    SENSITIVE_ATTRIBUTES = "sensitive_attributes"
}
export declare enum ProcessingOperation {
    COLLECTION = "collection",
    STORAGE = "storage",
    ACCESS = "access",
    ANALYSIS = "analysis",
    SHARING = "sharing",
    TRANSFER = "transfer",
    DELETION = "deletion",
    ANONYMIZATION = "anonymization",
    PROFILING = "profiling",
    AUTOMATED_DECISION_MAKING = "automated_decision_making"
}
export declare enum AnonymizationMethod {
    NONE = "none",
    PSEUDONYMIZATION = "pseudonymization",// Replace with pseudonyms
    GENERALIZATION = "generalization",// Reduce precision
    SUPPRESSION = "suppression",// Remove entirely
    NOISE_ADDITION = "noise_addition",// Add statistical noise
    K_ANONYMITY = "k_anonymity",// Ensure k similar records
    L_DIVERSITY = "l_diversity",// Ensure diverse sensitive values
    T_CLOSENESS = "t_closeness",// Limit information gain
    DIFFERENTIAL_PRIVACY = "differential_privacy",// Mathematical privacy guarantee
    TOKENIZATION = "tokenization",// Replace with tokens
    HASHING = "hashing"
}
export declare enum LegalBasis {
    CONSENT = "consent",// GDPR Article 6(1)(a)
    CONTRACT = "contract",// GDPR Article 6(1)(b)
    LEGAL_OBLIGATION = "legal_obligation",// GDPR Article 6(1)(c)
    VITAL_INTERESTS = "vital_interests",// GDPR Article 6(1)(d)
    PUBLIC_TASK = "public_task",// GDPR Article 6(1)(e)
    LEGITIMATE_INTERESTS = "legitimate_interests"
}
export interface AccessRestriction {
    role: string;
    operations: ProcessingOperation[];
    conditions: string[];
    timeRestrictions?: string[];
    locationRestrictions?: string[];
}
export interface MinimizationRule {
    field: string;
    condition: string;
    action: 'remove' | 'mask' | 'generalize' | 'pseudonymize';
    parameters?: Record<string, any>;
}
export interface ConsentRecord {
    id: string;
    userId: string;
    tenantId: string;
    policyId: string;
    consentGiven: boolean;
    consentDate: Date;
    consentVersion: string;
    consentMethod: ConsentMethod;
    purposes: string[];
    expirationDate?: Date;
    withdrawalDate?: Date;
    withdrawalReason?: string;
    ipAddress: string;
    userAgent: string;
    evidence: ConsentEvidence[];
    isActive: boolean;
}
export declare enum ConsentMethod {
    EXPLICIT_OPT_IN = "explicit_opt_in",
    IMPLIED_CONSENT = "implied_consent",
    PRE_TICKED_BOX = "pre_ticked_box",
    CONTINUATION_OF_SERVICE = "continuation_of_service",
    BROWSER_SETTINGS = "browser_settings"
}
export interface ConsentEvidence {
    type: 'screenshot' | 'form_data' | 'cookie' | 'log_entry' | 'signature';
    data: any;
    timestamp: Date;
    hash: string;
}
export interface DataSubjectRights {
    id: string;
    userId: string;
    tenantId: string;
    right: DataSubjectRight;
    requestDate: Date;
    responseDate?: Date;
    status: RightRequestStatus;
    requestDetails: Record<string, any>;
    responseData?: any;
    verificationMethod: string;
    processingNotes: string[];
    legalReview: boolean;
    automaticProcessing: boolean;
}
export declare enum DataSubjectRight {
    RIGHT_TO_ACCESS = "right_to_access",// Article 15
    RIGHT_TO_RECTIFICATION = "right_to_rectification",// Article 16
    RIGHT_TO_ERASURE = "right_to_erasure",// Article 17
    RIGHT_TO_RESTRICT = "right_to_restrict",// Article 18
    RIGHT_TO_PORTABILITY = "right_to_portability",// Article 20
    RIGHT_TO_OBJECT = "right_to_object",// Article 21
    RIGHT_NOT_AUTOMATED = "right_not_automated_decision"
}
export declare enum RightRequestStatus {
    SUBMITTED = "submitted",
    VERIFYING = "verifying",
    PROCESSING = "processing",
    COMPLETED = "completed",
    REJECTED = "rejected",
    PARTIALLY_FULFILLED = "partially_fulfilled"
}
export interface PrivacyAuditLog {
    id: string;
    timestamp: Date;
    tenantId: string;
    userId?: string;
    operation: PrivacyOperation;
    dataCategory: DataCategory[];
    legalBasis: LegalBasis;
    purpose: string;
    dataElements: string[];
    processingMethod: ProcessingOperation;
    accessRequester: string;
    justification: string;
    consentReference?: string;
    retentionPeriod?: number;
    thirdPartiesInvolved: string[];
    crossBorderTransfer: boolean;
    destinationCountries: string[];
    safeguards: string[];
    riskAssessment: RiskLevel;
    complianceCheck: boolean;
    violations: string[];
}
export declare enum PrivacyOperation {
    DATA_COLLECTION = "data_collection",
    DATA_ACCESS = "data_access",
    DATA_PROCESSING = "data_processing",
    DATA_SHARING = "data_sharing",
    DATA_TRANSFER = "data_transfer",
    DATA_DELETION = "data_deletion",
    CONSENT_CHANGE = "consent_change",
    RIGHTS_REQUEST = "rights_request",
    POLICY_CHANGE = "policy_change",
    BREACH_DETECTED = "breach_detected"
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface DataFlowMapping {
    id: string;
    name: string;
    tenantId: string;
    sourceSystem: string;
    targetSystem: string;
    dataCategories: DataCategory[];
    processingOperations: ProcessingOperation[];
    dataVolume: DataVolume;
    frequency: DataFlowFrequency;
    purposes: string[];
    legalBasis: LegalBasis[];
    safeguards: string[];
    riskLevel: RiskLevel;
    approvalRequired: boolean;
    approvedBy?: string;
    approvalDate?: Date;
    reviewDate: Date;
    isActive: boolean;
}
export declare enum DataVolume {
    INDIVIDUAL_RECORDS = "individual_records",// < 100 records
    SMALL_DATASET = "small_dataset",// 100-1,000 records
    MEDIUM_DATASET = "medium_dataset",// 1,000-100,000 records
    LARGE_DATASET = "large_dataset",// 100,000-1,000,000 records
    BIG_DATA = "big_data"
}
export declare enum DataFlowFrequency {
    REAL_TIME = "real_time",
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    ON_DEMAND = "on_demand",
    ONE_TIME = "one_time"
}
export declare class ActivityPrivacyService extends EventEmitter {
    private privacyPolicies;
    private consentRecords;
    private dataSubjectRights;
    private auditLogs;
    private dataFlowMappings;
    private anonymizationCache;
    private pseudonymMappings;
    private getErrorMessage;
    constructor();
    createPrivacyPolicy(policy: Omit<PrivacyPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrivacyPolicy>;
    applyPrivacyRules(activity: ActivityData, tenantId: string): Promise<ActivityData>;
    anonymizeActivity(activity: ActivityData, method: AnonymizationMethod): Promise<ActivityData>;
    recordConsent(consent: Omit<ConsentRecord, 'id'>): Promise<ConsentRecord>;
    withdrawConsent(userId: string, policyId: string, reason: string): Promise<boolean>;
    processDataSubjectRight(request: Omit<DataSubjectRights, 'id' | 'requestDate' | 'status' | 'processingNotes'>): Promise<DataSubjectRights>;
    exportUserData(userId: string, tenantId: string): Promise<{
        personalData: any;
        activityData: ActivityData[];
        consentHistory: ConsentRecord[];
        rightsRequests: DataSubjectRights[];
    }>;
    createDataFlowMapping(mapping: Omit<DataFlowMapping, 'id'>): Promise<DataFlowMapping>;
    getPrivacyAuditLogs(filter?: {
        tenantId?: string;
        userId?: string;
        operation?: PrivacyOperation;
        startDate?: Date;
        endDate?: Date;
        riskLevel?: RiskLevel;
    }): Promise<PrivacyAuditLog[]>;
    getComplianceReport(tenantId: string): Promise<{
        policyCompliance: Record<string, boolean>;
        consentCoverage: number;
        rightsRequestMetrics: Record<RightRequestStatus, number>;
        dataFlowRisks: Record<RiskLevel, number>;
        auditFindings: string[];
        recommendations: string[];
    }>;
    private validatePolicyCompliance;
    private getApplicablePolicies;
    private hasValidConsent;
    private applyPrivacyRule;
    private applyMinimizationRule;
    private classifyActivityData;
    private assessRisk;
    private logPrivacyOperation;
    private pseudonymizeActivity;
    private generalizeActivity;
    private suppressActivityData;
    private addNoiseToActivity;
    private applyKAnonymity;
    private applyDifferentialPrivacy;
    private tokenizeActivity;
    private hashActivityData;
    private pseudonymizeValue;
    private maskValue;
    private generalizeValue;
    private hashValue;
    private encryptSensitiveFields;
    private isValidConsentMethod;
    private processDataSubjectRightAsync;
    private processAccessRight;
    private processErasureRight;
    private processPortabilityRight;
    private getUserDataCategories;
    private assessDataFlowRisk;
    private performComplianceCheck;
    private checkViolations;
    private assessPolicyCompliance;
    private calculateConsentCoverage;
    private calculateRightsMetrics;
    private calculateDataFlowRisks;
    private generateAuditFindings;
    private generateComplianceRecommendations;
    private canEraseUserData;
    private initializeDefaultPolicies;
}

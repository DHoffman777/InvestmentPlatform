import { EventEmitter } from 'events';
export interface UserProfile {
    id: string;
    userId: string;
    tenantId: string;
    personalInfo: PersonalInfo;
    contactInfo: ContactInfo;
    preferences: UserPreferences;
    kycInfo: KYCInfo;
    riskProfile: RiskProfile;
    documents: ProfileDocument[];
    lastUpdated: Date;
    version: number;
    status: ProfileStatus;
    compliance: ComplianceStatus;
    auditTrail: ProfileAuditEntry[];
}
export interface PersonalInfo {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    ssn?: string;
    nationality: string;
    citizenship: string[];
    employmentStatus: EmploymentStatus;
    occupation: string;
    employer?: string;
    annualIncome?: number;
    netWorth?: number;
    liquidNetWorth?: number;
    investmentExperience: InvestmentExperience;
    maritalStatus: MaritalStatus;
    dependents: number;
}
export interface ContactInfo {
    primaryEmail: string;
    secondaryEmail?: string;
    phoneNumbers: PhoneNumber[];
    addresses: Address[];
    preferredContactMethod: ContactMethod;
    communicationPreferences: CommunicationPreferences;
    emergencyContact?: EmergencyContact;
}
export interface PhoneNumber {
    id: string;
    type: PhoneType;
    number: string;
    countryCode: string;
    isPrimary: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
}
export interface Address {
    id: string;
    type: AddressType;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isPrimary: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    effectiveFrom: Date;
    effectiveTo?: Date;
}
export interface UserPreferences {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    numberFormat: string;
    theme: 'light' | 'dark' | 'auto';
    dashboardLayout: DashboardLayout;
    notifications: NotificationPreferences;
    privacy: PrivacyPreferences;
    accessibility: AccessibilityPreferences;
}
export interface NotificationPreferences {
    email: EmailNotificationSettings;
    sms: SMSNotificationSettings;
    push: PushNotificationSettings;
    inApp: InAppNotificationSettings;
    frequency: NotificationFrequency;
    quietHours: QuietHours;
}
export interface KYCInfo {
    status: KYCStatus;
    tier: KYCTier;
    completedAt?: Date;
    documents: KYCDocument[];
    verificationMethods: VerificationMethod[];
    riskScore: number;
    sanctions: SanctionsCheck;
    pep: PEPCheck;
    adverseMedia: AdverseMediaCheck;
    lastReview: Date;
    nextReview: Date;
    exceptions: KYCException[];
}
export interface RiskProfile {
    riskTolerance: RiskTolerance;
    investmentObjectives: InvestmentObjective[];
    timeHorizon: TimeHorizon;
    liquidityNeeds: LiquidityNeeds;
    investmentKnowledge: InvestmentKnowledge;
    riskCapacity: RiskCapacity;
    suitabilityScore: number;
    lastAssessment: Date;
    assessmentHistory: RiskAssessment[];
}
export interface ProfileDocument {
    id: string;
    type: DocumentType;
    name: string;
    description?: string;
    uploadedAt: Date;
    uploadedBy: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    encryptionKeyId?: string;
    status: DocumentStatus;
    expiryDate?: Date;
    tags: string[];
    metadata: Record<string, any>;
}
export interface ProfileAuditEntry {
    id: string;
    timestamp: Date;
    userId: string;
    action: AuditAction;
    field?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    ipAddress: string;
    userAgent: string;
    source: AuditSource;
}
export declare enum ProfileStatus {
    DRAFT = "draft",
    PENDING_VERIFICATION = "pending_verification",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    CLOSED = "closed",
    ARCHIVED = "archived"
}
export declare enum ComplianceStatus {
    COMPLIANT = "compliant",
    NON_COMPLIANT = "non_compliant",
    UNDER_REVIEW = "under_review",
    EXEMPT = "exempt"
}
export declare enum EmploymentStatus {
    EMPLOYED = "employed",
    UNEMPLOYED = "unemployed",
    RETIRED = "retired",
    STUDENT = "student",
    SELF_EMPLOYED = "self_employed"
}
export declare enum InvestmentExperience {
    NONE = "none",
    LIMITED = "limited",
    GOOD = "good",
    EXTENSIVE = "extensive"
}
export declare enum MaritalStatus {
    SINGLE = "single",
    MARRIED = "married",
    DIVORCED = "divorced",
    WIDOWED = "widowed",
    SEPARATED = "separated"
}
export declare enum PhoneType {
    HOME = "home",
    WORK = "work",
    MOBILE = "mobile",
    FAX = "fax"
}
export declare enum AddressType {
    HOME = "home",
    WORK = "work",
    MAILING = "mailing",
    BILLING = "billing"
}
export declare enum ContactMethod {
    EMAIL = "email",
    PHONE = "phone",
    SMS = "sms",
    MAIL = "mail"
}
export declare enum KYCStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    PENDING_REVIEW = "pending_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare enum KYCTier {
    TIER_1 = "tier_1",// Basic
    TIER_2 = "tier_2",// Enhanced
    TIER_3 = "tier_3"
}
export declare enum DocumentType {
    GOVERNMENT_ID = "government_id",
    PASSPORT = "passport",
    DRIVERS_LICENSE = "drivers_license",
    UTILITY_BILL = "utility_bill",
    BANK_STATEMENT = "bank_statement",
    TAX_DOCUMENT = "tax_document",
    EMPLOYMENT_VERIFICATION = "employment_verification",
    PROOF_OF_INCOME = "proof_of_income",
    OTHER = "other"
}
export declare enum DocumentStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare enum RiskTolerance {
    CONSERVATIVE = "conservative",
    MODERATE = "moderate",
    AGGRESSIVE = "aggressive"
}
export declare enum TimeHorizon {
    SHORT_TERM = "short_term",// < 2 years
    MEDIUM_TERM = "medium_term",// 2-7 years
    LONG_TERM = "long_term"
}
export declare enum AuditAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    VIEW = "view",
    VERIFY = "verify",
    SUSPEND = "suspend",
    ACTIVATE = "activate"
}
export declare enum AuditSource {
    WEB_PORTAL = "web_portal",
    MOBILE_APP = "mobile_app",
    API = "api",
    ADMIN_PANEL = "admin_panel",
    SYSTEM = "system"
}
export interface CommunicationPreferences {
    language: string;
    marketingConsent: boolean;
    researchConsent: boolean;
    thirdPartyConsent: boolean;
    dataProcessingConsent: boolean;
    consentDate: Date;
}
export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
}
export interface DashboardLayout {
    widgets: string[];
    layout: 'grid' | 'list' | 'custom';
    theme: string;
}
export interface EmailNotificationSettings {
    enabled: boolean;
    types: string[];
    digest: boolean;
    immediate: boolean;
}
export interface SMSNotificationSettings {
    enabled: boolean;
    types: string[];
    emergencyOnly: boolean;
}
export interface PushNotificationSettings {
    enabled: boolean;
    types: string[];
    sound: boolean;
    vibration: boolean;
}
export interface InAppNotificationSettings {
    enabled: boolean;
    types: string[];
    popupDuration: number;
}
export interface NotificationFrequency {
    realTime: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
}
export interface QuietHours {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
}
export interface PrivacyPreferences {
    dataSharing: boolean;
    analytics: boolean;
    marketing: boolean;
    thirdParty: boolean;
}
export interface AccessibilityPreferences {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
}
export interface KYCDocument {
    id: string;
    type: DocumentType;
    status: DocumentStatus;
    uploadedAt: Date;
    verifiedAt?: Date;
    expiryDate?: Date;
}
export interface VerificationMethod {
    type: string;
    status: string;
    completedAt?: Date;
    provider: string;
}
export interface SanctionsCheck {
    status: string;
    checkedAt: Date;
    provider: string;
    matches: any[];
}
export interface PEPCheck {
    status: string;
    checkedAt: Date;
    provider: string;
    isPEP: boolean;
}
export interface AdverseMediaCheck {
    status: string;
    checkedAt: Date;
    provider: string;
    matches: any[];
}
export interface KYCException {
    id: string;
    type: string;
    reason: string;
    approvedBy: string;
    approvedAt: Date;
    expiryDate?: Date;
}
export interface InvestmentObjective {
    type: string;
    priority: number;
    targetAllocation?: number;
}
export interface LiquidityNeeds {
    immediateNeed: number;
    futureNeeds: Array<{
        date: Date;
        amount: number;
        description: string;
    }>;
}
export interface InvestmentKnowledge {
    level: string;
    categories: Record<string, string>;
    certifications: string[];
}
export interface RiskCapacity {
    score: number;
    factors: Record<string, number>;
    constraints: string[];
}
export interface RiskAssessment {
    id: string;
    completedAt: Date;
    score: number;
    responses: Record<string, any>;
    recommendations: string[];
}
export interface ProfileUpdateRequest {
    field: string;
    value: any;
    reason?: string;
    requiresApproval?: boolean;
}
export interface ProfileValidationError {
    field: string;
    message: string;
    code: string;
    severity: 'error' | 'warning' | 'info';
}
export declare class UserProfileService extends EventEmitter {
    private profiles;
    private validationRules;
    private complianceRules;
    constructor();
    createProfile(profileData: Omit<UserProfile, 'id' | 'lastUpdated' | 'version' | 'auditTrail'>): Promise<UserProfile>;
    getProfile(profileId: string): Promise<UserProfile | null>;
    getProfileByUserId(userId: string, tenantId: string): Promise<UserProfile | null>;
    updateProfile(profileId: string, updates: ProfileUpdateRequest[], updatedBy: string, ipAddress: string, userAgent: string): Promise<UserProfile | null>;
    addDocument(profileId: string, document: Omit<ProfileDocument, 'id' | 'uploadedAt'>, uploadedBy: string): Promise<ProfileDocument | null>;
    removeDocument(profileId: string, documentId: string, removedBy: string, reason: string): Promise<boolean>;
    updateKYCStatus(profileId: string, status: KYCStatus, updatedBy: string, reason: string): Promise<UserProfile | null>;
    getProfilesForTenant(tenantId: string, filter?: {
        status?: ProfileStatus;
        kycStatus?: KYCStatus;
        lastUpdatedAfter?: Date;
        lastUpdatedBefore?: Date;
    }): Promise<UserProfile[]>;
    validateProfile(profile: UserProfile): Promise<ProfileValidationError[]>;
    checkComplianceStatus(profile: UserProfile): Promise<ComplianceStatus>;
    getAuditTrail(profileId: string, filter?: {
        action?: AuditAction;
        field?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ProfileAuditEntry[]>;
    private validateFieldUpdate;
    private addAuditEntry;
    private getNestedProperty;
    private setNestedProperty;
    private isValidSSN;
    private isValidEmail;
    private initializeValidationRules;
    private initializeComplianceRules;
    private getErrorMessage;
}

import { EventEmitter } from 'events';
export interface KYCProfile {
    id: string;
    clientId: string;
    tenantId: string;
    workflowId: string;
    personalInfo: PersonalInformation;
    addressInfo: AddressInformation;
    identificationInfo: IdentificationInformation;
    financialInfo: FinancialInformation;
    businessInfo?: BusinessInformation;
    riskFactors: RiskFactor[];
    kycStatus: KYCStatus;
    amlStatus: AMLStatus;
    overallRisk: RiskLevel;
    completedAt?: Date;
    reviewedBy?: string;
    reviewNotes?: string;
    nextReviewDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface PersonalInformation {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: Date;
    placeOfBirth?: string;
    nationality: string;
    citizenship: string[];
    gender?: 'M' | 'F' | 'O';
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    socialSecurityNumber?: string;
    taxIdNumber?: string;
    mothersMaidenName?: string;
}
export interface AddressInformation {
    currentAddress: Address;
    previousAddresses: Address[];
    mailingAddress?: Address;
    addressHistory: AddressHistory[];
}
export interface Address {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: 'residential' | 'business' | 'mailing' | 'temporary';
    occupiedSince?: Date;
    occupiedUntil?: Date;
}
export interface AddressHistory {
    address: Address;
    residencyPeriod: {
        from: Date;
        to?: Date;
    };
    verified: boolean;
}
export interface IdentificationInformation {
    primaryId: IdentificationDocument;
    secondaryId?: IdentificationDocument;
    biometricData?: BiometricData;
    verificationMethods: VerificationMethod[];
}
export interface IdentificationDocument {
    type: 'drivers_license' | 'passport' | 'national_id' | 'military_id';
    number: string;
    issuingAuthority: string;
    issuingCountry: string;
    issueDate: Date;
    expirationDate: Date;
    verified: boolean;
    verificationSource: string;
}
export interface BiometricData {
    faceMatch?: {
        confidence: number;
        verified: boolean;
        verificationDate: Date;
    };
    voicePrint?: {
        enrolled: boolean;
        verificationDate?: Date;
    };
    fingerprint?: {
        enrolled: boolean;
        verificationDate?: Date;
    };
}
export interface VerificationMethod {
    method: 'document' | 'knowledge_based' | 'biometric' | 'database' | 'manual';
    provider: string;
    status: 'pending' | 'passed' | 'failed' | 'inconclusive';
    confidence: number;
    details: Record<string, any>;
    verifiedAt: Date;
}
export interface FinancialInformation {
    employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
    employer?: string;
    occupation?: string;
    industry?: string;
    annualIncome?: number;
    netWorth?: number;
    sourceOfWealth: SourceOfWealth[];
    sourceOfFunds: SourceOfFunds[];
    expectedTransactionVolume?: TransactionVolume;
    bankingRelationships: BankingRelationship[];
}
export interface SourceOfWealth {
    source: 'employment' | 'business_ownership' | 'inheritance' | 'investment_gains' | 'real_estate' | 'other';
    description?: string;
    percentage?: number;
    verified: boolean;
}
export interface SourceOfFunds {
    source: 'salary' | 'bonus' | 'business_income' | 'investment_income' | 'loan' | 'gift' | 'inheritance' | 'other';
    amount?: number;
    description?: string;
    verified: boolean;
}
export interface TransactionVolume {
    expectedMonthlyDeposits: number;
    expectedMonthlyWithdrawals: number;
    expectedAverageTransactionSize: number;
    expectedLargestTransaction: number;
}
export interface BankingRelationship {
    bankName: string;
    accountType: 'checking' | 'savings' | 'investment' | 'business';
    relationshipLength: number;
    verified: boolean;
}
export interface BusinessInformation {
    businessName: string;
    businessType: 'corporation' | 'llc' | 'partnership' | 'sole_proprietorship' | 'trust' | 'other';
    ein: string;
    industryCode: string;
    businessAddress: Address;
    registrationDate: Date;
    registrationJurisdiction: string;
    businessActivities: string[];
    annualRevenue?: number;
    numberOfEmployees?: number;
    publiclyTraded: boolean;
    stockSymbol?: string;
    beneficialOwners: BeneficialOwner[];
    authorizedSigners: AuthorizedSigner[];
}
export interface BeneficialOwner {
    personalInfo: PersonalInformation;
    ownershipPercentage: number;
    controlPercentage: number;
    title?: string;
    identificationVerified: boolean;
}
export interface AuthorizedSigner {
    personalInfo: PersonalInformation;
    title: string;
    authorityLevel: 'full' | 'limited' | 'view_only';
    identificationVerified: boolean;
}
export interface RiskFactor {
    type: RiskFactorType;
    level: RiskLevel;
    description: string;
    source: string;
    detectedAt: Date;
    mitigated: boolean;
    mitigationActions?: string[];
}
export interface AMLScreeningResult {
    id: string;
    clientId: string;
    screeningType: AMLScreeningType;
    provider: string;
    status: 'clear' | 'hit' | 'potential_match' | 'error';
    confidence: number;
    results: AMLHit[];
    screenedAt: Date;
    reviewedBy?: string;
    reviewNotes?: string;
    falsePositive?: boolean;
}
export interface AMLHit {
    listType: 'sanctions' | 'pep' | 'adverse_media' | 'watchlist';
    listName: string;
    matchScore: number;
    matchedName: string;
    matchedDetails: Record<string, any>;
    riskScore: number;
    lastUpdated: Date;
}
export declare enum KYCStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    ADDITIONAL_INFO_REQUIRED = "ADDITIONAL_INFO_REQUIRED",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED"
}
export declare enum AMLStatus {
    NOT_SCREENED = "NOT_SCREENED",
    SCREENING_IN_PROGRESS = "SCREENING_IN_PROGRESS",
    CLEAR = "CLEAR",
    POTENTIAL_MATCH = "POTENTIAL_MATCH",
    HIT_CONFIRMED = "HIT_CONFIRMED",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED_WITH_CONDITIONS = "APPROVED_WITH_CONDITIONS",
    REJECTED = "REJECTED"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RiskFactorType {
    GEOGRAPHIC = "GEOGRAPHIC",
    POLITICAL_EXPOSURE = "POLITICAL_EXPOSURE",
    ADVERSE_MEDIA = "ADVERSE_MEDIA",
    SANCTIONS = "SANCTIONS",
    HIGH_RISK_BUSINESS = "HIGH_RISK_BUSINESS",
    LARGE_CASH_TRANSACTIONS = "LARGE_CASH_TRANSACTIONS",
    FREQUENT_TRANSACTIONS = "FREQUENT_TRANSACTIONS",
    UNUSUAL_TRANSACTION_PATTERNS = "UNUSUAL_TRANSACTION_PATTERNS",
    INSUFFICIENT_DOCUMENTATION = "INSUFFICIENT_DOCUMENTATION",
    INCONSISTENT_INFORMATION = "INCONSISTENT_INFORMATION",
    REGULATORY_ACTION = "REGULATORY_ACTION",
    CRIMINAL_BACKGROUND = "CRIMINAL_BACKGROUND",
    OTHER = "OTHER"
}
export declare enum AMLScreeningType {
    INITIAL_SCREENING = "INITIAL_SCREENING",
    PERIODIC_SCREENING = "PERIODIC_SCREENING",
    TRANSACTION_SCREENING = "TRANSACTION_SCREENING",
    AD_HOC_SCREENING = "AD_HOC_SCREENING"
}
export declare class KYCAMLIntegrationService extends EventEmitter {
    private kycProfiles;
    private amlScreeningResults;
    constructor();
    initiateKYCProcess(clientId: string, tenantId: string, workflowId: string, initialData: Partial<KYCProfile>): Promise<KYCProfile>;
    private performIdentityVerification;
    private performAddressVerification;
    private performAMLScreening;
    private performRiskAssessment;
    getKYCProfile(kycProfileId: string): KYCProfile | undefined;
    getKYCProfileByClient(clientId: string): KYCProfile | undefined;
    getAMLScreeningResults(clientId: string): AMLScreeningResult[];
}

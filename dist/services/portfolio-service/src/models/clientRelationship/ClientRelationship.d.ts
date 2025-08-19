import { Decimal } from '@prisma/client/runtime/library';
export declare enum ClientType {
    INDIVIDUAL = "INDIVIDUAL",
    JOINT = "JOINT",
    ENTITY = "ENTITY",
    TRUST = "TRUST",
    RETIREMENT = "RETIREMENT",
    CORPORATE = "CORPORATE"
}
export declare enum ClientStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PROSPECT = "PROSPECT",
    SUSPENDED = "SUSPENDED",
    CLOSED = "CLOSED"
}
export declare enum RiskTolerance {
    CONSERVATIVE = "CONSERVATIVE",
    MODERATE_CONSERVATIVE = "MODERATE_CONSERVATIVE",
    MODERATE = "MODERATE",
    MODERATE_AGGRESSIVE = "MODERATE_AGGRESSIVE",
    AGGRESSIVE = "AGGRESSIVE"
}
export declare enum InvestmentExperience {
    NOVICE = "NOVICE",
    LIMITED = "LIMITED",
    MODERATE = "MODERATE",
    EXTENSIVE = "EXTENSIVE",
    PROFESSIONAL = "PROFESSIONAL"
}
export declare enum LiquidityNeeds {
    LOW = "LOW",
    MODERATE = "MODERATE",
    HIGH = "HIGH",
    IMMEDIATE = "IMMEDIATE"
}
export declare enum DocumentDeliveryPreference {
    ELECTRONIC = "ELECTRONIC",
    PAPER = "PAPER",
    BOTH = "BOTH"
}
export declare enum CommunicationMethod {
    EMAIL = "EMAIL",
    PHONE = "PHONE",
    SMS = "SMS",
    MAIL = "MAIL",
    SECURE_MESSAGE = "SECURE_MESSAGE"
}
export declare enum RelationshipType {
    PRIMARY = "PRIMARY",
    JOINT_OWNER = "JOINT_OWNER",
    BENEFICIARY = "BENEFICIARY",
    TRUSTEE = "TRUSTEE",
    POWER_OF_ATTORNEY = "POWER_OF_ATTORNEY",
    GUARDIAN = "GUARDIAN",
    CUSTODIAN = "CUSTODIAN",
    AUTHORIZED_TRADER = "AUTHORIZED_TRADER"
}
export declare enum MeetingType {
    INITIAL_CONSULTATION = "INITIAL_CONSULTATION",
    PORTFOLIO_REVIEW = "PORTFOLIO_REVIEW",
    FINANCIAL_PLANNING = "FINANCIAL_PLANNING",
    INVESTMENT_DISCUSSION = "INVESTMENT_DISCUSSION",
    ADMINISTRATIVE = "ADMINISTRATIVE",
    COMPLAINT_RESOLUTION = "COMPLAINT_RESOLUTION",
    FOLLOW_UP = "FOLLOW_UP"
}
export declare enum OnboardingStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    DOCUMENTATION_PENDING = "DOCUMENTATION_PENDING",
    COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED"
}
export interface ClientProfile {
    id: string;
    tenantId: string;
    clientNumber: string;
    clientType: ClientType;
    status: ClientStatus;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    entityName?: string;
    dateOfBirth?: Date;
    socialSecurityNumber?: string;
    taxId?: string;
    email: string;
    phoneNumber?: string;
    mobileNumber?: string;
    primaryAddress: Address;
    mailingAddress?: Address;
    investmentObjectives: InvestmentObjective[];
    riskTolerance: RiskTolerance;
    investmentExperience: InvestmentExperience;
    liquidityNeeds: LiquidityNeeds;
    timeHorizon: number;
    netWorth?: Decimal;
    annualIncome?: Decimal;
    liquidNetWorth?: Decimal;
    investmentExperienceYears?: number;
    investmentRestrictions: InvestmentRestriction[];
    documentDeliveryPreference: DocumentDeliveryPreference;
    communicationPreferences: CommunicationPreference[];
    politicallyExposedPerson: boolean;
    employeeOfBrokerDealer: boolean;
    directorOfPublicCompany: boolean;
    primaryAdvisor?: string;
    assignedTeam: string[];
    relationshipStartDate: Date;
    lastContactDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface Address {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isPrimary: boolean;
}
export interface InvestmentObjective {
    id: string;
    objective: string;
    priority: number;
    targetAllocation?: Decimal;
    description?: string;
}
export interface InvestmentRestriction {
    id: string;
    restrictionType: string;
    description: string;
    appliesTo: string;
    isActive: boolean;
    effectiveDate: Date;
    expirationDate?: Date;
}
export interface CommunicationPreference {
    method: CommunicationMethod;
    frequency: string;
    timePreference?: string;
    isPreferred: boolean;
}
export interface HouseholdGroup {
    id: string;
    tenantId: string;
    householdName: string;
    primaryClientId: string;
    relationships: ClientRelationship[];
    totalAssets: Decimal;
    combinedRiskTolerance?: RiskTolerance;
    sharedObjectives: InvestmentObjective[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ClientRelationship {
    id: string;
    primaryClientId: string;
    relatedClientId: string;
    relationshipType: RelationshipType;
    percentage?: Decimal;
    isActive: boolean;
    effectiveDate: Date;
    expirationDate?: Date;
    notes?: string;
    documentationRequired: boolean;
    documentationComplete: boolean;
}
export interface CommunicationHistory {
    id: string;
    clientId: string;
    tenantId: string;
    communicationType: CommunicationMethod;
    subject: string;
    content: string;
    direction: 'INBOUND' | 'OUTBOUND';
    contactedBy: string;
    contactedAt: Date;
    followUpRequired: boolean;
    followUpDate?: Date;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    attachments: CommunicationAttachment[];
    relatedMeetingId?: string;
    createdAt: Date;
    createdBy: string;
}
export interface CommunicationAttachment {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storageLocation: string;
    uploadedBy: string;
    uploadedAt: Date;
}
export interface ClientMeeting {
    id: string;
    clientId: string;
    tenantId: string;
    meetingType: MeetingType;
    title: string;
    scheduledDate: Date;
    duration: number;
    location?: string;
    isVirtual: boolean;
    virtualMeetingLink?: string;
    advisors: MeetingParticipant[];
    clients: MeetingParticipant[];
    agenda: string[];
    meetingNotes?: string;
    actionItems: ActionItem[];
    followUpRequired: boolean;
    nextMeetingDate?: Date;
    status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface MeetingParticipant {
    userId: string;
    name: string;
    role: string;
    isRequired: boolean;
    attendanceStatus: 'NOT_RESPONDED' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'ATTENDED' | 'NO_SHOW';
}
export interface ActionItem {
    id: string;
    description: string;
    assignedTo: string;
    dueDate?: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    completedDate?: Date;
    notes?: string;
}
export interface ClientDocument {
    id: string;
    clientId: string;
    tenantId: string;
    documentType: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    subcategory?: string;
    tags: string[];
    confidentialityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    storageLocation: string;
    checksum: string;
    description?: string;
    documentDate?: Date;
    expirationDate?: Date;
    isArchived: boolean;
    retentionPeriod?: number;
    accessPermissions: DocumentPermission[];
    version: string;
    previousVersionId?: string;
    isLatestVersion: boolean;
    uploadedBy: string;
    uploadedAt: Date;
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DocumentPermission {
    userId: string;
    permission: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
}
export interface OnboardingWorkflow {
    id: string;
    clientId: string;
    tenantId: string;
    workflowTemplate: string;
    status: OnboardingStatus;
    currentStep: number;
    totalSteps: number;
    steps: OnboardingStep[];
    startedDate: Date;
    estimatedCompletionDate?: Date;
    actualCompletionDate?: Date;
    assignedAdvisor: string;
    assignedTeam: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface OnboardingStep {
    stepNumber: number;
    stepName: string;
    description: string;
    isRequired: boolean;
    isCompleted: boolean;
    completedDate?: Date;
    completedBy?: string;
    requiredDocuments: string[];
    requiredActions: string[];
    dependsOnSteps: number[];
    estimatedDuration: number;
    dueDate?: Date;
    notes?: string;
}
export interface SuitabilityAssessment {
    id: string;
    clientId: string;
    tenantId: string;
    assessmentDate: Date;
    assessmentType: 'INITIAL' | 'PERIODIC' | 'TRIGGER_EVENT' | 'REGULATORY';
    riskTolerance: RiskTolerance;
    riskCapacity: 'LOW' | 'MODERATE' | 'HIGH';
    investmentObjectives: string[];
    timeHorizon: number;
    liquidityNeeds: LiquidityNeeds;
    netWorth: Decimal;
    annualIncome: Decimal;
    investmentExperience: InvestmentExperience;
    overallScore: number;
    riskScore: number;
    objectiveAlignment: number;
    recommendedAllocation: AssetAllocation[];
    unsuitableInvestments: string[];
    reviewedBy: string;
    approvedBy?: string;
    reviewDate: Date;
    approvalDate?: Date;
    nextReviewDate: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface AssetAllocation {
    assetClass: string;
    targetPercentage: Decimal;
    minPercentage?: Decimal;
    maxPercentage?: Decimal;
    rationale: string;
}
export interface ClientProfileRequest {
    clientType: ClientType;
    firstName?: string;
    lastName?: string;
    entityName?: string;
    email: string;
    phoneNumber?: string;
    primaryAddress: Address;
    investmentObjectives: Omit<InvestmentObjective, 'id'>[];
    riskTolerance: RiskTolerance;
    investmentExperience: InvestmentExperience;
    liquidityNeeds: LiquidityNeeds;
    timeHorizon: number;
    investmentRestrictions?: Omit<InvestmentRestriction, 'id'>[];
    documentDeliveryPreference: DocumentDeliveryPreference;
    communicationPreferences: CommunicationPreference[];
}
export interface ClientProfileResponse {
    client: ClientProfile;
    portfolios?: any[];
    totalAssets?: Decimal;
    householdInfo?: {
        householdId?: string;
        householdName?: string;
        householdAssets?: Decimal;
    };
}
export interface MeetingRequest {
    clientId: string;
    meetingType: MeetingType;
    title: string;
    scheduledDate: Date;
    duration: number;
    location?: string;
    isVirtual: boolean;
    virtualMeetingLink?: string;
    advisors: Omit<MeetingParticipant, 'attendanceStatus'>[];
    clients: Omit<MeetingParticipant, 'attendanceStatus'>[];
    agenda: string[];
}
export interface CommunicationRequest {
    clientId: string;
    communicationType: CommunicationMethod;
    subject: string;
    content: string;
    direction: 'INBOUND' | 'OUTBOUND';
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    followUpRequired: boolean;
    followUpDate?: Date;
}
export interface SuitabilityAssessmentRequest {
    clientId: string;
    assessmentType: 'INITIAL' | 'PERIODIC' | 'TRIGGER_EVENT' | 'REGULATORY';
    riskTolerance: RiskTolerance;
    investmentObjectives: string[];
    timeHorizon: number;
    liquidityNeeds: LiquidityNeeds;
    netWorth: Decimal;
    annualIncome: Decimal;
    investmentExperience: InvestmentExperience;
}
export interface ClientAnalytics {
    clientId: string;
    portfolioCount: number;
    totalAssets: Decimal;
    assetAllocation: AssetAllocation[];
    performanceMetrics: {
        ytdReturn: Decimal;
        oneYearReturn: Decimal;
        threeYearReturn: Decimal;
        inceptionReturn: Decimal;
        volatility: Decimal;
        sharpeRatio: Decimal;
    };
    riskMetrics: {
        valueAtRisk: Decimal;
        trackingError: Decimal;
        beta: Decimal;
        correlation: Decimal;
    };
    activitySummary: {
        lastTradeDate: Date;
        tradesYtd: number;
        lastMeetingDate: Date;
        nextMeetingDate?: Date;
        lastContactDate: Date;
    };
}
export interface ClientSegmentation {
    segmentName: string;
    criteria: {
        minAssets?: Decimal;
        maxAssets?: Decimal;
        riskTolerance?: RiskTolerance[];
        clientType?: ClientType[];
        investmentExperience?: InvestmentExperience[];
    };
    clientCount: number;
    totalAssets: Decimal;
    averageAssets: Decimal;
}

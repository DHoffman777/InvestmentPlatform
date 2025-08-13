export interface DataSubject {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  residenceCountry: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isMinor: boolean;
  legalBasis: LegalBasis[];
  consentRecords: ConsentRecord[];
  dataProcessingActivities: string[];
  retentionPeriods: DataRetentionPeriod[];
}

export interface LegalBasis {
  id: string;
  type: 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'VITAL_INTERESTS' | 'PUBLIC_TASK' | 'LEGITIMATE_INTERESTS';
  description: string;
  dataCategories: string[];
  processingPurposes: string[];
  validFrom: Date;
  validUntil?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'WITHDRAWN' | 'REVOKED';
  evidence?: string;
  balancingTest?: string; // For legitimate interests
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  consentType: 'EXPLICIT' | 'IMPLICIT' | 'OPT_IN' | 'OPT_OUT';
  purposes: string[];
  dataCategories: string[];
  consentText: string;
  consentMethod: 'WEB_FORM' | 'EMAIL' | 'PHONE' | 'PAPER' | 'API';
  grantedAt: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  isValid: boolean;
  parentalConsent?: boolean; // For minors
  evidenceHash: string;
  version: string;
  renewalRequired?: Date;
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  dataController: string;
  dataProcessor?: string;
  legalBasis: LegalBasis[];
  dataCategories: DataCategory[];
  dataSubjectCategories: string[];
  processingPurposes: string[];
  retentionPeriod: number; // in days
  automatedDecisionMaking: boolean;
  profiling: boolean;
  thirdPartyTransfers: ThirdPartyTransfer[];
  safeguards: string[];
  riskAssessment: RiskAssessment;
  lastReviewed: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
}

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'SPECIAL'; // Special categories under Article 9
  examples: string[];
  retentionPeriod: number;
  encryptionRequired: boolean;
  accessRestrictions: string[];
}

export interface ThirdPartyTransfer {
  id: string;
  recipientName: string;
  recipientCountry: string;
  transferMechanism: 'ADEQUACY_DECISION' | 'STANDARD_CONTRACTUAL_CLAUSES' | 'BINDING_CORPORATE_RULES' | 'CERTIFICATION' | 'DEROGATION';
  safeguards: string[];
  dataCategories: string[];
  purposes: string[];
  establishedAt: Date;
  reviewDate: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
}

export interface RiskAssessment {
  id: string;
  conductedAt: Date;
  conductedBy: string;
  methodology: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  identifiedRisks: IdentifiedRisk[];
  mitigationMeasures: MitigationMeasure[];
  residualRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  reviewDate: Date;
  dpiaRequired: boolean;
  dpiaCompleted?: Date;
}

export interface IdentifiedRisk {
  id: string;
  type: 'BREACH' | 'UNAUTHORIZED_ACCESS' | 'DATA_LOSS' | 'PROFILING' | 'DISCRIMINATION' | 'IDENTITY_THEFT' | 'OTHER';
  description: string;
  likelihood: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  impact: 'NEGLIGIBLE' | 'LIMITED' | 'SIGNIFICANT' | 'SEVERE';
  riskScore: number;
  affectedDataSubjects: number;
  dataCategories: string[];
}

export interface MitigationMeasure {
  id: string;
  type: 'TECHNICAL' | 'ORGANIZATIONAL' | 'LEGAL' | 'PHYSICAL';
  description: string;
  implementation: string;
  effectiveness: 'LOW' | 'MEDIUM' | 'HIGH';
  cost: 'LOW' | 'MEDIUM' | 'HIGH';
  implementedAt?: Date;
  responsiblePerson: string;
  reviewDate: Date;
}

export interface DataRetentionPeriod {
  id: string;
  dataCategory: string;
  retentionPeriod: number; // in days
  legalBasis: string;
  automaticDeletion: boolean;
  reviewPeriod: number; // in days
  lastReview: Date;
  extensions?: RetentionExtension[];
}

export interface RetentionExtension {
  id: string;
  reason: string;
  legalBasis: string;
  extensionPeriod: number; // in days
  approvedBy: string;
  approvedAt: Date;
  reviewDate: Date;
}

export interface DataSubjectRequest {
  id: string;
  dataSubjectId: string;
  requestType: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICTION' | 'PORTABILITY' | 'OBJECTION' | 'COMPLAINT';
  description: string;
  requestedAt: Date;
  verifiedAt?: Date;
  verificationMethod?: 'EMAIL' | 'PHONE' | 'IDENTITY_DOCUMENT' | 'TWO_FACTOR';
  status: 'PENDING' | 'VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'PARTIALLY_FULFILLED';
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline: Date;
  responseAt?: Date;
  responseMethod?: 'EMAIL' | 'SECURE_PORTAL' | 'MAIL' | 'IN_PERSON';
  documents: RequestDocument[];
  communicationLog: CommunicationLog[];
  rejectionReason?: string;
  partialFulfillmentReason?: string;
}

export interface RequestDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  encrypted: boolean;
  hash: string;
  description?: string;
}

export interface CommunicationLog {
  id: string;
  timestamp: Date;
  direction: 'INBOUND' | 'OUTBOUND';
  method: 'EMAIL' | 'PHONE' | 'PORTAL' | 'MAIL' | 'IN_PERSON';
  summary: string;
  attachments?: string[];
  handledBy: string;
}

export interface DataBreach {
  id: string;
  incidentNumber: string;
  discoveredAt: Date;
  reportedAt?: Date;
  notifiedAt?: Date; // When authorities were notified
  breachType: 'CONFIDENTIALITY' | 'INTEGRITY' | 'AVAILABILITY' | 'COMBINED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedDataSubjects: number;
  dataCategories: string[];
  causeCategory: 'MALICIOUS_ATTACK' | 'HUMAN_ERROR' | 'SYSTEM_FAILURE' | 'THIRD_PARTY' | 'UNKNOWN';
  description: string;
  technicalDetails: string;
  containmentMeasures: ContainmentMeasure[];
  notificationRequired: boolean;
  notificationDeadline?: Date;
  communicationPlan: CommunicationPlan;
  lessons: string[];
  preventiveMeasures: string[];
  status: 'DISCOVERED' | 'CONTAINED' | 'INVESTIGATED' | 'RESOLVED' | 'UNDER_REVIEW';
  dpoNotified: boolean;
  authorityNotified: boolean;
  dataSubjectsNotified: boolean;
  cost?: number;
  reputationImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
}

export interface ContainmentMeasure {
  id: string;
  action: string;
  implementedAt: Date;
  implementedBy: string;
  effectiveness: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface CommunicationPlan {
  internalNotification: {
    completed: boolean;
    timestamp?: Date;
    recipients: string[];
  };
  authorityNotification: {
    required: boolean;
    completed: boolean;
    timestamp?: Date;
    authority: string;
    referenceNumber?: string;
  };
  dataSubjectNotification: {
    required: boolean;
    completed: boolean;
    timestamp?: Date;
    method: 'EMAIL' | 'LETTER' | 'WEBSITE' | 'MEDIA';
    recipients: number;
  };
}

export interface PrivacyImpactAssessment {
  id: string;
  activityId: string;
  conductedAt: Date;
  conductedBy: string;
  methodology: string;
  scope: string;
  dataFlowAnalysis: DataFlow[];
  stakeholderConsultation: StakeholderInput[];
  riskAssessment: RiskAssessment;
  mitigationPlan: MitigationPlan;
  monitoringPlan: MonitoringPlan;
  conclusionAndRecommendations: string;
  supervisoryAuthorityConsultation?: AuthorityConsultation;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewDate: Date;
  version: string;
}

export interface DataFlow {
  id: string;
  source: string;
  destination: string;
  dataCategories: string[];
  transferMechanism: string;
  frequency: string;
  volume: string;
  retention: string;
  safeguards: string[];
}

export interface StakeholderInput {
  id: string;
  stakeholderType: 'DATA_SUBJECT' | 'EMPLOYEE' | 'CUSTOMER' | 'PARTNER' | 'REGULATOR' | 'OTHER';
  consultationMethod: 'SURVEY' | 'INTERVIEW' | 'WORKSHOP' | 'FOCUS_GROUP' | 'WRITTEN_SUBMISSION';
  concerns: string[];
  suggestions: string[];
  consultedAt: Date;
}

export interface MitigationPlan {
  measures: MitigationMeasure[];
  timeline: string;
  responsibilities: string[];
  budget?: number;
  successCriteria: string[];
}

export interface MonitoringPlan {
  kpis: string[];
  reviewFrequency: string;
  responsibleParties: string[];
  reportingStructure: string;
  escalationProcedures: string[];
}

export interface AuthorityConsultation {
  required: boolean;
  completed: boolean;
  consultedAt?: Date;
  authority: string;
  referenceNumber?: string;
  response?: string;
  recommendations?: string[];
}

export interface GDPRComplianceConfig {
  service: {
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
  };
  database: {
    redis: {
      host: string;
      port: number;
      password?: string;
      db: number;
    };
  };
  encryption: {
    algorithm: string;
    keySize: number;
    secretKey: string;
    ivLength: number;
  };
  retention: {
    defaultPeriod: number; // days
    automaticDeletion: boolean;
    deletionSchedule: string; // cron expression
    gracePeriod: number; // days before actual deletion
  };
  consent: {
    renewalPeriod: number; // days
    reminderPeriod: number; // days before expiry
    cookieLifetime: number; // days
    consentVersion: string;
  };
  requests: {
    verificationRequired: boolean;
    responseTimeLimit: number; // days (30 by law)
    reminderThreshold: number; // days before deadline
    autoAssignment: boolean;
    defaultAssignee?: string;
  };
  breaches: {
    notificationDeadline: number; // hours (72 by law)
    autoNotification: boolean;
    severityThreshold: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    requireApproval: boolean;
  };
  notifications: {
    email: {
      enabled: boolean;
      smtpHost?: string;
      smtpPort?: number;
      username?: string;
      password?: string;
      fromAddress?: string;
    };
    sms: {
      enabled: boolean;
      provider?: string;
      apiKey?: string;
    };
    webhook: {
      enabled: boolean;
      endpoints: string[];
    };
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    detailedLogging: boolean;
    anonymizeAfterDays: number;
  };
  dpo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    certificateNumber?: string;
  };
  supervisoryAuthority: {
    name: string;
    contactEmail: string;
    reportingPortal?: string;
    jurisdiction: string;
  };
}

export interface ComplianceMetrics {
  timestamp: Date;
  dataSubjects: {
    total: number;
    verified: number;
    minors: number;
    activeConsents: number;
    expiredConsents: number;
  };
  requests: {
    total: number;
    pending: number;
    overdue: number;
    completed: number;
    averageResponseTime: number;
  };
  breaches: {
    total: number;
    open: number;
    resolved: number;
    notifiedToAuthority: number;
    averageContainmentTime: number;
  };
  compliance: {
    consentRate: number;
    dataMinimizationScore: number;
    retentionComplianceRate: number;
    securityScore: number;
    overallScore: number;
  };
  risks: {
    high: number;
    medium: number;
    low: number;
    mitigated: number;
  };
}

export interface PrivacyNotice {
  id: string;
  version: string;
  effectiveDate: Date;
  language: string;
  dataController: string;
  contactDetails: string;
  dpoContact: string;
  dataCategories: DataCategoryNotice[];
  processingPurposes: ProcessingPurposeNotice[];
  legalBases: string[];
  retentionPeriods: string[];
  dataSubjectRights: string[];
  thirdPartySharing: ThirdPartyNotice[];
  internationalTransfers: TransferNotice[];
  automatizedDecisionMaking: string;
  cookiePolicy?: string;
  lastUpdated: Date;
  publishedAt: Date;
  acceptanceRequired: boolean;
}

export interface DataCategoryNotice {
  category: string;
  description: string;
  examples: string[];
  mandatory: boolean;
  source: 'DIRECTLY_FROM_YOU' | 'THIRD_PARTIES' | 'PUBLIC_SOURCES' | 'AUTOMATED_COLLECTION';
}

export interface ProcessingPurposeNotice {
  purpose: string;
  description: string;
  legalBasis: string;
  dataCategories: string[];
  retention: string;
  mandatory: boolean;
}

export interface ThirdPartyNotice {
  name: string;
  purpose: string;
  dataCategories: string[];
  country?: string;
  safeguards?: string[];
}

export interface TransferNotice {
  countries: string[];
  adequacyDecision: boolean;
  safeguards: string[];
  dataCategories: string[];
}
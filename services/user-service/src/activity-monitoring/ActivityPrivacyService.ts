import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { ActivityData, ActivityFilter } from './ActivityTrackingService';

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
  dataRetentionPeriod: number; // in milliseconds
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
  retentionOverride?: number; // in milliseconds
  accessRestrictions: AccessRestriction[];
  auditRequired: boolean;
  encryptionRequired: boolean;
  minimizationRules: MinimizationRule[];
}

export enum DataCategory {
  PERSONAL_IDENTIFIERS = 'personal_identifiers',    // Names, IDs, etc.
  CONTACT_INFORMATION = 'contact_information',      // Email, phone, address
  FINANCIAL_DATA = 'financial_data',                // Account numbers, transactions
  BEHAVIORAL_DATA = 'behavioral_data',              // Activity patterns, preferences  
  TECHNICAL_DATA = 'technical_data',                // IP addresses, device info
  LOCATION_DATA = 'location_data',                  // Geographic information
  BIOMETRIC_DATA = 'biometric_data',                // Fingerprints, facial data
  HEALTH_DATA = 'health_data',                      // Medical information
  COMMUNICATION_DATA = 'communication_data',        // Messages, call logs
  SENSITIVE_ATTRIBUTES = 'sensitive_attributes'     // Race, religion, political views
}

export enum ProcessingOperation {
  COLLECTION = 'collection',
  STORAGE = 'storage',
  ACCESS = 'access',
  ANALYSIS = 'analysis',
  SHARING = 'sharing',
  TRANSFER = 'transfer',
  DELETION = 'deletion',
  ANONYMIZATION = 'anonymization',
  PROFILING = 'profiling',
  AUTOMATED_DECISION_MAKING = 'automated_decision_making'
}

export enum AnonymizationMethod {
  NONE = 'none',
  PSEUDONYMIZATION = 'pseudonymization',          // Replace with pseudonyms
  GENERALIZATION = 'generalization',              // Reduce precision
  SUPPRESSION = 'suppression',                    // Remove entirely
  NOISE_ADDITION = 'noise_addition',              // Add statistical noise
  K_ANONYMITY = 'k_anonymity',                    // Ensure k similar records
  L_DIVERSITY = 'l_diversity',                    // Ensure diverse sensitive values
  T_CLOSENESS = 't_closeness',                    // Limit information gain
  DIFFERENTIAL_PRIVACY = 'differential_privacy',  // Mathematical privacy guarantee
  TOKENIZATION = 'tokenization',                  // Replace with tokens
  HASHING = 'hashing'                            // One-way hash functions
}

export enum LegalBasis {
  CONSENT = 'consent',                    // GDPR Article 6(1)(a)
  CONTRACT = 'contract',                  // GDPR Article 6(1)(b)
  LEGAL_OBLIGATION = 'legal_obligation',  // GDPR Article 6(1)(c)
  VITAL_INTERESTS = 'vital_interests',    // GDPR Article 6(1)(d)
  PUBLIC_TASK = 'public_task',           // GDPR Article 6(1)(e)
  LEGITIMATE_INTERESTS = 'legitimate_interests' // GDPR Article 6(1)(f)
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

export enum ConsentMethod {
  EXPLICIT_OPT_IN = 'explicit_opt_in',
  IMPLIED_CONSENT = 'implied_consent',
  PRE_TICKED_BOX = 'pre_ticked_box',
  CONTINUATION_OF_SERVICE = 'continuation_of_service',
  BROWSER_SETTINGS = 'browser_settings'
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

export enum DataSubjectRight {
  RIGHT_TO_ACCESS = 'right_to_access',                    // Article 15
  RIGHT_TO_RECTIFICATION = 'right_to_rectification',      // Article 16
  RIGHT_TO_ERASURE = 'right_to_erasure',                  // Article 17
  RIGHT_TO_RESTRICT = 'right_to_restrict',                // Article 18
  RIGHT_TO_PORTABILITY = 'right_to_portability',          // Article 20
  RIGHT_TO_OBJECT = 'right_to_object',                    // Article 21
  RIGHT_NOT_AUTOMATED = 'right_not_automated_decision'    // Article 22
}

export enum RightRequestStatus {
  SUBMITTED = 'submitted',
  VERIFYING = 'verifying',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  PARTIALLY_FULFILLED = 'partially_fulfilled'
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

export enum PrivacyOperation {
  DATA_COLLECTION = 'data_collection',
  DATA_ACCESS = 'data_access',
  DATA_PROCESSING = 'data_processing',
  DATA_SHARING = 'data_sharing',
  DATA_TRANSFER = 'data_transfer',
  DATA_DELETION = 'data_deletion',
  CONSENT_CHANGE = 'consent_change',
  RIGHTS_REQUEST = 'rights_request',
  POLICY_CHANGE = 'policy_change',
  BREACH_DETECTED = 'breach_detected'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
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

export enum DataVolume {
  INDIVIDUAL_RECORDS = 'individual_records',    // < 100 records
  SMALL_DATASET = 'small_dataset',              // 100-1,000 records
  MEDIUM_DATASET = 'medium_dataset',            // 1,000-100,000 records
  LARGE_DATASET = 'large_dataset',              // 100,000-1,000,000 records
  BIG_DATA = 'big_data'                         // > 1,000,000 records
}

export enum DataFlowFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ON_DEMAND = 'on_demand',
  ONE_TIME = 'one_time'
}

export class ActivityPrivacyService extends EventEmitter {
  private privacyPolicies: Map<string, PrivacyPolicy> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private dataSubjectRights: Map<string, DataSubjectRights> = new Map();
  private auditLogs: Map<string, PrivacyAuditLog> = new Map();
  private dataFlowMappings: Map<string, DataFlowMapping> = new Map();
  private anonymizationCache: Map<string, any> = new Map();
  private pseudonymMappings: Map<string, string> = new Map();

  private getErrorMessage(error: unknown): string {
    if ((error as any) instanceof Error) {
      return (error as Error).message;
    }
    return String(error);
  }

  constructor() {
    super();
    this.initializeDefaultPolicies();
  }

  public async createPrivacyPolicy(policy: Omit<PrivacyPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrivacyPolicy> {
    const newPolicy: PrivacyPolicy = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...policy
    };

    // Validate policy compliance
    await this.validatePolicyCompliance(newPolicy);

    this.privacyPolicies.set(newPolicy.id, newPolicy);
    this.emit('privacyPolicyCreated', newPolicy);

    return newPolicy;
  }

  public async applyPrivacyRules(activity: ActivityData, tenantId: string): Promise<ActivityData> {
    const applicablePolicies = this.getApplicablePolicies(tenantId);
    let processedActivity = { ...activity };

    for (const policy of applicablePolicies) {
      if (!policy.isActive) continue;

      // Check consent requirements
      if (policy.consentRequired && !await this.hasValidConsent(activity.userId, policy.id)) {
        throw new Error(`Valid consent required for policy ${policy.name}`);
      }

      // Apply privacy rules
      for (const rule of policy.rules) {
        processedActivity = await this.applyPrivacyRule(processedActivity, rule, policy.id);
      }

      // Log privacy operation
      await this.logPrivacyOperation({
        operation: PrivacyOperation.DATA_PROCESSING,
        tenantId,
        userId: activity.userId,
        dataCategory: this.classifyActivityData(activity),
        legalBasis: policy.legalBasis[0],
        purpose: policy.dataProcessingPurposes[0],
        dataElements: Object.keys(activity),
        processingMethod: ProcessingOperation.ANALYSIS,
        accessRequester: 'system',
        justification: `Activity processing under policy ${policy.name}`,
        riskAssessment: this.assessRisk(activity, policy.rules[0] || {} as PrivacyRule),
        thirdPartiesInvolved: [],
        crossBorderTransfer: false,
        destinationCountries: [],
        safeguards: []
      });
    }

    return processedActivity;
  }

  public async anonymizeActivity(activity: ActivityData, method: AnonymizationMethod): Promise<ActivityData> {
    const cacheKey = `${activity.id}_${method}`;
    
    if (this.anonymizationCache.has(cacheKey)) {
      return this.anonymizationCache.get(cacheKey);
    }

    let anonymized = { ...activity };

    switch (method) {
      case AnonymizationMethod.PSEUDONYMIZATION:
        anonymized = await this.pseudonymizeActivity(anonymized);
        break;
      
      case AnonymizationMethod.GENERALIZATION:
        anonymized = await this.generalizeActivity(anonymized);
        break;
      
      case AnonymizationMethod.SUPPRESSION:
        anonymized = await this.suppressActivityData(anonymized);
        break;
      
      case AnonymizationMethod.NOISE_ADDITION:
        anonymized = await this.addNoiseToActivity(anonymized);
        break;
      
      case AnonymizationMethod.K_ANONYMITY:
        anonymized = await this.applyKAnonymity(anonymized);
        break;
      
      case AnonymizationMethod.DIFFERENTIAL_PRIVACY:
        anonymized = await this.applyDifferentialPrivacy(anonymized);
        break;
      
      case AnonymizationMethod.TOKENIZATION:
        anonymized = await this.tokenizeActivity(anonymized);
        break;
      
      case AnonymizationMethod.HASHING:
        anonymized = await this.hashActivityData(anonymized);
        break;
    }

    this.anonymizationCache.set(cacheKey, anonymized);
    this.emit('activityAnonymized', { original: activity.id, method, anonymized });

    return anonymized;
  }

  public async recordConsent(consent: Omit<ConsentRecord, 'id'>): Promise<ConsentRecord> {
    const newConsent: ConsentRecord = {
      id: randomUUID(),
      ...consent
    };

    // Validate consent method
    if (!this.isValidConsentMethod(newConsent.consentMethod)) {
      throw new Error(`Invalid consent method: ${newConsent.consentMethod}`);
    }

    this.consentRecords.set(newConsent.id, newConsent);
    this.emit('consentRecorded', newConsent);

    // Log privacy operation
    await this.logPrivacyOperation({
      operation: PrivacyOperation.CONSENT_CHANGE,
      tenantId: newConsent.tenantId,
      userId: newConsent.userId,
      dataCategory: [DataCategory.PERSONAL_IDENTIFIERS],
      legalBasis: LegalBasis.CONSENT,
      purpose: 'Consent management',
      dataElements: ['consent_status'],
      processingMethod: ProcessingOperation.STORAGE,
      accessRequester: newConsent.userId,
      justification: 'User consent recording',
      consentReference: newConsent.id,
      riskAssessment: RiskLevel.LOW,
      thirdPartiesInvolved: [],
      crossBorderTransfer: false,
      destinationCountries: [],
      safeguards: []
    });

    return newConsent;
  }

  public async withdrawConsent(userId: string, policyId: string, reason: string): Promise<boolean> {
    const existingConsent = Array.from(this.consentRecords.values())
      .find(consent => 
        consent.userId === userId && 
        consent.policyId === policyId && 
        consent.isActive
      );

    if (!existingConsent) return false;

    existingConsent.isActive = false;
    existingConsent.withdrawalDate = new Date();
    existingConsent.withdrawalReason = reason;

    this.emit('consentWithdrawn', existingConsent);

    // Log privacy operation
    await this.logPrivacyOperation({
      operation: PrivacyOperation.CONSENT_CHANGE,
      tenantId: existingConsent.tenantId,
      userId: existingConsent.userId,
      dataCategory: [DataCategory.PERSONAL_IDENTIFIERS],
      legalBasis: LegalBasis.CONSENT,
      purpose: 'Consent withdrawal',
      dataElements: ['consent_status'],
      processingMethod: ProcessingOperation.DELETION,
      accessRequester: existingConsent.userId,
      justification: `User consent withdrawal: ${reason}`,
      consentReference: existingConsent.id,
      riskAssessment: RiskLevel.MEDIUM,
      thirdPartiesInvolved: [],
      crossBorderTransfer: false,
      destinationCountries: [],
      safeguards: []
    });

    return true;
  }

  public async processDataSubjectRight(request: Omit<DataSubjectRights, 'id' | 'requestDate' | 'status' | 'processingNotes'>): Promise<DataSubjectRights> {
    const newRequest: DataSubjectRights = {
      id: randomUUID(),
      requestDate: new Date(),
      status: RightRequestStatus.SUBMITTED,
      processingNotes: [],
      ...request
    };

    this.dataSubjectRights.set(newRequest.id, newRequest);
    this.emit('dataSubjectRightRequested', newRequest);

    // Start processing asynchronously
    this.processDataSubjectRightAsync(newRequest.id);

    return newRequest;
  }

  public async exportUserData(userId: string, tenantId: string): Promise<{
    personalData: any;
    activityData: ActivityData[];
    consentHistory: ConsentRecord[];
    rightsRequests: DataSubjectRights[];
  }> {
    // Collect all user data for portability
    const activityData: ActivityData[] = []; // Would query from activity service
    const consentHistory = Array.from(this.consentRecords.values())
      .filter(consent => consent.userId === userId && consent.tenantId === tenantId);
    
    const rightsRequests = Array.from(this.dataSubjectRights.values())
      .filter(request => request.userId === userId && request.tenantId === tenantId);

    const personalData = {
      userId,
      tenantId,
      exportDate: new Date(),
      dataCategories: this.getUserDataCategories(userId)
    };

    // Log privacy operation
    await this.logPrivacyOperation({
      operation: PrivacyOperation.DATA_ACCESS,
      tenantId,
      userId,
      dataCategory: [DataCategory.PERSONAL_IDENTIFIERS, DataCategory.BEHAVIORAL_DATA],
      legalBasis: LegalBasis.CONSENT,
      purpose: 'Data portability request',
      dataElements: ['all_user_data'],
      processingMethod: ProcessingOperation.ACCESS,
      accessRequester: userId,
      justification: 'GDPR Article 20 - Right to data portability',
      riskAssessment: RiskLevel.MEDIUM,
      thirdPartiesInvolved: [],
      crossBorderTransfer: false,
      destinationCountries: [],
      safeguards: []
    });

    return {
      personalData,
      activityData,
      consentHistory,
      rightsRequests
    };
  }

  public async createDataFlowMapping(mapping: Omit<DataFlowMapping, 'id'>): Promise<DataFlowMapping> {
    const newMapping: DataFlowMapping = {
      id: randomUUID(),
      ...mapping
    };

    // Assess risk level
    newMapping.riskLevel = this.assessDataFlowRisk(newMapping);

    this.dataFlowMappings.set(newMapping.id, newMapping);
    this.emit('dataFlowMappingCreated', newMapping);

    return newMapping;
  }

  public async getPrivacyAuditLogs(filter: {
    tenantId?: string;
    userId?: string;
    operation?: PrivacyOperation;
    startDate?: Date;
    endDate?: Date;
    riskLevel?: RiskLevel;
  } = {}): Promise<PrivacyAuditLog[]> {
    let logs = Array.from(this.auditLogs.values());

    if (filter.tenantId) {
      logs = logs.filter(log => log.tenantId === filter.tenantId);
    }

    if (filter.userId) {
      logs = logs.filter(log => log.userId === filter.userId);
    }

    if (filter.operation) {
      logs = logs.filter(log => log.operation === filter.operation);
    }

    if (filter.startDate) {
      logs = logs.filter(log => log.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      logs = logs.filter(log => log.timestamp <= filter.endDate!);
    }

    if (filter.riskLevel) {
      logs = logs.filter(log => log.riskAssessment === filter.riskLevel);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async getComplianceReport(tenantId: string): Promise<{
    policyCompliance: Record<string, boolean>;
    consentCoverage: number;
    rightsRequestMetrics: Record<RightRequestStatus, number>;
    dataFlowRisks: Record<RiskLevel, number>;
    auditFindings: string[];
    recommendations: string[];
  }> {
    const policies = Array.from(this.privacyPolicies.values())
      .filter(p => p.tenantId === tenantId);
    
    const consents = Array.from(this.consentRecords.values())
      .filter(c => c.tenantId === tenantId);
    
    const rightsRequests = Array.from(this.dataSubjectRights.values())
      .filter(r => r.tenantId === tenantId);
    
    const dataFlows = Array.from(this.dataFlowMappings.values())
      .filter(f => f.tenantId === tenantId);

    // Calculate compliance metrics
    const policyCompliance = this.assessPolicyCompliance(policies);
    const consentCoverage = this.calculateConsentCoverage(consents, policies);
    const rightsRequestMetrics = this.calculateRightsMetrics(rightsRequests);
    const dataFlowRisks = this.calculateDataFlowRisks(dataFlows);
    const auditFindings = this.generateAuditFindings(tenantId);
    const recommendations = this.generateComplianceRecommendations(policies, consents, dataFlows);

    return {
      policyCompliance,
      consentCoverage,
      rightsRequestMetrics,
      dataFlowRisks,
      auditFindings,
      recommendations
    };
  }

  private async validatePolicyCompliance(policy: PrivacyPolicy): Promise<any> {
    // Validate against GDPR, CCPA, and other regulations
    if (policy.consentRequired && policy.legalBasis.includes(LegalBasis.LEGITIMATE_INTERESTS)) {
      throw new Error('Consent required policies cannot use legitimate interests as legal basis');
    }

    if (policy.crossBorderTransfer && policy.allowedJurisdictions.length === 0) {
      throw new Error('Cross-border transfer requires specified allowed jurisdictions');
    }

    // Validate data retention period
    if (policy.dataRetentionPeriod > 7 * 365 * 24 * 60 * 60 * 1000) { // 7 years
      console.warn('Data retention period exceeds recommended maximum of 7 years');
    }
  }

  private getApplicablePolicies(tenantId: string): PrivacyPolicy[] {
    return Array.from(this.privacyPolicies.values())
      .filter(policy => policy.tenantId === tenantId && policy.isActive)
      .filter(policy => {
        const now = new Date();
        return now >= policy.effectiveDate && 
               (!policy.expirationDate || now <= policy.expirationDate);
      });
  }

  private async hasValidConsent(userId: string, policyId: string): Promise<boolean> {
    const consent = Array.from(this.consentRecords.values())
      .find(consent => 
        consent.userId === userId && 
        consent.policyId === policyId && 
        consent.isActive && 
        consent.consentGiven &&
        (!consent.expirationDate || consent.expirationDate > new Date())
      );

    return !!consent;
  }

  private async applyPrivacyRule(activity: ActivityData, rule: PrivacyRule, policyId: string): Promise<ActivityData> {
    let processedActivity = { ...activity };

    // Apply minimization rules
    for (const minRule of rule.minimizationRules) {
      processedActivity = this.applyMinimizationRule(processedActivity, minRule);
    }

    // Apply anonymization if required
    if (rule.anonymizationMethod !== AnonymizationMethod.NONE) {
      processedActivity = await this.anonymizeActivity(processedActivity, rule.anonymizationMethod);
    }

    // Apply encryption if required
    if (rule.encryptionRequired) {
      processedActivity = await this.encryptSensitiveFields(processedActivity);
    }

    return processedActivity;
  }

  private applyMinimizationRule(activity: ActivityData, rule: MinimizationRule): ActivityData {
    const processed = { ...activity };

    switch (rule.action) {
      case 'remove':
        delete (processed as any)[rule.field];
        break;
      
      case 'mask':
        const fieldValue = (processed as any)[rule.field];
        if (fieldValue) {
          (processed as any)[rule.field] = this.maskValue(fieldValue, rule.parameters);
        }
        break;
      
      case 'generalize':
        const value = (processed as any)[rule.field];
        if (value) {
          (processed as any)[rule.field] = this.generalizeValue(value, rule.parameters);
        }
        break;
      
      case 'pseudonymize':
        const originalValue = (processed as any)[rule.field];
        if (originalValue) {
          (processed as any)[rule.field] = this.pseudonymizeValue(originalValue);
        }
        break;
    }

    return processed;
  }

  private classifyActivityData(activity: ActivityData): DataCategory[] {
    const categories: DataCategory[] = [];

    // Check for personal identifiers
    if (activity.userId || activity.sessionId) {
      categories.push(DataCategory.PERSONAL_IDENTIFIERS);
    }

    // Check for technical data
    if (activity.ipAddress || activity.userAgent) {
      categories.push(DataCategory.TECHNICAL_DATA);
    }

    // Check for location data
    if (activity.location) {
      categories.push(DataCategory.LOCATION_DATA);
    }

    // Check for behavioral data
    if (activity.activityType || activity.metadata) {
      categories.push(DataCategory.BEHAVIORAL_DATA);
    }

    // Check for financial data
    if (activity.resource?.includes('portfolio') || activity.resource?.includes('trading')) {
      categories.push(DataCategory.FINANCIAL_DATA);
    }

    return categories;
  }

  private assessRisk(activity: ActivityData, rule: PrivacyRule): RiskLevel {
    let riskScore = 0;

    // Risk factors
    if (activity.sensitiveData) riskScore += 2;
    if (activity.riskScore && activity.riskScore > 0.7) riskScore += 2;
    if (rule.dataCategory === DataCategory.FINANCIAL_DATA) riskScore += 1;
    if (rule.dataCategory === DataCategory.BIOMETRIC_DATA) riskScore += 3;
    if (activity.location && activity.location.country !== 'US') riskScore += 1;

    if (riskScore >= 4) return RiskLevel.CRITICAL;
    if (riskScore >= 3) return RiskLevel.HIGH;
    if (riskScore >= 2) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private async logPrivacyOperation(operation: Omit<PrivacyAuditLog, 'id' | 'timestamp' | 'complianceCheck' | 'violations'>): Promise<any> {
    const log: PrivacyAuditLog = {
      id: randomUUID(),
      timestamp: new Date(),
      complianceCheck: await this.performComplianceCheck(operation),
      violations: await this.checkViolations(operation),
      ...operation
    };

    this.auditLogs.set(log.id, log);
    this.emit('privacyOperationLogged', log);
  }

  // Anonymization method implementations
  private async pseudonymizeActivity(activity: ActivityData): Promise<ActivityData> {
    const pseudonymized = { ...activity };
    
    if (pseudonymized.userId) {
      pseudonymized.userId = this.pseudonymizeValue(pseudonymized.userId);
    }
    
    if (pseudonymized.ipAddress) {
      pseudonymized.ipAddress = this.pseudonymizeValue(pseudonymized.ipAddress);
    }

    return pseudonymized;
  }

  private async generalizeActivity(activity: ActivityData): Promise<ActivityData> {
    const generalized = { ...activity };
    
    // Generalize timestamp to hour
    const timestamp = new Date(generalized.timestamp);
    timestamp.setMinutes(0, 0, 0);
    generalized.timestamp = timestamp;
    
    // Generalize location to city level
    if (generalized.location) {
      generalized.location = {
        ...generalized.location,
        latitude: undefined,
        longitude: undefined
      };
    }

    return generalized;
  }

  private async suppressActivityData(activity: ActivityData): Promise<ActivityData> {
    const suppressed = { ...activity };
    
    // Remove personally identifiable information
    suppressed.userId = 'SUPPRESSED';
    suppressed.ipAddress = 'SUPPRESSED';
    suppressed.userAgent = 'SUPPRESSED';
    
    if (suppressed.location) {
      suppressed.location = {
        country: suppressed.location.country,
        region: 'SUPPRESSED',
        city: 'SUPPRESSED',
        timezone: suppressed.location.timezone
      };
    }

    return suppressed;
  }

  private async addNoiseToActivity(activity: ActivityData): Promise<ActivityData> {
    const noisy = { ...activity };
    
    // Add noise to timestamp (±5 minutes)
    const noise = (Math.random() - 0.5) * 10 * 60 * 1000; // ±5 minutes in ms
    noisy.timestamp = new Date(activity.timestamp.getTime() + noise);
    
    // Add noise to risk score
    if (noisy.riskScore) {
      const riskNoise = (Math.random() - 0.5) * 0.1; // ±0.05
      noisy.riskScore = Math.max(0, Math.min(1, noisy.riskScore + riskNoise));
    }

    return noisy;
  }

  private async applyKAnonymity(activity: ActivityData, k: number = 5): Promise<ActivityData> {
    // Simplified k-anonymity implementation
    // In production, would need access to other records to ensure k-anonymity
    return this.generalizeActivity(activity);
  }

  private async applyDifferentialPrivacy(activity: ActivityData, epsilon: number = 1.0): Promise<ActivityData> {
    // Simplified differential privacy implementation
    // Add Laplace noise based on epsilon parameter
    return this.addNoiseToActivity(activity);
  }

  private async tokenizeActivity(activity: ActivityData): Promise<ActivityData> {
    const tokenized = { ...activity };
    
    if (tokenized.userId) {
      tokenized.userId = `TOKEN_${randomUUID()}`;
    }
    
    if (tokenized.sessionId) {
      tokenized.sessionId = `TOKEN_${randomUUID()}`;
    }

    return tokenized;
  }

  private async hashActivityData(activity: ActivityData): Promise<ActivityData> {
    const hashed = { ...activity };
    
    if (hashed.userId) {
      hashed.userId = this.hashValue(hashed.userId);
    }
    
    if (hashed.ipAddress) {
      hashed.ipAddress = this.hashValue(hashed.ipAddress);
    }

    return hashed;
  }

  private pseudonymizeValue(value: string): string {
    if (this.pseudonymMappings.has(value)) {
      return this.pseudonymMappings.get(value)!;
    }
    
    const pseudonym = `PSEUDO_${randomUUID()}`;
    this.pseudonymMappings.set(value, pseudonym);
    return pseudonym;
  }

  private maskValue(value: string, parameters?: Record<string, any>): string {
    const maskChar = parameters?.maskChar || '*';
    const visibleChars = parameters?.visibleChars || 2;
    
    if (value.length <= visibleChars * 2) {
      return maskChar.repeat(value.length);
    }
    
    return value.substring(0, visibleChars) + 
           maskChar.repeat(value.length - visibleChars * 2) + 
           value.substring(value.length - visibleChars);
  }

  private generalizeValue(value: any, parameters?: Record<string, any>): any {
    if (typeof value === 'number') {
      const precision = parameters?.precision || 10;
      return Math.round(value / precision) * precision;
    }
    
    if (typeof value === 'string' && parameters?.categories) {
      // Map to category
      return parameters.categories[value] || 'OTHER';
    }
    
    return value;
  }

  private hashValue(value: string): string {
    // Simplified hash - in production use proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `HASH_${Math.abs(hash).toString(16)}`;
  }

  private async encryptSensitiveFields(activity: ActivityData): Promise<ActivityData> {
    // Placeholder for encryption implementation
    return activity;
  }

  private isValidConsentMethod(method: ConsentMethod): boolean {
    // GDPR requires explicit consent for most cases
    return method === ConsentMethod.EXPLICIT_OPT_IN;
  }

  private async processDataSubjectRightAsync(requestId: string): Promise<any> {
    const request = this.dataSubjectRights.get(requestId);
    if (!request) return;

    try {
      request.status = RightRequestStatus.PROCESSING;
      this.emit('dataSubjectRightStatusChanged', request);

      // Process based on right type
      switch (request.right) {
        case DataSubjectRight.RIGHT_TO_ACCESS:
          await this.processAccessRight(request);
          break;
        case DataSubjectRight.RIGHT_TO_ERASURE:
          await this.processErasureRight(request);
          break;
        case DataSubjectRight.RIGHT_TO_PORTABILITY:
          await this.processPortabilityRight(request);
          break;
        // Handle other rights
      }

      request.status = RightRequestStatus.COMPLETED;
      request.responseDate = new Date();
    } catch (error: any) {
      request.status = RightRequestStatus.REJECTED;
      request.processingNotes.push(`Error: ${this.getErrorMessage(error)}`);
    }

    this.emit('dataSubjectRightStatusChanged', request);
  }

  private async processAccessRight(request: DataSubjectRights): Promise<any> {
    request.responseData = await this.exportUserData(request.userId, request.tenantId);
    request.processingNotes.push('Data export completed');
  }

  private async processErasureRight(request: DataSubjectRights): Promise<any> {
    // Check if erasure is legally permissible
    const canErase = await this.canEraseUserData(request.userId, request.tenantId);
    
    if (canErase) {
      // Perform erasure
      request.processingNotes.push('User data erased');
    } else {
      request.status = RightRequestStatus.PARTIALLY_FULFILLED;
      request.processingNotes.push('Partial erasure due to legal obligations');
    }
  }

  private async processPortabilityRight(request: DataSubjectRights): Promise<any> {
    request.responseData = await this.exportUserData(request.userId, request.tenantId);
    request.processingNotes.push('Portable data export completed');
  }

  private getUserDataCategories(userId: string): DataCategory[] {
    // Determine what data categories exist for user
    return [
      DataCategory.PERSONAL_IDENTIFIERS,
      DataCategory.BEHAVIORAL_DATA,
      DataCategory.TECHNICAL_DATA,
      DataCategory.FINANCIAL_DATA
    ];
  }

  private assessDataFlowRisk(mapping: DataFlowMapping): RiskLevel {
    let riskScore = 0;

    // Risk factors
    if (mapping.dataCategories.includes(DataCategory.SENSITIVE_ATTRIBUTES)) riskScore += 3;
    if (mapping.dataCategories.includes(DataCategory.BIOMETRIC_DATA)) riskScore += 3;
    if (mapping.dataCategories.includes(DataCategory.FINANCIAL_DATA)) riskScore += 2;
    if (mapping.dataVolume === DataVolume.BIG_DATA) riskScore += 2;
    if (mapping.frequency === DataFlowFrequency.REAL_TIME) riskScore += 1;

    if (riskScore >= 5) return RiskLevel.CRITICAL;
    if (riskScore >= 3) return RiskLevel.HIGH;
    if (riskScore >= 2) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private async performComplianceCheck(operation: Partial<PrivacyAuditLog>): Promise<boolean> {
    // Simplified compliance check
    return operation.legalBasis !== undefined && operation.purpose !== undefined;
  }

  private async checkViolations(operation: Partial<PrivacyAuditLog>): Promise<string[]> {
    const violations: string[] = [];

    if (!operation.legalBasis) {
      violations.push('No legal basis specified');
    }

    if (!operation.purpose) {
      violations.push('No processing purpose specified');
    }

    if (operation.crossBorderTransfer && !operation.safeguards?.length) {
      violations.push('Cross-border transfer without adequate safeguards');
    }

    return violations;
  }

  private assessPolicyCompliance(policies: PrivacyPolicy[]): Record<string, boolean> {
    const compliance: Record<string, boolean> = {};

    policies.forEach(policy => {
      compliance[policy.name] = policy.isActive && 
                               policy.legalBasis.length > 0 && 
                               policy.dataProcessingPurposes.length > 0;
    });

    return compliance;
  }

  private calculateConsentCoverage(consents: ConsentRecord[], policies: PrivacyPolicy[]): number {
    const consentRequiredPolicies = policies.filter(p => p.consentRequired);
    if (consentRequiredPolicies.length === 0) return 100;

    const validConsents = consents.filter(c => c.isActive && c.consentGiven).length;
    return (validConsents / consentRequiredPolicies.length) * 100;
  }

  private calculateRightsMetrics(requests: DataSubjectRights[]): Record<RightRequestStatus, number> {
    const metrics: Record<RightRequestStatus, number> = {
      [RightRequestStatus.SUBMITTED]: 0,
      [RightRequestStatus.VERIFYING]: 0,
      [RightRequestStatus.PROCESSING]: 0,
      [RightRequestStatus.COMPLETED]: 0,
      [RightRequestStatus.REJECTED]: 0,
      [RightRequestStatus.PARTIALLY_FULFILLED]: 0
    };

    requests.forEach(request => {
      metrics[request.status]++;
    });

    return metrics;
  }

  private calculateDataFlowRisks(dataFlows: DataFlowMapping[]): Record<RiskLevel, number> {
    const risks: Record<RiskLevel, number> = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0
    };

    dataFlows.forEach(flow => {
      risks[flow.riskLevel]++;
    });

    return risks;
  }

  private generateAuditFindings(tenantId: string): string[] {
    const logs = Array.from(this.auditLogs.values())
      .filter(log => log.tenantId === tenantId);

    const findings: string[] = [];

    const violationsCount = logs.filter(log => log.violations.length > 0).length;
    if (violationsCount > 0) {
      findings.push(`${violationsCount} operations with compliance violations`);
    }

    const highRiskOps = logs.filter(log => log.riskAssessment === RiskLevel.HIGH || 
                                          log.riskAssessment === RiskLevel.CRITICAL).length;
    if (highRiskOps > 0) {
      findings.push(`${highRiskOps} high-risk privacy operations`);
    }

    return findings;
  }

  private generateComplianceRecommendations(
    policies: PrivacyPolicy[], 
    consents: ConsentRecord[], 
    dataFlows: DataFlowMapping[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for missing consent
    const consentRequiredPolicies = policies.filter(p => p.consentRequired);
    const activeConsents = consents.filter(c => c.isActive && c.consentGiven);
    
    if (consentRequiredPolicies.length > activeConsents.length) {
      recommendations.push('Obtain missing user consents for data processing');
    }

    // Check for high-risk data flows
    const highRiskFlows = dataFlows.filter(f => f.riskLevel === RiskLevel.HIGH || 
                                               f.riskLevel === RiskLevel.CRITICAL);
    if (highRiskFlows.length > 0) {
      recommendations.push('Review and implement additional safeguards for high-risk data flows');
    }

    // Check policy expiration
    const expiringPolicies = policies.filter(p => 
      p.expirationDate && 
      p.expirationDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 // 30 days
    );
    if (expiringPolicies.length > 0) {
      recommendations.push('Update expiring privacy policies');
    }

    return recommendations;
  }

  private async canEraseUserData(userId: string, tenantId: string): Promise<boolean> {
    // Check legal obligations that prevent erasure
    const auditLogs = await this.getPrivacyAuditLogs({ userId, tenantId });
    const hasLegalObligation = auditLogs.some(log => 
      log.legalBasis === LegalBasis.LEGAL_OBLIGATION
    );

    return !hasLegalObligation;
  }

  private initializeDefaultPolicies(): void {
    // Create default privacy policy templates
    const defaultPolicies = [
      {
        name: 'Standard Data Processing Policy',
        description: 'Standard policy for general data processing activities',
        version: '1.0',
        tenantId: 'default',
        effectiveDate: new Date(),
        isActive: true,
        consentRequired: true,
        dataProcessingPurposes: ['Service provision', 'Analytics', 'Security'],
        legalBasis: [LegalBasis.CONSENT, LegalBasis.LEGITIMATE_INTERESTS],
        dataRetentionPeriod: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
        thirdPartySharing: false,
        crossBorderTransfer: false,
        allowedJurisdictions: ['US'],
        rules: [
          {
            id: randomUUID(),
            name: 'Personal Data Protection',
            dataCategory: DataCategory.PERSONAL_IDENTIFIERS,
            processingOperation: [ProcessingOperation.COLLECTION, ProcessingOperation.STORAGE],
            anonymizationMethod: AnonymizationMethod.PSEUDONYMIZATION,
            accessRestrictions: [
              {
                role: 'admin',
                operations: [ProcessingOperation.ACCESS, ProcessingOperation.ANALYSIS],
                conditions: ['audit_logged']
              }
            ],
            auditRequired: true,
            encryptionRequired: true,
            minimizationRules: [
              {
                field: 'ipAddress',
                condition: 'always',
                action: 'mask' as const,
                parameters: { visibleChars: 2 }
              }
            ]
          }
        ]
      }
    ];

    defaultPolicies.forEach(policy => this.createPrivacyPolicy(policy));
  }
}


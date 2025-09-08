import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

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
  ssn?: string; // Encrypted
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

// Enums
export enum ProfileStatus {
  DRAFT = 'draft',
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  UNDER_REVIEW = 'under_review',
  EXEMPT = 'exempt'
}

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  UNEMPLOYED = 'unemployed',
  RETIRED = 'retired',
  STUDENT = 'student',
  SELF_EMPLOYED = 'self_employed'
}

export enum InvestmentExperience {
  NONE = 'none',
  LIMITED = 'limited',
  GOOD = 'good',
  EXTENSIVE = 'extensive'
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated'
}

export enum PhoneType {
  HOME = 'home',
  WORK = 'work',
  MOBILE = 'mobile',
  FAX = 'fax'
}

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  MAILING = 'mailing',
  BILLING = 'billing'
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  MAIL = 'mail'
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum KYCTier {
  TIER_1 = 'tier_1', // Basic
  TIER_2 = 'tier_2', // Enhanced
  TIER_3 = 'tier_3'  // Premium
}

export enum DocumentType {
  GOVERNMENT_ID = 'government_id',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
  TAX_DOCUMENT = 'tax_document',
  EMPLOYMENT_VERIFICATION = 'employment_verification',
  PROOF_OF_INCOME = 'proof_of_income',
  OTHER = 'other'
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum RiskTolerance {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

export enum TimeHorizon {
  SHORT_TERM = 'short_term',    // < 2 years
  MEDIUM_TERM = 'medium_term',  // 2-7 years
  LONG_TERM = 'long_term'       // > 7 years
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  VERIFY = 'verify',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate'
}

export enum AuditSource {
  WEB_PORTAL = 'web_portal',
  MOBILE_APP = 'mobile_app',
  API = 'api',
  ADMIN_PANEL = 'admin_panel',
  SYSTEM = 'system'
}

// Additional interfaces for complex nested types
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

export class UserProfileService extends EventEmitter {
  private profiles: Map<string, UserProfile> = new Map();
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private complianceRules: Map<string, ComplianceRule[]> = new Map();

  constructor() {
    super();
    this.initializeValidationRules();
    this.initializeComplianceRules();
  }

  public async createProfile(profileData: Omit<UserProfile, 'id' | 'lastUpdated' | 'version' | 'auditTrail'>): Promise<UserProfile> {
    const profile: UserProfile = {
      id: randomUUID(),
      lastUpdated: new Date(),
      version: 1,
      auditTrail: [],
      ...profileData
    };

    // Validate profile data
    const validationErrors = await this.validateProfile(profile);
    if (validationErrors.length > 0) {
      throw new Error(`Profile validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    // Add audit entry
    this.addAuditEntry(profile, AuditAction.CREATE, undefined, undefined, profile.userId, 'Profile created', 'unknown', 'unknown', AuditSource.SYSTEM);

    this.profiles.set(profile.id, profile);
    this.emit('profileCreated', profile);

    return profile;
  }

  public async getProfile(profileId: string): Promise<UserProfile | null> {
    const profile = this.profiles.get(profileId);
    
    if (profile) {
      this.addAuditEntry(profile, AuditAction.VIEW, undefined, undefined, profile.userId, 'Profile viewed', 'unknown', 'unknown', AuditSource.API);
    }

    return profile || null;
  }

  public async getProfileByUserId(userId: string, tenantId: string): Promise<UserProfile | null> {
    const profile = Array.from(this.profiles.values())
      .find(p => p.userId === userId && p.tenantId === tenantId);
    
    if (profile) {
      this.addAuditEntry(profile, AuditAction.VIEW, undefined, undefined, userId, 'Profile viewed by user ID', 'unknown', 'unknown', AuditSource.API);
    }

    return profile || null;
  }

  public async updateProfile(profileId: string, updates: ProfileUpdateRequest[], updatedBy: string, ipAddress: string, userAgent: string): Promise<UserProfile | null> {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const updatedProfile = { ...profile };
    const errors: ProfileValidationError[] = [];

    for (const update of updates) {
      try {
        // Validate individual field update
        const fieldErrors = await this.validateFieldUpdate(updatedProfile, update.field, update.value);
        if (fieldErrors.length > 0) {
          errors.push(...fieldErrors);
          continue;
        }

        const oldValue = this.getNestedProperty(updatedProfile, update.field);
        this.setNestedProperty(updatedProfile, update.field, update.value);

        // Add audit entry for each field change
        this.addAuditEntry(
          updatedProfile,
          AuditAction.UPDATE,
          update.field,
          oldValue,
          updatedBy,
          update.reason || 'Profile updated',
          ipAddress,
          userAgent,
          AuditSource.WEB_PORTAL
        );

      } catch (error: any) {
        errors.push({
          field: update.field,
          message: this.getErrorMessage(error),
          code: 'UPDATE_ERROR',
          severity: 'error'
        });
      }
    }

    if (errors.length > 0) {
      throw new Error(`Profile update failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Increment version and update timestamp
    updatedProfile.version++;
    updatedProfile.lastUpdated = new Date();

    // Validate entire profile after updates
    const validationErrors = await this.validateProfile(updatedProfile);
    if (validationErrors.length > 0) {
      throw new Error(`Profile validation failed after update: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    // Check compliance status
    updatedProfile.compliance = await this.checkComplianceStatus(updatedProfile);

    this.profiles.set(profileId, updatedProfile);
    this.emit('profileUpdated', updatedProfile);

    return updatedProfile;
  }

  public async addDocument(profileId: string, document: Omit<ProfileDocument, 'id' | 'uploadedAt'>, uploadedBy: string): Promise<ProfileDocument | null> {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const newDocument: ProfileDocument = {
      id: randomUUID(),
      uploadedAt: new Date(),
      ...document
    };

    profile.documents.push(newDocument);
    profile.lastUpdated = new Date();
    profile.version++;

    this.addAuditEntry(
      profile,
      AuditAction.CREATE,
      'documents',
      undefined,
      uploadedBy,
      `Document ${document.name} uploaded`,
      'unknown',
      'unknown',
      AuditSource.WEB_PORTAL
    );

    this.emit('documentAdded', { profile, document: newDocument });
    return newDocument;
  }

  public async removeDocument(profileId: string, documentId: string, removedBy: string, reason: string): Promise<boolean> {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    const documentIndex = profile.documents.findIndex(d => d.id === documentId);
    if (documentIndex === -1) return false;

    const removedDocument = profile.documents[documentIndex];
    profile.documents.splice(documentIndex, 1);
    profile.lastUpdated = new Date();
    profile.version++;

    this.addAuditEntry(
      profile,
      AuditAction.DELETE,
      'documents',
      removedDocument,
      removedBy,
      reason,
      'unknown',
      'unknown',
      AuditSource.WEB_PORTAL
    );

    this.emit('documentRemoved', { profile, document: removedDocument });
    return true;
  }

  public async updateKYCStatus(profileId: string, status: KYCStatus, updatedBy: string, reason: string): Promise<UserProfile | null> {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const oldStatus = profile.kycInfo.status;
    profile.kycInfo.status = status;
    
    if (status === KYCStatus.APPROVED) {
      profile.kycInfo.completedAt = new Date();
    }

    profile.lastUpdated = new Date();
    profile.version++;

    this.addAuditEntry(
      profile,
      AuditAction.UPDATE,
      'kycInfo.status',
      oldStatus,
      updatedBy,
      reason,
      'unknown',
      'unknown',
      AuditSource.ADMIN_PANEL
    );

    this.emit('kycStatusUpdated', { profile, oldStatus, newStatus: status });
    return profile;
  }

  public async getProfilesForTenant(tenantId: string, filter: {
    status?: ProfileStatus;
    kycStatus?: KYCStatus;
    lastUpdatedAfter?: Date;
    lastUpdatedBefore?: Date;
  } = {}): Promise<UserProfile[]> {
    let profiles = Array.from(this.profiles.values())
      .filter(p => p.tenantId === tenantId);

    if (filter.status) {
      profiles = profiles.filter(p => p.status === filter.status);
    }

    if (filter.kycStatus) {
      profiles = profiles.filter(p => p.kycInfo.status === filter.kycStatus);
    }

    if (filter.lastUpdatedAfter) {
      profiles = profiles.filter(p => p.lastUpdated >= filter.lastUpdatedAfter!);
    }

    if (filter.lastUpdatedBefore) {
      profiles = profiles.filter(p => p.lastUpdated <= filter.lastUpdatedBefore!);
    }

    return profiles.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  public async validateProfile(profile: UserProfile): Promise<ProfileValidationError[]> {
    const errors: ProfileValidationError[] = [];
    const rules = this.validationRules.get(profile.tenantId) || [];

    for (const rule of rules) {
      try {
        const isValid = rule.validator(profile);
        if (!isValid) {
          errors.push({
            field: rule.field,
            message: rule.message,
            code: rule.code,
            severity: rule.severity
          });
        }
      } catch (error: any) {
        errors.push({
          field: rule.field,
          message: `Validation error: ${this.getErrorMessage(error)}`,
          code: 'VALIDATION_EXCEPTION',
          severity: 'error'
        });
      }
    }

    return errors;
  }

  public async checkComplianceStatus(profile: UserProfile): Promise<ComplianceStatus> {
    const rules = this.complianceRules.get(profile.tenantId) || [];
    
    for (const rule of rules) {
      const isCompliant = rule.validator(profile);
      if (!isCompliant) {
        return ComplianceStatus.NON_COMPLIANT;
      }
    }

    return ComplianceStatus.COMPLIANT;
  }

  public async getAuditTrail(profileId: string, filter: {
    action?: AuditAction;
    field?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<ProfileAuditEntry[]> {
    const profile = this.profiles.get(profileId);
    if (!profile) return [];

    let auditEntries = [...profile.auditTrail];

    if (filter.action) {
      auditEntries = auditEntries.filter(entry => entry.action === filter.action);
    }

    if (filter.field) {
      auditEntries = auditEntries.filter(entry => entry.field === filter.field);
    }

    if (filter.userId) {
      auditEntries = auditEntries.filter(entry => entry.userId === filter.userId);
    }

    if (filter.startDate) {
      auditEntries = auditEntries.filter(entry => entry.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      auditEntries = auditEntries.filter(entry => entry.timestamp <= filter.endDate!);
    }

    return auditEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async validateFieldUpdate(profile: UserProfile, field: string, value: any): Promise<ProfileValidationError[]> {
    const errors: ProfileValidationError[] = [];
    
    // Add field-specific validation logic here
    switch (field) {
      case 'personalInfo.ssn':
        if (value && !this.isValidSSN(value)) {
          errors.push({
            field,
            message: 'Invalid SSN format',
            code: 'INVALID_SSN',
            severity: 'error'
          });
        }
        break;
      
      case 'contactInfo.primaryEmail':
        if (!this.isValidEmail(value)) {
          errors.push({
            field,
            message: 'Invalid email format',
            code: 'INVALID_EMAIL',
            severity: 'error'
          });
        }
        break;
      
      // Add more field validations as needed
    }

    return errors;
  }

  private addAuditEntry(
    profile: UserProfile, 
    action: AuditAction, 
    field: string | undefined, 
    oldValue: any, 
    userId: string, 
    reason: string, 
    ipAddress: string, 
    userAgent: string, 
    source: AuditSource
  ): void {
    const auditEntry: ProfileAuditEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      userId,
      action,
      field,
      oldValue,
      newValue: field ? this.getNestedProperty(profile, field) : undefined,
      reason,
      ipAddress,
      userAgent,
      source
    };

    profile.auditTrail.push(auditEntry);
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private isValidSSN(ssn: string): boolean {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnRegex.test(ssn);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private initializeValidationRules(): void {
    // Initialize basic validation rules - would be loaded from configuration
    const basicRules: ValidationRule[] = [
      {
        field: 'personalInfo.firstName',
        validator: (profile) => !!profile.personalInfo.firstName?.trim(),
        message: 'First name is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      },
      {
        field: 'personalInfo.lastName',
        validator: (profile) => !!profile.personalInfo.lastName?.trim(),
        message: 'Last name is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      },
      {
        field: 'contactInfo.primaryEmail',
        validator: (profile) => this.isValidEmail(profile.contactInfo.primaryEmail),
        message: 'Valid primary email is required',
        code: 'INVALID_EMAIL',
        severity: 'error'
      }
    ];

    this.validationRules.set('default', basicRules);
  }

  private initializeComplianceRules(): void {
    // Initialize basic compliance rules
    const basicRules: ComplianceRule[] = [
      {
        field: 'kycInfo.status',
        validator: (profile) => profile.kycInfo.status !== KYCStatus.REJECTED,
        message: 'KYC must not be rejected',
        code: 'KYC_REJECTED'
      }
    ];

    this.complianceRules.set('default', basicRules);
  }

  private getErrorMessage(error: unknown): string {
    if ((error as any) instanceof Error) {
      return (error as Error).message;
    }
    return String(error);
  }
}

interface ValidationRule {
  field: string;
  validator: (profile: UserProfile) => boolean;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

interface ComplianceRule {
  field: string;
  validator: (profile: UserProfile) => boolean;
  message: string;
  code: string;
}

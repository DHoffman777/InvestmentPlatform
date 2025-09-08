import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

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
  relationshipLength: number; // in years
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

export enum KYCStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum AMLStatus {
  NOT_SCREENED = 'NOT_SCREENED',
  SCREENING_IN_PROGRESS = 'SCREENING_IN_PROGRESS',
  CLEAR = 'CLEAR',
  POTENTIAL_MATCH = 'POTENTIAL_MATCH',
  HIT_CONFIRMED = 'HIT_CONFIRMED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED_WITH_CONDITIONS = 'APPROVED_WITH_CONDITIONS',
  REJECTED = 'REJECTED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RiskFactorType {
  GEOGRAPHIC = 'GEOGRAPHIC',
  POLITICAL_EXPOSURE = 'POLITICAL_EXPOSURE',
  ADVERSE_MEDIA = 'ADVERSE_MEDIA',
  SANCTIONS = 'SANCTIONS',
  HIGH_RISK_BUSINESS = 'HIGH_RISK_BUSINESS',
  LARGE_CASH_TRANSACTIONS = 'LARGE_CASH_TRANSACTIONS',
  FREQUENT_TRANSACTIONS = 'FREQUENT_TRANSACTIONS',
  UNUSUAL_TRANSACTION_PATTERNS = 'UNUSUAL_TRANSACTION_PATTERNS',
  INSUFFICIENT_DOCUMENTATION = 'INSUFFICIENT_DOCUMENTATION',
  INCONSISTENT_INFORMATION = 'INCONSISTENT_INFORMATION',
  REGULATORY_ACTION = 'REGULATORY_ACTION',
  CRIMINAL_BACKGROUND = 'CRIMINAL_BACKGROUND',
  OTHER = 'OTHER'
}

export enum AMLScreeningType {
  INITIAL_SCREENING = 'INITIAL_SCREENING',
  PERIODIC_SCREENING = 'PERIODIC_SCREENING',
  TRANSACTION_SCREENING = 'TRANSACTION_SCREENING',
  AD_HOC_SCREENING = 'AD_HOC_SCREENING'
}

export class KYCAMLIntegrationService extends EventEmitter {
  private kycProfiles: Map<string, KYCProfile> = new Map();
  private amlScreeningResults: Map<string, AMLScreeningResult[]> = new Map();

  constructor() {
    super();
  }

  async initiateKYCProcess(
    clientId: string,
    tenantId: string,
    workflowId: string,
    initialData: Partial<KYCProfile>
  ): Promise<KYCProfile> {
    const kycProfile: KYCProfile = {
      id: randomUUID(),
      clientId,
      tenantId,
      workflowId,
      personalInfo: initialData.personalInfo || {} as PersonalInformation,
      addressInfo: initialData.addressInfo || { currentAddress: {} as Address, previousAddresses: [], addressHistory: [] },
      identificationInfo: initialData.identificationInfo || { primaryId: {} as IdentificationDocument, verificationMethods: [] },
      financialInfo: initialData.financialInfo || { employmentStatus: 'employed', sourceOfWealth: [], sourceOfFunds: [], bankingRelationships: [] },
      businessInfo: initialData.businessInfo,
      riskFactors: [],
      kycStatus: KYCStatus.IN_PROGRESS,
      amlStatus: AMLStatus.NOT_SCREENED,
      overallRisk: RiskLevel.MEDIUM,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.kycProfiles.set(kycProfile.id, kycProfile);

    this.emit('kycInitiated', kycProfile);

    // Start automated verification processes
    await this.performIdentityVerification(kycProfile.id);
    await this.performAddressVerification(kycProfile.id);
    await this.performAMLScreening(kycProfile.id);

    return kycProfile;
  }

  private async performIdentityVerification(kycProfileId: string): Promise<any> {
    const profile = this.kycProfiles.get(kycProfileId);
    if (!profile) return;

    const verificationMethods: VerificationMethod[] = [];

    if (profile.identificationInfo.primaryId) {
      verificationMethods.push({
        method: 'document',
        provider: 'DocumentVerificationService',
        status: Math.random() > 0.1 ? 'passed' : 'failed',
        confidence: Math.random() * 20 + 80,
        details: {
          documentType: profile.identificationInfo.primaryId.type,
          authenticityCheck: true,
          dataExtraction: true,
          expirationCheck: true
        },
        verifiedAt: new Date()
      });
    }

    verificationMethods.push({
      method: 'knowledge_based',
      provider: 'KBAService',
      status: Math.random() > 0.15 ? 'passed' : 'failed',
      confidence: Math.random() * 30 + 70,
      details: {
        questionsAnswered: 4,
        correctAnswers: Math.floor(Math.random() * 2) + 3,
        timeTaken: Math.floor(Math.random() * 300) + 120
      },
      verifiedAt: new Date()
    });

    profile.identificationInfo.verificationMethods = verificationMethods;

    const failedVerifications = verificationMethods.filter(v => v.status === 'failed').length;
    if (failedVerifications > 1) {
      profile.riskFactors.push({
        type: RiskFactorType.INSUFFICIENT_DOCUMENTATION,
        level: RiskLevel.HIGH,
        description: 'Multiple identity verification methods failed',
        source: 'IdentityVerificationService',
        detectedAt: new Date(),
        mitigated: false
      });
    }

    this.emit('identityVerificationComplete', { kycProfileId, verificationMethods });
  }

  private async performAddressVerification(kycProfileId: string): Promise<any> {
    const profile = this.kycProfiles.get(kycProfileId);
    if (!profile || !profile.addressInfo.currentAddress) return;

    const highRiskCountries = ['Country1', 'Country2'];
    if (highRiskCountries.includes(profile.addressInfo.currentAddress.country)) {
      profile.riskFactors.push({
        type: RiskFactorType.GEOGRAPHIC,
        level: RiskLevel.HIGH,
        description: `Client resides in high-risk jurisdiction: ${profile.addressInfo.currentAddress.country}`,
        source: 'GeographicRiskAssessment',
        detectedAt: new Date(),
        mitigated: false
      });
    }

    this.emit('addressVerificationComplete', { kycProfileId });
  }

  private async performAMLScreening(kycProfileId: string): Promise<any> {
    const profile = this.kycProfiles.get(kycProfileId);
    if (!profile) return;

    profile.amlStatus = AMLStatus.SCREENING_IN_PROGRESS;

    const screeningResult: AMLScreeningResult = {
      id: randomUUID(),
      clientId: profile.clientId,
      screeningType: AMLScreeningType.INITIAL_SCREENING,
      provider: 'AMLScreeningService',
      status: 'clear',
      confidence: 95,
      results: [],
      screenedAt: new Date()
    };

    if (!this.amlScreeningResults.has(profile.clientId)) {
      this.amlScreeningResults.set(profile.clientId, []);
    }
    this.amlScreeningResults.get(profile.clientId)!.push(screeningResult);

    profile.amlStatus = AMLStatus.CLEAR;

    this.emit('amlScreeningComplete', { kycProfileId, screeningResult });

    await this.performRiskAssessment(kycProfileId);
  }

  private async performRiskAssessment(kycProfileId: string): Promise<any> {
    const profile = this.kycProfiles.get(kycProfileId);
    if (!profile) return;

    let riskScore = 0;

    profile.riskFactors.forEach(factor => {
      switch (factor.level) {
        case RiskLevel.LOW: riskScore += 10; break;
        case RiskLevel.MEDIUM: riskScore += 25; break;
        case RiskLevel.HIGH: riskScore += 50; break;
        case RiskLevel.CRITICAL: riskScore += 100; break;
      }
    });

    if (riskScore >= 100) {
      profile.overallRisk = RiskLevel.CRITICAL;
    } else if (riskScore >= 60) {
      profile.overallRisk = RiskLevel.HIGH;
    } else if (riskScore >= 30) {
      profile.overallRisk = RiskLevel.MEDIUM;
    } else {
      profile.overallRisk = RiskLevel.LOW;
    }

    if (profile.overallRisk === RiskLevel.CRITICAL) {
      profile.kycStatus = KYCStatus.REJECTED;
    } else if (profile.overallRisk === RiskLevel.HIGH) {
      profile.kycStatus = KYCStatus.UNDER_REVIEW;
    } else if (profile.amlStatus === AMLStatus.CLEAR && 
               profile.identificationInfo.verificationMethods.every(v => v.status === 'passed')) {
      profile.kycStatus = KYCStatus.APPROVED;
      profile.completedAt = new Date();
    } else {
      profile.kycStatus = KYCStatus.ADDITIONAL_INFO_REQUIRED;
    }

    profile.updatedAt = new Date();

    this.emit('riskAssessmentComplete', { kycProfileId, riskScore, overallRisk: profile.overallRisk });
  }

  getKYCProfile(kycProfileId: string): KYCProfile | undefined {
    return this.kycProfiles.get(kycProfileId);
  }

  getKYCProfileByClient(clientId: string): KYCProfile | undefined {
    return Array.from(this.kycProfiles.values())
      .find(profile => profile.clientId === clientId);
  }

  getAMLScreeningResults(clientId: string): AMLScreeningResult[] {
    return this.amlScreeningResults.get(clientId) || [];
  }
}

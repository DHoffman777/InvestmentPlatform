import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface DocumentRequirement {
  id: string;
  type: DocumentType;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxFileSize: number; // in bytes
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
  confidence: number; // 0-100
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

export enum DocumentType {
  // Identity Documents
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  NATIONAL_ID = 'NATIONAL_ID',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  
  // Address Verification
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT',
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  PROPERTY_TAX_BILL = 'PROPERTY_TAX_BILL',
  
  // Financial Documents
  TAX_RETURN = 'TAX_RETURN',
  W2_FORM = 'W2_FORM',
  PAYSTUB = 'PAYSTUB',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  FINANCIAL_STATEMENT = 'FINANCIAL_STATEMENT',
  
  // Entity Documents
  ARTICLES_OF_INCORPORATION = 'ARTICLES_OF_INCORPORATION',
  OPERATING_AGREEMENT = 'OPERATING_AGREEMENT',
  TRUST_AGREEMENT = 'TRUST_AGREEMENT',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY',
  EIN_LETTER = 'EIN_LETTER',
  CORPORATE_RESOLUTION = 'CORPORATE_RESOLUTION',
  
  // Banking Documents
  BANK_ACCOUNT_STATEMENT = 'BANK_ACCOUNT_STATEMENT',
  VOIDED_CHECK = 'VOIDED_CHECK',
  WIRE_INSTRUCTIONS = 'WIRE_INSTRUCTIONS',
  ACH_AUTHORIZATION = 'ACH_AUTHORIZATION',
  
  // Investment Documents
  INVESTMENT_POLICY_STATEMENT = 'INVESTMENT_POLICY_STATEMENT',
  RISK_QUESTIONNAIRE = 'RISK_QUESTIONNAIRE',
  INVESTMENT_EXPERIENCE_FORM = 'INVESTMENT_EXPERIENCE_FORM',
  ACCREDITED_INVESTOR_CERT = 'ACCREDITED_INVESTOR_CERT',
  
  // Compliance Documents
  FATCA_FORM = 'FATCA_FORM',
  CRS_FORM = 'CRS_FORM',
  BENEFICIAL_OWNERSHIP_FORM = 'BENEFICIAL_OWNERSHIP_FORM',
  POLITICALLY_EXPOSED_PERSON_FORM = 'POLITICALLY_EXPOSED_PERSON_FORM',
  
  // Other
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  PENDING_SUBMISSION = 'PENDING_SUBMISSION',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REPLACED = 'REPLACED'
}

export enum VerificationType {
  FORMAT_CHECK = 'FORMAT_CHECK',
  CONTENT_EXTRACTION = 'CONTENT_EXTRACTION',
  AUTHENTICITY_CHECK = 'AUTHENTICITY_CHECK',
  BIOMETRIC_MATCH = 'BIOMETRIC_MATCH',
  THIRD_PARTY_VERIFICATION = 'THIRD_PARTY_VERIFICATION',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  EXPIRATION_CHECK = 'EXPIRATION_CHECK',
  COMPLETENESS_CHECK = 'COMPLETENESS_CHECK'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
  TIMEOUT = 'TIMEOUT'
}

export class DocumentCollectionService extends EventEmitter {
  private requirements: Map<string, DocumentRequirement> = new Map();
  private submissions: Map<string, DocumentSubmission> = new Map();

  constructor() {
    super();
    this.initializeStandardRequirements();
  }

  private initializeStandardRequirements(): void {
    const standardRequirements: DocumentRequirement[] = [
      // Individual Identity Requirements
      {
        id: randomUUID(),
        type: DocumentType.DRIVERS_LICENSE,
        name: 'Driver\'s License',
        description: 'Valid government-issued driver\'s license',
        required: true,
        acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        validationRules: [
          {
            type: 'expiration',
            rule: 'not_expired',
            errorMessage: 'Driver\'s license must not be expired'
          },
          {
            type: 'authenticity',
            rule: 'security_features_present',
            errorMessage: 'Document appears to lack required security features'
          }
        ],
        clientType: 'individual'
      },
      {
        id: randomUUID(),
        type: DocumentType.PASSPORT,
        name: 'Passport',
        description: 'Valid passport (alternative to driver\'s license)',
        required: false,
        acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        maxFileSize: 10 * 1024 * 1024,
        validationRules: [
          {
            type: 'expiration',
            rule: 'not_expired',
            errorMessage: 'Passport must not be expired'
          }
        ],
        clientType: 'individual'
      },

      // Address Verification
      {
        id: randomUUID(),
        type: DocumentType.UTILITY_BILL,
        name: 'Utility Bill',
        description: 'Recent utility bill (within 90 days)',
        required: true,
        acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        maxFileSize: 5 * 1024 * 1024,
        validationRules: [
          {
            type: 'content',
            rule: 'date_within_90_days',
            errorMessage: 'Utility bill must be dated within the last 90 days'
          },
          {
            type: 'content',
            rule: 'address_matches_application',
            errorMessage: 'Address on utility bill must match application address'
          }
        ]
      },

      // Financial Documents
      {
        id: randomUUID(),
        type: DocumentType.BANK_STATEMENT,
        name: 'Bank Statement',
        description: 'Recent bank statement (within 60 days)',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 10 * 1024 * 1024,
        validationRules: [
          {
            type: 'content',
            rule: 'date_within_60_days',
            errorMessage: 'Bank statement must be dated within the last 60 days'
          },
          {
            type: 'content',
            rule: 'sufficient_balance',
            parameters: { minimum_balance: 10000 },
            errorMessage: 'Insufficient account balance for minimum investment'
          }
        ]
      },

      // Tax Documents
      {
        id: randomUUID(),
        type: DocumentType.TAX_RETURN,
        name: 'Tax Return',
        description: 'Most recent tax return (Form 1040)',
        required: false,
        acceptedFormats: ['pdf'],
        maxFileSize: 20 * 1024 * 1024,
        validationRules: [
          {
            type: 'content',
            rule: 'tax_year_recent',
            parameters: { max_years_old: 2 },
            errorMessage: 'Tax return must be from within the last 2 years'
          }
        ]
      },

      // Entity Documents
      {
        id: randomUUID(),
        type: DocumentType.ARTICLES_OF_INCORPORATION,
        name: 'Articles of Incorporation',
        description: 'Corporate formation documents',
        required: true,
        acceptedFormats: ['pdf'],
        maxFileSize: 20 * 1024 * 1024,
        validationRules: [
          {
            type: 'authenticity',
            rule: 'state_seal_present',
            errorMessage: 'Document must contain official state seal'
          }
        ],
        clientType: 'entity'
      },

      // Banking Setup
      {
        id: randomUUID(),
        type: DocumentType.VOIDED_CHECK,
        name: 'Voided Check',
        description: 'Voided check for ACH setup',
        required: true,
        acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        maxFileSize: 5 * 1024 * 1024,
        validationRules: [
          {
            type: 'content',
            rule: 'routing_number_valid',
            errorMessage: 'Bank routing number is invalid'
          },
          {
            type: 'content',
            rule: 'clearly_voided',
            errorMessage: 'Check must be clearly marked as voided'
          }
        ]
      },

      // Compliance Documents
      {
        id: randomUUID(),
        type: DocumentType.FATCA_FORM,
        name: 'FATCA Form',
        description: 'Foreign Account Tax Compliance Act form',
        required: false,
        acceptedFormats: ['pdf'],
        maxFileSize: 10 * 1024 * 1024,
        validationRules: [
          {
            type: 'content',
            rule: 'properly_signed',
            errorMessage: 'Form must be properly signed and dated'
          }
        ]
      }
    ];

    standardRequirements.forEach(req => {
      this.requirements.set(req.id, req);
    });
  }

  async getRequirementsForClient(
    clientType: 'individual' | 'entity' | 'trust' | 'partnership',
    accountType: string,
    jurisdiction: string = 'US'
  ): Promise<DocumentRequirement[]> {
    const applicableRequirements = Array.from(this.requirements.values())
      .filter(req => {
        // Filter by client type
        if (req.clientType && req.clientType !== clientType) {
          return false;
        }

        // Filter by account type
        if (req.accountType && !req.accountType.includes(accountType)) {
          return false;
        }

        // Filter by jurisdiction
        if (req.jurisdiction && req.jurisdiction !== jurisdiction) {
          return false;
        }

        return true;
      });

    // Add additional requirements based on specific conditions
    if (clientType === 'entity') {
      // Add beneficial ownership form for entities
      const beneficialOwnershipReq: DocumentRequirement = {
        id: randomUUID(),
        type: DocumentType.BENEFICIAL_OWNERSHIP_FORM,
        name: 'Beneficial Ownership Form',
        description: 'Form identifying beneficial owners (CDD Rule)',
        required: true,
        acceptedFormats: ['pdf'],
        maxFileSize: 10 * 1024 * 1024,
        validationRules: [
          {
            type: 'content',
            rule: 'all_owners_identified',
            errorMessage: 'All beneficial owners must be identified'
          }
        ],
        clientType: 'entity'
      };
      applicableRequirements.push(beneficialOwnershipReq);
    }

    return applicableRequirements;
  }

  async submitDocument(submission: Omit<DocumentSubmission, 'id' | 'submittedAt' | 'status' | 'verificationResults'>): Promise<DocumentSubmission> {
    const documentSubmission: DocumentSubmission = {
      ...submission,
      id: randomUUID(),
      submittedAt: new Date(),
      status: DocumentStatus.SUBMITTED,
      verificationResults: []
    };

    this.submissions.set(documentSubmission.id, documentSubmission);

    this.emit('documentSubmitted', documentSubmission);

    // Start verification process
    await this.startVerification(documentSubmission.id);

    return documentSubmission;
  }

  private async startVerification(submissionId: string): Promise<any> {
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    submission.status = DocumentStatus.UNDER_REVIEW;

    const requirement = this.requirements.get(submission.requirementId);
    if (!requirement) {
      throw new Error('Document requirement not found');
    }

    // Run all validation rules
    const verificationPromises = [
      this.performFormatCheck(submission, requirement),
      this.performContentExtraction(submission, requirement),
      this.performAuthenticityCheck(submission, requirement),
      this.performExpirationCheck(submission, requirement)
    ];

    const verifications = await Promise.all(verificationPromises);
    submission.verificationResults.push(...verifications.filter(v => v !== null) as DocumentVerification[]);

    // Determine overall status
    const hasFailures = submission.verificationResults.some(v => v.status === VerificationStatus.FAILED);
    const requiresReview = submission.verificationResults.some(v => v.status === VerificationStatus.REQUIRES_REVIEW);

    if (hasFailures) {
      submission.status = DocumentStatus.REJECTED;
      this.emit('documentRejected', submission);
    } else if (requiresReview) {
      submission.status = DocumentStatus.UNDER_REVIEW;
      this.emit('documentRequiresReview', submission);
    } else {
      submission.status = DocumentStatus.VERIFIED;
      this.emit('documentVerified', submission);
    }
  }

  private async performFormatCheck(
    submission: DocumentSubmission,
    requirement: DocumentRequirement
  ): Promise<DocumentVerification> {
    const fileExtension = submission.fileName.split('.').pop()?.toLowerCase();
    const isValidFormat = requirement.acceptedFormats.includes(fileExtension || '');
    const isValidSize = submission.fileSize <= requirement.maxFileSize;

    const flags: VerificationFlag[] = [];
    if (!isValidFormat) {
      flags.push({
        type: 'error',
        code: 'INVALID_FORMAT',
        message: `File format ${fileExtension} is not accepted`,
        severity: 'high'
      });
    }
    if (!isValidSize) {
      flags.push({
        type: 'error',
        code: 'FILE_TOO_LARGE',
        message: `File size ${submission.fileSize} exceeds maximum ${requirement.maxFileSize}`,
        severity: 'high'
      });
    }

    return {
      id: randomUUID(),
      verifierId: 'system',
      verifierType: 'system',
      verificationType: VerificationType.FORMAT_CHECK,
      status: flags.length > 0 ? VerificationStatus.FAILED : VerificationStatus.PASSED,
      confidence: flags.length > 0 ? 0 : 100,
      results: {
        validFormat: isValidFormat,
        validSize: isValidSize,
        actualFormat: fileExtension,
        actualSize: submission.fileSize
      },
      verifiedAt: new Date(),
      flags
    };
  }

  private async performContentExtraction(
    submission: DocumentSubmission,
    requirement: DocumentRequirement
  ): Promise<DocumentVerification | null> {
    // This would integrate with OCR/document processing services
    // For now, return mock results
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(submission.fileName.split('.').pop()?.toLowerCase() || '')) {
      return null;
    }

    const extractedData = await this.mockContentExtraction(submission, requirement);

    return {
      id: randomUUID(),
      verifierId: 'ocr-service',
      verifierType: 'system',
      verificationType: VerificationType.CONTENT_EXTRACTION,
      status: VerificationStatus.PASSED,
      confidence: 85,
      results: extractedData,
      verifiedAt: new Date(),
      flags: []
    };
  }

  private async performAuthenticityCheck(
    submission: DocumentSubmission,
    requirement: DocumentRequirement
  ): Promise<DocumentVerification | null> {
    // This would integrate with document authenticity services
    // For now, return mock results for documents that require authenticity checks
    const requiresAuthenticityCheck = requirement.validationRules.some(rule => rule.type === 'authenticity');
    
    if (!requiresAuthenticityCheck) {
      return null;
    }

    const authenticityScore = Math.random() * 40 + 60; // Mock score between 60-100
    const isAuthentic = authenticityScore > 75;

    const flags: VerificationFlag[] = [];
    if (!isAuthentic) {
      flags.push({
        type: 'warning',
        code: 'LOW_AUTHENTICITY_SCORE',
        message: 'Document authenticity score is below threshold',
        severity: 'medium'
      });
    }

    return {
      id: randomUUID(),
      verifierId: 'authenticity-service',
      verifierType: 'third_party',
      verificationType: VerificationType.AUTHENTICITY_CHECK,
      status: isAuthentic ? VerificationStatus.PASSED : VerificationStatus.REQUIRES_REVIEW,
      confidence: Math.round(authenticityScore),
      results: {
        authenticityScore,
        securityFeatures: {
          watermark: true,
          microtext: true,
          hologram: Math.random() > 0.3
        }
      },
      verifiedAt: new Date(),
      flags
    };
  }

  private async performExpirationCheck(
    submission: DocumentSubmission,
    requirement: DocumentRequirement
  ): Promise<DocumentVerification | null> {
    const hasExpirationRule = requirement.validationRules.some(rule => rule.type === 'expiration');
    
    if (!hasExpirationRule) {
      return null;
    }

    // Mock expiration date extraction
    const mockExpirationDate = new Date();
    mockExpirationDate.setFullYear(mockExpirationDate.getFullYear() + 2); // 2 years from now
    
    const isExpired = mockExpirationDate < new Date();
    const expiresWithin30Days = mockExpirationDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const flags: VerificationFlag[] = [];
    if (isExpired) {
      flags.push({
        type: 'error',
        code: 'DOCUMENT_EXPIRED',
        message: 'Document has expired',
        severity: 'critical'
      });
    } else if (expiresWithin30Days) {
      flags.push({
        type: 'warning',
        code: 'EXPIRES_SOON',
        message: 'Document expires within 30 days',
        severity: 'medium'
      });
    }

    return {
      id: randomUUID(),
      verifierId: 'system',
      verifierType: 'system',
      verificationType: VerificationType.EXPIRATION_CHECK,
      status: isExpired ? VerificationStatus.FAILED : VerificationStatus.PASSED,
      confidence: 100,
      results: {
        expirationDate: mockExpirationDate.toISOString(),
        isExpired,
        expiresWithin30Days
      },
      verifiedAt: new Date(),
      flags
    };
  }

  private async mockContentExtraction(
    submission: DocumentSubmission,
    requirement: DocumentRequirement
  ): Promise<Record<string, any>> {
    // Mock extracted content based on document type
    const baseData = {
      documentType: requirement.type,
      extractionConfidence: Math.random() * 30 + 70, // 70-100%
      textQuality: 'good'
    };

    switch (requirement.type) {
      case DocumentType.DRIVERS_LICENSE:
        return {
          ...baseData,
          licenseNumber: 'DL123456789',
          fullName: 'John Doe',
          address: '123 Main St, Anytown, ST 12345',
          dateOfBirth: '1990-01-01',
          expirationDate: '2025-12-31',
          issueDate: '2020-01-01',
          class: 'C',
          restrictions: 'NONE'
        };

      case DocumentType.BANK_STATEMENT:
        return {
          ...baseData,
          accountNumber: '****1234',
          routingNumber: '123456789',
          statementDate: '2024-01-31',
          accountHolder: 'John Doe',
          beginningBalance: 25000.00,
          endingBalance: 27500.00,
          bankName: 'First National Bank'
        };

      case DocumentType.UTILITY_BILL:
        return {
          ...baseData,
          serviceAddress: '123 Main St, Anytown, ST 12345',
          accountHolder: 'John Doe',
          billDate: '2024-01-15',
          dueDate: '2024-02-15',
          utilityCompany: 'City Electric',
          accountNumber: 'UE123456789'
        };

      default:
        return baseData;
    }
  }

  getSubmissionsByWorkflow(workflowId: string): DocumentSubmission[] {
    return Array.from(this.submissions.values())
      .filter(submission => submission.workflowId === workflowId);
  }

  getSubmission(submissionId: string): DocumentSubmission | undefined {
    return this.submissions.get(submissionId);
  }

  async requestAdditionalDocument(
    workflowId: string,
    requirementId: string,
    reason: string
  ): Promise<any> {
    this.emit('additionalDocumentRequested', {
      workflowId,
      requirementId,
      reason,
      requestedAt: new Date()
    });
  }

  async getCompletionStatus(workflowId: string): Promise<{
    totalRequired: number;
    submitted: number;
    verified: number;
    rejected: number;
    pending: number;
    completionPercentage: number;
    missingRequirements: DocumentRequirement[];
  }> {
    const submissions = this.getSubmissionsByWorkflow(workflowId);
    const submittedRequirementIds = new Set(submissions.map(s => s.requirementId));
    
    const totalRequirements = Array.from(this.requirements.values())
      .filter(req => req.required);
    
    const totalRequired = totalRequirements.length;
    const submitted = submissions.length;
    const verified = submissions.filter(s => s.status === DocumentStatus.VERIFIED).length;
    const rejected = submissions.filter(s => s.status === DocumentStatus.REJECTED).length;
    const pending = submissions.filter(s => 
      [DocumentStatus.SUBMITTED, DocumentStatus.UNDER_REVIEW].includes(s.status)
    ).length;

    const missingRequirements = totalRequirements
      .filter(req => !submittedRequirementIds.has(req.id));

    const completionPercentage = totalRequired > 0 ? (verified / totalRequired) * 100 : 0;

    return {
      totalRequired,
      submitted,
      verified,
      rejected,
      pending,
      completionPercentage,
      missingRequirements
    };
  }
}

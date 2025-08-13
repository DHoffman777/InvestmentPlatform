import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface IdentityVerificationSession {
  id: string;
  clientId: string;
  tenantId: string;
  workflowId: string;
  sessionType: VerificationSessionType;
  status: VerificationSessionStatus;
  provider: string;
  methods: VerificationMethod[];
  results: VerificationResult[];
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    sessionDuration?: number;
    attempts: number;
    maxAttempts: number;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface VerificationMethod {
  id: string;
  type: VerificationMethodType;
  status: VerificationStatus;
  confidence: number;
  provider: string;
  startedAt: Date;
  completedAt?: Date;
  data: Record<string, any>;
  errors?: VerificationError[];
}

export interface VerificationResult {
  id: string;
  sessionId: string;
  methodId: string;
  verified: boolean;
  confidence: number;
  score: number;
  riskFactors: string[];
  details: Record<string, any>;
  timestamp: Date;
}

export interface VerificationError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  timestamp: Date;
}

export interface BiometricVerification {
  id: string;
  sessionId: string;
  type: BiometricType;
  status: BiometricStatus;
  liveness: {
    score: number;
    verified: boolean;
    flags: string[];
  };
  quality: {
    score: number;
    acceptable: boolean;
    issues: string[];
  };
  comparison: {
    documentPhoto: boolean;
    selfiePhoto: boolean;
    matchScore: number;
    verified: boolean;
  };
  createdAt: Date;
}

export interface DocumentVerification {
  id: string;
  sessionId: string;
  documentType: DocumentType;
  status: DocumentVerificationStatus;
  authenticity: {
    score: number;
    verified: boolean;
    features: AuthenticityFeature[];
  };
  dataExtraction: {
    success: boolean;
    confidence: number;
    extractedData: Record<string, any>;
    validationResults: DataValidationResult[];
  };
  imageQuality: {
    score: number;
    acceptable: boolean;
    issues: string[];
  };
  createdAt: Date;
}

export interface AuthenticityFeature {
  name: string;
  present: boolean;
  confidence: number;
  description: string;
}

export interface DataValidationResult {
  field: string;
  status: 'valid' | 'invalid' | 'warning';
  message: string;
  extractedValue?: any;
  expectedFormat?: string;
}

export interface KnowledgeBasedAuth {
  id: string;
  sessionId: string;
  provider: string;
  status: KBAStatus;
  questions: KBAQuestion[];
  score: number;
  passed: boolean;
  metadata: {
    questionsAnswered: number;
    correctAnswers: number;
    timeSpent: number;
    riskIndicators: string[];
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface KBAQuestion {
  id: string;
  question: string;
  options: string[];
  answer?: string;
  correct?: boolean;
  timeSpent?: number;
  confidence?: number;
}

export enum VerificationSessionType {
  FULL_VERIFICATION = 'FULL_VERIFICATION',
  DOCUMENT_ONLY = 'DOCUMENT_ONLY',
  BIOMETRIC_ONLY = 'BIOMETRIC_ONLY',
  KBA_ONLY = 'KBA_ONLY',
  RE_VERIFICATION = 'RE_VERIFICATION',
  PERIODIC_REVIEW = 'PERIODIC_REVIEW'
}

export enum VerificationSessionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_INPUT = 'AWAITING_INPUT',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum VerificationMethodType {
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  BIOMETRIC_VERIFICATION = 'BIOMETRIC_VERIFICATION',
  KNOWLEDGE_BASED_AUTH = 'KNOWLEDGE_BASED_AUTH',
  DATABASE_VERIFICATION = 'DATABASE_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  ADDRESS_VERIFICATION = 'ADDRESS_VERIFICATION'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED'
}

export enum BiometricType {
  FACE_MATCH = 'FACE_MATCH',
  LIVENESS_CHECK = 'LIVENESS_CHECK',
  VOICE_PRINT = 'VOICE_PRINT',
  FINGERPRINT = 'FINGERPRINT'
}

export enum BiometricStatus {
  PENDING = 'PENDING',
  CAPTURING = 'CAPTURING',
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  QUALITY_INSUFFICIENT = 'QUALITY_INSUFFICIENT',
  LIVENESS_FAILED = 'LIVENESS_FAILED'
}

export enum DocumentType {
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  NATIONAL_ID = 'NATIONAL_ID',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE'
}

export enum DocumentVerificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  INVALID_DOCUMENT = 'INVALID_DOCUMENT',
  EXPIRED_DOCUMENT = 'EXPIRED_DOCUMENT',
  POOR_IMAGE_QUALITY = 'POOR_IMAGE_QUALITY'
}

export enum KBAStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  TIMEOUT = 'TIMEOUT'
}

export class IdentityVerificationService extends EventEmitter {
  private sessions: Map<string, IdentityVerificationSession> = new Map();
  private biometricVerifications: Map<string, BiometricVerification> = new Map();
  private documentVerifications: Map<string, DocumentVerification> = new Map();
  private kbaVerifications: Map<string, KnowledgeBasedAuth> = new Map();

  constructor() {
    super();
  }

  async createVerificationSession(
    clientId: string,
    tenantId: string,
    workflowId: string,
    sessionType: VerificationSessionType,
    provider: string = 'default',
    options: {
      maxAttempts?: number;
      sessionTimeout?: number;
      requiredMethods?: VerificationMethodType[];
    } = {}
  ): Promise<IdentityVerificationSession> {
    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (options.sessionTimeout || 30));

    const session: IdentityVerificationSession = {
      id: sessionId,
      clientId,
      tenantId,
      workflowId,
      sessionType,
      status: VerificationSessionStatus.PENDING,
      provider,
      methods: [],
      results: [],
      metadata: {
        attempts: 0,
        maxAttempts: options.maxAttempts || 3
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt
    };

    this.sessions.set(sessionId, session);

    // Initialize required verification methods
    const requiredMethods = options.requiredMethods || this.getDefaultMethodsForSessionType(sessionType);
    for (const methodType of requiredMethods) {
      await this.initializeVerificationMethod(sessionId, methodType);
    }

    this.emit('verificationSessionCreated', session);
    return session;
  }

  private getDefaultMethodsForSessionType(sessionType: VerificationSessionType): VerificationMethodType[] {
    switch (sessionType) {
      case VerificationSessionType.FULL_VERIFICATION:
        return [
          VerificationMethodType.DOCUMENT_VERIFICATION,
          VerificationMethodType.BIOMETRIC_VERIFICATION,
          VerificationMethodType.KNOWLEDGE_BASED_AUTH
        ];
      case VerificationSessionType.DOCUMENT_ONLY:
        return [VerificationMethodType.DOCUMENT_VERIFICATION];
      case VerificationSessionType.BIOMETRIC_ONLY:
        return [VerificationMethodType.BIOMETRIC_VERIFICATION];
      case VerificationSessionType.KBA_ONLY:
        return [VerificationMethodType.KNOWLEDGE_BASED_AUTH];
      case VerificationSessionType.RE_VERIFICATION:
        return [
          VerificationMethodType.BIOMETRIC_VERIFICATION,
          VerificationMethodType.KNOWLEDGE_BASED_AUTH
        ];
      default:
        return [VerificationMethodType.DOCUMENT_VERIFICATION];
    }
  }

  private async initializeVerificationMethod(
    sessionId: string,
    methodType: VerificationMethodType
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const method: VerificationMethod = {
      id: randomUUID(),
      type: methodType,
      status: VerificationStatus.PENDING,
      confidence: 0,
      provider: session.provider,
      startedAt: new Date(),
      data: {}
    };

    session.methods.push(method);
    session.updatedAt = new Date();

    this.emit('verificationMethodInitialized', { sessionId, method });
  }

  async startDocumentVerification(
    sessionId: string,
    documentType: DocumentType,
    frontImagePath: string,
    backImagePath?: string
  ): Promise<DocumentVerification> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Verification session not found');
    }

    const method = session.methods.find(m => m.type === VerificationMethodType.DOCUMENT_VERIFICATION);
    if (!method) {
      throw new Error('Document verification method not initialized');
    }

    method.status = VerificationStatus.IN_PROGRESS;
    method.data = { documentType, frontImagePath, backImagePath };

    const documentVerification: DocumentVerification = {
      id: randomUUID(),
      sessionId,
      documentType,
      status: DocumentVerificationStatus.PROCESSING,
      authenticity: {
        score: 0,
        verified: false,
        features: []
      },
      dataExtraction: {
        success: false,
        confidence: 0,
        extractedData: {},
        validationResults: []
      },
      imageQuality: {
        score: 0,
        acceptable: false,
        issues: []
      },
      createdAt: new Date()
    };

    this.documentVerifications.set(documentVerification.id, documentVerification);

    // Simulate document processing
    await this.processDocumentVerification(documentVerification.id);

    return documentVerification;
  }

  private async processDocumentVerification(verificationId: string): Promise<void> {
    const verification = this.documentVerifications.get(verificationId);
    if (!verification) return;

    // Simulate image quality assessment
    verification.imageQuality = {
      score: Math.random() * 30 + 70, // 70-100
      acceptable: Math.random() > 0.1,
      issues: Math.random() < 0.2 ? ['blur', 'glare'] : []
    };

    // Simulate authenticity check
    verification.authenticity = {
      score: Math.random() * 20 + 80, // 80-100
      verified: Math.random() > 0.05,
      features: [
        {
          name: 'Microtext',
          present: Math.random() > 0.1,
          confidence: Math.random() * 20 + 80,
          description: 'Security microtext verification'
        },
        {
          name: 'Hologram',
          present: Math.random() > 0.15,
          confidence: Math.random() * 25 + 75,
          description: 'Holographic security element'
        },
        {
          name: 'UV Features',
          present: Math.random() > 0.1,
          confidence: Math.random() * 15 + 85,
          description: 'UV-visible security features'
        }
      ]
    };

    // Simulate data extraction
    verification.dataExtraction = {
      success: Math.random() > 0.05,
      confidence: Math.random() * 20 + 80,
      extractedData: this.generateMockExtractedData(verification.documentType),
      validationResults: [
        {
          field: 'dateOfBirth',
          status: 'valid',
          message: 'Valid date format',
          extractedValue: '1990-01-01'
        },
        {
          field: 'expirationDate',
          status: Math.random() > 0.1 ? 'valid' : 'warning',
          message: Math.random() > 0.1 ? 'Document not expired' : 'Document expires within 30 days'
        }
      ]
    };

    // Determine overall status
    if (!verification.imageQuality.acceptable) {
      verification.status = DocumentVerificationStatus.POOR_IMAGE_QUALITY;
    } else if (!verification.authenticity.verified) {
      verification.status = DocumentVerificationStatus.INVALID_DOCUMENT;
    } else if (!verification.dataExtraction.success) {
      verification.status = DocumentVerificationStatus.FAILED;
    } else {
      verification.status = DocumentVerificationStatus.VERIFIED;
    }

    this.emit('documentVerificationComplete', verification);
    await this.updateSessionProgress(verification.sessionId);
  }

  private generateMockExtractedData(documentType: DocumentType): Record<string, any> {
    const baseData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      documentNumber: 'DOC123456789'
    };

    switch (documentType) {
      case DocumentType.DRIVERS_LICENSE:
        return {
          ...baseData,
          licenseClass: 'C',
          address: '123 Main St, Anytown, ST 12345',
          expirationDate: '2025-12-31',
          restrictions: 'NONE'
        };
      case DocumentType.PASSPORT:
        return {
          ...baseData,
          passportNumber: 'P123456789',
          nationality: 'US',
          placeOfBirth: 'New York, NY',
          expirationDate: '2030-12-31'
        };
      default:
        return baseData;
    }
  }

  async startBiometricVerification(
    sessionId: string,
    biometricType: BiometricType,
    captureData: string | Buffer
  ): Promise<BiometricVerification> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Verification session not found');
    }

    const method = session.methods.find(m => m.type === VerificationMethodType.BIOMETRIC_VERIFICATION);
    if (!method) {
      throw new Error('Biometric verification method not initialized');
    }

    method.status = VerificationStatus.IN_PROGRESS;
    method.data = { biometricType, captureData };

    const biometricVerification: BiometricVerification = {
      id: randomUUID(),
      sessionId,
      type: biometricType,
      status: BiometricStatus.PROCESSING,
      liveness: {
        score: 0,
        verified: false,
        flags: []
      },
      quality: {
        score: 0,
        acceptable: false,
        issues: []
      },
      comparison: {
        documentPhoto: false,
        selfiePhoto: false,
        matchScore: 0,
        verified: false
      },
      createdAt: new Date()
    };

    this.biometricVerifications.set(biometricVerification.id, biometricVerification);

    // Simulate biometric processing
    await this.processBiometricVerification(biometricVerification.id);

    return biometricVerification;
  }

  private async processBiometricVerification(verificationId: string): Promise<void> {
    const verification = this.biometricVerifications.get(verificationId);
    if (!verification) return;

    // Simulate quality assessment
    verification.quality = {
      score: Math.random() * 30 + 70, // 70-100
      acceptable: Math.random() > 0.1,
      issues: Math.random() < 0.15 ? ['poor_lighting', 'motion_blur'] : []
    };

    // Simulate liveness detection
    verification.liveness = {
      score: Math.random() * 20 + 80, // 80-100
      verified: Math.random() > 0.05,
      flags: Math.random() < 0.1 ? ['static_image', 'presentation_attack'] : []
    };

    // Simulate face matching
    if (verification.type === BiometricType.FACE_MATCH) {
      verification.comparison = {
        documentPhoto: true,
        selfiePhoto: true,
        matchScore: Math.random() * 20 + 80, // 80-100
        verified: Math.random() > 0.1
      };
    }

    // Determine overall status
    if (!verification.quality.acceptable) {
      verification.status = BiometricStatus.QUALITY_INSUFFICIENT;
    } else if (!verification.liveness.verified) {
      verification.status = BiometricStatus.LIVENESS_FAILED;
    } else if (verification.type === BiometricType.FACE_MATCH && !verification.comparison.verified) {
      verification.status = BiometricStatus.FAILED;
    } else {
      verification.status = BiometricStatus.VERIFIED;
    }

    this.emit('biometricVerificationComplete', verification);
    await this.updateSessionProgress(verification.sessionId);
  }

  async startKnowledgeBasedAuth(sessionId: string): Promise<KnowledgeBasedAuth> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Verification session not found');
    }

    const method = session.methods.find(m => m.type === VerificationMethodType.KNOWLEDGE_BASED_AUTH);
    if (!method) {
      throw new Error('KBA method not initialized');
    }

    method.status = VerificationStatus.IN_PROGRESS;

    const kbaVerification: KnowledgeBasedAuth = {
      id: randomUUID(),
      sessionId,
      provider: 'KBAProvider',
      status: KBAStatus.IN_PROGRESS,
      questions: this.generateKBAQuestions(),
      score: 0,
      passed: false,
      metadata: {
        questionsAnswered: 0,
        correctAnswers: 0,
        timeSpent: 0,
        riskIndicators: []
      },
      createdAt: new Date()
    };

    this.kbaVerifications.set(kbaVerification.id, kbaVerification);

    this.emit('kbaStarted', kbaVerification);
    return kbaVerification;
  }

  private generateKBAQuestions(): KBAQuestion[] {
    const questionTemplates = [
      'Which of the following streets have you lived on?',
      'What was the make of your first car?',
      'Which of these phone numbers have you had?',
      'What year did you graduate from high school?',
      'Which bank have you had an account with?'
    ];

    return questionTemplates.map(question => ({
      id: randomUUID(),
      question,
      options: [
        'Option A',
        'Option B', 
        'Option C',
        'None of the above'
      ]
    }));
  }

  async submitKBAAnswers(
    kbaId: string,
    answers: { questionId: string; answer: string; timeSpent: number }[]
  ): Promise<KnowledgeBasedAuth> {
    const kba = this.kbaVerifications.get(kbaId);
    if (!kba) {
      throw new Error('KBA verification not found');
    }

    // Process answers
    let correctAnswers = 0;
    let totalTimeSpent = 0;

    answers.forEach(answer => {
      const question = kba.questions.find(q => q.id === answer.questionId);
      if (question) {
        question.answer = answer.answer;
        question.timeSpent = answer.timeSpent;
        question.correct = Math.random() > 0.25; // 75% chance of correct answer
        question.confidence = Math.random() * 30 + 70;
        
        if (question.correct) correctAnswers++;
        totalTimeSpent += answer.timeSpent;
      }
    });

    kba.metadata.questionsAnswered = answers.length;
    kba.metadata.correctAnswers = correctAnswers;
    kba.metadata.timeSpent = totalTimeSpent;
    kba.score = (correctAnswers / answers.length) * 100;
    kba.passed = kba.score >= 75; // 75% passing threshold
    kba.status = kba.passed ? KBAStatus.PASSED : KBAStatus.FAILED;
    kba.completedAt = new Date();

    // Check for risk indicators
    if (totalTimeSpent < 30000) { // Less than 30 seconds
      kba.metadata.riskIndicators.push('unusually_fast_completion');
    }
    if (correctAnswers === answers.length && totalTimeSpent < 60000) {
      kba.metadata.riskIndicators.push('perfect_score_fast_completion');
    }

    this.emit('kbaCompleted', kba);
    await this.updateSessionProgress(kba.sessionId);

    return kba;
  }

  private async updateSessionProgress(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Check if all methods are completed
    const allMethodsCompleted = session.methods.every(method => 
      [VerificationStatus.COMPLETED, VerificationStatus.FAILED].includes(method.status)
    );

    if (allMethodsCompleted) {
      // Calculate overall results
      const results = await this.calculateSessionResults(sessionId);
      session.results = results;

      // Determine session status
      const hasFailures = results.some(r => !r.verified);
      session.status = hasFailures ? VerificationSessionStatus.FAILED : VerificationSessionStatus.COMPLETED;
      session.completedAt = new Date();
      session.updatedAt = new Date();

      this.emit('verificationSessionCompleted', session);
    }
  }

  private async calculateSessionResults(sessionId: string): Promise<VerificationResult[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const results: VerificationResult[] = [];

    for (const method of session.methods) {
      let verified = false;
      let confidence = 0;
      let score = 0;
      let riskFactors: string[] = [];
      let details: Record<string, any> = {};

      switch (method.type) {
        case VerificationMethodType.DOCUMENT_VERIFICATION:
          const docVerification = Array.from(this.documentVerifications.values())
            .find(dv => dv.sessionId === sessionId);
          if (docVerification) {
            verified = docVerification.status === DocumentVerificationStatus.VERIFIED;
            confidence = docVerification.authenticity.score;
            score = verified ? 100 : 0;
            details = {
              documentType: docVerification.documentType,
              authenticityScore: docVerification.authenticity.score,
              dataExtractionSuccess: docVerification.dataExtraction.success
            };
            if (!verified) {
              riskFactors.push('document_verification_failed');
            }
          }
          break;

        case VerificationMethodType.BIOMETRIC_VERIFICATION:
          const bioVerification = Array.from(this.biometricVerifications.values())
            .find(bv => bv.sessionId === sessionId);
          if (bioVerification) {
            verified = bioVerification.status === BiometricStatus.VERIFIED;
            confidence = bioVerification.comparison.matchScore;
            score = verified ? bioVerification.comparison.matchScore : 0;
            details = {
              livenessScore: bioVerification.liveness.score,
              qualityScore: bioVerification.quality.score,
              matchScore: bioVerification.comparison.matchScore
            };
            if (!bioVerification.liveness.verified) {
              riskFactors.push('liveness_check_failed');
            }
            if (!verified) {
              riskFactors.push('biometric_match_failed');
            }
          }
          break;

        case VerificationMethodType.KNOWLEDGE_BASED_AUTH:
          const kbaVerification = Array.from(this.kbaVerifications.values())
            .find(kv => kv.sessionId === sessionId);
          if (kbaVerification) {
            verified = kbaVerification.passed;
            confidence = kbaVerification.score;
            score = kbaVerification.score;
            details = {
              questionsAnswered: kbaVerification.metadata.questionsAnswered,
              correctAnswers: kbaVerification.metadata.correctAnswers,
              timeSpent: kbaVerification.metadata.timeSpent,
              riskIndicators: kbaVerification.metadata.riskIndicators
            };
            if (kbaVerification.metadata.riskIndicators.length > 0) {
              riskFactors.push(...kbaVerification.metadata.riskIndicators);
            }
          }
          break;
      }

      results.push({
        id: randomUUID(),
        sessionId,
        methodId: method.id,
        verified,
        confidence,
        score,
        riskFactors,
        details,
        timestamp: new Date()
      });
    }

    return results;
  }

  getVerificationSession(sessionId: string): IdentityVerificationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionsByClient(clientId: string, tenantId: string): IdentityVerificationSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.clientId === clientId && session.tenantId === tenantId);
  }

  async getVerificationMetrics(tenantId?: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    failedSessions: number;
    successRate: number;
    averageSessionDuration: number;
    methodSuccessRates: Record<VerificationMethodType, number>;
  }> {
    const sessions = Array.from(this.sessions.values())
      .filter(session => !tenantId || session.tenantId === tenantId);

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === VerificationSessionStatus.COMPLETED).length;
    const failedSessions = sessions.filter(s => s.status === VerificationSessionStatus.FAILED).length;
    const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const completedSessionsWithDuration = sessions
      .filter(s => s.status === VerificationSessionStatus.COMPLETED && s.completedAt)
      .map(s => s.completedAt!.getTime() - s.createdAt.getTime());

    const averageSessionDuration = completedSessionsWithDuration.length > 0
      ? completedSessionsWithDuration.reduce((a, b) => a + b, 0) / completedSessionsWithDuration.length
      : 0;

    const methodSuccessRates: Record<VerificationMethodType, number> = {} as Record<VerificationMethodType, number>;
    Object.values(VerificationMethodType).forEach(methodType => {
      const methodResults = sessions
        .flatMap(s => s.results)
        .filter(r => s.methods.find(m => m.id === r.methodId)?.type === methodType);
      
      const successfulMethods = methodResults.filter(r => r.verified).length;
      methodSuccessRates[methodType] = methodResults.length > 0 
        ? (successfulMethods / methodResults.length) * 100 
        : 0;
    });

    return {
      totalSessions,
      completedSessions,
      failedSessions,
      successRate,
      averageSessionDuration,
      methodSuccessRates
    };
  }
}
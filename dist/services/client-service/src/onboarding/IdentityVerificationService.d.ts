import { EventEmitter } from 'events';
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
export declare enum VerificationSessionType {
    FULL_VERIFICATION = "FULL_VERIFICATION",
    DOCUMENT_ONLY = "DOCUMENT_ONLY",
    BIOMETRIC_ONLY = "BIOMETRIC_ONLY",
    KBA_ONLY = "KBA_ONLY",
    RE_VERIFICATION = "RE_VERIFICATION",
    PERIODIC_REVIEW = "PERIODIC_REVIEW"
}
export declare enum VerificationSessionStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    AWAITING_INPUT = "AWAITING_INPUT",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export declare enum VerificationMethodType {
    DOCUMENT_VERIFICATION = "DOCUMENT_VERIFICATION",
    BIOMETRIC_VERIFICATION = "BIOMETRIC_VERIFICATION",
    KNOWLEDGE_BASED_AUTH = "KNOWLEDGE_BASED_AUTH",
    DATABASE_VERIFICATION = "DATABASE_VERIFICATION",
    PHONE_VERIFICATION = "PHONE_VERIFICATION",
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
    ADDRESS_VERIFICATION = "ADDRESS_VERIFICATION"
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    TIMEOUT = "TIMEOUT",
    CANCELLED = "CANCELLED"
}
export declare enum BiometricType {
    FACE_MATCH = "FACE_MATCH",
    LIVENESS_CHECK = "LIVENESS_CHECK",
    VOICE_PRINT = "VOICE_PRINT",
    FINGERPRINT = "FINGERPRINT"
}
export declare enum BiometricStatus {
    PENDING = "PENDING",
    CAPTURING = "CAPTURING",
    PROCESSING = "PROCESSING",
    VERIFIED = "VERIFIED",
    FAILED = "FAILED",
    QUALITY_INSUFFICIENT = "QUALITY_INSUFFICIENT",
    LIVENESS_FAILED = "LIVENESS_FAILED"
}
export declare enum DocumentType {
    DRIVERS_LICENSE = "DRIVERS_LICENSE",
    PASSPORT = "PASSPORT",
    NATIONAL_ID = "NATIONAL_ID",
    BIRTH_CERTIFICATE = "BIRTH_CERTIFICATE"
}
export declare enum DocumentVerificationStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    VERIFIED = "VERIFIED",
    FAILED = "FAILED",
    INVALID_DOCUMENT = "INVALID_DOCUMENT",
    EXPIRED_DOCUMENT = "EXPIRED_DOCUMENT",
    POOR_IMAGE_QUALITY = "POOR_IMAGE_QUALITY"
}
export declare enum KBAStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    PASSED = "PASSED",
    FAILED = "FAILED",
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
    TIMEOUT = "TIMEOUT"
}
export declare class IdentityVerificationService extends EventEmitter {
    private sessions;
    private biometricVerifications;
    private documentVerifications;
    private kbaVerifications;
    constructor();
    createVerificationSession(clientId: string, tenantId: string, workflowId: string, sessionType: VerificationSessionType, provider?: string, options?: {
        maxAttempts?: number;
        sessionTimeout?: number;
        requiredMethods?: VerificationMethodType[];
    }): Promise<IdentityVerificationSession>;
    private getDefaultMethodsForSessionType;
    private initializeVerificationMethod;
    startDocumentVerification(sessionId: string, documentType: DocumentType, frontImagePath: string, backImagePath?: string): Promise<DocumentVerification>;
    private processDocumentVerification;
    private generateMockExtractedData;
    startBiometricVerification(sessionId: string, biometricType: BiometricType, captureData: string | Buffer): Promise<BiometricVerification>;
    private processBiometricVerification;
    startKnowledgeBasedAuth(sessionId: string): Promise<KnowledgeBasedAuth>;
    private generateKBAQuestions;
    submitKBAAnswers(kbaId: string, answers: {
        questionId: string;
        answer: string;
        timeSpent: number;
    }[]): Promise<KnowledgeBasedAuth>;
    private updateSessionProgress;
    private calculateSessionResults;
    getVerificationSession(sessionId: string): IdentityVerificationSession | undefined;
    getSessionsByClient(clientId: string, tenantId: string): IdentityVerificationSession[];
    getVerificationMetrics(tenantId?: string): Promise<{
        totalSessions: number;
        completedSessions: number;
        failedSessions: number;
        successRate: number;
        averageSessionDuration: number;
        methodSuccessRates: Record<VerificationMethodType, number>;
    }>;
}

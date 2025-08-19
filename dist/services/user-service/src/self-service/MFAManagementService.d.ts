import { EventEmitter } from 'events';
export interface MFAConfiguration {
    id: string;
    userId: string;
    tenantId: string;
    isEnabled: boolean;
    primaryMethod: MFAMethod;
    backupMethods: MFAMethod[];
    allowedMethods: MFAMethodType[];
    requiredMethods: MFAMethodType[];
    gracePeriod: number;
    bypassCodes: BypassCode[];
    settings: MFASettings;
    lastUpdated: Date;
    version: number;
    auditTrail: MFAAuditEntry[];
}
export interface MFAMethod {
    id: string;
    type: MFAMethodType;
    name: string;
    isActive: boolean;
    isPrimary: boolean;
    isVerified: boolean;
    settings: MFAMethodSettings;
    metadata: Record<string, any>;
    createdAt: Date;
    lastUsed?: Date;
    usageCount: number;
    failureCount: number;
    lastFailure?: Date;
    trustLevel: TrustLevel;
    expiresAt?: Date;
}
export interface MFAMethodSettings {
    secret?: string;
    algorithm?: TOTPAlgorithm;
    digits?: number;
    period?: number;
    phoneNumber?: string;
    countryCode?: string;
    carrier?: string;
    emailAddress?: string;
    serialNumber?: string;
    tokenType?: string;
    biometricType?: BiometricType;
    templateId?: string;
    deviceId?: string;
    appId?: string;
    codeCount?: number;
    codeLength?: number;
    recoveryEmail?: string;
    recoveryPhone?: string;
}
export interface MFASettings {
    requireForLogin: boolean;
    requireForSensitiveActions: boolean;
    requireForAPIAccess: boolean;
    allowTrustedDevices: boolean;
    trustedDeviceDuration: number;
    maxFailureAttempts: number;
    lockoutDuration: number;
    challengeTimeout: number;
    allowBackupMethods: boolean;
    rememberDeviceDuration: number;
    adaptiveAuthentication: boolean;
    riskBasedChallenges: boolean;
}
export interface BypassCode {
    id: string;
    code: string;
    codeHash: string;
    isUsed: boolean;
    usedAt?: Date;
    createdAt: Date;
    expiresAt?: Date;
    usageLimit: number;
    remainingUses: number;
    description?: string;
}
export interface MFAChallenge {
    id: string;
    userId: string;
    tenantId: string;
    methodId: string;
    challengeType: ChallengeType;
    challenge: string;
    expectedResponse?: string;
    createdAt: Date;
    expiresAt: Date;
    isCompleted: boolean;
    completedAt?: Date;
    attempts: ChallengeAttempt[];
    maxAttempts: number;
    ipAddress: string;
    userAgent: string;
    location?: GeolocationInfo;
    riskScore: number;
    metadata: Record<string, any>;
}
export interface ChallengeAttempt {
    id: string;
    timestamp: Date;
    response: string;
    isSuccessful: boolean;
    failureReason?: string;
    ipAddress: string;
    userAgent: string;
    timeTaken: number;
}
export interface MFAVerificationRequest {
    userId: string;
    methodId: string;
    challengeId: string;
    response: string;
    trustDevice?: boolean;
    deviceId?: string;
    ipAddress: string;
    userAgent: string;
}
export interface MFASetupRequest {
    userId: string;
    methodType: MFAMethodType;
    settings: Partial<MFAMethodSettings>;
    name?: string;
    isPrimary?: boolean;
}
export interface MFABackupCodeGeneration {
    codes: string[];
    createdAt: Date;
    expiresAt?: Date;
    format: 'numeric' | 'alphanumeric' | 'hex';
    length: number;
    count: number;
}
export interface MFAAuditEntry {
    id: string;
    timestamp: Date;
    userId: string;
    action: MFAAction;
    methodType?: MFAMethodType;
    methodId?: string;
    success: boolean;
    failureReason?: string;
    ipAddress: string;
    userAgent: string;
    location?: GeolocationInfo;
    riskScore: number;
    details: Record<string, any>;
}
export interface GeolocationInfo {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
}
export declare enum MFAMethodType {
    TOTP = "totp",// Time-based OTP (Google Authenticator, Authy)
    SMS = "sms",// SMS verification
    EMAIL = "email",// Email verification
    HARDWARE_TOKEN = "hardware_token",// Hardware security keys (YubiKey)
    BIOMETRIC = "biometric",// Fingerprint, face recognition
    PUSH_NOTIFICATION = "push",// Push notification to mobile app
    BACKUP_CODES = "backup_codes",// Pre-generated backup codes
    PHONE_CALL = "phone_call",// Voice call verification
    RECOVERY_CODE = "recovery_code",// Recovery codes for account recovery
    SMART_CARD = "smart_card"
}
export declare enum TOTPAlgorithm {
    SHA1 = "SHA1",
    SHA256 = "SHA256",
    SHA512 = "SHA512"
}
export declare enum BiometricType {
    FINGERPRINT = "fingerprint",
    FACE_RECOGNITION = "face_recognition",
    VOICE_RECOGNITION = "voice_recognition",
    IRIS_SCAN = "iris_scan",
    RETINA_SCAN = "retina_scan"
}
export declare enum TrustLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERIFIED = "verified"
}
export declare enum ChallengeType {
    TOTP_CODE = "totp_code",
    SMS_CODE = "sms_code",
    EMAIL_CODE = "email_code",
    PUSH_NOTIFICATION = "push_notification",
    BIOMETRIC_SCAN = "biometric_scan",
    HARDWARE_TOKEN = "hardware_token",
    BACKUP_CODE = "backup_code",
    VOICE_CHALLENGE = "voice_challenge"
}
export declare enum MFAAction {
    SETUP = "setup",
    ENABLE = "enable",
    DISABLE = "disable",
    VERIFY = "verify",
    CHALLENGE_SENT = "challenge_sent",
    CHALLENGE_COMPLETED = "challenge_completed",
    CHALLENGE_FAILED = "challenge_failed",
    BACKUP_CODES_GENERATED = "backup_codes_generated",
    BACKUP_CODE_USED = "backup_code_used",
    METHOD_ADDED = "method_added",
    METHOD_REMOVED = "method_removed",
    SETTINGS_UPDATED = "settings_updated"
}
export declare class MFAManagementService extends EventEmitter {
    private mfaConfigurations;
    private activeChallenges;
    private trustedDevices;
    private totpSecrets;
    constructor();
    getMFAConfiguration(userId: string): Promise<MFAConfiguration | null>;
    initializeMFAConfiguration(userId: string, tenantId: string): Promise<MFAConfiguration>;
    setupMFAMethod(setupRequest: MFASetupRequest, ipAddress: string, userAgent: string): Promise<{
        method: MFAMethod;
        setupData?: any;
    }>;
    verifyMFAMethodSetup(userId: string, methodId: string, verificationCode: string, ipAddress: string, userAgent: string): Promise<boolean>;
    createMFAChallenge(userId: string, methodId?: string, challengeType?: ChallengeType, ipAddress?: string, userAgent?: string): Promise<MFAChallenge>;
    verifyMFAChallenge(request: MFAVerificationRequest): Promise<{
        success: boolean;
        trusted?: boolean;
        challengeId: string;
    }>;
    generateBackupCodes(userId: string, count?: number, length?: number): Promise<MFABackupCodeGeneration>;
    removeMFAMethod(userId: string, methodId: string, ipAddress: string, userAgent: string): Promise<boolean>;
    updateMFASettings(userId: string, settings: Partial<MFASettings>, ipAddress: string, userAgent: string): Promise<MFAConfiguration | null>;
    isDeviceTrusted(userId: string, deviceId: string): Promise<boolean>;
    private setupTOTPMethod;
    private setupSMSMethod;
    private setupEmailMethod;
    private setupHardwareTokenMethod;
    private setupBiometricMethod;
    private setupBackupCodesMethod;
    private generateChallenge;
    private verifyMethodCode;
    private verifyTOTPCode;
    private verifyBackupCode;
    private findMethod;
    private getActiveMethods;
    private getChallengeTypeForMethod;
    private getDefaultMethodName;
    private calculateMethodExpiry;
    private calculateChallengeRiskScore;
    private trustDevice;
    private generateTOTPSecret;
    private generateTOTPCode;
    private generateQRCode;
    private generateNumericCode;
    private generateBackupCode;
    private encryptSecret;
    private encryptCode;
    private hashCode;
    private hashResponse;
    private sendSMSChallenge;
    private sendEmailChallenge;
    private sendPushChallenge;
    private addAuditEntry;
    private startChallengeCleanup;
}

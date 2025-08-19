import { EventEmitter } from 'events';
export interface PasswordPolicy {
    id: string;
    tenantId: string;
    name: string;
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
    historyCount: number;
    lockoutThreshold: number;
    lockoutDuration: number;
    complexityScore: number;
    forbiddenPatterns: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PasswordResetRequest {
    id: string;
    userId: string;
    tenantId: string;
    email: string;
    token: string;
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
    usedAt?: Date;
    ipAddress: string;
    userAgent: string;
    status: ResetStatus;
    attempts: number;
    maxAttempts: number;
    verificationMethod: VerificationMethod;
    metadata: Record<string, any>;
}
export interface SecuritySettings {
    id: string;
    userId: string;
    tenantId: string;
    passwordSettings: PasswordSettings;
    sessionSettings: SessionSettings;
    loginSettings: LoginSettings;
    securityQuestions: SecurityQuestion[];
    trustedDevices: TrustedDevice[];
    apiKeys: APIKey[];
    webhooks: WebhookSettings[];
    auditSettings: AuditSettings;
    lastUpdated: Date;
    version: number;
}
export interface PasswordSettings {
    lastChanged: Date;
    nextExpiryDate?: Date;
    changeRequired: boolean;
    strengthScore: number;
    history: PasswordHistoryEntry[];
    recoveryOptions: RecoveryOption[];
    customPolicy?: Partial<PasswordPolicy>;
}
export interface SessionSettings {
    maxSessions: number;
    sessionTimeout: number;
    idleTimeout: number;
    rememberMe: boolean;
    rememberMeDuration: number;
    requireReauthentication: boolean;
    reauthenticationTimeout: number;
    terminateOnPasswordChange: boolean;
    allowConcurrentSessions: boolean;
    deviceBinding: boolean;
}
export interface LoginSettings {
    allowedLoginMethods: LoginMethod[];
    restrictedIPs: string[];
    allowedIPs: string[];
    geolocationRestrictions: GeolocationRestriction[];
    timeRestrictions: TimeRestriction[];
    deviceRestrictions: DeviceRestriction[];
    riskBasedAuthentication: boolean;
    adaptiveAuthentication: boolean;
    stepUpAuthentication: StepUpSettings;
}
export interface SecurityQuestion {
    id: string;
    question: string;
    answerHash: string;
    createdAt: Date;
    isActive: boolean;
    usageCount: number;
    lastUsed?: Date;
}
export interface TrustedDevice {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: DeviceType;
    fingerprint: string;
    ipAddress: string;
    location: GeolocationInfo;
    firstSeen: Date;
    lastSeen: Date;
    trustLevel: TrustLevel;
    isActive: boolean;
    expiresAt?: Date;
    metadata: Record<string, any>;
}
export interface APIKey {
    id: string;
    name: string;
    keyHash: string;
    permissions: string[];
    scopes: string[];
    lastUsed?: Date;
    usageCount: number;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    restrictions: APIKeyRestriction[];
}
export interface WebhookSettings {
    id: string;
    name: string;
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
    retryPolicy: RetryPolicy;
    headers: Record<string, string>;
    createdAt: Date;
    lastTriggered?: Date;
    successCount: number;
    failureCount: number;
}
export interface AuditSettings {
    logSuccessfulLogins: boolean;
    logFailedLogins: boolean;
    logPasswordChanges: boolean;
    logSecurityChanges: boolean;
    logDataAccess: boolean;
    retentionPeriod: number;
    alertOnSuspiciousActivity: boolean;
    alertThresholds: AlertThreshold[];
}
export interface PasswordHistoryEntry {
    passwordHash: string;
    createdAt: Date;
    strength: number;
    isCompromised: boolean;
}
export interface RecoveryOption {
    type: RecoveryType;
    value: string;
    isVerified: boolean;
    verifiedAt?: Date;
    isActive: boolean;
    priority: number;
}
export interface GeolocationRestriction {
    type: 'allow' | 'deny';
    countries: string[];
    regions: string[];
    cities: string[];
    coordinates?: {
        latitude: number;
        longitude: number;
        radius: number;
    };
}
export interface TimeRestriction {
    timezone: string;
    allowedDays: number[];
    allowedHours: {
        start: string;
        end: string;
    }[];
    blackoutPeriods: Array<{
        start: Date;
        end: Date;
        reason: string;
    }>;
}
export interface DeviceRestriction {
    allowedDeviceTypes: DeviceType[];
    blockedDeviceTypes: DeviceType[];
    requireTrustedDevice: boolean;
    maxDevicesPerUser: number;
    deviceRegistrationRequired: boolean;
}
export interface StepUpSettings {
    enabled: boolean;
    triggers: StepUpTrigger[];
    methods: StepUpMethod[];
    gracePeriod: number;
    maxGracePeriod: number;
}
export interface GeolocationInfo {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
}
export interface APIKeyRestriction {
    type: RestrictionType;
    value: string;
    description: string;
}
export interface RetryPolicy {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffDelay: number;
    retryableStatusCodes: number[];
}
export interface AlertThreshold {
    event: string;
    count: number;
    timeWindow: number;
    action: AlertAction;
}
export interface PasswordChangeRequest {
    userId: string;
    currentPassword: string;
    newPassword: string;
    reason?: string;
    bypassPolicy?: boolean;
    requireReauthentication?: boolean;
}
export interface PasswordValidationResult {
    isValid: boolean;
    score: number;
    errors: PasswordValidationError[];
    warnings: PasswordValidationWarning[];
    suggestions: string[];
    estimatedCrackTime: string;
}
export interface PasswordValidationError {
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}
export interface PasswordValidationWarning {
    code: string;
    message: string;
    recommendation: string;
}
export interface SecurityAuditEntry {
    id: string;
    userId: string;
    tenantId: string;
    timestamp: Date;
    action: SecurityAction;
    category: SecurityCategory;
    severity: SecuritySeverity;
    ipAddress: string;
    userAgent: string;
    location?: GeolocationInfo;
    details: Record<string, any>;
    riskScore: number;
    status: AuditStatus;
}
export declare enum ResetStatus {
    PENDING = "pending",
    SENT = "sent",
    USED = "used",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare enum VerificationMethod {
    EMAIL = "email",
    SMS = "sms",
    SECURITY_QUESTIONS = "security_questions",
    RECOVERY_CODE = "recovery_code",
    ADMIN_RESET = "admin_reset"
}
export declare enum LoginMethod {
    PASSWORD = "password",
    SSO = "sso",
    MFA = "mfa",
    BIOMETRIC = "biometric",
    API_KEY = "api_key"
}
export declare enum DeviceType {
    DESKTOP = "desktop",
    MOBILE = "mobile",
    TABLET = "tablet",
    SERVER = "server",
    IOT = "iot",
    UNKNOWN = "unknown"
}
export declare enum TrustLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERIFIED = "verified"
}
export declare enum RecoveryType {
    EMAIL = "email",
    PHONE = "phone",
    BACKUP_CODE = "backup_code",
    HARDWARE_TOKEN = "hardware_token"
}
export declare enum RestrictionType {
    IP_ADDRESS = "ip_address",
    COUNTRY = "country",
    TIME_WINDOW = "time_window",
    RATE_LIMIT = "rate_limit"
}
export declare enum StepUpTrigger {
    HIGH_VALUE_TRANSACTION = "high_value_transaction",
    SENSITIVE_DATA_ACCESS = "sensitive_data_access",
    ADMIN_ACTION = "admin_action",
    UNUSUAL_LOCATION = "unusual_location",
    NEW_DEVICE = "new_device",
    TIME_BASED = "time_based"
}
export declare enum StepUpMethod {
    MFA = "mfa",
    SECURITY_QUESTIONS = "security_questions",
    BIOMETRIC = "biometric",
    HARDWARE_TOKEN = "hardware_token"
}
export declare enum AlertAction {
    LOG = "log",
    EMAIL = "email",
    SMS = "sms",
    WEBHOOK = "webhook",
    BLOCK = "block",
    ESCALATE = "escalate"
}
export declare enum SecurityAction {
    LOGIN = "login",
    LOGOUT = "logout",
    PASSWORD_CHANGE = "password_change",
    PASSWORD_RESET = "password_reset",
    MFA_SETUP = "mfa_setup",
    MFA_DISABLE = "mfa_disable",
    DEVICE_TRUST = "device_trust",
    API_KEY_CREATE = "api_key_create",
    API_KEY_REVOKE = "api_key_revoke",
    SECURITY_SETTING_CHANGE = "security_setting_change"
}
export declare enum SecurityCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    DATA_ACCESS = "data_access",
    CONFIGURATION = "configuration",
    DEVICE_MANAGEMENT = "device_management"
}
export declare enum SecuritySeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum AuditStatus {
    SUCCESS = "success",
    FAILURE = "failure",
    SUSPICIOUS = "suspicious",
    BLOCKED = "blocked"
}
export declare class PasswordSecurityService extends EventEmitter {
    private passwordPolicies;
    private resetRequests;
    private securitySettings;
    private securityAudit;
    private compromisedPasswords;
    constructor();
    createPasswordResetRequest(userId: string, tenantId: string, email: string, ipAddress: string, userAgent: string, verificationMethod?: VerificationMethod): Promise<PasswordResetRequest>;
    validateResetToken(token: string): Promise<PasswordResetRequest | null>;
    resetPassword(token: string, newPassword: string, ipAddress: string, userAgent: string): Promise<boolean>;
    changePassword(changeRequest: PasswordChangeRequest, ipAddress: string, userAgent: string): Promise<boolean>;
    validatePassword(password: string, userId: string, policy?: PasswordPolicy): Promise<PasswordValidationResult>;
    getSecuritySettings(userId: string): Promise<SecuritySettings | null>;
    updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>, updatedBy: string, ipAddress: string, userAgent: string): Promise<SecuritySettings | null>;
    addTrustedDevice(userId: string, deviceInfo: Omit<TrustedDevice, 'id' | 'firstSeen' | 'lastSeen' | 'isActive' | 'usageCount'>): Promise<TrustedDevice>;
    revokeTrustedDevice(userId: string, deviceId: string, ipAddress: string, userAgent: string): Promise<boolean>;
    getSecurityAuditLog(userId: string, filter?: {
        action?: SecurityAction;
        category?: SecurityCategory;
        severity?: SecuritySeverity;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<SecurityAuditEntry[]>;
    private getPasswordPolicy;
    private generateSecureToken;
    private hashToken;
    private hashPassword;
    private verifyCurrentPassword;
    private updateUserPassword;
    private calculateNextExpiryDate;
    private calculatePasswordStrength;
    private estimateCrackTime;
    private addSecurityAuditEntry;
    private initializeDefaultPolicies;
    private loadCompromisedPasswords;
    private startCleanupScheduler;
}

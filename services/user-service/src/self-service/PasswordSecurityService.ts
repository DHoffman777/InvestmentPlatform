import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

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
  maxAge: number; // in days
  historyCount: number; // number of previous passwords to remember
  lockoutThreshold: number;
  lockoutDuration: number; // in minutes
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
  sessionTimeout: number; // in minutes
  idleTimeout: number; // in minutes
  rememberMe: boolean;
  rememberMeDuration: number; // in days
  requireReauthentication: boolean;
  reauthenticationTimeout: number; // in minutes
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
  retentionPeriod: number; // in days
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
  value: string; // encrypted
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
  allowedDays: number[]; // 0-6, Sunday=0
  allowedHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
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
  gracePeriod: number; // in minutes
  maxGracePeriod: number; // in minutes
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
  timeWindow: number; // in minutes
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

// Enums
export enum ResetStatus {
  PENDING = 'pending',
  SENT = 'sent',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum VerificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  SECURITY_QUESTIONS = 'security_questions',
  RECOVERY_CODE = 'recovery_code',
  ADMIN_RESET = 'admin_reset'
}

export enum LoginMethod {
  PASSWORD = 'password',
  SSO = 'sso',
  MFA = 'mfa',
  BIOMETRIC = 'biometric',
  API_KEY = 'api_key'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  SERVER = 'server',
  IOT = 'iot',
  UNKNOWN = 'unknown'
}

export enum TrustLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERIFIED = 'verified'
}

export enum RecoveryType {
  EMAIL = 'email',
  PHONE = 'phone',
  BACKUP_CODE = 'backup_code',
  HARDWARE_TOKEN = 'hardware_token'
}

export enum RestrictionType {
  IP_ADDRESS = 'ip_address',
  COUNTRY = 'country',
  TIME_WINDOW = 'time_window',
  RATE_LIMIT = 'rate_limit'
}

export enum StepUpTrigger {
  HIGH_VALUE_TRANSACTION = 'high_value_transaction',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  ADMIN_ACTION = 'admin_action',
  UNUSUAL_LOCATION = 'unusual_location',
  NEW_DEVICE = 'new_device',
  TIME_BASED = 'time_based'
}

export enum StepUpMethod {
  MFA = 'mfa',
  SECURITY_QUESTIONS = 'security_questions',
  BIOMETRIC = 'biometric',
  HARDWARE_TOKEN = 'hardware_token'
}

export enum AlertAction {
  LOG = 'log',
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  BLOCK = 'block',
  ESCALATE = 'escalate'
}

export enum SecurityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  MFA_SETUP = 'mfa_setup',
  MFA_DISABLE = 'mfa_disable',
  DEVICE_TRUST = 'device_trust',
  API_KEY_CREATE = 'api_key_create',
  API_KEY_REVOKE = 'api_key_revoke',
  SECURITY_SETTING_CHANGE = 'security_setting_change'
}

export enum SecurityCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  CONFIGURATION = 'configuration',
  DEVICE_MANAGEMENT = 'device_management'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  SUSPICIOUS = 'suspicious',
  BLOCKED = 'blocked'
}

export class PasswordSecurityService extends EventEmitter {
  private passwordPolicies: Map<string, PasswordPolicy> = new Map();
  private resetRequests: Map<string, PasswordResetRequest> = new Map();
  private securitySettings: Map<string, SecuritySettings> = new Map();
  private securityAudit: Map<string, SecurityAuditEntry[]> = new Map();
  private compromisedPasswords: Set<string> = new Set();

  constructor() {
    super();
    this.initializeDefaultPolicies();
    this.loadCompromisedPasswords();
    this.startCleanupScheduler();
  }

  public async createPasswordResetRequest(
    userId: string,
    tenantId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    verificationMethod: VerificationMethod = VerificationMethod.EMAIL
  ): Promise<PasswordResetRequest> {
    // Check for existing active requests
    const existingRequest = Array.from(this.resetRequests.values())
      .find(req => req.userId === userId && req.status === ResetStatus.PENDING);
    
    if (existingRequest) {
      throw new Error('Password reset request already pending');
    }

    // Generate secure token
    const token = this.generateSecureToken();
    const tokenHash = this.hashToken(token);

    const resetRequest: PasswordResetRequest = {
      id: randomUUID(),
      userId,
      tenantId,
      email,
      token,
      tokenHash,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ipAddress,
      userAgent,
      status: ResetStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      verificationMethod,
      metadata: {}
    };

    this.resetRequests.set(resetRequest.id, resetRequest);

    this.addSecurityAuditEntry(
      userId,
      tenantId,
      SecurityAction.PASSWORD_RESET,
      SecurityCategory.AUTHENTICATION,
      SecuritySeverity.MEDIUM,
      ipAddress,
      userAgent,
      { requestId: resetRequest.id, method: verificationMethod },
      50,
      AuditStatus.SUCCESS
    );

    this.emit('passwordResetRequested', resetRequest);
    return resetRequest;
  }

  public async validateResetToken(token: string): Promise<PasswordResetRequest | null> {
    const tokenHash = this.hashToken(token);
    const request = Array.from(this.resetRequests.values())
      .find(req => req.tokenHash === tokenHash && req.status === ResetStatus.PENDING);

    if (!request) return null;

    if (request.expiresAt < new Date()) {
      request.status = ResetStatus.EXPIRED;
      return null;
    }

    return request;
  }

  public async resetPassword(
    token: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const request = await this.validateResetToken(token);
    if (!request) return false;

    request.attempts++;

    if (request.attempts > request.maxAttempts) {
      request.status = ResetStatus.EXPIRED;
      return false;
    }

    // Validate new password
    const policy = this.getPasswordPolicy(request.tenantId);
    const validation = await this.validatePassword(newPassword, request.userId, policy);
    
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Update password (would integrate with auth service)
    await this.updateUserPassword(request.userId, newPassword);

    // Mark request as used
    request.status = ResetStatus.USED;
    request.usedAt = new Date();

    this.addSecurityAuditEntry(
      request.userId,
      request.tenantId,
      SecurityAction.PASSWORD_RESET,
      SecurityCategory.AUTHENTICATION,
      SecuritySeverity.HIGH,
      ipAddress,
      userAgent,
      { requestId: request.id, success: true },
      25,
      AuditStatus.SUCCESS
    );

    this.emit('passwordReset', { userId: request.userId, requestId: request.id });
    return true;
  }

  public async changePassword(changeRequest: PasswordChangeRequest, ipAddress: string, userAgent: string): Promise<boolean> {
    const { userId, currentPassword, newPassword, reason, bypassPolicy = false } = changeRequest;

    // Verify current password (would integrate with auth service)
    const isCurrentPasswordValid = await this.verifyCurrentPassword(userId, currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Get user's tenant for policy
    const settings = await this.getSecuritySettings(userId);
    const tenantId = settings?.tenantId || 'default';
    
    if (!bypassPolicy) {
      const policy = this.getPasswordPolicy(tenantId);
      const validation = await this.validatePassword(newPassword, userId, policy);
      
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    // Update password
    await this.updateUserPassword(userId, newPassword);

    // Update security settings
    if (settings) {
      settings.passwordSettings.lastChanged = new Date();
      settings.passwordSettings.changeRequired = false;
      settings.passwordSettings.nextExpiryDate = this.calculateNextExpiryDate(tenantId);
      
      // Add to password history
      settings.passwordSettings.history.unshift({
        passwordHash: this.hashPassword(newPassword),
        createdAt: new Date(),
        strength: await this.calculatePasswordStrength(newPassword),
        isCompromised: this.compromisedPasswords.has(newPassword)
      });

      // Limit history size
      const policy = this.getPasswordPolicy(tenantId);
      if (settings.passwordSettings.history.length > policy.historyCount) {
        settings.passwordSettings.history = settings.passwordSettings.history.slice(0, policy.historyCount);
      }

      settings.lastUpdated = new Date();
      settings.version++;
    }

    this.addSecurityAuditEntry(
      userId,
      tenantId,
      SecurityAction.PASSWORD_CHANGE,
      SecurityCategory.AUTHENTICATION,
      SecuritySeverity.MEDIUM,
      ipAddress,
      userAgent,
      { reason, bypassPolicy },
      30,
      AuditStatus.SUCCESS
    );

    this.emit('passwordChanged', { userId, reason });
    return true;
  }

  public async validatePassword(password: string, userId: string, policy?: PasswordPolicy): Promise<PasswordValidationResult> {
    const result: PasswordValidationResult = {
      isValid: true,
      score: 0,
      errors: [],
      warnings: [],
      suggestions: [],
      estimatedCrackTime: ''
    };

    const effectivePolicy = policy || this.getPasswordPolicy('default');

    // Length validation
    if (password.length < effectivePolicy.minLength) {
      result.errors.push({
        code: 'MIN_LENGTH',
        message: `Password must be at least ${effectivePolicy.minLength} characters long`,
        severity: 'error'
      });
      result.isValid = false;
    }

    if (password.length > effectivePolicy.maxLength) {
      result.errors.push({
        code: 'MAX_LENGTH',
        message: `Password must not exceed ${effectivePolicy.maxLength} characters`,
        severity: 'error'
      });
      result.isValid = false;
    }

    // Character requirements
    if (effectivePolicy.requireUppercase && !/[A-Z]/.test(password)) {
      result.errors.push({
        code: 'UPPERCASE_REQUIRED',
        message: 'Password must contain at least one uppercase letter',
        severity: 'error'
      });
      result.isValid = false;
    }

    if (effectivePolicy.requireLowercase && !/[a-z]/.test(password)) {
      result.errors.push({
        code: 'LOWERCASE_REQUIRED',
        message: 'Password must contain at least one lowercase letter',
        severity: 'error'
      });
      result.isValid = false;
    }

    if (effectivePolicy.requireNumbers && !/\d/.test(password)) {
      result.errors.push({
        code: 'NUMBER_REQUIRED',
        message: 'Password must contain at least one number',
        severity: 'error'
      });
      result.isValid = false;
    }

    if (effectivePolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.errors.push({
        code: 'SPECIAL_CHAR_REQUIRED',
        message: 'Password must contain at least one special character',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Check forbidden patterns
    for (const pattern of effectivePolicy.forbiddenPatterns) {
      if (new RegExp(pattern, 'i').test(password)) {
        result.errors.push({
          code: 'FORBIDDEN_PATTERN',
          message: 'Password contains a forbidden pattern',
          severity: 'error'
        });
        result.isValid = false;
      }
    }

    // Check against compromised passwords
    if (this.compromisedPasswords.has(password)) {
      result.errors.push({
        code: 'COMPROMISED',
        message: 'This password has been found in data breaches and cannot be used',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Check password history
    const settings = await this.getSecuritySettings(userId);
    if (settings) {
      const passwordHash = this.hashPassword(password);
      const inHistory = settings.passwordSettings.history.some(entry => entry.passwordHash === passwordHash);
      if (inHistory) {
        result.errors.push({
          code: 'REUSED_PASSWORD',
          message: 'Password has been used recently and cannot be reused',
          severity: 'error'
        });
        result.isValid = false;
      }
    }

    // Calculate strength score and crack time
    result.score = await this.calculatePasswordStrength(password);
    result.estimatedCrackTime = this.estimateCrackTime(password);

    // Add suggestions
    if (result.score < 70) {
      result.suggestions.push('Consider using a longer password');
      result.suggestions.push('Mix uppercase and lowercase letters');
      result.suggestions.push('Include numbers and special characters');
      result.suggestions.push('Avoid common words and patterns');
    }

    return result;
  }

  public async getSecuritySettings(userId: string): Promise<SecuritySettings | null> {
    return Array.from(this.securitySettings.values())
      .find(settings => settings.userId === userId) || null;
  }

  public async updateSecuritySettings(
    userId: string,
    updates: Partial<SecuritySettings>,
    updatedBy: string,
    ipAddress: string,
    userAgent: string
  ): Promise<SecuritySettings | null> {
    const existing = await this.getSecuritySettings(userId);
    if (!existing) return null;

    const updatedSettings = {
      ...existing,
      ...updates,
      lastUpdated: new Date(),
      version: existing.version + 1
    };

    this.securitySettings.set(existing.id, updatedSettings);

    this.addSecurityAuditEntry(
      userId,
      existing.tenantId,
      SecurityAction.SECURITY_SETTING_CHANGE,
      SecurityCategory.CONFIGURATION,
      SecuritySeverity.MEDIUM,
      ipAddress,
      userAgent,
      { changes: Object.keys(updates), updatedBy },
      40,
      AuditStatus.SUCCESS
    );

    this.emit('securitySettingsUpdated', updatedSettings);
    return updatedSettings;
  }

  public async addTrustedDevice(
    userId: string,
    deviceInfo: Omit<TrustedDevice, 'id' | 'firstSeen' | 'lastSeen' | 'isActive' | 'usageCount'>
  ): Promise<TrustedDevice> {
    const settings = await this.getSecuritySettings(userId);
    if (!settings) {
      throw new Error('User security settings not found');
    }

    const trustedDevice: TrustedDevice = {
      id: randomUUID(),
      firstSeen: new Date(),
      lastSeen: new Date(),
      isActive: true,
      ...deviceInfo
    };

    settings.trustedDevices.push(trustedDevice);
    settings.lastUpdated = new Date();
    settings.version++;

    this.addSecurityAuditEntry(
      userId,
      settings.tenantId,
      SecurityAction.DEVICE_TRUST,
      SecurityCategory.DEVICE_MANAGEMENT,
      SecuritySeverity.MEDIUM,
      deviceInfo.ipAddress,
      'unknown',
      { deviceId: trustedDevice.deviceId, deviceName: trustedDevice.deviceName },
      35,
      AuditStatus.SUCCESS
    );

    this.emit('trustedDeviceAdded', { userId, device: trustedDevice });
    return trustedDevice;
  }

  public async revokeTrustedDevice(userId: string, deviceId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const settings = await this.getSecuritySettings(userId);
    if (!settings) return false;

    const deviceIndex = settings.trustedDevices.findIndex(device => device.id === deviceId);
    if (deviceIndex === -1) return false;

    const device = settings.trustedDevices[deviceIndex];
    device.isActive = false;
    settings.lastUpdated = new Date();
    settings.version++;

    this.addSecurityAuditEntry(
      userId,
      settings.tenantId,
      SecurityAction.DEVICE_TRUST,
      SecurityCategory.DEVICE_MANAGEMENT,
      SecuritySeverity.HIGH,
      ipAddress,
      userAgent,
      { deviceId: device.deviceId, action: 'revoked' },
      60,
      AuditStatus.SUCCESS
    );

    this.emit('trustedDeviceRevoked', { userId, deviceId });
    return true;
  }

  public async getSecurityAuditLog(
    userId: string,
    filter: {
      action?: SecurityAction;
      category?: SecurityCategory;
      severity?: SecuritySeverity;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<SecurityAuditEntry[]> {
    let entries = this.securityAudit.get(userId) || [];

    if (filter.action) {
      entries = entries.filter(entry => entry.action === filter.action);
    }

    if (filter.category) {
      entries = entries.filter(entry => entry.category === filter.category);
    }

    if (filter.severity) {
      entries = entries.filter(entry => entry.severity === filter.severity);
    }

    if (filter.startDate) {
      entries = entries.filter(entry => entry.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      entries = entries.filter(entry => entry.timestamp <= filter.endDate!);
    }

    entries = entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries;
  }

  private getPasswordPolicy(tenantId: string): PasswordPolicy {
    return this.passwordPolicies.get(tenantId) || this.passwordPolicies.get('default')!;
  }

  private generateSecureToken(): string {
    return randomUUID() + randomUUID().replace(/-/g, '');
  }

  private hashToken(token: string): string {
    // Placeholder - would use actual cryptographic hashing
    return `hash_${token.length}_${randomUUID()}`;
  }

  private hashPassword(password: string): string {
    // Placeholder - would use bcrypt or similar
    return `bcrypt_${password.length}_${randomUUID()}`;
  }

  private async verifyCurrentPassword(userId: string, password: string): Promise<boolean> {
    // Placeholder - would integrate with auth service
    return password.length > 0;
  }

  private async updateUserPassword(userId: string, password: string): Promise<void> {
    // Placeholder - would integrate with auth service
    console.log(`Password updated for user ${userId}`);
  }

  private calculateNextExpiryDate(tenantId: string): Date {
    const policy = this.getPasswordPolicy(tenantId);
    return new Date(Date.now() + policy.maxAge * 24 * 60 * 60 * 1000);
  }

  private async calculatePasswordStrength(password: string): Promise<number> {
    let score = 0;
    
    // Length score
    score += Math.min(password.length * 2, 25);
    
    // Character variety
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 15; // Common sequences
    
    return Math.max(0, Math.min(100, score));
  }

  private estimateCrackTime(password: string): string {
    const score = this.calculatePasswordStrength(password);
    
    if (score >= 90) return 'centuries';
    if (score >= 80) return 'decades';
    if (score >= 70) return 'years';
    if (score >= 60) return 'months';
    if (score >= 50) return 'weeks';
    if (score >= 40) return 'days';
    if (score >= 30) return 'hours';
    return 'minutes';
  }

  private addSecurityAuditEntry(
    userId: string,
    tenantId: string,
    action: SecurityAction,
    category: SecurityCategory,
    severity: SecuritySeverity,
    ipAddress: string,
    userAgent: string,
    details: Record<string, any>,
    riskScore: number,
    status: AuditStatus
  ): void {
    const entry: SecurityAuditEntry = {
      id: randomUUID(),
      userId,
      tenantId,
      timestamp: new Date(),
      action,
      category,
      severity,
      ipAddress,
      userAgent,
      details,
      riskScore,
      status
    };

    if (!this.securityAudit.has(userId)) {
      this.securityAudit.set(userId, []);
    }

    this.securityAudit.get(userId)!.push(entry);
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicy: PasswordPolicy = {
      id: randomUUID(),
      tenantId: 'default',
      name: 'Default Password Policy',
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      historyCount: 5,
      lockoutThreshold: 5,
      lockoutDuration: 30,
      complexityScore: 70,
      forbiddenPatterns: ['password', '123456', 'qwerty', 'admin'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.passwordPolicies.set('default', defaultPolicy);
  }

  private loadCompromisedPasswords(): void {
    // Placeholder - would load from breach database
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
    ];
    
    commonPasswords.forEach(pwd => this.compromisedPasswords.add(pwd));
  }

  private startCleanupScheduler(): void {
    // Clean up expired reset requests every hour
    setInterval(() => {
      const now = new Date();
      for (const [id, request] of this.resetRequests.entries()) {
        if (request.expiresAt < now && request.status === ResetStatus.PENDING) {
          request.status = ResetStatus.EXPIRED;
        }
      }
    }, 60 * 60 * 1000);
  }
}
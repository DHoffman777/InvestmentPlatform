import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface MFAConfiguration {
  id: string;
  userId: string;
  tenantId: string;
  isEnabled: boolean;
  primaryMethod: MFAMethod;
  backupMethods: MFAMethod[];
  allowedMethods: MFAMethodType[];
  requiredMethods: MFAMethodType[];
  gracePeriod: number; // in days
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
  // TOTP Settings
  secret?: string; // encrypted
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
  
  // SMS Settings
  phoneNumber?: string; // encrypted
  countryCode?: string;
  carrier?: string;
  
  // Email Settings
  emailAddress?: string; // encrypted
  
  // Hardware Token Settings
  serialNumber?: string;
  tokenType?: string;
  
  // Biometric Settings
  biometricType?: BiometricType;
  templateId?: string;
  
  // Push Notification Settings
  deviceId?: string;
  appId?: string;
  
  // Backup Code Settings
  codeCount?: number;
  codeLength?: number;
  
  // Recovery Settings
  recoveryEmail?: string;
  recoveryPhone?: string;
}

export interface MFASettings {
  requireForLogin: boolean;
  requireForSensitiveActions: boolean;
  requireForAPIAccess: boolean;
  allowTrustedDevices: boolean;
  trustedDeviceDuration: number; // in days
  maxFailureAttempts: number;
  lockoutDuration: number; // in minutes
  challengeTimeout: number; // in seconds
  allowBackupMethods: boolean;
  rememberDeviceDuration: number; // in days
  adaptiveAuthentication: boolean;
  riskBasedChallenges: boolean;
}

export interface BypassCode {
  id: string;
  code: string; // encrypted
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
  challenge: string; // encrypted
  expectedResponse?: string; // encrypted
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
  response: string; // encrypted
  isSuccessful: boolean;
  failureReason?: string;
  ipAddress: string;
  userAgent: string;
  timeTaken: number; // in milliseconds
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

// Enums
export enum MFAMethodType {
  TOTP = 'totp',                    // Time-based OTP (Google Authenticator, Authy)
  SMS = 'sms',                      // SMS verification
  EMAIL = 'email',                  // Email verification
  HARDWARE_TOKEN = 'hardware_token', // Hardware security keys (YubiKey)
  BIOMETRIC = 'biometric',          // Fingerprint, face recognition
  PUSH_NOTIFICATION = 'push',       // Push notification to mobile app
  BACKUP_CODES = 'backup_codes',    // Pre-generated backup codes
  PHONE_CALL = 'phone_call',        // Voice call verification
  RECOVERY_CODE = 'recovery_code',   // Recovery codes for account recovery
  SMART_CARD = 'smart_card'         // Smart card authentication
}

export enum TOTPAlgorithm {
  SHA1 = 'SHA1',
  SHA256 = 'SHA256',
  SHA512 = 'SHA512'
}

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE_RECOGNITION = 'face_recognition',
  VOICE_RECOGNITION = 'voice_recognition',
  IRIS_SCAN = 'iris_scan',
  RETINA_SCAN = 'retina_scan'
}

export enum TrustLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERIFIED = 'verified'
}

export enum ChallengeType {
  TOTP_CODE = 'totp_code',
  SMS_CODE = 'sms_code',
  EMAIL_CODE = 'email_code',
  PUSH_NOTIFICATION = 'push_notification',
  BIOMETRIC_SCAN = 'biometric_scan',
  HARDWARE_TOKEN = 'hardware_token',
  BACKUP_CODE = 'backup_code',
  VOICE_CHALLENGE = 'voice_challenge'
}

export enum MFAAction {
  SETUP = 'setup',
  ENABLE = 'enable',
  DISABLE = 'disable',
  VERIFY = 'verify',
  CHALLENGE_SENT = 'challenge_sent',
  CHALLENGE_COMPLETED = 'challenge_completed',
  CHALLENGE_FAILED = 'challenge_failed',
  BACKUP_CODES_GENERATED = 'backup_codes_generated',
  BACKUP_CODE_USED = 'backup_code_used',
  METHOD_ADDED = 'method_added',
  METHOD_REMOVED = 'method_removed',
  SETTINGS_UPDATED = 'settings_updated'
}

export class MFAManagementService extends EventEmitter {
  private mfaConfigurations: Map<string, MFAConfiguration> = new Map();
  private activeChallenges: Map<string, MFAChallenge> = new Map();
  private trustedDevices: Map<string, Set<string>> = new Map(); // userId -> Set<deviceId>
  private totpSecrets: Map<string, string> = new Map(); // methodId -> secret

  constructor() {
    super();
    this.startChallengeCleanup();
  }

  public async getMFAConfiguration(userId: string): Promise<MFAConfiguration | null> {
    return Array.from(this.mfaConfigurations.values())
      .find(config => config.userId === userId) || null;
  }

  public async initializeMFAConfiguration(userId: string, tenantId: string): Promise<MFAConfiguration> {
    const existingConfig = await this.getMFAConfiguration(userId);
    if (existingConfig) {
      return existingConfig;
    }

    const configuration: MFAConfiguration = {
      id: randomUUID(),
      userId,
      tenantId,
      isEnabled: false,
      primaryMethod: null as any,
      backupMethods: [],
      allowedMethods: Object.values(MFAMethodType),
      requiredMethods: [],
      gracePeriod: 7,
      bypassCodes: [],
      settings: {
        requireForLogin: false,
        requireForSensitiveActions: true,
        requireForAPIAccess: true,
        allowTrustedDevices: true,
        trustedDeviceDuration: 30,
        maxFailureAttempts: 3,
        lockoutDuration: 15,
        challengeTimeout: 300,
        allowBackupMethods: true,
        rememberDeviceDuration: 30,
        adaptiveAuthentication: true,
        riskBasedChallenges: true
      },
      lastUpdated: new Date(),
      version: 1,
      auditTrail: []
    };

    this.mfaConfigurations.set(configuration.id, configuration);
    this.addAuditEntry(configuration, MFAAction.SETUP, undefined, undefined, true, 'unknown', 'unknown', {});

    this.emit('mfaConfigurationInitialized', configuration);
    return configuration;
  }

  public async setupMFAMethod(setupRequest: MFASetupRequest, ipAddress: string, userAgent: string): Promise<{
    method: MFAMethod;
    setupData?: any;
  }> {
    const config = await this.getMFAConfiguration(setupRequest.userId);
    if (!config) {
      throw new Error('MFA configuration not found');
    }

    // Check if method type is allowed
    if (!config.allowedMethods.includes(setupRequest.methodType)) {
      throw new Error(`MFA method ${setupRequest.methodType} is not allowed for this user`);
    }

    const method: MFAMethod = {
      id: randomUUID(),
      type: setupRequest.methodType,
      name: setupRequest.name || this.getDefaultMethodName(setupRequest.methodType),
      isActive: false,
      isPrimary: setupRequest.isPrimary || false,
      isVerified: false,
      settings: setupRequest.settings,
      metadata: {},
      createdAt: new Date(),
      usageCount: 0,
      failureCount: 0,
      trustLevel: TrustLevel.LOW,
      expiresAt: this.calculateMethodExpiry(setupRequest.methodType)
    };

    let setupData: any = {};

    // Handle method-specific setup
    switch (setupRequest.methodType) {
      case MFAMethodType.TOTP:
        setupData = await this.setupTOTPMethod(method);
        break;
        
      case MFAMethodType.SMS:
        setupData = await this.setupSMSMethod(method);
        break;
        
      case MFAMethodType.EMAIL:
        setupData = await this.setupEmailMethod(method);
        break;
        
      case MFAMethodType.HARDWARE_TOKEN:
        setupData = await this.setupHardwareTokenMethod(method);
        break;
        
      case MFAMethodType.BIOMETRIC:
        setupData = await this.setupBiometricMethod(method);
        break;
        
      case MFAMethodType.BACKUP_CODES:
        setupData = await this.setupBackupCodesMethod(method, config);
        break;
        
      default:
        throw new Error(`Unsupported MFA method type: ${setupRequest.methodType}`);
    }

    // Add method to configuration
    if (setupRequest.isPrimary || !config.primaryMethod) {
      // Make this the primary method
      if (config.primaryMethod) {
        config.primaryMethod.isPrimary = false;
        config.backupMethods.push(config.primaryMethod);
      }
      config.primaryMethod = method;
      method.isPrimary = true;
    } else {
      config.backupMethods.push(method);
    }

    config.lastUpdated = new Date();
    config.version++;

    this.addAuditEntry(config, MFAAction.METHOD_ADDED, setupRequest.methodType, method.id, true, ipAddress, userAgent, {
      methodName: method.name,
      isPrimary: method.isPrimary
    });

    this.emit('mfaMethodAdded', { config, method, setupData });
    return { method, setupData };
  }

  public async verifyMFAMethodSetup(
    userId: string,
    methodId: string,
    verificationCode: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const config = await this.getMFAConfiguration(userId);
    if (!config) {
      throw new Error('MFA configuration not found');
    }

    const method = this.findMethod(config, methodId);
    if (!method) {
      throw new Error('MFA method not found');
    }

    if (method.isVerified) {
      throw new Error('MFA method is already verified');
    }

    const isValid = await this.verifyMethodCode(method, verificationCode);
    
    if (isValid) {
      method.isVerified = true;
      method.isActive = true;
      method.trustLevel = TrustLevel.VERIFIED;
      
      // If this was the first method and MFA wasn't enabled, enable it
      if (!config.isEnabled && method.isPrimary) {
        config.isEnabled = true;
      }
      
      config.lastUpdated = new Date();
      config.version++;

      this.addAuditEntry(config, MFAAction.VERIFY, method.type, methodId, true, ipAddress, userAgent, {
        methodName: method.name
      });

      this.emit('mfaMethodVerified', { config, method });
      return true;
    } else {
      method.failureCount++;
      method.lastFailure = new Date();

      this.addAuditEntry(config, MFAAction.VERIFY, method.type, methodId, false, ipAddress, userAgent, {
        methodName: method.name,
        reason: 'Invalid verification code'
      });

      return false;
    }
  }

  public async createMFAChallenge(
    userId: string,
    methodId?: string,
    challengeType?: ChallengeType,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<MFAChallenge> {
    const config = await this.getMFAConfiguration(userId);
    if (!config || !config.isEnabled) {
      throw new Error('MFA is not enabled for this user');
    }

    let method: MFAMethod;
    
    if (methodId) {
      const foundMethod = this.findMethod(config, methodId);
      if (!foundMethod) {
        throw new Error('MFA method not found');
      }
      method = foundMethod;
    } else {
      // Use primary method or first available backup method
      const primaryMethod = config.primaryMethod && config.primaryMethod.isActive 
        ? config.primaryMethod 
        : config.backupMethods.find(m => m.isActive);
      
      if (!primaryMethod) {
        throw new Error('No active MFA method available');
      }
      method = primaryMethod;
    }

    if (!method.isVerified || !method.isActive) {
      throw new Error('Selected MFA method is not active or verified');
    }

    const challenge: MFAChallenge = {
      id: randomUUID(),
      userId,
      tenantId: config.tenantId,
      methodId: method.id,
      challengeType: challengeType || this.getChallengeTypeForMethod(method.type),
      challenge: '',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + config.settings.challengeTimeout * 1000),
      isCompleted: false,
      attempts: [],
      maxAttempts: config.settings.maxFailureAttempts,
      ipAddress,
      userAgent,
      riskScore: await this.calculateChallengeRiskScore(userId, ipAddress, userAgent),
      metadata: {}
    };

    // Generate challenge based on method type
    await this.generateChallenge(challenge, method);

    this.activeChallenges.set(challenge.id, challenge);

    this.addAuditEntry(config, MFAAction.CHALLENGE_SENT, method.type, method.id, true, ipAddress, userAgent, {
      challengeId: challenge.id,
      challengeType: challenge.challengeType
    });

    this.emit('mfaChallengeCreated', challenge);
    return challenge;
  }

  public async verifyMFAChallenge(request: MFAVerificationRequest): Promise<{
    success: boolean;
    trusted?: boolean;
    challengeId: string;
  }> {
    const challenge = this.activeChallenges.get(request.challengeId);
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }

    if (challenge.userId !== request.userId) {
      throw new Error('Challenge does not belong to this user');
    }

    if (challenge.isCompleted) {
      throw new Error('Challenge has already been completed');
    }

    if (challenge.expiresAt < new Date()) {
      throw new Error('Challenge has expired');
    }

    if (challenge.attempts.length >= challenge.maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }

    const config = await this.getMFAConfiguration(request.userId);
    const method = this.findMethod(config!, request.methodId);

    const startTime = Date.now();
    const isValid = await this.verifyMethodCode(method!, request.response, challenge);
    const timeTaken = Date.now() - startTime;

    const attempt: ChallengeAttempt = {
      id: randomUUID(),
      timestamp: new Date(),
      response: this.hashResponse(request.response),
      isSuccessful: isValid,
      failureReason: isValid ? undefined : 'Invalid code',
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      timeTaken
    };

    challenge.attempts.push(attempt);

    if (isValid) {
      challenge.isCompleted = true;
      challenge.completedAt = new Date();
      
      method!.usageCount++;
      method!.lastUsed = new Date();
      method!.failureCount = 0; // Reset failure count on success

      // Handle device trust
      let trusted = false;
      if (request.trustDevice && request.deviceId && config!.settings.allowTrustedDevices) {
        await this.trustDevice(request.userId, request.deviceId);
        trusted = true;
      }

      config!.lastUpdated = new Date();
      config!.version++;

      this.addAuditEntry(config!, MFAAction.CHALLENGE_COMPLETED, method!.type, method!.id, true, request.ipAddress, request.userAgent, {
        challengeId: challenge.id,
        timeTaken,
        trusted
      });

      this.emit('mfaChallengeCompleted', { challenge, method: method!, trusted });
      
      return { success: true, trusted, challengeId: challenge.id };
    } else {
      method!.failureCount++;
      method!.lastFailure = new Date();

      this.addAuditEntry(config!, MFAAction.CHALLENGE_FAILED, method!.type, method!.id, false, request.ipAddress, request.userAgent, {
        challengeId: challenge.id,
        attemptNumber: challenge.attempts.length,
        reason: 'Invalid code'
      });

      this.emit('mfaChallengeFailed', { challenge, method: method! });
      
      return { success: false, challengeId: challenge.id };
    }
  }

  public async generateBackupCodes(userId: string, count: number = 10, length: number = 8): Promise<MFABackupCodeGeneration> {
    const config = await this.getMFAConfiguration(userId);
    if (!config) {
      throw new Error('MFA configuration not found');
    }

    const codes: string[] = [];
    const generation: MFABackupCodeGeneration = {
      codes,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      format: 'alphanumeric',
      length,
      count
    };

    // Generate backup codes
    for (let i = 0; i < count; i++) {
      const code = this.generateBackupCode(length);
      codes.push(code);
      
      const bypassCode: BypassCode = {
        id: randomUUID(),
        code: this.encryptCode(code),
        codeHash: this.hashCode(code),
        isUsed: false,
        createdAt: new Date(),
        expiresAt: generation.expiresAt,
        usageLimit: 1,
        remainingUses: 1,
        description: 'Auto-generated backup code'
      };
      
      config.bypassCodes.push(bypassCode);
    }

    config.lastUpdated = new Date();
    config.version++;

    this.addAuditEntry(config, MFAAction.BACKUP_CODES_GENERATED, undefined, undefined, true, 'unknown', 'unknown', {
      codeCount: count,
      expiresAt: generation.expiresAt
    });

    this.emit('backupCodesGenerated', { config, generation });
    return generation;
  }

  public async removeMFAMethod(userId: string, methodId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const config = await this.getMFAConfiguration(userId);
    if (!config) {
      return false;
    }

    const method = this.findMethod(config, methodId);
    if (!method) {
      return false;
    }

    // Prevent removal of the only method if MFA is required
    const activeMethods = this.getActiveMethods(config);
    if (activeMethods.length === 1 && config.requiredMethods.length > 0) {
      throw new Error('Cannot remove the only active MFA method when MFA is required');
    }

    // Remove the method
    if (method.isPrimary) {
      // Find a backup method to promote to primary
      const newPrimary = config.backupMethods.find(m => m.isActive);
      if (newPrimary) {
        newPrimary.isPrimary = true;
        config.primaryMethod = newPrimary;
        config.backupMethods = config.backupMethods.filter(m => m.id !== newPrimary.id);
      } else {
        config.primaryMethod = null as any;
        config.isEnabled = false; // Disable MFA if no methods remain
      }
    } else {
      config.backupMethods = config.backupMethods.filter(m => m.id !== methodId);
    }

    config.lastUpdated = new Date();
    config.version++;

    this.addAuditEntry(config, MFAAction.METHOD_REMOVED, method.type, methodId, true, ipAddress, userAgent, {
      methodName: method.name,
      wasPrimary: method.isPrimary
    });

    this.emit('mfaMethodRemoved', { config, method });
    return true;
  }

  public async updateMFASettings(
    userId: string,
    settings: Partial<MFASettings>,
    ipAddress: string,
    userAgent: string
  ): Promise<MFAConfiguration | null> {
    const config = await this.getMFAConfiguration(userId);
    if (!config) {
      return null;
    }

    const oldSettings = { ...config.settings };
    config.settings = { ...config.settings, ...settings };
    config.lastUpdated = new Date();
    config.version++;

    this.addAuditEntry(config, MFAAction.SETTINGS_UPDATED, undefined, undefined, true, ipAddress, userAgent, {
      changes: Object.keys(settings),
      oldSettings,
      newSettings: config.settings
    });

    this.emit('mfaSettingsUpdated', config);
    return config;
  }

  public async isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    const trustedDevices = this.trustedDevices.get(userId);
    return trustedDevices ? trustedDevices.has(deviceId) : false;
  }

  private async setupTOTPMethod(method: MFAMethod): Promise<any> {
    const secret = this.generateTOTPSecret();
    method.settings.secret = this.encryptSecret(secret);
    method.settings.algorithm = TOTPAlgorithm.SHA1;
    method.settings.digits = 6;
    method.settings.period = 30;
    
    this.totpSecrets.set(method.id, secret);
    
    return {
      secret,
      qrCode: this.generateQRCode(secret, method.name),
      manualEntryKey: secret
    };
  }

  private async setupSMSMethod(method: MFAMethod): Promise<any> {
    return {
      phoneNumber: method.settings.phoneNumber,
      message: 'SMS method configured successfully'
    };
  }

  private async setupEmailMethod(method: MFAMethod): Promise<any> {
    return {
      emailAddress: method.settings.emailAddress,
      message: 'Email method configured successfully'
    };
  }

  private async setupHardwareTokenMethod(method: MFAMethod): Promise<any> {
    return {
      instructions: 'Please insert your hardware token and follow the device-specific setup instructions'
    };
  }

  private async setupBiometricMethod(method: MFAMethod): Promise<any> {
    return {
      biometricType: method.settings.biometricType,
      instructions: 'Please complete biometric enrollment on your device'
    };
  }

  private async setupBackupCodesMethod(method: MFAMethod, config: MFAConfiguration): Promise<any> {
    const generation = await this.generateBackupCodes(config.userId);
    return {
      codes: generation.codes,
      message: 'Store these backup codes in a secure location'
    };
  }

  private async generateChallenge(challenge: MFAChallenge, method: MFAMethod): Promise<any> {
    switch (method.type) {
      case MFAMethodType.TOTP:
        // TOTP doesn't need a challenge, user generates their own code
        break;
        
      case MFAMethodType.SMS:
        challenge.challenge = this.generateNumericCode(6);
        await this.sendSMSChallenge(method.settings.phoneNumber!, challenge.challenge);
        break;
        
      case MFAMethodType.EMAIL:
        challenge.challenge = this.generateNumericCode(6);
        await this.sendEmailChallenge(method.settings.emailAddress!, challenge.challenge);
        break;
        
      case MFAMethodType.PUSH_NOTIFICATION:
        challenge.challenge = randomUUID();
        await this.sendPushChallenge(method.settings.deviceId!, challenge.challenge);
        break;
        
      default:
        throw new Error(`Challenge generation not implemented for ${method.type}`);
    }
  }

  private async verifyMethodCode(method: MFAMethod, code: string, challenge?: MFAChallenge): Promise<boolean> {
    switch (method.type) {
      case MFAMethodType.TOTP:
        return this.verifyTOTPCode(method, code);
        
      case MFAMethodType.SMS:
      case MFAMethodType.EMAIL:
        return challenge ? challenge.challenge === code : false;
        
      case MFAMethodType.BACKUP_CODES:
        return this.verifyBackupCode(method, code);
        
      default:
        return false;
    }
  }

  private verifyTOTPCode(method: MFAMethod, code: string): boolean {
    const secret = this.totpSecrets.get(method.id);
    if (!secret) return false;
    
    // Simplified TOTP verification - would use proper TOTP library
    const currentTime = Math.floor(Date.now() / 1000 / 30);
    const expectedCode = this.generateTOTPCode(secret, currentTime);
    
    // Also check previous and next time windows for clock skew
    const prevCode = this.generateTOTPCode(secret, currentTime - 1);
    const nextCode = this.generateTOTPCode(secret, currentTime + 1);
    
    return code === expectedCode || code === prevCode || code === nextCode;
  }

  private verifyBackupCode(method: MFAMethod, code: string): boolean {
    // This would verify against the backup codes in the configuration
    return code.length === 8; // Simplified verification
  }

  private findMethod(config: MFAConfiguration, methodId: string): MFAMethod | undefined {
    if (config.primaryMethod && config.primaryMethod.id === methodId) {
      return config.primaryMethod;
    }
    return config.backupMethods.find(method => method.id === methodId);
  }

  private getActiveMethods(config: MFAConfiguration): MFAMethod[] {
    const methods: MFAMethod[] = [];
    if (config.primaryMethod && config.primaryMethod.isActive) {
      methods.push(config.primaryMethod);
    }
    methods.push(...config.backupMethods.filter(m => m.isActive));
    return methods;
  }

  private getChallengeTypeForMethod(methodType: MFAMethodType): ChallengeType {
    switch (methodType) {
      case MFAMethodType.TOTP: return ChallengeType.TOTP_CODE;
      case MFAMethodType.SMS: return ChallengeType.SMS_CODE;
      case MFAMethodType.EMAIL: return ChallengeType.EMAIL_CODE;
      case MFAMethodType.PUSH_NOTIFICATION: return ChallengeType.PUSH_NOTIFICATION;
      case MFAMethodType.BIOMETRIC: return ChallengeType.BIOMETRIC_SCAN;
      case MFAMethodType.HARDWARE_TOKEN: return ChallengeType.HARDWARE_TOKEN;
      case MFAMethodType.BACKUP_CODES: return ChallengeType.BACKUP_CODE;
      default: return ChallengeType.TOTP_CODE;
    }
  }

  private getDefaultMethodName(methodType: MFAMethodType): string {
    switch (methodType) {
      case MFAMethodType.TOTP: return 'Authenticator App';
      case MFAMethodType.SMS: return 'SMS Verification';
      case MFAMethodType.EMAIL: return 'Email Verification';
      case MFAMethodType.HARDWARE_TOKEN: return 'Hardware Token';
      case MFAMethodType.BIOMETRIC: return 'Biometric Authentication';
      case MFAMethodType.PUSH_NOTIFICATION: return 'Push Notification';
      case MFAMethodType.BACKUP_CODES: return 'Backup Codes';
      default: return 'MFA Method';
    }
  }

  private calculateMethodExpiry(methodType: MFAMethodType): Date | undefined {
    // Some methods might have expiry dates
    switch (methodType) {
      case MFAMethodType.HARDWARE_TOKEN:
        return new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 years
      case MFAMethodType.BACKUP_CODES:
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      default:
        return undefined;
    }
  }

  private async calculateChallengeRiskScore(userId: string, ipAddress: string, userAgent: string): Promise<number> {
    // Simplified risk scoring - would use more sophisticated algorithms
    let riskScore = 0;
    
    // Check if IP is from known location
    // Check if user agent is recognized
    // Check time of day
    // Check frequency of requests
    
    return Math.min(100, Math.max(0, riskScore));
  }

  private async trustDevice(userId: string, deviceId: string): Promise<any> {
    if (!this.trustedDevices.has(userId)) {
      this.trustedDevices.set(userId, new Set());
    }
    this.trustedDevices.get(userId)!.add(deviceId);
  }

  private generateTOTPSecret(): string {
    // Generate a 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  private generateTOTPCode(secret: string, timeStep: number): string {
    // Simplified TOTP code generation - would use proper TOTP library
    const hash = (secret + timeStep).slice(-6);
    return String(Math.abs(hash.split('').reduce((a, c) => a + c.charCodeAt(0), 0))).padStart(6, '0');
  }

  private generateQRCode(secret: string, name: string): string {
    // Generate QR code data URL - would use proper QR code library
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(name)}?secret=${secret}&issuer=InvestmentPlatform`;
    return `data:image/png;base64,${Buffer.from(otpAuthUrl).toString('base64')}`;
  }

  private generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  private generateBackupCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private encryptSecret(secret: string): string {
    // Placeholder for encryption
    return `encrypted_${secret}`;
  }

  private encryptCode(code: string): string {
    // Placeholder for encryption
    return `encrypted_${code}`;
  }

  private hashCode(code: string): string {
    // Placeholder for hashing
    return `hash_${code.length}_${randomUUID()}`;
  }

  private hashResponse(response: string): string {
    // Placeholder for hashing
    return `hash_${response.length}_${randomUUID()}`;
  }

  private async sendSMSChallenge(phoneNumber: string, code: string): Promise<any> {
    // Placeholder for SMS sending
    console.log(`SMS sent to ${phoneNumber}: Your verification code is ${code}`);
  }

  private async sendEmailChallenge(email: string, code: string): Promise<any> {
    // Placeholder for email sending
    console.log(`Email sent to ${email}: Your verification code is ${code}`);
  }

  private async sendPushChallenge(deviceId: string, challengeId: string): Promise<any> {
    // Placeholder for push notification
    console.log(`Push notification sent to device ${deviceId} for challenge ${challengeId}`);
  }

  private addAuditEntry(
    config: MFAConfiguration,
    action: MFAAction,
    methodType: MFAMethodType | undefined,
    methodId: string | undefined,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    details: Record<string, any>
  ): void {
    const entry: MFAAuditEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      userId: config.userId,
      action,
      methodType,
      methodId,
      success,
      failureReason: success ? undefined : 'Action failed',
      ipAddress,
      userAgent,
      riskScore: 0,
      details
    };

    config.auditTrail.push(entry);
    
    // Limit audit trail size
    if (config.auditTrail.length > 1000) {
      config.auditTrail = config.auditTrail.slice(-1000);
    }
  }

  private startChallengeCleanup(): void {
    // Clean up expired challenges every 5 minutes
    setInterval(() => {
      const now = new Date();
      for (const [id, challenge] of this.activeChallenges.entries()) {
        if (challenge.expiresAt < now) {
          this.activeChallenges.delete(id);
        }
      }
    }, 5 * 60 * 1000);
  }
}

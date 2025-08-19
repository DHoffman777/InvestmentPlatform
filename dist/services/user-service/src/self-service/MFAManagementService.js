"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFAManagementService = exports.MFAAction = exports.ChallengeType = exports.TrustLevel = exports.BiometricType = exports.TOTPAlgorithm = exports.MFAMethodType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
// Enums
var MFAMethodType;
(function (MFAMethodType) {
    MFAMethodType["TOTP"] = "totp";
    MFAMethodType["SMS"] = "sms";
    MFAMethodType["EMAIL"] = "email";
    MFAMethodType["HARDWARE_TOKEN"] = "hardware_token";
    MFAMethodType["BIOMETRIC"] = "biometric";
    MFAMethodType["PUSH_NOTIFICATION"] = "push";
    MFAMethodType["BACKUP_CODES"] = "backup_codes";
    MFAMethodType["PHONE_CALL"] = "phone_call";
    MFAMethodType["RECOVERY_CODE"] = "recovery_code";
    MFAMethodType["SMART_CARD"] = "smart_card"; // Smart card authentication
})(MFAMethodType || (exports.MFAMethodType = MFAMethodType = {}));
var TOTPAlgorithm;
(function (TOTPAlgorithm) {
    TOTPAlgorithm["SHA1"] = "SHA1";
    TOTPAlgorithm["SHA256"] = "SHA256";
    TOTPAlgorithm["SHA512"] = "SHA512";
})(TOTPAlgorithm || (exports.TOTPAlgorithm = TOTPAlgorithm = {}));
var BiometricType;
(function (BiometricType) {
    BiometricType["FINGERPRINT"] = "fingerprint";
    BiometricType["FACE_RECOGNITION"] = "face_recognition";
    BiometricType["VOICE_RECOGNITION"] = "voice_recognition";
    BiometricType["IRIS_SCAN"] = "iris_scan";
    BiometricType["RETINA_SCAN"] = "retina_scan";
})(BiometricType || (exports.BiometricType = BiometricType = {}));
var TrustLevel;
(function (TrustLevel) {
    TrustLevel["LOW"] = "low";
    TrustLevel["MEDIUM"] = "medium";
    TrustLevel["HIGH"] = "high";
    TrustLevel["VERIFIED"] = "verified";
})(TrustLevel || (exports.TrustLevel = TrustLevel = {}));
var ChallengeType;
(function (ChallengeType) {
    ChallengeType["TOTP_CODE"] = "totp_code";
    ChallengeType["SMS_CODE"] = "sms_code";
    ChallengeType["EMAIL_CODE"] = "email_code";
    ChallengeType["PUSH_NOTIFICATION"] = "push_notification";
    ChallengeType["BIOMETRIC_SCAN"] = "biometric_scan";
    ChallengeType["HARDWARE_TOKEN"] = "hardware_token";
    ChallengeType["BACKUP_CODE"] = "backup_code";
    ChallengeType["VOICE_CHALLENGE"] = "voice_challenge";
})(ChallengeType || (exports.ChallengeType = ChallengeType = {}));
var MFAAction;
(function (MFAAction) {
    MFAAction["SETUP"] = "setup";
    MFAAction["ENABLE"] = "enable";
    MFAAction["DISABLE"] = "disable";
    MFAAction["VERIFY"] = "verify";
    MFAAction["CHALLENGE_SENT"] = "challenge_sent";
    MFAAction["CHALLENGE_COMPLETED"] = "challenge_completed";
    MFAAction["CHALLENGE_FAILED"] = "challenge_failed";
    MFAAction["BACKUP_CODES_GENERATED"] = "backup_codes_generated";
    MFAAction["BACKUP_CODE_USED"] = "backup_code_used";
    MFAAction["METHOD_ADDED"] = "method_added";
    MFAAction["METHOD_REMOVED"] = "method_removed";
    MFAAction["SETTINGS_UPDATED"] = "settings_updated";
})(MFAAction || (exports.MFAAction = MFAAction = {}));
class MFAManagementService extends events_1.EventEmitter {
    mfaConfigurations = new Map();
    activeChallenges = new Map();
    trustedDevices = new Map(); // userId -> Set<deviceId>
    totpSecrets = new Map(); // methodId -> secret
    constructor() {
        super();
        this.startChallengeCleanup();
    }
    async getMFAConfiguration(userId) {
        return Array.from(this.mfaConfigurations.values())
            .find(config => config.userId === userId) || null;
    }
    async initializeMFAConfiguration(userId, tenantId) {
        const existingConfig = await this.getMFAConfiguration(userId);
        if (existingConfig) {
            return existingConfig;
        }
        const configuration = {
            id: (0, crypto_1.randomUUID)(),
            userId,
            tenantId,
            isEnabled: false,
            primaryMethod: null,
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
    async setupMFAMethod(setupRequest, ipAddress, userAgent) {
        const config = await this.getMFAConfiguration(setupRequest.userId);
        if (!config) {
            throw new Error('MFA configuration not found');
        }
        // Check if method type is allowed
        if (!config.allowedMethods.includes(setupRequest.methodType)) {
            throw new Error(`MFA method ${setupRequest.methodType} is not allowed for this user`);
        }
        const method = {
            id: (0, crypto_1.randomUUID)(),
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
        let setupData = {};
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
        }
        else {
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
    async verifyMFAMethodSetup(userId, methodId, verificationCode, ipAddress, userAgent) {
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
        }
        else {
            method.failureCount++;
            method.lastFailure = new Date();
            this.addAuditEntry(config, MFAAction.VERIFY, method.type, methodId, false, ipAddress, userAgent, {
                methodName: method.name,
                reason: 'Invalid verification code'
            });
            return false;
        }
    }
    async createMFAChallenge(userId, methodId, challengeType, ipAddress = 'unknown', userAgent = 'unknown') {
        const config = await this.getMFAConfiguration(userId);
        if (!config || !config.isEnabled) {
            throw new Error('MFA is not enabled for this user');
        }
        let method;
        if (methodId) {
            method = this.findMethod(config, methodId);
            if (!method) {
                throw new Error('MFA method not found');
            }
        }
        else {
            // Use primary method or first available backup method
            method = config.primaryMethod && config.primaryMethod.isActive
                ? config.primaryMethod
                : config.backupMethods.find(m => m.isActive);
            if (!method) {
                throw new Error('No active MFA methods available');
            }
        }
        if (!method.isVerified || !method.isActive) {
            throw new Error('Selected MFA method is not active or verified');
        }
        const challenge = {
            id: (0, crypto_1.randomUUID)(),
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
    async verifyMFAChallenge(request) {
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
        const method = this.findMethod(config, request.methodId);
        const startTime = Date.now();
        const isValid = await this.verifyMethodCode(method, request.response, challenge);
        const timeTaken = Date.now() - startTime;
        const attempt = {
            id: (0, crypto_1.randomUUID)(),
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
            method.usageCount++;
            method.lastUsed = new Date();
            method.failureCount = 0; // Reset failure count on success
            // Handle device trust
            let trusted = false;
            if (request.trustDevice && request.deviceId && config.settings.allowTrustedDevices) {
                await this.trustDevice(request.userId, request.deviceId);
                trusted = true;
            }
            config.lastUpdated = new Date();
            config.version++;
            this.addAuditEntry(config, MFAAction.CHALLENGE_COMPLETED, method.type, method.id, true, request.ipAddress, request.userAgent, {
                challengeId: challenge.id,
                timeTaken,
                trusted
            });
            this.emit('mfaChallengeCompleted', { challenge, method: method, trusted });
            return { success: true, trusted, challengeId: challenge.id };
        }
        else {
            method.failureCount++;
            method.lastFailure = new Date();
            this.addAuditEntry(config, MFAAction.CHALLENGE_FAILED, method.type, method.id, false, request.ipAddress, request.userAgent, {
                challengeId: challenge.id,
                attemptNumber: challenge.attempts.length,
                reason: 'Invalid code'
            });
            this.emit('mfaChallengeFailed', { challenge, method: method });
            return { success: false, challengeId: challenge.id };
        }
    }
    async generateBackupCodes(userId, count = 10, length = 8) {
        const config = await this.getMFAConfiguration(userId);
        if (!config) {
            throw new Error('MFA configuration not found');
        }
        const codes = [];
        const generation = {
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
            const bypassCode = {
                id: (0, crypto_1.randomUUID)(),
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
    async removeMFAMethod(userId, methodId, ipAddress, userAgent) {
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
            }
            else {
                config.primaryMethod = null;
                config.isEnabled = false; // Disable MFA if no methods remain
            }
        }
        else {
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
    async updateMFASettings(userId, settings, ipAddress, userAgent) {
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
    async isDeviceTrusted(userId, deviceId) {
        const trustedDevices = this.trustedDevices.get(userId);
        return trustedDevices ? trustedDevices.has(deviceId) : false;
    }
    async setupTOTPMethod(method) {
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
    async setupSMSMethod(method) {
        return {
            phoneNumber: method.settings.phoneNumber,
            message: 'SMS method configured successfully'
        };
    }
    async setupEmailMethod(method) {
        return {
            emailAddress: method.settings.emailAddress,
            message: 'Email method configured successfully'
        };
    }
    async setupHardwareTokenMethod(method) {
        return {
            instructions: 'Please insert your hardware token and follow the device-specific setup instructions'
        };
    }
    async setupBiometricMethod(method) {
        return {
            biometricType: method.settings.biometricType,
            instructions: 'Please complete biometric enrollment on your device'
        };
    }
    async setupBackupCodesMethod(method, config) {
        const generation = await this.generateBackupCodes(config.userId);
        return {
            codes: generation.codes,
            message: 'Store these backup codes in a secure location'
        };
    }
    async generateChallenge(challenge, method) {
        switch (method.type) {
            case MFAMethodType.TOTP:
                // TOTP doesn't need a challenge, user generates their own code
                break;
            case MFAMethodType.SMS:
                challenge.challenge = this.generateNumericCode(6);
                await this.sendSMSChallenge(method.settings.phoneNumber, challenge.challenge);
                break;
            case MFAMethodType.EMAIL:
                challenge.challenge = this.generateNumericCode(6);
                await this.sendEmailChallenge(method.settings.emailAddress, challenge.challenge);
                break;
            case MFAMethodType.PUSH_NOTIFICATION:
                challenge.challenge = (0, crypto_1.randomUUID)();
                await this.sendPushChallenge(method.settings.deviceId, challenge.challenge);
                break;
            default:
                throw new Error(`Challenge generation not implemented for ${method.type}`);
        }
    }
    async verifyMethodCode(method, code, challenge) {
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
    verifyTOTPCode(method, code) {
        const secret = this.totpSecrets.get(method.id);
        if (!secret)
            return false;
        // Simplified TOTP verification - would use proper TOTP library
        const currentTime = Math.floor(Date.now() / 1000 / 30);
        const expectedCode = this.generateTOTPCode(secret, currentTime);
        // Also check previous and next time windows for clock skew
        const prevCode = this.generateTOTPCode(secret, currentTime - 1);
        const nextCode = this.generateTOTPCode(secret, currentTime + 1);
        return code === expectedCode || code === prevCode || code === nextCode;
    }
    verifyBackupCode(method, code) {
        // This would verify against the backup codes in the configuration
        return code.length === 8; // Simplified verification
    }
    findMethod(config, methodId) {
        if (config.primaryMethod && config.primaryMethod.id === methodId) {
            return config.primaryMethod;
        }
        return config.backupMethods.find(method => method.id === methodId);
    }
    getActiveMethods(config) {
        const methods = [];
        if (config.primaryMethod && config.primaryMethod.isActive) {
            methods.push(config.primaryMethod);
        }
        methods.push(...config.backupMethods.filter(m => m.isActive));
        return methods;
    }
    getChallengeTypeForMethod(methodType) {
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
    getDefaultMethodName(methodType) {
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
    calculateMethodExpiry(methodType) {
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
    async calculateChallengeRiskScore(userId, ipAddress, userAgent) {
        // Simplified risk scoring - would use more sophisticated algorithms
        let riskScore = 0;
        // Check if IP is from known location
        // Check if user agent is recognized
        // Check time of day
        // Check frequency of requests
        return Math.min(100, Math.max(0, riskScore));
    }
    async trustDevice(userId, deviceId) {
        if (!this.trustedDevices.has(userId)) {
            this.trustedDevices.set(userId, new Set());
        }
        this.trustedDevices.get(userId).add(deviceId);
    }
    generateTOTPSecret() {
        // Generate a 32-character base32 secret
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars[Math.floor(Math.random() * chars.length)];
        }
        return secret;
    }
    generateTOTPCode(secret, timeStep) {
        // Simplified TOTP code generation - would use proper TOTP library
        const hash = (secret + timeStep).slice(-6);
        return String(Math.abs(hash.split('').reduce((a, c) => a + c.charCodeAt(0), 0))).padStart(6, '0');
    }
    generateQRCode(secret, name) {
        // Generate QR code data URL - would use proper QR code library
        const otpAuthUrl = `otpauth://totp/${encodeURIComponent(name)}?secret=${secret}&issuer=InvestmentPlatform`;
        return `data:image/png;base64,${Buffer.from(otpAuthUrl).toString('base64')}`;
    }
    generateNumericCode(length) {
        let code = '';
        for (let i = 0; i < length; i++) {
            code += Math.floor(Math.random() * 10);
        }
        return code;
    }
    generateBackupCode(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
    encryptSecret(secret) {
        // Placeholder for encryption
        return `encrypted_${secret}`;
    }
    encryptCode(code) {
        // Placeholder for encryption
        return `encrypted_${code}`;
    }
    hashCode(code) {
        // Placeholder for hashing
        return `hash_${code.length}_${(0, crypto_1.randomUUID)()}`;
    }
    hashResponse(response) {
        // Placeholder for hashing
        return `hash_${response.length}_${(0, crypto_1.randomUUID)()}`;
    }
    async sendSMSChallenge(phoneNumber, code) {
        // Placeholder for SMS sending
        console.log(`SMS sent to ${phoneNumber}: Your verification code is ${code}`);
    }
    async sendEmailChallenge(email, code) {
        // Placeholder for email sending
        console.log(`Email sent to ${email}: Your verification code is ${code}`);
    }
    async sendPushChallenge(deviceId, challengeId) {
        // Placeholder for push notification
        console.log(`Push notification sent to device ${deviceId} for challenge ${challengeId}`);
    }
    addAuditEntry(config, action, methodType, methodId, success, ipAddress, userAgent, details) {
        const entry = {
            id: (0, crypto_1.randomUUID)(),
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
    startChallengeCleanup() {
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
exports.MFAManagementService = MFAManagementService;

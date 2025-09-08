"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordSecurityService = exports.AuditStatus = exports.SecuritySeverity = exports.SecurityCategory = exports.SecurityAction = exports.AlertAction = exports.StepUpMethod = exports.StepUpTrigger = exports.RestrictionType = exports.RecoveryType = exports.TrustLevel = exports.DeviceType = exports.LoginMethod = exports.VerificationMethod = exports.ResetStatus = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
// Enums
var ResetStatus;
(function (ResetStatus) {
    ResetStatus["PENDING"] = "pending";
    ResetStatus["SENT"] = "sent";
    ResetStatus["USED"] = "used";
    ResetStatus["EXPIRED"] = "expired";
    ResetStatus["CANCELLED"] = "cancelled";
})(ResetStatus || (exports.ResetStatus = ResetStatus = {}));
var VerificationMethod;
(function (VerificationMethod) {
    VerificationMethod["EMAIL"] = "email";
    VerificationMethod["SMS"] = "sms";
    VerificationMethod["SECURITY_QUESTIONS"] = "security_questions";
    VerificationMethod["RECOVERY_CODE"] = "recovery_code";
    VerificationMethod["ADMIN_RESET"] = "admin_reset";
})(VerificationMethod || (exports.VerificationMethod = VerificationMethod = {}));
var LoginMethod;
(function (LoginMethod) {
    LoginMethod["PASSWORD"] = "password";
    LoginMethod["SSO"] = "sso";
    LoginMethod["MFA"] = "mfa";
    LoginMethod["BIOMETRIC"] = "biometric";
    LoginMethod["API_KEY"] = "api_key";
})(LoginMethod || (exports.LoginMethod = LoginMethod = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["DESKTOP"] = "desktop";
    DeviceType["MOBILE"] = "mobile";
    DeviceType["TABLET"] = "tablet";
    DeviceType["SERVER"] = "server";
    DeviceType["IOT"] = "iot";
    DeviceType["UNKNOWN"] = "unknown";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var TrustLevel;
(function (TrustLevel) {
    TrustLevel["LOW"] = "low";
    TrustLevel["MEDIUM"] = "medium";
    TrustLevel["HIGH"] = "high";
    TrustLevel["VERIFIED"] = "verified";
})(TrustLevel || (exports.TrustLevel = TrustLevel = {}));
var RecoveryType;
(function (RecoveryType) {
    RecoveryType["EMAIL"] = "email";
    RecoveryType["PHONE"] = "phone";
    RecoveryType["BACKUP_CODE"] = "backup_code";
    RecoveryType["HARDWARE_TOKEN"] = "hardware_token";
})(RecoveryType || (exports.RecoveryType = RecoveryType = {}));
var RestrictionType;
(function (RestrictionType) {
    RestrictionType["IP_ADDRESS"] = "ip_address";
    RestrictionType["COUNTRY"] = "country";
    RestrictionType["TIME_WINDOW"] = "time_window";
    RestrictionType["RATE_LIMIT"] = "rate_limit";
})(RestrictionType || (exports.RestrictionType = RestrictionType = {}));
var StepUpTrigger;
(function (StepUpTrigger) {
    StepUpTrigger["HIGH_VALUE_TRANSACTION"] = "high_value_transaction";
    StepUpTrigger["SENSITIVE_DATA_ACCESS"] = "sensitive_data_access";
    StepUpTrigger["ADMIN_ACTION"] = "admin_action";
    StepUpTrigger["UNUSUAL_LOCATION"] = "unusual_location";
    StepUpTrigger["NEW_DEVICE"] = "new_device";
    StepUpTrigger["TIME_BASED"] = "time_based";
})(StepUpTrigger || (exports.StepUpTrigger = StepUpTrigger = {}));
var StepUpMethod;
(function (StepUpMethod) {
    StepUpMethod["MFA"] = "mfa";
    StepUpMethod["SECURITY_QUESTIONS"] = "security_questions";
    StepUpMethod["BIOMETRIC"] = "biometric";
    StepUpMethod["HARDWARE_TOKEN"] = "hardware_token";
})(StepUpMethod || (exports.StepUpMethod = StepUpMethod = {}));
var AlertAction;
(function (AlertAction) {
    AlertAction["LOG"] = "log";
    AlertAction["EMAIL"] = "email";
    AlertAction["SMS"] = "sms";
    AlertAction["WEBHOOK"] = "webhook";
    AlertAction["BLOCK"] = "block";
    AlertAction["ESCALATE"] = "escalate";
})(AlertAction || (exports.AlertAction = AlertAction = {}));
var SecurityAction;
(function (SecurityAction) {
    SecurityAction["LOGIN"] = "login";
    SecurityAction["LOGOUT"] = "logout";
    SecurityAction["PASSWORD_CHANGE"] = "password_change";
    SecurityAction["PASSWORD_RESET"] = "password_reset";
    SecurityAction["MFA_SETUP"] = "mfa_setup";
    SecurityAction["MFA_DISABLE"] = "mfa_disable";
    SecurityAction["DEVICE_TRUST"] = "device_trust";
    SecurityAction["API_KEY_CREATE"] = "api_key_create";
    SecurityAction["API_KEY_REVOKE"] = "api_key_revoke";
    SecurityAction["SECURITY_SETTING_CHANGE"] = "security_setting_change";
})(SecurityAction || (exports.SecurityAction = SecurityAction = {}));
var SecurityCategory;
(function (SecurityCategory) {
    SecurityCategory["AUTHENTICATION"] = "authentication";
    SecurityCategory["AUTHORIZATION"] = "authorization";
    SecurityCategory["DATA_ACCESS"] = "data_access";
    SecurityCategory["CONFIGURATION"] = "configuration";
    SecurityCategory["DEVICE_MANAGEMENT"] = "device_management";
})(SecurityCategory || (exports.SecurityCategory = SecurityCategory = {}));
var SecuritySeverity;
(function (SecuritySeverity) {
    SecuritySeverity["LOW"] = "low";
    SecuritySeverity["MEDIUM"] = "medium";
    SecuritySeverity["HIGH"] = "high";
    SecuritySeverity["CRITICAL"] = "critical";
})(SecuritySeverity || (exports.SecuritySeverity = SecuritySeverity = {}));
var AuditStatus;
(function (AuditStatus) {
    AuditStatus["SUCCESS"] = "success";
    AuditStatus["FAILURE"] = "failure";
    AuditStatus["SUSPICIOUS"] = "suspicious";
    AuditStatus["BLOCKED"] = "blocked";
})(AuditStatus || (exports.AuditStatus = AuditStatus = {}));
class PasswordSecurityService extends events_1.EventEmitter {
    passwordPolicies = new Map();
    resetRequests = new Map();
    securitySettings = new Map();
    securityAudit = new Map();
    compromisedPasswords = new Set();
    constructor() {
        super();
        this.initializeDefaultPolicies();
        this.loadCompromisedPasswords();
        this.startCleanupScheduler();
    }
    async createPasswordResetRequest(userId, tenantId, email, ipAddress, userAgent, verificationMethod = VerificationMethod.EMAIL) {
        // Check for existing active requests
        const existingRequest = Array.from(this.resetRequests.values())
            .find(req => req.userId === userId && req.status === ResetStatus.PENDING);
        if (existingRequest) {
            throw new Error('Password reset request already pending');
        }
        // Generate secure token
        const token = this.generateSecureToken();
        const tokenHash = this.hashToken(token);
        const resetRequest = {
            id: (0, crypto_1.randomUUID)(),
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
        this.addSecurityAuditEntry(userId, tenantId, SecurityAction.PASSWORD_RESET, SecurityCategory.AUTHENTICATION, SecuritySeverity.MEDIUM, ipAddress, userAgent, { requestId: resetRequest.id, method: verificationMethod }, 50, AuditStatus.SUCCESS);
        this.emit('passwordResetRequested', resetRequest);
        return resetRequest;
    }
    async validateResetToken(token) {
        const tokenHash = this.hashToken(token);
        const request = Array.from(this.resetRequests.values())
            .find(req => req.tokenHash === tokenHash && req.status === ResetStatus.PENDING);
        if (!request)
            return null;
        if (request.expiresAt < new Date()) {
            request.status = ResetStatus.EXPIRED;
            return null;
        }
        return request;
    }
    async resetPassword(token, newPassword, ipAddress, userAgent) {
        const request = await this.validateResetToken(token);
        if (!request)
            return false;
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
        this.addSecurityAuditEntry(request.userId, request.tenantId, SecurityAction.PASSWORD_RESET, SecurityCategory.AUTHENTICATION, SecuritySeverity.HIGH, ipAddress, userAgent, { requestId: request.id, success: true }, 25, AuditStatus.SUCCESS);
        this.emit('passwordReset', { userId: request.userId, requestId: request.id });
        return true;
    }
    async changePassword(changeRequest, ipAddress, userAgent) {
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
        this.addSecurityAuditEntry(userId, tenantId, SecurityAction.PASSWORD_CHANGE, SecurityCategory.AUTHENTICATION, SecuritySeverity.MEDIUM, ipAddress, userAgent, { reason, bypassPolicy }, 30, AuditStatus.SUCCESS);
        this.emit('passwordChanged', { userId, reason });
        return true;
    }
    async validatePassword(password, userId, policy) {
        const result = {
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
        result.estimatedCrackTime = await this.estimateCrackTime(password);
        // Add suggestions
        if (result.score < 70) {
            result.suggestions.push('Consider using a longer password');
            result.suggestions.push('Mix uppercase and lowercase letters');
            result.suggestions.push('Include numbers and special characters');
            result.suggestions.push('Avoid common words and patterns');
        }
        return result;
    }
    async getSecuritySettings(userId) {
        return Array.from(this.securitySettings.values())
            .find(settings => settings.userId === userId) || null;
    }
    async updateSecuritySettings(userId, updates, updatedBy, ipAddress, userAgent) {
        const existing = await this.getSecuritySettings(userId);
        if (!existing)
            return null;
        const updatedSettings = {
            ...existing,
            ...updates,
            lastUpdated: new Date(),
            version: existing.version + 1
        };
        this.securitySettings.set(existing.id, updatedSettings);
        this.addSecurityAuditEntry(userId, existing.tenantId, SecurityAction.SECURITY_SETTING_CHANGE, SecurityCategory.CONFIGURATION, SecuritySeverity.MEDIUM, ipAddress, userAgent, { changes: Object.keys(updates), updatedBy }, 40, AuditStatus.SUCCESS);
        this.emit('securitySettingsUpdated', updatedSettings);
        return updatedSettings;
    }
    async addTrustedDevice(userId, deviceInfo) {
        const settings = await this.getSecuritySettings(userId);
        if (!settings) {
            throw new Error('User security settings not found');
        }
        const trustedDevice = {
            id: (0, crypto_1.randomUUID)(),
            firstSeen: new Date(),
            lastSeen: new Date(),
            isActive: true,
            ...deviceInfo
        };
        settings.trustedDevices.push(trustedDevice);
        settings.lastUpdated = new Date();
        settings.version++;
        this.addSecurityAuditEntry(userId, settings.tenantId, SecurityAction.DEVICE_TRUST, SecurityCategory.DEVICE_MANAGEMENT, SecuritySeverity.MEDIUM, deviceInfo.ipAddress, 'unknown', { deviceId: trustedDevice.deviceId, deviceName: trustedDevice.deviceName }, 35, AuditStatus.SUCCESS);
        this.emit('trustedDeviceAdded', { userId, device: trustedDevice });
        return trustedDevice;
    }
    async revokeTrustedDevice(userId, deviceId, ipAddress, userAgent) {
        const settings = await this.getSecuritySettings(userId);
        if (!settings)
            return false;
        const deviceIndex = settings.trustedDevices.findIndex(device => device.id === deviceId);
        if (deviceIndex === -1)
            return false;
        const device = settings.trustedDevices[deviceIndex];
        device.isActive = false;
        settings.lastUpdated = new Date();
        settings.version++;
        this.addSecurityAuditEntry(userId, settings.tenantId, SecurityAction.DEVICE_TRUST, SecurityCategory.DEVICE_MANAGEMENT, SecuritySeverity.HIGH, ipAddress, userAgent, { deviceId: device.deviceId, action: 'revoked' }, 60, AuditStatus.SUCCESS);
        this.emit('trustedDeviceRevoked', { userId, deviceId });
        return true;
    }
    async getSecurityAuditLog(userId, filter = {}) {
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
            entries = entries.filter(entry => entry.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            entries = entries.filter(entry => entry.timestamp <= filter.endDate);
        }
        entries = entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (filter.limit) {
            entries = entries.slice(0, filter.limit);
        }
        return entries;
    }
    getPasswordPolicy(tenantId) {
        return this.passwordPolicies.get(tenantId) || this.passwordPolicies.get('default');
    }
    generateSecureToken() {
        return (0, crypto_1.randomUUID)() + (0, crypto_1.randomUUID)().replace(/-/g, '');
    }
    hashToken(token) {
        // Placeholder - would use actual cryptographic hashing
        return `hash_${token.length}_${(0, crypto_1.randomUUID)()}`;
    }
    hashPassword(password) {
        // Placeholder - would use bcrypt or similar
        return `bcrypt_${password.length}_${(0, crypto_1.randomUUID)()}`;
    }
    async verifyCurrentPassword(userId, password) {
        // Placeholder - would integrate with auth service
        return password.length > 0;
    }
    async updateUserPassword(userId, password) {
        // Placeholder - would integrate with auth service
        console.log(`Password updated for user ${userId}`);
    }
    calculateNextExpiryDate(tenantId) {
        const policy = this.getPasswordPolicy(tenantId);
        return new Date(Date.now() + policy.maxAge * 24 * 60 * 60 * 1000);
    }
    async calculatePasswordStrength(password) {
        let score = 0;
        // Length score
        score += Math.min(password.length * 2, 25);
        // Character variety
        if (/[a-z]/.test(password))
            score += 5;
        if (/[A-Z]/.test(password))
            score += 5;
        if (/\d/.test(password))
            score += 5;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password))
            score += 10;
        // Pattern penalties
        if (/(.)\1{2,}/.test(password))
            score -= 10; // Repeated characters
        if (/123|abc|qwe/i.test(password))
            score -= 15; // Common sequences
        return Math.max(0, Math.min(100, score));
    }
    async estimateCrackTime(password) {
        const score = await this.calculatePasswordStrength(password);
        if (score >= 90)
            return 'centuries';
        if (score >= 80)
            return 'decades';
        if (score >= 70)
            return 'years';
        if (score >= 60)
            return 'months';
        if (score >= 50)
            return 'weeks';
        if (score >= 40)
            return 'days';
        if (score >= 30)
            return 'hours';
        return 'minutes';
    }
    addSecurityAuditEntry(userId, tenantId, action, category, severity, ipAddress, userAgent, details, riskScore, status) {
        const entry = {
            id: (0, crypto_1.randomUUID)(),
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
        this.securityAudit.get(userId).push(entry);
    }
    initializeDefaultPolicies() {
        const defaultPolicy = {
            id: (0, crypto_1.randomUUID)(),
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
    loadCompromisedPasswords() {
        // Placeholder - would load from breach database
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
        ];
        commonPasswords.forEach(pwd => this.compromisedPasswords.add(pwd));
    }
    startCleanupScheduler() {
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
exports.PasswordSecurityService = PasswordSecurityService;

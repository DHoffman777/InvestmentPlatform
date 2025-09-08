"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFAMiddleware = exports.MFAService = void 0;
const speakeasy = __importStar(require("speakeasy"));
const QRCode = __importStar(require("qrcode"));
const crypto = __importStar(require("crypto"));
const events_1 = require("events");
/**
 * Comprehensive Multi-Factor Authentication Service
 * Supports TOTP, SMS, and backup codes for financial services compliance
 */
class MFAService extends events_1.EventEmitter {
    config;
    smsConfig;
    userSettings = new Map();
    constructor(config, smsConfig) {
        super();
        this.config = {
            issuer: config.issuer || 'Investment Platform',
            serviceName: config.serviceName || 'Investment Platform',
            tokenLength: config.tokenLength || 6,
            tokenWindow: config.tokenWindow || 2,
            backupCodeCount: config.backupCodeCount || 10,
            sessionTimeout: config.sessionTimeout || 300000, // 5 minutes
        };
        this.smsConfig = smsConfig;
    }
    /**
     * Generate TOTP secret and QR code for user setup
     */
    async generateTOTPSecret(userId, userEmail) {
        try {
            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `${this.config.serviceName} (${userEmail})`,
                issuer: this.config.issuer,
                length: 32
            });
            // Generate QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            const totpSecret = {
                secret: secret.base32,
                qrCodeUrl,
                manualEntryKey: secret.base32,
                backupCodes
            };
            // Store user settings
            const userMFA = {
                userId,
                totpEnabled: false, // Not enabled until verified
                smsEnabled: false,
                backupCodesEnabled: false,
                totpSecret: secret.base32,
                backupCodes,
                lastUsedBackupCodes: [],
                failedAttempts: 0
            };
            this.userSettings.set(userId, userMFA);
            this.emit('totpSecretGenerated', {
                userId,
                timestamp: new Date(),
                method: 'totp'
            });
            return totpSecret;
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method: 'totp_setup',
                timestamp: new Date()
            });
            throw new Error(`Failed to generate TOTP secret: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Verify TOTP token and enable TOTP for user
     */
    async verifyAndEnableTOTP(userId, token) {
        try {
            const userMFA = this.userSettings.get(userId);
            if (!userMFA?.totpSecret) {
                throw new Error('TOTP not set up for user');
            }
            const verified = speakeasy.totp.verify({
                secret: userMFA.totpSecret,
                encoding: 'base32',
                token,
                window: this.config.tokenWindow
            });
            if (verified) {
                userMFA.totpEnabled = true;
                userMFA.backupCodesEnabled = true;
                userMFA.failedAttempts = 0;
                this.userSettings.set(userId, userMFA);
                this.emit('totpEnabled', {
                    userId,
                    timestamp: new Date(),
                    method: 'totp'
                });
                return true;
            }
            return false;
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method: 'totp_enable',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Set up SMS MFA for user
     */
    async setupSMSMFA(userId, phoneNumber) {
        try {
            if (!this.smsConfig) {
                throw new Error('SMS MFA not configured');
            }
            // Validate phone number format
            const phoneRegex = /^\+[1-9]\d{1,14}$/;
            if (!phoneRegex.test(phoneNumber)) {
                throw new Error('Invalid phone number format. Use E.164 format (+1234567890)');
            }
            const userMFA = this.userSettings.get(userId) || {
                userId,
                totpEnabled: false,
                smsEnabled: false,
                backupCodesEnabled: false,
                failedAttempts: 0
            };
            userMFA.phoneNumber = phoneNumber;
            this.userSettings.set(userId, userMFA);
            // Send verification SMS
            const verificationCode = this.generateVerificationCode();
            await this.sendSMS(phoneNumber, `Your Investment Platform verification code is: ${verificationCode}`);
            // Store verification code temporarily (in production, use Redis or database)
            this.storeTemporaryCode(userId, verificationCode, 'sms_setup');
            this.emit('smsSetupInitiated', {
                userId,
                phoneNumber: this.maskPhoneNumber(phoneNumber),
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method: 'sms_setup',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Verify SMS code and enable SMS MFA
     */
    async verifyAndEnableSMS(userId, code) {
        try {
            const storedCode = this.getTemporaryCode(userId, 'sms_setup');
            if (!storedCode || storedCode !== code) {
                return false;
            }
            const userMFA = this.userSettings.get(userId);
            if (!userMFA) {
                throw new Error('User MFA settings not found');
            }
            userMFA.smsEnabled = true;
            userMFA.failedAttempts = 0;
            this.userSettings.set(userId, userMFA);
            this.clearTemporaryCode(userId, 'sms_setup');
            this.emit('smsEnabled', {
                userId,
                phoneNumber: this.maskPhoneNumber(userMFA.phoneNumber),
                timestamp: new Date()
            });
            return true;
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method: 'sms_enable',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Verify MFA token during login
     */
    async verifyMFA(userId, token, method) {
        try {
            const userMFA = this.userSettings.get(userId);
            if (!userMFA) {
                throw new Error('User MFA settings not found');
            }
            // Check if user is locked out
            if (userMFA.lockedUntil && userMFA.lockedUntil > new Date()) {
                return {
                    success: false,
                    method,
                    remainingAttempts: 0,
                    nextAttemptAllowed: userMFA.lockedUntil
                };
            }
            let success = false;
            let usedBackupCode;
            switch (method) {
                case 'totp':
                    success = await this.verifyTOTP(userId, token);
                    break;
                case 'sms':
                    success = await this.verifySMSCode(userId, token);
                    break;
                case 'backup_code':
                    const backupResult = await this.verifyBackupCode(userId, token);
                    success = backupResult.success;
                    usedBackupCode = backupResult.usedCode;
                    break;
                default:
                    throw new Error('Invalid MFA method');
            }
            if (success) {
                userMFA.failedAttempts = 0;
                userMFA.lockedUntil = undefined;
                this.userSettings.set(userId, userMFA);
                this.emit('mfaVerificationSuccess', {
                    userId,
                    method,
                    timestamp: new Date(),
                    usedBackupCode
                });
                return {
                    success: true,
                    method,
                    usedBackupCode
                };
            }
            else {
                userMFA.failedAttempts++;
                // Lock account after 5 failed attempts
                if (userMFA.failedAttempts >= 5) {
                    userMFA.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                    this.emit('mfaAccountLocked', {
                        userId,
                        method,
                        failedAttempts: userMFA.failedAttempts,
                        lockedUntil: userMFA.lockedUntil,
                        timestamp: new Date()
                    });
                }
                this.userSettings.set(userId, userMFA);
                this.emit('mfaVerificationFailed', {
                    userId,
                    method,
                    failedAttempts: userMFA.failedAttempts,
                    timestamp: new Date()
                });
                return {
                    success: false,
                    method,
                    remainingAttempts: Math.max(0, 5 - userMFA.failedAttempts),
                    nextAttemptAllowed: userMFA.lockedUntil
                };
            }
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Send SMS verification code
     */
    async sendSMSVerificationCode(userId) {
        try {
            const userMFA = this.userSettings.get(userId);
            if (!userMFA?.smsEnabled || !userMFA.phoneNumber) {
                throw new Error('SMS MFA not enabled for user');
            }
            const verificationCode = this.generateVerificationCode();
            await this.sendSMS(userMFA.phoneNumber, `Your Investment Platform verification code is: ${verificationCode}. Valid for 5 minutes.`);
            this.storeTemporaryCode(userId, verificationCode, 'sms_login');
            this.emit('smsCodeSent', {
                userId,
                phoneNumber: this.maskPhoneNumber(userMFA.phoneNumber),
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method: 'sms_send',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Generate new backup codes for user
     */
    async regenerateBackupCodes(userId) {
        try {
            const userMFA = this.userSettings.get(userId);
            if (!userMFA) {
                throw new Error('User MFA settings not found');
            }
            const newBackupCodes = this.generateBackupCodes();
            userMFA.backupCodes = newBackupCodes;
            userMFA.lastUsedBackupCodes = [];
            this.userSettings.set(userId, userMFA);
            this.emit('backupCodesRegenerated', {
                userId,
                codeCount: newBackupCodes.length,
                timestamp: new Date()
            });
            return newBackupCodes;
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method: 'backup_codes_regen',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Disable MFA for user (requires additional verification)
     */
    async disableMFA(userId, method) {
        try {
            const userMFA = this.userSettings.get(userId);
            if (!userMFA) {
                throw new Error('User MFA settings not found');
            }
            switch (method) {
                case 'totp':
                    userMFA.totpEnabled = false;
                    userMFA.totpSecret = undefined;
                    break;
                case 'sms':
                    userMFA.smsEnabled = false;
                    userMFA.phoneNumber = undefined;
                    break;
                case 'all':
                    userMFA.totpEnabled = false;
                    userMFA.smsEnabled = false;
                    userMFA.backupCodesEnabled = false;
                    userMFA.totpSecret = undefined;
                    userMFA.phoneNumber = undefined;
                    userMFA.backupCodes = [];
                    break;
            }
            this.userSettings.set(userId, userMFA);
            this.emit('mfaDisabled', {
                userId,
                method,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('mfaError', {
                userId,
                error: error instanceof Error ? error.message : String(error),
                method: 'disable',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Get user MFA status
     */
    getMFAStatus(userId) {
        const userMFA = this.userSettings.get(userId);
        if (!userMFA)
            return null;
        // Return safe copy without sensitive data
        return {
            ...userMFA,
            totpSecret: userMFA.totpSecret ? '[HIDDEN]' : undefined,
            backupCodes: userMFA.backupCodes?.map(() => '[HIDDEN]'),
            phoneNumber: userMFA.phoneNumber ? this.maskPhoneNumber(userMFA.phoneNumber) : undefined
        };
    }
    // Private helper methods
    async verifyTOTP(userId, token) {
        const userMFA = this.userSettings.get(userId);
        if (!userMFA?.totpEnabled || !userMFA.totpSecret) {
            return false;
        }
        return speakeasy.totp.verify({
            secret: userMFA.totpSecret,
            encoding: 'base32',
            token,
            window: this.config.tokenWindow
        });
    }
    async verifySMSCode(userId, code) {
        const storedCode = this.getTemporaryCode(userId, 'sms_login');
        if (!storedCode)
            return false;
        const isValid = storedCode === code;
        if (isValid) {
            this.clearTemporaryCode(userId, 'sms_login');
        }
        return isValid;
    }
    async verifyBackupCode(userId, code) {
        const userMFA = this.userSettings.get(userId);
        if (!userMFA?.backupCodesEnabled || !userMFA.backupCodes) {
            return { success: false };
        }
        const codeIndex = userMFA.backupCodes.indexOf(code);
        if (codeIndex === -1) {
            return { success: false };
        }
        // Remove used backup code
        userMFA.backupCodes.splice(codeIndex, 1);
        userMFA.lastUsedBackupCodes = userMFA.lastUsedBackupCodes || [];
        userMFA.lastUsedBackupCodes.push(code);
        this.userSettings.set(userId, userMFA);
        return { success: true, usedCode: code };
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < this.config.backupCodeCount; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendSMS(phoneNumber, message) {
        if (!this.smsConfig) {
            throw new Error('SMS configuration not provided');
        }
        // Implementation would integrate with actual SMS provider
        // This is a placeholder for the actual SMS sending logic
        console.log(`Sending SMS to ${phoneNumber}: ${message}`);
        // In production, integrate with:
        // - Twilio
        // - AWS SNS
        // - Other SMS providers
    }
    maskPhoneNumber(phoneNumber) {
        if (phoneNumber.length <= 4)
            return phoneNumber;
        return phoneNumber.substring(0, 2) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.substring(phoneNumber.length - 4);
    }
    storeTemporaryCode(userId, code, type) {
        // In production, use Redis or database with TTL
        const key = `${userId}:${type}`;
        setTimeout(() => {
            this.clearTemporaryCode(userId, type);
        }, this.config.sessionTimeout);
        // Store in memory for demo (use Redis in production)
        global.tempCodes = global.tempCodes || new Map();
        global.tempCodes.set(key, code);
    }
    getTemporaryCode(userId, type) {
        const key = `${userId}:${type}`;
        const tempCodes = global.tempCodes;
        return tempCodes?.get(key) || null;
    }
    clearTemporaryCode(userId, type) {
        const key = `${userId}:${type}`;
        const tempCodes = global.tempCodes;
        tempCodes?.delete(key);
    }
}
exports.MFAService = MFAService;
// Export MFA middleware for Express.js
class MFAMiddleware {
    mfaService;
    constructor(mfaService) {
        this.mfaService = mfaService;
    }
    /**
     * Middleware to require MFA verification
     */
    requireMFA() {
        return async (req, res, next) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Authentication required' });
                }
                const mfaStatus = this.mfaService.getMFAStatus(userId);
                if (!mfaStatus || (!mfaStatus.totpEnabled && !mfaStatus.smsEnabled)) {
                    return res.status(403).json({
                        error: 'MFA required',
                        message: 'Multi-factor authentication must be enabled'
                    });
                }
                // Check if MFA was verified in this session
                if (!req.session?.mfaVerified) {
                    return res.status(403).json({
                        error: 'MFA verification required',
                        message: 'Please verify your identity with MFA'
                    });
                }
                next();
            }
            catch (error) {
                res.status(500).json({
                    error: 'MFA verification error',
                    message: error instanceof Error ? error.message : String(error)
                });
            }
        };
    }
}
exports.MFAMiddleware = MFAMiddleware;
exports.default = MFAService;

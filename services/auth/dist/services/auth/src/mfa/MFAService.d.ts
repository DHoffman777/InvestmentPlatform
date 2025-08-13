import { EventEmitter } from 'events';
export interface MFAConfig {
    issuer: string;
    serviceName: string;
    tokenLength: number;
    tokenWindow: number;
    backupCodeCount: number;
    sessionTimeout: number;
}
export interface TOTPSecret {
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
    backupCodes: string[];
}
export interface SMSConfig {
    provider: 'twilio' | 'aws-sns';
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    region?: string;
}
export interface MFAVerificationResult {
    success: boolean;
    method: 'totp' | 'sms' | 'backup_code';
    remainingAttempts?: number;
    nextAttemptAllowed?: Date;
    usedBackupCode?: string;
}
export interface UserMFASettings {
    userId: string;
    totpEnabled: boolean;
    smsEnabled: boolean;
    backupCodesEnabled: boolean;
    totpSecret?: string;
    phoneNumber?: string;
    backupCodes?: string[];
    lastUsedBackupCodes?: string[];
    failedAttempts: number;
    lockedUntil?: Date;
}
/**
 * Comprehensive Multi-Factor Authentication Service
 * Supports TOTP, SMS, and backup codes for financial services compliance
 */
export declare class MFAService extends EventEmitter {
    private config;
    private smsConfig?;
    private userSettings;
    constructor(config: MFAConfig, smsConfig?: SMSConfig);
    /**
     * Generate TOTP secret and QR code for user setup
     */
    generateTOTPSecret(userId: string, userEmail: string): Promise<TOTPSecret>;
    /**
     * Verify TOTP token and enable TOTP for user
     */
    verifyAndEnableTOTP(userId: string, token: string): Promise<boolean>;
    /**
     * Set up SMS MFA for user
     */
    setupSMSMFA(userId: string, phoneNumber: string): Promise<void>;
    /**
     * Verify SMS code and enable SMS MFA
     */
    verifyAndEnableSMS(userId: string, code: string): Promise<boolean>;
    /**
     * Verify MFA token during login
     */
    verifyMFA(userId: string, token: string, method: 'totp' | 'sms' | 'backup_code'): Promise<MFAVerificationResult>;
    /**
     * Send SMS verification code
     */
    sendSMSVerificationCode(userId: string): Promise<void>;
    /**
     * Generate new backup codes for user
     */
    regenerateBackupCodes(userId: string): Promise<string[]>;
    /**
     * Disable MFA for user (requires additional verification)
     */
    disableMFA(userId: string, method: 'totp' | 'sms' | 'all'): Promise<void>;
    /**
     * Get user MFA status
     */
    getMFAStatus(userId: string): UserMFASettings | null;
    private verifyTOTP;
    private verifySMSCode;
    private verifyBackupCode;
    private generateBackupCodes;
    private generateVerificationCode;
    private sendSMS;
    private maskPhoneNumber;
    private storeTemporaryCode;
    private getTemporaryCode;
    private clearTemporaryCode;
}
export declare class MFAMiddleware {
    private mfaService;
    constructor(mfaService: MFAService);
    /**
     * Middleware to require MFA verification
     */
    requireMFA(): (req: any, res: any, next: any) => Promise<any>;
}
export default MFAService;

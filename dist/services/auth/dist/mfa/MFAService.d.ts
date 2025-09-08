export const __esModule: boolean;
export default MFAService;
/**
 * Comprehensive Multi-Factor Authentication Service
 * Supports TOTP, SMS, and backup codes for financial services compliance
 */
export class MFAService extends events_1<[never]> {
    constructor(config: any, smsConfig: any);
    config: any;
    smsConfig: any;
    userSettings: Map<any, any>;
    /**
     * Generate TOTP secret and QR code for user setup
     */
    generateTOTPSecret(userId: any, userEmail: any): Promise<{
        secret: any;
        qrCodeUrl: any;
        manualEntryKey: any;
        backupCodes: any[];
    }>;
    /**
     * Verify TOTP token and enable TOTP for user
     */
    verifyAndEnableTOTP(userId: any, token: any): Promise<boolean>;
    /**
     * Set up SMS MFA for user
     */
    setupSMSMFA(userId: any, phoneNumber: any): Promise<void>;
    /**
     * Verify SMS code and enable SMS MFA
     */
    verifyAndEnableSMS(userId: any, code: any): Promise<boolean>;
    /**
     * Verify MFA token during login
     */
    verifyMFA(userId: any, token: any, method: any): Promise<{
        success: boolean;
        method: any;
        remainingAttempts: number;
        nextAttemptAllowed: any;
        usedBackupCode?: undefined;
    } | {
        success: boolean;
        method: any;
        usedBackupCode: any;
        remainingAttempts?: undefined;
        nextAttemptAllowed?: undefined;
    }>;
    /**
     * Send SMS verification code
     */
    sendSMSVerificationCode(userId: any): Promise<void>;
    /**
     * Generate new backup codes for user
     */
    regenerateBackupCodes(userId: any): Promise<any[]>;
    /**
     * Disable MFA for user (requires additional verification)
     */
    disableMFA(userId: any, method: any): Promise<void>;
    /**
     * Get user MFA status
     */
    getMFAStatus(userId: any): any;
    verifyTOTP(userId: any, token: any): Promise<any>;
    verifySMSCode(userId: any, code: any): Promise<boolean>;
    verifyBackupCode(userId: any, code: any): Promise<{
        success: boolean;
        usedCode?: undefined;
    } | {
        success: boolean;
        usedCode: any;
    }>;
    generateBackupCodes(): any[];
    generateVerificationCode(): string;
    sendSMS(phoneNumber: any, message: any): Promise<void>;
    maskPhoneNumber(phoneNumber: any): any;
    storeTemporaryCode(userId: any, code: any, type: any): void;
    getTemporaryCode(userId: any, type: any): any;
    clearTemporaryCode(userId: any, type: any): void;
}
export class MFAMiddleware {
    constructor(mfaService: any);
    mfaService: any;
    /**
     * Middleware to require MFA verification
     */
    requireMFA(): (req: any, res: any, next: any) => Promise<any>;
}
import events_1 = require("events");

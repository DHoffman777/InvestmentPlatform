import { Router, Request, Response, NextFunction } from 'express';
const { body, query, param, validationResult } = require('express-validator');
import rateLimit from 'express-rate-limit';
import { UserProfileService } from './UserProfileService';
import { PasswordSecurityService } from './PasswordSecurityService';
import { MFAManagementService } from './MFAManagementService';
import { NotificationPreferencesService } from './NotificationPreferencesService';
import { AccountSecurityDashboardService } from './AccountSecurityDashboardService';
import { DataRequestService } from './DataRequestService';
import { AccountClosureService } from './AccountClosureService';

// Rate limiting configurations
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many sensitive requests from this IP, please try again later.'
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.'
});

interface AuthenticatedRequest extends Request {
  user?: any; // Simplified to avoid type conflicts
}

export class SelfServiceController {
  private router: Router;
  private userProfileService: UserProfileService;
  private passwordSecurityService: PasswordSecurityService;
  private mfaManagementService: MFAManagementService;
  private notificationPreferencesService: NotificationPreferencesService;
  private accountSecurityDashboardService: AccountSecurityDashboardService;
  private dataRequestService: DataRequestService;
  private accountClosureService: AccountClosureService;

  constructor() {
    this.router = Router();
    this.userProfileService = new UserProfileService();
    this.passwordSecurityService = new PasswordSecurityService();
    this.mfaManagementService = new MFAManagementService();
    this.notificationPreferencesService = new NotificationPreferencesService();
    this.accountSecurityDashboardService = new AccountSecurityDashboardService();
    this.dataRequestService = new DataRequestService();
    this.accountClosureService = new AccountClosureService();
    
    this.setupRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private setupRoutes(): void {
    // Apply standard rate limiting to all routes
    this.router.use(standardRateLimit);

    // User Profile Management Routes
    this.setupProfileRoutes();
    
    // Password & Security Routes
    this.setupPasswordSecurityRoutes();
    
    // MFA Management Routes
    this.setupMFARoutes();
    
    // Notification Preferences Routes
    this.setupNotificationRoutes();
    
    // Security Dashboard Routes
    this.setupSecurityDashboardRoutes();
    
    // Data Request Routes
    this.setupDataRequestRoutes();
    
    // Account Closure Routes
    this.setupAccountClosureRoutes();
  }

  private setupProfileRoutes(): void {
    // Get user profile
    this.router.get('/profile', 
      this.authenticateUser as any,
      this.handleGetProfile.bind(this) as any
    );

    // Update user profile
    this.router.put('/profile',
      this.authenticateUser as any,
      [
        body('personalInfo.firstName').optional().isLength({ min: 1, max: 50 }) as any,
        body('personalInfo.lastName').optional().isLength({ min: 1, max: 50 }) as any,
        body('contactInfo.primaryEmail').optional().isEmail() as any,
        body('personalInfo.dateOfBirth').optional().isISO8601() as any,
      ],
      this.validateRequest,
      this.handleUpdateProfile.bind(this) as any
    );

    // Add document to profile
    this.router.post('/profile/documents',
      this.authenticateUser as any,
      [
        body('type').isIn(['government_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement', 'tax_document', 'employment_verification', 'proof_of_income', 'other']) as any,
        body('name').isLength({ min: 1, max: 100 }) as any,
        body('fileSize').isInt({ min: 1, max: 10485760 }), // 10MB max
        body('mimeType').matches(/^(image|application|text)\/.+$/)
      ],
      this.validateRequest,
      this.handleAddDocument.bind(this) as any
    );

    // Remove document from profile
    this.router.delete('/profile/documents/:documentId',
      this.authenticateUser as any,
      [
        param('documentId').isUUID() as any,
        body('reason').isLength({ min: 1, max: 200 })
      ],
      this.validateRequest,
      this.handleRemoveDocument.bind(this) as any
    );

    // Get profile audit trail
    this.router.get('/profile/audit',
      this.authenticateUser as any,
      [
        query('action').optional().isIn(['create', 'update', 'delete', 'view', 'verify', 'suspend', 'activate']) as any,
        query('startDate').optional().isISO8601() as any,
        query('endDate').optional().isISO8601() as any,
        query('limit').optional().isInt({ min: 1, max: 100 })
      ],
      this.validateRequest,
      this.handleGetProfileAudit.bind(this) as any
    );
  }

  private setupPasswordSecurityRoutes(): void {
    // Request password reset
    this.router.post('/security/password-reset/request',
      passwordResetRateLimit,
      [
        body('email').isEmail() as any,
        body('verificationMethod').optional().isIn(['email', 'sms', 'security_questions', 'recovery_code'])
      ],
      this.validateRequest,
      this.handlePasswordResetRequest.bind(this) as any
    );

    // Reset password with token
    this.router.post('/security/password-reset/confirm',
      strictRateLimit,
      [
        body('token').isLength({ min: 32, max: 128 }) as any,
        body('newPassword').isLength({ min: 8, max: 128 }) as any,
      ],
      this.validateRequest,
      this.handlePasswordReset.bind(this) as any
    );

    // Change password
    this.router.post('/security/password/change',
      this.authenticateUser as any,
      strictRateLimit,
      [
        body('currentPassword').isLength({ min: 1 }) as any,
        body('newPassword').isLength({ min: 8, max: 128 }) as any,
        body('reason').optional().isLength({ max: 200 })
      ],
      this.validateRequest,
      this.handlePasswordChange.bind(this) as any
    );

    // Validate password strength
    this.router.post('/security/password/validate',
      this.authenticateUser as any,
      [
        body('password').isLength({ min: 1, max: 128 })
      ],
      this.validateRequest,
      this.handlePasswordValidation.bind(this) as any
    );

    // Get security settings
    this.router.get('/security/settings',
      this.authenticateUser as any,
      this.handleGetSecuritySettings.bind(this) as any
    );

    // Update security settings
    this.router.put('/security/settings',
      this.authenticateUser as any,
      [
        body('sessionSettings.maxSessions').optional().isInt({ min: 1, max: 10 }) as any,
        body('sessionSettings.sessionTimeout').optional().isInt({ min: 15, max: 480 }), // 15 mins to 8 hours
        body('loginSettings.allowedLoginMethods').optional().isArray() as any,
      ],
      this.validateRequest,
      this.handleUpdateSecuritySettings.bind(this) as any
    );

    // Add trusted device
    this.router.post('/security/devices/trust',
      this.authenticateUser as any,
      [
        body('deviceId').isLength({ min: 1, max: 100 }) as any,
        body('deviceName').isLength({ min: 1, max: 100 }) as any,
        body('deviceType').isIn(['desktop', 'mobile', 'tablet', 'server', 'iot', 'unknown'])
      ],
      this.validateRequest,
      this.handleAddTrustedDevice.bind(this) as any
    );

    // Revoke trusted device
    this.router.delete('/security/devices/:deviceId',
      this.authenticateUser as any,
      [
        param('deviceId').isUUID()
      ],
      this.validateRequest,
      this.handleRevokeTrustedDevice.bind(this) as any
    );

    // Get security audit log
    this.router.get('/security/audit',
      this.authenticateUser as any,
      [
        query('action').optional().isIn(['login', 'logout', 'password_change', 'password_reset', 'mfa_setup', 'mfa_disable', 'device_trust', 'api_key_create', 'api_key_revoke', 'security_setting_change']) as any,
        query('category').optional().isIn(['authentication', 'authorization', 'data_access', 'configuration', 'device_management']) as any,
        query('severity').optional().isIn(['low', 'medium', 'high', 'critical']) as any,
        query('startDate').optional().isISO8601() as any,
        query('endDate').optional().isISO8601() as any,
        query('limit').optional().isInt({ min: 1, max: 100 })
      ],
      this.validateRequest,
      this.handleGetSecurityAudit.bind(this) as any
    );
  }

  private setupMFARoutes(): void {
    // Get MFA configuration
    this.router.get('/mfa/config',
      this.authenticateUser as any,
      this.handleGetMFAConfig.bind(this) as any
    );

    // Setup MFA method
    this.router.post('/mfa/methods',
      this.authenticateUser as any,
      [
        body('methodType').isIn(['totp', 'sms', 'email', 'hardware_token', 'biometric', 'push', 'backup_codes', 'phone_call', 'recovery_code', 'smart_card']) as any,
        body('name').optional().isLength({ min: 1, max: 50 }) as any,
        body('isPrimary').optional().isBoolean() as any,
        body('settings').optional().isObject()
      ],
      this.validateRequest,
      this.handleSetupMFAMethod.bind(this) as any
    );

    // Verify MFA method setup
    this.router.post('/mfa/methods/:methodId/verify',
      this.authenticateUser as any,
      [
        param('methodId').isUUID() as any,
        body('verificationCode').isLength({ min: 4, max: 10 })
      ],
      this.validateRequest,
      this.handleVerifyMFASetup.bind(this) as any
    );

    // Remove MFA method
    this.router.delete('/mfa/methods/:methodId',
      this.authenticateUser as any,
      [
        param('methodId').isUUID()
      ],
      this.validateRequest,
      this.handleRemoveMFAMethod.bind(this) as any
    );

    // Create MFA challenge
    this.router.post('/mfa/challenge',
      this.authenticateUser as any,
      [
        body('methodId').optional().isUUID() as any,
        body('challengeType').optional().isIn(['totp_code', 'sms_code', 'email_code', 'push_notification', 'biometric_scan', 'hardware_token', 'backup_code', 'voice_challenge'])
      ],
      this.validateRequest,
      this.handleCreateMFAChallenge.bind(this) as any
    );

    // Verify MFA challenge
    this.router.post('/mfa/challenge/verify',
      this.authenticateUser as any,
      [
        body('challengeId').isUUID() as any,
        body('response').isLength({ min: 1, max: 20 }) as any,
        body('trustDevice').optional().isBoolean() as any,
        body('deviceId').optional().isLength({ min: 1, max: 100 })
      ],
      this.validateRequest,
      this.handleVerifyMFAChallenge.bind(this) as any
    );

    // Generate backup codes
    this.router.post('/mfa/backup-codes',
      this.authenticateUser as any,
      strictRateLimit,
      [
        body('count').optional().isInt({ min: 8, max: 20 }) as any,
        body('length').optional().isInt({ min: 6, max: 12 })
      ],
      this.validateRequest,
      this.handleGenerateBackupCodes.bind(this) as any
    );

    // Update MFA settings
    this.router.put('/mfa/settings',
      this.authenticateUser as any,
      [
        body('requireForLogin').optional().isBoolean() as any,
        body('requireForSensitiveActions').optional().isBoolean() as any,
        body('allowTrustedDevices').optional().isBoolean() as any,
        body('trustedDeviceDuration').optional().isInt({ min: 1, max: 90 }) // days
      ],
      this.validateRequest,
      this.handleUpdateMFASettings.bind(this) as any
    );
  }

  private setupNotificationRoutes(): void {
    // Get notification preferences
    this.router.get('/notifications/preferences',
      this.authenticateUser as any,
      this.handleGetNotificationPreferences.bind(this) as any
    );

    // Update channel settings
    this.router.put('/notifications/channels/:channelId',
      this.authenticateUser as any,
      [
        param('channelId').isUUID() as any,
        body('settings').isObject()
      ],
      this.validateRequest,
      this.handleUpdateChannelSettings.bind(this) as any
    );

    // Add notification channel
    this.router.post('/notifications/channels',
      this.authenticateUser as any,
      [
        body('type').isIn(['email', 'sms', 'push', 'webhook', 'in_app', 'slack', 'teams', 'voice', 'whatsapp', 'telegram']) as any,
        body('name').isLength({ min: 1, max: 50 }) as any,
        body('settings').isObject()
      ],
      this.validateRequest,
      this.handleAddNotificationChannel.bind(this) as any
    );

    // Remove notification channel
    this.router.delete('/notifications/channels/:channelId',
      this.authenticateUser as any,
      [
        param('channelId').isUUID()
      ],
      this.validateRequest,
      this.handleRemoveNotificationChannel.bind(this) as any
    );

    // Verify notification channel
    this.router.post('/notifications/channels/:channelId/verify',
      this.authenticateUser as any,
      [
        param('channelId').isUUID() as any,
        body('verificationToken').isLength({ min: 6, max: 20 })
      ],
      this.validateRequest,
      this.handleVerifyNotificationChannel.bind(this) as any
    );

    // Update category preferences
    this.router.put('/notifications/categories/:categoryId',
      this.authenticateUser as any,
      [
        param('categoryId').isUUID() as any,
        body('isEnabled').optional().isBoolean() as any,
        body('channels').optional().isArray() as any,
        body('frequency').optional().isObject()
      ],
      this.validateRequest,
      this.handleUpdateCategoryPreferences.bind(this) as any
    );

    // Update global settings
    this.router.put('/notifications/global',
      this.authenticateUser as any,
      [
        body('globalMute').optional().isBoolean() as any,
        body('muteDuration').optional().isInt({ min: 1, max: 10080 }), // minutes, max 1 week
        body('quietHours').optional().isObject() as any,
        body('maxDailyNotifications').optional().isInt({ min: 1, max: 200 })
      ],
      this.validateRequest,
      this.handleUpdateGlobalSettings.bind(this) as any
    );

    // Add suppression
    this.router.post('/notifications/suppressions',
      this.authenticateUser as any,
      [
        body('type').isIn(['email', 'phone', 'device', 'category', 'global']) as any,
        body('value').isLength({ min: 1, max: 100 }) as any,
        body('reason').isLength({ min: 1, max: 200 }) as any,
        body('isTemporary').optional().isBoolean() as any,
        body('endDate').optional().isISO8601()
      ],
      this.validateRequest,
      this.handleAddSuppression.bind(this) as any
    );

    // Remove suppression
    this.router.delete('/notifications/suppressions/:suppressionId',
      this.authenticateUser as any,
      [
        param('suppressionId').isUUID()
      ],
      this.validateRequest,
      this.handleRemoveSuppression.bind(this) as any
    );

    // Create notification schedule
    this.router.post('/notifications/schedules',
      this.authenticateUser as any,
      [
        body('name').isLength({ min: 1, max: 50 }) as any,
        body('categoryIds').isArray() as any,
        body('scheduleType').isIn(['immediate', 'delayed', 'recurring', 'cron', 'event_driven']) as any,
        body('timezone').isLength({ min: 1, max: 50 })
      ],
      this.validateRequest,
      this.handleCreateNotificationSchedule.bind(this) as any
    );

    // Update consent settings
    this.router.put('/notifications/consent',
      this.authenticateUser as any,
      [
        body('marketingConsent').optional().isBoolean() as any,
        body('transactionalConsent').optional().isBoolean() as any,
        body('researchConsent').optional().isBoolean() as any,
        body('thirdPartyConsent').optional().isBoolean()
      ],
      this.validateRequest,
      this.handleUpdateConsentSettings.bind(this) as any
    );

    // Get notification history
    this.router.get('/notifications/history',
      this.authenticateUser as any,
      [
        query('categoryId').optional().isUUID() as any,
        query('channelId').optional().isUUID() as any,
        query('startDate').optional().isISO8601() as any,
        query('endDate').optional().isISO8601() as any,
        query('limit').optional().isInt({ min: 1, max: 100 })
      ],
      this.validateRequest,
      this.handleGetNotificationHistory.bind(this) as any
    );

    // Export preferences
    this.router.get('/notifications/export',
      this.authenticateUser as any,
      this.handleExportPreferences.bind(this) as any
    );
  }

  private setupSecurityDashboardRoutes(): void {
    // Get security dashboard
    this.router.get('/security/dashboard',
      this.authenticateUser as any,
      this.handleGetSecurityDashboard.bind(this) as any
    );

    // Add security activity
    this.router.post('/security/activities',
      this.authenticateUser as any,
      [
        body('type').isIn(['login', 'logout', 'password_change', 'mfa_setup', 'mfa_verification', 'profile_update', 'permission_change', 'data_access', 'trade_execution', 'settings_change', 'suspicious_activity']) as any,
        body('category').isIn(['authentication', 'authorization', 'data_access', 'configuration', 'trading', 'compliance']) as any,
        body('severity').isIn(['low', 'medium', 'high', 'critical']) as any,
        body('description').isLength({ min: 1, max: 500 }) as any,
        body('details').isObject()
      ],
      this.validateRequest,
      this.handleAddSecurityActivity.bind(this) as any
    );

    // Register device
    this.router.post('/security/devices',
      this.authenticateUser as any,
      [
        body('deviceId').isLength({ min: 1, max: 100 }) as any,
        body('name').isLength({ min: 1, max: 100 }) as any,
        body('type').isIn(['desktop', 'laptop', 'mobile', 'tablet', 'server', 'iot', 'unknown']) as any,
        body('platform').isLength({ min: 1, max: 50 }) as any,
        body('fingerprint').isLength({ min: 1, max: 200 })
      ],
      this.validateRequest,
      this.handleRegisterDevice.bind(this) as any
    );

    // Create session
    this.router.post('/security/sessions',
      this.authenticateUser as any,
      [
        body('sessionId').isLength({ min: 1, max: 100 }) as any,
        body('deviceId').isLength({ min: 1, max: 100 }) as any,
        body('ipAddress').isIP(),
        body('location').isObject()
      ],
      this.validateRequest,
      this.handleCreateSession.bind(this) as any
    );

    // Terminate session
    this.router.delete('/security/sessions/:sessionId',
      this.authenticateUser as any,
      [
        param('sessionId').isLength({ min: 1, max: 100 }) as any,
        body('reason').isLength({ min: 1, max: 200 })
      ],
      this.validateRequest,
      this.handleTerminateSession.bind(this) as any
    );

    // Generate security report
    this.router.post('/security/reports',
      this.authenticateUser as any,
      [
        body('timeRange.start').isISO8601() as any,
        body('timeRange.end').isISO8601() as any,
        body('format').optional().isIn(['json', 'pdf', 'csv'])
      ],
      this.validateRequest,
      this.handleGenerateSecurityReport.bind(this) as any
    );

    // Update dashboard settings
    this.router.put('/security/dashboard/settings',
      this.authenticateUser as any,
      [
        body('refreshInterval').optional().isInt({ min: 30, max: 3600 }), // 30 seconds to 1 hour
        body('visibleWidgets').optional().isArray() as any,
        body('theme').optional().isIn(['light', 'dark', 'auto'])
      ],
      this.validateRequest,
      this.handleUpdateDashboardSettings.bind(this) as any
    );
  }

  private setupDataRequestRoutes(): void {
    // Submit data request
    this.router.post('/data/requests',
      this.authenticateUser as any,
      strictRateLimit,
      [
        body('type').isIn(['export', 'deletion', 'rectification', 'portability', 'restriction', 'objection', 'anonymization', 'pseudonymization']) as any,
        body('requestData.categories').isArray() as any,
        body('requestData.format').isIn(['json', 'xml', 'csv', 'pdf', 'excel', 'parquet', 'avro']) as any,
        body('requestData.includeMetadata').optional().isBoolean() as any,
        body('legalBasis.regulation').isIn(['gdpr', 'ccpa', 'pipeda', 'lgpd', 'pdpa_singapore', 'pdpb_india', 'popia']) as any,
        body('legalBasis.lawfulBasis').isIn(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']) as any,
        body('legalBasis.justification').isLength({ min: 10, max: 500 })
      ],
      this.validateRequest,
      this.handleSubmitDataRequest.bind(this) as any
    );

    // Get data request
    this.router.get('/data/requests/:requestId',
      this.authenticateUser as any,
      [
        param('requestId').isUUID()
      ],
      this.validateRequest,
      this.handleGetDataRequest.bind(this) as any
    );

    // Get user data requests
    this.router.get('/data/requests',
      this.authenticateUser as any,
      [
        query('type').optional().isIn(['export', 'deletion', 'rectification', 'portability', 'restriction', 'objection', 'anonymization', 'pseudonymization']) as any,
        query('status').optional().isIn(['submitted', 'validated', 'in_progress', 'processing', 'completed', 'delivered', 'failed', 'cancelled', 'expired', 'partially_completed']) as any,
        query('startDate').optional().isISO8601() as any,
        query('endDate').optional().isISO8601() as any,
        query('limit').optional().isInt({ min: 1, max: 50 })
      ],
      this.validateRequest,
      this.handleGetUserDataRequests.bind(this) as any
    );

    // Cancel data request
    this.router.delete('/data/requests/:requestId',
      this.authenticateUser as any,
      [
        param('requestId').isUUID() as any,
        body('reason').isLength({ min: 1, max: 200 })
      ],
      this.validateRequest,
      this.handleCancelDataRequest.bind(this) as any
    );

    // Download request result
    this.router.get('/data/requests/:requestId/download',
      this.authenticateUser as any,
      [
        param('requestId').isUUID() as any,
        query('token').optional().isLength({ min: 1, max: 100 })
      ],
      this.validateRequest,
      this.handleDownloadRequestResult.bind(this) as any
    );

    // Get request status
    this.router.get('/data/requests/:requestId/status',
      this.authenticateUser as any,
      [
        param('requestId').isUUID()
      ],
      this.validateRequest,
      this.handleGetRequestStatus.bind(this) as any
    );

    // Generate data inventory report
    this.router.get('/data/inventory',
      this.authenticateUser as any,
      this.handleGenerateDataInventory.bind(this) as any
    );
  }

  private setupAccountClosureRoutes(): void {
    // Request account closure
    this.router.post('/account/closure',
      this.authenticateUser as any,
      strictRateLimit,
      [
        body('closureType').isIn(['voluntary', 'involuntary', 'regulatory', 'business_closure', 'migration', 'consolidation', 'suspension', 'dormancy']) as any,
        body('reason').isIn(['user_request', 'inactivity', 'compliance_violation', 'risk_management', 'business_decision', 'regulatory_order', 'fraud_detected', 'terms_violation', 'duplicate_account', 'death', 'bankruptcy', 'sanctions', 'other']) as any,
        body('customReason').optional().isLength({ min: 1, max: 500 }) as any,
        body('urgency').optional().isIn(['routine', 'expedited', 'urgent', 'emergency'])
      ],
      this.validateRequest,
      this.handleRequestAccountClosure.bind(this) as any
    );

    // Get closure request
    this.router.get('/account/closure/:requestId',
      this.authenticateUser as any,
      [
        param('requestId').isUUID()
      ],
      this.validateRequest,
      this.handleGetClosureRequest.bind(this) as any
    );

    // Get user closure requests
    this.router.get('/account/closure',
      this.authenticateUser as any,
      [
        query('status').optional().isIn(['requested', 'under_review', 'approved', 'rejected', 'in_progress', 'paused', 'completed', 'cancelled', 'failed', 'rolled_back']) as any,
        query('closureType').optional().isIn(['voluntary', 'involuntary', 'regulatory', 'business_closure', 'migration', 'consolidation', 'suspension', 'dormancy']) as any,
        query('startDate').optional().isISO8601() as any,
        query('endDate').optional().isISO8601() as any,
        query('limit').optional().isInt({ min: 1, max: 50 })
      ],
      this.validateRequest,
      this.handleGetUserClosureRequests.bind(this) as any
    );

    // Cancel closure request
    this.router.delete('/account/closure/:requestId',
      this.authenticateUser as any,
      [
        param('requestId').isUUID() as any,
        body('reason').isLength({ min: 1, max: 200 })
      ],
      this.validateRequest,
      this.handleCancelClosureRequest.bind(this) as any
    );

    // Get closure status
    this.router.get('/account/closure/:requestId/status',
      this.authenticateUser as any,
      [
        param('requestId').isUUID()
      ],
      this.validateRequest,
      this.handleGetClosureStatus.bind(this) as any
    );

    // Rollback closure (emergency use)
    this.router.post('/account/closure/:requestId/rollback',
      this.authenticateUser as any,
      strictRateLimit,
      [
        param('requestId').isUUID() as any,
        body('reason').isLength({ min: 10, max: 500 })
      ],
      this.validateRequest,
      this.handleRollbackClosure.bind(this) as any
    );
  }

  // Authentication middleware
  private authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // This would integrate with your authentication system
    // For now, we'll simulate an authenticated user
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Mock user extraction from token
    req.user = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'user@example.com',
      roles: ['user']
    };

    next();
  };

  // Request validation middleware
  private validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }
    next();
  };

  // Helper method to get client IP and user agent
  private getClientInfo(req: Request): { ipAddress: string; userAgent: string } {
    return {
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };
  }

  // Profile Management Handlers
  private async handleGetProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const profile = await this.userProfileService.getProfileByUserId(req.user!.id, req.user!.tenantId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  }

  private async handleUpdateProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const profile = await this.userProfileService.getProfileByUserId(req.user!.id, req.user!.tenantId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const updates = Object.keys(req.body).map(field => ({
        field,
        value: req.body[field],
        reason: 'User profile update'
      }));

      const updatedProfile = await this.userProfileService.updateProfile(
        profile.id, 
        updates, 
        req.user!.id, 
        ipAddress, 
        userAgent
      );

      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update profile' });
    }
  }

  private async handleAddDocument(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const profile = await this.userProfileService.getProfileByUserId(req.user!.id, req.user!.tenantId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const document = await this.userProfileService.addDocument(
        profile.id,
        {
          type: req.body.type,
          name: req.body.name,
          description: req.body.description,
          fileSize: req.body.fileSize,
          mimeType: req.body.mimeType,
          checksum: req.body.checksum || 'mock-checksum',
          status: 'pending' as any,
          tags: req.body.tags || [],
          metadata: req.body.metadata || {},
          uploadedBy: req.user?.id || 'system'
        },
        req.user!.id
      );

      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add document' });
    }
  }

  private async handleRemoveDocument(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const profile = await this.userProfileService.getProfileByUserId(req.user!.id, req.user!.tenantId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const success = await this.userProfileService.removeDocument(
        profile.id,
        req.params.documentId,
        req.user!.id,
        req.body.reason
      );

      if (!success) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to remove document' });
    }
  }

  private async handleGetProfileAudit(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const profile = await this.userProfileService.getProfileByUserId(req.user!.id, req.user!.tenantId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const auditTrail = await this.userProfileService.getAuditTrail(profile.id, {
        action: req.query.action as any,
        field: req.query.field as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });

      const limit = parseInt(req.query.limit as string) || 50;
      res.json(auditTrail.slice(0, limit));
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve audit trail' });
    }
  }

  // Password Security Handlers
  private async handlePasswordResetRequest(req: Request, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const request = await this.passwordSecurityService.createPasswordResetRequest(
        'user-id', // Would extract from email lookup
        'tenant-id',
        req.body.email,
        ipAddress,
        userAgent,
        req.body.verificationMethod
      );

      res.status(201).json({ 
        message: 'Password reset request created',
        requestId: request.id 
      });
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create password reset request' });
    }
  }

  private async handlePasswordReset(req: Request, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const success = await this.passwordSecurityService.resetPassword(
        req.body.token,
        req.body.newPassword,
        ipAddress,
        userAgent
      );

      if (!success) {
        res.status(400).json({ error: 'Invalid or expired token' });
        return;
      }

      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reset password' });
    }
  }

  private async handlePasswordChange(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const success = await this.passwordSecurityService.changePassword(
        {
          userId: req.user!.id,
          currentPassword: req.body.currentPassword,
          newPassword: req.body.newPassword,
          reason: req.body.reason
        },
        ipAddress,
        userAgent
      );

      if (!success) {
        res.status(400).json({ error: 'Failed to change password' });
        return;
      }

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to change password' });
    }
  }

  private async handlePasswordValidation(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const result = await this.passwordSecurityService.validatePassword(
        req.body.password,
        req.user!.id
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to validate password' });
    }
  }

  private async handleGetSecuritySettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const settings = await this.passwordSecurityService.getSecuritySettings(req.user!.id);
      if (!settings) {
        res.status(404).json({ error: 'Security settings not found' });
        return;
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve security settings' });
    }
  }

  private async handleUpdateSecuritySettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const settings = await this.passwordSecurityService.updateSecuritySettings(
        req.user!.id,
        req.body,
        req.user!.id,
        ipAddress,
        userAgent
      );

      if (!settings) {
        res.status(404).json({ error: 'Security settings not found' });
        return;
      }

      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update security settings' });
    }
  }

  private async handleAddTrustedDevice(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const device = await this.passwordSecurityService.addTrustedDevice(
        req.user!.id,
        {
          deviceId: req.body.deviceId,
          deviceName: req.body.deviceName,
          deviceType: req.body.deviceType,
          fingerprint: req.body.fingerprint || 'mock-fingerprint',
          ipAddress,
          location: {
            country: req.body.country || 'US',
            region: req.body.region || 'CA',
            city: req.body.city || 'San Francisco',
            // timezone: req.body.timezone || 'America/Los_Angeles',
            // organization: req.body.organization
          } as any,
          trustLevel: 'medium' as any,
          metadata: req.body.metadata || {}
          // uploadedBy: req.user?.id || 'system'
        }
      );

      res.status(201).json(device);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add trusted device' });
    }
  }

  private async handleRevokeTrustedDevice(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const success = await this.passwordSecurityService.revokeTrustedDevice(
        req.user!.id,
        req.params.deviceId,
        ipAddress,
        userAgent
      );

      if (!success) {
        res.status(404).json({ error: 'Trusted device not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to revoke trusted device' });
    }
  }

  private async handleGetSecurityAudit(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const auditLog = await this.passwordSecurityService.getSecurityAuditLog(req.user!.id, {
        action: req.query.action as any,
        category: req.query.category as any,
        severity: req.query.severity as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      });

      res.json(auditLog);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve security audit log' });
    }
  }

  // MFA Management Handlers
  private async handleGetMFAConfig(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const config = await this.mfaManagementService.getMFAConfiguration(req.user!.id);
      if (!config) {
        // Initialize MFA configuration if it doesn't exist
        const newConfig = await this.mfaManagementService.initializeMFAConfiguration(req.user!.id, req.user!.tenantId);
        res.json(newConfig);
        return;
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve MFA configuration' });
    }
  }

  private async handleSetupMFAMethod(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const result = await this.mfaManagementService.setupMFAMethod(
        {
          userId: req.user!.id,
          methodType: req.body.methodType,
          settings: req.body.settings || {},
          name: req.body.name,
          isPrimary: req.body.isPrimary
        },
        ipAddress,
        userAgent
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to setup MFA method' });
    }
  }

  private async handleVerifyMFASetup(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const success = await this.mfaManagementService.verifyMFAMethodSetup(
        req.user!.id,
        req.params.methodId,
        req.body.verificationCode,
        ipAddress,
        userAgent
      );

      if (!success) {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }

      res.json({ message: 'MFA method verified successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to verify MFA method' });
    }
  }

  private async handleRemoveMFAMethod(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const success = await this.mfaManagementService.removeMFAMethod(
        req.user!.id,
        req.params.methodId,
        ipAddress,
        userAgent
      );

      if (!success) {
        res.status(404).json({ error: 'MFA method not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to remove MFA method' });
    }
  }

  private async handleCreateMFAChallenge(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const challenge = await this.mfaManagementService.createMFAChallenge(
        req.user!.id,
        req.body.methodId,
        req.body.challengeType,
        ipAddress,
        userAgent
      );

      // Don't return the actual challenge in the response for security
      res.status(201).json({
        challengeId: challenge.id,
        challengeType: challenge.challengeType,
        expiresAt: challenge.expiresAt,
        maxAttempts: challenge.maxAttempts,
        attemptsRemaining: challenge.maxAttempts - challenge.attempts.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create MFA challenge' });
    }
  }

  private async handleVerifyMFAChallenge(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const result = await this.mfaManagementService.verifyMFAChallenge({
        userId: req.user!.id,
        methodId: req.body.methodId || '',
        challengeId: req.body.challengeId,
        response: req.body.response,
        trustDevice: req.body.trustDevice,
        deviceId: req.body.deviceId,
        ipAddress,
        userAgent
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to verify MFA challenge' });
    }
  }

  private async handleGenerateBackupCodes(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const result = await this.mfaManagementService.generateBackupCodes(
        req.user!.id,
        req.body.count,
        req.body.length
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate backup codes' });
    }
  }

  private async handleUpdateMFASettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const config = await this.mfaManagementService.updateMFASettings(
        req.user!.id,
        req.body,
        ipAddress,
        userAgent
      );

      if (!config) {
        res.status(404).json({ error: 'MFA configuration not found' });
        return;
      }

      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update MFA settings' });
    }
  }

  // Continue with other handlers...
  // [The implementation would continue with handlers for notification preferences, security dashboard, data requests, and account closure]
  // For brevity, I'm showing the pattern with the most complex handlers above
  
  // Notification Preferences Handlers (abbreviated for space)
  private async handleGetNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const preferences = await this.notificationPreferencesService.getPreferences(req.user!.id, req.user!.tenantId);
      if (!preferences) {
        const newPreferences = await this.notificationPreferencesService.initializePreferences(req.user!.id, req.user!.tenantId);
        res.json(newPreferences);
        return;
      }
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve notification preferences' });
    }
  }

  // Additional handlers would follow the same pattern...
  // Due to space constraints, I'm showing the implementation pattern with the most important handlers

  private async handleUpdateChannelSettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const channel = await this.notificationPreferencesService.updateChannelSettings(
        req.user!.id,
        req.user!.tenantId,
        req.params.channelId,
        req.body.settings,
        ipAddress,
        userAgent
      );

      if (!channel) {
        res.status(404).json({ error: 'Channel not found' });
        return;
      }

      res.json(channel);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update channel settings' });
    }
  }

  // Security Dashboard Handlers (abbreviated)
  private async handleGetSecurityDashboard(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const dashboard = await this.accountSecurityDashboardService.getDashboard(req.user!.id, req.user!.tenantId);
      if (!dashboard) {
        const newDashboard = await this.accountSecurityDashboardService.createDashboard(req.user!.id, req.user!.tenantId);
        res.json(newDashboard);
        return;
      }
      res.json(dashboard);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve security dashboard' });
    }
  }

  // Data Request Handlers (abbreviated)
  private async handleSubmitDataRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const request = await this.dataRequestService.submitDataRequest(
        req.user!.id,
        req.user!.tenantId,
        req.body.type,
        req.body.requestData,
        req.body.legalBasis,
        ipAddress,
        userAgent
      );

      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to submit data request' });
    }
  }

  // Account Closure Handlers (abbreviated)
  private async handleRequestAccountClosure(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req as any);
      const request = await this.accountClosureService.requestAccountClosure(
        req.user!.id,
        req.user!.tenantId,
        req.body.closureType,
        req.body.reason,
        req.body.customReason,
        req.body.urgency || 'routine' as any,
        ipAddress,
        userAgent
      );

      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to request account closure' });
    }
  }

  // Placeholder handlers for remaining endpoints
  private async handleAddNotificationChannel(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleRemoveNotificationChannel(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleVerifyNotificationChannel(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleUpdateCategoryPreferences(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleUpdateGlobalSettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleAddSuppression(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleRemoveSuppression(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleCreateNotificationSchedule(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleUpdateConsentSettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGetNotificationHistory(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleExportPreferences(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleAddSecurityActivity(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleRegisterDevice(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleCreateSession(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleTerminateSession(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGenerateSecurityReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleUpdateDashboardSettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGetDataRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGetUserDataRequests(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleCancelDataRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleDownloadRequestResult(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGetRequestStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGenerateDataInventory(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGetClosureRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGetUserClosureRequests(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleCancelClosureRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleGetClosureStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async handleRollbackClosure(req: AuthenticatedRequest, res: Response): Promise<any> {
    res.status(501).json({ error: 'Not implemented' });
  }
}




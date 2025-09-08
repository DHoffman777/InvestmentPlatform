"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfServiceController = void 0;
const express_1 = require("express");
const { body, query, param, validationResult } = require('express-validator');
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const UserProfileService_1 = require("./UserProfileService");
const PasswordSecurityService_1 = require("./PasswordSecurityService");
const MFAManagementService_1 = require("./MFAManagementService");
const NotificationPreferencesService_1 = require("./NotificationPreferencesService");
const AccountSecurityDashboardService_1 = require("./AccountSecurityDashboardService");
const DataRequestService_1 = require("./DataRequestService");
const AccountClosureService_1 = require("./AccountClosureService");
// Rate limiting configurations
const standardRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
const strictRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many sensitive requests from this IP, please try again later.'
});
const passwordResetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: 'Too many password reset attempts, please try again later.'
});
class SelfServiceController {
    router;
    userProfileService;
    passwordSecurityService;
    mfaManagementService;
    notificationPreferencesService;
    accountSecurityDashboardService;
    dataRequestService;
    accountClosureService;
    constructor() {
        this.router = (0, express_1.Router)();
        this.userProfileService = new UserProfileService_1.UserProfileService();
        this.passwordSecurityService = new PasswordSecurityService_1.PasswordSecurityService();
        this.mfaManagementService = new MFAManagementService_1.MFAManagementService();
        this.notificationPreferencesService = new NotificationPreferencesService_1.NotificationPreferencesService();
        this.accountSecurityDashboardService = new AccountSecurityDashboardService_1.AccountSecurityDashboardService();
        this.dataRequestService = new DataRequestService_1.DataRequestService();
        this.accountClosureService = new AccountClosureService_1.AccountClosureService();
        this.setupRoutes();
    }
    getRouter() {
        return this.router;
    }
    setupRoutes() {
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
    setupProfileRoutes() {
        // Get user profile
        this.router.get('/profile', this.authenticateUser, this.handleGetProfile.bind(this));
        // Update user profile
        this.router.put('/profile', this.authenticateUser, [
            body('personalInfo.firstName').optional().isLength({ min: 1, max: 50 }),
            body('personalInfo.lastName').optional().isLength({ min: 1, max: 50 }),
            body('contactInfo.primaryEmail').optional().isEmail(),
            body('personalInfo.dateOfBirth').optional().isISO8601(),
        ], this.validateRequest, this.handleUpdateProfile.bind(this));
        // Add document to profile
        this.router.post('/profile/documents', this.authenticateUser, [
            body('type').isIn(['government_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement', 'tax_document', 'employment_verification', 'proof_of_income', 'other']),
            body('name').isLength({ min: 1, max: 100 }),
            body('fileSize').isInt({ min: 1, max: 10485760 }), // 10MB max
            body('mimeType').matches(/^(image|application|text)\/.+$/)
        ], this.validateRequest, this.handleAddDocument.bind(this));
        // Remove document from profile
        this.router.delete('/profile/documents/:documentId', this.authenticateUser, [
            param('documentId').isUUID(),
            body('reason').isLength({ min: 1, max: 200 })
        ], this.validateRequest, this.handleRemoveDocument.bind(this));
        // Get profile audit trail
        this.router.get('/profile/audit', this.authenticateUser, [
            query('action').optional().isIn(['create', 'update', 'delete', 'view', 'verify', 'suspend', 'activate']),
            query('startDate').optional().isISO8601(),
            query('endDate').optional().isISO8601(),
            query('limit').optional().isInt({ min: 1, max: 100 })
        ], this.validateRequest, this.handleGetProfileAudit.bind(this));
    }
    setupPasswordSecurityRoutes() {
        // Request password reset
        this.router.post('/security/password-reset/request', passwordResetRateLimit, [
            body('email').isEmail(),
            body('verificationMethod').optional().isIn(['email', 'sms', 'security_questions', 'recovery_code'])
        ], this.validateRequest, this.handlePasswordResetRequest.bind(this));
        // Reset password with token
        this.router.post('/security/password-reset/confirm', strictRateLimit, [
            body('token').isLength({ min: 32, max: 128 }),
            body('newPassword').isLength({ min: 8, max: 128 }),
        ], this.validateRequest, this.handlePasswordReset.bind(this));
        // Change password
        this.router.post('/security/password/change', this.authenticateUser, strictRateLimit, [
            body('currentPassword').isLength({ min: 1 }),
            body('newPassword').isLength({ min: 8, max: 128 }),
            body('reason').optional().isLength({ max: 200 })
        ], this.validateRequest, this.handlePasswordChange.bind(this));
        // Validate password strength
        this.router.post('/security/password/validate', this.authenticateUser, [
            body('password').isLength({ min: 1, max: 128 })
        ], this.validateRequest, this.handlePasswordValidation.bind(this));
        // Get security settings
        this.router.get('/security/settings', this.authenticateUser, this.handleGetSecuritySettings.bind(this));
        // Update security settings
        this.router.put('/security/settings', this.authenticateUser, [
            body('sessionSettings.maxSessions').optional().isInt({ min: 1, max: 10 }),
            body('sessionSettings.sessionTimeout').optional().isInt({ min: 15, max: 480 }), // 15 mins to 8 hours
            body('loginSettings.allowedLoginMethods').optional().isArray(),
        ], this.validateRequest, this.handleUpdateSecuritySettings.bind(this));
        // Add trusted device
        this.router.post('/security/devices/trust', this.authenticateUser, [
            body('deviceId').isLength({ min: 1, max: 100 }),
            body('deviceName').isLength({ min: 1, max: 100 }),
            body('deviceType').isIn(['desktop', 'mobile', 'tablet', 'server', 'iot', 'unknown'])
        ], this.validateRequest, this.handleAddTrustedDevice.bind(this));
        // Revoke trusted device
        this.router.delete('/security/devices/:deviceId', this.authenticateUser, [
            param('deviceId').isUUID()
        ], this.validateRequest, this.handleRevokeTrustedDevice.bind(this));
        // Get security audit log
        this.router.get('/security/audit', this.authenticateUser, [
            query('action').optional().isIn(['login', 'logout', 'password_change', 'password_reset', 'mfa_setup', 'mfa_disable', 'device_trust', 'api_key_create', 'api_key_revoke', 'security_setting_change']),
            query('category').optional().isIn(['authentication', 'authorization', 'data_access', 'configuration', 'device_management']),
            query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
            query('startDate').optional().isISO8601(),
            query('endDate').optional().isISO8601(),
            query('limit').optional().isInt({ min: 1, max: 100 })
        ], this.validateRequest, this.handleGetSecurityAudit.bind(this));
    }
    setupMFARoutes() {
        // Get MFA configuration
        this.router.get('/mfa/config', this.authenticateUser, this.handleGetMFAConfig.bind(this));
        // Setup MFA method
        this.router.post('/mfa/methods', this.authenticateUser, [
            body('methodType').isIn(['totp', 'sms', 'email', 'hardware_token', 'biometric', 'push', 'backup_codes', 'phone_call', 'recovery_code', 'smart_card']),
            body('name').optional().isLength({ min: 1, max: 50 }),
            body('isPrimary').optional().isBoolean(),
            body('settings').optional().isObject()
        ], this.validateRequest, this.handleSetupMFAMethod.bind(this));
        // Verify MFA method setup
        this.router.post('/mfa/methods/:methodId/verify', this.authenticateUser, [
            param('methodId').isUUID(),
            body('verificationCode').isLength({ min: 4, max: 10 })
        ], this.validateRequest, this.handleVerifyMFASetup.bind(this));
        // Remove MFA method
        this.router.delete('/mfa/methods/:methodId', this.authenticateUser, [
            param('methodId').isUUID()
        ], this.validateRequest, this.handleRemoveMFAMethod.bind(this));
        // Create MFA challenge
        this.router.post('/mfa/challenge', this.authenticateUser, [
            body('methodId').optional().isUUID(),
            body('challengeType').optional().isIn(['totp_code', 'sms_code', 'email_code', 'push_notification', 'biometric_scan', 'hardware_token', 'backup_code', 'voice_challenge'])
        ], this.validateRequest, this.handleCreateMFAChallenge.bind(this));
        // Verify MFA challenge
        this.router.post('/mfa/challenge/verify', this.authenticateUser, [
            body('challengeId').isUUID(),
            body('response').isLength({ min: 1, max: 20 }),
            body('trustDevice').optional().isBoolean(),
            body('deviceId').optional().isLength({ min: 1, max: 100 })
        ], this.validateRequest, this.handleVerifyMFAChallenge.bind(this));
        // Generate backup codes
        this.router.post('/mfa/backup-codes', this.authenticateUser, strictRateLimit, [
            body('count').optional().isInt({ min: 8, max: 20 }),
            body('length').optional().isInt({ min: 6, max: 12 })
        ], this.validateRequest, this.handleGenerateBackupCodes.bind(this));
        // Update MFA settings
        this.router.put('/mfa/settings', this.authenticateUser, [
            body('requireForLogin').optional().isBoolean(),
            body('requireForSensitiveActions').optional().isBoolean(),
            body('allowTrustedDevices').optional().isBoolean(),
            body('trustedDeviceDuration').optional().isInt({ min: 1, max: 90 }) // days
        ], this.validateRequest, this.handleUpdateMFASettings.bind(this));
    }
    setupNotificationRoutes() {
        // Get notification preferences
        this.router.get('/notifications/preferences', this.authenticateUser, this.handleGetNotificationPreferences.bind(this));
        // Update channel settings
        this.router.put('/notifications/channels/:channelId', this.authenticateUser, [
            param('channelId').isUUID(),
            body('settings').isObject()
        ], this.validateRequest, this.handleUpdateChannelSettings.bind(this));
        // Add notification channel
        this.router.post('/notifications/channels', this.authenticateUser, [
            body('type').isIn(['email', 'sms', 'push', 'webhook', 'in_app', 'slack', 'teams', 'voice', 'whatsapp', 'telegram']),
            body('name').isLength({ min: 1, max: 50 }),
            body('settings').isObject()
        ], this.validateRequest, this.handleAddNotificationChannel.bind(this));
        // Remove notification channel
        this.router.delete('/notifications/channels/:channelId', this.authenticateUser, [
            param('channelId').isUUID()
        ], this.validateRequest, this.handleRemoveNotificationChannel.bind(this));
        // Verify notification channel
        this.router.post('/notifications/channels/:channelId/verify', this.authenticateUser, [
            param('channelId').isUUID(),
            body('verificationToken').isLength({ min: 6, max: 20 })
        ], this.validateRequest, this.handleVerifyNotificationChannel.bind(this));
        // Update category preferences
        this.router.put('/notifications/categories/:categoryId', this.authenticateUser, [
            param('categoryId').isUUID(),
            body('isEnabled').optional().isBoolean(),
            body('channels').optional().isArray(),
            body('frequency').optional().isObject()
        ], this.validateRequest, this.handleUpdateCategoryPreferences.bind(this));
        // Update global settings
        this.router.put('/notifications/global', this.authenticateUser, [
            body('globalMute').optional().isBoolean(),
            body('muteDuration').optional().isInt({ min: 1, max: 10080 }), // minutes, max 1 week
            body('quietHours').optional().isObject(),
            body('maxDailyNotifications').optional().isInt({ min: 1, max: 200 })
        ], this.validateRequest, this.handleUpdateGlobalSettings.bind(this));
        // Add suppression
        this.router.post('/notifications/suppressions', this.authenticateUser, [
            body('type').isIn(['email', 'phone', 'device', 'category', 'global']),
            body('value').isLength({ min: 1, max: 100 }),
            body('reason').isLength({ min: 1, max: 200 }),
            body('isTemporary').optional().isBoolean(),
            body('endDate').optional().isISO8601()
        ], this.validateRequest, this.handleAddSuppression.bind(this));
        // Remove suppression
        this.router.delete('/notifications/suppressions/:suppressionId', this.authenticateUser, [
            param('suppressionId').isUUID()
        ], this.validateRequest, this.handleRemoveSuppression.bind(this));
        // Create notification schedule
        this.router.post('/notifications/schedules', this.authenticateUser, [
            body('name').isLength({ min: 1, max: 50 }),
            body('categoryIds').isArray(),
            body('scheduleType').isIn(['immediate', 'delayed', 'recurring', 'cron', 'event_driven']),
            body('timezone').isLength({ min: 1, max: 50 })
        ], this.validateRequest, this.handleCreateNotificationSchedule.bind(this));
        // Update consent settings
        this.router.put('/notifications/consent', this.authenticateUser, [
            body('marketingConsent').optional().isBoolean(),
            body('transactionalConsent').optional().isBoolean(),
            body('researchConsent').optional().isBoolean(),
            body('thirdPartyConsent').optional().isBoolean()
        ], this.validateRequest, this.handleUpdateConsentSettings.bind(this));
        // Get notification history
        this.router.get('/notifications/history', this.authenticateUser, [
            query('categoryId').optional().isUUID(),
            query('channelId').optional().isUUID(),
            query('startDate').optional().isISO8601(),
            query('endDate').optional().isISO8601(),
            query('limit').optional().isInt({ min: 1, max: 100 })
        ], this.validateRequest, this.handleGetNotificationHistory.bind(this));
        // Export preferences
        this.router.get('/notifications/export', this.authenticateUser, this.handleExportPreferences.bind(this));
    }
    setupSecurityDashboardRoutes() {
        // Get security dashboard
        this.router.get('/security/dashboard', this.authenticateUser, this.handleGetSecurityDashboard.bind(this));
        // Add security activity
        this.router.post('/security/activities', this.authenticateUser, [
            body('type').isIn(['login', 'logout', 'password_change', 'mfa_setup', 'mfa_verification', 'profile_update', 'permission_change', 'data_access', 'trade_execution', 'settings_change', 'suspicious_activity']),
            body('category').isIn(['authentication', 'authorization', 'data_access', 'configuration', 'trading', 'compliance']),
            body('severity').isIn(['low', 'medium', 'high', 'critical']),
            body('description').isLength({ min: 1, max: 500 }),
            body('details').isObject()
        ], this.validateRequest, this.handleAddSecurityActivity.bind(this));
        // Register device
        this.router.post('/security/devices', this.authenticateUser, [
            body('deviceId').isLength({ min: 1, max: 100 }),
            body('name').isLength({ min: 1, max: 100 }),
            body('type').isIn(['desktop', 'laptop', 'mobile', 'tablet', 'server', 'iot', 'unknown']),
            body('platform').isLength({ min: 1, max: 50 }),
            body('fingerprint').isLength({ min: 1, max: 200 })
        ], this.validateRequest, this.handleRegisterDevice.bind(this));
        // Create session
        this.router.post('/security/sessions', this.authenticateUser, [
            body('sessionId').isLength({ min: 1, max: 100 }),
            body('deviceId').isLength({ min: 1, max: 100 }),
            body('ipAddress').isIP(),
            body('location').isObject()
        ], this.validateRequest, this.handleCreateSession.bind(this));
        // Terminate session
        this.router.delete('/security/sessions/:sessionId', this.authenticateUser, [
            param('sessionId').isLength({ min: 1, max: 100 }),
            body('reason').isLength({ min: 1, max: 200 })
        ], this.validateRequest, this.handleTerminateSession.bind(this));
        // Generate security report
        this.router.post('/security/reports', this.authenticateUser, [
            body('timeRange.start').isISO8601(),
            body('timeRange.end').isISO8601(),
            body('format').optional().isIn(['json', 'pdf', 'csv'])
        ], this.validateRequest, this.handleGenerateSecurityReport.bind(this));
        // Update dashboard settings
        this.router.put('/security/dashboard/settings', this.authenticateUser, [
            body('refreshInterval').optional().isInt({ min: 30, max: 3600 }), // 30 seconds to 1 hour
            body('visibleWidgets').optional().isArray(),
            body('theme').optional().isIn(['light', 'dark', 'auto'])
        ], this.validateRequest, this.handleUpdateDashboardSettings.bind(this));
    }
    setupDataRequestRoutes() {
        // Submit data request
        this.router.post('/data/requests', this.authenticateUser, strictRateLimit, [
            body('type').isIn(['export', 'deletion', 'rectification', 'portability', 'restriction', 'objection', 'anonymization', 'pseudonymization']),
            body('requestData.categories').isArray(),
            body('requestData.format').isIn(['json', 'xml', 'csv', 'pdf', 'excel', 'parquet', 'avro']),
            body('requestData.includeMetadata').optional().isBoolean(),
            body('legalBasis.regulation').isIn(['gdpr', 'ccpa', 'pipeda', 'lgpd', 'pdpa_singapore', 'pdpb_india', 'popia']),
            body('legalBasis.lawfulBasis').isIn(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']),
            body('legalBasis.justification').isLength({ min: 10, max: 500 })
        ], this.validateRequest, this.handleSubmitDataRequest.bind(this));
        // Get data request
        this.router.get('/data/requests/:requestId', this.authenticateUser, [
            param('requestId').isUUID()
        ], this.validateRequest, this.handleGetDataRequest.bind(this));
        // Get user data requests
        this.router.get('/data/requests', this.authenticateUser, [
            query('type').optional().isIn(['export', 'deletion', 'rectification', 'portability', 'restriction', 'objection', 'anonymization', 'pseudonymization']),
            query('status').optional().isIn(['submitted', 'validated', 'in_progress', 'processing', 'completed', 'delivered', 'failed', 'cancelled', 'expired', 'partially_completed']),
            query('startDate').optional().isISO8601(),
            query('endDate').optional().isISO8601(),
            query('limit').optional().isInt({ min: 1, max: 50 })
        ], this.validateRequest, this.handleGetUserDataRequests.bind(this));
        // Cancel data request
        this.router.delete('/data/requests/:requestId', this.authenticateUser, [
            param('requestId').isUUID(),
            body('reason').isLength({ min: 1, max: 200 })
        ], this.validateRequest, this.handleCancelDataRequest.bind(this));
        // Download request result
        this.router.get('/data/requests/:requestId/download', this.authenticateUser, [
            param('requestId').isUUID(),
            query('token').optional().isLength({ min: 1, max: 100 })
        ], this.validateRequest, this.handleDownloadRequestResult.bind(this));
        // Get request status
        this.router.get('/data/requests/:requestId/status', this.authenticateUser, [
            param('requestId').isUUID()
        ], this.validateRequest, this.handleGetRequestStatus.bind(this));
        // Generate data inventory report
        this.router.get('/data/inventory', this.authenticateUser, this.handleGenerateDataInventory.bind(this));
    }
    setupAccountClosureRoutes() {
        // Request account closure
        this.router.post('/account/closure', this.authenticateUser, strictRateLimit, [
            body('closureType').isIn(['voluntary', 'involuntary', 'regulatory', 'business_closure', 'migration', 'consolidation', 'suspension', 'dormancy']),
            body('reason').isIn(['user_request', 'inactivity', 'compliance_violation', 'risk_management', 'business_decision', 'regulatory_order', 'fraud_detected', 'terms_violation', 'duplicate_account', 'death', 'bankruptcy', 'sanctions', 'other']),
            body('customReason').optional().isLength({ min: 1, max: 500 }),
            body('urgency').optional().isIn(['routine', 'expedited', 'urgent', 'emergency'])
        ], this.validateRequest, this.handleRequestAccountClosure.bind(this));
        // Get closure request
        this.router.get('/account/closure/:requestId', this.authenticateUser, [
            param('requestId').isUUID()
        ], this.validateRequest, this.handleGetClosureRequest.bind(this));
        // Get user closure requests
        this.router.get('/account/closure', this.authenticateUser, [
            query('status').optional().isIn(['requested', 'under_review', 'approved', 'rejected', 'in_progress', 'paused', 'completed', 'cancelled', 'failed', 'rolled_back']),
            query('closureType').optional().isIn(['voluntary', 'involuntary', 'regulatory', 'business_closure', 'migration', 'consolidation', 'suspension', 'dormancy']),
            query('startDate').optional().isISO8601(),
            query('endDate').optional().isISO8601(),
            query('limit').optional().isInt({ min: 1, max: 50 })
        ], this.validateRequest, this.handleGetUserClosureRequests.bind(this));
        // Cancel closure request
        this.router.delete('/account/closure/:requestId', this.authenticateUser, [
            param('requestId').isUUID(),
            body('reason').isLength({ min: 1, max: 200 })
        ], this.validateRequest, this.handleCancelClosureRequest.bind(this));
        // Get closure status
        this.router.get('/account/closure/:requestId/status', this.authenticateUser, [
            param('requestId').isUUID()
        ], this.validateRequest, this.handleGetClosureStatus.bind(this));
        // Rollback closure (emergency use)
        this.router.post('/account/closure/:requestId/rollback', this.authenticateUser, strictRateLimit, [
            param('requestId').isUUID(),
            body('reason').isLength({ min: 10, max: 500 })
        ], this.validateRequest, this.handleRollbackClosure.bind(this));
    }
    // Authentication middleware
    authenticateUser = (req, res, next) => {
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
    validateRequest = (req, res, next) => {
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
    getClientInfo(req) {
        return {
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        };
    }
    // Profile Management Handlers
    async handleGetProfile(req, res) {
        try {
            const profile = await this.userProfileService.getProfileByUserId(req.user.id, req.user.tenantId);
            if (!profile) {
                res.status(404).json({ error: 'Profile not found' });
                return;
            }
            res.json(profile);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve profile' });
        }
    }
    async handleUpdateProfile(req, res) {
        try {
            const profile = await this.userProfileService.getProfileByUserId(req.user.id, req.user.tenantId);
            if (!profile) {
                res.status(404).json({ error: 'Profile not found' });
                return;
            }
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const updates = Object.keys(req.body).map(field => ({
                field,
                value: req.body[field],
                reason: 'User profile update'
            }));
            const updatedProfile = await this.userProfileService.updateProfile(profile.id, updates, req.user.id, ipAddress, userAgent);
            res.json(updatedProfile);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update profile' });
        }
    }
    async handleAddDocument(req, res) {
        try {
            const profile = await this.userProfileService.getProfileByUserId(req.user.id, req.user.tenantId);
            if (!profile) {
                res.status(404).json({ error: 'Profile not found' });
                return;
            }
            const document = await this.userProfileService.addDocument(profile.id, {
                type: req.body.type,
                name: req.body.name,
                description: req.body.description,
                fileSize: req.body.fileSize,
                mimeType: req.body.mimeType,
                checksum: req.body.checksum || 'mock-checksum',
                status: 'pending',
                tags: req.body.tags || [],
                metadata: req.body.metadata || {},
                uploadedBy: req.user?.id || 'system'
            }, req.user.id);
            res.status(201).json(document);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to add document' });
        }
    }
    async handleRemoveDocument(req, res) {
        try {
            const profile = await this.userProfileService.getProfileByUserId(req.user.id, req.user.tenantId);
            if (!profile) {
                res.status(404).json({ error: 'Profile not found' });
                return;
            }
            const success = await this.userProfileService.removeDocument(profile.id, req.params.documentId, req.user.id, req.body.reason);
            if (!success) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to remove document' });
        }
    }
    async handleGetProfileAudit(req, res) {
        try {
            const profile = await this.userProfileService.getProfileByUserId(req.user.id, req.user.tenantId);
            if (!profile) {
                res.status(404).json({ error: 'Profile not found' });
                return;
            }
            const auditTrail = await this.userProfileService.getAuditTrail(profile.id, {
                action: req.query.action,
                field: req.query.field,
                userId: req.query.userId,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            });
            const limit = parseInt(req.query.limit) || 50;
            res.json(auditTrail.slice(0, limit));
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve audit trail' });
        }
    }
    // Password Security Handlers
    async handlePasswordResetRequest(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const request = await this.passwordSecurityService.createPasswordResetRequest('user-id', // Would extract from email lookup
            'tenant-id', req.body.email, ipAddress, userAgent, req.body.verificationMethod);
            res.status(201).json({
                message: 'Password reset request created',
                requestId: request.id
            });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create password reset request' });
        }
    }
    async handlePasswordReset(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const success = await this.passwordSecurityService.resetPassword(req.body.token, req.body.newPassword, ipAddress, userAgent);
            if (!success) {
                res.status(400).json({ error: 'Invalid or expired token' });
                return;
            }
            res.json({ message: 'Password reset successfully' });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reset password' });
        }
    }
    async handlePasswordChange(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const success = await this.passwordSecurityService.changePassword({
                userId: req.user.id,
                currentPassword: req.body.currentPassword,
                newPassword: req.body.newPassword,
                reason: req.body.reason
            }, ipAddress, userAgent);
            if (!success) {
                res.status(400).json({ error: 'Failed to change password' });
                return;
            }
            res.json({ message: 'Password changed successfully' });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to change password' });
        }
    }
    async handlePasswordValidation(req, res) {
        try {
            const result = await this.passwordSecurityService.validatePassword(req.body.password, req.user.id);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to validate password' });
        }
    }
    async handleGetSecuritySettings(req, res) {
        try {
            const settings = await this.passwordSecurityService.getSecuritySettings(req.user.id);
            if (!settings) {
                res.status(404).json({ error: 'Security settings not found' });
                return;
            }
            res.json(settings);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve security settings' });
        }
    }
    async handleUpdateSecuritySettings(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const settings = await this.passwordSecurityService.updateSecuritySettings(req.user.id, req.body, req.user.id, ipAddress, userAgent);
            if (!settings) {
                res.status(404).json({ error: 'Security settings not found' });
                return;
            }
            res.json(settings);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update security settings' });
        }
    }
    async handleAddTrustedDevice(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const device = await this.passwordSecurityService.addTrustedDevice(req.user.id, {
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
                },
                trustLevel: 'medium',
                metadata: req.body.metadata || {}
                // uploadedBy: req.user?.id || 'system'
            });
            res.status(201).json(device);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add trusted device' });
        }
    }
    async handleRevokeTrustedDevice(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const success = await this.passwordSecurityService.revokeTrustedDevice(req.user.id, req.params.deviceId, ipAddress, userAgent);
            if (!success) {
                res.status(404).json({ error: 'Trusted device not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to revoke trusted device' });
        }
    }
    async handleGetSecurityAudit(req, res) {
        try {
            const auditLog = await this.passwordSecurityService.getSecurityAuditLog(req.user.id, {
                action: req.query.action,
                category: req.query.category,
                severity: req.query.severity,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined
            });
            res.json(auditLog);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve security audit log' });
        }
    }
    // MFA Management Handlers
    async handleGetMFAConfig(req, res) {
        try {
            const config = await this.mfaManagementService.getMFAConfiguration(req.user.id);
            if (!config) {
                // Initialize MFA configuration if it doesn't exist
                const newConfig = await this.mfaManagementService.initializeMFAConfiguration(req.user.id, req.user.tenantId);
                res.json(newConfig);
                return;
            }
            res.json(config);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve MFA configuration' });
        }
    }
    async handleSetupMFAMethod(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const result = await this.mfaManagementService.setupMFAMethod({
                userId: req.user.id,
                methodType: req.body.methodType,
                settings: req.body.settings || {},
                name: req.body.name,
                isPrimary: req.body.isPrimary
            }, ipAddress, userAgent);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to setup MFA method' });
        }
    }
    async handleVerifyMFASetup(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const success = await this.mfaManagementService.verifyMFAMethodSetup(req.user.id, req.params.methodId, req.body.verificationCode, ipAddress, userAgent);
            if (!success) {
                res.status(400).json({ error: 'Invalid verification code' });
                return;
            }
            res.json({ message: 'MFA method verified successfully' });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to verify MFA method' });
        }
    }
    async handleRemoveMFAMethod(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const success = await this.mfaManagementService.removeMFAMethod(req.user.id, req.params.methodId, ipAddress, userAgent);
            if (!success) {
                res.status(404).json({ error: 'MFA method not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to remove MFA method' });
        }
    }
    async handleCreateMFAChallenge(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const challenge = await this.mfaManagementService.createMFAChallenge(req.user.id, req.body.methodId, req.body.challengeType, ipAddress, userAgent);
            // Don't return the actual challenge in the response for security
            res.status(201).json({
                challengeId: challenge.id,
                challengeType: challenge.challengeType,
                expiresAt: challenge.expiresAt,
                maxAttempts: challenge.maxAttempts,
                attemptsRemaining: challenge.maxAttempts - challenge.attempts.length
            });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create MFA challenge' });
        }
    }
    async handleVerifyMFAChallenge(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const result = await this.mfaManagementService.verifyMFAChallenge({
                userId: req.user.id,
                methodId: req.body.methodId || '',
                challengeId: req.body.challengeId,
                response: req.body.response,
                trustDevice: req.body.trustDevice,
                deviceId: req.body.deviceId,
                ipAddress,
                userAgent
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to verify MFA challenge' });
        }
    }
    async handleGenerateBackupCodes(req, res) {
        try {
            const result = await this.mfaManagementService.generateBackupCodes(req.user.id, req.body.count, req.body.length);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate backup codes' });
        }
    }
    async handleUpdateMFASettings(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const config = await this.mfaManagementService.updateMFASettings(req.user.id, req.body, ipAddress, userAgent);
            if (!config) {
                res.status(404).json({ error: 'MFA configuration not found' });
                return;
            }
            res.json(config);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update MFA settings' });
        }
    }
    // Continue with other handlers...
    // [The implementation would continue with handlers for notification preferences, security dashboard, data requests, and account closure]
    // For brevity, I'm showing the pattern with the most complex handlers above
    // Notification Preferences Handlers (abbreviated for space)
    async handleGetNotificationPreferences(req, res) {
        try {
            const preferences = await this.notificationPreferencesService.getPreferences(req.user.id, req.user.tenantId);
            if (!preferences) {
                const newPreferences = await this.notificationPreferencesService.initializePreferences(req.user.id, req.user.tenantId);
                res.json(newPreferences);
                return;
            }
            res.json(preferences);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve notification preferences' });
        }
    }
    // Additional handlers would follow the same pattern...
    // Due to space constraints, I'm showing the implementation pattern with the most important handlers
    async handleUpdateChannelSettings(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const channel = await this.notificationPreferencesService.updateChannelSettings(req.user.id, req.user.tenantId, req.params.channelId, req.body.settings, ipAddress, userAgent);
            if (!channel) {
                res.status(404).json({ error: 'Channel not found' });
                return;
            }
            res.json(channel);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update channel settings' });
        }
    }
    // Security Dashboard Handlers (abbreviated)
    async handleGetSecurityDashboard(req, res) {
        try {
            const dashboard = await this.accountSecurityDashboardService.getDashboard(req.user.id, req.user.tenantId);
            if (!dashboard) {
                const newDashboard = await this.accountSecurityDashboardService.createDashboard(req.user.id, req.user.tenantId);
                res.json(newDashboard);
                return;
            }
            res.json(dashboard);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve security dashboard' });
        }
    }
    // Data Request Handlers (abbreviated)
    async handleSubmitDataRequest(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const request = await this.dataRequestService.submitDataRequest(req.user.id, req.user.tenantId, req.body.type, req.body.requestData, req.body.legalBasis, ipAddress, userAgent);
            res.status(201).json(request);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to submit data request' });
        }
    }
    // Account Closure Handlers (abbreviated)
    async handleRequestAccountClosure(req, res) {
        try {
            const { ipAddress, userAgent } = this.getClientInfo(req);
            const request = await this.accountClosureService.requestAccountClosure(req.user.id, req.user.tenantId, req.body.closureType, req.body.reason, req.body.customReason, req.body.urgency || 'routine', ipAddress, userAgent);
            res.status(201).json(request);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to request account closure' });
        }
    }
    // Placeholder handlers for remaining endpoints
    async handleAddNotificationChannel(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleRemoveNotificationChannel(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleVerifyNotificationChannel(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleUpdateCategoryPreferences(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleUpdateGlobalSettings(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleAddSuppression(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleRemoveSuppression(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleCreateNotificationSchedule(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleUpdateConsentSettings(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGetNotificationHistory(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleExportPreferences(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleAddSecurityActivity(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleRegisterDevice(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleCreateSession(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleTerminateSession(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGenerateSecurityReport(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleUpdateDashboardSettings(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGetDataRequest(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGetUserDataRequests(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleCancelDataRequest(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleDownloadRequestResult(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGetRequestStatus(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGenerateDataInventory(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGetClosureRequest(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGetUserClosureRequests(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleCancelClosureRequest(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleGetClosureStatus(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
    async handleRollbackClosure(req, res) {
        res.status(501).json({ error: 'Not implemented' });
    }
}
exports.SelfServiceController = SelfServiceController;

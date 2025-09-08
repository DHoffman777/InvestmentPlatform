"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityCaptureMiddleware = void 0;
const crypto_1 = require("crypto");
const ActivityTrackingService_1 = require("./ActivityTrackingService");
class ActivityCaptureMiddleware {
    activityService;
    config;
    routeClassifications = new Map();
    ipGeoCache = new Map();
    deviceCache = new Map();
    constructor(activityService, config = {}) {
        this.activityService = activityService;
        this.config = {
            trackSensitiveData: true,
            requireCompliance: true,
            maxRequestBodySize: 10 * 1024 * 1024, // 10MB
            enableGeolocation: true,
            enableDeviceFingerprinting: true,
            ...config
        };
        this.initializeRouteClassifications();
    }
    captureActivity() {
        return async (req, res, next) => {
            const startTime = Date.now();
            const correlationId = (0, crypto_1.randomUUID)();
            // Add correlation ID to request
            req.activityContext = {
                correlationId,
                ...req.activityContext
            };
            // Skip if route is disabled
            if (this.shouldSkipRoute(req.path)) {
                return next();
            }
            try {
                // Capture request activity
                const requestActivity = await this.captureRequestActivity(req, correlationId);
                // Modify response to capture completion
                const originalSend = res.send;
                const originalJson = res.json;
                res.send = function (data) {
                    this.locals.responseData = data;
                    return originalSend.call(this, data);
                };
                res.json = function (data) {
                    this.locals.responseData = data;
                    return originalJson.call(this, data);
                };
                // Capture response when request completes
                res.on('finish', async () => {
                    try {
                        await this.captureResponseActivity(req, res, requestActivity, startTime);
                    }
                    catch (error) {
                        console.error('Error capturing response activity:', error);
                    }
                });
                next();
            }
            catch (error) {
                console.error('Error in activity capture middleware:', error);
                next();
            }
        };
    }
    captureAuthActivity() {
        return async (req, res, next) => {
            const originalSend = res.send;
            const originalJson = res.json;
            res.send = function (data) {
                this.locals.responseData = data;
                return originalSend.call(this, data);
            };
            res.json = function (data) {
                this.locals.responseData = data;
                return originalJson.call(this, data);
            };
            res.on('finish', async () => {
                try {
                    await this.captureAuthenticationActivity(req, res);
                }
                catch (error) {
                    console.error('Error capturing auth activity:', error);
                }
            });
            next();
        };
    }
    captureBusinessEvent(eventType, resource) {
        return async (req, res, next) => {
            try {
                const activity = await this.createBaseActivity(req);
                activity.activityType = this.mapEventToActivityType(eventType);
                activity.activityCategory = ActivityTrackingService_1.ActivityCategory.BUSINESS_EVENT;
                activity.action = eventType;
                activity.resource = resource;
                activity.severity = this.assessBusinessEventSeverity(eventType);
                await this.activityService.trackActivity(activity);
            }
            catch (error) {
                console.error('Error capturing business event:', error);
            }
            next();
        };
    }
    captureSecurityEvent(eventType, severity = ActivityTrackingService_1.ActivitySeverity.HIGH) {
        return async (req, res, next) => {
            try {
                const activity = await this.createBaseActivity(req);
                activity.activityType = ActivityTrackingService_1.ActivityType.SECURITY;
                activity.activityCategory = ActivityTrackingService_1.ActivityCategory.SECURITY_EVENT;
                activity.action = eventType;
                activity.resource = 'security_system';
                activity.severity = severity;
                activity.sensitiveData = true;
                await this.activityService.trackActivity(activity);
            }
            catch (error) {
                console.error('Error capturing security event:', error);
            }
            next();
        };
    }
    async captureRequestActivity(req, correlationId) {
        const activity = await this.createBaseActivity(req);
        activity.correlationId = correlationId;
        activity.action = 'request_start';
        activity.resource = req.path;
        activity.metadata = {
            method: req.method,
            path: req.path,
            query: req.query,
            headers: this.sanitizeHeaders(req.headers),
            bodySize: req.get('content-length') || 0,
            userAgent: req.get('user-agent'),
            referer: req.get('referer')
        };
        const tracked = await this.activityService.trackActivity(activity);
        return tracked.id;
    }
    async captureResponseActivity(req, res, requestActivityId, startTime) {
        const activity = await this.createBaseActivity(req);
        activity.parentActivityId = requestActivityId;
        activity.action = 'request_complete';
        activity.resource = req.path;
        activity.duration = Date.now() - startTime;
        activity.status = this.mapStatusCodeToActivityStatus(res.statusCode);
        activity.outcome = this.mapStatusCodeToActivityOutcome(res.statusCode);
        activity.metadata = {
            statusCode: res.statusCode,
            responseSize: res.get('content-length') || 0,
            duration: activity.duration,
            responseHeaders: this.sanitizeHeaders(res.getHeaders())
        };
        if (res.statusCode >= 400) {
            activity.severity = res.statusCode >= 500 ? ActivityTrackingService_1.ActivitySeverity.HIGH : ActivityTrackingService_1.ActivitySeverity.MEDIUM;
            activity.activityCategory = ActivityTrackingService_1.ActivityCategory.ERROR_EVENT;
        }
        await this.activityService.trackActivity(activity);
    }
    async captureAuthenticationActivity(req, res) {
        const activity = await this.createBaseActivity(req);
        activity.activityType = ActivityTrackingService_1.ActivityType.AUTHENTICATION;
        activity.activityCategory = ActivityTrackingService_1.ActivityCategory.SECURITY_EVENT;
        activity.action = this.getAuthAction(req.path);
        activity.resource = 'authentication_system';
        activity.status = this.mapStatusCodeToActivityStatus(res.statusCode);
        activity.outcome = this.mapStatusCodeToActivityOutcome(res.statusCode);
        activity.severity = res.statusCode >= 400 ? ActivityTrackingService_1.ActivitySeverity.HIGH : ActivityTrackingService_1.ActivitySeverity.LOW;
        activity.sensitiveData = true;
        if (res.statusCode >= 400) {
            activity.complianceFlags = ['AUTH_FAILURE'];
        }
        await this.activityService.trackActivity(activity);
    }
    async createBaseActivity(req) {
        const sessionId = req.sessionId || req.get('x-session-id') || (0, crypto_1.randomUUID)();
        const userId = req.user?.id || 'anonymous';
        const tenantId = req.user?.tenantId || 'default';
        const activity = {
            userId,
            tenantId,
            sessionId,
            activityType: this.mapPathToActivityType(req.path, req.method),
            activityCategory: ActivityTrackingService_1.ActivityCategory.USER_INTERACTION,
            action: `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
            resource: req.path,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('user-agent') || 'unknown',
            severity: ActivityTrackingService_1.ActivitySeverity.LOW,
            tags: this.generateTags(req),
            sensitiveData: this.isSensitiveRoute(req.path),
            metadata: {}
        };
        if (this.config.enableGeolocation) {
            activity.location = await this.getGeolocation(activity.ipAddress);
        }
        if (this.config.enableDeviceFingerprinting) {
            activity.deviceInfo = this.getDeviceInfo(req);
        }
        return activity;
    }
    mapPathToActivityType(path, method) {
        const classification = this.getRouteClassification(path);
        if (classification) {
            return classification.activityType;
        }
        // Fallback logic
        if (path.includes('/auth'))
            return ActivityTrackingService_1.ActivityType.AUTHENTICATION;
        if (path.includes('/portfolio'))
            return ActivityTrackingService_1.ActivityType.PORTFOLIO_ACCESS;
        if (path.includes('/trade'))
            return ActivityTrackingService_1.ActivityType.TRADING;
        if (path.includes('/report'))
            return ActivityTrackingService_1.ActivityType.REPORTING;
        if (path.includes('/admin'))
            return ActivityTrackingService_1.ActivityType.SYSTEM_ADMIN;
        if (path.includes('/export'))
            return ActivityTrackingService_1.ActivityType.DATA_EXPORT;
        if (path.includes('/document'))
            return ActivityTrackingService_1.ActivityType.DOCUMENT_ACCESS;
        return ActivityTrackingService_1.ActivityType.API_ACCESS;
    }
    mapEventToActivityType(eventType) {
        const eventMappings = {
            'portfolio_created': ActivityTrackingService_1.ActivityType.PORTFOLIO_MODIFICATION,
            'portfolio_updated': ActivityTrackingService_1.ActivityType.PORTFOLIO_MODIFICATION,
            'trade_executed': ActivityTrackingService_1.ActivityType.TRADING,
            'report_generated': ActivityTrackingService_1.ActivityType.REPORTING,
            'document_accessed': ActivityTrackingService_1.ActivityType.DOCUMENT_ACCESS,
            'user_created': ActivityTrackingService_1.ActivityType.SYSTEM_ADMIN,
            'compliance_check': ActivityTrackingService_1.ActivityType.COMPLIANCE
        };
        return eventMappings[eventType] || ActivityTrackingService_1.ActivityType.API_ACCESS;
    }
    assessBusinessEventSeverity(eventType) {
        const severityMappings = {
            'trade_executed': ActivityTrackingService_1.ActivitySeverity.HIGH,
            'portfolio_created': ActivityTrackingService_1.ActivitySeverity.MEDIUM,
            'portfolio_updated': ActivityTrackingService_1.ActivitySeverity.MEDIUM,
            'report_generated': ActivityTrackingService_1.ActivitySeverity.LOW,
            'document_accessed': ActivityTrackingService_1.ActivitySeverity.LOW,
            'user_created': ActivityTrackingService_1.ActivitySeverity.HIGH,
            'compliance_violation': ActivityTrackingService_1.ActivitySeverity.CRITICAL
        };
        return severityMappings[eventType] || ActivityTrackingService_1.ActivitySeverity.LOW;
    }
    mapStatusCodeToActivityStatus(statusCode) {
        if (statusCode >= 200 && statusCode < 300)
            return ActivityTrackingService_1.ActivityStatus.SUCCESS;
        if (statusCode >= 400 && statusCode < 500)
            return ActivityTrackingService_1.ActivityStatus.FAILURE;
        if (statusCode >= 500)
            return ActivityTrackingService_1.ActivityStatus.FAILURE;
        if (statusCode === 408)
            return ActivityTrackingService_1.ActivityStatus.TIMEOUT;
        return ActivityTrackingService_1.ActivityStatus.SUCCESS;
    }
    mapStatusCodeToActivityOutcome(statusCode) {
        if (statusCode >= 200 && statusCode < 300)
            return ActivityTrackingService_1.ActivityOutcome.AUTHORIZED;
        if (statusCode === 401)
            return ActivityTrackingService_1.ActivityOutcome.UNAUTHORIZED;
        if (statusCode === 403)
            return ActivityTrackingService_1.ActivityOutcome.BLOCKED;
        if (statusCode >= 400)
            return ActivityTrackingService_1.ActivityOutcome.REJECTED;
        return ActivityTrackingService_1.ActivityOutcome.AUTHORIZED;
    }
    getAuthAction(path) {
        if (path.includes('/login'))
            return 'login_attempt';
        if (path.includes('/logout'))
            return 'logout';
        if (path.includes('/refresh'))
            return 'token_refresh';
        if (path.includes('/reset'))
            return 'password_reset';
        if (path.includes('/mfa'))
            return 'mfa_verification';
        return 'authentication';
    }
    getClientIP(req) {
        return (req.get('x-real-ip') ||
            req.get('x-forwarded-for')?.split(',')[0] ||
            req.connection.remoteAddress ||
            req.ip ||
            'unknown').trim();
    }
    async getGeolocation(ip) {
        if (this.ipGeoCache.has(ip)) {
            return this.ipGeoCache.get(ip);
        }
        try {
            // In production, use a real geolocation service
            const mockGeoData = {
                country: 'US',
                region: 'NY',
                city: 'New York',
                timezone: 'America/New_York'
            };
            this.ipGeoCache.set(ip, mockGeoData);
            return mockGeoData;
        }
        catch (error) {
            return undefined;
        }
    }
    getDeviceInfo(req) {
        const userAgent = req.get('user-agent') || '';
        const cacheKey = userAgent;
        if (this.deviceCache.has(cacheKey)) {
            return this.deviceCache.get(cacheKey);
        }
        const deviceInfo = {
            deviceType: this.detectDeviceType(userAgent),
            platform: this.detectPlatform(userAgent),
            browser: this.detectBrowser(userAgent),
            browserVersion: this.detectBrowserVersion(userAgent),
            os: this.detectOS(userAgent),
            osVersion: this.detectOSVersion(userAgent)
        };
        this.deviceCache.set(cacheKey, deviceInfo);
        return deviceInfo;
    }
    detectDeviceType(userAgent) {
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            if (/iPad|Tablet/i.test(userAgent))
                return 'tablet';
            return 'mobile';
        }
        return 'desktop';
    }
    detectPlatform(userAgent) {
        if (/Windows/i.test(userAgent))
            return 'Windows';
        if (/Mac/i.test(userAgent))
            return 'macOS';
        if (/Linux/i.test(userAgent))
            return 'Linux';
        if (/Android/i.test(userAgent))
            return 'Android';
        if (/iOS|iPhone|iPad/i.test(userAgent))
            return 'iOS';
        return 'Unknown';
    }
    detectBrowser(userAgent) {
        if (/Chrome/i.test(userAgent))
            return 'Chrome';
        if (/Firefox/i.test(userAgent))
            return 'Firefox';
        if (/Safari/i.test(userAgent))
            return 'Safari';
        if (/Edge/i.test(userAgent))
            return 'Edge';
        if (/Opera/i.test(userAgent))
            return 'Opera';
        return 'Unknown';
    }
    detectBrowserVersion(userAgent) {
        const matches = userAgent.match(/(?:Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/i);
        return matches ? matches[1] : 'Unknown';
    }
    detectOS(userAgent) {
        if (/Windows NT 10/i.test(userAgent))
            return 'Windows 10';
        if (/Windows NT 6.3/i.test(userAgent))
            return 'Windows 8.1';
        if (/Windows NT 6.2/i.test(userAgent))
            return 'Windows 8';
        if (/Windows NT 6.1/i.test(userAgent))
            return 'Windows 7';
        if (/Mac OS X/i.test(userAgent))
            return 'macOS';
        if (/Android/i.test(userAgent))
            return 'Android';
        if (/iOS/i.test(userAgent))
            return 'iOS';
        return 'Unknown';
    }
    detectOSVersion(userAgent) {
        const windowsMatch = userAgent.match(/Windows NT (\d+\.\d+)/i);
        if (windowsMatch)
            return windowsMatch[1];
        const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/i);
        if (macMatch)
            return macMatch[1].replace(/_/g, '.');
        const androidMatch = userAgent.match(/Android (\d+\.\d+)/i);
        if (androidMatch)
            return androidMatch[1];
        const iosMatch = userAgent.match(/OS (\d+_\d+)/i);
        if (iosMatch)
            return iosMatch[1].replace(/_/g, '.');
        return 'Unknown';
    }
    generateTags(req) {
        const tags = [];
        tags.push(`method:${req.method.toLowerCase()}`);
        tags.push(`path:${req.path}`);
        if (req.user?.roles?.length) {
            tags.push(...req.user.roles.map((role) => `role:${role}`));
        }
        if (this.isSensitiveRoute(req.path)) {
            tags.push('sensitive');
        }
        if (this.isComplianceRoute(req.path)) {
            tags.push('compliance');
        }
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
            tags.push('off_hours');
        }
        return tags;
    }
    sanitizeHeaders(headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        const sanitized = {};
        for (const [key, value] of Object.entries(headers)) {
            if (sensitiveHeaders.includes(key.toLowerCase())) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = String(value);
            }
        }
        return sanitized;
    }
    shouldSkipRoute(path) {
        if (this.config.enabledRoutes?.length) {
            return !this.config.enabledRoutes.some(route => path.includes(route));
        }
        if (this.config.disabledRoutes?.length) {
            return this.config.disabledRoutes.some(route => path.includes(route));
        }
        // Skip health check and static asset routes by default
        return /^\/(health|ping|metrics|static|assets)/.test(path);
    }
    isSensitiveRoute(path) {
        const sensitivePatterns = [
            '/auth',
            '/admin',
            '/export',
            '/download',
            '/personal',
            '/financial',
            '/trading',
            '/portfolio'
        ];
        return sensitivePatterns.some(pattern => path.includes(pattern));
    }
    isComplianceRoute(path) {
        const compliancePatterns = [
            '/compliance',
            '/audit',
            '/regulatory',
            '/report',
            '/filing'
        ];
        return compliancePatterns.some(pattern => path.includes(pattern));
    }
    initializeRouteClassifications() {
        const classifications = [
            { pattern: '/api/auth/*', activityType: ActivityTrackingService_1.ActivityType.AUTHENTICATION, severity: ActivityTrackingService_1.ActivitySeverity.MEDIUM },
            { pattern: '/api/portfolios/*', activityType: ActivityTrackingService_1.ActivityType.PORTFOLIO_ACCESS, severity: ActivityTrackingService_1.ActivitySeverity.LOW },
            { pattern: '/api/trades/*', activityType: ActivityTrackingService_1.ActivityType.TRADING, severity: ActivityTrackingService_1.ActivitySeverity.HIGH },
            { pattern: '/api/reports/*', activityType: ActivityTrackingService_1.ActivityType.REPORTING, severity: ActivityTrackingService_1.ActivitySeverity.LOW },
            { pattern: '/api/admin/*', activityType: ActivityTrackingService_1.ActivityType.SYSTEM_ADMIN, severity: ActivityTrackingService_1.ActivitySeverity.HIGH },
            { pattern: '/api/documents/*', activityType: ActivityTrackingService_1.ActivityType.DOCUMENT_ACCESS, severity: ActivityTrackingService_1.ActivitySeverity.MEDIUM },
            { pattern: '/api/export/*', activityType: ActivityTrackingService_1.ActivityType.DATA_EXPORT, severity: ActivityTrackingService_1.ActivitySeverity.HIGH },
            { pattern: '/api/compliance/*', activityType: ActivityTrackingService_1.ActivityType.COMPLIANCE, severity: ActivityTrackingService_1.ActivitySeverity.HIGH }
        ];
        classifications.forEach(classification => {
            this.routeClassifications.set(classification.pattern, classification);
        });
    }
    getRouteClassification(path) {
        for (const [pattern, classification] of this.routeClassifications) {
            const regexPattern = pattern.replace(/\*/g, '.*');
            if (new RegExp(regexPattern).test(path)) {
                return classification;
            }
        }
        return undefined;
    }
}
exports.ActivityCaptureMiddleware = ActivityCaptureMiddleware;

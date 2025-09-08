import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { ActivityTrackingService, ActivityData, ActivityType, ActivityCategory, ActivitySeverity, ActivityStatus, ActivityOutcome, DeviceInfo, GeolocationData } from './ActivityTrackingService';

declare global {
  namespace Express {
    interface User {
      id: string;
      tenantId: string;
      roles: string[];
      permissions: string[];
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: any; // Simplified to avoid type conflicts
  sessionId?: string;
  activityContext?: ActivityContext;
}

export interface ActivityContext {
  correlationId: string;
  parentActivityId?: string;
  businessContext?: Record<string, any>;
  sensitiveData?: boolean;
  complianceRequired?: boolean;
}

export interface MiddlewareConfig {
  enabledRoutes?: string[];
  disabledRoutes?: string[];
  trackSensitiveData?: boolean;
  requireCompliance?: boolean;
  maxRequestBodySize?: number;
  enableGeolocation?: boolean;
  enableDeviceFingerprinting?: boolean;
}

export class ActivityCaptureMiddleware {
  private activityService: ActivityTrackingService;
  private config: MiddlewareConfig;
  private routeClassifications: Map<string, RouteClassification> = new Map();
  private ipGeoCache: Map<string, GeolocationData> = new Map();
  private deviceCache: Map<string, DeviceInfo> = new Map();

  constructor(activityService: ActivityTrackingService, config: MiddlewareConfig = {}) {
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

  public captureActivity() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const correlationId = randomUUID();
      
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

        res.send = function(data) {
          this.locals.responseData = data;
          return originalSend.call(this, data);
        };

        res.json = function(data) {
          this.locals.responseData = data;
          return originalJson.call(this, data);
        };

        // Capture response when request completes
        res.on('finish', async () => {
          try {
            await this.captureResponseActivity(req, res, requestActivity, startTime);
          } catch (error: any) {
            console.error('Error capturing response activity:', error);
          }
        });

        next();
      } catch (error: any) {
        console.error('Error in activity capture middleware:', error);
        next();
      }
    };
  }

  public captureAuthActivity() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      const originalJson = res.json;

      res.send = function(data) {
        this.locals.responseData = data;
        return originalSend.call(this, data);
      };

      res.json = function(data) {
        this.locals.responseData = data;
        return originalJson.call(this, data);
      };

      res.on('finish', async () => {
        try {
          await this.captureAuthenticationActivity(req, res);
        } catch (error: any) {
          console.error('Error capturing auth activity:', error);
        }
      });

      next();
    };
  }

  public captureBusinessEvent(eventType: string, resource: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const activity = await this.createBaseActivity(req);
        activity.activityType = this.mapEventToActivityType(eventType);
        activity.activityCategory = ActivityCategory.BUSINESS_EVENT;
        activity.action = eventType;
        activity.resource = resource;
        activity.severity = this.assessBusinessEventSeverity(eventType);

        await this.activityService.trackActivity(activity);
      } catch (error: any) {
        console.error('Error capturing business event:', error);
      }

      next();
    };
  }

  public captureSecurityEvent(eventType: string, severity: ActivitySeverity = ActivitySeverity.HIGH) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const activity = await this.createBaseActivity(req);
        activity.activityType = ActivityType.SECURITY;
        activity.activityCategory = ActivityCategory.SECURITY_EVENT;
        activity.action = eventType;
        activity.resource = 'security_system';
        activity.severity = severity;
        activity.sensitiveData = true;

        await this.activityService.trackActivity(activity);
      } catch (error: any) {
        console.error('Error capturing security event:', error);
      }

      next();
    };
  }

  private async captureRequestActivity(req: AuthenticatedRequest, correlationId: string): Promise<string> {
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

  private async captureResponseActivity(
    req: AuthenticatedRequest, 
    res: Response, 
    requestActivityId: string,
    startTime: number
  ): Promise<any> {
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
      activity.severity = res.statusCode >= 500 ? ActivitySeverity.HIGH : ActivitySeverity.MEDIUM;
      activity.activityCategory = ActivityCategory.ERROR_EVENT;
    }

    await this.activityService.trackActivity(activity);
  }

  private async captureAuthenticationActivity(req: AuthenticatedRequest, res: Response): Promise<any> {
    const activity = await this.createBaseActivity(req);
    activity.activityType = ActivityType.AUTHENTICATION;
    activity.activityCategory = ActivityCategory.SECURITY_EVENT;
    activity.action = this.getAuthAction(req.path);
    activity.resource = 'authentication_system';
    activity.status = this.mapStatusCodeToActivityStatus(res.statusCode);
    activity.outcome = this.mapStatusCodeToActivityOutcome(res.statusCode);
    activity.severity = res.statusCode >= 400 ? ActivitySeverity.HIGH : ActivitySeverity.LOW;
    activity.sensitiveData = true;

    if (res.statusCode >= 400) {
      activity.complianceFlags = ['AUTH_FAILURE'];
    }

    await this.activityService.trackActivity(activity);
  }

  private async createBaseActivity(req: AuthenticatedRequest): Promise<Partial<ActivityData>> {
    const sessionId = req.sessionId || req.get('x-session-id') || randomUUID();
    const userId = req.user?.id || 'anonymous';
    const tenantId = req.user?.tenantId || 'default';

    const activity: Partial<ActivityData> = {
      userId,
      tenantId,
      sessionId,
      activityType: this.mapPathToActivityType(req.path, req.method),
      activityCategory: ActivityCategory.USER_INTERACTION,
      action: `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
      resource: req.path,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('user-agent') || 'unknown',
      severity: ActivitySeverity.LOW,
      tags: this.generateTags(req),
      sensitiveData: this.isSensitiveRoute(req.path),
      metadata: {}
    };

    if (this.config.enableGeolocation) {
      activity.location = await this.getGeolocation(activity.ipAddress!);
    }

    if (this.config.enableDeviceFingerprinting) {
      activity.deviceInfo = this.getDeviceInfo(req);
    }

    return activity;
  }

  private mapPathToActivityType(path: string, method: string): ActivityType {
    const classification = this.getRouteClassification(path);
    
    if (classification) {
      return classification.activityType;
    }

    // Fallback logic
    if (path.includes('/auth')) return ActivityType.AUTHENTICATION;
    if (path.includes('/portfolio')) return ActivityType.PORTFOLIO_ACCESS;
    if (path.includes('/trade')) return ActivityType.TRADING;
    if (path.includes('/report')) return ActivityType.REPORTING;
    if (path.includes('/admin')) return ActivityType.SYSTEM_ADMIN;
    if (path.includes('/export')) return ActivityType.DATA_EXPORT;
    if (path.includes('/document')) return ActivityType.DOCUMENT_ACCESS;

    return ActivityType.API_ACCESS;
  }

  private mapEventToActivityType(eventType: string): ActivityType {
    const eventMappings: Record<string, ActivityType> = {
      'portfolio_created': ActivityType.PORTFOLIO_MODIFICATION,
      'portfolio_updated': ActivityType.PORTFOLIO_MODIFICATION,
      'trade_executed': ActivityType.TRADING,
      'report_generated': ActivityType.REPORTING,
      'document_accessed': ActivityType.DOCUMENT_ACCESS,
      'user_created': ActivityType.SYSTEM_ADMIN,
      'compliance_check': ActivityType.COMPLIANCE
    };

    return eventMappings[eventType] || ActivityType.API_ACCESS;
  }

  private assessBusinessEventSeverity(eventType: string): ActivitySeverity {
    const severityMappings: Record<string, ActivitySeverity> = {
      'trade_executed': ActivitySeverity.HIGH,
      'portfolio_created': ActivitySeverity.MEDIUM,
      'portfolio_updated': ActivitySeverity.MEDIUM,
      'report_generated': ActivitySeverity.LOW,
      'document_accessed': ActivitySeverity.LOW,
      'user_created': ActivitySeverity.HIGH,
      'compliance_violation': ActivitySeverity.CRITICAL
    };

    return severityMappings[eventType] || ActivitySeverity.LOW;
  }

  private mapStatusCodeToActivityStatus(statusCode: number): ActivityStatus {
    if (statusCode >= 200 && statusCode < 300) return ActivityStatus.SUCCESS;
    if (statusCode >= 400 && statusCode < 500) return ActivityStatus.FAILURE;
    if (statusCode >= 500) return ActivityStatus.FAILURE;
    if (statusCode === 408) return ActivityStatus.TIMEOUT;
    return ActivityStatus.SUCCESS;
  }

  private mapStatusCodeToActivityOutcome(statusCode: number): ActivityOutcome {
    if (statusCode >= 200 && statusCode < 300) return ActivityOutcome.AUTHORIZED;
    if (statusCode === 401) return ActivityOutcome.UNAUTHORIZED;
    if (statusCode === 403) return ActivityOutcome.BLOCKED;
    if (statusCode >= 400) return ActivityOutcome.REJECTED;
    return ActivityOutcome.AUTHORIZED;
  }

  private getAuthAction(path: string): string {
    if (path.includes('/login')) return 'login_attempt';
    if (path.includes('/logout')) return 'logout';
    if (path.includes('/refresh')) return 'token_refresh';
    if (path.includes('/reset')) return 'password_reset';
    if (path.includes('/mfa')) return 'mfa_verification';
    return 'authentication';
  }

  private getClientIP(req: Request): string {
    return (req.get('x-real-ip') || 
            req.get('x-forwarded-for')?.split(',')[0] ||
            req.connection.remoteAddress ||
            req.ip ||
            'unknown').trim();
  }

  private async getGeolocation(ip: string): Promise<GeolocationData | undefined> {
    if (this.ipGeoCache.has(ip)) {
      return this.ipGeoCache.get(ip);
    }

    try {
      // In production, use a real geolocation service
      const mockGeoData: GeolocationData = {
        country: 'US',
        region: 'NY',
        city: 'New York',
        timezone: 'America/New_York'
      };

      this.ipGeoCache.set(ip, mockGeoData);
      return mockGeoData;
    } catch (error: any) {
      return undefined;
    }
  }

  private getDeviceInfo(req: Request): DeviceInfo {
    const userAgent = req.get('user-agent') || '';
    const cacheKey = userAgent;

    if (this.deviceCache.has(cacheKey)) {
      return this.deviceCache.get(cacheKey)!;
    }

    const deviceInfo: DeviceInfo = {
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

  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad|Tablet/i.test(userAgent)) return 'tablet';
      return 'mobile';
    }
    return 'desktop';
  }

  private detectPlatform(userAgent: string): string {
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac/i.test(userAgent)) return 'macOS';
    if (/Linux/i.test(userAgent)) return 'Linux';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iOS|iPhone|iPad/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(userAgent: string): string {
    if (/Chrome/i.test(userAgent)) return 'Chrome';
    if (/Firefox/i.test(userAgent)) return 'Firefox';
    if (/Safari/i.test(userAgent)) return 'Safari';
    if (/Edge/i.test(userAgent)) return 'Edge';
    if (/Opera/i.test(userAgent)) return 'Opera';
    return 'Unknown';
  }

  private detectBrowserVersion(userAgent: string): string {
    const matches = userAgent.match(/(?:Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/i);
    return matches ? matches[1] : 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (/Windows NT 10/i.test(userAgent)) return 'Windows 10';
    if (/Windows NT 6.3/i.test(userAgent)) return 'Windows 8.1';
    if (/Windows NT 6.2/i.test(userAgent)) return 'Windows 8';
    if (/Windows NT 6.1/i.test(userAgent)) return 'Windows 7';
    if (/Mac OS X/i.test(userAgent)) return 'macOS';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iOS/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private detectOSVersion(userAgent: string): string {
    const windowsMatch = userAgent.match(/Windows NT (\d+\.\d+)/i);
    if (windowsMatch) return windowsMatch[1];

    const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/i);
    if (macMatch) return macMatch[1].replace(/_/g, '.');

    const androidMatch = userAgent.match(/Android (\d+\.\d+)/i);
    if (androidMatch) return androidMatch[1];

    const iosMatch = userAgent.match(/OS (\d+_\d+)/i);
    if (iosMatch) return iosMatch[1].replace(/_/g, '.');

    return 'Unknown';
  }

  private generateTags(req: AuthenticatedRequest): string[] {
    const tags: string[] = [];

    tags.push(`method:${req.method.toLowerCase()}`);
    tags.push(`path:${req.path}`);

    if (req.user?.roles?.length) {
      tags.push(...req.user.roles.map((role: any) => `role:${role}`));
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

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  private shouldSkipRoute(path: string): boolean {
    if (this.config.enabledRoutes?.length) {
      return !this.config.enabledRoutes.some(route => path.includes(route));
    }

    if (this.config.disabledRoutes?.length) {
      return this.config.disabledRoutes.some(route => path.includes(route));
    }

    // Skip health check and static asset routes by default
    return /^\/(health|ping|metrics|static|assets)/.test(path);
  }

  private isSensitiveRoute(path: string): boolean {
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

  private isComplianceRoute(path: string): boolean {
    const compliancePatterns = [
      '/compliance',
      '/audit',
      '/regulatory',
      '/report',
      '/filing'
    ];

    return compliancePatterns.some(pattern => path.includes(pattern));
  }

  private initializeRouteClassifications(): void {
    const classifications: RouteClassification[] = [
      { pattern: '/api/auth/*', activityType: ActivityType.AUTHENTICATION, severity: ActivitySeverity.MEDIUM },
      { pattern: '/api/portfolios/*', activityType: ActivityType.PORTFOLIO_ACCESS, severity: ActivitySeverity.LOW },
      { pattern: '/api/trades/*', activityType: ActivityType.TRADING, severity: ActivitySeverity.HIGH },
      { pattern: '/api/reports/*', activityType: ActivityType.REPORTING, severity: ActivitySeverity.LOW },
      { pattern: '/api/admin/*', activityType: ActivityType.SYSTEM_ADMIN, severity: ActivitySeverity.HIGH },
      { pattern: '/api/documents/*', activityType: ActivityType.DOCUMENT_ACCESS, severity: ActivitySeverity.MEDIUM },
      { pattern: '/api/export/*', activityType: ActivityType.DATA_EXPORT, severity: ActivitySeverity.HIGH },
      { pattern: '/api/compliance/*', activityType: ActivityType.COMPLIANCE, severity: ActivitySeverity.HIGH }
    ];

    classifications.forEach(classification => {
      this.routeClassifications.set(classification.pattern, classification);
    });
  }

  private getRouteClassification(path: string): RouteClassification | undefined {
    for (const [pattern, classification] of this.routeClassifications) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      if (new RegExp(regexPattern).test(path)) {
        return classification;
      }
    }
    return undefined;
  }
}

interface RouteClassification {
  pattern: string;
  activityType: ActivityType;
  severity: ActivitySeverity;
}


import { Request, Response, NextFunction } from 'express';
import { ActivityTrackingService, ActivitySeverity } from './ActivityTrackingService';
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
    user?: any;
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
export declare class ActivityCaptureMiddleware {
    private activityService;
    private config;
    private routeClassifications;
    private ipGeoCache;
    private deviceCache;
    constructor(activityService: ActivityTrackingService, config?: MiddlewareConfig);
    captureActivity(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    captureAuthActivity(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    captureBusinessEvent(eventType: string, resource: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    captureSecurityEvent(eventType: string, severity?: ActivitySeverity): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    private captureRequestActivity;
    private captureResponseActivity;
    private captureAuthenticationActivity;
    private createBaseActivity;
    private mapPathToActivityType;
    private mapEventToActivityType;
    private assessBusinessEventSeverity;
    private mapStatusCodeToActivityStatus;
    private mapStatusCodeToActivityOutcome;
    private getAuthAction;
    private getClientIP;
    private getGeolocation;
    private getDeviceInfo;
    private detectDeviceType;
    private detectPlatform;
    private detectBrowser;
    private detectBrowserVersion;
    private detectOS;
    private detectOSVersion;
    private generateTags;
    private sanitizeHeaders;
    private shouldSkipRoute;
    private isSensitiveRoute;
    private isComplianceRoute;
    private initializeRouteClassifications;
    private getRouteClassification;
}

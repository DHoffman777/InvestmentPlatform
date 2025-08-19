import { EventEmitter } from 'events';
export interface ActivityData {
    id: string;
    userId: string;
    tenantId: string;
    sessionId: string;
    activityType: ActivityType;
    activityCategory: ActivityCategory;
    action: string;
    resource: string;
    resourceId?: string;
    metadata: Record<string, any>;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location?: GeolocationData;
    severity: ActivitySeverity;
    tags: string[];
    correlationId?: string;
    parentActivityId?: string;
    duration?: number;
    status: ActivityStatus;
    outcome: ActivityOutcome;
    deviceInfo?: DeviceInfo;
    riskScore?: number;
    sensitiveData: boolean;
    complianceFlags: string[];
}
export declare enum ActivityType {
    AUTHENTICATION = "authentication",
    PORTFOLIO_ACCESS = "portfolio_access",
    PORTFOLIO_MODIFICATION = "portfolio_modification",
    TRADING = "trading",
    REPORTING = "reporting",
    DOCUMENT_ACCESS = "document_access",
    SYSTEM_ADMIN = "system_admin",
    COMPLIANCE = "compliance",
    COMMUNICATION = "communication",
    DATA_EXPORT = "data_export",
    SECURITY = "security",
    API_ACCESS = "api_access"
}
export declare enum ActivityCategory {
    USER_INTERACTION = "user_interaction",
    SYSTEM_EVENT = "system_event",
    SECURITY_EVENT = "security_event",
    BUSINESS_EVENT = "business_event",
    COMPLIANCE_EVENT = "compliance_event",
    ERROR_EVENT = "error_event",
    ADMINISTRATIVE = "administrative"
}
export declare enum ActivitySeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ActivityStatus {
    SUCCESS = "success",
    FAILURE = "failure",
    PARTIAL = "partial",
    TIMEOUT = "timeout",
    CANCELLED = "cancelled",
    PENDING = "pending"
}
export declare enum ActivityOutcome {
    AUTHORIZED = "authorized",
    UNAUTHORIZED = "unauthorized",
    BLOCKED = "blocked",
    FLAGGED = "flagged",
    APPROVED = "approved",
    REJECTED = "rejected",
    ESCALATED = "escalated"
}
export interface GeolocationData {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    timezone: string;
}
export interface DeviceInfo {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    platform: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    screenResolution?: string;
    deviceId?: string;
}
export interface ActivityFilter {
    userId?: string;
    tenantId?: string;
    activityType?: ActivityType[];
    activityCategory?: ActivityCategory[];
    severity?: ActivitySeverity[];
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
    resource?: string;
    tags?: string[];
    riskScoreMin?: number;
    riskScoreMax?: number;
    sensitiveData?: boolean;
    complianceFlags?: string[];
}
export interface ActivitySession {
    sessionId: string;
    userId: string;
    tenantId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    activityCount: number;
    activities: ActivityData[];
    ipAddress: string;
    deviceInfo: DeviceInfo;
    location: GeolocationData;
    isActive: boolean;
    riskScore: number;
    flags: string[];
}
export interface ActivityPattern {
    id: string;
    name: string;
    description: string;
    pattern: string;
    riskLevel: ActivitySeverity;
    actions: string[];
    enabled: boolean;
    matchCount: number;
    lastMatched?: Date;
}
export interface ActivityMetrics {
    totalActivities: number;
    uniqueUsers: number;
    activeSessions: number;
    averageSessionDuration: number;
    topActivities: Array<{
        activity: string;
        count: number;
    }>;
    riskDistribution: Record<ActivitySeverity, number>;
    complianceViolations: number;
    suspiciousActivities: number;
    timeseriesData: Array<{
        timestamp: Date;
        count: number;
        riskScore: number;
    }>;
}
export declare class ActivityTrackingService extends EventEmitter {
    private activities;
    private sessions;
    private patterns;
    private activityBuffer;
    private bufferSize;
    private flushInterval;
    private retentionPeriod;
    private anonymizationRules;
    constructor();
    trackActivity(activityData: Partial<ActivityData>): Promise<ActivityData>;
    getActivities(filter?: ActivityFilter, limit?: number, offset?: number): Promise<ActivityData[]>;
    getUserSessions(userId: string, active?: boolean): Promise<ActivitySession[]>;
    getActivityMetrics(filter?: ActivityFilter): Promise<ActivityMetrics>;
    addPattern(pattern: Omit<ActivityPattern, 'id' | 'matchCount' | 'lastMatched'>): Promise<ActivityPattern>;
    removePattern(patternId: string): Promise<boolean>;
    anonymizeData(data: ActivityData): Promise<ActivityData>;
    setAnonymizationRule(field: string, rule: (data: any) => any): void;
    private calculateRiskScore;
    private checkCompliance;
    private updateSession;
    private checkPatterns;
    private initializePatterns;
    private flushBuffer;
    private startFlushTimer;
    private startCleanupTimer;
    private cleanupOldData;
    private generateTimeseriesData;
    private anonymizeIP;
    private anonymizeLocation;
}

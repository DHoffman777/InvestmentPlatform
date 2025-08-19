import { EventEmitter } from 'events';
import { ActivityData, ActivitySeverity, ActivityType } from './ActivityTrackingService';
export interface AnalyticsReport {
    id: string;
    name: string;
    description: string;
    type: ReportType;
    parameters: Record<string, any>;
    schedule?: ScheduleConfig;
    recipients: string[];
    createdAt: Date;
    lastGenerated?: Date;
    nextGeneration?: Date;
    isActive: boolean;
}
export declare enum ReportType {
    USER_ACTIVITY_SUMMARY = "user_activity_summary",
    SECURITY_ANALYSIS = "security_analysis",
    COMPLIANCE_REPORT = "compliance_report",
    BEHAVIORAL_ANALYSIS = "behavioral_analysis",
    RISK_ASSESSMENT = "risk_assessment",
    TREND_ANALYSIS = "trend_analysis",
    ANOMALY_DETECTION = "anomaly_detection",
    PERFORMANCE_DASHBOARD = "performance_dashboard"
}
export interface ScheduleConfig {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour?: number;
    timezone?: string;
}
export interface UserActivitySummary {
    userId: string;
    tenantId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalActivities: number;
    uniqueSessions: number;
    averageSessionDuration: number;
    activityBreakdown: Record<ActivityType, number>;
    riskProfile: {
        averageRiskScore: number;
        highRiskActivities: number;
        suspiciousPatterns: string[];
    };
    complianceStatus: {
        violations: number;
        flags: string[];
        score: number;
    };
    behaviorPatterns: {
        peakHours: number[];
        preferredDevices: string[];
        commonLocations: string[];
    };
    trends: {
        activityGrowth: number;
        riskTrend: 'increasing' | 'decreasing' | 'stable';
        complianceTrend: 'improving' | 'declining' | 'stable';
    };
}
export interface SecurityAnalysis {
    period: {
        startDate: Date;
        endDate: Date;
    };
    overview: {
        totalSecurityEvents: number;
        criticalThreats: number;
        blockedAttempts: number;
        resolvedIncidents: number;
    };
    threatAnalysis: {
        topThreats: Array<{
            type: string;
            count: number;
            severity: ActivitySeverity;
        }>;
        attackVectors: Array<{
            vector: string;
            attempts: number;
        }>;
        geographicDistribution: Record<string, number>;
    };
    userRiskAnalysis: {
        highRiskUsers: Array<{
            userId: string;
            riskScore: number;
            reasons: string[];
        }>;
        suspiciousPatterns: Array<{
            pattern: string;
            occurrences: number;
            users: string[];
        }>;
    };
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
}
export interface BehaviorAnalysis {
    userId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    baselineProfile: {
        normalHours: number[];
        typicalDevices: string[];
        commonLocations: string[];
        averageSessionDuration: number;
        typicalActivities: ActivityType[];
    };
    currentProfile: {
        actualHours: number[];
        devicesUsed: string[];
        locationsAccessed: string[];
        sessionDuration: number;
        activitiesPerformed: ActivityType[];
    };
    deviations: {
        timePatternDeviation: number;
        locationDeviation: number;
        deviceDeviation: number;
        activityDeviation: number;
        overallDeviationScore: number;
    };
    anomalies: Array<{
        type: string;
        description: string;
        severity: ActivitySeverity;
        confidence: number;
        timestamp: Date;
    }>;
}
export interface TrendAnalysis {
    period: {
        startDate: Date;
        endDate: Date;
    };
    activityTrends: {
        total: Array<{
            date: Date;
            count: number;
        }>;
        byType: Record<ActivityType, Array<{
            date: Date;
            count: number;
        }>>;
        byHour: Array<{
            hour: number;
            count: number;
        }>;
        byDayOfWeek: Array<{
            day: number;
            count: number;
        }>;
    };
    userTrends: {
        activeUsers: Array<{
            date: Date;
            count: number;
        }>;
        newUsers: Array<{
            date: Date;
            count: number;
        }>;
        userRetention: Array<{
            date: Date;
            rate: number;
        }>;
    };
    securityTrends: {
        riskScores: Array<{
            date: Date;
            average: number;
            max: number;
        }>;
        suspiciousActivities: Array<{
            date: Date;
            count: number;
        }>;
        complianceViolations: Array<{
            date: Date;
            count: number;
        }>;
    };
    predictions: {
        nextPeriodActivity: number;
        riskTrend: 'increasing' | 'decreasing' | 'stable';
        seasonalPatterns: Array<{
            pattern: string;
            strength: number;
        }>;
    };
}
export interface AnomalyDetectionResult {
    period: {
        startDate: Date;
        endDate: Date;
    };
    anomalies: Array<{
        id: string;
        type: AnomalyType;
        description: string;
        severity: ActivitySeverity;
        confidence: number;
        timestamp: Date;
        affectedUsers: string[];
        relatedActivities: string[];
        context: Record<string, any>;
        status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
    }>;
    statistics: {
        totalAnomalies: number;
        byType: Record<AnomalyType, number>;
        bySeverity: Record<ActivitySeverity, number>;
        detectionAccuracy: number;
        falsePositiveRate: number;
    };
    recommendations: string[];
}
export declare enum AnomalyType {
    UNUSUAL_ACTIVITY_VOLUME = "unusual_activity_volume",
    OFF_HOURS_ACCESS = "off_hours_access",
    GEOGRAPHIC_ANOMALY = "geographic_anomaly",
    DEVICE_ANOMALY = "device_anomaly",
    BEHAVIORAL_CHANGE = "behavioral_change",
    PRIVILEGE_ESCALATION = "privilege_escalation",
    DATA_EXFILTRATION = "data_exfiltration",
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt"
}
export declare class ActivityAnalyticsService extends EventEmitter {
    private reports;
    private userBaselines;
    private anomalies;
    private reportCache;
    private cacheTimeout;
    constructor();
    generateUserActivitySummary(userId: string, tenantId: string, startDate: Date, endDate: Date, activities: ActivityData[]): Promise<UserActivitySummary>;
    generateSecurityAnalysis(tenantId: string, startDate: Date, endDate: Date, activities: ActivityData[]): Promise<SecurityAnalysis>;
    generateBehaviorAnalysis(userId: string, startDate: Date, endDate: Date, activities: ActivityData[]): Promise<BehaviorAnalysis>;
    generateTrendAnalysis(tenantId: string, startDate: Date, endDate: Date, activities: ActivityData[]): Promise<TrendAnalysis>;
    detectAnomalies(tenantId: string, startDate: Date, endDate: Date, activities: ActivityData[]): Promise<AnomalyDetectionResult>;
    createReport(report: Omit<AnalyticsReport, 'id' | 'createdAt'>): Promise<AnalyticsReport>;
    updateReport(reportId: string, updates: Partial<AnalyticsReport>): Promise<AnalyticsReport | null>;
    deleteReport(reportId: string): Promise<boolean>;
    getReports(tenantId?: string): Promise<AnalyticsReport[]>;
    private groupActivitiesBySessions;
    private calculateActivityBreakdown;
    private calculateRiskProfile;
    private calculateComplianceStatus;
    private analyzeBehaviorPatterns;
    private calculateTrends;
    private calculateSecurityOverview;
    private analyzeThreatPatterns;
    private analyzeUserRisks;
    private generateSecurityRecommendations;
    private getUserBaseline;
    private calculateCurrentProfile;
    private calculateDeviations;
    private detectBehavioralAnomalies;
    private calculateActivityTrends;
    private calculateUserTrends;
    private calculateSecurityTrends;
    private generatePredictions;
    private detectVolumeAnomalies;
    private detectTimeAnomalies;
    private detectGeographicAnomalies;
    private detectBehaviorAnomalies;
    private calculateAnomalyStatistics;
    private generateAnomalyRecommendations;
    private initializePredefinedReports;
    private startScheduledReports;
    private processScheduledReports;
    private shouldGenerateReport;
    private generateScheduledReport;
    private calculateNextGeneration;
    private scheduleReport;
    private getCachedData;
    private setCachedData;
    private calculateAverageSessionDuration;
}

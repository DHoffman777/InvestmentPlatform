import { EventEmitter } from 'events';
import { Server as HTTPServer } from 'http';
import { ActivityData, ActivityFilter, ActivitySeverity, ActivityType } from './ActivityTrackingService';
export interface StreamSubscription {
    id: string;
    userId: string;
    tenantId: string;
    filter: ActivityFilter;
    socketId: string;
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
    isActive: boolean;
}
export interface StreamMessage {
    id: string;
    type: StreamMessageType;
    timestamp: Date;
    data: any;
    subscriptionId: string;
    correlationId?: string;
}
export declare enum StreamMessageType {
    ACTIVITY_CREATED = "activity_created",
    ACTIVITY_UPDATED = "activity_updated",
    PATTERN_MATCHED = "pattern_matched",
    SUSPICIOUS_ACTIVITY = "suspicious_activity",
    COMPLIANCE_VIOLATION = "compliance_violation",
    SESSION_STARTED = "session_started",
    SESSION_ENDED = "session_ended",
    SYSTEM_ALERT = "system_alert",
    REAL_TIME_METRICS = "real_time_metrics"
}
export interface RealTimeMetrics {
    timestamp: Date;
    activeUsers: number;
    activeSessions: number;
    activitiesPerMinute: number;
    suspiciousActivitiesPerMinute: number;
    topActivityTypes: Array<{
        type: ActivityType;
        count: number;
    }>;
    riskDistribution: Record<ActivitySeverity, number>;
    complianceViolations: number;
}
export interface StreamingConfig {
    enableRealTimeMetrics: boolean;
    metricsInterval: number;
    maxSubscriptionsPerUser: number;
    messageRetentionTime: number;
    enableMessagePersistence: boolean;
    enableCompression: boolean;
    rateLimitPerMinute: number;
}
export declare class ActivityStreamingService extends EventEmitter {
    private io;
    private subscriptions;
    private userSubscriptions;
    private messageBuffer;
    private metricsInterval;
    private config;
    private rateLimitMap;
    private getErrorMessage;
    constructor(httpServer: HTTPServer, config?: Partial<StreamingConfig>);
    subscribe(userId: string, tenantId: string, socketId: string, filter?: ActivityFilter): Promise<StreamSubscription>;
    unsubscribe(subscriptionId: string): Promise<boolean>;
    broadcastActivity(activity: ActivityData): Promise<any>;
    broadcastPatternMatch(pattern: any, activity: ActivityData): Promise<any>;
    broadcastSuspiciousActivity(activity: ActivityData): Promise<any>;
    broadcastComplianceViolation(activity: ActivityData): Promise<any>;
    broadcastSystemAlert(alertType: string, data: any): Promise<any>;
    getSubscriptionStats(): Promise<{
        totalSubscriptions: number;
        activeSubscriptions: number;
        subscriptionsByUser: Record<string, number>;
        messagesSent: number;
    }>;
    getSubscription(subscriptionId: string): Promise<StreamSubscription | undefined>;
    getUserSubscriptions(userId: string): Promise<StreamSubscription[]>;
    getMessageHistory(subscriptionId: string, limit?: number): Promise<StreamMessage[]>;
    private setupSocketHandlers;
    private sendMessage;
    private findMatchingSubscriptions;
    private matchesFilter;
    private isComplianceSubscription;
    private checkRateLimit;
    private startMetricsStreaming;
    private generateRealTimeMetrics;
    private broadcastMetrics;
    private cleanupSocketSubscriptions;
    private startCleanupTimer;
    private cleanupInactiveSubscriptions;
    private cleanupRateLimit;
    stop(): void;
}

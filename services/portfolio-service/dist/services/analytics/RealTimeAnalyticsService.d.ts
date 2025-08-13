import { AnalyticsMetricType, AnalyticsConfiguration } from '../../models/analytics/Analytics';
interface MetricThreshold {
    id: string;
    tenantId: string;
    metricType: AnalyticsMetricType;
    entityId: string;
    entityType: 'portfolio' | 'position' | 'client' | 'tenant';
    thresholdType: 'absolute' | 'percentage' | 'variance';
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between';
    value: number | {
        min: number;
        max: number;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    isActive: boolean;
    description: string;
    createdBy: string;
    createdAt: Date;
}
interface StreamingConnection {
    id: string;
    tenantId: string;
    userId: string;
    dashboardId?: string;
    visualizationIds: string[];
    subscribedMetrics: AnalyticsMetricType[];
    connectionType: 'websocket' | 'sse' | 'webhook';
    endpoint?: string;
    lastActivity: Date;
    isActive: boolean;
}
interface PerformanceMetrics {
    updateFrequency: number;
    averageLatency: number;
    connectionCount: number;
    errorRate: number;
    throughput: number;
    lastUpdated: Date;
}
export declare class RealTimeAnalyticsService {
    private eventPublisher;
    private connections;
    private thresholds;
    private performanceMetrics;
    private updateIntervals;
    constructor();
    startRealTimeStream(tenantId: string, userId: string, config: {
        dashboardId?: string;
        visualizationIds?: string[];
        metricTypes?: AnalyticsMetricType[];
        connectionType: 'websocket' | 'sse' | 'webhook';
        endpoint?: string;
        refreshInterval?: number;
    }): Promise<StreamingConnection>;
    stopRealTimeStream(connectionId: string): Promise<void>;
    createMetricThreshold(threshold: Omit<MetricThreshold, 'id' | 'createdAt'>): Promise<MetricThreshold>;
    updateMetricThreshold(thresholdId: string, updates: Partial<MetricThreshold>): Promise<MetricThreshold>;
    deleteMetricThreshold(thresholdId: string): Promise<void>;
    getActiveConnections(tenantId?: string): Promise<StreamingConnection[]>;
    getThresholds(tenantId: string, entityId?: string): Promise<MetricThreshold[]>;
    processMetricUpdate(tenantId: string, metricType: AnalyticsMetricType, entityId: string, entityType: string, currentValue: number, previousValue?: number): Promise<void>;
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    configureRealTimeSettings(tenantId: string, config: Partial<AnalyticsConfiguration>): Promise<AnalyticsConfiguration>;
    private processRealtimeUpdates;
    private generateRealtimeData;
    private checkThresholdBreach;
    private handleThresholdBreach;
    private sendUpdateToConnection;
    private sendWebSocketUpdate;
    private sendSSEUpdate;
    private sendWebhookUpdate;
    private updatePerformanceMetrics;
    private initializeRealTimeProcessing;
    private cleanupInactiveConnections;
    private getRealTimeConfiguration;
    private saveRealTimeConfiguration;
    private saveAnalyticsEvent;
}
export {};

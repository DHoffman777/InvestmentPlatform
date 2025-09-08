export const __esModule: boolean;
export class RealTimeAnalyticsService {
    constructor(eventPublisher: any);
    eventPublisher: any;
    connections: Map<any, any>;
    thresholds: Map<any, any>;
    performanceMetrics: {
        updateFrequency: number;
        averageLatency: number;
        connectionCount: number;
        errorRate: number;
        throughput: number;
        lastUpdated: Date;
    };
    updateIntervals: Map<any, any>;
    startRealTimeStream(tenantId: any, userId: any, config: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        userId: any;
        dashboardId: any;
        visualizationIds: any;
        subscribedMetrics: any;
        connectionType: any;
        endpoint: any;
        lastActivity: Date;
        isActive: boolean;
    }>;
    stopRealTimeStream(connectionId: any): Promise<void>;
    createMetricThreshold(threshold: any): Promise<any>;
    updateMetricThreshold(thresholdId: any, updates: any): Promise<any>;
    deleteMetricThreshold(thresholdId: any): Promise<void>;
    getActiveConnections(tenantId: any): Promise<any[]>;
    getThresholds(tenantId: any, entityId: any): Promise<any[]>;
    processMetricUpdate(tenantId: any, metricType: any, entityId: any, entityType: any, currentValue: any, previousValue: any): Promise<void>;
    getPerformanceMetrics(): Promise<{
        updateFrequency: number;
        averageLatency: number;
        connectionCount: number;
        errorRate: number;
        throughput: number;
        lastUpdated: Date;
    }>;
    configureRealTimeSettings(tenantId: any, config: any): Promise<any>;
    processRealtimeUpdates(connectionId: any): Promise<void>;
    generateRealtimeData(metricType: any, tenantId: any): Promise<({
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            change: number;
            changePercent: number;
            confidence?: undefined;
            method?: undefined;
            benchmark?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            confidence: number;
            method: string;
            change?: undefined;
            changePercent?: undefined;
            benchmark?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            benchmark: string;
            change?: undefined;
            changePercent?: undefined;
            confidence?: undefined;
            method?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: any;
        metadata: {
            change?: undefined;
            changePercent?: undefined;
            confidence?: undefined;
            method?: undefined;
            benchmark?: undefined;
        };
    })[]>;
    checkThresholdBreach(value: any, threshold: any): boolean;
    handleThresholdBreach(threshold: any, currentValue: any, previousValue: any): Promise<void>;
    sendUpdateToConnection(connection: any, update: any): Promise<void>;
    sendWebSocketUpdate(connection: any, update: any): Promise<void>;
    sendSSEUpdate(connection: any, update: any): Promise<void>;
    sendWebhookUpdate(connection: any, update: any): Promise<void>;
    updatePerformanceMetrics(): void;
    initializeRealTimeProcessing(): void;
    cleanupInactiveConnections(): void;
    getRealTimeConfiguration(tenantId: any): Promise<{
        tenantId: any;
        realTimeEnabled: boolean;
        refreshIntervals: {
            metrics: number;
            visualizations: number;
            dashboards: number;
            predictions: number;
        };
        dataRetention: {
            rawData: number;
            aggregatedData: number;
            predictions: number;
            anomalies: number;
        };
        machineLearning: {
            enabled: boolean;
            autoRetrain: boolean;
            retrainFrequency: number;
            predictionHorizon: number;
            confidenceThreshold: number;
        };
        anomalyDetection: {
            enabled: boolean;
            sensitivity: string;
            methods: string[];
            alertThreshold: number;
        };
        businessIntelligence: {
            enabled: boolean;
            autoGenerateReports: boolean;
            reportFrequency: string;
            insightCategories: string[];
        };
        integrations: {};
    }>;
    saveRealTimeConfiguration(tenantId: any, config: any): Promise<void>;
    saveAnalyticsEvent(event: any): Promise<void>;
    getRecentEvents(tenantId: any, options: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        eventType: string;
        metricType: string;
        entityId: string;
        entityType: string;
        severity: string;
        timestamp: Date;
        data: {
            performance: number;
            benchmark: number;
            source: string;
        };
        processed: boolean;
        createdAt: Date;
    }[]>;
    configureAlertThresholds(tenantId: any, thresholds: any, createdBy: any): Promise<any>;
}

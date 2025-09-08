import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { MetricValue, MetricAlert, AlertSeverity } from './BusinessMetricsDataModel';
export interface StreamingConfig {
    port: number;
    maxConnections: number;
    heartbeatInterval: number;
    bufferSize: number;
    compressionEnabled: boolean;
    rateLimitPerClient: number;
    authenticationRequired: boolean;
}
export interface StreamSubscription {
    id: string;
    clientId: string;
    tenantId: string;
    userId: string;
    metricIds: string[];
    kpiIds: string[];
    filters: StreamFilter[];
    aggregationLevel: 'raw' | 'minute' | 'hour' | 'day';
    maxUpdateFrequency: number;
    isActive: boolean;
    createdAt: Date;
    lastUpdated: Date;
}
export interface StreamFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
}
export interface StreamMessage {
    type: 'metric_update' | 'kpi_update' | 'alert' | 'heartbeat' | 'error' | 'subscription_status';
    timestamp: Date;
    subscriptionId?: string;
    payload: any;
    sequenceNumber: number;
}
export interface StreamClient {
    id: string;
    socket: WebSocket;
    tenantId: string;
    userId: string;
    subscriptions: Set<string>;
    isAuthenticated: boolean;
    lastHeartbeat: Date;
    connectedAt: Date;
    messageCount: number;
    bytesTransferred: number;
    rateLimitBucket: number;
    rateLimitLastRefill: Date;
}
export interface MetricStreamData {
    metricId: string;
    subscriptionId: string;
    current: MetricValue;
    previous?: MetricValue;
    change: {
        absolute: number;
        percentage: number;
        trend: 'up' | 'down' | 'stable';
    };
    aggregation?: {
        period: string;
        value: number;
        count: number;
    };
}
export interface KPIStreamData {
    kpiId: string;
    subscriptionId: string;
    name: string;
    current: number;
    target?: number;
    status: 'on_track' | 'at_risk' | 'off_track';
    change: {
        absolute: number;
        percentage: number;
        period: string;
    };
    components: ComponentMetric[];
}
export interface ComponentMetric {
    metricId: string;
    name: string;
    value: number;
    weight: number;
    contribution: number;
}
export interface AlertStreamData {
    alertId: string;
    subscriptionId: string;
    type: 'threshold' | 'anomaly' | 'trend' | 'missing_data';
    severity: AlertSeverity;
    message: string;
    metricId?: string;
    kpiId?: string;
    currentValue: number;
    threshold?: number;
    triggeredAt: Date;
    context: Record<string, any>;
}
export declare class RealTimeMetricsStreaming extends EventEmitter {
    private config;
    private server;
    private clients;
    private subscriptions;
    private metricBuffer;
    private sequenceCounter;
    private aggregationCache;
    private heartbeatTimer;
    private cleanupTimer;
    constructor(config: StreamingConfig);
    private setupWebSocketServer;
    private createClient;
    private handleClientConnection;
    private handleClientMessage;
    private handleAuthentication;
    private handleSubscription;
    private handleUnsubscription;
    private createSubscription;
    private sendInitialData;
    publishMetricUpdate(metricValue: MetricValue): Promise<any>;
    publishKPIUpdate(kpiId: string, kpiData: KPIStreamData): Promise<any>;
    publishAlert(alert: MetricAlert): Promise<any>;
    private sendMessage;
    private sendError;
    private handleClientDisconnection;
    private checkRateLimit;
    private validateAuthentication;
    private addToBuffer;
    private getLatestMetricValue;
    private getPreviousMetricValue;
    private getLatestKPIValue;
    private calculateChange;
    private matchesFilters;
    private getFieldValue;
    private evaluateFilter;
    private getAggregation;
    private startHeartbeat;
    private startCleanupTimer;
    private cleanupInactiveClients;
    private cleanupBuffers;
    private cleanupAggregationCache;
    private getNextSequenceNumber;
    private generateClientId;
    private generateSubscriptionId;
    getConnectedClients(): number;
    getActiveSubscriptions(): number;
    getServerStats(): any;
    shutdown(): Promise<any>;
}

/**
 * Investment Platform Application Performance Monitor (APM)
 * Comprehensive performance monitoring and observability for financial services
 */
export class PerformanceMonitor {
    metrics: {
        http: {
            requests: Map<any, any>;
            responses: Map<any, any>;
            errors: Map<any, any>;
            latency: any[];
            throughput: number;
        };
        database: {
            queries: Map<any, any>;
            connections: number;
            poolSize: number;
            latency: any[];
            errors: Map<any, any>;
        };
        system: {
            cpu: any[];
            memory: any[];
            disk: any[];
            network: any[];
        };
        business: {
            trades: number;
            portfolioUpdates: number;
            userSessions: number;
            apiCalls: Map<any, any>;
            financialTransactions: number;
        };
        alerts: any[];
        traces: Map<any, any>;
    };
    config: {
        collection: {
            interval: number;
            retention: number;
            batchSize: number;
        };
        thresholds: {
            httpLatency: number;
            dbLatency: number;
            cpuUsage: number;
            memoryUsage: number;
            errorRate: number;
            diskUsage: number;
        };
        sampling: {
            traces: number;
            slowQueries: number;
        };
        integrations: {
            prometheus: boolean;
            grafana: boolean;
            datadog: boolean;
            newrelic: boolean;
        };
    };
    startTime: number;
    collectionTimer: NodeJS.Timeout;
    isCollecting: boolean;
    initializeMonitoring(): void;
    getHttpMonitoringMiddleware(): (req: any, res: any, next: any) => void;
    recordHttpMetrics(metrics: any): void;
    recordBusinessMetrics(req: any, res: any): void;
    initializeDatabaseMonitoring(): void;
    recordDatabaseMetrics(metrics: any): void;
    startSystemMetricsCollection(): void;
    collectSystemMetrics(): Promise<void>;
    getCpuUsage(): Promise<any>;
    getMemoryUsage(): {
        process: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
        };
        system: {
            total: number;
            free: number;
            used: number;
        };
        usagePercent: number;
    };
    getDiskUsage(): Promise<{
        total: string;
        used: string;
        free: string;
        usagePercent: number;
    }>;
    getNetworkUsage(): Promise<{
        bytesReceived: number;
        bytesTransmitted: number;
    }>;
    checkSystemThresholds(metrics: any): void;
    initializeTracing(): void;
    generateTraceId(): string;
    initializeAlerting(): void;
    createAlert(alert: any): void;
    processAlerts(): void;
    groupAlerts(alerts: any): Map<any, any>;
    sendImmediateAlert(alert: any): Promise<void>;
    sendAlertNotification(type: any, alerts: any): Promise<void>;
    maintainMetricsWindow(): void;
    getPerformanceSummary(): {
        timestamp: number;
        uptime: number;
        http: {
            totalRequests: any;
            totalErrors: any;
            errorRate: string;
            avgLatency: string;
            throughput: number;
        };
        system: {
            cpu: any;
            memory: any;
            loadAverage: any;
        };
        business: {
            trades: number;
            portfolioUpdates: number;
            financialTransactions: number;
            activeSessions: number;
        };
        alerts: {
            total: number;
            unresolved: number;
            critical: number;
        };
    };
    calculateThroughput(): number;
    normalizeUrl(url: any): any;
    exportMetrics(format?: string): string;
    exportPrometheusMetrics(): string;
    generateReport(): Promise<string>;
    shutdown(): void;
}
export function initializeAPM(config?: {}): any;
export function getAPM(): any;

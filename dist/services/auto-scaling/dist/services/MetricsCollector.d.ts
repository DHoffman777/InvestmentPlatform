export const __esModule: boolean;
export class MetricsCollector extends events_1<[never]> {
    constructor(config: any);
    config: any;
    metricsCache: Map<any, any>;
    lastCollectionTime: Date;
    start(): void;
    collectionInterval: NodeJS.Timeout;
    stop(): void;
    collectAllMetrics(): Promise<void>;
    getMonitoredServices(): any[];
    collectServiceMetrics(serviceName: any): Promise<{
        serviceName: any;
        timestamp: Date;
        instances: {
            current: number;
            desired: number;
            healthy: number;
            unhealthy: number;
        };
        resources: {
            cpu: {
                usage: number;
                request: number;
                limit: number;
            };
            memory: {
                usage: number;
                request: number;
                limit: number;
            };
            network: {
                inbound: number;
                outbound: number;
            };
        };
        performance: {
            responseTime: number;
            throughput: number;
            errorRate: number;
            queueLength: number;
        };
        customMetrics: {};
    }>;
    getInstanceMetrics(serviceName: any): Promise<{
        current: number;
        desired: number;
        healthy: number;
        unhealthy: number;
    }>;
    getResourceMetrics(serviceName: any): Promise<{
        cpu: {
            usage: number;
            request: number;
            limit: number;
        };
        memory: {
            usage: number;
            request: number;
            limit: number;
        };
        network: {
            inbound: number;
            outbound: number;
        };
    }>;
    getPerformanceMetrics(serviceName: any): Promise<{
        responseTime: number;
        throughput: number;
        errorRate: number;
        queueLength: number;
    }>;
    getCustomMetrics(serviceName: any): Promise<{}>;
    queryPrometheusMetric(query: any): Promise<number>;
    evaluateMetricSource(source: any): Promise<{
        value: number;
        thresholdMet: boolean;
        timestamp: Date;
    }>;
    evaluateThreshold(value: any, threshold: any, comparison: any): boolean;
    getServiceMetrics(serviceName: any): any;
    getAllMetrics(): Map<any, any>;
    getLastCollectionTime(): Date;
    validateMetricsHealth(): Promise<{
        healthy: boolean;
        issues: string[];
        lastCollection: Date;
        servicesMonitored: number;
    }>;
}
import events_1 = require("events");

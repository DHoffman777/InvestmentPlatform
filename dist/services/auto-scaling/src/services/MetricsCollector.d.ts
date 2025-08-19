import { EventEmitter } from 'events';
import { ServiceMetrics, MetricSource, AutoScalingServiceConfig } from '../types';
export declare class MetricsCollector extends EventEmitter {
    private config;
    private collectionInterval?;
    private metricsCache;
    private lastCollectionTime;
    constructor(config: AutoScalingServiceConfig);
    start(): void;
    stop(): void;
    private collectAllMetrics;
    private getMonitoredServices;
    private collectServiceMetrics;
    private getInstanceMetrics;
    private getResourceMetrics;
    private getPerformanceMetrics;
    private getCustomMetrics;
    queryPrometheusMetric(query: string): Promise<number>;
    evaluateMetricSource(source: MetricSource): Promise<{
        value: number;
        thresholdMet: boolean;
        timestamp: Date;
    }>;
    private evaluateThreshold;
    getServiceMetrics(serviceName: string): ServiceMetrics | undefined;
    getAllMetrics(): Map<string, ServiceMetrics>;
    getLastCollectionTime(): Date;
    validateMetricsHealth(): Promise<{
        healthy: boolean;
        issues: string[];
        lastCollection: Date;
        servicesMonitored: number;
    }>;
}

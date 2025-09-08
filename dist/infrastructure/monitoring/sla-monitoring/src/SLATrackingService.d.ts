import { EventEmitter } from 'events';
import { SLADefinition, SLAMeasurementPoint, SLAMetric } from './SLADataModel';
export interface SLATrackingConfig {
    refreshInterval: number;
    batchSize: number;
    maxRetries: number;
    timeoutMs: number;
    enableRealTimeTracking: boolean;
    enableTrendAnalysis: boolean;
    dataRetentionDays: number;
    aggregationIntervals: number[];
    validationRules: SLAValidationRule[];
}
export interface SLAValidationRule {
    field: string;
    rule: 'min' | 'max' | 'range' | 'pattern' | 'custom';
    value: any;
    errorMessage: string;
}
export interface SLACalculationContext {
    sla: SLADefinition;
    timeWindow: {
        start: Date;
        end: Date;
    };
    measurements: SLAMeasurementPoint[];
    excludedPeriods: Array<{
        start: Date;
        end: Date;
        reason: string;
    }>;
}
export interface SLADataSource {
    id: string;
    name: string;
    type: 'prometheus' | 'influxdb' | 'elasticsearch' | 'custom' | 'database';
    configuration: Record<string, any>;
    isActive: boolean;
}
export interface SLAAggregationResult {
    value: number;
    count: number;
    min: number;
    max: number;
    average: number;
    percentile95: number;
    percentile99: number;
    standardDeviation: number;
}
export declare class SLATrackingService extends EventEmitter {
    private slas;
    private metrics;
    private measurementPoints;
    private dataSources;
    private trackingIntervals;
    private config;
    private calculationQueue;
    private isProcessingQueue;
    constructor(config: SLATrackingConfig);
    registerSLA(sla: SLADefinition): Promise<any>;
    unregisterSLA(slaId: string): Promise<any>;
    startTracking(slaId: string): Promise<any>;
    stopTracking(slaId: string): Promise<any>;
    collectMeasurement(slaId: string): Promise<SLAMeasurementPoint>;
    calculateSLAMetric(slaId: string, timeWindow?: {
        start: Date;
        end: Date;
    }): Promise<SLAMetric>;
    getMeasurements(slaId: string, timeWindow: {
        start: Date;
        end: Date;
    }): Promise<SLAMeasurementPoint[]>;
    getMetric(slaId: string): Promise<SLAMetric | null>;
    getAllMetrics(): Promise<SLAMetric[]>;
    getMetricsByService(serviceId: string): Promise<SLAMetric[]>;
    getSLAHistory(slaId: string, timeWindow: {
        start: Date;
        end: Date;
    }, aggregationInterval?: number): Promise<SLAMetric[]>;
    recalculate(slaId: string): Promise<any>;
    recalculateAll(): Promise<any>;
    private queryDataSource;
    private queryPrometheus;
    private queryInfluxDB;
    private queryElasticsearch;
    private queryDatabase;
    private simulateMetricValue;
    private aggregateValues;
    private calculateCompliancePercentage;
    private determineStatus;
    private calculateTrends;
    private identifyBreaches;
    private getDefaultTimeWindow;
    private createEmptyMetric;
    private getExcludedPeriods;
    private validateSLA;
    private validateMeasurement;
    private queueCalculation;
    private startQueueProcessor;
    private initializeDataSources;
    private generateMeasurementId;
    shutdown(): Promise<any>;
}

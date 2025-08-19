import { EventEmitter } from 'events';
import { MetricDefinition, MetricValue, ValidationRule } from './BusinessMetricsDataModel';
export interface CollectionConfig {
    batchSize: number;
    flushInterval: number;
    maxRetries: number;
    retryBackoff: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    deadLetterQueueEnabled: boolean;
}
export interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'api' | 'file' | 'stream' | 'webhook';
    connectionConfig: Record<string, any>;
    authentication?: AuthConfig;
    rateLimit?: RateLimitConfig;
    isEnabled: boolean;
}
export interface AuthConfig {
    type: 'bearer' | 'basic' | 'oauth2' | 'api_key' | 'certificate';
    credentials: Record<string, any>;
    refreshToken?: string;
    expiresAt?: Date;
}
export interface RateLimitConfig {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
}
export interface CollectionJob {
    id: string;
    metricId: string;
    dataSource: DataSource;
    schedule: string;
    query: string;
    parameters: Record<string, any>;
    transformations: DataTransformation[];
    validations: ValidationRule[];
    isEnabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
    status: 'idle' | 'running' | 'failed' | 'completed';
    errorCount: number;
    lastError?: string;
}
export interface DataTransformation {
    type: 'map' | 'filter' | 'aggregate' | 'join' | 'pivot' | 'unpivot' | 'calculate';
    configuration: Record<string, any>;
    order: number;
}
export interface CollectionResult {
    jobId: string;
    metricId: string;
    success: boolean;
    recordsProcessed: number;
    recordsInserted: number;
    recordsSkipped: number;
    recordsErrored: number;
    startTime: Date;
    endTime: Date;
    duration: number;
    errors: CollectionError[];
    warnings: string[];
    dataQualityScore: number;
}
export interface CollectionError {
    type: 'connection' | 'query' | 'transformation' | 'validation' | 'storage';
    message: string;
    context?: Record<string, any>;
    timestamp: Date;
    isRetryable: boolean;
}
export declare class MetricsCollectionPipeline extends EventEmitter {
    private jobs;
    private activeJobs;
    private config;
    private dataSources;
    private metricDefinitions;
    private calculations;
    private collectionResults;
    private deadLetterQueue;
    private rateLimiters;
    constructor(config: CollectionConfig);
    registerDataSource(dataSource: DataSource): Promise<void>;
    registerMetricDefinition(metric: MetricDefinition): Promise<void>;
    createCollectionJob(job: CollectionJob): Promise<void>;
    executeJob(jobId: string): Promise<CollectionResult>;
    collectData(job: CollectionJob): Promise<any[]>;
    private collectFromDatabase;
    private collectFromAPI;
    private collectFromFile;
    private collectFromStream;
    private collectFromWebhook;
    transformData(data: any[], transformations: DataTransformation[]): Promise<any>;
    private mapTransformation;
    private filterTransformation;
    private aggregateTransformation;
    private calculateTransformation;
    validateData(data: any, validations: ValidationRule[]): Promise<any[]>;
    private executeValidation;
    convertToMetricValues(data: any[], metricId: string): Promise<MetricValue[]>;
    storeMetricValues(values: MetricValue[]): Promise<number>;
    private createBatches;
    private calculateDataQualityScore;
    private calculateItemDataQuality;
    private extractTimestamp;
    private extractValue;
    private extractDimensions;
    private getNestedValue;
    private evaluateCondition;
    private calculateAggregation;
    private evaluateFormula;
    private buildAPIUrl;
    private buildAPIHeaders;
    private validateDataSourceConnection;
    private calculateNextRun;
    private isRetryableError;
    private storeCollectionResult;
    private startScheduler;
    private processScheduledJobs;
    getJobStatus(jobId: string): CollectionJob | null;
    getJobResults(jobId: string, limit?: number): CollectionResult[];
    getActiveJobs(): string[];
    getDeadLetterQueue(): CollectionJob[];
}

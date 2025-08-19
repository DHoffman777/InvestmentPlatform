import { AnomalyDetection, AnalyticsMetricType, AnalyticsDataPoint } from '../../models/analytics/Analytics';
interface AnomalyDetectionRequest {
    tenantId: string;
    entityId: string;
    entityType: 'portfolio' | 'position' | 'market';
    metricType: AnalyticsMetricType;
    data: AnalyticsDataPoint[];
    detectionMethods?: AnomalyDetection['detectionMethod'][];
    sensitivity?: 'low' | 'medium' | 'high';
    historicalWindow?: number;
}
interface AnomalyDetectionConfig {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    methods: AnomalyDetection['detectionMethod'][];
    thresholds: {
        statistical: number;
        isolation_forest: number;
        lstm_autoencoder: number;
        local_outlier_factor: number;
        one_class_svm: number;
    };
    minDataPoints: number;
    alertThreshold: number;
}
interface StatisticalAnomalyResult {
    isAnomaly: boolean;
    score: number;
    zScore: number;
    confidence: number;
    baseline: {
        mean: number;
        standardDeviation: number;
        median: number;
        iqr: number;
    };
}
interface IsolationForestResult {
    isAnomaly: boolean;
    score: number;
    confidence: number;
    outlierFactor: number;
    featureContributions: Record<string, number>;
}
interface LSTMAutoencoderResult {
    isAnomaly: boolean;
    score: number;
    reconstructionError: number;
    confidence: number;
    sequencePattern: 'normal' | 'anomalous' | 'uncertain';
}
export declare class AnomalyDetectionService {
    private eventPublisher;
    private anomalies;
    private detectionConfigs;
    private modelCache;
    private defaultConfig;
    constructor();
    detectAnomalies(request: AnomalyDetectionRequest): Promise<AnomalyDetection[]>;
    runStatisticalAnomalyDetection(data: AnalyticsDataPoint[], sensitivity?: 'low' | 'medium' | 'high'): Promise<StatisticalAnomalyResult>;
    runIsolationForestDetection(data: AnalyticsDataPoint[], features?: string[], contamination?: number): Promise<IsolationForestResult>;
    runLSTMAutoencoderDetection(data: AnalyticsDataPoint[], sequenceLength?: number, threshold?: number): Promise<LSTMAutoencoderResult>;
    monitorRealTimeAnomalies(tenantId: string, entityId: string, metricType: AnalyticsMetricType, newDataPoint: AnalyticsDataPoint, historicalData: AnalyticsDataPoint[]): Promise<AnomalyDetection | null>;
    getAnomaliesByEntity(entityId: string, entityType: 'portfolio' | 'position' | 'market', metricType?: AnalyticsMetricType, severity?: AnomalyDetection['severity'], resolved?: boolean): Promise<AnomalyDetection[]>;
    resolveAnomaly(anomalyId: string, resolvedBy: string, resolution: string, falsePositive?: boolean): Promise<AnomalyDetection>;
    updateDetectionConfig(tenantId: string, config: Partial<AnomalyDetectionConfig>): Promise<AnomalyDetectionConfig>;
    private runDetectionMethod;
    private buildAnomalyContext;
    private extractFeatureMatrix;
    private calculateStatisticalBaseline;
    private calculateStatisticalConfidence;
    private calculateIsolationConfidence;
    private calculateAutoencoderConfidence;
    private createSequences;
    private classifySequencePattern;
    private runLocalOutlierFactorDetection;
    private runOneClassSVMDetection;
    private calculateMockLOFScore;
    private calculateStandardDeviation;
    private detectSeasonality;
    private calculateSeasonalStrength;
    private analyzeTrend;
    private classifyVolatilityRegime;
    private assessMarketConditions;
    private calculateExpectedValue;
    private determineSeverity;
    private analyzeRootCause;
    private generateRecommendedActions;
    private generateAnomalyAlert;
    private generateRealTimeAnomalyEvent;
    private getDetectionConfig;
    private initializeDefaultConfigs;
}
export {};

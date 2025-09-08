export const __esModule: boolean;
export class AnomalyDetectionService {
    constructor(eventPublisher: any);
    eventPublisher: any;
    anomalies: Map<any, any>;
    detectionConfigs: Map<any, any>;
    modelCache: Map<any, any>;
    defaultConfig: {
        enabled: boolean;
        sensitivity: string;
        methods: string[];
        thresholds: {
            statistical: number;
            isolation_forest: number;
            lstm_autoencoder: number;
            local_outlier_factor: number;
            one_class_svm: number;
        };
        minDataPoints: number;
        alertThreshold: number;
    };
    detectAnomalies(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        entityId: any;
        entityType: any;
        metricType: any;
        anomalyType: string;
        severity: string;
        detectionMethod: any;
        anomalyScore: number;
        threshold: any;
        currentValue: any;
        expectedValue: number;
        deviation: number;
        context: {
            historicalMean: number;
            historicalStdDev: number;
            recentTrend: any;
            seasonalPattern: string;
        };
        rootCause: {
            primaryFactor: string;
            contributingFactors: string[];
            confidence: number;
        };
        recommendedActions: string[];
        detectedAt: Date;
    }[]>;
    runStatisticalAnomalyDetection(data: any, sensitivity?: string): Promise<{
        isAnomaly: boolean;
        score: number;
        zScore: number;
        confidence: number;
        baseline: {
            mean: number;
            standardDeviation: number;
            median: any;
            iqr: number;
        };
    }>;
    runIsolationForestDetection(data: any, features?: string[], contamination?: number): Promise<{
        isAnomaly: boolean;
        score: number;
        confidence: number;
        outlierFactor: any;
        featureContributions: {};
    }>;
    runLSTMAutoencoderDetection(data: any, sequenceLength?: number, threshold?: number): Promise<{
        isAnomaly: boolean;
        score: number;
        reconstructionError: number;
        confidence: number;
        sequencePattern: string;
    }>;
    monitorRealTimeAnomalies(tenantId: any, entityId: any, metricType: any, newDataPoint: any, historicalData: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        entityId: any;
        entityType: any;
        metricType: any;
        anomalyType: string;
        severity: string;
        detectionMethod: any;
        anomalyScore: number;
        threshold: any;
        currentValue: any;
        expectedValue: number;
        deviation: number;
        context: {
            historicalMean: number;
            historicalStdDev: number;
            recentTrend: any;
            seasonalPattern: string;
        };
        rootCause: {
            primaryFactor: string;
            contributingFactors: string[];
            confidence: number;
        };
        recommendedActions: string[];
        detectedAt: Date;
    }>;
    getAnomaliesByEntity(entityId: any, entityType: any, metricType: any, severity: any, resolved: any): Promise<any[]>;
    resolveAnomaly(anomalyId: any, resolvedBy: any, resolution: any, falsePositive?: boolean): Promise<any>;
    updateDetectionConfig(tenantId: any, config: any): Promise<any>;
    runDetectionMethod(method: any, request: any, context: any, config: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        entityId: any;
        entityType: any;
        metricType: any;
        anomalyType: string;
        severity: string;
        detectionMethod: any;
        anomalyScore: number;
        threshold: any;
        currentValue: any;
        expectedValue: number;
        deviation: number;
        context: {
            historicalMean: number;
            historicalStdDev: number;
            recentTrend: any;
            seasonalPattern: string;
        };
        rootCause: {
            primaryFactor: string;
            contributingFactors: string[];
            confidence: number;
        };
        recommendedActions: string[];
        detectedAt: Date;
    }>;
    buildAnomalyContext(data: any, metricType: any): Promise<{
        historicalData: any;
        seasonality: {
            detected: boolean;
            period: number;
            strength: number;
        };
        trend: {
            direction: string;
            strength: number;
            changePoints: any[];
        };
        volatilityRegime: string;
        marketConditions: {
            bullish: number;
            bearish: number;
            sideways: number;
        };
    }>;
    extractFeatureMatrix(data: any, features: any): any;
    calculateStatisticalBaseline(values: any): {
        mean: number;
        standardDeviation: number;
        median: any;
        iqr: number;
    };
    calculateStatisticalConfidence(zScore: any, sampleSize: any): number;
    calculateIsolationConfidence(score: any, allScores: any): number;
    calculateAutoencoderConfidence(error: any, allErrors: any): number;
    createSequences(data: any, sequenceLength: any): any[];
    classifySequencePattern(error: any, threshold: any): "normal" | "anomalous" | "uncertain";
    runLocalOutlierFactorDetection(data: any): Promise<{
        isAnomaly: boolean;
        score: number;
        confidence: number;
        lofScore: number;
    }>;
    runOneClassSVMDetection(data: any): Promise<{
        isAnomaly: boolean;
        score: number;
        confidence: number;
        decisionScore: number;
    }>;
    calculateMockLOFScore(value: any, values: any): number;
    calculateStandardDeviation(values: any): number;
    detectSeasonality(values: any): {
        detected: boolean;
        period: number;
        strength: number;
    };
    calculateSeasonalStrength(values: any, period: any): number;
    analyzeTrend(values: any): {
        direction: string;
        strength: number;
        changePoints: any[];
    };
    classifyVolatilityRegime(values: any): "low" | "medium" | "high";
    assessMarketConditions(data: any): {
        bullish: number;
        bearish: number;
        sideways: number;
    };
    calculateExpectedValue(data: any, context: any): number;
    determineSeverity(score: any, method: any): "low" | "medium" | "high" | "critical";
    analyzeRootCause(result: any, request: any, context: any): Promise<{
        primaryFactor: string;
        contributingFactors: string[];
        confidence: number;
    }>;
    generateRecommendedActions(type: any, metricType: any, score: any): string[];
    generateAnomalyAlert(anomaly: any, tenantId: any): Promise<void>;
    generateRealTimeAnomalyEvent(anomaly: any, tenantId: any): Promise<void>;
    getDetectionConfig(tenantId: any): any;
    initializeDefaultConfigs(): void;
}

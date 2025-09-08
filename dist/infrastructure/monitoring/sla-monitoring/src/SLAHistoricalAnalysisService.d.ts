import { EventEmitter } from 'events';
import { SLAAnalysis, SLAPattern, SLAAnomaly, SLACorrelation, SLAPrediction, SLARootCauseAnalysis, SLARecommendation, SLADefinition } from './SLADataModel';
export interface HistoricalAnalysisConfig {
    analysisInterval: number;
    lookbackPeriods: {
        short: number;
        medium: number;
        long: number;
        extended: number;
    };
    anomalyDetection: {
        enabled: boolean;
        sensitivityThreshold: number;
        minimumDataPoints: number;
        algorithms: ('zscore' | 'iqr' | 'isolation_forest' | 'lstm')[];
    };
    patternRecognition: {
        enabled: boolean;
        minimumPatternLength: number;
        seasonalityThreshold: number;
        trendSignificanceLevel: number;
    };
    correlation: {
        enabled: boolean;
        minimumCorrelationCoefficient: number;
        windowSize: number;
        lagAnalysis: boolean;
    };
    prediction: {
        enabled: boolean;
        horizons: number[];
        models: ('linear' | 'arima' | 'prophet' | 'lstm')[];
        confidenceThreshold: number;
    };
}
export interface AnalysisRequest {
    slaIds: string[];
    timeRange: {
        start: Date;
        end: Date;
    };
    analysisTypes: ('trends' | 'patterns' | 'anomalies' | 'correlations' | 'predictions' | 'root_cause')[];
    granularity: 'hour' | 'day' | 'week' | 'month';
    includeBaseline: boolean;
    compareWithPrevious: boolean;
}
export interface TimeSeriesData {
    timestamp: Date;
    value: number;
    metadata?: Record<string, any>;
}
export interface StatisticalSummary {
    mean: number;
    median: number;
    mode: number;
    standardDeviation: number;
    variance: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    iqr: number;
    skewness: number;
    kurtosis: number;
}
export interface SeasonalityAnalysis {
    hasSeasonality: boolean;
    period: number;
    strength: number;
    components: {
        trend: number[];
        seasonal: number[];
        residual: number[];
    };
    peaks: Array<{
        timestamp: Date;
        value: number;
    }>;
    troughs: Array<{
        timestamp: Date;
        value: number;
    }>;
}
export interface ChangePointDetection {
    changePoints: Array<{
        timestamp: Date;
        magnitude: number;
        direction: 'increase' | 'decrease';
        significance: number;
        beforeMean: number;
        afterMean: number;
    }>;
    stability: number;
    volatility: number;
}
export declare class SLAHistoricalAnalysisService extends EventEmitter {
    private analysisCache;
    private timeSeriesData;
    private config;
    private analysisQueue;
    private isProcessingQueue;
    constructor(config: HistoricalAnalysisConfig);
    performHistoricalAnalysis(request: AnalysisRequest): Promise<SLAAnalysis[]>;
    analyzeSLA(slaId: string, request: AnalysisRequest): Promise<SLAAnalysis>;
    detectPatterns(slaId: string, data: TimeSeriesData[], slaDefinition: SLADefinition): Promise<SLAPattern[]>;
    detectAnomalies(slaId: string, data: TimeSeriesData[], slaDefinition: SLADefinition): Promise<SLAAnomaly[]>;
    analyzeCorrelations(slaId: string, allSlaIds: string[], timeRange: {
        start: Date;
        end: Date;
    }): Promise<SLACorrelation[]>;
    generatePredictions(slaId: string, data: TimeSeriesData[], slaDefinition: SLADefinition): Promise<SLAPrediction[]>;
    performRootCauseAnalysis(slaId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<SLARootCauseAnalysis[]>;
    generateRecommendations(analysis: SLAAnalysis, slaDefinition: SLADefinition): Promise<SLARecommendation[]>;
    private getTimeSeriesData;
    private getSLADefinition;
    private analyzeSeasonality;
    private analyzeTrend;
    private detectCyclicalPatterns;
    private detectBreachPatterns;
    private calculateStatisticalSummary;
    private detectZScoreAnomalies;
    private detectIQRAnomalies;
    private detectIsolationForestAnomalies;
    private calculatePearsonCorrelation;
    private generateSinglePrediction;
    private getBreachesInTimeRange;
    private analyzeBreachRootCause;
    private calculateAutocorrelation;
    private alignTimeSeries;
    private calculateAnalysisConfidence;
    private getGranularityInterval;
    private getTimeUnit;
    private determinePatternImpact;
    private categorizeAnomalySeverity;
    private categorizeCorrelationStrength;
    private inferPossibleCauses;
    private identifyPredictionFactors;
    private startQueueProcessor;
    private startPeriodicAnalysis;
    private generateAnomalyId;
    private generateRecommendationId;
    shutdown(): Promise<any>;
}

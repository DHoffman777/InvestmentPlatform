import { EventEmitter } from 'events';
import { PerformanceProfile, PerformanceMetricType, PerformanceCategory } from './PerformanceDataModel';
export interface PerformanceCorrelationConfig {
    enableRealTimeAnalysis: boolean;
    correlationThreshold: number;
    minimumSampleSize: number;
    analysisWindowSize: number;
    enableCrossServiceCorrelation: boolean;
    enableTimeSeriesAnalysis: boolean;
    enableCausalityAnalysis: boolean;
    maxCorrelationDepth: number;
}
export interface CorrelationAnalysis {
    id: string;
    metric1: MetricIdentifier;
    metric2: MetricIdentifier;
    correlation_coefficient: number;
    correlation_strength: CorrelationStrength;
    correlation_type: CorrelationType;
    p_value: number;
    sample_size: number;
    time_lag: number;
    confidence_interval: [number, number];
    analysis_timestamp: Date;
    causality_direction?: CausalityDirection;
    business_impact: BusinessImpact;
}
export interface MetricIdentifier {
    service_id: string;
    metric_type: PerformanceMetricType;
    category: PerformanceCategory;
    component?: string;
    tags?: Record<string, string>;
}
export interface BusinessImpact {
    impact_score: number;
    affected_kpis: string[];
    cost_implications: number;
    user_experience_impact: number;
    operational_impact: number;
}
export interface CorrelationPattern {
    id: string;
    name: string;
    description: string;
    metrics_involved: MetricIdentifier[];
    typical_correlation_range: [number, number];
    expected_causality: CausalityDirection;
    business_significance: number;
    detection_rules: PatternDetectionRule[];
}
export interface PatternDetectionRule {
    condition: string;
    threshold: number;
    operator: ComparisonOperator;
    confidence: number;
}
export interface TimeSeriesCorrelation {
    profile_id: string;
    timestamp: Date;
    correlations: CorrelationAnalysis[];
    anomalous_correlations: CorrelationAnomaly[];
    trend_analysis: CorrelationTrend[];
}
export interface CorrelationAnomaly {
    id: string;
    correlation_id: string;
    expected_correlation: number;
    actual_correlation: number;
    deviation_score: number;
    anomaly_type: AnomalyType;
    potential_causes: string[];
    detected_at: Date;
}
export interface CorrelationTrend {
    metric_pair: [MetricIdentifier, MetricIdentifier];
    trend_direction: TrendDirection;
    trend_strength: number;
    trend_duration: number;
    forecast: CorrelationForecast[];
}
export interface CorrelationForecast {
    timestamp: Date;
    predicted_correlation: number;
    confidence_interval: [number, number];
    factors: ForecastFactor[];
}
export interface ForecastFactor {
    factor_name: string;
    influence_weight: number;
    description: string;
}
export declare enum CorrelationStrength {
    VERY_WEAK = "very_weak",// 0.0 - 0.2
    WEAK = "weak",// 0.2 - 0.4
    MODERATE = "moderate",// 0.4 - 0.6
    STRONG = "strong",// 0.6 - 0.8
    VERY_STRONG = "very_strong"
}
export declare enum CorrelationType {
    POSITIVE = "positive",
    NEGATIVE = "negative",
    NON_LINEAR = "non_linear",
    CYCLICAL = "cyclical",
    LAGGED = "lagged"
}
export declare enum CausalityDirection {
    METRIC1_TO_METRIC2 = "metric1_to_metric2",
    METRIC2_TO_METRIC1 = "metric2_to_metric1",
    BIDIRECTIONAL = "bidirectional",
    NO_CAUSALITY = "no_causality",
    COMMON_CAUSE = "common_cause"
}
export declare enum AnomalyType {
    CORRELATION_BREAK = "correlation_break",
    CORRELATION_REVERSAL = "correlation_reversal",
    UNEXPECTED_CORRELATION = "unexpected_correlation",
    MISSING_CORRELATION = "missing_correlation"
}
export declare enum TrendDirection {
    STRENGTHENING = "strengthening",
    WEAKENING = "weakening",
    STABLE = "stable",
    OSCILLATING = "oscillating"
}
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    EQUALS = "eq",
    GREATER_THAN_OR_EQUAL = "gte",
    LESS_THAN_OR_EQUAL = "lte",
    BETWEEN = "between"
}
export declare class PerformanceCorrelationService extends EventEmitter {
    private config;
    private correlationCache;
    private historicalCorrelations;
    private correlationPatterns;
    private anomalyBaselines;
    private activeAnalyses;
    constructor(config: PerformanceCorrelationConfig);
    private initializeCorrelationPatterns;
    analyzeProfile(profile: PerformanceProfile): Promise<CorrelationAnalysis[]>;
    private analyzePairwiseCorrelations;
    private analyzePatternCorrelations;
    private analyzePattern;
    private analyzeLaggedCorrelations;
    private calculateCorrelation;
    private calculateLaggedCorrelation;
    private detectCorrelationAnomalies;
    private analyzeCausality;
    private grangerCausalityTest;
    private groupMetricsByType;
    private matchesMetricIdentifier;
    private createMetricIdentifier;
    private pearsonCorrelation;
    private calculatePValue;
    private tCdf;
    private calculateConfidenceInterval;
    private determineCorrelationStrength;
    private determineCorrelationType;
    private spearmanCorrelation;
    private convertToRanks;
    private calculateBusinessImpact;
    private calculateDefaultBusinessImpact;
    private identifyAffectedKPIs;
    private calculateUserExperienceImpact;
    private calculateOperationalImpact;
    private calculateMetricUXImpact;
    private calculateMetricOperationalImpact;
    private getCorrelationBaselineKey;
    private updateCorrelationBaseline;
    private determineAnomalyType;
    private identifyAnomalyCauses;
    private storeTimeSeriesCorrelation;
    private startBackgroundTasks;
    private cleanupOldData;
    private updateBaselines;
    getCorrelations(profileId: string): CorrelationAnalysis[];
    getCorrelationPatterns(): CorrelationPattern[];
    getAnalysisStatus(analysisId: string): CorrelationAnalysisJob | undefined;
    getHistoricalCorrelations(targetId: string): TimeSeriesCorrelation[];
    getCorrelationStatistics(): any;
    private generateAnalysisId;
    private generateCorrelationId;
    private generateAnomalyId;
    shutdown(): Promise<any>;
}
interface CorrelationAnalysisJob {
    id: string;
    profile_id: string;
    start_time: Date;
    end_time?: Date;
    status: 'running' | 'completed' | 'failed';
    progress: number;
    error?: string;
}
export {};

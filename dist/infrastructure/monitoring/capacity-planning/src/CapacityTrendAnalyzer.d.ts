import { EventEmitter } from 'events';
import { CapacityTrend, TimeGranularity, ResourceType } from './CapacityPlanningDataModel';
export interface TrendAnalyzerConfig {
    analysisInterval: number;
    minDataPoints: number;
    seasonalityDetectionThreshold: number;
    changePointSensitivity: number;
    forecastHorizon: number;
    confidenceThreshold: number;
    enableSeasonalityDetection: boolean;
    enableChangePointDetection: boolean;
    enableForecastGeneration: boolean;
}
export interface TrendAnalysisRequest {
    resourceId: string;
    metric: string;
    timeRange: {
        start: Date;
        end: Date;
        granularity: TimeGranularity;
    };
    options?: {
        detectSeasonality?: boolean;
        detectChangePoints?: boolean;
        generateForecast?: boolean;
        includeConfidenceIntervals?: boolean;
    };
}
export interface SeasonalPattern {
    period: number;
    strength: number;
    peaks: number[];
    troughs: number[];
    confidence: number;
}
export interface TrendComponents {
    trend: number[];
    seasonal: number[];
    residual: number[];
    originalValues: number[];
    timestamps: Date[];
}
export declare class CapacityTrendAnalyzer extends EventEmitter {
    private trends;
    private analysisTimer;
    private config;
    private timeSeriesProcessor;
    private seasonalityDetector;
    private changePointDetector;
    private forecastEngine;
    constructor(config: TrendAnalyzerConfig);
    analyzeTrend(request: TrendAnalysisRequest): Promise<CapacityTrend>;
    batchAnalyzeTrends(requests: TrendAnalysisRequest[]): Promise<CapacityTrend[]>;
    detectAnomalies(resourceId: string, metric: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<{
        anomalies: Array<{
            timestamp: Date;
            value: number;
            expectedValue: number;
            severity: 'low' | 'medium' | 'high';
            type: 'outlier' | 'trend_break' | 'seasonal_anomaly';
        }>;
        summary: {
            totalAnomalies: number;
            severityDistribution: Record<string, number>;
            typeDistribution: Record<string, number>;
        };
    }>;
    compareResourceTrends(resourceIds: string[], metric: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<{
        trends: CapacityTrend[];
        comparison: {
            correlations: Array<{
                resource1: string;
                resource2: string;
                correlation: number;
            }>;
            rankings: Array<{
                resourceId: string;
                score: number;
                rank: number;
            }>;
            clusters: Array<{
                resources: string[];
                similarity: number;
            }>;
        };
    }>;
    getTrendSummary(resourceType?: ResourceType, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalTrends: number;
        trendsByDirection: Record<string, number>;
        averageSlope: number;
        seasonalityDetectionRate: number;
        changePointFrequency: number;
        forecastAccuracy: number;
    }>;
    private decomposeTrend;
    private extractTrend;
    private extractSeasonal;
    private extractTimeSeries;
    private extractMetricValue;
    private calculateStatistics;
    private determineTrendDirection;
    private calculateSlope;
    private calculateCorrelation;
    private generateRecommendations;
    private detectTimeSeriesAnomalies;
    private compareTrends;
    private getMetricsData;
    private getIntervalForGranularity;
    private generateMockMetrics;
    private chunkArray;
    private groupBy;
    private startAnalysis;
    private performScheduledAnalysis;
    private generateTrendId;
    private generateBatchId;
    getTrend(trendId: string): CapacityTrend | null;
    getAllTrends(): CapacityTrend[];
    shutdown(): Promise<any>;
}

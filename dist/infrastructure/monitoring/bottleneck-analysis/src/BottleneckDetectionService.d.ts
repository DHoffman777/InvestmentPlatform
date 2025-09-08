import { EventEmitter } from 'events';
import { PerformanceProfile, PerformanceBottleneck } from './PerformanceDataModel';
export interface BottleneckDetectionConfig {
    enableRealTimeDetection: boolean;
    detectionThresholds: DetectionThresholds;
    analysisWindowSize: number;
    minSampleSize: number;
    confidenceThreshold: number;
    enableMachineLearning: boolean;
    enableStatisticalAnalysis: boolean;
    enablePatternMatching: boolean;
}
export interface DetectionThresholds {
    cpuUsageThreshold: number;
    memoryUsageThreshold: number;
    responseTimeThreshold: number;
    throughputThreshold: number;
    errorRateThreshold: number;
    queueSizeThreshold: number;
    ioLatencyThreshold: number;
    networkLatencyThreshold: number;
}
export interface BottleneckDetectionAlgorithm {
    name: string;
    type: AlgorithmType;
    detectBottlenecks: (profile: PerformanceProfile) => Promise<PerformanceBottleneck[]>;
    enabled: boolean;
    confidence: number;
}
export declare enum AlgorithmType {
    THRESHOLD_BASED = "threshold_based",
    STATISTICAL = "statistical",
    MACHINE_LEARNING = "machine_learning",
    PATTERN_MATCHING = "pattern_matching",
    CORRELATION_BASED = "correlation_based",
    ANOMALY_DETECTION = "anomaly_detection"
}
export declare class BottleneckDetectionService extends EventEmitter {
    private config;
    private detectionAlgorithms;
    private historicalProfiles;
    private detectedBottlenecks;
    private anomalyBaselines;
    private activeBottlenecks;
    constructor(config: BottleneckDetectionConfig);
    private initializeDetectionAlgorithms;
    analyzeProfile(profile: PerformanceProfile): Promise<PerformanceBottleneck[]>;
    private detectCpuBottlenecks;
    private detectMemoryBottlenecks;
    private detectIoBottlenecks;
    private detectNetworkBottlenecks;
    private detectStatisticalOutliers;
    private detectPerformanceTrends;
    private detectLockContentionPatterns;
    private detectResourceStarvationPatterns;
    private detectCorrelationBottlenecks;
    private detectAnomalies;
    private analyzeCpuRootCauses;
    private analyzeMemoryRootCauses;
    private analyzeIoRootCauses;
    private analyzeNetworkRootCauses;
    private createCpuContext;
    private createMemoryContext;
    private createIoContext;
    private createNetworkContext;
    private mergeBottlenecks;
    private calculateSeverity;
    private calculateImpactScore;
    private calculateStatistics;
    private calculateTrend;
    private calculateVariability;
    private calculateCorrelation;
    private calculateProfileSignature;
    private calculateAnomalyScore;
    private updateAnomalyBaseline;
    private getAverageMetricValue;
    private mapMetricTypeToBottleneckType;
    private mapMetricTypeToComponent;
    private startBackgroundTasks;
    private cleanupHistoricalData;
    getDetectedBottlenecks(profileId: string): PerformanceBottleneck[];
    getDetectionAlgorithms(): BottleneckDetectionAlgorithm[];
    enableAlgorithm(algorithmId: string): void;
    disableAlgorithm(algorithmId: string): void;
    getDetectionStatistics(): any;
    private generateBottleneckId;
    private generateRootCauseId;
    shutdown(): Promise<any>;
    getBottlenecks(): any[];
}

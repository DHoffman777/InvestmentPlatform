import { EventEmitter } from 'events';
import { PerformanceBottleneck, PerformanceProfile, RootCause, Evidence, FixSuggestion, RootCauseCategory, PerformanceMetricType } from './PerformanceDataModel';
export interface RootCauseAnalysisConfig {
    enableDeepAnalysis: boolean;
    enableCodeAnalysis: boolean;
    enableInfrastructureAnalysis: boolean;
    enableExternalDependencyAnalysis: boolean;
    confidenceThreshold: number;
    maxAnalysisDepth: number;
    enableMachineLearning: boolean;
    historicalAnalysisWindow: number;
}
export interface AnalysisRule {
    id: string;
    name: string;
    category: RootCauseCategory;
    conditions: AnalysisCondition[];
    action: AnalysisAction;
    confidence: number;
    enabled: boolean;
}
export interface AnalysisCondition {
    type: ConditionType;
    metric?: PerformanceMetricType;
    operator: ComparisonOperator;
    value: number;
    timeWindow?: number;
}
export interface AnalysisAction {
    type: ActionType;
    description: string;
    evidenceGenerator: (bottleneck: PerformanceBottleneck, profile: PerformanceProfile) => Evidence[];
    fixSuggestionGenerator: (bottleneck: PerformanceBottleneck, profile: PerformanceProfile) => FixSuggestion[];
}
export declare enum ConditionType {
    METRIC_THRESHOLD = "metric_threshold",
    METRIC_TREND = "metric_trend",
    METRIC_CORRELATION = "metric_correlation",
    PATTERN_MATCH = "pattern_match",
    HISTORICAL_COMPARISON = "historical_comparison"
}
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    EQUALS = "eq",
    GREATER_THAN_OR_EQUAL = "gte",
    LESS_THAN_OR_EQUAL = "lte",
    BETWEEN = "between"
}
export declare enum ActionType {
    GENERATE_ROOT_CAUSE = "generate_root_cause",
    COLLECT_EVIDENCE = "collect_evidence",
    SUGGEST_FIX = "suggest_fix",
    ESCALATE_ANALYSIS = "escalate_analysis"
}
export declare class RootCauseAnalysisService extends EventEmitter {
    private config;
    private analysisRules;
    private analyzedBottlenecks;
    private historicalAnalyses;
    private patternDatabase;
    constructor(config: RootCauseAnalysisConfig);
    private initializeAnalysisRules;
    private initializePatternDatabase;
    analyzeBottleneck(bottleneck: PerformanceBottleneck, profile: PerformanceProfile): Promise<RootCause[]>;
    private evaluateRule;
    private evaluateCondition;
    private evaluateMetricThreshold;
    private evaluateMetricTrend;
    private evaluateMetricCorrelation;
    private evaluatePatternMatch;
    private evaluateHistoricalComparison;
    private generateRootCause;
    private generateCpuEvidences;
    private generateMemoryLeakEvidences;
    private generateSlowQueryEvidences;
    private generateNetworkEvidences;
    private generateDiskIoEvidences;
    private generateLockContentionEvidences;
    private generateGcEvidences;
    private generateCpuFixSuggestions;
    private generateMemoryLeakFixSuggestions;
    private generateSlowQueryFixSuggestions;
    private generateNetworkFixSuggestions;
    private generateDiskIoFixSuggestions;
    private generateLockContentionFixSuggestions;
    private generateGcFixSuggestions;
    private analyzePatterns;
    private matchesPattern;
    private generatePatternFixSuggestions;
    private analyzeHistoricalComparison;
    private analyzeMachineLearning;
    private calculateImpactAssessment;
    private storeHistoricalAnalysis;
    private calculateTrend;
    private calculateVariance;
    getRootCauses(bottleneckId: string): RootCause[];
    getAnalysisRules(): AnalysisRule[];
    enableRule(ruleId: string): void;
    disableRule(ruleId: string): void;
    getAnalysisStatistics(): any;
    private generateRootCauseId;
    private generateFixSuggestionId;
    shutdown(): Promise<void>;
}

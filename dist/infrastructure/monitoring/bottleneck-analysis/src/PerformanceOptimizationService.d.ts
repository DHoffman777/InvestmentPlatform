import { EventEmitter } from 'events';
import { PerformanceProfile, PerformanceBottleneck, RootCause, PerformanceRecommendation, RecommendationCategory, RecommendationPriority, ImplementationEffort, ActionType, FixCategory, CodeChangeType, BottleneckType, PerformanceMetricType } from './PerformanceDataModel';
import { CorrelationAnalysis } from './PerformanceCorrelationService';
export interface PerformanceOptimizationConfig {
    enableAutomaticRecommendations: boolean;
    enableMachineLearningRecommendations: boolean;
    enableCodeAnalysisRecommendations: boolean;
    enableInfrastructureRecommendations: boolean;
    maxRecommendationsPerProfile: number;
    confidenceThreshold: number;
    priorityThreshold: RecommendationPriority;
    enableImpactEstimation: boolean;
    enableCostBenefitAnalysis: boolean;
}
export interface OptimizationRule {
    id: string;
    name: string;
    category: RecommendationCategory;
    conditions: OptimizationCondition[];
    recommendations: RecommendationTemplate[];
    priority: RecommendationPriority;
    confidence: number;
    enabled: boolean;
}
export interface OptimizationCondition {
    type: ConditionType;
    bottleneck_type?: BottleneckType;
    metric_threshold?: MetricThreshold;
    correlation_condition?: CorrelationCondition;
    pattern_match?: string;
}
export interface MetricThreshold {
    metric_type: PerformanceMetricType;
    operator: ComparisonOperator;
    value: number;
    duration_ms?: number;
}
export interface CorrelationCondition {
    correlation_threshold: number;
    metrics: [PerformanceMetricType, PerformanceMetricType];
    correlation_type: 'positive' | 'negative' | 'any';
}
export interface RecommendationTemplate {
    title: string;
    description: string;
    category: FixCategory;
    implementation_effort: ImplementationEffort;
    expected_improvement_min: number;
    expected_improvement_max: number;
    cost_estimate: CostEstimate;
    actions: ActionTemplate[];
    prerequisites: string[];
    risks: string[];
    validation_criteria: string[];
}
export interface ActionTemplate {
    type: ActionType;
    description: string;
    parameters: Record<string, any>;
    code_changes?: CodeChangeTemplate[];
    configuration_changes?: ConfigurationChange[];
    infrastructure_changes?: InfrastructureChange[];
}
export interface CodeChangeTemplate {
    file_pattern: string;
    change_type: CodeChangeType;
    description: string;
    before_pattern?: string;
    after_template?: string;
    language?: string;
}
export interface ConfigurationChange {
    file_path: string;
    parameter: string;
    current_value?: any;
    recommended_value: any;
    description: string;
    requires_restart: boolean;
}
export interface InfrastructureChange {
    component: string;
    change_type: InfrastructureChangeType;
    description: string;
    current_spec?: any;
    recommended_spec: any;
    downtime_required: boolean;
}
export interface CostEstimate {
    development_hours: number;
    infrastructure_cost_monthly: number;
    maintenance_cost_monthly: number;
    one_time_costs: number;
}
export interface OptimizationPlan {
    id: string;
    profile_id: string;
    recommendations: PerformanceRecommendation[];
    execution_order: string[];
    total_estimated_improvement: number;
    total_cost_estimate: CostEstimate;
    timeline: OptimizationTimeline;
    dependencies: PlanDependency[];
    risks: PlanRisk[];
    success_metrics: SuccessMetric[];
    created_at: Date;
    status: PlanStatus;
}
export interface OptimizationTimeline {
    phases: OptimizationPhase[];
    total_duration_weeks: number;
    milestones: Milestone[];
}
export interface OptimizationPhase {
    id: string;
    name: string;
    recommendations: string[];
    duration_weeks: number;
    prerequisites: string[];
    deliverables: string[];
}
export interface Milestone {
    name: string;
    week: number;
    success_criteria: string[];
    validation_method: string;
}
export interface PlanDependency {
    id: string;
    description: string;
    dependency_type: DependencyType;
    required_before: string[];
    estimated_resolution_time: number;
}
export interface PlanRisk {
    id: string;
    description: string;
    probability: number;
    impact: number;
    mitigation_strategy: string;
    contingency_plan: string;
}
export interface SuccessMetric {
    metric_name: string;
    current_value: number;
    target_value: number;
    measurement_method: string;
    validation_period_days: number;
}
export declare enum ConditionType {
    BOTTLENECK_TYPE = "bottleneck_type",
    METRIC_THRESHOLD = "metric_threshold",
    CORRELATION_CONDITION = "correlation_condition",
    PATTERN_MATCH = "pattern_match",
    HISTORICAL_TREND = "historical_trend"
}
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    EQUALS = "eq",
    GREATER_THAN_OR_EQUAL = "gte",
    LESS_THAN_OR_EQUAL = "lte",
    BETWEEN = "between"
}
export declare enum InfrastructureChangeType {
    SCALE_UP = "scale_up",
    SCALE_OUT = "scale_out",
    CONFIGURATION_CHANGE = "configuration_change",
    TECHNOLOGY_UPGRADE = "technology_upgrade",
    ARCHITECTURE_CHANGE = "architecture_change"
}
export declare enum PlanStatus {
    DRAFT = "draft",
    APPROVED = "approved",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum DependencyType {
    TECHNICAL = "technical",
    RESOURCE = "resource",
    BUSINESS = "business",
    EXTERNAL = "external"
}
export declare class PerformanceOptimizationService extends EventEmitter {
    private config;
    private optimizationRules;
    private generatedRecommendations;
    private optimizationPlans;
    private knowledgeBase;
    constructor(config: PerformanceOptimizationConfig);
    private initializeOptimizationRules;
    private initializeKnowledgeBase;
    generateRecommendations(profile: PerformanceProfile, bottlenecks: PerformanceBottleneck[], rootCauses: RootCause[], correlations?: CorrelationAnalysis[]): Promise<PerformanceRecommendation[]>;
    private evaluateRuleConditions;
    private evaluateCondition;
    private evaluateMetricThreshold;
    private evaluateCorrelationCondition;
    private evaluatePatternMatch;
    private applyOptimizationRule;
    private createRecommendationFromTemplate;
    private generateKnowledgeBasedRecommendations;
    private generateMLRecommendations;
    createOptimizationPlan(profileId: string, selectedRecommendations: string[]): Promise<OptimizationPlan>;
    private calculateCostBenefitRatio;
    private calculatePriority;
    private generateRationale;
    private createActionValidation;
    private identifyDependencies;
    private getKnowledgeKey;
    private matchesKnowledgePattern;
    private createKnowledgeBasedRecommendation;
    private prioritizeRecommendations;
    private filterRecommendations;
    private determineExecutionOrder;
    private calculateTotalImprovement;
    private calculateTotalCost;
    private estimateCostFromRecommendation;
    private createOptimizationTimeline;
    private estimateImplementationWeeks;
    private analyzePlanDependencies;
    private classifyDependency;
    private estimateDependencyTime;
    private assessPlanRisks;
    private assessRiskImpact;
    private generateMitigationStrategy;
    private generateContingencyPlan;
    private defineSuccessMetrics;
    getRecommendations(profileId: string): PerformanceRecommendation[];
    getOptimizationPlan(planId: string): OptimizationPlan | undefined;
    getOptimizationRules(): OptimizationRule[];
    updatePlanStatus(planId: string, status: PlanStatus): boolean;
    getOptimizationStatistics(): any;
    private generateRecommendationId;
    private generatePlanId;
    private generateDependencyId;
    private generateRiskId;
    shutdown(): Promise<any>;
}

import { EventEmitter } from 'events';
import { ResourceUtilizationSnapshot, ResourceRecommendation, ResourceAnomaly } from './ResourceDataModel';
import { OptimizationOpportunity, EfficiencyInsight } from './ResourceEfficiencyAnalyticsService';
export interface OptimizationConfig {
    enableMLRecommendations: boolean;
    enableCostOptimization: boolean;
    enablePerformanceOptimization: boolean;
    enableSecurityOptimization: boolean;
    recommendationUpdateInterval: number;
    maxRecommendationsPerResource: number;
    confidenceThreshold: number;
    autoApplyLowRiskRecommendations: boolean;
    costSavingsThreshold: number;
    performanceImpactThreshold: number;
}
export interface RecommendationEngine {
    id: string;
    name: string;
    type: 'rule_based' | 'ml_based' | 'heuristic' | 'template' | 'hybrid';
    categories: RecommendationCategory[];
    confidence_weight: number;
    enabled: boolean;
    last_trained?: Date;
    accuracy?: number;
}
export declare enum RecommendationCategory {
    RIGHTSIZING = "rightsizing",
    COST_OPTIMIZATION = "cost_optimization",
    PERFORMANCE_TUNING = "performance_tuning",
    SECURITY_HARDENING = "security_hardening",
    AVAILABILITY_IMPROVEMENT = "availability_improvement",
    CAPACITY_PLANNING = "capacity_planning",
    AUTOMATION = "automation",
    COMPLIANCE = "compliance",
    MONITORING = "monitoring",
    BACKUP_RECOVERY = "backup_recovery"
}
export interface RecommendationContext {
    snapshot: ResourceUtilizationSnapshot;
    historical_data: ResourceUtilizationSnapshot[];
    anomalies: ResourceAnomaly[];
    insights: EfficiencyInsight[];
    opportunities: OptimizationOpportunity[];
    cost_data?: any;
    compliance_requirements?: string[];
    business_constraints?: any;
    technical_constraints?: any;
}
export interface RecommendationTemplate {
    id: string;
    name: string;
    category: RecommendationCategory;
    description: string;
    conditions: RecommendationCondition[];
    actions: RecommendationAction[];
    estimated_impact: {
        cost_savings: number;
        performance_improvement: number;
        efficiency_gain: number;
        risk_reduction: number;
    };
    implementation: {
        complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';
        automation_level: 'manual' | 'semi_automated' | 'fully_automated';
        estimated_time: string;
        required_skills: string[];
        dependencies: string[];
        rollback_plan: string[];
    };
    validation: {
        pre_checks: string[];
        post_checks: string[];
        success_criteria: string[];
        monitoring_requirements: string[];
    };
}
export interface RecommendationCondition {
    type: 'metric_threshold' | 'pattern_match' | 'anomaly_detection' | 'cost_analysis' | 'compliance_check' | 'custom';
    parameter: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'regex';
    value: any;
    weight: number;
    required: boolean;
}
export interface RecommendationAction {
    type: 'configuration_change' | 'scaling_adjustment' | 'resource_migration' | 'process_optimization' | 'policy_update' | 'automation_setup';
    description: string;
    parameters: Record<string, any>;
    risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    reversible: boolean;
    automation_available: boolean;
    validation_required: boolean;
}
export interface RecommendationResult {
    id: string;
    resource_id: string;
    recommendation: ResourceRecommendation;
    applied_at?: Date;
    result: {
        success: boolean;
        actual_impact: {
            cost_savings?: number;
            performance_improvement?: number;
            efficiency_gain?: number;
            risk_reduction?: number;
        };
        unexpected_effects?: string[];
        rollback_required?: boolean;
        notes: string;
    };
    validation: {
        pre_check_results: Record<string, boolean>;
        post_check_results: Record<string, boolean>;
        success_criteria_met: boolean;
        monitoring_alerts: string[];
    };
}
export declare class ResourceOptimizationService extends EventEmitter {
    private config;
    private engines;
    private templates;
    private recommendations;
    private results;
    private updateScheduler?;
    constructor(config: OptimizationConfig);
    generateRecommendations(context: RecommendationContext): Promise<ResourceRecommendation[]>;
    private generateEngineRecommendations;
    private generateRuleBasedRecommendations;
    private generateMLBasedRecommendations;
    private generateHeuristicRecommendations;
    private generateTemplateBasedRecommendations;
    private generateHybridRecommendations;
    private processRecommendations;
    private deduplicateRecommendations;
    private prioritizeRecommendations;
    private autoApplyLowRiskRecommendations;
    applyRecommendation(recommendation: ResourceRecommendation, context: RecommendationContext): Promise<RecommendationResult>;
    private initializeEngines;
    private initializeTemplates;
    private startUpdateScheduler;
    private updateRecommendationEngines;
    private storeRecommendations;
    private storeResult;
    getRecommendations(resourceId: string): ResourceRecommendation[];
    getResults(resourceId: string): RecommendationResult[];
    getEngines(): RecommendationEngine[];
    getTemplates(): RecommendationTemplate[];
    private generateRecommendationId;
    private generateResultId;
    private estimateCostSavings;
    private analyzeUtilizationPattern;
    private identifyCostOptimizations;
    private identifyPerformanceOptimizations;
    private identifySecurityOptimizations;
    private evaluateTemplateConditions;
    private createRecommendationFromTemplate;
    private calculateHybridConfidence;
    private executePreChecks;
    private executePostChecks;
    private executeRecommendation;
    private allChecksPass;
    shutdown(): Promise<void>;
}

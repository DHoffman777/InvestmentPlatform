import { EventEmitter } from 'events';
import { ResourceUtilizationSnapshot, ResourceType, ResourceMetricType } from './ResourceDataModel';
export interface CostAnalysisConfig {
    analysisInterval: number;
    costUpdateInterval: number;
    enableRealTimeCostTracking: boolean;
    enableCostForecasting: boolean;
    enableCostOptimization: boolean;
    enableCostAlerting: boolean;
    costThresholds: {
        warning: number;
        critical: number;
        emergency: number;
    };
    forecastHorizons: number[];
    optimizationTargets: {
        cost_reduction_percentage: number;
        efficiency_improvement_percentage: number;
        waste_reduction_percentage: number;
    };
    currencies: string[];
    exchangeRateUpdateInterval: number;
}
export interface CostModel {
    id: string;
    name: string;
    description: string;
    resource_type: ResourceType;
    pricing_model: 'hourly' | 'monthly' | 'usage_based' | 'tiered' | 'spot' | 'reserved' | 'committed';
    cost_factors: CostFactor[];
    base_cost: number;
    currency: string;
    effective_date: Date;
    expiry_date?: Date;
    provider: string;
    region?: string;
    availability_zone?: string;
    instance_type?: string;
    contract_terms?: Record<string, any>;
}
export interface CostFactor {
    type: 'compute' | 'storage' | 'network' | 'licensing' | 'support' | 'data_transfer' | 'api_calls' | 'custom';
    name: string;
    unit: string;
    unit_cost: number;
    included_quantity?: number;
    overage_cost?: number;
    volume_discounts?: Array<{
        min_quantity: number;
        discount_percentage: number;
    }>;
    conditions?: Array<{
        parameter: string;
        operator: string;
        value: any;
    }>;
}
export interface CostCorrelation {
    resource_id: string;
    analysis_period: {
        start: Date;
        end: Date;
    };
    correlations: {
        utilization_cost: CorrelationAnalysis;
        performance_cost: CorrelationAnalysis;
        efficiency_cost: CorrelationAnalysis;
        time_cost: CorrelationAnalysis;
        workload_cost: CorrelationAnalysis;
    };
    cost_drivers: CostDriver[];
    cost_anomalies: CostAnomaly[];
    optimization_opportunities: CostOptimizationOpportunity[];
    forecast: CostForecast;
    recommendations: CostRecommendation[];
}
export interface CorrelationAnalysis {
    correlation_coefficient: number;
    r_squared: number;
    p_value: number;
    significance: 'high' | 'medium' | 'low' | 'none';
    trend: 'positive' | 'negative' | 'neutral';
    strength: 'strong' | 'moderate' | 'weak' | 'none';
    data_points: number;
    time_lags: Array<{
        lag_hours: number;
        correlation: number;
    }>;
    confidence_interval: {
        lower: number;
        upper: number;
    };
}
export interface CostDriver {
    factor: string;
    impact_percentage: number;
    cost_contribution: number;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    controllability: 'high' | 'medium' | 'low' | 'none';
    optimization_potential: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendations: string[];
}
export interface CostAnomaly {
    id: string;
    timestamp: Date;
    type: 'spike' | 'drop' | 'drift' | 'pattern_break' | 'threshold_breach';
    severity: 'critical' | 'high' | 'medium' | 'low';
    cost_impact: number;
    percentage_change: number;
    duration_hours: number;
    expected_cost: number;
    actual_cost: number;
    confidence: number;
    potential_causes: string[];
    correlated_metrics: Array<{
        metric: ResourceMetricType;
        correlation: number;
        timing: 'leading' | 'concurrent' | 'lagging';
    }>;
    business_impact: {
        severity: 'critical' | 'high' | 'medium' | 'low';
        description: string;
        affected_services: string[];
    };
    resolution_status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    resolution_notes?: string;
}
export interface CostOptimizationOpportunity {
    id: string;
    type: 'rightsizing' | 'scheduling' | 'pricing_model' | 'consolidation' | 'elimination' | 'automation';
    title: string;
    description: string;
    current_cost: number;
    optimized_cost: number;
    savings_amount: number;
    savings_percentage: number;
    implementation: {
        effort: 'trivial' | 'low' | 'medium' | 'high' | 'expert';
        risk: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
        timeline: string;
        steps: string[];
        dependencies: string[];
        rollback_plan: string[];
    };
    impact_analysis: {
        performance_impact: number;
        availability_impact: number;
        operational_impact: number;
        user_experience_impact: number;
    };
    roi: {
        investment_cost: number;
        payback_period_months: number;
        annual_savings: number;
        three_year_npv: number;
    };
    confidence: number;
    priority: number;
    expires_at?: Date;
}
export interface CostForecast {
    horizon_days: number;
    predictions: Array<{
        date: Date;
        predicted_cost: number;
        confidence_lower: number;
        confidence_upper: number;
        factors: Record<string, number>;
    }>;
    models_used: string[];
    accuracy_metrics: {
        mae: number;
        mape: number;
        rmse: number;
        r_squared: number;
    };
    assumptions: string[];
    risk_factors: Array<{
        factor: string;
        probability: number;
        impact: number;
    }>;
    scenarios: Array<{
        name: string;
        description: string;
        probability: number;
        cost_range: {
            min: number;
            max: number;
        };
    }>;
}
export interface CostRecommendation {
    id: string;
    type: 'immediate' | 'short_term' | 'long_term' | 'strategic';
    category: 'cost_reduction' | 'efficiency_improvement' | 'cost_visibility' | 'governance' | 'automation';
    title: string;
    description: string;
    rationale: string;
    expected_savings: number;
    implementation: {
        priority: 'critical' | 'high' | 'medium' | 'low';
        effort: 'minimal' | 'low' | 'medium' | 'high' | 'extensive';
        timeline: string;
        steps: string[];
        risks: string[];
        success_metrics: string[];
    };
    dependencies: string[];
    conflicts: string[];
    confidence: number;
    created_at: Date;
    expires_at?: Date;
}
export interface CostAlert {
    id: string;
    resource_id: string;
    type: 'threshold_breach' | 'anomaly_detected' | 'forecast_warning' | 'optimization_opportunity' | 'budget_exceeded';
    severity: 'info' | 'warning' | 'critical' | 'emergency';
    title: string;
    description: string;
    current_cost: number;
    threshold_cost?: number;
    forecast_cost?: number;
    time_window: {
        start: Date;
        end: Date;
    };
    triggered_at: Date;
    acknowledged_at?: Date;
    resolved_at?: Date;
    actions_taken: string[];
    escalation_level: number;
    notifications_sent: string[];
}
export declare class ResourceCostAnalysisService extends EventEmitter {
    private config;
    private costModels;
    private costData;
    private correlations;
    private alerts;
    private exchangeRates;
    private analysisScheduler?;
    private costUpdateScheduler?;
    constructor(config: CostAnalysisConfig);
    analyzeCostCorrelations(resourceId: string, snapshot: ResourceUtilizationSnapshot, historicalData: ResourceUtilizationSnapshot[]): Promise<CostCorrelation>;
    private analyzeUtilizationCostCorrelation;
    private analyzePerformanceCostCorrelation;
    private analyzeEfficiencyCostCorrelation;
    private analyzeTimeCostCorrelation;
    private analyzeWorkloadCostCorrelation;
    private identifyCostDrivers;
    private detectCostAnomalies;
    private findCostOptimizationOpportunities;
    private generateCostForecast;
    private mapEffortLevel;
    private generateCostRecommendations;
    private checkCostAlerts;
    private initializeCostModels;
    private initializeExchangeRates;
    private startSchedulers;
    private performScheduledAnalysis;
    private updateCostData;
    private storeAlerts;
    getCostCorrelation(resourceId: string): CostCorrelation | undefined;
    getCostAlerts(resourceId: string): CostAlert[];
    getCostModels(): CostModel[];
    private getCostHistory;
    private getCurrentCost;
    private calculateCorrelation;
    private getEmptyCorrelationAnalysis;
    private alignUtilizationAndCostData;
    private alignPerformanceAndCostData;
    private alignEfficiencyAndCostData;
    private alignWorkloadAndCostData;
    private calculatePValue;
    private determineSignificance;
    private determineCorrelationStrength;
    private calculateTimeLags;
    private calculateConfidenceInterval;
    private calculateCostContribution;
    private calculateAbsoluteCostContribution;
    private calculateCostTrend;
    private calculateOptimizationPotential;
    private hasSchedulingOpportunity;
    private analyzePricingModelOpportunity;
    private calculateLinearTrend;
    private calculateMAE;
    private calculateMAPE;
    private calculateRMSE;
    private generateAnomalyId;
    private generateOpportunityId;
    private generateRecommendationId;
    private generateAlertId;
    shutdown(): Promise<any>;
}

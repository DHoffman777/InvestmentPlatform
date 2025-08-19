import { EventEmitter } from 'events';
import { ResourceUtilizationSnapshot, ResourceEfficiency, ResourceType } from './ResourceDataModel';
export interface EfficiencyAnalyticsConfig {
    analysisInterval: number;
    benchmarkUpdateInterval: number;
    wasteThresholds: {
        overProvisioned: number;
        underUtilized: number;
        idle: number;
    };
    efficiencyTargets: {
        cpu: number;
        memory: number;
        storage: number;
        network: number;
        cost: number;
    };
    enableMLAnalysis: boolean;
    enableBenchmarking: boolean;
    costAnalysisEnabled: boolean;
}
export interface EfficiencyBenchmark {
    resourceType: ResourceType;
    industry: {
        average: number;
        p50: number;
        p75: number;
        p90: number;
        p95: number;
    };
    internal: {
        average: number;
        best: number;
        worst: number;
        variance: number;
    };
    target: number;
    lastUpdated: Date;
    sampleSize: number;
}
export interface EfficiencyInsight {
    id: string;
    resourceId: string;
    type: 'waste_detection' | 'optimization_opportunity' | 'benchmark_comparison' | 'cost_analysis' | 'trend_analysis';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: {
        efficiency_improvement: number;
        cost_savings: number;
        performance_gain: number;
        risk_reduction: number;
    };
    evidence: {
        metrics: string[];
        timeRange: {
            start: Date;
            end: Date;
        };
        data_points: number;
        confidence: number;
    };
    recommendations: string[];
    priority_score: number;
    created_at: Date;
    expires_at?: Date;
}
export interface WasteAnalysis {
    resourceId: string;
    totalWaste: number;
    wasteBreakdown: {
        overProvisioned: {
            amount: number;
            percentage: number;
            resources: Array<{
                type: ResourceType;
                allocated: number;
                used: number;
                waste: number;
            }>;
        };
        underUtilized: {
            amount: number;
            percentage: number;
            resources: Array<{
                type: ResourceType;
                capacity: number;
                usage: number;
                efficiency: number;
            }>;
        };
        idle: {
            amount: number;
            percentage: number;
            duration: number;
            cost_impact: number;
        };
        inefficientAllocation: {
            amount: number;
            percentage: number;
            misallocations: Array<{
                resource: string;
                current: number;
                optimal: number;
                waste: number;
            }>;
        };
    };
    recommendations: Array<{
        action: string;
        impact: number;
        effort: 'low' | 'medium' | 'high';
        priority: number;
    }>;
    timestamp: Date;
}
export interface OptimizationOpportunity {
    id: string;
    resourceId: string;
    type: 'rightsizing' | 'consolidation' | 'migration' | 'scheduling' | 'caching' | 'compression';
    title: string;
    description: string;
    currentState: {
        configuration: Record<string, any>;
        utilization: number;
        cost: number;
        performance: number;
    };
    proposedState: {
        configuration: Record<string, any>;
        utilization: number;
        cost: number;
        performance: number;
    };
    benefits: {
        cost_reduction: number;
        performance_improvement: number;
        efficiency_gain: number;
        risk_mitigation: number;
    };
    implementation: {
        complexity: 'low' | 'medium' | 'high';
        timeline: string;
        steps: string[];
        risks: string[];
        dependencies: string[];
    };
    roi: {
        investment: number;
        annual_savings: number;
        payback_period_months: number;
        net_present_value: number;
    };
    confidence: number;
    priority: number;
    created_at: Date;
}
export declare class ResourceEfficiencyAnalyticsService extends EventEmitter {
    private config;
    private benchmarks;
    private insights;
    private wasteAnalyses;
    private optimizationOpportunities;
    private analysisScheduler?;
    constructor(config: EfficiencyAnalyticsConfig);
    analyzeResourceEfficiency(snapshot: ResourceUtilizationSnapshot): Promise<ResourceEfficiency>;
    private calculateEfficiencyScore;
    private calculateUtilizationEfficiency;
    private scoreUtilization;
    private calculatePerformanceEfficiency;
    private calculateCostEfficiency;
    private calculateReliabilityEfficiency;
    private analyzeWaste;
    private analyzeOverProvisioning;
    private analyzeUnderUtilization;
    private analyzeIdleResources;
    private analyzeInefficientAllocation;
    private calculateOptimalAllocation;
    private generateWasteRecommendations;
    private identifyOptimizationOpportunities;
    private analyzeRightsizingOpportunity;
    private analyzeConsolidationOpportunity;
    private analyzeSchedulingOpportunity;
    private generateEfficiencyInsights;
    private getBenchmarks;
    private initializeBenchmarks;
    private startAnalysisScheduler;
    private runScheduledAnalysis;
    private updateBenchmarks;
    private cleanupExpiredInsights;
    private storeInsights;
    private storeWasteAnalysis;
    private storeOptimizationOpportunities;
    getInsights(resourceId: string): EfficiencyInsight[];
    getWasteAnalyses(resourceId: string): WasteAnalysis[];
    getOptimizationOpportunities(resourceId: string): OptimizationOpportunity[];
    getBenchmark(resourceType: ResourceType): EfficiencyBenchmark | undefined;
    private generateInsightId;
    private generateOpportunityId;
    private calculateImprovementPotential;
    private determineImprovementPriority;
    private estimateEffort;
    private getCostData;
    shutdown(): Promise<void>;
}

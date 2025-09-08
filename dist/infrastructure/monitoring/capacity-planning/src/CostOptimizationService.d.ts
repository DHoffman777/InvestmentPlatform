import { EventEmitter } from 'events';
import { CostOptimization, ResourceType } from './CapacityPlanningDataModel';
export interface CostOptimizationConfig {
    analysisInterval: number;
    minSavingsThreshold: number;
    maxRiskTolerance: number;
    enableRealTimeOptimization: boolean;
    costDataSources: CostDataSource[];
    optimizationStrategies: OptimizationStrategy[];
    budgetConstraints: BudgetConstraint[];
}
export interface CostDataSource {
    type: 'aws' | 'azure' | 'gcp' | 'internal';
    configuration: Record<string, any>;
    isActive: boolean;
}
export interface OptimizationStrategy {
    type: 'rightsizing' | 'reserved_instances' | 'spot_instances' | 'storage_optimization' | 'license_optimization';
    enabled: boolean;
    parameters: Record<string, any>;
    minSavingsPercentage: number;
}
export interface BudgetConstraint {
    resourceType: ResourceType;
    monthlyBudget: number;
    alertThreshold: number;
}
export interface CostAnalysisResult {
    resourceId: string;
    currentCosts: CostBreakdown;
    optimizedCosts: CostBreakdown;
    savingsOpportunity: number;
    optimizations: OptimizationOpportunity[];
    riskAssessment: RiskAssessment;
    recommendations: CostRecommendation[];
}
export interface CostBreakdown {
    compute: number;
    storage: number;
    network: number;
    licenses: number;
    support: number;
    total: number;
}
export interface OptimizationOpportunity {
    type: string;
    description: string;
    potentialSavings: number;
    implementationEffort: 'low' | 'medium' | 'high';
    paybackPeriod: number;
    confidence: number;
}
export interface RiskAssessment {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
    impactAnalysis: {
        performance: number;
        availability: number;
        security: number;
    };
}
export interface CostRecommendation {
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    description: string;
    expectedSavings: number;
    implementationSteps: string[];
    timeline: string;
    dependencies: string[];
}
export interface CostForecast {
    resourceId: string;
    forecastPeriod: {
        start: Date;
        end: Date;
    };
    projectedCosts: Array<{
        month: string;
        cost: number;
        confidence: number;
    }>;
    savingsOpportunities: Array<{
        month: string;
        savings: number;
        cumulativeSavings: number;
    }>;
    budgetComparison: {
        allocatedBudget: number;
        projectedSpend: number;
        variance: number;
    };
}
export declare class CostOptimizationService extends EventEmitter {
    private optimizations;
    private analysisTimer;
    private config;
    private costAnalyzer;
    private rightsizingOptimizer;
    private reservedInstanceOptimizer;
    private storageOptimizer;
    private licenseOptimizer;
    constructor(config: CostOptimizationConfig);
    analyzeCostOptimization(resourceId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<CostOptimization>;
    batchAnalyzeCostOptimization(resourceIds: string[]): Promise<Map<string, CostOptimization>>;
    generateCostForecast(resourceId: string, forecastMonths?: number): Promise<CostForecast>;
    getTopCostOptimizationOpportunities(limit?: number): Promise<Array<{
        resourceId: string;
        optimization: CostOptimization;
        score: number;
    }>>;
    implementOptimization(resourceId: string, optimizationId: string, approvalLevel: 'automatic' | 'manager' | 'executive'): Promise<{
        success: boolean;
        implementedPhases: string[];
        estimatedSavings: number;
        actualSavings?: number;
    }>;
    trackOptimizationROI(resourceId: string): Promise<{
        investment: number;
        actualSavings: number;
        roi: number;
        paybackPeriod: number;
        npv: number;
        irr: number;
    }>;
    private performCostAnalysis;
    private buildCostOptimization;
    private calculateOptimizedCosts;
    private assessOptimizationRisk;
    private generateCostRecommendations;
    private buildImplementationPlan;
    private calculateROI;
    private calculateIRR;
    private calculateOptimizationScore;
    private implementPhase;
    private calculateImplementationCost;
    private getActualSavings;
    private mapEffortToComplexity;
    private getImplementationSteps;
    private projectFutureCosts;
    private projectSavingsOpportunities;
    private compareToBudget;
    private getResourceInventory;
    private getResourceMetrics;
    private getResourceTrends;
    private getHistoricalCosts;
    private chunkArray;
    private startAnalysis;
    private performScheduledAnalysis;
    private generateOptimizationId;
    private generateBatchId;
    getOptimization(resourceId: string): CostOptimization | null;
    getAllOptimizations(): CostOptimization[];
    shutdown(): Promise<any>;
}

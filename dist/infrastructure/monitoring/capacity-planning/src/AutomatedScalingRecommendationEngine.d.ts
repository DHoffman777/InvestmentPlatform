import { EventEmitter } from 'events';
import { ScalingRecommendation, ResourceMetrics, CapacityPrediction, CapacityTrend, ScalingThreshold, ResourceInventory } from './CapacityPlanningDataModel';
export interface RecommendationEngineConfig {
    evaluationInterval: number;
    recommendationValidityPeriod: number;
    minConfidenceThreshold: number;
    maxRecommendationsPerResource: number;
    enableProactiveRecommendations: boolean;
    enableCostOptimization: boolean;
    enablePerformanceTuning: boolean;
    riskTolerance: 'low' | 'medium' | 'high';
    businessHours: {
        start: number;
        end: number;
        timezone: string;
    };
    scalingConstraints: ScalingConstraints;
}
export interface ScalingConstraints {
    maxScaleUpFactor: number;
    maxScaleDownFactor: number;
    minCooldownPeriod: number;
    maxConcurrentScalings: number;
    budgetLimit: number;
    maintenanceWindows: Array<{
        start: Date;
        end: Date;
        recurring: boolean;
    }>;
    dependencies: Record<string, string[]>;
}
export interface RecommendationContext {
    resourceId: string;
    currentMetrics: ResourceMetrics;
    historicalTrend: CapacityTrend;
    predictions: CapacityPrediction[];
    thresholds: ScalingThreshold[];
    inventory: ResourceInventory;
    recentRecommendations: ScalingRecommendation[];
    businessContext: {
        isBusinessHours: boolean;
        expectedLoad: 'low' | 'medium' | 'high';
        criticalPeriod: boolean;
    };
}
export interface RecommendationScore {
    performance: number;
    cost: number;
    risk: number;
    urgency: number;
    feasibility: number;
    overall: number;
}
export declare class AutomatedScalingRecommendationEngine extends EventEmitter {
    private recommendations;
    private evaluationTimer;
    private config;
    private decisionEngine;
    private riskAssessor;
    private costOptimizer;
    private performanceAnalyzer;
    constructor(config: RecommendationEngineConfig);
    generateRecommendations(context: RecommendationContext): Promise<ScalingRecommendation[]>;
    batchGenerateRecommendations(contexts: RecommendationContext[]): Promise<Map<string, ScalingRecommendation[]>>;
    evaluateRecommendationEffectiveness(recommendationId: string): Promise<{
        implementationRate: number;
        successRate: number;
        costSavings: number;
        performanceImprovement: number;
        userSatisfaction: number;
        lessons: string[];
    }>;
    updateRecommendationFeedback(recommendationId: string, feedback: {
        rating: number;
        comment?: string;
        actualImpact?: {
            performance: number;
            cost: number;
        };
        wouldRecommendAgain: boolean;
        submittedBy: string;
    }): Promise<void>;
    getRecommendationsByResource(resourceId: string): Promise<ScalingRecommendation[]>;
    getRecommendationsByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<ScalingRecommendation[]>;
    getActiveRecommendations(): Promise<ScalingRecommendation[]>;
    private identifyRecommendationCandidates;
    private generateProactiveRecommendations;
    private generateReactiveRecommendations;
    private generateCostOptimizationRecommendations;
    private generatePerformanceTuningRecommendations;
    private scoreRecommendations;
    private calculateRecommendationScore;
    private calculateUrgency;
    private calculateFeasibility;
    private filterRecommendations;
    private optimizeRecommendationSet;
    private resolveRecommendationConflicts;
    private applyBusinessRules;
    private updateRecommendationModels;
    private extractLessonsLearned;
    private estimatePerformanceImpact;
    private estimateCostImpact;
    private getCurrentCapacity;
    private chunkArray;
    private startEvaluation;
    private performScheduledEvaluation;
    private generateRecommendationId;
    private generateBatchId;
    getRecommendation(recommendationId: string): ScalingRecommendation | null;
    getAllRecommendations(): ScalingRecommendation[];
    shutdown(): Promise<void>;
}

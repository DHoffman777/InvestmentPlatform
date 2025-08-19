import { EventEmitter } from 'events';
import { CapacityPlanningConfig, CapacityPlanningResult, LoadTestResult } from '../types';
export declare class CapacityPlanningService extends EventEmitter {
    private planningResults;
    private readonly baseCosts;
    constructor();
    generateCapacityPlan(config: CapacityPlanningConfig): Promise<string>;
    private generateCapacityProjections;
    private getSeasonalityMultiplier;
    private calculateRequiredCapacity;
    private calculateUtilizationProjections;
    private analyzeBottlenecks;
    private getSeverity;
    private generateScalingRecommendations;
    private generateVerticalScalingAction;
    private estimateHorizontalScalingCost;
    private estimateVerticalScalingCost;
    private estimateHybridScalingCost;
    private generateCostProjections;
    private generateCapacityScenarios;
    private assessRisks;
    analyzeLoadTestResults(loadTestResults: LoadTestResult[], currentCapacity: CapacityPlanningConfig['currentCapacity']): Promise<{
        capacityUtilization: {
            cpu: number;
            memory: number;
            network: number;
        };
        scalingRecommendations: string[];
        performanceBottlenecks: string[];
    }>;
    private generatePlanId;
    getCapacityPlan(planId: string): CapacityPlanningResult | undefined;
    getAllPlans(): CapacityPlanningResult[];
    exportPlanToCSV(planId: string): Promise<string>;
}

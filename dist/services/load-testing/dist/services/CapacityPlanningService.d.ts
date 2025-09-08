export const __esModule: boolean;
export class CapacityPlanningService extends events_1<[never]> {
    constructor();
    planningResults: Map<any, any>;
    baseCosts: {
        cpuCoreHour: number;
        memoryGBHour: number;
        storageGBMonth: number;
        networkGBMonth: number;
        serverInstanceMonth: number;
        monitoringMonth: number;
        backupGBMonth: number;
        supportEngineersMonth: number;
        licensingPerCoreMonth: number;
    };
    generateCapacityPlan(config: any): Promise<string>;
    generateCapacityProjections(config: any): {
        month: Date;
        expectedUsers: number;
        expectedRequestsPerSecond: number;
        requiredCapacity: {
            servers: number;
            cpuCores: number;
            memoryGB: number;
            networkMbps: number;
            storageGB: number;
        };
        utilizationProjections: {
            cpu: number;
            memory: number;
            network: number;
            storage: number;
        };
    }[];
    getSeasonalityMultiplier(date: any, config: any): any;
    calculateRequiredCapacity(users: any, rps: any, config: any): {
        servers: number;
        cpuCores: number;
        memoryGB: number;
        networkMbps: number;
        storageGB: number;
    };
    calculateUtilizationProjections(requiredCapacity: any, currentCapacity: any): {
        cpu: number;
        memory: number;
        network: number;
        storage: number;
    };
    analyzeBottlenecks(projections: any, config: any): {
        resource: string;
        severity: string;
        expectedTime: any;
        currentUtilization: number;
        projectedUtilization: any;
        impact: string;
        mitigation: string[];
    }[];
    getSeverity(utilization: any): "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
    generateScalingRecommendations(projections: any, bottlenecks: any, config: any): {
        trigger: Date;
        type: string;
        action: string;
        reasoning: string;
        estimatedCost: number;
        alternatives: {
            action: string;
            cost: number;
            pros: string[];
            cons: string[];
        }[];
    }[];
    generateVerticalScalingAction(bottleneck: any): "Upgrade to servers with additional CPU cores (double current capacity)" | "Increase memory capacity by 50-100% on current servers" | "Upgrade network infrastructure to higher bandwidth" | "Add additional storage capacity or upgrade to faster storage" | "Upgrade server capacity for better performance";
    estimateHorizontalScalingCost(additionalServers: any): number;
    estimateVerticalScalingCost(bottlenecks: any): number;
    estimateHybridScalingCost(bottlenecks: any): number;
    generateCostProjections(projections: any, config: any): any;
    generateCapacityScenarios(config: any): {
        name: string;
        description: string;
        assumptions: string[];
        projections: {
            month: Date;
            expectedUsers: number;
            expectedRequestsPerSecond: number;
            requiredCapacity: {
                servers: number;
                cpuCores: number;
                memoryGB: number;
                networkMbps: number;
                storageGB: number;
            };
            utilizationProjections: {
                cpu: number;
                memory: number;
                network: number;
                storage: number;
            };
        }[];
        confidence: number;
    }[];
    assessRisks(result: any, config: any): {
        overallRisk: string;
        risks: {
            type: string;
            severity: string;
            probability: number;
            impact: string;
            mitigation: string[];
            contingency: string;
        }[];
    };
    analyzeLoadTestResults(loadTestResults: any, currentCapacity: any): Promise<{
        capacityUtilization: {
            cpu: number;
            memory: number;
            network: number;
        };
        scalingRecommendations: string[];
        performanceBottlenecks: string[];
    }>;
    generatePlanId(): string;
    getCapacityPlan(planId: any): any;
    getAllPlans(): any[];
    exportPlanToCSV(planId: any): Promise<string>;
}
import events_1 = require("events");

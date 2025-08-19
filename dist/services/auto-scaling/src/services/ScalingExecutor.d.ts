import { EventEmitter } from 'events';
import { AutoScalingDecision, ScalingEvent, AutoScalingServiceConfig } from '../types';
export declare class ScalingExecutor extends EventEmitter {
    private config;
    private k8sApi?;
    private docker?;
    private providerAdapters;
    private executionHistory;
    private activeScalings;
    constructor(config: AutoScalingServiceConfig);
    private initializeProviders;
    executeScalingDecision(decision: AutoScalingDecision): Promise<ScalingEvent>;
    private performScaling;
    private scaleKubernetesService;
    private scaleDockerService;
    private scaleCloudService;
    private executeHooks;
    private generateEventId;
    private addEventToHistory;
    validateScalingCapability(serviceName: string): Promise<{
        canScale: boolean;
        issues: string[];
        currentInstances: number;
        limits: {
            min: number;
            max: number;
        };
    }>;
    testScalingOperation(serviceName: string, targetInstances: number): Promise<{
        feasible: boolean;
        estimatedDuration: number;
        resourceRequirements: {
            cpu: number;
            memory: number;
            network: number;
        };
        risks: string[];
    }>;
    getScalingHistory(serviceName: string, limit?: number): ScalingEvent[];
    getAllScalingHistory(limit?: number): ScalingEvent[];
    getActiveScalings(): string[];
    emergencyScaleDown(serviceName: string, emergencyInstances: number): Promise<ScalingEvent>;
    rollbackLastScaling(serviceName: string): Promise<ScalingEvent | null>;
}

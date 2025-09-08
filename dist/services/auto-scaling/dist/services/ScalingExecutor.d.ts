export const __esModule: boolean;
export class ScalingExecutor extends events_1<[never]> {
    constructor(config: any);
    config: any;
    providerAdapters: Map<any, any>;
    executionHistory: Map<any, any>;
    activeScalings: Set<any>;
    initializeProviders(): void;
    k8sApi: any;
    docker: any;
    executeScalingDecision(decision: any): Promise<{
        id: string;
        timestamp: Date;
        rule: any;
        action: {
            type: any;
            targetInstances: any;
            targetServices: any[];
            gracefulShutdown: boolean;
        };
        reason: any;
        metricsSnapshot: any;
        previousInstances: any;
        newInstances: any;
        success: boolean;
        duration: number;
    }>;
    performScaling(decision: any): Promise<any>;
    scaleKubernetesService(serviceName: any, targetInstances: any): Promise<{
        success: boolean;
        previousInstances: any;
        newInstances: any;
        duration: number;
        warnings: any[];
    }>;
    scaleDockerService(serviceName: any, targetInstances: any): Promise<{
        success: boolean;
        previousInstances: any;
        newInstances: any;
        duration: number;
        warnings: any[];
    }>;
    scaleCloudService(serviceName: any, targetInstances: any): Promise<any>;
    executeHooks(phase: any, serviceName: any): Promise<void>;
    generateEventId(): string;
    addEventToHistory(serviceName: any, event: any): void;
    validateScalingCapability(serviceName: any): Promise<{
        canScale: boolean;
        issues: string[];
        currentInstances: number;
        limits: {
            min: any;
            max: any;
        };
    }>;
    testScalingOperation(serviceName: any, targetInstances: any): Promise<{
        feasible: boolean;
        estimatedDuration: number;
        resourceRequirements: {
            cpu: number;
            memory: number;
            network: number;
        };
        risks: string[];
    }>;
    getScalingHistory(serviceName: any, limit: any): any;
    getAllScalingHistory(limit: any): any[];
    getActiveScalings(): any[];
    emergencyScaleDown(serviceName: any, emergencyInstances: any): Promise<{
        id: string;
        timestamp: Date;
        rule: any;
        action: {
            type: any;
            targetInstances: any;
            targetServices: any[];
            gracefulShutdown: boolean;
        };
        reason: any;
        metricsSnapshot: any;
        previousInstances: any;
        newInstances: any;
        success: boolean;
        duration: number;
    }>;
    rollbackLastScaling(serviceName: any): Promise<{
        id: string;
        timestamp: Date;
        rule: any;
        action: {
            type: any;
            targetInstances: any;
            targetServices: any[];
            gracefulShutdown: boolean;
        };
        reason: any;
        metricsSnapshot: any;
        previousInstances: any;
        newInstances: any;
        success: boolean;
        duration: number;
    }>;
}
import events_1 = require("events");

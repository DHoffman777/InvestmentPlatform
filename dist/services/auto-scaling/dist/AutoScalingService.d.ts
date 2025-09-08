export const __esModule: boolean;
export class AutoScalingService extends events_1<[never]> {
    constructor(config: any, financialProfile: any);
    config: any;
    financialProfile: any;
    isRunning: boolean;
    app: any;
    initializeServices(): void;
    redis: any;
    metricsCollector: MetricsCollector_1.MetricsCollector;
    decisionEngine: ScalingDecisionEngine_1.ScalingDecisionEngine;
    scalingExecutor: ScalingExecutor_1.ScalingExecutor;
    setupEventHandlers(): void;
    evaluateScalingDecision(serviceName: any, metrics: any): Promise<void>;
    setupMiddleware(): void;
    setupRoutes(): void;
    getHealthStatus(): Promise<{
        status: string;
        timestamp: Date;
        components: {
            metricsCollector: {
                healthy: boolean;
                issues: string[];
                servicesMonitored: number;
                lastCollection: Date;
            };
            decisionEngine: {
                healthy: boolean;
            };
            scalingExecutor: {
                healthy: boolean;
                activeScalings: number;
            };
            redis: {
                healthy: boolean;
                status: any;
            };
        };
        configuration: {
            enabled: any;
            provider: any;
            rulesCount: any;
        };
        runtime: {
            isRunning: boolean;
            uptime: number;
            memoryUsage: NodeJS.MemoryUsage;
        };
    }>;
    getScalingStatus(): Promise<{
        timestamp: Date;
        overall: {
            enabled: any;
            activeScalings: number;
            totalServices: number;
        };
        services: {
            serviceName: string;
            currentInstances: number;
            healthyInstances: number;
            unhealthyInstances: number;
            cpuUsage: number;
            memoryUsage: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
            lastUpdated: Date;
        }[];
        limits: any;
    }>;
    storeScalingDecision(decision: any): Promise<void>;
    storeScalingEvent(event: any): Promise<void>;
    sendAlert(type: any, message: any, data: any): Promise<void>;
    generateScalingReport(startDate: any, endDate: any, services: any): Promise<{
        id: string;
        generatedAt: Date;
        period: {
            start: any;
            end: any;
        };
        summary: {
            totalScalingEvents: number;
            successfulScalings: number;
            failedScalings: number;
            averageResponseTime: number;
            costImpact: {
                totalCost: number;
                costSavings: number;
                costIncrease: number;
            };
        };
        serviceAnalysis: {
            serviceName: any;
            scalingEvents: any;
            averageInstances: number;
            peakInstances: number;
            minInstances: number;
            utilizationStats: {
                cpu: {
                    avg: number;
                    max: number;
                    min: number;
                };
                memory: {
                    avg: number;
                    max: number;
                    min: number;
                };
            };
            performanceImpact: {
                responseTimeChange: number;
                throughputChange: number;
                errorRateChange: number;
            };
        }[];
        recommendations: {
            type: string;
            priority: string;
            description: string;
            expectedBenefit: string;
            implementationComplexity: string;
        }[];
        predictions: {
            nextWeek: any[];
            seasonalForecast: any[];
        };
    }>;
    updateConfiguration(newConfig: any): Promise<void>;
    start(port?: number): Promise<void>;
    reportingSchedule: any;
    stop(): Promise<void>;
    evaluationInterval: any;
    getApp(): any;
}
import events_1 = require("events");
import MetricsCollector_1 = require("./services/MetricsCollector");
import ScalingDecisionEngine_1 = require("./services/ScalingDecisionEngine");
import ScalingExecutor_1 = require("./services/ScalingExecutor");

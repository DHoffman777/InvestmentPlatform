export const __esModule: boolean;
export class LoadTestingService extends events_1<[never]> {
    constructor(config: any);
    config: any;
    scheduledTests: Map<any, any>;
    benchmarkResults: Map<any, any>;
    app: any;
    initializeServices(): void;
    redis: any;
    executor: LoadTestExecutor_1.LoadTestExecutor;
    capacityService: CapacityPlanningService_1.CapacityPlanningService;
    setupEventHandlers(): void;
    setupMiddleware(): void;
    setupRoutes(): void;
    setupCronJobs(): void;
    validateTestConfig(config: any): {
        valid: boolean;
        issues: string[];
    };
    storeTestMetadata(testId: any, metadata: any): Promise<void>;
    storeTestResults(testId: any, result: any): Promise<void>;
    updateTestProgress(testId: any, progress: any): Promise<void>;
    getStoredTestResult(testId: any): Promise<any>;
    storeCapacityPlan(planId: any, plan: any): Promise<void>;
    listTests(status: any, limit?: number, offset?: number): Promise<any[]>;
    scheduleTest(config: any, schedule: any): Promise<string>;
    executeBenchmark(config: any): Promise<string>;
    compareBenchmarkResults(results: any, metrics: any): {
        improvements: any[];
        regressions: any[];
        winner: undefined;
    } | {
        improvements: {
            metric: any;
            target: any;
            improvement: number;
        }[];
        regressions: {
            metric: any;
            target: any;
            regression: number;
        }[];
        winner: any;
    };
    extractMetricValue(result: any, metric: any): number;
    evaluateBenchmarkPassing(result: any, criteria: any): boolean;
    generateBenchmarkSummary(result: any): string;
    sendNotification(type: any, message: any, data: any): Promise<void>;
    cleanupOldTests(): Promise<void>;
    getSystemStats(): Promise<{
        activeTests: number;
        scheduledTests: number;
        benchmarks: number;
        redis: {
            status: any;
            memory: any;
        };
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
    }>;
    getHealthStatus(): Promise<{
        status: string;
        timestamp: Date;
        components: {
            executor: {
                healthy: boolean;
                issues: string[];
            };
            redis: {
                healthy: boolean;
                status: any;
            };
            capacityPlanning: {
                healthy: boolean;
            };
        };
        activeTests: number;
        maxConcurrentTests: any;
    }>;
    getTestTemplates(): ({
        name: string;
        description: string;
        target: {
            url: string;
            headers: {
                'Content-Type': string;
            };
            authentication?: undefined;
        };
        scenarios: {
            name: string;
            weight: number;
            requests: {
                name: string;
                method: string;
                url: string;
                validation: {
                    statusCode: number[];
                    responseTime: number;
                };
            }[];
        }[];
        duration: number;
        thresholds: {
            avgResponseTime: number;
            p95ResponseTime: number;
            errorRate: number;
            throughput: number;
        };
        tags: string[];
        rampUp?: undefined;
    } | {
        name: string;
        description: string;
        target: {
            url: string;
            headers: {
                'Content-Type': string;
            };
            authentication: {
                type: string;
                token: string;
            };
        };
        scenarios: {
            name: string;
            weight: number;
            requests: {
                name: string;
                method: string;
                url: string;
                validation: {
                    statusCode: number[];
                    responseTime: number;
                };
            }[];
        }[];
        duration: number;
        rampUp: {
            enabled: boolean;
            duration: number;
            stages: {
                duration: number;
                target: number;
            }[];
        };
        thresholds: {
            avgResponseTime: number;
            p95ResponseTime: number;
            errorRate: number;
            throughput: number;
        };
        tags: string[];
    })[];
    start(port?: number): void;
    shutdown(): Promise<void>;
    getApp(): any;
}
import events_1 = require("events");
import LoadTestExecutor_1 = require("./services/LoadTestExecutor");
import CapacityPlanningService_1 = require("./services/CapacityPlanningService");

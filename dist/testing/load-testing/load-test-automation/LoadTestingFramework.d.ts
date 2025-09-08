import { EventEmitter } from 'events';
/**
 * Load Testing Framework for Investment Management Platform
 * Comprehensive load testing suite with Artillery, JMeter, and K6 integration
 */
export interface LoadTestConfig {
    testName: string;
    duration: number;
    users: {
        concurrent: number;
        rampUp: number;
        total?: number;
    };
    scenarios: LoadTestScenario[];
    environment: {
        baseUrl: string;
        apiKey?: string;
        timeout: number;
    };
    thresholds: PerformanceThresholds;
    reporting: ReportingConfig;
}
export interface LoadTestScenario {
    name: string;
    weight: number;
    endpoints: TestEndpoint[];
    userProfile: UserProfile;
    dataSet?: string;
}
export interface TestEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    headers?: Record<string, string>;
    body?: any;
    validation?: ResponseValidation;
    weight: number;
}
export interface UserProfile {
    role: 'admin' | 'portfolio_manager' | 'client' | 'compliance_officer';
    credentials: {
        username: string;
        password: string;
        mfaToken?: string;
    };
    permissions: string[];
}
export interface PerformanceThresholds {
    responseTime: {
        p50: number;
        p95: number;
        p99: number;
        max: number;
    };
    throughput: {
        rps: number;
        tps: number;
    };
    errorRate: {
        max: number;
        critical: number;
    };
    resources: {
        cpu: number;
        memory: number;
        diskIO: number;
    };
}
export interface ResponseValidation {
    statusCode: number;
    contentType?: string;
    bodyContains?: string[];
    jsonSchema?: object;
    responseTime?: number;
}
export interface ReportingConfig {
    formats: ('html' | 'json' | 'csv' | 'junit')[];
    outputDir: string;
    realTimeUpdates: boolean;
    dashboardUrl?: string;
}
export interface LoadTestResult {
    testId: string;
    config: LoadTestConfig;
    startTime: Date;
    endTime: Date;
    duration: number;
    metrics: PerformanceMetrics;
    scenarios: ScenarioResult[];
    errors: TestError[];
    summary: TestSummary;
}
export interface PerformanceMetrics {
    responseTime: {
        min: number;
        max: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
    };
    throughput: {
        rps: number;
        tps: number;
        totalRequests: number;
        totalTransactions: number;
    };
    errors: {
        total: number;
        rate: number;
        byType: Record<string, number>;
    };
    resources: {
        cpu: ResourceMetric;
        memory: ResourceMetric;
        diskIO: ResourceMetric;
        networkIO: ResourceMetric;
    };
}
export interface ResourceMetric {
    min: number;
    max: number;
    avg: number;
    samples: number[];
}
export interface ScenarioResult {
    name: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
    throughput: number;
    userCount: number;
}
export interface TestError {
    timestamp: Date;
    scenario: string;
    endpoint: string;
    error: string;
    statusCode?: number;
    responseTime?: number;
}
export interface TestSummary {
    passed: boolean;
    thresholdViolations: ThresholdViolation[];
    recommendations: string[];
    bottlenecks: Bottleneck[];
}
export interface ThresholdViolation {
    metric: string;
    expected: number;
    actual: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface Bottleneck {
    component: string;
    description: string;
    impact: string;
    recommendation: string;
}
export declare class LoadTestingFramework extends EventEmitter {
    private config;
    private testId;
    private startTime;
    private metrics;
    private results;
    private activeUsers;
    private monitoringInterval?;
    constructor(config: LoadTestConfig);
    /**
     * Execute comprehensive load test suite
     */
    executeLoadTest(): Promise<LoadTestResult>;
    /**
     * Execute specific load test scenario
     */
    executeScenario(scenario: LoadTestScenario): Promise<ScenarioResult>;
    /**
     * Execute peak trading hours simulation
     */
    executePeakTradingTest(): Promise<LoadTestResult>;
    /**
     * Execute stress testing to find system limits
     */
    executeStressTest(): Promise<LoadTestResult>;
    /**
     * Execute database-focused load testing
     */
    executeDatabaseLoadTest(): Promise<LoadTestResult>;
    private initializeTestEnvironment;
    private executeScenarios;
    private createUserSession;
    private executeUserActions;
    private selectWeightedEndpoint;
    private makeRequest;
    private validateResponse;
    private updateMetrics;
    private recordError;
    private initializeMetrics;
    private startResourceMonitoring;
    private collectResourceMetrics;
    private collectFinalMetrics;
    private calculateResourceAverages;
    private generateTestResults;
    private generateTestSummary;
    private checkThresholdViolations;
    private generateRecommendations;
    private identifyBottlenecks;
    private generateReports;
    private generateReport;
    private generateHtmlReport;
    private generateCsvReport;
    private executeLoadTestWithConfig;
    private combineStressTestResults;
    private createTestData;
    private performHealthCheck;
    private clearPreviousResults;
    private authenticateUser;
    private cleanup;
    private sleep;
}
export default LoadTestingFramework;

export interface LoadTestConfig {
    name: string;
    description?: string;
    target: {
        url: string;
        headers?: Record<string, string>;
        authentication?: {
            type: 'bearer' | 'basic' | 'custom';
            token?: string;
            username?: string;
            password?: string;
            customHeaders?: Record<string, string>;
        };
    };
    scenarios: LoadTestScenario[];
    duration: number;
    rampUp?: {
        enabled: boolean;
        duration: number;
        stages: Array<{
            duration: number;
            target: number;
        }>;
    };
    thresholds: {
        avgResponseTime: number;
        p95ResponseTime: number;
        errorRate: number;
        throughput: number;
    };
    tags?: string[];
    environment?: string;
}
export interface LoadTestScenario {
    name: string;
    weight: number;
    requests: LoadTestRequest[];
}
export interface LoadTestRequest {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
    validation?: {
        statusCode?: number[];
        responseTime?: number;
        bodyContains?: string[];
        jsonPath?: Array<{
            path: string;
            expectedValue?: any;
            exists?: boolean;
        }>;
    };
    extractors?: Array<{
        name: string;
        jsonPath?: string;
        regex?: string;
        header?: string;
    }>;
}
export interface LoadTestResult {
    id: string;
    config: LoadTestConfig;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startTime: Date;
    endTime?: Date;
    duration: number;
    summary: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        errorRate: number;
        avgResponseTime: number;
        p50ResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        minResponseTime: number;
        maxResponseTime: number;
        throughput: number;
        bytesReceived: number;
        bytesSent: number;
    };
    timeline: LoadTestTimelinePoint[];
    scenarios: ScenarioResult[];
    errors: LoadTestError[];
    thresholdResults: ThresholdResult[];
    recommendations: LoadTestRecommendation[];
}
export interface LoadTestTimelinePoint {
    timestamp: Date;
    activeUsers: number;
    requestsPerSecond: number;
    avgResponseTime: number;
    errorRate: number;
    cpuUsage?: number;
    memoryUsage?: number;
    networkUtilization?: number;
}
export interface ScenarioResult {
    name: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
    requests: RequestResult[];
}
export interface RequestResult {
    name: string;
    method: string;
    url: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    statusCodes: Record<number, number>;
    errors: string[];
}
export interface LoadTestError {
    timestamp: Date;
    type: 'CONNECTION_ERROR' | 'TIMEOUT' | 'HTTP_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN';
    message: string;
    request?: {
        method: string;
        url: string;
        scenario: string;
    };
    details?: any;
}
export interface ThresholdResult {
    name: string;
    threshold: number;
    actual: number;
    passed: boolean;
    type: 'AVG_RESPONSE_TIME' | 'P95_RESPONSE_TIME' | 'ERROR_RATE' | 'THROUGHPUT';
}
export interface LoadTestRecommendation {
    type: 'PERFORMANCE' | 'CAPACITY' | 'CONFIGURATION' | 'INFRASTRUCTURE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    impact: string;
    implementation: string;
    estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface CapacityPlanningConfig {
    currentCapacity: {
        servers: number;
        cpuCores: number;
        memoryGB: number;
        networkMbps: number;
    };
    targetMetrics: {
        maxCpuUtilization: number;
        maxMemoryUtilization: number;
        maxResponseTime: number;
        minThroughput: number;
    };
    growthProjections: {
        userGrowthRate: number;
        requestGrowthRate: number;
        dataGrowthRate: number;
        planningHorizon: number;
    };
    businessPatterns: {
        peakHours: Array<{
            start: string;
            end: string;
            multiplier: number;
        }>;
        seasonality: Array<{
            month: number;
            multiplier: number;
        }>;
        specialEvents: Array<{
            name: string;
            date: Date;
            expectedLoadMultiplier: number;
            duration: number;
        }>;
    };
}
export interface CapacityPlanningResult {
    id: string;
    config: CapacityPlanningConfig;
    generatedAt: Date;
    projections: {
        timeline: CapacityProjection[];
        bottlenecks: BottleneckAnalysis[];
        scalingRecommendations: ScalingRecommendation[];
        costProjections: CostProjection[];
    };
    scenarios: CapacityScenario[];
    riskAssessment: RiskAssessment;
}
export interface CapacityProjection {
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
}
export interface BottleneckAnalysis {
    resource: 'CPU' | 'MEMORY' | 'NETWORK' | 'STORAGE' | 'DATABASE' | 'EXTERNAL_API';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    expectedTime: Date;
    currentUtilization: number;
    projectedUtilization: number;
    impact: string;
    mitigation: string[];
}
export interface ScalingRecommendation {
    trigger: Date;
    type: 'HORIZONTAL' | 'VERTICAL' | 'HYBRID';
    action: string;
    reasoning: string;
    estimatedCost: number;
    alternatives: Array<{
        action: string;
        cost: number;
        pros: string[];
        cons: string[];
    }>;
}
export interface CostProjection {
    month: Date;
    infrastructure: {
        compute: number;
        storage: number;
        network: number;
        monitoring: number;
        backup: number;
    };
    operational: {
        support: number;
        maintenance: number;
        licensing: number;
    };
    total: number;
}
export interface CapacityScenario {
    name: string;
    description: string;
    assumptions: string[];
    projections: CapacityProjection[];
    confidence: number;
}
export interface RiskAssessment {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risks: Array<{
        type: 'CAPACITY' | 'PERFORMANCE' | 'COST' | 'TECHNICAL' | 'BUSINESS';
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        probability: number;
        impact: string;
        mitigation: string[];
        contingency: string;
    }>;
}
export interface BenchmarkConfig {
    name: string;
    type: 'BASELINE' | 'REGRESSION' | 'COMPARISON' | 'STRESS';
    targets: Array<{
        name: string;
        url: string;
        version?: string;
    }>;
    testSuite: LoadTestConfig[];
    comparisonMetrics: string[];
    passingCriteria: {
        maxRegressionPercent: number;
        minImprovementPercent?: number;
    };
}
export interface BenchmarkResult {
    id: string;
    config: BenchmarkConfig;
    executedAt: Date;
    results: Array<{
        target: string;
        version?: string;
        loadTestResults: LoadTestResult[];
    }>;
    comparison: {
        winner?: string;
        improvements: Array<{
            metric: string;
            target: string;
            improvement: number;
        }>;
        regressions: Array<{
            metric: string;
            target: string;
            regression: number;
        }>;
    };
    passed: boolean;
    summary: string;
}

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
  duration: number; // seconds
  rampUp?: {
    enabled: boolean;
    duration: number; // seconds
    stages: Array<{
      duration: number;
      target: number; // concurrent users
    }>;
  };
  thresholds: {
    avgResponseTime: number; // ms
    p95ResponseTime: number; // ms
    errorRate: number; // percentage (0-100)
    throughput: number; // requests per second
  };
  tags?: string[];
  environment?: string;
}

export interface LoadTestScenario {
  name: string;
  weight: number; // percentage of total requests
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
    responseTime?: number; // max acceptable response time
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
  duration: number; // actual duration in seconds
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number; // percentage
    avgResponseTime: number; // ms
    p50ResponseTime: number; // ms
    p95ResponseTime: number; // ms
    p99ResponseTime: number; // ms
    minResponseTime: number; // ms
    maxResponseTime: number; // ms
    throughput: number; // requests per second
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
    maxCpuUtilization: number; // percentage
    maxMemoryUtilization: number; // percentage
    maxResponseTime: number; // ms
    minThroughput: number; // requests per second
  };
  growthProjections: {
    userGrowthRate: number; // percentage per month
    requestGrowthRate: number; // percentage per month
    dataGrowthRate: number; // percentage per month
    planningHorizon: number; // months
  };
  businessPatterns: {
    peakHours: Array<{
      start: string; // HH:MM
      end: string; // HH:MM
      multiplier: number; // load multiplier during peak
    }>;
    seasonality: Array<{
      month: number; // 1-12
      multiplier: number; // load multiplier for the month
    }>;
    specialEvents: Array<{
      name: string;
      date: Date;
      expectedLoadMultiplier: number;
      duration: number; // hours
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
    cpu: number; // percentage
    memory: number; // percentage
    network: number; // percentage
    storage: number; // percentage
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
  confidence: number; // percentage
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risks: Array<{
    type: 'CAPACITY' | 'PERFORMANCE' | 'COST' | 'TECHNICAL' | 'BUSINESS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    probability: number; // percentage
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
      improvement: number; // percentage
    }>;
    regressions: Array<{
      metric: string;
      target: string;
      regression: number; // percentage
    }>;
  };
  passed: boolean;
  summary: string;
}
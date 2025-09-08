"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTestingService = exports.RegressionSeverity = exports.ArtifactType = exports.LogLevel = exports.RecommendationPriority = exports.RecommendationCategory = exports.WarningSeverity = exports.ComparisonOperator = exports.TestMetricType = exports.TestExecutionStatus = exports.AuthenticationType = exports.ThinkTimeDistribution = exports.RampUpStrategy = exports.LoadPattern = exports.TestType = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
// Enums
var TestType;
(function (TestType) {
    TestType["LOAD_TEST"] = "load_test";
    TestType["STRESS_TEST"] = "stress_test";
    TestType["ENDURANCE_TEST"] = "endurance_test";
    TestType["SPIKE_TEST"] = "spike_test";
    TestType["VOLUME_TEST"] = "volume_test";
    TestType["SMOKE_TEST"] = "smoke_test";
    TestType["BASELINE_TEST"] = "baseline_test";
})(TestType || (exports.TestType = TestType = {}));
var LoadPattern;
(function (LoadPattern) {
    LoadPattern["CONSTANT"] = "constant";
    LoadPattern["RAMP_UP"] = "ramp_up";
    LoadPattern["SPIKE"] = "spike";
    LoadPattern["STEP"] = "step";
    LoadPattern["WAVE"] = "wave";
    LoadPattern["CUSTOM"] = "custom";
})(LoadPattern || (exports.LoadPattern = LoadPattern = {}));
var RampUpStrategy;
(function (RampUpStrategy) {
    RampUpStrategy["LINEAR"] = "linear";
    RampUpStrategy["EXPONENTIAL"] = "exponential";
    RampUpStrategy["STEP_WISE"] = "step_wise";
    RampUpStrategy["CUSTOM"] = "custom";
})(RampUpStrategy || (exports.RampUpStrategy = RampUpStrategy = {}));
var ThinkTimeDistribution;
(function (ThinkTimeDistribution) {
    ThinkTimeDistribution["UNIFORM"] = "uniform";
    ThinkTimeDistribution["NORMAL"] = "normal";
    ThinkTimeDistribution["EXPONENTIAL"] = "exponential";
    ThinkTimeDistribution["CONSTANT"] = "constant";
})(ThinkTimeDistribution || (exports.ThinkTimeDistribution = ThinkTimeDistribution = {}));
var AuthenticationType;
(function (AuthenticationType) {
    AuthenticationType["NONE"] = "none";
    AuthenticationType["BASIC"] = "basic";
    AuthenticationType["BEARER"] = "bearer";
    AuthenticationType["API_KEY"] = "api_key";
    AuthenticationType["OAUTH2"] = "oauth2";
})(AuthenticationType || (exports.AuthenticationType = AuthenticationType = {}));
var TestExecutionStatus;
(function (TestExecutionStatus) {
    TestExecutionStatus["PENDING"] = "pending";
    TestExecutionStatus["RUNNING"] = "running";
    TestExecutionStatus["COMPLETED"] = "completed";
    TestExecutionStatus["FAILED"] = "failed";
    TestExecutionStatus["CANCELLED"] = "cancelled";
    TestExecutionStatus["TIMEOUT"] = "timeout";
})(TestExecutionStatus || (exports.TestExecutionStatus = TestExecutionStatus = {}));
var TestMetricType;
(function (TestMetricType) {
    TestMetricType["RESPONSE_TIME"] = "response_time";
    TestMetricType["THROUGHPUT"] = "throughput";
    TestMetricType["ERROR_RATE"] = "error_rate";
    TestMetricType["CPU_USAGE"] = "cpu_usage";
    TestMetricType["MEMORY_USAGE"] = "memory_usage";
    TestMetricType["NETWORK_IO"] = "network_io";
    TestMetricType["DISK_IO"] = "disk_io";
    TestMetricType["DATABASE_CONNECTIONS"] = "database_connections";
    TestMetricType["CUSTOM"] = "custom";
})(TestMetricType || (exports.TestMetricType = TestMetricType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["LESS_THAN"] = "lt";
    ComparisonOperator["LESS_THAN_OR_EQUAL"] = "lte";
    ComparisonOperator["GREATER_THAN"] = "gt";
    ComparisonOperator["GREATER_THAN_OR_EQUAL"] = "gte";
    ComparisonOperator["EQUALS"] = "eq";
    ComparisonOperator["NOT_EQUALS"] = "ne";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var WarningSeverity;
(function (WarningSeverity) {
    WarningSeverity["LOW"] = "low";
    WarningSeverity["MEDIUM"] = "medium";
    WarningSeverity["HIGH"] = "high";
})(WarningSeverity || (exports.WarningSeverity = WarningSeverity = {}));
var RecommendationCategory;
(function (RecommendationCategory) {
    RecommendationCategory["PERFORMANCE"] = "performance";
    RecommendationCategory["SCALABILITY"] = "scalability";
    RecommendationCategory["RELIABILITY"] = "reliability";
    RecommendationCategory["CONFIGURATION"] = "configuration";
})(RecommendationCategory || (exports.RecommendationCategory = RecommendationCategory = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["LOW"] = "low";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["CRITICAL"] = "critical";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var ArtifactType;
(function (ArtifactType) {
    ArtifactType["LOG_FILE"] = "log_file";
    ArtifactType["REPORT_HTML"] = "report_html";
    ArtifactType["REPORT_JSON"] = "report_json";
    ArtifactType["GRAPH_IMAGE"] = "graph_image";
    ArtifactType["RAW_DATA"] = "raw_data";
    ArtifactType["SCRIPT"] = "script";
})(ArtifactType || (exports.ArtifactType = ArtifactType = {}));
var RegressionSeverity;
(function (RegressionSeverity) {
    RegressionSeverity["MINOR"] = "minor";
    RegressionSeverity["MODERATE"] = "moderate";
    RegressionSeverity["MAJOR"] = "major";
    RegressionSeverity["CRITICAL"] = "critical";
})(RegressionSeverity || (exports.RegressionSeverity = RegressionSeverity = {}));
class PerformanceTestingService extends events_1.EventEmitter {
    config;
    tests = new Map();
    executions = new Map();
    schedules = new Map();
    activeExecutions = new Map();
    regressionBaselines = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeTestingFramework();
        this.startScheduler();
    }
    initializeTestingFramework() {
        // Ensure test results directory exists
        if (!(0, fs_1.existsSync)(this.config.testReportsDirectory)) {
            (0, fs_1.mkdirSync)(this.config.testReportsDirectory, { recursive: true });
        }
        // Create default test templates
        this.createDefaultTests();
    }
    createDefaultTests() {
        // Create a basic load test template
        const loadTest = {
            id: 'default_load_test',
            name: 'Default Load Test',
            description: 'Basic load test template for API endpoints',
            type: TestType.LOAD_TEST,
            configuration: {
                load_profile: {
                    virtual_users: 50,
                    requests_per_second: 100,
                    load_pattern: LoadPattern.RAMP_UP,
                    load_distribution: [{
                            endpoint: '/api/health',
                            weight: 1.0,
                            method: 'GET'
                        }]
                },
                duration: {
                    total_duration_seconds: 300,
                    ramp_up_duration_seconds: 60,
                    steady_state_duration_seconds: 180,
                    ramp_down_duration_seconds: 60
                },
                ramp_up: {
                    strategy: RampUpStrategy.LINEAR,
                    step_size: 10,
                    step_duration_seconds: 12
                },
                think_time: {
                    min_think_time_ms: 1000,
                    max_think_time_ms: 3000,
                    distribution: ThinkTimeDistribution.UNIFORM
                },
                data_setup: {
                    use_test_data: false,
                    test_data_source: '',
                    cleanup_after_test: true,
                    data_isolation: true
                },
                environment: {
                    target_url: 'http://localhost:3000',
                    environment_name: 'test',
                    headers: { 'Content-Type': 'application/json' },
                    authentication: { type: AuthenticationType.NONE },
                    ssl_verification: false
                },
                monitoring: {
                    collect_system_metrics: true,
                    collect_application_metrics: true,
                    collect_database_metrics: false,
                    custom_metrics: [],
                    sampling_interval_seconds: 5
                }
            },
            target: {
                application: 'investment-platform',
                service: 'api',
                endpoints: ['/api/health'],
                environment: 'test'
            },
            success_criteria: {
                max_response_time_ms: 1000,
                max_error_rate_percent: 1.0,
                min_throughput_rps: 80,
                max_cpu_utilization_percent: 80,
                max_memory_utilization_percent: 80,
                custom_assertions: []
            },
            created_at: new Date(),
            updated_at: new Date(),
            enabled: true
        };
        this.tests.set(loadTest.id, loadTest);
        // Create a stress test template
        const stressTest = {
            id: 'default_stress_test',
            name: 'Default Stress Test',
            description: 'Stress test to find system breaking point',
            type: TestType.STRESS_TEST,
            configuration: {
                ...loadTest.configuration,
                load_profile: {
                    virtual_users: 200,
                    requests_per_second: 500,
                    load_pattern: LoadPattern.STEP,
                    load_distribution: loadTest.configuration.load_profile.load_distribution
                },
                duration: {
                    total_duration_seconds: 600,
                    ramp_up_duration_seconds: 120,
                    steady_state_duration_seconds: 360,
                    ramp_down_duration_seconds: 120
                }
            },
            target: loadTest.target,
            success_criteria: {
                max_response_time_ms: 2000,
                max_error_rate_percent: 5.0,
                min_throughput_rps: 300,
                max_cpu_utilization_percent: 95,
                max_memory_utilization_percent: 90,
                custom_assertions: []
            },
            created_at: new Date(),
            updated_at: new Date(),
            enabled: false // Disabled by default for safety
        };
        this.tests.set(stressTest.id, stressTest);
    }
    async createTest(testDefinition) {
        const testId = this.generateTestId();
        const test = {
            id: testId,
            name: testDefinition.name || 'Unnamed Test',
            description: testDefinition.description || '',
            type: testDefinition.type || TestType.LOAD_TEST,
            configuration: this.mergeWithDefaults(testDefinition.configuration),
            target: testDefinition.target || this.getDefaultTarget(),
            success_criteria: testDefinition.success_criteria || this.getDefaultSuccessCriteria(),
            created_at: new Date(),
            updated_at: new Date(),
            enabled: testDefinition.enabled !== false
        };
        this.tests.set(testId, test);
        this.emit('testCreated', {
            testId,
            testName: test.name,
            testType: test.type,
            timestamp: new Date()
        });
        return testId;
    }
    async executeTest(testId, triggeredBy = 'manual', triggerReason = 'Manual execution') {
        const test = this.tests.get(testId);
        if (!test) {
            throw new Error(`Test ${testId} not found`);
        }
        if (!test.enabled) {
            throw new Error(`Test ${testId} is disabled`);
        }
        if (this.activeExecutions.size >= this.config.maxConcurrentTests) {
            throw new Error('Maximum concurrent tests limit reached');
        }
        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            test_id: testId,
            status: TestExecutionStatus.PENDING,
            start_time: new Date(),
            triggered_by: triggeredBy,
            trigger_reason: triggerReason,
            logs: []
        };
        this.executions.set(executionId, execution);
        // Start test execution asynchronously
        this.runTestExecution(executionId, test).catch(error => {
            console.error(`Test execution ${executionId} failed:`, error instanceof Error ? error.message : 'Unknown error');
            this.updateExecutionStatus(executionId, TestExecutionStatus.FAILED);
        });
        this.emit('testExecutionStarted', {
            executionId,
            testId,
            testName: test.name,
            triggeredBy,
            timestamp: new Date()
        });
        return executionId;
    }
    async runTestExecution(executionId, test) {
        const execution = this.executions.get(executionId);
        try {
            // Update status to running
            this.updateExecutionStatus(executionId, TestExecutionStatus.RUNNING);
            // Generate test script based on test framework
            const scriptPath = await this.generateTestScript(test, executionId);
            // Execute the test
            const results = await this.executeTestScript(scriptPath, test, executionId);
            // Process results
            execution.results = results;
            execution.end_time = new Date();
            execution.duration_seconds = (execution.end_time.getTime() - execution.start_time.getTime()) / 1000;
            // Generate artifacts
            execution.artifacts = await this.generateTestArtifacts(executionId, results);
            // Evaluate success criteria
            const criteriaResults = this.evaluateSuccessCriteria(test.success_criteria, results);
            execution.results.success_criteria_results = criteriaResults;
            // Generate recommendations
            execution.results.recommendations = this.generateTestRecommendations(results, criteriaResults);
            // Check for regressions
            if (this.config.alertOnRegressions) {
                await this.checkForRegressions(executionId, test);
            }
            this.updateExecutionStatus(executionId, TestExecutionStatus.COMPLETED);
            this.emit('testExecutionCompleted', {
                executionId,
                testId: test.id,
                duration: execution.duration_seconds,
                success: criteriaResults.every(c => c.passed),
                timestamp: new Date()
            });
        }
        catch (error) {
            execution.end_time = new Date();
            execution.duration_seconds = (execution.end_time.getTime() - execution.start_time.getTime()) / 1000;
            this.addExecutionLog(executionId, LogLevel.ERROR, `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            this.updateExecutionStatus(executionId, TestExecutionStatus.FAILED);
            this.emit('testExecutionFailed', {
                executionId,
                testId: test.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            });
        }
        finally {
            // Cleanup active execution
            this.activeExecutions.delete(executionId);
        }
    }
    async generateTestScript(test, executionId) {
        const scriptDir = (0, path_1.join)(this.config.testReportsDirectory, executionId);
        if (!(0, fs_1.existsSync)(scriptDir)) {
            (0, fs_1.mkdirSync)(scriptDir, { recursive: true });
        }
        let scriptContent;
        let scriptPath;
        switch (test.type) {
            case TestType.LOAD_TEST:
            case TestType.STRESS_TEST:
                scriptContent = this.generateArtilleryScript(test);
                scriptPath = (0, path_1.join)(scriptDir, 'artillery-config.yml');
                break;
            case TestType.ENDURANCE_TEST:
                scriptContent = this.generateEnduranceScript(test);
                scriptPath = (0, path_1.join)(scriptDir, 'endurance-test.js');
                break;
            default:
                scriptContent = this.generateK6Script(test);
                scriptPath = (0, path_1.join)(scriptDir, 'k6-script.js');
        }
        (0, fs_1.writeFileSync)(scriptPath, scriptContent);
        return scriptPath;
    }
    generateArtilleryScript(test) {
        const config = test.configuration;
        return `
config:
  target: '${config.environment.target_url}'
  phases:
    - duration: ${config.duration.ramp_up_duration_seconds}
      arrivalRate: 1
      rampTo: ${config.load_profile.requests_per_second}
      name: "Ramp up"
    - duration: ${config.duration.steady_state_duration_seconds}
      arrivalRate: ${config.load_profile.requests_per_second}
      name: "Steady state"
    - duration: ${config.duration.ramp_down_duration_seconds}
      arrivalRate: ${config.load_profile.requests_per_second}
      rampTo: 1
      name: "Ramp down"
  defaults:
    headers:
${Object.entries(config.environment.headers).map(([key, value]) => `      ${key}: '${value}'`).join('\n')}
  processor: "./processor.js"

scenarios:
  - name: "Load test scenario"
    weight: 100
    flow:
${config.load_profile.load_distribution.map(endpoint => `
      - ${endpoint.method.toLowerCase()}: 
          url: "${endpoint.endpoint}"
          think: ${config.think_time.min_think_time_ms}
`).join('')}
`;
    }
    generateK6Script(test) {
        const config = test.configuration;
        return `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '${config.duration.ramp_up_duration_seconds}s', target: ${config.load_profile.virtual_users} },
    { duration: '${config.duration.steady_state_duration_seconds}s', target: ${config.load_profile.virtual_users} },
    { duration: '${config.duration.ramp_down_duration_seconds}s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<${test.success_criteria.max_response_time_ms}'],
    errors: ['rate<${test.success_criteria.max_error_rate_percent / 100}'],
  },
};

export default function () {
  let params = {
    headers: ${JSON.stringify(config.environment.headers, null, 4)},
  };

${config.load_profile.load_distribution.map(endpoint => `
  let response${endpoint.endpoint.replace(/[^a-zA-Z0-9]/g, '')} = http.${endpoint.method.toLowerCase()}('${config.environment.target_url}${endpoint.endpoint}', null, params);
  check(response${endpoint.endpoint.replace(/[^a-zA-Z0-9]/g, '')}, {
    'status is 200': (r) => r.status === 200,
    'response time < ${test.success_criteria.max_response_time_ms}ms': (r) => r.timings.duration < ${test.success_criteria.max_response_time_ms},
  }) || errorRate.add(1);
`).join('')}

  sleep(Math.random() * (${config.think_time.max_think_time_ms} - ${config.think_time.min_think_time_ms}) + ${config.think_time.min_think_time_ms});
  public getExecutionStatus(executionId: string): any {
    return this.testExecutions.get(executionId) || { status: "unknown" };
  }

  public getExecutionResults(executionId: string): any[] {
    return [];
  }

  public getTests(): any[] {
    return Array.from(this.performanceTests.values());
  }
}
`;
    }
    generateEnduranceScript(test) {
        // Simplified endurance test using Node.js
        return `
const http = require('http');
const https = require('https');
const { URL } = require('url');

const config = ${JSON.stringify(test.configuration, null, 2)};
const target = new URL(config.environment.target_url);

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let responseTimes = [];

function makeRequest() {
  const start = Date.now();
  const client = target.protocol === 'https:' ? https : http;
  
  const req = client.request({
    hostname: target.hostname,
    port: target.port,
    path: '${test.configuration.load_profile.load_distribution[0].endpoint}',
    method: '${test.configuration.load_profile.load_distribution[0].method}',
    headers: config.environment.headers
  }, (res) => {
    const responseTime = Date.now() - start;
    responseTimes.push(responseTime);
    totalRequests++;
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      successfulRequests++;
    } else {
      failedRequests++;
    }
    
    res.on('data', () => {}); // Consume response
    res.on('end', () => {});
  });
  
  req.on('error', (err) => {
    totalRequests++;
    failedRequests++;
    console.error('Request error:', err.message);
  });
  
  req.end();
}

// Run endurance test
const interval = setInterval(makeRequest, 1000 / ${test.configuration.load_profile.requests_per_second || 1});

setTimeout(() => {
  clearInterval(interval);
  
  // Output results
  console.log(JSON.stringify({
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate: (failedRequests / totalRequests) * 100,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    maxResponseTime: Math.max(...responseTimes),
    minResponseTime: Math.min(...responseTimes)
  }));
}, ${test.configuration.duration.total_duration_seconds * 1000});
`;
    }
    async executeTestScript(scriptPath, test, executionId) {
        return new Promise((resolve, reject) => {
            let command;
            let args;
            if (scriptPath.endsWith('.yml')) {
                // Artillery script
                command = 'npx';
                args = ['artillery', 'run', '--output', (0, path_1.join)(this.config.testReportsDirectory, executionId, 'results.json'), scriptPath];
            }
            else if (scriptPath.endsWith('.js') && test.type === TestType.ENDURANCE_TEST) {
                // Node.js endurance script
                command = 'node';
                args = [scriptPath];
            }
            else {
                // K6 script
                command = 'k6';
                args = ['run', '--out', `json=${(0, path_1.join)(this.config.testReportsDirectory, executionId, 'results.json')}`, scriptPath];
            }
            const process = (0, child_process_1.spawn)(command, args, {
                cwd: this.config.testReportsDirectory,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            this.activeExecutions.set(executionId, process);
            let stdout = '';
            let stderr = '';
            process.stdout.on('data', (data) => {
                stdout += data.toString();
                this.addExecutionLog(executionId, LogLevel.INFO, data.toString().trim());
            });
            process.stderr.on('data', (data) => {
                stderr += data.toString();
                this.addExecutionLog(executionId, LogLevel.ERROR, data.toString().trim());
            });
            // Set timeout
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                reject(new Error('Test execution timeout'));
            }, this.config.testExecutionTimeout);
            process.on('exit', (code) => {
                clearTimeout(timeout);
                if (code === 0) {
                    try {
                        const results = this.parseTestResults(stdout, stderr, test, executionId);
                        resolve(results);
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse test results: ${error instanceof Error ? error.message : 'Unknown error'}`));
                    }
                }
                else {
                    reject(new Error(`Test execution failed with code ${code}: ${stderr}`));
                }
            });
            process.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    parseTestResults(stdout, stderr, test, executionId) {
        let summary;
        let metrics = [];
        let errors = [];
        let warnings = [];
        try {
            // Try to parse JSON results from results file
            const resultsPath = (0, path_1.join)(this.config.testReportsDirectory, executionId, 'results.json');
            if ((0, fs_1.existsSync)(resultsPath)) {
                const rawResults = (0, fs_1.readFileSync)(resultsPath, 'utf8');
                const parsedResults = JSON.parse(rawResults);
                // Parse based on test tool format
                if (parsedResults.aggregate) {
                    // Artillery format
                    summary = this.parseArtilleryResults(parsedResults);
                }
                else if (parsedResults.metrics) {
                    // K6 format
                    summary = this.parseK6Results(parsedResults);
                }
                else {
                    // Custom endurance test format
                    summary = this.parseEnduranceResults(parsedResults);
                }
            }
            else {
                // Fallback to parsing stdout
                summary = this.parseStdoutResults(stdout, test);
            }
            // Generate synthetic metrics
            metrics = this.generateSyntheticMetrics(summary, test);
            // Parse errors from stderr
            if (stderr) {
                errors = this.parseErrorsFromStderr(stderr);
            }
        }
        catch (error) {
            // Fallback summary if parsing fails
            summary = {
                total_requests: 0,
                successful_requests: 0,
                failed_requests: 0,
                error_rate_percent: 100,
                average_response_time_ms: 0,
                p95_response_time_ms: 0,
                p99_response_time_ms: 0,
                min_response_time_ms: 0,
                max_response_time_ms: 0,
                throughput_rps: 0,
                data_transferred_mb: 0,
                virtual_users_max: test.configuration.load_profile.virtual_users
            };
            errors.push({
                timestamp: new Date(),
                error_type: 'parsing_error',
                error_message: `Failed to parse test results: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error_count: 1
            });
        }
        return {
            summary,
            performance_metrics: metrics,
            success_criteria_results: [],
            errors,
            warnings,
            recommendations: []
        };
    }
    parseArtilleryResults(results) {
        const aggregate = results.aggregate;
        return {
            total_requests: aggregate.counters['http.requests'] || 0,
            successful_requests: aggregate.counters['http.responses'] || 0,
            failed_requests: (aggregate.counters['http.requests'] || 0) - (aggregate.counters['http.responses'] || 0),
            error_rate_percent: aggregate.rates['http.request_rate'] ? (1 - aggregate.rates['http.request_rate']) * 100 : 0,
            average_response_time_ms: aggregate.histograms['http.response_time'] ? aggregate.histograms['http.response_time'].mean : 0,
            p95_response_time_ms: aggregate.histograms['http.response_time'] ? aggregate.histograms['http.response_time'].p95 : 0,
            p99_response_time_ms: aggregate.histograms['http.response_time'] ? aggregate.histograms['http.response_time'].p99 : 0,
            min_response_time_ms: aggregate.histograms['http.response_time'] ? aggregate.histograms['http.response_time'].min : 0,
            max_response_time_ms: aggregate.histograms['http.response_time'] ? aggregate.histograms['http.response_time'].max : 0,
            throughput_rps: aggregate.rates['http.request_rate'] || 0,
            data_transferred_mb: (aggregate.counters['http.downloaded_bytes'] || 0) / (1024 * 1024),
            virtual_users_max: aggregate.scenariosLaunched || 0
        };
    }
    parseK6Results(results) {
        const metrics = results.metrics;
        return {
            total_requests: metrics.http_reqs ? metrics.http_reqs.count : 0,
            successful_requests: metrics.http_reqs ? Math.floor(metrics.http_reqs.count * (1 - (metrics.http_req_failed?.rate || 0))) : 0,
            failed_requests: metrics.http_req_failed ? Math.floor(metrics.http_reqs.count * metrics.http_req_failed.rate) : 0,
            error_rate_percent: (metrics.http_req_failed?.rate || 0) * 100,
            average_response_time_ms: metrics.http_req_duration ? metrics.http_req_duration.avg : 0,
            p95_response_time_ms: metrics.http_req_duration ? metrics.http_req_duration['p(95)'] : 0,
            p99_response_time_ms: metrics.http_req_duration ? metrics.http_req_duration['p(99)'] : 0,
            min_response_time_ms: metrics.http_req_duration ? metrics.http_req_duration.min : 0,
            max_response_time_ms: metrics.http_req_duration ? metrics.http_req_duration.max : 0,
            throughput_rps: metrics.http_reqs ? metrics.http_reqs.rate : 0,
            data_transferred_mb: (metrics.data_received ? metrics.data_received.count : 0) / (1024 * 1024),
            virtual_users_max: metrics.vus_max ? metrics.vus_max.value : 0
        };
    }
    parseEnduranceResults(results) {
        return {
            total_requests: results.totalRequests || 0,
            successful_requests: results.successfulRequests || 0,
            failed_requests: results.failedRequests || 0,
            error_rate_percent: results.errorRate || 0,
            average_response_time_ms: results.avgResponseTime || 0,
            p95_response_time_ms: results.avgResponseTime ? results.avgResponseTime * 1.2 : 0, // Estimate
            p99_response_time_ms: results.maxResponseTime || 0,
            min_response_time_ms: results.minResponseTime || 0,
            max_response_time_ms: results.maxResponseTime || 0,
            throughput_rps: results.totalRequests ? results.totalRequests / 300 : 0, // 5 minutes
            data_transferred_mb: 0,
            virtual_users_max: 1
        };
    }
    parseStdoutResults(stdout, test) {
        // Fallback parsing for stdout when JSON results are not available
        return {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            error_rate_percent: 0,
            average_response_time_ms: 0,
            p95_response_time_ms: 0,
            p99_response_time_ms: 0,
            min_response_time_ms: 0,
            max_response_time_ms: 0,
            throughput_rps: 0,
            data_transferred_mb: 0,
            virtual_users_max: test.configuration.load_profile.virtual_users
        };
    }
    generateSyntheticMetrics(summary, test) {
        const metrics = [];
        const timestamp = new Date();
        metrics.push({
            timestamp,
            metric_name: 'response_time_avg',
            metric_value: summary.average_response_time_ms,
            metric_unit: 'ms',
            metric_type: TestMetricType.RESPONSE_TIME,
            tags: { test_id: test.id }
        }, {
            timestamp,
            metric_name: 'throughput',
            metric_value: summary.throughput_rps,
            metric_unit: 'rps',
            metric_type: TestMetricType.THROUGHPUT,
            tags: { test_id: test.id }
        }, {
            timestamp,
            metric_name: 'error_rate',
            metric_value: summary.error_rate_percent,
            metric_unit: '%',
            metric_type: TestMetricType.ERROR_RATE,
            tags: { test_id: test.id }
        });
        return metrics;
    }
    parseErrorsFromStderr(stderr) {
        const errors = [];
        const lines = stderr.split('\n').filter(line => line.trim());
        for (const line of lines) {
            if (line.toLowerCase().includes('error')) {
                errors.push({
                    timestamp: new Date(),
                    error_type: 'execution_error',
                    error_message: line.trim(),
                    error_count: 1
                });
            }
        }
        return errors;
    }
    evaluateSuccessCriteria(criteria, results) {
        const criteriaResults = [];
        // Response time criteria
        criteriaResults.push({
            criteria_name: 'Max Response Time',
            expected_value: criteria.max_response_time_ms,
            actual_value: results.summary.average_response_time_ms,
            passed: results.summary.average_response_time_ms <= criteria.max_response_time_ms,
            margin: ((results.summary.average_response_time_ms - criteria.max_response_time_ms) / criteria.max_response_time_ms) * 100,
            description: `Average response time should be <= ${criteria.max_response_time_ms}ms`
        });
        // Error rate criteria
        criteriaResults.push({
            criteria_name: 'Max Error Rate',
            expected_value: criteria.max_error_rate_percent,
            actual_value: results.summary.error_rate_percent,
            passed: results.summary.error_rate_percent <= criteria.max_error_rate_percent,
            margin: ((results.summary.error_rate_percent - criteria.max_error_rate_percent) / criteria.max_error_rate_percent) * 100,
            description: `Error rate should be <= ${criteria.max_error_rate_percent}%`
        });
        // Throughput criteria
        criteriaResults.push({
            criteria_name: 'Min Throughput',
            expected_value: criteria.min_throughput_rps,
            actual_value: results.summary.throughput_rps,
            passed: results.summary.throughput_rps >= criteria.min_throughput_rps,
            margin: ((criteria.min_throughput_rps - results.summary.throughput_rps) / criteria.min_throughput_rps) * 100,
            description: `Throughput should be >= ${criteria.min_throughput_rps} rps`
        });
        return criteriaResults;
    }
    generateTestRecommendations(results, criteriaResults) {
        const recommendations = [];
        // Check for high response times
        if (results.summary.average_response_time_ms > 1000) {
            recommendations.push({
                category: RecommendationCategory.PERFORMANCE,
                priority: RecommendationPriority.HIGH,
                title: 'High Response Times Detected',
                description: 'Average response time exceeds 1 second',
                action_items: [
                    'Profile application for bottlenecks',
                    'Check database query performance',
                    'Review caching strategies',
                    'Consider scaling infrastructure'
                ]
            });
        }
        // Check for high error rates
        if (results.summary.error_rate_percent > 1) {
            recommendations.push({
                category: RecommendationCategory.RELIABILITY,
                priority: RecommendationPriority.CRITICAL,
                title: 'High Error Rate Detected',
                description: `Error rate of ${results.summary.error_rate_percent.toFixed(2)}% is concerning`,
                action_items: [
                    'Investigate error logs',
                    'Check system capacity',
                    'Review error handling',
                    'Monitor system resources'
                ]
            });
        }
        // Check for low throughput
        if (results.summary.throughput_rps < 10) {
            recommendations.push({
                category: RecommendationCategory.SCALABILITY,
                priority: RecommendationPriority.MEDIUM,
                title: 'Low Throughput Performance',
                description: 'System throughput is below expected levels',
                action_items: [
                    'Analyze system bottlenecks',
                    'Optimize critical paths',
                    'Consider horizontal scaling',
                    'Review resource allocation'
                ]
            });
        }
        return recommendations;
    }
    async generateTestArtifacts(executionId, results) {
        const artifacts = [];
        const artifactDir = (0, path_1.join)(this.config.testReportsDirectory, executionId);
        // Generate HTML report
        const htmlReportPath = (0, path_1.join)(artifactDir, 'report.html');
        const htmlContent = this.generateHtmlReport(results, executionId);
        (0, fs_1.writeFileSync)(htmlReportPath, htmlContent);
        artifacts.push({
            name: 'HTML Report',
            type: ArtifactType.REPORT_HTML,
            file_path: htmlReportPath,
            size_bytes: Buffer.byteLength(htmlContent),
            description: 'Detailed HTML test report'
        });
        // Generate JSON report
        const jsonReportPath = (0, path_1.join)(artifactDir, 'report.json');
        const jsonContent = JSON.stringify(results, null, 2);
        (0, fs_1.writeFileSync)(jsonReportPath, jsonContent);
        artifacts.push({
            name: 'JSON Report',
            type: ArtifactType.REPORT_JSON,
            file_path: jsonReportPath,
            size_bytes: Buffer.byteLength(jsonContent),
            description: 'Machine-readable test results'
        });
        return artifacts;
    }
    generateHtmlReport(results, executionId) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report - ${executionId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .pass { background-color: #d4edda; }
        .fail { background-color: #f8d7da; }
        .recommendations { margin-top: 20px; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <p>Execution ID: ${executionId}</p>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>

    <h2>Test Summary</h2>
    <div class="metric">
        <strong>Total Requests:</strong> ${results.summary.total_requests}
    </div>
    <div class="metric">
        <strong>Success Rate:</strong> ${((results.summary.successful_requests / results.summary.total_requests) * 100).toFixed(2)}%
    </div>
    <div class="metric">
        <strong>Avg Response Time:</strong> ${results.summary.average_response_time_ms.toFixed(2)}ms
    </div>
    <div class="metric">
        <strong>Throughput:</strong> ${results.summary.throughput_rps.toFixed(2)} rps
    </div>

    <h2>Success Criteria</h2>
    ${results.success_criteria_results.map(criteria => `
    <div class="metric ${criteria.passed ? 'pass' : 'fail'}">
        <strong>${criteria.criteria_name}:</strong> ${criteria.passed ? 'PASS' : 'FAIL'}<br>
        Expected: ${criteria.expected_value}, Actual: ${criteria.actual_value.toFixed(2)}
    </div>
    `).join('')}

    ${results.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${results.recommendations.map(rec => `
        <div class="recommendation">
            <h3>${rec.title} (${rec.priority.toUpperCase()})</h3>
            <p>${rec.description}</p>
            <ul>
                ${rec.action_items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${results.errors.length > 0 ? `
    <h2>Errors</h2>
    ${results.errors.map(error => `
    <div class="error">
        <strong>${error.error_type}:</strong> ${error.error_message} (Count: ${error.error_count})
    </div>
    `).join('')}
    ` : ''}
</body>
</html>
    `;
    }
    async checkForRegressions(executionId, test) {
        const baseline = this.regressionBaselines.get(test.id);
        if (!baseline || !baseline.results) {
            // Set current execution as baseline
            this.regressionBaselines.set(test.id, this.executions.get(executionId));
            return;
        }
        const currentExecution = this.executions.get(executionId);
        if (!currentExecution.results)
            return;
        const regression = this.analyzeRegression(baseline, currentExecution, test);
        if (regression.regression_detected) {
            this.emit('regressionDetected', {
                testId: test.id,
                executionId,
                regression,
                timestamp: new Date()
            });
            // Send notifications if configured
            await this.sendRegressionNotifications(test, regression);
        }
    }
    analyzeRegression(baseline, current, test) {
        const regressionMetrics = [];
        let regressionDetected = false;
        const baselineResults = baseline.results;
        const currentResults = current.results;
        // Analyze response time regression
        const responseTimeChange = ((currentResults.summary.average_response_time_ms - baselineResults.summary.average_response_time_ms) / baselineResults.summary.average_response_time_ms) * 100;
        if (Math.abs(responseTimeChange) > this.config.regressionThreshold) {
            regressionDetected = true;
            regressionMetrics.push({
                metric_name: 'Average Response Time',
                baseline_value: baselineResults.summary.average_response_time_ms,
                current_value: currentResults.summary.average_response_time_ms,
                change_percent: responseTimeChange,
                change_direction: responseTimeChange > 0 ? 'degradation' : 'improvement',
                significance: Math.abs(responseTimeChange) / this.config.regressionThreshold
            });
        }
        // Analyze throughput regression
        const throughputChange = ((currentResults.summary.throughput_rps - baselineResults.summary.throughput_rps) / baselineResults.summary.throughput_rps) * 100;
        if (Math.abs(throughputChange) > this.config.regressionThreshold) {
            regressionDetected = true;
            regressionMetrics.push({
                metric_name: 'Throughput',
                baseline_value: baselineResults.summary.throughput_rps,
                current_value: currentResults.summary.throughput_rps,
                change_percent: throughputChange,
                change_direction: throughputChange > 0 ? 'improvement' : 'degradation',
                significance: Math.abs(throughputChange) / this.config.regressionThreshold
            });
        }
        // Determine severity
        let severity = RegressionSeverity.MINOR;
        const maxSignificance = Math.max(...regressionMetrics.map(m => m.significance));
        if (maxSignificance > 3)
            severity = RegressionSeverity.CRITICAL;
        else if (maxSignificance > 2)
            severity = RegressionSeverity.MAJOR;
        else if (maxSignificance > 1.5)
            severity = RegressionSeverity.MODERATE;
        return {
            test_id: test.id,
            baseline_execution_id: baseline.id,
            current_execution_id: current.id,
            regression_detected: regressionDetected,
            regression_metrics: regressionMetrics,
            regression_severity: severity,
            analysis_timestamp: new Date()
        };
    }
    async sendRegressionNotifications(test, regression) {
        // Implementation would send notifications via email, Slack, etc.
        // This is a placeholder for notification logic
        console.log(`Regression detected in test ${test.name}:`, regression);
    }
    // Utility methods
    mergeWithDefaults(config) {
        const defaultConfig = this.tests.get('default_load_test').configuration;
        return {
            ...defaultConfig,
            ...config
        };
    }
    getDefaultTarget() {
        return {
            application: 'investment-platform',
            service: 'api',
            endpoints: ['/api/health'],
            environment: 'test'
        };
    }
    getDefaultSuccessCriteria() {
        return {
            max_response_time_ms: 1000,
            max_error_rate_percent: 1.0,
            min_throughput_rps: 50,
            max_cpu_utilization_percent: 80,
            max_memory_utilization_percent: 80,
            custom_assertions: []
        };
    }
    updateExecutionStatus(executionId, status) {
        const execution = this.executions.get(executionId);
        if (execution) {
            execution.status = status;
        }
    }
    addExecutionLog(executionId, level, message) {
        const execution = this.executions.get(executionId);
        if (execution) {
            if (!execution.logs)
                execution.logs = [];
            execution.logs.push({
                timestamp: new Date(),
                level,
                message,
                context: { executionId }
            });
        }
    }
    startScheduler() {
        // Simplified scheduler - in production would use a proper cron library
        setInterval(() => {
            this.checkScheduledTests();
        }, 60000); // Check every minute
    }
    checkScheduledTests() {
        const now = new Date();
        for (const [testId, schedule] of this.schedules) {
            if (schedule.enabled && this.shouldExecuteScheduledTest(schedule, now)) {
                this.executeTest(testId, 'scheduler', 'Scheduled execution')
                    .catch(error => {
                    console.error(`Scheduled test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                });
            }
        }
    }
    shouldExecuteScheduledTest(schedule, now) {
        // Simplified cron checking - in production would use a proper cron parser
        return false; // Placeholder
    }
    // Public API methods
    getTest(testId) {
        return this.tests.get(testId);
    }
    getAllTests() {
        return Array.from(this.tests.values());
    }
    getExecution(executionId) {
        return this.executions.get(executionId);
    }
    getTestExecutions(testId) {
        return Array.from(this.executions.values()).filter(e => e.test_id === testId);
    }
    async cancelExecution(executionId) {
        const process = this.activeExecutions.get(executionId);
        if (process) {
            process.kill('SIGTERM');
            this.updateExecutionStatus(executionId, TestExecutionStatus.CANCELLED);
            return true;
        }
        return false;
    }
    scheduleTest(testId, schedule) {
        this.schedules.set(testId, { ...schedule, test_id: testId });
    }
    getTestingStatistics() {
        return {
            total_tests: this.tests.size,
            enabled_tests: Array.from(this.tests.values()).filter(t => t.enabled).length,
            total_executions: this.executions.size,
            active_executions: this.activeExecutions.size,
            scheduled_tests: this.schedules.size,
            completed_executions: Array.from(this.executions.values()).filter(e => e.status === TestExecutionStatus.COMPLETED).length,
            failed_executions: Array.from(this.executions.values()).filter(e => e.status === TestExecutionStatus.FAILED).length
        };
    }
    generateTestId() {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
        // Cancel all active executions
        for (const [executionId, process] of this.activeExecutions) {
            process.kill('SIGTERM');
            this.updateExecutionStatus(executionId, TestExecutionStatus.CANCELLED);
        }
        // Clear data
        this.tests.clear();
        this.executions.clear();
        this.schedules.clear();
        this.activeExecutions.clear();
        this.regressionBaselines.clear();
        console.log('Performance Testing Service shutdown complete');
    }
}
exports.PerformanceTestingService = PerformanceTestingService;

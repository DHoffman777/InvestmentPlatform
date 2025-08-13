"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadTestingService = void 0;
const express_1 = __importDefault(require("express"));
const events_1 = require("events");
const node_cron_1 = __importDefault(require("node-cron"));
const ioredis_1 = __importDefault(require("ioredis"));
const LoadTestExecutor_1 = require("./services/LoadTestExecutor");
const CapacityPlanningService_1 = require("./services/CapacityPlanningService");
class LoadTestingService extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.scheduledTests = new Map();
        this.benchmarkResults = new Map();
        this.app = (0, express_1.default)();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventHandlers();
        this.setupCronJobs();
    }
    initializeServices() {
        // Initialize Redis
        this.redis = new ioredis_1.default({
            host: this.config.redis.host,
            port: this.config.redis.port,
            password: this.config.redis.password,
            db: this.config.redis.db,
            keyPrefix: 'load-test:',
        });
        // Initialize load test executor
        this.executor = new LoadTestExecutor_1.LoadTestExecutor();
        // Initialize capacity planning service
        this.capacityService = new CapacityPlanningService_1.CapacityPlanningService();
    }
    setupEventHandlers() {
        // Load test executor events
        this.executor.on('testStarted', async (data) => {
            await this.storeTestMetadata(data.testId, { status: 'RUNNING', config: data.config });
            this.emit('testStarted', data);
            if (this.config.notifications.enabled) {
                await this.sendNotification('test_started', `Load test ${data.config.name} started`, data);
            }
        });
        this.executor.on('testCompleted', async (data) => {
            await this.storeTestResults(data.testId, data.result);
            this.emit('testCompleted', data);
            if (this.config.notifications.enabled) {
                await this.sendNotification('test_completed', `Load test ${data.result.config.name} completed`, data);
            }
        });
        this.executor.on('testError', async (data) => {
            await this.storeTestMetadata(data.testId, { status: 'FAILED', error: data.error });
            this.emit('testError', data);
            if (this.config.notifications.enabled) {
                await this.sendNotification('test_error', `Load test failed: ${data.error}`, data);
            }
        });
        this.executor.on('testProgress', async (data) => {
            await this.updateTestProgress(data.testId, data);
            this.emit('testProgress', data);
        });
        // Capacity planning events
        this.capacityService.on('planGenerated', async (data) => {
            await this.storeCapacityPlan(data.planId, data.result);
            this.emit('planGenerated', data);
        });
    }
    setupMiddleware() {
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
        // Error handling middleware
        this.app.use((error, req, res, next) => {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        });
    }
    setupRoutes() {
        // Load test configuration validation
        this.app.post('/api/v1/tests/validate', async (req, res) => {
            try {
                const config = req.body;
                const validation = this.validateTestConfig(config);
                res.json(validation);
            }
            catch (error) {
                res.status(400).json({ error: 'Validation failed', details: error.message });
            }
        });
        // Execute load test
        this.app.post('/api/v1/tests/execute', async (req, res) => {
            try {
                const config = req.body;
                // Validate configuration
                const validation = this.validateTestConfig(config);
                if (!validation.valid) {
                    return res.status(400).json({ error: 'Invalid configuration', issues: validation.issues });
                }
                // Check concurrent test limits
                const activeTests = this.executor.getActiveTests();
                if (activeTests.length >= this.config.defaultTestSettings.maxConcurrentTests) {
                    return res.status(429).json({
                        error: 'Too many concurrent tests',
                        active: activeTests.length,
                        limit: this.config.defaultTestSettings.maxConcurrentTests
                    });
                }
                const testId = await this.executor.executeLoadTest(config);
                res.json({ testId, status: 'RUNNING' });
            }
            catch (error) {
                res.status(500).json({ error: 'Test execution failed', details: error.message });
            }
        });
        // Get test result
        this.app.get('/api/v1/tests/:testId', async (req, res) => {
            try {
                const { testId } = req.params;
                // Try to get from executor first (for running tests)
                let result = this.executor.getTestResult(testId);
                // If not found, try to get from storage
                if (!result) {
                    const stored = await this.getStoredTestResult(testId);
                    if (stored) {
                        result = stored;
                    }
                }
                if (!result) {
                    return res.status(404).json({ error: 'Test not found' });
                }
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get test result', details: error.message });
            }
        });
        // Cancel running test
        this.app.post('/api/v1/tests/:testId/cancel', async (req, res) => {
            try {
                const { testId } = req.params;
                const cancelled = await this.executor.cancelTest(testId);
                if (cancelled) {
                    res.json({ message: 'Test cancelled successfully' });
                }
                else {
                    res.status(404).json({ error: 'Test not found or not running' });
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to cancel test', details: error.message });
            }
        });
        // List tests
        this.app.get('/api/v1/tests', async (req, res) => {
            try {
                const { status, limit = 20, offset = 0 } = req.query;
                const tests = await this.listTests(status, parseInt(limit), parseInt(offset));
                res.json(tests);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to list tests', details: error.message });
            }
        });
        // Schedule test
        this.app.post('/api/v1/tests/schedule', async (req, res) => {
            try {
                const { config, schedule } = req.body;
                const scheduleId = await this.scheduleTest(config, schedule);
                res.json({ scheduleId, message: 'Test scheduled successfully' });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to schedule test', details: error.message });
            }
        });
        // Execute benchmark
        this.app.post('/api/v1/benchmarks/execute', async (req, res) => {
            try {
                const benchmarkConfig = req.body;
                const benchmarkId = await this.executeBenchmark(benchmarkConfig);
                res.json({ benchmarkId, status: 'RUNNING' });
            }
            catch (error) {
                res.status(500).json({ error: 'Benchmark execution failed', details: error.message });
            }
        });
        // Get benchmark result
        this.app.get('/api/v1/benchmarks/:benchmarkId', (req, res) => {
            try {
                const { benchmarkId } = req.params;
                const result = this.benchmarkResults.get(benchmarkId);
                if (!result) {
                    return res.status(404).json({ error: 'Benchmark not found' });
                }
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get benchmark result', details: error.message });
            }
        });
        // Generate capacity plan
        this.app.post('/api/v1/capacity/plan', async (req, res) => {
            try {
                const config = req.body;
                const planId = await this.capacityService.generateCapacityPlan(config);
                res.json({ planId, status: 'GENERATED' });
            }
            catch (error) {
                res.status(500).json({ error: 'Capacity planning failed', details: error.message });
            }
        });
        // Get capacity plan
        this.app.get('/api/v1/capacity/plans/:planId', async (req, res) => {
            try {
                const { planId } = req.params;
                const plan = this.capacityService.getCapacityPlan(planId);
                if (!plan) {
                    return res.status(404).json({ error: 'Capacity plan not found' });
                }
                res.json(plan);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get capacity plan', details: error.message });
            }
        });
        // Export capacity plan
        this.app.get('/api/v1/capacity/plans/:planId/export', async (req, res) => {
            try {
                const { planId } = req.params;
                const { format = 'csv' } = req.query;
                if (format === 'csv') {
                    const csv = await this.capacityService.exportPlanToCSV(planId);
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename="capacity-plan-${planId}.csv"`);
                    res.send(csv);
                }
                else {
                    res.status(400).json({ error: 'Unsupported export format' });
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Export failed', details: error.message });
            }
        });
        // Analyze load test results for capacity planning
        this.app.post('/api/v1/capacity/analyze', async (req, res) => {
            try {
                const { testIds, currentCapacity } = req.body;
                const results = [];
                for (const testId of testIds) {
                    const result = await this.getStoredTestResult(testId);
                    if (result) {
                        results.push(result);
                    }
                }
                if (results.length === 0) {
                    return res.status(400).json({ error: 'No valid test results found' });
                }
                const analysis = await this.capacityService.analyzeLoadTestResults(results, currentCapacity);
                res.json(analysis);
            }
            catch (error) {
                res.status(500).json({ error: 'Analysis failed', details: error.message });
            }
        });
        // Get system statistics
        this.app.get('/api/v1/stats', async (req, res) => {
            try {
                const stats = await this.getSystemStats();
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get statistics', details: error.message });
            }
        });
        // Health check
        this.app.get('/api/v1/health', async (req, res) => {
            try {
                const health = await this.getHealthStatus();
                res.json(health);
            }
            catch (error) {
                res.status(500).json({ error: 'Health check failed', details: error.message });
            }
        });
        // Test templates
        this.app.get('/api/v1/templates', (req, res) => {
            const templates = this.getTestTemplates();
            res.json(templates);
        });
    }
    setupCronJobs() {
        // Cleanup old test results
        if (this.config.scheduling.cleanupSchedule) {
            node_cron_1.default.schedule(this.config.scheduling.cleanupSchedule, async () => {
                console.log('Running cleanup of old test results...');
                try {
                    await this.cleanupOldTests();
                }
                catch (error) {
                    console.error('Cleanup failed:', error);
                }
            });
        }
        // Environment validation (every hour)
        node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                const validation = await this.executor.validateTestEnvironment();
                if (!validation.valid) {
                    console.warn('Test environment issues detected:', validation.issues);
                    if (this.config.notifications.enabled) {
                        await this.sendNotification('environment_warning', 'Test environment issues detected', validation);
                    }
                }
            }
            catch (error) {
                console.error('Environment validation failed:', error);
            }
        });
    }
    validateTestConfig(config) {
        const issues = [];
        // Basic validation
        if (!config.name || config.name.trim() === '') {
            issues.push('Test name is required');
        }
        if (!config.target?.url) {
            issues.push('Target URL is required');
        }
        if (!config.scenarios || config.scenarios.length === 0) {
            issues.push('At least one scenario is required');
        }
        if (config.duration <= 0) {
            issues.push('Duration must be positive');
        }
        if (config.duration > this.config.defaultTestSettings.maxDuration) {
            issues.push(`Duration cannot exceed ${this.config.defaultTestSettings.maxDuration} seconds`);
        }
        // Scenario validation
        for (const scenario of config.scenarios || []) {
            if (!scenario.name) {
                issues.push(`Scenario name is required`);
            }
            if (scenario.weight <= 0 || scenario.weight > 100) {
                issues.push(`Scenario weight must be between 1 and 100`);
            }
            if (!scenario.requests || scenario.requests.length === 0) {
                issues.push(`Scenario "${scenario.name}" must have at least one request`);
            }
            // Request validation
            for (const request of scenario.requests || []) {
                if (!request.name) {
                    issues.push(`Request name is required in scenario "${scenario.name}"`);
                }
                if (!request.url) {
                    issues.push(`Request URL is required in scenario "${scenario.name}"`);
                }
                if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
                    issues.push(`Invalid HTTP method "${request.method}" in scenario "${scenario.name}"`);
                }
            }
        }
        // Threshold validation
        if (config.thresholds) {
            if (config.thresholds.avgResponseTime && config.thresholds.avgResponseTime <= 0) {
                issues.push('Average response time threshold must be positive');
            }
            if (config.thresholds.errorRate && (config.thresholds.errorRate < 0 || config.thresholds.errorRate > 100)) {
                issues.push('Error rate threshold must be between 0 and 100');
            }
            if (config.thresholds.throughput && config.thresholds.throughput <= 0) {
                issues.push('Throughput threshold must be positive');
            }
        }
        // Ramp-up validation
        if (config.rampUp?.enabled) {
            if (!config.rampUp.stages || config.rampUp.stages.length === 0) {
                issues.push('Ramp-up stages are required when ramp-up is enabled');
            }
            for (const stage of config.rampUp.stages || []) {
                if (stage.duration <= 0) {
                    issues.push('Ramp-up stage duration must be positive');
                }
                if (stage.target <= 0) {
                    issues.push('Ramp-up stage target must be positive');
                }
            }
        }
        return {
            valid: issues.length === 0,
            issues,
        };
    }
    async storeTestMetadata(testId, metadata) {
        await this.redis.setex(`test:${testId}:metadata`, 3600 * 24 * this.config.defaultTestSettings.retentionDays, JSON.stringify(metadata));
    }
    async storeTestResults(testId, result) {
        await this.redis.setex(`test:${testId}:result`, 3600 * 24 * this.config.defaultTestSettings.retentionDays, JSON.stringify(result));
    }
    async updateTestProgress(testId, progress) {
        await this.redis.setex(`test:${testId}:progress`, 300, JSON.stringify(progress)); // 5 minute expiry
    }
    async getStoredTestResult(testId) {
        const stored = await this.redis.get(`test:${testId}:result`);
        return stored ? JSON.parse(stored) : null;
    }
    async storeCapacityPlan(planId, plan) {
        await this.redis.setex(`plan:${planId}`, 3600 * 24 * 30, JSON.stringify(plan)); // 30 days
    }
    async listTests(status, limit = 20, offset = 0) {
        const keys = await this.redis.keys('test:*:metadata');
        const tests = [];
        for (let i = offset; i < Math.min(offset + limit, keys.length); i++) {
            const key = keys[i];
            const testId = key.split(':')[1];
            const metadata = await this.redis.get(key);
            if (metadata) {
                const parsed = JSON.parse(metadata);
                if (!status || parsed.status === status) {
                    tests.push({
                        testId,
                        ...parsed,
                    });
                }
            }
        }
        return tests;
    }
    async scheduleTest(config, schedule) {
        const scheduleId = `schedule_${Date.now()}`;
        // Parse cron schedule and validate
        try {
            const timeout = node_cron_1.default.schedule(schedule, async () => {
                console.log(`Executing scheduled test: ${config.name}`);
                try {
                    await this.executor.executeLoadTest(config);
                }
                catch (error) {
                    console.error('Scheduled test failed:', error);
                }
            }, {
                scheduled: false, // Don't start immediately
            });
            timeout.start();
            this.scheduledTests.set(scheduleId, timeout);
            // Store schedule metadata
            await this.redis.setex(`schedule:${scheduleId}`, 3600 * 24 * 30, JSON.stringify({
                config,
                schedule,
                createdAt: new Date(),
            }));
            return scheduleId;
        }
        catch (error) {
            throw new Error(`Invalid cron schedule: ${schedule}`);
        }
    }
    async executeBenchmark(config) {
        const benchmarkId = `benchmark_${Date.now()}`;
        try {
            const result = {
                id: benchmarkId,
                config,
                executedAt: new Date(),
                results: [],
                comparison: {
                    improvements: [],
                    regressions: [],
                },
                passed: false,
                summary: '',
            };
            // Execute tests for each target
            for (const target of config.targets) {
                const targetResults = [];
                for (const testConfig of config.testSuite) {
                    // Modify test config for specific target
                    const modifiedConfig = {
                        ...testConfig,
                        target: {
                            ...testConfig.target,
                            url: target.url,
                        },
                    };
                    const testId = await this.executor.executeLoadTest(modifiedConfig);
                    // Wait for test completion (simplified - in real implementation, use event listeners)
                    let testResult = this.executor.getTestResult(testId);
                    while (testResult?.status === 'RUNNING') {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        testResult = this.executor.getTestResult(testId);
                    }
                    if (testResult) {
                        targetResults.push(testResult);
                    }
                }
                result.results.push({
                    target: target.name,
                    version: target.version,
                    loadTestResults: targetResults,
                });
            }
            // Perform comparison analysis
            if (result.results.length > 1) {
                result.comparison = this.compareBenchmarkResults(result.results, config.comparisonMetrics);
            }
            // Check passing criteria
            result.passed = this.evaluateBenchmarkPassing(result, config.passingCriteria);
            result.summary = this.generateBenchmarkSummary(result);
            this.benchmarkResults.set(benchmarkId, result);
            return benchmarkId;
        }
        catch (error) {
            throw new Error(`Benchmark execution failed: ${error.message}`);
        }
    }
    compareBenchmarkResults(results, metrics) {
        const improvements = [];
        const regressions = [];
        let winner;
        if (results.length < 2)
            return { improvements, regressions, winner };
        // Simple comparison between first two targets
        const baseline = results[0];
        const comparison = results[1];
        for (const metric of metrics) {
            const baselineValue = this.extractMetricValue(baseline, metric);
            const comparisonValue = this.extractMetricValue(comparison, metric);
            if (baselineValue && comparisonValue) {
                const improvement = ((baselineValue - comparisonValue) / baselineValue) * 100;
                if (improvement > 0) {
                    improvements.push({
                        metric,
                        target: comparison.target,
                        improvement,
                    });
                }
                else if (improvement < 0) {
                    regressions.push({
                        metric,
                        target: comparison.target,
                        regression: Math.abs(improvement),
                    });
                }
            }
        }
        // Determine winner based on overall improvements
        const totalImprovement = improvements.reduce((sum, imp) => sum + imp.improvement, 0);
        const totalRegression = regressions.reduce((sum, reg) => sum + reg.regression, 0);
        if (totalImprovement > totalRegression) {
            winner = comparison.target;
        }
        else if (totalRegression > totalImprovement) {
            winner = baseline.target;
        }
        return { improvements, regressions, winner };
    }
    extractMetricValue(result, metric) {
        if (result.loadTestResults.length === 0)
            return null;
        const avgResult = result.loadTestResults.reduce((sum, r) => {
            switch (metric) {
                case 'avgResponseTime':
                    return sum + r.summary.avgResponseTime;
                case 'throughput':
                    return sum + r.summary.throughput;
                case 'errorRate':
                    return sum + r.summary.errorRate;
                case 'p95ResponseTime':
                    return sum + r.summary.p95ResponseTime;
                default:
                    return sum;
            }
        }, 0) / result.loadTestResults.length;
        return avgResult;
    }
    evaluateBenchmarkPassing(result, criteria) {
        const maxRegression = Math.max(...result.comparison.regressions.map(r => r.regression), 0);
        const minImprovement = Math.min(...result.comparison.improvements.map(i => i.improvement), 0);
        return maxRegression <= criteria.maxRegressionPercent &&
            (criteria.minImprovementPercent === undefined || minImprovement >= criteria.minImprovementPercent);
    }
    generateBenchmarkSummary(result) {
        const { improvements, regressions, winner } = result.comparison;
        let summary = `Benchmark completed with ${result.results.length} targets. `;
        if (winner) {
            summary += `Winner: ${winner}. `;
        }
        if (improvements.length > 0) {
            summary += `Improvements: ${improvements.length} metrics improved. `;
        }
        if (regressions.length > 0) {
            summary += `Regressions: ${regressions.length} metrics regressed. `;
        }
        summary += `Status: ${result.passed ? 'PASSED' : 'FAILED'}`;
        return summary;
    }
    async sendNotification(type, message, data) {
        try {
            if (this.config.notifications.webhookUrl) {
                // Send webhook notification (implementation depends on webhook format)
                console.log(`Notification [${type}]: ${message}`);
            }
            if (this.config.notifications.slackChannel) {
                // Send Slack notification (would require Slack SDK)
                console.log(`Slack notification [${type}]: ${message}`);
            }
        }
        catch (error) {
            console.error('Failed to send notification:', error);
        }
    }
    async cleanupOldTests() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.defaultTestSettings.retentionDays);
        const keys = await this.redis.keys('test:*');
        let deletedCount = 0;
        for (const key of keys) {
            try {
                const ttl = await this.redis.ttl(key);
                if (ttl === -1) { // No expiry set
                    await this.redis.del(key);
                    deletedCount++;
                }
            }
            catch (error) {
                console.error(`Failed to cleanup key ${key}:`, error);
            }
        }
        console.log(`Cleanup completed: ${deletedCount} old test records deleted`);
    }
    async getSystemStats() {
        const activeTests = this.executor.getActiveTests();
        const scheduledTestsCount = this.scheduledTests.size;
        const benchmarksCount = this.benchmarkResults.size;
        // Get Redis info
        const redisInfo = await this.redis.info('memory');
        const redisMemory = redisInfo.split('\n')
            .find(line => line.startsWith('used_memory_human:'))
            ?.split(':')[1]?.trim() || 'unknown';
        return {
            activeTests: activeTests.length,
            scheduledTests: scheduledTestsCount,
            benchmarks: benchmarksCount,
            redis: {
                status: this.redis.status,
                memory: redisMemory,
            },
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
        };
    }
    async getHealthStatus() {
        const environmentValidation = await this.executor.validateTestEnvironment();
        return {
            status: 'healthy',
            timestamp: new Date(),
            components: {
                executor: {
                    healthy: environmentValidation.valid,
                    issues: environmentValidation.issues,
                },
                redis: {
                    healthy: this.redis.status === 'ready',
                    status: this.redis.status,
                },
                capacityPlanning: {
                    healthy: true,
                },
            },
            activeTests: this.executor.getActiveTests().length,
            maxConcurrentTests: this.config.defaultTestSettings.maxConcurrentTests,
        };
    }
    getTestTemplates() {
        return [
            {
                name: 'Basic API Load Test',
                description: 'Simple GET request load test',
                target: {
                    url: 'https://api.example.com',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
                scenarios: [
                    {
                        name: 'Basic Load',
                        weight: 100,
                        requests: [
                            {
                                name: 'Get Health',
                                method: 'GET',
                                url: '/health',
                                validation: {
                                    statusCode: [200],
                                    responseTime: 1000,
                                },
                            },
                        ],
                    },
                ],
                duration: 60,
                thresholds: {
                    avgResponseTime: 500,
                    p95ResponseTime: 1000,
                    errorRate: 5,
                    throughput: 100,
                },
                tags: ['template', 'basic'],
            },
            {
                name: 'Investment Platform API Test',
                description: 'Load test for investment platform endpoints',
                target: {
                    url: 'https://api.investment-platform.com',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    authentication: {
                        type: 'bearer',
                        token: '${AUTH_TOKEN}',
                    },
                },
                scenarios: [
                    {
                        name: 'Portfolio Operations',
                        weight: 60,
                        requests: [
                            {
                                name: 'Get Portfolios',
                                method: 'GET',
                                url: '/api/v1/portfolios',
                                validation: {
                                    statusCode: [200],
                                    responseTime: 2000,
                                },
                            },
                            {
                                name: 'Get Portfolio Details',
                                method: 'GET',
                                url: '/api/v1/portfolios/1',
                                validation: {
                                    statusCode: [200],
                                    responseTime: 1500,
                                },
                            },
                        ],
                    },
                    {
                        name: 'Market Data',
                        weight: 40,
                        requests: [
                            {
                                name: 'Get Quotes',
                                method: 'GET',
                                url: '/api/v1/market-data/quotes?symbols=AAPL,GOOGL',
                                validation: {
                                    statusCode: [200],
                                    responseTime: 1000,
                                },
                            },
                        ],
                    },
                ],
                duration: 300,
                rampUp: {
                    enabled: true,
                    duration: 60,
                    stages: [
                        { duration: 30, target: 10 },
                        { duration: 30, target: 25 },
                    ],
                },
                thresholds: {
                    avgResponseTime: 1000,
                    p95ResponseTime: 2500,
                    errorRate: 2,
                    throughput: 50,
                },
                tags: ['template', 'investment-platform'],
            },
        ];
    }
    start(port = 3010) {
        this.app.listen(port, () => {
            console.log(`Load Testing Service listening on port ${port}`);
            this.emit('serviceStarted', { port });
        });
    }
    async shutdown() {
        console.log('Shutting down Load Testing Service...');
        // Cancel all scheduled tests
        for (const [scheduleId, timeout] of this.scheduledTests.entries()) {
            clearTimeout(timeout);
            this.scheduledTests.delete(scheduleId);
        }
        // Cancel all active tests
        const activeTests = this.executor.getActiveTests();
        for (const testId of activeTests) {
            await this.executor.cancelTest(testId);
        }
        await this.redis.quit();
        console.log('Load Testing Service shutdown complete');
    }
    getApp() {
        return this.app;
    }
}
exports.LoadTestingService = LoadTestingService;
//# sourceMappingURL=LoadTestingService.js.map
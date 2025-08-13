"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadTestExecutor = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class LoadTestExecutor extends events_1.EventEmitter {
    constructor() {
        super();
        this.activeTests = new Map();
        this.testResults = new Map();
        this.configPath = path_1.default.join(process.cwd(), 'temp', 'load-tests');
        this.ensureConfigDirectory();
    }
    async ensureConfigDirectory() {
        try {
            await promises_1.default.mkdir(this.configPath, { recursive: true });
        }
        catch (error) {
            console.error('Failed to create config directory:', error);
        }
    }
    async executeLoadTest(config) {
        const testId = (0, uuid_1.v4)();
        try {
            // Create test result object
            const result = {
                id: testId,
                config,
                status: 'RUNNING',
                startTime: new Date(),
                duration: 0,
                summary: {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    errorRate: 0,
                    avgResponseTime: 0,
                    p50ResponseTime: 0,
                    p95ResponseTime: 0,
                    p99ResponseTime: 0,
                    minResponseTime: 0,
                    maxResponseTime: 0,
                    throughput: 0,
                    bytesReceived: 0,
                    bytesSent: 0,
                },
                timeline: [],
                scenarios: [],
                errors: [],
                thresholdResults: [],
                recommendations: [],
            };
            this.testResults.set(testId, result);
            // Generate test configuration file
            await this.generateTestConfig(testId, config);
            // Execute the test
            await this.runLoadTest(testId, config);
            this.emit('testStarted', { testId, config });
            return testId;
        }
        catch (error) {
            this.emit('testError', { testId, error: error.message });
            throw error;
        }
    }
    async generateTestConfig(testId, config) {
        // Generate Artillery configuration
        const artilleryConfig = this.generateArtilleryConfig(config);
        const configFile = path_1.default.join(this.configPath, `${testId}-artillery.yml`);
        await promises_1.default.writeFile(configFile, artilleryConfig);
        // Generate Autocannon configuration for simple HTTP tests
        const autocannonConfig = this.generateAutocannonConfig(config);
        const autocannonFile = path_1.default.join(this.configPath, `${testId}-autocannon.json`);
        await promises_1.default.writeFile(autocannonFile, JSON.stringify(autocannonConfig, null, 2));
    }
    generateArtilleryConfig(config) {
        const artilleryConfig = {
            config: {
                target: config.target.url,
                phases: config.rampUp?.enabled ? config.rampUp.stages.map(stage => ({
                    duration: stage.duration,
                    arrivalRate: Math.floor(stage.target / 10), // Convert to arrivals per second
                })) : [{
                        duration: config.duration,
                        arrivalRate: 10, // Default arrival rate
                    }],
                http: {
                    timeout: 30,
                    ...(config.target.headers && { headers: config.target.headers }),
                },
                ...(config.target.authentication && {
                    http: {
                        ...config.target.authentication.type === 'bearer' && {
                            headers: {
                                Authorization: `Bearer ${config.target.authentication.token}`,
                            },
                        },
                        ...config.target.authentication.type === 'basic' && {
                            auth: {
                                user: config.target.authentication.username,
                                pass: config.target.authentication.password,
                            },
                        },
                    },
                }),
            },
            scenarios: config.scenarios.map(scenario => ({
                name: scenario.name,
                weight: scenario.weight,
                flow: scenario.requests.map(request => ({
                    [request.method.toLowerCase()]: {
                        url: request.url,
                        ...(request.headers && { headers: request.headers }),
                        ...(request.body && { json: request.body }),
                        ...(request.params && { qs: request.params }),
                        ...(request.validation && {
                            capture: [
                                ...(request.validation.statusCode && [{
                                        json: '$.statusCode',
                                        as: 'statusCode',
                                    }]),
                                ...(request.validation.bodyContains && request.validation.bodyContains.map(content => ({
                                    regexp: content,
                                    as: `contains_${content.replace(/[^a-zA-Z0-9]/g, '_')}`,
                                }))),
                            ],
                        }),
                        ...(request.extractors && {
                            capture: request.extractors.map(extractor => ({
                                ...(extractor.jsonPath && { json: extractor.jsonPath }),
                                ...(extractor.regex && { regexp: extractor.regex }),
                                ...(extractor.header && { header: extractor.header }),
                                as: extractor.name,
                            })),
                        }),
                    },
                })),
            })),
        };
        return `# Generated Artillery configuration for ${config.name}\n` +
            `# Generated at: ${new Date().toISOString()}\n\n` +
            this.convertToYaml(artilleryConfig);
    }
    generateAutocannonConfig(config) {
        return {
            url: config.target.url,
            connections: 10,
            pipelining: 1,
            duration: config.duration,
            headers: config.target.headers || {},
            method: 'GET', // Autocannon is simpler, we'll use the first request method
            setupClient: config.target.authentication ? this.generateAuthSetup(config.target.authentication) : undefined,
        };
    }
    generateAuthSetup(auth) {
        switch (auth.type) {
            case 'bearer':
                return `client.setHeader('Authorization', 'Bearer ${auth.token}')`;
            case 'basic':
                const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
                return `client.setHeader('Authorization', 'Basic ${credentials}')`;
            default:
                return '';
        }
    }
    async runLoadTest(testId, config) {
        const useArtillery = config.scenarios.length > 1 ||
            config.scenarios.some(s => s.requests.length > 1) ||
            config.rampUp?.enabled;
        if (useArtillery) {
            await this.runArtilleryTest(testId, config);
        }
        else {
            await this.runAutocannonTest(testId, config);
        }
    }
    async runArtilleryTest(testId, config) {
        const configFile = path_1.default.join(this.configPath, `${testId}-artillery.yml`);
        const resultFile = path_1.default.join(this.configPath, `${testId}-results.json`);
        const artillery = (0, child_process_1.spawn)('artillery', [
            'run',
            '--output', resultFile,
            configFile,
        ]);
        this.activeTests.set(testId, artillery);
        let stdout = '';
        let stderr = '';
        artillery.stdout?.on('data', (data) => {
            stdout += data.toString();
            this.parseArtilleryOutput(testId, data.toString());
        });
        artillery.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        artillery.on('close', async (code) => {
            this.activeTests.delete(testId);
            const result = this.testResults.get(testId);
            if (!result)
                return;
            if (code === 0) {
                try {
                    // Parse Artillery results
                    const resultData = await promises_1.default.readFile(resultFile, 'utf-8');
                    await this.processArtilleryResults(testId, JSON.parse(resultData));
                    result.status = 'COMPLETED';
                    result.endTime = new Date();
                    result.duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000;
                    // Generate recommendations
                    result.recommendations = this.generateRecommendations(result);
                    this.emit('testCompleted', { testId, result });
                }
                catch (error) {
                    result.status = 'FAILED';
                    this.emit('testError', { testId, error: error.message });
                }
            }
            else {
                result.status = 'FAILED';
                this.emit('testError', { testId, error: `Artillery exited with code ${code}: ${stderr}` });
            }
            // Cleanup temporary files
            this.cleanupTestFiles(testId);
        });
    }
    async runAutocannonTest(testId, config) {
        const configFile = path_1.default.join(this.configPath, `${testId}-autocannon.json`);
        const autocannon = (0, child_process_1.spawn)('autocannon', [
            '-j', // JSON output
            '-c', '10', // connections
            '-d', config.duration.toString(),
            config.target.url,
        ]);
        this.activeTests.set(testId, autocannon);
        let stdout = '';
        let stderr = '';
        autocannon.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        autocannon.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        autocannon.on('close', async (code) => {
            this.activeTests.delete(testId);
            const result = this.testResults.get(testId);
            if (!result)
                return;
            if (code === 0) {
                try {
                    const resultData = JSON.parse(stdout);
                    await this.processAutocannonResults(testId, resultData);
                    result.status = 'COMPLETED';
                    result.endTime = new Date();
                    result.duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000;
                    // Generate recommendations
                    result.recommendations = this.generateRecommendations(result);
                    this.emit('testCompleted', { testId, result });
                }
                catch (error) {
                    result.status = 'FAILED';
                    this.emit('testError', { testId, error: error.message });
                }
            }
            else {
                result.status = 'FAILED';
                this.emit('testError', { testId, error: `Autocannon exited with code ${code}: ${stderr}` });
            }
            this.cleanupTestFiles(testId);
        });
    }
    parseArtilleryOutput(testId, output) {
        // Parse real-time output from Artillery for timeline updates
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('scenarios completed')) {
                const match = line.match(/(\d+) scenarios completed/);
                if (match) {
                    this.emit('testProgress', {
                        testId,
                        completedScenarios: parseInt(match[1]),
                    });
                }
            }
        }
    }
    async processArtilleryResults(testId, data) {
        const result = this.testResults.get(testId);
        if (!result)
            return;
        const aggregate = data.aggregate;
        // Update summary
        result.summary = {
            totalRequests: aggregate.counters?.['http.requests'] || 0,
            successfulRequests: aggregate.counters?.['http.responses'] || 0,
            failedRequests: aggregate.counters?.['http.request_rate'] || 0,
            errorRate: ((aggregate.counters?.['errors.ECONNREFUSED'] || 0) /
                Math.max(aggregate.counters?.['http.requests'] || 1, 1)) * 100,
            avgResponseTime: aggregate.latency?.mean || 0,
            p50ResponseTime: aggregate.latency?.p50 || 0,
            p95ResponseTime: aggregate.latency?.p95 || 0,
            p99ResponseTime: aggregate.latency?.p99 || 0,
            minResponseTime: aggregate.latency?.min || 0,
            maxResponseTime: aggregate.latency?.max || 0,
            throughput: aggregate.rates?.['http.request_rate'] || 0,
            bytesReceived: aggregate.counters?.['http.downloaded_bytes'] || 0,
            bytesSent: aggregate.counters?.['http.uploaded_bytes'] || 0,
        };
        // Process timeline data
        if (data.intermediate) {
            result.timeline = data.intermediate.map((point) => ({
                timestamp: new Date(point.timestamp),
                activeUsers: point.counters?.['vusers.created'] || 0,
                requestsPerSecond: point.rates?.['http.request_rate'] || 0,
                avgResponseTime: point.latency?.mean || 0,
                errorRate: ((point.counters?.['errors.ECONNREFUSED'] || 0) /
                    Math.max(point.counters?.['http.requests'] || 1, 1)) * 100,
            }));
        }
        // Process threshold results
        result.thresholdResults = this.evaluateThresholds(result.config.thresholds, result.summary);
    }
    async processAutocannonResults(testId, data) {
        const result = this.testResults.get(testId);
        if (!result)
            return;
        // Update summary from Autocannon results
        result.summary = {
            totalRequests: data.requests?.total || 0,
            successfulRequests: (data.requests?.total || 0) - (data.errors || 0),
            failedRequests: data.errors || 0,
            errorRate: ((data.errors || 0) / Math.max(data.requests?.total || 1, 1)) * 100,
            avgResponseTime: data.latency?.mean || 0,
            p50ResponseTime: data.latency?.p50 || 0,
            p95ResponseTime: data.latency?.p95 || 0,
            p99ResponseTime: data.latency?.p99 || 0,
            minResponseTime: data.latency?.min || 0,
            maxResponseTime: data.latency?.max || 0,
            throughput: data.throughput?.mean || 0,
            bytesReceived: data.requests?.total ? (data.requests.total * (data.latency?.mean || 0)) : 0,
            bytesSent: data.requests?.total ? (data.requests.total * 1000) : 0, // Estimate
        };
        // Process threshold results
        result.thresholdResults = this.evaluateThresholds(result.config.thresholds, result.summary);
    }
    evaluateThresholds(thresholds, summary) {
        const results = [];
        if (thresholds.avgResponseTime) {
            results.push({
                name: 'Average Response Time',
                threshold: thresholds.avgResponseTime,
                actual: summary.avgResponseTime,
                passed: summary.avgResponseTime <= thresholds.avgResponseTime,
                type: 'AVG_RESPONSE_TIME',
            });
        }
        if (thresholds.p95ResponseTime) {
            results.push({
                name: 'P95 Response Time',
                threshold: thresholds.p95ResponseTime,
                actual: summary.p95ResponseTime,
                passed: summary.p95ResponseTime <= thresholds.p95ResponseTime,
                type: 'P95_RESPONSE_TIME',
            });
        }
        if (thresholds.errorRate) {
            results.push({
                name: 'Error Rate',
                threshold: thresholds.errorRate,
                actual: summary.errorRate,
                passed: summary.errorRate <= thresholds.errorRate,
                type: 'ERROR_RATE',
            });
        }
        if (thresholds.throughput) {
            results.push({
                name: 'Throughput',
                threshold: thresholds.throughput,
                actual: summary.throughput,
                passed: summary.throughput >= thresholds.throughput,
                type: 'THROUGHPUT',
            });
        }
        return results;
    }
    generateRecommendations(result) {
        const recommendations = [];
        // High response time recommendation
        if (result.summary.avgResponseTime > 2000) {
            recommendations.push({
                type: 'PERFORMANCE',
                priority: 'HIGH',
                title: 'High Average Response Time',
                description: `Average response time of ${result.summary.avgResponseTime}ms exceeds acceptable limits`,
                impact: 'Poor user experience and potential timeouts',
                implementation: 'Implement caching, optimize database queries, or scale horizontally',
                estimatedEffort: 'MEDIUM',
            });
        }
        // High error rate recommendation
        if (result.summary.errorRate > 5) {
            recommendations.push({
                type: 'PERFORMANCE',
                priority: 'CRITICAL',
                title: 'High Error Rate',
                description: `Error rate of ${result.summary.errorRate}% indicates system instability`,
                impact: 'Service reliability issues and user frustration',
                implementation: 'Review application logs, check resource limits, implement circuit breakers',
                estimatedEffort: 'HIGH',
            });
        }
        // Low throughput recommendation
        if (result.summary.throughput < 100) {
            recommendations.push({
                type: 'CAPACITY',
                priority: 'MEDIUM',
                title: 'Low Throughput',
                description: `Throughput of ${result.summary.throughput} RPS may not meet demand`,
                impact: 'Limited capacity to handle concurrent users',
                implementation: 'Scale horizontally, optimize application code, or upgrade hardware',
                estimatedEffort: 'MEDIUM',
            });
        }
        // P95 response time recommendation
        if (result.summary.p95ResponseTime > 5000) {
            recommendations.push({
                type: 'PERFORMANCE',
                priority: 'HIGH',
                title: 'High P95 Response Time',
                description: `P95 response time of ${result.summary.p95ResponseTime}ms affects user experience`,
                impact: '5% of users experience very slow responses',
                implementation: 'Identify and optimize slowest endpoints, implement request timeouts',
                estimatedEffort: 'MEDIUM',
            });
        }
        return recommendations;
    }
    convertToYaml(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        let yaml = '';
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                for (const item of value) {
                    if (typeof item === 'object') {
                        yaml += `${spaces}  -\n`;
                        yaml += this.convertToYaml(item, indent + 4);
                    }
                    else {
                        yaml += `${spaces}  - ${item}\n`;
                    }
                }
            }
            else if (typeof value === 'object' && value !== null) {
                yaml += `${spaces}${key}:\n`;
                yaml += this.convertToYaml(value, indent + 2);
            }
            else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }
        return yaml;
    }
    async cleanupTestFiles(testId) {
        try {
            const files = [
                `${testId}-artillery.yml`,
                `${testId}-autocannon.json`,
                `${testId}-results.json`,
            ];
            for (const file of files) {
                try {
                    await promises_1.default.unlink(path_1.default.join(this.configPath, file));
                }
                catch {
                    // Ignore cleanup errors
                }
            }
        }
        catch (error) {
            console.error('Cleanup error:', error);
        }
    }
    async cancelTest(testId) {
        const process = this.activeTests.get(testId);
        if (process) {
            process.kill('SIGTERM');
            this.activeTests.delete(testId);
            const result = this.testResults.get(testId);
            if (result) {
                result.status = 'CANCELLED';
                result.endTime = new Date();
            }
            this.emit('testCancelled', { testId });
            return true;
        }
        return false;
    }
    getTestResult(testId) {
        return this.testResults.get(testId);
    }
    getActiveTests() {
        return Array.from(this.activeTests.keys());
    }
    async validateTestEnvironment() {
        const issues = [];
        // Check if Artillery is installed
        try {
            await this.executeCommand('artillery --version');
        }
        catch {
            issues.push('Artillery CLI not found. Install with: npm install -g artillery');
        }
        // Check if Autocannon is installed
        try {
            await this.executeCommand('autocannon --version');
        }
        catch {
            issues.push('Autocannon CLI not found. Install with: npm install -g autocannon');
        }
        // Check temp directory permissions
        try {
            await promises_1.default.access(this.configPath, promises_1.default.constants.W_OK);
        }
        catch {
            issues.push('Cannot write to temporary directory: ' + this.configPath);
        }
        return {
            valid: issues.length === 0,
            issues,
        };
    }
    executeCommand(command) {
        return new Promise((resolve, reject) => {
            const [cmd, ...args] = command.split(' ');
            const process = (0, child_process_1.spawn)(cmd, args);
            let stdout = '';
            let stderr = '';
            process.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            process.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    reject(new Error(stderr || `Command failed with code ${code}`));
                }
            });
        });
    }
}
exports.LoadTestExecutor = LoadTestExecutor;
//# sourceMappingURL=LoadTestExecutor.js.map
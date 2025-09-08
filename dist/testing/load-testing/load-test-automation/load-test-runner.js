#!/usr/bin/env ts-node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadTestRunner = void 0;
const LoadTestingFramework_1 = require("./LoadTestingFramework");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LoadTestRunner {
    options;
    defaultConfig;
    constructor(options) {
        this.options = options;
        this.defaultConfig = this.createDefaultConfig();
    }
    async run() {
        try {
            if (this.options.help) {
                this.showHelp();
                return;
            }
            console.log('🚀 Investment Platform Load Testing Suite');
            console.log('==========================================\n');
            // Load configuration
            const config = await this.loadConfiguration();
            // Create framework instance
            const framework = new LoadTestingFramework_1.LoadTestingFramework(config);
            // Setup event listeners
            this.setupEventListeners(framework);
            // Execute selected test
            const result = await this.executeSelectedTest(framework);
            // Display results summary
            this.displayResultsSummary(result);
            // Exit with appropriate code
            process.exit(result.summary.passed ? 0 : 1);
        }
        catch (error) {
            console.error('❌ Load test execution failed:', error instanceof Error ? error.message : 'Unknown error');
            if (this.options.verbose) {
                console.error(error instanceof Error ? error.stack : String(error));
            }
            process.exit(1);
        }
    }
    async loadConfiguration() {
        let config = { ...this.defaultConfig };
        // Load from config file if specified
        if (this.options.config) {
            const configPath = path.resolve(this.options.config);
            if (fs.existsSync(configPath)) {
                const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                config = { ...config, ...fileConfig };
                console.log(`📄 Loaded configuration from: ${configPath}`);
            }
            else {
                throw new Error(`Configuration file not found: ${configPath}`);
            }
        }
        // Override with CLI options
        if (this.options.users) {
            config.users.concurrent = this.options.users;
        }
        if (this.options.duration) {
            config.duration = this.options.duration;
        }
        if (this.options.rampUp) {
            config.users.rampUp = this.options.rampUp;
        }
        if (this.options.env) {
            config.environment.baseUrl = this.getEnvironmentUrl(this.options.env);
        }
        if (this.options.output) {
            config.reporting.outputDir = this.options.output;
        }
        return config;
    }
    async executeSelectedTest(framework) {
        const testType = this.options.test || 'standard';
        console.log(`🎯 Executing test type: ${testType}\n`);
        switch (testType.toLowerCase()) {
            case 'standard':
            case 'load':
                return await framework.executeLoadTest();
            case 'peak':
            case 'peak-trading':
                return await framework.executePeakTradingTest();
            case 'stress':
                return await framework.executeStressTest();
            case 'database':
            case 'db':
                return await framework.executeDatabaseLoadTest();
            case 'endurance':
                return await this.executeEnduranceTest(framework);
            case 'spike':
                return await this.executeSpikeTest(framework);
            default:
                throw new Error(`Unknown test type: ${testType}`);
        }
    }
    async executeEnduranceTest(framework) {
        console.log('🕐 Starting 24-hour endurance test...');
        const enduranceConfig = {
            ...this.defaultConfig,
            testName: 'Endurance Test - 24 Hours',
            duration: 86400, // 24 hours
            users: {
                concurrent: 1000,
                rampUp: 25,
                total: 1000
            }
        };
        const enduranceFramework = new LoadTestingFramework_1.LoadTestingFramework(enduranceConfig);
        return await enduranceFramework.executeLoadTest();
    }
    async executeSpikeTest(framework) {
        console.log('⚡ Starting spike test...');
        // Execute multiple spike scenarios
        const results = [];
        const baseUsers = 500;
        const spikeUsers = [2000, 5000, 8000];
        for (const spike of spikeUsers) {
            console.log(`\n📈 Testing spike: ${baseUsers} → ${spike} users`);
            const spikeConfig = {
                ...this.defaultConfig,
                testName: `Spike Test - ${spike} Users`,
                duration: 1800, // 30 minutes
                users: {
                    concurrent: spike,
                    rampUp: 100, // Rapid ramp-up
                    total: spike
                }
            };
            const spikeFramework = new LoadTestingFramework_1.LoadTestingFramework(spikeConfig);
            const result = await spikeFramework.executeLoadTest();
            results.push(result);
            // Cool down between spikes
            console.log('⏳ Cool down period...');
            await this.sleep(300000); // 5 minutes
        }
        return this.combineSpikeResults(results);
    }
    setupEventListeners(framework) {
        framework.on('testStarted', (data) => {
            console.log(`🎬 Test started: ${data.testId}`);
            console.log(`👥 Concurrent users: ${data.config.users.concurrent}`);
            console.log(`⏱️  Duration: ${data.config.duration}s`);
            console.log(`🎯 Target: ${data.config.environment.baseUrl}\n`);
        });
        framework.on('testCompleted', (result) => {
            console.log(`\n✅ Test completed: ${result.testId}`);
            console.log(`⏱️  Total duration: ${result.duration}s`);
        });
        framework.on('testFailed', (error) => {
            console.error(`\n❌ Test failed: ${error.testId}`);
            console.error(`💥 Error: ${error.error}`);
        });
        // Progress updates for verbose mode
        if (this.options.verbose) {
            framework.on('scenarioProgress', (data) => {
                console.log(`📊 ${data.scenario}: ${data.completed}/${data.total} requests`);
            });
            framework.on('metricsUpdate', (metrics) => {
                console.log(`📈 RPS: ${metrics.rps.toFixed(2)}, Avg Response: ${metrics.avgResponseTime.toFixed(2)}ms`);
            });
        }
    }
    displayResultsSummary(result) {
        console.log('\n📊 LOAD TEST RESULTS SUMMARY');
        console.log('================================');
        // Test status
        const status = result.summary.passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`Status: ${status}\n`);
        // Performance metrics
        console.log('🎯 Performance Metrics:');
        console.log(`   Total Requests: ${result.metrics.throughput.totalRequests.toLocaleString()}`);
        console.log(`   Requests/sec: ${result.metrics.throughput.rps.toFixed(2)}`);
        console.log(`   Avg Response Time: ${result.metrics.responseTime.avg.toFixed(2)}ms`);
        console.log(`   95th Percentile: ${result.metrics.responseTime.p95.toFixed(2)}ms`);
        console.log(`   Error Rate: ${result.metrics.errors.rate.toFixed(2)}%\n`);
        // Resource utilization
        console.log('💻 Resource Utilization:');
        console.log(`   CPU Average: ${result.metrics.resources.cpu.avg.toFixed(1)}%`);
        console.log(`   Memory Average: ${result.metrics.resources.memory.avg.toFixed(1)}%`);
        console.log(`   Disk I/O: ${result.metrics.resources.diskIO.avg.toFixed(1)} MB/s\n`);
        // Scenario results
        console.log('📋 Scenario Results:');
        result.scenarios.forEach((scenario) => {
            console.log(`   ${scenario.name}:`);
            console.log(`     Requests: ${scenario.requests.toLocaleString()}`);
            console.log(`     Avg Response: ${scenario.avgResponseTime.toFixed(2)}ms`);
            console.log(`     Errors: ${scenario.errors}`);
        });
        // Threshold violations
        if (result.summary.thresholdViolations.length > 0) {
            console.log('\n⚠️  Threshold Violations:');
            result.summary.thresholdViolations.forEach((violation) => {
                console.log(`   ${violation.metric}: Expected ${violation.expected}, Got ${violation.actual} (${violation.severity})`);
            });
        }
        // Recommendations
        if (result.summary.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            result.summary.recommendations.forEach((rec) => {
                console.log(`   • ${rec}`);
            });
        }
        // Bottlenecks
        if (result.summary.bottlenecks.length > 0) {
            console.log('\n🚨 Identified Bottlenecks:');
            result.summary.bottlenecks.forEach((bottleneck) => {
                console.log(`   ${bottleneck.component}: ${bottleneck.description}`);
                console.log(`     Impact: ${bottleneck.impact}`);
                console.log(`     Recommendation: ${bottleneck.recommendation}`);
            });
        }
        // Report files
        console.log(`\n📄 Detailed reports generated in: ${result.config.reporting.outputDir}`);
        console.log(`   • HTML Report: ${result.testId}-report.html`);
        console.log(`   • JSON Data: ${result.testId}-report.json`);
        console.log(`   • CSV Errors: ${result.testId}-report.csv`);
    }
    createDefaultConfig() {
        return {
            testName: 'Investment Platform Load Test',
            duration: 1800, // 30 minutes
            users: {
                concurrent: 1000,
                rampUp: 50, // users per second
                total: 2000
            },
            scenarios: [
                {
                    name: 'Portfolio Management',
                    weight: 40,
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/portfolios/dashboard',
                            weight: 40,
                            validation: { statusCode: 200, responseTime: 1000 }
                        },
                        {
                            method: 'GET',
                            path: '/api/portfolios/{portfolioId}/positions',
                            weight: 30,
                            validation: { statusCode: 200, responseTime: 500 }
                        },
                        {
                            method: 'GET',
                            path: '/api/portfolios/{portfolioId}/performance',
                            weight: 20,
                            validation: { statusCode: 200, responseTime: 2000 }
                        },
                        {
                            method: 'POST',
                            path: '/api/portfolios/{portfolioId}/rebalance',
                            weight: 10,
                            body: { strategy: 'equal_weight' },
                            validation: { statusCode: 202, responseTime: 1000 }
                        }
                    ],
                    userProfile: {
                        role: 'portfolio_manager',
                        credentials: { username: 'pm@testfirm.com', password: 'TestPM123!' },
                        permissions: ['portfolio.read', 'portfolio.write']
                    }
                },
                {
                    name: 'Trading Operations',
                    weight: 30,
                    endpoints: [
                        {
                            method: 'POST',
                            path: '/api/orders',
                            weight: 50,
                            body: { symbol: 'AAPL', quantity: 100, side: 'buy', type: 'market' },
                            validation: { statusCode: 201, responseTime: 300 }
                        },
                        {
                            method: 'GET',
                            path: '/api/orders/status',
                            weight: 30,
                            validation: { statusCode: 200, responseTime: 200 }
                        },
                        {
                            method: 'GET',
                            path: '/api/market-data/quotes',
                            weight: 20,
                            validation: { statusCode: 200, responseTime: 100 }
                        }
                    ],
                    userProfile: {
                        role: 'portfolio_manager',
                        credentials: { username: 'trader@testfirm.com', password: 'TestTrader123!' },
                        permissions: ['trading.write', 'market_data.read']
                    }
                },
                {
                    name: 'Client Portal',
                    weight: 20,
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/client/dashboard',
                            weight: 40,
                            validation: { statusCode: 200, responseTime: 800 }
                        },
                        {
                            method: 'GET',
                            path: '/api/client/portfolios',
                            weight: 30,
                            validation: { statusCode: 200, responseTime: 600 }
                        },
                        {
                            method: 'GET',
                            path: '/api/client/statements',
                            weight: 20,
                            validation: { statusCode: 200, responseTime: 1500 }
                        },
                        {
                            method: 'GET',
                            path: '/api/client/documents',
                            weight: 10,
                            validation: { statusCode: 200, responseTime: 400 }
                        }
                    ],
                    userProfile: {
                        role: 'client',
                        credentials: { username: 'client@testfirm.com', password: 'TestClient123!' },
                        permissions: ['client.read', 'documents.read']
                    }
                },
                {
                    name: 'Reporting & Analytics',
                    weight: 10,
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/reports/performance',
                            weight: 40,
                            validation: { statusCode: 200, responseTime: 5000 }
                        },
                        {
                            method: 'GET',
                            path: '/api/analytics/risk',
                            weight: 30,
                            validation: { statusCode: 200, responseTime: 3000 }
                        },
                        {
                            method: 'POST',
                            path: '/api/reports/generate',
                            weight: 20,
                            body: { type: 'monthly', portfolioIds: ['test1', 'test2'] },
                            validation: { statusCode: 202, responseTime: 1000 }
                        },
                        {
                            method: 'GET',
                            path: '/api/analytics/attribution',
                            weight: 10,
                            validation: { statusCode: 200, responseTime: 4000 }
                        }
                    ],
                    userProfile: {
                        role: 'portfolio_manager',
                        credentials: { username: 'analyst@testfirm.com', password: 'TestAnalyst123!' },
                        permissions: ['reports.read', 'analytics.read']
                    }
                }
            ],
            environment: {
                baseUrl: process.env.LOAD_TEST_URL || 'http://localhost:3000',
                timeout: 30000
            },
            thresholds: {
                responseTime: {
                    p50: 300,
                    p95: 500,
                    p99: 1000,
                    max: 5000
                },
                throughput: {
                    rps: 100,
                    tps: 50
                },
                errorRate: {
                    max: 1.0, // 1%
                    critical: 0.1 // 0.1%
                },
                resources: {
                    cpu: 80, // 80%
                    memory: 85, // 85%
                    diskIO: 100 // 100 MB/s
                }
            },
            reporting: {
                formats: ['html', 'json', 'csv'],
                outputDir: './load-test-results',
                realTimeUpdates: true
            }
        };
    }
    getEnvironmentUrl(env) {
        const envUrls = {
            local: 'http://localhost:3000',
            dev: 'https://dev.investmentplatform.com',
            staging: 'https://staging.investmentplatform.com',
            prod: 'https://app.investmentplatform.com'
        };
        return envUrls[env] || env; // Treat as URL if not found in predefined
    }
    combineSpikeResults(results) {
        // Combine multiple spike test results
        return {
            testId: `spike-test-${Date.now()}`,
            testName: 'Spike Test Suite',
            results,
            summary: {
                passed: results.every(r => r.summary.passed),
                maxUsersHandled: Math.max(...results.map(r => r.config.users.concurrent)),
                recommendations: this.generateSpikeRecommendations(results)
            }
        };
    }
    generateSpikeRecommendations(results) {
        const recommendations = [];
        const failedTests = results.filter(r => !r.summary.passed);
        if (failedTests.length > 0) {
            recommendations.push(`System failed at ${failedTests[0].config.users.concurrent} concurrent users`);
            recommendations.push('Consider implementing more aggressive auto-scaling policies');
        }
        else {
            recommendations.push('System successfully handled all spike scenarios');
            recommendations.push('Consider testing higher spike levels');
        }
        return recommendations;
    }
    showHelp() {
        console.log(`
🚀 Investment Platform Load Testing CLI

Usage: ts-node load-test-runner.ts [options]

Options:
  --config <file>       Load configuration from JSON file
  --test <type>         Test type: standard|peak|stress|database|endurance|spike
  --env <environment>   Target environment: local|dev|staging|prod
  --users <number>      Number of concurrent users (default: 1000)
  --duration <seconds>  Test duration in seconds (default: 1800)
  --ramp-up <number>    Users per second ramp-up rate (default: 50)
  --output <directory>  Output directory for reports (default: ./load-test-results)
  --verbose             Enable verbose logging
  --help                Show this help message

Test Types:
  standard       Standard load test with realistic user scenarios
  peak           Peak trading hours simulation (high load)
  stress         Stress test to find system breaking point
  database       Database-focused load testing
  endurance      24-hour endurance test
  spike          Spike testing with sudden load increases

Examples:
  # Standard load test with 500 users for 30 minutes
  ts-node load-test-runner.ts --users 500 --duration 1800

  # Peak trading hours test against staging
  ts-node load-test-runner.ts --test peak --env staging

  # Stress test with custom configuration
  ts-node load-test-runner.ts --test stress --config ./custom-config.json

  # Database load test with verbose output
  ts-node load-test-runner.ts --test database --verbose

Environment Variables:
  LOAD_TEST_URL         Base URL for testing (overrides --env)
  LOAD_TEST_API_KEY     API key for authenticated requests
  LOAD_TEST_TIMEOUT     Request timeout in milliseconds

Report Outputs:
  HTML Report           Visual dashboard with charts and metrics
  JSON Report           Machine-readable detailed results
  CSV Report            Error log and transaction details
    `);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.LoadTestRunner = LoadTestRunner;
// Parse command line arguments
function parseArguments() {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--config':
                options.config = args[++i];
                break;
            case '--test':
                options.test = args[++i];
                break;
            case '--env':
                options.env = args[++i];
                break;
            case '--users':
                options.users = parseInt(args[++i]);
                break;
            case '--duration':
                options.duration = parseInt(args[++i]);
                break;
            case '--ramp-up':
                options.rampUp = parseInt(args[++i]);
                break;
            case '--output':
                options.output = args[++i];
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--help':
                options.help = true;
                break;
        }
    }
    return options;
}
// Main execution
if (require.main === module) {
    const options = parseArguments();
    const runner = new LoadTestRunner(options);
    runner.run().catch(error => {
        console.error('Load test runner failed:', error);
        process.exit(1);
    });
}

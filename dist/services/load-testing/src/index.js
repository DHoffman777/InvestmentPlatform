"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.LoadTestingService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const LoadTestingService_1 = require("./LoadTestingService");
Object.defineProperty(exports, "LoadTestingService", { enumerable: true, get: function () { return LoadTestingService_1.LoadTestingService; } });
// Load environment variables
dotenv_1.default.config();
const config = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
    },
    defaultTestSettings: {
        maxConcurrentTests: parseInt(process.env.MAX_CONCURRENT_TESTS || '5'),
        defaultDuration: parseInt(process.env.DEFAULT_TEST_DURATION || '60'),
        maxDuration: parseInt(process.env.MAX_TEST_DURATION || '3600'), // 1 hour
        retentionDays: parseInt(process.env.TEST_RETENTION_DAYS || '30'),
    },
    scheduling: {
        enableScheduledTests: process.env.ENABLE_SCHEDULED_TESTS === 'true',
        cleanupSchedule: process.env.CLEANUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    },
    notifications: {
        enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
        webhookUrl: process.env.NOTIFICATION_WEBHOOK_URL,
        slackChannel: process.env.SLACK_CHANNEL,
    },
};
exports.config = config;
const loadTestService = new LoadTestingService_1.LoadTestingService(config);
// Event handlers
loadTestService.on('serviceStarted', ({ port }) => {
    console.log(`Load Testing Service started on port ${port}`);
    console.log('Available endpoints:');
    console.log('  POST /api/v1/tests/execute - Execute load test');
    console.log('  GET  /api/v1/tests/:testId - Get test result');
    console.log('  POST /api/v1/tests/:testId/cancel - Cancel test');
    console.log('  POST /api/v1/benchmarks/execute - Execute benchmark');
    console.log('  POST /api/v1/capacity/plan - Generate capacity plan');
    console.log('  GET  /api/v1/health - Health check');
});
loadTestService.on('testStarted', ({ testId, config }) => {
    console.log(`Load test started: ${testId} - ${config.name}`);
});
loadTestService.on('testCompleted', ({ testId, result }) => {
    console.log(`Load test completed: ${testId}`);
    console.log(`  Duration: ${result.duration}s`);
    console.log(`  Total requests: ${result.summary.totalRequests}`);
    console.log(`  Error rate: ${result.summary.errorRate.toFixed(2)}%`);
    console.log(`  Avg response time: ${result.summary.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Throughput: ${result.summary.throughput.toFixed(2)} RPS`);
    // Log threshold results
    const failedThresholds = result.thresholdResults.filter((t) => !t.passed);
    if (failedThresholds.length > 0) {
        console.log('  Failed thresholds:');
        failedThresholds.forEach((t) => {
            console.log(`    ${t.name}: ${t.actual} (threshold: ${t.threshold})`);
        });
    }
    // Log recommendations
    if (result.recommendations.length > 0) {
        console.log('  Recommendations:');
        result.recommendations.forEach((r) => {
            console.log(`    [${r.priority}] ${r.title}: ${r.description}`);
        });
    }
});
loadTestService.on('testError', ({ testId, error }) => {
    console.error(`Load test failed: ${testId} - ${error}`);
});
loadTestService.on('planGenerated', ({ planId, result }) => {
    console.log(`Capacity plan generated: ${planId}`);
    console.log(`  Planning horizon: ${result.config.growthProjections.planningHorizon} months`);
    console.log(`  Bottlenecks identified: ${result.projections.bottlenecks.length}`);
    console.log(`  Scaling recommendations: ${result.projections.scalingRecommendations.length}`);
    console.log(`  Overall risk: ${result.riskAssessment.overallRisk}`);
});
loadTestService.on('error', (error) => {
    console.error('Load Testing Service error:', error);
});
// Graceful shutdown
const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
        await loadTestService.shutdown();
        console.log('Shutdown completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
});
// Start the service
const port = parseInt(process.env.PORT || '3010');
loadTestService.start(port);

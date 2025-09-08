"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoScalingService = void 0;
const express_1 = __importDefault(require("express"));
const events_1 = require("events");
const node_cron_1 = __importDefault(require("node-cron"));
const ioredis_1 = __importDefault(require("ioredis"));
const MetricsCollector_1 = require("./services/MetricsCollector");
const ScalingDecisionEngine_1 = require("./services/ScalingDecisionEngine");
const ScalingExecutor_1 = require("./services/ScalingExecutor");
class AutoScalingService extends events_1.EventEmitter {
    constructor(config, financialProfile) {
        super();
        this.config = config;
        this.financialProfile = financialProfile;
        this.isRunning = false;
        this.app = (0, express_1.default)();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventHandlers();
    }
    initializeServices() {
        // Initialize Redis
        this.redis = new ioredis_1.default({
            host: this.config.redis.host,
            port: this.config.redis.port,
            password: this.config.redis.password,
            db: this.config.redis.db,
            keyPrefix: 'auto-scaling:',
        });
        // Initialize core services
        this.metricsCollector = new MetricsCollector_1.MetricsCollector(this.config);
        this.decisionEngine = new ScalingDecisionEngine_1.ScalingDecisionEngine(this.config, this.financialProfile);
        this.scalingExecutor = new ScalingExecutor_1.ScalingExecutor(this.config);
    }
    setupEventHandlers() {
        // Metrics collection events
        this.metricsCollector.on('metricsCollected', async (data) => {
            if (this.config.scaling.enabled) {
                await this.evaluateScalingDecision(data.service, data.metrics);
            }
        });
        this.metricsCollector.on('collectionError', (data) => {
            console.error(`Metrics collection failed for ${data.service}:`, data.error);
            this.emit('metricsError', data);
        });
        // Decision engine events
        this.decisionEngine.on('decisionMade', async (data) => {
            console.log(`Scaling decision made for ${data.serviceName}: ${data.decision.action} (confidence: ${data.decision.confidence})`);
            if (data.decision.action !== 'maintain') {
                try {
                    const scalingEvent = await this.scalingExecutor.executeScalingDecision(data.decision);
                    this.emit('scalingExecuted', { serviceName: data.serviceName, event: scalingEvent });
                    // Set cooldown period
                    this.decisionEngine.setCooldown(data.serviceName, data.decision.action);
                    // Store decision and event
                    await this.storeScalingDecision(data.decision);
                    await this.storeScalingEvent(scalingEvent);
                }
                catch (error) {
                    console.error(`Failed to execute scaling for ${data.serviceName}:`, error);
                    this.emit('scalingError', { serviceName: data.serviceName, error });
                }
            }
        });
        // Scaling executor events
        this.scalingExecutor.on('scalingStarted', (event) => {
            console.log(`Scaling started: ${event.id}`);
            this.emit('scalingStarted', event);
        });
        this.scalingExecutor.on('scalingCompleted', (event) => {
            console.log(`Scaling completed: ${event.id} (${event.duration}ms)`);
            this.emit('scalingCompleted', event);
            if (this.config.alerts.enabled) {
                this.sendAlert('scaling_completed', `Scaling completed for ${event.action.targetServices.join(', ')}`, event);
            }
        });
        this.scalingExecutor.on('scalingFailed', (event) => {
            console.error(`Scaling failed: ${event.id} - ${event.error}`);
            this.emit('scalingFailed', event);
            if (this.config.alerts.enabled) {
                this.sendAlert('scaling_failed', `Scaling failed for ${event.action.targetServices.join(', ')}: ${event.error}`, event);
            }
        });
    }
    async evaluateScalingDecision(serviceName, metrics) {
        try {
            const allMetrics = this.metricsCollector.getAllMetrics();
            const decision = await this.decisionEngine.makeScalingDecision(serviceName, metrics, allMetrics);
            console.log(`Scaling evaluation for ${serviceName}: ${decision.action} (${decision.confidence.toFixed(2)} confidence)`);
            // Emit decision event (will be handled by event handler above)
            this.decisionEngine.emit('decisionMade', { serviceName, decision });
        }
        catch (error) {
            console.error(`Failed to evaluate scaling decision for ${serviceName}:`, error);
            this.emit('decisionError', { serviceName, error });
        }
    }
    setupMiddleware() {
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
        });
    }
    setupRoutes() {
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
        // Get current scaling status
        this.app.get('/api/v1/status', async (req, res) => {
            try {
                const status = await this.getScalingStatus();
                res.json(status);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get status', details: error.message });
            }
        });
        // Get service metrics
        this.app.get('/api/v1/metrics/:serviceName', (req, res) => {
            try {
                const { serviceName } = req.params;
                const metrics = this.metricsCollector.getServiceMetrics(serviceName);
                if (!metrics) {
                    return res.status(404).json({ error: 'Service metrics not found' });
                }
                res.json(metrics);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get metrics', details: error.message });
            }
        });
        // Get scaling decisions for a service
        this.app.get('/api/v1/decisions/:serviceName', (req, res) => {
            try {
                const { serviceName } = req.params;
                const { limit = 20 } = req.query;
                const decisions = this.decisionEngine.getDecisionHistory(serviceName, parseInt(limit));
                res.json(decisions);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get decisions', details: error.message });
            }
        });
        // Get scaling events for a service
        this.app.get('/api/v1/events/:serviceName', (req, res) => {
            try {
                const { serviceName } = req.params;
                const { limit = 20 } = req.query;
                const events = this.scalingExecutor.getScalingHistory(serviceName, parseInt(limit));
                res.json(events);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get events', details: error.message });
            }
        });
        // Manual scaling trigger
        this.app.post('/api/v1/scale/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const { targetInstances, reason = 'Manual scaling request' } = req.body;
                if (!targetInstances || targetInstances < 1) {
                    return res.status(400).json({ error: 'Valid targetInstances required' });
                }
                // Validate scaling capability
                const validation = await this.scalingExecutor.validateScalingCapability(serviceName);
                if (!validation.canScale) {
                    return res.status(400).json({ error: 'Cannot scale service', issues: validation.issues });
                }
                // Create manual scaling decision
                const decision = {
                    timestamp: new Date(),
                    serviceName,
                    currentInstances: validation.currentInstances,
                    recommendedInstances: targetInstances,
                    confidence: 1.0,
                    reasoning: [reason],
                    triggeredRules: ['manual'],
                    metricsUsed: {},
                    action: targetInstances > validation.currentInstances ? 'scale_up' :
                        targetInstances < validation.currentInstances ? 'scale_down' : 'maintain',
                    urgency: 'medium',
                };
                const scalingEvent = await this.scalingExecutor.executeScalingDecision(decision);
                res.json({ decision, event: scalingEvent });
            }
            catch (error) {
                res.status(500).json({ error: 'Manual scaling failed', details: error.message });
            }
        });
        // Emergency scale-down
        this.app.post('/api/v1/emergency/scale-down/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const { emergencyInstances = 1 } = req.body;
                const scalingEvent = await this.scalingExecutor.emergencyScaleDown(serviceName, emergencyInstances);
                res.json({ event: scalingEvent });
            }
            catch (error) {
                res.status(500).json({ error: 'Emergency scale-down failed', details: error.message });
            }
        });
        // Rollback last scaling
        this.app.post('/api/v1/rollback/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const scalingEvent = await this.scalingExecutor.rollbackLastScaling(serviceName);
                if (!scalingEvent) {
                    return res.status(404).json({ error: 'No scaling to rollback' });
                }
                res.json({ event: scalingEvent });
            }
            catch (error) {
                res.status(500).json({ error: 'Rollback failed', details: error.message });
            }
        });
        // Generate scaling prediction
        this.app.get('/api/v1/predictions/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const { timeHorizon = 60 } = req.query; // minutes
                const prediction = await this.decisionEngine.generatePrediction(serviceName, parseInt(timeHorizon));
                res.json(prediction);
            }
            catch (error) {
                res.status(500).json({ error: 'Prediction generation failed', details: error.message });
            }
        });
        // Generate scaling report
        this.app.post('/api/v1/reports/generate', async (req, res) => {
            try {
                const { startDate, endDate, services } = req.body;
                const report = await this.generateScalingReport(new Date(startDate), new Date(endDate), services);
                res.json(report);
            }
            catch (error) {
                res.status(500).json({ error: 'Report generation failed', details: error.message });
            }
        });
        // Update scaling configuration
        this.app.put('/api/v1/config', async (req, res) => {
            try {
                const newConfig = req.body;
                await this.updateConfiguration(newConfig);
                res.json({ message: 'Configuration updated successfully' });
            }
            catch (error) {
                res.status(500).json({ error: 'Configuration update failed', details: error.message });
            }
        });
        // Test scaling operation
        this.app.post('/api/v1/test-scaling/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const { targetInstances } = req.body;
                const testResult = await this.scalingExecutor.testScalingOperation(serviceName, targetInstances);
                res.json(testResult);
            }
            catch (error) {
                res.status(500).json({ error: 'Scaling test failed', details: error.message });
            }
        });
    }
    async getHealthStatus() {
        const metricsHealth = await this.metricsCollector.validateMetricsHealth();
        const activeScalings = this.scalingExecutor.getActiveScalings();
        return {
            status: 'healthy',
            timestamp: new Date(),
            components: {
                metricsCollector: {
                    healthy: metricsHealth.healthy,
                    issues: metricsHealth.issues,
                    servicesMonitored: metricsHealth.servicesMonitored,
                    lastCollection: metricsHealth.lastCollection,
                },
                decisionEngine: {
                    healthy: true,
                },
                scalingExecutor: {
                    healthy: activeScalings.length < 5, // Arbitrary threshold
                    activeScalings: activeScalings.length,
                },
                redis: {
                    healthy: this.redis.status === 'ready',
                    status: this.redis.status,
                },
            },
            configuration: {
                enabled: this.config.scaling.enabled,
                provider: this.config.scaling.provider,
                rulesCount: this.config.scaling.rules.length,
            },
            runtime: {
                isRunning: this.isRunning,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
            },
        };
    }
    async getScalingStatus() {
        const allMetrics = this.metricsCollector.getAllMetrics();
        const activeScalings = this.scalingExecutor.getActiveScalings();
        const servicesStatus = [];
        for (const [serviceName, metrics] of allMetrics.entries()) {
            servicesStatus.push({
                serviceName,
                currentInstances: metrics.instances.current,
                healthyInstances: metrics.instances.healthy,
                unhealthyInstances: metrics.instances.unhealthy,
                cpuUsage: metrics.resources.cpu.usage,
                memoryUsage: metrics.resources.memory.usage,
                responseTime: metrics.performance.responseTime,
                throughput: metrics.performance.throughput,
                errorRate: metrics.performance.errorRate,
                lastUpdated: metrics.timestamp,
            });
        }
        return {
            timestamp: new Date(),
            overall: {
                enabled: this.config.scaling.enabled,
                activeScalings: activeScalings.length,
                totalServices: servicesStatus.length,
            },
            services: servicesStatus,
            limits: this.config.scaling.limits,
        };
    }
    async storeScalingDecision(decision) {
        const key = `decision:${decision.serviceName}:${decision.timestamp.toISOString()}`;
        await this.redis.setex(key, 86400 * 7, JSON.stringify(decision)); // 7 days retention
    }
    async storeScalingEvent(event) {
        const key = `event:${event.id}`;
        await this.redis.setex(key, 86400 * 30, JSON.stringify(event)); // 30 days retention
    }
    async sendAlert(type, message, data) {
        try {
            console.log(`Alert [${type}]: ${message}`);
            // In a real implementation, you'd send to webhooks, Slack, email, etc.
            if (this.config.alerts.webhookUrl) {
                // Send webhook notification
            }
            if (this.config.alerts.slackChannel) {
                // Send Slack notification
            }
            if (this.config.alerts.emailRecipients) {
                // Send email notification
            }
        }
        catch (error) {
            console.error('Failed to send alert:', error);
        }
    }
    async generateScalingReport(startDate, endDate, services) {
        const reportId = `report_${Date.now()}`;
        // Get scaling events for the period
        const allEvents = this.scalingExecutor.getAllScalingHistory();
        const periodEvents = allEvents.filter(event => event.timestamp >= startDate &&
            event.timestamp <= endDate &&
            (!services || services.includes(event.action.targetServices[0])));
        // Calculate summary statistics
        const totalScalingEvents = periodEvents.length;
        const successfulScalings = periodEvents.filter(e => e.success).length;
        const failedScalings = totalScalingEvents - successfulScalings;
        const averageResponseTime = periodEvents.length > 0
            ? periodEvents.reduce((sum, e) => sum + e.duration, 0) / periodEvents.length
            : 0;
        // Analyze by service
        const serviceAnalysis = new Map();
        for (const event of periodEvents) {
            const serviceName = event.action.targetServices[0];
            if (!serviceAnalysis.has(serviceName)) {
                serviceAnalysis.set(serviceName, {
                    serviceName,
                    scalingEvents: 0,
                    instanceCounts: [],
                    durations: [],
                });
            }
            const analysis = serviceAnalysis.get(serviceName);
            analysis.scalingEvents++;
            analysis.instanceCounts.push(event.newInstances);
            analysis.durations.push(event.duration);
        }
        const serviceAnalysisArray = Array.from(serviceAnalysis.values()).map(analysis => ({
            serviceName: analysis.serviceName,
            scalingEvents: analysis.scalingEvents,
            averageInstances: analysis.instanceCounts.reduce((sum, count) => sum + count, 0) / analysis.instanceCounts.length,
            peakInstances: Math.max(...analysis.instanceCounts),
            minInstances: Math.min(...analysis.instanceCounts),
            utilizationStats: {
                cpu: { avg: 50, max: 80, min: 20 }, // Mock data
                memory: { avg: 60, max: 85, min: 30 },
            },
            performanceImpact: {
                responseTimeChange: 0,
                throughputChange: 0,
                errorRateChange: 0,
            },
        }));
        return {
            id: reportId,
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            summary: {
                totalScalingEvents,
                successfulScalings,
                failedScalings,
                averageResponseTime,
                costImpact: {
                    totalCost: 0, // Would calculate based on cloud provider costs
                    costSavings: 0,
                    costIncrease: 0,
                },
            },
            serviceAnalysis: serviceAnalysisArray,
            recommendations: [
                {
                    type: 'config_change',
                    priority: 'medium',
                    description: 'Consider adjusting CPU threshold for more responsive scaling',
                    expectedBenefit: 'Reduced response times during peak load',
                    implementationComplexity: 'low',
                },
            ],
            predictions: {
                nextWeek: [], // Would generate predictions
                seasonalForecast: [],
            },
        };
    }
    async updateConfiguration(newConfig) {
        // Update configuration (in production, this would validate and persist changes)
        Object.assign(this.config, newConfig);
        // Restart services with new configuration if needed
        if (this.isRunning) {
            await this.stop();
            await this.start();
        }
    }
    async start(port = 3011) {
        if (this.isRunning) {
            console.log('Auto-scaling service is already running');
            return;
        }
        console.log('Starting Auto-Scaling Service...');
        // Start metrics collection
        this.metricsCollector.start();
        // Set up scheduled reporting
        if (this.config.reporting.enabled && this.config.reporting.schedule) {
            this.reportingSchedule = node_cron_1.default.schedule(this.config.reporting.schedule, async () => {
                try {
                    const endDate = new Date();
                    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
                    const report = await this.generateScalingReport(startDate, endDate);
                    console.log(`Daily report generated: ${report.id}`);
                    this.emit('reportGenerated', report);
                }
                catch (error) {
                    console.error('Scheduled report generation failed:', error);
                }
            });
        }
        // Start HTTP server
        this.app.listen(port, () => {
            console.log(`Auto-Scaling Service listening on port ${port}`);
            this.isRunning = true;
            this.emit('serviceStarted', { port });
        });
    }
    async stop() {
        if (!this.isRunning) {
            console.log('Auto-scaling service is not running');
            return;
        }
        console.log('Stopping Auto-Scaling Service...');
        // Stop metrics collection
        this.metricsCollector.stop();
        // Stop scheduled reporting
        if (this.reportingSchedule) {
            this.reportingSchedule.stop();
            this.reportingSchedule = undefined;
        }
        // Stop evaluation interval
        if (this.evaluationInterval) {
            clearInterval(this.evaluationInterval);
            this.evaluationInterval = undefined;
        }
        // Close Redis connection
        await this.redis.quit();
        this.isRunning = false;
        console.log('Auto-Scaling Service stopped');
    }
    getApp() {
        return this.app;
    }
}
exports.AutoScalingService = AutoScalingService;
//# sourceMappingURL=AutoScalingService.js.map
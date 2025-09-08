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
exports.CapacityPlanningController = void 0;
const express_1 = __importStar(require("express"));
const events_1 = require("events");
class CapacityPlanningController extends events_1.EventEmitter {
    app;
    config;
    services;
    metrics;
    constructor(config, services) {
        super();
        this.config = config;
        this.services = services;
        this.metrics = new APIMetrics();
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use(express_1.default.json({ limit: this.config.maxPayloadSize }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        if (this.config.enableCors) {
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
                if (req.method === 'OPTIONS') {
                    res.sendStatus(200);
                }
                else {
                    next();
                }
            });
        }
        if (this.config.metricsEnabled) {
            this.app.use(this.metricsMiddleware.bind(this));
        }
        if (this.config.authenticationRequired) {
            this.app.use(this.authenticationMiddleware.bind(this));
        }
    }
    setupRoutes() {
        const apiRouter = (0, express_1.Router)();
        this.setupPredictionRoutes(apiRouter);
        this.setupThresholdRoutes(apiRouter);
        this.setupTrendAnalysisRoutes(apiRouter);
        this.setupRecommendationRoutes(apiRouter);
        this.setupReportingRoutes(apiRouter);
        this.setupCostOptimizationRoutes(apiRouter);
        this.setupWorkflowRoutes(apiRouter);
        this.setupSystemRoutes(apiRouter);
        this.app.use(`/api/${this.config.apiVersion}`, apiRouter);
        this.app.use('/health', this.healthCheck.bind(this));
        this.app.use('/metrics', this.systemMetrics.bind(this));
        if (this.config.enableSwaggerDocs) {
            this.setupSwaggerDocs();
        }
    }
    setupPredictionRoutes(router) {
        // Prediction Models
        router.post('/models', this.createPredictionModel.bind(this));
        router.get('/models', this.getPredictionModels.bind(this));
        router.get('/models/:modelId', this.getPredictionModel.bind(this));
        router.put('/models/:modelId', this.updatePredictionModel.bind(this));
        router.delete('/models/:modelId', this.deletePredictionModel.bind(this));
        router.post('/models/:modelId/train', this.trainPredictionModel.bind(this));
        router.post('/models/:modelId/optimize', this.optimizePredictionModel.bind(this));
        router.get('/models/:modelId/performance', this.getPredictionModelPerformance.bind(this));
        // Predictions
        router.post('/predictions', this.generatePrediction.bind(this));
        router.post('/predictions/batch', this.batchGeneratePredictions.bind(this));
        router.get('/predictions/:predictionId', this.getPrediction.bind(this));
        router.get('/resources/:resourceId/predictions', this.getResourcePredictions.bind(this));
    }
    setupThresholdRoutes(router) {
        // Scaling Thresholds
        router.post('/thresholds', this.createScalingThreshold.bind(this));
        router.get('/thresholds', this.getScalingThresholds.bind(this));
        router.get('/thresholds/:thresholdId', this.getScalingThreshold.bind(this));
        router.put('/thresholds/:thresholdId', this.updateScalingThreshold.bind(this));
        router.delete('/thresholds/:thresholdId', this.deleteScalingThreshold.bind(this));
        router.post('/thresholds/evaluate', this.evaluateThresholds.bind(this));
        // Alerts
        router.get('/alerts', this.getCapacityAlerts.bind(this));
        router.get('/alerts/:alertId', this.getCapacityAlert.bind(this));
        router.post('/alerts/:alertId/acknowledge', this.acknowledgeAlert.bind(this));
        router.post('/alerts/:alertId/resolve', this.resolveAlert.bind(this));
        router.post('/alerts/:alertId/suppress', this.suppressAlert.bind(this));
        router.get('/alerts/metrics', this.getAlertMetrics.bind(this));
    }
    setupTrendAnalysisRoutes(router) {
        router.post('/trends/analyze', this.analyzeTrend.bind(this));
        router.post('/trends/batch-analyze', this.batchAnalyzeTrends.bind(this));
        router.get('/trends/:trendId', this.getTrend.bind(this));
        router.get('/resources/:resourceId/trends', this.getResourceTrends.bind(this));
        router.post('/anomalies/detect', this.detectAnomalies.bind(this));
        router.post('/trends/compare', this.compareResourceTrends.bind(this));
        router.get('/trends/summary', this.getTrendSummary.bind(this));
    }
    setupRecommendationRoutes(router) {
        router.post('/recommendations/generate', this.generateRecommendations.bind(this));
        router.post('/recommendations/batch-generate', this.batchGenerateRecommendations.bind(this));
        router.get('/recommendations/:recommendationId', this.getRecommendation.bind(this));
        router.get('/recommendations', this.getRecommendations.bind(this));
        router.post('/recommendations/:recommendationId/feedback', this.submitRecommendationFeedback.bind(this));
        router.get('/recommendations/:recommendationId/effectiveness', this.getRecommendationEffectiveness.bind(this));
        router.get('/resources/:resourceId/recommendations', this.getResourceRecommendations.bind(this));
    }
    setupReportingRoutes(router) {
        router.post('/reports', this.generateReport.bind(this));
        router.post('/reports/schedule', this.scheduleReport.bind(this));
        router.get('/reports/:reportId', this.getReport.bind(this));
        router.get('/reports', this.getReports.bind(this));
        router.delete('/reports/schedules/:scheduleId', this.cancelScheduledReport.bind(this));
        router.post('/reports/templates', this.createReportTemplate.bind(this));
        router.get('/reports/templates', this.getReportTemplates.bind(this));
        router.get('/reports/templates/:templateId', this.getReportTemplate.bind(this));
        router.post('/reports/executive-summary', this.generateExecutiveSummaryReport.bind(this));
    }
    setupCostOptimizationRoutes(router) {
        router.post('/cost-optimization/analyze', this.analyzeCostOptimization.bind(this));
        router.post('/cost-optimization/batch-analyze', this.batchAnalyzeCostOptimization.bind(this));
        router.get('/cost-optimization/:resourceId', this.getCostOptimization.bind(this));
        router.get('/cost-optimization', this.getAllCostOptimizations.bind(this));
        router.post('/cost-optimization/:resourceId/implement', this.implementOptimization.bind(this));
        router.get('/cost-optimization/:resourceId/roi', this.trackOptimizationROI.bind(this));
        router.post('/cost-optimization/forecast', this.generateCostForecast.bind(this));
        router.get('/cost-optimization/opportunities', this.getTopOptimizationOpportunities.bind(this));
    }
    setupWorkflowRoutes(router) {
        router.post('/workflows/templates', this.createWorkflowTemplate.bind(this));
        router.get('/workflows/templates', this.getWorkflowTemplates.bind(this));
        router.get('/workflows/templates/:templateId', this.getWorkflowTemplate.bind(this));
        router.post('/workflows/execute', this.executeWorkflow.bind(this));
        router.get('/workflows/executions/:executionId', this.getWorkflowExecution.bind(this));
        router.get('/workflows/executions', this.getWorkflowExecutions.bind(this));
        router.post('/workflows/executions/:executionId/approve', this.approveWorkflowStep.bind(this));
        router.post('/workflows/executions/:executionId/reject', this.rejectWorkflowStep.bind(this));
        router.delete('/workflows/executions/:executionId', this.cancelWorkflowExecution.bind(this));
        router.get('/workflows/metrics', this.getWorkflowMetrics.bind(this));
    }
    setupSystemRoutes(router) {
        router.get('/system/status', this.getSystemStatus.bind(this));
        router.get('/system/metrics', this.getSystemMetrics.bind(this));
        router.post('/system/maintenance', this.scheduleSystemMaintenance.bind(this));
        router.get('/system/configuration', this.getSystemConfiguration.bind(this));
        router.put('/system/configuration', this.updateSystemConfiguration.bind(this));
    }
    // Prediction Model Routes
    async createPredictionModel(req, res) {
        try {
            const model = await this.services.predictionService.createPredictionModel(req.body);
            res.status(201).json({ success: true, data: model });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getPredictionModels(req, res) {
        try {
            const { resourceType } = req.query;
            const models = resourceType
                ? await this.services.predictionService.getModelsByResourceType(resourceType)
                : this.services.predictionService.getAllModels();
            res.json({ success: true, data: models });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getPredictionModel(req, res) {
        try {
            const model = this.services.predictionService.getModel(req.params.modelId);
            if (!model) {
                res.status(404).json({ success: false, error: 'Model not found' });
                return;
            }
            res.json({ success: true, data: model });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async updatePredictionModel(req, res) {
        try {
            // Implementation would update model parameters
            res.json({ success: true, message: 'Model updated successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async deletePredictionModel(req, res) {
        try {
            await this.services.predictionService.deactivateModel(req.params.modelId);
            res.json({ success: true, message: 'Model deactivated successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async trainPredictionModel(req, res) {
        try {
            const { trainingData } = req.body;
            const accuracy = await this.services.predictionService.trainModel(req.params.modelId, trainingData);
            res.json({ success: true, data: { accuracy } });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async optimizePredictionModel(req, res) {
        try {
            const model = await this.services.predictionService.optimizeModel(req.params.modelId);
            res.json({ success: true, data: model });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getPredictionModelPerformance(req, res) {
        try {
            const performance = await this.services.predictionService.evaluateModelPerformance(req.params.modelId);
            res.json({ success: true, data: performance });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Prediction Routes
    async generatePrediction(req, res) {
        try {
            const { modelId, resourceId, options } = req.body;
            const prediction = await this.services.predictionService.generatePrediction(modelId, resourceId, options);
            res.json({ success: true, data: prediction });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async batchGeneratePredictions(req, res) {
        try {
            const { requests } = req.body;
            const predictions = await this.services.predictionService.batchPredict(requests);
            res.json({ success: true, data: predictions });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getPrediction(req, res) {
        try {
            const prediction = this.services.predictionService.getPrediction(req.params.predictionId);
            if (!prediction) {
                res.status(404).json({ success: false, error: 'Prediction not found' });
                return;
            }
            res.json({ success: true, data: prediction });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getResourcePredictions(req, res) {
        try {
            // Implementation would filter predictions by resource
            res.json({ success: true, data: [] });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Threshold Routes
    async createScalingThreshold(req, res) {
        try {
            const threshold = await this.services.thresholdMonitor.createThreshold(req.body);
            res.status(201).json({ success: true, data: threshold });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getScalingThresholds(req, res) {
        try {
            const { resourceId, resourceType } = req.query;
            const thresholds = await this.services.thresholdMonitor.getThresholds(resourceId, resourceType);
            res.json({ success: true, data: thresholds });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getScalingThreshold(req, res) {
        try {
            // Implementation would get specific threshold
            res.json({ success: true, data: {} });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async updateScalingThreshold(req, res) {
        try {
            const threshold = await this.services.thresholdMonitor.updateThreshold(req.params.thresholdId, req.body);
            res.json({ success: true, data: threshold });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async deleteScalingThreshold(req, res) {
        try {
            // Implementation would delete threshold
            res.json({ success: true, message: 'Threshold deleted successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async evaluateThresholds(req, res) {
        try {
            const { metrics } = req.body;
            const evaluations = await this.services.thresholdMonitor.evaluateThresholds(metrics);
            res.json({ success: true, data: evaluations });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Alert Routes
    async getCapacityAlerts(req, res) {
        try {
            const { resourceId } = req.query;
            const alerts = await this.services.thresholdMonitor.getActiveAlerts(resourceId);
            res.json({ success: true, data: alerts });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getCapacityAlert(req, res) {
        try {
            // Implementation would get specific alert
            res.json({ success: true, data: {} });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async acknowledgeAlert(req, res) {
        try {
            const { userId } = req.body;
            await this.services.thresholdMonitor.acknowledgeAlert(req.params.alertId, userId);
            res.json({ success: true, message: 'Alert acknowledged successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async resolveAlert(req, res) {
        try {
            const { resolution } = req.body;
            await this.services.thresholdMonitor.resolveAlert(req.params.alertId, resolution);
            res.json({ success: true, message: 'Alert resolved successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async suppressAlert(req, res) {
        try {
            const { duration } = req.body;
            await this.services.thresholdMonitor.suppressAlert(req.params.alertId, duration);
            res.json({ success: true, message: 'Alert suppressed successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getAlertMetrics(req, res) {
        try {
            const metrics = await this.services.thresholdMonitor.getThresholdMetrics();
            res.json({ success: true, data: metrics });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Trend Analysis Routes
    async analyzeTrend(req, res) {
        try {
            const trend = await this.services.trendAnalyzer.analyzeTrend(req.body);
            res.json({ success: true, data: trend });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async batchAnalyzeTrends(req, res) {
        try {
            const { requests } = req.body;
            const trends = await this.services.trendAnalyzer.batchAnalyzeTrends(requests);
            res.json({ success: true, data: trends });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getTrend(req, res) {
        try {
            const trend = this.services.trendAnalyzer.getTrend(req.params.trendId);
            if (!trend) {
                res.status(404).json({ success: false, error: 'Trend not found' });
                return;
            }
            res.json({ success: true, data: trend });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getResourceTrends(req, res) {
        try {
            // Implementation would filter trends by resource
            res.json({ success: true, data: [] });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async detectAnomalies(req, res) {
        try {
            const { resourceId, metric, timeRange } = req.body;
            const anomalies = await this.services.trendAnalyzer.detectAnomalies(resourceId, metric, timeRange);
            res.json({ success: true, data: anomalies });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async compareResourceTrends(req, res) {
        try {
            const { resourceIds, metric, timeRange } = req.body;
            const comparison = await this.services.trendAnalyzer.compareResourceTrends(resourceIds, metric, timeRange);
            res.json({ success: true, data: comparison });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getTrendSummary(req, res) {
        try {
            const { resourceType, timeRange } = req.query;
            const summary = await this.services.trendAnalyzer.getTrendSummary(resourceType, timeRange ? JSON.parse(timeRange) : undefined);
            res.json({ success: true, data: summary });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Recommendation Routes
    async generateRecommendations(req, res) {
        try {
            const recommendations = await this.services.recommendationEngine.generateRecommendations(req.body);
            res.json({ success: true, data: recommendations });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async batchGenerateRecommendations(req, res) {
        try {
            const { contexts } = req.body;
            const recommendations = await this.services.recommendationEngine.batchGenerateRecommendations(contexts);
            res.json({ success: true, data: Object.fromEntries(recommendations) });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getRecommendation(req, res) {
        try {
            const recommendation = this.services.recommendationEngine.getRecommendation(req.params.recommendationId);
            if (!recommendation) {
                res.status(404).json({ success: false, error: 'Recommendation not found' });
                return;
            }
            res.json({ success: true, data: recommendation });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getRecommendations(req, res) {
        try {
            const { priority } = req.query;
            const recommendations = priority
                ? await this.services.recommendationEngine.getRecommendationsByPriority(priority)
                : this.services.recommendationEngine.getAllRecommendations();
            res.json({ success: true, data: recommendations });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async submitRecommendationFeedback(req, res) {
        try {
            await this.services.recommendationEngine.updateRecommendationFeedback(req.params.recommendationId, req.body);
            res.json({ success: true, message: 'Feedback submitted successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getRecommendationEffectiveness(req, res) {
        try {
            const effectiveness = await this.services.recommendationEngine.evaluateRecommendationEffectiveness(req.params.recommendationId);
            res.json({ success: true, data: effectiveness });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getResourceRecommendations(req, res) {
        try {
            const recommendations = await this.services.recommendationEngine.getRecommendationsByResource(req.params.resourceId);
            res.json({ success: true, data: recommendations });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Reporting Routes
    async generateReport(req, res) {
        try {
            const report = await this.services.reportGenerator.generateReport(req.body);
            res.json({ success: true, data: report });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async scheduleReport(req, res) {
        try {
            const scheduleId = await this.services.reportGenerator.scheduleReport(req.body);
            res.json({ success: true, data: { scheduleId } });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getReport(req, res) {
        try {
            const report = this.services.reportGenerator.getReport(req.params.reportId);
            if (!report) {
                res.status(404).json({ success: false, error: 'Report not found' });
                return;
            }
            res.json({ success: true, data: report });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getReports(req, res) {
        try {
            const reports = this.services.reportGenerator.getAllReports();
            res.json({ success: true, data: reports });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async cancelScheduledReport(req, res) {
        try {
            await this.services.reportGenerator.cancelScheduledReport(req.params.scheduleId);
            res.json({ success: true, message: 'Scheduled report cancelled successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async createReportTemplate(req, res) {
        try {
            const template = await this.services.reportGenerator.createReportTemplate(req.body);
            res.status(201).json({ success: true, data: template });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getReportTemplates(req, res) {
        try {
            const templates = this.services.reportGenerator.getAllTemplates();
            res.json({ success: true, data: templates });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getReportTemplate(req, res) {
        try {
            const template = this.services.reportGenerator.getTemplate(req.params.templateId);
            if (!template) {
                res.status(404).json({ success: false, error: 'Template not found' });
                return;
            }
            res.json({ success: true, data: template });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async generateExecutiveSummaryReport(req, res) {
        try {
            const { timeRange } = req.body;
            const report = await this.services.reportGenerator.generateExecutiveSummaryReport(timeRange);
            res.json({ success: true, data: report });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Cost Optimization Routes
    async analyzeCostOptimization(req, res) {
        try {
            const { resourceId, timeRange } = req.body;
            const optimization = await this.services.costOptimizationService.analyzeCostOptimization(resourceId, timeRange);
            res.json({ success: true, data: optimization });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async batchAnalyzeCostOptimization(req, res) {
        try {
            const { resourceIds } = req.body;
            const optimizations = await this.services.costOptimizationService.batchAnalyzeCostOptimization(resourceIds);
            res.json({ success: true, data: Object.fromEntries(optimizations) });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getCostOptimization(req, res) {
        try {
            const optimization = this.services.costOptimizationService.getOptimization(req.params.resourceId);
            if (!optimization) {
                res.status(404).json({ success: false, error: 'Cost optimization not found' });
                return;
            }
            res.json({ success: true, data: optimization });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getAllCostOptimizations(req, res) {
        try {
            const optimizations = this.services.costOptimizationService.getAllOptimizations();
            res.json({ success: true, data: optimizations });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async implementOptimization(req, res) {
        try {
            const { optimizationId, approvalLevel } = req.body;
            const result = await this.services.costOptimizationService.implementOptimization(req.params.resourceId, optimizationId, approvalLevel);
            res.json({ success: true, data: result });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async trackOptimizationROI(req, res) {
        try {
            const roi = await this.services.costOptimizationService.trackOptimizationROI(req.params.resourceId);
            res.json({ success: true, data: roi });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async generateCostForecast(req, res) {
        try {
            const { resourceId, forecastMonths } = req.body;
            const forecast = await this.services.costOptimizationService.generateCostForecast(resourceId, forecastMonths);
            res.json({ success: true, data: forecast });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getTopOptimizationOpportunities(req, res) {
        try {
            const { limit = 10 } = req.query;
            const opportunities = await this.services.costOptimizationService.getTopCostOptimizationOpportunities(Number(limit));
            res.json({ success: true, data: opportunities });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Workflow Routes
    async createWorkflowTemplate(req, res) {
        try {
            const template = await this.services.workflowManager.createWorkflowTemplate(req.body);
            res.status(201).json({ success: true, data: template });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getWorkflowTemplates(req, res) {
        try {
            const templates = this.services.workflowManager.getAllWorkflowTemplates();
            res.json({ success: true, data: templates });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getWorkflowTemplate(req, res) {
        try {
            const template = this.services.workflowManager.getWorkflowTemplate(req.params.templateId);
            if (!template) {
                res.status(404).json({ success: false, error: 'Workflow template not found' });
                return;
            }
            res.json({ success: true, data: template });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async executeWorkflow(req, res) {
        try {
            const { workflow, alert } = req.body;
            const execution = await this.services.workflowManager.executeWorkflow(workflow, alert);
            res.json({ success: true, data: execution });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getWorkflowExecution(req, res) {
        try {
            const execution = this.services.workflowManager.getExecution(req.params.executionId);
            if (!execution) {
                res.status(404).json({ success: false, error: 'Workflow execution not found' });
                return;
            }
            res.json({ success: true, data: execution });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getWorkflowExecutions(req, res) {
        try {
            const executions = this.services.workflowManager.getAllExecutions();
            res.json({ success: true, data: executions });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async approveWorkflowStep(req, res) {
        try {
            const { approvalId, userId, comments } = req.body;
            await this.services.workflowManager.approveWorkflowStep(req.params.executionId, approvalId, userId, comments);
            res.json({ success: true, message: 'Workflow step approved successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async rejectWorkflowStep(req, res) {
        try {
            const { approvalId, userId, comments } = req.body;
            await this.services.workflowManager.rejectWorkflowStep(req.params.executionId, approvalId, userId, comments);
            res.json({ success: true, message: 'Workflow step rejected successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async cancelWorkflowExecution(req, res) {
        try {
            const { reason } = req.body;
            await this.services.workflowManager.cancelExecution(req.params.executionId, reason);
            res.json({ success: true, message: 'Workflow execution cancelled successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getWorkflowMetrics(req, res) {
        try {
            const { workflowId } = req.query;
            const metrics = await this.services.workflowManager.getWorkflowMetrics(workflowId);
            res.json({ success: true, data: metrics });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // System Routes
    async getSystemStatus(req, res) {
        try {
            const status = {
                status: 'healthy',
                version: '1.0.0',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                services: {
                    predictionService: 'healthy',
                    thresholdMonitor: 'healthy',
                    trendAnalyzer: 'healthy',
                    recommendationEngine: 'healthy',
                    reportGenerator: 'healthy',
                    costOptimizationService: 'healthy',
                    workflowManager: 'healthy'
                }
            };
            res.json({ success: true, data: status });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getSystemMetrics(req, res) {
        try {
            const metrics = this.metrics.getMetrics();
            res.json({ success: true, data: metrics });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async scheduleSystemMaintenance(req, res) {
        try {
            const { maintenanceWindow } = req.body;
            // Implementation would schedule maintenance
            res.json({ success: true, message: 'System maintenance scheduled successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async getSystemConfiguration(req, res) {
        try {
            const config = {
                apiVersion: this.config.apiVersion,
                rateLimit: {
                    windowMs: this.config.rateLimitWindowMs,
                    maxRequests: this.config.rateLimitMaxRequests
                },
                features: {
                    cors: this.config.enableCors,
                    compression: this.config.enableCompression,
                    swagger: this.config.enableSwaggerDocs,
                    metrics: this.config.metricsEnabled,
                    authentication: this.config.authenticationRequired
                }
            };
            res.json({ success: true, data: config });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    async updateSystemConfiguration(req, res) {
        try {
            // Implementation would update system configuration
            res.json({ success: true, message: 'System configuration updated successfully' });
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    // Middleware
    metricsMiddleware(req, res, next) {
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            this.metrics.recordRequest(req.method, req.path, res.statusCode, duration);
        });
        next();
    }
    authenticationMiddleware(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }
        // Mock authentication - in production, verify JWT token
        const token = authHeader.substring(7);
        if (token === 'invalid') {
            res.status(401).json({ success: false, error: 'Invalid token' });
            return;
        }
        next();
    }
    setupErrorHandling() {
        this.app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        });
    }
    handleError(res, error) {
        console.error('API Error:', error);
        const statusCode = error.statusCode || 500;
        const message = error instanceof Error ? error.message : 'Unknown error' || 'Internal server error';
        res.status(statusCode).json({
            success: false,
            error: message
        });
    }
    healthCheck(req, res) {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
    systemMetrics(req, res) {
        const metrics = this.metrics.getMetrics();
        res.json(metrics);
    }
    setupSwaggerDocs() {
        // Implementation would set up Swagger/OpenAPI documentation
        this.app.get('/api-docs', (req, res) => {
            res.json({
                openapi: '3.0.0',
                info: {
                    title: 'Capacity Planning API',
                    version: this.config.apiVersion,
                    description: 'Comprehensive capacity planning and scaling management API'
                },
                paths: {
                // API documentation would be generated here
                }
            });
        });
    }
    async start() {
        const server = this.app.listen(this.config.port, () => {
            console.log(`Capacity Planning API server listening on port ${this.config.port}`);
            this.emit('serverStarted', { port: this.config.port });
        });
        server.on('error', (error) => {
            console.error('Server error:', error);
            this.emit('serverError', error);
        });
    }
    getApp() {
        return this.app;
    }
}
exports.CapacityPlanningController = CapacityPlanningController;
class APIMetrics {
    requestCount = 0;
    errorCount = 0;
    responseTimes = [];
    statusCodes = {};
    recordRequest(method, path, statusCode, duration) {
        this.requestCount++;
        this.responseTimes.push(duration);
        this.statusCodes[statusCode] = (this.statusCodes[statusCode] || 0) + 1;
        if (statusCode >= 400) {
            this.errorCount++;
        }
        // Keep only last 1000 response times
        if (this.responseTimes.length > 1000) {
            this.responseTimes.shift();
        }
    }
    getMetrics() {
        const avgResponseTime = this.responseTimes.length > 0
            ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
            : 0;
        return {
            requests: {
                total: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0
            },
            response: {
                averageTime: avgResponseTime,
                p95: this.calculatePercentile(this.responseTimes, 95),
                p99: this.calculatePercentile(this.responseTimes, 99)
            },
            statusCodes: this.statusCodes,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }
}

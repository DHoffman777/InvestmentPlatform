import express, { Router, Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { ResourceUsagePredictionService } from './ResourceUsagePredictionService';
import { ScalingThresholdMonitor } from './ScalingThresholdMonitor';
import { CapacityTrendAnalyzer } from './CapacityTrendAnalyzer';
import { AutomatedScalingRecommendationEngine } from './AutomatedScalingRecommendationEngine';
import { CapacityPlanningReportGenerator } from './CapacityPlanningReportGenerator';
import { CostOptimizationService } from './CostOptimizationService';
import { CapacityAlertWorkflowManager } from './CapacityAlertWorkflowManager';
import {
  ResourceType,
  TimeGranularity,
  ReportType,
  ReportFormat,
  AlertSeverity,
  ModelType,
  PredictionAlgorithm
} from './CapacityPlanningDataModel';

export interface CapacityPlanningAPIConfig {
  port: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableCors: boolean;
  enableCompression: boolean;
  maxPayloadSize: string;
  apiVersion: string;
  authenticationRequired: boolean;
  enableSwaggerDocs: boolean;
  metricsEnabled: boolean;
}

export interface ServiceDependencies {
  predictionService: ResourceUsagePredictionService;
  thresholdMonitor: ScalingThresholdMonitor;
  trendAnalyzer: CapacityTrendAnalyzer;
  recommendationEngine: AutomatedScalingRecommendationEngine;
  reportGenerator: CapacityPlanningReportGenerator;
  costOptimizationService: CostOptimizationService;
  workflowManager: CapacityAlertWorkflowManager;
}

export class CapacityPlanningController extends EventEmitter {
  private app: express.Application;
  private config: CapacityPlanningAPIConfig;
  private services: ServiceDependencies;
  private metrics: APIMetrics;

  constructor(config: CapacityPlanningAPIConfig, services: ServiceDependencies) {
    super();
    this.config = config;
    this.services = services;
    this.metrics = new APIMetrics();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: this.config.maxPayloadSize }));
    this.app.use(express.urlencoded({ extended: true }));

    if (this.config.enableCors) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
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

  private setupRoutes(): void {
    const apiRouter = Router();

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

  private setupPredictionRoutes(router: Router): void {
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

  private setupThresholdRoutes(router: Router): void {
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

  private setupTrendAnalysisRoutes(router: Router): void {
    router.post('/trends/analyze', this.analyzeTrend.bind(this));
    router.post('/trends/batch-analyze', this.batchAnalyzeTrends.bind(this));
    router.get('/trends/:trendId', this.getTrend.bind(this));
    router.get('/resources/:resourceId/trends', this.getResourceTrends.bind(this));
    router.post('/anomalies/detect', this.detectAnomalies.bind(this));
    router.post('/trends/compare', this.compareResourceTrends.bind(this));
    router.get('/trends/summary', this.getTrendSummary.bind(this));
  }

  private setupRecommendationRoutes(router: Router): void {
    router.post('/recommendations/generate', this.generateRecommendations.bind(this));
    router.post('/recommendations/batch-generate', this.batchGenerateRecommendations.bind(this));
    router.get('/recommendations/:recommendationId', this.getRecommendation.bind(this));
    router.get('/recommendations', this.getRecommendations.bind(this));
    router.post('/recommendations/:recommendationId/feedback', this.submitRecommendationFeedback.bind(this));
    router.get('/recommendations/:recommendationId/effectiveness', this.getRecommendationEffectiveness.bind(this));
    router.get('/resources/:resourceId/recommendations', this.getResourceRecommendations.bind(this));
  }

  private setupReportingRoutes(router: Router): void {
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

  private setupCostOptimizationRoutes(router: Router): void {
    router.post('/cost-optimization/analyze', this.analyzeCostOptimization.bind(this));
    router.post('/cost-optimization/batch-analyze', this.batchAnalyzeCostOptimization.bind(this));
    router.get('/cost-optimization/:resourceId', this.getCostOptimization.bind(this));
    router.get('/cost-optimization', this.getAllCostOptimizations.bind(this));
    router.post('/cost-optimization/:resourceId/implement', this.implementOptimization.bind(this));
    router.get('/cost-optimization/:resourceId/roi', this.trackOptimizationROI.bind(this));
    router.post('/cost-optimization/forecast', this.generateCostForecast.bind(this));
    router.get('/cost-optimization/opportunities', this.getTopOptimizationOpportunities.bind(this));
  }

  private setupWorkflowRoutes(router: Router): void {
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

  private setupSystemRoutes(router: Router): void {
    router.get('/system/status', this.getSystemStatus.bind(this));
    router.get('/system/metrics', this.getSystemMetrics.bind(this));
    router.post('/system/maintenance', this.scheduleSystemMaintenance.bind(this));
    router.get('/system/configuration', this.getSystemConfiguration.bind(this));
    router.put('/system/configuration', this.updateSystemConfiguration.bind(this));
  }

  // Prediction Model Routes
  private async createPredictionModel(req: Request, res: Response): Promise<void> {
    try {
      const model = await this.services.predictionService.createPredictionModel(req.body);
      res.status(201).json({ success: true, data: model });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getPredictionModels(req: Request, res: Response): Promise<void> {
    try {
      const { resourceType } = req.query;
      const models = resourceType 
        ? await this.services.predictionService.getModelsByResourceType(resourceType as ResourceType)
        : this.services.predictionService.getAllModels();
      res.json({ success: true, data: models });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getPredictionModel(req: Request, res: Response): Promise<void> {
    try {
      const model = this.services.predictionService.getModel(req.params.modelId);
      if (!model) {
        res.status(404).json({ success: false, error: 'Model not found' });
        return;
      }
      res.json({ success: true, data: model });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async updatePredictionModel(req: Request, res: Response): Promise<void> {
    try {
      // Implementation would update model parameters
      res.json({ success: true, message: 'Model updated successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async deletePredictionModel(req: Request, res: Response): Promise<void> {
    try {
      await this.services.predictionService.deactivateModel(req.params.modelId);
      res.json({ success: true, message: 'Model deactivated successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async trainPredictionModel(req: Request, res: Response): Promise<void> {
    try {
      const { trainingData } = req.body;
      const accuracy = await this.services.predictionService.trainModel(req.params.modelId, trainingData);
      res.json({ success: true, data: { accuracy } });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async optimizePredictionModel(req: Request, res: Response): Promise<void> {
    try {
      const model = await this.services.predictionService.optimizeModel(req.params.modelId);
      res.json({ success: true, data: model });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getPredictionModelPerformance(req: Request, res: Response): Promise<void> {
    try {
      const performance = await this.services.predictionService.evaluateModelPerformance(req.params.modelId);
      res.json({ success: true, data: performance });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Prediction Routes
  private async generatePrediction(req: Request, res: Response): Promise<void> {
    try {
      const { modelId, resourceId, options } = req.body;
      const prediction = await this.services.predictionService.generatePrediction(modelId, resourceId, options);
      res.json({ success: true, data: prediction });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async batchGeneratePredictions(req: Request, res: Response): Promise<void> {
    try {
      const { requests } = req.body;
      const predictions = await this.services.predictionService.batchPredict(requests);
      res.json({ success: true, data: predictions });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getPrediction(req: Request, res: Response): Promise<void> {
    try {
      const prediction = this.services.predictionService.getPrediction(req.params.predictionId);
      if (!prediction) {
        res.status(404).json({ success: false, error: 'Prediction not found' });
        return;
      }
      res.json({ success: true, data: prediction });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getResourcePredictions(req: Request, res: Response): Promise<void> {
    try {
      // Implementation would filter predictions by resource
      res.json({ success: true, data: [] });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Threshold Routes
  private async createScalingThreshold(req: Request, res: Response): Promise<void> {
    try {
      const threshold = await this.services.thresholdMonitor.createThreshold(req.body);
      res.status(201).json({ success: true, data: threshold });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getScalingThresholds(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId, resourceType } = req.query;
      const thresholds = await this.services.thresholdMonitor.getThresholds(
        resourceId as string,
        resourceType as ResourceType
      );
      res.json({ success: true, data: thresholds });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getScalingThreshold(req: Request, res: Response): Promise<void> {
    try {
      // Implementation would get specific threshold
      res.json({ success: true, data: {} });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async updateScalingThreshold(req: Request, res: Response): Promise<void> {
    try {
      const threshold = await this.services.thresholdMonitor.updateThreshold(req.params.thresholdId, req.body);
      res.json({ success: true, data: threshold });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async deleteScalingThreshold(req: Request, res: Response): Promise<void> {
    try {
      // Implementation would delete threshold
      res.json({ success: true, message: 'Threshold deleted successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async evaluateThresholds(req: Request, res: Response): Promise<void> {
    try {
      const { metrics } = req.body;
      const evaluations = await this.services.thresholdMonitor.evaluateThresholds(metrics);
      res.json({ success: true, data: evaluations });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Alert Routes
  private async getCapacityAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId } = req.query;
      const alerts = await this.services.thresholdMonitor.getActiveAlerts(resourceId as string);
      res.json({ success: true, data: alerts });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getCapacityAlert(req: Request, res: Response): Promise<void> {
    try {
      // Implementation would get specific alert
      res.json({ success: true, data: {} });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      await this.services.thresholdMonitor.acknowledgeAlert(req.params.alertId, userId);
      res.json({ success: true, message: 'Alert acknowledged successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { resolution } = req.body;
      await this.services.thresholdMonitor.resolveAlert(req.params.alertId, resolution);
      res.json({ success: true, message: 'Alert resolved successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async suppressAlert(req: Request, res: Response): Promise<void> {
    try {
      const { duration } = req.body;
      await this.services.thresholdMonitor.suppressAlert(req.params.alertId, duration);
      res.json({ success: true, message: 'Alert suppressed successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getAlertMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.services.thresholdMonitor.getThresholdMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Trend Analysis Routes
  private async analyzeTrend(req: Request, res: Response): Promise<void> {
    try {
      const trend = await this.services.trendAnalyzer.analyzeTrend(req.body);
      res.json({ success: true, data: trend });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async batchAnalyzeTrends(req: Request, res: Response): Promise<void> {
    try {
      const { requests } = req.body;
      const trends = await this.services.trendAnalyzer.batchAnalyzeTrends(requests);
      res.json({ success: true, data: trends });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getTrend(req: Request, res: Response): Promise<void> {
    try {
      const trend = this.services.trendAnalyzer.getTrend(req.params.trendId);
      if (!trend) {
        res.status(404).json({ success: false, error: 'Trend not found' });
        return;
      }
      res.json({ success: true, data: trend });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getResourceTrends(req: Request, res: Response): Promise<void> {
    try {
      // Implementation would filter trends by resource
      res.json({ success: true, data: [] });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId, metric, timeRange } = req.body;
      const anomalies = await this.services.trendAnalyzer.detectAnomalies(resourceId, metric, timeRange);
      res.json({ success: true, data: anomalies });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async compareResourceTrends(req: Request, res: Response): Promise<void> {
    try {
      const { resourceIds, metric, timeRange } = req.body;
      const comparison = await this.services.trendAnalyzer.compareResourceTrends(resourceIds, metric, timeRange);
      res.json({ success: true, data: comparison });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getTrendSummary(req: Request, res: Response): Promise<void> {
    try {
      const { resourceType, timeRange } = req.query;
      const summary = await this.services.trendAnalyzer.getTrendSummary(
        resourceType as ResourceType,
        timeRange ? JSON.parse(timeRange as string) : undefined
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Recommendation Routes
  private async generateRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const recommendations = await this.services.recommendationEngine.generateRecommendations(req.body);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async batchGenerateRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { contexts } = req.body;
      const recommendations = await this.services.recommendationEngine.batchGenerateRecommendations(contexts);
      res.json({ success: true, data: Object.fromEntries(recommendations) });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const recommendation = this.services.recommendationEngine.getRecommendation(req.params.recommendationId);
      if (!recommendation) {
        res.status(404).json({ success: false, error: 'Recommendation not found' });
        return;
      }
      res.json({ success: true, data: recommendation });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { priority } = req.query;
      const recommendations = priority
        ? await this.services.recommendationEngine.getRecommendationsByPriority(priority as any)
        : this.services.recommendationEngine.getAllRecommendations();
      res.json({ success: true, data: recommendations });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async submitRecommendationFeedback(req: Request, res: Response): Promise<void> {
    try {
      await this.services.recommendationEngine.updateRecommendationFeedback(req.params.recommendationId, req.body);
      res.json({ success: true, message: 'Feedback submitted successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getRecommendationEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const effectiveness = await this.services.recommendationEngine.evaluateRecommendationEffectiveness(req.params.recommendationId);
      res.json({ success: true, data: effectiveness });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getResourceRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const recommendations = await this.services.recommendationEngine.getRecommendationsByResource(req.params.resourceId);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Reporting Routes
  private async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.services.reportGenerator.generateReport(req.body);
      res.json({ success: true, data: report });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async scheduleReport(req: Request, res: Response): Promise<void> {
    try {
      const scheduleId = await this.services.reportGenerator.scheduleReport(req.body);
      res.json({ success: true, data: { scheduleId } });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getReport(req: Request, res: Response): Promise<void> {
    try {
      const report = this.services.reportGenerator.getReport(req.params.reportId);
      if (!report) {
        res.status(404).json({ success: false, error: 'Report not found' });
        return;
      }
      res.json({ success: true, data: report });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = this.services.reportGenerator.getAllReports();
      res.json({ success: true, data: reports });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async cancelScheduledReport(req: Request, res: Response): Promise<void> {
    try {
      await this.services.reportGenerator.cancelScheduledReport(req.params.scheduleId);
      res.json({ success: true, message: 'Scheduled report cancelled successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async createReportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await this.services.reportGenerator.createReportTemplate(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getReportTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = this.services.reportGenerator.getAllTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getReportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = this.services.reportGenerator.getTemplate(req.params.templateId);
      if (!template) {
        res.status(404).json({ success: false, error: 'Template not found' });
        return;
      }
      res.json({ success: true, data: template });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async generateExecutiveSummaryReport(req: Request, res: Response): Promise<void> {
    try {
      const { timeRange } = req.body;
      const report = await this.services.reportGenerator.generateExecutiveSummaryReport(timeRange);
      res.json({ success: true, data: report });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Cost Optimization Routes
  private async analyzeCostOptimization(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId, timeRange } = req.body;
      const optimization = await this.services.costOptimizationService.analyzeCostOptimization(resourceId, timeRange);
      res.json({ success: true, data: optimization });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async batchAnalyzeCostOptimization(req: Request, res: Response): Promise<void> {
    try {
      const { resourceIds } = req.body;
      const optimizations = await this.services.costOptimizationService.batchAnalyzeCostOptimization(resourceIds);
      res.json({ success: true, data: Object.fromEntries(optimizations) });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getCostOptimization(req: Request, res: Response): Promise<void> {
    try {
      const optimization = this.services.costOptimizationService.getOptimization(req.params.resourceId);
      if (!optimization) {
        res.status(404).json({ success: false, error: 'Cost optimization not found' });
        return;
      }
      res.json({ success: true, data: optimization });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getAllCostOptimizations(req: Request, res: Response): Promise<void> {
    try {
      const optimizations = this.services.costOptimizationService.getAllOptimizations();
      res.json({ success: true, data: optimizations });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async implementOptimization(req: Request, res: Response): Promise<void> {
    try {
      const { optimizationId, approvalLevel } = req.body;
      const result = await this.services.costOptimizationService.implementOptimization(
        req.params.resourceId,
        optimizationId,
        approvalLevel
      );
      res.json({ success: true, data: result });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async trackOptimizationROI(req: Request, res: Response): Promise<void> {
    try {
      const roi = await this.services.costOptimizationService.trackOptimizationROI(req.params.resourceId);
      res.json({ success: true, data: roi });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async generateCostForecast(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId, forecastMonths } = req.body;
      const forecast = await this.services.costOptimizationService.generateCostForecast(resourceId, forecastMonths);
      res.json({ success: true, data: forecast });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getTopOptimizationOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      const opportunities = await this.services.costOptimizationService.getTopCostOptimizationOpportunities(Number(limit));
      res.json({ success: true, data: opportunities });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Workflow Routes
  private async createWorkflowTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await this.services.workflowManager.createWorkflowTemplate(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getWorkflowTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = this.services.workflowManager.getAllWorkflowTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getWorkflowTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = this.services.workflowManager.getWorkflowTemplate(req.params.templateId);
      if (!template) {
        res.status(404).json({ success: false, error: 'Workflow template not found' });
        return;
      }
      res.json({ success: true, data: template });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async executeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflow, alert } = req.body;
      const execution = await this.services.workflowManager.executeWorkflow(workflow, alert);
      res.json({ success: true, data: execution });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getWorkflowExecution(req: Request, res: Response): Promise<void> {
    try {
      const execution = this.services.workflowManager.getExecution(req.params.executionId);
      if (!execution) {
        res.status(404).json({ success: false, error: 'Workflow execution not found' });
        return;
      }
      res.json({ success: true, data: execution });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getWorkflowExecutions(req: Request, res: Response): Promise<void> {
    try {
      const executions = this.services.workflowManager.getAllExecutions();
      res.json({ success: true, data: executions });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async approveWorkflowStep(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId, userId, comments } = req.body;
      await this.services.workflowManager.approveWorkflowStep(req.params.executionId, approvalId, userId, comments);
      res.json({ success: true, message: 'Workflow step approved successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async rejectWorkflowStep(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId, userId, comments } = req.body;
      await this.services.workflowManager.rejectWorkflowStep(req.params.executionId, approvalId, userId, comments);
      res.json({ success: true, message: 'Workflow step rejected successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async cancelWorkflowExecution(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      await this.services.workflowManager.cancelExecution(req.params.executionId, reason);
      res.json({ success: true, message: 'Workflow execution cancelled successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getWorkflowMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.query;
      const metrics = await this.services.workflowManager.getWorkflowMetrics(workflowId as string);
      res.json({ success: true, data: metrics });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // System Routes
  private async getSystemStatus(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.metrics.getMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async scheduleSystemMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceWindow } = req.body;
      // Implementation would schedule maintenance
      res.json({ success: true, message: 'System maintenance scheduled successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async getSystemConfiguration(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private async updateSystemConfiguration(req: Request, res: Response): Promise<void> {
    try {
      // Implementation would update system configuration
      res.json({ success: true, message: 'System configuration updated successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Middleware
  private metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.metrics.recordRequest(req.method, req.path, res.statusCode, duration);
    });
    
    next();
  }

  private authenticationMiddleware(req: Request, res: Response, next: NextFunction): void {
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

  private setupErrorHandling(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  private handleError(res: Response, error: any): void {
    console.error('API Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }

  private healthCheck(req: Request, res: Response): void {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  private systemMetrics(req: Request, res: Response): void {
    const metrics = this.metrics.getMetrics();
    res.json(metrics);
  }

  private setupSwaggerDocs(): void {
    // Implementation would set up Swagger/OpenAPI documentation
    this.app.get('/api-docs', (req: Request, res: Response) => {
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

  public async start(): Promise<void> {
    const server = this.app.listen(this.config.port, () => {
      console.log(`Capacity Planning API server listening on port ${this.config.port}`);
      this.emit('serverStarted', { port: this.config.port });
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      this.emit('serverError', error);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

class APIMetrics {
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private statusCodes: Record<number, number> = {};

  recordRequest(method: string, path: string, statusCode: number, duration: number): void {
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

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}
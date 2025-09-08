import { Router, Request, Response } from 'express';
import { DataVisualizationService } from '../services/analytics/DataVisualizationService';
import { DrillDownService } from '../services/analytics/DrillDownService';
import { DashboardBuilderService } from '../services/analytics/DashboardBuilderService';
import { RealTimeAnalyticsService } from '../services/analytics/RealTimeAnalyticsService';
import { PredictiveModelingService } from '../services/analytics/PredictiveModelingService';
import { MachineLearningInsightsService } from '../services/analytics/MachineLearningInsightsService';
import { AnomalyDetectionService } from '../services/analytics/AnomalyDetectionService';
import { BusinessIntelligenceService } from '../services/analytics/BusinessIntelligenceService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
const { body, param, query } = require('express-validator');
import { AnalyticsMetricType, VisualizationType, DrillDownLevel } from '../models/analytics/Analytics';

const router = Router();

// Initialize services
const dataVizService = new DataVisualizationService();
const drillDownService = new DrillDownService();
const dashboardService = new DashboardBuilderService();
const realTimeService = new RealTimeAnalyticsService();
const predictiveService = new PredictiveModelingService();
const mlInsightsService = new MachineLearningInsightsService();
const anomalyService = new AnomalyDetectionService();
const biService = new BusinessIntelligenceService();

// Apply authentication to all routes
router.use(authenticateToken as any);

// ===== DATA VISUALIZATION ROUTES =====

/**
 * @route POST /api/analytics/visualizations
 * @desc Create a new data visualization
 */
router.post('/visualizations', [
  body('metricType').isIn(Object.values(AnalyticsMetricType)).withMessage('Invalid metric type'),
  body('visualizationType').isIn(Object.values(VisualizationType)).withMessage('Invalid visualization type'),
  body('dateRange.startDate').isISO8601().withMessage('Invalid start date'),
  body('dateRange.endDate').isISO8601().withMessage('Invalid end date'),
  body('portfolioIds').optional().isArray().withMessage('Portfolio IDs must be an array'),
  body('clientIds').optional().isArray().withMessage('Client IDs must be an array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const request = {
      tenantId: req.user!.tenantId,
      metricType: req.body.metricType,
      visualizationType: req.body.visualizationType,
      dateRange: {
        startDate: new Date(req.body.dateRange.startDate),
        endDate: new Date(req.body.dateRange.endDate)
      },
      portfolioIds: req.body.portfolioIds,
      clientIds: req.body.clientIds,
      filters: req.body.filters,
      aggregationPeriod: req.body.aggregationPeriod,
      drillDownLevel: req.body.drillDownLevel
    };

    const visualization = await dataVizService.createVisualization(request);
    res.status(201).json({
      success: true,
      data: visualization
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route PUT /api/analytics/visualizations/:id
 * @desc Update an existing visualization
 */
router.put('/visualizations/:id', [
  param('id').isUUID().withMessage('Invalid visualization ID'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const visualization = await dataVizService.updateVisualization(req.params.id, req.body);
    res.json({
      success: true,
      data: visualization
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/visualizations/:id/refresh
 * @desc Refresh visualization data
 */
router.post('/visualizations/:id/refresh', [
  param('id').isUUID().withMessage('Invalid visualization ID'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const visualization = await dataVizService.refreshVisualizationData(req.params.id, req.user!.tenantId);
    res.json({
      success: true,
      data: visualization
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== DRILL-DOWN ROUTES =====

/**
 * @route POST /api/analytics/drill-down
 * @desc Perform drill-down analysis on a data point
 */
router.post('/drill-down', [
  body('visualizationId').isUUID().withMessage('Invalid visualization ID'),
  body('level').isIn(Object.values(DrillDownLevel)).withMessage('Invalid drill-down level'),
  body('dataPointId').notEmpty().withMessage('Data point ID is required'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const context = {
      tenantId: req.user!.tenantId,
      userId: req.user!.userId
    };

    const drillDownResponse = await drillDownService.performDrillDown(req.body, context);
    res.json({
      success: true,
      data: drillDownResponse
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/drill-down/breadcrumb/:visualizationId
 * @desc Get breadcrumb navigation for drill-down
 */
router.get('/drill-down/breadcrumb/:visualizationId', [
  param('visualizationId').isUUID().withMessage('Invalid visualization ID'),
  query('level').isIn(Object.values(DrillDownLevel)).withMessage('Invalid drill-down level'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const breadcrumb = await drillDownService.getBreadcrumbNavigation(
      req.params.visualizationId,
      req.query.level as DrillDownLevel,
      req.user!.tenantId
    );
    res.json({
      success: true,
      data: breadcrumb
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== DASHBOARD ROUTES =====

/**
 * @route POST /api/analytics/dashboards
 * @desc Create a new custom dashboard
 */
router.post('/dashboards', [
  body('name').notEmpty().withMessage('Dashboard name is required'),
  body('description').optional().isString(),
  body('templateId').optional().isUUID().withMessage('Invalid template ID'),
  body('layout').optional().isObject(),
  validateRequest
], async (req: any, res: any) => {
  try {
    const request = {
      tenantId: req.user!.tenantId,
      createdBy: req.user!.userId,
      name: req.body.name,
      description: req.body.description,
      templateId: req.body.templateId,
      layout: req.body.layout,
      filters: req.body.filters,
      permissions: req.body.permissions,
      isDefault: req.body.isDefault || false
    };

    const dashboard = await dashboardService.createDashboard(request);
    res.status(201).json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/dashboards
 * @desc Get user's dashboards
 */
router.get('/dashboards', async (req: any, res: any) => {
  try {
    const dashboards = await dashboardService.getUserDashboards(
      req.user!.tenantId,
      req.user!.userId
    );
    res.json({
      success: true,
      data: dashboards
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/dashboards/templates
 * @desc Get available dashboard templates
 */
router.get('/dashboards/templates', async (req: any, res: any) => {
  try {
    const templates = await dashboardService.getAvailableTemplates(req.user!.tenantId);
    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route PUT /api/analytics/dashboards/:id
 * @desc Update dashboard configuration
 */
router.put('/dashboards/:id', [
  param('id').isUUID().withMessage('Invalid dashboard ID'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const dashboard = await dashboardService.updateDashboard(
      req.params.id,
      req.body,
      req.user!.userId
    );
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/dashboards/:id/share
 * @desc Share dashboard with other users
 */
router.post('/dashboards/:id/share', [
  param('id').isUUID().withMessage('Invalid dashboard ID'),
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('permissions').isObject().withMessage('Permissions must be an object'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const result = await dashboardService.shareDashboard(
      req.params.id,
      req.body.userIds,
      req.body.permissions,
      req.user!.userId
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== REAL-TIME ANALYTICS ROUTES =====

/**
 * @route POST /api/analytics/real-time/stream
 * @desc Start real-time analytics stream
 */
router.post('/real-time/stream', [
  body('connectionType').isIn(['websocket', 'sse', 'webhook']).withMessage('Invalid connection type'),
  body('dashboardId').optional().isUUID().withMessage('Invalid dashboard ID'),
  body('visualizationIds').optional().isArray().withMessage('Visualization IDs must be an array'),
  body('metricTypes').optional().isArray().withMessage('Metric types must be an array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const connection = await realTimeService.startRealTimeStream(
      req.user!.tenantId,
      req.user!.userId,
      req.body
    );
    res.status(201).json({
      success: true,
      data: connection
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route DELETE /api/analytics/real-time/stream/:connectionId
 * @desc Stop real-time analytics stream
 */
router.delete('/real-time/stream/:connectionId', [
  param('connectionId').isUUID().withMessage('Invalid connection ID'),
  validateRequest
], async (req: any, res: any) => {
  try {
    await realTimeService.stopRealTimeStream(req.params.connectionId);
    res.json({
      success: true,
      message: 'Real-time stream stopped successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/real-time/events
 * @desc Get recent real-time events
 */
router.get('/real-time/events', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('since').optional().isISO8601().withMessage('Invalid since date'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const events = await realTimeService.getRecentEvents(
      req.user!.tenantId,
      {
        limit: parseInt(req.query.limit as string) || 50,
        eventTypes: req.query.eventTypes as string[],
        startDate: req.query.since ? new Date(req.query.since as string) : undefined
      }
    );
    res.json({
      success: true,
      data: events
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route PUT /api/analytics/real-time/thresholds
 * @desc Configure alert thresholds
 */
router.put('/real-time/thresholds', [
  body('thresholds').isArray().withMessage('Thresholds must be an array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const result = await realTimeService.configureAlertThresholds(
      req.user!.tenantId,
      req.body.thresholds,
      req.user!.sub
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== PREDICTIVE MODELING ROUTES =====

/**
 * @route POST /api/analytics/models/train
 * @desc Train a new predictive model
 */
router.post('/models/train', [
  body('modelType').isIn(['regression', 'time_series', 'classification', 'clustering', 'deep_learning'])
    .withMessage('Invalid model type'),
  body('targetVariable').notEmpty().withMessage('Target variable is required'),
  body('features').isArray().withMessage('Features must be an array'),
  body('trainingPeriod.startDate').isISO8601().withMessage('Invalid training start date'),
  body('trainingPeriod.endDate').isISO8601().withMessage('Invalid training end date'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const request = {
      tenantId: req.user!.tenantId,
      modelType: req.body.modelType,
      targetVariable: req.body.targetVariable,
      features: req.body.features,
      trainingPeriod: {
        startDate: new Date(req.body.trainingPeriod.startDate),
        endDate: new Date(req.body.trainingPeriod.endDate)
      },
      hyperparameters: req.body.hyperparameters,
      validationSplit: req.body.validationSplit
    };

    const model = await predictiveService.trainModel(request);
    res.status(201).json({
      success: true,
      data: model
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/models/:modelId/predict
 * @desc Generate prediction using trained model
 */
router.post('/models/:modelId/predict', [
  param('modelId').isUUID().withMessage('Invalid model ID'),
  body('entityId').notEmpty().withMessage('Entity ID is required'),
  body('entityType').isIn(['portfolio', 'position', 'client']).withMessage('Invalid entity type'),
  body('predictionType').notEmpty().withMessage('Prediction type is required'),
  body('horizon').isInt({ min: 1 }).withMessage('Horizon must be a positive integer'),
  body('unit').isIn(['days', 'weeks', 'months', 'years']).withMessage('Invalid time unit'),
  body('features').isObject().withMessage('Features must be an object'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const prediction = await predictiveService.generatePrediction(req.body);
    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/models
 * @desc Get available predictive models
 */
router.get('/models', [
  query('modelType').optional().isIn(['regression', 'time_series', 'classification', 'clustering', 'deep_learning'])
    .withMessage('Invalid model type'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const models = await predictiveService.getAvailableModels(
      req.user!.tenantId,
      req.query.modelType as any
    );
    res.json({
      success: true,
      data: models
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/models/:modelId/retrain
 * @desc Retrain an existing model
 */
router.post('/models/:modelId/retrain', [
  param('modelId').isUUID().withMessage('Invalid model ID'),
  body('trainingPeriod').optional().isObject(),
  validateRequest
], async (req: any, res: any) => {
  try {
    const model = await predictiveService.retrainModel(
      req.params.modelId,
      req.body.trainingPeriod
    );
    res.json({
      success: true,
      data: model
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/models/:modelId/performance
 * @desc Get model performance metrics
 */
router.get('/models/:modelId/performance', [
  param('modelId').isUUID().withMessage('Invalid model ID'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const performance = await predictiveService.getModelPerformance(req.params.modelId);
    res.json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/models/:modelId/backtest
 * @desc Run model backtest
 */
router.post('/models/:modelId/backtest', [
  param('modelId').isUUID().withMessage('Invalid model ID'),
  body('backtestPeriod.startDate').isISO8601().withMessage('Invalid backtest start date'),
  body('backtestPeriod.endDate').isISO8601().withMessage('Invalid backtest end date'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const backtestPeriod = {
      startDate: new Date(req.body.backtestPeriod.startDate),
      endDate: new Date(req.body.backtestPeriod.endDate)
    };
    const results = await predictiveService.backtestModel(req.params.modelId, backtestPeriod);
    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/predictions/:entityId
 * @desc Get predictions for specific entity
 */
router.get('/predictions/:entityId', [
  param('entityId').notEmpty().withMessage('Entity ID is required'),
  query('entityType').isIn(['portfolio', 'position', 'client']).withMessage('Invalid entity type'),
  query('validOnly').optional().isBoolean().withMessage('Valid only must be boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const predictions = await predictiveService.getPredictionsForEntity(
      req.params.entityId,
      req.query.entityType as any,
      req.query.validOnly === 'true'
    );
    res.json({
      success: true,
      data: predictions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== MACHINE LEARNING INSIGHTS ROUTES =====

/**
 * @route POST /api/analytics/insights/generate
 * @desc Generate ML insights for entities
 */
router.post('/insights/generate', [
  body('analysisType').isIn(['cluster_analysis', 'pattern_recognition', 'optimization_suggestion', 'risk_attribution', 'performance_driver'])
    .withMessage('Invalid analysis type'),
  body('entities').isObject().withMessage('Entities must be an object'),
  body('timeRange.startDate').isISO8601().withMessage('Invalid start date'),
  body('timeRange.endDate').isISO8601().withMessage('Invalid end date'),
  body('minConfidence').optional().isFloat({ min: 0, max: 1 }).withMessage('Min confidence must be between 0 and 1'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const request = {
      tenantId: req.user!.tenantId,
      analysisType: req.body.analysisType,
      entities: req.body.entities,
      timeRange: {
        startDate: new Date(req.body.timeRange.startDate),
        endDate: new Date(req.body.timeRange.endDate)
      },
      minConfidence: req.body.minConfidence,
      categories: req.body.categories
    };

    const insights = await mlInsightsService.generateInsights(request);
    res.status(201).json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/insights/cluster-analysis
 * @desc Perform cluster analysis on data
 */
router.post('/insights/cluster-analysis', [
  body('data').isArray().withMessage('Data must be an array'),
  body('features').isArray().withMessage('Features must be an array'),
  body('numClusters').optional().isInt({ min: 2 }).withMessage('Number of clusters must be at least 2'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const result = await mlInsightsService.performClusterAnalysis(
      req.body.data,
      req.body.features,
      req.body.numClusters
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/insights/pattern-recognition
 * @desc Recognize patterns in data
 */
router.post('/insights/pattern-recognition', [
  body('data').isArray().withMessage('Data must be an array'),
  body('patternTypes').optional().isArray().withMessage('Pattern types must be an array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const result = await mlInsightsService.recognizePatterns(
      req.body.data,
      req.body.patternTypes
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/insights/optimization
 * @desc Generate optimization suggestions
 */
router.post('/insights/optimization', [
  body('portfolioData').isObject().withMessage('Portfolio data must be an object'),
  body('constraints').optional().isArray().withMessage('Constraints must be an array'),
  body('objective').optional().isIn(['return', 'risk', 'sharpe']).withMessage('Invalid objective'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const suggestions = await mlInsightsService.generateOptimizationSuggestions(
      req.body.portfolioData,
      req.body.constraints,
      req.body.objective
    );
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/insights/performance-drivers
 * @desc Analyze performance drivers
 */
router.post('/insights/performance-drivers', [
  body('portfolioData').isObject().withMessage('Portfolio data must be an object'),
  body('benchmarkData').isObject().withMessage('Benchmark data must be an object'),
  body('timeRange.startDate').isISO8601().withMessage('Invalid start date'),
  body('timeRange.endDate').isISO8601().withMessage('Invalid end date'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const timeRange = {
      startDate: new Date(req.body.timeRange.startDate),
      endDate: new Date(req.body.timeRange.endDate)
    };
    const analysis = await mlInsightsService.analyzePerformanceDrivers(
      req.body.portfolioData,
      req.body.benchmarkData,
      timeRange
    );
    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/insights/:entityId
 * @desc Get insights for specific entity
 */
router.get('/insights/:entityId', [
  param('entityId').notEmpty().withMessage('Entity ID is required'),
  query('entityType').isIn(['portfolio', 'position', 'client']).withMessage('Invalid entity type'),
  query('categories').optional().isString().withMessage('Categories must be a string'),
  query('minConfidence').optional().isFloat({ min: 0, max: 1 }).withMessage('Min confidence must be between 0 and 1'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const categories = req.query.categories ? (req.query.categories as string).split(',') : undefined;
    const insights = await mlInsightsService.getInsightsByEntity(
      req.params.entityId,
      req.query.entityType as any,
      categories,
      parseFloat(req.query.minConfidence as string)
    );
    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route PUT /api/analytics/insights/:insightId/action
 * @desc Mark insight action as taken
 */
router.put('/insights/:insightId/action', [
  param('insightId').isUUID().withMessage('Invalid insight ID'),
  body('action').notEmpty().withMessage('Action is required'),
  body('outcome').optional().isString(),
  validateRequest
], async (req: any, res: any) => {
  try {
    const insight = await mlInsightsService.markInsightActionTaken(
      req.params.insightId,
      req.body.action,
      req.user!.userId,
      req.body.outcome
    );
    res.json({
      success: true,
      data: insight
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== ANOMALY DETECTION ROUTES =====

/**
 * @route POST /api/analytics/anomalies/detect
 * @desc Detect anomalies in data
 */
router.post('/anomalies/detect', [
  body('entityId').notEmpty().withMessage('Entity ID is required'),
  body('entityType').isIn(['portfolio', 'position', 'market']).withMessage('Invalid entity type'),
  body('metricType').isIn(Object.values(AnalyticsMetricType)).withMessage('Invalid metric type'),
  body('data').isArray().withMessage('Data must be an array'),
  body('detectionMethods').optional().isArray().withMessage('Detection methods must be an array'),
  body('sensitivity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid sensitivity level'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const request = {
      tenantId: req.user!.tenantId,
      entityId: req.body.entityId,
      entityType: req.body.entityType,
      metricType: req.body.metricType,
      data: req.body.data,
      detectionMethods: req.body.detectionMethods,
      sensitivity: req.body.sensitivity,
      historicalWindow: req.body.historicalWindow
    };

    const anomalies = await anomalyService.detectAnomalies(request);
    res.json({
      success: true,
      data: anomalies
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/anomalies/statistical
 * @desc Run statistical anomaly detection
 */
router.post('/anomalies/statistical', [
  body('data').isArray().withMessage('Data must be an array'),
  body('sensitivity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid sensitivity level'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const result = await anomalyService.runStatisticalAnomalyDetection(
      req.body.data,
      req.body.sensitivity
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/anomalies/isolation-forest
 * @desc Run isolation forest anomaly detection
 */
router.post('/anomalies/isolation-forest', [
  body('data').isArray().withMessage('Data must be an array'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('contamination').optional().isFloat({ min: 0, max: 1 }).withMessage('Contamination must be between 0 and 1'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const result = await anomalyService.runIsolationForestDetection(
      req.body.data,
      req.body.features,
      req.body.contamination
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/anomalies/lstm-autoencoder
 * @desc Run LSTM autoencoder anomaly detection
 */
router.post('/anomalies/lstm-autoencoder', [
  body('data').isArray().withMessage('Data must be an array'),
  body('sequenceLength').optional().isInt({ min: 2 }).withMessage('Sequence length must be at least 2'),
  body('threshold').optional().isFloat({ min: 0 }).withMessage('Threshold must be positive'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const result = await anomalyService.runLSTMAutoencoderDetection(
      req.body.data,
      req.body.sequenceLength,
      req.body.threshold
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/anomalies/real-time-monitor
 * @desc Monitor real-time anomalies
 */
router.post('/anomalies/real-time-monitor', [
  body('entityId').notEmpty().withMessage('Entity ID is required'),
  body('metricType').isIn(Object.values(AnalyticsMetricType)).withMessage('Invalid metric type'),
  body('newDataPoint').isObject().withMessage('New data point must be an object'),
  body('historicalData').isArray().withMessage('Historical data must be an array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const anomaly = await anomalyService.monitorRealTimeAnomalies(
      req.user!.tenantId,
      req.body.entityId,
      req.body.metricType,
      req.body.newDataPoint,
      req.body.historicalData
    );
    res.json({
      success: true,
      data: anomaly
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/anomalies/:entityId
 * @desc Get anomalies for specific entity
 */
router.get('/anomalies/:entityId', [
  param('entityId').notEmpty().withMessage('Entity ID is required'),
  query('entityType').isIn(['portfolio', 'position', 'market']).withMessage('Invalid entity type'),
  query('metricType').optional().isIn(Object.values(AnalyticsMetricType)).withMessage('Invalid metric type'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('resolved').optional().isBoolean().withMessage('Resolved must be boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const anomalies = await anomalyService.getAnomaliesByEntity(
      req.params.entityId,
      req.query.entityType as any,
      req.query.metricType as any,
      req.query.severity as any,
      req.query.resolved === 'true'
    );
    res.json({
      success: true,
      data: anomalies
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route PUT /api/analytics/anomalies/:anomalyId/resolve
 * @desc Resolve an anomaly
 */
router.put('/anomalies/:anomalyId/resolve', [
  param('anomalyId').isUUID().withMessage('Invalid anomaly ID'),
  body('resolution').notEmpty().withMessage('Resolution is required'),
  body('falsePositive').optional().isBoolean().withMessage('False positive must be boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const anomaly = await anomalyService.resolveAnomaly(
      req.params.anomalyId,
      req.user!.userId,
      req.body.resolution,
      req.body.falsePositive
    );
    res.json({
      success: true,
      data: anomaly
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route PUT /api/analytics/anomalies/config
 * @desc Update anomaly detection configuration
 */
router.put('/anomalies/config', [
  body('enabled').optional().isBoolean(),
  body('sensitivity').optional().isIn(['low', 'medium', 'high']),
  body('methods').optional().isArray(),
  body('thresholds').optional().isObject(),
  body('alertThreshold').optional().isFloat({ min: 0, max: 1 }),
  validateRequest
], async (req: any, res: any) => {
  try {
    const config = await anomalyService.updateDetectionConfig(
      req.user!.tenantId,
      req.body
    );
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== BUSINESS INTELLIGENCE ROUTES =====

/**
 * @route POST /api/analytics/reports/generate
 * @desc Generate BI report
 */
router.post('/reports/generate', [
  body('reportType').isIn(['on_demand', 'scheduled', 'recurring']).withMessage('Invalid report type'),
  body('category').isIn(['executive_summary', 'performance_analysis', 'risk_assessment', 'client_analysis', 'market_intelligence'])
    .withMessage('Invalid report category'),
  body('name').notEmpty().withMessage('Report name is required'),
  body('periodCovered.startDate').isISO8601().withMessage('Invalid start date'),
  body('periodCovered.endDate').isISO8601().withMessage('Invalid end date'),
  body('includeInsights').optional().isBoolean(),
  body('format').optional().isIn(['html', 'pdf', 'excel', 'json']).withMessage('Invalid format'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const request = {
      tenantId: req.user!.tenantId,
      reportType: req.body.reportType,
      category: req.body.category,
      name: req.body.name,
      description: req.body.description,
      periodCovered: {
        startDate: new Date(req.body.periodCovered.startDate),
        endDate: new Date(req.body.periodCovered.endDate)
      },
      entities: req.body.entities,
      includeInsights: req.body.includeInsights,
      format: req.body.format,
      recipients: req.body.recipients
    };

    const report = await biService.generateReport(request);
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/reports/executive-summary
 * @desc Generate executive summary
 */
router.get('/reports/executive-summary', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const period = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string)
    };
    const summary = await biService.generateExecutiveSummary(req.user!.tenantId, period);
    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/reports/market-intelligence
 * @desc Generate market intelligence report
 */
router.get('/reports/market-intelligence', async (req: any, res: any) => {
  try {
    const intelligence = await biService.generateMarketIntelligence();
    res.json({
      success: true,
      data: intelligence
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/reports/client-analysis
 * @desc Generate client analysis report
 */
router.get('/reports/client-analysis', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const period = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string)
    };
    const analysis = await biService.generateClientAnalysis(req.user!.tenantId, period);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/bi/configure
 * @desc Configure BI integration
 */
router.post('/bi/configure', [
  body('provider').isIn(['power_bi', 'tableau', 'qlik', 'looker', 'custom']).withMessage('Invalid BI provider'),
  body('connectionString').notEmpty().withMessage('Connection string is required'),
  body('refreshSchedule').notEmpty().withMessage('Refresh schedule is required'),
  body('dataSetIds').isArray().withMessage('Data set IDs must be an array'),
  body('enabled').isBoolean().withMessage('Enabled must be boolean'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const config = await biService.configureBIIntegration(req.user!.tenantId, req.body);
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/bi/sync
 * @desc Sync data with BI tool
 */
router.post('/bi/sync', async (req: any, res: any) => {
  try {
    await biService.syncWithBITool(req.user!.tenantId);
    res.json({
      success: true,
      message: 'BI sync completed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/analytics/reports/schedule
 * @desc Schedule automated reports
 */
router.post('/reports/schedule', [
  body('reportConfigs').isArray().withMessage('Report configs must be an array'),
  validateRequest
], async (req: any, res: any) => {
  try {
    await biService.scheduleAutomatedReports(req.user!.tenantId, req.body.reportConfigs);
    res.json({
      success: true,
      message: 'Automated reports scheduled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/reports/history
 * @desc Get report history
 */
router.get('/reports/history', [
  query('category').optional().isIn(['executive_summary', 'performance_analysis', 'risk_assessment', 'client_analysis', 'market_intelligence'])
    .withMessage('Invalid report category'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const reports = await biService.getReportHistory(
      req.user!.tenantId,
      req.query.category as any,
      parseInt(req.query.limit as string) || 50
    );
    res.json({
      success: true,
      data: reports
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/analytics/reports/:reportId/export
 * @desc Export report in specified format
 */
router.get('/reports/:reportId/export', [
  param('reportId').isUUID().withMessage('Invalid report ID'),
  query('format').isIn(['pdf', 'excel', 'json', 'html']).withMessage('Invalid export format'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const exportData = await biService.exportReport(
      req.params.reportId,
      req.query.format as any
    );
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

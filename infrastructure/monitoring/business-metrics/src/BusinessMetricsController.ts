import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { 
  MetricsCollectionPipeline,
  DashboardTemplateSystem,
  RealTimeMetricsStreaming,
  BusinessThresholdAlerting,
  ExecutiveReportingDashboard,
  DrillDownCapabilities
} from './index';
import {
  MetricDefinition,
  BusinessKPI,
  DashboardTemplate,
  AlertRule,
  MetricExport,
  TimeInterval
} from './BusinessMetricsDataModel';

export interface BusinessMetricsAPIConfig {
  port: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableCors: boolean;
  enableCompression: boolean;
  maxPayloadSize: string;
  apiVersion: string;
  authenticationRequired: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
  tenantId?: string;
}

export class BusinessMetricsController {
  private app: express.Application;
  private config: BusinessMetricsAPIConfig;
  private collectionPipeline: MetricsCollectionPipeline;
  private dashboardSystem: DashboardTemplateSystem;
  private streamingService: RealTimeMetricsStreaming;
  private alertingSystem: BusinessThresholdAlerting;
  private executiveDashboard: ExecutiveReportingDashboard;
  private drillDownService: DrillDownCapabilities;

  constructor(
    config: BusinessMetricsAPIConfig,
    services: {
      collectionPipeline: MetricsCollectionPipeline;
      dashboardSystem: DashboardTemplateSystem;
      streamingService: RealTimeMetricsStreaming;
      alertingSystem: BusinessThresholdAlerting;
      executiveDashboard: ExecutiveReportingDashboard;
      drillDownService: DrillDownCapabilities;
    }
  ) {
    this.config = config;
    this.collectionPipeline = services.collectionPipeline;
    this.dashboardSystem = services.dashboardSystem;
    this.streamingService = services.streamingService;
    this.alertingSystem = services.alertingSystem;
    this.executiveDashboard = services.executiveDashboard;
    this.drillDownService = services.drillDownService;

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: this.config.maxPayloadSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.maxPayloadSize }));

    if (this.config.enableCors) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Tenant-ID');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    if (this.config.enableCompression) {
      const compression = require('compression');
      this.app.use(compression());
    }

    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
    });
    this.app.use(limiter);

    this.app.use(this.requestLogger);
    this.app.use(this.tenantExtractor);
    this.app.use(this.authenticationMiddleware);
  }

  private requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = Math.random().toString(36).substr(2, 9);
    req.headers['x-request-id'] = requestId;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${requestId}`);
    next();
  };

  private tenantExtractor = (req: Request, res: Response, next: NextFunction): void => {
    const tenantId = req.headers['x-tenant-id'] as string || req.query.tenantId as string;
    if (tenantId) {
      req.tenantId = tenantId;
    }
    next();
  };

  private authenticationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!this.config.authenticationRequired) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return this.sendError(res, 401, 'UNAUTHORIZED', 'Valid authorization token required');
    }

    const token = authHeader.substring(7);
    if (!this.validateToken(token)) {
      return this.sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired token');
    }

    req.userId = this.extractUserIdFromToken(token);
    next();
  };

  private setupRoutes(): void {
    const apiRouter = express.Router();

    this.setupMetricDefinitionRoutes(apiRouter);
    this.setupKPIRoutes(apiRouter);
    this.setupDashboardRoutes(apiRouter);
    this.setupAlertingRoutes(apiRouter);
    this.setupExecutiveRoutes(apiRouter);
    this.setupDrillDownRoutes(apiRouter);
    this.setupExportRoutes(apiRouter);
    this.setupSystemRoutes(apiRouter);

    this.app.use(`/api/${this.config.apiVersion}`, apiRouter);
    this.app.use('/health', this.healthCheck);
    this.app.use('/metrics', this.systemMetrics);
  }

  private setupMetricDefinitionRoutes(router: express.Router): void {
    router.get('/metrics/definitions',
      this.validateTenantId(),
      this.getMetricDefinitions.bind(this)
    );

    router.post('/metrics/definitions',
      this.validateTenantId(),
      body('name').notEmpty().withMessage('Name is required'),
      body('displayName').notEmpty().withMessage('Display name is required'),
      body('category').isIn(['financial', 'operational', 'client', 'portfolio', 'trading', 'risk', 'compliance', 'performance', 'security', 'system']),
      body('type').isIn(['counter', 'gauge', 'histogram', 'summary', 'rate', 'percentage', 'currency', 'duration']),
      this.validateRequest,
      this.createMetricDefinition.bind(this)
    );

    router.get('/metrics/definitions/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.getMetricDefinition.bind(this)
    );

    router.put('/metrics/definitions/:id',
      param('id').notEmpty(),
      this.validateTenantId(),
      this.validateRequest,
      this.updateMetricDefinition.bind(this)
    );

    router.delete('/metrics/definitions/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.deleteMetricDefinition.bind(this)
    );

    router.get('/metrics/values',
      this.validateTenantId(),
      query('metricId').notEmpty(),
      query('startTime').isISO8601(),
      query('endTime').isISO8601(),
      this.validateRequest,
      this.getMetricValues.bind(this)
    );

    router.post('/metrics/values',
      this.validateTenantId(),
      body('metricId').notEmpty(),
      body('value').isNumeric(),
      body('timestamp').optional().isISO8601(),
      this.validateRequest,
      this.recordMetricValue.bind(this)
    );

    router.post('/metrics/values/batch',
      this.validateTenantId(),
      body('values').isArray({ min: 1, max: 1000 }),
      this.validateRequest,
      this.recordMetricValuesBatch.bind(this)
    );
  }

  private setupKPIRoutes(router: express.Router): void {
    router.get('/kpis',
      this.validateTenantId(),
      this.getKPIs.bind(this)
    );

    router.post('/kpis',
      this.validateTenantId(),
      body('name').notEmpty().withMessage('Name is required'),
      body('metricIds').isArray({ min: 1 }),
      this.validateRequest,
      this.createKPI.bind(this)
    );

    router.get('/kpis/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.getKPI.bind(this)
    );

    router.put('/kpis/:id',
      param('id').notEmpty(),
      this.validateTenantId(),
      this.validateRequest,
      this.updateKPI.bind(this)
    );

    router.delete('/kpis/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.deleteKPI.bind(this)
    );

    router.get('/kpis/:id/current-value',
      param('id').notEmpty(),
      this.validateRequest,
      this.getKPICurrentValue.bind(this)
    );

    router.post('/kpis/:id/targets',
      param('id').notEmpty(),
      body('targetValue').isNumeric(),
      body('timeFrame').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
      this.validateRequest,
      this.createKPITarget.bind(this)
    );
  }

  private setupDashboardRoutes(router: express.Router): void {
    router.get('/dashboards/templates',
      this.validateTenantId(),
      this.getDashboardTemplates.bind(this)
    );

    router.post('/dashboards/templates',
      this.validateTenantId(),
      body('name').notEmpty().withMessage('Name is required'),
      body('type').isIn(['executive', 'operational', 'analytical', 'compliance']),
      this.validateRequest,
      this.createDashboardTemplate.bind(this)
    );

    router.get('/dashboards/templates/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.getDashboardTemplate.bind(this)
    );

    router.put('/dashboards/templates/:id',
      param('id').notEmpty(),
      this.validateTenantId(),
      this.validateRequest,
      this.updateDashboardTemplate.bind(this)
    );

    router.delete('/dashboards/templates/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.deleteDashboardTemplate.bind(this)
    );

    router.post('/dashboards/templates/:id/clone',
      param('id').notEmpty(),
      body('name').notEmpty(),
      this.validateTenantId(),
      this.validateRequest,
      this.cloneDashboardTemplate.bind(this)
    );

    router.post('/dashboards/instances',
      this.validateTenantId(),
      body('templateId').notEmpty(),
      body('name').notEmpty(),
      this.validateRequest,
      this.createDashboardInstance.bind(this)
    );

    router.get('/dashboards/instances',
      this.validateTenantId(),
      this.getDashboardInstances.bind(this)
    );

    router.get('/dashboards/instances/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.getDashboardInstance.bind(this)
    );

    router.get('/dashboards/instances/:id/render',
      param('id').notEmpty(),
      this.validateRequest,
      this.renderDashboard.bind(this)
    );
  }

  private setupAlertingRoutes(router: express.Router): void {
    router.get('/alerts/rules',
      this.validateTenantId(),
      this.getAlertRules.bind(this)
    );

    router.post('/alerts/rules',
      this.validateTenantId(),
      body('name').notEmpty().withMessage('Name is required'),
      body('type').isIn(['threshold', 'anomaly', 'trend', 'missing_data', 'composite']),
      body('conditions').isArray({ min: 1 }),
      this.validateRequest,
      this.createAlertRule.bind(this)
    );

    router.get('/alerts/rules/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.getAlertRule.bind(this)
    );

    router.put('/alerts/rules/:id',
      param('id').notEmpty(),
      this.validateTenantId(),
      this.validateRequest,
      this.updateAlertRule.bind(this)
    );

    router.delete('/alerts/rules/:id',
      param('id').notEmpty(),
      this.validateRequest,
      this.deleteAlertRule.bind(this)
    );

    router.get('/alerts/active',
      this.validateTenantId(),
      this.getActiveAlerts.bind(this)
    );

    router.post('/alerts/:id/acknowledge',
      param('id').notEmpty(),
      body('notes').optional(),
      this.validateRequest,
      this.acknowledgeAlert.bind(this)
    );

    router.post('/alerts/:id/resolve',
      param('id').notEmpty(),
      body('reason').notEmpty(),
      this.validateRequest,
      this.resolveAlert.bind(this)
    );

    router.get('/alerts/:id/history',
      param('id').notEmpty(),
      this.validateRequest,
      this.getAlertHistory.bind(this)
    );

    router.get('/alerts/statistics',
      this.validateTenantId(),
      this.getAlertStatistics.bind(this)
    );
  }

  private setupExecutiveRoutes(router: express.Router): void {
    router.get('/executive/summary',
      this.validateTenantId(),
      query('period').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      this.validateRequest,
      this.getExecutiveSummary.bind(this)
    );

    router.get('/executive/metrics',
      this.validateTenantId(),
      this.getExecutiveMetrics.bind(this)
    );

    router.get('/executive/insights',
      this.validateTenantId(),
      this.getExecutiveInsights.bind(this)
    );

    router.get('/executive/recommendations',
      this.validateTenantId(),
      this.getExecutiveRecommendations.bind(this)
    );

    router.get('/executive/performance',
      this.validateTenantId(),
      this.getPerformanceSummary.bind(this)
    );
  }

  private setupDrillDownRoutes(router: express.Router): void {
    router.get('/drilldown/paths',
      this.validateTenantId(),
      this.getDrillDownPaths.bind(this)
    );

    router.post('/drilldown/paths',
      this.validateTenantId(),
      body('name').notEmpty(),
      body('levels').isArray({ min: 1 }),
      body('metricIds').isArray({ min: 1 }),
      this.validateRequest,
      this.createDrillDownPath.bind(this)
    );

    router.post('/drilldown/sessions',
      this.validateTenantId(),
      body('pathId').notEmpty(),
      this.validateRequest,
      this.startDrillDownSession.bind(this)
    );

    router.post('/drilldown/sessions/:sessionId/navigate',
      param('sessionId').notEmpty(),
      body('level').optional().isInt({ min: 0 }),
      body('selectedValue').optional(),
      this.validateRequest,
      this.navigateDrillDown.bind(this)
    );

    router.post('/drilldown/sessions/:sessionId/back',
      param('sessionId').notEmpty(),
      this.validateRequest,
      this.navigateBack.bind(this)
    );

    router.post('/drilldown/sessions/:sessionId/bookmarks',
      param('sessionId').notEmpty(),
      body('name').notEmpty(),
      body('description').optional(),
      this.validateRequest,
      this.createDrillDownBookmark.bind(this)
    );

    router.get('/drilldown/sessions/:sessionId/bookmarks',
      param('sessionId').notEmpty(),
      this.validateRequest,
      this.getDrillDownBookmarks.bind(this)
    );

    router.post('/drilldown/sessions/:sessionId/bookmarks/:bookmarkId/load',
      param('sessionId').notEmpty(),
      param('bookmarkId').notEmpty(),
      this.validateRequest,
      this.loadDrillDownBookmark.bind(this)
    );

    router.delete('/drilldown/sessions/:sessionId',
      param('sessionId').notEmpty(),
      this.validateRequest,
      this.endDrillDownSession.bind(this)
    );
  }

  private setupExportRoutes(router: express.Router): void {
    router.post('/exports/metrics',
      this.validateTenantId(),
      body('metricIds').isArray({ min: 1 }),
      body('format').isIn(['csv', 'xlsx', 'json', 'pdf']),
      body('startDate').isISO8601(),
      body('endDate').isISO8601(),
      this.validateRequest,
      this.exportMetrics.bind(this)
    );

    router.post('/exports/dashboards/:instanceId',
      param('instanceId').notEmpty(),
      body('format').isIn(['pdf', 'png', 'xlsx']),
      this.validateRequest,
      this.exportDashboard.bind(this)
    );

    router.post('/exports/drilldown/:sessionId',
      param('sessionId').notEmpty(),
      body('format').isIn(['csv', 'xlsx', 'json', 'pdf']),
      this.validateRequest,
      this.exportDrillDown.bind(this)
    );

    router.get('/exports/:exportId/status',
      param('exportId').notEmpty(),
      this.validateRequest,
      this.getExportStatus.bind(this)
    );

    router.get('/exports/:exportId/download',
      param('exportId').notEmpty(),
      this.validateRequest,
      this.downloadExport.bind(this)
    );

    router.get('/exports',
      this.validateTenantId(),
      this.getExports.bind(this)
    );

    router.delete('/exports/:exportId',
      param('exportId').notEmpty(),
      this.validateRequest,
      this.deleteExport.bind(this)
    );
  }

  private setupSystemRoutes(router: express.Router): void {
    router.get('/system/stats',
      this.getSystemStats.bind(this)
    );

    router.get('/system/health',
      this.getSystemHealth.bind(this)
    );

    router.get('/system/metrics',
      this.getSystemMetrics.bind(this)
    );

    router.post('/system/cache/clear',
      this.clearSystemCache.bind(this)
    );
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', err);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'An internal server error occurred');
    });

    this.app.use((req: Request, res: Response) => {
      this.sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    });
  }

  private async getMetricDefinitions(req: Request, res: Response): Promise<void> {
    try {
      const options = this.extractQueryOptions(req);
      const definitions = []; // Mock data
      this.sendSuccess(res, definitions, { pagination: this.calculatePagination(options, definitions.length) });
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async createMetricDefinition(req: Request, res: Response): Promise<void> {
    try {
      const definition = await this.collectionPipeline.registerMetricDefinition({
        id: this.generateId(),
        tenantId: req.tenantId!,
        createdBy: req.userId!,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...req.body
      });
      this.sendSuccess(res, definition, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CREATION_ERROR', error.message);
    }
  }

  private async getMetricDefinition(req: Request, res: Response): Promise<void> {
    try {
      const definition = null; // Mock implementation
      if (!definition) {
        return this.sendError(res, 404, 'NOT_FOUND', 'Metric definition not found');
      }
      this.sendSuccess(res, definition);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async updateMetricDefinition(req: Request, res: Response): Promise<void> {
    try {
      const definition = { ...req.body, updatedAt: new Date() }; // Mock implementation
      this.sendSuccess(res, definition);
    } catch (error) {
      this.sendError(res, 400, 'UPDATE_ERROR', error.message);
    }
  }

  private async deleteMetricDefinition(req: Request, res: Response): Promise<void> {
    try {
      // Mock implementation
      this.sendSuccess(res, { deleted: true });
    } catch (error) {
      this.sendError(res, 400, 'DELETE_ERROR', error.message);
    }
  }

  private async getMetricValues(req: Request, res: Response): Promise<void> {
    try {
      const { metricId, startTime, endTime } = req.query;
      const values = []; // Mock data
      this.sendSuccess(res, values);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async recordMetricValue(req: Request, res: Response): Promise<void> {
    try {
      const metricValue = {
        id: this.generateId(),
        tenantId: req.tenantId!,
        timestamp: new Date(req.body.timestamp || Date.now()),
        createdAt: new Date(),
        ...req.body
      };
      this.sendSuccess(res, metricValue, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'RECORD_ERROR', error.message);
    }
  }

  private async recordMetricValuesBatch(req: Request, res: Response): Promise<void> {
    try {
      const { values } = req.body;
      const results = values.map((value: any) => ({
        id: this.generateId(),
        tenantId: req.tenantId!,
        timestamp: new Date(value.timestamp || Date.now()),
        createdAt: new Date(),
        ...value
      }));
      this.sendSuccess(res, { recorded: results.length, values: results });
    } catch (error) {
      this.sendError(res, 400, 'BATCH_RECORD_ERROR', error.message);
    }
  }

  private async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const options = this.extractQueryOptions(req);
      const kpis = []; // Mock data
      this.sendSuccess(res, kpis, { pagination: this.calculatePagination(options, kpis.length) });
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async createKPI(req: Request, res: Response): Promise<void> {
    try {
      const kpi = {
        id: this.generateId(),
        tenantId: req.tenantId!,
        ownerUserId: req.userId!,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...req.body
      };
      this.sendSuccess(res, kpi, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CREATION_ERROR', error.message);
    }
  }

  private async getKPI(req: Request, res: Response): Promise<void> {
    try {
      const kpi = null; // Mock implementation
      if (!kpi) {
        return this.sendError(res, 404, 'NOT_FOUND', 'KPI not found');
      }
      this.sendSuccess(res, kpi);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async updateKPI(req: Request, res: Response): Promise<void> {
    try {
      const kpi = { ...req.body, updatedAt: new Date() }; // Mock implementation
      this.sendSuccess(res, kpi);
    } catch (error) {
      this.sendError(res, 400, 'UPDATE_ERROR', error.message);
    }
  }

  private async deleteKPI(req: Request, res: Response): Promise<void> {
    try {
      // Mock implementation
      this.sendSuccess(res, { deleted: true });
    } catch (error) {
      this.sendError(res, 400, 'DELETE_ERROR', error.message);
    }
  }

  private async getKPICurrentValue(req: Request, res: Response): Promise<void> {
    try {
      const currentValue = {
        kpiId: req.params.id,
        value: Math.random() * 1000,
        timestamp: new Date(),
        trend: 'up',
        change: Math.random() * 10
      };
      this.sendSuccess(res, currentValue);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async createKPITarget(req: Request, res: Response): Promise<void> {
    try {
      const target = {
        id: this.generateId(),
        kpiId: req.params.id,
        tenantId: req.tenantId!,
        createdBy: req.userId!,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...req.body
      };
      this.sendSuccess(res, target, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CREATION_ERROR', error.message);
    }
  }

  private async getDashboardTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = this.dashboardSystem.getTemplates(req.tenantId, req.query.category as string);
      this.sendSuccess(res, templates);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async createDashboardTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await this.dashboardSystem.createTemplate({
        tenantId: req.tenantId!,
        createdBy: req.userId!,
        ...req.body
      });
      this.sendSuccess(res, template, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CREATION_ERROR', error.message);
    }
  }

  private async getDashboardTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = this.dashboardSystem.getTemplate(req.params.id);
      if (!template) {
        return this.sendError(res, 404, 'NOT_FOUND', 'Dashboard template not found');
      }
      this.sendSuccess(res, template);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async updateDashboardTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await this.dashboardSystem.updateTemplate(req.params.id, req.body);
      this.sendSuccess(res, template);
    } catch (error) {
      this.sendError(res, 400, 'UPDATE_ERROR', error.message);
    }
  }

  private async deleteDashboardTemplate(req: Request, res: Response): Promise<void> {
    try {
      await this.dashboardSystem.deleteTemplate(req.params.id);
      this.sendSuccess(res, { deleted: true });
    } catch (error) {
      this.sendError(res, 400, 'DELETE_ERROR', error.message);
    }
  }

  private async cloneDashboardTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await this.dashboardSystem.cloneTemplate(
        req.params.id,
        req.body.name,
        req.tenantId!,
        req.userId!
      );
      this.sendSuccess(res, template, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CLONE_ERROR', error.message);
    }
  }

  private async createDashboardInstance(req: Request, res: Response): Promise<void> {
    try {
      const instance = await this.dashboardSystem.createDashboardInstance(
        req.body.templateId,
        req.tenantId!,
        req.userId!,
        req.body.name,
        req.body.customizations
      );
      this.sendSuccess(res, instance, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CREATION_ERROR', error.message);
    }
  }

  private async getDashboardInstances(req: Request, res: Response): Promise<void> {
    try {
      const instances = this.dashboardSystem.getDashboardInstances(req.tenantId!, req.userId);
      this.sendSuccess(res, instances);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getDashboardInstance(req: Request, res: Response): Promise<void> {
    try {
      const instance = this.dashboardSystem.getDashboardInstance(req.params.id);
      if (!instance) {
        return this.sendError(res, 404, 'NOT_FOUND', 'Dashboard instance not found');
      }
      this.sendSuccess(res, instance);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async renderDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.dashboardSystem.renderDashboard(req.params.id, req.userId!);
      this.sendSuccess(res, dashboard);
    } catch (error) {
      this.sendError(res, 500, 'RENDER_ERROR', error.message);
    }
  }

  private async getAlertRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = this.alertingSystem.getAlertRules(req.tenantId);
      this.sendSuccess(res, rules);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async createAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = await this.alertingSystem.createAlertRule({
        tenantId: req.tenantId!,
        createdBy: req.userId!,
        ...req.body
      });
      this.sendSuccess(res, rule, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CREATION_ERROR', error.message);
    }
  }

  private async getAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = this.alertingSystem.getAlertRule(req.params.id);
      if (!rule) {
        return this.sendError(res, 404, 'NOT_FOUND', 'Alert rule not found');
      }
      this.sendSuccess(res, rule);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async updateAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = await this.alertingSystem.updateAlertRule(req.params.id, req.body);
      this.sendSuccess(res, rule);
    } catch (error) {
      this.sendError(res, 400, 'UPDATE_ERROR', error.message);
    }
  }

  private async deleteAlertRule(req: Request, res: Response): Promise<void> {
    try {
      await this.alertingSystem.deleteAlertRule(req.params.id);
      this.sendSuccess(res, { deleted: true });
    } catch (error) {
      this.sendError(res, 400, 'DELETE_ERROR', error.message);
    }
  }

  private async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = this.alertingSystem.getActiveAlerts(req.tenantId);
      this.sendSuccess(res, alerts);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      await this.alertingSystem.acknowledgeAlert(req.params.id, req.userId!, req.body.notes);
      this.sendSuccess(res, { acknowledged: true });
    } catch (error) {
      this.sendError(res, 400, 'ACKNOWLEDGE_ERROR', error.message);
    }
  }

  private async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      await this.alertingSystem.resolveAlert(req.params.id, req.body.reason, req.userId);
      this.sendSuccess(res, { resolved: true });
    } catch (error) {
      this.sendError(res, 400, 'RESOLVE_ERROR', error.message);
    }
  }

  private async getAlertHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = this.alertingSystem.getAlertHistory(req.params.id);
      this.sendSuccess(res, history);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getAlertStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = {}; // Mock implementation
      this.sendSuccess(res, stats);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getExecutiveSummary(req: Request, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const summary = await this.executiveDashboard.generateExecutiveSummary(
        req.tenantId!,
        { start, end, type: (period as any) || 'monthly' }
      );
      this.sendSuccess(res, summary);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getExecutiveMetrics(req: Request, res: Response): Promise<void> {
    try {
      const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
      const metrics = await this.executiveDashboard.getKeyMetrics(req.tenantId!, period);
      this.sendSuccess(res, metrics);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getExecutiveInsights(req: Request, res: Response): Promise<void> {
    try {
      const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
      const insights = await this.executiveDashboard.generateInsights(req.tenantId!, period);
      this.sendSuccess(res, insights);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getExecutiveRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
      const recommendations = await this.executiveDashboard.generateRecommendations(req.tenantId!, period);
      this.sendSuccess(res, recommendations);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getPerformanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
      const performance = await this.executiveDashboard.calculatePerformanceSummary(req.tenantId!, period);
      this.sendSuccess(res, performance);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getDrillDownPaths(req: Request, res: Response): Promise<void> {
    try {
      const paths = this.drillDownService.getDrillDownPaths();
      this.sendSuccess(res, paths);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async createDrillDownPath(req: Request, res: Response): Promise<void> {
    try {
      const path = await this.drillDownService.createDrillDownPath(req.body);
      this.sendSuccess(res, path, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'CREATION_ERROR', error.message);
    }
  }

  private async startDrillDownSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await this.drillDownService.startDrillDownSession(
        req.userId!,
        req.tenantId!,
        req.body.pathId,
        req.body.initialContext
      );
      this.sendSuccess(res, session, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'SESSION_ERROR', error.message);
    }
  }

  private async navigateDrillDown(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.drillDownService.performDrillDown(req.params.sessionId, req.body);
      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, 400, 'NAVIGATION_ERROR', error.message);
    }
  }

  private async navigateBack(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.drillDownService.navigateBack(req.params.sessionId);
      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, 400, 'NAVIGATION_ERROR', error.message);
    }
  }

  private async createDrillDownBookmark(req: Request, res: Response): Promise<void> {
    try {
      const bookmark = await this.drillDownService.createBookmark(
        req.params.sessionId,
        req.body.name,
        req.body.description,
        req.body.isShared,
        req.body.tags
      );
      this.sendSuccess(res, bookmark, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'BOOKMARK_ERROR', error.message);
    }
  }

  private async getDrillDownBookmarks(req: Request, res: Response): Promise<void> {
    try {
      const session = this.drillDownService.getSession(req.params.sessionId);
      if (!session) {
        return this.sendError(res, 404, 'NOT_FOUND', 'Session not found');
      }
      this.sendSuccess(res, session.bookmarks);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async loadDrillDownBookmark(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.drillDownService.loadBookmark(req.params.sessionId, req.params.bookmarkId);
      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, 400, 'BOOKMARK_ERROR', error.message);
    }
  }

  private async endDrillDownSession(req: Request, res: Response): Promise<void> {
    try {
      await this.drillDownService.endSession(req.params.sessionId);
      this.sendSuccess(res, { ended: true });
    } catch (error) {
      this.sendError(res, 400, 'SESSION_ERROR', error.message);
    }
  }

  private async exportMetrics(req: Request, res: Response): Promise<void> {
    try {
      const exportResult = {
        id: this.generateId(),
        status: 'pending',
        format: req.body.format,
        metricIds: req.body.metricIds,
        createdAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 60000)
      };
      this.sendSuccess(res, exportResult, undefined, 202);
    } catch (error) {
      this.sendError(res, 400, 'EXPORT_ERROR', error.message);
    }
  }

  private async exportDashboard(req: Request, res: Response): Promise<void> {
    try {
      const exportResult = {
        id: this.generateId(),
        status: 'pending',
        format: req.body.format,
        instanceId: req.params.instanceId,
        createdAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 120000)
      };
      this.sendSuccess(res, exportResult, undefined, 202);
    } catch (error) {
      this.sendError(res, 400, 'EXPORT_ERROR', error.message);
    }
  }

  private async exportDrillDown(req: Request, res: Response): Promise<void> {
    try {
      const exportResult = await this.drillDownService.exportDrillDownData(
        req.params.sessionId,
        req.body.format,
        req.body.options || {}
      );
      this.sendSuccess(res, exportResult, undefined, 201);
    } catch (error) {
      this.sendError(res, 400, 'EXPORT_ERROR', error.message);
    }
  }

  private async getExportStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = {
        id: req.params.exportId,
        status: 'completed',
        progress: 100,
        createdAt: new Date(Date.now() - 30000),
        completedAt: new Date(),
        downloadUrl: `/api/${this.config.apiVersion}/exports/${req.params.exportId}/download`
      };
      this.sendSuccess(res, status);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async downloadExport(req: Request, res: Response): Promise<void> {
    try {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="export_${req.params.exportId}.json"`);
      res.send(JSON.stringify({ exportId: req.params.exportId, data: 'mock export data' }));
    } catch (error) {
      this.sendError(res, 500, 'DOWNLOAD_ERROR', error.message);
    }
  }

  private async getExports(req: Request, res: Response): Promise<void> {
    try {
      const exports = []; // Mock data
      this.sendSuccess(res, exports);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async deleteExport(req: Request, res: Response): Promise<void> {
    try {
      this.sendSuccess(res, { deleted: true });
    } catch (error) {
      this.sendError(res, 400, 'DELETE_ERROR', error.message);
    }
  }

  private async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = {
        streaming: this.streamingService.getServerStats(),
        drilldown: this.drillDownService.getCacheStats(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      };
      this.sendSuccess(res, stats);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        services: {
          collection: 'healthy',
          dashboard: 'healthy',
          streaming: 'healthy',
          alerting: 'healthy',
          executive: 'healthy',
          drilldown: 'healthy'
        },
        timestamp: new Date()
      };
      this.sendSuccess(res, health);
    } catch (error) {
      this.sendError(res, 500, 'HEALTH_CHECK_ERROR', error.message);
    }
  }

  private async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = {
        requests_total: Math.floor(Math.random() * 10000),
        response_time_avg: Math.random() * 1000,
        error_rate: Math.random() * 0.05,
        active_connections: Math.floor(Math.random() * 100),
        timestamp: new Date()
      };
      this.sendSuccess(res, metrics);
    } catch (error) {
      this.sendError(res, 500, 'FETCH_ERROR', error.message);
    }
  }

  private async clearSystemCache(req: Request, res: Response): Promise<void> {
    try {
      this.sendSuccess(res, { cacheCleared: true });
    } catch (error) {
      this.sendError(res, 500, 'CACHE_CLEAR_ERROR', error.message);
    }
  }

  private healthCheck = (req: Request, res: Response): void => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  };

  private systemMetrics = (req: Request, res: Response): void => {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date()
    };
    res.json(metrics);
  };

  private validateTenantId() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.tenantId) {
        return this.sendError(res, 400, 'MISSING_TENANT', 'Tenant ID is required');
      }
      next();
    };
  }

  private validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return this.sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors.array());
    }
    next();
  };

  private validateToken(token: string): boolean {
    return token && token.length > 10;
  }

  private extractUserIdFromToken(token: string): string {
    return 'user_' + token.substring(0, 8);
  }

  private extractQueryOptions(req: Request): QueryOptions {
    return {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 50, 1000),
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : {},
      search: req.query.search as string,
      tenantId: req.tenantId
    };
  }

  private calculatePagination(options: QueryOptions, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / (options.limit || 50));
    const currentPage = options.page || 1;
    
    return {
      page: currentPage,
      limit: options.limit || 50,
      total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }

  private sendSuccess<T>(res: Response, data: T, meta?: any, statusCode: number = 200): void {
    const response: APIResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('x-request-id') as string || 'unknown',
        version: this.config.apiVersion,
        ...meta
      }
    };
    res.status(statusCode).json(response);
  }

  private sendError(res: Response, statusCode: number, code: string, message: string, details?: any): void {
    const response: APIResponse = {
      success: false,
      error: {
        code,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('x-request-id') as string || 'unknown',
        version: this.config.apiVersion
      }
    };
    res.status(statusCode).json(response);
  }

  private generateId(): string {
    return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`Business Metrics API server started on port ${this.config.port}`);
        resolve();
      });
    });
  }
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
    }
  }
}
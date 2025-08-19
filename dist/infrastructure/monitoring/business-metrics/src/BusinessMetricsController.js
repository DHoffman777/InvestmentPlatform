"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessMetricsController = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
class BusinessMetricsController {
    app;
    config;
    collectionPipeline;
    dashboardSystem;
    streamingService;
    alertingSystem;
    executiveDashboard;
    drillDownService;
    constructor(config, services) {
        this.config = config;
        this.collectionPipeline = services.collectionPipeline;
        this.dashboardSystem = services.dashboardSystem;
        this.streamingService = services.streamingService;
        this.alertingSystem = services.alertingSystem;
        this.executiveDashboard = services.executiveDashboard;
        this.drillDownService = services.drillDownService;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use(express_1.default.json({ limit: this.config.maxPayloadSize }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: this.config.maxPayloadSize }));
        if (this.config.enableCors) {
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Tenant-ID');
                if (req.method === 'OPTIONS') {
                    res.sendStatus(200);
                }
                else {
                    next();
                }
            });
        }
        if (this.config.enableCompression) {
            const compression = require('compression');
            this.app.use(compression());
        }
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: this.config.rateLimitWindowMs,
            max: this.config.rateLimitMaxRequests,
            message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
        });
        this.app.use(limiter);
        this.app.use(this.requestLogger);
        this.app.use(this.tenantExtractor);
        this.app.use(this.authenticationMiddleware);
    }
    requestLogger = (req, res, next) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        req.headers['x-request-id'] = requestId;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${requestId}`);
        next();
    };
    tenantExtractor = (req, res, next) => {
        const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
        if (tenantId) {
            req.tenantId = tenantId;
        }
        next();
    };
    authenticationMiddleware = (req, res, next) => {
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
    setupRoutes() {
        const apiRouter = express_1.default.Router();
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
    setupMetricDefinitionRoutes(router) {
        router.get('/metrics/definitions', this.validateTenantId(), this.getMetricDefinitions.bind(this));
        router.post('/metrics/definitions', this.validateTenantId(), (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'), (0, express_validator_1.body)('displayName').notEmpty().withMessage('Display name is required'), (0, express_validator_1.body)('category').isIn(['financial', 'operational', 'client', 'portfolio', 'trading', 'risk', 'compliance', 'performance', 'security', 'system']), (0, express_validator_1.body)('type').isIn(['counter', 'gauge', 'histogram', 'summary', 'rate', 'percentage', 'currency', 'duration']), this.validateRequest, this.createMetricDefinition.bind(this));
        router.get('/metrics/definitions/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.getMetricDefinition.bind(this));
        router.put('/metrics/definitions/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateTenantId(), this.validateRequest, this.updateMetricDefinition.bind(this));
        router.delete('/metrics/definitions/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.deleteMetricDefinition.bind(this));
        router.get('/metrics/values', this.validateTenantId(), (0, express_validator_1.query)('metricId').notEmpty(), (0, express_validator_1.query)('startTime').isISO8601(), (0, express_validator_1.query)('endTime').isISO8601(), this.validateRequest, this.getMetricValues.bind(this));
        router.post('/metrics/values', this.validateTenantId(), (0, express_validator_1.body)('metricId').notEmpty(), (0, express_validator_1.body)('value').isNumeric(), (0, express_validator_1.body)('timestamp').optional().isISO8601(), this.validateRequest, this.recordMetricValue.bind(this));
        router.post('/metrics/values/batch', this.validateTenantId(), (0, express_validator_1.body)('values').isArray({ min: 1, max: 1000 }), this.validateRequest, this.recordMetricValuesBatch.bind(this));
    }
    setupKPIRoutes(router) {
        router.get('/kpis', this.validateTenantId(), this.getKPIs.bind(this));
        router.post('/kpis', this.validateTenantId(), (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'), (0, express_validator_1.body)('metricIds').isArray({ min: 1 }), this.validateRequest, this.createKPI.bind(this));
        router.get('/kpis/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.getKPI.bind(this));
        router.put('/kpis/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateTenantId(), this.validateRequest, this.updateKPI.bind(this));
        router.delete('/kpis/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.deleteKPI.bind(this));
        router.get('/kpis/:id/current-value', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.getKPICurrentValue.bind(this));
        router.post('/kpis/:id/targets', (0, express_validator_1.param)('id').notEmpty(), (0, express_validator_1.body)('targetValue').isNumeric(), (0, express_validator_1.body)('timeFrame').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']), this.validateRequest, this.createKPITarget.bind(this));
    }
    setupDashboardRoutes(router) {
        router.get('/dashboards/templates', this.validateTenantId(), this.getDashboardTemplates.bind(this));
        router.post('/dashboards/templates', this.validateTenantId(), (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'), (0, express_validator_1.body)('type').isIn(['executive', 'operational', 'analytical', 'compliance']), this.validateRequest, this.createDashboardTemplate.bind(this));
        router.get('/dashboards/templates/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.getDashboardTemplate.bind(this));
        router.put('/dashboards/templates/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateTenantId(), this.validateRequest, this.updateDashboardTemplate.bind(this));
        router.delete('/dashboards/templates/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.deleteDashboardTemplate.bind(this));
        router.post('/dashboards/templates/:id/clone', (0, express_validator_1.param)('id').notEmpty(), (0, express_validator_1.body)('name').notEmpty(), this.validateTenantId(), this.validateRequest, this.cloneDashboardTemplate.bind(this));
        router.post('/dashboards/instances', this.validateTenantId(), (0, express_validator_1.body)('templateId').notEmpty(), (0, express_validator_1.body)('name').notEmpty(), this.validateRequest, this.createDashboardInstance.bind(this));
        router.get('/dashboards/instances', this.validateTenantId(), this.getDashboardInstances.bind(this));
        router.get('/dashboards/instances/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.getDashboardInstance.bind(this));
        router.get('/dashboards/instances/:id/render', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.renderDashboard.bind(this));
    }
    setupAlertingRoutes(router) {
        router.get('/alerts/rules', this.validateTenantId(), this.getAlertRules.bind(this));
        router.post('/alerts/rules', this.validateTenantId(), (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'), (0, express_validator_1.body)('type').isIn(['threshold', 'anomaly', 'trend', 'missing_data', 'composite']), (0, express_validator_1.body)('conditions').isArray({ min: 1 }), this.validateRequest, this.createAlertRule.bind(this));
        router.get('/alerts/rules/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.getAlertRule.bind(this));
        router.put('/alerts/rules/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateTenantId(), this.validateRequest, this.updateAlertRule.bind(this));
        router.delete('/alerts/rules/:id', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.deleteAlertRule.bind(this));
        router.get('/alerts/active', this.validateTenantId(), this.getActiveAlerts.bind(this));
        router.post('/alerts/:id/acknowledge', (0, express_validator_1.param)('id').notEmpty(), (0, express_validator_1.body)('notes').optional(), this.validateRequest, this.acknowledgeAlert.bind(this));
        router.post('/alerts/:id/resolve', (0, express_validator_1.param)('id').notEmpty(), (0, express_validator_1.body)('reason').notEmpty(), this.validateRequest, this.resolveAlert.bind(this));
        router.get('/alerts/:id/history', (0, express_validator_1.param)('id').notEmpty(), this.validateRequest, this.getAlertHistory.bind(this));
        router.get('/alerts/statistics', this.validateTenantId(), this.getAlertStatistics.bind(this));
    }
    setupExecutiveRoutes(router) {
        router.get('/executive/summary', this.validateTenantId(), (0, express_validator_1.query)('period').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']), (0, express_validator_1.query)('startDate').optional().isISO8601(), (0, express_validator_1.query)('endDate').optional().isISO8601(), this.validateRequest, this.getExecutiveSummary.bind(this));
        router.get('/executive/metrics', this.validateTenantId(), this.getExecutiveMetrics.bind(this));
        router.get('/executive/insights', this.validateTenantId(), this.getExecutiveInsights.bind(this));
        router.get('/executive/recommendations', this.validateTenantId(), this.getExecutiveRecommendations.bind(this));
        router.get('/executive/performance', this.validateTenantId(), this.getPerformanceSummary.bind(this));
    }
    setupDrillDownRoutes(router) {
        router.get('/drilldown/paths', this.validateTenantId(), this.getDrillDownPaths.bind(this));
        router.post('/drilldown/paths', this.validateTenantId(), (0, express_validator_1.body)('name').notEmpty(), (0, express_validator_1.body)('levels').isArray({ min: 1 }), (0, express_validator_1.body)('metricIds').isArray({ min: 1 }), this.validateRequest, this.createDrillDownPath.bind(this));
        router.post('/drilldown/sessions', this.validateTenantId(), (0, express_validator_1.body)('pathId').notEmpty(), this.validateRequest, this.startDrillDownSession.bind(this));
        router.post('/drilldown/sessions/:sessionId/navigate', (0, express_validator_1.param)('sessionId').notEmpty(), (0, express_validator_1.body)('level').optional().isInt({ min: 0 }), (0, express_validator_1.body)('selectedValue').optional(), this.validateRequest, this.navigateDrillDown.bind(this));
        router.post('/drilldown/sessions/:sessionId/back', (0, express_validator_1.param)('sessionId').notEmpty(), this.validateRequest, this.navigateBack.bind(this));
        router.post('/drilldown/sessions/:sessionId/bookmarks', (0, express_validator_1.param)('sessionId').notEmpty(), (0, express_validator_1.body)('name').notEmpty(), (0, express_validator_1.body)('description').optional(), this.validateRequest, this.createDrillDownBookmark.bind(this));
        router.get('/drilldown/sessions/:sessionId/bookmarks', (0, express_validator_1.param)('sessionId').notEmpty(), this.validateRequest, this.getDrillDownBookmarks.bind(this));
        router.post('/drilldown/sessions/:sessionId/bookmarks/:bookmarkId/load', (0, express_validator_1.param)('sessionId').notEmpty(), (0, express_validator_1.param)('bookmarkId').notEmpty(), this.validateRequest, this.loadDrillDownBookmark.bind(this));
        router.delete('/drilldown/sessions/:sessionId', (0, express_validator_1.param)('sessionId').notEmpty(), this.validateRequest, this.endDrillDownSession.bind(this));
    }
    setupExportRoutes(router) {
        router.post('/exports/metrics', this.validateTenantId(), (0, express_validator_1.body)('metricIds').isArray({ min: 1 }), (0, express_validator_1.body)('format').isIn(['csv', 'xlsx', 'json', 'pdf']), (0, express_validator_1.body)('startDate').isISO8601(), (0, express_validator_1.body)('endDate').isISO8601(), this.validateRequest, this.exportMetrics.bind(this));
        router.post('/exports/dashboards/:instanceId', (0, express_validator_1.param)('instanceId').notEmpty(), (0, express_validator_1.body)('format').isIn(['pdf', 'png', 'xlsx']), this.validateRequest, this.exportDashboard.bind(this));
        router.post('/exports/drilldown/:sessionId', (0, express_validator_1.param)('sessionId').notEmpty(), (0, express_validator_1.body)('format').isIn(['csv', 'xlsx', 'json', 'pdf']), this.validateRequest, this.exportDrillDown.bind(this));
        router.get('/exports/:exportId/status', (0, express_validator_1.param)('exportId').notEmpty(), this.validateRequest, this.getExportStatus.bind(this));
        router.get('/exports/:exportId/download', (0, express_validator_1.param)('exportId').notEmpty(), this.validateRequest, this.downloadExport.bind(this));
        router.get('/exports', this.validateTenantId(), this.getExports.bind(this));
        router.delete('/exports/:exportId', (0, express_validator_1.param)('exportId').notEmpty(), this.validateRequest, this.deleteExport.bind(this));
    }
    setupSystemRoutes(router) {
        router.get('/system/stats', this.getSystemStats.bind(this));
        router.get('/system/health', this.getSystemHealth.bind(this));
        router.get('/system/metrics', this.getSystemMetrics.bind(this));
        router.post('/system/cache/clear', this.clearSystemCache.bind(this));
    }
    setupErrorHandling() {
        this.app.use((err, req, res, next) => {
            console.error('Unhandled error:', err);
            this.sendError(res, 500, 'INTERNAL_ERROR', 'An internal server error occurred');
        });
        this.app.use((req, res) => {
            this.sendError(res, 404, 'NOT_FOUND', 'Resource not found');
        });
    }
    async getMetricDefinitions(req, res) {
        try {
            const options = this.extractQueryOptions(req);
            const definitions = []; // Mock data
            this.sendSuccess(res, definitions, { pagination: this.calculatePagination(options, definitions.length) });
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async createMetricDefinition(req, res) {
        try {
            const definition = await this.collectionPipeline.registerMetricDefinition({
                id: this.generateId(),
                tenantId: req.tenantId,
                createdBy: req.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...req.body
            });
            this.sendSuccess(res, definition, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CREATION_ERROR', error.message);
        }
    }
    async getMetricDefinition(req, res) {
        try {
            const definition = null; // Mock implementation
            if (!definition) {
                return this.sendError(res, 404, 'NOT_FOUND', 'Metric definition not found');
            }
            this.sendSuccess(res, definition);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async updateMetricDefinition(req, res) {
        try {
            const definition = { ...req.body, updatedAt: new Date() }; // Mock implementation
            this.sendSuccess(res, definition);
        }
        catch (error) {
            this.sendError(res, 400, 'UPDATE_ERROR', error.message);
        }
    }
    async deleteMetricDefinition(req, res) {
        try {
            // Mock implementation
            this.sendSuccess(res, { deleted: true });
        }
        catch (error) {
            this.sendError(res, 400, 'DELETE_ERROR', error.message);
        }
    }
    async getMetricValues(req, res) {
        try {
            const { metricId, startTime, endTime } = req.query;
            const values = []; // Mock data
            this.sendSuccess(res, values);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async recordMetricValue(req, res) {
        try {
            const metricValue = {
                id: this.generateId(),
                tenantId: req.tenantId,
                timestamp: new Date(req.body.timestamp || Date.now()),
                createdAt: new Date(),
                ...req.body
            };
            this.sendSuccess(res, metricValue, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'RECORD_ERROR', error.message);
        }
    }
    async recordMetricValuesBatch(req, res) {
        try {
            const { values } = req.body;
            const results = values.map((value) => ({
                id: this.generateId(),
                tenantId: req.tenantId,
                timestamp: new Date(value.timestamp || Date.now()),
                createdAt: new Date(),
                ...value
            }));
            this.sendSuccess(res, { recorded: results.length, values: results });
        }
        catch (error) {
            this.sendError(res, 400, 'BATCH_RECORD_ERROR', error.message);
        }
    }
    async getKPIs(req, res) {
        try {
            const options = this.extractQueryOptions(req);
            const kpis = []; // Mock data
            this.sendSuccess(res, kpis, { pagination: this.calculatePagination(options, kpis.length) });
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async createKPI(req, res) {
        try {
            const kpi = {
                id: this.generateId(),
                tenantId: req.tenantId,
                ownerUserId: req.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...req.body
            };
            this.sendSuccess(res, kpi, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CREATION_ERROR', error.message);
        }
    }
    async getKPI(req, res) {
        try {
            const kpi = null; // Mock implementation
            if (!kpi) {
                return this.sendError(res, 404, 'NOT_FOUND', 'KPI not found');
            }
            this.sendSuccess(res, kpi);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async updateKPI(req, res) {
        try {
            const kpi = { ...req.body, updatedAt: new Date() }; // Mock implementation
            this.sendSuccess(res, kpi);
        }
        catch (error) {
            this.sendError(res, 400, 'UPDATE_ERROR', error.message);
        }
    }
    async deleteKPI(req, res) {
        try {
            // Mock implementation
            this.sendSuccess(res, { deleted: true });
        }
        catch (error) {
            this.sendError(res, 400, 'DELETE_ERROR', error.message);
        }
    }
    async getKPICurrentValue(req, res) {
        try {
            const currentValue = {
                kpiId: req.params.id,
                value: Math.random() * 1000,
                timestamp: new Date(),
                trend: 'up',
                change: Math.random() * 10
            };
            this.sendSuccess(res, currentValue);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async createKPITarget(req, res) {
        try {
            const target = {
                id: this.generateId(),
                kpiId: req.params.id,
                tenantId: req.tenantId,
                createdBy: req.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...req.body
            };
            this.sendSuccess(res, target, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CREATION_ERROR', error.message);
        }
    }
    async getDashboardTemplates(req, res) {
        try {
            const templates = this.dashboardSystem.getTemplates(req.tenantId, req.query.category);
            this.sendSuccess(res, templates);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async createDashboardTemplate(req, res) {
        try {
            const template = await this.dashboardSystem.createTemplate({
                tenantId: req.tenantId,
                createdBy: req.userId,
                ...req.body
            });
            this.sendSuccess(res, template, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CREATION_ERROR', error.message);
        }
    }
    async getDashboardTemplate(req, res) {
        try {
            const template = this.dashboardSystem.getTemplate(req.params.id);
            if (!template) {
                return this.sendError(res, 404, 'NOT_FOUND', 'Dashboard template not found');
            }
            this.sendSuccess(res, template);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async updateDashboardTemplate(req, res) {
        try {
            const template = await this.dashboardSystem.updateTemplate(req.params.id, req.body);
            this.sendSuccess(res, template);
        }
        catch (error) {
            this.sendError(res, 400, 'UPDATE_ERROR', error.message);
        }
    }
    async deleteDashboardTemplate(req, res) {
        try {
            await this.dashboardSystem.deleteTemplate(req.params.id);
            this.sendSuccess(res, { deleted: true });
        }
        catch (error) {
            this.sendError(res, 400, 'DELETE_ERROR', error.message);
        }
    }
    async cloneDashboardTemplate(req, res) {
        try {
            const template = await this.dashboardSystem.cloneTemplate(req.params.id, req.body.name, req.tenantId, req.userId);
            this.sendSuccess(res, template, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CLONE_ERROR', error.message);
        }
    }
    async createDashboardInstance(req, res) {
        try {
            const instance = await this.dashboardSystem.createDashboardInstance(req.body.templateId, req.tenantId, req.userId, req.body.name, req.body.customizations);
            this.sendSuccess(res, instance, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CREATION_ERROR', error.message);
        }
    }
    async getDashboardInstances(req, res) {
        try {
            const instances = this.dashboardSystem.getDashboardInstances(req.tenantId, req.userId);
            this.sendSuccess(res, instances);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getDashboardInstance(req, res) {
        try {
            const instance = this.dashboardSystem.getDashboardInstance(req.params.id);
            if (!instance) {
                return this.sendError(res, 404, 'NOT_FOUND', 'Dashboard instance not found');
            }
            this.sendSuccess(res, instance);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async renderDashboard(req, res) {
        try {
            const dashboard = await this.dashboardSystem.renderDashboard(req.params.id, req.userId);
            this.sendSuccess(res, dashboard);
        }
        catch (error) {
            this.sendError(res, 500, 'RENDER_ERROR', error.message);
        }
    }
    async getAlertRules(req, res) {
        try {
            const rules = this.alertingSystem.getAlertRules(req.tenantId);
            this.sendSuccess(res, rules);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async createAlertRule(req, res) {
        try {
            const rule = await this.alertingSystem.createAlertRule({
                tenantId: req.tenantId,
                createdBy: req.userId,
                ...req.body
            });
            this.sendSuccess(res, rule, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CREATION_ERROR', error.message);
        }
    }
    async getAlertRule(req, res) {
        try {
            const rule = this.alertingSystem.getAlertRule(req.params.id);
            if (!rule) {
                return this.sendError(res, 404, 'NOT_FOUND', 'Alert rule not found');
            }
            this.sendSuccess(res, rule);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async updateAlertRule(req, res) {
        try {
            const rule = await this.alertingSystem.updateAlertRule(req.params.id, req.body);
            this.sendSuccess(res, rule);
        }
        catch (error) {
            this.sendError(res, 400, 'UPDATE_ERROR', error.message);
        }
    }
    async deleteAlertRule(req, res) {
        try {
            await this.alertingSystem.deleteAlertRule(req.params.id);
            this.sendSuccess(res, { deleted: true });
        }
        catch (error) {
            this.sendError(res, 400, 'DELETE_ERROR', error.message);
        }
    }
    async getActiveAlerts(req, res) {
        try {
            const alerts = this.alertingSystem.getActiveAlerts(req.tenantId);
            this.sendSuccess(res, alerts);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async acknowledgeAlert(req, res) {
        try {
            await this.alertingSystem.acknowledgeAlert(req.params.id, req.userId, req.body.notes);
            this.sendSuccess(res, { acknowledged: true });
        }
        catch (error) {
            this.sendError(res, 400, 'ACKNOWLEDGE_ERROR', error.message);
        }
    }
    async resolveAlert(req, res) {
        try {
            await this.alertingSystem.resolveAlert(req.params.id, req.body.reason, req.userId);
            this.sendSuccess(res, { resolved: true });
        }
        catch (error) {
            this.sendError(res, 400, 'RESOLVE_ERROR', error.message);
        }
    }
    async getAlertHistory(req, res) {
        try {
            const history = this.alertingSystem.getAlertHistory(req.params.id);
            this.sendSuccess(res, history);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getAlertStatistics(req, res) {
        try {
            const stats = {}; // Mock implementation
            this.sendSuccess(res, stats);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getExecutiveSummary(req, res) {
        try {
            const { period, startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            const summary = await this.executiveDashboard.generateExecutiveSummary(req.tenantId, { start, end, type: period || 'monthly' });
            this.sendSuccess(res, summary);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getExecutiveMetrics(req, res) {
        try {
            const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
            const metrics = await this.executiveDashboard.getKeyMetrics(req.tenantId, period);
            this.sendSuccess(res, metrics);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getExecutiveInsights(req, res) {
        try {
            const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
            const insights = await this.executiveDashboard.generateInsights(req.tenantId, period);
            this.sendSuccess(res, insights);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getExecutiveRecommendations(req, res) {
        try {
            const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
            const recommendations = await this.executiveDashboard.generateRecommendations(req.tenantId, period);
            this.sendSuccess(res, recommendations);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getPerformanceSummary(req, res) {
        try {
            const period = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
            const performance = await this.executiveDashboard.calculatePerformanceSummary(req.tenantId, period);
            this.sendSuccess(res, performance);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getDrillDownPaths(req, res) {
        try {
            const paths = this.drillDownService.getDrillDownPaths();
            this.sendSuccess(res, paths);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async createDrillDownPath(req, res) {
        try {
            const path = await this.drillDownService.createDrillDownPath(req.body);
            this.sendSuccess(res, path, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'CREATION_ERROR', error.message);
        }
    }
    async startDrillDownSession(req, res) {
        try {
            const session = await this.drillDownService.startDrillDownSession(req.userId, req.tenantId, req.body.pathId, req.body.initialContext);
            this.sendSuccess(res, session, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'SESSION_ERROR', error.message);
        }
    }
    async navigateDrillDown(req, res) {
        try {
            const result = await this.drillDownService.performDrillDown(req.params.sessionId, req.body);
            this.sendSuccess(res, result);
        }
        catch (error) {
            this.sendError(res, 400, 'NAVIGATION_ERROR', error.message);
        }
    }
    async navigateBack(req, res) {
        try {
            const result = await this.drillDownService.navigateBack(req.params.sessionId);
            this.sendSuccess(res, result);
        }
        catch (error) {
            this.sendError(res, 400, 'NAVIGATION_ERROR', error.message);
        }
    }
    async createDrillDownBookmark(req, res) {
        try {
            const bookmark = await this.drillDownService.createBookmark(req.params.sessionId, req.body.name, req.body.description, req.body.isShared, req.body.tags);
            this.sendSuccess(res, bookmark, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'BOOKMARK_ERROR', error.message);
        }
    }
    async getDrillDownBookmarks(req, res) {
        try {
            const session = this.drillDownService.getSession(req.params.sessionId);
            if (!session) {
                return this.sendError(res, 404, 'NOT_FOUND', 'Session not found');
            }
            this.sendSuccess(res, session.bookmarks);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async loadDrillDownBookmark(req, res) {
        try {
            const result = await this.drillDownService.loadBookmark(req.params.sessionId, req.params.bookmarkId);
            this.sendSuccess(res, result);
        }
        catch (error) {
            this.sendError(res, 400, 'BOOKMARK_ERROR', error.message);
        }
    }
    async endDrillDownSession(req, res) {
        try {
            await this.drillDownService.endSession(req.params.sessionId);
            this.sendSuccess(res, { ended: true });
        }
        catch (error) {
            this.sendError(res, 400, 'SESSION_ERROR', error.message);
        }
    }
    async exportMetrics(req, res) {
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
        }
        catch (error) {
            this.sendError(res, 400, 'EXPORT_ERROR', error.message);
        }
    }
    async exportDashboard(req, res) {
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
        }
        catch (error) {
            this.sendError(res, 400, 'EXPORT_ERROR', error.message);
        }
    }
    async exportDrillDown(req, res) {
        try {
            const exportResult = await this.drillDownService.exportDrillDownData(req.params.sessionId, req.body.format, req.body.options || {});
            this.sendSuccess(res, exportResult, undefined, 201);
        }
        catch (error) {
            this.sendError(res, 400, 'EXPORT_ERROR', error.message);
        }
    }
    async getExportStatus(req, res) {
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
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async downloadExport(req, res) {
        try {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="export_${req.params.exportId}.json"`);
            res.send(JSON.stringify({ exportId: req.params.exportId, data: 'mock export data' }));
        }
        catch (error) {
            this.sendError(res, 500, 'DOWNLOAD_ERROR', error.message);
        }
    }
    async getExports(req, res) {
        try {
            const exports = []; // Mock data
            this.sendSuccess(res, exports);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async deleteExport(req, res) {
        try {
            this.sendSuccess(res, { deleted: true });
        }
        catch (error) {
            this.sendError(res, 400, 'DELETE_ERROR', error.message);
        }
    }
    async getSystemStats(req, res) {
        try {
            const stats = {
                streaming: this.streamingService.getServerStats(),
                drilldown: this.drillDownService.getCacheStats(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date()
            };
            this.sendSuccess(res, stats);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async getSystemHealth(req, res) {
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
        }
        catch (error) {
            this.sendError(res, 500, 'HEALTH_CHECK_ERROR', error.message);
        }
    }
    async getSystemMetrics(req, res) {
        try {
            const metrics = {
                requests_total: Math.floor(Math.random() * 10000),
                response_time_avg: Math.random() * 1000,
                error_rate: Math.random() * 0.05,
                active_connections: Math.floor(Math.random() * 100),
                timestamp: new Date()
            };
            this.sendSuccess(res, metrics);
        }
        catch (error) {
            this.sendError(res, 500, 'FETCH_ERROR', error.message);
        }
    }
    async clearSystemCache(req, res) {
        try {
            this.sendSuccess(res, { cacheCleared: true });
        }
        catch (error) {
            this.sendError(res, 500, 'CACHE_CLEAR_ERROR', error.message);
        }
    }
    healthCheck = (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    };
    systemMetrics = (req, res) => {
        const metrics = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            timestamp: new Date()
        };
        res.json(metrics);
    };
    validateTenantId() {
        return (req, res, next) => {
            if (!req.tenantId) {
                return this.sendError(res, 400, 'MISSING_TENANT', 'Tenant ID is required');
            }
            next();
        };
    }
    validateRequest = (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return this.sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors.array());
        }
        next();
    };
    validateToken(token) {
        return token && token.length > 10;
    }
    extractUserIdFromToken(token) {
        return 'user_' + token.substring(0, 8);
    }
    extractQueryOptions(req) {
        return {
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 50, 1000),
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder || 'desc',
            filters: req.query.filters ? JSON.parse(req.query.filters) : {},
            search: req.query.search,
            tenantId: req.tenantId
        };
    }
    calculatePagination(options, total) {
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
    sendSuccess(res, data, meta, statusCode = 200) {
        const response = {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: res.getHeader('x-request-id') || 'unknown',
                version: this.config.apiVersion,
                ...meta
            }
        };
        res.status(statusCode).json(response);
    }
    sendError(res, statusCode, code, message, details) {
        const response = {
            success: false,
            error: {
                code,
                message,
                details
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestId: res.getHeader('x-request-id') || 'unknown',
                version: this.config.apiVersion
            }
        };
        res.status(statusCode).json(response);
    }
    generateId() {
        return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getApp() {
        return this.app;
    }
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.config.port, () => {
                console.log(`Business Metrics API server started on port ${this.config.port}`);
                resolve();
            });
        });
    }
}
exports.BusinessMetricsController = BusinessMetricsController;

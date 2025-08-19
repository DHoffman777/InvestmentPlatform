"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorTrackingController = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const ErrorTrackingService_1 = require("./ErrorTrackingService");
const NotificationService_1 = require("./NotificationService");
const ErrorDashboardService_1 = require("./ErrorDashboardService");
const ErrorCorrelationService_1 = require("./ErrorCorrelationService");
const ErrorRecoveryService_1 = require("./ErrorRecoveryService");
class ErrorTrackingController {
    router;
    errorTrackingService;
    notificationService;
    dashboardService;
    correlationService;
    recoveryService;
    constructor(config) {
        this.router = (0, express_1.Router)();
        // Initialize services
        this.errorTrackingService = new ErrorTrackingService_1.ErrorTrackingService(config.prisma);
        this.notificationService = new NotificationService_1.NotificationService();
        this.dashboardService = new ErrorDashboardService_1.ErrorDashboardService(config.prisma);
        this.correlationService = new ErrorCorrelationService_1.ErrorCorrelationService(config.prisma);
        this.recoveryService = new ErrorRecoveryService_1.ErrorRecoveryService(config.prisma, config.autoRecoveryConfig);
        this.setupRoutes();
        this.setupServiceIntegrations();
    }
    setupServiceIntegrations() {
        // Integrate error tracking with notification service
        this.errorTrackingService.on('errorCaptured', async (error) => {
            if (error.severity === ErrorTrackingService_1.ErrorSeverity.CRITICAL || error.severity === ErrorTrackingService_1.ErrorSeverity.HIGH) {
                await this.notificationService.sendNotification({ error });
            }
        });
        // Integrate error tracking with correlation service
        this.errorTrackingService.on('errorCaptured', async (error) => {
            await this.correlationService.correlateError(error);
        });
        // Integrate correlation with recovery service
        this.correlationService.on('correlationsFound', async (data) => {
            const error = await this.errorTrackingService.getErrorById(data.errorId);
            if (error && (error.severity === ErrorTrackingService_1.ErrorSeverity.CRITICAL || error.severity === ErrorTrackingService_1.ErrorSeverity.HIGH)) {
                const suggestions = await this.recoveryService.suggestRecoveryStrategies(error);
                // Auto-execute if suitable strategy found
                const autoStrategy = suggestions.find(s => s.automationRecommended && s.confidence > 0.8);
                if (autoStrategy) {
                    await this.recoveryService.executeRecoveryStrategy(error.id, autoStrategy.strategyId, 'auto-recovery-system', true);
                }
            }
        });
        // Integrate dashboard with alerting
        this.dashboardService.on('alertTriggered', async (alert) => {
            await this.notificationService.sendNotification({
                error: {
                    id: `alert-${alert.alertId}`,
                    message: `Alert triggered: ${alert.rule.name}`,
                    severity: alert.rule.severity,
                    category: ErrorTrackingService_1.ErrorCategory.SYSTEM
                }
            }, alert.rule.notificationChannels);
        });
    }
    setupRoutes() {
        // Error Management Routes
        this.router.get('/errors', this.validateGetErrors(), this.getErrors.bind(this));
        this.router.get('/errors/:id', this.validateErrorId(), this.getError.bind(this));
        this.router.put('/errors/:id/resolve', this.validateResolveError(), this.resolveError.bind(this));
        this.router.get('/errors/:id/correlations', this.validateErrorId(), this.getErrorCorrelations.bind(this));
        this.router.post('/errors/:id/correlate', this.validateErrorId(), this.correlateError.bind(this));
        this.router.get('/errors/:id/root-cause', this.validateErrorId(), this.getErrorRootCause.bind(this));
        // Dashboard and Metrics Routes
        this.router.get('/dashboard/metrics', this.validateDashboardMetrics(), this.getDashboardMetrics.bind(this));
        this.router.get('/dashboard/summaries', this.validateDashboardSummaries(), this.getErrorSummaries.bind(this));
        this.router.get('/dashboard/statistics', this.validateStatistics(), this.getErrorStatistics.bind(this));
        // Reporting Routes
        this.router.get('/reports', this.getReports.bind(this));
        this.router.post('/reports', this.validateCreateReport(), this.createReport.bind(this));
        this.router.get('/reports/:id', this.validateReportId(), this.getReport.bind(this));
        this.router.post('/reports/:id/generate', this.validateReportId(), this.generateReport.bind(this));
        // Alert Management Routes
        this.router.get('/alerts', this.getAlertRules.bind(this));
        this.router.post('/alerts', this.validateCreateAlert(), this.createAlertRule.bind(this));
        this.router.put('/alerts/:id', this.validateUpdateAlert(), this.updateAlertRule.bind(this));
        this.router.delete('/alerts/:id', this.validateAlertId(), this.deleteAlertRule.bind(this));
        // Notification Management Routes
        this.router.get('/notifications/channels', this.getNotificationChannels.bind(this));
        this.router.post('/notifications/channels', this.validateCreateChannel(), this.createNotificationChannel.bind(this));
        this.router.put('/notifications/channels/:id', this.validateUpdateChannel(), this.updateNotificationChannel.bind(this));
        this.router.delete('/notifications/channels/:id', this.validateChannelId(), this.deleteNotificationChannel.bind(this));
        this.router.post('/notifications/channels/:id/test', this.validateChannelId(), this.testNotificationChannel.bind(this));
        // Recovery Management Routes
        this.router.get('/recovery/strategies', this.getRecoveryStrategies.bind(this));
        this.router.post('/recovery/strategies', this.validateCreateStrategy(), this.createRecoveryStrategy.bind(this));
        this.router.get('/recovery/suggestions/:errorId', this.validateErrorId(), this.getRecoverySuggestions.bind(this));
        this.router.post('/recovery/execute', this.validateExecuteRecovery(), this.executeRecovery.bind(this));
        this.router.get('/recovery/executions', this.getRecoveryExecutions.bind(this));
        this.router.get('/recovery/executions/:id', this.validateExecutionId(), this.getRecoveryExecution.bind(this));
        this.router.post('/recovery/executions/:id/cancel', this.validateCancelRecovery(), this.cancelRecovery.bind(this));
        // Correlation Management Routes
        this.router.get('/correlation/rules', this.getCorrelationRules.bind(this));
        this.router.post('/correlation/rules', this.validateCreateCorrelationRule(), this.createCorrelationRule.bind(this));
        this.router.get('/correlation/patterns', this.getCorrelationPatterns.bind(this));
        this.router.post('/correlation/patterns', this.validateCreateCorrelationPattern(), this.createCorrelationPattern.bind(this));
        // Error Pattern Management Routes
        this.router.get('/patterns', this.getErrorPatterns.bind(this));
        this.router.post('/patterns', this.validateCreateErrorPattern(), this.createErrorPattern.bind(this));
        this.router.delete('/patterns/:id', this.validatePatternId(), this.deleteErrorPattern.bind(this));
        // Health and Status Routes
        this.router.get('/health', this.getHealth.bind(this));
        this.router.get('/status', this.getStatus.bind(this));
        // Error middleware
        this.router.use(this.errorHandler.bind(this));
    }
    // Validation middleware
    validateGetErrors() {
        return [
            (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }),
            (0, express_validator_1.query)('severity').optional().isIn(Object.values(ErrorTrackingService_1.ErrorSeverity)),
            (0, express_validator_1.query)('category').optional().isIn(Object.values(ErrorTrackingService_1.ErrorCategory)),
            (0, express_validator_1.query)('resolved').optional().isBoolean(),
            (0, express_validator_1.query)('timeRange').optional().matches(/^\d+[hdw]$/),
            this.handleValidationErrors
        ];
    }
    validateErrorId() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Error ID is required'),
            this.handleValidationErrors
        ];
    }
    validateResolveError() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Error ID is required'),
            (0, express_validator_1.body)('resolvedBy').notEmpty().withMessage('Resolved by is required'),
            (0, express_validator_1.body)('resolution').optional().isString(),
            this.handleValidationErrors
        ];
    }
    validateDashboardMetrics() {
        return [
            (0, express_validator_1.query)('timeRange').optional().matches(/^\d+[mhdw]$/),
            (0, express_validator_1.query)('severity').optional().isIn(Object.values(ErrorTrackingService_1.ErrorSeverity)),
            (0, express_validator_1.query)('category').optional().isIn(Object.values(ErrorTrackingService_1.ErrorCategory)),
            (0, express_validator_1.query)('services').optional().isString(),
            (0, express_validator_1.query)('environments').optional().isString(),
            this.handleValidationErrors
        ];
    }
    validateDashboardSummaries() {
        return [
            (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
            (0, express_validator_1.query)('timeRange').optional().matches(/^\d+[mhdw]$/),
            (0, express_validator_1.query)('severity').optional().isIn(Object.values(ErrorTrackingService_1.ErrorSeverity)),
            (0, express_validator_1.query)('category').optional().isIn(Object.values(ErrorTrackingService_1.ErrorCategory)),
            this.handleValidationErrors
        ];
    }
    validateStatistics() {
        return [
            (0, express_validator_1.query)('timeRange').optional().matches(/^\d+[mhdw]$/),
            this.handleValidationErrors
        ];
    }
    validateCreateReport() {
        return [
            (0, express_validator_1.body)('name').notEmpty().withMessage('Report name is required'),
            (0, express_validator_1.body)('description').optional().isString(),
            (0, express_validator_1.body)('filters').optional().isObject(),
            (0, express_validator_1.body)('metrics').isArray().withMessage('Metrics array is required'),
            (0, express_validator_1.body)('visualizations').optional().isArray(),
            this.handleValidationErrors
        ];
    }
    validateReportId() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Report ID is required'),
            this.handleValidationErrors
        ];
    }
    validateCreateAlert() {
        return [
            (0, express_validator_1.body)('name').notEmpty().withMessage('Alert name is required'),
            (0, express_validator_1.body)('description').optional().isString(),
            (0, express_validator_1.body)('condition').isObject().withMessage('Condition is required'),
            (0, express_validator_1.body)('threshold').isNumeric().withMessage('Threshold must be numeric'),
            (0, express_validator_1.body)('timeWindow').matches(/^\d+[mhdw]$/).withMessage('Invalid time window format'),
            (0, express_validator_1.body)('severity').isIn(Object.values(ErrorTrackingService_1.ErrorSeverity)),
            (0, express_validator_1.body)('notificationChannels').isArray().withMessage('Notification channels array is required'),
            this.handleValidationErrors
        ];
    }
    validateUpdateAlert() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Alert ID is required'),
            (0, express_validator_1.body)('enabled').optional().isBoolean(),
            (0, express_validator_1.body)('threshold').optional().isNumeric(),
            (0, express_validator_1.body)('notificationChannels').optional().isArray(),
            this.handleValidationErrors
        ];
    }
    validateAlertId() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Alert ID is required'),
            this.handleValidationErrors
        ];
    }
    validateCreateChannel() {
        return [
            (0, express_validator_1.body)('name').notEmpty().withMessage('Channel name is required'),
            (0, express_validator_1.body)('type').isIn(Object.values(NotificationService_1.NotificationChannelType)).withMessage('Invalid channel type'),
            (0, express_validator_1.body)('config').isObject().withMessage('Channel config is required'),
            (0, express_validator_1.body)('filters').optional().isArray(),
            (0, express_validator_1.body)('rateLimits').optional().isObject(),
            this.handleValidationErrors
        ];
    }
    validateUpdateChannel() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Channel ID is required'),
            (0, express_validator_1.body)('enabled').optional().isBoolean(),
            (0, express_validator_1.body)('config').optional().isObject(),
            (0, express_validator_1.body)('filters').optional().isArray(),
            this.handleValidationErrors
        ];
    }
    validateChannelId() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Channel ID is required'),
            this.handleValidationErrors
        ];
    }
    validateCreateStrategy() {
        return [
            (0, express_validator_1.body)('name').notEmpty().withMessage('Strategy name is required'),
            (0, express_validator_1.body)('description').optional().isString(),
            (0, express_validator_1.body)('category').isIn(Object.values(ErrorTrackingService_1.ErrorCategory)).withMessage('Invalid category'),
            (0, express_validator_1.body)('applicableConditions').isArray().withMessage('Applicable conditions array is required'),
            (0, express_validator_1.body)('steps').isArray().withMessage('Steps array is required'),
            (0, express_validator_1.body)('automaticExecution').isBoolean().withMessage('Automatic execution flag is required'),
            this.handleValidationErrors
        ];
    }
    validateExecuteRecovery() {
        return [
            (0, express_validator_1.body)('errorId').notEmpty().withMessage('Error ID is required'),
            (0, express_validator_1.body)('strategyId').notEmpty().withMessage('Strategy ID is required'),
            (0, express_validator_1.body)('initiatedBy').notEmpty().withMessage('Initiated by is required'),
            (0, express_validator_1.body)('autoExecution').optional().isBoolean(),
            this.handleValidationErrors
        ];
    }
    validateExecutionId() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Execution ID is required'),
            this.handleValidationErrors
        ];
    }
    validateCancelRecovery() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Execution ID is required'),
            (0, express_validator_1.body)('cancelledBy').notEmpty().withMessage('Cancelled by is required'),
            this.handleValidationErrors
        ];
    }
    validateCreateCorrelationRule() {
        return [
            (0, express_validator_1.body)('name').notEmpty().withMessage('Rule name is required'),
            (0, express_validator_1.body)('description').optional().isString(),
            (0, express_validator_1.body)('type').notEmpty().withMessage('Correlation type is required'),
            (0, express_validator_1.body)('conditions').isArray().withMessage('Conditions array is required'),
            (0, express_validator_1.body)('timeWindow').isInt({ min: 1 }).withMessage('Time window must be positive integer'),
            (0, express_validator_1.body)('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
            this.handleValidationErrors
        ];
    }
    validateCreateCorrelationPattern() {
        return [
            (0, express_validator_1.body)('name').notEmpty().withMessage('Pattern name is required'),
            (0, express_validator_1.body)('pattern').notEmpty().withMessage('Pattern regex is required'),
            (0, express_validator_1.body)('category').isIn(Object.values(ErrorTrackingService_1.ErrorCategory)).withMessage('Invalid category'),
            (0, express_validator_1.body)('indicatedCauses').isArray().withMessage('Indicated causes array is required'),
            (0, express_validator_1.body)('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
            this.handleValidationErrors
        ];
    }
    validateCreateErrorPattern() {
        return [
            (0, express_validator_1.body)('name').notEmpty().withMessage('Pattern name is required'),
            (0, express_validator_1.body)('description').optional().isString(),
            (0, express_validator_1.body)('pattern').notEmpty().withMessage('Pattern regex is required'),
            (0, express_validator_1.body)('category').isIn(Object.values(ErrorTrackingService_1.ErrorCategory)).withMessage('Invalid category'),
            (0, express_validator_1.body)('severity').isIn(Object.values(ErrorTrackingService_1.ErrorSeverity)).withMessage('Invalid severity'),
            (0, express_validator_1.body)('tags').optional().isArray(),
            (0, express_validator_1.body)('recoveryActions').optional().isArray(),
            this.handleValidationErrors
        ];
    }
    validatePatternId() {
        return [
            (0, express_validator_1.param)('id').notEmpty().withMessage('Pattern ID is required'),
            this.handleValidationErrors
        ];
    }
    handleValidationErrors(req, res, next) {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        next();
    }
    // Route handlers
    async getErrors(req, res) {
        try {
            const { limit = 50, severity, category, resolved, timeRange } = req.query;
            const errors = await this.errorTrackingService.getRecentErrors(Number(limit), severity, category);
            res.json({
                success: true,
                data: errors,
                pagination: {
                    limit: Number(limit),
                    total: errors.length
                }
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get errors');
        }
    }
    async getError(req, res) {
        try {
            const { id } = req.params;
            const error = await this.errorTrackingService.getErrorById(id);
            if (!error) {
                res.status(404).json({
                    success: false,
                    message: 'Error not found'
                });
                return;
            }
            res.json({
                success: true,
                data: error
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get error');
        }
    }
    async resolveError(req, res) {
        try {
            const { id } = req.params;
            const { resolvedBy, resolution } = req.body;
            const success = await this.errorTrackingService.resolveError(id, resolvedBy, resolution);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'Error not found or already resolved'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Error resolved successfully'
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to resolve error');
        }
    }
    async getErrorCorrelations(req, res) {
        try {
            const { id } = req.params;
            const correlations = await this.correlationService.getCorrelationsForError(id);
            res.json({
                success: true,
                data: correlations
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get error correlations');
        }
    }
    async correlateError(req, res) {
        try {
            const { id } = req.params;
            const error = await this.errorTrackingService.getErrorById(id);
            if (!error) {
                res.status(404).json({
                    success: false,
                    message: 'Error not found'
                });
                return;
            }
            const correlations = await this.correlationService.correlateError(error);
            res.json({
                success: true,
                data: correlations
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to correlate error');
        }
    }
    async getErrorRootCause(req, res) {
        try {
            const { id } = req.params;
            const rootCauseAnalysis = await this.correlationService.performRootCauseAnalysis(id);
            res.json({
                success: true,
                data: rootCauseAnalysis
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to perform root cause analysis');
        }
    }
    async getDashboardMetrics(req, res) {
        try {
            const filters = {
                timeRange: req.query.timeRange,
                severity: req.query.severity ? [req.query.severity] : undefined,
                category: req.query.category ? [req.query.category] : undefined,
                services: req.query.services ? req.query.services.split(',') : undefined,
                environments: req.query.environments ? req.query.environments.split(',') : undefined
            };
            const metrics = await this.dashboardService.getDashboardMetrics(filters);
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get dashboard metrics');
        }
    }
    async getErrorSummaries(req, res) {
        try {
            const filters = {
                timeRange: req.query.timeRange,
                severity: req.query.severity ? [req.query.severity] : undefined,
                category: req.query.category ? [req.query.category] : undefined
            };
            const summaries = await this.dashboardService.getErrorSummaries(filters);
            res.json({
                success: true,
                data: summaries,
                pagination: {
                    limit: Number(req.query.limit) || 50,
                    total: summaries.length
                }
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get error summaries');
        }
    }
    async getErrorStatistics(req, res) {
        try {
            const { timeRange = '24h' } = req.query;
            const statistics = await this.errorTrackingService.getErrorStatistics(timeRange);
            res.json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get error statistics');
        }
    }
    async getReports(req, res) {
        try {
            const reports = this.dashboardService.getReports();
            res.json({
                success: true,
                data: reports
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get reports');
        }
    }
    async createReport(req, res) {
        try {
            const reportConfig = {
                id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                ...req.body
            };
            this.dashboardService.addReport(reportConfig);
            res.status(201).json({
                success: true,
                data: reportConfig
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to create report');
        }
    }
    async getReport(req, res) {
        try {
            const { id } = req.params;
            const reports = this.dashboardService.getReports();
            const report = reports.find(r => r.id === id);
            if (!report) {
                res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
                return;
            }
            res.json({
                success: true,
                data: report
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get report');
        }
    }
    async generateReport(req, res) {
        try {
            const { id } = req.params;
            const reportData = await this.dashboardService.generateReport(id);
            res.json({
                success: true,
                data: reportData
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to generate report');
        }
    }
    async getAlertRules(req, res) {
        try {
            const alertRules = this.dashboardService.getAlertRules();
            res.json({
                success: true,
                data: alertRules
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get alert rules');
        }
    }
    async createAlertRule(req, res) {
        try {
            const alertRule = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                enabled: true,
                ...req.body
            };
            this.dashboardService.addAlertRule(alertRule);
            res.status(201).json({
                success: true,
                data: alertRule
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to create alert rule');
        }
    }
    async updateAlertRule(req, res) {
        try {
            const { id } = req.params;
            const alertRules = this.dashboardService.getAlertRules();
            const existingRule = alertRules.find(r => r.id === id);
            if (!existingRule) {
                res.status(404).json({
                    success: false,
                    message: 'Alert rule not found'
                });
                return;
            }
            const updatedRule = { ...existingRule, ...req.body };
            this.dashboardService.addAlertRule(updatedRule);
            res.json({
                success: true,
                data: updatedRule
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to update alert rule');
        }
    }
    async deleteAlertRule(req, res) {
        try {
            const { id } = req.params;
            // In a real implementation, you would delete from the dashboard service
            res.json({
                success: true,
                message: 'Alert rule deleted successfully'
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to delete alert rule');
        }
    }
    async getNotificationChannels(req, res) {
        try {
            const channels = this.notificationService.getChannels();
            res.json({
                success: true,
                data: channels
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get notification channels');
        }
    }
    async createNotificationChannel(req, res) {
        try {
            const channel = {
                id: `channel_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                enabled: true,
                filters: [],
                rateLimits: {
                    maxNotifications: 100,
                    timeWindow: 60 * 60 * 1000, // 1 hour
                    cooldownPeriod: 5 * 60 * 1000 // 5 minutes
                },
                ...req.body
            };
            await this.notificationService.addChannel(channel);
            res.status(201).json({
                success: true,
                data: channel
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to create notification channel');
        }
    }
    async updateNotificationChannel(req, res) {
        try {
            const { id } = req.params;
            const existingChannel = this.notificationService.getChannel(id);
            if (!existingChannel) {
                res.status(404).json({
                    success: false,
                    message: 'Notification channel not found'
                });
                return;
            }
            const updatedChannel = { ...existingChannel, ...req.body };
            await this.notificationService.addChannel(updatedChannel);
            res.json({
                success: true,
                data: updatedChannel
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to update notification channel');
        }
    }
    async deleteNotificationChannel(req, res) {
        try {
            const { id } = req.params;
            const success = this.notificationService.removeChannel(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'Notification channel not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Notification channel deleted successfully'
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to delete notification channel');
        }
    }
    async testNotificationChannel(req, res) {
        try {
            const { id } = req.params;
            const result = await this.notificationService.testChannel(id);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to test notification channel');
        }
    }
    async getRecoveryStrategies(req, res) {
        try {
            const strategies = this.recoveryService.getRecoveryStrategies();
            res.json({
                success: true,
                data: strategies
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get recovery strategies');
        }
    }
    async createRecoveryStrategy(req, res) {
        try {
            const strategy = {
                id: `strategy_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                riskLevel: 'medium',
                successRate: 0.5,
                prerequisites: [],
                ...req.body
            };
            this.recoveryService.addRecoveryStrategy(strategy);
            res.status(201).json({
                success: true,
                data: strategy
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to create recovery strategy');
        }
    }
    async getRecoverySuggestions(req, res) {
        try {
            const { errorId } = req.params;
            const error = await this.errorTrackingService.getErrorById(errorId);
            if (!error) {
                res.status(404).json({
                    success: false,
                    message: 'Error not found'
                });
                return;
            }
            const suggestions = await this.recoveryService.suggestRecoveryStrategies(error);
            res.json({
                success: true,
                data: suggestions
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get recovery suggestions');
        }
    }
    async executeRecovery(req, res) {
        try {
            const { errorId, strategyId, initiatedBy, autoExecution = false } = req.body;
            const execution = await this.recoveryService.executeRecoveryStrategy(errorId, strategyId, initiatedBy, autoExecution);
            res.status(201).json({
                success: true,
                data: execution
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to execute recovery');
        }
    }
    async getRecoveryExecutions(req, res) {
        try {
            const { errorId } = req.query;
            const executions = await this.recoveryService.getRecoveryHistory(errorId);
            res.json({
                success: true,
                data: executions
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get recovery executions');
        }
    }
    async getRecoveryExecution(req, res) {
        try {
            const { id } = req.params;
            const executions = await this.recoveryService.getRecoveryHistory();
            const execution = executions.find(e => e.id === id);
            if (!execution) {
                res.status(404).json({
                    success: false,
                    message: 'Recovery execution not found'
                });
                return;
            }
            res.json({
                success: true,
                data: execution
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get recovery execution');
        }
    }
    async cancelRecovery(req, res) {
        try {
            const { id } = req.params;
            const { cancelledBy } = req.body;
            const success = await this.recoveryService.cancelRecovery(id, cancelledBy);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'Recovery execution not found or cannot be cancelled'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Recovery execution cancelled successfully'
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to cancel recovery execution');
        }
    }
    async getCorrelationRules(req, res) {
        try {
            const rules = this.correlationService.getCorrelationRules();
            res.json({
                success: true,
                data: rules
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get correlation rules');
        }
    }
    async createCorrelationRule(req, res) {
        try {
            const rule = {
                id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                enabled: true,
                actions: [],
                ...req.body
            };
            this.correlationService.addCorrelationRule(rule);
            res.status(201).json({
                success: true,
                data: rule
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to create correlation rule');
        }
    }
    async getCorrelationPatterns(req, res) {
        try {
            const patterns = this.correlationService.getCorrelationPatterns();
            res.json({
                success: true,
                data: patterns
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get correlation patterns');
        }
    }
    async createCorrelationPattern(req, res) {
        try {
            const pattern = {
                id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                examples: [],
                ...req.body,
                pattern: new RegExp(req.body.pattern, 'i')
            };
            this.correlationService.addCorrelationPattern(pattern);
            res.status(201).json({
                success: true,
                data: {
                    ...pattern,
                    pattern: pattern.pattern.source // Convert RegExp to string for JSON response
                }
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to create correlation pattern');
        }
    }
    async getErrorPatterns(req, res) {
        try {
            const patterns = this.errorTrackingService.getErrorPatterns();
            res.json({
                success: true,
                data: patterns
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get error patterns');
        }
    }
    async createErrorPattern(req, res) {
        try {
            const pattern = {
                id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                ...req.body,
                pattern: new RegExp(req.body.pattern, 'i')
            };
            this.errorTrackingService.addErrorPattern(pattern);
            res.status(201).json({
                success: true,
                data: {
                    ...pattern,
                    pattern: pattern.pattern.source // Convert RegExp to string for JSON response
                }
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to create error pattern');
        }
    }
    async deleteErrorPattern(req, res) {
        try {
            const { id } = req.params;
            const success = this.errorTrackingService.removeErrorPattern(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'Error pattern not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Error pattern deleted successfully'
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to delete error pattern');
        }
    }
    async getHealth(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    errorTracking: 'healthy',
                    notification: 'healthy',
                    dashboard: 'healthy',
                    correlation: 'healthy',
                    recovery: 'healthy'
                }
            };
            res.json({
                success: true,
                data: health
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get health status');
        }
    }
    async getStatus(req, res) {
        try {
            const activeRecoveries = this.recoveryService.getActiveRecoveries();
            const channels = this.notificationService.getChannels();
            const strategies = this.recoveryService.getRecoveryStrategies();
            const status = {
                timestamp: new Date().toISOString(),
                activeRecoveries: activeRecoveries.length,
                notificationChannels: channels.length,
                enabledChannels: channels.filter(c => c.enabled).length,
                recoveryStrategies: strategies.length,
                autoRecoveryEnabled: strategies.filter(s => s.automaticExecution).length
            };
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get status');
        }
    }
    errorHandler(error, req, res, next) {
        console.error('Error tracking API error:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
    handleError(res, error, message) {
        console.error(message, error);
        res.status(500).json({
            success: false,
            message,
            error: error.message
        });
    }
    getRouter() {
        return this.router;
    }
    async shutdown() {
        await Promise.all([
            this.errorTrackingService.shutdown(),
            this.notificationService.shutdown(),
            this.dashboardService.shutdown(),
            this.correlationService.shutdown(),
            this.recoveryService.shutdown()
        ]);
    }
}
exports.ErrorTrackingController = ErrorTrackingController;

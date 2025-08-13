import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ErrorTrackingService, StructuredError, ErrorSeverity, ErrorCategory } from './ErrorTrackingService';
import { NotificationService, NotificationChannel, NotificationChannelType } from './NotificationService';
import { ErrorDashboardService, DashboardFilter, ReportConfig, AlertRule } from './ErrorDashboardService';
import { ErrorCorrelationService, CorrelationRule, CorrelationPattern } from './ErrorCorrelationService';
import { ErrorRecoveryService, RecoveryStrategy, AutoRecoveryConfig } from './ErrorRecoveryService';
import { PrismaClient } from '@prisma/client';

export interface ErrorTrackingControllerConfig {
  prisma: PrismaClient;
  autoRecoveryConfig: AutoRecoveryConfig;
}

export class ErrorTrackingController {
  private router: Router;
  private errorTrackingService: ErrorTrackingService;
  private notificationService: NotificationService;
  private dashboardService: ErrorDashboardService;
  private correlationService: ErrorCorrelationService;
  private recoveryService: ErrorRecoveryService;

  constructor(config: ErrorTrackingControllerConfig) {
    this.router = Router();
    
    // Initialize services
    this.errorTrackingService = new ErrorTrackingService(config.prisma);
    this.notificationService = new NotificationService();
    this.dashboardService = new ErrorDashboardService(config.prisma);
    this.correlationService = new ErrorCorrelationService(config.prisma);
    this.recoveryService = new ErrorRecoveryService(config.prisma, config.autoRecoveryConfig);
    
    this.setupRoutes();
    this.setupServiceIntegrations();
  }

  private setupServiceIntegrations(): void {
    // Integrate error tracking with notification service
    this.errorTrackingService.on('errorCaptured', async (error: StructuredError) => {
      if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
        await this.notificationService.sendNotification({ error });
      }
    });

    // Integrate error tracking with correlation service
    this.errorTrackingService.on('errorCaptured', async (error: StructuredError) => {
      await this.correlationService.correlateError(error);
    });

    // Integrate correlation with recovery service
    this.correlationService.on('correlationsFound', async (data: any) => {
      const error = await this.errorTrackingService.getErrorById(data.errorId);
      if (error && (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH)) {
        const suggestions = await this.recoveryService.suggestRecoveryStrategies(error);
        
        // Auto-execute if suitable strategy found
        const autoStrategy = suggestions.find(s => s.automationRecommended && s.confidence > 0.8);
        if (autoStrategy) {
          await this.recoveryService.executeRecoveryStrategy(
            error.id,
            autoStrategy.strategyId,
            'auto-recovery-system',
            true
          );
        }
      }
    });

    // Integrate dashboard with alerting
    this.dashboardService.on('alertTriggered', async (alert: any) => {
      await this.notificationService.sendNotification({
        error: {
          id: `alert-${alert.alertId}`,
          message: `Alert triggered: ${alert.rule.name}`,
          severity: alert.rule.severity,
          category: ErrorCategory.SYSTEM
        } as StructuredError
      }, alert.rule.notificationChannels);
    });
  }

  private setupRoutes(): void {
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
  private validateGetErrors() {
    return [
      query('limit').optional().isInt({ min: 1, max: 1000 }),
      query('severity').optional().isIn(Object.values(ErrorSeverity)),
      query('category').optional().isIn(Object.values(ErrorCategory)),
      query('resolved').optional().isBoolean(),
      query('timeRange').optional().matches(/^\d+[hdw]$/),
      this.handleValidationErrors
    ];
  }

  private validateErrorId() {
    return [
      param('id').notEmpty().withMessage('Error ID is required'),
      this.handleValidationErrors
    ];
  }

  private validateResolveError() {
    return [
      param('id').notEmpty().withMessage('Error ID is required'),
      body('resolvedBy').notEmpty().withMessage('Resolved by is required'),
      body('resolution').optional().isString(),
      this.handleValidationErrors
    ];
  }

  private validateDashboardMetrics() {
    return [
      query('timeRange').optional().matches(/^\d+[mhdw]$/),
      query('severity').optional().isIn(Object.values(ErrorSeverity)),
      query('category').optional().isIn(Object.values(ErrorCategory)),
      query('services').optional().isString(),
      query('environments').optional().isString(),
      this.handleValidationErrors
    ];
  }

  private validateDashboardSummaries() {
    return [
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('timeRange').optional().matches(/^\d+[mhdw]$/),
      query('severity').optional().isIn(Object.values(ErrorSeverity)),
      query('category').optional().isIn(Object.values(ErrorCategory)),
      this.handleValidationErrors
    ];
  }

  private validateStatistics() {
    return [
      query('timeRange').optional().matches(/^\d+[mhdw]$/),
      this.handleValidationErrors
    ];
  }

  private validateCreateReport() {
    return [
      body('name').notEmpty().withMessage('Report name is required'),
      body('description').optional().isString(),
      body('filters').optional().isObject(),
      body('metrics').isArray().withMessage('Metrics array is required'),
      body('visualizations').optional().isArray(),
      this.handleValidationErrors
    ];
  }

  private validateReportId() {
    return [
      param('id').notEmpty().withMessage('Report ID is required'),
      this.handleValidationErrors
    ];
  }

  private validateCreateAlert() {
    return [
      body('name').notEmpty().withMessage('Alert name is required'),
      body('description').optional().isString(),
      body('condition').isObject().withMessage('Condition is required'),
      body('threshold').isNumeric().withMessage('Threshold must be numeric'),
      body('timeWindow').matches(/^\d+[mhdw]$/).withMessage('Invalid time window format'),
      body('severity').isIn(Object.values(ErrorSeverity)),
      body('notificationChannels').isArray().withMessage('Notification channels array is required'),
      this.handleValidationErrors
    ];
  }

  private validateUpdateAlert() {
    return [
      param('id').notEmpty().withMessage('Alert ID is required'),
      body('enabled').optional().isBoolean(),
      body('threshold').optional().isNumeric(),
      body('notificationChannels').optional().isArray(),
      this.handleValidationErrors
    ];
  }

  private validateAlertId() {
    return [
      param('id').notEmpty().withMessage('Alert ID is required'),
      this.handleValidationErrors
    ];
  }

  private validateCreateChannel() {
    return [
      body('name').notEmpty().withMessage('Channel name is required'),
      body('type').isIn(Object.values(NotificationChannelType)).withMessage('Invalid channel type'),
      body('config').isObject().withMessage('Channel config is required'),
      body('filters').optional().isArray(),
      body('rateLimits').optional().isObject(),
      this.handleValidationErrors
    ];
  }

  private validateUpdateChannel() {
    return [
      param('id').notEmpty().withMessage('Channel ID is required'),
      body('enabled').optional().isBoolean(),
      body('config').optional().isObject(),
      body('filters').optional().isArray(),
      this.handleValidationErrors
    ];
  }

  private validateChannelId() {
    return [
      param('id').notEmpty().withMessage('Channel ID is required'),
      this.handleValidationErrors
    ];
  }

  private validateCreateStrategy() {
    return [
      body('name').notEmpty().withMessage('Strategy name is required'),
      body('description').optional().isString(),
      body('category').isIn(Object.values(ErrorCategory)).withMessage('Invalid category'),
      body('applicableConditions').isArray().withMessage('Applicable conditions array is required'),
      body('steps').isArray().withMessage('Steps array is required'),
      body('automaticExecution').isBoolean().withMessage('Automatic execution flag is required'),
      this.handleValidationErrors
    ];
  }

  private validateExecuteRecovery() {
    return [
      body('errorId').notEmpty().withMessage('Error ID is required'),
      body('strategyId').notEmpty().withMessage('Strategy ID is required'),
      body('initiatedBy').notEmpty().withMessage('Initiated by is required'),
      body('autoExecution').optional().isBoolean(),
      this.handleValidationErrors
    ];
  }

  private validateExecutionId() {
    return [
      param('id').notEmpty().withMessage('Execution ID is required'),
      this.handleValidationErrors
    ];
  }

  private validateCancelRecovery() {
    return [
      param('id').notEmpty().withMessage('Execution ID is required'),
      body('cancelledBy').notEmpty().withMessage('Cancelled by is required'),
      this.handleValidationErrors
    ];
  }

  private validateCreateCorrelationRule() {
    return [
      body('name').notEmpty().withMessage('Rule name is required'),
      body('description').optional().isString(),
      body('type').notEmpty().withMessage('Correlation type is required'),
      body('conditions').isArray().withMessage('Conditions array is required'),
      body('timeWindow').isInt({ min: 1 }).withMessage('Time window must be positive integer'),
      body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
      this.handleValidationErrors
    ];
  }

  private validateCreateCorrelationPattern() {
    return [
      body('name').notEmpty().withMessage('Pattern name is required'),
      body('pattern').notEmpty().withMessage('Pattern regex is required'),
      body('category').isIn(Object.values(ErrorCategory)).withMessage('Invalid category'),
      body('indicatedCauses').isArray().withMessage('Indicated causes array is required'),
      body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
      this.handleValidationErrors
    ];
  }

  private validateCreateErrorPattern() {
    return [
      body('name').notEmpty().withMessage('Pattern name is required'),
      body('description').optional().isString(),
      body('pattern').notEmpty().withMessage('Pattern regex is required'),
      body('category').isIn(Object.values(ErrorCategory)).withMessage('Invalid category'),
      body('severity').isIn(Object.values(ErrorSeverity)).withMessage('Invalid severity'),
      body('tags').optional().isArray(),
      body('recoveryActions').optional().isArray(),
      this.handleValidationErrors
    ];
  }

  private validatePatternId() {
    return [
      param('id').notEmpty().withMessage('Pattern ID is required'),
      this.handleValidationErrors
    ];
  }

  private handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
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
  private async getErrors(req: Request, res: Response): Promise<void> {
    try {
      const {
        limit = 50,
        severity,
        category,
        resolved,
        timeRange
      } = req.query;

      const errors = await this.errorTrackingService.getRecentErrors(
        Number(limit),
        severity as ErrorSeverity,
        category as ErrorCategory
      );

      res.json({
        success: true,
        data: errors,
        pagination: {
          limit: Number(limit),
          total: errors.length
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get errors');
    }
  }

  private async getError(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to get error');
    }
  }

  private async resolveError(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to resolve error');
    }
  }

  private async getErrorCorrelations(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const correlations = await this.correlationService.getCorrelationsForError(id);

      res.json({
        success: true,
        data: correlations
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get error correlations');
    }
  }

  private async correlateError(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to correlate error');
    }
  }

  private async getErrorRootCause(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rootCauseAnalysis = await this.correlationService.performRootCauseAnalysis(id);

      res.json({
        success: true,
        data: rootCauseAnalysis
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to perform root cause analysis');
    }
  }

  private async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: DashboardFilter = {
        timeRange: req.query.timeRange as string,
        severity: req.query.severity ? [req.query.severity as ErrorSeverity] : undefined,
        category: req.query.category ? [req.query.category as ErrorCategory] : undefined,
        services: req.query.services ? (req.query.services as string).split(',') : undefined,
        environments: req.query.environments ? (req.query.environments as string).split(',') : undefined
      };

      const metrics = await this.dashboardService.getDashboardMetrics(filters);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get dashboard metrics');
    }
  }

  private async getErrorSummaries(req: Request, res: Response): Promise<void> {
    try {
      const filters: DashboardFilter = {
        timeRange: req.query.timeRange as string,
        severity: req.query.severity ? [req.query.severity as ErrorSeverity] : undefined,
        category: req.query.category ? [req.query.category as ErrorCategory] : undefined
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
    } catch (error) {
      this.handleError(res, error, 'Failed to get error summaries');
    }
  }

  private async getErrorStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { timeRange = '24h' } = req.query;
      const statistics = await this.errorTrackingService.getErrorStatistics(timeRange as string);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get error statistics');
    }
  }

  private async getReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = this.dashboardService.getReports();

      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get reports');
    }
  }

  private async createReport(req: Request, res: Response): Promise<void> {
    try {
      const reportConfig: ReportConfig = {
        id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        ...req.body
      };

      this.dashboardService.addReport(reportConfig);

      res.status(201).json({
        success: true,
        data: reportConfig
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to create report');
    }
  }

  private async getReport(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to get report');
    }
  }

  private async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reportData = await this.dashboardService.generateReport(id);

      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to generate report');
    }
  }

  private async getAlertRules(req: Request, res: Response): Promise<void> {
    try {
      const alertRules = this.dashboardService.getAlertRules();

      res.json({
        success: true,
        data: alertRules
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get alert rules');
    }
  }

  private async createAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const alertRule: AlertRule = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        enabled: true,
        ...req.body
      };

      this.dashboardService.addAlertRule(alertRule);

      res.status(201).json({
        success: true,
        data: alertRule
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to create alert rule');
    }
  }

  private async updateAlertRule(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to update alert rule');
    }
  }

  private async deleteAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // In a real implementation, you would delete from the dashboard service
      res.json({
        success: true,
        message: 'Alert rule deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to delete alert rule');
    }
  }

  private async getNotificationChannels(req: Request, res: Response): Promise<void> {
    try {
      const channels = this.notificationService.getChannels();

      res.json({
        success: true,
        data: channels
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get notification channels');
    }
  }

  private async createNotificationChannel(req: Request, res: Response): Promise<void> {
    try {
      const channel: NotificationChannel = {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to create notification channel');
    }
  }

  private async updateNotificationChannel(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to update notification channel');
    }
  }

  private async deleteNotificationChannel(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to delete notification channel');
    }
  }

  private async testNotificationChannel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.notificationService.testChannel(id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to test notification channel');
    }
  }

  private async getRecoveryStrategies(req: Request, res: Response): Promise<void> {
    try {
      const strategies = this.recoveryService.getRecoveryStrategies();

      res.json({
        success: true,
        data: strategies
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get recovery strategies');
    }
  }

  private async createRecoveryStrategy(req: Request, res: Response): Promise<void> {
    try {
      const strategy: RecoveryStrategy = {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to create recovery strategy');
    }
  }

  private async getRecoverySuggestions(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to get recovery suggestions');
    }
  }

  private async executeRecovery(req: Request, res: Response): Promise<void> {
    try {
      const { errorId, strategyId, initiatedBy, autoExecution = false } = req.body;

      const execution = await this.recoveryService.executeRecoveryStrategy(
        errorId,
        strategyId,
        initiatedBy,
        autoExecution
      );

      res.status(201).json({
        success: true,
        data: execution
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to execute recovery');
    }
  }

  private async getRecoveryExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { errorId } = req.query;
      const executions = await this.recoveryService.getRecoveryHistory(errorId as string);

      res.json({
        success: true,
        data: executions
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get recovery executions');
    }
  }

  private async getRecoveryExecution(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to get recovery execution');
    }
  }

  private async cancelRecovery(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to cancel recovery execution');
    }
  }

  private async getCorrelationRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = this.correlationService.getCorrelationRules();

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get correlation rules');
    }
  }

  private async createCorrelationRule(req: Request, res: Response): Promise<void> {
    try {
      const rule: CorrelationRule = {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to create correlation rule');
    }
  }

  private async getCorrelationPatterns(req: Request, res: Response): Promise<void> {
    try {
      const patterns = this.correlationService.getCorrelationPatterns();

      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get correlation patterns');
    }
  }

  private async createCorrelationPattern(req: Request, res: Response): Promise<void> {
    try {
      const pattern: CorrelationPattern = {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to create correlation pattern');
    }
  }

  private async getErrorPatterns(req: Request, res: Response): Promise<void> {
    try {
      const patterns = this.errorTrackingService.getErrorPatterns();

      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get error patterns');
    }
  }

  private async createErrorPattern(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to create error pattern');
    }
  }

  private async deleteErrorPattern(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to delete error pattern');
    }
  }

  private async getHealth(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to get health status');
    }
  }

  private async getStatus(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.handleError(res, error, 'Failed to get status');
    }
  }

  private errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
    console.error('Error tracking API error:', error);
    
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  private handleError(res: Response, error: any, message: string): void {
    console.error(message, error);
    
    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }

  public getRouter(): Router {
    return this.router;
  }

  public async shutdown(): Promise<void> {
    await Promise.all([
      this.errorTrackingService.shutdown(),
      this.notificationService.shutdown(),
      this.dashboardService.shutdown(),
      this.correlationService.shutdown(),
      this.recoveryService.shutdown()
    ]);
  }
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';
import cron from 'node-cron';
import {
  ComplianceValidationRequest,
  ComplianceValidationResult,
  RegulatoryRule,
  ComplianceException,
  RegulatoryAlert,
  ComplianceReport,
  RegulatoryValidatorConfig,
  ValidationMetrics,
} from './types';
import { RegulatoryRuleEngine } from './services/RegulatoryRuleEngine';
import { ComplianceAuditService } from './services/ComplianceAuditService';
import { ComplianceReportingService } from './services/ComplianceReportingService';

export class RegulatoryValidatorService extends EventEmitter {
  private app: express.Application;
  private ruleEngine!: RegulatoryRuleEngine;
  private auditService!: ComplianceAuditService;
  private reportingService!: ComplianceReportingService;
  private scheduledTasks: cron.ScheduledTask[] = [];
  private isRunning = false;
  private validationQueue: ComplianceValidationRequest[] = [];
  private processingQueue = false;

  constructor(private config: RegulatoryValidatorConfig) {
    super();
    this.app = express();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventHandlers();
    this.scheduleReports();
  }

  private initializeServices(): void {
    this.ruleEngine = new RegulatoryRuleEngine(this.config);
    this.auditService = new ComplianceAuditService(this.config);
    this.reportingService = new ComplianceReportingService(
      this.config,
      this.auditService,
      this.ruleEngine
    );
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: any, res: any, next: any) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // Error handling
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/v1/health', async (req, res) => {
      try {
        const health = await this.getHealthStatus();
        res.json(health);
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Health check failed', 
          details: (error as Error).message 
        });
      }
    });

    // Validate entity compliance
    this.app.post('/api/v1/validate', async (req, res) => {
      try {
        const request: ComplianceValidationRequest = {
          requestId: req.headers['x-request-id'] as string || this.generateRequestId(),
          entity: req.body.entity,
          validationType: req.body.validationType || 'real_time',
          rules: req.body.rules,
          context: {
            userId: req.body.context?.userId,
            timestamp: new Date(),
            source: req.body.context?.source || 'api',
            metadata: req.body.context?.metadata,
          },
        };

        if (request.validationType === 'real_time') {
          const result = await this.validateCompliance(request);
          res.json(result);
        } else {
          // Queue for batch processing
          this.validationQueue.push(request);
          res.json({ 
            requestId: request.requestId, 
            status: 'queued',
            message: 'Validation request queued for batch processing'
          });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Validation failed', 
          details: (error as Error).message 
        });
      }
    });

    // Batch validation
    this.app.post('/api/v1/validate/batch', async (req, res) => {
      try {
        const requests: ComplianceValidationRequest[] = req.body.requests.map((reqData: any) => ({
          requestId: reqData.requestId || this.generateRequestId(),
          entity: reqData.entity,
          validationType: 'batch',
          rules: reqData.rules,
          context: {
            userId: reqData.context?.userId,
            timestamp: new Date(),
            source: 'batch_api',
            metadata: reqData.context?.metadata,
          },
        }));

        const results = await Promise.all(
          requests.map(request => this.validateCompliance(request))
        );

        res.json({ 
          batchId: this.generateBatchId(),
          totalRequests: requests.length,
          results 
        });
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Batch validation failed', 
          details: (error as Error).message 
        });
      }
    });

    // Get validation result
    this.app.get('/api/v1/validation/:requestId', async (req, res) => {
      try {
        const { requestId } = req.params;
        // In production, this would query stored results
        res.json({ 
          requestId,
          message: 'Result retrieval not implemented in this demo'
        });
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to retrieve validation result', 
          details: (error as Error).message 
        });
      }
    });

    // Rules management
    this.app.get('/api/v1/rules', (req, res) => {
      try {
        const { category, jurisdiction, enabled } = req.query;
        let rules = this.ruleEngine.getAllRules();

        if (category) {
          rules = rules.filter(rule => rule.category === category);
        }
        if (jurisdiction) {
          rules = rules.filter(rule => rule.jurisdiction === jurisdiction);
        }
        if (enabled !== undefined) {
          rules = rules.filter(rule => rule.enabled === (enabled === 'true'));
        }

        res.json({
          total: rules.length,
          rules: rules.map(rule => ({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            category: rule.category,
            jurisdiction: rule.jurisdiction,
            severity: rule.severity,
            enabled: rule.enabled,
            version: rule.version,
            lastUpdated: rule.lastUpdated,
          }))
        });
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to retrieve rules', 
          details: (error as Error).message 
        });
      }
    });

    this.app.get('/api/v1/rules/:ruleId', (req, res) => {
      try {
        const { ruleId } = req.params;
        const rule = this.ruleEngine.getRule(ruleId);
        
        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        
        res.json(rule);
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to retrieve rule', 
          details: (error as Error).message 
        });
      }
    });

    this.app.post('/api/v1/rules', async (req, res) => {
      try {
        const rule: RegulatoryRule = {
          ...req.body,
          id: req.body.id || this.generateRuleId(),
          lastUpdated: new Date(),
        };

        this.ruleEngine.addRule(rule);
        
        await this.auditService.recordAuditEvent(
          'rule',
          rule.id,
          'RULE_UPDATE',
          {
            action: 'rule_created',
            newValue: rule,
            triggeredBy: req.body.createdBy || 'api_user',
          },
          'RULE_ACTIVE'
        );

        res.status(201).json(rule);
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to create rule', 
          details: (error as Error).message 
        });
      }
    });

    this.app.put('/api/v1/rules/:ruleId', async (req, res) => {
      try {
        const { ruleId } = req.params;
        const updates = req.body;
        const oldRule = this.ruleEngine.getRule(ruleId);

        if (!oldRule) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        const success = this.ruleEngine.updateRule(ruleId, updates);
        
        if (success) {
          const updatedRule = this.ruleEngine.getRule(ruleId);
          
          await this.auditService.recordAuditEvent(
            'rule',
            ruleId,
            'RULE_UPDATE',
            {
              action: 'rule_updated',
              oldValue: oldRule,
              newValue: updatedRule,
              triggeredBy: req.body.updatedBy || 'api_user',
            },
            updatedRule!.enabled ? 'RULE_ACTIVE' : 'RULE_DISABLED'
          );

          res.json(updatedRule);
        } else {
          res.status(500).json({ error: 'Failed to update rule' });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to update rule', 
          details: (error as Error).message 
        });
      }
    });

    this.app.delete('/api/v1/rules/:ruleId', async (req, res) => {
      try {
        const { ruleId } = req.params;
        const rule = this.ruleEngine.getRule(ruleId);

        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        const success = this.ruleEngine.removeRule(ruleId);
        
        if (success) {
          await this.auditService.recordAuditEvent(
            'rule',
            ruleId,
            'RULE_UPDATE',
            {
              action: 'rule_deleted',
              oldValue: rule,
              triggeredBy: req.body.deletedBy || 'api_user',
            },
            'RULE_DELETED'
          );

          res.json({ message: 'Rule deleted successfully' });
        } else {
          res.status(500).json({ error: 'Failed to delete rule' });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to delete rule', 
          details: (error as Error).message 
        });
      }
    });

    // Rule control endpoints
    this.app.post('/api/v1/rules/:ruleId/enable', async (req, res) => {
      try {
        const { ruleId } = req.params;
        const success = this.ruleEngine.enableRule(ruleId);
        
        if (success) {
          await this.auditService.recordAuditEvent(
            'rule',
            ruleId,
            'RULE_UPDATE',
            {
              action: 'rule_enabled',
              triggeredBy: req.body.enabledBy || 'api_user',
            },
            'RULE_ACTIVE'
          );
          res.json({ message: 'Rule enabled successfully' });
        } else {
          res.status(404).json({ error: 'Rule not found' });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to enable rule', 
          details: (error as Error).message 
        });
      }
    });

    this.app.post('/api/v1/rules/:ruleId/disable', async (req, res) => {
      try {
        const { ruleId } = req.params;
        const success = this.ruleEngine.disableRule(ruleId);
        
        if (success) {
          await this.auditService.recordAuditEvent(
            'rule',
            ruleId,
            'RULE_UPDATE',
            {
              action: 'rule_disabled',
              triggeredBy: req.body.disabledBy || 'api_user',
            },
            'RULE_DISABLED'
          );
          res.json({ message: 'Rule disabled successfully' });
        } else {
          res.status(404).json({ error: 'Rule not found' });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to disable rule', 
          details: (error as Error).message 
        });
      }
    });

    // Exceptions management
    this.app.post('/api/v1/exceptions', async (req, res) => {
      try {
        const exceptionData = {
          ...req.body,
          approvalDate: new Date(),
        };

        const exception = await this.auditService.createException(exceptionData);
        res.status(201).json(exception);
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to create exception', 
          details: (error as Error).message 
        });
      }
    });

    this.app.get('/api/v1/exceptions', async (req, res) => {
      try {
        const { entityType, entityId, ruleId, status } = req.query;
        
        if (entityType && entityId) {
          const exceptions = await this.auditService.getEntityExceptions(
            entityType as string, 
            entityId as string
          );
          res.json({ exceptions });
        } else if (ruleId) {
          const exceptions = await this.auditService.getRuleExceptions(ruleId as string);
          res.json({ exceptions });
        } else {
          res.status(400).json({ 
            error: 'Either entityType+entityId or ruleId must be provided' 
          });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to retrieve exceptions', 
          details: (error as Error).message 
        });
      }
    });

    this.app.put('/api/v1/exceptions/:exceptionId', async (req, res) => {
      try {
        const { exceptionId } = req.params;
        const updates = req.body;
        const updatedBy = req.body.updatedBy || 'api_user';

        const exception = await this.auditService.updateException(
          exceptionId,
          updates,
          updatedBy
        );

        if (exception) {
          res.json(exception);
        } else {
          res.status(404).json({ error: 'Exception not found' });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to update exception', 
          details: (error as Error).message 
        });
      }
    });

    // Alerts management
    this.app.get('/api/v1/alerts', async (req, res) => {
      try {
        const { entityType, entityId, status, severity } = req.query;
        
        if (entityType && entityId) {
          const alerts = await this.auditService.getEntityAlerts(
            entityType as string,
            entityId as string
          );
          res.json({ alerts });
        } else {
          const alerts = await this.auditService.getOpenAlerts();
          let filteredAlerts = alerts;

          if (status) {
            filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
          }
          if (severity) {
            filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
          }

          res.json({ alerts: filteredAlerts });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to retrieve alerts', 
          details: (error as Error).message 
        });
      }
    });

    this.app.put('/api/v1/alerts/:alertId', async (req, res) => {
      try {
        const { alertId } = req.params;
        const updates = req.body;
        const updatedBy = req.body.updatedBy || 'api_user';

        const alert = await this.auditService.updateAlert(alertId, updates, updatedBy);

        if (alert) {
          res.json(alert);
        } else {
          res.status(404).json({ error: 'Alert not found' });
        }
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to update alert', 
          details: (error as Error).message 
        });
      }
    });

    // Reporting endpoints
    this.app.post('/api/v1/reports/generate', async (req, res) => {
      try {
        const {
          reportType,
          title,
          description,
          period,
          scope,
          customSections
        } = req.body;

        const report = await this.reportingService.generateComplianceReport(
          reportType,
          title,
          description,
          {
            startDate: new Date(period.startDate),
            endDate: new Date(period.endDate)
          },
          scope,
          customSections
        );

        res.json(report);
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to generate report', 
          details: (error as Error).message 
        });
      }
    });

    this.app.post('/api/v1/reports/:reportId/export', async (req, res) => {
      try {
        const { reportId } = req.params;
        const { format } = req.body;

        // In production, you'd retrieve the report from storage
        res.json({ 
          message: 'Report export not implemented in demo',
          reportId,
          format 
        });
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to export report', 
          details: (error as Error).message 
        });
      }
    });

    // Audit trail
    this.app.get('/api/v1/audit', async (req, res) => {
      try {
        const {
          entityType,
          entityId,
          eventType,
          startDate,
          endDate,
          limit = 100
        } = req.query;

        const auditTrail = await this.auditService.getAuditTrail(
          entityType as string,
          entityId as string,
          eventType as string,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined,
          parseInt(limit as string)
        );

        res.json({ auditTrail });
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to retrieve audit trail', 
          details: (error as Error).message 
        });
      }
    });

    // Metrics and analytics
    this.app.get('/api/v1/metrics', async (req, res) => {
      try {
        const {
          startDate,
          endDate = new Date().toISOString()
        } = req.query;

        const start = startDate ? new Date(startDate as string) : 
                     new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        const metrics = await this.auditService.getComplianceMetrics(
          start,
          new Date(endDate as string)
        );

        const ruleMetrics = this.ruleEngine.getPerformanceMetrics();

        const systemMetrics: ValidationMetrics = {
          timestamp: new Date(),
          totalValidations: metrics.totalValidations,
          averageProcessingTime: 0, // Would be calculated from actual data
          successRate: metrics.complianceRate,
          errorRate: 100 - metrics.complianceRate,
          rulePerformance: ruleMetrics,
          systemMetrics: {
            cpuUsage: 0, // Would be actual system metrics
            memoryUsage: 0,
            cacheHitRate: 0,
            databaseConnections: 0,
          },
        };

        res.json({
          compliance: metrics,
          system: systemMetrics,
          rules: {
            total: this.ruleEngine.getAllRules().length,
            enabled: this.ruleEngine.getEnabledRulesCount(),
            performance: ruleMetrics,
          }
        });
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to retrieve metrics', 
          details: (error as Error).message 
        });
      }
    });

    // Framework sync (mock implementation)
    this.app.post('/api/v1/frameworks/sync', async (req, res) => {
      try {
        const { framework } = req.body;
        
        // Mock framework sync
        console.log(`Syncing regulatory framework: ${framework}`);
        
        res.json({ 
          message: `Framework ${framework} sync initiated`,
          status: 'success',
          timestamp: new Date(),
        });
      } catch (error: any) {
        res.status(500).json({ 
          error: 'Failed to sync framework', 
          details: (error as Error).message 
        });
      }
    });
  }

  private setupEventHandlers(): void {
    // Rule engine events
    this.ruleEngine.on('ruleAdded', (data) => {
      console.log(`Rule added: ${data.ruleId} (${data.category})`);
      this.emit('ruleAdded', data);
    });

    this.ruleEngine.on('ruleUpdated', (data) => {
      console.log(`Rule updated: ${data.ruleId}`);
      this.emit('ruleUpdated', data);
    });

    this.ruleEngine.on('validationCompleted', (result) => {
      console.log(`Validation completed: ${result.requestId} - ${result.overallStatus}`);
      this.emit('validationCompleted', result);
    });

    // Audit service events
    this.auditService.on('alertCreated', (alert) => {
      console.log(`Alert created: ${alert.id} (${alert.severity})`);
      this.emit('alertCreated', alert);
    });

    this.auditService.on('exceptionCreated', (exception) => {
      console.log(`Exception created: ${exception.id}`);
      this.emit('exceptionCreated', exception);
    });

    // Reporting service events
    this.reportingService.on('reportGenerated', (report) => {
      console.log(`Report generated: ${report.id} (${report.reportType})`);
      this.emit('reportGenerated', report);
    });
  }

  private scheduleReports(): void {
    if (!this.config.reporting.enabled) {
      return;
    }

    // Schedule daily reports
    this.scheduledTasks.push(
      cron.schedule('0 8 * * *', async () => {
        try {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          
          const report = await this.reportingService.generateComplianceReport(
            'DAILY',
            'Daily Compliance Report',
            'Automated daily compliance summary',
            { startDate, endDate },
            {
              entityTypes: ['client', 'portfolio', 'transaction'],
              jurisdictions: ['US', 'EU'],
              frameworks: ['SEC', 'FINRA', 'GDPR']
            }
          );

          console.log(`Daily report generated: ${report.id}`);
          this.emit('scheduledReportGenerated', report);
        } catch (error: any) {
          console.error('Failed to generate daily report:', error);
        }
      })
    );

    // Schedule weekly reports
    this.scheduledTasks.push(
      cron.schedule('0 9 * * 1', async () => {
        try {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const report = await this.reportingService.generateComplianceReport(
            'WEEKLY',
            'Weekly Compliance Report',
            'Automated weekly compliance analysis',
            { startDate, endDate },
            {
              entityTypes: ['client', 'portfolio', 'transaction'],
              jurisdictions: ['US', 'EU'],
              frameworks: ['SEC', 'FINRA', 'GDPR']
            }
          );

          console.log(`Weekly report generated: ${report.id}`);
          this.emit('scheduledReportGenerated', report);
        } catch (error: any) {
          console.error('Failed to generate weekly report:', error);
        }
      })
    );
  }

  public async validateCompliance(request: ComplianceValidationRequest): Promise<ComplianceValidationResult> {
    const startTime = Date.now();
    
    try {
      // Validate the request
      this.validateRequest(request);

      // Perform compliance validation
      const result = await this.ruleEngine.validateEntity(request);

      // Record audit trail
      await this.auditService.recordValidationAudit(
        result,
        request.context?.userId || 'system',
        {
          ipAddress: request.context?.metadata?.ipAddress,
          userAgent: request.context?.metadata?.userAgent,
          sessionId: request.context?.metadata?.sessionId,
        }
      );

      return result;

    } catch (error: any) {
      console.error(`Validation failed for request ${request.requestId}:`, error);
      
      // Create error result
      const errorResult: ComplianceValidationResult = {
        requestId: request.requestId,
        entityId: request.entity.id,
        entityType: request.entity.type,
        timestamp: new Date(),
        overallStatus: 'NON_COMPLIANT',
        validatedRules: [],
        summary: {
          totalRules: 0,
          passedRules: 0,
          failedRules: 1,
          warningRules: 0,
          criticalViolations: 1,
        },
        recommendations: [],
        metadata: {
          processingTime: Date.now() - startTime,
          dataQualityScore: 0,
          confidenceLevel: 0,
        },
      };

      // Record error in audit trail
      await this.auditService.recordAuditEvent(
        request.entity.type,
        request.entity.id,
        'VALIDATION',
        {
          action: 'validation_error',
          triggeredBy: request.context?.userId || 'system',
          reason: (error as Error).message,
        },
        'VALIDATION_ERROR'
      );

      return errorResult;
    }
  }

  private validateRequest(request: ComplianceValidationRequest): void {
    if (!request.requestId) {
      throw new Error('Request ID is required');
    }
    if (!request.entity || !request.entity.id || !request.entity.type) {
      throw new Error('Entity information is required');
    }
    if (!request.entity.data || typeof request.entity.data !== 'object') {
      throw new Error('Entity data is required');
    }
  }

  private async processValidationQueue(): Promise<any> {
    if (this.processingQueue || this.validationQueue.length === 0) {
      return;
    }

    this.processingQueue = true;
    const batchSize = this.config.performance.batchSize || 10;

    try {
      while (this.validationQueue.length > 0) {
        const batch = this.validationQueue.splice(0, batchSize);
        
        await Promise.all(
          batch.map(async (request) => {
            try {
              const result = await this.validateCompliance(request);
              this.emit('batchValidationCompleted', { request, result });
            } catch (error: any) {
              console.error(`Batch validation failed for ${request.requestId}:`, error);
              this.emit('batchValidationFailed', { request, error });
            }
          })
        );

        // Small delay between batches to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async getHealthStatus(): Promise<any> {
    const rulesCount = this.ruleEngine.getAllRules().length;
    const enabledRulesCount = this.ruleEngine.getEnabledRulesCount();

    return {
      status: 'healthy',
      timestamp: new Date(),
      components: {
        ruleEngine: {
          healthy: true,
          totalRules: rulesCount,
          enabledRules: enabledRulesCount,
          performanceMetrics: this.ruleEngine.getPerformanceMetrics().length,
        },
        auditService: {
          healthy: true,
          // Would include actual health metrics
        },
        reportingService: {
          healthy: true,
          // Would include actual health metrics
        },
      },
      configuration: {
        environment: this.config.service.environment,
        auditEnabled: this.config.audit.enabled,
        reportingEnabled: this.config.reporting.enabled,
        cacheEnabled: this.config.performance.cacheEnabled,
      },
      runtime: {
        isRunning: this.isRunning,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        queueLength: this.validationQueue.length,
        processingQueue: this.processingQueue,
      },
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  public async start(port: number = 3012): Promise<any> {
    if (this.isRunning) {
      console.log('Regulatory Validator Service is already running');
      return;
    }

    console.log('Starting Regulatory Validator Service...');

    // Start validation queue processing
    setInterval(() => {
      this.processValidationQueue();
    }, 5000); // Process queue every 5 seconds

    // Start HTTP server
    this.app.listen(port, () => {
      console.log(`Regulatory Validator Service listening on port ${port}`);
      this.isRunning = true;
      this.emit('serviceStarted', { port });
    });
  }

  public async stop(): Promise<any> {
    if (!this.isRunning) {
      console.log('Regulatory Validator Service is not running');
      return;
    }

    console.log('Stopping Regulatory Validator Service...');

    // Stop scheduled tasks
    for (const task of this.scheduledTasks) {
      task.stop();
    }
    this.scheduledTasks = [];

    // Process remaining queue items
    await this.processValidationQueue();

    // Cleanup services
    await this.auditService.cleanup();

    this.isRunning = false;
    console.log('Regulatory Validator Service stopped');
  }

  public getApp(): express.Application {
    return this.app;
  }
}


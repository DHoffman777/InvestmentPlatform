import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import Joi from 'joi';
import { ComplianceMonitoringService } from './services/ComplianceMonitoringService';
import { RegulatoryFilingService } from './services/RegulatoryFilingService';
import {
  FinancialServicesConfig,
  ComplianceViolation,
  SuitabilityAssessment,
  AntiMoneyLaunderingCheck,
  FilingRequirement,
  ComplianceReport,
} from './types';

export class FinancialServicesComplianceService extends EventEmitter {
  private app: Express;
  private redis: Redis;
  private complianceMonitoring: ComplianceMonitoringService;
  private regulatoryFiling: RegulatoryFilingService;

  constructor(private config: FinancialServicesConfig) {
    super();
    
    this.app = express();
    this.redis = new Redis({
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password,
      db: config.database.redis.db,
      keyPrefix: 'finserv-compliance:',
    });

    this.complianceMonitoring = new ComplianceMonitoringService(config);
    this.regulatoryFiling = new RegulatoryFilingService(config);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/v1/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'financial-services-compliance',
        version: '1.0.0',
      });
    });

    // Compliance Violations
    this.app.post('/api/v1/violations', async (req, res) => {
      try {
        const violationSchema = Joi.object({
          violationType: Joi.string().valid('REGULATORY', 'POLICY', 'ETHICAL', 'OPERATIONAL').required(),
          severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
          regulator: Joi.string().optional(),
          regulation: Joi.string().required(),
          section: Joi.string().required(),
          description: Joi.string().required(),
          discoveredBy: Joi.string().required(),
          affectedParties: Joi.array().items(Joi.string()).required(),
          potentialImpact: Joi.string().required(),
          rootCause: Joi.string().required(),
          reportingRequired: Joi.boolean().default(false),
          reportingDeadline: Joi.date().optional(),
        });

        const { error, value } = violationSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const violation = await this.complianceMonitoring.recordViolation({
          ...value,
          discoveredDate: new Date(),
          correctiveActions: [],
          status: 'OPEN',
          monetary: {},
        });

        res.status(201).json({
          success: true,
          violationId: violation.id,
          message: 'Compliance violation recorded successfully',
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to record violation', details: (error as Error).message });
      }
    });

    this.app.get('/api/v1/violations', async (req, res) => {
      try {
        const { type, severity, status, regulator, startDate, endDate, page = 1, limit = 50 } = req.query;
        
        // In production, this would query the actual data store with filters
        const violations = await this.getViolations({
          type: type as string,
          severity: severity as string,
          status: status as string,
          regulator: regulator as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        });

        res.json({
          violations: violations.data,
          pagination: {
            page: violations.page,
            limit: violations.limit,
            total: violations.total,
            pages: Math.ceil(violations.total / violations.limit),
          },
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve violations', details: (error as Error).message });
      }
    });

    this.app.get('/api/v1/violations/:violationId', async (req, res) => {
      try {
        const violation = await this.getViolation(req.params.violationId);
        if (!violation) {
          return res.status(404).json({ error: 'Violation not found' });
        }
        res.json(violation);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve violation', details: (error as Error).message });
      }
    });

    this.app.post('/api/v1/violations/:violationId/corrective-actions', async (req, res) => {
      try {
        const actionSchema = Joi.object({
          action: Joi.string().required(),
          assignedTo: Joi.string().required(),
          dueDate: Joi.date().required(),
        });

        const { error, value } = actionSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const correctiveAction = await this.complianceMonitoring.assignCorrectiveAction(
          req.params.violationId,
          {
            ...value,
            status: 'ASSIGNED',
            effectiveness: 'NOT_ASSESSED',
          }
        );

        res.status(201).json({
          success: true,
          actionId: correctiveAction.id,
          message: 'Corrective action assigned successfully',
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to assign corrective action', details: (error as Error).message });
      }
    });

    // Suitability Assessments
    this.app.post('/api/v1/suitability/assess', async (req, res) => {
      try {
        const assessmentSchema = Joi.object({
          clientId: Joi.string().required(),
          productType: Joi.string().required(),
          conductedBy: Joi.string().required(),
        });

        const { error, value } = assessmentSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const assessment = await this.complianceMonitoring.conductSuitabilityAssessment(
          value.clientId,
          value.productType,
          value.conductedBy
        );

        res.status(201).json({
          success: true,
          assessmentId: assessment.id,
          determination: assessment.suitabilityDetermination,
          requiresSupervisoryReview: assessment.suitabilityDetermination !== 'SUITABLE',
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to conduct suitability assessment', details: (error as Error).message });
      }
    });

    this.app.get('/api/v1/suitability/client/:clientId', async (req, res) => {
      try {
        const assessments = await this.getClientSuitabilityAssessments(req.params.clientId);
        res.json({ assessments });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve assessments', details: (error as Error).message });
      }
    });

    // Best Execution Analysis
    this.app.post('/api/v1/best-execution/analyze', async (req, res) => {
      try {
        const analysisSchema = Joi.object({
          startDate: Joi.date().required(),
          endDate: Joi.date().required(),
          orderType: Joi.string().default('ALL'),
          securityType: Joi.string().default('ALL'),
        });

        const { error, value } = analysisSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const analysis = await this.complianceMonitoring.performBestExecutionAnalysis(
          value.startDate,
          value.endDate,
          value.orderType,
          value.securityType
        );

        res.status(201).json({
          success: true,
          analysisId: analysis.id,
          complianceAssessment: analysis.complianceAssessment,
          improvementCount: analysis.improvements.length,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to perform best execution analysis', details: (error as Error).message });
      }
    });

    // AML Checks
    this.app.post('/api/v1/aml/check', async (req, res) => {
      try {
        const amlSchema = Joi.object({
          clientId: Joi.string().required(),
          checkType: Joi.string().valid('INITIAL', 'PERIODIC', 'ENHANCED', 'TRANSACTION_BASED').default('PERIODIC'),
        });

        const { error, value } = amlSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const amlCheck = await this.complianceMonitoring.performAMLCheck(
          value.clientId,
          value.checkType
        );

        res.status(201).json({
          success: true,
          checkId: amlCheck.id,
          riskLevel: amlCheck.riskLevel,
          decision: amlCheck.complianceDecision,
          requiresEnhancedDueDiligence: amlCheck.dueDiligenceLevel === 'ENHANCED',
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to perform AML check', details: (error as Error).message });
      }
    });

    this.app.get('/api/v1/aml/client/:clientId', async (req, res) => {
      try {
        const amlChecks = await this.getClientAMLChecks(req.params.clientId);
        res.json({ amlChecks });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve AML checks', details: (error as Error).message });
      }
    });

    // Regulatory Filing
    this.app.post('/api/v1/filings', async (req, res) => {
      try {
        const filingSchema = Joi.object({
          firmId: Joi.string().required(),
          formType: Joi.string().valid('ADV', 'BD', 'PF', '13F', 'FOCUS', 'FORM_U4', 'FORM_U5', 'SAR', 'CTR', 'FORM_8K', 'FORM_10K', 'CUSTOM').required(),
          frequency: Joi.string().valid('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'AS_NEEDED', 'EVENT_DRIVEN').required(),
          dueDate: Joi.date().required(),
          filingPeriod: Joi.string().required(),
          assignedTo: Joi.string().optional(),
          estimatedHours: Joi.number().required(),
          dependencies: Joi.array().items(Joi.string()).default([]),
          regulatoryAuthority: Joi.string().required(),
          submissionMethod: Joi.string().valid('IARD', 'EDGAR', 'CRD', 'FINRA_GATEWAY', 'PAPER', 'EMAIL').required(),
        });

        const { error, value } = filingSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const filing = await this.regulatoryFiling.createFilingRequirement(
          value.firmId,
          {
            ...value,
            status: 'NOT_STARTED',
          }
        );

        res.status(201).json({
          success: true,
          filingId: filing.id,
          message: 'Filing requirement created successfully',
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create filing requirement', details: (error as Error).message });
      }
    });

    this.app.post('/api/v1/filings/form-adv/prepare', async (req, res) => {
      try {
        const schema = Joi.object({
          firmId: Joi.string().required(),
          filingPeriod: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const result = await this.regulatoryFiling.prepareFormADV(value.firmId, value.filingPeriod);

        res.json({
          success: true,
          filingId: result.filingId,
          readyToFile: result.readyToFile,
          validationSummary: {
            errors: result.validationResults.errors.length,
            warnings: result.validationResults.warnings.length,
          },
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to prepare Form ADV', details: (error as Error).message });
      }
    });

    this.app.post('/api/v1/filings/form-pf/prepare', async (req, res) => {
      try {
        const schema = Joi.object({
          firmId: Joi.string().required(),
          filingPeriod: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const result = await this.regulatoryFiling.prepareFormPF(value.firmId, value.filingPeriod);

        res.json({
          success: true,
          filingId: result.filingId,
          readyToFile: result.readyToFile,
          validationSummary: {
            errors: result.validationResults.errors.length,
            warnings: result.validationResults.warnings.length,
          },
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to prepare Form PF', details: (error as Error).message });
      }
    });

    this.app.post('/api/v1/filings/13f/prepare', async (req, res) => {
      try {
        const schema = Joi.object({
          firmId: Joi.string().required(),
          reportingPeriod: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const result = await this.regulatoryFiling.prepare13FHoldings(value.firmId, value.reportingPeriod);

        res.json({
          success: true,
          filingId: result.filingId,
          readyToFile: result.readyToFile,
          holdingsCount: result.holdingsData.holdings?.length || 0,
          totalValue: result.holdingsData.totalValue || 0,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to prepare 13F filing', details: (error as Error).message });
      }
    });

    this.app.post('/api/v1/filings/:filingId/submit', async (req, res) => {
      try {
        const schema = Joi.object({
          submittedBy: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const result = await this.regulatoryFiling.submitFiling(req.params.filingId, value.submittedBy);

        if (result.success) {
          res.json({
            success: true,
            confirmationNumber: result.confirmationNumber,
            message: 'Filing submitted successfully',
          });
        } else {
          res.status(400).json({
            success: false,
            errors: result.errors,
            message: 'Filing submission failed',
          });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to submit filing', details: (error as Error).message });
      }
    });

    this.app.get('/api/v1/filings/:filingId/status', async (req, res) => {
      try {
        const status = await this.regulatoryFiling.getFilingStatus(req.params.filingId);
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get filing status', details: (error as Error).message });
      }
    });

    this.app.get('/api/v1/filings/calendar/:firmId', async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
          return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const calendar = await this.regulatoryFiling.getFilingCalendar(
          req.params.firmId,
          new Date(startDate as string),
          new Date(endDate as string)
        );

        res.json(calendar);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get filing calendar', details: (error as Error).message });
      }
    });

    // Compliance Metrics and Reporting
    this.app.get('/api/v1/metrics', async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
          return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const metrics = await this.complianceMonitoring.getComplianceMetrics({
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        });

        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get compliance metrics', details: (error as Error).message });
      }
    });

    this.app.post('/api/v1/reports/generate', async (req, res) => {
      try {
        const reportSchema = Joi.object({
          reportType: Joi.string().valid('MONTHLY', 'QUARTERLY', 'ANNUAL', 'AD_HOC', 'REGULATORY_EXAM').required(),
          startDate: Joi.date().required(),
          endDate: Joi.date().required(),
          generatedBy: Joi.string().required(),
          sections: Joi.array().items(Joi.string()).default(['violations', 'suitability', 'aml', 'filings']),
        });

        const { error, value } = reportSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const report = await this.generateComplianceReport(value);

        res.status(201).json({
          success: true,
          reportId: report.id,
          message: 'Compliance report generated successfully',
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate report', details: (error as Error).message });
      }
    });

    // Trade Reporting
    this.app.post('/api/v1/trade-reporting/schedule', async (req, res) => {
      try {
        const schema = Joi.object({
          tradeId: Joi.string().required(),
          reportingRegime: Joi.string().valid('CAT', 'OATS', 'BLUE_SHEETS', 'LARGE_TRADER', 'FORM_13F', 'SECTION_16', 'EMIR', 'MIFID_II').required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: 'Validation failed', details: error.details });
        }

        const tradeReporting = await this.complianceMonitoring.scheduleTradeReporting(
          value.tradeId,
          value.reportingRegime
        );

        res.status(201).json({
          success: true,
          reportingId: tradeReporting.id,
          deadline: tradeReporting.reportingDeadline,
          regime: tradeReporting.reportingRegime,
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to schedule trade reporting', details: (error as Error).message });
      }
    });

    // Configuration and Settings
    this.app.get('/api/v1/config', (req, res) => {
      res.json({
        regulators: {
          sec: { enabled: this.config.regulators.sec.enabled },
          finra: { enabled: this.config.regulators.finra.enabled },
          cftc: { enabled: this.config.regulators.cftc.enabled },
        },
        compliance: this.config.compliance,
        monitoring: this.config.monitoring,
      });
    });
  }

  private setupEventHandlers(): void {
    // Handle compliance monitoring events
    this.complianceMonitoring.on('violationRecorded', (event) => {
      console.log(`Violation recorded: ${event.violationId} (${event.severity})`);
      this.emit('complianceViolation', event);
    });

    this.complianceMonitoring.on('suitabilityAssessmentCompleted', (event) => {
      console.log(`Suitability assessment completed: ${event.assessmentId} - ${event.determination}`);
      this.emit('suitabilityAssessment', event);
    });

    this.complianceMonitoring.on('amlCheckCompleted', (event) => {
      console.log(`AML check completed: ${event.checkId} - Risk Level: ${event.riskLevel}`);
      this.emit('amlCheck', event);
    });

    // Handle regulatory filing events
    this.regulatoryFiling.on('filingRequirementCreated', (event) => {
      console.log(`Filing requirement created: ${event.filingId} (${event.formType})`);
      this.emit('filingCreated', event);
    });

    this.regulatoryFiling.on('filingSubmitted', (event) => {
      console.log(`Filing submitted: ${event.filingId} - Confirmation: ${event.confirmationNumber}`);
      this.emit('filingSubmitted', event);
    });

    this.regulatoryFiling.on('filingDeadlineApproaching', (event) => {
      console.log(`Filing deadline approaching: ${event.filingId} - ${event.daysRemaining} days remaining`);
      this.emit('filingDeadline', event);
    });
  }

  // Helper methods
  private async getViolations(filters: any): Promise<{ data: ComplianceViolation[]; page: number; limit: number; total: number }> {
    // In production, this would query the actual data store with filters
    return {
      data: [],
      page: filters.page || 1,
      limit: filters.limit || 50,
      total: 0,
    };
  }

  private async getViolation(violationId: string): Promise<ComplianceViolation | null> {
    const data = await this.redis.get(`violation:${violationId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getClientSuitabilityAssessments(clientId: string): Promise<SuitabilityAssessment[]> {
    const assessmentIds = await this.redis.smembers(`client-suitability:${clientId}`);
    const assessments: SuitabilityAssessment[] = [];

    for (const assessmentId of assessmentIds) {
      const data = await this.redis.get(`suitability:${assessmentId}`);
      if (data) {
        assessments.push(JSON.parse(data));
      }
    }

    return assessments.sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  }

  private async getClientAMLChecks(clientId: string): Promise<AntiMoneyLaunderingCheck[]> {
    const checkIds = await this.redis.smembers(`client-aml:${clientId}`);
    const checks: AntiMoneyLaunderingCheck[] = [];

    for (const checkId of checkIds) {
      const data = await this.redis.get(`aml-check:${checkId}`);
      if (data) {
        checks.push(JSON.parse(data));
      }
    }

    return checks.sort((a, b) => b.checkDate.getTime() - a.checkDate.getTime());
  }

  private async generateComplianceReport(params: {
    reportType: string;
    startDate: Date;
    endDate: Date;
    generatedBy: string;
    sections: string[];
  }): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      id: this.generateReportId(),
      reportType: params.reportType as any,
      reportPeriod: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
      generatedDate: new Date(),
      generatedBy: params.generatedBy,
      sections: [],
      summary: {
        overallScore: 85,
        riskLevel: 'LOW',
        violations: {
          total: 0,
          open: 0,
          resolved: 0,
          byCategory: {},
        },
        regulatory: {
          examinations: 0,
          findings: 0,
          fines: 0,
          totalFineAmount: 0,
        },
        operational: {
          trainingCompliance: 95,
          systemUptime: 99.9,
          processEfficiency: 88,
        },
        trends: {
          improving: ['Training Compliance'],
          declining: [],
          stable: ['System Uptime'],
        },
      },
      recommendations: ['Continue monitoring training completion rates'],
      actionItems: [],
      attachments: [],
      distribution: [],
      confidentialityLevel: 'INTERNAL',
    };

    // Store report
    await this.redis.setex(
      `report:${report.id}`,
      86400 * 365 * 7,
      JSON.stringify(report)
    );

    return report;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.service.port, this.config.service.host, () => {
        console.log(`Financial Services Compliance Service running on ${this.config.service.host}:${this.config.service.port}`);
        resolve();
      });
    });
  }

  public async cleanup(): Promise<void> {
    await this.complianceMonitoring.cleanup();
    await this.regulatoryFiling.cleanup();
    await this.redis.quit();
  }
}
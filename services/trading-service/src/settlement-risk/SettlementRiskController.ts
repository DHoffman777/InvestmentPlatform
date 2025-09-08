import express, { Request, Response, NextFunction } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import rateLimit from 'express-rate-limit';
import { SettlementRiskCalculationEngine } from './SettlementRiskCalculationEngine';
import { CounterpartyRiskAssessmentService } from './CounterpartyRiskAssessmentService';
import { SettlementTimelineTrackingService } from './SettlementTimelineTrackingService';
import { PreSettlementRiskChecksService } from './PreSettlementRiskChecksService';
import { SettlementFailurePredictionService } from './SettlementFailurePredictionService';
import { RiskMitigationWorkflowsService } from './RiskMitigationWorkflowsService';
import { SettlementRiskReportingService } from './SettlementRiskReportingService';

// Rate limiting configurations
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Rate limit exceeded for sensitive operations' }
});

const reportingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit report generation to 10 per hour
  message: { error: 'Report generation rate limit exceeded' }
});

// Authentication middleware interface
interface AuthenticatedRequest extends Request {
  user?: any; // Simplified to avoid type conflicts
}

export class SettlementRiskController {
  private router: express.Router;
  private riskCalculationEngine: SettlementRiskCalculationEngine;
  private counterpartyRiskService: CounterpartyRiskAssessmentService;
  private timelineTrackingService: SettlementTimelineTrackingService;
  private preSettlementChecksService: PreSettlementRiskChecksService;
  private failurePredictionService: SettlementFailurePredictionService;
  private mitigationWorkflowsService: RiskMitigationWorkflowsService;
  private reportingService: SettlementRiskReportingService;

  constructor() {
    this.router = express.Router();
    this.riskCalculationEngine = new SettlementRiskCalculationEngine();
    this.counterpartyRiskService = new CounterpartyRiskAssessmentService();
    this.timelineTrackingService = new SettlementTimelineTrackingService();
    this.preSettlementChecksService = new PreSettlementRiskChecksService();
    this.failurePredictionService = new SettlementFailurePredictionService();
    this.mitigationWorkflowsService = new RiskMitigationWorkflowsService();
    this.reportingService = new SettlementRiskReportingService();

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Apply standard rate limiting to all routes
    this.router.use(standardRateLimit);

    // Risk Calculation Engine Routes
    this.router.post('/risk/calculate',
      strictRateLimit,
      this.authenticateUser as any,
      this.validateRiskCalculationInput() as any,
      this.validateRequest,
      this.calculateSettlementRisk.bind(this) as any
    );

    this.router.get('/risk/assessment/:instructionId',
      this.authenticateUser as any,
      param('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      this.validateRequest,
      this.getRiskAssessment.bind(this) as any
    );

    this.router.get('/risk/assessments',
      this.authenticateUser as any,
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100') as any,
      query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative)') as any,
      this.validateRequest,
      this.getAllRiskAssessments.bind(this) as any
    );

    this.router.get('/risk/high-risk',
      this.authenticateUser as any,
      this.getHighRiskInstructions.bind(this) as any
    );

    this.router.get('/risk/summary',
      this.authenticateUser as any,
      this.getRiskSummary.bind(this) as any
    );

    // Counterparty Risk Assessment Routes
    this.router.post('/counterparty',
      strictRateLimit,
      this.authenticateUser as any,
      this.validateCounterpartyProfile() as any,
      this.validateRequest,
      this.createCounterpartyProfile.bind(this) as any
    );

    this.router.put('/counterparty/:counterpartyId',
      this.authenticateUser as any,
      param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format') as any,
      this.validateRequest,
      this.updateCounterpartyProfile.bind(this) as any
    );

    this.router.post('/counterparty/:counterpartyId/risk-assessment',
      this.authenticateUser as any,
      param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format') as any,
      this.validateRequest,
      this.performCounterpartyRiskAssessment.bind(this) as any
    );

    this.router.get('/counterparty/:counterpartyId',
      this.authenticateUser as any,
      param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format') as any,
      this.validateRequest,
      this.getCounterpartyProfile.bind(this) as any
    );

    this.router.get('/counterparty/:counterpartyId/risk-metrics',
      this.authenticateUser as any,
      param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format') as any,
      this.validateRequest,
      this.getCounterpartyRiskMetrics.bind(this) as any
    );

    this.router.get('/counterparties',
      this.authenticateUser as any,
      this.getAllCounterparties.bind(this) as any
    );

    this.router.get('/counterparties/high-risk',
      this.authenticateUser as any,
      this.getHighRiskCounterparties.bind(this) as any
    );

    this.router.post('/counterparty/:counterpartyId/exposure-limit',
      this.authenticateUser as any,
      param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format') as any,
      this.validateExposureLimit() as any,
      this.validateRequest,
      this.addExposureLimit.bind(this) as any
    );

    this.router.post('/counterparty/:counterpartyId/credit-event',
      this.authenticateUser as any,
      param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format') as any,
      this.validateCreditEvent() as any,
      this.validateRequest,
      this.recordCreditEvent.bind(this) as any
    );

    // Settlement Timeline Tracking Routes
    this.router.post('/settlement/instruction',
      this.authenticateUser as any,
      this.validateSettlementInstruction() as any,
      this.validateRequest,
      this.createSettlementInstruction.bind(this) as any
    );

    this.router.put('/settlement/:instructionId/milestone/:milestoneType',
      this.authenticateUser as any,
      param('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      param('milestoneType').isString().withMessage('Milestone type is required') as any,
      body('status').isIn(['COMPLETED', 'DELAYED', 'FAILED', 'SKIPPED']).withMessage('Invalid status') as any,
      body('notes').optional().isString() as any,
      this.validateRequest,
      this.updateMilestoneStatus.bind(this) as any
    );

    this.router.get('/settlement/:instructionId/timeline',
      this.authenticateUser as any,
      param('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      this.validateRequest,
      this.getSettlementTimeline.bind(this) as any
    );

    this.router.get('/settlement/instructions',
      this.authenticateUser as any,
      query('status').optional().isString() as any,
      query('counterpartyId').optional().isUUID() as any,
      this.validateRequest,
      this.getSettlementInstructions.bind(this) as any
    );

    this.router.get('/settlement/milestones/pending',
      this.authenticateUser as any,
      this.getPendingMilestones.bind(this) as any
    );

    this.router.get('/settlement/milestones/overdue',
      this.authenticateUser as any,
      this.getOverdueMilestones.bind(this) as any
    );

    this.router.get('/settlement/alerts',
      this.authenticateUser as any,
      query('severity').optional().isIn(['INFO', 'WARNING', 'CRITICAL']) as any,
      this.validateRequest,
      this.getActiveAlerts.bind(this) as any
    );

    this.router.put('/settlement/alert/:alertId/acknowledge',
      this.authenticateUser as any,
      param('alertId').isUUID().withMessage('Invalid alert ID format') as any,
      this.validateRequest,
      this.acknowledgeAlert.bind(this) as any
    );

    this.router.get('/settlement/performance-report',
      this.authenticateUser as any,
      query('period').isString().withMessage('Period is required') as any,
      query('startDate').isISO8601().withMessage('Valid start date is required') as any,
      query('endDate').isISO8601().withMessage('Valid end date is required') as any,
      this.validateRequest,
      this.generatePerformanceReport.bind(this) as any
    );

    // Pre-Settlement Risk Checks Routes
    this.router.post('/pre-settlement/checks',
      strictRateLimit,
      this.authenticateUser as any,
      this.validateTradeOrder() as any,
      this.validateRequest,
      this.executePreSettlementChecks.bind(this) as any
    );

    this.router.get('/pre-settlement/check-suite/:suiteId',
      this.authenticateUser as any,
      param('suiteId').isUUID().withMessage('Invalid suite ID format') as any,
      this.validateRequest,
      this.getRiskCheckSuite.bind(this) as any
    );

    this.router.get('/pre-settlement/history/:orderId',
      this.authenticateUser as any,
      param('orderId').isUUID().withMessage('Invalid order ID format') as any,
      this.validateRequest,
      this.getRiskCheckHistory.bind(this) as any
    );

    this.router.post('/pre-settlement/bypass/:suiteId/:checkId',
      strictRateLimit,
      this.authenticateUser as any,
      param('suiteId').isUUID().withMessage('Invalid suite ID format') as any,
      param('checkId').isUUID().withMessage('Invalid check ID format') as any,
      body('bypassReason').isString().isLength({ min: 10 }).withMessage('Bypass reason must be at least 10 characters') as any,
      this.validateRequest,
      this.bypassRiskCheck.bind(this) as any
    );

    this.router.get('/pre-settlement/alerts',
      this.authenticateUser as any,
      this.getRiskCheckAlerts.bind(this) as any
    );

    this.router.get('/pre-settlement/summary',
      this.authenticateUser as any,
      query('timeFrame').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']) as any,
      this.validateRequest,
      this.getRiskCheckSummary.bind(this) as any
    );

    this.router.post('/pre-settlement/risk-limit',
      strictRateLimit,
      this.authenticateUser as any,
      this.validateRiskLimit() as any,
      this.validateRequest,
      this.addRiskLimit.bind(this) as any
    );

    this.router.post('/pre-settlement/compliance-rule',
      strictRateLimit,
      this.authenticateUser as any,
      this.validateComplianceRule() as any,
      this.validateRequest,
      this.addComplianceRule.bind(this) as any
    );

    // Settlement Failure Prediction Routes
    this.router.post('/prediction/settlement-failure',
      strictRateLimit,
      this.authenticateUser as any,
      this.validatePredictionInput() as any,
      this.validateRequest,
      this.predictSettlementFailure.bind(this) as any
    );

    this.router.get('/prediction/:instructionId',
      this.authenticateUser as any,
      param('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      this.validateRequest,
      this.getLatestPrediction.bind(this) as any
    );

    this.router.get('/prediction/:instructionId/history',
      this.authenticateUser as any,
      param('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      this.validateRequest,
      this.getPredictionHistory.bind(this) as any
    );

    this.router.get('/predictions/high-risk',
      this.authenticateUser as any,
      query('threshold').optional().isFloat({ min: 0, max: 1 }) as any,
      this.validateRequest,
      this.getHighRiskPredictions.bind(this) as any
    );

    this.router.post('/prediction/:instructionId/feedback',
      this.authenticateUser as any,
      param('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      body('actualOutcome').isIn(['SUCCESS', 'FAILURE']).withMessage('Invalid outcome') as any,
      body('actualDelayDays').optional().isFloat({ min: 0 }) as any,
      this.validateRequest,
      this.updatePredictionAccuracy.bind(this) as any
    );

    this.router.get('/prediction/model/performance',
      this.authenticateUser as any,
      query('modelVersion').optional().isString() as any,
      this.validateRequest,
      this.getModelPerformance.bind(this) as any
    );

    this.router.get('/prediction/patterns',
      this.authenticateUser as any,
      this.getFailurePatterns.bind(this) as any
    );

    this.router.get('/prediction/summary',
      this.authenticateUser as any,
      query('timeFrame').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']) as any,
      this.validateRequest,
      this.getPredictionSummary.bind(this) as any
    );

    // Risk Mitigation Workflows Routes
    this.router.post('/workflow/trigger',
      strictRateLimit,
      this.authenticateUser as any,
      body('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      body('triggerData').isObject().withMessage('Trigger data is required') as any,
      body('workflowId').optional().isUUID() as any,
      this.validateRequest,
      this.triggerWorkflow.bind(this) as any
    );

    this.router.get('/workflow/execution/:executionId',
      this.authenticateUser as any,
      param('executionId').isUUID().withMessage('Invalid execution ID format') as any,
      this.validateRequest,
      this.getWorkflowExecution.bind(this) as any
    );

    this.router.get('/workflow/instruction/:instructionId',
      this.authenticateUser as any,
      param('instructionId').isUUID().withMessage('Invalid instruction ID format') as any,
      this.validateRequest,
      this.getInstructionWorkflows.bind(this) as any
    );

    this.router.get('/workflows/active',
      this.authenticateUser as any,
      this.getActiveWorkflowExecutions.bind(this) as any
    );

    this.router.put('/workflow/execution/:executionId/pause',
      strictRateLimit,
      this.authenticateUser as any,
      param('executionId').isUUID().withMessage('Invalid execution ID format') as any,
      body('reason').isString().withMessage('Reason is required') as any,
      this.validateRequest,
      this.pauseWorkflowExecution.bind(this) as any
    );

    this.router.put('/workflow/execution/:executionId/resume',
      this.authenticateUser as any,
      param('executionId').isUUID().withMessage('Invalid execution ID format') as any,
      this.validateRequest,
      this.resumeWorkflowExecution.bind(this) as any
    );

    this.router.put('/workflow/execution/:executionId/cancel',
      strictRateLimit,
      this.authenticateUser as any,
      param('executionId').isUUID().withMessage('Invalid execution ID format') as any,
      body('reason').isString().withMessage('Reason is required') as any,
      this.validateRequest,
      this.cancelWorkflowExecution.bind(this) as any
    );

    this.router.get('/workflows',
      this.authenticateUser as any,
      this.getAllWorkflows.bind(this) as any
    );

    this.router.post('/workflow',
      strictRateLimit,
      this.authenticateUser as any,
      this.validateWorkflow() as any,
      this.validateRequest,
      this.createWorkflow.bind(this) as any
    );

    this.router.get('/workflow/report',
      this.authenticateUser as any,
      query('timeFrame').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']) as any,
      this.validateRequest,
      this.getWorkflowReport.bind(this) as any
    );

    // Reporting Routes
    this.router.post('/reports/generate',
      reportingRateLimit,
      this.authenticateUser as any,
      this.validateReportRequest() as any,
      this.validateRequest,
      this.generateReport.bind(this) as any
    );

    this.router.get('/reports/:reportId',
      this.authenticateUser as any,
      param('reportId').isUUID().withMessage('Invalid report ID format') as any,
      this.validateRequest,
      this.getReport.bind(this) as any
    );

    this.router.get('/reports',
      this.authenticateUser as any,
      query('type').optional().isString() as any,
      query('recipient').optional().isEmail() as any,
      query('days').optional().isInt({ min: 1, max: 365 }) as any,
      this.validateRequest,
      this.getReports.bind(this) as any
    );

    this.router.get('/report-templates',
      this.authenticateUser as any,
      this.getReportTemplates.bind(this) as any
    );

    this.router.post('/report-template',
      strictRateLimit,
      this.authenticateUser as any,
      this.validateReportTemplate() as any,
      this.validateRequest,
      this.createReportTemplate.bind(this) as any
    );

    this.router.post('/report-schedule',
      this.authenticateUser as any,
      this.validateReportSchedule() as any,
      this.validateRequest,
      this.createReportSchedule.bind(this) as any
    );

    this.router.get('/report-schedules',
      this.authenticateUser as any,
      this.getReportSchedules.bind(this) as any
    );

    this.router.put('/report-schedule/:scheduleId',
      this.authenticateUser as any,
      param('scheduleId').isUUID().withMessage('Invalid schedule ID format') as any,
      this.validateRequest,
      this.updateReportSchedule.bind(this) as any
    );

    this.router.delete('/report-schedule/:scheduleId',
      strictRateLimit,
      this.authenticateUser as any,
      param('scheduleId').isUUID().withMessage('Invalid schedule ID format') as any,
      this.validateRequest,
      this.deleteReportSchedule.bind(this) as any
    );

    this.router.get('/reporting/summary',
      this.authenticateUser as any,
      this.getReportingSummary.bind(this) as any
    );

    // Health and Status Routes
    this.router.get('/health',
      this.getHealthStatus.bind(this) as any
    );

    this.router.get('/metrics',
      this.authenticateUser as any,
      this.getSystemMetrics.bind(this) as any
    );
  }

  // Middleware functions
  private authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Mock user extraction from token - would integrate with actual auth service
    req.user = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'user@example.com',
      roles: ['risk_analyst', 'user']
    };

    next();
  };

  private validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }
    next();
  };

  // Validation middleware factories
  private validateRiskCalculationInput() {
    return [
      body('tradeId').isUUID().withMessage('Valid trade ID is required') as any,
      body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required') as any,
      body('settlementDate').isISO8601().withMessage('Valid settlement date is required') as any,
      body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required') as any,
      body('notionalAmount').isFloat({ min: 0 }).withMessage('Valid notional amount is required') as any,
      body('securityType').isString().withMessage('Security type is required') as any,
      body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required')
    ];
  }

  private validateCounterpartyProfile() {
    return [
      body('name').isString().isLength({ min: 1 }).withMessage('Counterparty name is required') as any,
      body('legalEntityIdentifier').isString().withMessage('LEI is required') as any,
      body('creditRating').isString().withMessage('Credit rating is required') as any,
      body('industry').isString().withMessage('Industry is required') as any,
      body('country').isString().isLength({ min: 2, max: 2 }).withMessage('Valid country code is required') as any,
      body('totalAssets').isFloat({ min: 0 }).withMessage('Valid total assets is required') as any,
      body('netWorth').isFloat().withMessage('Valid net worth is required')
    ];
  }

  private validateExposureLimit() {
    return [
      body('limitType').isIn(['GROSS', 'NET', 'SETTLEMENT', 'CREDIT', 'CONCENTRATION']).withMessage('Valid limit type is required') as any,
      body('limitAmount').isFloat({ min: 0 }).withMessage('Valid limit amount is required') as any,
      body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required') as any,
      body('threshold').isFloat({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100') as any,
      body('warningLevel').isFloat({ min: 0, max: 100 }).withMessage('Warning level must be between 0 and 100') as any,
      body('expiryDate').isISO8601().withMessage('Valid expiry date is required') as any,
      body('approvedBy').isString().withMessage('Approver is required')
    ];
  }

  private validateCreditEvent() {
    return [
      body('eventType').isIn(['RATING_DOWNGRADE', 'RATING_UPGRADE', 'DEFAULT', 'BANKRUPTCY', 'RESTRUCTURING', 'MERGER', 'ACQUISITION']).withMessage('Valid event type is required') as any,
      body('eventDate').isISO8601().withMessage('Valid event date is required') as any,
      body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters') as any,
      body('impact').isIn(['POSITIVE', 'NEGATIVE', 'NEUTRAL']).withMessage('Valid impact is required') as any,
      body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid severity is required') as any,
      body('sourceAgency').isString().withMessage('Source agency is required')
    ];
  }

  private validateSettlementInstruction() {
    return [
      body('tradeId').isUUID().withMessage('Valid trade ID is required') as any,
      body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required') as any,
      body('securityId').isUUID().withMessage('Valid security ID is required') as any,
      body('side').isIn(['BUY', 'SELL']).withMessage('Valid side is required') as any,
      body('quantity').isFloat({ min: 0 }).withMessage('Valid quantity is required') as any,
      body('price').isFloat({ min: 0 }).withMessage('Valid price is required') as any,
      body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required') as any,
      body('tradeDate').isISO8601().withMessage('Valid trade date is required') as any,
      body('settlementDate').isISO8601().withMessage('Valid settlement date is required') as any,
      body('expectedSettlementTime').isISO8601().withMessage('Valid expected settlement time is required') as any,
      body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required') as any,
      body('settlementMethod').isIn(['DVP', 'FOP', 'RVP', 'CASH']).withMessage('Valid settlement method is required') as any,
      body('custodianId').isUUID().withMessage('Valid custodian ID is required')
    ];
  }

  private validateTradeOrder() {
    return [
      body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required') as any,
      body('securityId').isUUID().withMessage('Valid security ID is required') as any,
      body('side').isIn(['BUY', 'SELL']).withMessage('Valid side is required') as any,
      body('quantity').isFloat({ min: 0 }).withMessage('Valid quantity is required') as any,
      body('price').isFloat({ min: 0 }).withMessage('Valid price is required') as any,
      body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required') as any,
      body('orderType').isIn(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']).withMessage('Valid order type is required') as any,
      body('timeInForce').isIn(['DAY', 'GTC', 'IOC', 'FOK']).withMessage('Valid time in force is required') as any,
      body('settlementDate').isISO8601().withMessage('Valid settlement date is required') as any,
      body('portfolioId').isUUID().withMessage('Valid portfolio ID is required') as any,
      body('traderId').isUUID().withMessage('Valid trader ID is required')
    ];
  }

  private validatePredictionInput() {
    return [
      body('instructionId').isUUID().withMessage('Valid instruction ID is required') as any,
      body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required') as any,
      body('securityId').isUUID().withMessage('Valid security ID is required') as any,
      body('notionalAmount').isFloat({ min: 0 }).withMessage('Valid notional amount is required') as any,
      body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required') as any,
      body('settlementDate').isISO8601().withMessage('Valid settlement date is required') as any,
      body('tradeDate').isISO8601().withMessage('Valid trade date is required') as any,
      body('securityType').isString().withMessage('Security type is required') as any,
      body('settlementMethod').isString().withMessage('Settlement method is required') as any,
      body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required') as any,
      body('marketConditions').isObject().withMessage('Market conditions are required') as any,
      body('historicalContext').isObject().withMessage('Historical context is required')
    ];
  }

  private validateRiskLimit() {
    return [
      body('limitType').isIn(['POSITION', 'NOTIONAL', 'CONCENTRATION', 'EXPOSURE', 'CREDIT', 'LEVERAGE', 'VAR', 'SECTOR', 'COUNTRY']).withMessage('Valid limit type is required') as any,
      body('entityType').isIn(['PORTFOLIO', 'COUNTERPARTY', 'SECURITY', 'TRADER', 'ACCOUNT']).withMessage('Valid entity type is required') as any,
      body('entityId').isUUID().withMessage('Valid entity ID is required') as any,
      body('limitValue').isFloat({ min: 0 }).withMessage('Valid limit value is required') as any,
      body('warningThreshold').isFloat({ min: 0, max: 100 }).withMessage('Warning threshold must be between 0 and 100') as any,
      body('breachThreshold').isFloat({ min: 0, max: 100 }).withMessage('Breach threshold must be between 0 and 100') as any,
      body('effectiveDate').isISO8601().withMessage('Valid effective date is required') as any,
      body('approvedBy').isString().withMessage('Approver is required')
    ];
  }

  private validateComplianceRule() {
    return [
      body('ruleName').isString().isLength({ min: 1 }).withMessage('Rule name is required') as any,
      body('ruleType').isIn(['REGULATORY', 'INTERNAL', 'CLIENT_SPECIFIC', 'RISK_MANAGEMENT']).withMessage('Valid rule type is required') as any,
      body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters') as any,
      body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required') as any,
      body('applicableSecurityTypes').isArray().withMessage('Applicable security types must be an array') as any,
      body('ruleLogic').isString().withMessage('Rule logic is required') as any,
      body('violationAction').isIn(['BLOCK', 'WARN', 'REQUIRE_APPROVAL', 'LOG_ONLY']).withMessage('Valid violation action is required') as any,
      body('effectiveDate').isISO8601().withMessage('Valid effective date is required')
    ];
  }

  private validateWorkflow() {
    return [
      body('name').isString().isLength({ min: 1 }).withMessage('Workflow name is required') as any,
      body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters') as any,
      body('triggerConditions').isArray().withMessage('Trigger conditions must be an array') as any,
      body('workflowSteps').isArray().withMessage('Workflow steps must be an array') as any,
      body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required') as any,
      body('category').isIn(['PREVENTIVE', 'REACTIVE', 'RECOVERY']).withMessage('Valid category is required') as any,
      body('automationLevel').isIn(['MANUAL', 'SEMI_AUTOMATED', 'FULLY_AUTOMATED']).withMessage('Valid automation level is required') as any,
      body('estimatedDuration').isInt({ min: 1 }).withMessage('Valid estimated duration is required') as any,
      body('costEstimate').isFloat({ min: 0 }).withMessage('Valid cost estimate is required')
    ];
  }

  private validateReportRequest() {
    return [
      body('reportName').isString().isLength({ min: 1 }).withMessage('Report name is required') as any,
      body('reportType').isIn(['EXECUTIVE_SUMMARY', 'DETAILED_ANALYSIS', 'OPERATIONAL_METRICS', 'REGULATORY_FILING', 'EXCEPTION_REPORT', 'TREND_ANALYSIS', 'CUSTOM']).withMessage('Valid report type is required') as any,
      body('recipients').isArray().withMessage('Recipients must be an array') as any,
      body('parameters').isObject().withMessage('Parameters are required') as any,
      body('dateRange').isObject().withMessage('Date range is required') as any,
      body('format').isIn(['PDF', 'HTML', 'EXCEL', 'CSV', 'JSON']).withMessage('Valid format is required')
    ];
  }

  private validateReportTemplate() {
    return [
      body('templateName').isString().isLength({ min: 1 }).withMessage('Template name is required') as any,
      body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters') as any,
      body('reportType').isIn(['EXECUTIVE_SUMMARY', 'DETAILED_ANALYSIS', 'OPERATIONAL_METRICS', 'REGULATORY_FILING', 'EXCEPTION_REPORT', 'TREND_ANALYSIS', 'CUSTOM']).withMessage('Valid report type is required') as any,
      body('defaultParameters').isObject().withMessage('Default parameters are required') as any,
      body('sections').isArray().withMessage('Sections must be an array') as any,
      body('charts').isArray().withMessage('Charts must be an array')
    ];
  }

  private validateReportSchedule() {
    return [
      body('reportTemplate').isUUID().withMessage('Valid report template ID is required') as any,
      body('frequency').isIn(['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ON_DEMAND']).withMessage('Valid frequency is required') as any,
      body('recipients').isArray().withMessage('Recipients must be an array') as any,
      body('parameters').isObject().withMessage('Parameters are required')
    ];
  }

  // Route handler methods
  private async calculateSettlementRisk(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const instruction = {
        id: req.body.tradeId,
        tradeId: req.body.tradeId,
        counterpartyId: req.body.counterpartyId,
        settlementDate: new Date(req.body.settlementDate),
        currency: req.body.currency,
        notionalAmount: req.body.notionalAmount,
        securityType: req.body.securityType,
        priority: req.body.priority,
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const assessment = await this.riskCalculationEngine.calculateSettlementRisk(instruction);
      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to calculate settlement risk', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getRiskAssessment(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId } = req.params;
      const assessment = this.riskCalculationEngine.getRiskAssessment(instructionId);
      
      if (!assessment) {
        res.status(404).json({ error: 'Risk assessment not found' });
        return;
      }

      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve risk assessment', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getAllRiskAssessments(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const allAssessments = this.riskCalculationEngine.getAllRiskAssessments();
      const paginatedAssessments = allAssessments.slice(offset, offset + limit);
      
      res.json({
        assessments: paginatedAssessments,
        total: allAssessments.length,
        limit,
        offset
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve risk assessments', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getHighRiskInstructions(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const highRiskInstructions = this.riskCalculationEngine.getHighRiskInstructions();
      res.json(highRiskInstructions);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve high risk instructions', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getRiskSummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const summary = this.riskCalculationEngine.generateRiskSummary();
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate risk summary', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async createCounterpartyProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const profileData = {
        ...req.body,
        establishedDate: req.body.establishedDate ? new Date(req.body.establishedDate) : new Date(),
        lastFinancialUpdate: req.body.lastFinancialUpdate ? new Date(req.body.lastFinancialUpdate) : new Date(),
        regulatoryStatus: req.body.regulatoryStatus || 'ACTIVE',
        kycStatus: req.body.kycStatus || 'PENDING',
        sanctions: req.body.sanctions || false,
        blacklisted: req.body.blacklisted || false
      };

      const profile = await this.counterpartyRiskService.createCounterpartyProfile(profileData);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create counterparty profile', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async updateCounterpartyProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { counterpartyId } = req.params;
      const updates = req.body;

      const profile = await this.counterpartyRiskService.updateCounterpartyProfile(counterpartyId, updates);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update counterparty profile', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async performCounterpartyRiskAssessment(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { counterpartyId } = req.params;
      const riskMetrics = await this.counterpartyRiskService.performRiskAssessment(counterpartyId);
      res.json(riskMetrics);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to perform risk assessment', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getCounterpartyProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { counterpartyId } = req.params;
      const profile = this.counterpartyRiskService.getCounterpartyProfile(counterpartyId);
      
      if (!profile) {
        res.status(404).json({ error: 'Counterparty profile not found' });
        return;
      }

      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve counterparty profile', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getCounterpartyRiskMetrics(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { counterpartyId } = req.params;
      const riskMetrics = this.counterpartyRiskService.getRiskMetrics(counterpartyId);
      
      if (!riskMetrics) {
        res.status(404).json({ error: 'Risk metrics not found' });
        return;
      }

      res.json(riskMetrics);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve risk metrics', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getAllCounterparties(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const counterparties = this.counterpartyRiskService.getAllCounterparties();
      res.json(counterparties);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve counterparties', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getHighRiskCounterparties(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const highRiskCounterparties = this.counterpartyRiskService.getHighRiskCounterparties();
      res.json(highRiskCounterparties);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve high risk counterparties', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async addExposureLimit(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { counterpartyId } = req.params;
      const limitData = {
        ...req.body,
        counterpartyId,
        status: 'ACTIVE' as const,
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date()
      };

      const exposureLimit = await this.counterpartyRiskService.addExposureLimit(counterpartyId, limitData);
      res.status(201).json(exposureLimit);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add exposure limit', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async recordCreditEvent(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { counterpartyId } = req.params;
      const eventData = {
        ...req.body,
        counterpartyId,
        eventDate: new Date(req.body.eventDate),
        verified: req.body.verified || false
      };

      const creditEvent = await this.counterpartyRiskService.recordCreditEvent(counterpartyId, eventData);
      res.status(201).json(creditEvent);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to record credit event', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async createSettlementInstruction(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const instructionData = {
        ...req.body,
        tradeDate: new Date(req.body.tradeDate),
        settlementDate: new Date(req.body.settlementDate),
        expectedSettlementTime: new Date(req.body.expectedSettlementTime)
      };

      const instruction = await this.timelineTrackingService.createSettlementInstruction(instructionData);
      res.status(201).json(instruction);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create settlement instruction', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async updateMilestoneStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId, milestoneType } = req.params;
      const { status, notes } = req.body;

      await this.timelineTrackingService.updateMilestoneStatus(instructionId, milestoneType, status, notes);
      res.json({ message: 'Milestone status updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update milestone status', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getSettlementTimeline(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId } = req.params;
      const timeline = this.timelineTrackingService.getSettlementTimeline(instructionId);
      
      if (!timeline) {
        res.status(404).json({ error: 'Settlement timeline not found' });
        return;
      }

      res.json(timeline);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve settlement timeline', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getSettlementInstructions(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { status, counterpartyId } = req.query;
      let instructions = this.timelineTrackingService.getAllSettlementInstructions();

      if (status) {
        instructions = this.timelineTrackingService.getInstructionsByStatus(status as any);
      }

      if (counterpartyId) {
        instructions = this.timelineTrackingService.getInstructionsByCounterparty(counterpartyId as string);
      }

      res.json(instructions);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve settlement instructions', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getPendingMilestones(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const pendingMilestones = this.timelineTrackingService.getPendingMilestones();
      res.json(pendingMilestones);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve pending milestones', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getOverdueMilestones(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const overdueMilestones = this.timelineTrackingService.getOverdueMilestones();
      res.json(overdueMilestones);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve overdue milestones', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getActiveAlerts(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { severity } = req.query;
      const alerts = this.timelineTrackingService.getActiveAlerts(severity as any);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve active alerts', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async acknowledgeAlert(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { alertId } = req.params;
      const acknowledgedBy = req.user?.email || 'unknown';
      
      const acknowledged = this.timelineTrackingService.acknowledgeAlert(alertId, acknowledgedBy);
      
      if (!acknowledged) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      res.json({ message: 'Alert acknowledged successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to acknowledge alert', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async generatePerformanceReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { period, startDate, endDate } = req.query;
      const report = this.timelineTrackingService.generatePerformanceReport(
        period as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate performance report', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async executePreSettlementChecks(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const orderData = {
        ...req.body,
        id: req.body.id || require('crypto').randomUUID(),
        createdAt: new Date()
      };

      const checkTypes = req.body.checkTypes;
      const checkSuite = await this.preSettlementChecksService.executePreSettlementChecks(orderData, checkTypes);
      res.json(checkSuite);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to execute pre-settlement checks', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getRiskCheckSuite(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { suiteId } = req.params;
      // This would need to be implemented in the PreSettlementRiskChecksService
      res.status(501).json({ error: 'Not implemented' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve risk check suite', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getRiskCheckHistory(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { orderId } = req.params;
      const history = this.preSettlementChecksService.getRiskCheckHistory(orderId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve risk check history', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async bypassRiskCheck(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { suiteId, checkId } = req.params;
      const { bypassReason } = req.body;
      const bypassedBy = req.user?.email || 'unknown';

      const bypassed = this.preSettlementChecksService.bypassRiskCheck(suiteId, checkId, bypassReason, bypassedBy);
      
      if (!bypassed) {
        res.status(404).json({ error: 'Risk check not found or not bypassable' });
        return;
      }

      res.json({ message: 'Risk check bypassed successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to bypass risk check', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getRiskCheckAlerts(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const alerts = this.preSettlementChecksService.getAllActiveAlerts();
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve risk check alerts', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getRiskCheckSummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { timeFrame } = req.query;
      const summary = this.preSettlementChecksService.generateRiskSummary(timeFrame as any);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate risk check summary', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async addRiskLimit(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const limitData = {
        ...req.body,
        utilizationValue: 0,
        utilizationPercentage: 0,
        isActive: true,
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        effectiveDate: new Date(req.body.effectiveDate)
      };

      const riskLimit = this.preSettlementChecksService.addRiskLimit(req.body.entityId, limitData);
      res.status(201).json(riskLimit);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add risk limit', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async addComplianceRule(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const ruleData = {
        ...req.body,
        isActive: true,
        effectiveDate: new Date(req.body.effectiveDate),
        createdBy: req.user?.email || 'unknown'
      };

      const complianceRule = this.preSettlementChecksService.addComplianceRule(ruleData);
      res.status(201).json(complianceRule);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add compliance rule', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async predictSettlementFailure(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const predictionInput = {
        ...req.body,
        settlementDate: new Date(req.body.settlementDate),
        tradeDate: new Date(req.body.tradeDate)
      };

      const prediction = await this.failurePredictionService.predictSettlementFailure(predictionInput);
      res.json(prediction);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to predict settlement failure', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getLatestPrediction(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId } = req.params;
      const prediction = this.failurePredictionService.getLatestPrediction(instructionId);
      
      if (!prediction) {
        res.status(404).json({ error: 'Prediction not found' });
        return;
      }

      res.json(prediction);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve prediction', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getPredictionHistory(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId } = req.params;
      const history = this.failurePredictionService.getPredictionHistory(instructionId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve prediction history', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getHighRiskPredictions(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const threshold = parseFloat(req.query.threshold as string) || 0.7;
      const highRiskPredictions = this.failurePredictionService.getHighRiskPredictions(threshold);
      res.json(highRiskPredictions);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve high risk predictions', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async updatePredictionAccuracy(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId } = req.params;
      const { actualOutcome, actualDelayDays } = req.body;

      await this.failurePredictionService.updatePredictionAccuracy(instructionId, actualOutcome, actualDelayDays);
      res.json({ message: 'Prediction accuracy updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update prediction accuracy', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getModelPerformance(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { modelVersion } = req.query;
      const performance = this.failurePredictionService.getModelPerformance(modelVersion as string);
      
      if (!performance) {
        res.status(404).json({ error: 'Model performance data not found' });
        return;
      }

      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve model performance', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getFailurePatterns(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const patterns = this.failurePredictionService.getFailurePatterns();
      res.json(patterns);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve failure patterns', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getPredictionSummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { timeFrame } = req.query;
      const summary = this.failurePredictionService.generatePredictionSummary(timeFrame as any);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate prediction summary', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async triggerWorkflow(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId, triggerData, workflowId } = req.body;
      const triggeredBy = req.user?.email || 'unknown';

      const execution = await this.mitigationWorkflowsService.triggerWorkflow(
        instructionId,
        triggerData,
        triggeredBy,
        workflowId
      );

      res.status(201).json(execution);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to trigger workflow', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getWorkflowExecution(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { executionId } = req.params;
      const execution = this.mitigationWorkflowsService.getWorkflowExecution(executionId);
      
      if (!execution) {
        res.status(404).json({ error: 'Workflow execution not found' });
        return;
      }

      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getInstructionWorkflows(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { instructionId } = req.params;
      const workflows = this.mitigationWorkflowsService.getInstructionWorkflows(instructionId);
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve instruction workflows', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getActiveWorkflowExecutions(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const activeExecutions = this.mitigationWorkflowsService.getActiveExecutions();
      res.json(activeExecutions);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve active workflow executions', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async pauseWorkflowExecution(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { executionId } = req.params;
      const { reason } = req.body;

      const paused = this.mitigationWorkflowsService.pauseWorkflowExecution(executionId, reason);
      
      if (!paused) {
        res.status(404).json({ error: 'Workflow execution not found or cannot be paused' });
        return;
      }

      res.json({ message: 'Workflow execution paused successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to pause workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async resumeWorkflowExecution(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { executionId } = req.params;

      const resumed = this.mitigationWorkflowsService.resumeWorkflowExecution(executionId);
      
      if (!resumed) {
        res.status(404).json({ error: 'Workflow execution not found or cannot be resumed' });
        return;
      }

      res.json({ message: 'Workflow execution resumed successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to resume workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async cancelWorkflowExecution(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { executionId } = req.params;
      const { reason } = req.body;

      const cancelled = this.mitigationWorkflowsService.cancelWorkflowExecution(executionId, reason);
      
      if (!cancelled) {
        res.status(404).json({ error: 'Workflow execution not found or cannot be cancelled' });
        return;
      }

      res.json({ message: 'Workflow execution cancelled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to cancel workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getAllWorkflows(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const workflows = this.mitigationWorkflowsService.getAllWorkflows();
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve workflows', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async createWorkflow(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const workflowData = {
        ...req.body,
        isActive: true,
        createdBy: req.user?.email || 'unknown'
      };

      const workflow = this.mitigationWorkflowsService.createWorkflow(workflowData);
      res.status(201).json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create workflow', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getWorkflowReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { timeFrame } = req.query;
      const report = this.mitigationWorkflowsService.generateWorkflowReport(timeFrame as any);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate workflow report', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async generateReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const reportRequest = {
        ...req.body,
        dateRange: {
          ...req.body.dateRange,
          startDate: new Date(req.body.dateRange.startDate),
          endDate: new Date(req.body.dateRange.endDate)
        },
        generatedBy: req.user?.email || 'unknown'
      };

      const report = await this.reportingService.generateReport(reportRequest);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { reportId } = req.params;
      const report = this.reportingService.getReport(reportId);
      
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve report', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getReports(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { type, recipient, days } = req.query;
      let reports;

      if (type) {
        reports = this.reportingService.getReportsByType(type as any);
      } else if (recipient) {
        reports = this.reportingService.getReportsForRecipient(recipient as string);
      } else if (days) {
        reports = this.reportingService.getRecentReports(parseInt(days as string));
      } else {
        reports = this.reportingService.getRecentReports();
      }

      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve reports', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getReportTemplates(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const templates = this.reportingService.getAllReportTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve report templates', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async createReportTemplate(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const templateData = {
        ...req.body,
        isSystem: false,
        createdBy: req.user?.email || 'unknown'
      };

      const template = this.reportingService.createReportTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create report template', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async createReportSchedule(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const scheduleData = {
        ...req.body,
        isActive: true,
        createdBy: req.user?.email || 'unknown'
      };

      const schedule = this.reportingService.createReportSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create report schedule', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getReportSchedules(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const schedules = this.reportingService.getAllReportSchedules();
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve report schedules', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async updateReportSchedule(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { scheduleId } = req.params;
      const updates = req.body;

      const schedule = this.reportingService.updateReportSchedule(scheduleId, updates);
      
      if (!schedule) {
        res.status(404).json({ error: 'Report schedule not found' });
        return;
      }

      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update report schedule', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async deleteReportSchedule(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { scheduleId } = req.params;

      const deleted = this.reportingService.deleteReportSchedule(scheduleId);
      
      if (!deleted) {
        res.status(404).json({ error: 'Report schedule not found' });
        return;
      }

      res.json({ message: 'Report schedule deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete report schedule', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getReportingSummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const summary = this.reportingService.generateReportingSummary();
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate reporting summary', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getHealthStatus(req: Request, res: Response): Promise<any> {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          riskCalculationEngine: 'operational',
          counterpartyRiskService: 'operational',
          timelineTrackingService: 'operational',
          preSettlementChecksService: 'operational',
          failurePredictionService: 'operational',
          mitigationWorkflowsService: 'operational',
          reportingService: 'operational'
        },
        version: '1.0.0'
      };

      res.json(healthStatus);
    } catch (error: any) {
      res.status(500).json({ error: 'Health check failed', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getSystemMetrics(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const metrics = {
        riskAssessments: {
          total: this.riskCalculationEngine.getAllRiskAssessments().length,
          highRisk: this.riskCalculationEngine.getHighRiskInstructions().length
        },
        counterparties: {
          total: this.counterpartyRiskService.getAllCounterparties().length,
          highRisk: this.counterpartyRiskService.getHighRiskCounterparties().length
        },
        settlements: {
          activeInstructions: this.timelineTrackingService.getInstructionsByStatus('PROCESSING').length,
          pendingMilestones: this.timelineTrackingService.getPendingMilestones().length,
          overdueMilestones: this.timelineTrackingService.getOverdueMilestones().length
        },
        workflows: {
          activeExecutions: this.mitigationWorkflowsService.getActiveExecutions().length,
          totalWorkflows: this.mitigationWorkflowsService.getAllWorkflows().length
        },
        reports: {
          totalReports: this.reportingService.getRecentReports().length,
          activeSchedules: this.reportingService.getActiveSchedules().length
        },
        timestamp: new Date().toISOString()
      };

      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve system metrics', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  public getRouter(): express.Router {
    return this.router;
  }
}



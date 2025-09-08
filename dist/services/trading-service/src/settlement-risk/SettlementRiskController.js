"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementRiskController = void 0;
const express_1 = __importDefault(require("express"));
const { body, param, query, validationResult } = require('express-validator');
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const SettlementRiskCalculationEngine_1 = require("./SettlementRiskCalculationEngine");
const CounterpartyRiskAssessmentService_1 = require("./CounterpartyRiskAssessmentService");
const SettlementTimelineTrackingService_1 = require("./SettlementTimelineTrackingService");
const PreSettlementRiskChecksService_1 = require("./PreSettlementRiskChecksService");
const SettlementFailurePredictionService_1 = require("./SettlementFailurePredictionService");
const RiskMitigationWorkflowsService_1 = require("./RiskMitigationWorkflowsService");
const SettlementRiskReportingService_1 = require("./SettlementRiskReportingService");
// Rate limiting configurations
const standardRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' }
});
const strictRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: { error: 'Rate limit exceeded for sensitive operations' }
});
const reportingRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit report generation to 10 per hour
    message: { error: 'Report generation rate limit exceeded' }
});
class SettlementRiskController {
    router;
    riskCalculationEngine;
    counterpartyRiskService;
    timelineTrackingService;
    preSettlementChecksService;
    failurePredictionService;
    mitigationWorkflowsService;
    reportingService;
    constructor() {
        this.router = express_1.default.Router();
        this.riskCalculationEngine = new SettlementRiskCalculationEngine_1.SettlementRiskCalculationEngine();
        this.counterpartyRiskService = new CounterpartyRiskAssessmentService_1.CounterpartyRiskAssessmentService();
        this.timelineTrackingService = new SettlementTimelineTrackingService_1.SettlementTimelineTrackingService();
        this.preSettlementChecksService = new PreSettlementRiskChecksService_1.PreSettlementRiskChecksService();
        this.failurePredictionService = new SettlementFailurePredictionService_1.SettlementFailurePredictionService();
        this.mitigationWorkflowsService = new RiskMitigationWorkflowsService_1.RiskMitigationWorkflowsService();
        this.reportingService = new SettlementRiskReportingService_1.SettlementRiskReportingService();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Apply standard rate limiting to all routes
        this.router.use(standardRateLimit);
        // Risk Calculation Engine Routes
        this.router.post('/risk/calculate', strictRateLimit, this.authenticateUser, this.validateRiskCalculationInput(), this.validateRequest, this.calculateSettlementRisk.bind(this));
        this.router.get('/risk/assessment/:instructionId', this.authenticateUser, param('instructionId').isUUID().withMessage('Invalid instruction ID format'), this.validateRequest, this.getRiskAssessment.bind(this));
        this.router.get('/risk/assessments', this.authenticateUser, query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'), query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative)'), this.validateRequest, this.getAllRiskAssessments.bind(this));
        this.router.get('/risk/high-risk', this.authenticateUser, this.getHighRiskInstructions.bind(this));
        this.router.get('/risk/summary', this.authenticateUser, this.getRiskSummary.bind(this));
        // Counterparty Risk Assessment Routes
        this.router.post('/counterparty', strictRateLimit, this.authenticateUser, this.validateCounterpartyProfile(), this.validateRequest, this.createCounterpartyProfile.bind(this));
        this.router.put('/counterparty/:counterpartyId', this.authenticateUser, param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format'), this.validateRequest, this.updateCounterpartyProfile.bind(this));
        this.router.post('/counterparty/:counterpartyId/risk-assessment', this.authenticateUser, param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format'), this.validateRequest, this.performCounterpartyRiskAssessment.bind(this));
        this.router.get('/counterparty/:counterpartyId', this.authenticateUser, param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format'), this.validateRequest, this.getCounterpartyProfile.bind(this));
        this.router.get('/counterparty/:counterpartyId/risk-metrics', this.authenticateUser, param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format'), this.validateRequest, this.getCounterpartyRiskMetrics.bind(this));
        this.router.get('/counterparties', this.authenticateUser, this.getAllCounterparties.bind(this));
        this.router.get('/counterparties/high-risk', this.authenticateUser, this.getHighRiskCounterparties.bind(this));
        this.router.post('/counterparty/:counterpartyId/exposure-limit', this.authenticateUser, param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format'), this.validateExposureLimit(), this.validateRequest, this.addExposureLimit.bind(this));
        this.router.post('/counterparty/:counterpartyId/credit-event', this.authenticateUser, param('counterpartyId').isUUID().withMessage('Invalid counterparty ID format'), this.validateCreditEvent(), this.validateRequest, this.recordCreditEvent.bind(this));
        // Settlement Timeline Tracking Routes
        this.router.post('/settlement/instruction', this.authenticateUser, this.validateSettlementInstruction(), this.validateRequest, this.createSettlementInstruction.bind(this));
        this.router.put('/settlement/:instructionId/milestone/:milestoneType', this.authenticateUser, param('instructionId').isUUID().withMessage('Invalid instruction ID format'), param('milestoneType').isString().withMessage('Milestone type is required'), body('status').isIn(['COMPLETED', 'DELAYED', 'FAILED', 'SKIPPED']).withMessage('Invalid status'), body('notes').optional().isString(), this.validateRequest, this.updateMilestoneStatus.bind(this));
        this.router.get('/settlement/:instructionId/timeline', this.authenticateUser, param('instructionId').isUUID().withMessage('Invalid instruction ID format'), this.validateRequest, this.getSettlementTimeline.bind(this));
        this.router.get('/settlement/instructions', this.authenticateUser, query('status').optional().isString(), query('counterpartyId').optional().isUUID(), this.validateRequest, this.getSettlementInstructions.bind(this));
        this.router.get('/settlement/milestones/pending', this.authenticateUser, this.getPendingMilestones.bind(this));
        this.router.get('/settlement/milestones/overdue', this.authenticateUser, this.getOverdueMilestones.bind(this));
        this.router.get('/settlement/alerts', this.authenticateUser, query('severity').optional().isIn(['INFO', 'WARNING', 'CRITICAL']), this.validateRequest, this.getActiveAlerts.bind(this));
        this.router.put('/settlement/alert/:alertId/acknowledge', this.authenticateUser, param('alertId').isUUID().withMessage('Invalid alert ID format'), this.validateRequest, this.acknowledgeAlert.bind(this));
        this.router.get('/settlement/performance-report', this.authenticateUser, query('period').isString().withMessage('Period is required'), query('startDate').isISO8601().withMessage('Valid start date is required'), query('endDate').isISO8601().withMessage('Valid end date is required'), this.validateRequest, this.generatePerformanceReport.bind(this));
        // Pre-Settlement Risk Checks Routes
        this.router.post('/pre-settlement/checks', strictRateLimit, this.authenticateUser, this.validateTradeOrder(), this.validateRequest, this.executePreSettlementChecks.bind(this));
        this.router.get('/pre-settlement/check-suite/:suiteId', this.authenticateUser, param('suiteId').isUUID().withMessage('Invalid suite ID format'), this.validateRequest, this.getRiskCheckSuite.bind(this));
        this.router.get('/pre-settlement/history/:orderId', this.authenticateUser, param('orderId').isUUID().withMessage('Invalid order ID format'), this.validateRequest, this.getRiskCheckHistory.bind(this));
        this.router.post('/pre-settlement/bypass/:suiteId/:checkId', strictRateLimit, this.authenticateUser, param('suiteId').isUUID().withMessage('Invalid suite ID format'), param('checkId').isUUID().withMessage('Invalid check ID format'), body('bypassReason').isString().isLength({ min: 10 }).withMessage('Bypass reason must be at least 10 characters'), this.validateRequest, this.bypassRiskCheck.bind(this));
        this.router.get('/pre-settlement/alerts', this.authenticateUser, this.getRiskCheckAlerts.bind(this));
        this.router.get('/pre-settlement/summary', this.authenticateUser, query('timeFrame').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']), this.validateRequest, this.getRiskCheckSummary.bind(this));
        this.router.post('/pre-settlement/risk-limit', strictRateLimit, this.authenticateUser, this.validateRiskLimit(), this.validateRequest, this.addRiskLimit.bind(this));
        this.router.post('/pre-settlement/compliance-rule', strictRateLimit, this.authenticateUser, this.validateComplianceRule(), this.validateRequest, this.addComplianceRule.bind(this));
        // Settlement Failure Prediction Routes
        this.router.post('/prediction/settlement-failure', strictRateLimit, this.authenticateUser, this.validatePredictionInput(), this.validateRequest, this.predictSettlementFailure.bind(this));
        this.router.get('/prediction/:instructionId', this.authenticateUser, param('instructionId').isUUID().withMessage('Invalid instruction ID format'), this.validateRequest, this.getLatestPrediction.bind(this));
        this.router.get('/prediction/:instructionId/history', this.authenticateUser, param('instructionId').isUUID().withMessage('Invalid instruction ID format'), this.validateRequest, this.getPredictionHistory.bind(this));
        this.router.get('/predictions/high-risk', this.authenticateUser, query('threshold').optional().isFloat({ min: 0, max: 1 }), this.validateRequest, this.getHighRiskPredictions.bind(this));
        this.router.post('/prediction/:instructionId/feedback', this.authenticateUser, param('instructionId').isUUID().withMessage('Invalid instruction ID format'), body('actualOutcome').isIn(['SUCCESS', 'FAILURE']).withMessage('Invalid outcome'), body('actualDelayDays').optional().isFloat({ min: 0 }), this.validateRequest, this.updatePredictionAccuracy.bind(this));
        this.router.get('/prediction/model/performance', this.authenticateUser, query('modelVersion').optional().isString(), this.validateRequest, this.getModelPerformance.bind(this));
        this.router.get('/prediction/patterns', this.authenticateUser, this.getFailurePatterns.bind(this));
        this.router.get('/prediction/summary', this.authenticateUser, query('timeFrame').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']), this.validateRequest, this.getPredictionSummary.bind(this));
        // Risk Mitigation Workflows Routes
        this.router.post('/workflow/trigger', strictRateLimit, this.authenticateUser, body('instructionId').isUUID().withMessage('Invalid instruction ID format'), body('triggerData').isObject().withMessage('Trigger data is required'), body('workflowId').optional().isUUID(), this.validateRequest, this.triggerWorkflow.bind(this));
        this.router.get('/workflow/execution/:executionId', this.authenticateUser, param('executionId').isUUID().withMessage('Invalid execution ID format'), this.validateRequest, this.getWorkflowExecution.bind(this));
        this.router.get('/workflow/instruction/:instructionId', this.authenticateUser, param('instructionId').isUUID().withMessage('Invalid instruction ID format'), this.validateRequest, this.getInstructionWorkflows.bind(this));
        this.router.get('/workflows/active', this.authenticateUser, this.getActiveWorkflowExecutions.bind(this));
        this.router.put('/workflow/execution/:executionId/pause', strictRateLimit, this.authenticateUser, param('executionId').isUUID().withMessage('Invalid execution ID format'), body('reason').isString().withMessage('Reason is required'), this.validateRequest, this.pauseWorkflowExecution.bind(this));
        this.router.put('/workflow/execution/:executionId/resume', this.authenticateUser, param('executionId').isUUID().withMessage('Invalid execution ID format'), this.validateRequest, this.resumeWorkflowExecution.bind(this));
        this.router.put('/workflow/execution/:executionId/cancel', strictRateLimit, this.authenticateUser, param('executionId').isUUID().withMessage('Invalid execution ID format'), body('reason').isString().withMessage('Reason is required'), this.validateRequest, this.cancelWorkflowExecution.bind(this));
        this.router.get('/workflows', this.authenticateUser, this.getAllWorkflows.bind(this));
        this.router.post('/workflow', strictRateLimit, this.authenticateUser, this.validateWorkflow(), this.validateRequest, this.createWorkflow.bind(this));
        this.router.get('/workflow/report', this.authenticateUser, query('timeFrame').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']), this.validateRequest, this.getWorkflowReport.bind(this));
        // Reporting Routes
        this.router.post('/reports/generate', reportingRateLimit, this.authenticateUser, this.validateReportRequest(), this.validateRequest, this.generateReport.bind(this));
        this.router.get('/reports/:reportId', this.authenticateUser, param('reportId').isUUID().withMessage('Invalid report ID format'), this.validateRequest, this.getReport.bind(this));
        this.router.get('/reports', this.authenticateUser, query('type').optional().isString(), query('recipient').optional().isEmail(), query('days').optional().isInt({ min: 1, max: 365 }), this.validateRequest, this.getReports.bind(this));
        this.router.get('/report-templates', this.authenticateUser, this.getReportTemplates.bind(this));
        this.router.post('/report-template', strictRateLimit, this.authenticateUser, this.validateReportTemplate(), this.validateRequest, this.createReportTemplate.bind(this));
        this.router.post('/report-schedule', this.authenticateUser, this.validateReportSchedule(), this.validateRequest, this.createReportSchedule.bind(this));
        this.router.get('/report-schedules', this.authenticateUser, this.getReportSchedules.bind(this));
        this.router.put('/report-schedule/:scheduleId', this.authenticateUser, param('scheduleId').isUUID().withMessage('Invalid schedule ID format'), this.validateRequest, this.updateReportSchedule.bind(this));
        this.router.delete('/report-schedule/:scheduleId', strictRateLimit, this.authenticateUser, param('scheduleId').isUUID().withMessage('Invalid schedule ID format'), this.validateRequest, this.deleteReportSchedule.bind(this));
        this.router.get('/reporting/summary', this.authenticateUser, this.getReportingSummary.bind(this));
        // Health and Status Routes
        this.router.get('/health', this.getHealthStatus.bind(this));
        this.router.get('/metrics', this.authenticateUser, this.getSystemMetrics.bind(this));
    }
    // Middleware functions
    authenticateUser = (req, res, next) => {
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
    validateRequest = (req, res, next) => {
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
    validateRiskCalculationInput() {
        return [
            body('tradeId').isUUID().withMessage('Valid trade ID is required'),
            body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required'),
            body('settlementDate').isISO8601().withMessage('Valid settlement date is required'),
            body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required'),
            body('notionalAmount').isFloat({ min: 0 }).withMessage('Valid notional amount is required'),
            body('securityType').isString().withMessage('Security type is required'),
            body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required')
        ];
    }
    validateCounterpartyProfile() {
        return [
            body('name').isString().isLength({ min: 1 }).withMessage('Counterparty name is required'),
            body('legalEntityIdentifier').isString().withMessage('LEI is required'),
            body('creditRating').isString().withMessage('Credit rating is required'),
            body('industry').isString().withMessage('Industry is required'),
            body('country').isString().isLength({ min: 2, max: 2 }).withMessage('Valid country code is required'),
            body('totalAssets').isFloat({ min: 0 }).withMessage('Valid total assets is required'),
            body('netWorth').isFloat().withMessage('Valid net worth is required')
        ];
    }
    validateExposureLimit() {
        return [
            body('limitType').isIn(['GROSS', 'NET', 'SETTLEMENT', 'CREDIT', 'CONCENTRATION']).withMessage('Valid limit type is required'),
            body('limitAmount').isFloat({ min: 0 }).withMessage('Valid limit amount is required'),
            body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required'),
            body('threshold').isFloat({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100'),
            body('warningLevel').isFloat({ min: 0, max: 100 }).withMessage('Warning level must be between 0 and 100'),
            body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
            body('approvedBy').isString().withMessage('Approver is required')
        ];
    }
    validateCreditEvent() {
        return [
            body('eventType').isIn(['RATING_DOWNGRADE', 'RATING_UPGRADE', 'DEFAULT', 'BANKRUPTCY', 'RESTRUCTURING', 'MERGER', 'ACQUISITION']).withMessage('Valid event type is required'),
            body('eventDate').isISO8601().withMessage('Valid event date is required'),
            body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
            body('impact').isIn(['POSITIVE', 'NEGATIVE', 'NEUTRAL']).withMessage('Valid impact is required'),
            body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid severity is required'),
            body('sourceAgency').isString().withMessage('Source agency is required')
        ];
    }
    validateSettlementInstruction() {
        return [
            body('tradeId').isUUID().withMessage('Valid trade ID is required'),
            body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required'),
            body('securityId').isUUID().withMessage('Valid security ID is required'),
            body('side').isIn(['BUY', 'SELL']).withMessage('Valid side is required'),
            body('quantity').isFloat({ min: 0 }).withMessage('Valid quantity is required'),
            body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
            body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required'),
            body('tradeDate').isISO8601().withMessage('Valid trade date is required'),
            body('settlementDate').isISO8601().withMessage('Valid settlement date is required'),
            body('expectedSettlementTime').isISO8601().withMessage('Valid expected settlement time is required'),
            body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required'),
            body('settlementMethod').isIn(['DVP', 'FOP', 'RVP', 'CASH']).withMessage('Valid settlement method is required'),
            body('custodianId').isUUID().withMessage('Valid custodian ID is required')
        ];
    }
    validateTradeOrder() {
        return [
            body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required'),
            body('securityId').isUUID().withMessage('Valid security ID is required'),
            body('side').isIn(['BUY', 'SELL']).withMessage('Valid side is required'),
            body('quantity').isFloat({ min: 0 }).withMessage('Valid quantity is required'),
            body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
            body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required'),
            body('orderType').isIn(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']).withMessage('Valid order type is required'),
            body('timeInForce').isIn(['DAY', 'GTC', 'IOC', 'FOK']).withMessage('Valid time in force is required'),
            body('settlementDate').isISO8601().withMessage('Valid settlement date is required'),
            body('portfolioId').isUUID().withMessage('Valid portfolio ID is required'),
            body('traderId').isUUID().withMessage('Valid trader ID is required')
        ];
    }
    validatePredictionInput() {
        return [
            body('instructionId').isUUID().withMessage('Valid instruction ID is required'),
            body('counterpartyId').isUUID().withMessage('Valid counterparty ID is required'),
            body('securityId').isUUID().withMessage('Valid security ID is required'),
            body('notionalAmount').isFloat({ min: 0 }).withMessage('Valid notional amount is required'),
            body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required'),
            body('settlementDate').isISO8601().withMessage('Valid settlement date is required'),
            body('tradeDate').isISO8601().withMessage('Valid trade date is required'),
            body('securityType').isString().withMessage('Security type is required'),
            body('settlementMethod').isString().withMessage('Settlement method is required'),
            body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required'),
            body('marketConditions').isObject().withMessage('Market conditions are required'),
            body('historicalContext').isObject().withMessage('Historical context is required')
        ];
    }
    validateRiskLimit() {
        return [
            body('limitType').isIn(['POSITION', 'NOTIONAL', 'CONCENTRATION', 'EXPOSURE', 'CREDIT', 'LEVERAGE', 'VAR', 'SECTOR', 'COUNTRY']).withMessage('Valid limit type is required'),
            body('entityType').isIn(['PORTFOLIO', 'COUNTERPARTY', 'SECURITY', 'TRADER', 'ACCOUNT']).withMessage('Valid entity type is required'),
            body('entityId').isUUID().withMessage('Valid entity ID is required'),
            body('limitValue').isFloat({ min: 0 }).withMessage('Valid limit value is required'),
            body('warningThreshold').isFloat({ min: 0, max: 100 }).withMessage('Warning threshold must be between 0 and 100'),
            body('breachThreshold').isFloat({ min: 0, max: 100 }).withMessage('Breach threshold must be between 0 and 100'),
            body('effectiveDate').isISO8601().withMessage('Valid effective date is required'),
            body('approvedBy').isString().withMessage('Approver is required')
        ];
    }
    validateComplianceRule() {
        return [
            body('ruleName').isString().isLength({ min: 1 }).withMessage('Rule name is required'),
            body('ruleType').isIn(['REGULATORY', 'INTERNAL', 'CLIENT_SPECIFIC', 'RISK_MANAGEMENT']).withMessage('Valid rule type is required'),
            body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
            body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required'),
            body('applicableSecurityTypes').isArray().withMessage('Applicable security types must be an array'),
            body('ruleLogic').isString().withMessage('Rule logic is required'),
            body('violationAction').isIn(['BLOCK', 'WARN', 'REQUIRE_APPROVAL', 'LOG_ONLY']).withMessage('Valid violation action is required'),
            body('effectiveDate').isISO8601().withMessage('Valid effective date is required')
        ];
    }
    validateWorkflow() {
        return [
            body('name').isString().isLength({ min: 1 }).withMessage('Workflow name is required'),
            body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
            body('triggerConditions').isArray().withMessage('Trigger conditions must be an array'),
            body('workflowSteps').isArray().withMessage('Workflow steps must be an array'),
            body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Valid priority is required'),
            body('category').isIn(['PREVENTIVE', 'REACTIVE', 'RECOVERY']).withMessage('Valid category is required'),
            body('automationLevel').isIn(['MANUAL', 'SEMI_AUTOMATED', 'FULLY_AUTOMATED']).withMessage('Valid automation level is required'),
            body('estimatedDuration').isInt({ min: 1 }).withMessage('Valid estimated duration is required'),
            body('costEstimate').isFloat({ min: 0 }).withMessage('Valid cost estimate is required')
        ];
    }
    validateReportRequest() {
        return [
            body('reportName').isString().isLength({ min: 1 }).withMessage('Report name is required'),
            body('reportType').isIn(['EXECUTIVE_SUMMARY', 'DETAILED_ANALYSIS', 'OPERATIONAL_METRICS', 'REGULATORY_FILING', 'EXCEPTION_REPORT', 'TREND_ANALYSIS', 'CUSTOM']).withMessage('Valid report type is required'),
            body('recipients').isArray().withMessage('Recipients must be an array'),
            body('parameters').isObject().withMessage('Parameters are required'),
            body('dateRange').isObject().withMessage('Date range is required'),
            body('format').isIn(['PDF', 'HTML', 'EXCEL', 'CSV', 'JSON']).withMessage('Valid format is required')
        ];
    }
    validateReportTemplate() {
        return [
            body('templateName').isString().isLength({ min: 1 }).withMessage('Template name is required'),
            body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
            body('reportType').isIn(['EXECUTIVE_SUMMARY', 'DETAILED_ANALYSIS', 'OPERATIONAL_METRICS', 'REGULATORY_FILING', 'EXCEPTION_REPORT', 'TREND_ANALYSIS', 'CUSTOM']).withMessage('Valid report type is required'),
            body('defaultParameters').isObject().withMessage('Default parameters are required'),
            body('sections').isArray().withMessage('Sections must be an array'),
            body('charts').isArray().withMessage('Charts must be an array')
        ];
    }
    validateReportSchedule() {
        return [
            body('reportTemplate').isUUID().withMessage('Valid report template ID is required'),
            body('frequency').isIn(['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ON_DEMAND']).withMessage('Valid frequency is required'),
            body('recipients').isArray().withMessage('Recipients must be an array'),
            body('parameters').isObject().withMessage('Parameters are required')
        ];
    }
    // Route handler methods
    async calculateSettlementRisk(req, res) {
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
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const assessment = await this.riskCalculationEngine.calculateSettlementRisk(instruction);
            res.json(assessment);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to calculate settlement risk', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getRiskAssessment(req, res) {
        try {
            const { instructionId } = req.params;
            const assessment = this.riskCalculationEngine.getRiskAssessment(instructionId);
            if (!assessment) {
                res.status(404).json({ error: 'Risk assessment not found' });
                return;
            }
            res.json(assessment);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve risk assessment', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getAllRiskAssessments(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const allAssessments = this.riskCalculationEngine.getAllRiskAssessments();
            const paginatedAssessments = allAssessments.slice(offset, offset + limit);
            res.json({
                assessments: paginatedAssessments,
                total: allAssessments.length,
                limit,
                offset
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve risk assessments', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getHighRiskInstructions(req, res) {
        try {
            const highRiskInstructions = this.riskCalculationEngine.getHighRiskInstructions();
            res.json(highRiskInstructions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve high risk instructions', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getRiskSummary(req, res) {
        try {
            const summary = this.riskCalculationEngine.generateRiskSummary();
            res.json(summary);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate risk summary', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async createCounterpartyProfile(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create counterparty profile', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async updateCounterpartyProfile(req, res) {
        try {
            const { counterpartyId } = req.params;
            const updates = req.body;
            const profile = await this.counterpartyRiskService.updateCounterpartyProfile(counterpartyId, updates);
            res.json(profile);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update counterparty profile', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async performCounterpartyRiskAssessment(req, res) {
        try {
            const { counterpartyId } = req.params;
            const riskMetrics = await this.counterpartyRiskService.performRiskAssessment(counterpartyId);
            res.json(riskMetrics);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to perform risk assessment', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getCounterpartyProfile(req, res) {
        try {
            const { counterpartyId } = req.params;
            const profile = this.counterpartyRiskService.getCounterpartyProfile(counterpartyId);
            if (!profile) {
                res.status(404).json({ error: 'Counterparty profile not found' });
                return;
            }
            res.json(profile);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve counterparty profile', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getCounterpartyRiskMetrics(req, res) {
        try {
            const { counterpartyId } = req.params;
            const riskMetrics = this.counterpartyRiskService.getRiskMetrics(counterpartyId);
            if (!riskMetrics) {
                res.status(404).json({ error: 'Risk metrics not found' });
                return;
            }
            res.json(riskMetrics);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve risk metrics', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getAllCounterparties(req, res) {
        try {
            const counterparties = this.counterpartyRiskService.getAllCounterparties();
            res.json(counterparties);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve counterparties', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getHighRiskCounterparties(req, res) {
        try {
            const highRiskCounterparties = this.counterpartyRiskService.getHighRiskCounterparties();
            res.json(highRiskCounterparties);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve high risk counterparties', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async addExposureLimit(req, res) {
        try {
            const { counterpartyId } = req.params;
            const limitData = {
                ...req.body,
                counterpartyId,
                status: 'ACTIVE',
                reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                createdAt: new Date()
            };
            const exposureLimit = await this.counterpartyRiskService.addExposureLimit(counterpartyId, limitData);
            res.status(201).json(exposureLimit);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to add exposure limit', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async recordCreditEvent(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to record credit event', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async createSettlementInstruction(req, res) {
        try {
            const instructionData = {
                ...req.body,
                tradeDate: new Date(req.body.tradeDate),
                settlementDate: new Date(req.body.settlementDate),
                expectedSettlementTime: new Date(req.body.expectedSettlementTime)
            };
            const instruction = await this.timelineTrackingService.createSettlementInstruction(instructionData);
            res.status(201).json(instruction);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create settlement instruction', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async updateMilestoneStatus(req, res) {
        try {
            const { instructionId, milestoneType } = req.params;
            const { status, notes } = req.body;
            await this.timelineTrackingService.updateMilestoneStatus(instructionId, milestoneType, status, notes);
            res.json({ message: 'Milestone status updated successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update milestone status', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getSettlementTimeline(req, res) {
        try {
            const { instructionId } = req.params;
            const timeline = this.timelineTrackingService.getSettlementTimeline(instructionId);
            if (!timeline) {
                res.status(404).json({ error: 'Settlement timeline not found' });
                return;
            }
            res.json(timeline);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve settlement timeline', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getSettlementInstructions(req, res) {
        try {
            const { status, counterpartyId } = req.query;
            let instructions = this.timelineTrackingService.getAllSettlementInstructions();
            if (status) {
                instructions = this.timelineTrackingService.getInstructionsByStatus(status);
            }
            if (counterpartyId) {
                instructions = this.timelineTrackingService.getInstructionsByCounterparty(counterpartyId);
            }
            res.json(instructions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve settlement instructions', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getPendingMilestones(req, res) {
        try {
            const pendingMilestones = this.timelineTrackingService.getPendingMilestones();
            res.json(pendingMilestones);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve pending milestones', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getOverdueMilestones(req, res) {
        try {
            const overdueMilestones = this.timelineTrackingService.getOverdueMilestones();
            res.json(overdueMilestones);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve overdue milestones', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getActiveAlerts(req, res) {
        try {
            const { severity } = req.query;
            const alerts = this.timelineTrackingService.getActiveAlerts(severity);
            res.json(alerts);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve active alerts', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async acknowledgeAlert(req, res) {
        try {
            const { alertId } = req.params;
            const acknowledgedBy = req.user?.email || 'unknown';
            const acknowledged = this.timelineTrackingService.acknowledgeAlert(alertId, acknowledgedBy);
            if (!acknowledged) {
                res.status(404).json({ error: 'Alert not found' });
                return;
            }
            res.json({ message: 'Alert acknowledged successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to acknowledge alert', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async generatePerformanceReport(req, res) {
        try {
            const { period, startDate, endDate } = req.query;
            const report = this.timelineTrackingService.generatePerformanceReport(period, new Date(startDate), new Date(endDate));
            res.json(report);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate performance report', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async executePreSettlementChecks(req, res) {
        try {
            const orderData = {
                ...req.body,
                id: req.body.id || require('crypto').randomUUID(),
                createdAt: new Date()
            };
            const checkTypes = req.body.checkTypes;
            const checkSuite = await this.preSettlementChecksService.executePreSettlementChecks(orderData, checkTypes);
            res.json(checkSuite);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to execute pre-settlement checks', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getRiskCheckSuite(req, res) {
        try {
            const { suiteId } = req.params;
            // This would need to be implemented in the PreSettlementRiskChecksService
            res.status(501).json({ error: 'Not implemented' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve risk check suite', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getRiskCheckHistory(req, res) {
        try {
            const { orderId } = req.params;
            const history = this.preSettlementChecksService.getRiskCheckHistory(orderId);
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve risk check history', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async bypassRiskCheck(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to bypass risk check', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getRiskCheckAlerts(req, res) {
        try {
            const alerts = this.preSettlementChecksService.getAllActiveAlerts();
            res.json(alerts);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve risk check alerts', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getRiskCheckSummary(req, res) {
        try {
            const { timeFrame } = req.query;
            const summary = this.preSettlementChecksService.generateRiskSummary(timeFrame);
            res.json(summary);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate risk check summary', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async addRiskLimit(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to add risk limit', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async addComplianceRule(req, res) {
        try {
            const ruleData = {
                ...req.body,
                isActive: true,
                effectiveDate: new Date(req.body.effectiveDate),
                createdBy: req.user?.email || 'unknown'
            };
            const complianceRule = this.preSettlementChecksService.addComplianceRule(ruleData);
            res.status(201).json(complianceRule);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to add compliance rule', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async predictSettlementFailure(req, res) {
        try {
            const predictionInput = {
                ...req.body,
                settlementDate: new Date(req.body.settlementDate),
                tradeDate: new Date(req.body.tradeDate)
            };
            const prediction = await this.failurePredictionService.predictSettlementFailure(predictionInput);
            res.json(prediction);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to predict settlement failure', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getLatestPrediction(req, res) {
        try {
            const { instructionId } = req.params;
            const prediction = this.failurePredictionService.getLatestPrediction(instructionId);
            if (!prediction) {
                res.status(404).json({ error: 'Prediction not found' });
                return;
            }
            res.json(prediction);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve prediction', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getPredictionHistory(req, res) {
        try {
            const { instructionId } = req.params;
            const history = this.failurePredictionService.getPredictionHistory(instructionId);
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve prediction history', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getHighRiskPredictions(req, res) {
        try {
            const threshold = parseFloat(req.query.threshold) || 0.7;
            const highRiskPredictions = this.failurePredictionService.getHighRiskPredictions(threshold);
            res.json(highRiskPredictions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve high risk predictions', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async updatePredictionAccuracy(req, res) {
        try {
            const { instructionId } = req.params;
            const { actualOutcome, actualDelayDays } = req.body;
            await this.failurePredictionService.updatePredictionAccuracy(instructionId, actualOutcome, actualDelayDays);
            res.json({ message: 'Prediction accuracy updated successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update prediction accuracy', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getModelPerformance(req, res) {
        try {
            const { modelVersion } = req.query;
            const performance = this.failurePredictionService.getModelPerformance(modelVersion);
            if (!performance) {
                res.status(404).json({ error: 'Model performance data not found' });
                return;
            }
            res.json(performance);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve model performance', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getFailurePatterns(req, res) {
        try {
            const patterns = this.failurePredictionService.getFailurePatterns();
            res.json(patterns);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve failure patterns', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getPredictionSummary(req, res) {
        try {
            const { timeFrame } = req.query;
            const summary = this.failurePredictionService.generatePredictionSummary(timeFrame);
            res.json(summary);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate prediction summary', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async triggerWorkflow(req, res) {
        try {
            const { instructionId, triggerData, workflowId } = req.body;
            const triggeredBy = req.user?.email || 'unknown';
            const execution = await this.mitigationWorkflowsService.triggerWorkflow(instructionId, triggerData, triggeredBy, workflowId);
            res.status(201).json(execution);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to trigger workflow', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getWorkflowExecution(req, res) {
        try {
            const { executionId } = req.params;
            const execution = this.mitigationWorkflowsService.getWorkflowExecution(executionId);
            if (!execution) {
                res.status(404).json({ error: 'Workflow execution not found' });
                return;
            }
            res.json(execution);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getInstructionWorkflows(req, res) {
        try {
            const { instructionId } = req.params;
            const workflows = this.mitigationWorkflowsService.getInstructionWorkflows(instructionId);
            res.json(workflows);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve instruction workflows', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getActiveWorkflowExecutions(req, res) {
        try {
            const activeExecutions = this.mitigationWorkflowsService.getActiveExecutions();
            res.json(activeExecutions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve active workflow executions', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async pauseWorkflowExecution(req, res) {
        try {
            const { executionId } = req.params;
            const { reason } = req.body;
            const paused = this.mitigationWorkflowsService.pauseWorkflowExecution(executionId, reason);
            if (!paused) {
                res.status(404).json({ error: 'Workflow execution not found or cannot be paused' });
                return;
            }
            res.json({ message: 'Workflow execution paused successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to pause workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async resumeWorkflowExecution(req, res) {
        try {
            const { executionId } = req.params;
            const resumed = this.mitigationWorkflowsService.resumeWorkflowExecution(executionId);
            if (!resumed) {
                res.status(404).json({ error: 'Workflow execution not found or cannot be resumed' });
                return;
            }
            res.json({ message: 'Workflow execution resumed successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to resume workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async cancelWorkflowExecution(req, res) {
        try {
            const { executionId } = req.params;
            const { reason } = req.body;
            const cancelled = this.mitigationWorkflowsService.cancelWorkflowExecution(executionId, reason);
            if (!cancelled) {
                res.status(404).json({ error: 'Workflow execution not found or cannot be cancelled' });
                return;
            }
            res.json({ message: 'Workflow execution cancelled successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to cancel workflow execution', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getAllWorkflows(req, res) {
        try {
            const workflows = this.mitigationWorkflowsService.getAllWorkflows();
            res.json(workflows);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve workflows', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async createWorkflow(req, res) {
        try {
            const workflowData = {
                ...req.body,
                isActive: true,
                createdBy: req.user?.email || 'unknown'
            };
            const workflow = this.mitigationWorkflowsService.createWorkflow(workflowData);
            res.status(201).json(workflow);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create workflow', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getWorkflowReport(req, res) {
        try {
            const { timeFrame } = req.query;
            const report = this.mitigationWorkflowsService.generateWorkflowReport(timeFrame);
            res.json(report);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate workflow report', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async generateReport(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getReport(req, res) {
        try {
            const { reportId } = req.params;
            const report = this.reportingService.getReport(reportId);
            if (!report) {
                res.status(404).json({ error: 'Report not found' });
                return;
            }
            res.json(report);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve report', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getReports(req, res) {
        try {
            const { type, recipient, days } = req.query;
            let reports;
            if (type) {
                reports = this.reportingService.getReportsByType(type);
            }
            else if (recipient) {
                reports = this.reportingService.getReportsForRecipient(recipient);
            }
            else if (days) {
                reports = this.reportingService.getRecentReports(parseInt(days));
            }
            else {
                reports = this.reportingService.getRecentReports();
            }
            res.json(reports);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve reports', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getReportTemplates(req, res) {
        try {
            const templates = this.reportingService.getAllReportTemplates();
            res.json(templates);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve report templates', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async createReportTemplate(req, res) {
        try {
            const templateData = {
                ...req.body,
                isSystem: false,
                createdBy: req.user?.email || 'unknown'
            };
            const template = this.reportingService.createReportTemplate(templateData);
            res.status(201).json(template);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create report template', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async createReportSchedule(req, res) {
        try {
            const scheduleData = {
                ...req.body,
                isActive: true,
                createdBy: req.user?.email || 'unknown'
            };
            const schedule = this.reportingService.createReportSchedule(scheduleData);
            res.status(201).json(schedule);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create report schedule', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getReportSchedules(req, res) {
        try {
            const schedules = this.reportingService.getAllReportSchedules();
            res.json(schedules);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve report schedules', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async updateReportSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const updates = req.body;
            const schedule = this.reportingService.updateReportSchedule(scheduleId, updates);
            if (!schedule) {
                res.status(404).json({ error: 'Report schedule not found' });
                return;
            }
            res.json(schedule);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update report schedule', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async deleteReportSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const deleted = this.reportingService.deleteReportSchedule(scheduleId);
            if (!deleted) {
                res.status(404).json({ error: 'Report schedule not found' });
                return;
            }
            res.json({ message: 'Report schedule deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete report schedule', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getReportingSummary(req, res) {
        try {
            const summary = this.reportingService.generateReportingSummary();
            res.json(summary);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate reporting summary', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getHealthStatus(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Health check failed', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getSystemMetrics(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to retrieve system metrics', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    getRouter() {
        return this.router;
    }
}
exports.SettlementRiskController = SettlementRiskController;

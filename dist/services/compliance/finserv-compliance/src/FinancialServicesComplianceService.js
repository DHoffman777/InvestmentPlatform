"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialServicesComplianceService = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const events_1 = require("events");
const ioredis_1 = __importDefault(require("ioredis"));
const joi_1 = __importDefault(require("joi"));
const ComplianceMonitoringService_1 = require("./services/ComplianceMonitoringService");
const RegulatoryFilingService_1 = require("./services/RegulatoryFilingService");
class FinancialServicesComplianceService extends events_1.EventEmitter {
    config;
    app;
    redis;
    complianceMonitoring;
    regulatoryFiling;
    constructor(config) {
        super();
        this.config = config;
        this.app = (0, express_1.default)();
        this.redis = new ioredis_1.default({
            host: config.database.redis.host,
            port: config.database.redis.port,
            password: config.database.redis.password,
            db: config.database.redis.db,
            keyPrefix: 'finserv-compliance:',
        });
        this.complianceMonitoring = new ComplianceMonitoringService_1.ComplianceMonitoringService(config);
        this.regulatoryFiling = new RegulatoryFilingService_1.RegulatoryFilingService(config);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
        // Error handling
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal server error', details: err.message });
        });
    }
    setupRoutes() {
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
                const violationSchema = joi_1.default.object({
                    violationType: joi_1.default.string().valid('REGULATORY', 'POLICY', 'ETHICAL', 'OPERATIONAL').required(),
                    severity: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
                    regulator: joi_1.default.string().optional(),
                    regulation: joi_1.default.string().required(),
                    section: joi_1.default.string().required(),
                    description: joi_1.default.string().required(),
                    discoveredBy: joi_1.default.string().required(),
                    affectedParties: joi_1.default.array().items(joi_1.default.string()).required(),
                    potentialImpact: joi_1.default.string().required(),
                    rootCause: joi_1.default.string().required(),
                    reportingRequired: joi_1.default.boolean().default(false),
                    reportingDeadline: joi_1.default.date().optional(),
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
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to record violation', details: error.message });
            }
        });
        this.app.get('/api/v1/violations', async (req, res) => {
            try {
                const { type, severity, status, regulator, startDate, endDate, page = 1, limit = 50 } = req.query;
                // In production, this would query the actual data store with filters
                const violations = await this.getViolations({
                    type: type,
                    severity: severity,
                    status: status,
                    regulator: regulator,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    page: parseInt(page),
                    limit: parseInt(limit),
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
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to retrieve violations', details: error.message });
            }
        });
        this.app.get('/api/v1/violations/:violationId', async (req, res) => {
            try {
                const violation = await this.getViolation(req.params.violationId);
                if (!violation) {
                    return res.status(404).json({ error: 'Violation not found' });
                }
                res.json(violation);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to retrieve violation', details: error.message });
            }
        });
        this.app.post('/api/v1/violations/:violationId/corrective-actions', async (req, res) => {
            try {
                const actionSchema = joi_1.default.object({
                    action: joi_1.default.string().required(),
                    assignedTo: joi_1.default.string().required(),
                    dueDate: joi_1.default.date().required(),
                });
                const { error, value } = actionSchema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: 'Validation failed', details: error.details });
                }
                const correctiveAction = await this.complianceMonitoring.assignCorrectiveAction(req.params.violationId, {
                    ...value,
                    status: 'ASSIGNED',
                    effectiveness: 'NOT_ASSESSED',
                });
                res.status(201).json({
                    success: true,
                    actionId: correctiveAction.id,
                    message: 'Corrective action assigned successfully',
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to assign corrective action', details: error.message });
            }
        });
        // Suitability Assessments
        this.app.post('/api/v1/suitability/assess', async (req, res) => {
            try {
                const assessmentSchema = joi_1.default.object({
                    clientId: joi_1.default.string().required(),
                    productType: joi_1.default.string().required(),
                    conductedBy: joi_1.default.string().required(),
                });
                const { error, value } = assessmentSchema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: 'Validation failed', details: error.details });
                }
                const assessment = await this.complianceMonitoring.conductSuitabilityAssessment(value.clientId, value.productType, value.conductedBy);
                res.status(201).json({
                    success: true,
                    assessmentId: assessment.id,
                    determination: assessment.suitabilityDetermination,
                    requiresSupervisoryReview: assessment.suitabilityDetermination !== 'SUITABLE',
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to conduct suitability assessment', details: error.message });
            }
        });
        this.app.get('/api/v1/suitability/client/:clientId', async (req, res) => {
            try {
                const assessments = await this.getClientSuitabilityAssessments(req.params.clientId);
                res.json({ assessments });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to retrieve assessments', details: error.message });
            }
        });
        // Best Execution Analysis
        this.app.post('/api/v1/best-execution/analyze', async (req, res) => {
            try {
                const analysisSchema = joi_1.default.object({
                    startDate: joi_1.default.date().required(),
                    endDate: joi_1.default.date().required(),
                    orderType: joi_1.default.string().default('ALL'),
                    securityType: joi_1.default.string().default('ALL'),
                });
                const { error, value } = analysisSchema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: 'Validation failed', details: error.details });
                }
                const analysis = await this.complianceMonitoring.performBestExecutionAnalysis(value.startDate, value.endDate, value.orderType, value.securityType);
                res.status(201).json({
                    success: true,
                    analysisId: analysis.id,
                    complianceAssessment: analysis.complianceAssessment,
                    improvementCount: analysis.improvements.length,
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to perform best execution analysis', details: error.message });
            }
        });
        // AML Checks
        this.app.post('/api/v1/aml/check', async (req, res) => {
            try {
                const amlSchema = joi_1.default.object({
                    clientId: joi_1.default.string().required(),
                    checkType: joi_1.default.string().valid('INITIAL', 'PERIODIC', 'ENHANCED', 'TRANSACTION_BASED').default('PERIODIC'),
                });
                const { error, value } = amlSchema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: 'Validation failed', details: error.details });
                }
                const amlCheck = await this.complianceMonitoring.performAMLCheck(value.clientId, value.checkType);
                res.status(201).json({
                    success: true,
                    checkId: amlCheck.id,
                    riskLevel: amlCheck.riskLevel,
                    decision: amlCheck.complianceDecision,
                    requiresEnhancedDueDiligence: amlCheck.dueDiligenceLevel === 'ENHANCED',
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to perform AML check', details: error.message });
            }
        });
        this.app.get('/api/v1/aml/client/:clientId', async (req, res) => {
            try {
                const amlChecks = await this.getClientAMLChecks(req.params.clientId);
                res.json({ amlChecks });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to retrieve AML checks', details: error.message });
            }
        });
        // Regulatory Filing
        this.app.post('/api/v1/filings', async (req, res) => {
            try {
                const filingSchema = joi_1.default.object({
                    firmId: joi_1.default.string().required(),
                    formType: joi_1.default.string().valid('ADV', 'BD', 'PF', '13F', 'FOCUS', 'FORM_U4', 'FORM_U5', 'SAR', 'CTR', 'FORM_8K', 'FORM_10K', 'CUSTOM').required(),
                    frequency: joi_1.default.string().valid('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'AS_NEEDED', 'EVENT_DRIVEN').required(),
                    dueDate: joi_1.default.date().required(),
                    filingPeriod: joi_1.default.string().required(),
                    assignedTo: joi_1.default.string().optional(),
                    estimatedHours: joi_1.default.number().required(),
                    dependencies: joi_1.default.array().items(joi_1.default.string()).default([]),
                    regulatoryAuthority: joi_1.default.string().required(),
                    submissionMethod: joi_1.default.string().valid('IARD', 'EDGAR', 'CRD', 'FINRA_GATEWAY', 'PAPER', 'EMAIL').required(),
                });
                const { error, value } = filingSchema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: 'Validation failed', details: error.details });
                }
                const filing = await this.regulatoryFiling.createFilingRequirement(value.firmId, {
                    ...value,
                    status: 'NOT_STARTED',
                });
                res.status(201).json({
                    success: true,
                    filingId: filing.id,
                    message: 'Filing requirement created successfully',
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to create filing requirement', details: error.message });
            }
        });
        this.app.post('/api/v1/filings/form-adv/prepare', async (req, res) => {
            try {
                const schema = joi_1.default.object({
                    firmId: joi_1.default.string().required(),
                    filingPeriod: joi_1.default.string().required(),
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
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to prepare Form ADV', details: error.message });
            }
        });
        this.app.post('/api/v1/filings/form-pf/prepare', async (req, res) => {
            try {
                const schema = joi_1.default.object({
                    firmId: joi_1.default.string().required(),
                    filingPeriod: joi_1.default.string().required(),
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
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to prepare Form PF', details: error.message });
            }
        });
        this.app.post('/api/v1/filings/13f/prepare', async (req, res) => {
            try {
                const schema = joi_1.default.object({
                    firmId: joi_1.default.string().required(),
                    reportingPeriod: joi_1.default.string().required(),
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
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to prepare 13F filing', details: error.message });
            }
        });
        this.app.post('/api/v1/filings/:filingId/submit', async (req, res) => {
            try {
                const schema = joi_1.default.object({
                    submittedBy: joi_1.default.string().required(),
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
                }
                else {
                    res.status(400).json({
                        success: false,
                        errors: result.errors,
                        message: 'Filing submission failed',
                    });
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to submit filing', details: error.message });
            }
        });
        this.app.get('/api/v1/filings/:filingId/status', async (req, res) => {
            try {
                const status = await this.regulatoryFiling.getFilingStatus(req.params.filingId);
                res.json(status);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get filing status', details: error.message });
            }
        });
        this.app.get('/api/v1/filings/calendar/:firmId', async (req, res) => {
            try {
                const { startDate, endDate } = req.query;
                if (!startDate || !endDate) {
                    return res.status(400).json({ error: 'startDate and endDate are required' });
                }
                const calendar = await this.regulatoryFiling.getFilingCalendar(req.params.firmId, new Date(startDate), new Date(endDate));
                res.json(calendar);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get filing calendar', details: error.message });
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
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                });
                res.json(metrics);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get compliance metrics', details: error.message });
            }
        });
        this.app.post('/api/v1/reports/generate', async (req, res) => {
            try {
                const reportSchema = joi_1.default.object({
                    reportType: joi_1.default.string().valid('MONTHLY', 'QUARTERLY', 'ANNUAL', 'AD_HOC', 'REGULATORY_EXAM').required(),
                    startDate: joi_1.default.date().required(),
                    endDate: joi_1.default.date().required(),
                    generatedBy: joi_1.default.string().required(),
                    sections: joi_1.default.array().items(joi_1.default.string()).default(['violations', 'suitability', 'aml', 'filings']),
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
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to generate report', details: error.message });
            }
        });
        // Trade Reporting
        this.app.post('/api/v1/trade-reporting/schedule', async (req, res) => {
            try {
                const schema = joi_1.default.object({
                    tradeId: joi_1.default.string().required(),
                    reportingRegime: joi_1.default.string().valid('CAT', 'OATS', 'BLUE_SHEETS', 'LARGE_TRADER', 'FORM_13F', 'SECTION_16', 'EMIR', 'MIFID_II').required(),
                });
                const { error, value } = schema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: 'Validation failed', details: error.details });
                }
                const tradeReporting = await this.complianceMonitoring.scheduleTradeReporting(value.tradeId, value.reportingRegime);
                res.status(201).json({
                    success: true,
                    reportingId: tradeReporting.id,
                    deadline: tradeReporting.reportingDeadline,
                    regime: tradeReporting.reportingRegime,
                });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to schedule trade reporting', details: error.message });
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
    setupEventHandlers() {
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
    async getViolations(filters) {
        // In production, this would query the actual data store with filters
        return {
            data: [],
            page: filters.page || 1,
            limit: filters.limit || 50,
            total: 0,
        };
    }
    async getViolation(violationId) {
        const data = await this.redis.get(`violation:${violationId}`);
        return data ? JSON.parse(data) : null;
    }
    async getClientSuitabilityAssessments(clientId) {
        const assessmentIds = await this.redis.smembers(`client-suitability:${clientId}`);
        const assessments = [];
        for (const assessmentId of assessmentIds) {
            const data = await this.redis.get(`suitability:${assessmentId}`);
            if (data) {
                assessments.push(JSON.parse(data));
            }
        }
        return assessments.sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
    }
    async getClientAMLChecks(clientId) {
        const checkIds = await this.redis.smembers(`client-aml:${clientId}`);
        const checks = [];
        for (const checkId of checkIds) {
            const data = await this.redis.get(`aml-check:${checkId}`);
            if (data) {
                checks.push(JSON.parse(data));
            }
        }
        return checks.sort((a, b) => b.checkDate.getTime() - a.checkDate.getTime());
    }
    async generateComplianceReport(params) {
        const report = {
            id: this.generateReportId(),
            reportType: params.reportType,
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
        await this.redis.setex(`report:${report.id}`, 86400 * 365 * 7, JSON.stringify(report));
        return report;
    }
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.config.service.port, this.config.service.host, () => {
                console.log(`Financial Services Compliance Service running on ${this.config.service.host}:${this.config.service.port}`);
                resolve();
            });
        });
    }
    async cleanup() {
        await this.complianceMonitoring.cleanup();
        await this.regulatoryFiling.cleanup();
        await this.redis.quit();
    }
}
exports.FinancialServicesComplianceService = FinancialServicesComplianceService;

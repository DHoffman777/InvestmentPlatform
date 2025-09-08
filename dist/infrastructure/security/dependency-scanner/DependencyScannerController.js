"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyScannerController = void 0;
const express_1 = require("express");
const { body, param, query, validationResult } = require('express-validator');
const events_1 = require("events");
class DependencyScannerController extends events_1.EventEmitter {
    inventoryService;
    vulnerabilityService;
    workflowService;
    riskService;
    recommendationEngine;
    reportingService;
    policyService;
    router;
    constructor(inventoryService, vulnerabilityService, workflowService, riskService, recommendationEngine, reportingService, policyService) {
        super();
        this.inventoryService = inventoryService;
        this.vulnerabilityService = vulnerabilityService;
        this.workflowService = workflowService;
        this.riskService = riskService;
        this.recommendationEngine = recommendationEngine;
        this.reportingService = reportingService;
        this.policyService = policyService;
        this.router = (0, express_1.Router)();
        this.setupEventListeners();
        this.setupRoutes();
    }
    setupEventListeners() {
        // Inventory service events
        this.inventoryService.on('scanCompleted', (event) => {
            this.emit('inventoryScanCompleted', event);
        });
        // Vulnerability service events
        this.vulnerabilityService.on('scanCompleted', (event) => {
            this.emit('vulnerabilityScanCompleted', event);
        });
        // Workflow service events
        this.workflowService.on('executionCompleted', (event) => {
            this.emit('workflowExecutionCompleted', event);
        });
        // Policy service events
        this.policyService.on('policyViolationNotification', (event) => {
            this.emit('policyViolationDetected', event);
        });
    }
    setupRoutes() {
        // Dependency Inventory Routes
        this.router.post('/inventory/scan', this.validateScanProject(), this.scanProject.bind(this));
        this.router.get('/inventory/:inventoryId', this.validateInventoryId(), this.getInventory.bind(this));
        this.router.get('/inventory', this.validateGetInventories(), this.getInventories.bind(this));
        this.router.put('/inventory/:inventoryId/rescan', this.validateInventoryId(), this.rescanInventory.bind(this));
        this.router.delete('/inventory/:inventoryId', this.validateInventoryId(), this.deleteInventory.bind(this));
        this.router.get('/inventory/:inventoryId/dependencies', this.validateGetDependencies(), this.getDependencies.bind(this));
        this.router.get('/inventory/:inventoryId/metrics', this.validateInventoryId(), this.getInventoryMetrics.bind(this));
        // Vulnerability Scanning Routes
        this.router.post('/vulnerabilities/scan', this.validateVulnerabilityScan(), this.scanVulnerabilities.bind(this));
        this.router.get('/vulnerabilities/scans/:scanId', this.validateScanId(), this.getScanReport.bind(this));
        this.router.get('/vulnerabilities/scans', this.validateGetScans(), this.getRecentScans.bind(this));
        this.router.get('/vulnerabilities/:vulnerabilityId', this.validateVulnerabilityId(), this.getVulnerability.bind(this));
        this.router.post('/vulnerabilities/refresh', this.validateRefreshVulnerabilities(), this.refreshVulnerabilityData.bind(this));
        this.router.get('/vulnerabilities/metrics', this.validateTenantAccess(), this.getVulnerabilityMetrics.bind(this));
        // Automated Workflow Routes
        this.router.post('/workflows/schedules', this.validateCreateSchedule(), this.createSchedule.bind(this));
        this.router.get('/workflows/schedules/:scheduleId', this.validateScheduleId(), this.getSchedule.bind(this));
        this.router.get('/workflows/schedules', this.validateTenantAccess(), this.getSchedules.bind(this));
        this.router.put('/workflows/schedules/:scheduleId', this.validateUpdateSchedule(), this.updateSchedule.bind(this));
        this.router.delete('/workflows/schedules/:scheduleId', this.validateScheduleId(), this.deleteSchedule.bind(this));
        this.router.post('/workflows/schedules/:scheduleId/execute', this.validateScheduleId(), this.executeSchedule.bind(this));
        this.router.post('/workflows/schedules/:scheduleId/enable', this.validateScheduleId(), this.enableSchedule.bind(this));
        this.router.post('/workflows/schedules/:scheduleId/disable', this.validateScheduleId(), this.disableSchedule.bind(this));
        this.router.get('/workflows/executions/:executionId', this.validateExecutionId(), this.getExecution.bind(this));
        this.router.get('/workflows/executions', this.validateGetExecutions(), this.getExecutions.bind(this));
        this.router.post('/workflows/executions/:executionId/cancel', this.validateExecutionId(), this.cancelExecution.bind(this));
        this.router.get('/workflows/metrics', this.validateTenantAccess(), this.getWorkflowMetrics.bind(this));
        // Risk Assessment Routes
        this.router.post('/risk/assess', this.validateRiskAssessment(), this.assessRisk.bind(this));
        this.router.get('/risk/assessments/:assessmentId', this.validateAssessmentId(), this.getRiskAssessment.bind(this));
        this.router.get('/risk/assessments', this.validateGetAssessments(), this.getRiskAssessments.bind(this));
        this.router.post('/risk/assessments/:assessmentId/reassess', this.validateAssessmentId(), this.reassessRisk.bind(this));
        this.router.post('/risk/prioritize', this.validatePrioritizeRisk(), this.prioritizeRiskAssessments.bind(this));
        this.router.post('/risk/context', this.validateBusinessContext(), this.setBusinessContext.bind(this));
        this.router.get('/risk/context', this.validateTenantAccess(), this.getBusinessContext.bind(this));
        this.router.get('/risk/metrics', this.validateTenantAccess(), this.getRiskMetrics.bind(this));
        // Update Recommendation Routes
        this.router.post('/recommendations/generate', this.validateGenerateRecommendations(), this.generateRecommendations.bind(this));
        this.router.get('/recommendations/:recommendationId', this.validateRecommendationId(), this.getRecommendation.bind(this));
        this.router.get('/recommendations', this.validateGetRecommendations(), this.getRecommendations.bind(this));
        this.router.post('/recommendations/:recommendationId/approve', this.validateRecommendationAction(), this.approveRecommendation.bind(this));
        this.router.post('/recommendations/:recommendationId/reject', this.validateRecommendationAction(), this.rejectRecommendation.bind(this));
        this.router.post('/recommendations/batches', this.validateCreateBatch(), this.createUpdateBatch.bind(this));
        this.router.get('/recommendations/batches/:batchId', this.validateBatchId(), this.getBatch.bind(this));
        this.router.post('/recommendations/strategy', this.validateUpdateStrategy(), this.setUpdateStrategy.bind(this));
        this.router.get('/recommendations/strategy', this.validateTenantAccess(), this.getUpdateStrategy.bind(this));
        this.router.get('/recommendations/metrics', this.validateTenantAccess(), this.getRecommendationMetrics.bind(this));
        // Compliance Reporting Routes
        this.router.post('/reports/generate', this.validateGenerateReport(), this.generateReport.bind(this));
        this.router.get('/reports/:reportId', this.validateReportId(), this.getReport.bind(this));
        this.router.get('/reports', this.validateGetReports(), this.getReports.bind(this));
        this.router.post('/reports/:reportId/approve', this.validateReportAction(), this.approveReport.bind(this));
        this.router.post('/reports/:reportId/distribute', this.validateReportId(), this.distributeReport.bind(this));
        this.router.post('/reports/schedules', this.validateScheduleReport(), this.scheduleReport.bind(this));
        this.router.delete('/reports/schedules/:scheduleId', this.validateScheduleId(), this.unscheduleReport.bind(this));
        this.router.get('/reports/metrics', this.validateTenantAccess(), this.getComplianceMetrics.bind(this));
        // Policy Management Routes
        this.router.post('/policies', this.validateCreatePolicy(), this.createPolicy.bind(this));
        this.router.post('/policies/from-template', this.validateCreateFromTemplate(), this.createPolicyFromTemplate.bind(this));
        this.router.get('/policies/:policyId', this.validatePolicyId(), this.getPolicy.bind(this));
        this.router.get('/policies', this.validateGetPolicies(), this.getPolicies.bind(this));
        this.router.put('/policies/:policyId', this.validateUpdatePolicy(), this.updatePolicy.bind(this));
        this.router.delete('/policies/:policyId', this.validatePolicyId(), this.deletePolicy.bind(this));
        this.router.post('/policies/evaluate', this.validateEvaluatePolicies(), this.evaluatePolicies.bind(this));
        this.router.get('/policies/templates', this.validateTenantAccess(), this.getPolicyTemplates.bind(this));
        this.router.get('/policies/templates/:templateId', this.validateTemplateId(), this.getPolicyTemplate.bind(this));
        this.router.get('/policies/violations/:violationId', this.validateViolationId(), this.getViolation.bind(this));
        this.router.get('/policies/violations', this.validateGetViolations(), this.getViolations.bind(this));
        this.router.post('/policies/violations/:violationId/resolve', this.validateResolveViolation(), this.resolveViolation.bind(this));
        this.router.get('/policies/evaluations/:evaluationId', this.validateEvaluationId(), this.getEvaluationResult.bind(this));
        this.router.get('/policies/metrics', this.validateTenantAccess(), this.getPolicyMetrics.bind(this));
        // Dashboard and Analytics Routes
        this.router.get('/dashboard/overview', this.validateTenantAccess(), this.getDashboardOverview.bind(this));
        this.router.get('/dashboard/security', this.validateTenantAccess(), this.getSecurityDashboard.bind(this));
        this.router.get('/dashboard/compliance', this.validateTenantAccess(), this.getComplianceDashboard.bind(this));
        this.router.get('/analytics/trends', this.validateAnalyticsQuery(), this.getTrends.bind(this));
        this.router.get('/analytics/insights', this.validateAnalyticsQuery(), this.getInsights.bind(this));
    }
    // Validation middleware
    validateScanProject() {
        return [
            body('projectPath').isString().notEmpty(),
            body('projectName').isString().notEmpty(),
            body('options').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateInventoryId() {
        return [
            param('inventoryId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetInventories() {
        return [
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            query('offset').isInt({ min: 0 }).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateGetDependencies() {
        return [
            param('inventoryId').isString().notEmpty(),
            query('ecosystem').isString().optional(),
            query('type').isIn(['direct', 'transitive']).optional(),
            query('scope').isIn(['production', 'development', 'optional', 'peer']).optional(),
            query('search').isString().optional(),
            this.handleValidationErrors
        ];
    }
    validateVulnerabilityScan() {
        return [
            body('inventoryId').isString().notEmpty(),
            body('options').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateScanId() {
        return [
            param('scanId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateVulnerabilityId() {
        return [
            param('vulnerabilityId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetScans() {
        return [
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateRefreshVulnerabilities() {
        return [
            body('packageName').isString().notEmpty(),
            body('ecosystem').isString().notEmpty(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateCreateSchedule() {
        return [
            body('name').isString().notEmpty(),
            body('projectPaths').isArray().notEmpty(),
            body('cronExpression').isString().notEmpty(),
            body('scanOptions').isObject().optional(),
            body('vulnerabilityScanOptions').isObject().optional(),
            body('notifications').isArray().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateScheduleId() {
        return [
            param('scheduleId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateUpdateSchedule() {
        return [
            param('scheduleId').isString().notEmpty(),
            body('name').isString().optional(),
            body('cronExpression').isString().optional(),
            body('enabled').isBoolean().optional(),
            this.handleValidationErrors
        ];
    }
    validateExecutionId() {
        return [
            param('executionId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetExecutions() {
        return [
            query('scheduleId').isString().optional(),
            query('status').isString().optional(),
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateRiskAssessment() {
        return [
            body('dependencies').isArray().notEmpty(),
            body('vulnerabilities').isArray().optional(),
            body('businessContext').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateAssessmentId() {
        return [
            param('assessmentId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetAssessments() {
        return [
            query('riskLevel').isString().optional(),
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validatePrioritizeRisk() {
        return [
            body('assessmentIds').isArray().notEmpty(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateBusinessContext() {
        return [
            body('applicationCriticality').isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
            body('environmentType').isIn(['PRODUCTION', 'STAGING', 'DEVELOPMENT', 'TEST']),
            body('dataClassification').isIn(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']),
            body('regulatoryRequirements').isArray().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateGenerateRecommendations() {
        return [
            body('dependencies').isArray().notEmpty(),
            body('vulnerabilities').isArray().optional(),
            body('riskAssessments').isArray().optional(),
            body('businessContext').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateRecommendationId() {
        return [
            param('recommendationId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetRecommendations() {
        return [
            query('urgency').isString().optional(),
            query('status').isString().optional(),
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateRecommendationAction() {
        return [
            param('recommendationId').isString().notEmpty(),
            body('reason').isString().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateCreateBatch() {
        return [
            body('recommendationIds').isArray().notEmpty(),
            body('name').isString().notEmpty(),
            body('description').isString().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateBatchId() {
        return [
            param('batchId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateUpdateStrategy() {
        return [
            body('strategy').isIn(['AGGRESSIVE', 'BALANCED', 'CONSERVATIVE', 'SECURITY_ONLY']),
            body('autoApprovalRules').isArray().optional(),
            body('testingRequirements').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateGenerateReport() {
        return [
            body('reportType').isIn(['SECURITY_POSTURE', 'VULNERABILITY_SUMMARY', 'RISK_ASSESSMENT', 'LICENSE_COMPLIANCE', 'REGULATORY_COMPLIANCE', 'EXECUTIVE_SUMMARY']),
            body('scope').isObject(),
            body('templateId').isString().optional(),
            body('options').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateReportId() {
        return [
            param('reportId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetReports() {
        return [
            query('reportType').isString().optional(),
            query('status').isString().optional(),
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateReportAction() {
        return [
            param('reportId').isString().notEmpty(),
            body('approver').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateScheduleReport() {
        return [
            body('templateId').isString().notEmpty(),
            body('schedule').isObject(),
            body('scope').isObject(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateCreatePolicy() {
        return [
            body('name').isString().notEmpty(),
            body('description').isString().optional(),
            body('rules').isArray().notEmpty(),
            body('scope').isObject(),
            body('enforcement').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateCreateFromTemplate() {
        return [
            body('templateId').isString().notEmpty(),
            body('customizations').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validatePolicyId() {
        return [
            param('policyId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetPolicies() {
        return [
            query('enabled').isBoolean().optional(),
            query('framework').isString().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateUpdatePolicy() {
        return [
            param('policyId').isString().notEmpty(),
            body('name').isString().optional(),
            body('enabled').isBoolean().optional(),
            body('rules').isArray().optional(),
            this.handleValidationErrors
        ];
    }
    validateEvaluatePolicies() {
        return [
            body('dependencies').isArray().notEmpty(),
            body('context').isObject().optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateTemplateId() {
        return [
            param('templateId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateViolationId() {
        return [
            param('violationId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateGetViolations() {
        return [
            query('status').isString().optional(),
            query('severity').isString().optional(),
            query('policyId').isString().optional(),
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateResolveViolation() {
        return [
            param('violationId').isString().notEmpty(),
            body('resolution').isString().notEmpty(),
            body('resolvedBy').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateEvaluationId() {
        return [
            param('evaluationId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateAnalyticsQuery() {
        return [
            query('startDate').isISO8601().optional(),
            query('endDate').isISO8601().optional(),
            query('granularity').isIn(['day', 'week', 'month']).optional(),
            this.validateTenantAccess(),
            this.handleValidationErrors
        ];
    }
    validateTenantAccess() {
        return (req, res, next) => {
            if (!req.user || !req.user.tenantId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            req.tenantId = req.user.tenantId;
            next();
        };
    }
    handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        next();
    }
    // Route handlers
    // Inventory routes
    async scanProject(req, res) {
        try {
            const { projectPath, projectName, options } = req.body;
            const tenantId = req.tenantId;
            const inventory = await this.inventoryService.scanProject(projectPath, tenantId, projectName, options || {});
            res.status(201).json({
                success: true,
                data: inventory
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getInventory(req, res) {
        try {
            const { inventoryId } = req.params;
            const inventory = this.inventoryService.getInventory(inventoryId);
            if (!inventory) {
                res.status(404).json({ success: false, error: 'Inventory not found' });
                return;
            }
            // Check tenant access
            if (inventory.tenantId !== req.tenantId) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }
            res.json({
                success: true,
                data: inventory
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getInventories(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const tenantId = req.tenantId;
            const inventories = this.inventoryService.getInventoriesByTenant(tenantId);
            const total = inventories.length;
            const paginatedResults = inventories.slice(Number(offset), Number(offset) + Number(limit));
            res.json({
                success: true,
                data: {
                    inventories: paginatedResults,
                    pagination: {
                        limit: Number(limit),
                        offset: Number(offset),
                        total
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async rescanInventory(req, res) {
        try {
            const { inventoryId } = req.params;
            const { options } = req.body;
            const inventory = await this.inventoryService.updateInventory(inventoryId, options || {});
            res.json({
                success: true,
                data: inventory
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async deleteInventory(req, res) {
        try {
            const { inventoryId } = req.params;
            const deleted = this.inventoryService.deleteInventory(inventoryId);
            if (!deleted) {
                res.status(404).json({ success: false, error: 'Inventory not found' });
                return;
            }
            res.json({
                success: true,
                message: 'Inventory deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getDependencies(req, res) {
        try {
            const { inventoryId } = req.params;
            const { ecosystem, type, scope, search } = req.query;
            let dependencies = [];
            if (ecosystem) {
                dependencies = this.inventoryService.getDependenciesByEcosystem(inventoryId, ecosystem);
            }
            else {
                const inventory = this.inventoryService.getInventory(inventoryId);
                if (inventory) {
                    dependencies = inventory.packageFiles.flatMap(pf => pf.dependencies);
                }
            }
            // Apply additional filters
            if (type) {
                dependencies = dependencies.filter(d => d.type === type);
            }
            if (scope) {
                dependencies = dependencies.filter(d => d.scope === scope);
            }
            if (search) {
                const searchTerm = search.toLowerCase();
                dependencies = dependencies.filter(d => d.name.toLowerCase().includes(searchTerm) ||
                    d.description?.toLowerCase().includes(searchTerm));
            }
            res.json({
                success: true,
                data: {
                    dependencies,
                    count: dependencies.length
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getInventoryMetrics(req, res) {
        try {
            const { inventoryId } = req.params;
            const metrics = this.inventoryService.getInventoryMetrics(inventoryId);
            if (!metrics) {
                res.status(404).json({ success: false, error: 'Inventory not found' });
                return;
            }
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    // Vulnerability routes
    async scanVulnerabilities(req, res) {
        try {
            const { inventoryId, options } = req.body;
            const tenantId = req.tenantId;
            const inventory = this.inventoryService.getInventory(inventoryId);
            if (!inventory || inventory.tenantId !== tenantId) {
                res.status(404).json({ success: false, error: 'Inventory not found' });
                return;
            }
            const dependencies = inventory.packageFiles.flatMap(pf => pf.dependencies);
            const scanReport = await this.vulnerabilityService.scanDependencies(dependencies, inventoryId, options || {});
            res.status(201).json({
                success: true,
                data: scanReport
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getScanReport(req, res) {
        try {
            const { scanId } = req.params;
            const report = this.vulnerabilityService.getScanReport(scanId);
            if (!report) {
                res.status(404).json({ success: false, error: 'Scan report not found' });
                return;
            }
            res.json({
                success: true,
                data: report
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getRecentScans(req, res) {
        try {
            const { limit = 10 } = req.query;
            const scans = this.vulnerabilityService.getRecentScans(Number(limit));
            res.json({
                success: true,
                data: { scans }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getVulnerability(req, res) {
        try {
            const { vulnerabilityId } = req.params;
            const vulnerability = this.vulnerabilityService.getVulnerabilityById(vulnerabilityId);
            if (!vulnerability) {
                res.status(404).json({ success: false, error: 'Vulnerability not found' });
                return;
            }
            res.json({
                success: true,
                data: vulnerability
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async refreshVulnerabilityData(req, res) {
        try {
            const { packageName, ecosystem } = req.body;
            await this.vulnerabilityService.refreshVulnerabilityData(packageName, ecosystem);
            res.json({
                success: true,
                message: 'Vulnerability data refreshed successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getVulnerabilityMetrics(req, res) {
        try {
            const metrics = this.vulnerabilityService.getScanMetrics();
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    // Dashboard routes
    async getDashboardOverview(req, res) {
        try {
            const tenantId = req.tenantId;
            // Gather overview data from all services
            const [inventoryMetrics, vulnerabilityMetrics, workflowMetrics, riskMetrics, recommendationMetrics, complianceMetrics, policyMetrics] = await Promise.allSettled([
                Promise.resolve({}), // Placeholder for inventory service metrics
                Promise.resolve(this.vulnerabilityService.getScanMetrics()),
                Promise.resolve(this.workflowService.getWorkflowMetrics(tenantId)),
                Promise.resolve(this.riskService.getRiskMetrics(tenantId)),
                Promise.resolve(this.recommendationEngine.getRecommendationMetrics(tenantId)),
                Promise.resolve(this.reportingService.getComplianceMetrics(tenantId)),
                Promise.resolve(this.policyService.getPolicyMetrics(tenantId))
            ]);
            const overview = {
                inventory: inventoryMetrics.status === 'fulfilled' ? inventoryMetrics.value : {},
                vulnerabilities: vulnerabilityMetrics.status === 'fulfilled' ? vulnerabilityMetrics.value : {},
                workflows: workflowMetrics.status === 'fulfilled' ? workflowMetrics.value : {},
                risks: riskMetrics.status === 'fulfilled' ? riskMetrics.value : {},
                recommendations: recommendationMetrics.status === 'fulfilled' ? recommendationMetrics.value : {},
                compliance: complianceMetrics.status === 'fulfilled' ? complianceMetrics.value : {},
                policies: policyMetrics.status === 'fulfilled' ? policyMetrics.value : {},
                lastUpdated: new Date()
            };
            res.json({
                success: true,
                data: overview
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getSecurityDashboard(req, res) {
        try {
            const tenantId = req.tenantId;
            const securityData = {
                vulnerabilities: this.vulnerabilityService.getScanMetrics(),
                risks: this.riskService.getRiskMetrics(tenantId),
                policies: this.policyService.getPolicyMetrics(tenantId),
                lastUpdated: new Date()
            };
            res.json({
                success: true,
                data: securityData
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getComplianceDashboard(req, res) {
        try {
            const tenantId = req.tenantId;
            const complianceData = {
                reports: this.reportingService.getComplianceMetrics(tenantId),
                policies: this.policyService.getPolicyMetrics(tenantId),
                violations: this.policyService.getViolationsByTenant(tenantId),
                lastUpdated: new Date()
            };
            res.json({
                success: true,
                data: complianceData
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getTrends(req, res) {
        try {
            // Mock implementation - would aggregate trend data from various services
            const trends = {
                vulnerabilityTrend: [],
                complianceTrend: [],
                riskTrend: [],
                period: req.query.granularity || 'week'
            };
            res.json({
                success: true,
                data: trends
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getInsights(req, res) {
        try {
            // Mock implementation - would provide intelligent insights
            const insights = {
                recommendations: [],
                alerts: [],
                opportunities: [],
                generatedAt: new Date()
            };
            res.json({
                success: true,
                data: insights
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    // Placeholder implementations for remaining routes
    async createSchedule(req, res) {
        res.json({ success: true, message: 'Schedule creation not yet implemented' });
    }
    async getSchedule(req, res) {
        res.json({ success: true, data: { schedule: {} } });
    }
    async getSchedules(req, res) {
        res.json({ success: true, data: { schedules: [] } });
    }
    async updateSchedule(req, res) {
        res.json({ success: true, message: 'Schedule updated' });
    }
    async deleteSchedule(req, res) {
        res.json({ success: true, message: 'Schedule deleted' });
    }
    async executeSchedule(req, res) {
        res.json({ success: true, message: 'Schedule executed' });
    }
    async enableSchedule(req, res) {
        res.json({ success: true, message: 'Schedule enabled' });
    }
    async disableSchedule(req, res) {
        res.json({ success: true, message: 'Schedule disabled' });
    }
    async getExecution(req, res) {
        res.json({ success: true, data: { execution: {} } });
    }
    async getExecutions(req, res) {
        res.json({ success: true, data: { executions: [] } });
    }
    async cancelExecution(req, res) {
        res.json({ success: true, message: 'Execution cancelled' });
    }
    async getWorkflowMetrics(req, res) {
        res.json({ success: true, data: this.workflowService.getWorkflowMetrics(req.tenantId) });
    }
    async assessRisk(req, res) {
        res.json({ success: true, message: 'Risk assessment not yet implemented' });
    }
    async getRiskAssessment(req, res) {
        res.json({ success: true, data: { assessment: {} } });
    }
    async getRiskAssessments(req, res) {
        res.json({ success: true, data: { assessments: [] } });
    }
    async reassessRisk(req, res) {
        res.json({ success: true, message: 'Risk reassessment not yet implemented' });
    }
    async prioritizeRiskAssessments(req, res) {
        res.json({ success: true, data: { prioritized: [] } });
    }
    async setBusinessContext(req, res) {
        res.json({ success: true, message: 'Business context set' });
    }
    async getBusinessContext(req, res) {
        res.json({ success: true, data: { context: {} } });
    }
    async getRiskMetrics(req, res) {
        res.json({ success: true, data: this.riskService.getRiskMetrics(req.tenantId) });
    }
    async generateRecommendations(req, res) {
        res.json({ success: true, message: 'Recommendations generation not yet implemented' });
    }
    async getRecommendation(req, res) {
        res.json({ success: true, data: { recommendation: {} } });
    }
    async getRecommendations(req, res) {
        res.json({ success: true, data: { recommendations: [] } });
    }
    async approveRecommendation(req, res) {
        res.json({ success: true, message: 'Recommendation approved' });
    }
    async rejectRecommendation(req, res) {
        res.json({ success: true, message: 'Recommendation rejected' });
    }
    async createUpdateBatch(req, res) {
        res.json({ success: true, message: 'Update batch created' });
    }
    async getBatch(req, res) {
        res.json({ success: true, data: { batch: {} } });
    }
    async setUpdateStrategy(req, res) {
        res.json({ success: true, message: 'Update strategy set' });
    }
    async getUpdateStrategy(req, res) {
        res.json({ success: true, data: { strategy: {} } });
    }
    async getRecommendationMetrics(req, res) {
        res.json({ success: true, data: this.recommendationEngine.getRecommendationMetrics(req.tenantId) });
    }
    async generateReport(req, res) {
        res.json({ success: true, message: 'Report generation not yet implemented' });
    }
    async getReport(req, res) {
        res.json({ success: true, data: { report: {} } });
    }
    async getReports(req, res) {
        res.json({ success: true, data: { reports: [] } });
    }
    async approveReport(req, res) {
        res.json({ success: true, message: 'Report approved' });
    }
    async distributeReport(req, res) {
        res.json({ success: true, message: 'Report distributed' });
    }
    async scheduleReport(req, res) {
        res.json({ success: true, message: 'Report scheduled' });
    }
    async unscheduleReport(req, res) {
        res.json({ success: true, message: 'Report unscheduled' });
    }
    async getComplianceMetrics(req, res) {
        res.json({ success: true, data: this.reportingService.getComplianceMetrics(req.tenantId) });
    }
    async createPolicy(req, res) {
        res.json({ success: true, message: 'Policy creation not yet implemented' });
    }
    async createPolicyFromTemplate(req, res) {
        res.json({ success: true, message: 'Policy from template creation not yet implemented' });
    }
    async getPolicy(req, res) {
        res.json({ success: true, data: { policy: {} } });
    }
    async getPolicies(req, res) {
        res.json({ success: true, data: { policies: [] } });
    }
    async updatePolicy(req, res) {
        res.json({ success: true, message: 'Policy updated' });
    }
    async deletePolicy(req, res) {
        res.json({ success: true, message: 'Policy deleted' });
    }
    async evaluatePolicies(req, res) {
        res.json({ success: true, message: 'Policy evaluation not yet implemented' });
    }
    async getPolicyTemplates(req, res) {
        res.json({ success: true, data: { templates: this.policyService.getTemplates() } });
    }
    async getPolicyTemplate(req, res) {
        const { templateId } = req.params;
        const template = this.policyService.getTemplate(templateId);
        if (!template) {
            res.status(404).json({ success: false, error: 'Template not found' });
            return;
        }
        res.json({ success: true, data: template });
    }
    async getViolation(req, res) {
        res.json({ success: true, data: { violation: {} } });
    }
    async getViolations(req, res) {
        res.json({ success: true, data: { violations: [] } });
    }
    async resolveViolation(req, res) {
        res.json({ success: true, message: 'Violation resolved' });
    }
    async getEvaluationResult(req, res) {
        res.json({ success: true, data: { evaluation: {} } });
    }
    async getPolicyMetrics(req, res) {
        res.json({ success: true, data: this.policyService.getPolicyMetrics(req.tenantId) });
    }
    getRouter() {
        return this.router;
    }
}
exports.DependencyScannerController = DependencyScannerController;

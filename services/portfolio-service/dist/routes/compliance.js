"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const kafka_mock_1 = require("../utils/kafka-mock");
const complianceMonitoringService_1 = require("../services/complianceMonitoringService");
const complianceWorkflowService_1 = require("../services/complianceWorkflowService");
const regulatoryRuleEngine_1 = require("../services/regulatoryRuleEngine");
const logger_1 = require("../utils/logger");
const ComplianceMonitoring_1 = require("../models/compliance/ComplianceMonitoring");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const complianceService = new complianceMonitoringService_1.ComplianceMonitoringService(prisma, kafkaService);
const workflowService = new complianceWorkflowService_1.ComplianceWorkflowService(prisma, kafkaService);
const ruleEngine = new regulatoryRuleEngine_1.RegulatoryRuleEngine(prisma, kafkaService);
// Investment Guideline Checking Routes
// Check investment guidelines for a portfolio
router.post('/guidelines/check', async (req, res) => {
    try {
        const { portfolioId, transactionId, checkType, ruleTypes } = req.body;
        // Validation
        if (!portfolioId) {
            return res.status(400).json({
                success: false,
                error: 'portfolioId is required'
            });
        }
        if (checkType && !['PRE_TRADE', 'POST_TRADE', 'ONGOING'].includes(checkType)) {
            return res.status(400).json({
                success: false,
                error: 'checkType must be PRE_TRADE, POST_TRADE, or ONGOING'
            });
        }
        if (ruleTypes && !Array.isArray(ruleTypes)) {
            return res.status(400).json({
                success: false,
                error: 'ruleTypes must be an array'
            });
        }
        const request = {
            portfolioId,
            transactionId,
            checkType: checkType || 'ONGOING',
            ruleTypes
        };
        const result = await complianceService.checkInvestmentGuidelines(request, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Investment guideline check completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error checking investment guidelines:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check investment guidelines',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get investment guidelines for a portfolio
router.get('/guidelines/portfolio/:portfolioId', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const guidelines = await prisma.investmentGuideline.findMany({
            where: {
                portfolioId,
                tenantId: req.user.tenantId,
                isActive: true
            },
            include: {
                sectorLimits: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                guidelines,
                count: guidelines.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching investment guidelines:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investment guidelines',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create or update investment guidelines
router.post('/guidelines', async (req, res) => {
    try {
        const { portfolioId, clientId, guidelineName, description, category, minEquityAllocation, maxEquityAllocation, minFixedIncomeAllocation, maxFixedIncomeAllocation, minCashAllocation, maxCashAllocation, minAlternativeAllocation, maxAlternativeAllocation, sectorLimits, maxSecurityConcentration, maxIssuerConcentration, minCreditRating, allowedSecurityTypes, maxPortfolioVolatility, maxDrawdown, maxBeta, minLiquidity, esgMinScore, excludeSectors, requireESGScreening, effectiveDate, expirationDate } = req.body;
        // Validation
        if (!portfolioId || !guidelineName || !maxSecurityConcentration || !maxIssuerConcentration) {
            return res.status(400).json({
                success: false,
                error: 'portfolioId, guidelineName, maxSecurityConcentration, and maxIssuerConcentration are required'
            });
        }
        if (!Array.isArray(allowedSecurityTypes) || allowedSecurityTypes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'allowedSecurityTypes must be a non-empty array'
            });
        }
        const guideline = await prisma.investmentGuideline.create({
            data: {
                tenantId: req.user.tenantId,
                portfolioId,
                clientId,
                guidelineName,
                description,
                category,
                minEquityAllocation,
                maxEquityAllocation,
                minFixedIncomeAllocation,
                maxFixedIncomeAllocation,
                minCashAllocation,
                maxCashAllocation,
                minAlternativeAllocation,
                maxAlternativeAllocation,
                sectorLimits,
                maxSecurityConcentration,
                maxIssuerConcentration,
                minCreditRating,
                allowedSecurityTypes,
                maxPortfolioVolatility,
                maxDrawdown,
                maxBeta,
                minLiquidity,
                esgMinScore,
                excludeSectors,
                requireESGScreening,
                isActive: true,
                effectiveDate: new Date(effectiveDate),
                expirationDate: expirationDate ? new Date(expirationDate) : undefined
            }
        });
        res.status(201).json({
            success: true,
            data: guideline,
            message: 'Investment guideline created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating investment guideline:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create investment guideline',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Concentration Limit Monitoring Routes
// Monitor concentration limits for a portfolio
router.post('/concentration/monitor/:portfolioId', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const results = await complianceService.monitorConcentrationLimits(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                results,
                violations: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.BREACH),
                warnings: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.WARNING)
            },
            message: 'Concentration limit monitoring completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error monitoring concentration limits:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to monitor concentration limits',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Restricted List Screening Routes
// Screen instruments against restricted lists
router.post('/restricted-list/screen', async (req, res) => {
    try {
        const { portfolioId, instrumentIds } = req.body;
        // Validation
        if (!portfolioId || !Array.isArray(instrumentIds) || instrumentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'portfolioId and non-empty instrumentIds array are required'
            });
        }
        const results = await complianceService.screenRestrictedList(portfolioId, instrumentIds, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                instrumentIds,
                results,
                violations: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.BREACH),
                warnings: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.WARNING)
            },
            message: 'Restricted list screening completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error screening restricted list:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to screen restricted list',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get restricted lists
router.get('/restricted-lists', async (req, res) => {
    try {
        const { listType, isActive } = req.query;
        const whereClause = {
            tenantId: req.user.tenantId
        };
        if (listType) {
            whereClause.listType = listType;
        }
        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }
        const restrictedLists = await prisma.restrictedList.findMany({
            where: whereClause,
            include: {
                securities: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({
            success: true,
            data: {
                restrictedLists,
                count: restrictedLists.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching restricted lists:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch restricted lists',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create restricted list
router.post('/restricted-lists', async (req, res) => {
    try {
        const { listName, listType, description, securities, applicablePortfolios, applicableClients, violationAction, allowExistingPositions, blockNewPositions, effectiveDate, expirationDate } = req.body;
        // Validation
        if (!listName || !listType || !Array.isArray(securities)) {
            return res.status(400).json({
                success: false,
                error: 'listName, listType, and securities array are required'
            });
        }
        if (!['PROHIBITED', 'WATCH', 'RESTRICTED', 'APPROVED_ONLY'].includes(listType)) {
            return res.status(400).json({
                success: false,
                error: 'listType must be PROHIBITED, WATCH, RESTRICTED, or APPROVED_ONLY'
            });
        }
        const restrictedList = await prisma.restrictedList.create({
            data: {
                tenantId: req.user.tenantId,
                listName,
                listType,
                description,
                securities,
                applicablePortfolios,
                applicableClients,
                violationAction: violationAction || ComplianceMonitoring_1.ActionType.ALERT_ONLY,
                allowExistingPositions: allowExistingPositions !== false,
                blockNewPositions: blockNewPositions !== false,
                isActive: true,
                effectiveDate: new Date(effectiveDate),
                expirationDate: expirationDate ? new Date(expirationDate) : undefined,
                createdBy: req.user.userId,
                updatedBy: req.user.userId
            }
        });
        res.status(201).json({
            success: true,
            data: restrictedList,
            message: 'Restricted list created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating restricted list:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create restricted list',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Suitability Verification Routes
// Verify suitability for a client and portfolio
router.post('/suitability/verify', async (req, res) => {
    try {
        const { clientId, portfolioId } = req.body;
        // Validation
        if (!clientId || !portfolioId) {
            return res.status(400).json({
                success: false,
                error: 'clientId and portfolioId are required'
            });
        }
        const suitabilityCheck = await complianceService.verifySuitability(clientId, portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: suitabilityCheck,
            message: 'Suitability verification completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error verifying suitability:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify suitability',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get suitability profile for a client
router.get('/suitability/profile/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const profile = await prisma.suitabilityProfile.findFirst({
            where: {
                clientId,
                tenantId: req.user.tenantId,
                isActive: true
            }
        });
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Suitability profile not found'
            });
        }
        res.status(200).json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching suitability profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch suitability profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Breach Detection and Management Routes
// Detect breaches across portfolios
router.post('/breaches/detect', async (req, res) => {
    try {
        const { portfolioIds } = req.body;
        if (portfolioIds && !Array.isArray(portfolioIds)) {
            return res.status(400).json({
                success: false,
                error: 'portfolioIds must be an array if provided'
            });
        }
        const breaches = await complianceService.detectBreaches(req.user.tenantId, portfolioIds);
        res.status(200).json({
            success: true,
            data: {
                breaches,
                summary: {
                    total: breaches.length,
                    critical: breaches.filter(b => b.severity === ComplianceMonitoring_1.BreachSeverity.CRITICAL).length,
                    high: breaches.filter(b => b.severity === ComplianceMonitoring_1.BreachSeverity.HIGH).length,
                    medium: breaches.filter(b => b.severity === ComplianceMonitoring_1.BreachSeverity.MEDIUM).length,
                    low: breaches.filter(b => b.severity === ComplianceMonitoring_1.BreachSeverity.LOW).length
                }
            },
            message: 'Breach detection completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error detecting breaches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect breaches',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Search breaches
router.get('/breaches/search', async (req, res) => {
    try {
        const { portfolioIds, ruleTypes, severities, statuses, startDate, endDate, limit, offset, sortBy, sortOrder } = req.query;
        const searchRequest = {
            tenantId: req.user.tenantId,
            portfolioIds: portfolioIds ? portfolioIds.split(',') : undefined,
            ruleTypes: ruleTypes ? ruleTypes.split(',') : undefined,
            severities: severities ? severities.split(',') : undefined,
            statuses: statuses ? statuses.split(',') : undefined,
            dateRange: startDate && endDate ? {
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            } : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder === 'DESC' ? 'DESC' : 'ASC'
        };
        const result = await complianceService.searchBreaches(searchRequest, req.user.tenantId);
        res.status(200).json({
            success: true,
            data: result,
            searchCriteria: searchRequest
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching breaches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search breaches',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get breach details
router.get('/breaches/:breachId', async (req, res) => {
    try {
        const { breachId } = req.params;
        const breach = await prisma.complianceBreach.findFirst({
            where: {
                id: breachId,
                tenantId: req.user.tenantId
            },
            include: {
                workflow: true
            }
        });
        if (!breach) {
            return res.status(404).json({
                success: false,
                error: 'Breach not found'
            });
        }
        res.status(200).json({
            success: true,
            data: breach
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching breach details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch breach details',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Acknowledge breach
router.post('/breaches/:breachId/acknowledge', async (req, res) => {
    try {
        const { breachId } = req.params;
        const { notes } = req.body;
        const breach = await prisma.complianceBreach.update({
            where: {
                id: breachId,
                tenantId: req.user.tenantId
            },
            data: {
                acknowledgedAt: new Date(),
                acknowledgedBy: req.user.userId,
                status: ComplianceMonitoring_1.ComplianceStatus.PENDING_REVIEW,
                resolutionNotes: notes
            }
        });
        res.status(200).json({
            success: true,
            data: breach,
            message: 'Breach acknowledged successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error acknowledging breach:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge breach',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Resolve breach
router.post('/breaches/:breachId/resolve', async (req, res) => {
    try {
        const { breachId } = req.params;
        const { resolutionNotes } = req.body;
        const breach = await prisma.complianceBreach.update({
            where: {
                id: breachId,
                tenantId: req.user.tenantId
            },
            data: {
                resolvedAt: new Date(),
                resolvedBy: req.user.userId,
                status: ComplianceMonitoring_1.ComplianceStatus.COMPLIANT,
                resolutionNotes
            }
        });
        res.status(200).json({
            success: true,
            data: breach,
            message: 'Breach resolved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error resolving breach:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resolve breach',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Compliance Dashboard Routes
// Get compliance dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { portfolioIds } = req.query;
        // Get overview metrics
        const totalRules = await prisma.complianceRule.count({
            where: { tenantId: req.user.tenantId }
        });
        const activeRules = await prisma.complianceRule.count({
            where: {
                tenantId: req.user.tenantId,
                isActive: true
            }
        });
        const totalBreaches = await prisma.complianceBreach.count({
            where: { tenantId: req.user.tenantId }
        });
        const newBreaches = await prisma.complianceBreach.count({
            where: {
                tenantId: req.user.tenantId,
                detectedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });
        const pendingBreaches = await prisma.complianceBreach.count({
            where: {
                tenantId: req.user.tenantId,
                status: {
                    in: [ComplianceMonitoring_1.ComplianceStatus.BREACH, ComplianceMonitoring_1.ComplianceStatus.PENDING_REVIEW]
                }
            }
        });
        // Get recent breaches
        const recentBreaches = await prisma.complianceBreach.findMany({
            where: {
                tenantId: req.user.tenantId,
                detectedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            orderBy: { detectedAt: 'desc' },
            take: 10
        });
        const dashboard = {
            summary: {
                totalRules,
                activeRules,
                totalBreaches,
                newBreaches,
                pendingBreaches,
                complianceRate: totalBreaches > 0 ? ((totalBreaches - pendingBreaches) / totalBreaches * 100) : 100
            },
            recentActivity: recentBreaches,
            performance: {
                breachesToday: recentBreaches.filter(breach => breach.detectedAt >= new Date(new Date().setHours(0, 0, 0, 0))).length,
                breachesThisWeek: recentBreaches.length
            }
        };
        res.status(200).json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching compliance dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch compliance dashboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Workflow Management Routes
// Create workflow for breach resolution
router.post('/workflows/breach/:breachId', async (req, res) => {
    try {
        const { breachId } = req.params;
        // Get breach details
        const breach = await prisma.complianceBreach.findFirst({
            where: {
                id: breachId,
                tenantId: req.user.tenantId
            }
        });
        if (!breach) {
            return res.status(404).json({
                success: false,
                error: 'Breach not found'
            });
        }
        const workflow = await workflowService.createBreachResolutionWorkflow(breach, req.user.tenantId, req.user.userId);
        res.status(201).json({
            success: true,
            data: workflow,
            message: 'Breach resolution workflow created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating breach resolution workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create workflow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get workflow details
router.get('/workflows/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const workflow = await workflowService.getWorkflow(workflowId, req.user.tenantId);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }
        res.status(200).json({
            success: true,
            data: workflow
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get workflows by assignee
router.get('/workflows/assignee/:assigneeId', async (req, res) => {
    try {
        const { assigneeId } = req.params;
        const { status, limit, offset } = req.query;
        const result = await workflowService.getWorkflowsByAssignee(assigneeId, req.user.tenantId, status, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching workflows by assignee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflows',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update workflow step
router.post('/workflows/:workflowId/steps/:stepNumber', async (req, res) => {
    try {
        const { workflowId, stepNumber } = req.params;
        const { status, notes, attachments } = req.body;
        // Validation
        if (!status || !['COMPLETED', 'SKIPPED'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'status must be COMPLETED or SKIPPED'
            });
        }
        const workflow = await workflowService.updateWorkflowStep(workflowId, parseInt(stepNumber), status, notes || '', req.user.userId, req.user.tenantId, attachments);
        res.status(200).json({
            success: true,
            data: workflow,
            message: 'Workflow step updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating workflow step:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update workflow step',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Escalate workflow
router.post('/workflows/:workflowId/escalate', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { escalateTo, reason } = req.body;
        // Validation
        if (!escalateTo || !reason) {
            return res.status(400).json({
                success: false,
                error: 'escalateTo and reason are required'
            });
        }
        const workflow = await workflowService.escalateWorkflow(workflowId, escalateTo, reason, req.user.userId, req.user.tenantId);
        res.status(200).json({
            success: true,
            data: workflow,
            message: 'Workflow escalated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error escalating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to escalate workflow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Cancel workflow
router.post('/workflows/:workflowId/cancel', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { reason } = req.body;
        // Validation
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'reason is required'
            });
        }
        const workflow = await workflowService.cancelWorkflow(workflowId, reason, req.user.userId, req.user.tenantId);
        res.status(200).json({
            success: true,
            data: workflow,
            message: 'Workflow cancelled successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error cancelling workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel workflow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get overdue workflows
router.get('/workflows/overdue', async (req, res) => {
    try {
        const workflows = await workflowService.getOverdueWorkflows(req.user.tenantId);
        res.status(200).json({
            success: true,
            data: {
                workflows,
                count: workflows.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching overdue workflows:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch overdue workflows',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reference Data Routes
// Get compliance reference data
router.get('/reference-data', async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                ruleTypes: Object.values(ComplianceMonitoring_1.ComplianceRuleType),
                complianceStatuses: Object.values(ComplianceMonitoring_1.ComplianceStatus),
                breachSeverities: Object.values(ComplianceMonitoring_1.BreachSeverity),
                monitoringFrequencies: Object.values(ComplianceMonitoring_1.MonitoringFrequency),
                actionTypes: Object.values(ComplianceMonitoring_1.ActionType),
                workflowStatuses: Object.values(ComplianceMonitoring_1.WorkflowStatus),
                restrictedListTypes: ['PROHIBITED', 'WATCH', 'RESTRICTED', 'APPROVED_ONLY'],
                riskTolerances: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'SPECULATIVE'],
                riskCapacities: ['LOW', 'MEDIUM', 'HIGH'],
                liquidityNeeds: ['LOW', 'MEDIUM', 'HIGH'],
                investmentExperiences: ['NONE', 'LIMITED', 'GOOD', 'EXTENSIVE']
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching compliance reference data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reference data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Regulatory Rule Engine Routes
// Evaluate regulatory rules for a portfolio
router.post('/regulatory-rules/evaluate/:portfolioId', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const { context, ruleIds } = req.body;
        // Validation
        if (!context || !context.type || !context.data) {
            return res.status(400).json({
                success: false,
                error: 'context with type and data is required'
            });
        }
        const results = await ruleEngine.evaluateRules(portfolioId, req.user.tenantId, context, ruleIds);
        const summary = {
            total: results.length,
            compliant: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.COMPLIANT).length,
            warnings: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.WARNING).length,
            breaches: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.BREACH).length,
            averageEvaluationTime: results.reduce((sum, r) => sum + r.evaluationTimeMs, 0) / results.length
        };
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                results,
                summary
            },
            message: 'Regulatory rule evaluation completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error evaluating regulatory rules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to evaluate regulatory rules',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create new regulatory rule
router.post('/regulatory-rules', async (req, res) => {
    try {
        const { regulationCode, regulationName, jurisdiction, regulatoryBody, ruleExpression, ruleLogic, parameters, effectiveDate, version } = req.body;
        // Validation
        if (!regulationCode || !regulationName || !jurisdiction || !ruleExpression) {
            return res.status(400).json({
                success: false,
                error: 'regulationCode, regulationName, jurisdiction, and ruleExpression are required'
            });
        }
        const rule = await ruleEngine.createRule({
            regulationCode,
            regulationName,
            jurisdiction,
            regulatoryBody: regulatoryBody || jurisdiction,
            ruleExpression,
            ruleLogic: ruleLogic || {},
            parameters: parameters || {},
            effectiveDate: new Date(effectiveDate || Date.now()),
            lastUpdated: new Date(),
            version: version || '1.0',
            isActive: true
        }, req.user.tenantId);
        res.status(201).json({
            success: true,
            data: rule,
            message: 'Regulatory rule created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating regulatory rule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create regulatory rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get all regulatory rules
router.get('/regulatory-rules', async (req, res) => {
    try {
        const { jurisdiction, isActive, regulationCode } = req.query;
        const filters = {};
        if (jurisdiction)
            filters.jurisdiction = jurisdiction;
        if (isActive !== undefined)
            filters.isActive = isActive === 'true';
        if (regulationCode)
            filters.regulationCode = regulationCode;
        const rules = await ruleEngine.getRules(req.user.tenantId, filters);
        res.status(200).json({
            success: true,
            data: {
                rules,
                count: rules.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching regulatory rules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch regulatory rules',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get specific regulatory rule
router.get('/regulatory-rules/:ruleId', async (req, res) => {
    try {
        const { ruleId } = req.params;
        const rule = await ruleEngine.getRule(ruleId, req.user.tenantId);
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'Regulatory rule not found'
            });
        }
        res.status(200).json({
            success: true,
            data: rule
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching regulatory rule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch regulatory rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update regulatory rule
router.put('/regulatory-rules/:ruleId', async (req, res) => {
    try {
        const { ruleId } = req.params;
        const updates = req.body;
        const rule = await ruleEngine.updateRule(ruleId, updates, req.user.tenantId);
        res.status(200).json({
            success: true,
            data: rule,
            message: 'Regulatory rule updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating regulatory rule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update regulatory rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Deactivate regulatory rule
router.delete('/regulatory-rules/:ruleId', async (req, res) => {
    try {
        const { ruleId } = req.params;
        await ruleEngine.deactivateRule(ruleId, req.user.tenantId);
        res.status(200).json({
            success: true,
            message: 'Regulatory rule deactivated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deactivating regulatory rule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate regulatory rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Health check for compliance service
router.get('/health', async (req, res) => {
    try {
        const rulesCount = await prisma.complianceRule.count();
        const breachesCount = await prisma.complianceBreach.count();
        const guidelinesCount = await prisma.investmentGuideline.count();
        const regulatoryRulesCount = await prisma.regulatoryRule.count();
        res.status(200).json({
            success: true,
            status: 'healthy',
            data: {
                totalRules: rulesCount,
                totalBreaches: breachesCount,
                totalGuidelines: guidelinesCount,
                totalRegulatoryRules: regulatoryRulesCount,
                timestamp: new Date().toISOString(),
                service: 'compliance-monitoring',
                version: '1.0.0'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Compliance monitoring health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Service unavailable',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const ReportingEngineService_1 = require("../services/reporting/ReportingEngineService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const ReportingEngine_1 = require("../models/reporting/ReportingEngine");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const reportingService = new ReportingEngineService_1.ReportingEngineService();
// Validation schemas
const createTemplateSchema = [
    (0, express_validator_1.body)('name').isLength({ min: 1, max: 255 }).withMessage('Template name is required and must be less than 255 characters'),
    (0, express_validator_1.body)('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('reportType').isIn(Object.values(ReportingEngine_1.ReportType)).withMessage('Invalid report type'),
    (0, express_validator_1.body)('category').optional().isString().withMessage('Category must be a string'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('Tags must be an array'),
    (0, express_validator_1.body)('dataSource').isObject().withMessage('Data source configuration is required'),
    (0, express_validator_1.body)('dataSource.baseEntity').isString().withMessage('Base entity is required'),
    (0, express_validator_1.body)('columns').isArray({ min: 1 }).withMessage('At least one column is required'),
    (0, express_validator_1.body)('sections').isArray({ min: 1 }).withMessage('At least one section is required'),
    (0, express_validator_1.body)('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
    (0, express_validator_1.body)('allowedRoles').optional().isArray().withMessage('allowedRoles must be an array')
];
const updateTemplateSchema = [
    (0, express_validator_1.param)('templateId').isUUID().withMessage('Valid template ID required'),
    (0, express_validator_1.body)('name').optional().isLength({ min: 1, max: 255 }).withMessage('Template name must be less than 255 characters'),
    (0, express_validator_1.body)('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('Tags must be an array'),
    (0, express_validator_1.body)('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
    (0, express_validator_1.body)('allowedRoles').optional().isArray().withMessage('allowedRoles must be an array')
];
const generateReportSchema = [
    (0, express_validator_1.body)('templateId').isUUID().withMessage('Valid template ID required'),
    (0, express_validator_1.body)('name').optional().isString().withMessage('Name must be a string'),
    (0, express_validator_1.body)('format').isIn(Object.values(ReportingEngine_1.ReportFormat)).withMessage('Invalid report format'),
    (0, express_validator_1.body)('deliveryMethod').isIn(['DOWNLOAD', 'EMAIL', 'SAVE', 'PRINT']).withMessage('Invalid delivery method'),
    (0, express_validator_1.body)('emailRecipients').optional().isArray().withMessage('Email recipients must be an array'),
    (0, express_validator_1.body)('clientIds').optional().isArray().withMessage('Client IDs must be an array'),
    (0, express_validator_1.body)('portfolioIds').optional().isArray().withMessage('Portfolio IDs must be an array'),
    (0, express_validator_1.body)('accountIds').optional().isArray().withMessage('Account IDs must be an array'),
    (0, express_validator_1.body)('dateRange').optional().isObject().withMessage('Date range must be an object'),
    (0, express_validator_1.body)('dateRange.startDate').optional().isISO8601().withMessage('Invalid start date'),
    (0, express_validator_1.body)('dateRange.endDate').optional().isISO8601().withMessage('Invalid end date'),
    (0, express_validator_1.body)('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    (0, express_validator_1.body)('aggregationLevel').optional().isIn(Object.values(ReportingEngine_1.AggregationLevel)).withMessage('Invalid aggregation level')
];
const scheduleReportSchema = [
    (0, express_validator_1.body)('templateId').isUUID().withMessage('Valid template ID required'),
    (0, express_validator_1.body)('name').isLength({ min: 1, max: 255 }).withMessage('Schedule name is required'),
    (0, express_validator_1.body)('frequency').isIn(Object.values(ReportingEngine_1.ReportFrequency)).withMessage('Invalid frequency'),
    (0, express_validator_1.body)('schedule').isObject().withMessage('Schedule configuration is required'),
    (0, express_validator_1.body)('schedule.hour').isInt({ min: 0, max: 23 }).withMessage('Hour must be between 0 and 23'),
    (0, express_validator_1.body)('schedule.minute').isInt({ min: 0, max: 59 }).withMessage('Minute must be between 0 and 59'),
    (0, express_validator_1.body)('schedule.timezone').isString().withMessage('Timezone is required'),
    (0, express_validator_1.body)('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
    (0, express_validator_1.body)('format').isIn(Object.values(ReportingEngine_1.ReportFormat)).withMessage('Invalid report format')
];
const customReportSchema = [
    (0, express_validator_1.body)('dataSource').isString().withMessage('Data source is required'),
    (0, express_validator_1.body)('selectedColumns').isArray({ min: 1 }).withMessage('At least one column must be selected'),
    (0, express_validator_1.body)('filters').optional().isArray().withMessage('Filters must be an array'),
    (0, express_validator_1.body)('sorting').optional().isArray().withMessage('Sorting must be an array'),
    (0, express_validator_1.body)('grouping').optional().isArray().withMessage('Grouping must be an array')
];
// Template Management Routes
// Create report template
router.post('/templates', auth_1.authMiddleware, createTemplateSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Creating report template', {
            tenantId,
            templateName: req.body.name,
            reportType: req.body.reportType,
            userId
        });
        const template = await reportingService.createReportTemplate(tenantId, req.body, userId);
        res.status(201).json({
            success: true,
            data: { template },
            message: 'Report template created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating report template:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'TEMPLATE_CREATION_FAILED'
        });
    }
});
// Get report templates
router.get('/templates', auth_1.authMiddleware, [
    (0, express_validator_1.query)('reportType').optional().isIn(Object.values(ReportingEngine_1.ReportType)).withMessage('Invalid report type'),
    (0, express_validator_1.query)('category').optional().isString().withMessage('Category must be a string'),
    (0, express_validator_1.query)('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const options = {
            reportType: req.query.reportType,
            category: req.query.category,
            isPublic: req.query.isPublic === 'true',
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        };
        logger_1.logger.info('Retrieving report templates', { tenantId, options });
        const result = await reportingService.getReportTemplates(tenantId, options);
        res.json({
            success: true,
            data: result,
            message: 'Report templates retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving report templates:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'TEMPLATES_RETRIEVAL_FAILED'
        });
    }
});
// Get report template by ID
router.get('/templates/:templateId', auth_1.authMiddleware, [(0, express_validator_1.param)('templateId').isUUID().withMessage('Valid template ID required')], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { templateId } = req.params;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Retrieving report template', { tenantId, templateId });
        const template = await reportingService.getReportTemplate(tenantId, templateId);
        if (!template) {
            return res.status(404).json({
                error: 'Report template not found',
                code: 'TEMPLATE_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: { template },
            message: 'Report template retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving report template:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'TEMPLATE_RETRIEVAL_FAILED'
        });
    }
});
// Update report template
router.put('/templates/:templateId', auth_1.authMiddleware, updateTemplateSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { templateId } = req.params;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Updating report template', { tenantId, templateId, userId });
        const template = await reportingService.updateReportTemplate(tenantId, templateId, req.body, userId);
        res.json({
            success: true,
            data: { template },
            message: 'Report template updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating report template:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: statusCode === 404 ? 'TEMPLATE_NOT_FOUND' : 'TEMPLATE_UPDATE_FAILED'
        });
    }
});
// Delete report template
router.delete('/templates/:templateId', auth_1.authMiddleware, [(0, express_validator_1.param)('templateId').isUUID().withMessage('Valid template ID required')], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { templateId } = req.params;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Deleting report template', { tenantId, templateId, userId });
        await reportingService.deleteReportTemplate(tenantId, templateId, userId);
        res.json({
            success: true,
            message: 'Report template deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting report template:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: statusCode === 404 ? 'TEMPLATE_NOT_FOUND' : 'TEMPLATE_DELETE_FAILED'
        });
    }
});
// Duplicate report template
router.post('/templates/:templateId/duplicate', auth_1.authMiddleware, [
    (0, express_validator_1.param)('templateId').isUUID().withMessage('Valid template ID required'),
    (0, express_validator_1.body)('name').isLength({ min: 1, max: 255 }).withMessage('New template name is required')
], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { templateId } = req.params;
        const { name } = req.body;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Duplicating report template', { tenantId, templateId, newName: name, userId });
        const newTemplate = await reportingService.duplicateReportTemplate(tenantId, templateId, name, userId);
        res.status(201).json({
            success: true,
            data: { template: newTemplate },
            message: 'Report template duplicated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error duplicating report template:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'TEMPLATE_DUPLICATE_FAILED'
        });
    }
});
// Report Generation Routes
// Generate report
router.post('/generate', auth_1.authMiddleware, generateReportSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const request = {
            ...req.body,
            requestedBy: userId,
            requestedAt: new Date(),
            dateRange: req.body.dateRange ? {
                startDate: new Date(req.body.dateRange.startDate),
                endDate: new Date(req.body.dateRange.endDate)
            } : undefined
        };
        logger_1.logger.info('Generating report', {
            tenantId,
            templateId: request.templateId,
            format: request.format,
            userId
        });
        const job = await reportingService.generateReport(tenantId, request, userId);
        res.status(201).json({
            success: true,
            data: { job },
            message: 'Report generation started'
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating report:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'REPORT_GENERATION_FAILED'
        });
    }
});
// Get report jobs
router.get('/jobs', auth_1.authMiddleware, [
    (0, express_validator_1.query)('templateId').optional().isUUID().withMessage('Invalid template ID'),
    (0, express_validator_1.query)('status').optional().isIn(Object.values(ReportingEngine_1.ReportStatus)).withMessage('Invalid status'),
    (0, express_validator_1.query)('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.query)('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const options = {
            templateId: req.query.templateId,
            status: req.query.status,
            dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
            dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        };
        logger_1.logger.info('Retrieving report jobs', { tenantId, options });
        const result = await reportingService.getReportJobs(tenantId, options);
        res.json({
            success: true,
            data: result,
            message: 'Report jobs retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving report jobs:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'JOBS_RETRIEVAL_FAILED'
        });
    }
});
// Get report job by ID
router.get('/jobs/:jobId', auth_1.authMiddleware, [(0, express_validator_1.param)('jobId').isUUID().withMessage('Valid job ID required')], validation_1.validateRequest, async (req, res) => {
    try {
        const { jobId } = req.params;
        logger_1.logger.info('Retrieving report job', { jobId });
        const job = await reportingService.getReportJob(jobId);
        if (!job) {
            return res.status(404).json({
                error: 'Report job not found',
                code: 'JOB_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: { job },
            message: 'Report job retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving report job:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'JOB_RETRIEVAL_FAILED'
        });
    }
});
// Cancel report job
router.post('/jobs/:jobId/cancel', auth_1.authMiddleware, [(0, express_validator_1.param)('jobId').isUUID().withMessage('Valid job ID required')], validation_1.validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { jobId } = req.params;
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Cancelling report job', { jobId, userId });
        await reportingService.cancelReportJob(jobId, userId);
        res.json({
            success: true,
            message: 'Report job cancelled successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error cancelling report job:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'JOB_CANCEL_FAILED'
        });
    }
});
// Pre-built Report Generation Routes
// Generate performance report
router.post('/performance', auth_1.authMiddleware, [
    (0, express_validator_1.body)('portfolioIds').isArray({ min: 1 }).withMessage('At least one portfolio ID required'),
    (0, express_validator_1.body)('dateRange').isObject().withMessage('Date range is required'),
    (0, express_validator_1.body)('dateRange.startDate').isISO8601().withMessage('Valid start date required'),
    (0, express_validator_1.body)('dateRange.endDate').isISO8601().withMessage('Valid end date required'),
    (0, express_validator_1.body)('format').optional().isIn(Object.values(ReportingEngine_1.ReportFormat)).withMessage('Invalid format')
], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const { portfolioIds, dateRange, format = ReportingEngine_1.ReportFormat.PDF } = req.body;
        logger_1.logger.info('Generating performance report', {
            tenantId,
            portfolioIds,
            dateRange,
            format,
            userId
        });
        const job = await reportingService.generatePerformanceReport(tenantId, portfolioIds, {
            startDate: new Date(dateRange.startDate),
            endDate: new Date(dateRange.endDate)
        }, format, userId);
        res.status(201).json({
            success: true,
            data: { job },
            message: 'Performance report generation started'
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating performance report:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'PERFORMANCE_REPORT_FAILED'
        });
    }
});
// Generate holdings report
router.post('/holdings', auth_1.authMiddleware, [
    (0, express_validator_1.body)('portfolioIds').isArray({ min: 1 }).withMessage('At least one portfolio ID required'),
    (0, express_validator_1.body)('asOfDate').isISO8601().withMessage('Valid as-of date required'),
    (0, express_validator_1.body)('format').optional().isIn(Object.values(ReportingEngine_1.ReportFormat)).withMessage('Invalid format')
], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const { portfolioIds, asOfDate, format = ReportingEngine_1.ReportFormat.EXCEL } = req.body;
        logger_1.logger.info('Generating holdings report', {
            tenantId,
            portfolioIds,
            asOfDate,
            format,
            userId
        });
        const job = await reportingService.generateHoldingsReport(tenantId, portfolioIds, new Date(asOfDate), format, userId);
        res.status(201).json({
            success: true,
            data: { job },
            message: 'Holdings report generation started'
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating holdings report:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'HOLDINGS_REPORT_FAILED'
        });
    }
});
// Custom Report Builder
router.post('/custom/build', auth_1.authMiddleware, customReportSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const builder = req.body;
        logger_1.logger.info('Building custom report', { tenantId, builder, userId });
        const result = await reportingService.buildCustomReport(tenantId, builder, userId);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Custom report built successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error building custom report:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'CUSTOM_REPORT_BUILD_FAILED'
        });
    }
});
// Dashboard and Analytics
router.get('/dashboard', auth_1.authMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Retrieving dashboard metrics', { tenantId, userId });
        const metrics = await reportingService.getDashboardMetrics(tenantId, userId);
        res.json({
            success: true,
            data: { metrics },
            message: 'Dashboard metrics retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving dashboard metrics:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'DASHBOARD_RETRIEVAL_FAILED'
        });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeServices = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Service instances (would be injected in real application)
let profilingService;
let detectionService;
let rootCauseService;
let correlationService;
let optimizationService;
let testingService;
let reportingService;
// Initialize services
const initializeServices = (services) => {
    profilingService = services.profiling;
    detectionService = services.detection;
    rootCauseService = services.rootCause;
    correlationService = services.correlation;
    optimizationService = services.optimization;
    testingService = services.testing;
    reportingService = services.reporting;
};
exports.initializeServices = initializeServices;
// Middleware for handling validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: errors.array()
        });
    }
    next();
};
// Performance Profiling Routes
// Start performance profiling
router.post('/profiling/start', [
    (0, express_validator_1.body)('target_id').notEmpty().withMessage('Target ID is required'),
    (0, express_validator_1.body)('target_type').isIn(['application', 'system', 'database', 'network', 'custom']).withMessage('Invalid target type'),
    (0, express_validator_1.body)('configuration').optional().isObject()
], handleValidationErrors, async (req, res) => {
    try {
        const { target_id, target_type, configuration } = req.body;
        const profileId = await profilingService.startProfiling(target_id, target_type, configuration);
        res.json({
            success: true,
            data: { profile_id: profileId }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Stop performance profiling
router.post('/profiling/:profileId/stop', [(0, express_validator_1.param)('profileId').notEmpty().withMessage('Profile ID is required')], handleValidationErrors, async (req, res) => {
    try {
        const { profileId } = req.params;
        const profile = await profilingService.stopProfiling(profileId);
        res.json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get profiling status
router.get('/profiling/:profileId/status', [(0, express_validator_1.param)('profileId').notEmpty().withMessage('Profile ID is required')], handleValidationErrors, async (req, res) => {
    try {
        const { profileId } = req.params;
        const status = await profilingService.getProfilingStatus(profileId);
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get profile data
router.get('/profiling/:profileId', [(0, express_validator_1.param)('profileId').notEmpty().withMessage('Profile ID is required')], handleValidationErrors, async (req, res) => {
    try {
        const { profileId } = req.params;
        const profile = await profilingService.getProfile(profileId);
        res.json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// List active profiles
router.get('/profiling/active', async (req, res) => {
    try {
        const profiles = await profilingService.getActiveProfiles();
        res.json({
            success: true,
            data: profiles
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Bottleneck Detection Routes
// Analyze profile for bottlenecks
router.post('/bottlenecks/analyze', [(0, express_validator_1.body)('profile_id').notEmpty().withMessage('Profile ID is required')], handleValidationErrors, async (req, res) => {
    try {
        const { profile_id } = req.body;
        const profile = await profilingService.getProfile(profile_id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            });
        }
        const bottlenecks = await detectionService.analyzeProfile(profile);
        res.json({
            success: true,
            data: bottlenecks
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get bottleneck by ID
router.get('/bottlenecks/:bottleneckId', [(0, express_validator_1.param)('bottleneckId').notEmpty().withMessage('Bottleneck ID is required')], handleValidationErrors, async (req, res) => {
    try {
        const { bottleneckId } = req.params;
        const bottleneck = await detectionService.getBottleneck(bottleneckId);
        res.json({
            success: true,
            data: bottleneck
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Root Cause Analysis Routes
// Analyze bottleneck root causes
router.post('/root-cause/analyze', [
    (0, express_validator_1.body)('bottleneck_id').notEmpty().withMessage('Bottleneck ID is required'),
    (0, express_validator_1.body)('profile_id').notEmpty().withMessage('Profile ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { bottleneck_id, profile_id } = req.body;
        const bottleneck = await detectionService.getBottleneck(bottleneck_id);
        const profile = await profilingService.getProfile(profile_id);
        if (!bottleneck || !profile) {
            return res.status(404).json({
                success: false,
                error: 'Bottleneck or profile not found'
            });
        }
        const rootCauses = await rootCauseService.analyzeBottleneck(bottleneck, profile);
        res.json({
            success: true,
            data: rootCauses
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Performance Correlation Routes
// Analyze performance correlations
router.post('/correlations/analyze', [
    (0, express_validator_1.body)('profile_ids').isArray().withMessage('Profile IDs must be an array'),
    (0, express_validator_1.body)('analysis_type').optional().isIn(['pairwise', 'pattern', 'lagged', 'anomaly']).withMessage('Invalid analysis type')
], handleValidationErrors, async (req, res) => {
    try {
        const { profile_ids, analysis_type = 'pairwise' } = req.body;
        const profiles = [];
        for (const profileId of profile_ids) {
            const profile = await profilingService.getProfile(profileId);
            if (profile) {
                profiles.push(profile);
            }
        }
        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No valid profiles found'
            });
        }
        const correlations = await correlationService.analyzeCorrelations(profiles, { analysis_type });
        res.json({
            success: true,
            data: correlations
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Optimization Routes
// Generate optimization recommendations
router.post('/optimization/recommendations', [
    (0, express_validator_1.body)('profile_id').notEmpty().withMessage('Profile ID is required'),
    (0, express_validator_1.body)('bottleneck_ids').optional().isArray(),
    (0, express_validator_1.body)('root_cause_ids').optional().isArray(),
    (0, express_validator_1.body)('correlation_ids').optional().isArray()
], handleValidationErrors, async (req, res) => {
    try {
        const { profile_id, bottleneck_ids = [], root_cause_ids = [], correlation_ids = [] } = req.body;
        const profile = await profilingService.getProfile(profile_id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            });
        }
        const bottlenecks = [];
        for (const bottleneckId of bottleneck_ids) {
            const bottleneck = await detectionService.getBottleneck(bottleneckId);
            if (bottleneck) {
                bottlenecks.push(bottleneck);
            }
        }
        const rootCauses = [];
        for (const rootCauseId of root_cause_ids) {
            const rootCause = await rootCauseService.getRootCause(rootCauseId);
            if (rootCause) {
                rootCauses.push(rootCause);
            }
        }
        const correlations = [];
        for (const correlationId of correlation_ids) {
            const correlation = await correlationService.getCorrelation(correlationId);
            if (correlation) {
                correlations.push(correlation);
            }
        }
        const recommendations = await optimizationService.generateRecommendations(profile, bottlenecks, rootCauses, correlations);
        res.json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Performance Testing Routes
// Create performance test
router.post('/testing/tests', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Test name is required'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('type').isIn(['load', 'stress', 'endurance', 'spike']).withMessage('Invalid test type'),
    (0, express_validator_1.body)('configuration').isObject().withMessage('Test configuration is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { name, description, type, configuration } = req.body;
        const testId = await testingService.createTest(name, description || '', type, configuration);
        res.json({
            success: true,
            data: { test_id: testId }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Execute performance test
router.post('/testing/tests/:testId/execute', [
    (0, express_validator_1.param)('testId').notEmpty().withMessage('Test ID is required'),
    (0, express_validator_1.body)('triggered_by').optional().isString(),
    (0, express_validator_1.body)('trigger_reason').optional().isString()
], handleValidationErrors, async (req, res) => {
    try {
        const { testId } = req.params;
        const { triggered_by = 'api', trigger_reason = 'Manual execution via API' } = req.body;
        const executionId = await testingService.executeTest(testId, triggered_by, trigger_reason);
        res.json({
            success: true,
            data: { execution_id: executionId }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get test execution status
router.get('/testing/executions/:executionId/status', [(0, express_validator_1.param)('executionId').notEmpty().withMessage('Execution ID is required')], handleValidationErrors, async (req, res) => {
    try {
        const { executionId } = req.params;
        const status = await testingService.getExecutionStatus(executionId);
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get test execution results
router.get('/testing/executions/:executionId/results', [(0, express_validator_1.param)('executionId').notEmpty().withMessage('Execution ID is required')], handleValidationErrors, async (req, res) => {
    try {
        const { executionId } = req.params;
        const results = await testingService.getExecutionResults(executionId);
        res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// List tests
router.get('/testing/tests', [
    (0, express_validator_1.query)('enabled').optional().isBoolean(),
    (0, express_validator_1.query)('type').optional().isIn(['load', 'stress', 'endurance', 'spike'])
], async (req, res) => {
    try {
        const { enabled, type } = req.query;
        const filters = {};
        if (enabled !== undefined)
            filters.enabled = enabled === 'true';
        if (type)
            filters.type = type;
        const tests = await testingService.getTests(filters);
        res.json({
            success: true,
            data: tests
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reporting and Dashboard Routes
// Generate dashboard
router.get('/reporting/dashboards/:dashboardId', [
    (0, express_validator_1.param)('dashboardId').notEmpty().withMessage('Dashboard ID is required'),
    (0, express_validator_1.query)('time_range').optional().isString(),
    (0, express_validator_1.query)('filters').optional().isJSON()
], handleValidationErrors, async (req, res) => {
    try {
        const { dashboardId } = req.params;
        const { time_range, filters: filtersJson } = req.query;
        const filters = {};
        if (time_range)
            filters.time_range = time_range;
        if (filtersJson) {
            try {
                Object.assign(filters, JSON.parse(filtersJson));
            }
            catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filters JSON'
                });
            }
        }
        const dashboard = await reportingService.generateDashboard(dashboardId, filters);
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Generate report
router.post('/reporting/reports/generate', [
    (0, express_validator_1.body)('template_id').notEmpty().withMessage('Template ID is required'),
    (0, express_validator_1.body)('parameters').optional().isObject(),
    (0, express_validator_1.body)('format').optional().isIn(['pdf', 'html', 'json', 'csv']).withMessage('Invalid format')
], handleValidationErrors, async (req, res) => {
    try {
        const { template_id, parameters = {}, format = 'pdf' } = req.body;
        const reportData = await reportingService.generateReport(template_id, parameters);
        if (format === 'json') {
            res.json({
                success: true,
                data: reportData
            });
        }
        else {
            const exportedReport = await reportingService.exportReport(reportData, format);
            const contentType = {
                pdf: 'application/pdf',
                html: 'text/html',
                csv: 'text/csv'
            }[format] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="performance-report.${format}"`);
            res.send(exportedReport);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// List available dashboards
router.get('/reporting/dashboards', async (req, res) => {
    try {
        const dashboards = await reportingService.getAvailableDashboards();
        res.json({
            success: true,
            data: dashboards
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// List available report templates
router.get('/reporting/templates', async (req, res) => {
    try {
        const templates = await reportingService.getAvailableTemplates();
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Health and Status Routes
// Get system health
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            services: {
                profiling: await profilingService.getHealthStatus(),
                detection: await detectionService.getHealthStatus(),
                root_cause: await rootCauseService.getHealthStatus(),
                correlation: await correlationService.getHealthStatus(),
                optimization: await optimizationService.getHealthStatus(),
                testing: await testingService.getHealthStatus(),
                reporting: await reportingService.getHealthStatus()
            }
        };
        const allHealthy = Object.values(health.services).every(service => service.status === 'healthy');
        health.status = allHealthy ? 'healthy' : 'degraded';
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get system metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = {
            profiling: {
                active_profiles: await profilingService.getActiveProfileCount(),
                total_profiles: await profilingService.getTotalProfileCount(),
                avg_profile_duration: await profilingService.getAverageProfileDuration()
            },
            detection: {
                total_bottlenecks: await detectionService.getTotalBottleneckCount(),
                critical_bottlenecks: await detectionService.getCriticalBottleneckCount(),
                detection_accuracy: await detectionService.getDetectionAccuracy()
            },
            testing: {
                active_tests: await testingService.getActiveTestCount(),
                total_executions: await testingService.getTotalExecutionCount(),
                success_rate: await testingService.getExecutionSuccessRate()
            },
            reporting: {
                total_reports: await reportingService.getTotalReportCount(),
                dashboard_views: await reportingService.getDashboardViewCount(),
                export_requests: await reportingService.getExportRequestCount()
            }
        };
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

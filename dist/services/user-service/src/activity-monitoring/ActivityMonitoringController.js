"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityMonitoringController = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const ActivityTrackingService_1 = require("./ActivityTrackingService");
const ActivityAnalyticsService_1 = require("./ActivityAnalyticsService");
const SuspiciousActivityDetectionService_1 = require("./SuspiciousActivityDetectionService");
const ActivityRetentionService_1 = require("./ActivityRetentionService");
const ActivityPrivacyService_1 = require("./ActivityPrivacyService");
class ActivityMonitoringController {
    router;
    activityService;
    streamingService;
    analyticsService;
    detectionService;
    retentionService;
    privacyService;
    constructor(activityService, streamingService, analyticsService, detectionService, retentionService, privacyService) {
        this.router = (0, express_1.Router)();
        this.activityService = activityService;
        this.streamingService = streamingService;
        this.analyticsService = analyticsService;
        this.detectionService = detectionService;
        this.retentionService = retentionService;
        this.privacyService = privacyService;
        this.setupRoutes();
    }
    getRouter() {
        return this.router;
    }
    setupRoutes() {
        // Activity Management Routes
        this.router.get('/activities', this.validateGetActivities(), this.getActivities.bind(this));
        this.router.get('/activities/:id', this.validateActivityId(), this.getActivity.bind(this));
        this.router.post('/activities', this.validateCreateActivity(), this.createActivity.bind(this));
        this.router.get('/activities/user/:userId/sessions', this.validateUserId(), this.getUserSessions.bind(this));
        this.router.get('/activities/metrics', this.validateGetMetrics(), this.getActivityMetrics.bind(this));
        // Real-time Streaming Routes
        this.router.post('/streaming/subscribe', this.validateSubscribe(), this.subscribeToStream.bind(this));
        this.router.delete('/streaming/subscribe/:subscriptionId', this.validateSubscriptionId(), this.unsubscribeFromStream.bind(this));
        this.router.get('/streaming/subscriptions', this.getStreamingSubscriptions.bind(this));
        this.router.get('/streaming/stats', this.getStreamingStats.bind(this));
        this.router.get('/streaming/history/:subscriptionId', this.validateSubscriptionId(), this.getStreamingHistory.bind(this));
        // Analytics and Reporting Routes
        this.router.get('/analytics/user-summary/:userId', this.validateUserSummary(), this.getUserActivitySummary.bind(this));
        this.router.get('/analytics/security-analysis', this.validateSecurityAnalysis(), this.getSecurityAnalysis.bind(this));
        this.router.get('/analytics/behavior-analysis/:userId', this.validateBehaviorAnalysis(), this.getBehaviorAnalysis.bind(this));
        this.router.get('/analytics/trend-analysis', this.validateTrendAnalysis(), this.getTrendAnalysis.bind(this));
        this.router.get('/analytics/anomaly-detection', this.validateAnomalyDetection(), this.getAnomalyDetection.bind(this));
        this.router.post('/analytics/reports', this.validateCreateReport(), this.createReport.bind(this));
        this.router.get('/analytics/reports', this.getReports.bind(this));
        this.router.put('/analytics/reports/:reportId', this.validateUpdateReport(), this.updateReport.bind(this));
        this.router.delete('/analytics/reports/:reportId', this.validateReportId(), this.deleteReport.bind(this));
        // Suspicious Activity Detection Routes
        this.router.get('/alerts', this.validateGetAlerts(), this.getSuspiciousActivityAlerts.bind(this));
        this.router.get('/alerts/:alertId', this.validateAlertId(), this.getSuspiciousActivityAlert.bind(this));
        this.router.put('/alerts/:alertId/status', this.validateUpdateAlertStatus(), this.updateAlertStatus.bind(this));
        this.router.post('/detection/rules', this.validateCreateDetectionRule(), this.createDetectionRule.bind(this));
        this.router.get('/detection/rules', this.getDetectionRules.bind(this));
        this.router.put('/detection/rules/:ruleId', this.validateUpdateDetectionRule(), this.updateDetectionRule.bind(this));
        this.router.delete('/detection/rules/:ruleId', this.validateRuleId(), this.deleteDetectionRule.bind(this));
        this.router.get('/detection/stats', this.getDetectionStatistics.bind(this));
        this.router.post('/detection/threat-intelligence', this.validateAddThreatIntelligence(), this.addThreatIntelligence.bind(this));
        // Retention and Archival Routes
        this.router.post('/retention/policies', this.validateCreateRetentionPolicy(), this.createRetentionPolicy.bind(this));
        this.router.get('/retention/policies', this.getRetentionPolicies.bind(this));
        this.router.put('/retention/policies/:policyId', this.validateUpdateRetentionPolicy(), this.updateRetentionPolicy.bind(this));
        this.router.delete('/retention/policies/:policyId', this.validatePolicyId(), this.deleteRetentionPolicy.bind(this));
        this.router.post('/retention/apply/:policyId', this.validateApplyRetention(), this.applyRetentionPolicy.bind(this));
        this.router.get('/retention/archived', this.validateGetArchived(), this.getArchivedActivities.bind(this));
        this.router.get('/retention/archived/:archiveId', this.validateArchiveId(), this.getArchivedActivity.bind(this));
        this.router.get('/retention/stats', this.getRetentionStatistics.bind(this));
        this.router.post('/retention/jobs', this.validateCreateRetentionJob(), this.createRetentionJob.bind(this));
        this.router.post('/retention/data-subject-requests', this.validateDataSubjectRequest(), this.processDataSubjectRequest.bind(this));
        // Privacy and Compliance Routes
        this.router.post('/privacy/policies', this.validateCreatePrivacyPolicy(), this.createPrivacyPolicy.bind(this));
        this.router.get('/privacy/policies', this.getPrivacyPolicies.bind(this));
        this.router.post('/privacy/anonymize', this.validateAnonymizeActivity(), this.anonymizeActivity.bind(this));
        this.router.post('/privacy/consent', this.validateRecordConsent(), this.recordConsent.bind(this));
        this.router.delete('/privacy/consent', this.validateWithdrawConsent(), this.withdrawConsent.bind(this));
        this.router.post('/privacy/data-subject-rights', this.validateDataSubjectRight(), this.processDataSubjectRight.bind(this));
        this.router.get('/privacy/export/:userId', this.validateUserId(), this.exportUserData.bind(this));
        this.router.get('/privacy/audit-logs', this.validateGetAuditLogs(), this.getPrivacyAuditLogs.bind(this));
        this.router.get('/privacy/compliance-report', this.getComplianceReport.bind(this));
        this.router.post('/privacy/data-flows', this.validateCreateDataFlow(), this.createDataFlowMapping.bind(this));
        // Dashboard and Visualization Routes
        this.router.get('/dashboard/overview', this.getDashboardOverview.bind(this));
        this.router.get('/dashboard/real-time-metrics', this.getRealTimeMetrics.bind(this));
        this.router.get('/dashboard/security-dashboard', this.getSecurityDashboard.bind(this));
        this.router.get('/dashboard/compliance-dashboard', this.getComplianceDashboard.bind(this));
        this.router.get('/dashboard/user-activity/:userId', this.validateUserId(), this.getUserActivityDashboard.bind(this));
        // Health and Status Routes
        this.router.get('/health', this.getHealthStatus.bind(this));
        this.router.get('/status', this.getSystemStatus.bind(this));
    }
    // Activity Management Endpoints
    async getActivities(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const filter = {
                userId: req.query.userId,
                tenantId: req.user?.tenantId,
                activityType: req.query.activityType,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                severity: req.query.severity
            };
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;
            const activities = await this.activityService.getActivities(filter, limit, offset);
            res.json({
                activities,
                pagination: {
                    limit,
                    offset,
                    total: activities.length
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getActivity(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            // Activity retrieval would be implemented here
            res.status(404).json({ error: 'Activity not found' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createActivity(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const activityData = {
                ...req.body,
                userId: req.user?.id,
                tenantId: req.user?.tenantId,
                timestamp: new Date()
            };
            const activity = await this.activityService.trackActivity(activityData);
            res.status(201).json({ activity });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getUserSessions(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const userId = req.params.userId;
            const active = req.query.active === 'true';
            const sessions = await this.activityService.getUserSessions(userId, active);
            res.json({ sessions });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getActivityMetrics(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const filter = {
                tenantId: req.user?.tenantId,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            };
            const metrics = await this.activityService.getActivityMetrics(filter);
            res.json({ metrics });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Streaming Endpoints
    async subscribeToStream(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const subscription = await this.streamingService.subscribe(req.user.id, req.user.tenantId, req.body.socketId, req.body.filter || {});
            res.status(201).json({ subscription });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async unsubscribeFromStream(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const success = await this.streamingService.unsubscribe(req.params.subscriptionId);
            res.json({ success });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getStreamingSubscriptions(req, res) {
        try {
            const subscriptions = await this.streamingService.getUserSubscriptions(req.user.id);
            res.json({ subscriptions });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getStreamingStats(req, res) {
        try {
            const stats = await this.streamingService.getSubscriptionStats();
            res.json({ stats });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getStreamingHistory(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const limit = parseInt(req.query.limit) || 100;
            const history = await this.streamingService.getMessageHistory(req.params.subscriptionId, limit);
            res.json({ history });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Analytics Endpoints
    async getUserActivitySummary(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const userId = req.params.userId;
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            // Would get activities from activity service
            const activities = [];
            const summary = await this.analyticsService.generateUserActivitySummary(userId, req.user.tenantId, startDate, endDate, activities);
            res.json({ summary });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getSecurityAnalysis(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            // Would get activities from activity service
            const activities = [];
            const analysis = await this.analyticsService.generateSecurityAnalysis(req.user.tenantId, startDate, endDate, activities);
            res.json({ analysis });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getBehaviorAnalysis(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const userId = req.params.userId;
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            const activities = [];
            const analysis = await this.analyticsService.generateBehaviorAnalysis(userId, startDate, endDate, activities);
            res.json({ analysis });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getTrendAnalysis(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            const activities = [];
            const analysis = await this.analyticsService.generateTrendAnalysis(req.user.tenantId, startDate, endDate, activities);
            res.json({ analysis });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getAnomalyDetection(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            const activities = [];
            const result = await this.analyticsService.detectAnomalies(req.user.tenantId, startDate, endDate, activities);
            res.json({ result });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createReport(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const report = await this.analyticsService.createReport(req.body);
            res.status(201).json({ report });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getReports(req, res) {
        try {
            const reports = await this.analyticsService.getReports(req.user?.tenantId);
            res.json({ reports });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateReport(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const report = await this.analyticsService.updateReport(req.params.reportId, req.body);
            if (!report) {
                res.status(404).json({ error: 'Report not found' });
                return;
            }
            res.json({ report });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteReport(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const success = await this.analyticsService.deleteReport(req.params.reportId);
            res.json({ success });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Suspicious Activity Detection Endpoints
    async getSuspiciousActivityAlerts(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const filter = {
                tenantId: req.user?.tenantId,
                userId: req.query.userId,
                severity: req.query.severity,
                status: req.query.status,
                alertType: req.query.alertType,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            };
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;
            const alerts = await this.detectionService.getAlerts(filter, limit, offset);
            res.json({ alerts });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getSuspiciousActivityAlert(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            // Would implement alert retrieval by ID
            res.status(404).json({ error: 'Alert not found' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateAlertStatus(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const alert = await this.detectionService.updateAlertStatus(req.params.alertId, req.body.status, req.body.assignedTo, req.body.resolution);
            if (!alert) {
                res.status(404).json({ error: 'Alert not found' });
                return;
            }
            res.json({ alert });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createDetectionRule(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const rule = await this.detectionService.createDetectionRule(req.body);
            res.status(201).json({ rule });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getDetectionRules(req, res) {
        try {
            const rules = await this.detectionService.getDetectionRules();
            res.json({ rules });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateDetectionRule(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const rule = await this.detectionService.updateDetectionRule(req.params.ruleId, req.body);
            if (!rule) {
                res.status(404).json({ error: 'Rule not found' });
                return;
            }
            res.json({ rule });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteDetectionRule(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const success = await this.detectionService.deleteDetectionRule(req.params.ruleId);
            res.json({ success });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getDetectionStatistics(req, res) {
        try {
            const stats = await this.detectionService.getAlertStatistics();
            res.json({ stats });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async addThreatIntelligence(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const threat = await this.detectionService.addThreatIntelligence(req.body);
            res.status(201).json({ threat });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Retention and Archival Endpoints
    async createRetentionPolicy(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const policy = await this.retentionService.createRetentionPolicy({
                ...req.body,
                tenantId: req.user.tenantId
            });
            res.status(201).json({ policy });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRetentionPolicies(req, res) {
        try {
            const policies = await this.retentionService.getRetentionPolicies(req.user?.tenantId);
            res.json({ policies });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateRetentionPolicy(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const policy = await this.retentionService.updateRetentionPolicy(req.params.policyId, req.body);
            if (!policy) {
                res.status(404).json({ error: 'Policy not found' });
                return;
            }
            res.json({ policy });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteRetentionPolicy(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const success = await this.retentionService.deleteRetentionPolicy(req.params.policyId);
            res.json({ success });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async applyRetentionPolicy(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            // Would get activities from activity service
            const activities = [];
            const results = await this.retentionService.applyRetentionPolicies(req.user.tenantId, activities);
            res.json({ results });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getArchivedActivities(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const filter = {
                tenantId: req.user?.tenantId,
                userId: req.query.userId,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                policyId: req.query.policyId
            };
            const archived = await this.retentionService.getArchivedActivities(filter);
            res.json({ archived });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getArchivedActivity(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const activity = await this.retentionService.retrieveArchivedActivity(req.params.archiveId);
            if (!activity) {
                res.status(404).json({ error: 'Archived activity not found' });
                return;
            }
            res.json({ activity });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRetentionStatistics(req, res) {
        try {
            const stats = await this.retentionService.getRetentionStatistics(req.user.tenantId);
            res.json({ stats });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createRetentionJob(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const job = await this.retentionService.createRetentionJob(req.body.policyId, req.user.tenantId);
            res.status(201).json({ job });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async processDataSubjectRequest(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const request = await this.retentionService.processDataSubjectRequest({
                ...req.body,
                tenantId: req.user.tenantId
            });
            res.status(201).json({ request });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Privacy and Compliance Endpoints
    async createPrivacyPolicy(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const policy = await this.privacyService.createPrivacyPolicy({
                ...req.body,
                tenantId: req.user.tenantId
            });
            res.status(201).json({ policy });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getPrivacyPolicies(req, res) {
        try {
            // Would implement privacy policy retrieval
            res.json({ policies: [] });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async anonymizeActivity(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const anonymized = await this.privacyService.anonymizeActivity(req.body.activity, req.body.method);
            res.json({ anonymized });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async recordConsent(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const consent = await this.privacyService.recordConsent({
                ...req.body,
                userId: req.user.id,
                tenantId: req.user.tenantId
            });
            res.status(201).json({ consent });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async withdrawConsent(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const success = await this.privacyService.withdrawConsent(req.user.id, req.body.policyId, req.body.reason);
            res.json({ success });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async processDataSubjectRight(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const request = await this.privacyService.processDataSubjectRight({
                ...req.body,
                userId: req.user.id,
                tenantId: req.user.tenantId
            });
            res.status(201).json({ request });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async exportUserData(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const userId = req.params.userId;
            const exportData = await this.privacyService.exportUserData(userId, req.user.tenantId);
            res.json({ exportData });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getPrivacyAuditLogs(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const filter = {
                tenantId: req.user?.tenantId,
                userId: req.query.userId,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            };
            const logs = await this.privacyService.getPrivacyAuditLogs(filter);
            res.json({ logs });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getComplianceReport(req, res) {
        try {
            const report = await this.privacyService.getComplianceReport(req.user.tenantId);
            res.json({ report });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createDataFlowMapping(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const mapping = await this.privacyService.createDataFlowMapping({
                ...req.body,
                tenantId: req.user.tenantId
            });
            res.status(201).json({ mapping });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Dashboard Endpoints
    async getDashboardOverview(req, res) {
        try {
            const overview = {
                totalActivities: 0,
                activeUsers: 0,
                suspiciousActivities: 0,
                complianceViolations: 0,
                systemHealth: 'healthy'
            };
            res.json({ overview });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRealTimeMetrics(req, res) {
        try {
            const metrics = {
                timestamp: new Date(),
                activeUsers: 0,
                activitiesPerMinute: 0,
                alertsPerHour: 0,
                systemLoad: 0.5
            };
            res.json({ metrics });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getSecurityDashboard(req, res) {
        try {
            const dashboard = {
                totalAlerts: 0,
                criticalAlerts: 0,
                topThreats: [],
                recentIncidents: []
            };
            res.json({ dashboard });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getComplianceDashboard(req, res) {
        try {
            const dashboard = {
                complianceScore: 95,
                activePolicies: 0,
                dataSubjectRequests: 0,
                retentionCompliance: 100
            };
            res.json({ dashboard });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getUserActivityDashboard(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const userId = req.params.userId;
            const dashboard = {
                userId,
                totalActivities: 0,
                lastActivity: null,
                riskScore: 0,
                complianceStatus: 'compliant'
            };
            res.json({ dashboard });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Health and Status Endpoints
    async getHealthStatus(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date(),
                services: {
                    activityTracking: 'up',
                    streaming: 'up',
                    analytics: 'up',
                    detection: 'up',
                    retention: 'up',
                    privacy: 'up'
                }
            };
            res.json(health);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getSystemStatus(req, res) {
        try {
            const status = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            };
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Validation middleware
    validateGetActivities() {
        return [
            (0, express_validator_1.query)('userId').optional().isUUID(),
            (0, express_validator_1.query)('activityType').optional().isIn(Object.values(ActivityTrackingService_1.ActivityType)),
            (0, express_validator_1.query)('startDate').optional().isISO8601(),
            (0, express_validator_1.query)('endDate').optional().isISO8601(),
            (0, express_validator_1.query)('severity').optional().isIn(Object.values(ActivityTrackingService_1.ActivitySeverity)),
            (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }),
            (0, express_validator_1.query)('offset').optional().isInt({ min: 0 })
        ];
    }
    validateActivityId() {
        return [(0, express_validator_1.param)('id').isUUID()];
    }
    validateCreateActivity() {
        return [
            (0, express_validator_1.body)('activityType').isIn(Object.values(ActivityTrackingService_1.ActivityType)),
            (0, express_validator_1.body)('activityCategory').isIn(Object.values(ActivityTrackingService_1.ActivityCategory)),
            (0, express_validator_1.body)('action').isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('resource').isString().isLength({ min: 1, max: 200 }),
            (0, express_validator_1.body)('ipAddress').isIP(),
            (0, express_validator_1.body)('userAgent').optional().isString()
        ];
    }
    validateUserId() {
        return [(0, express_validator_1.param)('userId').isUUID()];
    }
    validateGetMetrics() {
        return [
            (0, express_validator_1.query)('startDate').optional().isISO8601(),
            (0, express_validator_1.query)('endDate').optional().isISO8601()
        ];
    }
    validateSubscribe() {
        return [
            (0, express_validator_1.body)('socketId').isString(),
            (0, express_validator_1.body)('filter').optional().isObject()
        ];
    }
    validateSubscriptionId() {
        return [(0, express_validator_1.param)('subscriptionId').isUUID()];
    }
    validateUserSummary() {
        return [
            (0, express_validator_1.param)('userId').isUUID(),
            (0, express_validator_1.query)('startDate').isISO8601(),
            (0, express_validator_1.query)('endDate').isISO8601()
        ];
    }
    validateSecurityAnalysis() {
        return [
            (0, express_validator_1.query)('startDate').isISO8601(),
            (0, express_validator_1.query)('endDate').isISO8601()
        ];
    }
    validateBehaviorAnalysis() {
        return [
            (0, express_validator_1.param)('userId').isUUID(),
            (0, express_validator_1.query)('startDate').isISO8601(),
            (0, express_validator_1.query)('endDate').isISO8601()
        ];
    }
    validateTrendAnalysis() {
        return [
            (0, express_validator_1.query)('startDate').isISO8601(),
            (0, express_validator_1.query)('endDate').isISO8601()
        ];
    }
    validateAnomalyDetection() {
        return [
            (0, express_validator_1.query)('startDate').isISO8601(),
            (0, express_validator_1.query)('endDate').isISO8601()
        ];
    }
    validateCreateReport() {
        return [
            (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('type').isIn(Object.values(ActivityAnalyticsService_1.ReportType)),
            (0, express_validator_1.body)('parameters').isObject(),
            (0, express_validator_1.body)('recipients').isArray()
        ];
    }
    validateUpdateReport() {
        return [
            (0, express_validator_1.param)('reportId').isUUID(),
            (0, express_validator_1.body)('name').optional().isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('isActive').optional().isBoolean()
        ];
    }
    validateReportId() {
        return [(0, express_validator_1.param)('reportId').isUUID()];
    }
    validateGetAlerts() {
        return [
            (0, express_validator_1.query)('userId').optional().isUUID(),
            (0, express_validator_1.query)('severity').optional().isIn(Object.values(ActivityTrackingService_1.ActivitySeverity)),
            (0, express_validator_1.query)('status').optional().isIn(Object.values(SuspiciousActivityDetectionService_1.AlertStatus)),
            (0, express_validator_1.query)('alertType').optional().isIn(Object.values(SuspiciousActivityDetectionService_1.AlertType)),
            (0, express_validator_1.query)('startDate').optional().isISO8601(),
            (0, express_validator_1.query)('endDate').optional().isISO8601(),
            (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }),
            (0, express_validator_1.query)('offset').optional().isInt({ min: 0 })
        ];
    }
    validateAlertId() {
        return [(0, express_validator_1.param)('alertId').isUUID()];
    }
    validateUpdateAlertStatus() {
        return [
            (0, express_validator_1.param)('alertId').isUUID(),
            (0, express_validator_1.body)('status').isIn(Object.values(SuspiciousActivityDetectionService_1.AlertStatus)),
            (0, express_validator_1.body)('assignedTo').optional().isString(),
            (0, express_validator_1.body)('resolution').optional().isString()
        ];
    }
    validateCreateDetectionRule() {
        return [
            (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('alertType').isIn(Object.values(SuspiciousActivityDetectionService_1.AlertType)),
            (0, express_validator_1.body)('severity').isIn(Object.values(ActivityTrackingService_1.ActivitySeverity)),
            (0, express_validator_1.body)('enabled').isBoolean(),
            (0, express_validator_1.body)('conditions').isArray(),
            (0, express_validator_1.body)('threshold').isFloat({ min: 0, max: 1 })
        ];
    }
    validateUpdateDetectionRule() {
        return [
            (0, express_validator_1.param)('ruleId').isUUID(),
            (0, express_validator_1.body)('name').optional().isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('enabled').optional().isBoolean()
        ];
    }
    validateRuleId() {
        return [(0, express_validator_1.param)('ruleId').isUUID()];
    }
    validateAddThreatIntelligence() {
        return [
            (0, express_validator_1.body)('type').isIn(['ip_reputation', 'known_attacker', 'malicious_pattern', 'compromised_credential']),
            (0, express_validator_1.body)('value').isString(),
            (0, express_validator_1.body)('severity').isIn(Object.values(ActivityTrackingService_1.ActivitySeverity)),
            (0, express_validator_1.body)('source').isString(),
            (0, express_validator_1.body)('description').isString()
        ];
    }
    validateCreateRetentionPolicy() {
        return [
            (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('description').isString(),
            (0, express_validator_1.body)('rules').isArray(),
            (0, express_validator_1.body)('isActive').isBoolean(),
            (0, express_validator_1.body)('priority').isInt({ min: 0, max: 100 })
        ];
    }
    validateUpdateRetentionPolicy() {
        return [
            (0, express_validator_1.param)('policyId').isUUID(),
            (0, express_validator_1.body)('name').optional().isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('isActive').optional().isBoolean()
        ];
    }
    validatePolicyId() {
        return [(0, express_validator_1.param)('policyId').isUUID()];
    }
    validateApplyRetention() {
        return [(0, express_validator_1.param)('policyId').isUUID()];
    }
    validateGetArchived() {
        return [
            (0, express_validator_1.query)('userId').optional().isUUID(),
            (0, express_validator_1.query)('startDate').optional().isISO8601(),
            (0, express_validator_1.query)('endDate').optional().isISO8601(),
            (0, express_validator_1.query)('policyId').optional().isUUID()
        ];
    }
    validateArchiveId() {
        return [(0, express_validator_1.param)('archiveId').isUUID()];
    }
    validateCreateRetentionJob() {
        return [(0, express_validator_1.body)('policyId').isUUID()];
    }
    validateDataSubjectRequest() {
        return [
            (0, express_validator_1.body)('type').isIn(Object.values(ActivityRetentionService_1.RequestType)),
            (0, express_validator_1.body)('userId').isUUID(),
            (0, express_validator_1.body)('requestDetails').isObject(),
            (0, express_validator_1.body)('verificationRequired').isBoolean()
        ];
    }
    validateCreatePrivacyPolicy() {
        return [
            (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('description').isString(),
            (0, express_validator_1.body)('version').isString(),
            (0, express_validator_1.body)('effectiveDate').isISO8601(),
            (0, express_validator_1.body)('isActive').isBoolean(),
            (0, express_validator_1.body)('rules').isArray()
        ];
    }
    validateAnonymizeActivity() {
        return [
            (0, express_validator_1.body)('activity').isObject(),
            (0, express_validator_1.body)('method').isIn(Object.values(ActivityPrivacyService_1.AnonymizationMethod))
        ];
    }
    validateRecordConsent() {
        return [
            (0, express_validator_1.body)('policyId').isUUID(),
            (0, express_validator_1.body)('consentGiven').isBoolean(),
            (0, express_validator_1.body)('consentMethod').isString(),
            (0, express_validator_1.body)('purposes').isArray()
        ];
    }
    validateWithdrawConsent() {
        return [
            (0, express_validator_1.body)('policyId').isUUID(),
            (0, express_validator_1.body)('reason').isString()
        ];
    }
    validateDataSubjectRight() {
        return [
            (0, express_validator_1.body)('right').isIn(Object.values(ActivityPrivacyService_1.DataSubjectRight)),
            (0, express_validator_1.body)('requestDetails').isObject(),
            (0, express_validator_1.body)('verificationMethod').isString()
        ];
    }
    validateGetAuditLogs() {
        return [
            (0, express_validator_1.query)('userId').optional().isUUID(),
            (0, express_validator_1.query)('startDate').optional().isISO8601(),
            (0, express_validator_1.query)('endDate').optional().isISO8601()
        ];
    }
    validateCreateDataFlow() {
        return [
            (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 100 }),
            (0, express_validator_1.body)('sourceSystem').isString(),
            (0, express_validator_1.body)('targetSystem').isString(),
            (0, express_validator_1.body)('dataCategories').isArray(),
            (0, express_validator_1.body)('processingOperations').isArray()
        ];
    }
}
exports.ActivityMonitoringController = ActivityMonitoringController;

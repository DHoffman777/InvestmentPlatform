import { Router, Request, Response } from 'express';
const { body, query, param, validationResult } = require('express-validator');
import { 
  ActivityTrackingService, 
  ActivityData, 
  ActivityFilter, 
  ActivityType, 
  ActivityCategory, 
  ActivitySeverity 
} from './ActivityTrackingService';
import { 
  ActivityStreamingService, 
  StreamMessageType 
} from './ActivityStreamingService';
import { 
  ActivityAnalyticsService, 
  ReportType 
} from './ActivityAnalyticsService';
import { 
  SuspiciousActivityDetectionService, 
  AlertType, 
  AlertStatus 
} from './SuspiciousActivityDetectionService';
import { 
  ActivityRetentionService, 
  RetentionAction, 
  RequestType, 
  RequestStatus 
} from './ActivityRetentionService';
import { 
  ActivityPrivacyService, 
  DataCategory, 
  AnonymizationMethod, 
  DataSubjectRight, 
  LegalBasis 
} from './ActivityPrivacyService';

interface AuthenticatedRequest extends Request {
  user?: any; // Simplified to avoid type conflicts
}

export class ActivityMonitoringController {
  private router: Router;
  private activityService: ActivityTrackingService;
  private streamingService: ActivityStreamingService;
  private analyticsService: ActivityAnalyticsService;
  private detectionService: SuspiciousActivityDetectionService;
  private retentionService: ActivityRetentionService;
  private privacyService: ActivityPrivacyService;

  constructor(
    activityService: ActivityTrackingService,
    streamingService: ActivityStreamingService,
    analyticsService: ActivityAnalyticsService,
    detectionService: SuspiciousActivityDetectionService,
    retentionService: ActivityRetentionService,
    privacyService: ActivityPrivacyService
  ) {
    this.router = Router();
    this.activityService = activityService;
    this.streamingService = streamingService;
    this.analyticsService = analyticsService;
    this.detectionService = detectionService;
    this.retentionService = retentionService;
    this.privacyService = privacyService;

    this.setupRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private setupRoutes(): void {
    // Activity Management Routes
    this.router.get('/activities', this.validateGetActivities(), this.getActivities.bind(this) as any);
    this.router.get('/activities/:id', this.validateActivityId(), this.getActivity.bind(this) as any);
    this.router.post('/activities', this.validateCreateActivity(), this.createActivity.bind(this) as any);
    this.router.get('/activities/user/:userId/sessions', this.validateUserId(), this.getUserSessions.bind(this) as any);
    this.router.get('/activities/metrics', this.validateGetMetrics(), this.getActivityMetrics.bind(this) as any);

    // Real-time Streaming Routes
    this.router.post('/streaming/subscribe', this.validateSubscribe(), this.subscribeToStream.bind(this) as any);
    this.router.delete('/streaming/subscribe/:subscriptionId', this.validateSubscriptionId(), this.unsubscribeFromStream.bind(this) as any);
    this.router.get('/streaming/subscriptions', this.getStreamingSubscriptions.bind(this) as any);
    this.router.get('/streaming/stats', this.getStreamingStats.bind(this) as any);
    this.router.get('/streaming/history/:subscriptionId', this.validateSubscriptionId(), this.getStreamingHistory.bind(this) as any);

    // Analytics and Reporting Routes
    this.router.get('/analytics/user-summary/:userId', this.validateUserSummary(), this.getUserActivitySummary.bind(this) as any);
    this.router.get('/analytics/security-analysis', this.validateSecurityAnalysis(), this.getSecurityAnalysis.bind(this) as any);
    this.router.get('/analytics/behavior-analysis/:userId', this.validateBehaviorAnalysis(), this.getBehaviorAnalysis.bind(this) as any);
    this.router.get('/analytics/trend-analysis', this.validateTrendAnalysis(), this.getTrendAnalysis.bind(this) as any);
    this.router.get('/analytics/anomaly-detection', this.validateAnomalyDetection(), this.getAnomalyDetection.bind(this) as any);
    this.router.post('/analytics/reports', this.validateCreateReport(), this.createReport.bind(this) as any);
    this.router.get('/analytics/reports', this.getReports.bind(this) as any);
    this.router.put('/analytics/reports/:reportId', this.validateUpdateReport(), this.updateReport.bind(this) as any);
    this.router.delete('/analytics/reports/:reportId', this.validateReportId(), this.deleteReport.bind(this) as any);

    // Suspicious Activity Detection Routes
    this.router.get('/alerts', this.validateGetAlerts(), this.getSuspiciousActivityAlerts.bind(this) as any);
    this.router.get('/alerts/:alertId', this.validateAlertId(), this.getSuspiciousActivityAlert.bind(this) as any);
    this.router.put('/alerts/:alertId/status', this.validateUpdateAlertStatus(), this.updateAlertStatus.bind(this) as any);
    this.router.post('/detection/rules', this.validateCreateDetectionRule(), this.createDetectionRule.bind(this) as any);
    this.router.get('/detection/rules', this.getDetectionRules.bind(this) as any);
    this.router.put('/detection/rules/:ruleId', this.validateUpdateDetectionRule(), this.updateDetectionRule.bind(this) as any);
    this.router.delete('/detection/rules/:ruleId', this.validateRuleId(), this.deleteDetectionRule.bind(this) as any);
    this.router.get('/detection/stats', this.getDetectionStatistics.bind(this) as any);
    this.router.post('/detection/threat-intelligence', this.validateAddThreatIntelligence(), this.addThreatIntelligence.bind(this) as any);

    // Retention and Archival Routes
    this.router.post('/retention/policies', this.validateCreateRetentionPolicy(), this.createRetentionPolicy.bind(this) as any);
    this.router.get('/retention/policies', this.getRetentionPolicies.bind(this) as any);
    this.router.put('/retention/policies/:policyId', this.validateUpdateRetentionPolicy(), this.updateRetentionPolicy.bind(this) as any);
    this.router.delete('/retention/policies/:policyId', this.validatePolicyId(), this.deleteRetentionPolicy.bind(this) as any);
    this.router.post('/retention/apply/:policyId', this.validateApplyRetention(), this.applyRetentionPolicy.bind(this) as any);
    this.router.get('/retention/archived', this.validateGetArchived(), this.getArchivedActivities.bind(this) as any);
    this.router.get('/retention/archived/:archiveId', this.validateArchiveId(), this.getArchivedActivity.bind(this) as any);
    this.router.get('/retention/stats', this.getRetentionStatistics.bind(this) as any);
    this.router.post('/retention/jobs', this.validateCreateRetentionJob(), this.createRetentionJob.bind(this) as any);
    this.router.post('/retention/data-subject-requests', this.validateDataSubjectRequest(), this.processDataSubjectRequest.bind(this) as any);

    // Privacy and Compliance Routes
    this.router.post('/privacy/policies', this.validateCreatePrivacyPolicy(), this.createPrivacyPolicy.bind(this) as any);
    this.router.get('/privacy/policies', this.getPrivacyPolicies.bind(this) as any);
    this.router.post('/privacy/anonymize', this.validateAnonymizeActivity(), this.anonymizeActivity.bind(this) as any);
    this.router.post('/privacy/consent', this.validateRecordConsent(), this.recordConsent.bind(this) as any);
    this.router.delete('/privacy/consent', this.validateWithdrawConsent(), this.withdrawConsent.bind(this) as any);
    this.router.post('/privacy/data-subject-rights', this.validateDataSubjectRight(), this.processDataSubjectRight.bind(this) as any);
    this.router.get('/privacy/export/:userId', this.validateUserId(), this.exportUserData.bind(this) as any);
    this.router.get('/privacy/audit-logs', this.validateGetAuditLogs(), this.getPrivacyAuditLogs.bind(this) as any);
    this.router.get('/privacy/compliance-report', this.getComplianceReport.bind(this) as any);
    this.router.post('/privacy/data-flows', this.validateCreateDataFlow(), this.createDataFlowMapping.bind(this) as any);

    // Dashboard and Visualization Routes
    this.router.get('/dashboard/overview', this.getDashboardOverview.bind(this) as any);
    this.router.get('/dashboard/real-time-metrics', this.getRealTimeMetrics.bind(this) as any);
    this.router.get('/dashboard/security-dashboard', this.getSecurityDashboard.bind(this) as any);
    this.router.get('/dashboard/compliance-dashboard', this.getComplianceDashboard.bind(this) as any);
    this.router.get('/dashboard/user-activity/:userId', this.validateUserId(), this.getUserActivityDashboard.bind(this) as any);

    // Health and Status Routes
    this.router.get('/health', this.getHealthStatus.bind(this) as any);
    this.router.get('/status', this.getSystemStatus.bind(this) as any);
  }

  // Activity Management Endpoints
  private async getActivities(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const filter: ActivityFilter = {
        userId: req.query.userId as string,
        tenantId: req.user?.tenantId,
        activityType: req.query.activityType as ActivityType[],
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        severity: req.query.severity as ActivitySeverity[]
      };

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const activities = await this.activityService.getActivities(filter, limit, offset);
      
      res.json({
        activities,
        pagination: {
          limit,
          offset,
          total: activities.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getActivity(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Activity retrieval would be implemented here
      res.status(404).json({ error: 'Activity not found' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async createActivity(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const activityData: Partial<ActivityData> = {
        ...req.body,
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        timestamp: new Date()
      };

      const activity = await this.activityService.trackActivity(activityData);
      res.status(201).json({ activity });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getUserSessions(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.params.userId;
      const active = req.query.active === 'true';

      const sessions = await this.activityService.getUserSessions(userId, active);
      res.json({ sessions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getActivityMetrics(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const filter: ActivityFilter = {
        tenantId: req.user?.tenantId,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const metrics = await this.activityService.getActivityMetrics(filter);
      res.json({ metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Streaming Endpoints
  private async subscribeToStream(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const subscription = await this.streamingService.subscribe(
        req.user!.id,
        req.user!.tenantId,
        req.body.socketId,
        req.body.filter || {}
      );

      res.status(201).json({ subscription });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async unsubscribeFromStream(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const success = await this.streamingService.unsubscribe(req.params.subscriptionId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getStreamingSubscriptions(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const subscriptions = await this.streamingService.getUserSubscriptions(req.user!.id);
      res.json({ subscriptions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getStreamingStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const stats = await this.streamingService.getSubscriptionStats();
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getStreamingHistory(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const history = await this.streamingService.getMessageHistory(req.params.subscriptionId, limit);
      
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Analytics Endpoints
  private async getUserActivitySummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.params.userId;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      // Would get activities from activity service
      const activities: ActivityData[] = [];

      const summary = await this.analyticsService.generateUserActivitySummary(
        userId,
        req.user!.tenantId,
        startDate,
        endDate,
        activities
      );

      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getSecurityAnalysis(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      // Would get activities from activity service
      const activities: ActivityData[] = [];

      const analysis = await this.analyticsService.generateSecurityAnalysis(
        req.user!.tenantId,
        startDate,
        endDate,
        activities
      );

      res.json({ analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getBehaviorAnalysis(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.params.userId;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const activities: ActivityData[] = [];

      const analysis = await this.analyticsService.generateBehaviorAnalysis(
        userId,
        startDate,
        endDate,
        activities
      );

      res.json({ analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getTrendAnalysis(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const activities: ActivityData[] = [];

      const analysis = await this.analyticsService.generateTrendAnalysis(
        req.user!.tenantId,
        startDate,
        endDate,
        activities
      );

      res.json({ analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getAnomalyDetection(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const activities: ActivityData[] = [];

      const result = await this.analyticsService.detectAnomalies(
        req.user!.tenantId,
        startDate,
        endDate,
        activities
      );

      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async createReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const report = await this.analyticsService.createReport(req.body);
      res.status(201).json({ report });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getReports(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const reports = await this.analyticsService.getReports(req.user?.tenantId);
      res.json({ reports });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async updateReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async deleteReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const success = await this.analyticsService.deleteReport(req.params.reportId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Suspicious Activity Detection Endpoints
  private async getSuspiciousActivityAlerts(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const filter = {
        tenantId: req.user?.tenantId,
        userId: req.query.userId as string,
        severity: req.query.severity as ActivitySeverity[],
        status: req.query.status as AlertStatus[],
        alertType: req.query.alertType as AlertType[],
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const alerts = await this.detectionService.getAlerts(filter, limit, offset);
      res.json({ alerts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getSuspiciousActivityAlert(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Would implement alert retrieval by ID
      res.status(404).json({ error: 'Alert not found' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async updateAlertStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const alert = await this.detectionService.updateAlertStatus(
        req.params.alertId,
        req.body.status,
        req.body.assignedTo,
        req.body.resolution
      );

      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      res.json({ alert });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async createDetectionRule(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const rule = await this.detectionService.createDetectionRule(req.body);
      res.status(201).json({ rule });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getDetectionRules(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const rules = await this.detectionService.getDetectionRules();
      res.json({ rules });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async updateDetectionRule(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async deleteDetectionRule(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const success = await this.detectionService.deleteDetectionRule(req.params.ruleId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getDetectionStatistics(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const stats = await this.detectionService.getAlertStatistics();
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async addThreatIntelligence(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const threat = await this.detectionService.addThreatIntelligence(req.body);
      res.status(201).json({ threat });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Retention and Archival Endpoints
  private async createRetentionPolicy(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const policy = await this.retentionService.createRetentionPolicy({
        ...req.body,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({ policy });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getRetentionPolicies(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const policies = await this.retentionService.getRetentionPolicies(req.user?.tenantId);
      res.json({ policies });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async updateRetentionPolicy(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async deleteRetentionPolicy(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const success = await this.retentionService.deleteRetentionPolicy(req.params.policyId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async applyRetentionPolicy(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Would get activities from activity service
      const activities: ActivityData[] = [];

      const results = await this.retentionService.applyRetentionPolicies(
        req.user!.tenantId,
        activities
      );

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getArchivedActivities(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const filter = {
        tenantId: req.user?.tenantId,
        userId: req.query.userId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        policyId: req.query.policyId as string
      };

      const archived = await this.retentionService.getArchivedActivities(filter);
      res.json({ archived });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getArchivedActivity(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getRetentionStatistics(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const stats = await this.retentionService.getRetentionStatistics(req.user!.tenantId);
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async createRetentionJob(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const job = await this.retentionService.createRetentionJob(
        req.body.policyId,
        req.user!.tenantId
      );

      res.status(201).json({ job });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async processDataSubjectRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const request = await this.retentionService.processDataSubjectRequest({
        ...req.body,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({ request });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Privacy and Compliance Endpoints
  private async createPrivacyPolicy(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const policy = await this.privacyService.createPrivacyPolicy({
        ...req.body,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({ policy });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getPrivacyPolicies(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      // Would implement privacy policy retrieval
      res.json({ policies: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async anonymizeActivity(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const anonymized = await this.privacyService.anonymizeActivity(
        req.body.activity,
        req.body.method
      );

      res.json({ anonymized });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async recordConsent(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const consent = await this.privacyService.recordConsent({
        ...req.body,
        userId: req.user!.id,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({ consent });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async withdrawConsent(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const success = await this.privacyService.withdrawConsent(
        req.user!.id,
        req.body.policyId,
        req.body.reason
      );

      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async processDataSubjectRight(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const request = await this.privacyService.processDataSubjectRight({
        ...req.body,
        userId: req.user!.id,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({ request });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async exportUserData(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.params.userId;
      const exportData = await this.privacyService.exportUserData(userId, req.user!.tenantId);
      
      res.json({ exportData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getPrivacyAuditLogs(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const filter = {
        tenantId: req.user?.tenantId,
        userId: req.query.userId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const logs = await this.privacyService.getPrivacyAuditLogs(filter);
      res.json({ logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getComplianceReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const report = await this.privacyService.getComplianceReport(req.user!.tenantId);
      res.json({ report });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async createDataFlowMapping(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const mapping = await this.privacyService.createDataFlowMapping({
        ...req.body,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({ mapping });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Dashboard Endpoints
  private async getDashboardOverview(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const overview = {
        totalActivities: 0,
        activeUsers: 0,
        suspiciousActivities: 0,
        complianceViolations: 0,
        systemHealth: 'healthy'
      };

      res.json({ overview });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getRealTimeMetrics(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const metrics = {
        timestamp: new Date(),
        activeUsers: 0,
        activitiesPerMinute: 0,
        alertsPerHour: 0,
        systemLoad: 0.5
      };

      res.json({ metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getSecurityDashboard(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const dashboard = {
        totalAlerts: 0,
        criticalAlerts: 0,
        topThreats: [],
        recentIncidents: []
      };

      res.json({ dashboard });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getComplianceDashboard(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const dashboard = {
        complianceScore: 95,
        activePolicies: 0,
        dataSubjectRequests: 0,
        retentionCompliance: 100
      };

      res.json({ dashboard });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getUserActivityDashboard(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Health and Status Endpoints
  private async getHealthStatus(req: Request, res: Response): Promise<any> {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getSystemStatus(req: Request, res: Response): Promise<any> {
    try {
      const status = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };

      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Validation middleware
  private validateGetActivities() {
    return [
      query('userId').optional().isUUID() as any,
      query('activityType').optional().isIn(Object.values(ActivityType)),
      query('startDate').optional().isISO8601() as any,
      query('endDate').optional().isISO8601() as any,
      query('severity').optional().isIn(Object.values(ActivitySeverity)),
      query('limit').optional().isInt({ min: 1, max: 1000 }) as any,
      query('offset').optional().isInt({ min: 0 })
    ];
  }

  private validateActivityId() {
    return [param('id').isUUID()];
  }

  private validateCreateActivity() {
    return [
      body('activityType').isIn(Object.values(ActivityType)),
      body('activityCategory').isIn(Object.values(ActivityCategory)),
      body('action').isString().isLength({ min: 1, max: 100 }) as any,
      body('resource').isString().isLength({ min: 1, max: 200 }) as any,
      body('ipAddress').isIP(),
      body('userAgent').optional().isString()
    ];
  }

  private validateUserId() {
    return [param('userId').isUUID()];
  }

  private validateGetMetrics() {
    return [
      query('startDate').optional().isISO8601() as any,
      query('endDate').optional().isISO8601()
    ];
  }

  private validateSubscribe() {
    return [
      body('socketId').isString() as any,
      body('filter').optional().isObject()
    ];
  }

  private validateSubscriptionId() {
    return [param('subscriptionId').isUUID()];
  }

  private validateUserSummary() {
    return [
      param('userId').isUUID() as any,
      query('startDate').isISO8601() as any,
      query('endDate').isISO8601()
    ];
  }

  private validateSecurityAnalysis() {
    return [
      query('startDate').isISO8601() as any,
      query('endDate').isISO8601()
    ];
  }

  private validateBehaviorAnalysis() {
    return [
      param('userId').isUUID() as any,
      query('startDate').isISO8601() as any,
      query('endDate').isISO8601()
    ];
  }

  private validateTrendAnalysis() {
    return [
      query('startDate').isISO8601() as any,
      query('endDate').isISO8601()
    ];
  }

  private validateAnomalyDetection() {
    return [
      query('startDate').isISO8601() as any,
      query('endDate').isISO8601()
    ];
  }

  private validateCreateReport() {
    return [
      body('name').isString().isLength({ min: 1, max: 100 }) as any,
      body('type').isIn(Object.values(ReportType)),
      body('parameters').isObject() as any,
      body('recipients').isArray()
    ];
  }

  private validateUpdateReport() {
    return [
      param('reportId').isUUID() as any,
      body('name').optional().isString().isLength({ min: 1, max: 100 }) as any,
      body('isActive').optional().isBoolean()
    ];
  }

  private validateReportId() {
    return [param('reportId').isUUID()];
  }

  private validateGetAlerts() {
    return [
      query('userId').optional().isUUID() as any,
      query('severity').optional().isIn(Object.values(ActivitySeverity)),
      query('status').optional().isIn(Object.values(AlertStatus)),
      query('alertType').optional().isIn(Object.values(AlertType)),
      query('startDate').optional().isISO8601() as any,
      query('endDate').optional().isISO8601() as any,
      query('limit').optional().isInt({ min: 1, max: 1000 }) as any,
      query('offset').optional().isInt({ min: 0 })
    ];
  }

  private validateAlertId() {
    return [param('alertId').isUUID()];
  }

  private validateUpdateAlertStatus() {
    return [
      param('alertId').isUUID() as any,
      body('status').isIn(Object.values(AlertStatus)),
      body('assignedTo').optional().isString() as any,
      body('resolution').optional().isString()
    ];
  }

  private validateCreateDetectionRule() {
    return [
      body('name').isString().isLength({ min: 1, max: 100 }) as any,
      body('alertType').isIn(Object.values(AlertType)),
      body('severity').isIn(Object.values(ActivitySeverity)),
      body('enabled').isBoolean() as any,
      body('conditions').isArray() as any,
      body('threshold').isFloat({ min: 0, max: 1 })
    ];
  }

  private validateUpdateDetectionRule() {
    return [
      param('ruleId').isUUID() as any,
      body('name').optional().isString().isLength({ min: 1, max: 100 }) as any,
      body('enabled').optional().isBoolean()
    ];
  }

  private validateRuleId() {
    return [param('ruleId').isUUID()];
  }

  private validateAddThreatIntelligence() {
    return [
      body('type').isIn(['ip_reputation', 'known_attacker', 'malicious_pattern', 'compromised_credential']) as any,
      body('value').isString() as any,
      body('severity').isIn(Object.values(ActivitySeverity)),
      body('source').isString() as any,
      body('description').isString()
    ];
  }

  private validateCreateRetentionPolicy() {
    return [
      body('name').isString().isLength({ min: 1, max: 100 }) as any,
      body('description').isString() as any,
      body('rules').isArray() as any,
      body('isActive').isBoolean() as any,
      body('priority').isInt({ min: 0, max: 100 })
    ];
  }

  private validateUpdateRetentionPolicy() {
    return [
      param('policyId').isUUID() as any,
      body('name').optional().isString().isLength({ min: 1, max: 100 }) as any,
      body('isActive').optional().isBoolean()
    ];
  }

  private validatePolicyId() {
    return [param('policyId').isUUID()];
  }

  private validateApplyRetention() {
    return [param('policyId').isUUID()];
  }

  private validateGetArchived() {
    return [
      query('userId').optional().isUUID() as any,
      query('startDate').optional().isISO8601() as any,
      query('endDate').optional().isISO8601() as any,
      query('policyId').optional().isUUID()
    ];
  }

  private validateArchiveId() {
    return [param('archiveId').isUUID()];
  }

  private validateCreateRetentionJob() {
    return [body('policyId').isUUID()];
  }

  private validateDataSubjectRequest() {
    return [
      body('type').isIn(Object.values(RequestType)),
      body('userId').isUUID() as any,
      body('requestDetails').isObject() as any,
      body('verificationRequired').isBoolean()
    ];
  }

  private validateCreatePrivacyPolicy() {
    return [
      body('name').isString().isLength({ min: 1, max: 100 }) as any,
      body('description').isString() as any,
      body('version').isString() as any,
      body('effectiveDate').isISO8601() as any,
      body('isActive').isBoolean() as any,
      body('rules').isArray()
    ];
  }

  private validateAnonymizeActivity() {
    return [
      body('activity').isObject() as any,
      body('method').isIn(Object.values(AnonymizationMethod))
    ];
  }

  private validateRecordConsent() {
    return [
      body('policyId').isUUID() as any,
      body('consentGiven').isBoolean() as any,
      body('consentMethod').isString() as any,
      body('purposes').isArray()
    ];
  }

  private validateWithdrawConsent() {
    return [
      body('policyId').isUUID() as any,
      body('reason').isString()
    ];
  }

  private validateDataSubjectRight() {
    return [
      body('right').isIn(Object.values(DataSubjectRight)),
      body('requestDetails').isObject() as any,
      body('verificationMethod').isString()
    ];
  }

  private validateGetAuditLogs() {
    return [
      query('userId').optional().isUUID() as any,
      query('startDate').optional().isISO8601() as any,
      query('endDate').optional().isISO8601()
    ];
  }

  private validateCreateDataFlow() {
    return [
      body('name').isString().isLength({ min: 1, max: 100 }) as any,
      body('sourceSystem').isString() as any,
      body('targetSystem').isString() as any,
      body('dataCategories').isArray() as any,
      body('processingOperations').isArray()
    ];
  }
}



import express, { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { CommunicationService } from './CommunicationService';
import { CommunicationAnalyticsService } from './CommunicationAnalyticsService';
import { ComplianceRecordingService } from './ComplianceRecordingService';
import { CommunicationTimelineService } from './CommunicationTimelineService';

export interface CommunicationControllerConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  validation: {
    enableStrict: boolean;
    maxContentLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  features: {
    enableAnalytics: boolean;
    enableRecording: boolean;
    enableTimeline: boolean;
    enableRealTime: boolean;
  };
  security: {
    enableCors: boolean;
    allowedOrigins: string[];
    enableHelmet: boolean;
    requireAuth: boolean;
  };
}

export class CommunicationController {
  private app: express.Application;
  private communicationService: CommunicationService;
  private analyticsService?: CommunicationAnalyticsService;
  private recordingService?: ComplianceRecordingService;
  private timelineService?: CommunicationTimelineService;
  private config: CommunicationControllerConfig;

  constructor(
    communicationService: CommunicationService,
    analyticsService?: CommunicationAnalyticsService,
    recordingService?: ComplianceRecordingService,
    timelineService?: CommunicationTimelineService,
    config?: Partial<CommunicationControllerConfig>
  ) {
    this.app = express();
    this.communicationService = communicationService;
    this.analyticsService = analyticsService;
    this.recordingService = recordingService;
    this.timelineService = timelineService;
    
    this.config = {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        skipSuccessfulRequests: false,
        ...config?.rateLimiting
      },
      validation: {
        enableStrict: true,
        maxContentLength: 10000,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        ...config?.validation
      },
      features: {
        enableAnalytics: true,
        enableRecording: true,
        enableTimeline: true,
        enableRealTime: true,
        ...config?.features
      },
      security: {
        enableCors: true,
        allowedOrigins: ['http://localhost:3000'],
        enableHelmet: true,
        requireAuth: true,
        ...config?.security
      }
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    if (this.config.security.enableHelmet) {
      const helmet = require('helmet');
      this.app.use(helmet());
    }

    // CORS middleware
    if (this.config.security.enableCors) {
      const cors = require('cors');
      this.app.use(cors({
        origin: this.config.security.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
      }));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimiting.windowMs,
      max: this.config.rateLimiting.maxRequests,
      skipSuccessfulRequests: this.config.rateLimiting.skipSuccessfulRequests,
      message: {
        error: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
    this.app.use('/api/communication', limiter);

    // Tenant extraction middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      if (this.config.security.requireAuth && !tenantId) {
        return res.status(400).json({
          error: 'Tenant ID is required',
          code: 'MISSING_TENANT_ID'
        });
      }
      (req as any).tenantId = tenantId;
      next();
    });

    // Authentication middleware (mock implementation)
    if (this.config.security.requireAuth) {
      this.app.use('/api/communication', this.authenticateRequest);
    }
  }

  private authenticateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_AUTHORIZATION'
      });
    }

    // Mock token validation - replace with actual implementation
    const token = authHeader.substring(7);
    if (!token || token === 'invalid') {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Mock user context - replace with actual user data
    (req as any).user = {
      id: 'user_123',
      email: 'user@example.com',
      roles: ['client_manager'],
      permissions: ['read_communications', 'write_communications']
    };

    next();
  };

  private setupRoutes(): void {
    const router = express.Router();

    // Communication CRUD routes
    router.post('/communications', 
      this.validateCreateCommunication(),
      this.handleValidationErrors,
      this.createCommunication
    );

    router.get('/communications',
      this.validateGetCommunications(),
      this.handleValidationErrors,
      this.getCommunications
    );

    router.get('/communications/:id',
      this.validateGetCommunication(),
      this.handleValidationErrors,
      this.getCommunication
    );

    router.put('/communications/:id',
      this.validateUpdateCommunication(),
      this.handleValidationErrors,
      this.updateCommunication
    );

    router.delete('/communications/:id',
      this.validateDeleteCommunication(),
      this.handleValidationErrors,
      this.deleteCommunication
    );

    // Search and filtering routes
    router.post('/communications/search',
      this.validateSearchCommunications(),
      this.handleValidationErrors,
      this.searchCommunications
    );

    router.get('/communications/client/:clientId',
      this.validateGetClientCommunications(),
      this.handleValidationErrors,
      this.getClientCommunications
    );

    // Analytics routes (if enabled)
    if (this.config.features.enableAnalytics && this.analyticsService) {
      router.get('/analytics/metrics',
        this.validateGetMetrics(),
        this.handleValidationErrors,
        this.getCommunicationMetrics
      );

      router.get('/analytics/trends',
        this.validateGetTrends(),
        this.handleValidationErrors,
        this.getCommunicationTrends
      );

      router.get('/analytics/client-profile/:clientId',
        this.validateGetClientProfile(),
        this.handleValidationErrors,
        this.getClientCommunicationProfile
      );

      router.post('/analytics/reports',
        this.validateGenerateReport(),
        this.handleValidationErrors,
        this.generateCommunicationReport
      );

      router.get('/analytics/sentiment',
        this.validateGetSentiment(),
        this.handleValidationErrors,
        this.performSentimentAnalysis
      );

      router.get('/analytics/risk-factors/:clientId',
        this.validateGetRiskFactors(),
        this.handleValidationErrors,
        this.getClientRiskFactors
      );
    }

    // Recording routes (if enabled)
    if (this.config.features.enableRecording && this.recordingService) {
      router.post('/recording/sessions',
        this.validateStartRecording(),
        this.handleValidationErrors,
        this.startRecordingSession
      );

      router.patch('/recording/sessions/:sessionId/stop',
        this.validateStopRecording(),
        this.handleValidationErrors,
        this.stopRecordingSession
      );

      router.patch('/recording/sessions/:sessionId/pause',
        param('sessionId').isUUID(),
        this.handleValidationErrors,
        this.pauseRecording
      );

      router.patch('/recording/sessions/:sessionId/resume',
        param('sessionId').isUUID(),
        this.handleValidationErrors,
        this.resumeRecording
      );

      router.get('/recording/recordings',
        this.validateSearchRecordings(),
        this.handleValidationErrors,
        this.searchRecordings
      );

      router.post('/recording/policies',
        this.validateCreatePolicy(),
        this.handleValidationErrors,
        this.createCompliancePolicy
      );

      router.patch('/recording/recordings/:recordingId/retention',
        this.validateExtendRetention(),
        this.handleValidationErrors,
        this.extendRetentionPeriod
      );

      router.patch('/recording/recordings/:recordingId/legal-hold',
        this.validateLegalHold(),
        this.handleValidationErrors,
        this.placeRecordingOnLegalHold
      );

      router.post('/recording/audits',
        this.validatePerformAudit(),
        this.handleValidationErrors,
        this.performComplianceAudit
      );

      router.post('/recording/reports',
        this.validateGenerateComplianceReport(),
        this.handleValidationErrors,
        this.generateComplianceReport
      );
    }

    // Timeline routes (if enabled)
    if (this.config.features.enableTimeline && this.timelineService) {
      router.post('/timeline/entries',
        this.validateCreateTimelineEntry(),
        this.handleValidationErrors,
        this.addTimelineEntry
      );

      router.put('/timeline/entries/:entryId',
        this.validateUpdateTimelineEntry(),
        this.handleValidationErrors,
        this.updateTimelineEntry
      );

      router.delete('/timeline/entries/:entryId',
        this.validateDeleteTimelineEntry(),
        this.handleValidationErrors,
        this.deleteTimelineEntry
      );

      router.post('/timeline/views',
        this.validateCreateTimelineView(),
        this.handleValidationErrors,
        this.createTimelineView
      );

      router.get('/timeline/views/:viewId',
        param('viewId').isUUID(),
        this.handleValidationErrors,
        this.getTimelineView
      );

      router.post('/timeline/templates',
        this.validateCreateTimelineTemplate(),
        this.handleValidationErrors,
        this.createTimelineTemplate
      );

      router.post('/timeline/templates/:templateId/apply',
        this.validateApplyTemplate(),
        this.handleValidationErrors,
        this.applyTemplate
      );

      router.post('/timeline/search',
        this.validateSearchTimeline(),
        this.handleValidationErrors,
        this.searchTimeline
      );

      router.post('/timeline/views/:viewId/export',
        this.validateExportTimeline(),
        this.handleValidationErrors,
        this.exportTimeline
      );

      router.get('/timeline/insights/:clientId',
        param('clientId').isUUID(),
        this.handleValidationErrors,
        this.generatePredictiveInsights
      );
    }

    // Health check and system routes
    router.get('/health', this.healthCheck);
    router.get('/metrics', this.getSystemMetrics);

    this.app.use('/api/communication', router);
  }

  // Validation middleware methods
  private validateCreateCommunication() {
    return [
      body('type').isIn(['email', 'phone', 'sms', 'chat', 'meeting', 'document', 'note']),
      body('channel').isIn(['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'portal']),
      body('direction').isIn(['inbound', 'outbound', 'internal']),
      body('subject').isLength({ min: 1, max: 200 }),
      body('content').optional().isLength({ max: this.config.validation.maxContentLength }),
      body('clientId').isUUID(),
      body('employeeId').isUUID(),
      body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
      body('scheduledFor').optional().isISO8601(),
      body('participants').optional().isArray(),
      body('attachments').optional().isArray(),
      body('tags').optional().isArray(),
      body('categories').optional().isArray()
    ];
  }

  private validateGetCommunications() {
    return [
      query('clientId').optional().isUUID(),
      query('employeeId').optional().isUUID(),
      query('type').optional().isIn(['email', 'phone', 'sms', 'chat', 'meeting', 'document', 'note']),
      query('channel').optional().isIn(['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'portal']),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
      query('offset').optional().isInt({ min: 0 }).toInt(),
      query('sortBy').optional().isIn(['createdAt', 'scheduledFor', 'priority', 'type']),
      query('sortOrder').optional().isIn(['asc', 'desc'])
    ];
  }

  private validateGetCommunication() {
    return [
      param('id').isUUID()
    ];
  }

  private validateUpdateCommunication() {
    return [
      param('id').isUUID(),
      body('status').optional().isIn(['scheduled', 'sent', 'delivered', 'read', 'replied', 'failed', 'cancelled']),
      body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
      body('scheduledFor').optional().isISO8601(),
      body('content').optional().isLength({ max: this.config.validation.maxContentLength }),
      body('tags').optional().isArray(),
      body('categories').optional().isArray()
    ];
  }

  private validateDeleteCommunication() {
    return [
      param('id').isUUID(),
      body('reason').isLength({ min: 1, max: 500 })
    ];
  }

  private validateSearchCommunications() {
    return [
      body('query').optional().isLength({ min: 1, max: 500 }),
      body('filters').optional().isObject(),
      body('dateRange').optional().isObject(),
      body('sortBy').optional().isIn(['relevance', 'date', 'priority']),
      body('limit').optional().isInt({ min: 1, max: 1000 }),
      body('offset').optional().isInt({ min: 0 })
    ];
  }

  private validateGetClientCommunications() {
    return [
      param('clientId').isUUID(),
      query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
      query('offset').optional().isInt({ min: 0 }).toInt()
    ];
  }

  // Analytics validation methods
  private validateGetMetrics() {
    return [
      query('startDate').isISO8601(),
      query('endDate').isISO8601(),
      query('clientIds').optional().isArray(),
      query('channels').optional().isArray(),
      query('types').optional().isArray()
    ];
  }

  private validateGetTrends() {
    return [
      query('startDate').isISO8601(),
      query('endDate').isISO8601(),
      query('periodType').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    ];
  }

  private validateGetClientProfile() {
    return [
      param('clientId').isUUID()
    ];
  }

  private validateGenerateReport() {
    return [
      body('reportType').isIn(['summary', 'detailed', 'compliance', 'performance', 'client_analysis']),
      body('startDate').isISO8601(),
      body('endDate').isISO8601(),
      body('options').optional().isObject()
    ];
  }

  private validateGetSentiment() {
    return [
      query('communicationIds').isArray(),
      query('includeEmotions').optional().isBoolean(),
      query('includeTopics').optional().isBoolean()
    ];
  }

  private validateGetRiskFactors() {
    return [
      param('clientId').isUUID()
    ];
  }

  // Recording validation methods
  private validateStartRecording() {
    return [
      body('communicationId').isUUID(),
      body('sessionType').isIn(['phone', 'video', 'screen_share', 'meeting', 'webinar']),
      body('participants').isArray({ min: 1 })
    ];
  }

  private validateStopRecording() {
    return [
      param('sessionId').isUUID(),
      body('reason').optional().isLength({ max: 500 })
    ];
  }

  private validateSearchRecordings() {
    return [
      query('clientIds').optional().isArray(),
      query('employeeIds').optional().isArray(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('recordingTypes').optional().isArray(),
      query('limit').optional().isInt({ min: 1, max: 1000 }),
      query('offset').optional().isInt({ min: 0 })
    ];
  }

  private validateCreatePolicy() {
    return [
      body('name').isLength({ min: 1, max: 200 }),
      body('description').isLength({ min: 1, max: 1000 }),
      body('scope').isObject(),
      body('recordingRules').isObject(),
      body('retentionRules').isObject()
    ];
  }

  private validateExtendRetention() {
    return [
      param('recordingId').isUUID(),
      body('additionalDays').isInt({ min: 1, max: 3650 }),
      body('reason').isLength({ min: 1, max: 500 }),
      body('requestedBy').isUUID()
    ];
  }

  private validateLegalHold() {
    return [
      param('recordingId').isUUID(),
      body('reason').isLength({ min: 1, max: 500 }),
      body('requestedBy').isUUID()
    ];
  }

  private validatePerformAudit() {
    return [
      body('auditType').isIn(['scheduled', 'random', 'triggered', 'investigation']),
      body('scope').isObject()
    ];
  }

  private validateGenerateComplianceReport() {
    return [
      body('reportType').isIn(['audit', 'retention', 'access', 'quality', 'comprehensive']),
      body('startDate').isISO8601(),
      body('endDate').isISO8601(),
      body('options').optional().isObject()
    ];
  }

  // Timeline validation methods
  private validateCreateTimelineEntry() {
    return [
      body('communicationId').isUUID(),
      body('clientId').isUUID(),
      body('employeeId').isUUID(),
      body('timestamp').isISO8601(),
      body('entryType').isIn(['communication', 'task', 'milestone', 'note', 'document', 'meeting', 'follow_up', 'system_event']),
      body('channel').isIn(['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'system', 'portal']),
      body('subject').isLength({ min: 1, max: 200 }),
      body('summary').isLength({ min: 1, max: 1000 })
    ];
  }

  private validateUpdateTimelineEntry() {
    return [
      param('entryId').isUUID(),
      body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'pending', 'in_progress', 'failed']),
      body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
    ];
  }

  private validateDeleteTimelineEntry() {
    return [
      param('entryId').isUUID(),
      body('reason').isLength({ min: 1, max: 500 }),
      body('deletedBy').isUUID()
    ];
  }

  private validateCreateTimelineView() {
    return [
      body('clientId').isUUID(),
      body('viewType').isIn(['chronological', 'grouped', 'filtered', 'summary', 'interactive']),
      body('dateRange').isObject(),
      body('filters').optional().isObject()
    ];
  }

  private validateCreateTimelineTemplate() {
    return [
      body('name').isLength({ min: 1, max: 200 }),
      body('description').isLength({ min: 1, max: 1000 }),
      body('templateType').isIn(['client_onboarding', 'project_management', 'issue_resolution', 'compliance_review', 'custom']),
      body('structure').isObject()
    ];
  }

  private validateApplyTemplate() {
    return [
      param('templateId').isUUID(),
      body('clientId').isUUID(),
      body('startDate').isISO8601(),
      body('customizations').optional().isObject()
    ];
  }

  private validateSearchTimeline() {
    return [
      body('searchCriteria').isObject(),
      body('options').optional().isObject()
    ];
  }

  private validateExportTimeline() {
    return [
      param('viewId').isUUID(),
      body('exportFormat').isIn(['pdf', 'excel', 'json', 'csv', 'html']),
      body('options').optional().isObject()
    ];
  }

  private handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }
    next();
  };

  // Route handler methods
  private createCommunication = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const communicationData = { ...req.body, tenantId };
      
      const communication = await this.communicationService.createCommunication(communicationData);
      
      res.status(201).json({
        success: true,
        data: communication,
        message: 'Communication created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to create communication',
        code: 'COMMUNICATION_CREATE_FAILED',
        details: error.message
      });
    }
  };

  private getCommunications = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const filters = { ...req.query, tenantId };
      
      const result = await this.communicationService.getCommunications(filters);
      
      res.json({
        success: true,
        data: result.communications,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore
        }
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve communications',
        code: 'COMMUNICATION_FETCH_FAILED',
        details: error.message
      });
    }
  };

  private getCommunication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = (req as any).tenantId;
      
      const communication = await this.communicationService.getCommunicationById(id, tenantId);
      
      if (!communication) {
        return res.status(404).json({
          error: 'Communication not found',
          code: 'COMMUNICATION_NOT_FOUND'
        });
      }
      
      res.json({
        success: true,
        data: communication
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve communication',
        code: 'COMMUNICATION_FETCH_FAILED',
        details: error.message
      });
    }
  };

  private updateCommunication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = (req as any).tenantId;
      const updates = req.body;
      
      const communication = await this.communicationService.updateCommunication(id, updates, tenantId);
      
      res.json({
        success: true,
        data: communication,
        message: 'Communication updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to update communication',
        code: 'COMMUNICATION_UPDATE_FAILED',
        details: error.message
      });
    }
  };

  private deleteCommunication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user.id;
      
      await this.communicationService.deleteCommunication(id, reason, userId, tenantId);
      
      res.json({
        success: true,
        message: 'Communication deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to delete communication',
        code: 'COMMUNICATION_DELETE_FAILED',
        details: error.message
      });
    }
  };

  private searchCommunications = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const { query, filters, dateRange, sortBy, limit, offset } = req.body;
      
      const result = await this.communicationService.searchCommunications(
        tenantId,
        query,
        { ...filters, dateRange },
        { sortBy, limit, offset }
      );
      
      res.json({
        success: true,
        data: result.communications,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore
        },
        facets: result.facets
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to search communications',
        code: 'COMMUNICATION_SEARCH_FAILED',
        details: error.message
      });
    }
  };

  private getClientCommunications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;
      const tenantId = (req as any).tenantId;
      const { limit, offset } = req.query;
      
      const result = await this.communicationService.getClientCommunications(
        clientId,
        tenantId,
        { limit: limit as number, offset: offset as number }
      );
      
      res.json({
        success: true,
        data: result.communications,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore
        }
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve client communications',
        code: 'CLIENT_COMMUNICATIONS_FETCH_FAILED',
        details: error.message
      });
    }
  };

  // Analytics route handlers
  private getCommunicationMetrics = async (req: Request, res: Response): Promise<void> => {
    if (!this.analyticsService) {
      return res.status(501).json({
        error: 'Analytics service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const { startDate, endDate, clientIds, channels, types } = req.query;
      
      const metrics = await this.analyticsService.calculateCommunicationMetrics(
        tenantId,
        { start: new Date(startDate as string), end: new Date(endDate as string) },
        { 
          channels: channels as string[], 
          types: types as string[], 
          clientIds: clientIds as string[] 
        }
      );
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve communication metrics',
        code: 'METRICS_FETCH_FAILED',
        details: error.message
      });
    }
  };

  private getCommunicationTrends = async (req: Request, res: Response): Promise<void> => {
    if (!this.analyticsService) {
      return res.status(501).json({
        error: 'Analytics service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const { startDate, endDate, periodType } = req.query;
      
      const trends = await this.analyticsService.generateCommunicationTrends(
        tenantId,
        {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
          type: periodType as any
        }
      );
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve communication trends',
        code: 'TRENDS_FETCH_FAILED',
        details: error.message
      });
    }
  };

  private getClientCommunicationProfile = async (req: Request, res: Response): Promise<void> => {
    if (!this.analyticsService) {
      return res.status(501).json({
        error: 'Analytics service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { clientId } = req.params;
      const tenantId = (req as any).tenantId;
      
      const profile = await this.analyticsService.generateClientCommunicationProfile(
        clientId,
        tenantId
      );
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve client communication profile',
        code: 'CLIENT_PROFILE_FETCH_FAILED',
        details: error.message
      });
    }
  };

  private generateCommunicationReport = async (req: Request, res: Response): Promise<void> => {
    if (!this.analyticsService) {
      return res.status(501).json({
        error: 'Analytics service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const { reportType, startDate, endDate, options } = req.body;
      
      const report = await this.analyticsService.generateCommunicationReport(
        tenantId,
        reportType,
        { start: new Date(startDate), end: new Date(endDate) },
        options
      );
      
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate communication report',
        code: 'REPORT_GENERATION_FAILED',
        details: error.message
      });
    }
  };

  private performSentimentAnalysis = async (req: Request, res: Response): Promise<void> => {
    if (!this.analyticsService) {
      return res.status(501).json({
        error: 'Analytics service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { communicationIds, includeEmotions, includeTopics } = req.query;
      
      // Mock communication data - replace with actual service call
      const communications = []; // await this.communicationService.getCommunicationsByIds(communicationIds);
      
      const sentimentResults = await this.analyticsService.performSentimentAnalysis(
        communications,
        { includeEmotions: includeEmotions === 'true', includeTopics: includeTopics === 'true' }
      );
      
      res.json({
        success: true,
        data: sentimentResults
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to perform sentiment analysis',
        code: 'SENTIMENT_ANALYSIS_FAILED',
        details: error.message
      });
    }
  };

  private getClientRiskFactors = async (req: Request, res: Response): Promise<void> => {
    if (!this.analyticsService) {
      return res.status(501).json({
        error: 'Analytics service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { clientId } = req.params;
      const tenantId = (req as any).tenantId;
      
      const riskFactors = await this.analyticsService.identifyClientRiskFactors(
        clientId,
        tenantId
      );
      
      res.json({
        success: true,
        data: riskFactors
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve client risk factors',
        code: 'RISK_FACTORS_FETCH_FAILED',
        details: error.message
      });
    }
  };

  // Recording route handlers
  private startRecordingSession = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const { communicationId, sessionType, participants } = req.body;
      
      const session = await this.recordingService.startRecordingSession(
        communicationId,
        tenantId,
        sessionType,
        participants
      );
      
      res.status(201).json({
        success: true,
        data: session,
        message: 'Recording session started successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to start recording session',
        code: 'RECORDING_START_FAILED',
        details: error.message
      });
    }
  };

  private stopRecordingSession = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      
      const recording = await this.recordingService.stopRecordingSession(sessionId, reason);
      
      res.json({
        success: true,
        data: recording,
        message: 'Recording session stopped successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to stop recording session',
        code: 'RECORDING_STOP_FAILED',
        details: error.message
      });
    }
  };

  private pauseRecording = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { sessionId } = req.params;
      
      await this.recordingService.pauseRecording(sessionId);
      
      res.json({
        success: true,
        message: 'Recording paused successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to pause recording',
        code: 'RECORDING_PAUSE_FAILED',
        details: error.message
      });
    }
  };

  private resumeRecording = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { sessionId } = req.params;
      
      await this.recordingService.resumeRecording(sessionId);
      
      res.json({
        success: true,
        message: 'Recording resumed successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to resume recording',
        code: 'RECORDING_RESUME_FAILED',
        details: error.message
      });
    }
  };

  private searchRecordings = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const criteria = { ...req.query, tenantId };
      
      const recordings = await this.recordingService.searchRecordings(tenantId, criteria);
      
      res.json({
        success: true,
        data: recordings
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to search recordings',
        code: 'RECORDING_SEARCH_FAILED',
        details: error.message
      });
    }
  };

  private createCompliancePolicy = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const policyData = req.body;
      
      const policy = await this.recordingService.createCompliancePolicy(tenantId, policyData);
      
      res.status(201).json({
        success: true,
        data: policy,
        message: 'Compliance policy created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to create compliance policy',
        code: 'POLICY_CREATE_FAILED',
        details: error.message
      });
    }
  };

  private extendRetentionPeriod = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { recordingId } = req.params;
      const { additionalDays, reason, requestedBy } = req.body;
      
      await this.recordingService.extendRetentionPeriod(
        recordingId,
        additionalDays,
        reason,
        requestedBy
      );
      
      res.json({
        success: true,
        message: 'Retention period extended successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to extend retention period',
        code: 'RETENTION_EXTEND_FAILED',
        details: error.message
      });
    }
  };

  private placeRecordingOnLegalHold = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { recordingId } = req.params;
      const { reason, requestedBy } = req.body;
      
      await this.recordingService.placeRecordingOnLegalHold(
        recordingId,
        reason,
        requestedBy
      );
      
      res.json({
        success: true,
        message: 'Recording placed on legal hold successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to place recording on legal hold',
        code: 'LEGAL_HOLD_FAILED',
        details: error.message
      });
    }
  };

  private performComplianceAudit = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const { auditType, scope } = req.body;
      
      const audit = await this.recordingService.performComplianceAudit(
        tenantId,
        auditType,
        scope
      );
      
      res.status(201).json({
        success: true,
        data: audit,
        message: 'Compliance audit completed successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to perform compliance audit',
        code: 'AUDIT_FAILED',
        details: error.message
      });
    }
  };

  private generateComplianceReport = async (req: Request, res: Response): Promise<void> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const { reportType, startDate, endDate, options } = req.body;
      
      const report = await this.recordingService.generateComplianceReport(
        tenantId,
        reportType,
        { start: new Date(startDate), end: new Date(endDate) },
        options
      );
      
      res.json({
        success: true,
        data: report,
        message: 'Compliance report generated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate compliance report',
        code: 'COMPLIANCE_REPORT_FAILED',
        details: error.message
      });
    }
  };

  // Timeline route handlers
  private addTimelineEntry = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const entryData = { ...req.body, tenantId };
      
      const entry = await this.timelineService.addTimelineEntry(entryData);
      
      res.status(201).json({
        success: true,
        data: entry,
        message: 'Timeline entry added successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to add timeline entry',
        code: 'TIMELINE_ENTRY_CREATE_FAILED',
        details: error.message
      });
    }
  };

  private updateTimelineEntry = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { entryId } = req.params;
      const updates = req.body;
      
      const entry = await this.timelineService.updateTimelineEntry(entryId, updates);
      
      res.json({
        success: true,
        data: entry,
        message: 'Timeline entry updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to update timeline entry',
        code: 'TIMELINE_ENTRY_UPDATE_FAILED',
        details: error.message
      });
    }
  };

  private deleteTimelineEntry = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { entryId } = req.params;
      const { reason, deletedBy } = req.body;
      
      await this.timelineService.deleteTimelineEntry(entryId, reason, deletedBy);
      
      res.json({
        success: true,
        message: 'Timeline entry deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to delete timeline entry',
        code: 'TIMELINE_ENTRY_DELETE_FAILED',
        details: error.message
      });
    }
  };

  private createTimelineView = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { clientId, ...viewConfig } = req.body;
      const tenantId = (req as any).tenantId;
      
      const view = await this.timelineService.createTimelineView(
        clientId,
        tenantId,
        viewConfig
      );
      
      res.status(201).json({
        success: true,
        data: view,
        message: 'Timeline view created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to create timeline view',
        code: 'TIMELINE_VIEW_CREATE_FAILED',
        details: error.message
      });
    }
  };

  private getTimelineView = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { viewId } = req.params;
      
      const view = await this.timelineService.getTimelineView(viewId);
      
      res.json({
        success: true,
        data: view
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve timeline view',
        code: 'TIMELINE_VIEW_FETCH_FAILED',
        details: error.message
      });
    }
  };

  private createTimelineTemplate = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const templateData = req.body;
      
      const template = await this.timelineService.createTimelineTemplate(
        tenantId,
        templateData
      );
      
      res.status(201).json({
        success: true,
        data: template,
        message: 'Timeline template created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to create timeline template',
        code: 'TIMELINE_TEMPLATE_CREATE_FAILED',
        details: error.message
      });
    }
  };

  private applyTemplate = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { templateId } = req.params;
      const { clientId, startDate, customizations } = req.body;
      
      const result = await this.timelineService.applyTemplate(
        templateId,
        clientId,
        new Date(startDate),
        customizations
      );
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Timeline template applied successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to apply timeline template',
        code: 'TIMELINE_TEMPLATE_APPLY_FAILED',
        details: error.message
      });
    }
  };

  private searchTimeline = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const { searchCriteria, options } = req.body;
      
      const result = await this.timelineService.searchTimeline(
        tenantId,
        searchCriteria,
        options
      );
      
      res.json({
        success: true,
        data: result.entries,
        pagination: {
          total: result.totalCount,
          limit: options?.limit || 50,
          offset: options?.offset || 0
        },
        facets: result.facets
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to search timeline',
        code: 'TIMELINE_SEARCH_FAILED',
        details: error.message
      });
    }
  };

  private exportTimeline = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { viewId } = req.params;
      const { exportFormat, options } = req.body;
      
      const result = await this.timelineService.exportTimeline(
        viewId,
        exportFormat,
        options
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Timeline export initiated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to export timeline',
        code: 'TIMELINE_EXPORT_FAILED',
        details: error.message
      });
    }
  };

  private generatePredictiveInsights = async (req: Request, res: Response): Promise<void> => {
    if (!this.timelineService) {
      return res.status(501).json({
        error: 'Timeline service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { clientId } = req.params;
      const tenantId = (req as any).tenantId;
      
      const insights = await this.timelineService.generatePredictiveInsights(
        clientId,
        tenantId
      );
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate predictive insights',
        code: 'INSIGHTS_GENERATION_FAILED',
        details: error.message
      });
    }
  };

  // System route handlers
  private healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          communication: this.communicationService ? 'available' : 'unavailable',
          analytics: this.analyticsService ? 'available' : 'unavailable',
          recording: this.recordingService ? 'available' : 'unavailable',
          timeline: this.timelineService ? 'available' : 'unavailable'
        },
        features: this.config.features
      };
      
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  };

  private getSystemMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve system metrics',
        code: 'SYSTEM_METRICS_FAILED',
        details: error.message
      });
    }
  };

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        message: this.config.validation.enableStrict ? 'An unexpected error occurred' : error.message
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.originalUrl
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  async shutdown(): Promise<void> {
    // Graceful shutdown logic
    console.log('Shutting down Communication Controller...');
    
    if (this.analyticsService) {
      await this.analyticsService.shutdown();
    }
    
    if (this.recordingService) {
      await this.recordingService.shutdown();
    }
    
    if (this.timelineService) {
      await this.timelineService.shutdown();
    }
    
    console.log('Communication Controller shutdown complete');
  }
}
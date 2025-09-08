import express, { Request, Response, NextFunction } from 'express';
const { body, query, param, validationResult } = require('express-validator');

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}
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
    this.app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

  private authenticateRequest = (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
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
      this.validateCreateCommunication() as any,
      this.handleValidationErrors,
      this.createCommunication
    );

    router.get('/communications',
      this.validateGetCommunications() as any,
      this.handleValidationErrors,
      this.getCommunications
    );

    router.get('/communications/:id',
      this.validateGetCommunication() as any,
      this.handleValidationErrors,
      this.getCommunication
    );

    router.put('/communications/:id',
      this.validateUpdateCommunication() as any,
      this.handleValidationErrors,
      this.updateCommunication
    );

    router.delete('/communications/:id',
      this.validateDeleteCommunication() as any,
      this.handleValidationErrors,
      this.deleteCommunication
    );

    // Search and filtering routes
    router.post('/communications/search',
      this.validateSearchCommunications() as any,
      this.handleValidationErrors,
      this.searchCommunications
    );

    router.get('/communications/client/:clientId',
      this.validateGetClientCommunications() as any,
      this.handleValidationErrors,
      this.getClientCommunications
    );

    // Analytics routes (if enabled)
    if (this.config.features.enableAnalytics && this.analyticsService) {
      router.get('/analytics/metrics',
        this.validateGetMetrics() as any,
        this.handleValidationErrors,
        this.getCommunicationMetrics
      );

      router.get('/analytics/trends',
        this.validateGetTrends() as any,
        this.handleValidationErrors,
        this.getCommunicationTrends
      );

      router.get('/analytics/client-profile/:clientId',
        this.validateGetClientProfile() as any,
        this.handleValidationErrors,
        this.getClientCommunicationProfile
      );

      router.post('/analytics/reports',
        this.validateGenerateReport() as any,
        this.handleValidationErrors,
        this.generateCommunicationReport
      );

      router.get('/analytics/sentiment',
        this.validateGetSentiment() as any,
        this.handleValidationErrors,
        this.performSentimentAnalysis
      );

      router.get('/analytics/risk-factors/:clientId',
        this.validateGetRiskFactors() as any,
        this.handleValidationErrors,
        this.getClientRiskFactors
      );
    }

    // Recording routes (if enabled)
    if (this.config.features.enableRecording && this.recordingService) {
      router.post('/recording/sessions',
        this.validateStartRecording() as any,
        this.handleValidationErrors,
        this.startRecordingSession
      );

      router.patch('/recording/sessions/:sessionId/stop',
        this.validateStopRecording() as any,
        this.handleValidationErrors,
        this.stopRecordingSession
      );

      router.patch('/recording/sessions/:sessionId/pause',
              param('sessionId').isUUID() as any,
        this.handleValidationErrors,
        this.pauseRecording
      );

      router.patch('/recording/sessions/:sessionId/resume',
              param('sessionId').isUUID() as any,
        this.handleValidationErrors,
        this.resumeRecording
      );

      router.get('/recording/recordings',
        this.validateSearchRecordings() as any,
        this.handleValidationErrors,
        this.searchRecordings
      );

      router.post('/recording/policies',
        this.validateCreatePolicy() as any,
        this.handleValidationErrors,
        this.createCompliancePolicy
      );

      router.patch('/recording/recordings/:recordingId/retention',
        this.validateExtendRetention() as any,
        this.handleValidationErrors,
        this.extendRetentionPeriod
      );

      router.patch('/recording/recordings/:recordingId/legal-hold',
        this.validateLegalHold() as any,
        this.handleValidationErrors,
        this.placeRecordingOnLegalHold
      );

      router.post('/recording/audits',
        this.validatePerformAudit() as any,
        this.handleValidationErrors,
        this.performComplianceAudit
      );

      router.post('/recording/reports',
        this.validateGenerateComplianceReport() as any,
        this.handleValidationErrors,
        this.generateComplianceReport
      );
    }

    // Timeline routes (if enabled)
    if (this.config.features.enableTimeline && this.timelineService) {
      router.post('/timeline/entries',
        this.validateCreateTimelineEntry() as any,
        this.handleValidationErrors,
        this.addTimelineEntry
      );

      router.put('/timeline/entries/:entryId',
        this.validateUpdateTimelineEntry() as any,
        this.handleValidationErrors,
        this.updateTimelineEntry
      );

      router.delete('/timeline/entries/:entryId',
        this.validateDeleteTimelineEntry() as any,
        this.handleValidationErrors,
        this.deleteTimelineEntry
      );

      router.post('/timeline/views',
        this.validateCreateTimelineView() as any,
        this.handleValidationErrors,
        this.createTimelineView
      );

      router.get('/timeline/views/:viewId',
        param('viewId').isUUID() as any,
        this.handleValidationErrors,
        this.getTimelineView
      );

      router.post('/timeline/templates',
        this.validateCreateTimelineTemplate() as any,
        this.handleValidationErrors,
        this.createTimelineTemplate
      );

      router.post('/timeline/templates/:templateId/apply',
        this.validateApplyTemplate() as any,
        this.handleValidationErrors,
        this.applyTemplate
      );

      router.post('/timeline/search',
        this.validateSearchTimeline() as any,
        this.handleValidationErrors,
        this.searchTimeline
      );

      router.post('/timeline/views/:viewId/export',
        this.validateExportTimeline() as any,
        this.handleValidationErrors,
        this.exportTimeline
      );

      router.get('/timeline/insights/:clientId',
              param('clientId').isUUID() as any,
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
      body('type').isIn(['email', 'phone', 'sms', 'chat', 'meeting', 'document', 'note']) as any,
      body('channel').isIn(['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'portal']) as any,
      body('direction').isIn(['inbound', 'outbound', 'internal']) as any,
      body('subject').isLength({ min: 1, max: 200 }) as any,
      body('content').optional().isLength({ max: this.config.validation.maxContentLength }) as any,
      body('clientId').isUUID() as any,
      body('employeeId').isUUID() as any,
      body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']) as any,
      body('scheduledFor').optional().isISO8601() as any,
      body('participants').optional().isArray() as any,
      body('attachments').optional().isArray() as any,
      body('tags').optional().isArray() as any,
      body('categories').optional().isArray() as any
    ];
  }

  private validateGetCommunications() {
    return [
      query('clientId').optional().isUUID() as any,
      query('employeeId').optional().isUUID() as any,
      query('type').optional().isIn(['email', 'phone', 'sms', 'chat', 'meeting', 'document', 'note']) as any,
      query('channel').optional().isIn(['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'portal']) as any,
      query('startDate').optional().isISO8601() as any,
      query('endDate').optional().isISO8601() as any,
      query('limit').optional().isInt({ min: 1, max: 1000 }).toInt() as any,
      query('offset').optional().isInt({ min: 0 }).toInt() as any,
      query('sortBy').optional().isIn(['createdAt', 'scheduledFor', 'priority', 'type']) as any,
      query('sortOrder').optional().isIn(['asc', 'desc']) as any
    ];
  }

  private validateGetCommunication() {
    return [
      param('id').isUUID() as any
    ];
  }

  private validateUpdateCommunication() {
    return [
      param('id').isUUID() as any,
      body('status').optional().isIn(['scheduled', 'sent', 'delivered', 'read', 'replied', 'failed', 'cancelled']) as any,
      body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']) as any,
      body('scheduledFor').optional().isISO8601() as any,
      body('content').optional().isLength({ max: this.config.validation.maxContentLength }) as any,
      body('tags').optional().isArray() as any,
      body('categories').optional().isArray() as any
    ];
  }

  private validateDeleteCommunication() {
    return [
      param('id').isUUID() as any,
      body('reason').isLength({ min: 1, max: 500 }) as any
    ];
  }

  private validateSearchCommunications() {
    return [
      body('query').optional().isLength({ min: 1, max: 500 }) as any,
      body('filters').optional().isObject() as any,
      body('dateRange').optional().isObject() as any,
      body('sortBy').optional().isIn(['relevance', 'date', 'priority']) as any,
      body('limit').optional().isInt({ min: 1, max: 1000 }) as any,
      body('offset').optional().isInt({ min: 0 }) as any
    ];
  }

  private validateGetClientCommunications() {
    return [
      param('clientId').isUUID() as any,
      query('limit').optional().isInt({ min: 1, max: 1000 }).toInt() as any,
      query('offset').optional().isInt({ min: 0 }).toInt() as any
    ];
  }

  // Analytics validation methods
  private validateGetMetrics() {
    return [
      query('startDate').isISO8601() as any,
      query('endDate').isISO8601() as any,
      query('clientIds').optional().isArray() as any,
      query('channels').optional().isArray() as any,
      query('types').optional().isArray() as any
    ];
  }

  private validateGetTrends() {
    return [
      query('startDate').isISO8601() as any,
      query('endDate').isISO8601() as any,
      query('periodType').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']) as any
    ];
  }

  private validateGetClientProfile() {
    return [
      param('clientId').isUUID() as any
    ];
  }

  private validateGenerateReport() {
    return [
      body('reportType').isIn(['summary', 'detailed', 'compliance', 'performance', 'client_analysis']) as any,
      body('startDate').isISO8601() as any,
      body('endDate').isISO8601() as any,
      body('options').optional().isObject() as any
    ];
  }

  private validateGetSentiment() {
    return [
      query('communicationIds').isArray() as any,
      query('includeEmotions').optional().isBoolean() as any,
      query('includeTopics').optional().isBoolean() as any
    ];
  }

  private validateGetRiskFactors() {
    return [
      param('clientId').isUUID() as any
    ];
  }

  // Recording validation methods
  private validateStartRecording() {
    return [
      body('communicationId').isUUID() as any,
      body('sessionType').isIn(['phone', 'video', 'screen_share', 'meeting', 'webinar']) as any,
      body('participants').isArray({ min: 1 }) as any
    ];
  }

  private validateStopRecording() {
    return [
      param('sessionId').isUUID() as any,
      body('reason').optional().isLength({ max: 500 }) as any
    ];
  }

  private validateSearchRecordings() {
    return [
      query('clientIds').optional().isArray() as any,
      query('employeeIds').optional().isArray() as any,
      query('startDate').optional().isISO8601() as any,
      query('endDate').optional().isISO8601() as any,
      query('recordingTypes').optional().isArray() as any,
      query('limit').optional().isInt({ min: 1, max: 1000 }) as any,
      query('offset').optional().isInt({ min: 0 }) as any
    ];
  }

  private validateCreatePolicy() {
    return [
      body('name').isLength({ min: 1, max: 200 }) as any,
      body('description').isLength({ min: 1, max: 1000 }) as any,
      body('scope').isObject() as any,
      body('recordingRules').isObject() as any,
      body('retentionRules').isObject() as any
    ];
  }

  private validateExtendRetention() {
    return [
      param('recordingId').isUUID() as any,
      body('additionalDays').isInt({ min: 1, max: 3650 }) as any,
      body('reason').isLength({ min: 1, max: 500 }) as any,
      body('requestedBy').isUUID() as any
    ];
  }

  private validateLegalHold() {
    return [
      param('recordingId').isUUID() as any,
      body('reason').isLength({ min: 1, max: 500 }) as any,
      body('requestedBy').isUUID() as any
    ];
  }

  private validatePerformAudit() {
    return [
      body('auditType').isIn(['scheduled', 'random', 'triggered', 'investigation']) as any,
      body('scope').isObject() as any
    ];
  }

  private validateGenerateComplianceReport() {
    return [
      body('reportType').isIn(['audit', 'retention', 'access', 'quality', 'comprehensive']) as any,
      body('startDate').isISO8601() as any,
      body('endDate').isISO8601() as any,
      body('options').optional().isObject() as any
    ];
  }

  // Timeline validation methods
  private validateCreateTimelineEntry() {
    return [
      body('communicationId').isUUID() as any,
      body('clientId').isUUID() as any,
      body('employeeId').isUUID() as any,
      body('timestamp').isISO8601() as any,
      body('entryType').isIn(['communication', 'task', 'milestone', 'note', 'document', 'meeting', 'follow_up', 'system_event']) as any,
      body('channel').isIn(['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'system', 'portal']) as any,
      body('subject').isLength({ min: 1, max: 200 }) as any,
      body('summary').isLength({ min: 1, max: 1000 }) as any
    ];
  }

  private validateUpdateTimelineEntry() {
    return [
      param('entryId').isUUID() as any,
      body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'pending', 'in_progress', 'failed']) as any,
      body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']) as any
    ];
  }

  private validateDeleteTimelineEntry() {
    return [
      param('entryId').isUUID() as any,
      body('reason').isLength({ min: 1, max: 500 }) as any,
      body('deletedBy').isUUID() as any
    ];
  }

  private validateCreateTimelineView() {
    return [
      body('clientId').isUUID() as any,
      body('viewType').isIn(['chronological', 'grouped', 'filtered', 'summary', 'interactive']) as any,
      body('dateRange').isObject() as any,
      body('filters').optional().isObject() as any
    ];
  }

  private validateCreateTimelineTemplate() {
    return [
      body('name').isLength({ min: 1, max: 200 }) as any,
      body('description').isLength({ min: 1, max: 1000 }) as any,
      body('templateType').isIn(['client_onboarding', 'project_management', 'issue_resolution', 'compliance_review', 'custom']) as any,
      body('structure').isObject() as any
    ];
  }

  private validateApplyTemplate() {
    return [
      param('templateId').isUUID() as any,
      body('clientId').isUUID() as any,
      body('startDate').isISO8601() as any,
      body('customizations').optional().isObject() as any
    ];
  }

  private validateSearchTimeline() {
    return [
      body('searchCriteria').isObject() as any,
      body('options').optional().isObject() as any
    ];
  }

  private validateExportTimeline() {
    return [
      param('viewId').isUUID() as any,
      body('exportFormat').isIn(['pdf', 'excel', 'json', 'csv', 'html']) as any,
      body('options').optional().isObject() as any
    ];
  }

  private handleValidationErrors = (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
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
  private createCommunication = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private getCommunications = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private getCommunication = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private updateCommunication = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private deleteCommunication = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private searchCommunications = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private getClientCommunications = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { clientId } = req.params;
      const tenantId = (req as any).tenantId;
      const { limit, offset } = req.query;
      
      const result = await this.communicationService.getClientCommunications(
        clientId,
        tenantId,
        { limit: limit as unknown as number, offset: offset as unknown as number }
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
  private getCommunicationMetrics = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private getCommunicationTrends = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
          type: periodType as any,
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

  private getClientCommunicationProfile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private generateCommunicationReport = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private performSentimentAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    if (!this.analyticsService) {
      return res.status(501).json({
        error: 'Analytics service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const { communicationIds, includeEmotions, includeTopics } = req.query;
      
      // Mock communication data - replace with actual service call
      const communications: any[] = []; // await this.communicationService.getCommunicationsByIds(communicationIds);
      
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

  private getClientRiskFactors = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
  private startRecordingSession = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private stopRecordingSession = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private pauseRecording = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private resumeRecording = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private searchRecordings = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    if (!this.recordingService) {
      return res.status(501).json({
        error: 'Recording service not available',
        code: 'SERVICE_NOT_AVAILABLE'
      });
    }

    try {
      const tenantId = (req as any).tenantId;
      const criteria = { ...req.query };
      
      const recordings = await this.recordingService.searchRecordings(tenantId, criteria as any);
      
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

  private createCompliancePolicy = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private extendRetentionPeriod = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private placeRecordingOnLegalHold = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private performComplianceAudit = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private generateComplianceReport = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
  private addTimelineEntry = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private updateTimelineEntry = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private deleteTimelineEntry = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private createTimelineView = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private getTimelineView = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private createTimelineTemplate = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private applyTemplate = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private searchTimeline = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private exportTimeline = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private generatePredictiveInsights = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
  private healthCheck = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

  private getSystemMetrics = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
    this.app.use('*', (req: AuthenticatedRequest, res: Response) => {
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

  async shutdown(): Promise<any> {
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


import express, { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';

import CalendarIntegrationService from './CalendarIntegrationService';
import MeetingBookingService from './MeetingBookingService';
import AvailabilityManagementService from './AvailabilityManagementService';
import MeetingNotificationService from './MeetingNotificationService';
import MeetingNotesService from './MeetingNotesService';
import VideoConferencingService from './VideoConferencingService';
import MeetingAnalyticsService from './MeetingAnalyticsService';

// API configuration interface
export interface SchedulingAPIConfig {
  port: number;
  corsEnabled: boolean;
  corsOrigins: string[];
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  authentication: {
    enabled: boolean;
    jwtSecret?: string;
    apiKeyHeader: string;
  };
  validation: {
    strictMode: boolean;
    maxRequestSize: string;
  };
  logging: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    includeRequestBody: boolean;
  };
  documentation: {
    enabled: boolean;
    swaggerPath: string;
    version: string;
  };
  mobile: {
    enablePushNotifications: boolean;
    enableOfflineSync: boolean;
    maxSyncBatchSize: number;
  };
  realTime: {
    enableWebSockets: boolean;
    enableServerSentEvents: boolean;
    heartbeatInterval: number;
  };
}

export class SchedulingController extends EventEmitter {
  private app: express.Application;
  private server?: any;
  private config: SchedulingAPIConfig;
  
  // Service instances
  private calendarService: CalendarIntegrationService;
  private bookingService: MeetingBookingService;
  private availabilityService: AvailabilityManagementService;
  private notificationService: MeetingNotificationService;
  private notesService: MeetingNotesService;
  private videoService: VideoConferencingService;
  private analyticsService: MeetingAnalyticsService;

  constructor(
    services: {
      calendarService: CalendarIntegrationService;
      bookingService: MeetingBookingService;
      availabilityService: AvailabilityManagementService;
      notificationService: MeetingNotificationService;
      notesService: MeetingNotesService;
      videoService: VideoConferencingService;
      analyticsService: MeetingAnalyticsService;
    },
    config: Partial<SchedulingAPIConfig> = {}
  ) {
    super();

    this.config = {
      port: 3005,
      corsEnabled: true,
      corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        skipSuccessfulRequests: false
      },
      authentication: {
        enabled: true,
        apiKeyHeader: 'x-api-key'
      },
      validation: {
        strictMode: true,
        maxRequestSize: '10mb'
      },
      logging: {
        enabled: true,
        level: 'info',
        includeRequestBody: false
      },
      documentation: {
        enabled: true,
        swaggerPath: '/api-docs',
        version: '1.0.0'
      },
      mobile: {
        enablePushNotifications: true,
        enableOfflineSync: true,
        maxSyncBatchSize: 100
      },
      realTime: {
        enableWebSockets: false,
        enableServerSentEvents: true,
        heartbeatInterval: 30000
      },
      ...config
    };

    // Assign services
    this.calendarService = services.calendarService;
    this.bookingService = services.bookingService;
    this.availabilityService = services.availabilityService;
    this.notificationService = services.notificationService;
    this.notesService = services.notesService;
    this.videoService = services.videoService;
    this.analyticsService = services.analyticsService;

    this.initializeApp();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private initializeApp(): void {
    this.app = express();

    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    if (this.config.corsEnabled) {
      this.app.use(cors({
        origin: this.config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', this.config.authentication.apiKeyHeader]
      }));
    }

    // Body parsing
    this.app.use(express.json({ limit: this.config.validation.maxRequestSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.validation.maxRequestSize }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimiting.windowMs,
      max: this.config.rateLimiting.maxRequests,
      skip: this.config.rateLimiting.skipSuccessfulRequests ? (req, res) => res.statusCode < 400 : undefined,
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(this.config.rateLimiting.windowMs / 1000)
      }
    });

    this.app.use('/api/scheduling', limiter);

    // Request logging
    if (this.config.logging.enabled) {
      this.app.use(this.requestLogger);
    }

    // Authentication middleware
    if (this.config.authentication.enabled) {
      this.app.use('/api/scheduling', this.authenticateRequest);
    }
  }

  private requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      };

      if (this.config.logging.includeRequestBody && req.body) {
        logData['body'] = req.body;
      }

      console.log(JSON.stringify(logData));
    });

    next();
  };

  private authenticateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers[this.config.authentication.apiKeyHeader] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: `Missing ${this.config.authentication.apiKeyHeader} header`
      });
    }

    // Mock authentication - replace with actual authentication logic
    if (apiKey.length < 10) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'Please provide a valid API key'
      });
    }

    // Add user context to request
    req.user = {
      id: 'user_123',
      tenantId: 'tenant_123',
      role: 'user'
    };

    next();
  };

  private setupRoutes(): void {
    const router = express.Router();

    // Health check
    router.get('/health', this.getHealth);

    // Calendar Integration routes
    this.setupCalendarRoutes(router);

    // Meeting Booking routes
    this.setupBookingRoutes(router);

    // Availability Management routes
    this.setupAvailabilityRoutes(router);

    // Notification routes
    this.setupNotificationRoutes(router);

    // Notes routes
    this.setupNotesRoutes(router);

    // Video Conferencing routes
    this.setupVideoRoutes(router);

    // Analytics routes
    this.setupAnalyticsRoutes(router);

    // Mobile-specific routes
    this.setupMobileRoutes(router);

    // Real-time routes
    this.setupRealTimeRoutes(router);

    // Documentation
    if (this.config.documentation.enabled) {
      this.setupDocumentation(router);
    }

    this.app.use('/api/scheduling', router);
  }

  private setupCalendarRoutes(router: express.Router): void {
    // Calendar provider management
    router.get('/calendar/providers',
      this.getCalendarProviders
    );

    router.get('/calendar/providers/:providerId',
      param('providerId').isString().notEmpty(),
      this.handleValidationErrors,
      this.getCalendarProvider
    );

    // Calendar connections
    router.post('/calendar/connections',
      body('providerId').isString().notEmpty(),
      body('accountEmail').isEmail(),
      body('displayName').isString().notEmpty(),
      body('accessToken').isString().notEmpty(),
      this.handleValidationErrors,
      this.createCalendarConnection
    );

    router.get('/calendar/connections',
      query('userId').optional().isString(),
      this.handleValidationErrors,
      this.getCalendarConnections
    );

    router.put('/calendar/connections/:connectionId',
      param('connectionId').isUUID(),
      this.handleValidationErrors,
      this.updateCalendarConnection
    );

    router.delete('/calendar/connections/:connectionId',
      param('connectionId').isUUID(),
      this.handleValidationErrors,
      this.deleteCalendarConnection
    );

    // Calendar events
    router.post('/calendar/events',
      body('connectionId').isUUID(),
      body('title').isString().notEmpty(),
      body('startTime').isISO8601(),
      body('endTime').isISO8601(),
      this.handleValidationErrors,
      this.createCalendarEvent
    );

    router.get('/calendar/events',
      query('connectionId').isUUID(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      this.handleValidationErrors,
      this.getCalendarEvents
    );

    // Calendar sync
    router.post('/calendar/sync/:connectionId',
      param('connectionId').isUUID(),
      query('syncType').optional().isIn(['full', 'incremental', 'delta']),
      this.handleValidationErrors,
      this.scheduleCalendarSync
    );

    router.get('/calendar/sync/:syncId/status',
      param('syncId').isUUID(),
      this.handleValidationErrors,
      this.getCalendarSyncStatus
    );
  }

  private setupBookingRoutes(router: express.Router): void {
    // Workflow management
    router.get('/booking/workflows',
      this.getBookingWorkflows
    );

    router.post('/booking/workflows',
      body('name').isString().notEmpty(),
      body('type').isIn(['client_meeting', 'internal_meeting', 'consultation', 'review', 'presentation', 'custom']),
      this.handleValidationErrors,
      this.createBookingWorkflow
    );

    // Meeting booking
    router.post('/booking/requests',
      body('workflowId').isUUID(),
      body('title').isString().notEmpty(),
      body('type').isString().notEmpty(),
      body('preferredTimes').isArray({ min: 1 }),
      body('duration').isInt({ min: 15, max: 480 }),
      body('attendees').isArray({ min: 1 }),
      this.handleValidationErrors,
      this.createBookingRequest
    );

    router.get('/booking/requests',
      query('status').optional().isIn(['draft', 'pending_approval', 'approved', 'confirmed', 'cancelled', 'rejected']),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      this.handleValidationErrors,
      this.getBookingRequests
    );

    router.get('/booking/requests/:bookingId',
      param('bookingId').isUUID(),
      this.handleValidationErrors,
      this.getBookingRequest
    );

    router.put('/booking/requests/:bookingId',
      param('bookingId').isUUID(),
      this.handleValidationErrors,
      this.updateBookingRequest
    );

    // Booking approvals
    router.post('/booking/requests/:bookingId/approve',
      param('bookingId').isUUID(),
      body('comments').optional().isString(),
      this.handleValidationErrors,
      this.approveBooking
    );

    router.post('/booking/requests/:bookingId/reject',
      param('bookingId').isUUID(),
      body('reason').isString().notEmpty(),
      this.handleValidationErrors,
      this.rejectBooking
    );

    // Booking cancellation
    router.post('/booking/requests/:bookingId/cancel',
      param('bookingId').isUUID(),
      body('reason').optional().isString(),
      this.handleValidationErrors,
      this.cancelBooking
    );
  }

  private setupAvailabilityRoutes(router: express.Router): void {
    // Availability profiles
    router.post('/availability/profiles',
      body('name').isString().notEmpty(),
      body('timeZone').isString().notEmpty(),
      this.handleValidationErrors,
      this.createAvailabilityProfile
    );

    router.get('/availability/profiles',
      query('userId').optional().isString(),
      this.handleValidationErrors,
      this.getAvailabilityProfiles
    );

    router.get('/availability/profiles/:profileId',
      param('profileId').isUUID(),
      this.handleValidationErrors,
      this.getAvailabilityProfile
    );

    router.put('/availability/profiles/:profileId',
      param('profileId').isUUID(),
      this.handleValidationErrors,
      this.updateAvailabilityProfile
    );

    // Availability queries
    router.post('/availability/query',
      body('userIds').isArray({ min: 1 }),
      body('startDate').isISO8601(),
      body('endDate').isISO8601(),
      body('duration').isInt({ min: 15 }),
      this.handleValidationErrors,
      this.queryAvailability
    );

    router.post('/availability/bulk-query',
      body('queries').isArray({ min: 1 }),
      this.handleValidationErrors,
      this.bulkQueryAvailability
    );

    // Slot management
    router.post('/availability/slots/:slotId/book',
      param('slotId').isUUID(),
      body('bookingId').isUUID(),
      body('meetingType').optional().isString(),
      this.handleValidationErrors,
      this.bookAvailabilitySlot
    );

    router.post('/availability/slots/:slotId/release',
      param('slotId').isUUID(),
      body('bookingId').isUUID(),
      this.handleValidationErrors,
      this.releaseAvailabilitySlot
    );
  }

  private setupNotificationRoutes(router: express.Router): void {
    // Templates
    router.get('/notifications/templates',
      this.getNotificationTemplates
    );

    router.post('/notifications/templates',
      body('name').isString().notEmpty(),
      body('type').isIn(['reminder', 'confirmation', 'cancellation', 'reschedule', 'follow_up', 'custom']),
      body('subject').isString().notEmpty(),
      body('content.text').isString().notEmpty(),
      this.handleValidationErrors,
      this.createNotificationTemplate
    );

    // Rules
    router.get('/notifications/rules',
      this.getNotificationRules
    );

    router.post('/notifications/rules',
      body('name').isString().notEmpty(),
      body('trigger.event').isString().notEmpty(),
      body('actions').isArray({ min: 1 }),
      this.handleValidationErrors,
      this.createNotificationRule
    );

    // Reminders
    router.post('/notifications/reminders',
      body('meetingId').isUUID(),
      body('userId').isString().notEmpty(),
      body('type').isIn(['email', 'sms', 'push', 'in_app']),
      body('timing.minutesBefore').isInt({ min: 0 }),
      this.handleValidationErrors,
      this.createMeetingReminder
    );

    // Statistics
    router.get('/notifications/stats',
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      this.handleValidationErrors,
      this.getNotificationStats
    );
  }

  private setupNotesRoutes(router: express.Router): void {
    // Notes
    router.post('/notes',
      body('meetingId').isUUID(),
      body('title').isString().notEmpty(),
      body('content.text').isString().notEmpty(),
      this.handleValidationErrors,
      this.createMeetingNotes
    );

    router.post('/notes/from-template',
      body('templateId').isUUID(),
      body('meetingId').isUUID(),
      body('title').isString().notEmpty(),
      this.handleValidationErrors,
      this.createNotesFromTemplate
    );

    router.get('/notes',
      query('meetingId').optional().isUUID(),
      this.handleValidationErrors,
      this.getMeetingNotes
    );

    router.get('/notes/:notesId',
      param('notesId').isUUID(),
      this.handleValidationErrors,
      this.getMeetingNotesById
    );

    router.put('/notes/:notesId',
      param('notesId').isUUID(),
      this.handleValidationErrors,
      this.updateMeetingNotes
    );

    // Follow-ups
    router.post('/notes/follow-ups',
      body('meetingId').isUUID(),
      body('type').isIn(['action_item', 'decision', 'question', 'reminder', 'task', 'custom']),
      body('title').isString().notEmpty(),
      body('assignedTo').isArray({ min: 1 }),
      this.handleValidationErrors,
      this.createFollowUp
    );

    router.get('/notes/follow-ups',
      query('meetingId').optional().isUUID(),
      query('assignedTo').optional().isString(),
      query('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'overdue']),
      this.handleValidationErrors,
      this.getFollowUps
    );

    router.put('/notes/follow-ups/:followUpId',
      param('followUpId').isUUID(),
      this.handleValidationErrors,
      this.updateFollowUp
    );

    router.post('/notes/follow-ups/:followUpId/comments',
      param('followUpId').isUUID(),
      body('comment').isString().notEmpty(),
      this.handleValidationErrors,
      this.addFollowUpComment
    );

    // Templates
    router.get('/notes/templates',
      this.getNotesTemplates
    );

    router.post('/notes/templates',
      body('name').isString().notEmpty(),
      body('type').isIn(['meeting_type', 'department', 'project', 'custom']),
      body('sections').isArray({ min: 1 }),
      this.handleValidationErrors,
      this.createNotesTemplate
    );
  }

  private setupVideoRoutes(router: express.Router): void {
    // Providers
    router.get('/video/providers',
      this.getVideoProviders
    );

    router.put('/video/providers/:providerId',
      param('providerId').isString().notEmpty(),
      this.handleValidationErrors,
      this.updateVideoProvider
    );

    // Meetings
    router.post('/video/meetings',
      body('meetingId').isUUID(),
      body('title').isString().notEmpty(),
      body('startTime').isISO8601(),
      body('endTime').isISO8601(),
      body('host.email').isEmail(),
      body('participants').isArray({ min: 1 }),
      this.handleValidationErrors,
      this.createVideoMeeting
    );

    router.get('/video/meetings',
      query('status').optional().isIn(['scheduled', 'waiting', 'started', 'ended', 'cancelled']),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      this.handleValidationErrors,
      this.getVideoMeetings
    );

    router.get('/video/meetings/:meetingId',
      param('meetingId').isUUID(),
      this.handleValidationErrors,
      this.getVideoMeeting
    );

    router.put('/video/meetings/:meetingId',
      param('meetingId').isUUID(),
      this.handleValidationErrors,
      this.updateVideoMeeting
    );

    router.delete('/video/meetings/:meetingId',
      param('meetingId').isUUID(),
      this.handleValidationErrors,
      this.deleteVideoMeeting
    );

    // Meeting control
    router.post('/video/meetings/:meetingId/start',
      param('meetingId').isUUID(),
      this.handleValidationErrors,
      this.startVideoMeeting
    );

    router.post('/video/meetings/:meetingId/end',
      param('meetingId').isUUID(),
      this.handleValidationErrors,
      this.endVideoMeeting
    );

    // Participants
    router.post('/video/meetings/:meetingId/join',
      param('meetingId').isUUID(),
      body('email').isEmail(),
      body('name').isString().notEmpty(),
      this.handleValidationErrors,
      this.joinVideoMeeting
    );

    router.post('/video/meetings/:meetingId/leave',
      param('meetingId').isUUID(),
      body('participantEmail').isEmail(),
      this.handleValidationErrors,
      this.leaveVideoMeeting
    );

    // Recordings
    router.get('/video/meetings/:meetingId/recordings',
      param('meetingId').isUUID(),
      this.handleValidationErrors,
      this.getVideoMeetingRecordings
    );

    router.get('/video/meetings/:meetingId/recordings/:recordingId/download',
      param('meetingId').isUUID(),
      param('recordingId').isUUID(),
      this.handleValidationErrors,
      this.downloadVideoRecording
    );

    // Templates
    router.get('/video/templates',
      this.getVideoTemplates
    );

    router.post('/video/templates',
      body('name').isString().notEmpty(),
      body('providerId').isString().notEmpty(),
      this.handleValidationErrors,
      this.createVideoTemplate
    );

    // Webhooks
    router.post('/video/webhooks/:providerId',
      param('providerId').isString().notEmpty(),
      this.processVideoWebhook
    );
  }

  private setupAnalyticsRoutes(router: express.Router): void {
    // Metrics collection
    router.post('/analytics/metrics',
      body('meetingId').isUUID(),
      body('title').isString().notEmpty(),
      body('type').isString().notEmpty(),
      body('startTime').isISO8601(),
      body('endTime').isISO8601(),
      body('participants').isArray(),
      this.handleValidationErrors,
      this.collectMeetingMetrics
    );

    router.get('/analytics/metrics',
      query('meetingId').optional().isUUID(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      this.handleValidationErrors,
      this.getMeetingMetrics
    );

    // Reports
    router.post('/analytics/reports',
      body('name').isString().notEmpty(),
      body('type').isIn(['executive_summary', 'detailed_analysis', 'comparison', 'trend_analysis', 
                        'department_report', 'user_report', 'meeting_type_report', 'custom']),
      body('period.start').isISO8601(),
      body('period.end').isISO8601(),
      this.handleValidationErrors,
      this.generateAnalyticsReport
    );

    router.get('/analytics/reports',
      this.getAnalyticsReports
    );

    router.get('/analytics/reports/:reportId',
      param('reportId').isUUID(),
      this.handleValidationErrors,
      this.getAnalyticsReport
    );

    // Dashboards
    router.get('/analytics/dashboards',
      this.getAnalyticsDashboards
    );

    router.post('/analytics/dashboards',
      body('name').isString().notEmpty(),
      body('layout.widgets').isArray({ min: 1 }),
      this.handleValidationErrors,
      this.createAnalyticsDashboard
    );

    router.get('/analytics/dashboards/:dashboardId',
      param('dashboardId').isUUID(),
      this.handleValidationErrors,
      this.getAnalyticsDashboard
    );

    // Benchmarks
    router.get('/analytics/benchmarks',
      this.getAnalyticsBenchmarks
    );

    // Predictive insights
    router.get('/analytics/insights',
      this.getPredictiveInsights
    );
  }

  private setupMobileRoutes(router: express.Router): void {
    // Mobile-optimized endpoints
    router.get('/mobile/sync',
      query('lastSync').optional().isISO8601(),
      query('batchSize').optional().isInt({ min: 1, max: this.config.mobile.maxSyncBatchSize }),
      this.handleValidationErrors,
      this.mobileSync
    );

    router.post('/mobile/sync/upload',
      body('changes').isArray(),
      this.handleValidationErrors,
      this.mobileSyncUpload
    );

    // Push notifications
    if (this.config.mobile.enablePushNotifications) {
      router.post('/mobile/push/register',
        body('deviceToken').isString().notEmpty(),
        body('platform').isIn(['ios', 'android']),
        this.handleValidationErrors,
        this.registerPushDevice
      );

      router.delete('/mobile/push/unregister',
        body('deviceToken').isString().notEmpty(),
        this.handleValidationErrors,
        this.unregisterPushDevice
      );
    }

    // Offline support
    if (this.config.mobile.enableOfflineSync) {
      router.get('/mobile/offline/manifest',
        this.getOfflineManifest
      );

      router.post('/mobile/offline/conflict-resolution',
        body('conflicts').isArray({ min: 1 }),
        this.handleValidationErrors,
        this.resolveOfflineConflicts
      );
    }
  }

  private setupRealTimeRoutes(router: express.Router): void {
    // Server-Sent Events
    if (this.config.realTime.enableServerSentEvents) {
      router.get('/realtime/events',
        this.streamRealTimeEvents
      );
    }

    // WebSocket info
    if (this.config.realTime.enableWebSockets) {
      router.get('/realtime/websocket-info',
        this.getWebSocketInfo
      );
    }

    // Real-time status
    router.get('/realtime/status',
      this.getRealTimeStatus
    );
  }

  private setupDocumentation(router: express.Router): void {
    // API documentation
    router.get('/docs', (req: Request, res: Response) => {
      res.json({
        name: 'Meeting Scheduling API',
        version: this.config.documentation.version,
        description: 'Comprehensive meeting scheduling and management API',
        endpoints: {
          calendar: '/api/scheduling/calendar/*',
          booking: '/api/scheduling/booking/*',
          availability: '/api/scheduling/availability/*',
          notifications: '/api/scheduling/notifications/*',
          notes: '/api/scheduling/notes/*',
          video: '/api/scheduling/video/*',
          analytics: '/api/scheduling/analytics/*',
          mobile: '/api/scheduling/mobile/*',
          realtime: '/api/scheduling/realtime/*'
        },
        authentication: {
          type: 'API Key',
          header: this.config.authentication.apiKeyHeader
        },
        rateLimit: {
          requests: this.config.rateLimiting.maxRequests,
          window: `${this.config.rateLimiting.windowMs / 1000} seconds`
        }
      });
    });

    // OpenAPI specification
    router.get('/openapi.json', (req: Request, res: Response) => {
      res.json(this.generateOpenAPISpec());
    });
  }

  // Validation helper
  private handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  };

  // Route handlers
  private getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          calendar: await this.calendarService.getSystemHealth(),
          booking: await this.bookingService.getSystemHealth(),
          availability: await this.availabilityService.getSystemHealth(),
          notifications: await this.notificationService.getSystemHealth(),
          notes: await this.notesService.getSystemHealth(),
          video: await this.videoService.getSystemHealth(),
          analytics: await this.analyticsService.getSystemHealth()
        }
      };

      res.json(health);
    } catch (error) {
      res.status(500).json({
        error: 'Health check failed',
        message: error.message
      });
    }
  };

  // Calendar Integration handlers
  private getCalendarProviders = async (req: Request, res: Response): Promise<void> => {
    try {
      const providers = await this.calendarService.getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getCalendarProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      const provider = await this.calendarService.getProvider(req.params.providerId);
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private createCalendarConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const connection = await this.calendarService.createConnection({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        ...req.body
      });
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getCalendarConnections = async (req: Request, res: Response): Promise<void> => {
    try {
      const connections = await this.calendarService.getConnections(
        req.user.tenantId,
        req.query.userId as string
      );
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private updateCalendarConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const connection = await this.calendarService.updateConnection(
        req.params.connectionId,
        req.body
      );
      res.json(connection);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private deleteCalendarConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.calendarService.deleteConnection(req.params.connectionId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private createCalendarEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = await this.calendarService.createEvent({
        tenantId: req.user.tenantId,
        organizerId: req.user.id,
        ...req.body
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const events = await this.calendarService.getEvents(
        req.query.connectionId as string,
        {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        }
      );
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private scheduleCalendarSync = async (req: Request, res: Response): Promise<void> => {
    try {
      const syncId = await this.calendarService.scheduleSync(
        req.params.connectionId,
        req.query.syncType as any
      );
      res.json({ syncId });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getCalendarSyncStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.calendarService.getSyncStatus(req.params.syncId);
      if (!status) {
        return res.status(404).json({ error: 'Sync not found' });
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Meeting Booking handlers
  private getBookingWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const workflows = await this.bookingService.getWorkflows(req.user.tenantId);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private createBookingWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const workflow = await this.bookingService.createWorkflow({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private createBookingRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.bookingService.createBookingRequest({
        tenantId: req.user.tenantId,
        requesterId: req.user.id,
        ...req.body
      });
      res.status(201).json(booking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getBookingRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const bookings = await this.bookingService.getBookings(req.user.tenantId, {
        status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getBookingRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.bookingService.getBooking(req.params.bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private updateBookingRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.bookingService.updateBooking(
        req.params.bookingId,
        req.body
      );
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private approveBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.bookingService.approveBooking(
        req.params.bookingId,
        req.user.id,
        req.body.comments
      );
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private rejectBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.bookingService.rejectBooking(
        req.params.bookingId,
        req.user.id,
        req.body.reason
      );
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private cancelBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.bookingService.cancelBooking(
        req.params.bookingId,
        req.body.reason
      );
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Availability Management handlers
  private createAvailabilityProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await this.availabilityService.createProfile({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        ...req.body
      });
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getAvailabilityProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const profiles = await this.availabilityService.getProfiles(
        req.user.tenantId,
        req.query.userId as string
      );
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getAvailabilityProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await this.availabilityService.getProfile(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private updateAvailabilityProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await this.availabilityService.updateProfile(
        req.params.profileId,
        req.body
      );
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private queryAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const availability = await this.availabilityService.getAvailability({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      });
      res.json(availability);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private bulkQueryAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const results = await this.availabilityService.getBulkAvailability({
        queries: req.body.queries.map(q => ({
          ...q,
          startDate: new Date(q.startDate),
          endDate: new Date(q.endDate)
        })),
        optimization: req.body.optimization || {},
        constraints: req.body.constraints || { maxResultsPerQuery: 50, includeAlternatives: true, groupResults: false }
      });
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private bookAvailabilitySlot = async (req: Request, res: Response): Promise<void> => {
    try {
      const slot = await this.availabilityService.bookSlot(
        req.params.slotId,
        req.body.bookingId,
        req.body.meetingType
      );
      res.json(slot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private releaseAvailabilitySlot = async (req: Request, res: Response): Promise<void> => {
    try {
      const slot = await this.availabilityService.releaseSlot(
        req.params.slotId,
        req.body.bookingId
      );
      res.json(slot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Placeholder implementations for other handlers...
  // (Note: In a real implementation, each handler would follow similar patterns)

  private getNotificationTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.notificationService.getTemplates(req.user.tenantId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private createNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const template = await this.notificationService.createTemplate({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getNotificationRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const rules = await this.notificationService.getRules(req.user.tenantId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private createNotificationRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const rule = await this.notificationService.createRule({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(rule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private createMeetingReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const reminder = await this.notificationService.createReminder({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(reminder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getNotificationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const dateRange = req.query.startDate && req.query.endDate ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      } : undefined;
      
      const stats = await this.notificationService.getNotificationStats(req.user.tenantId, dateRange);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Notes handlers
  private createMeetingNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const notes = await this.notesService.createNotes({
        tenantId: req.user.tenantId,
        authorId: req.user.id,
        authorName: 'User', // Would come from user service
        ...req.body
      });
      res.status(201).json(notes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private createNotesFromTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const notes = await this.notesService.createNotesFromTemplate(
        req.body.templateId,
        {
          meetingId: req.body.meetingId,
          tenantId: req.user.tenantId,
          authorId: req.user.id,
          authorName: 'User',
          title: req.body.title
        }
      );
      res.status(201).json(notes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getMeetingNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const notes = req.query.meetingId ?
        await this.notesService.getNotesByMeeting(req.query.meetingId as string) :
        []; // Would implement tenant-wide notes query
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getMeetingNotesById = async (req: Request, res: Response): Promise<void> => {
    try {
      const notes = await this.notesService.getNotes(req.params.notesId);
      if (!notes) {
        return res.status(404).json({ error: 'Notes not found' });
      }
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private updateMeetingNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const notes = await this.notesService.updateNotes(
        req.params.notesId,
        req.body,
        req.user.id,
        'User'
      );
      res.json(notes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private createFollowUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const followUp = await this.notesService.createFollowUp({
        tenantId: req.user.tenantId,
        createdBy: {
          userId: req.user.id,
          userName: 'User'
        },
        ...req.body
      });
      res.status(201).json(followUp);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getFollowUps = async (req: Request, res: Response): Promise<void> => {
    try {
      const followUps = await this.notesService.getFollowUps({
        tenantId: req.user.tenantId,
        meetingId: req.query.meetingId as string,
        assignedTo: req.query.assignedTo as string,
        status: req.query.status ? [req.query.status as any] : undefined
      });
      res.json(followUps);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private updateFollowUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const followUp = await this.notesService.updateFollowUp(
        req.params.followUpId,
        req.body,
        req.user.id,
        'User'
      );
      res.json(followUp);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private addFollowUpComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const followUp = await this.notesService.addFollowUpComment(
        req.params.followUpId,
        req.body.comment,
        req.user.id,
        'User'
      );
      res.json(followUp);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getNotesTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.notesService.getTemplates(req.user.tenantId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private createNotesTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const template = await this.notesService.createTemplate({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Video conferencing handlers (simplified implementations)
  private getVideoProviders = async (req: Request, res: Response): Promise<void> => {
    try {
      const providers = await this.videoService.getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private updateVideoProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      const provider = await this.videoService.updateProvider(req.params.providerId, req.body);
      res.json(provider);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private createVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const meeting = await this.videoService.createMeeting({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(meeting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getVideoMeetings = async (req: Request, res: Response): Promise<void> => {
    try {
      const meetings = await this.videoService.getMeetings({
        tenantId: req.user.tenantId,
        status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const meeting = await this.videoService.getMeeting(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private updateVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const meeting = await this.videoService.updateMeeting(req.params.meetingId, req.body);
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private deleteVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.videoService.deleteMeeting(req.params.meetingId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private startVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const meeting = await this.videoService.startMeeting(req.params.meetingId);
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private endVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const meeting = await this.videoService.endMeeting(req.params.meetingId);
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private joinVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const meeting = await this.videoService.joinMeeting(req.params.meetingId, req.body);
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private leaveVideoMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const meeting = await this.videoService.leaveMeeting(
        req.params.meetingId,
        req.body.participantEmail
      );
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getVideoMeetingRecordings = async (req: Request, res: Response): Promise<void> => {
    try {
      const recordings = await this.videoService.getRecordings(req.params.meetingId);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private downloadVideoRecording = async (req: Request, res: Response): Promise<void> => {
    try {
      const downloadUrl = await this.videoService.downloadRecording(
        req.params.meetingId,
        req.params.recordingId
      );
      res.json({ downloadUrl });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getVideoTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.videoService.getTemplates(req.user.tenantId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private createVideoTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const template = await this.videoService.createTemplate({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private processVideoWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.videoService.processWebhookEvent(
        req.params.providerId,
        req.body.eventType,
        req.body,
        req.headers['x-signature'] as string
      );
      res.status(200).json({ received: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Analytics handlers (simplified implementations)
  private collectMeetingMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.analyticsService.collectMeetingMetrics({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(metrics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getMeetingMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.analyticsService.getMetrics({
        tenantId: req.user.tenantId,
        meetingId: req.query.meetingId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private generateAnalyticsReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.analyticsService.generateReport({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        userName: 'User',
        ...req.body,
        period: {
          start: new Date(req.body.period.start),
          end: new Date(req.body.period.end)
        }
      });
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getAnalyticsReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const reports = await this.analyticsService.getReports(req.user.tenantId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getAnalyticsReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.analyticsService.getReport(req.params.reportId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getAnalyticsDashboards = async (req: Request, res: Response): Promise<void> => {
    try {
      const dashboards = await this.analyticsService.getDashboards(req.user.tenantId);
      res.json(dashboards);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private createAnalyticsDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const dashboard = await this.analyticsService.createDashboard({
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(dashboard);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getAnalyticsDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const dashboard = await this.analyticsService.getDashboard(req.params.dashboardId);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getAnalyticsBenchmarks = async (req: Request, res: Response): Promise<void> => {
    try {
      const benchmarks = await this.analyticsService.getBenchmarks();
      res.json(benchmarks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private getPredictiveInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      const insights = await this.analyticsService.getPredictiveInsights(req.user.tenantId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Mobile-specific handlers
  private mobileSync = async (req: Request, res: Response): Promise<void> => {
    try {
      // Mock mobile sync implementation
      const lastSync = req.query.lastSync ? new Date(req.query.lastSync as string) : new Date(0);
      const batchSize = parseInt(req.query.batchSize as string) || 50;

      // Would implement actual sync logic here
      const syncData = {
        lastSync: new Date(),
        changes: {
          meetings: [],
          notes: [],
          followUps: []
        },
        hasMore: false
      };

      res.json(syncData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private mobileSyncUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      // Mock sync upload implementation
      const changes = req.body.changes;
      const results = {
        processed: changes.length,
        conflicts: [],
        errors: []
      };

      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private registerPushDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      // Mock push device registration
      res.json({ registered: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private unregisterPushDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      // Mock push device unregistration
      res.json({ unregistered: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  private getOfflineManifest = async (req: Request, res: Response): Promise<void> => {
    try {
      const manifest = {
        version: '1.0.0',
        resources: [
          '/api/scheduling/mobile/sync',
          '/api/scheduling/availability/profiles',
          '/api/scheduling/booking/workflows'
        ],
        cacheStrategy: 'cache-first',
        lastUpdated: new Date()
      };

      res.json(manifest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  private resolveOfflineConflicts = async (req: Request, res: Response): Promise<void> => {
    try {
      const conflicts = req.body.conflicts;
      const resolutions = conflicts.map(conflict => ({
        id: conflict.id,
        resolution: 'server_wins', // Simple resolution strategy
        resolved: true
      }));

      res.json({ resolutions });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Real-time handlers
  private streamRealTimeEvents = (req: Request, res: Response): void => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send heartbeat
    const heartbeat = setInterval(() => {
      res.write('event: heartbeat\ndata: {}\n\n');
    }, this.config.realTime.heartbeatInterval);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
    });

    // Send initial connection message
    res.write('event: connected\ndata: {"message":"Connected to real-time events"}\n\n');
  };

  private getWebSocketInfo = (req: Request, res: Response): void => {
    res.json({
      enabled: this.config.realTime.enableWebSockets,
      url: 'ws://localhost:3005/ws',
      protocols: ['scheduling-v1']
    });
  };

  private getRealTimeStatus = (req: Request, res: Response): void => {
    res.json({
      websockets: {
        enabled: this.config.realTime.enableWebSockets,
        connections: 0 // Would track actual connections
      },
      serverSentEvents: {
        enabled: this.config.realTime.enableServerSentEvents,
        connections: 0 // Would track actual connections
      },
      heartbeatInterval: this.config.realTime.heartbeatInterval
    });
  };

  // Utility methods
  private generateOpenAPISpec(): any {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Meeting Scheduling API',
        version: this.config.documentation.version,
        description: 'Comprehensive meeting scheduling and management API'
      },
      servers: [
        { url: `/api/scheduling`, description: 'Scheduling API' }
      ],
      paths: {
        '/health': {
          get: {
            summary: 'Health check',
            responses: {
              '200': { description: 'Service health status' }
            }
          }
        }
        // Would include full API specification
      }
    };
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: this.config.logging.level === 'debug' ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        message: `Endpoint ${req.method} ${req.url} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Server lifecycle
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`Scheduling API server running on port ${this.config.port}`);
          this.emit('started', { port: this.config.port });
          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('Server error:', error);
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Scheduling API server stopped');
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  getConfig(): SchedulingAPIConfig {
    return { ...this.config };
  }
}

// Type declarations for Express Request
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        tenantId: string;
        role: string;
      };
    }
  }
}

export default SchedulingController;
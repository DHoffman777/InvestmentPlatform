import express, { Request, Response, NextFunction } from 'express';
// Validation will be handled internally
// const { body, query, param, validationResult } = require('express-validator');

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
};
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
  private app!: express.Application;
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
      this.app.use(this.requestLogger as any);
    }

    // Authentication middleware
    if (this.config.authentication.enabled) {
      this.app.use('/api/scheduling', this.authenticateRequest as any);
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
        (logData as any)['body'] = req.body;
      }

      console.log(JSON.stringify(logData));
    });

    next();
  };

  private authenticateRequest = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const apiKey = req.headers[this.config.authentication.apiKeyHeader] as string;
    
    if (!apiKey) {
      res.status(401).json({
        error: 'Authentication required',
        message: `Missing ${this.config.authentication.apiKeyHeader} header`
      });
      return;
    }

    // Mock authentication - replace with actual authentication logic
    if (apiKey.length < 10) {
      res.status(401).json({
        error: 'Invalid API key',
        message: 'Please provide a valid API key'
      });
      return;
    }

    // Add user context to request
    (req as any).user = {
      id: 'user_123',
      tenantId: 'tenant_123',
      role: 'user'
    };

    next();
  };

  private setupRoutes(): void {
    const router = express.Router();

    // Health check
    router.get('/health', this.getHealth as any);

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
      this.getCalendarProviders as any
    );

    router.get('/calendar/providers/:providerId',
      this.getCalendarProvider as any
    );

    // Calendar connections
    router.post('/calendar/connections',
      this.createCalendarConnection as any
    );

    router.get('/calendar/connections',
      this.getCalendarConnections as any
    );

    router.put('/calendar/connections/:connectionId',
      this.updateCalendarConnection as any
    );

    router.delete('/calendar/connections/:connectionId',
      this.deleteCalendarConnection as any
    );

    // Calendar events
    router.post('/calendar/events',
      this.createCalendarEvent as any
    );

    router.get('/calendar/events',
      this.getCalendarEvents as any
    );

    // Calendar sync
    router.post('/calendar/sync/:connectionId',
      this.scheduleCalendarSync as any
    );

    router.get('/calendar/sync/:syncId/status',
      this.getCalendarSyncStatus as any
    );
  }

  private setupBookingRoutes(router: express.Router): void {
    // Workflow management
    router.get('/booking/workflows',
      this.getBookingWorkflows as any
    );

    router.post('/booking/workflows',
      this.createBookingWorkflow as any
    );

    // Meeting booking
    router.post('/booking/requests',
      this.createBookingRequest as any
    );

    router.get('/booking/requests',
      this.getBookingRequests as any
    );

    router.get('/booking/requests/:bookingId',
      this.getBookingRequest as any
    );

    router.put('/booking/requests/:bookingId',
      this.updateBookingRequest as any
    );

    // Booking approvals
    router.post('/booking/requests/:bookingId/approve',
      this.approveBooking as any
    );

    router.post('/booking/requests/:bookingId/reject',
      this.rejectBooking as any
    );

    // Booking cancellation
    router.post('/booking/requests/:bookingId/cancel',
      this.cancelBooking as any
    );
  }

  private setupAvailabilityRoutes(router: express.Router): void {
    // Availability profiles
    router.post('/availability/profiles',
      this.createAvailabilityProfile as any
    );

    router.get('/availability/profiles',
      this.getAvailabilityProfiles as any
    );

    router.get('/availability/profiles/:profileId',
      this.getAvailabilityProfile as any
    );

    router.put('/availability/profiles/:profileId',
      this.updateAvailabilityProfile as any
    );

    // Availability queries
    router.post('/availability/query',
      this.queryAvailability as any
    );

    router.post('/availability/bulk-query',
      this.bulkQueryAvailability as any
    );

    // Slot management
    router.post('/availability/slots/:slotId/book',
      this.bookAvailabilitySlot as any
    );

    router.post('/availability/slots/:slotId/release',
      this.releaseAvailabilitySlot as any
    );
  }

  private setupNotificationRoutes(router: express.Router): void {
    // Templates
    router.get('/notifications/templates',
      this.getNotificationTemplates as any
    );

    router.post('/notifications/templates',
      this.createNotificationTemplate as any
    );

    // Rules
    router.get('/notifications/rules',
      this.getNotificationRules as any
    );

    router.post('/notifications/rules',
      this.createNotificationRule as any
    );

    // Reminders
    router.post('/notifications/reminders',
      this.createMeetingReminder as any
    );

    // Statistics
    router.get('/notifications/stats',
      this.getNotificationStats as any
    );
  }

  private setupNotesRoutes(router: express.Router): void {
    // Notes
    router.post('/notes',
      this.createMeetingNotes as any
    );

    router.post('/notes/from-template',
      this.createNotesFromTemplate as any
    );

    router.get('/notes',
      this.getMeetingNotes as any
    );

    router.get('/notes/:notesId',
      this.getMeetingNotesById as any
    );

    router.put('/notes/:notesId',
      this.updateMeetingNotes as any
    );

    // Follow-ups
    router.post('/notes/follow-ups',
      this.createFollowUp as any
    );

    router.get('/notes/follow-ups',
      this.getFollowUps as any
    );

    router.put('/notes/follow-ups/:followUpId',
      this.updateFollowUp as any
    );

    router.post('/notes/follow-ups/:followUpId/comments',
      this.addFollowUpComment as any
    );

    // Templates
    router.get('/notes/templates',
      this.getNotesTemplates as any
    );

    router.post('/notes/templates',
      this.createNotesTemplate as any
    );
  }

  private setupVideoRoutes(router: express.Router): void {
    // Providers
    router.get('/video/providers',
      this.getVideoProviders as any
    );

    router.put('/video/providers/:providerId',
      this.updateVideoProvider as any
    );

    // Meetings
    router.post('/video/meetings',
      this.createVideoMeeting as any
    );

    router.get('/video/meetings',
      this.getVideoMeetings as any
    );

    router.get('/video/meetings/:meetingId',
      this.getVideoMeeting as any
    );

    router.put('/video/meetings/:meetingId',
      this.updateVideoMeeting as any
    );

    router.delete('/video/meetings/:meetingId',
      this.deleteVideoMeeting as any
    );

    // Meeting control
    router.post('/video/meetings/:meetingId/start',
      this.startVideoMeeting as any
    );

    router.post('/video/meetings/:meetingId/end',
      this.endVideoMeeting as any
    );

    // Participants
    router.post('/video/meetings/:meetingId/join',
      this.joinVideoMeeting as any
    );

    router.post('/video/meetings/:meetingId/leave',
      this.leaveVideoMeeting as any
    );

    // Recordings
    router.get('/video/meetings/:meetingId/recordings',
      this.getVideoMeetingRecordings as any
    );

    router.get('/video/meetings/:meetingId/recordings/:recordingId/download',
      this.downloadVideoRecording as any
    );

    // Templates
    router.get('/video/templates',
      this.getVideoTemplates as any
    );

    router.post('/video/templates',
      this.createVideoTemplate as any
    );

    // Webhooks
    router.post('/video/webhooks/:providerId',
      this.processVideoWebhook as any
    );
  }

  private setupAnalyticsRoutes(router: express.Router): void {
    // Metrics collection
    router.post('/analytics/metrics',
      this.collectMeetingMetrics as any
    );

    router.get('/analytics/metrics',
      this.getMeetingMetrics as any
    );

    // Reports
    router.post('/analytics/reports',
      this.generateAnalyticsReport as any
    );

    router.get('/analytics/reports',
      this.getAnalyticsReports as any
    );

    router.get('/analytics/reports/:reportId',
      this.getAnalyticsReport as any
    );

    // Dashboards
    router.get('/analytics/dashboards',
      this.getAnalyticsDashboards as any
    );

    router.post('/analytics/dashboards',
      this.createAnalyticsDashboard as any
    );

    router.get('/analytics/dashboards/:dashboardId',
      this.getAnalyticsDashboard as any
    );

    // Benchmarks
    router.get('/analytics/benchmarks',
      this.getAnalyticsBenchmarks as any
    );

    // Predictive insights
    router.get('/analytics/insights',
      this.getPredictiveInsights as any
    );
  }

  private setupMobileRoutes(router: express.Router): void {
    // Mobile-optimized endpoints
    router.get('/mobile/sync',
      this.mobileSync as any
    );

    router.post('/mobile/sync/upload',
      this.mobileSyncUpload as any
    );

    // Push notifications
    if (this.config.mobile.enablePushNotifications) {
      router.post('/mobile/push/register',
        this.registerPushDevice as any
      );

      router.delete('/mobile/push/unregister',
        this.unregisterPushDevice as any
      );
    }

    // Offline support
    if (this.config.mobile.enableOfflineSync) {
      router.get('/mobile/offline/manifest',
        this.getOfflineManifest as any
      );

      router.post('/mobile/offline/conflict-resolution',
        this.resolveOfflineConflicts as any
      );
    }
  }

  private setupRealTimeRoutes(router: express.Router): void {
    // Server-Sent Events
    if (this.config.realTime.enableServerSentEvents) {
      router.get('/realtime/events',
        this.streamRealTimeEvents as any
      );
    }

    // WebSocket info
    if (this.config.realTime.enableWebSockets) {
      router.get('/realtime/websocket-info',
        this.getWebSocketInfo as any
      );
    }

    // Real-time status
    router.get('/realtime/status',
      this.getRealTimeStatus as any
    );
  }

  private setupDocumentation(router: express.Router): void {
    // API documentation
    router.get('/docs', this.getDocs as any);

    // OpenAPI specification
    router.get('/openapi.json', this.getOpenAPISpec as any);
  }


  // Route handlers
  private getHealth = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
    } catch (error: any) {
      res.status(500).json({
        error: 'Health check failed',
        message: error.message
      });
    }
  };

  // Calendar Integration handlers
  private getCalendarProviders = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const providers = await this.calendarService.getProviders();
      res.json(providers);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getCalendarProvider = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const provider = await this.calendarService.getProvider(req.params.providerId);
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      res.json(provider);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createCalendarConnection = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const connection = await this.calendarService.createConnection({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        ...req.body
      });
      res.status(201).json(connection);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getCalendarConnections = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const connections = await this.calendarService.getConnections(
        req.user!.tenantId,
        req.query.userId as string
      );
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private updateCalendarConnection = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const connection = await this.calendarService.updateConnection(
        req.params.connectionId,
        req.body
      );
      res.json(connection);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private deleteCalendarConnection = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      await this.calendarService.deleteConnection(req.params.connectionId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createCalendarEvent = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const event = await this.calendarService.createEvent({
        tenantId: req.user!.tenantId,
        organizerId: req.user!.id,
        ...req.body
      });
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getCalendarEvents = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const events = await this.calendarService.getEvents(
        req.query.connectionId as string,
        {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        }
      );
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private scheduleCalendarSync = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const syncId = await this.calendarService.scheduleSync(
        req.params.connectionId,
        req.query.syncType as any
      );
      res.json({ syncId });
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getCalendarSyncStatus = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const status = await this.calendarService.getSyncStatus(req.params.syncId);
      if (!status) {
        return res.status(404).json({ error: 'Sync not found' });
      }
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Meeting Booking handlers
  private getBookingWorkflows = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const workflows = await this.bookingService.getWorkflows(req.user!.tenantId);
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createBookingWorkflow = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const workflow = await this.bookingService.createWorkflow({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createBookingRequest = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const booking = await this.bookingService.createBookingRequest({
        tenantId: req.user!.tenantId,
        requesterId: req.user!.id,
        ...req.body
      });
      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getBookingRequests = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      if (!this.checkAuthentication(req, res)) return;
      const bookings = await this.bookingService.getBookings(req.user!.tenantId, {
        status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getBookingRequest = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const booking = await this.bookingService.getBooking(req.params.bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private updateBookingRequest = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const booking = await this.bookingService.updateBooking(
        req.params.bookingId,
        req.body
      );
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private approveBooking = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const booking = await this.bookingService.approveBooking(
        req.params.bookingId,
        req.user!.id,
        req.body.comments
      );
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private rejectBooking = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const booking = await this.bookingService.rejectBooking(
        req.params.bookingId,
        req.user!.id,
        req.body.reason
      );
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const booking = await this.bookingService.cancelBooking(
        req.params.bookingId,
        req.body.reason
      );
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Availability Management handlers
  private createAvailabilityProfile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const profile = await this.availabilityService.createProfile({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        ...req.body
      });
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getAvailabilityProfiles = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const profiles = await this.availabilityService.getProfiles(
        req.user!.tenantId,
        req.query.userId as string
      );
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getAvailabilityProfile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const profile = await this.availabilityService.getProfile(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private updateAvailabilityProfile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const profile = await this.availabilityService.updateProfile(
        req.params.profileId,
        req.body
      );
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private queryAvailability = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const availability = await this.availabilityService.getAvailability({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      });
      res.json(availability);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private bulkQueryAvailability = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const results = await this.availabilityService.getBulkAvailability({
        queries: req.body.queries.map((q: any) => ({
          ...q,
          startDate: new Date(q.startDate),
          endDate: new Date(q.endDate)
        })),
        optimization: req.body.optimization || {},
        constraints: req.body.constraints || { maxResultsPerQuery: 50, includeAlternatives: true, groupResults: false }
      });
      res.json(results);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private bookAvailabilitySlot = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const slot = await this.availabilityService.bookSlot(
        req.params.slotId,
        req.body.bookingId,
        req.body.meetingType
      );
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private releaseAvailabilitySlot = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const slot = await this.availabilityService.releaseSlot(
        req.params.slotId,
        req.body.bookingId
      );
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Placeholder implementations for other handlers...
  // (Note: In a real implementation, each handler would follow similar patterns)

  private getNotificationTemplates = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const templates = await this.notificationService.getTemplates(req.user!.tenantId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createNotificationTemplate = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const template = await this.notificationService.createTemplate({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getNotificationRules = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const rules = await this.notificationService.getRules(req.user!.tenantId);
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createNotificationRule = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const rule = await this.notificationService.createRule({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createMeetingReminder = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const reminder = await this.notificationService.createReminder({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(reminder);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getNotificationStats = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const dateRange = req.query.startDate && req.query.endDate ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      } : undefined;
      
      const stats = await this.notificationService.getNotificationStats(req.user!.tenantId, dateRange);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Notes handlers
  private createMeetingNotes = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const notes = await this.notesService.createNotes({
        tenantId: req.user!.tenantId,
        authorId: req.user!.id,
        authorName: 'User', // Would come from user service
        ...req.body
      });
      res.status(201).json(notes);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createNotesFromTemplate = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const notes = await this.notesService.createNotesFromTemplate(
        req.body.templateId,
        {
          meetingId: req.body.meetingId,
          tenantId: req.user!.tenantId,
          authorId: req.user!.id,
          authorName: 'User',
          title: req.body.title
        }
      );
      res.status(201).json(notes);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getMeetingNotes = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const notes = req.query.meetingId ?
        await this.notesService.getNotesByMeeting(req.query.meetingId as string) :
        []; // Would implement tenant-wide notes query
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getMeetingNotesById = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const notes = await this.notesService.getNotes(req.params.notesId);
      if (!notes) {
        return res.status(404).json({ error: 'Notes not found' });
      }
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private updateMeetingNotes = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const notes = await this.notesService.updateNotes(
        req.params.notesId,
        req.body,
        req.user!.id,
        'User'
      );
      res.json(notes);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createFollowUp = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const followUp = await this.notesService.createFollowUp({
        tenantId: req.user!.tenantId,
        createdBy: {
          userId: req.user!.id,
          userName: 'User'
        },
        ...req.body
      });
      res.status(201).json(followUp);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getFollowUps = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const followUps = await this.notesService.getFollowUps({
        tenantId: req.user!.tenantId,
        meetingId: req.query.meetingId as string,
        assignedTo: req.query.assignedTo as string,
        status: req.query.status ? [req.query.status as any] : undefined
      });
      res.json(followUps);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private updateFollowUp = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const followUp = await this.notesService.updateFollowUp(
        req.params.followUpId,
        req.body,
        req.user!.id,
        'User'
      );
      res.json(followUp);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private addFollowUpComment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const followUp = await this.notesService.addFollowUpComment(
        req.params.followUpId,
        req.body.comment,
        req.user!.id,
        'User'
      );
      res.json(followUp);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getNotesTemplates = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const templates = await this.notesService.getTemplates(req.user!.tenantId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createNotesTemplate = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const template = await this.notesService.createTemplate({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Video conferencing handlers (simplified implementations)
  private getVideoProviders = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const providers = await this.videoService.getProviders();
      res.json(providers);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private updateVideoProvider = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const provider = await this.videoService.updateProvider(req.params.providerId, req.body);
      res.json(provider);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meeting = await this.videoService.createMeeting({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getVideoMeetings = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meetings = await this.videoService.getMeetings({
        tenantId: req.user!.tenantId,
        status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });
      res.json(meetings);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meeting = await this.videoService.getMeeting(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }
      res.json(meeting);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private updateVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meeting = await this.videoService.updateMeeting(req.params.meetingId, req.body);
      res.json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private deleteVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      await this.videoService.deleteMeeting(req.params.meetingId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private startVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meeting = await this.videoService.startMeeting(req.params.meetingId);
      res.json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private endVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meeting = await this.videoService.endMeeting(req.params.meetingId);
      res.json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private joinVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meeting = await this.videoService.joinMeeting(req.params.meetingId, req.body);
      res.json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private leaveVideoMeeting = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const meeting = await this.videoService.leaveMeeting(
        req.params.meetingId,
        req.body.participantEmail
      );
      res.json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getVideoMeetingRecordings = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const recordings = await this.videoService.getRecordings(req.params.meetingId);
      res.json(recordings);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private downloadVideoRecording = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const downloadUrl = await this.videoService.downloadRecording(
        req.params.meetingId,
        req.params.recordingId
      );
      res.json({ downloadUrl });
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getVideoTemplates = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const templates = await this.videoService.getTemplates(req.user!.tenantId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createVideoTemplate = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const template = await this.videoService.createTemplate({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private processVideoWebhook = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      await this.videoService.processWebhookEvent(
        req.params.providerId,
        req.body.eventType,
        req.body,
        req.headers['x-signature'] as string
      );
      res.status(200).json({ received: true });
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Analytics handlers (simplified implementations)
  private collectMeetingMetrics = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const metrics = await this.analyticsService.collectMeetingMetrics({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(metrics);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getMeetingMetrics = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const metrics = await this.analyticsService.getMetrics({
        tenantId: req.user!.tenantId,
        meetingId: req.query.meetingId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private generateAnalyticsReport = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const report = await this.analyticsService.generateReport({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        userName: 'User',
        ...req.body,
        period: {
          start: new Date(req.body.period.start),
          end: new Date(req.body.period.end)
        }
      });
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getAnalyticsReports = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const reports = await this.analyticsService.getReports(req.user!.tenantId);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getAnalyticsReport = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const report = await this.analyticsService.getReport(req.params.reportId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getAnalyticsDashboards = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const dashboards = await this.analyticsService.getDashboards(req.user!.tenantId);
      res.json(dashboards);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private createAnalyticsDashboard = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const dashboard = await this.analyticsService.createDashboard({
        tenantId: req.user!.tenantId,
        ...req.body
      });
      res.status(201).json(dashboard);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getAnalyticsDashboard = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const dashboard = await this.analyticsService.getDashboard(req.params.dashboardId);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      res.json(dashboard);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getAnalyticsBenchmarks = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const benchmarks = await this.analyticsService.getBenchmarks();
      res.json(benchmarks);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getPredictiveInsights = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const insights = await this.analyticsService.getPredictiveInsights(req.user!.tenantId);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Mobile-specific handlers
  private mobileSync = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private mobileSyncUpload = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      // Mock sync upload implementation
      const changes = req.body.changes;
      const results = {
        processed: changes.length,
        conflicts: [],
        errors: []
      };

      res.json(results);
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private registerPushDevice = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      // Mock push device registration
      res.json({ registered: true });
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private unregisterPushDevice = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      // Mock push device unregistration
      res.json({ unregistered: true });
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private getOfflineManifest = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
    } catch (error: any) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  private resolveOfflineConflicts = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const conflicts = req.body.conflicts;
      const resolutions = conflicts.map((conflict: any) => ({
        id: conflict.id,
        resolution: 'server_wins', // Simple resolution strategy
        resolved: true
      }));

      res.json({ resolutions });
    } catch (error: any) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Real-time handlers
  private streamRealTimeEvents = (req: AuthenticatedRequest, res: Response): void => {
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

  private getWebSocketInfo = (req: AuthenticatedRequest, res: Response): void => {
    res.json({
      enabled: this.config.realTime.enableWebSockets,
      url: 'ws://localhost:3005/ws',
      protocols: ['scheduling-v1']
    });
  };

  private getRealTimeStatus = (req: AuthenticatedRequest, res: Response): void => {
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

  // Helper method to check authentication
  private checkAuthentication(req: AuthenticatedRequest, res: Response): boolean {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return false;
    }
    return true;
  }

  // Documentation handlers
  private getDocs = (req: AuthenticatedRequest, res: Response): void => {
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
  };

  private getOpenAPISpec = (req: AuthenticatedRequest, res: Response): void => {
    res.json(this.generateOpenAPISpec());
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
        message: this.config.logging.level === 'debug' ? error instanceof Error ? error.message : 'Unknown error' : 'An unexpected error occurred',
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
  async start(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`Scheduling API server running on port ${this.config.port}`);
          this.emit('started', { port: this.config.port });
          resolve(undefined);
        });

        this.server.on('error', (error: Error) => {
          console.error('Server error:', error);
          this.emit('error', error);
          reject(error);
        });

      } catch (error: any) {
        reject(error);
      }
    });
  }

  async stop(): Promise<any> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Scheduling API server stopped');
          this.emit('stopped');
          resolve(undefined);
        });
      } else {
        resolve(undefined);
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


export default SchedulingController;



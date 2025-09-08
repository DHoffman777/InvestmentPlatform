import express, { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
// Import express-validator with proper type handling
import expressValidator from 'express-validator';
const { body, param, query, validationResult } = expressValidator as any;

// Custom authenticated request type
type AuthenticatedRequest = express.Request & {
  requestId?: string;
  startTime?: number;
  user?: {
    id: string;
    email?: string;
    roles?: string[];
    sessionId?: string;
  };
};

import { SLATrackingService } from './SLATrackingService';
import { SLABreachDetectionService } from './SLABreachDetectionService';
import { SLAReportingService } from './SLAReportingService';
import { SLAHistoricalAnalysisService } from './SLAHistoricalAnalysisService';
import { SLAComplianceScoringService } from './SLAComplianceScoringService';
import { SLACustomerNotificationService } from './SLACustomerNotificationService';
import {
  SLADefinition,
  SLAMetric,
  SLABreach,
  SLAComplianceScore,
  SLAReport,
  SLAReportType,
  SLAAnalysis,
  SLASeverity,
  SLAStatus
} from './SLADataModel';
import { ScoringContext } from './SLAComplianceScoringService';
import { AnalysisRequest } from './SLAHistoricalAnalysisService';
import { NotificationType } from './SLACustomerNotificationService';

export interface SLAManagementConfig {
  port: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableCors: boolean;
  enableCompression: boolean;
  maxPayloadSize: string;
  apiVersion: string;
  authenticationRequired: boolean;
  enableSwaggerDocs: boolean;
  metricsEnabled: boolean;
  allowedOrigins: string[];
  jwtSecret?: string;
  adminApiKey?: string;
}

export interface ServiceDependencies {
  trackingService: SLATrackingService;
  breachDetectionService: SLABreachDetectionService;
  reportingService: SLAReportingService;
  historicalAnalysisService: SLAHistoricalAnalysisService;
  complianceScoringService: SLAComplianceScoringService;
  customerNotificationService: SLACustomerNotificationService;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  requestId: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SLAQuery {
  slaId?: string;
  serviceId?: string;
  status?: SLAStatus;
  severity?: SLASeverity;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

export class SLAManagementController extends EventEmitter {
  private app: express.Application;
  private config: SLAManagementConfig;
  private services: ServiceDependencies;
  private server: any;
  private requestCount: number = 0;

  constructor(config: SLAManagementConfig, services: ServiceDependencies) {
    super();
    this.config = config;
    this.services = services;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: this.config.allowedOrigins.length > 0 ? this.config.allowedOrigins : true,
        credentials: true,
        optionsSuccessStatus: 200
      }));
    }

    // Compression
    if (this.config.enableCompression) {
      this.app.use(compression());
    }

    // Body parsing
    this.app.use(express.json({ limit: this.config.maxPayloadSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.maxPayloadSize }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later',
        timestamp: new Date()
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Request logging and tracking
    this.app.use((req: express.Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      this.requestCount++;
      authReq.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      authReq.startTime = Date.now();
      
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${authReq.requestId}`);
      
      res.on('finish', () => {
        const duration = Date.now() - (authReq.startTime || 0);
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        
        this.emit('requestCompleted', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          requestId: authReq.requestId
        });
      });
      
      next();
    });

    // Authentication middleware
    if (this.config.authenticationRequired) {
      this.app.use('/api', this.authenticateRequest.bind(this) as any);
    }
  }

  private setupRoutes(): void {
    const apiRouter = express.Router();

    // Health and status endpoints
    this.setupHealthRoutes(apiRouter);
    
    // SLA Definition Management
    this.setupSLADefinitionRoutes(apiRouter);
    
    // SLA Tracking and Metrics
    this.setupTrackingRoutes(apiRouter);
    
    // Breach Management
    this.setupBreachRoutes(apiRouter);
    
    // Compliance Scoring
    this.setupComplianceRoutes(apiRouter);
    
    // Historical Analysis
    this.setupAnalysisRoutes(apiRouter);
    
    // Reporting
    this.setupReportingRoutes(apiRouter);
    
    // Customer Notifications
    this.setupNotificationRoutes(apiRouter);
    
    // Administrative Operations
    this.setupAdminRoutes(apiRouter);

    this.app.use(`/api/${this.config.apiVersion}`, apiRouter);

    // Swagger documentation
    if (this.config.enableSwaggerDocs) {
      this.setupSwaggerDocs();
    }
  }

  private setupHealthRoutes(router: express.Router): void {
    // Health check
    router.get('/health', (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      this.sendResponse(res, {
        status: 'healthy',
        timestamp: new Date(),
        version: this.config.apiVersion,
        uptime: process.uptime(),
        requestCount: this.requestCount,
        services: {
          tracking: 'healthy',
          breachDetection: 'healthy',
          reporting: 'healthy',
          analysis: 'healthy',
          scoring: 'healthy',
          notifications: 'healthy'
        }
      });
    });

    // Readiness check
    router.get('/ready', (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      this.sendResponse(res, {
        ready: true,
        checks: {
          database: true,
          services: true,
          dependencies: true
        }
      });
    });

    // Metrics endpoint
    if (this.config.metricsEnabled) {
      router.get('/metrics', (req: Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        this.sendResponse(res, {
          requests: {
            total: this.requestCount,
            current: 0 // Would track active requests
          },
          performance: {
            averageResponseTime: 150, // Would calculate from actual metrics
            errorRate: 0.01
          },
          resources: {
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
          }
        });
      });
    }
  }

  private setupSLADefinitionRoutes(router: express.Router): void {
    // Create SLA definition
    router.post('/slas',
      [
        body('name').notEmpty().withMessage('SLA name is required') as any,
        body('serviceId').notEmpty().withMessage('Service ID is required') as any,
        body('targetValue').isNumeric().withMessage('Target value must be numeric') as any,
        body('unit').notEmpty().withMessage('Unit is required') as any,
        body('metricType').notEmpty().withMessage('Metric type is required')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaDefinition: Partial<SLADefinition> = req.body;
          
          // Add audit fields
          slaDefinition.createdAt = new Date();
          slaDefinition.updatedAt = new Date();
          slaDefinition.createdBy = authReq.user?.id || 'system';
          slaDefinition.version = 1;
          slaDefinition.id = this.generateSLAId();

          // Register with tracking service
          await this.services.trackingService.registerSLA(slaDefinition as SLADefinition);

          this.sendResponse(res, slaDefinition, 'SLA definition created successfully', 201);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get all SLA definitions
    router.get('/slas', async (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      try {
        const query: SLAQuery = req.query;
        const slas = await this.getSLADefinitions(query);
        
        this.sendResponse(res, slas);
      } catch (error: any) {
        this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
      }
    });

    // Get specific SLA definition
    router.get('/slas/:slaId',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const sla = await this.getSLADefinition(req.params.slaId);
          if (!sla) {
            return this.sendError(res, 'SLA not found', 404, authReq.requestId);
          }
          
          this.sendResponse(res, sla);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Update SLA definition
    router.put('/slas/:slaId',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const updates = req.body;
          
          updates.updatedAt = new Date();
          updates.updatedBy = authReq.user?.id || 'system';
          updates.version = (updates.version || 1) + 1;

          const updatedSLA = await this.updateSLADefinition(slaId, updates);
          
          this.sendResponse(res, updatedSLA, 'SLA definition updated successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Delete SLA definition
    router.delete('/slas/:slaId',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          await this.services.trackingService.unregisterSLA(req.params.slaId);
          
          this.sendResponse(res, null, 'SLA definition deleted successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );
  }

  private setupTrackingRoutes(router: express.Router): void {
    // Get SLA metrics
    router.get('/slas/:slaId/metrics',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const metric = await this.services.trackingService.getMetric(req.params.slaId);
          
          this.sendResponse(res, metric);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get metrics for multiple SLAs
    router.get('/metrics', async (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      try {
        const serviceId = req.query.serviceId as string;
        
        const metrics = serviceId 
          ? await this.services.trackingService.getMetricsByService(serviceId)
          : await this.services.trackingService.getAllMetrics();
        
        this.sendResponse(res, metrics);
      } catch (error: any) {
        this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
      }
    });

    // Get SLA history
    router.get('/slas/:slaId/history',
      [
        param('slaId').notEmpty().withMessage('SLA ID is required') as any,
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date') as any,
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date') as any,
        query('aggregationInterval').optional().isNumeric().withMessage('Aggregation interval must be numeric')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
          const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
          const aggregationInterval = req.query.aggregationInterval ? parseInt(req.query.aggregationInterval as string) : 3600000;

          const history = await this.services.trackingService.getSLAHistory(
            slaId,
            { start: startDate, end: endDate },
            aggregationInterval
          );
          
          this.sendResponse(res, history);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Start/stop SLA tracking
    router.post('/slas/:slaId/tracking/:action',
      [
        param('slaId').notEmpty().withMessage('SLA ID is required') as any,
        param('action').isIn(['start', 'stop']).withMessage('Action must be start or stop')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const action = req.params.action;

          if (action === 'start') {
            await this.services.trackingService.startTracking(slaId);
          } else {
            await this.services.trackingService.stopTracking(slaId);
          }
          
          this.sendResponse(res, null, `SLA tracking ${action}ed successfully`);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Force recalculation
    router.post('/slas/:slaId/recalculate',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          await this.services.trackingService.recalculate(req.params.slaId);
          
          this.sendResponse(res, null, 'SLA metrics recalculated successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );
  }

  private setupBreachRoutes(router: express.Router): void {
    // Get active breaches
    router.get('/breaches', async (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      try {
        const slaId = req.query.slaId as string;
        const breaches = await this.services.breachDetectionService.getActiveBreaches(slaId);
        
        this.sendResponse(res, breaches);
      } catch (error: any) {
        this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
      }
    });

    // Get breach history
    router.get('/slas/:slaId/breaches',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

          const breaches = await this.services.breachDetectionService.getBreachHistory(
            slaId,
            { start: startDate, end: endDate }
          );
          
          this.sendResponse(res, breaches);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Acknowledge breach
    router.post('/breaches/:breachId/acknowledge',
      [
        param('breachId').notEmpty().withMessage('Breach ID is required') as any,
        body('comments').optional().isString().withMessage('Comments must be a string')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const breachId = req.params.breachId;
          const userId = authReq.user?.id || 'anonymous';
          const comments = req.body.comments;

          await this.services.breachDetectionService.acknowledgeBreachInternal(breachId, userId, comments);
          
          this.sendResponse(res, null, 'Breach acknowledged successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Resolve breach
    router.post('/breaches/:breachId/resolve',
      [
        param('breachId').notEmpty().withMessage('Breach ID is required') as any,
        body('resolution').notEmpty().withMessage('Resolution description is required')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const breachId = req.params.breachId;
          const userId = authReq.user?.id || 'anonymous';
          const resolution = req.body.resolution;

          await this.services.breachDetectionService.resolveBreach(breachId, userId, resolution);
          
          this.sendResponse(res, null, 'Breach resolved successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get breach statistics
    router.get('/breaches/statistics', async (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      try {
        const slaId = req.query.slaId as string;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const timeWindow = startDate && endDate ? { start: startDate, end: endDate } : undefined;

        const statistics = await this.services.breachDetectionService.getBreachStatistics(slaId, timeWindow);
        
        this.sendResponse(res, statistics);
      } catch (error: any) {
        this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
      }
    });
  }

  private setupComplianceRoutes(router: express.Router): void {
    // Calculate compliance score
    router.post('/slas/:slaId/compliance/calculate',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const timeRange = {
            start: req.body.startDate ? new Date(req.body.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: req.body.endDate ? new Date(req.body.endDate) : new Date()
          };

          // Mock context - in real implementation, would gather actual data
          const slaDefinition = await this.getSLADefinition(slaId);
          if (!slaDefinition) {
            return this.sendError(res, 'SLA not found', 404, authReq.requestId);
          }
          const context: ScoringContext = {
            slaDefinition,
            timeWindow: timeRange,
            metrics: await this.services.trackingService.getSLAHistory(slaId, timeRange),
            breaches: await this.services.breachDetectionService.getBreachHistory(slaId, timeRange),
            historicalScores: await this.services.complianceScoringService.getHistoricalScores(slaId, timeRange),
            businessContext: {
              criticalityLevel: 'medium' as const,
              businessHours: true,
              seasonalFactor: 1.0,
              userImpact: 0.5,
              revenueImpact: 0.3,
              contractualRequirements: {
                minimumScore: 85,
                penaltyThreshold: 80,
                bonusThreshold: 95
              }
            }
          };

          const score = await this.services.complianceScoringService.calculateComplianceScore(context);
          
          this.sendResponse(res, score);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get compliance grade
    router.get('/slas/:slaId/compliance/grade',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const score = parseFloat(req.query.score as string) || 85;
          const grade = await this.services.complianceScoringService.getComplianceGrade(score);
          
          this.sendResponse(res, grade);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get benchmark comparison
    router.get('/slas/:slaId/compliance/benchmark',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const score = parseFloat(req.query.score as string) || 85;
          const benchmark = await this.services.complianceScoringService.getBenchmarkComparison(slaId, score);
          
          this.sendResponse(res, benchmark);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get historical compliance scores
    router.get('/slas/:slaId/compliance/history',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

          const scores = await this.services.complianceScoringService.getHistoricalScores(
            slaId,
            { start: startDate, end: endDate }
          );
          
          this.sendResponse(res, scores);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );
  }

  private setupAnalysisRoutes(router: express.Router): void {
    // Perform historical analysis
    router.post('/analysis/historical',
      [
        body('slaIds').isArray().withMessage('SLA IDs must be an array') as any,
        body('timeRange.start').isISO8601().withMessage('Start date must be valid ISO8601 date') as any,
        body('timeRange.end').isISO8601().withMessage('End date must be valid ISO8601 date') as any,
        body('analysisTypes').isArray().withMessage('Analysis types must be an array')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const request: AnalysisRequest = {
            slaIds: req.body.slaIds,
            timeRange: {
              start: new Date(req.body.timeRange.start),
              end: new Date(req.body.timeRange.end)
            },
            analysisTypes: req.body.analysisTypes || ['trends', 'patterns', 'anomalies'],
            granularity: (req.body.granularity || 'hour') as 'hour' | 'day' | 'week' | 'month',
            includeBaseline: req.body.includeBaseline || false,
            compareWithPrevious: req.body.compareWithPrevious || false
          };

          const analyses = await this.services.historicalAnalysisService.performHistoricalAnalysis(request);
          
          this.sendResponse(res, analyses);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get specific SLA analysis
    router.get('/slas/:slaId/analysis',
      [(param('slaId').notEmpty().withMessage('SLA ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const slaId = req.params.slaId;
          const request = {
            slaIds: [slaId],
            timeRange: {
              start: req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: req.query.endDate ? new Date(req.query.endDate as string) : new Date()
            },
            analysisTypes: req.query.types ? (req.query.types as string).split(',') : ['trends', 'patterns', 'anomalies'],
            granularity: (req.query.granularity || 'hour') as 'hour' | 'day' | 'week' | 'month',
            includeBaseline: req.query.includeBaseline === 'true',
            compareWithPrevious: req.query.compareWithPrevious === 'true'
          };

          const analysis = await this.services.historicalAnalysisService.analyzeSLA(slaId, request as AnalysisRequest);
          
          this.sendResponse(res, analysis);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );
  }

  private setupReportingRoutes(router: express.Router): void {
    // Generate report
    router.post('/reports',
      [
        body('type').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom_period']).withMessage('Invalid report type') as any,
        body('title').notEmpty().withMessage('Report title is required') as any,
        body('timeRange.start').isISO8601().withMessage('Start date must be valid ISO8601 date') as any,
        body('timeRange.end').isISO8601().withMessage('End date must be valid ISO8601 date')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const request = {
            templateId: req.body.templateId,
            type: req.body.type as SLAReportType,
            title: req.body.title,
            description: req.body.description,
            timeRange: {
              start: new Date(req.body.timeRange.start),
              end: new Date(req.body.timeRange.end)
            },
            slaIds: req.body.slaIds,
            serviceIds: req.body.serviceIds,
            filters: req.body.filters,
            format: req.body.format,
            recipients: req.body.recipients,
            requestedBy: authReq.user?.id || 'anonymous'
          };

          const report = await this.services.reportingService.generateReport(request);
          
          this.sendResponse(res, report, 'Report generated successfully', 201);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get report history
    router.get('/reports', async (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      try {
        const options = {
          type: req.query.type as SLAReportType,
          generatedBy: req.query.generatedBy as string,
          timeRange: req.query.startDate && req.query.endDate ? {
            start: new Date(req.query.startDate as string),
            end: new Date(req.query.endDate as string)
          } : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
        };

        const reports = await this.services.reportingService.getReportHistory(options);
        
        this.sendResponse(res, reports);
      } catch (error: any) {
        this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
      }
    });

    // Create dashboard
    router.post('/dashboards',
      [
        body('name').notEmpty().withMessage('Dashboard name is required') as any,
        body('widgets').isArray().withMessage('Widgets must be an array')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const config = {
            name: req.body.name,
            description: req.body.description || '',
            widgets: req.body.widgets,
            layout: req.body.layout || { columns: 12, theme: 'light', refreshInterval: 30000, enableRealTime: true, widgets: [] },
            permissions: req.body.permissions || [{ userId: authReq.user?.id || 'anonymous', role: 'admin' }],
            isDefault: req.body.isDefault || false,
            createdBy: authReq.user?.id || 'anonymous'
          };

          const dashboard = await this.services.reportingService.createDashboard(config);
          
          this.sendResponse(res, dashboard, 'Dashboard created successfully', 201);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get dashboard data
    router.get('/dashboards/:dashboardId',
      [(param('dashboardId').notEmpty().withMessage('Dashboard ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const dashboardId = req.params.dashboardId;
          const userId = authReq.user?.id || 'anonymous';

          const dashboardData = await this.services.reportingService.getDashboardData(dashboardId, userId);
          
          this.sendResponse(res, dashboardData);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Export report
    router.post('/reports/:reportId/export',
      [
        param('reportId').notEmpty().withMessage('Report ID is required') as any,
        body('format').isIn(['pdf', 'html', 'excel', 'csv', 'json']).withMessage('Invalid export format')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          // Would implement report export
          this.sendResponse(res, { exportUrl: `/exports/${req.params.reportId}.${req.body.format}` });
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );
  }

  private setupNotificationRoutes(router: express.Router): void {
    // Send customer notification
    router.post('/notifications',
      [
        body('customerId').notEmpty().withMessage('Customer ID is required') as any,
        body('type').notEmpty().withMessage('Notification type is required') as any,
        body('subject').notEmpty().withMessage('Subject is required')      ],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const request = {
            customerId: req.body.customerId,
            type: req.body.type,
            severity: req.body.severity || 'medium',
            subject: req.body.subject,
            data: req.body.data || {},
            templateOverride: req.body.templateOverride,
            channelOverride: req.body.channelOverride,
            urgency: req.body.urgency,
            scheduledTime: req.body.scheduledTime ? new Date(req.body.scheduledTime) : undefined
          };

          const notificationId = await this.services.customerNotificationService.sendCustomerNotification(request);
          
          this.sendResponse(res, { notificationId }, 'Notification sent successfully', 201);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Get notification history
    router.get('/customers/:customerId/notifications',
      [(param('customerId').notEmpty().withMessage('Customer ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const customerId = req.params.customerId;
          const options = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            types: req.query.types ? (req.query.types as string).split(',').map(t => t as NotificationType) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
          };

          const history = await this.services.customerNotificationService.getNotificationHistory(customerId, options);
          
          this.sendResponse(res, history);
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Update customer preferences
    router.put('/customers/:customerId/preferences',
      [(param('customerId').notEmpty().withMessage('Customer ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const customerId = req.params.customerId;
          const preferences = req.body;

          await this.services.customerNotificationService.updateCustomerPreferences(customerId, preferences);
          
          this.sendResponse(res, null, 'Preferences updated successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Acknowledge notification
    router.post('/notifications/:notificationId/acknowledge',
      [(param('notificationId').notEmpty().withMessage('Notification ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const notificationId = req.params.notificationId;
          const customerId = req.body.customerId;

          await this.services.customerNotificationService.acknowledgeNotification(customerId, notificationId);
          
          this.sendResponse(res, null, 'Notification acknowledged successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );

    // Unsubscribe customer
    router.post('/customers/:customerId/unsubscribe',
      [(param('customerId').notEmpty().withMessage('Customer ID is required') as any)],
      this.validateRequest,
      async (req: express.Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        try {
          const customerId = req.params.customerId;
          const categories = req.body.categories;

          await this.services.customerNotificationService.unsubscribeCustomer(customerId, categories);
          
          this.sendResponse(res, null, 'Customer unsubscribed successfully');
        } catch (error: any) {
          this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
        }
      }
    );
  }

  private setupAdminRoutes(router: express.Router): void {
    // Admin middleware
    const adminAuth = (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      const adminKey = req.headers['x-admin-key'];
      if (this.config.adminApiKey && adminKey !== this.config.adminApiKey) {
        return this.sendError(res, 'Unauthorized admin access', 401, authReq.requestId);
      }
      next();
    };

    // System status
    router.get('/admin/status', adminAuth, (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      this.sendResponse(res, {
        system: 'SLA Management System',
        version: this.config.apiVersion,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        requests: this.requestCount,
        services: {
          tracking: 'operational',
          breachDetection: 'operational',
          reporting: 'operational',
          analysis: 'operational',
          scoring: 'operational',
          notifications: 'operational'
        }
      });
    });

    // Bulk operations
    router.post('/admin/bulk-recalculate', adminAuth, async (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      try {
        await this.services.trackingService.recalculateAll();
        
        this.sendResponse(res, null, 'Bulk recalculation initiated');
      } catch (error: any) {
        this.sendError(res, error instanceof Error ? error.message : 'Unknown error', 500, authReq.requestId);
      }
    });

    // System configuration
    router.get('/admin/config', adminAuth, (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      const config = { ...this.config };
      delete config.jwtSecret;
      delete config.adminApiKey;
      
      this.sendResponse(res, config);
    });
  }

  private setupSwaggerDocs(): void {
    // Would implement Swagger/OpenAPI documentation
    this.app.get('/docs', (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      res.send(`
        <html>
          <head><title>SLA Management API Documentation</title></head>
          <body>
            <h1>SLA Management API Documentation</h1>
            <p>API Version: ${this.config.apiVersion}</p>
            <p>Base URL: /api/${this.config.apiVersion}</p>
            <h2>Available Endpoints:</h2>
            <ul>
              <li>GET /health - Health check</li>
              <li>GET /ready - Readiness check</li>
              <li>GET /metrics - System metrics</li>
              <li>POST /slas - Create SLA definition</li>
              <li>GET /slas - List SLA definitions</li>
              <li>GET /slas/{slaId} - Get SLA definition</li>
              <li>PUT /slas/{slaId} - Update SLA definition</li>
              <li>DELETE /slas/{slaId} - Delete SLA definition</li>
              <li>GET /slas/{slaId}/metrics - Get SLA metrics</li>
              <li>GET /metrics - Get all metrics</li>
              <li>GET /slas/{slaId}/history - Get SLA history</li>
              <li>POST /slas/{slaId}/tracking/{action} - Start/stop tracking</li>
              <li>POST /slas/{slaId}/recalculate - Force recalculation</li>
              <li>GET /breaches - Get active breaches</li>
              <li>GET /slas/{slaId}/breaches - Get breach history</li>
              <li>POST /breaches/{breachId}/acknowledge - Acknowledge breach</li>
              <li>POST /breaches/{breachId}/resolve - Resolve breach</li>
              <li>GET /breaches/statistics - Get breach statistics</li>
              <li>POST /slas/{slaId}/compliance/calculate - Calculate compliance score</li>
              <li>GET /slas/{slaId}/compliance/grade - Get compliance grade</li>
              <li>GET /slas/{slaId}/compliance/benchmark - Get benchmark comparison</li>
              <li>GET /slas/{slaId}/compliance/history - Get historical scores</li>
              <li>POST /analysis/historical - Perform historical analysis</li>
              <li>GET /slas/{slaId}/analysis - Get SLA analysis</li>
              <li>POST /reports - Generate report</li>
              <li>GET /reports - Get report history</li>
              <li>POST /dashboards - Create dashboard</li>
              <li>GET /dashboards/{dashboardId} - Get dashboard data</li>
              <li>POST /reports/{reportId}/export - Export report</li>
              <li>POST /notifications - Send customer notification</li>
              <li>GET /customers/{customerId}/notifications - Get notification history</li>
              <li>PUT /customers/{customerId}/preferences - Update preferences</li>
              <li>POST /notifications/{notificationId}/acknowledge - Acknowledge notification</li>
              <li>POST /customers/{customerId}/unsubscribe - Unsubscribe customer</li>
            </ul>
          </body>
        </html>
      `);
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: express.Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      this.sendError(res, `Route ${req.originalUrl} not found`, 404, authReq.requestId);
    });

    // Global error handler
    this.app.use((error: Error, req: express.Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      console.error('Unhandled error:', error);
      this.sendError(res, 'Internal server error', 500, authReq.requestId);
    });
  }

  private authenticateRequest(req: express.Request, res: Response, next: NextFunction): void {
    const authReq = req as AuthenticatedRequest;
    // Skip auth for health checks
    if (req.path.includes('/health') || req.path.includes('/ready')) {
      return next();
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return this.sendError(res, 'Authentication token required', 401, authReq.requestId);
    }

    try {
      // Mock JWT verification - in real implementation, would verify actual JWT
      (authReq as any).user = { id: 'user123', email: 'user@example.com', roles: ['admin'] };
      next();
    } catch (error: any) {
      this.sendError(res, 'Invalid authentication token', 401, authReq.requestId);
    }
  }

  private validateRequest = (req: express.Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return this.sendError(res, 'Validation failed', 400, authReq.requestId, errors.array());
    }
    next();
  };

  private sendResponse<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: APIResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date(),
      requestId: ((res as any).req as AuthenticatedRequest)?.requestId || 'unknown'
    };
    
    res.status(statusCode).json(response);
  }

  private sendError(res: Response, error: string, statusCode: number = 500, requestId?: string, details?: any): void {
    const response: APIResponse = {
      success: false,
      error,
      timestamp: new Date(),
      requestId: requestId || 'unknown'
    };

    if (details) {
      response.details = details;
    }
    
    res.status(statusCode).json(response);
  }

  private async getSLADefinitions(query: SLAQuery): Promise<SLADefinition[]> {
    // Mock implementation - would query actual storage
    return [];
  }

  private async getSLADefinition(slaId: string): Promise<SLADefinition | null> {
    // Mock implementation - would query actual storage
    return null;
  }

  private async updateSLADefinition(slaId: string, updates: Partial<SLADefinition>): Promise<SLADefinition> {
    // Mock implementation - would update actual storage
    return updates as SLADefinition;
  }

  private generateSLAId(): string {
    return `sla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`SLA Management API server started on port ${this.config.port}`);
        console.log(`API Documentation available at http://localhost:${this.config.port}/docs`);
        this.emit('serverStarted', { port: this.config.port });
        resolve();
      });
    });
  }

  async shutdown(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('SLA Management API server shut down');
          this.emit('serverShutdown');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Extend Express Request interface to include custom properties
// declare global {
//   namespace Express {
//     interface Request {
//       requestId: string;
//       startTime: number;
//       user?: { id: string; role: string };
//     }
//   }
// }



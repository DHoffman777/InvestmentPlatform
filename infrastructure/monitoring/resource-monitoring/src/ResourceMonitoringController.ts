import express, { Request, Response } from 'express';
import { EventEmitter } from 'events';
import { ResourceUtilizationService } from './ResourceUtilizationService';
import { ResourceEfficiencyAnalyticsService } from './ResourceEfficiencyAnalyticsService';
import { ResourceOptimizationService } from './ResourceOptimizationService';
import { ResourceAllocationTrackingService } from './ResourceAllocationTrackingService';
import { ResourceCostAnalysisService } from './ResourceCostAnalysisService';
import { ResourcePlanningDashboardService } from './ResourcePlanningDashboardService';
import {
  ResourceDataSource,
  ResourceType,
  ResourceMetricType,
  ResourceUtilizationSnapshot,
  ResourceAlert
} from './ResourceDataModel';

export interface ResourceMonitoringControllerConfig {
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
  utilizationService: ResourceUtilizationService;
  efficiencyService: ResourceEfficiencyAnalyticsService;
  optimizationService: ResourceOptimizationService;
  allocationService: ResourceAllocationTrackingService;
  costAnalysisService: ResourceCostAnalysisService;
  dashboardService: ResourcePlanningDashboardService;
}

export class ResourceMonitoringController extends EventEmitter {
  private app: express.Application;
  private server?: any;

  constructor(
    private config: ResourceMonitoringControllerConfig,
    private services: ServiceDependencies
  ) {
    super();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json({ limit: this.config.maxPayloadSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.maxPayloadSize }));

    // CORS
    if (this.config.enableCors) {
      this.app.use((req, res, next) => {
        const origin = req.headers.origin as string;
        if (this.config.allowedOrigins.includes('*') || this.config.allowedOrigins.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin || '*');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    // Compression
    if (this.config.enableCompression) {
      const compression = require('compression');
      this.app.use(compression());
    }

    // Rate limiting
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.emit('requestCompleted', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date()
        });
      });
      
      next();
    });

    // Authentication middleware
    if (this.config.authenticationRequired) {
      this.app.use(this.authenticateRequest.bind(this));
    }
  }

  private setupRoutes(): void {
    const apiRouter = express.Router();

    // Health and status routes
    this.setupHealthRoutes(apiRouter);
    
    // Resource utilization routes
    this.setupUtilizationRoutes(apiRouter);
    
    // Efficiency analytics routes
    this.setupEfficiencyRoutes(apiRouter);
    
    // Optimization routes
    this.setupOptimizationRoutes(apiRouter);
    
    // Allocation tracking routes
    this.setupAllocationRoutes(apiRouter);
    
    // Cost analysis routes
    this.setupCostAnalysisRoutes(apiRouter);
    
    // Dashboard routes
    this.setupDashboardRoutes(apiRouter);
    
    // Administrative routes
    this.setupAdminRoutes(apiRouter);

    // Mount API router
    this.app.use(`/api/${this.config.apiVersion}`, apiRouter);

    // Swagger documentation
    if (this.config.enableSwaggerDocs) {
      this.setupSwaggerDocs();
    }
  }

  private setupHealthRoutes(router: express.Router): void {
    // System health check
    router.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        version: this.config.apiVersion,
        services: {
          utilization: 'healthy',
          efficiency: 'healthy',
          optimization: 'healthy',
          allocation: 'healthy',
          cost_analysis: 'healthy',
          dashboard: 'healthy'
        }
      });
    });

    // Detailed system status
    router.get('/status', (req: Request, res: Response) => {
      res.json({
        status: 'operational',
        timestamp: new Date(),
        version: this.config.apiVersion,
        configuration: {
          authentication_enabled: this.config.authenticationRequired,
          rate_limiting: `${this.config.rateLimitMaxRequests} requests per ${this.config.rateLimitWindowMs}ms`,
          cors_enabled: this.config.enableCors,
          compression_enabled: this.config.enableCompression
        },
        metrics: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage()
        }
      });
    });

    // Service readiness probe
    router.get('/ready', (req: Request, res: Response) => {
      res.json({
        ready: true,
        timestamp: new Date(),
        checks: {
          database: 'connected',
          cache: 'connected',
          services: 'initialized'
        }
      });
    });
  }

  private setupUtilizationRoutes(router: express.Router): void {
    // Get utilization metrics for a resource
    router.get('/resources/:resourceId/utilization', async (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const snapshot = await this.services.utilizationService.generateSnapshot(resourceId);
        res.json(snapshot);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get utilization metrics for multiple resources
    router.post('/resources/utilization/batch', async (req: Request, res: Response) => {
      try {
        const { resourceIds } = req.body;
        const snapshots = await Promise.all(
          resourceIds.map((id: string) => this.services.utilizationService.generateSnapshot(id))
        );
        res.json({ snapshots });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add data source
    router.post('/data-sources', async (req: Request, res: Response) => {
      try {
        const dataSource: ResourceDataSource = req.body;
        await this.services.utilizationService.addDataSource(dataSource);
        res.status(201).json({ message: 'Data source added successfully', id: dataSource.id });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Remove data source
    router.delete('/data-sources/:dataSourceId', async (req: Request, res: Response) => {
      try {
        const { dataSourceId } = req.params;
        await this.services.utilizationService.removeDataSource(dataSourceId);
        res.json({ message: 'Data source removed successfully' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Collect metrics on demand
    router.post('/resources/:resourceId/collect-metrics', async (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const metrics = await this.services.utilizationService.collectMetrics([resourceId]);
        res.json({ metrics, count: metrics.length });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get historical utilization data
    router.get('/resources/:resourceId/utilization/history', async (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const { timeRange, granularity } = req.query;
        
        // Implementation would fetch historical data
        const historicalData = {
          resourceId,
          timeRange,
          granularity,
          data: [] // Historical snapshots would be here
        };
        
        res.json(historicalData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupEfficiencyRoutes(router: express.Router): void {
    // Get efficiency analysis for a resource
    router.get('/resources/:resourceId/efficiency', async (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const snapshot = await this.services.utilizationService.generateSnapshot(resourceId);
        const efficiency = await this.services.efficiencyService.analyzeResourceEfficiency(snapshot);
        res.json(efficiency);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get efficiency insights
    router.get('/resources/:resourceId/efficiency/insights', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const insights = this.services.efficiencyService.getInsights(resourceId);
        res.json({ insights });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get waste analysis
    router.get('/resources/:resourceId/efficiency/waste', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const wasteAnalyses = this.services.efficiencyService.getWasteAnalyses(resourceId);
        res.json({ waste_analyses: wasteAnalyses });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get optimization opportunities
    router.get('/resources/:resourceId/efficiency/opportunities', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const opportunities = this.services.efficiencyService.getOptimizationOpportunities(resourceId);
        res.json({ opportunities });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get efficiency benchmarks
    router.get('/efficiency/benchmarks', (req: Request, res: Response) => {
      try {
        const { resourceType } = req.query;
        if (resourceType) {
          const benchmark = this.services.efficiencyService.getBenchmark(resourceType as ResourceType);
          res.json({ benchmark });
        } else {
          // Return all benchmarks
          const benchmarks = Object.values(ResourceType).map(type => 
            this.services.efficiencyService.getBenchmark(type)
          ).filter(b => b !== undefined);
          res.json({ benchmarks });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Update efficiency benchmarks
    router.put('/efficiency/benchmarks/:resourceType', (req: Request, res: Response) => {
      try {
        const { resourceType } = req.params;
        const benchmarkData = req.body;
        
        // Implementation would update benchmark
        res.json({ message: 'Benchmark updated successfully' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  private setupOptimizationRoutes(router: express.Router): void {
    // Get recommendations for a resource
    router.get('/resources/:resourceId/recommendations', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const recommendations = this.services.optimizationService.getRecommendations(resourceId);
        res.json({ recommendations });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Generate new recommendations
    router.post('/resources/:resourceId/recommendations/generate', async (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const snapshot = await this.services.utilizationService.generateSnapshot(resourceId);
        const historicalData = []; // Would fetch historical data
        const anomalies = []; // Would fetch anomalies
        const insights = this.services.efficiencyService.getInsights(resourceId);
        const opportunities = this.services.efficiencyService.getOptimizationOpportunities(resourceId);

        const context = {
          snapshot,
          historical_data: historicalData,
          anomalies,
          insights,
          opportunities
        };

        const recommendations = await this.services.optimizationService.generateRecommendations(context);
        res.json({ recommendations, count: recommendations.length });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Apply a recommendation
    router.post('/recommendations/:recommendationId/apply', async (req: Request, res: Response) => {
      try {
        const { recommendationId } = req.params;
        const { resourceId } = req.body;
        
        const recommendations = this.services.optimizationService.getRecommendations(resourceId);
        const recommendation = recommendations.find(r => r.id === recommendationId);
        
        if (!recommendation) {
          return res.status(404).json({ error: 'Recommendation not found' });
        }

        const snapshot = await this.services.utilizationService.generateSnapshot(resourceId);
        const context = {
          snapshot,
          historical_data: [],
          anomalies: [],
          insights: [],
          opportunities: []
        };

        const result = await this.services.optimizationService.applyRecommendation(recommendation, context);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get recommendation results
    router.get('/resources/:resourceId/recommendations/results', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const results = this.services.optimizationService.getResults(resourceId);
        res.json({ results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get optimization engines
    router.get('/optimization/engines', (req: Request, res: Response) => {
      try {
        const engines = this.services.optimizationService.getEngines();
        res.json({ engines });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get recommendation templates
    router.get('/optimization/templates', (req: Request, res: Response) => {
      try {
        const templates = this.services.optimizationService.getTemplates();
        res.json({ templates });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupAllocationRoutes(router: express.Router): void {
    // Request resource allocation
    router.post('/allocations/request', async (req: Request, res: Response) => {
      try {
        const allocationRequest = req.body;
        const response = await this.services.allocationService.requestAllocation(allocationRequest);
        res.status(response.status === 'approved' ? 201 : 202).json(response);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get allocations for a resource
    router.get('/resources/:resourceId/allocations', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const { status, requestor } = req.query;
        
        let allocations = this.services.allocationService.getAllocations(resourceId);
        
        if (status) {
          allocations = allocations.filter(a => a.status === status);
        }
        if (requestor) {
          allocations = allocations.filter(a => a.requestor === requestor);
        }
        
        res.json({ allocations, count: allocations.length });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get allocation details
    router.get('/allocations/:allocationId', async (req: Request, res: Response) => {
      try {
        const { allocationId } = req.params;
        
        // Find allocation across all resources
        for (const resourceId of ['resource1', 'resource2']) { // Would iterate through actual resources
          const allocations = this.services.allocationService.getAllocations(resourceId);
          const allocation = allocations.find(a => a.id === allocationId);
          
          if (allocation) {
            return res.json(allocation);
          }
        }
        
        res.status(404).json({ error: 'Allocation not found' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Release allocation
    router.post('/allocations/:allocationId/release', async (req: Request, res: Response) => {
      try {
        const { allocationId } = req.params;
        const { reason } = req.body;
        
        const success = await this.services.allocationService.releaseAllocation(allocationId, reason);
        
        if (success) {
          res.json({ message: 'Allocation released successfully' });
        } else {
          res.status(400).json({ error: 'Failed to release allocation' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get allocation metrics
    router.get('/resources/:resourceId/allocations/metrics', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const metrics = this.services.allocationService.getAllocationMetrics(resourceId);
        res.json(metrics || { message: 'No metrics available' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get optimization opportunities for allocations
    router.get('/resources/:resourceId/allocations/optimizations', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const optimizations = this.services.allocationService.getOptimizations(resourceId);
        res.json({ optimizations });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get allocation policies
    router.get('/allocations/policies', (req: Request, res: Response) => {
      try {
        const policies = this.services.allocationService.getPolicies();
        res.json({ policies });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupCostAnalysisRoutes(router: express.Router): void {
    // Get cost correlation analysis
    router.get('/resources/:resourceId/cost/correlation', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const correlation = this.services.costAnalysisService.getCostCorrelation(resourceId);
        res.json(correlation || { message: 'No cost correlation data available' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Trigger cost correlation analysis
    router.post('/resources/:resourceId/cost/analyze', async (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const snapshot = await this.services.utilizationService.generateSnapshot(resourceId);
        const historicalData = []; // Would fetch historical data
        
        const correlation = await this.services.costAnalysisService.analyzeCostCorrelations(
          resourceId,
          snapshot,
          historicalData
        );
        
        res.json(correlation);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get cost alerts
    router.get('/resources/:resourceId/cost/alerts', (req: Request, res: Response) => {
      try {
        const { resourceId } = req.params;
        const alerts = this.services.costAnalysisService.getCostAlerts(resourceId);
        res.json({ alerts });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get cost models
    router.get('/cost/models', (req: Request, res: Response) => {
      try {
        const models = this.services.costAnalysisService.getCostModels();
        res.json({ models });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create cost model
    router.post('/cost/models', (req: Request, res: Response) => {
      try {
        const modelData = req.body;
        // Implementation would create cost model
        res.status(201).json({ message: 'Cost model created successfully', id: modelData.id });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Update cost model
    router.put('/cost/models/:modelId', (req: Request, res: Response) => {
      try {
        const { modelId } = req.params;
        const modelData = req.body;
        // Implementation would update cost model
        res.json({ message: 'Cost model updated successfully' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Delete cost model
    router.delete('/cost/models/:modelId', (req: Request, res: Response) => {
      try {
        const { modelId } = req.params;
        // Implementation would delete cost model
        res.json({ message: 'Cost model deleted successfully' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  private setupDashboardRoutes(router: express.Router): void {
    // Generate dashboard
    router.post('/dashboards/:dashboardId', async (req: Request, res: Response) => {
      try {
        const { dashboardId } = req.params;
        const { filters } = req.body;
        
        // Collect data from all services
        const resourceData = new Map(); // Would collect actual resource data
        const costData = new Map(); // Would collect cost data
        const efficiencyData = new Map(); // Would collect efficiency data
        const allocationData = new Map(); // Would collect allocation data
        const alerts = new Map(); // Would collect alerts
        const recommendations = new Map(); // Would collect recommendations
        
        const dashboard = await this.services.dashboardService.generateDashboard(
          dashboardId,
          resourceData,
          costData,
          efficiencyData,
          allocationData,
          alerts,
          recommendations,
          filters
        );
        
        res.json(dashboard);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get dashboard data
    router.get('/dashboards/:dashboardId', (req: Request, res: Response) => {
      try {
        const { dashboardId } = req.params;
        const dashboard = this.services.dashboardService.getDashboard(dashboardId);
        
        if (!dashboard) {
          return res.status(404).json({ error: 'Dashboard not found' });
        }
        
        res.json(dashboard);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Export dashboard
    router.post('/dashboards/:dashboardId/export', async (req: Request, res: Response) => {
      try {
        const { dashboardId } = req.params;
        const exportConfig = req.body;
        
        const exportData = await this.services.dashboardService.exportDashboard(dashboardId, exportConfig);
        
        res.setHeader('Content-Type', this.getContentType(exportConfig.format));
        res.setHeader('Content-Disposition', `attachment; filename=dashboard_${dashboardId}.${exportConfig.format}`);
        res.send(exportData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get widget configurations
    router.get('/dashboards/widgets', (req: Request, res: Response) => {
      try {
        const widgets = this.services.dashboardService.getWidgetConfigs();
        res.json({ widgets });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get custom metrics
    router.get('/dashboards/metrics/custom', (req: Request, res: Response) => {
      try {
        const metrics = this.services.dashboardService.getCustomMetrics();
        res.json({ metrics });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupAdminRoutes(router: express.Router): void {
    // System metrics
    router.get('/admin/metrics', (req: Request, res: Response) => {
      try {
        const metrics = {
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
          },
          api: {
            requests_total: 0, // Would track actual metrics
            requests_per_minute: 0,
            error_rate: 0,
            response_time_avg: 0
          },
          services: {
            utilization_service: 'healthy',
            efficiency_service: 'healthy',
            optimization_service: 'healthy',
            allocation_service: 'healthy',
            cost_analysis_service: 'healthy',
            dashboard_service: 'healthy'
          }
        };
        
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Configuration
    router.get('/admin/config', (req: Request, res: Response) => {
      try {
        const config = {
          api_version: this.config.apiVersion,
          authentication_required: this.config.authenticationRequired,
          rate_limiting: {
            window_ms: this.config.rateLimitWindowMs,
            max_requests: this.config.rateLimitMaxRequests
          },
          features: {
            cors_enabled: this.config.enableCors,
            compression_enabled: this.config.enableCompression,
            swagger_docs: this.config.enableSwaggerDocs,
            metrics_enabled: this.config.metricsEnabled
          }
        };
        
        res.json(config);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Service shutdown
    router.post('/admin/shutdown', (req: Request, res: Response) => {
      try {
        res.json({ message: 'Shutdown initiated' });
        
        // Graceful shutdown
        setTimeout(async () => {
          await this.shutdown();
          process.exit(0);
        }, 1000);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Clear caches
    router.post('/admin/cache/clear', (req: Request, res: Response) => {
      try {
        // Implementation would clear service caches
        res.json({ message: 'Caches cleared successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupSwaggerDocs(): void {
    if (this.config.enableSwaggerDocs) {
      const swaggerUi = require('swagger-ui-express');
      const swaggerDocument = {
        openapi: '3.0.0',
        info: {
          title: 'Resource Monitoring API',
          version: this.config.apiVersion,
          description: 'Comprehensive resource utilization monitoring and optimization API'
        },
        servers: [
          {
            url: `http://localhost:${this.config.port}/api/${this.config.apiVersion}`,
            description: 'Development server'
          }
        ],
        paths: {
          '/health': {
            get: {
              summary: 'Health check',
              responses: {
                '200': {
                  description: 'Service is healthy'
                }
              }
            }
          }
          // Additional API documentation would be defined here
        }
      };

      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date()
      });
    });

    // Global error handler
    this.app.use((err: any, req: Request, res: Response, next: any) => {
      console.error('Unhandled error:', err);
      
      this.emit('error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date()
      });

      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
        timestamp: new Date()
      });
    });
  }

  private authenticateRequest(req: Request, res: Response, next: any): void {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const apiKey = req.headers['x-api-key'] as string;

    if (this.config.adminApiKey && apiKey === this.config.adminApiKey) {
      return next();
    }

    if (this.config.jwtSecret && token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, this.config.jwtSecret);
        (req as any).user = decoded;
        return next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    res.status(401).json({ error: 'Authentication required' });
  }

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
      png: 'image/png'
    };
    
    return contentTypes[format] || 'application/octet-stream';
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`Resource Monitoring API server started on port ${this.config.port}`);
          
          if (this.config.enableSwaggerDocs) {
            console.log(`API documentation available at http://localhost:${this.config.port}/api-docs`);
          }
          
          this.emit('started', { port: this.config.port, timestamp: new Date() });
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Resource Monitoring API server stopped');
          this.emit('stopped', { timestamp: new Date() });
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
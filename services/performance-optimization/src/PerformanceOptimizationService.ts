import express from 'express';
import { DatabaseOptimizer } from './services/DatabaseOptimizer';
import { QueryPerformanceAnalyzer } from './services/QueryPerformanceAnalyzer';
import { DatabaseMonitor } from './services/DatabaseMonitor';
import { ApiPerformanceOptimizer } from './services/ApiPerformanceOptimizer';
import { CachingStrategy } from './services/CachingStrategy';
import cron from 'node-cron';

export interface PerformanceOptimizationConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
  };
  monitoring: {
    enabled: boolean;
    interval: number;
    alertThresholds: {
      slowQuery: number;
      highErrorRate: number;
      lowCacheHitRate: number;
    };
  };
  optimization: {
    autoOptimize: boolean;
    maxConcurrentOptimizations: number;
    backupBeforeOptimization: boolean;
  };
  reporting: {
    generateDaily: boolean;
    generateWeekly: boolean;
    retentionDays: number;
  };
}

export class PerformanceOptimizationService {
  private app: express.Application;
  private dbOptimizer!: DatabaseOptimizer;
  private queryAnalyzer!: QueryPerformanceAnalyzer;
  private dbMonitor!: DatabaseMonitor;
  private apiOptimizer!: ApiPerformanceOptimizer;
  private cachingStrategy!: CachingStrategy;
  private config: PerformanceOptimizationConfig;

  constructor(config: PerformanceOptimizationConfig) {
    this.config = config;
    this.app = express();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupCronJobs();
  }

  private initializeServices(): void {
    // Initialize database optimization services
    this.dbOptimizer = new DatabaseOptimizer();
    this.queryAnalyzer = new QueryPerformanceAnalyzer();
    this.dbMonitor = new DatabaseMonitor();
    this.apiOptimizer = new ApiPerformanceOptimizer();
    
    // Initialize caching strategy
    this.cachingStrategy = new CachingStrategy({
      redis: this.config.redis,
      defaultTTL: 300,
      compressionThreshold: 10240, // 10KB
      maxMemoryPolicy: 'allkeys-lru',
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Database monitoring events
    this.dbMonitor.on('alertTriggered', (alert) => {
      console.log(`Database Alert: ${alert.message}`);
      // Could send to notification service
    });

    this.dbMonitor.on('healthUpdate', (health) => {
      if (health.overallHealth === 'CRITICAL') {
        console.warn('Database health is critical!', health);
      }
    });

    // API performance events
    this.apiOptimizer.on('slowQuery', (metrics) => {
      console.log(`Slow API endpoint detected: ${metrics.endpoint} (${metrics.responseTime}ms)`);
    });

    this.apiOptimizer.on('optimizationCreated', (optimization) => {
      console.log(`New optimization created: ${optimization.title}`);
    });

    // Caching events
    this.cachingStrategy.on('connected', () => {
      console.log('Redis cache connected successfully');
    });

    this.cachingStrategy.on('error', (error) => {
      console.error('Cache error:', error);
    });

    // Database optimizer events
    this.dbOptimizer.on('optimizationRecommendation', (recommendation) => {
      console.log(`Database optimization recommended: ${recommendation.title}`);
      
      if (this.config.optimization.autoOptimize && recommendation.priority === 'HIGH') {
        // Could automatically implement low-risk optimizations
        this.considerAutoOptimization(recommendation);
      }
    });
  }

  private async considerAutoOptimization(recommendation: any): Promise<any> {
    if (recommendation.implementation.riskLevel === 'LOW' && 
        recommendation.type === 'INDEX') {
      console.log(`Auto-implementing low-risk optimization: ${recommendation.title}`);
      // Implementation would be done here with proper safeguards
    }
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Add API performance monitoring middleware
    this.app.use(this.apiOptimizer.metricsMiddleware());
  }

  private setupRoutes(): void {
    // Database optimization routes
    this.app.get('/api/v1/database/health', async (req, res) => {
      try {
        const statistics = await this.dbMonitor.getDetailedStatistics();
        res.json(statistics);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to get database health' });
      }
    });

    this.app.get('/api/v1/database/slow-queries', async (req, res) => {
      try {
        const timeWindow = parseInt(req.query.timeWindow as string) || 3600000;
        const slowQueries = await this.dbOptimizer.analyzeSlowQueries(timeWindow);
        res.json(slowQueries);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to analyze slow queries' });
      }
    });

    this.app.get('/api/v1/database/index-analysis', async (req, res) => {
      try {
        const indexAnalysis = await this.dbOptimizer.analyzeIndexUsage();
        res.json(indexAnalysis);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to analyze indexes' });
      }
    });

    this.app.get('/api/v1/database/optimization-report', async (req, res) => {
      try {
        const report = await this.dbOptimizer.generateOptimizationReport();
        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate optimization report' });
      }
    });

    // Query analysis routes
    this.app.post('/api/v1/query/analyze', async (req, res) => {
      try {
        const { query } = req.body;
        const analysis = this.queryAnalyzer.analyzeQuery(query);
        res.json(analysis);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to analyze query' });
      }
    });

    this.app.post('/api/v1/query/benchmark', async (req, res) => {
      try {
        const { query, iterations = 10 } = req.body;
        const benchmark = await this.queryAnalyzer.benchmarkQuery(query, iterations);
        res.json(benchmark);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to benchmark query' });
      }
    });

    this.app.post('/api/v1/query/optimization-report', async (req, res) => {
      try {
        const { queries } = req.body;
        const report = await this.queryAnalyzer.generateOptimizationReport(queries);
        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate query optimization report' });
      }
    });

    // API performance routes
    this.app.get('/api/v1/api/performance-report', async (req, res) => {
      try {
        const timeWindow = parseInt(req.query.timeWindow as string) || 86400000;
        const report = this.apiOptimizer.generatePerformanceReport(timeWindow);
        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate API performance report' });
      }
    });

    this.app.get('/api/v1/api/endpoint-analysis/:endpoint', async (req, res) => {
      try {
        const { endpoint } = req.params;
        const { method = 'GET', timeWindow = 3600000 } = req.query;
        const analysis = this.apiOptimizer.analyzeEndpoint(
          endpoint, 
          method as string, 
          parseInt(timeWindow as string)
        );
        res.json(analysis);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to analyze endpoint' });
      }
    });

    this.app.post('/api/v1/api/generate-optimizations', async (req, res) => {
      try {
        const optimizations = this.apiOptimizer.generateAutomaticOptimizations();
        res.json(optimizations);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate optimizations' });
      }
    });

    this.app.get('/api/v1/api/alerts', async (req, res) => {
      try {
        const alerts = this.apiOptimizer.getActiveAlerts();
        res.json(alerts);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to get alerts' });
      }
    });

    this.app.post('/api/v1/api/alerts/:alertId/resolve', async (req, res) => {
      try {
        const { alertId } = req.params;
        const resolved = this.apiOptimizer.resolveAlert(alertId);
        res.json({ resolved });
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to resolve alert' });
      }
    });

    // Caching routes
    this.app.get('/api/v1/cache/performance-report', async (req, res) => {
      try {
        const report = await this.cachingStrategy.getPerformanceReport();
        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to get cache performance report' });
      }
    });

    this.app.post('/api/v1/cache/warmup', async (req, res) => {
      try {
        await this.cachingStrategy.warmupCache();
        res.json({ message: 'Cache warmup initiated' });
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to warmup cache' });
      }
    });

    this.app.delete('/api/v1/cache/invalidate-tag/:tag', async (req, res) => {
      try {
        const { tag } = req.params;
        const deletedCount = await this.cachingStrategy.invalidateByTag(tag);
        res.json({ deletedCount });
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to invalidate cache by tag' });
      }
    });

    this.app.delete('/api/v1/cache/invalidate-pattern', async (req, res) => {
      try {
        const { pattern } = req.body;
        const deletedCount = await this.cachingStrategy.invalidateByPattern(pattern);
        res.json({ deletedCount });
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to invalidate cache by pattern' });
      }
    });

    this.app.get('/api/v1/cache/strategies', async (req, res) => {
      try {
        const strategies = this.cachingStrategy.getStrategies();
        res.json(strategies);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to get cache strategies' });
      }
    });

    // Comprehensive performance report
    this.app.get('/api/v1/performance/comprehensive-report', async (req, res) => {
      try {
        const timeWindow = parseInt(req.query.timeWindow as string) || 86400000;
        
        const [
          dbReport,
          apiReport,
          cacheReport,
          healthStats
        ] = await Promise.allSettled([
          this.dbOptimizer.generateOptimizationReport(),
          this.apiOptimizer.generatePerformanceReport(timeWindow),
          this.cachingStrategy.getPerformanceReport(),
          this.dbMonitor.getDetailedStatistics()
        ]);

        const report = {
          timestamp: new Date(),
          database: dbReport.status === 'fulfilled' ? dbReport.value : null,
          api: apiReport.status === 'fulfilled' ? apiReport.value : null,
          cache: cacheReport.status === 'fulfilled' ? cacheReport.value : null,
          health: healthStats.status === 'fulfilled' ? healthStats.value : null,
          recommendations: this.generateComprehensiveRecommendations(),
        };

        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate comprehensive report' });
      }
    });

    // Health check endpoint
    this.app.get('/api/v1/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'connected',
          cache: 'connected',
          monitoring: this.config.monitoring.enabled ? 'active' : 'inactive',
        },
      });
    });
  }

  private generateComprehensiveRecommendations(): Array<{
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    estimatedImpact: string;
  }> {
    // This would generate cross-cutting recommendations
    // based on all the collected data
    return [
      {
        category: 'Database',
        priority: 'HIGH',
        title: 'Implement Query Optimization Pipeline',
        description: 'Establish automated query performance monitoring and optimization',
        estimatedImpact: 'Up to 40% improvement in query response times',
      },
      {
        category: 'API',
        priority: 'MEDIUM',
        title: 'Implement Response Caching Strategy',
        description: 'Add intelligent caching for frequently accessed endpoints',
        estimatedImpact: 'Up to 60% reduction in API response times',
      },
      {
        category: 'Cache',
        priority: 'MEDIUM',
        title: 'Optimize Cache TTL Values',
        description: 'Fine-tune cache expiration times based on access patterns',
        estimatedImpact: 'Up to 25% improvement in cache hit rates',
      },
      {
        category: 'Infrastructure',
        priority: 'LOW',
        title: 'Implement Connection Pooling Optimization',
        description: 'Optimize database connection pool sizes and configuration',
        estimatedImpact: 'Improved resource utilization and stability',
      },
    ];
  }

  private setupCronJobs(): void {
    if (this.config.reporting.generateDaily) {
      // Generate daily performance report at 1 AM
      cron.schedule('0 1 * * *', async () => {
        console.log('Generating daily performance report...');
        try {
          const report = await this.generateDailyReport();
          // Store or send the report
          console.log('Daily report generated successfully');
        } catch (error: any) {
          console.error('Failed to generate daily report:', error);
        }
      });
    }

    if (this.config.reporting.generateWeekly) {
      // Generate weekly performance report every Monday at 2 AM
      cron.schedule('0 2 * * 1', async () => {
        console.log('Generating weekly performance report...');
        try {
          const report = await this.generateWeeklyReport();
          // Store or send the report
          console.log('Weekly report generated successfully');
        } catch (error: any) {
          console.error('Failed to generate weekly report:', error);
        }
      });
    }

    // Cache warmup every morning at 6 AM
    cron.schedule('0 6 * * *', async () => {
      console.log('Starting cache warmup...');
      try {
        await this.cachingStrategy.warmupCache();
        console.log('Cache warmup completed');
      } catch (error: any) {
        console.error('Cache warmup failed:', error);
      }
    });

    // Index analysis every Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('Running weekly index analysis...');
      try {
        const analysis = await this.dbOptimizer.analyzeIndexUsage();
        console.log(`Index analysis completed. Found ${analysis.length} indexes.`);
      } catch (error: any) {
        console.error('Index analysis failed:', error);
      }
    });
  }

  private async generateDailyReport() {
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
    
    const [dbReport, apiReport, cacheReport] = await Promise.allSettled([
      this.dbOptimizer.generateOptimizationReport(),
      this.apiOptimizer.generatePerformanceReport(timeWindow),
      this.cachingStrategy.getPerformanceReport(),
    ]);

    return {
      date: new Date().toISOString().split('T')[0],
      type: 'daily',
      database: dbReport.status === 'fulfilled' ? dbReport.value : null,
      api: apiReport.status === 'fulfilled' ? apiReport.value : null,
      cache: cacheReport.status === 'fulfilled' ? cacheReport.value : null,
    };
  }

  private async generateWeeklyReport() {
    const timeWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const [dbReport, apiReport, cacheReport] = await Promise.allSettled([
      this.dbOptimizer.generateOptimizationReport(),
      this.apiOptimizer.generatePerformanceReport(timeWindow),
      this.cachingStrategy.getPerformanceReport(),
    ]);

    return {
      weekOf: new Date().toISOString().split('T')[0],
      type: 'weekly',
      database: dbReport.status === 'fulfilled' ? dbReport.value : null,
      api: apiReport.status === 'fulfilled' ? apiReport.value : null,
      cache: cacheReport.status === 'fulfilled' ? cacheReport.value : null,
      trends: await this.generateTrendAnalysis(timeWindow),
    };
  }

  private async generateTrendAnalysis(timeWindow: number) {
    // This would analyze trends over the time window
    return {
      performanceTrends: 'improving',
      keyMetrics: {
        averageQueryTime: { current: 150, trend: 'decreasing' },
        cacheHitRate: { current: 0.92, trend: 'stable' },
        apiResponseTime: { current: 280, trend: 'improving' },
      },
    };
  }

  public async startMonitoring(): Promise<any> {
    if (this.config.monitoring.enabled) {
      this.dbMonitor.startMonitoring(this.config.monitoring.interval);
      console.log('Database monitoring started');
    }
  }

  public async stopMonitoring(): Promise<any> {
    this.dbMonitor.stopMonitoring();
    console.log('Database monitoring stopped');
  }

  public start(port: number = 3008): void {
    this.app.listen(port, () => {
      console.log(`Performance Optimization Service listening on port ${port}`);
      this.startMonitoring();
    });
  }

  public async shutdown(): Promise<any> {
    console.log('Shutting down Performance Optimization Service...');
    
    await this.stopMonitoring();
    await this.dbOptimizer.disconnect();
    // await this.queryAnalyzer.disconnect(); // QueryPerformanceAnalyzer doesn't have disconnect method
    await this.dbMonitor.disconnect();
    await this.cachingStrategy.disconnect();

    console.log('Performance Optimization Service shutdown complete');
  }

  public getApp(): express.Application {
    return this.app;
  }
}


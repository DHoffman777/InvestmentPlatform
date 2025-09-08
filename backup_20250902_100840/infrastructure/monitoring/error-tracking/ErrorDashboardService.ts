import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { PrismaClient } from '@prisma/client';
import { StructuredError, ErrorSeverity, ErrorCategory } from './ErrorTrackingService';

export interface DashboardMetrics {
  totalErrors: number;
  uniqueErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  averageResolutionTime: number;
  errorRate: number;
  topErrorCategories: CategoryMetric[];
  topAffectedServices: ServiceMetric[];
  errorTrends: TrendData[];
  performanceImpact: PerformanceMetric[];
}

export interface CategoryMetric {
  category: ErrorCategory;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  averageSeverity: number;
}

export interface ServiceMetric {
  service: string;
  errorCount: number;
  uniqueErrors: number;
  criticalCount: number;
  availability: number;
  responseTime: number;
}

export interface TrendData {
  timestamp: Date;
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  newErrors: number;
}

export interface PerformanceMetric {
  service: string;
  endpoint?: string;
  errorRate: number;
  responseTime: number;
  throughput: number;
  availability: number;
}

export interface ErrorSummary {
  fingerprint: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  count: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'high' | 'medium' | 'low';
}

export interface DashboardFilter {
  timeRange?: string; // '1h', '24h', '7d', '30d'
  severity?: ErrorSeverity[];
  category?: ErrorCategory[];
  services?: string[];
  environments?: string[];
  resolved?: boolean;
  minOccurrences?: number;
}

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  filters: DashboardFilter;
  metrics: string[];
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'html' | 'pdf' | 'json';
  };
  visualizations: VisualizationConfig[];
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'heatmap' | 'table' | 'gauge';
  title: string;
  dataSource: string;
  options: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  threshold: number;
  timeWindow: string;
  severity: ErrorSeverity;
  enabled: boolean;
  notificationChannels: string[];
}

export interface AlertCondition {
  metric: string; // 'error_rate', 'critical_errors', 'response_time', etc.
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  aggregation: 'count' | 'sum' | 'avg' | 'max' | 'min';
  filters?: DashboardFilter;
}

export class ErrorDashboardService extends EventEmitter {
  private logger: Logger;
  private prisma: PrismaClient;
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private reports: Map<string, ReportConfig> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.logger = this.createLogger();
    this.initializeDefaultReports();
    this.initializeDefaultAlerts();
    this.startMetricsUpdater();
  }

  private createLogger(): Logger {
    return createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({
          filename: 'logs/error-dashboard.log',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5
        }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }

  private initializeDefaultReports(): void {
    const defaultReports: ReportConfig[] = [
      {
        id: 'executive_summary',
        name: 'Executive Error Summary',
        description: 'High-level error metrics for executive reporting',
        filters: {
          timeRange: '24h',
          severity: [ErrorSeverity.CRITICAL, ErrorSeverity.HIGH]
        },
        metrics: [
          'totalErrors',
          'criticalErrors',
          'topErrorCategories',
          'topAffectedServices',
          'performanceImpact'
        ],
        schedule: {
          frequency: 'daily',
          recipients: ['executives@company.com'],
          format: 'pdf'
        },
        visualizations: [
          {
            type: 'gauge',
            title: 'System Health Score',
            dataSource: 'systemHealth',
            options: { min: 0, max: 100, unit: '%' }
          },
          {
            type: 'bar',
            title: 'Errors by Category',
            dataSource: 'topErrorCategories',
            options: { orientation: 'horizontal' }
          }
        ]
      },
      {
        id: 'operational_dashboard',
        name: 'Operational Error Dashboard',
        description: 'Detailed error tracking for operations team',
        filters: {
          timeRange: '1h'
        },
        metrics: [
          'totalErrors',
          'errorTrends',
          'topAffectedServices',
          'recentErrors'
        ],
        visualizations: [
          {
            type: 'line',
            title: 'Error Trends',
            dataSource: 'errorTrends',
            options: { interval: '5m' }
          },
          {
            type: 'table',
            title: 'Recent Errors',
            dataSource: 'recentErrors',
            options: { pageSize: 20 }
          }
        ]
      },
      {
        id: 'service_health',
        name: 'Service Health Report',
        description: 'Service-specific error analysis',
        filters: {
          timeRange: '24h'
        },
        metrics: [
          'topAffectedServices',
          'performanceImpact',
          'errorsByService'
        ],
        visualizations: [
          {
            type: 'heatmap',
            title: 'Service Error Heatmap',
            dataSource: 'serviceErrorMatrix',
            options: { colorScale: 'red' }
          }
        ]
      }
    ];

    defaultReports.forEach(report => {
      this.reports.set(report.id, report);
    });
  }

  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertRule[] = [
      {
        id: 'critical_error_spike',
        name: 'Critical Error Spike',
        description: 'Alert when critical errors exceed threshold',
        condition: {
          metric: 'critical_errors',
          operator: 'gt',
          aggregation: 'count'
        },
        threshold: 5,
        timeWindow: '5m',
        severity: ErrorSeverity.CRITICAL,
        enabled: true,
        notificationChannels: ['slack-alerts', 'email-oncall']
      },
      {
        id: 'error_rate_high',
        name: 'High Error Rate',
        description: 'Alert when error rate is unusually high',
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          aggregation: 'avg'
        },
        threshold: 5.0, // 5% error rate
        timeWindow: '10m',
        severity: ErrorSeverity.HIGH,
        enabled: true,
        notificationChannels: ['slack-alerts']
      },
      {
        id: 'trading_errors',
        name: 'Trading System Errors',
        description: 'Alert on any trading-related errors',
        condition: {
          metric: 'error_count',
          operator: 'gt',
          aggregation: 'count',
          filters: {
            category: [ErrorCategory.TRADING]
          }
        },
        threshold: 1,
        timeWindow: '1m',
        severity: ErrorSeverity.HIGH,
        enabled: true,
        notificationChannels: ['trading-alerts', 'email-trading-team']
      },
      {
        id: 'database_connectivity',
        name: 'Database Connectivity Issues',
        description: 'Alert on database connection problems',
        condition: {
          metric: 'error_count',
          operator: 'gt',
          aggregation: 'count',
          filters: {
            category: [ErrorCategory.DATABASE]
          }
        },
        threshold: 3,
        timeWindow: '5m',
        severity: ErrorSeverity.CRITICAL,
        enabled: true,
        notificationChannels: ['infrastructure-alerts', 'email-dba']
      }
    ];

    defaultAlerts.forEach(alert => {
      this.alertRules.set(alert.id, alert);
    });
  }

  public async getDashboardMetrics(filters: DashboardFilter = {}): Promise<DashboardMetrics> {
    const cacheKey = this.generateCacheKey('dashboard_metrics', filters);
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const timeRange = this.parseTimeRange(filters.timeRange || '24h');
    const since = new Date(Date.now() - timeRange);

    // Build where clause based on filters
    const whereClause = this.buildWhereClause(filters, since);

    try {
      // Execute parallel queries for different metrics
      const [
        totalStats,
        categoryStats,
        serviceStats,
        trendData,
        performanceData
      ] = await Promise.all([
        this.getTotalStats(whereClause),
        this.getCategoryStats(whereClause),
        this.getServiceStats(whereClause),
        this.getTrendData(filters),
        this.getPerformanceMetrics(filters)
      ]);

      const metrics: DashboardMetrics = {
        totalErrors: totalStats.totalErrors,
        uniqueErrors: totalStats.uniqueErrors,
        criticalErrors: totalStats.criticalErrors,
        resolvedErrors: totalStats.resolvedErrors,
        averageResolutionTime: totalStats.averageResolutionTime,
        errorRate: totalStats.errorRate,
        topErrorCategories: categoryStats,
        topAffectedServices: serviceStats,
        errorTrends: trendData,
        performanceImpact: performanceData
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;

    } catch (error: any) {
      this.logger.error('Failed to get dashboard metrics', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  private buildWhereClause(filters: DashboardFilter, since: Date): any {
    const where: any = {
      lastSeen: { gte: since }
    };

    if (filters.severity) {
      where.severity = { in: filters.severity };
    }

    if (filters.category) {
      where.category = { in: filters.category };
    }

    if (filters.services) {
      where.context = {
        path: ['service'],
        in: filters.services
      };
    }

    if (filters.environments) {
      where.context = {
        ...where.context,
        path: ['environment'],
        in: filters.environments
      };
    }

    if (filters.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    if (filters.minOccurrences) {
      where.count = { gte: filters.minOccurrences };
    }

    return where;
  }

  private async getTotalStats(whereClause: any): Promise<any> {
    const [errorStats, resolutionStats] = await Promise.all([
      this.prisma.error.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: { count: true }
      }),
      this.prisma.error.aggregate({
        where: {
          ...whereClause,
          resolved: true,
          resolvedAt: { not: null }
        },
        _count: { id: true },
        _avg: {
          resolutionTime: true // Assuming this field exists
        }
      })
    ]);

    // Calculate error rate (errors per hour)
    const timeRangeHours = (Date.now() - new Date(whereClause.lastSeen.gte).getTime()) / (1000 * 60 * 60);
    const errorRate = (errorStats._sum.count || 0) / timeRangeHours;

    // Count critical errors
    const criticalErrors = await this.prisma.error.aggregate({
      where: {
        ...whereClause,
        severity: ErrorSeverity.CRITICAL
      },
      _sum: { count: true }
    });

    return {
      totalErrors: errorStats._sum.count || 0,
      uniqueErrors: errorStats._count.id || 0,
      criticalErrors: criticalErrors._sum.count || 0,
      resolvedErrors: resolutionStats._count.id || 0,
      averageResolutionTime: resolutionStats._avg.resolutionTime || 0,
      errorRate
    };
  }

  private async getCategoryStats(whereClause: any): Promise<CategoryMetric[]> {
    const stats = await this.prisma.error.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { id: true },
      _sum: { count: true },
      _avg: { severityWeight: true }, // Assuming severity is stored as numeric weight
      orderBy: {
        _sum: {
          count: 'desc'
        }
      },
      take: 10
    });

    const totalCount = stats.reduce((sum, stat) => sum + (stat._sum.count || 0), 0);

    return stats.map(stat => ({
      category: stat.category as ErrorCategory,
      count: stat._sum.count || 0,
      percentage: totalCount > 0 ? ((stat._sum.count || 0) / totalCount) * 100 : 0,
      trend: 'stable' as const, // TODO: Calculate actual trend
      averageSeverity: stat._avg.severityWeight || 0
    }));
  }

  private async getServiceStats(whereClause: any): Promise<ServiceMetric[]> {
    // This would require a more complex query to extract service from JSON context
    // For now, return mock data structure
    const services = await this.prisma.error.findMany({
      where: whereClause,
      select: {
        context: true,
        severity: true,
        count: true
      }
    });

    const serviceMap = new Map<string, ServiceMetric>();

    services.forEach(error => {
      const service = (error.context as any)?.service || 'unknown';
      
      if (!serviceMap.has(service)) {
        serviceMap.set(service, {
          service,
          errorCount: 0,
          uniqueErrors: 0,
          criticalCount: 0,
          availability: 99.0, // Would be calculated from uptime data
          responseTime: 150 // Would be calculated from performance data
        });
      }

      const metric = serviceMap.get(service)!;
      metric.errorCount += error.count;
      metric.uniqueErrors += 1;
      
      if (error.severity === ErrorSeverity.CRITICAL) {
        metric.criticalCount += error.count;
      }
    });

    return Array.from(serviceMap.values())
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10);
  }

  private async getTrendData(filters: DashboardFilter): Promise<TrendData[]> {
    const timeRange = this.parseTimeRange(filters.timeRange || '24h');
    const intervals = this.calculateTrendIntervals(timeRange);
    const trends: TrendData[] = [];

    for (const interval of intervals) {
      const whereClause = this.buildWhereClause(filters, interval.start);
      whereClause.lastSeen = {
        gte: interval.start,
        lt: interval.end
      };

      const stats = await this.prisma.error.aggregate({
        where: whereClause,
        _sum: { count: true },
        _count: { id: true }
      });

      const criticalStats = await this.prisma.error.aggregate({
        where: {
          ...whereClause,
          severity: ErrorSeverity.CRITICAL
        },
        _sum: { count: true }
      });

      const resolvedStats = await this.prisma.error.aggregate({
        where: {
          ...whereClause,
          resolved: true
        },
        _count: { id: true }
      });

      trends.push({
        timestamp: interval.start,
        totalErrors: stats._sum.count || 0,
        criticalErrors: criticalStats._sum.count || 0,
        resolvedErrors: resolvedStats._count.id || 0,
        newErrors: stats._count.id || 0
      });
    }

    return trends;
  }

  private calculateTrendIntervals(timeRange: number): Array<{ start: Date; end: Date }> {
    const now = Date.now();
    const intervals: Array<{ start: Date; end: Date }> = [];
    
    // Calculate appropriate interval size based on time range
    let intervalSize: number;
    let intervalCount: number;
    
    if (timeRange <= 60 * 60 * 1000) { // 1 hour
      intervalSize = 5 * 60 * 1000; // 5 minutes
      intervalCount = 12;
    } else if (timeRange <= 24 * 60 * 60 * 1000) { // 24 hours
      intervalSize = 60 * 60 * 1000; // 1 hour
      intervalCount = 24;
    } else if (timeRange <= 7 * 24 * 60 * 60 * 1000) { // 7 days
      intervalSize = 24 * 60 * 60 * 1000; // 1 day
      intervalCount = 7;
    } else { // 30 days or more
      intervalSize = 7 * 24 * 60 * 60 * 1000; // 1 week
      intervalCount = Math.ceil(timeRange / intervalSize);
    }

    for (let i = intervalCount - 1; i >= 0; i--) {
      const end = new Date(now - (i * intervalSize));
      const start = new Date(end.getTime() - intervalSize);
      intervals.push({ start, end });
    }

    return intervals;
  }

  private async getPerformanceMetrics(filters: DashboardFilter): Promise<PerformanceMetric[]> {
    // This would typically integrate with APM data
    // For now, return calculated metrics based on error data
    const services = await this.getServiceStats(this.buildWhereClause(filters, new Date(Date.now() - this.parseTimeRange(filters.timeRange || '24h'))));
    
    return services.map(service => ({
      service: service.service,
      errorRate: (service.errorCount / (service.errorCount + 1000)) * 100, // Mock calculation
      responseTime: service.responseTime,
      throughput: 1000 - service.errorCount, // Mock calculation
      availability: service.availability
    }));
  }

  public async getErrorSummaries(filters: DashboardFilter = {}): Promise<ErrorSummary[]> {
    const whereClause = this.buildWhereClause(filters, new Date(Date.now() - this.parseTimeRange(filters.timeRange || '24h')));
    
    const errors = await this.prisma.error.findMany({
      where: whereClause,
      orderBy: [
        { severity: 'desc' },
        { count: 'desc' },
        { lastSeen: 'desc' }
      ],
      take: 50
    });

    return errors.map(error => ({
      fingerprint: error.fingerprint,
      message: error instanceof Error ? error.message : 'Unknown error',
      category: error.category as ErrorCategory,
      severity: error.severity as ErrorSeverity,
      count: error.count,
      affectedUsers: error.affectedUsers?.length || 0,
      firstSeen: error.firstSeen,
      lastSeen: error.lastSeen,
      resolved: error.resolved,
      trend: this.calculateTrend(error), // TODO: Implement trend calculation
      impact: this.calculateImpact(error as any)
    }));
  }

  private calculateTrend(error: any): 'increasing' | 'decreasing' | 'stable' {
    // TODO: Implement actual trend calculation based on historical data
    return 'stable';
  }

  private calculateImpact(error: StructuredError): 'high' | 'medium' | 'low' {
    if (error.severity === ErrorSeverity.CRITICAL || error.affectedUsers.length > 100) {
      return 'high';
    } else if (error.severity === ErrorSeverity.HIGH || error.affectedUsers.length > 10) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  public async generateReport(reportId: string): Promise<any> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const metrics = await this.getDashboardMetrics(report.filters);
    const summaries = await this.getErrorSummaries(report.filters);

    const reportData = {
      id: report.id,
      name: report.name,
      description: report.description,
      generatedAt: new Date(),
      filters: report.filters,
      metrics,
      summaries,
      visualizations: report.visualizations
    };

    this.emit('reportGenerated', { reportId, reportData });
    return reportData;
  }

  public async checkAlertRules(): Promise<any> {
    for (const [alertId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      try {
        const isTriggered = await this.evaluateAlertCondition(rule);
        if (isTriggered) {
          this.emit('alertTriggered', {
            alertId,
            rule,
            timestamp: new Date()
          });
        }
      } catch (error: any) {
        this.logger.error('Failed to evaluate alert rule', {
          alertId,
          error: error.message
        });
      }
    }
  }

  private async evaluateAlertCondition(rule: AlertRule): Promise<boolean> {
    const timeRange = this.parseTimeRange(rule.timeWindow);
    const since = new Date(Date.now() - timeRange);
    
    const whereClause = this.buildWhereClause(rule.condition.filters || {}, since);

    let value: number;

    switch (rule.condition.metric) {
      case 'error_count':
        const countResult = await this.prisma.error.aggregate({
          where: whereClause,
          _sum: { count: true }
        });
        value = countResult._sum.count || 0;
        break;

      case 'critical_errors':
        const criticalResult = await this.prisma.error.aggregate({
          where: {
            ...whereClause,
            severity: ErrorSeverity.CRITICAL
          },
          _sum: { count: true }
        });
        value = criticalResult._sum.count || 0;
        break;

      case 'error_rate':
        const totalRequests = 10000; // Would come from APM data
        const errors = await this.prisma.error.aggregate({
          where: whereClause,
          _sum: { count: true }
        });
        value = ((errors._sum.count || 0) / totalRequests) * 100;
        break;

      default:
        value = 0;
    }

    return this.compareValues(value, rule.condition.operator, rule.threshold);
  }

  private compareValues(actual: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return actual > threshold;
      case 'gte': return actual >= threshold;
      case 'lt': return actual < threshold;
      case 'lte': return actual <= threshold;
      case 'eq': return actual === threshold;
      default: return false;
    }
  }

  private startMetricsUpdater(): void {
    // Update metrics cache every 5 minutes
    setInterval(() => {
      this.checkAlertRules();
    }, 5 * 60 * 1000);

    // Clear old cache entries every hour
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000);
  }

  private generateCacheKey(type: string, filters: DashboardFilter): string {
    return `${type}_${JSON.stringify(filters)}_${Math.floor(Date.now() / this.cacheTimeout)}`;
  }

  private getCachedData(key: string): any {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.metricsCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.metricsCache.delete(key);
      }
    }
  }

  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  public addReport(report: ReportConfig): void {
    this.reports.set(report.id, report);
    this.logger.info('Report configuration added', { reportId: report.id });
  }

  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.info('Alert rule added', { ruleId: rule.id });
  }

  public getReports(): ReportConfig[] {
    return Array.from(this.reports.values());
  }

  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  public async shutdown(): Promise<any> {
    this.logger.info('Shutting down error dashboard service');
    this.metricsCache.clear();
    this.removeAllListeners();
  }
}


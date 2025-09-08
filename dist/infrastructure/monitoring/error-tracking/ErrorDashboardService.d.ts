import { EventEmitter } from 'events';
import { PrismaClient } from './generated/client';
import { ErrorSeverity, ErrorCategory } from './ErrorTrackingService';
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
    timeRange?: string;
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
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    aggregation: 'count' | 'sum' | 'avg' | 'max' | 'min';
    filters?: DashboardFilter;
}
export declare class ErrorDashboardService extends EventEmitter {
    private logger;
    private prisma;
    private metricsCache;
    private readonly cacheTimeout;
    private reports;
    private alertRules;
    constructor(prisma: PrismaClient);
    private createLogger;
    private initializeDefaultReports;
    private initializeDefaultAlerts;
    getDashboardMetrics(filters?: DashboardFilter): Promise<DashboardMetrics>;
    private buildWhereClause;
    private getTotalStats;
    private getCategoryStats;
    private getServiceStats;
    private getTrendData;
    private calculateTrendIntervals;
    private getPerformanceMetrics;
    getErrorSummaries(filters?: DashboardFilter): Promise<ErrorSummary[]>;
    private calculateTrend;
    private calculateImpact;
    generateReport(reportId: string): Promise<any>;
    checkAlertRules(): Promise<any>;
    private evaluateAlertCondition;
    private compareValues;
    private startMetricsUpdater;
    private generateCacheKey;
    private getCachedData;
    private setCachedData;
    private cleanupCache;
    private parseTimeRange;
    addReport(report: ReportConfig): void;
    addAlertRule(rule: AlertRule): void;
    getReports(): ReportConfig[];
    getAlertRules(): AlertRule[];
    shutdown(): Promise<any>;
}

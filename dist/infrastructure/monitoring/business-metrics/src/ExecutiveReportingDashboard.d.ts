import { EventEmitter } from 'events';
export interface ExecutiveDashboardConfig {
    refreshInterval: number;
    dataRetentionDays: number;
    autoExportEnabled: boolean;
    cacheEnabled: boolean;
    performanceThresholds: PerformanceThresholds;
}
export interface PerformanceThresholds {
    loadTime: number;
    dataFreshness: number;
    errorRate: number;
    availabilityTarget: number;
}
export interface ExecutiveMetric {
    id: string;
    name: string;
    displayName: string;
    category: 'financial' | 'operational' | 'strategic' | 'risk';
    currentValue: number;
    previousValue: number;
    target?: number;
    benchmark?: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    unit: string;
    description: string;
    lastUpdated: Date;
    dataQuality: number;
}
export interface ExecutiveSummary {
    id: string;
    tenantId: string;
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
        type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    };
    keyMetrics: ExecutiveMetric[];
    insights: ExecutiveInsight[];
    alerts: ExecutiveAlert[];
    recommendations: ExecutiveRecommendation[];
    performance: PerformanceSummary;
    attachments: ReportAttachment[];
}
export interface ExecutiveInsight {
    id: string;
    type: 'trend_analysis' | 'anomaly_detection' | 'correlation' | 'forecasting' | 'benchmark_comparison';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    metrics: string[];
    dataPoints: InsightDataPoint[];
    visualizationType: 'chart' | 'table' | 'text' | 'scorecard';
    createdAt: Date;
}
export interface InsightDataPoint {
    timestamp: Date;
    value: number;
    label?: string;
    metadata?: Record<string, any>;
}
export interface ExecutiveAlert {
    id: string;
    type: 'performance' | 'risk' | 'compliance' | 'operational';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    affectedMetrics: string[];
    triggeredAt: Date;
    expectedResolution?: Date;
    actionRequired: boolean;
    context: Record<string, any>;
}
export interface ExecutiveRecommendation {
    id: string;
    type: 'optimization' | 'risk_mitigation' | 'growth_opportunity' | 'cost_reduction';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: {
        metric: string;
        estimatedImprovement: number;
        timeframe: string;
    };
    actionItems: ActionItem[];
    resources: ResourceRequirement[];
    feasibilityScore: number;
}
export interface ActionItem {
    id: string;
    description: string;
    owner?: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed';
    dependencies: string[];
}
export interface ResourceRequirement {
    type: 'human' | 'financial' | 'technical' | 'time';
    description: string;
    estimatedCost?: number;
    duration?: number;
}
export interface PerformanceSummary {
    overall: {
        score: number;
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        trend: 'improving' | 'stable' | 'declining';
    };
    categories: {
        financial: CategoryPerformance;
        operational: CategoryPerformance;
        client: CategoryPerformance;
        risk: CategoryPerformance;
    };
    benchmarks: BenchmarkComparison[];
}
export interface CategoryPerformance {
    score: number;
    metrics: {
        total: number;
        onTarget: number;
        atRisk: number;
        offTrack: number;
    };
    trend: 'improving' | 'stable' | 'declining';
    keyDrivers: string[];
}
export interface BenchmarkComparison {
    category: string;
    ourPerformance: number;
    industryAverage: number;
    topQuartile: number;
    percentile: number;
    gap: number;
}
export interface ReportAttachment {
    id: string;
    name: string;
    type: 'pdf' | 'excel' | 'csv' | 'image';
    size: number;
    url: string;
    description?: string;
    generatedAt: Date;
}
export interface DrillDownContext {
    metricId: string;
    dimension: string;
    value: string;
    timeRange: {
        start: Date;
        end: Date;
    };
    filters: Record<string, any>;
}
export interface DrillDownResult {
    context: DrillDownContext;
    data: DrillDownData[];
    aggregations: DrillDownAggregation[];
    insights: string[];
    nextLevelDimensions: string[];
}
export interface DrillDownData {
    dimension: string;
    value: string;
    metric: number;
    contribution: number;
    trend: number;
    rank: number;
}
export interface DrillDownAggregation {
    type: 'sum' | 'avg' | 'min' | 'max' | 'count';
    value: number;
    label: string;
}
export declare class ExecutiveReportingDashboard extends EventEmitter {
    private config;
    private executiveMetrics;
    private summaryCache;
    private benchmarkData;
    private insights;
    private recommendations;
    private reportingTimer;
    private cacheCleanupTimer;
    constructor(config: ExecutiveDashboardConfig);
    generateExecutiveSummary(tenantId: string, period: {
        start: Date;
        end: Date;
        type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    }): Promise<ExecutiveSummary>;
    getKeyMetrics(tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<ExecutiveMetric[]>;
    private calculateFinancialMetrics;
    private calculateOperationalMetrics;
    private calculateClientMetrics;
    private calculateRiskMetrics;
    generateInsights(tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<ExecutiveInsight[]>;
    private generateTrendAnalysis;
    private generateAnomalyInsight;
    private generateCorrelationInsight;
    private generateBenchmarkInsight;
    generateRecommendations(tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<ExecutiveRecommendation[]>;
    private generatePerformanceRecommendation;
    private generateRiskRecommendation;
    private generateGrowthRecommendation;
    calculatePerformanceSummary(tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<PerformanceSummary>;
    private calculateCategoryPerformance;
    private calculateCategoryScore;
    private scoreToGrade;
    private calculateOverallTrend;
    drillDown(context: DrillDownContext): Promise<DrillDownResult>;
    private getDrillDownData;
    private calculateDrillDownAggregations;
    private generateDrillDownInsights;
    private getNextLevelDimensions;
    private calculateAUM;
    private calculateRevenue;
    private calculateNetFlows;
    private calculateSystemUptime;
    private calculateTradeExecutionTime;
    private calculateClientCount;
    private calculateRetentionRate;
    private calculatePortfolioVaR;
    private getBenchmarkComparisons;
    private calculateTrend;
    private calculateTrendPercentage;
    private calculateStatus;
    private calculateGrowthStatus;
    private calculateRiskStatus;
    private getExecutiveAlerts;
    private initializeExecutiveMetrics;
    private startReportingTimer;
    private startCacheCleanup;
    private performScheduledReporting;
    private cleanupCache;
    private generateId;
    getExecutiveSummary(summaryId: string): ExecutiveSummary | null;
    getExecutiveMetric(metricId: string): ExecutiveMetric | null;
    shutdown(): Promise<void>;
}

import { EventEmitter } from 'events';
import { ResourceUtilizationSnapshot, ResourceType, ResourceRecommendation, ResourceAllocation, ResourceAlert } from './ResourceDataModel';
import { CostCorrelation } from './ResourceCostAnalysisService';
import { EfficiencyInsight } from './ResourceEfficiencyAnalyticsService';
export interface DashboardConfig {
    refreshInterval: number;
    enableRealTimeUpdates: boolean;
    enableInteractiveFeatures: boolean;
    maxDataPoints: number;
    defaultTimeRange: 'last_hour' | 'last_day' | 'last_week' | 'last_month';
    widgetConfiguration: WidgetConfig[];
    customMetrics: CustomMetricConfig[];
    alertIntegration: boolean;
    exportFormats: string[];
    roleBasedAccess: boolean;
}
export interface WidgetConfig {
    id: string;
    type: WidgetType;
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    configuration: Record<string, any>;
    data_source: string;
    refresh_rate: number;
    visibility: {
        roles: string[];
        conditions?: Array<{
            parameter: string;
            operator: string;
            value: any;
        }>;
    };
    interactions: {
        drill_down: boolean;
        filters: string[];
        actions: string[];
    };
}
export interface CustomMetricConfig {
    id: string;
    name: string;
    description: string;
    formula: string;
    unit: string;
    data_sources: string[];
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'custom';
    update_frequency: number;
    display_format: string;
}
export declare enum WidgetType {
    UTILIZATION_GAUGE = "utilization_gauge",
    COST_TREND = "cost_trend",
    EFFICIENCY_SCORE = "efficiency_score",
    RESOURCE_ALLOCATION = "resource_allocation",
    OPTIMIZATION_OPPORTUNITIES = "optimization_opportunities",
    ALERT_SUMMARY = "alert_summary",
    CAPACITY_FORECAST = "capacity_forecast",
    PERFORMANCE_METRICS = "performance_metrics",
    COST_BREAKDOWN = "cost_breakdown",
    WASTE_ANALYSIS = "waste_analysis",
    SLA_COMPLIANCE = "sla_compliance",
    RESOURCE_TOPOLOGY = "resource_topology",
    RECOMMENDATION_LIST = "recommendation_list",
    CUSTOM_CHART = "custom_chart",
    DATA_TABLE = "data_table",
    KPI_CARD = "kpi_card"
}
export interface DashboardData {
    timestamp: Date;
    time_range: {
        start: Date;
        end: Date;
    };
    widgets: Map<string, WidgetData>;
    summary: DashboardSummary;
    alerts: DashboardAlert[];
    recommendations: DashboardRecommendation[];
    metadata: {
        data_freshness: Date;
        last_update: Date;
        data_quality: number;
        missing_data: string[];
        errors: string[];
    };
}
export interface WidgetData {
    widget_id: string;
    type: WidgetType;
    data: any;
    status: 'loading' | 'ready' | 'error' | 'no_data';
    error_message?: string;
    last_updated: Date;
    data_source: string;
    metrics: {
        data_points: number;
        data_quality: number;
        freshness_score: number;
    };
}
export interface DashboardSummary {
    total_resources: number;
    active_resources: number;
    total_cost: number;
    cost_trend: 'increasing' | 'decreasing' | 'stable';
    average_utilization: number;
    efficiency_score: number;
    critical_alerts: number;
    optimization_opportunities: number;
    potential_savings: number;
    compliance_score: number;
}
export interface DashboardAlert {
    id: string;
    resource_id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    title: string;
    description: string;
    triggered_at: Date;
    acknowledged: boolean;
    actions_available: string[];
}
export interface DashboardRecommendation {
    id: string;
    resource_id: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potential_savings: number;
    effort_required: 'low' | 'medium' | 'high';
    confidence: number;
}
export interface DashboardFilter {
    resource_type?: ResourceType[];
    resource_ids?: string[];
    time_range?: {
        start: Date;
        end: Date;
    };
    cost_range?: {
        min: number;
        max: number;
    };
    utilization_range?: {
        min: number;
        max: number;
    };
    tags?: Record<string, string[]>;
    alert_severity?: string[];
    recommendation_priority?: string[];
}
export interface DashboardExport {
    format: 'pdf' | 'excel' | 'csv' | 'json' | 'png';
    content: 'dashboard' | 'widget' | 'data' | 'summary';
    filters?: DashboardFilter;
    options: {
        include_charts: boolean;
        include_data: boolean;
        include_recommendations: boolean;
        time_period: string;
        layout: 'portrait' | 'landscape';
    };
}
export declare class ResourcePlanningDashboardService extends EventEmitter {
    private config;
    private dashboardData;
    private widgetConfigs;
    private customMetrics;
    private refreshScheduler?;
    private dataCache;
    constructor(config: DashboardConfig);
    generateDashboard(dashboardId: string, resourceData: Map<string, ResourceUtilizationSnapshot>, costData: Map<string, CostCorrelation>, efficiencyData: Map<string, EfficiencyInsight[]>, allocationData: Map<string, ResourceAllocation[]>, alerts: Map<string, ResourceAlert[]>, recommendations: Map<string, ResourceRecommendation[]>, filters?: DashboardFilter): Promise<DashboardData>;
    private generateWidgetData;
    private generateUtilizationGaugeData;
    private generateCostTrendData;
    private generateEfficiencyScoreData;
    private generateResourceAllocationData;
    private generateOptimizationOpportunitiesData;
    private generateAlertSummaryData;
    private generateDashboardSummary;
    exportDashboard(dashboardId: string, exportConfig: DashboardExport): Promise<Buffer | string>;
    private initializeWidgets;
    private initializeCustomMetrics;
    private startRefreshScheduler;
    private refreshDashboards;
    private getTimeRange;
    private filterResources;
    getDashboard(dashboardId: string): DashboardData | undefined;
    getWidgetConfigs(): WidgetConfig[];
    getCustomMetrics(): CustomMetricConfig[];
    private filterCostData;
    private filterAllocations;
    private filterRecommendations;
    private filterAlerts;
    private generateTimePoints;
    private isForecastPoint;
    private calculateUtilizationTrend;
    private calculateCostTrend;
    private generateCostBreakdown;
    private calculateTotalSavingsOpportunities;
    private calculateForecastAccuracy;
    private getEfficiencyGrade;
    private calculateImprovementPotential;
    private getBenchmarkComparison;
    private calculateAllocationUtilization;
    private calculateAllocationCosts;
    private calculateAllocationWaste;
    private categorizeOpportunities;
    private calculateROIAnalysis;
    private calculateAlertTrends;
    private getTopAlertTypes;
    private calculateResolutionMetrics;
    private determineCostTrend;
    private calculateDataFreshness;
    private calculateDataQuality;
    private identifyMissingData;
    private collectErrors;
    private countDataPoints;
    private assessDataQuality;
    private calculateFreshnessScore;
    private processDashboardAlerts;
    private processDashboardRecommendations;
    private generateKPICardData;
    private generateCapacityForecastData;
    private generatePerformanceMetricsData;
    private generateWasteAnalysisData;
    private generateRecommendationListData;
    private exportToJSON;
    private exportToCSV;
    private exportToExcel;
    private exportToPDF;
    private exportToPNG;
    shutdown(): Promise<void>;
}

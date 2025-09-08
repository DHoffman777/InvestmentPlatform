import { EventEmitter } from 'events';
import { PerformanceProfile, PerformanceBottleneck, PerformanceRecommendation, ReportType, TimePeriod, TrendDirection, BottleneckType } from './PerformanceDataModel';
import { CorrelationAnalysis } from './PerformanceCorrelationService';
import { TestResults } from './PerformanceTestingService';
export interface BottleneckReportingConfig {
    reportsDirectory: string;
    enableAutomaticReports: boolean;
    reportRetentionDays: number;
    defaultTimeRange: string;
    enableRealTimeDashboard: boolean;
    refreshIntervalSeconds: number;
    enableEmailReports: boolean;
    emailRecipients: string[];
    reportSchedules: ReportSchedule[];
}
export interface DashboardConfig {
    title: string;
    description: string;
    layout: DashboardLayout;
    widgets: DashboardWidget[];
    filters: DashboardFilter[];
    refresh_interval_seconds: number;
    auto_refresh: boolean;
}
export interface DashboardLayout {
    type: LayoutType;
    columns: number;
    rows: number;
    responsive: boolean;
}
export interface DashboardWidget {
    id: string;
    type: WidgetType;
    title: string;
    description: string;
    position: WidgetPosition;
    size: WidgetSize;
    configuration: WidgetConfiguration;
    data_source: DataSourceConfig;
    refresh_interval_seconds?: number;
}
export interface WidgetPosition {
    x: number;
    y: number;
}
export interface WidgetSize {
    width: number;
    height: number;
}
export interface WidgetConfiguration {
    chart_type?: ChartType;
    metrics?: string[];
    time_range?: string;
    aggregation?: AggregationType;
    threshold_lines?: ThresholdLine[];
    color_scheme?: ColorScheme;
    show_legend?: boolean;
    show_grid?: boolean;
    custom_options?: Record<string, any>;
}
export interface ThresholdLine {
    name: string;
    value: number;
    color: string;
    style: LineStyle;
}
export interface DataSourceConfig {
    source_type: DataSourceType;
    query?: string;
    parameters?: Record<string, any>;
    cache_duration_seconds?: number;
}
export interface DashboardFilter {
    id: string;
    name: string;
    type: FilterType;
    options: FilterOption[];
    default_value?: any;
    required: boolean;
}
export interface FilterOption {
    label: string;
    value: any;
}
export interface ReportSchedule {
    id: string;
    name: string;
    report_type: ReportType;
    cron_expression: string;
    enabled: boolean;
    parameters: ReportParameters;
    distribution: ReportDistribution;
}
export interface ReportParameters {
    time_period: TimePeriod;
    include_trends: boolean;
    include_recommendations: boolean;
    include_correlations: boolean;
    include_test_results: boolean;
    filters: ReportFilter[];
}
export interface ReportFilter {
    field: string;
    operator: FilterOperator;
    value: any;
}
export interface ReportDistribution {
    email_enabled: boolean;
    email_recipients: string[];
    slack_enabled: boolean;
    slack_webhook?: string;
    file_export_enabled: boolean;
    export_formats: ExportFormat[];
}
export interface DashboardData {
    dashboard_id: string;
    generated_at: Date;
    time_range: TimePeriod;
    widgets: Map<string, WidgetData>;
    summary: DashboardSummary;
    alerts: DashboardAlert[];
    last_updated: Date;
}
export interface WidgetData {
    widget_id: string;
    type: WidgetType;
    data: any;
    status: DataStatus;
    error_message?: string;
    last_updated: Date;
    metadata: WidgetMetadata;
}
export interface WidgetMetadata {
    data_points: number;
    time_range: TimePeriod;
    aggregation: AggregationType;
    cache_hit: boolean;
}
export interface DashboardSummary {
    total_profiles: number;
    total_bottlenecks: number;
    critical_issues: number;
    performance_score: number;
    trend_direction: TrendDirection;
    top_bottleneck_types: BottleneckTypeCount[];
    recommendations_pending: number;
}
export interface BottleneckTypeCount {
    type: BottleneckType;
    count: number;
    percentage: number;
}
export interface DashboardAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    triggered_at: Date;
    widget_id?: string;
    action_required: boolean;
}
export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    report_type: ReportType;
    template_content: string;
    supported_formats: ExportFormat[];
    parameters: TemplateParameter[];
}
export interface TemplateParameter {
    name: string;
    type: ParameterType;
    required: boolean;
    default_value?: any;
    description: string;
}
export interface ExportData {
    format: ExportFormat;
    content: string | Buffer;
    filename: string;
    mime_type: string;
    size_bytes: number;
}
export declare enum LayoutType {
    GRID = "grid",
    FLEX = "flex",
    CUSTOM = "custom"
}
export declare enum WidgetType {
    LINE_CHART = "line_chart",
    BAR_CHART = "bar_chart",
    PIE_CHART = "pie_chart",
    GAUGE = "gauge",
    TABLE = "table",
    METRIC_CARD = "metric_card",
    HEATMAP = "heatmap",
    SCATTER_PLOT = "scatter_plot",
    TIMELINE = "timeline",
    ALERT_LIST = "alert_list",
    RECOMMENDATION_LIST = "recommendation_list",
    STATUS_INDICATOR = "status_indicator"
}
export declare enum ChartType {
    LINE = "line",
    AREA = "area",
    BAR = "bar",
    COLUMN = "column",
    PIE = "pie",
    DONUT = "donut",
    GAUGE = "gauge",
    RADAR = "radar"
}
export declare enum AggregationType {
    SUM = "sum",
    AVERAGE = "average",
    COUNT = "count",
    MIN = "min",
    MAX = "max",
    MEDIAN = "median",
    PERCENTILE_95 = "p95",
    PERCENTILE_99 = "p99"
}
export declare enum ColorScheme {
    DEFAULT = "default",
    BLUE = "blue",
    GREEN = "green",
    RED = "red",
    PURPLE = "purple",
    RAINBOW = "rainbow"
}
export declare enum LineStyle {
    SOLID = "solid",
    DASHED = "dashed",
    DOTTED = "dotted"
}
export declare enum DataSourceType {
    BOTTLENECKS = "bottlenecks",
    PROFILES = "profiles",
    CORRELATIONS = "correlations",
    RECOMMENDATIONS = "recommendations",
    TEST_RESULTS = "test_results",
    TRENDS = "trends",
    CUSTOM_QUERY = "custom_query"
}
export declare enum FilterType {
    SELECT = "select",
    MULTI_SELECT = "multi_select",
    DATE_RANGE = "date_range",
    TEXT = "text",
    NUMBER_RANGE = "number_range",
    BOOLEAN = "boolean"
}
export declare enum FilterOperator {
    EQUALS = "eq",
    NOT_EQUALS = "ne",
    CONTAINS = "contains",
    STARTS_WITH = "starts_with",
    ENDS_WITH = "ends_with",
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    BETWEEN = "between",
    IN = "in",
    NOT_IN = "not_in"
}
export declare enum ExportFormat {
    PDF = "pdf",
    HTML = "html",
    JSON = "json",
    CSV = "csv",
    EXCEL = "excel",
    PNG = "png"
}
export declare enum DataStatus {
    LOADING = "loading",
    SUCCESS = "success",
    ERROR = "error",
    NO_DATA = "no_data"
}
export declare enum AlertType {
    PERFORMANCE_DEGRADATION = "performance_degradation",
    HIGH_ERROR_RATE = "high_error_rate",
    RESOURCE_EXHAUSTION = "resource_exhaustion",
    BOTTLENECK_DETECTED = "bottleneck_detected",
    CORRELATION_ANOMALY = "correlation_anomaly"
}
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export declare enum ParameterType {
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean",
    DATE = "date",
    ARRAY = "array",
    OBJECT = "object"
}
export declare class BottleneckReportingService extends EventEmitter {
    private config;
    private profilesData;
    private bottlenecksData;
    private recommendationsData;
    private correlationsData;
    private testResultsData;
    private dashboards;
    private reportTemplates;
    private cachedDashboardData;
    private scheduledReports;
    private dataCache;
    constructor(config: BottleneckReportingConfig, profilesData: Map<string, PerformanceProfile>, bottlenecksData: Map<string, PerformanceBottleneck[]>, recommendationsData: Map<string, PerformanceRecommendation[]>, correlationsData: Map<string, CorrelationAnalysis[]>, testResultsData: Map<string, TestResults>);
    private initializeReportingFramework;
    private createDefaultDashboards;
    private createDefaultReportTemplates;
    generateDashboard(dashboardId: string, filters?: Record<string, any>): Promise<DashboardData>;
    private generateWidgetData;
    private getBottleneckData;
    private getProfileData;
    private getCorrelationData;
    private getRecommendationData;
    private getTestResultsData;
    generateReport(templateId: string, parameters: Record<string, any>, format?: ExportFormat): Promise<ExportData>;
    private gatherReportData;
    private renderTemplate;
    private convertToFormat;
    private wrapInHtmlDocument;
    private parseTimeRange;
    private filterBottlenecksByTimeRange;
    private filterProfilesByTimeRange;
    private filterCorrelationsByTimeRange;
    private groupBottlenecksByType;
    private groupBottlenecksBySeverity;
    private groupBottlenecksByComponent;
    private countBottlenecksWithFilter;
    private createBottleneckTimeline;
    private createBottleneckHeatmap;
    private calculateAveragePerformanceScore;
    private calculatePerformanceTrend;
    private createResponseTimeTrend;
    private getTimeKey;
    private sortRecommendationsByPriority;
    private generateDashboardSummary;
    private getTopBottleneckTypes;
    private generateDashboardAlerts;
    private generateNextSteps;
    private refreshAllDashboards;
    private startScheduledReports;
    private generateCacheKey;
    private generateAlertId;
    getDashboard(dashboardId: string): DashboardConfig | undefined;
    getAllDashboards(): DashboardConfig[];
    getCachedDashboardData(dashboardId: string): DashboardData | undefined;
    getReportTemplate(templateId: string): ReportTemplate | undefined;
    getAllReportTemplates(): ReportTemplate[];
    clearCache(): void;
    getReportingStatistics(): any;
    shutdown(): Promise<any>;
    exportReport(reportId: string, format: string): Promise<any>;
    getAvailableDashboards(): any[];
    getAvailableTemplates(): any[];
}

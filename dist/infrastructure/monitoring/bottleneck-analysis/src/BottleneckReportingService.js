"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottleneckReportingService = exports.ParameterType = exports.AlertSeverity = exports.AlertType = exports.DataStatus = exports.ExportFormat = exports.FilterOperator = exports.FilterType = exports.DataSourceType = exports.LineStyle = exports.ColorScheme = exports.AggregationType = exports.ChartType = exports.WidgetType = exports.LayoutType = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const PerformanceDataModel_1 = require("./PerformanceDataModel");
// Enums
var LayoutType;
(function (LayoutType) {
    LayoutType["GRID"] = "grid";
    LayoutType["FLEX"] = "flex";
    LayoutType["CUSTOM"] = "custom";
})(LayoutType || (exports.LayoutType = LayoutType = {}));
var WidgetType;
(function (WidgetType) {
    WidgetType["LINE_CHART"] = "line_chart";
    WidgetType["BAR_CHART"] = "bar_chart";
    WidgetType["PIE_CHART"] = "pie_chart";
    WidgetType["GAUGE"] = "gauge";
    WidgetType["TABLE"] = "table";
    WidgetType["METRIC_CARD"] = "metric_card";
    WidgetType["HEATMAP"] = "heatmap";
    WidgetType["SCATTER_PLOT"] = "scatter_plot";
    WidgetType["TIMELINE"] = "timeline";
    WidgetType["ALERT_LIST"] = "alert_list";
    WidgetType["RECOMMENDATION_LIST"] = "recommendation_list";
    WidgetType["STATUS_INDICATOR"] = "status_indicator";
})(WidgetType || (exports.WidgetType = WidgetType = {}));
var ChartType;
(function (ChartType) {
    ChartType["LINE"] = "line";
    ChartType["AREA"] = "area";
    ChartType["BAR"] = "bar";
    ChartType["COLUMN"] = "column";
    ChartType["PIE"] = "pie";
    ChartType["DONUT"] = "donut";
    ChartType["GAUGE"] = "gauge";
    ChartType["RADAR"] = "radar";
})(ChartType || (exports.ChartType = ChartType = {}));
var AggregationType;
(function (AggregationType) {
    AggregationType["SUM"] = "sum";
    AggregationType["AVERAGE"] = "average";
    AggregationType["COUNT"] = "count";
    AggregationType["MIN"] = "min";
    AggregationType["MAX"] = "max";
    AggregationType["MEDIAN"] = "median";
    AggregationType["PERCENTILE_95"] = "p95";
    AggregationType["PERCENTILE_99"] = "p99";
})(AggregationType || (exports.AggregationType = AggregationType = {}));
var ColorScheme;
(function (ColorScheme) {
    ColorScheme["DEFAULT"] = "default";
    ColorScheme["BLUE"] = "blue";
    ColorScheme["GREEN"] = "green";
    ColorScheme["RED"] = "red";
    ColorScheme["PURPLE"] = "purple";
    ColorScheme["RAINBOW"] = "rainbow";
})(ColorScheme || (exports.ColorScheme = ColorScheme = {}));
var LineStyle;
(function (LineStyle) {
    LineStyle["SOLID"] = "solid";
    LineStyle["DASHED"] = "dashed";
    LineStyle["DOTTED"] = "dotted";
})(LineStyle || (exports.LineStyle = LineStyle = {}));
var DataSourceType;
(function (DataSourceType) {
    DataSourceType["BOTTLENECKS"] = "bottlenecks";
    DataSourceType["PROFILES"] = "profiles";
    DataSourceType["CORRELATIONS"] = "correlations";
    DataSourceType["RECOMMENDATIONS"] = "recommendations";
    DataSourceType["TEST_RESULTS"] = "test_results";
    DataSourceType["TRENDS"] = "trends";
    DataSourceType["CUSTOM_QUERY"] = "custom_query";
})(DataSourceType || (exports.DataSourceType = DataSourceType = {}));
var FilterType;
(function (FilterType) {
    FilterType["SELECT"] = "select";
    FilterType["MULTI_SELECT"] = "multi_select";
    FilterType["DATE_RANGE"] = "date_range";
    FilterType["TEXT"] = "text";
    FilterType["NUMBER_RANGE"] = "number_range";
    FilterType["BOOLEAN"] = "boolean";
})(FilterType || (exports.FilterType = FilterType = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "eq";
    FilterOperator["NOT_EQUALS"] = "ne";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["STARTS_WITH"] = "starts_with";
    FilterOperator["ENDS_WITH"] = "ends_with";
    FilterOperator["GREATER_THAN"] = "gt";
    FilterOperator["LESS_THAN"] = "lt";
    FilterOperator["BETWEEN"] = "between";
    FilterOperator["IN"] = "in";
    FilterOperator["NOT_IN"] = "not_in";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["PDF"] = "pdf";
    ExportFormat["HTML"] = "html";
    ExportFormat["JSON"] = "json";
    ExportFormat["CSV"] = "csv";
    ExportFormat["EXCEL"] = "excel";
    ExportFormat["PNG"] = "png";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var DataStatus;
(function (DataStatus) {
    DataStatus["LOADING"] = "loading";
    DataStatus["SUCCESS"] = "success";
    DataStatus["ERROR"] = "error";
    DataStatus["NO_DATA"] = "no_data";
})(DataStatus || (exports.DataStatus = DataStatus = {}));
var AlertType;
(function (AlertType) {
    AlertType["PERFORMANCE_DEGRADATION"] = "performance_degradation";
    AlertType["HIGH_ERROR_RATE"] = "high_error_rate";
    AlertType["RESOURCE_EXHAUSTION"] = "resource_exhaustion";
    AlertType["BOTTLENECK_DETECTED"] = "bottleneck_detected";
    AlertType["CORRELATION_ANOMALY"] = "correlation_anomaly";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["ERROR"] = "error";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var ParameterType;
(function (ParameterType) {
    ParameterType["STRING"] = "string";
    ParameterType["NUMBER"] = "number";
    ParameterType["BOOLEAN"] = "boolean";
    ParameterType["DATE"] = "date";
    ParameterType["ARRAY"] = "array";
    ParameterType["OBJECT"] = "object";
})(ParameterType || (exports.ParameterType = ParameterType = {}));
class BottleneckReportingService extends events_1.EventEmitter {
    config;
    profilesData;
    bottlenecksData;
    recommendationsData;
    correlationsData;
    testResultsData;
    dashboards = new Map();
    reportTemplates = new Map();
    cachedDashboardData = new Map();
    scheduledReports = new Map();
    dataCache = new Map();
    constructor(config, profilesData, bottlenecksData, recommendationsData, correlationsData, testResultsData) {
        super();
        this.config = config;
        this.profilesData = profilesData;
        this.bottlenecksData = bottlenecksData;
        this.recommendationsData = recommendationsData;
        this.correlationsData = correlationsData;
        this.testResultsData = testResultsData;
        this.initializeReportingFramework();
        this.createDefaultDashboards();
        this.createDefaultReportTemplates();
        this.startScheduledReports();
    }
    initializeReportingFramework() {
        // Ensure reports directory exists
        if (!(0, fs_1.existsSync)(this.config.reportsDirectory)) {
            (0, fs_1.mkdirSync)(this.config.reportsDirectory, { recursive: true });
        }
        // Start real-time dashboard updates if enabled
        if (this.config.enableRealTimeDashboard) {
            setInterval(() => {
                this.refreshAllDashboards();
            }, this.config.refreshIntervalSeconds * 1000);
        }
    }
    createDefaultDashboards() {
        // Main Performance Overview Dashboard
        const overviewDashboard = {
            title: 'Performance Overview',
            description: 'High-level performance metrics and bottleneck summary',
            layout: {
                type: LayoutType.GRID,
                columns: 4,
                rows: 6,
                responsive: true
            },
            widgets: [
                {
                    id: 'performance_score',
                    type: WidgetType.GAUGE,
                    title: 'Overall Performance Score',
                    description: 'Current system performance score out of 100',
                    position: { x: 0, y: 0 },
                    size: { width: 1, height: 1 },
                    configuration: {
                        chart_type: ChartType.GAUGE,
                        threshold_lines: [
                            { name: 'Poor', value: 40, color: '#ff4444', style: LineStyle.SOLID },
                            { name: 'Good', value: 70, color: '#ffaa00', style: LineStyle.SOLID },
                            { name: 'Excellent', value: 90, color: '#44ff44', style: LineStyle.SOLID }
                        ]
                    },
                    data_source: {
                        source_type: DataSourceType.PROFILES,
                        parameters: { metric: 'performance_score', aggregation: 'average' }
                    }
                },
                {
                    id: 'bottleneck_types',
                    type: WidgetType.PIE_CHART,
                    title: 'Bottleneck Types Distribution',
                    description: 'Distribution of different bottleneck types',
                    position: { x: 1, y: 0 },
                    size: { width: 2, height: 2 },
                    configuration: {
                        chart_type: ChartType.PIE,
                        show_legend: true,
                        color_scheme: ColorScheme.RAINBOW
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { group_by: 'type' }
                    }
                },
                {
                    id: 'critical_bottlenecks',
                    type: WidgetType.METRIC_CARD,
                    title: 'Critical Bottlenecks',
                    description: 'Number of critical severity bottlenecks',
                    position: { x: 3, y: 0 },
                    size: { width: 1, height: 1 },
                    configuration: {
                        color_scheme: ColorScheme.RED
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { filter: { severity: 'critical' }, aggregation: 'count' }
                    }
                },
                {
                    id: 'response_time_trend',
                    type: WidgetType.LINE_CHART,
                    title: 'Response Time Trend',
                    description: '24-hour response time trend',
                    position: { x: 0, y: 1 },
                    size: { width: 4, height: 2 },
                    configuration: {
                        chart_type: ChartType.LINE,
                        time_range: 'last_24_hours',
                        show_grid: true,
                        threshold_lines: [
                            { name: 'SLA Threshold', value: 1000, color: '#ff4444', style: LineStyle.DASHED }
                        ]
                    },
                    data_source: {
                        source_type: DataSourceType.PROFILES,
                        parameters: { metric: 'response_time', time_granularity: 'hour' }
                    }
                },
                {
                    id: 'top_recommendations',
                    type: WidgetType.RECOMMENDATION_LIST,
                    title: 'Top Recommendations',
                    description: 'Highest priority performance recommendations',
                    position: { x: 0, y: 3 },
                    size: { width: 2, height: 2 },
                    configuration: {
                        custom_options: { max_items: 5, show_priority: true }
                    },
                    data_source: {
                        source_type: DataSourceType.RECOMMENDATIONS,
                        parameters: { sort_by: 'priority', limit: 5 }
                    }
                },
                {
                    id: 'bottleneck_severity_matrix',
                    type: WidgetType.HEATMAP,
                    title: 'Bottleneck Severity Matrix',
                    description: 'Heatmap of bottleneck types vs severity',
                    position: { x: 2, y: 3 },
                    size: { width: 2, height: 2 },
                    configuration: {
                        chart_type: ChartType.RADAR,
                        color_scheme: ColorScheme.RED
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { group_by: ['type', 'severity'] }
                    }
                }
            ],
            filters: [
                {
                    id: 'time_range',
                    name: 'Time Range',
                    type: FilterType.SELECT,
                    options: [
                        { label: 'Last Hour', value: 'last_hour' },
                        { label: 'Last 24 Hours', value: 'last_24_hours' },
                        { label: 'Last 7 Days', value: 'last_7_days' },
                        { label: 'Last 30 Days', value: 'last_30_days' }
                    ],
                    default_value: 'last_24_hours',
                    required: true
                },
                {
                    id: 'service_filter',
                    name: 'Service',
                    type: FilterType.MULTI_SELECT,
                    options: [
                        { label: 'All Services', value: 'all' },
                        { label: 'API Service', value: 'api' },
                        { label: 'Database Service', value: 'database' },
                        { label: 'Cache Service', value: 'cache' }
                    ],
                    default_value: 'all',
                    required: false
                }
            ],
            refresh_interval_seconds: this.config.refreshIntervalSeconds,
            auto_refresh: this.config.enableRealTimeDashboard
        };
        this.dashboards.set('performance_overview', overviewDashboard);
        // Detailed Bottleneck Analysis Dashboard
        const bottleneckDashboard = {
            title: 'Bottleneck Analysis',
            description: 'Detailed analysis of performance bottlenecks',
            layout: {
                type: LayoutType.GRID,
                columns: 3,
                rows: 8,
                responsive: true
            },
            widgets: [
                {
                    id: 'bottleneck_timeline',
                    type: WidgetType.TIMELINE,
                    title: 'Bottleneck Timeline',
                    description: 'Timeline of bottleneck occurrences',
                    position: { x: 0, y: 0 },
                    size: { width: 3, height: 2 },
                    configuration: {
                        time_range: 'last_7_days',
                        show_legend: true
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { time_series: true, group_by: 'detected_at' }
                    }
                },
                {
                    id: 'cpu_bottlenecks_detail',
                    type: WidgetType.BAR_CHART,
                    title: 'CPU Bottlenecks by Component',
                    description: 'CPU bottlenecks breakdown by system component',
                    position: { x: 0, y: 2 },
                    size: { width: 1, height: 2 },
                    configuration: {
                        chart_type: ChartType.BAR,
                        color_scheme: ColorScheme.BLUE
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { filter: { type: 'cpu_bound' }, group_by: 'component' }
                    }
                },
                {
                    id: 'memory_bottlenecks_detail',
                    type: WidgetType.BAR_CHART,
                    title: 'Memory Bottlenecks by Component',
                    description: 'Memory bottlenecks breakdown by system component',
                    position: { x: 1, y: 2 },
                    size: { width: 1, height: 2 },
                    configuration: {
                        chart_type: ChartType.BAR,
                        color_scheme: ColorScheme.GREEN
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { filter: { type: 'memory_bound' }, group_by: 'component' }
                    }
                },
                {
                    id: 'database_bottlenecks_detail',
                    type: WidgetType.BAR_CHART,
                    title: 'Database Bottlenecks by Component',
                    description: 'Database bottlenecks breakdown by system component',
                    position: { x: 2, y: 2 },
                    size: { width: 1, height: 2 },
                    configuration: {
                        chart_type: ChartType.BAR,
                        color_scheme: ColorScheme.PURPLE
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { filter: { type: 'database_bound' }, group_by: 'component' }
                    }
                },
                {
                    id: 'bottleneck_impact_correlation',
                    type: WidgetType.SCATTER_PLOT,
                    title: 'Impact vs Duration Correlation',
                    description: 'Correlation between bottleneck impact and duration',
                    position: { x: 0, y: 4 },
                    size: { width: 2, height: 2 },
                    configuration: {
                        show_grid: true,
                        color_scheme: ColorScheme.RED
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: {
                            x_axis: 'duration_ms',
                            y_axis: 'impact_score',
                            group_by: 'type'
                        }
                    }
                },
                {
                    id: 'root_causes_table',
                    type: WidgetType.TABLE,
                    title: 'Root Causes Analysis',
                    description: 'Detailed root causes for recent bottlenecks',
                    position: { x: 2, y: 4 },
                    size: { width: 1, height: 2 },
                    configuration: {
                        custom_options: {
                            columns: ['bottleneck_id', 'root_cause', 'confidence', 'category'],
                            sortable: true,
                            paginated: true
                        }
                    },
                    data_source: {
                        source_type: DataSourceType.BOTTLENECKS,
                        parameters: { include_root_causes: true, limit: 20 }
                    }
                }
            ],
            filters: [
                {
                    id: 'bottleneck_type',
                    name: 'Bottleneck Type',
                    type: FilterType.MULTI_SELECT,
                    options: [
                        { label: 'All Types', value: 'all' },
                        { label: 'CPU Bound', value: 'cpu_bound' },
                        { label: 'Memory Bound', value: 'memory_bound' },
                        { label: 'I/O Bound', value: 'io_bound' },
                        { label: 'Network Bound', value: 'network_bound' },
                        { label: 'Database Bound', value: 'database_bound' }
                    ],
                    default_value: 'all',
                    required: false
                },
                {
                    id: 'severity_filter',
                    name: 'Severity',
                    type: FilterType.MULTI_SELECT,
                    options: [
                        { label: 'All Severities', value: 'all' },
                        { label: 'Critical', value: 'critical' },
                        { label: 'High', value: 'high' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Low', value: 'low' }
                    ],
                    default_value: 'all',
                    required: false
                }
            ],
            refresh_interval_seconds: this.config.refreshIntervalSeconds,
            auto_refresh: this.config.enableRealTimeDashboard
        };
        this.dashboards.set('bottleneck_analysis', bottleneckDashboard);
    }
    createDefaultReportTemplates() {
        // Executive Summary Report Template
        const executiveSummaryTemplate = {
            id: 'executive_summary',
            name: 'Executive Performance Summary',
            description: 'High-level performance summary for executives',
            report_type: PerformanceDataModel_1.ReportType.PERFORMANCE_COMPARISON,
            template_content: `
# Performance Executive Summary

**Generated:** {{generated_date}}
**Period:** {{time_period.start}} to {{time_period.end}}

## Key Performance Indicators

- **Overall Performance Score:** {{performance_score}}/100 ({{performance_trend}})
- **Critical Issues:** {{critical_issues_count}}
- **Total Bottlenecks Identified:** {{total_bottlenecks}}
- **Recommendations Pending:** {{pending_recommendations}}

## Performance Trends

{{#each trends}}
### {{metric_name}}
- **Current Value:** {{current_value}}
- **Trend:** {{trend_direction}} ({{change_percent}}%)
- **Impact:** {{impact_description}}
{{/each}}

## Top Issues Requiring Attention

{{#each top_bottlenecks}}
### {{title}}
- **Severity:** {{severity}}
- **Impact:** {{impact_score}}/100
- **Component:** {{component}}
- **Recommended Action:** {{primary_recommendation}}
{{/each}}

## Financial Impact

- **Estimated Cost of Issues:** ${'${{estimated_cost}}'}
- **Potential Savings from Fixes:** ${'${{potential_savings}}'}
- **ROI of Recommended Improvements:** ${'{{roi_percentage}}'}%

## Next Steps

{{#each next_steps}}
- {{.}}
{{/each}}
      `,
            supported_formats: [ExportFormat.PDF, ExportFormat.HTML, ExportFormat.JSON],
            parameters: [
                { name: 'time_period', type: ParameterType.OBJECT, required: true, description: 'Time period for the report' },
                { name: 'include_financials', type: ParameterType.BOOLEAN, required: false, default_value: true, description: 'Include financial impact analysis' }
            ]
        };
        this.reportTemplates.set('executive_summary', executiveSummaryTemplate);
        // Technical Detailed Report Template
        const technicalDetailTemplate = {
            id: 'technical_detail',
            name: 'Technical Performance Analysis',
            description: 'Detailed technical analysis for engineering teams',
            report_type: PerformanceDataModel_1.ReportType.BOTTLENECK_SUMMARY,
            template_content: `
# Technical Performance Analysis Report

**Generated:** {{generated_date}}
**Period:** {{time_period.start}} to {{time_period.end}}
**Analysis Scope:** {{analysis_scope}}

## Performance Metrics Summary

| Metric | Current | Previous | Change | Trend |
|--------|---------|----------|--------|-------|
{{#each performance_metrics}}
| {{name}} | {{current_value}} | {{previous_value}} | {{change_percent}}% | {{trend_icon}} |
{{/each}}

## Bottleneck Analysis

### By Type
{{#each bottleneck_types}}
#### {{type_name}} ({{count}} instances)
- **Average Impact Score:** {{average_impact}}
- **Most Affected Components:** {{top_components}}
- **Typical Duration:** {{average_duration}}ms
- **Root Causes:**
{{#each root_causes}}
  - {{description}} ({{confidence}}% confidence)
{{/each}}
{{/each}}

### Critical Bottlenecks

{{#each critical_bottlenecks}}
#### {{id}} - {{component}}.{{operation}}
- **Type:** {{type}}
- **Severity:** {{severity}}
- **Impact Score:** {{impact_score}}/100
- **Duration:** {{duration_ms}}ms
- **Detected:** {{detected_at}}

**Root Cause Analysis:**
{{#each root_causes}}
- **{{category}}:** {{description}}
  - Confidence: {{confidence}}%
  - Evidence: {{evidence_count}} items
  - Recommended Fixes: {{fix_suggestions_count}}
{{/each}}

**Performance Correlations:**
{{#if correlations}}
{{#each correlations}}
- {{metric1}} ↔ {{metric2}}: {{correlation_coefficient}} ({{correlation_strength}})
{{/each}}
{{else}}
- No significant correlations detected
{{/if}}
{{/each}}

## Optimization Recommendations

{{#each recommendations}}
### {{title}} ({{priority}} priority)
**Category:** {{category}}
**Expected Improvement:** {{expected_improvement}}%
**Implementation Effort:** {{implementation_effort}}

{{description}}

**Actions Required:**
{{#each actions}}
- {{description}}
{{/each}}

**Risks:**
{{#each risks}}
- {{.}}
{{/each}}
{{/each}}

## Test Results Analysis

{{#if test_results}}
{{#each test_results}}
### {{test_name}}
- **Execution Date:** {{execution_date}}
- **Success Rate:** {{success_rate}}%
- **Average Response Time:** {{avg_response_time}}ms
- **Throughput:** {{throughput}} rps
- **Issues Found:** {{issues_count}}
{{/each}}
{{else}}
No automated test results available for this period.
{{/if}}

## Correlation Analysis

{{#each correlations}}
### {{metric1.name}} vs {{metric2.name}}
- **Correlation Coefficient:** {{correlation_coefficient}}
- **Correlation Strength:** {{correlation_strength}}
- **Business Impact:** {{business_impact.impact_score}}/100
- **Causality:** {{causality_direction}}

{{#if anomalies}}
**Anomalies Detected:**
{{#each anomalies}}
- {{description}} (Severity: {{severity}})
{{/each}}
{{/if}}
{{/each}}

## Appendix

### Data Sources
{{#each data_sources}}
- **{{name}}:** {{description}} ({{data_points}} data points)
{{/each}}

### Methodology
- **Analysis Period:** {{analysis_period}}
- **Data Quality Score:** {{data_quality_score}}/100
- **Confidence Level:** {{confidence_level}}%
      `,
            supported_formats: [ExportFormat.PDF, ExportFormat.HTML, ExportFormat.JSON],
            parameters: [
                { name: 'time_period', type: ParameterType.OBJECT, required: true, description: 'Time period for the report' },
                { name: 'include_correlations', type: ParameterType.BOOLEAN, required: false, default_value: true, description: 'Include correlation analysis' },
                { name: 'include_test_results', type: ParameterType.BOOLEAN, required: false, default_value: true, description: 'Include test results analysis' },
                { name: 'detail_level', type: ParameterType.STRING, required: false, default_value: 'standard', description: 'Report detail level (basic, standard, detailed)' }
            ]
        };
        this.reportTemplates.set('technical_detail', technicalDetailTemplate);
    }
    async generateDashboard(dashboardId, filters) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard ${dashboardId} not found`);
        }
        const timeRange = this.parseTimeRange(filters?.time_range || dashboard.filters.find(f => f.id === 'time_range')?.default_value || 'last_24_hours');
        const dashboardData = {
            dashboard_id: dashboardId,
            generated_at: new Date(),
            time_range: timeRange,
            widgets: new Map(),
            summary: await this.generateDashboardSummary(timeRange, filters),
            alerts: await this.generateDashboardAlerts(timeRange, filters),
            last_updated: new Date()
        };
        // Generate data for each widget
        for (const widgetConfig of dashboard.widgets) {
            try {
                const widgetData = await this.generateWidgetData(widgetConfig, timeRange, filters);
                dashboardData.widgets.set(widgetConfig.id, widgetData);
            }
            catch (error) {
                // Create error widget data
                dashboardData.widgets.set(widgetConfig.id, {
                    widget_id: widgetConfig.id,
                    type: widgetConfig.type,
                    data: null,
                    status: DataStatus.ERROR,
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                    last_updated: new Date(),
                    metadata: {
                        data_points: 0,
                        time_range: timeRange,
                        aggregation: AggregationType.COUNT,
                        cache_hit: false
                    }
                });
            }
        }
        // Cache the dashboard data
        this.cachedDashboardData.set(dashboardId, dashboardData);
        this.emit('dashboardGenerated', {
            dashboardId,
            widgetCount: dashboardData.widgets.size,
            alertCount: dashboardData.alerts.length,
            timestamp: new Date()
        });
        return dashboardData;
    }
    async generateWidgetData(widgetConfig, timeRange, filters) {
        const cacheKey = this.generateCacheKey(widgetConfig.id, timeRange, filters);
        const cached = this.dataCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp.getTime()) < cached.ttl * 1000) {
            return {
                widget_id: widgetConfig.id,
                type: widgetConfig.type,
                data: cached.data,
                status: DataStatus.SUCCESS,
                last_updated: cached.timestamp,
                metadata: {
                    data_points: Array.isArray(cached.data) ? cached.data.length : 1,
                    time_range: timeRange,
                    aggregation: widgetConfig.configuration.aggregation || AggregationType.COUNT,
                    cache_hit: true
                }
            };
        }
        let data;
        let dataPoints = 0;
        switch (widgetConfig.data_source.source_type) {
            case DataSourceType.BOTTLENECKS:
                data = await this.getBottleneckData(widgetConfig, timeRange, filters);
                break;
            case DataSourceType.PROFILES:
                data = await this.getProfileData(widgetConfig, timeRange, filters);
                break;
            case DataSourceType.CORRELATIONS:
                data = await this.getCorrelationData(widgetConfig, timeRange, filters);
                break;
            case DataSourceType.RECOMMENDATIONS:
                data = await this.getRecommendationData(widgetConfig, timeRange, filters);
                break;
            case DataSourceType.TEST_RESULTS:
                data = await this.getTestResultsData(widgetConfig, timeRange, filters);
                break;
            default:
                throw new Error(`Unsupported data source type: ${widgetConfig.data_source.source_type}`);
        }
        dataPoints = Array.isArray(data) ? data.length : 1;
        // Cache the data
        const cacheTtl = widgetConfig.data_source.cache_duration_seconds || 300; // 5 minutes default
        this.dataCache.set(cacheKey, {
            data,
            timestamp: new Date(),
            ttl: cacheTtl
        });
        return {
            widget_id: widgetConfig.id,
            type: widgetConfig.type,
            data,
            status: DataStatus.SUCCESS,
            last_updated: new Date(),
            metadata: {
                data_points: dataPoints,
                time_range: timeRange,
                aggregation: widgetConfig.configuration.aggregation || AggregationType.COUNT,
                cache_hit: false
            }
        };
    }
    async getBottleneckData(widgetConfig, timeRange, filters) {
        const allBottlenecks = Array.from(this.bottlenecksData.values()).flat();
        const filteredBottlenecks = this.filterBottlenecksByTimeRange(allBottlenecks, timeRange);
        const parameters = widgetConfig.data_source.parameters || {};
        switch (widgetConfig.type) {
            case WidgetType.PIE_CHART:
                if (parameters.group_by === 'type') {
                    return this.groupBottlenecksByType(filteredBottlenecks);
                }
                else if (parameters.group_by === 'severity') {
                    return this.groupBottlenecksBySeverity(filteredBottlenecks);
                }
                break;
            case WidgetType.BAR_CHART:
                if (parameters.group_by === 'component') {
                    return this.groupBottlenecksByComponent(filteredBottlenecks, parameters.filter);
                }
                break;
            case WidgetType.METRIC_CARD:
                if (parameters.filter && parameters.aggregation === 'count') {
                    return this.countBottlenecksWithFilter(filteredBottlenecks, parameters.filter);
                }
                break;
            case WidgetType.TIMELINE:
                return this.createBottleneckTimeline(filteredBottlenecks);
            case WidgetType.HEATMAP:
                return this.createBottleneckHeatmap(filteredBottlenecks, parameters.group_by);
            default:
                return filteredBottlenecks;
        }
    }
    async getProfileData(widgetConfig, timeRange, filters) {
        const allProfiles = Array.from(this.profilesData.values());
        const filteredProfiles = this.filterProfilesByTimeRange(allProfiles, timeRange);
        const parameters = widgetConfig.data_source.parameters || {};
        switch (widgetConfig.type) {
            case WidgetType.GAUGE:
                if (parameters.metric === 'performance_score') {
                    return this.calculateAveragePerformanceScore(filteredProfiles);
                }
                break;
            case WidgetType.LINE_CHART:
                if (parameters.metric === 'response_time') {
                    return this.createResponseTimeTrend(filteredProfiles, parameters.time_granularity);
                }
                break;
            default:
                return filteredProfiles;
        }
    }
    async getCorrelationData(widgetConfig, timeRange, filters) {
        const allCorrelations = Array.from(this.correlationsData.values()).flat();
        return this.filterCorrelationsByTimeRange(allCorrelations, timeRange);
    }
    async getRecommendationData(widgetConfig, timeRange, filters) {
        const allRecommendations = Array.from(this.recommendationsData.values()).flat();
        const parameters = widgetConfig.data_source.parameters || {};
        let filteredRecommendations = allRecommendations;
        if (parameters.sort_by === 'priority') {
            filteredRecommendations = this.sortRecommendationsByPriority(filteredRecommendations);
        }
        if (parameters.limit) {
            filteredRecommendations = filteredRecommendations.slice(0, parameters.limit);
        }
        return filteredRecommendations;
    }
    async getTestResultsData(widgetConfig, timeRange, filters) {
        return Array.from(this.testResultsData.values());
    }
    async generateReport(templateId, parameters, format = ExportFormat.HTML) {
        const template = this.reportTemplates.get(templateId);
        if (!template) {
            throw new Error(`Report template ${templateId} not found`);
        }
        if (!template.supported_formats.includes(format)) {
            throw new Error(`Format ${format} not supported for template ${templateId}`);
        }
        // Validate required parameters
        for (const param of template.parameters) {
            if (param.required && parameters[param.name] === undefined) {
                throw new Error(`Required parameter ${param.name} is missing`);
            }
        }
        // Gather report data
        const reportData = await this.gatherReportData(template, parameters);
        // Render template
        const renderedContent = this.renderTemplate(template.template_content, reportData);
        // Convert to requested format
        const exportData = await this.convertToFormat(renderedContent, format, templateId);
        this.emit('reportGenerated', {
            templateId,
            format,
            size: exportData.size_bytes,
            timestamp: new Date()
        });
        return exportData;
    }
    async gatherReportData(template, parameters) {
        const data = {
            generated_date: new Date().toISOString(),
            ...parameters
        };
        const timePeriod = parameters.time_period || this.parseTimeRange('last_7_days');
        // Gather bottleneck data
        const allBottlenecks = Array.from(this.bottlenecksData.values()).flat();
        const filteredBottlenecks = this.filterBottlenecksByTimeRange(allBottlenecks, timePeriod);
        data.total_bottlenecks = filteredBottlenecks.length;
        data.critical_issues_count = filteredBottlenecks.filter(b => b.severity === PerformanceDataModel_1.BottleneckSeverity.CRITICAL).length;
        data.top_bottlenecks = filteredBottlenecks
            .sort((a, b) => b.impact_score - a.impact_score)
            .slice(0, 5)
            .map(b => ({
            title: `${b.component}.${b.operation}`,
            severity: b.severity,
            impact_score: b.impact_score,
            component: b.component,
            primary_recommendation: b.root_causes[0]?.fix_suggestions[0]?.title || 'No recommendation available'
        }));
        // Gather profile data
        const allProfiles = Array.from(this.profilesData.values());
        const filteredProfiles = this.filterProfilesByTimeRange(allProfiles, timePeriod);
        data.performance_score = this.calculateAveragePerformanceScore(filteredProfiles);
        data.performance_trend = this.calculatePerformanceTrend(filteredProfiles);
        // Gather recommendations
        const allRecommendations = Array.from(this.recommendationsData.values()).flat();
        data.pending_recommendations = allRecommendations.length;
        data.recommendations = allRecommendations.slice(0, 10);
        // Calculate financial impact (simplified)
        data.estimated_cost = filteredBottlenecks.reduce((sum, b) => sum + (b.impact_score * 100), 0);
        data.potential_savings = allRecommendations.reduce((sum, r) => sum + (r.expected_improvement * 1000), 0);
        data.roi_percentage = data.potential_savings > 0 ? ((data.potential_savings - data.estimated_cost) / data.estimated_cost * 100).toFixed(1) : 0;
        // Generate next steps
        data.next_steps = this.generateNextSteps(filteredBottlenecks, allRecommendations);
        return data;
    }
    renderTemplate(templateContent, data) {
        // Simple template rendering - in production would use a proper template engine like Handlebars
        let rendered = templateContent;
        // Replace simple variables
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, String(value));
        }
        // Handle arrays (simplified)
        rendered = rendered.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, itemTemplate) => {
            const array = data[arrayName];
            if (!Array.isArray(array))
                return '';
            return array.map(item => {
                let itemRendered = itemTemplate;
                for (const [key, value] of Object.entries(item)) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    itemRendered = itemRendered.replace(regex, String(value));
                }
                return itemRendered;
            }).join('');
        });
        return rendered;
    }
    async convertToFormat(content, format, templateId) {
        const timestamp = Date.now();
        const filename = `${templateId}_${timestamp}.${format}`;
        switch (format) {
            case ExportFormat.HTML:
                return {
                    format,
                    content: this.wrapInHtmlDocument(content),
                    filename,
                    mime_type: 'text/html',
                    size_bytes: Buffer.byteLength(content)
                };
            case ExportFormat.JSON:
                const jsonContent = JSON.stringify({ content, generated_at: new Date() }, null, 2);
                return {
                    format,
                    content: jsonContent,
                    filename,
                    mime_type: 'application/json',
                    size_bytes: Buffer.byteLength(jsonContent)
                };
            case ExportFormat.PDF:
                // In production, would use a library like Puppeteer or PDFKit
                const pdfContent = `PDF: ${content}`;
                return {
                    format,
                    content: Buffer.from(pdfContent),
                    filename,
                    mime_type: 'application/pdf',
                    size_bytes: Buffer.byteLength(pdfContent)
                };
            default:
                throw new Error(`Conversion to ${format} not implemented`);
        }
    }
    wrapInHtmlDocument(content) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric { background-color: #f9f9f9; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #388e3c; }
    </style>
</head>
<body>
${content.replace(/\n/g, '<br>')}
</body>
</html>
    `;
    }
    // Utility methods for data processing
    parseTimeRange(timeRangeStr) {
        const end = new Date();
        let start = new Date();
        switch (timeRangeStr) {
            case 'last_hour':
                start.setHours(end.getHours() - 1);
                break;
            case 'last_24_hours':
                start.setDate(end.getDate() - 1);
                break;
            case 'last_7_days':
                start.setDate(end.getDate() - 7);
                break;
            case 'last_30_days':
                start.setDate(end.getDate() - 30);
                break;
            default:
                start.setDate(end.getDate() - 1);
        }
        return {
            start,
            end,
            granularity: PerformanceDataModel_1.TimeGranularity.HOUR
        };
    }
    filterBottlenecksByTimeRange(bottlenecks, timeRange) {
        return bottlenecks.filter(b => b.detected_at >= timeRange.start && b.detected_at <= timeRange.end);
    }
    filterProfilesByTimeRange(profiles, timeRange) {
        return profiles.filter(p => p.start_time >= timeRange.start && p.start_time <= timeRange.end);
    }
    filterCorrelationsByTimeRange(correlations, timeRange) {
        return correlations.filter(c => c.analysis_timestamp >= timeRange.start && c.analysis_timestamp <= timeRange.end);
    }
    groupBottlenecksByType(bottlenecks) {
        const grouped = new Map();
        for (const bottleneck of bottlenecks) {
            grouped.set(bottleneck.type, (grouped.get(bottleneck.type) || 0) + 1);
        }
        return Array.from(grouped.entries()).map(([type, count]) => ({
            name: type.replace(/_/g, ' ').toUpperCase(),
            value: count,
            percentage: (count / bottlenecks.length * 100).toFixed(1)
        }));
    }
    groupBottlenecksBySeverity(bottlenecks) {
        const grouped = new Map();
        for (const bottleneck of bottlenecks) {
            grouped.set(bottleneck.severity, (grouped.get(bottleneck.severity) || 0) + 1);
        }
        return Array.from(grouped.entries()).map(([severity, count]) => ({
            name: severity.toUpperCase(),
            value: count,
            percentage: (count / bottlenecks.length * 100).toFixed(1)
        }));
    }
    groupBottlenecksByComponent(bottlenecks, filter) {
        let filteredBottlenecks = bottlenecks;
        if (filter) {
            filteredBottlenecks = bottlenecks.filter(b => {
                for (const [key, value] of Object.entries(filter)) {
                    if (b[key] !== value) {
                        return false;
                    }
                }
                return true;
            });
        }
        const grouped = new Map();
        for (const bottleneck of filteredBottlenecks) {
            grouped.set(bottleneck.component, (grouped.get(bottleneck.component) || 0) + 1);
        }
        return Array.from(grouped.entries()).map(([component, count]) => ({
            name: component,
            value: count
        }));
    }
    countBottlenecksWithFilter(bottlenecks, filter) {
        return bottlenecks.filter(b => {
            for (const [key, value] of Object.entries(filter)) {
                if (b[key] !== value) {
                    return false;
                }
            }
            return true;
        }).length;
    }
    createBottleneckTimeline(bottlenecks) {
        return bottlenecks.map(b => ({
            timestamp: b.detected_at,
            type: b.type,
            severity: b.severity,
            component: b.component,
            impact: b.impact_score
        })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    createBottleneckHeatmap(bottlenecks, groupBy) {
        // Simplified heatmap data structure
        const heatmapData = {};
        for (const bottleneck of bottlenecks) {
            const key1 = bottleneck[groupBy[0]];
            const key2 = bottleneck[groupBy[1]];
            if (!heatmapData[key1])
                heatmapData[key1] = {};
            if (!heatmapData[key1][key2])
                heatmapData[key1][key2] = 0;
            heatmapData[key1][key2]++;
        }
        return heatmapData;
    }
    calculateAveragePerformanceScore(profiles) {
        if (profiles.length === 0)
            return 0;
        const totalScore = profiles.reduce((sum, p) => sum + p.summary.performance_score, 0);
        return Math.round(totalScore / profiles.length);
    }
    calculatePerformanceTrend(profiles) {
        if (profiles.length < 2)
            return 'stable';
        const sortedProfiles = profiles.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
        const firstHalf = sortedProfiles.slice(0, Math.floor(sortedProfiles.length / 2));
        const secondHalf = sortedProfiles.slice(Math.floor(sortedProfiles.length / 2));
        const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.summary.performance_score, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.summary.performance_score, 0) / secondHalf.length;
        const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        if (change > 5)
            return 'improving';
        if (change < -5)
            return 'degrading';
        return 'stable';
    }
    createResponseTimeTrend(profiles, granularity) {
        // Group profiles by time granularity and calculate average response times
        const grouped = new Map();
        for (const profile of profiles) {
            const timeKey = this.getTimeKey(profile.start_time, granularity);
            const responseTime = profile.metrics
                .filter(m => m.metric_type === PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME)
                .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0) || 0;
            if (!grouped.has(timeKey)) {
                grouped.set(timeKey, { sum: 0, count: 0 });
            }
            const group = grouped.get(timeKey);
            group.sum += responseTime;
            group.count++;
        }
        return Array.from(grouped.entries()).map(([timeKey, data]) => ({
            timestamp: timeKey,
            value: data.count > 0 ? data.sum / data.count : 0
        })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
    getTimeKey(date, granularity) {
        switch (granularity) {
            case 'hour':
                return date.toISOString().slice(0, 13) + ':00:00Z';
            case 'day':
                return date.toISOString().slice(0, 10) + 'T00:00:00Z';
            default:
                return date.toISOString();
        }
    }
    sortRecommendationsByPriority(recommendations) {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return recommendations.sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 0;
            const priorityB = priorityOrder[b.priority] || 0;
            return priorityB - priorityA;
        });
    }
    async generateDashboardSummary(timeRange, filters) {
        const allBottlenecks = Array.from(this.bottlenecksData.values()).flat();
        const filteredBottlenecks = this.filterBottlenecksByTimeRange(allBottlenecks, timeRange);
        const allProfiles = Array.from(this.profilesData.values());
        const filteredProfiles = this.filterProfilesByTimeRange(allProfiles, timeRange);
        const allRecommendations = Array.from(this.recommendationsData.values()).flat();
        return {
            total_profiles: filteredProfiles.length,
            total_bottlenecks: filteredBottlenecks.length,
            critical_issues: filteredBottlenecks.filter(b => b.severity === PerformanceDataModel_1.BottleneckSeverity.CRITICAL).length,
            performance_score: this.calculateAveragePerformanceScore(filteredProfiles),
            trend_direction: this.calculatePerformanceTrend(filteredProfiles),
            top_bottleneck_types: this.getTopBottleneckTypes(filteredBottlenecks),
            recommendations_pending: allRecommendations.length
        };
    }
    getTopBottleneckTypes(bottlenecks) {
        const typeCounts = new Map();
        for (const bottleneck of bottlenecks) {
            typeCounts.set(bottleneck.type, (typeCounts.get(bottleneck.type) || 0) + 1);
        }
        return Array.from(typeCounts.entries())
            .map(([type, count]) => ({
            type,
            count,
            percentage: (count / bottlenecks.length) * 100
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }
    async generateDashboardAlerts(timeRange, filters) {
        const alerts = [];
        const allBottlenecks = Array.from(this.bottlenecksData.values()).flat();
        const criticalBottlenecks = allBottlenecks.filter(b => b.severity === PerformanceDataModel_1.BottleneckSeverity.CRITICAL &&
            b.detected_at >= timeRange.start &&
            b.detected_at <= timeRange.end);
        for (const bottleneck of criticalBottlenecks.slice(0, 5)) {
            alerts.push({
                id: this.generateAlertId(),
                type: AlertType.BOTTLENECK_DETECTED,
                severity: AlertSeverity.CRITICAL,
                title: `Critical Bottleneck in ${bottleneck.component}`,
                description: `${bottleneck.type} bottleneck detected with impact score ${bottleneck.impact_score}`,
                triggered_at: bottleneck.detected_at,
                action_required: true
            });
        }
        return alerts;
    }
    generateNextSteps(bottlenecks, recommendations) {
        const steps = [];
        const criticalBottlenecks = bottlenecks.filter(b => b.severity === PerformanceDataModel_1.BottleneckSeverity.CRITICAL);
        if (criticalBottlenecks.length > 0) {
            steps.push(`Address ${criticalBottlenecks.length} critical performance bottlenecks immediately`);
        }
        const highPriorityRecommendations = recommendations.filter(r => r.priority === 'high');
        if (highPriorityRecommendations.length > 0) {
            steps.push(`Implement ${highPriorityRecommendations.length} high-priority optimization recommendations`);
        }
        if (bottlenecks.length > 10) {
            steps.push('Conduct comprehensive performance review and optimization planning');
        }
        steps.push('Schedule regular performance monitoring and review meetings');
        return steps;
    }
    async refreshAllDashboards() {
        for (const [dashboardId] of this.dashboards) {
            try {
                await this.generateDashboard(dashboardId);
            }
            catch (error) {
                console.error(`Failed to refresh dashboard ${dashboardId}:`, error instanceof Error ? error.message : 'Unknown error');
            }
        }
    }
    startScheduledReports() {
        for (const schedule of this.config.reportSchedules) {
            if (schedule.enabled) {
                // In production, would use a proper cron library
                console.log(`Scheduled report ${schedule.name} would be set up with cron: ${schedule.cron_expression}`);
            }
        }
    }
    generateCacheKey(widgetId, timeRange, filters) {
        const filterStr = filters ? JSON.stringify(filters) : '';
        return `${widgetId}_${timeRange.start.getTime()}_${timeRange.end.getTime()}_${filterStr}`;
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Public API methods
    getDashboard(dashboardId) {
        return this.dashboards.get(dashboardId);
    }
    getAllDashboards() {
        return Array.from(this.dashboards.values());
    }
    getCachedDashboardData(dashboardId) {
        return this.cachedDashboardData.get(dashboardId);
    }
    getReportTemplate(templateId) {
        return this.reportTemplates.get(templateId);
    }
    getAllReportTemplates() {
        return Array.from(this.reportTemplates.values());
    }
    clearCache() {
        this.dataCache.clear();
        this.cachedDashboardData.clear();
    }
    getReportingStatistics() {
        return {
            total_dashboards: this.dashboards.size,
            total_report_templates: this.reportTemplates.size,
            cached_dashboard_data: this.cachedDashboardData.size,
            cached_widget_data: this.dataCache.size,
            scheduled_reports: this.config.reportSchedules.length
        };
    }
    async shutdown() {
        // Clear scheduled intervals
        for (const timeout of this.scheduledReports.values()) {
            clearTimeout(timeout);
        }
        // Clear caches
        this.clearCache();
        this.dashboards.clear();
        this.reportTemplates.clear();
        this.scheduledReports.clear();
        console.log('Bottleneck Reporting Service shutdown complete');
    }
    async exportReport(reportId, format) {
        return { url: `/exports/${reportId}.${format}` };
    }
    getAvailableDashboards() {
        return [];
    }
    getAvailableTemplates() {
        return [];
    }
}
exports.BottleneckReportingService = BottleneckReportingService;

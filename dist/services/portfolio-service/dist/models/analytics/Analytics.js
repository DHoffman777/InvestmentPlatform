"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrillDownLevel = exports.AggregationPeriod = exports.VisualizationType = exports.AnalyticsMetricType = void 0;
var AnalyticsMetricType;
(function (AnalyticsMetricType) {
    AnalyticsMetricType["PORTFOLIO_PERFORMANCE"] = "PORTFOLIO_PERFORMANCE";
    AnalyticsMetricType["ASSET_ALLOCATION"] = "ASSET_ALLOCATION";
    AnalyticsMetricType["RISK_METRICS"] = "RISK_METRICS";
    AnalyticsMetricType["SECTOR_ANALYSIS"] = "SECTOR_ANALYSIS";
    AnalyticsMetricType["GEOGRAPHIC_ANALYSIS"] = "GEOGRAPHIC_ANALYSIS";
    AnalyticsMetricType["MARKET_EXPOSURE"] = "MARKET_EXPOSURE";
    AnalyticsMetricType["CORRELATION_ANALYSIS"] = "CORRELATION_ANALYSIS";
    AnalyticsMetricType["ATTRIBUTION_ANALYSIS"] = "ATTRIBUTION_ANALYSIS";
    AnalyticsMetricType["CONCENTRATION_ANALYSIS"] = "CONCENTRATION_ANALYSIS";
    AnalyticsMetricType["LIQUIDITY_ANALYSIS"] = "LIQUIDITY_ANALYSIS";
})(AnalyticsMetricType || (exports.AnalyticsMetricType = AnalyticsMetricType = {}));
var VisualizationType;
(function (VisualizationType) {
    VisualizationType["LINE_CHART"] = "LINE_CHART";
    VisualizationType["BAR_CHART"] = "BAR_CHART";
    VisualizationType["PIE_CHART"] = "PIE_CHART";
    VisualizationType["DONUT_CHART"] = "DONUT_CHART";
    VisualizationType["SCATTER_PLOT"] = "SCATTER_PLOT";
    VisualizationType["HEATMAP"] = "HEATMAP";
    VisualizationType["TREEMAP"] = "TREEMAP";
    VisualizationType["BUBBLE_CHART"] = "BUBBLE_CHART";
    VisualizationType["CANDLESTICK"] = "CANDLESTICK";
    VisualizationType["AREA_CHART"] = "AREA_CHART";
    VisualizationType["WATERFALL"] = "WATERFALL";
    VisualizationType["GAUGE"] = "GAUGE";
})(VisualizationType || (exports.VisualizationType = VisualizationType = {}));
var AggregationPeriod;
(function (AggregationPeriod) {
    AggregationPeriod["DAILY"] = "DAILY";
    AggregationPeriod["WEEKLY"] = "WEEKLY";
    AggregationPeriod["MONTHLY"] = "MONTHLY";
    AggregationPeriod["QUARTERLY"] = "QUARTERLY";
    AggregationPeriod["YEARLY"] = "YEARLY";
    AggregationPeriod["CUSTOM"] = "CUSTOM";
})(AggregationPeriod || (exports.AggregationPeriod = AggregationPeriod = {}));
var DrillDownLevel;
(function (DrillDownLevel) {
    DrillDownLevel["PORTFOLIO"] = "PORTFOLIO";
    DrillDownLevel["ASSET_CLASS"] = "ASSET_CLASS";
    DrillDownLevel["SECTOR"] = "SECTOR";
    DrillDownLevel["INDUSTRY"] = "INDUSTRY";
    DrillDownLevel["SECURITY"] = "SECURITY";
    DrillDownLevel["POSITION"] = "POSITION";
})(DrillDownLevel || (exports.DrillDownLevel = DrillDownLevel = {}));

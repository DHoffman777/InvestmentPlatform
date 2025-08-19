"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeGranularity = exports.ActionType = exports.RecommendationPriority = exports.RecommendationCategory = exports.TrendDirection = exports.ReportType = exports.AlertSeverity = exports.AlertType = exports.LoadLevel = exports.FilterAction = exports.FilterType = exports.EfficiencyRating = exports.ImplementationEffort = exports.CodeChangeType = exports.FixCategory = exports.EvidenceType = exports.RootCauseCategory = exports.BottleneckSeverity = exports.BottleneckType = exports.ProfileStatus = exports.ProfileTargetType = exports.PerformanceMetricType = exports.PerformanceCategory = exports.PerformanceDataSource = void 0;
// Enums
var PerformanceDataSource;
(function (PerformanceDataSource) {
    PerformanceDataSource["APPLICATION_PROFILER"] = "application_profiler";
    PerformanceDataSource["SYSTEM_MONITOR"] = "system_monitor";
    PerformanceDataSource["DATABASE_PROFILER"] = "database_profiler";
    PerformanceDataSource["NETWORK_MONITOR"] = "network_monitor";
    PerformanceDataSource["LOAD_BALANCER"] = "load_balancer";
    PerformanceDataSource["CDN"] = "cdn";
    PerformanceDataSource["CUSTOM_INSTRUMENTATION"] = "custom_instrumentation";
})(PerformanceDataSource || (exports.PerformanceDataSource = PerformanceDataSource = {}));
var PerformanceCategory;
(function (PerformanceCategory) {
    PerformanceCategory["CPU"] = "cpu";
    PerformanceCategory["MEMORY"] = "memory";
    PerformanceCategory["IO"] = "io";
    PerformanceCategory["NETWORK"] = "network";
    PerformanceCategory["DATABASE"] = "database";
    PerformanceCategory["CACHE"] = "cache";
    PerformanceCategory["APPLICATION"] = "application";
    PerformanceCategory["BUSINESS_LOGIC"] = "business_logic";
})(PerformanceCategory || (exports.PerformanceCategory = PerformanceCategory = {}));
var PerformanceMetricType;
(function (PerformanceMetricType) {
    PerformanceMetricType["RESPONSE_TIME"] = "response_time";
    PerformanceMetricType["THROUGHPUT"] = "throughput";
    PerformanceMetricType["CPU_USAGE"] = "cpu_usage";
    PerformanceMetricType["MEMORY_USAGE"] = "memory_usage";
    PerformanceMetricType["DISK_IO"] = "disk_io";
    PerformanceMetricType["NETWORK_IO"] = "network_io";
    PerformanceMetricType["DATABASE_QUERY_TIME"] = "database_query_time";
    PerformanceMetricType["CACHE_HIT_RATE"] = "cache_hit_rate";
    PerformanceMetricType["ERROR_RATE"] = "error_rate";
    PerformanceMetricType["QUEUE_SIZE"] = "queue_size";
    PerformanceMetricType["CONNECTION_POOL_SIZE"] = "connection_pool_size";
    PerformanceMetricType["GARBAGE_COLLECTION_TIME"] = "garbage_collection_time";
})(PerformanceMetricType || (exports.PerformanceMetricType = PerformanceMetricType = {}));
var ProfileTargetType;
(function (ProfileTargetType) {
    ProfileTargetType["SERVICE"] = "service";
    ProfileTargetType["ENDPOINT"] = "endpoint";
    ProfileTargetType["OPERATION"] = "operation";
    ProfileTargetType["TRANSACTION"] = "transaction";
    ProfileTargetType["BATCH_JOB"] = "batch_job";
    ProfileTargetType["SYSTEM_COMPONENT"] = "system_component";
})(ProfileTargetType || (exports.ProfileTargetType = ProfileTargetType = {}));
var ProfileStatus;
(function (ProfileStatus) {
    ProfileStatus["RUNNING"] = "running";
    ProfileStatus["COMPLETED"] = "completed";
    ProfileStatus["FAILED"] = "failed";
    ProfileStatus["CANCELLED"] = "cancelled";
})(ProfileStatus || (exports.ProfileStatus = ProfileStatus = {}));
var BottleneckType;
(function (BottleneckType) {
    BottleneckType["CPU_BOUND"] = "cpu_bound";
    BottleneckType["MEMORY_BOUND"] = "memory_bound";
    BottleneckType["IO_BOUND"] = "io_bound";
    BottleneckType["NETWORK_BOUND"] = "network_bound";
    BottleneckType["DATABASE_BOUND"] = "database_bound";
    BottleneckType["LOCK_CONTENTION"] = "lock_contention";
    BottleneckType["RESOURCE_STARVATION"] = "resource_starvation";
    BottleneckType["ALGORITHM_INEFFICIENCY"] = "algorithm_inefficiency";
    BottleneckType["CONFIGURATION_ISSUE"] = "configuration_issue";
})(BottleneckType || (exports.BottleneckType = BottleneckType = {}));
var BottleneckSeverity;
(function (BottleneckSeverity) {
    BottleneckSeverity["LOW"] = "low";
    BottleneckSeverity["MEDIUM"] = "medium";
    BottleneckSeverity["HIGH"] = "high";
    BottleneckSeverity["CRITICAL"] = "critical";
})(BottleneckSeverity || (exports.BottleneckSeverity = BottleneckSeverity = {}));
var RootCauseCategory;
(function (RootCauseCategory) {
    RootCauseCategory["CODE_INEFFICIENCY"] = "code_inefficiency";
    RootCauseCategory["RESOURCE_CONTENTION"] = "resource_contention";
    RootCauseCategory["CONFIGURATION_ERROR"] = "configuration_error";
    RootCauseCategory["ARCHITECTURAL_ISSUE"] = "architectural_issue";
    RootCauseCategory["DATA_ISSUE"] = "data_issue";
    RootCauseCategory["EXTERNAL_DEPENDENCY"] = "external_dependency";
    RootCauseCategory["INFRASTRUCTURE_LIMIT"] = "infrastructure_limit";
})(RootCauseCategory || (exports.RootCauseCategory = RootCauseCategory = {}));
var EvidenceType;
(function (EvidenceType) {
    EvidenceType["METRIC_CORRELATION"] = "metric_correlation";
    EvidenceType["STACK_TRACE"] = "stack_trace";
    EvidenceType["QUERY_PLAN"] = "query_plan";
    EvidenceType["RESOURCE_UTILIZATION"] = "resource_utilization";
    EvidenceType["TIMING_ANALYSIS"] = "timing_analysis";
    EvidenceType["PATTERN_MATCHING"] = "pattern_matching";
})(EvidenceType || (exports.EvidenceType = EvidenceType = {}));
var FixCategory;
(function (FixCategory) {
    FixCategory["CODE_OPTIMIZATION"] = "code_optimization";
    FixCategory["CONFIGURATION_CHANGE"] = "configuration_change";
    FixCategory["INFRASTRUCTURE_SCALING"] = "infrastructure_scaling";
    FixCategory["ARCHITECTURAL_REFACTOR"] = "architectural_refactor";
    FixCategory["CACHING_STRATEGY"] = "caching_strategy";
    FixCategory["DATABASE_OPTIMIZATION"] = "database_optimization";
    FixCategory["RESOURCE_ALLOCATION"] = "resource_allocation";
})(FixCategory || (exports.FixCategory = FixCategory = {}));
var CodeChangeType;
(function (CodeChangeType) {
    CodeChangeType["MODIFICATION"] = "modification";
    CodeChangeType["ADDITION"] = "addition";
    CodeChangeType["DELETION"] = "deletion";
    CodeChangeType["REFACTORING"] = "refactoring";
})(CodeChangeType || (exports.CodeChangeType = CodeChangeType = {}));
var ImplementationEffort;
(function (ImplementationEffort) {
    ImplementationEffort["LOW"] = "low";
    ImplementationEffort["MEDIUM"] = "medium";
    ImplementationEffort["HIGH"] = "high";
    ImplementationEffort["VERY_HIGH"] = "very_high";
})(ImplementationEffort || (exports.ImplementationEffort = ImplementationEffort = {}));
var EfficiencyRating;
(function (EfficiencyRating) {
    EfficiencyRating["EXCELLENT"] = "excellent";
    EfficiencyRating["GOOD"] = "good";
    EfficiencyRating["FAIR"] = "fair";
    EfficiencyRating["POOR"] = "poor";
    EfficiencyRating["CRITICAL"] = "critical";
})(EfficiencyRating || (exports.EfficiencyRating = EfficiencyRating = {}));
var FilterType;
(function (FilterType) {
    FilterType["INCLUDE"] = "include";
    FilterType["EXCLUDE"] = "exclude";
})(FilterType || (exports.FilterType = FilterType = {}));
var FilterAction;
(function (FilterAction) {
    FilterAction["ALLOW"] = "allow";
    FilterAction["BLOCK"] = "block";
})(FilterAction || (exports.FilterAction = FilterAction = {}));
var LoadLevel;
(function (LoadLevel) {
    LoadLevel["LOW"] = "low";
    LoadLevel["MEDIUM"] = "medium";
    LoadLevel["HIGH"] = "high";
    LoadLevel["PEAK"] = "peak";
})(LoadLevel || (exports.LoadLevel = LoadLevel = {}));
var AlertType;
(function (AlertType) {
    AlertType["BOTTLENECK_DETECTED"] = "bottleneck_detected";
    AlertType["PERFORMANCE_DEGRADATION"] = "performance_degradation";
    AlertType["THRESHOLD_EXCEEDED"] = "threshold_exceeded";
    AlertType["ANOMALY_DETECTED"] = "anomaly_detected";
    AlertType["RESOURCE_EXHAUSTION"] = "resource_exhaustion";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["ERROR"] = "error";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var ReportType;
(function (ReportType) {
    ReportType["PROFILE_ANALYSIS"] = "profile_analysis";
    ReportType["BOTTLENECK_SUMMARY"] = "bottleneck_summary";
    ReportType["TREND_ANALYSIS"] = "trend_analysis";
    ReportType["PERFORMANCE_COMPARISON"] = "performance_comparison";
    ReportType["OPTIMIZATION_REPORT"] = "optimization_report";
})(ReportType || (exports.ReportType = ReportType = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["IMPROVING"] = "improving";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["DEGRADING"] = "degrading";
    TrendDirection["VOLATILE"] = "volatile";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var RecommendationCategory;
(function (RecommendationCategory) {
    RecommendationCategory["PERFORMANCE_OPTIMIZATION"] = "performance_optimization";
    RecommendationCategory["RESOURCE_OPTIMIZATION"] = "resource_optimization";
    RecommendationCategory["ARCHITECTURE_IMPROVEMENT"] = "architecture_improvement";
    RecommendationCategory["CONFIGURATION_TUNING"] = "configuration_tuning";
    RecommendationCategory["MONITORING_ENHANCEMENT"] = "monitoring_enhancement";
})(RecommendationCategory || (exports.RecommendationCategory = RecommendationCategory = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["LOW"] = "low";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["URGENT"] = "urgent";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
var ActionType;
(function (ActionType) {
    ActionType["CODE_CHANGE"] = "code_change";
    ActionType["CONFIGURATION_UPDATE"] = "configuration_update";
    ActionType["INFRASTRUCTURE_CHANGE"] = "infrastructure_change";
    ActionType["MONITORING_SETUP"] = "monitoring_setup";
    ActionType["TESTING"] = "testing";
})(ActionType || (exports.ActionType = ActionType = {}));
var TimeGranularity;
(function (TimeGranularity) {
    TimeGranularity["SECOND"] = "second";
    TimeGranularity["MINUTE"] = "minute";
    TimeGranularity["HOUR"] = "hour";
    TimeGranularity["DAY"] = "day";
    TimeGranularity["WEEK"] = "week";
    TimeGranularity["MONTH"] = "month";
})(TimeGranularity || (exports.TimeGranularity = TimeGranularity = {}));

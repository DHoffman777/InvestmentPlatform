"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertStatus = exports.AlertActionType = exports.AlertSeverity = exports.AlertType = exports.ReportStatus = exports.ReportFormat = exports.ReportType = exports.RecommendationType = exports.TimeGranularity = exports.ScalingType = exports.ThresholdOperator = exports.PredictionAlgorithm = exports.ModelType = exports.ResourceType = void 0;
var ResourceType;
(function (ResourceType) {
    ResourceType["SERVER"] = "server";
    ResourceType["DATABASE"] = "database";
    ResourceType["CONTAINER"] = "container";
    ResourceType["VIRTUAL_MACHINE"] = "virtual_machine";
    ResourceType["KUBERNETES_POD"] = "kubernetes_pod";
    ResourceType["LOAD_BALANCER"] = "load_balancer";
    ResourceType["CACHE"] = "cache";
    ResourceType["MESSAGE_QUEUE"] = "message_queue";
    ResourceType["STORAGE"] = "storage";
    ResourceType["APPLICATION"] = "application";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ModelType;
(function (ModelType) {
    ModelType["TIME_SERIES"] = "time_series";
    ModelType["REGRESSION"] = "regression";
    ModelType["NEURAL_NETWORK"] = "neural_network";
    ModelType["ARIMA"] = "arima";
    ModelType["LINEAR_REGRESSION"] = "linear_regression";
    ModelType["EXPONENTIAL_SMOOTHING"] = "exponential_smoothing";
    ModelType["SEASONAL_DECOMPOSITION"] = "seasonal_decomposition";
    ModelType["PROPHET"] = "prophet";
    ModelType["ENSEMBLE"] = "ensemble";
})(ModelType || (exports.ModelType = ModelType = {}));
var PredictionAlgorithm;
(function (PredictionAlgorithm) {
    PredictionAlgorithm["LINEAR_REGRESSION"] = "linear_regression";
    PredictionAlgorithm["POLYNOMIAL_REGRESSION"] = "polynomial_regression";
    PredictionAlgorithm["ARIMA"] = "arima";
    PredictionAlgorithm["SARIMA"] = "sarima";
    PredictionAlgorithm["LSTM"] = "lstm";
    PredictionAlgorithm["GRU"] = "gru";
    PredictionAlgorithm["PROPHET"] = "prophet";
    PredictionAlgorithm["EXPONENTIAL_SMOOTHING"] = "exponential_smoothing";
    PredictionAlgorithm["HOLT_WINTERS"] = "holt_winters";
    PredictionAlgorithm["RANDOM_FOREST"] = "random_forest";
    PredictionAlgorithm["SVR"] = "svr";
    PredictionAlgorithm["ELASTIC_NET"] = "elastic_net";
})(PredictionAlgorithm || (exports.PredictionAlgorithm = PredictionAlgorithm = {}));
var ThresholdOperator;
(function (ThresholdOperator) {
    ThresholdOperator["GREATER_THAN"] = "gt";
    ThresholdOperator["GREATER_THAN_EQUAL"] = "gte";
    ThresholdOperator["LESS_THAN"] = "lt";
    ThresholdOperator["LESS_THAN_EQUAL"] = "lte";
    ThresholdOperator["EQUAL"] = "eq";
    ThresholdOperator["NOT_EQUAL"] = "ne";
})(ThresholdOperator || (exports.ThresholdOperator = ThresholdOperator = {}));
var ScalingType;
(function (ScalingType) {
    ScalingType["HORIZONTAL"] = "horizontal";
    ScalingType["VERTICAL"] = "vertical";
    ScalingType["HYBRID"] = "hybrid";
})(ScalingType || (exports.ScalingType = ScalingType = {}));
var TimeGranularity;
(function (TimeGranularity) {
    TimeGranularity["MINUTE"] = "minute";
    TimeGranularity["HOUR"] = "hour";
    TimeGranularity["DAY"] = "day";
    TimeGranularity["WEEK"] = "week";
    TimeGranularity["MONTH"] = "month";
})(TimeGranularity || (exports.TimeGranularity = TimeGranularity = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["PROACTIVE_SCALING"] = "proactive_scaling";
    RecommendationType["REACTIVE_SCALING"] = "reactive_scaling";
    RecommendationType["RESOURCE_OPTIMIZATION"] = "resource_optimization";
    RecommendationType["COST_OPTIMIZATION"] = "cost_optimization";
    RecommendationType["PERFORMANCE_TUNING"] = "performance_tuning";
    RecommendationType["CAPACITY_PLANNING"] = "capacity_planning";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var ReportType;
(function (ReportType) {
    ReportType["CAPACITY_UTILIZATION"] = "capacity_utilization";
    ReportType["SCALING_ANALYSIS"] = "scaling_analysis";
    ReportType["COST_OPTIMIZATION"] = "cost_optimization";
    ReportType["PERFORMANCE_TRENDS"] = "performance_trends";
    ReportType["RESOURCE_EFFICIENCY"] = "resource_efficiency";
    ReportType["EXECUTIVE_SUMMARY"] = "executive_summary";
    ReportType["TECHNICAL_DEEP_DIVE"] = "technical_deep_dive";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportFormat;
(function (ReportFormat) {
    ReportFormat["PDF"] = "pdf";
    ReportFormat["HTML"] = "html";
    ReportFormat["EXCEL"] = "excel";
    ReportFormat["JSON"] = "json";
    ReportFormat["CSV"] = "csv";
})(ReportFormat || (exports.ReportFormat = ReportFormat = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["GENERATING"] = "generating";
    ReportStatus["COMPLETED"] = "completed";
    ReportStatus["FAILED"] = "failed";
    ReportStatus["CANCELLED"] = "cancelled";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var AlertType;
(function (AlertType) {
    AlertType["THRESHOLD_BREACH"] = "threshold_breach";
    AlertType["TREND_ANOMALY"] = "trend_anomaly";
    AlertType["PREDICTION_ALERT"] = "prediction_alert";
    AlertType["SCALING_FAILURE"] = "scaling_failure";
    AlertType["RESOURCE_EXHAUSTION"] = "resource_exhaustion";
    AlertType["COST_SPIKE"] = "cost_spike";
    AlertType["PERFORMANCE_DEGRADATION"] = "performance_degradation";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["CRITICAL"] = "critical";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["LOW"] = "low";
    AlertSeverity["INFO"] = "info";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertActionType;
(function (AlertActionType) {
    AlertActionType["EMAIL"] = "email";
    AlertActionType["SMS"] = "sms";
    AlertActionType["WEBHOOK"] = "webhook";
    AlertActionType["SLACK"] = "slack";
    AlertActionType["TEAMS"] = "teams";
    AlertActionType["PAGERDUTY"] = "pagerduty";
    AlertActionType["AUTO_SCALE"] = "auto_scale";
    AlertActionType["RESTART_SERVICE"] = "restart_service";
    AlertActionType["RUN_SCRIPT"] = "run_script";
})(AlertActionType || (exports.AlertActionType = AlertActionType = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["SUPPRESSED"] = "suppressed";
    AlertStatus["CANCELLED"] = "cancelled";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));

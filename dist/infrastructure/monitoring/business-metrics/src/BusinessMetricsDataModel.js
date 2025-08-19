"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLIANCE_KPIS = exports.RISK_KPIS = exports.PORTFOLIO_KPIS = exports.CLIENT_KPIS = exports.OPERATIONAL_KPIS = exports.FINANCIAL_KPIS = exports.TimeInterval = exports.AggregationMethod = exports.AlertSeverity = exports.MetricCategory = exports.MetricType = void 0;
var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "counter";
    MetricType["GAUGE"] = "gauge";
    MetricType["HISTOGRAM"] = "histogram";
    MetricType["SUMMARY"] = "summary";
    MetricType["RATE"] = "rate";
    MetricType["PERCENTAGE"] = "percentage";
    MetricType["CURRENCY"] = "currency";
    MetricType["DURATION"] = "duration";
})(MetricType || (exports.MetricType = MetricType = {}));
var MetricCategory;
(function (MetricCategory) {
    MetricCategory["FINANCIAL"] = "financial";
    MetricCategory["OPERATIONAL"] = "operational";
    MetricCategory["CLIENT"] = "client";
    MetricCategory["PORTFOLIO"] = "portfolio";
    MetricCategory["TRADING"] = "trading";
    MetricCategory["RISK"] = "risk";
    MetricCategory["COMPLIANCE"] = "compliance";
    MetricCategory["PERFORMANCE"] = "performance";
    MetricCategory["SECURITY"] = "security";
    MetricCategory["SYSTEM"] = "system";
})(MetricCategory || (exports.MetricCategory = MetricCategory = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AggregationMethod;
(function (AggregationMethod) {
    AggregationMethod["SUM"] = "sum";
    AggregationMethod["AVERAGE"] = "average";
    AggregationMethod["MIN"] = "min";
    AggregationMethod["MAX"] = "max";
    AggregationMethod["COUNT"] = "count";
    AggregationMethod["DISTINCT_COUNT"] = "distinct_count";
    AggregationMethod["PERCENTILE_50"] = "percentile_50";
    AggregationMethod["PERCENTILE_95"] = "percentile_95";
    AggregationMethod["PERCENTILE_99"] = "percentile_99";
    AggregationMethod["STANDARD_DEVIATION"] = "standard_deviation";
    AggregationMethod["VARIANCE"] = "variance";
})(AggregationMethod || (exports.AggregationMethod = AggregationMethod = {}));
var TimeInterval;
(function (TimeInterval) {
    TimeInterval["MINUTE"] = "minute";
    TimeInterval["HOUR"] = "hour";
    TimeInterval["DAY"] = "day";
    TimeInterval["WEEK"] = "week";
    TimeInterval["MONTH"] = "month";
    TimeInterval["QUARTER"] = "quarter";
    TimeInterval["YEAR"] = "year";
})(TimeInterval || (exports.TimeInterval = TimeInterval = {}));
exports.FINANCIAL_KPIS = {
    ASSETS_UNDER_MANAGEMENT: 'aum',
    NET_ASSET_FLOWS: 'net_flows',
    REVENUE: 'revenue',
    MANAGEMENT_FEES: 'mgmt_fees',
    PERFORMANCE_FEES: 'perf_fees',
    EXPENSE_RATIO: 'expense_ratio',
    NET_INCOME: 'net_income',
    GROSS_MARGIN: 'gross_margin',
    OPERATING_MARGIN: 'operating_margin',
    RETURN_ON_EQUITY: 'roe',
    RETURN_ON_ASSETS: 'roa',
    REVENUE_PER_CLIENT: 'revenue_per_client',
    CLIENT_LIFETIME_VALUE: 'clv',
    COST_PER_ACQUISITION: 'cpa'
};
exports.OPERATIONAL_KPIS = {
    TRADE_EXECUTION_TIME: 'trade_exec_time',
    SETTLEMENT_SUCCESS_RATE: 'settlement_success',
    SYSTEM_UPTIME: 'uptime',
    API_RESPONSE_TIME: 'api_response_time',
    RECONCILIATION_BREAKS: 'recon_breaks',
    STP_RATE: 'stp_rate',
    FAILED_TRADE_RATE: 'failed_trade_rate',
    DATA_QUALITY_SCORE: 'data_quality',
    OPERATIONAL_EFFICIENCY: 'op_efficiency',
    COST_PER_TRADE: 'cost_per_trade',
    PROCESSING_VOLUME: 'processing_volume'
};
exports.CLIENT_KPIS = {
    CLIENT_COUNT: 'client_count',
    ACTIVE_CLIENTS: 'active_clients',
    NEW_CLIENTS: 'new_clients',
    CLIENT_RETENTION_RATE: 'retention_rate',
    CLIENT_SATISFACTION: 'satisfaction',
    PORTAL_USAGE: 'portal_usage',
    SUPPORT_TICKETS: 'support_tickets',
    ONBOARDING_TIME: 'onboarding_time',
    CHURN_RATE: 'churn_rate',
    CLIENT_ENGAGEMENT: 'engagement',
    REFERRAL_RATE: 'referral_rate'
};
exports.PORTFOLIO_KPIS = {
    TOTAL_RETURN: 'total_return',
    BENCHMARK_EXCESS_RETURN: 'excess_return',
    SHARPE_RATIO: 'sharpe_ratio',
    VOLATILITY: 'volatility',
    MAX_DRAWDOWN: 'max_drawdown',
    INFORMATION_RATIO: 'info_ratio',
    TRACKING_ERROR: 'tracking_error',
    BETA: 'beta',
    ALPHA: 'alpha',
    VAR_95: 'var_95',
    PORTFOLIO_CONCENTRATION: 'concentration',
    TURNOVER_RATE: 'turnover'
};
exports.RISK_KPIS = {
    PORTFOLIO_VAR: 'portfolio_var',
    EXPECTED_SHORTFALL: 'expected_shortfall',
    STRESS_TEST_RESULTS: 'stress_test',
    COUNTERPARTY_EXPOSURE: 'counterparty_exposure',
    LEVERAGE_RATIO: 'leverage',
    LIQUIDITY_RATIO: 'liquidity',
    CONCENTRATION_RISK: 'concentration_risk',
    CREDIT_RISK_SCORE: 'credit_risk',
    OPERATIONAL_RISK_SCORE: 'operational_risk',
    COMPLIANCE_VIOLATIONS: 'compliance_violations'
};
exports.COMPLIANCE_KPIS = {
    REGULATORY_VIOLATIONS: 'reg_violations',
    AUDIT_FINDINGS: 'audit_findings',
    POLICY_EXCEPTIONS: 'policy_exceptions',
    BREACH_RESOLUTION_TIME: 'breach_resolution',
    COMPLIANCE_TRAINING_COMPLETION: 'training_completion',
    DOCUMENT_COMPLETENESS: 'doc_completeness',
    FILING_TIMELINESS: 'filing_timeliness',
    KYC_COMPLETION_RATE: 'kyc_completion',
    AML_ALERTS: 'aml_alerts',
    SUITABILITY_VIOLATIONS: 'suitability_violations'
};

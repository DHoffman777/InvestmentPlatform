export declare enum MetricType {
    COUNTER = "counter",
    GAUGE = "gauge",
    HISTOGRAM = "histogram",
    SUMMARY = "summary",
    RATE = "rate",
    PERCENTAGE = "percentage",
    CURRENCY = "currency",
    DURATION = "duration"
}
export declare enum MetricCategory {
    FINANCIAL = "financial",
    OPERATIONAL = "operational",
    CLIENT = "client",
    PORTFOLIO = "portfolio",
    TRADING = "trading",
    RISK = "risk",
    COMPLIANCE = "compliance",
    PERFORMANCE = "performance",
    SECURITY = "security",
    SYSTEM = "system"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum AggregationMethod {
    SUM = "sum",
    AVERAGE = "average",
    MIN = "min",
    MAX = "max",
    COUNT = "count",
    DISTINCT_COUNT = "distinct_count",
    PERCENTILE_50 = "percentile_50",
    PERCENTILE_95 = "percentile_95",
    PERCENTILE_99 = "percentile_99",
    STANDARD_DEVIATION = "standard_deviation",
    VARIANCE = "variance"
}
export declare enum TimeInterval {
    MINUTE = "minute",
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    QUARTER = "quarter",
    YEAR = "year"
}
export interface MetricDefinition {
    id: string;
    tenantId: string;
    name: string;
    displayName: string;
    description: string;
    category: MetricCategory;
    type: MetricType;
    unit: string;
    sourceTable?: string;
    sourceColumn?: string;
    calculationQuery?: string;
    aggregationMethod: AggregationMethod;
    defaultTimeInterval: TimeInterval;
    dimensions: string[];
    tags: Record<string, string>;
    isActive: boolean;
    isRealTime: boolean;
    refreshInterval: number;
    retentionDays: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface KPITarget {
    id: string;
    metricId: string;
    tenantId: string;
    name: string;
    targetValue: number;
    warningThreshold: number;
    criticalThreshold: number;
    comparisonOperator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    timeFrame: TimeInterval;
    isActive: boolean;
    alertEnabled: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MetricValue {
    id: string;
    metricId: string;
    tenantId: string;
    timestamp: Date;
    value: number;
    dimensions: Record<string, string>;
    tags: Record<string, string>;
    aggregationPeriod: TimeInterval;
    dataQuality: number;
    source: string;
    createdAt: Date;
}
export interface MetricAlert {
    id: string;
    metricId: string;
    kpiTargetId?: string;
    tenantId: string;
    alertType: 'threshold' | 'anomaly' | 'trend' | 'missing_data' | 'composite';
    severity: AlertSeverity;
    status: 'active' | 'resolved' | 'suppressed';
    message: string;
    currentValue: number;
    expectedValue?: number;
    threshold?: number;
    dimensions: Record<string, string>;
    triggeredAt: Date;
    resolvedAt?: Date;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    escalatedAt?: Date;
    suppressedUntil?: Date;
    notificationsSent: string[];
    actionsTaken: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface DashboardTemplate {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    category: string;
    type: 'executive' | 'operational' | 'analytical' | 'compliance';
    layout: DashboardLayout;
    widgets: DashboardWidget[];
    filters: DashboardFilter[];
    permissions: DashboardPermission[];
    isPublic: boolean;
    isDefault: boolean;
    tags: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DashboardLayout {
    columns: number;
    rows: number;
    gridSize: number;
    responsiveBreakpoints: Record<string, number>;
}
export interface DashboardWidget {
    id: string;
    type: 'chart' | 'metric' | 'table' | 'scorecard' | 'gauge' | 'text' | 'iframe';
    title: string;
    position: WidgetPosition;
    size: WidgetSize;
    configuration: WidgetConfiguration;
    dataSource: WidgetDataSource;
    refreshInterval: number;
    isVisible: boolean;
    permissions: string[];
}
export interface WidgetPosition {
    x: number;
    y: number;
    z: number;
}
export interface WidgetSize {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}
export interface WidgetConfiguration {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'treemap';
    colors?: string[];
    showLegend?: boolean;
    showLabels?: boolean;
    animation?: boolean;
    theme?: string;
    customOptions?: Record<string, any>;
}
export interface WidgetDataSource {
    type: 'metric' | 'query' | 'api' | 'static';
    metricIds?: string[];
    query?: string;
    apiEndpoint?: string;
    staticData?: any;
    parameters: Record<string, any>;
    transformations: DataTransformation[];
}
export interface DataTransformation {
    type: 'filter' | 'group' | 'sort' | 'aggregate' | 'calculate' | 'format';
    configuration: Record<string, any>;
}
export interface DashboardFilter {
    id: string;
    name: string;
    type: 'select' | 'multiselect' | 'daterange' | 'text' | 'number' | 'boolean';
    field: string;
    options?: FilterOption[];
    defaultValue: any;
    isRequired: boolean;
    isVisible: boolean;
    dependsOn?: string[];
}
export interface FilterOption {
    label: string;
    value: any;
    isDefault?: boolean;
}
export interface DashboardPermission {
    userId?: string;
    roleId?: string;
    permission: 'view' | 'edit' | 'admin';
    restrictions?: Record<string, any>;
}
export interface BusinessKPI {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    category: MetricCategory;
    ownerUserId: string;
    stakeholders: string[];
    metricIds: string[];
    formula?: string;
    targets: KPITarget[];
    benchmarks: KPIBenchmark[];
    reportingFrequency: TimeInterval;
    businessContext: string;
    actionabilityScore: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'paused' | 'archived';
    lastReviewed: Date;
    nextReview: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface KPIBenchmark {
    id: string;
    name: string;
    type: 'internal' | 'industry' | 'competitor' | 'regulatory';
    value: number;
    source: string;
    dateEstablished: Date;
    validUntil?: Date;
    confidence: number;
    notes?: string;
}
export interface MetricDimension {
    id: string;
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    possibleValues?: string[];
    hierarchy?: string[];
    isFilterable: boolean;
    isGroupable: boolean;
    cardinality: number;
    createdAt: Date;
}
export interface MetricCalculation {
    id: string;
    name: string;
    description: string;
    inputMetrics: string[];
    formula: string;
    outputMetric: string;
    schedule: CalculationSchedule;
    dependencies: string[];
    validationRules: ValidationRule[];
    isEnabled: boolean;
    createdAt: Date;
}
export interface CalculationSchedule {
    frequency: TimeInterval;
    offset: number;
    timezone: string;
    retryPolicy: RetryPolicy;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffMultiplier: number;
    maxBackoffDelay: number;
}
export interface ValidationRule {
    type: 'range' | 'comparison' | 'trend' | 'custom';
    configuration: Record<string, any>;
    errorAction: 'log' | 'alert' | 'fail';
}
export interface MetricExport {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    metricIds: string[];
    format: 'csv' | 'xlsx' | 'json' | 'pdf' | 'xml';
    schedule: ExportSchedule;
    delivery: ExportDelivery;
    filters: Record<string, any>;
    transformations: DataTransformation[];
    isEnabled: boolean;
    lastExecuted?: Date;
    nextExecution?: Date;
    createdBy: string;
    createdAt: Date;
}
export interface ExportSchedule {
    frequency: TimeInterval;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
}
export interface ExportDelivery {
    method: 'email' | 'ftp' | 'sftp' | 's3' | 'api' | 'webhook';
    configuration: Record<string, any>;
    recipients?: string[];
}
export interface MetricSubscription {
    id: string;
    userId: string;
    tenantId: string;
    metricIds: string[];
    kpiIds: string[];
    alertTypes: string[];
    channels: NotificationChannel[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours?: QuietHours;
    filters: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
}
export interface NotificationChannel {
    type: 'email' | 'sms' | 'slack' | 'teams' | 'webhook' | 'mobile_push';
    configuration: Record<string, any>;
    isEnabled: boolean;
}
export interface QuietHours {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeek: number[];
}
export interface MetricAuditLog {
    id: string;
    tenantId: string;
    entityType: 'metric' | 'kpi' | 'dashboard' | 'alert';
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'view' | 'export';
    userId: string;
    timestamp: Date;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    notes?: string;
}
export declare const FINANCIAL_KPIS: {
    readonly ASSETS_UNDER_MANAGEMENT: "aum";
    readonly NET_ASSET_FLOWS: "net_flows";
    readonly REVENUE: "revenue";
    readonly MANAGEMENT_FEES: "mgmt_fees";
    readonly PERFORMANCE_FEES: "perf_fees";
    readonly EXPENSE_RATIO: "expense_ratio";
    readonly NET_INCOME: "net_income";
    readonly GROSS_MARGIN: "gross_margin";
    readonly OPERATING_MARGIN: "operating_margin";
    readonly RETURN_ON_EQUITY: "roe";
    readonly RETURN_ON_ASSETS: "roa";
    readonly REVENUE_PER_CLIENT: "revenue_per_client";
    readonly CLIENT_LIFETIME_VALUE: "clv";
    readonly COST_PER_ACQUISITION: "cpa";
};
export declare const OPERATIONAL_KPIS: {
    readonly TRADE_EXECUTION_TIME: "trade_exec_time";
    readonly SETTLEMENT_SUCCESS_RATE: "settlement_success";
    readonly SYSTEM_UPTIME: "uptime";
    readonly API_RESPONSE_TIME: "api_response_time";
    readonly RECONCILIATION_BREAKS: "recon_breaks";
    readonly STP_RATE: "stp_rate";
    readonly FAILED_TRADE_RATE: "failed_trade_rate";
    readonly DATA_QUALITY_SCORE: "data_quality";
    readonly OPERATIONAL_EFFICIENCY: "op_efficiency";
    readonly COST_PER_TRADE: "cost_per_trade";
    readonly PROCESSING_VOLUME: "processing_volume";
};
export declare const CLIENT_KPIS: {
    readonly CLIENT_COUNT: "client_count";
    readonly ACTIVE_CLIENTS: "active_clients";
    readonly NEW_CLIENTS: "new_clients";
    readonly CLIENT_RETENTION_RATE: "retention_rate";
    readonly CLIENT_SATISFACTION: "satisfaction";
    readonly PORTAL_USAGE: "portal_usage";
    readonly SUPPORT_TICKETS: "support_tickets";
    readonly ONBOARDING_TIME: "onboarding_time";
    readonly CHURN_RATE: "churn_rate";
    readonly CLIENT_ENGAGEMENT: "engagement";
    readonly REFERRAL_RATE: "referral_rate";
};
export declare const PORTFOLIO_KPIS: {
    readonly TOTAL_RETURN: "total_return";
    readonly BENCHMARK_EXCESS_RETURN: "excess_return";
    readonly SHARPE_RATIO: "sharpe_ratio";
    readonly VOLATILITY: "volatility";
    readonly MAX_DRAWDOWN: "max_drawdown";
    readonly INFORMATION_RATIO: "info_ratio";
    readonly TRACKING_ERROR: "tracking_error";
    readonly BETA: "beta";
    readonly ALPHA: "alpha";
    readonly VAR_95: "var_95";
    readonly PORTFOLIO_CONCENTRATION: "concentration";
    readonly TURNOVER_RATE: "turnover";
};
export declare const RISK_KPIS: {
    readonly PORTFOLIO_VAR: "portfolio_var";
    readonly EXPECTED_SHORTFALL: "expected_shortfall";
    readonly STRESS_TEST_RESULTS: "stress_test";
    readonly COUNTERPARTY_EXPOSURE: "counterparty_exposure";
    readonly LEVERAGE_RATIO: "leverage";
    readonly LIQUIDITY_RATIO: "liquidity";
    readonly CONCENTRATION_RISK: "concentration_risk";
    readonly CREDIT_RISK_SCORE: "credit_risk";
    readonly OPERATIONAL_RISK_SCORE: "operational_risk";
    readonly COMPLIANCE_VIOLATIONS: "compliance_violations";
};
export declare const COMPLIANCE_KPIS: {
    readonly REGULATORY_VIOLATIONS: "reg_violations";
    readonly AUDIT_FINDINGS: "audit_findings";
    readonly POLICY_EXCEPTIONS: "policy_exceptions";
    readonly BREACH_RESOLUTION_TIME: "breach_resolution";
    readonly COMPLIANCE_TRAINING_COMPLETION: "training_completion";
    readonly DOCUMENT_COMPLETENESS: "doc_completeness";
    readonly FILING_TIMELINESS: "filing_timeliness";
    readonly KYC_COMPLETION_RATE: "kyc_completion";
    readonly AML_ALERTS: "aml_alerts";
    readonly SUITABILITY_VIOLATIONS: "suitability_violations";
};
export interface AlertRule {
    id: string;
    name: string;
    condition: string;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    actions: string[];
}

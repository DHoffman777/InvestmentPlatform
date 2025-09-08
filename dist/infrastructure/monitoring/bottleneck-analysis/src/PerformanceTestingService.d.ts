import { EventEmitter } from 'events';
export interface PerformanceTestingConfig {
    enableAutomatedTesting: boolean;
    testExecutionTimeout: number;
    maxConcurrentTests: number;
    testResultsRetentionDays: number;
    enableLoadTesting: boolean;
    enableStressTesting: boolean;
    enableEnduranceTesting: boolean;
    enableSpikeTesting: boolean;
    testReportsDirectory: string;
    alertOnRegressions: boolean;
    regressionThreshold: number;
}
export interface PerformanceTest {
    id: string;
    name: string;
    description: string;
    type: TestType;
    configuration: TestConfiguration;
    target: TestTarget;
    success_criteria: SuccessCriteria;
    created_at: Date;
    updated_at: Date;
    enabled: boolean;
}
export interface TestConfiguration {
    load_profile: LoadProfile;
    duration: TestDuration;
    ramp_up: RampUpConfiguration;
    think_time: ThinkTimeConfiguration;
    data_setup: DataSetupConfiguration;
    environment: EnvironmentConfiguration;
    monitoring: MonitoringConfiguration;
}
export interface LoadProfile {
    virtual_users: number;
    requests_per_second?: number;
    concurrent_connections?: number;
    load_pattern: LoadPattern;
    load_distribution: LoadDistribution[];
}
export interface LoadDistribution {
    endpoint: string;
    weight: number;
    method: string;
    headers?: Record<string, string>;
    body?: any;
}
export interface TestDuration {
    total_duration_seconds: number;
    ramp_up_duration_seconds: number;
    steady_state_duration_seconds: number;
    ramp_down_duration_seconds: number;
}
export interface RampUpConfiguration {
    strategy: RampUpStrategy;
    step_size: number;
    step_duration_seconds: number;
}
export interface ThinkTimeConfiguration {
    min_think_time_ms: number;
    max_think_time_ms: number;
    distribution: ThinkTimeDistribution;
}
export interface DataSetupConfiguration {
    use_test_data: boolean;
    test_data_source: string;
    cleanup_after_test: boolean;
    data_isolation: boolean;
}
export interface EnvironmentConfiguration {
    target_url: string;
    environment_name: string;
    headers: Record<string, string>;
    authentication: AuthenticationConfig;
    ssl_verification: boolean;
}
export interface AuthenticationConfig {
    type: AuthenticationType;
    username?: string;
    password?: string;
    token?: string;
    api_key?: string;
}
export interface MonitoringConfiguration {
    collect_system_metrics: boolean;
    collect_application_metrics: boolean;
    collect_database_metrics: boolean;
    custom_metrics: string[];
    sampling_interval_seconds: number;
}
export interface TestTarget {
    application: string;
    service: string;
    endpoints: string[];
    environment: string;
    version?: string;
}
export interface SuccessCriteria {
    max_response_time_ms: number;
    max_error_rate_percent: number;
    min_throughput_rps: number;
    max_cpu_utilization_percent: number;
    max_memory_utilization_percent: number;
    custom_assertions: CustomAssertion[];
}
export interface CustomAssertion {
    name: string;
    metric: string;
    operator: ComparisonOperator;
    threshold: number;
    description: string;
}
export interface TestExecution {
    id: string;
    test_id: string;
    status: TestExecutionStatus;
    start_time: Date;
    end_time?: Date;
    duration_seconds?: number;
    results?: TestResults;
    logs?: TestLog[];
    artifacts?: TestArtifact[];
    triggered_by: string;
    trigger_reason: string;
}
export interface TestResults {
    summary: TestSummary;
    performance_metrics: PerformanceTestMetric[];
    success_criteria_results: CriteriaResult[];
    errors: TestError[];
    warnings: TestWarning[];
    recommendations: TestRecommendation[];
}
export interface TestSummary {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    error_rate_percent: number;
    average_response_time_ms: number;
    p95_response_time_ms: number;
    p99_response_time_ms: number;
    min_response_time_ms: number;
    max_response_time_ms: number;
    throughput_rps: number;
    data_transferred_mb: number;
    virtual_users_max: number;
}
export interface PerformanceTestMetric {
    timestamp: Date;
    metric_name: string;
    metric_value: number;
    metric_unit: string;
    metric_type: TestMetricType;
    endpoint?: string;
    tags: Record<string, string>;
}
export interface CriteriaResult {
    criteria_name: string;
    expected_value: number;
    actual_value: number;
    passed: boolean;
    margin: number;
    description: string;
}
export interface TestError {
    timestamp: Date;
    error_type: string;
    error_message: string;
    error_count: number;
    endpoint?: string;
    http_status?: number;
}
export interface TestWarning {
    timestamp: Date;
    warning_type: string;
    warning_message: string;
    severity: WarningSeverity;
}
export interface TestRecommendation {
    category: RecommendationCategory;
    priority: RecommendationPriority;
    title: string;
    description: string;
    action_items: string[];
}
export interface TestLog {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
}
export interface TestArtifact {
    name: string;
    type: ArtifactType;
    file_path: string;
    size_bytes: number;
    description: string;
}
export interface TestSchedule {
    test_id: string;
    cron_expression: string;
    enabled: boolean;
    timezone: string;
    max_execution_time_minutes: number;
    retry_on_failure: boolean;
    max_retries: number;
    notification_settings: NotificationSettings;
}
export interface NotificationSettings {
    notify_on_success: boolean;
    notify_on_failure: boolean;
    notify_on_regression: boolean;
    email_recipients: string[];
    slack_webhook?: string;
    teams_webhook?: string;
}
export interface RegressionAnalysis {
    test_id: string;
    baseline_execution_id: string;
    current_execution_id: string;
    regression_detected: boolean;
    regression_metrics: RegressionMetric[];
    regression_severity: RegressionSeverity;
    analysis_timestamp: Date;
}
export interface RegressionMetric {
    metric_name: string;
    baseline_value: number;
    current_value: number;
    change_percent: number;
    change_direction: 'improvement' | 'degradation' | 'stable';
    significance: number;
}
export declare enum TestType {
    LOAD_TEST = "load_test",
    STRESS_TEST = "stress_test",
    ENDURANCE_TEST = "endurance_test",
    SPIKE_TEST = "spike_test",
    VOLUME_TEST = "volume_test",
    SMOKE_TEST = "smoke_test",
    BASELINE_TEST = "baseline_test"
}
export declare enum LoadPattern {
    CONSTANT = "constant",
    RAMP_UP = "ramp_up",
    SPIKE = "spike",
    STEP = "step",
    WAVE = "wave",
    CUSTOM = "custom"
}
export declare enum RampUpStrategy {
    LINEAR = "linear",
    EXPONENTIAL = "exponential",
    STEP_WISE = "step_wise",
    CUSTOM = "custom"
}
export declare enum ThinkTimeDistribution {
    UNIFORM = "uniform",
    NORMAL = "normal",
    EXPONENTIAL = "exponential",
    CONSTANT = "constant"
}
export declare enum AuthenticationType {
    NONE = "none",
    BASIC = "basic",
    BEARER = "bearer",
    API_KEY = "api_key",
    OAUTH2 = "oauth2"
}
export declare enum TestExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout"
}
export declare enum TestMetricType {
    RESPONSE_TIME = "response_time",
    THROUGHPUT = "throughput",
    ERROR_RATE = "error_rate",
    CPU_USAGE = "cpu_usage",
    MEMORY_USAGE = "memory_usage",
    NETWORK_IO = "network_io",
    DISK_IO = "disk_io",
    DATABASE_CONNECTIONS = "database_connections",
    CUSTOM = "custom"
}
export declare enum ComparisonOperator {
    LESS_THAN = "lt",
    LESS_THAN_OR_EQUAL = "lte",
    GREATER_THAN = "gt",
    GREATER_THAN_OR_EQUAL = "gte",
    EQUALS = "eq",
    NOT_EQUALS = "ne"
}
export declare enum WarningSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare enum RecommendationCategory {
    PERFORMANCE = "performance",
    SCALABILITY = "scalability",
    RELIABILITY = "reliability",
    CONFIGURATION = "configuration"
}
export declare enum RecommendationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export declare enum ArtifactType {
    LOG_FILE = "log_file",
    REPORT_HTML = "report_html",
    REPORT_JSON = "report_json",
    GRAPH_IMAGE = "graph_image",
    RAW_DATA = "raw_data",
    SCRIPT = "script"
}
export declare enum RegressionSeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    MAJOR = "major",
    CRITICAL = "critical"
}
export declare class PerformanceTestingService extends EventEmitter {
    private config;
    private tests;
    private executions;
    private schedules;
    private activeExecutions;
    private regressionBaselines;
    constructor(config: PerformanceTestingConfig);
    private initializeTestingFramework;
    private createDefaultTests;
    createTest(testDefinition: Partial<PerformanceTest>): Promise<string>;
    executeTest(testId: string, triggeredBy?: string, triggerReason?: string): Promise<string>;
    private runTestExecution;
    private generateTestScript;
    private generateArtilleryScript;
    private generateK6Script;
    private generateEnduranceScript;
    private executeTestScript;
    private parseTestResults;
    private parseArtilleryResults;
    private parseK6Results;
    private parseEnduranceResults;
    private parseStdoutResults;
    private generateSyntheticMetrics;
    private parseErrorsFromStderr;
    private evaluateSuccessCriteria;
    private generateTestRecommendations;
    private generateTestArtifacts;
    private generateHtmlReport;
    private checkForRegressions;
    private analyzeRegression;
    private sendRegressionNotifications;
    private mergeWithDefaults;
    private getDefaultTarget;
    private getDefaultSuccessCriteria;
    private updateExecutionStatus;
    private addExecutionLog;
    private startScheduler;
    private checkScheduledTests;
    private shouldExecuteScheduledTest;
    getTest(testId: string): PerformanceTest | undefined;
    getAllTests(): PerformanceTest[];
    getExecution(executionId: string): TestExecution | undefined;
    getTestExecutions(testId: string): TestExecution[];
    cancelExecution(executionId: string): Promise<boolean>;
    scheduleTest(testId: string, schedule: Omit<TestSchedule, 'test_id'>): void;
    getTestingStatistics(): any;
    private generateTestId;
    private generateExecutionId;
    shutdown(): Promise<any>;
}

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  source: PerformanceDataSource;
  category: PerformanceCategory;
  metric_type: PerformanceMetricType;
  value: number;
  unit: string;
  context: PerformanceContext;
  tags: Record<string, string>;
}

export interface PerformanceProfile {
  id: string;
  target_id: string;
  target_type: ProfileTargetType;
  start_time: Date;
  end_time: Date;
  duration_ms: number;
  status: ProfileStatus;
  metrics: PerformanceMetric[];
  bottlenecks: PerformanceBottleneck[];
  summary: PerformanceProfileSummary;
  configuration: ProfilingConfiguration;
}

export interface PerformanceBottleneck {
  id: string;
  profile_id: string;
  type: BottleneckType;
  severity: BottleneckSeverity;
  component: string;
  operation: string;
  duration_ms: number;
  percentage_of_total: number;
  impact_score: number;
  root_causes: RootCause[];
  context: BottleneckContext;
  detected_at: Date;
  confidence: number;
}

export interface RootCause {
  id: string;
  category: RootCauseCategory;
  description: string;
  confidence: number;
  evidence: Evidence[];
  fix_suggestions: FixSuggestion[];
  impact_assessment: ImpactAssessment;
}

export interface Evidence {
  type: EvidenceType;
  description: string;
  data: any;
  strength: number;
  timestamp: Date;
}

export interface FixSuggestion {
  id: string;
  category: FixCategory;
  title: string;
  description: string;
  implementation_effort: ImplementationEffort;
  expected_improvement: number;
  risks: string[];
  prerequisites: string[];
  code_changes: CodeChange[];
}

export interface CodeChange {
  file_path: string;
  change_type: CodeChangeType;
  description: string;
  before_code?: string;
  after_code?: string;
}

export interface PerformanceProfileSummary {
  total_duration_ms: number;
  cpu_time_ms: number;
  wall_time_ms: number;
  memory_peak_mb: number;
  memory_average_mb: number;
  io_operations: number;
  network_requests: number;
  database_queries: number;
  cache_hits: number;
  cache_misses: number;
  bottleneck_count: number;
  performance_score: number;
  efficiency_rating: EfficiencyRating;
}

export interface ProfilingConfiguration {
  sampling_rate: number;
  include_memory_profiling: boolean;
  include_cpu_profiling: boolean;
  include_io_profiling: boolean;
  include_network_profiling: boolean;
  include_database_profiling: boolean;
  include_cache_profiling: boolean;
  custom_metrics: string[];
  filters: ProfilingFilter[];
  thresholds: PerformanceThreshold[];
}

export interface ProfilingFilter {
  type: FilterType;
  pattern: string;
  action: FilterAction;
}

export interface PerformanceThreshold {
  metric_type: PerformanceMetricType;
  warning_value: number;
  critical_value: number;
  unit: string;
}

export interface PerformanceContext {
  service_name: string;
  endpoint?: string;
  method?: string;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  transaction_id?: string;
  environment: string;
  version: string;
  load_level: LoadLevel;
  concurrent_users?: number;
}

export interface BottleneckContext {
  stack_trace?: string[];
  query_plan?: any;
  network_timing?: NetworkTiming;
  memory_allocation?: MemoryAllocation;
  cpu_profile?: CpuProfile;
  io_profile?: IoProfile;
}

export interface NetworkTiming {
  dns_lookup_ms: number;
  tcp_connection_ms: number;
  ssl_handshake_ms: number;
  request_sent_ms: number;
  waiting_ms: number;
  content_download_ms: number;
}

export interface MemoryAllocation {
  heap_size_mb: number;
  used_heap_mb: number;
  external_memory_mb: number;
  gc_duration_ms: number;
  gc_frequency: number;
}

export interface CpuProfile {
  user_time_ms: number;
  system_time_ms: number;
  idle_time_ms: number;
  cpu_usage_percentage: number;
  context_switches: number;
}

export interface IoProfile {
  read_operations: number;
  write_operations: number;
  read_bytes: number;
  write_bytes: number;
  read_time_ms: number;
  write_time_ms: number;
}

export interface ImpactAssessment {
  performance_impact: number;
  user_experience_impact: number;
  resource_cost_impact: number;
  business_impact: number;
  affected_operations: string[];
  affected_users: number;
}

export interface PerformanceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  bottleneck_id?: string;
  profile_id?: string;
  created_at: Date;
  acknowledged: boolean;
  resolved: boolean;
  assignee?: string;
  escalation_level: number;
}

export interface PerformanceReport {
  id: string;
  report_type: ReportType;
  title: string;
  description: string;
  period: TimePeriod;
  generated_at: Date;
  profiles: PerformanceProfile[];
  bottlenecks: PerformanceBottleneck[];
  trends: PerformanceTrend[];
  recommendations: PerformanceRecommendation[];
  summary: ReportSummary;
}

export interface PerformanceTrend {
  metric_type: PerformanceMetricType;
  time_series: TimeSeriesPoint[];
  trend_direction: TrendDirection;
  change_rate: number;
  significance: number;
  forecast: ForecastPoint[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  anomaly: boolean;
}

export interface ForecastPoint {
  timestamp: Date;
  predicted_value: number;
  confidence_interval: [number, number];
}

export interface PerformanceRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  expected_improvement: number;
  implementation_effort: ImplementationEffort;
  cost_benefit_ratio: number;
  dependencies: string[];
  risks: string[];
  actions: RecommendationAction[];
}

export interface RecommendationAction {
  type: ActionType;
  description: string;
  parameters: Record<string, any>;
  validation: ActionValidation;
}

export interface ActionValidation {
  pre_conditions: string[];
  post_conditions: string[];
  rollback_procedure: string;
}

export interface ReportSummary {
  total_profiles: number;
  total_bottlenecks: number;
  average_performance_score: number;
  performance_degradation: number;
  critical_issues: number;
  resolved_issues: number;
  recommendations_count: number;
  top_bottlenecks: PerformanceBottleneck[];
  performance_improvements: PerformanceImprovement[];
}

export interface PerformanceImprovement {
  area: string;
  before_value: number;
  after_value: number;
  improvement_percentage: number;
  achieved_at: Date;
}

export interface TimePeriod {
  start: Date;
  end: Date;
  granularity: TimeGranularity;
}

// Enums
export enum PerformanceDataSource {
  APPLICATION_PROFILER = 'application_profiler',
  SYSTEM_MONITOR = 'system_monitor',
  DATABASE_PROFILER = 'database_profiler',
  NETWORK_MONITOR = 'network_monitor',
  LOAD_BALANCER = 'load_balancer',
  CDN = 'cdn',
  CUSTOM_INSTRUMENTATION = 'custom_instrumentation'
}

export enum PerformanceCategory {
  CPU = 'cpu',
  MEMORY = 'memory',
  IO = 'io',
  NETWORK = 'network',
  DATABASE = 'database',
  CACHE = 'cache',
  APPLICATION = 'application',
  BUSINESS_LOGIC = 'business_logic'
}

export enum PerformanceMetricType {
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
  CPU_USAGE = 'cpu_usage',
  MEMORY_USAGE = 'memory_usage',
  DISK_IO = 'disk_io',
  NETWORK_IO = 'network_io',
  DATABASE_QUERY_TIME = 'database_query_time',
  CACHE_HIT_RATE = 'cache_hit_rate',
  ERROR_RATE = 'error_rate',
  QUEUE_SIZE = 'queue_size',
  CONNECTION_POOL_SIZE = 'connection_pool_size',
  GARBAGE_COLLECTION_TIME = 'garbage_collection_time'
}

export enum ProfileTargetType {
  SERVICE = 'service',
  ENDPOINT = 'endpoint',
  OPERATION = 'operation',
  TRANSACTION = 'transaction',
  BATCH_JOB = 'batch_job',
  SYSTEM_COMPONENT = 'system_component'
}

export enum ProfileStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum BottleneckType {
  CPU_BOUND = 'cpu_bound',
  MEMORY_BOUND = 'memory_bound',
  IO_BOUND = 'io_bound',
  NETWORK_BOUND = 'network_bound',
  DATABASE_BOUND = 'database_bound',
  LOCK_CONTENTION = 'lock_contention',
  RESOURCE_STARVATION = 'resource_starvation',
  ALGORITHM_INEFFICIENCY = 'algorithm_inefficiency',
  CONFIGURATION_ISSUE = 'configuration_issue'
}

export enum BottleneckSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RootCauseCategory {
  CODE_INEFFICIENCY = 'code_inefficiency',
  RESOURCE_CONTENTION = 'resource_contention',
  CONFIGURATION_ERROR = 'configuration_error',
  ARCHITECTURAL_ISSUE = 'architectural_issue',
  DATA_ISSUE = 'data_issue',
  EXTERNAL_DEPENDENCY = 'external_dependency',
  INFRASTRUCTURE_LIMIT = 'infrastructure_limit'
}

export enum EvidenceType {
  METRIC_CORRELATION = 'metric_correlation',
  STACK_TRACE = 'stack_trace',
  QUERY_PLAN = 'query_plan',
  RESOURCE_UTILIZATION = 'resource_utilization',
  TIMING_ANALYSIS = 'timing_analysis',
  PATTERN_MATCHING = 'pattern_matching'
}

export enum FixCategory {
  CODE_OPTIMIZATION = 'code_optimization',
  CONFIGURATION_CHANGE = 'configuration_change',
  INFRASTRUCTURE_SCALING = 'infrastructure_scaling',
  ARCHITECTURAL_REFACTOR = 'architectural_refactor',
  CACHING_STRATEGY = 'caching_strategy',
  DATABASE_OPTIMIZATION = 'database_optimization',
  RESOURCE_ALLOCATION = 'resource_allocation'
}

export enum CodeChangeType {
  MODIFICATION = 'modification',
  ADDITION = 'addition',
  DELETION = 'deletion',
  REFACTORING = 'refactoring'
}

export enum ImplementationEffort {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum EfficiencyRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical'
}

export enum FilterType {
  INCLUDE = 'include',
  EXCLUDE = 'exclude'
}

export enum FilterAction {
  ALLOW = 'allow',
  BLOCK = 'block'
}

export enum LoadLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PEAK = 'peak'
}

export enum AlertType {
  BOTTLENECK_DETECTED = 'bottleneck_detected',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  ANOMALY_DETECTED = 'anomaly_detected',
  RESOURCE_EXHAUSTION = 'resource_exhaustion'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ReportType {
  PROFILE_ANALYSIS = 'profile_analysis',
  BOTTLENECK_SUMMARY = 'bottleneck_summary',
  TREND_ANALYSIS = 'trend_analysis',
  PERFORMANCE_COMPARISON = 'performance_comparison',
  OPTIMIZATION_REPORT = 'optimization_report'
}

export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DEGRADING = 'degrading',
  VOLATILE = 'volatile'
}

export enum RecommendationCategory {
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  ARCHITECTURE_IMPROVEMENT = 'architecture_improvement',
  CONFIGURATION_TUNING = 'configuration_tuning',
  MONITORING_ENHANCEMENT = 'monitoring_enhancement'
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ActionType {
  CODE_CHANGE = 'code_change',
  CONFIGURATION_UPDATE = 'configuration_update',
  INFRASTRUCTURE_CHANGE = 'infrastructure_change',
  MONITORING_SETUP = 'monitoring_setup',
  TESTING = 'testing'
}

export enum TimeGranularity {
  SECOND = 'second',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

// Configuration interfaces
export interface PerformanceProfilingConfig {
  enabled: boolean;
  sampling_interval_ms: number;
  max_profile_duration_ms: number;
  storage_retention_days: number;
  auto_profile_threshold: number;
  profiling_targets: ProfilingTarget[];
  notification_settings: NotificationSettings;
}

export interface ProfilingTarget {
  type: ProfileTargetType;
  identifier: string;
  enabled: boolean;
  configuration: ProfilingConfiguration;
}

export interface NotificationSettings {
  email_enabled: boolean;
  slack_enabled: boolean;
  webhook_enabled: boolean;
  severity_threshold: AlertSeverity;
  recipients: string[];
}
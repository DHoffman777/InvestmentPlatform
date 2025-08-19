export interface ResourceMetric {
    id: string;
    resourceId: string;
    resourceType: ResourceType;
    metricType: ResourceMetricType;
    value: number;
    unit: string;
    timestamp: Date;
    metadata: ResourceMetricMetadata;
    tags: Record<string, string>;
    dimensions: ResourceDimensions;
    source: ResourceDataSource;
    quality: MetricQuality;
}
export interface ResourceMetricMetadata {
    collectionMethod: 'push' | 'pull' | 'calculated' | 'aggregated';
    accuracy: number;
    samplingRate?: number;
    aggregationWindow?: number;
    derivedFrom?: string[];
    calculationFormula?: string;
    confidence: number;
    dataSource: string;
    collector: string;
    version: string;
}
export interface ResourceDimensions {
    environment: string;
    region: string;
    zone?: string;
    cluster?: string;
    node?: string;
    namespace?: string;
    service?: string;
    instance?: string;
    component?: string;
    team?: string;
    project?: string;
    cost_center?: string;
}
export interface ResourceDataSource {
    id: string;
    name: string;
    type: 'prometheus' | 'cloudwatch' | 'azure_monitor' | 'kubernetes' | 'docker' | 'system' | 'custom';
    endpoint: string;
    authentication?: {
        type: 'api_key' | 'oauth' | 'basic' | 'bearer_token' | 'certificate';
        credentials: Record<string, any>;
    };
    configuration: Record<string, any>;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastSuccessfulCollection?: Date;
    errorCount: number;
    reliability: number;
}
export interface MetricQuality {
    completeness: number;
    accuracy: number;
    timeliness: number;
    consistency: number;
    validity: number;
    overall: number;
    issues: QualityIssue[];
}
export interface QualityIssue {
    type: 'missing_data' | 'outlier' | 'stale_data' | 'inconsistent' | 'invalid_range' | 'duplicate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    recommendation: string;
    detectedAt: Date;
    affectedMetrics: string[];
}
export declare enum ResourceType {
    CPU = "cpu",
    MEMORY = "memory",
    STORAGE = "storage",
    NETWORK = "network",
    DATABASE = "database",
    CACHE = "cache",
    MESSAGE_QUEUE = "message_queue",
    LOAD_BALANCER = "load_balancer",
    CDN = "cdn",
    KUBERNETES_NODE = "kubernetes_node",
    KUBERNETES_POD = "kubernetes_pod",
    DOCKER_CONTAINER = "docker_container",
    AWS_EC2 = "aws_ec2",
    AWS_RDS = "aws_rds",
    AWS_LAMBDA = "aws_lambda",
    AZURE_VM = "azure_vm",
    GCP_COMPUTE = "gcp_compute",
    APPLICATION = "application",
    SERVICE = "service",
    CUSTOM = "custom"
}
export declare enum ResourceMetricType {
    CPU_USAGE_PERCENT = "cpu_usage_percent",
    CPU_LOAD_AVERAGE = "cpu_load_average",
    CPU_CORES_USED = "cpu_cores_used",
    CPU_FREQUENCY = "cpu_frequency",
    CPU_STEAL_TIME = "cpu_steal_time",
    CPU_IDLE_TIME = "cpu_idle_time",
    CPU_WAIT_TIME = "cpu_wait_time",
    MEMORY_USAGE_PERCENT = "memory_usage_percent",
    MEMORY_USED_BYTES = "memory_used_bytes",
    MEMORY_AVAILABLE_BYTES = "memory_available_bytes",
    MEMORY_CACHE_BYTES = "memory_cache_bytes",
    MEMORY_BUFFER_BYTES = "memory_buffer_bytes",
    MEMORY_SWAP_USED = "memory_swap_used",
    MEMORY_PRESSURE = "memory_pressure",
    DISK_USAGE_PERCENT = "disk_usage_percent",
    DISK_USED_BYTES = "disk_used_bytes",
    DISK_AVAILABLE_BYTES = "disk_available_bytes",
    DISK_READ_IOPS = "disk_read_iops",
    DISK_WRITE_IOPS = "disk_write_iops",
    DISK_READ_THROUGHPUT = "disk_read_throughput",
    DISK_WRITE_THROUGHPUT = "disk_write_throughput",
    DISK_LATENCY = "disk_latency",
    DISK_QUEUE_DEPTH = "disk_queue_depth",
    NETWORK_BYTES_IN = "network_bytes_in",
    NETWORK_BYTES_OUT = "network_bytes_out",
    NETWORK_PACKETS_IN = "network_packets_in",
    NETWORK_PACKETS_OUT = "network_packets_out",
    NETWORK_ERRORS_IN = "network_errors_in",
    NETWORK_ERRORS_OUT = "network_errors_out",
    NETWORK_DROPPED_IN = "network_dropped_in",
    NETWORK_DROPPED_OUT = "network_dropped_out",
    NETWORK_LATENCY = "network_latency",
    NETWORK_BANDWIDTH_UTILIZATION = "network_bandwidth_utilization",
    DB_CONNECTIONS_ACTIVE = "db_connections_active",
    DB_CONNECTIONS_IDLE = "db_connections_idle",
    DB_QUERY_EXECUTION_TIME = "db_query_execution_time",
    DB_QUERIES_PER_SECOND = "db_queries_per_second",
    DB_LOCK_WAITS = "db_lock_waits",
    DB_DEADLOCKS = "db_deadlocks",
    DB_BUFFER_HIT_RATIO = "db_buffer_hit_ratio",
    DB_INDEX_USAGE = "db_index_usage",
    CACHE_HIT_RATIO = "cache_hit_ratio",
    CACHE_MISS_RATIO = "cache_miss_ratio",
    CACHE_MEMORY_USAGE = "cache_memory_usage",
    CACHE_CONNECTIONS = "cache_connections",
    CACHE_OPERATIONS_PER_SECOND = "cache_operations_per_second",
    CACHE_EVICTIONS = "cache_evictions",
    APP_RESPONSE_TIME = "app_response_time",
    APP_THROUGHPUT = "app_throughput",
    APP_ERROR_RATE = "app_error_rate",
    APP_ACTIVE_SESSIONS = "app_active_sessions",
    APP_THREAD_POOL_USAGE = "app_thread_pool_usage",
    APP_HEAP_USAGE = "app_heap_usage",
    APP_GC_TIME = "app_gc_time",
    CONTAINER_CPU_USAGE = "container_cpu_usage",
    CONTAINER_MEMORY_USAGE = "container_memory_usage",
    CONTAINER_NETWORK_IO = "container_network_io",
    CONTAINER_DISK_IO = "container_disk_io",
    CONTAINER_RESTART_COUNT = "container_restart_count",
    COST_PER_HOUR = "cost_per_hour",
    COST_PER_REQUEST = "cost_per_request",
    EFFICIENCY_SCORE = "efficiency_score",
    UTILIZATION_SCORE = "utilization_score",
    PERFORMANCE_SCORE = "performance_score",
    AVAILABILITY_SCORE = "availability_score"
}
export interface ResourceUtilizationSnapshot {
    id: string;
    timestamp: Date;
    resourceId: string;
    resourceType: ResourceType;
    metrics: ResourceMetric[];
    utilization: ResourceUtilization;
    efficiency: ResourceEfficiency;
    health: ResourceHealth;
    capacity: ResourceCapacity;
    trends: ResourceTrends;
    anomalies: ResourceAnomaly[];
    recommendations: ResourceRecommendation[];
}
export interface ResourceUtilization {
    overall: number;
    cpu: number;
    memory: number;
    storage: number;
    network: number;
    custom: Record<string, number>;
    peak: {
        value: number;
        timestamp: Date;
        duration: number;
    };
    average: number;
    p95: number;
    p99: number;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
}
export interface ResourceEfficiency {
    score: number;
    breakdown: {
        utilization: number;
        performance: number;
        cost: number;
        reliability: number;
    };
    benchmarks: {
        industry: number;
        internal: number;
        target: number;
    };
    improvements: {
        potential: number;
        priority: 'low' | 'medium' | 'high' | 'critical';
        estimated_savings: number;
        effort_required: 'low' | 'medium' | 'high';
    };
    waste: {
        over_provisioned: number;
        under_utilized: number;
        idle_resources: number;
        inefficient_allocation: number;
    };
}
export interface ResourceHealth {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    score: number;
    indicators: {
        availability: number;
        performance: number;
        errors: number;
        capacity: number;
    };
    issues: ResourceHealthIssue[];
    lastHealthCheck: Date;
    healthHistory: Array<{
        timestamp: Date;
        status: string;
        score: number;
    }>;
}
export interface ResourceHealthIssue {
    id: string;
    type: 'performance' | 'capacity' | 'availability' | 'security' | 'configuration' | 'cost';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    recommendation: string;
    detectedAt: Date;
    resolvedAt?: Date;
    affectedResources: string[];
    tags: string[];
}
export interface ResourceCapacity {
    current: {
        total: Record<string, number>;
        used: Record<string, number>;
        available: Record<string, number>;
        reserved: Record<string, number>;
    };
    limits: {
        soft: Record<string, number>;
        hard: Record<string, number>;
        configured: Record<string, number>;
        theoretical: Record<string, number>;
    };
    forecast: {
        timeHorizon: string;
        predicted: Record<string, number>;
        confidence: number;
        assumptions: string[];
    };
    scaling: {
        auto_scaling_enabled: boolean;
        scale_up_threshold: number;
        scale_down_threshold: number;
        min_capacity: Record<string, number>;
        max_capacity: Record<string, number>;
        scaling_history: ScalingEvent[];
    };
}
export interface ScalingEvent {
    id: string;
    timestamp: Date;
    action: 'scale_up' | 'scale_down' | 'scale_out' | 'scale_in';
    trigger: string;
    before: Record<string, number>;
    after: Record<string, number>;
    reason: string;
    success: boolean;
    duration: number;
    cost_impact: number;
}
export interface ResourceTrends {
    short_term: TrendAnalysis;
    medium_term: TrendAnalysis;
    long_term: TrendAnalysis;
    seasonal: SeasonalPattern[];
    growth: GrowthAnalysis;
    cycles: CyclicalPattern[];
}
export interface TrendAnalysis {
    period: string;
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    slope: number;
    r_squared: number;
    volatility: number;
    change_points: Array<{
        timestamp: Date;
        magnitude: number;
        cause?: string;
    }>;
    outliers: Array<{
        timestamp: Date;
        value: number;
        deviation: number;
    }>;
}
export interface SeasonalPattern {
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    strength: number;
    peak_periods: Array<{
        start: string;
        end: string;
        intensity: number;
    }>;
    off_peak_periods: Array<{
        start: string;
        end: string;
        intensity: number;
    }>;
    confidence: number;
}
export interface GrowthAnalysis {
    rate: number;
    acceleration: number;
    projected: Array<{
        timestamp: Date;
        value: number;
        confidence_lower: number;
        confidence_upper: number;
    }>;
    drivers: Array<{
        factor: string;
        contribution: number;
        confidence: number;
    }>;
}
export interface CyclicalPattern {
    period: number;
    amplitude: number;
    phase: number;
    strength: number;
    confidence: number;
    description: string;
}
export interface ResourceAnomaly {
    id: string;
    timestamp: Date;
    type: 'spike' | 'drop' | 'missing_data' | 'pattern_break' | 'threshold_breach' | 'correlation_break';
    severity: 'low' | 'medium' | 'high' | 'critical';
    metricType: ResourceMetricType;
    value: number;
    expected_value: number;
    deviation: number;
    duration?: number;
    confidence: number;
    description: string;
    potential_causes: string[];
    impact_assessment: {
        performance: 'none' | 'low' | 'medium' | 'high';
        cost: 'none' | 'low' | 'medium' | 'high';
        availability: 'none' | 'low' | 'medium' | 'high';
        user_experience: 'none' | 'low' | 'medium' | 'high';
    };
    related_anomalies: string[];
}
export interface ResourceRecommendation {
    id: string;
    type: 'optimization' | 'scaling' | 'configuration' | 'cost_reduction' | 'performance' | 'security';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    rationale: string;
    implementation: {
        steps: string[];
        effort: 'low' | 'medium' | 'high';
        risk: 'low' | 'medium' | 'high';
        timeline: string;
        prerequisites: string[];
    };
    impact: {
        cost_savings: number;
        performance_improvement: number;
        efficiency_gain: number;
        risk_reduction: number;
    };
    metrics_affected: ResourceMetricType[];
    confidence: number;
    expires_at?: Date;
    applied_at?: Date;
    result?: {
        success: boolean;
        actual_impact: Record<string, number>;
        notes: string;
        timestamp: Date;
    };
}
export interface ResourceAllocation {
    id: string;
    resourceId: string;
    allocation: {
        cpu: AllocationDetail;
        memory: AllocationDetail;
        storage: AllocationDetail;
        network: AllocationDetail;
        custom: Record<string, AllocationDetail>;
    };
    requestor: string;
    purpose: string;
    duration: {
        start: Date;
        end?: Date;
        duration_hours?: number;
    };
    priority: 'low' | 'normal' | 'high' | 'critical';
    status: 'requested' | 'approved' | 'allocated' | 'active' | 'released' | 'expired';
    cost: {
        hourly: number;
        total: number;
        currency: string;
    };
    constraints: AllocationConstraint[];
    tags: Record<string, string>;
}
export interface AllocationDetail {
    requested: number;
    allocated: number;
    used: number;
    reserved: number;
    unit: string;
    efficiency: number;
    waste: number;
}
export interface AllocationConstraint {
    type: 'time_window' | 'resource_limit' | 'cost_limit' | 'location' | 'performance' | 'compliance';
    value: any;
    mandatory: boolean;
    description: string;
}
export interface ResourceCost {
    id: string;
    resourceId: string;
    period: {
        start: Date;
        end: Date;
    };
    costs: {
        compute: CostDetail;
        storage: CostDetail;
        network: CostDetail;
        licensing: CostDetail;
        support: CostDetail;
        total: CostDetail;
    };
    allocation: {
        by_service: Record<string, number>;
        by_team: Record<string, number>;
        by_project: Record<string, number>;
        by_environment: Record<string, number>;
    };
    optimization: {
        potential_savings: number;
        recommendations: string[];
        waste_percentage: number;
    };
    trends: {
        month_over_month: number;
        year_over_year: number;
        projected_monthly: number;
    };
}
export interface CostDetail {
    amount: number;
    currency: string;
    unit: string;
    breakdown: Record<string, number>;
    tags: Record<string, string>;
}
export interface ResourceAlert {
    id: string;
    resourceId: string;
    type: 'threshold' | 'anomaly' | 'trend' | 'efficiency' | 'cost' | 'health' | 'capacity';
    severity: 'info' | 'warning' | 'critical' | 'emergency';
    status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
    title: string;
    description: string;
    metric: ResourceMetricType;
    threshold: {
        value: number;
        operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
        duration?: number;
    };
    current_value: number;
    triggered_at: Date;
    acknowledged_at?: Date;
    resolved_at?: Date;
    assignee?: string;
    tags: string[];
    notifications: AlertNotification[];
    escalation: {
        level: number;
        next_escalation?: Date;
        escalation_policy: string;
    };
}
export interface AlertNotification {
    id: string;
    channel: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
    recipient: string;
    sent_at: Date;
    status: 'sent' | 'delivered' | 'failed' | 'pending';
    response?: string;
}
export interface ResourceMonitoringConfig {
    collection: {
        enabled: boolean;
        interval: number;
        batch_size: number;
        max_retries: number;
        timeout: number;
        data_sources: ResourceDataSource[];
    };
    processing: {
        real_time_enabled: boolean;
        aggregation_intervals: number[];
        retention_days: number;
        quality_checks_enabled: boolean;
        anomaly_detection_enabled: boolean;
    };
    alerting: {
        enabled: boolean;
        default_thresholds: Record<ResourceMetricType, any>;
        notification_channels: string[];
        escalation_policies: any[];
    };
    analysis: {
        trend_analysis_enabled: boolean;
        efficiency_analysis_enabled: boolean;
        capacity_planning_enabled: boolean;
        cost_analysis_enabled: boolean;
        ml_insights_enabled: boolean;
    };
    reporting: {
        enabled: boolean;
        dashboard_refresh_interval: number;
        report_generation_schedule: string[];
        export_formats: string[];
    };
}

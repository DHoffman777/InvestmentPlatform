export interface ResourceMetrics {
    id: string;
    resourceId: string;
    resourceType: ResourceType;
    timestamp: Date;
    cpu: {
        usage: number;
        cores: number;
        frequency: number;
        temperature?: number;
    };
    memory: {
        usage: number;
        total: number;
        available: number;
        cached: number;
        buffers: number;
    };
    disk: {
        usage: number;
        total: number;
        available: number;
        iops: number;
        throughput: {
            read: number;
            write: number;
        };
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
        errors: number;
        latency: number;
    };
    custom: Record<string, number>;
}
export declare enum ResourceType {
    SERVER = "server",
    DATABASE = "database",
    CONTAINER = "container",
    VIRTUAL_MACHINE = "virtual_machine",
    KUBERNETES_POD = "kubernetes_pod",
    LOAD_BALANCER = "load_balancer",
    CACHE = "cache",
    MESSAGE_QUEUE = "message_queue",
    STORAGE = "storage",
    APPLICATION = "application"
}
export interface PredictionModel {
    id: string;
    name: string;
    type: ModelType;
    resourceType: ResourceType;
    metric: string;
    algorithm: PredictionAlgorithm;
    parameters: ModelParameters;
    accuracy: number;
    lastTrained: Date;
    nextTraining?: Date;
    isActive: boolean;
    version: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ModelType {
    TIME_SERIES = "time_series",
    REGRESSION = "regression",
    NEURAL_NETWORK = "neural_network",
    ARIMA = "arima",
    LINEAR_REGRESSION = "linear_regression",
    EXPONENTIAL_SMOOTHING = "exponential_smoothing",
    SEASONAL_DECOMPOSITION = "seasonal_decomposition",
    PROPHET = "prophet",
    ENSEMBLE = "ensemble"
}
export declare enum PredictionAlgorithm {
    LINEAR_REGRESSION = "linear_regression",
    POLYNOMIAL_REGRESSION = "polynomial_regression",
    ARIMA = "arima",
    SARIMA = "sarima",
    LSTM = "lstm",
    GRU = "gru",
    PROPHET = "prophet",
    EXPONENTIAL_SMOOTHING = "exponential_smoothing",
    HOLT_WINTERS = "holt_winters",
    RANDOM_FOREST = "random_forest",
    SVR = "svr",
    ELASTIC_NET = "elastic_net"
}
export interface ModelParameters {
    lookbackPeriod: number;
    predictionHorizon: number;
    seasonality: {
        enabled: boolean;
        period?: number;
        strength?: number;
    };
    trend: {
        enabled: boolean;
        damped?: boolean;
    };
    hyperparameters: Record<string, any>;
    featureEngineering: {
        lagFeatures: number[];
        rollingWindows: number[];
        differencing: number;
        scaling: 'standard' | 'minmax' | 'robust' | 'none';
    };
}
export interface CapacityPrediction {
    id: string;
    modelId: string;
    resourceId: string;
    metric: string;
    predictions: PredictionPoint[];
    confidence: {
        lower: number[];
        upper: number[];
        interval: number;
    };
    metadata: {
        generatedAt: Date;
        dataRange: {
            start: Date;
            end: Date;
        };
        modelAccuracy: number;
        warnings: string[];
    };
}
export interface PredictionPoint {
    timestamp: Date;
    value: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    anomaly: boolean;
}
export interface ScalingThreshold {
    id: string;
    resourceId: string;
    resourceType: ResourceType;
    metric: string;
    thresholds: {
        scaleUp: {
            value: number;
            operator: ThresholdOperator;
            duration: number;
            cooldown: number;
        };
        scaleDown: {
            value: number;
            operator: ThresholdOperator;
            duration: number;
            cooldown: number;
        };
    };
    scalingPolicy: ScalingPolicy;
    isActive: boolean;
    lastTriggered?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ThresholdOperator {
    GREATER_THAN = "gt",
    GREATER_THAN_EQUAL = "gte",
    LESS_THAN = "lt",
    LESS_THAN_EQUAL = "lte",
    EQUAL = "eq",
    NOT_EQUAL = "ne"
}
export interface ScalingPolicy {
    type: ScalingType;
    minInstances: number;
    maxInstances: number;
    scaleUpBy: number;
    scaleDownBy: number;
    scaleUpCooldown: number;
    scaleDownCooldown: number;
    targetValue?: number;
    stepScaling?: StepScalingPolicy[];
}
export declare enum ScalingType {
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical",
    HYBRID = "hybrid"
}
export interface StepScalingPolicy {
    threshold: number;
    adjustment: number;
    adjustmentType: 'absolute' | 'percentage';
}
export interface CapacityTrend {
    id: string;
    resourceId: string;
    metric: string;
    timeRange: {
        start: Date;
        end: Date;
        granularity: TimeGranularity;
    };
    trend: {
        direction: 'increasing' | 'decreasing' | 'stable';
        slope: number;
        correlation: number;
        seasonality: {
            detected: boolean;
            period?: number;
            strength?: number;
        };
    };
    statistics: {
        mean: number;
        median: number;
        stdDev: number;
        min: number;
        max: number;
        percentiles: Record<number, number>;
    };
    changePoints: ChangePoint[];
    forecast: {
        shortTerm: number[];
        longTerm: number[];
        uncertainty: number;
    };
    recommendations: TrendRecommendation[];
    calculatedAt: Date;
}
export declare enum TimeGranularity {
    MINUTE = "minute",
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month"
}
export interface ChangePoint {
    timestamp: Date;
    beforeValue: number;
    afterValue: number;
    changePercent: number;
    significance: number;
    type: 'increase' | 'decrease' | 'level_shift' | 'variance_change';
}
export interface TrendRecommendation {
    type: 'scale_up' | 'scale_down' | 'optimize' | 'investigate';
    priority: 'high' | 'medium' | 'low';
    message: string;
    expectedImpact: string;
    timeframe: string;
    confidence: number;
}
export interface ScalingRecommendation {
    id: string;
    resourceId: string;
    type: RecommendationType;
    action: ScalingAction;
    reasoning: string;
    impact: {
        performance: number;
        cost: number;
        risk: number;
    };
    timeline: {
        immediate: RecommendationStep[];
        shortTerm: RecommendationStep[];
        longTerm: RecommendationStep[];
    };
    priority: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
    generatedAt: Date;
    validUntil: Date;
    implemented: boolean;
    feedback?: RecommendationFeedback;
}
export declare enum RecommendationType {
    PROACTIVE_SCALING = "proactive_scaling",
    REACTIVE_SCALING = "reactive_scaling",
    RESOURCE_OPTIMIZATION = "resource_optimization",
    COST_OPTIMIZATION = "cost_optimization",
    PERFORMANCE_TUNING = "performance_tuning",
    CAPACITY_PLANNING = "capacity_planning"
}
export interface ScalingAction {
    type: 'scale_up' | 'scale_down' | 'migrate' | 'optimize' | 'reallocate';
    target: {
        cpu?: number;
        memory?: number;
        instances?: number;
        storage?: number;
    };
    constraints: {
        budget?: number;
        timeWindow?: {
            start: Date;
            end: Date;
        };
        dependencies?: string[];
    };
}
export interface RecommendationStep {
    order: number;
    description: string;
    action: string;
    estimatedDuration: number;
    risk: 'low' | 'medium' | 'high';
    rollbackPlan?: string;
}
export interface RecommendationFeedback {
    rating: number;
    comment?: string;
    actualImpact?: {
        performance: number;
        cost: number;
    };
    wouldRecommendAgain: boolean;
    submittedAt: Date;
    submittedBy: string;
}
export interface CapacityReport {
    id: string;
    name: string;
    type: ReportType;
    scope: {
        resourceIds: string[];
        resourceTypes: ResourceType[];
        timeRange: {
            start: Date;
            end: Date;
        };
    };
    content: {
        summary: ReportSummary;
        sections: ReportSection[];
        charts: ChartConfiguration[];
        recommendations: ScalingRecommendation[];
    };
    format: ReportFormat[];
    schedule?: ReportSchedule;
    recipients: string[];
    generatedAt: Date;
    nextGeneration?: Date;
    status: ReportStatus;
}
export declare enum ReportType {
    CAPACITY_UTILIZATION = "capacity_utilization",
    SCALING_ANALYSIS = "scaling_analysis",
    COST_OPTIMIZATION = "cost_optimization",
    PERFORMANCE_TRENDS = "performance_trends",
    RESOURCE_EFFICIENCY = "resource_efficiency",
    EXECUTIVE_SUMMARY = "executive_summary",
    TECHNICAL_DEEP_DIVE = "technical_deep_dive"
}
export interface ReportSummary {
    totalResources: number;
    healthyResources: number;
    atRiskResources: number;
    overUtilized: number;
    underUtilized: number;
    costSavingsOpportunity: number;
    performanceImprovementOpportunity: number;
    keyFindings: string[];
    topRecommendations: string[];
}
export interface ReportSection {
    id: string;
    title: string;
    content: string;
    data: any;
    visualizations: string[];
    order: number;
}
export declare enum ReportFormat {
    PDF = "pdf",
    HTML = "html",
    EXCEL = "excel",
    JSON = "json",
    CSV = "csv"
}
export interface ReportSchedule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
}
export declare enum ReportStatus {
    PENDING = "pending",
    GENERATING = "generating",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface CostOptimization {
    id: string;
    resourceId: string;
    currentCost: {
        monthly: number;
        breakdown: {
            compute: number;
            storage: number;
            network: number;
            licenses: number;
        };
    };
    optimizedCost: {
        monthly: number;
        breakdown: {
            compute: number;
            storage: number;
            network: number;
            licenses: number;
        };
    };
    savings: {
        amount: number;
        percentage: number;
    };
    optimizations: OptimizationSuggestion[];
    riskAssessment: {
        level: 'low' | 'medium' | 'high';
        factors: string[];
        mitigation: string[];
    };
    implementationPlan: {
        phases: OptimizationPhase[];
        totalDuration: number;
        prerequisites: string[];
    };
    roi: {
        paybackPeriod: number;
        npv: number;
        irr: number;
    };
}
export interface OptimizationSuggestion {
    type: 'rightsizing' | 'reserved_instances' | 'spot_instances' | 'storage_optimization' | 'license_optimization';
    description: string;
    impact: {
        cost: number;
        performance: number;
        complexity: number;
    };
    effort: 'low' | 'medium' | 'high';
    timeline: string;
}
export interface OptimizationPhase {
    name: string;
    description: string;
    duration: number;
    dependencies: string[];
    deliverables: string[];
    risks: string[];
}
export interface CapacityAlert {
    id: string;
    resourceId: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    conditions: AlertCondition[];
    triggers: AlertTrigger[];
    actions: AlertAction[];
    status: AlertStatus;
    createdAt: Date;
    triggeredAt?: Date;
    resolvedAt?: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    escalationLevel: number;
    suppressedUntil?: Date;
}
export declare enum AlertType {
    THRESHOLD_BREACH = "threshold_breach",
    TREND_ANOMALY = "trend_anomaly",
    PREDICTION_ALERT = "prediction_alert",
    SCALING_FAILURE = "scaling_failure",
    RESOURCE_EXHAUSTION = "resource_exhaustion",
    COST_SPIKE = "cost_spike",
    PERFORMANCE_DEGRADATION = "performance_degradation"
}
export declare enum AlertSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info"
}
export interface AlertCondition {
    metric: string;
    operator: ThresholdOperator;
    value: number;
    duration: number;
    aggregation: 'avg' | 'max' | 'min' | 'sum' | 'count';
}
export interface AlertTrigger {
    type: 'immediate' | 'delayed' | 'recurring';
    delay?: number;
    interval?: number;
    maxOccurrences?: number;
}
export interface AlertAction {
    type: AlertActionType;
    configuration: Record<string, any>;
    order: number;
    condition?: string;
}
export declare enum AlertActionType {
    EMAIL = "email",
    SMS = "sms",
    WEBHOOK = "webhook",
    SLACK = "slack",
    TEAMS = "teams",
    PAGERDUTY = "pagerduty",
    AUTO_SCALE = "auto_scale",
    RESTART_SERVICE = "restart_service",
    RUN_SCRIPT = "run_script"
}
export declare enum AlertStatus {
    ACTIVE = "active",
    RESOLVED = "resolved",
    ACKNOWLEDGED = "acknowledged",
    SUPPRESSED = "suppressed",
    CANCELLED = "cancelled"
}
export interface ChartConfiguration {
    id: string;
    type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge';
    title: string;
    data: {
        labels: string[];
        datasets: ChartDataset[];
    };
    options: {
        responsive: boolean;
        legend: boolean;
        grid: boolean;
        animations: boolean;
        colors: string[];
    };
    timeRange?: {
        start: Date;
        end: Date;
    };
}
export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
}
export interface ResourceInventory {
    id: string;
    name: string;
    type: ResourceType;
    tags: Record<string, string>;
    specifications: {
        cpu: {
            cores: number;
            frequency: number;
            architecture: string;
        };
        memory: {
            total: number;
            type: string;
        };
        storage: {
            total: number;
            type: string;
            iops: number;
        };
        network: {
            bandwidth: number;
            interfaces: number;
        };
    };
    location: {
        region: string;
        zone: string;
        datacenter?: string;
    };
    costs: {
        hourly: number;
        monthly: number;
        currency: string;
    };
    status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
    createdAt: Date;
    updatedAt: Date;
}

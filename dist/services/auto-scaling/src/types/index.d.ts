export interface AutoScalingConfig {
    enabled: boolean;
    provider: 'kubernetes' | 'docker' | 'cloud';
    metrics: {
        sources: MetricSource[];
        aggregationWindow: number;
        evaluationInterval: number;
    };
    rules: ScalingRule[];
    limits: {
        minInstances: number;
        maxInstances: number;
        scaleUpCooldown: number;
        scaleDownCooldown: number;
    };
    notifications: {
        enabled: boolean;
        webhookUrl?: string;
        slackChannel?: string;
        emailRecipients?: string[];
    };
}
export interface MetricSource {
    name: string;
    type: 'prometheus' | 'custom' | 'kubernetes' | 'system';
    endpoint?: string;
    query?: string;
    threshold: number;
    comparison: 'greater_than' | 'less_than' | 'equal' | 'not_equal';
    weight: number;
}
export interface ScalingRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    conditions: ScalingCondition[];
    action: ScalingAction;
    priority: number;
    tags: string[];
}
export interface ScalingCondition {
    metric: string;
    operator: 'and' | 'or';
    threshold: number;
    comparison: 'greater_than' | 'less_than' | 'equal' | 'not_equal';
    duration: number;
}
export interface ScalingAction {
    type: 'scale_up' | 'scale_down' | 'maintain';
    targetInstances?: number;
    scaleByPercent?: number;
    scaleByCount?: number;
    targetServices: string[];
    gracefulShutdown: boolean;
    preScaleHooks?: string[];
    postScaleHooks?: string[];
}
export interface ScalingEvent {
    id: string;
    timestamp: Date;
    rule: string;
    action: ScalingAction;
    reason: string;
    metricsSnapshot: Record<string, number>;
    previousInstances: number;
    newInstances: number;
    success: boolean;
    error?: string;
    duration: number;
}
export interface ServiceMetrics {
    serviceName: string;
    timestamp: Date;
    instances: {
        current: number;
        desired: number;
        healthy: number;
        unhealthy: number;
    };
    resources: {
        cpu: {
            usage: number;
            request: number;
            limit: number;
        };
        memory: {
            usage: number;
            request: number;
            limit: number;
        };
        network: {
            inbound: number;
            outbound: number;
        };
    };
    performance: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        queueLength: number;
    };
    customMetrics: Record<string, number>;
}
export interface AutoScalingDecision {
    timestamp: Date;
    serviceName: string;
    currentInstances: number;
    recommendedInstances: number;
    confidence: number;
    reasoning: string[];
    triggeredRules: string[];
    metricsUsed: Record<string, number>;
    action: 'scale_up' | 'scale_down' | 'maintain';
    urgency: 'low' | 'medium' | 'high' | 'critical';
}
export interface ScalingPrediction {
    serviceName: string;
    timeHorizon: number;
    predictions: Array<{
        timestamp: Date;
        predictedLoad: number;
        recommendedInstances: number;
        confidence: number;
    }>;
    seasonalPatterns: Array<{
        dayOfWeek: number;
        hourOfDay: number;
        expectedMultiplier: number;
    }>;
    trendAnalysis: {
        direction: 'increasing' | 'decreasing' | 'stable';
        rate: number;
        confidence: number;
    };
}
export interface CloudProviderAdapter {
    name: string;
    scaleService(serviceName: string, targetInstances: number): Promise<ScalingResult>;
    getCurrentInstances(serviceName: string): Promise<number>;
    getServiceMetrics(serviceName: string): Promise<ServiceMetrics>;
    getServiceHealth(serviceName: string): Promise<{
        healthy: number;
        unhealthy: number;
        total: number;
    }>;
    validateScalingRequest(serviceName: string, targetInstances: number): Promise<{
        valid: boolean;
        issues: string[];
    }>;
}
export interface ScalingResult {
    success: boolean;
    previousInstances: number;
    newInstances: number;
    duration: number;
    error?: string;
    warnings: string[];
}
export interface AutoScalingReport {
    id: string;
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalScalingEvents: number;
        successfulScalings: number;
        failedScalings: number;
        averageResponseTime: number;
        costImpact: {
            totalCost: number;
            costSavings: number;
            costIncrease: number;
        };
    };
    serviceAnalysis: Array<{
        serviceName: string;
        scalingEvents: number;
        averageInstances: number;
        peakInstances: number;
        minInstances: number;
        utilizationStats: {
            cpu: {
                avg: number;
                max: number;
                min: number;
            };
            memory: {
                avg: number;
                max: number;
                min: number;
            };
        };
        performanceImpact: {
            responseTimeChange: number;
            throughputChange: number;
            errorRateChange: number;
        };
    }>;
    recommendations: Array<{
        type: 'config_change' | 'rule_adjustment' | 'metric_tuning' | 'cost_optimization';
        priority: 'low' | 'medium' | 'high';
        description: string;
        expectedBenefit: string;
        implementationComplexity: 'low' | 'medium' | 'high';
    }>;
    predictions: {
        nextWeek: ScalingPrediction[];
        seasonalForecast: Array<{
            period: string;
            expectedScalingEvents: number;
            peakCapacityNeeded: number;
        }>;
    };
}
export interface AutoScalingServiceConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    metrics: {
        prometheusUrl?: string;
        customEndpoints: string[];
        collectionInterval: number;
    };
    scaling: AutoScalingConfig;
    reporting: {
        enabled: boolean;
        schedule: string;
        retentionDays: number;
    };
    alerts: {
        enabled: boolean;
        webhookUrl?: string;
        slackChannel?: string;
        emailRecipients?: string[];
    };
}
export interface CapacityPlanningIntegration {
    enabled: boolean;
    loadTestServiceUrl: string;
    planningHorizon: number;
    confidenceThreshold: number;
    autoApplyRecommendations: boolean;
}
export interface FinancialServicesScalingProfile {
    marketHours: {
        preMarket: {
            start: string;
            end: string;
        };
        regular: {
            start: string;
            end: string;
        };
        afterMarket: {
            start: string;
            end: string;
        };
        timezone: string;
    };
    tradingPatterns: {
        openingBell: {
            multiplier: number;
            duration: number;
        };
        closingBell: {
            multiplier: number;
            duration: number;
        };
        lunchTime: {
            multiplier: number;
            duration: number;
        };
        monthEnd: {
            multiplier: number;
            days: number;
        };
        quarterEnd: {
            multiplier: number;
            days: number;
        };
    };
    complianceRequirements: {
        minInstancesForRedundancy: number;
        maxScaleDownRate: number;
        requiredApprovalForLargeScale: number;
        auditLogging: boolean;
    };
    riskManagement: {
        maxInstancesPerAvailabilityZone: number;
        requiredHealthCheckGracePeriod: number;
        automaticRollbackOnErrors: boolean;
        catastrophicFailureThreshold: number;
    };
}

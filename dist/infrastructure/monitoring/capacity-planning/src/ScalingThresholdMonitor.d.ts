import { EventEmitter } from 'events';
import { ScalingThreshold, ResourceMetrics, CapacityAlert, ThresholdOperator, ResourceType, AlertAction, AlertActionType } from './CapacityPlanningDataModel';
export interface ThresholdMonitorConfig {
    evaluationInterval: number;
    alertCooldownPeriod: number;
    maxConcurrentAlerts: number;
    enableAutoScaling: boolean;
    defaultThresholds: Record<string, number>;
    escalationRules: EscalationRule[];
    notificationChannels: NotificationChannel[];
}
export interface EscalationRule {
    timeToEscalate: number;
    escalationLevel: number;
    actions: AlertAction[];
}
export interface NotificationChannel {
    type: AlertActionType;
    configuration: Record<string, any>;
    isActive: boolean;
    priority: number;
}
export interface ThresholdEvaluation {
    thresholdId: string;
    resourceId: string;
    metric: string;
    currentValue: number;
    thresholdValue: number;
    operator: ThresholdOperator;
    isTriggered: boolean;
    duration: number;
    confidence: number;
    evaluatedAt: Date;
}
export interface ScalingDecision {
    resourceId: string;
    action: 'scale_up' | 'scale_down' | 'no_action';
    reasoning: string;
    impact: {
        currentCapacity: number;
        targetCapacity: number;
        estimatedCost: number;
        performanceImpact: number;
    };
    confidence: number;
    executionPlan: ScalingStep[];
    rollbackPlan: ScalingStep[];
    decidedAt: Date;
}
export interface ScalingStep {
    order: number;
    action: string;
    parameters: Record<string, any>;
    estimatedDuration: number;
    dependencies: string[];
    validationChecks: string[];
}
export declare class ScalingThresholdMonitor extends EventEmitter {
    private thresholds;
    private activeAlerts;
    private thresholdStates;
    private evaluationTimer;
    private config;
    private scalingExecutor;
    private alertManager;
    constructor(config: ThresholdMonitorConfig);
    createThreshold(thresholdConfig: Partial<ScalingThreshold>): Promise<ScalingThreshold>;
    updateThreshold(thresholdId: string, updates: Partial<ScalingThreshold>): Promise<ScalingThreshold>;
    evaluateThresholds(metrics: ResourceMetrics[]): Promise<ThresholdEvaluation[]>;
    private evaluateThreshold;
    private processEvaluation;
    private createAlert;
    private processAlert;
    private makeScalingDecision;
    private executeScaling;
    private scheduleEscalation;
    acknowledgeAlert(alertId: string, userId: string): Promise<void>;
    resolveAlert(alertId: string, resolution: string): Promise<void>;
    suppressAlert(alertId: string, duration: number): Promise<void>;
    getThresholds(resourceId?: string, resourceType?: ResourceType): Promise<ScalingThreshold[]>;
    getActiveAlerts(resourceId?: string): Promise<CapacityAlert[]>;
    getThresholdMetrics(): Promise<{
        totalThresholds: number;
        activeThresholds: number;
        triggeredThresholds: number;
        averageResponseTime: number;
        falsePositiveRate: number;
    }>;
    private evaluateCondition;
    private extractMetricValue;
    private calculateConfidence;
    private determineAlertType;
    private calculateAlertSeverity;
    private generateAlertTitle;
    private generateAlertDescription;
    private getAlertActions;
    private shouldAutoScale;
    private determineScalingAction;
    private calculateTargetCapacity;
    private buildExecutionPlan;
    private buildRollbackPlan;
    private generateScalingReasoning;
    private estimateScalingCost;
    private estimatePerformanceImpact;
    private calculateScalingConfidence;
    private calculateTrend;
    private calculateStability;
    private groupMetricsByResource;
    private getThresholdsForResource;
    private getLatestMetrics;
    private findActiveAlertForResource;
    private isInCooldownPeriod;
    private getCurrentCapacity;
    private getRecentMetrics;
    private initializeThresholdState;
    private initializeDefaultThresholds;
    private getDefaultThresholdValues;
    private getDefaultScalingPolicy;
    private validateThreshold;
    private startMonitoring;
    private collectCurrentMetrics;
    private generateThresholdId;
    private generateAlertId;
    shutdown(): Promise<void>;
}

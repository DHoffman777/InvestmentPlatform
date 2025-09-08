import { EventEmitter } from 'events';
import { MetricAlert, MetricValue, AlertSeverity } from './BusinessMetricsDataModel';
export interface AlertRule {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    metricId?: string;
    kpiId?: string;
    type: 'threshold' | 'anomaly' | 'trend' | 'missing_data' | 'composite';
    conditions: AlertCondition[];
    severity: AlertSeverity;
    isEnabled: boolean;
    cooldownPeriod: number;
    escalationRules: EscalationRule[];
    suppressionRules: SuppressionRule[];
    notificationChannels: string[];
    tags: Record<string, string>;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AlertCondition {
    id: string;
    type: 'value' | 'change' | 'rate' | 'pattern' | 'time_based';
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'between' | 'outside';
    value: number | number[];
    timeWindow?: number;
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
    dimensions?: Record<string, string>;
    isRequired: boolean;
}
export interface EscalationRule {
    id: string;
    triggerAfter: number;
    severity: AlertSeverity;
    notificationChannels: string[];
    assignTo?: string[];
    action?: 'notify' | 'create_ticket' | 'call_webhook' | 'execute_script';
    actionConfig?: Record<string, any>;
}
export interface SuppressionRule {
    id: string;
    type: 'time_based' | 'condition_based' | 'dependency_based';
    configuration: Record<string, any>;
    isActive: boolean;
}
export interface AlertEvaluation {
    ruleId: string;
    metricId?: string;
    kpiId?: string;
    timestamp: Date;
    conditions: ConditionEvaluation[];
    isTriggered: boolean;
    severity: AlertSeverity;
    context: Record<string, any>;
}
export interface ConditionEvaluation {
    conditionId: string;
    isMet: boolean;
    actualValue: number;
    expectedValue?: number;
    threshold?: number;
    deviation?: number;
}
export interface AlertHistory {
    id: string;
    alertId: string;
    status: 'triggered' | 'escalated' | 'resolved' | 'suppressed' | 'acknowledged';
    timestamp: Date;
    userId?: string;
    reason?: string;
    context: Record<string, any>;
}
export interface AlertStatistics {
    ruleId: string;
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    suppressedAlerts: number;
    averageResolutionTime: number;
    falsePositiveRate: number;
    lastTriggered?: Date;
    frequency: {
        hourly: number[];
        daily: number[];
        weekly: number[];
    };
}
export interface AnomalyDetectionConfig {
    algorithm: 'zscore' | 'iqr' | 'isolation_forest' | 'lstm' | 'seasonal_esd';
    sensitivity: number;
    seasonality?: 'auto' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    trainingPeriod: number;
    minimumDataPoints: number;
    confidenceLevel: number;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'slack' | 'teams' | 'webhook' | 'mobile_push';
    subject: string;
    body: string;
    isHtml: boolean;
    variables: string[];
    customFields: Record<string, any>;
}
export declare class BusinessThresholdAlerting extends EventEmitter {
    private alertRules;
    private activeAlerts;
    private alertHistory;
    private alertStatistics;
    private subscriptions;
    private notificationChannels;
    private templates;
    private anomalyDetectors;
    private evaluationTimer?;
    private cleanupTimer?;
    constructor();
    createAlertRule(rule: Partial<AlertRule>): Promise<AlertRule>;
    updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule>;
    deleteAlertRule(ruleId: string): Promise<any>;
    evaluateMetricValue(metricValue: MetricValue): Promise<AlertEvaluation[]>;
    evaluateKPI(kpiId: string, currentValue: number, context: Record<string, any>): Promise<AlertEvaluation[]>;
    private evaluateRule;
    private evaluateKPIRule;
    private evaluateCondition;
    private evaluateKPICondition;
    private evaluateValueCondition;
    private evaluatePatternCondition;
    private evaluateTimeBasedCondition;
    private handleTriggeredAlert;
    private handleTriggeredKPIAlert;
    private shouldTriggerAlert;
    private isSuppressed;
    private sendNotifications;
    private sendNotification;
    private renderNotificationMessage;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendWebhookNotification;
    resolveAlert(alertId: string, reason: string, userId?: string): Promise<any>;
    acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<any>;
    private generateAlertMessage;
    private generateKPIAlertMessage;
    private validateAlertRule;
    private setupAnomalyDetection;
    private getPreviousValue;
    private calculateRate;
    private getSeverityColor;
    private updateAlertStatistics;
    private initializeAlertStatistics;
    private recordAlertHistory;
    private initializeDefaultTemplates;
    private startEvaluationTimer;
    private startCleanupTimer;
    private performPeriodicEvaluations;
    private checkForMissingData;
    private cleanupExpiredAlerts;
    private cleanupOldHistory;
    private generateId;
    getAlertRule(ruleId: string): AlertRule | null;
    getAlertRules(tenantId?: string): AlertRule[];
    getActiveAlerts(tenantId?: string): MetricAlert[];
    getAlertStatistics(ruleId: string): AlertStatistics | null;
    getAlertHistory(alertId: string): AlertHistory[];
}

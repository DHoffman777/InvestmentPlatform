import { EventEmitter } from 'events';
import { SLADefinition, SLABreach, SLANotification, SLANotificationChannel, SLASeverity, SLAMetric } from './SLADataModel';
export interface BreachDetectionConfig {
    checkInterval: number;
    breachGracePeriod: number;
    escalationTimeouts: Record<SLASeverity, number>;
    maxConcurrentAlerts: number;
    enableAutoEscalation: boolean;
    enableRootCauseAnalysis: boolean;
    notificationRetryAttempts: number;
    notificationRetryDelay: number;
}
export interface BreachDetectionRule {
    id: string;
    slaId: string;
    threshold: keyof SLADefinition['thresholds'];
    consecutiveFailures: number;
    evaluationWindow: number;
    isActive: boolean;
}
export interface NotificationProvider {
    channel: SLANotificationChannel;
    send(notification: SLANotification, content: NotificationContent): Promise<boolean>;
    isAvailable(): Promise<boolean>;
}
export interface NotificationContent {
    subject: string;
    message: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    metadata: Record<string, any>;
}
export interface BreachEscalation {
    breachId: string;
    level: number;
    escalatedAt: Date;
    escalatedTo: string[];
    reason: string;
    autoEscalated: boolean;
}
export interface BreachPattern {
    type: 'frequent' | 'recurring' | 'cascading' | 'persistent';
    description: string;
    frequency: number;
    timeWindow: {
        start: Date;
        end: Date;
    };
    affectedSLAs: string[];
    severity: SLASeverity;
}
export declare class SLABreachDetectionService extends EventEmitter {
    private breaches;
    private activeBreaches;
    private notificationProviders;
    private escalations;
    private detectionRules;
    private config;
    private detectionInterval;
    private notificationQueues;
    constructor(config: BreachDetectionConfig);
    detectBreaches(slaId: string, metric: SLAMetric): Promise<SLABreach[]>;
    processBreach(breach: SLABreach, sla: SLADefinition): Promise<any>;
    acknowledgeBreachInternal(breachId: string, userId: string, comments?: string): Promise<any>;
    resolveBreach(breachId: string, userId: string, resolution: string): Promise<any>;
    getActiveBreaches(slaId?: string): Promise<SLABreach[]>;
    getBreachHistory(slaId: string, timeWindow: {
        start: Date;
        end: Date;
    }): Promise<SLABreach[]>;
    getBreachStatistics(slaId?: string, timeWindow?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalBreaches: number;
        activeBreaches: number;
        resolvedBreaches: number;
        averageResolutionTime: number;
        breachesBySeverity: Record<SLASeverity, number>;
        breachesByThreshold: Record<string, number>;
        mostFrequentCauses: Array<{
            cause: string;
            count: number;
        }>;
    }>;
    analyzeBreachPatterns(slaId: string): Promise<BreachPattern[]>;
    private evaluateRule;
    private isThresholdBreached;
    private determineSeverity;
    private calculateImpact;
    private sendBreachNotifications;
    private sendResolutionNotifications;
    private buildBreachMessage;
    private buildResolutionMessage;
    private mapSeverityToUrgency;
    private queueNotification;
    private checkEscalation;
    private getEscalationRecipients;
    private calculateBreachIntervals;
    private findRecurringInterval;
    private calculatePatternSeverity;
    private getDefaultDetectionRules;
    private findExistingBreach;
    private startBreachDetection;
    private startNotificationProcessing;
    private processNotification;
    private initializeNotificationProviders;
    private getSLA;
    private generateBreachId;
    private generateNotificationId;
    shutdown(): Promise<any>;
}

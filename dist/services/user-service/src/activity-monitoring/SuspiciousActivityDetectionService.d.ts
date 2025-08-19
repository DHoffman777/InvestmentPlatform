import { EventEmitter } from 'events';
import { ActivityData, ActivitySeverity, ActivityType } from './ActivityTrackingService';
export interface SuspiciousActivityAlert {
    id: string;
    alertType: AlertType;
    severity: ActivitySeverity;
    title: string;
    description: string;
    userId: string;
    tenantId: string;
    relatedActivities: string[];
    timestamp: Date;
    status: AlertStatus;
    assignedTo?: string;
    resolution?: string;
    falsePositive: boolean;
    riskScore: number;
    evidence: Evidence[];
    recommendedActions: string[];
    correlationId?: string;
}
export declare enum AlertType {
    MULTIPLE_FAILED_LOGINS = "multiple_failed_logins",
    UNUSUAL_LOCATION = "unusual_location",
    OFF_HOURS_ACCESS = "off_hours_access",
    SUSPICIOUS_DEVICE = "suspicious_device",
    PRIVILEGE_ESCALATION = "privilege_escalation",
    DATA_EXFILTRATION = "data_exfiltration",
    BRUTE_FORCE_ATTACK = "brute_force_attack",
    ACCOUNT_TAKEOVER = "account_takeover",
    UNUSUAL_ACTIVITY_VOLUME = "unusual_activity_volume",
    INSIDER_THREAT = "insider_threat",
    COMPLIANCE_VIOLATION = "compliance_violation",
    POLICY_VIOLATION = "policy_violation"
}
export declare enum AlertStatus {
    NEW = "new",
    INVESTIGATING = "investigating",
    CONFIRMED = "confirmed",
    RESOLVED = "resolved",
    FALSE_POSITIVE = "false_positive",
    ESCALATED = "escalated"
}
export interface Evidence {
    type: EvidenceType;
    description: string;
    data: any;
    timestamp: Date;
    confidence: number;
}
export declare enum EvidenceType {
    ACTIVITY_PATTERN = "activity_pattern",
    LOCATION_ANOMALY = "location_anomaly",
    TIME_ANOMALY = "time_anomaly",
    DEVICE_FINGERPRINT = "device_fingerprint",
    BEHAVIORAL_CHANGE = "behavioral_change",
    STATISTICAL_ANOMALY = "statistical_anomaly",
    RULE_VIOLATION = "rule_violation"
}
export interface DetectionRule {
    id: string;
    name: string;
    description: string;
    alertType: AlertType;
    severity: ActivitySeverity;
    enabled: boolean;
    conditions: RuleCondition[];
    actions: RuleAction[];
    threshold: number;
    timeWindow: number;
    cooldown: number;
    lastTriggered?: Date;
    triggerCount: number;
    falsePositiveRate: number;
}
export interface RuleCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in' | 'regex';
    value: any;
    weight: number;
}
export interface RuleAction {
    type: 'alert' | 'block' | 'quarantine' | 'notify' | 'log' | 'escalate';
    parameters: Record<string, any>;
}
export interface UserBaseline {
    userId: string;
    tenantId: string;
    profile: {
        typicalHours: number[];
        commonLocations: string[];
        averageSessionDuration: number;
        typicalDevices: string[];
        normalActivityVolume: number;
        commonActivityTypes: ActivityType[];
    };
    statistics: {
        totalActivities: number;
        averageRiskScore: number;
        complianceViolations: number;
        lastUpdated: Date;
    };
    anomalyThresholds: {
        locationDeviation: number;
        timeDeviation: number;
        volumeDeviation: number;
        riskScoreThreshold: number;
    };
}
export interface ThreatIntelligence {
    id: string;
    type: 'ip_reputation' | 'known_attacker' | 'malicious_pattern' | 'compromised_credential';
    value: string;
    severity: ActivitySeverity;
    source: string;
    description: string;
    createdAt: Date;
    expiresAt?: Date;
    confidence: number;
}
export declare class SuspiciousActivityDetectionService extends EventEmitter {
    private alerts;
    private detectionRules;
    private userBaselines;
    private threatIntelligence;
    private recentActivities;
    private ruleCooldowns;
    private mlModels;
    constructor();
    analyzeActivity(activity: ActivityData): Promise<SuspiciousActivityAlert[]>;
    getAlerts(filter?: {
        userId?: string;
        tenantId?: string;
        severity?: ActivitySeverity[];
        status?: AlertStatus[];
        alertType?: AlertType[];
        startDate?: Date;
        endDate?: Date;
    }, limit?: number, offset?: number): Promise<SuspiciousActivityAlert[]>;
    updateAlertStatus(alertId: string, status: AlertStatus, assignedTo?: string, resolution?: string): Promise<SuspiciousActivityAlert | null>;
    createDetectionRule(rule: Omit<DetectionRule, 'id' | 'triggerCount' | 'falsePositiveRate'>): Promise<DetectionRule>;
    updateDetectionRule(ruleId: string, updates: Partial<DetectionRule>): Promise<DetectionRule | null>;
    deleteDetectionRule(ruleId: string): Promise<boolean>;
    updateUserBaseline(userId: string, activities: ActivityData[]): Promise<UserBaseline>;
    addThreatIntelligence(threat: Omit<ThreatIntelligence, 'id' | 'createdAt'>): Promise<ThreatIntelligence>;
    getDetectionRules(): Promise<DetectionRule[]>;
    getAlertStatistics(): Promise<{
        totalAlerts: number;
        alertsByType: Record<AlertType, number>;
        alertsBySeverity: Record<ActivitySeverity, number>;
        alertsByStatus: Record<AlertStatus, number>;
        averageResolutionTime: number;
        falsePositiveRate: number;
    }>;
    private runRuleBasedDetection;
    private runStatisticalDetection;
    private runBehavioralAnalysis;
    private runThreatIntelligenceCheck;
    private runMLDetection;
    private evaluateRule;
    private evaluateCondition;
    private getNestedProperty;
    private createAlert;
    private processAlert;
    private executeAutomatedActions;
    private generateAlertTitle;
    private generateAlertDescription;
    private generateEvidence;
    private generateRecommendedActions;
    private updateRecentActivities;
    private getRecentUserActivities;
    private isLocationAnomaly;
    private isTimeAnomaly;
    private isVolumeAnomaly;
    private isDeviceAnomaly;
    private isPrivilegeEscalation;
    private isThreatExpired;
    private calculateUserProfile;
    private calculateUserStatistics;
    private calculateAnomalyThresholds;
    private getMostCommon;
    private updateRuleFalsePositiveRate;
    private initializeDefaultRules;
    private startPeriodicAnalysis;
    private runBatchAnalysis;
    private updateAllBaselines;
    private getAllUserActivities;
    private cleanupOldData;
    private loadThreatIntelligence;
}

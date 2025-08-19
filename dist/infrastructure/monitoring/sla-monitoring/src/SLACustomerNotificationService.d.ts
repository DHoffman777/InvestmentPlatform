import { EventEmitter } from 'events';
import { SLABreach, SLAComplianceScore, SLAReport, SLANotificationChannel, SLASeverity, SLADefinition } from './SLADataModel';
export interface CustomerNotificationConfig {
    enableCustomerNotifications: boolean;
    notificationTemplates: NotificationTemplateConfig;
    deliveryChannels: DeliveryChannelConfig[];
    escalationMatrix: EscalationMatrix;
    brandingConfig: BrandingConfig;
    complianceReporting: ComplianceReportingConfig;
    customerPreferences: CustomerPreferencesConfig;
}
export interface NotificationTemplateConfig {
    templates: Map<NotificationType, NotificationTemplate>;
    customTemplates: Map<string, NotificationTemplate>;
    defaultLanguage: string;
    supportedLanguages: string[];
}
export interface NotificationTemplate {
    id: string;
    type: NotificationType;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[];
    language: string;
    category: 'incident' | 'maintenance' | 'compliance' | 'report';
    urgency: 'low' | 'medium' | 'high' | 'critical';
}
export declare enum NotificationType {
    BREACH_NOTIFICATION = "breach_notification",
    BREACH_RESOLVED = "breach_resolved",
    MAINTENANCE_NOTICE = "maintenance_notice",
    COMPLIANCE_REPORT = "compliance_report",
    SLA_ACHIEVEMENT = "sla_achievement",
    THRESHOLD_WARNING = "threshold_warning",
    SERVICE_DEGRADATION = "service_degradation",
    PLANNED_OUTAGE = "planned_outage",
    EMERGENCY_ALERT = "emergency_alert",
    MONTHLY_SUMMARY = "monthly_summary"
}
export interface DeliveryChannelConfig {
    channel: SLANotificationChannel;
    enabled: boolean;
    priority: number;
    configuration: Record<string, any>;
    rateLimits: RateLimitConfig;
    retryPolicy: RetryPolicyConfig;
}
export interface RateLimitConfig {
    maxNotificationsPerHour: number;
    maxNotificationsPerDay: number;
    burstLimit: number;
    cooldownPeriod: number;
}
export interface RetryPolicyConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: string[];
}
export interface EscalationMatrix {
    levels: EscalationLevel[];
    automaticEscalation: boolean;
    escalationTimeouts: Record<SLASeverity, number>;
    skipLevels: boolean;
}
export interface EscalationLevel {
    level: number;
    name: string;
    contacts: ContactInfo[];
    channels: SLANotificationChannel[];
    timeout: number;
    requiresAcknowledgment: boolean;
}
export interface ContactInfo {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    timezone: string;
    availability: AvailabilitySchedule;
    preferences: NotificationPreferences;
}
export interface AvailabilitySchedule {
    workDays: number[];
    workHours: {
        start: string;
        end: string;
    };
    onCallSchedule?: OnCallSchedule[];
}
export interface OnCallSchedule {
    startDate: Date;
    endDate: Date;
    primary: boolean;
    coverage: '24x7' | 'business_hours' | 'extended_hours';
}
export interface NotificationPreferences {
    channels: SLANotificationChannel[];
    severity: SLASeverity[];
    categories: NotificationType[];
    frequency: 'immediate' | 'digest' | 'summary';
    digestInterval?: number;
    timezone: string;
    language: string;
    doNotDisturb: {
        enabled: boolean;
        startTime?: string;
        endTime?: string;
        days?: number[];
    };
}
export interface BrandingConfig {
    companyName: string;
    logo: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
    footer: string;
    disclaimer: string;
    contactInfo: {
        supportEmail: string;
        supportPhone: string;
        website: string;
    };
}
export interface ComplianceReportingConfig {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    includeMetrics: boolean;
    includeTrends: boolean;
    includeRecommendations: boolean;
    format: 'pdf' | 'html' | 'excel';
    distributionTime: string;
}
export interface CustomerPreferencesConfig {
    allowCustomerOptOut: boolean;
    requireExplicitOptIn: boolean;
    preferenceManagementUrl: string;
    defaultPreferences: NotificationPreferences;
}
export interface CustomerNotificationRequest {
    customerId: string;
    type: NotificationType;
    severity: SLASeverity;
    subject: string;
    data: Record<string, any>;
    templateOverride?: string;
    channelOverride?: SLANotificationChannel[];
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    scheduledTime?: Date;
}
export interface NotificationDeliveryResult {
    notificationId: string;
    customerId: string;
    channel: SLANotificationChannel;
    status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'unsubscribed';
    timestamp: Date;
    deliveryTime?: number;
    error?: string;
    retryCount: number;
}
export interface CustomerNotificationHistory {
    customerId: string;
    notifications: NotificationRecord[];
    preferences: NotificationPreferences;
    subscriptionStatus: 'active' | 'paused' | 'unsubscribed';
    lastUpdated: Date;
}
export interface NotificationRecord {
    id: string;
    type: NotificationType;
    severity: SLASeverity;
    subject: string;
    sentAt: Date;
    deliveryResults: NotificationDeliveryResult[];
    acknowledged: boolean;
    acknowledgedAt?: Date;
    data: Record<string, any>;
}
export declare class SLACustomerNotificationService extends EventEmitter {
    private config;
    private customers;
    private notificationHistory;
    private deliveryQueue;
    private rateLimiters;
    private templates;
    private activeEscalations;
    constructor(config: CustomerNotificationConfig);
    sendCustomerNotification(request: CustomerNotificationRequest): Promise<string>;
    sendBreachNotification(customerId: string, breach: SLABreach, slaDefinition: SLADefinition): Promise<string>;
    sendResolutionNotification(customerId: string, breach: SLABreach, slaDefinition: SLADefinition): Promise<string>;
    sendComplianceReport(customerId: string, report: SLAReport, complianceScore: SLAComplianceScore): Promise<string>;
    sendMaintenanceNotification(customerId: string, maintenanceWindow: {
        id: string;
        name: string;
        description: string;
        startTime: Date;
        endTime: Date;
        affectedServices: string[];
        expectedImpact: string;
    }): Promise<string>;
    updateCustomerPreferences(customerId: string, preferences: Partial<NotificationPreferences>): Promise<void>;
    getNotificationHistory(customerId: string, options?: {
        startDate?: Date;
        endDate?: Date;
        types?: NotificationType[];
        limit?: number;
    }): Promise<NotificationRecord[]>;
    acknowledgeNotification(customerId: string, notificationId: string): Promise<void>;
    unsubscribeCustomer(customerId: string, category?: NotificationType[]): Promise<void>;
    private processDeliveryQueue;
    private deliverNotification;
    private sendViaChannel;
    private sendEmail;
    private sendSMS;
    private sendSlackMessage;
    private sendWebhook;
    private renderTemplate;
    private applyBranding;
    private shouldNotifyCustomer;
    private checkRateLimit;
    private getRateLimiter;
    private getTemplate;
    private recordDeliveryResult;
    private addToHistory;
    private startEscalation;
    private initializeTemplates;
    private startQueueProcessor;
    private startEscalationMonitor;
    private escalateIncident;
    private getImpactDescription;
    private estimateResolutionTime;
    private calculateNextUpdateTime;
    private calculateNextReportDate;
    private mapSeverityToUrgency;
    private getPreventiveMeasures;
    private getMaintenancePreparationSteps;
    private generateReportUrl;
    private generateNotificationId;
    private generateEscalationId;
    shutdown(): Promise<void>;
}

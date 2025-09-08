import { EventEmitter } from 'events';
export interface NotificationTemplate {
    id: string;
    tenantId: string;
    name: string;
    type: 'reminder' | 'confirmation' | 'cancellation' | 'reschedule' | 'follow_up' | 'custom';
    channels: NotificationChannel[];
    subject: string;
    content: {
        html?: string;
        text: string;
        sms?: string;
        push?: {
            title: string;
            body: string;
            icon?: string;
            actions?: {
                action: string;
                title: string;
                url?: string;
            }[];
        };
    };
    variables: {
        name: string;
        description: string;
        type: 'string' | 'date' | 'number' | 'boolean';
        required: boolean;
        defaultValue?: any;
    }[];
    conditions: {
        field: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
        value: any;
    }[];
    status: 'active' | 'inactive' | 'draft';
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationChannel {
    type: 'email' | 'sms' | 'push' | 'slack' | 'teams' | 'webhook' | 'in_app';
    enabled: boolean;
    config: {
        fromAddress?: string;
        fromName?: string;
        replyTo?: string;
        provider?: 'twilio' | 'aws_sns' | 'nexmo';
        fromNumber?: string;
        provider?: 'firebase' | 'apns' | 'web_push';
        appId?: string;
        webhookUrl?: string;
        channel?: string;
        url?: string;
        method?: 'POST' | 'PUT';
        headers?: Record<string, string>;
        retryAttempts: number;
        retryDelay: number;
        timeout: number;
    };
}
export interface NotificationRule {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    trigger: {
        event: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled' | 'meeting_reminder' | 'meeting_started' | 'meeting_ended' | 'custom';
        conditions: {
            field: string;
            operator: string;
            value: any;
        }[];
        timing: {
            type: 'immediate' | 'scheduled' | 'relative';
            delay?: number;
            at?: Date;
            before?: number;
            after?: number;
        };
    };
    actions: {
        type: 'send_notification' | 'create_task' | 'webhook' | 'custom';
        templateId?: string;
        recipients: {
            type: 'organizer' | 'attendees' | 'specific' | 'role' | 'custom';
            addresses?: string[];
            roles?: string[];
            customQuery?: string;
        };
        config?: Record<string, any>;
    }[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationJob {
    id: string;
    tenantId: string;
    ruleId: string;
    templateId?: string;
    meetingId: string;
    recipients: {
        type: string;
        address: string;
        name?: string;
        userId?: string;
    }[];
    channels: NotificationChannel['type'][];
    scheduledTime: Date;
    status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
    attempts: number;
    maxAttempts: number;
    lastAttempt?: Date;
    error?: string;
    deliveryStatus: {
        channel: NotificationChannel['type'];
        status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
        timestamp?: Date;
        error?: string;
        messageId?: string;
    }[];
    content: {
        subject: string;
        html?: string;
        text: string;
    };
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface MeetingReminder {
    id: string;
    tenantId: string;
    meetingId: string;
    userId: string;
    type: 'email' | 'sms' | 'push' | 'in_app';
    timing: {
        minutesBefore: number;
        absoluteTime?: Date;
        recurring?: {
            interval: number;
            count: number;
        };
    };
    content: {
        title: string;
        message: string;
        actions?: {
            label: string;
            action: 'join' | 'reschedule' | 'cancel' | 'view_details' | 'custom';
            url?: string;
        }[];
    };
    status: 'active' | 'sent' | 'cancelled' | 'failed';
    sentAt?: Date;
    error?: string;
    deliveryConfirmation?: {
        delivered: boolean;
        readAt?: Date;
        actionTaken?: string;
        timestamp: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationStats {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    clicked: number;
    byChannel: Record<NotificationChannel['type'], {
        sent: number;
        delivered: number;
        failed: number;
        deliveryRate: number;
    }>;
    byTemplate: Record<string, {
        sent: number;
        delivered: number;
        openRate: number;
        clickRate: number;
    }>;
}
export interface NotificationConfig {
    defaultFromEmail: string;
    defaultFromName: string;
    maxRetryAttempts: number;
    retryDelayMs: number;
    batchSize: number;
    processingInterval: number;
    enableDeliveryTracking: boolean;
    enableClickTracking: boolean;
    enableUnsubscribe: boolean;
    rateLimits: {
        email: {
            perMinute: number;
            perHour: number;
        };
        sms: {
            perMinute: number;
            perHour: number;
        };
        push: {
            perMinute: number;
            perHour: number;
        };
    };
    providers: {
        email: string;
        sms: string;
        push: string;
    };
}
export declare class MeetingNotificationService extends EventEmitter {
    private templates;
    private rules;
    private jobs;
    private reminders;
    private config;
    private processingTimer?;
    constructor(config?: Partial<NotificationConfig>);
    private initializeDefaultTemplates;
    private initializeDefaultRules;
    private startProcessingLoop;
    createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate>;
    getTemplates(tenantId: string): Promise<NotificationTemplate[]>;
    getTemplate(templateId: string): Promise<NotificationTemplate | null>;
    updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate>;
    createRule(ruleData: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationRule>;
    getRules(tenantId: string): Promise<NotificationRule[]>;
    getRule(ruleId: string): Promise<NotificationRule | null>;
    updateRule(ruleId: string, updates: Partial<NotificationRule>): Promise<NotificationRule>;
    processMeetingEvent(event: {
        type: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled' | 'meeting_started' | 'meeting_ended';
        meetingId: string;
        tenantId: string;
        meetingData: any;
        timestamp: Date;
    }): Promise<any>;
    private evaluateRuleConditions;
    private getMeetingFieldValue;
    private executeRule;
    private scheduleNotification;
    private resolveRecipients;
    private calculateScheduledTime;
    private renderTemplate;
    private extractTemplateVariables;
    private renderString;
    private processNotificationJobs;
    private processNotificationJob;
    private sendNotification;
    private handleJobFailure;
    private createFollowUpTask;
    private sendWebhook;
    createReminder(reminderData: Omit<MeetingReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<MeetingReminder>;
    private scheduleReminderProcessing;
    private processReminder;
    private sendReminderNotification;
    private scheduleRecurringReminder;
    getNotificationStats(tenantId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<NotificationStats>;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        jobs: {
            pending: number;
            processing: number;
            failed: number;
            recentFailureRate: number;
        };
        reminders: {
            active: number;
            failed: number;
        };
        templates: {
            total: number;
            active: number;
        };
        rules: {
            total: number;
            enabled: number;
        };
        timestamp: Date;
    }>;
    shutdown(): Promise<any>;
}
export default MeetingNotificationService;

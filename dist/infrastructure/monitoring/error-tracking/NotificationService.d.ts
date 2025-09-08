import { EventEmitter } from 'events';
import { StructuredError, ErrorSeverity, ErrorCategory } from './ErrorTrackingService';
export interface NotificationChannel {
    id: string;
    name: string;
    type: NotificationChannelType;
    enabled: boolean;
    config: Record<string, any>;
    filters: NotificationFilter[];
    rateLimits: RateLimit;
}
export declare enum NotificationChannelType {
    EMAIL = "email",
    SLACK = "slack",
    SMS = "sms",
    WEBHOOK = "webhook",
    TEAMS = "teams",
    PAGERDUTY = "pagerduty"
}
export interface NotificationFilter {
    severity?: ErrorSeverity[];
    category?: ErrorCategory[];
    services?: string[];
    environments?: string[];
    tags?: string[];
    excludeTags?: string[];
    minOccurrences?: number;
    timeWindow?: string;
}
export interface RateLimit {
    maxNotifications: number;
    timeWindow: number;
    cooldownPeriod: number;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    channelType: NotificationChannelType;
    subject?: string;
    body: string;
    variables: string[];
    formatting: 'text' | 'html' | 'markdown';
}
export interface NotificationContext {
    error: StructuredError;
    aggregationData?: any;
    relatedErrors?: StructuredError[];
    systemMetrics?: any;
    runbookLinks?: string[];
}
export interface NotificationResult {
    channelId: string;
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: Date;
    rateLimited: boolean;
}
export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
    recipients?: string[];
}
export interface SlackConfig {
    token: string;
    defaultChannel: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
}
export interface SMSConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    recipients?: string[];
}
export interface WebhookConfig {
    url: string;
    method: 'POST' | 'PUT';
    headers: Record<string, string>;
    timeout: number;
}
export declare class NotificationService extends EventEmitter {
    private logger;
    private channels;
    private templates;
    private rateLimitTracker;
    private emailTransporter?;
    private slackClient?;
    private twilioClient?;
    constructor();
    private createLogger;
    private initializeDefaultTemplates;
    addChannel(channel: NotificationChannel): Promise<any>;
    private validateChannelConfig;
    private initializeChannelClient;
    sendNotification(context: NotificationContext, channelIds?: string[]): Promise<NotificationResult[]>;
    private matchesFilters;
    private isRateLimited;
    private updateRateLimitTracker;
    private sendToChannel;
    private getTemplateForChannel;
    private enrichContext;
    private getSeverityEmoji;
    private getRunbookLinks;
    private renderTemplate;
    private evaluateExpression;
    private sendEmail;
    private sendSlack;
    private sendSMS;
    private sendWebhook;
    testChannel(channelId: string): Promise<NotificationResult>;
    getChannels(): NotificationChannel[];
    getChannel(channelId: string): NotificationChannel | undefined;
    removeChannel(channelId: string): boolean;
    addTemplate(template: NotificationTemplate): void;
    getTemplates(): NotificationTemplate[];
    shutdown(): Promise<any>;
}

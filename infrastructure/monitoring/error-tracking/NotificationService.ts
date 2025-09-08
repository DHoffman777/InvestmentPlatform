import { EventEmitter } from 'events';
import nodemailer, { Transporter } from 'nodemailer';
// @ts-ignore - @slack/web-api not installed
import { WebClient as SlackWebClient } from '@slack/web-api';
// @ts-ignore - twilio not installed
import twilio, { Twilio } from 'twilio';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
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

export enum NotificationChannelType {
  EMAIL = 'email',
  SLACK = 'slack',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  TEAMS = 'teams',
  PAGERDUTY = 'pagerduty'
}

export interface NotificationFilter {
  severity?: ErrorSeverity[];
  category?: ErrorCategory[];
  services?: string[];
  environments?: string[];
  tags?: string[];
  excludeTags?: string[];
  minOccurrences?: number;
  timeWindow?: string; // e.g., '5m', '1h', '1d'
}

export interface RateLimit {
  maxNotifications: number;
  timeWindow: number; // milliseconds
  cooldownPeriod: number; // milliseconds
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

export class NotificationService extends EventEmitter {
  private logger: Logger;
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private rateLimitTracker: Map<string, number[]> = new Map();
  private emailTransporter?: Transporter;
  private slackClient?: SlackWebClient;
  private twilioClient?: Twilio;

  constructor() {
    super();
    this.logger = this.createLogger();
    this.initializeDefaultTemplates();
  }

  private createLogger(): Logger {
    return createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({
          filename: 'logs/notification-service.log',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5
        }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }

  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'critical_error_email',
        name: 'Critical Error Email',
        channelType: NotificationChannelType.EMAIL,
        subject: '🚨 CRITICAL ERROR: {{error.message}} in {{error.context.service}}',
        body: `
          <h2>Critical Error Alert</h2>
          <p><strong>Service:</strong> {{error.context.service}}</p>
          <p><strong>Environment:</strong> {{error.context.environment}}</p>
          <p><strong>Error:</strong> {{error.message}}</p>
          <p><strong>Severity:</strong> {{error.severity}}</p>
          <p><strong>Category:</strong> {{error.category}}</p>
          <p><strong>First Seen:</strong> {{error.firstSeen}}</p>
          <p><strong>Occurrences:</strong> {{error.count}}</p>
          <p><strong>Affected Users:</strong> {{error.affectedUsers.length}}</p>
          
          {{#if error.stack}}
          <h3>Stack Trace:</h3>
          <pre>{{error.stack}}</pre>
          {{/if}}
          
          {{#if runbookLinks}}
          <h3>Runbook Links:</h3>
          <ul>
          {{#each runbookLinks}}
            <li><a href="{{this}}">{{this}}</a></li>
          {{/each}}
          </ul>
          {{/if}}
          
          <p>Please investigate immediately.</p>
        `,
        variables: ['error', 'runbookLinks'],
        formatting: 'html'
      },
      {
        id: 'error_slack',
        name: 'Error Slack Notification',
        channelType: NotificationChannelType.SLACK,
        body: `
          {
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*{{severityEmoji}} {{error.severity.toUpperCase()}} ERROR*\n*Service:* {{error.context.service}}\n*Environment:* {{error.context.environment}}"
                }
              },
              {
                "type": "section",
                "fields": [
                  {
                    "type": "mrkdwn",
                    "text": "*Error:*\n{{error instanceof Error ? error.message : 'An error occurred'}}"
                  },
                  {
                    "type": "mrkdwn",
                    "text": "*Category:*\n{{error.category}}"
                  },
                  {
                    "type": "mrkdwn",
                    "text": "*Occurrences:*\n{{error.count}}"
                  },
                  {
                    "type": "mrkdwn",
                    "text": "*Affected Users:*\n{{error.affectedUsers.length}}"
                  }
                ]
              },
              {
                "type": "actions",
                "elements": [
                  {
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "text": "View Error Details"
                    },
                    "url": "{{dashboardUrl}}/errors/{{error.id}}"
                  },
                  {
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "text": "Mark as Resolved"
                    },
                    "action_id": "resolve_error",
                    "value": "{{error.id}}"
                  }
                ]
              }
            ]
          }
        `,
        variables: ['error', 'severityEmoji', 'dashboardUrl'],
        formatting: 'markdown'
      },
      {
        id: 'critical_error_sms',
        name: 'Critical Error SMS',
        channelType: NotificationChannelType.SMS,
        body: '🚨 CRITICAL ERROR in {{error.context.service}} ({{error.context.environment}}): {{error.message}}. Occurrences: {{error.count}}. Investigate immediately.',
        variables: ['error'],
        formatting: 'text'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  public async addChannel(channel: NotificationChannel): Promise<any> {
    // Validate channel configuration
    await this.validateChannelConfig(channel);
    
    this.channels.set(channel.id, channel);
    this.logger.info('Notification channel added', {
      channelId: channel.id,
      type: channel.type,
      name: channel.name
    });

    // Initialize channel-specific clients
    await this.initializeChannelClient(channel);
  }

  private async validateChannelConfig(channel: NotificationChannel): Promise<any> {
    switch (channel.type) {
      case NotificationChannelType.EMAIL:
        if (!channel.config.host || !channel.config.auth) {
          throw new Error('Email channel requires host and auth configuration');
        }
        break;
      case NotificationChannelType.SLACK:
        if (!channel.config.token) {
          throw new Error('Slack channel requires token configuration');
        }
        break;
      case NotificationChannelType.SMS:
        if (!channel.config.accountSid || !channel.config.authToken) {
          throw new Error('SMS channel requires accountSid and authToken configuration');
        }
        break;
      case NotificationChannelType.WEBHOOK:
        if (!channel.config.url) {
          throw new Error('Webhook channel requires url configuration');
        }
        break;
    }
  }

  private async initializeChannelClient(channel: NotificationChannel): Promise<any> {
    switch (channel.type) {
      case NotificationChannelType.EMAIL:
        if (!this.emailTransporter) {
          const config = channel.config as EmailConfig;
          this.emailTransporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth
          });
        }
        break;
        
      case NotificationChannelType.SLACK:
        if (!this.slackClient) {
          const config = channel.config as SlackConfig;
          this.slackClient = new SlackWebClient(config.token);
        }
        break;
        
      case NotificationChannelType.SMS:
        if (!this.twilioClient) {
          const config = channel.config as SMSConfig;
          this.twilioClient = twilio(config.accountSid, config.authToken);
        }
        break;
    }
  }

  public async sendNotification(
    context: NotificationContext,
    channelIds?: string[]
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const targetChannels = channelIds 
      ? channelIds.map(id => this.channels.get(id)).filter(Boolean) as NotificationChannel[]
      : Array.from(this.channels.values()).filter(channel => channel.enabled);

    for (const channel of targetChannels) {
      try {
        // Check if error matches channel filters
        if (!this.matchesFilters(context.error, channel.filters)) {
          continue;
        }

        // Check rate limits
        if (this.isRateLimited(channel.id, channel.rateLimits)) {
          results.push({
            channelId: channel.id,
            success: false,
            error: 'Rate limited',
            timestamp: new Date(),
            rateLimited: true
          });
          continue;
        }

        // Send notification
        const result = await this.sendToChannel(channel, context);
        results.push(result);

        // Update rate limit tracker
        this.updateRateLimitTracker(channel.id);

      } catch (error: any) {
        this.logger.error('Failed to send notification', {
          channelId: channel.id,
          error: error.message
        });
        
        results.push({
          channelId: channel.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          rateLimited: false
        });
      }
    }

    return results;
  }

  private matchesFilters(error: StructuredError, filters: NotificationFilter[]): boolean {
    if (filters.length === 0) return true;

    return filters.some(filter => {
      // Check severity
      if (filter.severity && !filter.severity.includes(error.severity)) {
        return false;
      }

      // Check category
      if (filter.category && !filter.category.includes(error.category)) {
        return false;
      }

      // Check services
      if (filter.services && !filter.services.includes(error.context.service)) {
        return false;
      }

      // Check environments
      if (filter.environments && !filter.environments.includes(error.context.environment)) {
        return false;
      }

      // Check tags
      if (filter.tags && !filter.tags.some(tag => error.tags.includes(tag))) {
        return false;
      }

      // Check excluded tags
      if (filter.excludeTags && filter.excludeTags.some(tag => error.tags.includes(tag))) {
        return false;
      }

      // Check minimum occurrences
      if (filter.minOccurrences && error.count < filter.minOccurrences) {
        return false;
      }

      return true;
    });
  }

  private isRateLimited(channelId: string, rateLimits: RateLimit): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitTracker.get(channelId) || [];
    
    // Remove timestamps outside the time window
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < rateLimits.timeWindow
    );
    
    this.rateLimitTracker.set(channelId, validTimestamps);
    
    return validTimestamps.length >= rateLimits.maxNotifications;
  }

  private updateRateLimitTracker(channelId: string): void {
    const timestamps = this.rateLimitTracker.get(channelId) || [];
    timestamps.push(Date.now());
    this.rateLimitTracker.set(channelId, timestamps);
  }

  private async sendToChannel(
    channel: NotificationChannel,
    context: NotificationContext
  ): Promise<NotificationResult> {
    const templateId = this.getTemplateForChannel(channel, context.error.severity);
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const enrichedContext = await this.enrichContext(context);
    const content = this.renderTemplate(template, enrichedContext);

    switch (channel.type) {
      case NotificationChannelType.EMAIL:
        return await this.sendEmail(channel, template, content);
      case NotificationChannelType.SLACK:
        return await this.sendSlack(channel, template, content);
      case NotificationChannelType.SMS:
        return await this.sendSMS(channel, template, content);
      case NotificationChannelType.WEBHOOK:
        return await this.sendWebhook(channel, template, content, enrichedContext);
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  private getTemplateForChannel(channel: NotificationChannel, severity: ErrorSeverity): string {
    // Use channel-specific template if configured
    if (channel.config.templateId) {
      return channel.config.templateId;
    }

    // Default template selection based on channel type and severity
    if (severity === ErrorSeverity.CRITICAL) {
      switch (channel.type) {
        case NotificationChannelType.EMAIL:
          return 'critical_error_email';
        case NotificationChannelType.SLACK:
          return 'error_slack';
        case NotificationChannelType.SMS:
          return 'critical_error_sms';
      }
    }

    return `${channel.type}_default`;
  }

  private async enrichContext(context: NotificationContext): Promise<any> {
    return {
      ...context,
      severityEmoji: this.getSeverityEmoji(context.error.severity),
      dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
      timestamp: new Date().toISOString(),
      runbookLinks: this.getRunbookLinks(context.error)
    };
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return '🚨';
      case ErrorSeverity.HIGH: return '❗';
      case ErrorSeverity.MEDIUM: return '⚠️';
      case ErrorSeverity.LOW: return 'ℹ️';
      case ErrorSeverity.INFO: return '📝';
      default: return '❓';
    }
  }

  private getRunbookLinks(error: StructuredError): string[] {
    const links: string[] = [];
    const baseUrl = process.env.RUNBOOK_BASE_URL || 'https://runbooks.company.com';
    
    // Add category-specific runbook links
    switch (error.category) {
      case ErrorCategory.DATABASE:
        links.push(`${baseUrl}/database-issues`);
        break;
      case ErrorCategory.AUTHENTICATION:
        links.push(`${baseUrl}/auth-issues`);
        break;
      case ErrorCategory.TRADING:
        links.push(`${baseUrl}/trading-issues`);
        break;
      case ErrorCategory.MARKET_DATA:
        links.push(`${baseUrl}/market-data-issues`);
        break;
    }
    
    return links;
  }

  private renderTemplate(template: NotificationTemplate, context: any): string {
    let content = template.body;
    
    // Simple template rendering (in production, use a proper template engine like Handlebars)
    content = content.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), context);
        return value !== undefined ? String(value) : match;
      } catch (error: any) {
        this.logger.warn('Template expression evaluation failed', {
          expression,
          error: error.message
        });
        return match;
      }
    });
    
    return content;
  }

  private evaluateExpression(expression: string, context: any): any {
    const parts = expression.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async sendEmail(
    channel: NotificationChannel,
    template: NotificationTemplate,
    content: string
  ): Promise<NotificationResult> {
    if (!this.emailTransporter) {
      await this.initializeChannelClient(channel);
    }

    const config = channel.config as EmailConfig;
    const recipients = config.recipients || [];

    const info = await this.emailTransporter!.sendMail({
      from: config.from,
      to: recipients.join(', '),
      subject: template.subject,
      html: content
    });

    return {
      channelId: channel.id,
      success: true,
      messageId: info.messageId,
      timestamp: new Date(),
      rateLimited: false
    };
  }

  private async sendSlack(
    channel: NotificationChannel,
    template: NotificationTemplate,
    content: string
  ): Promise<NotificationResult> {
    if (!this.slackClient) {
      await this.initializeChannelClient(channel);
    }

    const config = channel.config as SlackConfig;
    const slackChannel = config.channel || config.defaultChannel;

    let blocks;
    try {
      blocks = JSON.parse(content).blocks;
    } catch (error: any) {
      // Fallback to text message if JSON parsing fails
      blocks = [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: content
        }
      }];
    }

    const result = await this.slackClient!.chat.postMessage({
      channel: slackChannel,
      blocks,
      username: config.username,
      icon_emoji: config.iconEmoji
    });

    return {
      channelId: channel.id,
      success: true,
      messageId: result.ts,
      timestamp: new Date(),
      rateLimited: false
    };
  }

  private async sendSMS(
    channel: NotificationChannel,
    template: NotificationTemplate,
    content: string
  ): Promise<NotificationResult> {
    if (!this.twilioClient) {
      await this.initializeChannelClient(channel);
    }

    const config = channel.config as SMSConfig;
    const recipients = config.recipients || [];

    const results = await Promise.all(
      recipients.map(async (to: string) => {
        const message = await this.twilioClient!.messages.create({
          body: content,
          from: config.fromNumber,
          to
        });
        return message.sid;
      })
    );

    return {
      channelId: channel.id,
      success: true,
      messageId: results.join(','),
      timestamp: new Date(),
      rateLimited: false
    };
  }

  private async sendWebhook(
    channel: NotificationChannel,
    template: NotificationTemplate,
    content: string,
    context: any
  ): Promise<NotificationResult> {
    const config = channel.config as WebhookConfig;
    
    const payload = {
      content,
      context,
      timestamp: new Date().toISOString(),
      channelId: channel.id
    };

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.timeout || 10000)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    return {
      channelId: channel.id,
      success: true,
      messageId: response.headers.get('x-message-id') || undefined,
      timestamp: new Date(),
      rateLimited: false
    };
  }

  public async testChannel(channelId: string): Promise<NotificationResult> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const testContext: NotificationContext = {
      error: {
        id: 'test-error',
        fingerprint: 'test-fingerprint',
        message: 'This is a test notification',
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.INFO,
        errorType: 'TestError',
        context: {
          service: 'notification-service',
          version: '1.0.0',
          environment: 'development',
          timestamp: new Date()
        },
        metadata: {},
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        resolved: false,
        tags: ['test'],
        affectedUsers: [],
        relatedErrors: []
      } as StructuredError
    };

    return await this.sendToChannel(channel, testContext);
  }

  public getChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  public getChannel(channelId: string): NotificationChannel | undefined {
    return this.channels.get(channelId);
  }

  public removeChannel(channelId: string): boolean {
    const removed = this.channels.delete(channelId);
    if (removed) {
      this.rateLimitTracker.delete(channelId);
      this.logger.info('Notification channel removed', { channelId });
    }
    return removed;
  }

  public addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
    this.logger.info('Notification template added', { templateId: template.id });
  }

  public getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  public async shutdown(): Promise<any> {
    this.logger.info('Shutting down notification service');
    this.removeAllListeners();
  }
}


"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.NotificationChannelType = void 0;
const events_1 = require("events");
const nodemailer_1 = __importDefault(require("nodemailer"));
// @ts-ignore - @slack/web-api not installed
const web_api_1 = require("@slack/web-api");
// @ts-ignore - twilio not installed
const twilio_1 = __importDefault(require("twilio"));
const winston_1 = require("winston");
const ErrorTrackingService_1 = require("./ErrorTrackingService");
var NotificationChannelType;
(function (NotificationChannelType) {
    NotificationChannelType["EMAIL"] = "email";
    NotificationChannelType["SLACK"] = "slack";
    NotificationChannelType["SMS"] = "sms";
    NotificationChannelType["WEBHOOK"] = "webhook";
    NotificationChannelType["TEAMS"] = "teams";
    NotificationChannelType["PAGERDUTY"] = "pagerduty";
})(NotificationChannelType || (exports.NotificationChannelType = NotificationChannelType = {}));
class NotificationService extends events_1.EventEmitter {
    logger;
    channels = new Map();
    templates = new Map();
    rateLimitTracker = new Map();
    emailTransporter;
    slackClient;
    twilioClient;
    constructor() {
        super();
        this.logger = this.createLogger();
        this.initializeDefaultTemplates();
    }
    createLogger() {
        return (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json()),
            transports: [
                new winston_1.transports.File({
                    filename: 'logs/notification-service.log',
                    maxsize: 50 * 1024 * 1024, // 50MB
                    maxFiles: 5
                }),
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
                })
            ]
        });
    }
    initializeDefaultTemplates() {
        const templates = [
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
    async addChannel(channel) {
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
    async validateChannelConfig(channel) {
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
    async initializeChannelClient(channel) {
        switch (channel.type) {
            case NotificationChannelType.EMAIL:
                if (!this.emailTransporter) {
                    const config = channel.config;
                    this.emailTransporter = nodemailer_1.default.createTransport({
                        host: config.host,
                        port: config.port,
                        secure: config.secure,
                        auth: config.auth
                    });
                }
                break;
            case NotificationChannelType.SLACK:
                if (!this.slackClient) {
                    const config = channel.config;
                    this.slackClient = new web_api_1.WebClient(config.token);
                }
                break;
            case NotificationChannelType.SMS:
                if (!this.twilioClient) {
                    const config = channel.config;
                    this.twilioClient = (0, twilio_1.default)(config.accountSid, config.authToken);
                }
                break;
        }
    }
    async sendNotification(context, channelIds) {
        const results = [];
        const targetChannels = channelIds
            ? channelIds.map(id => this.channels.get(id)).filter(Boolean)
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
            }
            catch (error) {
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
    matchesFilters(error, filters) {
        if (filters.length === 0)
            return true;
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
    isRateLimited(channelId, rateLimits) {
        const now = Date.now();
        const timestamps = this.rateLimitTracker.get(channelId) || [];
        // Remove timestamps outside the time window
        const validTimestamps = timestamps.filter(timestamp => now - timestamp < rateLimits.timeWindow);
        this.rateLimitTracker.set(channelId, validTimestamps);
        return validTimestamps.length >= rateLimits.maxNotifications;
    }
    updateRateLimitTracker(channelId) {
        const timestamps = this.rateLimitTracker.get(channelId) || [];
        timestamps.push(Date.now());
        this.rateLimitTracker.set(channelId, timestamps);
    }
    async sendToChannel(channel, context) {
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
    getTemplateForChannel(channel, severity) {
        // Use channel-specific template if configured
        if (channel.config.templateId) {
            return channel.config.templateId;
        }
        // Default template selection based on channel type and severity
        if (severity === ErrorTrackingService_1.ErrorSeverity.CRITICAL) {
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
    async enrichContext(context) {
        return {
            ...context,
            severityEmoji: this.getSeverityEmoji(context.error.severity),
            dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
            timestamp: new Date().toISOString(),
            runbookLinks: this.getRunbookLinks(context.error)
        };
    }
    getSeverityEmoji(severity) {
        switch (severity) {
            case ErrorTrackingService_1.ErrorSeverity.CRITICAL: return '🚨';
            case ErrorTrackingService_1.ErrorSeverity.HIGH: return '❗';
            case ErrorTrackingService_1.ErrorSeverity.MEDIUM: return '⚠️';
            case ErrorTrackingService_1.ErrorSeverity.LOW: return 'ℹ️';
            case ErrorTrackingService_1.ErrorSeverity.INFO: return '📝';
            default: return '❓';
        }
    }
    getRunbookLinks(error) {
        const links = [];
        const baseUrl = process.env.RUNBOOK_BASE_URL || 'https://runbooks.company.com';
        // Add category-specific runbook links
        switch (error.category) {
            case ErrorTrackingService_1.ErrorCategory.DATABASE:
                links.push(`${baseUrl}/database-issues`);
                break;
            case ErrorTrackingService_1.ErrorCategory.AUTHENTICATION:
                links.push(`${baseUrl}/auth-issues`);
                break;
            case ErrorTrackingService_1.ErrorCategory.TRADING:
                links.push(`${baseUrl}/trading-issues`);
                break;
            case ErrorTrackingService_1.ErrorCategory.MARKET_DATA:
                links.push(`${baseUrl}/market-data-issues`);
                break;
        }
        return links;
    }
    renderTemplate(template, context) {
        let content = template.body;
        // Simple template rendering (in production, use a proper template engine like Handlebars)
        content = content.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
            try {
                const value = this.evaluateExpression(expression.trim(), context);
                return value !== undefined ? String(value) : match;
            }
            catch (error) {
                this.logger.warn('Template expression evaluation failed', {
                    expression,
                    error: error.message
                });
                return match;
            }
        });
        return content;
    }
    evaluateExpression(expression, context) {
        const parts = expression.split('.');
        let value = context;
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    async sendEmail(channel, template, content) {
        if (!this.emailTransporter) {
            await this.initializeChannelClient(channel);
        }
        const config = channel.config;
        const recipients = config.recipients || [];
        const info = await this.emailTransporter.sendMail({
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
    async sendSlack(channel, template, content) {
        if (!this.slackClient) {
            await this.initializeChannelClient(channel);
        }
        const config = channel.config;
        const slackChannel = config.channel || config.defaultChannel;
        let blocks;
        try {
            blocks = JSON.parse(content).blocks;
        }
        catch (error) {
            // Fallback to text message if JSON parsing fails
            blocks = [{
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: content
                    }
                }];
        }
        const result = await this.slackClient.chat.postMessage({
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
    async sendSMS(channel, template, content) {
        if (!this.twilioClient) {
            await this.initializeChannelClient(channel);
        }
        const config = channel.config;
        const recipients = config.recipients || [];
        const results = await Promise.all(recipients.map(async (to) => {
            const message = await this.twilioClient.messages.create({
                body: content,
                from: config.fromNumber,
                to
            });
            return message.sid;
        }));
        return {
            channelId: channel.id,
            success: true,
            messageId: results.join(','),
            timestamp: new Date(),
            rateLimited: false
        };
    }
    async sendWebhook(channel, template, content, context) {
        const config = channel.config;
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
    async testChannel(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Channel not found: ${channelId}`);
        }
        const testContext = {
            error: {
                id: 'test-error',
                fingerprint: 'test-fingerprint',
                message: 'This is a test notification',
                category: ErrorTrackingService_1.ErrorCategory.SYSTEM,
                severity: ErrorTrackingService_1.ErrorSeverity.INFO,
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
            }
        };
        return await this.sendToChannel(channel, testContext);
    }
    getChannels() {
        return Array.from(this.channels.values());
    }
    getChannel(channelId) {
        return this.channels.get(channelId);
    }
    removeChannel(channelId) {
        const removed = this.channels.delete(channelId);
        if (removed) {
            this.rateLimitTracker.delete(channelId);
            this.logger.info('Notification channel removed', { channelId });
        }
        return removed;
    }
    addTemplate(template) {
        this.templates.set(template.id, template);
        this.logger.info('Notification template added', { templateId: template.id });
    }
    getTemplates() {
        return Array.from(this.templates.values());
    }
    async shutdown() {
        this.logger.info('Shutting down notification service');
        this.removeAllListeners();
    }
}
exports.NotificationService = NotificationService;

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// Meeting notification data models
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
    // Email config
    fromAddress?: string;
    fromName?: string;
    replyTo?: string;
    
    // SMS config
    provider?: 'twilio' | 'aws_sns' | 'nexmo';
    fromNumber?: string;
    
    // Push config
    provider?: 'firebase' | 'apns' | 'web_push';
    appId?: string;
    
    // Slack/Teams config
    webhookUrl?: string;
    channel?: string;
    
    // Webhook config
    url?: string;
    method?: 'POST' | 'PUT';
    headers?: Record<string, string>;
    
    // General config
    retryAttempts: number;
    retryDelay: number; // milliseconds
    timeout: number; // milliseconds
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
      delay?: number; // minutes
      at?: Date;
      before?: number; // minutes before meeting
      after?: number; // minutes after meeting
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
      interval: number; // minutes
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
  processingInterval: number; // milliseconds
  enableDeliveryTracking: boolean;
  enableClickTracking: boolean;
  enableUnsubscribe: boolean;
  rateLimits: {
    email: { perMinute: number; perHour: number };
    sms: { perMinute: number; perHour: number };
    push: { perMinute: number; perHour: number };
  };
  providers: {
    email: string; // 'sendgrid' | 'ses' | 'mailgun'
    sms: string; // 'twilio' | 'aws_sns'
    push: string; // 'firebase' | 'pusher'
  };
}

export class MeetingNotificationService extends EventEmitter {
  private templates: Map<string, NotificationTemplate> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private jobs: Map<string, NotificationJob> = new Map();
  private reminders: Map<string, MeetingReminder> = new Map();
  private config: NotificationConfig;
  private processingTimer?: NodeJS.Timeout;

  constructor(config: Partial<NotificationConfig> = {}) {
    super();
    
    this.config = {
      defaultFromEmail: 'noreply@investmentplatform.com',
      defaultFromName: 'Investment Platform',
      maxRetryAttempts: 3,
      retryDelayMs: 60000, // 1 minute
      batchSize: 50,
      processingInterval: 30000, // 30 seconds
      enableDeliveryTracking: true,
      enableClickTracking: true,
      enableUnsubscribe: true,
      rateLimits: {
        email: { perMinute: 100, perHour: 1000 },
        sms: { perMinute: 10, perHour: 100 },
        push: { perMinute: 500, perHour: 5000 }
      },
      providers: {
        email: 'sendgrid',
        sms: 'twilio',
        push: 'firebase'
      },
      ...config
    };

    this.initializeDefaultTemplates();
    this.initializeDefaultRules();
    this.startProcessingLoop();
  }

  private initializeDefaultTemplates(): void {
    // Meeting confirmation template
    this.templates.set('meeting_confirmation', {
      id: 'meeting_confirmation',
      tenantId: 'default',
      name: 'Meeting Confirmation',
      type: 'confirmation',
      channels: [
        {
          type: 'email',
          enabled: true,
          config: {
            retryAttempts: 3,
            retryDelay: 60000,
            timeout: 10000
          }
        }
      ],
      subject: 'Meeting Confirmed: {{title}}',
      content: {
        html: `
          <h2>Meeting Confirmed</h2>
          <p>Your meeting has been confirmed with the following details:</p>
          <ul>
            <li><strong>Title:</strong> {{title}}</li>
            <li><strong>Date:</strong> {{date}}</li>
            <li><strong>Time:</strong> {{startTime}} - {{endTime}} ({{timeZone}})</li>
            <li><strong>Location:</strong> {{location}}</li>
            {{#if description}}<li><strong>Description:</strong> {{description}}</li>{{/if}}
          </ul>
          <p><a href="{{joinUrl}}">Join Meeting</a> | <a href="{{rescheduleUrl}}">Reschedule</a> | <a href="{{cancelUrl}}">Cancel</a></p>
        `,
        text: `Meeting Confirmed: {{title}}\n\nDate: {{date}}\nTime: {{startTime}} - {{endTime}} ({{timeZone}})\nLocation: {{location}}\n\nJoin: {{joinUrl}}`,
        sms: 'Meeting confirmed: {{title}} on {{date}} at {{startTime}}. Join: {{joinUrl}}',
        push: {
          title: 'Meeting Confirmed',
          body: '{{title}} - {{date}} at {{startTime}}',
          actions: [
            { action: 'view', title: 'View Details' },
            { action: 'join', title: 'Join' }
          ]
        }
      },
      variables: [
        { name: 'title', description: 'Meeting title', type: 'string', required: true },
        { name: 'date', description: 'Meeting date', type: 'date', required: true },
        { name: 'startTime', description: 'Start time', type: 'string', required: true },
        { name: 'endTime', description: 'End time', type: 'string', required: true },
        { name: 'timeZone', description: 'Time zone', type: 'string', required: true },
        { name: 'location', description: 'Meeting location', type: 'string', required: false },
        { name: 'description', description: 'Meeting description', type: 'string', required: false },
        { name: 'joinUrl', description: 'Join meeting URL', type: 'string', required: false },
        { name: 'rescheduleUrl', description: 'Reschedule URL', type: 'string', required: false },
        { name: 'cancelUrl', description: 'Cancel URL', type: 'string', required: false }
      ],
      conditions: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Meeting reminder template
    this.templates.set('meeting_reminder', {
      id: 'meeting_reminder',
      tenantId: 'default',
      name: 'Meeting Reminder',
      type: 'reminder',
      channels: [
        {
          type: 'email',
          enabled: true,
          config: { retryAttempts: 2, retryDelay: 30000, timeout: 10000 }
        },
        {
          type: 'push',
          enabled: true,
          config: { retryAttempts: 1, retryDelay: 0, timeout: 5000 }
        }
      ],
      subject: 'Reminder: {{title}} in {{timeUntil}}',
      content: {
        html: `
          <h2>Meeting Reminder</h2>
          <p>You have a meeting coming up:</p>
          <ul>
            <li><strong>{{title}}</strong></li>
            <li>{{date}} at {{startTime}} ({{timeZone}})</li>
            <li>{{location}}</li>
          </ul>
          <p><a href="{{joinUrl}}">Join Now</a></p>
        `,
        text: 'Reminder: {{title}} on {{date}} at {{startTime}}. Join: {{joinUrl}}',
        sms: 'Reminder: {{title}} starts in {{timeUntil}}. Join: {{joinUrl}}',
        push: {
          title: 'Meeting Starting Soon',
          body: '{{title}} starts in {{timeUntil}}',
          actions: [
            { action: 'join', title: 'Join Now' },
            { action: 'snooze', title: 'Remind in 5 min' }
          ]
        }
      },
      variables: [
        { name: 'title', description: 'Meeting title', type: 'string', required: true },
        { name: 'date', description: 'Meeting date', type: 'date', required: true },
        { name: 'startTime', description: 'Start time', type: 'string', required: true },
        { name: 'timeZone', description: 'Time zone', type: 'string', required: true },
        { name: 'location', description: 'Meeting location', type: 'string', required: false },
        { name: 'timeUntil', description: 'Time until meeting', type: 'string', required: true },
        { name: 'joinUrl', description: 'Join meeting URL', type: 'string', required: false }
      ],
      conditions: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Meeting cancellation template
    this.templates.set('meeting_cancellation', {
      id: 'meeting_cancellation',
      tenantId: 'default',
      name: 'Meeting Cancellation',
      type: 'cancellation',
      channels: [
        {
          type: 'email',
          enabled: true,
          config: { retryAttempts: 3, retryDelay: 30000, timeout: 10000 }
        },
        {
          type: 'push',
          enabled: true,
          config: { retryAttempts: 1, retryDelay: 0, timeout: 5000 }
        }
      ],
      subject: 'Meeting Cancelled: {{title}}',
      content: {
        html: `
          <h2>Meeting Cancelled</h2>
          <p>The following meeting has been cancelled:</p>
          <ul>
            <li><strong>{{title}}</strong></li>
            <li>{{date}} at {{startTime}} ({{timeZone}})</li>
            <li>{{location}}</li>
          </ul>
          {{#if reason}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}
          <p><a href="{{rescheduleUrl}}">Reschedule Meeting</a></p>
        `,
        text: 'Meeting Cancelled: {{title}} on {{date}} at {{startTime}}. {{#if reason}}Reason: {{reason}}{{/if}}',
        sms: 'Cancelled: {{title}} on {{date}} at {{startTime}}{{#if reason}} - {{reason}}{{/if}}',
        push: {
          title: 'Meeting Cancelled',
          body: '{{title}} - {{date}} at {{startTime}}',
          actions: [
            { action: 'reschedule', title: 'Reschedule' }
          ]
        }
      },
      variables: [
        { name: 'title', description: 'Meeting title', type: 'string', required: true },
        { name: 'date', description: 'Meeting date', type: 'date', required: true },
        { name: 'startTime', description: 'Start time', type: 'string', required: true },
        { name: 'timeZone', description: 'Time zone', type: 'string', required: true },
        { name: 'location', description: 'Meeting location', type: 'string', required: false },
        { name: 'reason', description: 'Cancellation reason', type: 'string', required: false },
        { name: 'rescheduleUrl', description: 'Reschedule URL', type: 'string', required: false }
      ],
      conditions: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private initializeDefaultRules(): void {
    // Meeting confirmation rule
    this.rules.set('auto_confirm', {
      id: 'auto_confirm',
      tenantId: 'default',
      name: 'Automatic Meeting Confirmation',
      description: 'Send confirmation immediately when meeting is created',
      trigger: {
        event: 'meeting_created',
        conditions: [
          { field: 'status', operator: 'equals', value: 'confirmed' }
        ],
        timing: {
          type: 'immediate'
        }
      },
      actions: [
        {
          type: 'send_notification',
          templateId: 'meeting_confirmation',
          recipients: {
            type: 'attendees'
          }
        }
      ],
      priority: 'normal',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 24-hour reminder rule
    this.rules.set('reminder_24h', {
      id: 'reminder_24h',
      tenantId: 'default',
      name: '24-Hour Meeting Reminder',
      description: 'Send reminder 24 hours before meeting',
      trigger: {
        event: 'meeting_reminder',
        conditions: [],
        timing: {
          type: 'relative',
          before: 1440 // 24 hours in minutes
        }
      },
      actions: [
        {
          type: 'send_notification',
          templateId: 'meeting_reminder',
          recipients: {
            type: 'attendees'
          }
        }
      ],
      priority: 'normal',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 15-minute reminder rule
    this.rules.set('reminder_15m', {
      id: 'reminder_15m',
      tenantId: 'default',
      name: '15-Minute Meeting Reminder',
      description: 'Send reminder 15 minutes before meeting',
      trigger: {
        event: 'meeting_reminder',
        conditions: [],
        timing: {
          type: 'relative',
          before: 15
        }
      },
      actions: [
        {
          type: 'send_notification',
          templateId: 'meeting_reminder',
          recipients: {
            type: 'attendees'
          }
        }
      ],
      priority: 'high',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Cancellation notification rule
    this.rules.set('auto_cancel', {
      id: 'auto_cancel',
      tenantId: 'default',
      name: 'Automatic Cancellation Notification',
      description: 'Send notification when meeting is cancelled',
      trigger: {
        event: 'meeting_cancelled',
        conditions: [],
        timing: {
          type: 'immediate'
        }
      },
      actions: [
        {
          type: 'send_notification',
          templateId: 'meeting_cancellation',
          recipients: {
            type: 'attendees'
          }
        }
      ],
      priority: 'high',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private startProcessingLoop(): void {
    this.processingTimer = setInterval(() => {
      this.processNotificationJobs().catch(error => {
        console.error('Error processing notification jobs:', error);
      });
    }, this.config.processingInterval);
  }

  // Template management
  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      id: randomUUID(),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(template.id, template);

    this.emit('templateCreated', {
      templateId: template.id,
      tenantId: template.tenantId,
      timestamp: new Date()
    });

    return template;
  }

  async getTemplates(tenantId: string): Promise<NotificationTemplate[]> {
    return Array.from(this.templates.values())
      .filter(template => template.tenantId === tenantId || template.tenantId === 'default');
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(templateId, updatedTemplate);

    this.emit('templateUpdated', {
      templateId,
      tenantId: template.tenantId,
      updates,
      timestamp: new Date()
    });

    return updatedTemplate;
  }

  // Rule management
  async createRule(ruleData: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationRule> {
    const rule: NotificationRule = {
      id: randomUUID(),
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.set(rule.id, rule);

    this.emit('ruleCreated', {
      ruleId: rule.id,
      tenantId: rule.tenantId,
      timestamp: new Date()
    });

    return rule;
  }

  async getRules(tenantId: string): Promise<NotificationRule[]> {
    return Array.from(this.rules.values())
      .filter(rule => rule.tenantId === tenantId || rule.tenantId === 'default');
  }

  async getRule(ruleId: string): Promise<NotificationRule | null> {
    return this.rules.get(ruleId) || null;
  }

  async updateRule(ruleId: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date()
    };

    this.rules.set(ruleId, updatedRule);

    this.emit('ruleUpdated', {
      ruleId,
      tenantId: rule.tenantId,
      updates,
      timestamp: new Date()
    });

    return updatedRule;
  }

  // Meeting event processing
  async processMeetingEvent(event: {
    type: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled' | 'meeting_started' | 'meeting_ended';
    meetingId: string;
    tenantId: string;
    meetingData: any;
    timestamp: Date;
  }): Promise<void> {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => 
        rule.enabled &&
        (rule.tenantId === event.tenantId || rule.tenantId === 'default') &&
        rule.trigger.event === event.type
      );

    for (const rule of applicableRules) {
      try {
        // Check rule conditions
        if (this.evaluateRuleConditions(rule, event.meetingData)) {
          await this.executeRule(rule, event);
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
      }
    }
  }

  private evaluateRuleConditions(rule: NotificationRule, meetingData: any): boolean {
    if (rule.trigger.conditions.length === 0) return true;

    return rule.trigger.conditions.every(condition => {
      const value = this.getMeetingFieldValue(meetingData, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return Array.isArray(value) ? value.includes(condition.value) : 
                 typeof value === 'string' ? value.includes(condition.value) : false;
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        default:
          return false;
      }
    });
  }

  private getMeetingFieldValue(meetingData: any, field: string): any {
    const parts = field.split('.');
    let value: any = meetingData;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async executeRule(rule: NotificationRule, event: any): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'send_notification':
          await this.scheduleNotification(rule, action, event);
          break;
        case 'create_task':
          await this.createFollowUpTask(rule, action, event);
          break;
        case 'webhook':
          await this.sendWebhook(rule, action, event);
          break;
        default:
          console.log(`Custom action ${action.type} executed for rule ${rule.id}`);
      }
    }
  }

  private async scheduleNotification(rule: NotificationRule, action: any, event: any): Promise<void> {
    if (!action.templateId) {
      throw new Error('Template ID required for send_notification action');
    }

    const template = this.templates.get(action.templateId);
    if (!template) {
      throw new Error(`Template ${action.templateId} not found`);
    }

    // Determine recipients
    const recipients = await this.resolveRecipients(action.recipients, event.meetingData);

    // Calculate scheduled time
    const scheduledTime = this.calculateScheduledTime(rule.trigger.timing, event);

    // Create notification job
    const job: NotificationJob = {
      id: randomUUID(),
      tenantId: event.tenantId,
      ruleId: rule.id,
      templateId: action.templateId,
      meetingId: event.meetingId,
      recipients,
      channels: template.channels.filter(c => c.enabled).map(c => c.type),
      scheduledTime,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.config.maxRetryAttempts,
      deliveryStatus: template.channels.filter(c => c.enabled).map(c => ({
        channel: c.type,
        status: 'pending' as const
      })),
      content: await this.renderTemplate(template, event.meetingData),
      metadata: {
        ruleId: rule.id,
        eventType: event.type,
        priority: rule.priority
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(job.id, job);

    this.emit('notificationScheduled', {
      jobId: job.id,
      ruleId: rule.id,
      meetingId: event.meetingId,
      scheduledTime,
      timestamp: new Date()
    });
  }

  private async resolveRecipients(recipientConfig: any, meetingData: any): Promise<NotificationJob['recipients']> {
    const recipients: NotificationJob['recipients'] = [];

    switch (recipientConfig.type) {
      case 'organizer':
        if (meetingData.organizer) {
          recipients.push({
            type: 'organizer',
            address: meetingData.organizer.email,
            name: meetingData.organizer.name,
            userId: meetingData.organizer.id
          });
        }
        break;

      case 'attendees':
        if (meetingData.attendees) {
          for (const attendee of meetingData.attendees) {
            recipients.push({
              type: 'attendee',
              address: attendee.email,
              name: attendee.name,
              userId: attendee.id
            });
          }
        }
        break;

      case 'specific':
        if (recipientConfig.addresses) {
          for (const address of recipientConfig.addresses) {
            recipients.push({
              type: 'specific',
              address
            });
          }
        }
        break;

      case 'role':
        // Would integrate with user management service to resolve roles
        console.log(`Resolving recipients by role: ${recipientConfig.roles?.join(', ')}`);
        break;
    }

    return recipients;
  }

  private calculateScheduledTime(timing: NotificationRule['trigger']['timing'], event: any): Date {
    const now = new Date();

    switch (timing.type) {
      case 'immediate':
        return now;

      case 'scheduled':
        return timing.at || now;

      case 'relative':
        if (timing.delay) {
          return new Date(now.getTime() + timing.delay * 60 * 1000);
        } else if (timing.before && event.meetingData?.startTime) {
          const meetingStart = new Date(event.meetingData.startTime);
          return new Date(meetingStart.getTime() - timing.before * 60 * 1000);
        } else if (timing.after && event.meetingData?.endTime) {
          const meetingEnd = new Date(event.meetingData.endTime);
          return new Date(meetingEnd.getTime() + timing.after * 60 * 1000);
        }
        return now;

      default:
        return now;
    }
  }

  private async renderTemplate(template: NotificationTemplate, meetingData: any): Promise<NotificationJob['content']> {
    // Simple template rendering - replace {{variable}} placeholders
    const variables = this.extractTemplateVariables(meetingData);
    
    const subject = this.renderString(template.subject, variables);
    const text = this.renderString(template.content.text, variables);
    const html = template.content.html ? this.renderString(template.content.html, variables) : undefined;

    return {
      subject,
      text,
      html
    };
  }

  private extractTemplateVariables(meetingData: any): Record<string, any> {
    // Extract common variables from meeting data
    const variables: Record<string, any> = {
      title: meetingData.title || 'Meeting',
      date: meetingData.startTime ? new Date(meetingData.startTime).toLocaleDateString() : 'TBD',
      startTime: meetingData.startTime ? new Date(meetingData.startTime).toLocaleTimeString() : 'TBD',
      endTime: meetingData.endTime ? new Date(meetingData.endTime).toLocaleTimeString() : 'TBD',
      timeZone: meetingData.timeZone || 'UTC',
      location: meetingData.location?.name || meetingData.location?.address || 'TBD',
      description: meetingData.description || '',
      joinUrl: meetingData.location?.virtual?.joinUrl || '',
      rescheduleUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/meetings/${meetingData.id}/reschedule`,
      cancelUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/meetings/${meetingData.id}/cancel`
    };

    // Calculate time until meeting
    if (meetingData.startTime) {
      const now = new Date();
      const start = new Date(meetingData.startTime);
      const timeDiff = start.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          variables.timeUntil = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
          variables.timeUntil = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
      } else {
        variables.timeUntil = 'now';
      }
    }

    return variables;
  }

  private renderString(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Replace simple {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    }

    // Handle conditional blocks {{#if variable}}...{{/if}}
    result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
      return variables[variable] ? content : '';
    });

    return result;
  }

  // Notification job processing
  private async processNotificationJobs(): Promise<void> {
    const now = new Date();
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => 
        job.status === 'pending' && 
        job.scheduledTime <= now
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
      .slice(0, this.config.batchSize);

    if (pendingJobs.length === 0) return;

    console.log(`Processing ${pendingJobs.length} notification jobs...`);

    for (const job of pendingJobs) {
      try {
        await this.processNotificationJob(job);
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        await this.handleJobFailure(job, error.message);
      }
    }
  }

  private async processNotificationJob(job: NotificationJob): Promise<void> {
    job.status = 'processing';
    job.attempts++;
    job.lastAttempt = new Date();
    job.updatedAt = new Date();
    this.jobs.set(job.id, job);

    // Process each channel
    const results = await Promise.allSettled(
      job.channels.map(channel => this.sendNotification(job, channel))
    );

    // Update delivery status
    let allSuccessful = true;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const channel = job.channels[i];
      const statusIndex = job.deliveryStatus.findIndex(s => s.channel === channel);
      
      if (statusIndex >= 0) {
        if (result.status === 'fulfilled') {
          job.deliveryStatus[statusIndex].status = 'sent';
          job.deliveryStatus[statusIndex].timestamp = new Date();
          job.deliveryStatus[statusIndex].messageId = result.value?.messageId;
        } else {
          job.deliveryStatus[statusIndex].status = 'failed';
          job.deliveryStatus[statusIndex].timestamp = new Date();
          job.deliveryStatus[statusIndex].error = result.reason?.message;
          allSuccessful = false;
        }
      }
    }

    // Update job status
    if (allSuccessful) {
      job.status = 'sent';
    } else if (job.attempts >= job.maxAttempts) {
      job.status = 'failed';
    } else {
      job.status = 'pending';
      job.scheduledTime = new Date(Date.now() + this.config.retryDelayMs);
    }

    job.updatedAt = new Date();
    this.jobs.set(job.id, job);

    this.emit('notificationProcessed', {
      jobId: job.id,
      status: job.status,
      attempts: job.attempts,
      timestamp: new Date()
    });
  }

  private async sendNotification(job: NotificationJob, channel: NotificationChannel['type']): Promise<{ messageId?: string }> {
    // Mock implementation - replace with actual provider integrations
    console.log(`Sending ${channel} notification for job ${job.id}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`${channel} delivery failed - network error`);
    }

    return { messageId: `${channel}_${randomUUID()}` };
  }

  private async handleJobFailure(job: NotificationJob, error: string): Promise<void> {
    job.error = error;
    job.status = job.attempts >= job.maxAttempts ? 'failed' : 'pending';
    
    if (job.status === 'pending') {
      job.scheduledTime = new Date(Date.now() + this.config.retryDelayMs);
    }

    job.updatedAt = new Date();
    this.jobs.set(job.id, job);
  }

  private async createFollowUpTask(rule: NotificationRule, action: any, event: any): Promise<void> {
    // Mock task creation
    console.log(`Creating follow-up task for meeting ${event.meetingId}`);
  }

  private async sendWebhook(rule: NotificationRule, action: any, event: any): Promise<void> {
    // Mock webhook sending
    console.log(`Sending webhook for rule ${rule.id} and meeting ${event.meetingId}`);
  }

  // Reminder management
  async createReminder(reminderData: Omit<MeetingReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<MeetingReminder> {
    const reminder: MeetingReminder = {
      id: randomUUID(),
      ...reminderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reminders.set(reminder.id, reminder);

    // Schedule reminder processing
    this.scheduleReminderProcessing(reminder);

    this.emit('reminderCreated', {
      reminderId: reminder.id,
      meetingId: reminder.meetingId,
      userId: reminder.userId,
      timestamp: new Date()
    });

    return reminder;
  }

  private scheduleReminderProcessing(reminder: MeetingReminder): void {
    let triggerTime: Date;

    if (reminder.timing.absoluteTime) {
      triggerTime = reminder.timing.absoluteTime;
    } else {
      // Would need to get meeting start time to calculate relative time
      // For now, use a mock calculation
      triggerTime = new Date(Date.now() + reminder.timing.minutesBefore * 60 * 1000);
    }

    const delay = Math.max(0, triggerTime.getTime() - Date.now());
    
    setTimeout(() => {
      this.processReminder(reminder.id);
    }, delay);
  }

  private async processReminder(reminderId: string): Promise<void> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder || reminder.status !== 'active') return;

    try {
      // Send reminder notification
      await this.sendReminderNotification(reminder);
      
      reminder.status = 'sent';
      reminder.sentAt = new Date();
      reminder.updatedAt = new Date();
      
      // Schedule recurring reminders if configured
      if (reminder.timing.recurring && reminder.timing.recurring.count > 1) {
        await this.scheduleRecurringReminder(reminder);
      }

    } catch (error) {
      reminder.status = 'failed';
      reminder.error = error.message;
      reminder.updatedAt = new Date();
    }

    this.reminders.set(reminderId, reminder);
  }

  private async sendReminderNotification(reminder: MeetingReminder): Promise<void> {
    // Mock reminder notification sending
    console.log(`Sending ${reminder.type} reminder for meeting ${reminder.meetingId} to user ${reminder.userId}`);
  }

  private async scheduleRecurringReminder(originalReminder: MeetingReminder): Promise<void> {
    if (!originalReminder.timing.recurring) return;

    const nextReminder: MeetingReminder = {
      ...originalReminder,
      id: randomUUID(),
      status: 'active',
      sentAt: undefined,
      error: undefined,
      timing: {
        ...originalReminder.timing,
        recurring: {
          ...originalReminder.timing.recurring,
          count: originalReminder.timing.recurring.count - 1
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reminders.set(nextReminder.id, nextReminder);
    this.scheduleReminderProcessing(nextReminder);
  }

  // Analytics and reporting
  async getNotificationStats(tenantId: string, dateRange?: { start: Date; end: Date }): Promise<NotificationStats> {
    const jobs = Array.from(this.jobs.values())
      .filter(job => job.tenantId === tenantId);

    const filteredJobs = dateRange ? 
      jobs.filter(job => job.createdAt >= dateRange.start && job.createdAt <= dateRange.end) :
      jobs;

    const stats: NotificationStats = {
      total: filteredJobs.length,
      sent: filteredJobs.filter(j => j.status === 'sent').length,
      delivered: 0, // Would be calculated from delivery tracking
      failed: filteredJobs.filter(j => j.status === 'failed').length,
      bounced: 0, // Would be calculated from bounce tracking
      clicked: 0, // Would be calculated from click tracking
      byChannel: {} as any,
      byTemplate: {} as any
    };

    // Calculate channel stats
    const channels: NotificationChannel['type'][] = ['email', 'sms', 'push', 'slack', 'teams', 'webhook', 'in_app'];
    for (const channel of channels) {
      const channelJobs = filteredJobs.filter(job => job.channels.includes(channel));
      const sent = channelJobs.filter(job => job.status === 'sent').length;
      const failed = channelJobs.filter(job => job.status === 'failed').length;
      
      stats.byChannel[channel] = {
        sent,
        delivered: sent, // Mock - would be from delivery tracking
        failed,
        deliveryRate: channelJobs.length > 0 ? (sent / channelJobs.length) * 100 : 0
      };
    }

    // Calculate template stats
    const templateIds = [...new Set(filteredJobs.map(job => job.templateId).filter(Boolean))];
    for (const templateId of templateIds) {
      const templateJobs = filteredJobs.filter(job => job.templateId === templateId);
      const sent = templateJobs.filter(job => job.status === 'sent').length;
      
      stats.byTemplate[templateId!] = {
        sent,
        delivered: sent,
        openRate: Math.random() * 30 + 10, // Mock open rate
        clickRate: Math.random() * 10 + 2 // Mock click rate
      };
    }

    return stats;
  }

  // System health and monitoring
  async getSystemHealth(): Promise<{
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
  }> {
    const jobs = {
      pending: Array.from(this.jobs.values()).filter(j => j.status === 'pending').length,
      processing: Array.from(this.jobs.values()).filter(j => j.status === 'processing').length,
      failed: Array.from(this.jobs.values()).filter(j => j.status === 'failed').length,
      recentFailureRate: 0
    };

    // Calculate recent failure rate (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentJobs = Array.from(this.jobs.values())
      .filter(job => job.updatedAt >= oneHourAgo);
    
    if (recentJobs.length > 0) {
      const recentFailed = recentJobs.filter(job => job.status === 'failed').length;
      jobs.recentFailureRate = (recentFailed / recentJobs.length) * 100;
    }

    const reminders = {
      active: Array.from(this.reminders.values()).filter(r => r.status === 'active').length,
      failed: Array.from(this.reminders.values()).filter(r => r.status === 'failed').length
    };

    const templates = {
      total: this.templates.size,
      active: Array.from(this.templates.values()).filter(t => t.status === 'active').length
    };

    const rules = {
      total: this.rules.size,
      enabled: Array.from(this.rules.values()).filter(r => r.enabled).length
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (jobs.recentFailureRate > 50 || jobs.failed > 100) {
      status = 'unhealthy';
    } else if (jobs.recentFailureRate > 20 || jobs.failed > 50) {
      status = 'degraded';
    }

    return {
      status,
      jobs,
      reminders,
      templates,
      rules,
      timestamp: new Date()
    };
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Meeting Notification Service...');
    
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    // Cancel all pending jobs
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending' || job.status === 'processing');
    
    for (const job of pendingJobs) {
      job.status = 'cancelled';
      job.updatedAt = new Date();
      this.jobs.set(job.id, job);
    }

    this.templates.clear();
    this.rules.clear();
    this.jobs.clear();
    this.reminders.clear();

    console.log('Meeting Notification Service shutdown complete');
  }
}

export default MeetingNotificationService;
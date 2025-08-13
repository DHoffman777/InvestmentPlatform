import { EventEmitter } from 'events';
import {
  SLABreach,
  SLAComplianceScore,
  SLAReport,
  SLANotificationChannel,
  SLASeverity,
  SLADefinition,
  SLANotification
} from './SLADataModel';

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

export enum NotificationType {
  BREACH_NOTIFICATION = 'breach_notification',
  BREACH_RESOLVED = 'breach_resolved',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  COMPLIANCE_REPORT = 'compliance_report',
  SLA_ACHIEVEMENT = 'sla_achievement',
  THRESHOLD_WARNING = 'threshold_warning',
  SERVICE_DEGRADATION = 'service_degradation',
  PLANNED_OUTAGE = 'planned_outage',
  EMERGENCY_ALERT = 'emergency_alert',
  MONTHLY_SUMMARY = 'monthly_summary'
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
  skipLevels: boolean; // Skip levels for critical issues
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
  workDays: number[]; // 0=Sunday, 1=Monday, etc.
  workHours: { start: string; end: string }; // HH:mm format
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
  distributionTime: string; // HH:mm format
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

export class SLACustomerNotificationService extends EventEmitter {
  private config: CustomerNotificationConfig;
  private customers: Map<string, ContactInfo> = new Map();
  private notificationHistory: Map<string, CustomerNotificationHistory> = new Map();
  private deliveryQueue: CustomerNotificationRequest[] = [];
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private templates: Map<NotificationType, NotificationTemplate> = new Map();
  private activeEscalations: Map<string, EscalationExecution> = new Map();

  constructor(config: CustomerNotificationConfig) {
    super();
    this.config = config;
    this.initializeTemplates();
    this.startQueueProcessor();
    this.startEscalationMonitor();
  }

  async sendCustomerNotification(request: CustomerNotificationRequest): Promise<string> {
    if (!this.config.enableCustomerNotifications) {
      throw new Error('Customer notifications are disabled');
    }

    const customer = this.customers.get(request.customerId);
    if (!customer) {
      throw new Error(`Customer ${request.customerId} not found`);
    }

    // Check rate limits
    if (!this.checkRateLimit(request.customerId, request.type)) {
      throw new Error('Rate limit exceeded for customer notifications');
    }

    // Check customer preferences
    if (!this.shouldNotifyCustomer(customer, request)) {
      this.emit('notificationSkipped', { customerId: request.customerId, reason: 'customer_preferences' });
      return '';
    }

    const notificationId = this.generateNotificationId();
    const template = this.getTemplate(request.type, customer.preferences.language);
    
    if (!template) {
      throw new Error(`Template not found for type ${request.type}`);
    }

    const notificationRecord: NotificationRecord = {
      id: notificationId,
      type: request.type,
      severity: request.severity,
      subject: request.subject,
      sentAt: new Date(),
      deliveryResults: [],
      acknowledged: false,
      data: request.data
    };

    // Add to customer history
    this.addToHistory(request.customerId, notificationRecord);

    // Queue for delivery
    if (request.scheduledTime && request.scheduledTime > new Date()) {
      setTimeout(() => {
        this.deliveryQueue.push(request);
      }, request.scheduledTime.getTime() - Date.now());
    } else {
      this.deliveryQueue.push(request);
    }

    this.emit('notificationQueued', { notificationId, customerId: request.customerId });
    return notificationId;
  }

  async sendBreachNotification(
    customerId: string, 
    breach: SLABreach, 
    slaDefinition: SLADefinition
  ): Promise<string> {
    const request: CustomerNotificationRequest = {
      customerId,
      type: NotificationType.BREACH_NOTIFICATION,
      severity: breach.severity,
      subject: `SLA Breach Alert: ${slaDefinition.name}`,
      data: {
        slaName: slaDefinition.name,
        serviceName: slaDefinition.serviceName,
        breachTime: breach.startTime,
        severity: breach.severity,
        actualValue: breach.actualValue,
        targetValue: breach.targetValue,
        impactDescription: this.getImpactDescription(breach, slaDefinition),
        estimatedResolution: this.estimateResolutionTime(breach),
        incidentId: breach.id,
        nextUpdate: this.calculateNextUpdateTime()
      },
      urgency: this.mapSeverityToUrgency(breach.severity)
    };

    const notificationId = await this.sendCustomerNotification(request);

    // Start escalation if configured
    if (this.config.escalationMatrix.automaticEscalation && breach.severity === SLASeverity.CRITICAL) {
      await this.startEscalation(breach.id, customerId, breach.severity);
    }

    return notificationId;
  }

  async sendResolutionNotification(
    customerId: string, 
    breach: SLABreach, 
    slaDefinition: SLADefinition
  ): Promise<string> {
    const duration = breach.duration ? Math.round(breach.duration / (60 * 1000)) : 0;

    return this.sendCustomerNotification({
      customerId,
      type: NotificationType.BREACH_RESOLVED,
      severity: SLASeverity.INFO,
      subject: `SLA Breach Resolved: ${slaDefinition.name}`,
      data: {
        slaName: slaDefinition.name,
        serviceName: slaDefinition.serviceName,
        breachTime: breach.startTime,
        resolutionTime: breach.resolvedAt,
        duration: `${duration} minutes`,
        rootCause: breach.rootCause || 'Under investigation',
        preventiveMeasures: this.getPreventiveMeasures(breach),
        incidentId: breach.id
      },
      urgency: 'medium'
    });
  }

  async sendComplianceReport(
    customerId: string, 
    report: SLAReport, 
    complianceScore: SLAComplianceScore
  ): Promise<string> {
    return this.sendCustomerNotification({
      customerId,
      type: NotificationType.COMPLIANCE_REPORT,
      severity: SLASeverity.INFO,
      subject: `SLA Compliance Report - ${report.timeRange.start.toLocaleDateString()} to ${report.timeRange.end.toLocaleDateString()}`,
      data: {
        reportPeriod: `${report.timeRange.start.toLocaleDateString()} - ${report.timeRange.end.toLocaleDateString()}`,
        overallScore: complianceScore.overallScore,
        availability: complianceScore.availability,
        performance: complianceScore.performance,
        reliability: complianceScore.reliability,
        totalBreaches: report.summary.totalBreaches,
        complianceRate: report.summary.overallComplianceRate,
        keyInsights: report.summary.keyInsights,
        recommendations: complianceScore.recommendations,
        reportUrl: this.generateReportUrl(report.id),
        nextReportDate: this.calculateNextReportDate()
      },
      urgency: 'low'
    });
  }

  async sendMaintenanceNotification(
    customerId: string,
    maintenanceWindow: {
      id: string;
      name: string;
      description: string;
      startTime: Date;
      endTime: Date;
      affectedServices: string[];
      expectedImpact: string;
    }
  ): Promise<string> {
    const duration = Math.round((maintenanceWindow.endTime.getTime() - maintenanceWindow.startTime.getTime()) / (60 * 1000));

    return this.sendCustomerNotification({
      customerId,
      type: NotificationType.MAINTENANCE_NOTICE,
      severity: SLASeverity.MEDIUM,
      subject: `Scheduled Maintenance: ${maintenanceWindow.name}`,
      data: {
        maintenanceName: maintenanceWindow.name,
        description: maintenanceWindow.description,
        startTime: maintenanceWindow.startTime,
        endTime: maintenanceWindow.endTime,
        duration: `${duration} minutes`,
        affectedServices: maintenanceWindow.affectedServices,
        expectedImpact: maintenanceWindow.expectedImpact,
        preparationSteps: this.getMaintenancePreparationSteps(),
        contactInfo: this.config.brandingConfig.contactInfo,
        maintenanceId: maintenanceWindow.id
      },
      urgency: 'medium',
      scheduledTime: new Date(maintenanceWindow.startTime.getTime() - (24 * 60 * 60 * 1000)) // 24 hours before
    });
  }

  async updateCustomerPreferences(
    customerId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    customer.preferences = { ...customer.preferences, ...preferences };
    this.customers.set(customerId, customer);

    // Update history record
    const history = this.notificationHistory.get(customerId);
    if (history) {
      history.preferences = customer.preferences;
      history.lastUpdated = new Date();
      this.notificationHistory.set(customerId, history);
    }

    this.emit('preferencesUpdated', { customerId, preferences: customer.preferences });
  }

  async getNotificationHistory(
    customerId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      types?: NotificationType[];
      limit?: number;
    } = {}
  ): Promise<NotificationRecord[]> {
    const history = this.notificationHistory.get(customerId);
    if (!history) {
      return [];
    }

    let notifications = history.notifications;

    // Apply filters
    if (options.startDate) {
      notifications = notifications.filter(n => n.sentAt >= options.startDate!);
    }

    if (options.endDate) {
      notifications = notifications.filter(n => n.sentAt <= options.endDate!);
    }

    if (options.types && options.types.length > 0) {
      notifications = notifications.filter(n => options.types!.includes(n.type));
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

    // Apply limit
    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  async acknowledgeNotification(customerId: string, notificationId: string): Promise<void> {
    const history = this.notificationHistory.get(customerId);
    if (!history) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const notification = history.notifications.find(n => n.id === notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    notification.acknowledged = true;
    notification.acknowledgedAt = new Date();

    this.emit('notificationAcknowledged', { customerId, notificationId });

    // Stop escalation if this was an escalated notification
    const escalation = this.activeEscalations.get(notificationId);
    if (escalation) {
      escalation.status = 'acknowledged';
      escalation.acknowledgedAt = new Date();
    }
  }

  async unsubscribeCustomer(customerId: string, category?: NotificationType[]): Promise<void> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    if (category && category.length > 0) {
      // Partial unsubscribe - remove specific categories
      customer.preferences.categories = customer.preferences.categories.filter(
        cat => !category.includes(cat)
      );
    } else {
      // Full unsubscribe
      customer.preferences.channels = [];
      customer.preferences.categories = [];
    }

    this.customers.set(customerId, customer);

    // Update subscription status
    const history = this.notificationHistory.get(customerId);
    if (history) {
      history.subscriptionStatus = category && category.length > 0 ? 'paused' : 'unsubscribed';
      history.lastUpdated = new Date();
    }

    this.emit('customerUnsubscribed', { customerId, categories: category });
  }

  private async processDeliveryQueue(): Promise<void> {
    while (this.deliveryQueue.length > 0) {
      const request = this.deliveryQueue.shift()!;
      
      try {
        await this.deliverNotification(request);
      } catch (error) {
        this.emit('deliveryFailed', { 
          customerId: request.customerId, 
          type: request.type, 
          error: error.message 
        });
      }
    }
  }

  private async deliverNotification(request: CustomerNotificationRequest): Promise<void> {
    const customer = this.customers.get(request.customerId);
    if (!customer) return;

    const template = this.getTemplate(request.type, customer.preferences.language);
    if (!template) return;

    const channels = request.channelOverride || customer.preferences.channels;
    const content = this.renderTemplate(template, request.data);

    for (const channel of channels) {
      try {
        const result = await this.sendViaChannel(channel, customer, content, request);
        this.recordDeliveryResult(request.customerId, request, channel, result);
      } catch (error) {
        this.recordDeliveryResult(request.customerId, request, channel, {
          success: false,
          error: error.message,
          deliveryTime: 0
        });
      }
    }
  }

  private async sendViaChannel(
    channel: SLANotificationChannel,
    customer: ContactInfo,
    content: { subject: string; html: string; text: string },
    request: CustomerNotificationRequest
  ): Promise<{ success: boolean; deliveryTime: number; messageId?: string }> {
    const startTime = Date.now();

    switch (channel) {
      case SLANotificationChannel.EMAIL:
        return this.sendEmail(customer.email, content.subject, content.html, content.text);
      
      case SLANotificationChannel.SMS:
        if (customer.phone) {
          return this.sendSMS(customer.phone, content.text);
        }
        throw new Error('No phone number available for SMS');
      
      case SLANotificationChannel.SLACK:
        return this.sendSlackMessage(customer, content);
      
      case SLANotificationChannel.WEBHOOK:
        return this.sendWebhook(customer, request, content);
      
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private async sendEmail(
    email: string, 
    subject: string, 
    html: string, 
    text: string
  ): Promise<{ success: boolean; deliveryTime: number; messageId?: string }> {
    // Mock email sending
    console.log(`Sending email to ${email}: ${subject}`);
    
    // Simulate delivery time
    const deliveryTime = 100 + Math.random() * 500;
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    return {
      success: true,
      deliveryTime,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private async sendSMS(
    phone: string, 
    message: string
  ): Promise<{ success: boolean; deliveryTime: number; messageId?: string }> {
    // Mock SMS sending
    console.log(`Sending SMS to ${phone}: ${message.substring(0, 50)}...`);
    
    const deliveryTime = 50 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    return {
      success: true,
      deliveryTime,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private async sendSlackMessage(
    customer: ContactInfo, 
    content: { subject: string; html: string; text: string }
  ): Promise<{ success: boolean; deliveryTime: number; messageId?: string }> {
    // Mock Slack sending
    console.log(`Sending Slack message to ${customer.name}: ${content.subject}`);
    
    const deliveryTime = 200 + Math.random() * 300;
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    return {
      success: true,
      deliveryTime,
      messageId: `slack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private async sendWebhook(
    customer: ContactInfo, 
    request: CustomerNotificationRequest, 
    content: { subject: string; html: string; text: string }
  ): Promise<{ success: boolean; deliveryTime: number; messageId?: string }> {
    // Mock webhook sending
    console.log(`Sending webhook notification for ${customer.name}`);
    
    const deliveryTime = 150 + Math.random() * 400;
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    return {
      success: true,
      deliveryTime,
      messageId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private renderTemplate(template: NotificationTemplate, data: Record<string, any>): { subject: string; html: string; text: string } {
    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    // Replace variables
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
      text = text.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Add branding
    html = this.applyBranding(html);

    return { subject, html, text };
  }

  private applyBranding(html: string): string {
    const branding = this.config.brandingConfig;
    
    // Add header with logo and company name
    const header = `
      <div style="background-color: ${branding.colors.primary}; padding: 20px; text-align: center;">
        <img src="${branding.logo}" alt="${branding.companyName}" style="max-height: 50px;">
        <h1 style="color: white; margin: 10px 0 0 0;">${branding.companyName}</h1>
      </div>
    `;

    // Add footer
    const footer = `
      <div style="background-color: ${branding.colors.background}; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        ${branding.footer}
        <br><br>
        ${branding.disclaimer}
        <br><br>
        Contact: <a href="mailto:${branding.contactInfo.supportEmail}">${branding.contactInfo.supportEmail}</a> | 
        Phone: ${branding.contactInfo.supportPhone} | 
        Web: <a href="${branding.contactInfo.website}">${branding.contactInfo.website}</a>
      </div>
    `;

    return `${header}<div style="padding: 20px;">${html}</div>${footer}`;
  }

  private shouldNotifyCustomer(customer: ContactInfo, request: CustomerNotificationRequest): boolean {
    const prefs = customer.preferences;

    // Check if customer has opted out
    if (!prefs.channels.length || !prefs.categories.includes(request.type)) {
      return false;
    }

    // Check severity preference
    if (!prefs.severity.includes(request.severity)) {
      return false;
    }

    // Check do not disturb settings
    if (prefs.doNotDisturb.enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().substr(0, 5); // HH:mm
      const currentDay = now.getDay();

      if (prefs.doNotDisturb.startTime && prefs.doNotDisturb.endTime) {
        if (currentTime >= prefs.doNotDisturb.startTime && currentTime <= prefs.doNotDisturb.endTime) {
          return false;
        }
      }

      if (prefs.doNotDisturb.days && prefs.doNotDisturb.days.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  private checkRateLimit(customerId: string, type: NotificationType): boolean {
    const rateLimiter = this.getRateLimiter(customerId);
    return rateLimiter.allowRequest(type);
  }

  private getRateLimiter(customerId: string): RateLimiter {
    if (!this.rateLimiters.has(customerId)) {
      this.rateLimiters.set(customerId, new RateLimiter({
        maxNotificationsPerHour: 10,
        maxNotificationsPerDay: 50,
        burstLimit: 5,
        cooldownPeriod: 300000 // 5 minutes
      }));
    }
    return this.rateLimiters.get(customerId)!;
  }

  private getTemplate(type: NotificationType, language: string): NotificationTemplate | null {
    // Try to get language-specific template first
    const langSpecificKey = `${type}_${language}`;
    if (this.templates.has(langSpecificKey as NotificationType)) {
      return this.templates.get(langSpecificKey as NotificationType)!;
    }

    // Fallback to default language
    return this.templates.get(type) || null;
  }

  private recordDeliveryResult(
    customerId: string, 
    request: CustomerNotificationRequest, 
    channel: SLANotificationChannel, 
    result: { success: boolean; deliveryTime: number; error?: string; messageId?: string }
  ): void {
    const history = this.notificationHistory.get(customerId);
    if (!history) return;

    const notification = history.notifications.find(n => 
      n.type === request.type && 
      n.subject === request.subject &&
      n.sentAt.getTime() > (Date.now() - 60000) // Within last minute
    );

    if (notification) {
      const deliveryResult: NotificationDeliveryResult = {
        notificationId: notification.id,
        customerId,
        channel,
        status: result.success ? 'sent' : 'failed',
        timestamp: new Date(),
        deliveryTime: result.deliveryTime,
        error: result.error,
        retryCount: 0
      };

      notification.deliveryResults.push(deliveryResult);
    }
  }

  private addToHistory(customerId: string, notification: NotificationRecord): void {
    let history = this.notificationHistory.get(customerId);
    
    if (!history) {
      const customer = this.customers.get(customerId);
      history = {
        customerId,
        notifications: [],
        preferences: customer?.preferences || this.config.customerPreferences.defaultPreferences,
        subscriptionStatus: 'active',
        lastUpdated: new Date()
      };
      this.notificationHistory.set(customerId, history);
    }

    history.notifications.push(notification);
    
    // Keep only last 1000 notifications per customer
    if (history.notifications.length > 1000) {
      history.notifications = history.notifications.slice(-1000);
    }
  }

  private async startEscalation(incidentId: string, customerId: string, severity: SLASeverity): Promise<void> {
    const escalationMatrix = this.config.escalationMatrix;
    const timeout = escalationMatrix.escalationTimeouts[severity];

    const escalation: EscalationExecution = {
      id: this.generateEscalationId(),
      incidentId,
      customerId,
      severity,
      currentLevel: 0,
      status: 'active',
      startedAt: new Date(),
      nextEscalationAt: new Date(Date.now() + timeout)
    };

    this.activeEscalations.set(incidentId, escalation);
    this.emit('escalationStarted', { incidentId, escalation });
  }

  private initializeTemplates(): void {
    // Initialize default templates
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'breach_notification_en',
        type: NotificationType.BREACH_NOTIFICATION,
        name: 'SLA Breach Notification',
        subject: 'SLA Breach Alert: {{slaName}}',
        htmlContent: `
          <h2>SLA Breach Alert</h2>
          <p>We want to inform you that an SLA breach has occurred for <strong>{{serviceName}}</strong>.</p>
          <ul>
            <li><strong>Service:</strong> {{serviceName}}</li>
            <li><strong>SLA:</strong> {{slaName}}</li>
            <li><strong>Breach Time:</strong> {{breachTime}}</li>
            <li><strong>Severity:</strong> {{severity}}</li>
            <li><strong>Current Value:</strong> {{actualValue}}</li>
            <li><strong>Target Value:</strong> {{targetValue}}</li>
          </ul>
          <p><strong>Impact:</strong> {{impactDescription}}</p>
          <p><strong>Estimated Resolution:</strong> {{estimatedResolution}}</p>
          <p>We are actively working to resolve this issue. Next update: {{nextUpdate}}</p>
          <p>Incident ID: {{incidentId}}</p>
        `,
        textContent: `
          SLA Breach Alert
          
          Service: {{serviceName}}
          SLA: {{slaName}}
          Breach Time: {{breachTime}}
          Severity: {{severity}}
          Current Value: {{actualValue}}
          Target Value: {{targetValue}}
          
          Impact: {{impactDescription}}
          Estimated Resolution: {{estimatedResolution}}
          
          We are actively working to resolve this issue.
          Next update: {{nextUpdate}}
          
          Incident ID: {{incidentId}}
        `,
        variables: ['slaName', 'serviceName', 'breachTime', 'severity', 'actualValue', 'targetValue', 'impactDescription', 'estimatedResolution', 'nextUpdate', 'incidentId'],
        language: 'en',
        category: 'incident',
        urgency: 'high'
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      await this.processDeliveryQueue();
    }, 5000); // Process every 5 seconds
  }

  private startEscalationMonitor(): void {
    setInterval(() => {
      const now = new Date();
      for (const [incidentId, escalation] of this.activeEscalations) {
        if (escalation.status === 'active' && escalation.nextEscalationAt <= now) {
          this.escalateIncident(incidentId, escalation);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async escalateIncident(incidentId: string, escalation: EscalationExecution): Promise<void> {
    const matrix = this.config.escalationMatrix;
    const nextLevel = escalation.currentLevel + 1;

    if (nextLevel < matrix.levels.length) {
      escalation.currentLevel = nextLevel;
      escalation.nextEscalationAt = new Date(Date.now() + matrix.levels[nextLevel].timeout);
      
      this.emit('incidentEscalated', { incidentId, level: nextLevel });
    } else {
      escalation.status = 'max_level_reached';
      this.emit('maxEscalationReached', { incidentId });
    }
  }

  private getImpactDescription(breach: SLABreach, slaDefinition: SLADefinition): string {
    return `Service performance is currently ${breach.impactValue}% below target levels.`;
  }

  private estimateResolutionTime(breach: SLABreach): string {
    // Simple estimation based on severity
    switch (breach.severity) {
      case SLASeverity.CRITICAL:
        return '30-60 minutes';
      case SLASeverity.HIGH:
        return '1-2 hours';
      case SLASeverity.MEDIUM:
        return '2-4 hours';
      default:
        return '4-8 hours';
    }
  }

  private calculateNextUpdateTime(): string {
    const next = new Date(Date.now() + (30 * 60 * 1000)); // 30 minutes from now
    return next.toLocaleString();
  }

  private calculateNextReportDate(): string {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next.toLocaleDateString();
  }

  private mapSeverityToUrgency(severity: SLASeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case SLASeverity.CRITICAL:
        return 'critical';
      case SLASeverity.HIGH:
        return 'high';
      case SLASeverity.MEDIUM:
        return 'medium';
      default:
        return 'low';
    }
  }

  private getPreventiveMeasures(breach: SLABreach): string[] {
    return [
      'Enhanced monitoring and alerting',
      'Capacity planning review',
      'Process improvement implementation'
    ];
  }

  private getMaintenancePreparationSteps(): string[] {
    return [
      'Save any unsaved work',
      'Plan alternative workflows if needed',
      'Contact support if you have concerns'
    ];
  }

  private generateReportUrl(reportId: string): string {
    return `https://portal.company.com/reports/${reportId}`;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEscalationId(): string {
    return `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    this.customers.clear();
    this.notificationHistory.clear();
    this.deliveryQueue = [];
    this.rateLimiters.clear();
    this.templates.clear();
    this.activeEscalations.clear();
    
    this.emit('shutdown');
  }
}

interface EscalationExecution {
  id: string;
  incidentId: string;
  customerId: string;
  severity: SLASeverity;
  currentLevel: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'max_level_reached';
  startedAt: Date;
  nextEscalationAt: Date;
  acknowledgedAt?: Date;
}

class RateLimiter {
  private config: RateLimitConfig;
  private hourlyCount: number = 0;
  private dailyCount: number = 0;
  private burstCount: number = 0;
  private lastHourReset: Date = new Date();
  private lastDayReset: Date = new Date();
  private lastBurstReset: Date = new Date();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  allowRequest(type: NotificationType): boolean {
    this.resetCountersIfNeeded();

    // Check burst limit
    if (this.burstCount >= this.config.burstLimit) {
      const timeSinceLastBurst = Date.now() - this.lastBurstReset.getTime();
      if (timeSinceLastBurst < this.config.cooldownPeriod) {
        return false;
      }
      this.burstCount = 0;
      this.lastBurstReset = new Date();
    }

    // Check hourly and daily limits
    if (this.hourlyCount >= this.config.maxNotificationsPerHour ||
        this.dailyCount >= this.config.maxNotificationsPerDay) {
      return false;
    }

    // Allow request and increment counters
    this.hourlyCount++;
    this.dailyCount++;
    this.burstCount++;

    return true;
  }

  private resetCountersIfNeeded(): void {
    const now = new Date();

    // Reset hourly counter
    if (now.getTime() - this.lastHourReset.getTime() >= 60 * 60 * 1000) {
      this.hourlyCount = 0;
      this.lastHourReset = now;
    }

    // Reset daily counter
    if (now.getTime() - this.lastDayReset.getTime() >= 24 * 60 * 60 * 1000) {
      this.dailyCount = 0;
      this.lastDayReset = now;
    }
  }
}
import { EventEmitter } from 'events';
import {
  MetricAlert,
  MetricValue,
  KPITarget,
  BusinessKPI,
  AlertSeverity,
  NotificationChannel,
  MetricSubscription
} from './BusinessMetricsDataModel';

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

export class BusinessThresholdAlerting extends EventEmitter {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, MetricAlert> = new Map();
  private alertHistory: Map<string, AlertHistory[]> = new Map();
  private alertStatistics: Map<string, AlertStatistics> = new Map();
  private subscriptions: Map<string, MetricSubscription> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private anomalyDetectors: Map<string, AnomalyDetector> = new Map();
  private evaluationTimer: NodeJS.Timeout;
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    super();
    this.startEvaluationTimer();
    this.startCleanupTimer();
    this.initializeDefaultTemplates();
  }

  async createAlertRule(rule: Partial<AlertRule>): Promise<AlertRule> {
    const newRule: AlertRule = {
      id: rule.id || this.generateId(),
      tenantId: rule.tenantId!,
      name: rule.name!,
      description: rule.description || '',
      metricId: rule.metricId,
      kpiId: rule.kpiId,
      type: rule.type || 'threshold',
      conditions: rule.conditions || [],
      severity: rule.severity || AlertSeverity.MEDIUM,
      isEnabled: rule.isEnabled !== false,
      cooldownPeriod: rule.cooldownPeriod || 300000,
      escalationRules: rule.escalationRules || [],
      suppressionRules: rule.suppressionRules || [],
      notificationChannels: rule.notificationChannels || [],
      tags: rule.tags || {},
      createdBy: rule.createdBy!,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.validateAlertRule(newRule);
    this.alertRules.set(newRule.id, newRule);
    
    if (newRule.type === 'anomaly') {
      await this.setupAnomalyDetection(newRule);
    }

    this.initializeAlertStatistics(newRule.id);
    this.emit('alertRuleCreated', { ruleId: newRule.id });
    
    return newRule;
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`);
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date()
    };

    await this.validateAlertRule(updatedRule);
    this.alertRules.set(ruleId, updatedRule);
    
    this.emit('alertRuleUpdated', { ruleId });
    return updatedRule;
  }

  async deleteAlertRule(ruleId: string): Promise<void> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`);
    }

    const activeAlertsForRule = Array.from(this.activeAlerts.values())
      .filter(alert => alert.id === ruleId);

    for (const alert of activeAlertsForRule) {
      await this.resolveAlert(alert.id, 'rule_deleted', 'system');
    }

    this.alertRules.delete(ruleId);
    this.alertStatistics.delete(ruleId);
    this.anomalyDetectors.delete(ruleId);
    
    this.emit('alertRuleDeleted', { ruleId });
  }

  async evaluateMetricValue(metricValue: MetricValue): Promise<AlertEvaluation[]> {
    const evaluations: AlertEvaluation[] = [];
    
    const relevantRules = Array.from(this.alertRules.values())
      .filter(rule => rule.isEnabled && rule.metricId === metricValue.metricId);

    for (const rule of relevantRules) {
      try {
        const evaluation = await this.evaluateRule(rule, metricValue);
        evaluations.push(evaluation);
        
        if (evaluation.isTriggered) {
          await this.handleTriggeredAlert(rule, evaluation, metricValue);
        }
      } catch (error) {
        this.emit('evaluationError', { 
          ruleId: rule.id, 
          metricId: metricValue.metricId, 
          error: error.message 
        });
      }
    }
    
    return evaluations;
  }

  async evaluateKPI(kpiId: string, currentValue: number, context: Record<string, any>): Promise<AlertEvaluation[]> {
    const evaluations: AlertEvaluation[] = [];
    
    const relevantRules = Array.from(this.alertRules.values())
      .filter(rule => rule.isEnabled && rule.kpiId === kpiId);

    for (const rule of relevantRules) {
      try {
        const evaluation = await this.evaluateKPIRule(rule, currentValue, context);
        evaluations.push(evaluation);
        
        if (evaluation.isTriggered) {
          await this.handleTriggeredKPIAlert(rule, evaluation, currentValue, context);
        }
      } catch (error) {
        this.emit('evaluationError', { 
          ruleId: rule.id, 
          kpiId, 
          error: error.message 
        });
      }
    }
    
    return evaluations;
  }

  private async evaluateRule(rule: AlertRule, metricValue: MetricValue): Promise<AlertEvaluation> {
    const conditionEvaluations: ConditionEvaluation[] = [];
    
    for (const condition of rule.conditions) {
      const evaluation = await this.evaluateCondition(condition, metricValue, rule);
      conditionEvaluations.push(evaluation);
    }

    const requiredConditionsMet = conditionEvaluations
      .filter(eval => eval.isMet && rule.conditions.find(c => c.id === eval.conditionId)?.isRequired)
      .length;

    const requiredConditionsCount = rule.conditions.filter(c => c.isRequired).length;
    const isTriggered = requiredConditionsMet === requiredConditionsCount &&
                       requiredConditionsCount > 0;

    return {
      ruleId: rule.id,
      metricId: metricValue.metricId,
      timestamp: new Date(),
      conditions: conditionEvaluations,
      isTriggered,
      severity: rule.severity,
      context: {
        metricValue: metricValue.value,
        dimensions: metricValue.dimensions,
        tags: metricValue.tags
      }
    };
  }

  private async evaluateKPIRule(rule: AlertRule, currentValue: number, context: Record<string, any>): Promise<AlertEvaluation> {
    const conditionEvaluations: ConditionEvaluation[] = [];
    
    for (const condition of rule.conditions) {
      const evaluation = await this.evaluateKPICondition(condition, currentValue, context);
      conditionEvaluations.push(evaluation);
    }

    const requiredConditionsMet = conditionEvaluations
      .filter(eval => eval.isMet && rule.conditions.find(c => c.id === eval.conditionId)?.isRequired)
      .length;

    const requiredConditionsCount = rule.conditions.filter(c => c.isRequired).length;
    const isTriggered = requiredConditionsMet === requiredConditionsCount &&
                       requiredConditionsCount > 0;

    return {
      ruleId: rule.id,
      kpiId: rule.kpiId,
      timestamp: new Date(),
      conditions: conditionEvaluations,
      isTriggered,
      severity: rule.severity,
      context
    };
  }

  private async evaluateCondition(condition: AlertCondition, metricValue: MetricValue, rule: AlertRule): Promise<ConditionEvaluation> {
    let actualValue = metricValue.value;
    let isMet = false;

    switch (condition.type) {
      case 'value':
        isMet = this.evaluateValueCondition(actualValue, condition);
        break;
        
      case 'change':
        const previousValue = await this.getPreviousValue(metricValue.metricId);
        if (previousValue !== null) {
          actualValue = actualValue - previousValue;
          isMet = this.evaluateValueCondition(actualValue, condition);
        }
        break;
        
      case 'rate':
        const rateValue = await this.calculateRate(metricValue.metricId, condition.timeWindow || 3600000);
        if (rateValue !== null) {
          actualValue = rateValue;
          isMet = this.evaluateValueCondition(actualValue, condition);
        }
        break;
        
      case 'pattern':
        isMet = await this.evaluatePatternCondition(metricValue.metricId, condition);
        break;
        
      case 'time_based':
        isMet = this.evaluateTimeBasedCondition(metricValue, condition);
        break;
    }

    if (condition.dimensions) {
      const dimensionMatch = Object.entries(condition.dimensions).every(([key, value]) => 
        metricValue.dimensions[key] === value
      );
      isMet = isMet && dimensionMatch;
    }

    return {
      conditionId: condition.id,
      isMet,
      actualValue,
      threshold: Array.isArray(condition.value) ? condition.value[0] : condition.value
    };
  }

  private async evaluateKPICondition(condition: AlertCondition, currentValue: number, context: Record<string, any>): Promise<ConditionEvaluation> {
    let actualValue = currentValue;
    let isMet = false;

    switch (condition.type) {
      case 'value':
        isMet = this.evaluateValueCondition(actualValue, condition);
        break;
        
      default:
        isMet = this.evaluateValueCondition(actualValue, condition);
    }

    return {
      conditionId: condition.id,
      isMet,
      actualValue,
      threshold: Array.isArray(condition.value) ? condition.value[0] : condition.value
    };
  }

  private evaluateValueCondition(value: number, condition: AlertCondition): boolean {
    const threshold = condition.value;
    
    switch (condition.operator) {
      case 'gt': return value > (threshold as number);
      case 'gte': return value >= (threshold as number);
      case 'lt': return value < (threshold as number);
      case 'lte': return value <= (threshold as number);
      case 'eq': return value === (threshold as number);
      case 'ne': return value !== (threshold as number);
      case 'between':
        const [min, max] = threshold as number[];
        return value >= min && value <= max;
      case 'outside':
        const [lowerBound, upperBound] = threshold as number[];
        return value < lowerBound || value > upperBound;
      default:
        return false;
    }
  }

  private async evaluatePatternCondition(metricId: string, condition: AlertCondition): boolean {
    const detector = this.anomalyDetectors.get(metricId);
    if (!detector) return false;
    
    return await detector.isAnomaly(await this.getPreviousValue(metricId) || 0);
  }

  private evaluateTimeBasedCondition(metricValue: MetricValue, condition: AlertCondition): boolean {
    const hour = metricValue.timestamp.getHours();
    const dayOfWeek = metricValue.timestamp.getDay();
    
    const timeRanges = condition.value as any;
    
    if (timeRanges.hours && !timeRanges.hours.includes(hour)) {
      return false;
    }
    
    if (timeRanges.daysOfWeek && !timeRanges.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }
    
    return true;
  }

  private async handleTriggeredAlert(rule: AlertRule, evaluation: AlertEvaluation, metricValue: MetricValue): Promise<void> {
    if (!await this.shouldTriggerAlert(rule, evaluation)) {
      return;
    }

    const alert: MetricAlert = {
      id: this.generateId(),
      metricId: metricValue.metricId,
      tenantId: rule.tenantId,
      alertType: rule.type,
      severity: rule.severity,
      status: 'active',
      message: await this.generateAlertMessage(rule, evaluation, metricValue),
      currentValue: metricValue.value,
      threshold: evaluation.conditions[0]?.threshold,
      dimensions: metricValue.dimensions,
      triggeredAt: new Date(),
      notificationsSent: [],
      actionsTaken: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.activeAlerts.set(alert.id, alert);
    this.updateAlertStatistics(rule.id, 'triggered');
    this.recordAlertHistory(alert.id, 'triggered', evaluation.context);

    await this.sendNotifications(alert, rule);
    
    this.emit('alertTriggered', { 
      alertId: alert.id, 
      ruleId: rule.id, 
      metricId: metricValue.metricId,
      severity: alert.severity
    });
  }

  private async handleTriggeredKPIAlert(rule: AlertRule, evaluation: AlertEvaluation, currentValue: number, context: Record<string, any>): Promise<void> {
    if (!await this.shouldTriggerAlert(rule, evaluation)) {
      return;
    }

    const alert: MetricAlert = {
      id: this.generateId(),
      kpiTargetId: rule.kpiId,
      tenantId: rule.tenantId,
      alertType: rule.type,
      severity: rule.severity,
      status: 'active',
      message: await this.generateKPIAlertMessage(rule, evaluation, currentValue, context),
      currentValue,
      threshold: evaluation.conditions[0]?.threshold,
      dimensions: context as Record<string, string>,
      triggeredAt: new Date(),
      notificationsSent: [],
      actionsTaken: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.activeAlerts.set(alert.id, alert);
    this.updateAlertStatistics(rule.id, 'triggered');
    this.recordAlertHistory(alert.id, 'triggered', context);

    await this.sendNotifications(alert, rule);
    
    this.emit('alertTriggered', { 
      alertId: alert.id, 
      ruleId: rule.id, 
      kpiId: rule.kpiId,
      severity: alert.severity
    });
  }

  private async shouldTriggerAlert(rule: AlertRule, evaluation: AlertEvaluation): Promise<boolean> {
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => 
        (alert.metricId === evaluation.metricId || alert.kpiTargetId === evaluation.kpiId) &&
        alert.status === 'active'
      );

    if (existingAlert) {
      const timeSinceTriggered = Date.now() - existingAlert.triggeredAt.getTime();
      if (timeSinceTriggered < rule.cooldownPeriod) {
        return false;
      }
    }

    for (const suppressionRule of rule.suppressionRules) {
      if (await this.isSuppressed(suppressionRule, evaluation)) {
        return false;
      }
    }

    return true;
  }

  private async isSuppressed(suppressionRule: SuppressionRule, evaluation: AlertEvaluation): Promise<boolean> {
    if (!suppressionRule.isActive) return false;

    switch (suppressionRule.type) {
      case 'time_based':
        const now = new Date();
        const startTime = suppressionRule.configuration.startTime;
        const endTime = suppressionRule.configuration.endTime;
        const currentTime = now.getHours() * 60 + now.getMinutes();
        return currentTime >= startTime && currentTime <= endTime;
        
      case 'condition_based':
        return false;
        
      case 'dependency_based':
        const dependentAlerts = suppressionRule.configuration.dependentAlerts || [];
        return dependentAlerts.some((alertId: string) => this.activeAlerts.has(alertId));
        
      default:
        return false;
    }
  }

  private async sendNotifications(alert: MetricAlert, rule: AlertRule): Promise<void> {
    for (const channelId of rule.notificationChannels) {
      try {
        await this.sendNotification(alert, channelId, rule);
        alert.notificationsSent.push(`${channelId}:${new Date().toISOString()}`);
      } catch (error) {
        this.emit('notificationError', { 
          alertId: alert.id, 
          channelId, 
          error: error.message 
        });
      }
    }
  }

  private async sendNotification(alert: MetricAlert, channelId: string, rule: AlertRule): Promise<void> {
    const channel = this.notificationChannels.get(channelId);
    if (!channel || !channel.isEnabled) return;

    const template = this.templates.get(`${channel.type}_default`);
    if (!template) return;

    const message = await this.renderNotificationMessage(template, alert, rule);
    
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel, message, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, message, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, alert);
        break;
      default:
        this.emit('unsupportedNotificationChannel', { type: channel.type });
    }
  }

  private async renderNotificationMessage(template: NotificationTemplate, alert: MetricAlert, rule: AlertRule): Promise<any> {
    const variables = {
      alertId: alert.id,
      ruleName: rule.name,
      severity: alert.severity,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      message: alert.message,
      triggeredAt: alert.triggeredAt.toISOString(),
      metricId: alert.metricId,
      kpiId: alert.kpiTargetId
    };

    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { subject, body, isHtml: template.isHtml };
  }

  private async sendEmailNotification(channel: NotificationChannel, message: any, alert: MetricAlert): Promise<void> {
    this.emit('emailNotificationSent', { 
      to: channel.configuration.recipients,
      subject: message.subject,
      alertId: alert.id
    });
  }

  private async sendSlackNotification(channel: NotificationChannel, message: any, alert: MetricAlert): Promise<void> {
    const payload = {
      text: message.body,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Alert ID', value: alert.id, short: true },
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Current Value', value: alert.currentValue.toString(), short: true },
          { title: 'Threshold', value: alert.threshold?.toString() || 'N/A', short: true }
        ]
      }]
    };

    this.emit('slackNotificationSent', { 
      webhook: channel.configuration.webhookUrl,
      payload,
      alertId: alert.id
    });
  }

  private async sendWebhookNotification(channel: NotificationChannel, alert: MetricAlert): Promise<void> {
    const payload = {
      alertId: alert.id,
      type: 'alert',
      severity: alert.severity,
      status: alert.status,
      message: alert.message,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      triggeredAt: alert.triggeredAt,
      metricId: alert.metricId,
      kpiId: alert.kpiTargetId,
      dimensions: alert.dimensions
    };

    this.emit('webhookNotificationSent', { 
      url: channel.configuration.url,
      payload,
      alertId: alert.id
    });
  }

  async resolveAlert(alertId: string, reason: string, userId?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.updatedAt = new Date();

    this.activeAlerts.delete(alertId);
    this.updateAlertStatistics(alert.metricId || alert.kpiTargetId!, 'resolved');
    this.recordAlertHistory(alertId, 'resolved', { reason, resolvedBy: userId });

    this.emit('alertResolved', { 
      alertId, 
      reason, 
      userId,
      duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime()
    });
  }

  async acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    alert.updatedAt = new Date();

    this.recordAlertHistory(alertId, 'acknowledged', { notes, acknowledgedBy: userId });
    
    this.emit('alertAcknowledged', { alertId, userId, notes });
  }

  private async generateAlertMessage(rule: AlertRule, evaluation: AlertEvaluation, metricValue: MetricValue): Promise<string> {
    const condition = evaluation.conditions.find(c => c.isMet);
    if (!condition) return `Alert triggered for rule: ${rule.name}`;

    return `${rule.name}: Metric ${metricValue.metricId} value ${metricValue.value} exceeded threshold ${condition.threshold}`;
  }

  private async generateKPIAlertMessage(rule: AlertRule, evaluation: AlertEvaluation, currentValue: number, context: Record<string, any>): Promise<string> {
    const condition = evaluation.conditions.find(c => c.isMet);
    if (!condition) return `KPI alert triggered for rule: ${rule.name}`;

    return `${rule.name}: KPI ${rule.kpiId} value ${currentValue} exceeded threshold ${condition.threshold}`;
  }

  private async validateAlertRule(rule: AlertRule): Promise<void> {
    if (!rule.name || rule.name.trim().length === 0) {
      throw new Error('Alert rule name is required');
    }

    if (!rule.metricId && !rule.kpiId) {
      throw new Error('Alert rule must specify either metricId or kpiId');
    }

    if (rule.conditions.length === 0) {
      throw new Error('Alert rule must have at least one condition');
    }

    const hasRequiredCondition = rule.conditions.some(c => c.isRequired);
    if (!hasRequiredCondition) {
      throw new Error('Alert rule must have at least one required condition');
    }
  }

  private async setupAnomalyDetection(rule: AlertRule): Promise<void> {
    if (!rule.metricId) return;

    const config: AnomalyDetectionConfig = {
      algorithm: 'zscore',
      sensitivity: 0.95,
      trainingPeriod: 7 * 24 * 60 * 60 * 1000,
      minimumDataPoints: 100,
      confidenceLevel: 0.95
    };

    const detector = new AnomalyDetector(config);
    this.anomalyDetectors.set(rule.id, detector);
  }

  private async getPreviousValue(metricId: string): Promise<number | null> {
    return Math.random() * 1000;
  }

  private async calculateRate(metricId: string, timeWindow: number): Promise<number | null> {
    return Math.random() * 10;
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.LOW: return '#36a64f';
      case AlertSeverity.MEDIUM: return '#ff9800';
      case AlertSeverity.HIGH: return '#f44336';
      case AlertSeverity.CRITICAL: return '#d32f2f';
      default: return '#9e9e9e';
    }
  }

  private updateAlertStatistics(entityId: string, action: 'triggered' | 'resolved'): void {
    if (!this.alertStatistics.has(entityId)) {
      this.initializeAlertStatistics(entityId);
    }

    const stats = this.alertStatistics.get(entityId)!;
    
    if (action === 'triggered') {
      stats.totalAlerts++;
      stats.activeAlerts++;
      stats.lastTriggered = new Date();
    } else if (action === 'resolved') {
      stats.activeAlerts = Math.max(0, stats.activeAlerts - 1);
      stats.resolvedAlerts++;
    }
  }

  private initializeAlertStatistics(entityId: string): void {
    this.alertStatistics.set(entityId, {
      ruleId: entityId,
      totalAlerts: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      suppressedAlerts: 0,
      averageResolutionTime: 0,
      falsePositiveRate: 0,
      frequency: {
        hourly: new Array(24).fill(0),
        daily: new Array(7).fill(0),
        weekly: new Array(52).fill(0)
      }
    });
  }

  private recordAlertHistory(alertId: string, status: any, context: Record<string, any>): void {
    if (!this.alertHistory.has(alertId)) {
      this.alertHistory.set(alertId, []);
    }

    const history = this.alertHistory.get(alertId)!;
    history.push({
      id: this.generateId(),
      alertId,
      status,
      timestamp: new Date(),
      context
    });

    if (history.length > 50) {
      history.shift();
    }
  }

  private initializeDefaultTemplates(): void {
    const emailTemplate: NotificationTemplate = {
      id: 'email_default',
      name: 'Default Email Template',
      type: 'email',
      subject: '[{{severity}}] Alert: {{ruleName}}',
      body: `
        <h2>Alert Notification</h2>
        <p><strong>Rule:</strong> {{ruleName}}</p>
        <p><strong>Severity:</strong> {{severity}}</p>
        <p><strong>Message:</strong> {{message}}</p>
        <p><strong>Current Value:</strong> {{currentValue}}</p>
        <p><strong>Threshold:</strong> {{threshold}}</p>
        <p><strong>Triggered At:</strong> {{triggeredAt}}</p>
        <p><strong>Alert ID:</strong> {{alertId}}</p>
      `,
      isHtml: true,
      variables: ['alertId', 'ruleName', 'severity', 'message', 'currentValue', 'threshold', 'triggeredAt'],
      customFields: {}
    };

    this.templates.set('email_default', emailTemplate);
  }

  private startEvaluationTimer(): void {
    this.evaluationTimer = setInterval(() => {
      this.performPeriodicEvaluations();
    }, 60000);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredAlerts();
      this.cleanupOldHistory();
    }, 300000);
  }

  private async performPeriodicEvaluations(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (rule.type === 'missing_data') {
        await this.checkForMissingData(rule);
      }
    }
  }

  private async checkForMissingData(rule: AlertRule): Promise<void> {
    if (!rule.metricId) return;

    const lastValue = await this.getPreviousValue(rule.metricId);
    const expectedInterval = 300000;
    
    if (Date.now() - (lastValue || 0) > expectedInterval) {
      const evaluation: AlertEvaluation = {
        ruleId: rule.id,
        metricId: rule.metricId,
        timestamp: new Date(),
        conditions: [{
          conditionId: 'missing_data',
          isMet: true,
          actualValue: 0
        }],
        isTriggered: true,
        severity: rule.severity,
        context: { type: 'missing_data' }
      };

      const mockMetricValue = {
        id: 'missing',
        metricId: rule.metricId,
        tenantId: rule.tenantId,
        timestamp: new Date(),
        value: 0,
        dimensions: {},
        tags: {},
        aggregationPeriod: 'minute' as any,
        dataQuality: 0,
        source: 'alert_system',
        createdAt: new Date()
      };

      await this.handleTriggeredAlert(rule, evaluation, mockMetricValue);
    }
  }

  private cleanupExpiredAlerts(): void {
    const expirationTime = 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - expirationTime;

    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.triggeredAt.getTime() < cutoff && alert.status === 'resolved') {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  private cleanupOldHistory(): void {
    const retentionTime = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionTime;

    for (const [alertId, history] of this.alertHistory) {
      const filtered = history.filter(entry => entry.timestamp.getTime() >= cutoff);
      if (filtered.length !== history.length) {
        this.alertHistory.set(alertId, filtered);
      }
    }
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAlertRule(ruleId: string): AlertRule | null {
    return this.alertRules.get(ruleId) || null;
  }

  getAlertRules(tenantId?: string): AlertRule[] {
    let rules = Array.from(this.alertRules.values());
    if (tenantId) {
      rules = rules.filter(rule => rule.tenantId === tenantId);
    }
    return rules;
  }

  getActiveAlerts(tenantId?: string): MetricAlert[] {
    let alerts = Array.from(this.activeAlerts.values());
    if (tenantId) {
      alerts = alerts.filter(alert => alert.tenantId === tenantId);
    }
    return alerts;
  }

  getAlertStatistics(ruleId: string): AlertStatistics | null {
    return this.alertStatistics.get(ruleId) || null;
  }

  getAlertHistory(alertId: string): AlertHistory[] {
    return this.alertHistory.get(alertId) || [];
  }
}

class AnomalyDetector {
  private config: AnomalyDetectionConfig;
  private trainingData: number[] = [];

  constructor(config: AnomalyDetectionConfig) {
    this.config = config;
  }

  addTrainingData(value: number): void {
    this.trainingData.push(value);
    if (this.trainingData.length > 1000) {
      this.trainingData.shift();
    }
  }

  async isAnomaly(value: number): Promise<boolean> {
    if (this.trainingData.length < this.config.minimumDataPoints) {
      return false;
    }

    switch (this.config.algorithm) {
      case 'zscore':
        return this.zScoreDetection(value);
      case 'iqr':
        return this.iqrDetection(value);
      default:
        return false;
    }
  }

  private zScoreDetection(value: number): boolean {
    const mean = this.trainingData.reduce((sum, val) => sum + val, 0) / this.trainingData.length;
    const variance = this.trainingData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.trainingData.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return false;
    
    const zScore = Math.abs((value - mean) / stdDev);
    const threshold = this.getZScoreThreshold(this.config.sensitivity);
    
    return zScore > threshold;
  }

  private iqrDetection(value: number): boolean {
    const sorted = [...this.trainingData].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return value < lowerBound || value > upperBound;
  }

  private getZScoreThreshold(sensitivity: number): number {
    const thresholds = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
      0.999: 3.291
    };
    
    return thresholds[sensitivity as keyof typeof thresholds] || 2.0;
  }
}
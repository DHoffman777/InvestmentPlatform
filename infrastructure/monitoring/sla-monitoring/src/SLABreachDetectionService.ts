import { EventEmitter } from 'events';
import {
  SLADefinition,
  SLABreach,
  SLANotification,
  SLANotificationChannel,
  SLASeverity,
  SLAStatus,
  SLANotificationRule,
  SLAMetric,
  SLAMeasurementPoint
} from './SLADataModel';

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
  timeWindow: { start: Date; end: Date };
  affectedSLAs: string[];
  severity: SLASeverity;
}

export class SLABreachDetectionService extends EventEmitter {
  private breaches: Map<string, SLABreach> = new Map();
  private activeBreaches: Map<string, SLABreach[]> = new Map();
  private notificationProviders: Map<SLANotificationChannel, NotificationProvider> = new Map();
  private escalations: Map<string, BreachEscalation[]> = new Map();
  private detectionRules: Map<string, BreachDetectionRule[]> = new Map();
  private config: BreachDetectionConfig;
  private detectionInterval!: NodeJS.Timeout;
  private notificationQueues: Map<SLANotificationChannel, Array<{ notification: SLANotification; content: NotificationContent }>> = new Map();

  constructor(config: BreachDetectionConfig) {
    super();
    this.config = config;
    this.initializeNotificationProviders();
    this.startBreachDetection();
    this.startNotificationProcessing();
  }

  async detectBreaches(slaId: string, metric: SLAMetric): Promise<SLABreach[]> {
    const sla = await this.getSLA(slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    const detectedBreaches: SLABreach[] = [];
    const rules = this.detectionRules.get(slaId) || this.getDefaultDetectionRules(sla);

    for (const rule of rules) {
      if (!rule.isActive) continue;

      const breach = await this.evaluateRule(rule, sla, metric);
      if (breach) {
        detectedBreaches.push(breach);
      }
    }

    // Process detected breaches
    for (const breach of detectedBreaches) {
      await this.processBreach(breach, sla);
    }

    return detectedBreaches;
  }

  async processBreach(breach: SLABreach, sla: SLADefinition): Promise<any> {
    // Check if this is a new breach or continuation of existing one
    const existingBreach = await this.findExistingBreach(breach.slaId, breach.threshold);
    
    if (existingBreach && existingBreach.status === 'active') {
      // Update existing breach
      existingBreach.endTime = breach.endTime;
      existingBreach.duration = breach.endTime ? 
        breach.endTime.getTime() - existingBreach.startTime.getTime() : undefined;
      existingBreach.actualValue = breach.actualValue;
      existingBreach.impactValue = breach.impactValue;
    } else {
      // New breach
      this.breaches.set(breach.id, breach);
      
      // Add to active breaches
      const activeBreaches = this.activeBreaches.get(breach.slaId) || [];
      activeBreaches.push(breach);
      this.activeBreaches.set(breach.slaId, activeBreaches);

      this.emit('breachDetected', { breachId: breach.id, slaId: breach.slaId, breach });
    }

    // Send notifications
    await this.sendBreachNotifications(breach, sla);

    // Check for escalation
    if (this.config.enableAutoEscalation) {
      await this.checkEscalation(breach, sla);
    }

    // Analyze patterns
    await this.analyzeBreachPatterns(breach.slaId);
  }

  async acknowledgeBreachInternal(breachId: string, userId: string, comments?: string): Promise<any> {
    const breach = this.breaches.get(breachId);
    if (!breach) {
      throw new Error(`Breach ${breachId} not found`);
    }

    breach.status = 'acknowledged';
    breach.acknowledgedBy = userId;
    breach.acknowledgedAt = new Date();
    if (comments) {
      breach.metadata.acknowledgmentComments = comments;
    }

    this.emit('breachAcknowledged', { breachId, userId, comments });
  }

  async resolveBreach(breachId: string, userId: string, resolution: string): Promise<any> {
    const breach = this.breaches.get(breachId);
    if (!breach) {
      throw new Error(`Breach ${breachId} not found`);
    }

    breach.status = 'resolved';
    breach.resolvedBy = userId;
    breach.resolvedAt = new Date();
    breach.resolution = resolution;
    breach.endTime = new Date();
    breach.duration = breach.endTime.getTime() - breach.startTime.getTime();

    // Remove from active breaches
    const activeBreaches = this.activeBreaches.get(breach.slaId) || [];
    const updatedActiveBreaches = activeBreaches.filter(b => b.id !== breachId);
    this.activeBreaches.set(breach.slaId, updatedActiveBreaches);

    this.emit('breachResolved', { breachId, userId, resolution });

    // Send resolution notifications
    const sla = await this.getSLA(breach.slaId);
    if (sla) {
      await this.sendResolutionNotifications(breach, sla);
    }
  }

  async getActiveBreaches(slaId?: string): Promise<SLABreach[]> {
    if (slaId) {
      return this.activeBreaches.get(slaId) || [];
    }

    const allActiveBreaches: SLABreach[] = [];
    for (const breaches of this.activeBreaches.values()) {
      allActiveBreaches.push(...breaches);
    }
    return allActiveBreaches;
  }

  async getBreachHistory(
    slaId: string, 
    timeWindow: { start: Date; end: Date }
  ): Promise<SLABreach[]> {
    const allBreaches = Array.from(this.breaches.values());
    return allBreaches.filter(breach => 
      breach.slaId === slaId &&
      breach.startTime >= timeWindow.start &&
      breach.startTime <= timeWindow.end
    );
  }

  async getBreachStatistics(
    slaId?: string, 
    timeWindow?: { start: Date; end: Date }
  ): Promise<{
    totalBreaches: number;
    activeBreaches: number;
    resolvedBreaches: number;
    averageResolutionTime: number;
    breachesBySeverity: Record<SLASeverity, number>;
    breachesByThreshold: Record<string, number>;
    mostFrequentCauses: Array<{ cause: string; count: number }>;
  }> {
    let breaches = Array.from(this.breaches.values());
    
    if (slaId) {
      breaches = breaches.filter(b => b.slaId === slaId);
    }
    
    if (timeWindow) {
      breaches = breaches.filter(b => 
        b.startTime >= timeWindow.start && b.startTime <= timeWindow.end
      );
    }

    const totalBreaches = breaches.length;
    const activeBreaches = breaches.filter(b => b.status === 'active').length;
    const resolvedBreaches = breaches.filter(b => b.status === 'resolved').length;
    
    const resolvedWithDuration = breaches.filter(b => b.status === 'resolved' && b.duration);
    const averageResolutionTime = resolvedWithDuration.length > 0 ?
      resolvedWithDuration.reduce((sum, b) => sum + (b.duration || 0), 0) / resolvedWithDuration.length : 0;

    const breachesBySeverity = breaches.reduce((acc, breach) => {
      acc[breach.severity] = (acc[breach.severity] || 0) + 1;
      return acc;
    }, {} as Record<SLASeverity, number>);

    const breachesByThreshold = breaches.reduce((acc, breach) => {
      acc[breach.threshold] = (acc[breach.threshold] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const causeCount = breaches.reduce((acc, breach) => {
      if (breach.rootCause) {
        acc[breach.rootCause] = (acc[breach.rootCause] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentCauses = Object.entries(causeCount)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalBreaches,
      activeBreaches,
      resolvedBreaches,
      averageResolutionTime,
      breachesBySeverity,
      breachesByThreshold,
      mostFrequentCauses
    };
  }

  async analyzeBreachPatterns(slaId: string): Promise<BreachPattern[]> {
    const recentWindow = {
      start: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)), // 7 days
      end: new Date()
    };

    const recentBreaches = await this.getBreachHistory(slaId, recentWindow);
    const patterns: BreachPattern[] = [];

    // Detect frequent breaches
    if (recentBreaches.length >= 5) {
      patterns.push({
        type: 'frequent',
        description: `${recentBreaches.length} breaches in the last 7 days`,
        frequency: recentBreaches.length,
        timeWindow: recentWindow,
        affectedSLAs: [slaId],
        severity: this.calculatePatternSeverity(recentBreaches)
      });
    }

    // Detect recurring patterns (similar time intervals)
    const intervals = this.calculateBreachIntervals(recentBreaches);
    const recurringInterval = this.findRecurringInterval(intervals);
    if (recurringInterval) {
      patterns.push({
        type: 'recurring',
        description: `Breaches recurring approximately every ${Math.round(recurringInterval / (60 * 60 * 1000))} hours`,
        frequency: intervals.length,
        timeWindow: recentWindow,
        affectedSLAs: [slaId],
        severity: this.calculatePatternSeverity(recentBreaches)
      });
    }

    // Detect persistent breaches (long duration)
    const persistentBreaches = recentBreaches.filter(b => 
      b.duration && b.duration > 3600000 // > 1 hour
    );
    if (persistentBreaches.length > 0) {
      patterns.push({
        type: 'persistent',
        description: `${persistentBreaches.length} breaches with duration > 1 hour`,
        frequency: persistentBreaches.length,
        timeWindow: recentWindow,
        affectedSLAs: [slaId],
        severity: SLASeverity.HIGH
      });
    }

    // Store patterns for further analysis
    for (const pattern of patterns) {
      this.emit('patternDetected', { slaId, pattern });
    }

    return patterns;
  }

  private async evaluateRule(
    rule: BreachDetectionRule, 
    sla: SLADefinition, 
    metric: SLAMetric
  ): Promise<SLABreach | null> {
    const thresholdValue = sla.thresholds[rule.threshold];
    const currentValue = metric.currentValue;
    
    // Check if threshold is breached
    const isBreached = this.isThresholdBreached(currentValue, thresholdValue, sla, rule.threshold);
    
    if (!isBreached) {
      return null;
    }

    // Check consecutive failures if required
    if (rule.consecutiveFailures > 1) {
      const recentMeasurements = metric.measurements
        .slice(-rule.consecutiveFailures)
        .every(m => this.isThresholdBreached(m.value, thresholdValue, sla, rule.threshold));
      
      if (!recentMeasurements) {
        return null;
      }
    }

    // Create breach
    const breach: SLABreach = {
      id: this.generateBreachId(),
      slaId: sla.id,
      threshold: rule.threshold,
      severity: this.determineSeverity(rule.threshold, sla),
      startTime: new Date(),
      actualValue: currentValue,
      targetValue: thresholdValue,
      impactValue: this.calculateImpact(currentValue, thresholdValue, sla),
      status: 'active',
      notifications: [],
      penalties: [],
      metadata: {
        ruleId: rule.id,
        detectionTime: new Date(),
        metric: metric
      }
    };

    return breach;
  }

  private isThresholdBreached(
    currentValue: number, 
    thresholdValue: number, 
    sla: SLADefinition, 
    threshold: keyof SLADefinition['thresholds']
  ): boolean {
    // For availability, uptime, success rates (higher is better)
    if (['availability', 'uptime', 'transaction_success_rate'].includes(sla.metricType)) {
      return currentValue < thresholdValue;
    }
    
    // For response time, error rate (lower is better)
    if (['response_time', 'error_rate'].includes(sla.metricType)) {
      return currentValue > thresholdValue;
    }
    
    // Default: lower is better
    return currentValue > thresholdValue;
  }

  private determineSeverity(threshold: keyof SLADefinition['thresholds'], sla: SLADefinition): SLASeverity {
    switch (threshold) {
      case 'critical':
        return SLASeverity.CRITICAL;
      case 'escalation':
        return SLASeverity.HIGH;
      case 'warning':
        return SLASeverity.MEDIUM;
      default:
        return SLASeverity.LOW;
    }
  }

  private calculateImpact(currentValue: number, thresholdValue: number, sla: SLADefinition): number {
    const deviation = Math.abs(currentValue - thresholdValue);
    const relativeImpact = deviation / thresholdValue;
    return Math.round(relativeImpact * 100); // Return as percentage
  }

  private async sendBreachNotifications(breach: SLABreach, sla: SLADefinition): Promise<any> {
    const notificationRules = sla.notifications.filter(rule => 
      rule.isActive && 
      rule.triggerCondition.event === 'threshold_breach' &&
      (!rule.triggerCondition.severity || rule.triggerCondition.severity === breach.severity) &&
      (!rule.triggerCondition.threshold || rule.triggerCondition.threshold === breach.threshold)
    );

    for (const rule of notificationRules) {
      for (const channel of rule.channels) {
        const notification: SLANotification = {
          id: this.generateNotificationId(),
          breachId: breach.id,
          channel,
          recipient: rule.recipients.join(','),
          sentAt: new Date(),
          status: 'pending',
          retryCount: 0
        };

        const content: NotificationContent = {
          subject: `SLA Breach Alert: ${sla.name}`,
          message: this.buildBreachMessage(breach, sla),
          urgency: this.mapSeverityToUrgency(breach.severity),
          metadata: {
            slaId: sla.id,
            breachId: breach.id,
            threshold: breach.threshold,
            actualValue: breach.actualValue,
            targetValue: breach.targetValue
          }
        };

        await this.queueNotification(channel, notification, content);
        breach.notifications.push(notification);
      }
    }
  }

  private async sendResolutionNotifications(breach: SLABreach, sla: SLADefinition): Promise<any> {
    const notificationRules = sla.notifications.filter(rule => 
      rule.isActive && rule.triggerCondition.event === 'recovery'
    );

    for (const rule of notificationRules) {
      for (const channel of rule.channels) {
        const notification: SLANotification = {
          id: this.generateNotificationId(),
          breachId: breach.id,
          channel,
          recipient: rule.recipients.join(','),
          sentAt: new Date(),
          status: 'pending',
          retryCount: 0
        };

        const content: NotificationContent = {
          subject: `SLA Breach Resolved: ${sla.name}`,
          message: this.buildResolutionMessage(breach, sla),
          urgency: 'medium',
          metadata: {
            slaId: sla.id,
            breachId: breach.id,
            resolutionTime: breach.duration,
            resolvedBy: breach.resolvedBy
          }
        };

        await this.queueNotification(channel, notification, content);
      }
    }
  }

  private buildBreachMessage(breach: SLABreach, sla: SLADefinition): string {
    return `
SLA Breach Alert

Service: ${sla.serviceName}
SLA: ${sla.name}
Severity: ${breach.severity.toUpperCase()}
Threshold: ${breach.threshold}
Current Value: ${breach.actualValue} ${sla.unit}
Target Value: ${breach.targetValue} ${sla.unit}
Impact: ${breach.impactValue}%
Started: ${breach.startTime.toISOString()}

Please investigate and take appropriate action.
    `.trim();
  }

  private buildResolutionMessage(breach: SLABreach, sla: SLADefinition): string {
    const duration = breach.duration ? Math.round(breach.duration / (60 * 1000)) : 0;
    return `
SLA Breach Resolved

Service: ${sla.serviceName}
SLA: ${sla.name}
Duration: ${duration} minutes
Resolved by: ${breach.resolvedBy}
Resolution: ${breach.resolution}

The SLA is now back within acceptable limits.
    `.trim();
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

  private async queueNotification(
    channel: SLANotificationChannel, 
    notification: SLANotification, 
    content: NotificationContent
  ): Promise<any> {
    const queue = this.notificationQueues.get(channel) || [];
    queue.push({ notification, content });
    this.notificationQueues.set(channel, queue);
  }

  private async checkEscalation(breach: SLABreach, sla: SLADefinition): Promise<any> {
    const escalationTimeout = this.config.escalationTimeouts[breach.severity];
    const breachAge = Date.now() - breach.startTime.getTime();
    
    if (breachAge > escalationTimeout && breach.status === 'active') {
      const existingEscalations = this.escalations.get(breach.id) || [];
      const nextLevel = existingEscalations.length + 1;
      
      const escalation: BreachEscalation = {
        breachId: breach.id,
        level: nextLevel,
        escalatedAt: new Date(),
        escalatedTo: this.getEscalationRecipients(sla, nextLevel),
        reason: `Breach unresolved after ${Math.round(breachAge / (60 * 1000))} minutes`,
        autoEscalated: true
      };

      existingEscalations.push(escalation);
      this.escalations.set(breach.id, existingEscalations);
      
      this.emit('breachEscalated', { breachId: breach.id, escalation });
    }
  }

  private getEscalationRecipients(sla: SLADefinition, level: number): string[] {
    // This would typically come from escalation configuration
    // For now, return mock recipients based on level
    switch (level) {
      case 1:
        return ['team-lead@company.com'];
      case 2:
        return ['manager@company.com'];
      case 3:
        return ['director@company.com'];
      default:
        return ['cto@company.com'];
    }
  }

  private calculateBreachIntervals(breaches: SLABreach[]): number[] {
    if (breaches.length < 2) return [];
    
    const sortedBreaches = breaches.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const intervals: number[] = [];
    
    for (let i = 1; i < sortedBreaches.length; i++) {
      const interval = sortedBreaches[i].startTime.getTime() - sortedBreaches[i-1].startTime.getTime();
      intervals.push(interval);
    }
    
    return intervals;
  }

  private findRecurringInterval(intervals: number[]): number | null {
    if (intervals.length < 3) return null;
    
    const tolerance = 0.2; // 20% tolerance
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    const withinTolerance = intervals.filter(interval => {
      const deviation = Math.abs(interval - avgInterval) / avgInterval;
      return deviation <= tolerance;
    });
    
    return withinTolerance.length >= intervals.length * 0.7 ? avgInterval : null;
  }

  private calculatePatternSeverity(breaches: SLABreach[]): SLASeverity {
    const severityCounts = breaches.reduce((acc, breach) => {
      acc[breach.severity] = (acc[breach.severity] || 0) + 1;
      return acc;
    }, {} as Record<SLASeverity, number>);

    if (severityCounts[SLASeverity.CRITICAL] > 0) return SLASeverity.CRITICAL;
    if (severityCounts[SLASeverity.HIGH] > 0) return SLASeverity.HIGH;
    if (severityCounts[SLASeverity.MEDIUM] > 0) return SLASeverity.MEDIUM;
    return SLASeverity.LOW;
  }

  private getDefaultDetectionRules(sla: SLADefinition): BreachDetectionRule[] {
    const rules: BreachDetectionRule[] = [];
    
    Object.keys(sla.thresholds).forEach(threshold => {
      rules.push({
        id: `${sla.id}_${threshold}_rule`,
        slaId: sla.id,
        threshold: threshold as keyof SLADefinition['thresholds'],
        consecutiveFailures: threshold === 'target' ? 1 : 2,
        evaluationWindow: 300000, // 5 minutes
        isActive: true
      });
    });
    
    return rules;
  }

  private async findExistingBreach(slaId: string, threshold: keyof SLADefinition['thresholds']): Promise<SLABreach | null> {
    const activeBreaches = this.activeBreaches.get(slaId) || [];
    return activeBreaches.find(breach => 
      breach.threshold === threshold && breach.status === 'active'
    ) || null;
  }

  private startBreachDetection(): void {
    this.detectionInterval = setInterval(async () => {
      // This would typically be triggered by metric updates
      // For now, it's a placeholder for periodic checks
    }, this.config.checkInterval);
  }

  private startNotificationProcessing(): void {
    setInterval(async () => {
      for (const [channel, queue] of this.notificationQueues) {
        if (queue.length > 0) {
          const { notification, content } = queue.shift()!;
          await this.processNotification(channel, notification, content);
        }
      }
    }, 1000);
  }

  private async processNotification(
    channel: SLANotificationChannel, 
    notification: SLANotification, 
    content: NotificationContent
  ): Promise<any> {
    const provider = this.notificationProviders.get(channel);
    if (!provider) {
      notification.status = 'failed';
      notification.error = `No provider configured for channel ${channel}`;
      return;
    }

    try {
      const success = await provider.send(notification, content);
      notification.status = success ? 'sent' : 'failed';
      if (success) {
        this.emit('notificationSent', { notificationId: notification.id, channel });
      }
    } catch (error: any) {
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : 'Unknown error';
      notification.retryCount++;
      
      if (notification.retryCount < this.config.notificationRetryAttempts) {
        // Re-queue for retry
        setTimeout(() => {
          this.queueNotification(channel, notification, content);
        }, this.config.notificationRetryDelay);
      }
    }
  }

  private initializeNotificationProviders(): void {
    // Initialize notification providers
    this.notificationProviders.set(SLANotificationChannel.EMAIL, new EmailNotificationProvider());
    this.notificationProviders.set(SLANotificationChannel.SLACK, new SlackNotificationProvider());
    this.notificationProviders.set(SLANotificationChannel.WEBHOOK, new WebhookNotificationProvider());
  }

  private async getSLA(slaId: string): Promise<SLADefinition | null> {
    // This would typically query the SLA repository
    // For now, return null as placeholder
    return null;
  }

  private generateBreachId(): string {
    return `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<any> {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    
    this.breaches.clear();
    this.activeBreaches.clear();
    this.escalations.clear();
    this.notificationQueues.clear();
    
    this.emit('shutdown');
  }
}

// Notification Provider Implementations
class EmailNotificationProvider implements NotificationProvider {
  channel = SLANotificationChannel.EMAIL;

  async send(notification: SLANotification, content: NotificationContent): Promise<boolean> {
    console.log(`Sending email notification to ${notification.recipient}: ${content.subject}`);
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

class SlackNotificationProvider implements NotificationProvider {
  channel = SLANotificationChannel.SLACK;

  async send(notification: SLANotification, content: NotificationContent): Promise<boolean> {
    console.log(`Sending Slack notification to ${notification.recipient}: ${content.message}`);
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

class WebhookNotificationProvider implements NotificationProvider {
  channel = SLANotificationChannel.WEBHOOK;

  async send(notification: SLANotification, content: NotificationContent): Promise<boolean> {
    console.log(`Sending webhook notification to ${notification.recipient}`);
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}


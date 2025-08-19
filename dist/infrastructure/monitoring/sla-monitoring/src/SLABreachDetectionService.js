"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLABreachDetectionService = void 0;
const events_1 = require("events");
const SLADataModel_1 = require("./SLADataModel");
class SLABreachDetectionService extends events_1.EventEmitter {
    breaches = new Map();
    activeBreaches = new Map();
    notificationProviders = new Map();
    escalations = new Map();
    detectionRules = new Map();
    config;
    detectionInterval;
    notificationQueues = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeNotificationProviders();
        this.startBreachDetection();
        this.startNotificationProcessing();
    }
    async detectBreaches(slaId, metric) {
        const sla = await this.getSLA(slaId);
        if (!sla) {
            throw new Error(`SLA ${slaId} not found`);
        }
        const detectedBreaches = [];
        const rules = this.detectionRules.get(slaId) || this.getDefaultDetectionRules(sla);
        for (const rule of rules) {
            if (!rule.isActive)
                continue;
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
    async processBreach(breach, sla) {
        // Check if this is a new breach or continuation of existing one
        const existingBreach = await this.findExistingBreach(breach.slaId, breach.threshold);
        if (existingBreach && existingBreach.status === 'active') {
            // Update existing breach
            existingBreach.endTime = breach.endTime;
            existingBreach.duration = breach.endTime ?
                breach.endTime.getTime() - existingBreach.startTime.getTime() : undefined;
            existingBreach.actualValue = breach.actualValue;
            existingBreach.impactValue = breach.impactValue;
        }
        else {
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
    async acknowledgeBreachInternal(breachId, userId, comments) {
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
    async resolveBreach(breachId, userId, resolution) {
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
    async getActiveBreaches(slaId) {
        if (slaId) {
            return this.activeBreaches.get(slaId) || [];
        }
        const allActiveBreaches = [];
        for (const breaches of this.activeBreaches.values()) {
            allActiveBreaches.push(...breaches);
        }
        return allActiveBreaches;
    }
    async getBreachHistory(slaId, timeWindow) {
        const allBreaches = Array.from(this.breaches.values());
        return allBreaches.filter(breach => breach.slaId === slaId &&
            breach.startTime >= timeWindow.start &&
            breach.startTime <= timeWindow.end);
    }
    async getBreachStatistics(slaId, timeWindow) {
        let breaches = Array.from(this.breaches.values());
        if (slaId) {
            breaches = breaches.filter(b => b.slaId === slaId);
        }
        if (timeWindow) {
            breaches = breaches.filter(b => b.startTime >= timeWindow.start && b.startTime <= timeWindow.end);
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
        }, {});
        const breachesByThreshold = breaches.reduce((acc, breach) => {
            acc[breach.threshold] = (acc[breach.threshold] || 0) + 1;
            return acc;
        }, {});
        const causeCount = breaches.reduce((acc, breach) => {
            if (breach.rootCause) {
                acc[breach.rootCause] = (acc[breach.rootCause] || 0) + 1;
            }
            return acc;
        }, {});
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
    async analyzeBreachPatterns(slaId) {
        const recentWindow = {
            start: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)), // 7 days
            end: new Date()
        };
        const recentBreaches = await this.getBreachHistory(slaId, recentWindow);
        const patterns = [];
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
        const persistentBreaches = recentBreaches.filter(b => b.duration && b.duration > 3600000 // > 1 hour
        );
        if (persistentBreaches.length > 0) {
            patterns.push({
                type: 'persistent',
                description: `${persistentBreaches.length} breaches with duration > 1 hour`,
                frequency: persistentBreaches.length,
                timeWindow: recentWindow,
                affectedSLAs: [slaId],
                severity: SLADataModel_1.SLASeverity.HIGH
            });
        }
        // Store patterns for further analysis
        for (const pattern of patterns) {
            this.emit('patternDetected', { slaId, pattern });
        }
        return patterns;
    }
    async evaluateRule(rule, sla, metric) {
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
        const breach = {
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
    isThresholdBreached(currentValue, thresholdValue, sla, threshold) {
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
    determineSeverity(threshold, sla) {
        switch (threshold) {
            case 'critical':
                return SLADataModel_1.SLASeverity.CRITICAL;
            case 'escalation':
                return SLADataModel_1.SLASeverity.HIGH;
            case 'warning':
                return SLADataModel_1.SLASeverity.MEDIUM;
            default:
                return SLADataModel_1.SLASeverity.LOW;
        }
    }
    calculateImpact(currentValue, thresholdValue, sla) {
        const deviation = Math.abs(currentValue - thresholdValue);
        const relativeImpact = deviation / thresholdValue;
        return Math.round(relativeImpact * 100); // Return as percentage
    }
    async sendBreachNotifications(breach, sla) {
        const notificationRules = sla.notifications.filter(rule => rule.isActive &&
            rule.triggerCondition.event === 'threshold_breach' &&
            (!rule.triggerCondition.severity || rule.triggerCondition.severity === breach.severity) &&
            (!rule.triggerCondition.threshold || rule.triggerCondition.threshold === breach.threshold));
        for (const rule of notificationRules) {
            for (const channel of rule.channels) {
                const notification = {
                    id: this.generateNotificationId(),
                    breachId: breach.id,
                    channel,
                    recipient: rule.recipients.join(','),
                    sentAt: new Date(),
                    status: 'pending',
                    retryCount: 0
                };
                const content = {
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
    async sendResolutionNotifications(breach, sla) {
        const notificationRules = sla.notifications.filter(rule => rule.isActive && rule.triggerCondition.event === 'recovery');
        for (const rule of notificationRules) {
            for (const channel of rule.channels) {
                const notification = {
                    id: this.generateNotificationId(),
                    breachId: breach.id,
                    channel,
                    recipient: rule.recipients.join(','),
                    sentAt: new Date(),
                    status: 'pending',
                    retryCount: 0
                };
                const content = {
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
    buildBreachMessage(breach, sla) {
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
    buildResolutionMessage(breach, sla) {
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
    mapSeverityToUrgency(severity) {
        switch (severity) {
            case SLADataModel_1.SLASeverity.CRITICAL:
                return 'critical';
            case SLADataModel_1.SLASeverity.HIGH:
                return 'high';
            case SLADataModel_1.SLASeverity.MEDIUM:
                return 'medium';
            default:
                return 'low';
        }
    }
    async queueNotification(channel, notification, content) {
        const queue = this.notificationQueues.get(channel) || [];
        queue.push({ notification, content });
        this.notificationQueues.set(channel, queue);
    }
    async checkEscalation(breach, sla) {
        const escalationTimeout = this.config.escalationTimeouts[breach.severity];
        const breachAge = Date.now() - breach.startTime.getTime();
        if (breachAge > escalationTimeout && breach.status === 'active') {
            const existingEscalations = this.escalations.get(breach.id) || [];
            const nextLevel = existingEscalations.length + 1;
            const escalation = {
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
    getEscalationRecipients(sla, level) {
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
    calculateBreachIntervals(breaches) {
        if (breaches.length < 2)
            return [];
        const sortedBreaches = breaches.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const intervals = [];
        for (let i = 1; i < sortedBreaches.length; i++) {
            const interval = sortedBreaches[i].startTime.getTime() - sortedBreaches[i - 1].startTime.getTime();
            intervals.push(interval);
        }
        return intervals;
    }
    findRecurringInterval(intervals) {
        if (intervals.length < 3)
            return null;
        const tolerance = 0.2; // 20% tolerance
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const withinTolerance = intervals.filter(interval => {
            const deviation = Math.abs(interval - avgInterval) / avgInterval;
            return deviation <= tolerance;
        });
        return withinTolerance.length >= intervals.length * 0.7 ? avgInterval : null;
    }
    calculatePatternSeverity(breaches) {
        const severityCounts = breaches.reduce((acc, breach) => {
            acc[breach.severity] = (acc[breach.severity] || 0) + 1;
            return acc;
        }, {});
        if (severityCounts[SLADataModel_1.SLASeverity.CRITICAL] > 0)
            return SLADataModel_1.SLASeverity.CRITICAL;
        if (severityCounts[SLADataModel_1.SLASeverity.HIGH] > 0)
            return SLADataModel_1.SLASeverity.HIGH;
        if (severityCounts[SLADataModel_1.SLASeverity.MEDIUM] > 0)
            return SLADataModel_1.SLASeverity.MEDIUM;
        return SLADataModel_1.SLASeverity.LOW;
    }
    getDefaultDetectionRules(sla) {
        const rules = [];
        Object.keys(sla.thresholds).forEach(threshold => {
            rules.push({
                id: `${sla.id}_${threshold}_rule`,
                slaId: sla.id,
                threshold: threshold,
                consecutiveFailures: threshold === 'target' ? 1 : 2,
                evaluationWindow: 300000, // 5 minutes
                isActive: true
            });
        });
        return rules;
    }
    async findExistingBreach(slaId, threshold) {
        const activeBreaches = this.activeBreaches.get(slaId) || [];
        return activeBreaches.find(breach => breach.threshold === threshold && breach.status === 'active') || null;
    }
    startBreachDetection() {
        this.detectionInterval = setInterval(async () => {
            // This would typically be triggered by metric updates
            // For now, it's a placeholder for periodic checks
        }, this.config.checkInterval);
    }
    startNotificationProcessing() {
        setInterval(async () => {
            for (const [channel, queue] of this.notificationQueues) {
                if (queue.length > 0) {
                    const { notification, content } = queue.shift();
                    await this.processNotification(channel, notification, content);
                }
            }
        }, 1000);
    }
    async processNotification(channel, notification, content) {
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
        }
        catch (error) {
            notification.status = 'failed';
            notification.error = error.message;
            notification.retryCount++;
            if (notification.retryCount < this.config.notificationRetryAttempts) {
                // Re-queue for retry
                setTimeout(() => {
                    this.queueNotification(channel, notification, content);
                }, this.config.notificationRetryDelay);
            }
        }
    }
    initializeNotificationProviders() {
        // Initialize notification providers
        this.notificationProviders.set(SLADataModel_1.SLANotificationChannel.EMAIL, new EmailNotificationProvider());
        this.notificationProviders.set(SLADataModel_1.SLANotificationChannel.SLACK, new SlackNotificationProvider());
        this.notificationProviders.set(SLADataModel_1.SLANotificationChannel.WEBHOOK, new WebhookNotificationProvider());
    }
    async getSLA(slaId) {
        // This would typically query the SLA repository
        // For now, return null as placeholder
        return null;
    }
    generateBreachId() {
        return `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
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
exports.SLABreachDetectionService = SLABreachDetectionService;
// Notification Provider Implementations
class EmailNotificationProvider {
    channel = SLADataModel_1.SLANotificationChannel.EMAIL;
    async send(notification, content) {
        console.log(`Sending email notification to ${notification.recipient}: ${content.subject}`);
        return true;
    }
    async isAvailable() {
        return true;
    }
}
class SlackNotificationProvider {
    channel = SLADataModel_1.SLANotificationChannel.SLACK;
    async send(notification, content) {
        console.log(`Sending Slack notification to ${notification.recipient}: ${content.message}`);
        return true;
    }
    async isAvailable() {
        return true;
    }
}
class WebhookNotificationProvider {
    channel = SLADataModel_1.SLANotificationChannel.WEBHOOK;
    async send(notification, content) {
        console.log(`Sending webhook notification to ${notification.recipient}`);
        return true;
    }
    async isAvailable() {
        return true;
    }
}

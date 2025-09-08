"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalingThresholdMonitor = void 0;
const events_1 = require("events");
const CapacityPlanningDataModel_1 = require("./CapacityPlanningDataModel");
class ScalingThresholdMonitor extends events_1.EventEmitter {
    thresholds = new Map();
    activeAlerts = new Map();
    thresholdStates = new Map();
    evaluationTimer;
    config;
    scalingExecutor;
    alertManager;
    constructor(config) {
        super();
        this.config = config;
        this.scalingExecutor = new ScalingExecutor();
        this.alertManager = new AlertManager(config.notificationChannels);
        this.initializeDefaultThresholds();
        this.startMonitoring();
    }
    async createThreshold(thresholdConfig) {
        const threshold = {
            id: thresholdConfig.id || this.generateThresholdId(),
            resourceId: thresholdConfig.resourceId,
            resourceType: thresholdConfig.resourceType,
            metric: thresholdConfig.metric,
            thresholds: thresholdConfig.thresholds || this.getDefaultThresholdValues(),
            scalingPolicy: thresholdConfig.scalingPolicy || this.getDefaultScalingPolicy(),
            isActive: thresholdConfig.isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.validateThreshold(threshold);
        this.thresholds.set(threshold.id, threshold);
        this.initializeThresholdState(threshold.id);
        this.emit('thresholdCreated', { thresholdId: threshold.id, resourceId: threshold.resourceId });
        return threshold;
    }
    async updateThreshold(thresholdId, updates) {
        const threshold = this.thresholds.get(thresholdId);
        if (!threshold) {
            throw new Error(`Threshold ${thresholdId} not found`);
        }
        const updatedThreshold = { ...threshold, ...updates, updatedAt: new Date() };
        await this.validateThreshold(updatedThreshold);
        this.thresholds.set(thresholdId, updatedThreshold);
        this.emit('thresholdUpdated', { thresholdId, changes: Object.keys(updates) });
        return updatedThreshold;
    }
    async evaluateThresholds(metrics) {
        const evaluations = [];
        const resourceGroups = this.groupMetricsByResource(metrics);
        for (const [resourceId, resourceMetrics] of resourceGroups) {
            const resourceThresholds = this.getThresholdsForResource(resourceId);
            for (const threshold of resourceThresholds) {
                if (!threshold.isActive)
                    continue;
                const latestMetrics = this.getLatestMetrics(resourceMetrics);
                const evaluation = await this.evaluateThreshold(threshold, latestMetrics, resourceMetrics);
                evaluations.push(evaluation);
                await this.processEvaluation(evaluation, threshold);
            }
        }
        return evaluations;
    }
    async evaluateThreshold(threshold, latestMetrics, historicalMetrics) {
        const currentValue = this.extractMetricValue(latestMetrics, threshold.metric);
        const state = this.thresholdStates.get(threshold.id);
        const scaleUpTriggered = this.evaluateCondition(currentValue, threshold.thresholds.scaleUp.value, threshold.thresholds.scaleUp.operator);
        const scaleDownTriggered = this.evaluateCondition(currentValue, threshold.thresholds.scaleDown.value, threshold.thresholds.scaleDown.operator);
        let isTriggered = false;
        let duration = 0;
        if (scaleUpTriggered) {
            if (state.scaleUpStartTime) {
                duration = Date.now() - state.scaleUpStartTime.getTime();
                isTriggered = duration >= threshold.thresholds.scaleUp.duration;
            }
            else {
                state.scaleUpStartTime = new Date();
            }
            state.scaleDownStartTime = null;
        }
        else if (scaleDownTriggered) {
            if (state.scaleDownStartTime) {
                duration = Date.now() - state.scaleDownStartTime.getTime();
                isTriggered = duration >= threshold.thresholds.scaleDown.duration;
            }
            else {
                state.scaleDownStartTime = new Date();
            }
            state.scaleUpStartTime = null;
        }
        else {
            state.scaleUpStartTime = null;
            state.scaleDownStartTime = null;
        }
        const confidence = this.calculateConfidence(currentValue, historicalMetrics, threshold);
        return {
            thresholdId: threshold.id,
            resourceId: threshold.resourceId,
            metric: threshold.metric,
            currentValue,
            thresholdValue: scaleUpTriggered ? threshold.thresholds.scaleUp.value : threshold.thresholds.scaleDown.value,
            operator: scaleUpTriggered ? threshold.thresholds.scaleUp.operator : threshold.thresholds.scaleDown.operator,
            isTriggered,
            duration,
            confidence,
            evaluatedAt: new Date()
        };
    }
    async processEvaluation(evaluation, threshold) {
        if (!evaluation.isTriggered) {
            return;
        }
        const existingAlert = this.findActiveAlertForResource(evaluation.resourceId, evaluation.metric);
        if (existingAlert && this.isInCooldownPeriod(existingAlert, threshold)) {
            return;
        }
        const alert = await this.createAlert(evaluation, threshold);
        await this.processAlert(alert, threshold);
    }
    async createAlert(evaluation, threshold) {
        const alertType = this.determineAlertType(evaluation);
        const severity = this.calculateAlertSeverity(evaluation, threshold);
        const alert = {
            id: this.generateAlertId(),
            resourceId: evaluation.resourceId,
            type: alertType,
            severity,
            title: this.generateAlertTitle(evaluation, threshold),
            description: this.generateAlertDescription(evaluation, threshold),
            conditions: [{
                    metric: evaluation.metric,
                    operator: evaluation.operator,
                    value: evaluation.thresholdValue,
                    duration: evaluation.duration,
                    aggregation: 'avg'
                }],
            triggers: [{
                    type: 'immediate'
                }],
            actions: this.getAlertActions(severity, threshold),
            status: CapacityPlanningDataModel_1.AlertStatus.ACTIVE,
            createdAt: new Date(),
            triggeredAt: new Date(),
            escalationLevel: 0
        };
        this.activeAlerts.set(alert.id, alert);
        this.emit('alertCreated', { alertId: alert.id, resourceId: evaluation.resourceId, severity });
        return alert;
    }
    async processAlert(alert, threshold) {
        await this.alertManager.sendNotifications(alert);
        if (this.config.enableAutoScaling && this.shouldAutoScale(alert, threshold)) {
            const scalingDecision = await this.makeScalingDecision(alert, threshold);
            if (scalingDecision.action !== 'no_action') {
                await this.executeScaling(scalingDecision);
            }
        }
        this.scheduleEscalation(alert, threshold);
    }
    async makeScalingDecision(alert, threshold) {
        const resourceMetrics = await this.getRecentMetrics(alert.resourceId, 60);
        const currentCapacity = await this.getCurrentCapacity(alert.resourceId);
        const targetCapacity = this.calculateTargetCapacity(alert, threshold, currentCapacity);
        const action = this.determineScalingAction(alert, currentCapacity, targetCapacity);
        const executionPlan = this.buildExecutionPlan(action, threshold, currentCapacity, targetCapacity);
        const rollbackPlan = this.buildRollbackPlan(action, currentCapacity);
        const decision = {
            resourceId: alert.resourceId,
            action,
            reasoning: this.generateScalingReasoning(alert, threshold, resourceMetrics),
            impact: {
                currentCapacity,
                targetCapacity,
                estimatedCost: this.estimateScalingCost(currentCapacity, targetCapacity),
                performanceImpact: this.estimatePerformanceImpact(action, currentCapacity, targetCapacity)
            },
            confidence: this.calculateScalingConfidence(resourceMetrics, threshold),
            executionPlan,
            rollbackPlan,
            decidedAt: new Date()
        };
        this.emit('scalingDecisionMade', {
            resourceId: alert.resourceId,
            action,
            confidence: decision.confidence
        });
        return decision;
    }
    async executeScaling(decision) {
        if (decision.confidence < 0.7) {
            this.emit('scalingSkipped', {
                resourceId: decision.resourceId,
                reason: 'Low confidence',
                confidence: decision.confidence
            });
            return;
        }
        try {
            await this.scalingExecutor.execute(decision);
            this.emit('scalingExecuted', {
                resourceId: decision.resourceId,
                action: decision.action,
                targetCapacity: decision.impact.targetCapacity
            });
        }
        catch (error) {
            this.emit('scalingFailed', {
                resourceId: decision.resourceId,
                action: decision.action,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            try {
                await this.scalingExecutor.rollback(decision);
            }
            catch (rollbackError) {
                this.emit('rollbackFailed', {
                    resourceId: decision.resourceId,
                    error: rollbackError.message
                });
            }
        }
    }
    scheduleEscalation(alert, threshold) {
        const escalationRules = this.config.escalationRules.filter(rule => rule.escalationLevel > alert.escalationLevel);
        if (escalationRules.length === 0)
            return;
        const nextEscalation = escalationRules[0];
        setTimeout(async () => {
            const currentAlert = this.activeAlerts.get(alert.id);
            if (currentAlert && currentAlert.status === CapacityPlanningDataModel_1.AlertStatus.ACTIVE) {
                currentAlert.escalationLevel = nextEscalation.escalationLevel;
                for (const action of nextEscalation.actions) {
                    await this.alertManager.executeAction(action, currentAlert);
                }
                this.emit('alertEscalated', {
                    alertId: alert.id,
                    escalationLevel: nextEscalation.escalationLevel
                });
                this.scheduleEscalation(currentAlert, threshold);
            }
        }, nextEscalation.timeToEscalate);
    }
    async acknowledgeAlert(alertId, userId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert ${alertId} not found`);
        }
        alert.status = CapacityPlanningDataModel_1.AlertStatus.ACKNOWLEDGED;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = userId;
        this.emit('alertAcknowledged', { alertId, userId });
    }
    async resolveAlert(alertId, resolution) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert ${alertId} not found`);
        }
        alert.status = CapacityPlanningDataModel_1.AlertStatus.RESOLVED;
        alert.resolvedAt = new Date();
        this.activeAlerts.delete(alertId);
        this.emit('alertResolved', { alertId, resolution });
    }
    async suppressAlert(alertId, duration) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert ${alertId} not found`);
        }
        alert.status = CapacityPlanningDataModel_1.AlertStatus.SUPPRESSED;
        alert.suppressedUntil = new Date(Date.now() + duration);
        this.emit('alertSuppressed', { alertId, duration });
    }
    async getThresholds(resourceId, resourceType) {
        let thresholds = Array.from(this.thresholds.values());
        if (resourceId) {
            thresholds = thresholds.filter(t => t.resourceId === resourceId);
        }
        if (resourceType) {
            thresholds = thresholds.filter(t => t.resourceType === resourceType);
        }
        return thresholds;
    }
    async getActiveAlerts(resourceId) {
        let alerts = Array.from(this.activeAlerts.values());
        if (resourceId) {
            alerts = alerts.filter(a => a.resourceId === resourceId);
        }
        return alerts.filter(a => a.status === CapacityPlanningDataModel_1.AlertStatus.ACTIVE);
    }
    async getThresholdMetrics() {
        const totalThresholds = this.thresholds.size;
        const activeThresholds = Array.from(this.thresholds.values()).filter(t => t.isActive).length;
        const triggeredThresholds = Array.from(this.thresholdStates.values()).filter(s => s.scaleUpStartTime || s.scaleDownStartTime).length;
        return {
            totalThresholds,
            activeThresholds,
            triggeredThresholds,
            averageResponseTime: 5000,
            falsePositiveRate: 0.05
        };
    }
    evaluateCondition(currentValue, thresholdValue, operator) {
        switch (operator) {
            case CapacityPlanningDataModel_1.ThresholdOperator.GREATER_THAN:
                return currentValue > thresholdValue;
            case CapacityPlanningDataModel_1.ThresholdOperator.GREATER_THAN_EQUAL:
                return currentValue >= thresholdValue;
            case CapacityPlanningDataModel_1.ThresholdOperator.LESS_THAN:
                return currentValue < thresholdValue;
            case CapacityPlanningDataModel_1.ThresholdOperator.LESS_THAN_EQUAL:
                return currentValue <= thresholdValue;
            case CapacityPlanningDataModel_1.ThresholdOperator.EQUAL:
                return currentValue === thresholdValue;
            case CapacityPlanningDataModel_1.ThresholdOperator.NOT_EQUAL:
                return currentValue !== thresholdValue;
            default:
                return false;
        }
    }
    extractMetricValue(metrics, metric) {
        switch (metric) {
            case 'cpu_usage':
                return metrics.cpu.usage;
            case 'memory_usage':
                return metrics.memory.usage;
            case 'disk_usage':
                return metrics.disk.usage;
            case 'network_in':
                return metrics.network.bytesIn;
            case 'network_out':
                return metrics.network.bytesOut;
            default:
                return metrics.custom[metric] || 0;
        }
    }
    calculateConfidence(currentValue, historicalMetrics, threshold) {
        const recentValues = historicalMetrics
            .slice(-10)
            .map(m => this.extractMetricValue(m, threshold.metric));
        const mean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
        const stdDev = Math.sqrt(recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length);
        const zScore = Math.abs(currentValue - mean) / (stdDev || 1);
        return Math.max(0.1, Math.min(1.0, 1 - zScore / 3));
    }
    determineAlertType(evaluation) {
        if (evaluation.currentValue > evaluation.thresholdValue) {
            return CapacityPlanningDataModel_1.AlertType.THRESHOLD_BREACH;
        }
        return CapacityPlanningDataModel_1.AlertType.RESOURCE_EXHAUSTION;
    }
    calculateAlertSeverity(evaluation, threshold) {
        const deviation = Math.abs(evaluation.currentValue - evaluation.thresholdValue) / evaluation.thresholdValue;
        if (deviation > 0.5)
            return CapacityPlanningDataModel_1.AlertSeverity.CRITICAL;
        if (deviation > 0.3)
            return CapacityPlanningDataModel_1.AlertSeverity.HIGH;
        if (deviation > 0.1)
            return CapacityPlanningDataModel_1.AlertSeverity.MEDIUM;
        return CapacityPlanningDataModel_1.AlertSeverity.LOW;
    }
    generateAlertTitle(evaluation, threshold) {
        const action = evaluation.currentValue > evaluation.thresholdValue ? 'Scale Up' : 'Scale Down';
        return `${action} Alert: ${threshold.metric} threshold exceeded for ${evaluation.resourceId}`;
    }
    generateAlertDescription(evaluation, threshold) {
        return `Resource ${evaluation.resourceId} has ${threshold.metric} of ${evaluation.currentValue.toFixed(2)} ` +
            `which ${evaluation.operator} threshold of ${evaluation.thresholdValue} for ${evaluation.duration}ms`;
    }
    getAlertActions(severity, threshold) {
        const actions = [
            {
                type: CapacityPlanningDataModel_1.AlertActionType.EMAIL,
                configuration: { priority: severity },
                order: 1
            }
        ];
        if (severity === CapacityPlanningDataModel_1.AlertSeverity.CRITICAL || severity === CapacityPlanningDataModel_1.AlertSeverity.HIGH) {
            actions.push({
                type: CapacityPlanningDataModel_1.AlertActionType.SLACK,
                configuration: { channel: '#alerts', priority: severity },
                order: 2
            });
        }
        if (this.config.enableAutoScaling) {
            actions.push({
                type: CapacityPlanningDataModel_1.AlertActionType.AUTO_SCALE,
                configuration: { policy: threshold.scalingPolicy },
                order: 3
            });
        }
        return actions;
    }
    shouldAutoScale(alert, threshold) {
        return threshold.scalingPolicy.type !== CapacityPlanningDataModel_1.ScalingType.HYBRID &&
            alert.severity !== CapacityPlanningDataModel_1.AlertSeverity.LOW &&
            this.activeAlerts.size < this.config.maxConcurrentAlerts;
    }
    determineScalingAction(alert, currentCapacity, targetCapacity) {
        if (targetCapacity > currentCapacity)
            return 'scale_up';
        if (targetCapacity < currentCapacity)
            return 'scale_down';
        return 'no_action';
    }
    calculateTargetCapacity(alert, threshold, currentCapacity) {
        const policy = threshold.scalingPolicy;
        if (alert.conditions[0].value > threshold.thresholds.scaleUp.value) {
            return Math.min(currentCapacity + policy.scaleUpBy, policy.maxInstances);
        }
        else {
            return Math.max(currentCapacity - policy.scaleDownBy, policy.minInstances);
        }
    }
    buildExecutionPlan(action, threshold, currentCapacity, targetCapacity) {
        const steps = [];
        steps.push({
            order: 1,
            action: 'validate_prerequisites',
            parameters: { resourceId: threshold.resourceId },
            estimatedDuration: 30000,
            dependencies: [],
            validationChecks: ['health_check', 'resource_availability']
        });
        steps.push({
            order: 2,
            action: action,
            parameters: {
                from: currentCapacity,
                to: targetCapacity,
                policy: threshold.scalingPolicy
            },
            estimatedDuration: 300000,
            dependencies: ['validate_prerequisites'],
            validationChecks: ['scaling_success', 'health_check']
        });
        steps.push({
            order: 3,
            action: 'verify_scaling',
            parameters: { expectedCapacity: targetCapacity },
            estimatedDuration: 60000,
            dependencies: [action],
            validationChecks: ['capacity_verification', 'performance_check']
        });
        return steps;
    }
    buildRollbackPlan(action, originalCapacity) {
        const rollbackAction = action === 'scale_up' ? 'scale_down' : 'scale_up';
        return [
            {
                order: 1,
                action: rollbackAction,
                parameters: { to: originalCapacity },
                estimatedDuration: 300000,
                dependencies: [],
                validationChecks: ['rollback_success', 'health_check']
            }
        ];
    }
    generateScalingReasoning(alert, threshold, metrics) {
        const metric = alert.conditions[0].metric;
        const value = alert.conditions[0].value;
        const thresholdValue = threshold.thresholds.scaleUp.value;
        return `${metric} (${value.toFixed(2)}) exceeded threshold (${thresholdValue}) for resource ${alert.resourceId}. ` +
            `Recent trend shows sustained high utilization requiring capacity adjustment.`;
    }
    estimateScalingCost(currentCapacity, targetCapacity) {
        const capacityDelta = Math.abs(targetCapacity - currentCapacity);
        return capacityDelta * 0.15 * 24 * 30;
    }
    estimatePerformanceImpact(action, currentCapacity, targetCapacity) {
        const capacityRatio = targetCapacity / currentCapacity;
        if (action === 'scale_up') {
            return Math.min(50, (capacityRatio - 1) * 100);
        }
        else {
            return Math.max(-30, (1 - capacityRatio) * -100);
        }
    }
    calculateScalingConfidence(metrics, threshold) {
        const recentValues = metrics.slice(-5).map(m => this.extractMetricValue(m, threshold.metric));
        const trend = this.calculateTrend(recentValues);
        const stability = this.calculateStability(recentValues);
        return Math.min(1.0, trend * 0.6 + stability * 0.4);
    }
    calculateTrend(values) {
        if (values.length < 2)
            return 0.5;
        const increases = values.slice(1).filter((val, i) => val > values[i]).length;
        return increases / (values.length - 1);
    }
    calculateStability(values) {
        if (values.length < 2)
            return 0.5;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        return Math.max(0.1, Math.min(1.0, 1 - coefficientOfVariation));
    }
    groupMetricsByResource(metrics) {
        const groups = new Map();
        for (const metric of metrics) {
            if (!groups.has(metric.resourceId)) {
                groups.set(metric.resourceId, []);
            }
            groups.get(metric.resourceId).push(metric);
        }
        return groups;
    }
    getThresholdsForResource(resourceId) {
        return Array.from(this.thresholds.values()).filter(t => t.resourceId === resourceId);
    }
    getLatestMetrics(metrics) {
        return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    }
    findActiveAlertForResource(resourceId, metric) {
        return Array.from(this.activeAlerts.values()).find(alert => alert.resourceId === resourceId &&
            alert.conditions.some(c => c.metric === metric) &&
            alert.status === CapacityPlanningDataModel_1.AlertStatus.ACTIVE) || null;
    }
    isInCooldownPeriod(alert, threshold) {
        if (!alert.triggeredAt)
            return false;
        const cooldownPeriod = threshold.thresholds.scaleUp.cooldown;
        const timeSinceTriggered = Date.now() - alert.triggeredAt.getTime();
        return timeSinceTriggered < cooldownPeriod;
    }
    async getCurrentCapacity(resourceId) {
        return 2;
    }
    async getRecentMetrics(resourceId, minutes) {
        return [];
    }
    initializeThresholdState(thresholdId) {
        this.thresholdStates.set(thresholdId, {
            scaleUpStartTime: null,
            scaleDownStartTime: null,
            lastEvaluation: null,
            consecutiveViolations: 0
        });
    }
    initializeDefaultThresholds() {
        const defaultConfigs = [
            {
                resourceType: CapacityPlanningDataModel_1.ResourceType.SERVER,
                metric: 'cpu_usage',
                scaleUpThreshold: 80,
                scaleDownThreshold: 30
            },
            {
                resourceType: CapacityPlanningDataModel_1.ResourceType.SERVER,
                metric: 'memory_usage',
                scaleUpThreshold: 85,
                scaleDownThreshold: 40
            }
        ];
        defaultConfigs.forEach(config => {
            this.createThreshold({
                resourceId: 'default',
                resourceType: config.resourceType,
                metric: config.metric,
                thresholds: {
                    scaleUp: {
                        value: config.scaleUpThreshold,
                        operator: CapacityPlanningDataModel_1.ThresholdOperator.GREATER_THAN,
                        duration: 300000,
                        cooldown: 900000
                    },
                    scaleDown: {
                        value: config.scaleDownThreshold,
                        operator: CapacityPlanningDataModel_1.ThresholdOperator.LESS_THAN,
                        duration: 600000,
                        cooldown: 600000
                    }
                }
            });
        });
    }
    getDefaultThresholdValues() {
        return {
            scaleUp: {
                value: 80,
                operator: CapacityPlanningDataModel_1.ThresholdOperator.GREATER_THAN,
                duration: 300000,
                cooldown: 900000
            },
            scaleDown: {
                value: 30,
                operator: CapacityPlanningDataModel_1.ThresholdOperator.LESS_THAN,
                duration: 600000,
                cooldown: 600000
            }
        };
    }
    getDefaultScalingPolicy() {
        return {
            type: CapacityPlanningDataModel_1.ScalingType.HORIZONTAL,
            minInstances: 1,
            maxInstances: 10,
            scaleUpBy: 1,
            scaleDownBy: 1,
            scaleUpCooldown: 900000,
            scaleDownCooldown: 600000
        };
    }
    async validateThreshold(threshold) {
        if (!threshold.resourceId) {
            throw new Error('Resource ID is required');
        }
        if (!threshold.metric) {
            throw new Error('Metric is required');
        }
        if (threshold.thresholds.scaleUp.duration < 0) {
            throw new Error('Scale up duration must be non-negative');
        }
        if (threshold.scalingPolicy.minInstances < 0) {
            throw new Error('Minimum instances must be non-negative');
        }
        if (threshold.scalingPolicy.maxInstances < threshold.scalingPolicy.minInstances) {
            throw new Error('Maximum instances must be greater than or equal to minimum instances');
        }
    }
    startMonitoring() {
        this.evaluationTimer = setInterval(async () => {
            try {
                const metrics = await this.collectCurrentMetrics();
                await this.evaluateThresholds(metrics);
            }
            catch (error) {
                this.emit('evaluationError', { error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }, this.config.evaluationInterval);
    }
    async collectCurrentMetrics() {
        return [];
    }
    generateThresholdId() {
        return `threshold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
        if (this.evaluationTimer) {
            clearInterval(this.evaluationTimer);
        }
        this.thresholds.clear();
        this.activeAlerts.clear();
        this.thresholdStates.clear();
        await this.scalingExecutor.shutdown();
        await this.alertManager.shutdown();
        this.emit('shutdown');
    }
}
exports.ScalingThresholdMonitor = ScalingThresholdMonitor;
class ScalingExecutor {
    async execute(decision) {
        for (const step of decision.executionPlan) {
            await this.executeStep(step);
        }
    }
    async rollback(decision) {
        for (const step of decision.rollbackPlan) {
            await this.executeStep(step);
        }
    }
    async executeStep(step) {
        console.log(`Executing step: ${step.action} with parameters:`, step.parameters);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    async shutdown() {
    }
}
class AlertManager {
    channels;
    constructor(channels) {
        this.channels = channels;
    }
    async sendNotifications(alert) {
        const activeChannels = this.channels.filter(c => c.isActive);
        for (const channel of activeChannels) {
            try {
                await this.sendNotification(channel, alert);
            }
            catch (error) {
                console.error(`Failed to send notification via ${channel.type}:`, error);
            }
        }
    }
    async executeAction(action, alert) {
        console.log(`Executing alert action: ${action.type} for alert ${alert.id}`);
    }
    async sendNotification(channel, alert) {
        console.log(`Sending ${alert.severity} alert to ${channel.type}: ${alert.title}`);
    }
    async shutdown() {
    }
}

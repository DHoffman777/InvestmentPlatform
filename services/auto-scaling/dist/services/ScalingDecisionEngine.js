"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalingDecisionEngine = void 0;
const events_1 = require("events");
class ScalingDecisionEngine extends events_1.EventEmitter {
    constructor(config, financialProfile) {
        super();
        this.config = config;
        this.financialProfile = financialProfile;
        this.decisionHistory = new Map();
        this.cooldownTimers = new Map();
        this.conditionStates = new Map();
    }
    async makeScalingDecision(serviceName, metrics, allMetrics) {
        const timestamp = new Date();
        // Check if service is in cooldown period
        if (this.isInCooldown(serviceName)) {
            return this.createMaintainDecision(serviceName, metrics, timestamp, 'Service in cooldown period');
        }
        // Evaluate all scaling rules for this service
        const applicableRules = this.getApplicableRules(serviceName);
        const ruleEvaluations = await Promise.all(applicableRules.map(rule => this.evaluateRule(rule, serviceName, metrics, allMetrics)));
        // Filter triggered rules and sort by priority
        const triggeredRules = ruleEvaluations
            .filter(evaluation => evaluation.triggered)
            .sort((a, b) => b.rule.priority - a.rule.priority);
        if (triggeredRules.length === 0) {
            return this.createMaintainDecision(serviceName, metrics, timestamp, 'No scaling rules triggered');
        }
        // Get the highest priority triggered rule
        const primaryRule = triggeredRules[0];
        const decision = this.createDecisionFromRule(serviceName, metrics, timestamp, primaryRule);
        // Apply financial services constraints
        if (this.financialProfile) {
            this.applyFinancialConstraints(decision, metrics);
        }
        // Validate decision against system limits
        this.validateDecisionLimits(decision, metrics);
        // Store decision in history
        this.addDecisionToHistory(serviceName, decision);
        // Emit decision event
        this.emit('decisionMade', { serviceName, decision });
        return decision;
    }
    getApplicableRules(serviceName) {
        return this.config.scaling.rules.filter(rule => rule.enabled && rule.action.targetServices.includes(serviceName));
    }
    async evaluateRule(rule, serviceName, metrics, allMetrics) {
        const conditionResults = await Promise.all(rule.conditions.map(condition => this.evaluateCondition(condition, serviceName, metrics, allMetrics)));
        // Evaluate condition logic (AND/OR)
        let triggered = false;
        if (rule.conditions.length > 0) {
            // Simple implementation: all conditions must be satisfied for rule to trigger
            triggered = conditionResults.every(result => result.satisfied);
        }
        // Calculate confidence based on how strongly conditions are met
        const confidence = this.calculateRuleConfidence(conditionResults);
        return {
            rule,
            triggered,
            conditionResults,
            confidence,
        };
    }
    async evaluateCondition(condition, serviceName, metrics, allMetrics) {
        // Extract metric value based on condition.metric
        const value = this.extractMetricValue(condition.metric, metrics, allMetrics);
        // Check if threshold is met
        const thresholdMet = this.evaluateThreshold(value, condition.threshold, condition.comparison);
        // Check duration requirement
        const conditionKey = `${serviceName}_${condition.metric}`;
        const conditionState = this.getConditionState(conditionKey);
        const now = new Date();
        let satisfied = false;
        let duration = 0;
        if (thresholdMet) {
            if (!conditionState.satisfied) {
                // Condition just became satisfied
                this.setConditionState(conditionKey, { satisfied: true, since: now });
                duration = 0;
            }
            else {
                // Condition has been satisfied for some time
                duration = now.getTime() - conditionState.since.getTime();
                satisfied = duration >= condition.duration * 1000; // Convert to milliseconds
            }
        }
        else {
            // Condition not met, reset state
            this.setConditionState(conditionKey, { satisfied: false, since: now });
            duration = 0;
        }
        return {
            condition,
            satisfied,
            value,
            duration: duration / 1000, // Return in seconds
        };
    }
    extractMetricValue(metricName, metrics, allMetrics) {
        const parts = metricName.split('.');
        switch (parts[0]) {
            case 'cpu':
                return parts[1] === 'usage' ? metrics.resources.cpu.usage : 0;
            case 'memory':
                return parts[1] === 'usage' ? metrics.resources.memory.usage : 0;
            case 'network':
                return parts[1] === 'inbound' ? metrics.resources.network.inbound :
                    parts[1] === 'outbound' ? metrics.resources.network.outbound : 0;
            case 'performance':
                switch (parts[1]) {
                    case 'responseTime': return metrics.performance.responseTime;
                    case 'throughput': return metrics.performance.throughput;
                    case 'errorRate': return metrics.performance.errorRate;
                    case 'queueLength': return metrics.performance.queueLength;
                    default: return 0;
                }
            case 'instances':
                return parts[1] === 'current' ? metrics.instances.current :
                    parts[1] === 'healthy' ? metrics.instances.healthy :
                        parts[1] === 'unhealthy' ? metrics.instances.unhealthy : 0;
            case 'custom':
                return metrics.customMetrics[parts[1]] || 0;
            default:
                // Try direct lookup in custom metrics
                return metrics.customMetrics[metricName] || 0;
        }
    }
    evaluateThreshold(value, threshold, comparison) {
        switch (comparison) {
            case 'greater_than':
                return value > threshold;
            case 'less_than':
                return value < threshold;
            case 'equal':
                return Math.abs(value - threshold) < 0.001;
            case 'not_equal':
                return Math.abs(value - threshold) >= 0.001;
            default:
                return false;
        }
    }
    calculateRuleConfidence(conditionResults) {
        if (conditionResults.length === 0)
            return 0;
        let totalConfidence = 0;
        for (const result of conditionResults) {
            if (result.satisfied) {
                // Calculate how much the value exceeds the threshold
                const thresholdRatio = Math.abs(result.value - result.condition.threshold) / Math.max(result.condition.threshold, 1);
                const confidence = Math.min(thresholdRatio, 1.0); // Cap at 1.0
                totalConfidence += confidence;
            }
        }
        return Math.min(totalConfidence / conditionResults.length, 1.0);
    }
    createDecisionFromRule(serviceName, metrics, timestamp, ruleEvaluation) {
        const rule = ruleEvaluation.rule;
        const action = rule.action;
        let recommendedInstances = metrics.instances.current;
        let actionType = 'maintain';
        // Calculate target instances based on action
        if (action.type === 'scale_up' || action.type === 'scale_down') {
            if (action.targetInstances !== undefined) {
                recommendedInstances = action.targetInstances;
            }
            else if (action.scaleByCount !== undefined) {
                recommendedInstances = action.type === 'scale_up'
                    ? metrics.instances.current + action.scaleByCount
                    : metrics.instances.current - action.scaleByCount;
            }
            else if (action.scaleByPercent !== undefined) {
                const percentChange = action.scaleByPercent / 100;
                const instanceChange = Math.ceil(metrics.instances.current * percentChange);
                recommendedInstances = action.type === 'scale_up'
                    ? metrics.instances.current + instanceChange
                    : metrics.instances.current - instanceChange;
            }
            actionType = action.type;
        }
        // Determine urgency based on condition severity
        const urgency = this.determineUrgency(ruleEvaluation.conditionResults, ruleEvaluation.confidence);
        // Build reasoning
        const reasoning = [
            `Rule "${rule.name}" triggered`,
            ...ruleEvaluation.conditionResults
                .filter(r => r.satisfied)
                .map(r => `${r.condition.metric} ${r.condition.comparison} ${r.condition.threshold} (actual: ${r.value.toFixed(2)})`)
        ];
        // Extract metrics used in decision
        const metricsUsed = {};
        ruleEvaluation.conditionResults.forEach(r => {
            metricsUsed[r.condition.metric] = r.value;
        });
        return {
            timestamp,
            serviceName,
            currentInstances: metrics.instances.current,
            recommendedInstances,
            confidence: ruleEvaluation.confidence,
            reasoning,
            triggeredRules: [rule.id],
            metricsUsed,
            action: actionType,
            urgency,
        };
    }
    createMaintainDecision(serviceName, metrics, timestamp, reason) {
        return {
            timestamp,
            serviceName,
            currentInstances: metrics.instances.current,
            recommendedInstances: metrics.instances.current,
            confidence: 1.0,
            reasoning: [reason],
            triggeredRules: [],
            metricsUsed: {},
            action: 'maintain',
            urgency: 'low',
        };
    }
    determineUrgency(conditionResults, confidence) {
        if (confidence >= 0.9)
            return 'critical';
        if (confidence >= 0.7)
            return 'high';
        if (confidence >= 0.5)
            return 'medium';
        return 'low';
    }
    applyFinancialConstraints(decision, metrics) {
        if (!this.financialProfile)
            return;
        const now = new Date();
        const isMarketHours = this.isMarketHours(now);
        const compliance = this.financialProfile.complianceRequirements;
        // Apply minimum instances for redundancy
        if (decision.recommendedInstances < compliance.minInstancesForRedundancy) {
            decision.recommendedInstances = compliance.minInstancesForRedundancy;
            decision.reasoning.push('Applied minimum instances for compliance redundancy');
        }
        // Apply scale-down rate limits
        if (decision.action === 'scale_down') {
            const maxScaleDown = Math.floor(metrics.instances.current * (compliance.maxScaleDownRate / 100));
            const proposedScaleDown = metrics.instances.current - decision.recommendedInstances;
            if (proposedScaleDown > maxScaleDown) {
                decision.recommendedInstances = metrics.instances.current - maxScaleDown;
                decision.reasoning.push('Limited scale-down to comply with maximum rate');
            }
        }
        // Require approval for large-scale operations
        if (decision.recommendedInstances >= compliance.requiredApprovalForLargeScale) {
            decision.reasoning.push('Large-scale operation requires manual approval');
            // In a real implementation, this would trigger an approval workflow
        }
        // Apply market hours multipliers
        if (isMarketHours) {
            const timePattern = this.getCurrentTradingPattern(now);
            if (timePattern) {
                const adjustedInstances = Math.ceil(decision.recommendedInstances * timePattern.multiplier);
                if (adjustedInstances !== decision.recommendedInstances) {
                    decision.recommendedInstances = adjustedInstances;
                    decision.reasoning.push(`Applied ${timePattern.name} trading pattern multiplier (${timePattern.multiplier}x)`);
                }
            }
        }
    }
    isMarketHours(date) {
        if (!this.financialProfile)
            return true;
        const hours = this.financialProfile.marketHours;
        const timeString = date.toTimeString().substring(0, 5); // HH:MM format
        return timeString >= hours.regular.start && timeString <= hours.regular.end;
    }
    getCurrentTradingPattern(date) {
        if (!this.financialProfile)
            return null;
        const patterns = this.financialProfile.tradingPatterns;
        const hour = date.getHours();
        const minute = date.getMinutes();
        const dayOfMonth = date.getDate();
        const isMonthEnd = dayOfMonth >= 25; // Last 6 days of month
        const isQuarterEnd = [3, 6, 9, 12].includes(date.getMonth() + 1) && isMonthEnd;
        // Check for quarter-end pattern
        if (isQuarterEnd) {
            return { name: 'quarter-end', multiplier: patterns.quarterEnd.multiplier };
        }
        // Check for month-end pattern
        if (isMonthEnd) {
            return { name: 'month-end', multiplier: patterns.monthEnd.multiplier };
        }
        // Check for opening bell pattern
        if (hour === 9 && minute <= 30) {
            return { name: 'opening-bell', multiplier: patterns.openingBell.multiplier };
        }
        // Check for closing bell pattern
        if (hour === 15 && minute >= 30) {
            return { name: 'closing-bell', multiplier: patterns.closingBell.multiplier };
        }
        // Check for lunch time pattern
        if (hour === 12) {
            return { name: 'lunch-time', multiplier: patterns.lunchTime.multiplier };
        }
        return null;
    }
    validateDecisionLimits(decision, metrics) {
        const limits = this.config.scaling.limits;
        // Apply min/max instance limits
        if (decision.recommendedInstances < limits.minInstances) {
            decision.recommendedInstances = limits.minInstances;
            decision.reasoning.push('Applied minimum instance limit');
        }
        if (decision.recommendedInstances > limits.maxInstances) {
            decision.recommendedInstances = limits.maxInstances;
            decision.reasoning.push('Applied maximum instance limit');
        }
        // Update action based on final recommendation
        if (decision.recommendedInstances > metrics.instances.current) {
            decision.action = 'scale_up';
        }
        else if (decision.recommendedInstances < metrics.instances.current) {
            decision.action = 'scale_down';
        }
        else {
            decision.action = 'maintain';
        }
    }
    isInCooldown(serviceName) {
        const cooldowns = this.cooldownTimers.get(serviceName);
        if (!cooldowns)
            return false;
        const now = new Date();
        const limits = this.config.scaling.limits;
        const scaleUpCooldownExpired = now.getTime() - cooldowns.scaleUp.getTime() >= limits.scaleUpCooldown * 1000;
        const scaleDownCooldownExpired = now.getTime() - cooldowns.scaleDown.getTime() >= limits.scaleDownCooldown * 1000;
        return !scaleUpCooldownExpired || !scaleDownCooldownExpired;
    }
    getConditionState(conditionKey) {
        if (!this.conditionStates.has(conditionKey)) {
            const serviceStates = this.conditionStates.get(conditionKey.split('_')[0]) || new Map();
            return serviceStates.get(conditionKey) || { satisfied: false, since: new Date() };
        }
        const serviceStates = this.conditionStates.get(conditionKey.split('_')[0]);
        return serviceStates.get(conditionKey) || { satisfied: false, since: new Date() };
    }
    setConditionState(conditionKey, state) {
        const serviceName = conditionKey.split('_')[0];
        if (!this.conditionStates.has(serviceName)) {
            this.conditionStates.set(serviceName, new Map());
        }
        this.conditionStates.get(serviceName).set(conditionKey, state);
    }
    addDecisionToHistory(serviceName, decision) {
        if (!this.decisionHistory.has(serviceName)) {
            this.decisionHistory.set(serviceName, []);
        }
        const history = this.decisionHistory.get(serviceName);
        history.push(decision);
        // Keep only last 100 decisions per service
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
    }
    setCooldown(serviceName, action) {
        const now = new Date();
        let cooldowns = this.cooldownTimers.get(serviceName);
        if (!cooldowns) {
            cooldowns = { scaleUp: new Date(0), scaleDown: new Date(0) };
            this.cooldownTimers.set(serviceName, cooldowns);
        }
        if (action === 'scale_up') {
            cooldowns.scaleUp = now;
        }
        else {
            cooldowns.scaleDown = now;
        }
    }
    getDecisionHistory(serviceName, limit) {
        const history = this.decisionHistory.get(serviceName) || [];
        return limit ? history.slice(-limit) : [...history];
    }
    async generatePrediction(serviceName, timeHorizonMinutes) {
        const history = this.getDecisionHistory(serviceName, 100);
        // Simple trend analysis based on recent decisions
        const recentDecisions = history.slice(-10);
        let trendDirection = 'stable';
        let trendRate = 0;
        if (recentDecisions.length >= 2) {
            const recent = recentDecisions.slice(-5);
            const older = recentDecisions.slice(0, 5);
            const recentAvg = recent.reduce((sum, d) => sum + d.recommendedInstances, 0) / recent.length;
            const olderAvg = older.reduce((sum, d) => sum + d.recommendedInstances, 0) / older.length;
            if (recentAvg > olderAvg * 1.1) {
                trendDirection = 'increasing';
                trendRate = (recentAvg - olderAvg) / olderAvg;
            }
            else if (recentAvg < olderAvg * 0.9) {
                trendDirection = 'decreasing';
                trendRate = (olderAvg - recentAvg) / olderAvg;
            }
        }
        // Generate predictions for the specified time horizon
        const predictions = [];
        const now = new Date();
        const intervalMinutes = Math.max(1, Math.floor(timeHorizonMinutes / 10)); // 10 prediction points
        for (let i = 0; i < 10; i++) {
            const timestamp = new Date(now.getTime() + (i * intervalMinutes * 60 * 1000));
            const baseLoad = 100; // Base load value
            const seasonalMultiplier = this.getSeasonalMultiplier(timestamp);
            const trendMultiplier = 1 + (trendRate * (i / 10)); // Apply trend over time
            const predictedLoad = baseLoad * seasonalMultiplier * trendMultiplier;
            const recommendedInstances = Math.max(1, Math.ceil(predictedLoad / 25)); // 25 load units per instance
            predictions.push({
                timestamp,
                predictedLoad,
                recommendedInstances,
                confidence: Math.max(0.5, 1 - (i * 0.05)), // Decreasing confidence over time
            });
        }
        return {
            serviceName,
            timeHorizon: timeHorizonMinutes,
            predictions,
            seasonalPatterns: this.generateSeasonalPatterns(),
            trendAnalysis: {
                direction: trendDirection,
                rate: trendRate,
                confidence: recentDecisions.length >= 5 ? 0.8 : 0.4,
            },
        };
    }
    getSeasonalMultiplier(date) {
        const hour = date.getHours();
        const dayOfWeek = date.getDay(); // 0 = Sunday
        // Business hours (9 AM - 5 PM) on weekdays
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17) {
            return 1.5; // 50% higher load during business hours
        }
        // Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return 0.6; // 40% lower load on weekends
        }
        // After hours on weekdays
        return 0.8; // 20% lower load after hours
    }
    generateSeasonalPatterns() {
        const patterns = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                let multiplier = 1.0;
                // Weekday business hours
                if (day >= 1 && day <= 5 && hour >= 9 && hour <= 17) {
                    multiplier = 1.5;
                }
                // Weekend
                else if (day === 0 || day === 6) {
                    multiplier = 0.6;
                }
                // After hours
                else {
                    multiplier = 0.8;
                }
                patterns.push({
                    dayOfWeek: day,
                    hourOfDay: hour,
                    expectedMultiplier: multiplier,
                });
            }
        }
        return patterns;
    }
}
exports.ScalingDecisionEngine = ScalingDecisionEngine;
//# sourceMappingURL=ScalingDecisionEngine.js.map
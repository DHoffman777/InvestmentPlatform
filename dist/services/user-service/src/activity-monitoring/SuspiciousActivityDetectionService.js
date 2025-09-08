"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspiciousActivityDetectionService = exports.EvidenceType = exports.AlertStatus = exports.AlertType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const ActivityTrackingService_1 = require("./ActivityTrackingService");
var AlertType;
(function (AlertType) {
    AlertType["MULTIPLE_FAILED_LOGINS"] = "multiple_failed_logins";
    AlertType["UNUSUAL_LOCATION"] = "unusual_location";
    AlertType["OFF_HOURS_ACCESS"] = "off_hours_access";
    AlertType["SUSPICIOUS_DEVICE"] = "suspicious_device";
    AlertType["PRIVILEGE_ESCALATION"] = "privilege_escalation";
    AlertType["DATA_EXFILTRATION"] = "data_exfiltration";
    AlertType["BRUTE_FORCE_ATTACK"] = "brute_force_attack";
    AlertType["ACCOUNT_TAKEOVER"] = "account_takeover";
    AlertType["UNUSUAL_ACTIVITY_VOLUME"] = "unusual_activity_volume";
    AlertType["INSIDER_THREAT"] = "insider_threat";
    AlertType["COMPLIANCE_VIOLATION"] = "compliance_violation";
    AlertType["POLICY_VIOLATION"] = "policy_violation";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["NEW"] = "new";
    AlertStatus["INVESTIGATING"] = "investigating";
    AlertStatus["CONFIRMED"] = "confirmed";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["FALSE_POSITIVE"] = "false_positive";
    AlertStatus["ESCALATED"] = "escalated";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var EvidenceType;
(function (EvidenceType) {
    EvidenceType["ACTIVITY_PATTERN"] = "activity_pattern";
    EvidenceType["LOCATION_ANOMALY"] = "location_anomaly";
    EvidenceType["TIME_ANOMALY"] = "time_anomaly";
    EvidenceType["DEVICE_FINGERPRINT"] = "device_fingerprint";
    EvidenceType["BEHAVIORAL_CHANGE"] = "behavioral_change";
    EvidenceType["STATISTICAL_ANOMALY"] = "statistical_anomaly";
    EvidenceType["RULE_VIOLATION"] = "rule_violation";
})(EvidenceType || (exports.EvidenceType = EvidenceType = {}));
class SuspiciousActivityDetectionService extends events_1.EventEmitter {
    alerts = new Map();
    detectionRules = new Map();
    userBaselines = new Map();
    threatIntelligence = new Map();
    recentActivities = new Map();
    ruleCooldowns = new Map();
    mlModels = new Map();
    constructor() {
        super();
        this.initializeDefaultRules();
        this.startPeriodicAnalysis();
        this.loadThreatIntelligence();
    }
    async analyzeActivity(activity) {
        const alerts = [];
        // Update recent activities buffer
        this.updateRecentActivities(activity);
        // Run rule-based detection
        const ruleAlerts = await this.runRuleBasedDetection(activity);
        alerts.push(...ruleAlerts);
        // Run statistical anomaly detection
        const statisticalAlerts = await this.runStatisticalDetection(activity);
        alerts.push(...statisticalAlerts);
        // Run behavioral analysis
        const behavioralAlerts = await this.runBehavioralAnalysis(activity);
        alerts.push(...behavioralAlerts);
        // Run threat intelligence checks
        const threatAlerts = await this.runThreatIntelligenceCheck(activity);
        alerts.push(...threatAlerts);
        // Run ML-based detection
        const mlAlerts = await this.runMLDetection(activity);
        alerts.push(...mlAlerts);
        // Process and store alerts
        for (const alert of alerts) {
            await this.processAlert(alert);
        }
        return alerts;
    }
    async getAlerts(filter = {}, limit = 100, offset = 0) {
        let filteredAlerts = Array.from(this.alerts.values());
        if (filter.userId) {
            filteredAlerts = filteredAlerts.filter(a => a.userId === filter.userId);
        }
        if (filter.tenantId) {
            filteredAlerts = filteredAlerts.filter(a => a.tenantId === filter.tenantId);
        }
        if (filter.severity?.length) {
            filteredAlerts = filteredAlerts.filter(a => filter.severity.includes(a.severity));
        }
        if (filter.status?.length) {
            filteredAlerts = filteredAlerts.filter(a => filter.status.includes(a.status));
        }
        if (filter.alertType?.length) {
            filteredAlerts = filteredAlerts.filter(a => filter.alertType.includes(a.alertType));
        }
        if (filter.startDate) {
            filteredAlerts = filteredAlerts.filter(a => a.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            filteredAlerts = filteredAlerts.filter(a => a.timestamp <= filter.endDate);
        }
        return filteredAlerts
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(offset, offset + limit);
    }
    async updateAlertStatus(alertId, status, assignedTo, resolution) {
        const alert = this.alerts.get(alertId);
        if (!alert)
            return null;
        alert.status = status;
        if (assignedTo)
            alert.assignedTo = assignedTo;
        if (resolution)
            alert.resolution = resolution;
        if (status === AlertStatus.FALSE_POSITIVE) {
            alert.falsePositive = true;
            await this.updateRuleFalsePositiveRate(alert);
        }
        this.emit('alertUpdated', alert);
        return alert;
    }
    async createDetectionRule(rule) {
        const newRule = {
            id: (0, crypto_1.randomUUID)(),
            triggerCount: 0,
            falsePositiveRate: 0,
            ...rule
        };
        this.detectionRules.set(newRule.id, newRule);
        this.emit('ruleCreated', newRule);
        return newRule;
    }
    async updateDetectionRule(ruleId, updates) {
        const rule = this.detectionRules.get(ruleId);
        if (!rule)
            return null;
        const updatedRule = { ...rule, ...updates };
        this.detectionRules.set(ruleId, updatedRule);
        this.emit('ruleUpdated', updatedRule);
        return updatedRule;
    }
    async deleteDetectionRule(ruleId) {
        const deleted = this.detectionRules.delete(ruleId);
        if (deleted) {
            this.emit('ruleDeleted', ruleId);
        }
        return deleted;
    }
    async updateUserBaseline(userId, activities) {
        const userActivities = activities.filter(a => a.userId === userId);
        const profile = this.calculateUserProfile(userActivities);
        const statistics = this.calculateUserStatistics(userActivities);
        const anomalyThresholds = this.calculateAnomalyThresholds(userActivities);
        const baseline = {
            userId,
            tenantId: userActivities[0]?.tenantId || 'default',
            profile,
            statistics,
            anomalyThresholds
        };
        this.userBaselines.set(userId, baseline);
        this.emit('baselineUpdated', baseline);
        return baseline;
    }
    async addThreatIntelligence(threat) {
        const newThreat = {
            id: (0, crypto_1.randomUUID)(),
            createdAt: new Date(),
            ...threat
        };
        this.threatIntelligence.set(newThreat.value, newThreat);
        this.emit('threatIntelligenceAdded', newThreat);
        return newThreat;
    }
    async getDetectionRules() {
        return Array.from(this.detectionRules.values())
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    async getAlertStatistics() {
        const alerts = Array.from(this.alerts.values());
        const alertsByType = alerts.reduce((acc, alert) => {
            acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
            return acc;
        }, {});
        const alertsBySeverity = alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
        const alertsByStatus = alerts.reduce((acc, alert) => {
            acc[alert.status] = (acc[alert.status] || 0) + 1;
            return acc;
        }, {});
        const resolvedAlerts = alerts.filter(a => a.status === AlertStatus.RESOLVED);
        const averageResolutionTime = resolvedAlerts.length > 0
            ? resolvedAlerts.reduce((sum, alert) => sum + (Date.now() - alert.timestamp.getTime()), 0) / resolvedAlerts.length
            : 0;
        const falsePositives = alerts.filter(a => a.falsePositive).length;
        const falsePositiveRate = alerts.length > 0 ? falsePositives / alerts.length : 0;
        return {
            totalAlerts: alerts.length,
            alertsByType,
            alertsBySeverity,
            alertsByStatus,
            averageResolutionTime,
            falsePositiveRate
        };
    }
    async runRuleBasedDetection(activity) {
        const alerts = [];
        for (const rule of this.detectionRules.values()) {
            if (!rule.enabled)
                continue;
            // Check cooldown
            const lastCooldown = this.ruleCooldowns.get(rule.id);
            if (lastCooldown && Date.now() - lastCooldown.getTime() < rule.cooldown) {
                continue;
            }
            const recentUserActivities = this.getRecentUserActivities(activity.userId, rule.timeWindow);
            if (await this.evaluateRule(rule, activity, recentUserActivities)) {
                const alert = await this.createAlert(rule.alertType, rule.severity, activity, rule);
                alerts.push(alert);
                // Update rule statistics
                rule.triggerCount++;
                rule.lastTriggered = new Date();
                this.ruleCooldowns.set(rule.id, new Date());
            }
        }
        return alerts;
    }
    async runStatisticalDetection(activity) {
        const alerts = [];
        const baseline = this.userBaselines.get(activity.userId);
        if (!baseline)
            return alerts;
        // Location anomaly detection
        if (activity.location && this.isLocationAnomaly(activity, baseline)) {
            const alert = await this.createAlert(AlertType.UNUSUAL_LOCATION, ActivityTrackingService_1.ActivitySeverity.MEDIUM, activity, null, 'Activity from unusual location detected');
            alerts.push(alert);
        }
        // Time anomaly detection
        if (this.isTimeAnomaly(activity, baseline)) {
            const alert = await this.createAlert(AlertType.OFF_HOURS_ACCESS, ActivityTrackingService_1.ActivitySeverity.MEDIUM, activity, null, 'Activity during unusual hours detected');
            alerts.push(alert);
        }
        // Volume anomaly detection
        const recentActivities = this.getRecentUserActivities(activity.userId, 60 * 60 * 1000); // 1 hour
        if (this.isVolumeAnomaly(recentActivities, baseline)) {
            const alert = await this.createAlert(AlertType.UNUSUAL_ACTIVITY_VOLUME, ActivityTrackingService_1.ActivitySeverity.HIGH, activity, null, 'Unusual activity volume detected');
            alerts.push(alert);
        }
        return alerts;
    }
    async runBehavioralAnalysis(activity) {
        const alerts = [];
        const baseline = this.userBaselines.get(activity.userId);
        if (!baseline)
            return alerts;
        // Device anomaly detection
        if (activity.deviceInfo && this.isDeviceAnomaly(activity, baseline)) {
            const alert = await this.createAlert(AlertType.SUSPICIOUS_DEVICE, ActivityTrackingService_1.ActivitySeverity.HIGH, activity, null, 'Activity from suspicious device detected');
            alerts.push(alert);
        }
        // Privilege escalation detection
        if (this.isPrivilegeEscalation(activity)) {
            const alert = await this.createAlert(AlertType.PRIVILEGE_ESCALATION, ActivityTrackingService_1.ActivitySeverity.CRITICAL, activity, null, 'Privilege escalation attempt detected');
            alerts.push(alert);
        }
        return alerts;
    }
    async runThreatIntelligenceCheck(activity) {
        const alerts = [];
        // Check IP reputation
        const ipThreat = this.threatIntelligence.get(activity.ipAddress);
        if (ipThreat && !this.isThreatExpired(ipThreat)) {
            const alert = await this.createAlert(AlertType.BRUTE_FORCE_ATTACK, ipThreat.severity, activity, null, `Activity from known malicious IP: ${ipThreat.description}`);
            alerts.push(alert);
        }
        return alerts;
    }
    async runMLDetection(activity) {
        const alerts = [];
        // Placeholder for ML-based detection
        // In production, this would use trained models to detect anomalies
        return alerts;
    }
    async evaluateRule(rule, activity, recentActivities) {
        let score = 0;
        let maxScore = 0;
        for (const condition of rule.conditions) {
            maxScore += condition.weight;
            if (this.evaluateCondition(condition, activity, recentActivities)) {
                score += condition.weight;
            }
        }
        return maxScore > 0 && (score / maxScore) >= rule.threshold;
    }
    evaluateCondition(condition, activity, recentActivities) {
        let fieldValue;
        // Get field value from activity or calculate from recent activities
        if (condition.field === 'failed_login_count') {
            fieldValue = recentActivities.filter(a => a.activityType === ActivityTrackingService_1.ActivityType.AUTHENTICATION &&
                a.status === 'failure').length;
        }
        else if (condition.field === 'activity_count') {
            fieldValue = recentActivities.length;
        }
        else {
            fieldValue = this.getNestedProperty(activity, condition.field);
        }
        // Evaluate condition based on operator
        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'not_equals':
                return fieldValue !== condition.value;
            case 'greater_than':
                return Number(fieldValue) > Number(condition.value);
            case 'less_than':
                return Number(fieldValue) < Number(condition.value);
            case 'contains':
                return String(fieldValue).includes(String(condition.value));
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(fieldValue);
            case 'not_in':
                return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
            case 'regex':
                return new RegExp(condition.value).test(String(fieldValue));
            default:
                return false;
        }
    }
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    async createAlert(alertType, severity, activity, rule, customDescription) {
        const alert = {
            id: (0, crypto_1.randomUUID)(),
            alertType,
            severity,
            title: this.generateAlertTitle(alertType),
            description: customDescription || this.generateAlertDescription(alertType, activity),
            userId: activity.userId,
            tenantId: activity.tenantId,
            relatedActivities: [activity.id],
            timestamp: new Date(),
            status: AlertStatus.NEW,
            falsePositive: false,
            riskScore: activity.riskScore || 0,
            evidence: await this.generateEvidence(alertType, activity),
            recommendedActions: this.generateRecommendedActions(alertType),
            correlationId: activity.correlationId
        };
        return alert;
    }
    async processAlert(alert) {
        this.alerts.set(alert.id, alert);
        this.emit('alertCreated', alert);
        // Auto-escalate critical alerts
        if (alert.severity === ActivityTrackingService_1.ActivitySeverity.CRITICAL) {
            alert.status = AlertStatus.ESCALATED;
            this.emit('alertEscalated', alert);
        }
        // Execute automated actions based on alert type
        await this.executeAutomatedActions(alert);
    }
    async executeAutomatedActions(alert) {
        // Implement automated responses based on alert type and severity
        switch (alert.alertType) {
            case AlertType.BRUTE_FORCE_ATTACK:
                // Temporarily block IP
                this.emit('blockIPRequested', { ip: alert.evidence.find(e => e.type === EvidenceType.ACTIVITY_PATTERN)?.data?.ipAddress });
                break;
            case AlertType.ACCOUNT_TAKEOVER:
                // Force password reset
                this.emit('forcePasswordResetRequested', { userId: alert.userId });
                break;
            case AlertType.DATA_EXFILTRATION:
                // Alert security team immediately
                this.emit('securityAlertRequested', alert);
                break;
        }
    }
    generateAlertTitle(alertType) {
        const titles = {
            [AlertType.MULTIPLE_FAILED_LOGINS]: 'Multiple Failed Login Attempts',
            [AlertType.UNUSUAL_LOCATION]: 'Unusual Location Access',
            [AlertType.OFF_HOURS_ACCESS]: 'Off-Hours System Access',
            [AlertType.SUSPICIOUS_DEVICE]: 'Suspicious Device Access',
            [AlertType.PRIVILEGE_ESCALATION]: 'Privilege Escalation Attempt',
            [AlertType.DATA_EXFILTRATION]: 'Potential Data Exfiltration',
            [AlertType.BRUTE_FORCE_ATTACK]: 'Brute Force Attack Detected',
            [AlertType.ACCOUNT_TAKEOVER]: 'Potential Account Takeover',
            [AlertType.UNUSUAL_ACTIVITY_VOLUME]: 'Unusual Activity Volume',
            [AlertType.INSIDER_THREAT]: 'Potential Insider Threat',
            [AlertType.COMPLIANCE_VIOLATION]: 'Compliance Violation',
            [AlertType.POLICY_VIOLATION]: 'Policy Violation'
        };
        return titles[alertType] || 'Suspicious Activity Detected';
    }
    generateAlertDescription(alertType, activity) {
        return `Suspicious activity of type ${alertType} detected for user ${activity.userId} at ${activity.timestamp.toISOString()}`;
    }
    async generateEvidence(alertType, activity) {
        const evidence = [];
        // Add activity pattern evidence
        evidence.push({
            type: EvidenceType.ACTIVITY_PATTERN,
            description: `Activity: ${activity.action} on ${activity.resource}`,
            data: {
                activityType: activity.activityType,
                action: activity.action,
                resource: activity.resource,
                ipAddress: activity.ipAddress,
                userAgent: activity.userAgent
            },
            timestamp: activity.timestamp,
            confidence: 0.8
        });
        // Add location evidence if available
        if (activity.location) {
            evidence.push({
                type: EvidenceType.LOCATION_ANOMALY,
                description: `Location: ${activity.location.city}, ${activity.location.country}`,
                data: activity.location,
                timestamp: activity.timestamp,
                confidence: 0.7
            });
        }
        // Add device evidence if available
        if (activity.deviceInfo) {
            evidence.push({
                type: EvidenceType.DEVICE_FINGERPRINT,
                description: `Device: ${activity.deviceInfo.deviceType} - ${activity.deviceInfo.browser}`,
                data: activity.deviceInfo,
                timestamp: activity.timestamp,
                confidence: 0.6
            });
        }
        return evidence;
    }
    generateRecommendedActions(alertType) {
        const actions = {
            [AlertType.MULTIPLE_FAILED_LOGINS]: [
                'Verify user identity',
                'Consider temporary account lockout',
                'Review authentication logs'
            ],
            [AlertType.UNUSUAL_LOCATION]: [
                'Contact user to verify location',
                'Check for VPN usage',
                'Monitor for additional anomalies'
            ],
            [AlertType.OFF_HOURS_ACCESS]: [
                'Verify user authorization',
                'Check access justification',
                'Monitor session activity'
            ],
            [AlertType.SUSPICIOUS_DEVICE]: [
                'Verify device ownership',
                'Check device security',
                'Consider device quarantine'
            ],
            [AlertType.PRIVILEGE_ESCALATION]: [
                'Immediately investigate',
                'Verify administrative access',
                'Review privilege changes'
            ],
            [AlertType.DATA_EXFILTRATION]: [
                'Block data export temporarily',
                'Investigate data access patterns',
                'Contact security team immediately'
            ],
            [AlertType.BRUTE_FORCE_ATTACK]: [
                'Block IP address',
                'Implement rate limiting',
                'Alert security team'
            ],
            [AlertType.ACCOUNT_TAKEOVER]: [
                'Immediately suspend account',
                'Force password reset',
                'Contact account owner'
            ],
            [AlertType.UNUSUAL_ACTIVITY_VOLUME]: [
                'Monitor activity patterns',
                'Check for automation',
                'Review access logs'
            ],
            [AlertType.INSIDER_THREAT]: [
                'Escalate to security team',
                'Monitor all user activity',
                'Consider access restrictions'
            ],
            [AlertType.COMPLIANCE_VIOLATION]: [
                'Review compliance policies',
                'Document violation details',
                'Report to compliance team'
            ],
            [AlertType.POLICY_VIOLATION]: [
                'Review policy violations',
                'Document incident details',
                'Implement corrective actions'
            ]
        };
        return actions[alertType] || ['Investigate activity', 'Monitor user behavior'];
    }
    updateRecentActivities(activity) {
        const key = `${activity.userId}:${activity.tenantId}`;
        const activities = this.recentActivities.get(key) || [];
        activities.push(activity);
        // Keep only last 1000 activities or activities from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filtered = activities
            .filter(a => a.timestamp > oneDayAgo)
            .slice(-1000);
        this.recentActivities.set(key, filtered);
    }
    getRecentUserActivities(userId, timeWindow) {
        const activities = this.recentActivities.get(`${userId}:*`) || [];
        const cutoff = new Date(Date.now() - timeWindow);
        return activities.filter(a => a.timestamp > cutoff);
    }
    isLocationAnomaly(activity, baseline) {
        if (!activity.location)
            return false;
        const location = `${activity.location.city}, ${activity.location.country}`;
        return !baseline.profile.commonLocations.includes(location);
    }
    isTimeAnomaly(activity, baseline) {
        const hour = activity.timestamp.getHours();
        return !baseline.profile.typicalHours.includes(hour);
    }
    isVolumeAnomaly(activities, baseline) {
        return activities.length > baseline.profile.normalActivityVolume * 2;
    }
    isDeviceAnomaly(activity, baseline) {
        if (!activity.deviceInfo)
            return false;
        const deviceType = activity.deviceInfo.deviceType;
        return !baseline.profile.typicalDevices.includes(deviceType);
    }
    isPrivilegeEscalation(activity) {
        return activity.activityType === ActivityTrackingService_1.ActivityType.SYSTEM_ADMIN &&
            activity.action.includes('privilege') ||
            activity.action.includes('role_change');
    }
    isThreatExpired(threat) {
        return threat.expiresAt ? new Date() > threat.expiresAt : false;
    }
    calculateUserProfile(activities) {
        const hours = activities.map(a => a.timestamp.getHours());
        const locations = activities.map(a => a.location?.city).filter(Boolean);
        const devices = activities.map(a => a.deviceInfo?.deviceType).filter(Boolean);
        const activityTypes = activities.map(a => a.activityType);
        return {
            typicalHours: this.getMostCommon(hours),
            commonLocations: this.getMostCommon(locations),
            averageSessionDuration: 30 * 60 * 1000, // Simplified
            typicalDevices: this.getMostCommon(devices),
            normalActivityVolume: Math.ceil(activities.length / 30), // Per day average
            commonActivityTypes: this.getMostCommon(activityTypes)
        };
    }
    calculateUserStatistics(activities) {
        const riskScores = activities.map(a => a.riskScore || 0);
        const averageRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
        const complianceViolations = activities.filter(a => a.complianceFlags.length > 0).length;
        return {
            totalActivities: activities.length,
            averageRiskScore,
            complianceViolations,
            lastUpdated: new Date()
        };
    }
    calculateAnomalyThresholds(activities) {
        return {
            locationDeviation: 0.3,
            timeDeviation: 0.4,
            volumeDeviation: 2.0,
            riskScoreThreshold: 0.7
        };
    }
    getMostCommon(arr) {
        const counts = arr.reduce((acc, item) => {
            acc[String(item)] = (acc[String(item)] || 0) + 1;
            return acc;
        }, {});
        const sorted = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([item]) => item);
        return sorted;
    }
    async updateRuleFalsePositiveRate(alert) {
        // Update false positive rate for rules
        for (const rule of this.detectionRules.values()) {
            if (rule.alertType === alert.alertType) {
                const totalAlerts = Array.from(this.alerts.values())
                    .filter(a => a.alertType === rule.alertType).length;
                const falsePositives = Array.from(this.alerts.values())
                    .filter(a => a.alertType === rule.alertType && a.falsePositive).length;
                rule.falsePositiveRate = totalAlerts > 0 ? falsePositives / totalAlerts : 0;
            }
        }
    }
    initializeDefaultRules() {
        const defaultRules = [
            {
                name: 'Multiple Failed Logins',
                description: 'Detect multiple failed login attempts',
                alertType: AlertType.MULTIPLE_FAILED_LOGINS,
                severity: ActivityTrackingService_1.ActivitySeverity.HIGH,
                enabled: true,
                conditions: [
                    {
                        field: 'failed_login_count',
                        operator: 'greater_than',
                        value: 5,
                        weight: 1
                    },
                    {
                        field: 'activityType',
                        operator: 'equals',
                        value: ActivityTrackingService_1.ActivityType.AUTHENTICATION,
                        weight: 0.5
                    }
                ],
                actions: [
                    { type: 'alert', parameters: {} },
                    { type: 'block', parameters: { duration: 300000 } }
                ],
                threshold: 0.8,
                timeWindow: 15 * 60 * 1000, // 15 minutes
                cooldown: 5 * 60 * 1000 // 5 minutes
            },
            {
                name: 'Off-Hours Admin Access',
                description: 'Detect administrative access outside business hours',
                alertType: AlertType.OFF_HOURS_ACCESS,
                severity: ActivityTrackingService_1.ActivitySeverity.MEDIUM,
                enabled: true,
                conditions: [
                    {
                        field: 'activityType',
                        operator: 'equals',
                        value: ActivityTrackingService_1.ActivityType.SYSTEM_ADMIN,
                        weight: 1
                    }
                ],
                actions: [
                    { type: 'alert', parameters: {} }
                ],
                threshold: 1.0,
                timeWindow: 60 * 60 * 1000, // 1 hour
                cooldown: 30 * 60 * 1000 // 30 minutes
            }
        ];
        defaultRules.forEach(rule => this.createDetectionRule(rule));
    }
    startPeriodicAnalysis() {
        // Run batch analysis every 5 minutes
        setInterval(async () => {
            await this.runBatchAnalysis();
        }, 5 * 60 * 1000);
    }
    async runBatchAnalysis() {
        // Analyze patterns across all recent activities
        try {
            // Update baselines for active users
            await this.updateAllBaselines();
            // Clean up old data
            await this.cleanupOldData();
            this.emit('batchAnalysisCompleted');
        }
        catch (error) {
            console.error('Error in batch analysis:', error);
        }
    }
    async updateAllBaselines() {
        // Update baselines for users with recent activity
        const activeUsers = new Set();
        for (const activities of this.recentActivities.values()) {
            activities.forEach(activity => activeUsers.add(activity.userId));
        }
        for (const userId of activeUsers) {
            const userActivities = this.getAllUserActivities(userId);
            if (userActivities.length > 10) { // Minimum activities for baseline
                await this.updateUserBaseline(userId, userActivities);
            }
        }
    }
    getAllUserActivities(userId) {
        const allActivities = [];
        for (const activities of this.recentActivities.values()) {
            allActivities.push(...activities.filter(a => a.userId === userId));
        }
        return allActivities;
    }
    async cleanupOldData() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        // Clean up old alerts
        for (const [id, alert] of this.alerts) {
            if (alert.timestamp < sevenDaysAgo && alert.status === AlertStatus.RESOLVED) {
                this.alerts.delete(id);
            }
        }
        // Clean up expired threat intelligence
        for (const [key, threat] of this.threatIntelligence) {
            if (this.isThreatExpired(threat)) {
                this.threatIntelligence.delete(key);
            }
        }
    }
    async loadThreatIntelligence() {
        // Load threat intelligence from external sources
        // This would integrate with threat intelligence feeds in production
        const sampleThreats = [
            {
                type: 'ip_reputation',
                value: '192.168.1.100',
                severity: ActivityTrackingService_1.ActivitySeverity.HIGH,
                source: 'internal_blacklist',
                description: 'Known malicious IP from previous attacks',
                confidence: 0.9
            }
        ];
        for (const threat of sampleThreats) {
            await this.addThreatIntelligence(threat);
        }
    }
}
exports.SuspiciousActivityDetectionService = SuspiciousActivityDetectionService;

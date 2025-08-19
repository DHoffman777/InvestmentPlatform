"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountSecurityDashboardService = exports.AnomalyType = exports.FeatureStatus = exports.HealthStatus = exports.DashboardTheme = exports.FilterType = exports.NotificationFrequency = exports.NotificationType = exports.ThresholdCondition = exports.BenchmarkType = exports.TrendDirection = exports.TrendPeriod = exports.ImplementationStatus = exports.RiskCategory = exports.CertificationStatus = exports.AuditStatus = exports.AuditType = exports.AttestationStatus = exports.ViolationStatus = exports.ComplianceLevel = exports.ResourceType = exports.RecommendationStatus = exports.Effort = exports.Impact = exports.RecommendationCategory = exports.Priority = exports.RecommendationType = exports.ActionType = exports.AlertStatus = exports.AlertSource = exports.AlertType = exports.SessionStatus = exports.DeviceStatus = exports.TrustLevel = exports.DeviceType = exports.ActivityStatus = exports.ActivityOutcome = exports.Severity = exports.ActivityCategory = exports.ActivityType = exports.RiskLevel = exports.AccountStatus = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
// Enums
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "active";
    AccountStatus["SUSPENDED"] = "suspended";
    AccountStatus["LOCKED"] = "locked";
    AccountStatus["DISABLED"] = "disabled";
    AccountStatus["PENDING"] = "pending";
    AccountStatus["COMPROMISED"] = "compromised";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var ActivityType;
(function (ActivityType) {
    ActivityType["LOGIN"] = "login";
    ActivityType["LOGOUT"] = "logout";
    ActivityType["PASSWORD_CHANGE"] = "password_change";
    ActivityType["MFA_SETUP"] = "mfa_setup";
    ActivityType["MFA_VERIFICATION"] = "mfa_verification";
    ActivityType["PROFILE_UPDATE"] = "profile_update";
    ActivityType["PERMISSION_CHANGE"] = "permission_change";
    ActivityType["DATA_ACCESS"] = "data_access";
    ActivityType["TRADE_EXECUTION"] = "trade_execution";
    ActivityType["SETTINGS_CHANGE"] = "settings_change";
    ActivityType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var ActivityCategory;
(function (ActivityCategory) {
    ActivityCategory["AUTHENTICATION"] = "authentication";
    ActivityCategory["AUTHORIZATION"] = "authorization";
    ActivityCategory["DATA_ACCESS"] = "data_access";
    ActivityCategory["CONFIGURATION"] = "configuration";
    ActivityCategory["TRADING"] = "trading";
    ActivityCategory["COMPLIANCE"] = "compliance";
})(ActivityCategory || (exports.ActivityCategory = ActivityCategory = {}));
var Severity;
(function (Severity) {
    Severity["LOW"] = "low";
    Severity["MEDIUM"] = "medium";
    Severity["HIGH"] = "high";
    Severity["CRITICAL"] = "critical";
})(Severity || (exports.Severity = Severity = {}));
var ActivityOutcome;
(function (ActivityOutcome) {
    ActivityOutcome["SUCCESS"] = "success";
    ActivityOutcome["FAILURE"] = "failure";
    ActivityOutcome["BLOCKED"] = "blocked";
    ActivityOutcome["FLAGGED"] = "flagged";
})(ActivityOutcome || (exports.ActivityOutcome = ActivityOutcome = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["NORMAL"] = "normal";
    ActivityStatus["SUSPICIOUS"] = "suspicious";
    ActivityStatus["INVESTIGATED"] = "investigated";
    ActivityStatus["CLEARED"] = "cleared";
    ActivityStatus["CONFIRMED_MALICIOUS"] = "confirmed_malicious";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["DESKTOP"] = "desktop";
    DeviceType["LAPTOP"] = "laptop";
    DeviceType["MOBILE"] = "mobile";
    DeviceType["TABLET"] = "tablet";
    DeviceType["SERVER"] = "server";
    DeviceType["IOT"] = "iot";
    DeviceType["UNKNOWN"] = "unknown";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var TrustLevel;
(function (TrustLevel) {
    TrustLevel["UNKNOWN"] = "unknown";
    TrustLevel["LOW"] = "low";
    TrustLevel["MEDIUM"] = "medium";
    TrustLevel["HIGH"] = "high";
    TrustLevel["VERIFIED"] = "verified";
})(TrustLevel || (exports.TrustLevel = TrustLevel = {}));
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ACTIVE"] = "active";
    DeviceStatus["INACTIVE"] = "inactive";
    DeviceStatus["SUSPICIOUS"] = "suspicious";
    DeviceStatus["BLOCKED"] = "blocked";
    DeviceStatus["COMPROMISED"] = "compromised";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["ACTIVE"] = "active";
    SessionStatus["INACTIVE"] = "inactive";
    SessionStatus["EXPIRED"] = "expired";
    SessionStatus["TERMINATED"] = "terminated";
    SessionStatus["SUSPICIOUS"] = "suspicious";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var AlertType;
(function (AlertType) {
    AlertType["AUTHENTICATION_FAILURE"] = "authentication_failure";
    AlertType["UNUSUAL_ACTIVITY"] = "unusual_activity";
    AlertType["DATA_BREACH"] = "data_breach";
    AlertType["COMPLIANCE_VIOLATION"] = "compliance_violation";
    AlertType["SECURITY_POLICY_VIOLATION"] = "security_policy_violation";
    AlertType["MALWARE_DETECTION"] = "malware_detection";
    AlertType["INSIDER_THREAT"] = "insider_threat";
    AlertType["EXTERNAL_THREAT"] = "external_threat";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSource;
(function (AlertSource) {
    AlertSource["SYSTEM"] = "system";
    AlertSource["USER_BEHAVIOR"] = "user_behavior";
    AlertSource["NETWORK_MONITORING"] = "network_monitoring";
    AlertSource["THREAT_INTELLIGENCE"] = "threat_intelligence";
    AlertSource["COMPLIANCE_ENGINE"] = "compliance_engine";
    AlertSource["THIRD_PARTY"] = "third_party";
})(AlertSource || (exports.AlertSource = AlertSource = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["OPEN"] = "open";
    AlertStatus["INVESTIGATING"] = "investigating";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["FALSE_POSITIVE"] = "false_positive";
    AlertStatus["DISMISSED"] = "dismissed";
    AlertStatus["ESCALATED"] = "escalated";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var ActionType;
(function (ActionType) {
    ActionType["BLOCK_USER"] = "block_user";
    ActionType["TERMINATE_SESSION"] = "terminate_session";
    ActionType["REQUIRE_MFA"] = "require_mfa";
    ActionType["NOTIFY_ADMIN"] = "notify_admin";
    ActionType["LOG_EVENT"] = "log_event";
    ActionType["QUARANTINE_DEVICE"] = "quarantine_device";
})(ActionType || (exports.ActionType = ActionType = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["SECURITY_ENHANCEMENT"] = "security_enhancement";
    RecommendationType["COMPLIANCE_FIX"] = "compliance_fix";
    RecommendationType["PERFORMANCE_OPTIMIZATION"] = "performance_optimization";
    RecommendationType["POLICY_UPDATE"] = "policy_update";
    RecommendationType["TRAINING"] = "training";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["URGENT"] = "urgent";
    Priority["CRITICAL"] = "critical";
})(Priority || (exports.Priority = Priority = {}));
var RecommendationCategory;
(function (RecommendationCategory) {
    RecommendationCategory["AUTHENTICATION"] = "authentication";
    RecommendationCategory["AUTHORIZATION"] = "authorization";
    RecommendationCategory["DATA_PROTECTION"] = "data_protection";
    RecommendationCategory["NETWORK_SECURITY"] = "network_security";
    RecommendationCategory["MONITORING"] = "monitoring";
    RecommendationCategory["COMPLIANCE"] = "compliance";
    RecommendationCategory["TRAINING"] = "training";
})(RecommendationCategory || (exports.RecommendationCategory = RecommendationCategory = {}));
var Impact;
(function (Impact) {
    Impact["LOW"] = "low";
    Impact["MEDIUM"] = "medium";
    Impact["HIGH"] = "high";
})(Impact || (exports.Impact = Impact = {}));
var Effort;
(function (Effort) {
    Effort["LOW"] = "low";
    Effort["MEDIUM"] = "medium";
    Effort["HIGH"] = "high";
})(Effort || (exports.Effort = Effort = {}));
var RecommendationStatus;
(function (RecommendationStatus) {
    RecommendationStatus["NEW"] = "new";
    RecommendationStatus["IN_PROGRESS"] = "in_progress";
    RecommendationStatus["COMPLETED"] = "completed";
    RecommendationStatus["DISMISSED"] = "dismissed";
    RecommendationStatus["DEFERRED"] = "deferred";
})(RecommendationStatus || (exports.RecommendationStatus = RecommendationStatus = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["DOCUMENTATION"] = "documentation";
    ResourceType["TOOL"] = "tool";
    ResourceType["SERVICE"] = "service";
    ResourceType["TRAINING"] = "training";
    ResourceType["POLICY"] = "policy";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ComplianceLevel;
(function (ComplianceLevel) {
    ComplianceLevel["NON_COMPLIANT"] = "non_compliant";
    ComplianceLevel["PARTIALLY_COMPLIANT"] = "partially_compliant";
    ComplianceLevel["COMPLIANT"] = "compliant";
    ComplianceLevel["FULLY_COMPLIANT"] = "fully_compliant";
})(ComplianceLevel || (exports.ComplianceLevel = ComplianceLevel = {}));
var ViolationStatus;
(function (ViolationStatus) {
    ViolationStatus["OPEN"] = "open";
    ViolationStatus["IN_REMEDIATION"] = "in_remediation";
    ViolationStatus["RESOLVED"] = "resolved";
    ViolationStatus["ACCEPTED"] = "accepted";
    ViolationStatus["DEFERRED"] = "deferred";
})(ViolationStatus || (exports.ViolationStatus = ViolationStatus = {}));
var AttestationStatus;
(function (AttestationStatus) {
    AttestationStatus["PENDING"] = "pending";
    AttestationStatus["ATTESTED"] = "attested";
    AttestationStatus["REJECTED"] = "rejected";
    AttestationStatus["EXPIRED"] = "expired";
})(AttestationStatus || (exports.AttestationStatus = AttestationStatus = {}));
var AuditType;
(function (AuditType) {
    AuditType["INTERNAL"] = "internal";
    AuditType["EXTERNAL"] = "external";
    AuditType["THIRD_PARTY"] = "third_party";
    AuditType["REGULATORY"] = "regulatory";
})(AuditType || (exports.AuditType = AuditType = {}));
var AuditStatus;
(function (AuditStatus) {
    AuditStatus["PLANNED"] = "planned";
    AuditStatus["IN_PROGRESS"] = "in_progress";
    AuditStatus["COMPLETED"] = "completed";
    AuditStatus["FAILED"] = "failed";
    AuditStatus["CANCELLED"] = "cancelled";
})(AuditStatus || (exports.AuditStatus = AuditStatus = {}));
var CertificationStatus;
(function (CertificationStatus) {
    CertificationStatus["VALID"] = "valid";
    CertificationStatus["EXPIRED"] = "expired";
    CertificationStatus["SUSPENDED"] = "suspended";
    CertificationStatus["REVOKED"] = "revoked";
})(CertificationStatus || (exports.CertificationStatus = CertificationStatus = {}));
var RiskCategory;
(function (RiskCategory) {
    RiskCategory["AUTHENTICATION"] = "authentication";
    RiskCategory["DATA_SECURITY"] = "data_security";
    RiskCategory["NETWORK_SECURITY"] = "network_security";
    RiskCategory["OPERATIONAL"] = "operational";
    RiskCategory["COMPLIANCE"] = "compliance";
    RiskCategory["REPUTATION"] = "reputation";
    RiskCategory["FINANCIAL"] = "financial";
})(RiskCategory || (exports.RiskCategory = RiskCategory = {}));
var ImplementationStatus;
(function (ImplementationStatus) {
    ImplementationStatus["NOT_STARTED"] = "not_started";
    ImplementationStatus["PLANNED"] = "planned";
    ImplementationStatus["IN_PROGRESS"] = "in_progress";
    ImplementationStatus["IMPLEMENTED"] = "implemented";
    ImplementationStatus["VERIFIED"] = "verified";
})(ImplementationStatus || (exports.ImplementationStatus = ImplementationStatus = {}));
var TrendPeriod;
(function (TrendPeriod) {
    TrendPeriod["DAILY"] = "daily";
    TrendPeriod["WEEKLY"] = "weekly";
    TrendPeriod["MONTHLY"] = "monthly";
    TrendPeriod["QUARTERLY"] = "quarterly";
})(TrendPeriod || (exports.TrendPeriod = TrendPeriod = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["INCREASING"] = "increasing";
    TrendDirection["DECREASING"] = "decreasing";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["VOLATILE"] = "volatile";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var BenchmarkType;
(function (BenchmarkType) {
    BenchmarkType["PEER_GROUP"] = "peer_group";
    BenchmarkType["INDUSTRY"] = "industry";
    BenchmarkType["REGULATORY"] = "regulatory";
    BenchmarkType["INTERNAL"] = "internal";
})(BenchmarkType || (exports.BenchmarkType = BenchmarkType = {}));
var ThresholdCondition;
(function (ThresholdCondition) {
    ThresholdCondition["GREATER_THAN"] = "greater_than";
    ThresholdCondition["LESS_THAN"] = "less_than";
    ThresholdCondition["EQUALS"] = "equals";
    ThresholdCondition["NOT_EQUALS"] = "not_equals";
    ThresholdCondition["CONTAINS"] = "contains";
})(ThresholdCondition || (exports.ThresholdCondition = ThresholdCondition = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ALERT"] = "alert";
    NotificationType["RECOMMENDATION"] = "recommendation";
    NotificationType["COMPLIANCE"] = "compliance";
    NotificationType["RISK_CHANGE"] = "risk_change";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationFrequency;
(function (NotificationFrequency) {
    NotificationFrequency["IMMEDIATE"] = "immediate";
    NotificationFrequency["HOURLY"] = "hourly";
    NotificationFrequency["DAILY"] = "daily";
    NotificationFrequency["WEEKLY"] = "weekly";
})(NotificationFrequency || (exports.NotificationFrequency = NotificationFrequency = {}));
var FilterType;
(function (FilterType) {
    FilterType["TIME_RANGE"] = "time_range";
    FilterType["SEVERITY"] = "severity";
    FilterType["CATEGORY"] = "category";
    FilterType["STATUS"] = "status";
    FilterType["DEVICE_TYPE"] = "device_type";
})(FilterType || (exports.FilterType = FilterType = {}));
var DashboardTheme;
(function (DashboardTheme) {
    DashboardTheme["LIGHT"] = "light";
    DashboardTheme["DARK"] = "dark";
    DashboardTheme["AUTO"] = "auto";
})(DashboardTheme || (exports.DashboardTheme = DashboardTheme = {}));
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["WARNING"] = "warning";
    HealthStatus["CRITICAL"] = "critical";
    HealthStatus["UNKNOWN"] = "unknown";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
var FeatureStatus;
(function (FeatureStatus) {
    FeatureStatus["ENABLED"] = "enabled";
    FeatureStatus["DISABLED"] = "disabled";
    FeatureStatus["UNAVAILABLE"] = "unavailable";
    FeatureStatus["ERROR"] = "error";
})(FeatureStatus || (exports.FeatureStatus = FeatureStatus = {}));
var AnomalyType;
(function (AnomalyType) {
    AnomalyType["UNUSUAL_LOCATION"] = "unusual_location";
    AnomalyType["UNUSUAL_TIME"] = "unusual_time";
    AnomalyType["UNUSUAL_DEVICE"] = "unusual_device";
    AnomalyType["UNUSUAL_ACTIVITY_PATTERN"] = "unusual_activity_pattern";
    AnomalyType["CONCURRENT_SESSIONS"] = "concurrent_sessions";
    AnomalyType["RAPID_REQUESTS"] = "rapid_requests";
})(AnomalyType || (exports.AnomalyType = AnomalyType = {}));
class AccountSecurityDashboardService extends events_1.EventEmitter {
    dashboards = new Map();
    securityActivities = new Map();
    deviceRegistry = new Map();
    activeSessions = new Map();
    alertQueue = new Map();
    constructor() {
        super();
        this.initializeService();
    }
    async getDashboard(userId, tenantId) {
        const dashboardKey = `${userId}_${tenantId}`;
        let dashboard = this.dashboards.get(dashboardKey);
        if (!dashboard) {
            dashboard = await this.createDashboard(userId, tenantId);
        }
        else {
            // Refresh dashboard data if needed
            if (this.shouldRefreshDashboard(dashboard)) {
                await this.refreshDashboard(dashboard);
            }
        }
        return dashboard;
    }
    async createDashboard(userId, tenantId) {
        const dashboardKey = `${userId}_${tenantId}`;
        const dashboard = {
            id: (0, crypto_1.randomUUID)(),
            userId,
            tenantId,
            overview: await this.generateSecurityOverview(userId, tenantId),
            activities: await this.getRecentSecurityActivities(userId, tenantId, 50),
            devices: await this.getUserDevices(userId, tenantId),
            sessions: await this.getActiveSessions(userId, tenantId),
            alerts: await this.getActiveAlerts(userId, tenantId),
            recommendations: await this.generateRecommendations(userId, tenantId),
            complianceStatus: await this.getComplianceStatus(userId, tenantId),
            riskScore: await this.calculateRiskScore(userId, tenantId),
            settings: this.getDefaultDashboardSettings(),
            lastUpdated: new Date(),
            refreshInterval: 300 // 5 minutes
        };
        this.dashboards.set(dashboardKey, dashboard);
        this.emit('dashboardCreated', dashboard);
        return dashboard;
    }
    async addSecurityActivity(userId, tenantId, activity) {
        const newActivity = {
            id: (0, crypto_1.randomUUID)(),
            riskScore: await this.calculateActivityRiskScore(activity, userId),
            flagged: false,
            investigated: false,
            status: ActivityStatus.NORMAL,
            ...activity
        };
        // Analyze activity for suspicious patterns
        const analysisResult = await this.analyzeActivity(newActivity, userId);
        newActivity.flagged = analysisResult.flagged;
        newActivity.status = analysisResult.status;
        newActivity.riskScore = analysisResult.riskScore;
        const userKey = `${userId}_${tenantId}`;
        if (!this.securityActivities.has(userKey)) {
            this.securityActivities.set(userKey, []);
        }
        this.securityActivities.get(userKey).push(newActivity);
        // Generate alerts if necessary
        if (newActivity.flagged || newActivity.severity === Severity.HIGH || newActivity.severity === Severity.CRITICAL) {
            await this.generateSecurityAlert(userId, tenantId, newActivity);
        }
        // Update dashboard
        const dashboard = await this.getDashboard(userId, tenantId);
        if (dashboard) {
            dashboard.activities.unshift(newActivity);
            if (dashboard.activities.length > 100) {
                dashboard.activities = dashboard.activities.slice(0, 100);
            }
            dashboard.lastUpdated = new Date();
        }
        this.emit('securityActivityAdded', { userId, tenantId, activity: newActivity });
        return newActivity;
    }
    async registerDevice(userId, tenantId, device) {
        const newDevice = {
            id: (0, crypto_1.randomUUID)(),
            riskScore: await this.calculateDeviceRiskScore(device),
            securityFeatures: await this.detectSecurityFeatures(device),
            status: DeviceStatus.ACTIVE,
            ...device
        };
        const userKey = `${userId}_${tenantId}`;
        if (!this.deviceRegistry.has(userKey)) {
            this.deviceRegistry.set(userKey, []);
        }
        this.deviceRegistry.get(userKey).push(newDevice);
        // Update dashboard
        const dashboard = await this.getDashboard(userId, tenantId);
        if (dashboard) {
            dashboard.devices.push(newDevice);
            dashboard.lastUpdated = new Date();
        }
        this.emit('deviceRegistered', { userId, tenantId, device: newDevice });
        return newDevice;
    }
    async createSession(userId, tenantId, sessionData) {
        const session = {
            id: (0, crypto_1.randomUUID)(),
            riskScore: await this.calculateSessionRiskScore(sessionData, userId),
            anomalies: await this.detectSessionAnomalies(sessionData, userId),
            ...sessionData
        };
        const userKey = `${userId}_${tenantId}`;
        if (!this.activeSessions.has(userKey)) {
            this.activeSessions.set(userKey, []);
        }
        this.activeSessions.get(userKey).push(session);
        // Generate alerts for high-risk sessions
        if (session.riskScore > 70 || session.anomalies.length > 0) {
            await this.generateSessionAlert(userId, tenantId, session);
        }
        this.emit('sessionCreated', { userId, tenantId, session });
        return session;
    }
    async terminateSession(userId, tenantId, sessionId, reason) {
        const userKey = `${userId}_${tenantId}`;
        const sessions = this.activeSessions.get(userKey) || [];
        const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
        if (sessionIndex === -1)
            return false;
        const session = sessions[sessionIndex];
        session.status = SessionStatus.TERMINATED;
        session.lastActivity = new Date();
        session.duration = Date.now() - session.startTime.getTime();
        // Log termination activity
        await this.addSecurityActivity(userId, tenantId, {
            timestamp: new Date(),
            type: ActivityType.LOGOUT,
            category: ActivityCategory.AUTHENTICATION,
            severity: Severity.LOW,
            description: `Session terminated: ${reason}`,
            details: {
                sessionId,
                reason,
                userAgent: session.metadata.userAgent || 'unknown',
                requestId: (0, crypto_1.randomUUID)()
            },
            location: session.location,
            device: this.getUserDevices(userId, tenantId).then(devices => devices.find(d => d.deviceId === session.deviceId) || {}),
            outcome: ActivityOutcome.SUCCESS,
            tags: ['session_termination'],
            metadata: { reason, terminatedBy: 'system' }
        });
        sessions.splice(sessionIndex, 1);
        this.emit('sessionTerminated', { userId, tenantId, sessionId, reason });
        return true;
    }
    async generateSecurityReport(userId, tenantId, timeRange, format = 'json') {
        const dashboard = await this.getDashboard(userId, tenantId);
        if (!dashboard) {
            throw new Error('Dashboard not found');
        }
        const activities = await this.getSecurityActivities(userId, tenantId, {
            startDate: timeRange.start,
            endDate: timeRange.end
        });
        const report = {
            reportId: (0, crypto_1.randomUUID)(),
            generatedAt: new Date(),
            userId,
            tenantId,
            timeRange,
            summary: {
                totalActivities: activities.length,
                securityScore: dashboard.overview.securityScore,
                riskLevel: dashboard.overview.riskLevel,
                complianceScore: dashboard.overview.complianceScore,
                activeAlerts: dashboard.alerts.filter(a => a.status === AlertStatus.OPEN).length,
                recommendations: dashboard.recommendations.length
            },
            breakdown: {
                activitiesByType: this.groupActivitiesByType(activities),
                activitiesByCategory: this.groupActivitiesByCategory(activities),
                activitiesBySeverity: this.groupActivitiesBySeverity(activities),
                topRiskFactors: dashboard.riskScore.factors.slice(0, 10),
                deviceSummary: this.summarizeDevices(dashboard.devices),
                sessionSummary: this.summarizeSessions(dashboard.sessions)
            },
            trends: {
                riskScoreHistory: dashboard.riskScore.history,
                activityTrends: this.calculateActivityTrends(activities),
                complianceTrends: this.calculateComplianceTrends(dashboard.complianceStatus)
            },
            recommendations: dashboard.recommendations.filter(r => r.status === RecommendationStatus.NEW),
            alerts: dashboard.alerts.filter(a => a.status === AlertStatus.OPEN),
            metadata: {
                format,
                version: '1.0',
                generatedBy: 'AccountSecurityDashboardService'
            }
        };
        this.emit('securityReportGenerated', { userId, tenantId, reportId: report.reportId, format });
        return report;
    }
    async updateDashboardSettings(userId, tenantId, settings) {
        const dashboard = await this.getDashboard(userId, tenantId);
        if (!dashboard)
            return null;
        dashboard.settings = { ...dashboard.settings, ...settings };
        dashboard.lastUpdated = new Date();
        this.emit('dashboardSettingsUpdated', { userId, tenantId, settings });
        return dashboard.settings;
    }
    async generateSecurityOverview(userId, tenantId) {
        const activities = await this.getRecentSecurityActivities(userId, tenantId, 1000);
        const devices = await this.getUserDevices(userId, tenantId);
        const sessions = await this.getActiveSessions(userId, tenantId);
        const lastLogin = activities
            .filter(a => a.type === ActivityType.LOGIN && a.outcome === ActivityOutcome.SUCCESS)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp || new Date();
        const failedLogins = activities
            .filter(a => a.type === ActivityType.LOGIN && a.outcome === ActivityOutcome.FAILURE)
            .length;
        const passwordChanges = activities
            .filter(a => a.type === ActivityType.PASSWORD_CHANGE)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return {
            accountStatus: AccountStatus.ACTIVE,
            lastLogin,
            loginCount: activities.filter(a => a.type === ActivityType.LOGIN).length,
            failedLoginAttempts: failedLogins,
            passwordLastChanged: passwordChanges[0]?.timestamp || new Date(),
            mfaEnabled: activities.some(a => a.type === ActivityType.MFA_SETUP),
            trustedDevicesCount: devices.filter(d => d.isTrusted).length,
            activeSessions: sessions.filter(s => s.isActive).length,
            recentSecurityEvents: activities.filter(a => a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
            riskLevel: this.calculateOverallRiskLevel(activities, devices, sessions),
            complianceScore: await this.calculateComplianceScore(userId, tenantId),
            securityScore: await this.calculateSecurityScore(userId, tenantId),
            healthIndicators: await this.generateHealthIndicators(userId, tenantId)
        };
    }
    async getRecentSecurityActivities(userId, tenantId, limit) {
        const userKey = `${userId}_${tenantId}`;
        const activities = this.securityActivities.get(userKey) || [];
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    async getUserDevices(userId, tenantId) {
        const userKey = `${userId}_${tenantId}`;
        return this.deviceRegistry.get(userKey) || [];
    }
    async getActiveSessions(userId, tenantId) {
        const userKey = `${userId}_${tenantId}`;
        return this.activeSessions.get(userKey) || [];
    }
    async getActiveAlerts(userId, tenantId) {
        const userKey = `${userId}_${tenantId}`;
        return this.alertQueue.get(userKey) || [];
    }
    async generateRecommendations(userId, tenantId) {
        const recommendations = [];
        const overview = await this.generateSecurityOverview(userId, tenantId);
        // Password recommendations
        if (!overview.mfaEnabled) {
            recommendations.push({
                id: (0, crypto_1.randomUUID)(),
                type: RecommendationType.SECURITY_ENHANCEMENT,
                priority: Priority.HIGH,
                title: 'Enable Multi-Factor Authentication',
                description: 'Add an extra layer of security to your account by enabling MFA',
                category: RecommendationCategory.AUTHENTICATION,
                impact: Impact.HIGH,
                effort: Effort.LOW,
                status: RecommendationStatus.NEW,
                progress: 0,
                steps: [
                    {
                        id: (0, crypto_1.randomUUID)(),
                        order: 1,
                        title: 'Choose MFA Method',
                        description: 'Select your preferred MFA method (SMS, Email, or Authenticator App)',
                        isCompleted: false,
                        estimatedTime: 5,
                        dependencies: [],
                        resources: []
                    },
                    {
                        id: (0, crypto_1.randomUUID)(),
                        order: 2,
                        title: 'Verify Setup',
                        description: 'Complete the verification process for your selected MFA method',
                        isCompleted: false,
                        estimatedTime: 10,
                        dependencies: [],
                        resources: []
                    }
                ],
                benefits: [
                    'Significantly reduces risk of unauthorized access',
                    'Meets compliance requirements',
                    'Protects against password-based attacks'
                ],
                risks: [
                    'Account lockout if MFA device is lost',
                    'Slightly increased login time'
                ],
                resources: [
                    {
                        type: ResourceType.DOCUMENTATION,
                        title: 'MFA Setup Guide',
                        description: 'Step-by-step guide for setting up MFA',
                        isRequired: true
                    }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        // Add more recommendations based on analysis
        if (overview.trustedDevicesCount === 0) {
            recommendations.push(this.createTrustedDeviceRecommendation());
        }
        if (overview.securityScore < 70) {
            recommendations.push(this.createSecurityImprovementRecommendation());
        }
        return recommendations;
    }
    async getComplianceStatus(userId, tenantId) {
        return {
            overall: ComplianceLevel.COMPLIANT,
            frameworks: [
                {
                    name: 'SOC 2',
                    version: '2017',
                    status: ComplianceLevel.COMPLIANT,
                    lastAssessment: new Date(),
                    score: 95,
                    requirements: [],
                    gaps: []
                }
            ],
            violations: [],
            attestations: [],
            audits: [],
            lastAssessment: new Date(),
            nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            certifications: [],
            policies: []
        };
    }
    async calculateRiskScore(userId, tenantId) {
        const activities = await this.getRecentSecurityActivities(userId, tenantId, 100);
        const devices = await this.getUserDevices(userId, tenantId);
        const sessions = await this.getActiveSessions(userId, tenantId);
        const components = [
            {
                category: RiskCategory.AUTHENTICATION,
                score: this.calculateAuthenticationRisk(activities),
                weight: 0.3,
                description: 'Risk from authentication-related activities',
                factors: ['failed_logins', 'weak_passwords', 'no_mfa'],
                mitigations: ['enable_mfa', 'strong_password_policy']
            },
            {
                category: RiskCategory.DATA_SECURITY,
                score: this.calculateDataSecurityRisk(activities),
                weight: 0.25,
                description: 'Risk from data access patterns',
                factors: ['unusual_data_access', 'large_downloads'],
                mitigations: ['access_controls', 'monitoring']
            },
            {
                category: RiskCategory.NETWORK_SECURITY,
                score: this.calculateNetworkSecurityRisk(devices, sessions),
                weight: 0.2,
                description: 'Risk from network and device security',
                factors: ['untrusted_devices', 'suspicious_locations'],
                mitigations: ['device_management', 'location_restrictions']
            }
        ];
        const overallScore = components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0);
        return {
            overall: Math.round(overallScore),
            components,
            history: [
                { timestamp: new Date(), score: overallScore, change: 0, reason: 'Initial calculation', factors: [] }
            ],
            factors: [],
            mitigations: [],
            trends: [],
            benchmarks: [],
            lastCalculated: new Date(),
            calculationMethod: 'weighted_components'
        };
    }
    getDefaultDashboardSettings() {
        return {
            refreshInterval: 300,
            alertThresholds: [
                {
                    metric: 'failed_logins',
                    condition: ThresholdCondition.GREATER_THAN,
                    value: 5,
                    severity: Severity.HIGH,
                    action: 'generate_alert',
                    isEnabled: true
                }
            ],
            visibleWidgets: ['overview', 'activities', 'alerts', 'recommendations'],
            widgetOrder: ['overview', 'activities', 'alerts', 'recommendations'],
            theme: DashboardTheme.LIGHT,
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD HH:mm:ss',
            autoRefresh: true,
            notifications: [],
            filters: [],
            customization: {
                layout: { columns: 12, rows: 8, responsive: true, spacing: 16 },
                colors: { primary: '#007bff', secondary: '#6c757d', success: '#28a745', warning: '#ffc107', danger: '#dc3545', info: '#17a2b8' },
                charts: [],
                widgets: [],
                branding: { logo: '', colors: { primary: '#007bff', secondary: '#6c757d', success: '#28a745', warning: '#ffc107', danger: '#dc3545', info: '#17a2b8' }, fonts: {} }
            }
        };
    }
    shouldRefreshDashboard(dashboard) {
        const timeSinceLastUpdate = Date.now() - dashboard.lastUpdated.getTime();
        return timeSinceLastUpdate > (dashboard.refreshInterval * 1000);
    }
    async refreshDashboard(dashboard) {
        dashboard.overview = await this.generateSecurityOverview(dashboard.userId, dashboard.tenantId);
        dashboard.activities = await this.getRecentSecurityActivities(dashboard.userId, dashboard.tenantId, 50);
        dashboard.devices = await this.getUserDevices(dashboard.userId, dashboard.tenantId);
        dashboard.sessions = await this.getActiveSessions(dashboard.userId, dashboard.tenantId);
        dashboard.alerts = await this.getActiveAlerts(dashboard.userId, dashboard.tenantId);
        dashboard.recommendations = await this.generateRecommendations(dashboard.userId, dashboard.tenantId);
        dashboard.riskScore = await this.calculateRiskScore(dashboard.userId, dashboard.tenantId);
        dashboard.lastUpdated = new Date();
    }
    async calculateActivityRiskScore(activity, userId) {
        let score = 0;
        // Base score by activity type
        switch (activity.type) {
            case ActivityType.LOGIN:
                score = activity.outcome === ActivityOutcome.FAILURE ? 30 : 10;
                break;
            case ActivityType.SUSPICIOUS_ACTIVITY:
                score = 80;
                break;
            case ActivityType.PASSWORD_CHANGE:
                score = 20;
                break;
            default:
                score = 15;
        }
        // Adjust by severity
        switch (activity.severity) {
            case Severity.CRITICAL:
                score *= 2;
                break;
            case Severity.HIGH:
                score *= 1.5;
                break;
            case Severity.LOW:
                score *= 0.7;
                break;
        }
        return Math.min(100, Math.max(0, score));
    }
    async analyzeActivity(activity, userId) {
        let flagged = false;
        let status = ActivityStatus.NORMAL;
        let riskScore = activity.riskScore;
        // Check for suspicious patterns
        if (activity.type === ActivityType.LOGIN && activity.outcome === ActivityOutcome.FAILURE) {
            const recentFailures = await this.getRecentFailedLogins(userId);
            if (recentFailures >= 5) {
                flagged = true;
                status = ActivityStatus.SUSPICIOUS;
                riskScore = Math.min(100, riskScore + 30);
            }
        }
        // Check for unusual locations
        if (activity.location && await this.isUnusualLocation(userId, activity.location)) {
            flagged = true;
            status = ActivityStatus.SUSPICIOUS;
            riskScore = Math.min(100, riskScore + 25);
        }
        return { flagged, status, riskScore };
    }
    async generateSecurityAlert(userId, tenantId, activity) {
        const alert = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            type: this.getAlertTypeFromActivity(activity),
            severity: activity.severity,
            title: `Security Alert: ${activity.type}`,
            description: activity.description,
            source: AlertSource.SYSTEM,
            triggerEvent: activity.id,
            affectedResources: [userId],
            riskScore: activity.riskScore,
            confidence: 0.8,
            status: AlertStatus.OPEN,
            actions: [],
            tags: activity.tags,
            metadata: activity.metadata
        };
        const userKey = `${userId}_${tenantId}`;
        if (!this.alertQueue.has(userKey)) {
            this.alertQueue.set(userKey, []);
        }
        this.alertQueue.get(userKey).push(alert);
        this.emit('securityAlertGenerated', { userId, tenantId, alert });
    }
    async getSecurityActivities(userId, tenantId, filter = {}) {
        const userKey = `${userId}_${tenantId}`;
        let activities = this.securityActivities.get(userKey) || [];
        if (filter.startDate) {
            activities = activities.filter(a => a.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            activities = activities.filter(a => a.timestamp <= filter.endDate);
        }
        if (filter.type) {
            activities = activities.filter(a => a.type === filter.type);
        }
        if (filter.category) {
            activities = activities.filter(a => a.category === filter.category);
        }
        return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    // Helper methods for report generation
    groupActivitiesByType(activities) {
        return activities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
        }, {});
    }
    groupActivitiesByCategory(activities) {
        return activities.reduce((acc, activity) => {
            acc[activity.category] = (acc[activity.category] || 0) + 1;
            return acc;
        }, {});
    }
    groupActivitiesBySeverity(activities) {
        return activities.reduce((acc, activity) => {
            acc[activity.severity] = (acc[activity.severity] || 0) + 1;
            return acc;
        }, {});
    }
    summarizeDevices(devices) {
        return {
            total: devices.length,
            trusted: devices.filter(d => d.isTrusted).length,
            active: devices.filter(d => d.isActive).length,
            byType: devices.reduce((acc, device) => {
                acc[device.type] = (acc[device.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
    summarizeSessions(sessions) {
        return {
            total: sessions.length,
            active: sessions.filter(s => s.isActive).length,
            averageDuration: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length,
            withAnomalies: sessions.filter(s => s.anomalies.length > 0).length
        };
    }
    calculateActivityTrends(activities) {
        // Simplified trend calculation
        const daily = activities.reduce((acc, activity) => {
            const date = activity.timestamp.toDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        return { daily };
    }
    calculateComplianceTrends(compliance) {
        return {
            score: compliance.frameworks.reduce((sum, fw) => sum + fw.score, 0) / compliance.frameworks.length,
            violations: compliance.violations.length,
            frameworks: compliance.frameworks.length
        };
    }
    // Additional helper methods
    calculateOverallRiskLevel(activities, devices, sessions) {
        const suspiciousActivities = activities.filter(a => a.status === ActivityStatus.SUSPICIOUS).length;
        const untrustedDevices = devices.filter(d => !d.isTrusted).length;
        const anomalousSessions = sessions.filter(s => s.anomalies.length > 0).length;
        const riskFactors = suspiciousActivities + untrustedDevices + anomalousSessions;
        if (riskFactors >= 10)
            return RiskLevel.CRITICAL;
        if (riskFactors >= 5)
            return RiskLevel.HIGH;
        if (riskFactors >= 2)
            return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
    async calculateComplianceScore(userId, tenantId) {
        // Simplified compliance score calculation
        return 85; // Would implement actual compliance checking
    }
    async calculateSecurityScore(userId, tenantId) {
        // Simplified security score calculation based on various factors
        let score = 100;
        const overview = await this.generateSecurityOverview(userId, tenantId);
        if (!overview.mfaEnabled)
            score -= 20;
        if (overview.failedLoginAttempts > 5)
            score -= 15;
        if (overview.trustedDevicesCount === 0)
            score -= 10;
        if (overview.activeSessions > 5)
            score -= 5;
        return Math.max(0, score);
    }
    async generateHealthIndicators(userId, tenantId) {
        return [
            {
                name: 'Authentication Health',
                status: HealthStatus.HEALTHY,
                score: 95,
                description: 'Authentication system is functioning normally',
                lastChecked: new Date(),
                trend: TrendDirection.STABLE,
                details: {}
            },
            {
                name: 'Session Security',
                status: HealthStatus.HEALTHY,
                score: 88,
                description: 'Active sessions are secure',
                lastChecked: new Date(),
                trend: TrendDirection.STABLE,
                details: {}
            }
        ];
    }
    async calculateDeviceRiskScore(device) {
        let score = 20; // Base score
        if (!device.isTrusted)
            score += 30;
        if (device.type === DeviceType.UNKNOWN)
            score += 20;
        return Math.min(100, score);
    }
    async detectSecurityFeatures(device) {
        // Mock security feature detection
        return [
            {
                name: 'Screen Lock',
                enabled: true,
                status: FeatureStatus.ENABLED,
                lastChecked: new Date()
            },
            {
                name: 'Device Encryption',
                enabled: true,
                status: FeatureStatus.ENABLED,
                lastChecked: new Date()
            }
        ];
    }
    async calculateSessionRiskScore(session, userId) {
        let score = 10; // Base score
        if (await this.isUnusualLocation(userId, session.location))
            score += 40;
        if (session.duration && session.duration > 8 * 60 * 60 * 1000)
            score += 20; // Long sessions
        return Math.min(100, score);
    }
    async detectSessionAnomalies(session, userId) {
        const anomalies = [];
        if (await this.isUnusualLocation(userId, session.location)) {
            anomalies.push({
                type: AnomalyType.UNUSUAL_LOCATION,
                description: 'Login from unusual location',
                severity: Severity.MEDIUM,
                confidence: 0.8,
                timestamp: new Date(),
                details: { location: session.location }
            });
        }
        return anomalies;
    }
    async generateSessionAlert(userId, tenantId, session) {
        const alert = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            type: AlertType.UNUSUAL_ACTIVITY,
            severity: session.anomalies.length > 0 ? Severity.HIGH : Severity.MEDIUM,
            title: 'Suspicious Session Detected',
            description: `High-risk session detected from ${session.location.city}, ${session.location.country}`,
            source: AlertSource.SYSTEM,
            triggerEvent: session.sessionId,
            affectedResources: [userId],
            riskScore: session.riskScore,
            confidence: 0.75,
            status: AlertStatus.OPEN,
            actions: [
                {
                    id: (0, crypto_1.randomUUID)(),
                    type: ActionType.TERMINATE_SESSION,
                    description: 'Terminate suspicious session',
                    automated: false,
                    parameters: { sessionId: session.sessionId }
                }
            ],
            tags: ['session', 'suspicious'],
            metadata: { sessionId: session.sessionId, deviceId: session.deviceId }
        };
        const userKey = `${userId}_${tenantId}`;
        if (!this.alertQueue.has(userKey)) {
            this.alertQueue.set(userKey, []);
        }
        this.alertQueue.get(userKey).push(alert);
        this.emit('sessionAlertGenerated', { userId, tenantId, alert });
    }
    getAlertTypeFromActivity(activity) {
        switch (activity.type) {
            case ActivityType.LOGIN:
                return activity.outcome === ActivityOutcome.FAILURE
                    ? AlertType.AUTHENTICATION_FAILURE
                    : AlertType.UNUSUAL_ACTIVITY;
            case ActivityType.SUSPICIOUS_ACTIVITY:
                return AlertType.UNUSUAL_ACTIVITY;
            default:
                return AlertType.UNUSUAL_ACTIVITY;
        }
    }
    async getRecentFailedLogins(userId) {
        const userKey = `${userId}_*`;
        // Simplified - would implement proper cross-tenant search
        return 3; // Mock value
    }
    async isUnusualLocation(userId, location) {
        // Simplified location analysis
        return location.country !== 'United States';
    }
    calculateAuthenticationRisk(activities) {
        const authActivities = activities.filter(a => a.category === ActivityCategory.AUTHENTICATION);
        const failedLogins = authActivities.filter(a => a.outcome === ActivityOutcome.FAILURE).length;
        const totalLogins = authActivities.filter(a => a.type === ActivityType.LOGIN).length;
        return totalLogins > 0 ? (failedLogins / totalLogins) * 100 : 0;
    }
    calculateDataSecurityRisk(activities) {
        const dataActivities = activities.filter(a => a.category === ActivityCategory.DATA_ACCESS);
        const suspiciousData = dataActivities.filter(a => a.status === ActivityStatus.SUSPICIOUS).length;
        return dataActivities.length > 0 ? (suspiciousData / dataActivities.length) * 100 : 0;
    }
    calculateNetworkSecurityRisk(devices, sessions) {
        const untrustedDevices = devices.filter(d => !d.isTrusted).length;
        const totalDevices = devices.length;
        const anomalousSessions = sessions.filter(s => s.anomalies.length > 0).length;
        const totalSessions = sessions.length;
        const deviceRisk = totalDevices > 0 ? (untrustedDevices / totalDevices) * 50 : 0;
        const sessionRisk = totalSessions > 0 ? (anomalousSessions / totalSessions) * 50 : 0;
        return deviceRisk + sessionRisk;
    }
    createTrustedDeviceRecommendation() {
        return {
            id: (0, crypto_1.randomUUID)(),
            type: RecommendationType.SECURITY_ENHANCEMENT,
            priority: Priority.MEDIUM,
            title: 'Set Up Trusted Devices',
            description: 'Mark your regularly used devices as trusted to improve security and user experience',
            category: RecommendationCategory.AUTHENTICATION,
            impact: Impact.MEDIUM,
            effort: Effort.LOW,
            status: RecommendationStatus.NEW,
            progress: 0,
            steps: [],
            benefits: ['Reduced authentication friction', 'Improved security monitoring'],
            risks: ['Device compromise risk'],
            resources: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createSecurityImprovementRecommendation() {
        return {
            id: (0, crypto_1.randomUUID)(),
            type: RecommendationType.SECURITY_ENHANCEMENT,
            priority: Priority.HIGH,
            title: 'Improve Security Score',
            description: 'Take actions to improve your overall security posture',
            category: RecommendationCategory.AUTHENTICATION,
            impact: Impact.HIGH,
            effort: Effort.MEDIUM,
            status: RecommendationStatus.NEW,
            progress: 0,
            steps: [],
            benefits: ['Better account protection', 'Compliance improvement'],
            risks: ['Minimal risk'],
            resources: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    initializeService() {
        // Start periodic cleanup of old data
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000); // Every hour
    }
    cleanupOldData() {
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
        // Clean up old activities
        for (const [key, activities] of this.securityActivities.entries()) {
            this.securityActivities.set(key, activities.filter(a => a.timestamp > cutoffDate));
        }
        // Clean up resolved alerts
        for (const [key, alerts] of this.alertQueue.entries()) {
            this.alertQueue.set(key, alerts.filter(a => a.status === AlertStatus.OPEN || a.timestamp > cutoffDate));
        }
    }
}
exports.AccountSecurityDashboardService = AccountSecurityDashboardService;

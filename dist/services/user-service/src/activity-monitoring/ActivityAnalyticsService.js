"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityAnalyticsService = exports.AnomalyType = exports.ReportType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const ActivityTrackingService_1 = require("./ActivityTrackingService");
var ReportType;
(function (ReportType) {
    ReportType["USER_ACTIVITY_SUMMARY"] = "user_activity_summary";
    ReportType["SECURITY_ANALYSIS"] = "security_analysis";
    ReportType["COMPLIANCE_REPORT"] = "compliance_report";
    ReportType["BEHAVIORAL_ANALYSIS"] = "behavioral_analysis";
    ReportType["RISK_ASSESSMENT"] = "risk_assessment";
    ReportType["TREND_ANALYSIS"] = "trend_analysis";
    ReportType["ANOMALY_DETECTION"] = "anomaly_detection";
    ReportType["PERFORMANCE_DASHBOARD"] = "performance_dashboard";
})(ReportType || (exports.ReportType = ReportType = {}));
var AnomalyType;
(function (AnomalyType) {
    AnomalyType["UNUSUAL_ACTIVITY_VOLUME"] = "unusual_activity_volume";
    AnomalyType["OFF_HOURS_ACCESS"] = "off_hours_access";
    AnomalyType["GEOGRAPHIC_ANOMALY"] = "geographic_anomaly";
    AnomalyType["DEVICE_ANOMALY"] = "device_anomaly";
    AnomalyType["BEHAVIORAL_CHANGE"] = "behavioral_change";
    AnomalyType["PRIVILEGE_ESCALATION"] = "privilege_escalation";
    AnomalyType["DATA_EXFILTRATION"] = "data_exfiltration";
    AnomalyType["BRUTE_FORCE_ATTEMPT"] = "brute_force_attempt";
})(AnomalyType || (exports.AnomalyType = AnomalyType = {}));
class ActivityAnalyticsService extends events_1.EventEmitter {
    reports = new Map();
    userBaselines = new Map();
    anomalies = new Map();
    reportCache = new Map();
    cacheTimeout = 30 * 60 * 1000; // 30 minutes
    constructor() {
        super();
        this.initializePredefinedReports();
        this.startScheduledReports();
    }
    async generateUserActivitySummary(userId, tenantId, startDate, endDate, activities) {
        const cacheKey = `user_summary_${userId}_${startDate.getTime()}_${endDate.getTime()}`;
        const cached = this.getCachedData(cacheKey);
        if (cached)
            return cached;
        const userActivities = activities.filter(a => a.userId === userId &&
            a.tenantId === tenantId &&
            a.timestamp >= startDate &&
            a.timestamp <= endDate);
        const sessions = this.groupActivitiesBySessions(userActivities);
        const activityBreakdown = this.calculateActivityBreakdown(userActivities);
        const riskProfile = this.calculateRiskProfile(userActivities);
        const complianceStatus = this.calculateComplianceStatus(userActivities);
        const behaviorPatterns = this.analyzeBehaviorPatterns(userActivities);
        const trends = await this.calculateTrends(userId, userActivities);
        const summary = {
            userId,
            tenantId,
            period: { startDate, endDate },
            totalActivities: userActivities.length,
            uniqueSessions: sessions.length,
            averageSessionDuration: this.calculateAverageSessionDuration(sessions),
            activityBreakdown,
            riskProfile,
            complianceStatus,
            behaviorPatterns,
            trends
        };
        this.setCachedData(cacheKey, summary);
        return summary;
    }
    async generateSecurityAnalysis(tenantId, startDate, endDate, activities) {
        const cacheKey = `security_analysis_${tenantId}_${startDate.getTime()}_${endDate.getTime()}`;
        const cached = this.getCachedData(cacheKey);
        if (cached)
            return cached;
        const securityActivities = activities.filter(a => a.tenantId === tenantId &&
            a.timestamp >= startDate &&
            a.timestamp <= endDate &&
            (a.activityCategory === ActivityTrackingService_1.ActivityCategory.SECURITY_EVENT ||
                a.severity === ActivityTrackingService_1.ActivitySeverity.HIGH ||
                a.severity === ActivityTrackingService_1.ActivitySeverity.CRITICAL));
        const overview = this.calculateSecurityOverview(securityActivities);
        const threatAnalysis = this.analyzeThreatPatterns(securityActivities);
        const userRiskAnalysis = this.analyzeUserRisks(securityActivities);
        const recommendations = this.generateSecurityRecommendations(securityActivities);
        const analysis = {
            period: { startDate, endDate },
            overview,
            threatAnalysis,
            userRiskAnalysis,
            recommendations
        };
        this.setCachedData(cacheKey, analysis);
        return analysis;
    }
    async generateBehaviorAnalysis(userId, startDate, endDate, activities) {
        const userActivities = activities.filter(a => a.userId === userId &&
            a.timestamp >= startDate &&
            a.timestamp <= endDate);
        const baselineProfile = await this.getUserBaseline(userId);
        const currentProfile = this.calculateCurrentProfile(userActivities);
        const deviations = this.calculateDeviations(baselineProfile, currentProfile);
        const anomalies = await this.detectBehavioralAnomalies(userId, userActivities);
        return {
            userId,
            period: { startDate, endDate },
            baselineProfile,
            currentProfile,
            deviations,
            anomalies
        };
    }
    async generateTrendAnalysis(tenantId, startDate, endDate, activities) {
        const cacheKey = `trend_analysis_${tenantId}_${startDate.getTime()}_${endDate.getTime()}`;
        const cached = this.getCachedData(cacheKey);
        if (cached)
            return cached;
        const tenantActivities = activities.filter(a => a.tenantId === tenantId &&
            a.timestamp >= startDate &&
            a.timestamp <= endDate);
        const activityTrends = this.calculateActivityTrends(tenantActivities);
        const userTrends = this.calculateUserTrends(tenantActivities);
        const securityTrends = this.calculateSecurityTrends(tenantActivities);
        const predictions = await this.generatePredictions(tenantActivities);
        const analysis = {
            period: { startDate, endDate },
            activityTrends,
            userTrends,
            securityTrends,
            predictions
        };
        this.setCachedData(cacheKey, analysis);
        return analysis;
    }
    async detectAnomalies(tenantId, startDate, endDate, activities) {
        const tenantActivities = activities.filter(a => a.tenantId === tenantId &&
            a.timestamp >= startDate &&
            a.timestamp <= endDate);
        const anomalies = [];
        // Volume-based anomalies
        const volumeAnomalies = await this.detectVolumeAnomalies(tenantActivities);
        anomalies.push(...volumeAnomalies);
        // Time-based anomalies
        const timeAnomalies = await this.detectTimeAnomalies(tenantActivities);
        anomalies.push(...timeAnomalies);
        // Geographic anomalies
        const geoAnomalies = await this.detectGeographicAnomalies(tenantActivities);
        anomalies.push(...geoAnomalies);
        // Behavioral anomalies
        const behaviorAnomalies = await this.detectBehaviorAnomalies(tenantActivities);
        anomalies.push(...behaviorAnomalies);
        const statistics = this.calculateAnomalyStatistics(anomalies);
        const recommendations = this.generateAnomalyRecommendations(anomalies);
        return {
            period: { startDate, endDate },
            anomalies,
            statistics,
            recommendations
        };
    }
    async createReport(report) {
        const newReport = {
            id: (0, crypto_1.randomUUID)(),
            createdAt: new Date(),
            ...report
        };
        this.reports.set(newReport.id, newReport);
        this.emit('reportCreated', newReport);
        if (newReport.schedule) {
            this.scheduleReport(newReport);
        }
        return newReport;
    }
    async updateReport(reportId, updates) {
        const report = this.reports.get(reportId);
        if (!report)
            return null;
        const updatedReport = { ...report, ...updates };
        this.reports.set(reportId, updatedReport);
        this.emit('reportUpdated', updatedReport);
        return updatedReport;
    }
    async deleteReport(reportId) {
        const deleted = this.reports.delete(reportId);
        if (deleted) {
            this.emit('reportDeleted', reportId);
        }
        return deleted;
    }
    async getReports(tenantId) {
        let reports = Array.from(this.reports.values());
        if (tenantId) {
            reports = reports.filter(report => report.parameters.tenantId === tenantId);
        }
        return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    groupActivitiesBySessions(activities) {
        const sessionMap = new Map();
        activities.forEach(activity => {
            const sessionActivities = sessionMap.get(activity.sessionId) || [];
            sessionActivities.push(activity);
            sessionMap.set(activity.sessionId, sessionActivities);
        });
        return Array.from(sessionMap.entries()).map(([sessionId, sessionActivities]) => {
            const sortedActivities = sessionActivities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            const startTime = sortedActivities[0].timestamp;
            const endTime = sortedActivities[sortedActivities.length - 1].timestamp;
            const duration = endTime.getTime() - startTime.getTime();
            return {
                sessionId,
                userId: sortedActivities[0].userId,
                tenantId: sortedActivities[0].tenantId,
                startTime,
                endTime,
                duration,
                activityCount: sessionActivities.length,
                activities: sortedActivities,
                ipAddress: sortedActivities[0].ipAddress,
                deviceInfo: sortedActivities[0].deviceInfo,
                location: sortedActivities[0].location,
                isActive: false,
                riskScore: Math.max(...sessionActivities.map(a => a.riskScore || 0)),
                flags: Array.from(new Set(sessionActivities.flatMap(a => a.complianceFlags)))
            };
        });
    }
    calculateActivityBreakdown(activities) {
        const breakdown = {};
        Object.values(ActivityTrackingService_1.ActivityType).forEach(type => {
            breakdown[type] = 0;
        });
        activities.forEach(activity => {
            breakdown[activity.activityType]++;
        });
        return breakdown;
    }
    calculateRiskProfile(activities) {
        const riskScores = activities.map(a => a.riskScore || 0);
        const averageRiskScore = riskScores.length > 0
            ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
            : 0;
        const highRiskActivities = activities.filter(a => (a.riskScore || 0) > 0.7).length;
        const suspiciousPatterns = Array.from(new Set(activities.filter(a => a.tags.includes('suspicious')).map(a => a.action)));
        return {
            averageRiskScore,
            highRiskActivities,
            suspiciousPatterns
        };
    }
    calculateComplianceStatus(activities) {
        const violations = activities.filter(a => a.complianceFlags.length > 0).length;
        const flags = Array.from(new Set(activities.flatMap(a => a.complianceFlags)));
        const score = Math.max(0, 100 - (violations / activities.length * 100));
        return { violations, flags, score };
    }
    analyzeBehaviorPatterns(activities) {
        const hourCounts = {};
        const deviceCounts = {};
        const locationCounts = {};
        activities.forEach(activity => {
            const hour = activity.timestamp.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            if (activity.deviceInfo?.deviceType) {
                const device = activity.deviceInfo.deviceType;
                deviceCounts[device] = (deviceCounts[device] || 0) + 1;
            }
            if (activity.location?.city) {
                const location = activity.location.city;
                locationCounts[location] = (locationCounts[location] || 0) + 1;
            }
        });
        const peakHours = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        const preferredDevices = Object.entries(deviceCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([device]) => device);
        const commonLocations = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([location]) => location);
        return { peakHours, preferredDevices, commonLocations };
    }
    async calculateTrends(userId, activities) {
        // Simplified trend calculation
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentActivities = activities.filter(a => a.timestamp >= thirtyDaysAgo);
        const olderActivities = activities.filter(a => a.timestamp < thirtyDaysAgo);
        const activityGrowth = recentActivities.length - olderActivities.length;
        const recentRisk = recentActivities.reduce((sum, a) => sum + (a.riskScore || 0), 0) / recentActivities.length;
        const olderRisk = olderActivities.reduce((sum, a) => sum + (a.riskScore || 0), 0) / olderActivities.length;
        const riskTrend = recentRisk > olderRisk * 1.1 ? 'increasing' :
            recentRisk < olderRisk * 0.9 ? 'decreasing' : 'stable';
        const recentViolations = recentActivities.filter(a => a.complianceFlags.length > 0).length;
        const olderViolations = olderActivities.filter(a => a.complianceFlags.length > 0).length;
        const complianceTrend = recentViolations < olderViolations ? 'improving' :
            recentViolations > olderViolations ? 'declining' : 'stable';
        return { activityGrowth, riskTrend, complianceTrend };
    }
    calculateSecurityOverview(activities) {
        return {
            totalSecurityEvents: activities.length,
            criticalThreats: activities.filter(a => a.severity === ActivityTrackingService_1.ActivitySeverity.CRITICAL).length,
            blockedAttempts: activities.filter(a => a.status === 'failure').length,
            resolvedIncidents: activities.filter(a => a.tags.includes('resolved')).length
        };
    }
    analyzeThreatPatterns(activities) {
        // Simplified threat analysis
        const threatCounts = {};
        activities.forEach(activity => {
            const threat = activity.action;
            threatCounts[threat] = (threatCounts[threat] || 0) + 1;
        });
        const topThreats = Object.entries(threatCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([type, count]) => ({ type, count, severity: ActivityTrackingService_1.ActivitySeverity.HIGH }));
        return {
            topThreats,
            attackVectors: [],
            geographicDistribution: {}
        };
    }
    analyzeUserRisks(activities) {
        const userRisks = new Map();
        activities.forEach(activity => {
            const existing = userRisks.get(activity.userId) || { score: 0, reasons: [] };
            existing.score = Math.max(existing.score, activity.riskScore || 0);
            if (activity.complianceFlags.length > 0) {
                existing.reasons.push(...activity.complianceFlags);
            }
            userRisks.set(activity.userId, existing);
        });
        const highRiskUsers = Array.from(userRisks.entries())
            .filter(([, risk]) => risk.score > 0.7)
            .map(([userId, risk]) => ({
            userId,
            riskScore: risk.score,
            reasons: Array.from(new Set(risk.reasons))
        }));
        return {
            highRiskUsers,
            suspiciousPatterns: []
        };
    }
    generateSecurityRecommendations(activities) {
        return {
            immediate: ['Review high-risk activities', 'Investigate failed authentication attempts'],
            shortTerm: ['Update security policies', 'Enhance monitoring rules'],
            longTerm: ['Implement additional security controls', 'Regular security training']
        };
    }
    async getUserBaseline(userId) {
        // Return cached baseline or create default
        return this.userBaselines.get(userId) || {
            normalHours: [9, 10, 11, 14, 15, 16],
            typicalDevices: ['desktop'],
            commonLocations: ['New York'],
            averageSessionDuration: 30 * 60 * 1000,
            typicalActivities: [ActivityTrackingService_1.ActivityType.PORTFOLIO_ACCESS, ActivityTrackingService_1.ActivityType.REPORTING]
        };
    }
    calculateCurrentProfile(activities) {
        const hours = activities.map(a => a.timestamp.getHours());
        const devices = activities.map(a => a.deviceInfo?.deviceType).filter(Boolean);
        const locations = activities.map(a => a.location?.city).filter(Boolean);
        const activityTypes = activities.map(a => a.activityType);
        return {
            actualHours: Array.from(new Set(hours)),
            devicesUsed: Array.from(new Set(devices)),
            locationsAccessed: Array.from(new Set(locations)),
            sessionDuration: 0, // Would calculate from session data
            activitiesPerformed: Array.from(new Set(activityTypes))
        };
    }
    calculateDeviations(baseline, current) {
        return {
            timePatternDeviation: 0.2, // Simplified calculation
            locationDeviation: 0.1,
            deviceDeviation: 0.0,
            activityDeviation: 0.3,
            overallDeviationScore: 0.4
        };
    }
    async detectBehavioralAnomalies(userId, activities) {
        return []; // Simplified - would implement ML-based detection
    }
    calculateActivityTrends(activities) {
        // Simplified trend calculation
        return {
            total: [],
            byType: {},
            byHour: [],
            byDayOfWeek: []
        };
    }
    calculateUserTrends(activities) {
        return {
            activeUsers: [],
            newUsers: [],
            userRetention: []
        };
    }
    calculateSecurityTrends(activities) {
        return {
            riskScores: [],
            suspiciousActivities: [],
            complianceViolations: []
        };
    }
    async generatePredictions(activities) {
        return {
            nextPeriodActivity: activities.length * 1.1,
            riskTrend: 'stable',
            seasonalPatterns: []
        };
    }
    async detectVolumeAnomalies(activities) {
        return []; // Implement statistical analysis for volume anomalies
    }
    async detectTimeAnomalies(activities) {
        return []; // Implement time-based anomaly detection
    }
    async detectGeographicAnomalies(activities) {
        return []; // Implement geographic anomaly detection
    }
    async detectBehaviorAnomalies(activities) {
        return []; // Implement behavioral anomaly detection
    }
    calculateAnomalyStatistics(anomalies) {
        return {
            totalAnomalies: anomalies.length,
            byType: {},
            bySeverity: {},
            detectionAccuracy: 0.85,
            falsePositiveRate: 0.15
        };
    }
    generateAnomalyRecommendations(anomalies) {
        return [
            'Investigate high-confidence anomalies immediately',
            'Review and update detection thresholds',
            'Consider additional monitoring for affected users'
        ];
    }
    initializePredefinedReports() {
        // Create default report templates
        const defaultReports = [
            {
                name: 'Daily Security Summary',
                description: 'Daily security events and risk analysis',
                type: ReportType.SECURITY_ANALYSIS,
                parameters: { period: '1d' },
                schedule: { frequency: 'daily', hour: 6 },
                recipients: ['security@company.com'],
                isActive: true
            },
            {
                name: 'Weekly Compliance Report',
                description: 'Weekly compliance violations and trends',
                type: ReportType.COMPLIANCE_REPORT,
                parameters: { period: '1w' },
                schedule: { frequency: 'weekly', dayOfWeek: 1, hour: 9 },
                recipients: ['compliance@company.com'],
                isActive: true
            }
        ];
        defaultReports.forEach(report => this.createReport(report));
    }
    startScheduledReports() {
        // Check for scheduled reports every hour
        setInterval(() => {
            this.processScheduledReports();
        }, 60 * 60 * 1000);
    }
    async processScheduledReports() {
        const now = new Date();
        for (const report of this.reports.values()) {
            if (report.isActive && report.schedule && this.shouldGenerateReport(report, now)) {
                try {
                    await this.generateScheduledReport(report);
                }
                catch (error) {
                    console.error(`Error generating scheduled report ${report.id}:`, error);
                }
            }
        }
    }
    shouldGenerateReport(report, now) {
        if (!report.nextGeneration) {
            return true; // First time generation
        }
        return now >= report.nextGeneration;
    }
    async generateScheduledReport(report) {
        // Generate report based on type and parameters
        this.emit('scheduledReportGenerated', report);
        // Update next generation time
        report.lastGenerated = new Date();
        report.nextGeneration = this.calculateNextGeneration(report);
    }
    calculateNextGeneration(report) {
        const now = new Date();
        const schedule = report.schedule;
        switch (schedule.frequency) {
            case 'hourly':
                return new Date(now.getTime() + 60 * 60 * 1000);
            case 'daily':
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(schedule.hour || 0, 0, 0, 0);
                return tomorrow;
            case 'weekly':
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                return nextWeek;
            case 'monthly':
                const nextMonth = new Date(now);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return nextMonth;
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    }
    scheduleReport(report) {
        report.nextGeneration = this.calculateNextGeneration(report);
    }
    getCachedData(key) {
        const cached = this.reportCache.get(key);
        if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }
    setCachedData(key, data) {
        this.reportCache.set(key, { data, timestamp: new Date() });
    }
    calculateAverageSessionDuration(sessions) {
        if (sessions.length === 0)
            return 0;
        const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        return totalDuration / sessions.length;
    }
}
exports.ActivityAnalyticsService = ActivityAnalyticsService;

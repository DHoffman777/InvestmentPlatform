import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { ActivityData, ActivityFilter, ActivitySeverity, ActivityType, ActivityCategory, ActivitySession } from './ActivityTrackingService';

export interface AnalyticsReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  parameters: Record<string, any>;
  schedule?: ScheduleConfig;
  recipients: string[];
  createdAt: Date;
  lastGenerated?: Date;
  nextGeneration?: Date;
  isActive: boolean;
}

export enum ReportType {
  USER_ACTIVITY_SUMMARY = 'user_activity_summary',
  SECURITY_ANALYSIS = 'security_analysis',
  COMPLIANCE_REPORT = 'compliance_report',
  BEHAVIORAL_ANALYSIS = 'behavioral_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  TREND_ANALYSIS = 'trend_analysis',
  ANOMALY_DETECTION = 'anomaly_detection',
  PERFORMANCE_DASHBOARD = 'performance_dashboard'
}

export interface ScheduleConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  timezone?: string;
}

export interface UserActivitySummary {
  userId: string;
  tenantId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalActivities: number;
  uniqueSessions: number;
  averageSessionDuration: number;
  activityBreakdown: Record<ActivityType, number>;
  riskProfile: {
    averageRiskScore: number;
    highRiskActivities: number;
    suspiciousPatterns: string[];
  };
  complianceStatus: {
    violations: number;
    flags: string[];
    score: number;
  };
  behaviorPatterns: {
    peakHours: number[];
    preferredDevices: string[];
    commonLocations: string[];
  };
  trends: {
    activityGrowth: number;
    riskTrend: 'increasing' | 'decreasing' | 'stable';
    complianceTrend: 'improving' | 'declining' | 'stable';
  };
}

export interface SecurityAnalysis {
  period: {
    startDate: Date;
    endDate: Date;
  };
  overview: {
    totalSecurityEvents: number;
    criticalThreats: number;
    blockedAttempts: number;
    resolvedIncidents: number;
  };
  threatAnalysis: {
    topThreats: Array<{ type: string; count: number; severity: ActivitySeverity }>;
    attackVectors: Array<{ vector: string; attempts: number }>;
    geographicDistribution: Record<string, number>;
  };
  userRiskAnalysis: {
    highRiskUsers: Array<{ userId: string; riskScore: number; reasons: string[] }>;
    suspiciousPatterns: Array<{ pattern: string; occurrences: number; users: string[] }>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface BehaviorAnalysis {
  userId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  baselineProfile: {
    normalHours: number[];
    typicalDevices: string[];
    commonLocations: string[];
    averageSessionDuration: number;
    typicalActivities: ActivityType[];
  };
  currentProfile: {
    actualHours: number[];
    devicesUsed: string[];
    locationsAccessed: string[];
    sessionDuration: number;
    activitiesPerformed: ActivityType[];
  };
  deviations: {
    timePatternDeviation: number;
    locationDeviation: number;
    deviceDeviation: number;
    activityDeviation: number;
    overallDeviationScore: number;
  };
  anomalies: Array<{
    type: string;
    description: string;
    severity: ActivitySeverity;
    confidence: number;
    timestamp: Date;
  }>;
}

export interface TrendAnalysis {
  period: {
    startDate: Date;
    endDate: Date;
  };
  activityTrends: {
    total: Array<{ date: Date; count: number }>;
    byType: Record<ActivityType, Array<{ date: Date; count: number }>>;
    byHour: Array<{ hour: number; count: number }>;
    byDayOfWeek: Array<{ day: number; count: number }>;
  };
  userTrends: {
    activeUsers: Array<{ date: Date; count: number }>;
    newUsers: Array<{ date: Date; count: number }>;
    userRetention: Array<{ date: Date; rate: number }>;
  };
  securityTrends: {
    riskScores: Array<{ date: Date; average: number; max: number }>;
    suspiciousActivities: Array<{ date: Date; count: number }>;
    complianceViolations: Array<{ date: Date; count: number }>;
  };
  predictions: {
    nextPeriodActivity: number;
    riskTrend: 'increasing' | 'decreasing' | 'stable';
    seasonalPatterns: Array<{ pattern: string; strength: number }>;
  };
}

export interface AnomalyDetectionResult {
  period: {
    startDate: Date;
    endDate: Date;
  };
  anomalies: Array<{
    id: string;
    type: AnomalyType;
    description: string;
    severity: ActivitySeverity;
    confidence: number;
    timestamp: Date;
    affectedUsers: string[];
    relatedActivities: string[];
    context: Record<string, any>;
    status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  }>;
  statistics: {
    totalAnomalies: number;
    byType: Record<AnomalyType, number>;
    bySeverity: Record<ActivitySeverity, number>;
    detectionAccuracy: number;
    falsePositiveRate: number;
  };
  recommendations: string[];
}

export enum AnomalyType {
  UNUSUAL_ACTIVITY_VOLUME = 'unusual_activity_volume',
  OFF_HOURS_ACCESS = 'off_hours_access',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  DEVICE_ANOMALY = 'device_anomaly',
  BEHAVIORAL_CHANGE = 'behavioral_change',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt'
}

export class ActivityAnalyticsService extends EventEmitter {
  private reports: Map<string, AnalyticsReport> = new Map();
  private userBaselines: Map<string, any> = new Map();
  private anomalies: Map<string, any[]> = new Map();
  private reportCache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheTimeout: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    super();
    this.initializePredefinedReports();
    this.startScheduledReports();
  }

  public async generateUserActivitySummary(
    userId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date,
    activities: ActivityData[]
  ): Promise<UserActivitySummary> {
    const cacheKey = `user_summary_${userId}_${startDate.getTime()}_${endDate.getTime()}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const userActivities = activities.filter(a => 
      a.userId === userId && 
      a.tenantId === tenantId &&
      a.timestamp >= startDate && 
      a.timestamp <= endDate
    );

    const sessions = this.groupActivitiesBySessions(userActivities);
    const activityBreakdown = this.calculateActivityBreakdown(userActivities);
    const riskProfile = this.calculateRiskProfile(userActivities);
    const complianceStatus = this.calculateComplianceStatus(userActivities);
    const behaviorPatterns = this.analyzeBehaviorPatterns(userActivities);
    const trends = await this.calculateTrends(userId, userActivities);

    const summary: UserActivitySummary = {
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

  public async generateSecurityAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    activities: ActivityData[]
  ): Promise<SecurityAnalysis> {
    const cacheKey = `security_analysis_${tenantId}_${startDate.getTime()}_${endDate.getTime()}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const securityActivities = activities.filter(a => 
      a.tenantId === tenantId &&
      a.timestamp >= startDate && 
      a.timestamp <= endDate &&
      (a.activityCategory === ActivityCategory.SECURITY_EVENT || 
       a.severity === ActivitySeverity.HIGH ||
       a.severity === ActivitySeverity.CRITICAL)
    );

    const overview = this.calculateSecurityOverview(securityActivities);
    const threatAnalysis = this.analyzeThreatPatterns(securityActivities);
    const userRiskAnalysis = this.analyzeUserRisks(securityActivities);
    const recommendations = this.generateSecurityRecommendations(securityActivities);

    const analysis: SecurityAnalysis = {
      period: { startDate, endDate },
      overview,
      threatAnalysis,
      userRiskAnalysis,
      recommendations
    };

    this.setCachedData(cacheKey, analysis);
    return analysis;
  }

  public async generateBehaviorAnalysis(
    userId: string,
    startDate: Date,
    endDate: Date,
    activities: ActivityData[]
  ): Promise<BehaviorAnalysis> {
    const userActivities = activities.filter(a => 
      a.userId === userId &&
      a.timestamp >= startDate && 
      a.timestamp <= endDate
    );

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

  public async generateTrendAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    activities: ActivityData[]
  ): Promise<TrendAnalysis> {
    const cacheKey = `trend_analysis_${tenantId}_${startDate.getTime()}_${endDate.getTime()}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const tenantActivities = activities.filter(a => 
      a.tenantId === tenantId &&
      a.timestamp >= startDate && 
      a.timestamp <= endDate
    );

    const activityTrends = this.calculateActivityTrends(tenantActivities);
    const userTrends = this.calculateUserTrends(tenantActivities);
    const securityTrends = this.calculateSecurityTrends(tenantActivities);
    const predictions = await this.generatePredictions(tenantActivities);

    const analysis: TrendAnalysis = {
      period: { startDate, endDate },
      activityTrends,
      userTrends,
      securityTrends,
      predictions
    };

    this.setCachedData(cacheKey, analysis);
    return analysis;
  }

  public async detectAnomalies(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    activities: ActivityData[]
  ): Promise<AnomalyDetectionResult> {
    const tenantActivities = activities.filter(a => 
      a.tenantId === tenantId &&
      a.timestamp >= startDate && 
      a.timestamp <= endDate
    );

    const anomalies: Array<any> = [];

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

  public async createReport(report: Omit<AnalyticsReport, 'id' | 'createdAt'>): Promise<AnalyticsReport> {
    const newReport: AnalyticsReport = {
      id: randomUUID(),
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

  public async updateReport(reportId: string, updates: Partial<AnalyticsReport>): Promise<AnalyticsReport | null> {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const updatedReport = { ...report, ...updates };
    this.reports.set(reportId, updatedReport);
    this.emit('reportUpdated', updatedReport);

    return updatedReport;
  }

  public async deleteReport(reportId: string): Promise<boolean> {
    const deleted = this.reports.delete(reportId);
    if (deleted) {
      this.emit('reportDeleted', reportId);
    }
    return deleted;
  }

  public async getReports(tenantId?: string): Promise<AnalyticsReport[]> {
    let reports = Array.from(this.reports.values());
    
    if (tenantId) {
      reports = reports.filter(report => 
        report.parameters.tenantId === tenantId
      );
    }

    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private groupActivitiesBySessions(activities: ActivityData[]): ActivitySession[] {
    const sessionMap = new Map<string, ActivityData[]>();

    activities.forEach(activity => {
      const sessionActivities = sessionMap.get(activity.sessionId) || [];
      sessionActivities.push(activity);
      sessionMap.set(activity.sessionId, sessionActivities);
    });

    return Array.from(sessionMap.entries()).map(([sessionId, sessionActivities]) => {
      const sortedActivities = sessionActivities.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );

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
        deviceInfo: sortedActivities[0].deviceInfo!,
        location: sortedActivities[0].location!,
        isActive: false,
        riskScore: Math.max(...sessionActivities.map(a => a.riskScore || 0)),
        flags: Array.from(new Set(sessionActivities.flatMap(a => a.complianceFlags)))
      };
    });
  }

  private calculateActivityBreakdown(activities: ActivityData[]): Record<ActivityType, number> {
    const breakdown: Record<ActivityType, number> = {} as Record<ActivityType, number>;
    
    Object.values(ActivityType).forEach(type => {
      breakdown[type] = 0;
    });

    activities.forEach(activity => {
      breakdown[activity.activityType]++;
    });

    return breakdown;
  }

  private calculateRiskProfile(activities: ActivityData[]): any {
    const riskScores = activities.map(a => a.riskScore || 0);
    const averageRiskScore = riskScores.length > 0 
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length 
      : 0;

    const highRiskActivities = activities.filter(a => (a.riskScore || 0) > 0.7).length;
    const suspiciousPatterns = Array.from(
      new Set(activities.filter(a => a.tags.includes('suspicious')).map(a => a.action))
    );

    return {
      averageRiskScore,
      highRiskActivities,
      suspiciousPatterns
    };
  }

  private calculateComplianceStatus(activities: ActivityData[]): any {
    const violations = activities.filter(a => a.complianceFlags.length > 0).length;
    const flags = Array.from(new Set(activities.flatMap(a => a.complianceFlags)));
    const score = Math.max(0, 100 - (violations / activities.length * 100));

    return { violations, flags, score };
  }

  private analyzeBehaviorPatterns(activities: ActivityData[]): any {
    const hourCounts: Record<number, number> = {};
    const deviceCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

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
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const preferredDevices = Object.entries(deviceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([device]) => device);

    const commonLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([location]) => location);

    return { peakHours, preferredDevices, commonLocations };
  }

  private async calculateTrends(userId: string, activities: ActivityData[]): Promise<any> {
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

  private calculateSecurityOverview(activities: ActivityData[]): any {
    return {
      totalSecurityEvents: activities.length,
      criticalThreats: activities.filter(a => a.severity === ActivitySeverity.CRITICAL).length,
      blockedAttempts: activities.filter(a => a.status === 'failure').length,
      resolvedIncidents: activities.filter(a => a.tags.includes('resolved')).length
    };
  }

  private analyzeThreatPatterns(activities: ActivityData[]): any {
    // Simplified threat analysis
    const threatCounts: Record<string, number> = {};
    activities.forEach(activity => {
      const threat = activity.action;
      threatCounts[threat] = (threatCounts[threat] || 0) + 1;
    });

    const topThreats = Object.entries(threatCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count, severity: ActivitySeverity.HIGH }));

    return {
      topThreats,
      attackVectors: [],
      geographicDistribution: {}
    };
  }

  private analyzeUserRisks(activities: ActivityData[]): any {
    const userRisks = new Map<string, { score: number; reasons: string[] }>();

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

  private generateSecurityRecommendations(activities: ActivityData[]): any {
    return {
      immediate: ['Review high-risk activities', 'Investigate failed authentication attempts'],
      shortTerm: ['Update security policies', 'Enhance monitoring rules'],
      longTerm: ['Implement additional security controls', 'Regular security training']
    };
  }

  private async getUserBaseline(userId: string): Promise<any> {
    // Return cached baseline or create default
    return this.userBaselines.get(userId) || {
      normalHours: [9, 10, 11, 14, 15, 16],
      typicalDevices: ['desktop'],
      commonLocations: ['New York'],
      averageSessionDuration: 30 * 60 * 1000,
      typicalActivities: [ActivityType.PORTFOLIO_ACCESS, ActivityType.REPORTING]
    };
  }

  private calculateCurrentProfile(activities: ActivityData[]): any {
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

  private calculateDeviations(baseline: any, current: any): any {
    return {
      timePatternDeviation: 0.2, // Simplified calculation
      locationDeviation: 0.1,
      deviceDeviation: 0.0,
      activityDeviation: 0.3,
      overallDeviationScore: 0.4
    };
  }

  private async detectBehavioralAnomalies(userId: string, activities: ActivityData[]): Promise<any[]> {
    return []; // Simplified - would implement ML-based detection
  }

  private calculateActivityTrends(activities: ActivityData[]): any {
    // Simplified trend calculation
    return {
      total: [],
      byType: {},
      byHour: [],
      byDayOfWeek: []
    };
  }

  private calculateUserTrends(activities: ActivityData[]): any {
    return {
      activeUsers: [],
      newUsers: [],
      userRetention: []
    };
  }

  private calculateSecurityTrends(activities: ActivityData[]): any {
    return {
      riskScores: [],
      suspiciousActivities: [],
      complianceViolations: []
    };
  }

  private async generatePredictions(activities: ActivityData[]): Promise<any> {
    return {
      nextPeriodActivity: activities.length * 1.1,
      riskTrend: 'stable' as const,
      seasonalPatterns: []
    };
  }

  private async detectVolumeAnomalies(activities: ActivityData[]): Promise<any[]> {
    return []; // Implement statistical analysis for volume anomalies
  }

  private async detectTimeAnomalies(activities: ActivityData[]): Promise<any[]> {
    return []; // Implement time-based anomaly detection
  }

  private async detectGeographicAnomalies(activities: ActivityData[]): Promise<any[]> {
    return []; // Implement geographic anomaly detection
  }

  private async detectBehaviorAnomalies(activities: ActivityData[]): Promise<any[]> {
    return []; // Implement behavioral anomaly detection
  }

  private calculateAnomalyStatistics(anomalies: any[]): any {
    return {
      totalAnomalies: anomalies.length,
      byType: {},
      bySeverity: {},
      detectionAccuracy: 0.85,
      falsePositiveRate: 0.15
    };
  }

  private generateAnomalyRecommendations(anomalies: any[]): string[] {
    return [
      'Investigate high-confidence anomalies immediately',
      'Review and update detection thresholds',
      'Consider additional monitoring for affected users'
    ];
  }

  private initializePredefinedReports(): void {
    // Create default report templates
    const defaultReports = [
      {
        name: 'Daily Security Summary',
        description: 'Daily security events and risk analysis',
        type: ReportType.SECURITY_ANALYSIS,
        parameters: { period: '1d' },
        schedule: { frequency: 'daily' as const, hour: 6 },
        recipients: ['security@company.com'],
        isActive: true
      },
      {
        name: 'Weekly Compliance Report',
        description: 'Weekly compliance violations and trends',
        type: ReportType.COMPLIANCE_REPORT,
        parameters: { period: '1w' },
        schedule: { frequency: 'weekly' as const, dayOfWeek: 1, hour: 9 },
        recipients: ['compliance@company.com'],
        isActive: true
      }
    ];

    defaultReports.forEach(report => this.createReport(report));
  }

  private startScheduledReports(): void {
    // Check for scheduled reports every hour
    setInterval(() => {
      this.processScheduledReports();
    }, 60 * 60 * 1000);
  }

  private async processScheduledReports(): Promise<any> {
    const now = new Date();
    
    for (const report of this.reports.values()) {
      if (report.isActive && report.schedule && this.shouldGenerateReport(report, now)) {
        try {
          await this.generateScheduledReport(report);
        } catch (error: any) {
          console.error(`Error generating scheduled report ${report.id}:`, error);
        }
      }
    }
  }

  private shouldGenerateReport(report: AnalyticsReport, now: Date): boolean {
    if (!report.nextGeneration) {
      return true; // First time generation
    }
    
    return now >= report.nextGeneration;
  }

  private async generateScheduledReport(report: AnalyticsReport): Promise<any> {
    // Generate report based on type and parameters
    this.emit('scheduledReportGenerated', report);
    
    // Update next generation time
    report.lastGenerated = new Date();
    report.nextGeneration = this.calculateNextGeneration(report);
  }

  private calculateNextGeneration(report: AnalyticsReport): Date {
    const now = new Date();
    const schedule = report.schedule!;
    
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

  private scheduleReport(report: AnalyticsReport): void {
    report.nextGeneration = this.calculateNextGeneration(report);
  }

  private getCachedData(key: string): any {
    const cached = this.reportCache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.reportCache.set(key, { data, timestamp: new Date() });
  }

  private calculateAverageSessionDuration(sessions: ActivitySession[]): number {
    if (sessions.length === 0) return 0;
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    return totalDuration / sessions.length;
  }
}


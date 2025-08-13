import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface ActivityData {
  id: string;
  userId: string;
  tenantId: string;
  sessionId: string;
  activityType: ActivityType;
  activityCategory: ActivityCategory;
  action: string;
  resource: string;
  resourceId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: GeolocationData;
  severity: ActivitySeverity;
  tags: string[];
  correlationId?: string;
  parentActivityId?: string;
  duration?: number;
  status: ActivityStatus;
  outcome: ActivityOutcome;
  deviceInfo?: DeviceInfo;
  riskScore?: number;
  sensitiveData: boolean;
  complianceFlags: string[];
}

export enum ActivityType {
  AUTHENTICATION = 'authentication',
  PORTFOLIO_ACCESS = 'portfolio_access',
  PORTFOLIO_MODIFICATION = 'portfolio_modification',
  TRADING = 'trading',
  REPORTING = 'reporting',
  DOCUMENT_ACCESS = 'document_access',
  SYSTEM_ADMIN = 'system_admin',
  COMPLIANCE = 'compliance',
  COMMUNICATION = 'communication',
  DATA_EXPORT = 'data_export',
  SECURITY = 'security',
  API_ACCESS = 'api_access'
}

export enum ActivityCategory {
  USER_INTERACTION = 'user_interaction',
  SYSTEM_EVENT = 'system_event',
  SECURITY_EVENT = 'security_event',
  BUSINESS_EVENT = 'business_event',
  COMPLIANCE_EVENT = 'compliance_event',
  ERROR_EVENT = 'error_event',
  ADMINISTRATIVE = 'administrative'
}

export enum ActivitySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ActivityStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export enum ActivityOutcome {
  AUTHORIZED = 'authorized',
  UNAUTHORIZED = 'unauthorized',
  BLOCKED = 'blocked',
  FLAGGED = 'flagged',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated'
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
}

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution?: string;
  deviceId?: string;
}

export interface ActivityFilter {
  userId?: string;
  tenantId?: string;
  activityType?: ActivityType[];
  activityCategory?: ActivityCategory[];
  severity?: ActivitySeverity[];
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  resource?: string;
  tags?: string[];
  riskScoreMin?: number;
  riskScoreMax?: number;
  sensitiveData?: boolean;
  complianceFlags?: string[];
}

export interface ActivitySession {
  sessionId: string;
  userId: string;
  tenantId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  activityCount: number;
  activities: ActivityData[];
  ipAddress: string;
  deviceInfo: DeviceInfo;
  location: GeolocationData;
  isActive: boolean;
  riskScore: number;
  flags: string[];
}

export interface ActivityPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  riskLevel: ActivitySeverity;
  actions: string[];
  enabled: boolean;
  matchCount: number;
  lastMatched?: Date;
}

export interface ActivityMetrics {
  totalActivities: number;
  uniqueUsers: number;
  activeSessions: number;
  averageSessionDuration: number;
  topActivities: Array<{ activity: string; count: number }>;
  riskDistribution: Record<ActivitySeverity, number>;
  complianceViolations: number;
  suspiciousActivities: number;
  timeseriesData: Array<{ timestamp: Date; count: number; riskScore: number }>;
}

export class ActivityTrackingService extends EventEmitter {
  private activities: Map<string, ActivityData> = new Map();
  private sessions: Map<string, ActivitySession> = new Map();
  private patterns: Map<string, ActivityPattern> = new Map();
  private activityBuffer: ActivityData[] = [];
  private bufferSize: number = 1000;
  private flushInterval: number = 5000;
  private retentionPeriod: number = 90 * 24 * 60 * 60 * 1000; // 90 days
  private anonymizationRules: Map<string, (data: any) => any> = new Map();

  constructor() {
    super();
    this.initializePatterns();
    this.startFlushTimer();
    this.startCleanupTimer();
  }

  public async trackActivity(activityData: Partial<ActivityData>): Promise<ActivityData> {
    const activity: ActivityData = {
      id: randomUUID(),
      timestamp: new Date(),
      severity: ActivitySeverity.LOW,
      tags: [],
      status: ActivityStatus.SUCCESS,
      outcome: ActivityOutcome.AUTHORIZED,
      sensitiveData: false,
      complianceFlags: [],
      ...activityData
    } as ActivityData;

    activity.riskScore = this.calculateRiskScore(activity);
    activity.complianceFlags = this.checkCompliance(activity);

    this.activities.set(activity.id, activity);
    this.activityBuffer.push(activity);

    await this.updateSession(activity);
    await this.checkPatterns(activity);

    this.emit('activityTracked', activity);

    if (activity.riskScore > 0.7) {
      this.emit('suspiciousActivity', activity);
    }

    if (activity.complianceFlags.length > 0) {
      this.emit('complianceViolation', activity);
    }

    if (this.activityBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    return activity;
  }

  public async getActivities(filter: ActivityFilter = {}, limit: number = 100, offset: number = 0): Promise<ActivityData[]> {
    let filteredActivities = Array.from(this.activities.values());

    if (filter.userId) {
      filteredActivities = filteredActivities.filter(a => a.userId === filter.userId);
    }

    if (filter.tenantId) {
      filteredActivities = filteredActivities.filter(a => a.tenantId === filter.tenantId);
    }

    if (filter.activityType?.length) {
      filteredActivities = filteredActivities.filter(a => filter.activityType!.includes(a.activityType));
    }

    if (filter.activityCategory?.length) {
      filteredActivities = filteredActivities.filter(a => filter.activityCategory!.includes(a.activityCategory));
    }

    if (filter.severity?.length) {
      filteredActivities = filteredActivities.filter(a => filter.severity!.includes(a.severity));
    }

    if (filter.startDate) {
      filteredActivities = filteredActivities.filter(a => a.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filteredActivities = filteredActivities.filter(a => a.timestamp <= filter.endDate!);
    }

    if (filter.ipAddress) {
      filteredActivities = filteredActivities.filter(a => a.ipAddress === filter.ipAddress);
    }

    if (filter.resource) {
      filteredActivities = filteredActivities.filter(a => a.resource.includes(filter.resource!));
    }

    if (filter.tags?.length) {
      filteredActivities = filteredActivities.filter(a => 
        filter.tags!.some(tag => a.tags.includes(tag))
      );
    }

    if (filter.riskScoreMin !== undefined) {
      filteredActivities = filteredActivities.filter(a => (a.riskScore || 0) >= filter.riskScoreMin!);
    }

    if (filter.riskScoreMax !== undefined) {
      filteredActivities = filteredActivities.filter(a => (a.riskScore || 0) <= filter.riskScoreMax!);
    }

    if (filter.sensitiveData !== undefined) {
      filteredActivities = filteredActivities.filter(a => a.sensitiveData === filter.sensitiveData);
    }

    if (filter.complianceFlags?.length) {
      filteredActivities = filteredActivities.filter(a => 
        filter.complianceFlags!.some(flag => a.complianceFlags.includes(flag))
      );
    }

    return filteredActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  public async getUserSessions(userId: string, active: boolean = false): Promise<ActivitySession[]> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId);

    if (active) {
      return userSessions.filter(session => session.isActive);
    }

    return userSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  public async getActivityMetrics(filter: ActivityFilter = {}): Promise<ActivityMetrics> {
    const activities = await this.getActivities(filter, Number.MAX_SAFE_INTEGER, 0);
    const uniqueUsers = new Set(activities.map(a => a.userId)).size;
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => s.isActive).length;

    const activityCounts = activities.reduce((acc, activity) => {
      const key = `${activity.activityType}:${activity.action}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActivities = Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([activity, count]) => ({ activity, count }));

    const riskDistribution = activities.reduce((acc, activity) => {
      acc[activity.severity] = (acc[activity.severity] || 0) + 1;
      return acc;
    }, {} as Record<ActivitySeverity, number>);

    const complianceViolations = activities
      .filter(a => a.complianceFlags.length > 0).length;
    
    const suspiciousActivities = activities
      .filter(a => (a.riskScore || 0) > 0.7).length;

    const timeseriesData = this.generateTimeseriesData(activities);

    const sessionDurations = Array.from(this.sessions.values())
      .filter(s => s.duration)
      .map(s => s.duration!);
    
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    return {
      totalActivities: activities.length,
      uniqueUsers,
      activeSessions,
      averageSessionDuration,
      topActivities,
      riskDistribution,
      complianceViolations,
      suspiciousActivities,
      timeseriesData
    };
  }

  public async addPattern(pattern: Omit<ActivityPattern, 'id' | 'matchCount' | 'lastMatched'>): Promise<ActivityPattern> {
    const newPattern: ActivityPattern = {
      id: randomUUID(),
      matchCount: 0,
      ...pattern
    };

    this.patterns.set(newPattern.id, newPattern);
    this.emit('patternAdded', newPattern);

    return newPattern;
  }

  public async removePattern(patternId: string): Promise<boolean> {
    const removed = this.patterns.delete(patternId);
    if (removed) {
      this.emit('patternRemoved', patternId);
    }
    return removed;
  }

  public async anonymizeData(data: ActivityData): Promise<ActivityData> {
    const anonymized = { ...data };

    for (const [field, rule] of this.anonymizationRules) {
      if (anonymized.metadata[field]) {
        anonymized.metadata[field] = rule(anonymized.metadata[field]);
      }
    }

    if (anonymized.sensitiveData) {
      anonymized.ipAddress = this.anonymizeIP(anonymized.ipAddress);
      if (anonymized.location) {
        anonymized.location = this.anonymizeLocation(anonymized.location);
      }
    }

    return anonymized;
  }

  public setAnonymizationRule(field: string, rule: (data: any) => any): void {
    this.anonymizationRules.set(field, rule);
  }

  private calculateRiskScore(activity: ActivityData): number {
    let score = 0;

    // Base risk by activity type
    const typeRisk = {
      [ActivityType.AUTHENTICATION]: 0.1,
      [ActivityType.PORTFOLIO_ACCESS]: 0.2,
      [ActivityType.PORTFOLIO_MODIFICATION]: 0.5,
      [ActivityType.TRADING]: 0.7,
      [ActivityType.SYSTEM_ADMIN]: 0.8,
      [ActivityType.DATA_EXPORT]: 0.6,
      [ActivityType.SECURITY]: 0.9
    };

    score += typeRisk[activity.activityType] || 0.1;

    // Severity impact
    const severityMultiplier = {
      [ActivitySeverity.LOW]: 1,
      [ActivitySeverity.MEDIUM]: 1.5,
      [ActivitySeverity.HIGH]: 2,
      [ActivitySeverity.CRITICAL]: 3
    };

    score *= severityMultiplier[activity.severity];

    // Failure penalty
    if (activity.status === ActivityStatus.FAILURE) {
      score += 0.3;
    }

    // Off-hours activity
    const hour = activity.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      score += 0.2;
    }

    // Location risk (simplified)
    if (activity.location && activity.location.country !== 'US') {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private checkCompliance(activity: ActivityData): string[] {
    const flags: string[] = [];

    // High-risk trading activity
    if (activity.activityType === ActivityType.TRADING && 
        activity.severity === ActivitySeverity.HIGH) {
      flags.push('HIGH_RISK_TRADING');
    }

    // Administrative activity outside business hours
    if (activity.activityType === ActivityType.SYSTEM_ADMIN) {
      const hour = activity.timestamp.getHours();
      if (hour < 6 || hour > 18) {
        flags.push('OFF_HOURS_ADMIN');
      }
    }

    // Sensitive data access
    if (activity.sensitiveData && 
        activity.activityType === ActivityType.DATA_EXPORT) {
      flags.push('SENSITIVE_DATA_EXPORT');
    }

    // Multiple failed authentications
    if (activity.activityType === ActivityType.AUTHENTICATION && 
        activity.status === ActivityStatus.FAILURE) {
      flags.push('AUTH_FAILURE');
    }

    return flags;
  }

  private async updateSession(activity: ActivityData): Promise<void> {
    let session = this.sessions.get(activity.sessionId);

    if (!session) {
      session = {
        sessionId: activity.sessionId,
        userId: activity.userId,
        tenantId: activity.tenantId,
        startTime: activity.timestamp,
        activityCount: 0,
        activities: [],
        ipAddress: activity.ipAddress,
        deviceInfo: activity.deviceInfo!,
        location: activity.location!,
        isActive: true,
        riskScore: 0,
        flags: []
      };
      this.sessions.set(activity.sessionId, session);
    }

    session.activities.push(activity);
    session.activityCount++;
    session.endTime = activity.timestamp;
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    session.riskScore = Math.max(session.riskScore, activity.riskScore || 0);

    if (activity.complianceFlags.length > 0) {
      session.flags.push(...activity.complianceFlags);
    }

    // Auto-end session after 30 minutes of inactivity
    setTimeout(() => {
      if (session && session.isActive) {
        const lastActivity = Math.max(...session.activities.map(a => a.timestamp.getTime()));
        if (Date.now() - lastActivity > 30 * 60 * 1000) {
          session.isActive = false;
          this.emit('sessionEnded', session);
        }
      }
    }, 30 * 60 * 1000);
  }

  private async checkPatterns(activity: ActivityData): Promise<void> {
    for (const pattern of this.patterns.values()) {
      if (!pattern.enabled) continue;

      const regex = new RegExp(pattern.pattern);
      const searchString = `${activity.activityType}:${activity.action}:${activity.resource}`;

      if (regex.test(searchString)) {
        pattern.matchCount++;
        pattern.lastMatched = new Date();

        this.emit('patternMatched', { pattern, activity });

        if (pattern.riskLevel === ActivitySeverity.HIGH || 
            pattern.riskLevel === ActivitySeverity.CRITICAL) {
          this.emit('highRiskPattern', { pattern, activity });
        }
      }
    }
  }

  private initializePatterns(): void {
    const defaultPatterns: Omit<ActivityPattern, 'id' | 'matchCount' | 'lastMatched'>[] = [
      {
        name: 'Multiple Failed Logins',
        description: 'Multiple authentication failures in short time',
        pattern: 'authentication:login_attempt:.*',
        riskLevel: ActivitySeverity.HIGH,
        actions: ['alert_security', 'temporary_lockout'],
        enabled: true
      },
      {
        name: 'Off-Hours Trading',
        description: 'Trading activity outside normal hours',
        pattern: 'trading:.*:.*',
        riskLevel: ActivitySeverity.MEDIUM,
        actions: ['flag_for_review'],
        enabled: true
      },
      {
        name: 'Bulk Data Export',
        description: 'Large volume data export activity',
        pattern: 'data_export:bulk_download:.*',
        riskLevel: ActivitySeverity.HIGH,
        actions: ['require_approval', 'alert_compliance'],
        enabled: true
      },
      {
        name: 'Admin Privilege Escalation',
        description: 'Administrative privilege elevation',
        pattern: 'system_admin:privilege_change:.*',
        riskLevel: ActivitySeverity.CRITICAL,
        actions: ['immediate_alert', 'require_mfa'],
        enabled: true
      }
    ];

    defaultPatterns.forEach(pattern => this.addPattern(pattern));
  }

  private async flushBuffer(): Promise<void> {
    if (this.activityBuffer.length === 0) return;

    const batch = [...this.activityBuffer];
    this.activityBuffer = [];

    try {
      // In production, this would persist to database
      this.emit('batchFlushed', batch);
    } catch (error) {
      this.emit('flushError', error);
      // Return items to buffer on failure
      this.activityBuffer.unshift(...batch);
    }
  }

  private startFlushTimer(): void {
    setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - this.retentionPeriod);

    // Cleanup activities
    for (const [id, activity] of this.activities) {
      if (activity.timestamp < cutoff) {
        this.activities.delete(id);
      }
    }

    // Cleanup inactive sessions
    for (const [id, session] of this.sessions) {
      if (!session.isActive && session.endTime && session.endTime < cutoff) {
        this.sessions.delete(id);
      }
    }

    this.emit('dataCleanup', { cutoff, remaining: this.activities.size });
  }

  private generateTimeseriesData(activities: ActivityData[]): Array<{ timestamp: Date; count: number; riskScore: number }> {
    const buckets: Map<string, { count: number; riskSum: number }> = new Map();

    activities.forEach(activity => {
      const hour = new Date(activity.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();

      const bucket = buckets.get(key) || { count: 0, riskSum: 0 };
      bucket.count++;
      bucket.riskSum += activity.riskScore || 0;
      buckets.set(key, bucket);
    });

    return Array.from(buckets.entries())
      .map(([timestamp, bucket]) => ({
        timestamp: new Date(timestamp),
        count: bucket.count,
        riskScore: bucket.count > 0 ? bucket.riskSum / bucket.count : 0
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private anonymizeIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  private anonymizeLocation(location: GeolocationData): GeolocationData {
    return {
      ...location,
      latitude: undefined,
      longitude: undefined,
      city: 'ANONYMIZED'
    };
  }
}
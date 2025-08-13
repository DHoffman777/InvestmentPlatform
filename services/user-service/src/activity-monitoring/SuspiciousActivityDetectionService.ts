import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { ActivityData, ActivitySeverity, ActivityType, ActivityCategory, ActivityFilter } from './ActivityTrackingService';

export interface SuspiciousActivityAlert {
  id: string;
  alertType: AlertType;
  severity: ActivitySeverity;
  title: string;
  description: string;
  userId: string;
  tenantId: string;
  relatedActivities: string[];
  timestamp: Date;
  status: AlertStatus;
  assignedTo?: string;
  resolution?: string;
  falsePositive: boolean;
  riskScore: number;
  evidence: Evidence[];
  recommendedActions: string[];
  correlationId?: string;
}

export enum AlertType {
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  UNUSUAL_LOCATION = 'unusual_location',
  OFF_HOURS_ACCESS = 'off_hours_access',
  SUSPICIOUS_DEVICE = 'suspicious_device',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  ACCOUNT_TAKEOVER = 'account_takeover',
  UNUSUAL_ACTIVITY_VOLUME = 'unusual_activity_volume',
  INSIDER_THREAT = 'insider_threat',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  POLICY_VIOLATION = 'policy_violation'
}

export enum AlertStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  CONFIRMED = 'confirmed',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  ESCALATED = 'escalated'
}

export interface Evidence {
  type: EvidenceType;
  description: string;
  data: any;
  timestamp: Date;
  confidence: number;
}

export enum EvidenceType {
  ACTIVITY_PATTERN = 'activity_pattern',
  LOCATION_ANOMALY = 'location_anomaly',
  TIME_ANOMALY = 'time_anomaly',
  DEVICE_FINGERPRINT = 'device_fingerprint',
  BEHAVIORAL_CHANGE = 'behavioral_change',
  STATISTICAL_ANOMALY = 'statistical_anomaly',
  RULE_VIOLATION = 'rule_violation'
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  alertType: AlertType;
  severity: ActivitySeverity;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  threshold: number;
  timeWindow: number; // in milliseconds
  cooldown: number; // in milliseconds
  lastTriggered?: Date;
  triggerCount: number;
  falsePositiveRate: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in' | 'regex';
  value: any;
  weight: number;
}

export interface RuleAction {
  type: 'alert' | 'block' | 'quarantine' | 'notify' | 'log' | 'escalate';
  parameters: Record<string, any>;
}

export interface UserBaseline {
  userId: string;
  tenantId: string;
  profile: {
    typicalHours: number[];
    commonLocations: string[];
    averageSessionDuration: number;
    typicalDevices: string[];
    normalActivityVolume: number;
    commonActivityTypes: ActivityType[];
  };
  statistics: {
    totalActivities: number;
    averageRiskScore: number;
    complianceViolations: number;
    lastUpdated: Date;
  };
  anomalyThresholds: {
    locationDeviation: number;
    timeDeviation: number;
    volumeDeviation: number;
    riskScoreThreshold: number;
  };
}

export interface ThreatIntelligence {
  id: string;
  type: 'ip_reputation' | 'known_attacker' | 'malicious_pattern' | 'compromised_credential';
  value: string;
  severity: ActivitySeverity;
  source: string;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
  confidence: number;
}

export class SuspiciousActivityDetectionService extends EventEmitter {
  private alerts: Map<string, SuspiciousActivityAlert> = new Map();
  private detectionRules: Map<string, DetectionRule> = new Map();
  private userBaselines: Map<string, UserBaseline> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private recentActivities: Map<string, ActivityData[]> = new Map();
  private ruleCooldowns: Map<string, Date> = new Map();
  private mlModels: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeDefaultRules();
    this.startPeriodicAnalysis();
    this.loadThreatIntelligence();
  }

  public async analyzeActivity(activity: ActivityData): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = [];

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

  public async getAlerts(
    filter: {
      userId?: string;
      tenantId?: string;
      severity?: ActivitySeverity[];
      status?: AlertStatus[];
      alertType?: AlertType[];
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<SuspiciousActivityAlert[]> {
    let filteredAlerts = Array.from(this.alerts.values());

    if (filter.userId) {
      filteredAlerts = filteredAlerts.filter(a => a.userId === filter.userId);
    }

    if (filter.tenantId) {
      filteredAlerts = filteredAlerts.filter(a => a.tenantId === filter.tenantId);
    }

    if (filter.severity?.length) {
      filteredAlerts = filteredAlerts.filter(a => filter.severity!.includes(a.severity));
    }

    if (filter.status?.length) {
      filteredAlerts = filteredAlerts.filter(a => filter.status!.includes(a.status));
    }

    if (filter.alertType?.length) {
      filteredAlerts = filteredAlerts.filter(a => filter.alertType!.includes(a.alertType));
    }

    if (filter.startDate) {
      filteredAlerts = filteredAlerts.filter(a => a.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filteredAlerts = filteredAlerts.filter(a => a.timestamp <= filter.endDate!);
    }

    return filteredAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  public async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    assignedTo?: string,
    resolution?: string
  ): Promise<SuspiciousActivityAlert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = status;
    if (assignedTo) alert.assignedTo = assignedTo;
    if (resolution) alert.resolution = resolution;

    if (status === AlertStatus.FALSE_POSITIVE) {
      alert.falsePositive = true;
      await this.updateRuleFalsePositiveRate(alert);
    }

    this.emit('alertUpdated', alert);
    return alert;
  }

  public async createDetectionRule(rule: Omit<DetectionRule, 'id' | 'triggerCount' | 'falsePositiveRate'>): Promise<DetectionRule> {
    const newRule: DetectionRule = {
      id: randomUUID(),
      triggerCount: 0,
      falsePositiveRate: 0,
      ...rule
    };

    this.detectionRules.set(newRule.id, newRule);
    this.emit('ruleCreated', newRule);

    return newRule;
  }

  public async updateDetectionRule(ruleId: string, updates: Partial<DetectionRule>): Promise<DetectionRule | null> {
    const rule = this.detectionRules.get(ruleId);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates };
    this.detectionRules.set(ruleId, updatedRule);
    this.emit('ruleUpdated', updatedRule);

    return updatedRule;
  }

  public async deleteDetectionRule(ruleId: string): Promise<boolean> {
    const deleted = this.detectionRules.delete(ruleId);
    if (deleted) {
      this.emit('ruleDeleted', ruleId);
    }
    return deleted;
  }

  public async updateUserBaseline(userId: string, activities: ActivityData[]): Promise<UserBaseline> {
    const userActivities = activities.filter(a => a.userId === userId);
    
    const profile = this.calculateUserProfile(userActivities);
    const statistics = this.calculateUserStatistics(userActivities);
    const anomalyThresholds = this.calculateAnomalyThresholds(userActivities);

    const baseline: UserBaseline = {
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

  public async addThreatIntelligence(threat: Omit<ThreatIntelligence, 'id' | 'createdAt'>): Promise<ThreatIntelligence> {
    const newThreat: ThreatIntelligence = {
      id: randomUUID(),
      createdAt: new Date(),
      ...threat
    };

    this.threatIntelligence.set(newThreat.value, newThreat);
    this.emit('threatIntelligenceAdded', newThreat);

    return newThreat;
  }

  public async getDetectionRules(): Promise<DetectionRule[]> {
    return Array.from(this.detectionRules.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getAlertStatistics(): Promise<{
    totalAlerts: number;
    alertsByType: Record<AlertType, number>;
    alertsBySeverity: Record<ActivitySeverity, number>;
    alertsByStatus: Record<AlertStatus, number>;
    averageResolutionTime: number;
    falsePositiveRate: number;
  }> {
    const alerts = Array.from(this.alerts.values());
    
    const alertsByType = alerts.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);

    const alertsBySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<ActivitySeverity, number>);

    const alertsByStatus = alerts.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {} as Record<AlertStatus, number>);

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

  private async runRuleBasedDetection(activity: ActivityData): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = [];

    for (const rule of this.detectionRules.values()) {
      if (!rule.enabled) continue;

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

  private async runStatisticalDetection(activity: ActivityData): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = [];
    const baseline = this.userBaselines.get(activity.userId);

    if (!baseline) return alerts;

    // Location anomaly detection
    if (activity.location && this.isLocationAnomaly(activity, baseline)) {
      const alert = await this.createAlert(
        AlertType.UNUSUAL_LOCATION,
        ActivitySeverity.MEDIUM,
        activity,
        null,
        'Activity from unusual location detected'
      );
      alerts.push(alert);
    }

    // Time anomaly detection
    if (this.isTimeAnomaly(activity, baseline)) {
      const alert = await this.createAlert(
        AlertType.OFF_HOURS_ACCESS,
        ActivitySeverity.MEDIUM,
        activity,
        null,
        'Activity during unusual hours detected'
      );
      alerts.push(alert);
    }

    // Volume anomaly detection
    const recentActivities = this.getRecentUserActivities(activity.userId, 60 * 60 * 1000); // 1 hour
    if (this.isVolumeAnomaly(recentActivities, baseline)) {
      const alert = await this.createAlert(
        AlertType.UNUSUAL_ACTIVITY_VOLUME,
        ActivitySeverity.HIGH,
        activity,
        null,
        'Unusual activity volume detected'
      );
      alerts.push(alert);
    }

    return alerts;
  }

  private async runBehavioralAnalysis(activity: ActivityData): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = [];
    const baseline = this.userBaselines.get(activity.userId);

    if (!baseline) return alerts;

    // Device anomaly detection
    if (activity.deviceInfo && this.isDeviceAnomaly(activity, baseline)) {
      const alert = await this.createAlert(
        AlertType.SUSPICIOUS_DEVICE,
        ActivitySeverity.HIGH,
        activity,
        null,
        'Activity from suspicious device detected'
      );
      alerts.push(alert);
    }

    // Privilege escalation detection
    if (this.isPrivilegeEscalation(activity)) {
      const alert = await this.createAlert(
        AlertType.PRIVILEGE_ESCALATION,
        ActivitySeverity.CRITICAL,
        activity,
        null,
        'Privilege escalation attempt detected'
      );
      alerts.push(alert);
    }

    return alerts;
  }

  private async runThreatIntelligenceCheck(activity: ActivityData): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = [];

    // Check IP reputation
    const ipThreat = this.threatIntelligence.get(activity.ipAddress);
    if (ipThreat && !this.isThreatExpired(ipThreat)) {
      const alert = await this.createAlert(
        AlertType.BRUTE_FORCE_ATTACK,
        ipThreat.severity,
        activity,
        null,
        `Activity from known malicious IP: ${ipThreat.description}`
      );
      alerts.push(alert);
    }

    return alerts;
  }

  private async runMLDetection(activity: ActivityData): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = [];

    // Placeholder for ML-based detection
    // In production, this would use trained models to detect anomalies

    return alerts;
  }

  private async evaluateRule(
    rule: DetectionRule,
    activity: ActivityData,
    recentActivities: ActivityData[]
  ): Promise<boolean> {
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

  private evaluateCondition(
    condition: RuleCondition,
    activity: ActivityData,
    recentActivities: ActivityData[]
  ): boolean {
    let fieldValue: any;

    // Get field value from activity or calculate from recent activities
    if (condition.field === 'failed_login_count') {
      fieldValue = recentActivities.filter(a => 
        a.activityType === ActivityType.AUTHENTICATION && 
        a.status === 'failure'
      ).length;
    } else if (condition.field === 'activity_count') {
      fieldValue = recentActivities.length;
    } else {
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

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async createAlert(
    alertType: AlertType,
    severity: ActivitySeverity,
    activity: ActivityData,
    rule: DetectionRule | null,
    customDescription?: string
  ): Promise<SuspiciousActivityAlert> {
    const alert: SuspiciousActivityAlert = {
      id: randomUUID(),
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

  private async processAlert(alert: SuspiciousActivityAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
    this.emit('alertCreated', alert);

    // Auto-escalate critical alerts
    if (alert.severity === ActivitySeverity.CRITICAL) {
      alert.status = AlertStatus.ESCALATED;
      this.emit('alertEscalated', alert);
    }

    // Execute automated actions based on alert type
    await this.executeAutomatedActions(alert);
  }

  private async executeAutomatedActions(alert: SuspiciousActivityAlert): Promise<void> {
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

  private generateAlertTitle(alertType: AlertType): string {
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

  private generateAlertDescription(alertType: AlertType, activity: ActivityData): string {
    return `Suspicious activity of type ${alertType} detected for user ${activity.userId} at ${activity.timestamp.toISOString()}`;
  }

  private async generateEvidence(alertType: AlertType, activity: ActivityData): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

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

  private generateRecommendedActions(alertType: AlertType): string[] {
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
      [AlertType.PRIVILEGE_ESCALATION]: [
        'Immediately investigate',
        'Verify administrative access',
        'Review privilege changes'
      ],
      [AlertType.DATA_EXFILTRATION]: [
        'Block data export temporarily',
        'Investigate data access patterns',
        'Contact security team immediately'
      ]
    };

    return actions[alertType] || ['Investigate activity', 'Monitor user behavior'];
  }

  private updateRecentActivities(activity: ActivityData): void {
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

  private getRecentUserActivities(userId: string, timeWindow: number): ActivityData[] {
    const activities = this.recentActivities.get(`${userId}:*`) || [];
    const cutoff = new Date(Date.now() - timeWindow);
    
    return activities.filter(a => a.timestamp > cutoff);
  }

  private isLocationAnomaly(activity: ActivityData, baseline: UserBaseline): boolean {
    if (!activity.location) return false;
    
    const location = `${activity.location.city}, ${activity.location.country}`;
    return !baseline.profile.commonLocations.includes(location);
  }

  private isTimeAnomaly(activity: ActivityData, baseline: UserBaseline): boolean {
    const hour = activity.timestamp.getHours();
    return !baseline.profile.typicalHours.includes(hour);
  }

  private isVolumeAnomaly(activities: ActivityData[], baseline: UserBaseline): boolean {
    return activities.length > baseline.profile.normalActivityVolume * 2;
  }

  private isDeviceAnomaly(activity: ActivityData, baseline: UserBaseline): boolean {
    if (!activity.deviceInfo) return false;
    
    const deviceType = activity.deviceInfo.deviceType;
    return !baseline.profile.typicalDevices.includes(deviceType);
  }

  private isPrivilegeEscalation(activity: ActivityData): boolean {
    return activity.activityType === ActivityType.SYSTEM_ADMIN && 
           activity.action.includes('privilege') ||
           activity.action.includes('role_change');
  }

  private isThreatExpired(threat: ThreatIntelligence): boolean {
    return threat.expiresAt ? new Date() > threat.expiresAt : false;
  }

  private calculateUserProfile(activities: ActivityData[]): any {
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

  private calculateUserStatistics(activities: ActivityData[]): any {
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

  private calculateAnomalyThresholds(activities: ActivityData[]): any {
    return {
      locationDeviation: 0.3,
      timeDeviation: 0.4,
      volumeDeviation: 2.0,
      riskScoreThreshold: 0.7
    };
  }

  private getMostCommon<T>(arr: T[]): T[] {
    const counts = arr.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([item]) => item);

    return sorted as T[];
  }

  private async updateRuleFalsePositiveRate(alert: SuspiciousActivityAlert): Promise<void> {
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

  private initializeDefaultRules(): void {
    const defaultRules = [
      {
        name: 'Multiple Failed Logins',
        description: 'Detect multiple failed login attempts',
        alertType: AlertType.MULTIPLE_FAILED_LOGINS,
        severity: ActivitySeverity.HIGH,
        enabled: true,
        conditions: [
          {
            field: 'failed_login_count',
            operator: 'greater_than' as const,
            value: 5,
            weight: 1
          },
          {
            field: 'activityType',
            operator: 'equals' as const,
            value: ActivityType.AUTHENTICATION,
            weight: 0.5
          }
        ],
        actions: [
          { type: 'alert' as const, parameters: {} },
          { type: 'block' as const, parameters: { duration: 300000 } }
        ],
        threshold: 0.8,
        timeWindow: 15 * 60 * 1000, // 15 minutes
        cooldown: 5 * 60 * 1000 // 5 minutes
      },
      {
        name: 'Off-Hours Admin Access',
        description: 'Detect administrative access outside business hours',
        alertType: AlertType.OFF_HOURS_ACCESS,
        severity: ActivitySeverity.MEDIUM,
        enabled: true,
        conditions: [
          {
            field: 'activityType',
            operator: 'equals' as const,
            value: ActivityType.SYSTEM_ADMIN,
            weight: 1
          }
        ],
        actions: [
          { type: 'alert' as const, parameters: {} }
        ],
        threshold: 1.0,
        timeWindow: 60 * 60 * 1000, // 1 hour
        cooldown: 30 * 60 * 1000 // 30 minutes
      }
    ];

    defaultRules.forEach(rule => this.createDetectionRule(rule));
  }

  private startPeriodicAnalysis(): void {
    // Run batch analysis every 5 minutes
    setInterval(async () => {
      await this.runBatchAnalysis();
    }, 5 * 60 * 1000);
  }

  private async runBatchAnalysis(): Promise<void> {
    // Analyze patterns across all recent activities
    try {
      // Update baselines for active users
      await this.updateAllBaselines();
      
      // Clean up old data
      await this.cleanupOldData();
      
      this.emit('batchAnalysisCompleted');
    } catch (error) {
      console.error('Error in batch analysis:', error);
    }
  }

  private async updateAllBaselines(): Promise<void> {
    // Update baselines for users with recent activity
    const activeUsers = new Set<string>();
    
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

  private getAllUserActivities(userId: string): ActivityData[] {
    const allActivities: ActivityData[] = [];
    
    for (const activities of this.recentActivities.values()) {
      allActivities.push(...activities.filter(a => a.userId === userId));
    }
    
    return allActivities;
  }

  private async cleanupOldData(): Promise<void> {
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

  private async loadThreatIntelligence(): Promise<void> {
    // Load threat intelligence from external sources
    // This would integrate with threat intelligence feeds in production
    
    const sampleThreats = [
      {
        type: 'ip_reputation' as const,
        value: '192.168.1.100',
        severity: ActivitySeverity.HIGH,
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
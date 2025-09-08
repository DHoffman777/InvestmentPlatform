import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface SecurityDashboard {
  id: string;
  userId: string;
  tenantId: string;
  overview: SecurityOverview;
  activities: SecurityActivity[];
  devices: DeviceInfo[];
  sessions: SessionInfo[];
  alerts: SecurityAlert[];
  recommendations: SecurityRecommendation[];
  complianceStatus: ComplianceStatus;
  riskScore: RiskScore;
  settings: DashboardSettings;
  lastUpdated: Date;
  refreshInterval: number; // in seconds
}

export interface SecurityOverview {
  accountStatus: AccountStatus;
  lastLogin: Date;
  loginCount: number;
  failedLoginAttempts: number;
  passwordLastChanged: Date;
  mfaEnabled: boolean;
  trustedDevicesCount: number;
  activeSessions: number;
  recentSecurityEvents: number;
  riskLevel: RiskLevel;
  complianceScore: number;
  securityScore: number;
  healthIndicators: HealthIndicator[];
}

export interface SecurityActivity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  category: ActivityCategory;
  severity: Severity;
  description: string;
  details: ActivityDetails;
  location: LocationInfo;
  device: DeviceInfo;
  outcome: ActivityOutcome;
  riskScore: number;
  flagged: boolean;
  investigated: boolean;
  status: ActivityStatus;
  tags: string[];
  metadata: Record<string, any>;
}

export interface DeviceInfo {
  id: string;
  deviceId: string;
  name: string;
  type: DeviceType;
  platform: string;
  browser?: string;
  version?: string;
  fingerprint: string;
  ipAddress: string;
  location: LocationInfo;
  isTrusted: boolean;
  trustLevel: TrustLevel;
  firstSeen: Date;
  lastSeen: Date;
  sessionCount: number;
  isActive: boolean;
  riskScore: number;
  securityFeatures: SecurityFeature[];
  status: DeviceStatus;
  metadata: Record<string, any>;
}

export interface SessionInfo {
  id: string;
  sessionId: string;
  deviceId: string;
  startTime: Date;
  lastActivity: Date;
  duration: number; // in seconds
  isActive: boolean;
  ipAddress: string;
  location: LocationInfo;
  activities: string[]; // activity IDs
  riskScore: number;
  anomalies: SessionAnomaly[];
  authenticationMethods: AuthMethod[];
  permissions: string[];
  status: SessionStatus;
  expiry: Date;
  metadata: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  source: AlertSource;
  triggerEvent: string;
  affectedResources: string[];
  riskScore: number;
  confidence: number;
  status: AlertStatus;
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
  actions: AlertAction[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface SecurityRecommendation {
  id: string;
  type: RecommendationType;
  priority: Priority;
  title: string;
  description: string;
  category: RecommendationCategory;
  impact: Impact;
  effort: Effort;
  deadline?: Date;
  status: RecommendationStatus;
  progress: number; // 0-100
  steps: RecommendationStep[];
  benefits: string[];
  risks: string[];
  resources: RecommendationResource[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dismissedAt?: Date;
  dismissalReason?: string;
}

export interface ComplianceStatus {
  overall: ComplianceLevel;
  frameworks: ComplianceFramework[];
  violations: ComplianceViolation[];
  attestations: ComplianceAttestation[];
  audits: ComplianceAudit[];
  lastAssessment: Date;
  nextAssessment: Date;
  certifications: Certification[];
  policies: PolicyCompliance[];
}

export interface RiskScore {
  overall: number; // 0-100
  components: RiskComponent[];
  history: RiskHistoryEntry[];
  factors: RiskFactor[];
  mitigations: RiskMitigation[];
  trends: RiskTrend[];
  benchmarks: RiskBenchmark[];
  lastCalculated: Date;
  calculationMethod: string;
}

export interface DashboardSettings {
  refreshInterval: number;
  alertThresholds: AlertThreshold[];
  visibleWidgets: string[];
  widgetOrder: string[];
  theme: DashboardTheme;
  timezone: string;
  dateFormat: string;
  autoRefresh: boolean;
  notifications: DashboardNotification[];
  filters: DashboardFilter[];
  customization: DashboardCustomization;
}

export interface ActivityDetails {
  userAgent: string;
  requestId?: string;
  sessionId?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  statusCode?: number;
  responseTime?: number;
  dataAccessed?: string[];
  permissions?: string[];
  resources?: string[];
  parameters?: Record<string, any>;
  headers?: Record<string, string>;
  errors?: string[];
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  isp?: string;
  organization?: string;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
  accuracy?: number;
}

export interface SecurityFeature {
  name: string;
  enabled: boolean;
  version?: string;
  lastChecked: Date;
  status: FeatureStatus;
}

export interface SessionAnomaly {
  type: AnomalyType;
  description: string;
  severity: Severity;
  confidence: number;
  timestamp: Date;
  details: Record<string, any>;
}

export interface AuthMethod {
  type: string;
  timestamp: Date;
  success: boolean;
  details: Record<string, any>;
}

export interface AlertAction {
  id: string;
  type: ActionType;
  description: string;
  automated: boolean;
  executedAt?: Date;
  executedBy?: string;
  result?: string;
  parameters: Record<string, any>;
}

export interface RecommendationStep {
  id: string;
  order: number;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  estimatedTime: number; // in minutes
  dependencies: string[];
  resources: string[];
}

export interface RecommendationResource {
  type: ResourceType;
  title: string;
  url?: string;
  description: string;
  isRequired: boolean;
}

export interface ComplianceFramework {
  name: string;
  version: string;
  status: ComplianceLevel;
  lastAssessment: Date;
  score: number;
  requirements: ComplianceRequirement[];
  gaps: ComplianceGap[];
}

export interface ComplianceViolation {
  id: string;
  framework: string;
  requirement: string;
  severity: Severity;
  description: string;
  detectedAt: Date;
  status: ViolationStatus;
  remediation: RemediationPlan;
}

export interface ComplianceAttestation {
  id: string;
  framework: string;
  period: AttestationPeriod;
  attestedBy: string;
  attestedAt: Date;
  status: AttestationStatus;
  evidence: AttestationEvidence[];
}

export interface ComplianceAudit {
  id: string;
  type: AuditType;
  framework: string;
  startDate: Date;
  endDate?: Date;
  auditor: string;
  status: AuditStatus;
  findings: AuditFinding[];
  recommendations: string[];
  score?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issuedDate: Date;
  expiryDate: Date;
  status: CertificationStatus;
  certificateId: string;
  scope: string[];
}

export interface PolicyCompliance {
  policyId: string;
  policyName: string;
  status: ComplianceLevel;
  lastCheck: Date;
  violations: number;
  exceptions: number;
}

export interface RiskComponent {
  category: RiskCategory;
  score: number;
  weight: number;
  description: string;
  factors: string[];
  mitigations: string[];
}

export interface RiskHistoryEntry {
  timestamp: Date;
  score: number;
  change: number;
  reason: string;
  factors: string[];
}

export interface RiskFactor {
  name: string;
  category: RiskCategory;
  impact: number;
  likelihood: number;
  score: number;
  description: string;
  isActive: boolean;
  firstDetected: Date;
  lastUpdated: Date;
}

export interface RiskMitigation {
  id: string;
  name: string;
  category: RiskCategory;
  effectiveness: number;
  implementation: ImplementationStatus;
  cost: number;
  timeframe: number; // in days
  description: string;
  resources: string[];
}

export interface RiskTrend {
  period: TrendPeriod;
  direction: TrendDirection;
  magnitude: number;
  significance: number;
  factors: string[];
}

export interface RiskBenchmark {
  type: BenchmarkType;
  category: RiskCategory;
  peerScore: number;
  industryScore: number;
  variance: number;
  percentile: number;
}

export interface AlertThreshold {
  metric: string;
  condition: ThresholdCondition;
  value: number;
  severity: Severity;
  action: string;
  isEnabled: boolean;
}

export interface DashboardNotification {
  type: NotificationType;
  enabled: boolean;
  channels: string[];
  conditions: string[];
  frequency: NotificationFrequency;
}

export interface DashboardFilter {
  name: string;
  type: FilterType;
  value: any;
  isActive: boolean;
  isDefault: boolean;
}

export interface DashboardCustomization {
  layout: LayoutConfig;
  colors: ColorScheme;
  charts: ChartConfig[];
  widgets: WidgetConfig[];
  branding: BrandingConfig;
}

export interface HealthIndicator {
  name: string;
  status: HealthStatus;
  score: number;
  description: string;
  lastChecked: Date;
  trend: TrendDirection;
  details: Record<string, any>;
}

// Enums
export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  LOCKED = 'locked',
  DISABLED = 'disabled',
  PENDING = 'pending',
  COMPROMISED = 'compromised'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  MFA_SETUP = 'mfa_setup',
  MFA_VERIFICATION = 'mfa_verification',
  PROFILE_UPDATE = 'profile_update',
  PERMISSION_CHANGE = 'permission_change',
  DATA_ACCESS = 'data_access',
  TRADE_EXECUTION = 'trade_execution',
  SETTINGS_CHANGE = 'settings_change',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

export enum ActivityCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  CONFIGURATION = 'configuration',
  TRADING = 'trading',
  COMPLIANCE = 'compliance'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ActivityOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  BLOCKED = 'blocked',
  FLAGGED = 'flagged'
}

export enum ActivityStatus {
  NORMAL = 'normal',
  SUSPICIOUS = 'suspicious',
  INVESTIGATED = 'investigated',
  CLEARED = 'cleared',
  CONFIRMED_MALICIOUS = 'confirmed_malicious'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  SERVER = 'server',
  IOT = 'iot',
  UNKNOWN = 'unknown'
}

export enum TrustLevel {
  UNKNOWN = 'unknown',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERIFIED = 'verified'
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPICIOUS = 'suspicious',
  BLOCKED = 'blocked',
  COMPROMISED = 'compromised'
}

export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  SUSPICIOUS = 'suspicious'
}

export enum AlertType {
  AUTHENTICATION_FAILURE = 'authentication_failure',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  DATA_BREACH = 'data_breach',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  SECURITY_POLICY_VIOLATION = 'security_policy_violation',
  MALWARE_DETECTION = 'malware_detection',
  INSIDER_THREAT = 'insider_threat',
  EXTERNAL_THREAT = 'external_threat'
}

export enum AlertSource {
  SYSTEM = 'system',
  USER_BEHAVIOR = 'user_behavior',
  NETWORK_MONITORING = 'network_monitoring',
  THREAT_INTELLIGENCE = 'threat_intelligence',
  COMPLIANCE_ENGINE = 'compliance_engine',
  THIRD_PARTY = 'third_party'
}

export enum AlertStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated'
}

export enum ActionType {
  BLOCK_USER = 'block_user',
  TERMINATE_SESSION = 'terminate_session',
  REQUIRE_MFA = 'require_mfa',
  NOTIFY_ADMIN = 'notify_admin',
  LOG_EVENT = 'log_event',
  QUARANTINE_DEVICE = 'quarantine_device'
}

export enum RecommendationType {
  SECURITY_ENHANCEMENT = 'security_enhancement',
  COMPLIANCE_FIX = 'compliance_fix',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  POLICY_UPDATE = 'policy_update',
  TRAINING = 'training'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum RecommendationCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_PROTECTION = 'data_protection',
  NETWORK_SECURITY = 'network_security',
  MONITORING = 'monitoring',
  COMPLIANCE = 'compliance',
  TRAINING = 'training'
}

export enum Impact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum Effort {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum RecommendationStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
  DEFERRED = 'deferred'
}

export enum ResourceType {
  DOCUMENTATION = 'documentation',
  TOOL = 'tool',
  SERVICE = 'service',
  TRAINING = 'training',
  POLICY = 'policy'
}

export enum ComplianceLevel {
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  COMPLIANT = 'compliant',
  FULLY_COMPLIANT = 'fully_compliant'
}

export enum ViolationStatus {
  OPEN = 'open',
  IN_REMEDIATION = 'in_remediation',
  RESOLVED = 'resolved',
  ACCEPTED = 'accepted',
  DEFERRED = 'deferred'
}

export enum AttestationStatus {
  PENDING = 'pending',
  ATTESTED = 'attested',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum AuditType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  THIRD_PARTY = 'third_party',
  REGULATORY = 'regulatory'
}

export enum AuditStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum CertificationStatus {
  VALID = 'valid',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked'
}

export enum RiskCategory {
  AUTHENTICATION = 'authentication',
  DATA_SECURITY = 'data_security',
  NETWORK_SECURITY = 'network_security',
  OPERATIONAL = 'operational',
  COMPLIANCE = 'compliance',
  REPUTATION = 'reputation',
  FINANCIAL = 'financial'
}

export enum ImplementationStatus {
  NOT_STARTED = 'not_started',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  IMPLEMENTED = 'implemented',
  VERIFIED = 'verified'
}

export enum TrendPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export enum TrendDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export enum BenchmarkType {
  PEER_GROUP = 'peer_group',
  INDUSTRY = 'industry',
  REGULATORY = 'regulatory',
  INTERNAL = 'internal'
}

export enum ThresholdCondition {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains'
}

export enum NotificationType {
  ALERT = 'alert',
  RECOMMENDATION = 'recommendation',
  COMPLIANCE = 'compliance',
  RISK_CHANGE = 'risk_change'
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

export enum FilterType {
  TIME_RANGE = 'time_range',
  SEVERITY = 'severity',
  CATEGORY = 'category',
  STATUS = 'status',
  DEVICE_TYPE = 'device_type'
}

export enum DashboardTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export enum FeatureStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error'
}

export enum AnomalyType {
  UNUSUAL_LOCATION = 'unusual_location',
  UNUSUAL_TIME = 'unusual_time',
  UNUSUAL_DEVICE = 'unusual_device',
  UNUSUAL_ACTIVITY_PATTERN = 'unusual_activity_pattern',
  CONCURRENT_SESSIONS = 'concurrent_sessions',
  RAPID_REQUESTS = 'rapid_requests'
}

// Additional interfaces for complex nested types
export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: ComplianceLevel;
  evidence: string[];
  lastAssessed: Date;
}

export interface ComplianceGap {
  requirement: string;
  description: string;
  severity: Severity;
  remediation: RemediationPlan;
}

export interface RemediationPlan {
  steps: string[];
  timeframe: number; // in days
  cost: number;
  resources: string[];
  responsible: string;
}

export interface AttestationPeriod {
  start: Date;
  end: Date;
  type: 'monthly' | 'quarterly' | 'annually';
}

export interface AttestationEvidence {
  type: string;
  url: string;
  description: string;
  uploadedAt: Date;
}

export interface AuditFinding {
  id: string;
  severity: Severity;
  description: string;
  evidence: string[];
  recommendation: string;
  status: 'open' | 'resolved' | 'accepted';
}

export interface LayoutConfig {
  columns: number;
  rows: number;
  responsive: boolean;
  spacing: number;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ChartConfig {
  type: string;
  data: string;
  options: Record<string, any>;
}

export interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  settings: Record<string, any>;
}

export interface BrandingConfig {
  logo: string;
  colors: ColorScheme;
  fonts: Record<string, string>;
}

export class AccountSecurityDashboardService extends EventEmitter {
  private dashboards: Map<string, SecurityDashboard> = new Map();
  private securityActivities: Map<string, SecurityActivity[]> = new Map();
  private deviceRegistry: Map<string, DeviceInfo[]> = new Map();
  private activeSessions: Map<string, SessionInfo[]> = new Map();
  private alertQueue: Map<string, SecurityAlert[]> = new Map();

  constructor() {
    super();
    this.initializeService();
  }

  public async getDashboard(userId: string, tenantId: string): Promise<SecurityDashboard | null> {
    const dashboardKey = `${userId}_${tenantId}`;
    let dashboard = this.dashboards.get(dashboardKey);
    
    if (!dashboard) {
      dashboard = await this.createDashboard(userId, tenantId);
    } else {
      // Refresh dashboard data if needed
      if (this.shouldRefreshDashboard(dashboard)) {
        await this.refreshDashboard(dashboard);
      }
    }
    
    return dashboard;
  }

  public async createDashboard(userId: string, tenantId: string): Promise<SecurityDashboard> {
    const dashboardKey = `${userId}_${tenantId}`;
    
    const dashboard: SecurityDashboard = {
      id: randomUUID(),
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

  public async addSecurityActivity(
    userId: string,
    tenantId: string,
    activity: Omit<SecurityActivity, 'id' | 'riskScore' | 'flagged' | 'investigated' | 'status'>
  ): Promise<SecurityActivity> {
    const newActivity: SecurityActivity = {
      id: randomUUID(),
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

    this.securityActivities.get(userKey)!.push(newActivity);

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

  public async registerDevice(
    userId: string,
    tenantId: string,
    device: Omit<DeviceInfo, 'id' | 'riskScore' | 'securityFeatures' | 'status'>
  ): Promise<DeviceInfo> {
    const newDevice: DeviceInfo = {
      id: randomUUID(),
      riskScore: await this.calculateDeviceRiskScore(device),
      securityFeatures: await this.detectSecurityFeatures(device),
      status: DeviceStatus.ACTIVE,
      ...device
    };

    const userKey = `${userId}_${tenantId}`;
    if (!this.deviceRegistry.has(userKey)) {
      this.deviceRegistry.set(userKey, []);
    }

    this.deviceRegistry.get(userKey)!.push(newDevice);

    // Update dashboard
    const dashboard = await this.getDashboard(userId, tenantId);
    if (dashboard) {
      dashboard.devices.push(newDevice);
      dashboard.lastUpdated = new Date();
    }

    this.emit('deviceRegistered', { userId, tenantId, device: newDevice });
    return newDevice;
  }

  public async createSession(
    userId: string,
    tenantId: string,
    sessionData: Omit<SessionInfo, 'id' | 'riskScore' | 'anomalies'>
  ): Promise<SessionInfo> {
    const session: SessionInfo = {
      id: randomUUID(),
      riskScore: await this.calculateSessionRiskScore(sessionData, userId),
      anomalies: await this.detectSessionAnomalies(sessionData, userId),
      ...sessionData
    };

    const userKey = `${userId}_${tenantId}`;
    if (!this.activeSessions.has(userKey)) {
      this.activeSessions.set(userKey, []);
    }

    this.activeSessions.get(userKey)!.push(session);

    // Generate alerts for high-risk sessions
    if (session.riskScore > 70 || session.anomalies.length > 0) {
      await this.generateSessionAlert(userId, tenantId, session);
    }

    this.emit('sessionCreated', { userId, tenantId, session });
    return session;
  }

  public async terminateSession(
    userId: string,
    tenantId: string,
    sessionId: string,
    reason: string
  ): Promise<boolean> {
    const userKey = `${userId}_${tenantId}`;
    const sessions = this.activeSessions.get(userKey) || [];
    
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return false;

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
        userAgent: session.metadata.userAgent || 'unknown',
        requestId: randomUUID()
      },
      location: session.location,
      device: this.getUserDevices(userId, tenantId).then(devices => 
        devices.find(d => d.deviceId === session.deviceId) || {} as DeviceInfo
      ) as any,
      outcome: ActivityOutcome.SUCCESS,
      tags: ['session_termination'],
      metadata: { reason, terminatedBy: 'system' }
    });

    sessions.splice(sessionIndex, 1);
    this.emit('sessionTerminated', { userId, tenantId, sessionId, reason });
    
    return true;
  }

  public async generateSecurityReport(
    userId: string,
    tenantId: string,
    timeRange: { start: Date; end: Date },
    format: 'json' | 'pdf' | 'csv' = 'json'
  ): Promise<any> {
    const dashboard = await this.getDashboard(userId, tenantId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const activities = await this.getSecurityActivities(userId, tenantId, {
      startDate: timeRange.start,
      endDate: timeRange.end
    });

    const report = {
      reportId: randomUUID(),
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

  public async updateDashboardSettings(
    userId: string,
    tenantId: string,
    settings: Partial<DashboardSettings>
  ): Promise<DashboardSettings | null> {
    const dashboard = await this.getDashboard(userId, tenantId);
    if (!dashboard) return null;

    dashboard.settings = { ...dashboard.settings, ...settings };
    dashboard.lastUpdated = new Date();

    this.emit('dashboardSettingsUpdated', { userId, tenantId, settings });
    return dashboard.settings;
  }

  private async generateSecurityOverview(userId: string, tenantId: string): Promise<SecurityOverview> {
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
      recentSecurityEvents: activities.filter(a => 
        a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      riskLevel: this.calculateOverallRiskLevel(activities, devices, sessions),
      complianceScore: await this.calculateComplianceScore(userId, tenantId),
      securityScore: await this.calculateSecurityScore(userId, tenantId),
      healthIndicators: await this.generateHealthIndicators(userId, tenantId)
    };
  }

  private async getRecentSecurityActivities(userId: string, tenantId: string, limit: number): Promise<SecurityActivity[]> {
    const userKey = `${userId}_${tenantId}`;
    const activities = this.securityActivities.get(userKey) || [];
    
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private async getUserDevices(userId: string, tenantId: string): Promise<DeviceInfo[]> {
    const userKey = `${userId}_${tenantId}`;
    return this.deviceRegistry.get(userKey) || [];
  }

  private async getActiveSessions(userId: string, tenantId: string): Promise<SessionInfo[]> {
    const userKey = `${userId}_${tenantId}`;
    return this.activeSessions.get(userKey) || [];
  }

  private async getActiveAlerts(userId: string, tenantId: string): Promise<SecurityAlert[]> {
    const userKey = `${userId}_${tenantId}`;
    return this.alertQueue.get(userKey) || [];
  }

  private async generateRecommendations(userId: string, tenantId: string): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];
    const overview = await this.generateSecurityOverview(userId, tenantId);

    // Password recommendations
    if (!overview.mfaEnabled) {
      recommendations.push({
        id: randomUUID(),
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
            id: randomUUID(),
            order: 1,
            title: 'Choose MFA Method',
            description: 'Select your preferred MFA method (SMS, Email, or Authenticator App)',
            isCompleted: false,
            estimatedTime: 5,
            dependencies: [],
            resources: []
          },
          {
            id: randomUUID(),
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

  private async getComplianceStatus(userId: string, tenantId: string): Promise<ComplianceStatus> {
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

  private async calculateRiskScore(userId: string, tenantId: string): Promise<RiskScore> {
    const activities = await this.getRecentSecurityActivities(userId, tenantId, 100);
    const devices = await this.getUserDevices(userId, tenantId);
    const sessions = await this.getActiveSessions(userId, tenantId);

    const components: RiskComponent[] = [
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

  private getDefaultDashboardSettings(): DashboardSettings {
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

  private shouldRefreshDashboard(dashboard: SecurityDashboard): boolean {
    const timeSinceLastUpdate = Date.now() - dashboard.lastUpdated.getTime();
    return timeSinceLastUpdate > (dashboard.refreshInterval * 1000);
  }

  private async refreshDashboard(dashboard: SecurityDashboard): Promise<any> {
    dashboard.overview = await this.generateSecurityOverview(dashboard.userId, dashboard.tenantId);
    dashboard.activities = await this.getRecentSecurityActivities(dashboard.userId, dashboard.tenantId, 50);
    dashboard.devices = await this.getUserDevices(dashboard.userId, dashboard.tenantId);
    dashboard.sessions = await this.getActiveSessions(dashboard.userId, dashboard.tenantId);
    dashboard.alerts = await this.getActiveAlerts(dashboard.userId, dashboard.tenantId);
    dashboard.recommendations = await this.generateRecommendations(dashboard.userId, dashboard.tenantId);
    dashboard.riskScore = await this.calculateRiskScore(dashboard.userId, dashboard.tenantId);
    dashboard.lastUpdated = new Date();
  }

  private async calculateActivityRiskScore(activity: Partial<SecurityActivity>, userId: string): Promise<number> {
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

  private async analyzeActivity(activity: SecurityActivity, userId: string): Promise<{
    flagged: boolean;
    status: ActivityStatus;
    riskScore: number;
  }> {
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

  private async generateSecurityAlert(userId: string, tenantId: string, activity: SecurityActivity): Promise<any> {
    const alert: SecurityAlert = {
      id: randomUUID(),
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

    this.alertQueue.get(userKey)!.push(alert);
    this.emit('securityAlertGenerated', { userId, tenantId, alert });
  }

  private async getSecurityActivities(
    userId: string,
    tenantId: string,
    filter: { startDate?: Date; endDate?: Date; type?: ActivityType; category?: ActivityCategory } = {}
  ): Promise<SecurityActivity[]> {
    const userKey = `${userId}_${tenantId}`;
    let activities = this.securityActivities.get(userKey) || [];

    if (filter.startDate) {
      activities = activities.filter(a => a.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      activities = activities.filter(a => a.timestamp <= filter.endDate!);
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
  private groupActivitiesByType(activities: SecurityActivity[]): Record<string, number> {
    return activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupActivitiesByCategory(activities: SecurityActivity[]): Record<string, number> {
    return activities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupActivitiesBySeverity(activities: SecurityActivity[]): Record<string, number> {
    return activities.reduce((acc, activity) => {
      acc[activity.severity] = (acc[activity.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private summarizeDevices(devices: DeviceInfo[]): any {
    return {
      total: devices.length,
      trusted: devices.filter(d => d.isTrusted).length,
      active: devices.filter(d => d.isActive).length,
      byType: devices.reduce((acc, device) => {
        acc[device.type] = (acc[device.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private summarizeSessions(sessions: SessionInfo[]): any {
    return {
      total: sessions.length,
      active: sessions.filter(s => s.isActive).length,
      averageDuration: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length,
      withAnomalies: sessions.filter(s => s.anomalies.length > 0).length
    };
  }

  private calculateActivityTrends(activities: SecurityActivity[]): any {
    // Simplified trend calculation
    const daily = activities.reduce((acc, activity) => {
      const date = activity.timestamp.toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { daily };
  }

  private calculateComplianceTrends(compliance: ComplianceStatus): any {
    return {
      score: compliance.frameworks.reduce((sum, fw) => sum + fw.score, 0) / compliance.frameworks.length,
      violations: compliance.violations.length,
      frameworks: compliance.frameworks.length
    };
  }

  // Additional helper methods
  private calculateOverallRiskLevel(activities: SecurityActivity[], devices: DeviceInfo[], sessions: SessionInfo[]): RiskLevel {
    const suspiciousActivities = activities.filter(a => a.status === ActivityStatus.SUSPICIOUS).length;
    const untrustedDevices = devices.filter(d => !d.isTrusted).length;
    const anomalousSessions = sessions.filter(s => s.anomalies.length > 0).length;

    const riskFactors = suspiciousActivities + untrustedDevices + anomalousSessions;

    if (riskFactors >= 10) return RiskLevel.CRITICAL;
    if (riskFactors >= 5) return RiskLevel.HIGH;
    if (riskFactors >= 2) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private async calculateComplianceScore(userId: string, tenantId: string): Promise<number> {
    // Simplified compliance score calculation
    return 85; // Would implement actual compliance checking
  }

  private async calculateSecurityScore(userId: string, tenantId: string): Promise<number> {
    // Simplified security score calculation based on various factors
    let score = 100;
    
    const overview = await this.generateSecurityOverview(userId, tenantId);
    
    if (!overview.mfaEnabled) score -= 20;
    if (overview.failedLoginAttempts > 5) score -= 15;
    if (overview.trustedDevicesCount === 0) score -= 10;
    if (overview.activeSessions > 5) score -= 5;

    return Math.max(0, score);
  }

  private async generateHealthIndicators(userId: string, tenantId: string): Promise<HealthIndicator[]> {
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

  private async calculateDeviceRiskScore(device: Partial<DeviceInfo>): Promise<number> {
    let score = 20; // Base score
    
    if (!device.isTrusted) score += 30;
    if (device.type === DeviceType.UNKNOWN) score += 20;
    
    return Math.min(100, score);
  }

  private async detectSecurityFeatures(device: Partial<DeviceInfo>): Promise<SecurityFeature[]> {
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

  private async calculateSessionRiskScore(session: Partial<SessionInfo>, userId: string): Promise<number> {
    let score = 10; // Base score
    
    if (await this.isUnusualLocation(userId, session.location!)) score += 40;
    if (session.duration && session.duration > 8 * 60 * 60 * 1000) score += 20; // Long sessions
    
    return Math.min(100, score);
  }

  private async detectSessionAnomalies(session: Partial<SessionInfo>, userId: string): Promise<SessionAnomaly[]> {
    const anomalies: SessionAnomaly[] = [];
    
    if (await this.isUnusualLocation(userId, session.location!)) {
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

  private async generateSessionAlert(userId: string, tenantId: string, session: SessionInfo): Promise<any> {
    const alert: SecurityAlert = {
      id: randomUUID(),
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
          id: randomUUID(),
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

    this.alertQueue.get(userKey)!.push(alert);
    this.emit('sessionAlertGenerated', { userId, tenantId, alert });
  }

  private getAlertTypeFromActivity(activity: SecurityActivity): AlertType {
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

  private async getRecentFailedLogins(userId: string): Promise<number> {
    const userKey = `${userId}_*`;
    // Simplified - would implement proper cross-tenant search
    return 3; // Mock value
  }

  private async isUnusualLocation(userId: string, location: LocationInfo): Promise<boolean> {
    // Simplified location analysis
    return location.country !== 'United States';
  }

  private calculateAuthenticationRisk(activities: SecurityActivity[]): number {
    const authActivities = activities.filter(a => a.category === ActivityCategory.AUTHENTICATION);
    const failedLogins = authActivities.filter(a => a.outcome === ActivityOutcome.FAILURE).length;
    const totalLogins = authActivities.filter(a => a.type === ActivityType.LOGIN).length;
    
    return totalLogins > 0 ? (failedLogins / totalLogins) * 100 : 0;
  }

  private calculateDataSecurityRisk(activities: SecurityActivity[]): number {
    const dataActivities = activities.filter(a => a.category === ActivityCategory.DATA_ACCESS);
    const suspiciousData = dataActivities.filter(a => a.status === ActivityStatus.SUSPICIOUS).length;
    
    return dataActivities.length > 0 ? (suspiciousData / dataActivities.length) * 100 : 0;
  }

  private calculateNetworkSecurityRisk(devices: DeviceInfo[], sessions: SessionInfo[]): number {
    const untrustedDevices = devices.filter(d => !d.isTrusted).length;
    const totalDevices = devices.length;
    const anomalousSessions = sessions.filter(s => s.anomalies.length > 0).length;
    const totalSessions = sessions.length;
    
    const deviceRisk = totalDevices > 0 ? (untrustedDevices / totalDevices) * 50 : 0;
    const sessionRisk = totalSessions > 0 ? (anomalousSessions / totalSessions) * 50 : 0;
    
    return deviceRisk + sessionRisk;
  }

  private createTrustedDeviceRecommendation(): SecurityRecommendation {
    return {
      id: randomUUID(),
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

  private createSecurityImprovementRecommendation(): SecurityRecommendation {
    return {
      id: randomUUID(),
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

  private initializeService(): void {
    // Start periodic cleanup of old data
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // Every hour
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    // Clean up old activities
    for (const [key, activities] of this.securityActivities.entries()) {
      this.securityActivities.set(key, activities.filter(a => a.timestamp > cutoffDate));
    }
    
    // Clean up resolved alerts
    for (const [key, alerts] of this.alertQueue.entries()) {
      this.alertQueue.set(key, alerts.filter(a => 
        a.status === AlertStatus.OPEN || a.timestamp > cutoffDate
      ));
    }
  }
}

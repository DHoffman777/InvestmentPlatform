import { EventEmitter } from 'events';
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
    refreshInterval: number;
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
    duration: number;
    isActive: boolean;
    ipAddress: string;
    location: LocationInfo;
    activities: string[];
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
    progress: number;
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
    overall: number;
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
    estimatedTime: number;
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
    timeframe: number;
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
export declare enum AccountStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    LOCKED = "locked",
    DISABLED = "disabled",
    PENDING = "pending",
    COMPROMISED = "compromised"
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ActivityType {
    LOGIN = "login",
    LOGOUT = "logout",
    PASSWORD_CHANGE = "password_change",
    MFA_SETUP = "mfa_setup",
    MFA_VERIFICATION = "mfa_verification",
    PROFILE_UPDATE = "profile_update",
    PERMISSION_CHANGE = "permission_change",
    DATA_ACCESS = "data_access",
    TRADE_EXECUTION = "trade_execution",
    SETTINGS_CHANGE = "settings_change",
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
}
export declare enum ActivityCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    DATA_ACCESS = "data_access",
    CONFIGURATION = "configuration",
    TRADING = "trading",
    COMPLIANCE = "compliance"
}
export declare enum Severity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ActivityOutcome {
    SUCCESS = "success",
    FAILURE = "failure",
    BLOCKED = "blocked",
    FLAGGED = "flagged"
}
export declare enum ActivityStatus {
    NORMAL = "normal",
    SUSPICIOUS = "suspicious",
    INVESTIGATED = "investigated",
    CLEARED = "cleared",
    CONFIRMED_MALICIOUS = "confirmed_malicious"
}
export declare enum DeviceType {
    DESKTOP = "desktop",
    LAPTOP = "laptop",
    MOBILE = "mobile",
    TABLET = "tablet",
    SERVER = "server",
    IOT = "iot",
    UNKNOWN = "unknown"
}
export declare enum TrustLevel {
    UNKNOWN = "unknown",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERIFIED = "verified"
}
export declare enum DeviceStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPICIOUS = "suspicious",
    BLOCKED = "blocked",
    COMPROMISED = "compromised"
}
export declare enum SessionStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    EXPIRED = "expired",
    TERMINATED = "terminated",
    SUSPICIOUS = "suspicious"
}
export declare enum AlertType {
    AUTHENTICATION_FAILURE = "authentication_failure",
    UNUSUAL_ACTIVITY = "unusual_activity",
    DATA_BREACH = "data_breach",
    COMPLIANCE_VIOLATION = "compliance_violation",
    SECURITY_POLICY_VIOLATION = "security_policy_violation",
    MALWARE_DETECTION = "malware_detection",
    INSIDER_THREAT = "insider_threat",
    EXTERNAL_THREAT = "external_threat"
}
export declare enum AlertSource {
    SYSTEM = "system",
    USER_BEHAVIOR = "user_behavior",
    NETWORK_MONITORING = "network_monitoring",
    THREAT_INTELLIGENCE = "threat_intelligence",
    COMPLIANCE_ENGINE = "compliance_engine",
    THIRD_PARTY = "third_party"
}
export declare enum AlertStatus {
    OPEN = "open",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    FALSE_POSITIVE = "false_positive",
    DISMISSED = "dismissed",
    ESCALATED = "escalated"
}
export declare enum ActionType {
    BLOCK_USER = "block_user",
    TERMINATE_SESSION = "terminate_session",
    REQUIRE_MFA = "require_mfa",
    NOTIFY_ADMIN = "notify_admin",
    LOG_EVENT = "log_event",
    QUARANTINE_DEVICE = "quarantine_device"
}
export declare enum RecommendationType {
    SECURITY_ENHANCEMENT = "security_enhancement",
    COMPLIANCE_FIX = "compliance_fix",
    PERFORMANCE_OPTIMIZATION = "performance_optimization",
    POLICY_UPDATE = "policy_update",
    TRAINING = "training"
}
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent",
    CRITICAL = "critical"
}
export declare enum RecommendationCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    DATA_PROTECTION = "data_protection",
    NETWORK_SECURITY = "network_security",
    MONITORING = "monitoring",
    COMPLIANCE = "compliance",
    TRAINING = "training"
}
export declare enum Impact {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare enum Effort {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare enum RecommendationStatus {
    NEW = "new",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    DISMISSED = "dismissed",
    DEFERRED = "deferred"
}
export declare enum ResourceType {
    DOCUMENTATION = "documentation",
    TOOL = "tool",
    SERVICE = "service",
    TRAINING = "training",
    POLICY = "policy"
}
export declare enum ComplianceLevel {
    NON_COMPLIANT = "non_compliant",
    PARTIALLY_COMPLIANT = "partially_compliant",
    COMPLIANT = "compliant",
    FULLY_COMPLIANT = "fully_compliant"
}
export declare enum ViolationStatus {
    OPEN = "open",
    IN_REMEDIATION = "in_remediation",
    RESOLVED = "resolved",
    ACCEPTED = "accepted",
    DEFERRED = "deferred"
}
export declare enum AttestationStatus {
    PENDING = "pending",
    ATTESTED = "attested",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare enum AuditType {
    INTERNAL = "internal",
    EXTERNAL = "external",
    THIRD_PARTY = "third_party",
    REGULATORY = "regulatory"
}
export declare enum AuditStatus {
    PLANNED = "planned",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum CertificationStatus {
    VALID = "valid",
    EXPIRED = "expired",
    SUSPENDED = "suspended",
    REVOKED = "revoked"
}
export declare enum RiskCategory {
    AUTHENTICATION = "authentication",
    DATA_SECURITY = "data_security",
    NETWORK_SECURITY = "network_security",
    OPERATIONAL = "operational",
    COMPLIANCE = "compliance",
    REPUTATION = "reputation",
    FINANCIAL = "financial"
}
export declare enum ImplementationStatus {
    NOT_STARTED = "not_started",
    PLANNED = "planned",
    IN_PROGRESS = "in_progress",
    IMPLEMENTED = "implemented",
    VERIFIED = "verified"
}
export declare enum TrendPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly"
}
export declare enum TrendDirection {
    INCREASING = "increasing",
    DECREASING = "decreasing",
    STABLE = "stable",
    VOLATILE = "volatile"
}
export declare enum BenchmarkType {
    PEER_GROUP = "peer_group",
    INDUSTRY = "industry",
    REGULATORY = "regulatory",
    INTERNAL = "internal"
}
export declare enum ThresholdCondition {
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    CONTAINS = "contains"
}
export declare enum NotificationType {
    ALERT = "alert",
    RECOMMENDATION = "recommendation",
    COMPLIANCE = "compliance",
    RISK_CHANGE = "risk_change"
}
export declare enum NotificationFrequency {
    IMMEDIATE = "immediate",
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly"
}
export declare enum FilterType {
    TIME_RANGE = "time_range",
    SEVERITY = "severity",
    CATEGORY = "category",
    STATUS = "status",
    DEVICE_TYPE = "device_type"
}
export declare enum DashboardTheme {
    LIGHT = "light",
    DARK = "dark",
    AUTO = "auto"
}
export declare enum HealthStatus {
    HEALTHY = "healthy",
    WARNING = "warning",
    CRITICAL = "critical",
    UNKNOWN = "unknown"
}
export declare enum FeatureStatus {
    ENABLED = "enabled",
    DISABLED = "disabled",
    UNAVAILABLE = "unavailable",
    ERROR = "error"
}
export declare enum AnomalyType {
    UNUSUAL_LOCATION = "unusual_location",
    UNUSUAL_TIME = "unusual_time",
    UNUSUAL_DEVICE = "unusual_device",
    UNUSUAL_ACTIVITY_PATTERN = "unusual_activity_pattern",
    CONCURRENT_SESSIONS = "concurrent_sessions",
    RAPID_REQUESTS = "rapid_requests"
}
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
    timeframe: number;
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
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    settings: Record<string, any>;
}
export interface BrandingConfig {
    logo: string;
    colors: ColorScheme;
    fonts: Record<string, string>;
}
export declare class AccountSecurityDashboardService extends EventEmitter {
    private dashboards;
    private securityActivities;
    private deviceRegistry;
    private activeSessions;
    private alertQueue;
    constructor();
    getDashboard(userId: string, tenantId: string): Promise<SecurityDashboard | null>;
    createDashboard(userId: string, tenantId: string): Promise<SecurityDashboard>;
    addSecurityActivity(userId: string, tenantId: string, activity: Omit<SecurityActivity, 'id' | 'riskScore' | 'flagged' | 'investigated' | 'status'>): Promise<SecurityActivity>;
    registerDevice(userId: string, tenantId: string, device: Omit<DeviceInfo, 'id' | 'riskScore' | 'securityFeatures' | 'status'>): Promise<DeviceInfo>;
    createSession(userId: string, tenantId: string, sessionData: Omit<SessionInfo, 'id' | 'riskScore' | 'anomalies'>): Promise<SessionInfo>;
    terminateSession(userId: string, tenantId: string, sessionId: string, reason: string): Promise<boolean>;
    generateSecurityReport(userId: string, tenantId: string, timeRange: {
        start: Date;
        end: Date;
    }, format?: 'json' | 'pdf' | 'csv'): Promise<any>;
    updateDashboardSettings(userId: string, tenantId: string, settings: Partial<DashboardSettings>): Promise<DashboardSettings | null>;
    private generateSecurityOverview;
    private getRecentSecurityActivities;
    private getUserDevices;
    private getActiveSessions;
    private getActiveAlerts;
    private generateRecommendations;
    private getComplianceStatus;
    private calculateRiskScore;
    private getDefaultDashboardSettings;
    private shouldRefreshDashboard;
    private refreshDashboard;
    private calculateActivityRiskScore;
    private analyzeActivity;
    private generateSecurityAlert;
    private getSecurityActivities;
    private groupActivitiesByType;
    private groupActivitiesByCategory;
    private groupActivitiesBySeverity;
    private summarizeDevices;
    private summarizeSessions;
    private calculateActivityTrends;
    private calculateComplianceTrends;
    private calculateOverallRiskLevel;
    private calculateComplianceScore;
    private calculateSecurityScore;
    private generateHealthIndicators;
    private calculateDeviceRiskScore;
    private detectSecurityFeatures;
    private calculateSessionRiskScore;
    private detectSessionAnomalies;
    private generateSessionAlert;
    private getAlertTypeFromActivity;
    private getRecentFailedLogins;
    private isUnusualLocation;
    private calculateAuthenticationRisk;
    private calculateDataSecurityRisk;
    private calculateNetworkSecurityRisk;
    private createTrustedDeviceRecommendation;
    private createSecurityImprovementRecommendation;
    private initializeService;
    private cleanupOldData;
}

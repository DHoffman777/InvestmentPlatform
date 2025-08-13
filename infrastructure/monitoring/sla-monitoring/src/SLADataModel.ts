export enum SLAMetricType {
  AVAILABILITY = 'availability',
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'error_rate',
  UPTIME = 'uptime',
  TRANSACTION_SUCCESS_RATE = 'transaction_success_rate',
  DATA_ACCURACY = 'data_accuracy',
  RECOVERY_TIME = 'recovery_time',
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
  SECURITY_COMPLIANCE = 'security_compliance',
  BUSINESS_CONTINUITY = 'business_continuity',
  CUSTOM = 'custom'
}

export enum SLASeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum SLAStatus {
  COMPLIANT = 'compliant',
  AT_RISK = 'at_risk',
  BREACHED = 'breached',
  UNKNOWN = 'unknown',
  MAINTENANCE = 'maintenance'
}

export enum SLANotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook',
  DASHBOARD = 'dashboard',
  MOBILE_PUSH = 'mobile_push'
}

export enum SLAReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM_PERIOD = 'custom_period',
  REAL_TIME = 'real_time',
  BREACH_SUMMARY = 'breach_summary',
  COMPLIANCE_SCORECARD = 'compliance_scorecard'
}

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  serviceId: string;
  serviceName: string;
  metricType: SLAMetricType;
  targetValue: number;
  unit: string;
  thresholds: SLAThresholds;
  measurement: SLAMeasurement;
  timeWindow: SLATimeWindow;
  businessHours?: SLABusinessHours;
  penalties: SLAPenalty[];
  notifications: SLANotificationRule[];
  tags: Record<string, string>;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface SLAThresholds {
  target: number;
  warning: number;
  critical: number;
  escalation: number;
  acceptable: number;
  excellent: number;
}

export interface SLAMeasurement {
  frequency: number; // milliseconds
  aggregationMethod: 'avg' | 'min' | 'max' | 'sum' | 'count' | 'percentile';
  percentileValue?: number; // for percentile aggregation
  excludeMaintenanceWindows: boolean;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  dataSource: string;
  queryTemplate: string;
  validationRules: string[];
}

export interface SLATimeWindow {
  type: 'rolling' | 'calendar' | 'sliding';
  duration: number; // milliseconds
  alignmentPeriod?: number; // for calendar windows
  bufferTime?: number; // grace period in milliseconds
}

export interface SLABusinessHours {
  timezone: string;
  weekdays: number[]; // 0=Sunday, 1=Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  holidays: Date[];
  maintenanceWindows: SLAMaintenanceWindow[];
}

export interface SLAMaintenanceWindow {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  recurrence?: SLARecurrence;
  isActive: boolean;
  affectedServices: string[];
}

export interface SLARecurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
}

export interface SLAPenalty {
  id: string;
  thresholdBreach: keyof SLAThresholds;
  penaltyType: 'financial' | 'service_credit' | 'escalation' | 'notification';
  amount?: number;
  currency?: string;
  serviceCredit?: number; // percentage
  escalationLevel?: number;
  description: string;
}

export interface SLANotificationRule {
  id: string;
  triggerCondition: SLANotificationTrigger;
  channels: SLANotificationChannel[];
  recipients: string[];
  template: string;
  frequency: SLANotificationFrequency;
  isActive: boolean;
}

export interface SLANotificationTrigger {
  event: 'threshold_breach' | 'status_change' | 'trend_alert' | 'recovery' | 'scheduled';
  severity?: SLASeverity;
  threshold?: keyof SLAThresholds;
  conditions?: Record<string, any>;
}

export interface SLANotificationFrequency {
  type: 'immediate' | 'digest' | 'throttled';
  digestInterval?: number; // for digest notifications
  throttleWindow?: number; // for throttled notifications
  maxNotificationsPerHour?: number;
}

export interface SLAMeasurementPoint {
  id: string;
  slaId: string;
  timestamp: Date;
  value: number;
  unit: string;
  metadata: Record<string, any>;
  tags: Record<string, string>;
  source: string;
  isValid: boolean;
  excludeFromCalculation?: boolean;
  exclusionReason?: string;
}

export interface SLAMetric {
  slaId: string;
  timeWindow: {
    start: Date;
    end: Date;
  };
  currentValue: number;
  targetValue: number;
  unit: string;
  status: SLAStatus;
  compliancePercentage: number;
  measurements: SLAMeasurementPoint[];
  trends: SLATrend[];
  breaches: SLABreach[];
  calculatedAt: Date;
}

export interface SLATrend {
  direction: 'improving' | 'degrading' | 'stable';
  magnitude: number;
  confidence: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  description: string;
}

export interface SLABreach {
  id: string;
  slaId: string;
  threshold: keyof SLAThresholds;
  severity: SLASeverity;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  actualValue: number;
  targetValue: number;
  impactValue: number;
  rootCause?: string;
  resolution?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  notifications: SLANotification[];
  penalties: SLAPenaltyInstance[];
  metadata: Record<string, any>;
}

export interface SLANotification {
  id: string;
  breachId: string;
  channel: SLANotificationChannel;
  recipient: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  retryCount: number;
  error?: string;
}

export interface SLAPenaltyInstance {
  id: string;
  breachId: string;
  penaltyId: string;
  amount: number;
  currency?: string;
  serviceCredit?: number;
  status: 'pending' | 'applied' | 'waived';
  appliedAt?: Date;
  waivedAt?: Date;
  waivedBy?: string;
  waiverReason?: string;
}

export interface SLAComplianceScore {
  slaId: string;
  timeWindow: {
    start: Date;
    end: Date;
  };
  overallScore: number; // 0-100
  availability: number;
  performance: number;
  reliability: number;
  breakdown: SLAScoreBreakdown;
  trends: SLAScoreTrend[];
  recommendations: string[];
  calculatedAt: Date;
}

export interface SLAScoreBreakdown {
  metricScores: Record<string, number>;
  weightedScores: Record<string, number>;
  penaltyDeductions: number;
  bonusPoints: number;
  compliancePercentage: number;
}

export interface SLAScoreTrend {
  period: string;
  score: number;
  change: number;
  changePercentage: number;
}

export interface SLAReport {
  id: string;
  type: SLAReportType;
  title: string;
  description: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  slaIds: string[];
  serviceIds: string[];
  data: SLAReportData;
  summary: SLAReportSummary;
  charts: SLAChart[];
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
  format: string[];
  recipients: string[];
  deliveryStatus: Record<string, 'pending' | 'sent' | 'delivered' | 'failed'>;
}

export interface SLAReportData {
  slaMetrics: SLAMetric[];
  complianceScores: SLAComplianceScore[];
  breaches: SLABreach[];
  trends: SLATrend[];
  penalties: SLAPenaltyInstance[];
  customData: Record<string, any>;
}

export interface SLAReportSummary {
  totalSLAs: number;
  compliantSLAs: number;
  breachedSLAs: number;
  atRiskSLAs: number;
  overallComplianceRate: number;
  totalBreaches: number;
  totalPenalties: number;
  averageResponseTime: number;
  uptimePercentage: number;
  keyInsights: string[];
}

export interface SLAChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'heatmap' | 'gauge' | 'scatter';
  data: any[];
  configuration: Record<string, any>;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface SLADashboard {
  id: string;
  name: string;
  description: string;
  widgets: SLAWidget[];
  layout: SLALayout;
  refreshInterval: number;
  permissions: SLAPermission[];
  filters: SLAFilter[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SLAWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'status' | 'compliance_score';
  title: string;
  configuration: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dataSource: string;
  refreshInterval?: number;
}

export interface SLALayout {
  columns: number;
  rows: number;
  gridSize: number;
  responsive: boolean;
}

export interface SLAPermission {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  restrictions?: string[];
}

export interface SLAFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  isActive: boolean;
}

export interface SLAAnalysis {
  slaId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  patterns: SLAPattern[];
  anomalies: SLAAnomaly[];
  correlations: SLACorrelation[];
  predictions: SLAPrediction[];
  rootCauseAnalysis: SLARootCauseAnalysis[];
  recommendations: SLARecommendation[];
  analysisType: 'historical' | 'real_time' | 'predictive';
  confidence: number;
  analysedAt: Date;
}

export interface SLAPattern {
  type: 'seasonal' | 'cyclical' | 'trending' | 'recurring';
  description: string;
  frequency: string;
  strength: number;
  timeWindow: {
    start: Date;
    end: Date;
  };
  impact: 'positive' | 'negative' | 'neutral';
}

export interface SLAAnomaly {
  id: string;
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: SLASeverity;
  description: string;
  possibleCauses: string[];
  investigated: boolean;
}

export interface SLACorrelation {
  slaId1: string;
  slaId2: string;
  coefficient: number;
  strength: 'weak' | 'moderate' | 'strong';
  timeWindow: {
    start: Date;
    end: Date;
  };
  description: string;
}

export interface SLAPrediction {
  slaId: string;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  probability: number;
  timeHorizon: number;
  model: string;
  accuracy: number;
  factors: string[];
}

export interface SLARootCauseAnalysis {
  breachId: string;
  causes: SLACause[];
  primaryCause: string;
  contributingFactors: string[];
  evidence: string[];
  resolution: string;
  preventiveMeasures: string[];
  confidence: number;
}

export interface SLACause {
  category: 'infrastructure' | 'application' | 'network' | 'external' | 'human_error';
  description: string;
  likelihood: number;
  impact: number;
  evidence: string[];
}

export interface SLARecommendation {
  id: string;
  slaId: string;
  type: 'optimization' | 'alerting' | 'threshold_adjustment' | 'process_improvement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
  estimatedImpact: number;
  timeline: string;
  status: 'pending' | 'approved' | 'implemented' | 'rejected';
}

export interface SLAConfiguration {
  refreshInterval: number;
  retentionPeriod: number;
  alertingEnabled: boolean;
  autoEscalation: boolean;
  maintenanceMode: boolean;
  defaultTimeZone: string;
  calculationPrecision: number;
  enablePredictiveAnalysis: boolean;
  enableRootCauseAnalysis: boolean;
  enableCustomMetrics: boolean;
  maxConcurrentCalculations: number;
  dataValidationRules: string[];
  integrations: Record<string, any>;
}
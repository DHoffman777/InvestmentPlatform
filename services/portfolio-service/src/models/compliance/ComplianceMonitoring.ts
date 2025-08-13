// Compliance Monitoring Models
// Phase 3.6 - Comprehensive compliance monitoring and regulatory oversight

// Regulatory Rule Engine Types
export type RuleOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IN' | 'NOT IN' | 'CONTAINS' | 'MATCHES';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: any;
}

export interface RuleExpression {
  type: 'SIMPLE' | 'LOGICAL' | 'CONDITIONAL';
  condition?: RuleCondition;
  operator?: 'AND' | 'OR';
  operands?: RuleExpression[];
  thenExpression?: RuleExpression;
  elseExpression?: RuleExpression;
}

export interface RegulatoryRule {
  id: string;
  tenantId: string;
  regulationCode: string;
  regulationName: string;
  jurisdiction: string;
  regulatoryBody: string;
  ruleExpression: string;
  ruleLogic: Record<string, any>;
  parameters: Record<string, any>;
  effectiveDate: Date;
  lastUpdated: Date;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleEvaluationContext {
  type: 'PRE_TRADE' | 'POST_TRADE' | 'ONGOING' | 'PERIODIC';
  portfolioId?: string;
  transactionId?: string;
  clientId?: string;
  data: Record<string, any>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  status: ComplianceStatus;
  severity: BreachSeverity;
  message: string;
  actualValue: any;
  expectedValue: any;
  context: RuleEvaluationContext;
  evaluatedAt: Date;
  evaluationTimeMs: number;
  details?: Record<string, any>;
}

export enum ComplianceRuleType {
  INVESTMENT_GUIDELINE = 'INVESTMENT_GUIDELINE',
  CONCENTRATION_LIMIT = 'CONCENTRATION_LIMIT',
  RESTRICTED_LIST = 'RESTRICTED_LIST',
  SUITABILITY_CHECK = 'SUITABILITY_CHECK',
  REGULATORY_LIMIT = 'REGULATORY_LIMIT',
  RISK_LIMIT = 'RISK_LIMIT',
  SECTOR_LIMIT = 'SECTOR_LIMIT',
  ASSET_CLASS_LIMIT = 'ASSET_CLASS_LIMIT',
  LIQUIDITY_REQUIREMENT = 'LIQUIDITY_REQUIREMENT',
  ESG_CRITERIA = 'ESG_CRITERIA'
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  WARNING = 'WARNING',
  BREACH = 'BREACH',
  PENDING_REVIEW = 'PENDING_REVIEW',
  WAIVED = 'WAIVED'
}

export enum BreachSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum MonitoringFrequency {
  REAL_TIME = 'REAL_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY'
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED'
}

export enum ActionType {
  AUTOMATIC_BLOCK = 'AUTOMATIC_BLOCK',
  REQUIRE_APPROVAL = 'REQUIRE_APPROVAL',
  ALERT_ONLY = 'ALERT_ONLY',
  SOFT_WARNING = 'SOFT_WARNING'
}

// Core Compliance Rule Definition
export interface ComplianceRule {
  id: string;
  tenantId: string;
  ruleCode: string;
  ruleName: string;
  description: string;
  ruleType: ComplianceRuleType;
  
  // Rule Logic
  conditions: RuleCondition[];
  parameters: Record<string, any>;
  thresholds: RuleThreshold[];
  
  // Scope
  applicablePortfolios?: string[];
  applicableClients?: string[];
  applicableAssetClasses?: string[];
  applicableSecurityTypes?: string[];
  
  // Monitoring
  monitoringFrequency: MonitoringFrequency;
  isActive: boolean;
  priority: number;
  
  // Actions
  breachAction: ActionType;
  warningThreshold?: number;
  
  // Metadata
  regulatorySource?: string;
  complianceOfficer: string;
  effectiveDate: Date;
  expirationDate?: Date;
  lastReviewDate?: Date;
  nextReviewDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface RuleCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_EQUAL' | 'LESS_EQUAL' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'REGEX';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleThreshold {
  name: string;
  value: number;
  unit: 'PERCENTAGE' | 'ABSOLUTE' | 'COUNT' | 'RATIO';
  warningLevel?: number;
  breachLevel: number;
}

// Investment Guidelines
export interface InvestmentGuideline {
  id: string;
  tenantId: string;
  portfolioId: string;
  clientId?: string;
  
  guidelineName: string;
  description: string;
  category: string;
  
  // Allocation Guidelines
  minEquityAllocation?: number;
  maxEquityAllocation?: number;
  minFixedIncomeAllocation?: number;
  maxFixedIncomeAllocation?: number;
  minCashAllocation?: number;
  maxCashAllocation?: number;
  minAlternativeAllocation?: number;
  maxAlternativeAllocation?: number;
  
  // Sector Guidelines
  sectorLimits?: SectorLimit[];
  
  // Security Guidelines
  maxSecurityConcentration: number;
  maxIssuerConcentration: number;
  minCreditRating?: string;
  allowedSecurityTypes: string[];
  
  // Risk Guidelines
  maxPortfolioVolatility?: number;
  maxDrawdown?: number;
  maxBeta?: number;
  minLiquidity?: number;
  
  // ESG Guidelines
  esgMinScore?: number;
  excludeSectors?: string[];
  requireESGScreening: boolean;
  
  isActive: boolean;
  effectiveDate: Date;
  expirationDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SectorLimit {
  sectorCode: string;
  sectorName: string;
  minAllocation?: number;
  maxAllocation: number;
  warningThreshold?: number;
}

// Compliance Breach
export interface ComplianceBreach {
  id: string;
  tenantId: string;
  ruleId: string;
  portfolioId: string;
  
  breachType: ComplianceRuleType;
  severity: BreachSeverity;
  status: ComplianceStatus;
  
  // Breach Details
  breachDescription: string;
  actualValue: number;
  limitValue: number;
  excessAmount: number;
  percentageOver: number;
  
  // Context
  instrumentId?: string;
  instrumentSymbol?: string;
  assetClass?: string;
  sector?: string;
  
  // Detection
  detectedAt: Date;
  detectionMethod: 'REAL_TIME' | 'BATCH' | 'MANUAL';
  
  // Resolution
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  
  // Workflow
  workflowId?: string;
  assignedTo?: string;
  escalatedAt?: Date;
  escalatedTo?: string;
  
  // Auto-remediation
  autoRemediationAttempted: boolean;
  autoRemediationSuccessful?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Restricted List Management
export interface RestrictedList {
  id: string;
  tenantId: string;
  
  listName: string;
  listType: 'PROHIBITED' | 'WATCH' | 'RESTRICTED' | 'APPROVED_ONLY';
  description: string;
  
  securities: RestrictedSecurity[];
  
  // Scope
  applicablePortfolios?: string[];
  applicableClients?: string[];
  
  // Actions
  violationAction: ActionType;
  allowExistingPositions: boolean;
  blockNewPositions: boolean;
  
  isActive: boolean;
  effectiveDate: Date;
  expirationDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface RestrictedSecurity {
  instrumentId: string;
  symbol: string;
  securityName: string;
  securityType: string;
  
  restrictionReason: string;
  restrictionLevel: 'PROHIBITED' | 'WATCH' | 'RESTRICTED' | 'APPROVED_ONLY';
  
  addedDate: Date;
  addedBy: string;
  expirationDate?: Date;
  
  allowedActions?: ('BUY' | 'SELL' | 'HOLD')[];
  maxPositionSize?: number;
  
  isActive: boolean;
}

// Suitability Assessment
export interface SuitabilityProfile {
  id: string;
  tenantId: string;
  clientId: string;
  
  // Risk Profile
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE';
  riskCapacity: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Investment Objectives
  primaryObjective: string;
  secondaryObjectives: string[];
  timeHorizon: number; // in years
  liquidityNeeds: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Financial Information
  netWorth?: number;
  annualIncome?: number;
  investmentExperience: 'NONE' | 'LIMITED' | 'GOOD' | 'EXTENSIVE';
  
  // Restrictions
  personalRestrictions: string[];
  regulatoryRestrictions: string[];
  
  // Suitability Rules
  maxEquityAllocation: number;
  maxAlternativeAllocation: number;
  maxConcentration: number;
  minCreditRating?: string;
  
  isActive: boolean;
  lastUpdated: Date;
  nextReviewDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SuitabilityCheck {
  id: string;
  tenantId: string;
  clientId: string;
  portfolioId: string;
  
  checkType: 'INITIAL' | 'ONGOING' | 'TRANSACTION_BASED';
  checkDate: Date;
  
  // Assessment Results
  overallSuitability: 'SUITABLE' | 'UNSUITABLE' | 'REQUIRES_REVIEW';
  suitabilityScore: number; // 0-100
  
  // Individual Checks
  riskAlignmentScore: number;
  objectiveAlignmentScore: number;
  concentrationScore: number;
  liquidityScore: number;
  
  // Issues Found
  suitabilityIssues: SuitabilityIssue[];
  
  // Recommendations
  recommendations: string[];
  requiredActions: string[];
  
  performedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SuitabilityIssue {
  issueType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  affectedInstruments?: string[];
  recommendedAction: string;
}

// Compliance Monitoring Dashboard
export interface ComplianceDashboard {
  tenantId: string;
  dashboardDate: Date;
  
  // Summary Statistics
  totalRules: number;
  activeRules: number;
  totalBreaches: number;
  newBreaches: number;
  resolvedBreaches: number;
  pendingBreaches: number;
  
  // Breach Breakdown
  breachBySeverity: Record<BreachSeverity, number>;
  breachByType: Record<ComplianceRuleType, number>;
  breachByPortfolio: Record<string, number>;
  
  // Top Issues
  topViolatedRules: RuleViolationSummary[];
  criticalBreaches: ComplianceBreach[];
  escalatedIssues: ComplianceBreach[];
  
  // Recent Activity
  recentBreaches: ComplianceBreach[];
  recentResolutions: ComplianceBreach[];
  upcomingReviews: ComplianceRule[];
  
  // Performance Metrics
  averageResolutionTime: number; // in hours
  breachTrend: TrendData[];
  complianceScore: number; // 0-100
  
  lastUpdated: Date;
}

export interface RuleViolationSummary {
  ruleId: string;
  ruleName: string;
  ruleType: ComplianceRuleType;
  violationCount: number;
  averageSeverity: number;
  lastViolation: Date;
}

export interface TrendData {
  date: Date;
  value: number;
  label?: string;
}

// Compliance Workflow
export interface ComplianceWorkflow {
  id: string;
  tenantId: string;
  breachId: string;
  
  workflowType: 'BREACH_RESOLUTION' | 'RULE_REVIEW' | 'SUITABILITY_REVIEW';
  status: WorkflowStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Assignment
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate: Date;
  
  // Workflow Steps
  steps: WorkflowStep[];
  currentStep: number;
  
  // Progress
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  
  // Resolution
  resolutionType?: 'RESOLVED' | 'WAIVED' | 'ESCALATED' | 'CANCELLED';
  resolutionNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  stepNumber: number;
  stepName: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  attachments?: string[];
}

// Regulatory Rule Engine
export interface RegulatoryRule {
  id: string;
  tenantId: string;
  
  regulationCode: string;
  regulationName: string;
  jurisdiction: string;
  regulatoryBody: string;
  
  // Rule Definition
  ruleExpression: string; // JavaScript expression or SQL-like syntax
  ruleLogic: RuleLogic;
  
  // Parameters
  parameters: RuleParameter[];
  
  // Metadata
  effectiveDate: Date;
  lastUpdated: Date;
  version: string;
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleLogic {
  conditions: RuleCondition[];
  actions: RuleAction[];
  expressions: Record<string, string>;
}

export interface RuleParameter {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ARRAY';
  defaultValue?: any;
  required: boolean;
  description: string;
}

export interface RuleAction {
  actionType: ActionType;
  parameters: Record<string, any>;
  message?: string;
}

// Compliance Reports
export interface ComplianceReport {
  id: string;
  tenantId: string;
  
  reportType: 'BREACH_SUMMARY' | 'PORTFOLIO_COMPLIANCE' | 'RULE_EFFECTIVENESS' | 'SUITABILITY_REPORT';
  reportName: string;
  description: string;
  
  // Report Parameters
  portfolioIds?: string[];
  clientIds?: string[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  
  // Report Data
  reportData: Record<string, any>;
  
  // Generation Info
  generatedAt: Date;
  generatedBy: string;
  format: 'PDF' | 'EXCEL' | 'JSON' | 'CSV';
  
  // Distribution
  recipients: string[];
  distributedAt?: Date;
  
  createdAt: Date;
}

// API Request/Response Types
export interface ComplianceCheckRequest {
  portfolioId: string;
  transactionId?: string;
  checkType: 'PRE_TRADE' | 'POST_TRADE' | 'ONGOING';
  ruleTypes?: ComplianceRuleType[];
}

export interface ComplianceCheckResult {
  portfolioId: string;
  overallStatus: ComplianceStatus;
  checkResults: RuleCheckResult[];
  blockedTransactions?: string[];
  warnings: string[];
  timestamp: Date;
}

export interface RuleCheckResult {
  ruleId: string;
  ruleName: string;
  ruleType: ComplianceRuleType;
  status: ComplianceStatus;
  actualValue?: number;
  limitValue?: number;
  message: string;
  severity?: BreachSeverity;
}

export interface BreachSearchRequest {
  tenantId: string;
  portfolioIds?: string[];
  ruleTypes?: ComplianceRuleType[];
  severities?: BreachSeverity[];
  statuses?: ComplianceStatus[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface BreachSearchResult {
  breaches: ComplianceBreach[];
  total: number;
  aggregateMetrics: {
    totalBreaches: number;
    criticalBreaches: number;
    unresolvedBreaches: number;
    averageResolutionTime: number;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
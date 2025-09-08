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
    ruleLogic: RuleLogic;
    parameters: RuleParameter[];
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
export declare enum ComplianceRuleType {
    INVESTMENT_GUIDELINE = "INVESTMENT_GUIDELINE",
    CONCENTRATION_LIMIT = "CONCENTRATION_LIMIT",
    RESTRICTED_LIST = "RESTRICTED_LIST",
    SUITABILITY_CHECK = "SUITABILITY_CHECK",
    REGULATORY_LIMIT = "REGULATORY_LIMIT",
    RISK_LIMIT = "RISK_LIMIT",
    SECTOR_LIMIT = "SECTOR_LIMIT",
    ASSET_CLASS_LIMIT = "ASSET_CLASS_LIMIT",
    LIQUIDITY_REQUIREMENT = "LIQUIDITY_REQUIREMENT",
    ESG_CRITERIA = "ESG_CRITERIA"
}
export declare enum ComplianceStatus {
    COMPLIANT = "COMPLIANT",
    WARNING = "WARNING",
    BREACH = "BREACH",
    PENDING_REVIEW = "PENDING_REVIEW",
    WAIVED = "WAIVED"
}
export declare enum BreachSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum MonitoringFrequency {
    REAL_TIME = "REAL_TIME",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY"
}
export declare enum WorkflowStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    ESCALATED = "ESCALATED",
    CANCELLED = "CANCELLED"
}
export declare enum ActionType {
    AUTOMATIC_BLOCK = "AUTOMATIC_BLOCK",
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL",
    ALERT_ONLY = "ALERT_ONLY",
    SOFT_WARNING = "SOFT_WARNING"
}
export interface ComplianceRule {
    id: string;
    tenantId: string;
    ruleCode: string;
    ruleName: string;
    description: string;
    ruleType: ComplianceRuleType;
    conditions: RuleCondition[];
    parameters: Record<string, any>;
    thresholds: RuleThreshold[];
    applicablePortfolios?: string[];
    applicableClients?: string[];
    applicableAssetClasses?: string[];
    applicableSecurityTypes?: string[];
    monitoringFrequency: MonitoringFrequency;
    isActive: boolean;
    priority: number;
    breachAction: ActionType;
    warningThreshold?: number;
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
export interface RuleConditionExtended {
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
export interface InvestmentGuideline {
    id: string;
    tenantId: string;
    portfolioId: string;
    clientId?: string;
    guidelineName: string;
    description: string;
    category: string;
    minEquityAllocation?: number;
    maxEquityAllocation?: number;
    minFixedIncomeAllocation?: number;
    maxFixedIncomeAllocation?: number;
    minCashAllocation?: number;
    maxCashAllocation?: number;
    minAlternativeAllocation?: number;
    maxAlternativeAllocation?: number;
    sectorLimits?: SectorLimit[];
    maxSecurityConcentration: number;
    maxIssuerConcentration: number;
    minCreditRating?: string;
    allowedSecurityTypes: string[];
    maxPortfolioVolatility?: number;
    maxDrawdown?: number;
    maxBeta?: number;
    minLiquidity?: number;
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
export interface ComplianceBreach {
    id: string;
    tenantId: string;
    ruleId: string;
    portfolioId: string;
    breachType: ComplianceRuleType;
    severity: BreachSeverity;
    status: ComplianceStatus;
    breachDescription: string;
    actualValue: number;
    limitValue: number;
    excessAmount: number;
    percentageOver: number;
    instrumentId?: string;
    instrumentSymbol?: string;
    assetClass?: string;
    sector?: string;
    detectedAt: Date;
    detectionMethod: 'REAL_TIME' | 'BATCH' | 'MANUAL';
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolutionNotes?: string;
    workflowId?: string;
    assignedTo?: string;
    escalatedAt?: Date;
    escalatedTo?: string;
    autoRemediationAttempted: boolean;
    autoRemediationSuccessful?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RestrictedList {
    id: string;
    tenantId: string;
    listName: string;
    listType: 'PROHIBITED' | 'WATCH' | 'RESTRICTED' | 'APPROVED_ONLY';
    description: string;
    securities: RestrictedSecurity[];
    applicablePortfolios?: string[];
    applicableClients?: string[];
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
    securityId: string;
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
export interface SuitabilityProfile {
    id: string;
    tenantId: string;
    clientId: string;
    riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE';
    riskCapacity: 'LOW' | 'MEDIUM' | 'HIGH';
    primaryObjective: string;
    secondaryObjectives: string[];
    timeHorizon: number;
    liquidityNeeds: 'LOW' | 'MEDIUM' | 'HIGH';
    netWorth?: number;
    annualIncome?: number;
    investmentExperience: 'NONE' | 'LIMITED' | 'GOOD' | 'EXTENSIVE';
    personalRestrictions: string[];
    regulatoryRestrictions: string[];
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
    overallSuitability: 'SUITABLE' | 'UNSUITABLE' | 'REQUIRES_REVIEW';
    suitabilityScore: number;
    riskAlignmentScore: number;
    objectiveAlignmentScore: number;
    concentrationScore: number;
    liquidityScore: number;
    suitabilityIssues: SuitabilityIssue[];
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
export interface ComplianceDashboard {
    tenantId: string;
    dashboardDate: Date;
    totalRules: number;
    activeRules: number;
    totalBreaches: number;
    newBreaches: number;
    resolvedBreaches: number;
    pendingBreaches: number;
    breachBySeverity: Record<BreachSeverity, number>;
    breachByType: Record<ComplianceRuleType, number>;
    breachByPortfolio: Record<string, number>;
    topViolatedRules: RuleViolationSummary[];
    criticalBreaches: ComplianceBreach[];
    escalatedIssues: ComplianceBreach[];
    recentBreaches: ComplianceBreach[];
    recentResolutions: ComplianceBreach[];
    upcomingReviews: ComplianceRule[];
    averageResolutionTime: number;
    breachTrend: TrendData[];
    complianceScore: number;
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
export interface ComplianceWorkflow {
    id: string;
    tenantId: string;
    breachId: string;
    workflowType: 'BREACH_RESOLUTION' | 'RULE_REVIEW' | 'SUITABILITY_REVIEW';
    status: WorkflowStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedTo: string;
    assignedBy: string;
    assignedAt: Date;
    dueDate: Date;
    steps: WorkflowStep[];
    currentStep: number;
    startedAt: Date;
    completedAt?: Date;
    lastActivityAt: Date;
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
export interface RegulatoryRule {
    id: string;
    tenantId: string;
    regulationCode: string;
    regulationName: string;
    jurisdiction: string;
    regulatoryBody: string;
    ruleExpression: string;
    ruleLogic: RuleLogic;
    parameters: RuleParameter[];
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
export interface ComplianceReport {
    id: string;
    tenantId: string;
    reportType: 'BREACH_SUMMARY' | 'PORTFOLIO_COMPLIANCE' | 'RULE_EFFECTIVENESS' | 'SUITABILITY_REPORT';
    reportName: string;
    description: string;
    portfolioIds?: string[];
    clientIds?: string[];
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    reportData: Record<string, any>;
    generatedAt: Date;
    generatedBy: string;
    format: 'PDF' | 'EXCEL' | 'JSON' | 'CSV';
    recipients: string[];
    distributedAt?: Date;
    createdAt: Date;
}
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

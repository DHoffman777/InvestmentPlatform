import { EventEmitter } from 'events';
export interface AccountClosureRequest {
    id: string;
    userId: string;
    tenantId: string;
    requestedAt: Date;
    closureType: ClosureType;
    reason: ClosureReason;
    customReason?: string;
    priority: ClosurePriority;
    urgency: UrgencyLevel;
    status: ClosureStatus;
    currentStep: ClosureStep;
    workflow: ClosureWorkflow;
    timeline: ClosureTimeline;
    dependencies: ClosureDependency[];
    approvals: ApprovalRequirement[];
    notifications: NotificationPlan[];
    dataHandling: DataHandlingPlan;
    compliance: ComplianceRequirements;
    businessImpact: BusinessImpactAssessment;
    rollbackPlan: RollbackPlan;
    auditTrail: ClosureAuditEntry[];
    metadata: Record<string, any>;
}
export interface ClosureWorkflow {
    id: string;
    name: string;
    version: string;
    steps: WorkflowStep[];
    parallelSteps: string[][];
    conditionalSteps: ConditionalStep[];
    errorHandling: ErrorHandlingConfig;
    rollbackConfig: RollbackConfig;
    timeouts: WorkflowTimeout[];
    approvalGates: ApprovalGate[];
    hooks: WorkflowHook[];
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: StepType;
    description: string;
    status: StepStatus;
    startTime?: Date;
    endTime?: Date;
    estimatedDuration: number;
    actualDuration?: number;
    dependencies: string[];
    prerequisites: Prerequisite[];
    actions: StepAction[];
    validations: StepValidation[];
    output: StepOutput;
    errorCount: number;
    retryCount: number;
    maxRetries: number;
    isReversible: boolean;
    reversalActions?: StepAction[];
    progress: number;
    metadata: Record<string, any>;
}
export interface ClosureTimeline {
    estimatedDuration: number;
    actualDuration?: number;
    startDate: Date;
    estimatedCompletionDate: Date;
    actualCompletionDate?: Date;
    milestones: Milestone[];
    criticalPath: string[];
    bufferDays: number;
    holidayCalendar: string[];
    businessDays: boolean;
}
export interface ClosureDependency {
    id: string;
    type: DependencyType;
    description: string;
    dependentOn: string;
    status: DependencyStatus;
    blocking: boolean;
    criticality: DependencyCriticality;
    estimatedResolution?: Date;
    resolution?: string;
    resolvedAt?: Date;
    contactPerson?: string;
    escalationPath: string[];
}
export interface ApprovalRequirement {
    id: string;
    type: ApprovalType;
    stepId: string;
    approverRole: string;
    approverUserId?: string;
    approverName?: string;
    required: boolean;
    status: ApprovalStatus;
    requestedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    comment?: string;
    conditions: ApprovalCondition[];
    delegation: ApprovalDelegation[];
    reminder: ReminderConfig;
    escalation: EscalationConfig;
    evidence: ApprovalEvidence[];
}
export interface NotificationPlan {
    id: string;
    type: NotificationType;
    recipient: NotificationRecipient;
    trigger: NotificationTrigger;
    timing: NotificationTiming;
    channels: NotificationChannel[];
    template: NotificationTemplate;
    personalization: NotificationPersonalization;
    compliance: NotificationCompliance;
    delivery: NotificationDelivery;
    feedback: NotificationFeedback;
}
export interface DataHandlingPlan {
    dataInventory: DataInventoryItem[];
    retentionPolicies: DataRetentionPolicy[];
    deletionSchedule: DataDeletionSchedule[];
    backupStrategy: DataBackupStrategy;
    transferPlans: DataTransferPlan[];
    anonymizationRules: DataAnonymizationRule[];
    complianceChecks: DataComplianceCheck[];
    verificationSteps: DataVerificationStep[];
    recovery: DataRecoveryPlan;
}
export interface ComplianceRequirements {
    regulations: ApplicableRegulation[];
    certifications: ComplianceCertification[];
    policies: CompliancePolicy[];
    attestations: ComplianceAttestation[];
    documentation: ComplianceDocumentation[];
    reporting: ComplianceReporting[];
    auditing: ComplianceAuditing;
    retention: ComplianceRetention;
}
export interface BusinessImpactAssessment {
    riskLevel: RiskLevel;
    impactCategories: ImpactCategory[];
    affectedSystems: AffectedSystem[];
    dependentUsers: DependentUser[];
    revenueImpact: RevenueImpact;
    operationalImpact: OperationalImpact;
    complianceImpact: ComplianceImpact;
    mitigationStrategies: MitigationStrategy[];
    continuityPlan: ContinuityPlan;
}
export interface RollbackPlan {
    isRollbackPossible: boolean;
    pointOfNoReturn?: string;
    rollbackSteps: RollbackStep[];
    dataRecoveryPlan: DataRecoveryPlan;
    systemRecoveryPlan: SystemRecoveryPlan;
    rollbackTimeWindow: number;
    rollbackTriggers: RollbackTrigger[];
    rollbackApprovals: ApprovalRequirement[];
    communicationPlan: CommunicationPlan;
}
export interface ClosureAuditEntry {
    id: string;
    timestamp: Date;
    action: ClosureAction;
    performedBy: string;
    stepId?: string;
    previousStatus?: ClosureStatus;
    newStatus?: ClosureStatus;
    details: string;
    evidence: AuditEvidence[];
    ipAddress: string;
    userAgent: string;
    systemInfo: SystemInfo;
    compliance: AuditCompliance;
}
export interface ConditionalStep {
    stepId: string;
    condition: StepCondition;
    trueFlow: string[];
    falseFlow: string[];
    evaluationOrder: number;
}
export interface ErrorHandlingConfig {
    retryPolicy: RetryPolicy;
    fallbackActions: FallbackAction[];
    alerting: AlertingConfig;
    escalation: ErrorEscalation;
    monitoring: ErrorMonitoring;
}
export interface RollbackConfig {
    enabled: boolean;
    automaticTriggers: AutomaticTrigger[];
    manualApprovalRequired: boolean;
    timeWindow: number;
    dataBackupRequired: boolean;
}
export interface WorkflowTimeout {
    stepId: string;
    timeoutMinutes: number;
    action: TimeoutAction;
    notification: TimeoutNotification;
}
export interface ApprovalGate {
    stepId: string;
    approvalType: ApprovalType;
    required: boolean;
    parallel: boolean;
    unanimityRequired: boolean;
}
export interface WorkflowHook {
    stepId: string;
    event: HookEvent;
    action: HookAction;
    condition?: string;
    async: boolean;
}
export interface Prerequisite {
    type: PrerequisiteType;
    description: string;
    validation: string;
    required: boolean;
    autoCheck: boolean;
}
export interface StepAction {
    id: string;
    type: ActionType;
    description: string;
    executor: ActionExecutor;
    parameters: Record<string, any>;
    timeout: number;
    retries: number;
    rollbackAction?: StepAction;
}
export interface StepValidation {
    type: ValidationType;
    description: string;
    validation: string;
    failureAction: ValidationFailureAction;
}
export interface StepOutput {
    type: OutputType;
    data: Record<string, any>;
    artifacts: OutputArtifact[];
    metrics: OutputMetric[];
    logs: string[];
}
export interface Milestone {
    id: string;
    name: string;
    description: string;
    targetDate: Date;
    actualDate?: Date;
    status: MilestoneStatus;
    dependencies: string[];
    stakeholders: string[];
    deliverables: string[];
}
export interface DataInventoryItem {
    category: DataCategory;
    location: string;
    type: DataType;
    volume: DataVolume;
    sensitivity: DataSensitivity;
    retention: RetentionRequirement;
    dependencies: string[];
    owner: string;
    classification: DataClassification;
}
export interface DataRetentionPolicy {
    category: DataCategory;
    retentionPeriod: number;
    retentionBasis: RetentionBasis;
    exceptions: RetentionException[];
    destructionMethod: DestructionMethod;
    verification: RetentionVerification;
}
export interface DataDeletionSchedule {
    category: DataCategory;
    scheduledDate: Date;
    method: DeletionMethod;
    verification: DeletionVerification;
    backup: boolean;
    recoveryWindow: number;
    approvalRequired: boolean;
}
export interface ApplicableRegulation {
    name: string;
    jurisdiction: string;
    requirements: RegulationRequirement[];
    compliance: RegulationCompliance;
    reporting: RegulationReporting;
    penalties: RegulationPenalty[];
}
export interface ImpactCategory {
    category: string;
    severity: ImpactSeverity;
    description: string;
    affectedStakeholders: string[];
    mitigationOptions: string[];
    timeToRecover: number;
}
export interface AffectedSystem {
    systemId: string;
    systemName: string;
    impactType: SystemImpactType;
    criticality: SystemCriticality;
    dependencies: string[];
    recoverytime: number;
    alternativeOptions: string[];
}
export interface RollbackStep {
    id: string;
    name: string;
    description: string;
    targetStepId: string;
    actions: StepAction[];
    verifications: RollbackVerification[];
    timeRequired: number;
    riskLevel: RiskLevel;
    dataLoss: boolean;
    irreversible: boolean;
}
export declare enum ClosureType {
    VOLUNTARY = "voluntary",
    INVOLUNTARY = "involuntary",
    REGULATORY = "regulatory",
    BUSINESS_CLOSURE = "business_closure",
    MIGRATION = "migration",
    CONSOLIDATION = "consolidation",
    SUSPENSION = "suspension",
    DORMANCY = "dormancy"
}
export declare enum ClosureReason {
    USER_REQUEST = "user_request",
    INACTIVITY = "inactivity",
    COMPLIANCE_VIOLATION = "compliance_violation",
    RISK_MANAGEMENT = "risk_management",
    BUSINESS_DECISION = "business_decision",
    REGULATORY_ORDER = "regulatory_order",
    FRAUD_DETECTED = "fraud_detected",
    TERMS_VIOLATION = "terms_violation",
    DUPLICATE_ACCOUNT = "duplicate_account",
    DEATH = "death",
    BANKRUPTCY = "bankruptcy",
    SANCTIONS = "sanctions",
    OTHER = "other"
}
export declare enum ClosurePriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent",
    CRITICAL = "critical"
}
export declare enum UrgencyLevel {
    ROUTINE = "routine",
    EXPEDITED = "expedited",
    URGENT = "urgent",
    EMERGENCY = "emergency"
}
export declare enum ClosureStatus {
    REQUESTED = "requested",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    IN_PROGRESS = "in_progress",
    PAUSED = "paused",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    FAILED = "failed",
    ROLLED_BACK = "rolled_back"
}
export declare enum ClosureStep {
    INITIAL_REVIEW = "initial_review",
    IMPACT_ASSESSMENT = "impact_assessment",
    APPROVAL_PROCESS = "approval_process",
    DATA_BACKUP = "data_backup",
    POSITION_CLOSURE = "position_closure",
    FUND_TRANSFER = "fund_transfer",
    DOCUMENT_GENERATION = "document_generation",
    NOTIFICATION_SENDING = "notification_sending",
    SYSTEM_DEACTIVATION = "system_deactivation",
    DATA_DELETION = "data_deletion",
    COMPLIANCE_VERIFICATION = "compliance_verification",
    FINAL_CONFIRMATION = "final_confirmation"
}
export declare enum StepType {
    MANUAL = "manual",
    AUTOMATED = "automated",
    HYBRID = "hybrid",
    APPROVAL = "approval",
    NOTIFICATION = "notification",
    VALIDATION = "validation",
    DATA_PROCESSING = "data_processing",
    SYSTEM_INTEGRATION = "system_integration",
    COMPLIANCE_CHECK = "compliance_check",
    ROLLBACK_POINT = "rollback_point"
}
export declare enum StepStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    SKIPPED = "skipped",
    BLOCKED = "blocked",
    WAITING_APPROVAL = "waiting_approval",
    ROLLED_BACK = "rolled_back"
}
export declare enum DependencyType {
    STEP_DEPENDENCY = "step_dependency",
    SYSTEM_DEPENDENCY = "system_dependency",
    DATA_DEPENDENCY = "data_dependency",
    APPROVAL_DEPENDENCY = "approval_dependency",
    EXTERNAL_DEPENDENCY = "external_dependency",
    REGULATORY_DEPENDENCY = "regulatory_dependency"
}
export declare enum DependencyStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    RESOLVED = "resolved",
    BLOCKED = "blocked",
    ESCALATED = "escalated"
}
export declare enum DependencyCriticality {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ApprovalType {
    MANAGER_APPROVAL = "manager_approval",
    COMPLIANCE_APPROVAL = "compliance_approval",
    LEGAL_APPROVAL = "legal_approval",
    RISK_APPROVAL = "risk_approval",
    TECHNICAL_APPROVAL = "technical_approval",
    BUSINESS_APPROVAL = "business_approval",
    REGULATORY_APPROVAL = "regulatory_approval"
}
export declare enum ApprovalStatus {
    PENDING = "pending",
    REQUESTED = "requested",
    APPROVED = "approved",
    REJECTED = "rejected",
    ESCALATED = "escalated",
    EXPIRED = "expired",
    WITHDRAWN = "withdrawn"
}
export declare enum NotificationType {
    CLOSURE_REQUEST = "closure_request",
    STATUS_UPDATE = "status_update",
    APPROVAL_REQUEST = "approval_request",
    COMPLETION_NOTICE = "completion_notice",
    ERROR_ALERT = "error_alert",
    REGULATORY_NOTICE = "regulatory_notice",
    STAKEHOLDER_UPDATE = "stakeholder_update"
}
export declare enum NotificationRecipient {
    ACCOUNT_HOLDER = "account_holder",
    COMPLIANCE_TEAM = "compliance_team",
    RISK_TEAM = "risk_team",
    OPERATIONS_TEAM = "operations_team",
    LEGAL_TEAM = "legal_team",
    MANAGEMENT = "management",
    REGULATORS = "regulators",
    THIRD_PARTIES = "third_parties"
}
export declare enum NotificationTrigger {
    STEP_COMPLETION = "step_completion",
    STATUS_CHANGE = "status_change",
    ERROR_OCCURRENCE = "error_occurrence",
    APPROVAL_REQUEST = "approval_request",
    DEADLINE_APPROACHING = "deadline_approaching",
    MILESTONE_REACHED = "milestone_reached",
    ESCALATION = "escalation"
}
export declare enum DataCategory {
    PERSONAL_DATA = "personal_data",
    FINANCIAL_DATA = "financial_data",
    TRADING_DATA = "trading_data",
    ACCOUNT_DATA = "account_data",
    COMMUNICATION_DATA = "communication_data",
    SYSTEM_DATA = "system_data",
    AUDIT_DATA = "audit_data",
    METADATA = "metadata"
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ClosureAction {
    REQUEST_SUBMITTED = "request_submitted",
    REVIEW_STARTED = "review_started",
    APPROVED = "approved",
    REJECTED = "rejected",
    STEP_STARTED = "step_started",
    STEP_COMPLETED = "step_completed",
    STEP_FAILED = "step_failed",
    ESCALATED = "escalated",
    PAUSED = "paused",
    RESUMED = "resumed",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    ROLLED_BACK = "rolled_back"
}
export declare enum ImpactSeverity {
    MINIMAL = "minimal",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    SEVERE = "severe"
}
export declare enum SystemImpactType {
    FULL_SHUTDOWN = "full_shutdown",
    PARTIAL_SHUTDOWN = "partial_shutdown",
    PERFORMANCE_DEGRADATION = "performance_degradation",
    FUNCTIONALITY_LOSS = "functionality_loss",
    DATA_UNAVAILABILITY = "data_unavailability"
}
export declare enum SystemCriticality {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum MilestoneStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    DELAYED = "delayed",
    AT_RISK = "at_risk"
}
export interface StepCondition {
    field: string;
    operator: ConditionOperator;
    value: any;
    logicalOperator?: LogicalOperator;
}
export interface RetryPolicy {
    maxRetries: number;
    backoffStrategy: BackoffStrategy;
    retryableErrors: string[];
    exponentialBase: number;
    maxBackoffTime: number;
}
export interface FallbackAction {
    condition: string;
    action: ActionType;
    parameters: Record<string, any>;
}
export interface AlertingConfig {
    enabled: boolean;
    channels: string[];
    escalation: AlertEscalation;
    templates: AlertTemplate[];
}
export interface ErrorEscalation {
    levels: EscalationLevel[];
    timeouts: number[];
    recipients: string[];
}
export interface ErrorMonitoring {
    metricsCollection: boolean;
    logAggregation: boolean;
    realTimeAlerts: boolean;
    dashboard: boolean;
}
export interface AutomaticTrigger {
    condition: string;
    action: RollbackTriggerAction;
    delay: number;
}
export interface TimeoutAction {
    type: ActionType;
    parameters: Record<string, any>;
    notification: boolean;
}
export interface TimeoutNotification {
    recipients: string[];
    template: string;
    channels: string[];
}
export interface HookEvent {
    type: HookEventType;
    timing: HookTiming;
}
export interface HookAction {
    type: ActionType;
    endpoint?: string;
    parameters: Record<string, any>;
}
export declare enum PrerequisiteType {
    SYSTEM_CHECK = "system_check",
    DATA_VALIDATION = "data_validation",
    APPROVAL_CHECK = "approval_check",
    DEPENDENCY_CHECK = "dependency_check"
}
export interface ActionExecutor {
    type: ExecutorType;
    service: string;
    method: string;
    authentication: ExecutorAuth;
}
export interface OutputArtifact {
    name: string;
    type: ArtifactType;
    location: string;
    metadata: Record<string, any>;
}
export interface OutputMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    EXISTS = "exists"
}
export declare enum LogicalOperator {
    AND = "and",
    OR = "or",
    NOT = "not"
}
export declare enum BackoffStrategy {
    LINEAR = "linear",
    EXPONENTIAL = "exponential",
    FIXED = "fixed"
}
export declare enum ActionType {
    API_CALL = "api_call",
    DATABASE_OPERATION = "database_operation",
    FILE_OPERATION = "file_operation",
    NOTIFICATION = "notification",
    SYSTEM_COMMAND = "system_command",
    APPROVAL_REQUEST = "approval_request",
    DATA_PROCESSING = "data_processing",
    VALIDATION = "validation"
}
export declare enum ValidationType {
    DATA_INTEGRITY = "data_integrity",
    BUSINESS_RULE = "business_rule",
    COMPLIANCE_CHECK = "compliance_check",
    SYSTEM_CHECK = "system_check"
}
export declare enum ValidationFailureAction {
    FAIL_STEP = "fail_step",
    RETRY = "retry",
    SKIP = "skip",
    ESCALATE = "escalate",
    ROLLBACK = "rollback"
}
export declare enum OutputType {
    DATA = "data",
    FILE = "file",
    REPORT = "report",
    METRICS = "metrics",
    LOG = "log"
}
export declare enum HookEventType {
    STEP_START = "step_start",
    STEP_END = "step_end",
    STEP_ERROR = "step_error",
    APPROVAL_REQUIRED = "approval_required"
}
export declare enum HookTiming {
    BEFORE = "before",
    AFTER = "after",
    ON_ERROR = "on_error"
}
export declare enum ExecutorType {
    REST_API = "rest_api",
    GRAPHQL = "graphql",
    DATABASE = "database",
    QUEUE = "queue",
    SCRIPT = "script"
}
export declare enum ArtifactType {
    DOCUMENT = "document",
    REPORT = "report",
    DATA_EXPORT = "data_export",
    CONFIGURATION = "configuration",
    LOG_FILE = "log_file"
}
export declare enum RollbackTriggerAction {
    AUTOMATIC_ROLLBACK = "automatic_rollback",
    ALERT_ONLY = "alert_only",
    PAUSE_WORKFLOW = "pause_workflow"
}
export interface AlertEscalation {
    enabled: boolean;
    levels: EscalationLevel[];
}
export interface EscalationLevel {
    level: number;
    delay: number;
    recipients: string[];
    actions: string[];
}
export interface AlertTemplate {
    name: string;
    subject: string;
    body: string;
    variables: string[];
}
export interface ApprovalCondition {
    field: string;
    operator: string;
    value: any;
}
export interface ApprovalDelegation {
    fromUserId: string;
    toUserId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
}
export interface ReminderConfig {
    enabled: boolean;
    intervals: number[];
    maxReminders: number;
}
export interface EscalationConfig {
    enabled: boolean;
    timeout: number;
    escalateTo: string[];
}
export interface ApprovalEvidence {
    type: string;
    description: string;
    attachment?: string;
    timestamp: Date;
}
export interface NotificationChannel {
    type: string;
    address: string;
    priority: number;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
}
export interface NotificationPersonalization {
    language: string;
    timezone: string;
    format: string;
    preferences: Record<string, any>;
}
export interface NotificationCompliance {
    gdprCompliant: boolean;
    consentRequired: boolean;
    retentionPeriod: number;
    optOutMechanism: boolean;
}
export interface NotificationDelivery {
    method: string;
    priority: number;
    retry: RetryPolicy;
    tracking: boolean;
}
export interface NotificationFeedback {
    deliveryStatus: string;
    readStatus: string;
    responseStatus: string;
    timestamp: Date;
}
export interface NotificationTiming {
    immediate: boolean;
    scheduled?: Date;
    delay?: number;
    businessHoursOnly: boolean;
}
export interface DataType {
    name: string;
    category: string;
    format: string;
    encryption: boolean;
}
export interface DataVolume {
    recordCount: number;
    sizeBytes: number;
    estimatedGrowth: number;
}
export interface DataSensitivity {
    level: string;
    classification: string;
    regulatoryFlags: string[];
}
export interface RetentionRequirement {
    period: number;
    basis: string;
    exceptions: string[];
}
export interface DataClassification {
    confidentiality: string;
    integrity: string;
    availability: string;
    privacy: string;
}
export interface DataBackupStrategy {
    frequency: string;
    retention: number;
    location: string[];
    encryption: boolean;
    verification: boolean;
}
export interface DataTransferPlan {
    destination: string;
    method: string;
    timeline: Date;
    verification: string[];
    rollback: boolean;
}
export interface DataAnonymizationRule {
    field: string;
    method: string;
    parameters: Record<string, any>;
    verification: string;
}
export interface DataComplianceCheck {
    regulation: string;
    requirement: string;
    validation: string;
    frequency: string;
}
export interface DataVerificationStep {
    type: string;
    description: string;
    validation: string;
    frequency: string;
}
export interface DataRecoveryPlan {
    rto: number;
    rpo: number;
    procedures: RecoveryProcedure[];
    testingSchedule: string;
}
export interface RecoveryProcedure {
    step: string;
    description: string;
    timeRequired: number;
    dependencies: string[];
}
export interface ComplianceCertification {
    name: string;
    authority: string;
    validUntil: Date;
    requirements: string[];
}
export interface CompliancePolicy {
    name: string;
    version: string;
    applicableSteps: string[];
    requirements: string[];
}
export interface ComplianceAttestation {
    type: string;
    authority: string;
    period: string;
    requirements: string[];
}
export interface ComplianceDocumentation {
    type: string;
    name: string;
    location: string;
    retention: number;
}
export interface ComplianceReporting {
    frequency: string;
    recipients: string[];
    format: string;
    delivery: string;
}
export interface ComplianceAuditing {
    frequency: string;
    scope: string[];
    auditors: string[];
    reporting: string;
}
export interface ComplianceRetention {
    period: number;
    method: string;
    location: string;
    access: string[];
}
export interface DependentUser {
    userId: string;
    relationship: string;
    impact: string;
    mitigation: string;
}
export interface RevenueImpact {
    amount: number;
    currency: string;
    timeframe: string;
    recovery: string;
}
export interface OperationalImpact {
    systems: string[];
    processes: string[];
    resources: string[];
    timeline: string;
}
export interface ComplianceImpact {
    regulations: string[];
    violations: string[];
    penalties: string[];
    reporting: string[];
}
export interface MitigationStrategy {
    risk: string;
    strategy: string;
    timeline: string;
    owner: string;
}
export interface ContinuityPlan {
    alternatives: string[];
    procedures: string[];
    timeline: string;
    testing: string;
}
export interface SystemRecoveryPlan {
    systems: string[];
    procedures: RecoveryProcedure[];
    timeline: number;
    testing: string;
}
export interface RollbackTrigger {
    condition: string;
    automatic: boolean;
    approval: boolean;
    notification: boolean;
}
export interface CommunicationPlan {
    stakeholders: string[];
    channels: string[];
    timeline: string;
    templates: string[];
}
export interface AuditEvidence {
    type: string;
    description: string;
    location: string;
    retention: number;
}
export interface SystemInfo {
    version: string;
    environment: string;
    correlationId: string;
    requestId: string;
}
export interface AuditCompliance {
    regulation: string;
    requirement: string;
    evidence: string[];
    retention: number;
}
export interface RegulationRequirement {
    id: string;
    description: string;
    mandatory: boolean;
    deadline?: Date;
}
export interface RegulationCompliance {
    status: string;
    lastCheck: Date;
    issues: string[];
    remediation: string[];
}
export interface RegulationReporting {
    required: boolean;
    frequency: string;
    deadline: Date;
    format: string;
}
export interface RegulationPenalty {
    type: string;
    amount: number;
    currency: string;
    conditions: string[];
}
export interface RetentionBasis {
    legal: string;
    business: string;
    regulatory: string;
}
export interface RetentionException {
    reason: string;
    extension: number;
    approval: string;
    expiry: Date;
}
export interface DestructionMethod {
    type: string;
    verification: string;
    certification: boolean;
    timeline: number;
}
export interface RetentionVerification {
    method: string;
    frequency: string;
    auditing: boolean;
    reporting: boolean;
}
export interface DeletionMethod {
    type: string;
    verification: string;
    recovery: boolean;
    timeline: number;
}
export interface DeletionVerification {
    method: string;
    evidence: string[];
    certification: boolean;
    auditing: boolean;
}
export interface RollbackVerification {
    type: string;
    validation: string;
    evidence: string[];
    approval: boolean;
}
export interface ExecutorAuth {
    type: string;
    credentials: string;
    timeout: number;
}
export declare class AccountClosureService extends EventEmitter {
    private closureRequests;
    private workflowDefinitions;
    private processingQueue;
    constructor();
    requestAccountClosure(userId: string, tenantId: string, closureType: ClosureType, reason: ClosureReason, customReason?: string, urgency?: UrgencyLevel, ipAddress?: string, userAgent?: string): Promise<AccountClosureRequest>;
    getClosureRequest(requestId: string, userId: string): Promise<AccountClosureRequest | null>;
    getUserClosureRequests(userId: string, tenantId: string, filter?: {
        status?: ClosureStatus;
        closureType?: ClosureType;
        dateRange?: {
            start: Date;
            end: Date;
        };
        limit?: number;
    }): Promise<AccountClosureRequest[]>;
    cancelClosureRequest(requestId: string, userId: string, reason: string, ipAddress: string, userAgent: string): Promise<boolean>;
    approveClosureStep(requestId: string, stepId: string, approvalType: ApprovalType, approverId: string, comment: string, ipAddress: string, userAgent: string): Promise<boolean>;
    rejectClosureStep(requestId: string, stepId: string, approvalType: ApprovalType, approverId: string, reason: string, ipAddress: string, userAgent: string): Promise<boolean>;
    getClosureStatus(requestId: string, userId: string): Promise<{
        status: ClosureStatus;
        currentStep: ClosureStep;
        progress: number;
        timeline: ClosureTimeline;
        nextMilestone?: Milestone;
        pendingApprovals: ApprovalRequirement[];
        blockedDependencies: ClosureDependency[];
    } | null>;
    rollbackClosure(requestId: string, initiatedBy: string, reason: string, ipAddress: string, userAgent: string): Promise<boolean>;
    private processNextStep;
    private executeStep;
    private executeAutomatedStep;
    private executeManualStep;
    private executeApprovalStep;
    private executeNotificationStep;
    private executeDataProcessingStep;
    private executeComplianceCheckStep;
    private executeStepAction;
    private executeStepValidation;
    private executeRollbackStep;
    private executeApiCall;
    private executeDatabaseOperation;
    private executeNotificationAction;
    private executeDataBackup;
    private executeDataTransfer;
    private executeDataDeletion;
    private executeDataAnonymization;
    private executeComplianceCheck;
    private executeRollbackVerification;
    private sendApprovalRequest;
    private sendNotification;
    private sendInitialNotifications;
    private sendCancellationNotifications;
    private sendRejectionNotifications;
    private sendCompletionNotifications;
    private sendRollbackNotifications;
    private delay;
    private validateClosureRequest;
    private getWorkflowForClosure;
    private calculatePriority;
    private calculateTimeline;
    private identifyDependencies;
    private generateApprovalRequirements;
    private generateNotificationPlan;
    private generateDataHandlingPlan;
    private generateComplianceRequirements;
    private assessBusinessImpact;
    private generateRollbackPlan;
    private identifyRiskFlags;
    private requiresManualReview;
    private mapStepToClosureStep;
    private addAuditEntry;
    private initializeWorkflowDefinitions;
    private startProcessingScheduler;
    private getErrorMessage;
}

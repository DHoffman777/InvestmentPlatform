import { EventEmitter } from 'events';
export interface ComplianceApprovalWorkflow {
    id: string;
    clientId: string;
    tenantId: string;
    workflowId: string;
    workflowType: ComplianceWorkflowType;
    status: ComplianceWorkflowStatus;
    priority: CompliancePriority;
    approvalSteps: ApprovalStep[];
    reviewers: ComplianceReviewer[];
    documents: ComplianceDocument[];
    riskAssessment: RiskAssessment;
    decisions: ComplianceDecision[];
    escalations: EscalationRecord[];
    deadlines: WorkflowDeadline[];
    auditTrail: AuditRecord[];
    metadata: {
        accountType: string;
        riskLevel: string;
        jurisdiction: string;
        regulatoryRequirements: string[];
        businessRules: string[];
    };
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
}
export interface ApprovalStep {
    id: string;
    name: string;
    description: string;
    type: ApprovalStepType;
    status: ApprovalStepStatus;
    order: number;
    dependencies: string[];
    requiredReviewers: ReviewerRequirement[];
    assignedReviewers: string[];
    criteria: ApprovalCriteria[];
    decisions: StepDecision[];
    deadline?: Date;
    startedAt?: Date;
    completedAt?: Date;
    notes?: string;
    attachments?: string[];
}
export interface ComplianceReviewer {
    id: string;
    userId: string;
    name: string;
    title: string;
    department: string;
    role: ReviewerRole;
    jurisdiction: string[];
    specializations: string[];
    certifications: string[];
    workload: {
        currentReviews: number;
        maxCapacity: number;
        averageReviewTime: number;
    };
    availability: ReviewerAvailability;
    performanceMetrics: ReviewerMetrics;
}
export interface ComplianceDocument {
    id: string;
    name: string;
    type: DocumentType;
    version: string;
    status: DocumentStatus;
    reviewStatus: DocumentReviewStatus;
    filePath: string;
    uploadedBy: string;
    uploadedAt: Date;
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;
    required: boolean;
    confidential: boolean;
    retentionPeriod: number;
    tags: string[];
}
export interface RiskAssessment {
    id: string;
    overallRisk: RiskLevel;
    riskFactors: RiskFactor[];
    mitigationMeasures: MitigationMeasure[];
    assessedBy: string;
    assessedAt: Date;
    reviewedBy?: string;
    reviewedAt?: Date;
    validUntil: Date;
    score: number;
    methodology: string;
    assumptions: string[];
}
export interface RiskFactor {
    type: RiskFactorType;
    category: string;
    description: string;
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    score: number;
    source: string;
    detectedAt: Date;
    mitigated: boolean;
}
export interface MitigationMeasure {
    id: string;
    riskFactorIds: string[];
    measure: string;
    effectiveness: 'low' | 'medium' | 'high';
    implementedBy: string;
    implementedAt: Date;
    status: 'proposed' | 'approved' | 'implemented' | 'failed';
    cost?: number;
    timeline?: string;
}
export interface ComplianceDecision {
    id: string;
    stepId: string;
    reviewerId: string;
    decision: DecisionType;
    reasoning: string;
    conditions?: string[];
    recommendedActions?: string[];
    confidenceLevel: number;
    timestamp: Date;
    overriddenBy?: string;
    overriddenAt?: Date;
    overrideReason?: string;
}
export interface EscalationRecord {
    id: string;
    stepId: string;
    reason: EscalationReason;
    escalatedBy: string;
    escalatedTo: string;
    escalatedAt: Date;
    resolvedBy?: string;
    resolvedAt?: Date;
    resolution?: string;
    impact: EscalationImpact;
}
export interface WorkflowDeadline {
    id: string;
    stepId?: string;
    type: DeadlineType;
    deadline: Date;
    reminderDates: Date[];
    status: DeadlineStatus;
    consequences: string[];
    notificationsSent: number;
    escalationTriggered: boolean;
}
export interface AuditRecord {
    id: string;
    action: string;
    performedBy: string;
    timestamp: Date;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    previousValue?: any;
    newValue?: any;
}
export interface ReviewerRequirement {
    role: ReviewerRole;
    count: number;
    jurisdiction?: string;
    specialization?: string;
    minExperience?: number;
    certificationRequired?: boolean;
}
export interface ApprovalCriteria {
    id: string;
    name: string;
    description: string;
    type: CriteriaType;
    weight: number;
    threshold: number;
    parameters: Record<string, any>;
    evaluationMethod: 'manual' | 'automated' | 'hybrid';
    status: CriteriaStatus;
    evaluatedBy?: string;
    evaluatedAt?: Date;
    result?: CriteriaResult;
}
export interface StepDecision {
    reviewerId: string;
    decision: DecisionType;
    timestamp: Date;
    reasoning: string;
    criteriaEvaluations: CriteriaEvaluation[];
}
export interface CriteriaEvaluation {
    criteriaId: string;
    result: CriteriaResult;
    score: number;
    notes?: string;
}
export interface ReviewerAvailability {
    status: 'available' | 'busy' | 'out_of_office';
    returnDate?: Date;
    scheduledReviews: ScheduledReview[];
    workingHours: {
        timezone: string;
        schedule: WeeklySchedule;
    };
}
export interface ScheduledReview {
    workflowId: string;
    stepId: string;
    scheduledFor: Date;
    estimatedDuration: number;
}
export interface WeeklySchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
}
export interface DaySchedule {
    start: string;
    end: string;
    breaks: TimeSlot[];
}
export interface TimeSlot {
    start: string;
    end: string;
}
export interface ReviewerMetrics {
    totalReviews: number;
    averageReviewTime: number;
    approvalRate: number;
    accuracyRate: number;
    timeliness: number;
    qualityScore: number;
    lastEvaluated: Date;
}
export declare enum ComplianceWorkflowType {
    CLIENT_ONBOARDING = "CLIENT_ONBOARDING",
    ACCOUNT_OPENING = "ACCOUNT_OPENING",
    SUITABILITY_REVIEW = "SUITABILITY_REVIEW",
    KYC_REVIEW = "KYC_REVIEW",
    AML_REVIEW = "AML_REVIEW",
    HIGH_RISK_CLIENT = "HIGH_RISK_CLIENT",
    REGULATORY_CHANGE = "REGULATORY_CHANGE",
    PERIODIC_REVIEW = "PERIODIC_REVIEW",
    EXCEPTION_APPROVAL = "EXCEPTION_APPROVAL"
}
export declare enum ComplianceWorkflowStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    UNDER_REVIEW = "UNDER_REVIEW",
    AWAITING_INFORMATION = "AWAITING_INFORMATION",
    ESCALATED = "ESCALATED",
    APPROVED = "APPROVED",
    CONDITIONALLY_APPROVED = "CONDITIONALLY_APPROVED",
    REJECTED = "REJECTED",
    WITHDRAWN = "WITHDRAWN",
    EXPIRED = "EXPIRED"
}
export declare enum CompliancePriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT",
    CRITICAL = "CRITICAL"
}
export declare enum ApprovalStepType {
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW",
    RISK_ASSESSMENT = "RISK_ASSESSMENT",
    REGULATORY_CHECK = "REGULATORY_CHECK",
    SUITABILITY_ANALYSIS = "SUITABILITY_ANALYSIS",
    FINAL_APPROVAL = "FINAL_APPROVAL",
    EXCEPTION_REVIEW = "EXCEPTION_REVIEW",
    SUPERVISORY_REVIEW = "SUPERVISORY_REVIEW"
}
export declare enum ApprovalStepStatus {
    PENDING = "PENDING",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    ESCALATED = "ESCALATED",
    SKIPPED = "SKIPPED"
}
export declare enum ReviewerRole {
    COMPLIANCE_ANALYST = "COMPLIANCE_ANALYST",
    SENIOR_COMPLIANCE_OFFICER = "SENIOR_COMPLIANCE_OFFICER",
    COMPLIANCE_MANAGER = "COMPLIANCE_MANAGER",
    CHIEF_COMPLIANCE_OFFICER = "CHIEF_COMPLIANCE_OFFICER",
    RISK_ANALYST = "RISK_ANALYST",
    LEGAL_COUNSEL = "LEGAL_COUNSEL",
    SUPERVISORY_PRINCIPAL = "SUPERVISORY_PRINCIPAL",
    REGISTERED_REPRESENTATIVE = "REGISTERED_REPRESENTATIVE"
}
export declare enum DocumentType {
    CLIENT_APPLICATION = "CLIENT_APPLICATION",
    IDENTITY_VERIFICATION = "IDENTITY_VERIFICATION",
    FINANCIAL_STATEMENTS = "FINANCIAL_STATEMENTS",
    RISK_QUESTIONNAIRE = "RISK_QUESTIONNAIRE",
    INVESTMENT_POLICY = "INVESTMENT_POLICY",
    REGULATORY_FILING = "REGULATORY_FILING",
    COMPLIANCE_CHECKLIST = "COMPLIANCE_CHECKLIST",
    EXCEPTION_REQUEST = "EXCEPTION_REQUEST"
}
export declare enum DocumentStatus {
    UPLOADED = "UPLOADED",
    PROCESSING = "PROCESSING",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED"
}
export declare enum DocumentReviewStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    REQUIRES_CLARIFICATION = "REQUIRES_CLARIFICATION"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RiskFactorType {
    REGULATORY = "REGULATORY",
    OPERATIONAL = "OPERATIONAL",
    FINANCIAL = "FINANCIAL",
    REPUTATIONAL = "REPUTATIONAL",
    TECHNOLOGY = "TECHNOLOGY",
    FRAUD = "FRAUD",
    MARKET = "MARKET",
    CREDIT = "CREDIT"
}
export declare enum DecisionType {
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    CONDITIONAL_APPROVE = "CONDITIONAL_APPROVE",
    REQUEST_MORE_INFO = "REQUEST_MORE_INFO",
    ESCALATE = "ESCALATE"
}
export declare enum EscalationReason {
    DEADLINE_MISSED = "DEADLINE_MISSED",
    HIGH_RISK = "HIGH_RISK",
    REGULATORY_CONCERN = "REGULATORY_CONCERN",
    POLICY_EXCEPTION = "POLICY_EXCEPTION",
    REVIEWER_UNAVAILABLE = "REVIEWER_UNAVAILABLE",
    COMPLEX_CASE = "COMPLEX_CASE",
    CLIENT_COMPLAINT = "CLIENT_COMPLAINT"
}
export declare enum EscalationImpact {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum DeadlineType {
    REGULATORY = "REGULATORY",
    BUSINESS = "BUSINESS",
    CLIENT_COMMITMENT = "CLIENT_COMMITMENT",
    INTERNAL_SLA = "INTERNAL_SLA"
}
export declare enum DeadlineStatus {
    ACTIVE = "ACTIVE",
    MET = "MET",
    MISSED = "MISSED",
    EXTENDED = "EXTENDED",
    CANCELLED = "CANCELLED"
}
export declare enum CriteriaType {
    REGULATORY_REQUIREMENT = "REGULATORY_REQUIREMENT",
    BUSINESS_RULE = "BUSINESS_RULE",
    RISK_THRESHOLD = "RISK_THRESHOLD",
    DOCUMENTATION = "DOCUMENTATION",
    VERIFICATION = "VERIFICATION"
}
export declare enum CriteriaStatus {
    PENDING = "PENDING",
    EVALUATING = "EVALUATING",
    PASSED = "PASSED",
    FAILED = "FAILED",
    NOT_APPLICABLE = "NOT_APPLICABLE"
}
export declare enum CriteriaResult {
    PASS = "PASS",
    FAIL = "FAIL",
    WARNING = "WARNING",
    NOT_EVALUATED = "NOT_EVALUATED"
}
export declare class ComplianceApprovalService extends EventEmitter {
    private workflows;
    private reviewers;
    constructor();
    private initializeReviewers;
    createComplianceWorkflow(clientId: string, tenantId: string, workflowId: string, workflowType: ComplianceWorkflowType, metadata: ComplianceApprovalWorkflow['metadata']): Promise<ComplianceApprovalWorkflow>;
    private determinePriority;
    private createApprovalSteps;
    private performInitialRiskAssessment;
    private createDeadlines;
    private assignReviewers;
    private findAvailableReviewers;
    private selectBestReviewer;
    private startWorkflow;
    submitDecision(workflowId: string, stepId: string, reviewerId: string, decision: DecisionType, reasoning: string, criteriaEvaluations?: CriteriaEvaluation[], conditions?: string[]): Promise<ComplianceDecision>;
    private calculateDecisionConfidence;
    private checkStepCompletion;
    private startNextSteps;
    private checkWorkflowCompletion;
    private addAuditRecord;
    getWorkflow(workflowId: string): ComplianceApprovalWorkflow | undefined;
    getWorkflowsByClient(clientId: string, tenantId: string): ComplianceApprovalWorkflow[];
    getWorkflowsByReviewer(reviewerId: string): ComplianceApprovalWorkflow[];
    getComplianceMetrics(tenantId?: string): Promise<{
        totalWorkflows: number;
        pendingWorkflows: number;
        completedWorkflows: number;
        averageProcessingTime: number;
        approvalRate: number;
        escalationRate: number;
        deadlineMissRate: number;
        reviewerUtilization: Array<{
            reviewerId: string;
            utilization: number;
        }>;
    }>;
}

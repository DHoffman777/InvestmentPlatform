import { EventEmitter } from 'events';
export interface OnboardingProgress {
    id: string;
    clientId: string;
    tenantId: string;
    workflowId: string;
    status: OnboardingStatus;
    currentPhase: OnboardingPhase;
    overallProgress: number;
    phases: PhaseProgress[];
    milestones: Milestone[];
    timelineEstimate: TimelineEstimate;
    dependencies: Dependency[];
    blockers: Blocker[];
    history: ProgressEvent[];
    notifications: NotificationRecord[];
    clientExperience: ClientExperienceMetrics;
    createdAt: Date;
    updatedAt: Date;
    estimatedCompletionDate?: Date;
    actualCompletionDate?: Date;
}
export interface PhaseProgress {
    id: string;
    phase: OnboardingPhase;
    status: PhaseStatus;
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    estimatedDuration: number;
    actualDuration?: number;
    steps: StepProgress[];
    dependencies: string[];
    blockers: string[];
    requirements: PhaseRequirement[];
}
export interface StepProgress {
    id: string;
    name: string;
    description: string;
    status: StepStatus;
    progress: number;
    category: StepCategory;
    priority: StepPriority;
    automated: boolean;
    owner: StepOwner;
    startedAt?: Date;
    completedAt?: Date;
    estimatedDuration: number;
    actualDuration?: number;
    dependencies: string[];
    outputs: StepOutput[];
    validations: StepValidation[];
    userActions: UserAction[];
}
export interface Milestone {
    id: string;
    name: string;
    description: string;
    type: MilestoneType;
    status: MilestoneStatus;
    targetDate: Date;
    actualDate?: Date;
    significance: MilestoneSignificance;
    dependencies: string[];
    criteria: MilestoneCriteria[];
    celebrations?: CelebrationAction[];
}
export interface TimelineEstimate {
    totalEstimatedDuration: number;
    remainingEstimatedDuration: number;
    confidence: number;
    factorsConsidered: string[];
    lastUpdated: Date;
    historicalBasis: string;
    bufferTime: number;
    criticalPath: string[];
}
export interface Dependency {
    id: string;
    name: string;
    type: DependencyType;
    status: DependencyStatus;
    provider: string;
    requiredBy: string[];
    estimatedResolutionTime?: number;
    actualResolutionTime?: number;
    priority: DependencyPriority;
    escalated: boolean;
}
export interface Blocker {
    id: string;
    name: string;
    description: string;
    type: BlockerType;
    severity: BlockerSeverity;
    status: BlockerStatus;
    reportedBy: string;
    reportedAt: Date;
    assignedTo?: string;
    estimatedResolutionTime?: number;
    actualResolutionTime?: number;
    resolutionActions: ResolutionAction[];
    impact: BlockerImpact;
    escalated: boolean;
}
export interface ProgressEvent {
    id: string;
    timestamp: Date;
    type: ProgressEventType;
    phase?: OnboardingPhase;
    stepId?: string;
    milestoneId?: string;
    description: string;
    actor: string;
    actorType: 'client' | 'system' | 'reviewer' | 'admin';
    metadata: Record<string, any>;
    impact: EventImpact;
}
export interface NotificationRecord {
    id: string;
    type: NotificationType;
    recipient: string;
    channel: NotificationChannel;
    subject: string;
    content: string;
    sentAt: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    status: NotificationStatus;
    relatedStepId?: string;
    relatedMilestoneId?: string;
}
export interface ClientExperienceMetrics {
    satisfactionScore?: number;
    frustrationPoints: FrustrationPoint[];
    completionRate: number;
    dropOffPoints: DropOffPoint[];
    averageSessionDuration: number;
    totalSessions: number;
    helpRequests: HelpRequest[];
    feedback: ClientFeedback[];
    preferredCommunicationChannel: NotificationChannel;
}
export interface PhaseRequirement {
    id: string;
    name: string;
    type: RequirementType;
    status: RequirementStatus;
    mandatory: boolean;
    description: string;
    validationCriteria: ValidationCriteria[];
}
export interface StepOutput {
    id: string;
    name: string;
    type: OutputType;
    status: OutputStatus;
    value?: any;
    validatedAt?: Date;
    validatedBy?: string;
}
export interface StepValidation {
    id: string;
    name: string;
    type: ValidationType;
    status: ValidationStatus;
    automated: boolean;
    result?: ValidationResult;
    performedAt?: Date;
    performedBy?: string;
}
export interface UserAction {
    id: string;
    name: string;
    description: string;
    type: ActionType;
    status: ActionStatus;
    required: boolean;
    completedAt?: Date;
    completedBy?: string;
    instructions: string;
    helpText?: string;
    estimatedTime: number;
}
export interface MilestoneCriteria {
    id: string;
    name: string;
    description: string;
    type: CriteriaType;
    status: CriteriaStatus;
    weight: number;
    threshold: number;
    currentValue?: number;
    evaluatedAt?: Date;
}
export interface CelebrationAction {
    type: 'email' | 'sms' | 'in_app' | 'call';
    message: string;
    timing: 'immediate' | 'next_business_day' | 'scheduled';
    scheduledFor?: Date;
}
export interface ResolutionAction {
    id: string;
    action: string;
    description: string;
    assignedTo: string;
    dueDate: Date;
    status: ActionStatus;
    completedAt?: Date;
    notes?: string;
}
export interface BlockerImpact {
    affectedSteps: string[];
    affectedMilestones: string[];
    delayEstimate: number;
    severityLevel: number;
    businessImpact: string;
}
export interface FrustrationPoint {
    stepId: string;
    stepName: string;
    issue: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
    resolved: boolean;
    resolutionTime?: number;
}
export interface DropOffPoint {
    stepId: string;
    stepName: string;
    timestamp: Date;
    reason?: string;
    recovered: boolean;
    recoveryTime?: number;
}
export interface HelpRequest {
    id: string;
    stepId: string;
    type: 'question' | 'issue' | 'clarification';
    content: string;
    submittedAt: Date;
    respondedAt?: Date;
    responseTime?: number;
    satisfaction?: number;
}
export interface ClientFeedback {
    id: string;
    type: 'complaint' | 'suggestion' | 'praise';
    content: string;
    rating?: number;
    submittedAt: Date;
    category: string;
    actionTaken?: string;
}
export interface ValidationCriteria {
    field: string;
    rule: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    score?: number;
}
export declare enum OnboardingStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    BLOCKED = "BLOCKED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}
export declare enum OnboardingPhase {
    INITIATION = "INITIATION",
    DOCUMENT_COLLECTION = "DOCUMENT_COLLECTION",
    IDENTITY_VERIFICATION = "IDENTITY_VERIFICATION",
    KYC_AML_REVIEW = "KYC_AML_REVIEW",
    COMPLIANCE_APPROVAL = "COMPLIANCE_APPROVAL",
    ACCOUNT_SETUP = "ACCOUNT_SETUP",
    FUNDING_SETUP = "FUNDING_SETUP",
    FINAL_REVIEW = "FINAL_REVIEW",
    COMPLETION = "COMPLETION"
}
export declare enum PhaseStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    BLOCKED = "BLOCKED",
    SKIPPED = "SKIPPED"
}
export declare enum StepStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED",
    BLOCKED = "BLOCKED"
}
export declare enum StepCategory {
    CLIENT_ACTION = "CLIENT_ACTION",
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW",
    SYSTEM_PROCESS = "SYSTEM_PROCESS",
    COMPLIANCE_CHECK = "COMPLIANCE_CHECK",
    VERIFICATION = "VERIFICATION",
    APPROVAL = "APPROVAL"
}
export declare enum StepPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum StepOwner {
    CLIENT = "CLIENT",
    SYSTEM = "SYSTEM",
    COMPLIANCE = "COMPLIANCE",
    OPERATIONS = "OPERATIONS",
    THIRD_PARTY = "THIRD_PARTY"
}
export declare enum MilestoneType {
    REGULATORY = "REGULATORY",
    BUSINESS = "BUSINESS",
    CLIENT_EXPERIENCE = "CLIENT_EXPERIENCE",
    SYSTEM = "SYSTEM"
}
export declare enum MilestoneStatus {
    UPCOMING = "UPCOMING",
    IN_PROGRESS = "IN_PROGRESS",
    ACHIEVED = "ACHIEVED",
    MISSED = "MISSED",
    CANCELLED = "CANCELLED"
}
export declare enum MilestoneSignificance {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum DependencyType {
    INTERNAL_SYSTEM = "INTERNAL_SYSTEM",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    HUMAN_ACTION = "HUMAN_ACTION",
    REGULATORY_APPROVAL = "REGULATORY_APPROVAL",
    DOCUMENT_SUBMISSION = "DOCUMENT_SUBMISSION"
}
export declare enum DependencyStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    FAILED = "FAILED",
    ESCALATED = "ESCALATED"
}
export declare enum DependencyPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum BlockerType {
    TECHNICAL = "TECHNICAL",
    REGULATORY = "REGULATORY",
    OPERATIONAL = "OPERATIONAL",
    CLIENT_ACTION = "CLIENT_ACTION",
    THIRD_PARTY = "THIRD_PARTY",
    RESOURCE = "RESOURCE"
}
export declare enum BlockerSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum BlockerStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    ESCALATED = "ESCALATED",
    CLOSED = "CLOSED"
}
export declare enum ProgressEventType {
    PHASE_STARTED = "PHASE_STARTED",
    PHASE_COMPLETED = "PHASE_COMPLETED",
    STEP_STARTED = "STEP_STARTED",
    STEP_COMPLETED = "STEP_COMPLETED",
    MILESTONE_ACHIEVED = "MILESTONE_ACHIEVED",
    BLOCKER_REPORTED = "BLOCKER_REPORTED",
    BLOCKER_RESOLVED = "BLOCKER_RESOLVED",
    DEPENDENCY_RESOLVED = "DEPENDENCY_RESOLVED",
    TIMELINE_UPDATED = "TIMELINE_UPDATED"
}
export declare enum NotificationType {
    WELCOME = "WELCOME",
    STEP_REMINDER = "STEP_REMINDER",
    MILESTONE_ACHIEVED = "MILESTONE_ACHIEVED",
    ACTION_REQUIRED = "ACTION_REQUIRED",
    STATUS_UPDATE = "STATUS_UPDATE",
    COMPLETION = "COMPLETION",
    DELAY_NOTIFICATION = "DELAY_NOTIFICATION"
}
export declare enum NotificationChannel {
    EMAIL = "EMAIL",
    SMS = "SMS",
    IN_APP = "IN_APP",
    PHONE = "PHONE",
    PORTAL = "PORTAL"
}
export declare enum NotificationStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    OPENED = "OPENED",
    CLICKED = "CLICKED",
    FAILED = "FAILED"
}
export declare enum EventImpact {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RequirementType {
    DOCUMENT = "DOCUMENT",
    VERIFICATION = "VERIFICATION",
    APPROVAL = "APPROVAL",
    SYSTEM_CHECK = "SYSTEM_CHECK",
    CLIENT_ACTION = "CLIENT_ACTION"
}
export declare enum RequirementStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    SATISFIED = "SATISFIED",
    FAILED = "FAILED"
}
export declare enum OutputType {
    DOCUMENT = "DOCUMENT",
    DATA = "DATA",
    DECISION = "DECISION",
    APPROVAL = "APPROVAL",
    VERIFICATION = "VERIFICATION"
}
export declare enum OutputStatus {
    PENDING = "PENDING",
    GENERATED = "GENERATED",
    VALIDATED = "VALIDATED",
    REJECTED = "REJECTED"
}
export declare enum ValidationType {
    COMPLETENESS = "COMPLETENESS",
    ACCURACY = "ACCURACY",
    COMPLIANCE = "COMPLIANCE",
    FORMAT = "FORMAT",
    AUTHENTICITY = "AUTHENTICITY"
}
export declare enum ValidationStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    PASSED = "PASSED",
    FAILED = "FAILED"
}
export declare enum ActionType {
    UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT",
    FILL_FORM = "FILL_FORM",
    VERIFY_IDENTITY = "VERIFY_IDENTITY",
    REVIEW_TERMS = "REVIEW_TERMS",
    PROVIDE_INFORMATION = "PROVIDE_INFORMATION",
    CONFIRM_DETAILS = "CONFIRM_DETAILS"
}
export declare enum ActionStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    SKIPPED = "SKIPPED"
}
export declare enum CriteriaType {
    THRESHOLD = "THRESHOLD",
    BOOLEAN = "BOOLEAN",
    ENUMERATION = "ENUMERATION",
    CALCULATION = "CALCULATION"
}
export declare enum CriteriaStatus {
    PENDING = "PENDING",
    MET = "MET",
    NOT_MET = "NOT_MET",
    PARTIALLY_MET = "PARTIALLY_MET"
}
export declare class OnboardingProgressService extends EventEmitter {
    private progressRecords;
    constructor();
    initializeProgress(clientId: string, tenantId: string, workflowId: string, clientType: 'individual' | 'entity' | 'trust', accountType: string): Promise<OnboardingProgress>;
    private createPhases;
    private createMilestones;
    private calculateInitialTimeline;
    updateStepProgress(progressId: string, stepId: string, newStatus: StepStatus, progressPercentage?: number, metadata?: Record<string, any>): Promise<any>;
    private findStepById;
    private updatePhaseProgress;
    private updateOverallProgress;
    private checkMilestoneAchievements;
    private evaluateMilestoneCriteria;
    private triggerCelebration;
    private updateTimelineEstimate;
    reportBlocker(progressId: string, blocker: Omit<Blocker, 'id' | 'reportedAt' | 'escalated'>): Promise<Blocker>;
    resolveBlocker(progressId: string, blockerId: string, resolution: string, resolvedBy: string): Promise<any>;
    private addProgressEvent;
    getProgress(progressId: string): OnboardingProgress | undefined;
    getProgressByWorkflow(workflowId: string): OnboardingProgress | undefined;
    getProgressByClient(clientId: string, tenantId: string): OnboardingProgress[];
    getProgressSummary(progressId: string): Promise<{
        overallStatus: OnboardingStatus;
        overallProgress: number;
        currentPhase: OnboardingPhase;
        nextMilestone: Milestone | null;
        estimatedCompletion: Date | null;
        activeBlockers: number;
        recentEvents: ProgressEvent[];
    }>;
    getProgressMetrics(tenantId?: string): Promise<{
        totalOnboardings: number;
        activeOnboardings: number;
        completedOnboardings: number;
        averageCompletionTime: number;
        completionRate: number;
        commonBlockers: Array<{
            type: BlockerType;
            count: number;
        }>;
        phaseCompletionRates: Record<OnboardingPhase, number>;
    }>;
}

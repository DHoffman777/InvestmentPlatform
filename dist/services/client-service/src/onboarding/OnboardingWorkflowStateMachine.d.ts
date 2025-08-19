import { EventEmitter } from 'events';
export interface OnboardingState {
    id: string;
    clientId: string;
    tenantId: string;
    currentState: WorkflowState;
    previousState?: WorkflowState;
    stateData: Record<string, any>;
    transitions: StateTransition[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    metadata: {
        clientType: 'individual' | 'entity' | 'trust' | 'partnership';
        riskProfile?: 'conservative' | 'moderate' | 'aggressive';
        accountType: 'taxable' | 'ira' | 'roth_ira' | '401k' | 'trust' | 'entity';
        initialInvestment?: number;
        sourceOfFunds: 'employment' | 'inheritance' | 'business_sale' | 'investment_gains' | 'other';
        jurisdiction: string;
        regulatoryRequirements: string[];
    };
}
export interface StateTransition {
    id: string;
    fromState: WorkflowState;
    toState: WorkflowState;
    triggeredBy: string;
    triggeredAt: Date;
    conditions: Record<string, any>;
    validationResults?: ValidationResult[];
    approvedBy?: string;
    rejectionReason?: string;
}
export interface ValidationResult {
    validator: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
    details?: Record<string, any>;
}
export declare enum WorkflowState {
    INITIATED = "INITIATED",
    DOCUMENT_COLLECTION = "DOCUMENT_COLLECTION",
    DOCUMENT_VERIFICATION = "DOCUMENT_VERIFICATION",
    IDENTITY_VERIFICATION = "IDENTITY_VERIFICATION",
    KYC_PROCESSING = "KYC_PROCESSING",
    AML_SCREENING = "AML_SCREENING",
    RISK_ASSESSMENT = "RISK_ASSESSMENT",
    SUITABILITY_REVIEW = "SUITABILITY_REVIEW",
    COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",
    ACCOUNT_SETUP = "ACCOUNT_SETUP",
    FUNDING_SETUP = "FUNDING_SETUP",
    FINAL_APPROVAL = "FINAL_APPROVAL",
    COMPLETED = "COMPLETED",
    REJECTED = "REJECTED",
    SUSPENDED = "SUSPENDED",
    CANCELLED = "CANCELLED"
}
export declare enum WorkflowEvent {
    START_ONBOARDING = "START_ONBOARDING",
    DOCUMENTS_SUBMITTED = "DOCUMENTS_SUBMITTED",
    DOCUMENTS_VERIFIED = "DOCUMENTS_VERIFIED",
    IDENTITY_VERIFIED = "IDENTITY_VERIFIED",
    KYC_COMPLETED = "KYC_COMPLETED",
    AML_CLEARED = "AML_CLEARED",
    RISK_ASSESSED = "RISK_ASSESSED",
    SUITABILITY_APPROVED = "SUITABILITY_APPROVED",
    COMPLIANCE_APPROVED = "COMPLIANCE_APPROVED",
    ACCOUNT_CREATED = "ACCOUNT_CREATED",
    FUNDING_CONFIGURED = "FUNDING_CONFIGURED",
    FINAL_APPROVED = "FINAL_APPROVED",
    REJECT_APPLICATION = "REJECT_APPLICATION",
    SUSPEND_APPLICATION = "SUSPEND_APPLICATION",
    CANCEL_APPLICATION = "CANCEL_APPLICATION",
    RESUME_APPLICATION = "RESUME_APPLICATION"
}
export interface WorkflowTransitionRule {
    fromState: WorkflowState;
    event: WorkflowEvent;
    toState: WorkflowState;
    conditions?: (state: OnboardingState, eventData: any) => boolean;
    validators?: string[];
    requiresApproval?: boolean;
    autoTransition?: boolean;
    timeout?: number;
}
export declare class OnboardingWorkflowStateMachine extends EventEmitter {
    private transitionRules;
    private activeWorkflows;
    constructor();
    private initializeTransitionRules;
    createWorkflow(clientId: string, tenantId: string, metadata: OnboardingState['metadata']): Promise<OnboardingState>;
    processEvent(workflowId: string, event: WorkflowEvent, eventData: any | undefined, triggeredBy: string): Promise<{
        success: boolean;
        newState?: WorkflowState;
        errors?: string[];
    }>;
    private runValidator;
    private handleAutoTransition;
    getWorkflow(workflowId: string): OnboardingState | undefined;
    getWorkflowsByClient(clientId: string, tenantId: string): OnboardingState[];
    getWorkflowsByState(state: WorkflowState, tenantId?: string): OnboardingState[];
    getAvailableEvents(workflowId: string): WorkflowEvent[];
    getWorkflowMetrics(tenantId?: string): Promise<{
        totalWorkflows: number;
        completedWorkflows: number;
        rejectedWorkflows: number;
        stateDistribution: Record<WorkflowState, number>;
        averageCompletionTime: number;
        completionRate: number;
    }>;
}

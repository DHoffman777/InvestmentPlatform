import { EventEmitter } from 'events';
export interface MitigationWorkflow {
    id: string;
    name: string;
    description: string;
    triggerConditions: TriggerCondition[];
    workflowSteps: WorkflowStep[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: 'PREVENTIVE' | 'REACTIVE' | 'RECOVERY';
    automationLevel: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
    estimatedDuration: number;
    successRate: number;
    costEstimate: number;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TriggerCondition {
    id: string;
    conditionType: 'RISK_SCORE' | 'FAILURE_PROBABILITY' | 'DELAY_DETECTED' | 'COUNTERPARTY_ISSUE' | 'LIQUIDITY_RISK' | 'SYSTEM_FAILURE' | 'MANUAL_TRIGGER' | 'PATTERN_DETECTED';
    operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'CONTAINS' | 'EXISTS';
    threshold: any;
    weight: number;
    description: string;
}
export interface WorkflowStep {
    id: string;
    stepNumber: number;
    stepName: string;
    stepType: 'NOTIFICATION' | 'APPROVAL' | 'ACTION' | 'VERIFICATION' | 'ESCALATION' | 'DOCUMENTATION';
    description: string;
    automationLevel: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
    estimatedDuration: number;
    assignedRole: string;
    dependencies: string[];
    parameters: {
        [key: string]: any;
    };
    onSuccess: 'CONTINUE' | 'SKIP_TO' | 'COMPLETE';
    onFailure: 'RETRY' | 'ESCALATE' | 'ABORT' | 'CONTINUE';
    maxRetries: number;
    isRequired: boolean;
}
export interface WorkflowExecution {
    executionId: string;
    workflowId: string;
    instructionId: string;
    triggeredBy: string;
    triggerReason: string;
    status: 'INITIATED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    currentStep: number;
    completedSteps: StepExecution[];
    workflowSteps?: WorkflowStep[];
    startTime: Date;
    endTime?: Date;
    totalDuration?: number;
    actualCost?: number;
    effectiveness?: number;
    notes?: string;
}
export interface StepExecution {
    stepId: string;
    executionId: string;
    stepNumber: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
    assignedTo?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    retryCount: number;
    result?: any;
    notes?: string;
    approver?: string;
    approvalTime?: Date;
}
export interface MitigationAction {
    id: string;
    actionType: 'COMMUNICATION' | 'SYSTEM_ADJUSTMENT' | 'PROCESS_CHANGE' | 'ESCALATION' | 'INSURANCE_CLAIM' | 'ALTERNATIVE_SETTLEMENT' | 'DOCUMENTATION' | 'MONITORING';
    name: string;
    description: string;
    parameters: {
        [key: string]: any;
    };
    estimatedEffectiveness: number;
    implementationCost: 'LOW' | 'MEDIUM' | 'HIGH';
    timeToImplement: number;
    requiredApprovals: string[];
    isReversible: boolean;
    sideEffects: string[];
}
export interface EscalationRule {
    id: string;
    ruleName: string;
    conditions: EscalationCondition[];
    escalationPath: EscalationLevel[];
    timeouts: number[];
    notificationMethods: ('EMAIL' | 'SMS' | 'PHONE' | 'SLACK' | 'PAGER')[];
    isActive: boolean;
}
export interface EscalationCondition {
    field: string;
    operator: string;
    value: any;
    weight: number;
}
export interface EscalationLevel {
    level: number;
    roles: string[];
    individuals?: string[];
    requiresAcknowledgment: boolean;
    canApprove: boolean;
    canAbort: boolean;
}
export interface WorkflowTemplate {
    templateId: string;
    templateName: string;
    description: string;
    applicableRiskTypes: string[];
    workflow: Omit<MitigationWorkflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;
    usageCount: number;
    successRate: number;
    averageDuration: number;
    isRecommended: boolean;
}
export declare class RiskMitigationWorkflowsService extends EventEmitter {
    private workflows;
    private workflowExecutions;
    private mitigationActions;
    private escalationRules;
    private workflowTemplates;
    private activeExecutions;
    constructor();
    private initializeDefaultWorkflows;
    private initializeDefaultActions;
    private initializeDefaultEscalationRules;
    private startMonitoringTimer;
    private monitorActiveWorkflows;
    private handleStepTimeout;
    triggerWorkflow(instructionId: string, triggerData: any, triggeredBy: string, manualWorkflowId?: string): Promise<WorkflowExecution>;
    private findApplicableWorkflow;
    private calculateTriggerScore;
    private evaluateTriggerCondition;
    private extractFieldValue;
    private buildTriggerReason;
    private executeNextStep;
    private checkStepDependencies;
    private executeStep;
    private executeNotificationStep;
    private executeApprovalStep;
    private executeActionStep;
    private executeVerificationStep;
    private executeEscalationStep;
    private executeDocumentationStep;
    private executeMitigationAction;
    private handleStepFailure;
    private escalateWorkflow;
    private executeEscalation;
    private completeWorkflow;
    private delay;
    private getRecipientsForRole;
    private getRecipientsForRoles;
    createWorkflow(workflowData: Omit<MitigationWorkflow, 'id' | 'createdAt' | 'updatedAt'>): MitigationWorkflow;
    updateWorkflow(workflowId: string, updates: Partial<MitigationWorkflow>): MitigationWorkflow | null;
    pauseWorkflowExecution(executionId: string, reason: string): boolean;
    resumeWorkflowExecution(executionId: string): boolean;
    cancelWorkflowExecution(executionId: string, reason: string): boolean;
    getWorkflow(workflowId: string): MitigationWorkflow | undefined;
    getAllWorkflows(): MitigationWorkflow[];
    getActiveWorkflows(): MitigationWorkflow[];
    getWorkflowExecution(executionId: string): WorkflowExecution | undefined;
    getInstructionWorkflows(instructionId: string): WorkflowExecution[];
    getActiveExecutions(): WorkflowExecution[];
    getMitigationAction(actionId: string): MitigationAction | undefined;
    getAllMitigationActions(): MitigationAction[];
    generateWorkflowReport(timeFrame?: 'DAILY' | 'WEEKLY' | 'MONTHLY'): {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        mostUsedWorkflows: {
            workflowId: string;
            name: string;
            count: number;
        }[];
        effectivenessMetrics: {
            workflowId: string;
            name: string;
            effectiveness: number;
        }[];
    };
}

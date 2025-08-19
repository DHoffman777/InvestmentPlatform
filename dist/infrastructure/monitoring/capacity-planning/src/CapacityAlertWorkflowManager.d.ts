import { EventEmitter } from 'events';
import { CapacityAlert, AlertType, AlertSeverity } from './CapacityPlanningDataModel';
export interface WorkflowConfig {
    enableAutoEscalation: boolean;
    escalationTimeouts: Record<AlertSeverity, number>;
    maxEscalationLevel: number;
    enableAutoRemediation: boolean;
    remediationApprovalRequired: boolean;
    workflowTemplates: WorkflowTemplate[];
    integrations: IntegrationConfig[];
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    triggerConditions: TriggerCondition[];
    steps: WorkflowStep[];
    approvalRequired: boolean;
    timeoutMinutes: number;
}
export interface TriggerCondition {
    alertType: AlertType;
    severity: AlertSeverity;
    resourcePattern?: string;
    metricThreshold?: number;
    customConditions?: Record<string, any>;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: WorkflowStepType;
    configuration: Record<string, any>;
    timeout: number;
    retryCount: number;
    onFailure: 'stop' | 'continue' | 'retry';
    approvalRequired: boolean;
    dependencies: string[];
}
export declare enum WorkflowStepType {
    NOTIFICATION = "notification",
    ESCALATION = "escalation",
    AUTO_SCALING = "auto_scaling",
    APPROVAL_REQUEST = "approval_request",
    SCRIPT_EXECUTION = "script_execution",
    API_CALL = "api_call",
    WEBHOOK = "webhook",
    TICKET_CREATION = "ticket_creation",
    REMEDIATION = "remediation"
}
export interface IntegrationConfig {
    type: 'slack' | 'teams' | 'email' | 'pagerduty' | 'jira' | 'servicenow' | 'webhook';
    configuration: Record<string, any>;
    isActive: boolean;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    alertId: string;
    status: WorkflowExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    currentStep: number;
    steps: WorkflowStepExecution[];
    approvals: WorkflowApproval[];
    context: WorkflowContext;
}
export declare enum WorkflowExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    WAITING_APPROVAL = "waiting_approval",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout"
}
export interface WorkflowStepExecution {
    stepId: string;
    status: WorkflowExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    output?: any;
    error?: string;
    retryCount: number;
}
export interface WorkflowApproval {
    id: string;
    stepId: string;
    requestedAt: Date;
    approvedAt?: Date;
    approvedBy?: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
}
export interface WorkflowContext {
    alert: CapacityAlert;
    resourceId: string;
    recommendationId?: string;
    customData: Record<string, any>;
}
export interface WorkflowMetrics {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    escalationRate: number;
    autoRemediationRate: number;
    manualInterventionRate: number;
}
export declare class CapacityAlertWorkflowManager extends EventEmitter {
    private workflows;
    private executions;
    private integrations;
    private config;
    private stepExecutor;
    private approvalManager;
    constructor(config: WorkflowConfig);
    processAlert(alert: CapacityAlert): Promise<WorkflowExecution[]>;
    executeWorkflow(workflow: WorkflowTemplate, alert: CapacityAlert): Promise<WorkflowExecution>;
    private processWorkflowSteps;
    private executeStep;
    private canExecuteStep;
    private requestApproval;
    approveWorkflowStep(executionId: string, approvalId: string, userId: string, comments?: string): Promise<void>;
    rejectWorkflowStep(executionId: string, approvalId: string, userId: string, comments?: string): Promise<void>;
    createWorkflowTemplate(template: Partial<WorkflowTemplate>): Promise<WorkflowTemplate>;
    scheduleWorkflowMaintenance(workflowId: string, maintenanceWindow: {
        start: Date;
        end: Date;
    }): Promise<void>;
    getWorkflowMetrics(workflowId?: string): Promise<WorkflowMetrics>;
    private findMatchingWorkflows;
    private matchesTriggerCondition;
    private initializeDefaultWorkflows;
    private initializeIntegrations;
    private createIntegration;
    private validateWorkflowTemplate;
    private generateExecutionId;
    private generateWorkflowId;
    private generateApprovalId;
    getExecution(executionId: string): WorkflowExecution | null;
    getAllExecutions(): WorkflowExecution[];
    getWorkflowTemplate(workflowId: string): WorkflowTemplate | null;
    getAllWorkflowTemplates(): WorkflowTemplate[];
    cancelExecution(executionId: string, reason: string): Promise<void>;
    shutdown(): Promise<void>;
}

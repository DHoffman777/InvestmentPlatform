import { FormType, RegulatoryJurisdiction } from '../../models/regulatory/Regulatory';
interface FilingWorkflow {
    id: string;
    tenantId: string;
    workflowName: string;
    formType: FormType;
    jurisdiction: RegulatoryJurisdiction;
    isActive: boolean;
    automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
    schedule: {
        frequency: 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
        dueDate: {
            dayOfMonth?: number;
            monthOfQuarter?: number;
            monthOfYear?: number;
            daysAfterPeriodEnd: number;
        };
        reminderSchedule: Array<{
            daysBeforeDue: number;
            recipientRoles: string[];
            notificationMethod: 'email' | 'system' | 'both';
        }>;
    };
    steps: Array<{
        stepId: string;
        stepName: string;
        stepType: 'data_collection' | 'validation' | 'review' | 'approval' | 'filing' | 'confirmation';
        assignedRole: string;
        automatedAction?: {
            enabled: boolean;
            actionType: string;
            parameters: Record<string, any>;
        };
        requiredDocuments: string[];
        estimatedDuration: number;
        dependencies: string[];
    }>;
    approvalWorkflow: {
        enabled: boolean;
        approvers: Array<{
            role: string;
            sequence: number;
            required: boolean;
        }>;
        parallelApproval: boolean;
    };
    dataSources: Array<{
        sourceType: 'database' | 'api' | 'file' | 'manual_entry';
        sourceIdentifier: string;
        dataMapping: Record<string, string>;
        validationRules: string[];
    }>;
    qualityChecks: Array<{
        checkType: 'completeness' | 'accuracy' | 'consistency' | 'compliance';
        description: string;
        automatedCheck: boolean;
        criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
    }>;
    createdAt: Date;
    updatedAt: Date;
}
interface WorkflowExecution {
    id: string;
    workflowId: string;
    tenantId: string;
    filingId: string;
    status: 'initiated' | 'in_progress' | 'review' | 'approved' | 'filed' | 'completed' | 'failed' | 'cancelled';
    currentStep: string;
    initiatedAt: Date;
    scheduledCompletionDate: Date;
    actualCompletionDate?: Date;
    stepStatus: Map<string, {
        status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
        assignedTo?: string;
        startedAt?: Date;
        completedAt?: Date;
        notes?: string;
        artifacts?: string[];
    }>;
    issues: Array<{
        issueId: string;
        stepId: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        resolution?: string;
        reportedAt: Date;
        resolvedAt?: Date;
    }>;
    metrics: {
        totalDuration?: number;
        stepDurations: Record<string, number>;
        automationEfficiency: number;
        qualityScore: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    formType: FormType;
    jurisdiction: RegulatoryJurisdiction;
    category: 'regulatory_filing' | 'compliance_reporting' | 'client_reporting' | 'internal_reporting';
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedSetupTime: number;
    templateSteps: FilingWorkflow['steps'];
    recommendedDataSources: FilingWorkflow['dataSources'];
    bestPractices: string[];
}
export declare class AutomatedFilingWorkflowsService {
    private eventPublisher;
    private workflows;
    private executions;
    private reminders;
    private templates;
    constructor();
    createFilingWorkflow(tenantId: string, workflowConfig: Omit<FilingWorkflow, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<FilingWorkflow>;
    initiateWorkflowExecution(workflowId: string, reportingPeriodEnd: Date, initiatedBy: string): Promise<WorkflowExecution>;
    processWorkflowStep(executionId: string, stepId: string, action: 'start' | 'complete' | 'approve' | 'reject', assignedTo: string, notes?: string, artifacts?: string[]): Promise<WorkflowExecution>;
    getWorkflowDashboard(tenantId: string): Promise<{
        activeWorkflows: number;
        pendingExecutions: number;
        overdueTasks: number;
        upcomingDeadlines: Array<{
            workflowName: string;
            formType: FormType;
            dueDate: Date;
            daysRemaining: number;
            status: string;
        }>;
        recentExecutions: Array<{
            workflowName: string;
            formType: FormType;
            status: string;
            completedAt?: Date;
            duration?: number;
        }>;
        performanceMetrics: {
            averageCompletionTime: number;
            onTimeDeliveryRate: number;
            automationEfficiency: number;
            qualityScore: number;
        };
    }>;
    getWorkflowTemplates(category?: WorkflowTemplate['category'], formType?: FormType): Promise<WorkflowTemplate[]>;
    createWorkflowFromTemplate(tenantId: string, templateId: string, workflowName: string, customizations?: Partial<FilingWorkflow>): Promise<FilingWorkflow>;
    getWorkflow(workflowId: string): Promise<FilingWorkflow | null>;
    getWorkflowExecution(executionId: string): Promise<WorkflowExecution | null>;
    private validateWorkflowConfiguration;
    private calculateScheduledCompletionDate;
    private executeAutomatedStep;
    private getNextStep;
    private completeWorkflowExecution;
    private handleWorkflowFailure;
    private scheduleFilingReminders;
    private calculateAutomationEfficiency;
    private calculateQualityScore;
    private initializeWorkflowTemplates;
}
export {};

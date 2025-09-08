export const __esModule: boolean;
export class AutomatedFilingWorkflowsService {
    eventPublisher: eventPublisher_1.EventPublisher;
    workflows: Map<any, any>;
    executions: Map<any, any>;
    reminders: Map<any, any>;
    templates: Map<any, any>;
    createFilingWorkflow(tenantId: any, workflowConfig: any): Promise<any>;
    initiateWorkflowExecution(workflowId: any, reportingPeriodEnd: any, initiatedBy: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        workflowId: any;
        tenantId: any;
        filingId: `${string}-${string}-${string}-${string}-${string}`;
        status: string;
        currentStep: any;
        initiatedAt: Date;
        scheduledCompletionDate: Date;
        stepStatus: Map<any, any>;
        issues: any[];
        metrics: {
            stepDurations: {};
            automationEfficiency: number;
            qualityScore: number;
        };
        createdAt: Date;
        updatedAt: Date;
    }>;
    processWorkflowStep(executionId: any, stepId: any, action: any, assignedTo: any, notes: any, artifacts: any): Promise<any>;
    getWorkflowDashboard(tenantId: any): Promise<{
        activeWorkflows: number;
        pendingExecutions: number;
        overdueTasks: number;
        upcomingDeadlines: {
            workflowName: any;
            formType: any;
            dueDate: any;
            daysRemaining: number;
            status: any;
        }[];
        recentExecutions: {
            workflowName: any;
            formType: any;
            status: any;
            completedAt: any;
            duration: any;
        }[];
        performanceMetrics: {
            averageCompletionTime: number;
            onTimeDeliveryRate: number;
            automationEfficiency: number;
            qualityScore: number;
        };
    }>;
    getWorkflowTemplates(category: any, formType: any): Promise<any[]>;
    createWorkflowFromTemplate(tenantId: any, templateId: any, workflowName: any, customizations: any): Promise<any>;
    getWorkflow(workflowId: any): Promise<any>;
    getWorkflowExecution(executionId: any): Promise<any>;
    validateWorkflowConfiguration(workflow: any): void;
    calculateScheduledCompletionDate(workflow: any, reportingPeriodEnd: any): Date;
    executeAutomatedStep(execution: any, step: any): Promise<void>;
    getNextStep(workflow: any, currentStepId: any): any;
    completeWorkflowExecution(execution: any, workflow: any): Promise<void>;
    handleWorkflowFailure(execution: any, failedStepId: any, reason: any): Promise<void>;
    scheduleFilingReminders(workflow: any, dueDate: any): Promise<void>;
    calculateAutomationEfficiency(workflow: any): number;
    calculateQualityScore(execution: any): number;
    initializeWorkflowTemplates(): void;
}
import eventPublisher_1 = require("../../utils/eventPublisher");

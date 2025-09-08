export const __esModule: boolean;
export class ComplianceWorkflowService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    createBreachResolutionWorkflow(breach: any, tenantId: any, createdBy: any): Promise<{
        id: string;
        tenantId: any;
        breachId: any;
        workflowType: string;
        status: ComplianceMonitoring_1.WorkflowStatus;
        priority: string;
        assignedTo: string;
        assignedBy: any;
        assignedAt: Date;
        dueDate: Date;
        steps: {
            stepNumber: number;
            stepName: string;
            description: string;
            status: string;
        }[];
        currentStep: number;
        startedAt: Date;
        lastActivityAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateWorkflowStep(workflowId: any, stepNumber: any, status: any, notes: any, userId: any, tenantId: any, attachments: any): Promise<any>;
    escalateWorkflow(workflowId: any, escalateTo: any, reason: any, userId: any, tenantId: any): Promise<any>;
    cancelWorkflow(workflowId: any, reason: any, userId: any, tenantId: any): Promise<any>;
    getWorkflow(workflowId: any, tenantId: any): Promise<any>;
    getWorkflowsByAssignee(assigneeId: any, tenantId: any, status: any, limit?: number, offset?: number): Promise<{
        workflows: any;
        total: any;
    }>;
    getOverdueWorkflows(tenantId: any): Promise<any>;
    generateWorkflowSteps(breach: any): {
        stepNumber: number;
        stepName: string;
        description: string;
        status: string;
    }[];
    calculateDueDate(severity: any): Date;
    calculateEscalationDueDate(): Date;
    determinePriority(severity: any): "HIGH" | "MEDIUM" | "LOW" | "URGENT";
    requiresClientNotification(breach: any): boolean;
    requiresRegulatoryReporting(breach: any): boolean;
    generateId(): string;
    storeWorkflow(workflow: any): Promise<void>;
    updateWorkflow(workflow: any): Promise<void>;
    determineAssignee(breach: any, tenantId: any): Promise<string>;
    resolveAssociatedBreach(breachId: any, userId: any): Promise<void>;
    sendWorkflowAssignmentNotification(workflow: any): Promise<void>;
    sendWorkflowUpdateNotification(workflow: any, stepNumber: any, status: any): Promise<void>;
    sendEscalationNotification(workflow: any, reason: any, escalatedBy: any): Promise<void>;
    sendCancellationNotification(workflow: any, reason: any, cancelledBy: any): Promise<void>;
    publishWorkflowEvent(eventType: any, workflow: any, userId: any): Promise<void>;
}
import ComplianceMonitoring_1 = require("../models/compliance/ComplianceMonitoring");

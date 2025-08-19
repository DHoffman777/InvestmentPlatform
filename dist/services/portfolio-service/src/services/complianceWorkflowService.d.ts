import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { ComplianceWorkflow, WorkflowStatus, ComplianceBreach } from '../models/compliance/ComplianceMonitoring';
export declare class ComplianceWorkflowService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: ReturnType<typeof getKafkaService>);
    createBreachResolutionWorkflow(breach: ComplianceBreach, tenantId: string, createdBy: string): Promise<ComplianceWorkflow>;
    updateWorkflowStep(workflowId: string, stepNumber: number, status: 'COMPLETED' | 'SKIPPED', notes: string, userId: string, tenantId: string, attachments?: string[]): Promise<ComplianceWorkflow>;
    escalateWorkflow(workflowId: string, escalateTo: string, reason: string, userId: string, tenantId: string): Promise<ComplianceWorkflow>;
    cancelWorkflow(workflowId: string, reason: string, userId: string, tenantId: string): Promise<ComplianceWorkflow>;
    getWorkflow(workflowId: string, tenantId: string): Promise<ComplianceWorkflow | null>;
    getWorkflowsByAssignee(assigneeId: string, tenantId: string, status?: WorkflowStatus, limit?: number, offset?: number): Promise<{
        workflows: ComplianceWorkflow[];
        total: number;
    }>;
    getOverdueWorkflows(tenantId: string): Promise<ComplianceWorkflow[]>;
    private generateWorkflowSteps;
    private calculateDueDate;
    private calculateEscalationDueDate;
    private determinePriority;
    private requiresClientNotification;
    private requiresRegulatoryReporting;
    private generateId;
    private storeWorkflow;
    private updateWorkflow;
    private determineAssignee;
    private resolveAssociatedBreach;
    private sendWorkflowAssignmentNotification;
    private sendWorkflowUpdateNotification;
    private sendEscalationNotification;
    private sendCancellationNotification;
    private publishWorkflowEvent;
}

// Compliance Workflow Service
// Phase 3.6 - Workflow management for breach resolution and compliance tasks

import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import {
  ComplianceWorkflow,
  WorkflowStatus,
  WorkflowStep,
  ComplianceBreach,
  BreachSeverity,
  ComplianceRuleType
} from '../models/compliance/ComplianceMonitoring';

export class ComplianceWorkflowService {
  constructor(
    private prisma: PrismaClient,
    private kafkaService: ReturnType<typeof getKafkaService>
  ) {}

  // Create workflow for breach resolution
  async createBreachResolutionWorkflow(
    breach: ComplianceBreach,
    tenantId: string,
    createdBy: string
  ): Promise<ComplianceWorkflow> {
    try {
      // Determine workflow steps based on breach severity and type
      const workflowSteps = this.generateWorkflowSteps(breach);
      
      // Calculate due date based on severity
      const dueDate = this.calculateDueDate(breach.severity);
      
      // Assign workflow based on breach type and severity
      const assignedTo = await this.determineAssignee(breach, tenantId);

      const workflow: ComplianceWorkflow = {
        id: this.generateId(),
        tenantId,
        breachId: breach.id,
        workflowType: 'BREACH_RESOLUTION',
        status: WorkflowStatus.PENDING,
        priority: this.determinePriority(breach.severity),
        assignedTo,
        assignedBy: createdBy,
        assignedAt: new Date(),
        dueDate,
        steps: workflowSteps,
        currentStep: 1,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store workflow
      await this.storeWorkflow(workflow);

      // Send assignment notification
      await this.sendWorkflowAssignmentNotification(workflow);

      // Publish workflow event
      await this.publishWorkflowEvent('workflow.created', workflow, createdBy);

      logger.info('Breach resolution workflow created', {
        workflowId: workflow.id,
        breachId: breach.id,
        assignedTo,
        priority: workflow.priority,
        stepCount: workflowSteps.length
      });

      return workflow;

    } catch (error) {
      logger.error('Error creating breach resolution workflow:', error);
      throw error;
    }
  }

  // Update workflow step
  async updateWorkflowStep(
    workflowId: string,
    stepNumber: number,
    status: 'COMPLETED' | 'SKIPPED',
    notes: string,
    userId: string,
    tenantId: string,
    attachments?: string[]
  ): Promise<ComplianceWorkflow> {
    try {
      const workflow = await this.getWorkflow(workflowId, tenantId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Update the specific step
      const updatedSteps = workflow.steps.map(step => {
        if (step.stepNumber === stepNumber) {
          return {
            ...step,
            status,
            completedAt: new Date(),
            completedBy: userId,
            notes,
            attachments: attachments || step.attachments
          };
        }
        return step;
      });

      // Determine next step
      let nextStep = workflow.currentStep;
      let workflowStatus = workflow.status;

      if (status === 'COMPLETED') {
        // Find next pending step
        const nextPendingStep = updatedSteps.find(
          step => step.stepNumber > stepNumber && step.status === 'PENDING'
        );
        
        if (nextPendingStep) {
          nextStep = nextPendingStep.stepNumber;
          workflowStatus = WorkflowStatus.IN_PROGRESS;
        } else {
          // All steps completed
          workflowStatus = WorkflowStatus.RESOLVED;
          nextStep = updatedSteps.length;
        }
      } else if (status === 'SKIPPED') {
        // Move to next step
        const nextPendingStep = updatedSteps.find(
          step => step.stepNumber > stepNumber && step.status === 'PENDING'
        );
        
        if (nextPendingStep) {
          nextStep = nextPendingStep.stepNumber;
        } else {
          workflowStatus = WorkflowStatus.RESOLVED;
        }
      }

      const updatedWorkflow: ComplianceWorkflow = {
        ...workflow,
        steps: updatedSteps,
        currentStep: nextStep,
        status: workflowStatus,
        lastActivityAt: new Date(),
        completedAt: workflowStatus === WorkflowStatus.RESOLVED ? new Date() : undefined,
        updatedAt: new Date()
      };

      // Store updated workflow
      await this.updateWorkflow(updatedWorkflow);

      // If workflow is resolved, update the breach status
      if (workflowStatus === WorkflowStatus.RESOLVED) {
        await this.resolveAssociatedBreach(workflow.breachId, userId);
      }

      // Send notifications
      await this.sendWorkflowUpdateNotification(updatedWorkflow, stepNumber, status);

      // Publish workflow event
      await this.publishWorkflowEvent('workflow.step_updated', updatedWorkflow, userId);

      logger.info('Workflow step updated', {
        workflowId,
        stepNumber,
        status,
        newCurrentStep: nextStep,
        workflowStatus
      });

      return updatedWorkflow;

    } catch (error) {
      logger.error('Error updating workflow step:', error);
      throw error;
    }
  }

  // Escalate workflow
  async escalateWorkflow(
    workflowId: string,
    escalateTo: string,
    reason: string,
    userId: string,
    tenantId: string
  ): Promise<ComplianceWorkflow> {
    try {
      const workflow = await this.getWorkflow(workflowId, tenantId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const escalatedWorkflow: ComplianceWorkflow = {
        ...workflow,
        status: WorkflowStatus.ESCALATED,
        assignedTo: escalateTo,
        escalatedAt: new Date(),
        escalatedTo: escalateTo,
        lastActivityAt: new Date(),
        updatedAt: new Date()
      };

      // Add escalation step
      const escalationStep: WorkflowStep = {
        stepNumber: workflow.steps.length + 1,
        stepName: 'Escalation Review',
        description: `Escalated by ${userId}: ${reason}`,
        assignedTo: escalateTo,
        dueDate: this.calculateEscalationDueDate(),
        status: 'PENDING'
      };

      escalatedWorkflow.steps = [...workflow.steps, escalationStep];
      escalatedWorkflow.currentStep = escalationStep.stepNumber;

      // Store updated workflow
      await this.updateWorkflow(escalatedWorkflow);

      // Send escalation notifications
      await this.sendEscalationNotification(escalatedWorkflow, reason, userId);

      // Publish workflow event
      await this.publishWorkflowEvent('workflow.escalated', escalatedWorkflow, userId);

      logger.info('Workflow escalated', {
        workflowId,
        escalatedTo,
        reason,
        escalatedBy: userId
      });

      return escalatedWorkflow;

    } catch (error) {
      logger.error('Error escalating workflow:', error);
      throw error;
    }
  }

  // Cancel workflow
  async cancelWorkflow(
    workflowId: string,
    reason: string,
    userId: string,
    tenantId: string
  ): Promise<ComplianceWorkflow> {
    try {
      const workflow = await this.getWorkflow(workflowId, tenantId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const cancelledWorkflow: ComplianceWorkflow = {
        ...workflow,
        status: WorkflowStatus.CANCELLED,
        resolutionType: 'CANCELLED',
        resolutionNotes: reason,
        completedAt: new Date(),
        lastActivityAt: new Date(),
        updatedAt: new Date()
      };

      // Store updated workflow
      await this.updateWorkflow(cancelledWorkflow);

      // Send cancellation notifications
      await this.sendCancellationNotification(cancelledWorkflow, reason, userId);

      // Publish workflow event
      await this.publishWorkflowEvent('workflow.cancelled', cancelledWorkflow, userId);

      logger.info('Workflow cancelled', {
        workflowId,
        reason,
        cancelledBy: userId
      });

      return cancelledWorkflow;

    } catch (error) {
      logger.error('Error cancelling workflow:', error);
      throw error;
    }
  }

  // Get workflow by ID
  async getWorkflow(workflowId: string, tenantId: string): Promise<ComplianceWorkflow | null> {
    try {
      const workflow = await this.prisma.complianceWorkflow.findFirst({
        where: {
          id: workflowId,
          tenantId
        },
        include: {
          breach: true
        }
      });

      return workflow;
    } catch (error) {
      logger.error('Error fetching workflow:', error);
      return null;
    }
  }

  // Get workflows by assignee
  async getWorkflowsByAssignee(
    assigneeId: string,
    tenantId: string,
    status?: WorkflowStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{workflows: ComplianceWorkflow[], total: number}> {
    try {
      const whereClause: any = {
        assignedTo: assigneeId,
        tenantId
      };

      if (status) {
        whereClause.status = status;
      }

      const [workflows, total] = await Promise.all([
        this.prisma.complianceWorkflow.findMany({
          where: whereClause,
          include: {
            breach: true
          },
          orderBy: {
            dueDate: 'asc'
          },
          take: limit,
          skip: offset
        }),
        this.prisma.complianceWorkflow.count({
          where: whereClause
        })
      ]);

      return { workflows, total };
    } catch (error) {
      logger.error('Error fetching workflows by assignee:', error);
      return { workflows: [], total: 0 };
    }
  }

  // Get overdue workflows
  async getOverdueWorkflows(tenantId: string): Promise<ComplianceWorkflow[]> {
    try {
      const workflows = await this.prisma.complianceWorkflow.findMany({
        where: {
          tenantId,
          status: {
            in: [WorkflowStatus.PENDING, WorkflowStatus.IN_PROGRESS]
          },
          dueDate: {
            lt: new Date()
          }
        },
        include: {
          breach: true
        },
        orderBy: {
          dueDate: 'asc'
        }
      });

      return workflows;
    } catch (error) {
      logger.error('Error fetching overdue workflows:', error);
      return [];
    }
  }

  // Generate workflow steps based on breach characteristics
  private generateWorkflowSteps(breach: ComplianceBreach): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    let stepNumber = 1;

    // Initial investigation step
    steps.push({
      stepNumber: stepNumber++,
      stepName: 'Initial Investigation',
      description: 'Review breach details and determine root cause',
      status: 'PENDING'
    });

    // Risk assessment step
    if (breach.severity === BreachSeverity.HIGH || breach.severity === BreachSeverity.CRITICAL) {
      steps.push({
        stepNumber: stepNumber++,
        stepName: 'Risk Assessment',
        description: 'Assess portfolio risk and potential impact',
        status: 'PENDING'
      });
    }

    // Client notification (if required)
    if (this.requiresClientNotification(breach)) {
      steps.push({
        stepNumber: stepNumber++,
        stepName: 'Client Notification',
        description: 'Notify client of compliance breach and required actions',
        status: 'PENDING'
      });
    }

    // Remediation action
    steps.push({
      stepNumber: stepNumber++,
      stepName: 'Remediation Action',
      description: 'Implement corrective measures to resolve breach',
      status: 'PENDING'
    });

    // Verification step
    steps.push({
      stepNumber: stepNumber++,
      stepName: 'Verification',
      description: 'Verify that breach has been resolved and controls are effective',
      status: 'PENDING'
    });

    // Documentation step
    steps.push({
      stepNumber: stepNumber++,
      stepName: 'Documentation',
      description: 'Complete breach resolution documentation and file reports',
      status: 'PENDING'
    });

    // Regulatory reporting (if required)
    if (this.requiresRegulatoryReporting(breach)) {
      steps.push({
        stepNumber: stepNumber++,
        stepName: 'Regulatory Reporting',
        description: 'File required regulatory reports and notifications',
        status: 'PENDING'
      });
    }

    return steps;
  }

  // Calculate due date based on severity
  private calculateDueDate(severity: BreachSeverity): Date {
    const now = new Date();
    
    switch (severity) {
      case BreachSeverity.CRITICAL:
        return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
      case BreachSeverity.HIGH:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      case BreachSeverity.MEDIUM:
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      case BreachSeverity.LOW:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      default:
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    }
  }

  // Calculate escalation due date
  private calculateEscalationDueDate(): Date {
    const now = new Date();
    return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
  }

  // Determine workflow priority
  private determinePriority(severity: BreachSeverity): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    switch (severity) {
      case BreachSeverity.CRITICAL:
        return 'URGENT';
      case BreachSeverity.HIGH:
        return 'HIGH';
      case BreachSeverity.MEDIUM:
        return 'MEDIUM';
      case BreachSeverity.LOW:
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  }

  // Check if breach requires client notification
  private requiresClientNotification(breach: ComplianceBreach): boolean {
    return breach.severity === BreachSeverity.HIGH || 
           breach.severity === BreachSeverity.CRITICAL ||
           breach.breachType === ComplianceRuleType.SUITABILITY_CHECK;
  }

  // Check if breach requires regulatory reporting
  private requiresRegulatoryReporting(breach: ComplianceBreach): boolean {
    return breach.severity === BreachSeverity.CRITICAL ||
           breach.breachType === ComplianceRuleType.REGULATORY_LIMIT;
  }

  // Generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Database operations (placeholder implementations)
  private async storeWorkflow(workflow: ComplianceWorkflow): Promise<void> {
    // Implementation would store workflow in database
  }

  private async updateWorkflow(workflow: ComplianceWorkflow): Promise<void> {
    // Implementation would update workflow in database
  }

  private async determineAssignee(breach: ComplianceBreach, tenantId: string): Promise<string> {
    // Implementation would determine appropriate assignee based on breach characteristics
    return 'default_compliance_officer';
  }

  private async resolveAssociatedBreach(breachId: string, userId: string): Promise<void> {
    // Implementation would update breach status to resolved
  }

  private async sendWorkflowAssignmentNotification(workflow: ComplianceWorkflow): Promise<void> {
    // Implementation would send notification to assignee
  }

  private async sendWorkflowUpdateNotification(
    workflow: ComplianceWorkflow, 
    stepNumber: number, 
    status: string
  ): Promise<void> {
    // Implementation would send update notifications
  }

  private async sendEscalationNotification(
    workflow: ComplianceWorkflow,
    reason: string,
    escalatedBy: string
  ): Promise<void> {
    // Implementation would send escalation notifications
  }

  private async sendCancellationNotification(
    workflow: ComplianceWorkflow,
    reason: string,
    cancelledBy: string
  ): Promise<void> {
    // Implementation would send cancellation notifications
  }

  private async publishWorkflowEvent(
    eventType: string,
    workflow: ComplianceWorkflow,
    userId: string
  ): Promise<void> {
    await this.kafkaService.publishEvent(eventType, {
      workflowId: workflow.id,
      breachId: workflow.breachId,
      status: workflow.status,
      assignedTo: workflow.assignedTo,
      userId,
      timestamp: new Date().toISOString()
    });
  }
}
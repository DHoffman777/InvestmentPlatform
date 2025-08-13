"use strict";
// Compliance Workflow Service
// Phase 3.6 - Workflow management for breach resolution and compliance tasks
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceWorkflowService = void 0;
const logger_1 = require("../utils/logger");
const ComplianceMonitoring_1 = require("../models/compliance/ComplianceMonitoring");
class ComplianceWorkflowService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Create workflow for breach resolution
    async createBreachResolutionWorkflow(breach, tenantId, createdBy) {
        try {
            // Determine workflow steps based on breach severity and type
            const workflowSteps = this.generateWorkflowSteps(breach);
            // Calculate due date based on severity
            const dueDate = this.calculateDueDate(breach.severity);
            // Assign workflow based on breach type and severity
            const assignedTo = await this.determineAssignee(breach, tenantId);
            const workflow = {
                id: this.generateId(),
                tenantId,
                breachId: breach.id,
                workflowType: 'BREACH_RESOLUTION',
                status: ComplianceMonitoring_1.WorkflowStatus.PENDING,
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
            logger_1.logger.info('Breach resolution workflow created', {
                workflowId: workflow.id,
                breachId: breach.id,
                assignedTo,
                priority: workflow.priority,
                stepCount: workflowSteps.length
            });
            return workflow;
        }
        catch (error) {
            logger_1.logger.error('Error creating breach resolution workflow:', error);
            throw error;
        }
    }
    // Update workflow step
    async updateWorkflowStep(workflowId, stepNumber, status, notes, userId, tenantId, attachments) {
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
                const nextPendingStep = updatedSteps.find(step => step.stepNumber > stepNumber && step.status === 'PENDING');
                if (nextPendingStep) {
                    nextStep = nextPendingStep.stepNumber;
                    workflowStatus = ComplianceMonitoring_1.WorkflowStatus.IN_PROGRESS;
                }
                else {
                    // All steps completed
                    workflowStatus = ComplianceMonitoring_1.WorkflowStatus.RESOLVED;
                    nextStep = updatedSteps.length;
                }
            }
            else if (status === 'SKIPPED') {
                // Move to next step
                const nextPendingStep = updatedSteps.find(step => step.stepNumber > stepNumber && step.status === 'PENDING');
                if (nextPendingStep) {
                    nextStep = nextPendingStep.stepNumber;
                }
                else {
                    workflowStatus = ComplianceMonitoring_1.WorkflowStatus.RESOLVED;
                }
            }
            const updatedWorkflow = {
                ...workflow,
                steps: updatedSteps,
                currentStep: nextStep,
                status: workflowStatus,
                lastActivityAt: new Date(),
                completedAt: workflowStatus === ComplianceMonitoring_1.WorkflowStatus.RESOLVED ? new Date() : undefined,
                updatedAt: new Date()
            };
            // Store updated workflow
            await this.updateWorkflow(updatedWorkflow);
            // If workflow is resolved, update the breach status
            if (workflowStatus === ComplianceMonitoring_1.WorkflowStatus.RESOLVED) {
                await this.resolveAssociatedBreach(workflow.breachId, userId);
            }
            // Send notifications
            await this.sendWorkflowUpdateNotification(updatedWorkflow, stepNumber, status);
            // Publish workflow event
            await this.publishWorkflowEvent('workflow.step_updated', updatedWorkflow, userId);
            logger_1.logger.info('Workflow step updated', {
                workflowId,
                stepNumber,
                status,
                newCurrentStep: nextStep,
                workflowStatus
            });
            return updatedWorkflow;
        }
        catch (error) {
            logger_1.logger.error('Error updating workflow step:', error);
            throw error;
        }
    }
    // Escalate workflow
    async escalateWorkflow(workflowId, escalateTo, reason, userId, tenantId) {
        try {
            const workflow = await this.getWorkflow(workflowId, tenantId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }
            const escalatedWorkflow = {
                ...workflow,
                status: ComplianceMonitoring_1.WorkflowStatus.ESCALATED,
                assignedTo: escalateTo,
                escalatedAt: new Date(),
                escalatedTo: escalateTo,
                lastActivityAt: new Date(),
                updatedAt: new Date()
            };
            // Add escalation step
            const escalationStep = {
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
            logger_1.logger.info('Workflow escalated', {
                workflowId,
                escalatedTo,
                reason,
                escalatedBy: userId
            });
            return escalatedWorkflow;
        }
        catch (error) {
            logger_1.logger.error('Error escalating workflow:', error);
            throw error;
        }
    }
    // Cancel workflow
    async cancelWorkflow(workflowId, reason, userId, tenantId) {
        try {
            const workflow = await this.getWorkflow(workflowId, tenantId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }
            const cancelledWorkflow = {
                ...workflow,
                status: ComplianceMonitoring_1.WorkflowStatus.CANCELLED,
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
            logger_1.logger.info('Workflow cancelled', {
                workflowId,
                reason,
                cancelledBy: userId
            });
            return cancelledWorkflow;
        }
        catch (error) {
            logger_1.logger.error('Error cancelling workflow:', error);
            throw error;
        }
    }
    // Get workflow by ID
    async getWorkflow(workflowId, tenantId) {
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching workflow:', error);
            return null;
        }
    }
    // Get workflows by assignee
    async getWorkflowsByAssignee(assigneeId, tenantId, status, limit = 50, offset = 0) {
        try {
            const whereClause = {
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching workflows by assignee:', error);
            return { workflows: [], total: 0 };
        }
    }
    // Get overdue workflows
    async getOverdueWorkflows(tenantId) {
        try {
            const workflows = await this.prisma.complianceWorkflow.findMany({
                where: {
                    tenantId,
                    status: {
                        in: [ComplianceMonitoring_1.WorkflowStatus.PENDING, ComplianceMonitoring_1.WorkflowStatus.IN_PROGRESS]
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching overdue workflows:', error);
            return [];
        }
    }
    // Generate workflow steps based on breach characteristics
    generateWorkflowSteps(breach) {
        const steps = [];
        let stepNumber = 1;
        // Initial investigation step
        steps.push({
            stepNumber: stepNumber++,
            stepName: 'Initial Investigation',
            description: 'Review breach details and determine root cause',
            status: 'PENDING'
        });
        // Risk assessment step
        if (breach.severity === ComplianceMonitoring_1.BreachSeverity.HIGH || breach.severity === ComplianceMonitoring_1.BreachSeverity.CRITICAL) {
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
    calculateDueDate(severity) {
        const now = new Date();
        switch (severity) {
            case ComplianceMonitoring_1.BreachSeverity.CRITICAL:
                return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
            case ComplianceMonitoring_1.BreachSeverity.HIGH:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
            case ComplianceMonitoring_1.BreachSeverity.MEDIUM:
                return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
            case ComplianceMonitoring_1.BreachSeverity.LOW:
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
            default:
                return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        }
    }
    // Calculate escalation due date
    calculateEscalationDueDate() {
        const now = new Date();
        return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
    }
    // Determine workflow priority
    determinePriority(severity) {
        switch (severity) {
            case ComplianceMonitoring_1.BreachSeverity.CRITICAL:
                return 'URGENT';
            case ComplianceMonitoring_1.BreachSeverity.HIGH:
                return 'HIGH';
            case ComplianceMonitoring_1.BreachSeverity.MEDIUM:
                return 'MEDIUM';
            case ComplianceMonitoring_1.BreachSeverity.LOW:
                return 'LOW';
            default:
                return 'MEDIUM';
        }
    }
    // Check if breach requires client notification
    requiresClientNotification(breach) {
        return breach.severity === ComplianceMonitoring_1.BreachSeverity.HIGH ||
            breach.severity === ComplianceMonitoring_1.BreachSeverity.CRITICAL ||
            breach.breachType === ComplianceMonitoring_1.ComplianceRuleType.SUITABILITY_CHECK;
    }
    // Check if breach requires regulatory reporting
    requiresRegulatoryReporting(breach) {
        return breach.severity === ComplianceMonitoring_1.BreachSeverity.CRITICAL ||
            breach.breachType === ComplianceMonitoring_1.ComplianceRuleType.REGULATORY_LIMIT;
    }
    // Generate unique ID
    generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    // Database operations (placeholder implementations)
    async storeWorkflow(workflow) {
        // Implementation would store workflow in database
    }
    async updateWorkflow(workflow) {
        // Implementation would update workflow in database
    }
    async determineAssignee(breach, tenantId) {
        // Implementation would determine appropriate assignee based on breach characteristics
        return 'default_compliance_officer';
    }
    async resolveAssociatedBreach(breachId, userId) {
        // Implementation would update breach status to resolved
    }
    async sendWorkflowAssignmentNotification(workflow) {
        // Implementation would send notification to assignee
    }
    async sendWorkflowUpdateNotification(workflow, stepNumber, status) {
        // Implementation would send update notifications
    }
    async sendEscalationNotification(workflow, reason, escalatedBy) {
        // Implementation would send escalation notifications
    }
    async sendCancellationNotification(workflow, reason, cancelledBy) {
        // Implementation would send cancellation notifications
    }
    async publishWorkflowEvent(eventType, workflow, userId) {
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
exports.ComplianceWorkflowService = ComplianceWorkflowService;

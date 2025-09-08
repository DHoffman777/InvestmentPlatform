"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapacityAlertWorkflowManager = exports.WorkflowExecutionStatus = exports.WorkflowStepType = void 0;
const events_1 = require("events");
const CapacityPlanningDataModel_1 = require("./CapacityPlanningDataModel");
var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["NOTIFICATION"] = "notification";
    WorkflowStepType["ESCALATION"] = "escalation";
    WorkflowStepType["AUTO_SCALING"] = "auto_scaling";
    WorkflowStepType["APPROVAL_REQUEST"] = "approval_request";
    WorkflowStepType["SCRIPT_EXECUTION"] = "script_execution";
    WorkflowStepType["API_CALL"] = "api_call";
    WorkflowStepType["WEBHOOK"] = "webhook";
    WorkflowStepType["TICKET_CREATION"] = "ticket_creation";
    WorkflowStepType["REMEDIATION"] = "remediation";
})(WorkflowStepType || (exports.WorkflowStepType = WorkflowStepType = {}));
var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "pending";
    WorkflowExecutionStatus["RUNNING"] = "running";
    WorkflowExecutionStatus["WAITING_APPROVAL"] = "waiting_approval";
    WorkflowExecutionStatus["COMPLETED"] = "completed";
    WorkflowExecutionStatus["FAILED"] = "failed";
    WorkflowExecutionStatus["CANCELLED"] = "cancelled";
    WorkflowExecutionStatus["TIMEOUT"] = "timeout";
})(WorkflowExecutionStatus || (exports.WorkflowExecutionStatus = WorkflowExecutionStatus = {}));
class CapacityAlertWorkflowManager extends events_1.EventEmitter {
    workflows = new Map();
    executions = new Map();
    integrations = new Map();
    config;
    stepExecutor;
    approvalManager;
    constructor(config) {
        super();
        this.config = config;
        this.stepExecutor = new WorkflowStepExecutor(config.integrations);
        this.approvalManager = new ApprovalManager();
        this.initializeDefaultWorkflows();
        this.initializeIntegrations();
    }
    async processAlert(alert) {
        const executions = [];
        const matchingWorkflows = this.findMatchingWorkflows(alert);
        for (const workflow of matchingWorkflows) {
            try {
                const execution = await this.executeWorkflow(workflow, alert);
                executions.push(execution);
                this.emit('workflowStarted', {
                    executionId: execution.id,
                    workflowId: workflow.id,
                    alertId: alert.id
                });
            }
            catch (error) {
                this.emit('workflowStartFailed', {
                    workflowId: workflow.id,
                    alertId: alert.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return executions;
    }
    async executeWorkflow(workflow, alert) {
        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            workflowId: workflow.id,
            alertId: alert.id,
            status: WorkflowExecutionStatus.PENDING,
            startedAt: new Date(),
            currentStep: 0,
            steps: [],
            approvals: [],
            context: {
                alert,
                resourceId: alert.resourceId,
                customData: {}
            }
        };
        this.executions.set(executionId, execution);
        try {
            execution.status = WorkflowExecutionStatus.RUNNING;
            await this.processWorkflowSteps(execution, workflow);
        }
        catch (error) {
            execution.status = WorkflowExecutionStatus.FAILED;
            this.emit('workflowFailed', { executionId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
        return execution;
    }
    async processWorkflowSteps(execution, workflow) {
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            execution.currentStep = i;
            if (!this.canExecuteStep(step, execution)) {
                continue;
            }
            const stepExecution = {
                stepId: step.id,
                status: WorkflowExecutionStatus.PENDING,
                startedAt: new Date(),
                retryCount: 0
            };
            execution.steps.push(stepExecution);
            try {
                stepExecution.status = WorkflowExecutionStatus.RUNNING;
                if (step.approvalRequired) {
                    await this.requestApproval(execution, step);
                    stepExecution.status = WorkflowExecutionStatus.WAITING_APPROVAL;
                    execution.status = WorkflowExecutionStatus.WAITING_APPROVAL;
                    this.emit('approvalRequested', {
                        executionId: execution.id,
                        stepId: step.id,
                        alertId: execution.alertId
                    });
                    return;
                }
                const result = await this.executeStep(step, execution);
                stepExecution.output = result;
                stepExecution.status = WorkflowExecutionStatus.COMPLETED;
                stepExecution.completedAt = new Date();
                this.emit('stepCompleted', {
                    executionId: execution.id,
                    stepId: step.id,
                    output: result
                });
            }
            catch (error) {
                stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
                stepExecution.status = WorkflowExecutionStatus.FAILED;
                stepExecution.completedAt = new Date();
                if (step.onFailure === 'stop') {
                    execution.status = WorkflowExecutionStatus.FAILED;
                    throw error;
                }
                else if (step.onFailure === 'retry' && stepExecution.retryCount < step.retryCount) {
                    stepExecution.retryCount++;
                    i--; // Retry current step
                    continue;
                }
                this.emit('stepFailed', {
                    executionId: execution.id,
                    stepId: step.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        execution.status = WorkflowExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
        this.emit('workflowCompleted', {
            executionId: execution.id,
            duration: execution.completedAt.getTime() - execution.startedAt.getTime()
        });
    }
    async executeStep(step, execution) {
        const context = {
            alert: execution.context.alert,
            resourceId: execution.context.resourceId,
            executionId: execution.id,
            ...execution.context.customData
        };
        return await this.stepExecutor.execute(step, context);
    }
    canExecuteStep(step, execution) {
        if (step.dependencies.length === 0) {
            return true;
        }
        return step.dependencies.every(depId => {
            const dependentStep = execution.steps.find(s => s.stepId === depId);
            return dependentStep && dependentStep.status === WorkflowExecutionStatus.COMPLETED;
        });
    }
    async requestApproval(execution, step) {
        const approval = {
            id: this.generateApprovalId(),
            stepId: step.id,
            requestedAt: new Date(),
            status: 'pending'
        };
        execution.approvals.push(approval);
        await this.approvalManager.requestApproval(approval, execution, step);
    }
    async approveWorkflowStep(executionId, approvalId, userId, comments) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        const approval = execution.approvals.find(a => a.id === approvalId);
        if (!approval) {
            throw new Error(`Approval ${approvalId} not found`);
        }
        approval.status = 'approved';
        approval.approvedAt = new Date();
        approval.approvedBy = userId;
        approval.comments = comments;
        this.emit('approvalGranted', { executionId, approvalId, userId });
        if (execution.status === WorkflowExecutionStatus.WAITING_APPROVAL) {
            const workflow = this.workflows.get(execution.workflowId);
            if (workflow) {
                execution.status = WorkflowExecutionStatus.RUNNING;
                await this.processWorkflowSteps(execution, workflow);
            }
        }
    }
    async rejectWorkflowStep(executionId, approvalId, userId, comments) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        const approval = execution.approvals.find(a => a.id === approvalId);
        if (!approval) {
            throw new Error(`Approval ${approvalId} not found`);
        }
        approval.status = 'rejected';
        approval.approvedAt = new Date();
        approval.approvedBy = userId;
        approval.comments = comments;
        execution.status = WorkflowExecutionStatus.CANCELLED;
        execution.completedAt = new Date();
        this.emit('approvalRejected', { executionId, approvalId, userId });
        this.emit('workflowCancelled', { executionId, reason: 'approval_rejected' });
    }
    async createWorkflowTemplate(template) {
        const workflowTemplate = {
            id: template.id || this.generateWorkflowId(),
            name: template.name || 'Unnamed Workflow',
            triggerConditions: template.triggerConditions || [],
            steps: template.steps || [],
            approvalRequired: template.approvalRequired || false,
            timeoutMinutes: template.timeoutMinutes || 60
        };
        await this.validateWorkflowTemplate(workflowTemplate);
        this.workflows.set(workflowTemplate.id, workflowTemplate);
        this.emit('workflowTemplateCreated', { templateId: workflowTemplate.id });
        return workflowTemplate;
    }
    async scheduleWorkflowMaintenance(workflowId, maintenanceWindow) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        this.emit('workflowMaintenanceScheduled', { workflowId, maintenanceWindow });
        // Pause workflow executions during maintenance
        setTimeout(() => {
            this.emit('workflowMaintenanceStarted', { workflowId });
        }, maintenanceWindow.start.getTime() - Date.now());
        setTimeout(() => {
            this.emit('workflowMaintenanceCompleted', { workflowId });
        }, maintenanceWindow.end.getTime() - Date.now());
    }
    async getWorkflowMetrics(workflowId) {
        const executions = workflowId
            ? Array.from(this.executions.values()).filter(e => e.workflowId === workflowId)
            : Array.from(this.executions.values());
        const totalExecutions = executions.length;
        const completedExecutions = executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED);
        const successRate = totalExecutions > 0 ? completedExecutions.length / totalExecutions : 0;
        const executionTimes = completedExecutions
            .filter(e => e.completedAt)
            .map(e => e.completedAt.getTime() - e.startedAt.getTime());
        const averageExecutionTime = executionTimes.length > 0
            ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
            : 0;
        const escalatedExecutions = executions.filter(e => e.steps.some(s => s.stepId.includes('escalation')));
        const escalationRate = totalExecutions > 0 ? escalatedExecutions.length / totalExecutions : 0;
        const autoRemediatedExecutions = executions.filter(e => e.steps.some(s => s.stepId.includes('remediation') && s.status === WorkflowExecutionStatus.COMPLETED));
        const autoRemediationRate = totalExecutions > 0 ? autoRemediatedExecutions.length / totalExecutions : 0;
        const manualInterventionExecutions = executions.filter(e => e.approvals.length > 0 || e.status === WorkflowExecutionStatus.WAITING_APPROVAL);
        const manualInterventionRate = totalExecutions > 0 ? manualInterventionExecutions.length / totalExecutions : 0;
        return {
            totalExecutions,
            successRate,
            averageExecutionTime,
            escalationRate,
            autoRemediationRate,
            manualInterventionRate
        };
    }
    findMatchingWorkflows(alert) {
        return Array.from(this.workflows.values()).filter(workflow => workflow.triggerConditions.some(condition => this.matchesTriggerCondition(condition, alert)));
    }
    matchesTriggerCondition(condition, alert) {
        if (condition.alertType && condition.alertType !== alert.type) {
            return false;
        }
        if (condition.severity && condition.severity !== alert.severity) {
            return false;
        }
        if (condition.resourcePattern) {
            const regex = new RegExp(condition.resourcePattern);
            if (!regex.test(alert.resourceId)) {
                return false;
            }
        }
        return true;
    }
    initializeDefaultWorkflows() {
        const defaultWorkflows = [
            {
                name: 'Critical Alert Response',
                triggerConditions: [{
                        alertType: CapacityPlanningDataModel_1.AlertType.THRESHOLD_BREACH,
                        severity: CapacityPlanningDataModel_1.AlertSeverity.CRITICAL
                    }],
                steps: [
                    {
                        id: 'immediate_notification',
                        name: 'Send Immediate Notification',
                        type: WorkflowStepType.NOTIFICATION,
                        configuration: { channels: ['slack', 'email'], priority: 'urgent' },
                        timeout: 30000,
                        retryCount: 3,
                        onFailure: 'continue',
                        approvalRequired: false,
                        dependencies: []
                    },
                    {
                        id: 'auto_scaling_check',
                        name: 'Check Auto-Scaling Options',
                        type: WorkflowStepType.AUTO_SCALING,
                        configuration: { action: 'evaluate' },
                        timeout: 60000,
                        retryCount: 2,
                        onFailure: 'continue',
                        approvalRequired: true,
                        dependencies: ['immediate_notification']
                    },
                    {
                        id: 'create_incident',
                        name: 'Create Incident Ticket',
                        type: WorkflowStepType.TICKET_CREATION,
                        configuration: { severity: 'P1', assignee: 'on-call-engineer' },
                        timeout: 120000,
                        retryCount: 3,
                        onFailure: 'retry',
                        approvalRequired: false,
                        dependencies: []
                    }
                ],
                approvalRequired: true,
                timeoutMinutes: 30
            },
            {
                name: 'Resource Optimization Workflow',
                triggerConditions: [{
                        alertType: CapacityPlanningDataModel_1.AlertType.COST_SPIKE,
                        severity: CapacityPlanningDataModel_1.AlertSeverity.MEDIUM
                    }],
                steps: [
                    {
                        id: 'cost_analysis',
                        name: 'Perform Cost Analysis',
                        type: WorkflowStepType.API_CALL,
                        configuration: { endpoint: '/api/cost-optimization/analyze' },
                        timeout: 300000,
                        retryCount: 2,
                        onFailure: 'stop',
                        approvalRequired: false,
                        dependencies: []
                    },
                    {
                        id: 'optimization_recommendations',
                        name: 'Generate Optimization Recommendations',
                        type: WorkflowStepType.REMEDIATION,
                        configuration: { type: 'cost_optimization' },
                        timeout: 180000,
                        retryCount: 1,
                        onFailure: 'continue',
                        approvalRequired: true,
                        dependencies: ['cost_analysis']
                    }
                ],
                approvalRequired: true,
                timeoutMinutes: 120
            }
        ];
        defaultWorkflows.forEach(workflow => {
            this.createWorkflowTemplate(workflow);
        });
    }
    initializeIntegrations() {
        for (const integrationConfig of this.config.integrations) {
            if (integrationConfig.isActive) {
                const integration = this.createIntegration(integrationConfig);
                this.integrations.set(integrationConfig.type, integration);
            }
        }
    }
    createIntegration(config) {
        switch (config.type) {
            case 'slack':
                return new SlackIntegration(config.configuration);
            case 'email':
                return new EmailIntegration(config.configuration);
            case 'pagerduty':
                return new PagerDutyIntegration(config.configuration);
            case 'jira':
                return new JiraIntegration(config.configuration);
            default:
                return new WebhookIntegration(config.configuration);
        }
    }
    async validateWorkflowTemplate(template) {
        if (!template.name || template.name.trim().length === 0) {
            throw new Error('Workflow template name is required');
        }
        if (template.steps.length === 0) {
            throw new Error('Workflow template must have at least one step');
        }
        if (template.triggerConditions.length === 0) {
            throw new Error('Workflow template must have at least one trigger condition');
        }
        // Validate step dependencies
        const stepIds = new Set(template.steps.map(s => s.id));
        for (const step of template.steps) {
            for (const depId of step.dependencies) {
                if (!stepIds.has(depId)) {
                    throw new Error(`Step ${step.id} has invalid dependency: ${depId}`);
                }
            }
        }
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateApprovalId() {
        return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getExecution(executionId) {
        return this.executions.get(executionId) || null;
    }
    getAllExecutions() {
        return Array.from(this.executions.values());
    }
    getWorkflowTemplate(workflowId) {
        return this.workflows.get(workflowId) || null;
    }
    getAllWorkflowTemplates() {
        return Array.from(this.workflows.values());
    }
    async cancelExecution(executionId, reason) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        execution.status = WorkflowExecutionStatus.CANCELLED;
        execution.completedAt = new Date();
        this.emit('workflowCancelled', { executionId, reason });
    }
    async shutdown() {
        this.workflows.clear();
        this.executions.clear();
        this.integrations.clear();
        this.emit('shutdown');
    }
}
exports.CapacityAlertWorkflowManager = CapacityAlertWorkflowManager;
class WorkflowStepExecutor {
    integrations;
    constructor(integrations) {
        this.integrations = integrations;
    }
    async execute(step, context) {
        switch (step.type) {
            case WorkflowStepType.NOTIFICATION:
                return this.executeNotification(step, context);
            case WorkflowStepType.AUTO_SCALING:
                return this.executeAutoScaling(step, context);
            case WorkflowStepType.API_CALL:
                return this.executeApiCall(step, context);
            case WorkflowStepType.TICKET_CREATION:
                return this.executeTicketCreation(step, context);
            case WorkflowStepType.REMEDIATION:
                return this.executeRemediation(step, context);
            case WorkflowStepType.WEBHOOK:
                return this.executeWebhook(step, context);
            default:
                throw new Error(`Unsupported step type: ${step.type}`);
        }
    }
    async executeNotification(step, context) {
        console.log(`Sending notification for alert ${context.alert.id} via ${step.configuration.channels}`);
        return { notificationsSent: step.configuration.channels.length };
    }
    async executeAutoScaling(step, context) {
        console.log(`Evaluating auto-scaling for resource ${context.resourceId}`);
        return { scalingRecommendation: 'scale_up', confidence: 0.8 };
    }
    async executeApiCall(step, context) {
        console.log(`Making API call to ${step.configuration.endpoint}`);
        return { status: 'success', data: { analysis: 'completed' } };
    }
    async executeTicketCreation(step, context) {
        console.log(`Creating ticket with severity ${step.configuration.severity}`);
        return { ticketId: 'INC-12345', status: 'created' };
    }
    async executeRemediation(step, context) {
        console.log(`Executing remediation of type ${step.configuration.type}`);
        return { remediationId: 'REM-67890', status: 'completed' };
    }
    async executeWebhook(step, context) {
        console.log(`Calling webhook ${step.configuration.url}`);
        return { status: 'success', responseCode: 200 };
    }
}
class ApprovalManager {
    async requestApproval(approval, execution, step) {
        console.log(`Requesting approval for step ${step.name} in execution ${execution.id}`);
    }
}
class Integration {
}
class SlackIntegration extends Integration {
    config;
    constructor(config) {
        super();
        this.config = config;
    }
    async send(message) {
        console.log('Sending Slack notification:', message);
    }
}
class EmailIntegration extends Integration {
    config;
    constructor(config) {
        super();
        this.config = config;
    }
    async send(message) {
        console.log('Sending email notification:', message);
    }
}
class PagerDutyIntegration extends Integration {
    config;
    constructor(config) {
        super();
        this.config = config;
    }
    async send(message) {
        console.log('Sending PagerDuty alert:', message);
    }
}
class JiraIntegration extends Integration {
    config;
    constructor(config) {
        super();
        this.config = config;
    }
    async send(message) {
        console.log('Creating Jira ticket:', message);
    }
}
class WebhookIntegration extends Integration {
    config;
    constructor(config) {
        super();
        this.config = config;
    }
    async send(message) {
        console.log('Sending webhook:', message);
    }
}

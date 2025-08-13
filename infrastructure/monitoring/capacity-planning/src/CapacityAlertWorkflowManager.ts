import { EventEmitter } from 'events';
import {
  CapacityAlert,
  AlertType,
  AlertSeverity,
  AlertStatus,
  AlertAction,
  AlertActionType,
  ScalingRecommendation,
  RecommendationType
} from './CapacityPlanningDataModel';

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

export enum WorkflowStepType {
  NOTIFICATION = 'notification',
  ESCALATION = 'escalation',
  AUTO_SCALING = 'auto_scaling',
  APPROVAL_REQUEST = 'approval_request',
  SCRIPT_EXECUTION = 'script_execution',
  API_CALL = 'api_call',
  WEBHOOK = 'webhook',
  TICKET_CREATION = 'ticket_creation',
  REMEDIATION = 'remediation'
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

export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING_APPROVAL = 'waiting_approval',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
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

export class CapacityAlertWorkflowManager extends EventEmitter {
  private workflows: Map<string, WorkflowTemplate> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private integrations: Map<string, Integration> = new Map();
  private config: WorkflowConfig;
  private stepExecutor: WorkflowStepExecutor;
  private approvalManager: ApprovalManager;

  constructor(config: WorkflowConfig) {
    super();
    this.config = config;
    this.stepExecutor = new WorkflowStepExecutor(config.integrations);
    this.approvalManager = new ApprovalManager();
    this.initializeDefaultWorkflows();
    this.initializeIntegrations();
  }

  async processAlert(alert: CapacityAlert): Promise<WorkflowExecution[]> {
    const executions: WorkflowExecution[] = [];
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
      } catch (error) {
        this.emit('workflowStartFailed', { 
          workflowId: workflow.id, 
          alertId: alert.id, 
          error: error.message 
        });
      }
    }

    return executions;
  }

  async executeWorkflow(workflow: WorkflowTemplate, alert: CapacityAlert): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
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
    } catch (error) {
      execution.status = WorkflowExecutionStatus.FAILED;
      this.emit('workflowFailed', { executionId, error: error.message });
    }

    return execution;
  }

  private async processWorkflowSteps(execution: WorkflowExecution, workflow: WorkflowTemplate): Promise<void> {
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      execution.currentStep = i;

      if (!this.canExecuteStep(step, execution)) {
        continue;
      }

      const stepExecution: WorkflowStepExecution = {
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

      } catch (error) {
        stepExecution.error = error.message;
        stepExecution.status = WorkflowExecutionStatus.FAILED;
        stepExecution.completedAt = new Date();

        if (step.onFailure === 'stop') {
          execution.status = WorkflowExecutionStatus.FAILED;
          throw error;
        } else if (step.onFailure === 'retry' && stepExecution.retryCount < step.retryCount) {
          stepExecution.retryCount++;
          i--; // Retry current step
          continue;
        }

        this.emit('stepFailed', { 
          executionId: execution.id, 
          stepId: step.id, 
          error: error.message 
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

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const context = {
      alert: execution.context.alert,
      resourceId: execution.context.resourceId,
      executionId: execution.id,
      ...execution.context.customData
    };

    return await this.stepExecutor.execute(step, context);
  }

  private canExecuteStep(step: WorkflowStep, execution: WorkflowExecution): boolean {
    if (step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every(depId => {
      const dependentStep = execution.steps.find(s => s.stepId === depId);
      return dependentStep && dependentStep.status === WorkflowExecutionStatus.COMPLETED;
    });
  }

  private async requestApproval(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const approval: WorkflowApproval = {
      id: this.generateApprovalId(),
      stepId: step.id,
      requestedAt: new Date(),
      status: 'pending'
    };

    execution.approvals.push(approval);
    await this.approvalManager.requestApproval(approval, execution, step);
  }

  async approveWorkflowStep(
    executionId: string, 
    approvalId: string, 
    userId: string, 
    comments?: string
  ): Promise<void> {
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

  async rejectWorkflowStep(
    executionId: string, 
    approvalId: string, 
    userId: string, 
    comments?: string
  ): Promise<void> {
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

  async createWorkflowTemplate(template: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const workflowTemplate: WorkflowTemplate = {
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

  async scheduleWorkflowMaintenance(
    workflowId: string,
    maintenanceWindow: { start: Date; end: Date }
  ): Promise<void> {
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

  async getWorkflowMetrics(workflowId?: string): Promise<WorkflowMetrics> {
    const executions = workflowId 
      ? Array.from(this.executions.values()).filter(e => e.workflowId === workflowId)
      : Array.from(this.executions.values());

    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED);
    const successRate = totalExecutions > 0 ? completedExecutions.length / totalExecutions : 0;

    const executionTimes = completedExecutions
      .filter(e => e.completedAt)
      .map(e => e.completedAt!.getTime() - e.startedAt.getTime());
    
    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
      : 0;

    const escalatedExecutions = executions.filter(e => 
      e.steps.some(s => s.stepId.includes('escalation'))
    );
    const escalationRate = totalExecutions > 0 ? escalatedExecutions.length / totalExecutions : 0;

    const autoRemediatedExecutions = executions.filter(e => 
      e.steps.some(s => s.stepId.includes('remediation') && s.status === WorkflowExecutionStatus.COMPLETED)
    );
    const autoRemediationRate = totalExecutions > 0 ? autoRemediatedExecutions.length / totalExecutions : 0;

    const manualInterventionExecutions = executions.filter(e => 
      e.approvals.length > 0 || e.status === WorkflowExecutionStatus.WAITING_APPROVAL
    );
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

  private findMatchingWorkflows(alert: CapacityAlert): WorkflowTemplate[] {
    return Array.from(this.workflows.values()).filter(workflow => 
      workflow.triggerConditions.some(condition => this.matchesTriggerCondition(condition, alert))
    );
  }

  private matchesTriggerCondition(condition: TriggerCondition, alert: CapacityAlert): boolean {
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

  private initializeDefaultWorkflows(): void {
    const defaultWorkflows = [
      {
        name: 'Critical Alert Response',
        triggerConditions: [{
          alertType: AlertType.THRESHOLD_BREACH,
          severity: AlertSeverity.CRITICAL
        }],
        steps: [
          {
            id: 'immediate_notification',
            name: 'Send Immediate Notification',
            type: WorkflowStepType.NOTIFICATION,
            configuration: { channels: ['slack', 'email'], priority: 'urgent' },
            timeout: 30000,
            retryCount: 3,
            onFailure: 'continue' as const,
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
            onFailure: 'continue' as const,
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
            onFailure: 'retry' as const,
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
          alertType: AlertType.COST_SPIKE,
          severity: AlertSeverity.MEDIUM
        }],
        steps: [
          {
            id: 'cost_analysis',
            name: 'Perform Cost Analysis',
            type: WorkflowStepType.API_CALL,
            configuration: { endpoint: '/api/cost-optimization/analyze' },
            timeout: 300000,
            retryCount: 2,
            onFailure: 'stop' as const,
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
            onFailure: 'continue' as const,
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

  private initializeIntegrations(): void {
    for (const integrationConfig of this.config.integrations) {
      if (integrationConfig.isActive) {
        const integration = this.createIntegration(integrationConfig);
        this.integrations.set(integrationConfig.type, integration);
      }
    }
  }

  private createIntegration(config: IntegrationConfig): Integration {
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

  private async validateWorkflowTemplate(template: WorkflowTemplate): Promise<void> {
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

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateApprovalId(): string {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getExecution(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null;
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  getWorkflowTemplate(workflowId: string): WorkflowTemplate | null {
    return this.workflows.get(workflowId) || null;
  }

  getAllWorkflowTemplates(): WorkflowTemplate[] {
    return Array.from(this.workflows.values());
  }

  async cancelExecution(executionId: string, reason: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = WorkflowExecutionStatus.CANCELLED;
    execution.completedAt = new Date();
    
    this.emit('workflowCancelled', { executionId, reason });
  }

  async shutdown(): Promise<void> {
    this.workflows.clear();
    this.executions.clear();
    this.integrations.clear();
    
    this.emit('shutdown');
  }
}

class WorkflowStepExecutor {
  private integrations: IntegrationConfig[];

  constructor(integrations: IntegrationConfig[]) {
    this.integrations = integrations;
  }

  async execute(step: WorkflowStep, context: any): Promise<any> {
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

  private async executeNotification(step: WorkflowStep, context: any): Promise<any> {
    console.log(`Sending notification for alert ${context.alert.id} via ${step.configuration.channels}`);
    return { notificationsSent: step.configuration.channels.length };
  }

  private async executeAutoScaling(step: WorkflowStep, context: any): Promise<any> {
    console.log(`Evaluating auto-scaling for resource ${context.resourceId}`);
    return { scalingRecommendation: 'scale_up', confidence: 0.8 };
  }

  private async executeApiCall(step: WorkflowStep, context: any): Promise<any> {
    console.log(`Making API call to ${step.configuration.endpoint}`);
    return { status: 'success', data: { analysis: 'completed' } };
  }

  private async executeTicketCreation(step: WorkflowStep, context: any): Promise<any> {
    console.log(`Creating ticket with severity ${step.configuration.severity}`);
    return { ticketId: 'INC-12345', status: 'created' };
  }

  private async executeRemediation(step: WorkflowStep, context: any): Promise<any> {
    console.log(`Executing remediation of type ${step.configuration.type}`);
    return { remediationId: 'REM-67890', status: 'completed' };
  }

  private async executeWebhook(step: WorkflowStep, context: any): Promise<any> {
    console.log(`Calling webhook ${step.configuration.url}`);
    return { status: 'success', responseCode: 200 };
  }
}

class ApprovalManager {
  async requestApproval(approval: WorkflowApproval, execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    console.log(`Requesting approval for step ${step.name} in execution ${execution.id}`);
  }
}

abstract class Integration {
  abstract send(message: any): Promise<void>;
}

class SlackIntegration extends Integration {
  private config: Record<string, any>;

  constructor(config: Record<string, any>) {
    super();
    this.config = config;
  }

  async send(message: any): Promise<void> {
    console.log('Sending Slack notification:', message);
  }
}

class EmailIntegration extends Integration {
  private config: Record<string, any>;

  constructor(config: Record<string, any>) {
    super();
    this.config = config;
  }

  async send(message: any): Promise<void> {
    console.log('Sending email notification:', message);
  }
}

class PagerDutyIntegration extends Integration {
  private config: Record<string, any>;

  constructor(config: Record<string, any>) {
    super();
    this.config = config;
  }

  async send(message: any): Promise<void> {
    console.log('Sending PagerDuty alert:', message);
  }
}

class JiraIntegration extends Integration {
  private config: Record<string, any>;

  constructor(config: Record<string, any>) {
    super();
    this.config = config;
  }

  async send(message: any): Promise<void> {
    console.log('Creating Jira ticket:', message);
  }
}

class WebhookIntegration extends Integration {
  private config: Record<string, any>;

  constructor(config: Record<string, any>) {
    super();
    this.config = config;
  }

  async send(message: any): Promise<void> {
    console.log('Sending webhook:', message);
  }
}
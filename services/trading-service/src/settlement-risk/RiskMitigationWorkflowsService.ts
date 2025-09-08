import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface MitigationWorkflow {
  id: string;
  name: string;
  description: string;
  triggerConditions: TriggerCondition[];
  workflowSteps: WorkflowStep[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'PREVENTIVE' | 'REACTIVE' | 'RECOVERY';
  automationLevel: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
  estimatedDuration: number; // minutes
  successRate: number; // 0-1
  costEstimate: number; // USD
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerCondition {
  id: string;
  conditionType: 'RISK_SCORE' | 'FAILURE_PROBABILITY' | 'DELAY_DETECTED' | 'COUNTERPARTY_ISSUE' | 
                 'LIQUIDITY_RISK' | 'SYSTEM_FAILURE' | 'MANUAL_TRIGGER' | 'PATTERN_DETECTED';
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'CONTAINS' | 'EXISTS';
  threshold: any;
  weight: number; // 0-1
  description: string;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  stepName: string;
  stepType: 'NOTIFICATION' | 'APPROVAL' | 'ACTION' | 'VERIFICATION' | 'ESCALATION' | 'DOCUMENTATION';
  description: string;
  automationLevel: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
  estimatedDuration: number; // minutes
  assignedRole: string;
  dependencies: string[]; // IDs of prerequisite steps
  parameters: { [key: string]: any };
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
  totalDuration?: number; // minutes
  actualCost?: number;
  effectiveness?: number; // 0-1
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
  duration?: number; // minutes
  retryCount: number;
  result?: any;
  notes?: string;
  approver?: string;
  approvalTime?: Date;
}

export interface MitigationAction {
  id: string;
  actionType: 'COMMUNICATION' | 'SYSTEM_ADJUSTMENT' | 'PROCESS_CHANGE' | 'ESCALATION' | 
              'INSURANCE_CLAIM' | 'ALTERNATIVE_SETTLEMENT' | 'DOCUMENTATION' | 'MONITORING';
  name: string;
  description: string;
  parameters: { [key: string]: any };
  estimatedEffectiveness: number; // 0-1
  implementationCost: 'LOW' | 'MEDIUM' | 'HIGH';
  timeToImplement: number; // minutes
  requiredApprovals: string[];
  isReversible: boolean;
  sideEffects: string[];
}

export interface EscalationRule {
  id: string;
  ruleName: string;
  conditions: EscalationCondition[];
  escalationPath: EscalationLevel[];
  timeouts: number[]; // minutes for each level
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

export class RiskMitigationWorkflowsService extends EventEmitter {
  private workflows: Map<string, MitigationWorkflow>;
  private workflowExecutions: Map<string, WorkflowExecution>;
  private mitigationActions: Map<string, MitigationAction>;
  private escalationRules: Map<string, EscalationRule>;
  private workflowTemplates: Map<string, WorkflowTemplate>;
  private activeExecutions: Map<string, WorkflowExecution>;

  constructor() {
    super();
    this.workflows = new Map();
    this.workflowExecutions = new Map();
    this.mitigationActions = new Map();
    this.escalationRules = new Map();
    this.workflowTemplates = new Map();
    this.activeExecutions = new Map();

    this.initializeDefaultWorkflows();
    this.initializeDefaultActions();
    this.initializeDefaultEscalationRules();
    this.startMonitoringTimer();
  }

  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: MitigationWorkflow[] = [
      {
        id: uuidv4(),
        name: 'High Risk Settlement Intervention',
        description: 'Comprehensive workflow for high-risk settlement scenarios',
        triggerConditions: [
          {
            id: uuidv4(),
            conditionType: 'FAILURE_PROBABILITY',
            operator: 'GREATER_THAN',
            threshold: 0.7,
            weight: 0.8,
            description: 'Settlement failure probability exceeds 70%'
          },
          {
            id: uuidv4(),
            conditionType: 'RISK_SCORE',
            operator: 'GREATER_THAN',
            threshold: 0.8,
            weight: 0.6,
            description: 'Overall risk score exceeds 80%'
          }
        ],
        workflowSteps: [
          {
            id: uuidv4(),
            stepNumber: 1,
            stepName: 'Risk Assessment Review',
            stepType: 'VERIFICATION',
            description: 'Verify and validate risk assessment results',
            automationLevel: 'SEMI_AUTOMATED',
            estimatedDuration: 15,
            assignedRole: 'risk_analyst',
            dependencies: [],
            parameters: { reviewRequired: true },
            onSuccess: 'CONTINUE',
            onFailure: 'ESCALATE',
            maxRetries: 2,
            isRequired: true
          },
          {
            id: uuidv4(),
            stepNumber: 2,
            stepName: 'Counterparty Communication',
            stepType: 'NOTIFICATION',
            description: 'Proactive communication with counterparty',
            automationLevel: 'SEMI_AUTOMATED',
            estimatedDuration: 30,
            assignedRole: 'operations_manager',
            dependencies: ['1'],
            parameters: { urgency: 'high', requireResponse: true },
            onSuccess: 'CONTINUE',
            onFailure: 'CONTINUE',
            maxRetries: 3,
            isRequired: true
          },
          {
            id: uuidv4(),
            stepNumber: 3,
            stepName: 'Management Approval',
            stepType: 'APPROVAL',
            description: 'Obtain management approval for mitigation actions',
            automationLevel: 'MANUAL',
            estimatedDuration: 60,
            assignedRole: 'senior_manager',
            dependencies: ['2'],
            parameters: { approvalLevel: 'senior' },
            onSuccess: 'CONTINUE',
            onFailure: 'ABORT',
            maxRetries: 1,
            isRequired: true
          },
          {
            id: uuidv4(),
            stepNumber: 4,
            stepName: 'Enhanced Monitoring',
            stepType: 'ACTION',
            description: 'Activate enhanced monitoring and alerts',
            automationLevel: 'FULLY_AUTOMATED',
            estimatedDuration: 5,
            assignedRole: 'system',
            dependencies: ['3'],
            parameters: { monitoringLevel: 'enhanced', alertFrequency: 'hourly' },
            onSuccess: 'CONTINUE',
            onFailure: 'ESCALATE',
            maxRetries: 2,
            isRequired: true
          }
        ],
        priority: 'HIGH',
        category: 'PREVENTIVE',
        automationLevel: 'SEMI_AUTOMATED',
        estimatedDuration: 110,
        successRate: 0.85,
        costEstimate: 500,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Settlement Failure Response',
        description: 'Reactive workflow when settlement failure occurs',
        triggerConditions: [
          {
            id: uuidv4(),
            conditionType: 'SYSTEM_FAILURE',
            operator: 'EXISTS',
            threshold: true,
            weight: 1.0,
            description: 'Settlement failure has been detected'
          }
        ],
        workflowSteps: [
          {
            id: uuidv4(),
            stepNumber: 1,
            stepName: 'Immediate Notification',
            stepType: 'NOTIFICATION',
            description: 'Immediate notification to relevant parties',
            automationLevel: 'FULLY_AUTOMATED',
            estimatedDuration: 2,
            assignedRole: 'system',
            dependencies: [],
            parameters: { priority: 'critical', channels: ['email', 'sms', 'slack'] },
            onSuccess: 'CONTINUE',
            onFailure: 'CONTINUE',
            maxRetries: 3,
            isRequired: true
          },
          {
            id: uuidv4(),
            stepNumber: 2,
            stepName: 'Failure Analysis',
            stepType: 'VERIFICATION',
            description: 'Analyze root cause of settlement failure',
            automationLevel: 'SEMI_AUTOMATED',
            estimatedDuration: 30,
            assignedRole: 'operations_analyst',
            dependencies: ['1'],
            parameters: { analysisDepth: 'comprehensive' },
            onSuccess: 'CONTINUE',
            onFailure: 'ESCALATE',
            maxRetries: 2,
            isRequired: true
          },
          {
            id: uuidv4(),
            stepNumber: 3,
            stepName: 'Recovery Action Plan',
            stepType: 'ACTION',
            description: 'Execute recovery action plan',
            automationLevel: 'MANUAL',
            estimatedDuration: 120,
            assignedRole: 'senior_operations',
            dependencies: ['2'],
            parameters: { recoveryType: 'standard' },
            onSuccess: 'CONTINUE',
            onFailure: 'ESCALATE',
            maxRetries: 1,
            isRequired: true
          },
          {
            id: uuidv4(),
            stepNumber: 4,
            stepName: 'Client Communication',
            stepType: 'NOTIFICATION',
            description: 'Communicate status to affected clients',
            automationLevel: 'MANUAL',
            estimatedDuration: 45,
            assignedRole: 'client_relations',
            dependencies: ['3'],
            parameters: { communicationType: 'formal' },
            onSuccess: 'CONTINUE',
            onFailure: 'CONTINUE',
            maxRetries: 2,
            isRequired: true
          }
        ],
        priority: 'CRITICAL',
        category: 'REACTIVE',
        automationLevel: 'SEMI_AUTOMATED',
        estimatedDuration: 197,
        successRate: 0.78,
        costEstimate: 1200,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  private initializeDefaultActions(): void {
    const defaultActions: MitigationAction[] = [
      {
        id: uuidv4(),
        actionType: 'COMMUNICATION',
        name: 'Proactive Counterparty Outreach',
        description: 'Contact counterparty to confirm settlement readiness',
        parameters: {
          method: 'phone_and_email',
          urgency: 'high',
          requireConfirmation: true,
          escalationTime: 4 // hours
        },
        estimatedEffectiveness: 0.7,
        implementationCost: 'LOW',
        timeToImplement: 30,
        requiredApprovals: [],
        isReversible: false,
        sideEffects: ['May alert counterparty to internal concerns']
      },
      {
        id: uuidv4(),
        actionType: 'SYSTEM_ADJUSTMENT',
        name: 'Enhanced Monitoring Activation',
        description: 'Activate real-time monitoring with increased alert frequency',
        parameters: {
          monitoringLevel: 'intensive',
          alertInterval: 15, // minutes
          dashboardUpdate: 'real_time',
          stakeholderNotification: true
        },
        estimatedEffectiveness: 0.6,
        implementationCost: 'LOW',
        timeToImplement: 5,
        requiredApprovals: [],
        isReversible: true,
        sideEffects: ['Increased system load', 'Higher operational costs']
      },
      {
        id: uuidv4(),
        actionType: 'ALTERNATIVE_SETTLEMENT',
        name: 'Backup Settlement Channel',
        description: 'Route settlement through alternative channel or custodian',
        parameters: {
          alternativeChannel: 'backup_custodian',
          approvalRequired: true,
          costIncrease: 0.02, // 2% additional cost
          timeDelay: 24 // hours
        },
        estimatedEffectiveness: 0.9,
        implementationCost: 'MEDIUM',
        timeToImplement: 120,
        requiredApprovals: ['operations_manager', 'risk_manager'],
        isReversible: false,
        sideEffects: ['Additional fees', 'Potential delay']
      },
      {
        id: uuidv4(),
        actionType: 'INSURANCE_CLAIM',
        name: 'Settlement Insurance Claim',
        description: 'Initiate insurance claim for settlement failure coverage',
        parameters: {
          claimType: 'settlement_failure',
          documentationRequired: true,
          expectedProcessingTime: 72, // hours
          coveragePercentage: 0.8
        },
        estimatedEffectiveness: 0.8,
        implementationCost: 'HIGH',
        timeToImplement: 240,
        requiredApprovals: ['senior_manager', 'legal_team'],
        isReversible: false,
        sideEffects: ['Premium increase', 'Regulatory notification']
      }
    ];

    defaultActions.forEach(action => {
      this.mitigationActions.set(action.id, action);
    });
  }

  private initializeDefaultEscalationRules(): void {
    const defaultRules: EscalationRule[] = [
      {
        id: uuidv4(),
        ruleName: 'High Risk Settlement Escalation',
        conditions: [
          { field: 'riskScore', operator: 'GREATER_THAN', value: 0.8, weight: 0.7 },
          { field: 'notionalAmount', operator: 'GREATER_THAN', value: 10000000, weight: 0.3 }
        ],
        escalationPath: [
          {
            level: 1,
            roles: ['operations_manager'],
            requiresAcknowledgment: true,
            canApprove: true,
            canAbort: false
          },
          {
            level: 2,
            roles: ['risk_manager', 'senior_operations'],
            requiresAcknowledgment: true,
            canApprove: true,
            canAbort: true
          },
          {
            level: 3,
            roles: ['head_of_risk', 'coo'],
            requiresAcknowledgment: true,
            canApprove: true,
            canAbort: true
          }
        ],
        timeouts: [30, 60, 120], // minutes
        notificationMethods: ['EMAIL', 'SMS', 'SLACK'],
        isActive: true
      },
      {
        id: uuidv4(),
        ruleName: 'Settlement Failure Emergency Escalation',
        conditions: [
          { field: 'settlementStatus', operator: 'EQUALS', value: 'FAILED', weight: 1.0 }
        ],
        escalationPath: [
          {
            level: 1,
            roles: ['operations_manager', 'risk_manager'],
            requiresAcknowledgment: true,
            canApprove: false,
            canAbort: false
          },
          {
            level: 2,
            roles: ['senior_operations', 'head_of_risk'],
            requiresAcknowledgment: true,
            canApprove: true,
            canAbort: false
          },
          {
            level: 3,
            roles: ['coo', 'ceo'],
            requiresAcknowledgment: true,
            canApprove: true,
            canAbort: true
          }
        ],
        timeouts: [15, 30, 60], // minutes - faster escalation for failures
        notificationMethods: ['EMAIL', 'SMS', 'PHONE', 'PAGER'],
        isActive: true
      }
    ];

    defaultRules.forEach(rule => {
      this.escalationRules.set(rule.id, rule);
    });
  }

  private startMonitoringTimer(): void {
    // Monitor workflow executions every 5 minutes
    setInterval(() => {
      this.monitorActiveWorkflows();
    }, 5 * 60 * 1000);
  }

  private monitorActiveWorkflows(): void {
    const now = new Date();
    
    this.activeExecutions.forEach((execution, executionId) => {
      if (execution.status === 'IN_PROGRESS') {
        const currentStep = execution.workflowSteps?.[execution.currentStep - 1];
        const currentStepExecution = execution.completedSteps.find(s => s.stepNumber === execution.currentStep);
        
        if (currentStep && currentStepExecution && currentStepExecution.status === 'IN_PROGRESS') {
          const elapsed = (now.getTime() - currentStepExecution.startTime.getTime()) / (60 * 1000);
          const expectedDuration = currentStep.estimatedDuration;
          
          // Check for timeout
          if (elapsed > expectedDuration * 1.5) { // 50% buffer
            this.handleStepTimeout(execution, currentStepExecution);
          }
        }
      }
    });
  }

  private handleStepTimeout(execution: WorkflowExecution, stepExecution: StepExecution): void {
    this.emit('stepTimeout', {
      executionId: execution.executionId,
      stepId: stepExecution.stepId,
      elapsed: (Date.now() - stepExecution.startTime.getTime()) / (60 * 1000)
    });

    // Auto-escalate if configured
    const workflow = this.workflows.get(execution.workflowId);
    if (workflow) {
      const step = workflow.workflowSteps.find(s => s.id === stepExecution.stepId);
      if (step?.onFailure === 'ESCALATE') {
        this.escalateWorkflow(execution.executionId, 'Step timeout exceeded');
      }
    }
  }

  public async triggerWorkflow(
    instructionId: string,
    triggerData: any,
    triggeredBy: string,
    manualWorkflowId?: string
  ): Promise<WorkflowExecution> {
    try {
      let applicableWorkflow: MitigationWorkflow | undefined;

      if (manualWorkflowId) {
        applicableWorkflow = this.workflows.get(manualWorkflowId);
        if (!applicableWorkflow) {
          throw new Error(`Workflow not found: ${manualWorkflowId}`);
        }
      } else {
        // Find applicable workflow based on trigger conditions
        applicableWorkflow = this.findApplicableWorkflow(triggerData);
        if (!applicableWorkflow) {
          throw new Error('No applicable workflow found for the given conditions');
        }
      }

      const execution: WorkflowExecution = {
        executionId: uuidv4(),
        workflowId: applicableWorkflow.id,
        instructionId,
        triggeredBy,
        triggerReason: this.buildTriggerReason(triggerData, applicableWorkflow),
        status: 'INITIATED',
        currentStep: 1,
        completedSteps: [],
        startTime: new Date()
      };

      this.workflowExecutions.set(execution.executionId, execution);
      this.activeExecutions.set(execution.executionId, execution);

      this.emit('workflowTriggered', execution);

      // Start executing the workflow
      await this.executeNextStep(execution.executionId);

      return execution;

    } catch (error: any) {
      this.emit('workflowTriggerError', { instructionId, error: error instanceof Error ? error.message : 'Unknown error', triggeredBy });
      throw error;
    }
  }

  private findApplicableWorkflow(triggerData: any): MitigationWorkflow | undefined {
    let bestMatch: { workflow: MitigationWorkflow; score: number } | null = null;

    for (const workflow of this.workflows.values()) {
      if (!workflow.isActive) continue;

      const score = this.calculateTriggerScore(workflow.triggerConditions, triggerData);
      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { workflow, score };
      }
    }

    return bestMatch?.workflow;
  }

  private calculateTriggerScore(conditions: TriggerCondition[], triggerData: any): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const condition of conditions) {
      const conditionMet = this.evaluateTriggerCondition(condition, triggerData);
      if (conditionMet) {
        totalScore += condition.weight;
      }
      totalWeight += condition.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private evaluateTriggerCondition(condition: TriggerCondition, triggerData: any): boolean {
    const fieldValue = this.extractFieldValue(condition.conditionType, triggerData);
    
    switch (condition.operator) {
      case 'GREATER_THAN':
        return fieldValue > condition.threshold;
      case 'LESS_THAN':
        return fieldValue < condition.threshold;
      case 'EQUALS':
        return fieldValue === condition.threshold;
      case 'CONTAINS':
        return Array.isArray(fieldValue) && fieldValue.includes(condition.threshold);
      case 'EXISTS':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private extractFieldValue(conditionType: TriggerCondition['conditionType'], triggerData: any): any {
    switch (conditionType) {
      case 'RISK_SCORE':
        return triggerData.riskScore || triggerData.compositeRisk;
      case 'FAILURE_PROBABILITY':
        return triggerData.failureProbability;
      case 'DELAY_DETECTED':
        return triggerData.delayDetected || triggerData.isDelayed;
      case 'COUNTERPARTY_ISSUE':
        return triggerData.counterpartyIssue;
      case 'LIQUIDITY_RISK':
        return triggerData.liquidityRisk;
      case 'SYSTEM_FAILURE':
        return triggerData.systemFailure || triggerData.settlementFailed;
      default:
        return triggerData[conditionType];
    }
  }

  private buildTriggerReason(triggerData: any, workflow: MitigationWorkflow): string {
    let reasons: string[] = [];

    for (const condition of workflow.triggerConditions) {
      if (this.evaluateTriggerCondition(condition, triggerData)) {
        reasons.push(condition.description);
      }
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Manual trigger';
  }

  private async executeNextStep(executionId: string): Promise<any> {
    const execution = this.workflowExecutions.get(executionId);
    if (!execution) return;

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return;

    if (execution.currentStep > workflow.workflowSteps.length) {
      // Workflow completed
      await this.completeWorkflow(executionId);
      return;
    }

    const currentStep = workflow.workflowSteps.find(s => s.stepNumber === execution.currentStep);
    if (!currentStep) return;

    // Check dependencies
    const dependenciesMet = this.checkStepDependencies(currentStep, execution);
    if (!dependenciesMet) {
      // Skip step or wait for dependencies
      execution.currentStep++;
      await this.executeNextStep(executionId);
      return;
    }

    // Create step execution
    const stepExecution: StepExecution = {
      stepId: currentStep.id,
      executionId,
      stepNumber: currentStep.stepNumber,
      status: 'IN_PROGRESS',
      startTime: new Date(),
      retryCount: 0
    };

    execution.completedSteps.push(stepExecution);
    execution.status = 'IN_PROGRESS';

    this.emit('stepStarted', { executionId, stepExecution });

    try {
      const stepResult = await this.executeStep(currentStep, execution, stepExecution);
      
      stepExecution.status = 'COMPLETED';
      stepExecution.endTime = new Date();
      stepExecution.duration = (stepExecution.endTime.getTime() - stepExecution.startTime.getTime()) / (60 * 1000);
      stepExecution.result = stepResult;

      this.emit('stepCompleted', { executionId, stepExecution, result: stepResult });

      // Move to next step based on success action
      if (currentStep.onSuccess === 'CONTINUE') {
        execution.currentStep++;
        await this.executeNextStep(executionId);
      } else if (currentStep.onSuccess === 'COMPLETE') {
        await this.completeWorkflow(executionId);
      }

    } catch (error: any) {
      stepExecution.status = 'FAILED';
      stepExecution.endTime = new Date();
      stepExecution.duration = (stepExecution.endTime.getTime() - stepExecution.startTime.getTime()) / (60 * 1000);
      stepExecution.notes = error instanceof Error ? error.message : 'Unknown error';

      this.emit('stepFailed', { executionId, stepExecution, error: error instanceof Error ? error.message : 'Unknown error' });

      await this.handleStepFailure(currentStep, execution, stepExecution, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private checkStepDependencies(step: WorkflowStep, execution: WorkflowExecution): boolean {
    if (!step.dependencies || step.dependencies.length === 0) return true;

    for (const depId of step.dependencies) {
      const depStep = execution.completedSteps.find(s => s.stepId === depId);
      if (!depStep || depStep.status !== 'COMPLETED') {
        return false;
      }
    }

    return true;
  }

  private async executeStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution
  ): Promise<any> {
    switch (step.stepType) {
      case 'NOTIFICATION':
        return await this.executeNotificationStep(step, execution, stepExecution);
      case 'APPROVAL':
        return await this.executeApprovalStep(step, execution, stepExecution);
      case 'ACTION':
        return await this.executeActionStep(step, execution, stepExecution);
      case 'VERIFICATION':
        return await this.executeVerificationStep(step, execution, stepExecution);
      case 'ESCALATION':
        return await this.executeEscalationStep(step, execution, stepExecution);
      case 'DOCUMENTATION':
        return await this.executeDocumentationStep(step, execution, stepExecution);
      default:
        throw new Error(`Unknown step type: ${step.stepType}`);
    }
  }

  private async executeNotificationStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution
  ): Promise<any> {
    const params = step.parameters;
    
    // Mock notification implementation
    const notification = {
      recipients: this.getRecipientsForRole(step.assignedRole),
      subject: `Settlement Risk Workflow: ${step.stepName}`,
      message: step.description,
      priority: params.urgency || 'medium',
      channels: params.channels || ['email'],
      instructionId: execution.instructionId
    };

    // Simulate sending notification
    await this.delay(params.estimatedDelay || 2000);

    this.emit('notificationSent', { executionId: execution.executionId, notification });

    return { notificationId: uuidv4(), sentAt: new Date(), recipients: notification.recipients.length };
  }

  private async executeApprovalStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution
  ): Promise<any> {
    const params = step.parameters;
    
    // For automated execution, simulate approval based on risk level
    if (step.automationLevel === 'FULLY_AUTOMATED') {
      const autoApprove = Math.random() > 0.1; // 90% auto-approval rate
      
      if (autoApprove) {
        stepExecution.approver = 'system';
        stepExecution.approvalTime = new Date();
        return { approved: true, approver: 'system', timestamp: new Date() };
      } else {
        throw new Error('Automatic approval criteria not met');
      }
    }

    // For manual approvals, create approval request
    const approvalRequest = {
      requestId: uuidv4(),
      workflowId: execution.workflowId,
      executionId: execution.executionId,
      stepId: step.id,
      requiredRole: step.assignedRole,
      approvalLevel: params.approvalLevel,
      timeout: params.timeoutMinutes || 60,
      createdAt: new Date()
    };

    this.emit('approvalRequested', approvalRequest);

    // For demo purposes, simulate approval after delay
    await this.delay(30000); // 30 seconds

    const approved = Math.random() > 0.2; // 80% approval rate
    
    if (approved) {
      stepExecution.approver = 'demo_approver';
      stepExecution.approvalTime = new Date();
      return { approved: true, approver: 'demo_approver', timestamp: new Date() };
    } else {
      throw new Error('Approval request denied');
    }
  }

  private async executeActionStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution
  ): Promise<any> {
    const params = step.parameters;
    
    // Find and execute the appropriate mitigation action
    const actionType = params.actionType || 'SYSTEM_ADJUSTMENT';
    const applicableActions = Array.from(this.mitigationActions.values())
      .filter(action => action.actionType === actionType);

    if (applicableActions.length === 0) {
      throw new Error(`No applicable actions found for type: ${actionType}`);
    }

    const selectedAction = applicableActions[0]; // Select first applicable action
    
    // Execute the action
    const actionResult = await this.executeMitigationAction(selectedAction, execution, params);
    
    return {
      actionId: selectedAction.id,
      actionName: selectedAction.name,
      result: actionResult,
      executedAt: new Date()
    };
  }

  private async executeVerificationStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution
  ): Promise<any> {
    const params = step.parameters;
    
    // Mock verification logic
    await this.delay(step.estimatedDuration * 1000);
    
    const verificationPassed = Math.random() > 0.1; // 90% pass rate
    
    if (!verificationPassed) {
      throw new Error('Verification failed - criteria not met');
    }

    return {
      verified: true,
      verificationScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
      verifiedAt: new Date(),
      verifier: stepExecution.assignedTo || 'system'
    };
  }

  private async executeEscalationStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution
  ): Promise<any> {
    const escalationRuleId = step.parameters.escalationRuleId;
    const escalationRule = this.escalationRules.get(escalationRuleId);
    
    if (!escalationRule) {
      throw new Error(`Escalation rule not found: ${escalationRuleId}`);
    }

    return await this.executeEscalation(escalationRule, execution);
  }

  private async executeDocumentationStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution
  ): Promise<any> {
    const documentation = {
      documentId: uuidv4(),
      workflowId: execution.workflowId,
      executionId: execution.executionId,
      instructionId: execution.instructionId,
      documentType: step.parameters.documentType || 'workflow_log',
      createdAt: new Date(),
      content: {
        summary: `Workflow execution for instruction ${execution.instructionId}`,
        steps: execution.completedSteps.map(s => ({
          stepNumber: s.stepNumber,
          status: s.status,
          duration: s.duration,
          result: s.result
        }))
      }
    };

    this.emit('documentationCreated', documentation);

    return documentation;
  }

  private async executeMitigationAction(
    action: MitigationAction, 
    execution: WorkflowExecution, 
    parameters: any
  ): Promise<any> {
    // Simulate action execution based on type
    await this.delay(action.timeToImplement * 1000);

    switch (action.actionType) {
      case 'COMMUNICATION':
        return {
          contacted: true,
          method: parameters.method || 'email',
          responseReceived: Math.random() > 0.3,
          estimatedImpact: action.estimatedEffectiveness
        };

      case 'SYSTEM_ADJUSTMENT':
        return {
          adjustmentApplied: true,
          adjustmentType: parameters.adjustmentType || 'monitoring_enhancement',
          systemImpact: 'minimal',
          estimatedImpact: action.estimatedEffectiveness
        };

      case 'ALTERNATIVE_SETTLEMENT':
        return {
          alternativeRouteActivated: true,
          route: parameters.alternativeChannel || 'backup_custodian',
          additionalCost: action.parameters.costIncrease || 0.02,
          estimatedDelay: action.parameters.timeDelay || 24,
          estimatedImpact: action.estimatedEffectiveness
        };

      default:
        return {
          actionExecuted: true,
          estimatedImpact: action.estimatedEffectiveness
        };
    }
  }

  private async handleStepFailure(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    stepExecution: StepExecution, 
    errorMessage: string
  ): Promise<any> {
    switch (step.onFailure) {
      case 'RETRY':
        if (stepExecution.retryCount < step.maxRetries) {
          stepExecution.retryCount++;
          stepExecution.status = 'IN_PROGRESS';
          stepExecution.startTime = new Date();
          
          this.emit('stepRetry', { executionId: execution.executionId, stepExecution, retryCount: stepExecution.retryCount });
          
          // Retry the step
          setTimeout(() => {
            this.executeNextStep(execution.executionId);
          }, 5000); // 5 second delay before retry
        } else {
          await this.escalateWorkflow(execution.executionId, `Step failed after ${step.maxRetries} retries: ${errorMessage}`);
        }
        break;

      case 'ESCALATE':
        await this.escalateWorkflow(execution.executionId, `Step failure: ${errorMessage}`);
        break;

      case 'ABORT':
        execution.status = 'FAILED';
        execution.endTime = new Date();
        execution.notes = `Workflow aborted due to step failure: ${errorMessage}`;
        this.activeExecutions.delete(execution.executionId);
        this.emit('workflowAborted', execution);
        break;

      case 'CONTINUE':
        // Skip failed step and continue
        execution.currentStep++;
        await this.executeNextStep(execution.executionId);
        break;
    }
  }

  private async escalateWorkflow(executionId: string, reason: string): Promise<any> {
    const execution = this.workflowExecutions.get(executionId);
    if (!execution) return;

    // Find applicable escalation rule
    const escalationRule = Array.from(this.escalationRules.values()).find(rule => rule.isActive);
    
    if (escalationRule) {
      await this.executeEscalation(escalationRule, execution, reason);
    }

    this.emit('workflowEscalated', { executionId, reason });
  }

  private async executeEscalation(
    rule: EscalationRule, 
    execution: WorkflowExecution, 
    reason?: string
  ): Promise<any> {
    const escalationExecution = {
      escalationId: uuidv4(),
      ruleId: rule.id,
      executionId: execution.executionId,
      reason: reason || 'Escalation triggered',
      currentLevel: 1,
      startTime: new Date(),
      levelExecutions: [] as Array<{
        level: number;
        startTime: Date;
        recipients: string[];
        acknowledged: boolean;
        acknowledgedBy: string | null;
        acknowledgedAt: Date | null;
        resolved: boolean;
      }>
    };

    for (let level = 0; level < rule.escalationPath.length; level++) {
      const escalationLevel = rule.escalationPath[level];
      const timeout = rule.timeouts[level] || 60;

      const levelExecution = {
        level: escalationLevel.level,
        startTime: new Date(),
        recipients: this.getRecipientsForRoles(escalationLevel.roles),
        acknowledged: false,
        acknowledgedBy: null as string | null,
        acknowledgedAt: null as Date | null,
        resolved: false
      };

      escalationExecution.levelExecutions.push(levelExecution);

      // Send escalation notifications
      const escalationNotification = {
        escalationId: escalationExecution.escalationId,
        level: escalationLevel.level,
        recipients: levelExecution.recipients,
        subject: `ESCALATION Level ${escalationLevel.level}: Settlement Risk Workflow`,
        message: `Workflow execution ${execution.executionId} requires attention. Reason: ${escalationExecution.reason}`,
        timeout: timeout,
        channels: rule.notificationMethods
      };

      this.emit('escalationNotificationSent', escalationNotification);

      // For demo purposes, simulate acknowledgment
      await this.delay(Math.min(timeout * 1000 * 0.1, 10000)); // 10% of timeout or max 10 seconds

      const acknowledged = Math.random() > 0.2; // 80% acknowledgment rate
      
      if (acknowledged) {
        levelExecution.acknowledged = true;
        levelExecution.acknowledgedBy = levelExecution.recipients[0];
        levelExecution.acknowledgedAt = new Date();
        
        if (escalationLevel.canApprove && Math.random() > 0.3) { // 70% approval rate
          levelExecution.resolved = true;
          break; // Escalation resolved
        }
      }
    }

    this.emit('escalationCompleted', escalationExecution);
    return escalationExecution;
  }

  private async completeWorkflow(executionId: string): Promise<any> {
    const execution = this.workflowExecutions.get(executionId);
    if (!execution) return;

    execution.status = 'COMPLETED';
    execution.endTime = new Date();
    execution.totalDuration = (execution.endTime.getTime() - execution.startTime.getTime()) / (60 * 1000);

    // Calculate effectiveness
    const completedSteps = execution.completedSteps.filter(s => s.status === 'COMPLETED').length;
    const totalSteps = execution.completedSteps.length;
    execution.effectiveness = totalSteps > 0 ? completedSteps / totalSteps : 0;

    this.activeExecutions.delete(executionId);
    this.emit('workflowCompleted', execution);
  }

  // Helper methods
  private delay(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRecipientsForRole(role: string): string[] {
    // Mock implementation - would integrate with user management system
    const roleMapping: { [key: string]: string[] } = {
      'risk_analyst': ['risk.analyst@company.com'],
      'operations_manager': ['ops.manager@company.com'],
      'senior_manager': ['senior.manager@company.com'],
      'risk_manager': ['risk.manager@company.com'],
      'senior_operations': ['senior.ops@company.com'],
      'head_of_risk': ['head.risk@company.com'],
      'coo': ['coo@company.com'],
      'client_relations': ['client.relations@company.com'],
      'system': ['system@company.com']
    };

    return roleMapping[role] || [`${role}@company.com`];
  }

  private getRecipientsForRoles(roles: string[]): string[] {
    return roles.flatMap(role => this.getRecipientsForRole(role));
  }

  // Public management methods
  public createWorkflow(workflowData: Omit<MitigationWorkflow, 'id' | 'createdAt' | 'updatedAt'>): MitigationWorkflow {
    const workflow: MitigationWorkflow = {
      ...workflowData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(workflow.id, workflow);
    this.emit('workflowCreated', workflow);
    return workflow;
  }

  public updateWorkflow(workflowId: string, updates: Partial<MitigationWorkflow>): MitigationWorkflow | null {
    const existing = this.workflows.get(workflowId);
    if (!existing) return null;

    const updated: MitigationWorkflow = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.workflows.set(workflowId, updated);
    this.emit('workflowUpdated', updated);
    return updated;
  }

  public pauseWorkflowExecution(executionId: string, reason: string): boolean {
    const execution = this.workflowExecutions.get(executionId);
    if (execution && execution.status === 'IN_PROGRESS') {
      execution.status = 'PAUSED';
      execution.notes = reason;
      this.emit('workflowPaused', { executionId, reason });
      return true;
    }
    return false;
  }

  public resumeWorkflowExecution(executionId: string): boolean {
    const execution = this.workflowExecutions.get(executionId);
    if (execution && execution.status === 'PAUSED') {
      execution.status = 'IN_PROGRESS';
      this.activeExecutions.set(executionId, execution);
      this.emit('workflowResumed', { executionId });
      
      // Resume execution
      setTimeout(() => {
        this.executeNextStep(executionId);
      }, 1000);
      
      return true;
    }
    return false;
  }

  public cancelWorkflowExecution(executionId: string, reason: string): boolean {
    const execution = this.workflowExecutions.get(executionId);
    if (execution && ['IN_PROGRESS', 'PAUSED'].includes(execution.status)) {
      execution.status = 'CANCELLED';
      execution.endTime = new Date();
      execution.notes = reason;
      this.activeExecutions.delete(executionId);
      this.emit('workflowCancelled', { executionId, reason });
      return true;
    }
    return false;
  }

  // Getter methods
  public getWorkflow(workflowId: string): MitigationWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  public getAllWorkflows(): MitigationWorkflow[] {
    return Array.from(this.workflows.values());
  }

  public getActiveWorkflows(): MitigationWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.isActive);
  }

  public getWorkflowExecution(executionId: string): WorkflowExecution | undefined {
    return this.workflowExecutions.get(executionId);
  }

  public getInstructionWorkflows(instructionId: string): WorkflowExecution[] {
    return Array.from(this.workflowExecutions.values())
      .filter(execution => execution.instructionId === instructionId);
  }

  public getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  public getMitigationAction(actionId: string): MitigationAction | undefined {
    return this.mitigationActions.get(actionId);
  }

  public getAllMitigationActions(): MitigationAction[] {
    return Array.from(this.mitigationActions.values());
  }

  public generateWorkflowReport(timeFrame: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    mostUsedWorkflows: { workflowId: string; name: string; count: number }[];
    effectivenessMetrics: { workflowId: string; name: string; effectiveness: number }[];
  } {
    const cutoff = new Date();
    switch (timeFrame) {
      case 'DAILY':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'WEEKLY':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'MONTHLY':
        cutoff.setDate(cutoff.getDate() - 30);
        break;
    }

    const executions = Array.from(this.workflowExecutions.values())
      .filter(execution => execution.startTime >= cutoff);

    const successful = executions.filter(e => e.status === 'COMPLETED').length;
    const failed = executions.filter(e => e.status === 'FAILED').length;

    const totalDuration = executions
      .filter(e => e.totalDuration)
      .reduce((sum, e) => sum + e.totalDuration!, 0);
    const avgDuration = executions.length > 0 ? totalDuration / executions.length : 0;

    // Count workflow usage
    const workflowCounts = new Map<string, number>();
    executions.forEach(execution => {
      workflowCounts.set(execution.workflowId, (workflowCounts.get(execution.workflowId) || 0) + 1);
    });

    const mostUsedWorkflows = Array.from(workflowCounts.entries())
      .map(([workflowId, count]) => {
        const workflow = this.workflows.get(workflowId);
        return { workflowId, name: workflow?.name || 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate effectiveness
    const effectivenessMap = new Map<string, { total: number; effectiveness: number }>();
    executions.forEach(execution => {
      if (execution.effectiveness !== undefined) {
        const existing = effectivenessMap.get(execution.workflowId) || { total: 0, effectiveness: 0 };
        existing.total++;
        existing.effectiveness += execution.effectiveness;
        effectivenessMap.set(execution.workflowId, existing);
      }
    });

    const effectivenessMetrics = Array.from(effectivenessMap.entries())
      .map(([workflowId, data]) => {
        const workflow = this.workflows.get(workflowId);
        return {
          workflowId,
          name: workflow?.name || 'Unknown',
          effectiveness: data.total > 0 ? data.effectiveness / data.total : 0
        };
      })
      .sort((a, b) => b.effectiveness - a.effectiveness);

    return {
      totalExecutions: executions.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageExecutionTime: avgDuration,
      mostUsedWorkflows,
      effectivenessMetrics
    };
  }
}


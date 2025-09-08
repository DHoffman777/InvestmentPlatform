import { randomUUID } from 'crypto';
import { FormType, FilingStatus, RegulatoryJurisdiction, RegulatoryFiling, FilingCalendar } from '../../models/regulatory/Regulatory';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface FilingWorkflow {
  id: string;
  tenantId: string;
  workflowName: string;
  formType: FormType;
  jurisdiction: RegulatoryJurisdiction;
  
  // Workflow Configuration
  isActive: boolean;
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
  
  // Schedule Configuration
  schedule: {
    frequency: 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
    dueDate: {
      dayOfMonth?: number; // For monthly
      monthOfQuarter?: number; // 1, 2, or 3 for quarterly
      monthOfYear?: number; // 1-12 for annually
      daysAfterPeriodEnd: number;
    };
    reminderSchedule: Array<{
      daysBeforeDue: number;
      recipientRoles: string[];
      notificationMethod: 'email' | 'system' | 'both';
    }>;
  };
  
  // Workflow Steps
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
    estimatedDuration: number; // in hours
    dependencies: string[]; // stepIds that must complete first
  }>;
  
  // Approval Workflow
  approvalWorkflow: {
    enabled: boolean;
    approvers: Array<{
      role: string;
      sequence: number;
      required: boolean;
    }>;
    parallelApproval: boolean;
  };
  
  // Data Sources
  dataSources: Array<{
    sourceType: 'database' | 'api' | 'file' | 'manual_entry';
    sourceIdentifier: string;
    dataMapping: Record<string, string>;
    validationRules: string[];
  }>;
  
  // Quality Checks
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
  
  // Execution Status
  status: 'initiated' | 'in_progress' | 'review' | 'approved' | 'filed' | 'completed' | 'failed' | 'cancelled';
  currentStep: string;
  
  // Execution Timeline
  initiatedAt: Date;
  scheduledCompletionDate: Date;
  actualCompletionDate?: Date;
  
  // Step Status Tracking
  stepStatus: Map<string, {
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    assignedTo?: string;
    startedAt?: Date;
    completedAt?: Date;
    notes?: string;
    artifacts?: string[];
  }>;
  
  // Issues and Exceptions
  issues: Array<{
    issueId: string;
    stepId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    resolution?: string;
    reportedAt: Date;
    resolvedAt?: Date;
  }>;
  
  // Performance Metrics
  metrics: {
    totalDuration?: number;
    stepDurations: Record<string, number>;
    automationEfficiency: number;
    qualityScore: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

interface FilingReminder {
  id: string;
  tenantId: string;
  workflowId: string;
  formType: FormType;
  jurisdiction: RegulatoryJurisdiction;
  dueDate: Date;
  reminderDate: Date;
  reminderType: 'initial' | 'follow_up' | 'urgent' | 'final';
  recipients: string[];
  sent: boolean;
  sentAt?: Date;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  formType: FormType;
  jurisdiction: RegulatoryJurisdiction;
  category: 'regulatory_filing' | 'compliance_reporting' | 'client_reporting' | 'internal_reporting';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedSetupTime: number; // in hours
  templateSteps: FilingWorkflow['steps'];
  recommendedDataSources: FilingWorkflow['dataSources'];
  bestPractices: string[];
}

export class AutomatedFilingWorkflowsService {
  private eventPublisher: EventPublisher;
  private workflows: Map<string, FilingWorkflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private reminders: Map<string, FilingReminder> = new Map();
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.eventPublisher = new EventPublisher('AutomatedFilingWorkflows');
    this.initializeWorkflowTemplates();
  }

  async createFilingWorkflow(
    tenantId: string,
    workflowConfig: Omit<FilingWorkflow, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<FilingWorkflow> {
    try {
      logger.info('Creating filing workflow', {
        tenantId,
        workflowName: workflowConfig.workflowName,
        formType: workflowConfig.formType
      });

      const workflowId = randomUUID();
      
      const workflow: FilingWorkflow = {
        id: workflowId,
        tenantId,
        ...workflowConfig,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate workflow configuration
      this.validateWorkflowConfiguration(workflow);
      
      this.workflows.set(workflowId, workflow);

      await this.eventPublisher.publish('regulatory.workflow.created', {
        tenantId,
        workflowId,
        workflowName: workflow.workflowName,
        formType: workflow.formType,
        automationLevel: workflow.automationLevel
      });

      return workflow;

    } catch (error: any) {
      logger.error('Error creating filing workflow:', error);
      throw error;
    }
  }

  async initiateWorkflowExecution(
    workflowId: string,
    reportingPeriodEnd: Date,
    initiatedBy: string
  ): Promise<WorkflowExecution> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Filing workflow not found');
      }

      if (!workflow.isActive) {
        throw new Error('Workflow is not active');
      }

      logger.info('Initiating workflow execution', {
        workflowId,
        tenantId: workflow.tenantId,
        formType: workflow.formType,
        reportingPeriodEnd
      });

      const executionId = randomUUID();
      const filingId = randomUUID(); // Would be created through appropriate service
      
      // Calculate scheduled completion date
      const scheduledCompletionDate = this.calculateScheduledCompletionDate(
        workflow, 
        reportingPeriodEnd
      );

      // Initialize step status tracking
      const stepStatus = new Map();
      workflow.steps.forEach(step => {
        stepStatus.set(step.stepId, {
          status: 'pending' as const,
          assignedTo: step.assignedRole
        });
      });

      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        tenantId: workflow.tenantId,
        filingId,
        status: 'initiated',
        currentStep: workflow.steps[0]?.stepId || '',
        initiatedAt: new Date(),
        scheduledCompletionDate,
        stepStatus,
        issues: [],
        metrics: {
          stepDurations: {},
          automationEfficiency: 0,
          qualityScore: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.executions.set(executionId, execution);

      // Start the first step if it's automated
      if (workflow.steps[0]?.automatedAction?.enabled) {
        await this.executeAutomatedStep(execution, workflow.steps[0]);
      }

      // Schedule reminders
      await this.scheduleFilingReminders(workflow, scheduledCompletionDate);

      await this.eventPublisher.publish('regulatory.workflow.execution_initiated', {
        tenantId: workflow.tenantId,
        workflowId,
        executionId,
        formType: workflow.formType,
        scheduledCompletionDate,
        initiatedBy
      });

      return execution;

    } catch (error: any) {
      logger.error('Error initiating workflow execution:', error);
      throw error;
    }
  }

  async processWorkflowStep(
    executionId: string,
    stepId: string,
    action: 'start' | 'complete' | 'approve' | 'reject',
    assignedTo: string,
    notes?: string,
    artifacts?: string[]
  ): Promise<WorkflowExecution> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error('Workflow execution not found');
      }

      const workflow = this.workflows.get(execution.workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const step = workflow.steps.find(s => s.stepId === stepId);
      if (!step) {
        throw new Error('Workflow step not found');
      }

      logger.info('Processing workflow step', {
        executionId,
        stepId,
        action,
        assignedTo
      });

      const stepStatus = execution.stepStatus.get(stepId);
      if (!stepStatus) {
        throw new Error('Step status not found');
      }

      const now = new Date();

      switch (action) {
        case 'start':
          stepStatus.status = 'in_progress';
          stepStatus.startedAt = now;
          stepStatus.assignedTo = assignedTo;
          execution.currentStep = stepId;
          execution.status = 'in_progress';
          break;

        case 'complete':
          stepStatus.status = 'completed';
          stepStatus.completedAt = now;
          stepStatus.notes = notes;
          stepStatus.artifacts = artifacts;
          
          // Calculate step duration
          if (stepStatus.startedAt) {
            const duration = now.getTime() - stepStatus.startedAt.getTime();
            execution.metrics.stepDurations[stepId] = duration;
          }

          // Move to next step
          const nextStep = this.getNextStep(workflow, stepId);
          if (nextStep) {
            execution.currentStep = nextStep.stepId;
            
            // Auto-start next step if it's automated
            if (nextStep.automatedAction?.enabled) {
              await this.executeAutomatedStep(execution, nextStep);
            }
          } else {
            // Workflow completed
            execution.status = 'completed';
            execution.actualCompletionDate = now;
            await this.completeWorkflowExecution(execution, workflow);
          }
          break;

        case 'approve':
          stepStatus.status = 'completed';
          stepStatus.completedAt = now;
          stepStatus.notes = notes;
          execution.status = 'approved';
          break;

        case 'reject':
          stepStatus.status = 'failed';
          stepStatus.completedAt = now;
          stepStatus.notes = notes;
          execution.status = 'failed';
          await this.handleWorkflowFailure(execution, stepId, notes || 'Step rejected');
          break;
      }

      execution.stepStatus.set(stepId, stepStatus);
      execution.updatedAt = now;
      this.executions.set(executionId, execution);

      await this.eventPublisher.publish('regulatory.workflow.step_processed', {
        tenantId: execution.tenantId,
        executionId,
        stepId,
        action,
        assignedTo,
        workflowStatus: execution.status
      });

      return execution;

    } catch (error: any) {
      logger.error('Error processing workflow step:', error);
      throw error;
    }
  }

  async getWorkflowDashboard(tenantId: string): Promise<{
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
  }> {
    try {
      const tenantWorkflows = Array.from(this.workflows.values())
        .filter(w => w.tenantId === tenantId);
      
      const tenantExecutions = Array.from(this.executions.values())
        .filter(e => e.tenantId === tenantId);

      const activeWorkflows = tenantWorkflows.filter(w => w.isActive).length;
      const pendingExecutions = tenantExecutions.filter(e => 
        ['initiated', 'in_progress', 'review'].includes(e.status)
      ).length;

      // Calculate overdue tasks
      const now = new Date();
      const overdueTasks = tenantExecutions.filter(e => 
        e.scheduledCompletionDate < now && !['completed', 'filed'].includes(e.status)
      ).length;

      // Get upcoming deadlines
      const upcomingDeadlines = tenantExecutions
        .filter(e => e.scheduledCompletionDate > now && !['completed', 'filed'].includes(e.status))
        .sort((a, b) => a.scheduledCompletionDate.getTime() - b.scheduledCompletionDate.getTime())
        .slice(0, 10)
        .map(e => {
          const workflow = this.workflows.get(e.workflowId);
          const daysRemaining = Math.ceil(
            (e.scheduledCompletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          return {
            workflowName: workflow?.workflowName || 'Unknown',
            formType: workflow?.formType || FormType.FORM_ADV,
            dueDate: e.scheduledCompletionDate,
            daysRemaining,
            status: e.status
          };
        });

      // Get recent executions
      const recentExecutions = tenantExecutions
        .filter(e => e.actualCompletionDate)
        .sort((a, b) => (b.actualCompletionDate?.getTime() || 0) - (a.actualCompletionDate?.getTime() || 0))
        .slice(0, 10)
        .map(e => {
          const workflow = this.workflows.get(e.workflowId);
          const duration = e.metrics.totalDuration;
          
          return {
            workflowName: workflow?.workflowName || 'Unknown',
            formType: workflow?.formType || FormType.FORM_ADV,
            status: e.status,
            completedAt: e.actualCompletionDate,
            duration
          };
        });

      // Calculate performance metrics
      const completedExecutions = tenantExecutions.filter(e => e.actualCompletionDate);
      const averageCompletionTime = completedExecutions.length > 0 
        ? completedExecutions.reduce((sum, e) => sum + (e.metrics.totalDuration || 0), 0) / completedExecutions.length
        : 0;

      const onTimeExecutions = completedExecutions.filter(e => 
        e.actualCompletionDate && e.actualCompletionDate <= e.scheduledCompletionDate
      ).length;
      const onTimeDeliveryRate = completedExecutions.length > 0 
        ? (onTimeExecutions / completedExecutions.length) * 100 
        : 0;

      const automationEfficiency = completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + e.metrics.automationEfficiency, 0) / completedExecutions.length
        : 0;

      const qualityScore = completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + e.metrics.qualityScore, 0) / completedExecutions.length
        : 0;

      return {
        activeWorkflows,
        pendingExecutions,
        overdueTasks,
        upcomingDeadlines,
        recentExecutions,
        performanceMetrics: {
          averageCompletionTime,
          onTimeDeliveryRate,
          automationEfficiency,
          qualityScore
        }
      };

    } catch (error: any) {
      logger.error('Error generating workflow dashboard:', error);
      throw error;
    }
  }

  async getWorkflowTemplates(
    category?: WorkflowTemplate['category'],
    formType?: FormType
  ): Promise<WorkflowTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (formType) {
      templates = templates.filter(t => t.formType === formType);
    }

    return templates;
  }

  async createWorkflowFromTemplate(
    tenantId: string,
    templateId: string,
    workflowName: string,
    customizations?: Partial<FilingWorkflow>
  ): Promise<FilingWorkflow> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Workflow template not found');
    }

    const workflowConfig: Omit<FilingWorkflow, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
      workflowName,
      formType: template.formType,
      jurisdiction: template.jurisdiction,
      isActive: true,
      automationLevel: 'semi_automated',
      schedule: {
        frequency: 'quarterly',
        dueDate: {
          daysAfterPeriodEnd: 45
        },
        reminderSchedule: [
          {
            daysBeforeDue: 30,
            recipientRoles: ['compliance_officer'],
            notificationMethod: 'email'
          },
          {
            daysBeforeDue: 7,
            recipientRoles: ['compliance_officer', 'portfolio_manager'],
            notificationMethod: 'both'
          }
        ]
      },
      steps: template.templateSteps,
      approvalWorkflow: {
        enabled: true,
        approvers: [
          { role: 'compliance_officer', sequence: 1, required: true },
          { role: 'chief_compliance_officer', sequence: 2, required: true }
        ],
        parallelApproval: false
      },
      dataSources: template.recommendedDataSources,
      qualityChecks: [
        {
          checkType: 'completeness',
          description: 'Verify all required fields are populated',
          automatedCheck: true,
          criticalityLevel: 'critical'
        },
        {
          checkType: 'accuracy',
          description: 'Validate data accuracy against source systems',
          automatedCheck: true,
          criticalityLevel: 'high'
        }
      ],
      ...customizations
    };

    return this.createFilingWorkflow(tenantId, workflowConfig);
  }

  async getWorkflow(workflowId: string): Promise<FilingWorkflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  async getWorkflowExecution(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null;
  }

  private validateWorkflowConfiguration(workflow: FilingWorkflow): void {
    if (!workflow.workflowName || workflow.workflowName.trim() === '') {
      throw new Error('Workflow name is required');
    }

    if (workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate step dependencies
    const stepIds = new Set(workflow.steps.map(s => s.stepId));
    for (const step of workflow.steps) {
      for (const depId of step.dependencies) {
        if (!stepIds.has(depId)) {
          throw new Error(`Invalid dependency: ${depId} not found in workflow steps`);
        }
      }
    }
  }

  private calculateScheduledCompletionDate(
    workflow: FilingWorkflow,
    reportingPeriodEnd: Date
  ): Date {
    const completionDate = new Date(reportingPeriodEnd);
    completionDate.setDate(completionDate.getDate() + workflow.schedule.dueDate.daysAfterPeriodEnd);
    
    // Subtract estimated total duration to get start date + buffer
    const totalEstimatedHours = workflow.steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    const bufferDays = Math.ceil(totalEstimatedHours / 8) + 5; // Assume 8 hours per day + 5 day buffer
    completionDate.setDate(completionDate.getDate() - bufferDays);
    
    return completionDate;
  }

  private async executeAutomatedStep(
    execution: WorkflowExecution,
    step: FilingWorkflow['steps'][0]
  ): Promise<any> {
    try {
      logger.info('Executing automated step', {
        executionId: execution.id,
        stepId: step.stepId,
        actionType: step.automatedAction?.actionType
      });

      // Mock automated action execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update step status
      const stepStatus = execution.stepStatus.get(step.stepId);
      if (stepStatus) {
        stepStatus.status = 'completed';
        stepStatus.completedAt = new Date();
        stepStatus.assignedTo = 'system';
        execution.stepStatus.set(step.stepId, stepStatus);
      }

    } catch (error: any) {
      logger.error('Error executing automated step:', error);
      
      // Mark step as failed
      const stepStatus = execution.stepStatus.get(step.stepId);
      if (stepStatus) {
        stepStatus.status = 'failed';
        stepStatus.completedAt = new Date();
        stepStatus.notes = `Automated execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        execution.stepStatus.set(step.stepId, stepStatus);
      }
    }
  }

  private getNextStep(
    workflow: FilingWorkflow,
    currentStepId: string
  ): FilingWorkflow['steps'][0] | null {
    const currentIndex = workflow.steps.findIndex(s => s.stepId === currentStepId);
    return currentIndex >= 0 && currentIndex < workflow.steps.length - 1 
      ? workflow.steps[currentIndex + 1] 
      : null;
  }

  private async completeWorkflowExecution(
    execution: WorkflowExecution,
    workflow: FilingWorkflow
  ): Promise<any> {
    // Calculate final metrics
    const totalDuration = execution.actualCompletionDate && execution.initiatedAt
      ? execution.actualCompletionDate.getTime() - execution.initiatedAt.getTime()
      : 0;
    
    execution.metrics.totalDuration = totalDuration;
    execution.metrics.automationEfficiency = this.calculateAutomationEfficiency(workflow);
    execution.metrics.qualityScore = this.calculateQualityScore(execution);

    await this.eventPublisher.publish('regulatory.workflow.execution_completed', {
      tenantId: execution.tenantId,
      executionId: execution.id,
      workflowId: execution.workflowId,
      duration: totalDuration,
      qualityScore: execution.metrics.qualityScore
    });
  }

  private async handleWorkflowFailure(
    execution: WorkflowExecution,
    failedStepId: string,
    reason: string
  ): Promise<any> {
    await this.eventPublisher.publish('regulatory.workflow.execution_failed', {
      tenantId: execution.tenantId,
      executionId: execution.id,
      workflowId: execution.workflowId,
      failedStepId,
      reason
    });
  }

  private async scheduleFilingReminders(
    workflow: FilingWorkflow,
    dueDate: Date
  ): Promise<any> {
    // Implementation for scheduling reminders
    for (const reminder of workflow.schedule.reminderSchedule) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - reminder.daysBeforeDue);

      const filingReminder: FilingReminder = {
        id: randomUUID(),
        tenantId: workflow.tenantId,
        workflowId: workflow.id,
        formType: workflow.formType,
        jurisdiction: workflow.jurisdiction,
        dueDate,
        reminderDate,
        reminderType: reminder.daysBeforeDue <= 7 ? 'urgent' : 'initial',
        recipients: reminder.recipientRoles,
        sent: false
      };

      this.reminders.set(filingReminder.id, filingReminder);
    }
  }

  private calculateAutomationEfficiency(workflow: FilingWorkflow): number {
    const automatedSteps = workflow.steps.filter(s => s.automatedAction?.enabled).length;
    return workflow.steps.length > 0 ? (automatedSteps / workflow.steps.length) * 100 : 0;
  }

  private calculateQualityScore(execution: WorkflowExecution): number {
    const totalSteps = execution.stepStatus.size;
    const completedSteps = Array.from(execution.stepStatus.values())
      .filter(s => s.status === 'completed').length;
    const failedSteps = Array.from(execution.stepStatus.values())
      .filter(s => s.status === 'failed').length;

    if (totalSteps === 0) return 0;

    const completionRate = (completedSteps / totalSteps) * 0.7;
    const failureRate = (failedSteps / totalSteps) * 0.3;

    return Math.max(0, (completionRate - failureRate) * 100);
  }

  private initializeWorkflowTemplates(): void {
    // Form ADV Template
    const formADVTemplate: WorkflowTemplate = {
      id: 'form-adv-template',
      name: 'Form ADV Annual Filing',
      description: 'Complete workflow for Form ADV annual filing with SEC',
      formType: FormType.FORM_ADV,
      jurisdiction: RegulatoryJurisdiction.SEC,
      category: 'regulatory_filing',
      complexity: 'moderate',
      estimatedSetupTime: 4,
      templateSteps: [
        {
          stepId: 'data-collection',
          stepName: 'Data Collection',
          stepType: 'data_collection',
          assignedRole: 'compliance_analyst',
          automatedAction: {
            enabled: true,
            actionType: 'extract_portfolio_data',
            parameters: { source: 'portfolio_management_system' }
          },
          requiredDocuments: ['AUM calculations', 'Client list', 'Fee schedule'],
          estimatedDuration: 8,
          dependencies: []
        },
        {
          stepId: 'form-preparation',
          stepName: 'Form Preparation',
          stepType: 'validation',
          assignedRole: 'compliance_officer',
          automatedAction: {
            enabled: false,
            actionType: 'validate_form_data',
            parameters: {}
          },
          requiredDocuments: ['Draft Form ADV'],
          estimatedDuration: 16,
          dependencies: ['data-collection']
        },
        {
          stepId: 'review-approval',
          stepName: 'Review and Approval',
          stepType: 'approval',
          assignedRole: 'chief_compliance_officer',
          requiredDocuments: ['Completed Form ADV', 'Supporting documentation'],
          estimatedDuration: 4,
          dependencies: ['form-preparation']
        },
        {
          stepId: 'sec-filing',
          stepName: 'SEC Filing',
          stepType: 'filing',
          assignedRole: 'compliance_officer',
          automatedAction: {
            enabled: true,
            actionType: 'submit_to_sec',
            parameters: { system: 'edgar' }
          },
          requiredDocuments: ['Approved Form ADV'],
          estimatedDuration: 2,
          dependencies: ['review-approval']
        }
      ],
      recommendedDataSources: [
        {
          sourceType: 'database',
          sourceIdentifier: 'portfolio_db',
          dataMapping: { 'aum': 'total_assets_under_management' },
          validationRules: ['aum > 0', 'client_count > 0']
        }
      ],
      bestPractices: [
        'Start data collection 60 days before due date',
        'Maintain supporting documentation for all disclosures',
        'Review fee schedule updates annually'
      ]
    };

    this.templates.set(formADVTemplate.id, formADVTemplate);
  }
}


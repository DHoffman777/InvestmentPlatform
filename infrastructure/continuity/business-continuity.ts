import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface BusinessContinuityPlan {
  id: string;
  name: string;
  description: string;
  version: string;
  effectiveDate: Date;
  reviewDate: Date;
  nextReviewDate: Date;
  owner: string;
  approver: string;
  status: 'draft' | 'approved' | 'active' | 'suspended' | 'retired';
  riskAssessment: RiskAssessment;
  businessImpactAnalysis: BusinessImpactAnalysis;
  recoveryStrategies: RecoveryStrategy[];
  incidentResponse: IncidentResponsePlan;
  communicationPlan: CommunicationPlan;
  testingSchedule: TestingSchedule;
  dependencies: SystemDependency[];
  complianceRequirements: ComplianceRequirement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAssessment {
  id: string;
  planId: string;
  assessmentDate: Date;
  methodology: string;
  threats: ThreatAnalysis[];
  vulnerabilities: VulnerabilityAnalysis[];
  riskMatrix: RiskMatrix;
  mitigationStrategies: MitigationStrategy[];
  residualRisk: number; // 0-100
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatAnalysis {
  id: string;
  type: 'natural_disaster' | 'cyber_attack' | 'pandemic' | 'technology_failure' | 'human_error' | 'supplier_failure' | 'regulatory_change';
  description: string;
  likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'minimal' | 'minor' | 'moderate' | 'major' | 'catastrophic';
  riskScore: number;
  sources: string[];
  geographicScope: string[];
  timeHorizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface VulnerabilityAnalysis {
  id: string;
  area: 'infrastructure' | 'personnel' | 'process' | 'technology' | 'vendor' | 'facility';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  exploitability: 'difficult' | 'moderate' | 'easy' | 'trivial';
  currentControls: string[];
  gaps: string[];
  recommendedActions: string[];
}

export interface RiskMatrix {
  categories: RiskCategory[];
  tolerance: RiskTolerance;
  appetite: RiskAppetite;
}

export interface RiskCategory {
  name: string;
  inherentRisk: number;
  controlEffectiveness: number;
  residualRisk: number;
  tolerance: number;
  status: 'within_tolerance' | 'approaching_limit' | 'exceeds_tolerance';
}

export interface BusinessImpactAnalysis {
  id: string;
  planId: string;
  analysisDate: Date;
  methodology: string;
  businessFunctions: BusinessFunction[];
  criticalProcesses: CriticalProcess[];
  recoveryObjectives: RecoveryObjective[];
  impactScenarios: ImpactScenario[];
  financialImpact: FinancialImpactAnalysis;
  operationalImpact: OperationalImpactAnalysis;
  reputationalImpact: ReputationalImpactAnalysis;
  regulatoryImpact: RegulatoryImpactAnalysis;
}

export interface BusinessFunction {
  id: string;
  name: string;
  description: string;
  criticality: 'essential' | 'important' | 'desirable' | 'optional';
  minimumStaffing: number;
  peakDemandPeriods: string[];
  dependencies: string[];
  alternativeLocations: string[];
  keyPersonnel: KeyPersonnel[];
  resources: ResourceRequirement[];
  compliance: string[];
}

export interface CriticalProcess {
  id: string;
  name: string;
  function: string;
  description: string;
  rto: number; // Recovery Time Objective in hours
  rpo: number; // Recovery Point Objective in hours
  mto: number; // Maximum Tolerable Outage in hours
  mbco: number; // Maximum Bearable Cost of Outage
  dependencies: ProcessDependency[];
  inputs: ProcessInput[];
  outputs: ProcessOutput[];
  resources: ResourceRequirement[];
  alternativeProcedures: string[];
  documentationLocation: string;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective' | 'recovery';
  category: 'people' | 'process' | 'technology' | 'facilities' | 'suppliers';
  description: string;
  businessFunctions: string[];
  activationTriggers: string[];
  procedures: RecoveryProcedure[];
  resources: ResourceRequirement[];
  timeline: RecoveryTimeline;
  costs: RecoveryCosts;
  risks: string[];
  successCriteria: string[];
  rollbackProcedures: string[];
  responsible: string;
  alternateContacts: string[];
}

export interface RecoveryProcedure {
  id: string;
  name: string;
  sequence: number;
  description: string;
  estimatedDuration: number; // minutes
  prerequisites: string[];
  steps: ProcedureStep[];
  resources: string[];
  responsible: string;
  verification: string[];
  rollback: string[];
}

export interface ProcedureStep {
  stepNumber: number;
  description: string;
  responsible: string;
  estimatedTime: number; // minutes
  dependencies: number[]; // step numbers
  verificationCriteria: string;
  troubleshooting: string[];
}

export interface IncidentResponsePlan {
  id: string;
  name: string;
  scope: string;
  activationCriteria: ActivationCriteria[];
  responseTeam: ResponseTeam;
  escalationMatrix: EscalationLevel[];
  communicationProtocols: CommunicationProtocol[];
  decisionAuthority: DecisionAuthority[];
  resourceAllocation: ResourceAllocation;
  coordinationProcedures: string[];
  documentationRequirements: string[];
  postIncidentActivities: string[];
}

export interface ActivationCriteria {
  trigger: string;
  threshold: string;
  autoActivation: boolean;
  approvalRequired: boolean;
  approver: string;
  notificationRequired: string[];
}

export interface ResponseTeam {
  incidentCommander: TeamMember;
  deputies: TeamMember[];
  functionalLeads: TeamMember[];
  specialists: TeamMember[];
  externalContacts: ExternalContact[];
  alternateTeam: TeamMember[];
}

export interface TeamMember {
  name: string;
  role: string;
  primaryPhone: string;
  alternatePhone: string;
  email: string;
  responsibilities: string[];
  expertise: string[];
  location: string;
  availability: AvailabilitySchedule;
}

export interface CommunicationPlan {
  id: string;
  stakeholderGroups: StakeholderGroup[];
  messageTemplates: MessageTemplate[];
  channels: CommunicationChannel[];
  protocols: CommunicationProtocol[];
  escalationPaths: CommunicationEscalation[];
  approvalProcess: ApprovalProcess;
  monitoringRequirements: string[];
}

export interface TestingSchedule {
  id: string;
  planId: string;
  testTypes: TestType[];
  schedule: TestEvent[];
  participants: TestParticipant[];
  successCriteria: string[];
  reportingRequirements: string[];
  improvementProcess: string;
}

export interface TestType {
  name: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  scope: 'component' | 'partial' | 'full' | 'integrated';
  duration: number; // hours
  disruptive: boolean;
  approvalRequired: boolean;
  objectives: string[];
  scenarios: TestScenario[];
}

export interface DisasterEvent {
  id: string;
  type: 'natural' | 'technological' | 'human' | 'biological' | 'environmental';
  category: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  startTime: Date;
  estimatedDuration: number; // hours
  endTime?: Date;
  affectedAreas: string[];
  affectedSystems: string[];
  affectedFunctions: string[];
  impactAssessment: ImpactAssessment;
  responseActions: ResponseAction[];
  status: 'active' | 'contained' | 'resolved' | 'post_incident';
  lessons: string[];
}

export interface RecoveryExecution {
  id: string;
  planId: string;
  eventId: string;
  activatedAt: Date;
  activatedBy: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  currentPhase: string;
  completedProcedures: string[];
  activeProced→ures: string[];
  pendingProcedures: string[];
  resources: ResourceAllocation;
  timeline: ExecutionTimeline;
  issues: RecoveryIssue[];
  communications: CommunicationLog[];
  costs: ActualCosts;
  metrics: RecoveryMetrics;
}

/**
 * Business Continuity Management System
 * Provides comprehensive business continuity planning, risk assessment, and disaster recovery
 */
export class BusinessContinuityManager extends EventEmitter {
  private plans: Map<string, BusinessContinuityPlan> = new Map();
  private activeEvents: Map<string, DisasterEvent> = new Map();
  private recoveryExecutions: Map<string, RecoveryExecution> = new Map();
  private testResults: Map<string, TestResult> = new Map();

  constructor() {
    super();
    this.initializeDefaultPlans();
    this.startMonitoring();
  }

  /**
   * Create business continuity plan
   */
  public async createPlan(
    planData: Omit<BusinessContinuityPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BusinessContinuityPlan> {
    try {
      const planId = randomUUID();
      const now = new Date();

      const plan: BusinessContinuityPlan = {
        ...planData,
        id: planId,
        createdAt: now,
        updatedAt: now
      };

      this.plans.set(planId, plan);

      this.emit('planCreated', {
        planId,
        name: plan.name,
        version: plan.version,
        owner: plan.owner,
        timestamp: now
      });

      return plan;

    } catch (error) {
      this.emit('planError', {
        operation: 'create',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Conduct risk assessment
   */
  public async conductRiskAssessment(
    planId: string,
    assessmentData: Omit<RiskAssessment, 'id' | 'planId'>
  ): Promise<RiskAssessment> {
    try {
      const plan = this.plans.get(planId);
      if (!plan) {
        throw new Error('Business continuity plan not found');
      }

      const assessment: RiskAssessment = {
        ...assessmentData,
        id: randomUUID(),
        planId
      };

      // Calculate overall risk level
      assessment.overallRiskLevel = this.calculateOverallRisk(assessment);
      assessment.residualRisk = this.calculateResidualRisk(assessment);

      plan.riskAssessment = assessment;
      plan.updatedAt = new Date();
      this.plans.set(planId, plan);

      this.emit('riskAssessmentCompleted', {
        planId,
        assessmentId: assessment.id,
        overallRiskLevel: assessment.overallRiskLevel,
        residualRisk: assessment.residualRisk,
        threatsCount: assessment.threats.length,
        vulnerabilitiesCount: assessment.vulnerabilities.length,
        timestamp: new Date()
      });

      return assessment;

    } catch (error) {
      this.emit('riskAssessmentError', {
        planId,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Perform business impact analysis
   */
  public async performBusinessImpactAnalysis(
    planId: string,
    biaData: Omit<BusinessImpactAnalysis, 'id' | 'planId'>
  ): Promise<BusinessImpactAnalysis> {
    try {
      const plan = this.plans.get(planId);
      if (!plan) {
        throw new Error('Business continuity plan not found');
      }

      const bia: BusinessImpactAnalysis = {
        ...biaData,
        id: randomUUID(),
        planId
      };

      // Validate recovery objectives against business functions
      this.validateRecoveryObjectives(bia);

      plan.businessImpactAnalysis = bia;
      plan.updatedAt = new Date();
      this.plans.set(planId, plan);

      this.emit('businessImpactAnalysisCompleted', {
        planId,
        biaId: bia.id,
        functionsCount: bia.businessFunctions.length,
        criticalProcessesCount: bia.criticalProcesses.length,
        averageRTO: this.calculateAverageRTO(bia),
        averageRPO: this.calculateAverageRPO(bia),
        timestamp: new Date()
      });

      return bia;

    } catch (error) {
      this.emit('biaError', {
        planId,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Activate disaster response
   */
  public async activateDisasterResponse(
    planId: string,
    eventData: Omit<DisasterEvent, 'id' | 'status' | 'responseActions' | 'lessons'>
  ): Promise<{ event: DisasterEvent; execution: RecoveryExecution }> {
    try {
      const plan = this.plans.get(planId);
      if (!plan) {
        throw new Error('Business continuity plan not found');
      }

      const eventId = randomUUID();
      const event: DisasterEvent = {
        ...eventData,
        id: eventId,
        status: 'active',
        responseActions: [],
        lessons: []
      };

      this.activeEvents.set(eventId, event);

      // Initiate recovery execution
      const execution = await this.initiateRecoveryExecution(planId, eventId);

      // Send emergency notifications
      await this.sendEmergencyNotifications(plan, event);

      this.emit('disasterResponseActivated', {
        planId,
        eventId,
        eventType: event.type,
        severity: event.severity,
        affectedSystems: event.affectedSystems,
        executionId: execution.id,
        timestamp: new Date()
      });

      return { event, execution };

    } catch (error) {
      this.emit('disasterResponseError', {
        planId,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Execute recovery procedures
   */
  public async executeRecoveryProcedure(
    executionId: string,
    procedureId: string,
    executedBy: string
  ): Promise<ProcedureExecutionResult> {
    try {
      const execution = this.recoveryExecutions.get(executionId);
      if (!execution) {
        throw new Error('Recovery execution not found');
      }

      const plan = this.plans.get(execution.planId);
      if (!plan) {
        throw new Error('Business continuity plan not found');
      }

      // Find the procedure in recovery strategies
      const procedure = this.findRecoveryProcedure(plan, procedureId);
      if (!procedure) {
        throw new Error('Recovery procedure not found');
      }

      const startTime = new Date();
      
      // Execute procedure steps
      const stepResults: StepExecutionResult[] = [];
      for (const step of procedure.steps) {
        const stepResult = await this.executeStep(step, executedBy);
        stepResults.push(stepResult);
        
        if (!stepResult.success) {
          // Handle step failure
          await this.handleStepFailure(execution, procedure, step, stepResult.error);
          break;
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const success = stepResults.every(r => r.success);

      const result: ProcedureExecutionResult = {
        procedureId,
        executedBy,
        startTime,
        endTime,
        duration,
        success,
        stepResults,
        issues: success ? [] : ['One or more steps failed']
      };

      // Update execution status
      if (success) {
        execution.completedProcedures.push(procedureId);
        execution.activeProc→edures = execution.activeProcedures.filter(p => p !== procedureId);
      }

      execution.timeline.events.push({
        timestamp: new Date(),
        type: success ? 'procedure_completed' : 'procedure_failed',
        description: `${procedure.name} ${success ? 'completed' : 'failed'}`,
        duration,
        responsible: executedBy
      });

      this.recoveryExecutions.set(executionId, execution);

      this.emit('procedureExecuted', {
        executionId,
        procedureId,
        procedureName: procedure.name,
        success,
        duration,
        executedBy,
        timestamp: new Date()
      });

      return result;

    } catch (error) {
      this.emit('procedureExecutionError', {
        executionId,
        procedureId,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Schedule and execute BCP tests
   */
  public async scheduleTest(
    planId: string,
    testType: string,
    scheduledDate: Date,
    participants: string[]
  ): Promise<TestEvent> {
    try {
      const plan = this.plans.get(planId);
      if (!plan) {
        throw new Error('Business continuity plan not found');
      }

      const testEvent: TestEvent = {
        id: randomUUID(),
        planId,
        type: testType,
        scheduledDate,
        status: 'scheduled',
        participants: participants.map(p => ({ name: p, role: 'participant', confirmed: false })),
        objectives: this.getTestObjectives(testType),
        scenarios: this.getTestScenarios(testType),
        duration: this.getTestDuration(testType),
        approvalRequired: this.isApprovalRequired(testType),
        createdAt: new Date()
      };

      // Add to testing schedule
      plan.testingSchedule.schedule.push(testEvent);
      plan.updatedAt = new Date();
      this.plans.set(planId, plan);

      this.emit('testScheduled', {
        planId,
        testId: testEvent.id,
        testType,
        scheduledDate,
        participantsCount: participants.length,
        timestamp: new Date()
      });

      return testEvent;

    } catch (error) {
      this.emit('testSchedulingError', {
        planId,
        testType,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Generate BCP dashboard metrics
   */
  public generateDashboard(): BCPDashboard {
    const plans = Array.from(this.plans.values());
    const activeEvents = Array.from(this.activeEvents.values());
    const activeExecutions = Array.from(this.recoveryExecutions.values())
      .filter(e => e.status === 'in_progress');

    const summary = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'active').length,
      pendingReviews: plans.filter(p => p.nextReviewDate < new Date()).length,
      activeIncidents: activeEvents.filter(e => e.status === 'active').length,
      activeRecoveries: activeExecutions.length,
      overallReadiness: this.calculateOverallReadiness(plans)
    };

    const riskMetrics = this.calculateRiskMetrics(plans);
    const testingMetrics = this.calculateTestingMetrics(plans);
    const complianceStatus = this.calculateComplianceStatus(plans);

    return {
      summary,
      riskMetrics,
      testingMetrics,
      complianceStatus,
      recentEvents: this.getRecentEvents(),
      upcomingTests: this.getUpcomingTests(),
      actionItems: this.getActionItems(plans),
      lastUpdated: new Date()
    };
  }

  // Private helper methods

  private async initiateRecoveryExecution(
    planId: string,
    eventId: string
  ): Promise<RecoveryExecution> {
    const executionId = randomUUID();
    const plan = this.plans.get(planId);
    const event = this.activeEvents.get(eventId);

    if (!plan || !event) {
      throw new Error('Plan or event not found');
    }

    // Determine applicable recovery strategies
    const applicableStrategies = plan.recoveryStrategies.filter(strategy =>
      this.isStrategyApplicable(strategy, event)
    );

    const execution: RecoveryExecution = {
      id: executionId,
      planId,
      eventId,
      activatedAt: new Date(),
      activatedBy: 'system', // Would be actual user in production
      status: 'initiated',
      currentPhase: 'assessment',
      completedProcedures: [],
      activeProcedures: [],
      pendingProcedures: applicableStrategies.flatMap(s => s.procedures.map(p => p.id)),
      resources: this.allocateResources(applicableStrategies),
      timeline: {
        events: [{
          timestamp: new Date(),
          type: 'activation',
          description: 'Recovery execution initiated',
          duration: 0,
          responsible: 'system'
        }]
      },
      issues: [],
      communications: [],
      costs: { estimated: 0, actual: 0, breakdown: {} },
      metrics: {
        proceduresCompleted: 0,
        proceduresTotal: applicableStrategies.reduce((sum, s) => sum + s.procedures.length, 0),
        averageExecutionTime: 0,
        successRate: 0,
        resourceUtilization: 0
      }
    };

    this.recoveryExecutions.set(executionId, execution);
    return execution;
  }

  private calculateOverallRisk(assessment: RiskAssessment): 'low' | 'medium' | 'high' | 'critical' {
    const threatLevels = assessment.threats.map(t => this.threatLevelToNumber(t.likelihood, t.impact));
    const maxThreatLevel = Math.max(...threatLevels);
    const avgThreatLevel = threatLevels.reduce((sum, level) => sum + level, 0) / threatLevels.length;
    
    const vulnerabilityScore = assessment.vulnerabilities.reduce((sum, v) => {
      return sum + this.severityToNumber(v.severity);
    }, 0) / assessment.vulnerabilities.length;

    const overallScore = (maxThreatLevel * 0.4) + (avgThreatLevel * 0.3) + (vulnerabilityScore * 0.3);

    if (overallScore >= 8) return 'critical';
    if (overallScore >= 6) return 'high';
    if (overallScore >= 4) return 'medium';
    return 'low';
  }

  private calculateResidualRisk(assessment: RiskAssessment): number {
    // Calculate residual risk after considering mitigation strategies
    const inherentRisk = assessment.threats.reduce((sum, threat) => {
      return sum + this.threatLevelToNumber(threat.likelihood, threat.impact);
    }, 0) / assessment.threats.length;

    const mitigationEffectiveness = assessment.mitigationStrategies.reduce((sum, strategy) => {
      return sum + (strategy.effectiveness || 0.5);
    }, 0) / Math.max(assessment.mitigationStrategies.length, 1);

    return Math.max(0, inherentRisk * (1 - mitigationEffectiveness)) * 10;
  }

  private validateRecoveryObjectives(bia: BusinessImpactAnalysis): void {
    for (const process of bia.criticalProcesses) {
      if (process.rto > process.mto) {
        throw new Error(`RTO (${process.rto}h) exceeds MTO (${process.mto}h) for process ${process.name}`);
      }
      
      if (process.rpo > process.rto) {
        throw new Error(`RPO (${process.rpo}h) exceeds RTO (${process.rto}h) for process ${process.name}`);
      }
    }
  }

  private calculateAverageRTO(bia: BusinessImpactAnalysis): number {
    const rtos = bia.criticalProcesses.map(p => p.rto);
    return rtos.reduce((sum, rto) => sum + rto, 0) / Math.max(rtos.length, 1);
  }

  private calculateAverageRPO(bia: BusinessImpactAnalysis): number {
    const rpos = bia.criticalProcesses.map(p => p.rpo);
    return rpos.reduce((sum, rpo) => sum + rpo, 0) / Math.max(rpos.length, 1);
  }

  private async sendEmergencyNotifications(
    plan: BusinessContinuityPlan,
    event: DisasterEvent
  ): Promise<void> {
    // Send notifications to response team and stakeholders
    const notifications = plan.communicationPlan.stakeholderGroups
      .filter(group => group.emergencyNotification)
      .flatMap(group => group.contacts);

    for (const contact of notifications) {
      await this.sendNotification(contact, {
        type: 'emergency',
        event: event.type,
        severity: event.severity,
        message: `Emergency response activated for ${event.category}`,
        timestamp: new Date()
      });
    }
  }

  private async sendNotification(contact: any, notification: any): Promise<void> {
    // Mock notification sending
    this.emit('notificationSent', {
      recipient: contact.email || contact.phone,
      type: notification.type,
      message: notification.message,
      timestamp: new Date()
    });
  }

  private findRecoveryProcedure(plan: BusinessContinuityPlan, procedureId: string): RecoveryProcedure | null {
    for (const strategy of plan.recoveryStrategies) {
      const procedure = strategy.procedures.find(p => p.id === procedureId);
      if (procedure) return procedure;
    }
    return null;
  }

  private async executeStep(step: ProcedureStep, executedBy: string): Promise<StepExecutionResult> {
    // Mock step execution - in production would integrate with actual systems
    const startTime = Date.now();
    const simulatedDelay = step.estimatedTime * 60 * 1000; // Convert minutes to milliseconds
    
    await new Promise(resolve => setTimeout(resolve, Math.min(simulatedDelay, 5000))); // Max 5 second simulation
    
    const success = Math.random() > 0.1; // 90% success rate
    const actualDuration = Date.now() - startTime;

    return {
      stepNumber: step.stepNumber,
      success,
      startTime: new Date(startTime),
      endTime: new Date(),
      actualDuration,
      estimatedDuration: step.estimatedTime * 60 * 1000,
      executedBy,
      error: success ? undefined : 'Simulated step failure',
      verificationResult: success ? 'passed' : 'failed'
    };
  }

  private async handleStepFailure(
    execution: RecoveryExecution,
    procedure: RecoveryProcedure,
    step: ProcedureStep,
    error: string
  ): Promise<void> {
    const issue: RecoveryIssue = {
      id: randomUUID(),
      type: 'step_failure',
      severity: 'high',
      description: `Step ${step.stepNumber} failed in procedure ${procedure.name}`,
      error,
      timestamp: new Date(),
      resolved: false,
      assignedTo: procedure.responsible,
      resolutionSteps: step.troubleshooting || []
    };

    execution.issues.push(issue);

    this.emit('recoveryIssue', {
      executionId: execution.id,
      issueId: issue.id,
      procedureId: procedure.id,
      stepNumber: step.stepNumber,
      error,
      timestamp: new Date()
    });
  }

  private isStrategyApplicable(strategy: RecoveryStrategy, event: DisasterEvent): boolean {
    // Determine if a recovery strategy applies to the current event
    // This would be more sophisticated in production
    return true; // Simplified
  }

  private allocateResources(strategies: RecoveryStrategy[]): ResourceAllocation {
    const totalPersonnel = strategies.reduce((sum, s) => {
      return sum + s.resources.filter(r => r.type === 'personnel').length;
    }, 0);

    const totalBudget = strategies.reduce((sum, s) => {
      return sum + (s.costs?.total || 0);
    }, 0);

    return {
      personnel: totalPersonnel,
      budget: totalBudget,
      facilities: strategies.length,
      technology: strategies.flatMap(s => s.resources.filter(r => r.type === 'technology')).length,
      vendors: strategies.flatMap(s => s.resources.filter(r => r.type === 'vendor')).length
    };
  }

  private threatLevelToNumber(likelihood: string, impact: string): number {
    const likelihoodScores = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    const impactScores = { minimal: 1, minor: 2, moderate: 3, major: 4, catastrophic: 5 };
    
    return (likelihoodScores[likelihood] || 3) * (impactScores[impact] || 3);
  }

  private severityToNumber(severity: string): number {
    const severityScores = { low: 2, medium: 4, high: 6, critical: 8 };
    return severityScores[severity] || 4;
  }

  private calculateOverallReadiness(plans: BusinessContinuityPlan[]): number {
    if (plans.length === 0) return 0;

    const readinessScores = plans.map(plan => {
      let score = 0;
      
      // Plan completeness
      if (plan.riskAssessment) score += 20;
      if (plan.businessImpactAnalysis) score += 20;
      if (plan.recoveryStrategies.length > 0) score += 20;
      if (plan.incidentResponse) score += 20;
      if (plan.communicationPlan) score += 10;
      if (plan.testingSchedule) score += 10;

      return score;
    });

    return readinessScores.reduce((sum, score) => sum + score, 0) / plans.length;
  }

  private calculateRiskMetrics(plans: BusinessContinuityPlan[]) {
    const riskLevels = plans
      .filter(p => p.riskAssessment)
      .map(p => p.riskAssessment.overallRiskLevel);

    return {
      criticalRisk: riskLevels.filter(r => r === 'critical').length,
      highRisk: riskLevels.filter(r => r === 'high').length,
      mediumRisk: riskLevels.filter(r => r === 'medium').length,
      lowRisk: riskLevels.filter(r => r === 'low').length,
      averageResidualRisk: plans
        .filter(p => p.riskAssessment)
        .reduce((sum, p) => sum + p.riskAssessment.residualRisk, 0) / Math.max(riskLevels.length, 1)
    };
  }

  private calculateTestingMetrics(plans: BusinessContinuityPlan[]) {
    const allTests = plans.flatMap(p => p.testingSchedule.schedule);
    const currentDate = new Date();
    const recentTests = allTests.filter(t => 
      t.scheduledDate >= new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000)
    );

    return {
      totalTests: allTests.length,
      recentTests: recentTests.length,
      passedTests: recentTests.filter(t => t.status === 'passed').length,
      failedTests: recentTests.filter(t => t.status === 'failed').length,
      upcomingTests: allTests.filter(t => t.scheduledDate > currentDate).length,
      overdueTests: allTests.filter(t => t.scheduledDate < currentDate && t.status === 'scheduled').length
    };
  }

  private calculateComplianceStatus(plans: BusinessContinuityPlan[]) {
    const allRequirements = plans.flatMap(p => p.complianceRequirements);
    const compliantRequirements = allRequirements.filter(r => r.status === 'compliant');

    return {
      totalRequirements: allRequirements.length,
      compliantRequirements: compliantRequirements.length,
      compliancePercentage: allRequirements.length > 0 
        ? (compliantRequirements.length / allRequirements.length) * 100 
        : 100,
      pendingRequirements: allRequirements.filter(r => r.status === 'pending').length,
      nonCompliantRequirements: allRequirements.filter(r => r.status === 'non_compliant').length
    };
  }

  private getRecentEvents(): any[] {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    return Array.from(this.activeEvents.values())
      .filter(e => e.startTime >= cutoff)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);
  }

  private getUpcomingTests(): any[] {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return Array.from(this.plans.values())
      .flatMap(p => p.testingSchedule.schedule)
      .filter(t => t.scheduledDate >= now && t.scheduledDate <= nextMonth)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  private getActionItems(plans: BusinessContinuityPlan[]): any[] {
    const actionItems = [];

    // Overdue reviews
    for (const plan of plans) {
      if (plan.nextReviewDate < new Date()) {
        actionItems.push({
          type: 'overdue_review',
          planId: plan.id,
          planName: plan.name,
          dueDate: plan.nextReviewDate,
          priority: 'high',
          description: `Plan review overdue by ${Math.ceil((Date.now() - plan.nextReviewDate.getTime()) / (24 * 60 * 60 * 1000))} days`
        });
      }
    }

    return actionItems.slice(0, 20); // Limit to 20 items
  }

  private getTestObjectives(testType: string): string[] {
    const objectives = {
      'walkthrough': ['Familiarize team with procedures', 'Identify gaps in documentation'],
      'tabletop': ['Test decision-making processes', 'Validate communication protocols'],
      'functional': ['Test specific system recoveries', 'Validate technical procedures'],
      'full_scale': ['Test complete recovery capabilities', 'Validate all aspects of the plan']
    };
    return objectives[testType] || ['General testing objectives'];
  }

  private getTestScenarios(testType: string): TestScenario[] {
    // Return appropriate test scenarios based on test type
    return [{
      id: randomUUID(),
      name: `${testType} scenario`,
      description: `Standard scenario for ${testType} testing`,
      duration: this.getTestDuration(testType),
      complexity: 'medium',
      objectives: this.getTestObjectives(testType)
    }];
  }

  private getTestDuration(testType: string): number {
    const durations = {
      'walkthrough': 2,
      'tabletop': 4,
      'functional': 8,
      'full_scale': 24
    };
    return durations[testType] || 4;
  }

  private isApprovalRequired(testType: string): boolean {
    return ['functional', 'full_scale'].includes(testType);
  }

  private initializeDefaultPlans(): void {
    // Initialize basic BCP template
    const defaultPlan: Omit<BusinessContinuityPlan, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Investment Platform Business Continuity Plan',
      description: 'Comprehensive business continuity plan for investment management platform',
      version: '1.0',
      effectiveDate: new Date(),
      reviewDate: new Date(),
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      owner: 'Risk Management',
      approver: 'CEO',
      status: 'active',
      riskAssessment: {
        id: randomUUID(),
        planId: '',
        assessmentDate: new Date(),
        methodology: 'ISO 31000',
        threats: [],
        vulnerabilities: [],
        riskMatrix: {
          categories: [],
          tolerance: { level: 'medium', threshold: 50 },
          appetite: { level: 'low', statement: 'Minimal risk appetite for operational disruptions' }
        },
        mitigationStrategies: [],
        residualRisk: 30,
        overallRiskLevel: 'medium'
      },
      businessImpactAnalysis: {
        id: randomUUID(),
        planId: '',
        analysisDate: new Date(),
        methodology: 'BIA Framework',
        businessFunctions: [],
        criticalProcesses: [],
        recoveryObjectives: [],
        impactScenarios: [],
        financialImpact: { directCosts: 0, indirectCosts: 0, lostRevenue: 0, regulatoryFines: 0 },
        operationalImpact: { affectedProcesses: [], staffingRequirements: 0, alternativeProcesses: [] },
        reputationalImpact: { severity: 'medium', duration: 'short_term', mitigation: [] },
        regulatoryImpact: { requirements: [], penalties: [], reporting: [] }
      },
      recoveryStrategies: [],
      incidentResponse: {
        id: randomUUID(),
        name: 'Emergency Response Plan',
        scope: 'All operational disruptions',
        activationCriteria: [],
        responseTeam: {
          incidentCommander: {
            name: 'Risk Manager',
            role: 'Incident Commander',
            primaryPhone: '+1-555-0100',
            alternatePhone: '+1-555-0200',
            email: 'risk@investment-platform.com',
            responsibilities: ['Overall incident coordination', 'Decision making'],
            expertise: ['Risk Management', 'Business Continuity'],
            location: 'Primary Office',
            availability: { hours: '24/7', timeZone: 'EST' }
          },
          deputies: [],
          functionalLeads: [],
          specialists: [],
          externalContacts: [],
          alternateTeam: []
        },
        escalationMatrix: [],
        communicationProtocols: [],
        decisionAuthority: [],
        resourceAllocation: { personnel: 0, budget: 0, facilities: 0, technology: 0, vendors: 0 },
        coordinationProcedures: [],
        documentationRequirements: [],
        postIncidentActivities: []
      },
      communicationPlan: {
        id: randomUUID(),
        stakeholderGroups: [],
        messageTemplates: [],
        channels: [],
        protocols: [],
        escalationPaths: [],
        approvalProcess: { required: false, approvers: [], timeframe: 0 },
        monitoringRequirements: []
      },
      testingSchedule: {
        id: randomUUID(),
        planId: '',
        testTypes: [],
        schedule: [],
        participants: [],
        successCriteria: [],
        reportingRequirements: [],
        improvementProcess: 'Continuous improvement based on test results'
      },
      dependencies: [],
      complianceRequirements: []
    };

    this.createPlan(defaultPlan);
  }

  private startMonitoring(): void {
    // Monitor system health and trigger alerts
    setInterval(() => {
      this.performHealthChecks();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Check for plan reviews
    setInterval(() => {
      this.checkPlanReviews();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private performHealthChecks(): void {
    // Monitor critical systems and processes
    this.emit('healthCheck', {
      status: 'healthy',
      timestamp: new Date(),
      checks: ['database', 'applications', 'network', 'security']
    });
  }

  private checkPlanReviews(): void {
    const overdueReviews = Array.from(this.plans.values())
      .filter(plan => plan.nextReviewDate < new Date());

    if (overdueReviews.length > 0) {
      this.emit('planReviewOverdue', {
        count: overdueReviews.length,
        plans: overdueReviews.map(p => ({ id: p.id, name: p.name, dueDate: p.nextReviewDate })),
        timestamp: new Date()
      });
    }
  }
}

// Additional interfaces for completeness
interface MitigationStrategy {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'protective' | 'corrective';
  effectiveness: number; // 0-1
  cost: number;
  timeframe: string;
  responsible: string;
  status: 'planned' | 'implemented' | 'verified';
}

interface RiskTolerance {
  level: 'low' | 'medium' | 'high';
  threshold: number;
}

interface RiskAppetite {
  level: 'low' | 'medium' | 'high';
  statement: string;
}

interface KeyPersonnel {
  name: string;
  role: string;
  criticality: 'essential' | 'important' | 'desirable';
  backup: string[];
  skills: string[];
  crossTraining: string[];
}

interface ResourceRequirement {
  type: 'personnel' | 'technology' | 'facility' | 'vendor' | 'financial';
  description: string;
  quantity: number;
  availability: string;
  cost: number;
  alternative: string[];
}

interface ProcessDependency {
  type: 'upstream' | 'downstream' | 'supporting';
  process: string;
  criticality: 'essential' | 'important' | 'desirable';
  impact: string;
  alternative: string[];
}

interface ProcessInput {
  name: string;
  source: string;
  frequency: string;
  format: string;
  criticality: 'essential' | 'important' | 'desirable';
}

interface ProcessOutput {
  name: string;
  destination: string[];
  frequency: string;
  format: string;
  qualityMetrics: string[];
}

interface RecoveryTimeline {
  phases: RecoveryPhase[];
  milestones: RecoveryMilestone[];
  dependencies: TimelineDependency[];
}

interface RecoveryPhase {
  name: string;
  startTime: number; // hours from activation
  duration: number; // hours
  objectives: string[];
  procedures: string[];
  resources: string[];
  successCriteria: string[];
}

interface RecoveryMilestone {
  name: string;
  targetTime: number; // hours from activation
  criteria: string[];
  responsible: string;
  dependencies: string[];
}

interface TimelineDependency {
  predecessor: string;
  successor: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
  lag: number; // hours
}

interface RecoveryCosts {
  setup: number;
  ongoing: number;
  total: number;
  breakdown: { [category: string]: number };
}

interface EscalationLevel {
  level: number;
  title: string;
  criteria: string[];
  authority: string[];
  timeframe: number; // minutes
  notifications: string[];
}

interface CommunicationProtocol {
  name: string;
  purpose: string;
  frequency: string;
  participants: string[];
  methods: string[];
  templates: string[];
}

interface DecisionAuthority {
  role: string;
  scope: string[];
  limitations: string[];
  escalation: string;
}

interface ResourceAllocation {
  personnel: number;
  budget: number;
  facilities: number;
  technology: number;
  vendors: number;
}

interface StakeholderGroup {
  name: string;
  contacts: StakeholderContact[];
  messagePriority: 'immediate' | 'urgent' | 'normal' | 'low';
  emergencyNotification: boolean;
  businessHours: boolean;
}

interface StakeholderContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  preferredMethod: 'email' | 'phone' | 'sms' | 'all';
}

interface MessageTemplate {
  id: string;
  name: string;
  purpose: string;
  urgency: 'emergency' | 'urgent' | 'normal';
  subject: string;
  body: string;
  variables: string[];
  approval: boolean;
}

interface CommunicationChannel {
  type: 'email' | 'phone' | 'sms' | 'radio' | 'satellite' | 'social_media';
  primary: boolean;
  capacity: number;
  reliability: number;
  cost: number;
  setup: string[];
}

interface CommunicationEscalation {
  trigger: string;
  timeframe: number; // minutes
  escalateTo: string[];
  method: string[];
  approval: boolean;
}

interface ApprovalProcess {
  required: boolean;
  approvers: string[];
  timeframe: number; // minutes
}

interface TestEvent {
  id: string;
  planId: string;
  type: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'passed' | 'failed';
  participants: TestParticipant[];
  objectives: string[];
  scenarios: TestScenario[];
  duration: number;
  approvalRequired: boolean;
  approver?: string;
  results?: TestResult;
  createdAt: Date;
}

interface TestParticipant {
  name: string;
  role: string;
  confirmed: boolean;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  complexity: 'low' | 'medium' | 'high';
  objectives: string[];
}

interface TestResult {
  id: string;
  testId: string;
  overallResult: 'pass' | 'fail' | 'partial';
  score: number;
  objectives: ObjectiveResult[];
  findings: TestFinding[];
  recommendations: string[];
  nextActions: string[];
  completedAt: Date;
}

interface ObjectiveResult {
  objective: string;
  result: 'achieved' | 'partially_achieved' | 'not_achieved';
  evidence: string[];
  gaps: string[];
}

interface TestFinding {
  type: 'strength' | 'weakness' | 'gap' | 'improvement';
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  responsible: string;
  targetDate?: Date;
}

interface SystemDependency {
  name: string;
  type: 'internal' | 'external' | 'vendor' | 'partner';
  criticality: 'essential' | 'important' | 'desirable';
  rto: number;
  rpo: number;
  alternatives: string[];
  contact: string;
  sla: string;
}

interface ComplianceRequirement {
  regulation: string;
  requirement: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  evidence: string[];
  lastReview: Date;
  nextReview: Date;
  responsible: string;
}

interface ImpactAssessment {
  financial: FinancialImpact;
  operational: OperationalImpact;
  reputational: ReputationalImpact;
  regulatory: RegulatoryImpact;
  overall: 'minimal' | 'minor' | 'moderate' | 'major' | 'catastrophic';
}

interface FinancialImpact {
  directCosts: number;
  indirectCosts: number;
  lostRevenue: number;
  regulatoryFines: number;
}

interface OperationalImpact {
  affectedProcesses: string[];
  staffingRequirements: number;
  alternativeProcesses: string[];
}

interface ReputationalImpact {
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: 'short_term' | 'medium_term' | 'long_term' | 'permanent';
  mitigation: string[];
}

interface RegulatoryImpact {
  requirements: string[];
  penalties: string[];
  reporting: string[];
}

interface ResponseAction {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  description: string;
  responsible: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: Date;
  completionTime?: Date;
  resources: string[];
}

interface ImpactScenario {
  name: string;
  description: string;
  probability: number;
  timeframe: string;
  impact: ImpactAssessment;
}

interface RecoveryObjective {
  process: string;
  rto: number;
  rpo: number;
  mto: number;
  mbco: number;
  justification: string;
}

interface FinancialImpactAnalysis {
  directCosts: number;
  indirectCosts: number;
  lostRevenue: number;
  regulatoryFines: number;
}

interface OperationalImpactAnalysis {
  affectedProcesses: string[];
  staffingRequirements: number;
  alternativeProcesses: string[];
}

interface ReputationalImpactAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: 'short_term' | 'medium_term' | 'long_term' | 'permanent';
  mitigation: string[];
}

interface RegulatoryImpactAnalysis {
  requirements: string[];
  penalties: string[];
  reporting: string[];
}

interface ExternalContact {
  organization: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  services: string[];
  availability: string;
}

interface AvailabilitySchedule {
  hours: string;
  timeZone: string;
  holidays: boolean;
  backup: string;
}

interface ExecutionTimeline {
  events: TimelineEvent[];
}

interface TimelineEvent {
  timestamp: Date;
  type: string;
  description: string;
  duration: number;
  responsible: string;
}

interface RecoveryIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  error?: string;
  timestamp: Date;
  resolved: boolean;
  assignedTo: string;
  resolutionSteps: string[];
}

interface CommunicationLog {
  id: string;
  timestamp: Date;
  type: string;
  sender: string;
  recipients: string[];
  message: string;
  method: string;
  successful: boolean;
}

interface ActualCosts {
  estimated: number;
  actual: number;
  breakdown: { [category: string]: number };
}

interface RecoveryMetrics {
  proceduresCompleted: number;
  proceduresTotal: number;
  averageExecutionTime: number;
  successRate: number;
  resourceUtilization: number;
}

interface ProcedureExecutionResult {
  procedureId: string;
  executedBy: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  stepResults: StepExecutionResult[];
  issues: string[];
}

interface StepExecutionResult {
  stepNumber: number;
  success: boolean;
  startTime: Date;
  endTime: Date;
  actualDuration: number;
  estimatedDuration: number;
  executedBy: string;
  error?: string;
  verificationResult: string;
}

interface BCPDashboard {
  summary: {
    totalPlans: number;
    activePlans: number;
    pendingReviews: number;
    activeIncidents: number;
    activeRecoveries: number;
    overallReadiness: number;
  };
  riskMetrics: {
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageResidualRisk: number;
  };
  testingMetrics: {
    totalTests: number;
    recentTests: number;
    passedTests: number;
    failedTests: number;
    upcomingTests: number;
    overdueTests: number;
  };
  complianceStatus: {
    totalRequirements: number;
    compliantRequirements: number;
    compliancePercentage: number;
    pendingRequirements: number;
    nonCompliantRequirements: number;
  };
  recentEvents: any[];
  upcomingTests: any[];
  actionItems: any[];
  lastUpdated: Date;
}

export default BusinessContinuityManager;
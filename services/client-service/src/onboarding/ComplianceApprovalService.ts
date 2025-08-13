import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface ComplianceApprovalWorkflow {
  id: string;
  clientId: string;
  tenantId: string;
  workflowId: string;
  workflowType: ComplianceWorkflowType;
  status: ComplianceWorkflowStatus;
  priority: CompliancePriority;
  approvalSteps: ApprovalStep[];
  reviewers: ComplianceReviewer[];
  documents: ComplianceDocument[];
  riskAssessment: RiskAssessment;
  decisions: ComplianceDecision[];
  escalations: EscalationRecord[];
  deadlines: WorkflowDeadline[];
  auditTrail: AuditRecord[];
  metadata: {
    accountType: string;
    riskLevel: string;
    jurisdiction: string;
    regulatoryRequirements: string[];
    businessRules: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export interface ApprovalStep {
  id: string;
  name: string;
  description: string;
  type: ApprovalStepType;
  status: ApprovalStepStatus;
  order: number;
  dependencies: string[];
  requiredReviewers: ReviewerRequirement[];
  assignedReviewers: string[];
  criteria: ApprovalCriteria[];
  decisions: StepDecision[];
  deadline?: Date;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  attachments?: string[];
}

export interface ComplianceReviewer {
  id: string;
  userId: string;
  name: string;
  title: string;
  department: string;
  role: ReviewerRole;
  jurisdiction: string[];
  specializations: string[];
  certifications: string[];
  workload: {
    currentReviews: number;
    maxCapacity: number;
    averageReviewTime: number;
  };
  availability: ReviewerAvailability;
  performanceMetrics: ReviewerMetrics;
}

export interface ComplianceDocument {
  id: string;
  name: string;
  type: DocumentType;
  version: string;
  status: DocumentStatus;
  reviewStatus: DocumentReviewStatus;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  required: boolean;
  confidential: boolean;
  retentionPeriod: number; // days
  tags: string[];
}

export interface RiskAssessment {
  id: string;
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationMeasures: MitigationMeasure[];
  assessedBy: string;
  assessedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  validUntil: Date;
  score: number;
  methodology: string;
  assumptions: string[];
}

export interface RiskFactor {
  type: RiskFactorType;
  category: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  score: number;
  source: string;
  detectedAt: Date;
  mitigated: boolean;
}

export interface MitigationMeasure {
  id: string;
  riskFactorIds: string[];
  measure: string;
  effectiveness: 'low' | 'medium' | 'high';
  implementedBy: string;
  implementedAt: Date;
  status: 'proposed' | 'approved' | 'implemented' | 'failed';
  cost?: number;
  timeline?: string;
}

export interface ComplianceDecision {
  id: string;
  stepId: string;
  reviewerId: string;
  decision: DecisionType;
  reasoning: string;
  conditions?: string[];
  recommendedActions?: string[];
  confidenceLevel: number;
  timestamp: Date;
  overriddenBy?: string;
  overriddenAt?: Date;
  overrideReason?: string;
}

export interface EscalationRecord {
  id: string;
  stepId: string;
  reason: EscalationReason;
  escalatedBy: string;
  escalatedTo: string;
  escalatedAt: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  impact: EscalationImpact;
}

export interface WorkflowDeadline {
  id: string;
  stepId?: string;
  type: DeadlineType;
  deadline: Date;
  reminderDates: Date[];
  status: DeadlineStatus;
  consequences: string[];
  notificationsSent: number;
  escalationTriggered: boolean;
}

export interface AuditRecord {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  previousValue?: any;
  newValue?: any;
}

export interface ReviewerRequirement {
  role: ReviewerRole;
  count: number;
  jurisdiction?: string;
  specialization?: string;
  minExperience?: number;
  certificationRequired?: boolean;
}

export interface ApprovalCriteria {
  id: string;
  name: string;
  description: string;
  type: CriteriaType;
  weight: number;
  threshold: number;
  parameters: Record<string, any>;
  evaluationMethod: 'manual' | 'automated' | 'hybrid';
  status: CriteriaStatus;
  evaluatedBy?: string;
  evaluatedAt?: Date;
  result?: CriteriaResult;
}

export interface StepDecision {
  reviewerId: string;
  decision: DecisionType;
  timestamp: Date;
  reasoning: string;
  criteriaEvaluations: CriteriaEvaluation[];
}

export interface CriteriaEvaluation {
  criteriaId: string;
  result: CriteriaResult;
  score: number;
  notes?: string;
}

export interface ReviewerAvailability {
  status: 'available' | 'busy' | 'out_of_office';
  returnDate?: Date;
  scheduledReviews: ScheduledReview[];
  workingHours: {
    timezone: string;
    schedule: WeeklySchedule;
  };
}

export interface ScheduledReview {
  workflowId: string;
  stepId: string;
  scheduledFor: Date;
  estimatedDuration: number;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  start: string; // HH:MM format
  end: string;
  breaks: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface ReviewerMetrics {
  totalReviews: number;
  averageReviewTime: number;
  approvalRate: number;
  accuracyRate: number;
  timeliness: number;
  qualityScore: number;
  lastEvaluated: Date;
}

export enum ComplianceWorkflowType {
  CLIENT_ONBOARDING = 'CLIENT_ONBOARDING',
  ACCOUNT_OPENING = 'ACCOUNT_OPENING',
  SUITABILITY_REVIEW = 'SUITABILITY_REVIEW',
  KYC_REVIEW = 'KYC_REVIEW',
  AML_REVIEW = 'AML_REVIEW',
  HIGH_RISK_CLIENT = 'HIGH_RISK_CLIENT',
  REGULATORY_CHANGE = 'REGULATORY_CHANGE',
  PERIODIC_REVIEW = 'PERIODIC_REVIEW',
  EXCEPTION_APPROVAL = 'EXCEPTION_APPROVAL'
}

export enum ComplianceWorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  AWAITING_INFORMATION = 'AWAITING_INFORMATION',
  ESCALATED = 'ESCALATED',
  APPROVED = 'APPROVED',
  CONDITIONALLY_APPROVED = 'CONDITIONALLY_APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED'
}

export enum CompliancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

export enum ApprovalStepType {
  DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  REGULATORY_CHECK = 'REGULATORY_CHECK',
  SUITABILITY_ANALYSIS = 'SUITABILITY_ANALYSIS',
  FINAL_APPROVAL = 'FINAL_APPROVAL',
  EXCEPTION_REVIEW = 'EXCEPTION_REVIEW',
  SUPERVISORY_REVIEW = 'SUPERVISORY_REVIEW'
}

export enum ApprovalStepStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED',
  SKIPPED = 'SKIPPED'
}

export enum ReviewerRole {
  COMPLIANCE_ANALYST = 'COMPLIANCE_ANALYST',
  SENIOR_COMPLIANCE_OFFICER = 'SENIOR_COMPLIANCE_OFFICER',
  COMPLIANCE_MANAGER = 'COMPLIANCE_MANAGER',
  CHIEF_COMPLIANCE_OFFICER = 'CHIEF_COMPLIANCE_OFFICER',
  RISK_ANALYST = 'RISK_ANALYST',
  LEGAL_COUNSEL = 'LEGAL_COUNSEL',
  SUPERVISORY_PRINCIPAL = 'SUPERVISORY_PRINCIPAL',
  REGISTERED_REPRESENTATIVE = 'REGISTERED_REPRESENTATIVE'
}

export enum DocumentType {
  CLIENT_APPLICATION = 'CLIENT_APPLICATION',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  FINANCIAL_STATEMENTS = 'FINANCIAL_STATEMENTS',
  RISK_QUESTIONNAIRE = 'RISK_QUESTIONNAIRE',
  INVESTMENT_POLICY = 'INVESTMENT_POLICY',
  REGULATORY_FILING = 'REGULATORY_FILING',
  COMPLIANCE_CHECKLIST = 'COMPLIANCE_CHECKLIST',
  EXCEPTION_REQUEST = 'EXCEPTION_REQUEST'
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum DocumentReviewStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_CLARIFICATION = 'REQUIRES_CLARIFICATION'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RiskFactorType {
  REGULATORY = 'REGULATORY',
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
  REPUTATIONAL = 'REPUTATIONAL',
  TECHNOLOGY = 'TECHNOLOGY',
  FRAUD = 'FRAUD',
  MARKET = 'MARKET',
  CREDIT = 'CREDIT'
}

export enum DecisionType {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CONDITIONAL_APPROVE = 'CONDITIONAL_APPROVE',
  REQUEST_MORE_INFO = 'REQUEST_MORE_INFO',
  ESCALATE = 'ESCALATE'
}

export enum EscalationReason {
  DEADLINE_MISSED = 'DEADLINE_MISSED',
  HIGH_RISK = 'HIGH_RISK',
  REGULATORY_CONCERN = 'REGULATORY_CONCERN',
  POLICY_EXCEPTION = 'POLICY_EXCEPTION',
  REVIEWER_UNAVAILABLE = 'REVIEWER_UNAVAILABLE',
  COMPLEX_CASE = 'COMPLEX_CASE',
  CLIENT_COMPLAINT = 'CLIENT_COMPLAINT'
}

export enum EscalationImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum DeadlineType {
  REGULATORY = 'REGULATORY',
  BUSINESS = 'BUSINESS',
  CLIENT_COMMITMENT = 'CLIENT_COMMITMENT',
  INTERNAL_SLA = 'INTERNAL_SLA'
}

export enum DeadlineStatus {
  ACTIVE = 'ACTIVE',
  MET = 'MET',
  MISSED = 'MISSED',
  EXTENDED = 'EXTENDED',
  CANCELLED = 'CANCELLED'
}

export enum CriteriaType {
  REGULATORY_REQUIREMENT = 'REGULATORY_REQUIREMENT',
  BUSINESS_RULE = 'BUSINESS_RULE',
  RISK_THRESHOLD = 'RISK_THRESHOLD',
  DOCUMENTATION = 'DOCUMENTATION',
  VERIFICATION = 'VERIFICATION'
}

export enum CriteriaStatus {
  PENDING = 'PENDING',
  EVALUATING = 'EVALUATING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export enum CriteriaResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  NOT_EVALUATED = 'NOT_EVALUATED'
}

export class ComplianceApprovalService extends EventEmitter {
  private workflows: Map<string, ComplianceApprovalWorkflow> = new Map();
  private reviewers: Map<string, ComplianceReviewer> = new Map();

  constructor() {
    super();
    this.initializeReviewers();
  }

  private initializeReviewers(): void {
    const mockReviewers: ComplianceReviewer[] = [
      {
        id: 'reviewer-001',
        userId: 'user-001',
        name: 'Sarah Johnson',
        title: 'Senior Compliance Officer',
        department: 'Compliance',
        role: ReviewerRole.SENIOR_COMPLIANCE_OFFICER,
        jurisdiction: ['US', 'NY'],
        specializations: ['KYC', 'AML', 'FINRA'],
        certifications: ['Series 7', 'Series 66', 'CAMS'],
        workload: {
          currentReviews: 5,
          maxCapacity: 15,
          averageReviewTime: 4 * 60 * 60 * 1000 // 4 hours
        },
        availability: {
          status: 'available',
          scheduledReviews: [],
          workingHours: {
            timezone: 'America/New_York',
            schedule: {
              monday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
              tuesday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
              wednesday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
              thursday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
              friday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] }
            }
          }
        },
        performanceMetrics: {
          totalReviews: 250,
          averageReviewTime: 3.5 * 60 * 60 * 1000,
          approvalRate: 85,
          accuracyRate: 95,
          timeliness: 90,
          qualityScore: 92,
          lastEvaluated: new Date()
        }
      },
      {
        id: 'reviewer-002',
        userId: 'user-002',
        name: 'Michael Chen',
        title: 'Compliance Manager',
        department: 'Compliance',
        role: ReviewerRole.COMPLIANCE_MANAGER,
        jurisdiction: ['US'],
        specializations: ['Risk Assessment', 'Regulatory Filings'],
        certifications: ['Series 24', 'FRM'],
        workload: {
          currentReviews: 3,
          maxCapacity: 10,
          averageReviewTime: 6 * 60 * 60 * 1000
        },
        availability: {
          status: 'available',
          scheduledReviews: [],
          workingHours: {
            timezone: 'America/New_York',
            schedule: {
              monday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
              tuesday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
              wednesday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
              thursday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
              friday: { start: '08:00', end: '16:00', breaks: [{ start: '12:00', end: '13:00' }] }
            }
          }
        },
        performanceMetrics: {
          totalReviews: 180,
          averageReviewTime: 5.5 * 60 * 60 * 1000,
          approvalRate: 78,
          accuracyRate: 97,
          timeliness: 88,
          qualityScore: 94,
          lastEvaluated: new Date()
        }
      }
    ];

    mockReviewers.forEach(reviewer => {
      this.reviewers.set(reviewer.id, reviewer);
    });
  }

  async createComplianceWorkflow(
    clientId: string,
    tenantId: string,
    workflowId: string,
    workflowType: ComplianceWorkflowType,
    metadata: ComplianceApprovalWorkflow['metadata']
  ): Promise<ComplianceApprovalWorkflow> {
    const workflow: ComplianceApprovalWorkflow = {
      id: randomUUID(),
      clientId,
      tenantId,
      workflowId,
      workflowType,
      status: ComplianceWorkflowStatus.PENDING,
      priority: this.determinePriority(workflowType, metadata.riskLevel),
      approvalSteps: this.createApprovalSteps(workflowType, metadata),
      reviewers: [],
      documents: [],
      riskAssessment: await this.performInitialRiskAssessment(clientId, metadata),
      decisions: [],
      escalations: [],
      deadlines: this.createDeadlines(workflowType),
      auditTrail: [],
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(workflow.id, workflow);

    this.addAuditRecord(workflow.id, 'WORKFLOW_CREATED', 'system', {
      workflowType,
      clientId,
      metadata
    });

    this.emit('complianceWorkflowCreated', workflow);

    // Auto-assign reviewers and start the workflow
    await this.assignReviewers(workflow.id);
    await this.startWorkflow(workflow.id);

    return workflow;
  }

  private determinePriority(workflowType: ComplianceWorkflowType, riskLevel: string): CompliancePriority {
    if (riskLevel === 'CRITICAL') return CompliancePriority.CRITICAL;
    if (riskLevel === 'HIGH') return CompliancePriority.HIGH;
    
    switch (workflowType) {
      case ComplianceWorkflowType.HIGH_RISK_CLIENT:
        return CompliancePriority.HIGH;
      case ComplianceWorkflowType.REGULATORY_CHANGE:
        return CompliancePriority.URGENT;
      case ComplianceWorkflowType.EXCEPTION_APPROVAL:
        return CompliancePriority.HIGH;
      default:
        return CompliancePriority.MEDIUM;
    }
  }

  private createApprovalSteps(
    workflowType: ComplianceWorkflowType,
    metadata: ComplianceApprovalWorkflow['metadata']
  ): ApprovalStep[] {
    const baseSteps: Omit<ApprovalStep, 'id'>[] = [];

    switch (workflowType) {
      case ComplianceWorkflowType.CLIENT_ONBOARDING:
        baseSteps.push(
          {
            name: 'Document Review',
            description: 'Review all submitted client documents',
            type: ApprovalStepType.DOCUMENT_REVIEW,
            status: ApprovalStepStatus.PENDING,
            order: 1,
            dependencies: [],
            requiredReviewers: [
              { role: ReviewerRole.COMPLIANCE_ANALYST, count: 1 }
            ],
            assignedReviewers: [],
            criteria: [
              {
                id: randomUUID(),
                name: 'Document Completeness',
                description: 'All required documents submitted',
                type: CriteriaType.DOCUMENTATION,
                weight: 30,
                threshold: 100,
                parameters: {},
                evaluationMethod: 'manual',
                status: CriteriaStatus.PENDING
              },
              {
                id: randomUUID(),
                name: 'Document Authenticity',
                description: 'Documents appear authentic',
                type: CriteriaType.VERIFICATION,
                weight: 40,
                threshold: 85,
                parameters: {},
                evaluationMethod: 'hybrid',
                status: CriteriaStatus.PENDING
              }
            ],
            decisions: []
          },
          {
            name: 'Risk Assessment Review',
            description: 'Evaluate client risk profile',
            type: ApprovalStepType.RISK_ASSESSMENT,
            status: ApprovalStepStatus.PENDING,
            order: 2,
            dependencies: ['Document Review'],
            requiredReviewers: [
              { role: ReviewerRole.RISK_ANALYST, count: 1 }
            ],
            assignedReviewers: [],
            criteria: [
              {
                id: randomUUID(),
                name: 'Risk Score Validation',
                description: 'Risk score within acceptable range',
                type: CriteriaType.RISK_THRESHOLD,
                weight: 50,
                threshold: 75,
                parameters: { maxRiskScore: 75 },
                evaluationMethod: 'automated',
                status: CriteriaStatus.PENDING
              }
            ],
            decisions: []
          }
        );
        break;

      case ComplianceWorkflowType.HIGH_RISK_CLIENT:
        baseSteps.push(
          {
            name: 'Enhanced Due Diligence',
            description: 'Perform enhanced due diligence review',
            type: ApprovalStepType.RISK_ASSESSMENT,
            status: ApprovalStepStatus.PENDING,
            order: 1,
            dependencies: [],
            requiredReviewers: [
              { role: ReviewerRole.SENIOR_COMPLIANCE_OFFICER, count: 1 }
            ],
            assignedReviewers: [],
            criteria: [
              {
                id: randomUUID(),
                name: 'Enhanced KYC Review',
                description: 'Additional identity and background verification',
                type: CriteriaType.VERIFICATION,
                weight: 60,
                threshold: 90,
                parameters: {},
                evaluationMethod: 'manual',
                status: CriteriaStatus.PENDING
              }
            ],
            decisions: []
          },
          {
            name: 'Senior Management Approval',
            description: 'Senior management review and approval',
            type: ApprovalStepType.SUPERVISORY_REVIEW,
            status: ApprovalStepStatus.PENDING,
            order: 2,
            dependencies: ['Enhanced Due Diligence'],
            requiredReviewers: [
              { role: ReviewerRole.COMPLIANCE_MANAGER, count: 1 }
            ],
            assignedReviewers: [],
            criteria: [
              {
                id: randomUUID(),
                name: 'Business Justification',
                description: 'Clear business justification for accepting high-risk client',
                type: CriteriaType.BUSINESS_RULE,
                weight: 40,
                threshold: 80,
                parameters: {},
                evaluationMethod: 'manual',
                status: CriteriaStatus.PENDING
              }
            ],
            decisions: []
          }
        );
        break;
    }

    // Add final approval step for all workflows
    baseSteps.push({
      name: 'Final Approval',
      description: 'Final compliance approval',
      type: ApprovalStepType.FINAL_APPROVAL,
      status: ApprovalStepStatus.PENDING,
      order: baseSteps.length + 1,
      dependencies: baseSteps.map(step => step.name),
      requiredReviewers: [
        { 
          role: metadata.riskLevel === 'HIGH' || metadata.riskLevel === 'CRITICAL' 
            ? ReviewerRole.COMPLIANCE_MANAGER 
            : ReviewerRole.SENIOR_COMPLIANCE_OFFICER, 
          count: 1 
        }
      ],
      assignedReviewers: [],
      criteria: [
        {
          id: randomUUID(),
          name: 'Overall Compliance',
          description: 'Overall compliance with all requirements',
          type: CriteriaType.REGULATORY_REQUIREMENT,
          weight: 100,
          threshold: 85,
          parameters: {},
          evaluationMethod: 'manual',
          status: CriteriaStatus.PENDING
        }
      ],
      decisions: []
    });

    return baseSteps.map(step => ({
      ...step,
      id: randomUUID()
    }));
  }

  private async performInitialRiskAssessment(
    clientId: string,
    metadata: ComplianceApprovalWorkflow['metadata']
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    // Geographic risk
    if (['Country1', 'Country2'].includes(metadata.jurisdiction)) {
      riskFactors.push({
        type: RiskFactorType.REGULATORY,
        category: 'Geographic',
        description: `High-risk jurisdiction: ${metadata.jurisdiction}`,
        likelihood: 'high',
        impact: 'medium',
        score: 25,
        source: 'GeographicRiskAssessment',
        detectedAt: new Date(),
        mitigated: false
      });
      riskScore += 25;
    }

    // Account type risk
    if (['CORPORATE', 'LLC', 'TRUST'].includes(metadata.accountType)) {
      riskFactors.push({
        type: RiskFactorType.OPERATIONAL,
        category: 'Account Type',
        description: 'Entity account requires enhanced oversight',
        likelihood: 'medium',
        impact: 'medium',
        score: 15,
        source: 'AccountTypeAssessment',
        detectedAt: new Date(),
        mitigated: false
      });
      riskScore += 15;
    }

    const overallRisk = riskScore >= 50 ? RiskLevel.HIGH :
                       riskScore >= 25 ? RiskLevel.MEDIUM :
                       RiskLevel.LOW;

    return {
      id: randomUUID(),
      overallRisk,
      riskFactors,
      mitigationMeasures: [],
      assessedBy: 'system',
      assessedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      score: riskScore,
      methodology: 'Automated Risk Scoring v1.0',
      assumptions: [
        'Client information is accurate and complete',
        'Regulatory environment remains stable',
        'No adverse information discovered post-assessment'
      ]
    };
  }

  private createDeadlines(workflowType: ComplianceWorkflowType): WorkflowDeadline[] {
    const deadlines: WorkflowDeadline[] = [];
    const now = new Date();

    switch (workflowType) {
      case ComplianceWorkflowType.CLIENT_ONBOARDING:
        // Regulatory deadline for account opening
        const regulatoryDeadline = new Date(now);
        regulatoryDeadline.setDate(now.getDate() + 30);
        
        deadlines.push({
          id: randomUUID(),
          type: DeadlineType.REGULATORY,
          deadline: regulatoryDeadline,
          reminderDates: [
            new Date(regulatoryDeadline.getTime() - 7 * 24 * 60 * 60 * 1000),
            new Date(regulatoryDeadline.getTime() - 3 * 24 * 60 * 60 * 1000),
            new Date(regulatoryDeadline.getTime() - 1 * 24 * 60 * 60 * 1000)
          ],
          status: DeadlineStatus.ACTIVE,
          consequences: ['Regulatory non-compliance', 'Potential penalties'],
          notificationsSent: 0,
          escalationTriggered: false
        });
        break;

      case ComplianceWorkflowType.HIGH_RISK_CLIENT:
        // Urgent review for high-risk clients
        const urgentDeadline = new Date(now);
        urgentDeadline.setDate(now.getDate() + 5);
        
        deadlines.push({
          id: randomUUID(),
          type: DeadlineType.BUSINESS,
          deadline: urgentDeadline,
          reminderDates: [
            new Date(urgentDeadline.getTime() - 2 * 24 * 60 * 60 * 1000),
            new Date(urgentDeadline.getTime() - 1 * 24 * 60 * 60 * 1000)
          ],
          status: DeadlineStatus.ACTIVE,
          consequences: ['Delayed account opening', 'Client dissatisfaction'],
          notificationsSent: 0,
          escalationTriggered: false
        });
        break;
    }

    return deadlines;
  }

  private async assignReviewers(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    for (const step of workflow.approvalSteps) {
      if (step.status !== ApprovalStepStatus.PENDING) continue;

      for (const requirement of step.requiredReviewers) {
        const availableReviewers = this.findAvailableReviewers(requirement, workflow.metadata.jurisdiction);
        const assignedReviewer = this.selectBestReviewer(availableReviewers, workflow.priority);
        
        if (assignedReviewer) {
          step.assignedReviewers.push(assignedReviewer.id);
          workflow.reviewers.push(assignedReviewer);
          
          // Update reviewer workload
          assignedReviewer.workload.currentReviews++;
          
          this.addAuditRecord(workflowId, 'REVIEWER_ASSIGNED', 'system', {
            stepId: step.id,
            reviewerId: assignedReviewer.id,
            reviewerName: assignedReviewer.name
          });
        }
      }

      if (step.assignedReviewers.length > 0) {
        step.status = ApprovalStepStatus.ASSIGNED;
      }
    }

    workflow.updatedAt = new Date();
    this.emit('reviewersAssigned', workflow);
  }

  private findAvailableReviewers(
    requirement: ReviewerRequirement,
    jurisdiction: string
  ): ComplianceReviewer[] {
    return Array.from(this.reviewers.values()).filter(reviewer => {
      // Check role match
      if (reviewer.role !== requirement.role) return false;
      
      // Check availability
      if (reviewer.availability.status !== 'available') return false;
      
      // Check capacity
      if (reviewer.workload.currentReviews >= reviewer.workload.maxCapacity) return false;
      
      // Check jurisdiction
      if (requirement.jurisdiction && !reviewer.jurisdiction.includes(requirement.jurisdiction)) return false;
      
      // Check specialization
      if (requirement.specialization && !reviewer.specializations.includes(requirement.specialization)) return false;
      
      return true;
    });
  }

  private selectBestReviewer(
    availableReviewers: ComplianceReviewer[],
    priority: CompliancePriority
  ): ComplianceReviewer | null {
    if (availableReviewers.length === 0) return null;

    // Sort by performance metrics and workload
    return availableReviewers.sort((a, b) => {
      const aScore = (a.performanceMetrics.qualityScore * 0.4) + 
                    (a.performanceMetrics.timeliness * 0.3) + 
                    ((a.workload.maxCapacity - a.workload.currentReviews) / a.workload.maxCapacity * 100 * 0.3);
      
      const bScore = (b.performanceMetrics.qualityScore * 0.4) + 
                    (b.performanceMetrics.timeliness * 0.3) + 
                    ((b.workload.maxCapacity - b.workload.currentReviews) / b.workload.maxCapacity * 100 * 0.3);
      
      return bScore - aScore;
    })[0];
  }

  private async startWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.status = ComplianceWorkflowStatus.IN_PROGRESS;

    // Start first available step
    const firstStep = workflow.approvalSteps
      .filter(step => step.dependencies.length === 0 && step.status === ApprovalStepStatus.ASSIGNED)
      .sort((a, b) => a.order - b.order)[0];

    if (firstStep) {
      firstStep.status = ApprovalStepStatus.IN_PROGRESS;
      firstStep.startedAt = new Date();
      
      this.addAuditRecord(workflowId, 'STEP_STARTED', 'system', {
        stepId: firstStep.id,
        stepName: firstStep.name
      });
    }

    workflow.updatedAt = new Date();
    this.emit('workflowStarted', workflow);
  }

  async submitDecision(
    workflowId: string,
    stepId: string,
    reviewerId: string,
    decision: DecisionType,
    reasoning: string,
    criteriaEvaluations: CriteriaEvaluation[] = [],
    conditions: string[] = []
  ): Promise<ComplianceDecision> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const step = workflow.approvalSteps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    if (!step.assignedReviewers.includes(reviewerId)) {
      throw new Error('Reviewer not assigned to this step');
    }

    const complianceDecision: ComplianceDecision = {
      id: randomUUID(),
      stepId,
      reviewerId,
      decision,
      reasoning,
      conditions,
      recommendedActions: [],
      confidenceLevel: this.calculateDecisionConfidence(criteriaEvaluations),
      timestamp: new Date()
    };

    workflow.decisions.push(complianceDecision);

    // Update step decision
    step.decisions.push({
      reviewerId,
      decision,
      timestamp: new Date(),
      reasoning,
      criteriaEvaluations
    });

    // Update criteria status
    criteriaEvaluations.forEach(evaluation => {
      const criteria = step.criteria.find(c => c.id === evaluation.criteriaId);
      if (criteria) {
        criteria.status = evaluation.result === CriteriaResult.PASS ? CriteriaStatus.PASSED : CriteriaStatus.FAILED;
        criteria.result = evaluation.result;
        criteria.evaluatedBy = reviewerId;
        criteria.evaluatedAt = new Date();
      }
    });

    this.addAuditRecord(workflowId, 'DECISION_SUBMITTED', reviewerId, {
      stepId,
      decision,
      reasoning,
      criteriaEvaluations
    });

    // Check if step is complete
    await this.checkStepCompletion(workflowId, stepId);

    return complianceDecision;
  }

  private calculateDecisionConfidence(criteriaEvaluations: CriteriaEvaluation[]): number {
    if (criteriaEvaluations.length === 0) return 50;

    const avgScore = criteriaEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / criteriaEvaluations.length;
    return Math.min(100, Math.max(0, avgScore));
  }

  private async checkStepCompletion(workflowId: string, stepId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const step = workflow.approvalSteps.find(s => s.id === stepId);
    if (!step) return;

    // Check if all required reviewers have submitted decisions
    const requiredReviewerCount = step.requiredReviewers.reduce((sum, req) => sum + req.count, 0);
    const submittedDecisions = step.decisions.length;

    if (submittedDecisions >= requiredReviewerCount) {
      step.status = ApprovalStepStatus.COMPLETED;
      step.completedAt = new Date();

      this.addAuditRecord(workflowId, 'STEP_COMPLETED', 'system', {
        stepId,
        stepName: step.name
      });

      // Start next available steps
      await this.startNextSteps(workflowId);
    }
  }

  private async startNextSteps(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const completedStepNames = workflow.approvalSteps
      .filter(step => step.status === ApprovalStepStatus.COMPLETED)
      .map(step => step.name);

    const nextSteps = workflow.approvalSteps.filter(step => 
      step.status === ApprovalStepStatus.ASSIGNED &&
      step.dependencies.every(dep => completedStepNames.includes(dep))
    ).sort((a, b) => a.order - b.order);

    for (const step of nextSteps) {
      step.status = ApprovalStepStatus.IN_PROGRESS;
      step.startedAt = new Date();
      
      this.addAuditRecord(workflowId, 'STEP_STARTED', 'system', {
        stepId: step.id,
        stepName: step.name
      });
    }

    // Check if workflow is complete
    await this.checkWorkflowCompletion(workflowId);
  }

  private async checkWorkflowCompletion(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const allStepsCompleted = workflow.approvalSteps.every(step => step.status === ApprovalStepStatus.COMPLETED);
    
    if (allStepsCompleted) {
      // Determine final decision
      const finalDecisions = workflow.decisions.filter(d => d.decision !== DecisionType.REQUEST_MORE_INFO);
      const rejectionDecisions = finalDecisions.filter(d => d.decision === DecisionType.REJECT);
      const approvalDecisions = finalDecisions.filter(d => d.decision === DecisionType.APPROVE);
      const conditionalApprovals = finalDecisions.filter(d => d.decision === DecisionType.CONDITIONAL_APPROVE);

      if (rejectionDecisions.length > 0) {
        workflow.status = ComplianceWorkflowStatus.REJECTED;
        workflow.rejectedAt = new Date();
      } else if (conditionalApprovals.length > 0) {
        workflow.status = ComplianceWorkflowStatus.CONDITIONALLY_APPROVED;
        workflow.approvedAt = new Date();
      } else if (approvalDecisions.length > 0) {
        workflow.status = ComplianceWorkflowStatus.APPROVED;
        workflow.approvedAt = new Date();
      }

      workflow.completedAt = new Date();
      workflow.updatedAt = new Date();

      this.addAuditRecord(workflowId, 'WORKFLOW_COMPLETED', 'system', {
        finalStatus: workflow.status,
        totalDecisions: finalDecisions.length
      });

      this.emit('workflowCompleted', workflow);
    }
  }

  private addAuditRecord(
    workflowId: string,
    action: string,
    performedBy: string,
    details: Record<string, any>
  ): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const auditRecord: AuditRecord = {
      id: randomUUID(),
      action,
      performedBy,
      timestamp: new Date(),
      details
    };

    workflow.auditTrail.push(auditRecord);
  }

  getWorkflow(workflowId: string): ComplianceApprovalWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflowsByClient(clientId: string, tenantId: string): ComplianceApprovalWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.clientId === clientId && workflow.tenantId === tenantId);
  }

  getWorkflowsByReviewer(reviewerId: string): ComplianceApprovalWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.reviewers.some(r => r.id === reviewerId));
  }

  async getComplianceMetrics(tenantId?: string): Promise<{
    totalWorkflows: number;
    pendingWorkflows: number;
    completedWorkflows: number;
    averageProcessingTime: number;
    approvalRate: number;
    escalationRate: number;
    deadlineMissRate: number;
    reviewerUtilization: Array<{ reviewerId: string; utilization: number }>;
  }> {
    const workflows = Array.from(this.workflows.values())
      .filter(workflow => !tenantId || workflow.tenantId === tenantId);

    const totalWorkflows = workflows.length;
    const pendingWorkflows = workflows.filter(w => 
      [ComplianceWorkflowStatus.PENDING, ComplianceWorkflowStatus.IN_PROGRESS, ComplianceWorkflowStatus.UNDER_REVIEW]
      .includes(w.status)
    ).length;
    const completedWorkflows = workflows.filter(w => w.completedAt).length;

    const completedTimes = workflows
      .filter(w => w.completedAt)
      .map(w => w.completedAt!.getTime() - w.createdAt.getTime());

    const averageProcessingTime = completedTimes.length > 0
      ? completedTimes.reduce((a, b) => a + b, 0) / completedTimes.length
      : 0;

    const approvedWorkflows = workflows.filter(w => 
      [ComplianceWorkflowStatus.APPROVED, ComplianceWorkflowStatus.CONDITIONALLY_APPROVED].includes(w.status)
    ).length;
    const approvalRate = completedWorkflows > 0 ? (approvedWorkflows / completedWorkflows) * 100 : 0;

    const escalatedWorkflows = workflows.filter(w => w.escalations.length > 0).length;
    const escalationRate = totalWorkflows > 0 ? (escalatedWorkflows / totalWorkflows) * 100 : 0;

    const missedDeadlines = workflows
      .flatMap(w => w.deadlines)
      .filter(d => d.status === DeadlineStatus.MISSED).length;
    const totalDeadlines = workflows.flatMap(w => w.deadlines).length;
    const deadlineMissRate = totalDeadlines > 0 ? (missedDeadlines / totalDeadlines) * 100 : 0;

    const reviewerUtilization = Array.from(this.reviewers.values()).map(reviewer => ({
      reviewerId: reviewer.id,
      utilization: (reviewer.workload.currentReviews / reviewer.workload.maxCapacity) * 100
    }));

    return {
      totalWorkflows,
      pendingWorkflows,
      completedWorkflows,
      averageProcessingTime,
      approvalRate,
      escalationRate,
      deadlineMissRate,
      reviewerUtilization
    };
  }
}
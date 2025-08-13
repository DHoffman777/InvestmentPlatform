import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface OnboardingProgress {
  id: string;
  clientId: string;
  tenantId: string;
  workflowId: string;
  status: OnboardingStatus;
  currentPhase: OnboardingPhase;
  overallProgress: number; // 0-100
  phases: PhaseProgress[];
  milestones: Milestone[];
  timelineEstimate: TimelineEstimate;
  dependencies: Dependency[];
  blockers: Blocker[];
  history: ProgressEvent[];
  notifications: NotificationRecord[];
  clientExperience: ClientExperienceMetrics;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
}

export interface PhaseProgress {
  id: string;
  phase: OnboardingPhase;
  status: PhaseStatus;
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration: number; // milliseconds
  actualDuration?: number;
  steps: StepProgress[];
  dependencies: string[];
  blockers: string[];
  requirements: PhaseRequirement[];
}

export interface StepProgress {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  progress: number; // 0-100
  category: StepCategory;
  priority: StepPriority;
  automated: boolean;
  owner: StepOwner;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration: number;
  actualDuration?: number;
  dependencies: string[];
  outputs: StepOutput[];
  validations: StepValidation[];
  userActions: UserAction[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  type: MilestoneType;
  status: MilestoneStatus;
  targetDate: Date;
  actualDate?: Date;
  significance: MilestoneSignificance;
  dependencies: string[];
  criteria: MilestoneCriteria[];
  celebrations?: CelebrationAction[];
}

export interface TimelineEstimate {
  totalEstimatedDuration: number; // milliseconds
  remainingEstimatedDuration: number;
  confidence: number; // 0-100
  factorsConsidered: string[];
  lastUpdated: Date;
  historicalBasis: string;
  bufferTime: number; // additional time for contingencies
  criticalPath: string[];
}

export interface Dependency {
  id: string;
  name: string;
  type: DependencyType;
  status: DependencyStatus;
  provider: string;
  requiredBy: string[];
  estimatedResolutionTime?: number;
  actualResolutionTime?: number;
  priority: DependencyPriority;
  escalated: boolean;
}

export interface Blocker {
  id: string;
  name: string;
  description: string;
  type: BlockerType;
  severity: BlockerSeverity;
  status: BlockerStatus;
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string;
  estimatedResolutionTime?: number;
  actualResolutionTime?: number;
  resolutionActions: ResolutionAction[];
  impact: BlockerImpact;
  escalated: boolean;
}

export interface ProgressEvent {
  id: string;
  timestamp: Date;
  type: ProgressEventType;
  phase?: OnboardingPhase;
  stepId?: string;
  milestoneId?: string;
  description: string;
  actor: string;
  actorType: 'client' | 'system' | 'reviewer' | 'admin';
  metadata: Record<string, any>;
  impact: EventImpact;
}

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  recipient: string;
  channel: NotificationChannel;
  subject: string;
  content: string;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  status: NotificationStatus;
  relatedStepId?: string;
  relatedMilestoneId?: string;
}

export interface ClientExperienceMetrics {
  satisfactionScore?: number; // 1-10
  frustrationPoints: FrustrationPoint[];
  completionRate: number;
  dropOffPoints: DropOffPoint[];
  averageSessionDuration: number;
  totalSessions: number;
  helpRequests: HelpRequest[];
  feedback: ClientFeedback[];
  preferredCommunicationChannel: NotificationChannel;
}

export interface PhaseRequirement {
  id: string;
  name: string;
  type: RequirementType;
  status: RequirementStatus;
  mandatory: boolean;
  description: string;
  validationCriteria: ValidationCriteria[];
}

export interface StepOutput {
  id: string;
  name: string;
  type: OutputType;
  status: OutputStatus;
  value?: any;
  validatedAt?: Date;
  validatedBy?: string;
}

export interface StepValidation {
  id: string;
  name: string;
  type: ValidationType;
  status: ValidationStatus;
  automated: boolean;
  result?: ValidationResult;
  performedAt?: Date;
  performedBy?: string;
}

export interface UserAction {
  id: string;
  name: string;
  description: string;
  type: ActionType;
  status: ActionStatus;
  required: boolean;
  completedAt?: Date;
  completedBy?: string;
  instructions: string;
  helpText?: string;
  estimatedTime: number;
}

export interface MilestoneCriteria {
  id: string;
  name: string;
  description: string;
  type: CriteriaType;
  status: CriteriaStatus;
  weight: number;
  threshold: number;
  currentValue?: number;
  evaluatedAt?: Date;
}

export interface CelebrationAction {
  type: 'email' | 'sms' | 'in_app' | 'call';
  message: string;
  timing: 'immediate' | 'next_business_day' | 'scheduled';
  scheduledFor?: Date;
}

export interface ResolutionAction {
  id: string;
  action: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: ActionStatus;
  completedAt?: Date;
  notes?: string;
}

export interface BlockerImpact {
  affectedSteps: string[];
  affectedMilestones: string[];
  delayEstimate: number; // milliseconds
  severityLevel: number; // 1-10
  businessImpact: string;
}

export interface FrustrationPoint {
  stepId: string;
  stepName: string;
  issue: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolutionTime?: number;
}

export interface DropOffPoint {
  stepId: string;
  stepName: string;
  timestamp: Date;
  reason?: string;
  recovered: boolean;
  recoveryTime?: number;
}

export interface HelpRequest {
  id: string;
  stepId: string;
  type: 'question' | 'issue' | 'clarification';
  content: string;
  submittedAt: Date;
  respondedAt?: Date;
  responseTime?: number;
  satisfaction?: number; // 1-5
}

export interface ClientFeedback {
  id: string;
  type: 'complaint' | 'suggestion' | 'praise';
  content: string;
  rating?: number; // 1-10
  submittedAt: Date;
  category: string;
  actionTaken?: string;
}

export interface ValidationCriteria {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export enum OnboardingPhase {
  INITIATION = 'INITIATION',
  DOCUMENT_COLLECTION = 'DOCUMENT_COLLECTION',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  KYC_AML_REVIEW = 'KYC_AML_REVIEW',
  COMPLIANCE_APPROVAL = 'COMPLIANCE_APPROVAL',
  ACCOUNT_SETUP = 'ACCOUNT_SETUP',
  FUNDING_SETUP = 'FUNDING_SETUP',
  FINAL_REVIEW = 'FINAL_REVIEW',
  COMPLETION = 'COMPLETION'
}

export enum PhaseStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  SKIPPED = 'SKIPPED'
}

export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  BLOCKED = 'BLOCKED'
}

export enum StepCategory {
  CLIENT_ACTION = 'CLIENT_ACTION',
  DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',
  SYSTEM_PROCESS = 'SYSTEM_PROCESS',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  VERIFICATION = 'VERIFICATION',
  APPROVAL = 'APPROVAL'
}

export enum StepPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum StepOwner {
  CLIENT = 'CLIENT',
  SYSTEM = 'SYSTEM',
  COMPLIANCE = 'COMPLIANCE',
  OPERATIONS = 'OPERATIONS',
  THIRD_PARTY = 'THIRD_PARTY'
}

export enum MilestoneType {
  REGULATORY = 'REGULATORY',
  BUSINESS = 'BUSINESS',
  CLIENT_EXPERIENCE = 'CLIENT_EXPERIENCE',
  SYSTEM = 'SYSTEM'
}

export enum MilestoneStatus {
  UPCOMING = 'UPCOMING',
  IN_PROGRESS = 'IN_PROGRESS',
  ACHIEVED = 'ACHIEVED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED'
}

export enum MilestoneSignificance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum DependencyType {
  INTERNAL_SYSTEM = 'INTERNAL_SYSTEM',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  HUMAN_ACTION = 'HUMAN_ACTION',
  REGULATORY_APPROVAL = 'REGULATORY_APPROVAL',
  DOCUMENT_SUBMISSION = 'DOCUMENT_SUBMISSION'
}

export enum DependencyStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  FAILED = 'FAILED',
  ESCALATED = 'ESCALATED'
}

export enum DependencyPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum BlockerType {
  TECHNICAL = 'TECHNICAL',
  REGULATORY = 'REGULATORY',
  OPERATIONAL = 'OPERATIONAL',
  CLIENT_ACTION = 'CLIENT_ACTION',
  THIRD_PARTY = 'THIRD_PARTY',
  RESOURCE = 'RESOURCE'
}

export enum BlockerSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum BlockerStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED'
}

export enum ProgressEventType {
  PHASE_STARTED = 'PHASE_STARTED',
  PHASE_COMPLETED = 'PHASE_COMPLETED',
  STEP_STARTED = 'STEP_STARTED',
  STEP_COMPLETED = 'STEP_COMPLETED',
  MILESTONE_ACHIEVED = 'MILESTONE_ACHIEVED',
  BLOCKER_REPORTED = 'BLOCKER_REPORTED',
  BLOCKER_RESOLVED = 'BLOCKER_RESOLVED',
  DEPENDENCY_RESOLVED = 'DEPENDENCY_RESOLVED',
  TIMELINE_UPDATED = 'TIMELINE_UPDATED'
}

export enum NotificationType {
  WELCOME = 'WELCOME',
  STEP_REMINDER = 'STEP_REMINDER',
  MILESTONE_ACHIEVED = 'MILESTONE_ACHIEVED',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  STATUS_UPDATE = 'STATUS_UPDATE',
  COMPLETION = 'COMPLETION',
  DELAY_NOTIFICATION = 'DELAY_NOTIFICATION'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
  PHONE = 'PHONE',
  PORTAL = 'PORTAL'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  FAILED = 'FAILED'
}

export enum EventImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RequirementType {
  DOCUMENT = 'DOCUMENT',
  VERIFICATION = 'VERIFICATION',
  APPROVAL = 'APPROVAL',
  SYSTEM_CHECK = 'SYSTEM_CHECK',
  CLIENT_ACTION = 'CLIENT_ACTION'
}

export enum RequirementStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SATISFIED = 'SATISFIED',
  FAILED = 'FAILED'
}

export enum OutputType {
  DOCUMENT = 'DOCUMENT',
  DATA = 'DATA',
  DECISION = 'DECISION',
  APPROVAL = 'APPROVAL',
  VERIFICATION = 'VERIFICATION'
}

export enum OutputStatus {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED'
}

export enum ValidationType {
  COMPLETENESS = 'COMPLETENESS',
  ACCURACY = 'ACCURACY',
  COMPLIANCE = 'COMPLIANCE',
  FORMAT = 'FORMAT',
  AUTHENTICITY = 'AUTHENTICITY'
}

export enum ValidationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED'
}

export enum ActionType {
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  FILL_FORM = 'FILL_FORM',
  VERIFY_IDENTITY = 'VERIFY_IDENTITY',
  REVIEW_TERMS = 'REVIEW_TERMS',
  PROVIDE_INFORMATION = 'PROVIDE_INFORMATION',
  CONFIRM_DETAILS = 'CONFIRM_DETAILS'
}

export enum ActionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

export enum CriteriaType {
  THRESHOLD = 'THRESHOLD',
  BOOLEAN = 'BOOLEAN',
  ENUMERATION = 'ENUMERATION',
  CALCULATION = 'CALCULATION'
}

export enum CriteriaStatus {
  PENDING = 'PENDING',
  MET = 'MET',
  NOT_MET = 'NOT_MET',
  PARTIALLY_MET = 'PARTIALLY_MET'
}

export class OnboardingProgressService extends EventEmitter {
  private progressRecords: Map<string, OnboardingProgress> = new Map();

  constructor() {
    super();
  }

  async initializeProgress(
    clientId: string,
    tenantId: string,
    workflowId: string,
    clientType: 'individual' | 'entity' | 'trust',
    accountType: string
  ): Promise<OnboardingProgress> {
    const progressId = randomUUID();
    
    const phases = this.createPhases(clientType, accountType);
    const milestones = this.createMilestones(phases);
    const timeline = this.calculateInitialTimeline(phases);

    const progress: OnboardingProgress = {
      id: progressId,
      clientId,
      tenantId,
      workflowId,
      status: OnboardingStatus.NOT_STARTED,
      currentPhase: OnboardingPhase.INITIATION,
      overallProgress: 0,
      phases,
      milestones,
      timelineEstimate: timeline,
      dependencies: [],
      blockers: [],
      history: [],
      notifications: [],
      clientExperience: {
        completionRate: 0,
        frustrationPoints: [],
        dropOffPoints: [],
        averageSessionDuration: 0,
        totalSessions: 0,
        helpRequests: [],
        feedback: [],
        preferredCommunicationChannel: NotificationChannel.EMAIL
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.progressRecords.set(progressId, progress);

    this.addProgressEvent(progressId, {
      type: ProgressEventType.PHASE_STARTED,
      phase: OnboardingPhase.INITIATION,
      description: 'Onboarding process initiated',
      actor: 'system',
      actorType: 'system',
      metadata: { clientType, accountType },
      impact: EventImpact.MEDIUM
    });

    this.emit('progressInitialized', progress);
    return progress;
  }

  private createPhases(clientType: string, accountType: string): PhaseProgress[] {
    const basePhases: Omit<PhaseProgress, 'id'>[] = [
      {
        phase: OnboardingPhase.INITIATION,
        status: PhaseStatus.PENDING,
        progress: 0,
        estimatedDuration: 2 * 60 * 60 * 1000, // 2 hours
        steps: [
          {
            id: randomUUID(),
            name: 'Welcome and Orientation',
            description: 'Client introduction and process overview',
            status: StepStatus.PENDING,
            progress: 0,
            category: StepCategory.CLIENT_ACTION,
            priority: StepPriority.HIGH,
            automated: false,
            owner: StepOwner.CLIENT,
            estimatedDuration: 30 * 60 * 1000, // 30 minutes
            dependencies: [],
            outputs: [],
            validations: [],
            userActions: [
              {
                id: randomUUID(),
                name: 'Review Welcome Materials',
                description: 'Review onboarding guide and timeline',
                type: ActionType.REVIEW_TERMS,
                status: ActionStatus.PENDING,
                required: true,
                instructions: 'Please review the provided onboarding materials',
                estimatedTime: 15 * 60 * 1000
              }
            ]
          },
          {
            id: randomUUID(),
            name: 'Initial Data Collection',
            description: 'Collect basic client information',
            status: StepStatus.PENDING,
            progress: 0,
            category: StepCategory.CLIENT_ACTION,
            priority: StepPriority.HIGH,
            automated: false,
            owner: StepOwner.CLIENT,
            estimatedDuration: 90 * 60 * 1000, // 90 minutes
            dependencies: [],
            outputs: [],
            validations: [],
            userActions: [
              {
                id: randomUUID(),
                name: 'Complete Application Form',
                description: 'Fill out the account application',
                type: ActionType.FILL_FORM,
                status: ActionStatus.PENDING,
                required: true,
                instructions: 'Complete all required fields in the application form',
                estimatedTime: 60 * 60 * 1000
              }
            ]
          }
        ],
        dependencies: [],
        blockers: [],
        requirements: [
          {
            id: randomUUID(),
            name: 'Client Contact Information',
            type: RequirementType.CLIENT_ACTION,
            status: RequirementStatus.PENDING,
            mandatory: true,
            description: 'Valid contact information provided',
            validationCriteria: []
          }
        ]
      },
      {
        phase: OnboardingPhase.DOCUMENT_COLLECTION,
        status: PhaseStatus.PENDING,
        progress: 0,
        estimatedDuration: 24 * 60 * 60 * 1000, // 24 hours
        steps: [
          {
            id: randomUUID(),
            name: 'Identity Documents Upload',
            description: 'Upload government-issued ID',
            status: StepStatus.PENDING,
            progress: 0,
            category: StepCategory.CLIENT_ACTION,
            priority: StepPriority.CRITICAL,
            automated: false,
            owner: StepOwner.CLIENT,
            estimatedDuration: 30 * 60 * 1000,
            dependencies: [],
            outputs: [],
            validations: [],
            userActions: [
              {
                id: randomUUID(),
                name: 'Upload Driver License',
                description: 'Upload front and back of driver license',
                type: ActionType.UPLOAD_DOCUMENT,
                status: ActionStatus.PENDING,
                required: true,
                instructions: 'Take clear photos of both sides of your driver license',
                estimatedTime: 15 * 60 * 1000
              }
            ]
          }
        ],
        dependencies: ['INITIATION'],
        blockers: [],
        requirements: []
      }
    ];

    // Add entity-specific phases
    if (clientType === 'entity') {
      basePhases.push({
        phase: OnboardingPhase.COMPLIANCE_APPROVAL,
        status: PhaseStatus.PENDING,
        progress: 0,
        estimatedDuration: 5 * 24 * 60 * 60 * 1000, // 5 days
        steps: [
          {
            id: randomUUID(),
            name: 'Entity Documentation Review',
            description: 'Review entity formation documents',
            status: StepStatus.PENDING,
            progress: 0,
            category: StepCategory.DOCUMENT_REVIEW,
            priority: StepPriority.HIGH,
            automated: false,
            owner: StepOwner.COMPLIANCE,
            estimatedDuration: 4 * 60 * 60 * 1000,
            dependencies: [],
            outputs: [],
            validations: [],
            userActions: []
          }
        ],
        dependencies: ['DOCUMENT_COLLECTION'],
        blockers: [],
        requirements: []
      });
    }

    return basePhases.map(phase => ({
      ...phase,
      id: randomUUID()
    }));
  }

  private createMilestones(phases: PhaseProgress[]): Milestone[] {
    const milestones: Milestone[] = [];
    let currentDate = new Date();

    // Document submission milestone
    currentDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    milestones.push({
      id: randomUUID(),
      name: 'Documents Submitted',
      description: 'All required documents have been submitted',
      type: MilestoneType.CLIENT_EXPERIENCE,
      status: MilestoneStatus.UPCOMING,
      targetDate: currentDate,
      significance: MilestoneSignificance.HIGH,
      dependencies: ['DOCUMENT_COLLECTION'],
      criteria: [
        {
          id: randomUUID(),
          name: 'Document Completeness',
          description: 'All required documents uploaded',
          type: CriteriaType.BOOLEAN,
          status: CriteriaStatus.PENDING,
          weight: 100,
          threshold: 1
        }
      ],
      celebrations: [
        {
          type: 'email',
          message: 'Great progress! All your documents have been received.',
          timing: 'immediate'
        }
      ]
    });

    // Identity verified milestone
    currentDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
    milestones.push({
      id: randomUUID(),
      name: 'Identity Verified',
      description: 'Client identity has been successfully verified',
      type: MilestoneType.REGULATORY,
      status: MilestoneStatus.UPCOMING,
      targetDate: currentDate,
      significance: MilestoneSignificance.CRITICAL,
      dependencies: ['IDENTITY_VERIFICATION'],
      criteria: [
        {
          id: randomUUID(),
          name: 'Identity Verification Score',
          description: 'Identity verification confidence above threshold',
          type: CriteriaType.THRESHOLD,
          status: CriteriaStatus.PENDING,
          weight: 100,
          threshold: 85
        }
      ]
    });

    // Account approved milestone
    currentDate = new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
    milestones.push({
      id: randomUUID(),
      name: 'Account Approved',
      description: 'Account has received final approval',
      type: MilestoneType.BUSINESS,
      status: MilestoneStatus.UPCOMING,
      targetDate: currentDate,
      significance: MilestoneSignificance.CRITICAL,
      dependencies: ['COMPLIANCE_APPROVAL'],
      criteria: [
        {
          id: randomUUID(),
          name: 'Compliance Approval',
          description: 'Final compliance approval received',
          type: CriteriaType.BOOLEAN,
          status: CriteriaStatus.PENDING,
          weight: 100,
          threshold: 1
        }
      ],
      celebrations: [
        {
          type: 'email',
          message: 'Congratulations! Your account has been approved.',
          timing: 'immediate'
        },
        {
          type: 'phone',
          message: 'Welcome call from relationship manager',
          timing: 'next_business_day'
        }
      ]
    });

    return milestones;
  }

  private calculateInitialTimeline(phases: PhaseProgress[]): TimelineEstimate {
    const totalDuration = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
    const bufferTime = totalDuration * 0.2; // 20% buffer

    return {
      totalEstimatedDuration: totalDuration + bufferTime,
      remainingEstimatedDuration: totalDuration + bufferTime,
      confidence: 75,
      factorsConsidered: [
        'Historical completion times',
        'Phase dependencies',
        'Client type complexity',
        'Regulatory requirements'
      ],
      lastUpdated: new Date(),
      historicalBasis: 'Based on last 100 similar onboardings',
      bufferTime,
      criticalPath: phases.map(p => p.phase)
    };
  }

  async updateStepProgress(
    progressId: string,
    stepId: string,
    newStatus: StepStatus,
    progressPercentage?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) {
      throw new Error('Progress record not found');
    }

    const step = this.findStepById(progress, stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    const oldStatus = step.status;
    step.status = newStatus;
    
    if (progressPercentage !== undefined) {
      step.progress = Math.max(0, Math.min(100, progressPercentage));
    }

    if (newStatus === StepStatus.IN_PROGRESS && !step.startedAt) {
      step.startedAt = new Date();
    }

    if (newStatus === StepStatus.COMPLETED && !step.completedAt) {
      step.completedAt = new Date();
      step.progress = 100;
      
      if (step.startedAt) {
        step.actualDuration = step.completedAt.getTime() - step.startedAt.getTime();
      }
    }

    this.addProgressEvent(progressId, {
      type: ProgressEventType.STEP_COMPLETED,
      stepId,
      description: `Step "${step.name}" ${newStatus.toLowerCase()}`,
      actor: 'system',
      actorType: 'system',
      metadata: metadata || {},
      impact: step.priority === StepPriority.CRITICAL ? EventImpact.HIGH : EventImpact.MEDIUM
    });

    // Update phase progress
    await this.updatePhaseProgress(progressId);
    
    // Update overall progress
    await this.updateOverallProgress(progressId);

    // Check for milestone achievements
    await this.checkMilestoneAchievements(progressId);

    // Update timeline estimates
    await this.updateTimelineEstimate(progressId);

    progress.updatedAt = new Date();
    this.emit('stepProgressUpdated', { progress, step, oldStatus, newStatus });
  }

  private findStepById(progress: OnboardingProgress, stepId: string): StepProgress | null {
    for (const phase of progress.phases) {
      const step = phase.steps.find(s => s.id === stepId);
      if (step) return step;
    }
    return null;
  }

  private async updatePhaseProgress(progressId: string): Promise<void> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) return;

    for (const phase of progress.phases) {
      const totalSteps = phase.steps.length;
      if (totalSteps === 0) {
        phase.progress = 100;
        continue;
      }

      const completedSteps = phase.steps.filter(s => s.status === StepStatus.COMPLETED).length;
      const inProgressSteps = phase.steps.filter(s => s.status === StepStatus.IN_PROGRESS);
      
      let progressSum = completedSteps * 100;
      progressSum += inProgressSteps.reduce((sum, step) => sum + step.progress, 0);
      
      phase.progress = Math.round(progressSum / totalSteps);

      // Update phase status
      const oldStatus = phase.status;
      if (completedSteps === totalSteps) {
        phase.status = PhaseStatus.COMPLETED;
        if (!phase.completedAt) {
          phase.completedAt = new Date();
          if (phase.startedAt) {
            phase.actualDuration = phase.completedAt.getTime() - phase.startedAt.getTime();
          }
        }
      } else if (inProgressSteps.length > 0 || completedSteps > 0) {
        if (phase.status === PhaseStatus.PENDING) {
          phase.status = PhaseStatus.IN_PROGRESS;
          phase.startedAt = new Date();
        }
      }

      if (oldStatus !== phase.status && phase.status === PhaseStatus.COMPLETED) {
        this.addProgressEvent(progressId, {
          type: ProgressEventType.PHASE_COMPLETED,
          phase: phase.phase,
          description: `Phase "${phase.phase}" completed`,
          actor: 'system',
          actorType: 'system',
          metadata: { phaseProgress: phase.progress },
          impact: EventImpact.HIGH
        });
      }
    }
  }

  private async updateOverallProgress(progressId: string): Promise<void> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) return;

    const totalPhases = progress.phases.length;
    if (totalPhases === 0) {
      progress.overallProgress = 0;
      return;
    }

    const progressSum = progress.phases.reduce((sum, phase) => sum + phase.progress, 0);
    progress.overallProgress = Math.round(progressSum / totalPhases);

    // Update current phase
    const inProgressPhase = progress.phases.find(p => p.status === PhaseStatus.IN_PROGRESS);
    if (inProgressPhase) {
      progress.currentPhase = inProgressPhase.phase;
    }

    // Update overall status
    const allPhasesCompleted = progress.phases.every(p => p.status === PhaseStatus.COMPLETED);
    const hasBlockedPhases = progress.phases.some(p => p.status === PhaseStatus.BLOCKED);
    
    if (allPhasesCompleted) {
      progress.status = OnboardingStatus.COMPLETED;
      progress.actualCompletionDate = new Date();
    } else if (hasBlockedPhases) {
      progress.status = OnboardingStatus.BLOCKED;
    } else if (progress.overallProgress > 0) {
      progress.status = OnboardingStatus.IN_PROGRESS;
    }
  }

  private async checkMilestoneAchievements(progressId: string): Promise<void> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) return;

    for (const milestone of progress.milestones) {
      if (milestone.status !== MilestoneStatus.UPCOMING) continue;

      // Check if all dependencies are met
      const dependenciesMet = milestone.dependencies.every(dep => {
        const phase = progress.phases.find(p => p.phase === dep);
        return phase?.status === PhaseStatus.COMPLETED;
      });

      if (!dependenciesMet) continue;

      // Evaluate criteria
      let criteriaMet = 0;
      for (const criteria of milestone.criteria) {
        const evaluation = await this.evaluateMilestoneCriteria(progress, criteria);
        if (evaluation) {
          criteriaMet++;
          criteria.status = CriteriaStatus.MET;
          criteria.currentValue = evaluation.value;
          criteria.evaluatedAt = new Date();
        }
      }

      if (criteriaMet === milestone.criteria.length) {
        milestone.status = MilestoneStatus.ACHIEVED;
        milestone.actualDate = new Date();

        this.addProgressEvent(progressId, {
          type: ProgressEventType.MILESTONE_ACHIEVED,
          milestoneId: milestone.id,
          description: `Milestone "${milestone.name}" achieved`,
          actor: 'system',
          actorType: 'system',
          metadata: { milestoneType: milestone.type },
          impact: milestone.significance === MilestoneSignificance.CRITICAL ? EventImpact.CRITICAL : EventImpact.HIGH
        });

        // Trigger celebrations
        if (milestone.celebrations) {
          for (const celebration of milestone.celebrations) {
            await this.triggerCelebration(progress, celebration);
          }
        }

        this.emit('milestoneAchieved', { progress, milestone });
      }
    }
  }

  private async evaluateMilestoneCriteria(
    progress: OnboardingProgress,
    criteria: MilestoneCriteria
  ): Promise<{ value: number } | null> {
    // Mock evaluation logic - in real implementation, this would integrate with actual services
    switch (criteria.name) {
      case 'Document Completeness':
        const documentPhase = progress.phases.find(p => p.phase === OnboardingPhase.DOCUMENT_COLLECTION);
        return documentPhase?.status === PhaseStatus.COMPLETED ? { value: 1 } : null;
      
      case 'Identity Verification Score':
        const identityPhase = progress.phases.find(p => p.phase === OnboardingPhase.IDENTITY_VERIFICATION);
        if (identityPhase?.status === PhaseStatus.COMPLETED) {
          return { value: Math.random() * 20 + 80 }; // Mock score 80-100
        }
        return null;
      
      case 'Compliance Approval':
        const compliancePhase = progress.phases.find(p => p.phase === OnboardingPhase.COMPLIANCE_APPROVAL);
        return compliancePhase?.status === PhaseStatus.COMPLETED ? { value: 1 } : null;
      
      default:
        return null;
    }
  }

  private async triggerCelebration(
    progress: OnboardingProgress,
    celebration: CelebrationAction
  ): Promise<void> {
    const notification: NotificationRecord = {
      id: randomUUID(),
      type: NotificationType.MILESTONE_ACHIEVED,
      recipient: progress.clientId,
      channel: celebration.type as NotificationChannel,
      subject: 'Milestone Achievement',
      content: celebration.message,
      sentAt: celebration.timing === 'immediate' ? new Date() : celebration.scheduledFor || new Date(),
      status: NotificationStatus.PENDING
    };

    progress.notifications.push(notification);
    this.emit('celebrationTriggered', { progress, celebration, notification });
  }

  private async updateTimelineEstimate(progressId: string): Promise<void> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) return;

    const completedPhases = progress.phases.filter(p => p.status === PhaseStatus.COMPLETED);
    const remainingPhases = progress.phases.filter(p => p.status !== PhaseStatus.COMPLETED);

    // Calculate actual vs estimated time for completed phases
    let accuracyScore = 0;
    let totalVariance = 0;

    for (const phase of completedPhases) {
      if (phase.actualDuration && phase.estimatedDuration) {
        const variance = Math.abs(phase.actualDuration - phase.estimatedDuration) / phase.estimatedDuration;
        totalVariance += variance;
      }
    }

    if (completedPhases.length > 0) {
      const avgVariance = totalVariance / completedPhases.length;
      accuracyScore = Math.max(0, 100 - (avgVariance * 100));
    }

    // Update remaining time estimate
    let remainingTime = 0;
    for (const phase of remainingPhases) {
      const adjustmentFactor = accuracyScore > 70 ? 1 : 1.2; // Add buffer if accuracy is low
      remainingTime += phase.estimatedDuration * adjustmentFactor;
    }

    progress.timelineEstimate.remainingEstimatedDuration = remainingTime;
    progress.timelineEstimate.confidence = Math.max(50, accuracyScore);
    progress.timelineEstimate.lastUpdated = new Date();

    if (remainingTime > 0) {
      progress.estimatedCompletionDate = new Date(Date.now() + remainingTime);
    }
  }

  async reportBlocker(
    progressId: string,
    blocker: Omit<Blocker, 'id' | 'reportedAt' | 'escalated'>
  ): Promise<Blocker> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) {
      throw new Error('Progress record not found');
    }

    const newBlocker: Blocker = {
      ...blocker,
      id: randomUUID(),
      reportedAt: new Date(),
      escalated: false,
      resolutionActions: []
    };

    progress.blockers.push(newBlocker);

    // Update affected steps and phases
    for (const stepId of newBlocker.impact.affectedSteps) {
      const step = this.findStepById(progress, stepId);
      if (step) {
        step.status = StepStatus.BLOCKED;
      }
    }

    this.addProgressEvent(progressId, {
      type: ProgressEventType.BLOCKER_REPORTED,
      description: `Blocker reported: ${blocker.name}`,
      actor: blocker.reportedBy,
      actorType: 'system',
      metadata: { blockerId: newBlocker.id, severity: blocker.severity },
      impact: blocker.severity === BlockerSeverity.CRITICAL ? EventImpact.CRITICAL : EventImpact.HIGH
    });

    // Auto-escalate critical blockers
    if (blocker.severity === BlockerSeverity.CRITICAL) {
      // Trigger escalation logic
    }

    progress.updatedAt = new Date();
    this.emit('blockerReported', { progress, blocker: newBlocker });

    return newBlocker;
  }

  async resolveBlocker(
    progressId: string,
    blockerId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<void> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) {
      throw new Error('Progress record not found');
    }

    const blocker = progress.blockers.find(b => b.id === blockerId);
    if (!blocker) {
      throw new Error('Blocker not found');
    }

    blocker.status = BlockerStatus.RESOLVED;
    if (blocker.estimatedResolutionTime) {
      blocker.actualResolutionTime = Date.now() - blocker.reportedAt.getTime();
    }

    // Unblock affected steps
    for (const stepId of blocker.impact.affectedSteps) {
      const step = this.findStepById(progress, stepId);
      if (step && step.status === StepStatus.BLOCKED) {
        step.status = StepStatus.PENDING; // Reset to pending so it can be restarted
      }
    }

    this.addProgressEvent(progressId, {
      type: ProgressEventType.BLOCKER_RESOLVED,
      description: `Blocker resolved: ${blocker.name}`,
      actor: resolvedBy,
      actorType: 'admin',
      metadata: { 
        blockerId, 
        resolution,
        resolutionTime: blocker.actualResolutionTime 
      },
      impact: EventImpact.MEDIUM
    });

    progress.updatedAt = new Date();
    this.emit('blockerResolved', { progress, blocker, resolution });
  }

  private addProgressEvent(
    progressId: string,
    eventData: Omit<ProgressEvent, 'id' | 'timestamp'>
  ): void {
    const progress = this.progressRecords.get(progressId);
    if (!progress) return;

    const event: ProgressEvent = {
      ...eventData,
      id: randomUUID(),
      timestamp: new Date()
    };

    progress.history.push(event);

    // Keep only last 100 events to manage memory
    if (progress.history.length > 100) {
      progress.history = progress.history.slice(-100);
    }
  }

  getProgress(progressId: string): OnboardingProgress | undefined {
    return this.progressRecords.get(progressId);
  }

  getProgressByWorkflow(workflowId: string): OnboardingProgress | undefined {
    return Array.from(this.progressRecords.values())
      .find(progress => progress.workflowId === workflowId);
  }

  getProgressByClient(clientId: string, tenantId: string): OnboardingProgress[] {
    return Array.from(this.progressRecords.values())
      .filter(progress => progress.clientId === clientId && progress.tenantId === tenantId);
  }

  async getProgressSummary(progressId: string): Promise<{
    overallStatus: OnboardingStatus;
    overallProgress: number;
    currentPhase: OnboardingPhase;
    nextMilestone: Milestone | null;
    estimatedCompletion: Date | null;
    activeBlockers: number;
    recentEvents: ProgressEvent[];
  }> {
    const progress = this.progressRecords.get(progressId);
    if (!progress) {
      throw new Error('Progress record not found');
    }

    const nextMilestone = progress.milestones
      .filter(m => m.status === MilestoneStatus.UPCOMING)
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())[0] || null;

    const activeBlockers = progress.blockers.filter(b => 
      [BlockerStatus.OPEN, BlockerStatus.IN_PROGRESS].includes(b.status)
    ).length;

    const recentEvents = progress.history
      .slice(-10)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      overallStatus: progress.status,
      overallProgress: progress.overallProgress,
      currentPhase: progress.currentPhase,
      nextMilestone,
      estimatedCompletion: progress.estimatedCompletionDate || null,
      activeBlockers,
      recentEvents
    };
  }

  async getProgressMetrics(tenantId?: string): Promise<{
    totalOnboardings: number;
    activeOnboardings: number;
    completedOnboardings: number;
    averageCompletionTime: number;
    completionRate: number;
    commonBlockers: Array<{ type: BlockerType; count: number }>;
    phaseCompletionRates: Record<OnboardingPhase, number>;
  }> {
    const progressRecords = Array.from(this.progressRecords.values())
      .filter(progress => !tenantId || progress.tenantId === tenantId);

    const totalOnboardings = progressRecords.length;
    const activeOnboardings = progressRecords.filter(p => 
      p.status === OnboardingStatus.IN_PROGRESS
    ).length;
    const completedOnboardings = progressRecords.filter(p => 
      p.status === OnboardingStatus.COMPLETED
    ).length;

    const completionTimes = progressRecords
      .filter(p => p.actualCompletionDate)
      .map(p => p.actualCompletionDate!.getTime() - p.createdAt.getTime());

    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    const completionRate = totalOnboardings > 0 ? (completedOnboardings / totalOnboardings) * 100 : 0;

    const blockerTypes = progressRecords
      .flatMap(p => p.blockers)
      .reduce((acc, blocker) => {
        acc[blocker.type] = (acc[blocker.type] || 0) + 1;
        return acc;
      }, {} as Record<BlockerType, number>);

    const commonBlockers = Object.entries(blockerTypes)
      .map(([type, count]) => ({ type: type as BlockerType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const phaseCompletionRates: Record<OnboardingPhase, number> = {} as Record<OnboardingPhase, number>;
    Object.values(OnboardingPhase).forEach(phase => {
      const phasesWithThisType = progressRecords
        .flatMap(p => p.phases)
        .filter(ph => ph.phase === phase);
      
      const completedPhases = phasesWithThisType.filter(ph => ph.status === PhaseStatus.COMPLETED).length;
      phaseCompletionRates[phase] = phasesWithThisType.length > 0 
        ? (completedPhases / phasesWithThisType.length) * 100 
        : 0;
    });

    return {
      totalOnboardings,
      activeOnboardings,
      completedOnboardings,
      averageCompletionTime,
      completionRate,
      commonBlockers,
      phaseCompletionRates
    };
  }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingProgressService = exports.CriteriaStatus = exports.CriteriaType = exports.ActionStatus = exports.ActionType = exports.ValidationStatus = exports.ValidationType = exports.OutputStatus = exports.OutputType = exports.RequirementStatus = exports.RequirementType = exports.EventImpact = exports.NotificationStatus = exports.NotificationChannel = exports.NotificationType = exports.ProgressEventType = exports.BlockerStatus = exports.BlockerSeverity = exports.BlockerType = exports.DependencyPriority = exports.DependencyStatus = exports.DependencyType = exports.MilestoneSignificance = exports.MilestoneStatus = exports.MilestoneType = exports.StepOwner = exports.StepPriority = exports.StepCategory = exports.StepStatus = exports.PhaseStatus = exports.OnboardingPhase = exports.OnboardingStatus = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["NOT_STARTED"] = "NOT_STARTED";
    OnboardingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    OnboardingStatus["BLOCKED"] = "BLOCKED";
    OnboardingStatus["COMPLETED"] = "COMPLETED";
    OnboardingStatus["CANCELLED"] = "CANCELLED";
    OnboardingStatus["FAILED"] = "FAILED";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));
var OnboardingPhase;
(function (OnboardingPhase) {
    OnboardingPhase["INITIATION"] = "INITIATION";
    OnboardingPhase["DOCUMENT_COLLECTION"] = "DOCUMENT_COLLECTION";
    OnboardingPhase["IDENTITY_VERIFICATION"] = "IDENTITY_VERIFICATION";
    OnboardingPhase["KYC_AML_REVIEW"] = "KYC_AML_REVIEW";
    OnboardingPhase["COMPLIANCE_APPROVAL"] = "COMPLIANCE_APPROVAL";
    OnboardingPhase["ACCOUNT_SETUP"] = "ACCOUNT_SETUP";
    OnboardingPhase["FUNDING_SETUP"] = "FUNDING_SETUP";
    OnboardingPhase["FINAL_REVIEW"] = "FINAL_REVIEW";
    OnboardingPhase["COMPLETION"] = "COMPLETION";
})(OnboardingPhase || (exports.OnboardingPhase = OnboardingPhase = {}));
var PhaseStatus;
(function (PhaseStatus) {
    PhaseStatus["PENDING"] = "PENDING";
    PhaseStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PhaseStatus["COMPLETED"] = "COMPLETED";
    PhaseStatus["BLOCKED"] = "BLOCKED";
    PhaseStatus["SKIPPED"] = "SKIPPED";
})(PhaseStatus || (exports.PhaseStatus = PhaseStatus = {}));
var StepStatus;
(function (StepStatus) {
    StepStatus["PENDING"] = "PENDING";
    StepStatus["IN_PROGRESS"] = "IN_PROGRESS";
    StepStatus["COMPLETED"] = "COMPLETED";
    StepStatus["FAILED"] = "FAILED";
    StepStatus["SKIPPED"] = "SKIPPED";
    StepStatus["BLOCKED"] = "BLOCKED";
})(StepStatus || (exports.StepStatus = StepStatus = {}));
var StepCategory;
(function (StepCategory) {
    StepCategory["CLIENT_ACTION"] = "CLIENT_ACTION";
    StepCategory["DOCUMENT_REVIEW"] = "DOCUMENT_REVIEW";
    StepCategory["SYSTEM_PROCESS"] = "SYSTEM_PROCESS";
    StepCategory["COMPLIANCE_CHECK"] = "COMPLIANCE_CHECK";
    StepCategory["VERIFICATION"] = "VERIFICATION";
    StepCategory["APPROVAL"] = "APPROVAL";
})(StepCategory || (exports.StepCategory = StepCategory = {}));
var StepPriority;
(function (StepPriority) {
    StepPriority["LOW"] = "LOW";
    StepPriority["MEDIUM"] = "MEDIUM";
    StepPriority["HIGH"] = "HIGH";
    StepPriority["CRITICAL"] = "CRITICAL";
})(StepPriority || (exports.StepPriority = StepPriority = {}));
var StepOwner;
(function (StepOwner) {
    StepOwner["CLIENT"] = "CLIENT";
    StepOwner["SYSTEM"] = "SYSTEM";
    StepOwner["COMPLIANCE"] = "COMPLIANCE";
    StepOwner["OPERATIONS"] = "OPERATIONS";
    StepOwner["THIRD_PARTY"] = "THIRD_PARTY";
})(StepOwner || (exports.StepOwner = StepOwner = {}));
var MilestoneType;
(function (MilestoneType) {
    MilestoneType["REGULATORY"] = "REGULATORY";
    MilestoneType["BUSINESS"] = "BUSINESS";
    MilestoneType["CLIENT_EXPERIENCE"] = "CLIENT_EXPERIENCE";
    MilestoneType["SYSTEM"] = "SYSTEM";
})(MilestoneType || (exports.MilestoneType = MilestoneType = {}));
var MilestoneStatus;
(function (MilestoneStatus) {
    MilestoneStatus["UPCOMING"] = "UPCOMING";
    MilestoneStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MilestoneStatus["ACHIEVED"] = "ACHIEVED";
    MilestoneStatus["MISSED"] = "MISSED";
    MilestoneStatus["CANCELLED"] = "CANCELLED";
})(MilestoneStatus || (exports.MilestoneStatus = MilestoneStatus = {}));
var MilestoneSignificance;
(function (MilestoneSignificance) {
    MilestoneSignificance["LOW"] = "LOW";
    MilestoneSignificance["MEDIUM"] = "MEDIUM";
    MilestoneSignificance["HIGH"] = "HIGH";
    MilestoneSignificance["CRITICAL"] = "CRITICAL";
})(MilestoneSignificance || (exports.MilestoneSignificance = MilestoneSignificance = {}));
var DependencyType;
(function (DependencyType) {
    DependencyType["INTERNAL_SYSTEM"] = "INTERNAL_SYSTEM";
    DependencyType["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
    DependencyType["HUMAN_ACTION"] = "HUMAN_ACTION";
    DependencyType["REGULATORY_APPROVAL"] = "REGULATORY_APPROVAL";
    DependencyType["DOCUMENT_SUBMISSION"] = "DOCUMENT_SUBMISSION";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
var DependencyStatus;
(function (DependencyStatus) {
    DependencyStatus["PENDING"] = "PENDING";
    DependencyStatus["IN_PROGRESS"] = "IN_PROGRESS";
    DependencyStatus["RESOLVED"] = "RESOLVED";
    DependencyStatus["FAILED"] = "FAILED";
    DependencyStatus["ESCALATED"] = "ESCALATED";
})(DependencyStatus || (exports.DependencyStatus = DependencyStatus = {}));
var DependencyPriority;
(function (DependencyPriority) {
    DependencyPriority["LOW"] = "LOW";
    DependencyPriority["MEDIUM"] = "MEDIUM";
    DependencyPriority["HIGH"] = "HIGH";
    DependencyPriority["CRITICAL"] = "CRITICAL";
})(DependencyPriority || (exports.DependencyPriority = DependencyPriority = {}));
var BlockerType;
(function (BlockerType) {
    BlockerType["TECHNICAL"] = "TECHNICAL";
    BlockerType["REGULATORY"] = "REGULATORY";
    BlockerType["OPERATIONAL"] = "OPERATIONAL";
    BlockerType["CLIENT_ACTION"] = "CLIENT_ACTION";
    BlockerType["THIRD_PARTY"] = "THIRD_PARTY";
    BlockerType["RESOURCE"] = "RESOURCE";
})(BlockerType || (exports.BlockerType = BlockerType = {}));
var BlockerSeverity;
(function (BlockerSeverity) {
    BlockerSeverity["LOW"] = "LOW";
    BlockerSeverity["MEDIUM"] = "MEDIUM";
    BlockerSeverity["HIGH"] = "HIGH";
    BlockerSeverity["CRITICAL"] = "CRITICAL";
})(BlockerSeverity || (exports.BlockerSeverity = BlockerSeverity = {}));
var BlockerStatus;
(function (BlockerStatus) {
    BlockerStatus["OPEN"] = "OPEN";
    BlockerStatus["IN_PROGRESS"] = "IN_PROGRESS";
    BlockerStatus["RESOLVED"] = "RESOLVED";
    BlockerStatus["ESCALATED"] = "ESCALATED";
    BlockerStatus["CLOSED"] = "CLOSED";
})(BlockerStatus || (exports.BlockerStatus = BlockerStatus = {}));
var ProgressEventType;
(function (ProgressEventType) {
    ProgressEventType["PHASE_STARTED"] = "PHASE_STARTED";
    ProgressEventType["PHASE_COMPLETED"] = "PHASE_COMPLETED";
    ProgressEventType["STEP_STARTED"] = "STEP_STARTED";
    ProgressEventType["STEP_COMPLETED"] = "STEP_COMPLETED";
    ProgressEventType["MILESTONE_ACHIEVED"] = "MILESTONE_ACHIEVED";
    ProgressEventType["BLOCKER_REPORTED"] = "BLOCKER_REPORTED";
    ProgressEventType["BLOCKER_RESOLVED"] = "BLOCKER_RESOLVED";
    ProgressEventType["DEPENDENCY_RESOLVED"] = "DEPENDENCY_RESOLVED";
    ProgressEventType["TIMELINE_UPDATED"] = "TIMELINE_UPDATED";
})(ProgressEventType || (exports.ProgressEventType = ProgressEventType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["WELCOME"] = "WELCOME";
    NotificationType["STEP_REMINDER"] = "STEP_REMINDER";
    NotificationType["MILESTONE_ACHIEVED"] = "MILESTONE_ACHIEVED";
    NotificationType["ACTION_REQUIRED"] = "ACTION_REQUIRED";
    NotificationType["STATUS_UPDATE"] = "STATUS_UPDATE";
    NotificationType["COMPLETION"] = "COMPLETION";
    NotificationType["DELAY_NOTIFICATION"] = "DELAY_NOTIFICATION";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["IN_APP"] = "IN_APP";
    NotificationChannel["PHONE"] = "PHONE";
    NotificationChannel["PORTAL"] = "PORTAL";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "PENDING";
    NotificationStatus["SENT"] = "SENT";
    NotificationStatus["DELIVERED"] = "DELIVERED";
    NotificationStatus["OPENED"] = "OPENED";
    NotificationStatus["CLICKED"] = "CLICKED";
    NotificationStatus["FAILED"] = "FAILED";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var EventImpact;
(function (EventImpact) {
    EventImpact["LOW"] = "LOW";
    EventImpact["MEDIUM"] = "MEDIUM";
    EventImpact["HIGH"] = "HIGH";
    EventImpact["CRITICAL"] = "CRITICAL";
})(EventImpact || (exports.EventImpact = EventImpact = {}));
var RequirementType;
(function (RequirementType) {
    RequirementType["DOCUMENT"] = "DOCUMENT";
    RequirementType["VERIFICATION"] = "VERIFICATION";
    RequirementType["APPROVAL"] = "APPROVAL";
    RequirementType["SYSTEM_CHECK"] = "SYSTEM_CHECK";
    RequirementType["CLIENT_ACTION"] = "CLIENT_ACTION";
})(RequirementType || (exports.RequirementType = RequirementType = {}));
var RequirementStatus;
(function (RequirementStatus) {
    RequirementStatus["PENDING"] = "PENDING";
    RequirementStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RequirementStatus["SATISFIED"] = "SATISFIED";
    RequirementStatus["FAILED"] = "FAILED";
})(RequirementStatus || (exports.RequirementStatus = RequirementStatus = {}));
var OutputType;
(function (OutputType) {
    OutputType["DOCUMENT"] = "DOCUMENT";
    OutputType["DATA"] = "DATA";
    OutputType["DECISION"] = "DECISION";
    OutputType["APPROVAL"] = "APPROVAL";
    OutputType["VERIFICATION"] = "VERIFICATION";
})(OutputType || (exports.OutputType = OutputType = {}));
var OutputStatus;
(function (OutputStatus) {
    OutputStatus["PENDING"] = "PENDING";
    OutputStatus["GENERATED"] = "GENERATED";
    OutputStatus["VALIDATED"] = "VALIDATED";
    OutputStatus["REJECTED"] = "REJECTED";
})(OutputStatus || (exports.OutputStatus = OutputStatus = {}));
var ValidationType;
(function (ValidationType) {
    ValidationType["COMPLETENESS"] = "COMPLETENESS";
    ValidationType["ACCURACY"] = "ACCURACY";
    ValidationType["COMPLIANCE"] = "COMPLIANCE";
    ValidationType["FORMAT"] = "FORMAT";
    ValidationType["AUTHENTICITY"] = "AUTHENTICITY";
})(ValidationType || (exports.ValidationType = ValidationType = {}));
var ValidationStatus;
(function (ValidationStatus) {
    ValidationStatus["PENDING"] = "PENDING";
    ValidationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ValidationStatus["PASSED"] = "PASSED";
    ValidationStatus["FAILED"] = "FAILED";
})(ValidationStatus || (exports.ValidationStatus = ValidationStatus = {}));
var ActionType;
(function (ActionType) {
    ActionType["UPLOAD_DOCUMENT"] = "UPLOAD_DOCUMENT";
    ActionType["FILL_FORM"] = "FILL_FORM";
    ActionType["VERIFY_IDENTITY"] = "VERIFY_IDENTITY";
    ActionType["REVIEW_TERMS"] = "REVIEW_TERMS";
    ActionType["PROVIDE_INFORMATION"] = "PROVIDE_INFORMATION";
    ActionType["CONFIRM_DETAILS"] = "CONFIRM_DETAILS";
})(ActionType || (exports.ActionType = ActionType = {}));
var ActionStatus;
(function (ActionStatus) {
    ActionStatus["PENDING"] = "PENDING";
    ActionStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ActionStatus["COMPLETED"] = "COMPLETED";
    ActionStatus["SKIPPED"] = "SKIPPED";
})(ActionStatus || (exports.ActionStatus = ActionStatus = {}));
var CriteriaType;
(function (CriteriaType) {
    CriteriaType["THRESHOLD"] = "THRESHOLD";
    CriteriaType["BOOLEAN"] = "BOOLEAN";
    CriteriaType["ENUMERATION"] = "ENUMERATION";
    CriteriaType["CALCULATION"] = "CALCULATION";
})(CriteriaType || (exports.CriteriaType = CriteriaType = {}));
var CriteriaStatus;
(function (CriteriaStatus) {
    CriteriaStatus["PENDING"] = "PENDING";
    CriteriaStatus["MET"] = "MET";
    CriteriaStatus["NOT_MET"] = "NOT_MET";
    CriteriaStatus["PARTIALLY_MET"] = "PARTIALLY_MET";
})(CriteriaStatus || (exports.CriteriaStatus = CriteriaStatus = {}));
class OnboardingProgressService extends events_1.EventEmitter {
    progressRecords = new Map();
    constructor() {
        super();
    }
    async initializeProgress(clientId, tenantId, workflowId, clientType, accountType) {
        const progressId = (0, crypto_1.randomUUID)();
        const phases = this.createPhases(clientType, accountType);
        const milestones = this.createMilestones(phases);
        const timeline = this.calculateInitialTimeline(phases);
        const progress = {
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
    createPhases(clientType, accountType) {
        const basePhases = [
            {
                phase: OnboardingPhase.INITIATION,
                status: PhaseStatus.PENDING,
                progress: 0,
                estimatedDuration: 2 * 60 * 60 * 1000, // 2 hours
                steps: [
                    {
                        id: (0, crypto_1.randomUUID)(),
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
                                id: (0, crypto_1.randomUUID)(),
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
                        id: (0, crypto_1.randomUUID)(),
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
                                id: (0, crypto_1.randomUUID)(),
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
                        id: (0, crypto_1.randomUUID)(),
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
                        id: (0, crypto_1.randomUUID)(),
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
                                id: (0, crypto_1.randomUUID)(),
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
                        id: (0, crypto_1.randomUUID)(),
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
            id: (0, crypto_1.randomUUID)()
        }));
    }
    createMilestones(phases) {
        const milestones = [];
        let currentDate = new Date();
        // Document submission milestone
        currentDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        milestones.push({
            id: (0, crypto_1.randomUUID)(),
            name: 'Documents Submitted',
            description: 'All required documents have been submitted',
            type: MilestoneType.CLIENT_EXPERIENCE,
            status: MilestoneStatus.UPCOMING,
            targetDate: currentDate,
            significance: MilestoneSignificance.HIGH,
            dependencies: ['DOCUMENT_COLLECTION'],
            criteria: [
                {
                    id: (0, crypto_1.randomUUID)(),
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
            id: (0, crypto_1.randomUUID)(),
            name: 'Identity Verified',
            description: 'Client identity has been successfully verified',
            type: MilestoneType.REGULATORY,
            status: MilestoneStatus.UPCOMING,
            targetDate: currentDate,
            significance: MilestoneSignificance.CRITICAL,
            dependencies: ['IDENTITY_VERIFICATION'],
            criteria: [
                {
                    id: (0, crypto_1.randomUUID)(),
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
            id: (0, crypto_1.randomUUID)(),
            name: 'Account Approved',
            description: 'Account has received final approval',
            type: MilestoneType.BUSINESS,
            status: MilestoneStatus.UPCOMING,
            targetDate: currentDate,
            significance: MilestoneSignificance.CRITICAL,
            dependencies: ['COMPLIANCE_APPROVAL'],
            criteria: [
                {
                    id: (0, crypto_1.randomUUID)(),
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
    calculateInitialTimeline(phases) {
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
    async updateStepProgress(progressId, stepId, newStatus, progressPercentage, metadata) {
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
    findStepById(progress, stepId) {
        for (const phase of progress.phases) {
            const step = phase.steps.find(s => s.id === stepId);
            if (step)
                return step;
        }
        return null;
    }
    async updatePhaseProgress(progressId) {
        const progress = this.progressRecords.get(progressId);
        if (!progress)
            return;
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
            }
            else if (inProgressSteps.length > 0 || completedSteps > 0) {
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
    async updateOverallProgress(progressId) {
        const progress = this.progressRecords.get(progressId);
        if (!progress)
            return;
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
        }
        else if (hasBlockedPhases) {
            progress.status = OnboardingStatus.BLOCKED;
        }
        else if (progress.overallProgress > 0) {
            progress.status = OnboardingStatus.IN_PROGRESS;
        }
    }
    async checkMilestoneAchievements(progressId) {
        const progress = this.progressRecords.get(progressId);
        if (!progress)
            return;
        for (const milestone of progress.milestones) {
            if (milestone.status !== MilestoneStatus.UPCOMING)
                continue;
            // Check if all dependencies are met
            const dependenciesMet = milestone.dependencies.every(dep => {
                const phase = progress.phases.find(p => p.phase === dep);
                return phase?.status === PhaseStatus.COMPLETED;
            });
            if (!dependenciesMet)
                continue;
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
    async evaluateMilestoneCriteria(progress, criteria) {
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
    async triggerCelebration(progress, celebration) {
        const notification = {
            id: (0, crypto_1.randomUUID)(),
            type: NotificationType.MILESTONE_ACHIEVED,
            recipient: progress.clientId,
            channel: celebration.type,
            subject: 'Milestone Achievement',
            content: celebration.message,
            sentAt: celebration.timing === 'immediate' ? new Date() : celebration.scheduledFor || new Date(),
            status: NotificationStatus.PENDING
        };
        progress.notifications.push(notification);
        this.emit('celebrationTriggered', { progress, celebration, notification });
    }
    async updateTimelineEstimate(progressId) {
        const progress = this.progressRecords.get(progressId);
        if (!progress)
            return;
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
    async reportBlocker(progressId, blocker) {
        const progress = this.progressRecords.get(progressId);
        if (!progress) {
            throw new Error('Progress record not found');
        }
        const newBlocker = {
            ...blocker,
            id: (0, crypto_1.randomUUID)(),
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
    async resolveBlocker(progressId, blockerId, resolution, resolvedBy) {
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
    addProgressEvent(progressId, eventData) {
        const progress = this.progressRecords.get(progressId);
        if (!progress)
            return;
        const event = {
            ...eventData,
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date()
        };
        progress.history.push(event);
        // Keep only last 100 events to manage memory
        if (progress.history.length > 100) {
            progress.history = progress.history.slice(-100);
        }
    }
    getProgress(progressId) {
        return this.progressRecords.get(progressId);
    }
    getProgressByWorkflow(workflowId) {
        return Array.from(this.progressRecords.values())
            .find(progress => progress.workflowId === workflowId);
    }
    getProgressByClient(clientId, tenantId) {
        return Array.from(this.progressRecords.values())
            .filter(progress => progress.clientId === clientId && progress.tenantId === tenantId);
    }
    async getProgressSummary(progressId) {
        const progress = this.progressRecords.get(progressId);
        if (!progress) {
            throw new Error('Progress record not found');
        }
        const nextMilestone = progress.milestones
            .filter(m => m.status === MilestoneStatus.UPCOMING)
            .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())[0] || null;
        const activeBlockers = progress.blockers.filter(b => [BlockerStatus.OPEN, BlockerStatus.IN_PROGRESS].includes(b.status)).length;
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
    async getProgressMetrics(tenantId) {
        const progressRecords = Array.from(this.progressRecords.values())
            .filter(progress => !tenantId || progress.tenantId === tenantId);
        const totalOnboardings = progressRecords.length;
        const activeOnboardings = progressRecords.filter(p => p.status === OnboardingStatus.IN_PROGRESS).length;
        const completedOnboardings = progressRecords.filter(p => p.status === OnboardingStatus.COMPLETED).length;
        const completionTimes = progressRecords
            .filter(p => p.actualCompletionDate)
            .map(p => p.actualCompletionDate.getTime() - p.createdAt.getTime());
        const averageCompletionTime = completionTimes.length > 0
            ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
            : 0;
        const completionRate = totalOnboardings > 0 ? (completedOnboardings / totalOnboardings) * 100 : 0;
        const blockerTypes = progressRecords
            .flatMap(p => p.blockers)
            .reduce((acc, blocker) => {
            acc[blocker.type] = (acc[blocker.type] || 0) + 1;
            return acc;
        }, {});
        const commonBlockers = Object.entries(blockerTypes)
            .map(([type, count]) => ({ type: type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const phaseCompletionRates = {};
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
exports.OnboardingProgressService = OnboardingProgressService;

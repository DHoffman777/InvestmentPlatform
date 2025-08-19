"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceApprovalService = exports.CriteriaResult = exports.CriteriaStatus = exports.CriteriaType = exports.DeadlineStatus = exports.DeadlineType = exports.EscalationImpact = exports.EscalationReason = exports.DecisionType = exports.RiskFactorType = exports.RiskLevel = exports.DocumentReviewStatus = exports.DocumentStatus = exports.DocumentType = exports.ReviewerRole = exports.ApprovalStepStatus = exports.ApprovalStepType = exports.CompliancePriority = exports.ComplianceWorkflowStatus = exports.ComplianceWorkflowType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var ComplianceWorkflowType;
(function (ComplianceWorkflowType) {
    ComplianceWorkflowType["CLIENT_ONBOARDING"] = "CLIENT_ONBOARDING";
    ComplianceWorkflowType["ACCOUNT_OPENING"] = "ACCOUNT_OPENING";
    ComplianceWorkflowType["SUITABILITY_REVIEW"] = "SUITABILITY_REVIEW";
    ComplianceWorkflowType["KYC_REVIEW"] = "KYC_REVIEW";
    ComplianceWorkflowType["AML_REVIEW"] = "AML_REVIEW";
    ComplianceWorkflowType["HIGH_RISK_CLIENT"] = "HIGH_RISK_CLIENT";
    ComplianceWorkflowType["REGULATORY_CHANGE"] = "REGULATORY_CHANGE";
    ComplianceWorkflowType["PERIODIC_REVIEW"] = "PERIODIC_REVIEW";
    ComplianceWorkflowType["EXCEPTION_APPROVAL"] = "EXCEPTION_APPROVAL";
})(ComplianceWorkflowType || (exports.ComplianceWorkflowType = ComplianceWorkflowType = {}));
var ComplianceWorkflowStatus;
(function (ComplianceWorkflowStatus) {
    ComplianceWorkflowStatus["PENDING"] = "PENDING";
    ComplianceWorkflowStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ComplianceWorkflowStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ComplianceWorkflowStatus["AWAITING_INFORMATION"] = "AWAITING_INFORMATION";
    ComplianceWorkflowStatus["ESCALATED"] = "ESCALATED";
    ComplianceWorkflowStatus["APPROVED"] = "APPROVED";
    ComplianceWorkflowStatus["CONDITIONALLY_APPROVED"] = "CONDITIONALLY_APPROVED";
    ComplianceWorkflowStatus["REJECTED"] = "REJECTED";
    ComplianceWorkflowStatus["WITHDRAWN"] = "WITHDRAWN";
    ComplianceWorkflowStatus["EXPIRED"] = "EXPIRED";
})(ComplianceWorkflowStatus || (exports.ComplianceWorkflowStatus = ComplianceWorkflowStatus = {}));
var CompliancePriority;
(function (CompliancePriority) {
    CompliancePriority["LOW"] = "LOW";
    CompliancePriority["MEDIUM"] = "MEDIUM";
    CompliancePriority["HIGH"] = "HIGH";
    CompliancePriority["URGENT"] = "URGENT";
    CompliancePriority["CRITICAL"] = "CRITICAL";
})(CompliancePriority || (exports.CompliancePriority = CompliancePriority = {}));
var ApprovalStepType;
(function (ApprovalStepType) {
    ApprovalStepType["DOCUMENT_REVIEW"] = "DOCUMENT_REVIEW";
    ApprovalStepType["RISK_ASSESSMENT"] = "RISK_ASSESSMENT";
    ApprovalStepType["REGULATORY_CHECK"] = "REGULATORY_CHECK";
    ApprovalStepType["SUITABILITY_ANALYSIS"] = "SUITABILITY_ANALYSIS";
    ApprovalStepType["FINAL_APPROVAL"] = "FINAL_APPROVAL";
    ApprovalStepType["EXCEPTION_REVIEW"] = "EXCEPTION_REVIEW";
    ApprovalStepType["SUPERVISORY_REVIEW"] = "SUPERVISORY_REVIEW";
})(ApprovalStepType || (exports.ApprovalStepType = ApprovalStepType = {}));
var ApprovalStepStatus;
(function (ApprovalStepStatus) {
    ApprovalStepStatus["PENDING"] = "PENDING";
    ApprovalStepStatus["ASSIGNED"] = "ASSIGNED";
    ApprovalStepStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ApprovalStepStatus["COMPLETED"] = "COMPLETED";
    ApprovalStepStatus["ESCALATED"] = "ESCALATED";
    ApprovalStepStatus["SKIPPED"] = "SKIPPED";
})(ApprovalStepStatus || (exports.ApprovalStepStatus = ApprovalStepStatus = {}));
var ReviewerRole;
(function (ReviewerRole) {
    ReviewerRole["COMPLIANCE_ANALYST"] = "COMPLIANCE_ANALYST";
    ReviewerRole["SENIOR_COMPLIANCE_OFFICER"] = "SENIOR_COMPLIANCE_OFFICER";
    ReviewerRole["COMPLIANCE_MANAGER"] = "COMPLIANCE_MANAGER";
    ReviewerRole["CHIEF_COMPLIANCE_OFFICER"] = "CHIEF_COMPLIANCE_OFFICER";
    ReviewerRole["RISK_ANALYST"] = "RISK_ANALYST";
    ReviewerRole["LEGAL_COUNSEL"] = "LEGAL_COUNSEL";
    ReviewerRole["SUPERVISORY_PRINCIPAL"] = "SUPERVISORY_PRINCIPAL";
    ReviewerRole["REGISTERED_REPRESENTATIVE"] = "REGISTERED_REPRESENTATIVE";
})(ReviewerRole || (exports.ReviewerRole = ReviewerRole = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["CLIENT_APPLICATION"] = "CLIENT_APPLICATION";
    DocumentType["IDENTITY_VERIFICATION"] = "IDENTITY_VERIFICATION";
    DocumentType["FINANCIAL_STATEMENTS"] = "FINANCIAL_STATEMENTS";
    DocumentType["RISK_QUESTIONNAIRE"] = "RISK_QUESTIONNAIRE";
    DocumentType["INVESTMENT_POLICY"] = "INVESTMENT_POLICY";
    DocumentType["REGULATORY_FILING"] = "REGULATORY_FILING";
    DocumentType["COMPLIANCE_CHECKLIST"] = "COMPLIANCE_CHECKLIST";
    DocumentType["EXCEPTION_REQUEST"] = "EXCEPTION_REQUEST";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["UPLOADED"] = "UPLOADED";
    DocumentStatus["PROCESSING"] = "PROCESSING";
    DocumentStatus["VERIFIED"] = "VERIFIED";
    DocumentStatus["REJECTED"] = "REJECTED";
    DocumentStatus["EXPIRED"] = "EXPIRED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var DocumentReviewStatus;
(function (DocumentReviewStatus) {
    DocumentReviewStatus["PENDING"] = "PENDING";
    DocumentReviewStatus["IN_PROGRESS"] = "IN_PROGRESS";
    DocumentReviewStatus["APPROVED"] = "APPROVED";
    DocumentReviewStatus["REJECTED"] = "REJECTED";
    DocumentReviewStatus["REQUIRES_CLARIFICATION"] = "REQUIRES_CLARIFICATION";
})(DocumentReviewStatus || (exports.DocumentReviewStatus = DocumentReviewStatus = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var RiskFactorType;
(function (RiskFactorType) {
    RiskFactorType["REGULATORY"] = "REGULATORY";
    RiskFactorType["OPERATIONAL"] = "OPERATIONAL";
    RiskFactorType["FINANCIAL"] = "FINANCIAL";
    RiskFactorType["REPUTATIONAL"] = "REPUTATIONAL";
    RiskFactorType["TECHNOLOGY"] = "TECHNOLOGY";
    RiskFactorType["FRAUD"] = "FRAUD";
    RiskFactorType["MARKET"] = "MARKET";
    RiskFactorType["CREDIT"] = "CREDIT";
})(RiskFactorType || (exports.RiskFactorType = RiskFactorType = {}));
var DecisionType;
(function (DecisionType) {
    DecisionType["APPROVE"] = "APPROVE";
    DecisionType["REJECT"] = "REJECT";
    DecisionType["CONDITIONAL_APPROVE"] = "CONDITIONAL_APPROVE";
    DecisionType["REQUEST_MORE_INFO"] = "REQUEST_MORE_INFO";
    DecisionType["ESCALATE"] = "ESCALATE";
})(DecisionType || (exports.DecisionType = DecisionType = {}));
var EscalationReason;
(function (EscalationReason) {
    EscalationReason["DEADLINE_MISSED"] = "DEADLINE_MISSED";
    EscalationReason["HIGH_RISK"] = "HIGH_RISK";
    EscalationReason["REGULATORY_CONCERN"] = "REGULATORY_CONCERN";
    EscalationReason["POLICY_EXCEPTION"] = "POLICY_EXCEPTION";
    EscalationReason["REVIEWER_UNAVAILABLE"] = "REVIEWER_UNAVAILABLE";
    EscalationReason["COMPLEX_CASE"] = "COMPLEX_CASE";
    EscalationReason["CLIENT_COMPLAINT"] = "CLIENT_COMPLAINT";
})(EscalationReason || (exports.EscalationReason = EscalationReason = {}));
var EscalationImpact;
(function (EscalationImpact) {
    EscalationImpact["LOW"] = "LOW";
    EscalationImpact["MEDIUM"] = "MEDIUM";
    EscalationImpact["HIGH"] = "HIGH";
    EscalationImpact["CRITICAL"] = "CRITICAL";
})(EscalationImpact || (exports.EscalationImpact = EscalationImpact = {}));
var DeadlineType;
(function (DeadlineType) {
    DeadlineType["REGULATORY"] = "REGULATORY";
    DeadlineType["BUSINESS"] = "BUSINESS";
    DeadlineType["CLIENT_COMMITMENT"] = "CLIENT_COMMITMENT";
    DeadlineType["INTERNAL_SLA"] = "INTERNAL_SLA";
})(DeadlineType || (exports.DeadlineType = DeadlineType = {}));
var DeadlineStatus;
(function (DeadlineStatus) {
    DeadlineStatus["ACTIVE"] = "ACTIVE";
    DeadlineStatus["MET"] = "MET";
    DeadlineStatus["MISSED"] = "MISSED";
    DeadlineStatus["EXTENDED"] = "EXTENDED";
    DeadlineStatus["CANCELLED"] = "CANCELLED";
})(DeadlineStatus || (exports.DeadlineStatus = DeadlineStatus = {}));
var CriteriaType;
(function (CriteriaType) {
    CriteriaType["REGULATORY_REQUIREMENT"] = "REGULATORY_REQUIREMENT";
    CriteriaType["BUSINESS_RULE"] = "BUSINESS_RULE";
    CriteriaType["RISK_THRESHOLD"] = "RISK_THRESHOLD";
    CriteriaType["DOCUMENTATION"] = "DOCUMENTATION";
    CriteriaType["VERIFICATION"] = "VERIFICATION";
})(CriteriaType || (exports.CriteriaType = CriteriaType = {}));
var CriteriaStatus;
(function (CriteriaStatus) {
    CriteriaStatus["PENDING"] = "PENDING";
    CriteriaStatus["EVALUATING"] = "EVALUATING";
    CriteriaStatus["PASSED"] = "PASSED";
    CriteriaStatus["FAILED"] = "FAILED";
    CriteriaStatus["NOT_APPLICABLE"] = "NOT_APPLICABLE";
})(CriteriaStatus || (exports.CriteriaStatus = CriteriaStatus = {}));
var CriteriaResult;
(function (CriteriaResult) {
    CriteriaResult["PASS"] = "PASS";
    CriteriaResult["FAIL"] = "FAIL";
    CriteriaResult["WARNING"] = "WARNING";
    CriteriaResult["NOT_EVALUATED"] = "NOT_EVALUATED";
})(CriteriaResult || (exports.CriteriaResult = CriteriaResult = {}));
class ComplianceApprovalService extends events_1.EventEmitter {
    workflows = new Map();
    reviewers = new Map();
    constructor() {
        super();
        this.initializeReviewers();
    }
    initializeReviewers() {
        const mockReviewers = [
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
    async createComplianceWorkflow(clientId, tenantId, workflowId, workflowType, metadata) {
        const workflow = {
            id: (0, crypto_1.randomUUID)(),
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
    determinePriority(workflowType, riskLevel) {
        if (riskLevel === 'CRITICAL')
            return CompliancePriority.CRITICAL;
        if (riskLevel === 'HIGH')
            return CompliancePriority.HIGH;
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
    createApprovalSteps(workflowType, metadata) {
        const baseSteps = [];
        switch (workflowType) {
            case ComplianceWorkflowType.CLIENT_ONBOARDING:
                baseSteps.push({
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
                            id: (0, crypto_1.randomUUID)(),
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
                            id: (0, crypto_1.randomUUID)(),
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
                }, {
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
                            id: (0, crypto_1.randomUUID)(),
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
                });
                break;
            case ComplianceWorkflowType.HIGH_RISK_CLIENT:
                baseSteps.push({
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
                            id: (0, crypto_1.randomUUID)(),
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
                }, {
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
                            id: (0, crypto_1.randomUUID)(),
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
                });
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
                    id: (0, crypto_1.randomUUID)(),
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
            id: (0, crypto_1.randomUUID)()
        }));
    }
    async performInitialRiskAssessment(clientId, metadata) {
        const riskFactors = [];
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
            id: (0, crypto_1.randomUUID)(),
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
    createDeadlines(workflowType) {
        const deadlines = [];
        const now = new Date();
        switch (workflowType) {
            case ComplianceWorkflowType.CLIENT_ONBOARDING:
                // Regulatory deadline for account opening
                const regulatoryDeadline = new Date(now);
                regulatoryDeadline.setDate(now.getDate() + 30);
                deadlines.push({
                    id: (0, crypto_1.randomUUID)(),
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
                    id: (0, crypto_1.randomUUID)(),
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
    async assignReviewers(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow)
            return;
        for (const step of workflow.approvalSteps) {
            if (step.status !== ApprovalStepStatus.PENDING)
                continue;
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
    findAvailableReviewers(requirement, jurisdiction) {
        return Array.from(this.reviewers.values()).filter(reviewer => {
            // Check role match
            if (reviewer.role !== requirement.role)
                return false;
            // Check availability
            if (reviewer.availability.status !== 'available')
                return false;
            // Check capacity
            if (reviewer.workload.currentReviews >= reviewer.workload.maxCapacity)
                return false;
            // Check jurisdiction
            if (requirement.jurisdiction && !reviewer.jurisdiction.includes(requirement.jurisdiction))
                return false;
            // Check specialization
            if (requirement.specialization && !reviewer.specializations.includes(requirement.specialization))
                return false;
            return true;
        });
    }
    selectBestReviewer(availableReviewers, priority) {
        if (availableReviewers.length === 0)
            return null;
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
    async startWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow)
            return;
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
    async submitDecision(workflowId, stepId, reviewerId, decision, reasoning, criteriaEvaluations = [], conditions = []) {
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
        const complianceDecision = {
            id: (0, crypto_1.randomUUID)(),
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
    calculateDecisionConfidence(criteriaEvaluations) {
        if (criteriaEvaluations.length === 0)
            return 50;
        const avgScore = criteriaEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / criteriaEvaluations.length;
        return Math.min(100, Math.max(0, avgScore));
    }
    async checkStepCompletion(workflowId, stepId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow)
            return;
        const step = workflow.approvalSteps.find(s => s.id === stepId);
        if (!step)
            return;
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
    async startNextSteps(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow)
            return;
        const completedStepNames = workflow.approvalSteps
            .filter(step => step.status === ApprovalStepStatus.COMPLETED)
            .map(step => step.name);
        const nextSteps = workflow.approvalSteps.filter(step => step.status === ApprovalStepStatus.ASSIGNED &&
            step.dependencies.every(dep => completedStepNames.includes(dep))).sort((a, b) => a.order - b.order);
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
    async checkWorkflowCompletion(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow)
            return;
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
            }
            else if (conditionalApprovals.length > 0) {
                workflow.status = ComplianceWorkflowStatus.CONDITIONALLY_APPROVED;
                workflow.approvedAt = new Date();
            }
            else if (approvalDecisions.length > 0) {
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
    addAuditRecord(workflowId, action, performedBy, details) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow)
            return;
        const auditRecord = {
            id: (0, crypto_1.randomUUID)(),
            action,
            performedBy,
            timestamp: new Date(),
            details
        };
        workflow.auditTrail.push(auditRecord);
    }
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }
    getWorkflowsByClient(clientId, tenantId) {
        return Array.from(this.workflows.values())
            .filter(workflow => workflow.clientId === clientId && workflow.tenantId === tenantId);
    }
    getWorkflowsByReviewer(reviewerId) {
        return Array.from(this.workflows.values())
            .filter(workflow => workflow.reviewers.some(r => r.id === reviewerId));
    }
    async getComplianceMetrics(tenantId) {
        const workflows = Array.from(this.workflows.values())
            .filter(workflow => !tenantId || workflow.tenantId === tenantId);
        const totalWorkflows = workflows.length;
        const pendingWorkflows = workflows.filter(w => [ComplianceWorkflowStatus.PENDING, ComplianceWorkflowStatus.IN_PROGRESS, ComplianceWorkflowStatus.UNDER_REVIEW]
            .includes(w.status)).length;
        const completedWorkflows = workflows.filter(w => w.completedAt).length;
        const completedTimes = workflows
            .filter(w => w.completedAt)
            .map(w => w.completedAt.getTime() - w.createdAt.getTime());
        const averageProcessingTime = completedTimes.length > 0
            ? completedTimes.reduce((a, b) => a + b, 0) / completedTimes.length
            : 0;
        const approvedWorkflows = workflows.filter(w => [ComplianceWorkflowStatus.APPROVED, ComplianceWorkflowStatus.CONDITIONALLY_APPROVED].includes(w.status)).length;
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
exports.ComplianceApprovalService = ComplianceApprovalService;

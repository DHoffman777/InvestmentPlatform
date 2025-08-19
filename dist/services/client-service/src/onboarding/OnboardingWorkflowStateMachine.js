"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingWorkflowStateMachine = exports.WorkflowEvent = exports.WorkflowState = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var WorkflowState;
(function (WorkflowState) {
    WorkflowState["INITIATED"] = "INITIATED";
    WorkflowState["DOCUMENT_COLLECTION"] = "DOCUMENT_COLLECTION";
    WorkflowState["DOCUMENT_VERIFICATION"] = "DOCUMENT_VERIFICATION";
    WorkflowState["IDENTITY_VERIFICATION"] = "IDENTITY_VERIFICATION";
    WorkflowState["KYC_PROCESSING"] = "KYC_PROCESSING";
    WorkflowState["AML_SCREENING"] = "AML_SCREENING";
    WorkflowState["RISK_ASSESSMENT"] = "RISK_ASSESSMENT";
    WorkflowState["SUITABILITY_REVIEW"] = "SUITABILITY_REVIEW";
    WorkflowState["COMPLIANCE_REVIEW"] = "COMPLIANCE_REVIEW";
    WorkflowState["ACCOUNT_SETUP"] = "ACCOUNT_SETUP";
    WorkflowState["FUNDING_SETUP"] = "FUNDING_SETUP";
    WorkflowState["FINAL_APPROVAL"] = "FINAL_APPROVAL";
    WorkflowState["COMPLETED"] = "COMPLETED";
    WorkflowState["REJECTED"] = "REJECTED";
    WorkflowState["SUSPENDED"] = "SUSPENDED";
    WorkflowState["CANCELLED"] = "CANCELLED";
})(WorkflowState || (exports.WorkflowState = WorkflowState = {}));
var WorkflowEvent;
(function (WorkflowEvent) {
    WorkflowEvent["START_ONBOARDING"] = "START_ONBOARDING";
    WorkflowEvent["DOCUMENTS_SUBMITTED"] = "DOCUMENTS_SUBMITTED";
    WorkflowEvent["DOCUMENTS_VERIFIED"] = "DOCUMENTS_VERIFIED";
    WorkflowEvent["IDENTITY_VERIFIED"] = "IDENTITY_VERIFIED";
    WorkflowEvent["KYC_COMPLETED"] = "KYC_COMPLETED";
    WorkflowEvent["AML_CLEARED"] = "AML_CLEARED";
    WorkflowEvent["RISK_ASSESSED"] = "RISK_ASSESSED";
    WorkflowEvent["SUITABILITY_APPROVED"] = "SUITABILITY_APPROVED";
    WorkflowEvent["COMPLIANCE_APPROVED"] = "COMPLIANCE_APPROVED";
    WorkflowEvent["ACCOUNT_CREATED"] = "ACCOUNT_CREATED";
    WorkflowEvent["FUNDING_CONFIGURED"] = "FUNDING_CONFIGURED";
    WorkflowEvent["FINAL_APPROVED"] = "FINAL_APPROVED";
    WorkflowEvent["REJECT_APPLICATION"] = "REJECT_APPLICATION";
    WorkflowEvent["SUSPEND_APPLICATION"] = "SUSPEND_APPLICATION";
    WorkflowEvent["CANCEL_APPLICATION"] = "CANCEL_APPLICATION";
    WorkflowEvent["RESUME_APPLICATION"] = "RESUME_APPLICATION";
})(WorkflowEvent || (exports.WorkflowEvent = WorkflowEvent = {}));
class OnboardingWorkflowStateMachine extends events_1.EventEmitter {
    transitionRules = new Map();
    activeWorkflows = new Map();
    constructor() {
        super();
        this.initializeTransitionRules();
    }
    initializeTransitionRules() {
        const rules = [
            // Initial transitions
            {
                fromState: WorkflowState.INITIATED,
                event: WorkflowEvent.START_ONBOARDING,
                toState: WorkflowState.DOCUMENT_COLLECTION,
                autoTransition: true
            },
            // Document collection and verification
            {
                fromState: WorkflowState.DOCUMENT_COLLECTION,
                event: WorkflowEvent.DOCUMENTS_SUBMITTED,
                toState: WorkflowState.DOCUMENT_VERIFICATION,
                validators: ['documentCompleteness', 'documentFormat', 'documentAuthenticity']
            },
            {
                fromState: WorkflowState.DOCUMENT_VERIFICATION,
                event: WorkflowEvent.DOCUMENTS_VERIFIED,
                toState: WorkflowState.IDENTITY_VERIFICATION,
                autoTransition: true
            },
            // Identity and KYC/AML
            {
                fromState: WorkflowState.IDENTITY_VERIFICATION,
                event: WorkflowEvent.IDENTITY_VERIFIED,
                toState: WorkflowState.KYC_PROCESSING,
                validators: ['identityMatch', 'biometricVerification']
            },
            {
                fromState: WorkflowState.KYC_PROCESSING,
                event: WorkflowEvent.KYC_COMPLETED,
                toState: WorkflowState.AML_SCREENING,
                validators: ['kycCompleteness', 'regulatoryCompliance']
            },
            {
                fromState: WorkflowState.AML_SCREENING,
                event: WorkflowEvent.AML_CLEARED,
                toState: WorkflowState.RISK_ASSESSMENT,
                validators: ['amlScreening', 'sanctionsCheck', 'pepCheck']
            },
            // Risk and suitability assessment
            {
                fromState: WorkflowState.RISK_ASSESSMENT,
                event: WorkflowEvent.RISK_ASSESSED,
                toState: WorkflowState.SUITABILITY_REVIEW,
                validators: ['riskProfileComplete', 'investmentObjectivesDefined']
            },
            {
                fromState: WorkflowState.SUITABILITY_REVIEW,
                event: WorkflowEvent.SUITABILITY_APPROVED,
                toState: WorkflowState.COMPLIANCE_REVIEW,
                requiresApproval: true
            },
            // Final approval and setup
            {
                fromState: WorkflowState.COMPLIANCE_REVIEW,
                event: WorkflowEvent.COMPLIANCE_APPROVED,
                toState: WorkflowState.ACCOUNT_SETUP,
                requiresApproval: true
            },
            {
                fromState: WorkflowState.ACCOUNT_SETUP,
                event: WorkflowEvent.ACCOUNT_CREATED,
                toState: WorkflowState.FUNDING_SETUP,
                autoTransition: true
            },
            {
                fromState: WorkflowState.FUNDING_SETUP,
                event: WorkflowEvent.FUNDING_CONFIGURED,
                toState: WorkflowState.FINAL_APPROVAL,
                validators: ['bankingDetailsValid', 'initialFundingVerified']
            },
            {
                fromState: WorkflowState.FINAL_APPROVAL,
                event: WorkflowEvent.FINAL_APPROVED,
                toState: WorkflowState.COMPLETED,
                requiresApproval: true
            },
            // Rejection, suspension, and cancellation rules (from any state)
            ...Object.values(WorkflowState)
                .filter(state => ![WorkflowState.COMPLETED, WorkflowState.REJECTED, WorkflowState.CANCELLED].includes(state))
                .flatMap(state => [
                {
                    fromState: state,
                    event: WorkflowEvent.REJECT_APPLICATION,
                    toState: WorkflowState.REJECTED,
                    requiresApproval: true
                },
                {
                    fromState: state,
                    event: WorkflowEvent.SUSPEND_APPLICATION,
                    toState: WorkflowState.SUSPENDED,
                    requiresApproval: true
                },
                {
                    fromState: state,
                    event: WorkflowEvent.CANCEL_APPLICATION,
                    toState: WorkflowState.CANCELLED
                }
            ]),
            // Resume from suspension
            {
                fromState: WorkflowState.SUSPENDED,
                event: WorkflowEvent.RESUME_APPLICATION,
                toState: WorkflowState.DOCUMENT_COLLECTION, // Resume from document collection
                conditions: (state) => state.previousState !== undefined
            }
        ];
        rules.forEach(rule => {
            const key = `${rule.fromState}-${rule.event}`;
            this.transitionRules.set(key, rule);
        });
    }
    async createWorkflow(clientId, tenantId, metadata) {
        const workflowId = (0, crypto_1.randomUUID)();
        const workflow = {
            id: workflowId,
            clientId,
            tenantId,
            currentState: WorkflowState.INITIATED,
            stateData: {},
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata
        };
        this.activeWorkflows.set(workflowId, workflow);
        this.emit('workflowCreated', workflow);
        // Auto-transition to document collection
        await this.processEvent(workflowId, WorkflowEvent.START_ONBOARDING, {}, 'system');
        return workflow;
    }
    async processEvent(workflowId, event, eventData = {}, triggeredBy) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            return { success: false, errors: ['Workflow not found'] };
        }
        const ruleKey = `${workflow.currentState}-${event}`;
        const rule = this.transitionRules.get(ruleKey);
        if (!rule) {
            return {
                success: false,
                errors: [`Invalid transition from ${workflow.currentState} with event ${event}`]
            };
        }
        // Check conditions
        if (rule.conditions && !rule.conditions(workflow, eventData)) {
            return {
                success: false,
                errors: ['Transition conditions not met']
            };
        }
        // Run validators
        const validationResults = [];
        if (rule.validators) {
            for (const validator of rule.validators) {
                const result = await this.runValidator(validator, workflow, eventData);
                validationResults.push(result);
                if (result.status === 'failed') {
                    return {
                        success: false,
                        errors: [`Validation failed: ${result.message}`]
                    };
                }
            }
        }
        // Check if approval is required
        if (rule.requiresApproval && !eventData.approvedBy) {
            return {
                success: false,
                errors: ['This transition requires approval']
            };
        }
        // Execute transition
        const transition = {
            id: (0, crypto_1.randomUUID)(),
            fromState: workflow.currentState,
            toState: rule.toState,
            triggeredBy,
            triggeredAt: new Date(),
            conditions: eventData,
            validationResults: validationResults.length > 0 ? validationResults : undefined,
            approvedBy: eventData.approvedBy,
            rejectionReason: eventData.rejectionReason
        };
        workflow.previousState = workflow.currentState;
        workflow.currentState = rule.toState;
        workflow.updatedAt = new Date();
        workflow.transitions.push(transition);
        // Merge event data into state data
        workflow.stateData = { ...workflow.stateData, ...eventData };
        // Mark as completed if in final state
        if (rule.toState === WorkflowState.COMPLETED) {
            workflow.completedAt = new Date();
        }
        this.emit('stateTransition', {
            workflow,
            transition,
            event,
            eventData
        });
        // Handle auto-transitions
        if (rule.autoTransition) {
            setTimeout(() => {
                this.handleAutoTransition(workflowId, rule.toState);
            }, rule.timeout || 1000);
        }
        return {
            success: true,
            newState: rule.toState
        };
    }
    async runValidator(validatorName, workflow, eventData) {
        // This would integrate with actual validation services
        // For now, return mock results
        const validators = {
            documentCompleteness: () => ({
                validator: 'documentCompleteness',
                status: 'passed',
                message: 'All required documents provided'
            }),
            documentFormat: () => ({
                validator: 'documentFormat',
                status: 'passed',
                message: 'Document formats are valid'
            }),
            documentAuthenticity: () => ({
                validator: 'documentAuthenticity',
                status: 'passed',
                message: 'Documents appear authentic'
            }),
            identityMatch: () => ({
                validator: 'identityMatch',
                status: 'passed',
                message: 'Identity matches provided documents'
            }),
            biometricVerification: () => ({
                validator: 'biometricVerification',
                status: 'passed',
                message: 'Biometric verification successful'
            }),
            kycCompleteness: () => ({
                validator: 'kycCompleteness',
                status: 'passed',
                message: 'KYC information is complete'
            }),
            regulatoryCompliance: () => ({
                validator: 'regulatoryCompliance',
                status: 'passed',
                message: 'Meets regulatory requirements'
            }),
            amlScreening: () => ({
                validator: 'amlScreening',
                status: 'passed',
                message: 'AML screening passed'
            }),
            sanctionsCheck: () => ({
                validator: 'sanctionsCheck',
                status: 'passed',
                message: 'No sanctions matches found'
            }),
            pepCheck: () => ({
                validator: 'pepCheck',
                status: 'passed',
                message: 'PEP screening passed'
            }),
            riskProfileComplete: () => ({
                validator: 'riskProfileComplete',
                status: 'passed',
                message: 'Risk profile assessment complete'
            }),
            investmentObjectivesDefined: () => ({
                validator: 'investmentObjectivesDefined',
                status: 'passed',
                message: 'Investment objectives clearly defined'
            }),
            bankingDetailsValid: () => ({
                validator: 'bankingDetailsValid',
                status: 'passed',
                message: 'Banking details validated'
            }),
            initialFundingVerified: () => ({
                validator: 'initialFundingVerified',
                status: 'passed',
                message: 'Initial funding source verified'
            })
        };
        const validator = validators[validatorName];
        if (!validator) {
            return {
                validator: validatorName,
                status: 'failed',
                message: `Unknown validator: ${validatorName}`
            };
        }
        return validator();
    }
    async handleAutoTransition(workflowId, currentState) {
        // Handle any automatic transitions based on current state
        // This could trigger additional events or external integrations
        this.emit('autoTransition', { workflowId, state: currentState });
    }
    getWorkflow(workflowId) {
        return this.activeWorkflows.get(workflowId);
    }
    getWorkflowsByClient(clientId, tenantId) {
        return Array.from(this.activeWorkflows.values())
            .filter(workflow => workflow.clientId === clientId && workflow.tenantId === tenantId);
    }
    getWorkflowsByState(state, tenantId) {
        return Array.from(this.activeWorkflows.values())
            .filter(workflow => workflow.currentState === state &&
            (!tenantId || workflow.tenantId === tenantId));
    }
    getAvailableEvents(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow)
            return [];
        const availableEvents = [];
        for (const [key, rule] of this.transitionRules.entries()) {
            if (key.startsWith(workflow.currentState + '-')) {
                availableEvents.push(rule.event);
            }
        }
        return availableEvents;
    }
    async getWorkflowMetrics(tenantId) {
        const workflows = Array.from(this.activeWorkflows.values())
            .filter(workflow => !tenantId || workflow.tenantId === tenantId);
        const totalWorkflows = workflows.length;
        const completedWorkflows = workflows.filter(w => w.currentState === WorkflowState.COMPLETED).length;
        const rejectedWorkflows = workflows.filter(w => w.currentState === WorkflowState.REJECTED).length;
        const stateDistribution = {};
        Object.values(WorkflowState).forEach(state => {
            stateDistribution[state] = workflows.filter(w => w.currentState === state).length;
        });
        const completedWorkflowsWithTimes = workflows
            .filter(w => w.currentState === WorkflowState.COMPLETED && w.completedAt)
            .map(w => w.completedAt.getTime() - w.createdAt.getTime());
        const averageCompletionTime = completedWorkflowsWithTimes.length > 0
            ? completedWorkflowsWithTimes.reduce((a, b) => a + b, 0) / completedWorkflowsWithTimes.length
            : 0;
        const completionRate = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;
        return {
            totalWorkflows,
            completedWorkflows,
            rejectedWorkflows,
            stateDistribution,
            averageCompletionTime,
            completionRate
        };
    }
}
exports.OnboardingWorkflowStateMachine = OnboardingWorkflowStateMachine;

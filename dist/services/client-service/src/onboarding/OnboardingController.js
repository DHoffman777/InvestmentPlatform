"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockOnboardingNotificationService = exports.OnboardingController = void 0;
const express_1 = require("express");
const { body, param, query, validationResult } = require('express-validator');
const events_1 = require("events");
const OnboardingWorkflowStateMachine_1 = require("./OnboardingWorkflowStateMachine");
const DocumentCollectionService_1 = require("./DocumentCollectionService");
const IdentityVerificationService_1 = require("./IdentityVerificationService");
const ComplianceApprovalService_1 = require("./ComplianceApprovalService");
const OnboardingProgressService_1 = require("./OnboardingProgressService");
class OnboardingController extends events_1.EventEmitter {
    router;
    workflowStateMachine;
    documentService;
    kycAmlService;
    identityService;
    accountSetupService;
    complianceService;
    progressService;
    notificationService;
    constructor(workflowStateMachine, documentService, kycAmlService, identityService, accountSetupService, complianceService, progressService, notificationService) {
        super();
        this.router = (0, express_1.Router)();
        this.workflowStateMachine = workflowStateMachine;
        this.documentService = documentService;
        this.kycAmlService = kycAmlService;
        this.identityService = identityService;
        this.accountSetupService = accountSetupService;
        this.complianceService = complianceService;
        this.progressService = progressService;
        this.notificationService = notificationService;
        this.setupEventListeners();
        this.setupRoutes();
    }
    setupEventListeners() {
        // Workflow state machine events
        this.workflowStateMachine.on('workflowCreated', (workflow) => {
            this.emit('onboardingInitiated', workflow);
            this.notificationService.sendWelcomeNotification(workflow.clientId, workflow.id);
        });
        this.workflowStateMachine.on('stateTransition', async (event) => {
            await this.handleStateTransition(event);
        });
        // Document service events
        this.documentService.on('documentVerified', async (submission) => {
            await this.progressService.updateStepProgress(submission.workflowId, 'document-verification', OnboardingProgressService_1.StepStatus.COMPLETED);
        });
        // Identity verification events
        this.identityService.on('verificationSessionCompleted', async (session) => {
            if (session.status === 'COMPLETED') {
                await this.progressService.updateStepProgress(session.workflowId, 'identity-verification', OnboardingProgressService_1.StepStatus.COMPLETED);
            }
        });
        // Progress service events
        this.progressService.on('milestoneAchieved', async (event) => {
            await this.notificationService.sendMilestoneNotification(event.progress.clientId, event.milestone.name);
        });
        this.progressService.on('blockerReported', async (event) => {
            await this.notificationService.sendDelayNotification(event.progress.clientId, event.blocker.description, new Date(Date.now() + (event.blocker.estimatedResolutionTime || 0)));
        });
        // Compliance service events
        this.complianceService.on('workflowCompleted', async (workflow) => {
            if (workflow.status === 'APPROVED') {
                await this.workflowStateMachine.processEvent(workflow.workflowId, OnboardingWorkflowStateMachine_1.WorkflowEvent.COMPLIANCE_APPROVED, { approvedBy: 'compliance-system' }, 'system');
            }
        });
    }
    async handleStateTransition(event) {
        const { workflow, transition } = event;
        // Update progress tracking
        const progress = this.progressService.getProgressByWorkflow(workflow.id);
        if (progress) {
            const phaseMap = {
                [OnboardingWorkflowStateMachine_1.WorkflowState.INITIATED]: OnboardingProgressService_1.OnboardingPhase.INITIATION,
                [OnboardingWorkflowStateMachine_1.WorkflowState.DOCUMENT_COLLECTION]: OnboardingProgressService_1.OnboardingPhase.DOCUMENT_COLLECTION,
                [OnboardingWorkflowStateMachine_1.WorkflowState.IDENTITY_VERIFICATION]: OnboardingProgressService_1.OnboardingPhase.IDENTITY_VERIFICATION,
                [OnboardingWorkflowStateMachine_1.WorkflowState.KYC_PROCESSING]: OnboardingProgressService_1.OnboardingPhase.KYC_AML_REVIEW,
                [OnboardingWorkflowStateMachine_1.WorkflowState.COMPLIANCE_REVIEW]: OnboardingProgressService_1.OnboardingPhase.COMPLIANCE_APPROVAL,
                [OnboardingWorkflowStateMachine_1.WorkflowState.ACCOUNT_SETUP]: OnboardingProgressService_1.OnboardingPhase.ACCOUNT_SETUP,
                [OnboardingWorkflowStateMachine_1.WorkflowState.COMPLETED]: OnboardingProgressService_1.OnboardingPhase.COMPLETION
            };
            const currentPhase = phaseMap[workflow.currentState];
            if (currentPhase) {
                // Start next phase
                const phaseProgress = progress.phases.find(p => p.phase === currentPhase);
                if (phaseProgress && phaseProgress.steps.length > 0) {
                    await this.progressService.updateStepProgress(progress.id, phaseProgress.steps[0].id, OnboardingProgressService_1.StepStatus.IN_PROGRESS);
                }
            }
        }
        // Trigger automated processes based on state
        switch (workflow.currentState) {
            case OnboardingWorkflowStateMachine_1.WorkflowState.DOCUMENT_COLLECTION:
                // Notify client to submit documents
                await this.notificationService.sendStepReminderNotification(workflow.clientId, 'Document Submission');
                break;
            case OnboardingWorkflowStateMachine_1.WorkflowState.KYC_PROCESSING:
                // Initiate KYC process
                await this.kycAmlService.initiateKYCProcess(workflow.clientId, workflow.tenantId, workflow.id, { personalInfo: workflow.stateData.personalInfo });
                break;
            case OnboardingWorkflowStateMachine_1.WorkflowState.COMPLIANCE_REVIEW:
                // Create compliance workflow
                await this.complianceService.createComplianceWorkflow(workflow.clientId, workflow.tenantId, workflow.id, ComplianceApprovalService_1.ComplianceWorkflowType.CLIENT_ONBOARDING, {
                    accountType: workflow.metadata.accountType,
                    riskLevel: 'MEDIUM',
                    jurisdiction: 'US',
                    regulatoryRequirements: ['KYC', 'AML'],
                    businessRules: ['StandardOnboarding']
                });
                break;
            case OnboardingWorkflowStateMachine_1.WorkflowState.COMPLETED:
                // Send completion notification
                await this.notificationService.sendCompletionNotification(workflow.clientId, workflow.id);
                break;
        }
    }
    setupRoutes() {
        // Workflow Management Routes
        this.router.post('/workflows', this.validateCreateWorkflow(), this.createWorkflow.bind(this));
        this.router.get('/workflows/:workflowId', this.validateWorkflowId(), this.getWorkflow.bind(this));
        this.router.get('/workflows', this.validateGetWorkflows(), this.getWorkflows.bind(this));
        this.router.post('/workflows/:workflowId/events', this.validateProcessEvent(), this.processEvent.bind(this));
        this.router.get('/workflows/:workflowId/events', this.validateWorkflowId(), this.getAvailableEvents.bind(this));
        // Document Management Routes
        this.router.post('/workflows/:workflowId/documents', this.validateSubmitDocument(), this.submitDocument.bind(this));
        this.router.get('/workflows/:workflowId/documents', this.validateWorkflowId(), this.getDocuments.bind(this));
        this.router.get('/workflows/:workflowId/documents/requirements', this.validateWorkflowId(), this.getDocumentRequirements.bind(this));
        this.router.get('/workflows/:workflowId/documents/status', this.validateWorkflowId(), this.getDocumentStatus.bind(this));
        // Identity Verification Routes
        this.router.post('/workflows/:workflowId/identity/sessions', this.validateCreateVerificationSession(), this.createVerificationSession.bind(this));
        this.router.get('/workflows/:workflowId/identity/sessions/:sessionId', this.validateSessionId(), this.getVerificationSession.bind(this));
        this.router.post('/workflows/:workflowId/identity/sessions/:sessionId/documents', this.validateDocumentVerification(), this.startDocumentVerification.bind(this));
        this.router.post('/workflows/:workflowId/identity/sessions/:sessionId/biometric', this.validateBiometricVerification(), this.startBiometricVerification.bind(this));
        this.router.post('/workflows/:workflowId/identity/sessions/:sessionId/kba', this.validateKBA(), this.startKBA.bind(this));
        this.router.post('/workflows/:workflowId/identity/sessions/:sessionId/kba/:kbaId/answers', this.validateKBAAnswers(), this.submitKBAAnswers.bind(this));
        // KYC/AML Routes
        this.router.get('/workflows/:workflowId/kyc', this.validateWorkflowId(), this.getKYCProfile.bind(this));
        this.router.put('/workflows/:workflowId/kyc', this.validateUpdateKYC(), this.updateKYCProfile.bind(this));
        this.router.post('/workflows/:workflowId/kyc/review', this.validateKYCReview(), this.reviewKYCProfile.bind(this));
        this.router.get('/workflows/:workflowId/aml/screening', this.validateWorkflowId(), this.getAMLScreeningResults.bind(this));
        // Account Setup Routes
        this.router.post('/workflows/:workflowId/account-setup', this.validateInitiateAccountSetup(), this.initiateAccountSetup.bind(this));
        this.router.get('/workflows/:workflowId/account-setup', this.validateWorkflowId(), this.getAccountSetup.bind(this));
        this.router.put('/workflows/:workflowId/account-setup', this.validateUpdateAccountSetup(), this.updateAccountSetup.bind(this));
        // Compliance Routes
        this.router.get('/workflows/:workflowId/compliance', this.validateWorkflowId(), this.getComplianceWorkflow.bind(this));
        this.router.post('/workflows/:workflowId/compliance/decisions', this.validateComplianceDecision(), this.submitComplianceDecision.bind(this));
        // Progress Tracking Routes
        this.router.get('/workflows/:workflowId/progress', this.validateWorkflowId(), this.getProgress.bind(this));
        this.router.get('/workflows/:workflowId/progress/summary', this.validateWorkflowId(), this.getProgressSummary.bind(this));
        this.router.post('/workflows/:workflowId/progress/blockers', this.validateReportBlocker(), this.reportBlocker.bind(this));
        this.router.post('/workflows/:workflowId/progress/blockers/:blockerId/resolve', this.validateResolveBlocker(), this.resolveBlocker.bind(this));
        // Analytics and Reporting Routes
        this.router.get('/analytics/workflows', this.validateAnalyticsRequest(), this.getWorkflowAnalytics.bind(this));
        this.router.get('/analytics/documents', this.validateAnalyticsRequest(), this.getDocumentAnalytics.bind(this));
        this.router.get('/analytics/identity', this.validateAnalyticsRequest(), this.getIdentityVerificationAnalytics.bind(this));
        this.router.get('/analytics/compliance', this.validateAnalyticsRequest(), this.getComplianceAnalytics.bind(this));
        this.router.get('/analytics/progress', this.validateAnalyticsRequest(), this.getProgressAnalytics.bind(this));
        // Client-facing Routes
        this.router.get('/client/:clientId/workflows', this.validateClientId(), this.getClientWorkflows.bind(this));
        this.router.get('/client/:clientId/progress', this.validateClientId(), this.getClientProgress.bind(this));
        this.router.get('/client/:clientId/next-actions', this.validateClientId(), this.getClientNextActions.bind(this));
        // Admin Routes
        this.router.get('/admin/workflows/pending', this.validateAdminAccess(), this.getPendingWorkflows.bind(this));
        this.router.get('/admin/compliance/queue', this.validateAdminAccess(), this.getComplianceQueue.bind(this));
        this.router.get('/admin/metrics/dashboard', this.validateAdminAccess(), this.getAdminDashboard.bind(this));
    }
    // Validation middleware
    validateCreateWorkflow() {
        return [
            body('clientId').isString().notEmpty(),
            body('clientType').isIn(['individual', 'entity', 'trust', 'partnership']),
            body('accountType').isString().notEmpty(),
            body('metadata').isObject().optional(),
            this.handleValidationErrors
        ];
    }
    validateWorkflowId() {
        return [
            param('workflowId').isUUID(),
            this.handleValidationErrors
        ];
    }
    validateGetWorkflows() {
        return [
            query('status').isString().optional(),
            query('clientId').isString().optional(),
            query('limit').isInt({ min: 1, max: 100 }).optional(),
            query('offset').isInt({ min: 0 }).optional(),
            this.handleValidationErrors
        ];
    }
    validateProcessEvent() {
        return [
            param('workflowId').isUUID(),
            body('event').isString().notEmpty(),
            body('eventData').isObject().optional(),
            body('triggeredBy').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateSubmitDocument() {
        return [
            param('workflowId').isUUID(),
            body('requirementId').isString().notEmpty(),
            body('fileName').isString().notEmpty(),
            body('filePath').isString().notEmpty(),
            body('fileSize').isInt({ min: 1 }),
            body('mimeType').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateCreateVerificationSession() {
        return [
            param('workflowId').isUUID(),
            body('sessionType').isIn(Object.values(IdentityVerificationService_1.VerificationSessionType)),
            body('provider').isString().optional(),
            this.handleValidationErrors
        ];
    }
    validateSessionId() {
        return [
            param('workflowId').isUUID(),
            param('sessionId').isUUID(),
            this.handleValidationErrors
        ];
    }
    validateDocumentVerification() {
        return [
            param('workflowId').isUUID(),
            param('sessionId').isUUID(),
            body('documentType').isIn(Object.values(DocumentCollectionService_1.DocumentType)),
            body('frontImagePath').isString().notEmpty(),
            body('backImagePath').isString().optional(),
            this.handleValidationErrors
        ];
    }
    validateBiometricVerification() {
        return [
            param('workflowId').isUUID(),
            param('sessionId').isUUID(),
            body('biometricType').isString().notEmpty(),
            body('captureData').notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateKBA() {
        return [
            param('workflowId').isUUID(),
            param('sessionId').isUUID(),
            this.handleValidationErrors
        ];
    }
    validateKBAAnswers() {
        return [
            param('workflowId').isUUID(),
            param('sessionId').isUUID(),
            param('kbaId').isUUID(),
            body('answers').isArray().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateUpdateKYC() {
        return [
            param('workflowId').isUUID(),
            body('personalInfo').isObject().optional(),
            body('addressInfo').isObject().optional(),
            body('financialInfo').isObject().optional(),
            body('businessInfo').isObject().optional(),
            this.handleValidationErrors
        ];
    }
    validateKYCReview() {
        return [
            param('workflowId').isUUID(),
            body('decision').isIn(['approve', 'reject', 'request_more_info']),
            body('notes').isString().optional(),
            this.handleValidationErrors
        ];
    }
    validateInitiateAccountSetup() {
        return [
            param('workflowId').isUUID(),
            body('accountConfiguration').isObject(),
            body('fundingSetup').isObject(),
            body('investmentPreferences').isObject(),
            this.handleValidationErrors
        ];
    }
    validateUpdateAccountSetup() {
        return [
            param('workflowId').isUUID(),
            body('accountConfiguration').isObject().optional(),
            body('fundingSetup').isObject().optional(),
            body('investmentPreferences').isObject().optional(),
            this.handleValidationErrors
        ];
    }
    validateComplianceDecision() {
        return [
            param('workflowId').isUUID(),
            body('stepId').isString().notEmpty(),
            body('decision').isIn(['APPROVE', 'REJECT', 'CONDITIONAL_APPROVE', 'REQUEST_MORE_INFO', 'ESCALATE']),
            body('reasoning').isString().notEmpty(),
            body('conditions').isArray().optional(),
            this.handleValidationErrors
        ];
    }
    validateReportBlocker() {
        return [
            param('workflowId').isUUID(),
            body('name').isString().notEmpty(),
            body('description').isString().notEmpty(),
            body('type').isString().notEmpty(),
            body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            body('reportedBy').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateResolveBlocker() {
        return [
            param('workflowId').isUUID(),
            param('blockerId').isUUID(),
            body('resolution').isString().notEmpty(),
            body('resolvedBy').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateAnalyticsRequest() {
        return [
            query('tenantId').isString().optional(),
            query('startDate').isISO8601().optional(),
            query('endDate').isISO8601().optional(),
            this.handleValidationErrors
        ];
    }
    validateClientId() {
        return [
            param('clientId').isString().notEmpty(),
            this.handleValidationErrors
        ];
    }
    validateAdminAccess() {
        return [
            this.checkAdminPermissions,
            this.handleValidationErrors
        ];
    }
    handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        next();
    }
    checkAdminPermissions(req, res, next) {
        if (!req.user || !req.user.permissions.includes('admin')) {
            res.status(403).json({
                success: false,
                error: 'Administrator access required'
            });
            return;
        }
        next();
    }
    // Route handlers
    async createWorkflow(req, res) {
        try {
            const { clientId, clientType, accountType, metadata } = req.body;
            const tenantId = req.tenantId || req.user?.tenantId;
            if (!tenantId) {
                res.status(400).json({ success: false, error: 'Tenant ID required' });
                return;
            }
            // Create workflow
            const workflow = await this.workflowStateMachine.createWorkflow(clientId, tenantId, { clientType, accountType, ...metadata });
            // Initialize progress tracking
            await this.progressService.initializeProgress(clientId, tenantId, workflow.id, clientType, accountType);
            res.status(201).json({
                success: true,
                data: {
                    workflowId: workflow.id,
                    status: workflow.currentState,
                    metadata: workflow.metadata
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getWorkflow(req, res) {
        try {
            const { workflowId } = req.params;
            const workflow = this.workflowStateMachine.getWorkflow(workflowId);
            if (!workflow) {
                res.status(404).json({ success: false, error: 'Workflow not found' });
                return;
            }
            res.json({
                success: true,
                data: workflow
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getWorkflows(req, res) {
        try {
            const { status, clientId, limit = 50, offset = 0 } = req.query;
            const tenantId = req.tenantId || req.user?.tenantId;
            // Implementation would filter workflows based on parameters
            // For now, return empty array as placeholder
            res.json({
                success: true,
                data: {
                    workflows: [],
                    pagination: {
                        limit: Number(limit),
                        offset: Number(offset),
                        total: 0
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async processEvent(req, res) {
        try {
            const { workflowId } = req.params;
            const { event, eventData, triggeredBy } = req.body;
            const result = await this.workflowStateMachine.processEvent(workflowId, event, eventData || {}, triggeredBy);
            res.json({
                success: result.success,
                data: {
                    newState: result.newState,
                    errors: result.errors
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getAvailableEvents(req, res) {
        try {
            const { workflowId } = req.params;
            const events = this.workflowStateMachine.getAvailableEvents(workflowId);
            res.json({
                success: true,
                data: { availableEvents: events }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async submitDocument(req, res) {
        try {
            const { workflowId } = req.params;
            const { requirementId, fileName, filePath, fileSize, mimeType } = req.body;
            const clientId = req.clientId || req.user?.id;
            const tenantId = req.tenantId || req.user?.tenantId;
            if (!clientId || !tenantId) {
                res.status(400).json({ success: false, error: 'Client ID and Tenant ID required' });
                return;
            }
            const submission = await this.documentService.submitDocument({
                workflowId,
                requirementId,
                clientId,
                tenantId,
                fileName,
                originalFileName: fileName,
                fileSize,
                mimeType,
                filePath,
                fileHash: 'placeholder-hash',
                submittedBy: clientId,
                metadata: {}
            });
            res.status(201).json({
                success: true,
                data: {
                    submissionId: submission.id,
                    status: submission.status
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getProgress(req, res) {
        try {
            const { workflowId } = req.params;
            const progress = this.progressService.getProgressByWorkflow(workflowId);
            if (!progress) {
                res.status(404).json({ success: false, error: 'Progress not found' });
                return;
            }
            res.json({
                success: true,
                data: progress
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getProgressSummary(req, res) {
        try {
            const { workflowId } = req.params;
            const progress = this.progressService.getProgressByWorkflow(workflowId);
            if (!progress) {
                res.status(404).json({ success: false, error: 'Progress not found' });
                return;
            }
            const summary = await this.progressService.getProgressSummary(progress.id);
            res.json({
                success: true,
                data: summary
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    // Placeholder implementations for remaining route handlers
    async getDocuments(req, res) {
        res.json({ success: true, data: { documents: [] } });
    }
    async getDocumentRequirements(req, res) {
        res.json({ success: true, data: { requirements: [] } });
    }
    async getDocumentStatus(req, res) {
        res.json({ success: true, data: { status: 'pending' } });
    }
    async createVerificationSession(req, res) {
        res.json({ success: true, data: { sessionId: 'placeholder' } });
    }
    async getVerificationSession(req, res) {
        res.json({ success: true, data: { session: {} } });
    }
    async startDocumentVerification(req, res) {
        res.json({ success: true, data: { verificationId: 'placeholder' } });
    }
    async startBiometricVerification(req, res) {
        res.json({ success: true, data: { verificationId: 'placeholder' } });
    }
    async startKBA(req, res) {
        res.json({ success: true, data: { kbaId: 'placeholder', questions: [] } });
    }
    async submitKBAAnswers(req, res) {
        res.json({ success: true, data: { passed: true, score: 85 } });
    }
    async getKYCProfile(req, res) {
        res.json({ success: true, data: { profile: {} } });
    }
    async updateKYCProfile(req, res) {
        res.json({ success: true, data: { updated: true } });
    }
    async reviewKYCProfile(req, res) {
        res.json({ success: true, data: { reviewed: true } });
    }
    async getAMLScreeningResults(req, res) {
        res.json({ success: true, data: { results: [] } });
    }
    async initiateAccountSetup(req, res) {
        res.json({ success: true, data: { setupId: 'placeholder' } });
    }
    async getAccountSetup(req, res) {
        res.json({ success: true, data: { setup: {} } });
    }
    async updateAccountSetup(req, res) {
        res.json({ success: true, data: { updated: true } });
    }
    async getComplianceWorkflow(req, res) {
        res.json({ success: true, data: { workflow: {} } });
    }
    async submitComplianceDecision(req, res) {
        res.json({ success: true, data: { decisionId: 'placeholder' } });
    }
    async reportBlocker(req, res) {
        res.json({ success: true, data: { blockerId: 'placeholder' } });
    }
    async resolveBlocker(req, res) {
        res.json({ success: true, data: { resolved: true } });
    }
    async getWorkflowAnalytics(req, res) {
        res.json({ success: true, data: { analytics: {} } });
    }
    async getDocumentAnalytics(req, res) {
        res.json({ success: true, data: { analytics: {} } });
    }
    async getIdentityVerificationAnalytics(req, res) {
        res.json({ success: true, data: { analytics: {} } });
    }
    async getComplianceAnalytics(req, res) {
        res.json({ success: true, data: { analytics: {} } });
    }
    async getProgressAnalytics(req, res) {
        res.json({ success: true, data: { analytics: {} } });
    }
    async getClientWorkflows(req, res) {
        res.json({ success: true, data: { workflows: [] } });
    }
    async getClientProgress(req, res) {
        res.json({ success: true, data: { progress: [] } });
    }
    async getClientNextActions(req, res) {
        res.json({ success: true, data: { actions: [] } });
    }
    async getPendingWorkflows(req, res) {
        res.json({ success: true, data: { workflows: [] } });
    }
    async getComplianceQueue(req, res) {
        res.json({ success: true, data: { queue: [] } });
    }
    async getAdminDashboard(req, res) {
        try {
            const tenantId = req.query.tenantId;
            const [workflowMetrics, progressMetrics, complianceMetrics] = await Promise.all([
                this.workflowStateMachine.getWorkflowMetrics(tenantId),
                this.progressService.getProgressMetrics(tenantId),
                this.complianceService.getComplianceMetrics(tenantId)
            ]);
            res.json({
                success: true,
                data: {
                    workflow: workflowMetrics,
                    progress: progressMetrics,
                    compliance: complianceMetrics,
                    generatedAt: new Date()
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    getRouter() {
        return this.router;
    }
}
exports.OnboardingController = OnboardingController;
// Mock notification service implementation
class MockOnboardingNotificationService {
    async sendWelcomeNotification(clientId, workflowId) {
        console.log(`Welcome notification sent to client ${clientId} for workflow ${workflowId}`);
    }
    async sendStepReminderNotification(clientId, stepName) {
        console.log(`Step reminder sent to client ${clientId} for step: ${stepName}`);
    }
    async sendMilestoneNotification(clientId, milestoneName) {
        console.log(`Milestone notification sent to client ${clientId} for milestone: ${milestoneName}`);
    }
    async sendCompletionNotification(clientId, workflowId) {
        console.log(`Completion notification sent to client ${clientId} for workflow ${workflowId}`);
    }
    async sendDelayNotification(clientId, reason, newEstimate) {
        console.log(`Delay notification sent to client ${clientId}. Reason: ${reason}, New estimate: ${newEstimate.toISOString()}`);
    }
}
exports.MockOnboardingNotificationService = MockOnboardingNotificationService;

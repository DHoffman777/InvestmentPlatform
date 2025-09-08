"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRelationshipService = void 0;
const logger_1 = require("../../utils/logger");
const prisma_1 = require("../../utils/prisma");
const library_1 = require("@prisma/client/runtime/library");
const crypto_1 = require("crypto");
const ClientRelationship_1 = require("../../models/clientRelationship/ClientRelationship");
class ClientRelationshipService {
    prisma;
    kafkaService;
    constructor(kafkaService) {
        this.prisma = (0, prisma_1.getPrismaClient)();
        this.kafkaService = kafkaService;
    }
    // Client Profile Management
    async createClientProfile(tenantId, request, userId) {
        try {
            logger_1.logger.info('Creating client profile', { tenantId, clientType: request.clientType });
            // Generate unique client number
            const clientNumber = await this.generateClientNumber(tenantId);
            // Create client profile
            const client = {
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                clientNumber,
                clientType: request.clientType,
                status: ClientRelationship_1.ClientStatus.PROSPECT,
                firstName: request.firstName,
                lastName: request.lastName,
                entityName: request.entityName,
                email: request.email,
                phoneNumber: request.phoneNumber,
                primaryAddress: request.primaryAddress,
                investmentObjectives: request.investmentObjectives.map(obj => ({
                    id: (0, crypto_1.randomUUID)(),
                    ...obj
                })),
                riskTolerance: request.riskTolerance,
                investmentExperience: request.investmentExperience,
                liquidityNeeds: request.liquidityNeeds,
                timeHorizon: request.timeHorizon,
                investmentRestrictions: request.investmentRestrictions?.map(res => ({
                    id: (0, crypto_1.randomUUID)(),
                    ...res,
                    effectiveDate: new Date(),
                    isActive: true
                })) || [],
                documentDeliveryPreference: request.documentDeliveryPreference,
                communicationPreferences: request.communicationPreferences,
                politicallyExposedPerson: false,
                employeeOfBrokerDealer: false,
                directorOfPublicCompany: false,
                assignedTeam: [],
                relationshipStartDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId,
                updatedBy: userId
            };
            // Store in database
            await this.prisma.clientProfile.create({
                data: {
                    ...client,
                    addresses: {
                        create: {
                            ...request.primaryAddress
                        }
                    },
                    investmentObjectives: {
                        create: client.investmentObjectives.map(obj => ({
                            objective: obj.objective,
                            priority: obj.priority,
                            targetAllocation: obj.targetAllocation,
                            description: obj.description
                        }))
                    },
                    investmentRestrictions: {
                        create: client.investmentRestrictions.map(res => ({
                            restrictionType: res.restrictionType,
                            description: res.description,
                            appliesTo: res.appliesTo,
                            isActive: res.isActive,
                            effectiveDate: res.effectiveDate,
                            expirationDate: res.expirationDate
                        }))
                    },
                    communicationPreferences: {
                        create: request.communicationPreferences.map(pref => ({
                            method: pref.method,
                            frequency: pref.frequency,
                            timePreference: pref.timePreference,
                            isPreferred: pref.isPreferred
                        }))
                    }
                }
            });
            // Publish event
            await this.kafkaService.publish('client.profile.created', {
                clientId: client.id,
                tenantId,
                clientType: client.clientType,
                timestamp: new Date().toISOString()
            });
            // Create initial onboarding workflow
            const onboardingWorkflow = await this.createOnboardingWorkflow(client.id, tenantId, userId);
            // Initial suitability assessment
            const suitabilityAssessment = await this.createInitialSuitabilityAssessment(client.id, tenantId, request, userId);
            logger_1.logger.info('Client profile created successfully', {
                clientId: client.id,
                clientNumber: client.clientNumber
            });
            return {
                client,
                totalAssets: new library_1.Decimal(0)
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating client profile:', error);
            throw error;
        }
    }
    async getClientProfile(clientId, tenantId) {
        try {
            logger_1.logger.info('Retrieving client profile', { clientId, tenantId });
            // Fetch from database
            const dbClient = await this.prisma.clientProfile.findFirst({
                where: {
                    id: clientId,
                    tenantId
                },
                include: {
                    addresses: true,
                    investmentObjectives: true,
                    investmentRestrictions: true,
                    communicationPreferences: true
                }
            });
            if (!dbClient) {
                throw new Error(`Client profile not found: ${clientId}`);
            }
            // Convert database record to interface format
            const client = {
                id: dbClient.id,
                tenantId: dbClient.tenantId,
                clientNumber: dbClient.clientNumber,
                clientType: dbClient.clientType,
                status: dbClient.status,
                firstName: dbClient.firstName || undefined,
                lastName: dbClient.lastName || undefined,
                middleName: dbClient.middleName || undefined,
                entityName: dbClient.entityName || undefined,
                dateOfBirth: dbClient.dateOfBirth || undefined,
                socialSecurityNumber: dbClient.socialSecurityNumber || undefined,
                taxId: dbClient.taxId || undefined,
                email: dbClient.email,
                phoneNumber: dbClient.phoneNumber || undefined,
                mobileNumber: dbClient.mobileNumber || undefined,
                primaryAddress: {
                    ...dbClient.addresses.find(addr => addr.isPrimary) || dbClient.addresses[0] || {
                        id: '',
                        clientId: dbClient.id,
                        street1: '',
                        street2: undefined,
                        city: '',
                        state: '',
                        postalCode: '',
                        country: '',
                        isPrimary: true
                    },
                    street2: (dbClient.addresses.find(addr => addr.isPrimary) || dbClient.addresses[0])?.street2 || undefined
                },
                investmentObjectives: dbClient.investmentObjectives.map(obj => ({
                    id: obj.id,
                    objective: obj.objective,
                    priority: obj.priority,
                    targetAllocation: obj.targetAllocation || undefined,
                    description: obj.description || undefined
                })),
                riskTolerance: dbClient.riskTolerance,
                investmentExperience: dbClient.investmentExperience,
                liquidityNeeds: dbClient.liquidityNeeds,
                timeHorizon: dbClient.timeHorizon,
                netWorth: dbClient.netWorth || undefined,
                annualIncome: dbClient.annualIncome || undefined,
                liquidNetWorth: dbClient.liquidNetWorth || undefined,
                investmentExperienceYears: dbClient.investmentExperienceYears || undefined,
                investmentRestrictions: dbClient.investmentRestrictions.map(res => ({
                    id: res.id,
                    restrictionType: res.restrictionType,
                    description: res.description,
                    appliesTo: res.appliesTo,
                    isActive: res.isActive,
                    effectiveDate: res.effectiveDate,
                    expirationDate: res.expirationDate || undefined
                })),
                documentDeliveryPreference: dbClient.documentDeliveryPreference,
                communicationPreferences: dbClient.communicationPreferences.map(pref => ({
                    method: pref.method,
                    frequency: pref.frequency,
                    timePreference: pref.timePreference || undefined,
                    isPreferred: pref.isPreferred
                })),
                politicallyExposedPerson: dbClient.politicallyExposedPerson,
                employeeOfBrokerDealer: dbClient.employeeOfBrokerDealer,
                directorOfPublicCompany: dbClient.directorOfPublicCompany,
                primaryAdvisor: dbClient.primaryAdvisor || undefined,
                assignedTeam: dbClient.assignedTeam,
                relationshipStartDate: dbClient.relationshipStartDate,
                lastContactDate: dbClient.lastContactDate || undefined,
                createdAt: dbClient.createdAt,
                updatedAt: dbClient.updatedAt,
                createdBy: dbClient.createdBy,
                updatedBy: dbClient.updatedBy
            };
            // Get portfolio information
            const portfolios = await this.getClientPortfolios(clientId, tenantId);
            const totalAssets = await this.calculateTotalAssets(clientId, tenantId);
            // Get household information
            const householdInfo = await this.getHouseholdInfo(clientId, tenantId);
            return {
                client,
                portfolios,
                totalAssets,
                householdInfo
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving client profile:', error);
            throw error;
        }
    }
    async updateClientProfile(clientId, tenantId, updates, userId) {
        try {
            logger_1.logger.info('Updating client profile', { clientId, tenantId });
            // Separate complex relations from simple updates
            const { investmentObjectives, communicationPreferences, investmentRestrictions, ...simpleUpdates } = updates;
            // Update in database
            await this.prisma.clientProfile.update({
                where: {
                    id: clientId,
                    tenantId: tenantId
                },
                data: {
                    ...simpleUpdates,
                    updatedAt: new Date(),
                    updatedBy: userId
                }
            });
            // Handle complex relation updates separately if needed
            if (investmentObjectives) {
                // Mock handling - would implement proper nested relation updates
                logger_1.logger.debug('Investment objectives update requested', { clientId, count: investmentObjectives.length });
            }
            if (communicationPreferences) {
                // Mock handling - would implement proper nested relation updates  
                logger_1.logger.debug('Communication preferences update requested', { clientId, count: communicationPreferences.length });
            }
            if (investmentRestrictions) {
                // Mock handling - would implement proper nested relation updates
                logger_1.logger.debug('Investment restrictions update requested', { clientId, count: investmentRestrictions.length });
            }
            // Publish event
            await this.kafkaService.publish('client.profile.updated', {
                clientId,
                tenantId,
                updates: Object.keys(updates),
                timestamp: new Date().toISOString()
            });
            return await this.getClientProfile(clientId, tenantId);
        }
        catch (error) {
            logger_1.logger.error('Error updating client profile:', error);
            throw error;
        }
    }
    // Onboarding Workflow Management
    async createOnboardingWorkflow(clientId, tenantId, userId) {
        try {
            logger_1.logger.info('Creating onboarding workflow', { clientId, tenantId });
            const workflow = {
                id: (0, crypto_1.randomUUID)(),
                clientId,
                tenantId,
                workflowTemplate: 'STANDARD_INDIVIDUAL',
                status: ClientRelationship_1.OnboardingStatus.IN_PROGRESS,
                currentStep: 1,
                totalSteps: 8,
                steps: this.getStandardOnboardingSteps(),
                startedDate: new Date(),
                estimatedCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                assignedAdvisor: userId,
                assignedTeam: [userId],
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId,
                updatedBy: userId
            };
            // Store in database
            await this.prisma.onboardingWorkflow.create({
                data: {
                    ...workflow,
                    steps: {
                        create: workflow.steps.map(step => ({
                            stepNumber: step.stepNumber,
                            stepName: step.stepName,
                            description: step.description,
                            isRequired: step.isRequired,
                            isCompleted: step.isCompleted,
                            requiredDocuments: step.requiredDocuments,
                            requiredActions: step.requiredActions,
                            dependsOnSteps: step.dependsOnSteps,
                            estimatedDuration: step.estimatedDuration,
                            notes: step.notes
                        }))
                    }
                }
            });
            // Publish event
            await this.kafkaService.publish('client.onboarding.started', {
                workflowId: workflow.id,
                clientId,
                tenantId,
                timestamp: new Date().toISOString()
            });
            return workflow;
        }
        catch (error) {
            logger_1.logger.error('Error creating onboarding workflow:', error);
            throw error;
        }
    }
    async updateOnboardingStep(workflowId, stepNumber, tenantId, userId, notes) {
        try {
            logger_1.logger.info('Updating onboarding step', { workflowId, stepNumber, tenantId });
            // This would update in database
            // const workflow = await this.prisma.onboardingWorkflow.update({
            //   where: { id: workflowId, tenantId },
            //   data: {
            //     steps: {
            //       updateMany: {
            //         where: { stepNumber },
            //         data: {
            //           isCompleted: true,
            //           completedDate: new Date(),
            //           completedBy: userId,
            //           notes
            //         }
            //       }
            //     },
            //     updatedAt: new Date(),
            //     updatedBy: userId
            //   }
            // });
            // Check if all steps are completed
            const allStepsCompleted = true; // This would check actual workflow data
            if (allStepsCompleted) {
                // Complete onboarding
                await this.completeOnboarding(workflowId, tenantId, userId);
            }
            // Mock return
            return {};
        }
        catch (error) {
            logger_1.logger.error('Error updating onboarding step:', error);
            throw error;
        }
    }
    // Suitability Assessment
    async createSuitabilityAssessment(request, tenantId, userId) {
        try {
            logger_1.logger.info('Creating suitability assessment', {
                clientId: request.clientId,
                assessmentType: request.assessmentType
            });
            const assessment = {
                id: (0, crypto_1.randomUUID)(),
                clientId: request.clientId,
                tenantId,
                assessmentDate: new Date(),
                assessmentType: request.assessmentType,
                riskTolerance: request.riskTolerance,
                riskCapacity: this.calculateRiskCapacity(request.netWorth, request.annualIncome),
                investmentObjectives: request.investmentObjectives,
                timeHorizon: request.timeHorizon,
                liquidityNeeds: request.liquidityNeeds,
                netWorth: request.netWorth,
                annualIncome: request.annualIncome,
                investmentExperience: request.investmentExperience,
                overallScore: this.calculateSuitabilityScore(request),
                riskScore: this.calculateRiskScore(request.riskTolerance, request.netWorth),
                objectiveAlignment: this.calculateObjectiveAlignment(request.investmentObjectives),
                recommendedAllocation: this.generateRecommendedAllocation(request),
                unsuitableInvestments: this.identifyUnsuitableInvestments(request),
                reviewedBy: userId,
                reviewDate: new Date(),
                nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId
            };
            // Store in database
            await this.prisma.suitabilityAssessment.create({
                data: {
                    ...assessment,
                    recommendedAllocation: assessment.recommendedAllocation
                }
            });
            // Publish event
            await this.kafkaService.publish('client.suitability.assessed', {
                assessmentId: assessment.id,
                clientId: request.clientId,
                tenantId,
                overallScore: assessment.overallScore,
                timestamp: new Date().toISOString()
            });
            return assessment;
        }
        catch (error) {
            logger_1.logger.error('Error creating suitability assessment:', error);
            throw error;
        }
    }
    // Meeting Management
    async scheduleMeeting(request, tenantId, userId) {
        try {
            logger_1.logger.info('Scheduling client meeting', {
                clientId: request.clientId,
                meetingType: request.meetingType
            });
            const meeting = {
                id: (0, crypto_1.randomUUID)(),
                clientId: request.clientId,
                tenantId,
                meetingType: request.meetingType,
                title: request.title,
                scheduledDate: request.scheduledDate,
                duration: request.duration,
                location: request.location,
                isVirtual: request.isVirtual,
                virtualMeetingLink: request.virtualMeetingLink,
                advisors: request.advisors.map(advisor => ({
                    ...advisor,
                    attendanceStatus: 'NOT_RESPONDED'
                })),
                clients: request.clients.map(client => ({
                    ...client,
                    attendanceStatus: 'NOT_RESPONDED'
                })),
                agenda: request.agenda,
                actionItems: [],
                followUpRequired: false,
                status: 'SCHEDULED',
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId,
                updatedBy: userId
            };
            // Store in database
            await this.prisma.clientMeeting.create({
                data: {
                    ...meeting,
                    participants: {
                        create: meeting.advisors.concat(meeting.clients).map(participant => ({
                            userId: participant.userId,
                            name: participant.name,
                            role: participant.role,
                            isRequired: participant.isRequired,
                            attendanceStatus: participant.attendanceStatus
                        }))
                    },
                    actionItems: {
                        create: meeting.actionItems.map(item => ({
                            description: item.description,
                            assignedTo: item.assignedTo,
                            dueDate: item.dueDate,
                            priority: item.priority,
                            status: item.status,
                            notes: item.notes
                        }))
                    }
                }
            });
            // Send calendar invites (would integrate with calendar service)
            await this.sendMeetingInvites(meeting);
            // Publish event
            await this.kafkaService.publish('client.meeting.scheduled', {
                meetingId: meeting.id,
                clientId: request.clientId,
                tenantId,
                scheduledDate: meeting.scheduledDate.toISOString(),
                timestamp: new Date().toISOString()
            });
            return meeting;
        }
        catch (error) {
            logger_1.logger.error('Error scheduling meeting:', error);
            throw error;
        }
    }
    // Communication Management
    async recordCommunication(request, tenantId, userId) {
        try {
            logger_1.logger.info('Recording client communication', {
                clientId: request.clientId,
                communicationType: request.communicationType
            });
            const communication = {
                id: (0, crypto_1.randomUUID)(),
                clientId: request.clientId,
                tenantId,
                communicationType: request.communicationType,
                subject: request.subject,
                content: request.content,
                direction: request.direction,
                contactedBy: userId,
                contactedAt: new Date(),
                followUpRequired: request.followUpRequired,
                followUpDate: request.followUpDate,
                category: request.category,
                priority: request.priority,
                attachments: [],
                createdAt: new Date(),
                createdBy: userId
            };
            // Store in database - use explicit field mapping to avoid Prisma type conflicts
            await this.prisma.communicationHistory.create({
                data: {
                    id: communication.id,
                    clientId: communication.clientId,
                    tenantId: communication.tenantId,
                    communicationType: communication.communicationType,
                    subject: communication.subject,
                    content: communication.content,
                    direction: communication.direction,
                    contactedBy: communication.contactedBy,
                    contactedAt: communication.contactedAt,
                    followUpRequired: communication.followUpRequired || false,
                    followUpDate: communication.followUpDate || undefined,
                    category: communication.category || 'GENERAL',
                    priority: communication.priority || 'MEDIUM',
                    createdAt: communication.createdAt,
                    createdBy: communication.createdBy
                }
            });
            // Update client last contact date
            await this.updateLastContactDate(request.clientId, tenantId);
            // Publish event
            await this.kafkaService.publish('client.communication.recorded', {
                communicationId: communication.id,
                clientId: request.clientId,
                tenantId,
                communicationType: request.communicationType,
                timestamp: new Date().toISOString()
            });
            return communication;
        }
        catch (error) {
            logger_1.logger.error('Error recording communication:', error);
            throw error;
        }
    }
    // Analytics and Reporting
    async getClientAnalytics(clientId, tenantId) {
        try {
            logger_1.logger.info('Generating client analytics', { clientId, tenantId });
            // This would calculate from actual data
            const analytics = {
                clientId,
                portfolioCount: 2,
                totalAssets: new library_1.Decimal(1000000),
                assetAllocation: [
                    {
                        assetClass: 'Equities',
                        targetPercentage: new library_1.Decimal(60),
                        rationale: 'Growth oriented'
                    },
                    {
                        assetClass: 'Fixed Income',
                        targetPercentage: new library_1.Decimal(30),
                        rationale: 'Stability and income'
                    },
                    {
                        assetClass: 'Cash',
                        targetPercentage: new library_1.Decimal(10),
                        rationale: 'Liquidity needs'
                    }
                ],
                performanceMetrics: {
                    ytdReturn: new library_1.Decimal(8.5),
                    oneYearReturn: new library_1.Decimal(12.3),
                    threeYearReturn: new library_1.Decimal(9.8),
                    inceptionReturn: new library_1.Decimal(7.2),
                    volatility: new library_1.Decimal(15.4),
                    sharpeRatio: new library_1.Decimal(0.78)
                },
                riskMetrics: {
                    valueAtRisk: new library_1.Decimal(45000),
                    trackingError: new library_1.Decimal(2.1),
                    beta: new library_1.Decimal(0.95),
                    correlation: new library_1.Decimal(0.87)
                },
                activitySummary: {
                    lastTradeDate: new Date(),
                    tradesYtd: 15,
                    lastMeetingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    nextMeetingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    lastContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            };
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Error generating client analytics:', error);
            throw error;
        }
    }
    async getClientSegmentation(tenantId) {
        try {
            logger_1.logger.info('Generating client segmentation', { tenantId });
            // This would be calculated from actual client data
            const segmentation = [
                {
                    segmentName: 'High Net Worth',
                    criteria: {
                        minAssets: new library_1.Decimal(1000000),
                        clientType: [ClientRelationship_1.ClientType.INDIVIDUAL, ClientRelationship_1.ClientType.JOINT]
                    },
                    clientCount: 145,
                    totalAssets: new library_1.Decimal(250000000),
                    averageAssets: new library_1.Decimal(1724138)
                },
                {
                    segmentName: 'Mass Affluent',
                    criteria: {
                        minAssets: new library_1.Decimal(250000),
                        maxAssets: new library_1.Decimal(999999),
                        clientType: [ClientRelationship_1.ClientType.INDIVIDUAL, ClientRelationship_1.ClientType.JOINT]
                    },
                    clientCount: 423,
                    totalAssets: new library_1.Decimal(180000000),
                    averageAssets: new library_1.Decimal(425532)
                },
                {
                    segmentName: 'Conservative Investors',
                    criteria: {
                        riskTolerance: [ClientRelationship_1.RiskTolerance.CONSERVATIVE, ClientRelationship_1.RiskTolerance.MODERATE_CONSERVATIVE]
                    },
                    clientCount: 298,
                    totalAssets: new library_1.Decimal(95000000),
                    averageAssets: new library_1.Decimal(318792)
                }
            ];
            return segmentation;
        }
        catch (error) {
            logger_1.logger.error('Error generating client segmentation:', error);
            throw error;
        }
    }
    // Helper Methods
    async generateClientNumber(tenantId) {
        // This would generate a unique client number based on tenant rules
        const timestamp = Date.now().toString().slice(-6);
        return `CLT-${timestamp}`;
    }
    getStandardOnboardingSteps() {
        return [
            {
                stepNumber: 1,
                stepName: 'Initial Documentation',
                description: 'Collect and review all required client documentation',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: ['Government ID', 'Proof of Address', 'Tax Documents'],
                requiredActions: ['Document Upload', 'Identity Verification'],
                dependsOnSteps: [],
                estimatedDuration: 2
            },
            {
                stepNumber: 2,
                stepName: 'KYC/AML Screening',
                description: 'Complete Know Your Customer and Anti-Money Laundering checks',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: [],
                requiredActions: ['Background Check', 'Sanctions Screening'],
                dependsOnSteps: [1],
                estimatedDuration: 1
            },
            {
                stepNumber: 3,
                stepName: 'Investment Profile Assessment',
                description: 'Complete comprehensive investment profile and suitability assessment',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: ['Financial Statements'],
                requiredActions: ['Risk Assessment', 'Investment Objectives'],
                dependsOnSteps: [2],
                estimatedDuration: 3
            },
            {
                stepNumber: 4,
                stepName: 'Account Setup',
                description: 'Open investment accounts and complete custodian paperwork',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: ['Account Opening Forms'],
                requiredActions: ['Custodian Setup', 'Banking Details'],
                dependsOnSteps: [3],
                estimatedDuration: 2
            },
            {
                stepNumber: 5,
                stepName: 'Investment Policy Statement',
                description: 'Create and approve Investment Policy Statement',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: [],
                requiredActions: ['IPS Creation', 'Client Approval'],
                dependsOnSteps: [3],
                estimatedDuration: 2
            },
            {
                stepNumber: 6,
                stepName: 'Initial Portfolio Construction',
                description: 'Build initial portfolio based on investment objectives',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: [],
                requiredActions: ['Portfolio Design', 'Security Selection'],
                dependsOnSteps: [4, 5],
                estimatedDuration: 3
            },
            {
                stepNumber: 7,
                stepName: 'Trading Authorization',
                description: 'Execute initial trades and fund accounts',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: [],
                requiredActions: ['Fund Transfer', 'Initial Trades'],
                dependsOnSteps: [6],
                estimatedDuration: 1
            },
            {
                stepNumber: 8,
                stepName: 'Welcome and Ongoing Service Setup',
                description: 'Complete onboarding and setup ongoing service model',
                isRequired: true,
                isCompleted: false,
                requiredDocuments: [],
                requiredActions: ['Welcome Meeting', 'Service Model Assignment'],
                dependsOnSteps: [7],
                estimatedDuration: 1
            }
        ];
    }
    async createInitialSuitabilityAssessment(clientId, tenantId, request, userId) {
        const suitabilityRequest = {
            clientId,
            assessmentType: 'INITIAL',
            riskTolerance: request.riskTolerance,
            investmentObjectives: request.investmentObjectives.map(obj => obj.objective),
            timeHorizon: request.timeHorizon,
            liquidityNeeds: request.liquidityNeeds,
            netWorth: new library_1.Decimal(0), // Would be collected separately
            annualIncome: new library_1.Decimal(0), // Would be collected separately
            investmentExperience: request.investmentExperience
        };
        return await this.createSuitabilityAssessment(suitabilityRequest, tenantId, userId);
    }
    calculateRiskCapacity(netWorth, annualIncome) {
        const investableAssets = netWorth.add(annualIncome.mul(2));
        if (investableAssets.lt(100000))
            return 'LOW';
        if (investableAssets.lt(500000))
            return 'MODERATE';
        return 'HIGH';
    }
    calculateSuitabilityScore(request) {
        // Simplified scoring algorithm
        let score = 50;
        // Risk tolerance adjustment
        switch (request.riskTolerance) {
            case ClientRelationship_1.RiskTolerance.CONSERVATIVE:
                score += 10;
                break;
            case ClientRelationship_1.RiskTolerance.AGGRESSIVE:
                score += 20;
                break;
            default:
                score += 15;
        }
        // Experience adjustment
        switch (request.investmentExperience) {
            case ClientRelationship_1.InvestmentExperience.EXTENSIVE:
            case ClientRelationship_1.InvestmentExperience.PROFESSIONAL:
                score += 20;
                break;
            case ClientRelationship_1.InvestmentExperience.MODERATE:
                score += 15;
                break;
            default:
                score += 10;
        }
        // Time horizon adjustment
        if (request.timeHorizon > 10)
            score += 15;
        else if (request.timeHorizon > 5)
            score += 10;
        else
            score += 5;
        return Math.min(score, 100);
    }
    calculateRiskScore(riskTolerance, netWorth) {
        let score = 50;
        switch (riskTolerance) {
            case ClientRelationship_1.RiskTolerance.CONSERVATIVE:
                score = 20;
                break;
            case ClientRelationship_1.RiskTolerance.MODERATE_CONSERVATIVE:
                score = 35;
                break;
            case ClientRelationship_1.RiskTolerance.MODERATE:
                score = 50;
                break;
            case ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE:
                score = 65;
                break;
            case ClientRelationship_1.RiskTolerance.AGGRESSIVE:
                score = 80;
                break;
        }
        // Adjust based on net worth
        if (netWorth.gt(1000000))
            score += 10;
        else if (netWorth.lt(100000))
            score -= 10;
        return Math.max(0, Math.min(score, 100));
    }
    calculateObjectiveAlignment(objectives) {
        // Simplified alignment score based on objective consistency
        return objectives.length > 0 ? 85 : 50;
    }
    generateRecommendedAllocation(request) {
        // Generate allocation based on risk tolerance and time horizon
        const allocations = [];
        switch (request.riskTolerance) {
            case ClientRelationship_1.RiskTolerance.CONSERVATIVE:
                allocations.push({ assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(70), rationale: 'Capital preservation' }, { assetClass: 'Equities', targetPercentage: new library_1.Decimal(20), rationale: 'Long-term growth' }, { assetClass: 'Cash', targetPercentage: new library_1.Decimal(10), rationale: 'Liquidity' });
                break;
            case ClientRelationship_1.RiskTolerance.MODERATE:
                allocations.push({ assetClass: 'Equities', targetPercentage: new library_1.Decimal(60), rationale: 'Growth potential' }, { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(30), rationale: 'Stability' }, { assetClass: 'Cash', targetPercentage: new library_1.Decimal(10), rationale: 'Liquidity' });
                break;
            case ClientRelationship_1.RiskTolerance.AGGRESSIVE:
                allocations.push({ assetClass: 'Equities', targetPercentage: new library_1.Decimal(80), rationale: 'Maximum growth' }, { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(15), rationale: 'Diversification' }, { assetClass: 'Cash', targetPercentage: new library_1.Decimal(5), rationale: 'Liquidity' });
                break;
            default:
                allocations.push({ assetClass: 'Equities', targetPercentage: new library_1.Decimal(50), rationale: 'Balanced approach' }, { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(40), rationale: 'Stability' }, { assetClass: 'Cash', targetPercentage: new library_1.Decimal(10), rationale: 'Liquidity' });
        }
        return allocations;
    }
    identifyUnsuitableInvestments(request) {
        const unsuitable = [];
        if (request.riskTolerance === ClientRelationship_1.RiskTolerance.CONSERVATIVE) {
            unsuitable.push('Leveraged ETFs', 'Penny Stocks', 'Cryptocurrency', 'Private Equity');
        }
        if (request.investmentExperience === ClientRelationship_1.InvestmentExperience.NOVICE) {
            unsuitable.push('Options', 'Futures', 'Complex Derivatives');
        }
        if (request.liquidityNeeds === ClientRelationship_1.LiquidityNeeds.HIGH) {
            unsuitable.push('Real Estate', 'Private Equity', 'Long-term CDs');
        }
        return unsuitable;
    }
    async completeOnboarding(workflowId, tenantId, userId) {
        // Update workflow status
        // await this.prisma.onboardingWorkflow.update({
        //   where: { id: workflowId, tenantId },
        //   data: {
        //     status: OnboardingStatus.COMPLETED,
        //     actualCompletionDate: new Date(),
        //     updatedAt: new Date(),
        //     updatedBy: userId
        //   }
        // });
        // Publish event
        await this.kafkaService.publish('client.onboarding.completed', {
            workflowId,
            tenantId,
            completedBy: userId,
            timestamp: new Date().toISOString()
        });
    }
    async sendMeetingInvites(meeting) {
        // This would integrate with calendar service to send invites
        logger_1.logger.info('Sending meeting invites', { meetingId: meeting.id });
    }
    async updateLastContactDate(clientId, tenantId) {
        // Update client's last contact date
        await this.prisma.clientProfile.update({
            where: {
                id: clientId,
                tenantId: tenantId
            },
            data: {
                lastContactDate: new Date()
            }
        });
    }
    async getClientPortfolios(clientId, tenantId) {
        // This would fetch client's portfolios
        return [];
    }
    async calculateTotalAssets(clientId, tenantId) {
        // This would calculate total assets across all portfolios
        return new library_1.Decimal(0);
    }
    async getHouseholdInfo(clientId, tenantId) {
        // This would fetch household information if client is part of a household
        return null;
    }
}
exports.ClientRelationshipService = ClientRelationshipService;

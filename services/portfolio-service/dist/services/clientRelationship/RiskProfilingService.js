"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskProfilingService = void 0;
const prisma_1 = require("../../utils/prisma");
const kafka_mock_1 = require("../../utils/kafka-mock");
const logger_1 = require("../../utils/logger");
const library_1 = require("@prisma/client/runtime/library");
const crypto_1 = require("crypto");
const ClientRelationship_1 = require("../../models/clientRelationship/ClientRelationship");
class RiskProfilingService {
    prisma = (0, prisma_1.getPrismaClient)();
    kafkaService = (0, kafka_mock_1.getKafkaService)();
    /**
     * Complete comprehensive risk profiling assessment
     */
    async completeRiskAssessment(clientId, questionnaire, tenantId, userId) {
        try {
            logger_1.logger.info('Completing risk assessment', { clientId, tenantId });
            // Verify client exists
            const client = await this.prisma.clientProfile.findFirst({
                where: { id: clientId, tenantId }
            });
            if (!client) {
                throw new Error(`Client not found: ${clientId}`);
            }
            // Calculate risk scores
            const riskScores = this.calculateRiskScores(questionnaire.responses);
            const overallRiskScore = this.calculateOverallRiskScore(riskScores);
            const recommendedRiskTolerance = this.determineRiskTolerance(overallRiskScore);
            const riskCapacity = this.assessRiskCapacity(clientId, tenantId);
            // Create questionnaire record
            const completedQuestionnaire = {
                id: (0, crypto_1.randomUUID)(),
                clientId,
                questionnaireVersion: questionnaire.questionnaireVersion,
                completedDate: new Date(),
                responses: questionnaire.responses,
                calculatedRiskScore: overallRiskScore,
                recommendedRiskTolerance,
                isValid: true,
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                completedBy: userId
            };
            // Store questionnaire in database
            await this.prisma.riskProfileQuestionnaire.create({
                data: {
                    id: completedQuestionnaire.id,
                    clientId: completedQuestionnaire.clientId,
                    questionnaireVersion: completedQuestionnaire.questionnaireVersion,
                    completedDate: completedQuestionnaire.completedDate,
                    responses: JSON.stringify(completedQuestionnaire.responses),
                    calculatedRiskScore: completedQuestionnaire.calculatedRiskScore,
                    recommendedRiskTolerance: completedQuestionnaire.recommendedRiskTolerance,
                    isValid: completedQuestionnaire.isValid,
                    expirationDate: completedQuestionnaire.expirationDate,
                    completedBy: completedQuestionnaire.completedBy
                }
            });
            // Generate recommendations and warnings
            const recommendations = await this.generateRiskRecommendations(clientId, overallRiskScore, recommendedRiskTolerance, await riskCapacity, tenantId);
            const warnings = await this.identifyRiskWarnings(clientId, overallRiskScore, recommendedRiskTolerance, await riskCapacity, tenantId);
            const result = {
                clientId,
                overallRiskScore,
                riskTolerance: recommendedRiskTolerance,
                riskCapacity: await riskCapacity,
                componentScores: riskScores,
                recommendations,
                warnings,
                nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            };
            // Update client's risk tolerance if significantly different
            if (client.riskTolerance !== recommendedRiskTolerance) {
                await this.prisma.clientProfile.update({
                    where: { id: clientId },
                    data: {
                        riskTolerance: recommendedRiskTolerance,
                        updatedAt: new Date(),
                        updatedBy: userId
                    }
                });
                // Publish risk tolerance change event
                await this.kafkaService.publish('client.risk_tolerance.changed', {
                    clientId,
                    previousRiskTolerance: client.riskTolerance,
                    newRiskTolerance: recommendedRiskTolerance,
                    assessmentId: completedQuestionnaire.id,
                    tenantId,
                    timestamp: new Date().toISOString()
                });
            }
            // Publish risk assessment completed event
            await this.kafkaService.publish('client.risk_assessment.completed', {
                clientId,
                assessmentId: completedQuestionnaire.id,
                riskScore: overallRiskScore,
                riskTolerance: recommendedRiskTolerance,
                warnings: warnings.length,
                tenantId,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Risk assessment completed successfully', {
                clientId,
                assessmentId: completedQuestionnaire.id,
                riskScore: overallRiskScore
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error completing risk assessment:', error);
            throw error;
        }
    }
    /**
     * Perform comprehensive suitability assessment
     */
    async performSuitabilityAssessment(request, tenantId, userId) {
        try {
            logger_1.logger.info('Performing suitability assessment', {
                clientId: request.clientId,
                assessmentType: request.assessmentType,
                tenantId
            });
            // Get client and portfolio information
            const client = await this.prisma.clientProfile.findFirst({
                where: { id: request.clientId, tenantId }
            });
            if (!client) {
                throw new Error(`Client not found: ${request.clientId}`);
            }
            // Calculate suitability scores
            const overallScore = this.calculateSuitabilityScore(request, client);
            const riskScore = this.calculateRiskAlignment(request.riskTolerance, client.riskTolerance);
            const objectiveAlignment = this.calculateObjectiveAlignment(request.investmentObjectives, client);
            // Generate asset allocation recommendations
            const recommendedAllocation = this.generateAssetAllocation(request.riskTolerance, request.timeHorizon, request.liquidityNeeds, request.investmentObjectives);
            // Identify unsuitable investments
            const unsuitableInvestments = await this.identifyUnsuitableInvestments(request.clientId, request.riskTolerance, request.investmentObjectives, tenantId);
            const assessment = {
                id: (0, crypto_1.randomUUID)(),
                clientId: request.clientId,
                tenantId,
                assessmentDate: new Date(),
                assessmentType: request.assessmentType,
                riskTolerance: request.riskTolerance,
                riskCapacity: this.determineRiskCapacity(request.netWorth, request.annualIncome),
                investmentObjectives: request.investmentObjectives,
                timeHorizon: request.timeHorizon,
                liquidityNeeds: request.liquidityNeeds,
                netWorth: request.netWorth,
                annualIncome: request.annualIncome,
                investmentExperience: request.investmentExperience,
                overallScore,
                riskScore,
                objectiveAlignment,
                recommendedAllocation,
                unsuitableInvestments,
                reviewedBy: userId,
                reviewDate: new Date(),
                nextReviewDate: this.calculateNextReviewDate(request.assessmentType),
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId
            };
            // Store assessment in database
            await this.prisma.suitabilityAssessment.create({
                data: {
                    id: assessment.id,
                    clientId: assessment.clientId,
                    tenantId: assessment.tenantId,
                    assessmentDate: assessment.assessmentDate,
                    assessmentType: assessment.assessmentType,
                    riskTolerance: assessment.riskTolerance,
                    riskCapacity: assessment.riskCapacity,
                    investmentObjectives: assessment.investmentObjectives,
                    timeHorizon: assessment.timeHorizon,
                    liquidityNeeds: assessment.liquidityNeeds,
                    netWorth: assessment.netWorth,
                    annualIncome: assessment.annualIncome,
                    investmentExperience: assessment.investmentExperience,
                    overallScore: assessment.overallScore,
                    riskScore: assessment.riskScore,
                    objectiveAlignment: assessment.objectiveAlignment,
                    recommendedAllocation: JSON.stringify(assessment.recommendedAllocation),
                    unsuitableInvestments: assessment.unsuitableInvestments,
                    reviewedBy: assessment.reviewedBy,
                    reviewDate: assessment.reviewDate,
                    nextReviewDate: assessment.nextReviewDate,
                    createdAt: assessment.createdAt,
                    updatedAt: assessment.updatedAt,
                    createdBy: assessment.createdBy
                }
            });
            // Publish suitability assessment event
            await this.kafkaService.publish('client.suitability_assessment.completed', {
                assessmentId: assessment.id,
                clientId: request.clientId,
                assessmentType: request.assessmentType,
                overallScore,
                unsuitableInvestmentsCount: unsuitableInvestments.length,
                tenantId,
                timestamp: new Date().toISOString()
            });
            // Trigger portfolio review if significant issues found
            if (overallScore < 70 || unsuitableInvestments.length > 0) {
                await this.triggerPortfolioReview(request.clientId, assessment.id, tenantId);
            }
            logger_1.logger.info('Suitability assessment completed successfully', {
                assessmentId: assessment.id,
                clientId: request.clientId,
                overallScore
            });
            return assessment;
        }
        catch (error) {
            logger_1.logger.error('Error performing suitability assessment:', error);
            throw error;
        }
    }
    /**
     * Monitor ongoing suitability and generate alerts
     */
    async monitorSuitability(clientId, tenantId) {
        try {
            logger_1.logger.info('Monitoring client suitability', { clientId, tenantId });
            const alerts = [];
            // Get client and portfolio data
            const client = await this.prisma.clientProfile.findFirst({
                where: { id: clientId, tenantId }
            });
            if (!client) {
                throw new Error(`Client not found: ${clientId}`);
            }
            // Check for portfolio drift
            const driftAlerts = await this.checkPortfolioDrift(client);
            alerts.push(...driftAlerts);
            // Check for concentration risk
            const concentrationAlerts = await this.checkConcentrationRisk(client);
            alerts.push(...concentrationAlerts);
            // Check for unsuitable investments
            const unsuitableAlerts = await this.checkUnsuitableInvestments(client);
            alerts.push(...unsuitableAlerts);
            // Store new alerts in database
            for (const alert of alerts) {
                await this.prisma.riskMonitoringAlert.create({
                    data: {
                        id: alert.id,
                        clientId: alert.clientId,
                        alertType: alert.alertType,
                        severity: alert.severity,
                        title: alert.title,
                        description: alert.description,
                        triggeredDate: alert.triggeredDate,
                        portfolioId: alert.portfolioId || undefined,
                        holdingSymbol: alert.holdingSymbol || undefined,
                        currentValue: alert.currentValue || undefined,
                        thresholdValue: alert.thresholdValue || undefined,
                        recommendedAction: alert.recommendedAction || 'No action specified',
                        isAcknowledged: alert.isAcknowledged,
                        isResolved: alert.isResolved
                    }
                });
                // Publish alert event
                await this.kafkaService.publish('client.suitability_alert.created', {
                    alertId: alert.id,
                    clientId: alert.clientId,
                    alertType: alert.alertType,
                    severity: alert.severity,
                    tenantId,
                    timestamp: new Date().toISOString()
                });
            }
            logger_1.logger.info('Suitability monitoring completed', {
                clientId,
                alertsGenerated: alerts.length
            });
            return alerts;
        }
        catch (error) {
            logger_1.logger.error('Error monitoring suitability:', error);
            throw error;
        }
    }
    /**
     * Get client's risk profile history
     */
    async getRiskProfileHistory(clientId, tenantId) {
        try {
            const questionnaires = await this.prisma.riskProfileQuestionnaire.findMany({
                where: { clientId },
                orderBy: { completedDate: 'desc' }
            });
            return questionnaires.map(q => ({
                id: q.id,
                clientId: q.clientId,
                questionnaireVersion: q.questionnaireVersion,
                completedDate: q.completedDate,
                responses: JSON.parse(q.responses),
                calculatedRiskScore: q.calculatedRiskScore.toNumber(),
                recommendedRiskTolerance: q.recommendedRiskTolerance,
                isValid: q.isValid,
                expirationDate: q.expirationDate,
                completedBy: q.completedBy
            }));
        }
        catch (error) {
            logger_1.logger.error('Error retrieving risk profile history:', error);
            throw error;
        }
    }
    /**
     * Get active suitability alerts for client
     */
    async getActiveSuitabilityAlerts(clientId, tenantId) {
        try {
            const alerts = await this.prisma.riskMonitoringAlert.findMany({
                where: {
                    clientId,
                    isResolved: false
                },
                orderBy: [
                    { severity: 'asc' }, // HIGH first
                    { triggeredDate: 'desc' }
                ]
            });
            return alerts.map(alert => ({
                id: alert.id,
                clientId: alert.clientId,
                alertType: alert.alertType,
                severity: alert.severity,
                title: alert.title,
                description: alert.description,
                triggeredDate: alert.triggeredDate,
                portfolioId: alert.portfolioId || undefined,
                holdingSymbol: alert.holdingSymbol || undefined,
                currentValue: alert.currentValue || undefined,
                thresholdValue: alert.thresholdValue || undefined,
                recommendedAction: alert.recommendedAction || 'No action specified',
                isAcknowledged: alert.isAcknowledged,
                acknowledgedBy: alert.acknowledgedBy || undefined,
                acknowledgedDate: alert.acknowledgedDate || undefined,
                isResolved: alert.isResolved,
                resolvedDate: alert.resolvedDate || undefined,
                resolution: alert.resolution || undefined
            }));
        }
        catch (error) {
            logger_1.logger.error('Error retrieving suitability alerts:', error);
            throw error;
        }
    }
    // Private helper methods
    calculateRiskScores(responses) {
        const scores = {
            riskCapacity: 0,
            riskTolerance: 0,
            investmentKnowledge: 0,
            timeHorizon: 0,
            liquidity: 0
        };
        const weights = {
            riskCapacity: 0,
            riskTolerance: 0,
            investmentKnowledge: 0,
            timeHorizon: 0,
            liquidity: 0
        };
        responses.forEach(response => {
            const category = response.category.toLowerCase();
            if (category === 'riskcapacity') {
                scores.riskCapacity += response.answerValue * response.weight;
                weights.riskCapacity += response.weight;
            }
            else if (category === 'risktolerance') {
                scores.riskTolerance += response.answerValue * response.weight;
                weights.riskTolerance += response.weight;
            }
            else if (category === 'investmentknowledge') {
                scores.investmentKnowledge += response.answerValue * response.weight;
                weights.investmentKnowledge += response.weight;
            }
            else if (category === 'timehorizon') {
                scores.timeHorizon += response.answerValue * response.weight;
                weights.timeHorizon += response.weight;
            }
            else if (category === 'liquidity') {
                scores.liquidity += response.answerValue * response.weight;
                weights.liquidity += response.weight;
            }
        });
        // Normalize scores
        Object.keys(scores).forEach(key => {
            const k = key;
            if (weights[k] > 0) {
                scores[k] = Math.round((scores[k] / weights[k]) * 100) / 100;
            }
        });
        return scores;
    }
    calculateOverallRiskScore(componentScores) {
        // Weighted average of component scores
        const weights = {
            riskCapacity: 0.25,
            riskTolerance: 0.30,
            investmentKnowledge: 0.20,
            timeHorizon: 0.15,
            liquidity: 0.10
        };
        const totalScore = Object.keys(componentScores).reduce((sum, key) => {
            const k = key;
            return sum + (componentScores[k] * weights[k]);
        }, 0);
        return Math.round(totalScore * 100) / 100;
    }
    determineRiskTolerance(riskScore) {
        if (riskScore <= 2)
            return ClientRelationship_1.RiskTolerance.CONSERVATIVE;
        if (riskScore <= 3)
            return ClientRelationship_1.RiskTolerance.MODERATE_CONSERVATIVE;
        if (riskScore <= 4)
            return ClientRelationship_1.RiskTolerance.MODERATE;
        if (riskScore <= 4.5)
            return ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE;
        return ClientRelationship_1.RiskTolerance.AGGRESSIVE;
    }
    async assessRiskCapacity(clientId, tenantId) {
        // Get client financial information
        const client = await this.prisma.clientProfile.findFirst({
            where: { id: clientId, tenantId }
        });
        if (!client)
            return 'LOW';
        const netWorth = client.netWorth ? client.netWorth.toNumber() : 0;
        const annualIncome = client.annualIncome ? client.annualIncome.toNumber() : 0;
        // Simple risk capacity assessment based on financial metrics
        if (netWorth > 1000000 && annualIncome > 200000)
            return 'HIGH';
        if (netWorth > 500000 && annualIncome > 100000)
            return 'MODERATE';
        return 'LOW';
    }
    async generateRiskRecommendations(clientId, riskScore, riskTolerance, riskCapacity, tenantId) {
        const recommendations = [];
        // Asset allocation recommendation
        recommendations.push({
            type: 'ASSET_ALLOCATION',
            priority: 'HIGH',
            title: 'Recommended Asset Allocation',
            description: `Based on your ${riskTolerance.toLowerCase()} risk profile, consider the following allocation`,
            actionItems: this.getAssetAllocationRecommendations(riskTolerance),
            rationale: `Your risk score of ${riskScore} indicates a ${riskTolerance.toLowerCase()} risk profile`
        });
        // Risk capacity vs tolerance alignment
        if (riskCapacity === 'LOW' && (riskTolerance === ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE || riskTolerance === ClientRelationship_1.RiskTolerance.AGGRESSIVE)) {
            recommendations.push({
                type: 'RISK_ADJUSTMENT',
                priority: 'HIGH',
                title: 'Risk Capacity Mismatch',
                description: 'Your risk tolerance exceeds your financial risk capacity',
                actionItems: [
                    'Consider reducing portfolio risk to align with financial capacity',
                    'Focus on building emergency fund before aggressive investing',
                    'Review investment timeline and objectives'
                ],
                rationale: 'Taking excessive risk relative to financial capacity can jeopardize financial security'
            });
        }
        return recommendations;
    }
    async identifyRiskWarnings(clientId, riskScore, riskTolerance, riskCapacity, tenantId) {
        const warnings = [];
        // Risk capacity vs tolerance mismatch
        if (riskCapacity === 'LOW' && (riskTolerance === ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE || riskTolerance === ClientRelationship_1.RiskTolerance.AGGRESSIVE)) {
            warnings.push({
                type: 'CAPACITY_CONCERN',
                severity: 'HIGH',
                title: 'Risk Capacity Insufficient',
                description: 'Client\'s financial situation may not support aggressive risk taking',
                requiredActions: [
                    'Document risk capacity limitations',
                    'Obtain client acknowledgment of risk mismatch',
                    'Consider portfolio adjustments'
                ],
                escalationRequired: true
            });
        }
        return warnings;
    }
    calculateSuitabilityScore(request, client) {
        let score = 100;
        // Risk tolerance alignment (30% weight)
        const riskAlignment = this.calculateRiskAlignment(request.riskTolerance, client.riskTolerance);
        score -= (100 - riskAlignment) * 0.3;
        // Time horizon alignment (25% weight)
        const timeHorizonDiff = Math.abs(request.timeHorizon - (client.timeHorizon || 10));
        const timeHorizonPenalty = Math.min(timeHorizonDiff * 5, 50);
        score -= timeHorizonPenalty * 0.25;
        // Investment experience alignment (25% weight)
        const experienceScore = this.getExperienceScore(request.investmentExperience);
        const clientExperienceScore = this.getExperienceScore(client.investmentExperience);
        const experienceDiff = Math.abs(experienceScore - clientExperienceScore);
        score -= experienceDiff * 5 * 0.25;
        // Liquidity needs alignment (20% weight)
        const liquidityAlignment = this.calculateLiquidityAlignment(request.liquidityNeeds, client.liquidityNeeds);
        score -= (100 - liquidityAlignment) * 0.2;
        return Math.max(0, Math.round(score));
    }
    calculateRiskAlignment(requestRisk, clientRisk) {
        const riskLevels = [
            ClientRelationship_1.RiskTolerance.CONSERVATIVE,
            ClientRelationship_1.RiskTolerance.MODERATE_CONSERVATIVE,
            ClientRelationship_1.RiskTolerance.MODERATE,
            ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE,
            ClientRelationship_1.RiskTolerance.AGGRESSIVE
        ];
        const requestIndex = riskLevels.indexOf(requestRisk);
        const clientIndex = riskLevels.indexOf(clientRisk);
        const difference = Math.abs(requestIndex - clientIndex);
        return Math.max(0, 100 - (difference * 25));
    }
    calculateObjectiveAlignment(requestObjectives, client) {
        // Simplified objective alignment calculation
        // In practice, this would compare against client's actual investment objectives
        return 85; // Placeholder
    }
    generateAssetAllocation(riskTolerance, timeHorizon, liquidityNeeds, objectives) {
        // Standard asset allocation models based on risk tolerance
        const allocations = {
            [ClientRelationship_1.RiskTolerance.CONSERVATIVE]: [
                { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(60), minPercentage: new library_1.Decimal(50), maxPercentage: new library_1.Decimal(70), rationale: 'Capital preservation focus' },
                { assetClass: 'Equities', targetPercentage: new library_1.Decimal(30), minPercentage: new library_1.Decimal(20), maxPercentage: new library_1.Decimal(40), rationale: 'Limited growth exposure' },
                { assetClass: 'Cash', targetPercentage: new library_1.Decimal(10), minPercentage: new library_1.Decimal(5), maxPercentage: new library_1.Decimal(15), rationale: 'Liquidity buffer' }
            ],
            [ClientRelationship_1.RiskTolerance.MODERATE_CONSERVATIVE]: [
                { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(50), minPercentage: new library_1.Decimal(40), maxPercentage: new library_1.Decimal(60), rationale: 'Stability with modest growth' },
                { assetClass: 'Equities', targetPercentage: new library_1.Decimal(40), minPercentage: new library_1.Decimal(30), maxPercentage: new library_1.Decimal(50), rationale: 'Moderate growth exposure' },
                { assetClass: 'Cash', targetPercentage: new library_1.Decimal(10), minPercentage: new library_1.Decimal(5), maxPercentage: new library_1.Decimal(15), rationale: 'Liquidity needs' }
            ],
            [ClientRelationship_1.RiskTolerance.MODERATE]: [
                { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(40), minPercentage: new library_1.Decimal(30), maxPercentage: new library_1.Decimal(50), rationale: 'Balanced approach' },
                { assetClass: 'Equities', targetPercentage: new library_1.Decimal(50), minPercentage: new library_1.Decimal(40), maxPercentage: new library_1.Decimal(60), rationale: 'Growth with stability' },
                { assetClass: 'Alternatives', targetPercentage: new library_1.Decimal(5), minPercentage: new library_1.Decimal(0), maxPercentage: new library_1.Decimal(10), rationale: 'Diversification' },
                { assetClass: 'Cash', targetPercentage: new library_1.Decimal(5), minPercentage: new library_1.Decimal(2), maxPercentage: new library_1.Decimal(10), rationale: 'Tactical opportunities' }
            ],
            [ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE]: [
                { assetClass: 'Equities', targetPercentage: new library_1.Decimal(65), minPercentage: new library_1.Decimal(55), maxPercentage: new library_1.Decimal(75), rationale: 'Growth focus' },
                { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(25), minPercentage: new library_1.Decimal(15), maxPercentage: new library_1.Decimal(35), rationale: 'Risk mitigation' },
                { assetClass: 'Alternatives', targetPercentage: new library_1.Decimal(7), minPercentage: new library_1.Decimal(2), maxPercentage: new library_1.Decimal(12), rationale: 'Enhanced returns' },
                { assetClass: 'Cash', targetPercentage: new library_1.Decimal(3), minPercentage: new library_1.Decimal(1), maxPercentage: new library_1.Decimal(8), rationale: 'Opportunity fund' }
            ],
            [ClientRelationship_1.RiskTolerance.AGGRESSIVE]: [
                { assetClass: 'Equities', targetPercentage: new library_1.Decimal(75), minPercentage: new library_1.Decimal(65), maxPercentage: new library_1.Decimal(85), rationale: 'Maximum growth potential' },
                { assetClass: 'Alternatives', targetPercentage: new library_1.Decimal(15), minPercentage: new library_1.Decimal(5), maxPercentage: new library_1.Decimal(25), rationale: 'Alpha generation' },
                { assetClass: 'Fixed Income', targetPercentage: new library_1.Decimal(8), minPercentage: new library_1.Decimal(3), maxPercentage: new library_1.Decimal(15), rationale: 'Minimal stability' },
                { assetClass: 'Cash', targetPercentage: new library_1.Decimal(2), minPercentage: new library_1.Decimal(0), maxPercentage: new library_1.Decimal(7), rationale: 'Tactical positioning' }
            ]
        };
        return allocations[riskTolerance];
    }
    async identifyUnsuitableInvestments(clientId, riskTolerance, objectives, tenantId) {
        // This would analyze client's current holdings against their risk profile
        // For now, return placeholder unsuitable investment types
        const unsuitable = [];
        if (riskTolerance === ClientRelationship_1.RiskTolerance.CONSERVATIVE) {
            unsuitable.push('High-yield bonds', 'Emerging market equities', 'Leveraged ETFs');
        }
        return unsuitable;
    }
    determineRiskCapacity(netWorth, annualIncome) {
        const netWorthNum = netWorth.toNumber();
        const incomeNum = annualIncome.toNumber();
        if (netWorthNum > 1000000 && incomeNum > 200000)
            return 'HIGH';
        if (netWorthNum > 500000 && incomeNum > 100000)
            return 'MODERATE';
        return 'LOW';
    }
    calculateNextReviewDate(assessmentType) {
        const now = new Date();
        switch (assessmentType) {
            case 'INITIAL':
                return new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
            case 'PERIODIC':
                return new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
            case 'TRIGGER_EVENT':
                return new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // 3 months
            default:
                return new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
        }
    }
    async triggerPortfolioReview(clientId, assessmentId, tenantId) {
        await this.kafkaService.publish('portfolio.review.triggered', {
            clientId,
            assessmentId,
            reason: 'Suitability concerns identified',
            tenantId,
            timestamp: new Date().toISOString()
        });
    }
    getExperienceScore(experience) {
        const scores = {
            [ClientRelationship_1.InvestmentExperience.NOVICE]: 1,
            [ClientRelationship_1.InvestmentExperience.LIMITED]: 2,
            [ClientRelationship_1.InvestmentExperience.MODERATE]: 3,
            [ClientRelationship_1.InvestmentExperience.EXTENSIVE]: 4,
            [ClientRelationship_1.InvestmentExperience.PROFESSIONAL]: 5
        };
        return scores[experience] || 3;
    }
    calculateLiquidityAlignment(requestLiquidity, clientLiquidity) {
        const liquidityLevels = [ClientRelationship_1.LiquidityNeeds.LOW, ClientRelationship_1.LiquidityNeeds.MODERATE, ClientRelationship_1.LiquidityNeeds.HIGH, ClientRelationship_1.LiquidityNeeds.IMMEDIATE];
        const requestIndex = liquidityLevels.indexOf(requestLiquidity);
        const clientIndex = liquidityLevels.indexOf(clientLiquidity);
        const difference = Math.abs(requestIndex - clientIndex);
        return Math.max(0, 100 - (difference * 33));
    }
    getAssetAllocationRecommendations(riskTolerance) {
        const recommendations = {
            [ClientRelationship_1.RiskTolerance.CONSERVATIVE]: [
                'Focus on high-grade bonds and fixed income (60%)',
                'Limited equity exposure in large-cap stocks (30%)',
                'Maintain adequate cash reserves (10%)'
            ],
            [ClientRelationship_1.RiskTolerance.MODERATE_CONSERVATIVE]: [
                'Balanced allocation between bonds (50%) and equities (40%)',
                'Emphasize dividend-paying stocks',
                'Maintain liquidity buffer (10%)'
            ],
            [ClientRelationship_1.RiskTolerance.MODERATE]: [
                'Balanced 50/50 equity to fixed income allocation',
                'Consider small allocation to alternatives (5%)',
                'Regular rebalancing important'
            ],
            [ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE]: [
                'Growth-focused equity allocation (65%)',
                'Reduced fixed income exposure (25%)',
                'Consider alternative investments (7%)'
            ],
            [ClientRelationship_1.RiskTolerance.AGGRESSIVE]: [
                'High equity allocation (75%)',
                'Significant alternatives exposure (15%)',
                'Minimal fixed income (8%)'
            ]
        };
        return recommendations[riskTolerance] || recommendations[ClientRelationship_1.RiskTolerance.MODERATE];
    }
    async checkPortfolioDrift(client) {
        // Placeholder implementation for portfolio drift detection
        return [];
    }
    async checkConcentrationRisk(client) {
        // Placeholder implementation for concentration risk detection
        return [];
    }
    async checkUnsuitableInvestments(client) {
        // Placeholder implementation for unsuitable investment detection
        return [];
    }
}
exports.RiskProfilingService = RiskProfilingService;

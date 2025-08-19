"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditRiskMonitoringService = void 0;
class CreditRiskMonitoringService {
    prisma;
    kafkaProducer;
    logger;
    constructor(prisma, kafkaProducer, logger) {
        this.prisma = prisma;
        this.kafkaProducer = kafkaProducer;
        this.logger = logger;
    }
    async assessCreditRisk(request) {
        try {
            this.logger.info('Starting credit risk assessment', { portfolioId: request.portfolioId });
            const startTime = Date.now();
            const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
            const creditExposures = await this.calculateCreditExposures(portfolioData);
            const sectorConcentration = await this.analyzeSectorConcentration(creditExposures);
            const counterpartyRisks = await this.assessCounterpartyRisks(creditExposures);
            const creditMetrics = await this.calculateCreditMetrics(creditExposures, request);
            const migrationAnalysis = await this.performMigrationAnalysis(creditExposures);
            const creditVaR = await this.calculateCreditVaR(creditExposures, request);
            const expectedLosses = await this.calculateExpectedLosses(creditExposures);
            const unexpectedLosses = await this.calculateUnexpectedLosses(creditExposures, creditVaR);
            const creditSpreads = await this.analyzeCreditSpreads(creditExposures);
            const alerts = await this.generateCreditRiskAlerts(creditMetrics, creditVaR, expectedLosses);
            const recommendations = await this.generateRecommendations(creditMetrics, alerts);
            const assessment = {
                id: `credit_risk_${Date.now()}`,
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                assessmentDate: new Date(),
                asOfDate: request.asOfDate,
                totalCreditExposure: this.calculateTotalExposure(creditExposures),
                averageCreditRating: this.calculateAverageRating(creditExposures),
                investmentGradePercentage: this.calculateInvestmentGradePercentage(creditExposures),
                highYieldPercentage: this.calculateHighYieldPercentage(creditExposures),
                unratedPercentage: this.calculateUnratedPercentage(creditExposures),
                creditExposures,
                sectorConcentration,
                counterpartyRisks,
                creditMetrics,
                migrationAnalysis,
                creditVaR,
                expectedLosses,
                unexpectedLosses,
                creditSpreads,
                alerts,
                recommendations,
                riskLevel: this.determineOverallRiskLevel(creditMetrics, alerts),
                calculationTime: Date.now() - startTime,
                createdAt: new Date(),
                assessedBy: request.userId
            };
            // Store assessment in database
            await this.storeAssessment(assessment);
            // Publish event
            await this.kafkaProducer.publish('credit-risk-assessed', {
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                assessmentId: assessment.id,
                riskLevel: assessment.riskLevel,
                alertCount: alerts.length,
                timestamp: new Date()
            });
            this.logger.info('Credit risk assessment completed', {
                portfolioId: request.portfolioId,
                assessmentId: assessment.id,
                riskLevel: assessment.riskLevel
            });
            return assessment;
        }
        catch (error) {
            this.logger.error('Error in credit risk assessment', { error, request });
            throw new Error(`Credit risk assessment failed: ${error.message}`);
        }
    }
    async getPortfolioData(portfolioId, asOfDate) {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                positions: {
                    include: {
                        security: {
                            include: {
                                fixedIncomeDetails: true,
                                creditRating: true
                            }
                        }
                    },
                    where: {
                        asOfDate: {
                            lte: asOfDate
                        }
                    }
                }
            }
        });
        if (!portfolio) {
            throw new Error(`Portfolio ${portfolioId} not found`);
        }
        return portfolio;
    }
    async calculateCreditExposures(portfolioData) {
        const exposures = [];
        for (const position of portfolioData.positions) {
            if (this.hasCreditRisk(position.security)) {
                const exposure = {
                    id: `exposure_${position.id}`,
                    securityId: position.security.id,
                    issuerName: position.security.issuer || 'Unknown',
                    issuerId: position.security.issuerId,
                    sector: position.security.sector,
                    industry: position.security.industry,
                    country: position.security.country,
                    currency: position.security.currency,
                    marketValue: position.marketValue,
                    notionalAmount: position.security.fixedIncomeDetails?.faceValue || position.marketValue,
                    exposurePercentage: (position.marketValue / portfolioData.totalValue) * 100,
                    creditRating: this.getCreditRating(position.security),
                    maturityDate: position.security.fixedIncomeDetails?.maturityDate,
                    duration: position.security.fixedIncomeDetails?.duration,
                    convexity: position.security.fixedIncomeDetails?.convexity,
                    yieldToMaturity: position.security.fixedIncomeDetails?.yieldToMaturity,
                    creditSpread: await this.getCurrentCreditSpread(position.security),
                    defaultProbability: await this.calculateDefaultProbability(position.security),
                    recoveryRate: await this.getRecoveryRate(position.security),
                    lossGivenDefault: this.calculateLossGivenDefault(position.security),
                    expectedLoss: 0, // Will be calculated separately
                    unexpectedLoss: 0, // Will be calculated separately
                    riskWeight: this.calculateRiskWeight(position.security),
                    isInvestmentGrade: this.isInvestmentGrade(position.security),
                    daysToMaturity: this.calculateDaysToMaturity(position.security.fixedIncomeDetails?.maturityDate),
                    modifiedDuration: position.security.fixedIncomeDetails?.modifiedDuration
                };
                exposures.push(exposure);
            }
        }
        return exposures;
    }
    async analyzeSectorConcentration(exposures) {
        const sectorMap = new Map();
        const totalExposure = exposures.reduce((sum, exp) => sum + exp.marketValue, 0);
        exposures.forEach(exposure => {
            const sector = exposure.sector || 'Unknown';
            sectorMap.set(sector, (sectorMap.get(sector) || 0) + exposure.marketValue);
        });
        const concentrations = [];
        for (const [sector, exposure] of sectorMap.entries()) {
            concentrations.push({
                sector,
                totalExposure: exposure,
                exposurePercentage: (exposure / totalExposure) * 100,
                numberOfIssuers: exposures.filter(exp => exp.sector === sector).length,
                averageCreditRating: this.calculateSectorAverageRating(exposures, sector),
                riskLevel: this.determineSectorRiskLevel(exposure / totalExposure)
            });
        }
        return concentrations.sort((a, b) => b.totalExposure - a.totalExposure);
    }
    async assessCounterpartyRisks(exposures) {
        const counterpartyMap = new Map();
        exposures.forEach(exposure => {
            const key = `${exposure.issuerId}_${exposure.issuerName}`;
            if (!counterpartyMap.has(key)) {
                counterpartyMap.set(key, []);
            }
            counterpartyMap.get(key).push(exposure);
        });
        const counterpartyRisks = [];
        for (const [key, issuerExposures] of counterpartyMap.entries()) {
            const totalExposure = issuerExposures.reduce((sum, exp) => sum + exp.marketValue, 0);
            const averageRating = this.calculateAverageRatingForExposures(issuerExposures);
            counterpartyRisks.push({
                issuerId: issuerExposures[0].issuerId,
                issuerName: issuerExposures[0].issuerName,
                totalExposure,
                numberOfPositions: issuerExposures.length,
                averageCreditRating: averageRating,
                sector: issuerExposures[0].sector,
                country: issuerExposures[0].country,
                defaultProbability: await this.calculateIssuerDefaultProbability(issuerExposures[0]),
                expectedLoss: issuerExposures.reduce((sum, exp) => sum + exp.expectedLoss, 0),
                riskLevel: this.determineCounterpartyRiskLevel(totalExposure, averageRating),
                lastRatingChange: await this.getLastRatingChange(issuerExposures[0].issuerId),
                watchlistStatus: await this.getWatchlistStatus(issuerExposures[0].issuerId)
            });
        }
        return counterpartyRisks.sort((a, b) => b.totalExposure - a.totalExposure);
    }
    async calculateCreditMetrics(exposures, request) {
        const totalExposure = exposures.reduce((sum, exp) => sum + exp.marketValue, 0);
        const weightedAverageRating = this.calculateWeightedAverageRating(exposures);
        const averageMaturity = this.calculateAverageMaturity(exposures);
        const averageDuration = this.calculateAverageDuration(exposures);
        const concentrationIndex = this.calculateConcentrationIndex(exposures);
        const diversificationRatio = this.calculateDiversificationRatio(exposures);
        return {
            totalCreditExposure: totalExposure,
            numberOfIssuers: new Set(exposures.map(exp => exp.issuerId)).size,
            averageCreditRating: weightedAverageRating,
            averageMaturity,
            averageDuration,
            concentrationIndex,
            diversificationRatio,
            investmentGradePercentage: this.calculateInvestmentGradePercentage(exposures),
            highYieldPercentage: this.calculateHighYieldPercentage(exposures),
            unratedPercentage: this.calculateUnratedPercentage(exposures),
            averageDefaultProbability: this.calculateAverageDefaultProbability(exposures),
            portfolioSpread: this.calculatePortfolioSpread(exposures),
            modifiedDuration: this.calculatePortfolioModifiedDuration(exposures),
            creditBeta: await this.calculateCreditBeta(exposures),
            trackingError: await this.calculateTrackingError(exposures, request.benchmarkId)
        };
    }
    async performMigrationAnalysis(exposures) {
        // Implement credit migration matrix analysis
        const migrationMatrix = await this.getCreditMigrationMatrix();
        const migrationProbabilities = this.calculateMigrationProbabilities(exposures, migrationMatrix);
        return {
            matrix: migrationMatrix,
            timeHorizon: '1Y',
            migrationProbabilities,
            expectedRatingChanges: this.calculateExpectedRatingChanges(exposures, migrationProbabilities),
            downgradeProbability: this.calculateDowngradeProbability(migrationProbabilities),
            upgradeProbability: this.calculateUpgradeProbability(migrationProbabilities),
            stableRatingProbability: this.calculateStableRatingProbability(migrationProbabilities)
        };
    }
    async calculateCreditVaR(exposures, request) {
        const confidenceLevel = request.confidenceLevel || 0.95;
        const timeHorizon = request.timeHorizon || '1Y';
        // Monte Carlo simulation for credit VaR
        const simulations = await this.runCreditVaRSimulations(exposures, confidenceLevel, timeHorizon);
        return {
            confidenceLevel,
            timeHorizon,
            creditVaR: simulations.creditVaR,
            marginalVaR: simulations.marginalVaR,
            componentVaR: simulations.componentVaR,
            diversificationBenefit: simulations.diversificationBenefit,
            expectedShortfall: simulations.expectedShortfall,
            simulationCount: simulations.count,
            modelType: 'Monte Carlo',
            calculationDate: new Date()
        };
    }
    async calculateExpectedLosses(exposures) {
        const expectedLosses = [];
        for (const exposure of exposures) {
            const pd = exposure.defaultProbability;
            const lgd = exposure.lossGivenDefault;
            const ead = exposure.notionalAmount;
            expectedLosses.push({
                securityId: exposure.securityId,
                issuerName: exposure.issuerName,
                expectedLoss: pd * lgd * ead,
                probabilityOfDefault: pd,
                lossGivenDefault: lgd,
                exposureAtDefault: ead,
                timeHorizon: '1Y',
                riskContribution: (pd * lgd * ead) / this.calculateTotalExposure(exposures) * 100
            });
        }
        return expectedLosses.sort((a, b) => b.expectedLoss - a.expectedLoss);
    }
    async calculateUnexpectedLosses(exposures, creditVaR) {
        const unexpectedLosses = [];
        for (const exposure of exposures) {
            const variance = this.calculateLossVariance(exposure);
            const standardDeviation = Math.sqrt(variance);
            unexpectedLosses.push({
                securityId: exposure.securityId,
                issuerName: exposure.issuerName,
                unexpectedLoss: standardDeviation,
                lossVolatility: standardDeviation / exposure.expectedLoss,
                riskContribution: (standardDeviation / creditVaR.creditVaR) * 100,
                diversificationBenefit: this.calculateDiversificationBenefit(exposure, exposures)
            });
        }
        return unexpectedLosses.sort((a, b) => b.unexpectedLoss - a.unexpectedLoss);
    }
    async analyzeCreditSpreads(exposures) {
        const spreads = [];
        for (const exposure of exposures) {
            const currentSpread = exposure.creditSpread;
            const historicalSpreads = await this.getHistoricalSpreads(exposure.securityId);
            spreads.push({
                securityId: exposure.securityId,
                issuerName: exposure.issuerName,
                currentSpread,
                averageSpread: this.calculateAverageSpread(historicalSpreads),
                spreadVolatility: this.calculateSpreadVolatility(historicalSpreads),
                percentileRank: this.calculateSpreadPercentile(currentSpread, historicalSpreads),
                zScore: this.calculateSpreadZScore(currentSpread, historicalSpreads),
                trendDirection: this.calculateSpreadTrend(historicalSpreads),
                sector: exposure.sector,
                creditRating: exposure.creditRating
            });
        }
        return spreads.sort((a, b) => b.currentSpread - a.currentSpread);
    }
    async generateCreditRiskAlerts(metrics, creditVaR, expectedLosses) {
        const alerts = [];
        // High concentration alert
        if (metrics.concentrationIndex > 0.25) {
            alerts.push({
                id: `alert_concentration_${Date.now()}`,
                type: 'CONCENTRATION_RISK',
                severity: 'HIGH',
                message: 'High concentration risk detected',
                description: `Concentration index of ${(metrics.concentrationIndex * 100).toFixed(1)}% exceeds threshold`,
                threshold: 25,
                currentValue: metrics.concentrationIndex * 100,
                recommendedAction: 'Consider diversification across issuers and sectors',
                createdAt: new Date()
            });
        }
        // High credit VaR alert
        if (creditVaR.creditVaR > metrics.totalCreditExposure * 0.05) {
            alerts.push({
                id: `alert_var_${Date.now()}`,
                type: 'HIGH_CREDIT_VAR',
                severity: 'MEDIUM',
                message: 'Credit VaR exceeds 5% of portfolio value',
                description: `Credit VaR of ${creditVaR.creditVaR.toLocaleString()} represents ${((creditVaR.creditVaR / metrics.totalCreditExposure) * 100).toFixed(1)}% of portfolio`,
                threshold: 5,
                currentValue: (creditVaR.creditVaR / metrics.totalCreditExposure) * 100,
                recommendedAction: 'Review high-risk positions and consider hedging strategies',
                createdAt: new Date()
            });
        }
        // Low investment grade percentage
        if (metrics.investmentGradePercentage < 70) {
            alerts.push({
                id: `alert_ig_${Date.now()}`,
                type: 'LOW_INVESTMENT_GRADE',
                severity: 'MEDIUM',
                message: 'Investment grade percentage below target',
                description: `Only ${metrics.investmentGradePercentage.toFixed(1)}% of portfolio is investment grade`,
                threshold: 70,
                currentValue: metrics.investmentGradePercentage,
                recommendedAction: 'Increase allocation to investment grade securities',
                createdAt: new Date()
            });
        }
        return alerts;
    }
    async generateRecommendations(metrics, alerts) {
        const recommendations = [];
        if (alerts.some(alert => alert.type === 'CONCENTRATION_RISK')) {
            recommendations.push({
                id: `rec_diversify_${Date.now()}`,
                type: 'DIVERSIFICATION',
                priority: 'HIGH',
                title: 'Improve Portfolio Diversification',
                description: 'Reduce concentration risk by diversifying across more issuers and sectors',
                actions: [
                    'Identify over-concentrated positions',
                    'Research alternative issuers in underweight sectors',
                    'Consider gradual rebalancing over time',
                    'Implement position size limits'
                ],
                expectedImpact: 'Reduced concentration risk and improved risk-adjusted returns',
                implementationTimeframe: '1-3 months'
            });
        }
        if (metrics.averageDefaultProbability > 0.02) {
            recommendations.push({
                id: `rec_credit_quality_${Date.now()}`,
                type: 'CREDIT_QUALITY',
                priority: 'MEDIUM',
                title: 'Improve Credit Quality',
                description: 'Consider upgrading credit quality to reduce default risk',
                actions: [
                    'Review positions with high default probabilities',
                    'Research higher-rated alternatives',
                    'Consider credit enhancement strategies',
                    'Implement stricter credit criteria'
                ],
                expectedImpact: 'Lower expected losses and improved portfolio stability',
                implementationTimeframe: '2-4 months'
            });
        }
        return recommendations;
    }
    // Helper methods
    hasCreditRisk(security) {
        return security.assetClass === 'FIXED_INCOME' ||
            security.assetClass === 'CORPORATE_BOND' ||
            security.securityType === 'BOND';
    }
    getCreditRating(security) {
        return security.creditRating?.rating || 'NR';
    }
    async getCurrentCreditSpread(security) {
        // Implementation would fetch current market spreads
        return security.fixedIncomeDetails?.creditSpread || 0;
    }
    async calculateDefaultProbability(security) {
        // Implementation would use credit rating to PD mapping
        const ratingToPdMap = {
            'AAA': 0.0001, 'AA+': 0.0002, 'AA': 0.0003, 'AA-': 0.0005,
            'A+': 0.0008, 'A': 0.0012, 'A-': 0.0018,
            'BBB+': 0.0025, 'BBB': 0.0035, 'BBB-': 0.0050,
            'BB+': 0.0080, 'BB': 0.0120, 'BB-': 0.0180,
            'B+': 0.0280, 'B': 0.0420, 'B-': 0.0650,
            'CCC+': 0.1000, 'CCC': 0.1500, 'CCC-': 0.2000,
            'CC': 0.2500, 'C': 0.3000, 'D': 1.0000,
            'NR': 0.0200
        };
        const rating = this.getCreditRating(security);
        return ratingToPdMap[rating] || 0.02;
    }
    async getRecoveryRate(security) {
        // Implementation would use sector/seniority to recovery rate mapping
        const sectorRecoveryRates = {
            'Government': 0.90,
            'Financial': 0.45,
            'Utilities': 0.50,
            'Technology': 0.35,
            'Healthcare': 0.40,
            'Energy': 0.30,
            'Industrial': 0.42,
            'Consumer': 0.38,
            'Real Estate': 0.35,
            'Default': 0.40
        };
        return sectorRecoveryRates[security.sector] || sectorRecoveryRates['Default'];
    }
    calculateLossGivenDefault(security) {
        // LGD = 1 - Recovery Rate
        return 1 - (security.recoveryRate || 0.40);
    }
    calculateRiskWeight(security) {
        // Basel III risk weights
        const ratingRiskWeights = {
            'AAA': 0.20, 'AA+': 0.20, 'AA': 0.20, 'AA-': 0.20,
            'A+': 0.50, 'A': 0.50, 'A-': 0.50,
            'BBB+': 1.00, 'BBB': 1.00, 'BBB-': 1.00,
            'BB+': 1.50, 'BB': 1.50, 'BB-': 1.50,
            'B+': 1.50, 'B': 1.50, 'B-': 1.50,
            'CCC+': 1.50, 'CCC': 1.50, 'CCC-': 1.50,
            'CC': 1.50, 'C': 1.50, 'D': 1.50,
            'NR': 1.00
        };
        const rating = this.getCreditRating(security);
        return ratingRiskWeights[rating] || 1.00;
    }
    isInvestmentGrade(security) {
        const rating = this.getCreditRating(security);
        const investmentGradeRatings = [
            'AAA', 'AA+', 'AA', 'AA-',
            'A+', 'A', 'A-',
            'BBB+', 'BBB', 'BBB-'
        ];
        return investmentGradeRatings.includes(rating);
    }
    calculateDaysToMaturity(maturityDate) {
        if (!maturityDate)
            return 0;
        const today = new Date();
        const diffTime = maturityDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    calculateTotalExposure(exposures) {
        return exposures.reduce((sum, exp) => sum + exp.marketValue, 0);
    }
    calculateAverageRating(exposures) {
        // Simplified average rating calculation
        const ratingScores = {
            'AAA': 1, 'AA+': 2, 'AA': 3, 'AA-': 4,
            'A+': 5, 'A': 6, 'A-': 7,
            'BBB+': 8, 'BBB': 9, 'BBB-': 10,
            'BB+': 11, 'BB': 12, 'BB-': 13,
            'B+': 14, 'B': 15, 'B-': 16,
            'CCC+': 17, 'CCC': 18, 'CCC-': 19,
            'CC': 20, 'C': 21, 'D': 22, 'NR': 10
        };
        const scoreToRating = Object.fromEntries(Object.entries(ratingScores).map(([k, v]) => [v, k]));
        const totalWeight = exposures.reduce((sum, exp) => sum + exp.marketValue, 0);
        const weightedScore = exposures.reduce((sum, exp) => {
            const weight = exp.marketValue / totalWeight;
            const score = ratingScores[exp.creditRating] || 10;
            return sum + (score * weight);
        }, 0);
        const roundedScore = Math.round(weightedScore);
        return scoreToRating[roundedScore] || 'BBB';
    }
    calculateInvestmentGradePercentage(exposures) {
        const totalValue = this.calculateTotalExposure(exposures);
        const igValue = exposures
            .filter(exp => exp.isInvestmentGrade)
            .reduce((sum, exp) => sum + exp.marketValue, 0);
        return totalValue > 0 ? (igValue / totalValue) * 100 : 0;
    }
    calculateHighYieldPercentage(exposures) {
        const totalValue = this.calculateTotalExposure(exposures);
        const hyValue = exposures
            .filter(exp => !exp.isInvestmentGrade && exp.creditRating !== 'NR')
            .reduce((sum, exp) => sum + exp.marketValue, 0);
        return totalValue > 0 ? (hyValue / totalValue) * 100 : 0;
    }
    calculateUnratedPercentage(exposures) {
        const totalValue = this.calculateTotalExposure(exposures);
        const nrValue = exposures
            .filter(exp => exp.creditRating === 'NR')
            .reduce((sum, exp) => sum + exp.marketValue, 0);
        return totalValue > 0 ? (nrValue / totalValue) * 100 : 0;
    }
    determineOverallRiskLevel(metrics, alerts) {
        const highAlerts = alerts.filter(alert => alert.severity === 'HIGH').length;
        const mediumAlerts = alerts.filter(alert => alert.severity === 'MEDIUM').length;
        if (highAlerts > 0 || metrics.concentrationIndex > 0.3) {
            return 'HIGH';
        }
        else if (mediumAlerts > 1 || metrics.averageDefaultProbability > 0.015) {
            return 'MEDIUM';
        }
        else {
            return 'LOW';
        }
    }
    // Additional helper methods would be implemented here...
    calculateWeightedAverageRating(exposures) {
        return this.calculateAverageRating(exposures);
    }
    calculateAverageMaturity(exposures) {
        const validExposures = exposures.filter(exp => exp.daysToMaturity > 0);
        if (validExposures.length === 0)
            return 0;
        const totalWeight = validExposures.reduce((sum, exp) => sum + exp.marketValue, 0);
        return validExposures.reduce((sum, exp) => {
            const weight = exp.marketValue / totalWeight;
            return sum + (exp.daysToMaturity * weight);
        }, 0) / 365; // Convert to years
    }
    calculateAverageDuration(exposures) {
        const validExposures = exposures.filter(exp => exp.duration && exp.duration > 0);
        if (validExposures.length === 0)
            return 0;
        const totalWeight = validExposures.reduce((sum, exp) => sum + exp.marketValue, 0);
        return validExposures.reduce((sum, exp) => {
            const weight = exp.marketValue / totalWeight;
            return sum + ((exp.duration || 0) * weight);
        }, 0);
    }
    calculateConcentrationIndex(exposures) {
        const totalValue = this.calculateTotalExposure(exposures);
        const weights = exposures.map(exp => exp.marketValue / totalValue);
        return weights.reduce((sum, weight) => sum + (weight * weight), 0);
    }
    calculateDiversificationRatio(exposures) {
        const numberOfIssuers = new Set(exposures.map(exp => exp.issuerId)).size;
        return numberOfIssuers > 0 ? exposures.length / numberOfIssuers : 0;
    }
    async storeAssessment(assessment) {
        // Implementation would store the assessment in the database
        this.logger.info('Storing credit risk assessment', { assessmentId: assessment.id });
    }
    // Placeholder implementations for complex calculations
    async getCreditMigrationMatrix() {
        // Would return historical credit migration probabilities
        return {};
    }
    calculateMigrationProbabilities(exposures, matrix) {
        // Implementation of migration probability calculations
        return {};
    }
    calculateExpectedRatingChanges(exposures, probabilities) {
        return {};
    }
    calculateDowngradeProbability(probabilities) {
        return 0.05; // Placeholder
    }
    calculateUpgradeProbability(probabilities) {
        return 0.02; // Placeholder
    }
    calculateStableRatingProbability(probabilities) {
        return 0.93; // Placeholder
    }
    async runCreditVaRSimulations(exposures, confidenceLevel, timeHorizon) {
        // Monte Carlo simulation implementation
        return {
            creditVaR: 1000000,
            marginalVaR: [],
            componentVaR: [],
            diversificationBenefit: 200000,
            expectedShortfall: 1500000,
            count: 10000
        };
    }
    calculateLossVariance(exposure) {
        const pd = exposure.defaultProbability;
        const lgd = exposure.lossGivenDefault;
        const ead = exposure.notionalAmount;
        // Variance of Bernoulli distribution for default
        return pd * (1 - pd) * Math.pow(lgd * ead, 2);
    }
    calculateDiversificationBenefit(exposure, allExposures) {
        // Simplified diversification benefit calculation
        return 0.15; // 15% diversification benefit
    }
    async getHistoricalSpreads(securityId) {
        // Would fetch historical spread data
        return [];
    }
    calculateAverageSpread(spreads) {
        return spreads.length > 0 ? spreads.reduce((sum, s) => sum + s, 0) / spreads.length : 0;
    }
    calculateSpreadVolatility(spreads) {
        if (spreads.length < 2)
            return 0;
        const avg = this.calculateAverageSpread(spreads);
        const variance = spreads.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / (spreads.length - 1);
        return Math.sqrt(variance);
    }
    calculateSpreadPercentile(current, historical) {
        if (historical.length === 0)
            return 50;
        const sorted = [...historical].sort((a, b) => a - b);
        let rank = 0;
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] <= current)
                rank = i + 1;
        }
        return (rank / sorted.length) * 100;
    }
    calculateSpreadZScore(current, historical) {
        const avg = this.calculateAverageSpread(historical);
        const vol = this.calculateSpreadVolatility(historical);
        return vol > 0 ? (current - avg) / vol : 0;
    }
    calculateSpreadTrend(spreads) {
        if (spreads.length < 2)
            return 'STABLE';
        const recent = spreads.slice(-5);
        const older = spreads.slice(-10, -5);
        const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
        const olderAvg = older.reduce((sum, s) => sum + s, 0) / older.length;
        if (recentAvg > olderAvg * 1.05)
            return 'WIDENING';
        if (recentAvg < olderAvg * 0.95)
            return 'TIGHTENING';
        return 'STABLE';
    }
    calculateSectorAverageRating(exposures, sector) {
        const sectorExposures = exposures.filter(exp => exp.sector === sector);
        return this.calculateAverageRating(sectorExposures);
    }
    determineSectorRiskLevel(concentrationRatio) {
        if (concentrationRatio > 0.3)
            return 'HIGH';
        if (concentrationRatio > 0.15)
            return 'MEDIUM';
        return 'LOW';
    }
    calculateAverageRatingForExposures(exposures) {
        return this.calculateAverageRating(exposures);
    }
    async calculateIssuerDefaultProbability(exposure) {
        return exposure.defaultProbability;
    }
    determineCounterpartyRiskLevel(exposure, rating) {
        const igRatings = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-'];
        const isIG = igRatings.includes(rating);
        if (!isIG && exposure > 10000000)
            return 'HIGH';
        if (!isIG || exposure > 50000000)
            return 'MEDIUM';
        return 'LOW';
    }
    async getLastRatingChange(issuerId) {
        // Would fetch last rating change date
        return undefined;
    }
    async getWatchlistStatus(issuerId) {
        // Would fetch watchlist status
        return 'NONE';
    }
    calculateAverageDefaultProbability(exposures) {
        if (exposures.length === 0)
            return 0;
        const totalWeight = this.calculateTotalExposure(exposures);
        return exposures.reduce((sum, exp) => {
            const weight = exp.marketValue / totalWeight;
            return sum + (exp.defaultProbability * weight);
        }, 0);
    }
    calculatePortfolioSpread(exposures) {
        if (exposures.length === 0)
            return 0;
        const totalWeight = this.calculateTotalExposure(exposures);
        return exposures.reduce((sum, exp) => {
            const weight = exp.marketValue / totalWeight;
            return sum + (exp.creditSpread * weight);
        }, 0);
    }
    calculatePortfolioModifiedDuration(exposures) {
        const validExposures = exposures.filter(exp => exp.modifiedDuration && exp.modifiedDuration > 0);
        if (validExposures.length === 0)
            return 0;
        const totalWeight = validExposures.reduce((sum, exp) => sum + exp.marketValue, 0);
        return validExposures.reduce((sum, exp) => {
            const weight = exp.marketValue / totalWeight;
            return sum + ((exp.modifiedDuration || 0) * weight);
        }, 0);
    }
    async calculateCreditBeta(exposures) {
        // Would calculate credit beta relative to credit index
        return 1.0; // Placeholder
    }
    async calculateTrackingError(exposures, benchmarkId) {
        // Would calculate tracking error relative to benchmark
        return 0.02; // 2% tracking error placeholder
    }
}
exports.CreditRiskMonitoringService = CreditRiskMonitoringService;

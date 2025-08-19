"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounterpartyExposureTrackingService = void 0;
class CounterpartyExposureTrackingService {
    prisma;
    kafkaProducer;
    logger;
    constructor(prisma, kafkaProducer, logger) {
        this.prisma = prisma;
        this.kafkaProducer = kafkaProducer;
        this.logger = logger;
    }
    async trackCounterpartyExposure(request) {
        try {
            this.logger.info('Starting counterparty exposure tracking', {
                portfolioId: request.portfolioId,
                counterpartyId: request.counterpartyId
            });
            const startTime = Date.now();
            const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
            const counterpartyData = await this.getCounterpartyData(request.counterpartyId);
            const masterAgreements = await this.getMasterAgreements(request.counterpartyId);
            const nettingAgreements = await this.getNettingAgreements(request.counterpartyId);
            const collateralAgreements = await this.getCollateralAgreements(request.counterpartyId);
            const currentExposures = await this.calculateCurrentExposures(portfolioData, counterpartyData, request);
            const potentialFutureExposures = await this.calculatePotentialFutureExposures(currentExposures, request);
            const collateralPositions = await this.assessCollateralPositions(request.counterpartyId, request.asOfDate);
            const netExposures = await this.calculateNetExposures(currentExposures, collateralPositions, nettingAgreements);
            const exposureAtDefault = await this.calculateExposureAtDefault(netExposures, potentialFutureExposures);
            const creditEquivalentAmounts = await this.calculateCreditEquivalentAmounts(netExposures, request);
            const marginCalls = await this.assessMarginRequirements(netExposures, collateralAgreements);
            const settlementRisks = await this.assessSettlementRisks(currentExposures, request);
            const exposureMetrics = await this.calculateExposureMetrics(netExposures, exposureAtDefault);
            const concentrationAnalysis = await this.analyzeExposureConcentration(netExposures, request);
            const trends = await this.analyzExposureTrends(request.counterpartyId, netExposures);
            const alerts = await this.generateExposureAlerts(exposureMetrics, netExposures, request);
            const recommendations = await this.generateRecommendations(exposureMetrics, alerts, netExposures);
            const assessment = {
                id: `counterparty_exposure_${Date.now()}`,
                portfolioId: request.portfolioId,
                counterpartyId: request.counterpartyId,
                tenantId: request.tenantId,
                assessmentDate: new Date(),
                asOfDate: request.asOfDate,
                counterpartyName: counterpartyData.name,
                counterpartyRating: counterpartyData.rating,
                totalGrossExposure: this.calculateTotalGrossExposure(currentExposures),
                totalNetExposure: this.calculateTotalNetExposure(netExposures),
                totalCollateralValue: this.calculateTotalCollateralValue(collateralPositions),
                exposureAfterCollateral: this.calculateExposureAfterCollateral(netExposures, collateralPositions),
                currentExposures,
                potentialFutureExposures,
                collateralPositions,
                netExposures,
                exposureAtDefault,
                creditEquivalentAmounts,
                marginCalls,
                settlementRisks,
                masterAgreements,
                nettingAgreements,
                collateralAgreements,
                exposureMetrics,
                concentrationAnalysis,
                trends,
                alerts,
                recommendations,
                calculationTime: Date.now() - startTime,
                createdAt: new Date(),
                assessedBy: request.userId
            };
            // Store assessment in database
            await this.storeAssessment(assessment);
            // Publish event
            await this.kafkaProducer.publish('counterparty-exposure-assessed', {
                portfolioId: request.portfolioId,
                counterpartyId: request.counterpartyId,
                tenantId: request.tenantId,
                assessmentId: assessment.id,
                totalNetExposure: assessment.totalNetExposure,
                alertCount: alerts.length,
                timestamp: new Date()
            });
            this.logger.info('Counterparty exposure tracking completed', {
                portfolioId: request.portfolioId,
                counterpartyId: request.counterpartyId,
                assessmentId: assessment.id,
                totalNetExposure: assessment.totalNetExposure
            });
            return assessment;
        }
        catch (error) {
            this.logger.error('Error in counterparty exposure tracking', { error, request });
            throw new Error(`Counterparty exposure tracking failed: ${error.message}`);
        }
    }
    async trackAllCounterpartyExposures(request) {
        try {
            const counterparties = await this.getAllCounterparties(request.portfolioId);
            const assessments = [];
            for (const counterparty of counterparties) {
                const counterpartyRequest = {
                    ...request,
                    counterpartyId: counterparty.id
                };
                const assessment = await this.trackCounterpartyExposure(counterpartyRequest);
                assessments.push(assessment);
            }
            // Generate portfolio-level counterparty concentration analysis
            const portfolioConcentration = await this.analyzePortfolioCounterpartyConcentration(assessments);
            // Publish portfolio-level event
            await this.kafkaProducer.publish('portfolio-counterparty-exposure-assessed', {
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                counterpartyCount: assessments.length,
                totalExposure: assessments.reduce((sum, a) => sum + a.totalNetExposure, 0),
                concentrationMetrics: portfolioConcentration,
                timestamp: new Date()
            });
            return assessments;
        }
        catch (error) {
            this.logger.error('Error in tracking all counterparty exposures', { error, request });
            throw new Error(`All counterparty exposure tracking failed: ${error.message}`);
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
                                derivativeDetails: true,
                                fixedIncomeDetails: true
                            }
                        },
                        transactions: true
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
    async getCounterpartyData(counterpartyId) {
        // Implementation would fetch counterparty data from database
        return {
            id: counterpartyId,
            name: 'Sample Counterparty',
            rating: 'A',
            sector: 'Financial Services',
            country: 'US',
            parentCompany: null,
            subsidiaries: []
        };
    }
    async getMasterAgreements(counterpartyId) {
        // Implementation would fetch master agreements from database
        return [{
                id: `ma_${counterpartyId}`,
                counterpartyId,
                agreementType: 'ISDA_MASTER',
                effectiveDate: new Date('2020-01-01'),
                terminationDate: null,
                governingLaw: 'NEW_YORK',
                closeOutNetting: true,
                setOffRights: true,
                collateralRights: true,
                additionalTerminations: [],
                creditEvents: ['BANKRUPTCY', 'FAILURE_TO_PAY', 'RESTRUCTURING'],
                thresholdAmount: 1000000,
                minimumTransferAmount: 50000,
                rounding: 10000
            }];
    }
    async getNettingAgreements(counterpartyId) {
        return [{
                id: `netting_${counterpartyId}`,
                counterpartyId,
                agreementType: 'MASTER_NETTING',
                effectiveDate: new Date('2020-01-01'),
                includedTransactionTypes: ['DERIVATIVES', 'SECURITIES_LENDING', 'REPO'],
                nettingMethod: 'CLOSE_OUT_NETTING',
                crossDefaultProvisions: true,
                crossAccelerationProvisions: true,
                setOffRights: true,
                walkAwayClause: false
            }];
    }
    async getCollateralAgreements(counterpartyId) {
        return [{
                id: `csa_${counterpartyId}`,
                counterpartyId,
                agreementType: 'BILATERAL_CSA',
                effectiveDate: new Date('2020-01-01'),
                baseCurrency: 'USD',
                thresholdAmount: 1000000,
                minimumTransferAmount: 50000,
                independentAmount: 0,
                rounding: 10000,
                marginCallFrequency: 'DAILY',
                eligibleCollateral: [
                    {
                        assetType: 'CASH',
                        currency: 'USD',
                        haircut: 0,
                        concentrationLimit: 1.0
                    },
                    {
                        assetType: 'GOVERNMENT_BOND',
                        currency: 'USD',
                        haircut: 0.02,
                        concentrationLimit: 0.5
                    }
                ],
                substitutionRights: true,
                rehypothecationRights: false
            }];
    }
    async calculateCurrentExposures(portfolioData, counterpartyData, request) {
        const exposures = [];
        for (const position of portfolioData.positions) {
            if (this.isCounterpartyExposure(position, request.counterpartyId)) {
                const exposure = {
                    id: `current_exposure_${position.id}`,
                    portfolioId: request.portfolioId,
                    counterpartyId: request.counterpartyId,
                    securityId: position.security.id,
                    positionId: position.id,
                    exposureType: this.determineExposureType(position.security),
                    instrumentType: position.security.securityType,
                    notionalAmount: this.calculateNotionalAmount(position),
                    marketValue: position.marketValue,
                    unrealizedPnL: position.unrealizedGainLoss || 0,
                    currentExposure: Math.max(position.marketValue + (position.unrealizedGainLoss || 0), 0),
                    replacementCost: Math.max(position.marketValue, 0),
                    currency: position.security.currency,
                    maturityDate: this.getMaturityDate(position.security),
                    asOfDate: request.asOfDate,
                    lastUpdated: new Date(),
                    riskWeight: this.calculateRiskWeight(position.security),
                    addOnFactor: this.calculateAddOnFactor(position.security),
                    creditConversionFactor: this.getCreditConversionFactor(position.security)
                };
                exposures.push(exposure);
            }
        }
        return exposures;
    }
    async calculatePotentialFutureExposures(currentExposures, request) {
        const pfeCalculations = [];
        for (const currentExp of currentExposures) {
            const pfe = await this.calculatePFE(currentExp, request);
            pfeCalculations.push(pfe);
        }
        return pfeCalculations;
    }
    async calculatePFE(currentExposure, request) {
        // Simplified PFE calculation - would be more sophisticated in practice
        const volatility = await this.getAssetVolatility(currentExposure.securityId);
        const timeToMaturity = this.getTimeToMaturity(currentExposure.maturityDate);
        const confidenceLevel = 0.95; // 95% confidence level
        // Monte Carlo simulation for PFE (simplified)
        const pfeValue = this.simulatePFE(currentExposure, volatility, timeToMaturity, confidenceLevel);
        return {
            id: `pfe_${currentExposure.id}`,
            currentExposureId: currentExposure.id,
            counterpartyId: request.counterpartyId,
            securityId: currentExposure.securityId,
            confidenceLevel,
            timeHorizon: '1Y',
            potentialFutureExposure: pfeValue,
            expectedExposure: pfeValue * 0.4, // Approximate expected exposure
            expectedPositiveExposure: pfeValue * 0.3,
            maxPotentialExposure: pfeValue * 1.2,
            simulationMethod: 'MONTE_CARLO',
            numberOfSimulations: 10000,
            volatility,
            timeToMaturity,
            calculationDate: new Date()
        };
    }
    async assessCollateralPositions(counterpartyId, asOfDate) {
        // Implementation would fetch actual collateral positions
        return [{
                id: `collateral_${counterpartyId}`,
                counterpartyId,
                collateralType: 'CASH',
                currency: 'USD',
                nominalAmount: 5000000,
                marketValue: 5000000,
                haircut: 0,
                eligibilityStatus: 'ELIGIBLE',
                concentrationLimit: 1.0,
                utilisedAmount: 3000000,
                availableAmount: 2000000,
                lastValuationDate: asOfDate,
                substituionRights: true,
                rehypothecationRights: false
            }];
    }
    async calculateNetExposures(currentExposures, collateralPositions, nettingAgreements) {
        const netExposures = [];
        // Group exposures by netting set
        const nettingSets = this.groupExposuresByNettingSet(currentExposures, nettingAgreements);
        for (const [nettingSetId, exposures] of nettingSets.entries()) {
            const grossPositiveExposure = exposures
                .filter(exp => exp.currentExposure > 0)
                .reduce((sum, exp) => sum + exp.currentExposure, 0);
            const grossNegativeExposure = exposures
                .filter(exp => exp.currentExposure < 0)
                .reduce((sum, exp) => sum + Math.abs(exp.currentExposure), 0);
            const netExposureBeforeCollateral = grossPositiveExposure - grossNegativeExposure;
            const applicableCollateral = this.getApplicableCollateral(collateralPositions, nettingSetId);
            const netExposureAfterCollateral = Math.max(netExposureBeforeCollateral - applicableCollateral, 0);
            netExposures.push({
                id: `net_exposure_${nettingSetId}`,
                counterpartyId: exposures[0].counterpartyId,
                nettingSetId,
                grossPositiveExposure,
                grossNegativeExposure,
                netExposureBeforeCollateral,
                collateralValue: applicableCollateral,
                netExposureAfterCollateral,
                exposureType: 'NET_EXPOSURE',
                currency: 'USD', // Base currency
                asOfDate: new Date(),
                componentExposures: exposures.map(exp => exp.id)
            });
        }
        return netExposures;
    }
    async calculateExposureAtDefault(netExposures, potentialFutureExposures) {
        const eadCalculations = [];
        for (const netExposure of netExposures) {
            const relevantPFEs = potentialFutureExposures.filter(pfe => netExposure.componentExposures.includes(pfe.currentExposureId));
            const totalPFE = relevantPFEs.reduce((sum, pfe) => sum + pfe.potentialFutureExposure, 0);
            const ead = netExposure.netExposureAfterCollateral + (totalPFE * 0.4); // Alpha factor of 1.4
            eadCalculations.push({
                id: `ead_${netExposure.id}`,
                counterpartyId: netExposure.counterpartyId,
                nettingSetId: netExposure.nettingSetId,
                currentExposure: netExposure.netExposureAfterCollateral,
                potentialFutureExposure: totalPFE,
                alphaFactor: 1.4,
                exposureAtDefault: ead,
                effectiveMaturity: this.calculateEffectiveMaturity(relevantPFEs),
                calculationMethod: 'BASEL_III',
                calculationDate: new Date()
            });
        }
        return eadCalculations;
    }
    async calculateCreditEquivalentAmounts(netExposures, request) {
        const ceaCalculations = [];
        for (const netExposure of netExposures) {
            const creditEquivalentAmount = netExposure.netExposureAfterCollateral; // Simplified
            ceaCalculations.push({
                id: `cea_${netExposure.id}`,
                counterpartyId: netExposure.counterpartyId,
                nettingSetId: netExposure.nettingSetId,
                replacementCost: Math.max(netExposure.netExposureBeforeCollateral, 0),
                addOnAmount: 0, // Would be calculated based on notional amounts and add-on factors
                creditEquivalentAmount,
                riskWeight: await this.getCounterpartyRiskWeight(request.counterpartyId),
                riskWeightedAmount: creditEquivalentAmount * await this.getCounterpartyRiskWeight(request.counterpartyId),
                calculationMethod: 'CURRENT_EXPOSURE_METHOD',
                calculationDate: new Date()
            });
        }
        return ceaCalculations;
    }
    async assessMarginRequirements(netExposures, collateralAgreements) {
        const marginCalls = [];
        for (const agreement of collateralAgreements) {
            const applicableExposures = netExposures.filter(exp => exp.counterpartyId === agreement.counterpartyId);
            const totalExposure = applicableExposures.reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
            const requiredCollateral = Math.max(totalExposure - agreement.thresholdAmount, 0);
            const currentCollateral = 5000000; // Would be fetched from collateral positions
            const marginCallAmount = Math.max(requiredCollateral - currentCollateral, 0);
            if (marginCallAmount >= agreement.minimumTransferAmount) {
                marginCalls.push({
                    id: `margin_call_${agreement.id}`,
                    counterpartyId: agreement.counterpartyId,
                    agreementId: agreement.id,
                    callDate: new Date(),
                    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next business day
                    callAmount: marginCallAmount,
                    currency: agreement.baseCurrency,
                    callType: 'VARIATION_MARGIN',
                    status: 'PENDING',
                    totalExposure,
                    thresholdAmount: agreement.thresholdAmount,
                    currentCollateral,
                    requiredCollateral
                });
            }
        }
        return marginCalls;
    }
    async assessSettlementRisks(currentExposures, request) {
        const settlementRisks = [];
        const settlingExposures = currentExposures.filter(exp => this.isSettlingToday(exp, request.asOfDate));
        for (const exposure of settlingExposures) {
            settlementRisks.push({
                id: `settlement_risk_${exposure.id}`,
                counterpartyId: exposure.counterpartyId,
                exposureId: exposure.id,
                securityId: exposure.securityId,
                settlementDate: request.asOfDate,
                settlementAmount: exposure.marketValue,
                currency: exposure.currency,
                riskType: 'PRINCIPAL_RISK',
                riskAmount: exposure.marketValue,
                timeZoneRisk: this.calculateTimeZoneRisk(exposure),
                paymentSystemRisk: this.assessPaymentSystemRisk(exposure),
                mitigants: this.identifySettlementMitigants(exposure)
            });
        }
        return settlementRisks;
    }
    async calculateExposureMetrics(netExposures, exposureAtDefault) {
        const totalGrossExposure = netExposures.reduce((sum, exp) => sum + exp.grossPositiveExposure, 0);
        const totalNetExposure = netExposures.reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
        const totalEAD = exposureAtDefault.reduce((sum, ead) => sum + ead.exposureAtDefault, 0);
        return {
            totalGrossExposure,
            totalNetExposure,
            totalExposureAtDefault: totalEAD,
            nettingBenefit: totalGrossExposure - totalNetExposure,
            nettingRatio: totalGrossExposure > 0 ? totalNetExposure / totalGrossExposure : 0,
            averageMaturity: this.calculateAverageMaturity(exposureAtDefault),
            exposureVolatility: await this.calculateExposureVolatility(netExposures),
            peakExposure: Math.max(...netExposures.map(exp => exp.netExposureAfterCollateral)),
            numberOfNettingSets: netExposures.length,
            concentrationIndex: this.calculateConcentrationIndex(netExposures)
        };
    }
    async analyzeExposureConcentration(netExposures, request) {
        const totalExposure = netExposures.reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
        const largestExposure = Math.max(...netExposures.map(exp => exp.netExposureAfterCollateral));
        const top5Exposures = netExposures
            .sort((a, b) => b.netExposureAfterCollateral - a.netExposureAfterCollateral)
            .slice(0, 5)
            .reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
        return {
            counterpartyId: request.counterpartyId,
            totalExposure,
            largestExposureAmount: largestExposure,
            largestExposurePercentage: totalExposure > 0 ? (largestExposure / totalExposure) * 100 : 0,
            top5ExposuresAmount: top5Exposures,
            top5ExposuresPercentage: totalExposure > 0 ? (top5Exposures / totalExposure) * 100 : 0,
            herfindahlIndex: this.calculateHerfindahlIndex(netExposures),
            diversificationRatio: this.calculateDiversificationRatio(netExposures),
            concentrationRiskLevel: this.assessConcentrationRiskLevel(largestExposure, totalExposure)
        };
    }
    async analyzExposureTrends(counterpartyId, currentExposures) {
        // Implementation would fetch historical exposure data and analyze trends
        const trends = [];
        const currentTotal = currentExposures.reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
        trends.push({
            counterpartyId,
            metricType: 'TOTAL_NET_EXPOSURE',
            currentValue: currentTotal,
            previousValue: currentTotal * 0.95, // Simulated previous value
            changeAmount: currentTotal * 0.05,
            changePercentage: 5.0,
            trendDirection: 'INCREASING',
            timeFrame: '30D',
            volatility: 0.15,
            averageValue: currentTotal * 0.98,
            peakValue: currentTotal * 1.1,
            troughValue: currentTotal * 0.85
        });
        return trends;
    }
    async generateExposureAlerts(metrics, netExposures, request) {
        const alerts = [];
        // High exposure alert
        const exposureLimit = await this.getExposureLimit(request.counterpartyId);
        if (metrics.totalNetExposure > exposureLimit.limitAmount) {
            alerts.push({
                id: `alert_exposure_${Date.now()}`,
                counterpartyId: request.counterpartyId,
                alertType: 'EXPOSURE_LIMIT_BREACH',
                severity: 'HIGH',
                message: 'Counterparty exposure limit breached',
                description: `Net exposure of ${metrics.totalNetExposure.toLocaleString()} exceeds limit of ${exposureLimit.limitAmount.toLocaleString()}`,
                currentValue: metrics.totalNetExposure,
                limitValue: exposureLimit.limitAmount,
                breachAmount: metrics.totalNetExposure - exposureLimit.limitAmount,
                breachPercentage: ((metrics.totalNetExposure - exposureLimit.limitAmount) / exposureLimit.limitAmount) * 100,
                recommendedAction: 'Reduce exposure or increase collateral',
                createdAt: new Date(),
                status: 'ACTIVE'
            });
        }
        // Concentration alert
        if (metrics.concentrationIndex > 0.5) {
            alerts.push({
                id: `alert_concentration_${Date.now()}`,
                counterpartyId: request.counterpartyId,
                alertType: 'HIGH_CONCENTRATION',
                severity: 'MEDIUM',
                message: 'High exposure concentration detected',
                description: `Concentration index of ${(metrics.concentrationIndex * 100).toFixed(1)}% indicates high concentration risk`,
                currentValue: metrics.concentrationIndex,
                limitValue: 0.5,
                breachAmount: metrics.concentrationIndex - 0.5,
                breachPercentage: ((metrics.concentrationIndex - 0.5) / 0.5) * 100,
                recommendedAction: 'Diversify exposures across multiple netting sets',
                createdAt: new Date(),
                status: 'ACTIVE'
            });
        }
        return alerts;
    }
    async generateRecommendations(metrics, alerts, netExposures) {
        const recommendations = [];
        if (alerts.some(alert => alert.alertType === 'EXPOSURE_LIMIT_BREACH')) {
            recommendations.push({
                id: `rec_reduce_exposure_${Date.now()}`,
                type: 'EXPOSURE_REDUCTION',
                priority: 'HIGH',
                title: 'Reduce Counterparty Exposure',
                description: 'Implement strategies to reduce net exposure to counterparty',
                actions: [
                    'Close out profitable positions',
                    'Request additional collateral',
                    'Negotiate tighter netting agreements',
                    'Consider credit hedging strategies'
                ],
                expectedImpact: 'Bring exposure within approved limits',
                implementationTimeframe: '1-5 business days',
                estimatedCost: 0,
                riskReduction: metrics.totalNetExposure * 0.3
            });
        }
        if (metrics.nettingRatio < 0.7) {
            recommendations.push({
                id: `rec_improve_netting_${Date.now()}`,
                type: 'NETTING_OPTIMIZATION',
                priority: 'MEDIUM',
                title: 'Optimize Netting Arrangements',
                description: 'Improve netting efficiency to reduce gross exposure',
                actions: [
                    'Review master netting agreements',
                    'Include more transaction types in netting sets',
                    'Negotiate cross-product netting',
                    'Implement close-out netting provisions'
                ],
                expectedImpact: 'Improved netting ratio and reduced capital requirements',
                implementationTimeframe: '1-3 months',
                estimatedCost: 50000,
                riskReduction: metrics.totalGrossExposure * 0.2
            });
        }
        return recommendations;
    }
    // Helper methods
    isCounterpartyExposure(position, counterpartyId) {
        return position.counterpartyId === counterpartyId ||
            position.security.issuerId === counterpartyId ||
            (position.security.derivativeDetails?.counterpartyId === counterpartyId);
    }
    determineExposureType(security) {
        if (security.securityType === 'DERIVATIVE')
            return 'DERIVATIVE';
        if (security.securityType === 'BOND')
            return 'FIXED_INCOME';
        if (security.securityType === 'REPO')
            return 'SECURITIES_FINANCING';
        return 'OTHER';
    }
    calculateNotionalAmount(position) {
        if (position.security.derivativeDetails) {
            return position.security.derivativeDetails.notionalAmount || position.marketValue;
        }
        return position.marketValue;
    }
    getMaturityDate(security) {
        return security.fixedIncomeDetails?.maturityDate ||
            security.derivativeDetails?.expirationDate ||
            null;
    }
    calculateRiskWeight(security) {
        // Basel III risk weights
        if (security.securityType === 'DERIVATIVE')
            return 1.0;
        if (security.securityType === 'GOVERNMENT_BOND')
            return 0.0;
        if (security.securityType === 'CORPORATE_BOND')
            return 1.0;
        return 1.0;
    }
    calculateAddOnFactor(security) {
        // Basel III add-on factors for different instrument types
        const addOnFactors = {
            'INTEREST_RATE': 0.005,
            'EQUITY': 0.10,
            'FX': 0.075,
            'COMMODITY': 0.15,
            'CREDIT': 0.05
        };
        const riskCategory = this.getRiskCategory(security);
        return addOnFactors[riskCategory] || 0.05;
    }
    getCreditConversionFactor(security) {
        // Credit conversion factors for off-balance sheet items
        if (security.securityType === 'COMMITMENT')
            return 0.50;
        if (security.securityType === 'GUARANTEE')
            return 1.00;
        return 1.00; // On-balance sheet items
    }
    getRiskCategory(security) {
        if (security.assetClass === 'FIXED_INCOME')
            return 'INTEREST_RATE';
        if (security.assetClass === 'EQUITY')
            return 'EQUITY';
        if (security.currency !== 'USD')
            return 'FX';
        return 'OTHER';
    }
    async getAssetVolatility(securityId) {
        // Would fetch historical volatility data
        return 0.20; // 20% annual volatility
    }
    getTimeToMaturity(maturityDate) {
        if (!maturityDate)
            return 1; // Default 1 year
        const now = new Date();
        const diffTime = maturityDate.getTime() - now.getTime();
        return Math.max(diffTime / (1000 * 60 * 60 * 24 * 365), 0); // Years
    }
    simulatePFE(exposure, volatility, timeToMaturity, confidenceLevel) {
        // Simplified Monte Carlo simulation for PFE
        const zScore = this.getZScore(confidenceLevel);
        const currentValue = exposure.currentExposure;
        const pfe = currentValue * (1 + zScore * volatility * Math.sqrt(timeToMaturity));
        return Math.max(pfe, 0);
    }
    getZScore(confidenceLevel) {
        // Z-scores for common confidence levels
        const zScores = {
            0.90: 1.28,
            0.95: 1.65,
            0.99: 2.33
        };
        return zScores[confidenceLevel] || 1.65;
    }
    groupExposuresByNettingSet(exposures, nettingAgreements) {
        const nettingSets = new Map();
        exposures.forEach(exposure => {
            const nettingSetId = this.determineNettingSet(exposure, nettingAgreements);
            if (!nettingSets.has(nettingSetId)) {
                nettingSets.set(nettingSetId, []);
            }
            nettingSets.get(nettingSetId).push(exposure);
        });
        return nettingSets;
    }
    determineNettingSet(exposure, nettingAgreements) {
        // Determine which netting set the exposure belongs to
        const applicableAgreement = nettingAgreements.find(agreement => agreement.includedTransactionTypes.includes(exposure.exposureType));
        return applicableAgreement?.id || `default_${exposure.counterpartyId}`;
    }
    getApplicableCollateral(collateralPositions, nettingSetId) {
        // Determine how much collateral applies to this netting set
        return collateralPositions
            .filter(pos => pos.eligibilityStatus === 'ELIGIBLE')
            .reduce((sum, pos) => sum + (pos.marketValue * (1 - pos.haircut)), 0);
    }
    calculateEffectiveMaturity(pfeExposures) {
        if (pfeExposures.length === 0)
            return 1;
        const weightedMaturity = pfeExposures.reduce((sum, pfe) => {
            const weight = pfe.potentialFutureExposure;
            return sum + (pfe.timeToMaturity * weight);
        }, 0);
        const totalWeight = pfeExposures.reduce((sum, pfe) => sum + pfe.potentialFutureExposure, 0);
        return totalWeight > 0 ? weightedMaturity / totalWeight : 1;
    }
    async getCounterpartyRiskWeight(counterpartyId) {
        // Would fetch counterparty-specific risk weight based on rating
        return 1.0; // 100% risk weight
    }
    isSettlingToday(exposure, asOfDate) {
        // Determine if exposure has settlement activity today
        return false; // Simplified
    }
    calculateTimeZoneRisk(exposure) {
        // Calculate time zone risk for settlement
        return 0; // Simplified
    }
    assessPaymentSystemRisk(exposure) {
        return 'LOW'; // Simplified
    }
    identifySettlementMitigants(exposure) {
        return []; // Simplified
    }
    calculateAverageMaturity(exposureAtDefault) {
        if (exposureAtDefault.length === 0)
            return 0;
        const totalMaturity = exposureAtDefault.reduce((sum, ead) => sum + ead.effectiveMaturity, 0);
        return totalMaturity / exposureAtDefault.length;
    }
    async calculateExposureVolatility(netExposures) {
        // Would calculate historical volatility of exposure
        return 0.25; // 25% volatility
    }
    calculateConcentrationIndex(netExposures) {
        const totalExposure = netExposures.reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
        if (totalExposure === 0)
            return 0;
        const weights = netExposures.map(exp => exp.netExposureAfterCollateral / totalExposure);
        return weights.reduce((sum, weight) => sum + (weight * weight), 0);
    }
    calculateHerfindahlIndex(netExposures) {
        return this.calculateConcentrationIndex(netExposures);
    }
    calculateDiversificationRatio(netExposures) {
        return netExposures.length > 0 ? 1 / Math.sqrt(netExposures.length) : 1;
    }
    assessConcentrationRiskLevel(largestExposure, totalExposure) {
        if (totalExposure === 0)
            return 'LOW';
        const concentration = largestExposure / totalExposure;
        if (concentration > 0.5)
            return 'HIGH';
        if (concentration > 0.25)
            return 'MEDIUM';
        return 'LOW';
    }
    async getExposureLimit(counterpartyId) {
        // Would fetch actual exposure limits from database
        return {
            id: `limit_${counterpartyId}`,
            counterpartyId,
            limitType: 'NET_EXPOSURE',
            limitAmount: 10000000,
            currency: 'USD',
            utilizationAmount: 0,
            availableAmount: 10000000,
            utilizationPercentage: 0,
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            approvedBy: 'Risk Committee',
            lastReviewDate: new Date(),
            nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        };
    }
    calculateTotalGrossExposure(currentExposures) {
        return currentExposures.reduce((sum, exp) => sum + Math.abs(exp.currentExposure), 0);
    }
    calculateTotalNetExposure(netExposures) {
        return netExposures.reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
    }
    calculateTotalCollateralValue(collateralPositions) {
        return collateralPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
    }
    calculateExposureAfterCollateral(netExposures, collateralPositions) {
        const totalNetExposure = this.calculateTotalNetExposure(netExposures);
        const totalCollateral = this.calculateTotalCollateralValue(collateralPositions);
        return Math.max(totalNetExposure - totalCollateral, 0);
    }
    async getAllCounterparties(portfolioId) {
        // Would fetch all counterparties for the portfolio
        return [
            { id: 'counterparty_1', name: 'Bank A' },
            { id: 'counterparty_2', name: 'Broker B' },
            { id: 'counterparty_3', name: 'Institution C' }
        ];
    }
    async analyzePortfolioCounterpartyConcentration(assessments) {
        const totalExposure = assessments.reduce((sum, a) => sum + a.totalNetExposure, 0);
        const largestExposure = Math.max(...assessments.map(a => a.totalNetExposure));
        return {
            totalExposure,
            largestExposure,
            concentrationRatio: totalExposure > 0 ? largestExposure / totalExposure : 0,
            numberOfCounterparties: assessments.length
        };
    }
    async storeAssessment(assessment) {
        // Implementation would store the assessment in the database
        this.logger.info('Storing counterparty exposure assessment', { assessmentId: assessment.id });
    }
}
exports.CounterpartyExposureTrackingService = CounterpartyExposureTrackingService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementRiskCalculationEngine = void 0;
const events_1 = require("events");
class SettlementRiskCalculationEngine extends events_1.EventEmitter {
    riskThresholds;
    marketConditions;
    counterpartyProfiles;
    pendingInstructions;
    riskAssessments;
    constructor() {
        super();
        this.riskThresholds = this.getDefaultRiskThresholds();
        this.marketConditions = this.getDefaultMarketConditions();
        this.counterpartyProfiles = new Map();
        this.pendingInstructions = new Map();
        this.riskAssessments = new Map();
    }
    getDefaultRiskThresholds() {
        return {
            creditRiskThreshold: 0.75,
            liquidityRiskThreshold: 0.70,
            operationalRiskThreshold: 0.65,
            marketRiskThreshold: 0.80,
            compositeRiskThreshold: 0.70,
            concentrationThreshold: 0.25,
            exposureThreshold: 10000000
        };
    }
    getDefaultMarketConditions() {
        return {
            volatilityIndex: 0.20,
            liquidityIndex: 0.75,
            creditSpreadIndex: 0.30,
            marketStressLevel: 'NORMAL',
            lastUpdated: new Date()
        };
    }
    async calculateSettlementRisk(instruction) {
        try {
            const counterpartyProfile = this.counterpartyProfiles.get(instruction.counterpartyId);
            if (!counterpartyProfile) {
                throw new Error(`Counterparty profile not found: ${instruction.counterpartyId}`);
            }
            const riskMetrics = await this.calculateRiskMetrics(instruction, counterpartyProfile);
            const keyRiskFactors = this.identifyKeyRiskFactors(instruction, counterpartyProfile, riskMetrics);
            const mitigationActions = this.generateMitigationActions(riskMetrics, keyRiskFactors);
            const alertLevel = this.determineAlertLevel(riskMetrics);
            const assessment = {
                instructionId: instruction.id,
                riskMetrics,
                keyRiskFactors,
                mitigationActions,
                alertLevel,
                assessmentTimestamp: new Date(),
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Valid for 24 hours
            };
            this.riskAssessments.set(instruction.id, assessment);
            this.emit('riskAssessmentCompleted', assessment);
            if (alertLevel === 'CRITICAL') {
                this.emit('criticalRiskAlert', assessment);
            }
            return assessment;
        }
        catch (error) {
            this.emit('riskCalculationError', { instructionId: instruction.id, error: error.message });
            throw error;
        }
    }
    async calculateRiskMetrics(instruction, counterpartyProfile) {
        const creditRisk = this.calculateCreditRisk(instruction, counterpartyProfile);
        const liquidityRisk = this.calculateLiquidityRisk(instruction);
        const operationalRisk = this.calculateOperationalRisk(instruction);
        const marketRisk = this.calculateMarketRisk(instruction);
        const compositeRisk = this.calculateCompositeRisk(creditRisk, liquidityRisk, operationalRisk, marketRisk);
        const riskGrade = this.determineRiskGrade(compositeRisk);
        return {
            creditRisk,
            liquidityRisk,
            operationalRisk,
            marketRisk,
            compositeRisk,
            riskGrade
        };
    }
    calculateCreditRisk(instruction, counterparty) {
        const baseRisk = counterparty.probabilityOfDefault * counterparty.lossGivenDefault;
        const exposureRisk = Math.min(instruction.notionalAmount / counterparty.exposureAtDefault, 1.0);
        const concentrationRisk = counterparty.currentExposure / counterparty.concentrationLimit;
        const ratingMultiplier = this.getCreditRatingMultiplier(counterparty.creditRating);
        return Math.min(baseRisk * exposureRisk * concentrationRisk * ratingMultiplier, 1.0);
    }
    calculateLiquidityRisk(instruction) {
        const timeToSettlement = Math.max((instruction.settlementDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000), 0);
        const liquidityMultiplier = this.getSecurityLiquidityMultiplier(instruction.securityType);
        const marketLiquidityFactor = 1 - this.marketConditions.liquidityIndex;
        const sizeMultiplier = Math.min(instruction.notionalAmount / 50000000, 2.0); // Cap at 2x for large trades
        const timeRisk = Math.max(0.1, 1 - timeToSettlement / 7); // Higher risk for shorter settlement periods
        return Math.min(timeRisk * liquidityMultiplier * marketLiquidityFactor * sizeMultiplier, 1.0);
    }
    calculateOperationalRisk(instruction) {
        const complexityScore = this.getSecurityComplexityScore(instruction.securityType);
        const priorityMultiplier = this.getPriorityRiskMultiplier(instruction.priority);
        const systemLoadFactor = this.getSystemLoadFactor();
        const currencyRisk = instruction.currency !== 'USD' ? 0.1 : 0;
        return Math.min(complexityScore * priorityMultiplier * systemLoadFactor + currencyRisk, 1.0);
    }
    calculateMarketRisk(instruction) {
        const volatilityRisk = this.marketConditions.volatilityIndex;
        const creditSpreadRisk = this.marketConditions.creditSpreadIndex;
        const stressMultiplier = this.getMarketStressMultiplier();
        const assetClassRisk = this.getAssetClassRiskMultiplier(instruction.securityType);
        return Math.min((volatilityRisk + creditSpreadRisk) * stressMultiplier * assetClassRisk, 1.0);
    }
    calculateCompositeRisk(credit, liquidity, operational, market) {
        // Weighted composite score
        const weights = { credit: 0.35, liquidity: 0.25, operational: 0.20, market: 0.20 };
        return credit * weights.credit + liquidity * weights.liquidity +
            operational * weights.operational + market * weights.market;
    }
    determineRiskGrade(compositeRisk) {
        if (compositeRisk <= 0.25)
            return 'LOW';
        if (compositeRisk <= 0.50)
            return 'MEDIUM';
        if (compositeRisk <= 0.75)
            return 'HIGH';
        return 'CRITICAL';
    }
    identifyKeyRiskFactors(instruction, counterparty, metrics) {
        const factors = [];
        if (metrics.creditRisk > this.riskThresholds.creditRiskThreshold) {
            factors.push(`High credit risk due to counterparty rating: ${counterparty.creditRating}`);
        }
        if (metrics.liquidityRisk > this.riskThresholds.liquidityRiskThreshold) {
            factors.push('Limited liquidity in settlement window');
        }
        if (metrics.operationalRisk > this.riskThresholds.operationalRiskThreshold) {
            factors.push('Complex security type requiring manual processing');
        }
        if (metrics.marketRisk > this.riskThresholds.marketRiskThreshold) {
            factors.push(`Elevated market stress level: ${this.marketConditions.marketStressLevel}`);
        }
        if (counterparty.currentExposure > counterparty.concentrationLimit * 0.8) {
            factors.push('Approaching counterparty concentration limit');
        }
        return factors;
    }
    generateMitigationActions(metrics, riskFactors) {
        const actions = [];
        if (metrics.creditRisk > this.riskThresholds.creditRiskThreshold) {
            actions.push('Require additional collateral or guarantee');
            actions.push('Consider trade netting opportunities');
        }
        if (metrics.liquidityRisk > this.riskThresholds.liquidityRiskThreshold) {
            actions.push('Prioritize settlement instruction');
            actions.push('Identify alternative funding sources');
        }
        if (metrics.operationalRisk > this.riskThresholds.operationalRiskThreshold) {
            actions.push('Assign dedicated operations specialist');
            actions.push('Initiate early settlement preparation');
        }
        if (metrics.compositeRisk > this.riskThresholds.compositeRiskThreshold) {
            actions.push('Escalate to risk management team');
            actions.push('Consider settlement guarantee or insurance');
        }
        return actions;
    }
    determineAlertLevel(metrics) {
        if (metrics.compositeRisk > 0.80)
            return 'CRITICAL';
        if (metrics.compositeRisk > 0.60)
            return 'WARNING';
        return 'INFO';
    }
    getCreditRatingMultiplier(rating) {
        const ratingMap = {
            'AAA': 0.1, 'AA+': 0.15, 'AA': 0.2, 'AA-': 0.25,
            'A+': 0.3, 'A': 0.4, 'A-': 0.5,
            'BBB+': 0.6, 'BBB': 0.7, 'BBB-': 0.8,
            'BB+': 1.0, 'BB': 1.2, 'BB-': 1.4,
            'B+': 1.6, 'B': 1.8, 'B-': 2.0,
            'CCC': 2.5, 'CC': 3.0, 'C': 4.0, 'D': 5.0
        };
        return ratingMap[rating] || 2.0;
    }
    getSecurityLiquidityMultiplier(securityType) {
        const liquidityMap = {
            'EQUITY': 0.3,
            'GOVERNMENT_BOND': 0.2,
            'CORPORATE_BOND': 0.5,
            'MUNICIPAL_BOND': 0.7,
            'DERIVATIVE': 0.8,
            'STRUCTURED_PRODUCT': 1.0,
            'PRIVATE_EQUITY': 1.5,
            'REAL_ESTATE': 1.2
        };
        return liquidityMap[securityType] || 0.8;
    }
    getSecurityComplexityScore(securityType) {
        const complexityMap = {
            'EQUITY': 0.2,
            'GOVERNMENT_BOND': 0.3,
            'CORPORATE_BOND': 0.4,
            'MUNICIPAL_BOND': 0.5,
            'DERIVATIVE': 0.8,
            'STRUCTURED_PRODUCT': 1.0,
            'PRIVATE_EQUITY': 0.9,
            'REAL_ESTATE': 0.7
        };
        return complexityMap[securityType] || 0.6;
    }
    getPriorityRiskMultiplier(priority) {
        const priorityMap = {
            'LOW': 1.2,
            'MEDIUM': 1.0,
            'HIGH': 0.8,
            'CRITICAL': 0.6
        };
        return priorityMap[priority] || 1.0;
    }
    getSystemLoadFactor() {
        // Mock implementation - in reality would check actual system metrics
        const currentHour = new Date().getHours();
        if (currentHour >= 9 && currentHour <= 16)
            return 1.2; // Market hours
        return 0.8; // Off-market hours
    }
    getMarketStressMultiplier() {
        const stressMap = {
            'NORMAL': 1.0,
            'ELEVATED': 1.3,
            'HIGH': 1.6,
            'EXTREME': 2.0
        };
        return stressMap[this.marketConditions.marketStressLevel] || 1.0;
    }
    getAssetClassRiskMultiplier(securityType) {
        const riskMap = {
            'EQUITY': 1.2,
            'GOVERNMENT_BOND': 0.5,
            'CORPORATE_BOND': 0.8,
            'MUNICIPAL_BOND': 0.7,
            'DERIVATIVE': 1.5,
            'STRUCTURED_PRODUCT': 1.8,
            'PRIVATE_EQUITY': 1.6,
            'REAL_ESTATE': 1.1
        };
        return riskMap[securityType] || 1.0;
    }
    // Public methods for managing counterparty profiles
    addCounterpartyProfile(profile) {
        this.counterpartyProfiles.set(profile.counterpartyId, profile);
        this.emit('counterpartyProfileAdded', profile);
    }
    updateCounterpartyProfile(counterpartyId, updates) {
        const existing = this.counterpartyProfiles.get(counterpartyId);
        if (existing) {
            const updated = { ...existing, ...updates, lastUpdated: new Date() };
            this.counterpartyProfiles.set(counterpartyId, updated);
            this.emit('counterpartyProfileUpdated', updated);
        }
    }
    getCounterpartyProfile(counterpartyId) {
        return this.counterpartyProfiles.get(counterpartyId);
    }
    updateMarketConditions(conditions) {
        this.marketConditions = { ...this.marketConditions, ...conditions, lastUpdated: new Date() };
        this.emit('marketConditionsUpdated', this.marketConditions);
    }
    updateRiskThresholds(thresholds) {
        this.riskThresholds = { ...this.riskThresholds, ...thresholds };
        this.emit('riskThresholdsUpdated', this.riskThresholds);
    }
    getRiskAssessment(instructionId) {
        return this.riskAssessments.get(instructionId);
    }
    getAllRiskAssessments() {
        return Array.from(this.riskAssessments.values());
    }
    getHighRiskInstructions() {
        return Array.from(this.riskAssessments.values())
            .filter(assessment => assessment.riskMetrics.riskGrade === 'HIGH' || assessment.riskMetrics.riskGrade === 'CRITICAL');
    }
    generateRiskSummary() {
        const assessments = Array.from(this.riskAssessments.values());
        const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        let totalCompositeRisk = 0;
        let criticalAlerts = 0;
        assessments.forEach(assessment => {
            riskDistribution[assessment.riskMetrics.riskGrade]++;
            totalCompositeRisk += assessment.riskMetrics.compositeRisk;
            if (assessment.alertLevel === 'CRITICAL') {
                criticalAlerts++;
            }
        });
        return {
            totalAssessments: assessments.length,
            riskDistribution,
            averageCompositeRisk: assessments.length > 0 ? totalCompositeRisk / assessments.length : 0,
            criticalAlerts
        };
    }
}
exports.SettlementRiskCalculationEngine = SettlementRiskCalculationEngine;

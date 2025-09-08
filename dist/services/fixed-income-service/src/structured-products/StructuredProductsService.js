"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredProductsService = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
/**
 * Structured Products Service
 * Handles mortgage-backed securities, asset-backed securities, and callable bonds
 */
class StructuredProductsService extends events_1.EventEmitter {
    mbsSecurities = new Map();
    absSecurities = new Map();
    callableBonds = new Map();
    marketData = new Map();
    constructor() {
        super();
        this.initializeMarketData();
        this.startPricingEngine();
    }
    /**
     * Create mortgage-backed security
     */
    async createMBS(mbsData) {
        try {
            const mbsId = (0, crypto_1.randomUUID)();
            // Create temporary MBS object for calculations
            const tempMbs = {
                ...mbsData,
                id: mbsId,
                cashFlows: [], // Will be replaced
                riskMetrics: {}, // Will be replaced
                active: true
            };
            // Generate cash flows using prepayment model
            const cashFlows = await this.generateMBSCashFlows(tempMbs);
            tempMbs.cashFlows = cashFlows;
            // Calculate risk metrics
            const riskMetrics = await this.calculateMBSRiskMetrics(tempMbs, cashFlows);
            const mbs = {
                ...mbsData,
                id: mbsId,
                cashFlows,
                riskMetrics,
                active: true
            };
            this.mbsSecurities.set(mbsId, mbs);
            this.emit('mbsCreated', {
                mbsId,
                cusip: mbs.cusip,
                type: mbs.type,
                originalBalance: mbs.originalBalance,
                couponRate: mbs.couponRate,
                timestamp: new Date()
            });
            return mbs;
        }
        catch (error) {
            this.emit('mbsError', {
                operation: 'create',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Create asset-backed security
     */
    async createABS(absData) {
        try {
            const absId = (0, crypto_1.randomUUID)();
            // Create temporary ABS object for calculations
            const tempAbs = {
                ...absData,
                id: absId,
                cashFlows: [], // Will be replaced
                riskMetrics: {}, // Will be replaced
                active: true
            };
            // Generate cash flows based on collateral performance
            const cashFlows = await this.generateABSCashFlows(tempAbs);
            tempAbs.cashFlows = cashFlows;
            // Calculate risk metrics
            const riskMetrics = await this.calculateABSRiskMetrics(tempAbs, cashFlows);
            const abs = {
                ...absData,
                id: absId,
                cashFlows,
                riskMetrics,
                active: true
            };
            this.absSecurities.set(absId, abs);
            this.emit('absCreated', {
                absId,
                cusip: abs.cusip,
                assetType: abs.assetType,
                tranche: abs.tranche,
                seniority: abs.seniority,
                timestamp: new Date()
            });
            return abs;
        }
        catch (error) {
            this.emit('absError', {
                operation: 'create',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Create callable bond
     */
    async createCallableBond(bondData) {
        try {
            const bondId = (0, crypto_1.randomUUID)();
            // Calculate call-adjusted metrics - create temporary bond object for calculations
            const tempBond = {
                ...bondData,
                id: bondId,
                yieldToCall: 0, // Will be replaced
                yieldToWorst: 0, // Will be replaced
                callRisk: {}, // Will be replaced
                cashFlows: [], // Will be replaced
                active: true
            };
            const yieldToCall = this.calculateYieldToCall(tempBond);
            const yieldToWorst = Math.min(bondData.yield, yieldToCall);
            // Generate cash flows considering call scenarios
            const cashFlows = await this.generateCallableBondCashFlows(tempBond);
            // Calculate call risk metrics
            const callRisk = await this.calculateCallRisk(tempBond, cashFlows);
            const bond = {
                ...bondData,
                id: bondId,
                yieldToCall,
                yieldToWorst,
                callRisk,
                cashFlows,
                active: true
            };
            this.callableBonds.set(bondId, bond);
            this.emit('callableBondCreated', {
                bondId,
                cusip: bond.cusip,
                type: bond.type,
                issuer: bond.issuer,
                firstCallDate: bond.firstCallDate,
                timestamp: new Date()
            });
            return bond;
        }
        catch (error) {
            this.emit('callableBondError', {
                operation: 'create',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Update MBS prepayment speeds and recalculate metrics
     */
    async updateMBSPrepaymentModel(mbsId, newModel) {
        try {
            const mbs = this.mbsSecurities.get(mbsId);
            if (!mbs) {
                throw new Error('MBS not found');
            }
            mbs.prepaymentModel = newModel;
            // Regenerate cash flows with new prepayment assumptions
            mbs.cashFlows = await this.generateMBSCashFlows(mbs);
            // Recalculate risk metrics
            mbs.riskMetrics = await this.calculateMBSRiskMetrics(mbs, mbs.cashFlows);
            this.mbsSecurities.set(mbsId, mbs);
            this.emit('mbsPrepaymentModelUpdated', {
                mbsId,
                cusip: mbs.cusip,
                newSpeed: newModel.speed,
                scenario: newModel.scenario,
                timestamp: new Date()
            });
            return mbs;
        }
        catch (error) {
            this.emit('mbsError', {
                mbsId,
                operation: 'update_prepayment',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Analyze call option exercise probability
     */
    analyzeCallProbability(bondId, marketScenarios) {
        try {
            const bond = this.callableBonds.get(bondId);
            if (!bond) {
                throw new Error('Callable bond not found');
            }
            const callProbabilities = {};
            let totalCallProbability = 0;
            let weightedCallDate = 0;
            for (const callOption of bond.callSchedule) {
                if (callOption.exercisable && callOption.callDate > new Date()) {
                    // Calculate probability based on interest rate scenarios
                    let exerciseProbability = 0;
                    for (const scenario of marketScenarios) {
                        const currentYield = scenario.yieldCurve[this.getMaturityBucket(bond.maturityDate)];
                        const refinancingRate = currentYield + 0.5; // 50 bps spread assumption
                        if (refinancingRate < bond.couponRate - 1.0) { // 100 bps threshold
                            exerciseProbability += scenario.probability * 0.8; // 80% exercise probability
                        }
                        else if (refinancingRate < bond.couponRate - 0.5) {
                            exerciseProbability += scenario.probability * 0.4; // 40% exercise probability
                        }
                    }
                    callProbabilities[callOption.callDate.toISOString()] = exerciseProbability;
                    totalCallProbability += exerciseProbability;
                    weightedCallDate += exerciseProbability * callOption.callDate.getTime();
                }
            }
            const expectedCallDate = totalCallProbability > 0
                ? new Date(weightedCallDate / totalCallProbability)
                : null;
            // Calculate option value using Black-Scholes approximation
            const optionValue = this.calculateCallOptionValue(bond, marketScenarios);
            // Generate recommendations
            const recommendations = this.generateCallAnalysisRecommendations(bond, callProbabilities, expectedCallDate, optionValue);
            return {
                callProbabilities,
                expectedCallDate,
                optionValue,
                recommendations
            };
        }
        catch (error) {
            this.emit('callAnalysisError', {
                bondId,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Run stress tests on structured products
     */
    async runStressTests(productIds, scenarios) {
        const results = new Map();
        for (const productId of productIds) {
            const productResults = [];
            for (const scenario of scenarios) {
                let result;
                if (this.mbsSecurities.has(productId)) {
                    result = await this.stressMBS(this.mbsSecurities.get(productId), scenario);
                }
                else if (this.absSecurities.has(productId)) {
                    result = await this.stressABS(this.absSecurities.get(productId), scenario);
                }
                else if (this.callableBonds.has(productId)) {
                    result = await this.stressCallableBond(this.callableBonds.get(productId), scenario);
                }
                else {
                    continue;
                }
                productResults.push(result);
            }
            results.set(productId, productResults);
        }
        this.emit('stressTestCompleted', {
            productCount: productIds.length,
            scenarioCount: scenarios.length,
            timestamp: new Date()
        });
        return results;
    }
    // Private helper methods
    async generateMBSCashFlows(mbs) {
        const cashFlows = [];
        let remainingBalance = mbs.currentBalance;
        const monthlyRate = mbs.couponRate / 12;
        // Calculate payment schedule based on prepayment model
        for (let month = 1; month <= 360; month++) { // 30-year maximum
            if (remainingBalance <= 0)
                break;
            const scheduledPrincipal = this.calculateScheduledPrincipal(remainingBalance, monthlyRate, 360 - month + 1);
            const interestPayment = remainingBalance * monthlyRate;
            // Apply prepayment model
            const prepaymentRate = this.calculatePrepaymentRate(mbs.prepaymentModel, month);
            const prepayment = (remainingBalance - scheduledPrincipal) * prepaymentRate;
            const totalPrincipal = scheduledPrincipal + prepayment;
            const totalPayment = totalPrincipal + interestPayment;
            remainingBalance -= totalPrincipal;
            const paymentDate = new Date(mbs.issueDate);
            paymentDate.setMonth(paymentDate.getMonth() + month);
            cashFlows.push({
                date: paymentDate,
                principal: totalPrincipal,
                interest: interestPayment,
                total: totalPayment,
                balanceRemaining: remainingBalance,
                type: prepayment > 0 ? 'prepayment' : 'scheduled',
                probability: 1.0
            });
        }
        return cashFlows;
    }
    async generateABSCashFlows(abs) {
        const cashFlows = [];
        let remainingBalance = abs.currentBalance;
        const paymentFrequency = abs.paymentStructure.paymentFrequency === 'monthly' ? 12 :
            abs.paymentStructure.paymentFrequency === 'quarterly' ? 4 : 2;
        const periodicRate = abs.couponRate / paymentFrequency;
        const totalPeriods = this.calculateABSMaturityPeriods(abs);
        for (let period = 1; period <= totalPeriods; period++) {
            if (remainingBalance <= 0)
                break;
            const interestPayment = remainingBalance * periodicRate;
            let principalPayment = 0;
            // Calculate principal payment based on structure
            switch (abs.paymentStructure.principalPayment) {
                case 'bullet':
                    principalPayment = period === totalPeriods ? remainingBalance : 0;
                    break;
                case 'amortizing':
                    principalPayment = this.calculateABSAmortization(abs, remainingBalance, period, totalPeriods);
                    break;
                case 'controlled_amortization':
                    principalPayment = this.calculateControlledAmortization(abs, remainingBalance, period);
                    break;
            }
            // Apply defaults and losses
            const defaultRate = this.getABSDefaultRate(abs, period);
            const recovery = defaultRate * abs.collateral.creditQuality.defaultRate * 0.7; // 70% recovery
            const netPrincipal = principalPayment - (principalPayment * defaultRate) + recovery;
            remainingBalance -= netPrincipal;
            const paymentDate = new Date(abs.issueDate);
            paymentDate.setMonth(paymentDate.getMonth() + (period * (12 / paymentFrequency)));
            cashFlows.push({
                date: paymentDate,
                principal: netPrincipal,
                interest: interestPayment,
                total: netPrincipal + interestPayment,
                balanceRemaining: remainingBalance,
                type: 'scheduled',
                probability: 1.0 - defaultRate
            });
        }
        return cashFlows;
    }
    async generateCallableBondCashFlows(bond) {
        const cashFlows = [];
        const periodicRate = bond.couponRate / 2; // Assume semi-annual
        const totalPeriods = Math.ceil((bond.maturityDate.getTime() - bond.issueDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000 / 2));
        for (let period = 1; period <= totalPeriods; period++) {
            const paymentDate = new Date(bond.issueDate);
            paymentDate.setMonth(paymentDate.getMonth() + (period * 6));
            const interestPayment = bond.outstandingAmount * periodicRate;
            let principalPayment = 0;
            let probability = 1.0;
            // Check if this is a call date
            const callOption = bond.callSchedule.find(call => Math.abs(call.callDate.getTime() - paymentDate.getTime()) < 24 * 60 * 60 * 1000);
            if (callOption && callOption.exercisable) {
                // Calculate call probability based on current market conditions
                const callProb = this.estimateCallProbability(bond, callOption, paymentDate);
                if (callProb > 0.5) {
                    principalPayment = bond.outstandingAmount;
                    probability = callProb;
                }
            }
            // Final maturity payment
            if (period === totalPeriods && principalPayment === 0) {
                principalPayment = bond.outstandingAmount;
            }
            cashFlows.push({
                date: paymentDate,
                principal: principalPayment,
                interest: interestPayment,
                total: principalPayment + interestPayment,
                balanceRemaining: principalPayment > 0 ? 0 : bond.outstandingAmount,
                type: principalPayment > 0 && period < totalPeriods ? 'call' : 'scheduled',
                probability
            });
            // If called, no more cash flows
            if (principalPayment > 0 && period < totalPeriods) {
                break;
            }
        }
        return cashFlows;
    }
    async calculateMBSRiskMetrics(mbs, cashFlows) {
        // Calculate various risk metrics
        const prepaymentRisk = this.calculatePrepaymentRisk(mbs, cashFlows);
        const extensionRisk = this.calculateExtensionRisk(mbs, cashFlows);
        const creditRisk = mbs.collateral.creditQuality.defaultRate * 10; // Scale to 0-100
        const interestRateRisk = mbs.duration * 0.5; // Approximation
        const liquidityRisk = this.calculateLiquidityRisk(mbs.type);
        const modelRisk = this.calculateModelRisk(mbs.prepaymentModel);
        // Key rate durations (simplified)
        const keyRateDurations = {
            '2Y': mbs.duration * 0.1,
            '5Y': mbs.duration * 0.3,
            '10Y': mbs.duration * 0.4,
            '30Y': mbs.duration * 0.2
        };
        // Scenario analysis
        const scenarios = ['base', 'rates_up_100', 'rates_down_100', 'fast_prepay', 'slow_prepay'];
        const scenarioAnalysis = [];
        for (const scenario of scenarios) {
            scenarioAnalysis.push(await this.runMBSScenario(mbs, scenario));
        }
        return {
            prepaymentRisk,
            extensionRisk,
            creditRisk,
            interestRateRisk,
            liquidityRisk,
            modelRisk,
            keyRateDurations,
            scenarioAnalysis
        };
    }
    async calculateABSRiskMetrics(abs, cashFlows) {
        const creditRisk = abs.collateral.creditQuality.defaultRate * 15; // Scaled
        const prepaymentRisk = this.calculateABSPrepaymentRisk(abs);
        const liquidityRisk = this.calculateLiquidityRisk(abs.assetType);
        const concentrationRisk = abs.collateral.diversification.herfindahlIndex * 100;
        const servicerRisk = this.calculateServicerRisk(abs);
        const keyRateDurations = {
            '2Y': abs.duration * 0.2,
            '5Y': abs.duration * 0.5,
            '10Y': abs.duration * 0.3
        };
        const stressScenarios = ['base', 'recession', 'rate_shock', 'credit_stress'];
        const stressTestResults = [];
        for (const scenario of stressScenarios) {
            stressTestResults.push(await this.stressABS(abs, { name: scenario }));
        }
        return {
            creditRisk,
            prepaymentRisk,
            liquidityRisk,
            concentrationRisk,
            servicerRisk,
            keyRateDurations,
            stressTestResults
        };
    }
    calculateYieldToCall(bond) {
        if (bond.callSchedule.length === 0)
            return bond.yield;
        // Find the next call date
        const nextCall = bond.callSchedule
            .filter(call => call.callDate > new Date() && call.exercisable)
            .sort((a, b) => a.callDate.getTime() - b.callDate.getTime())[0];
        if (!nextCall)
            return bond.yield;
        // Calculate yield to call using approximation
        const yearsToCall = (nextCall.callDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
        const annualCoupon = bond.couponRate * bond.outstandingAmount;
        const capitalGain = nextCall.callPrice - bond.price;
        return (annualCoupon + (capitalGain / yearsToCall)) / bond.price;
    }
    async calculateCallRisk(bond, cashFlows) {
        const callProbabilities = {};
        for (const callOption of bond.callSchedule) {
            if (callOption.exercisable && callOption.callDate > new Date()) {
                const probability = this.estimateCallProbability(bond, callOption, callOption.callDate);
                callProbabilities[callOption.callDate.toISOString()] = probability;
            }
        }
        const reinvestmentRisk = this.calculateReinvestmentRisk(bond);
        const negativeConvexity = this.calculateNegativeConvexity(bond);
        const optionValue = this.calculateCallOptionValue(bond, []);
        return {
            callProbability: callProbabilities,
            reinvestmentRisk,
            negativeCashflows: negativeConvexity,
            optionValue
        };
    }
    // Additional helper methods for calculations...
    calculateScheduledPrincipal(balance, rate, periods) {
        if (rate === 0)
            return balance / periods;
        const payment = balance * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
        return payment - (balance * rate);
    }
    calculatePrepaymentRate(model, month) {
        let baseSpeed = model.speed / 100;
        if (model.type === 'psa') {
            // PSA ramp: 0.2% in month 1, increasing by 0.2% per month until 6% in month 30
            if (month <= 30) {
                baseSpeed = (month * 0.002) * (model.speed / 100);
            }
            else {
                baseSpeed = 0.06 * (model.speed / 100);
            }
        }
        // Apply seasonality
        const seasonality = model.assumptions.seasonality[month % 12] || 1.0;
        // Apply burnout
        const burnout = Math.max(0, 1 - (month / 360) * model.assumptions.burnout);
        return baseSpeed * seasonality * burnout;
    }
    calculatePrepaymentRisk(mbs, cashFlows) {
        const varianceInTiming = this.calculateCashFlowVariance(cashFlows);
        return Math.min(100, varianceInTiming * 10);
    }
    calculateExtensionRisk(mbs, cashFlows) {
        const averageLife = this.calculateAverageLife(cashFlows);
        const maturityYears = (mbs.maturityDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
        return Math.min(100, (averageLife / maturityYears) * 50);
    }
    calculateLiquidityRisk(securityType) {
        const liquidityScores = {
            'gnma': 10,
            'fnma': 15,
            'fhlmc': 15,
            'private_label': 40,
            'auto_loans': 25,
            'credit_cards': 20,
            'student_loans': 35,
            'corporate': 20,
            'municipal': 30
        };
        return liquidityScores[securityType] || 50;
    }
    calculateModelRisk(model) {
        const modelRiskScores = {
            'psa': 20,
            'cpr': 25,
            'smm': 30,
            'custom': 40
        };
        return modelRiskScores[model.type] || 35;
    }
    async runMBSScenario(mbs, scenario) {
        // Simplified scenario analysis
        let yieldChange = 0;
        let prepaymentMultiplier = 1;
        switch (scenario) {
            case 'rates_up_100':
                yieldChange = 1.0;
                prepaymentMultiplier = 0.5;
                break;
            case 'rates_down_100':
                yieldChange = -1.0;
                prepaymentMultiplier = 2.0;
                break;
            case 'fast_prepay':
                prepaymentMultiplier = 3.0;
                break;
            case 'slow_prepay':
                prepaymentMultiplier = 0.3;
                break;
        }
        const newDuration = mbs.duration * (1 - yieldChange * 0.1);
        const newAverageLife = mbs.averageLife / prepaymentMultiplier;
        const totalReturn = -mbs.duration * yieldChange + (mbs.couponRate / 100);
        return {
            scenario,
            yieldChange,
            prepaymentSpeed: mbs.prepaymentModel.speed * prepaymentMultiplier,
            averageLife: newAverageLife,
            duration: newDuration,
            totalReturn
        };
    }
    calculateABSMaturityPeriods(abs) {
        const years = (abs.maturityDate.getTime() - abs.issueDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const frequency = abs.paymentStructure.paymentFrequency === 'monthly' ? 12 :
            abs.paymentStructure.paymentFrequency === 'quarterly' ? 4 : 2;
        return Math.ceil(years * frequency);
    }
    calculateABSAmortization(abs, balance, period, totalPeriods) {
        // Simplified amortization calculation
        return balance / (totalPeriods - period + 1);
    }
    calculateControlledAmortization(abs, balance, period) {
        // Controlled amortization based on collateral performance
        const baseAmortization = balance * 0.02; // 2% per period
        const performanceFactor = 1 - (abs.collateral.creditQuality.delinquencyRate / 100);
        return baseAmortization * performanceFactor;
    }
    getABSDefaultRate(abs, period) {
        const baseRate = abs.collateral.creditQuality.defaultRate / 100;
        const seasoning = Math.min(1, period / 24); // Defaults peak around 24 months
        return baseRate * seasoning;
    }
    estimateCallProbability(bond, callOption, date) {
        // Simplified call probability based on rate incentive
        const currentRate = this.getCurrentMarketRate(bond.type);
        const incentive = bond.couponRate - currentRate;
        if (incentive > 1.5)
            return 0.9; // 150 bps incentive = 90% probability
        if (incentive > 1.0)
            return 0.7; // 100 bps incentive = 70% probability
        if (incentive > 0.5)
            return 0.4; // 50 bps incentive = 40% probability
        return 0.1; // Base probability
    }
    getCurrentMarketRate(bondType) {
        // Mock current market rates
        const rates = {
            'corporate': 4.5,
            'municipal': 3.5,
            'government': 3.0,
            'agency': 3.2
        };
        return rates[bondType] || 4.0;
    }
    calculateCashFlowVariance(cashFlows) {
        const amounts = cashFlows.map(cf => cf.total);
        const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }
    calculateAverageLife(cashFlows) {
        let weightedSum = 0;
        let totalPrincipal = 0;
        const startDate = cashFlows[0]?.date || new Date();
        for (const cf of cashFlows) {
            const years = (cf.date.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
            weightedSum += cf.principal * years;
            totalPrincipal += cf.principal;
        }
        return totalPrincipal > 0 ? weightedSum / totalPrincipal : 0;
    }
    calculateABSPrepaymentRisk(abs) {
        // ABS prepayment risk varies by asset type
        const riskScores = {
            'auto_loans': 30,
            'credit_cards': 10, // Credit cards have low prepayment risk
            'student_loans': 15,
            'equipment': 25,
            'receivables': 20
        };
        return riskScores[abs.assetType] || 25;
    }
    calculateServicerRisk(abs) {
        // Based on servicer concentration and performance
        return 20; // Simplified
    }
    async stressMBS(mbs, scenario) {
        // Stress test implementation for MBS
        return {
            scenario: scenario.name,
            expectedLoss: mbs.currentBalance * 0.02,
            unexpectedLoss: mbs.currentBalance * 0.05,
            riskContribution: 0.15,
            capitalRequirement: mbs.currentBalance * 0.08
        };
    }
    async stressABS(abs, scenario) {
        // Stress test implementation for ABS
        return {
            scenario: scenario.name,
            expectedLoss: abs.currentBalance * 0.03,
            unexpectedLoss: abs.currentBalance * 0.07,
            riskContribution: 0.20,
            capitalRequirement: abs.currentBalance * 0.10
        };
    }
    async stressCallableBond(bond, scenario) {
        // Stress test implementation for callable bonds
        return {
            scenario: scenario.name,
            expectedLoss: bond.outstandingAmount * 0.01,
            unexpectedLoss: bond.outstandingAmount * 0.03,
            riskContribution: 0.10,
            capitalRequirement: bond.outstandingAmount * 0.05
        };
    }
    calculateReinvestmentRisk(bond) {
        return bond.couponRate > 5 ? 60 : 30; // Higher coupon = higher reinvestment risk
    }
    calculateNegativeConvexity(bond) {
        return bond.callSchedule.length * 10; // More call options = more negative convexity
    }
    calculateCallOptionValue(bond, scenarios) {
        // Simplified option value calculation
        return bond.outstandingAmount * 0.02; // 2% of face value
    }
    getMaturityBucket(maturityDate) {
        const years = (maturityDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
        if (years <= 2)
            return '2Y';
        if (years <= 5)
            return '5Y';
        if (years <= 10)
            return '10Y';
        return '30Y';
    }
    generateCallAnalysisRecommendations(bond, probabilities, expectedCallDate, optionValue) {
        const recommendations = [];
        const highProbDates = Object.entries(probabilities).filter(([_, prob]) => prob > 0.7);
        if (highProbDates.length > 0) {
            recommendations.push('High call probability detected - consider defensive positioning');
        }
        if (optionValue > bond.outstandingAmount * 0.03) {
            recommendations.push('Call option value is significant - factor into pricing decisions');
        }
        if (expectedCallDate && expectedCallDate < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
            recommendations.push('Expected call within 1 year - prepare for reinvestment');
        }
        return recommendations;
    }
    initializeMarketData() {
        // Initialize market data cache
        this.marketData.set('yield_curves', {
            treasury: { '2Y': 4.5, '5Y': 4.2, '10Y': 4.0, '30Y': 4.1 },
            corporate: { '2Y': 5.0, '5Y': 4.8, '10Y': 4.6, '30Y': 4.7 }
        });
    }
    startPricingEngine() {
        // Start periodic pricing updates
        setInterval(() => {
            this.updatePricing();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    updatePricing() {
        // Update pricing for all securities
        this.emit('pricingUpdate', {
            mbsCount: this.mbsSecurities.size,
            absCount: this.absSecurities.size,
            bondCount: this.callableBonds.size,
            timestamp: new Date()
        });
    }
}
exports.StructuredProductsService = StructuredProductsService;
exports.default = StructuredProductsService;

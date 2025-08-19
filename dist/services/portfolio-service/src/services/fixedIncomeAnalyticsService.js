"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedIncomeAnalyticsService = void 0;
const FixedIncomeAnalytics_1 = require("../models/fixedIncome/FixedIncomeAnalytics");
class FixedIncomeAnalyticsService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Yield Calculation Methods
    async calculateYields(request, tenantId, userId) {
        const startTime = Date.now();
        const warnings = [];
        try {
            const security = await this.getFixedIncomeSecurity(request.instrumentId, tenantId);
            if (!security) {
                throw new Error('Fixed income security not found');
            }
            const yields = {};
            // Calculate each requested yield type
            for (const yieldType of request.yieldTypes) {
                switch (yieldType) {
                    case FixedIncomeAnalytics_1.YieldType.YIELD_TO_MATURITY:
                        yields[yieldType] = await this.calculateYieldToMaturity(security, request.price, request.settlementDate);
                        break;
                    case FixedIncomeAnalytics_1.YieldType.YIELD_TO_WORST:
                        yields[yieldType] = await this.calculateYieldToWorst(security, request.price, request.settlementDate);
                        break;
                    case FixedIncomeAnalytics_1.YieldType.YIELD_TO_CALL:
                        if (security.isCallable && security.callSchedule) {
                            yields[yieldType] = await this.calculateYieldToCall(security, request.price, request.settlementDate);
                        }
                        else {
                            warnings.push('Security is not callable - YTC not calculated');
                        }
                        break;
                    case FixedIncomeAnalytics_1.YieldType.CURRENT_YIELD:
                        yields[yieldType] = this.calculateCurrentYield(security, request.price);
                        break;
                    case FixedIncomeAnalytics_1.YieldType.TAX_EQUIVALENT_YIELD:
                        if (request.taxRate && security.bondType === FixedIncomeAnalytics_1.BondType.MUNICIPAL) {
                            yields[yieldType] = this.calculateTaxEquivalentYield(security, request.price, request.taxRate);
                        }
                        else {
                            warnings.push('Tax rate required for tax-equivalent yield calculation');
                        }
                        break;
                    case FixedIncomeAnalytics_1.YieldType.OPTION_ADJUSTED_YIELD:
                        if (security.isCallable || security.isPutable) {
                            yields[yieldType] = await this.calculateOptionAdjustedYield(security, request.price, request.settlementDate);
                        }
                        else {
                            warnings.push('Security has no embedded options - OAY not calculated');
                        }
                        break;
                    default:
                        warnings.push(`Yield type ${yieldType} not implemented`);
                }
            }
            const calculationTime = Date.now() - startTime;
            // Publish calculation event
            await this.kafkaService.publishEvent('fixed-income-yield-calculated', {
                instrumentId: request.instrumentId,
                yieldTypes: request.yieldTypes,
                results: yields,
                tenantId,
                timestamp: new Date().toISOString()
            });
            return {
                instrumentId: request.instrumentId,
                calculationDate: new Date(),
                yields,
                warnings,
                calculationTime
            };
        }
        catch (error) {
            throw new Error(`Yield calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Duration and Convexity Calculation
    async calculateDurationConvexity(request, tenantId, userId) {
        const startTime = Date.now();
        const warnings = [];
        try {
            const security = await this.getFixedIncomeSecurity(request.instrumentId, tenantId);
            if (!security) {
                throw new Error('Fixed income security not found');
            }
            const yieldShock = request.yieldShock || 100; // 100 basis points default
            // Calculate duration metrics
            const durationMetrics = await this.calculateDurationMetrics(security, request.price, request.yield, request.settlementDate, yieldShock, request.durationType);
            // Calculate convexity metrics
            const convexityMetrics = await this.calculateConvexityMetrics(security, request.price, request.yield, request.settlementDate, yieldShock);
            const calculationTime = Date.now() - startTime;
            // Publish calculation event
            await this.kafkaService.publishEvent('fixed-income-duration-calculated', {
                instrumentId: request.instrumentId,
                durationMetrics,
                convexityMetrics,
                tenantId,
                timestamp: new Date().toISOString()
            });
            return {
                instrumentId: request.instrumentId,
                calculationDate: new Date(),
                durationMetrics,
                convexityMetrics,
                warnings,
                calculationTime
            };
        }
        catch (error) {
            throw new Error(`Duration/convexity calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Credit Analysis
    async performCreditAnalysis(request, tenantId, userId) {
        const startTime = Date.now();
        const warnings = [];
        try {
            const security = await this.getFixedIncomeSecurity(request.instrumentId, tenantId);
            if (!security) {
                throw new Error('Fixed income security not found');
            }
            // Calculate credit metrics
            const creditMetrics = await this.calculateCreditMetrics(security, request.horizonDays, request.confidenceLevel, request.recoveryRate || 0.4, // 40% default recovery rate
            request.includeRatingMigration || false);
            const calculationTime = Date.now() - startTime;
            // Publish calculation event
            await this.kafkaService.publishEvent('fixed-income-credit-analyzed', {
                instrumentId: request.instrumentId,
                creditMetrics,
                tenantId,
                timestamp: new Date().toISOString()
            });
            return {
                instrumentId: request.instrumentId,
                calculationDate: new Date(),
                creditMetrics,
                warnings,
                calculationTime
            };
        }
        catch (error) {
            throw new Error(`Credit analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Portfolio-Level Analytics
    async calculatePortfolioAnalytics(portfolioId, tenantId, userId) {
        const startTime = Date.now();
        try {
            // Get all fixed income positions in the portfolio
            const positions = await this.getFixedIncomePositions(portfolioId, tenantId);
            if (positions.length === 0) {
                throw new Error('No fixed income positions found in portfolio');
            }
            // Calculate portfolio-level metrics
            const portfolioYield = this.calculatePortfolioYield(positions);
            const portfolioDuration = this.calculatePortfolioDuration(positions);
            const portfolioConvexity = this.calculatePortfolioConvexity(positions);
            const portfolioSpread = this.calculatePortfolioSpread(positions);
            // Calculate risk metrics
            const interestRateVaR = await this.calculateInterestRateVaR(positions, 0.95, 252);
            const creditVaR = await this.calculateCreditVaR(positions, 0.95, 252);
            const totalVaR = Math.sqrt(Math.pow(interestRateVaR, 2) + Math.pow(creditVaR, 2));
            // Generate allocation breakdowns
            const sectorAllocation = this.calculateSectorAllocation(positions);
            const ratingAllocation = this.calculateRatingAllocation(positions);
            const maturityDistribution = this.calculateMaturityDistribution(positions);
            // Project cash flows
            const expectedCashFlows = await this.projectCashFlows(positions, 1095); // 3 years
            // Perform stress testing
            const stressTestResults = await this.performStressTesting(positions);
            const calculationTime = Date.now() - startTime;
            const analytics = {
                portfolioId,
                tenantId,
                analysisDate: new Date(),
                portfolioYield,
                portfolioDuration,
                portfolioConvexity,
                portfolioSpread,
                interestRateVaR,
                creditVaR,
                totalVaR,
                sectorAllocation,
                ratingAllocation,
                maturityDistribution,
                expectedCashFlows,
                stressTestResults,
                createdAt: new Date(),
                calculationTime
            };
            // Save portfolio analytics
            await this.savePortfolioAnalytics(analytics);
            return analytics;
        }
        catch (error) {
            throw new Error(`Portfolio analytics calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Yield Calculation Methods (Private)
    async calculateYieldToMaturity(security, price, settlementDate) {
        // Use Newton-Raphson method to solve for yield
        let yield_guess = 0.05; // 5% initial guess
        const tolerance = 1e-6;
        const maxIterations = 100;
        for (let i = 0; i < maxIterations; i++) {
            const pv = this.calculatePresentValue(security, yield_guess, settlementDate);
            const duration = this.calculateNumericalDuration(security, yield_guess, settlementDate);
            const f = pv - price;
            const df = -duration * pv; // derivative
            if (Math.abs(f) < tolerance) {
                return yield_guess;
            }
            if (Math.abs(df) < tolerance) {
                break; // Avoid division by zero
            }
            yield_guess = yield_guess - f / df;
        }
        return yield_guess;
    }
    async calculateYieldToWorst(security, price, settlementDate) {
        let worstYield = await this.calculateYieldToMaturity(security, price, settlementDate);
        // Check call yields if callable
        if (security.isCallable && security.callSchedule) {
            for (const call of security.callSchedule) {
                if (call.callDate > settlementDate && call.isActive) {
                    const callYield = this.calculateYieldToDate(security, price, settlementDate, call.callDate, call.callPrice);
                    if (callYield < worstYield) {
                        worstYield = callYield;
                    }
                }
            }
        }
        // Check put yields if putable
        if (security.isPutable && security.putSchedule) {
            for (const put of security.putSchedule) {
                if (put.putDate > settlementDate && put.isActive) {
                    const putYield = this.calculateYieldToDate(security, price, settlementDate, put.putDate, put.putPrice);
                    if (putYield < worstYield) {
                        worstYield = putYield;
                    }
                }
            }
        }
        return worstYield;
    }
    async calculateYieldToCall(security, price, settlementDate) {
        if (!security.callSchedule || security.callSchedule.length === 0) {
            throw new Error('No call schedule available');
        }
        // Find the next callable date
        const nextCall = security.callSchedule
            .filter((call) => call.callDate > settlementDate && call.isActive)
            .sort((a, b) => a.callDate.getTime() - b.callDate.getTime())[0];
        if (!nextCall) {
            throw new Error('No future call dates available');
        }
        return this.calculateYieldToDate(security, price, settlementDate, nextCall.callDate, nextCall.callPrice);
    }
    calculateCurrentYield(security, price) {
        if (price <= 0)
            return 0;
        const annualCoupon = security.faceValue * security.couponRate;
        return annualCoupon / price;
    }
    calculateTaxEquivalentYield(security, price, taxRate) {
        // For municipal bonds, calculate tax-equivalent yield
        const municipalYield = this.calculateCurrentYield(security, price);
        return Promise.resolve(municipalYield / (1 - taxRate));
    }
    async calculateOptionAdjustedYield(security, price, settlementDate) {
        // Simplified OAS calculation - would use Monte Carlo in production
        const baseYield = await this.calculateYieldToMaturity(security, price, settlementDate);
        const optionValue = await this.calculateEmbeddedOptionValue(security, settlementDate);
        const optionAdjustedPrice = price + optionValue;
        return this.calculateYieldToMaturity(security, optionAdjustedPrice, settlementDate);
    }
    // Duration Calculation Methods
    async calculateDurationMetrics(security, price, yield, settlementDate, yieldShock, durationTypes) {
        const dv01 = this.calculateDV01(security, yield, settlementDate);
        const pv01 = this.calculatePV01(security, yield, settlementDate);
        let modifiedDuration = 0;
        let macaulayDuration = 0;
        let effectiveDuration = 0;
        let optionAdjustedDuration = 0;
        let dollarDuration = 0;
        if (durationTypes.includes(FixedIncomeAnalytics_1.DurationType.MODIFIED_DURATION)) {
            modifiedDuration = this.calculateModifiedDuration(security, yield, settlementDate);
        }
        if (durationTypes.includes(FixedIncomeAnalytics_1.DurationType.MACAULAY_DURATION)) {
            macaulayDuration = this.calculateMacaulayDuration(security, yield, settlementDate);
        }
        if (durationTypes.includes(FixedIncomeAnalytics_1.DurationType.EFFECTIVE_DURATION)) {
            effectiveDuration = await this.calculateEffectiveDuration(security, price, yield, settlementDate, yieldShock);
        }
        if (durationTypes.includes(FixedIncomeAnalytics_1.DurationType.OPTION_ADJUSTED_DURATION)) {
            optionAdjustedDuration = await this.calculateOptionAdjustedDuration(security, price, yield, settlementDate);
        }
        if (durationTypes.includes(FixedIncomeAnalytics_1.DurationType.DOLLAR_DURATION)) {
            dollarDuration = modifiedDuration * price / 100;
        }
        return {
            modifiedDuration,
            macaulayDuration,
            effectiveDuration,
            optionAdjustedDuration,
            dollarDuration,
            dv01,
            pv01,
            calculationDate: new Date(),
            yieldShock
        };
    }
    calculateModifiedDuration(security, yield, settlementDate) {
        const macaulay = this.calculateMacaulayDuration(security, yield, settlementDate);
        const frequency = this.getPaymentFrequency(security.paymentFrequency);
        return macaulay / (1 + yield / frequency);
    }
    calculateMacaulayDuration(security, yield, settlementDate) {
        const cashFlows = this.generateCashFlows(security, settlementDate);
        const frequency = this.getPaymentFrequency(security.paymentFrequency);
        const periodicYield = yield / frequency;
        let weightedTime = 0;
        let presentValue = 0;
        for (const cf of cashFlows) {
            const periods = this.calculatePeriods(settlementDate, cf.date, frequency);
            const pv = cf.amount / Math.pow(1 + periodicYield, periods);
            weightedTime += periods * pv;
            presentValue += pv;
        }
        return (weightedTime / presentValue) / frequency;
    }
    async calculateEffectiveDuration(security, price, yield, settlementDate, yieldShock) {
        const shockDecimal = yieldShock / 10000; // Convert basis points to decimal
        const priceUp = this.calculatePresentValue(security, yield - shockDecimal, settlementDate);
        const priceDown = this.calculatePresentValue(security, yield + shockDecimal, settlementDate);
        return (priceUp - priceDown) / (2 * price * shockDecimal);
    }
    async calculateOptionAdjustedDuration(security, price, yield, settlementDate) {
        // Simplified OAD calculation - would use binomial/trinomial tree in production
        if (!security.isCallable && !security.isPutable) {
            return this.calculateModifiedDuration(security, yield, settlementDate);
        }
        // Apply option adjustment factor
        const optionAdjustmentFactor = 0.85; // Simplified - would be model-derived
        const modifiedDuration = this.calculateModifiedDuration(security, yield, settlementDate);
        return modifiedDuration * optionAdjustmentFactor;
    }
    // Convexity Calculation Methods
    async calculateConvexityMetrics(security, price, yield, settlementDate, yieldShock) {
        const convexity = this.calculateConvexity(security, yield, settlementDate, yieldShock);
        const effectiveConvexity = await this.calculateEffectiveConvexity(security, price, yield, settlementDate, yieldShock);
        const dollarConvexity = convexity * price / 10000;
        const gamma = this.calculateGamma(security, yield, settlementDate);
        return {
            convexity,
            effectiveConvexity,
            dollarConvexity,
            gamma,
            calculationDate: new Date(),
            yieldShock
        };
    }
    calculateConvexity(security, yield, settlementDate, yieldShock) {
        const shockDecimal = yieldShock / 10000;
        const p0 = this.calculatePresentValue(security, yield, settlementDate);
        const pUp = this.calculatePresentValue(security, yield + shockDecimal, settlementDate);
        const pDown = this.calculatePresentValue(security, yield - shockDecimal, settlementDate);
        return (pUp + pDown - 2 * p0) / (p0 * Math.pow(shockDecimal, 2));
    }
    async calculateEffectiveConvexity(security, price, yield, settlementDate, yieldShock) {
        // Similar to effective duration but for second-order price sensitivity
        const shockDecimal = yieldShock / 10000;
        const priceUp = this.calculatePresentValue(security, yield - shockDecimal, settlementDate);
        const priceDown = this.calculatePresentValue(security, yield + shockDecimal, settlementDate);
        return (priceUp + priceDown - 2 * price) / (price * Math.pow(shockDecimal, 2));
    }
    calculateGamma(security, yield, settlementDate) {
        // Second derivative of price with respect to yield
        const epsilon = 0.0001; // Small change in yield
        const duration1 = this.calculateNumericalDuration(security, yield - epsilon, settlementDate);
        const duration2 = this.calculateNumericalDuration(security, yield + epsilon, settlementDate);
        return (duration2 - duration1) / (2 * epsilon);
    }
    // Credit Analysis Methods
    async calculateCreditMetrics(security, horizonDays, confidenceLevel, recoveryRate, includeRatingMigration) {
        // Get credit spread
        const creditSpread = await this.getCreditSpread(security);
        // Calculate default probability using Merton model approach
        const defaultProbability = this.calculateDefaultProbability(security, horizonDays);
        // Calculate expected and unexpected loss
        const exposureAtDefault = security.faceValue * security.currentPrice / 100;
        const expectedLoss = defaultProbability * (1 - recoveryRate) * exposureAtDefault;
        const unexpectedLoss = this.calculateUnexpectedLoss(defaultProbability, recoveryRate, exposureAtDefault, confidenceLevel);
        // Calculate Credit VaR
        const creditVaR = this.calculateCreditVaR(defaultProbability, recoveryRate, exposureAtDefault, confidenceLevel);
        // Calculate hazard rate and survival probability
        const hazardRate = this.calculateHazardRate(defaultProbability, horizonDays);
        const survivalProbability = Math.exp(-hazardRate * (horizonDays / 365));
        return {
            creditSpread,
            defaultProbability,
            recoveryRate,
            creditVaR,
            expectedLoss,
            unexpectedLoss,
            hazardRate,
            survivalProbability,
            calculationDate: new Date(),
            horizonDays,
            confidenceLevel
        };
    }
    // Helper Methods
    calculatePresentValue(security, yield, settlementDate) {
        const cashFlows = this.generateCashFlows(security, settlementDate);
        const frequency = this.getPaymentFrequency(security.paymentFrequency);
        const periodicYield = yield / frequency;
        let pv = 0;
        for (const cf of cashFlows) {
            const periods = this.calculatePeriods(settlementDate, cf.date, frequency);
            pv += cf.amount / Math.pow(1 + periodicYield, periods);
        }
        return pv;
    }
    generateCashFlows(security, settlementDate) {
        const cashFlows = [];
        const frequency = this.getPaymentFrequency(security.paymentFrequency);
        const periodicCoupon = (security.faceValue * security.couponRate) / frequency;
        let currentDate = new Date(settlementDate);
        const maturityDate = new Date(security.maturityDate);
        // Find first coupon date after settlement
        while (currentDate < maturityDate) {
            currentDate = this.getNextPaymentDate(currentDate, frequency);
            if (currentDate <= maturityDate) {
                const amount = currentDate.getTime() === maturityDate.getTime()
                    ? periodicCoupon + security.faceValue
                    : periodicCoupon;
                cashFlows.push({ date: new Date(currentDate), amount });
            }
        }
        return cashFlows;
    }
    getPaymentFrequency(frequency) {
        switch (frequency) {
            case FixedIncomeAnalytics_1.PaymentFrequency.ANNUAL: return 1;
            case FixedIncomeAnalytics_1.PaymentFrequency.SEMI_ANNUAL: return 2;
            case FixedIncomeAnalytics_1.PaymentFrequency.QUARTERLY: return 4;
            case FixedIncomeAnalytics_1.PaymentFrequency.MONTHLY: return 12;
            case FixedIncomeAnalytics_1.PaymentFrequency.WEEKLY: return 52;
            case FixedIncomeAnalytics_1.PaymentFrequency.DAILY: return 365;
            default: return 2; // Default to semi-annual
        }
    }
    calculatePeriods(startDate, endDate, frequency) {
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        return (daysDiff * frequency) / 365;
    }
    getNextPaymentDate(currentDate, frequency) {
        const next = new Date(currentDate);
        const monthsToAdd = 12 / frequency;
        next.setMonth(next.getMonth() + monthsToAdd);
        return next;
    }
    calculateNumericalDuration(security, yield, settlementDate) {
        const epsilon = 0.0001;
        const p1 = this.calculatePresentValue(security, yield - epsilon, settlementDate);
        const p2 = this.calculatePresentValue(security, yield + epsilon, settlementDate);
        const p0 = this.calculatePresentValue(security, yield, settlementDate);
        return -(p2 - p1) / (2 * epsilon * p0);
    }
    calculateYieldToDate(security, price, settlementDate, targetDate, targetPrice) {
        // Newton-Raphson method for yield to specific date
        let yield_guess = 0.05;
        const tolerance = 1e-6;
        const maxIterations = 100;
        for (let i = 0; i < maxIterations; i++) {
            const pv = this.calculatePresentValueToDate(security, yield_guess, settlementDate, targetDate, targetPrice);
            const duration = this.calculateDurationToDate(security, yield_guess, settlementDate, targetDate);
            const f = pv - price;
            const df = -duration * pv;
            if (Math.abs(f) < tolerance) {
                return yield_guess;
            }
            if (Math.abs(df) < tolerance) {
                break;
            }
            yield_guess = yield_guess - f / df;
        }
        return yield_guess;
    }
    calculatePresentValueToDate(security, yield, settlementDate, targetDate, targetPrice) {
        const cashFlows = this.generateCashFlows(security, settlementDate)
            .filter(cf => cf.date <= targetDate);
        // Replace final cash flow with target price
        if (cashFlows.length > 0) {
            const lastCashFlow = cashFlows[cashFlows.length - 1];
            if (lastCashFlow.date.getTime() === targetDate.getTime()) {
                lastCashFlow.amount = targetPrice;
            }
            else {
                cashFlows.push({ date: targetDate, amount: targetPrice });
            }
        }
        const frequency = this.getPaymentFrequency(security.paymentFrequency);
        const periodicYield = yield / frequency;
        let pv = 0;
        for (const cf of cashFlows) {
            const periods = this.calculatePeriods(settlementDate, cf.date, frequency);
            pv += cf.amount / Math.pow(1 + periodicYield, periods);
        }
        return pv;
    }
    calculateDurationToDate(security, yield, settlementDate, targetDate) {
        const epsilon = 0.0001;
        const p1 = this.calculatePresentValueToDate(security, yield - epsilon, settlementDate, targetDate, 100);
        const p2 = this.calculatePresentValueToDate(security, yield + epsilon, settlementDate, targetDate, 100);
        const p0 = this.calculatePresentValueToDate(security, yield, settlementDate, targetDate, 100);
        return -(p2 - p1) / (2 * epsilon * p0);
    }
    calculateDV01(security, yield, settlementDate) {
        const p0 = this.calculatePresentValue(security, yield, settlementDate);
        const p1 = this.calculatePresentValue(security, yield + 0.0001, settlementDate);
        return p0 - p1;
    }
    calculatePV01(security, yield, settlementDate) {
        const p0 = this.calculatePresentValue(security, yield, settlementDate);
        const p1 = this.calculatePresentValue(security, yield + 0.0001, settlementDate);
        return Math.abs(p0 - p1);
    }
    // Data Access Methods
    async getFixedIncomeSecurity(instrumentId, tenantId) {
        return await this.prisma.fixedIncomeSecurity.findFirst({
            where: { instrumentId, tenantId },
            include: {
                callSchedule: true,
                putSchedule: true
            }
        });
    }
    async getFixedIncomePositions(portfolioId, tenantId) {
        return await this.prisma.position.findMany({
            where: {
                portfolioId,
                tenantId,
                instrument: {
                    assetClass: 'FIXED_INCOME'
                }
            },
            include: {
                instrument: {
                    include: {
                        fixedIncomeDetails: true
                    }
                }
            }
        });
    }
    // Portfolio Analytics Methods
    calculatePortfolioYield(positions) {
        let totalValue = 0;
        let weightedYield = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const yield = position.instrument.fixedIncomeDetails?.currentYield || 0;
            totalValue += marketValue;
            weightedYield += marketValue * yield;
        }
        return totalValue > 0 ? weightedYield / totalValue : 0;
    }
    calculatePortfolioDuration(positions) {
        let totalValue = 0;
        let weightedDuration = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const duration = position.instrument.fixedIncomeDetails?.modifiedDuration || 0;
            totalValue += marketValue;
            weightedDuration += marketValue * duration;
        }
        return totalValue > 0 ? weightedDuration / totalValue : 0;
    }
    calculatePortfolioConvexity(positions) {
        let totalValue = 0;
        let weightedConvexity = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const convexity = position.instrument.fixedIncomeDetails?.convexity || 0;
            totalValue += marketValue;
            weightedConvexity += marketValue * convexity;
        }
        return totalValue > 0 ? weightedConvexity / totalValue : 0;
    }
    calculatePortfolioSpread(positions) {
        let totalValue = 0;
        let weightedSpread = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const spread = position.instrument.fixedIncomeDetails?.spreadToTreasury || 0;
            totalValue += marketValue;
            weightedSpread += marketValue * spread;
        }
        return totalValue > 0 ? weightedSpread / totalValue : 0;
    }
    calculateSectorAllocation(positions) {
        const sectorMap = new Map();
        let totalValue = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const sector = position.instrument.sector || 'Other';
            totalValue += marketValue;
            if (!sectorMap.has(sector)) {
                sectorMap.set(sector, {
                    sector,
                    marketValue: 0,
                    totalYield: 0,
                    totalDuration: 0,
                    count: 0,
                    ratings: []
                });
            }
            const sectorData = sectorMap.get(sector);
            sectorData.marketValue += marketValue;
            sectorData.totalYield += marketValue * (position.instrument.fixedIncomeDetails?.currentYield || 0);
            sectorData.totalDuration += marketValue * (position.instrument.fixedIncomeDetails?.modifiedDuration || 0);
            sectorData.count += 1;
            if (position.instrument.fixedIncomeDetails?.creditRating) {
                sectorData.ratings.push(position.instrument.fixedIncomeDetails.creditRating);
            }
        }
        return Array.from(sectorMap.values()).map(sector => ({
            sector: sector.sector,
            marketValue: sector.marketValue,
            percentage: (sector.marketValue / totalValue) * 100,
            averageYield: sector.marketValue > 0 ? sector.totalYield / sector.marketValue : 0,
            averageDuration: sector.marketValue > 0 ? sector.totalDuration / sector.marketValue : 0,
            averageRating: this.calculateAverageRating(sector.ratings)
        }));
    }
    calculateRatingAllocation(positions) {
        const ratingMap = new Map();
        let totalValue = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const rating = position.instrument.fixedIncomeDetails?.creditRating || FixedIncomeAnalytics_1.CreditRating.NR;
            totalValue += marketValue;
            if (!ratingMap.has(rating)) {
                ratingMap.set(rating, {
                    marketValue: 0,
                    totalYield: 0,
                    totalDuration: 0
                });
            }
            const ratingData = ratingMap.get(rating);
            ratingData.marketValue += marketValue;
            ratingData.totalYield += marketValue * (position.instrument.fixedIncomeDetails?.currentYield || 0);
            ratingData.totalDuration += marketValue * (position.instrument.fixedIncomeDetails?.modifiedDuration || 0);
        }
        return Array.from(ratingMap.entries()).map(([rating, data]) => ({
            rating,
            marketValue: data.marketValue,
            percentage: (data.marketValue / totalValue) * 100,
            averageYield: data.marketValue > 0 ? data.totalYield / data.marketValue : 0,
            averageDuration: data.marketValue > 0 ? data.totalDuration / data.marketValue : 0
        }));
    }
    calculateMaturityDistribution(positions) {
        const buckets = [
            { name: '0-1Y', min: 0, max: 1, positions: [] },
            { name: '1-3Y', min: 1, max: 3, positions: [] },
            { name: '3-5Y', min: 3, max: 5, positions: [] },
            { name: '5-10Y', min: 5, max: 10, positions: [] },
            { name: '10-20Y', min: 10, max: 20, positions: [] },
            { name: '20Y+', min: 20, max: Infinity, positions: [] }
        ];
        let totalValue = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const maturity = position.instrument.fixedIncomeDetails?.remainingMaturity || 0;
            totalValue += marketValue;
            for (const bucket of buckets) {
                if (maturity >= bucket.min && maturity < bucket.max) {
                    bucket.positions.push({
                        marketValue,
                        yield: position.instrument.fixedIncomeDetails?.currentYield || 0,
                        duration: position.instrument.fixedIncomeDetails?.modifiedDuration || 0
                    });
                    break;
                }
            }
        }
        return buckets.map(bucket => {
            const bucketValue = bucket.positions.reduce((sum, p) => sum + p.marketValue, 0);
            const weightedYield = bucket.positions.reduce((sum, p) => sum + p.marketValue * p.yield, 0);
            const weightedDuration = bucket.positions.reduce((sum, p) => sum + p.marketValue * p.duration, 0);
            return {
                bucketName: bucket.name,
                marketValue: bucketValue,
                percentage: (bucketValue / totalValue) * 100,
                averageYield: bucketValue > 0 ? weightedYield / bucketValue : 0,
                averageDuration: bucketValue > 0 ? weightedDuration / bucketValue : 0
            };
        });
    }
    async projectCashFlows(positions, horizonDays) {
        const cashFlowMap = new Map();
        const horizonDate = new Date(Date.now() + horizonDays * 24 * 60 * 60 * 1000);
        for (const position of positions) {
            const security = position.instrument.fixedIncomeDetails;
            if (!security)
                continue;
            const cashFlows = this.generateCashFlows(security, new Date())
                .filter(cf => cf.date <= horizonDate);
            for (const cf of cashFlows) {
                const dateKey = cf.date.toISOString().split('T')[0];
                if (!cashFlowMap.has(dateKey)) {
                    cashFlowMap.set(dateKey, {
                        paymentDate: cf.date,
                        principalPayment: 0,
                        interestPayment: 0,
                        totalPayment: 0
                    });
                }
                const existing = cashFlowMap.get(dateKey);
                const positionAmount = cf.amount * position.quantity / security.faceValue;
                // Determine if payment is principal or interest
                const isMaturity = cf.date.getTime() === security.maturityDate.getTime();
                if (isMaturity) {
                    existing.principalPayment += positionAmount * (security.faceValue / (security.faceValue + cf.amount - security.faceValue));
                    existing.interestPayment += positionAmount - existing.principalPayment;
                }
                else {
                    existing.interestPayment += positionAmount;
                }
                existing.totalPayment = existing.principalPayment + existing.interestPayment;
            }
        }
        // Convert to sorted array and add cumulative fields
        const projections = Array.from(cashFlowMap.values())
            .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
        let cumulativePrincipal = 0;
        const totalPrincipal = projections.reduce((sum, p) => sum + p.principalPayment, 0);
        return projections.map(projection => {
            cumulativePrincipal += projection.principalPayment;
            return {
                ...projection,
                cumulativePrincipal,
                remainingBalance: totalPrincipal - cumulativePrincipal
            };
        });
    }
    async performStressTesting(positions) {
        const scenarios = [
            { name: 'Parallel +100bp', shock: 100 },
            { name: 'Parallel +200bp', shock: 200 },
            { name: 'Parallel -100bp', shock: -100 },
            { name: 'Steepening +50bp', shock: 50 },
            { name: 'Flattening -50bp', shock: -50 }
        ];
        const results = [];
        const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
        for (const scenario of scenarios) {
            let totalPriceImpact = 0;
            let totalDurationContribution = 0;
            let totalConvexityContribution = 0;
            for (const position of positions) {
                const marketValue = position.quantity * position.currentPrice;
                const duration = position.instrument.fixedIncomeDetails?.modifiedDuration || 0;
                const convexity = position.instrument.fixedIncomeDetails?.convexity || 0;
                const yieldChange = scenario.shock / 10000; // Convert bp to decimal
                // First-order (duration) effect
                const durationEffect = -duration * yieldChange * marketValue;
                // Second-order (convexity) effect
                const convexityEffect = 0.5 * convexity * Math.pow(yieldChange, 2) * marketValue;
                const totalEffect = durationEffect + convexityEffect;
                totalPriceImpact += totalEffect;
                totalDurationContribution += Math.abs(durationEffect);
                totalConvexityContribution += Math.abs(convexityEffect);
            }
            results.push({
                scenario: scenario.name,
                yieldShock: scenario.shock,
                priceImpact: totalPriceImpact,
                percentageImpact: (totalPriceImpact / totalValue) * 100,
                durationContribution: totalDurationContribution,
                convexityContribution: totalConvexityContribution
            });
        }
        return results;
    }
    // Risk Calculation Methods
    async calculateInterestRateVaR(positions, confidenceLevel, horizonDays) {
        // Simplified parametric VaR calculation
        const portfolioDuration = this.calculatePortfolioDuration(positions);
        const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
        // Assume 20bp daily volatility of interest rates
        const dailyVolatility = 0.002; // 20bp
        const horizonVolatility = dailyVolatility * Math.sqrt(horizonDays);
        // Z-score for confidence level
        const zScore = confidenceLevel === 0.95 ? 1.645 :
            confidenceLevel === 0.99 ? 2.326 : 1.645;
        return portfolioDuration * totalValue * horizonVolatility * zScore;
    }
    async calculateCreditVaR(positions, confidenceLevel, horizonDays) {
        // Simplified credit VaR using default probabilities
        let totalCreditVaR = 0;
        for (const position of positions) {
            const marketValue = position.quantity * position.currentPrice;
            const defaultProb = this.estimateDefaultProbability(position.instrument.fixedIncomeDetails);
            const recoveryRate = 0.4; // 40% recovery rate assumption
            const lossGivenDefault = 1 - recoveryRate;
            // Credit VaR = EDF * LGD * Exposure * Z-score adjustment
            const creditVaR = defaultProb * lossGivenDefault * marketValue * 1.5;
            totalCreditVaR += Math.pow(creditVaR, 2); // Sum of squares for portfolio effect
        }
        return Math.sqrt(totalCreditVaR);
    }
    // Helper Methods
    async getCreditSpread(security) {
        // Would integrate with market data service
        return security.spreadToTreasury || 100; // 100bp default
    }
    calculateDefaultProbability(security, horizonDays) {
        // Simplified default probability based on credit rating
        const ratingToPD = {
            [FixedIncomeAnalytics_1.CreditRating.AAA]: 0.0002,
            [FixedIncomeAnalytics_1.CreditRating.AA]: 0.0005,
            [FixedIncomeAnalytics_1.CreditRating.A]: 0.0015,
            [FixedIncomeAnalytics_1.CreditRating.BBB]: 0.005,
            [FixedIncomeAnalytics_1.CreditRating.BB]: 0.02,
            [FixedIncomeAnalytics_1.CreditRating.B]: 0.08,
            [FixedIncomeAnalytics_1.CreditRating.CCC]: 0.25,
            [FixedIncomeAnalytics_1.CreditRating.D]: 1.0
        };
        const annualPD = ratingToPD[security.creditRating] || 0.01;
        return 1 - Math.pow(1 - annualPD, horizonDays / 365);
    }
    calculateUnexpectedLoss(defaultProb, recoveryRate, exposure, confidenceLevel) {
        const expectedLoss = defaultProb * (1 - recoveryRate) * exposure;
        const variance = defaultProb * (1 - defaultProb) * Math.pow((1 - recoveryRate) * exposure, 2);
        const standardDeviation = Math.sqrt(variance);
        const zScore = confidenceLevel === 0.95 ? 1.645 :
            confidenceLevel === 0.99 ? 2.326 : 1.645;
        const unexpectedLoss = zScore * standardDeviation;
        return Math.max(0, unexpectedLoss - expectedLoss);
    }
    calculateCreditVaR(defaultProb, recoveryRate, exposure, confidenceLevel) {
        const lossGivenDefault = (1 - recoveryRate) * exposure;
        const expectedLoss = defaultProb * lossGivenDefault;
        // Use beta distribution for loss distribution
        const alpha = defaultProb * 10; // Shape parameter
        const beta = (1 - defaultProb) * 10; // Shape parameter
        // Simplified VaR calculation
        const zScore = confidenceLevel === 0.95 ? 1.645 :
            confidenceLevel === 0.99 ? 2.326 : 1.645;
        return expectedLoss + zScore * Math.sqrt(defaultProb * (1 - defaultProb)) * lossGivenDefault;
    }
    calculateHazardRate(defaultProb, horizonDays) {
        if (defaultProb >= 1)
            return Infinity;
        return -Math.log(1 - defaultProb) / (horizonDays / 365);
    }
    estimateDefaultProbability(security) {
        if (!security)
            return 0.01; // 1% default assumption
        const ratingToPD = {
            [FixedIncomeAnalytics_1.CreditRating.AAA]: 0.0002,
            [FixedIncomeAnalytics_1.CreditRating.AA]: 0.0005,
            [FixedIncomeAnalytics_1.CreditRating.A]: 0.0015,
            [FixedIncomeAnalytics_1.CreditRating.BBB]: 0.005,
            [FixedIncomeAnalytics_1.CreditRating.BB]: 0.02,
            [FixedIncomeAnalytics_1.CreditRating.B]: 0.08,
            [FixedIncomeAnalytics_1.CreditRating.CCC]: 0.25,
            [FixedIncomeAnalytics_1.CreditRating.D]: 1.0
        };
        return ratingToPD[security.creditRating] || 0.01;
    }
    calculateAverageRating(ratings) {
        if (ratings.length === 0)
            return 'NR';
        // Simplified average - would use proper rating scale in production
        const ratingValues = {
            [FixedIncomeAnalytics_1.CreditRating.AAA]: 21,
            [FixedIncomeAnalytics_1.CreditRating.AA_PLUS]: 20,
            [FixedIncomeAnalytics_1.CreditRating.AA]: 19,
            [FixedIncomeAnalytics_1.CreditRating.AA_MINUS]: 18,
            [FixedIncomeAnalytics_1.CreditRating.A_PLUS]: 17,
            [FixedIncomeAnalytics_1.CreditRating.A]: 16,
            [FixedIncomeAnalytics_1.CreditRating.A_MINUS]: 15,
            [FixedIncomeAnalytics_1.CreditRating.BBB_PLUS]: 14,
            [FixedIncomeAnalytics_1.CreditRating.BBB]: 13,
            [FixedIncomeAnalytics_1.CreditRating.BBB_MINUS]: 12,
            [FixedIncomeAnalytics_1.CreditRating.BB_PLUS]: 11,
            [FixedIncomeAnalytics_1.CreditRating.BB]: 10,
            [FixedIncomeAnalytics_1.CreditRating.BB_MINUS]: 9,
            [FixedIncomeAnalytics_1.CreditRating.B_PLUS]: 8,
            [FixedIncomeAnalytics_1.CreditRating.B]: 7,
            [FixedIncomeAnalytics_1.CreditRating.B_MINUS]: 6,
            [FixedIncomeAnalytics_1.CreditRating.CCC_PLUS]: 5,
            [FixedIncomeAnalytics_1.CreditRating.CCC]: 4,
            [FixedIncomeAnalytics_1.CreditRating.CCC_MINUS]: 3,
            [FixedIncomeAnalytics_1.CreditRating.CC]: 2,
            [FixedIncomeAnalytics_1.CreditRating.C]: 1,
            [FixedIncomeAnalytics_1.CreditRating.D]: 0
        };
        const avgValue = ratings.reduce((sum, rating) => sum + (ratingValues[rating] || 0), 0) / ratings.length;
        // Find closest rating
        const entries = Object.entries(ratingValues);
        const closest = entries.reduce((prev, curr) => Math.abs(curr[1] - avgValue) < Math.abs(prev[1] - avgValue) ? curr : prev);
        return closest[0];
    }
    async calculateEmbeddedOptionValue(security, settlementDate) {
        // Simplified option value calculation - would use Black-Scholes or binomial model
        if (!security.isCallable && !security.isPutable)
            return 0;
        // Mock calculation for demonstration
        const baseValue = security.currentPrice * security.faceValue / 100;
        const optionValue = baseValue * 0.02; // 2% of base value as option premium
        return security.isCallable ? -optionValue : optionValue; // Negative for issuer options
    }
    async savePortfolioAnalytics(analytics) {
        // Save to database - would create appropriate schema
        await this.prisma.fixedIncomePortfolioAnalytics.create({
            data: {
                portfolioId: analytics.portfolioId,
                tenantId: analytics.tenantId,
                analysisDate: analytics.analysisDate,
                portfolioYield: analytics.portfolioYield,
                portfolioDuration: analytics.portfolioDuration,
                portfolioConvexity: analytics.portfolioConvexity,
                portfolioSpread: analytics.portfolioSpread,
                interestRateVaR: analytics.interestRateVaR,
                creditVaR: analytics.creditVaR,
                totalVaR: analytics.totalVaR,
                sectorAllocation: JSON.stringify(analytics.sectorAllocation),
                ratingAllocation: JSON.stringify(analytics.ratingAllocation),
                maturityDistribution: JSON.stringify(analytics.maturityDistribution),
                expectedCashFlows: JSON.stringify(analytics.expectedCashFlows),
                stressTestResults: JSON.stringify(analytics.stressTestResults),
                calculationTime: analytics.calculationTime
            }
        });
    }
}
exports.FixedIncomeAnalyticsService = FixedIncomeAnalyticsService;

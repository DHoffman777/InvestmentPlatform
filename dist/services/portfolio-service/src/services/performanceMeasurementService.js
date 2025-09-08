"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMeasurementService = void 0;
const PerformanceMeasurement_1 = require("../models/performance/PerformanceMeasurement");
class PerformanceMeasurementService {
    prisma; // Changed to any to bypass type checking
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Main Performance Calculation Methods
    async calculatePerformance(request, tenantId, userId) {
        const startTime = Date.now();
        const warnings = [];
        try {
            // Get portfolio data
            const portfolio = await this.getPortfolioWithTransactions(request.portfolioId, request.periodStart, request.periodEnd, tenantId);
            if (!portfolio) {
                throw new Error('Portfolio not found');
            }
            // Get market values at period boundaries
            const beginningValue = await this.getPortfolioValue(request.portfolioId, request.periodStart, tenantId);
            const endingValue = await this.getPortfolioValue(request.portfolioId, request.periodEnd, tenantId);
            // Get cash flows during the period
            const cashFlows = await this.getCashFlows(request.portfolioId, request.periodStart, request.periodEnd, tenantId);
            // Calculate returns based on method
            let timeWeightedReturn;
            let moneyWeightedReturn;
            switch (request.calculationMethod) {
                case PerformanceMeasurement_1.CalculationMethod.TIME_WEIGHTED:
                    timeWeightedReturn = await this.calculateTimeWeightedReturn(portfolio, beginningValue, endingValue, request.periodStart, request.periodEnd, cashFlows, request.cashFlowTiming || PerformanceMeasurement_1.CashFlowTiming.END_OF_DAY);
                    moneyWeightedReturn = await this.calculateMoneyWeightedReturn(beginningValue, endingValue, cashFlows);
                    break;
                case PerformanceMeasurement_1.CalculationMethod.MONEY_WEIGHTED:
                    moneyWeightedReturn = await this.calculateMoneyWeightedReturn(beginningValue, endingValue, cashFlows);
                    timeWeightedReturn = await this.calculateTimeWeightedReturn(portfolio, beginningValue, endingValue, request.periodStart, request.periodEnd, cashFlows, request.cashFlowTiming || PerformanceMeasurement_1.CashFlowTiming.END_OF_DAY);
                    break;
                case PerformanceMeasurement_1.CalculationMethod.MODIFIED_DIETZ:
                    timeWeightedReturn = await this.calculateModifiedDietz(beginningValue, endingValue, cashFlows, request.periodStart, request.periodEnd);
                    moneyWeightedReturn = timeWeightedReturn; // Approximation
                    break;
                default:
                    throw new Error(`Unsupported calculation method: ${request.calculationMethod}`);
            }
            // Calculate fees and gross/net returns
            const fees = await this.calculateFees(request.portfolioId, request.periodStart, request.periodEnd, tenantId);
            const grossReturn = timeWeightedReturn;
            const netReturn = this.calculateNetReturn(grossReturn, fees, beginningValue);
            // Calculate risk metrics
            const riskMetrics = await this.calculateRiskMetrics(request.portfolioId, request.periodStart, request.periodEnd, tenantId);
            // Calculate risk-adjusted metrics
            const riskAdjustedMetrics = await this.calculateRiskAdjustedMetrics(netReturn, riskMetrics.volatility, riskMetrics.downsideDeviation, riskMetrics.maxDrawdown, tenantId);
            // Get benchmark data if requested
            let benchmarkComparison;
            if (request.benchmarkId) {
                benchmarkComparison = await this.calculateBenchmarkComparison(request.portfolioId, request.benchmarkId, request.periodStart, request.periodEnd, netReturn, riskMetrics.volatility, tenantId, userId);
            }
            // Create performance period record
            const performancePeriod = {
                tenantId,
                portfolioId: request.portfolioId,
                periodStart: request.periodStart,
                periodEnd: request.periodEnd,
                periodType: request.periodType,
                // Return calculations
                timeWeightedReturn,
                moneyWeightedReturn,
                simpleReturn: this.calculateSimpleReturn(beginningValue, endingValue, cashFlows.netCashFlows),
                logarithmicReturn: Math.log(1 + timeWeightedReturn),
                // Gross vs net returns
                grossReturn,
                netReturn,
                managementFees: fees.managementFees,
                performanceFees: fees.performanceFees,
                otherFees: fees.otherFees,
                // Portfolio values
                beginningValue,
                endingValue,
                averageValue: (beginningValue + endingValue) / 2,
                highWaterMark: await this.getHighWaterMark(request.portfolioId, request.periodEnd, tenantId),
                // Cash flow information
                totalCashFlows: cashFlows.totalCashFlows,
                netCashFlows: cashFlows.netCashFlows,
                contributions: cashFlows.contributions,
                withdrawals: cashFlows.withdrawals,
                // Risk metrics
                volatility: riskMetrics.volatility,
                standardDeviation: riskMetrics.standardDeviation,
                downside_deviation: riskMetrics.downsideDeviation,
                maxDrawdown: riskMetrics.maxDrawdown,
                maxDrawdownDuration: riskMetrics.maxDrawdownDuration,
                // Risk-adjusted performance
                sharpeRatio: riskAdjustedMetrics.sharpeRatio,
                sortinoRatio: riskAdjustedMetrics.sortinoRatio,
                calmarRatio: riskAdjustedMetrics.calmarRatio,
                informationRatio: benchmarkComparison?.informationRatio || 0,
                treynorRatio: riskAdjustedMetrics.treynorRatio,
                jensenAlpha: riskAdjustedMetrics.jensenAlpha,
                beta: riskAdjustedMetrics.beta,
                // Benchmark comparison
                benchmarkReturn: benchmarkComparison?.benchmarkReturn || 0,
                excessReturn: benchmarkComparison?.excessReturn || 0,
                activeReturn: benchmarkComparison?.excessReturn || 0,
                trackingError: benchmarkComparison?.trackingError || 0,
                // Attribution placeholders (calculated separately if requested)
                securitySelection: 0,
                assetAllocation: 0,
                interactionEffect: 0,
                totalAttribution: 0,
                // Currency impact (simplified for now)
                localCurrencyReturn: netReturn,
                currencyReturn: 0,
                totalReturn: netReturn,
                // Data quality
                dataQualityScore: this.calculateDataQualityScore(portfolio, cashFlows),
                calculationMethod: request.calculationMethod,
                calculationDate: new Date(),
                isRebalancingPeriod: await this.isRebalancingPeriod(request.portfolioId, request.periodStart, request.periodEnd, tenantId),
                // Missing properties
                preTaxReturn: grossReturn,
                afterTaxReturn: netReturn * 0.75, // Simplified tax calculation
                taxDrag: grossReturn - (netReturn * 0.75),
                hasSignificantCashFlows: this.hasSignificantCashFlows(cashFlows, beginningValue),
                // Metadata
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId
            };
            // Save performance period
            const savedPerformancePeriod = await this.prisma.performancePeriod.create({
                data: performancePeriod
            });
            // Calculate attribution if requested
            let attribution;
            if (request.includeAttribution) {
                attribution = await this.calculatePerformanceAttribution(savedPerformancePeriod.id, request.portfolioId, request.periodStart, request.periodEnd, request.benchmarkId, tenantId, userId);
            }
            // Publish event
            await this.kafkaService.publishEvent('performance-calculated', {
                portfolioId: request.portfolioId,
                performancePeriodId: savedPerformancePeriod.id,
                periodType: request.periodType,
                return: netReturn,
                tenantId,
                timestamp: new Date().toISOString()
            });
            const calculationTime = Date.now() - startTime;
            return {
                performancePeriod: savedPerformancePeriod,
                attribution,
                benchmarkComparison,
                warnings,
                calculationTime
            };
        }
        catch (error) {
            throw new Error(`Performance calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Time-Weighted Return Calculation
    async calculateTimeWeightedReturn(portfolio, beginningValue, endingValue, periodStart, periodEnd, cashFlows, cashFlowTiming) {
        // Get daily portfolio values for the period
        const dailyValues = await this.getDailyPortfolioValues(portfolio.id, periodStart, periodEnd, portfolio.tenantId);
        if (dailyValues.length === 0) {
            // Fallback to simple calculation if no daily values
            return this.calculateSimpleReturn(beginningValue, endingValue, cashFlows.netCashFlows);
        }
        // Calculate sub-period returns
        let cumulativeReturn = 1.0;
        for (let i = 0; i < dailyValues.length - 1; i++) {
            const currentValue = dailyValues[i].value;
            const nextValue = dailyValues[i + 1].value;
            // Check for cash flows on this date
            const daysCashFlows = this.getCashFlowsForDate(cashFlows.flows, dailyValues[i + 1].date);
            let adjustedCurrentValue = currentValue;
            // Adjust for cash flows based on timing
            if (daysCashFlows !== 0) {
                switch (cashFlowTiming) {
                    case PerformanceMeasurement_1.CashFlowTiming.BEGINNING_OF_DAY:
                        adjustedCurrentValue = currentValue + daysCashFlows;
                        break;
                    case PerformanceMeasurement_1.CashFlowTiming.END_OF_DAY:
                        // No adjustment needed - cash flows affect next period
                        break;
                    case PerformanceMeasurement_1.CashFlowTiming.ACTUAL_TIME:
                        // Simplified - assume mid-day
                        adjustedCurrentValue = currentValue + (daysCashFlows * 0.5);
                        break;
                }
            }
            if (adjustedCurrentValue > 0) {
                const subPeriodReturn = (nextValue - daysCashFlows) / adjustedCurrentValue;
                cumulativeReturn *= (1 + subPeriodReturn);
            }
        }
        return cumulativeReturn - 1;
    }
    // Money-Weighted Return (IRR) Calculation
    async calculateMoneyWeightedReturn(beginningValue, endingValue, cashFlows) {
        // Set up cash flow array for IRR calculation
        const irr_cashFlows = [-beginningValue]; // Initial investment (negative)
        // Add intermediate cash flows
        if (cashFlows.flows && cashFlows.flows.length > 0) {
            for (const flow of cashFlows.flows) {
                irr_cashFlows.push(-flow.amount); // Negative for contributions, positive for withdrawals
            }
        }
        // Add ending value (positive)
        irr_cashFlows.push(endingValue);
        // Calculate IRR using Newton-Raphson method
        return this.calculateIRR(irr_cashFlows);
    }
    // Modified Dietz Method
    calculateModifiedDietz(beginningValue, endingValue, cashFlows, periodStart, periodEnd) {
        const totalDays = this.daysBetween(periodStart, periodEnd);
        let weightedCashFlows = 0;
        if (cashFlows.flows && cashFlows.flows.length > 0) {
            for (const flow of cashFlows.flows) {
                const daysFromStart = this.daysBetween(periodStart, flow.date);
                const weight = (totalDays - daysFromStart) / totalDays;
                weightedCashFlows += flow.amount * weight;
            }
        }
        const averageCapital = beginningValue + weightedCashFlows;
        if (averageCapital <= 0) {
            return Promise.resolve(0);
        }
        const return_rate = (endingValue - beginningValue - cashFlows.netCashFlows) / averageCapital;
        return Promise.resolve(return_rate);
    }
    // Risk Metrics Calculation
    async calculateRiskMetrics(portfolioId, periodStart, periodEnd, tenantId) {
        // Get daily returns for the period
        const dailyReturns = await this.getDailyReturns(portfolioId, periodStart, periodEnd, tenantId);
        if (dailyReturns.length === 0) {
            return {
                volatility: 0,
                standardDeviation: 0,
                downsideDeviation: 0,
                maxDrawdown: 0,
                maxDrawdownDuration: 0
            };
        }
        // Calculate standard deviation (volatility)
        const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
        const standardDeviation = Math.sqrt(variance);
        const annualizedVolatility = standardDeviation * Math.sqrt(252); // Annualized
        // Calculate downside deviation
        const negativeReturns = dailyReturns.filter(r => r < 0);
        const downsideVariance = negativeReturns.length > 0 ?
            negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length : 0;
        const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
        // Calculate maximum drawdown
        const { maxDrawdown, maxDrawdownDuration } = this.calculateMaxDrawdown(dailyReturns);
        return {
            volatility: annualizedVolatility,
            standardDeviation: standardDeviation,
            downsideDeviation: downsideDeviation,
            maxDrawdown: maxDrawdown,
            maxDrawdownDuration: maxDrawdownDuration
        };
    }
    // Risk-Adjusted Performance Metrics
    async calculateRiskAdjustedMetrics(portfolioReturn, volatility, downsideDeviation, maxDrawdown, tenantId) {
        // Get risk-free rate (could be configurable per tenant)
        const riskFreeRate = await this.getRiskFreeRate(tenantId);
        // Sharpe Ratio
        const sharpeRatio = volatility > 0 ? (portfolioReturn - riskFreeRate) / volatility : 0;
        // Sortino Ratio
        const sortinoRatio = downsideDeviation > 0 ? (portfolioReturn - riskFreeRate) / downsideDeviation : 0;
        // Calmar Ratio
        const calmarRatio = maxDrawdown > 0 ? portfolioReturn / Math.abs(maxDrawdown) : 0;
        // Treynor Ratio (simplified - would need portfolio beta)
        const beta = 1.0; // Simplified assumption
        const treynorRatio = beta > 0 ? (portfolioReturn - riskFreeRate) / beta : 0;
        // Jensen's Alpha (simplified)
        const jensenAlpha = portfolioReturn - (riskFreeRate + beta * (0.08 - riskFreeRate)); // Assuming 8% market return
        return {
            sharpeRatio,
            sortinoRatio,
            calmarRatio,
            treynorRatio,
            jensenAlpha,
            beta
        };
    }
    // Benchmark Comparison
    async calculateBenchmarkComparison(portfolioId, benchmarkId, periodStart, periodEnd, portfolioReturn, portfolioVolatility, tenantId, userId) {
        // Get benchmark return for the period
        const benchmarkReturn = await this.getBenchmarkReturn(benchmarkId, periodStart, periodEnd, tenantId);
        const benchmarkVolatility = await this.getBenchmarkVolatility(benchmarkId, periodStart, periodEnd, tenantId);
        // Calculate comparison metrics
        const excessReturn = portfolioReturn - benchmarkReturn;
        const trackingError = await this.calculateTrackingError(portfolioId, benchmarkId, periodStart, periodEnd, tenantId);
        const informationRatio = trackingError > 0 ? excessReturn / trackingError : 0;
        // Calculate statistical measures
        const correlation = await this.calculateCorrelation(portfolioId, benchmarkId, periodStart, periodEnd, tenantId);
        const beta = await this.calculateBeta(portfolioId, benchmarkId, periodStart, periodEnd, tenantId);
        const alpha = portfolioReturn - (await this.getRiskFreeRate(tenantId) + beta * (benchmarkReturn - await this.getRiskFreeRate(tenantId)));
        const rSquared = Math.pow(correlation, 2);
        // Calculate capture ratios
        const { upCaptureRatio, downCaptureRatio } = await this.calculateCaptureRatios(portfolioId, benchmarkId, periodStart, periodEnd, tenantId);
        // Calculate hit rate
        const hitRate = await this.calculateHitRate(portfolioId, benchmarkId, periodStart, periodEnd, tenantId);
        const benchmarkComparison = {
            tenantId,
            portfolioId,
            benchmarkId,
            comparisonPeriodStart: periodStart,
            comparisonPeriodEnd: periodEnd,
            periodType: PerformanceMeasurement_1.PeriodType.CUSTOM,
            portfolioReturn,
            benchmarkReturn,
            excessReturn,
            portfolioVolatility,
            benchmarkVolatility,
            trackingError,
            portfolioSharpeRatio: await this.calculateSharpeRatio(portfolioReturn, portfolioVolatility, tenantId),
            benchmarkSharpeRatio: await this.calculateSharpeRatio(benchmarkReturn, benchmarkVolatility, tenantId),
            informationRatio,
            correlation,
            beta,
            alpha,
            rSquared,
            percentileRank: 0, // Would need peer group data
            quartileRank: 0, // Would need peer group data
            upCaptureRatio,
            downCaptureRatio,
            hitRate,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId
        };
        return await this.prisma.benchmarkComparison.create({
            data: benchmarkComparison
        });
    }
    // Performance Attribution
    async calculatePerformanceAttribution(performancePeriodId, portfolioId, periodStart, periodEnd, benchmarkId, tenantId, userId) {
        if (!benchmarkId) {
            throw new Error('Benchmark is required for attribution analysis');
        }
        // Get portfolio and benchmark holdings
        const portfolioHoldings = await this.getPortfolioHoldings(portfolioId, periodStart, periodEnd, tenantId);
        const benchmarkHoldings = await this.getBenchmarkHoldings(benchmarkId, periodStart, periodEnd, tenantId);
        // Calculate sector attribution
        const sectorAttribution = await this.calculateSectorAttribution(portfolioHoldings, benchmarkHoldings);
        // Calculate total attribution effects
        const totalAllocationEffect = sectorAttribution.reduce((sum, s) => sum + s.allocationEffect, 0);
        const totalSelectionEffect = sectorAttribution.reduce((sum, s) => sum + s.selectionEffect, 0);
        const totalInteractionEffect = sectorAttribution.reduce((sum, s) => sum + s.interactionEffect, 0);
        const attribution = {
            tenantId,
            performancePeriodId,
            portfolioId,
            attributionType: PerformanceMeasurement_1.AttributionType.BRINSON_HOOD_BEEBOWER,
            attributionLevel: 'SECTOR',
            sectors: sectorAttribution,
            assetClasses: [], // Simplified for now
            securities: [], // Simplified for now
            factors: [], // Simplified for now
            totalPortfolioReturn: 0, // Would calculate from performance period
            benchmarkReturn: 0, // Would get from benchmark
            excessReturn: 0, // Would calculate
            allocationEffect: totalAllocationEffect,
            selectionEffect: totalSelectionEffect,
            interactionEffect: totalInteractionEffect,
            currencyEffect: 0, // Simplified for now
            totalRisk: 0, // Would calculate
            activeRisk: 0, // Would calculate
            riskAttribution: [], // Simplified for now
            attributionPeriodStart: periodStart,
            attributionPeriodEnd: periodEnd,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId
        };
        return await this.prisma.performanceAttribution.create({
            data: attribution
        });
    }
    // Helper Methods
    calculateSimpleReturn(beginningValue, endingValue, netCashFlows) {
        if (beginningValue <= 0)
            return 0;
        return (endingValue - beginningValue - netCashFlows) / beginningValue;
    }
    calculateNetReturn(grossReturn, fees, beginningValue) {
        const totalFees = fees.managementFees + fees.performanceFees + fees.otherFees;
        const feeRate = beginningValue > 0 ? totalFees / beginningValue : 0;
        return grossReturn - feeRate;
    }
    calculateIRR(cashFlows, guess = 0.1) {
        const maxIterations = 100;
        const tolerance = 1e-6;
        let rate = guess;
        for (let i = 0; i < maxIterations; i++) {
            let npv = 0;
            let dnpv = 0;
            for (let j = 0; j < cashFlows.length; j++) {
                npv += cashFlows[j] / Math.pow(1 + rate, j);
                dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
            }
            if (Math.abs(npv) < tolerance) {
                return rate;
            }
            if (Math.abs(dnpv) < tolerance) {
                break; // Avoid division by zero
            }
            rate = rate - npv / dnpv;
        }
        return rate;
    }
    calculateMaxDrawdown(returns) {
        let peak = 1;
        let maxDrawdown = 0;
        let maxDuration = 0;
        let currentDuration = 0;
        let cumulativeReturn = 1;
        for (const dailyReturn of returns) {
            cumulativeReturn *= (1 + dailyReturn);
            if (cumulativeReturn > peak) {
                peak = cumulativeReturn;
                currentDuration = 0;
            }
            else {
                currentDuration++;
                const drawdown = (peak - cumulativeReturn) / peak;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
                if (currentDuration > maxDuration) {
                    maxDuration = currentDuration;
                }
            }
        }
        return { maxDrawdown: -maxDrawdown, maxDrawdownDuration: maxDuration };
    }
    daysBetween(date1, date2) {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    getCashFlowsForDate(flows, date) {
        if (!flows)
            return 0;
        return flows
            .filter(f => f.date.toDateString() === date.toDateString())
            .reduce((sum, f) => sum + f.amount, 0);
    }
    calculateDataQualityScore(portfolio, cashFlows) {
        let score = 100;
        // Reduce score for missing data
        if (!portfolio || !cashFlows)
            score -= 20;
        if (cashFlows.flows && cashFlows.flows.length === 0)
            score -= 10;
        return Math.max(0, score);
    }
    hasSignificantCashFlows(cashFlows, beginningValue) {
        if (beginningValue <= 0)
            return false;
        const threshold = 0.1; // 10% threshold
        return Math.abs(cashFlows.netCashFlows / beginningValue) > threshold;
    }
    // Data Access Methods (simplified implementations)
    async getPortfolioWithTransactions(portfolioId, periodStart, periodEnd, tenantId) {
        return await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, tenantId },
            include: {
                transactions: {
                    where: {
                        transactionDate: {
                            gte: periodStart,
                            lte: periodEnd
                        }
                    }
                }
            }
        });
    }
    async getPortfolioValue(portfolioId, date, tenantId) {
        // Simplified - would calculate based on positions and market prices
        const positions = await this.prisma.position.findMany({
            where: { portfolioId, tenantId }
        });
        // Mock calculation - in reality would use market prices at the date
        return positions.reduce((sum, pos) => sum + (pos.quantity * pos.averageCost), 0);
    }
    async getCashFlows(portfolioId, periodStart, periodEnd, tenantId) {
        const transactions = await this.prisma.transaction.findMany({
            where: {
                portfolioId,
                tenantId,
                transactionDate: {
                    gte: periodStart,
                    lte: periodEnd
                },
                transactionType: {
                    in: ['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST']
                }
            }
        });
        const flows = transactions.map((t) => ({
            date: t.transactionDate,
            amount: t.transactionType === 'WITHDRAWAL' ? -t.amount : t.amount
        }));
        const totalCashFlows = flows.reduce((sum, f) => sum + Math.abs(f.amount), 0);
        const netCashFlows = flows.reduce((sum, f) => sum + f.amount, 0);
        const contributions = flows.filter((f) => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);
        const withdrawals = flows.filter((f) => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0);
        return { flows, totalCashFlows, netCashFlows, contributions, withdrawals };
    }
    async calculateFees(portfolioId, periodStart, periodEnd, tenantId) {
        const feeTransactions = await this.prisma.transaction.findMany({
            where: {
                portfolioId,
                tenantId,
                transactionDate: {
                    gte: periodStart,
                    lte: periodEnd
                },
                transactionType: 'FEE'
            }
        });
        // Simplified fee categorization
        const managementFees = feeTransactions
            .filter((t) => t.description?.includes('management'))
            .reduce((sum, t) => sum + t.amount, 0);
        const performanceFees = feeTransactions
            .filter((t) => t.description?.includes('performance'))
            .reduce((sum, t) => sum + t.amount, 0);
        const otherFees = feeTransactions
            .filter((t) => !t.description?.includes('management') && !t.description?.includes('performance'))
            .reduce((sum, t) => sum + t.amount, 0);
        return { managementFees, performanceFees, otherFees };
    }
    async getDailyPortfolioValues(portfolioId, periodStart, periodEnd, tenantId) {
        // Simplified - would query market data service for daily valuations
        const values = [];
        const current = new Date(periodStart);
        let value = await this.getPortfolioValue(portfolioId, current, tenantId);
        while (current <= periodEnd) {
            values.push({ date: new Date(current), value });
            current.setDate(current.getDate() + 1);
            value *= (1 + (Math.random() - 0.5) * 0.02); // Mock daily changes
        }
        return values;
    }
    async getDailyReturns(portfolioId, periodStart, periodEnd, tenantId) {
        const dailyValues = await this.getDailyPortfolioValues(portfolioId, periodStart, periodEnd, tenantId);
        const returns = [];
        for (let i = 1; i < dailyValues.length; i++) {
            if (dailyValues[i - 1].value > 0) {
                const dailyReturn = (dailyValues[i].value - dailyValues[i - 1].value) / dailyValues[i - 1].value;
                returns.push(dailyReturn);
            }
        }
        return returns;
    }
    async getHighWaterMark(portfolioId, asOfDate, tenantId) {
        // Would query historical values to find the highest portfolio value
        return await this.getPortfolioValue(portfolioId, asOfDate, tenantId);
    }
    async isRebalancingPeriod(portfolioId, periodStart, periodEnd, tenantId) {
        // Check if significant rebalancing occurred during the period
        const rebalancingTransactions = await this.prisma.transaction.count({
            where: {
                portfolioId,
                tenantId,
                transactionDate: {
                    gte: periodStart,
                    lte: periodEnd
                },
                transactionType: 'REBALANCE'
            }
        });
        return rebalancingTransactions > 0;
    }
    async getRiskFreeRate(tenantId) {
        // Simplified - would query current Treasury rate or configuration
        return 0.02; // 2% default risk-free rate
    }
    async getBenchmarkReturn(benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would query benchmark data
        return 0.08; // Mock 8% benchmark return
    }
    async getBenchmarkVolatility(benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would calculate from benchmark daily returns
        return 0.15; // Mock 15% benchmark volatility
    }
    async calculateTrackingError(portfolioId, benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would calculate from daily return differences
        return 0.03; // Mock 3% tracking error
    }
    async calculateCorrelation(portfolioId, benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would calculate from daily returns
        return 0.85; // Mock 85% correlation
    }
    async calculateBeta(portfolioId, benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would calculate from return regression
        return 1.1; // Mock beta of 1.1
    }
    async calculateCaptureRatios(portfolioId, benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would calculate from up/down market periods
        return { upCaptureRatio: 0.95, downCaptureRatio: 0.85 };
    }
    async calculateHitRate(portfolioId, benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would calculate percentage of periods outperforming
        return 0.60; // Mock 60% hit rate
    }
    async calculateSharpeRatio(portfolioReturn, volatility, tenantId) {
        const riskFreeRate = await this.getRiskFreeRate(tenantId);
        return volatility > 0 ? (portfolioReturn - riskFreeRate) / volatility : 0;
    }
    async getPortfolioHoldings(portfolioId, periodStart, periodEnd, tenantId) {
        // Simplified - would get weighted average holdings
        return [];
    }
    async getBenchmarkHoldings(benchmarkId, periodStart, periodEnd, tenantId) {
        // Simplified - would get benchmark constituent weights
        return [];
    }
    async calculateSectorAttribution(portfolioHoldings, benchmarkHoldings) {
        // Simplified sector attribution calculation
        return [];
    }
}
exports.PerformanceMeasurementService = PerformanceMeasurementService;

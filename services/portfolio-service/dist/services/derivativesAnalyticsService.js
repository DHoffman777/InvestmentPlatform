"use strict";
// Derivatives Analytics Service
// Phase 3.5 - Comprehensive derivatives analytics with Greeks, pricing, and risk management
Object.defineProperty(exports, "__esModule", { value: true });
exports.DerivativesAnalyticsService = void 0;
const logger_1 = require("../utils/logger");
const DerivativesAnalytics_1 = require("../models/derivatives/DerivativesAnalytics");
class DerivativesAnalyticsService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Greeks Calculations using Black-Scholes and advanced models
    async calculateGreeks(request, tenantId, userId) {
        const startTime = Date.now();
        const warnings = [];
        try {
            // Get instrument details
            const instrument = await this.getDerivativeInstrument(request.securityId, tenantId);
            if (!instrument) {
                throw new Error('Derivative instrument not found');
            }
            if (instrument.derivativeType !== DerivativesAnalytics_1.DerivativeType.CALL_OPTION &&
                instrument.derivativeType !== DerivativesAnalytics_1.DerivativeType.PUT_OPTION) {
                throw new Error('Greeks calculation only supported for options');
            }
            const option = instrument;
            // Get market data or use provided values
            const underlyingPrice = request.underlyingPrice || option.underlyingPrice;
            const volatility = request.volatility || option.impliedVolatility;
            const riskFreeRate = request.riskFreeRate || await this.getRiskFreeRate(option.currency);
            const dividendYield = request.dividendYield || 0;
            // Calculate time to expiration
            const now = new Date();
            const timeToExpiration = this.calculateTimeToExpiration(option.expirationDate, now);
            if (timeToExpiration <= 0) {
                warnings.push('Option has expired, Greeks may not be meaningful');
            }
            // Validate inputs
            if (underlyingPrice <= 0) {
                throw new Error('Underlying price must be positive');
            }
            if (volatility <= 0) {
                throw new Error('Volatility must be positive');
            }
            if (timeToExpiration < 0) {
                warnings.push('Negative time to expiration detected');
            }
            // Calculate Greeks based on selected model
            const model = request.calculationMethod || DerivativesAnalytics_1.VolatilityModel.BLACK_SCHOLES;
            let greeksResult;
            switch (model) {
                case DerivativesAnalytics_1.VolatilityModel.BLACK_SCHOLES:
                    greeksResult = await this.calculateBlackScholesGreeks(option, underlyingPrice, volatility, riskFreeRate, dividendYield, timeToExpiration);
                    break;
                case DerivativesAnalytics_1.VolatilityModel.BINOMIAL:
                    greeksResult = await this.calculateBinomialGreeks(option, underlyingPrice, volatility, riskFreeRate, dividendYield, timeToExpiration);
                    break;
                case DerivativesAnalytics_1.VolatilityModel.MONTE_CARLO:
                    greeksResult = await this.calculateMonteCarloGreeks(option, underlyingPrice, volatility, riskFreeRate, dividendYield, timeToExpiration);
                    break;
                default:
                    throw new Error(`Unsupported calculation method: ${model}`);
            }
            const greeks = {
                id: this.generateId(),
                tenantId,
                securityId: request.securityId,
                calculationDate: new Date(),
                // Core Greeks
                delta: greeksResult.delta,
                gamma: greeksResult.gamma,
                theta: greeksResult.theta,
                vega: greeksResult.vega,
                rho: greeksResult.rho,
                // Extended Greeks
                lambda: greeksResult.lambda,
                epsilon: greeksResult.epsilon,
                volga: greeksResult.volga,
                vanna: greeksResult.vanna,
                charm: greeksResult.charm,
                color: greeksResult.color,
                // Cash equivalents
                deltaCash: greeksResult.delta * underlyingPrice,
                gammaCash: greeksResult.gamma * underlyingPrice * underlyingPrice / 100,
                thetaDaily: greeksResult.theta / 365,
                vegaPercent: greeksResult.vega / 100,
                rhoPercent: greeksResult.rho / 100,
                // Parameters used
                underlyingPrice,
                volatility,
                riskFreeRate,
                dividendYield,
                timeToExpiration,
                // Metadata
                calculationMethod: model,
                calculationTime: Date.now() - startTime,
                warnings: warnings.length > 0 ? warnings : undefined
            };
            // Store calculation result
            await this.storeGreeksCalculation(greeks);
            // Publish event
            await this.publishGreeksCalculatedEvent(greeks, userId);
            logger_1.logger.info(`Greeks calculated for ${request.securityId}`, {
                tenantId,
                securityId: request.securityId,
                model,
                calculationTime: greeks.calculationTime
            });
            return greeks;
        }
        catch (error) {
            logger_1.logger.error('Error calculating Greeks:', error);
            throw error;
        }
    }
    // Black-Scholes Greeks calculation
    async calculateBlackScholesGreeks(option, S, // Stock price
    sigma, // Volatility
    r, // Risk-free rate
    q, // Dividend yield
    T // Time to expiration
    ) {
        const K = option.strikePrice;
        const isCall = option.derivativeType === DerivativesAnalytics_1.DerivativeType.CALL_OPTION;
        // Calculate d1 and d2
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        // Standard normal CDF and PDF
        const N = this.normalCDF;
        const n = this.normalPDF;
        // Calculate Greeks
        const delta = isCall ?
            Math.exp(-q * T) * N(d1) :
            Math.exp(-q * T) * (N(d1) - 1);
        const gamma = Math.exp(-q * T) * n(d1) / (S * sigma * Math.sqrt(T));
        const theta = isCall ?
            (-S * n(d1) * sigma * Math.exp(-q * T) / (2 * Math.sqrt(T))
                - r * K * Math.exp(-r * T) * N(d2)
                + q * S * Math.exp(-q * T) * N(d1)) / 365 :
            (-S * n(d1) * sigma * Math.exp(-q * T) / (2 * Math.sqrt(T))
                + r * K * Math.exp(-r * T) * N(-d2)
                - q * S * Math.exp(-q * T) * N(-d1)) / 365;
        const vega = S * Math.exp(-q * T) * n(d1) * Math.sqrt(T) / 100;
        const rho = isCall ?
            K * T * Math.exp(-r * T) * N(d2) / 100 :
            -K * T * Math.exp(-r * T) * N(-d2) / 100;
        // Higher-order Greeks
        const lambda = delta * S / this.calculateOptionPrice(option, S, sigma, r, q, T);
        const vanna = -Math.exp(-q * T) * n(d1) * d2 / sigma;
        const charm = isCall ?
            Math.exp(-q * T) * (q * N(d1) - n(d1) * (2 * (r - q) * T - d2 * sigma * Math.sqrt(T)) / (2 * T * sigma * Math.sqrt(T))) :
            Math.exp(-q * T) * (q * N(d1) - N(d1) - n(d1) * (2 * (r - q) * T - d2 * sigma * Math.sqrt(T)) / (2 * T * sigma * Math.sqrt(T)));
        const color = -Math.exp(-q * T) * n(d1) / (2 * S * T * sigma * Math.sqrt(T)) *
            (2 * q * T + 1 + (2 * (r - q) * T - d2 * sigma * Math.sqrt(T)) * d1 / (sigma * Math.sqrt(T)));
        const volga = vega * d1 * d2 / sigma;
        return {
            delta,
            gamma,
            theta,
            vega,
            rho,
            lambda,
            vanna,
            charm,
            color,
            volga
        };
    }
    // Binomial model Greeks calculation
    async calculateBinomialGreeks(option, S, sigma, r, q, T, steps = 100) {
        const dt = T / steps;
        const u = Math.exp(sigma * Math.sqrt(dt));
        const d = 1 / u;
        const p = (Math.exp((r - q) * dt) - d) / (u - d);
        // Build binomial tree
        const priceTree = this.buildBinomialPriceTree(S, u, d, steps);
        const optionTree = this.buildBinomialOptionTree(option, priceTree, r, dt, p, steps);
        // Calculate Greeks using finite differences
        const basePrice = optionTree[0][0];
        // Delta calculation
        const upTree = this.buildBinomialPriceTree(S * 1.01, u, d, steps);
        const upOptionTree = this.buildBinomialOptionTree(option, upTree, r, dt, p, steps);
        const downTree = this.buildBinomialPriceTree(S * 0.99, u, d, steps);
        const downOptionTree = this.buildBinomialOptionTree(option, downTree, r, dt, p, steps);
        const delta = (upOptionTree[0][0] - downOptionTree[0][0]) / (S * 0.02);
        // Gamma calculation
        const gamma = (upOptionTree[0][0] - 2 * basePrice + downOptionTree[0][0]) / Math.pow(S * 0.01, 2);
        // Theta calculation (using smaller time step)
        const smallerT = T - 1 / 365;
        const thetaTree = this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, smallerT, steps);
        const theta = (thetaTree[0][0] - basePrice);
        // Vega calculation
        const vegaUpTree = this.buildBinomialOptionTreeWithVol(option, S, sigma * 1.01, r, q, T, steps);
        const vegaDownTree = this.buildBinomialOptionTreeWithVol(option, S, sigma * 0.99, r, q, T, steps);
        const vega = (vegaUpTree[0][0] - vegaDownTree[0][0]) / (sigma * 0.02);
        // Rho calculation
        const rhoUpTree = this.buildBinomialOptionTreeWithRate(option, S, sigma, r * 1.01, q, T, steps);
        const rhoDownTree = this.buildBinomialOptionTreeWithRate(option, S, sigma, r * 0.99, q, T, steps);
        const rho = (rhoUpTree[0][0] - rhoDownTree[0][0]) / (r * 0.02);
        return {
            delta,
            gamma,
            theta,
            vega,
            rho
        };
    }
    // Monte Carlo Greeks calculation
    async calculateMonteCarloGreeks(option, S, sigma, r, q, T, simulations = 100000) {
        const dt = T / 252; // Daily steps
        const steps = Math.ceil(T * 252);
        let deltaSum = 0, gammaSum = 0, thetaSum = 0, vegaSum = 0, rhoSum = 0;
        // Monte Carlo simulation with pathwise derivatives
        for (let i = 0; i < simulations; i++) {
            const path = this.generateStockPath(S, r, q, sigma, T, steps);
            const finalPrice = path[path.length - 1];
            // Calculate payoff and Greeks using pathwise method
            const payoff = this.calculateOptionPayoff(option, finalPrice);
            const discountedPayoff = payoff * Math.exp(-r * T);
            // Pathwise derivatives
            if (payoff > 0) {
                deltaSum += discountedPayoff * Math.log(finalPrice / S) / (sigma * sigma * T);
                vegaSum += discountedPayoff * (Math.pow(Math.log(finalPrice / S), 2) / (sigma * sigma * sigma * T) - Math.log(finalPrice / S) / sigma);
            }
            // Use finite differences for other Greeks
            const upPayoff = this.calculateOptionPayoff(option, finalPrice * 1.01);
            const downPayoff = this.calculateOptionPayoff(option, finalPrice * 0.99);
            gammaSum += (upPayoff - 2 * payoff + downPayoff) * Math.exp(-r * T);
            thetaSum += discountedPayoff * (-r);
            rhoSum += discountedPayoff * T;
        }
        return {
            delta: deltaSum / simulations,
            gamma: gammaSum / simulations,
            theta: thetaSum / simulations,
            vega: vegaSum / simulations,
            rho: rhoSum / simulations
        };
    }
    // Implied Volatility Calculation
    async calculateImpliedVolatility(request, tenantId, userId) {
        const startTime = Date.now();
        try {
            const instrument = await this.getDerivativeInstrument(request.securityId, tenantId);
            if (!instrument || (instrument.derivativeType !== DerivativesAnalytics_1.DerivativeType.CALL_OPTION &&
                instrument.derivativeType !== DerivativesAnalytics_1.DerivativeType.PUT_OPTION)) {
                throw new Error('Invalid option instrument');
            }
            const option = instrument;
            const marketPrice = request.optionPrice;
            const underlyingPrice = request.underlyingPrice || option.underlyingPrice;
            const timeToExpiration = request.timeToExpiration ||
                this.calculateTimeToExpiration(option.expirationDate, new Date());
            const riskFreeRate = request.riskFreeRate || await this.getRiskFreeRate(option.currency);
            const dividendYield = request.dividendYield || 0;
            // Use Newton-Raphson method to solve for implied volatility
            const impliedVol = await this.solveImpliedVolatility(option, marketPrice, underlyingPrice, riskFreeRate, dividendYield, timeToExpiration);
            // Get historical context
            const historicalVol = await this.getHistoricalVolatility(option.underlyingSymbol, 30);
            const ivHistory = await this.getImpliedVolatilityHistory(request.securityId, 252);
            // Calculate percentile ranking
            const ivRank = this.calculatePercentileRank(impliedVol, ivHistory);
            const ivPercentile = ivRank / 100;
            // Build volatility surface data
            const termStructure = await this.buildVolatilityTermStructure(option.underlyingSymbol, tenantId);
            // Calculate statistical measures
            const ivStdDev = this.calculateStandardDeviation(ivHistory);
            const confidence95Upper = impliedVol + 1.96 * ivStdDev;
            const confidence95Lower = impliedVol - 1.96 * ivStdDev;
            const analysis = {
                id: this.generateId(),
                tenantId,
                securityId: request.securityId,
                analysisDate: new Date(),
                impliedVolatility: impliedVol,
                historicalVolatility: historicalVol,
                ivRank,
                ivPercentile,
                atmIV: await this.getATMImpliedVolatility(option.underlyingSymbol),
                skew: await this.calculateVolatilitySkew(option.underlyingSymbol, option.expirationDate),
                termStructure,
                ivStandardDeviation: ivStdDev,
                confidence95Upper,
                confidence95Lower,
                dataPoints: ivHistory.length,
                calculationMethod: 'Newton-Raphson'
            };
            // Store analysis
            await this.storeImpliedVolatilityAnalysis(analysis, tenantId);
            // Publish event
            await this.publishImpliedVolatilityEvent(analysis, userId);
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error calculating implied volatility:', error);
            throw error;
        }
    }
    // Option Strategy Builder
    async buildOptionStrategy(request, tenantId, userId) {
        try {
            // Validate strategy request
            this.validateStrategyRequest(request);
            // Get underlying price and volatility
            const underlyingPrice = await this.getUnderlyingPrice(request.underlyingSymbol);
            const impliedVol = await this.getImpliedVolatility(request.underlyingSymbol);
            // Build strategy legs
            const legs = await Promise.all(request.legs.map(leg => this.buildStrategyLeg(leg, underlyingPrice, impliedVol, tenantId)));
            // Calculate strategy metrics
            const strategyMetrics = await this.calculateStrategyMetrics(legs, underlyingPrice, impliedVol);
            const strategy = {
                id: this.generateId(),
                tenantId,
                portfolioId: request.portfolioId,
                strategyName: this.generateStrategyName(request.strategyType),
                strategyType: request.strategyType,
                description: this.generateStrategyDescription(request.strategyType),
                legs,
                maxProfit: strategyMetrics.maxProfit,
                maxLoss: strategyMetrics.maxLoss,
                breakeven: strategyMetrics.breakeven,
                probabilityOfProfit: strategyMetrics.probabilityOfProfit,
                netDelta: strategyMetrics.netDelta,
                netGamma: strategyMetrics.netGamma,
                netTheta: strategyMetrics.netTheta,
                netVega: strategyMetrics.netVega,
                netRho: strategyMetrics.netRho,
                netPremium: strategyMetrics.netPremium,
                marginRequirement: strategyMetrics.marginRequirement,
                buyingPower: strategyMetrics.buyingPower,
                riskRewardRatio: strategyMetrics.riskRewardRatio,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Store strategy
            await this.storeOptionStrategy(strategy);
            // Publish event
            await this.publishStrategyCreatedEvent(strategy, userId);
            return strategy;
        }
        catch (error) {
            logger_1.logger.error('Error building option strategy:', error);
            throw error;
        }
    }
    // Margin Calculation
    async calculateMargin(request, tenantId, userId) {
        try {
            const calculationDate = request.calculationDate || new Date();
            // Calculate position-level margins
            const positionMargins = await Promise.all(request.positions.map(position => this.calculatePositionMargin(position, request.underlyingPrices, request.volatilities)));
            // Calculate portfolio-level margin using SPAN methodology
            const portfolioMargin = await this.calculateSPANMargin(request.positions, request.underlyingPrices, request.volatilities, request.scenarioShifts);
            // Calculate risk metrics
            const netLiquidationValue = await this.calculateNetLiquidationValue(request.positions, request.underlyingPrices);
            const portfolioRisk = await this.calculatePortfolioRisk(request.positions, request.volatilities);
            const result = {
                id: this.generateId(),
                requestId: this.generateId(),
                tenantId,
                calculationDate,
                initialMargin: portfolioMargin.initialMargin || 0,
                maintenanceMargin: portfolioMargin.maintenanceMargin || 0,
                variationMargin: portfolioMargin.variationMargin || 0,
                positionMargins,
                portfolioMargin: portfolioMargin.totalMargin || 0,
                netLiquidationValue,
                excessLiquidity: netLiquidationValue - (portfolioMargin.totalMargin || 0),
                portfolioRisk,
                concentrationRisk: await this.calculateConcentrationRisk(request.positions),
                liquidityRisk: await this.calculateLiquidityRisk(request.positions),
                spanMargin: portfolioMargin.spanMargin || 0,
                calculationMethod: 'SPAN',
                warnings: portfolioMargin.warnings || []
            };
            // Store margin calculation
            await this.storeMarginCalculation(result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error calculating margin:', error);
            throw error;
        }
    }
    // Mark-to-Market Valuation
    async calculateMarkToMarket(securityId, tenantId, userId) {
        try {
            const instrument = await this.getDerivativeInstrument(securityId, tenantId);
            if (!instrument) {
                throw new Error('Instrument not found');
            }
            const underlyingPrice = await this.getUnderlyingPrice(instrument.underlyingSymbol);
            const volatility = await this.getImpliedVolatility(instrument.underlyingSymbol);
            const riskFreeRate = await this.getRiskFreeRate(instrument.currency);
            // Calculate theoretical price
            const theoreticalPrice = await this.calculateTheoreticalPrice(instrument, underlyingPrice, volatility, riskFreeRate);
            // Get market price
            const marketPrice = instrument.currentPrice;
            // Calculate Greeks for P&L attribution
            const greeks = await this.calculateGreeks({
                securityId,
                underlyingPrice,
                volatility,
                riskFreeRate
            }, tenantId, userId);
            // Get previous day's valuation for P&L calculation
            const previousValuation = await this.getPreviousMarkToMarket(securityId, tenantId);
            const valuation = {
                id: this.generateId(),
                tenantId,
                securityId,
                valuationDate: new Date(),
                marketPrice,
                theoreticalPrice,
                intrinsicValue: this.calculateIntrinsicValue(instrument, underlyingPrice),
                timeValue: theoreticalPrice - this.calculateIntrinsicValue(instrument, underlyingPrice),
                unrealizedPnL: marketPrice - instrument.costBasis || 0,
                dailyPnL: previousValuation ? marketPrice - previousValuation.marketPrice : 0,
                inceptionPnL: marketPrice - instrument.entryPrice || 0,
                // Greeks P&L attribution
                deltaPnL: this.calculateDeltaPnL(greeks, previousValuation),
                gammaPnL: this.calculateGammaPnL(greeks, previousValuation),
                thetaPnL: this.calculateThetaPnL(greeks, previousValuation),
                vegaPnL: this.calculateVegaPnL(greeks, previousValuation),
                rhoPnL: this.calculateRhoPnL(greeks, previousValuation),
                residualPnL: 0, // Calculated as difference from total P&L
                underlyingPrice,
                volatility,
                riskFreeRate,
                timeToExpiration: this.calculateTimeToExpiration(instrument.expirationDate, new Date()),
                pricingModel: DerivativesAnalytics_1.VolatilityModel.BLACK_SCHOLES,
                confidence: 0.95,
                dataSource: 'MARKET_DATA_SERVICE',
                calculationTime: Date.now() - Date.now(),
                warnings: []
            };
            // Store valuation
            await this.storeMarkToMarketValuation(valuation);
            return valuation;
        }
        catch (error) {
            logger_1.logger.error('Error calculating mark-to-market valuation:', error);
            throw error;
        }
    }
    // Portfolio Analytics
    async calculatePortfolioAnalytics(portfolioId, tenantId, userId) {
        try {
            // Get all derivative positions in portfolio
            const positions = await this.getPortfolioDerivativePositions(portfolioId, tenantId);
            if (positions.length === 0) {
                throw new Error('No derivative positions found in portfolio');
            }
            // Calculate aggregate metrics
            const totalNotional = positions.reduce((sum, pos) => sum + pos.notional, 0);
            const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
            // Calculate portfolio Greeks
            const portfolioGreeks = await this.calculatePortfolioGreeks(positions);
            // Calculate risk metrics
            const portfolioVaR = await this.calculatePortfolioVaR(positions);
            const maxDrawdown = await this.calculateMaxDrawdown(portfolioId, tenantId);
            const sharpeRatio = await this.calculateSharpeRatio(portfolioId, tenantId);
            // Analyze active strategies
            const activeStrategies = await this.getActiveStrategies(portfolioId, tenantId);
            const strategyBreakdown = this.analyzeStrategyBreakdown(activeStrategies);
            // Calculate margin utilization
            const marginAnalysis = await this.calculateMarginUtilization(portfolioId, tenantId);
            // Analyze expirations
            const expirationBuckets = this.analyzeExpirations(positions);
            // Calculate performance
            const performance = await this.calculatePortfolioPerformance(portfolioId, tenantId);
            const analytics = {
                id: this.generateId(),
                tenantId,
                portfolioId,
                analysisDate: new Date(),
                totalPositions: positions.length,
                totalNotional,
                totalMarketValue,
                optionsAllocation: this.calculateOptionsAllocation(positions),
                futuresAllocation: this.calculateFuturesAllocation(positions),
                otherDerivativesAllocation: this.calculateOtherDerivativesAllocation(positions),
                portfolioDelta: portfolioGreeks.delta,
                portfolioGamma: portfolioGreeks.gamma,
                portfolioTheta: portfolioGreeks.theta,
                portfolioVega: portfolioGreeks.vega,
                portfolioRho: portfolioGreeks.rho,
                portfolioVaR,
                maxDrawdown,
                sharpeRatio,
                activeStrategies: activeStrategies.length,
                strategyBreakdown,
                totalMarginUsed: marginAnalysis.totalMarginUsed,
                availableMargin: marginAnalysis.availableMargin,
                marginUtilization: marginAnalysis.utilizationPercentage,
                nearTermExpirations: expirationBuckets.filter((bucket) => bucket.daysToExpiration <= 30),
                totalReturn: performance.totalReturn,
                dailyPnL: performance.dailyPnL,
                monthlyPnL: performance.monthlyPnL,
                yearToDatePnL: performance.yearToDatePnL,
                lastUpdated: new Date(),
                dataQuality: this.assessDataQuality(positions),
                warnings: this.generatePortfolioWarnings(positions, expirationBuckets)
            };
            // Store analytics
            await this.storePortfolioAnalytics(analytics);
            // Publish event
            await this.publishPortfolioAnalyticsEvent(analytics, userId);
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Error calculating portfolio analytics:', error);
            throw error;
        }
    }
    // Search Derivatives
    async searchDerivatives(request, tenantId) {
        try {
            // Build search query
            const searchQuery = this.buildDerivativesSearchQuery(request, tenantId);
            // Execute search
            const instruments = await this.prisma.security.findMany(searchQuery);
            // Get total count
            const total = await this.prisma.security.count({
                where: searchQuery.where
            });
            // Calculate aggregate metrics
            const aggregateMetrics = await this.calculateSearchAggregateMetrics(instruments);
            return {
                instruments: instruments,
                total,
                aggregateMetrics,
                pagination: {
                    limit: request.limit || 50,
                    offset: request.offset || 0,
                    hasMore: (request.offset || 0) + instruments.length < total
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching derivatives:', error);
            throw error;
        }
    }
    // Helper methods for calculations
    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }
    normalPDF(x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }
    erf(x) {
        // Abramowitz and Stegun approximation
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }
    calculateTimeToExpiration(expirationDate, currentDate) {
        const diffTime = expirationDate.getTime() - currentDate.getTime();
        return diffTime / (1000 * 60 * 60 * 24 * 365.25); // Convert to years
    }
    calculateOptionPrice(option, S, sigma, r, q, T) {
        const K = option.strikePrice;
        const isCall = option.derivativeType === DerivativesAnalytics_1.DerivativeType.CALL_OPTION;
        const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        const N = this.normalCDF;
        if (isCall) {
            return S * Math.exp(-q * T) * N(d1) - K * Math.exp(-r * T) * N(d2);
        }
        else {
            return K * Math.exp(-r * T) * N(-d2) - S * Math.exp(-q * T) * N(-d1);
        }
    }
    generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    // Database and external service methods (placeholder implementations)
    async getDerivativeInstrument(securityId, tenantId) {
        // Implementation would fetch from database
        return null;
    }
    async storeGreeksCalculation(greeks) {
        // Implementation would store in database
    }
    async publishGreeksCalculatedEvent(greeks, userId) {
        await this.kafkaService.publishEvent('derivatives.greeks.calculated', {
            ...greeks,
            userId,
            timestamp: new Date().toISOString()
        });
    }
    async publishImpliedVolatilityEvent(analysis, userId) {
        await this.kafkaService.publishEvent('derivatives.implied_volatility.calculated', {
            ...analysis,
            userId,
            timestamp: new Date().toISOString()
        });
    }
    async publishStrategyCreatedEvent(strategy, userId) {
        await this.kafkaService.publishEvent('derivatives.strategy.created', {
            ...strategy,
            userId,
            timestamp: new Date().toISOString()
        });
    }
    buildBinomialPriceTree(S, u, d, steps) {
        const tree = [];
        for (let i = 0; i <= steps; i++) {
            tree[i] = [];
            for (let j = 0; j <= i; j++) {
                tree[i][j] = S * Math.pow(u, i - j) * Math.pow(d, j);
            }
        }
        return tree;
    }
    buildBinomialOptionTree(option, priceTree, r, dt, p, steps) {
        const tree = [];
        const strike = option.strikePrice;
        const isCall = option.derivativeType === DerivativesAnalytics_1.DerivativeType.CALL_OPTION;
        // Initialize final nodes
        tree[steps] = [];
        for (let j = 0; j <= steps; j++) {
            const S = priceTree[steps][j];
            tree[steps][j] = Math.max(0, isCall ? S - strike : strike - S);
        }
        // Work backwards
        for (let i = steps - 1; i >= 0; i--) {
            tree[i] = [];
            for (let j = 0; j <= i; j++) {
                const continuationValue = Math.exp(-r * dt) * (p * tree[i + 1][j] + (1 - p) * tree[i + 1][j + 1]);
                const S = priceTree[i][j];
                const intrinsicValue = Math.max(0, isCall ? S - strike : strike - S);
                tree[i][j] = option.optionStyle === DerivativesAnalytics_1.OptionStyle.AMERICAN
                    ? Math.max(continuationValue, intrinsicValue)
                    : continuationValue;
            }
        }
        return tree;
    }
    buildBinomialOptionTreeWithTime(option, S, sigma, r, q, T, steps) {
        const dt = T / steps;
        const u = Math.exp(sigma * Math.sqrt(dt));
        const d = 1 / u;
        const p = (Math.exp((r - q) * dt) - d) / (u - d);
        const priceTree = this.buildBinomialPriceTree(S, u, d, steps);
        return this.buildBinomialOptionTree(option, priceTree, r, dt, p, steps);
    }
    generateStockPath(S, r, q, sigma, T, steps) {
        const dt = T / steps;
        const path = [S];
        for (let i = 1; i <= steps; i++) {
            const z = this.generateNormalRandom();
            const drift = (r - q - 0.5 * sigma * sigma) * dt;
            const diffusion = sigma * Math.sqrt(dt) * z;
            path[i] = path[i - 1] * Math.exp(drift + diffusion);
        }
        return path;
    }
    generateNormalRandom() {
        // Box-Muller transform for normal distribution
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random();
        while (v === 0)
            v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    async buildVolatilityTermStructure(symbol, tenantId) {
        // Stub implementation - would fetch from market data
        return {
            curve: [],
            atmVol: 0.25,
            skew: 0.0,
            model: DerivativesAnalytics_1.VolatilityModel.BLACK_SCHOLES
        };
    }
    async buildStrategyLeg(leg, underlyingPrice, impliedVol, tenantId) {
        // Build strategy leg with proper structure
        return {
            id: this.generateId(),
            securityId: leg.securityId || this.generateId(),
            side: leg.side || 'BUY',
            quantity: leg.quantity || 1,
            strikePrice: leg.strikePrice,
            expirationDate: leg.expirationDate,
            optionType: leg.optionType,
            entryPrice: leg.entryPrice || underlyingPrice * 0.05,
            currentPrice: leg.entryPrice || underlyingPrice * 0.05,
            premium: leg.entryPrice || underlyingPrice * 0.05,
            deltaContribution: 0.5 * leg.quantity,
            gammaContribution: 0.01 * leg.quantity,
            thetaContribution: -0.02 * leg.quantity,
            vegaContribution: 0.1 * leg.quantity,
            rhoContribution: 0.03 * leg.quantity
        };
    }
    buildDerivativesSearchQuery(request, tenantId) {
        // Stub implementation for search query building
        return {
            where: {
                tenantId
            }
        };
    }
    async getMarketPrice(securityId, tenantId) {
        // Stub implementation - would fetch from market data service
        return 100; // Default price
    }
    async getImpliedVolatility(securityId, tenantId) {
        // Stub implementation - would calculate or fetch implied volatility
        return 0.25; // Default 25% volatility
    }
    async getRiskFreeRate(currency) {
        // Stub implementation - would fetch risk-free rate
        return 0.05; // Default 5% rate
    }
    async getDividendYield(underlyingId, tenantId) {
        // Stub implementation - would fetch dividend yield
        return 0.02; // Default 2% yield
    }
    calculateExercisePayoff(option, underlyingPrice) {
        if (option.derivativeType === DerivativesAnalytics_1.DerivativeType.CALL_OPTION) {
            return Math.max(underlyingPrice - option.strikePrice, 0) * option.contractSize;
        }
        else {
            return Math.max(option.strikePrice - underlyingPrice, 0) * option.contractSize;
        }
    }
    async recordExerciseEvent(event) {
        // Stub implementation - would record to database
        await this.kafkaService.publishEvent('portfolio.derivatives.exercise', event);
    }
    async recordAssignmentEvent(event) {
        // Stub implementation - would record to database
        await this.kafkaService.publishEvent('portfolio.derivatives.assignment', event);
    }
    buildBinomialOptionTreeWithVol(option, S, sigma, r, q, T, steps) {
        return this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, T, steps);
    }
    buildBinomialOptionTreeWithRate(option, S, sigma, r, q, T, steps) {
        return this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, T, steps);
    }
    // Additional helper methods
    calculateTimeToExpiry(expirationDate) {
        const now = new Date();
        const timeInMs = expirationDate.getTime() - now.getTime();
        return Math.max(timeInMs / (365 * 24 * 60 * 60 * 1000), 0);
    }
    calculateVolatilitySmile(strikes, atmVol, skew) {
        // Simple volatility smile calculation
        return strikes.map(strike => atmVol * (1 + skew * Math.log(strike / 100) / 100));
    }
    calculateOptionPayoff(option, finalPrice) {
        if (option.derivativeType === DerivativesAnalytics_1.DerivativeType.CALL_OPTION) {
            return Math.max(finalPrice - option.strikePrice, 0);
        }
        else {
            return Math.max(option.strikePrice - finalPrice, 0);
        }
    }
    async solveImpliedVolatility(option, marketPrice, S, r, q, T) {
        // Newton-Raphson method for implied volatility
        let sigma = 0.3; // Initial guess
        const tolerance = 0.0001;
        const maxIterations = 100;
        for (let i = 0; i < maxIterations; i++) {
            const price = await this.calculateBinomialOptionPrice(option, S, sigma, r, q, T, 100);
            const vega = (await this.calculateBinomialOptionPrice(option, S, sigma + 0.01, r, q, T, 100) - price) / 0.01;
            const diff = price - marketPrice;
            if (Math.abs(diff) < tolerance) {
                return sigma;
            }
            sigma = sigma - diff / vega;
            sigma = Math.max(0.001, Math.min(3, sigma)); // Keep within reasonable bounds
        }
        return sigma;
    }
    async getHistoricalVolatility(securityId, days = 30) {
        // Stub - would calculate from historical prices
        return 0.25;
    }
    async getImpliedVolatilityHistory(securityId, days = 30) {
        // Stub - would fetch historical implied volatilities
        return Array(days).fill(0.25);
    }
    calculatePercentileRank(value, array) {
        const sorted = array.sort((a, b) => a - b);
        let count = 0;
        for (const v of sorted) {
            if (v <= value)
                count++;
            else
                break;
        }
        return (count / array.length) * 100;
    }
    calculateStandardDeviation(array) {
        const mean = array.reduce((a, b) => a + b, 0) / array.length;
        const squaredDiffs = array.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / array.length;
        return Math.sqrt(variance);
    }
    async getATMImpliedVolatility(underlyingSymbol) {
        // Stub - would find ATM option and get its IV
        return 0.25;
    }
    async calculateVolatilitySkew(underlyingSymbol, expirationDate) {
        // Stub - would calculate skew from volatility smile
        return 0.1;
    }
    async storeImpliedVolatilityAnalysis(analysis, tenantId) {
        // Stub - would store to database
        await this.kafkaService.publishEvent('portfolio.derivatives.iv', { analysis, tenantId });
    }
    validateStrategyRequest(request) {
        if (!request.legs || request.legs.length === 0) {
            throw new Error('Strategy must have at least one leg');
        }
    }
    async getUnderlyingPrice(underlyingId, tenantId) {
        // Stub - would fetch from market data service
        return 100;
    }
    async calculateStrategyMetrics(legs, underlyingPrice, impliedVolatility) {
        // Stub implementation
        return {
            totalDelta: 0,
            totalGamma: 0,
            totalTheta: 0,
            totalVega: 0,
            totalRho: 0,
            maxProfit: 0,
            maxLoss: 0,
            breakevens: []
        };
    }
    // Missing helper methods
    async calculatePositionMargin(position, underlyingPrices, volatilities) {
        const underlyingPrice = underlyingPrices[position.securityId] || position.price;
        const volatility = volatilities[position.securityId] || 0.25;
        // Simple margin calculation - in real implementation would use more sophisticated models
        const notionalValue = Math.abs(position.quantity * underlyingPrice);
        const volatilityAdjustment = 1 + volatility;
        const initialMargin = notionalValue * 0.15 * volatilityAdjustment;
        const maintenanceMargin = notionalValue * 0.10 * volatilityAdjustment;
        const riskContribution = notionalValue * volatility;
        return {
            securityId: position.securityId,
            initialMargin,
            maintenanceMargin,
            riskContribution,
            hedgeCredit: position.side === 'SHORT' ? initialMargin * 0.1 : undefined
        };
    }
    async calculateSPANMargin(positions, underlyingPrices, volatilities, scenarioShifts) {
        // Simplified SPAN margin calculation
        let maxLoss = 0;
        const scenarios = scenarioShifts || [
            { name: 'base', underlyingShift: 0, volatilityShift: 0, timeDecay: 0 },
            { name: 'up15', underlyingShift: 0.15, volatilityShift: 0.05, timeDecay: 1 },
            { name: 'down15', underlyingShift: -0.15, volatilityShift: 0.05, timeDecay: 1 }
        ];
        for (const scenario of scenarios) {
            let scenarioLoss = 0;
            for (const position of positions) {
                const price = underlyingPrices[position.securityId] || position.price;
                const shiftedPrice = price * (1 + scenario.underlyingShift);
                const positionValue = position.quantity * (position.side === 'LONG' ? 1 : -1);
                const pnl = positionValue * (shiftedPrice - price);
                scenarioLoss = Math.min(scenarioLoss, pnl);
            }
            maxLoss = Math.max(maxLoss, Math.abs(scenarioLoss));
        }
        return maxLoss;
    }
    generateStrategyName(strategyType) {
        const names = {
            [DerivativesAnalytics_1.StrategyType.SINGLE_OPTION]: 'Single Option',
            [DerivativesAnalytics_1.StrategyType.COVERED_CALL]: 'Covered Call',
            [DerivativesAnalytics_1.StrategyType.PROTECTIVE_PUT]: 'Protective Put',
            [DerivativesAnalytics_1.StrategyType.STRADDLE]: 'Straddle',
            [DerivativesAnalytics_1.StrategyType.STRANGLE]: 'Strangle',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BULL_CALL]: 'Bull Call Spread',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BULL_PUT]: 'Bull Put Spread',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BEAR_CALL]: 'Bear Call Spread',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BEAR_PUT]: 'Bear Put Spread',
            [DerivativesAnalytics_1.StrategyType.IRON_CONDOR]: 'Iron Condor',
            [DerivativesAnalytics_1.StrategyType.IRON_BUTTERFLY]: 'Iron Butterfly',
            [DerivativesAnalytics_1.StrategyType.COLLAR]: 'Collar',
            [DerivativesAnalytics_1.StrategyType.CUSTOM]: 'Custom Strategy'
        };
        return names[strategyType] || 'Unknown Strategy';
    }
    generateStrategyDescription(strategyType) {
        const descriptions = {
            [DerivativesAnalytics_1.StrategyType.COVERED_CALL]: 'Selling call options against long stock position',
            [DerivativesAnalytics_1.StrategyType.PROTECTIVE_PUT]: 'Buying put options to protect long stock position',
            [DerivativesAnalytics_1.StrategyType.STRADDLE]: 'Simultaneous purchase of call and put at same strike',
            [DerivativesAnalytics_1.StrategyType.STRANGLE]: 'Simultaneous purchase of call and put at different strikes',
            [DerivativesAnalytics_1.StrategyType.IRON_CONDOR]: 'Combination of bull put spread and bear call spread',
            [DerivativesAnalytics_1.StrategyType.IRON_BUTTERFLY]: 'Combination of bull put spread and bear call spread at same short strike',
            [DerivativesAnalytics_1.StrategyType.COLLAR]: 'Long stock with protective put and covered call',
            [DerivativesAnalytics_1.StrategyType.SINGLE_OPTION]: 'Single option position',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BULL_CALL]: 'Buy lower strike call, sell higher strike call',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BULL_PUT]: 'Buy lower strike put, sell higher strike put',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BEAR_CALL]: 'Buy higher strike call, sell lower strike call',
            [DerivativesAnalytics_1.StrategyType.SPREAD_BEAR_PUT]: 'Buy higher strike put, sell lower strike put',
            [DerivativesAnalytics_1.StrategyType.CUSTOM]: 'Custom multi-leg options strategy'
        };
        return descriptions[strategyType] || 'Custom options strategy';
    }
    async storeOptionStrategy(strategy) {
        // Store in database - stub implementation
        logger_1.logger.info('Storing option strategy', { strategyId: strategy.id });
    }
    // Missing method implementations for margin and portfolio calculations
    async calculateNetLiquidationValue(positions, underlyingPrices) {
        let totalValue = 0;
        for (const position of positions) {
            const price = underlyingPrices.get(position.underlyingSymbol || '') || 0;
            totalValue += position.quantity * price * (position.contractSize || 1);
        }
        return totalValue;
    }
    async calculatePortfolioRisk(positions, volatilities) {
        // Simple portfolio risk calculation
        let totalRisk = 0;
        for (const position of positions) {
            const vol = volatilities.get(position.underlyingSymbol || '') || 0.2;
            totalRisk += Math.abs(position.quantity) * (position.contractSize || 1) * vol;
        }
        return totalRisk;
    }
    async calculateConcentrationRisk(positions) {
        // Calculate concentration risk based on position sizing
        if (positions.length === 0)
            return 0;
        const totalNotional = positions.reduce((sum, p) => sum + Math.abs(p.quantity * (p.contractSize || 1)), 0);
        const maxPosition = Math.max(...positions.map(p => Math.abs(p.quantity * (p.contractSize || 1))));
        return maxPosition / totalNotional;
    }
    async calculateLiquidityRisk(positions) {
        // Simple liquidity risk score (0-1)
        const avgVolume = positions.reduce((sum, p) => sum + (p.averageDailyVolume || 1000), 0) / positions.length;
        const totalSize = positions.reduce((sum, p) => sum + Math.abs(p.quantity), 0);
        return Math.min(totalSize / avgVolume, 1);
    }
    async storeMarginCalculation(result) {
        logger_1.logger.info('Storing margin calculation', { requestId: result.requestId });
    }
    async calculateTheoreticalPrice(instrument, underlyingPrice, volatility, riskFreeRate) {
        // Use Black-Scholes for options
        if (instrument.derivativeType === DerivativesAnalytics_1.DerivativeType.CALL_OPTION || instrument.derivativeType === DerivativesAnalytics_1.DerivativeType.PUT_OPTION) {
            const option = instrument;
            const timeToExpiry = this.calculateTimeToExpiration(option.expirationDate, new Date());
            return this.calculateOptionPrice(option, underlyingPrice, volatility, riskFreeRate, 0, timeToExpiry);
        }
        return instrument.currentPrice || 0;
    }
    async getPreviousMarkToMarket(securityId, tenantId) {
        // Get previous valuation from database - stub implementation
        return null;
    }
    calculateIntrinsicValue(option, underlyingPrice) {
        if (option.derivativeType === DerivativesAnalytics_1.DerivativeType.CALL_OPTION) {
            return Math.max(underlyingPrice - option.strikePrice, 0);
        }
        else if (option.derivativeType === DerivativesAnalytics_1.DerivativeType.PUT_OPTION) {
            return Math.max(option.strikePrice - underlyingPrice, 0);
        }
        return 0;
    }
    calculateDeltaPnL(greeks, previousValuation) {
        if (!previousValuation)
            return 0;
        return greeks.delta * (greeks.underlyingPrice - previousValuation.underlyingPrice);
    }
    calculateGammaPnL(greeks, previousValuation) {
        if (!previousValuation)
            return 0;
        const priceDiff = greeks.underlyingPrice - previousValuation.underlyingPrice;
        return 0.5 * greeks.gamma * priceDiff * priceDiff;
    }
    calculateThetaPnL(greeks, previousValuation) {
        if (!previousValuation)
            return 0;
        return greeks.theta / 365; // Daily theta decay
    }
    calculateVegaPnL(greeks, previousValuation) {
        if (!previousValuation)
            return 0;
        return greeks.vega * (greeks.impliedVolatility || greeks.volatility - previousValuation.volatility);
    }
    calculateRhoPnL(greeks, previousValuation) {
        if (!previousValuation)
            return 0;
        return greeks.rho * (greeks.riskFreeRate - previousValuation.riskFreeRate);
    }
    async storeMarkToMarketValuation(valuation) {
        logger_1.logger.info('Storing mark-to-market valuation', { valuationId: valuation.id });
    }
    // Portfolio analytics helper methods
    async getPortfolioDerivativePositions(portfolioId, tenantId) {
        // Get derivative positions from database - stub implementation
        return [];
    }
    async calculatePortfolioGreeks(positions) {
        return {
            delta: positions.reduce((sum, p) => sum + (p.delta || 0), 0),
            gamma: positions.reduce((sum, p) => sum + (p.gamma || 0), 0),
            theta: positions.reduce((sum, p) => sum + (p.theta || 0), 0),
            vega: positions.reduce((sum, p) => sum + (p.vega || 0), 0),
            rho: positions.reduce((sum, p) => sum + (p.rho || 0), 0)
        };
    }
    async calculatePortfolioVaR(positions) {
        // Simple VaR calculation - stub implementation
        const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
        return totalValue * 0.05; // 5% VaR
    }
    async calculateMaxDrawdown(portfolioId, tenantId) {
        // Calculate max drawdown - stub implementation
        return 0.15; // 15% max drawdown
    }
    async calculateSharpeRatio(portfolioId, tenantId) {
        // Calculate Sharpe ratio - stub implementation
        return 1.5;
    }
    async getActiveStrategies(portfolioId, tenantId) {
        // Get active strategies - stub implementation
        return [];
    }
    analyzeStrategyBreakdown(strategies) {
        const breakdown = [];
        const types = ['COVERED_CALL', 'PROTECTIVE_PUT', 'SPREAD', 'STRADDLE', 'STRANGLE'];
        types.forEach(type => {
            const strategyGroup = strategies.filter((s) => s.type === type);
            if (strategyGroup.length > 0) {
                breakdown.push({
                    strategyType: type,
                    count: strategyGroup.length,
                    totalNotional: strategyGroup.reduce((sum, s) => sum + (s.notional || 0), 0),
                    totalMargin: strategyGroup.reduce((sum, s) => sum + (s.margin || 0), 0),
                    netPnL: strategyGroup.reduce((sum, s) => sum + (s.pnl || 0), 0)
                });
            }
        });
        return breakdown;
    }
    async calculateMarginUtilization(portfolioId, tenantId) {
        return {
            totalMarginUsed: 50000,
            availableMargin: 150000,
            utilizationPercentage: 0.25
        };
    }
    analyzeExpirations(positions) {
        // Group positions by expiration buckets
        const buckets = [];
        const now = new Date();
        [7, 14, 30, 60, 90, 180, 365].forEach(days => {
            const count = positions.filter((p) => {
                if (!p.expirationDate)
                    return false;
                const daysToExpiry = Math.ceil((new Date(p.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return daysToExpiry <= days && daysToExpiry > (days === 7 ? 0 : [7, 14, 30, 60, 90, 180][Math.max(0, [7, 14, 30, 60, 90, 180].indexOf(days) - 1)]);
            }).length;
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + days);
            buckets.push({
                expirationDate: expDate,
                daysToExpiration: days,
                positionCount: count,
                totalNotional: count * 10000,
                totalGamma: count * 0.01,
                totalTheta: count * -10,
                rollRisk: count * 0.05
            });
        });
        return buckets;
    }
    async calculatePortfolioPerformance(portfolioId, tenantId) {
        return {
            totalReturn: 0.12,
            dailyPnL: 1500,
            monthlyPnL: 45000,
            yearToDatePnL: 250000
        };
    }
    calculateOptionsAllocation(positions) {
        const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
        const optionsValue = positions
            .filter((p) => p.instrumentType === 'OPTION')
            .reduce((sum, p) => sum + (p.marketValue || 0), 0);
        return totalValue > 0 ? optionsValue / totalValue : 0;
    }
    calculateFuturesAllocation(positions) {
        const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
        const futuresValue = positions
            .filter((p) => p.instrumentType === 'FUTURE')
            .reduce((sum, p) => sum + (p.marketValue || 0), 0);
        return totalValue > 0 ? futuresValue / totalValue : 0;
    }
    calculateOtherDerivativesAllocation(positions) {
        const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
        const otherValue = positions
            .filter((p) => !['OPTION', 'FUTURE'].includes(p.instrumentType))
            .reduce((sum, p) => sum + (p.marketValue || 0), 0);
        return totalValue > 0 ? otherValue / totalValue : 0;
    }
    assessDataQuality(positions) {
        // Assess data quality score (0-1)
        const withPrices = positions.filter((p) => p.marketPrice && p.marketPrice > 0).length;
        return positions.length > 0 ? withPrices / positions.length : 0;
    }
    generatePortfolioWarnings(positions, expirationBuckets) {
        const warnings = [];
        // Check for near-term expirations
        const nearTermCount = expirationBuckets.find(b => b.daysToExpiration === 7)?.positionCount || 0;
        if (nearTermCount > 0) {
            warnings.push(`${nearTermCount} positions expiring within 7 days`);
        }
        // Check for concentration
        if (positions.length > 0 && positions.length < 5) {
            warnings.push('Portfolio may be under-diversified');
        }
        return warnings;
    }
    async storePortfolioAnalytics(analytics) {
        logger_1.logger.info('Storing portfolio analytics', { portfolioId: analytics.portfolioId });
    }
    async publishPortfolioAnalyticsEvent(analytics, userId) {
        await this.kafkaService.publishEvent('portfolio.analytics.calculated', {
            analytics,
            userId,
            timestamp: new Date()
        });
    }
    async calculateSearchAggregateMetrics(instruments) {
        return {
            totalCount: instruments.length,
            avgPrice: instruments.reduce((sum, i) => sum + (i.price || 0), 0) / instruments.length,
            totalVolume: instruments.reduce((sum, i) => sum + (i.volume || 0), 0)
        };
    }
    async calculateBinomialOptionPrice(option, S, sigma, r, q, T, steps) {
        const tree = this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, T, steps);
        return tree[0][0];
    }
}
exports.DerivativesAnalyticsService = DerivativesAnalyticsService;

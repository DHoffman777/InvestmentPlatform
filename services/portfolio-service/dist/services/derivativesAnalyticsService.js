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
            const instrument = await this.getDerivativeInstrument(request.instrumentId, tenantId);
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
                instrumentId: request.instrumentId,
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
            logger_1.logger.info(`Greeks calculated for ${request.instrumentId}`, {
                tenantId,
                instrumentId: request.instrumentId,
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
        const isCall = option.optionType === 'CALL';
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
            const instrument = await this.getDerivativeInstrument(request.instrumentId, tenantId);
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
            const ivHistory = await this.getImpliedVolatilityHistory(request.instrumentId, 252);
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
                instrumentId: request.instrumentId,
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
            await this.storeImpliedVolatilityAnalysis(analysis);
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
            const strategyMetrics = await this.calculateStrategyMetrics(legs, underlyingPrice);
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
            const netLiquidationValue = this.calculateNetLiquidationValue(request.positions, request.underlyingPrices);
            const portfolioRisk = this.calculatePortfolioRisk(request.positions, request.volatilities);
            const result = {
                id: this.generateId(),
                requestId: this.generateId(),
                tenantId,
                calculationDate,
                initialMargin: portfolioMargin.initialMargin,
                maintenanceMargin: portfolioMargin.maintenanceMargin,
                variationMargin: portfolioMargin.variationMargin,
                positionMargins,
                portfolioMargin: portfolioMargin.totalMargin,
                netLiquidationValue,
                excessLiquidity: netLiquidationValue - portfolioMargin.totalMargin,
                portfolioRisk,
                concentrationRisk: this.calculateConcentrationRisk(request.positions),
                liquidityRisk: this.calculateLiquidityRisk(request.positions),
                spanMargin: portfolioMargin.spanMargin,
                calculationMethod: 'SPAN',
                warnings: portfolioMargin.warnings
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
    async calculateMarkToMarket(instrumentId, tenantId, userId) {
        try {
            const instrument = await this.getDerivativeInstrument(instrumentId, tenantId);
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
                instrumentId,
                underlyingPrice,
                volatility,
                riskFreeRate
            }, tenantId, userId);
            // Get previous day's valuation for P&L calculation
            const previousValuation = await this.getPreviousMarkToMarket(instrumentId, tenantId);
            const valuation = {
                id: this.generateId(),
                tenantId,
                instrumentId,
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
                nearTermExpirations: expirationBuckets.filter(bucket => bucket.daysToExpiration <= 30),
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
            const instruments = await this.prisma.derivativeInstrument.findMany(searchQuery);
            // Get total count
            const total = await this.prisma.derivativeInstrument.count({
                where: searchQuery.where
            });
            // Calculate aggregate metrics
            const aggregateMetrics = this.calculateSearchAggregateMetrics(instruments);
            return {
                instruments,
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
        const isCall = option.optionType === 'CALL';
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
    async getDerivativeInstrument(instrumentId, tenantId) {
        // Implementation would fetch from database
        return null;
    }
    async getRiskFreeRate(currency) {
        // Implementation would fetch current risk-free rate
        return 0.05; // 5% placeholder
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
    async publishPortfolioAnalyticsEvent(analytics, userId) {
        await this.kafkaService.publishEvent('derivatives.portfolio_analytics.calculated', {
            ...analytics,
            userId,
            timestamp: new Date().toISOString()
        });
    }
}
exports.DerivativesAnalyticsService = DerivativesAnalyticsService;

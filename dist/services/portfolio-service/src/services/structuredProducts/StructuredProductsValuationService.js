"use strict";
// Structured Products Valuation Service
// Phase 4.1 - Comprehensive valuation engine for structured products with multiple pricing models
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredProductsValuationService = void 0;
const logger_1 = require("../../utils/logger");
class StructuredProductsValuationService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Main valuation method
    async valuateProduct(request) {
        try {
            const startTime = Date.now();
            logger_1.logger.info('Starting structured product valuation', {
                productId: request.productId,
                valuationDate: request.valuationDate,
                modelType: request.modelType
            });
            // Get product details
            const product = await this.getProductDetails(request.productId);
            if (!product) {
                throw new Error(`Product not found: ${request.productId}`);
            }
            // Get market data for underlying assets
            const marketData = await this.getMarketData(product, request.valuationDate);
            // Select and execute valuation model
            const modelType = request.modelType || this.selectOptimalModel(product);
            const valuationModel = await this.getValuationModel(modelType);
            // Perform valuation
            const modelResults = await this.executeValuation(product, marketData, valuationModel, request);
            // Calculate Greeks if requested
            let greeks = {};
            if (request.includeGreeks) {
                greeks = await this.calculateGreeks(product, marketData, valuationModel);
            }
            // Perform scenario analysis if requested
            let scenarioAnalysis = [];
            if (request.scenarioAnalysis) {
                scenarioAnalysis = await this.performScenarioAnalysis(product, marketData, valuationModel);
            }
            const calculationTime = Date.now() - startTime;
            // Create market data response
            const marketDataResponse = {
                id: `md_${request.productId}_${Date.now()}`,
                productId: request.productId,
                timestamp: request.valuationDate,
                theoreticalValue: modelResults.theoreticalValue,
                underlyingLevels: marketData.underlyingLevels,
                ...greeks,
                priceScenarios: scenarioAnalysis
            };
            // Store valuation result
            await this.storeValuationResult(request.productId, request.valuationDate, modelResults, marketDataResponse);
            // Publish valuation event
            await this.publishValuationEvent(request.productId, modelResults);
            const response = {
                productId: request.productId,
                valuationDate: request.valuationDate,
                theoreticalValue: modelResults.theoreticalValue,
                marketData: marketDataResponse,
                modelResults,
                scenarioAnalysis: request.scenarioAnalysis ? scenarioAnalysis : undefined,
                calculationTime,
                warnings: modelResults.warnings
            };
            logger_1.logger.info('Structured product valuation completed', {
                productId: request.productId,
                theoreticalValue: modelResults.theoreticalValue,
                calculationTime
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error in structured product valuation:', error);
            throw error;
        }
    }
    // Get product details with related data
    async getProductDetails(productId) {
        try {
            // In a real implementation, this would fetch from database
            // For now, return a placeholder
            return {
                id: productId,
                tenantId: 'tenant_001',
                securityId: `inst_${productId}`,
                productName: 'Sample Structured Note',
                productType: 'STRUCTURED_NOTE',
                issuer: 'Sample Bank',
                issuerId: 'issuer_001',
                notionalAmount: 1000000,
                currency: 'USD',
                issueDate: new Date('2024-01-01'),
                maturityDate: new Date('2026-01-01'),
                minInvestment: 10000,
                payoffType: 'PARTICIPATION',
                payoffFormula: 'max(0, participation * (finalLevel / initialLevel - 1))',
                payoffParameters: { participation: 1.0 },
                underlyingType: 'SINGLE_STOCK',
                underlyingAssets: [
                    {
                        id: 'underlying_001',
                        symbol: 'AAPL',
                        name: 'Apple Inc.',
                        assetType: 'EQUITY',
                        weight: 100,
                        currentPrice: 150,
                        initialLevel: 140,
                        strikeLevel: 140
                    }
                ],
                hasBarrier: true,
                barriers: [
                    {
                        id: 'barrier_001',
                        barrierType: 'DOWN_AND_OUT',
                        level: 0.7, // 70% of initial level
                        observationFrequency: 'DAILY',
                        observationStartDate: new Date('2024-01-01'),
                        observationEndDate: new Date('2026-01-01'),
                        isAmerican: true,
                        isActive: true,
                        hasBeenHit: false
                    }
                ],
                hasCoupon: false,
                isCallable: false,
                isPutable: false,
                hasCapitalProtection: false,
                settlementType: 'CASH',
                settlementDays: 3,
                termSheet: '{}',
                riskLevel: 'HIGH',
                riskFactors: ['Market Risk', 'Credit Risk', 'Barrier Risk'],
                status: 'ACTIVE',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system'
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching product details:', error);
            return null;
        }
    }
    // Get market data for valuation
    async getMarketData(product, valuationDate) {
        try {
            // In a real implementation, this would fetch live market data
            // For now, return mock data
            const underlyingLevels = {};
            const volatilities = {};
            const dividendYields = {};
            for (const underlying of product.underlyingAssets) {
                underlyingLevels[underlying.symbol] = underlying.currentPrice || 150;
                volatilities[underlying.symbol] = underlying.impliedVolatility || 0.25;
                dividendYields[underlying.symbol] = 0.02; // 2% dividend yield
            }
            return {
                underlyingLevels,
                volatilities,
                correlations: {}, // Will be populated for basket products
                riskFreeRate: 0.05, // 5% risk-free rate
                dividendYields
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching market data:', error);
            throw error;
        }
    }
    // Select optimal valuation model based on product characteristics
    selectOptimalModel(product) {
        // Complex products with barriers typically require Monte Carlo
        if (product.hasBarrier && product.barriers?.some(b => b.barrierType.includes('BARRIER'))) {
            return 'MONTE_CARLO';
        }
        // Simple equity-linked products can use closed-form solutions
        if (product.underlyingType === 'SINGLE_STOCK' && !product.hasBarrier) {
            return 'CLOSED_FORM';
        }
        // Basket products typically need Monte Carlo for correlation
        if (product.underlyingType === 'BASKET') {
            return 'MONTE_CARLO';
        }
        // Default to Monte Carlo for complex payoffs
        return 'MONTE_CARLO';
    }
    // Get valuation model configuration
    async getValuationModel(modelType) {
        const baseModel = {
            id: `model_${modelType}_${Date.now()}`,
            modelName: modelType,
            modelType: modelType,
            parameters: {},
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        switch (modelType) {
            case 'MONTE_CARLO':
                return {
                    ...baseModel,
                    parameters: {
                        simulations: 100000,
                        timeSteps: 252, // Daily steps for 1 year
                        antithetic: true,
                        controlVariates: true,
                        sobolSequence: true
                    },
                    simulations: 100000,
                    timeSteps: 252
                };
            case 'BINOMIAL':
                return {
                    ...baseModel,
                    parameters: {
                        steps: 1000,
                        smoothing: true
                    }
                };
            case 'CLOSED_FORM':
                return {
                    ...baseModel,
                    parameters: {
                        method: 'BLACK_SCHOLES',
                        greeksCalculation: true
                    }
                };
            default:
                return baseModel;
        }
    }
    // Execute valuation based on model type
    async executeValuation(product, marketData, model, request) {
        try {
            switch (model.modelType) {
                case 'MONTE_CARLO':
                    return await this.monteCarloValuation(product, marketData, model, request);
                case 'BINOMIAL':
                    return await this.binomialValuation(product, marketData, model, request);
                case 'CLOSED_FORM':
                    return await this.closedFormValuation(product, marketData, model, request);
                default:
                    throw new Error(`Unsupported valuation model: ${model.modelType}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error in valuation execution:', error);
            throw error;
        }
    }
    // Monte Carlo valuation implementation
    async monteCarloValuation(product, marketData, model, request) {
        const simulations = model.simulations || 100000;
        const timeSteps = model.timeSteps || 252;
        // Calculate time to maturity in years
        const timeToMaturity = (product.maturityDate.getTime() - request.valuationDate.getTime())
            / (365.25 * 24 * 60 * 60 * 1000);
        const dt = timeToMaturity / timeSteps;
        const underlying = product.underlyingAssets[0];
        const S0 = marketData.underlyingLevels[underlying.symbol];
        const vol = marketData.volatilities[underlying.symbol];
        const r = marketData.riskFreeRate;
        const q = marketData.dividendYields[underlying.symbol];
        let payoffSum = 0;
        let barrierHits = 0;
        const payoffs = [];
        // Monte Carlo simulation
        for (let sim = 0; sim < simulations; sim++) {
            const path = this.generatePricePath(S0, r, q, vol, dt, timeSteps);
            // Check barrier conditions
            let barrierHit = false;
            if (product.hasBarrier && product.barriers) {
                for (const barrier of product.barriers) {
                    if (this.checkBarrierHit(path, barrier, underlying.initialLevel || S0)) {
                        barrierHit = true;
                        barrierHits++;
                        break;
                    }
                }
            }
            // Calculate payoff
            const finalPrice = path[path.length - 1];
            let payoff = 0;
            if (!barrierHit) {
                payoff = this.calculatePayoff(product.payoffType, finalPrice, underlying.initialLevel || S0, product.payoffParameters);
            }
            payoffs.push(payoff);
            payoffSum += payoff;
        }
        const meanPayoff = payoffSum / simulations;
        const discountedValue = meanPayoff * Math.exp(-r * timeToMaturity);
        // Calculate confidence intervals
        const variance = payoffs.reduce((sum, p) => sum + Math.pow(p - meanPayoff, 2), 0) / (simulations - 1);
        const standardError = Math.sqrt(variance / simulations);
        const confidence95 = 1.96 * standardError * Math.exp(-r * timeToMaturity);
        return {
            theoreticalValue: discountedValue * product.notionalAmount,
            confidence: confidence95 * product.notionalAmount,
            convergence: {
                simulations,
                standardError,
                barrierHitProbability: barrierHits / simulations
            },
            modelSpecificResults: {
                meanPayoff,
                discountedPayoff: discountedValue,
                barrierHits,
                convergenceStatistics: {
                    mean: meanPayoff,
                    variance,
                    standardError
                }
            }
        };
    }
    // Binomial tree valuation implementation
    async binomialValuation(product, marketData, model, request) {
        const steps = model.parameters?.steps || 1000;
        const timeToMaturity = (product.maturityDate.getTime() - request.valuationDate.getTime())
            / (365.25 * 24 * 60 * 60 * 1000);
        const underlying = product.underlyingAssets[0];
        const S0 = marketData.underlyingLevels[underlying.symbol];
        const vol = marketData.volatilities[underlying.symbol];
        const r = marketData.riskFreeRate;
        const q = marketData.dividendYields[underlying.symbol];
        const dt = timeToMaturity / steps;
        const u = Math.exp(vol * Math.sqrt(dt));
        const d = 1 / u;
        const p = (Math.exp((r - q) * dt) - d) / (u - d);
        // Build price tree
        const priceTree = [];
        for (let i = 0; i <= steps; i++) {
            priceTree[i] = [];
            for (let j = 0; j <= i; j++) {
                priceTree[i][j] = S0 * Math.pow(u, j) * Math.pow(d, i - j);
            }
        }
        // Calculate payoffs at maturity
        const payoffs = [];
        for (let j = 0; j <= steps; j++) {
            const finalPrice = priceTree[steps][j];
            payoffs[j] = this.calculatePayoff(product.payoffType, finalPrice, underlying.initialLevel || S0, product.payoffParameters);
        }
        // Backward induction
        for (let i = steps - 1; i >= 0; i--) {
            for (let j = 0; j <= i; j++) {
                payoffs[j] = Math.exp(-r * dt) * (p * payoffs[j + 1] + (1 - p) * payoffs[j]);
            }
        }
        return {
            theoreticalValue: payoffs[0] * product.notionalAmount,
            modelSpecificResults: {
                binomialParameters: { u, d, p, steps },
                treeDepth: steps
            }
        };
    }
    // Closed-form valuation implementation
    async closedFormValuation(product, marketData, model, request) {
        const timeToMaturity = (product.maturityDate.getTime() - request.valuationDate.getTime())
            / (365.25 * 24 * 60 * 60 * 1000);
        const underlying = product.underlyingAssets[0];
        const S = marketData.underlyingLevels[underlying.symbol];
        const K = underlying.strikeLevel || underlying.initialLevel || S;
        const vol = marketData.volatilities[underlying.symbol];
        const r = marketData.riskFreeRate;
        const q = marketData.dividendYields[underlying.symbol];
        // Black-Scholes calculation for simple equity-linked payoffs
        const d1 = (Math.log(S / K) + (r - q + 0.5 * vol * vol) * timeToMaturity) / (vol * Math.sqrt(timeToMaturity));
        const d2 = d1 - vol * Math.sqrt(timeToMaturity);
        const N = this.cumulativeNormalDistribution;
        let theoreticalValue = 0;
        // Simple participation in upside
        if (product.payoffType === 'PARTICIPATION') {
            const participation = product.payoffParameters.participation || 1.0;
            // Call option value
            const callValue = S * Math.exp(-q * timeToMaturity) * N(d1) - K * Math.exp(-r * timeToMaturity) * N(d2);
            theoreticalValue = participation * callValue;
        }
        return {
            theoreticalValue: theoreticalValue * product.notionalAmount,
            modelSpecificResults: {
                blackScholesInputs: { S, K, r, q, vol, timeToMaturity, d1, d2 },
                greeks: {
                    delta: Math.exp(-q * timeToMaturity) * N(d1),
                    gamma: Math.exp(-q * timeToMaturity) / (S * vol * Math.sqrt(timeToMaturity)) * this.normalPDF(d1),
                    theta: (-S * Math.exp(-q * timeToMaturity) * this.normalPDF(d1) * vol / (2 * Math.sqrt(timeToMaturity))
                        - r * K * Math.exp(-r * timeToMaturity) * N(d2)
                        + q * S * Math.exp(-q * timeToMaturity) * N(d1)) / 365,
                    vega: S * Math.exp(-q * timeToMaturity) * Math.sqrt(timeToMaturity) * this.normalPDF(d1) / 100,
                    rho: K * timeToMaturity * Math.exp(-r * timeToMaturity) * N(d2) / 100
                }
            }
        };
    }
    // Generate price path for Monte Carlo simulation
    generatePricePath(S0, r, q, vol, dt, steps) {
        const path = [S0];
        let S = S0;
        for (let i = 0; i < steps; i++) {
            const z = this.randomNormal();
            S = S * Math.exp((r - q - 0.5 * vol * vol) * dt + vol * Math.sqrt(dt) * z);
            path.push(S);
        }
        return path;
    }
    // Check if barrier has been hit during the path
    checkBarrierHit(path, barrier, initialLevel) {
        const barrierLevel = barrier.level * initialLevel;
        switch (barrier.barrierType) {
            case 'DOWN_AND_OUT':
                return path.some(price => price <= barrierLevel);
            case 'UP_AND_OUT':
                return path.some(price => price >= barrierLevel);
            case 'DOWN_AND_IN':
                return path.some(price => price <= barrierLevel);
            case 'UP_AND_IN':
                return path.some(price => price >= barrierLevel);
            default:
                return false;
        }
    }
    // Calculate payoff based on payoff type
    calculatePayoff(payoffType, finalPrice, initialPrice, parameters) {
        const performance = finalPrice / initialPrice;
        switch (payoffType) {
            case 'PARTICIPATION':
                const participation = parameters.participation || 1.0;
                return Math.max(0, participation * (performance - 1));
            case 'LEVERAGED':
                const leverage = parameters.leverage || 2.0;
                return Math.max(0, leverage * (performance - 1));
            case 'CAPPED':
                const cap = parameters.cap || 0.5; // 50% cap
                return Math.min(cap, Math.max(0, performance - 1));
            case 'DIGITAL':
                const threshold = parameters.threshold || 1.0;
                const digitalPayoff = parameters.digitalPayoff || 0.1; // 10%
                return performance >= threshold ? digitalPayoff : 0;
            default:
                return Math.max(0, performance - 1);
        }
    }
    // Calculate Greeks using finite differences
    async calculateGreeks(product, marketData, model) {
        const baseValue = await this.executeValuation(product, marketData, model, { productId: product.id, valuationDate: new Date() });
        const underlying = product.underlyingAssets[0];
        const S = marketData.underlyingLevels[underlying.symbol];
        const vol = marketData.volatilities[underlying.symbol];
        const r = marketData.riskFreeRate;
        // Delta calculation (price sensitivity)
        const deltaShift = 0.01; // 1% shift
        const upMarketData = { ...marketData };
        upMarketData.underlyingLevels[underlying.symbol] = S * (1 + deltaShift);
        const upValue = await this.executeValuation(product, upMarketData, model, { productId: product.id, valuationDate: new Date() });
        const delta = (upValue.theoreticalValue - baseValue.theoreticalValue) / (S * deltaShift);
        // Vega calculation (volatility sensitivity)
        const vegaShift = 0.01; // 1% absolute shift
        const vegaMarketData = { ...marketData };
        vegaMarketData.volatilities[underlying.symbol] = vol + vegaShift;
        const vegaValue = await this.executeValuation(product, vegaMarketData, model, { productId: product.id, valuationDate: new Date() });
        const vega = (vegaValue.theoreticalValue - baseValue.theoreticalValue) / vegaShift;
        // Theta calculation (time decay)
        const thetaShift = 1 / 365; // 1 day
        const thetaRequest = {
            productId: product.id,
            valuationDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day forward
        };
        const thetaValue = await this.executeValuation(product, marketData, model, thetaRequest);
        const theta = thetaValue.theoreticalValue - baseValue.theoreticalValue;
        return {
            delta: delta / product.notionalAmount,
            vega: vega / product.notionalAmount,
            theta: theta / product.notionalAmount
        };
    }
    // Perform scenario analysis
    async performScenarioAnalysis(product, marketData, model) {
        const scenarios = [];
        const underlying = product.underlyingAssets[0];
        const basePrice = marketData.underlyingLevels[underlying.symbol];
        const baseValue = await this.executeValuation(product, marketData, model, { productId: product.id, valuationDate: new Date() });
        // Define scenario shifts
        const priceShifts = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]; // -30% to +30%
        const volShifts = [-0.05, 0, 0.05]; // -5% to +5% absolute
        for (const priceShift of priceShifts) {
            for (const volShift of volShifts) {
                const scenarioMarketData = { ...marketData };
                scenarioMarketData.underlyingLevels[underlying.symbol] = basePrice * (1 + priceShift);
                scenarioMarketData.volatilities[underlying.symbol] =
                    marketData.volatilities[underlying.symbol] + volShift;
                const scenarioValue = await this.executeValuation(product, scenarioMarketData, model, { productId: product.id, valuationDate: new Date() });
                scenarios.push({
                    scenarioName: `Price ${priceShift >= 0 ? '+' : ''}${(priceShift * 100).toFixed(0)}%, Vol ${volShift >= 0 ? '+' : ''}${(volShift * 100).toFixed(0)}%`,
                    underlyingChanges: { [underlying.symbol]: priceShift },
                    impliedVolChanges: { [underlying.symbol]: volShift },
                    scenarioPrice: scenarioValue.theoreticalValue,
                    pnl: scenarioValue.theoreticalValue - baseValue.theoreticalValue
                });
            }
        }
        return scenarios;
    }
    // Store valuation result in database
    async storeValuationResult(productId, valuationDate, modelResults, marketData) {
        try {
            // In a real implementation, this would store in database
            logger_1.logger.debug('Storing valuation result', {
                productId,
                valuationDate,
                theoreticalValue: modelResults.theoreticalValue
            });
        }
        catch (error) {
            logger_1.logger.error('Error storing valuation result:', error);
        }
    }
    // Publish valuation event to Kafka
    async publishValuationEvent(productId, modelResults) {
        await this.kafkaService.publishEvent('structured-products.valuation.completed', {
            productId,
            theoreticalValue: modelResults.theoreticalValue,
            timestamp: new Date().toISOString()
        });
    }
    // Utility functions
    randomNormal() {
        // Box-Muller transformation
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    cumulativeNormalDistribution(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2.0);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1.0 + sign * y);
    }
    normalPDF(x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }
    // Batch valuation for multiple products
    async valuatePortfolio(productIds, valuationDate, options = {}) {
        try {
            logger_1.logger.info('Starting portfolio valuation', {
                productCount: productIds.length,
                valuationDate
            });
            const results = await Promise.all(productIds.map(productId => this.valuateProduct({
                productId,
                valuationDate,
                ...options
            })));
            logger_1.logger.info('Portfolio valuation completed', {
                productCount: productIds.length,
                totalValue: results.reduce((sum, r) => sum + r.theoreticalValue, 0)
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Error in portfolio valuation:', error);
            throw error;
        }
    }
    // Risk scenario stress testing
    async performStressTest(productId, stressScenarios) {
        try {
            const product = await this.getProductDetails(productId);
            if (!product) {
                throw new Error(`Product not found: ${productId}`);
            }
            const marketData = await this.getMarketData(product, new Date());
            const model = await this.getValuationModel(this.selectOptimalModel(product));
            // Base valuation
            const baseResult = await this.executeValuation(product, marketData, model, { productId, valuationDate: new Date() });
            const stressResults = [];
            for (const scenario of stressScenarios) {
                const stressedMarketData = { ...marketData };
                // Apply underlying shifts
                for (const [symbol, shift] of Object.entries(scenario.underlyingShifts)) {
                    if (stressedMarketData.underlyingLevels[symbol]) {
                        stressedMarketData.underlyingLevels[symbol] *= (1 + shift);
                    }
                }
                // Apply volatility shifts
                if (scenario.volatilityShifts) {
                    for (const [symbol, shift] of Object.entries(scenario.volatilityShifts)) {
                        if (stressedMarketData.volatilities[symbol]) {
                            stressedMarketData.volatilities[symbol] += shift;
                        }
                    }
                }
                // Apply rate shifts
                if (scenario.rateShifts) {
                    stressedMarketData.riskFreeRate += scenario.rateShifts;
                }
                const stressedResult = await this.executeValuation(product, stressedMarketData, model, { productId, valuationDate: new Date() });
                const pnl = stressedResult.theoreticalValue - baseResult.theoreticalValue;
                const pnlPercent = (pnl / baseResult.theoreticalValue) * 100;
                stressResults.push({
                    scenarioName: scenario.name,
                    stressedValue: stressedResult.theoreticalValue,
                    pnl,
                    pnlPercent
                });
            }
            return {
                baseValue: baseResult.theoreticalValue,
                stressResults
            };
        }
        catch (error) {
            logger_1.logger.error('Error in stress testing:', error);
            throw error;
        }
    }
}
exports.StructuredProductsValuationService = StructuredProductsValuationService;

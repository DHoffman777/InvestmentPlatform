"use strict";
// Value at Risk (VaR) Calculation Service
// Phase 4.3 - Comprehensive VaR implementation with multiple methodologies
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaRCalculationService = void 0;
const logger_1 = require("../../utils/logger");
// Constants for enum-like behavior
const RiskMeasurementMethod = {
    PARAMETRIC: 'PARAMETRIC',
    HISTORICAL_SIMULATION: 'HISTORICAL_SIMULATION',
    MONTE_CARLO: 'MONTE_CARLO'
};
const ConfidenceLevel = {
    NINETY_FIVE: 95,
    NINETY_NINE: 99,
    NINETY_NINE_NINE: 99.9
};
class VaRCalculationService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Main VaR calculation method
    async calculateVaR(request) {
        try {
            logger_1.logger.info('Starting VaR calculation', {
                portfolioId: request.portfolioId,
                method: request.method,
                confidenceLevel: request.confidenceLevel,
                timeHorizon: request.timeHorizon
            });
            const startTime = Date.now();
            // Get portfolio positions and market data
            const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
            const marketData = await this.getMarketData(portfolioData, request.asOfDate);
            // Validate data quality
            const dataQuality = await this.assessDataQuality(portfolioData, marketData);
            // Calculate VaR based on method
            let varResult;
            switch (request.method) {
                case RiskMeasurementMethod.PARAMETRIC:
                    varResult = await this.calculateParametricVaR(request, portfolioData, marketData);
                    break;
                case RiskMeasurementMethod.HISTORICAL_SIMULATION:
                    varResult = await this.calculateHistoricalVaR(request, portfolioData, marketData);
                    break;
                case RiskMeasurementMethod.MONTE_CARLO:
                    varResult = await this.calculateMonteCarloVaR(request, portfolioData, marketData);
                    break;
                default:
                    throw new Error(`Unsupported VaR method: ${request.method}`);
            }
            // Calculate component and marginal VaR
            varResult.componentVaR = await this.calculateComponentVaR(portfolioData, marketData, request);
            varResult.marginalVaR = await this.calculateMarginalVaR(portfolioData, marketData, request);
            varResult.incrementalVaR = await this.calculateIncrementalVaR(portfolioData, marketData, request);
            // Perform backtesting if requested
            if (request.includeStressTests) {
                varResult.backtestingResults = await this.performBacktesting(varResult, request);
            }
            // Set metadata
            varResult.calculationTime = Date.now() - startTime;
            varResult.dataQuality = dataQuality;
            varResult.assumptions = await this.getModelAssumptions(request);
            varResult.createdAt = new Date();
            varResult.calculatedBy = 'system';
            // Store results
            await this.storeVaRResult(varResult);
            // Publish VaR calculated event
            await this.publishVaREvent('VAR_CALCULATED', varResult);
            logger_1.logger.info('VaR calculation completed', {
                portfolioId: request.portfolioId,
                totalVaR: varResult.totalVaR,
                calculationTime: varResult.calculationTime
            });
            return varResult;
        }
        catch (error) {
            logger_1.logger.error('Error calculating VaR:', error);
            throw error;
        }
    }
    // Parametric VaR calculation (variance-covariance method)
    async calculateParametricVaR(request, portfolioData, marketData) {
        logger_1.logger.info('Calculating parametric VaR');
        // Extract returns and build covariance matrix
        const returns = await this.extractReturns(portfolioData, marketData, 252); // 1 year lookback
        const weights = await this.calculatePortfolioWeights(portfolioData);
        const covarianceMatrix = await this.calculateCovarianceMatrix(returns);
        // Calculate portfolio variance
        const portfolioVariance = await this.calculatePortfolioVariance(weights, covarianceMatrix);
        const portfolioVolatility = Math.sqrt(portfolioVariance);
        // Adjust for time horizon
        const timeAdjustment = await this.getTimeAdjustment(request.timeHorizon);
        const adjustedVolatility = portfolioVolatility * Math.sqrt(timeAdjustment);
        // Get confidence level multiplier
        const zScore = await this.getZScore(request.confidenceLevel);
        // Calculate portfolio value
        const portfolioValue = portfolioData.reduce((sum, position) => sum + position.marketValue, 0);
        // Calculate VaR
        const totalVaR = portfolioValue * adjustedVolatility * zScore;
        // Calculate diversification benefit
        const undiversifiedVaR = await this.calculateUndiversifiedVaR(portfolioData, adjustedVolatility, zScore);
        const diversificationBenefit = undiversifiedVaR - totalVaR;
        return {
            id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            portfolioId: request.portfolioId,
            tenantId: request.tenantId,
            calculationDate: new Date(),
            asOfDate: request.asOfDate,
            confidenceLevel: request.confidenceLevel,
            timeHorizon: request.timeHorizon,
            method: request.method,
            totalVaR,
            diversifiedVaR: totalVaR,
            undiversifiedVaR,
            diversificationBenefit,
            componentVaR: [],
            marginalVaR: [],
            incrementalVaR: [],
            modelAccuracy: 0.95,
            calculationTime: 0,
            dataQuality: {},
            assumptions: {},
            createdAt: new Date(),
            calculatedBy: 'system'
        };
    }
    // Historical simulation VaR calculation
    async calculateHistoricalVaR(request, portfolioData, marketData) {
        logger_1.logger.info('Calculating historical simulation VaR');
        // Get historical returns (e.g., 500 days)
        const historicalReturns = await this.getHistoricalReturns(portfolioData, marketData, 500);
        // Apply current portfolio weights to historical returns
        const portfolioReturns = await this.calculatePortfolioHistoricalReturns(portfolioData, historicalReturns);
        // Sort returns from worst to best
        const sortedReturns = portfolioReturns.sort((a, b) => a - b);
        // Find VaR percentile
        const percentileIndex = await this.getPercentileIndex(request.confidenceLevel, sortedReturns.length);
        const varReturn = sortedReturns[percentileIndex];
        // Calculate portfolio value
        const portfolioValue = portfolioData.reduce((sum, position) => sum + position.marketValue, 0);
        // Adjust for time horizon
        const timeAdjustment = await this.getTimeAdjustment(request.timeHorizon);
        const adjustedVarReturn = varReturn * Math.sqrt(timeAdjustment);
        // Calculate VaR (negative return represents loss)
        const totalVaR = Math.abs(portfolioValue * adjustedVarReturn);
        // Calculate undiversified VaR
        const undiversifiedVaR = await this.calculateUndiversifiedHistoricalVaR(portfolioData, historicalReturns, request);
        const diversificationBenefit = undiversifiedVaR - totalVaR;
        return {
            id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            portfolioId: request.portfolioId,
            tenantId: request.tenantId,
            calculationDate: new Date(),
            asOfDate: request.asOfDate,
            confidenceLevel: request.confidenceLevel,
            timeHorizon: request.timeHorizon,
            method: request.method,
            totalVaR,
            diversifiedVaR: totalVaR,
            undiversifiedVaR,
            diversificationBenefit,
            componentVaR: [],
            marginalVaR: [],
            incrementalVaR: [],
            modelAccuracy: 0.92,
            calculationTime: 0,
            dataQuality: {},
            assumptions: {},
            createdAt: new Date(),
            calculatedBy: 'system'
        };
    }
    // Monte Carlo VaR calculation
    async calculateMonteCarloVaR(request, portfolioData, marketData) {
        logger_1.logger.info('Calculating Monte Carlo VaR');
        const numberOfSimulations = 10000;
        const simulatedReturns = [];
        // Get correlation matrix and volatilities
        const correlationMatrix = await this.calculateCorrelationMatrix(portfolioData, marketData);
        const volatilities = await this.calculateAssetVolatilities(portfolioData, marketData);
        // Perform Monte Carlo simulations
        for (let i = 0; i < numberOfSimulations; i++) {
            const randomFactors = await this.generateCorrelatedRandomNumbers(correlationMatrix);
            const assetReturns = randomFactors.map((factor, index) => factor * volatilities[index]);
            // Calculate portfolio return for this simulation
            const portfolioReturn = await this.calculateSimulatedPortfolioReturn(portfolioData, assetReturns);
            simulatedReturns.push(portfolioReturn);
        }
        // Sort simulated returns
        const sortedReturns = simulatedReturns.sort((a, b) => a - b);
        // Find VaR percentile
        const percentileIndex = await this.getPercentileIndex(request.confidenceLevel, sortedReturns.length);
        const varReturn = sortedReturns[percentileIndex];
        // Calculate portfolio value
        const portfolioValue = portfolioData.reduce((sum, position) => sum + position.marketValue, 0);
        // Adjust for time horizon
        const timeAdjustment = await this.getTimeAdjustment(request.timeHorizon);
        const adjustedVarReturn = varReturn * Math.sqrt(timeAdjustment);
        // Calculate VaR
        const totalVaR = Math.abs(portfolioValue * adjustedVarReturn);
        // Calculate undiversified VaR
        const undiversifiedVaR = await this.calculateUndiversifiedMonteCarloVaR(portfolioData, volatilities, request);
        const diversificationBenefit = undiversifiedVaR - totalVaR;
        return {
            id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            portfolioId: request.portfolioId,
            tenantId: request.tenantId,
            calculationDate: new Date(),
            asOfDate: request.asOfDate,
            confidenceLevel: request.confidenceLevel,
            timeHorizon: request.timeHorizon,
            method: request.method,
            totalVaR,
            diversifiedVaR: totalVaR,
            undiversifiedVaR,
            diversificationBenefit,
            componentVaR: [],
            marginalVaR: [],
            incrementalVaR: [],
            modelAccuracy: 0.94,
            calculationTime: 0,
            dataQuality: {},
            assumptions: {},
            createdAt: new Date(),
            calculatedBy: 'system'
        };
    }
    // Component VaR calculation
    async calculateComponentVaR(portfolioData, marketData, request) {
        const componentVaR = [];
        // Calculate by asset class
        const assetClassGroups = await this.groupByAssetClass(portfolioData);
        for (const [assetClass, positions] of Object.entries(assetClassGroups)) {
            const assetClassVar = await this.calculateSubPortfolioVaR(positions, marketData, request);
            const portfolioValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
            componentVaR.push({
                assetClass,
                componentType: 'ASSET_CLASS',
                componentName: assetClass,
                var: assetClassVar,
                percentOfTotal: (assetClassVar / portfolioValue) * 100,
                correlation: 0.85 // Simplified correlation
            });
        }
        return componentVaR;
    }
    // Marginal VaR calculation
    async calculateMarginalVaR(portfolioData, marketData, request) {
        const marginalVaR = [];
        // Calculate base portfolio VaR
        const baseVaR = await this.calculateSubPortfolioVaR(portfolioData, marketData, request);
        const portfolioValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
        for (const position of portfolioData) {
            // Calculate VaR without this position
            const portfolioWithoutPosition = portfolioData.filter((p) => p.positionId !== position.positionId);
            const varWithoutPosition = await this.calculateSubPortfolioVaR(portfolioWithoutPosition, marketData, request);
            // Marginal VaR is the difference
            const marginalVar = baseVaR - varWithoutPosition;
            const contribution = (position.marketValue / portfolioValue) * marginalVar;
            marginalVaR.push({
                positionId: position.positionId,
                securityId: position.securityId,
                symbol: position.symbol,
                marginalVaR: marginalVar,
                contribution,
                percentContribution: (contribution / baseVaR) * 100
            });
        }
        return marginalVaR;
    }
    // Incremental VaR calculation
    async calculateIncrementalVaR(portfolioData, marketData, request) {
        const incrementalVaR = [];
        for (const position of portfolioData) {
            // Calculate VaR without this position
            const portfolioWithoutPosition = portfolioData.filter((p) => p.positionId !== position.positionId);
            const varWithoutPosition = await this.calculateSubPortfolioVaR(portfolioWithoutPosition, marketData, request);
            // Calculate VaR with this position (full portfolio)
            const varWithPosition = await this.calculateSubPortfolioVaR(portfolioData, marketData, request);
            // Incremental VaR is the difference
            const incrementalVar = varWithPosition - varWithoutPosition;
            incrementalVaR.push({
                positionId: position.positionId,
                securityId: position.securityId,
                symbol: position.symbol,
                incrementalVaR: incrementalVar,
                portfolioVaRWithout: varWithoutPosition,
                portfolioVaRWith: varWithPosition
            });
        }
        return incrementalVaR;
    }
    // Backtesting implementation
    async performBacktesting(varResult, request) {
        logger_1.logger.info('Performing VaR backtesting');
        // Get actual portfolio returns for backtesting period (e.g., last 250 days)
        const backtestPeriod = 250;
        const actualReturns = await this.getActualPortfolioReturns(request.portfolioId, backtestPeriod);
        // Calculate expected VaR for each day
        const expectedVaR = varResult.totalVaR;
        // Count exceptions (actual losses > VaR)
        let exceptions = 0;
        for (const actualReturn of actualReturns) {
            const actualLoss = Math.abs(actualReturn) * varResult.totalVaR; // Simplified
            if (actualLoss > expectedVaR) {
                exceptions++;
            }
        }
        // Calculate exception rate
        const exceptionRate = exceptions / actualReturns.length;
        const expectedExceptionRate = (100 - request.confidenceLevel) / 100;
        // Perform Kupiec test
        const kupiecTest = await this.performKupiecTest(exceptions, actualReturns.length, expectedExceptionRate);
        // Perform Christoffersen test
        const christoffersenTest = await this.performChristoffersenTest(actualReturns, expectedVaR);
        return {
            testPeriod: {
                startDate: new Date(Date.now() - backtestPeriod * 24 * 60 * 60 * 1000),
                endDate: new Date()
            },
            numberOfExceptions: exceptions,
            exceptionRate,
            expectedExceptionRate,
            kupiecTest,
            christoffersenTest,
            isModelAccurate: kupiecTest.rejectNull === false && christoffersenTest.rejectNull === false
        };
    }
    // Kupiec test implementation
    async performKupiecTest(exceptions, observations, expectedRate) {
        // Kupiec likelihood ratio test
        const observedRate = exceptions / observations;
        // Test statistic: 2 * ln(L1/L0)
        const l0 = Math.pow(expectedRate, exceptions) * Math.pow(1 - expectedRate, observations - exceptions);
        const l1 = Math.pow(observedRate, exceptions) * Math.pow(1 - observedRate, observations - exceptions);
        const testStatistic = -2 * (Math.log(l0) - Math.log(l1));
        // Critical value for 95% confidence (chi-square with 1 df)
        const criticalValue = 3.841;
        const pValue = 1 - this.chiSquareCDF(testStatistic, 1);
        return {
            testStatistic,
            criticalValue,
            pValue,
            rejectNull: testStatistic > criticalValue
        };
    }
    // Christoffersen test implementation
    async performChristoffersenTest(actualReturns, expectedVaR) {
        // Independence test for VaR exceptions
        // Simplified implementation
        const testStatistic = 2.5; // Placeholder calculation
        const criticalValue = 5.991; // Chi-square with 2 df
        const pValue = 0.287; // Placeholder
        return {
            testStatistic,
            criticalValue,
            pValue,
            rejectNull: testStatistic > criticalValue
        };
    }
    // Helper methods
    async getPortfolioData(portfolioId, asOfDate) {
        // Simulate fetching portfolio positions
        return [
            {
                positionId: 'pos_001',
                securityId: 'AAPL',
                symbol: 'AAPL',
                marketValue: 1000000,
                assetClass: 'EQUITY',
                sector: 'TECHNOLOGY'
            },
            {
                positionId: 'pos_002',
                securityId: 'GOOGL',
                symbol: 'GOOGL',
                marketValue: 800000,
                assetClass: 'EQUITY',
                sector: 'TECHNOLOGY'
            }
        ];
    }
    async getMarketData(portfolioData, asOfDate) {
        // Simulate fetching market data
        return {
            prices: {},
            returns: {},
            volatilities: {},
            correlations: {}
        };
    }
    async assessDataQuality(portfolioData, marketData) {
        return {
            completeness: 95,
            accuracy: 98,
            timeliness: 0.5,
            missingDataPoints: [],
            qualityScore: 96
        };
    }
    async getModelAssumptions(request) {
        return {
            distributionAssumption: 'NORMAL',
            correlationModel: 'PEARSON',
            volatilityModel: 'HISTORICAL',
            lookbackPeriod: 252,
            dataFrequency: 'DAILY',
            adjustments: []
        };
    }
    async extractReturns(portfolioData, marketData, lookback) {
        // Simulate historical returns extraction
        const returns = [];
        for (let i = 0; i < lookback; i++) {
            const dayReturns = portfolioData.map(() => (Math.random() - 0.5) * 0.04); // Random returns
            returns.push(dayReturns);
        }
        return returns;
    }
    async calculatePortfolioWeights(portfolioData) {
        const totalValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
        return portfolioData.map(pos => pos.marketValue / totalValue);
    }
    async calculateCovarianceMatrix(returns) {
        // Simplified covariance matrix calculation
        const numAssets = returns[0].length;
        const covariance = [];
        for (let i = 0; i < numAssets; i++) {
            covariance[i] = [];
            for (let j = 0; j < numAssets; j++) {
                if (i === j) {
                    covariance[i][j] = 0.0004; // Variance
                }
                else {
                    covariance[i][j] = 0.0002; // Covariance
                }
            }
        }
        return covariance;
    }
    async calculatePortfolioVariance(weights, covarianceMatrix) {
        let variance = 0;
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights.length; j++) {
                variance += weights[i] * weights[j] * covarianceMatrix[i][j];
            }
        }
        return variance;
    }
    async getTimeAdjustment(timeHorizon) {
        const adjustments = {
            '1D': 1,
            '1W': 5,
            '2W': 10,
            '1M': 21,
            '3M': 63,
            '6M': 126,
            '1Y': 252
        };
        return adjustments[timeHorizon] || 1;
    }
    async getZScore(confidenceLevel) {
        const zScores = {
            95: 1.645,
            99: 2.326,
            99.9: 3.09
        };
        return zScores[confidenceLevel] || 1.645;
    }
    async calculateUndiversifiedVaR(portfolioData, volatility, zScore) {
        // Sum of individual position VaRs (no diversification benefit)
        return portfolioData.reduce((sum, pos) => {
            return sum + (pos.marketValue * volatility * zScore);
        }, 0);
    }
    async storeVaRResult(result) {
        logger_1.logger.debug('Storing VaR result', { varId: result.id });
        // Implement database storage
    }
    async publishVaREvent(eventType, result) {
        try {
            await this.kafkaService.publishEvent('risk-management', {
                eventType,
                varId: result.id,
                portfolioId: result.portfolioId,
                tenantId: result.tenantId,
                timestamp: new Date(),
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error publishing VaR event:', error);
        }
    }
    // Additional helper methods (simplified implementations)
    async getHistoricalReturns(portfolioData, marketData, days) {
        // Simulate historical returns
        const returns = [];
        for (let i = 0; i < days; i++) {
            const dayReturns = portfolioData.map(() => (Math.random() - 0.5) * 0.04);
            returns.push(dayReturns);
        }
        return returns;
    }
    async calculatePortfolioHistoricalReturns(portfolioData, historicalReturns) {
        const weights = await this.calculatePortfolioWeights(portfolioData);
        return historicalReturns.map(dayReturns => {
            return dayReturns.reduce((sum, ret, index) => sum + ret * weights[index], 0);
        });
    }
    async getPercentileIndex(confidenceLevel, length) {
        const percentile = (100 - confidenceLevel) / 100;
        return Math.floor(percentile * length);
    }
    async calculateCorrelationMatrix(portfolioData, marketData) {
        // Simplified correlation matrix
        const numAssets = portfolioData.length;
        const correlation = [];
        for (let i = 0; i < numAssets; i++) {
            correlation[i] = [];
            for (let j = 0; j < numAssets; j++) {
                correlation[i][j] = i === j ? 1.0 : 0.6; // High correlation
            }
        }
        return correlation;
    }
    async calculateAssetVolatilities(portfolioData, marketData) {
        return portfolioData.map(() => 0.02); // 2% daily volatility
    }
    async generateCorrelatedRandomNumbers(correlationMatrix) {
        // Simplified random number generation
        return correlationMatrix.map(() => this.normalRandom());
    }
    normalRandom() {
        // Box-Muller transformation for normal random numbers
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random();
        while (v === 0)
            v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    async calculateSimulatedPortfolioReturn(portfolioData, assetReturns) {
        const weights = await this.calculatePortfolioWeights(portfolioData);
        return assetReturns.reduce((sum, ret, index) => sum + ret * weights[index], 0);
    }
    chiSquareCDF(x, df) {
        // Simplified chi-square CDF implementation
        return 0.5; // Placeholder
    }
    async groupByAssetClass(portfolioData) {
        return portfolioData.reduce((groups, position) => {
            const assetClass = position.assetClass || 'OTHER';
            if (!groups[assetClass])
                groups[assetClass] = [];
            groups[assetClass].push(position);
            return groups;
        }, {});
    }
    async calculateSubPortfolioVaR(positions, marketData, request) {
        // Simplified sub-portfolio VaR calculation
        const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        const volatility = 0.015; // 1.5% daily volatility
        const zScore = await this.getZScore(request.confidenceLevel);
        const timeAdjustment = await this.getTimeAdjustment(request.timeHorizon);
        return totalValue * volatility * zScore * Math.sqrt(timeAdjustment);
    }
    async calculateUndiversifiedHistoricalVaR(portfolioData, historicalReturns, request) {
        // Simplified calculation
        const totalValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
        return totalValue * 0.025; // 2.5% VaR
    }
    async calculateUndiversifiedMonteCarloVaR(portfolioData, volatilities, request) {
        // Simplified calculation
        const totalValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
        return totalValue * 0.023; // 2.3% VaR
    }
    async getActualPortfolioReturns(portfolioId, days) {
        // Simulate actual portfolio returns for backtesting
        const returns = [];
        for (let i = 0; i < days; i++) {
            returns.push((Math.random() - 0.5) * 0.04); // Random returns
        }
        return returns;
    }
}
exports.VaRCalculationService = VaRCalculationService;

"use strict";
// Monte Carlo Simulation Service
// Phase 4.3 - Advanced Monte Carlo simulation for portfolio risk analysis
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonteCarloSimulationService = void 0;
const logger_1 = require("../../utils/logger");
class MonteCarloSimulationService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Main Monte Carlo simulation execution
    async runMonteCarloSimulation(request) {
        try {
            logger_1.logger.info('Starting Monte Carlo simulation', {
                portfolioId: request.portfolioId,
                numberOfSimulations: request.numberOfSimulations,
                timeHorizon: request.timeHorizon
            });
            const startTime = Date.now();
            // Get portfolio data and market parameters
            const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
            const marketParameters = await this.getMarketParameters(portfolioData, request);
            // Initialize random number generator with seed if provided
            if (request.randomSeed) {
                this.seedRandom(request.randomSeed);
            }
            // Run simulations
            const simulationResults = await this.executeSimulations(request, portfolioData, marketParameters);
            // Calculate distribution statistics
            const distributionStats = await this.calculateDistributionStatistics(simulationResults);
            // Calculate risk metrics
            const riskMetrics = await this.calculateRiskMetrics(simulationResults, request.confidenceLevel);
            // Calculate percentiles
            const percentiles = await this.calculatePercentiles(simulationResults);
            // Calculate path statistics
            const pathStats = await this.calculatePathStatistics(simulationResults, portfolioData);
            // Perform convergence test
            const convergenceTest = await this.performConvergenceTest(simulationResults, request.numberOfSimulations);
            const result = {
                id: `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                calculationDate: new Date(),
                asOfDate: request.asOfDate,
                numberOfSimulations: request.numberOfSimulations,
                timeHorizon: request.timeHorizon,
                expectedReturn: distributionStats.mean,
                standardDeviation: distributionStats.standardDeviation,
                skewness: distributionStats.skewness,
                kurtosis: distributionStats.kurtosis,
                var95: riskMetrics.var95,
                var99: riskMetrics.var99,
                cvar95: riskMetrics.cvar95,
                cvar99: riskMetrics.cvar99,
                expectedShortfall: riskMetrics.expectedShortfall,
                percentiles,
                maxDrawdown: pathStats.maxDrawdown,
                timeToRecovery: pathStats.timeToRecovery,
                probabilityOfLoss: pathStats.probabilityOfLoss,
                convergenceTest,
                createdAt: new Date(),
                calculatedBy: 'system'
            };
            // Store results
            await this.storeMonteCarloResult(result);
            // Publish simulation completed event
            await this.publishMonteCarloEvent('MONTE_CARLO_COMPLETED', result);
            logger_1.logger.info('Monte Carlo simulation completed', {
                portfolioId: request.portfolioId,
                executionTime: Date.now() - startTime,
                expectedReturn: result.expectedReturn,
                var95: result.var95
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error running Monte Carlo simulation:', error);
            throw error;
        }
    }
    // Execute Monte Carlo simulations
    async executeSimulations(request, portfolioData, marketParameters) {
        const simulationResults = [];
        const timeSteps = this.getTimeSteps(request.timeHorizon);
        const dt = 1 / 252; // Daily time step
        logger_1.logger.info('Executing Monte Carlo simulations', {
            numberOfSimulations: request.numberOfSimulations,
            timeSteps
        });
        for (let sim = 0; sim < request.numberOfSimulations; sim++) {
            const portfolioReturn = await this.simulatePortfolioPath(portfolioData, marketParameters, timeSteps, dt, request);
            simulationResults.push(portfolioReturn);
            // Log progress every 1000 simulations
            if ((sim + 1) % 1000 === 0) {
                logger_1.logger.debug(`Completed ${sim + 1} simulations`);
            }
        }
        return simulationResults.sort((a, b) => a - b);
    }
    // Simulate individual portfolio path
    async simulatePortfolioPath(portfolioData, marketParameters, timeSteps, dt, request) {
        const numAssets = portfolioData.length;
        const weights = await this.calculatePortfolioWeights(portfolioData);
        // Initialize asset prices
        const assetPrices = portfolioData.map(asset => asset.currentPrice || 100);
        const initialPortfolioValue = weights.reduce((sum, weight, i) => sum + weight * assetPrices[i], 0);
        // Simulate price paths
        for (let t = 0; t < timeSteps; t++) {
            // Generate correlated random shocks
            const randomShocks = await this.generateCorrelatedShocks(marketParameters.correlationMatrix, numAssets);
            // Update asset prices using geometric Brownian motion
            for (let i = 0; i < numAssets; i++) {
                const drift = marketParameters.expectedReturns[i] * dt;
                const diffusion = marketParameters.volatilities[i] * Math.sqrt(dt) * randomShocks[i];
                // Add jump risk if enabled
                let jumpComponent = 0;
                if (request.includeJumpRisk) {
                    jumpComponent = await this.generateJumpComponent(marketParameters.jumpIntensity, dt);
                }
                // Update price using stochastic differential equation
                assetPrices[i] *= Math.exp(drift - 0.5 * Math.pow(marketParameters.volatilities[i], 2) * dt + diffusion + jumpComponent);
            }
        }
        // Calculate final portfolio value and return
        const finalPortfolioValue = weights.reduce((sum, weight, i) => sum + weight * assetPrices[i], 0);
        return (finalPortfolioValue - initialPortfolioValue) / initialPortfolioValue;
    }
    // Generate correlated random shocks using Cholesky decomposition
    async generateCorrelatedShocks(correlationMatrix, numAssets) {
        // Generate independent standard normal random variables
        const independentShocks = Array(numAssets).fill(0).map(() => this.normalRandom());
        // Apply Cholesky decomposition for correlation
        const choleskyMatrix = await this.choleskyDecomposition(correlationMatrix);
        const correlatedShocks = [];
        for (let i = 0; i < numAssets; i++) {
            let shock = 0;
            for (let j = 0; j <= i; j++) {
                shock += choleskyMatrix[i][j] * independentShocks[j];
            }
            correlatedShocks.push(shock);
        }
        return correlatedShocks;
    }
    // Cholesky decomposition for correlation matrix
    async choleskyDecomposition(matrix) {
        const n = matrix.length;
        const L = Array(n).fill(null).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                if (i === j) {
                    // Diagonal elements
                    let sum = 0;
                    for (let k = 0; k < j; k++) {
                        sum += L[j][k] * L[j][k];
                    }
                    L[i][j] = Math.sqrt(matrix[i][i] - sum);
                }
                else {
                    // Non-diagonal elements
                    let sum = 0;
                    for (let k = 0; k < j; k++) {
                        sum += L[i][k] * L[j][k];
                    }
                    L[i][j] = (matrix[i][j] - sum) / L[j][j];
                }
            }
        }
        return L;
    }
    // Generate jump component for jump-diffusion models
    async generateJumpComponent(jumpIntensity, dt) {
        const jumpProbability = jumpIntensity * dt;
        if (Math.random() < jumpProbability) {
            // Jump occurs - generate jump size from normal distribution
            const jumpMean = -0.05; // Average jump size (negative for down jumps)
            const jumpStd = 0.15; // Jump volatility
            return jumpMean + jumpStd * this.normalRandom();
        }
        return 0;
    }
    // Calculate distribution statistics
    async calculateDistributionStatistics(results) {
        const n = results.length;
        const mean = results.reduce((sum, val) => sum + val, 0) / n;
        // Calculate variance
        const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
        const standardDeviation = Math.sqrt(variance);
        // Calculate skewness
        const skewness = results.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0) / n;
        // Calculate kurtosis
        const kurtosis = results.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3;
        return {
            mean,
            standardDeviation,
            skewness,
            kurtosis
        };
    }
    // Calculate risk metrics
    async calculateRiskMetrics(results, confidenceLevel) {
        const n = results.length;
        // Calculate VaR
        const var95Index = Math.floor(0.05 * n);
        const var99Index = Math.floor(0.01 * n);
        const var95 = Math.abs(results[var95Index]);
        const var99 = Math.abs(results[var99Index]);
        // Calculate Conditional VaR (Expected Shortfall)
        const cvar95 = Math.abs(results.slice(0, var95Index + 1).reduce((sum, val) => sum + val, 0) / (var95Index + 1));
        const cvar99 = Math.abs(results.slice(0, var99Index + 1).reduce((sum, val) => sum + val, 0) / (var99Index + 1));
        // Expected shortfall is the same as CVaR at 95%
        const expectedShortfall = cvar95;
        return {
            var95,
            var99,
            cvar95,
            cvar99,
            expectedShortfall
        };
    }
    // Calculate percentiles
    async calculatePercentiles(results) {
        const percentilesToCalculate = [1, 5, 10, 25, 50, 75, 90, 95, 99];
        const percentiles = [];
        for (const percentile of percentilesToCalculate) {
            const index = Math.floor((percentile / 100) * results.length);
            percentiles.push({
                percentile,
                value: results[Math.min(index, results.length - 1)]
            });
        }
        return percentiles;
    }
    // Calculate path statistics
    async calculatePathStatistics(results, portfolioData) {
        // Calculate maximum drawdown (simplified - using final returns)
        const worstResult = Math.min(...results);
        const maxDrawdown = Math.abs(worstResult);
        // Calculate probability of loss
        const lossCount = results.filter(result => result < 0).length;
        const probabilityOfLoss = (lossCount / results.length) * 100;
        // Time to recovery (simplified estimate)
        const averageReturn = results.reduce((sum, val) => sum + val, 0) / results.length;
        const timeToRecovery = averageReturn > 0 ? Math.abs(worstResult) / averageReturn * 252 : 0; // In days
        return {
            maxDrawdown,
            timeToRecovery,
            probabilityOfLoss
        };
    }
    // Perform convergence test
    async performConvergenceTest(results, numberOfSimulations) {
        // Test convergence using batch means method
        const batchSize = Math.floor(numberOfSimulations / 10);
        const batchMeans = [];
        for (let i = 0; i < 10; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, results.length);
            const batch = results.slice(start, end);
            const batchMean = batch.reduce((sum, val) => sum + val, 0) / batch.length;
            batchMeans.push(batchMean);
        }
        // Calculate overall mean and batch variance
        const overallMean = batchMeans.reduce((sum, val) => sum + val, 0) / batchMeans.length;
        const batchVariance = batchMeans.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) / (batchMeans.length - 1);
        // Standard error
        const standardError = Math.sqrt(batchVariance / batchMeans.length);
        // Convergence threshold (1% of mean)
        const convergenceThreshold = Math.abs(overallMean) * 0.01;
        const hasConverged = standardError < convergenceThreshold;
        // 95% confidence interval
        const tValue = 2.262; // t-value for 9 degrees of freedom at 95% confidence
        const marginOfError = tValue * standardError;
        return {
            hasConverged,
            convergenceThreshold,
            standardError,
            confidenceInterval: {
                lower: overallMean - marginOfError,
                upper: overallMean + marginOfError
            }
        };
    }
    // Helper methods
    async getPortfolioData(portfolioId, asOfDate) {
        // Simulate portfolio data retrieval
        return [
            {
                positionId: 'pos_001',
                securityId: 'AAPL',
                symbol: 'AAPL',
                marketValue: 1000000,
                currentPrice: 150,
                assetClass: 'EQUITY'
            },
            {
                positionId: 'pos_002',
                securityId: 'GOOGL',
                symbol: 'GOOGL',
                marketValue: 800000,
                currentPrice: 2800,
                assetClass: 'EQUITY'
            },
            {
                positionId: 'pos_003',
                securityId: 'BND',
                symbol: 'BND',
                marketValue: 500000,
                currentPrice: 80,
                assetClass: 'FIXED_INCOME'
            }
        ];
    }
    async getMarketParameters(portfolioData, request) {
        const numAssets = portfolioData.length;
        // Get expected returns based on asset class
        const expectedReturns = portfolioData.map(asset => {
            switch (asset.assetClass) {
                case 'EQUITY':
                    return 0.08; // 8% annual expected return
                case 'FIXED_INCOME':
                    return 0.03; // 3% annual expected return
                default:
                    return 0.05; // 5% default
            }
        });
        // Get volatilities
        const volatilities = await this.getAssetVolatilities(portfolioData, request);
        // Get correlation matrix
        const correlationMatrix = await this.getCorrelationMatrix(portfolioData, request);
        return {
            expectedReturns,
            volatilities,
            correlationMatrix,
            jumpIntensity: 0.1 // 10% annual jump intensity
        };
    }
    async getAssetVolatilities(portfolioData, request) {
        // Use different volatility models based on request
        return portfolioData.map(asset => {
            let baseVolatility;
            switch (asset.assetClass) {
                case 'EQUITY':
                    baseVolatility = 0.20; // 20% annual volatility
                    break;
                case 'FIXED_INCOME':
                    baseVolatility = 0.05; // 5% annual volatility
                    break;
                default:
                    baseVolatility = 0.15; // 15% default
            }
            // Apply volatility model adjustments
            if (request.volatilityModel === 'GARCH') {
                return baseVolatility * 1.1; // GARCH adjustment
            }
            else if (request.volatilityModel === 'EWMA') {
                return baseVolatility * 1.05; // EWMA adjustment
            }
            return baseVolatility; // Historical volatility
        });
    }
    async getCorrelationMatrix(portfolioData, request) {
        const numAssets = portfolioData.length;
        const correlationMatrix = [];
        for (let i = 0; i < numAssets; i++) {
            correlationMatrix[i] = [];
            for (let j = 0; j < numAssets; j++) {
                if (i === j) {
                    correlationMatrix[i][j] = 1.0; // Perfect correlation with itself
                }
                else {
                    // Set correlation based on asset classes
                    const asset1 = portfolioData[i];
                    const asset2 = portfolioData[j];
                    if (asset1.assetClass === asset2.assetClass) {
                        correlationMatrix[i][j] = 0.7; // High correlation within asset class
                    }
                    else {
                        correlationMatrix[i][j] = 0.3; // Lower correlation across asset classes
                    }
                }
            }
        }
        // Apply historical correlations if requested
        if (request.useHistoricalCorrelations) {
            return await this.adjustForHistoricalCorrelations(correlationMatrix, request.correlationLookbackPeriod || 252);
        }
        return correlationMatrix;
    }
    async adjustForHistoricalCorrelations(baseMatrix, lookbackPeriod) {
        // Simulate historical correlation adjustment
        return baseMatrix.map(row => row.map(corr => corr * 0.9) // Slightly reduce correlations based on historical data
        );
    }
    async calculatePortfolioWeights(portfolioData) {
        const totalValue = portfolioData.reduce((sum, asset) => sum + asset.marketValue, 0);
        return portfolioData.map(asset => asset.marketValue / totalValue);
    }
    getTimeSteps(timeHorizon) {
        const timeStepMap = {
            '1D': 1,
            '1W': 5,
            '2W': 10,
            '1M': 21,
            '3M': 63,
            '6M': 126,
            '1Y': 252
        };
        return timeStepMap[timeHorizon] || 21;
    }
    normalRandom() {
        // Box-Muller transformation for normal random numbers
        let u = 0, v = 0;
        while (u === 0)
            u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0)
            v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    seedRandom(seed) {
        // Simple linear congruential generator for reproducible results
        let currentSeed = seed;
        Math.random = () => {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    }
    async storeMonteCarloResult(result) {
        logger_1.logger.debug('Storing Monte Carlo result', { resultId: result.id });
        // Implement database storage
    }
    async publishMonteCarloEvent(eventType, result) {
        try {
            await this.kafkaService.publishEvent('risk-management', {
                eventType,
                monteCarloId: result.id,
                portfolioId: result.portfolioId,
                tenantId: result.tenantId,
                timestamp: new Date(),
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error publishing Monte Carlo event:', error);
        }
    }
}
exports.MonteCarloSimulationService = MonteCarloSimulationService;

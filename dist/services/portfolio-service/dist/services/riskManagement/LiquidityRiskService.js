"use strict";
// Liquidity Risk Assessment Service
// Phase 4.3 - Comprehensive liquidity risk analysis and monitoring
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityRiskService = void 0;
const logger_1 = require("../../utils/logger");
const RiskManagement_1 = require("../../models/riskManagement/RiskManagement");
class LiquidityRiskService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Main liquidity risk assessment
    async assessLiquidityRisk(request) {
        try {
            logger_1.logger.info('Starting liquidity risk assessment', {
                portfolioId: request.portfolioId,
                liquidationTimeframe: request.liquidationTimeframe
            });
            const startTime = Date.now();
            // Get portfolio data and market liquidity information
            const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
            const marketLiquidityData = await this.getMarketLiquidityData(portfolioData, request.asOfDate);
            // Calculate position-level liquidity metrics
            const positionLiquidity = await this.calculatePositionLiquidity(portfolioData, marketLiquidityData, request);
            // Calculate overall portfolio liquidity metrics
            const liquidityScore = await this.calculateOverallLiquidityScore(positionLiquidity);
            const averageDaysToLiquidate = await this.calculateAverageDaysToLiquidate(positionLiquidity);
            const liquidationCost = await this.calculateTotalLiquidationCost(positionLiquidity);
            const marketImpact = await this.calculateTotalMarketImpact(positionLiquidity);
            // Calculate liquidity breakdowns by categories
            const liquidityByAssetClass = await this.calculateLiquidityByCategory(portfolioData, positionLiquidity, 'assetClass');
            const liquidityBySector = await this.calculateLiquidityByCategory(portfolioData, positionLiquidity, 'sector');
            const liquidityBySize = await this.calculateLiquidityBySize(portfolioData, positionLiquidity);
            // Perform liquidity stress testing
            const liquidityUnderStress = await this.performLiquidityStressTesting(portfolioData, positionLiquidity, request);
            const result = {
                id: `liq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                calculationDate: new Date(),
                asOfDate: request.asOfDate,
                liquidationTimeframe: request.liquidationTimeframe,
                liquidityScore,
                averageDaysToLiquidate,
                liquidationCost,
                marketImpact,
                liquidityByAssetClass,
                liquidityBySector,
                liquidityBySize,
                positionLiquidity,
                liquidityUnderStress,
                createdAt: new Date(),
                calculatedBy: 'system'
            };
            // Store results
            await this.storeLiquidityRiskResult(result);
            // Publish liquidity risk assessment event
            await this.publishLiquidityRiskEvent('LIQUIDITY_RISK_ASSESSED', result);
            logger_1.logger.info('Liquidity risk assessment completed', {
                portfolioId: request.portfolioId,
                liquidityScore: result.liquidityScore,
                executionTime: Date.now() - startTime
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error assessing liquidity risk:', error);
            throw error;
        }
    }
    // Calculate position-level liquidity metrics
    async calculatePositionLiquidity(portfolioData, marketLiquidityData, request) {
        const positionLiquidity = [];
        for (const position of portfolioData) {
            const liquidityMetrics = await this.assessPositionLiquidity(position, marketLiquidityData, request);
            positionLiquidity.push(liquidityMetrics);
        }
        return positionLiquidity;
    }
    // Assess individual position liquidity
    async assessPositionLiquidity(position, marketLiquidityData, request) {
        // Get market data for this position
        const marketData = marketLiquidityData[position.symbol] || {};
        // Calculate average daily volume
        const averageDailyVolume = marketData.averageDailyVolume ||
            await this.estimateAverageDailyVolume(position);
        // Calculate bid-ask spread
        const bidAskSpread = marketData.bidAskSpread ||
            await this.estimateBidAskSpread(position);
        // Get market capitalization and float
        const marketCapitalization = marketData.marketCapitalization;
        const floatPercentage = marketData.floatPercentage || 0.8; // Default 80% float
        // Calculate days to liquidate based on position size and volume
        const positionShares = position.marketValue / (marketData.currentPrice || 100);
        const maxDailyVolume = averageDailyVolume * 0.2; // Assume 20% of daily volume is maximum participation
        const daysToLiquidate = Math.max(1, Math.ceil(positionShares / maxDailyVolume));
        // Determine liquidity category
        const liquidityCategory = await this.determineLiquidityCategory(daysToLiquidate, averageDailyVolume, bidAskSpread, position.assetClass);
        // Calculate liquidation cost using market impact model
        const liquidationCost = await this.calculateLiquidationCost(position.marketValue, averageDailyVolume, bidAskSpread, daysToLiquidate, request.marketImpactModel);
        // Calculate market impact
        const marketImpact = liquidationCost / position.marketValue;
        return {
            positionId: position.positionId,
            securityId: position.securityId,
            symbol: position.symbol,
            marketValue: position.marketValue,
            liquidityCategory,
            daysToLiquidate,
            liquidationCost,
            marketImpact,
            averageDailyVolume,
            bidAskSpread,
            marketCapitalization,
            floatPercentage
        };
    }
    // Determine liquidity category based on multiple factors
    async determineLiquidityCategory(daysToLiquidate, averageDailyVolume, bidAskSpread, assetClass) {
        // Asset class-specific thresholds
        let liquidityThresholds = this.getLiquidityThresholds(assetClass);
        // Primarily based on days to liquidate
        if (daysToLiquidate <= 1) {
            return RiskManagement_1.LiquidityCategory.IMMEDIATE;
        }
        else if (daysToLiquidate <= 7) {
            return RiskManagement_1.LiquidityCategory.HIGH;
        }
        else if (daysToLiquidate <= 30) {
            return RiskManagement_1.LiquidityCategory.MEDIUM;
        }
        else if (daysToLiquidate <= 90) {
            return RiskManagement_1.LiquidityCategory.LOW;
        }
        else {
            return RiskManagement_1.LiquidityCategory.ILLIQUID;
        }
    }
    // Get liquidity thresholds by asset class
    getLiquidityThresholds(assetClass) {
        const thresholds = {
            'EQUITY': {
                highVolumeThreshold: 1000000, // $1M daily volume
                lowSpreadThreshold: 0.005, // 0.5% spread
                mediumSpreadThreshold: 0.02 // 2% spread
            },
            'FIXED_INCOME': {
                highVolumeThreshold: 500000, // $500K daily volume
                lowSpreadThreshold: 0.01, // 1% spread
                mediumSpreadThreshold: 0.05 // 5% spread
            },
            'ALTERNATIVES': {
                highVolumeThreshold: 100000, // $100K daily volume
                lowSpreadThreshold: 0.02, // 2% spread
                mediumSpreadThreshold: 0.10 // 10% spread
            }
        };
        return thresholds[assetClass] || thresholds['EQUITY'];
    }
    // Calculate liquidation cost using various market impact models
    async calculateLiquidationCost(marketValue, averageDailyVolume, bidAskSpread, daysToLiquidate, marketImpactModel) {
        // Base cost from bid-ask spread
        const spreadCost = marketValue * bidAskSpread * 0.5;
        // Market impact cost based on model
        let marketImpactCost = 0;
        const participationRate = 0.2; // 20% of daily volume
        const volumeRatio = marketValue / (averageDailyVolume * participationRate);
        switch (marketImpactModel) {
            case 'LINEAR':
                marketImpactCost = marketValue * 0.01 * volumeRatio; // 1% base impact
                break;
            case 'SQUARE_ROOT':
                marketImpactCost = marketValue * 0.015 * Math.sqrt(volumeRatio);
                break;
            case 'POWER_LAW':
                marketImpactCost = marketValue * 0.02 * Math.pow(volumeRatio, 0.6);
                break;
            default:
                marketImpactCost = marketValue * 0.01 * volumeRatio;
        }
        // Time-based impact (urgency premium)
        const timeMultiplier = daysToLiquidate <= 1 ? 1.5 :
            daysToLiquidate <= 7 ? 1.2 : 1.0;
        return (spreadCost + marketImpactCost) * timeMultiplier;
    }
    // Calculate overall portfolio liquidity score (0-100)
    async calculateOverallLiquidityScore(positionLiquidity) {
        const totalValue = positionLiquidity.reduce((sum, pos) => sum + pos.marketValue, 0);
        let weightedScore = 0;
        for (const position of positionLiquidity) {
            const weight = position.marketValue / totalValue;
            const positionScore = this.getPositionLiquidityScore(position);
            weightedScore += weight * positionScore;
        }
        return Math.round(weightedScore);
    }
    // Get liquidity score for individual position (0-100)
    getPositionLiquidityScore(position) {
        // Score based on liquidity category
        const categoryScores = {
            [RiskManagement_1.LiquidityCategory.IMMEDIATE]: 95,
            [RiskManagement_1.LiquidityCategory.HIGH]: 80,
            [RiskManagement_1.LiquidityCategory.MEDIUM]: 60,
            [RiskManagement_1.LiquidityCategory.LOW]: 35,
            [RiskManagement_1.LiquidityCategory.ILLIQUID]: 10
        };
        let baseScore = categoryScores[position.liquidityCategory];
        // Adjust based on bid-ask spread
        if (position.bidAskSpread < 0.005) {
            baseScore += 5; // Tight spread bonus
        }
        else if (position.bidAskSpread > 0.05) {
            baseScore -= 10; // Wide spread penalty
        }
        // Adjust based on market cap (for equities)
        if (position.marketCapitalization) {
            if (position.marketCapitalization > 10000000000) { // > $10B
                baseScore += 3; // Large cap bonus
            }
            else if (position.marketCapitalization < 1000000000) { // < $1B
                baseScore -= 5; // Small cap penalty
            }
        }
        return Math.max(0, Math.min(100, baseScore));
    }
    // Calculate average days to liquidate across portfolio
    async calculateAverageDaysToLiquidate(positionLiquidity) {
        const totalValue = positionLiquidity.reduce((sum, pos) => sum + pos.marketValue, 0);
        let weightedDays = 0;
        for (const position of positionLiquidity) {
            const weight = position.marketValue / totalValue;
            weightedDays += weight * position.daysToLiquidate;
        }
        return Math.round(weightedDays * 10) / 10; // Round to 1 decimal place
    }
    // Calculate total liquidation cost
    async calculateTotalLiquidationCost(positionLiquidity) {
        return positionLiquidity.reduce((sum, pos) => sum + pos.liquidationCost, 0);
    }
    // Calculate total market impact
    async calculateTotalMarketImpact(positionLiquidity) {
        const totalValue = positionLiquidity.reduce((sum, pos) => sum + pos.marketValue, 0);
        const totalCost = await this.calculateTotalLiquidationCost(positionLiquidity);
        return (totalCost / totalValue) * 100; // As percentage
    }
    // Calculate liquidity breakdown by category
    async calculateLiquidityByCategory(portfolioData, positionLiquidity, category) {
        const totalValue = positionLiquidity.reduce((sum, pos) => sum + pos.marketValue, 0);
        const categoryMap = new Map();
        // Aggregate by category
        for (let i = 0; i < portfolioData.length; i++) {
            const position = portfolioData[i];
            const liquidity = positionLiquidity[i];
            const categoryValue = position[category] || 'UNKNOWN';
            if (!categoryMap.has(categoryValue)) {
                categoryMap.set(categoryValue, {
                    value: 0,
                    liquidationDays: [],
                    liquidationCosts: 0
                });
            }
            const categoryData = categoryMap.get(categoryValue);
            categoryData.value += liquidity.marketValue;
            categoryData.liquidationDays.push(liquidity.daysToLiquidate);
            categoryData.liquidationCosts += liquidity.liquidationCost;
        }
        // Convert to breakdown format
        const breakdowns = [];
        for (const [categoryName, data] of categoryMap.entries()) {
            const percentage = (data.value / totalValue) * 100;
            const averageDaysToLiquidate = data.liquidationDays.reduce((sum, days) => sum + days, 0) /
                data.liquidationDays.length;
            // Determine overall liquidity category for this group
            const liquidityCategory = await this.determineLiquidityCategory(averageDaysToLiquidate, 0, // Not used in this context
            0, // Not used in this context
            categoryName);
            breakdowns.push({
                category: categoryName,
                percentage,
                liquidityCategory,
                averageDaysToLiquidate: Math.round(averageDaysToLiquidate * 10) / 10,
                estimatedCost: data.liquidationCosts
            });
        }
        return breakdowns.sort((a, b) => b.percentage - a.percentage);
    }
    // Calculate liquidity breakdown by position size
    async calculateLiquidityBySize(portfolioData, positionLiquidity) {
        const totalValue = positionLiquidity.reduce((sum, pos) => sum + pos.marketValue, 0);
        const sizeCategories = ['Large (>$1M)', 'Medium ($100K-$1M)', 'Small (<$100K)'];
        const sizeBuckets = {};
        // Initialize buckets
        sizeCategories.forEach(category => {
            sizeBuckets[category] = {
                value: 0,
                liquidationDays: [],
                liquidationCosts: 0
            };
        });
        // Categorize positions by size
        for (const liquidity of positionLiquidity) {
            let sizeCategory;
            if (liquidity.marketValue >= 1000000) {
                sizeCategory = 'Large (>$1M)';
            }
            else if (liquidity.marketValue >= 100000) {
                sizeCategory = 'Medium ($100K-$1M)';
            }
            else {
                sizeCategory = 'Small (<$100K)';
            }
            sizeBuckets[sizeCategory].value += liquidity.marketValue;
            sizeBuckets[sizeCategory].liquidationDays.push(liquidity.daysToLiquidate);
            sizeBuckets[sizeCategory].liquidationCosts += liquidity.liquidationCost;
        }
        // Convert to breakdown format
        const breakdowns = [];
        for (const [sizeName, data] of Object.entries(sizeBuckets)) {
            if (data.value > 0) {
                const percentage = (data.value / totalValue) * 100;
                const averageDaysToLiquidate = data.liquidationDays.reduce((sum, days) => sum + days, 0) /
                    data.liquidationDays.length;
                const liquidityCategory = await this.determineLiquidityCategory(averageDaysToLiquidate, 0, 0, 'EQUITY');
                breakdowns.push({
                    category: sizeName,
                    percentage,
                    liquidityCategory,
                    averageDaysToLiquidate: Math.round(averageDaysToLiquidate * 10) / 10,
                    estimatedCost: data.liquidationCosts
                });
            }
        }
        return breakdowns.sort((a, b) => b.percentage - a.percentage);
    }
    // Perform liquidity stress testing
    async performLiquidityStressTesting(portfolioData, positionLiquidity, request) {
        const stressScenarios = [
            {
                name: 'Market Volatility Spike',
                volumeReduction: 0.5, // 50% volume reduction
                spreadIncrease: 2.0, // 100% spread increase
                liquidityMultiplier: 1.5 // 50% longer liquidation time
            },
            {
                name: 'Credit Crisis',
                volumeReduction: 0.3, // 70% volume reduction
                spreadIncrease: 3.0, // 200% spread increase
                liquidityMultiplier: 2.0 // 100% longer liquidation time
            },
            {
                name: 'Flash Crash',
                volumeReduction: 0.1, // 90% volume reduction
                spreadIncrease: 5.0, // 400% spread increase
                liquidityMultiplier: 3.0 // 200% longer liquidation time
            }
        ];
        const stressResults = [];
        for (const scenario of stressScenarios) {
            const stressedLiquidity = await this.applyLiquidityStress(positionLiquidity, scenario, request);
            const liquidityScore = await this.calculateOverallLiquidityScore(stressedLiquidity);
            const averageDaysToLiquidate = await this.calculateAverageDaysToLiquidate(stressedLiquidity);
            const totalLiquidationCost = await this.calculateTotalLiquidationCost(stressedLiquidity);
            const marketImpact = await this.calculateTotalMarketImpact(stressedLiquidity);
            stressResults.push({
                stressScenario: scenario.name,
                liquidityScore,
                averageDaysToLiquidate,
                totalLiquidationCost,
                marketImpact
            });
        }
        return stressResults;
    }
    // Apply stress factors to liquidity metrics
    async applyLiquidityStress(positionLiquidity, stressScenario, request) {
        return positionLiquidity.map(position => {
            // Apply volume reduction
            const stressedVolume = position.averageDailyVolume * stressScenario.volumeReduction;
            // Apply spread increase
            const stressedSpread = position.bidAskSpread * stressScenario.spreadIncrease;
            // Recalculate days to liquidate
            const positionShares = position.marketValue / 100; // Simplified
            const maxDailyVolume = stressedVolume * 0.1; // Reduced participation rate under stress
            const stressedDaysToLiquidate = Math.max(1, Math.ceil(positionShares / maxDailyVolume) * stressScenario.liquidityMultiplier);
            // Recalculate liquidation cost
            const stressedLiquidationCost = this.calculateLiquidationCost(position.marketValue, stressedVolume, stressedSpread, stressedDaysToLiquidate, request.marketImpactModel);
            return {
                ...position,
                daysToLiquidate: stressedDaysToLiquidate,
                liquidationCost: stressedLiquidationCost,
                marketImpact: stressedLiquidationCost / position.marketValue,
                averageDailyVolume: stressedVolume,
                bidAskSpread: stressedSpread
            };
        });
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
            },
            {
                positionId: 'pos_003',
                securityId: 'BND',
                symbol: 'BND',
                marketValue: 500000,
                assetClass: 'FIXED_INCOME',
                sector: 'GOVERNMENT'
            },
            {
                positionId: 'pos_004',
                securityId: 'VNQ',
                symbol: 'VNQ',
                marketValue: 300000,
                assetClass: 'ALTERNATIVES',
                sector: 'REAL_ESTATE'
            }
        ];
    }
    async getMarketLiquidityData(portfolioData, asOfDate) {
        // Simulate market liquidity data retrieval
        return {
            'AAPL': {
                averageDailyVolume: 75000000, // $75M daily volume
                bidAskSpread: 0.001, // 0.1% spread
                currentPrice: 150,
                marketCapitalization: 2500000000000, // $2.5T
                floatPercentage: 0.95
            },
            'GOOGL': {
                averageDailyVolume: 25000000, // $25M daily volume
                bidAskSpread: 0.002, // 0.2% spread
                currentPrice: 2800,
                marketCapitalization: 1800000000000, // $1.8T
                floatPercentage: 0.90
            },
            'BND': {
                averageDailyVolume: 300000000, // $300M daily volume
                bidAskSpread: 0.005, // 0.5% spread
                currentPrice: 80,
                marketCapitalization: null,
                floatPercentage: 1.0
            },
            'VNQ': {
                averageDailyVolume: 15000000, // $15M daily volume
                bidAskSpread: 0.01, // 1% spread
                currentPrice: 100,
                marketCapitalization: null,
                floatPercentage: 1.0
            }
        };
    }
    async estimateAverageDailyVolume(position) {
        // Estimate based on asset class and market value
        const baseVolume = {
            'EQUITY': 10000000, // $10M
            'FIXED_INCOME': 5000000, // $5M
            'ALTERNATIVES': 1000000 // $1M
        };
        return baseVolume[position.assetClass] || baseVolume['EQUITY'];
    }
    async estimateBidAskSpread(position) {
        // Estimate based on asset class
        const baseSpread = {
            'EQUITY': 0.005, // 0.5%
            'FIXED_INCOME': 0.01, // 1%
            'ALTERNATIVES': 0.02 // 2%
        };
        return baseSpread[position.assetClass] || baseSpread['EQUITY'];
    }
    async storeLiquidityRiskResult(result) {
        logger_1.logger.debug('Storing liquidity risk result', { liquidityRiskId: result.id });
        // Implement database storage
    }
    async publishLiquidityRiskEvent(eventType, result) {
        try {
            await this.kafkaService.publishEvent('risk-management', {
                eventType,
                liquidityRiskId: result.id,
                portfolioId: result.portfolioId,
                tenantId: result.tenantId,
                timestamp: new Date(),
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error publishing liquidity risk event:', error);
        }
    }
}
exports.LiquidityRiskService = LiquidityRiskService;

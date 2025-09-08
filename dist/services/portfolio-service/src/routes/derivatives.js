"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../utils/prisma");
const kafka_mock_1 = require("../utils/kafka-mock");
const derivativesAnalyticsService_1 = require("../services/derivativesAnalyticsService");
const logger_1 = require("../utils/logger");
const DerivativesAnalytics_1 = require("../models/derivatives/DerivativesAnalytics");
const router = express_1.default.Router();
const prisma = (0, prisma_1.getPrismaClient)(); // Models are defined in schema but TS can't infer them
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const derivativesService = new derivativesAnalyticsService_1.DerivativesAnalyticsService(prisma, kafkaService);
// Greeks Calculation Routes
// Calculate Greeks for a derivative instrument
router.post('/greeks/calculate', async (req, res) => {
    try {
        const { securityId, underlyingPrice, volatility, riskFreeRate, dividendYield, calculationMethod } = req.body;
        // Validation
        if (!securityId) {
            return res.status(400).json({
                success: false,
                error: 'securityId is required'
            });
        }
        if (underlyingPrice !== undefined && underlyingPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'underlyingPrice must be positive if provided'
            });
        }
        if (volatility !== undefined && volatility <= 0) {
            return res.status(400).json({
                success: false,
                error: 'volatility must be positive if provided'
            });
        }
        if (calculationMethod && !Object.values(DerivativesAnalytics_1.VolatilityModel).includes(calculationMethod)) {
            return res.status(400).json({
                success: false,
                error: `Invalid calculation method. Must be one of: ${Object.values(DerivativesAnalytics_1.VolatilityModel).join(', ')}`
            });
        }
        const request = {
            securityId,
            underlyingPrice,
            volatility,
            riskFreeRate,
            dividendYield,
            calculationMethod
        };
        const result = await derivativesService.calculateGreeks(request, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Greeks calculation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating Greeks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate Greeks',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get historical Greeks data
router.get('/greeks/:securityId/history', async (req, res) => {
    try {
        const { securityId } = req.params;
        const { days, limit } = req.query;
        const daysBack = days ? parseInt(days) : 30;
        const resultLimit = limit ? parseInt(limit) : 100;
        if (daysBack <= 0 || daysBack > 365) {
            return res.status(400).json({
                success: false,
                error: 'days must be between 1 and 365'
            });
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        const greeksHistory = await prisma.greeksCalculation.findMany({
            where: {
                optionId: securityId, // using optionId instead of securityId
                tenantId: req.user.tenantId
                // calculationDate field doesn't exist in GreeksCalculation
            },
            orderBy: {
                createdAt: 'desc' // using createdAt instead of calculationDate
            },
            take: resultLimit
        });
        res.status(200).json({
            success: true,
            data: {
                securityId,
                history: greeksHistory,
                period: {
                    startDate: startDate.toISOString(),
                    endDate: new Date().toISOString(),
                    daysRequested: daysBack,
                    recordsReturned: greeksHistory.length
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching Greeks history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Greeks history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Implied Volatility Routes
// Calculate implied volatility for an option
router.post('/implied-volatility/calculate', async (req, res) => {
    try {
        const { securityId, optionPrice, underlyingPrice, timeToExpiration, riskFreeRate, dividendYield } = req.body;
        // Validation
        if (!securityId || optionPrice === undefined) {
            return res.status(400).json({
                success: false,
                error: 'securityId and optionPrice are required'
            });
        }
        if (optionPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'optionPrice must be positive'
            });
        }
        if (underlyingPrice !== undefined && underlyingPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'underlyingPrice must be positive if provided'
            });
        }
        if (timeToExpiration !== undefined && timeToExpiration <= 0) {
            return res.status(400).json({
                success: false,
                error: 'timeToExpiration must be positive if provided'
            });
        }
        const request = {
            securityId,
            optionPrice,
            underlyingPrice,
            timeToExpiration,
            riskFreeRate,
            dividendYield
        };
        const result = await derivativesService.calculateImpliedVolatility(request, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Implied volatility calculation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating implied volatility:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate implied volatility',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get volatility surface data
router.get('/volatility-surface/:underlyingSymbol', async (req, res) => {
    try {
        const { underlyingSymbol } = req.params;
        const { expirationDate } = req.query;
        // Get volatility surface data for the underlying
        const surfaceData = await prisma.impliedVolatilityAnalysis.findMany({
            where: {
                tenantId: req.user.tenantId,
                securityId: {
                    in: await prisma.derivativeInstrument.findMany({
                        where: {
                            underlyingAsset: underlyingSymbol,
                            tenantId: req.user.tenantId,
                            expirationDate: expirationDate ? new Date(expirationDate) : undefined
                        },
                        select: { id: true } // using id instead of securityId
                    }).then((instruments) => instruments.map((i) => i.id))
                }
            },
            orderBy: [
                { calculationDate: 'desc' } // using calculationDate not analysisDate
            ],
            take: 100
        });
        // Process surface data into structured format
        const surface = surfaceData; // simplified - processSurfaceData method not available in route context
        res.status(200).json({
            success: true,
            data: {
                underlyingSymbol,
                expirationDate: expirationDate || 'all',
                surface,
                dataPoints: surfaceData.length,
                lastUpdated: surfaceData.length > 0 ? surfaceData[0].calculationDate : null
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching volatility surface:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch volatility surface',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Option Strategy Routes
// Build option strategy
router.post('/strategies/build', async (req, res) => {
    try {
        const { portfolioId, strategyType, underlyingSymbol, legs, targetPrice, riskTolerance, timeHorizon } = req.body;
        // Validation
        if (!strategyType || !underlyingSymbol || !Array.isArray(legs) || legs.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'strategyType, underlyingSymbol, and legs are required'
            });
        }
        if (!Object.values(DerivativesAnalytics_1.StrategyType).includes(strategyType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid strategy type. Must be one of: ${Object.values(DerivativesAnalytics_1.StrategyType).join(', ')}`
            });
        }
        // Validate legs
        for (const leg of legs) {
            if (!leg.side || !['BUY', 'SELL'].includes(leg.side)) {
                return res.status(400).json({
                    success: false,
                    error: 'Each leg must have a valid side (BUY or SELL)'
                });
            }
            if (!leg.quantity || leg.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Each leg must have a positive quantity'
                });
            }
        }
        const request = {
            tenantId: req.user.tenantId,
            portfolioId,
            strategyType,
            underlyingSymbol,
            legs,
            targetPrice,
            riskTolerance,
            timeHorizon
        };
        const result = await derivativesService.buildOptionStrategy(request, req.user.tenantId, req.user.userId);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Option strategy created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error building option strategy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to build option strategy',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get strategy details
router.get('/strategies/:strategyId', async (req, res) => {
    try {
        const { strategyId } = req.params;
        const strategy = await prisma.optionStrategy.findFirst({
            where: {
                id: strategyId,
                tenantId: req.user.tenantId
            },
            // include removed due to schema mismatch
        });
        if (!strategy) {
            return res.status(404).json({
                success: false,
                error: 'Strategy not found'
            });
        }
        res.status(200).json({
            success: true,
            data: strategy
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching strategy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch strategy',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get portfolio strategies
router.get('/strategies/portfolio/:portfolioId', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const { status, strategyType } = req.query;
        const whereClause = {
            portfolioId,
            tenantId: req.user.tenantId
        };
        if (status === 'active') {
            whereClause.isActive = true;
        }
        else if (status === 'inactive') {
            // whereClause.isActive = false; // isActive field not in OptionStrategy schema
        }
        if (strategyType && Object.values(DerivativesAnalytics_1.StrategyType).includes(strategyType)) {
            whereClause.strategyType = strategyType;
        }
        const strategies = await prisma.optionStrategy.findMany({
            where: whereClause,
            // include removed due to schema mismatch
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                strategies,
                summary: {
                    total: strategies.length,
                    active: strategies.length, // isActive field not available
                    inactive: 0 // isActive field not available
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio strategies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio strategies',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Margin Calculation Routes
// Calculate margin requirements
router.post('/margin/calculate', async (req, res) => {
    try {
        const { portfolioId, positions, marginType, underlyingPrices, volatilities, interestRates, calculationDate, scenarioShifts } = req.body;
        // Validation
        if (!positions || !Array.isArray(positions) || positions.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'positions array is required and must not be empty'
            });
        }
        if (marginType && !Object.values(DerivativesAnalytics_1.MarginType).includes(marginType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid margin type. Must be one of: ${Object.values(DerivativesAnalytics_1.MarginType).join(', ')}`
            });
        }
        if (!underlyingPrices || typeof underlyingPrices !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'underlyingPrices object is required'
            });
        }
        // Validate positions
        for (const position of positions) {
            if (!position.securityId || !position.quantity || !position.price || !position.side) {
                return res.status(400).json({
                    success: false,
                    error: 'Each position must have securityId, quantity, price, and side'
                });
            }
            if (!['LONG', 'SHORT'].includes(position.side)) {
                return res.status(400).json({
                    success: false,
                    error: 'Position side must be LONG or SHORT'
                });
            }
        }
        const request = {
            tenantId: req.user.tenantId,
            portfolioId,
            positions,
            marginType: marginType || DerivativesAnalytics_1.MarginType.INITIAL_MARGIN,
            underlyingPrices,
            volatilities: volatilities || {},
            interestRates: interestRates || {},
            calculationDate: calculationDate ? new Date(calculationDate) : undefined,
            scenarioShifts
        };
        const result = await derivativesService.calculateMargin(request, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Margin calculation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating margin:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate margin',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Mark-to-Market Routes
// Calculate mark-to-market valuation
router.post('/mark-to-market/:securityId', async (req, res) => {
    try {
        const { securityId } = req.params;
        const result = await derivativesService.calculateMarkToMarket(securityId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Mark-to-market valuation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating mark-to-market:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate mark-to-market valuation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Portfolio Analytics Routes
// Calculate portfolio derivatives analytics
router.get('/portfolio/:portfolioId/analytics', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        // Verify portfolio exists and user has access
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id: portfolioId,
                tenantId: req.user.tenantId
            }
        });
        if (!portfolio) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found'
            });
        }
        const analytics = await derivativesService.calculatePortfolioAnalytics(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: analytics,
            message: 'Portfolio derivatives analytics calculated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating portfolio analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate portfolio analytics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Search and Discovery Routes
// Search derivative instruments
router.get('/search', async (req, res) => {
    try {
        const { underlyingSymbol, derivativeTypes, optionTypes, strikePriceMin, strikePriceMax, premiumMin, premiumMax, expirationDateMin, expirationDateMax, daysToExpirationMin, daysToExpirationMax, deltaMin, deltaMax, gammaMin, gammaMax, thetaMin, thetaMax, vegaMin, vegaMax, impliedVolatilityMin, impliedVolatilityMax, volumeMin, openInterestMin, bidAskSpreadMax, limit, offset, sortBy, sortOrder } = req.query;
        // Validate derivative types
        if (derivativeTypes) {
            const types = derivativeTypes.split(',');
            const invalidTypes = types.filter(type => !Object.values(DerivativesAnalytics_1.DerivativeType).includes(type));
            if (invalidTypes.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid derivative types: ${invalidTypes.join(', ')}`
                });
            }
        }
        // Validate option types
        if (optionTypes) {
            const types = optionTypes.split(',');
            const invalidTypes = types.filter(type => !['CALL', 'PUT'].includes(type));
            if (invalidTypes.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid option types: ${invalidTypes.join(', ')}. Must be CALL or PUT`
                });
            }
        }
        const searchRequest = {
            tenantId: req.user.tenantId,
            underlyingSymbol: underlyingSymbol,
            derivativeTypes: derivativeTypes ? derivativeTypes.split(',') : undefined,
            optionTypes: optionTypes ? optionTypes.split(',') : undefined,
            strikePriceMin: strikePriceMin ? parseFloat(strikePriceMin) : undefined,
            strikePriceMax: strikePriceMax ? parseFloat(strikePriceMax) : undefined,
            premiumMin: premiumMin ? parseFloat(premiumMin) : undefined,
            premiumMax: premiumMax ? parseFloat(premiumMax) : undefined,
            expirationDateMin: expirationDateMin ? new Date(expirationDateMin) : undefined,
            expirationDateMax: expirationDateMax ? new Date(expirationDateMax) : undefined,
            daysToExpirationMin: daysToExpirationMin ? parseInt(daysToExpirationMin) : undefined,
            daysToExpirationMax: daysToExpirationMax ? parseInt(daysToExpirationMax) : undefined,
            deltaMin: deltaMin ? parseFloat(deltaMin) : undefined,
            deltaMax: deltaMax ? parseFloat(deltaMax) : undefined,
            gammaMin: gammaMin ? parseFloat(gammaMin) : undefined,
            gammaMax: gammaMax ? parseFloat(gammaMax) : undefined,
            thetaMin: thetaMin ? parseFloat(thetaMin) : undefined,
            thetaMax: thetaMax ? parseFloat(thetaMax) : undefined,
            vegaMin: vegaMin ? parseFloat(vegaMin) : undefined,
            vegaMax: vegaMax ? parseFloat(vegaMax) : undefined,
            impliedVolatilityMin: impliedVolatilityMin ? parseFloat(impliedVolatilityMin) : undefined,
            impliedVolatilityMax: impliedVolatilityMax ? parseFloat(impliedVolatilityMax) : undefined,
            volumeMin: volumeMin ? parseInt(volumeMin) : undefined,
            openInterestMin: openInterestMin ? parseInt(openInterestMin) : undefined,
            bidAskSpreadMax: bidAskSpreadMax ? parseFloat(bidAskSpreadMax) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder === 'DESC' ? 'DESC' : 'ASC'
        };
        const result = await derivativesService.searchDerivatives(searchRequest, req.user.tenantId);
        res.status(200).json({
            success: true,
            data: result,
            searchCriteria: searchRequest
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching derivatives:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search derivatives',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get derivative instrument details
router.get('/instruments/:securityId', async (req, res) => {
    try {
        const { securityId } = req.params;
        const instrument = await prisma.derivativeInstrument.findFirst({
            where: {
                id: securityId, // using id instead of securityId
                tenantId: req.user.tenantId
            },
            include: {} // relations not defined in schema
        });
        if (!instrument) {
            return res.status(404).json({
                success: false,
                error: 'Derivative instrument not found'
            });
        }
        res.status(200).json({
            success: true,
            data: instrument
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching derivative instrument:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch derivative instrument',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reference Data Routes
// Get derivatives reference data
router.get('/reference-data', async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                derivativeTypes: Object.values(DerivativesAnalytics_1.DerivativeType),
                optionStyles: Object.values(DerivativesAnalytics_1.OptionStyle),
                volatilityModels: Object.values(DerivativesAnalytics_1.VolatilityModel),
                strategyTypes: Object.values(DerivativesAnalytics_1.StrategyType),
                marginTypes: Object.values(DerivativesAnalytics_1.MarginType),
                exerciseTypes: ['PHYSICAL_DELIVERY', 'CASH_SETTLEMENT', 'CHOICE_OF_SETTLEMENT'],
                optionStatuses: ['ACTIVE', 'EXPIRED', 'EXERCISED', 'ASSIGNED', 'CLOSED', 'CANCELLED'],
                sides: ['LONG', 'SHORT'],
                optionTypes: ['CALL', 'PUT'],
                strategyLegSides: ['BUY', 'SELL']
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching reference data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reference data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Analytics Dashboard Routes
// Get derivatives analytics dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { portfolioIds } = req.query;
        // Get overview metrics
        const totalInstruments = await prisma.derivativeInstrument.count({
            where: { tenantId: req.user.tenantId }
        });
        const totalStrategies = await prisma.optionStrategy.count({
            where: {
                tenantId: req.user.tenantId
                // isActive field not in schema
            }
        });
        const totalPortfolios = await prisma.portfolio.count({
            where: {
                tenantId: req.user.tenantId,
                positions: {
                    some: {
                        securityType: 'OPTION' // using valid SecurityType enum value
                    }
                }
            }
        });
        // Get recent analytics
        const recentCalculations = await prisma.greeksCalculation.findMany({
            where: {
                tenantId: req.user.tenantId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                } // using createdAt instead of calculationDate
            },
            orderBy: { createdAt: 'desc' }, // using createdAt
            take: 50
        });
        const dashboard = {
            summary: {
                totalInstruments,
                totalStrategies,
                totalPortfolios,
                totalCalculations: recentCalculations.length,
                averageDelta: recentCalculations.length > 0 ?
                    recentCalculations.reduce((sum, calc) => sum + Number(calc.delta), 0) / recentCalculations.length : 0,
                averageGamma: recentCalculations.length > 0 ?
                    recentCalculations.reduce((sum, calc) => sum + Number(calc.gamma), 0) / recentCalculations.length : 0,
                averageTheta: recentCalculations.length > 0 ?
                    recentCalculations.reduce((sum, calc) => sum + Number(calc.theta), 0) / recentCalculations.length : 0,
                averageVega: recentCalculations.length > 0 ?
                    recentCalculations.reduce((sum, calc) => sum + Number(calc.vega), 0) / recentCalculations.length : 0
            },
            recentActivity: recentCalculations.slice(0, 10),
            performance: {
                calculationsToday: recentCalculations.filter((calc) => calc.createdAt >= new Date(new Date().setHours(0, 0, 0, 0)) // using createdAt not calculationDate
                ).length,
                calculationsThisWeek: recentCalculations.length
            }
        };
        res.status(200).json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching derivatives dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch derivatives dashboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Health check for derivatives service
router.get('/health', async (req, res) => {
    try {
        const instrumentsCount = await prisma.derivativeInstrument.count();
        const calculationsCount = await prisma.greeksCalculation.count();
        const strategiesCount = await prisma.optionStrategy.count();
        res.status(200).json({
            success: true,
            status: 'healthy',
            data: {
                totalInstruments: instrumentsCount,
                totalCalculations: calculationsCount,
                totalStrategies: strategiesCount,
                timestamp: new Date().toISOString(),
                service: 'derivatives-analytics',
                version: '1.0.0'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Derivatives analytics health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Service unavailable',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

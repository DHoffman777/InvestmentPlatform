"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const metrics_1 = require("../middleware/metrics");
const router = (0, express_1.Router)();
exports.performanceRoutes = router;
const prisma = new client_1.PrismaClient();
// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
        });
    }
    next();
};
// GET /api/performance/portfolios/:id - Get portfolio performance
router.get('/portfolios/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
    (0, express_validator_1.query)('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL']),
    (0, express_validator_1.query)('benchmark').optional().isString().trim(),
    (0, express_validator_1.query)('includeReturns').optional().isBoolean().toBoolean(),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['performance:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '1M', benchmark, includeReturns = true } = req.query;
        // Verify user has access to the portfolio
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id,
                tenantId: req.user.tenantId,
                OR: [
                    { ownerId: req.user.sub },
                    {
                        managers: {
                            some: {
                                userId: req.user.sub,
                                status: 'ACTIVE'
                            }
                        }
                    }
                ]
            },
            include: {
                positions: {
                    where: { quantity: { gt: 0 } }
                }
            }
        });
        if (!portfolio) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        // Calculate date range based on period
        let startDate;
        const now = new Date();
        switch (period) {
            case '1D':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1W':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '3M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case '6M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case '1Y':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case 'YTD':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(2000, 0, 1); // Start of time for ALL
        }
        // Get performance measurements
        const performanceMeasurements = await prisma.performanceMeasurement.findMany({
            where: {
                portfolioId: id,
                measurementDate: { gte: startDate }
            },
            orderBy: { measurementDate: 'asc' }
        });
        // Calculate current portfolio metrics
        const totalValue = portfolio.totalValue.toNumber();
        const cashBalance = portfolio.cashBalance.toNumber();
        const totalPositionValue = portfolio.positions.reduce((sum, pos) => sum + (pos.marketValue?.toNumber() || 0), 0);
        const totalGainLoss = portfolio.positions.reduce((sum, pos) => sum + (pos.gainLoss?.toNumber() || 0), 0);
        const totalDayChange = portfolio.positions.reduce((sum, pos) => sum + (pos.dayChange?.toNumber() || 0), 0);
        const performance = {
            portfolio: {
                id: portfolio.id,
                name: portfolio.name,
                totalValue,
                cashBalance,
                totalPositionValue,
                totalGainLoss,
                totalGainLossPercentage: totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0,
                totalDayChange,
                totalDayChangePercentage: totalValue > 0 ? (totalDayChange / totalValue) * 100 : 0,
                positionCount: portfolio.positions.length
            },
            period,
            measurements: performanceMeasurements.map(m => ({
                date: m.measurementDate,
                totalValue: m.totalValue?.toNumber() || 0,
                cashBalance: m.cashBalance?.toNumber() || 0,
                totalReturn: m.totalReturn?.toNumber() || 0,
                returnPercentage: m.returnPercentage?.toNumber() || 0,
                volatility: m.volatility?.toNumber() || 0,
                sharpeRatio: m.sharpeRatio?.toNumber() || 0,
                maxDrawdown: m.maxDrawdown?.toNumber() || 0,
                alpha: m.alpha?.toNumber() || 0,
                beta: m.beta?.toNumber() || 0
            }))
        };
        // Include benchmark comparison if requested
        if (benchmark) {
            // This would typically fetch benchmark data from market data service
            // For now, we'll return a placeholder structure
            performance['benchmark'] = {
                symbol: benchmark,
                measurements: performanceMeasurements.map(m => ({
                    date: m.measurementDate,
                    value: 0, // Would be fetched from market data
                    return: 0
                }))
            };
        }
        (0, metrics_1.trackPortfolioOperation)('performance:read');
        res.json(performance);
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio performance:', error);
        (0, metrics_1.trackPortfolioOperation)('performance:read', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch portfolio performance',
        });
    }
});
// GET /api/performance/portfolios/:id/attribution - Get performance attribution
router.get('/portfolios/:id/attribution', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
    (0, express_validator_1.query)('period').optional().isIn(['1M', '3M', '6M', '1Y', 'YTD']),
    (0, express_validator_1.query)('attributionType').optional().isIn(['SECTOR', 'ASSET_CLASS', 'SECURITY', 'GEOGRAPHY']),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['performance:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '1M', attributionType = 'ASSET_CLASS' } = req.query;
        // Verify user has access to the portfolio
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id,
                tenantId: req.user.tenantId,
                OR: [
                    { ownerId: req.user.sub },
                    {
                        managers: {
                            some: {
                                userId: req.user.sub,
                                status: 'ACTIVE'
                            }
                        }
                    }
                ]
            }
        });
        if (!portfolio) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        // Calculate date range
        let startDate;
        const now = new Date();
        switch (period) {
            case '1M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '3M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case '6M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case '1Y':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case 'YTD':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }
        // Get attribution analysis
        const attributionAnalysis = await prisma.attributionAnalysis.findMany({
            where: {
                portfolioId: id,
                analysisDate: { gte: startDate },
                attributionType
            },
            orderBy: { analysisDate: 'desc' }
        });
        // Get positions with their performance for the period
        const positions = await prisma.position.findMany({
            where: {
                portfolioId: id,
                quantity: { gt: 0 }
            },
            include: {
                security: {
                    select: {
                        symbol: true,
                        name: true,
                        assetClass: true,
                        sector: true,
                        geography: true
                    }
                }
            }
        });
        // Group positions by attribution type
        const attributionData = new Map();
        const totalPortfolioValue = portfolio.totalValue.toNumber();
        positions.forEach(position => {
            let groupKey;
            switch (attributionType) {
                case 'ASSET_CLASS':
                    groupKey = position.security?.assetClass || 'OTHER';
                    break;
                case 'SECTOR':
                    groupKey = position.security?.sector || 'OTHER';
                    break;
                case 'GEOGRAPHY':
                    groupKey = position.security?.geography || 'OTHER';
                    break;
                case 'SECURITY':
                    groupKey = position.security?.symbol || 'UNKNOWN';
                    break;
                default:
                    groupKey = 'OTHER';
            }
            const marketValue = position.marketValue?.toNumber() || 0;
            const gainLoss = position.gainLoss?.toNumber() || 0;
            const weight = totalPortfolioValue > 0 ? (marketValue / totalPortfolioValue) * 100 : 0;
            const contribution = totalPortfolioValue > 0 ? (gainLoss / totalPortfolioValue) * 100 : 0;
            if (attributionData.has(groupKey)) {
                const existing = attributionData.get(groupKey);
                existing.marketValue += marketValue;
                existing.gainLoss += gainLoss;
                existing.weight = (existing.marketValue / totalPortfolioValue) * 100;
                existing.contribution = (existing.gainLoss / totalPortfolioValue) * 100;
                existing.positionCount += 1;
            }
            else {
                attributionData.set(groupKey, {
                    category: groupKey,
                    marketValue,
                    gainLoss,
                    weight,
                    contribution,
                    positionCount: 1
                });
            }
        });
        const attribution = {
            portfolio: {
                id: portfolio.id,
                name: portfolio.name,
                totalValue: totalPortfolioValue
            },
            period,
            attributionType,
            analysis: Array.from(attributionData.values()).sort((a, b) => b.weight - a.weight),
            historicalAnalysis: attributionAnalysis.map(a => ({
                date: a.analysisDate,
                category: a.category,
                weight: a.weight?.toNumber() || 0,
                return: a.totalReturn?.toNumber() || 0,
                contribution: a.contribution?.toNumber() || 0,
                selectionEffect: a.selectionEffect?.toNumber() || 0,
                allocationEffect: a.allocationEffect?.toNumber() || 0
            }))
        };
        res.json(attribution);
    }
    catch (error) {
        logger_1.logger.error('Error fetching performance attribution:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch performance attribution',
        });
    }
});
// GET /api/performance/portfolios/:id/risk-metrics - Get portfolio risk metrics
router.get('/portfolios/:id/risk-metrics', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
    (0, express_validator_1.query)('period').optional().isIn(['1M', '3M', '6M', '1Y', 'ALL']),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['performance:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '1Y' } = req.query;
        // Verify user has access to the portfolio
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id,
                tenantId: req.user.tenantId,
                OR: [
                    { ownerId: req.user.sub },
                    {
                        managers: {
                            some: {
                                userId: req.user.sub,
                                status: 'ACTIVE'
                            }
                        }
                    }
                ]
            }
        });
        if (!portfolio) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        // Calculate date range
        let startDate;
        const now = new Date();
        switch (period) {
            case '1M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '3M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case '6M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case '1Y':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = new Date(2000, 0, 1);
        }
        // Get performance measurements for risk calculations
        const measurements = await prisma.performanceMeasurement.findMany({
            where: {
                portfolioId: id,
                measurementDate: { gte: startDate }
            },
            orderBy: { measurementDate: 'asc' }
        });
        if (measurements.length === 0) {
            return res.json({
                portfolio: {
                    id: portfolio.id,
                    name: portfolio.name
                },
                period,
                riskMetrics: {
                    volatility: 0,
                    sharpeRatio: 0,
                    maxDrawdown: 0,
                    valueAtRisk: 0,
                    beta: 0,
                    alpha: 0,
                    trackingError: 0,
                    informationRatio: 0
                },
                message: 'Insufficient historical data for risk calculations'
            });
        }
        // Get the latest measurement for current metrics
        const latestMeasurement = measurements[measurements.length - 1];
        const riskMetrics = {
            volatility: latestMeasurement.volatility?.toNumber() || 0,
            sharpeRatio: latestMeasurement.sharpeRatio?.toNumber() || 0,
            maxDrawdown: latestMeasurement.maxDrawdown?.toNumber() || 0,
            valueAtRisk: latestMeasurement.valueAtRisk?.toNumber() || 0,
            beta: latestMeasurement.beta?.toNumber() || 0,
            alpha: latestMeasurement.alpha?.toNumber() || 0,
            trackingError: latestMeasurement.trackingError?.toNumber() || 0,
            informationRatio: latestMeasurement.informationRatio?.toNumber() || 0,
            sortinoRatio: latestMeasurement.sortinoRatio?.toNumber() || 0,
            calmarRatio: latestMeasurement.calmarRatio?.toNumber() || 0
        };
        res.json({
            portfolio: {
                id: portfolio.id,
                name: portfolio.name,
                totalValue: portfolio.totalValue.toNumber()
            },
            period,
            riskMetrics,
            measurementCount: measurements.length,
            dataRange: {
                startDate: measurements[0].measurementDate,
                endDate: latestMeasurement.measurementDate
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching risk metrics:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch risk metrics',
        });
    }
});

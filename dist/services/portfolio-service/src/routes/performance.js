"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceRoutes = void 0;
const express_1 = require("express");
const { param, query, validationResult } = require('express-validator');
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const metrics_1 = require("../middleware/metrics");
const router = (0, express_1.Router)();
exports.performanceRoutes = router;
const prisma = new client_1.PrismaClient();
// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
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
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    query('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL']),
    query('benchmark').optional().isString().trim(),
    query('includeReturns').optional().isBoolean().toBoolean(),
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
                    { managerId: req.user.sub } // using managerId field instead of managers relation
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
                createdAt: { gte: startDate } // using createdAt instead of measurementDate
            },
            orderBy: { createdAt: 'asc' } // using createdAt instead of measurementDate
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
                date: m.createdAt, // using createdAt instead of measurementDate
                totalValue: m.totalReturn?.toNumber() || 0, // using available field
                cashBalance: 0, // field not available in schema
                totalReturn: m.totalReturn?.toNumber() || 0,
                returnPercentage: 0, // field not available in schema
                volatility: 0, // field not available in schema
                sharpeRatio: m.sharpeRatio?.toNumber() || 0,
                maxDrawdown: 0, // field not available in schema
                alpha: m.alphaValue?.toNumber() || 0, // using alphaValue field
                beta: m.betaValue?.toNumber() || 0 // using betaValue field
            }))
        };
        // Include benchmark comparison if requested
        if (benchmark) {
            // This would typically fetch benchmark data from market data service
            // For now, we'll return a placeholder structure
            performance['benchmark'] = {
                symbol: benchmark,
                measurements: performanceMeasurements.map(m => ({
                    date: m.createdAt, // using createdAt instead of measurementDate
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
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    query('period').optional().isIn(['1M', '3M', '6M', '1Y', 'YTD']),
    query('attributionType').optional().isIn(['SECTOR', 'ASSET_CLASS', 'SECURITY', 'GEOGRAPHY']),
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
                    { managerId: req.user.sub } // using managerId field instead of managers relation
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
        // Get attribution analysis - using available fields
        const attributionAnalysis = await prisma.attributionAnalysis.findMany({
            where: {
                portfolioId: id,
                createdAt: { gte: startDate } // using createdAt instead of analysisDate
            },
            orderBy: { createdAt: 'desc' }
        });
        // Get positions with their performance for the period
        const positions = await prisma.position.findMany({
            where: {
                portfolioId: id,
                quantity: { gt: 0 }
            },
            // Note: security relation not available in schema, using position fields directly
        });
        // Group positions by attribution type
        const attributionData = new Map();
        const totalPortfolioValue = portfolio.totalValue.toNumber();
        positions.forEach(position => {
            let groupKey;
            switch (attributionType) {
                case 'ASSET_CLASS':
                    groupKey = position.assetClass || position.securityType || 'OTHER';
                    break;
                case 'SECTOR':
                    groupKey = position.sector || 'OTHER';
                    break;
                case 'GEOGRAPHY':
                    groupKey = position.geography || 'OTHER';
                    break;
                case 'SECURITY':
                    groupKey = position.symbol || 'UNKNOWN';
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
                date: a.createdAt, // using createdAt instead of analysisDate
                category: a.category || 'UNKNOWN',
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
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    query('period').optional().isIn(['1M', '3M', '6M', '1Y', 'ALL']),
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
                    { managerId: req.user.sub } // using managerId field instead of managers relation
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
                createdAt: { gte: startDate } // using createdAt instead of measurementDate
            },
            orderBy: { createdAt: 'asc' } // using createdAt instead of measurementDate
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
            beta: latestMeasurement.betaValue?.toNumber() || 0,
            alpha: latestMeasurement.alphaValue?.toNumber() || 0,
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
                startDate: measurements[0].createdAt, // using createdAt instead of measurementDate
                endDate: latestMeasurement.createdAt // using createdAt instead of measurementDate
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionManagementRouter = void 0;
const express_1 = require("express");
const { body, param, query, validationResult } = require('express-validator');
const client_1 = require("@prisma/client");
const positionService_1 = require("../services/positionService");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const metrics_1 = require("../middleware/metrics");
const router = (0, express_1.Router)();
exports.positionManagementRouter = router;
const prisma = new client_1.PrismaClient();
const positionService = new positionService_1.PositionService(prisma);
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
// GET /api/position-management/aggregated - Get aggregated positions across portfolios
router.get('/aggregated', [
    query('portfolioIds').optional().isString().withMessage('Portfolio IDs must be comma-separated string'),
    query('assetClasses').optional().isString().withMessage('Asset classes must be comma-separated string'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:read']), async (req, res) => {
    try {
        const { portfolioIds, assetClasses } = req.query;
        const portfolioIdArray = portfolioIds ? portfolioIds.split(',').filter((id) => id.trim()) : undefined;
        const assetClassArray = assetClasses ? assetClasses.split(',').filter((ac) => ac.trim()) : undefined;
        const aggregatedPositions = await positionService.getAggregatedPositions(req.user.tenantId, portfolioIdArray, assetClassArray);
        const formattedPositions = aggregatedPositions.map(position => ({
            ...position,
            totalQuantity: position.totalQuantity.toNumber(),
            averageCostBasis: position.averageCostBasis.toNumber(),
            totalCostBasis: position.totalCostBasis.toNumber(),
            currentMarketValue: position.currentMarketValue.toNumber(),
            unrealizedGainLoss: position.unrealizedGainLoss.toNumber(),
            unrealizedGainLossPercentage: position.unrealizedGainLossPercentage.toNumber(),
            dayChange: position.dayChange.toNumber(),
            dayChangePercentage: position.dayChangePercentage.toNumber(),
            taxLots: position.taxLots.map(lot => ({
                ...lot,
                quantity: lot.quantity.toNumber(),
                costBasis: lot.costBasis.toNumber(),
                gainLoss: lot.gainLoss?.toNumber(),
            }))
        }));
        (0, metrics_1.trackPortfolioOperation)('position:aggregated');
        res.json({
            aggregatedPositions: formattedPositions,
            count: formattedPositions.length,
            filters: {
                portfolioIds: portfolioIdArray,
                assetClasses: assetClassArray,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching aggregated positions:', error);
        (0, metrics_1.trackPortfolioOperation)('position:aggregated', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch aggregated positions',
        });
    }
});
// POST /api/position-management/:id/tax-lots - Calculate tax lots for sale
router.post('/:id/tax-lots', [
    param('id').isUUID().withMessage('Invalid position ID'),
    body('sellQuantity').isNumeric().withMessage('Sell quantity must be numeric'),
    body('method').isIn(['FIFO', 'LIFO', 'HIFO', 'SPECIFIC_ID', 'AVERAGE_COST']).withMessage('Invalid tax lot method'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { sellQuantity, method } = req.body;
        // Verify user has access to the position
        const position = await prisma.position.findFirst({
            where: {
                id,
                portfolio: {
                    tenantId: req.user.tenantId,
                    OR: [
                        { ownerId: req.user.sub },
                        { managerId: req.user.sub }
                    ]
                }
            }
        });
        if (!position) {
            return res.status(404).json({
                error: 'Position not found',
                message: 'Position does not exist or you do not have access',
            });
        }
        const taxLots = await positionService.calculateTaxLots(id, new client_1.Prisma.Decimal(sellQuantity), method);
        const formattedTaxLots = taxLots.map(lot => ({
            method: lot.method,
            quantity: lot.quantity.toNumber(),
            costBasis: lot.costBasis.toNumber(),
            realizedGainLoss: lot.realizedGainLoss?.toNumber(),
        }));
        (0, metrics_1.trackPortfolioOperation)('position:tax-lots');
        res.json({
            positionId: id,
            sellQuantity: parseFloat(sellQuantity),
            method,
            taxLots: formattedTaxLots,
            totalQuantity: formattedTaxLots.reduce((sum, lot) => sum + lot.quantity, 0),
            totalCostBasis: formattedTaxLots.reduce((sum, lot) => sum + lot.costBasis, 0),
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating tax lots:', { positionId: req.params.id, error });
        (0, metrics_1.trackPortfolioOperation)('position:tax-lots', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Failed to calculate tax lots',
        });
    }
});
// POST /api/position-management/portfolios/:id/reconcile - Reconcile positions with custodian
router.post('/portfolios/:id/reconcile', [
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    body('custodianPositions').isArray().withMessage('Custodian positions must be an array'),
    body('custodianPositions.*.symbol').isString().withMessage('Symbol is required'),
    body('custodianPositions.*.quantity').isNumeric().withMessage('Quantity must be numeric'),
    body('custodianPositions.*.marketValue').isNumeric().withMessage('Market value must be numeric'),
    body('custodianPositions.*.costBasis').optional().isNumeric().withMessage('Cost basis must be numeric'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:reconcile']), async (req, res) => {
    try {
        const { id } = req.params;
        const { custodianPositions } = req.body;
        // Verify user has access to the portfolio
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id,
                tenantId: req.user.tenantId,
                OR: [
                    { ownerId: req.user.sub },
                    { managerId: req.user.sub }
                ]
            }
        });
        if (!portfolio) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        const reconciliation = await positionService.reconcilePositions(id, custodianPositions);
        (0, metrics_1.trackPortfolioOperation)('position:reconcile');
        res.json({
            portfolioId: id,
            reconciliation: {
                ...reconciliation,
                summary: {
                    totalPositions: custodianPositions.length,
                    matches: reconciliation.matches.length,
                    discrepancies: reconciliation.discrepancies.length,
                    missing: reconciliation.missing.length,
                    extra: reconciliation.extra.length,
                }
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error reconciling positions:', { portfolioId: req.params.id, error });
        (0, metrics_1.trackPortfolioOperation)('position:reconcile', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to reconcile positions',
        });
    }
});
// GET /api/position-management/:id/pnl - Get position P&L analysis
router.get('/:id/pnl', [
    param('id').isUUID().withMessage('Invalid position ID'),
    query('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').isISO8601().toDate().withMessage('Invalid end date'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        // Verify user has access to the position
        const position = await prisma.position.findFirst({
            where: {
                id,
                portfolio: {
                    tenantId: req.user.tenantId,
                    OR: [
                        { ownerId: req.user.sub },
                        { managerId: req.user.sub }
                    ]
                }
            },
            select: {
                id: true,
                symbol: true,
                portfolioId: true,
                securityId: true,
                quantity: true,
                marketValue: true
            }
        });
        if (!position) {
            return res.status(404).json({
                error: 'Position not found',
                message: 'Position does not exist or you do not have access',
            });
        }
        const pnlAnalysis = await positionService.calculatePositionPnL(id, startDate, endDate);
        (0, metrics_1.trackPortfolioOperation)('position:pnl');
        res.json({
            positionId: id,
            security: { symbol: position.symbol },
            position: {
                id: position.id,
                symbol: position.symbol,
                portfolioId: position.portfolioId
            },
            period: {
                startDate,
                endDate,
            },
            pnlAnalysis: {
                realizedPnL: pnlAnalysis.realizedPnL.toNumber(),
                unrealizedPnL: pnlAnalysis.unrealizedPnL.toNumber(),
                totalPnL: pnlAnalysis.totalPnL.toNumber(),
                dividends: pnlAnalysis.dividends.toNumber(),
                fees: pnlAnalysis.fees.toNumber(),
                transactions: pnlAnalysis.transactions.map(tx => ({
                    ...tx,
                    quantity: tx.quantity.toNumber(),
                    price: tx.price?.toNumber(),
                    netAmount: tx.netAmount?.toNumber(),
                    fees: tx.fees?.toNumber(),
                    taxes: tx.taxes?.toNumber(),
                }))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating position P&L:', { positionId: req.params.id, error });
        (0, metrics_1.trackPortfolioOperation)('position:pnl', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to calculate position P&L',
        });
    }
});
// PUT /api/position-management/:id/market-value - Update position market value
router.put('/:id/market-value', [
    param('id').isUUID().withMessage('Invalid position ID'),
    body('marketPrice').isNumeric().withMessage('Market price must be numeric'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:update']), async (req, res) => {
    try {
        const { id } = req.params;
        const { marketPrice } = req.body;
        // Verify user has access to the position
        const position = await prisma.position.findFirst({
            where: {
                id,
                portfolio: {
                    tenantId: req.user.tenantId,
                    OR: [
                        { ownerId: req.user.sub },
                        { managerId: req.user.sub }
                    ]
                }
            }
        });
        if (!position) {
            return res.status(404).json({
                error: 'Position not found',
                message: 'Position does not exist or you do not have access',
            });
        }
        const updatedPosition = await positionService.updatePositionMarketValue(id, new client_1.Prisma.Decimal(marketPrice));
        (0, metrics_1.trackPortfolioOperation)('position:update-market-value');
        res.json({
            position: {
                ...updatedPosition,
                quantity: updatedPosition.quantity.toNumber(),
                costBasis: updatedPosition.costBasis?.toNumber(),
                marketValue: updatedPosition.marketValue?.toNumber(),
                gainLoss: updatedPosition.gainLoss?.toNumber(),
                gainLossPercentage: updatedPosition.gainLossPercentage?.toNumber(),
                dayChange: updatedPosition.dayChange?.toNumber(),
                dayChangePercentage: updatedPosition.dayChangePercentage?.toNumber(),
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating position market value:', { positionId: req.params.id, error });
        (0, metrics_1.trackPortfolioOperation)('position:update-market-value', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update position market value',
        });
    }
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const metrics_1 = require("../middleware/metrics");
const router = (0, express_1.Router)();
exports.positionRoutes = router;
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
// GET /api/positions - List positions for a portfolio
router.get('/', [
    (0, express_validator_1.query)('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('assetClass').optional().isString().trim(),
    (0, express_validator_1.query)('search').optional().isString().trim(),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:read']), async (req, res) => {
    try {
        const { portfolioId, page = 1, limit = 20, assetClass, search, } = req.query;
        // Verify user has access to the portfolio
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id: portfolioId,
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
        const skip = (page - 1) * limit;
        const whereClause = {
            portfolioId,
            quantity: { gt: 0 } // Only show positions with quantity > 0
        };
        if (assetClass) {
            whereClause.security = {
                assetClass
            };
        }
        if (search) {
            whereClause.OR = [
                { security: { symbol: { contains: search, mode: 'insensitive' } } },
                { security: { name: { contains: search, mode: 'insensitive' } } },
                { security: { cusip: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const [positions, total] = await Promise.all([
            prisma.position.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { marketValue: 'desc' },
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                            assetClass: true,
                            currency: true,
                            exchange: true,
                            cusip: true,
                            isin: true
                        }
                    },
                    taxLots: {
                        where: { quantity: { gt: 0 } },
                        orderBy: { openDate: 'asc' },
                        select: {
                            id: true,
                            quantity: true,
                            costBasis: true,
                            openDate: true,
                            gainLoss: true
                        }
                    }
                }
            }),
            prisma.position.count({ where: whereClause })
        ]);
        (0, metrics_1.trackPortfolioOperation)('position:list');
        res.json({
            positions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching positions:', error);
        (0, metrics_1.trackPortfolioOperation)('position:list', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch positions',
        });
    }
});
// GET /api/positions/:id - Get specific position
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid position ID'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const position = await prisma.position.findFirst({
            where: {
                id,
                portfolio: {
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
            },
            include: {
                security: true,
                portfolio: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                taxLots: {
                    where: { quantity: { gt: 0 } },
                    orderBy: { openDate: 'asc' }
                },
                transactions: {
                    orderBy: { transactionDate: 'desc' },
                    take: 10,
                    include: {
                        security: {
                            select: {
                                symbol: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!position) {
            return res.status(404).json({
                error: 'Position not found',
                message: 'Position does not exist or you do not have access',
            });
        }
        (0, metrics_1.trackPortfolioOperation)('position:read');
        res.json(position);
    }
    catch (error) {
        logger_1.logger.error('Error fetching position:', error);
        (0, metrics_1.trackPortfolioOperation)('position:read', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch position',
        });
    }
});
// GET /api/positions/:id/tax-lots - Get position tax lots
router.get('/:id/tax-lots', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid position ID'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        // Verify user has access to the position
        const position = await prisma.position.findFirst({
            where: {
                id,
                portfolio: {
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
            }
        });
        if (!position) {
            return res.status(404).json({
                error: 'Position not found',
                message: 'Position does not exist or you do not have access',
            });
        }
        const skip = (page - 1) * limit;
        const [taxLots, total] = await Promise.all([
            prisma.taxLot.findMany({
                where: {
                    positionId: id,
                    quantity: { gt: 0 }
                },
                skip,
                take: limit,
                orderBy: { openDate: 'asc' }
            }),
            prisma.taxLot.count({
                where: {
                    positionId: id,
                    quantity: { gt: 0 }
                }
            })
        ]);
        res.json({
            taxLots,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching tax lots:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch tax lots',
        });
    }
});
// GET /api/positions/:id/performance - Get position performance
router.get('/:id/performance', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid position ID'),
    (0, express_validator_1.query)('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL']),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['position:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '1M' } = req.query;
        // Verify user has access to the position
        const position = await prisma.position.findFirst({
            where: {
                id,
                portfolio: {
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
            },
            include: {
                security: {
                    select: {
                        symbol: true,
                        name: true
                    }
                }
            }
        });
        if (!position) {
            return res.status(404).json({
                error: 'Position not found',
                message: 'Position does not exist or you do not have access',
            });
        }
        // Calculate performance metrics based on the period
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
        // Get performance measurements for the period
        const performanceMeasurements = await prisma.performanceMeasurement.findMany({
            where: {
                portfolioId: position.portfolioId,
                measurementDate: { gte: startDate }
            },
            orderBy: { measurementDate: 'asc' }
        });
        const performance = {
            position: {
                id: position.id,
                security: position.security,
                currentValue: position.marketValue?.toNumber() || 0,
                quantity: position.quantity.toNumber(),
                costBasis: position.costBasis?.toNumber() || 0,
                gainLoss: position.gainLoss?.toNumber() || 0,
                gainLossPercentage: position.gainLossPercentage?.toNumber() || 0,
                dayChange: position.dayChange?.toNumber() || 0,
                dayChangePercentage: position.dayChangePercentage?.toNumber() || 0
            },
            period,
            measurements: performanceMeasurements.map(m => ({
                date: m.measurementDate,
                value: m.totalReturn?.toNumber() || 0,
                returnPercentage: m.returnPercentage?.toNumber() || 0
            }))
        };
        res.json(performance);
    }
    catch (error) {
        logger_1.logger.error('Error fetching position performance:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch position performance',
        });
    }
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securitiesRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const marketDataService_1 = require("../services/marketDataService");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.securitiesRouter = router;
const marketDataService = new marketDataService_1.MarketDataService(database_1.prisma);
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
// GET /api/securities/search - Search securities
router.get('/search', [
    (0, express_validator_1.query)('q').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Query must be between 1 and 50 characters'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:read']), async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;
        const securities = await marketDataService.searchSecurities(query, limit);
        const formattedSecurities = securities.map(security => ({
            ...security,
            marketCap: security.marketCap?.toNumber(),
        }));
        res.json({
            query,
            securities: formattedSecurities,
            count: formattedSecurities.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching securities:', { query: req.query.q, error });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to search securities',
        });
    }
});
// GET /api/securities/:symbol - Get security details
router.get('/:symbol', [
    (0, express_validator_1.param)('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:read']), async (req, res) => {
    try {
        const { symbol } = req.params;
        const security = await database_1.prisma.security.findUnique({
            where: { symbol: symbol.toUpperCase() }
        });
        if (!security) {
            return res.status(404).json({
                error: 'Security not found',
                message: `Security with symbol ${symbol} not found`,
            });
        }
        res.json({
            security: {
                ...security,
                marketCap: security.marketCap?.toNumber(),
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching security:', { symbol: req.params.symbol, error });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch security',
        });
    }
});
// POST /api/securities - Create or update security (admin only)
router.post('/', [
    (0, express_validator_1.body)('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required and must be 1-10 characters'),
    (0, express_validator_1.body)('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required and must be 1-255 characters'),
    (0, express_validator_1.body)('assetClass').isIn(['EQUITY', 'BOND', 'ETF', 'MUTUAL_FUND', 'OPTION', 'FUTURE', 'COMMODITY', 'CRYPTOCURRENCY', 'CASH']).withMessage('Invalid asset class'),
    (0, express_validator_1.body)('securityType').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Security type is required'),
    (0, express_validator_1.body)('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    (0, express_validator_1.body)('currency').optional().isString().trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    (0, express_validator_1.body)('cusip').optional().isString().trim().isLength({ min: 9, max: 9 }).withMessage('CUSIP must be 9 characters'),
    (0, express_validator_1.body)('isin').optional().isString().trim().isLength({ min: 12, max: 12 }).withMessage('ISIN must be 12 characters'),
    (0, express_validator_1.body)('country').optional().isString().trim().withMessage('Invalid country'),
    (0, express_validator_1.body)('sector').optional().isString().trim().withMessage('Invalid sector'),
    (0, express_validator_1.body)('industry').optional().isString().trim().withMessage('Invalid industry'),
    (0, express_validator_1.body)('marketCap').optional().isNumeric().withMessage('Market cap must be numeric'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:write']), async (req, res) => {
    try {
        const securityData = {
            ...req.body,
            symbol: req.body.symbol.toUpperCase(),
        };
        const security = await marketDataService.upsertSecurity(securityData);
        res.status(201).json({
            security: {
                ...security,
                marketCap: security.marketCap?.toNumber(),
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating/updating security:', { securityData: req.body, error });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create/update security',
        });
    }
});
// GET /api/securities - List securities with filtering
router.get('/', [
    (0, express_validator_1.query)('assetClass').optional().isIn(['EQUITY', 'BOND', 'ETF', 'MUTUAL_FUND', 'OPTION', 'FUTURE', 'COMMODITY', 'CRYPTOCURRENCY', 'CASH']).withMessage('Invalid asset class'),
    (0, express_validator_1.query)('exchange').optional().isString().trim().withMessage('Invalid exchange'),
    (0, express_validator_1.query)('country').optional().isString().trim().withMessage('Invalid country'),
    (0, express_validator_1.query)('sector').optional().isString().trim().withMessage('Invalid sector'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be >= 1'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:read']), async (req, res) => {
    try {
        const { assetClass, exchange, country, sector, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const whereClause = {
            isActive: true,
        };
        if (assetClass)
            whereClause.assetClass = assetClass;
        if (exchange)
            whereClause.exchange = exchange;
        if (country)
            whereClause.country = country;
        if (sector)
            whereClause.sector = sector;
        const [securities, total] = await Promise.all([
            database_1.prisma.security.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { symbol: 'asc' }
            }),
            database_1.prisma.security.count({ where: whereClause })
        ]);
        const formattedSecurities = securities.map(security => ({
            ...security,
            marketCap: security.marketCap?.toNumber(),
        }));
        res.json({
            securities: formattedSecurities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            filters: {
                assetClass,
                exchange,
                country,
                sector,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error listing securities:', { query: req.query, error });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to list securities',
        });
    }
});

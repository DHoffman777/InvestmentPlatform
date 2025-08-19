"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const portfolioService_1 = require("../services/portfolioService");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.portfolioRoutes = router;
const prisma = new client_1.PrismaClient();
const portfolioService = new portfolioService_1.PortfolioService(prisma);
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
// GET /api/portfolios - List portfolios for authenticated user
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED', 'PENDING_APPROVAL']),
    (0, express_validator_1.query)('portfolioType').optional().isIn(['MANAGED', 'ADVISORY', 'DISCRETIONARY', 'MODEL_BASED', 'CUSTOM']),
    (0, express_validator_1.query)('search').optional().isString().trim(),
], validateRequest, auth_1.requireTenantAccess, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, portfolioType, search, } = req.query;
        const result = await portfolioService.getPortfolios({
            tenantId: req.user.tenantId,
            userId: req.user.sub,
            page,
            limit,
            status,
            portfolioType,
            search,
        });
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolios:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch portfolios',
        });
    }
});
// GET /api/portfolios/:id - Get specific portfolio
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
], validateRequest, auth_1.requireTenantAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const portfolio = await portfolioService.getPortfolioById(id, req.user.tenantId, req.user.sub);
        if (!portfolio) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        res.json(portfolio);
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch portfolio',
        });
    }
});
// POST /api/portfolios - Create new portfolio
router.post('/', [
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name is required and must be between 1 and 255 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('portfolioType')
        .isIn(['MANAGED', 'ADVISORY', 'DISCRETIONARY', 'MODEL_BASED', 'CUSTOM'])
        .withMessage('Invalid portfolio type'),
    (0, express_validator_1.body)('baseCurrency')
        .optional()
        .isString()
        .isLength({ min: 3, max: 3 })
        .withMessage('Base currency must be 3 characters'),
    (0, express_validator_1.body)('riskProfile')
        .isIn(['CONSERVATIVE', 'MODERATE_CONSERVATIVE', 'MODERATE', 'MODERATE_AGGRESSIVE', 'AGGRESSIVE'])
        .withMessage('Invalid risk profile'),
    (0, express_validator_1.body)('investmentObjective')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Investment objective must be less than 1000 characters'),
    (0, express_validator_1.body)('minCashPercentage')
        .optional()
        .isDecimal({ decimal_digits: '0,2' })
        .custom((value) => {
        const num = parseFloat(value);
        return num >= 0 && num <= 100;
    })
        .withMessage('Min cash percentage must be between 0 and 100'),
    (0, express_validator_1.body)('maxCashPercentage')
        .optional()
        .isDecimal({ decimal_digits: '0,2' })
        .custom((value) => {
        const num = parseFloat(value);
        return num >= 0 && num <= 100;
    })
        .withMessage('Max cash percentage must be between 0 and 100'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['portfolio:create']), async (req, res) => {
    try {
        const portfolioData = {
            ...req.body,
            tenantId: req.user.tenantId,
            ownerId: req.user.sub,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
        };
        const portfolio = await portfolioService.createPortfolio(portfolioData);
        logger_1.logger.info('Portfolio created', {
            portfolioId: portfolio.id,
            name: portfolio.name,
            userId: req.user.sub,
            tenantId: req.user.tenantId,
        });
        res.status(201).json(portfolio);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    error: 'Portfolio already exists',
                    message: 'A portfolio with this name already exists',
                });
            }
        }
        logger_1.logger.error('Error creating portfolio:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create portfolio',
        });
    }
});
// PUT /api/portfolios/:id - Update portfolio
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('riskProfile')
        .optional()
        .isIn(['CONSERVATIVE', 'MODERATE_CONSERVATIVE', 'MODERATE', 'MODERATE_AGGRESSIVE', 'AGGRESSIVE'])
        .withMessage('Invalid risk profile'),
    (0, express_validator_1.body)('investmentObjective')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Investment objective must be less than 1000 characters'),
    (0, express_validator_1.body)('minCashPercentage')
        .optional()
        .isDecimal({ decimal_digits: '0,2' })
        .custom((value) => {
        const num = parseFloat(value);
        return num >= 0 && num <= 100;
    })
        .withMessage('Min cash percentage must be between 0 and 100'),
    (0, express_validator_1.body)('maxCashPercentage')
        .optional()
        .isDecimal({ decimal_digits: '0,2' })
        .custom((value) => {
        const num = parseFloat(value);
        return num >= 0 && num <= 100;
    })
        .withMessage('Max cash percentage must be between 0 and 100'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['portfolio:update']), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updatedBy: req.user.sub,
        };
        const portfolio = await portfolioService.updatePortfolio(id, req.user.tenantId, req.user.sub, updateData);
        if (!portfolio) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        logger_1.logger.info('Portfolio updated', {
            portfolioId: id,
            userId: req.user.sub,
            tenantId: req.user.tenantId,
        });
        res.json(portfolio);
    }
    catch (error) {
        logger_1.logger.error('Error updating portfolio:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update portfolio',
        });
    }
});
// DELETE /api/portfolios/:id - Delete portfolio
router.delete('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['portfolio:delete']), async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await portfolioService.deletePortfolio(id, req.user.tenantId, req.user.sub);
        if (!deleted) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        logger_1.logger.info('Portfolio deleted', {
            portfolioId: id,
            userId: req.user.sub,
            tenantId: req.user.tenantId,
        });
        res.status(204).send();
    }
    catch (error) {
        logger_1.logger.error('Error deleting portfolio:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete portfolio',
        });
    }
});
// GET /api/portfolios/:id/summary - Get portfolio summary
router.get('/:id/summary', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
], validateRequest, auth_1.requireTenantAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const summary = await portfolioService.getPortfolioSummary(id, req.user.tenantId, req.user.sub);
        if (!summary) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        res.json(summary);
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio summary:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch portfolio summary',
        });
    }
});
// GET /api/portfolios/:id/allocations - Get portfolio allocations
router.get('/:id/allocations', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid portfolio ID'),
], validateRequest, auth_1.requireTenantAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const allocations = await portfolioService.getPortfolioAllocations(id, req.user.tenantId, req.user.sub);
        if (!allocations) {
            return res.status(404).json({
                error: 'Portfolio not found',
                message: 'Portfolio does not exist or you do not have access',
            });
        }
        res.json(allocations);
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio allocations:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch portfolio allocations',
        });
    }
});

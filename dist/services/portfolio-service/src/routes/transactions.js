"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const metrics_1 = require("../middleware/metrics");
const router = (0, express_1.Router)();
exports.transactionRoutes = router;
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
// GET /api/transactions - List transactions for a portfolio
router.get('/', [
    (0, express_validator_1.query)('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('transactionType').optional().isIn(['BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'FEE', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'SPLIT', 'MERGER', 'SPINOFF']),
    (0, express_validator_1.query)('startDate').optional().isISO8601().toDate(),
    (0, express_validator_1.query)('endDate').optional().isISO8601().toDate(),
    (0, express_validator_1.query)('search').optional().isString().trim(),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:read']), async (req, res) => {
    try {
        const { portfolioId, page = 1, limit = 20, transactionType, startDate, endDate, search, } = req.query;
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
            portfolioId
        };
        if (transactionType) {
            whereClause.transactionType = transactionType;
        }
        if (startDate || endDate) {
            whereClause.transactionDate = {};
            if (startDate)
                whereClause.transactionDate.gte = startDate;
            if (endDate)
                whereClause.transactionDate.lte = endDate;
        }
        if (search) {
            whereClause.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                { security: { symbol: { contains: search, mode: 'insensitive' } } },
                { security: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { transactionDate: 'desc' },
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                            assetClass: true,
                            currency: true
                        }
                    }
                }
            }),
            prisma.transaction.count({ where: whereClause })
        ]);
        (0, metrics_1.trackPortfolioOperation)('transaction:list');
        res.json({
            transactions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching transactions:', error);
        (0, metrics_1.trackPortfolioOperation)('transaction:list', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch transactions',
        });
    }
});
// GET /api/transactions/:id - Get specific transaction
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid transaction ID'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.transaction.findFirst({
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
                position: {
                    select: {
                        id: true,
                        quantity: true,
                        marketValue: true
                    }
                }
            }
        });
        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found',
                message: 'Transaction does not exist or you do not have access',
            });
        }
        (0, metrics_1.trackPortfolioOperation)('transaction:read');
        res.json(transaction);
    }
    catch (error) {
        logger_1.logger.error('Error fetching transaction:', error);
        (0, metrics_1.trackPortfolioOperation)('transaction:read', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch transaction',
        });
    }
});
// POST /api/transactions - Create new transaction
router.post('/', [
    (0, express_validator_1.body)('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    (0, express_validator_1.body)('securityId').isUUID().withMessage('Invalid security ID'),
    (0, express_validator_1.body)('transactionType').isIn(['BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'FEE', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'SPLIT', 'MERGER', 'SPINOFF']).withMessage('Invalid transaction type'),
    (0, express_validator_1.body)('transactionDate').isISO8601().toDate().withMessage('Invalid transaction date'),
    (0, express_validator_1.body)('settleDate').optional().isISO8601().toDate().withMessage('Invalid settle date'),
    (0, express_validator_1.body)('quantity').isDecimal().withMessage('Quantity must be a decimal number'),
    (0, express_validator_1.body)('price').optional().isDecimal().withMessage('Price must be a decimal number'),
    (0, express_validator_1.body)('fees').optional().isDecimal().withMessage('Fees must be a decimal number'),
    (0, express_validator_1.body)('taxes').optional().isDecimal().withMessage('Taxes must be a decimal number'),
    (0, express_validator_1.body)('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    (0, express_validator_1.body)('externalId').optional().isString().trim().isLength({ max: 100 }).withMessage('External ID must be less than 100 characters'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:create']), async (req, res) => {
    try {
        const { portfolioId, securityId, transactionType, transactionDate, settleDate, quantity, price, fees = 0, taxes = 0, description, externalId, } = req.body;
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
        // Verify security exists
        const security = await prisma.security.findUnique({
            where: { id: securityId }
        });
        if (!security) {
            return res.status(404).json({
                error: 'Security not found',
                message: 'The specified security does not exist',
            });
        }
        // Calculate net amount based on transaction type
        const quantityDecimal = new client_1.Prisma.Decimal(quantity);
        const priceDecimal = price ? new client_1.Prisma.Decimal(price) : new client_1.Prisma.Decimal(0);
        const feesDecimal = new client_1.Prisma.Decimal(fees);
        const taxesDecimal = new client_1.Prisma.Decimal(taxes);
        let netAmount = quantityDecimal.mul(priceDecimal);
        // For buy transactions, add fees and taxes to cost
        // For sell transactions, subtract fees and taxes from proceeds
        if (transactionType === 'BUY' || transactionType === 'TRANSFER_IN') {
            netAmount = netAmount.add(feesDecimal).add(taxesDecimal);
        }
        else if (transactionType === 'SELL' || transactionType === 'TRANSFER_OUT') {
            netAmount = netAmount.sub(feesDecimal).sub(taxesDecimal);
        }
        // Create transaction
        const transaction = await prisma.transaction.create({
            data: {
                portfolioId,
                securityId,
                transactionType,
                transactionDate,
                settleDate: settleDate || transactionDate,
                quantity: quantityDecimal,
                price: priceDecimal,
                fees: feesDecimal,
                taxes: taxesDecimal,
                netAmount,
                description,
                externalId,
                status: 'SETTLED',
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
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
        logger_1.logger.info('Transaction created', {
            transactionId: transaction.id,
            portfolioId,
            securitySymbol: security.symbol,
            type: transactionType,
            quantity: quantity.toString(),
            userId: req.user.sub,
            tenantId: req.user.tenantId,
        });
        (0, metrics_1.trackPortfolioOperation)('transaction:create');
        res.status(201).json(transaction);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    error: 'Duplicate transaction',
                    message: 'A transaction with this external ID already exists',
                });
            }
        }
        logger_1.logger.error('Error creating transaction:', error);
        (0, metrics_1.trackPortfolioOperation)('transaction:create', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create transaction',
        });
    }
});
// PUT /api/transactions/:id - Update transaction
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid transaction ID'),
    (0, express_validator_1.body)('transactionDate').optional().isISO8601().toDate().withMessage('Invalid transaction date'),
    (0, express_validator_1.body)('settleDate').optional().isISO8601().toDate().withMessage('Invalid settle date'),
    (0, express_validator_1.body)('quantity').optional().isDecimal().withMessage('Quantity must be a decimal number'),
    (0, express_validator_1.body)('price').optional().isDecimal().withMessage('Price must be a decimal number'),
    (0, express_validator_1.body)('fees').optional().isDecimal().withMessage('Fees must be a decimal number'),
    (0, express_validator_1.body)('taxes').optional().isDecimal().withMessage('Taxes must be a decimal number'),
    (0, express_validator_1.body)('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    (0, express_validator_1.body)('status').optional().isIn(['PENDING', 'SETTLED', 'CANCELLED', 'FAILED']).withMessage('Invalid status'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:update']), async (req, res) => {
    try {
        const { id } = req.params;
        // Verify user has access to the transaction
        const existingTransaction = await prisma.transaction.findFirst({
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
                security: true
            }
        });
        if (!existingTransaction) {
            return res.status(404).json({
                error: 'Transaction not found',
                message: 'Transaction does not exist or you do not have access',
            });
        }
        const updateData = {
            updatedBy: req.user.sub,
            updatedAt: new Date()
        };
        // Update fields if provided
        if (req.body.transactionDate !== undefined)
            updateData.transactionDate = req.body.transactionDate;
        if (req.body.settleDate !== undefined)
            updateData.settleDate = req.body.settleDate;
        if (req.body.quantity !== undefined)
            updateData.quantity = new client_1.Prisma.Decimal(req.body.quantity);
        if (req.body.price !== undefined)
            updateData.price = new client_1.Prisma.Decimal(req.body.price);
        if (req.body.fees !== undefined)
            updateData.fees = new client_1.Prisma.Decimal(req.body.fees);
        if (req.body.taxes !== undefined)
            updateData.taxes = new client_1.Prisma.Decimal(req.body.taxes);
        if (req.body.description !== undefined)
            updateData.description = req.body.description;
        if (req.body.status !== undefined)
            updateData.status = req.body.status;
        // Recalculate net amount if relevant fields changed
        if (req.body.quantity !== undefined || req.body.price !== undefined ||
            req.body.fees !== undefined || req.body.taxes !== undefined) {
            const quantity = updateData.quantity || existingTransaction.quantity;
            const price = updateData.price || existingTransaction.price || new client_1.Prisma.Decimal(0);
            const fees = updateData.fees || existingTransaction.fees || new client_1.Prisma.Decimal(0);
            const taxes = updateData.taxes || existingTransaction.taxes || new client_1.Prisma.Decimal(0);
            let netAmount = quantity.mul(price);
            if (existingTransaction.transactionType === 'BUY' || existingTransaction.transactionType === 'TRANSFER_IN') {
                netAmount = netAmount.add(fees).add(taxes);
            }
            else if (existingTransaction.transactionType === 'SELL' || existingTransaction.transactionType === 'TRANSFER_OUT') {
                netAmount = netAmount.sub(fees).sub(taxes);
            }
            updateData.netAmount = netAmount;
        }
        const transaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
            include: {
                security: {
                    select: {
                        symbol: true,
                        name: true
                    }
                }
            }
        });
        logger_1.logger.info('Transaction updated', {
            transactionId: id,
            userId: req.user.sub,
            tenantId: req.user.tenantId,
        });
        (0, metrics_1.trackPortfolioOperation)('transaction:update');
        res.json(transaction);
    }
    catch (error) {
        logger_1.logger.error('Error updating transaction:', error);
        (0, metrics_1.trackPortfolioOperation)('transaction:update', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update transaction',
        });
    }
});
// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid transaction ID'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:delete']), async (req, res) => {
    try {
        const { id } = req.params;
        // Verify user has access to the transaction
        const existingTransaction = await prisma.transaction.findFirst({
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
        if (!existingTransaction) {
            return res.status(404).json({
                error: 'Transaction not found',
                message: 'Transaction does not exist or you do not have access',
            });
        }
        // Soft delete by updating status
        await prisma.transaction.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                updatedBy: req.user.sub,
                updatedAt: new Date()
            }
        });
        logger_1.logger.info('Transaction deleted', {
            transactionId: id,
            userId: req.user.sub,
            tenantId: req.user.tenantId,
        });
        (0, metrics_1.trackPortfolioOperation)('transaction:delete');
        res.status(204).send();
    }
    catch (error) {
        logger_1.logger.error('Error deleting transaction:', error);
        (0, metrics_1.trackPortfolioOperation)('transaction:delete', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete transaction',
        });
    }
});

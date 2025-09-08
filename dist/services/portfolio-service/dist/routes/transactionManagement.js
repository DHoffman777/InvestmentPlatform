"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionManagementRouter = void 0;
const express_1 = require("express");
const { body, param, query, validationResult } = require('express-validator');
const client_1 = require("@prisma/client");
const transactionService_1 = require("../services/transactionService");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const metrics_1 = require("../middleware/metrics");
const decimal_js_1 = require("decimal.js");
const router = (0, express_1.Router)();
exports.transactionManagementRouter = router;
const prisma = new client_1.PrismaClient();
const transactionService = new transactionService_1.TransactionService(prisma);
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
// POST /api/transaction-management/capture - Capture trade from external source
router.post('/capture', [
    body('source').isIn(['MANUAL', 'BROKER_API', 'FIX_FEED', 'FILE_UPLOAD', 'CUSTODIAN_FEED']).withMessage('Invalid trade source'),
    body('externalTradeId').isString().trim().isLength({ min: 1, max: 100 }).withMessage('External trade ID is required'),
    body('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    body('securityId').isUUID().withMessage('Invalid security ID'),
    body('transactionType').isIn(['BUY', 'SELL']).withMessage('Invalid transaction type'),
    body('quantity').isNumeric().withMessage('Quantity must be numeric'),
    body('price').isNumeric().withMessage('Price must be numeric'),
    body('tradeDate').isISO8601().toDate().withMessage('Invalid trade date'),
    body('settleDate').optional().isISO8601().toDate().withMessage('Invalid settle date'),
    body('fees').optional().isNumeric().withMessage('Fees must be numeric'),
    body('taxes').optional().isNumeric().withMessage('Taxes must be numeric'),
    body('commission').optional().isNumeric().withMessage('Commission must be numeric'),
    body('counterparty').optional().isString().trim(),
    body('orderId').optional().isString().trim(),
    body('executionId').optional().isString().trim(),
    body('venue').optional().isString().trim(),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:create']), async (req, res) => {
    try {
        const { source, externalTradeId, portfolioId, securityId, transactionType, quantity, price, tradeDate, settleDate, fees, taxes, commission, counterparty, orderId, executionId, venue, rawData, } = req.body;
        // Verify user has access to the portfolio
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id: portfolioId,
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
        const tradeCapture = {
            source,
            externalTradeId,
            portfolioId,
            securityId,
            transactionType,
            quantity: new decimal_js_1.Decimal(quantity),
            price: new decimal_js_1.Decimal(price),
            tradeDate,
            settleDate,
            fees: fees ? new decimal_js_1.Decimal(fees) : undefined,
            taxes: taxes ? new decimal_js_1.Decimal(taxes) : undefined,
            commission: commission ? new decimal_js_1.Decimal(commission) : undefined,
            counterparty,
            orderId,
            executionId,
            venue,
            rawData,
        };
        const transaction = await transactionService.captureTradeFromSource(tradeCapture);
        (0, metrics_1.trackPortfolioOperation)('transaction:capture');
        res.status(201).json({
            transaction,
            source,
            captured: true,
            message: 'Trade captured successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error capturing trade:', {
            portfolioId: req.body.portfolioId,
            externalTradeId: req.body.externalTradeId,
            error
        });
        (0, metrics_1.trackPortfolioOperation)('transaction:capture', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Failed to capture trade',
        });
    }
});
// POST /api/transaction-management/bulk-capture - Bulk trade capture
router.post('/bulk-capture', [
    body('trades').isArray({ min: 1, max: 1000 }).withMessage('Trades array is required (max 1000)'),
    body('trades.*.source').isIn(['MANUAL', 'BROKER_API', 'FIX_FEED', 'FILE_UPLOAD', 'CUSTODIAN_FEED']),
    body('trades.*.externalTradeId').isString().trim().isLength({ min: 1 }),
    body('trades.*.portfolioId').isUUID(),
    body('trades.*.securityId').isUUID(),
    body('trades.*.transactionType').isIn(['BUY', 'SELL']),
    body('trades.*.quantity').isNumeric(),
    body('trades.*.price').isNumeric(),
    body('trades.*.tradeDate').isISO8601().toDate(),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:create', 'transaction:bulk']), async (req, res) => {
    try {
        const { trades } = req.body;
        // Validate all portfolios belong to the tenant
        const portfolioIds = [...new Set(trades.map((t) => t.portfolioId).filter(Boolean))];
        const portfolios = await prisma.portfolio.findMany({
            where: {
                id: { in: portfolioIds },
                tenantId: req.user.tenantId,
                OR: [
                    { ownerId: req.user.sub },
                    { managerId: req.user.sub }
                ]
            }
        });
        if (portfolios.length !== portfolioIds.length) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have access to all specified portfolios',
            });
        }
        // Convert to TradeCapture format
        const tradeCaptures = trades.map((trade) => ({
            source: trade.source,
            externalTradeId: trade.externalTradeId,
            portfolioId: trade.portfolioId,
            securityId: trade.securityId,
            transactionType: trade.transactionType,
            quantity: new decimal_js_1.Decimal(trade.quantity),
            price: new decimal_js_1.Decimal(trade.price),
            tradeDate: trade.tradeDate,
            settleDate: trade.settleDate,
            fees: trade.fees ? new decimal_js_1.Decimal(trade.fees) : undefined,
            taxes: trade.taxes ? new decimal_js_1.Decimal(trade.taxes) : undefined,
            commission: trade.commission ? new decimal_js_1.Decimal(trade.commission) : undefined,
            counterparty: trade.counterparty,
            orderId: trade.orderId,
            executionId: trade.executionId,
            venue: trade.venue,
            rawData: trade.rawData,
        }));
        const result = await transactionService.processBulkTransactions(tradeCaptures);
        (0, metrics_1.trackPortfolioOperation)('transaction:bulk-capture');
        res.json({
            ...result,
            message: 'Bulk trade capture completed',
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing bulk trades:', {
            tradeCount: req.body.trades?.length,
            error
        });
        (0, metrics_1.trackPortfolioOperation)('transaction:bulk-capture', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process bulk trades',
        });
    }
});
// POST /api/transaction-management/portfolios/:id/match - Match transactions with external data
router.post('/portfolios/:id/match', [
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    body('externalTransactions').isArray({ min: 1 }).withMessage('External transactions array is required'),
    body('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    body('endDate').isISO8601().toDate().withMessage('Invalid end date'),
    body('externalTransactions.*.symbol').isString().trim(),
    body('externalTransactions.*.quantity').isNumeric(),
    body('externalTransactions.*.price').isNumeric(),
    body('externalTransactions.*.tradeDate').isISO8601().toDate(),
    body('externalTransactions.*.transactionType').isIn(['BUY', 'SELL']),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:reconcile']), async (req, res) => {
    try {
        const { id } = req.params;
        const { externalTransactions, startDate, endDate } = req.body;
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
        const matchingResults = await transactionService.matchTransactions(id, externalTransactions, { startDate, endDate });
        (0, metrics_1.trackPortfolioOperation)('transaction:match');
        res.json({
            portfolioId: id,
            dateRange: { startDate, endDate },
            ...matchingResults,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error matching transactions:', { portfolioId: req.params.id, error });
        (0, metrics_1.trackPortfolioOperation)('transaction:match', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to match transactions',
        });
    }
});
// POST /api/transaction-management/settlement-instructions - Create settlement instruction
router.post('/settlement-instructions', [
    body('transactionId').isUUID().withMessage('Invalid transaction ID'),
    body('instructionType').isIn(['DVP', 'FREE_DELIVERY', 'CASH_SETTLEMENT']).withMessage('Invalid instruction type'),
    body('deliveryDate').isISO8601().toDate().withMessage('Invalid delivery date'),
    body('settlementAmount').isNumeric().withMessage('Settlement amount must be numeric'),
    body('custodian').isString().trim().isLength({ min: 1 }).withMessage('Custodian is required'),
    body('account').isString().trim().isLength({ min: 1 }).withMessage('Account is required'),
    body('dtcNumber').optional().isString().trim(),
    body('contraParty').optional().isString().trim(),
    body('specialInstructions').optional().isString().trim().isLength({ max: 1000 }),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:settle']), async (req, res) => {
    try {
        const { transactionId, instructionType, deliveryDate, settlementAmount, custodian, account, dtcNumber, contraParty, specialInstructions, } = req.body;
        // Verify user has access to the transaction
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                portfolio: {
                    tenantId: req.user.tenantId,
                    OR: [
                        { ownerId: req.user.sub },
                        { managerId: req.user.sub }
                    ]
                }
            }
        });
        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found',
                message: 'Transaction does not exist or you do not have access',
            });
        }
        const instruction = await transactionService.createSettlementInstruction({
            transactionId,
            instructionType,
            deliveryDate,
            settlementAmount: new decimal_js_1.Decimal(settlementAmount),
            custodian,
            account,
            status: 'PENDING',
            dtcNumber,
            contraParty,
            specialInstructions,
        });
        (0, metrics_1.trackPortfolioOperation)('settlement:create');
        res.status(201).json({
            instruction,
            message: 'Settlement instruction created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating settlement instruction:', {
            transactionId: req.body.transactionId,
            error
        });
        (0, metrics_1.trackPortfolioOperation)('settlement:create', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create settlement instruction',
        });
    }
});
// PUT /api/transaction-management/settlement-instructions/:id/status - Update settlement status
router.put('/settlement-instructions/:id/status', [
    param('id').isUUID().withMessage('Invalid instruction ID'),
    body('status').isIn(['PENDING', 'SENT', 'CONFIRMED', 'SETTLED', 'FAILED']).withMessage('Invalid status'),
    body('notes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:settle']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        // Verify user has access to the instruction
        const instruction = await prisma.settlementInstruction.findFirst({
            where: {
                id,
                transaction: {
                    portfolio: {
                        tenantId: req.user.tenantId,
                        OR: [
                            { ownerId: req.user.sub },
                            { managerId: req.user.sub }
                        ]
                    }
                }
            }
        });
        if (!instruction) {
            return res.status(404).json({
                error: 'Settlement instruction not found',
                message: 'Instruction does not exist or you do not have access',
            });
        }
        const updated = await transactionService.updateSettlementStatus(id, status, notes);
        (0, metrics_1.trackPortfolioOperation)('settlement:update-status');
        res.json({
            instruction: updated,
            message: 'Settlement status updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating settlement status:', { instructionId: req.params.id, error });
        (0, metrics_1.trackPortfolioOperation)('settlement:update-status', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update settlement status',
        });
    }
});
// POST /api/transaction-management/failed-trades - Create failed trade record
router.post('/failed-trades', [
    body('transactionId').isUUID().withMessage('Invalid transaction ID'),
    body('failureReason').isIn([
        'INSUFFICIENT_CASH', 'INSUFFICIENT_SECURITIES', 'SYSTEM_ERROR',
        'COMPLIANCE_VIOLATION', 'SETTLEMENT_FAIL', 'PRICING_ERROR'
    ]).withMessage('Invalid failure reason'),
    body('failureDate').isISO8601().toDate().withMessage('Invalid failure date'),
    body('resolutionActions').isArray({ min: 1 }).withMessage('Resolution actions are required'),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
    body('assignedTo').optional().isString().trim(),
    body('notes').optional().isString().trim().isLength({ max: 2000 }),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:manage-failures']), async (req, res) => {
    try {
        const { transactionId, failureReason, failureDate, resolutionActions, priority, assignedTo, notes, } = req.body;
        // Verify user has access to the transaction
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                portfolio: {
                    tenantId: req.user.tenantId,
                    OR: [
                        { ownerId: req.user.sub },
                        { managerId: req.user.sub }
                    ]
                }
            }
        });
        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found',
                message: 'Transaction does not exist or you do not have access',
            });
        }
        const failedTrade = await transactionService.createFailedTrade({
            transactionId,
            failureReason,
            failureDate,
            resolutionActions,
            priority,
            assignedTo,
            resolved: false,
            notes,
        });
        (0, metrics_1.trackPortfolioOperation)('failed-trade:create');
        res.status(201).json({
            failedTrade,
            message: 'Failed trade record created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating failed trade record:', {
            transactionId: req.body.transactionId,
            error
        });
        (0, metrics_1.trackPortfolioOperation)('failed-trade:create', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create failed trade record',
        });
    }
});
// GET /api/transaction-management/portfolios/:id/cash-impact - Get cash impact analysis
router.get('/portfolios/:id/cash-impact', [
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    query('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').isISO8601().toDate().withMessage('Invalid end date'),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
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
        const cashImpact = await transactionService.calculateCashImpact(id, { startDate, endDate });
        (0, metrics_1.trackPortfolioOperation)('transaction:cash-impact');
        res.json({
            portfolioId: id,
            period: { startDate, endDate },
            cashImpact: {
                totalCashIn: cashImpact.totalCashIn.toNumber(),
                totalCashOut: cashImpact.totalCashOut.toNumber(),
                netCashFlow: cashImpact.netCashFlow.toNumber(),
                transactions: cashImpact.transactions.map(tx => ({
                    ...tx,
                    amount: tx.amount.toNumber(),
                }))
            },
            summary: {
                transactionCount: cashImpact.transactions.length,
                netFlow: cashImpact.netCashFlow.toNumber(),
                flowDirection: cashImpact.netCashFlow.gte(0) ? 'INFLOW' : 'OUTFLOW',
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating cash impact:', { portfolioId: req.params.id, error });
        (0, metrics_1.trackPortfolioOperation)('transaction:cash-impact', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to calculate cash impact',
        });
    }
});
// GET /api/transaction-management/settlement-instructions - Get settlement instructions
router.get('/settlement-instructions', [
    query('portfolioId').optional().isUUID().withMessage('Invalid portfolio ID'),
    query('status').optional().isIn(['PENDING', 'SENT', 'CONFIRMED', 'SETTLED', 'FAILED']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validateRequest, auth_1.requireTenantAccess, (0, auth_1.requirePermission)(['transaction:read']), async (req, res) => {
    try {
        const { portfolioId, status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const whereClause = {
            transaction: {
                portfolio: {
                    tenantId: req.user.tenantId,
                    OR: [
                        { ownerId: req.user.sub },
                        { managerId: req.user.sub }
                    ]
                }
            }
        };
        if (portfolioId) {
            whereClause.transaction.portfolioId = portfolioId;
        }
        if (status) {
            whereClause.status = status;
        }
        const [instructions, total] = await Promise.all([
            prisma.settlementInstruction.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { deliveryDate: 'desc' },
                include: {
                    transaction: {
                        select: {
                            id: true,
                            transactionType: true,
                            transactionDate: true,
                            quantity: true,
                            price: true,
                            netAmount: true,
                            portfolioId: true,
                            // securityId: true // Field doesn't exist in schema
                        }
                    }
                }
            }),
            prisma.settlementInstruction.count({ where: whereClause })
        ]);
        (0, metrics_1.trackPortfolioOperation)('settlement:list');
        res.json({
            instructions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching settlement instructions:', error);
        (0, metrics_1.trackPortfolioOperation)('settlement:list', 'error');
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch settlement instructions',
        });
    }
});

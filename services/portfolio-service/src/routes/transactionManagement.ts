import { Router, Request, Response } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionService, TradeCapture } from '../services/transactionService';
import { logger } from '../utils/logger';
import { requirePermission, requireTenantAccess } from '../middleware/auth';
import { trackPortfolioOperation } from '../middleware/metrics';

const router = Router();
const prisma = new PrismaClient();
const transactionService = new TransactionService(prisma);

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
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
router.post('/capture',
  [
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
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:create']),
  async (req: any, res: any) => {
    try {
      const {
        source,
        externalTradeId,
        portfolioId,
        securityId,
        transactionType,
        quantity,
        price,
        tradeDate,
        settleDate,
        fees,
        taxes,
        commission,
        counterparty,
        orderId,
        executionId,
        venue,
        rawData,
      } = req.body;

      // Verify user has access to the portfolio
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          tenantId: req.user!.tenantId,
          OR: [
            { ownerId: req.user!.sub },
            { managerId: req.user!.sub }
          ]
        }
      });

      if (!portfolio) {
        return res.status(404).json({
          error: 'Portfolio not found',
          message: 'Portfolio does not exist or you do not have access',
        });
      }

      const tradeCapture: TradeCapture = {
        source,
        externalTradeId,
        portfolioId,
        securityId,
        transactionType,
        quantity: new Decimal(quantity),
        price: new Decimal(price),
        tradeDate,
        settleDate,
        fees: fees ? new Decimal(fees) : undefined,
        taxes: taxes ? new Decimal(taxes) : undefined,
        commission: commission ? new Decimal(commission) : undefined,
        counterparty,
        orderId,
        executionId,
        venue,
        rawData,
      };

      const transaction = await transactionService.captureTradeFromSource(tradeCapture);

      trackPortfolioOperation('transaction:capture');

      res.status(201).json({
        transaction,
        source,
        captured: true,
        message: 'Trade captured successfully',
      });
    } catch (error: any) {
      logger.error('Error capturing trade:', { 
        portfolioId: req.body.portfolioId,
        externalTradeId: req.body.externalTradeId,
        error 
      });
      trackPortfolioOperation('transaction:capture', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to capture trade',
      });
    }
  }
);

// POST /api/transaction-management/bulk-capture - Bulk trade capture
router.post('/bulk-capture',
  [
    body('trades').isArray({ min: 1, max: 1000 }).withMessage('Trades array is required (max 1000)'),
    body('trades.*.source').isIn(['MANUAL', 'BROKER_API', 'FIX_FEED', 'FILE_UPLOAD', 'CUSTODIAN_FEED']),
    body('trades.*.externalTradeId').isString().trim().isLength({ min: 1 }),
    body('trades.*.portfolioId').isUUID(),
    body('trades.*.securityId').isUUID(),
    body('trades.*.transactionType').isIn(['BUY', 'SELL']),
    body('trades.*.quantity').isNumeric(),
    body('trades.*.price').isNumeric(),
    body('trades.*.tradeDate').isISO8601().toDate(),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:create', 'transaction:bulk']),
  async (req: any, res: any) => {
    try {
      const { trades } = req.body;

      // Validate all portfolios belong to the tenant
      const portfolioIds: string[] = [...new Set(trades.map((t: any) => t.portfolioId).filter(Boolean))] as string[];
      const portfolios = await prisma.portfolio.findMany({
        where: {
          id: { in: portfolioIds },
          tenantId: req.user!.tenantId,
          OR: [
            { ownerId: req.user!.sub },
            { managerId: req.user!.sub }
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
      const tradeCaptures: TradeCapture[] = trades.map((trade: any) => ({
        source: trade.source,
        externalTradeId: trade.externalTradeId,
        portfolioId: trade.portfolioId,
        securityId: trade.securityId,
        transactionType: trade.transactionType,
        quantity: new Decimal(trade.quantity),
        price: new Decimal(trade.price),
        tradeDate: trade.tradeDate,
        settleDate: trade.settleDate,
        fees: trade.fees ? new Decimal(trade.fees) : undefined,
        taxes: trade.taxes ? new Decimal(trade.taxes) : undefined,
        commission: trade.commission ? new Decimal(trade.commission) : undefined,
        counterparty: trade.counterparty,
        orderId: trade.orderId,
        executionId: trade.executionId,
        venue: trade.venue,
        rawData: trade.rawData,
      }));

      const result = await transactionService.processBulkTransactions(tradeCaptures);

      trackPortfolioOperation('transaction:bulk-capture');

      res.json({
        ...result,
        message: 'Bulk trade capture completed',
      });
    } catch (error: any) {
      logger.error('Error processing bulk trades:', { 
        tradeCount: req.body.trades?.length,
        error 
      });
      trackPortfolioOperation('transaction:bulk-capture', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process bulk trades',
      });
    }
  }
);

// POST /api/transaction-management/portfolios/:id/match - Match transactions with external data
router.post('/portfolios/:id/match',
  [
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    body('externalTransactions').isArray({ min: 1 }).withMessage('External transactions array is required'),
    body('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    body('endDate').isISO8601().toDate().withMessage('Invalid end date'),
    body('externalTransactions.*.symbol').isString().trim(),
    body('externalTransactions.*.quantity').isNumeric(),
    body('externalTransactions.*.price').isNumeric(),
    body('externalTransactions.*.tradeDate').isISO8601().toDate(),
    body('externalTransactions.*.transactionType').isIn(['BUY', 'SELL']),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:reconcile']),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { externalTransactions, startDate, endDate } = req.body;

      // Verify user has access to the portfolio
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id,
          tenantId: req.user!.tenantId,
          OR: [
            { ownerId: req.user!.sub },
            { managerId: req.user!.sub }
          ]
        }
      });

      if (!portfolio) {
        return res.status(404).json({
          error: 'Portfolio not found',
          message: 'Portfolio does not exist or you do not have access',
        });
      }

      const matchingResults = await transactionService.matchTransactions(
        id,
        externalTransactions,
        { startDate, endDate }
      );

      trackPortfolioOperation('transaction:match');

      res.json({
        portfolioId: id,
        dateRange: { startDate, endDate },
        ...matchingResults,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Error matching transactions:', { portfolioId: req.params.id, error });
      trackPortfolioOperation('transaction:match', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to match transactions',
      });
    }
  }
);

// POST /api/transaction-management/settlement-instructions - Create settlement instruction
router.post('/settlement-instructions',
  [
    body('transactionId').isUUID().withMessage('Invalid transaction ID'),
    body('instructionType').isIn(['DVP', 'FREE_DELIVERY', 'CASH_SETTLEMENT']).withMessage('Invalid instruction type'),
    body('deliveryDate').isISO8601().toDate().withMessage('Invalid delivery date'),
    body('settlementAmount').isNumeric().withMessage('Settlement amount must be numeric'),
    body('custodian').isString().trim().isLength({ min: 1 }).withMessage('Custodian is required'),
    body('account').isString().trim().isLength({ min: 1 }).withMessage('Account is required'),
    body('dtcNumber').optional().isString().trim(),
    body('contraParty').optional().isString().trim(),
    body('specialInstructions').optional().isString().trim().isLength({ max: 1000 }),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:settle']),
  async (req: any, res: any) => {
    try {
      const {
        transactionId,
        instructionType,
        deliveryDate,
        settlementAmount,
        custodian,
        account,
        dtcNumber,
        contraParty,
        specialInstructions,
      } = req.body;

      // Verify user has access to the transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          portfolio: {
            tenantId: req.user!.tenantId,
            OR: [
              { ownerId: req.user!.sub },
              { managerId: req.user!.sub }
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
        settlementAmount: new Decimal(settlementAmount),
        custodian,
        account,
        status: 'PENDING',
        dtcNumber,
        contraParty,
        specialInstructions,
      });

      trackPortfolioOperation('settlement:create');

      res.status(201).json({
        instruction,
        message: 'Settlement instruction created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating settlement instruction:', { 
        transactionId: req.body.transactionId,
        error 
      });
      trackPortfolioOperation('settlement:create', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create settlement instruction',
      });
    }
  }
);

// PUT /api/transaction-management/settlement-instructions/:id/status - Update settlement status
router.put('/settlement-instructions/:id/status',
  [
    param('id').isUUID().withMessage('Invalid instruction ID'),
    body('status').isIn(['PENDING', 'SENT', 'CONFIRMED', 'SETTLED', 'FAILED']).withMessage('Invalid status'),
    body('notes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:settle']),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // Verify user has access to the instruction
      const instruction = await prisma.settlementInstruction.findFirst({
        where: {
          id,
          transaction: {
            portfolio: {
              tenantId: req.user!.tenantId,
              OR: [
                { ownerId: req.user!.sub },
                { managerId: req.user!.sub }
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

      trackPortfolioOperation('settlement:update-status');

      res.json({
        instruction: updated,
        message: 'Settlement status updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating settlement status:', { instructionId: req.params.id, error });
      trackPortfolioOperation('settlement:update-status', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update settlement status',
      });
    }
  }
);

// POST /api/transaction-management/failed-trades - Create failed trade record
router.post('/failed-trades',
  [
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
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:manage-failures']),
  async (req: any, res: any) => {
    try {
      const {
        transactionId,
        failureReason,
        failureDate,
        resolutionActions,
        priority,
        assignedTo,
        notes,
      } = req.body;

      // Verify user has access to the transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          portfolio: {
            tenantId: req.user!.tenantId,
            OR: [
              { ownerId: req.user!.sub },
              { managerId: req.user!.sub }
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

      trackPortfolioOperation('failed-trade:create');

      res.status(201).json({
        failedTrade,
        message: 'Failed trade record created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating failed trade record:', { 
        transactionId: req.body.transactionId,
        error 
      });
      trackPortfolioOperation('failed-trade:create', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create failed trade record',
      });
    }
  }
);

// GET /api/transaction-management/portfolios/:id/cash-impact - Get cash impact analysis
router.get('/portfolios/:id/cash-impact',
  [
    param('id').isUUID().withMessage('Invalid portfolio ID'),
    query('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').isISO8601().toDate().withMessage('Invalid end date'),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:read']),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query as any;

      // Verify user has access to the portfolio
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id,
          tenantId: req.user!.tenantId,
          OR: [
            { ownerId: req.user!.sub },
            { managerId: req.user!.sub }
          ]
        }
      });

      if (!portfolio) {
        return res.status(404).json({
          error: 'Portfolio not found',
          message: 'Portfolio does not exist or you do not have access',
        });
      }

      const cashImpact = await transactionService.calculateCashImpact(
        id,
        { startDate, endDate }
      );

      trackPortfolioOperation('transaction:cash-impact');

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
    } catch (error: any) {
      logger.error('Error calculating cash impact:', { portfolioId: req.params.id, error });
      trackPortfolioOperation('transaction:cash-impact', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to calculate cash impact',
      });
    }
  }
);

// GET /api/transaction-management/settlement-instructions - Get settlement instructions
router.get('/settlement-instructions',
  [
    query('portfolioId').optional().isUUID().withMessage('Invalid portfolio ID'),
    query('status').optional().isIn(['PENDING', 'SENT', 'CONFIRMED', 'SETTLED', 'FAILED']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:read']),
  async (req: any, res: any) => {
    try {
      const { portfolioId, status, page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        transaction: {
          portfolio: {
            tenantId: req.user!.tenantId,
            OR: [
              { ownerId: req.user!.sub },
              { managerId: req.user!.sub }
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

      trackPortfolioOperation('settlement:list');

      res.json({
        instructions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      logger.error('Error fetching settlement instructions:', error);
      trackPortfolioOperation('settlement:list', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch settlement instructions',
      });
    }
  }
);

export { router as transactionManagementRouter };


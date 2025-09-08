import { Router, Request, Response } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { requirePermission, requireTenantAccess } from '../middleware/auth';
import { trackPortfolioOperation } from '../middleware/metrics';

const router = Router();
const prisma = new PrismaClient();

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

// GET /api/transactions - List transactions for a portfolio
router.get('/',
  [
    query('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('transactionType').optional().isIn(['BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'FEE', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'SPLIT', 'MERGER', 'SPINOFF']),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('search').optional().isString().trim(),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:read']),
  async (req: any, res: any) => {
    try {
      const {
        portfolioId,
        page = 1,
        limit = 20,
        transactionType,
        startDate,
        endDate,
        search,
      } = req.query as any;

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

      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        portfolioId
      };

      if (transactionType) {
        whereClause.transactionType = transactionType;
      }

      if (startDate || endDate) {
        whereClause.transactionDate = {};
        if (startDate) whereClause.transactionDate.gte = startDate;
        if (endDate) whereClause.transactionDate.lte = endDate;
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
          select: {
            id: true,
            transactionType: true,
            transactionDate: true,
            quantity: true,
            price: true,
            netAmount: true,
            description: true,
            status: true
          }
        }),
        prisma.transaction.count({ where: whereClause })
      ]);

      trackPortfolioOperation('transaction:list');

      res.json({
        transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      logger.error('Error fetching transactions:', error);
      trackPortfolioOperation('transaction:list', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch transactions',
      });
    }
  }
);

// GET /api/transactions/:id - Get specific transaction
router.get('/:id',
  [
    param('id').isUUID().withMessage('Invalid transaction ID'),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:read']),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          portfolio: {
            tenantId: req.user!.tenantId,
            OR: [
              { ownerId: req.user!.sub },
              { managerId: req.user!.sub }
            ]
          }
        },
        select: {
          id: true,
          transactionType: true,
          transactionDate: true,
          quantity: true,
          price: true,
          netAmount: true,
          portfolioId: true,
          description: true,
          status: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          error: 'Transaction not found',
          message: 'Transaction does not exist or you do not have access',
        });
      }

      trackPortfolioOperation('transaction:read');
      res.json(transaction);
    } catch (error: any) {
      logger.error('Error fetching transaction:', error);
      trackPortfolioOperation('transaction:read', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch transaction',
      });
    }
  }
);

// POST /api/transactions - Create new transaction
router.post('/',
  [
    body('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    body('securityId').isUUID().withMessage('Invalid security ID'),
    body('transactionType').isIn(['BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'FEE', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'SPLIT', 'MERGER', 'SPINOFF']).withMessage('Invalid transaction type'),
    body('transactionDate').isISO8601().toDate().withMessage('Invalid transaction date'),
    body('settleDate').optional().isISO8601().toDate().withMessage('Invalid settle date'),
    body('quantity').isDecimal().withMessage('Quantity must be a decimal number'),
    body('price').optional().isDecimal().withMessage('Price must be a decimal number'),
    body('fees').optional().isDecimal().withMessage('Fees must be a decimal number'),
    body('taxes').optional().isDecimal().withMessage('Taxes must be a decimal number'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('externalId').optional().isString().trim().isLength({ max: 100 }).withMessage('External ID must be less than 100 characters'),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:create']),
  async (req: any, res: any) => {
    try {
      const {
        portfolioId,
        securityId,
        transactionType,
        transactionDate,
        settleDate,
        quantity,
        price,
        fees = 0,
        taxes = 0,
        description,
        externalId,
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
      const quantityDecimal = new Prisma.Decimal(quantity);
      const priceDecimal = price ? new Prisma.Decimal(price) : new Prisma.Decimal(0);
      const feesDecimal = new Prisma.Decimal(fees);
      const taxesDecimal = new Prisma.Decimal(taxes);
      
      let netAmount = quantityDecimal.mul(priceDecimal);
      
      // For buy transactions, add fees and taxes to cost
      // For sell transactions, subtract fees and taxes from proceeds
      if (transactionType === 'BUY' || transactionType === 'TRANSFER_IN') {
        netAmount = netAmount.add(feesDecimal).add(taxesDecimal);
      } else if (transactionType === 'SELL' || transactionType === 'TRANSFER_OUT') {
        netAmount = netAmount.sub(feesDecimal).sub(taxesDecimal);
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          portfolioId,
          // securityId removed - field doesn't exist in schema
          transactionType,
          transactionDate,
          // settleDate: settleDate || transactionDate, // Field doesn't exist in schema
          quantity: quantityDecimal,
          price: priceDecimal,
          fees: feesDecimal,
          taxes: taxesDecimal,
          netAmount,
          description,
          externalId,
          status: 'SETTLED',
          createdBy: req.user!.sub,
          // updatedBy: req.user!.sub, // Field doesn't exist in schema
        } as any,
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
      });

      logger.info('Transaction created', {
        transactionId: transaction.id,
        portfolioId,
        securitySymbol: security.symbol,
        type: transactionType,
        quantity: quantity.toString(),
        userId: req.user!.sub,
        tenantId: req.user!.tenantId,
      });

      trackPortfolioOperation('transaction:create');
      res.status(201).json(transaction);
    } catch (error: any) {
      if ((error as any) instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({
            error: 'Duplicate transaction',
            message: 'A transaction with this external ID already exists',
          });
        }
      }

      logger.error('Error creating transaction:', error);
      trackPortfolioOperation('transaction:create', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create transaction',
      });
    }
  }
);

// PUT /api/transactions/:id - Update transaction
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid transaction ID'),
    body('transactionDate').optional().isISO8601().toDate().withMessage('Invalid transaction date'),
    body('settleDate').optional().isISO8601().toDate().withMessage('Invalid settle date'),
    body('quantity').optional().isDecimal().withMessage('Quantity must be a decimal number'),
    body('price').optional().isDecimal().withMessage('Price must be a decimal number'),
    body('fees').optional().isDecimal().withMessage('Fees must be a decimal number'),
    body('taxes').optional().isDecimal().withMessage('Taxes must be a decimal number'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('status').optional().isIn(['PENDING', 'SETTLED', 'CANCELLED', 'FAILED']).withMessage('Invalid status'),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:update']),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      // Verify user has access to the transaction
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id,
          portfolio: {
            tenantId: req.user!.tenantId,
            OR: [
              { ownerId: req.user!.sub },
              { managerId: req.user!.sub }
            ]
          }
        },
        // include: {
        //   security: true
        // } // Security relation doesn't exist in schema
      });

      if (!existingTransaction) {
        return res.status(404).json({
          error: 'Transaction not found',
          message: 'Transaction does not exist or you do not have access',
        });
      }

      const updateData: any = {
        updatedBy: req.user!.sub,
        updatedAt: new Date()
      };

      // Update fields if provided
      if (req.body.transactionDate !== undefined) updateData.transactionDate = req.body.transactionDate;
      if (req.body.settleDate !== undefined) updateData.settleDate = req.body.settleDate;
      if (req.body.quantity !== undefined) updateData.quantity = new Prisma.Decimal(req.body.quantity);
      if (req.body.price !== undefined) updateData.price = new Prisma.Decimal(req.body.price);
      if (req.body.fees !== undefined) updateData.fees = new Prisma.Decimal(req.body.fees);
      if (req.body.taxes !== undefined) updateData.taxes = new Prisma.Decimal(req.body.taxes);
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.status !== undefined) updateData.status = req.body.status;

      // Recalculate net amount if relevant fields changed
      if (req.body.quantity !== undefined || req.body.price !== undefined || 
          req.body.fees !== undefined || req.body.taxes !== undefined) {
        
        const quantity = updateData.quantity || existingTransaction.quantity;
        const price = updateData.price || existingTransaction.price || new Prisma.Decimal(0);
        const fees = updateData.fees || existingTransaction.fees || new Prisma.Decimal(0);
        const taxes = updateData.taxes || existingTransaction.taxes || new Prisma.Decimal(0);
        
        let netAmount = quantity.mul(price);
        
        if (existingTransaction.transactionType === 'BUY' || existingTransaction.transactionType === 'TRANSFER_IN') {
          netAmount = netAmount.add(fees).add(taxes);
        } else if (existingTransaction.transactionType === 'SELL' || existingTransaction.transactionType === 'TRANSFER_OUT') {
          netAmount = netAmount.sub(fees).sub(taxes);
        }
        
        updateData.netAmount = netAmount;
      }

      const transaction = await prisma.transaction.update({
        where: { id },
        data: updateData,
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
      });

      logger.info('Transaction updated', {
        transactionId: id,
        userId: req.user!.sub,
        tenantId: req.user!.tenantId,
      });

      trackPortfolioOperation('transaction:update');
      res.json(transaction);
    } catch (error: any) {
      logger.error('Error updating transaction:', error);
      trackPortfolioOperation('transaction:update', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update transaction',
      });
    }
  }
);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id',
  [
    param('id').isUUID().withMessage('Invalid transaction ID'),
  ],
  validateRequest,
  requireTenantAccess,
  requirePermission(['transaction:delete']),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      // Verify user has access to the transaction
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id,
          portfolio: {
            tenantId: req.user!.tenantId,
            OR: [
              { ownerId: req.user!.sub },
              { managerId: req.user!.sub }
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
          // updatedBy: req.user!.sub,
          // updatedAt: new Date() // Fields don't exist in schema
        }
      });

      logger.info('Transaction deleted', {
        transactionId: id,
        userId: req.user!.sub,
        tenantId: req.user!.tenantId,
      });

      trackPortfolioOperation('transaction:delete');
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting transaction:', error);
      trackPortfolioOperation('transaction:delete', 'error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete transaction',
      });
    }
  }
);

export { router as transactionRoutes };


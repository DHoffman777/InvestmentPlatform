import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CashEquivalentService } from '../services/cashEquivalentService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const cashEquivalentService = new CashEquivalentService(prisma);


// Get all cash equivalent positions for a portfolio
router.get('/portfolios/:portfolioId/cash-equivalents', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const tenantId = (req as any).user!.tenantId;

    const positions = await cashEquivalentService.getCashEquivalentPositions(portfolioId, tenantId);

    res.json({
      success: true,
      data: positions,
      meta: {
        total: positions.length,
        portfolioId
      }
    });

  } catch (error: any) {
    logger.error('Error fetching cash equivalent positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cash equivalent positions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a money market fund position
router.post('/portfolios/:portfolioId/money-market-funds', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const tenantId = (req as any).user!.tenantId;
    const userId = (req as any).user!.id;

    const {
      fundId,
      shares,
      marketValue,
      currentYield
    } = req.body;

    // Validation
    if (!fundId || !shares || !marketValue || currentYield === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'fundId, shares, marketValue, and currentYield are required'
      });
    }

    if (shares <= 0 || marketValue <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid values',
        message: 'Shares and market value must be positive numbers'
      });
    }

    const position = await cashEquivalentService.createMoneyMarketPosition({
      portfolioId,
      tenantId,
      fundId,
      shares: Number(shares),
      marketValue: Number(marketValue),
      currentYield: Number(currentYield),
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: position,
      message: 'Money market fund position created successfully'
    });

  } catch (error: any) {
    logger.error('Error creating money market fund position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create money market fund position',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a sweep account
router.post('/portfolios/:portfolioId/sweep-accounts', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const tenantId = (req as any).user!.tenantId;
    const userId = (req as any).user!.id;

    const {
      accountId,
      balance,
      currentRate,
      sweepThreshold,
      autoSweepEnabled
    } = req.body;

    // Validation
    if (!accountId || balance === undefined || currentRate === undefined || sweepThreshold === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'accountId, balance, currentRate, and sweepThreshold are required'
      });
    }

    if (balance < 0 || sweepThreshold < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid values',
        message: 'Balance and sweep threshold cannot be negative'
      });
    }

    const sweepAccount = await cashEquivalentService.createSweepAccount({
      portfolioId,
      tenantId,
      accountId,
      balance: Number(balance),
      currentRate: Number(currentRate),
      sweepThreshold: Number(sweepThreshold),
      autoSweepEnabled: Boolean(autoSweepEnabled),
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: sweepAccount,
      message: 'Sweep account created successfully'
    });

  } catch (error: any) {
    logger.error('Error creating sweep account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sweep account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute a sweep transaction
router.post('/portfolios/:portfolioId/sweep', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const tenantId = (req as any).user!.tenantId;
    const userId = (req as any).user!.id;

    const {
      amount,
      sweepType = 'MANUAL',
      triggerEvent
    } = req.body;

    // Validation
    if (amount === undefined || amount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be a non-zero number'
      });
    }

    if (!['AUTO', 'MANUAL'].includes(sweepType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sweep type',
        message: 'sweepType must be either AUTO or MANUAL'
      });
    }

    const transaction = await cashEquivalentService.executeSweep({
      portfolioId,
      tenantId,
      amount: Number(amount),
      sweepType,
      triggerEvent,
      executedBy: userId
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: `Sweep ${amount > 0 ? 'in' : 'out'} executed successfully`
    });

  } catch (error: any) {
    logger.error('Error executing sweep:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute sweep',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process yield distribution
router.post('/positions/:positionId/yield-distribution', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const tenantId = (req as any).user!.tenantId;
    const userId = (req as any).user!.id;

    const {
      distributionDate,
      yieldRate,
      amount,
      distributionType = 'INTEREST'
    } = req.body;

    // Validation
    if (!distributionDate || yieldRate === undefined || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'distributionDate, yieldRate, and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be positive'
      });
    }

    if (!['DIVIDEND', 'INTEREST'].includes(distributionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid distribution type',
        message: 'distributionType must be either DIVIDEND or INTEREST'
      });
    }

    const transaction = await cashEquivalentService.processYieldDistribution({
      positionId,
      distributionDate: new Date(distributionDate),
      yieldRate: Number(yieldRate),
      amount: Number(amount),
      distributionType,
      tenantId,
      processedBy: userId
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Yield distribution processed successfully'
    });

  } catch (error: any) {
    logger.error('Error processing yield distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process yield distribution',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calculate current yield for a position
router.get('/positions/:positionId/yield', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const tenantId = (req as any).user!.tenantId;

    const yieldCalculation = await cashEquivalentService.calculateCurrentYield(positionId, tenantId);

    res.json({
      success: true,
      data: yieldCalculation,
      message: 'Yield calculated successfully'
    });

  } catch (error: any) {
    logger.error('Error calculating yield:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate yield',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get cash equivalent position by ID with detailed information
router.get('/positions/:positionId', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const tenantId = (req as any).user!.tenantId;

    // Get the position from database
    const position = await prisma.position.findFirst({
      where: {
        id: positionId,
        tenantId,
        securityType: 'CASH',
        isActive: true
      },
      include: {
        transactions: {
          where: {
            status: 'SETTLED'
          },
          orderBy: {
            tradeDate: 'desc'
          },
          take: 10
        }
      }
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Position not found',
        message: 'Cash equivalent position not found or access denied'
      });
    }

    // Convert to cash equivalent position format
    const cashEquivalentPosition = {
      id: position.id,
      portfolioId: position.portfolioId,
      tenantId: position.tenantId,
      assetType: position.symbol.startsWith('SWEEP_') ? 'SWEEP_ACCOUNT' : 'MONEY_MARKET_FUND',
      assetId: position.securityId || position.symbol,
      symbol: position.symbol,
      shares: position.symbol.startsWith('SWEEP_') ? undefined : position.quantity.toNumber(),
      balance: position.symbol.startsWith('SWEEP_') ? position.quantity.toNumber() : undefined,
      marketValue: position.marketValue.toNumber(),
      costBasis: position.costBasis.toNumber(),
      liquidityTier: 'T0',
      isActive: position.isActive,
      isPledged: false,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
      lastPriceUpdate: position.lastPriceDate || position.updatedAt,
      recentTransactions: position.transactions.map(tx => ({
        id: tx.id,
        type: tx.transactionType,
        amount: tx.netAmount.toNumber(),
        date: tx.tradeDate
      }))
    };

    // Calculate current yield
    try {
      const yieldCalculation = await cashEquivalentService.calculateCurrentYield(positionId, tenantId);
      (cashEquivalentPosition as any).currentYield = yieldCalculation.currentYield;
      (cashEquivalentPosition as any).yieldCalculation = yieldCalculation;
    } catch (yieldError) {
      logger.warn('Could not calculate yield for position:', yieldError);
      (cashEquivalentPosition as any).currentYield = 0;
    }

    res.json({
      success: true,
      data: cashEquivalentPosition
    });

  } catch (error: any) {
    logger.error('Error fetching cash equivalent position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch position',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'cash-equivalents',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;

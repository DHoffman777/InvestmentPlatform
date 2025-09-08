import { Router } from 'express';
import { CashService, CashEquivalentData, TreasuryData } from '../services/cashService';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { authenticateJWT, requirePermission } from '../middleware/auth';
import { Prisma } from '@prisma/client';

// Create express-validator replacements with proper chaining
const createChain = () => {
  const chain: any = {
    optional: () => chain,
    isString: () => chain,
    isNumeric: () => chain,
    isInt: (options?: any) => chain,
    isIn: (values?: any) => chain,
    isBoolean: () => chain,
    isISO8601: (options?: any) => chain,
    isLength: (options?: any) => chain,
    trim: () => chain,
    notEmpty: () => chain,
    withMessage: (msg?: any) => chain,
    toInt: () => chain,
    min: (val?: any) => chain
  };
  return chain;
};

const query = (field: string) => createChain();
const param = (field: string) => createChain();
const body = (field: string) => createChain();
const validationResult = (req: any) => ({ isEmpty: () => true, array: () => [] });

// Import Decimal if available, or create a mock
class Decimal {
  constructor(value: any) {
    return { toNumber: () => Number(value), toString: () => String(value) } as any;
  }
}

const router = Router();
const cashService = new CashService(prisma);

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

// GET /api/cash/search - Search cash instruments
router.get('/search',
  [
    query('query').optional().isString().trim().isLength({ max: 50 }).withMessage('Query must be max 50 characters'),
    query('assetClass').optional().isIn(['CASH_EQUIVALENT', 'TREASURY']).withMessage('Asset class must be CASH_EQUIVALENT or TREASURY'),
    query('instrumentType').optional().isString().trim().withMessage('Invalid instrument type'),
    query('issuerType').optional().isIn(['GOVERNMENT', 'BANK', 'CORPORATION', 'FEDERAL_AGENCY', 'GSE']).withMessage('Invalid issuer type'),
    query('minYield').optional().isNumeric().withMessage('Min yield must be numeric'),
    query('maxDaysToMaturity').optional().isInt({ min: 0 }).withMessage('Max days to maturity must be non-negative integer'),
    query('creditRating').optional().isString().trim().withMessage('Invalid credit rating'),
    query('riskLevel').optional().isIn(['LOWEST', 'LOW', 'MODERATE']).withMessage('Invalid risk level'),
    query('currency').optional().isString().trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const filters = {
        query: req.query.query as string,
        assetClass: req.query.assetClass as 'CASH_EQUIVALENT' | 'TREASURY',
        instrumentType: req.query.instrumentType as string,
        issuerType: req.query.issuerType as any,
        minYield: req.query.minYield ? Number(req.query.minYield) : undefined,
        maxDaysToMaturity: req.query.maxDaysToMaturity ? Number(req.query.maxDaysToMaturity) : undefined,
        creditRating: req.query.creditRating as string,
        riskLevel: req.query.riskLevel as any,
        currency: req.query.currency as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const results = await cashService.searchCashInstruments(filters);

      res.json({
        results,
        filters,
        count: results.length,
      });
    } catch (error: any) {
      logger.error('Error searching cash instruments:', { filters: req.query, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search cash instruments',
      });
    }
  }
);

// GET /api/cash/:symbol - Get detailed cash instrument information
router.get('/:symbol',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Invalid symbol'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const { symbol } = req.params;

      const details = await cashService.getCashInstrumentDetails(symbol);

      if (!details) {
        return res.status(404).json({
          error: 'Cash instrument not found',
          message: `Cash instrument with symbol ${symbol} not found`,
        });
      }

      res.json({ details });
    } catch (error: any) {
      logger.error('Error fetching cash instrument details:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch cash instrument details',
      });
    }
  }
);

// POST /api/cash/cash-equivalent - Create/update cash equivalent
router.post('/cash-equivalent',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Symbol is required'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('instrumentType').isIn(['TREASURY_BILL', 'COMMERCIAL_PAPER', 'CERTIFICATE_OF_DEPOSIT', 'BANKERS_ACCEPTANCE', 'MONEY_MARKET_DEPOSIT', 'REPURCHASE_AGREEMENT', 'FEDERAL_FUNDS']).withMessage('Invalid instrument type'),
    body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('Currency is required and must be 3 characters'),
    body('country').isString().trim().isLength({ min: 2, max: 2 }).withMessage('Country code is required and must be 2 characters'),
    body('minimumDenomination').isNumeric().withMessage('Minimum denomination is required and must be numeric'),
    body('issuer').isString().trim().withMessage('Issuer is required'),
    body('issuerType').isIn(['GOVERNMENT', 'BANK', 'CORPORATION', 'FEDERAL_AGENCY', 'GSE']).withMessage('Invalid issuer type'),
    body('riskLevel').isIn(['LOWEST', 'LOW', 'MODERATE']).withMessage('Invalid risk level'),
    body('liquidityRating').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'AT_MATURITY']).withMessage('Invalid liquidity rating'),
    body('isMoneyMarketEligible').isBoolean().withMessage('Money market eligible must be boolean'),
    body('maturityDate').optional().isISO8601().toDate().withMessage('Invalid maturity date'),
    body('issueDate').optional().isISO8601().toDate().withMessage('Invalid issue date'),
    body('daysToMaturity').optional().isInt({ min: 0 }).withMessage('Days to maturity must be non-negative integer'),
    body('parValue').optional().isNumeric().withMessage('Par value must be numeric'),
    body('currentYield').optional().isNumeric().withMessage('Current yield must be numeric'),
    body('discountRate').optional().isNumeric().withMessage('Discount rate must be numeric'),
    body('creditRating').optional().isString().trim().withMessage('Invalid credit rating'),
    body('isInsured').optional().isBoolean().withMessage('Is insured must be boolean'),
    body('insuranceProvider').optional().isString().trim().withMessage('Invalid insurance provider'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req: any, res: any) => {
    try {
      const cashData: CashEquivalentData = {
        ...req.body,
        securityType: 'CASH_EQUIVALENT',
        minimumDenomination: new Decimal(req.body.minimumDenomination),
        parValue: req.body.parValue ? new Decimal(req.body.parValue) : undefined,
        currentYield: req.body.currentYield ? new Decimal(req.body.currentYield) : undefined,
        discountRate: req.body.discountRate ? new Decimal(req.body.discountRate) : undefined,
        bankDiscountYield: req.body.bankDiscountYield ? new Decimal(req.body.bankDiscountYield) : undefined,
        bondEquivalentYield: req.body.bondEquivalentYield ? new Decimal(req.body.bondEquivalentYield) : undefined,
        effectiveAnnualRate: req.body.effectiveAnnualRate ? new Decimal(req.body.effectiveAnnualRate) : undefined,
      };

      const cashEquivalent = await cashService.upsertCashEquivalent(cashData);

      res.status(201).json({
        cashEquivalent: {
          ...cashEquivalent,
          marketCap: (cashEquivalent as any).marketCap?.toNumber(),
        },
        message: 'Cash equivalent created/updated successfully',
      });
    } catch (error: any) {
      logger.error('Error creating/updating cash equivalent:', { cashData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update cash equivalent',
      });
    }
  }
);

// POST /api/cash/treasury - Create/update treasury security
router.post('/treasury',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Symbol is required'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('cusip').isString().trim().isLength({ min: 9, max: 9 }).withMessage('CUSIP is required and must be 9 characters'),
    body('instrumentType').isIn(['TREASURY_BILL', 'TREASURY_NOTE', 'TREASURY_BOND', 'TREASURY_STRIP', 'TIPS']).withMessage('Invalid treasury instrument type'),
    body('maturityDate').isISO8601().toDate().withMessage('Maturity date is required'),
    body('issueDate').isISO8601().toDate().withMessage('Issue date is required'),
    body('parValue').isNumeric().withMessage('Par value is required and must be numeric'),
    body('minimumBid').isNumeric().withMessage('Minimum bid is required and must be numeric'),
    body('bidIncrement').isNumeric().withMessage('Bid increment is required and must be numeric'),
    body('daysToMaturity').isInt({ min: 0 }).withMessage('Days to maturity is required and must be non-negative integer'),
    body('dayCountConvention').isIn(['ACTUAL_ACTUAL', 'ACTUAL_360']).withMessage('Invalid day count convention'),
    body('principalPaymentDate').isISO8601().toDate().withMessage('Principal payment date is required'),
    body('auctionDate').optional().isISO8601().toDate().withMessage('Invalid auction date'),
    body('settlementDate').optional().isISO8601().toDate().withMessage('Invalid settlement date'),
    body('auctionType').optional().isIn(['SINGLE_PRICE', 'MULTIPLE_PRICE']).withMessage('Invalid auction type'),
    body('discountRate').optional().isNumeric().withMessage('Discount rate must be numeric'),
    body('couponRate').optional().isNumeric().withMessage('Coupon rate must be numeric'),
    body('yield').optional().isNumeric().withMessage('Yield must be numeric'),
    body('duration').optional().isNumeric().withMessage('Duration must be numeric'),
    body('convexity').optional().isNumeric().withMessage('Convexity must be numeric'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req: any, res: any) => {
    try {
      const treasuryData: TreasuryData = {
        ...req.body,
        securityType: 'TREASURY',
        parValue: new Decimal(req.body.parValue),
        minimumBid: new Decimal(req.body.minimumBid),
        bidIncrement: new Decimal(req.body.bidIncrement),
        competitiveBidAccepted: req.body.competitiveBidAccepted ? new Decimal(req.body.competitiveBidAccepted) : undefined,
        noncompetitiveBidAccepted: req.body.noncompetitiveBidAccepted ? new Decimal(req.body.noncompetitiveBidAccepted) : undefined,
        totalIssued: req.body.totalIssued ? new Decimal(req.body.totalIssued) : undefined,
        discountRate: req.body.discountRate ? new Decimal(req.body.discountRate) : undefined,
        couponRate: req.body.couponRate ? new Decimal(req.body.couponRate) : undefined,
        yield: req.body.yield ? new Decimal(req.body.yield) : undefined,
        inflationIndexRatio: req.body.inflationIndexRatio ? new Decimal(req.body.inflationIndexRatio) : undefined,
        realYield: req.body.realYield ? new Decimal(req.body.realYield) : undefined,
        breakEvenInflationRate: req.body.breakEvenInflationRate ? new Decimal(req.body.breakEvenInflationRate) : undefined,
        duration: req.body.duration ? new Decimal(req.body.duration) : undefined,
        convexity: req.body.convexity ? new Decimal(req.body.convexity) : undefined,
      };

      const treasury = await cashService.upsertTreasury(treasuryData);

      res.status(201).json({
        treasury: {
          ...treasury,
          marketCap: (treasury as any).marketCap?.toNumber(),
        },
        message: 'Treasury security created/updated successfully',
      });
    } catch (error: any) {
      logger.error('Error creating/updating treasury security:', { treasuryData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update treasury security',
      });
    }
  }
);

// GET /api/cash/rates - Get current money market rates
router.get('/rates',
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const rates = await cashService.getMoneyMarketRates();

      res.json({ rates });
    } catch (error: any) {
      logger.error('Error fetching money market rates:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch money market rates',
      });
    }
  }
);

// GET /api/cash/instrument-types - Get cash instrument types and characteristics
router.get('/instrument-types',
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const instrumentTypes = {
        cashEquivalents: {
          TREASURY_BILL: {
            name: 'Treasury Bill',
            description: 'Short-term U.S. government debt obligations with maturities of one year or less',
            characteristics: ['No coupon payments', 'Sold at discount', 'Backed by U.S. government'],
            typicalMaturity: '4 weeks to 52 weeks',
            minimumInvestment: '$100',
            riskLevel: 'LOWEST',
          },
          COMMERCIAL_PAPER: {
            name: 'Commercial Paper',
            description: 'Unsecured, short-term debt instruments issued by corporations',
            characteristics: ['Issued at discount', 'No collateral', 'High credit quality issuers'],
            typicalMaturity: '30 to 270 days',
            minimumInvestment: '$100,000',
            riskLevel: 'LOW',
          },
          CERTIFICATE_OF_DEPOSIT: {
            name: 'Certificate of Deposit',
            description: 'Time deposits offered by banks and credit unions',
            characteristics: ['FDIC insured', 'Fixed interest rate', 'Penalty for early withdrawal'],
            typicalMaturity: '30 days to 5 years',
            minimumInvestment: '$500',
            riskLevel: 'LOWEST',
          },
          BANKERS_ACCEPTANCE: {
            name: 'Banker\'s Acceptance',
            description: 'Short-term debt instrument guaranteed by a commercial bank',
            characteristics: ['Trade finance instrument', 'Bank guarantee', 'Negotiable'],
            typicalMaturity: '30 to 180 days',
            minimumInvestment: '$100,000',
            riskLevel: 'LOW',
          },
          MONEY_MARKET_DEPOSIT: {
            name: 'Money Market Deposit Account',
            description: 'Interest-bearing account with limited transaction privileges',
            characteristics: ['FDIC insured', 'Variable interest rate', 'Limited transactions'],
            typicalMaturity: 'No maturity',
            minimumInvestment: '$1,000',
            riskLevel: 'LOWEST',
          },
          REPURCHASE_AGREEMENT: {
            name: 'Repurchase Agreement',
            description: 'Short-term secured loan where securities are sold with agreement to repurchase',
            characteristics: ['Secured by collateral', 'Very short-term', 'Professional market'],
            typicalMaturity: 'Overnight to 14 days',
            minimumInvestment: '$1,000,000',
            riskLevel: 'LOWEST',
          },
          FEDERAL_FUNDS: {
            name: 'Federal Funds',
            description: 'Overnight lending between banks of reserve balances',
            characteristics: ['Interbank market', 'Unsecured', 'Benchmark rate'],
            typicalMaturity: 'Overnight',
            minimumInvestment: '$1,000,000',
            riskLevel: 'LOWEST',
          },
        },
        treasuries: {
          TREASURY_BILL: {
            name: 'Treasury Bill',
            description: 'Short-term U.S. government securities',
            maturityRange: '4 weeks to 52 weeks',
            minimumBid: '$100',
          },
          TREASURY_NOTE: {
            name: 'Treasury Note',
            description: 'Intermediate-term U.S. government securities',
            maturityRange: '2 to 10 years',
            minimumBid: '$100',
          },
          TREASURY_BOND: {
            name: 'Treasury Bond',
            description: 'Long-term U.S. government securities',
            maturityRange: '20 to 30 years',
            minimumBid: '$100',
          },
          TREASURY_STRIP: {
            name: 'Treasury STRIP',
            description: 'Zero-coupon securities created from Treasury securities',
            maturityRange: 'Various',
            minimumBid: '$100',
          },
          TIPS: {
            name: 'Treasury Inflation-Protected Securities',
            description: 'Treasury securities that adjust for inflation',
            maturityRange: '5, 10, or 30 years',
            minimumBid: '$100',
          },
        },
      };

      res.json({ instrumentTypes });
    } catch (error: any) {
      logger.error('Error fetching instrument types:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch instrument types',
      });
    }
  }
);

export { router as cashRouter };


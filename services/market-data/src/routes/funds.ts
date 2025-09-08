import { Router } from 'express';
const { query, param, body, validationResult } = require('express-validator');
import { FundsService, ETFData, MutualFundData } from '../services/fundsService';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { authenticateJWT, requirePermission } from '../middleware/auth';
import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

const router = Router();
const fundsService = new FundsService(prisma);

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

// GET /api/funds/search - Search funds with advanced filtering
router.get('/search',
  [
    query('query').optional().isString().trim().isLength({ max: 50 }).withMessage('Query must be max 50 characters'),
    query('fundType').optional().isIn(['ETF', 'MUTUAL_FUND']).withMessage('Fund type must be ETF or MUTUAL_FUND'),
    query('assetClass').optional().isString().trim().withMessage('Invalid asset class'),
    query('investmentStyle').optional().isIn(['GROWTH', 'VALUE', 'BLEND']).withMessage('Invalid investment style'),
    query('marketCapFocus').optional().isIn(['LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MULTI_CAP']).withMessage('Invalid market cap focus'),
    query('geographicFocus').optional().isIn(['DOMESTIC', 'INTERNATIONAL', 'EMERGING_MARKETS', 'GLOBAL']).withMessage('Invalid geographic focus'),
    query('fundFamily').optional().isString().trim().withMessage('Invalid fund family'),
    query('minAUM').optional().isNumeric().withMessage('Min AUM must be numeric'),
    query('maxExpenseRatio').optional().isNumeric().withMessage('Max expense ratio must be numeric'),
    query('minMorningstarRating').optional().isInt({ min: 1, max: 5 }).withMessage('Morningstar rating must be 1-5'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const filters = {
        query: req.query.query as string,
        fundType: req.query.fundType as 'ETF' | 'MUTUAL_FUND',
        assetClass: req.query.assetClass as string,
        investmentStyle: req.query.investmentStyle as any,
        marketCapFocus: req.query.marketCapFocus as any,
        geographicFocus: req.query.geographicFocus as any,
        fundFamily: req.query.fundFamily as string,
        minAUM: req.query.minAUM ? Number(req.query.minAUM) : undefined,
        maxExpenseRatio: req.query.maxExpenseRatio ? Number(req.query.maxExpenseRatio) : undefined,
        minMorningstarRating: req.query.minMorningstarRating ? Number(req.query.minMorningstarRating) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const funds = await fundsService.searchFunds(filters);

      res.json({
        funds,
        filters,
        count: funds.length,
      });
    } catch (error: any) {
      logger.error('Error searching funds:', { filters: req.query, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search funds',
      });
    }
  }
);

// GET /api/funds/:symbol - Get detailed fund information
router.get('/:symbol',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const { symbol } = req.params;

      const fund = await fundsService.getFundDetails(symbol);

      if (!fund) {
        return res.status(404).json({
          error: 'Fund not found',
          message: `Fund with symbol ${symbol} not found`,
        });
      }

      res.json({ fund });
    } catch (error: any) {
      logger.error('Error fetching fund details:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch fund details',
      });
    }
  }
);

// POST /api/funds/etf - Create/update ETF
router.post('/etf',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required and must be 1-10 characters'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    body('managementFee').isNumeric().withMessage('Management fee is required and must be numeric'),
    body('expenseRatio').isNumeric().withMessage('Expense ratio is required and must be numeric'),
    body('aum').isNumeric().withMessage('AUM is required and must be numeric'),
    body('fundFamily').isString().trim().isLength({ min: 1 }).withMessage('Fund family is required'),
    body('inceptionDate').isISO8601().toDate().withMessage('Invalid inception date'),
    body('navFrequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY']).withMessage('Invalid NAV frequency'),
    body('assetClass').isIn(['EQUITY_ETF', 'BOND_ETF', 'COMMODITY_ETF', 'CURRENCY_ETF', 'REAL_ESTATE_ETF', 'MIXED_ETF']).withMessage('Invalid asset class'),
    body('investmentStyle').optional().isIn(['GROWTH', 'VALUE', 'BLEND']).withMessage('Invalid investment style'),
    body('marketCapFocus').optional().isIn(['LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MULTI_CAP']).withMessage('Invalid market cap focus'),
    body('geographicFocus').optional().isIn(['DOMESTIC', 'INTERNATIONAL', 'EMERGING_MARKETS', 'GLOBAL']).withMessage('Invalid geographic focus'),
    body('dividendYield').optional().isNumeric().withMessage('Dividend yield must be numeric'),
    body('distributionFrequency').optional().isIn(['ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY']).withMessage('Invalid distribution frequency'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req: any, res: any) => {
    try {
      const etfData: ETFData = {
        ...req.body,
        fundType: 'ETF',
        managementFee: new Decimal(req.body.managementFee),
        expenseRatio: new Decimal(req.body.expenseRatio),
        aum: new Decimal(req.body.aum),
        dividendYield: req.body.dividendYield ? new Decimal(req.body.dividendYield) : undefined,
        averageDailyVolume: req.body.averageDailyVolume ? new Decimal(req.body.averageDailyVolume) : undefined,
        beta: req.body.beta ? new Decimal(req.body.beta) : undefined,
        standardDeviation: req.body.standardDeviation ? new Decimal(req.body.standardDeviation) : undefined,
      };

      const etf = await fundsService.upsertETF(etfData);

      res.status(201).json({
        etf,
        message: 'ETF created/updated successfully',
      });
    } catch (error: any) {
      logger.error('Error creating/updating ETF:', { etfData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update ETF',
      });
    }
  }
);

// POST /api/funds/mutual-fund - Create/update mutual fund
router.post('/mutual-fund',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('managementFee').isNumeric().withMessage('Management fee is required and must be numeric'),
    body('expenseRatio').isNumeric().withMessage('Expense ratio is required and must be numeric'),
    body('aum').isNumeric().withMessage('AUM is required and must be numeric'),
    body('fundFamily').isString().trim().isLength({ min: 1 }).withMessage('Fund family is required'),
    body('inceptionDate').isISO8601().toDate().withMessage('Invalid inception date'),
    body('shareClass').isIn(['A', 'B', 'C', 'I', 'R', 'T', 'Y']).withMessage('Invalid share class'),
    body('minimumInvestment').isNumeric().withMessage('Minimum investment is required and must be numeric'),
    body('navFrequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY']).withMessage('Invalid NAV frequency'),
    body('cutoffTime').isString().trim().withMessage('Cutoff time is required'),
    body('settlementDays').isInt({ min: 0, max: 10 }).withMessage('Settlement days must be 0-10'),
    body('assetClass').isIn(['EQUITY_FUND', 'BOND_FUND', 'MONEY_MARKET_FUND', 'BALANCED_FUND', 'ALTERNATIVE_FUND']).withMessage('Invalid asset class'),
    body('frontLoadFee').optional().isNumeric().withMessage('Front load fee must be numeric'),
    body('backLoadFee').optional().isNumeric().withMessage('Back load fee must be numeric'),
    body('redemptionFee').optional().isNumeric().withMessage('Redemption fee must be numeric'),
    body('minimumSubsequent').optional().isNumeric().withMessage('Minimum subsequent must be numeric'),
    body('morningstarRating').optional().isInt({ min: 1, max: 5 }).withMessage('Morningstar rating must be 1-5'),
    body('isClosedToNewInvestors').optional().isBoolean().withMessage('Closed to new investors must be boolean'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req: any, res: any) => {
    try {
      const fundData: MutualFundData = {
        ...req.body,
        fundType: 'MUTUAL_FUND',
        managementFee: new Decimal(req.body.managementFee),
        expenseRatio: new Decimal(req.body.expenseRatio),
        aum: new Decimal(req.body.aum),
        minimumInvestment: new Decimal(req.body.minimumInvestment),
        frontLoadFee: req.body.frontLoadFee ? new Decimal(req.body.frontLoadFee) : undefined,
        backLoadFee: req.body.backLoadFee ? new Decimal(req.body.backLoadFee) : undefined,
        redemptionFee: req.body.redemptionFee ? new Decimal(req.body.redemptionFee) : undefined,
        minimumSubsequent: req.body.minimumSubsequent ? new Decimal(req.body.minimumSubsequent) : undefined,
        dividendYield: req.body.dividendYield ? new Decimal(req.body.dividendYield) : undefined,
        beta: req.body.beta ? new Decimal(req.body.beta) : undefined,
        standardDeviation: req.body.standardDeviation ? new Decimal(req.body.standardDeviation) : undefined,
      };

      const fund = await fundsService.upsertMutualFund(fundData);

      res.status(201).json({
        fund,
        message: 'Mutual fund created/updated successfully',
      });
    } catch (error: any) {
      logger.error('Error creating/updating mutual fund:', { fundData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update mutual fund',
      });
    }
  }
);

// GET /api/funds/families - Get fund families
router.get('/families',
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const families = await fundsService.getFundFamilies();

      res.json({
        families,
        count: families.length,
      });
    } catch (error: any) {
      logger.error('Error fetching fund families:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch fund families',
      });
    }
  }
);

// GET /api/funds/categories - Get fund categories and characteristics
router.get('/categories',
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const fundCategories = {
        etfCategories: {
          EQUITY_ETF: {
            name: 'Equity ETF',
            description: 'ETFs that primarily invest in stocks',
            subCategories: ['Large Cap', 'Mid Cap', 'Small Cap', 'International', 'Sector-Specific', 'Dividend'],
          },
          BOND_ETF: {
            name: 'Bond ETF',
            description: 'ETFs that invest in fixed income securities',
            subCategories: ['Government', 'Corporate', 'Municipal', 'International', 'High Yield', 'Treasury'],
          },
          COMMODITY_ETF: {
            name: 'Commodity ETF',
            description: 'ETFs that track commodity prices or commodity-related companies',
            subCategories: ['Gold', 'Silver', 'Oil', 'Agriculture', 'Broad Commodities'],
          },
          CURRENCY_ETF: {
            name: 'Currency ETF',
            description: 'ETFs that track foreign currencies',
            subCategories: ['Single Currency', 'Currency Basket', 'Emerging Market Currencies'],
          },
          REAL_ESTATE_ETF: {
            name: 'Real Estate ETF',
            description: 'ETFs that invest in REITs and real estate companies',
            subCategories: ['Residential', 'Commercial', 'Global REITs', 'Mortgage REITs'],
          },
          MIXED_ETF: {
            name: 'Mixed Asset ETF',
            description: 'ETFs that invest across multiple asset classes',
            subCategories: ['Balanced', 'Target Date', 'Multi-Asset Income'],
          },
        },
        mutualFundCategories: {
          EQUITY_FUND: {
            name: 'Equity Fund',
            description: 'Mutual funds that primarily invest in stocks',
            characteristics: ['Active management', 'Professional stock selection', 'Higher potential returns with higher risk'],
          },
          BOND_FUND: {
            name: 'Bond Fund',
            description: 'Mutual funds that invest in fixed income securities',
            characteristics: ['Income focus', 'Lower volatility than stocks', 'Interest rate sensitivity'],
          },
          MONEY_MARKET_FUND: {
            name: 'Money Market Fund',
            description: 'Mutual funds that invest in short-term, high-quality securities',
            characteristics: ['Capital preservation', 'High liquidity', 'Very low risk'],
          },
          BALANCED_FUND: {
            name: 'Balanced Fund',
            description: 'Mutual funds that invest in both stocks and bonds',
            characteristics: ['Diversification', 'Professional asset allocation', 'Moderate risk'],
          },
          ALTERNATIVE_FUND: {
            name: 'Alternative Fund',
            description: 'Mutual funds using non-traditional strategies',
            characteristics: ['Hedge fund strategies', 'Liquid alternatives', 'Low correlation to traditional assets'],
          },
        },
        shareClasses: {
          A: {
            name: 'Class A Shares',
            characteristics: ['Front-end sales charge', 'Lower annual fees', 'Breakpoint discounts available'],
          },
          B: {
            name: 'Class B Shares',
            characteristics: ['Deferred sales charge', 'Higher annual fees', 'Convert to Class A after time period'],
          },
          C: {
            name: 'Class C Shares',
            characteristics: ['Level load structure', 'Higher annual fees', 'Short-term deferred sales charge'],
          },
          I: {
            name: 'Institutional Shares',
            characteristics: ['No sales charge', 'Lower fees', 'High minimum investment'],
          },
          R: {
            name: 'Retirement Shares',
            characteristics: ['Designed for retirement plans', 'No sales charge', 'Various fee structures'],
          },
          T: {
            name: 'Class T Shares',
            characteristics: ['Load-waived Class A shares', 'Available through certain platforms'],
          },
          Y: {
            name: 'Class Y Shares',
            characteristics: ['No sales charge', 'Low fees', 'High minimum investment'],
          },
        },
      };

      res.json({ fundCategories });
    } catch (error: any) {
      logger.error('Error fetching fund categories:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch fund categories',
      });
    }
  }
);

export { router as fundsRouter };


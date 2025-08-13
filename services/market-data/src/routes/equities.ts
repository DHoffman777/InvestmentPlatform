import { Router } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { EquitiesService, EquityData, PreferredStockData, ADRData } from '../services/equitiesService';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { authenticateJWT, requirePermission } from '../middleware/auth';
import { Decimal } from 'decimal.js';

const router = Router();
const equitiesService = new EquitiesService(prisma);

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

// GET /api/equities/search - Search equities with advanced filtering
router.get('/search',
  [
    query('query').optional().isString().trim().isLength({ max: 50 }).withMessage('Query must be max 50 characters'),
    query('equityType').optional().isIn(['COMMON_STOCK', 'PREFERRED_STOCK', 'ADR', 'GDR']).withMessage('Invalid equity type'),
    query('exchange').optional().isString().trim().withMessage('Invalid exchange'),
    query('sector').optional().isString().trim().withMessage('Invalid sector'),
    query('country').optional().isString().trim().withMessage('Invalid country'),
    query('minMarketCap').optional().isNumeric().withMessage('Min market cap must be numeric'),
    query('maxMarketCap').optional().isNumeric().withMessage('Max market cap must be numeric'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const filters = {
        query: req.query.query as string,
        equityType: req.query.equityType as any,
        exchange: req.query.exchange as string,
        sector: req.query.sector as string,
        country: req.query.country as string,
        minMarketCap: req.query.minMarketCap ? Number(req.query.minMarketCap) : undefined,
        maxMarketCap: req.query.maxMarketCap ? Number(req.query.maxMarketCap) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const equities = await equitiesService.searchEquities(filters);

      const formattedEquities = equities.map(equity => ({
        ...equity,
        marketCap: equity.marketCap?.toNumber(),
        latestQuote: equity.quotes?.[0] ? {
          ...equity.quotes[0],
          bid: equity.quotes[0].bid?.toNumber(),
          ask: equity.quotes[0].ask?.toNumber(),
          last: equity.quotes[0].last?.toNumber(),
          change: equity.quotes[0].change?.toNumber(),
          changePercent: equity.quotes[0].changePercent?.toNumber(),
        } : null,
      }));

      res.json({
        equities: formattedEquities,
        filters,
        count: formattedEquities.length,
      });
    } catch (error) {
      logger.error('Error searching equities:', { filters: req.query, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search equities',
      });
    }
  }
);

// GET /api/equities/:symbol - Get detailed equity information
router.get('/:symbol',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const { symbol } = req.params;

      const equity = await equitiesService.getEquityDetails(symbol);

      if (!equity) {
        return res.status(404).json({
          error: 'Equity not found',
          message: `Equity with symbol ${symbol} not found`,
        });
      }

      res.json({ equity });
    } catch (error) {
      logger.error('Error fetching equity details:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch equity details',
      });
    }
  }
);

// POST /api/equities/common-stock - Create/update common stock
router.post('/common-stock',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required and must be 1-10 characters'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required and must be 1-255 characters'),
    body('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('cusip').optional().isString().trim().isLength({ min: 9, max: 9 }).withMessage('CUSIP must be 9 characters'),
    body('isin').optional().isString().trim().isLength({ min: 12, max: 12 }).withMessage('ISIN must be 12 characters'),
    body('sedol').optional().isString().trim().withMessage('Invalid SEDOL'),
    body('country').optional().isString().trim().withMessage('Invalid country'),
    body('sector').optional().isString().trim().withMessage('Invalid sector'),
    body('industry').optional().isString().trim().withMessage('Invalid industry'),
    body('marketCap').optional().isNumeric().withMessage('Market cap must be numeric'),
    body('sharesOutstanding').optional().isNumeric().withMessage('Shares outstanding must be numeric'),
    body('dividendYield').optional().isNumeric().withMessage('Dividend yield must be numeric'),
    body('peRatio').optional().isNumeric().withMessage('PE ratio must be numeric'),
    body('pbRatio').optional().isNumeric().withMessage('PB ratio must be numeric'),
    body('beta').optional().isNumeric().withMessage('Beta must be numeric'),
    body('dividendFrequency').optional().isIn(['ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'SPECIAL']).withMessage('Invalid dividend frequency'),
    body('listingDate').optional().isISO8601().toDate().withMessage('Invalid listing date'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req, res) => {
    try {
      const equityData: EquityData = {
        ...req.body,
        equityType: 'COMMON_STOCK',
        marketCap: req.body.marketCap ? new Decimal(req.body.marketCap) : undefined,
        sharesOutstanding: req.body.sharesOutstanding ? new Decimal(req.body.sharesOutstanding) : undefined,
        dividendYield: req.body.dividendYield ? new Decimal(req.body.dividendYield) : undefined,
        peRatio: req.body.peRatio ? new Decimal(req.body.peRatio) : undefined,
        pbRatio: req.body.pbRatio ? new Decimal(req.body.pbRatio) : undefined,
        beta: req.body.beta ? new Decimal(req.body.beta) : undefined,
      };

      const equity = await equitiesService.upsertEquity(equityData);

      res.status(201).json({
        equity: {
          ...equity,
          marketCap: equity.marketCap?.toNumber(),
        },
        message: 'Common stock created/updated successfully',
      });
    } catch (error) {
      logger.error('Error creating/updating common stock:', { equityData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update common stock',
      });
    }
  }
);

// POST /api/equities/preferred-stock - Create/update preferred stock
router.post('/preferred-stock',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    body('dividendRate').isNumeric().withMessage('Dividend rate is required and must be numeric'),
    body('parValue').isNumeric().withMessage('Par value is required and must be numeric'),
    body('cumulative').isBoolean().withMessage('Cumulative must be boolean'),
    body('perpetual').isBoolean().withMessage('Perpetual must be boolean'),
    body('callPrice').optional().isNumeric().withMessage('Call price must be numeric'),
    body('callDate').optional().isISO8601().toDate().withMessage('Invalid call date'),
    body('convertible').optional().isBoolean().withMessage('Convertible must be boolean'),
    body('conversionRatio').optional().isNumeric().withMessage('Conversion ratio must be numeric'),
    body('maturityDate').optional().isISO8601().toDate().withMessage('Invalid maturity date'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req, res) => {
    try {
      const preferredData: PreferredStockData = {
        ...req.body,
        equityType: 'PREFERRED_STOCK',
        dividendRate: new Decimal(req.body.dividendRate),
        parValue: new Decimal(req.body.parValue),
        callPrice: req.body.callPrice ? new Decimal(req.body.callPrice) : undefined,
        conversionRatio: req.body.conversionRatio ? new Decimal(req.body.conversionRatio) : undefined,
        marketCap: req.body.marketCap ? new Decimal(req.body.marketCap) : undefined,
      };

      const equity = await equitiesService.upsertEquity(preferredData);

      res.status(201).json({
        equity: {
          ...equity,
          marketCap: equity.marketCap?.toNumber(),
        },
        message: 'Preferred stock created/updated successfully',
      });
    } catch (error) {
      logger.error('Error creating/updating preferred stock:', { preferredData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update preferred stock',
      });
    }
  }
);

// POST /api/equities/adr - Create/update ADR/GDR
router.post('/adr',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    body('equityType').isIn(['ADR', 'GDR']).withMessage('Equity type must be ADR or GDR'),
    body('underlyingSymbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Underlying symbol is required'),
    body('underlyingExchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Underlying exchange is required'),
    body('underlyingCurrency').isString().trim().isLength({ min: 3, max: 3 }).withMessage('Underlying currency is required'),
    body('adrRatio').isString().trim().withMessage('ADR ratio is required (e.g., "1:2")'),
    body('depositoryBank').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Depository bank is required'),
    body('level').isInt({ min: 1, max: 3 }).withMessage('Level must be 1, 2, or 3'),
    body('sponsored').isBoolean().withMessage('Sponsored must be boolean'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req, res) => {
    try {
      const adrData: ADRData = {
        ...req.body,
        marketCap: req.body.marketCap ? new Decimal(req.body.marketCap) : undefined,
      };

      const equity = await equitiesService.upsertEquity(adrData);

      res.status(201).json({
        equity: {
          ...equity,
          marketCap: equity.marketCap?.toNumber(),
        },
        message: `${req.body.equityType} created/updated successfully`,
      });
    } catch (error) {
      logger.error('Error creating/updating ADR/GDR:', { adrData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update ADR/GDR',
      });
    }
  }
);

// GET /api/equities/:symbol/dividends - Get dividend history
router.get('/:symbol/dividends',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const dividends = await equitiesService.getDividendHistory(symbol, limit);

      res.json({
        symbol: symbol.toUpperCase(),
        dividends,
        count: dividends.length,
      });
    } catch (error) {
      logger.error('Error fetching dividend history:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch dividend history',
      });
    }
  }
);

// GET /api/equities/:symbol/dividend-metrics - Calculate dividend metrics
router.get('/:symbol/dividend-metrics',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const { symbol } = req.params;

      const metrics = await equitiesService.calculateDividendMetrics(symbol);

      res.json({
        symbol: symbol.toUpperCase(),
        ...metrics,
      });
    } catch (error) {
      logger.error('Error calculating dividend metrics:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to calculate dividend metrics',
      });
    }
  }
);

// GET /api/equities/types - Get available equity types and their characteristics
router.get('/types',
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const equityTypes = {
        COMMON_STOCK: {
          name: 'Common Stock',
          description: 'Represents ownership shares in a company with voting rights and dividend eligibility',
          characteristics: [
            'Voting rights in company decisions',
            'Dividend payments (if declared)',
            'Capital appreciation potential',
            'Last claim on company assets in liquidation',
          ],
        },
        PREFERRED_STOCK: {
          name: 'Preferred Stock',
          description: 'Hybrid security with characteristics of both stocks and bonds',
          characteristics: [
            'Fixed dividend payments (usually)',
            'Priority over common stock for dividends and liquidation',
            'Limited or no voting rights',
            'May be callable or convertible',
            'Can be cumulative or non-cumulative',
          ],
        },
        ADR: {
          name: 'American Depositary Receipt',
          description: 'Certificate representing shares in a foreign company traded on U.S. exchanges',
          characteristics: [
            'Denominated in U.S. dollars',
            'Eliminates currency conversion for U.S. investors',
            'Subject to foreign exchange risk',
            'Different levels (I, II, III) with varying requirements',
            'May be sponsored or unsponsored',
          ],
        },
        GDR: {
          name: 'Global Depositary Receipt',
          description: 'Certificate representing shares in a foreign company for international trading',
          characteristics: [
            'Typically denominated in USD or EUR',
            'Traded on multiple international exchanges',
            'Facilitates global investing',
            'Similar to ADRs but with broader international scope',
          ],
        },
      };

      res.json({ equityTypes });
    } catch (error) {
      logger.error('Error fetching equity types:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch equity types',
      });
    }
  }
);

export { router as equitiesRouter };
import { Router } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { MarketDataService } from '../services/marketDataService';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();
const marketDataService = new MarketDataService(prisma);

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

// GET /api/securities/search - Search securities
router.get('/search',
  [
    query('q').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Query must be between 1 and 50 characters'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const { q: query, limit = 10 } = req.query as any;

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
    } catch (error) {
      logger.error('Error searching securities:', { query: req.query.q, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search securities',
      });
    }
  }
);

// GET /api/securities/:symbol - Get security details
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

      const security = await prisma.security.findUnique({
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
    } catch (error) {
      logger.error('Error fetching security:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch security',
      });
    }
  }
);

// POST /api/securities - Create or update security (admin only)
router.post('/',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required and must be 1-10 characters'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required and must be 1-255 characters'),
    body('assetClass').isIn(['EQUITY', 'BOND', 'ETF', 'MUTUAL_FUND', 'OPTION', 'FUTURE', 'COMMODITY', 'CRYPTOCURRENCY', 'CASH']).withMessage('Invalid asset class'),
    body('securityType').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Security type is required'),
    body('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('cusip').optional().isString().trim().isLength({ min: 9, max: 9 }).withMessage('CUSIP must be 9 characters'),
    body('isin').optional().isString().trim().isLength({ min: 12, max: 12 }).withMessage('ISIN must be 12 characters'),
    body('country').optional().isString().trim().withMessage('Invalid country'),
    body('sector').optional().isString().trim().withMessage('Invalid sector'),
    body('industry').optional().isString().trim().withMessage('Invalid industry'),
    body('marketCap').optional().isNumeric().withMessage('Market cap must be numeric'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req, res) => {
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
    } catch (error) {
      logger.error('Error creating/updating security:', { securityData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update security',
      });
    }
  }
);

// GET /api/securities - List securities with filtering
router.get('/',
  [
    query('assetClass').optional().isIn(['EQUITY', 'BOND', 'ETF', 'MUTUAL_FUND', 'OPTION', 'FUTURE', 'COMMODITY', 'CRYPTOCURRENCY', 'CASH']).withMessage('Invalid asset class'),
    query('exchange').optional().isString().trim().withMessage('Invalid exchange'),
    query('country').optional().isString().trim().withMessage('Invalid country'),
    query('sector').optional().isString().trim().withMessage('Invalid sector'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const { 
        assetClass, 
        exchange, 
        country, 
        sector, 
        page = 1, 
        limit = 20 
      } = req.query as any;

      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        isActive: true,
      };

      if (assetClass) whereClause.assetClass = assetClass;
      if (exchange) whereClause.exchange = exchange;
      if (country) whereClause.country = country;
      if (sector) whereClause.sector = sector;

      const [securities, total] = await Promise.all([
        prisma.security.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { symbol: 'asc' }
        }),
        prisma.security.count({ where: whereClause })
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
    } catch (error) {
      logger.error('Error listing securities:', { query: req.query, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list securities',
      });
    }
  }
);

export { router as securitiesRouter };
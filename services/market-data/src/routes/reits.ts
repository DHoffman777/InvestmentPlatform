import { Router } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { REITsService, REITData, MLPData } from '../services/reitsService';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { authenticateJWT, requirePermission } from '../middleware/auth';
import { Decimal } from 'decimal.js';

const router = Router();
const reitsService = new REITsService(prisma);

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

// GET /api/reits/search - Search REITs and MLPs
router.get('/search',
  [
    query('query').optional().isString().trim().isLength({ max: 50 }).withMessage('Query must be max 50 characters'),
    query('securityType').optional().isIn(['REIT', 'MLP']).withMessage('Security type must be REIT or MLP'),
    query('reitType').optional().isIn(['EQUITY_REIT', 'MORTGAGE_REIT', 'HYBRID_REIT']).withMessage('Invalid REIT type'),
    query('mlpType').optional().isIn(['ENERGY', 'NATURAL_RESOURCES', 'INFRASTRUCTURE', 'REAL_ESTATE', 'OTHER']).withMessage('Invalid MLP type'),
    query('minMarketCap').optional().isNumeric().withMessage('Min market cap must be numeric'),
    query('maxMarketCap').optional().isNumeric().withMessage('Max market cap must be numeric'),
    query('minDividendYield').optional().isNumeric().withMessage('Min dividend yield must be numeric'),
    query('maxPriceToFFO').optional().isNumeric().withMessage('Max price to FFO must be numeric'),
    query('geographicFocus').optional().isIn(['DOMESTIC', 'INTERNATIONAL', 'GLOBAL']).withMessage('Invalid geographic focus'),
    query('sector').optional().isString().trim().withMessage('Invalid sector'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const filters = {
        query: req.query.query as string,
        securityType: req.query.securityType as 'REIT' | 'MLP',
        reitType: req.query.reitType as any,
        mlpType: req.query.mlpType as any,
        propertyTypes: req.query.propertyTypes ? (req.query.propertyTypes as string).split(',') : undefined,
        minMarketCap: req.query.minMarketCap ? Number(req.query.minMarketCap) : undefined,
        maxMarketCap: req.query.maxMarketCap ? Number(req.query.maxMarketCap) : undefined,
        minDividendYield: req.query.minDividendYield ? Number(req.query.minDividendYield) : undefined,
        maxPriceToFFO: req.query.maxPriceToFFO ? Number(req.query.maxPriceToFFO) : undefined,
        geographicFocus: req.query.geographicFocus as string,
        sector: req.query.sector as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const results = await reitsService.searchREITsAndMLPs(filters);

      res.json({
        results,
        filters,
        count: results.length,
      });
    } catch (error) {
      logger.error('Error searching REITs/MLPs:', { filters: req.query, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search REITs/MLPs',
      });
    }
  }
);

// GET /api/reits/:symbol - Get detailed REIT/MLP information
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

      const details = await reitsService.getREITOrMLPDetails(symbol);

      if (!details) {
        return res.status(404).json({
          error: 'REIT/MLP not found',
          message: `REIT/MLP with symbol ${symbol} not found`,
        });
      }

      res.json({ details });
    } catch (error) {
      logger.error('Error fetching REIT/MLP details:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch REIT/MLP details',
      });
    }
  }
);

// POST /api/reits/reit - Create/update REIT
router.post('/reit',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    body('reitType').isIn(['EQUITY_REIT', 'MORTGAGE_REIT', 'HYBRID_REIT']).withMessage('Invalid REIT type'),
    body('propertyTypes').isArray({ min: 1 }).withMessage('Property types array is required'),
    body('propertyTypes.*').isString().withMessage('Each property type must be a string'),
    body('marketCap').isNumeric().withMessage('Market cap is required and must be numeric'),
    body('dividendYield').optional().isNumeric().withMessage('Dividend yield must be numeric'),
    body('distributionFrequency').optional().isIn(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).withMessage('Invalid distribution frequency'),
    body('fundsFromOperations').optional().isNumeric().withMessage('FFO must be numeric'),
    body('adjustedFFO').optional().isNumeric().withMessage('AFFO must be numeric'),
    body('netAssetValue').optional().isNumeric().withMessage('NAV must be numeric'),
    body('priceToFFO').optional().isNumeric().withMessage('Price to FFO must be numeric'),
    body('debtToEquityRatio').optional().isNumeric().withMessage('Debt to equity ratio must be numeric'),
    body('occupancyRate').optional().isNumeric().withMessage('Occupancy rate must be numeric'),
    body('geographicFocus').optional().isIn(['DOMESTIC', 'INTERNATIONAL', 'GLOBAL']).withMessage('Invalid geographic focus'),
    body('totalProperties').optional().isInt({ min: 0 }).withMessage('Total properties must be non-negative integer'),
    body('totalSquareFootage').optional().isNumeric().withMessage('Total square footage must be numeric'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req, res) => {
    try {
      const reitData: REITData = {
        ...req.body,
        securityType: 'REIT',
        marketCap: new Decimal(req.body.marketCap),
        dividendYield: req.body.dividendYield ? new Decimal(req.body.dividendYield) : undefined,
        fundsFromOperations: req.body.fundsFromOperations ? new Decimal(req.body.fundsFromOperations) : undefined,
        adjustedFFO: req.body.adjustedFFO ? new Decimal(req.body.adjustedFFO) : undefined,
        netAssetValue: req.body.netAssetValue ? new Decimal(req.body.netAssetValue) : undefined,
        priceToFFO: req.body.priceToFFO ? new Decimal(req.body.priceToFFO) : undefined,
        debtToEquityRatio: req.body.debtToEquityRatio ? new Decimal(req.body.debtToEquityRatio) : undefined,
        occupancyRate: req.body.occupancyRate ? new Decimal(req.body.occupancyRate) : undefined,
        totalSquareFootage: req.body.totalSquareFootage ? new Decimal(req.body.totalSquareFootage) : undefined,
        totalReturn1Y: req.body.totalReturn1Y ? new Decimal(req.body.totalReturn1Y) : undefined,
        totalReturn3Y: req.body.totalReturn3Y ? new Decimal(req.body.totalReturn3Y) : undefined,
        totalReturn5Y: req.body.totalReturn5Y ? new Decimal(req.body.totalReturn5Y) : undefined,
        beta: req.body.beta ? new Decimal(req.body.beta) : undefined,
        standardDeviation: req.body.standardDeviation ? new Decimal(req.body.standardDeviation) : undefined,
      };

      const reit = await reitsService.upsertREIT(reitData);

      res.status(201).json({
        reit: {
          ...reit,
          marketCap: reit.marketCap?.toNumber(),
        },
        message: 'REIT created/updated successfully',
      });
    } catch (error) {
      logger.error('Error creating/updating REIT:', { reitData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update REIT',
      });
    }
  }
);

// POST /api/reits/mlp - Create/update MLP
router.post('/mlp',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required'),
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
    body('exchange').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Exchange is required'),
    body('mlpType').isIn(['ENERGY', 'NATURAL_RESOURCES', 'INFRASTRUCTURE', 'REAL_ESTATE', 'OTHER']).withMessage('Invalid MLP type'),
    body('businessDescription').isString().trim().isLength({ min: 10 }).withMessage('Business description is required'),
    body('sector').isString().trim().withMessage('Sector is required'),
    body('marketCap').isNumeric().withMessage('Market cap is required and must be numeric'),
    body('generalPartner').isString().trim().withMessage('General partner is required'),
    body('k1Eligible').isBoolean().withMessage('K1 eligible must be boolean'),
    body('distributionYield').optional().isNumeric().withMessage('Distribution yield must be numeric'),
    body('distributionFrequency').optional().isIn(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).withMessage('Invalid distribution frequency'),
    body('distributionCoverage').optional().isNumeric().withMessage('Distribution coverage must be numeric'),
    body('distributionGrowthRate').optional().isNumeric().withMessage('Distribution growth rate must be numeric'),
    body('distributableCashFlow').optional().isNumeric().withMessage('DCF must be numeric'),
    body('ebitda').optional().isNumeric().withMessage('EBITDA must be numeric'),
    body('debtToEbitda').optional().isNumeric().withMessage('Debt to EBITDA must be numeric'),
    body('returnOnInvestedCapital').optional().isNumeric().withMessage('ROIC must be numeric'),
    body('incentiveDistributionRights').optional().isBoolean().withMessage('IDRs must be boolean'),
    body('managementFee').optional().isNumeric().withMessage('Management fee must be numeric'),
    body('qualifiedIncome').optional().isNumeric().withMessage('Qualified income must be numeric'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req, res) => {
    try {
      const mlpData: MLPData = {
        ...req.body,
        securityType: 'MLP',
        marketCap: new Decimal(req.body.marketCap),
        distributionYield: req.body.distributionYield ? new Decimal(req.body.distributionYield) : undefined,
        distributionCoverage: req.body.distributionCoverage ? new Decimal(req.body.distributionCoverage) : undefined,
        distributionGrowthRate: req.body.distributionGrowthRate ? new Decimal(req.body.distributionGrowthRate) : undefined,
        distributableCashFlow: req.body.distributableCashFlow ? new Decimal(req.body.distributableCashFlow) : undefined,
        ebitda: req.body.ebitda ? new Decimal(req.body.ebitda) : undefined,
        debtToEbitda: req.body.debtToEbitda ? new Decimal(req.body.debtToEbitda) : undefined,
        returnOnInvestedCapital: req.body.returnOnInvestedCapital ? new Decimal(req.body.returnOnInvestedCapital) : undefined,
        pipelineMiles: req.body.pipelineMiles ? new Decimal(req.body.pipelineMiles) : undefined,
        storageCapacity: req.body.storageCapacity ? new Decimal(req.body.storageCapacity) : undefined,
        processingCapacity: req.body.processingCapacity ? new Decimal(req.body.processingCapacity) : undefined,
        managementFee: req.body.managementFee ? new Decimal(req.body.managementFee) : undefined,
        qualifiedIncome: req.body.qualifiedIncome ? new Decimal(req.body.qualifiedIncome) : undefined,
        totalReturn1Y: req.body.totalReturn1Y ? new Decimal(req.body.totalReturn1Y) : undefined,
        totalReturn3Y: req.body.totalReturn3Y ? new Decimal(req.body.totalReturn3Y) : undefined,
        totalReturn5Y: req.body.totalReturn5Y ? new Decimal(req.body.totalReturn5Y) : undefined,
        beta: req.body.beta ? new Decimal(req.body.beta) : undefined,
        standardDeviation: req.body.standardDeviation ? new Decimal(req.body.standardDeviation) : undefined,
      };

      const mlp = await reitsService.upsertMLP(mlpData);

      res.status(201).json({
        mlp: {
          ...mlp,
          marketCap: mlp.marketCap?.toNumber(),
        },
        message: 'MLP created/updated successfully',
      });
    } catch (error) {
      logger.error('Error creating/updating MLP:', { mlpData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create/update MLP',
      });
    }
  }
);

// GET /api/reits/property-types - Get REIT property types
router.get('/property-types',
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const propertyTypes = {
        residential: {
          name: 'Residential',
          description: 'Apartment complexes, single-family rentals, manufactured housing',
          subTypes: ['Apartments', 'Single-Family Homes', 'Manufactured Housing', 'Student Housing'],
        },
        office: {
          name: 'Office',
          description: 'Office buildings and corporate headquarters',
          subTypes: ['Class A Office', 'Class B Office', 'Medical Office', 'Government Buildings'],
        },
        retail: {
          name: 'Retail',
          description: 'Shopping centers, malls, and standalone retail properties',
          subTypes: ['Shopping Centers', 'Regional Malls', 'Strip Centers', 'Free-Standing Retail'],
        },
        industrial: {
          name: 'Industrial',
          description: 'Warehouses, distribution centers, and manufacturing facilities',
          subTypes: ['Warehouses', 'Distribution Centers', 'Manufacturing', 'Self Storage'],
        },
        healthcare: {
          name: 'Healthcare',
          description: 'Hospitals, medical facilities, and senior housing',
          subTypes: ['Hospitals', 'Medical Office Buildings', 'Senior Housing', 'Skilled Nursing'],
        },
        hotel: {
          name: 'Hotel',
          description: 'Hotels, resorts, and lodging facilities',
          subTypes: ['Full Service Hotels', 'Limited Service Hotels', 'Extended Stay', 'Resorts'],
        },
        datacenter: {
          name: 'Data Center',
          description: 'Data centers and technology infrastructure',
          subTypes: ['Colocation', 'Hyperscale', 'Enterprise Data Centers', 'Edge Computing'],
        },
        specialty: {
          name: 'Specialty',
          description: 'Specialized property types',
          subTypes: ['Timberland', 'Infrastructure', 'Gaming', 'Outdoor Advertising'],
        },
      };

      res.json({ propertyTypes });
    } catch (error) {
      logger.error('Error fetching property types:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch property types',
      });
    }
  }
);

// GET /api/reits/mlp-sectors - Get MLP sector information
router.get('/mlp-sectors',
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const mlpSectors = {
        energy: {
          name: 'Energy',
          description: 'Pipeline transportation, storage, and processing of oil, gas, and refined products',
          subSectors: ['Pipeline Transportation', 'Midstream Services', 'Storage Facilities', 'Processing Plants'],
          characteristics: ['Stable cash flows', 'Fee-based business model', 'Long-term contracts'],
        },
        naturalResources: {
          name: 'Natural Resources',
          description: 'Coal, minerals, timber, and other natural resource operations',
          subSectors: ['Coal Transportation', 'Mineral Rights', 'Timber Operations', 'Marine Transportation'],
          characteristics: ['Commodity exposure', 'Asset-heavy operations', 'Long-lived assets'],
        },
        infrastructure: {
          name: 'Infrastructure',
          description: 'Essential infrastructure assets and services',
          subSectors: ['Toll Roads', 'Ports', 'Airports', 'Utilities'],
          characteristics: ['Essential services', 'Regulated operations', 'Capital intensive'],
        },
        realEstate: {
          name: 'Real Estate',
          description: 'Real estate ownership and development through MLP structure',
          subSectors: ['Commercial Properties', 'Residential Development', 'Land Holdings'],
          characteristics: ['Development focus', 'Property appreciation', 'Rental income'],
        },
      };

      res.json({ mlpSectors });
    } catch (error) {
      logger.error('Error fetching MLP sectors:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch MLP sectors',
      });
    }
  }
);

export { router as reitsRouter };
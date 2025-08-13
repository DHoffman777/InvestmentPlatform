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

// GET /api/corporate-actions/:symbol - Get corporate actions for a symbol
router.get('/:symbol',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('actionType').optional().isIn(['DIVIDEND', 'SPLIT', 'MERGER', 'SPINOFF', 'SPECIAL_DIVIDEND', 'RIGHTS_OFFERING']).withMessage('Invalid action type'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const { symbol } = req.params;
      const { startDate, endDate, actionType } = req.query as any;

      let corporateActions = await marketDataService.getCorporateActions(
        symbol.toUpperCase(),
        startDate,
        endDate
      );

      // Filter by action type if specified
      if (actionType) {
        corporateActions = corporateActions.filter(action => action.actionType === actionType);
      }

      const formattedActions = corporateActions.map(action => ({
        ...action,
        value: action.value?.toNumber(),
      }));

      res.json({
        symbol: symbol.toUpperCase(),
        corporateActions: formattedActions,
        count: formattedActions.length,
        filters: {
          startDate,
          endDate,
          actionType,
        }
      });
    } catch (error) {
      logger.error('Error fetching corporate actions:', { 
        symbol: req.params.symbol, 
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        error 
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch corporate actions',
      });
    }
  }
);

// POST /api/corporate-actions - Create corporate action (admin only)
router.post('/',
  [
    body('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Symbol is required'),
    body('actionType').isIn(['DIVIDEND', 'SPLIT', 'MERGER', 'SPINOFF', 'SPECIAL_DIVIDEND', 'RIGHTS_OFFERING']).withMessage('Invalid action type'),
    body('exDate').isISO8601().toDate().withMessage('Ex-date is required and must be valid'),
    body('recordDate').optional().isISO8601().toDate().withMessage('Record date must be valid'),
    body('payDate').optional().isISO8601().toDate().withMessage('Pay date must be valid'),
    body('announcementDate').optional().isISO8601().toDate().withMessage('Announcement date must be valid'),
    body('effectiveDate').optional().isISO8601().toDate().withMessage('Effective date must be valid'),
    body('description').isString().trim().isLength({ min: 1, max: 500 }).withMessage('Description is required and must be 1-500 characters'),
    body('value').optional().isNumeric().withMessage('Value must be numeric'),
    body('ratio').optional().isString().trim().withMessage('Ratio must be a string'),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:write']),
  async (req, res) => {
    try {
      const corporateActionData = {
        ...req.body,
        symbol: req.body.symbol.toUpperCase(),
      };

      const corporateAction = await marketDataService.storeCorporateAction(corporateActionData);

      res.status(201).json({
        corporateAction: {
          ...corporateAction,
          value: corporateAction.value?.toNumber(),
        }
      });
    } catch (error) {
      logger.error('Error creating corporate action:', { corporateActionData: req.body, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create corporate action',
      });
    }
  }
);

// GET /api/corporate-actions - List upcoming corporate actions
router.get('/',
  [
    query('daysAhead').optional().isInt({ min: 0, max: 365 }).toInt().withMessage('Days ahead must be between 0 and 365'),
    query('actionType').optional().isIn(['DIVIDEND', 'SPLIT', 'MERGER', 'SPINOFF', 'SPECIAL_DIVIDEND', 'RIGHTS_OFFERING']).withMessage('Invalid action type'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req, res) => {
    try {
      const { 
        daysAhead = 30, 
        actionType, 
        page = 1, 
        limit = 20 
      } = req.query as any;

      const skip = (page - 1) * limit;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      
      const whereClause: any = {
        exDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'PENDING',
      };

      if (actionType) {
        whereClause.actionType = actionType;
      }

      const [corporateActions, total] = await Promise.all([
        prisma.corporateAction.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            security: {
              select: {
                symbol: true,
                name: true,
                exchange: true,
              }
            }
          },
          orderBy: { exDate: 'asc' }
        }),
        prisma.corporateAction.count({ where: whereClause })
      ]);

      const formattedActions = corporateActions.map(action => ({
        ...action,
        value: action.value?.toNumber(),
      }));

      res.json({
        corporateActions: formattedActions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          daysAhead,
          actionType,
        }
      });
    } catch (error) {
      logger.error('Error listing corporate actions:', { query: req.query, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list corporate actions',
      });
    }
  }
);

export { router as corporateActionsRouter };
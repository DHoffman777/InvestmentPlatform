import { Router } from 'express';
const { query, param, validationResult } = require('express-validator');
import { MarketDataService } from '../services/marketDataService';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { authenticateJWT, requirePermission } from '../middleware/auth';
import { subDays, startOfDay, endOfDay } from 'date-fns';

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

// GET /api/historical/:symbol - Get historical data for a symbol
router.get('/:symbol',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', 'MAX']).withMessage('Invalid period'),
    query('source').optional().isString().trim().withMessage('Invalid source'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const { symbol } = req.params;
      const { startDate, endDate, period, source } = req.query as any;

      let finalStartDate: Date;
      let finalEndDate: Date = endDate ? new Date(endDate) : endOfDay(new Date());

      // Calculate start date based on period if not provided
      if (startDate) {
        finalStartDate = new Date(startDate);
      } else if (period) {
        const now = new Date();
        switch (period) {
          case '1D':
            finalStartDate = startOfDay(subDays(now, 1));
            break;
          case '1W':
            finalStartDate = startOfDay(subDays(now, 7));
            break;
          case '1M':
            finalStartDate = startOfDay(subDays(now, 30));
            break;
          case '3M':
            finalStartDate = startOfDay(subDays(now, 90));
            break;
          case '6M':
            finalStartDate = startOfDay(subDays(now, 180));
            break;
          case '1Y':
            finalStartDate = startOfDay(subDays(now, 365));
            break;
          case '2Y':
            finalStartDate = startOfDay(subDays(now, 730));
            break;
          case '5Y':
            finalStartDate = startOfDay(subDays(now, 1825));
            break;
          default: // MAX
            finalStartDate = startOfDay(subDays(now, 7300)); // ~20 years
        }
      } else {
        // Default to 1 year
        finalStartDate = startOfDay(subDays(new Date(), 365));
      }

      const historicalData = await marketDataService.getHistoricalData(
        symbol.toUpperCase(),
        finalStartDate,
        finalEndDate,
        source
      );

      const formattedData = historicalData.map(data => ({
        ...data,
        open: data.open.toNumber(),
        high: data.high.toNumber(),
        low: data.low.toNumber(),
        close: data.close.toNumber(),
        adjustedClose: data.adjustedClose.toNumber(),
        volume: data.volume.toString(),
        dividend: data.dividend?.toNumber(),
        splitRatio: data.splitRatio?.toNumber(),
      }));

      res.json({
        symbol: symbol.toUpperCase(),
        data: formattedData,
        period: {
          startDate: finalStartDate,
          endDate: finalEndDate,
          requestedPeriod: period || 'custom',
        },
        count: formattedData.length,
        source: source || 'all',
      });
    } catch (error: any) {
      logger.error('Error fetching historical data:', { 
        symbol: req.params.symbol, 
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        error 
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch historical data',
      });
    }
  }
);

// GET /api/historical/:symbol/ohlc - Get OHLC data optimized for charts
router.get('/:symbol/ohlc',
  [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
    query('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y']).withMessage('Invalid period'),
    query('interval').optional().isIn(['1d', '1w', '1m']).withMessage('Invalid interval'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const { symbol } = req.params;
      const { period = '1Y', interval = '1d' } = req.query as any;

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '1D':
          startDate = startOfDay(subDays(now, 1));
          break;
        case '1W':
          startDate = startOfDay(subDays(now, 7));
          break;
        case '1M':
          startDate = startOfDay(subDays(now, 30));
          break;
        case '3M':
          startDate = startOfDay(subDays(now, 90));
          break;
        case '6M':
          startDate = startOfDay(subDays(now, 180));
          break;
        case '1Y':
          startDate = startOfDay(subDays(now, 365));
          break;
        case '2Y':
          startDate = startOfDay(subDays(now, 730));
          break;
        default: // 5Y
          startDate = startOfDay(subDays(now, 1825));
      }

      const historicalData = await marketDataService.getHistoricalData(
        symbol.toUpperCase(),
        startDate,
        endOfDay(now)
      );

      // Format data for OHLC charts
      const ohlcData = historicalData.map(data => [
        data.date.getTime(), // timestamp
        data.open.toNumber(),
        data.high.toNumber(),
        data.low.toNumber(),
        data.close.toNumber(),
        parseInt(data.volume.toString()),
      ]);

      res.json({
        symbol: symbol.toUpperCase(),
        ohlc: ohlcData,
        period,
        interval,
        count: ohlcData.length,
      });
    } catch (error: any) {
      logger.error('Error fetching OHLC data:', { 
        symbol: req.params.symbol, 
        period: req.query.period,
        error 
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch OHLC data',
      });
    }
  }
);

export { router as historicalRouter };

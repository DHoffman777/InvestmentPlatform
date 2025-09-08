import { Router } from 'express';
const { query, param, validationResult } = require('express-validator');
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

// GET /api/quotes/:symbol - Get real-time quote for a symbol
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
      const quote = await marketDataService.getRealtimeQuote(symbol.toUpperCase());

      if (!quote) {
        return res.status(404).json({
          error: 'Quote not found',
          message: `No quote available for symbol: ${symbol}`,
        });
      }

      res.json({
        quote: {
          ...quote,
          bid: quote.bid?.toNumber(),
          ask: quote.ask?.toNumber(),
          last: quote.last?.toNumber(),
          open: quote.open?.toNumber(),
          high: quote.high?.toNumber(),
          low: quote.low?.toNumber(),
          close: quote.close?.toNumber(),
          previousClose: quote.previousClose?.toNumber(),
          change: quote.change?.toNumber(),
          changePercent: quote.changePercent?.toNumber(),
          volume: quote.volume?.toString(),
        }
      });
    } catch (error: any) {
      logger.error('Error fetching quote:', { symbol: req.params.symbol, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch quote',
      });
    }
  }
);

// GET /api/quotes - Get multiple quotes
router.get('/',
  [
    query('symbols').isString().withMessage('Symbols parameter is required'),
  ],
  validateRequest,
  authenticateJWT,
  requirePermission(['market-data:read']),
  async (req: any, res: any) => {
    try {
      const { symbols } = req.query as any;
      const symbolList = symbols.split(',').map((s: string) => s.trim().toUpperCase()).slice(0, 50); // Limit to 50 symbols

      if (symbolList.length === 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'At least one symbol is required',
        });
      }

      const quotes = await marketDataService.getMultipleQuotes(symbolList);

      const formattedQuotes = quotes.map(quote => quote ? {
        ...quote,
        bid: quote.bid?.toNumber(),
        ask: quote.ask?.toNumber(),
        last: quote.last?.toNumber(),
        open: quote.open?.toNumber(),
        high: quote.high?.toNumber(),
        low: quote.low?.toNumber(),
        close: quote.close?.toNumber(),
        previousClose: quote.previousClose?.toNumber(),
        change: quote.change?.toNumber(),
        changePercent: quote.changePercent?.toNumber(),
        volume: quote.volume?.toString(),
      } : null).filter(Boolean);

      res.json({
        quotes: formattedQuotes,
        requestedSymbols: symbolList,
        foundCount: formattedQuotes.length,
      });
    } catch (error: any) {
      logger.error('Error fetching multiple quotes:', { symbols: req.query.symbols, error });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch quotes',
      });
    }
  }
);

export { router as quotesRouter };

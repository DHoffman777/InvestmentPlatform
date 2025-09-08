"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotesRouter = void 0;
const express_1 = require("express");
const { query, param, validationResult } = require('express-validator');
const marketDataService_1 = require("../services/marketDataService");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.quotesRouter = router;
const marketDataService = new marketDataService_1.MarketDataService(database_1.prisma);
// Validation middleware
const validateRequest = (req, res, next) => {
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
router.get('/:symbol', [
    param('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:read']), async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching quote:', { symbol: req.params.symbol, error });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch quote',
        });
    }
});
// GET /api/quotes - Get multiple quotes
router.get('/', [
    query('symbols').isString().withMessage('Symbols parameter is required'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:read']), async (req, res) => {
    try {
        const { symbols } = req.query;
        const symbolList = symbols.split(',').map((s) => s.trim().toUpperCase()).slice(0, 50); // Limit to 50 symbols
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching multiple quotes:', { symbols: req.query.symbols, error });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch quotes',
        });
    }
});

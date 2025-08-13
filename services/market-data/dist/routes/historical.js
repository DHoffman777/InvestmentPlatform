"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historicalRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const marketDataService_1 = require("../services/marketDataService");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
exports.historicalRouter = router;
const marketDataService = new marketDataService_1.MarketDataService(database_1.prisma);
// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
        });
    }
    next();
};
// GET /api/historical/:symbol - Get historical data for a symbol
router.get('/:symbol', [
    (0, express_validator_1.param)('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
    (0, express_validator_1.query)('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    (0, express_validator_1.query)('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', 'MAX']).withMessage('Invalid period'),
    (0, express_validator_1.query)('source').optional().isString().trim().withMessage('Invalid source'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:read']), async (req, res) => {
    try {
        const { symbol } = req.params;
        const { startDate, endDate, period, source } = req.query;
        let finalStartDate;
        let finalEndDate = endDate ? new Date(endDate) : (0, date_fns_1.endOfDay)(new Date());
        // Calculate start date based on period if not provided
        if (startDate) {
            finalStartDate = new Date(startDate);
        }
        else if (period) {
            const now = new Date();
            switch (period) {
                case '1D':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 1));
                    break;
                case '1W':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 7));
                    break;
                case '1M':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 30));
                    break;
                case '3M':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 90));
                    break;
                case '6M':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 180));
                    break;
                case '1Y':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 365));
                    break;
                case '2Y':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 730));
                    break;
                case '5Y':
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 1825));
                    break;
                default: // MAX
                    finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 7300)); // ~20 years
            }
        }
        else {
            // Default to 1 year
            finalStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), 365));
        }
        const historicalData = await marketDataService.getHistoricalData(symbol.toUpperCase(), finalStartDate, finalEndDate, source);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching historical data:', {
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
});
// GET /api/historical/:symbol/ohlc - Get OHLC data optimized for charts
router.get('/:symbol/ohlc', [
    (0, express_validator_1.param)('symbol').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid symbol'),
    (0, express_validator_1.query)('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y']).withMessage('Invalid period'),
    (0, express_validator_1.query)('interval').optional().isIn(['1d', '1w', '1m']).withMessage('Invalid interval'),
], validateRequest, auth_1.authenticateJWT, (0, auth_1.requirePermission)(['market-data:read']), async (req, res) => {
    try {
        const { symbol } = req.params;
        const { period = '1Y', interval = '1d' } = req.query;
        // Calculate date range
        const now = new Date();
        let startDate;
        switch (period) {
            case '1D':
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 1));
                break;
            case '1W':
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 7));
                break;
            case '1M':
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 30));
                break;
            case '3M':
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 90));
                break;
            case '6M':
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 180));
                break;
            case '1Y':
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 365));
                break;
            case '2Y':
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 730));
                break;
            default: // 5Y
                startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 1825));
        }
        const historicalData = await marketDataService.getHistoricalData(symbol.toUpperCase(), startDate, (0, date_fns_1.endOfDay)(now));
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching OHLC data:', {
            symbol: req.params.symbol,
            period: req.query.period,
            error
        });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch OHLC data',
        });
    }
});
//# sourceMappingURL=historical.js.map
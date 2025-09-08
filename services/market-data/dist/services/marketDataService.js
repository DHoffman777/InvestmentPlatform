"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const redis_1 = require("../config/redis");
const decimal_js_1 = __importDefault(require("decimal.js"));
class MarketDataService {
    prisma;
    kafkaService; // Will be injected
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Get real-time quote for a security
    async getRealtimeQuote(symbol) {
        try {
            // Try cache first
            const cacheKey = `quote:${symbol}`;
            let quote = await (0, redis_1.cacheGetJSON)(cacheKey);
            if (quote) {
                logger_1.logger.debug(`Quote cache hit for ${symbol}`);
                return quote;
            }
            // Get from database
            quote = await this.prisma.quote.findFirst({
                where: {
                    security: { symbol },
                },
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                            exchange: true,
                            currency: true,
                        }
                    }
                },
                orderBy: { quoteTime: 'desc' }
            });
            if (quote) {
                // Cache for 30 seconds
                await (0, redis_1.cacheSetJSON)(cacheKey, quote, 30);
            }
            return quote;
        }
        catch (error) {
            logger_1.logger.error('Error fetching realtime quote:', { symbol, error });
            throw error;
        }
    }
    // Get multiple quotes at once
    async getMultipleQuotes(symbols) {
        try {
            const quotes = await Promise.all(symbols.map(symbol => this.getRealtimeQuote(symbol)));
            return quotes.filter(quote => quote !== null);
        }
        catch (error) {
            logger_1.logger.error('Error fetching multiple quotes:', { symbols, error });
            throw error;
        }
    }
    // Store a new quote
    async storeQuote(quoteData) {
        try {
            // Find the security
            const security = await this.prisma.security.findUnique({
                where: { symbol: quoteData.symbol }
            });
            if (!security) {
                throw new Error(`Security not found: ${quoteData.symbol}`);
            }
            // Calculate change and change percent
            let change;
            let changePercent;
            if (quoteData.last && quoteData.previousClose) {
                change = new decimal_js_1.default(quoteData.last).sub(new decimal_js_1.default(quoteData.previousClose));
                changePercent = change.div(new decimal_js_1.default(quoteData.previousClose)).mul(100);
            }
            // Create the quote
            const quote = await this.prisma.quote.create({
                data: {
                    securityId: security.id,
                    bid: quoteData.bid ? new client_1.Prisma.Decimal(quoteData.bid) : null,
                    ask: quoteData.ask ? new client_1.Prisma.Decimal(quoteData.ask) : null,
                    last: quoteData.last ? new client_1.Prisma.Decimal(quoteData.last) : null,
                    open: quoteData.open ? new client_1.Prisma.Decimal(quoteData.open) : null,
                    high: quoteData.high ? new client_1.Prisma.Decimal(quoteData.high) : null,
                    low: quoteData.low ? new client_1.Prisma.Decimal(quoteData.low) : null,
                    close: quoteData.close ? new client_1.Prisma.Decimal(quoteData.close) : null,
                    previousClose: quoteData.previousClose ? new client_1.Prisma.Decimal(quoteData.previousClose) : null,
                    volume: quoteData.volume ? BigInt(quoteData.volume) : null,
                    change,
                    changePercent,
                    quoteTime: new Date(),
                    source: quoteData.source,
                },
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                        }
                    }
                }
            });
            // Invalidate cache
            const cacheKey = `quote:${quoteData.symbol}`;
            await (0, redis_1.cacheSetJSON)(cacheKey, quote, 30);
            // Publish to Kafka if available
            if (this.kafkaService) {
                await this.kafkaService.publishEvent('market-data.quote.updated', {
                    symbol: quoteData.symbol,
                    quote,
                    timestamp: new Date().toISOString(),
                });
            }
            logger_1.logger.info('Quote stored', {
                symbol: quoteData.symbol,
                last: quoteData.last,
                source: quoteData.source,
            });
            return quote;
        }
        catch (error) {
            logger_1.logger.error('Error storing quote:', { quoteData, error });
            throw error;
        }
    }
    // Get historical data for a security
    async getHistoricalData(symbol, startDate, endDate, source) {
        try {
            const whereClause = {
                security: { symbol },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            if (source) {
                whereClause.source = source;
            }
            const historicalData = await this.prisma.historicalData.findMany({
                where: whereClause,
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                        }
                    }
                },
                orderBy: { date: 'asc' }
            });
            return historicalData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching historical data:', { symbol, startDate, endDate, error });
            throw error;
        }
    }
    // Store historical data
    async storeHistoricalData(historicalData) {
        try {
            // Find the security
            const security = await this.prisma.security.findUnique({
                where: { symbol: historicalData.symbol }
            });
            if (!security) {
                throw new Error(`Security not found: ${historicalData.symbol}`);
            }
            // Upsert historical data
            const data = await this.prisma.historicalData.upsert({
                where: {
                    securityId_date_source: {
                        securityId: security.id,
                        date: historicalData.date,
                        source: historicalData.source,
                    }
                },
                update: {
                    open: new client_1.Prisma.Decimal(historicalData.open),
                    high: new client_1.Prisma.Decimal(historicalData.high),
                    low: new client_1.Prisma.Decimal(historicalData.low),
                    close: new client_1.Prisma.Decimal(historicalData.close),
                    adjustedClose: new client_1.Prisma.Decimal(historicalData.adjustedClose),
                    volume: BigInt(historicalData.volume),
                    dividend: historicalData.dividend ? new client_1.Prisma.Decimal(historicalData.dividend) : null,
                    splitRatio: historicalData.splitRatio ? new client_1.Prisma.Decimal(historicalData.splitRatio) : null,
                },
                create: {
                    securityId: security.id,
                    date: historicalData.date,
                    open: new client_1.Prisma.Decimal(historicalData.open),
                    high: new client_1.Prisma.Decimal(historicalData.high),
                    low: new client_1.Prisma.Decimal(historicalData.low),
                    close: new client_1.Prisma.Decimal(historicalData.close),
                    adjustedClose: new client_1.Prisma.Decimal(historicalData.adjustedClose),
                    volume: BigInt(historicalData.volume),
                    source: historicalData.source,
                    dividend: historicalData.dividend ? new client_1.Prisma.Decimal(historicalData.dividend) : null,
                    splitRatio: historicalData.splitRatio ? new client_1.Prisma.Decimal(historicalData.splitRatio) : null,
                },
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                        }
                    }
                }
            });
            return data;
        }
        catch (error) {
            logger_1.logger.error('Error storing historical data:', { historicalData, error });
            throw error;
        }
    }
    // Create or update a security
    async upsertSecurity(securityData) {
        try {
            const security = await this.prisma.security.upsert({
                where: { symbol: securityData.symbol },
                update: {
                    name: securityData.name,
                    // cusip: securityData.cusip,
                    // isin: securityData.isin,
                    // assetClass: securityData.assetClass,
                    securityType: securityData.securityType,
                    exchange: securityData.exchange,
                    currency: securityData.currency || 'USD',
                    // country: securityData.country,
                    // sector: securityData.sector,
                    // industry: securityData.industry,
                    // marketCap: securityData.marketCap ? new Prisma.Decimal(securityData.marketCap) : null,
                },
                create: {
                    symbol: securityData.symbol,
                    name: securityData.name,
                    // cusip: securityData.cusip,
                    // isin: securityData.isin,
                    // assetClass: securityData.assetClass,
                    securityType: securityData.securityType,
                    exchange: securityData.exchange,
                    currency: securityData.currency || 'USD',
                    // country: securityData.country,
                    // sector: securityData.sector,
                    // industry: securityData.industry,
                    // marketCap: securityData.marketCap ? new Prisma.Decimal(securityData.marketCap) : null,
                }
            });
            logger_1.logger.info('Security upserted', {
                symbol: securityData.symbol,
                name: securityData.name,
            });
            return security;
        }
        catch (error) {
            logger_1.logger.error('Error upserting security:', { securityData, error });
            throw error;
        }
    }
    // Search securities
    async searchSecurities(query, limit = 10) {
        try {
            const securities = await this.prisma.security.findMany({
                where: {
                    OR: [
                        { symbol: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } },
                        // { cusip: { contains: query, mode: 'insensitive' } },
                        // { isin: { contains: query, mode: 'insensitive' } },
                    ],
                    isActive: true,
                },
                take: limit,
                orderBy: [
                    { symbol: 'asc' }
                ]
            });
            return securities;
        }
        catch (error) {
            logger_1.logger.error('Error searching securities:', { query, error });
            throw error;
        }
    }
    // Get corporate actions for a security
    async getCorporateActions(symbol, startDate, endDate) {
        try {
            const whereClause = {
                security: { symbol },
            };
            if (startDate || endDate) {
                whereClause.exDate = {};
                if (startDate)
                    whereClause.exDate.gte = startDate;
                if (endDate)
                    whereClause.exDate.lte = endDate;
            }
            const corporateActions = await this.prisma.corporateAction.findMany({
                where: whereClause,
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                        }
                    }
                },
                orderBy: { exDate: 'desc' }
            });
            return corporateActions;
        }
        catch (error) {
            logger_1.logger.error('Error fetching corporate actions:', { symbol, error });
            throw error;
        }
    }
    // Store corporate action
    async storeCorporateAction(corporateActionData) {
        try {
            // Find the security
            const security = await this.prisma.security.findUnique({
                where: { symbol: corporateActionData.symbol }
            });
            if (!security) {
                throw new Error(`Security not found: ${corporateActionData.symbol}`);
            }
            const corporateAction = await this.prisma.corporateAction.create({
                data: {
                    securityId: security.id,
                    actionType: corporateActionData.actionType,
                    exDate: corporateActionData.exDate || undefined,
                    recordDate: corporateActionData.recordDate || undefined,
                    payDate: corporateActionData.payDate || undefined,
                    announcementDate: corporateActionData.announcementDate,
                    effectiveDate: corporateActionData.effectiveDate,
                    description: corporateActionData.description,
                    value: corporateActionData.value ? new client_1.Prisma.Decimal(corporateActionData.value) : null,
                    ratio: corporateActionData.ratio,
                    currency: corporateActionData.currency || 'USD',
                },
                include: {
                    security: {
                        select: {
                            symbol: true,
                            name: true,
                        }
                    }
                }
            });
            // Publish to Kafka if available
            if (this.kafkaService) {
                await this.kafkaService.publishEvent('market-data.corporate-action.created', {
                    symbol: corporateActionData.symbol,
                    corporateAction,
                    timestamp: new Date().toISOString(),
                });
            }
            logger_1.logger.info('Corporate action stored', {
                symbol: corporateActionData.symbol,
                actionType: corporateActionData.actionType,
                exDate: corporateActionData.exDate,
            });
            return corporateAction;
        }
        catch (error) {
            logger_1.logger.error('Error storing corporate action:', { corporateActionData, error });
            throw error;
        }
    }
    // Check if market is open
    async isMarketOpen(market = 'NYSE') {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            // Check if today is a holiday
            const holiday = await this.prisma.holiday.findFirst({
                where: {
                    date: today,
                    market,
                }
            });
            if (holiday) {
                return false;
            }
            // Check if it's weekend
            const dayOfWeek = now.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
                return false;
            }
            // Check market hours (9:30 AM to 4:00 PM ET)
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 100 + currentMinute;
            return currentTime >= 930 && currentTime <= 1600;
        }
        catch (error) {
            logger_1.logger.error('Error checking market status:', { market, error });
            return false;
        }
    }
}
exports.MarketDataService = MarketDataService;
//# sourceMappingURL=marketDataService.js.map
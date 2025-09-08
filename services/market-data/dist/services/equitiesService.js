"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquitiesService = void 0;
const logger_1 = require("../utils/logger");
const library_1 = require("@prisma/client/runtime/library");
class EquitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Create or update equity security
    async upsertEquity(equityData) {
        try {
            logger_1.logger.info('Upserting equity security', {
                symbol: equityData.symbol,
                equityType: equityData.equityType,
            });
            const securityData = {
                symbol: equityData.symbol.toUpperCase(),
                name: equityData.name,
                cusip: equityData.cusip,
                isin: equityData.isin,
                sedol: equityData.sedol,
                assetClass: 'EQUITY',
                securityType: equityData.equityType,
                exchange: equityData.exchange,
                currency: equityData.currency || 'USD',
                country: equityData.country,
                sector: equityData.sector,
                industry: equityData.industry,
                marketCap: equityData.marketCap,
                isActive: equityData.isActive ?? true,
                listingDate: equityData.listingDate,
            };
            // Create extended metadata for specialized equity types
            let metadata = {
                dividendYield: equityData.dividendYield?.toString(),
                peRatio: equityData.peRatio?.toString(),
                pbRatio: equityData.pbRatio?.toString(),
                beta: equityData.beta?.toString(),
                sharesOutstanding: equityData.sharesOutstanding?.toString(),
                dividendFrequency: equityData.dividendFrequency,
            };
            // Add preferred stock specific metadata
            if (equityData.equityType === 'PREFERRED_STOCK') {
                const preferredData = equityData;
                metadata = {
                    ...metadata,
                    dividendRate: preferredData.dividendRate.toString(),
                    parValue: preferredData.parValue.toString(),
                    callPrice: preferredData.callPrice?.toString(),
                    callDate: preferredData.callDate?.toISOString(),
                    convertible: preferredData.convertible,
                    conversionRatio: preferredData.conversionRatio?.toString(),
                    cumulative: preferredData.cumulative,
                    perpetual: preferredData.perpetual,
                    maturityDate: preferredData.maturityDate?.toISOString(),
                };
            }
            // Add ADR/GDR specific metadata
            if (equityData.equityType === 'ADR' || equityData.equityType === 'GDR') {
                const adrData = equityData;
                metadata = {
                    ...metadata,
                    underlyingSymbol: adrData.underlyingSymbol,
                    underlyingExchange: adrData.underlyingExchange,
                    underlyingCurrency: adrData.underlyingCurrency,
                    adrRatio: adrData.adrRatio,
                    depositoryBank: adrData.depositoryBank,
                    level: adrData.level,
                    sponsored: adrData.sponsored,
                };
            }
            const security = await this.prisma.security.upsert({
                where: { symbol: securityData.symbol },
                update: {
                    ...securityData,
                    updatedAt: new Date(),
                },
                create: securityData,
            });
            // Store extended equity metadata (this would ideally be in a separate table)
            await this.storeEquityMetadata(security.id, metadata);
            logger_1.logger.info('Equity security upserted successfully', {
                securityId: security.id,
                symbol: security.symbol,
                equityType: equityData.equityType,
            });
            return security;
        }
        catch (error) {
            logger_1.logger.error('Error upserting equity security', {
                symbol: equityData.symbol,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Get equity with extended information
    async getEquityDetails(symbol) {
        try {
            const security = await this.prisma.security.findFirst({
                where: {
                    symbol: symbol.toUpperCase(),
                },
            });
            if (!security) {
                return null;
            }
            // Get extended equity metadata
            const metadata = await this.getEquityMetadata(security.id);
            return {
                ...security,
                marketCap: security.marketCap?.toNumber(),
                latestQuote: null,
                recentHistory: [],
                recentActions: [],
                fundamentals: null,
                equityMetadata: metadata,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting equity details', {
                symbol,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Search equities with filtering
    async searchEquities(filters) {
        try {
            const { query, equityType, exchange, sector, country, minMarketCap, maxMarketCap, limit = 50, } = filters;
            const whereClause = {
                assetClass: 'EQUITY',
                isActive: true,
            };
            if (query) {
                whereClause.OR = [
                    { symbol: { contains: query.toUpperCase() } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { cusip: query },
                    { isin: query },
                ];
            }
            if (equityType) {
                whereClause.securityType = equityType;
            }
            if (exchange) {
                whereClause.exchange = exchange;
            }
            if (sector) {
                whereClause.sector = sector;
            }
            if (country) {
                whereClause.country = country;
            }
            if (minMarketCap !== undefined || maxMarketCap !== undefined) {
                whereClause.marketCap = {};
                if (minMarketCap !== undefined) {
                    whereClause.marketCap.gte = new library_1.Decimal(minMarketCap);
                }
                if (maxMarketCap !== undefined) {
                    whereClause.marketCap.lte = new library_1.Decimal(maxMarketCap);
                }
            }
            const securities = await this.prisma.security.findMany({
                where: whereClause,
                take: limit,
                orderBy: [
                    { symbol: 'asc' },
                ],
            });
            logger_1.logger.info('Equity search completed', {
                filters,
                resultCount: securities.length,
            });
            return securities;
        }
        catch (error) {
            logger_1.logger.error('Error searching equities', {
                filters,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Get dividend history for equity
    async getDividendHistory(symbol, limit = 20) {
        try {
            const security = await this.prisma.security.findUnique({
                where: { symbol: symbol.toUpperCase() },
            });
            if (!security) {
                throw new Error('Security not found');
            }
            const dividends = await this.prisma.corporateAction.findMany({
                where: {
                    securityId: security.id,
                    actionType: 'DIVIDEND',
                    status: 'PROCESSED',
                },
                take: limit,
                orderBy: { exDate: 'desc' },
            });
            return dividends.map((dividend) => ({
                ...dividend,
                value: dividend.value?.toNumber(),
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting dividend history', {
                symbol,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Calculate dividend metrics
    async calculateDividendMetrics(symbol) {
        try {
            const security = await this.prisma.security.findUnique({
                where: { symbol: symbol.toUpperCase() },
            });
            if (!security) {
                throw new Error('Security not found');
            }
            // Get last 12 months of dividends
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const recentDividends = await this.prisma.corporateAction.findMany({
                where: {
                    securityId: security.id,
                    actionType: 'DIVIDEND',
                    exDate: { gte: oneYearAgo },
                    status: 'PROCESSED',
                },
                orderBy: { exDate: 'desc' },
            });
            const annualDividend = recentDividends.reduce((sum, div) => sum + (div.value?.toNumber() || 0), 0);
            const currentPrice = 0; // Since we're not including quotes
            const dividendYield = currentPrice && annualDividend > 0
                ? (annualDividend / currentPrice) * 100
                : null;
            const eps = 0; // Since we're not including fundamentals
            const payoutRatio = eps && annualDividend > 0
                ? (annualDividend / eps) * 100
                : null;
            // Calculate dividend growth rate (simplified - comparing to previous year)
            const twoYearsAgo = new Date(oneYearAgo);
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 1);
            const previousYearDividends = await this.prisma.corporateAction.findMany({
                where: {
                    securityId: security.id,
                    actionType: 'DIVIDEND',
                    exDate: { gte: twoYearsAgo, lt: oneYearAgo },
                    status: 'PROCESSED',
                },
            });
            const previousAnnualDividend = previousYearDividends.reduce((sum, div) => sum + (div.value?.toNumber() || 0), 0);
            const dividendGrowthRate = previousAnnualDividend > 0 && annualDividend > 0
                ? ((annualDividend - previousAnnualDividend) / previousAnnualDividend) * 100
                : null;
            return {
                dividendYield,
                annualDividend: annualDividend > 0 ? annualDividend : null,
                payoutRatio,
                dividendGrowthRate,
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating dividend metrics', {
                symbol,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Helper method to store extended equity metadata
    async storeEquityMetadata(securityId, metadata) {
        // This is a placeholder - in a production system, you'd want a separate table
        // @ts-ignore - fundamental model may not exist yet
        // for now, we'll store this in the fundamental data as additional data
        try {
            // Temporarily disabled until fundamental model is available
            // await this.prisma.fundamental.upsert({...
        }
        catch (error) {
            logger_1.logger.warn('Could not store equity metadata', { securityId, error });
        }
    }
    // Helper method to retrieve extended equity metadata
    async getEquityMetadata(securityId) {
        try {
            // Temporarily disabled until fundamental model is available
            // const metadata = await this.prisma.fundamental.findFirst({...
            return {};
        }
        catch (error) {
            logger_1.logger.warn('Could not retrieve equity metadata', { securityId, error });
            return {};
        }
    }
}
exports.EquitiesService = EquitiesService;
//# sourceMappingURL=equitiesService.js.map
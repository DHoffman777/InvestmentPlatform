"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundsService = void 0;
const logger_1 = require("../utils/logger");
const decimal_js_1 = require("decimal.js");
class FundsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Create or update ETF
    async upsertETF(etfData) {
        try {
            logger_1.logger.info('Upserting ETF', {
                symbol: etfData.symbol,
                fundType: etfData.fundType,
            });
            const securityData = {
                symbol: etfData.symbol.toUpperCase(),
                name: etfData.name,
                cusip: etfData.cusip,
                isin: etfData.isin,
                assetClass: 'ETF',
                securityType: etfData.assetClass,
                exchange: etfData.exchange,
                currency: etfData.currency || 'USD',
                country: etfData.country,
                sector: etfData.sector,
                industry: etfData.category,
                marketCap: etfData.aum,
                isActive: etfData.isActive ?? true,
                listingDate: etfData.inceptionDate,
            };
            const metadata = {
                fundType: etfData.fundType,
                managementFee: etfData.managementFee.toString(),
                expenseRatio: etfData.expenseRatio.toString(),
                trackingIndex: etfData.trackingIndex,
                aum: etfData.aum.toString(),
                dividendYield: etfData.dividendYield?.toString(),
                distributionFrequency: etfData.distributionFrequency,
                fundFamily: etfData.fundFamily,
                primaryBenchmark: etfData.primaryBenchmark,
                averageDailyVolume: etfData.averageDailyVolume?.toString(),
                navFrequency: etfData.navFrequency,
                investmentStyle: etfData.investmentStyle,
                marketCapFocus: etfData.marketCapFocus,
                geographicFocus: etfData.geographicFocus,
                beta: etfData.beta?.toString(),
                standardDeviation: etfData.standardDeviation?.toString(),
            };
            const security = await this.prisma.security.upsert({
                where: { symbol: securityData.symbol },
                update: {
                    ...securityData,
                    updatedAt: new Date(),
                },
                create: securityData,
            });
            await this.storeFundMetadata(security.id, metadata);
            logger_1.logger.info('ETF upserted successfully', {
                securityId: security.id,
                symbol: security.symbol,
            });
            return security;
        }
        catch (error) {
            logger_1.logger.error('Error upserting ETF', {
                symbol: etfData.symbol,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Create or update mutual fund
    async upsertMutualFund(fundData) {
        try {
            logger_1.logger.info('Upserting mutual fund', {
                symbol: fundData.symbol,
                fundType: fundData.fundType,
                shareClass: fundData.shareClass,
            });
            const securityData = {
                symbol: fundData.symbol.toUpperCase(),
                name: fundData.name,
                cusip: fundData.cusip,
                isin: fundData.isin,
                assetClass: 'MUTUAL_FUND',
                securityType: fundData.assetClass,
                exchange: 'MUTUALFUND', // Mutual funds don't trade on exchanges
                currency: fundData.currency || 'USD',
                country: fundData.country,
                sector: fundData.sector,
                industry: fundData.category,
                marketCap: fundData.aum,
                isActive: fundData.isActive ?? true,
                listingDate: fundData.inceptionDate,
            };
            const metadata = {
                fundType: fundData.fundType,
                managementFee: fundData.managementFee.toString(),
                expenseRatio: fundData.expenseRatio.toString(),
                frontLoadFee: fundData.frontLoadFee?.toString(),
                backLoadFee: fundData.backLoadFee?.toString(),
                redemptionFee: fundData.redemptionFee?.toString(),
                aum: fundData.aum.toString(),
                dividendYield: fundData.dividendYield?.toString(),
                distributionFrequency: fundData.distributionFrequency,
                fundFamily: fundData.fundFamily,
                primaryBenchmark: fundData.primaryBenchmark,
                fundManager: fundData.fundManager,
                shareClass: fundData.shareClass,
                minimumInvestment: fundData.minimumInvestment.toString(),
                minimumSubsequent: fundData.minimumSubsequent?.toString(),
                navFrequency: fundData.navFrequency,
                cutoffTime: fundData.cutoffTime,
                settlementDays: fundData.settlementDays,
                investmentStyle: fundData.investmentStyle,
                marketCapFocus: fundData.marketCapFocus,
                geographicFocus: fundData.geographicFocus,
                beta: fundData.beta?.toString(),
                standardDeviation: fundData.standardDeviation?.toString(),
                morningstarRating: fundData.morningstarRating,
                isClosedToNewInvestors: fundData.isClosedToNewInvestors,
            };
            const security = await this.prisma.security.upsert({
                where: { symbol: securityData.symbol },
                update: {
                    ...securityData,
                    updatedAt: new Date(),
                },
                create: securityData,
            });
            await this.storeFundMetadata(security.id, metadata);
            logger_1.logger.info('Mutual fund upserted successfully', {
                securityId: security.id,
                symbol: security.symbol,
                shareClass: fundData.shareClass,
            });
            return security;
        }
        catch (error) {
            logger_1.logger.error('Error upserting mutual fund', {
                symbol: fundData.symbol,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Search funds with advanced filtering
    async searchFunds(filters) {
        try {
            const { query, fundType, assetClass, minAUM, maxExpenseRatio, limit = 50, } = filters;
            const whereClause = {
                assetClass: { in: ['ETF', 'MUTUAL_FUND'] },
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
            if (fundType === 'ETF') {
                whereClause.assetClass = 'ETF';
            }
            else if (fundType === 'MUTUAL_FUND') {
                whereClause.assetClass = 'MUTUAL_FUND';
            }
            if (assetClass) {
                whereClause.securityType = assetClass;
            }
            if (minAUM !== undefined) {
                whereClause.marketCap = { gte: new decimal_js_1.Decimal(minAUM) };
            }
            const securities = await this.prisma.security.findMany({
                where: whereClause,
                take: limit,
                orderBy: [
                    { marketCap: 'desc' },
                    { symbol: 'asc' },
                ],
                include: {
                    quotes: {
                        take: 1,
                        orderBy: { quoteTime: 'desc' },
                    },
                },
            });
            // Get metadata for each fund
            const fundsWithMetadata = await Promise.all(securities.map(async (security) => {
                const metadata = await this.getFundMetadata(security.id);
                // Apply additional filters based on metadata
                if (maxExpenseRatio && metadata.expenseRatio &&
                    parseFloat(metadata.expenseRatio) > maxExpenseRatio) {
                    return null;
                }
                if (filters.investmentStyle && metadata.investmentStyle !== filters.investmentStyle) {
                    return null;
                }
                if (filters.marketCapFocus && metadata.marketCapFocus !== filters.marketCapFocus) {
                    return null;
                }
                if (filters.geographicFocus && metadata.geographicFocus !== filters.geographicFocus) {
                    return null;
                }
                if (filters.fundFamily && metadata.fundFamily !== filters.fundFamily) {
                    return null;
                }
                if (filters.minMorningstarRating && metadata.morningstarRating &&
                    metadata.morningstarRating < filters.minMorningstarRating) {
                    return null;
                }
                return {
                    ...security,
                    marketCap: security.marketCap?.toNumber(),
                    fundMetadata: metadata,
                    latestQuote: security.quotes[0] ? {
                        ...security.quotes[0],
                        last: security.quotes[0].last?.toNumber(),
                        change: security.quotes[0].change?.toNumber(),
                        changePercent: security.quotes[0].changePercent?.toNumber(),
                    } : null,
                };
            }));
            const filteredFunds = fundsWithMetadata.filter(fund => fund !== null);
            logger_1.logger.info('Fund search completed', {
                filters,
                resultCount: filteredFunds.length,
            });
            return filteredFunds;
        }
        catch (error) {
            logger_1.logger.error('Error searching funds', {
                filters,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Get detailed fund information
    async getFundDetails(symbol) {
        try {
            const security = await this.prisma.security.findUnique({
                where: {
                    symbol: symbol.toUpperCase(),
                    assetClass: { in: ['ETF', 'MUTUAL_FUND'] },
                },
                include: {
                    quotes: {
                        take: 5,
                        orderBy: { quoteTime: 'desc' },
                    },
                    historicalData: {
                        take: 30,
                        orderBy: { date: 'desc' },
                    },
                    corporateActions: {
                        where: {
                            actionType: 'DIVIDEND',
                            status: 'PROCESSED',
                        },
                        take: 12,
                        orderBy: { exDate: 'desc' },
                    },
                },
            });
            if (!security) {
                return null;
            }
            const metadata = await this.getFundMetadata(security.id);
            return {
                ...security,
                marketCap: security.marketCap?.toNumber(),
                recentQuotes: security.quotes.map(q => ({
                    ...q,
                    last: q.last?.toNumber(),
                    change: q.change?.toNumber(),
                    changePercent: q.changePercent?.toNumber(),
                })),
                priceHistory: security.historicalData.map(h => ({
                    ...h,
                    open: h.open.toNumber(),
                    high: h.high.toNumber(),
                    low: h.low.toNumber(),
                    close: h.close.toNumber(),
                    adjustedClose: h.adjustedClose.toNumber(),
                })),
                distributions: security.corporateActions.map(ca => ({
                    ...ca,
                    value: ca.value?.toNumber(),
                })),
                fundMetadata: metadata,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting fund details', {
                symbol,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Get fund families
    async getFundFamilies() {
        try {
            // This would ideally be a proper aggregation query
            // For now, we'll use the metadata stored in fundamentals
            const fundamentals = await this.prisma.fundamental.findMany({
                where: {
                    periodType: 'FUND_METADATA',
                },
                select: {
                    additionalData: true,
                    security: {
                        select: {
                            marketCap: true,
                        },
                    },
                },
            });
            const familyData = new Map();
            fundamentals.forEach(fund => {
                const metadata = fund.additionalData;
                const fundFamily = metadata?.fundFamily;
                const aum = fund.security?.marketCap || new decimal_js_1.Decimal(0);
                if (fundFamily) {
                    const existing = familyData.get(fundFamily) || { count: 0, totalAUM: new decimal_js_1.Decimal(0) };
                    familyData.set(fundFamily, {
                        count: existing.count + 1,
                        totalAUM: existing.totalAUM.add(aum),
                    });
                }
            });
            const result = Array.from(familyData.entries())
                .map(([name, data]) => ({
                name,
                count: data.count,
                totalAUM: data.totalAUM.toNumber(),
            }))
                .sort((a, b) => b.totalAUM - a.totalAUM);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error getting fund families', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    // Helper method to store fund metadata
    async storeFundMetadata(securityId, metadata) {
        try {
            await this.prisma.fundamental.upsert({
                where: {
                    securityId_periodType_periodEnd: {
                        securityId,
                        periodType: 'FUND_METADATA',
                        periodEnd: new Date(),
                    },
                },
                update: {
                    additionalData: metadata,
                    updatedAt: new Date(),
                },
                create: {
                    securityId,
                    periodType: 'FUND_METADATA',
                    periodEnd: new Date(),
                    reportDate: new Date(),
                    additionalData: metadata,
                },
            });
        }
        catch (error) {
            logger_1.logger.warn('Could not store fund metadata', { securityId, error });
        }
    }
    // Helper method to retrieve fund metadata
    async getFundMetadata(securityId) {
        try {
            const metadata = await this.prisma.fundamental.findFirst({
                where: {
                    securityId,
                    periodType: 'FUND_METADATA',
                },
                orderBy: { updatedAt: 'desc' },
            });
            return metadata?.additionalData || {};
        }
        catch (error) {
            logger_1.logger.warn('Could not retrieve fund metadata', { securityId, error });
            return {};
        }
    }
}
exports.FundsService = FundsService;

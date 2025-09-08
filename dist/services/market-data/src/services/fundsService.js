"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundsService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const decimal_js_1 = __importDefault(require("decimal.js"));
class FundsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma || new client_1.PrismaClient();
    }
    // Create or update ETF
    async upsertETF(etfData) {
        try {
            logger_1.logger.info('Upserting ETF', {
                symbol: etfData.symbol,
                assetClass: etfData.assetClass,
                exchange: etfData.exchange,
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
                country: etfData.country || 'US',
                sector: etfData.sector,
                industry: etfData.category,
                isActive: true,
                listingDate: etfData.launchDate,
                marketCap: etfData.totalAssets,
            };
            // Store additional ETF metadata
            const metadata = {
                fundType: 'ETF',
                managementFee: etfData.managementFee?.toString(),
                expenseRatio: etfData.expenseRatio?.toString(),
                trackingIndex: etfData.trackingIndex,
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
                country: fundData.country || 'US',
                isActive: true,
                listingDate: fundData.inceptionDate,
                marketCap: fundData.totalAssets,
            };
            // Store additional fund metadata
            const metadata = {
                fundType: 'MUTUAL_FUND',
                shareClass: fundData.shareClass,
                managementFee: fundData.managementFee?.toString(),
                expenseRatio: fundData.expenseRatio?.toString(),
                frontLoad: fundData.frontLoad?.toString(),
                deferredLoad: fundData.deferredLoad?.toString(),
                purchaseFee: fundData.purchaseFee?.toString(),
                redemptionFee: fundData.redemptionFee?.toString(),
                marketingFee: fundData.marketingFee?.toString(),
                minimumInvestment: fundData.minimumInvestment?.toString(),
                minimumAdditionalInvestment: fundData.minimumAdditionalInvestment?.toString(),
                fundFamily: fundData.fundFamily,
                fundManager: fundData.fundManager,
                investmentStyle: fundData.investmentStyle,
                morningstarRating: fundData.morningstarRating,
                morningstarCategory: fundData.morningstarCategory,
                turnoverRatio: fundData.turnoverRatio?.toString(),
                beta: fundData.beta?.toString(),
                standardDeviation: fundData.standardDeviation?.toString(),
                sharpeRatio: fundData.sharpeRatio?.toString(),
                alphaRatio: fundData.alphaRatio?.toString(),
                r2: fundData.r2?.toString(),
                dividendFrequency: fundData.dividendFrequency,
                capitalGainFrequency: fundData.capitalGainFrequency,
                dividendYield: fundData.dividendYield?.toString(),
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
    // Search for funds with filters
    async searchFunds(filters, limit = 100, offset = 0) {
        try {
            const { fundType, assetClass, minAUM, maxExpenseRatio, fundFamily, investmentStyle, marketCapFocus, geographicFocus, minRating } = filters;
            const whereClause = {
                isActive: true,
            };
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
                whereClause.marketCap = { gte: new decimal_js_1.default(minAUM) };
            }
            const securities = await this.prisma.security.findMany({
                where: whereClause,
                take: limit,
                orderBy: [
                    { symbol: 'asc' },
                ],
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
                if (minRating && metadata.morningstarRating &&
                    metadata.morningstarRating < minRating) {
                    return null;
                }
                return {
                    ...security,
                    marketCap: security.marketCap?.toNumber(),
                    fundMetadata: metadata,
                    latestQuote: security.quotes?.[0] ? {
                        ...security.quotes[0],
                        last: security.quotes[0].last?.toNumber(),
                        change: security.quotes[0].change?.toNumber(),
                        changePercent: security.quotes[0].changePercent?.toNumber(),
                    } : null,
                };
            }));
            const filteredFunds = fundsWithMetadata.filter(fund => fund !== null);
            logger_1.logger.info('Fund search completed', {
                totalResults: filteredFunds.length,
                filters,
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
    // Get fund details with performance metrics
    async getFundDetails(symbol) {
        try {
            const security = await this.prisma.security.findUnique({
                where: {
                    symbol: symbol.toUpperCase(),
                },
            });
            if (!security) {
                throw new Error('Fund not found');
            }
            const metadata = await this.getFundMetadata(security.id);
            return {
                ...security,
                marketCap: security.marketCap?.toNumber(),
                recentQuotes: (security.quotes || []).map((q) => ({
                    ...q,
                    last: q.last?.toNumber(),
                    change: q.change?.toNumber(),
                    changePercent: q.changePercent?.toNumber(),
                })),
                priceHistory: (security.historicalData || []).map((h) => ({
                    ...h,
                    open: h.open.toNumber(),
                    high: h.high.toNumber(),
                    low: h.low.toNumber(),
                    close: h.close.toNumber(),
                    adjustedClose: h.adjustedClose.toNumber(),
                })),
                distributions: (security.corporateActions || []).map((ca) => ({
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
            const fundamentals = await this.prisma.fundamental?.findMany({
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
            fundamentals.forEach((fund) => {
                const metadata = fund.additionalData;
                const fundFamily = metadata?.fundFamily;
                const aum = fund.security?.marketCap || new decimal_js_1.default(0);
                if (fundFamily) {
                    const existing = familyData.get(fundFamily) || { count: 0, totalAUM: new decimal_js_1.default(0) };
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
    // Store fund metadata in fundamentals table
    async storeFundMetadata(securityId, metadata) {
        await this.prisma.fundamental?.upsert({
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
    // Get fund metadata
    async getFundMetadata(securityId) {
        const result = await this.prisma.fundamental?.findFirst({
            where: {
                securityId,
                periodType: 'FUND_METADATA',
            },
            orderBy: {
                periodEnd: 'desc',
            },
        });
        return result?.additionalData || {};
    }
    // Calculate fund performance metrics
    async calculateFundPerformance(symbol, benchmarkSymbol) {
        // This is a placeholder implementation
        // Actual implementation would calculate real metrics
        return {
            returns: {
                oneDay: 0.5,
                oneWeek: 1.2,
                oneMonth: 2.3,
                threeMonths: 5.6,
                sixMonths: 8.9,
                ytd: 12.4,
                oneYear: 15.3,
                threeYears: 28.7,
                fiveYears: 45.2,
                tenYears: 89.3,
                sinceInception: 125.6,
            },
            riskMetrics: {
                standardDeviation: 12.5,
                beta: 1.05,
                sharpeRatio: 1.23,
                sortinoRatio: 1.45,
                informationRatio: 0.89,
                treynorRatio: 0.15,
                maxDrawdown: -18.5,
                upCapture: 102.3,
                downCapture: 89.5,
            },
            benchmarkComparison: {
                benchmarkSymbol: benchmarkSymbol || 'SPY',
                benchmarkName: 'SPDR S&P 500 ETF',
                excessReturn: 2.3,
                trackingError: 3.5,
                informationRatio: 0.66,
            },
        };
    }
}
exports.FundsService = FundsService;

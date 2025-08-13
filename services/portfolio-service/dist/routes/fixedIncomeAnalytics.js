"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const kafka_mock_1 = require("../utils/kafka-mock");
const fixedIncomeAnalyticsService_1 = require("../services/fixedIncomeAnalyticsService");
const logger_1 = require("../utils/logger");
const FixedIncomeAnalytics_1 = require("../models/fixedIncome/FixedIncomeAnalytics");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const analyticsService = new fixedIncomeAnalyticsService_1.FixedIncomeAnalyticsService(prisma, kafkaService);
// Yield Calculation Routes
// Calculate yields for a fixed income security
router.post('/yields/calculate', async (req, res) => {
    try {
        const { instrumentId, price, settlementDate, yieldTypes, taxRate } = req.body;
        // Validation
        if (!instrumentId || !price || !settlementDate || !yieldTypes) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: instrumentId, price, settlementDate, yieldTypes'
            });
        }
        if (!Array.isArray(yieldTypes) || yieldTypes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'yieldTypes must be a non-empty array'
            });
        }
        // Validate yield types
        const invalidYieldTypes = yieldTypes.filter(yt => !Object.values(FixedIncomeAnalytics_1.YieldType).includes(yt));
        if (invalidYieldTypes.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Invalid yield types: ${invalidYieldTypes.join(', ')}`
            });
        }
        if (price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be greater than zero'
            });
        }
        const request = {
            instrumentId,
            price,
            settlementDate: new Date(settlementDate),
            yieldTypes,
            taxRate
        };
        const result = await analyticsService.calculateYields(request, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Yield calculation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating yields:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate yields',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Duration and Convexity Routes
// Calculate duration and convexity metrics
router.post('/duration-convexity/calculate', async (req, res) => {
    try {
        const { instrumentId, price, yield, settlementDate, yieldShock, durationType } = req.body;
        // Validation
        if (!instrumentId || !price || yield === undefined || !settlementDate || !durationType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: instrumentId, price, yield, settlementDate, durationType'
            });
        }
        if (!Array.isArray(durationType) || durationType.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'durationType must be a non-empty array'
            });
        }
        // Validate duration types
        const invalidDurationTypes = durationType.filter(dt => !Object.values(FixedIncomeAnalytics_1.DurationType).includes(dt));
        if (invalidDurationTypes.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Invalid duration types: ${invalidDurationTypes.join(', ')}`
            });
        }
        if (price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be greater than zero'
            });
        }
        if (yieldShock && yieldShock <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Yield shock must be greater than zero if provided'
            });
        }
        const request = {
            instrumentId,
            price,
            yield,
            settlementDate: new Date(settlementDate),
            yieldShock,
            durationType
        };
        const result = await analyticsService.calculateDurationConvexity(request, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Duration and convexity calculation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating duration and convexity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate duration and convexity',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Credit Analysis Routes
// Perform credit analysis for a fixed income security
router.post('/credit/analyze', async (req, res) => {
    try {
        const { instrumentId, horizonDays, confidenceLevel, recoveryRate, includeRatingMigration } = req.body;
        // Validation
        if (!instrumentId || !horizonDays || !confidenceLevel) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: instrumentId, horizonDays, confidenceLevel'
            });
        }
        if (horizonDays <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Horizon days must be greater than zero'
            });
        }
        if (confidenceLevel <= 0 || confidenceLevel >= 1) {
            return res.status(400).json({
                success: false,
                error: 'Confidence level must be between 0 and 1'
            });
        }
        if (recoveryRate !== undefined && (recoveryRate < 0 || recoveryRate > 1)) {
            return res.status(400).json({
                success: false,
                error: 'Recovery rate must be between 0 and 1'
            });
        }
        const request = {
            instrumentId,
            horizonDays,
            confidenceLevel,
            recoveryRate,
            includeRatingMigration
        };
        const result = await analyticsService.performCreditAnalysis(request, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Credit analysis completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error performing credit analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform credit analysis',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Portfolio Analytics Routes
// Calculate fixed income portfolio analytics
router.get('/portfolio/:portfolioId/analytics', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        if (!portfolioId) {
            return res.status(400).json({
                success: false,
                error: 'Portfolio ID is required'
            });
        }
        // Verify portfolio exists and user has access
        const portfolio = await prisma.portfolio.findFirst({
            where: {
                id: portfolioId,
                tenantId: req.user.tenantId
            }
        });
        if (!portfolio) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found'
            });
        }
        const analytics = await analyticsService.calculatePortfolioAnalytics(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: analytics,
            message: 'Portfolio analytics calculated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating portfolio analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate portfolio analytics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get portfolio sector allocation
router.get('/portfolio/:portfolioId/sector-allocation', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const analytics = await analyticsService.calculatePortfolioAnalytics(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                analysisDate: analytics.analysisDate,
                sectorAllocation: analytics.sectorAllocation
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching sector allocation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sector allocation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get portfolio rating allocation
router.get('/portfolio/:portfolioId/rating-allocation', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const analytics = await analyticsService.calculatePortfolioAnalytics(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                analysisDate: analytics.analysisDate,
                ratingAllocation: analytics.ratingAllocation
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching rating allocation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rating allocation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get portfolio maturity distribution
router.get('/portfolio/:portfolioId/maturity-distribution', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const analytics = await analyticsService.calculatePortfolioAnalytics(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                analysisDate: analytics.analysisDate,
                maturityDistribution: analytics.maturityDistribution
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching maturity distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch maturity distribution',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get portfolio cash flow projections
router.get('/portfolio/:portfolioId/cash-flows', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const { horizonDays } = req.query;
        const analytics = await analyticsService.calculatePortfolioAnalytics(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                analysisDate: analytics.analysisDate,
                expectedCashFlows: analytics.expectedCashFlows,
                summary: {
                    totalPrincipal: analytics.expectedCashFlows.reduce((sum, cf) => sum + cf.principalPayment, 0),
                    totalInterest: analytics.expectedCashFlows.reduce((sum, cf) => sum + cf.interestPayment, 0),
                    totalCashFlow: analytics.expectedCashFlows.reduce((sum, cf) => sum + cf.totalPayment, 0),
                    averageMaturity: analytics.portfolioDuration
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching cash flows:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cash flows',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Stress Testing Routes
// Get portfolio stress test results
router.get('/portfolio/:portfolioId/stress-test', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const analytics = await analyticsService.calculatePortfolioAnalytics(portfolioId, req.user.tenantId, req.user.userId);
        res.status(200).json({
            success: true,
            data: {
                portfolioId,
                analysisDate: analytics.analysisDate,
                stressTestResults: analytics.stressTestResults,
                portfolioMetrics: {
                    duration: analytics.portfolioDuration,
                    convexity: analytics.portfolioConvexity,
                    yield: analytics.portfolioYield
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching stress test results:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stress test results',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Fixed Income Security Search and Management Routes
// Search fixed income securities
router.get('/securities/search', async (req, res) => {
    try {
        const { bondTypes, creditRatings, maturityDateFrom, maturityDateTo, yieldMin, yieldMax, durationMin, durationMax, sectors, issuers, currencies, isCallable, isPutable, limit, offset } = req.query;
        const searchRequest = {
            tenantId: req.user.tenantId,
            bondTypes: bondTypes ? bondTypes.split(',') : undefined,
            creditRatings: creditRatings ? creditRatings.split(',') : undefined,
            maturityRange: maturityDateFrom || maturityDateTo ? {
                min: maturityDateFrom ? new Date(maturityDateFrom) : new Date('1900-01-01'),
                max: maturityDateTo ? new Date(maturityDateTo) : new Date('2100-12-31')
            } : undefined,
            yieldRange: yieldMin || yieldMax ? {
                min: yieldMin ? parseFloat(yieldMin) : 0,
                max: yieldMax ? parseFloat(yieldMax) : 1
            } : undefined,
            durationRange: durationMin || durationMax ? {
                min: durationMin ? parseFloat(durationMin) : 0,
                max: durationMax ? parseFloat(durationMax) : 100
            } : undefined,
            sectors: sectors ? sectors.split(',') : undefined,
            issuers: issuers ? issuers.split(',') : undefined,
            currencies: currencies ? currencies.split(',') : undefined,
            isCallable: isCallable ? isCallable === 'true' : undefined,
            isPutable: isPutable ? isPutable === 'true' : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        };
        // Implementation would call service method
        const mockResult = {
            securities: [],
            total: 0,
            aggregateAnalytics: {
                averageYield: 0,
                averageDuration: 0,
                averageConvexity: 0,
                totalMarketValue: 0
            },
            pagination: {
                limit: searchRequest.limit || 50,
                offset: searchRequest.offset || 0,
                hasMore: false
            }
        };
        res.status(200).json({
            success: true,
            data: mockResult,
            searchCriteria: searchRequest
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching fixed income securities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search fixed income securities',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get fixed income security details
router.get('/securities/:instrumentId', async (req, res) => {
    try {
        const { instrumentId } = req.params;
        const security = await prisma.fixedIncomeSecurity.findFirst({
            where: {
                instrumentId,
                tenantId: req.user.tenantId
            },
            include: {
                callSchedule: true,
                putSchedule: true,
                yieldAnalytics: true,
                durationAnalytics: true,
                convexityAnalytics: true,
                creditAnalytics: true
            }
        });
        if (!security) {
            return res.status(404).json({
                success: false,
                error: 'Fixed income security not found'
            });
        }
        res.status(200).json({
            success: true,
            data: security
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching fixed income security:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch fixed income security',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Analytics Dashboard Routes
// Get fixed income analytics dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { portfolioIds } = req.query;
        // Get overview metrics
        const totalSecurities = await prisma.fixedIncomeSecurity.count({
            where: { tenantId: req.user.tenantId }
        });
        const totalPortfolios = await prisma.portfolio.count({
            where: {
                tenantId: req.user.tenantId,
                positions: {
                    some: {
                        instrument: {
                            assetClass: 'FIXED_INCOME'
                        }
                    }
                }
            }
        });
        // Get recent analytics calculations
        const recentAnalytics = await prisma.fixedIncomePortfolioAnalytics.findMany({
            where: {
                tenantId: req.user.tenantId,
                analysisDate: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            },
            orderBy: { analysisDate: 'desc' },
            take: 20
        });
        // Calculate aggregate metrics
        const avgPortfolioYield = recentAnalytics.length > 0 ?
            recentAnalytics.reduce((sum, a) => sum + a.portfolioYield, 0) / recentAnalytics.length : 0;
        const avgPortfolioDuration = recentAnalytics.length > 0 ?
            recentAnalytics.reduce((sum, a) => sum + a.portfolioDuration, 0) / recentAnalytics.length : 0;
        const avgCreditVaR = recentAnalytics.length > 0 ?
            recentAnalytics.reduce((sum, a) => sum + a.creditVaR, 0) / recentAnalytics.length : 0;
        // Get top performers by yield
        const topPerformers = recentAnalytics
            .sort((a, b) => b.portfolioYield - a.portfolioYield)
            .slice(0, 5);
        // Risk distribution
        const riskDistribution = {
            lowRisk: recentAnalytics.filter(a => a.totalVaR < 0.02).length,
            mediumRisk: recentAnalytics.filter(a => a.totalVaR >= 0.02 && a.totalVaR < 0.05).length,
            highRisk: recentAnalytics.filter(a => a.totalVaR >= 0.05).length
        };
        const dashboard = {
            summary: {
                totalSecurities,
                totalPortfolios,
                totalAnalytics: recentAnalytics.length,
                averagePortfolioYield: avgPortfolioYield,
                averagePortfolioDuration: avgPortfolioDuration,
                averageCreditVaR: avgCreditVaR
            },
            topPerformers,
            riskDistribution,
            recentAnalytics: recentAnalytics.slice(0, 10)
        };
        res.status(200).json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching fixed income dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch fixed income dashboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reference Data Routes
// Get fixed income reference data
router.get('/reference-data', async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                yieldTypes: Object.values(FixedIncomeAnalytics_1.YieldType),
                durationTypes: Object.values(FixedIncomeAnalytics_1.DurationType),
                bondTypes: Object.values(FixedIncomeAnalytics_1.BondType),
                creditRatings: Object.values(FixedIncomeAnalytics_1.CreditRating),
                dayCountConventions: [
                    '30/360',
                    '30/360 ISDA',
                    '30E/360',
                    'ACT/360',
                    'ACT/365',
                    'ACT/ACT',
                    'ACT/ACT ISDA',
                    'BUS/252'
                ],
                paymentFrequencies: [
                    'ANNUAL',
                    'SEMI_ANNUAL',
                    'QUARTERLY',
                    'MONTHLY',
                    'WEEKLY',
                    'DAILY',
                    'ZERO_COUPON',
                    'IRREGULAR'
                ],
                callTypes: [
                    'CALL',
                    'PUT',
                    'SINK',
                    'MAKE_WHOLE'
                ]
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching reference data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reference data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Batch Operations Routes
// Batch yield calculation
router.post('/batch/yields', async (req, res) => {
    try {
        const { calculations } = req.body;
        if (!Array.isArray(calculations) || calculations.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'calculations must be a non-empty array'
            });
        }
        if (calculations.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 100 calculations allowed per batch'
            });
        }
        const results = [];
        const errors = [];
        for (let i = 0; i < calculations.length; i++) {
            try {
                const calc = calculations[i];
                const request = {
                    instrumentId: calc.instrumentId,
                    price: calc.price,
                    settlementDate: new Date(calc.settlementDate),
                    yieldTypes: calc.yieldTypes,
                    taxRate: calc.taxRate
                };
                const result = await analyticsService.calculateYields(request, req.user.tenantId, req.user.userId);
                results.push({ index: i, ...result });
            }
            catch (error) {
                errors.push({
                    index: i,
                    instrumentId: calculations[i].instrumentId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        res.status(200).json({
            success: true,
            data: {
                successful: results.length,
                failed: errors.length,
                results,
                errors
            },
            message: `Batch calculation completed: ${results.length} successful, ${errors.length} failed`
        });
    }
    catch (error) {
        logger_1.logger.error('Error in batch yield calculation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform batch yield calculation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Health check for fixed income analytics
router.get('/health', async (req, res) => {
    try {
        // Basic health check - verify service availability
        const securitiesCount = await prisma.fixedIncomeSecurity.count();
        const analyticsCount = await prisma.fixedIncomePortfolioAnalytics.count();
        res.status(200).json({
            success: true,
            status: 'healthy',
            data: {
                totalSecurities: securitiesCount,
                totalAnalytics: analyticsCount,
                timestamp: new Date().toISOString(),
                service: 'fixed-income-analytics',
                version: '1.0.0'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Fixed income analytics health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Service unavailable',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

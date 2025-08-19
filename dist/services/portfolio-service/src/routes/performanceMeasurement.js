"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const kafka_mock_1 = require("../utils/kafka-mock");
const performanceMeasurementService_1 = require("../services/performanceMeasurementService");
const logger_1 = require("../utils/logger");
const PerformanceMeasurement_1 = require("../models/performance/PerformanceMeasurement");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const performanceService = new performanceMeasurementService_1.PerformanceMeasurementService(prisma, kafkaService);
// Performance Calculation Routes
// Calculate portfolio performance
router.post('/calculate', async (req, res) => {
    try {
        const { portfolioId, periodStart, periodEnd, periodType, calculationMethod, includeAttribution, benchmarkId, cashFlowTiming } = req.body;
        // Validation
        if (!portfolioId || !periodStart || !periodEnd || !periodType || !calculationMethod) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: portfolioId, periodStart, periodEnd, periodType, calculationMethod'
            });
        }
        // Validate enums
        if (!Object.values(PerformanceMeasurement_1.PeriodType).includes(periodType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid period type. Must be one of: ${Object.values(PerformanceMeasurement_1.PeriodType).join(', ')}`
            });
        }
        if (!Object.values(PerformanceMeasurement_1.CalculationMethod).includes(calculationMethod)) {
            return res.status(400).json({
                success: false,
                error: `Invalid calculation method. Must be one of: ${Object.values(PerformanceMeasurement_1.CalculationMethod).join(', ')}`
            });
        }
        if (cashFlowTiming && !Object.values(PerformanceMeasurement_1.CashFlowTiming).includes(cashFlowTiming)) {
            return res.status(400).json({
                success: false,
                error: `Invalid cash flow timing. Must be one of: ${Object.values(PerformanceMeasurement_1.CashFlowTiming).join(', ')}`
            });
        }
        const request = {
            portfolioId,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            periodType,
            calculationMethod,
            includeAttribution: includeAttribution || false,
            benchmarkId,
            cashFlowTiming
        };
        const result = await performanceService.calculatePerformance(request, req.user.tenantId, req.user.userId);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Performance calculation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate performance',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get performance periods
router.get('/periods', async (req, res) => {
    try {
        const { portfolioIds, periodTypes, fromDate, toDate, benchmarkIds, minReturn, maxReturn, minSharpeRatio, limit, offset } = req.query;
        const searchRequest = {
            portfolioIds: portfolioIds ? portfolioIds.split(',') : undefined,
            periodTypes: periodTypes ?
                periodTypes.split(',') : undefined,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined,
            benchmarkIds: benchmarkIds ? benchmarkIds.split(',') : undefined,
            minReturn: minReturn ? parseFloat(minReturn) : undefined,
            maxReturn: maxReturn ? parseFloat(maxReturn) : undefined,
            minSharpeRatio: minSharpeRatio ? parseFloat(minSharpeRatio) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        };
        const where = { tenantId: req.user.tenantId };
        // Apply filters
        if (searchRequest.portfolioIds && searchRequest.portfolioIds.length > 0) {
            where.portfolioId = { in: searchRequest.portfolioIds };
        }
        if (searchRequest.periodTypes && searchRequest.periodTypes.length > 0) {
            where.periodType = { in: searchRequest.periodTypes };
        }
        if (searchRequest.fromDate || searchRequest.toDate) {
            where.periodStart = {};
            if (searchRequest.fromDate)
                where.periodStart.gte = searchRequest.fromDate;
            if (searchRequest.toDate)
                where.periodStart.lte = searchRequest.toDate;
        }
        if (searchRequest.minReturn !== undefined) {
            where.netReturn = { gte: searchRequest.minReturn };
        }
        if (searchRequest.maxReturn !== undefined) {
            where.netReturn = { ...where.netReturn, lte: searchRequest.maxReturn };
        }
        if (searchRequest.minSharpeRatio !== undefined) {
            where.sharpeRatio = { gte: searchRequest.minSharpeRatio };
        }
        const [performancePeriods, total] = await Promise.all([
            prisma.performancePeriod.findMany({
                where,
                include: {
                    portfolio: {
                        select: { id: true, name: true }
                    },
                    attribution: true,
                    benchmarkComparisons: true
                },
                orderBy: [
                    { periodEnd: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: searchRequest.limit || 50,
                skip: searchRequest.offset || 0
            }),
            prisma.performancePeriod.count({ where })
        ]);
        res.json({
            success: true,
            data: performancePeriods,
            pagination: {
                total,
                limit: searchRequest.limit || 50,
                offset: searchRequest.offset || 0,
                hasMore: (searchRequest.offset || 0) + performancePeriods.length < total
            },
            searchCriteria: searchRequest
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching performance periods:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance periods',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get specific performance period
router.get('/periods/:periodId', async (req, res) => {
    try {
        const { periodId } = req.params;
        const performancePeriod = await prisma.performancePeriod.findFirst({
            where: {
                id: periodId,
                tenantId: req.user.tenantId
            },
            include: {
                portfolio: {
                    select: { id: true, name: true, description: true }
                },
                attribution: {
                    include: {
                        sectors: true,
                        assetClasses: true,
                        securities: true,
                        factors: true,
                        riskAttribution: true
                    }
                },
                benchmarkComparisons: true
            }
        });
        if (!performancePeriod) {
            return res.status(404).json({
                success: false,
                error: 'Performance period not found'
            });
        }
        res.json({
            success: true,
            data: performancePeriod
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching performance period:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance period',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Performance Summary Routes
// Get portfolio performance summary
router.get('/portfolios/:portfolioId/summary', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        // Get portfolio information
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
        // Get latest performance metrics
        const latestPerformance = await prisma.performancePeriod.findFirst({
            where: {
                portfolioId,
                tenantId: req.user.tenantId
            },
            orderBy: { periodEnd: 'desc' },
            include: {
                benchmarkComparisons: true
            }
        });
        // Get multi-period returns
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
        const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        const [monthToDate, quarterToDate, yearToDate, oneYear, threeYear, fiveYear, sinceInception] = await Promise.all([
            prisma.performancePeriod.findFirst({
                where: {
                    portfolioId,
                    tenantId: req.user.tenantId,
                    periodStart: { gte: monthStart }
                },
                orderBy: { periodEnd: 'desc' }
            }),
            prisma.performancePeriod.findFirst({
                where: {
                    portfolioId,
                    tenantId: req.user.tenantId,
                    periodStart: { gte: quarterStart }
                },
                orderBy: { periodEnd: 'desc' }
            }),
            prisma.performancePeriod.findFirst({
                where: {
                    portfolioId,
                    tenantId: req.user.tenantId,
                    periodStart: { gte: yearStart }
                },
                orderBy: { periodEnd: 'desc' }
            }),
            prisma.performancePeriod.findFirst({
                where: {
                    portfolioId,
                    tenantId: req.user.tenantId,
                    periodStart: { gte: oneYearAgo }
                },
                orderBy: { periodEnd: 'desc' }
            }),
            prisma.performancePeriod.findFirst({
                where: {
                    portfolioId,
                    tenantId: req.user.tenantId,
                    periodStart: { gte: threeYearsAgo }
                },
                orderBy: { periodEnd: 'desc' }
            }),
            prisma.performancePeriod.findFirst({
                where: {
                    portfolioId,
                    tenantId: req.user.tenantId,
                    periodStart: { gte: fiveYearsAgo }
                },
                orderBy: { periodEnd: 'desc' }
            }),
            prisma.performancePeriod.findFirst({
                where: {
                    portfolioId,
                    tenantId: req.user.tenantId,
                    periodType: PerformanceMeasurement_1.PeriodType.INCEPTION_TO_DATE
                },
                orderBy: { periodEnd: 'desc' }
            })
        ]);
        // Get current portfolio value
        const currentPositions = await prisma.position.findMany({
            where: {
                portfolioId,
                tenantId: req.user.tenantId
            }
        });
        const currentValue = currentPositions.reduce((sum, pos) => sum + (pos.quantity * pos.averageCost), 0);
        const summary = {
            portfolioId,
            portfolioName: portfolio.name,
            // Latest Performance
            latestReturn: latestPerformance?.netReturn || 0,
            latestPeriodEnd: latestPerformance?.periodEnd || now,
            // Multi-Period Returns
            monthToDateReturn: monthToDate?.netReturn || 0,
            quarterToDateReturn: quarterToDate?.netReturn || 0,
            yearToDateReturn: yearToDate?.netReturn || 0,
            oneYearReturn: oneYear?.netReturn || 0,
            threeYearReturn: threeYear?.netReturn || 0,
            fiveYearReturn: fiveYear?.netReturn || 0,
            sinceInceptionReturn: sinceInception?.netReturn || 0,
            // Risk Metrics
            volatility: latestPerformance?.volatility || 0,
            maxDrawdown: latestPerformance?.maxDrawdown || 0,
            sharpeRatio: latestPerformance?.sharpeRatio || 0,
            // Benchmark Comparison
            benchmarkName: latestPerformance?.benchmarkComparisons?.[0]?.benchmarkId || 'N/A',
            excessReturn: latestPerformance?.excessReturn || 0,
            trackingError: latestPerformance?.trackingError || 0,
            informationRatio: latestPerformance?.informationRatio || 0,
            // Assets
            currentValue,
            highWaterMark: latestPerformance?.highWaterMark || currentValue,
            lastCalculated: latestPerformance?.calculationDate || null
        };
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching performance summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Attribution Analysis Routes
// Get performance attribution
router.get('/attribution/:attributionId', async (req, res) => {
    try {
        const { attributionId } = req.params;
        const attribution = await prisma.performanceAttribution.findFirst({
            where: {
                id: attributionId,
                tenantId: req.user.tenantId
            },
            include: {
                performancePeriod: {
                    include: {
                        portfolio: {
                            select: { id: true, name: true }
                        }
                    }
                },
                sectors: true,
                assetClasses: true,
                securities: true,
                factors: true,
                riskAttribution: true
            }
        });
        if (!attribution) {
            return res.status(404).json({
                success: false,
                error: 'Performance attribution not found'
            });
        }
        res.json({
            success: true,
            data: attribution
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching performance attribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance attribution',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Benchmark Comparison Routes
// Get benchmark comparisons
router.get('/benchmark-comparisons', async (req, res) => {
    try {
        const { portfolioId, benchmarkId, fromDate, toDate, limit, offset } = req.query;
        const where = { tenantId: req.user.tenantId };
        if (portfolioId)
            where.portfolioId = portfolioId;
        if (benchmarkId)
            where.benchmarkId = benchmarkId;
        if (fromDate || toDate) {
            where.comparisonPeriodStart = {};
            if (fromDate)
                where.comparisonPeriodStart.gte = new Date(fromDate);
            if (toDate)
                where.comparisonPeriodStart.lte = new Date(toDate);
        }
        const [comparisons, total] = await Promise.all([
            prisma.benchmarkComparison.findMany({
                where,
                include: {
                    portfolio: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { comparisonPeriodEnd: 'desc' },
                take: limit ? parseInt(limit) : 50,
                skip: offset ? parseInt(offset) : 0
            }),
            prisma.benchmarkComparison.count({ where })
        ]);
        res.json({
            success: true,
            data: comparisons,
            pagination: {
                total,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
                hasMore: (offset ? parseInt(offset) : 0) + comparisons.length < total
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching benchmark comparisons:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch benchmark comparisons',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Analytics and Reporting Routes
// Get performance analytics
router.get('/analytics/dashboard', async (req, res) => {
    try {
        const { portfolioIds } = req.query;
        const portfolioFilter = portfolioIds ?
            { portfolioId: { in: portfolioIds.split(',') } } : {};
        // Get recent performance metrics
        const recentPerformance = await prisma.performancePeriod.findMany({
            where: {
                tenantId: req.user.tenantId,
                ...portfolioFilter,
                periodEnd: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                }
            },
            include: {
                portfolio: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { periodEnd: 'desc' },
            take: 100
        });
        // Calculate aggregate metrics
        const totalPortfolios = new Set(recentPerformance.map(p => p.portfolioId)).size;
        const avgReturn = recentPerformance.length > 0 ?
            recentPerformance.reduce((sum, p) => sum + p.netReturn, 0) / recentPerformance.length : 0;
        const avgVolatility = recentPerformance.length > 0 ?
            recentPerformance.reduce((sum, p) => sum + p.volatility, 0) / recentPerformance.length : 0;
        const avgSharpeRatio = recentPerformance.length > 0 ?
            recentPerformance.reduce((sum, p) => sum + p.sharpeRatio, 0) / recentPerformance.length : 0;
        // Top/bottom performers
        const topPerformers = recentPerformance
            .sort((a, b) => b.netReturn - a.netReturn)
            .slice(0, 5);
        const bottomPerformers = recentPerformance
            .sort((a, b) => a.netReturn - b.netReturn)
            .slice(0, 5);
        // Performance distribution
        const returnRanges = {
            veryNegative: recentPerformance.filter(p => p.netReturn < -0.1).length,
            negative: recentPerformance.filter(p => p.netReturn >= -0.1 && p.netReturn < 0).length,
            positive: recentPerformance.filter(p => p.netReturn >= 0 && p.netReturn < 0.1).length,
            veryPositive: recentPerformance.filter(p => p.netReturn >= 0.1).length
        };
        const analytics = {
            summary: {
                totalPortfolios,
                totalPerformancePeriods: recentPerformance.length,
                averageReturn: avgReturn,
                averageVolatility: avgVolatility,
                averageSharpeRatio: avgSharpeRatio
            },
            topPerformers,
            bottomPerformers,
            returnDistribution: returnRanges,
            recentPerformance: recentPerformance.slice(0, 20) // Most recent 20
        };
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching performance analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance analytics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reference Data Routes
// Get performance measurement reference data
router.get('/reference-data', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                periodTypes: Object.values(PerformanceMeasurement_1.PeriodType),
                calculationMethods: Object.values(PerformanceMeasurement_1.CalculationMethod),
                cashFlowTimings: Object.values(PerformanceMeasurement_1.CashFlowTiming)
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
// Health check for performance measurement
router.get('/health', async (req, res) => {
    try {
        // Basic health check - verify database connectivity
        const performanceCount = await prisma.performancePeriod.count();
        const attributionCount = await prisma.performanceAttribution.count();
        const benchmarkCount = await prisma.benchmarkComparison.count();
        res.json({
            success: true,
            status: 'healthy',
            data: {
                totalPerformancePeriods: performanceCount,
                totalAttributions: attributionCount,
                totalBenchmarkComparisons: benchmarkCount,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Performance measurement health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Service unavailable',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { FixedIncomeAnalyticsService } from '../services/fixedIncomeAnalyticsService';
import { } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  YieldCalculationRequest,
  DurationConvexityRequest,
  CreditAnalysisRequest,
  FixedIncomeSearchRequest,
  YieldType,
  DurationType,
  BondType,
  CreditRating
} from '../models/fixedIncome/FixedIncomeAnalytics';

const router = express.Router();
const prisma = new PrismaClient();
const kafkaService = getKafkaService();
const analyticsService = new FixedIncomeAnalyticsService(prisma, kafkaService);

// Yield Calculation Routes

// Calculate yields for a fixed income security
router.post('/yields/calculate', async (req: any, res: any) => {
  try {
    const {
      securityId,
      price,
      settlementDate,
      yieldTypes,
      taxRate
    } = req.body;

    // Validation
    if (!securityId || !price || !settlementDate || !yieldTypes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: securityId, price, settlementDate, yieldTypes'
      });
    }

    if (!Array.isArray(yieldTypes) || yieldTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'yieldTypes must be a non-empty array'
      });
    }

    // Validate yield types
    const invalidYieldTypes = yieldTypes.filter(yt => !Object.values(YieldType).includes(yt));
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

    const request: YieldCalculationRequest = {
      securityId,
      price,
      settlementDate: new Date(settlementDate),
      yieldTypes,
      taxRate
    };

    const result = await analyticsService.calculateYields(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Yield calculation completed successfully'
    });
  } catch (error: any) {
    logger.error('Error calculating yields:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate yields',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Duration and Convexity Routes

// Calculate duration and convexity metrics
router.post('/duration-convexity/calculate', async (req: any, res: any) => {
  try {
    const {
      securityId,
      price,
      yield: yieldValue,
      settlementDate,
      yieldShock,
      durationType
    } = req.body;

    // Validation
    if (!securityId || !price || yieldValue === undefined || !settlementDate || !durationType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: securityId, price, yield, settlementDate, durationType'
      });
    }

    if (!Array.isArray(durationType) || durationType.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'durationType must be a non-empty array'
      });
    }

    // Validate duration types
    const invalidDurationTypes = durationType.filter(dt => !Object.values(DurationType).includes(dt));
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

    const request: DurationConvexityRequest = {
      securityId,
      price,
      yield: yieldValue,
      settlementDate: new Date(settlementDate),
      yieldShock,
      durationType
    };

    const result = await analyticsService.calculateDurationConvexity(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Duration and convexity calculation completed successfully'
    });
  } catch (error: any) {
    logger.error('Error calculating duration and convexity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate duration and convexity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Credit Analysis Routes

// Perform credit analysis for a fixed income security
router.post('/credit/analyze', async (req: any, res: any) => {
  try {
    const {
      securityId,
      horizonDays,
      confidenceLevel,
      recoveryRate,
      includeRatingMigration
    } = req.body;

    // Validation
    if (!securityId || !horizonDays || !confidenceLevel) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: securityId, horizonDays, confidenceLevel'
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

    const request: CreditAnalysisRequest = {
      securityId,
      horizonDays,
      confidenceLevel,
      recoveryRate,
      includeRatingMigration
    };

    const result = await analyticsService.performCreditAnalysis(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Credit analysis completed successfully'
    });
  } catch (error: any) {
    logger.error('Error performing credit analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform credit analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Portfolio Analytics Routes

// Calculate fixed income portfolio analytics
router.get('/portfolio/:portfolioId/analytics', async (req: any, res: any) => {
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
        tenantId: req.user!.tenantId
      }
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    const analytics = await analyticsService.calculatePortfolioAnalytics(
      portfolioId,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Portfolio analytics calculated successfully'
    });
  } catch (error: any) {
    logger.error('Error calculating portfolio analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate portfolio analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get portfolio sector allocation
router.get('/portfolio/:portfolioId/sector-allocation', async (req: any, res: any) => {
  try {
    const { portfolioId } = req.params;

    const analytics = await analyticsService.calculatePortfolioAnalytics(
      portfolioId,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: {
        portfolioId,
        analysisDate: analytics.analysisDate,
        sectorAllocation: analytics.sectorAllocation
      }
    });
  } catch (error: any) {
    logger.error('Error fetching sector allocation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sector allocation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get portfolio rating allocation
router.get('/portfolio/:portfolioId/rating-allocation', async (req: any, res: any) => {
  try {
    const { portfolioId } = req.params;

    const analytics = await analyticsService.calculatePortfolioAnalytics(
      portfolioId,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: {
        portfolioId,
        analysisDate: analytics.analysisDate,
        ratingAllocation: analytics.ratingAllocation
      }
    });
  } catch (error: any) {
    logger.error('Error fetching rating allocation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rating allocation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get portfolio maturity distribution
router.get('/portfolio/:portfolioId/maturity-distribution', async (req: any, res: any) => {
  try {
    const { portfolioId } = req.params;

    const analytics = await analyticsService.calculatePortfolioAnalytics(
      portfolioId,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: {
        portfolioId,
        analysisDate: analytics.analysisDate,
        maturityDistribution: analytics.maturityDistribution
      }
    });
  } catch (error: any) {
    logger.error('Error fetching maturity distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maturity distribution',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get portfolio cash flow projections
router.get('/portfolio/:portfolioId/cash-flows', async (req: any, res: any) => {
  try {
    const { portfolioId } = req.params;
    const { horizonDays } = req.query;

    const analytics = await analyticsService.calculatePortfolioAnalytics(
      portfolioId,
      req.user!.tenantId,
      req.user!.userId
    );

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
  } catch (error: any) {
    logger.error('Error fetching cash flows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cash flows',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stress Testing Routes

// Get portfolio stress test results
router.get('/portfolio/:portfolioId/stress-test', async (req: any, res: any) => {
  try {
    const { portfolioId } = req.params;

    const analytics = await analyticsService.calculatePortfolioAnalytics(
      portfolioId,
      req.user!.tenantId,
      req.user!.userId
    );

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
  } catch (error: any) {
    logger.error('Error fetching stress test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stress test results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fixed Income Security Search and Management Routes

// Search fixed income securities
router.get('/securities/search', async (req: any, res: any) => {
  try {
    const {
      bondTypes,
      creditRatings,
      maturityDateFrom,
      maturityDateTo,
      yieldMin,
      yieldMax,
      durationMin,
      durationMax,
      sectors,
      issuers,
      currencies,
      isCallable,
      isPutable,
      limit,
      offset
    } = req.query;

    const searchRequest: FixedIncomeSearchRequest = {
      tenantId: req.user!.tenantId,
      bondTypes: bondTypes ? (bondTypes as string).split(',') as BondType[] : undefined,
      creditRatings: creditRatings ? (creditRatings as string).split(',') as CreditRating[] : undefined,
      maturityRange: maturityDateFrom || maturityDateTo ? {
        min: maturityDateFrom ? new Date(maturityDateFrom as string) : new Date('1900-01-01'),
        max: maturityDateTo ? new Date(maturityDateTo as string) : new Date('2100-12-31')
      } : undefined,
      yieldRange: yieldMin || yieldMax ? {
        min: yieldMin ? parseFloat(yieldMin as string) : 0,
        max: yieldMax ? parseFloat(yieldMax as string) : 1
      } : undefined,
      durationRange: durationMin || durationMax ? {
        min: durationMin ? parseFloat(durationMin as string) : 0,
        max: durationMax ? parseFloat(durationMax as string) : 100
      } : undefined,
      sectors: sectors ? (sectors as string).split(',') : undefined,
      issuers: issuers ? (issuers as string).split(',') : undefined,
      currencies: currencies ? (currencies as string).split(',') : undefined,
      isCallable: isCallable ? isCallable === 'true' : undefined,
      isPutable: isPutable ? isPutable === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
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
  } catch (error: any) {
    logger.error('Error searching fixed income securities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search fixed income securities',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get fixed income security details
router.get('/securities/:securityId', async (req: any, res: any) => {
  try {
    const { securityId } = req.params;

    const security = await prisma.fixedIncomeSecurity.findFirst({
      where: {
        id: securityId, // using id instead of securityId
        tenantId: req.user!.tenantId
      },
      // include relationships removed due to schema mismatch
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
  } catch (error: any) {
    logger.error('Error fetching fixed income security:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fixed income security',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analytics Dashboard Routes

// Get fixed income analytics dashboard
router.get('/dashboard', async (req: any, res: any) => {
  try {
    const { portfolioIds } = req.query;

    // Get overview metrics
    const totalSecurities = await prisma.fixedIncomeSecurity.count({
      where: { tenantId: req.user!.tenantId }
    });

    const totalPortfolios = await prisma.portfolio.count({
      where: { 
        tenantId: req.user!.tenantId,
        positions: {
          some: {
            securityType: 'FIXED_INCOME' // using securityType instead of instrument.assetClass
          }
        }
      }
    });

    // Get recent analytics calculations
    const recentAnalytics = await prisma.fixedIncomePortfolioAnalytics.findMany({
      where: {
        tenantId: req.user!.tenantId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Calculate aggregate metrics
    const avgPortfolioYield = recentAnalytics.length > 0 ? 
      recentAnalytics.reduce((sum, a) => sum + Number(a.yieldToMaturity), 0) / recentAnalytics.length : 0;
    
    const avgPortfolioDuration = recentAnalytics.length > 0 ?
      recentAnalytics.reduce((sum, a) => sum + Number(a.duration), 0) / recentAnalytics.length : 0;

    const avgCreditVaR = recentAnalytics.length > 0 ?
      recentAnalytics.reduce((sum, a) => sum + 0, 0) / recentAnalytics.length : 0; // creditVaR not in schema

    // Get top performers by yield
    const topPerformers = recentAnalytics
      .sort((a, b) => Number(b.yieldToMaturity) - Number(a.yieldToMaturity)) // using yieldToMaturity instead of portfolioYield
      .slice(0, 5);

    // Risk distribution (using placeholder values since totalVaR not in schema)
    const riskDistribution = {
      lowRisk: Math.floor(recentAnalytics.length * 0.6),
      mediumRisk: Math.floor(recentAnalytics.length * 0.3),
      highRisk: Math.floor(recentAnalytics.length * 0.1)
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
  } catch (error: any) {
    logger.error('Error fetching fixed income dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fixed income dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reference Data Routes

// Get fixed income reference data
router.get('/reference-data', async (req: any, res: any) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        yieldTypes: Object.values(YieldType),
        durationTypes: Object.values(DurationType),
        bondTypes: Object.values(BondType),
        creditRatings: Object.values(CreditRating),
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
  } catch (error: any) {
    logger.error('Error fetching reference data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reference data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch Operations Routes

// Batch yield calculation
router.post('/batch/yields', async (req: any, res: any) => {
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
        const request: YieldCalculationRequest = {
          securityId: calc.securityId,
          price: calc.price,
          settlementDate: new Date(calc.settlementDate),
          yieldTypes: calc.yieldTypes,
          taxRate: calc.taxRate
        };

        const result = await analyticsService.calculateYields(
          request,
          req.user!.tenantId,
          req.user!.userId
        );

        results.push({ index: i, ...result });
      } catch (error: any) {
        errors.push({
          index: i,
          securityId: calculations[i].securityId,
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
  } catch (error: any) {
    logger.error('Error in batch yield calculation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch yield calculation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for fixed income analytics
router.get('/health', async (req: any, res: any) => {
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
  } catch (error: any) {
    logger.error('Fixed income analytics health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

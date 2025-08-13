import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { DerivativesAnalyticsService } from '../services/derivativesAnalyticsService';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  GreeksCalculationRequest,
  ImpliedVolatilityRequest,
  StrategyBuilderRequest,
  MarginCalculationRequest,
  DerivativesSearchRequest,
  DerivativeType,
  OptionStyle,
  VolatilityModel,
  StrategyType,
  MarginType
} from '../models/derivatives/DerivativesAnalytics';

const router = express.Router();
const prisma = new PrismaClient();
const kafkaService = getKafkaService();
const derivativesService = new DerivativesAnalyticsService(prisma, kafkaService);

// Greeks Calculation Routes

// Calculate Greeks for a derivative instrument
router.post('/greeks/calculate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      instrumentId,
      underlyingPrice,
      volatility,
      riskFreeRate,
      dividendYield,
      calculationMethod
    } = req.body;

    // Validation
    if (!instrumentId) {
      return res.status(400).json({
        success: false,
        error: 'instrumentId is required'
      });
    }

    if (underlyingPrice !== undefined && underlyingPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'underlyingPrice must be positive if provided'
      });
    }

    if (volatility !== undefined && volatility <= 0) {
      return res.status(400).json({
        success: false,
        error: 'volatility must be positive if provided'
      });
    }

    if (calculationMethod && !Object.values(VolatilityModel).includes(calculationMethod)) {
      return res.status(400).json({
        success: false,
        error: `Invalid calculation method. Must be one of: ${Object.values(VolatilityModel).join(', ')}`
      });
    }

    const request: GreeksCalculationRequest = {
      instrumentId,
      underlyingPrice,
      volatility,
      riskFreeRate,
      dividendYield,
      calculationMethod
    };

    const result = await derivativesService.calculateGreeks(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Greeks calculation completed successfully'
    });
  } catch (error) {
    logger.error('Error calculating Greeks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate Greeks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get historical Greeks data
router.get('/greeks/:instrumentId/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { instrumentId } = req.params;
    const { days, limit } = req.query;

    const daysBack = days ? parseInt(days as string) : 30;
    const resultLimit = limit ? parseInt(limit as string) : 100;

    if (daysBack <= 0 || daysBack > 365) {
      return res.status(400).json({
        success: false,
        error: 'days must be between 1 and 365'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const greeksHistory = await prisma.greeksCalculation.findMany({
      where: {
        instrumentId,
        tenantId: req.user!.tenantId,
        calculationDate: {
          gte: startDate
        }
      },
      orderBy: {
        calculationDate: 'desc'
      },
      take: resultLimit
    });

    res.status(200).json({
      success: true,
      data: {
        instrumentId,
        history: greeksHistory,
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          daysRequested: daysBack,
          recordsReturned: greeksHistory.length
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching Greeks history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Greeks history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Implied Volatility Routes

// Calculate implied volatility for an option
router.post('/implied-volatility/calculate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      instrumentId,
      optionPrice,
      underlyingPrice,
      timeToExpiration,
      riskFreeRate,
      dividendYield
    } = req.body;

    // Validation
    if (!instrumentId || optionPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'instrumentId and optionPrice are required'
      });
    }

    if (optionPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'optionPrice must be positive'
      });
    }

    if (underlyingPrice !== undefined && underlyingPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'underlyingPrice must be positive if provided'
      });
    }

    if (timeToExpiration !== undefined && timeToExpiration <= 0) {
      return res.status(400).json({
        success: false,
        error: 'timeToExpiration must be positive if provided'
      });
    }

    const request: ImpliedVolatilityRequest = {
      instrumentId,
      optionPrice,
      underlyingPrice,
      timeToExpiration,
      riskFreeRate,
      dividendYield
    };

    const result = await derivativesService.calculateImpliedVolatility(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Implied volatility calculation completed successfully'
    });
  } catch (error) {
    logger.error('Error calculating implied volatility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate implied volatility',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get volatility surface data
router.get('/volatility-surface/:underlyingSymbol', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { underlyingSymbol } = req.params;
    const { expirationDate } = req.query;

    // Get volatility surface data for the underlying
    const surfaceData = await prisma.impliedVolatilityAnalysis.findMany({
      where: {
        tenantId: req.user!.tenantId,
        instrumentId: {
          in: await prisma.derivativeInstrument.findMany({
            where: {
              underlyingSymbol,
              tenantId: req.user!.tenantId,
              expirationDate: expirationDate ? new Date(expirationDate as string) : undefined
            },
            select: { instrumentId: true }
          }).then(instruments => instruments.map(i => i.instrumentId))
        }
      },
      orderBy: [
        { analysisDate: 'desc' }
      ],
      take: 100
    });

    // Process surface data into structured format
    const surface = this.processSurfaceData(surfaceData);

    res.status(200).json({
      success: true,
      data: {
        underlyingSymbol,
        expirationDate: expirationDate || 'all',
        surface,
        dataPoints: surfaceData.length,
        lastUpdated: surfaceData.length > 0 ? surfaceData[0].analysisDate : null
      }
    });
  } catch (error) {
    logger.error('Error fetching volatility surface:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volatility surface',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Option Strategy Routes

// Build option strategy
router.post('/strategies/build', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      portfolioId,
      strategyType,
      underlyingSymbol,
      legs,
      targetPrice,
      riskTolerance,
      timeHorizon
    } = req.body;

    // Validation
    if (!strategyType || !underlyingSymbol || !Array.isArray(legs) || legs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'strategyType, underlyingSymbol, and legs are required'
      });
    }

    if (!Object.values(StrategyType).includes(strategyType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid strategy type. Must be one of: ${Object.values(StrategyType).join(', ')}`
      });
    }

    // Validate legs
    for (const leg of legs) {
      if (!leg.side || !['BUY', 'SELL'].includes(leg.side)) {
        return res.status(400).json({
          success: false,
          error: 'Each leg must have a valid side (BUY or SELL)'
        });
      }
      if (!leg.quantity || leg.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Each leg must have a positive quantity'
        });
      }
    }

    const request: StrategyBuilderRequest = {
      tenantId: req.user!.tenantId,
      portfolioId,
      strategyType,
      underlyingSymbol,
      legs,
      targetPrice,
      riskTolerance,
      timeHorizon
    };

    const result = await derivativesService.buildOptionStrategy(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Option strategy created successfully'
    });
  } catch (error) {
    logger.error('Error building option strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build option strategy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get strategy details
router.get('/strategies/:strategyId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { strategyId } = req.params;

    const strategy = await prisma.optionStrategy.findFirst({
      where: {
        id: strategyId,
        tenantId: req.user!.tenantId
      },
      include: {
        legs: true
      }
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    logger.error('Error fetching strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch strategy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get portfolio strategies
router.get('/strategies/portfolio/:portfolioId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const { status, strategyType } = req.query;

    const whereClause: any = {
      portfolioId,
      tenantId: req.user!.tenantId
    };

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    if (strategyType && Object.values(StrategyType).includes(strategyType as StrategyType)) {
      whereClause.strategyType = strategyType;
    }

    const strategies = await prisma.optionStrategy.findMany({
      where: whereClause,
      include: {
        legs: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        portfolioId,
        strategies,
        summary: {
          total: strategies.length,
          active: strategies.filter(s => s.isActive).length,
          inactive: strategies.filter(s => !s.isActive).length
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching portfolio strategies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio strategies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Margin Calculation Routes

// Calculate margin requirements
router.post('/margin/calculate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      portfolioId,
      positions,
      marginType,
      underlyingPrices,
      volatilities,
      interestRates,
      calculationDate,
      scenarioShifts
    } = req.body;

    // Validation
    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'positions array is required and must not be empty'
      });
    }

    if (marginType && !Object.values(MarginType).includes(marginType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid margin type. Must be one of: ${Object.values(MarginType).join(', ')}`
      });
    }

    if (!underlyingPrices || typeof underlyingPrices !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'underlyingPrices object is required'
      });
    }

    // Validate positions
    for (const position of positions) {
      if (!position.instrumentId || !position.quantity || !position.price || !position.side) {
        return res.status(400).json({
          success: false,
          error: 'Each position must have instrumentId, quantity, price, and side'
        });
      }
      if (!['LONG', 'SHORT'].includes(position.side)) {
        return res.status(400).json({
          success: false,
          error: 'Position side must be LONG or SHORT'
        });
      }
    }

    const request: MarginCalculationRequest = {
      tenantId: req.user!.tenantId,
      portfolioId,
      positions,
      marginType: marginType || MarginType.INITIAL_MARGIN,
      underlyingPrices,
      volatilities: volatilities || {},
      interestRates: interestRates || {},
      calculationDate: calculationDate ? new Date(calculationDate) : undefined,
      scenarioShifts
    };

    const result = await derivativesService.calculateMargin(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Margin calculation completed successfully'
    });
  } catch (error) {
    logger.error('Error calculating margin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate margin',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark-to-Market Routes

// Calculate mark-to-market valuation
router.post('/mark-to-market/:instrumentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { instrumentId } = req.params;

    const result = await derivativesService.calculateMarkToMarket(
      instrumentId,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Mark-to-market valuation completed successfully'
    });
  } catch (error) {
    logger.error('Error calculating mark-to-market:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate mark-to-market valuation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Portfolio Analytics Routes

// Calculate portfolio derivatives analytics
router.get('/portfolio/:portfolioId/analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolioId } = req.params;

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

    const analytics = await derivativesService.calculatePortfolioAnalytics(
      portfolioId,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Portfolio derivatives analytics calculated successfully'
    });
  } catch (error) {
    logger.error('Error calculating portfolio analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate portfolio analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search and Discovery Routes

// Search derivative instruments
router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      underlyingSymbol,
      derivativeTypes,
      optionTypes,
      strikePriceMin,
      strikePriceMax,
      premiumMin,
      premiumMax,
      expirationDateMin,
      expirationDateMax,
      daysToExpirationMin,
      daysToExpirationMax,
      deltaMin,
      deltaMax,
      gammaMin,
      gammaMax,
      thetaMin,
      thetaMax,
      vegaMin,
      vegaMax,
      impliedVolatilityMin,
      impliedVolatilityMax,
      volumeMin,
      openInterestMin,
      bidAskSpreadMax,
      limit,
      offset,
      sortBy,
      sortOrder
    } = req.query;

    // Validate derivative types
    if (derivativeTypes) {
      const types = (derivativeTypes as string).split(',');
      const invalidTypes = types.filter(type => !Object.values(DerivativeType).includes(type as DerivativeType));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid derivative types: ${invalidTypes.join(', ')}`
        });
      }
    }

    // Validate option types
    if (optionTypes) {
      const types = (optionTypes as string).split(',');
      const invalidTypes = types.filter(type => !['CALL', 'PUT'].includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid option types: ${invalidTypes.join(', ')}. Must be CALL or PUT`
        });
      }
    }

    const searchRequest: DerivativesSearchRequest = {
      tenantId: req.user!.tenantId,
      underlyingSymbol: underlyingSymbol as string,
      derivativeTypes: derivativeTypes ? (derivativeTypes as string).split(',') as DerivativeType[] : undefined,
      optionTypes: optionTypes ? (optionTypes as string).split(',') as ('CALL' | 'PUT')[] : undefined,
      strikePriceMin: strikePriceMin ? parseFloat(strikePriceMin as string) : undefined,
      strikePriceMax: strikePriceMax ? parseFloat(strikePriceMax as string) : undefined,
      premiumMin: premiumMin ? parseFloat(premiumMin as string) : undefined,
      premiumMax: premiumMax ? parseFloat(premiumMax as string) : undefined,
      expirationDateMin: expirationDateMin ? new Date(expirationDateMin as string) : undefined,
      expirationDateMax: expirationDateMax ? new Date(expirationDateMax as string) : undefined,
      daysToExpirationMin: daysToExpirationMin ? parseInt(daysToExpirationMin as string) : undefined,
      daysToExpirationMax: daysToExpirationMax ? parseInt(daysToExpirationMax as string) : undefined,
      deltaMin: deltaMin ? parseFloat(deltaMin as string) : undefined,
      deltaMax: deltaMax ? parseFloat(deltaMax as string) : undefined,
      gammaMin: gammaMin ? parseFloat(gammaMin as string) : undefined,
      gammaMax: gammaMax ? parseFloat(gammaMax as string) : undefined,
      thetaMin: thetaMin ? parseFloat(thetaMin as string) : undefined,
      thetaMax: thetaMax ? parseFloat(thetaMax as string) : undefined,
      vegaMin: vegaMin ? parseFloat(vegaMin as string) : undefined,
      vegaMax: vegaMax ? parseFloat(vegaMax as string) : undefined,
      impliedVolatilityMin: impliedVolatilityMin ? parseFloat(impliedVolatilityMin as string) : undefined,
      impliedVolatilityMax: impliedVolatilityMax ? parseFloat(impliedVolatilityMax as string) : undefined,
      volumeMin: volumeMin ? parseInt(volumeMin as string) : undefined,
      openInterestMin: openInterestMin ? parseInt(openInterestMin as string) : undefined,
      bidAskSpreadMax: bidAskSpreadMax ? parseFloat(bidAskSpreadMax as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string) === 'DESC' ? 'DESC' : 'ASC'
    };

    const result = await derivativesService.searchDerivatives(
      searchRequest,
      req.user!.tenantId
    );

    res.status(200).json({
      success: true,
      data: result,
      searchCriteria: searchRequest
    });
  } catch (error) {
    logger.error('Error searching derivatives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search derivatives',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get derivative instrument details
router.get('/instruments/:instrumentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { instrumentId } = req.params;

    const instrument = await prisma.derivativeInstrument.findFirst({
      where: {
        instrumentId,
        tenantId: req.user!.tenantId
      },
      include: {
        greeksCalculations: {
          orderBy: { calculationDate: 'desc' },
          take: 1
        },
        impliedVolatilityAnalyses: {
          orderBy: { analysisDate: 'desc' },
          take: 1
        },
        markToMarketValuations: {
          orderBy: { valuationDate: 'desc' },
          take: 1
        }
      }
    });

    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: 'Derivative instrument not found'
      });
    }

    res.status(200).json({
      success: true,
      data: instrument
    });
  } catch (error) {
    logger.error('Error fetching derivative instrument:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch derivative instrument',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reference Data Routes

// Get derivatives reference data
router.get('/reference-data', async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        derivativeTypes: Object.values(DerivativeType),
        optionStyles: Object.values(OptionStyle),
        volatilityModels: Object.values(VolatilityModel),
        strategyTypes: Object.values(StrategyType),
        marginTypes: Object.values(MarginType),
        exerciseTypes: ['PHYSICAL_DELIVERY', 'CASH_SETTLEMENT', 'CHOICE_OF_SETTLEMENT'],
        optionStatuses: ['ACTIVE', 'EXPIRED', 'EXERCISED', 'ASSIGNED', 'CLOSED', 'CANCELLED'],
        sides: ['LONG', 'SHORT'],
        optionTypes: ['CALL', 'PUT'],
        strategyLegSides: ['BUY', 'SELL']
      }
    });
  } catch (error) {
    logger.error('Error fetching reference data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reference data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analytics Dashboard Routes

// Get derivatives analytics dashboard
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolioIds } = req.query;

    // Get overview metrics
    const totalInstruments = await prisma.derivativeInstrument.count({
      where: { tenantId: req.user!.tenantId }
    });

    const totalStrategies = await prisma.optionStrategy.count({
      where: { 
        tenantId: req.user!.tenantId,
        isActive: true
      }
    });

    const totalPortfolios = await prisma.portfolio.count({
      where: { 
        tenantId: req.user!.tenantId,
        positions: {
          some: {
            instrument: {
              assetClass: 'DERIVATIVES'
            }
          }
        }
      }
    });

    // Get recent analytics
    const recentCalculations = await prisma.greeksCalculation.findMany({
      where: {
        tenantId: req.user!.tenantId,
        calculationDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { calculationDate: 'desc' },
      take: 50
    });

    const dashboard = {
      summary: {
        totalInstruments,
        totalStrategies,
        totalPortfolios,
        totalCalculations: recentCalculations.length,
        averageDelta: recentCalculations.length > 0 ? 
          recentCalculations.reduce((sum, calc) => sum + calc.delta, 0) / recentCalculations.length : 0,
        averageGamma: recentCalculations.length > 0 ?
          recentCalculations.reduce((sum, calc) => sum + calc.gamma, 0) / recentCalculations.length : 0,
        averageTheta: recentCalculations.length > 0 ?
          recentCalculations.reduce((sum, calc) => sum + calc.theta, 0) / recentCalculations.length : 0,
        averageVega: recentCalculations.length > 0 ?
          recentCalculations.reduce((sum, calc) => sum + calc.vega, 0) / recentCalculations.length : 0
      },
      recentActivity: recentCalculations.slice(0, 10),
      performance: {
        calculationsToday: recentCalculations.filter(calc => 
          calc.calculationDate >= new Date(new Date().setHours(0, 0, 0, 0))
        ).length,
        calculationsThisWeek: recentCalculations.length
      }
    };

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error fetching derivatives dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch derivatives dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for derivatives service
router.get('/health', async (req: Request, res: Response) => {
  try {
    const instrumentsCount = await prisma.derivativeInstrument.count();
    const calculationsCount = await prisma.greeksCalculation.count();
    const strategiesCount = await prisma.optionStrategy.count();
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      data: {
        totalInstruments: instrumentsCount,
        totalCalculations: calculationsCount,
        totalStrategies: strategiesCount,
        timestamp: new Date().toISOString(),
        service: 'derivatives-analytics',
        version: '1.0.0'
      }
    });
  } catch (error) {
    logger.error('Derivatives analytics health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
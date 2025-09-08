// Alternative Investments API Routes
// Phase 4.2 - RESTful API endpoints for alternative investments management

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
const { body, param, query } = require('express-validator');
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import { AlternativeInvestmentsService } from '../services/alternatives/AlternativeInvestmentsService';
import {
  CreateAlternativeInvestmentRequest,
  AlternativeInvestmentSearchRequest,
  AlternativeInvestmentType,
  FundStatus,
  SectorFocus,
  GeographicFocus
} from '../models/alternatives/AlternativeInvestments';

const router = express.Router();
const prisma = new PrismaClient();
const kafkaService = getKafkaService();
const alternativeInvestmentsService = new AlternativeInvestmentsService(prisma, kafkaService);

// Apply authentication to all routes
router.use(requireAuth as any);

// Create alternative investment  
router.post('/', [
  body('investmentData').exists().withMessage('investmentData is required'),
  body('investmentData.investmentName').notEmpty().withMessage('investmentName is required'),
  body('investmentData.investmentType').isIn(Object.values(AlternativeInvestmentType)).withMessage('Invalid investment type'),
  validateRequest
], async (req: any, res: any) => {
  try {
    const request: CreateAlternativeInvestmentRequest = req.body;
    
    // Validate required fields
    if (!request.investmentData) {
      return res.status(400).json({
        success: false,
        error: 'investmentData is required'
      });
    }

    if (!request.investmentData.investmentName || request.investmentData.investmentName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'investmentName is required'
      });
    }

    if (!request.investmentData.generalPartner || request.investmentData.generalPartner.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'generalPartner is required'
      });
    }

    if (!request.investmentData.commitment || request.investmentData.commitment <= 0) {
      return res.status(400).json({
        success: false,
        error: 'commitment must be positive'
      });
    }

    const investment = await alternativeInvestmentsService.createInvestment(
      request,
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('Alternative investment created via API', {
      investmentId: investment.id,
      investmentName: investment.investmentName,
      userId: req.user!.userId,
      tenantId: req.user!.tenantId
    });

    res.status(201).json({
      success: true,
      data: investment,
      message: 'Alternative investment created successfully'
    });

  } catch (error: any) {
    logger.error('Error creating alternative investment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get alternative investment by ID
router.get('/:investmentId', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;

    const investment = await alternativeInvestmentsService.getInvestment(
      investmentId,
      req.user!.tenantId
    );

    if (!investment) {
      return res.status(404).json({
        success: false,
        error: 'Alternative investment not found'
      });
    }

    res.json({
      success: true,
      data: investment
    });

  } catch (error: any) {
    logger.error('Error retrieving alternative investment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update alternative investment
router.put('/:investmentId', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const updates = req.body;

    const updatedInvestment = await alternativeInvestmentsService.updateInvestment(
      investmentId,
      updates,
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('Alternative investment updated via API', {
      investmentId,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      data: updatedInvestment,
      message: 'Alternative investment updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating alternative investment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Search alternative investments
router.get('/', async (req: any, res: any) => {
  try {
    const searchRequest: AlternativeInvestmentSearchRequest = {
      tenantId: req.user!.tenantId,
      investmentTypes: req.query.investmentTypes ? 
        (Array.isArray(req.query.investmentTypes) ? req.query.investmentTypes : [req.query.investmentTypes]) as AlternativeInvestmentType[] :
        undefined,
      generalPartners: req.query.generalPartners ?
        (Array.isArray(req.query.generalPartners) ? req.query.generalPartners as string[] : [req.query.generalPartners as string]) :
        undefined,
      vintages: req.query.vintages ?
        (Array.isArray(req.query.vintages) ? req.query.vintages : [req.query.vintages]).map((v: any) => parseInt(v as string)) :
        undefined,
      sectorFocus: req.query.sectorFocus ?
        (Array.isArray(req.query.sectorFocus) ? req.query.sectorFocus : [req.query.sectorFocus]) as SectorFocus[] :
        undefined,
      geographicFocus: req.query.geographicFocus ?
        (Array.isArray(req.query.geographicFocus) ? req.query.geographicFocus : [req.query.geographicFocus]) as GeographicFocus[] :
        undefined,
      fundStatuses: req.query.fundStatuses ?
        (Array.isArray(req.query.fundStatuses) ? req.query.fundStatuses : [req.query.fundStatuses]) as FundStatus[] :
        undefined,
      commitmentRange: req.query.minCommitment && req.query.maxCommitment ? {
        min: parseFloat(req.query.minCommitment as string),
        max: parseFloat(req.query.maxCommitment as string)
      } : undefined,
      performanceMetrics: req.query.minIRR || req.query.minMultiple ? {
        minIRR: req.query.minIRR ? parseFloat(req.query.minIRR as string) : undefined,
        minMultiple: req.query.minMultiple ? parseFloat(req.query.minMultiple as string) : undefined
      } : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC'
    };

    const searchResults = await alternativeInvestmentsService.searchInvestments(searchRequest);

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error: any) {
    logger.error('Error searching alternative investments:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Process capital call
router.post('/:investmentId/capital-calls', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const {
      callNumber,
      callAmount,
      dueDate,
      purpose,
      managementFeeAmount,
      expenseAmount
    } = req.body;

    if (!callNumber || !callAmount || !dueDate || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'callNumber, callAmount, dueDate, and purpose are required'
      });
    }

    if (callAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'callAmount must be positive'
      });
    }

    const capitalCall = await alternativeInvestmentsService.processCapitalCall(
      investmentId,
      {
        callNumber,
        callAmount,
        dueDate: new Date(dueDate),
        purpose,
        managementFeeAmount,
        expenseAmount
      },
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('Capital call processed via API', {
      investmentId,
      callId: capitalCall.id,
      callAmount,
      userId: req.user!.userId
    });

    res.status(201).json({
      success: true,
      data: capitalCall,
      message: 'Capital call processed successfully'
    });

  } catch (error: any) {
    logger.error('Error processing capital call:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Fund capital call
router.post('/capital-calls/:callId/fund', async (req: any, res: any) => {
  try {
    const { callId } = req.params;
    const { fundedAmount } = req.body;

    if (!fundedAmount || fundedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'fundedAmount is required and must be positive'
      });
    }

    const fundedCall = await alternativeInvestmentsService.fundCapitalCall(
      callId,
      fundedAmount,
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('Capital call funded via API', {
      callId,
      fundedAmount,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      data: fundedCall,
      message: 'Capital call funded successfully'
    });

  } catch (error: any) {
    logger.error('Error funding capital call:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Process distribution
router.post('/:investmentId/distributions', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const {
      distributionNumber,
      totalAmount,
      paymentDate,
      taxableAmount,
      returnOfCapital,
      capitalGain
    } = req.body;

    if (!distributionNumber || !totalAmount || !paymentDate) {
      return res.status(400).json({
        success: false,
        error: 'distributionNumber, totalAmount, and paymentDate are required'
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'totalAmount must be positive'
      });
    }

    const distribution = await alternativeInvestmentsService.processDistribution(
      investmentId,
      {
        distributionNumber,
        totalAmount,
        paymentDate: new Date(paymentDate),
        taxableAmount,
        returnOfCapital,
        capitalGain
      },
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('Distribution processed via API', {
      investmentId,
      distributionId: distribution.id,
      totalAmount,
      userId: req.user!.userId
    });

    res.status(201).json({
      success: true,
      data: distribution,
      message: 'Distribution processed successfully'
    });

  } catch (error: any) {
    logger.error('Error processing distribution:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update NAV
router.post('/:investmentId/nav', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const {
      asOfDate,
      netAssetValue,
      grossAssetValue,
      totalLiabilities,
      unrealizedGain,
      realizedGain,
      irr,
      multiple
    } = req.body;

    if (!asOfDate || !netAssetValue || !grossAssetValue || totalLiabilities === undefined) {
      return res.status(400).json({
        success: false,
        error: 'asOfDate, netAssetValue, grossAssetValue, and totalLiabilities are required'
      });
    }

    if (netAssetValue < 0 || grossAssetValue < 0) {
      return res.status(400).json({
        success: false,
        error: 'netAssetValue and grossAssetValue must be non-negative'
      });
    }

    const navUpdate = await alternativeInvestmentsService.updateNAV(
      investmentId,
      {
        asOfDate: new Date(asOfDate),
        netAssetValue,
        grossAssetValue,
        totalLiabilities,
        unrealizedGain: unrealizedGain || 0,
        realizedGain: realizedGain || 0,
        irr,
        multiple
      },
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('NAV updated via API', {
      investmentId,
      navId: navUpdate.id,
      netAssetValue,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      data: navUpdate,
      message: 'NAV updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating NAV:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Generate J-curve analysis
router.post('/:investmentId/j-curve-analysis', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const {
      timeHorizon,
      projectedFinalIRR,
      projectedFinalMultiple
    } = req.body;

    if (!timeHorizon || !projectedFinalIRR || !projectedFinalMultiple) {
      return res.status(400).json({
        success: false,
        error: 'timeHorizon, projectedFinalIRR, and projectedFinalMultiple are required'
      });
    }

    if (timeHorizon <= 0) {
      return res.status(400).json({
        success: false,
        error: 'timeHorizon must be positive'
      });
    }

    const jCurveAnalysis = await alternativeInvestmentsService.generateJCurveAnalysis(
      investmentId,
      {
        timeHorizon,
        projectedFinalIRR,
        projectedFinalMultiple
      },
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('J-curve analysis generated via API', {
      investmentId,
      analysisId: jCurveAnalysis.id,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      data: jCurveAnalysis,
      message: 'J-curve analysis generated successfully'
    });

  } catch (error: any) {
    logger.error('Error generating J-curve analysis:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Add portfolio company
router.post('/:investmentId/portfolio-companies', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const companyData = req.body;

    if (!companyData.companyName || companyData.companyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'companyName is required'
      });
    }

    if (!companyData.initialInvestmentAmount || companyData.initialInvestmentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'initialInvestmentAmount is required and must be positive'
      });
    }

    const portfolioCompany = await alternativeInvestmentsService.addPortfolioCompany(
      investmentId,
      companyData,
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('Portfolio company added via API', {
      investmentId,
      companyId: portfolioCompany.id,
      companyName: portfolioCompany.companyName,
      userId: req.user!.userId
    });

    res.status(201).json({
      success: true,
      data: portfolioCompany,
      message: 'Portfolio company added successfully'
    });

  } catch (error: any) {
    logger.error('Error adding portfolio company:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Create position in alternative investment
router.post('/:investmentId/positions', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const {
      portfolioId,
      commitmentAmount
    } = req.body;

    if (!portfolioId || !commitmentAmount) {
      return res.status(400).json({
        success: false,
        error: 'portfolioId and commitmentAmount are required'
      });
    }

    if (commitmentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'commitmentAmount must be positive'
      });
    }

    const position = await alternativeInvestmentsService.createPosition(
      investmentId,
      portfolioId,
      commitmentAmount,
      req.user!.tenantId,
      req.user!.userId
    );

    logger.info('Alternative investment position created via API', {
      positionId: position.id,
      investmentId,
      portfolioId,
      commitmentAmount,
      userId: req.user!.userId
    });

    res.status(201).json({
      success: true,
      data: position,
      message: 'Position created successfully'
    });

  } catch (error: any) {
    logger.error('Error creating position:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Generate fund analytics
router.get('/:investmentId/analytics', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const { asOfDate } = req.query;

    const analytics = await alternativeInvestmentsService.generateFundAnalytics(
      investmentId,
      asOfDate ? new Date(asOfDate as string) : new Date(),
      req.user!.tenantId
    );

    res.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    logger.error('Error generating fund analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Generate portfolio analytics
router.get('/portfolios/:portfolioId/analytics', async (req: any, res: any) => {
  try {
    const { portfolioId } = req.params;
    const { asOfDate } = req.query;

    const analytics = await alternativeInvestmentsService.generatePortfolioAnalytics(
      portfolioId,
      asOfDate ? new Date(asOfDate as string) : new Date(),
      req.user!.tenantId
    );

    res.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    logger.error('Error generating portfolio analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update ESG metrics
router.post('/:investmentId/esg', async (req: any, res: any) => {
  try {
    const { investmentId } = req.params;
    const esgData = req.body;

    if (!esgData.asOfDate) {
      return res.status(400).json({
        success: false,
        error: 'asOfDate is required'
      });
    }

    if (esgData.overallESGScore !== undefined && (esgData.overallESGScore < 0 || esgData.overallESGScore > 100)) {
      return res.status(400).json({
        success: false,
        error: 'overallESGScore must be between 0 and 100'
      });
    }

    const esgMetrics = await alternativeInvestmentsService.updateESGMetrics(
      investmentId,
      {
        ...esgData,
        asOfDate: new Date(esgData.asOfDate)
      },
      req.user!.tenantId
    );

    logger.info('ESG metrics updated via API', {
      investmentId,
      overallESGScore: esgMetrics.overallESGScore,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      data: esgMetrics,
      message: 'ESG metrics updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating ESG metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get investment types enum
router.get('/enums/investment-types', async (req: any, res: any) => {
  try {
    const investmentTypes = Object.values(AlternativeInvestmentType);
    
    res.json({
      success: true,
      data: investmentTypes
    });
  } catch (error: any) {
    logger.error('Error retrieving investment types:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get fund statuses enum
router.get('/enums/fund-statuses', async (req: any, res: any) => {
  try {
    const fundStatuses = Object.values(FundStatus);
    
    res.json({
      success: true,
      data: fundStatuses
    });
  } catch (error: any) {
    logger.error('Error retrieving fund statuses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get sector focus enum
router.get('/enums/sector-focus', async (req: any, res: any) => {
  try {
    const sectorFocus = Object.values(SectorFocus);
    
    res.json({
      success: true,
      data: sectorFocus
    });
  } catch (error: any) {
    logger.error('Error retrieving sector focus:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get geographic focus enum
router.get('/enums/geographic-focus', async (req: any, res: any) => {
  try {
    const geographicFocus = Object.values(GeographicFocus);
    
    res.json({
      success: true,
      data: geographicFocus
    });
  } catch (error: any) {
    logger.error('Error retrieving geographic focus:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      service: 'Alternative Investments API',
      timestamp: new Date().toISOString(),
      version: '4.2.0'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;

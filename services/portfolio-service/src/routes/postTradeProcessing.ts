import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { PostTradeProcessingService } from '../services/postTradeProcessingService';
import { } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  TradeConfirmationStatus,
  TradeBreakType,
  TradeBreakSeverity,
  SettlementInstructionType,
  CustodianMessageType,
  RegulatoryReportType,
  TransactionCostAnalysisType
} from '../models/trading/PostTradeProcessing';

const router = express.Router();
const prisma = new PrismaClient();
const kafkaService = getKafkaService();
const postTradeService = new PostTradeProcessingService(prisma, kafkaService);

// Trade Confirmation Routes

// Create trade confirmation
router.post('/trade-confirmations', async (req: any, res: any) => {
  try {
    const {
      tradeId,
      orderId,
      executionId,
      counterpartyId,
      confirmationMethod,
      notes
    } = req.body;

    // Validation
    if (!tradeId || !orderId || !executionId || !counterpartyId || !confirmationMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tradeId, orderId, executionId, counterpartyId, confirmationMethod'
      });
    }

    const confirmation = await postTradeService.createTradeConfirmation({
      tradeId,
      orderId,
      executionId,
      counterpartyId,
      confirmationMethod,
      notes
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: confirmation,
      message: 'Trade confirmation created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating trade confirmation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trade confirmation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update trade confirmation
router.put('/trade-confirmations/:confirmationId', async (req: any, res: any) => {
  try {
    const { confirmationId } = req.params;
    const { confirmationStatus, affirmedAt, notes } = req.body;

    // Validate confirmation status
    const validStatuses = Object.values(TradeConfirmationStatus);
    if (confirmationStatus && !validStatuses.includes(confirmationStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid confirmation status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const confirmation = await postTradeService.updateTradeConfirmation({
      confirmationId,
      confirmationStatus,
      affirmedAt: affirmedAt ? new Date(affirmedAt) : undefined,
      notes
    }, req.user!.tenantId, req.user!.userId);

    res.json({
      success: true,
      data: confirmation,
      message: 'Trade confirmation updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating trade confirmation:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Failed to update trade confirmation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search trade confirmations
router.get('/trade-confirmations', async (req: any, res: any) => {
  try {
    const {
      portfolioIds,
      instrumentIds,
      counterpartyIds,
      confirmationStatuses,
      fromDate,
      toDate,
      limit,
      offset
    } = req.query;

    const searchRequest = {
      portfolioIds: portfolioIds ? (portfolioIds as string).split(',') : undefined,
      instrumentIds: instrumentIds ? (instrumentIds as string).split(',') : undefined,
      counterpartyIds: counterpartyIds ? (counterpartyIds as string).split(',') : undefined,
      confirmationStatuses: confirmationStatuses ? 
        (confirmationStatuses as string).split(',') as TradeConfirmationStatus[] : undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await postTradeService.searchTradeConfirmations(searchRequest, req.user!.tenantId);

    res.json({
      success: true,
      data: result.confirmations,
      pagination: {
        total: result.total,
        limit: searchRequest.limit || 50,
        offset: searchRequest.offset || 0,
        hasMore: result.hasMore
      },
      searchCriteria: result.searchCriteria
    });
  } catch (error: any) {
    logger.error('Error searching trade confirmations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search trade confirmations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Settlement Instruction Routes

// Create settlement instruction
router.post('/settlement-instructions', async (req: any, res: any) => {
  try {
    const {
      tradeConfirmationId,
      instructionType,
      deliveryAccount,
      receiveAccount,
      cashAccount,
      priority
    } = req.body;

    // Validation
    if (!tradeConfirmationId || !instructionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tradeConfirmationId, instructionType'
      });
    }

    const validInstructionTypes = Object.values(SettlementInstructionType);
    if (!validInstructionTypes.includes(instructionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid instruction type. Must be one of: ${validInstructionTypes.join(', ')}`
      });
    }

    const instruction = await postTradeService.createSettlementInstruction({
      tradeConfirmationId,
      instructionType,
      deliveryAccount,
      receiveAccount,
      cashAccount,
      priority
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: instruction,
      message: 'Settlement instruction created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating settlement instruction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create settlement instruction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trade Break Management Routes

// Create trade break
router.post('/trade-breaks', async (req: any, res: any) => {
  try {
    const {
      tradeId,
      breakType,
      severity,
      description,
      expectedValue,
      actualValue,
      assignedTo
    } = req.body;

    // Validation
    if (!tradeId || !breakType || !severity || !description || 
        expectedValue === undefined || actualValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tradeId, breakType, severity, description, expectedValue, actualValue'
      });
    }

    const validBreakTypes = Object.values(TradeBreakType);
    if (!validBreakTypes.includes(breakType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid break type. Must be one of: ${validBreakTypes.join(', ')}`
      });
    }

    const validSeverities = Object.values(TradeBreakSeverity);
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
      });
    }

    const tradeBreak = await postTradeService.createTradeBreak({
      tradeId,
      breakType,
      severity,
      description,
      expectedValue,
      actualValue,
      assignedTo
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: tradeBreak,
      message: 'Trade break created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating trade break:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trade break',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resolve trade break
router.put('/trade-breaks/:breakId/resolve', async (req: any, res: any) => {
  try {
    const { breakId } = req.params;
    const { resolutionNotes } = req.body;

    if (!resolutionNotes) {
      return res.status(400).json({
        success: false,
        error: 'Resolution notes are required'
      });
    }

    const resolvedBreak = await postTradeService.resolveTradeBreak(
      breakId,
      resolutionNotes,
      req.user!.tenantId,
      req.user!.userId
    );

    res.json({
      success: true,
      data: resolvedBreak,
      message: 'Trade break resolved successfully'
    });
  } catch (error: any) {
    logger.error('Error resolving trade break:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Failed to resolve trade break',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Transaction Cost Analysis Routes

// Run TCA analysis
router.post('/transaction-cost-analysis', async (req: any, res: any) => {
  try {
    const { orderId, analysisType, benchmarkData } = req.body;

    // Validation
    if (!orderId || !analysisType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, analysisType'
      });
    }

    const validAnalysisTypes = Object.values(TransactionCostAnalysisType);
    if (!validAnalysisTypes.includes(analysisType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid analysis type. Must be one of: ${validAnalysisTypes.join(', ')}`
      });
    }

    const analysis = await postTradeService.runTransactionCostAnalysis({
      orderId,
      analysisType,
      benchmarkData
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: analysis,
      message: 'Transaction cost analysis completed successfully'
    });
  } catch (error: any) {
    logger.error('Error running TCA analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run transaction cost analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get TCA analyses for order
router.get('/orders/:orderId/transaction-cost-analysis', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    const analyses = await prisma.transactionCostAnalysis.findMany({
      where: {
        orderId,
        tenantId: req.user!.tenantId
      } as any,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: analyses,
      total: analyses.length
    });
  } catch (error: any) {
    logger.error('Error fetching TCA analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TCA analyses',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Custodian Integration Routes

// Send message to custodian
router.post('/custodian-messages', async (req: any, res: any) => {
  try {
    const {
      custodianId,
      messageType,
      messageContent,
      relatedTradeId,
      priority
    } = req.body;

    // Validation
    if (!custodianId || !messageType || !messageContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: custodianId, messageType, messageContent'
      });
    }

    const validMessageTypes = Object.values(CustodianMessageType);
    if (!validMessageTypes.includes(messageType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid message type. Must be one of: ${validMessageTypes.join(', ')}`
      });
    }

    const message = await postTradeService.sendCustodianMessage({
      custodianId,
      messageType,
      messageContent,
      relatedTradeId,
      priority
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Custodian message sent successfully'
    });
  } catch (error: any) {
    logger.error('Error sending custodian message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send custodian message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get custodian messages
router.get('/custodian-messages', async (req: any, res: any) => {
  try {
    const { custodianId, messageType, status, limit, offset } = req.query;

    const where: any = { tenantId: req.user!.tenantId };
    
    if (custodianId) where.custodianId = custodianId as string;
    if (messageType) where.messageType = messageType as string;
    if (status) where.messageStatus = status as string;

    const messages = await prisma.custodianMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0
    });

    const total = await prisma.custodianMessage.count({ where });

    res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        hasMore: (offset ? parseInt(offset as string) : 0) + messages.length < total
      }
    });
  } catch (error: any) {
    logger.error('Error fetching custodian messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custodian messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Regulatory Reporting Routes

// Create regulatory report
router.post('/regulatory-reports', async (req: any, res: any) => {
  try {
    const {
      reportType,
      reportingPeriodStart,
      reportingPeriodEnd,
      regulatorId,
      reportData
    } = req.body;

    // Validation
    if (!reportType || !reportingPeriodStart || !reportingPeriodEnd || !regulatorId || !reportData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportType, reportingPeriodStart, reportingPeriodEnd, regulatorId, reportData'
      });
    }

    const validReportTypes = Object.values(RegulatoryReportType);
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}`
      });
    }

    const report = await postTradeService.createRegulatoryReport({
      reportType,
      reportingPeriodStart: new Date(reportingPeriodStart),
      reportingPeriodEnd: new Date(reportingPeriodEnd),
      regulatorId,
      reportData
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Regulatory report created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating regulatory report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create regulatory report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get regulatory reports
router.get('/regulatory-reports', async (req: any, res: any) => {
  try {
    const { reportType, status, fromDate, toDate, limit, offset } = req.query;

    const where: any = { tenantId: req.user!.tenantId };
    
    if (reportType) where.reportType = reportType as string;
    if (status) where.reportStatus = status as string;
    
    if (fromDate || toDate) {
      where.reportingPeriodStart = {};
      if (fromDate) where.reportingPeriodStart.gte = new Date(fromDate as string);
      if (toDate) where.reportingPeriodStart.lte = new Date(toDate as string);
    }

    const reports = await prisma.regulatoryReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0
    });

    const total = await prisma.regulatoryReport.count({ where });

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        hasMore: (offset ? parseInt(offset as string) : 0) + reports.length < total
      }
    });
  } catch (error: any) {
    logger.error('Error fetching regulatory reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regulatory reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trade Matching Routes

// Match trade
router.post('/trade-matching', async (req: any, res: any) => {
  try {
    const {
      internalTradeId,
      externalTradeId,
      priceToleranceBps,
      quantityToleranceShares,
      dateToleranceDays
    } = req.body;

    // Validation
    if (!internalTradeId || !externalTradeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: internalTradeId, externalTradeId'
      });
    }

    const match = await postTradeService.matchTrade({
      internalTradeId,
      externalTradeId,
      priceToleranceBps,
      quantityToleranceShares,
      dateToleranceDays
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: match,
      message: 'Trade matching completed successfully'
    });
  } catch (error: any) {
    logger.error('Error matching trade:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to match trade',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard and Analytics Routes

// Get post-trade processing summary
router.get('/summary', async (req: any, res: any) => {
  try {
    const summary = await postTradeService.getPostTradeProcessingSummary(req.user!.tenantId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    logger.error('Error fetching post-trade summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post-trade summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reference Data Routes

// Get post-trade processing reference data
router.get('/reference-data', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      data: {
        tradeConfirmationStatuses: Object.values(TradeConfirmationStatus),
        tradeBreakTypes: Object.values(TradeBreakType),
        tradeBreakSeverities: Object.values(TradeBreakSeverity),
        settlementInstructionTypes: Object.values(SettlementInstructionType),
        custodianMessageTypes: Object.values(CustodianMessageType),
        regulatoryReportTypes: Object.values(RegulatoryReportType),
        transactionCostAnalysisTypes: Object.values(TransactionCostAnalysisType)
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

// Health check for post-trade processing
router.get('/health', async (req: any, res: any) => {
  try {
    // Basic health check - verify database connectivity
    const confirmationCount = await prisma.tradeConfirmation.count();
    const breakCount = await prisma.tradeBreak.count();
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        totalTradeConfirmations: confirmationCount,
        totalTradeBreaks: breakCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Post-trade processing health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import { CustodianIntegrationService } from '../services/custodianIntegration/CustodianIntegrationService';
import { 
  CustodianConnectionRequest,
  DataFeedRequest,
  ReconciliationRequest,
  OrderSubmissionRequest,
  DocumentRetrievalRequest,
  CustodianType,
  DataFeedType,
  APIConnectionType
} from '../models/custodianIntegration/CustodianIntegration';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
const prisma = new PrismaClient();
const kafkaService = getKafkaService();
const custodianIntegrationService = new CustodianIntegrationService(prisma, kafkaService);

// Validation schemas
const custodianConnectionSchema = {
  custodianType: { 
    required: true, 
    enum: Object.values(CustodianType),
    message: 'Valid custodian type is required' 
  },
  custodianName: { 
    required: true, 
    type: 'string', 
    minLength: 1,
    message: 'Custodian name is required' 
  },
  custodianCode: { 
    required: true, 
    type: 'string', 
    minLength: 1,
    message: 'Custodian code is required' 
  },
  connectionType: { 
    required: true, 
    enum: Object.values(APIConnectionType),
    message: 'Valid connection type is required' 
  },
  connectionConfig: { 
    required: true, 
    type: 'object',
    message: 'Connection configuration is required' 
  },
  supportedFeatures: { 
    required: true, 
    type: 'array',
    message: 'Supported features list is required' 
  },
  rateLimits: { 
    required: false, 
    type: 'array',
    default: []
  }
};

const dataFeedRequestSchema = {
  feedType: { 
    required: true, 
    enum: Object.values(DataFeedType),
    message: 'Valid feed type is required' 
  },
  portfolioId: { 
    required: false, 
    type: 'string' 
  },
  accountNumber: { 
    required: false, 
    type: 'string' 
  },
  dateFrom: { 
    required: false, 
    type: 'string',
    format: 'date'
  },
  dateTo: { 
    required: false, 
    type: 'string',
    format: 'date'
  },
  forceRefresh: { 
    required: false, 
    type: 'boolean',
    default: false
  }
};

const reconciliationRequestSchema = {
  portfolioId: { 
    required: true, 
    type: 'string',
    message: 'Portfolio ID is required' 
  },
  reconciliationType: { 
    required: true, 
    enum: ['POSITION', 'TRANSACTION', 'CASH_BALANCE', 'FULL'],
    message: 'Valid reconciliation type is required' 
  },
  asOfDate: { 
    required: true, 
    type: 'string',
    format: 'date',
    message: 'As of date is required' 
  },
  tolerance: { 
    required: false, 
    type: 'number',
    default: 0.01
  },
  includeExclusions: { 
    required: false, 
    type: 'boolean',
    default: false
  }
};

/**
 * @route POST /api/custodian-integration/connections
 * @desc Create a new custodian connection
 * @access Private
 */
router.post('/connections', 
  authMiddleware as any, 
  validateRequest(custodianConnectionSchema),
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      const connectionRequest: CustodianConnectionRequest = req.body;

      logger.info('Creating custodian connection', { 
        tenantId, 
        custodianType: connectionRequest.custodianType,
        userId 
      });

      const result = await custodianIntegrationService.createCustodianConnection(
        tenantId, 
        connectionRequest, 
        userId
      );

      res.status(201).json({
        success: true,
        data: {
          connection: result.connection,
          testResults: result.testResults
        },
        message: 'Custodian connection created successfully'
      });

    } catch (error: any) {
      logger.error('Error creating custodian connection:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CONNECTION_CREATION_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/custodian-integration/connections/:connectionId
 * @desc Get custodian connection details
 * @access Private
 */
router.get('/connections/:connectionId', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      // Implementation would query the database for connection details
      // This is a placeholder response
      res.json({
        success: true,
        data: {
          id: connectionId,
          tenantId,
          status: 'CONNECTED',
          lastSuccessfulConnection: new Date(),
          supportedFeatures: [],
          performanceMetrics: {}
        }
      });

    } catch (error: any) {
      logger.error('Error fetching custodian connection:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CONNECTION_FETCH_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/custodian-integration/connections
 * @desc List all custodian connections for tenant
 * @access Private
 */
router.get('/connections', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const { status, custodianType, page = 1, limit = 50 } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      // Implementation would query the database with filters
      // This is a placeholder response
      res.json({
        success: true,
        data: {
          connections: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error listing custodian connections:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CONNECTIONS_LIST_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/custodian-integration/connections/:connectionId/data-feed
 * @desc Process data feed from custodian
 * @access Private
 */
router.post('/connections/:connectionId/data-feed', 
  authMiddleware as any,
  validateRequest(dataFeedRequestSchema),
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      const dataFeedRequest: DataFeedRequest = {
        custodianConnectionId: connectionId,
        ...req.body
      };

      // Convert date strings to Date objects
      if (dataFeedRequest.dateFrom) {
        dataFeedRequest.dateFrom = new Date(dataFeedRequest.dateFrom);
      }
      if (dataFeedRequest.dateTo) {
        dataFeedRequest.dateTo = new Date(dataFeedRequest.dateTo);
      }

      logger.info('Processing custodian data feed', { 
        connectionId, 
        feedType: dataFeedRequest.feedType,
        tenantId 
      });

      const result = await custodianIntegrationService.processCustodianDataFeed(
        connectionId, 
        dataFeedRequest
      );

      res.json({
        success: true,
        data: result,
        message: 'Data feed processing initiated'
      });

    } catch (error: any) {
      logger.error('Error processing custodian data feed:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'DATA_FEED_PROCESSING_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/custodian-integration/connections/:connectionId/data-feeds
 * @desc Get data feed history for connection
 * @access Private
 */
router.get('/connections/:connectionId/data-feeds', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;
      const { feedType, status, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      // Implementation would query the database for feed history
      // This is a placeholder response
      res.json({
        success: true,
        data: {
          feeds: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error fetching data feed history:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'DATA_FEED_HISTORY_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/custodian-integration/connections/:connectionId/reconciliation
 * @desc Perform reconciliation with custodian data
 * @access Private
 */
router.post('/connections/:connectionId/reconciliation', 
  authMiddleware as any,
  validateRequest(reconciliationRequestSchema),
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      const reconciliationRequest: ReconciliationRequest = {
        custodianConnectionId: connectionId,
        ...req.body,
        asOfDate: new Date(req.body.asOfDate),
        tolerance: new (Decimal as any)(req.body.tolerance || 0.01)
      };

      logger.info('Performing custodian reconciliation', { 
        connectionId, 
        portfolioId: reconciliationRequest.portfolioId,
        reconciliationType: reconciliationRequest.reconciliationType,
        tenantId 
      });

      const result = await custodianIntegrationService.performReconciliation(
        connectionId, 
        reconciliationRequest
      );

      res.json({
        success: true,
        data: result,
        message: 'Reconciliation completed'
      });

    } catch (error: any) {
      logger.error('Error performing custodian reconciliation:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RECONCILIATION_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/custodian-integration/connections/:connectionId/reconciliations
 * @desc Get reconciliation history for connection
 * @access Private
 */
router.get('/connections/:connectionId/reconciliations', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;
      const { portfolioId, status, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      // Implementation would query the database for reconciliation history
      // This is a placeholder response
      res.json({
        success: true,
        data: {
          reconciliations: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error fetching reconciliation history:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RECONCILIATION_HISTORY_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/custodian-integration/connections/:connectionId/orders
 * @desc Submit orders to custodian
 * @access Private
 */
router.post('/connections/:connectionId/orders', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      const orderSubmissionRequest: OrderSubmissionRequest = {
        custodianConnectionId: connectionId,
        ...req.body
      };

      logger.info('Submitting orders to custodian', { 
        connectionId, 
        portfolioId: orderSubmissionRequest.portfolioId,
        orderCount: orderSubmissionRequest.orders.length,
        tenantId 
      });

      const result = await custodianIntegrationService.submitOrders(
        connectionId, 
        orderSubmissionRequest
      );

      res.json({
        success: true,
        data: result,
        message: 'Orders submitted to custodian'
      });

    } catch (error: any) {
      logger.error('Error submitting orders to custodian:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ORDER_SUBMISSION_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/custodian-integration/connections/:connectionId/documents
 * @desc Retrieve documents from custodian
 * @access Private
 */
router.post('/connections/:connectionId/documents', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      const documentRetrievalRequest: DocumentRetrievalRequest = {
        custodianConnectionId: connectionId,
        ...req.body
      };

      // Convert date strings to Date objects
      if (documentRetrievalRequest.dateFrom) {
        documentRetrievalRequest.dateFrom = new Date(documentRetrievalRequest.dateFrom);
      }
      if (documentRetrievalRequest.dateTo) {
        documentRetrievalRequest.dateTo = new Date(documentRetrievalRequest.dateTo);
      }

      logger.info('Retrieving documents from custodian', { 
        connectionId, 
        documentType: documentRetrievalRequest.documentType,
        tenantId 
      });

      const result = await custodianIntegrationService.retrieveDocuments(
        connectionId, 
        documentRetrievalRequest
      );

      res.json({
        success: true,
        data: result,
        message: 'Document retrieval initiated'
      });

    } catch (error: any) {
      logger.error('Error retrieving documents from custodian:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'DOCUMENT_RETRIEVAL_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/custodian-integration/connections/:connectionId/performance
 * @desc Get performance metrics for custodian connection
 * @access Private
 */
router.get('/connections/:connectionId/performance', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;
      const { dateFrom, dateTo, granularity = 'daily' } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      // Implementation would query performance metrics from database
      // This is a placeholder response
      res.json({
        success: true,
        data: {
          metrics: {
            uptimePercentage: 99.5,
            avgResponseTime: 1250,
            successRate: 98.7,
            errorRate: 1.3,
            dataQualityScore: 97.8,
            reconciliationAccuracy: 99.2
          },
          timeSeries: [],
          period: {
            from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: dateTo || new Date().toISOString(),
            granularity
          }
        }
      });

    } catch (error: any) {
      logger.error('Error fetching custodian performance metrics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'PERFORMANCE_METRICS_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/custodian-integration/connections/:connectionId/alerts
 * @desc Get alerts for custodian connection
 * @access Private
 */
router.get('/connections/:connectionId/alerts', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;
      const { severity, status, page = 1, limit = 50 } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      // Implementation would query alerts from database
      // This is a placeholder response
      res.json({
        success: true,
        data: {
          alerts: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error fetching custodian alerts:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ALERTS_FETCH_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/custodian-integration/connections/:connectionId/test
 * @desc Test custodian connection
 * @access Private
 */
router.post('/connections/:connectionId/test', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { connectionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      logger.info('Testing custodian connection', { connectionId, tenantId });

      // Implementation would test the connection
      // This is a placeholder response
      res.json({
        success: true,
        data: {
          testResults: [
            {
              testType: 'AUTHENTICATION',
              success: true,
              responseTime: 1200,
              details: {}
            },
            {
              testType: 'CONNECTIVITY',
              success: true,
              responseTime: 800,
              details: {}
            },
            {
              testType: 'DATA_RETRIEVAL',
              success: true,
              responseTime: 2500,
              details: { recordCount: 10 }
            }
          ],
          overallStatus: 'HEALTHY',
          timestamp: new Date().toISOString()
        },
        message: 'Connection test completed'
      });

    } catch (error: any) {
      logger.error('Error testing custodian connection:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CONNECTION_TEST_FAILED' 
      });
    }
  }
);

export default router;


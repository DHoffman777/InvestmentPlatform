import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { OrderManagementService } from '../services/orderManagementService';
import { } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  OrderType,
  OrderSide,
  TimeInForce,
  OrderStatus,
  OrderState,
  TradingSession,
  ExecutionVenueType
} from '../models/trading/OrderManagement';

const router = express.Router();
const prisma = new PrismaClient();
const kafkaService = getKafkaService();
const orderService = new OrderManagementService(prisma, kafkaService);

// Order Creation and Management Routes

// Create new order
router.post('/orders', async (req: any, res: any) => {
  try {
    const {
      portfolioId,
      securityId,
      orderType,
      orderSide,
      quantity,
      timeInForce,
      orderPrice,
      stopPrice,
      limitPrice,
      tradingSession,
      executionInstructions,
      routingInstructions,
      expirationDate,
      allocations,
      tags,
      customFields
    } = req.body;

    // Validation
    if (!portfolioId || !securityId || !orderType || !orderSide || !quantity || !timeInForce) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: portfolioId, securityId, orderType, orderSide, quantity, timeInForce'
      });
    }

    // Validate enum values
    const validOrderTypes = Object.values(OrderType);
    if (!validOrderTypes.includes(orderType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid order type. Must be one of: ${validOrderTypes.join(', ')}`
      });
    }

    const validOrderSides = Object.values(OrderSide);
    if (!validOrderSides.includes(orderSide)) {
      return res.status(400).json({
        success: false,
        error: `Invalid order side. Must be one of: ${validOrderSides.join(', ')}`
      });
    }

    const validTimeInForce = Object.values(TimeInForce);
    if (!validTimeInForce.includes(timeInForce)) {
      return res.status(400).json({
        success: false,
        error: `Invalid time in force. Must be one of: ${validTimeInForce.join(', ')}`
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }

    const order = await orderService.createOrder({
      portfolioId,
      securityId,
      orderType,
      orderSide,
      quantity,
      timeInForce,
      orderPrice,
      stopPrice,
      limitPrice,
      tradingSession,
      executionInstructions,
      routingInstructions,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      allocations,
      tags,
      customFields
    }, req.user!.tenantId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating order:', error);
    const statusCode = error instanceof Error && error.message.includes('validation failed') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Modify existing order
router.put('/orders/:orderId', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;
    const {
      quantity,
      orderPrice,
      stopPrice,
      limitPrice,
      timeInForce,
      expirationDate,
      executionInstructions,
      routingInstructions
    } = req.body;

    const order = await orderService.modifyOrder({
      orderId,
      quantity,
      orderPrice,
      stopPrice,
      limitPrice,
      timeInForce,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      executionInstructions,
      routingInstructions
    }, req.user!.tenantId, req.user!.userId);

    res.json({
      success: true,
      data: order,
      message: 'Order modified successfully'
    });
  } catch (error: any) {
    logger.error('Error modifying order:', error);
    const statusCode = error instanceof Error && 
      (error.message.includes('not found') ? 404 : 
       error.message.includes('cannot be modified') ? 409 : 500) || 500;
    res.status(statusCode as number).json({
      success: false,
      error: 'Failed to modify order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel order
router.delete('/orders/:orderId', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;
    const { cancelReason } = req.body;

    const order = await orderService.cancelOrder({
      orderId,
      cancelReason
    }, req.user!.tenantId, req.user!.userId);

    res.json({
      success: true,
      data: order,
      message: 'Order cancellation requested'
    });
  } catch (error: any) {
    logger.error('Error cancelling order:', error);
    const statusCode = error instanceof Error && 
      (error.message.includes('not found') ? 404 : 
       error.message.includes('cannot be cancelled') ? 409 : 500) || 500;
    res.status(statusCode as number).json({
      success: false,
      error: 'Failed to cancel order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get order by ID
router.get('/orders/:orderId', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    const order = await orderService.getOrderById(orderId, req.user!.tenantId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    logger.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search orders
router.get('/orders', async (req: any, res: any) => {
  try {
    const {
      portfolioIds,
      securityIds,
      orderTypes,
      orderStatuses,
      orderStates,
      fromDate,
      toDate,
      createdBy,
      tags,
      limit,
      offset
    } = req.query;

    const searchRequest = {
      portfolioIds: portfolioIds ? (portfolioIds as string).split(',') : undefined,
      securityIds: securityIds ? (securityIds as string).split(',') : undefined,
      orderTypes: orderTypes ? (orderTypes as string).split(',') as OrderType[] : undefined,
      orderStatuses: orderStatuses ? (orderStatuses as string).split(',') as OrderStatus[] : undefined,
      orderStates: orderStates ? (orderStates as string).split(',') as OrderState[] : undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      createdBy: createdBy as string,
      tags: tags ? (tags as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await orderService.searchOrders(searchRequest, req.user!.tenantId);

    res.json({
      success: true,
      data: result.orders,
      pagination: {
        total: result.total,
        limit: searchRequest.limit || 50,
        offset: searchRequest.offset || 0,
        hasMore: result.hasMore
      },
      searchCriteria: result.searchCriteria
    });
  } catch (error: any) {
    logger.error('Error searching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Order Execution Routes

// Record order execution
router.post('/orders/:orderId/executions', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;
    const {
      executionPrice,
      executionQuantity,
      executionVenue,
      executionVenueType,
      commission,
      regulatoryFees,
      exchangeFees,
      otherFees,
      contraParty
    } = req.body;

    // Validation
    if (!executionPrice || !executionQuantity || !executionVenue || !executionVenueType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: executionPrice, executionQuantity, executionVenue, executionVenueType'
      });
    }

    const validVenueTypes = Object.values(ExecutionVenueType);
    if (!validVenueTypes.includes(executionVenueType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid execution venue type. Must be one of: ${validVenueTypes.join(', ')}`
      });
    }

    if (executionPrice <= 0 || executionQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Execution price and quantity must be positive'
      });
    }

    const execution = await orderService.recordExecution(
      orderId,
      executionPrice,
      executionQuantity,
      executionVenue,
      executionVenueType,
      req.user!.tenantId,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: execution,
      message: 'Execution recorded successfully'
    });
  } catch (error: any) {
    logger.error('Error recording execution:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Failed to record execution',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get order executions
router.get('/orders/:orderId/executions', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    const executions = await prisma.orderExecution.findMany({
      where: {
        orderId,
        tenantId: req.user!.tenantId
      },
      orderBy: { executionTime: 'desc' }
    });

    res.json({
      success: true,
      data: executions,
      total: executions.length
    });
  } catch (error: any) {
    logger.error('Error fetching executions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch executions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Order Validation and Risk Management Routes

// Validate order before submission
router.post('/orders/validate', async (req: any, res: any) => {
  try {
    const {
      portfolioId,
      securityId,
      orderType,
      orderSide,
      quantity,
      timeInForce,
      orderPrice,
      stopPrice,
      limitPrice
    } = req.body;

    // Same validation as order creation
    if (!portfolioId || !securityId || !orderType || !orderSide || !quantity || !timeInForce) {
      return res.status(400).json({
        success: false,
        error: 'Missing required validation fields'
      });
    }

    const validation = await orderService.validateOrder({
      portfolioId,
      securityId,
      orderType,
      orderSide,
      quantity,
      timeInForce,
      orderPrice,
      stopPrice,
      limitPrice
    }, req.user!.tenantId);

    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    logger.error('Error validating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate best execution report
router.get('/orders/:orderId/best-execution-report', async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    const report = await orderService.generateBestExecutionReport(orderId, req.user!.tenantId);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Error generating best execution report:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Failed to generate best execution report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Order Management Dashboard Routes

// Get order statistics
router.get('/orders/statistics', async (req: any, res: any) => {
  try {
    const { portfolioId, fromDate, toDate } = req.query;

    const where: any = { tenantId: req.user!.tenantId };
    
    if (portfolioId) {
      where.portfolioId = portfolioId as string;
    }

    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate as string);
      if (toDate) where.orderDate.lte = new Date(toDate as string);
    }

    const [
      totalOrders,
      ordersByStatus,
      ordersByType,
      totalOrderValue,
      avgOrderSize
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['status' as any], // using status field name
        where,
        _count: { id: true }
      }),
      prisma.order.groupBy({
        by: ['orderType'],
        where,
        _count: { id: true }
      }),
      prisma.order.aggregate({
        where,
        _sum: { quantity: true }
      }),
      prisma.order.aggregate({
        where,
        _avg: { quantity: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus: ordersByStatus.map((group: any) => ({
          status: group.status,
          count: group._count?.id || 0
        })),
        ordersByType: ordersByType.map((group: any) => ({
          type: group.orderType,
          count: group._count?.id || 0
        })),
        totalOrderValue: totalOrderValue._sum.quantity?.toNumber() || 0,
        avgOrderSize: avgOrderSize._avg.quantity?.toNumber() || 0
      }
    });
  } catch (error: any) {
    logger.error('Error fetching order statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent orders for dashboard
router.get('/orders/recent', async (req: any, res: any) => {
  try {
    const { limit } = req.query;
    const orderLimit = limit ? parseInt(limit as string) : 10;

    const recentOrders = await prisma.order.findMany({
      where: { tenantId: req.user!.tenantId },
      include: {
        executions: {
          orderBy: { executionTime: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { orderDate: 'desc' },
        { createdAt: 'desc' }
      ],
      take: orderLimit
    });

    res.json({
      success: true,
      data: recentOrders
    });
  } catch (error: any) {
    logger.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reference Data Routes

// Get order management reference data
router.get('/reference-data', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      data: {
        orderTypes: Object.values(OrderType),
        orderSides: Object.values(OrderSide),
        timeInForce: Object.values(TimeInForce),
        orderStatuses: Object.values(OrderStatus),
        orderStates: Object.values(OrderState),
        tradingSessions: Object.values(TradingSession),
        executionVenueTypes: Object.values(ExecutionVenueType)
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

// Health check for order management
router.get('/health', async (req: any, res: any) => {
  try {
    // Basic health check - verify database connectivity
    const orderCount = await prisma.order.count();
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        totalOrders: orderCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Order management health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

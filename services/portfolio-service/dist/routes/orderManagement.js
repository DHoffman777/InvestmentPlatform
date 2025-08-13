"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const kafka_mock_1 = require("../utils/kafka-mock");
const orderManagementService_1 = require("../services/orderManagementService");
const logger_1 = require("../utils/logger");
const OrderManagement_1 = require("../models/trading/OrderManagement");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const orderService = new orderManagementService_1.OrderManagementService(prisma, kafkaService);
// Order Creation and Management Routes
// Create new order
router.post('/orders', async (req, res) => {
    try {
        const { portfolioId, instrumentId, orderType, orderSide, quantity, timeInForce, orderPrice, stopPrice, limitPrice, tradingSession, executionInstructions, routingInstructions, expirationDate, allocations, tags, customFields } = req.body;
        // Validation
        if (!portfolioId || !instrumentId || !orderType || !orderSide || !quantity || !timeInForce) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: portfolioId, instrumentId, orderType, orderSide, quantity, timeInForce'
            });
        }
        // Validate enum values
        const validOrderTypes = Object.values(OrderManagement_1.OrderType);
        if (!validOrderTypes.includes(orderType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid order type. Must be one of: ${validOrderTypes.join(', ')}`
            });
        }
        const validOrderSides = Object.values(OrderManagement_1.OrderSide);
        if (!validOrderSides.includes(orderSide)) {
            return res.status(400).json({
                success: false,
                error: `Invalid order side. Must be one of: ${validOrderSides.join(', ')}`
            });
        }
        const validTimeInForce = Object.values(OrderManagement_1.TimeInForce);
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
            instrumentId,
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
        }, req.user.tenantId, req.user.userId);
        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating order:', error);
        const statusCode = error instanceof Error && error.message.includes('validation failed') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to create order',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Modify existing order
router.put('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { quantity, orderPrice, stopPrice, limitPrice, timeInForce, expirationDate, executionInstructions, routingInstructions } = req.body;
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
        }, req.user.tenantId, req.user.userId);
        res.json({
            success: true,
            data: order,
            message: 'Order modified successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error modifying order:', error);
        const statusCode = error instanceof Error &&
            (error.message.includes('not found') ? 404 :
                error.message.includes('cannot be modified') ? 409 : 500);
        res.status(statusCode).json({
            success: false,
            error: 'Failed to modify order',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Cancel order
router.delete('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cancelReason } = req.body;
        const order = await orderService.cancelOrder({
            orderId,
            cancelReason
        }, req.user.tenantId, req.user.userId);
        res.json({
            success: true,
            data: order,
            message: 'Order cancellation requested'
        });
    }
    catch (error) {
        logger_1.logger.error('Error cancelling order:', error);
        const statusCode = error instanceof Error &&
            (error.message.includes('not found') ? 404 :
                error.message.includes('cannot be cancelled') ? 409 : 500);
        res.status(statusCode).json({
            success: false,
            error: 'Failed to cancel order',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get order by ID
router.get('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderService.getOrderById(orderId, req.user.tenantId);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Search orders
router.get('/orders', async (req, res) => {
    try {
        const { portfolioIds, instrumentIds, orderTypes, orderStatuses, orderStates, fromDate, toDate, createdBy, tags, limit, offset } = req.query;
        const searchRequest = {
            portfolioIds: portfolioIds ? portfolioIds.split(',') : undefined,
            instrumentIds: instrumentIds ? instrumentIds.split(',') : undefined,
            orderTypes: orderTypes ? orderTypes.split(',') : undefined,
            orderStatuses: orderStatuses ? orderStatuses.split(',') : undefined,
            orderStates: orderStates ? orderStates.split(',') : undefined,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined,
            createdBy: createdBy,
            tags: tags ? tags.split(',') : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        };
        const result = await orderService.searchOrders(searchRequest, req.user.tenantId);
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
    }
    catch (error) {
        logger_1.logger.error('Error searching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search orders',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Order Execution Routes
// Record order execution
router.post('/orders/:orderId/executions', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { executionPrice, executionQuantity, executionVenue, executionVenueType, commission, regulatoryFees, exchangeFees, otherFees, contraParty } = req.body;
        // Validation
        if (!executionPrice || !executionQuantity || !executionVenue || !executionVenueType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: executionPrice, executionQuantity, executionVenue, executionVenueType'
            });
        }
        const validVenueTypes = Object.values(OrderManagement_1.ExecutionVenueType);
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
        const execution = await orderService.recordExecution(orderId, executionPrice, executionQuantity, executionVenue, executionVenueType, req.user.tenantId, req.user.userId);
        res.status(201).json({
            success: true,
            data: execution,
            message: 'Execution recorded successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error recording execution:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to record execution',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get order executions
router.get('/orders/:orderId/executions', async (req, res) => {
    try {
        const { orderId } = req.params;
        const executions = await prisma.orderExecution.findMany({
            where: {
                orderId,
                tenantId: req.user.tenantId
            },
            orderBy: { executionTime: 'desc' }
        });
        res.json({
            success: true,
            data: executions,
            total: executions.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching executions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch executions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Order Validation and Risk Management Routes
// Validate order before submission
router.post('/orders/validate', async (req, res) => {
    try {
        const { portfolioId, instrumentId, orderType, orderSide, quantity, timeInForce, orderPrice, stopPrice, limitPrice } = req.body;
        // Same validation as order creation
        if (!portfolioId || !instrumentId || !orderType || !orderSide || !quantity || !timeInForce) {
            return res.status(400).json({
                success: false,
                error: 'Missing required validation fields'
            });
        }
        const validation = await orderService.validateOrder({
            portfolioId,
            instrumentId,
            orderType,
            orderSide,
            quantity,
            timeInForce,
            orderPrice,
            stopPrice,
            limitPrice
        }, req.user.tenantId);
        res.json({
            success: true,
            data: validation
        });
    }
    catch (error) {
        logger_1.logger.error('Error validating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate order',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Generate best execution report
router.get('/orders/:orderId/best-execution-report', async (req, res) => {
    try {
        const { orderId } = req.params;
        const report = await orderService.generateBestExecutionReport(orderId, req.user.tenantId);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating best execution report:', error);
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
router.get('/orders/statistics', async (req, res) => {
    try {
        const { portfolioId, fromDate, toDate } = req.query;
        const where = { tenantId: req.user.tenantId };
        if (portfolioId) {
            where.portfolioId = portfolioId;
        }
        if (fromDate || toDate) {
            where.orderDate = {};
            if (fromDate)
                where.orderDate.gte = new Date(fromDate);
            if (toDate)
                where.orderDate.lte = new Date(toDate);
        }
        const [totalOrders, ordersByStatus, ordersByType, totalOrderValue, avgOrderSize] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.groupBy({
                by: ['orderStatus'],
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
                ordersByStatus: ordersByStatus.map(group => ({
                    status: group.orderStatus,
                    count: group._count.id
                })),
                ordersByType: ordersByType.map(group => ({
                    type: group.orderType,
                    count: group._count.id
                })),
                totalOrderValue: totalOrderValue._sum.quantity || 0,
                avgOrderSize: avgOrderSize._avg.quantity || 0
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching order statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get recent orders for dashboard
router.get('/orders/recent', async (req, res) => {
    try {
        const { limit } = req.query;
        const orderLimit = limit ? parseInt(limit) : 10;
        const recentOrders = await prisma.order.findMany({
            where: { tenantId: req.user.tenantId },
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching recent orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent orders',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reference Data Routes
// Get order management reference data
router.get('/reference-data', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                orderTypes: Object.values(OrderManagement_1.OrderType),
                orderSides: Object.values(OrderManagement_1.OrderSide),
                timeInForce: Object.values(OrderManagement_1.TimeInForce),
                orderStatuses: Object.values(OrderManagement_1.OrderStatus),
                orderStates: Object.values(OrderManagement_1.OrderState),
                tradingSessions: Object.values(OrderManagement_1.TradingSession),
                executionVenueTypes: Object.values(OrderManagement_1.ExecutionVenueType)
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
// Health check for order management
router.get('/health', async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Order management health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Service unavailable',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

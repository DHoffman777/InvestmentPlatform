"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const kafka_mock_1 = require("./utils/kafka-mock");
const logger_1 = require("./utils/logger");
const prisma_1 = require("./utils/prisma");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const portfolios_1 = require("./routes/portfolios");
const positions_1 = require("./routes/positions");
const positionManagement_1 = require("./routes/positionManagement");
const transactions_1 = require("./routes/transactions");
const transactionManagement_1 = require("./routes/transactionManagement");
const performance_1 = require("./routes/performance");
const cashEquivalents_1 = __importDefault(require("./routes/cashEquivalents"));
const fixedIncome_1 = __importDefault(require("./routes/fixedIncome"));
const assetClassification_1 = __importDefault(require("./routes/assetClassification"));
const instrumentReferenceData_1 = __importDefault(require("./routes/instrumentReferenceData"));
const orderManagement_1 = __importDefault(require("./routes/orderManagement"));
const postTradeProcessing_1 = __importDefault(require("./routes/postTradeProcessing"));
const performanceMeasurement_1 = __importDefault(require("./routes/performanceMeasurement"));
const fixedIncomeAnalytics_1 = __importDefault(require("./routes/fixedIncomeAnalytics"));
const derivatives_1 = __importDefault(require("./routes/derivatives"));
const compliance_1 = __importDefault(require("./routes/compliance"));
const structuredProducts_1 = __importDefault(require("./routes/structuredProducts"));
const alternativeInvestments_1 = __importDefault(require("./routes/alternativeInvestments"));
const riskManagement_1 = __importDefault(require("./routes/riskManagement"));
const documentManagement_1 = __importDefault(require("./routes/documentManagement"));
const custodianIntegration_1 = __importDefault(require("./routes/custodianIntegration"));
const clientRelationship_1 = __importDefault(require("./routes/clientRelationship"));
const householdManagement_1 = __importDefault(require("./routes/householdManagement"));
const investmentObjectives_1 = __importDefault(require("./routes/investmentObjectives"));
const riskProfiling_1 = __importDefault(require("./routes/riskProfiling"));
const clientDocuments_1 = __importDefault(require("./routes/clientDocuments"));
const reporting_1 = __importDefault(require("./routes/reporting"));
const clientPortal_1 = __importDefault(require("./routes/clientPortal"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const metrics_1 = require("./middleware/metrics");
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 3002;
// Initialize shared Prisma Client
const prisma = (0, prisma_1.getPrismaClient)();
exports.prisma = prisma;
// Initialize Kafka Service
const kafkaService = (0, kafka_mock_1.getKafkaService)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Body parsing and compression
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Metrics middleware
app.use(metrics_1.metricsMiddleware);
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw `SELECT 1`;
        // Check Kafka connection
        const kafkaConnected = kafkaService.isConnected();
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'portfolio-service',
            database: 'connected',
            kafka: kafkaConnected ? 'connected' : 'disconnected',
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'portfolio-service',
            error: 'Service unavailable',
        });
    }
});
// Ready check endpoint
app.get('/ready', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'ready' });
    }
    catch (error) {
        res.status(503).json({ status: 'not ready' });
    }
});
// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    try {
        const register = (await Promise.resolve().then(() => __importStar(require('prom-client')))).register;
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    }
    catch (error) {
        logger_1.logger.error('Error serving metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// API routes with authentication
app.use('/api/portfolios', auth_1.authMiddleware, portfolios_1.portfolioRoutes);
app.use('/api/positions', auth_1.authMiddleware, positions_1.positionRoutes);
app.use('/api/position-management', auth_1.authMiddleware, positionManagement_1.positionManagementRouter);
app.use('/api/transactions', auth_1.authMiddleware, transactions_1.transactionRoutes);
app.use('/api/transaction-management', auth_1.authMiddleware, transactionManagement_1.transactionManagementRouter);
app.use('/api/performance', auth_1.authMiddleware, performance_1.performanceRoutes);
app.use('/api/cash-equivalents', auth_1.authMiddleware, cashEquivalents_1.default);
app.use('/api/fixed-income', auth_1.authMiddleware, fixedIncome_1.default);
app.use('/api/asset-classification', auth_1.authMiddleware, assetClassification_1.default);
app.use('/api/instrument-reference-data', auth_1.authMiddleware, instrumentReferenceData_1.default);
app.use('/api/order-management', auth_1.authMiddleware, orderManagement_1.default);
app.use('/api/post-trade-processing', auth_1.authMiddleware, postTradeProcessing_1.default);
app.use('/api/performance-measurement', auth_1.authMiddleware, performanceMeasurement_1.default);
app.use('/api/fixed-income-analytics', auth_1.authMiddleware, fixedIncomeAnalytics_1.default);
app.use('/api/derivatives', auth_1.authMiddleware, derivatives_1.default);
app.use('/api/compliance', auth_1.authMiddleware, compliance_1.default);
app.use('/api/structured-products', auth_1.authMiddleware, structuredProducts_1.default);
app.use('/api/alternative-investments', auth_1.authMiddleware, alternativeInvestments_1.default);
app.use('/api/risk-management', auth_1.authMiddleware, riskManagement_1.default);
app.use('/api/documents', auth_1.authMiddleware, documentManagement_1.default);
app.use('/api/custodian-integration', auth_1.authMiddleware, custodianIntegration_1.default);
app.use('/api/client-relationship', auth_1.authMiddleware, clientRelationship_1.default);
app.use('/api/household-management', auth_1.authMiddleware, householdManagement_1.default);
app.use('/api/investment-objectives', auth_1.authMiddleware, investmentObjectives_1.default);
app.use('/api/risk-profiling', auth_1.authMiddleware, riskProfiling_1.default);
app.use('/api/client-documents', auth_1.authMiddleware, clientDocuments_1.default);
app.use('/api/reporting', auth_1.authMiddleware, reporting_1.default);
app.use('/api/client-portal', auth_1.authMiddleware, clientPortal_1.default);
app.use('/api/analytics', auth_1.authMiddleware, analytics_1.default);
// Error handling middleware
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
    try {
        // Disconnect from Kafka
        await kafkaService.disconnect();
        logger_1.logger.info('Kafka disconnected');
        // Close database connections
        await (0, prisma_1.disconnectPrisma)();
        logger_1.logger.info('Database disconnected');
        logger_1.logger.info('Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};
// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
// Start server
const startServer = async () => {
    try {
        // Connect to Kafka
        await kafkaService.connect();
        logger_1.logger.info('Connected to Kafka');
        // Test database connection
        await prisma.$connect();
        logger_1.logger.info('Connected to database');
        // Start HTTP server
        app.listen(port, () => {
            logger_1.logger.info(`Portfolio service started on port ${port}`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`Health check available at http://localhost:${port}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();

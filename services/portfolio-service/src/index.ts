import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { getKafkaService } from './utils/kafka-mock';
import { logger } from './utils/logger';
import { getPrismaClient, disconnectPrisma } from './utils/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { portfolioRoutes } from './routes/portfolios';
import { positionRoutes } from './routes/positions';
import { positionManagementRouter } from './routes/positionManagement';
import { transactionRoutes } from './routes/transactions';
import { transactionManagementRouter } from './routes/transactionManagement';
import { performanceRoutes } from './routes/performance';
import cashEquivalentsRouter from './routes/cashEquivalents';
import fixedIncomeRouter from './routes/fixedIncome';
import assetClassificationRouter from './routes/assetClassification';
import instrumentReferenceDataRouter from './routes/instrumentReferenceData';
import orderManagementRouter from './routes/orderManagement';
import postTradeProcessingRouter from './routes/postTradeProcessing';
import performanceMeasurementRouter from './routes/performanceMeasurement';
import fixedIncomeAnalyticsRouter from './routes/fixedIncomeAnalytics';
import derivativesRouter from './routes/derivatives';
import complianceRouter from './routes/compliance';
import structuredProductsRouter from './routes/structuredProducts';
import alternativeInvestmentsRouter from './routes/alternativeInvestments';
import riskManagementRouter from './routes/riskManagement';
import documentManagementRouter from './routes/documentManagement';
import custodianIntegrationRouter from './routes/custodianIntegration';
import clientRelationshipRouter from './routes/clientRelationship';
import householdManagementRouter from './routes/householdManagement';
import investmentObjectivesRouter from './routes/investmentObjectives';
import riskProfilingRouter from './routes/riskProfiling';
import clientDocumentsRouter from './routes/clientDocuments';
import reportingRouter from './routes/reporting';
import clientPortalRouter from './routes/clientPortal';
import analyticsRouter from './routes/analytics';
import { metricsMiddleware } from './middleware/metrics';

const app = express();
const port = process.env.PORT || 3002;

// Initialize shared Prisma Client
const prisma = getPrismaClient();

// Initialize Kafka Service
const kafkaService = getKafkaService();

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
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
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware as any);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Kafka connection
    const kafkaConnected = kafkaService.isConnected();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'portfolio-service',
      database: 'connected',
      kafka: kafkaConnected ? 'connected' : 'disconnected',
    });
  } catch (error: any) {
    logger.error('Health check failed:', error);
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
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error: any) {
    res.status(503).json({ status: 'not ready' });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    const register = (await import('prom-client')).register;
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error: any) {
    logger.error('Error serving metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API routes with authentication
app.use('/api/portfolios', authMiddleware as any, portfolioRoutes);
app.use('/api/positions', authMiddleware as any, positionRoutes);
app.use('/api/position-management', authMiddleware as any, positionManagementRouter);
app.use('/api/transactions', authMiddleware as any, transactionRoutes);
app.use('/api/transaction-management', authMiddleware as any, transactionManagementRouter);
app.use('/api/performance', authMiddleware as any, performanceRoutes);
app.use('/api/cash-equivalents', authMiddleware as any, cashEquivalentsRouter);
app.use('/api/fixed-income', authMiddleware as any, fixedIncomeRouter);
app.use('/api/asset-classification', authMiddleware as any, assetClassificationRouter);
app.use('/api/instrument-reference-data', authMiddleware as any, instrumentReferenceDataRouter);
app.use('/api/order-management', authMiddleware as any, orderManagementRouter);
app.use('/api/post-trade-processing', authMiddleware as any, postTradeProcessingRouter);
app.use('/api/performance-measurement', authMiddleware as any, performanceMeasurementRouter);
app.use('/api/fixed-income-analytics', authMiddleware as any, fixedIncomeAnalyticsRouter);
app.use('/api/derivatives', authMiddleware as any, derivativesRouter);
app.use('/api/compliance', authMiddleware as any, complianceRouter);
app.use('/api/structured-products', authMiddleware as any, structuredProductsRouter);
app.use('/api/alternative-investments', authMiddleware as any, alternativeInvestmentsRouter);
app.use('/api/risk-management', authMiddleware as any, riskManagementRouter);
app.use('/api/documents', authMiddleware as any, documentManagementRouter);
app.use('/api/custodian-integration', authMiddleware as any, custodianIntegrationRouter);
app.use('/api/client-relationship', authMiddleware as any, clientRelationshipRouter);
app.use('/api/household-management', authMiddleware as any, householdManagementRouter);
app.use('/api/investment-objectives', authMiddleware as any, investmentObjectivesRouter);
app.use('/api/risk-profiling', authMiddleware as any, riskProfilingRouter);
app.use('/api/client-documents', authMiddleware as any, clientDocumentsRouter);
app.use('/api/reporting', authMiddleware as any, reportingRouter);
app.use('/api/client-portal', authMiddleware as any, clientPortalRouter);
app.use('/api/analytics', authMiddleware as any, analyticsRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Disconnect from Kafka
    await kafkaService.disconnect();
    logger.info('Kafka disconnected');
    
    // Close database connections
    await disconnectPrisma();
    logger.info('Database disconnected');
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async () => {
  try {
    // Connect to Kafka
    await kafkaService.connect();
    logger.info('Connected to Kafka');
    
    // Test database connection
    await prisma.$connect();
    logger.info('Connected to database');
    
    // Start HTTP server
    app.listen(port, () => {
      logger.info(`Portfolio service started on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check available at http://localhost:${port}/health`);
    });
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export for testing
export { app, prisma };

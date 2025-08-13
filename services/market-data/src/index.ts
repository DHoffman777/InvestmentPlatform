import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { logger } from './config/logger';
import { initializeRedis } from './config/redis';
import { prisma } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import { quotesRouter } from './routes/quotes';
import { historicalRouter } from './routes/historical';
import { securitiesRouter } from './routes/securities';
import { equitiesRouter } from './routes/equities';
import { fundsRouter } from './routes/funds';
import { reitsRouter } from './routes/reits';
import { cashRouter } from './routes/cash';
import { corporateActionsRouter } from './routes/corporateActions';
import { healthRouter } from './routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Request ID middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || 
    Math.random().toString(36).substring(2, 15);
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// Request logging
app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.headers['x-request-id'],
  });
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/historical', historicalRouter);
app.use('/api/securities', securitiesRouter);
app.use('/api/equities', equitiesRouter);
app.use('/api/funds', fundsRouter);
app.use('/api/reits', reitsRouter);
app.use('/api/cash', cashRouter);
app.use('/api/corporate-actions', corporateActionsRouter);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const { register } = await import('./middleware/metrics');
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'market-data-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      quotes: '/api/quotes',
      historical: '/api/historical',
      securities: '/api/securities',
      equities: '/api/equities',
      funds: '/api/funds',
      reits: '/api/reits',
      cash: '/api/cash',
      corporateActions: '/api/corporate-actions',
      metrics: '/metrics',
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connection
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }

  // Close Redis connection
  try {
    const { closeRedis } = await import('./config/redis');
    await closeRedis();
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }

  process.exit(0);
};

// Initialize server
const startServer = async () => {
  try {
    // Initialize Redis
    logger.info('Initializing Redis connection...');
    await initializeRedis();

    // Test database connection
    logger.info('Testing database connection...');
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Market Data Service started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        pid: process.pid,
      });
    });

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
const server = startServer();

export default app;
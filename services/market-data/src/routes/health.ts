import { Router } from 'express';
import { prisma } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const router = Router();

// GET /health - Basic health check
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'unhealthy';
      logger.error('Database health check failed:', error);
    }

    // Check Redis connection
    let redisStatus = 'healthy';
    let redisLatency = 0;
    try {
      const redisStart = Date.now();
      const redisClient = getRedisClient();
      await redisClient.ping();
      redisLatency = Date.now() - redisStart;
    } catch (error) {
      redisStatus = 'unhealthy';
      logger.warn('Redis health check failed:', error);
    }

    const totalLatency = Date.now() - startTime;

    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'market-data-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
        },
        redis: {
          status: redisStatus,
          latency: `${redisLatency}ms`,
        }
      },
      responseTime: `${totalLatency}ms`
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'market-data-service',
      error: 'Health check failed',
    });
  }
});

// GET /health/ready - Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'market-data-service',
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      service: 'market-data-service',
      error: 'Service not ready',
    });
  }
});

// GET /health/live - Liveness probe
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'market-data-service',
    uptime: process.uptime(),
  });
});

export { router as healthRouter };
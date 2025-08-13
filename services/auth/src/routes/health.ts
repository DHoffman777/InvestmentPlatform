import { Router, Request, Response } from 'express';
import { DatabaseService } from '../config/database';
import { CacheService } from '../config/redis';
import { logger } from '../config/logger';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthData);
});

router.get('/detailed', async (req: Request, res: Response) => {
  const checks = {
    database: false,
    cache: false,
    memory: false
  };

  let overallStatus = 'ok';

  try {
    // Database health check
    const db = DatabaseService.getInstance();
    await db.query('SELECT 1');
    checks.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    overallStatus = 'degraded';
  }

  try {
    // Cache health check
    const cache = CacheService.getInstance();
    await cache.set('health_check', 'ok', 5);
    const result = await cache.get('health_check');
    checks.cache = result === 'ok';
    if (!checks.cache) overallStatus = 'degraded';
  } catch (error) {
    logger.error('Cache health check failed:', error);
    overallStatus = 'degraded';
  }

  // Memory health check
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  checks.memory = memUsedMB < 500; // Flag if using more than 500MB

  if (!checks.memory) overallStatus = 'degraded';

  const healthData = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    system: {
      uptime: process.uptime(),
      memory: {
        used: memUsedMB,
        total: memTotalMB,
        percentage: Math.round((memUsedMB / memTotalMB) * 100)
      },
      cpu: process.cpuUsage()
    }
  };

  const statusCode = overallStatus === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthData);
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    const db = DatabaseService.getInstance();
    await db.query('SELECT 1');
    
    const cache = CacheService.getInstance();
    await cache.get('readiness_check');

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies not available'
    });
  }
});

router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;
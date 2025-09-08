import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}

import { logger } from '../config/logger';
export const requestLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    tenantId: req.headers['x-tenant-id'],
    correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id']
  });
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id']
    });
    return originalJson.call(this, body);
  };
  next();
};
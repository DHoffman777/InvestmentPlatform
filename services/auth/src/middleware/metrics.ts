import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}

import { register, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
// Collect default metrics
collectDefaultMetrics({ register });
// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  registers: [register]
});
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});
const authenticationAttempts = new Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status', 'tenant_id'],
  registers: [register]
});
const activeTokens = new Counter({
  name: 'active_tokens_total',
  help: 'Total number of active tokens',
  labelNames: ['type', 'tenant_id'],
  registers: [register]
});
export const metricsMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const route = req.route?.path || req.path;
  const tenantId = req.headers['x-tenant-id'] as string || 'unknown';
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
      tenant_id: tenantId
    });
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
        tenant_id: tenantId
      },
      duration
    );
    // Track authentication-specific metrics
    if (route.includes('/auth/')) {
      let authStatus = 'success';
      if (res.statusCode >= 400) {
        authStatus = res.statusCode === 401 ? 'failed' : 'error';
      }
      let authType = 'unknown';
      if (route.includes('/login')) authType = 'login';
      else if (route.includes('/register')) authType = 'register';
      else if (route.includes('/refresh')) authType = 'refresh';
      else if (route.includes('/logout')) authType = 'logout';
      authenticationAttempts.inc({
        type: authType,
        status: authStatus,
        tenant_id: tenantId
      });
    }
    // @ts-ignore: Type mismatch on Express res.end method signature
    return originalEnd.apply(res, args);
  };
  next();
};
export { register, authenticationAttempts, activeTokens };
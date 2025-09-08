import { Request as ExpressRequest, Response, NextFunction } from 'express';
import client from 'prom-client';
import { logger } from '../utils/logger';

// Extend Express Request type to include user property
interface Request extends ExpressRequest {
  user?: {
    sub: string;
    id: string;
    userId: string;
    clientId?: string;
    email: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
    iat: number;
    exp: number;
    sessionId?: string;
  };
}

// Initialize Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({
  register,
  prefix: 'portfolio_service_',
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'portfolio_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'portfolio_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Active connections gauge
const activeConnections = new client.Gauge({
  name: 'portfolio_service_active_connections',
  help: 'Number of active connections',
});

// Database query duration histogram
const dbQueryDuration = new client.Histogram({
  name: 'portfolio_service_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// Database connection pool gauge
const dbConnectionPool = new client.Gauge({
  name: 'portfolio_service_db_connection_pool_size',
  help: 'Current size of database connection pool',
  labelNames: ['state'], // 'active', 'idle', 'total'
});

// Portfolio operations counter
const portfolioOperations = new client.Counter({
  name: 'portfolio_service_portfolio_operations_total',
  help: 'Total number of portfolio operations',
  labelNames: ['operation', 'status'], // 'create', 'read', 'update', 'delete'
});

// Portfolio cache hit/miss counter
const portfolioCacheOperations = new client.Counter({
  name: 'portfolio_service_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'], // 'get', 'set', 'delete' and 'hit', 'miss', 'success', 'error'
});

// Kafka message counter
const kafkaMessages = new client.Counter({
  name: 'portfolio_service_kafka_messages_total',
  help: 'Total number of Kafka messages',
  labelNames: ['topic', 'operation', 'status'], // 'produce', 'consume' and 'success', 'error'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionPool);
register.registerMetric(portfolioOperations);
register.registerMetric(portfolioCacheOperations);
register.registerMetric(kafkaMessages);

// Export the register for the /metrics endpoint
export { register };

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();
  
  // Get route pattern for consistent labeling
  const route = req.route?.path || req.path;
  const method = req.method.toLowerCase();
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();
    
    // Record metrics
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);
      
    httpRequestsTotal
      .labels(method, route, statusCode)
      .inc();
    
    // Decrement active connections
    activeConnections.dec();
    
    // Log slow requests
    if (duration > 1) {
      logger.warn('Slow request detected', {
        method,
        route,
        statusCode,
        duration: `${duration.toFixed(3)}s`,
        userId: req.user?.sub,
        tenantId: req.user?.tenantId,
      });
    }
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Utility functions for custom metrics
export const trackPortfolioOperation = (operation: string, status: 'success' | 'error' = 'success') => {
  portfolioOperations.labels(operation, status).inc();
};

export const trackDbQuery = (operation: string, table: string, duration: number) => {
  dbQueryDuration.labels(operation, table).observe(duration);
};

export const trackCacheOperation = (operation: string, result: string) => {
  portfolioCacheOperations.labels(operation, result).inc();
};

export const trackKafkaMessage = (topic: string, operation: string, status: string) => {
  kafkaMessages.labels(topic, operation, status).inc();
};

export const updateDbConnectionPool = (active: number, idle: number, total: number) => {
  dbConnectionPool.labels('active').set(active);
  dbConnectionPool.labels('idle').set(idle);
  dbConnectionPool.labels('total').set(total);
};

// Custom metrics collection for business logic
export const collectPortfolioMetrics = async () => {
  try {
    // These would typically come from your database or cache
    // This is just an example of how you might collect custom metrics
    
    // Example: Total number of portfolios by status
    const portfolioStatusGauge = new client.Gauge({
      name: 'portfolio_service_portfolios_by_status',
      help: 'Number of portfolios by status',
      labelNames: ['status', 'tenant_id'],
    });
    
    register.registerMetric(portfolioStatusGauge);
    
    // Example: Average portfolio value
    const avgPortfolioValue = new client.Gauge({
      name: 'portfolio_service_average_portfolio_value',
      help: 'Average portfolio value across all portfolios',
      labelNames: ['tenant_id'],
    });
    
    register.registerMetric(avgPortfolioValue);
    
    logger.debug('Custom portfolio metrics collected');
  } catch (error: any) {
    logger.error('Error collecting portfolio metrics:', error);
  }
};

// Initialize metrics collection
setInterval(collectPortfolioMetrics, 60000); // Collect every minute

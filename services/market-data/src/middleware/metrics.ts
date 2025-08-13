import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { logger } from '../utils/logger';

// Initialize Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({
  register,
  prefix: 'market_data_service_',
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'market_data_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'market_data_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Active connections gauge
const activeConnections = new client.Gauge({
  name: 'market_data_service_active_connections',
  help: 'Number of active connections',
});

// Database query duration histogram
const dbQueryDuration = new client.Histogram({
  name: 'market_data_service_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// Market data operations counter
const marketDataOperations = new client.Counter({
  name: 'market_data_service_operations_total',
  help: 'Total number of market data operations',
  labelNames: ['operation', 'status'], // 'quote_fetch', 'historical_fetch', etc.
});

// Cache operations counter
const cacheOperations = new client.Counter({
  name: 'market_data_service_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'], // 'get', 'set', 'delete' and 'hit', 'miss', 'success', 'error'
});

// Data vendor API calls counter
const vendorApiCalls = new client.Counter({
  name: 'market_data_service_vendor_api_calls_total',
  help: 'Total number of vendor API calls',
  labelNames: ['vendor', 'endpoint', 'status'], // vendor name, endpoint, success/error
});

// Quote freshness gauge
const quoteFreshness = new client.Gauge({
  name: 'market_data_service_quote_freshness_seconds',
  help: 'Age of the most recent quote in seconds',
  labelNames: ['symbol', 'source'],
});

// Securities count gauge
const securitiesCount = new client.Gauge({
  name: 'market_data_service_securities_count',
  help: 'Total number of securities in the database',
  labelNames: ['asset_class'],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(dbQueryDuration);
register.registerMetric(marketDataOperations);
register.registerMetric(cacheOperations);
register.registerMetric(vendorApiCalls);
register.registerMetric(quoteFreshness);
register.registerMetric(securitiesCount);

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
        requestId: req.headers['x-request-id'],
      });
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Utility functions for custom metrics
export const trackMarketDataOperation = (operation: string, status: 'success' | 'error' = 'success') => {
  marketDataOperations.labels(operation, status).inc();
};

export const trackDbQuery = (operation: string, table: string, duration: number) => {
  dbQueryDuration.labels(operation, table).observe(duration);
};

export const trackCacheOperation = (operation: string, result: string) => {
  cacheOperations.labels(operation, result).inc();
};

export const trackVendorApiCall = (vendor: string, endpoint: string, status: string) => {
  vendorApiCalls.labels(vendor, endpoint, status).inc();
};

export const updateQuoteFreshness = (symbol: string, source: string, ageInSeconds: number) => {
  quoteFreshness.labels(symbol, source).set(ageInSeconds);
};

export const updateSecuritiesCount = (assetClass: string, count: number) => {
  securitiesCount.labels(assetClass).set(count);
};

// Custom metrics collection for business logic
export const collectMarketDataMetrics = async () => {
  try {
    // These would typically come from your database
    // This is just an example of how you might collect custom metrics
    
    logger.debug('Custom market data metrics collected');
  } catch (error) {
    logger.error('Error collecting market data metrics:', error);
  }
};

// Initialize metrics collection
setInterval(collectMarketDataMetrics, 60000); // Collect every minute
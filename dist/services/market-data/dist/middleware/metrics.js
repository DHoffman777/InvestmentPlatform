"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectMarketDataMetrics = exports.updateSecuritiesCount = exports.updateQuoteFreshness = exports.trackVendorApiCall = exports.trackCacheOperation = exports.trackDbQuery = exports.trackMarketDataOperation = exports.metricsMiddleware = exports.register = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const logger_1 = require("../utils/logger");
// Initialize Prometheus metrics
const register = new prom_client_1.default.Registry();
exports.register = register;
prom_client_1.default.collectDefaultMetrics({
    register,
    prefix: 'market_data_service_',
});
// HTTP request duration histogram
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'market_data_service_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
// HTTP request counter
const httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'market_data_service_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
// Active connections gauge
const activeConnections = new prom_client_1.default.Gauge({
    name: 'market_data_service_active_connections',
    help: 'Number of active connections',
});
// Database query duration histogram
const dbQueryDuration = new prom_client_1.default.Histogram({
    name: 'market_data_service_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});
// Market data operations counter
const marketDataOperations = new prom_client_1.default.Counter({
    name: 'market_data_service_operations_total',
    help: 'Total number of market data operations',
    labelNames: ['operation', 'status'], // 'quote_fetch', 'historical_fetch', etc.
});
// Cache operations counter
const cacheOperations = new prom_client_1.default.Counter({
    name: 'market_data_service_cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'result'], // 'get', 'set', 'delete' and 'hit', 'miss', 'success', 'error'
});
// Data vendor API calls counter
const vendorApiCalls = new prom_client_1.default.Counter({
    name: 'market_data_service_vendor_api_calls_total',
    help: 'Total number of vendor API calls',
    labelNames: ['vendor', 'endpoint', 'status'], // vendor name, endpoint, success/error
});
// Quote freshness gauge
const quoteFreshness = new prom_client_1.default.Gauge({
    name: 'market_data_service_quote_freshness_seconds',
    help: 'Age of the most recent quote in seconds',
    labelNames: ['symbol', 'source'],
});
// Securities count gauge
const securitiesCount = new prom_client_1.default.Gauge({
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
// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    // Increment active connections
    activeConnections.inc();
    // Get route pattern for consistent labeling
    const route = req.route?.path || req.path;
    const method = req.method.toLowerCase();
    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
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
            logger_1.logger.warn('Slow request detected', {
                method,
                route,
                statusCode,
                duration: `${duration.toFixed(3)}s`,
                requestId: req.headers['x-request-id'],
            });
        }
        // Call original end method
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.metricsMiddleware = metricsMiddleware;
// Utility functions for custom metrics
const trackMarketDataOperation = (operation, status = 'success') => {
    marketDataOperations.labels(operation, status).inc();
};
exports.trackMarketDataOperation = trackMarketDataOperation;
const trackDbQuery = (operation, table, duration) => {
    dbQueryDuration.labels(operation, table).observe(duration);
};
exports.trackDbQuery = trackDbQuery;
const trackCacheOperation = (operation, result) => {
    cacheOperations.labels(operation, result).inc();
};
exports.trackCacheOperation = trackCacheOperation;
const trackVendorApiCall = (vendor, endpoint, status) => {
    vendorApiCalls.labels(vendor, endpoint, status).inc();
};
exports.trackVendorApiCall = trackVendorApiCall;
const updateQuoteFreshness = (symbol, source, ageInSeconds) => {
    quoteFreshness.labels(symbol, source).set(ageInSeconds);
};
exports.updateQuoteFreshness = updateQuoteFreshness;
const updateSecuritiesCount = (assetClass, count) => {
    securitiesCount.labels(assetClass).set(count);
};
exports.updateSecuritiesCount = updateSecuritiesCount;
// Custom metrics collection for business logic
const collectMarketDataMetrics = async () => {
    try {
        // These would typically come from your database
        // This is just an example of how you might collect custom metrics
        logger_1.logger.debug('Custom market data metrics collected');
    }
    catch (error) {
        logger_1.logger.error('Error collecting market data metrics:', error);
    }
};
exports.collectMarketDataMetrics = collectMarketDataMetrics;
// Initialize metrics collection
setInterval(exports.collectMarketDataMetrics, 60000); // Collect every minute

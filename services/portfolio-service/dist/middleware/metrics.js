"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectPortfolioMetrics = exports.updateDbConnectionPool = exports.trackKafkaMessage = exports.trackCacheOperation = exports.trackDbQuery = exports.trackPortfolioOperation = exports.metricsMiddleware = exports.register = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const logger_1 = require("../utils/logger");
// Initialize Prometheus metrics
const register = new prom_client_1.default.Registry();
exports.register = register;
prom_client_1.default.collectDefaultMetrics({
    register,
    prefix: 'portfolio_service_',
});
// HTTP request duration histogram
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'portfolio_service_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
// HTTP request counter
const httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'portfolio_service_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
// Active connections gauge
const activeConnections = new prom_client_1.default.Gauge({
    name: 'portfolio_service_active_connections',
    help: 'Number of active connections',
});
// Database query duration histogram
const dbQueryDuration = new prom_client_1.default.Histogram({
    name: 'portfolio_service_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});
// Database connection pool gauge
const dbConnectionPool = new prom_client_1.default.Gauge({
    name: 'portfolio_service_db_connection_pool_size',
    help: 'Current size of database connection pool',
    labelNames: ['state'], // 'active', 'idle', 'total'
});
// Portfolio operations counter
const portfolioOperations = new prom_client_1.default.Counter({
    name: 'portfolio_service_portfolio_operations_total',
    help: 'Total number of portfolio operations',
    labelNames: ['operation', 'status'], // 'create', 'read', 'update', 'delete'
});
// Portfolio cache hit/miss counter
const portfolioCacheOperations = new prom_client_1.default.Counter({
    name: 'portfolio_service_cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'result'], // 'get', 'set', 'delete' and 'hit', 'miss', 'success', 'error'
});
// Kafka message counter
const kafkaMessages = new prom_client_1.default.Counter({
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
                userId: req.user?.sub,
                tenantId: req.user?.tenantId,
            });
        }
        // Call original end method
        originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.metricsMiddleware = metricsMiddleware;
// Utility functions for custom metrics
const trackPortfolioOperation = (operation, status = 'success') => {
    portfolioOperations.labels(operation, status).inc();
};
exports.trackPortfolioOperation = trackPortfolioOperation;
const trackDbQuery = (operation, table, duration) => {
    dbQueryDuration.labels(operation, table).observe(duration);
};
exports.trackDbQuery = trackDbQuery;
const trackCacheOperation = (operation, result) => {
    portfolioCacheOperations.labels(operation, result).inc();
};
exports.trackCacheOperation = trackCacheOperation;
const trackKafkaMessage = (topic, operation, status) => {
    kafkaMessages.labels(topic, operation, status).inc();
};
exports.trackKafkaMessage = trackKafkaMessage;
const updateDbConnectionPool = (active, idle, total) => {
    dbConnectionPool.labels('active').set(active);
    dbConnectionPool.labels('idle').set(idle);
    dbConnectionPool.labels('total').set(total);
};
exports.updateDbConnectionPool = updateDbConnectionPool;
// Custom metrics collection for business logic
const collectPortfolioMetrics = async () => {
    try {
        // These would typically come from your database or cache
        // This is just an example of how you might collect custom metrics
        // Example: Total number of portfolios by status
        const portfolioStatusGauge = new prom_client_1.default.Gauge({
            name: 'portfolio_service_portfolios_by_status',
            help: 'Number of portfolios by status',
            labelNames: ['status', 'tenant_id'],
        });
        register.registerMetric(portfolioStatusGauge);
        // Example: Average portfolio value
        const avgPortfolioValue = new prom_client_1.default.Gauge({
            name: 'portfolio_service_average_portfolio_value',
            help: 'Average portfolio value across all portfolios',
            labelNames: ['tenant_id'],
        });
        register.registerMetric(avgPortfolioValue);
        logger_1.logger.debug('Custom portfolio metrics collected');
    }
    catch (error) {
        logger_1.logger.error('Error collecting portfolio metrics:', error);
    }
};
exports.collectPortfolioMetrics = collectPortfolioMetrics;
// Initialize metrics collection
setInterval(exports.collectPortfolioMetrics, 60000); // Collect every minute

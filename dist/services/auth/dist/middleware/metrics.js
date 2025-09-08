"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeTokens = exports.authenticationAttempts = exports.register = exports.metricsMiddleware = void 0;
const prom_client_1 = require("prom-client");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return prom_client_1.register; } });
// Collect default metrics
(0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
// Custom metrics
const httpRequestsTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'tenant_id'],
    registers: [prom_client_1.register]
});
const httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'tenant_id'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [prom_client_1.register]
});
const authenticationAttempts = new prom_client_1.Counter({
    name: 'authentication_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['type', 'status', 'tenant_id'],
    registers: [prom_client_1.register]
});
exports.authenticationAttempts = authenticationAttempts;
const activeTokens = new prom_client_1.Counter({
    name: 'active_tokens_total',
    help: 'Total number of active tokens',
    labelNames: ['type', 'tenant_id'],
    registers: [prom_client_1.register]
});
exports.activeTokens = activeTokens;
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    const route = req.route?.path || req.path;
    const tenantId = req.headers['x-tenant-id'] || 'unknown';
    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function (...args) {
        const duration = (Date.now() - start) / 1000;
        httpRequestsTotal.inc({
            method: req.method,
            route,
            status_code: res.statusCode.toString(),
            tenant_id: tenantId
        });
        httpRequestDuration.observe({
            method: req.method,
            route,
            status_code: res.statusCode.toString(),
            tenant_id: tenantId
        }, duration);
        // Track authentication-specific metrics
        if (route.includes('/auth/')) {
            let authStatus = 'success';
            if (res.statusCode >= 400) {
                authStatus = res.statusCode === 401 ? 'failed' : 'error';
            }
            let authType = 'unknown';
            if (route.includes('/login'))
                authType = 'login';
            else if (route.includes('/register'))
                authType = 'register';
            else if (route.includes('/refresh'))
                authType = 'refresh';
            else if (route.includes('/logout'))
                authType = 'logout';
            authenticationAttempts.inc({
                type: authType,
                status: authStatus,
                tenant_id: tenantId
            });
        }
        return originalEnd.apply(this, args);
    };
    next();
};
exports.metricsMiddleware = metricsMiddleware;

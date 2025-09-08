"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../config/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    logger_1.logger.info('Request started', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tenantId: req.headers['x-tenant-id'],
        correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id']
    });
    // Override res.json to log response
    const originalJson = res.json;
    res.json = function (body) {
        const duration = Date.now() - start;
        logger_1.logger.info('Request completed', {
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
exports.requestLogger = requestLogger;

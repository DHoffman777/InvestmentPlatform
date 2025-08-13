"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let details = null;
    // Handle Prisma errors
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                statusCode = 409;
                message = 'Unique constraint failed';
                details = `Duplicate value for field: ${error.meta?.target}`;
                break;
            case 'P2014':
                statusCode = 400;
                message = 'Invalid ID';
                details = 'The provided ID is invalid';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Foreign key constraint failed';
                details = 'Referenced record does not exist';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found';
                details = 'The requested record does not exist';
                break;
            case 'P2021':
                statusCode = 404;
                message = 'Table not found';
                details = 'The requested table does not exist';
                break;
            case 'P2022':
                statusCode = 404;
                message = 'Column not found';
                details = 'The requested column does not exist';
                break;
            default:
                statusCode = 500;
                message = 'Database error';
                details = error.message;
        }
    }
    // Handle Prisma validation errors
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Validation error';
        details = 'Invalid data provided';
    }
    // Handle Prisma initialization errors
    else if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        statusCode = 503;
        message = 'Database connection error';
        details = 'Unable to connect to database';
    }
    // Handle custom errors
    else if (error instanceof Error && 'statusCode' in error) {
        statusCode = error.statusCode || 500;
        message = error.message;
    }
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        details = 'Authentication failed';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        details = 'Please log in again';
    }
    // Handle validation errors
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        details = error.message;
    }
    // Handle generic errors
    else if (error instanceof Error) {
        message = error.message;
    }
    // Log the error
    logger_1.logger.error('Request error', {
        error: error.message,
        stack: error.stack,
        statusCode,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        userId: req.user?.sub,
        tenantId: req.user?.tenantId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    // Send error response
    const errorResponse = {
        error: message,
        statusCode,
    };
    if (details) {
        errorResponse.details = details;
    }
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
        errorResponse.stack = error.stack;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    const message = `Route ${req.method} ${req.path} not found`;
    logger_1.logger.warn('Route not found', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    res.status(404).json({
        error: 'Not Found',
        message,
        statusCode: 404,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../config/logger");
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message || 'Unknown error';
    // Log error
    logger_1.logger.error('Error occurred:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    // Default error values
    let statusCode = error.statusCode || 500;
    let message = error instanceof Error ? error.message : 'Internal Server Error';
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Resource not found';
    }
    // Mongoose duplicate key
    if (err.name === 'MongoError' && err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(err.errors).map((val) => val.message);
        message = `Validation Error: ${errors.join(', ')}`;
    }
    // PostgreSQL errors
    if (err.name === 'PostgresError' || err.code) {
        const code = err.code;
        switch (code) {
            case '23505': // unique violation
                statusCode = 400;
                message = 'Duplicate entry';
                break;
            case '23503': // foreign key violation
                statusCode = 400;
                message = 'Referenced record does not exist';
                break;
            case '23502': // not null violation
                statusCode = 400;
                message = 'Required field is missing';
                break;
            case '42P01': // undefined table
                statusCode = 500;
                message = 'Database configuration error';
                break;
            default:
                statusCode = 500;
                message = 'Database error occurred';
        }
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Rate limiting errors
    if (err.message && err.message.includes('Too many requests')) {
        statusCode = 429;
        message = 'Too many requests, please try again later';
    }
    res.status(statusCode).json({
        success: false,
        error: statusCode >= 500 ? 'Internal Server Error' : message,
        message: statusCode >= 500 ? 'Something went wrong' : message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error
        }),
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
};
exports.errorHandler = errorHandler;

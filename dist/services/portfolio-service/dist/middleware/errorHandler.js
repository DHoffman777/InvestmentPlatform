"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    // Log the error
    logger_1.logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.sub,
        tenantId: req.user?.tenantId,
    });
    // Handle Prisma errors
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2000':
                statusCode = 400;
                message = 'The provided value for the column is too long for the column type';
                code = 'VALUE_TOO_LONG';
                break;
            case 'P2001':
                statusCode = 404;
                message = 'The record searched for in the where condition does not exist';
                code = 'RECORD_NOT_FOUND';
                break;
            case 'P2002':
                statusCode = 409;
                message = 'Unique constraint failed on the fields';
                code = 'UNIQUE_CONSTRAINT_FAILED';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Foreign key constraint failed';
                code = 'FOREIGN_KEY_CONSTRAINT_FAILED';
                break;
            case 'P2004':
                statusCode = 400;
                message = 'A constraint failed on the database';
                code = 'CONSTRAINT_FAILED';
                break;
            case 'P2005':
                statusCode = 400;
                message = 'The value stored in the database for the field is invalid';
                code = 'INVALID_VALUE';
                break;
            case 'P2006':
                statusCode = 400;
                message = 'The provided value is not valid';
                code = 'INVALID_VALUE';
                break;
            case 'P2007':
                statusCode = 400;
                message = 'Data validation error';
                code = 'VALIDATION_ERROR';
                break;
            case 'P2008':
                statusCode = 400;
                message = 'Failed to parse the query';
                code = 'QUERY_PARSE_ERROR';
                break;
            case 'P2009':
                statusCode = 400;
                message = 'Failed to validate the query';
                code = 'QUERY_VALIDATION_ERROR';
                break;
            case 'P2010':
                statusCode = 500;
                message = 'Raw query failed';
                code = 'RAW_QUERY_FAILED';
                break;
            case 'P2011':
                statusCode = 400;
                message = 'Null constraint violation';
                code = 'NULL_CONSTRAINT_VIOLATION';
                break;
            case 'P2012':
                statusCode = 400;
                message = 'Missing a required value';
                code = 'MISSING_REQUIRED_VALUE';
                break;
            case 'P2013':
                statusCode = 400;
                message = 'Missing the required argument';
                code = 'MISSING_REQUIRED_ARGUMENT';
                break;
            case 'P2014':
                statusCode = 400;
                message = 'The change you are trying to make would violate the required relation';
                code = 'RELATION_VIOLATION';
                break;
            case 'P2015':
                statusCode = 404;
                message = 'A related record could not be found';
                code = 'RELATED_RECORD_NOT_FOUND';
                break;
            case 'P2016':
                statusCode = 400;
                message = 'Query interpretation error';
                code = 'QUERY_INTERPRETATION_ERROR';
                break;
            case 'P2017':
                statusCode = 400;
                message = 'The records for relation are not connected';
                code = 'RECORDS_NOT_CONNECTED';
                break;
            case 'P2018':
                statusCode = 404;
                message = 'The required connected records were not found';
                code = 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND';
                break;
            case 'P2019':
                statusCode = 400;
                message = 'Input error';
                code = 'INPUT_ERROR';
                break;
            case 'P2020':
                statusCode = 400;
                message = 'Value out of range for the type';
                code = 'VALUE_OUT_OF_RANGE';
                break;
            case 'P2021':
                statusCode = 404;
                message = 'The table does not exist in the current database';
                code = 'TABLE_NOT_EXISTS';
                break;
            case 'P2022':
                statusCode = 404;
                message = 'The column does not exist in the current database';
                code = 'COLUMN_NOT_EXISTS';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'An operation failed because it depends on one or more records that were required but not found';
                code = 'RECORD_NOT_FOUND';
                break;
            default:
                statusCode = 500;
                message = 'Database error occurred';
                code = 'DATABASE_ERROR';
        }
    }
    // Handle Prisma Client Initialization errors
    else if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        statusCode = 503;
        message = 'Database connection failed';
        code = 'DATABASE_CONNECTION_FAILED';
    }
    // Handle Prisma Client Request errors
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        statusCode = 500;
        message = 'Database request failed';
        code = 'DATABASE_REQUEST_FAILED';
    }
    // Handle Prisma Client Validation errors
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Invalid query parameters';
        code = 'INVALID_QUERY_PARAMETERS';
    }
    // Handle custom errors
    else if (error instanceof Error && 'statusCode' in error) {
        statusCode = error.statusCode || 500;
        message = error.message;
        code = error.code || 'CUSTOM_ERROR';
    }
    // Handle validation errors
    else if (error instanceof Error && error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
    }
    // Handle JWT errors
    else if (error instanceof Error && error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }
    else if (error instanceof Error && error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    // Handle generic errors
    else if (error instanceof Error) {
        message = error.message;
        // Check for specific error messages to determine status code
        if (message.includes('not found') || message.includes('does not exist')) {
            statusCode = 404;
            code = 'NOT_FOUND';
        }
        else if (message.includes('unauthorized') || message.includes('access denied')) {
            statusCode = 403;
            code = 'ACCESS_DENIED';
        }
        else if (message.includes('invalid') || message.includes('bad request')) {
            statusCode = 400;
            code = 'BAD_REQUEST';
        }
    }
    // Don't expose sensitive error information in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error';
    }
    res.status(statusCode).json({
        error: message,
        code,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? {
                prismaCode: error.code,
                meta: error.meta
            } : undefined
        })
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    logger_1.logger.warn('Route not found:', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    res.status(404).json({
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        message: `The requested route ${req.method} ${req.originalUrl} was not found on this server`,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    });
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;

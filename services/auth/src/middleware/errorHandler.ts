import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values((err as any).errors).map((val: any) => val.message);
    message = `Validation Error: ${errors.join(', ')}`;
  }

  // PostgreSQL errors
  if (err.name === 'PostgresError' || (err as any).code) {
    const code = (err as any).code;
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
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError | Prisma.PrismaClientKnownRequestError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = null;

  // Handle Prisma errors
  if ((error as any) instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Unique constraint failed';
        details = `Duplicate value for field: ${prismaError.meta?.target}`;
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
  else if ((error as any) instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Validation error';
    details = 'Invalid data provided';
  }
  // Handle Prisma initialization errors
  else if ((error as any) instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection error';
    details = 'Unable to connect to database';
  }
  // Handle custom errors
  else if ((error as any) instanceof Error && 'statusCode' in error) {
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
  else if ((error as any) instanceof Error) {
    message = error.message;
  }

  // Log the error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    userId: (req as any).user?.sub,
    tenantId: req.user?.tenantId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  const errorResponse: any = {
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

export const notFoundHandler = (req: Request, res: Response) => {
  const message = `Route ${req.method} ${req.path} not found`;
  
  logger.warn('Route not found', {
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

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom validation schema interface
interface ValidationRule {
  required?: boolean;
  type?: string;
  enum?: string[];
  format?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  message?: string;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Date-time validation regex (ISO 8601)
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

/**
 * Validates a value against a validation rule
 */
function validateValue(value: any, rule: ValidationRule, fieldName: string): string | null {
  // Check if required field is missing
  if (rule.required && (value === undefined || value === null || value === '')) {
    return rule.message || `${fieldName} is required`;
  }

  // If value is not provided and not required, skip validation
  if (value === undefined || value === null) {
    return null;
  }

  // Type validation
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return rule.message || `${fieldName} must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return rule.message || `${fieldName} must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return rule.message || `${fieldName} must be a boolean`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return rule.message || `${fieldName} must be an object`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return rule.message || `${fieldName} must be an array`;
        }
        break;
    }
  }

  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    return rule.message || `${fieldName} must be one of: ${rule.enum.join(', ')}`;
  }

  // Format validation
  if (rule.format) {
    switch (rule.format) {
      case 'email':
        if (typeof value === 'string' && !EMAIL_REGEX.test(value)) {
          return rule.message || `${fieldName} must be a valid email address`;
        }
        break;
      case 'date-time':
        if (typeof value === 'string' && !DATETIME_REGEX.test(value)) {
          return rule.message || `${fieldName} must be a valid ISO 8601 date-time string`;
        }
        break;
    }
  }

  // String length validation
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return rule.message || `${fieldName} must be at least ${rule.minLength} characters long`;
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return rule.message || `${fieldName} must be no more than ${rule.maxLength} characters long`;
    }
  }

  // Number range validation
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return rule.message || `${fieldName} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return rule.message || `${fieldName} must be no more than ${rule.max}`;
    }
  }

  return null;
}

/**
 * Validates request body against a schema
 */
function validateRequestBody(body: any, schema: ValidationSchema): string[] {
  const errors: string[] = [];

  // Check each field in the schema
  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = body[fieldName];
    const error = validateValue(value, rule, fieldName);
    if (error) {
      errors.push(error);
    }
  }

  // Check for unexpected fields (optional - can be disabled)
  const allowedFields = Object.keys(schema);
  const bodyFields = Object.keys(body || {});
  const unexpectedFields = bodyFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    logger.warn('Unexpected fields in request body:', unexpectedFields);
    // Uncomment the line below if you want to reject requests with unexpected fields
    // errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
  }

  return errors;
}

/**
 * Express middleware factory for request validation
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validateRequestBody(req.body, schema);

      if (errors.length > 0) {
        logger.warn('Request validation failed:', {
          url: req.url,
          method: req.method,
          errors,
          body: req.body
        });

        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }

      next();
    } catch (error) {
      logger.error('Error in validation middleware:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
}

/**
 * Middleware for validating query parameters
 */
export function validateQuery(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validateRequestBody(req.query, schema);

      if (errors.length > 0) {
        logger.warn('Query validation failed:', {
          url: req.url,
          method: req.method,
          errors,
          query: req.query
        });

        return res.status(400).json({
          error: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          details: errors
        });
      }

      next();
    } catch (error) {
      logger.error('Error in query validation middleware:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'QUERY_VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
}

/**
 * Middleware for validating URL parameters
 */
export function validateParams(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validateRequestBody(req.params, schema);

      if (errors.length > 0) {
        logger.warn('Params validation failed:', {
          url: req.url,
          method: req.method,
          errors,
          params: req.params
        });

        return res.status(400).json({
          error: 'URL parameter validation failed',
          code: 'PARAMS_VALIDATION_ERROR',
          details: errors
        });
      }

      next();
    } catch (error) {
      logger.error('Error in params validation middleware:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'PARAMS_VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
}

export default validateRequest;
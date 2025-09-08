const expressValidator = require('express-validator');
const validationResult = expressValidator.validationResult;
type ValidationChain = any;
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed:', {
        path: req.path,
        errors: errors.array(),
        body: req.body
      });
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid request data',
        details: errors.array().map((error: any) => ({
          field: error.type === 'field' ? error.path : 'unknown',
          message: error.msg,
          value: error.type === 'field' ? error.value : undefined
        }))
      });
      return;
    }
    next();
  };
};


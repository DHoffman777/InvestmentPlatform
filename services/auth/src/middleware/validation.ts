import { Request, Response, NextFunction } from 'express';
const expressValidator = require('express-validator');
const { validationResult } = expressValidator;
type ValidationChain = any;
import { logger } from '../config/logger';

export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
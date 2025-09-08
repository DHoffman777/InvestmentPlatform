import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}

import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
export declare const validateRequest: (validations: ValidationChain[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;


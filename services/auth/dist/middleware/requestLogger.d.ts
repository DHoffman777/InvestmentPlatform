import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}

import { Request, Response, NextFunction } from 'express';
export declare const requestLogger: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

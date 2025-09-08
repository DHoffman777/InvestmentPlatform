import { ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    tenantId?: string;
}
export declare const validateRequest: (validations: ValidationChain[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
export {};

import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    tenantId?: string;
}
export declare const requestLogger: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export {};

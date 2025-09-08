import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    tenantId?: string;
}
import { JWTPayload } from '@investment-platform/types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload & {
                sessionId?: string;
            };
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const requirePermissions: (permissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireRoles: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export {};

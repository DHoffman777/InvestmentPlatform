import { Request, Response, NextFunction } from 'express';
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
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermissions: (permissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRoles: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;

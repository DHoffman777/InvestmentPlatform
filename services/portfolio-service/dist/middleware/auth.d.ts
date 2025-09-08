import { Request, Response, NextFunction } from 'express';
interface JWTPayload {
    sub: string;
    id: string;
    userId: string;
    clientId?: string;
    email: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
    iat: number;
    exp: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireRole: (requiredRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requirePermission: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireTenantAccess: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}
export {};

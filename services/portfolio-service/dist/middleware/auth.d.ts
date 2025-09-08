import { Request as ExpressRequest, Response, NextFunction } from 'express';
interface LocalJWTPayload {
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
    sessionId?: string;
}
interface Request extends ExpressRequest {
    user?: LocalJWTPayload;
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireRole: (requiredRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requirePermission: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireTenantAccess: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};

import { Request, Response, NextFunction } from 'express';
export declare const authenticateJWT: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requirePermission: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireTenantAccess: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;

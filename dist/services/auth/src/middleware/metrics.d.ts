import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    tenantId?: string;
}
import { register, Counter } from 'prom-client';
declare const authenticationAttempts: Counter<"status" | "type" | "tenant_id">;
declare const activeTokens: Counter<"type" | "tenant_id">;
export declare const metricsMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export { register, authenticationAttempts, activeTokens };

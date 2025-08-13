import { Request, Response, NextFunction } from 'express';
import { register, Counter } from 'prom-client';
declare const authenticationAttempts: Counter<"type" | "status" | "tenant_id">;
declare const activeTokens: Counter<"type" | "tenant_id">;
export declare const metricsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export { register, authenticationAttempts, activeTokens };

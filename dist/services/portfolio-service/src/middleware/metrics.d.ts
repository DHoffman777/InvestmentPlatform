import { Request as ExpressRequest, Response, NextFunction } from 'express';
import client from 'prom-client';
interface Request extends ExpressRequest {
    user?: {
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
    };
}
declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export { register };
export declare const metricsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const trackPortfolioOperation: (operation: string, status?: "success" | "error") => void;
export declare const trackDbQuery: (operation: string, table: string, duration: number) => void;
export declare const trackCacheOperation: (operation: string, result: string) => void;
export declare const trackKafkaMessage: (topic: string, operation: string, status: string) => void;
export declare const updateDbConnectionPool: (active: number, idle: number, total: number) => void;
export declare const collectPortfolioMetrics: () => Promise<void>;

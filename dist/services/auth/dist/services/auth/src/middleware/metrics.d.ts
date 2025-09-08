export const __esModule: boolean;
export const register: prom_client_1.Registry<"text/plain; version=0.0.4; charset=utf-8">;
import prom_client_1 = require("prom-client");
export const authenticationAttempts: prom_client_1.Counter<"type" | "status" | "tenant_id">;
export const activeTokens: prom_client_1.Counter<"type" | "tenant_id">;
export function metricsMiddleware(req: any, res: any, next: any): void;

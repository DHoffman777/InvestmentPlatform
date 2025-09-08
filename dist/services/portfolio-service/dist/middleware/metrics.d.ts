export const __esModule: boolean;
export const register: any;
export function metricsMiddleware(req: any, res: any, next: any): void;
export function trackPortfolioOperation(operation: any, status?: string): void;
export function trackDbQuery(operation: any, table: any, duration: any): void;
export function trackCacheOperation(operation: any, result: any): void;
export function trackKafkaMessage(topic: any, operation: any, status: any): void;
export function updateDbConnectionPool(active: any, idle: any, total: any): void;
export function collectPortfolioMetrics(): Promise<void>;

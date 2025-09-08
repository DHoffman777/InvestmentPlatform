export const __esModule: boolean;
export function initializeRedis(): Promise<any>;
export function getRedisClient(): any;
export function closeRedis(): Promise<void>;
export function cacheGet(key: any): Promise<any>;
export function cacheSet(key: any, value: any, ttlSeconds: any): Promise<boolean>;
export function cacheDelete(key: any): Promise<boolean>;
export function cacheGetJSON(key: any): Promise<any>;
export function cacheSetJSON(key: any, value: any, ttlSeconds: any): Promise<boolean>;

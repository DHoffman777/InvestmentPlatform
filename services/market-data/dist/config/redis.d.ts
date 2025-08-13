import { RedisClientType } from 'redis';
export declare const initializeRedis: () => Promise<RedisClientType>;
export declare const getRedisClient: () => RedisClientType;
export declare const closeRedis: () => Promise<void>;
export declare const cacheGet: (key: string) => Promise<string | null>;
export declare const cacheSet: (key: string, value: string, ttlSeconds?: number) => Promise<boolean>;
export declare const cacheDelete: (key: string) => Promise<boolean>;
export declare const cacheGetJSON: <T>(key: string) => Promise<T | null>;
export declare const cacheSetJSON: <T>(key: string, value: T, ttlSeconds?: number) => Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map
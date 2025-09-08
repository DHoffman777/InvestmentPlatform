import { EventEmitter } from 'events';
export interface CacheConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        keyPrefix: string;
        cluster?: {
            nodes: Array<{
                host: string;
                port: number;
            }>;
            options: any;
        };
    };
    defaultTTL: number;
    compressionThreshold: number;
    maxMemoryPolicy: 'allkeys-lru' | 'volatile-lru' | 'allkeys-lfu' | 'volatile-lfu';
}
export interface CacheStrategy {
    name: string;
    pattern: RegExp;
    ttl: number;
    dependencies?: string[];
    invalidationRules: {
        events: string[];
        conditions: Array<(data: any) => boolean>;
    };
    warmupStrategy?: {
        enabled: boolean;
        schedule: string;
        priority: number;
    };
    compressionEnabled: boolean;
    tags: string[];
}
export interface CacheMetrics {
    key: string;
    pattern: string;
    hits: number;
    misses: number;
    hitRate: number;
    averageResponseTime: number;
    dataSize: number;
    ttl: number;
    createdAt: Date;
    lastAccessed: Date;
    expiresAt: Date;
}
export interface CachePerformanceReport {
    overall: {
        totalKeys: number;
        totalHits: number;
        totalMisses: number;
        overallHitRate: number;
        memoryUsage: number;
        evictions: number;
    };
    byPattern: Array<{
        pattern: string;
        keyCount: number;
        hitRate: number;
        averageSize: number;
        recommendations: string[];
    }>;
    topKeys: Array<{
        key: string;
        hits: number;
        size: number;
        efficiency: number;
    }>;
    recommendations: Array<{
        type: 'TTL_ADJUSTMENT' | 'PATTERN_OPTIMIZATION' | 'MEMORY_OPTIMIZATION' | 'STRATEGY_CHANGE';
        description: string;
        impact: 'LOW' | 'MEDIUM' | 'HIGH';
        implementation: string;
    }>;
}
export declare class CachingStrategy extends EventEmitter {
    private redis;
    private clusterClient?;
    private strategies;
    private metrics;
    private config;
    constructor(config: CacheConfig);
    private initializeRedis;
    private initializeDefaultStrategies;
    set(key: string, value: any, options?: {
        ttl?: number;
        tags?: string[];
        compress?: boolean;
    }): Promise<boolean>;
    get<T = any>(key: string): Promise<T | null>;
    mget<T = any>(keys: string[]): Promise<Array<T | null>>;
    del(key: string | string[]): Promise<number>;
    invalidateByTag(tag: string): Promise<number>;
    invalidateByPattern(pattern: string): Promise<number>;
    private addTags;
    private findStrategy;
    private updateMetrics;
    warmupCache(): Promise<any>;
    private executeWarmupStrategy;
    getPerformanceReport(): Promise<CachePerformanceReport>;
    private parseMemoryInfo;
    private generatePatternRecommendations;
    private generateGlobalRecommendations;
    private startMetricsCollection;
    addStrategy(strategy: CacheStrategy): void;
    removeStrategy(name: string): boolean;
    getStrategies(): CacheStrategy[];
    disconnect(): Promise<any>;
}

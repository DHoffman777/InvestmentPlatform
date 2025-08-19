export interface AssetMetadata {
    size: number;
    contentType: string;
    lastModified: Date;
    etag: string;
    originalName: string;
    category?: string;
    cachePolicy?: CachePolicy;
    optimizations?: {
        compressed: boolean;
        optimized: boolean;
        webpVersion?: boolean;
        avifVersion?: boolean;
    };
}
export interface CachePolicy {
    public?: boolean;
    maxAge?: number;
    sMaxAge?: number;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
    staleWhileRevalidate?: number;
    staleIfError?: number;
}
export interface InvalidationResult {
    id: string;
    status: string;
    paths: string[];
    createdAt: Date;
    completedAt?: Date;
}
export interface CDNProvider {
    getName(): string;
    uploadAsset(key: string, buffer: Buffer, metadata: AssetMetadata): Promise<{
        url: string;
        etag: string;
    }>;
    deleteAsset(key: string): Promise<boolean>;
    getAssetMetadata(key: string): Promise<AssetMetadata | null>;
    invalidateCache(paths: string[]): Promise<InvalidationResult>;
    setCachePolicy(pattern: string, policy: CachePolicy): Promise<boolean>;
    getStats(): Promise<{
        totalAssets: number;
        totalSize: number;
        hitRatio: number;
        bandwidth: number;
    }>;
    isHealthy(): Promise<boolean>;
}
export interface AssetOptimizationConfig {
    enableCompression: boolean;
    enableWebP: boolean;
    enableAVIF: boolean;
    compressionQuality: number;
    resizeImages: boolean;
    maxImageWidth: number;
    maxImageHeight: number;
    stripMetadata: boolean;
}
export interface CDNConfig {
    provider: 'cloudfront' | 'azure' | 'fastly' | 'cloudflare';
    primaryProvider: string;
    fallbackProviders?: string[];
    assetOptimization: AssetOptimizationConfig;
    cachePolicies: {
        [key: string]: CachePolicy;
    };
    purgeStrategies: {
        automatic: boolean;
        scheduledPurge: {
            enabled: boolean;
            schedule: string;
        };
        apiTriggered: boolean;
    };
}
export interface AssetUploadRequest {
    file: Buffer;
    originalName: string;
    contentType: string;
    category?: 'images' | 'documents' | 'videos' | 'fonts' | 'scripts' | 'styles' | 'other';
    tags?: string[];
    customCachePolicy?: CachePolicy;
    optimizations?: Partial<AssetOptimizationConfig>;
}
export interface AssetUploadResult {
    key: string;
    url: string;
    cdnUrl: string;
    etag: string;
    size: number;
    optimizations: {
        originalSize: number;
        compressedSize?: number;
        webpSize?: number;
        avifSize?: number;
        savings: number;
    };
    metadata: AssetMetadata;
}
export interface CDNAnalytics {
    timeRange: {
        start: Date;
        end: Date;
    };
    requests: {
        total: number;
        cached: number;
        uncached: number;
        hitRatio: number;
    };
    bandwidth: {
        total: number;
        cached: number;
        uncached: number;
        savings: number;
    };
    topAssets: Array<{
        key: string;
        requests: number;
        bandwidth: number;
        hitRatio: number;
    }>;
    errorRates: {
        total: number;
        byStatusCode: {
            [code: number]: number;
        };
    };
    geographicData: Array<{
        region: string;
        requests: number;
        bandwidth: number;
        avgResponseTime: number;
    }>;
    recommendations: Array<{
        type: 'CACHE_POLICY' | 'COMPRESSION' | 'OPTIMIZATION' | 'PURGE';
        asset?: string;
        description: string;
        impact: 'LOW' | 'MEDIUM' | 'HIGH';
        implementation: string;
    }>;
}
export interface PerformanceMetrics {
    avgResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    cacheHitRatio: number;
    totalRequests: number;
    bandwidth: number;
    timestamp: Date;
}
export interface AssetCategory {
    name: string;
    pattern: RegExp;
    defaultCachePolicy: CachePolicy;
    optimizationConfig: Partial<AssetOptimizationConfig>;
    description: string;
}
export interface PurgeJob {
    id: string;
    type: 'PATTERN' | 'TAG' | 'ASSET' | 'ALL';
    target: string | string[];
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    results?: InvalidationResult[];
    error?: string;
}

export const __esModule: boolean;
export class CDNManagementService extends events_1<[never]> {
    constructor(config: any);
    config: any;
    providers: Map<any, any>;
    purgeJobs: Map<any, any>;
    performanceMetrics: any[];
    assetCategories: any[];
    app: any;
    initializeServices(): void;
    redis: any;
    optimizationService: AssetOptimizationService_1.AssetOptimizationService;
    initializeProviders(): void;
    primaryProvider: CloudFrontProvider_1.CloudFrontProvider;
    setupAssetCategories(): void;
    setupEventHandlers(): void;
    setupMiddleware(): void;
    setupRoutes(): void;
    setupCronJobs(): void;
    uploadAsset(request: any): Promise<{
        key: string;
        url: string;
        cdnUrl: string;
        etag: string;
        size: number;
        optimizations: {
            originalSize: number;
            compressedSize: number;
            webpSize: number;
            avifSize: number;
            savings: number;
        };
        metadata: {
            size: number;
            contentType: any;
            lastModified: Date;
            etag: string;
            originalName: any;
            category: any;
            cachePolicy: any;
        };
    }>;
    deleteAsset(key: any): Promise<boolean>;
    invalidateCache(paths: any, type?: string): Promise<{
        id: string;
        type: string;
        target: any;
        status: string;
        createdAt: Date;
    }>;
    generateAssetKey(originalName: any, category: any): string;
    getCachePolicyForAsset(filename: any, category: any): any;
    storeAssetMetadata(key: any, metadata: any): Promise<void>;
    getAssetMetadata(key: any): Promise<any>;
    recordPerformanceMetric(metric: any): void;
    aggregatePerformanceMetrics(): void;
    updateAssetUsageAnalytics(): Promise<void>;
    runScheduledPurge(): Promise<void>;
    findOldUnusedAssets(): Promise<any[]>;
    setCachePolicy(pattern: any, policy: any): Promise<boolean>;
    getAnalytics(startDate: any, endDate: any): Promise<{
        timeRange: {
            start: any;
            end: any;
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
        topAssets: any[];
        errorRates: {
            total: number;
            byStatusCode: {};
        };
        geographicData: any[];
        recommendations: any[];
    }>;
    getPerformanceMetrics(): Promise<any[]>;
    getHealthStatus(): Promise<{
        status: string;
        timestamp: Date;
        providers: {
            name: any;
            healthy: any;
        }[];
        redis: boolean;
        optimization: boolean;
    }>;
    start(port?: number): void;
    shutdown(): Promise<void>;
    getApp(): any;
}
import events_1 = require("events");
import AssetOptimizationService_1 = require("./AssetOptimizationService");
import CloudFrontProvider_1 = require("../providers/CloudFrontProvider");

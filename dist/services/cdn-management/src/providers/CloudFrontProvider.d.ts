import { EventEmitter } from 'events';
import { CDNProvider, AssetMetadata, CachePolicy, InvalidationResult } from '../types';
export interface CloudFrontConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    distributionId: string;
    s3Bucket: string;
    s3KeyPrefix?: string;
}
export declare class CloudFrontProvider extends EventEmitter implements CDNProvider {
    private cloudfront;
    private s3;
    private config;
    constructor(config: CloudFrontConfig);
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
    private getDistributionDomain;
    private getCacheControl;
    private parseCachePolicy;
    getName(): string;
    isHealthy(): Promise<boolean>;
}

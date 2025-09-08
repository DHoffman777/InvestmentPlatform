export const __esModule: boolean;
export class CloudFrontProvider extends events_1<[never]> {
    constructor(config: any);
    config: any;
    cloudfront: client_cloudfront_1.CloudFrontClient;
    s3: client_s3_1.S3Client;
    uploadAsset(key: any, buffer: any, metadata: any): Promise<{
        url: string;
        etag: string;
    }>;
    deleteAsset(key: any): Promise<boolean>;
    getAssetMetadata(key: any): Promise<{
        size: number;
        contentType: string;
        lastModified: Date;
        etag: string;
        originalName: any;
        category: string;
        cachePolicy: {
            public: any;
            noCache: any;
            noStore: any;
        };
    }>;
    invalidateCache(paths: any): Promise<{
        id: string;
        status: string;
        paths: any;
        createdAt: Date;
    }>;
    setCachePolicy(pattern: any, policy: any): Promise<boolean>;
    getStats(): Promise<{
        totalAssets: number;
        totalSize: number;
        hitRatio: number;
        bandwidth: number;
    }>;
    getDistributionDomain(): Promise<string>;
    getCacheControl(policy: any): string;
    parseCachePolicy(cacheControl: any): {
        public: any;
        noCache: any;
        noStore: any;
    };
    getName(): string;
    isHealthy(): Promise<boolean>;
}
import events_1 = require("events");
import client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
import client_s3_1 = require("@aws-sdk/client-s3");

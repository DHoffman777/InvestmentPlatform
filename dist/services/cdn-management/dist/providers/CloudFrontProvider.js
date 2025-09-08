"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudFrontProvider = void 0;
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const client_s3_1 = require("@aws-sdk/client-s3");
const events_1 = require("events");
class CloudFrontProvider extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.cloudfront = new client_cloudfront_1.CloudFrontClient({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
        this.s3 = new client_s3_1.S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }
    async uploadAsset(key, buffer, metadata) {
        try {
            const s3Key = this.config.s3KeyPrefix ? `${this.config.s3KeyPrefix}/${key}` : key;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.config.s3Bucket,
                Key: s3Key,
                Body: buffer,
                ContentType: metadata.contentType,
                ContentLength: metadata.size,
                CacheControl: this.getCacheControl(metadata.cachePolicy),
                Metadata: {
                    originalName: metadata.originalName,
                    uploadedAt: new Date().toISOString(),
                    category: metadata.category || 'unknown',
                },
            });
            const result = await this.s3.send(command);
            const url = `https://${this.getDistributionDomain()}/${key}`;
            this.emit('assetUploaded', { key, url, etag: result.ETag });
            return {
                url,
                etag: result.ETag || '',
            };
        }
        catch (error) {
            this.emit('error', { operation: 'uploadAsset', key, error });
            throw error;
        }
    }
    async deleteAsset(key) {
        try {
            const s3Key = this.config.s3KeyPrefix ? `${this.config.s3KeyPrefix}/${key}` : key;
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.config.s3Bucket,
                Key: s3Key,
            });
            await this.s3.send(command);
            this.emit('assetDeleted', { key });
            return true;
        }
        catch (error) {
            this.emit('error', { operation: 'deleteAsset', key, error });
            return false;
        }
    }
    async getAssetMetadata(key) {
        try {
            const s3Key = this.config.s3KeyPrefix ? `${this.config.s3KeyPrefix}/${key}` : key;
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: this.config.s3Bucket,
                Key: s3Key,
            });
            const result = await this.s3.send(command);
            return {
                size: result.ContentLength || 0,
                contentType: result.ContentType || 'application/octet-stream',
                lastModified: result.LastModified || new Date(),
                etag: result.ETag || '',
                originalName: result.Metadata?.originalName || key,
                category: result.Metadata?.category,
                cachePolicy: this.parseCachePolicy(result.CacheControl),
            };
        }
        catch (error) {
            if (error.name === 'NotFound') {
                return null;
            }
            this.emit('error', { operation: 'getAssetMetadata', key, error });
            throw error;
        }
    }
    async invalidateCache(paths) {
        try {
            const command = new client_cloudfront_1.CreateInvalidationCommand({
                DistributionId: this.config.distributionId,
                InvalidationBatch: {
                    Paths: {
                        Quantity: paths.length,
                        Items: paths.map(path => path.startsWith('/') ? path : `/${path}`),
                    },
                    CallerReference: `invalidation-${Date.now()}`,
                },
            });
            const result = await this.cloudfront.send(command);
            const invalidationResult = {
                id: result.Invalidation?.Id || '',
                status: result.Invalidation?.Status || 'InProgress',
                paths,
                createdAt: result.Invalidation?.CreateTime || new Date(),
            };
            this.emit('cacheInvalidated', invalidationResult);
            return invalidationResult;
        }
        catch (error) {
            this.emit('error', { operation: 'invalidateCache', paths, error });
            throw error;
        }
    }
    async setCachePolicy(pattern, policy) {
        try {
            // This would require creating/updating CloudFront behaviors
            // For now, we'll emit an event to indicate the policy change request
            this.emit('cachePolicyRequested', { pattern, policy });
            // In a real implementation, you would:
            // 1. Get the current distribution config
            // 2. Update the cache behaviors
            // 3. Update the distribution
            return true;
        }
        catch (error) {
            this.emit('error', { operation: 'setCachePolicy', pattern, error });
            return false;
        }
    }
    async getStats() {
        try {
            // In a real implementation, you would use CloudWatch metrics
            // For now, return mock data
            return {
                totalAssets: 0,
                totalSize: 0,
                hitRatio: 0.95,
                bandwidth: 0,
            };
        }
        catch (error) {
            this.emit('error', { operation: 'getStats', error });
            throw error;
        }
    }
    async getDistributionDomain() {
        try {
            const command = new client_cloudfront_1.GetDistributionCommand({
                Id: this.config.distributionId,
            });
            const result = await this.cloudfront.send(command);
            return result.Distribution?.DomainName || 'unknown';
        }
        catch (error) {
            return 'unknown';
        }
    }
    getCacheControl(policy) {
        if (!policy)
            return 'public, max-age=3600'; // 1 hour default
        let cacheControl = policy.public ? 'public' : 'private';
        if (policy.maxAge) {
            cacheControl += `, max-age=${policy.maxAge}`;
        }
        if (policy.sMaxAge) {
            cacheControl += `, s-maxage=${policy.sMaxAge}`;
        }
        if (policy.noCache) {
            cacheControl = 'no-cache';
        }
        if (policy.noStore) {
            cacheControl = 'no-store';
        }
        return cacheControl;
    }
    parseCachePolicy(cacheControl) {
        if (!cacheControl)
            return undefined;
        const policy = {
            public: cacheControl.includes('public'),
            noCache: cacheControl.includes('no-cache'),
            noStore: cacheControl.includes('no-store'),
        };
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
            policy.maxAge = parseInt(maxAgeMatch[1]);
        }
        const sMaxAgeMatch = cacheControl.match(/s-maxage=(\d+)/);
        if (sMaxAgeMatch) {
            policy.sMaxAge = parseInt(sMaxAgeMatch[1]);
        }
        return policy;
    }
    getName() {
        return 'CloudFront';
    }
    async isHealthy() {
        try {
            await this.getDistributionDomain();
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.CloudFrontProvider = CloudFrontProvider;

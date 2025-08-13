import { CloudFrontClient, CreateInvalidationCommand, GetDistributionCommand, UpdateDistributionCommand } from '@aws-sdk/client-cloudfront';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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

export class CloudFrontProvider extends EventEmitter implements CDNProvider {
  private cloudfront: CloudFrontClient;
  private s3: S3Client;
  private config: CloudFrontConfig;

  constructor(config: CloudFrontConfig) {
    super();
    this.config = config;
    
    this.cloudfront = new CloudFrontClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadAsset(
    key: string,
    buffer: Buffer,
    metadata: AssetMetadata
  ): Promise<{ url: string; etag: string }> {
    try {
      const s3Key = this.config.s3KeyPrefix ? `${this.config.s3KeyPrefix}/${key}` : key;
      
      const command = new PutObjectCommand({
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
    } catch (error) {
      this.emit('error', { operation: 'uploadAsset', key, error });
      throw error;
    }
  }

  async deleteAsset(key: string): Promise<boolean> {
    try {
      const s3Key = this.config.s3KeyPrefix ? `${this.config.s3KeyPrefix}/${key}` : key;
      
      const command = new DeleteObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: s3Key,
      });

      await this.s3.send(command);
      this.emit('assetDeleted', { key });
      
      return true;
    } catch (error) {
      this.emit('error', { operation: 'deleteAsset', key, error });
      return false;
    }
  }

  async getAssetMetadata(key: string): Promise<AssetMetadata | null> {
    try {
      const s3Key = this.config.s3KeyPrefix ? `${this.config.s3KeyPrefix}/${key}` : key;
      
      const command = new HeadObjectCommand({
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
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return null;
      }
      this.emit('error', { operation: 'getAssetMetadata', key, error });
      throw error;
    }
  }

  async invalidateCache(paths: string[]): Promise<InvalidationResult> {
    try {
      const command = new CreateInvalidationCommand({
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
      
      const invalidationResult: InvalidationResult = {
        id: result.Invalidation?.Id || '',
        status: result.Invalidation?.Status || 'InProgress',
        paths,
        createdAt: result.Invalidation?.CreateTime || new Date(),
      };

      this.emit('cacheInvalidated', invalidationResult);
      
      return invalidationResult;
    } catch (error) {
      this.emit('error', { operation: 'invalidateCache', paths, error });
      throw error;
    }
  }

  async setCachePolicy(pattern: string, policy: CachePolicy): Promise<boolean> {
    try {
      // This would require creating/updating CloudFront behaviors
      // For now, we'll emit an event to indicate the policy change request
      this.emit('cachePolicyRequested', { pattern, policy });
      
      // In a real implementation, you would:
      // 1. Get the current distribution config
      // 2. Update the cache behaviors
      // 3. Update the distribution
      
      return true;
    } catch (error) {
      this.emit('error', { operation: 'setCachePolicy', pattern, error });
      return false;
    }
  }

  async getStats(): Promise<{
    totalAssets: number;
    totalSize: number;
    hitRatio: number;
    bandwidth: number;
  }> {
    try {
      // In a real implementation, you would use CloudWatch metrics
      // For now, return mock data
      return {
        totalAssets: 0,
        totalSize: 0,
        hitRatio: 0.95,
        bandwidth: 0,
      };
    } catch (error) {
      this.emit('error', { operation: 'getStats', error });
      throw error;
    }
  }

  private async getDistributionDomain(): Promise<string> {
    try {
      const command = new GetDistributionCommand({
        Id: this.config.distributionId,
      });
      
      const result = await this.cloudfront.send(command);
      return result.Distribution?.DomainName || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  private getCacheControl(policy?: CachePolicy): string {
    if (!policy) return 'public, max-age=3600'; // 1 hour default
    
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

  private parseCachePolicy(cacheControl?: string): CachePolicy | undefined {
    if (!cacheControl) return undefined;
    
    const policy: CachePolicy = {
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

  getName(): string {
    return 'CloudFront';
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.getDistributionDomain();
      return true;
    } catch {
      return false;
    }
  }
}
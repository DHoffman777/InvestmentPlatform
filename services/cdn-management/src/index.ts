import dotenv from 'dotenv';
import { CDNManagementService } from './services/CDNManagementService';
import { CDNConfig } from './types';

// Load environment variables
dotenv.config();

const config: CDNConfig = {
  provider: 'cloudfront',
  primaryProvider: 'cloudfront',
  fallbackProviders: [],
  assetOptimization: {
    enableCompression: true,
    enableWebP: true,
    enableAVIF: false,
    compressionQuality: 85,
    resizeImages: true,
    maxImageWidth: 2048,
    maxImageHeight: 2048,
    stripMetadata: true,
  },
  cachePolicies: {
    // Static assets - long cache
    '\\.(js|css|woff|woff2|ttf|otf)$': {
      public: true,
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 86400, // 1 day
    },
    // Images - medium cache
    '\\.(jpg|jpeg|png|gif|webp|avif|svg)$': {
      public: true,
      maxAge: 2592000, // 30 days
      staleWhileRevalidate: 3600, // 1 hour
    },
    // Documents - short cache with revalidation
    '\\.(pdf|doc|docx|xls|xlsx)$': {
      public: true,
      maxAge: 86400, // 1 day
      mustRevalidate: true,
    },
    // API responses - very short cache
    '^/api/': {
      public: false,
      maxAge: 300, // 5 minutes
      mustRevalidate: true,
    },
  },
  purgeStrategies: {
    automatic: true,
    scheduledPurge: {
      enabled: true,
      schedule: '0 2 * * 0', // Every Sunday at 2 AM
    },
    apiTriggered: true,
  },
};

const cdnService = new CDNManagementService(config);

// Event handlers
cdnService.on('serviceStarted', ({ port }) => {
  console.log(`CDN Management Service started on port ${port}`);
});

cdnService.on('assetUploadCompleted', (result) => {
  console.log(`Asset uploaded: ${result.key} (${result.optimizations.savings}% savings)`);
});

cdnService.on('assetOptimized', (data) => {
  console.log(`Asset optimized: ${data.savings.percentage}% size reduction`);
});

cdnService.on('cacheInvalidated', (job) => {
  console.log(`Cache invalidated: ${job.target} (${job.status})`);
});

cdnService.on('performanceMetricsAggregated', (metrics) => {
  console.log(`Performance metrics: ${metrics.avgResponseTime}ms avg, ${metrics.cacheHitRatio} hit ratio`);
});

cdnService.on('error', (error) => {
  console.error('CDN Service error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await cdnService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await cdnService.shutdown();
  process.exit(0);
});

// Start the service
const port = parseInt(process.env.PORT || '3009');
cdnService.start(port);

export { CDNManagementService, config };
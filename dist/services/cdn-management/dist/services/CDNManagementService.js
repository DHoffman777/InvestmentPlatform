"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDNManagementService = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const events_1 = require("events");
const ioredis_1 = __importDefault(require("ioredis"));
const node_cron_1 = __importDefault(require("node-cron"));
const uuid_1 = require("uuid");
const AssetOptimizationService_1 = require("./AssetOptimizationService");
const CloudFrontProvider_1 = require("../providers/CloudFrontProvider");
class CDNManagementService extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.providers = new Map();
        this.purgeJobs = new Map();
        this.performanceMetrics = [];
        this.assetCategories = [];
        this.app = (0, express_1.default)();
        this.initializeServices();
        this.setupAssetCategories();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupCronJobs();
    }
    initializeServices() {
        // Initialize Redis for caching and metadata
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            keyPrefix: 'cdn:',
        });
        // Initialize asset optimization service
        this.optimizationService = new AssetOptimizationService_1.AssetOptimizationService(this.config.assetOptimization);
        // Initialize CDN providers
        this.initializeProviders();
        // Set up event handlers
        this.setupEventHandlers();
    }
    initializeProviders() {
        // Initialize CloudFront provider
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            const cloudFrontProvider = new CloudFrontProvider_1.CloudFrontProvider({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION || 'us-east-1',
                distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
                s3Bucket: process.env.S3_BUCKET || '',
                s3KeyPrefix: process.env.S3_KEY_PREFIX,
            });
            this.providers.set('cloudfront', cloudFrontProvider);
            if (this.config.primaryProvider === 'cloudfront') {
                this.primaryProvider = cloudFrontProvider;
            }
        }
        // Initialize other providers (Azure, Fastly, etc.) as needed
        if (!this.primaryProvider) {
            throw new Error('No primary CDN provider configured');
        }
    }
    setupAssetCategories() {
        this.assetCategories = [
            {
                name: 'images',
                pattern: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
                defaultCachePolicy: {
                    public: true,
                    maxAge: 31536000, // 1 year
                    staleWhileRevalidate: 86400, // 1 day
                },
                optimizationConfig: {
                    enableCompression: true,
                    enableWebP: true,
                    enableAVIF: false,
                    compressionQuality: 85,
                    resizeImages: true,
                    maxImageWidth: 2048,
                    maxImageHeight: 2048,
                    stripMetadata: true,
                },
                description: 'Image assets including photos, graphics, and icons',
            },
            {
                name: 'documents',
                pattern: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,
                defaultCachePolicy: {
                    public: true,
                    maxAge: 86400, // 1 day
                    mustRevalidate: true,
                },
                optimizationConfig: {
                    enableCompression: false, // Documents are usually pre-compressed
                    enableWebP: false,
                    enableAVIF: false,
                    compressionQuality: 100,
                    resizeImages: false,
                    maxImageWidth: 0,
                    maxImageHeight: 0,
                    stripMetadata: false,
                },
                description: 'Document files for client access',
            },
            {
                name: 'scripts',
                pattern: /\.(js|mjs|ts)$/i,
                defaultCachePolicy: {
                    public: true,
                    maxAge: 2592000, // 30 days
                    staleWhileRevalidate: 3600, // 1 hour
                },
                optimizationConfig: {
                    enableCompression: true,
                    enableWebP: false,
                    enableAVIF: false,
                    compressionQuality: 100,
                    resizeImages: false,
                    maxImageWidth: 0,
                    maxImageHeight: 0,
                    stripMetadata: false,
                },
                description: 'JavaScript and TypeScript files',
            },
            {
                name: 'styles',
                pattern: /\.(css|scss|sass|less)$/i,
                defaultCachePolicy: {
                    public: true,
                    maxAge: 2592000, // 30 days
                    staleWhileRevalidate: 3600, // 1 hour
                },
                optimizationConfig: {
                    enableCompression: true,
                    enableWebP: false,
                    enableAVIF: false,
                    compressionQuality: 100,
                    resizeImages: false,
                    maxImageWidth: 0,
                    maxImageHeight: 0,
                    stripMetadata: false,
                },
                description: 'CSS and styling files',
            },
            {
                name: 'fonts',
                pattern: /\.(woff|woff2|ttf|otf|eot)$/i,
                defaultCachePolicy: {
                    public: true,
                    maxAge: 31536000, // 1 year
                    staleWhileRevalidate: 86400, // 1 day
                },
                optimizationConfig: {
                    enableCompression: false, // Fonts are usually pre-compressed
                    enableWebP: false,
                    enableAVIF: false,
                    compressionQuality: 100,
                    resizeImages: false,
                    maxImageWidth: 0,
                    maxImageHeight: 0,
                    stripMetadata: false,
                },
                description: 'Web font files',
            },
        ];
    }
    setupEventHandlers() {
        // Asset optimization events
        this.optimizationService.on('imageOptimizationCompleted', (data) => {
            this.emit('assetOptimized', data);
        });
        this.optimizationService.on('optimizationError', (error) => {
            this.emit('optimizationError', error);
        });
        // Provider events
        for (const provider of this.providers.values()) {
            provider.on('assetUploaded', (data) => {
                this.emit('assetUploaded', { provider: provider.getName(), ...data });
            });
            provider.on('error', (error) => {
                this.emit('providerError', { provider: provider.getName(), ...error });
            });
        }
    }
    setupMiddleware() {
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
        // Performance monitoring middleware
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.recordPerformanceMetric({
                    avgResponseTime: responseTime,
                    p50ResponseTime: responseTime,
                    p95ResponseTime: responseTime,
                    p99ResponseTime: responseTime,
                    errorRate: res.statusCode >= 400 ? 1 : 0,
                    cacheHitRatio: res.get('X-Cache-Status') === 'HIT' ? 1 : 0,
                    totalRequests: 1,
                    bandwidth: parseInt(res.get('content-length') || '0'),
                    timestamp: new Date(),
                });
            });
            next();
        });
    }
    setupRoutes() {
        // Asset upload endpoint
        const upload = (0, multer_1.default)({
            storage: multer_1.default.memoryStorage(),
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB
            },
            fileFilter: (req, file, cb) => {
                // Basic security check
                const allowedTypes = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|js|css|woff|woff2|ttf|svg)$/i;
                if (allowedTypes.test(file.originalname)) {
                    cb(null, true);
                }
                else {
                    cb(new Error('Unsupported file type'), false);
                }
            },
        });
        this.app.post('/api/v1/assets/upload', upload.single('file'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'No file provided' });
                }
                const uploadRequest = {
                    file: req.file.buffer,
                    originalName: req.file.originalname,
                    contentType: req.file.mimetype,
                    category: req.body.category,
                    tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
                    customCachePolicy: req.body.cachePolicy ? JSON.parse(req.body.cachePolicy) : undefined,
                    optimizations: req.body.optimizations ? JSON.parse(req.body.optimizations) : undefined,
                };
                const result = await this.uploadAsset(uploadRequest);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ error: 'Upload failed', details: error.message });
            }
        });
        // Bulk upload endpoint
        this.app.post('/api/v1/assets/upload-bulk', upload.array('files', 20), async (req, res) => {
            try {
                if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                    return res.status(400).json({ error: 'No files provided' });
                }
                const results = [];
                const errors = [];
                for (const file of req.files) {
                    try {
                        const uploadRequest = {
                            file: file.buffer,
                            originalName: file.originalname,
                            contentType: file.mimetype,
                            category: req.body.category,
                        };
                        const result = await this.uploadAsset(uploadRequest);
                        results.push(result);
                    }
                    catch (error) {
                        errors.push({
                            filename: file.originalname,
                            error: error.message,
                        });
                    }
                }
                res.json({ results, errors });
            }
            catch (error) {
                res.status(500).json({ error: 'Bulk upload failed', details: error.message });
            }
        });
        // Asset deletion endpoint
        this.app.delete('/api/v1/assets/:key', async (req, res) => {
            try {
                const { key } = req.params;
                await this.deleteAsset(key);
                res.json({ message: 'Asset deleted successfully' });
            }
            catch (error) {
                res.status(500).json({ error: 'Deletion failed', details: error.message });
            }
        });
        // Cache invalidation endpoint
        this.app.post('/api/v1/cache/invalidate', async (req, res) => {
            try {
                const { paths, type } = req.body;
                if (!paths || !Array.isArray(paths)) {
                    return res.status(400).json({ error: 'Paths array is required' });
                }
                const job = await this.invalidateCache(paths, type);
                res.json(job);
            }
            catch (error) {
                res.status(500).json({ error: 'Invalidation failed', details: error.message });
            }
        });
        // Asset metadata endpoint
        this.app.get('/api/v1/assets/:key/metadata', async (req, res) => {
            try {
                const { key } = req.params;
                const metadata = await this.getAssetMetadata(key);
                if (!metadata) {
                    return res.status(404).json({ error: 'Asset not found' });
                }
                res.json(metadata);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get metadata', details: error.message });
            }
        });
        // Analytics endpoint
        this.app.get('/api/v1/analytics', async (req, res) => {
            try {
                const { startDate, endDate } = req.query;
                const analytics = await this.getAnalytics(startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000), endDate ? new Date(endDate) : new Date());
                res.json(analytics);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get analytics', details: error.message });
            }
        });
        // Performance metrics endpoint
        this.app.get('/api/v1/performance', async (req, res) => {
            try {
                const metrics = await this.getPerformanceMetrics();
                res.json(metrics);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get performance metrics', details: error.message });
            }
        });
        // Asset categories endpoint
        this.app.get('/api/v1/categories', (req, res) => {
            res.json(this.assetCategories);
        });
        // Cache policies endpoint
        this.app.get('/api/v1/cache-policies', (req, res) => {
            res.json(this.config.cachePolicies);
        });
        // Update cache policy endpoint
        this.app.put('/api/v1/cache-policies/:pattern', async (req, res) => {
            try {
                const { pattern } = req.params;
                const { policy } = req.body;
                await this.setCachePolicy(pattern, policy);
                res.json({ message: 'Cache policy updated successfully' });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to update cache policy', details: error.message });
            }
        });
        // Health check endpoint
        this.app.get('/api/v1/health', async (req, res) => {
            try {
                const health = await this.getHealthStatus();
                res.json(health);
            }
            catch (error) {
                res.status(500).json({ error: 'Health check failed', details: error.message });
            }
        });
    }
    setupCronJobs() {
        // Automated purge job
        if (this.config.purgeStrategies.scheduledPurge.enabled) {
            node_cron_1.default.schedule(this.config.purgeStrategies.scheduledPurge.schedule, async () => {
                console.log('Running scheduled cache purge...');
                try {
                    await this.runScheduledPurge();
                }
                catch (error) {
                    console.error('Scheduled purge failed:', error);
                }
            });
        }
        // Performance metrics aggregation (every 5 minutes)
        node_cron_1.default.schedule('*/5 * * * *', () => {
            this.aggregatePerformanceMetrics();
        });
        // Asset usage analytics (every hour)
        node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                await this.updateAssetUsageAnalytics();
            }
            catch (error) {
                console.error('Asset usage analytics update failed:', error);
            }
        });
    }
    async uploadAsset(request) {
        const key = this.generateAssetKey(request.originalName, request.category);
        try {
            // Optimize the asset
            const optimization = await this.optimizationService.optimizeAsset(request.file, request.contentType, request);
            // Choose the best optimized version
            const bestBuffer = optimization.webp?.buffer ||
                optimization.optimized?.buffer ||
                optimization.original.buffer;
            // Determine cache policy
            const cachePolicy = request.customCachePolicy ||
                this.getCachePolicyForAsset(request.originalName, request.category);
            // Upload to primary provider
            const uploadResult = await this.primaryProvider.uploadAsset(key, bestBuffer, {
                size: bestBuffer.length,
                contentType: request.contentType,
                lastModified: new Date(),
                etag: '',
                originalName: request.originalName,
                category: request.category,
                cachePolicy,
                optimizations: {
                    compressed: !!optimization.optimized,
                    optimized: !!optimization.optimized,
                    webpVersion: !!optimization.webp,
                    avifVersion: !!optimization.avif,
                },
            });
            // Store metadata in Redis
            await this.storeAssetMetadata(key, {
                originalName: request.originalName,
                contentType: request.contentType,
                category: request.category,
                tags: request.tags || [],
                uploadedAt: new Date(),
                optimization: optimization.savings,
            });
            const result = {
                key,
                url: uploadResult.url,
                cdnUrl: uploadResult.url,
                etag: uploadResult.etag,
                size: bestBuffer.length,
                optimizations: {
                    originalSize: optimization.original.size,
                    compressedSize: optimization.optimized?.size,
                    webpSize: optimization.webp?.size,
                    avifSize: optimization.avif?.size,
                    savings: optimization.savings.percentage,
                },
                metadata: {
                    size: bestBuffer.length,
                    contentType: request.contentType,
                    lastModified: new Date(),
                    etag: uploadResult.etag,
                    originalName: request.originalName,
                    category: request.category,
                    cachePolicy,
                },
            };
            this.emit('assetUploadCompleted', result);
            return result;
        }
        catch (error) {
            this.emit('assetUploadFailed', { key, error });
            throw error;
        }
    }
    async deleteAsset(key) {
        try {
            const deleted = await this.primaryProvider.deleteAsset(key);
            if (deleted) {
                await this.redis.del(`asset:${key}`);
                this.emit('assetDeleted', { key });
            }
            return deleted;
        }
        catch (error) {
            this.emit('assetDeletionFailed', { key, error });
            throw error;
        }
    }
    async invalidateCache(paths, type = 'PATTERN') {
        const jobId = (0, uuid_1.v4)();
        const job = {
            id: jobId,
            type: type,
            target: paths,
            status: 'PENDING',
            createdAt: new Date(),
        };
        this.purgeJobs.set(jobId, job);
        try {
            job.status = 'IN_PROGRESS';
            job.startedAt = new Date();
            const results = await this.primaryProvider.invalidateCache(paths);
            job.status = 'COMPLETED';
            job.completedAt = new Date();
            job.results = [results];
            this.emit('cacheInvalidated', job);
        }
        catch (error) {
            job.status = 'FAILED';
            job.error = error.message;
            this.emit('cacheInvalidationFailed', job);
        }
        return job;
    }
    generateAssetKey(originalName, category) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const extension = originalName.split('.').pop();
        const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
        return category
            ? `${category}/${timestamp}-${random}-${baseName}.${extension}`
            : `${timestamp}-${random}-${baseName}.${extension}`;
    }
    getCachePolicyForAsset(filename, category) {
        // Check category-specific policies first
        const assetCategory = this.assetCategories.find(cat => cat.pattern.test(filename) || cat.name === category);
        if (assetCategory) {
            return assetCategory.defaultCachePolicy;
        }
        // Check configured policies
        for (const [pattern, policy] of Object.entries(this.config.cachePolicies)) {
            const regex = new RegExp(pattern);
            if (regex.test(filename)) {
                return policy;
            }
        }
        // Default policy
        return {
            public: true,
            maxAge: 3600, // 1 hour
            staleWhileRevalidate: 300, // 5 minutes
        };
    }
    async storeAssetMetadata(key, metadata) {
        await this.redis.setex(`asset:${key}`, 86400 * 7, // 7 days
        JSON.stringify(metadata));
    }
    async getAssetMetadata(key) {
        const cached = await this.redis.get(`asset:${key}`);
        return cached ? JSON.parse(cached) : null;
    }
    recordPerformanceMetric(metric) {
        this.performanceMetrics.push(metric);
        // Keep only last 1000 metrics
        if (this.performanceMetrics.length > 1000) {
            this.performanceMetrics = this.performanceMetrics.slice(-1000);
        }
    }
    aggregatePerformanceMetrics() {
        if (this.performanceMetrics.length === 0)
            return;
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const recentMetrics = this.performanceMetrics.filter(m => m.timestamp >= fiveMinutesAgo);
        if (recentMetrics.length > 0) {
            const aggregated = {
                avgResponseTime: recentMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / recentMetrics.length,
                totalRequests: recentMetrics.reduce((sum, m) => sum + m.totalRequests, 0),
                errorRate: recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length,
                cacheHitRatio: recentMetrics.reduce((sum, m) => sum + m.cacheHitRatio, 0) / recentMetrics.length,
                bandwidth: recentMetrics.reduce((sum, m) => sum + m.bandwidth, 0),
                timestamp: now,
            };
            this.emit('performanceMetricsAggregated', aggregated);
        }
    }
    async updateAssetUsageAnalytics() {
        // This would typically analyze access logs and update usage statistics
        this.emit('assetUsageAnalyticsUpdated', { timestamp: new Date() });
    }
    async runScheduledPurge() {
        // Implement scheduled purge logic based on usage patterns
        const oldAssets = await this.findOldUnusedAssets();
        if (oldAssets.length > 0) {
            await this.invalidateCache(oldAssets, 'SCHEDULED_PURGE');
        }
    }
    async findOldUnusedAssets() {
        // Implementation would query asset usage statistics
        return [];
    }
    async setCachePolicy(pattern, policy) {
        this.config.cachePolicies[pattern] = policy;
        return await this.primaryProvider.setCachePolicy(pattern, policy);
    }
    async getAnalytics(startDate, endDate) {
        // This would aggregate real analytics data
        return {
            timeRange: { start: startDate, end: endDate },
            requests: { total: 0, cached: 0, uncached: 0, hitRatio: 0 },
            bandwidth: { total: 0, cached: 0, uncached: 0, savings: 0 },
            topAssets: [],
            errorRates: { total: 0, byStatusCode: {} },
            geographicData: [],
            recommendations: [],
        };
    }
    async getPerformanceMetrics() {
        return this.performanceMetrics.slice(-100); // Return last 100 metrics
    }
    async getHealthStatus() {
        const providerHealth = await Promise.all(Array.from(this.providers.entries()).map(async ([name, provider]) => ({
            name,
            healthy: await provider.isHealthy(),
        })));
        return {
            status: 'healthy',
            timestamp: new Date(),
            providers: providerHealth,
            redis: this.redis.status === 'ready',
            optimization: true,
        };
    }
    start(port = 3009) {
        this.app.listen(port, () => {
            console.log(`CDN Management Service listening on port ${port}`);
            this.emit('serviceStarted', { port });
        });
    }
    async shutdown() {
        console.log('Shutting down CDN Management Service...');
        await this.redis.quit();
        for (const provider of this.providers.values()) {
            // Cleanup provider connections if needed
        }
        console.log('CDN Management Service shutdown complete');
    }
    getApp() {
        return this.app;
    }
}
exports.CDNManagementService = CDNManagementService;

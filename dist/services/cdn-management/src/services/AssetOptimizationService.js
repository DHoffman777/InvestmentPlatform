"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetOptimizationService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const events_1 = require("events");
class AssetOptimizationService extends events_1.EventEmitter {
    config;
    defaultConfig = {
        enableCompression: true,
        enableWebP: true,
        enableAVIF: false, // AVIF support is still limited
        compressionQuality: 85,
        resizeImages: true,
        maxImageWidth: 2048,
        maxImageHeight: 2048,
        stripMetadata: true,
    };
    constructor(config = {}) {
        super();
        this.config = config;
        this.config = { ...this.defaultConfig, ...config };
    }
    async optimizeAsset(buffer, contentType, request) {
        const optimizationConfig = { ...this.config, ...request.optimizations };
        try {
            if (this.isImageType(contentType)) {
                return await this.optimizeImage(buffer, optimizationConfig);
            }
            else if (this.isTextType(contentType)) {
                return await this.optimizeText(buffer);
            }
            else {
                // For non-optimizable files, return original
                return {
                    original: {
                        buffer,
                        size: buffer.length,
                    },
                    savings: {
                        bytes: 0,
                        percentage: 0,
                    },
                };
            }
        }
        catch (error) {
            this.emit('optimizationError', { contentType, error });
            // Return original buffer if optimization fails
            return {
                original: {
                    buffer,
                    size: buffer.length,
                },
                savings: {
                    bytes: 0,
                    percentage: 0,
                },
            };
        }
    }
    async optimizeImage(buffer, config) {
        const originalSize = buffer.length;
        let sharpImage = (0, sharp_1.default)(buffer);
        // Get image metadata
        const metadata = await sharpImage.metadata();
        const originalFormat = metadata.format;
        this.emit('imageOptimizationStarted', {
            originalSize,
            format: originalFormat,
            dimensions: { width: metadata.width, height: metadata.height },
        });
        // Resize if needed
        if (config.resizeImages && metadata.width && metadata.height) {
            if (metadata.width > config.maxImageWidth || metadata.height > config.maxImageHeight) {
                sharpImage = sharpImage.resize(config.maxImageWidth, config.maxImageHeight, {
                    fit: 'inside',
                    withoutEnlargement: true,
                });
            }
        }
        // Strip metadata if enabled
        if (config.stripMetadata) {
            sharpImage = sharpImage.withMetadata();
        }
        const result = {
            original: {
                buffer,
                size: originalSize,
                format: originalFormat,
            },
            savings: {
                bytes: 0,
                percentage: 0,
            },
        };
        // Generate optimized version
        if (config.enableCompression) {
            let optimizedBuffer;
            if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
                optimizedBuffer = await sharpImage.jpeg({
                    quality: config.compressionQuality,
                    progressive: true,
                    mozjpeg: true,
                }).toBuffer();
            }
            else if (originalFormat === 'png') {
                optimizedBuffer = await sharpImage.png({
                    compressionLevel: 9,
                    adaptiveFiltering: true,
                    palette: true,
                }).toBuffer();
            }
            else {
                // For other formats, try to convert to JPEG
                optimizedBuffer = await sharpImage.jpeg({
                    quality: config.compressionQuality,
                    progressive: true,
                }).toBuffer();
            }
            result.optimized = {
                buffer: optimizedBuffer,
                size: optimizedBuffer.length,
                format: originalFormat === 'png' ? 'png' : 'jpeg',
                quality: config.compressionQuality,
            };
        }
        // Generate WebP version
        if (config.enableWebP) {
            try {
                const webpBuffer = await (0, sharp_1.default)(buffer)
                    .resize(config.maxImageWidth, config.maxImageHeight, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                    .webp({
                    quality: config.compressionQuality,
                    effort: 4, // Good balance of compression vs speed
                })
                    .toBuffer();
                result.webp = {
                    buffer: webpBuffer,
                    size: webpBuffer.length,
                    quality: config.compressionQuality,
                };
            }
            catch (error) {
                this.emit('webpOptimizationFailed', error);
            }
        }
        // Generate AVIF version
        if (config.enableAVIF) {
            try {
                const avifBuffer = await (0, sharp_1.default)(buffer)
                    .resize(config.maxImageWidth, config.maxImageHeight, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                    .avif({
                    quality: config.compressionQuality,
                    effort: 4,
                })
                    .toBuffer();
                result.avif = {
                    buffer: avifBuffer,
                    size: avifBuffer.length,
                    quality: config.compressionQuality,
                };
            }
            catch (error) {
                this.emit('avifOptimizationFailed', error);
            }
        }
        // Calculate savings
        const bestOptimized = [result.optimized, result.webp, result.avif]
            .filter(Boolean)
            .sort((a, b) => a.size - b.size)[0];
        if (bestOptimized) {
            result.savings = {
                bytes: originalSize - bestOptimized.size,
                percentage: ((originalSize - bestOptimized.size) / originalSize) * 100,
            };
        }
        this.emit('imageOptimizationCompleted', {
            originalSize,
            optimizedSize: bestOptimized?.size || originalSize,
            savings: result.savings,
            formats: {
                webp: !!result.webp,
                avif: !!result.avif,
            },
        });
        return result;
    }
    async optimizeText(buffer) {
        const originalSize = buffer.length;
        try {
            // For text files, we can apply basic compression
            const zlib = await Promise.resolve().then(() => __importStar(require('zlib')));
            const compressed = zlib.gzipSync(buffer, { level: 9 });
            return {
                original: {
                    buffer,
                    size: originalSize,
                },
                optimized: {
                    buffer: compressed,
                    size: compressed.length,
                    format: 'gzip',
                    quality: 100,
                },
                savings: {
                    bytes: originalSize - compressed.length,
                    percentage: ((originalSize - compressed.length) / originalSize) * 100,
                },
            };
        }
        catch (error) {
            this.emit('textOptimizationFailed', error);
            return {
                original: {
                    buffer,
                    size: originalSize,
                },
                savings: {
                    bytes: 0,
                    percentage: 0,
                },
            };
        }
    }
    isImageType(contentType) {
        return contentType.startsWith('image/') &&
            ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(contentType);
    }
    isTextType(contentType) {
        return contentType.startsWith('text/') ||
            ['application/javascript', 'application/json', 'application/xml', 'application/css'].includes(contentType);
    }
    async generateResponsiveVersions(buffer, breakpoints = [320, 768, 1024, 1920]) {
        const versions = [];
        for (const width of breakpoints) {
            try {
                const resized = await (0, sharp_1.default)(buffer)
                    .resize(width, null, {
                    withoutEnlargement: true,
                    fit: 'inside',
                })
                    .jpeg({ quality: this.config.compressionQuality || 85 })
                    .toBuffer();
                versions.push({
                    width,
                    buffer: resized,
                    size: resized.length,
                });
            }
            catch (error) {
                this.emit('responsiveVersionFailed', { width, error });
            }
        }
        return versions;
    }
    async analyzeImage(buffer) {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        const analysis = {
            format: metadata.format || 'unknown',
            width: metadata.width || 0,
            height: metadata.height || 0,
            channels: metadata.channels || 0,
            hasAlpha: metadata.hasAlpha || false,
            density: metadata.density || 72,
            colorspace: metadata.space || 'unknown',
            isAnimated: !!metadata.pages && metadata.pages > 1,
            recommendedOptimizations: [],
        };
        // Generate optimization recommendations
        if (analysis.width > 2048 || analysis.height > 2048) {
            analysis.recommendedOptimizations.push('Resize image to reduce dimensions');
        }
        if (analysis.format === 'png' && !analysis.hasAlpha) {
            analysis.recommendedOptimizations.push('Convert PNG to JPEG for better compression');
        }
        if (buffer.length > 500 * 1024) { // 500KB
            analysis.recommendedOptimizations.push('Apply aggressive compression to reduce file size');
        }
        if (analysis.format === 'jpeg' || analysis.format === 'png') {
            analysis.recommendedOptimizations.push('Generate WebP version for modern browsers');
        }
        if (analysis.density > 150) {
            analysis.recommendedOptimizations.push('Reduce image density/DPI');
        }
        return analysis;
    }
    getBestFormat(originalFormat, hasAlpha, supportedFormats = ['webp', 'avif', 'jpeg', 'png']) {
        // AVIF is the most efficient but has limited support
        if (supportedFormats.includes('avif')) {
            return 'avif';
        }
        // WebP is widely supported and efficient
        if (supportedFormats.includes('webp')) {
            return 'webp';
        }
        // For images with transparency, prefer PNG
        if (hasAlpha && supportedFormats.includes('png')) {
            return 'png';
        }
        // For photographs without transparency, prefer JPEG
        if (!hasAlpha && supportedFormats.includes('jpeg')) {
            return 'jpeg';
        }
        // Fallback to original format
        return originalFormat;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.emit('configUpdated', this.config);
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.AssetOptimizationService = AssetOptimizationService;

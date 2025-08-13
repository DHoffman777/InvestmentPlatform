import sharp from 'sharp';
import { EventEmitter } from 'events';
import { AssetOptimizationConfig, AssetMetadata, AssetUploadRequest } from '../types';

export interface OptimizationResult {
  original: {
    buffer: Buffer;
    size: number;
    format?: string;
  };
  optimized?: {
    buffer: Buffer;
    size: number;
    format: string;
    quality: number;
  };
  webp?: {
    buffer: Buffer;
    size: number;
    quality: number;
  };
  avif?: {
    buffer: Buffer;
    size: number;
    quality: number;
  };
  savings: {
    bytes: number;
    percentage: number;
  };
}

export class AssetOptimizationService extends EventEmitter {
  private defaultConfig: AssetOptimizationConfig = {
    enableCompression: true,
    enableWebP: true,
    enableAVIF: false, // AVIF support is still limited
    compressionQuality: 85,
    resizeImages: true,
    maxImageWidth: 2048,
    maxImageHeight: 2048,
    stripMetadata: true,
  };

  constructor(private config: Partial<AssetOptimizationConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };
  }

  async optimizeAsset(
    buffer: Buffer,
    contentType: string,
    request: AssetUploadRequest
  ): Promise<OptimizationResult> {
    const optimizationConfig = { ...this.config, ...request.optimizations };
    
    try {
      if (this.isImageType(contentType)) {
        return await this.optimizeImage(buffer, optimizationConfig);
      } else if (this.isTextType(contentType)) {
        return await this.optimizeText(buffer);
      } else {
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
    } catch (error) {
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

  private async optimizeImage(
    buffer: Buffer,
    config: AssetOptimizationConfig
  ): Promise<OptimizationResult> {
    const originalSize = buffer.length;
    let sharpImage = sharp(buffer);

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
      sharpImage = sharpImage.withMetadata(false);
    }

    const result: OptimizationResult = {
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
      let optimizedBuffer: Buffer;
      
      if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
        optimizedBuffer = await sharpImage.jpeg({ 
          quality: config.compressionQuality,
          progressive: true,
          mozjpeg: true,
        }).toBuffer();
      } else if (originalFormat === 'png') {
        optimizedBuffer = await sharpImage.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true,
        }).toBuffer();
      } else {
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
        const webpBuffer = await sharp(buffer)
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
      } catch (error) {
        this.emit('webpOptimizationFailed', error);
      }
    }

    // Generate AVIF version
    if (config.enableAVIF) {
      try {
        const avifBuffer = await sharp(buffer)
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
      } catch (error) {
        this.emit('avifOptimizationFailed', error);
      }
    }

    // Calculate savings
    const bestOptimized = [result.optimized, result.webp, result.avif]
      .filter(Boolean)
      .sort((a, b) => a!.size - b!.size)[0];

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

  private async optimizeText(buffer: Buffer): Promise<OptimizationResult> {
    const originalSize = buffer.length;
    
    try {
      // For text files, we can apply basic compression
      const zlib = await import('zlib');
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
    } catch (error) {
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

  private isImageType(contentType: string): boolean {
    return contentType.startsWith('image/') && 
           ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(contentType);
  }

  private isTextType(contentType: string): boolean {
    return contentType.startsWith('text/') || 
           ['application/javascript', 'application/json', 'application/xml', 'application/css'].includes(contentType);
  }

  async generateResponsiveVersions(
    buffer: Buffer,
    breakpoints: number[] = [320, 768, 1024, 1920]
  ): Promise<Array<{ width: number; buffer: Buffer; size: number }>> {
    const versions: Array<{ width: number; buffer: Buffer; size: number }> = [];

    for (const width of breakpoints) {
      try {
        const resized = await sharp(buffer)
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
      } catch (error) {
        this.emit('responsiveVersionFailed', { width, error });
      }
    }

    return versions;
  }

  async analyzeImage(buffer: Buffer): Promise<{
    format: string;
    width: number;
    height: number;
    channels: number;
    hasAlpha: boolean;
    density: number;
    colorspace: string;
    isAnimated: boolean;
    recommendedOptimizations: string[];
  }> {
    const metadata = await sharp(buffer).metadata();
    
    const analysis = {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      channels: metadata.channels || 0,
      hasAlpha: metadata.hasAlpha || false,
      density: metadata.density || 72,
      colorspace: metadata.space || 'unknown',
      isAnimated: !!metadata.pages && metadata.pages > 1,
      recommendedOptimizations: [] as string[],
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

  getBestFormat(
    originalFormat: string,
    hasAlpha: boolean,
    supportedFormats: string[] = ['webp', 'avif', 'jpeg', 'png']
  ): string {
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

  updateConfig(newConfig: Partial<AssetOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  getConfig(): AssetOptimizationConfig {
    return { ...this.config } as AssetOptimizationConfig;
  }
}
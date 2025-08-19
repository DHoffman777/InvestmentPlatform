import { EventEmitter } from 'events';
import { AssetOptimizationConfig, AssetUploadRequest } from '../types';
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
export declare class AssetOptimizationService extends EventEmitter {
    private config;
    private defaultConfig;
    constructor(config?: Partial<AssetOptimizationConfig>);
    optimizeAsset(buffer: Buffer, contentType: string, request: AssetUploadRequest): Promise<OptimizationResult>;
    private optimizeImage;
    private optimizeText;
    private isImageType;
    private isTextType;
    generateResponsiveVersions(buffer: Buffer, breakpoints?: number[]): Promise<Array<{
        width: number;
        buffer: Buffer;
        size: number;
    }>>;
    analyzeImage(buffer: Buffer): Promise<{
        format: string;
        width: number;
        height: number;
        channels: number;
        hasAlpha: boolean;
        density: number;
        colorspace: string;
        isAnimated: boolean;
        recommendedOptimizations: string[];
    }>;
    getBestFormat(originalFormat: string, hasAlpha: boolean, supportedFormats?: string[]): string;
    updateConfig(newConfig: Partial<AssetOptimizationConfig>): void;
    getConfig(): AssetOptimizationConfig;
}

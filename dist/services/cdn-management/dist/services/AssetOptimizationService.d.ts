export const __esModule: boolean;
export class AssetOptimizationService extends events_1<[never]> {
    constructor(config?: {});
    config: {
        enableCompression: boolean;
        enableWebP: boolean;
        enableAVIF: boolean;
        compressionQuality: number;
        resizeImages: boolean;
        maxImageWidth: number;
        maxImageHeight: number;
        stripMetadata: boolean;
    };
    defaultConfig: {
        enableCompression: boolean;
        enableWebP: boolean;
        enableAVIF: boolean;
        compressionQuality: number;
        resizeImages: boolean;
        maxImageWidth: number;
        maxImageHeight: number;
        stripMetadata: boolean;
    };
    optimizeAsset(buffer: any, contentType: any, request: any): Promise<{
        original: {
            buffer: any;
            size: any;
            format: any;
        };
        savings: {
            bytes: number;
            percentage: number;
        };
    } | {
        original: {
            buffer: any;
            size: any;
        };
        optimized: {
            buffer: any;
            size: any;
            format: string;
            quality: number;
        };
        savings: {
            bytes: number;
            percentage: number;
        };
    } | {
        original: {
            buffer: any;
            size: any;
        };
        savings: {
            bytes: number;
            percentage: number;
        };
        optimized?: undefined;
    }>;
    optimizeImage(buffer: any, config: any): Promise<{
        original: {
            buffer: any;
            size: any;
            format: any;
        };
        savings: {
            bytes: number;
            percentage: number;
        };
    }>;
    optimizeText(buffer: any): Promise<{
        original: {
            buffer: any;
            size: any;
        };
        optimized: {
            buffer: any;
            size: any;
            format: string;
            quality: number;
        };
        savings: {
            bytes: number;
            percentage: number;
        };
    } | {
        original: {
            buffer: any;
            size: any;
        };
        savings: {
            bytes: number;
            percentage: number;
        };
        optimized?: undefined;
    }>;
    isImageType(contentType: any): boolean;
    isTextType(contentType: any): any;
    generateResponsiveVersions(buffer: any, breakpoints?: number[]): Promise<{
        width: number;
        buffer: any;
        size: any;
    }[]>;
    analyzeImage(buffer: any): Promise<{
        format: any;
        width: any;
        height: any;
        channels: any;
        hasAlpha: any;
        density: any;
        colorspace: any;
        isAnimated: boolean;
        recommendedOptimizations: any[];
    }>;
    getBestFormat(originalFormat: any, hasAlpha: any, supportedFormats?: string[]): any;
    updateConfig(newConfig: any): void;
    getConfig(): {
        enableCompression: boolean;
        enableWebP: boolean;
        enableAVIF: boolean;
        compressionQuality: number;
        resizeImages: boolean;
        maxImageWidth: number;
        maxImageHeight: number;
        stripMetadata: boolean;
    };
}
import events_1 = require("events");

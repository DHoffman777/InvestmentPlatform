import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../../utils/kafka-mock';
import { OCRResult, Language } from '../../models/documentManagement/DocumentManagement';
export interface OCRRequest {
    documentId: string;
    tenantId: string;
    filePath: string;
    language?: Language;
    enablePreprocessing: boolean;
    enablePostProcessing: boolean;
    ocrEngine: 'TESSERACT' | 'AWS_TEXTRACT' | 'GOOGLE_VISION' | 'AZURE_COGNITIVE' | 'CUSTOM_ML';
    confidence: number;
    dpi?: number;
    preprocessingOptions?: PreprocessingOptions;
    postprocessingOptions?: PostprocessingOptions;
}
export interface PreprocessingOptions {
    deskew: boolean;
    denoise: boolean;
    enhanceContrast: boolean;
    correctRotation: boolean;
    removeBackground: boolean;
    sharpen: boolean;
    binarize: boolean;
    scaleImage: boolean;
    targetDPI?: number;
}
export interface PostprocessingOptions {
    spellCheck: boolean;
    languageModel: boolean;
    contextualCorrection: boolean;
    confidenceFiltering: boolean;
    minWordConfidence: number;
    minLineConfidence: number;
    removeNoiseCharacters: boolean;
    formatText: boolean;
}
export interface MLModelConfig {
    modelType: 'TRANSFORMER' | 'CNN' | 'RNN' | 'HYBRID';
    modelPath: string;
    vocabularyPath?: string;
    configPath?: string;
    device: 'CPU' | 'GPU' | 'TPU';
    batchSize: number;
    maxSequenceLength: number;
    confidenceThreshold: number;
}
export declare class OCRService {
    private prisma;
    private logger;
    private kafkaService;
    private mlModels;
    private supportedLanguages;
    private processingQueue;
    constructor(prisma: PrismaClient, logger: Logger, kafkaService: KafkaService);
    performOCR(request: OCRRequest): Promise<OCRResult[]>;
    private processPage;
    private processTesseractOCR;
    private processAWSTextract;
    private processGoogleVision;
    private processAzureCognitive;
    private processCustomML;
    private preprocessImage;
    private postprocessOCRResult;
    private performSpellCheck;
    private applyLanguageModel;
    private performContextualCorrection;
    private removeNoiseCharacters;
    private formatText;
    private recalculateConfidence;
    private convertTesseractToOCRResult;
    private convertTextractToOCRResult;
    private convertTextractBoundingBox;
    private convertGoogleVisionToOCRResult;
    private convertGoogleVisionBoundingBox;
    private convertAzureCognitiveToOCRResult;
    private convertAzureBoundingBox;
    private convertMLPredictionToOCRResult;
    private decodePredictions;
    private mapToTesseractLanguage;
    private mapFromTesseractLanguage;
    private initializeMLModels;
    private createProcessingJob;
    private updateJobStatus;
    private updateJobProgress;
    private getDocument;
    private storeOCRResults;
    private publishOCRCompletedEvent;
}

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../../utils/kafka-mock';
import { DocumentTemplate, DocumentType, Language, BoundingBox, OCRResult } from '../../models/documentManagement/DocumentManagement';
export interface TemplateRecognitionRequest {
    documentId: string;
    tenantId: string;
    ocrResults: OCRResult[];
    expectedDocumentType?: DocumentType;
    language: Language;
    confidence: number;
    customTemplates?: DocumentTemplate[];
}
export interface TemplateRecognitionResult {
    documentId: string;
    recognizedTemplate?: DocumentTemplate;
    confidence: number;
    alternativeTemplates: AlternativeTemplate[];
    classificationScores: ClassificationScore[];
    recognitionMethod: 'LAYOUT_BASED' | 'KEYWORD_BASED' | 'ML_BASED' | 'HYBRID';
    metadata: RecognitionMetadata;
}
export interface AlternativeTemplate {
    template: DocumentTemplate;
    confidence: number;
    matchingPatterns: string[];
}
export interface ClassificationScore {
    documentType: DocumentType;
    confidence: number;
    matchingFeatures: string[];
}
export interface RecognitionMetadata {
    processingTime: number;
    patternsEvaluated: number;
    featuresExtracted: number;
    layoutAnalysisTime: number;
    keywordAnalysisTime: number;
    mlInferenceTime: number;
    recognizedAt: Date;
}
export interface LayoutFeature {
    type: 'HEADER' | 'FOOTER' | 'TABLE' | 'LOGO' | 'SIGNATURE' | 'FORM_FIELD' | 'BARCODE' | 'QR_CODE' | 'TEXT_BLOCK';
    boundingBox: BoundingBox;
    confidence: number;
    text?: string;
    metadata?: Record<string, any>;
}
export interface KeywordMatch {
    keyword: string;
    position: BoundingBox;
    confidence: number;
    context: string;
    importance: number;
}
export interface DocumentStructure {
    headers: LayoutFeature[];
    footers: LayoutFeature[];
    tables: LayoutFeature[];
    forms: LayoutFeature[];
    signatures: LayoutFeature[];
    logos: LayoutFeature[];
    barcodes: LayoutFeature[];
    textBlocks: LayoutFeature[];
    images: LayoutFeature[];
}
export interface TemplateMatchingScore {
    templateId: string;
    totalScore: number;
    layoutScore: number;
    keywordScore: number;
    structureScore: number;
    contentScore: number;
    confidenceScore: number;
    penaltyScore: number;
}
export declare class TemplateRecognitionService {
    private prisma;
    private logger;
    private kafkaService;
    private templates;
    private mlModels;
    private keywordDictionaries;
    private layoutPatterns;
    constructor(prisma: PrismaClient, logger: Logger, kafkaService: KafkaService);
    recognizeTemplate(request: TemplateRecognitionRequest): Promise<TemplateRecognitionResult>;
    private analyzeDocumentStructure;
    private detectHeaders;
    private detectFooters;
    private detectTables;
    private detectFormFields;
    private detectSignatures;
    private detectLogos;
    private detectBarcodes;
    private detectTextBlocks;
    private isHeaderText;
    private isFooterText;
    private isCompanyName;
    private extractKeywords;
    private performLayoutBasedRecognition;
    private performKeywordBasedRecognition;
    private performMLBasedRecognition;
    private combineRecognitionScores;
    private generateClassificationScores;
    private matchLayoutPattern;
    private extractMLFeatures;
    private getMatchingPatterns;
    private initializeTemplateRecognition;
    private loadDefaultTemplates;
    private initializeMLModels;
    private publishTemplateRecognitionEvent;
}

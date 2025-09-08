import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../../utils/kafka-mock';
import { DocumentTemplate, ExtractionRule, AlternativeValue, ValidationResult, OCRResult, BoundingBox, Language } from '../../models/documentManagement/DocumentManagement';
export interface DataExtractionRequest {
    documentId: string;
    tenantId: string;
    template?: DocumentTemplate;
    ocrResults: OCRResult[];
    language: Language;
    customExtractionRules?: ExtractionRule[];
    enableValidation: boolean;
    enablePostProcessing: boolean;
    confidence: number;
}
export interface FieldExtractionResult {
    fieldName: string;
    value: any;
    confidence: number;
    source: 'OCR' | 'NLP' | 'ML_MODEL' | 'REGEX' | 'MANUAL';
    boundingBox?: BoundingBox;
    rawText?: string;
    alternatives: AlternativeValue[];
    validationPassed: boolean;
    validationErrors: string[];
}
export interface DataExtractionResult {
    documentId: string;
    templateId?: string;
    extractionMethod: 'TEMPLATE_BASED' | 'ML_BASED' | 'HYBRID';
    confidence: number;
    extractedFields: FieldExtractionResult[];
    validationResults: ValidationResult[];
    processingTime: number;
    metadata: ExtractionMetadata;
}
export interface ExtractionMetadata {
    fieldsExtracted: number;
    fieldsValidated: number;
    validationsPassed: number;
    validationsFailed: number;
    extractionEngine: string;
    processingSteps: string[];
    confidence: number;
    extractedAt: Date;
    extractedBy: string;
}
export interface NLPExtractionResult {
    entities: NLPEntity[];
    relations: NLPRelation[];
    sentiments: NLPSentiment[];
    keywords: NLPKeyword[];
    confidence: number;
}
export interface NLPEntity {
    text: string;
    label: string;
    confidence: number;
    startOffset: number;
    endOffset: number;
    boundingBox?: BoundingBox;
}
export interface NLPRelation {
    head: NLPEntity;
    tail: NLPEntity;
    relation: string;
    confidence: number;
}
export interface NLPSentiment {
    text: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    confidence: number;
}
export interface NLPKeyword {
    text: string;
    relevance: number;
    frequency: number;
    context: string;
}
export interface MLExtractionModel {
    modelType: 'NAMED_ENTITY_RECOGNITION' | 'RELATION_EXTRACTION' | 'CLASSIFICATION' | 'CUSTOM';
    modelPath: string;
    confidence: number;
    supportedFields: string[];
}
export declare class DataExtractionService {
    private prisma;
    private logger;
    private kafkaService;
    private nlpEngine;
    private mlModels;
    private fieldProcessors;
    private validationEngine;
    constructor(prisma: PrismaClient, logger: Logger, kafkaService: KafkaService);
    extractData(request: DataExtractionRequest): Promise<DataExtractionResult>;
    private performTemplateBasedExtraction;
    private performCustomRulesExtraction;
    private extractFieldUsingRule;
    private extractUsingRegex;
    private extractUsingOCRRegion;
    private extractUsingNLP;
    private extractUsingMLModel;
    private performNLPExtraction;
    private performMLBasedExtraction;
    private performPostProcessing;
    private performValidation;
    private validateField;
    private performBasicValidation;
    private mergeExtractedFields;
    private processFieldValue;
    private parseDate;
    private isWithinBounds;
    private mapExtractionMethodToSource;
    private inferFieldType;
    private extractMLFeatures;
    private predictFieldValue;
    private executeCustomValidation;
    private isFieldTypeConsistent;
    private getDefaultValidationRules;
    private initializeDataExtraction;
    private initializeNLPEngine;
    private mockNLPEntities;
    private loadMLModels;
    private initializeFieldProcessors;
    private publishDataExtractionEvent;
}

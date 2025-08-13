import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../infrastructure/KafkaService';
import { Language } from '../../models/documentManagement/DocumentManagement';
export interface LanguageDetectionResult {
    language: Language;
    confidence: number;
    alternativeLanguages: AlternativeLanguage[];
    isReliable: boolean;
    detectionMethod: 'CHARACTER_BASED' | 'STATISTICAL' | 'NEURAL_NETWORK' | 'HYBRID';
}
export interface AlternativeLanguage {
    language: Language;
    confidence: number;
}
export interface TranslationRequest {
    text: string;
    sourceLanguage: Language;
    targetLanguage: Language;
    preserveFormatting: boolean;
    domain?: 'FINANCIAL' | 'LEGAL' | 'TECHNICAL' | 'GENERAL';
}
export interface TranslationResult {
    translatedText: string;
    confidence: number;
    sourceLanguage: Language;
    targetLanguage: Language;
    translationMethod: 'RULE_BASED' | 'STATISTICAL' | 'NEURAL_NETWORK' | 'HYBRID';
    alternativeTranslations?: string[];
    metadata: TranslationMetadata;
}
export interface TranslationMetadata {
    processingTime: number;
    characterCount: number;
    wordCount: number;
    sentenceCount: number;
    complexityScore: number;
    qualityScore: number;
    translatedAt: Date;
}
export interface MultiLanguageProcessingRequest {
    documentId: string;
    tenantId: string;
    text: string;
    expectedLanguage?: Language;
    enableLanguageDetection: boolean;
    enableTranslation: boolean;
    targetLanguages?: Language[];
    preserveOriginalText: boolean;
    enableLanguageSpecificProcessing: boolean;
    customDictionaries?: CustomDictionary[];
}
export interface CustomDictionary {
    language: Language;
    domain: string;
    terms: DictionaryTerm[];
}
export interface DictionaryTerm {
    term: string;
    translation: string;
    context?: string;
    confidence: number;
}
export interface LanguageSpecificProcessing {
    language: Language;
    textNormalization: boolean;
    culturalAdaptation: boolean;
    numberFormatting: boolean;
    dateFormatting: boolean;
    currencyFormatting: boolean;
    addressFormatting: boolean;
    nameFormatting: boolean;
}
export interface MultiLanguageResult {
    originalText: string;
    detectedLanguage: LanguageDetectionResult;
    translations: Map<Language, TranslationResult>;
    processedVersions: Map<Language, string>;
    metadata: ProcessingMetadata;
}
export interface ProcessingMetadata {
    totalProcessingTime: number;
    languageDetectionTime: number;
    translationTime: number;
    processingTime: number;
    confidence: number;
    processedAt: Date;
    processedBy: string;
}
export declare class MultiLanguageProcessingService {
    private prisma;
    private logger;
    private kafkaService;
    private supportedLanguages;
    private languageModels;
    private translationModels;
    private customDictionaries;
    private languageDetectionEngine;
    constructor(prisma: PrismaClient, logger: Logger, kafkaService: KafkaService);
    processMultiLanguageDocument(request: MultiLanguageProcessingRequest): Promise<MultiLanguageResult>;
    detectLanguage(text: string, expectedLanguage?: Language): Promise<LanguageDetectionResult>;
    private detectLanguageCharacterBased;
    private detectLanguageStatistical;
    private detectLanguageNeuralNetwork;
    private combineDetectionResults;
    translateText(request: TranslationRequest): Promise<TranslationResult>;
    private performNeuralTranslation;
    private performStatisticalTranslation;
    private applyCustomDictionary;
    private performLanguageSpecificProcessing;
    private normalizeText;
    private formatNumbers;
    private formatDates;
    private formatCurrency;
    private performCulturalAdaptation;
    private getLanguageSpecificConfig;
    private splitIntoSentences;
    private calculateComplexityScore;
    private mapISOToLanguage;
    private mapLanguageToGoogleCode;
    private indexToLanguage;
    private initializeLanguageModels;
    private initializeLanguageDetectionEngine;
    private loadTranslationModels;
    private loadCustomDictionaries;
    private publishLanguageProcessingEvent;
}

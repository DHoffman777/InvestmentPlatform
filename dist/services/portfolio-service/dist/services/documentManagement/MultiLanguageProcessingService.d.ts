export const __esModule: boolean;
export class MultiLanguageProcessingService {
    constructor(prisma: any, logger: any, kafkaService: any);
    prisma: any;
    logger: any;
    kafkaService: any;
    supportedLanguages: Set<DocumentManagement_1.Language>;
    languageModels: Map<any, any>;
    translationModels: Map<any, any>;
    customDictionaries: Map<any, any>;
    languageDetectionEngine: any;
    processMultiLanguageDocument(request: any): Promise<{
        originalText: any;
        detectedLanguage: {
            language: any;
            confidence: number;
            alternativeLanguages: {
                language: any;
                confidence: any;
            }[];
            isReliable: boolean;
            detectionMethod: string;
        };
        translations: Map<any, any>;
        processedVersions: Map<any, any>;
        metadata: {
            totalProcessingTime: number;
            languageDetectionTime: number;
            translationTime: number;
            processingTime: number;
            confidence: number;
            processedAt: Date;
            processedBy: string;
        };
    }>;
    detectLanguage(text: any, expectedLanguage: any): Promise<{
        language: any;
        confidence: number;
        alternativeLanguages: {
            language: any;
            confidence: any;
        }[];
        isReliable: boolean;
        detectionMethod: string;
    }>;
    detectLanguageCharacterBased(text: any): Promise<{
        language: any;
        confidence: any;
        alternativeLanguages: {
            language: any;
            confidence: any;
        }[];
        isReliable: boolean;
        detectionMethod: string;
    }>;
    detectLanguageStatistical(text: any): Promise<{
        language: any;
        confidence: any;
        alternativeLanguages: any;
        isReliable: boolean;
        detectionMethod: string;
    }>;
    detectLanguageNeuralNetwork(text: any): Promise<{
        language: any;
        confidence: any;
        alternativeLanguages: any;
        isReliable: boolean;
        detectionMethod: string;
    }>;
    combineDetectionResults(results: any, expectedLanguage: any): Promise<{
        language: any;
        confidence: number;
        alternativeLanguages: {
            language: any;
            confidence: any;
        }[];
        isReliable: boolean;
        detectionMethod: string;
    }>;
    translateText(request: any): Promise<any>;
    performNeuralTranslation(request: any, model: any): Promise<{
        translatedText: string;
        confidence: number;
        sourceLanguage: any;
        targetLanguage: any;
        translationMethod: string;
        metadata: {
            processingTime: number;
            characterCount: number;
            wordCount: number;
            sentenceCount: any;
            complexityScore: number;
            qualityScore: number;
            translatedAt: Date;
        };
    }>;
    performStatisticalTranslation(request: any): Promise<{
        translatedText: any;
        confidence: number;
        sourceLanguage: any;
        targetLanguage: any;
        translationMethod: string;
        metadata: {
            processingTime: number;
            characterCount: any;
            wordCount: any;
            sentenceCount: any;
            complexityScore: number;
            qualityScore: number;
            translatedAt: Date;
        };
    }>;
    applyCustomDictionary(result: any, dictionary: any): Promise<any>;
    performLanguageSpecificProcessing(text: any, language: any, config: any): Promise<any>;
    normalizeText(text: any, language: any): any;
    formatNumbers(text: any, language: any): any;
    formatDates(text: any, language: any): any;
    formatCurrency(text: any, language: any): any;
    performCulturalAdaptation(text: any, language: any): any;
    getLanguageSpecificConfig(language: any): {
        language: any;
        textNormalization: boolean;
        culturalAdaptation: boolean;
        numberFormatting: boolean;
        dateFormatting: boolean;
        currencyFormatting: boolean;
        addressFormatting: boolean;
        nameFormatting: boolean;
    };
    splitIntoSentences(text: any): any;
    calculateComplexityScore(text: any): number;
    mapISOToLanguage(isoCode: any): any;
    mapLanguageToGoogleCode(language: any): any;
    indexToLanguage(index: any): DocumentManagement_1.Language;
    initializeLanguageModels(): Promise<void>;
    initializeLanguageDetectionEngine(): Promise<void>;
    loadTranslationModels(): Promise<void>;
    loadCustomDictionaries(): Promise<void>;
    publishLanguageProcessingEvent(documentId: any, tenantId: any, result: any): Promise<void>;
}
import DocumentManagement_1 = require("../../models/documentManagement/DocumentManagement");

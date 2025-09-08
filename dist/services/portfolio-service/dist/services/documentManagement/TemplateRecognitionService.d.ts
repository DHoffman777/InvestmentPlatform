export const __esModule: boolean;
export class TemplateRecognitionService {
    constructor(prisma: any, logger: any, kafkaService: any);
    prisma: any;
    logger: any;
    kafkaService: any;
    templates: Map<any, any>;
    mlModels: Map<any, any>;
    keywordDictionaries: Map<any, any>;
    layoutPatterns: Map<any, any>;
    recognizeTemplate(request: any): Promise<{
        documentId: any;
        recognizedTemplate: any;
        confidence: any;
        alternativeTemplates: {
            template: any;
            confidence: any;
            matchingPatterns: string[];
        }[];
        classificationScores: {
            documentType: any;
            confidence: any;
            matchingFeatures: any;
        }[];
        recognitionMethod: string;
        metadata: {
            processingTime: number;
            patternsEvaluated: any;
            featuresExtracted: number;
            layoutAnalysisTime: number;
            keywordAnalysisTime: number;
            mlInferenceTime: number;
            recognizedAt: Date;
        };
    }>;
    analyzeDocumentStructure(ocrResults: any): Promise<{
        headers: any[];
        footers: any[];
        tables: any[];
        forms: any[];
        signatures: any[];
        logos: any[];
        barcodes: any[];
        textBlocks: any[];
        images: any[];
    }>;
    detectHeaders(ocrResult: any): {
        type: string;
        boundingBox: any;
        confidence: number;
        text: any;
        metadata: {
            patterns: string[];
        };
    }[];
    detectFooters(ocrResult: any): {
        type: string;
        boundingBox: any;
        confidence: number;
        text: any;
        metadata: {
            patterns: string[];
        };
    }[];
    detectTables(ocrResult: any): {
        type: string;
        boundingBox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        confidence: number;
        metadata: {
            rows: number;
            columns: number;
        };
    }[];
    detectFormFields(ocrResult: any): {
        type: string;
        boundingBox: any;
        confidence: number;
        text: any;
        metadata: {
            pattern: string;
        };
    }[];
    detectSignatures(ocrResult: any): {
        type: string;
        boundingBox: any;
        confidence: number;
        text: any;
        metadata: {
            keyword: string;
        };
    }[];
    detectLogos(ocrResult: any): {
        type: string;
        boundingBox: any;
        confidence: number;
        text: any;
        metadata: {
            indicators: string[];
        };
    }[];
    detectBarcodes(ocrResult: any): {
        type: string;
        boundingBox: any;
        confidence: number;
        text: any;
    }[];
    detectTextBlocks(ocrResult: any): any;
    isHeaderText(text: any): {
        confidence: number;
        patterns: string[];
    };
    isFooterText(text: any): {
        confidence: number;
        patterns: string[];
    };
    isCompanyName(text: any): {
        confidence: number;
        indicators: string[];
    };
    extractKeywords(ocrResults: any, language: any): Promise<{
        keyword: any;
        position: any;
        confidence: any;
        context: any;
        importance: any;
    }[]>;
    performLayoutBasedRecognition(structure: any, templates: any): Promise<{
        templateId: any;
        totalScore: number;
        layoutScore: number;
        keywordScore: number;
        structureScore: number;
        contentScore: number;
        confidenceScore: number;
        penaltyScore: number;
    }[]>;
    performKeywordBasedRecognition(keywordMatches: any, templates: any): Promise<{
        templateId: any;
        totalScore: number;
        layoutScore: number;
        keywordScore: number;
        structureScore: number;
        contentScore: number;
        confidenceScore: number;
        penaltyScore: number;
    }[]>;
    performMLBasedRecognition(ocrResults: any, templates: any): Promise<any[]>;
    combineRecognitionScores(layoutScores: any, keywordScores: any, mlScores: any, expectedType: any): Promise<any[]>;
    generateClassificationScores(templateScores: any, structure: any, keywordMatches: any): Promise<{
        documentType: any;
        confidence: any;
        matchingFeatures: any;
    }[]>;
    matchLayoutPattern(pattern: any, structure: any): 0 | 1;
    extractMLFeatures(ocrResults: any): any[];
    getMatchingPatterns(score: any, template: any): string[];
    initializeTemplateRecognition(): Promise<void>;
    loadDefaultTemplates(): Promise<void>;
    initializeMLModels(): Promise<void>;
    publishTemplateRecognitionEvent(documentId: any, tenantId: any, result: any): Promise<void>;
}

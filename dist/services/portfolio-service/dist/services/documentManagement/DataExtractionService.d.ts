export const __esModule: boolean;
export class DataExtractionService {
    constructor(prisma: any, logger: any, kafkaService: any);
    prisma: any;
    logger: any;
    kafkaService: any;
    nlpEngine: any;
    mlModels: Map<any, any>;
    fieldProcessors: Map<any, any>;
    validationEngine: any;
    extractData(request: any): Promise<{
        documentId: any;
        templateId: any;
        extractionMethod: string;
        confidence: number;
        extractedFields: any[];
        validationResults: any[];
        processingTime: number;
        metadata: {
            fieldsExtracted: number;
            fieldsValidated: number;
            validationsPassed: number;
            validationsFailed: number;
            extractionEngine: string;
            processingSteps: string[];
            confidence: number;
            extractedAt: Date;
            extractedBy: string;
        };
    }>;
    performTemplateBasedExtraction(ocrResults: any, template: any, language: any): Promise<{
        fieldName: any;
        value: any;
        confidence: number;
        source: string;
        boundingBox: any;
        rawText: string;
        alternatives: any[];
        validationPassed: boolean;
        validationErrors: any[];
    }[]>;
    performCustomRulesExtraction(ocrResults: any, rules: any, language: any): Promise<{
        fieldName: any;
        value: any;
        confidence: number;
        source: string;
        boundingBox: any;
        rawText: string;
        alternatives: any[];
        validationPassed: boolean;
        validationErrors: any[];
    }[]>;
    extractFieldUsingRule(ocrResults: any, rule: any, language: any): Promise<{
        fieldName: any;
        value: any;
        confidence: number;
        source: string;
        boundingBox: any;
        rawText: string;
        alternatives: any[];
        validationPassed: boolean;
        validationErrors: any[];
    }>;
    extractUsingRegex(ocrResults: any, rule: any): {
        value: any;
        confidence: number;
        boundingBox: any;
        rawText: any;
    };
    extractUsingOCRRegion(ocrResults: any, rule: any): {
        value: any;
        confidence: any;
        boundingBox: any;
        rawText: any;
    };
    extractUsingNLP(ocrResults: any, rule: any, language: any): Promise<{
        value: any;
        confidence: any;
        alternatives: any;
    }>;
    extractUsingMLModel(ocrResults: any, rule: any, language: any): Promise<{
        value: string | number | Date;
        confidence: number;
        alternatives: any[];
    }>;
    performNLPExtraction(ocrResults: any, language: any): Promise<any[]>;
    performMLBasedExtraction(ocrResults: any, language: any): Promise<any[]>;
    performPostProcessing(fields: any, language: any): Promise<any[]>;
    performValidation(fields: any, template: any): Promise<({
        fieldName: any;
        isValid: boolean;
        severity: string;
        validatedAt: Date;
        errorMessage?: undefined;
    } | {
        fieldName: any;
        isValid: any;
        errorMessage: any;
        severity: any;
        validatedAt: Date;
    })[]>;
    validateField(field: any, rule: any): Promise<any>;
    performBasicValidation(field: any): Promise<({
        fieldName: any;
        isValid: boolean;
        errorMessage: string;
        severity: string;
        validatedAt: Date;
    } | {
        fieldName: any;
        isValid: boolean;
        severity: string;
        validatedAt: Date;
        errorMessage?: undefined;
    })[]>;
    mergeExtractedFields(existing: any, additional: any): any[];
    processFieldValue(value: any, fieldType: any): any;
    parseDate(dateStr: any): Date;
    isWithinBounds(regionBox: any, targetBox: any): boolean;
    mapExtractionMethodToSource(method: any): "REGEX" | "ML_MODEL" | "NLP" | "OCR";
    inferFieldType(fieldName: any): any;
    extractMLFeatures(text: any, fieldName: any): any[];
    predictFieldValue(model: any, features: any, fieldType: any): Promise<{
        value: string | number | Date;
        confidence: number;
        alternatives: any[];
    }>;
    executeCustomValidation(field: any, rule: any): Promise<any>;
    isFieldTypeConsistent(field: any): boolean;
    getDefaultValidationRules(): {
        id: string;
        fieldName: string;
        ruleType: string;
        rule: string;
        errorMessage: string;
        severity: string;
    }[];
    initializeDataExtraction(): Promise<void>;
    initializeNLPEngine(): Promise<void>;
    mockNLPEntities(text: any): {
        text: string;
        label: string;
        confidence: number;
        startOffset: number;
        endOffset: number;
    }[];
    loadMLModels(): Promise<void>;
    initializeFieldProcessors(): Promise<void>;
    publishDataExtractionEvent(documentId: any, tenantId: any, result: any): Promise<void>;
}

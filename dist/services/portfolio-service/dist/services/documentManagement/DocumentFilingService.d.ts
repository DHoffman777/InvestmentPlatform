export const __esModule: boolean;
export class DocumentFilingService {
    constructor(prisma: any, logger: any, kafkaService: any);
    prisma: any;
    logger: any;
    kafkaService: any;
    filingRules: Map<any, any>;
    directoryTemplates: Map<any, any>;
    classificationEngine: any;
    taggingEngine: any;
    fileSystemManager: any;
    fileDocument(request: any): Promise<{
        documentId: any;
        filingPath: any;
        appliedRules: {
            ruleId: any;
            ruleName: any;
            matchedConditions: any[];
            executedActions: any[];
            executionTime: number;
        }[];
        generatedTags: any[];
        updatedClassification: any;
        updatedMetadata: any;
        directoryStructure: ({
            name: any;
            path: string;
            type: string;
            metadata: {
                created: Date;
                documentCount: number;
                size?: undefined;
                mimeType?: undefined;
                documentId?: undefined;
            };
        } | {
            name: any;
            path: any;
            type: string;
            metadata: {
                size: any;
                mimeType: any;
                documentId: any;
                created?: undefined;
                documentCount?: undefined;
            };
        })[];
        processingTime: number;
        filingStatus: string;
        errors: string[];
        metadata: {
            filingMethod: string;
            confidenceScore: number;
            rulesEvaluated: number;
            rulesMatched: number;
            tagsGenerated: number;
            directoryDepth: any;
            filedAt: Date;
            filedBy: string;
        };
    }>;
    performAutoClassification(document: any, extractedData: any): Promise<{
        documentType: any;
        confidence: any;
        classification: any;
        reasoning: any;
        alternativeTypes: any;
    }>;
    performRuleBasedClassification(document: any, extractedData: any): {
        documentType: DocumentManagement_1.DocumentType;
        confidence: number;
        classification: any;
        reasoning: string[];
        alternativeTypes: {
            type: DocumentManagement_1.DocumentType;
            confidence: number;
        }[];
    };
    generateTags(document: any, extractedData: any): Promise<{
        tags: any[];
        confidence: number;
        method: string;
    }>;
    extractKeywordTags(document: any): {
        tag: any;
        confidence: number;
        source: string;
        relevance: number;
    }[];
    extractDataTags(extractedData: any): {
        tag: any;
        confidence: any;
        source: string;
        relevance: any;
    }[];
    extractMetadataTags(document: any): {
        tag: string;
        confidence: number;
        source: string;
        relevance: number;
    }[];
    generateNLPTags(document: any): Promise<any[]>;
    deduplicateTags(tags: any): any[];
    getApplicableRules(document: any, customRules: any): Promise<any[]>;
    evaluateRuleConditions(rule: any, document: any, extractedData: any): Promise<any[]>;
    evaluateCondition(condition: any, document: any, extractedData: any): Promise<boolean>;
    getFieldValue(fieldPath: any, document: any, extractedData: any): any;
    executeRuleActions(rule: any, document: any, metadata: any): Promise<any[]>;
    executeAction(action: any, document: any, metadata: any): Promise<void>;
    generateFilingPath(document: any, classification: any, appliedRules: any, targetDirectory: any): Promise<any>;
    createDirectoryStructure(filePath: any, document: any): Promise<({
        name: any;
        path: string;
        type: string;
        metadata: {
            created: Date;
            documentCount: number;
            size?: undefined;
            mimeType?: undefined;
            documentId?: undefined;
        };
    } | {
        name: any;
        path: any;
        type: string;
        metadata: {
            size: any;
            mimeType: any;
            documentId: any;
            created?: undefined;
            documentCount?: undefined;
        };
    })[]>;
    moveDocumentToPath(document: any, targetPath: any): Promise<void>;
    updateDocumentRecord(documentId: any, updates: any): Promise<void>;
    determineFilingMethod(appliedRules: any, classification: any): "HYBRID" | "TEMPLATE_BASED" | "ML_BASED" | "RULE_BASED";
    calculateConfidenceScore(appliedRules: any, classification: any, tagging: any): number;
    inferDocumentClassification(documentType: any): any;
    extractClassificationFeatures(document: any, extractedData: any): any[];
    sendNotification(parameters: any, document: any): Promise<void>;
    triggerWorkflow(parameters: any, document: any): Promise<void>;
    initializeFilingService(): Promise<void>;
    loadDefaultFilingRules(): Promise<void>;
    loadDirectoryTemplates(): Promise<void>;
    initializeEngines(): Promise<void>;
    publishFilingEvent(documentId: any, tenantId: any, result: any): Promise<void>;
}
import DocumentManagement_1 = require("../../models/documentManagement/DocumentManagement");

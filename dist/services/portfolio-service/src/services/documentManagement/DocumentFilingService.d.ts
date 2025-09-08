import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { Document, DocumentType, DocumentClassification, ExtractedData } from '../../models/documentManagement/DocumentManagement';
export interface FilingRequest {
    documentId: string;
    tenantId: string;
    document: Document;
    extractedData?: ExtractedData;
    customFilingRules?: FilingRule[];
    enableAutoClassification: boolean;
    enableAutoTagging: boolean;
    targetDirectory?: string;
}
export interface FilingRule {
    id: string;
    name: string;
    description: string;
    conditions: FilingCondition[];
    actions: FilingAction[];
    priority: number;
    isActive: boolean;
    applicableDocumentTypes: DocumentType[];
}
export interface FilingCondition {
    field: string;
    operator: 'EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX' | 'GREATER_THAN' | 'LESS_THAN' | 'EXISTS';
    value: any;
    caseSensitive: boolean;
}
export interface FilingAction {
    type: 'MOVE_TO_DIRECTORY' | 'ADD_TAG' | 'SET_CLASSIFICATION' | 'UPDATE_METADATA' | 'SEND_NOTIFICATION' | 'TRIGGER_WORKFLOW';
    parameters: Record<string, any>;
}
export interface FilingResult {
    documentId: string;
    filingPath: string;
    appliedRules: AppliedRule[];
    generatedTags: string[];
    updatedClassification?: DocumentClassification;
    updatedMetadata: Record<string, any>;
    directoryStructure: DirectoryNode[];
    processingTime: number;
    filingStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    errors: string[];
    metadata: FilingMetadata;
}
export interface AppliedRule {
    ruleId: string;
    ruleName: string;
    matchedConditions: string[];
    executedActions: string[];
    executionTime: number;
}
export interface DirectoryNode {
    name: string;
    path: string;
    type: 'FOLDER' | 'FILE';
    children?: DirectoryNode[];
    metadata?: Record<string, any>;
}
export interface FilingMetadata {
    filingMethod: 'RULE_BASED' | 'ML_BASED' | 'TEMPLATE_BASED' | 'HYBRID';
    confidenceScore: number;
    rulesEvaluated: number;
    rulesMatched: number;
    tagsGenerated: number;
    directoryDepth: number;
    filedAt: Date;
    filedBy: string;
}
export interface AutoClassificationResult {
    documentType: DocumentType;
    confidence: number;
    classification: DocumentClassification;
    reasoning: string[];
    alternativeTypes: {
        type: DocumentType;
        confidence: number;
    }[];
}
export interface TagGenerationResult {
    tags: GeneratedTag[];
    confidence: number;
    method: 'KEYWORD_EXTRACTION' | 'NLP_ANALYSIS' | 'ML_CLASSIFICATION' | 'CONTENT_ANALYSIS';
}
export interface GeneratedTag {
    tag: string;
    confidence: number;
    source: 'CONTENT' | 'METADATA' | 'EXTRACTED_DATA' | 'RULE_BASED';
    relevance: number;
}
export declare class DocumentFilingService {
    private prisma;
    private logger;
    private kafkaService;
    private filingRules;
    private directoryTemplates;
    private classificationEngine;
    private taggingEngine;
    private fileSystemManager;
    constructor(prisma: PrismaClient, logger: Logger, kafkaService: any);
    fileDocument(request: FilingRequest): Promise<FilingResult>;
    private performAutoClassification;
    private performRuleBasedClassification;
    private generateTags;
    private extractKeywordTags;
    private extractDataTags;
    private extractMetadataTags;
    private generateNLPTags;
    private deduplicateTags;
    private getApplicableRules;
    private evaluateRuleConditions;
    private evaluateCondition;
    private getFieldValue;
    private executeRuleActions;
    private executeAction;
    private generateFilingPath;
    private createDirectoryStructure;
    private moveDocumentToPath;
    private updateDocumentRecord;
    private determineFilingMethod;
    private calculateConfidenceScore;
    private inferDocumentClassification;
    private extractClassificationFeatures;
    private sendNotification;
    private triggerWorkflow;
    private initializeFilingService;
    private loadDefaultFilingRules;
    private loadDirectoryTemplates;
    private initializeEngines;
    private publishFilingEvent;
}

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
// Kafka service will be imported when available
// import { KafkaService } from '../infrastructure/KafkaService';
import {
  Document,
  DocumentType,
  DocumentClassification,
  DocumentStatus,
  Language,
  ExtractedData,
  ProcessingStatus
} from '../../models/documentManagement/DocumentManagement';

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
  alternativeTypes: { type: DocumentType; confidence: number }[];
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

export class DocumentFilingService {
  private prisma: PrismaClient;
  private logger: Logger;
  private kafkaService: any; // KafkaService - type will be restored when module is available
  private filingRules: Map<string, FilingRule>;
  private directoryTemplates: Map<DocumentType, DirectoryTemplate>;
  private classificationEngine: any;
  private taggingEngine: any;
  private fileSystemManager: any;

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    kafkaService: any // KafkaService - type will be restored when module is available
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.kafkaService = kafkaService;
    this.filingRules = new Map();
    this.directoryTemplates = new Map();
    this.initializeFilingService();
  }

  async fileDocument(request: FilingRequest): Promise<FilingResult> {
    try {
      this.logger.info('Starting document filing', {
        documentId: request.documentId,
        documentType: request.document.documentType,
        enableAutoClassification: request.enableAutoClassification
      });

      const startTime = Date.now();
      const errors: string[] = [];
      let filingStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';

      let autoClassificationResult: AutoClassificationResult | undefined;
      if (request.enableAutoClassification) {
        try {
          autoClassificationResult = await this.performAutoClassification(
            request.document,
            request.extractedData
          );
        } catch (error: any) {
          errors.push(`Auto-classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          filingStatus = 'PARTIAL';
        }
      }

      let tagGenerationResult: TagGenerationResult | undefined;
      if (request.enableAutoTagging) {
        try {
          tagGenerationResult = await this.generateTags(
            request.document,
            request.extractedData
          );
        } catch (error: any) {
          errors.push(`Tag generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          filingStatus = 'PARTIAL';
        }
      }

      const applicableRules = await this.getApplicableRules(
        request.document,
        request.customFilingRules
      );

      const appliedRules: AppliedRule[] = [];
      const updatedMetadata = { ...request.document.metadata };
      let updatedClassification = request.document.classification;

      for (const rule of applicableRules) {
        try {
          const ruleStartTime = Date.now();
          const matchedConditions = await this.evaluateRuleConditions(
            rule,
            request.document,
            request.extractedData
          );

          if (matchedConditions.length > 0) {
            const executedActions = await this.executeRuleActions(
              rule,
              request.document,
              updatedMetadata
            );

            if (executedActions.some(action => action.type === 'SET_CLASSIFICATION')) {
              const classificationAction = executedActions.find(a => a.type === 'SET_CLASSIFICATION');
              if (classificationAction) {
                updatedClassification = classificationAction.parameters.classification;
              }
            }

            appliedRules.push({
              ruleId: rule.id,
              ruleName: rule.name,
              matchedConditions: matchedConditions.map(c => c.field),
              executedActions: executedActions.map(a => a.type),
              executionTime: Date.now() - ruleStartTime
            });
          }
        } catch (error: any) {
          errors.push(`Rule execution failed for ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          filingStatus = 'PARTIAL';
        }
      }

      const filingPath = await this.generateFilingPath(
        request.document,
        autoClassificationResult,
        appliedRules,
        request.targetDirectory
      );

      const directoryStructure = await this.createDirectoryStructure(
        filingPath,
        request.document
      );

      try {
        await this.moveDocumentToPath(request.document, filingPath);
      } catch (error: any) {
        errors.push(`Document move failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        filingStatus = 'FAILED';
      }

      const generatedTags = [
        ...(tagGenerationResult?.tags.map(t => t.tag) || []),
        ...request.document.tags
      ];

      await this.updateDocumentRecord(
        request.documentId,
        {
          filePath: filingPath,
          classification: updatedClassification,
          tags: generatedTags,
          metadata: updatedMetadata,
          status: DocumentStatus.FILED
        }
      );

      const result: FilingResult = {
        documentId: request.documentId,
        filingPath,
        appliedRules,
        generatedTags,
        updatedClassification: autoClassificationResult ? autoClassificationResult.classification : undefined,
        updatedMetadata,
        directoryStructure,
        processingTime: Date.now() - startTime,
        filingStatus,
        errors,
        metadata: {
          filingMethod: this.determineFilingMethod(appliedRules, autoClassificationResult),
          confidenceScore: this.calculateConfidenceScore(appliedRules, autoClassificationResult, tagGenerationResult),
          rulesEvaluated: applicableRules.length,
          rulesMatched: appliedRules.length,
          tagsGenerated: tagGenerationResult?.tags.length || 0,
          directoryDepth: filingPath.split('/').length,
          filedAt: new Date(),
          filedBy: 'DocumentFilingService'
        }
      };

      await this.publishFilingEvent(request.documentId, request.tenantId, result);

      this.logger.info('Document filing completed', {
        documentId: request.documentId,
        filingPath,
        rulesApplied: appliedRules.length,
        status: filingStatus,
        processingTime: result.processingTime
      });

      return result;

    } catch (error: any) {
      this.logger.error('Document filing failed', {
        documentId: request.documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error.stack
      });
      throw error;
    }
  }

  private async performAutoClassification(
    document: Document,
    extractedData?: ExtractedData
  ): Promise<AutoClassificationResult> {
    try {
      if (!this.classificationEngine) {
        return this.performRuleBasedClassification(document, extractedData);
      }

      const features = this.extractClassificationFeatures(document, extractedData);
      const prediction = await this.classificationEngine.classify(features);

      return {
        documentType: prediction.documentType,
        confidence: prediction.confidence,
        classification: this.inferDocumentClassification(prediction.documentType),
        reasoning: prediction.reasoning || [],
        alternativeTypes: prediction.alternatives || []
      };

    } catch (error: any) {
      this.logger.warn('ML classification failed, falling back to rule-based', { error: error instanceof Error ? error.message : 'Unknown error' });
      return this.performRuleBasedClassification(document, extractedData);
    }
  }

  private performRuleBasedClassification(
    document: Document,
    extractedData?: ExtractedData
  ): AutoClassificationResult {
    const classificationRules = [
      {
        type: DocumentType.TRADE_CONFIRMATION,
        keywords: ['trade', 'confirmation', 'buy', 'sell', 'executed'],
        weight: 0.9
      },
      {
        type: DocumentType.STATEMENT,
        keywords: ['statement', 'account', 'balance', 'period ending'],
        weight: 0.85
      },
      {
        type: DocumentType.PROSPECTUS,
        keywords: ['prospectus', 'fund', 'investment objective', 'risk factors'],
        weight: 0.9
      },
      {
        type: DocumentType.TAX_DOCUMENT,
        keywords: ['1099', 'tax', 'dividend', 'interest', 'capital gain'],
        weight: 0.8
      }
    ];

    const fullText = `${document.title || ''} ${document.description || ''}`.toLowerCase();
    const extractedText = extractedData?.fields.map(f => String(f.value)).join(' ').toLowerCase() || '';
    const combinedText = `${fullText} ${extractedText}`;

    const scores = classificationRules.map(rule => {
      const matchCount = rule.keywords.filter(keyword => 
        combinedText.includes(keyword)
      ).length;
      
      return {
        type: rule.type,
        confidence: (matchCount / rule.keywords.length) * rule.weight
      };
    }).sort((a, b) => b.confidence - a.confidence);

    const best = scores[0];
    const alternatives = scores.slice(1, 4);

    return {
      documentType: best.type,
      confidence: best.confidence,
      classification: this.inferDocumentClassification(best.type),
      reasoning: [`Matched keywords for ${best.type}`],
      alternativeTypes: alternatives
    };
  }

  private async generateTags(
    document: Document,
    extractedData?: ExtractedData
  ): Promise<TagGenerationResult> {
    const tags: GeneratedTag[] = [];

    tags.push(...this.extractKeywordTags(document));
    
    if (extractedData) {
      tags.push(...this.extractDataTags(extractedData));
    }

    tags.push(...this.extractMetadataTags(document));

    if (this.taggingEngine) {
      try {
        const nlpTags = await this.generateNLPTags(document);
        tags.push(...nlpTags);
      } catch (error: any) {
        this.logger.warn('NLP tag generation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const uniqueTags = this.deduplicateTags(tags);
    const sortedTags = uniqueTags.sort((a, b) => b.relevance - a.relevance).slice(0, 20);

    return {
      tags: sortedTags,
      confidence: sortedTags.length > 0 ? sortedTags.reduce((sum, tag) => sum + tag.confidence, 0) / sortedTags.length : 0,
      method: this.taggingEngine ? 'NLP_ANALYSIS' : 'KEYWORD_EXTRACTION'
    };
  }

  private extractKeywordTags(document: Document): GeneratedTag[] {
    const tags: GeneratedTag[] = [];
    const text = `${document.title || ''} ${document.description || ''}`.toLowerCase();

    const financialKeywords = [
      'portfolio', 'investment', 'asset', 'equity', 'bond', 'fund', 'stock',
      'dividend', 'interest', 'yield', 'return', 'risk', 'volatility',
      'trade', 'transaction', 'buy', 'sell', 'price', 'value', 'market'
    ];

    for (const keyword of financialKeywords) {
      if (text.includes(keyword)) {
        tags.push({
          tag: keyword,
          confidence: 0.8,
          source: 'CONTENT',
          relevance: text.split(keyword).length - 1
        });
      }
    }

    if (document.documentType) {
      tags.push({
        tag: document.documentType.toLowerCase().replace('_', '-'),
        confidence: 0.9,
        source: 'METADATA',
        relevance: 1
      });
    }

    return tags;
  }

  private extractDataTags(extractedData: ExtractedData): GeneratedTag[] {
    const tags: GeneratedTag[] = [];

    for (const field of extractedData.fields) {
      if (field.fieldName && field.value) {
        tags.push({
          tag: field.fieldName.toLowerCase().replace('_', '-'),
          confidence: field.confidence,
          source: 'EXTRACTED_DATA',
          relevance: field.confidence
        });

        if (field.fieldName.toLowerCase().includes('amount') && typeof field.value === 'number') {
          if (field.value > 100000) {
            tags.push({
              tag: 'high-value',
              confidence: 0.9,
              source: 'EXTRACTED_DATA',
              relevance: 0.9
            });
          }
        }

        if (field.fieldName.toLowerCase().includes('date')) {
          const currentYear = new Date().getFullYear().toString();
          if (String(field.value).includes(currentYear)) {
            tags.push({
              tag: 'current-year',
              confidence: 0.8,
              source: 'EXTRACTED_DATA',
              relevance: 0.7
            });
          }
        }
      }
    }

    return tags;
  }

  private extractMetadataTags(document: Document): GeneratedTag[] {
    const tags: GeneratedTag[] = [];

    if (document.portfolioId) {
      tags.push({
        tag: `portfolio-${document.portfolioId}`,
        confidence: 1.0,
        source: 'METADATA',
        relevance: 0.9
      });
    }

    if (document.clientId) {
      tags.push({
        tag: `client-${document.clientId}`,
        confidence: 1.0,
        source: 'METADATA',
        relevance: 0.9
      });
    }

    if (document.language) {
      tags.push({
        tag: `lang-${document.language}`,
        confidence: 1.0,
        source: 'METADATA',
        relevance: 0.6
      });
    }

    const uploadDate = new Date(document.uploadedAt);
    const monthYear = `${uploadDate.getFullYear()}-${(uploadDate.getMonth() + 1).toString().padStart(2, '0')}`;
    tags.push({
      tag: `uploaded-${monthYear}`,
      confidence: 1.0,
      source: 'METADATA',
      relevance: 0.5
    });

    return tags;
  }

  private async generateNLPTags(document: Document): Promise<GeneratedTag[]> {
    const tags: GeneratedTag[] = [];
    
    if (!this.taggingEngine) return tags;

    try {
      const text = `${document.title || ''} ${document.description || ''}`;
      const nlpResult = await this.taggingEngine.extractKeywords(text);

      for (const keyword of nlpResult.keywords) {
        tags.push({
          tag: keyword.text.toLowerCase().replace(/\s+/g, '-'),
          confidence: keyword.relevance,
          source: 'CONTENT',
          relevance: keyword.relevance
        });
      }

    } catch (error: any) {
      this.logger.warn('NLP tag generation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return tags;
  }

  private deduplicateTags(tags: GeneratedTag[]): GeneratedTag[] {
    const tagMap = new Map<string, GeneratedTag>();

    for (const tag of tags) {
      const existing = tagMap.get(tag.tag);
      if (!existing || tag.confidence > existing.confidence) {
        tagMap.set(tag.tag, tag);
      }
    }

    return Array.from(tagMap.values());
  }

  private async getApplicableRules(
    document: Document,
    customRules?: FilingRule[]
  ): Promise<FilingRule[]> {
    const allRules = [
      ...Array.from(this.filingRules.values()),
      ...(customRules || [])
    ];

    return allRules
      .filter(rule => 
        rule.isActive && 
        (rule.applicableDocumentTypes.length === 0 || 
         rule.applicableDocumentTypes.includes(document.documentType))
      )
      .sort((a, b) => b.priority - a.priority);
  }

  private async evaluateRuleConditions(
    rule: FilingRule,
    document: Document,
    extractedData?: ExtractedData
  ): Promise<FilingCondition[]> {
    const matchedConditions: FilingCondition[] = [];

    for (const condition of rule.conditions) {
      if (await this.evaluateCondition(condition, document, extractedData)) {
        matchedConditions.push(condition);
      }
    }

    return matchedConditions;
  }

  private async evaluateCondition(
    condition: FilingCondition,
    document: Document,
    extractedData?: ExtractedData
  ): Promise<boolean> {
    const value = this.getFieldValue(condition.field, document, extractedData);
    
    if (value === null || value === undefined) {
      return condition.operator === 'EXISTS' ? false : condition.operator === 'EQUALS' && condition.value === null;
    }

    const stringValue = String(value);
    const conditionValue = String(condition.value);
    
    const compareValue = condition.caseSensitive ? stringValue : stringValue.toLowerCase();
    const targetValue = condition.caseSensitive ? conditionValue : conditionValue.toLowerCase();

    switch (condition.operator) {
      case 'EQUALS':
        return compareValue === targetValue;
      
      case 'CONTAINS':
        return compareValue.includes(targetValue);
      
      case 'STARTS_WITH':
        return compareValue.startsWith(targetValue);
      
      case 'ENDS_WITH':
        return compareValue.endsWith(targetValue);
      
      case 'REGEX':
        return new RegExp(condition.value, condition.caseSensitive ? 'g' : 'gi').test(stringValue);
      
      case 'GREATER_THAN':
        const numValue = parseFloat(stringValue);
        const numCondition = parseFloat(conditionValue);
        return !isNaN(numValue) && !isNaN(numCondition) && numValue > numCondition;
      
      case 'LESS_THAN':
        const numValue2 = parseFloat(stringValue);
        const numCondition2 = parseFloat(conditionValue);
        return !isNaN(numValue2) && !isNaN(numCondition2) && numValue2 < numCondition2;
      
      case 'EXISTS':
        return true;
      
      default:
        return false;
    }
  }

  private getFieldValue(
    fieldPath: string,
    document: Document,
    extractedData?: ExtractedData
  ): any {
    if (fieldPath.startsWith('document.')) {
      const field = fieldPath.substring(9);
      return (document as any)[field];
    }

    if (fieldPath.startsWith('metadata.')) {
      const field = fieldPath.substring(9);
      return document.metadata[field];
    }

    if (fieldPath.startsWith('extracted.') && extractedData) {
      const field = fieldPath.substring(10);
      const extractedField = extractedData.fields.find(f => f.fieldName === field);
      return extractedField?.value;
    }

    return null;
  }

  private async executeRuleActions(
    rule: FilingRule,
    document: Document,
    metadata: Record<string, any>
  ): Promise<FilingAction[]> {
    const executedActions: FilingAction[] = [];

    for (const action of rule.actions) {
      try {
        await this.executeAction(action, document, metadata);
        executedActions.push(action);
      } catch (error: any) {
        this.logger.warn('Action execution failed', {
          ruleId: rule.id,
          actionType: action.type,
          error: error.message
        });
      }
    }

    return executedActions;
  }

  private async executeAction(
    action: FilingAction,
    document: Document,
    metadata: Record<string, any>
  ): Promise<any> {
    switch (action.type) {
      case 'ADD_TAG':
        if (!document.tags.includes(action.parameters.tag)) {
          document.tags.push(action.parameters.tag);
        }
        break;

      case 'SET_CLASSIFICATION':
        // This will be handled in the calling function
        break;

      case 'UPDATE_METADATA':
        Object.assign(metadata, action.parameters.metadata || {});
        break;

      case 'SEND_NOTIFICATION':
        await this.sendNotification(action.parameters, document);
        break;

      case 'TRIGGER_WORKFLOW':
        await this.triggerWorkflow(action.parameters, document);
        break;

      default:
        this.logger.warn('Unknown action type', { actionType: action.type });
    }
  }

  private async generateFilingPath(
    document: Document,
    classification?: AutoClassificationResult,
    appliedRules?: AppliedRule[],
    targetDirectory?: string
  ): Promise<string> {
    const basePath = targetDirectory || '/documents';
    const docType = classification?.documentType || document.documentType;
    
    const template = this.directoryTemplates.get(docType);
    if (template) {
      return template.generatePath(document, classification);
    }

    const year = new Date(document.uploadedAt).getFullYear();
    const month = new Date(document.uploadedAt).getMonth() + 1;
    
    let path = `${basePath}/${docType.toLowerCase()}/${year}/${month.toString().padStart(2, '0')}`;
    
    if (document.clientId) {
      path += `/client_${document.clientId}`;
    }
    
    if (document.portfolioId) {
      path += `/portfolio_${document.portfolioId}`;
    }

    return `${path}/${document.fileName}`;
  }

  private async createDirectoryStructure(
    filePath: string,
    document: Document
  ): Promise<DirectoryNode[]> {
    const pathParts = filePath.split('/').filter(part => part.length > 0);
    const structure: DirectoryNode[] = [];
    
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      currentPath += `/${part}`;
      
      structure.push({
        name: part,
        path: currentPath,
        type: 'FOLDER',
        metadata: {
          created: new Date(),
          documentCount: 1
        }
      });
    }

    structure.push({
      name: document.fileName,
      path: filePath,
      type: 'FILE',
      metadata: {
        size: document.fileSize,
        mimeType: document.mimeType,
        documentId: document.id
      }
    });

    return structure;
  }

  private async moveDocumentToPath(document: Document, targetPath: string): Promise<any> {
    if (this.fileSystemManager) {
      await this.fileSystemManager.moveFile(document.filePath, targetPath);
    } else {
      this.logger.info('File system manager not available, skipping physical file move', {
        documentId: document.id,
        targetPath
      });
    }
  }

  private async updateDocumentRecord(
    documentId: string,
    updates: Partial<Document>
  ): Promise<any> {
    this.logger.info('Updating document record', { documentId, updates });
  }

  private determineFilingMethod(
    appliedRules: AppliedRule[],
    classification?: AutoClassificationResult
  ): 'RULE_BASED' | 'ML_BASED' | 'TEMPLATE_BASED' | 'HYBRID' {
    if (appliedRules.length > 0 && classification) {
      return 'HYBRID';
    } else if (appliedRules.length > 0) {
      return 'RULE_BASED';
    } else if (classification) {
      return 'ML_BASED';
    } else {
      return 'TEMPLATE_BASED';
    }
  }

  private calculateConfidenceScore(
    appliedRules: AppliedRule[],
    classification?: AutoClassificationResult,
    tagging?: TagGenerationResult
  ): number {
    let totalScore = 0;
    let components = 0;

    if (appliedRules.length > 0) {
      totalScore += 0.8;
      components++;
    }

    if (classification) {
      totalScore += classification.confidence;
      components++;
    }

    if (tagging) {
      totalScore += tagging.confidence;
      components++;
    }

    return components > 0 ? totalScore / components : 0.5;
  }

  private inferDocumentClassification(documentType: DocumentType): DocumentClassification {
    const classificationMap: Record<DocumentType, DocumentClassification> = {
      [DocumentType.TRADE_CONFIRMATION]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.STATEMENT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.PROSPECTUS]: DocumentClassification.PUBLIC,
      [DocumentType.OFFERING_MEMORANDUM]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.TERM_SHEET]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.ANNUAL_REPORT]: DocumentClassification.PUBLIC,
      [DocumentType.QUARTERLY_REPORT]: DocumentClassification.PUBLIC,
      [DocumentType.TAX_DOCUMENT]: DocumentClassification.HIGHLY_CONFIDENTIAL,
      [DocumentType.COMPLIANCE_CERTIFICATE]: DocumentClassification.INTERNAL,
      [DocumentType.CONTRACT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.AMENDMENT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.LEGAL_OPINION]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.AUDIT_REPORT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.REGULATORY_FILING]: DocumentClassification.PUBLIC,
      [DocumentType.CLIENT_COMMUNICATION]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.INVESTMENT_COMMITTEE_MINUTES]: DocumentClassification.HIGHLY_CONFIDENTIAL,
      [DocumentType.DUE_DILIGENCE_REPORT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.PERFORMANCE_REPORT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.RISK_REPORT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.SUBSCRIPTION_AGREEMENT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.REDEMPTION_NOTICE]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.TRANSFER_AGREEMENT]: DocumentClassification.CONFIDENTIAL,
      [DocumentType.KYC_DOCUMENT]: DocumentClassification.HIGHLY_CONFIDENTIAL,
      [DocumentType.AML_DOCUMENT]: DocumentClassification.HIGHLY_CONFIDENTIAL,
      [DocumentType.OTHER]: DocumentClassification.INTERNAL
    };

    return classificationMap[documentType] || DocumentClassification.INTERNAL;
  }

  private extractClassificationFeatures(
    document: Document,
    extractedData?: ExtractedData
  ): number[] {
    const features: number[] = [];
    
    features.push(document.fileName.length);
    features.push(document.fileSize);
    features.push(document.pageCount || 1);
    features.push(document.tags.length);
    
    const hasAmount = extractedData?.fields.some(f => 
      f.fieldName.toLowerCase().includes('amount')
    ) ? 1 : 0;
    features.push(hasAmount);
    
    const hasDate = extractedData?.fields.some(f => 
      f.fieldName.toLowerCase().includes('date')
    ) ? 1 : 0;
    features.push(hasDate);
    
    while (features.length < 20) {
      features.push(0);
    }

    return features.slice(0, 20);
  }

  private async sendNotification(
    parameters: Record<string, any>,
    document: Document
  ): Promise<any> {
    this.logger.info('Sending notification', { 
      documentId: document.id,
      parameters 
    });
  }

  private async triggerWorkflow(
    parameters: Record<string, any>,
    document: Document
  ): Promise<any> {
    this.logger.info('Triggering workflow', { 
      documentId: document.id,
      parameters 
    });
  }

  private async initializeFilingService(): Promise<any> {
    try {
      await this.loadDefaultFilingRules();
      await this.loadDirectoryTemplates();
      await this.initializeEngines();
      
      this.logger.info('Document filing service initialized', {
        rules: this.filingRules.size,
        templates: this.directoryTemplates.size
      });
    } catch (error: any) {
      this.logger.error('Failed to initialize filing service', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async loadDefaultFilingRules(): Promise<any> {
    const defaultRules: FilingRule[] = [
      {
        id: 'high_value_trades',
        name: 'High Value Trade Documents',
        description: 'File high value trade confirmations in special directory',
        conditions: [
          {
            field: 'document.documentType',
            operator: 'EQUALS',
            value: DocumentType.TRADE_CONFIRMATION,
            caseSensitive: false
          },
          {
            field: 'extracted.amount',
            operator: 'GREATER_THAN',
            value: 100000,
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: 'ADD_TAG',
            parameters: { tag: 'high-value' }
          },
          {
            type: 'SET_CLASSIFICATION',
            parameters: { classification: DocumentClassification.HIGHLY_CONFIDENTIAL }
          }
        ],
        priority: 100,
        isActive: true,
        applicableDocumentTypes: [DocumentType.TRADE_CONFIRMATION]
      },
      {
        id: 'current_year_statements',
        name: 'Current Year Statements',
        description: 'Tag current year statements for easy access',
        conditions: [
          {
            field: 'document.documentType',
            operator: 'EQUALS',
            value: DocumentType.STATEMENT,
            caseSensitive: false
          },
          {
            field: 'document.uploadedAt',
            operator: 'CONTAINS',
            value: new Date().getFullYear().toString(),
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: 'ADD_TAG',
            parameters: { tag: 'current-year' }
          }
        ],
        priority: 50,
        isActive: true,
        applicableDocumentTypes: [DocumentType.STATEMENT]
      }
    ];

    for (const rule of defaultRules) {
      this.filingRules.set(rule.id, rule);
    }

    this.logger.info('Default filing rules loaded', { count: defaultRules.length });
  }

  private async loadDirectoryTemplates(): Promise<any> {
    const templates = [
      new TradeConfirmationDirectoryTemplate(),
      new StatementDirectoryTemplate(),
      new ProspectusDirectoryTemplate()
    ];

    for (const template of templates) {
      this.directoryTemplates.set(template.documentType, template);
    }

    this.logger.info('Directory templates loaded', { count: templates.length });
  }

  private async initializeEngines(): Promise<any> {
    try {
      this.classificationEngine = {
        classify: async (features: number[]) => ({
          documentType: DocumentType.STATEMENT,
          confidence: 0.85,
          reasoning: ['Feature-based classification'],
          alternatives: []
        })
      };

      this.taggingEngine = {
        extractKeywords: async (text: string) => ({
          keywords: [
            { text: 'investment', relevance: 0.9 },
            { text: 'portfolio', relevance: 0.8 },
            { text: 'financial', relevance: 0.7 }
          ]
        })
      };

    } catch (error: any) {
      this.logger.warn('Failed to initialize classification/tagging engines', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async publishFilingEvent(
    documentId: string,
    tenantId: string,
    result: FilingResult
  ): Promise<any> {
    const event = {
      eventType: 'DOCUMENT_FILING_COMPLETED',
      documentId,
      tenantId,
      filingPath: result.filingPath,
      rulesApplied: result.appliedRules.length,
      status: result.filingStatus,
      timestamp: new Date().toISOString()
    };

    await this.kafkaService.publishEvent('document-processing', event);
  }
}

interface DirectoryTemplate {
  documentType: DocumentType;
  generatePath(document: Document, classification?: AutoClassificationResult): string;
}

class TradeConfirmationDirectoryTemplate implements DirectoryTemplate {
  documentType = DocumentType.TRADE_CONFIRMATION;
  
  generatePath(document: Document, classification?: AutoClassificationResult): string {
    const year = new Date(document.uploadedAt).getFullYear();
    const month = new Date(document.uploadedAt).getMonth() + 1;
    
    let path = `/documents/trades/${year}/${month.toString().padStart(2, '0')}`;
    
    if (document.portfolioId) {
      path += `/portfolio_${document.portfolioId}`;
    }
    
    return `${path}/${document.fileName}`;
  }
}

class StatementDirectoryTemplate implements DirectoryTemplate {
  documentType = DocumentType.STATEMENT;
  
  generatePath(document: Document, classification?: AutoClassificationResult): string {
    const year = new Date(document.uploadedAt).getFullYear();
    const quarter = Math.ceil((new Date(document.uploadedAt).getMonth() + 1) / 3);
    
    let path = `/documents/statements/${year}/Q${quarter}`;
    
    if (document.clientId) {
      path += `/client_${document.clientId}`;
    }
    
    return `${path}/${document.fileName}`;
  }
}

class ProspectusDirectoryTemplate implements DirectoryTemplate {
  documentType = DocumentType.PROSPECTUS;
  
  generatePath(document: Document, classification?: AutoClassificationResult): string {
    const year = new Date(document.uploadedAt).getFullYear();
    
    return `/documents/prospectuses/${year}/${document.fileName}`;
  }
}


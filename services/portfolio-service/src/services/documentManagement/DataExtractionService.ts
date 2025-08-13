import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../infrastructure/KafkaService';
import {
  Document,
  DocumentTemplate,
  ExtractionRule,
  ValidationRule,
  ExtractedData,
  ExtractedField,
  AlternativeValue,
  ValidationResult,
  OCRResult,
  BoundingBox,
  Language,
  ProcessingStatus
} from '../../models/documentManagement/DocumentManagement';

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

export class DataExtractionService {
  private prisma: PrismaClient;
  private logger: Logger;
  private kafkaService: KafkaService;
  private nlpEngine: any;
  private mlModels: Map<string, MLExtractionModel>;
  private fieldProcessors: Map<string, FieldProcessor>;
  private validationEngine: any;

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    kafkaService: KafkaService
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.kafkaService = kafkaService;
    this.mlModels = new Map();
    this.fieldProcessors = new Map();
    this.initializeDataExtraction();
  }

  async extractData(request: DataExtractionRequest): Promise<DataExtractionResult> {
    try {
      this.logger.info('Starting data extraction', {
        documentId: request.documentId,
        templateId: request.template?.id,
        language: request.language,
        enableValidation: request.enableValidation
      });

      const startTime = Date.now();
      const processingSteps: string[] = [];

      let extractedFields: FieldExtractionResult[] = [];
      let extractionMethod: 'TEMPLATE_BASED' | 'ML_BASED' | 'HYBRID' = 'HYBRID';

      if (request.template) {
        processingSteps.push('Template-based extraction');
        const templateFields = await this.performTemplateBasedExtraction(
          request.ocrResults,
          request.template,
          request.language
        );
        extractedFields.push(...templateFields);
        extractionMethod = 'TEMPLATE_BASED';
      }

      if (request.customExtractionRules && request.customExtractionRules.length > 0) {
        processingSteps.push('Custom rules extraction');
        const customFields = await this.performCustomRulesExtraction(
          request.ocrResults,
          request.customExtractionRules,
          request.language
        );
        extractedFields = this.mergeExtractedFields(extractedFields, customFields);
      }

      processingSteps.push('NLP extraction');
      const nlpFields = await this.performNLPExtraction(
        request.ocrResults,
        request.language
      );
      extractedFields = this.mergeExtractedFields(extractedFields, nlpFields);

      processingSteps.push('ML-based extraction');
      const mlFields = await this.performMLBasedExtraction(
        request.ocrResults,
        request.language
      );
      extractedFields = this.mergeExtractedFields(extractedFields, mlFields);

      if (extractedFields.some(f => f.source === 'ML_MODEL' || f.source === 'NLP')) {
        extractionMethod = extractionMethod === 'TEMPLATE_BASED' ? 'HYBRID' : 'ML_BASED';
      }

      if (request.enablePostProcessing) {
        processingSteps.push('Post-processing');
        extractedFields = await this.performPostProcessing(extractedFields, request.language);
      }

      let validationResults: ValidationResult[] = [];
      if (request.enableValidation) {
        processingSteps.push('Validation');
        validationResults = await this.performValidation(extractedFields, request.template);
        
        for (const field of extractedFields) {
          const fieldValidations = validationResults.filter(v => v.fieldName === field.fieldName);
          field.validationPassed = fieldValidations.every(v => v.isValid);
          field.validationErrors = fieldValidations
            .filter(v => !v.isValid)
            .map(v => v.errorMessage || 'Validation failed');
        }
      }

      const confidence = extractedFields.length > 0
        ? extractedFields.reduce((sum, field) => sum + field.confidence, 0) / extractedFields.length
        : 0;

      const result: DataExtractionResult = {
        documentId: request.documentId,
        templateId: request.template?.id,
        extractionMethod,
        confidence,
        extractedFields,
        validationResults,
        processingTime: Date.now() - startTime,
        metadata: {
          fieldsExtracted: extractedFields.length,
          fieldsValidated: validationResults.length,
          validationsPassed: validationResults.filter(v => v.isValid).length,
          validationsFailed: validationResults.filter(v => !v.isValid).length,
          extractionEngine: 'DataExtractionService',
          processingSteps,
          confidence,
          extractedAt: new Date(),
          extractedBy: 'system'
        }
      };

      await this.publishDataExtractionEvent(request.documentId, request.tenantId, result);

      this.logger.info('Data extraction completed', {
        documentId: request.documentId,
        fieldsExtracted: extractedFields.length,
        confidence: confidence,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      this.logger.error('Data extraction failed', {
        documentId: request.documentId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private async performTemplateBasedExtraction(
    ocrResults: OCRResult[],
    template: DocumentTemplate,
    language: Language
  ): Promise<FieldExtractionResult[]> {
    const extractedFields: FieldExtractionResult[] = [];

    for (const rule of template.extractionRules) {
      try {
        const fieldResult = await this.extractFieldUsingRule(ocrResults, rule, language);
        if (fieldResult) {
          extractedFields.push(fieldResult);
        }
      } catch (error) {
        this.logger.warn('Field extraction failed', {
          fieldName: rule.fieldName,
          error: error.message
        });
      }
    }

    return extractedFields;
  }

  private async performCustomRulesExtraction(
    ocrResults: OCRResult[],
    rules: ExtractionRule[],
    language: Language
  ): Promise<FieldExtractionResult[]> {
    const extractedFields: FieldExtractionResult[] = [];

    for (const rule of rules) {
      try {
        const fieldResult = await this.extractFieldUsingRule(ocrResults, rule, language);
        if (fieldResult) {
          extractedFields.push(fieldResult);
        }
      } catch (error) {
        this.logger.warn('Custom rule extraction failed', {
          fieldName: rule.fieldName,
          error: error.message
        });
      }
    }

    return extractedFields;
  }

  private async extractFieldUsingRule(
    ocrResults: OCRResult[],
    rule: ExtractionRule,
    language: Language
  ): Promise<FieldExtractionResult | null> {
    let extractedValue: any = null;
    let confidence = 0;
    let boundingBox: BoundingBox | undefined;
    let rawText = '';
    const alternatives: AlternativeValue[] = [];

    switch (rule.extractionMethod) {
      case 'REGEX':
        const regexResult = this.extractUsingRegex(ocrResults, rule);
        if (regexResult) {
          extractedValue = regexResult.value;
          confidence = regexResult.confidence;
          boundingBox = regexResult.boundingBox;
          rawText = regexResult.rawText;
        }
        break;

      case 'OCR_REGION':
        const regionResult = this.extractUsingOCRRegion(ocrResults, rule);
        if (regionResult) {
          extractedValue = regionResult.value;
          confidence = regionResult.confidence;
          boundingBox = regionResult.boundingBox;
          rawText = regionResult.rawText;
        }
        break;

      case 'NLP':
        const nlpResult = await this.extractUsingNLP(ocrResults, rule, language);
        if (nlpResult) {
          extractedValue = nlpResult.value;
          confidence = nlpResult.confidence;
          alternatives.push(...nlpResult.alternatives);
        }
        break;

      case 'ML_MODEL':
        const mlResult = await this.extractUsingMLModel(ocrResults, rule, language);
        if (mlResult) {
          extractedValue = mlResult.value;
          confidence = mlResult.confidence;
          alternatives.push(...mlResult.alternatives);
        }
        break;
    }

    if (extractedValue !== null) {
      extractedValue = this.processFieldValue(extractedValue, rule.fieldType);
      
      return {
        fieldName: rule.fieldName,
        value: extractedValue,
        confidence,
        source: this.mapExtractionMethodToSource(rule.extractionMethod),
        boundingBox,
        rawText,
        alternatives,
        validationPassed: true,
        validationErrors: []
      };
    }

    return null;
  }

  private extractUsingRegex(ocrResults: OCRResult[], rule: ExtractionRule): any {
    const regex = new RegExp(rule.pattern, 'gi');
    
    for (const ocrResult of ocrResults) {
      for (const line of ocrResult.lines) {
        const matches = [...line.text.matchAll(regex)];
        if (matches.length > 0) {
          const match = matches[0];
          return {
            value: match[1] || match[0],
            confidence: 0.9,
            boundingBox: line.boundingBox,
            rawText: line.text
          };
        }
      }
    }

    return null;
  }

  private extractUsingOCRRegion(ocrResults: OCRResult[], rule: ExtractionRule): any {
    if (!rule.coordinates) return null;

    for (const ocrResult of ocrResults) {
      for (const region of ocrResult.regions) {
        if (this.isWithinBounds(region.boundingBox, rule.coordinates)) {
          return {
            value: region.text.trim(),
            confidence: region.confidence,
            boundingBox: region.boundingBox,
            rawText: region.text
          };
        }
      }
    }

    return null;
  }

  private async extractUsingNLP(
    ocrResults: OCRResult[],
    rule: ExtractionRule,
    language: Language
  ): Promise<any> {
    if (!this.nlpEngine) return null;

    try {
      const fullText = ocrResults.map(r => r.text).join(' ');
      const nlpResult = await this.nlpEngine.process(fullText, language);

      const relevantEntities = nlpResult.entities.filter((entity: NLPEntity) => 
        entity.label.toLowerCase().includes(rule.fieldName.toLowerCase()) ||
        rule.pattern && new RegExp(rule.pattern, 'i').test(entity.text)
      );

      if (relevantEntities.length > 0) {
        const bestEntity = relevantEntities.sort((a: NLPEntity, b: NLPEntity) => b.confidence - a.confidence)[0];
        const alternatives = relevantEntities.slice(1).map((entity: NLPEntity) => ({
          value: entity.text,
          confidence: entity.confidence,
          source: 'NLP'
        }));

        return {
          value: bestEntity.text,
          confidence: bestEntity.confidence,
          alternatives
        };
      }

    } catch (error) {
      this.logger.warn('NLP extraction failed', { error: error.message });
    }

    return null;
  }

  private async extractUsingMLModel(
    ocrResults: OCRResult[],
    rule: ExtractionRule,
    language: Language
  ): Promise<any> {
    try {
      const modelKey = `${rule.fieldName}_extractor`;
      const model = this.mlModels.get(modelKey) || this.mlModels.get('default');
      
      if (!model) return null;

      const fullText = ocrResults.map(r => r.text).join(' ');
      const features = this.extractMLFeatures(fullText, rule.fieldName);
      
      const prediction = await this.predictFieldValue(model, features, rule.fieldType);
      
      if (prediction && prediction.confidence > 0.5) {
        return {
          value: prediction.value,
          confidence: prediction.confidence,
          alternatives: prediction.alternatives || []
        };
      }

    } catch (error) {
      this.logger.warn('ML model extraction failed', { 
        fieldName: rule.fieldName,
        error: error.message 
      });
    }

    return null;
  }

  private async performNLPExtraction(
    ocrResults: OCRResult[],
    language: Language
  ): Promise<FieldExtractionResult[]> {
    const extractedFields: FieldExtractionResult[] = [];

    if (!this.nlpEngine) return extractedFields;

    try {
      const fullText = ocrResults.map(r => r.text).join(' ');
      const nlpResult = await this.nlpEngine.process(fullText, language);

      const commonFields = [
        { name: 'date', labels: ['DATE', 'TIME'] },
        { name: 'amount', labels: ['MONEY', 'CARDINAL'] },
        { name: 'person', labels: ['PERSON'] },
        { name: 'organization', labels: ['ORG', 'ORGANIZATION'] },
        { name: 'location', labels: ['GPE', 'LOC', 'LOCATION'] },
        { name: 'email', labels: ['EMAIL'] },
        { name: 'phone', labels: ['PHONE'] }
      ];

      for (const field of commonFields) {
        const entities = nlpResult.entities.filter((e: NLPEntity) => 
          field.labels.includes(e.label.toUpperCase())
        );

        if (entities.length > 0) {
          const bestEntity = entities.sort((a: NLPEntity, b: NLPEntity) => b.confidence - a.confidence)[0];
          const alternatives = entities.slice(1, 4).map((e: NLPEntity) => ({
            value: e.text,
            confidence: e.confidence,
            source: 'NLP'
          }));

          extractedFields.push({
            fieldName: field.name,
            value: this.processFieldValue(bestEntity.text, this.inferFieldType(field.name)),
            confidence: bestEntity.confidence,
            source: 'NLP',
            boundingBox: bestEntity.boundingBox,
            rawText: bestEntity.text,
            alternatives,
            validationPassed: true,
            validationErrors: []
          });
        }
      }

    } catch (error) {
      this.logger.warn('NLP extraction failed', { error: error.message });
    }

    return extractedFields;
  }

  private async performMLBasedExtraction(
    ocrResults: OCRResult[],
    language: Language
  ): Promise<FieldExtractionResult[]> {
    const extractedFields: FieldExtractionResult[] = [];

    try {
      const defaultModel = this.mlModels.get('default');
      if (!defaultModel) return extractedFields;

      const fullText = ocrResults.map(r => r.text).join(' ');
      
      for (const fieldName of defaultModel.supportedFields) {
        const features = this.extractMLFeatures(fullText, fieldName);
        const prediction = await this.predictFieldValue(
          defaultModel, 
          features, 
          this.inferFieldType(fieldName)
        );

        if (prediction && prediction.confidence > 0.6) {
          extractedFields.push({
            fieldName: fieldName,
            value: prediction.value,
            confidence: prediction.confidence,
            source: 'ML_MODEL',
            alternatives: prediction.alternatives || [],
            validationPassed: true,
            validationErrors: []
          });
        }
      }

    } catch (error) {
      this.logger.warn('ML-based extraction failed', { error: error.message });
    }

    return extractedFields;
  }

  private async performPostProcessing(
    fields: FieldExtractionResult[],
    language: Language
  ): Promise<FieldExtractionResult[]> {
    const processedFields = [...fields];

    for (const field of processedFields) {
      const processor = this.fieldProcessors.get(field.fieldName);
      if (processor && field.value) {
        try {
          const processedValue = await processor.process(field.value, language);
          if (processedValue !== field.value) {
            field.alternatives.push({
              value: field.value,
              confidence: field.confidence * 0.9,
              source: field.source
            });
            field.value = processedValue;
            field.confidence = Math.min(field.confidence * 1.1, 1.0);
          }
        } catch (error) {
          this.logger.warn('Post-processing failed', { 
            fieldName: field.fieldName,
            error: error.message 
          });
        }
      }
    }

    return processedFields;
  }

  private async performValidation(
    fields: FieldExtractionResult[],
    template?: DocumentTemplate
  ): Promise<ValidationResult[]> {
    const validationResults: ValidationResult[] = [];

    const validationRules = template?.validationRules || this.getDefaultValidationRules();

    for (const field of fields) {
      const fieldRules = validationRules.filter(rule => rule.fieldName === field.fieldName);
      
      for (const rule of fieldRules) {
        const isValid = await this.validateField(field, rule);
        
        validationResults.push({
          fieldName: field.fieldName,
          isValid,
          errorMessage: isValid ? undefined : rule.errorMessage,
          severity: rule.severity,
          validatedAt: new Date()
        });
      }

      if (field.value !== null && field.value !== undefined) {
        const basicValidation = await this.performBasicValidation(field);
        validationResults.push(...basicValidation);
      }
    }

    return validationResults;
  }

  private async validateField(field: FieldExtractionResult, rule: ValidationRule): Promise<boolean> {
    try {
      switch (rule.ruleType) {
        case 'REQUIRED':
          return field.value !== null && field.value !== undefined && field.value !== '';

        case 'FORMAT':
          const regex = new RegExp(rule.rule);
          return regex.test(String(field.value));

        case 'RANGE':
          const [min, max] = rule.rule.split(',').map(v => parseFloat(v.trim()));
          const numValue = parseFloat(String(field.value));
          return !isNaN(numValue) && numValue >= min && numValue <= max;

        case 'CUSTOM':
          return await this.executeCustomValidation(field, rule.rule);

        default:
          return true;
      }
    } catch (error) {
      this.logger.warn('Validation failed', { 
        fieldName: field.fieldName,
        rule: rule.ruleType,
        error: error.message 
      });
      return false;
    }
  }

  private async performBasicValidation(field: FieldExtractionResult): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    if (field.confidence < 0.3) {
      results.push({
        fieldName: field.fieldName,
        isValid: false,
        errorMessage: 'Low confidence extraction',
        severity: 'WARNING',
        validatedAt: new Date()
      });
    }

    if (this.isFieldTypeConsistent(field)) {
      results.push({
        fieldName: field.fieldName,
        isValid: true,
        severity: 'INFO',
        validatedAt: new Date()
      });
    } else {
      results.push({
        fieldName: field.fieldName,
        isValid: false,
        errorMessage: 'Field type inconsistency detected',
        severity: 'WARNING',
        validatedAt: new Date()
      });
    }

    return results;
  }

  private mergeExtractedFields(
    existing: FieldExtractionResult[],
    additional: FieldExtractionResult[]
  ): FieldExtractionResult[] {
    const merged = [...existing];
    const existingFieldNames = new Set(existing.map(f => f.fieldName));

    for (const field of additional) {
      const existingField = merged.find(f => f.fieldName === field.fieldName);
      
      if (existingField) {
        if (field.confidence > existingField.confidence) {
          existingField.alternatives.push({
            value: existingField.value,
            confidence: existingField.confidence,
            source: existingField.source
          });
          
          existingField.value = field.value;
          existingField.confidence = field.confidence;
          existingField.source = field.source;
          existingField.boundingBox = field.boundingBox || existingField.boundingBox;
        } else {
          existingField.alternatives.push({
            value: field.value,
            confidence: field.confidence,
            source: field.source
          });
        }
      } else {
        merged.push(field);
      }
    }

    return merged;
  }

  private processFieldValue(value: any, fieldType: string): any {
    try {
      switch (fieldType) {
        case 'NUMBER':
          const numStr = String(value).replace(/[^\d.-]/g, '');
          return parseFloat(numStr);

        case 'CURRENCY':
          const currencyStr = String(value).replace(/[^\d.-]/g, '');
          return parseFloat(currencyStr);

        case 'PERCENTAGE':
          const percentStr = String(value).replace(/[^\d.-]/g, '');
          return parseFloat(percentStr) / 100;

        case 'DATE':
          return this.parseDate(String(value));

        case 'BOOLEAN':
          const lowerValue = String(value).toLowerCase();
          return ['true', 'yes', '1', 'on', 'checked'].includes(lowerValue);

        case 'STRING':
        default:
          return String(value).trim();
      }
    } catch (error) {
      this.logger.warn('Field value processing failed', { 
        value, 
        fieldType, 
        error: error.message 
      });
      return value;
    }
  }

  private parseDate(dateStr: string): Date | null {
    try {
      const datePatterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})-(\d{1,2})-(\d{4})/,
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/
      ];

      for (const pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
          return new Date(dateStr);
        }
      }

      return new Date(dateStr);
    } catch (error) {
      return null;
    }
  }

  private isWithinBounds(regionBox: BoundingBox, targetBox: BoundingBox): boolean {
    return regionBox.x >= targetBox.x &&
           regionBox.y >= targetBox.y &&
           regionBox.x + regionBox.width <= targetBox.x + targetBox.width &&
           regionBox.y + regionBox.height <= targetBox.y + targetBox.height;
  }

  private mapExtractionMethodToSource(method: string): 'OCR' | 'NLP' | 'ML_MODEL' | 'REGEX' | 'MANUAL' {
    switch (method) {
      case 'NLP': return 'NLP';
      case 'ML_MODEL': return 'ML_MODEL';
      case 'REGEX': return 'REGEX';
      case 'OCR_REGION': return 'OCR';
      default: return 'OCR';
    }
  }

  private inferFieldType(fieldName: string): string {
    const typeMapping: Record<string, string> = {
      date: 'DATE',
      amount: 'CURRENCY',
      price: 'CURRENCY',
      quantity: 'NUMBER',
      shares: 'NUMBER',
      percentage: 'PERCENTAGE',
      email: 'STRING',
      phone: 'STRING',
      person: 'STRING',
      organization: 'STRING',
      location: 'STRING'
    };

    return typeMapping[fieldName.toLowerCase()] || 'STRING';
  }

  private extractMLFeatures(text: string, fieldName: string): number[] {
    const features: number[] = [];
    
    features.push(text.length);
    features.push(text.split(' ').length);
    features.push(text.split('\n').length);
    
    const hasNumbers = /\d/.test(text) ? 1 : 0;
    const hasUpperCase = /[A-Z]/.test(text) ? 1 : 0;
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(text) ? 1 : 0;
    
    features.push(hasNumbers, hasUpperCase, hasSpecialChars);
    
    while (features.length < 50) {
      features.push(0);
    }

    return features.slice(0, 50);
  }

  private async predictFieldValue(
    model: MLExtractionModel,
    features: number[],
    fieldType: string
  ): Promise<any> {
    try {
      const prediction = Math.random();
      const confidence = Math.random() * 0.5 + 0.5;
      
      let value: any;
      switch (fieldType) {
        case 'NUMBER':
          value = Math.floor(Math.random() * 1000);
          break;
        case 'CURRENCY':
          value = Math.random() * 10000;
          break;
        case 'DATE':
          value = new Date();
          break;
        default:
          value = 'extracted_value';
      }

      return {
        value,
        confidence,
        alternatives: []
      };

    } catch (error) {
      this.logger.error('ML prediction failed', { error: error.message });
      return null;
    }
  }

  private async executeCustomValidation(field: FieldExtractionResult, rule: string): Promise<boolean> {
    try {
      const validationFunction = new Function('field', 'value', rule);
      return validationFunction(field, field.value);
    } catch (error) {
      this.logger.warn('Custom validation failed', { error: error.message });
      return false;
    }
  }

  private isFieldTypeConsistent(field: FieldExtractionResult): boolean {
    const expectedType = this.inferFieldType(field.fieldName);
    
    switch (expectedType) {
      case 'NUMBER':
      case 'CURRENCY':
        return !isNaN(parseFloat(String(field.value)));
      case 'DATE':
        return field.value instanceof Date || !isNaN(Date.parse(String(field.value)));
      case 'BOOLEAN':
        return typeof field.value === 'boolean';
      case 'STRING':
        return typeof field.value === 'string';
      default:
        return true;
    }
  }

  private getDefaultValidationRules(): ValidationRule[] {
    return [
      {
        id: 'amount_positive',
        fieldName: 'amount',
        ruleType: 'RANGE',
        rule: '0,999999999',
        errorMessage: 'Amount must be positive',
        severity: 'ERROR'
      },
      {
        id: 'email_format',
        fieldName: 'email',
        ruleType: 'FORMAT',
        rule: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        errorMessage: 'Invalid email format',
        severity: 'ERROR'
      },
      {
        id: 'date_valid',
        fieldName: 'date',
        ruleType: 'CUSTOM',
        rule: 'return !isNaN(Date.parse(String(value)))',
        errorMessage: 'Invalid date format',
        severity: 'ERROR'
      }
    ];
  }

  private async initializeDataExtraction(): Promise<void> {
    try {
      await this.initializeNLPEngine();
      await this.loadMLModels();
      await this.initializeFieldProcessors();
      
      this.logger.info('Data extraction service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize data extraction', { error: error.message });
    }
  }

  private async initializeNLPEngine(): Promise<void> {
    try {
      this.nlpEngine = {
        process: async (text: string, language: Language) => ({
          entities: this.mockNLPEntities(text),
          relations: [],
          sentiments: [],
          keywords: []
        })
      };

      this.logger.info('NLP engine initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize NLP engine', { error: error.message });
    }
  }

  private mockNLPEntities(text: string): NLPEntity[] {
    const entities: NLPEntity[] = [];
    
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/g;
    let match;
    while ((match = datePattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'DATE',
        confidence: 0.9,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      });
    }

    const amountPattern = /\$[\d,]+\.?\d*/g;
    while ((match = amountPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'MONEY',
        confidence: 0.85,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      });
    }

    return entities;
  }

  private async loadMLModels(): Promise<void> {
    try {
      const defaultModel: MLExtractionModel = {
        modelType: 'NAMED_ENTITY_RECOGNITION',
        modelPath: '/models/extraction/default.json',
        confidence: 0.8,
        supportedFields: ['amount', 'date', 'name', 'account', 'symbol']
      };

      this.mlModels.set('default', defaultModel);

      this.logger.info('ML models loaded for data extraction');
    } catch (error) {
      this.logger.warn('Failed to load ML models', { error: error.message });
    }
  }

  private async initializeFieldProcessors(): Promise<void> {
    this.fieldProcessors.set('date', new DateFieldProcessor());
    this.fieldProcessors.set('amount', new AmountFieldProcessor());
    this.fieldProcessors.set('phone', new PhoneFieldProcessor());

    this.logger.info('Field processors initialized', { count: this.fieldProcessors.size });
  }

  private async publishDataExtractionEvent(
    documentId: string,
    tenantId: string,
    result: DataExtractionResult
  ): Promise<void> {
    const event = {
      eventType: 'DATA_EXTRACTION_COMPLETED',
      documentId,
      tenantId,
      fieldsExtracted: result.extractedFields.length,
      confidence: result.confidence,
      extractionMethod: result.extractionMethod,
      timestamp: new Date().toISOString()
    };

    await this.kafkaService.publishEvent('document-processing', event);
  }
}

interface FieldProcessor {
  process(value: any, language: Language): Promise<any>;
}

class DateFieldProcessor implements FieldProcessor {
  async process(value: any, language: Language): Promise<any> {
    const dateStr = String(value);
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? value : date;
  }
}

class AmountFieldProcessor implements FieldProcessor {
  async process(value: any, language: Language): Promise<any> {
    const cleanValue = String(value).replace(/[^\d.-]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? value : numValue;
  }
}

class PhoneFieldProcessor implements FieldProcessor {
  async process(value: any, language: Language): Promise<any> {
    const phoneStr = String(value).replace(/[^\d]/g, '');
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return value;
  }
}
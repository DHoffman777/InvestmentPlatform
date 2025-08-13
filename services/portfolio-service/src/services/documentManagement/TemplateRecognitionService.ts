import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../infrastructure/KafkaService';
import {
  Document,
  DocumentTemplate,
  TemplatePattern,
  DocumentType,
  Language,
  BoundingBox,
  OCRResult,
  ProcessingStatus
} from '../../models/documentManagement/DocumentManagement';

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
  type: 'HEADER' | 'FOOTER' | 'TABLE' | 'LOGO' | 'SIGNATURE' | 'FORM_FIELD' | 'BARCODE' | 'QR_CODE';
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

export class TemplateRecognitionService {
  private prisma: PrismaClient;
  private logger: Logger;
  private kafkaService: KafkaService;
  private templates: Map<string, DocumentTemplate>;
  private mlModels: Map<string, any>;
  private keywordDictionaries: Map<DocumentType, string[]>;
  private layoutPatterns: Map<DocumentType, any>;

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    kafkaService: KafkaService
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.kafkaService = kafkaService;
    this.templates = new Map();
    this.mlModels = new Map();
    this.keywordDictionaries = new Map();
    this.layoutPatterns = new Map();
    this.initializeTemplateRecognition();
  }

  async recognizeTemplate(
    request: TemplateRecognitionRequest
  ): Promise<TemplateRecognitionResult> {
    try {
      this.logger.info('Starting template recognition', {
        documentId: request.documentId,
        expectedType: request.expectedDocumentType,
        language: request.language
      });

      const startTime = Date.now();
      const documentStructure = await this.analyzeDocumentStructure(request.ocrResults);
      const keywordMatches = await this.extractKeywords(request.ocrResults, request.language);

      const availableTemplates = request.customTemplates || 
        Array.from(this.templates.values()).filter(t => t.language === request.language);

      const layoutScores = await this.performLayoutBasedRecognition(
        documentStructure,
        availableTemplates
      );

      const keywordScores = await this.performKeywordBasedRecognition(
        keywordMatches,
        availableTemplates
      );

      const mlScores = await this.performMLBasedRecognition(
        request.ocrResults,
        availableTemplates
      );

      const combinedScores = await this.combineRecognitionScores(
        layoutScores,
        keywordScores,
        mlScores,
        request.expectedDocumentType
      );

      const classificationScores = await this.generateClassificationScores(
        combinedScores,
        documentStructure,
        keywordMatches
      );

      const bestMatch = combinedScores[0];
      const recognizedTemplate = bestMatch ? availableTemplates.find(t => t.id === bestMatch.templateId) : undefined;

      const alternativeTemplates = combinedScores.slice(1, 4).map(score => ({
        template: availableTemplates.find(t => t.id === score.templateId)!,
        confidence: score.totalScore,
        matchingPatterns: this.getMatchingPatterns(score, availableTemplates.find(t => t.id === score.templateId)!)
      })).filter(alt => alt.template);

      const result: TemplateRecognitionResult = {
        documentId: request.documentId,
        recognizedTemplate,
        confidence: bestMatch ? bestMatch.totalScore : 0,
        alternativeTemplates,
        classificationScores,
        recognitionMethod: 'HYBRID',
        metadata: {
          processingTime: Date.now() - startTime,
          patternsEvaluated: availableTemplates.length,
          featuresExtracted: documentStructure.headers.length + documentStructure.tables.length + documentStructure.forms.length,
          layoutAnalysisTime: 0,
          keywordAnalysisTime: 0,
          mlInferenceTime: 0,
          recognizedAt: new Date()
        }
      };

      await this.publishTemplateRecognitionEvent(request.documentId, request.tenantId, result);

      this.logger.info('Template recognition completed', {
        documentId: request.documentId,
        recognizedTemplate: recognizedTemplate?.name,
        confidence: result.confidence,
        processingTime: result.metadata.processingTime
      });

      return result;

    } catch (error) {
      this.logger.error('Template recognition failed', {
        documentId: request.documentId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private async analyzeDocumentStructure(ocrResults: OCRResult[]): Promise<DocumentStructure> {
    const structure: DocumentStructure = {
      headers: [],
      footers: [],
      tables: [],
      forms: [],
      signatures: [],
      logos: [],
      barcodes: [],
      textBlocks: [],
      images: []
    };

    for (const ocrResult of ocrResults) {
      structure.headers.push(...this.detectHeaders(ocrResult));
      structure.footers.push(...this.detectFooters(ocrResult));
      structure.tables.push(...this.detectTables(ocrResult));
      structure.forms.push(...this.detectFormFields(ocrResult));
      structure.signatures.push(...this.detectSignatures(ocrResult));
      structure.logos.push(...this.detectLogos(ocrResult));
      structure.barcodes.push(...this.detectBarcodes(ocrResult));
      structure.textBlocks.push(...this.detectTextBlocks(ocrResult));
    }

    return structure;
  }

  private detectHeaders(ocrResult: OCRResult): LayoutFeature[] {
    const headers: LayoutFeature[] = [];
    const pageHeight = Math.max(...ocrResult.regions.map(r => r.boundingBox.y + r.boundingBox.height));
    const headerThreshold = pageHeight * 0.15;

    for (const line of ocrResult.lines) {
      if (line.boundingBox.y <= headerThreshold) {
        const isHeader = this.isHeaderText(line.text);
        if (isHeader.confidence > 0.7) {
          headers.push({
            type: 'HEADER',
            boundingBox: line.boundingBox,
            confidence: isHeader.confidence,
            text: line.text,
            metadata: { patterns: isHeader.patterns }
          });
        }
      }
    }

    return headers;
  }

  private detectFooters(ocrResult: OCRResult): LayoutFeature[] {
    const footers: LayoutFeature[] = [];
    const pageHeight = Math.max(...ocrResult.regions.map(r => r.boundingBox.y + r.boundingBox.height));
    const footerThreshold = pageHeight * 0.85;

    for (const line of ocrResult.lines) {
      if (line.boundingBox.y >= footerThreshold) {
        const isFooter = this.isFooterText(line.text);
        if (isFooter.confidence > 0.7) {
          footers.push({
            type: 'FOOTER',
            boundingBox: line.boundingBox,
            confidence: isFooter.confidence,
            text: line.text,
            metadata: { patterns: isFooter.patterns }
          });
        }
      }
    }

    return footers;
  }

  private detectTables(ocrResult: OCRResult): LayoutFeature[] {
    const tables: LayoutFeature[] = [];
    
    const lines = ocrResult.lines.sort((a, b) => a.boundingBox.y - b.boundingBox.y);
    const potentialRows: OCRLine[][] = [];
    let currentRow: OCRLine[] = [];
    let currentY = -1;

    for (const line of lines) {
      if (currentY === -1 || Math.abs(line.boundingBox.y - currentY) < 10) {
        currentRow.push(line);
        currentY = line.boundingBox.y;
      } else {
        if (currentRow.length > 1) {
          potentialRows.push([...currentRow]);
        }
        currentRow = [line];
        currentY = line.boundingBox.y;
      }
    }

    if (currentRow.length > 1) {
      potentialRows.push(currentRow);
    }

    if (potentialRows.length >= 3) {
      const minX = Math.min(...potentialRows.flat().map(l => l.boundingBox.x));
      const maxX = Math.max(...potentialRows.flat().map(l => l.boundingBox.x + l.boundingBox.width));
      const minY = Math.min(...potentialRows.flat().map(l => l.boundingBox.y));
      const maxY = Math.max(...potentialRows.flat().map(l => l.boundingBox.y + l.boundingBox.height));

      tables.push({
        type: 'TABLE',
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        },
        confidence: 0.8,
        metadata: { rows: potentialRows.length, columns: Math.max(...potentialRows.map(r => r.length)) }
      });
    }

    return tables;
  }

  private detectFormFields(ocrResult: OCRResult): LayoutFeature[] {
    const formFields: LayoutFeature[] = [];
    const formPatterns = [
      /name\s*:?\s*$/i,
      /date\s*:?\s*$/i,
      /signature\s*:?\s*$/i,
      /amount\s*:?\s*\$?$/i,
      /address\s*:?\s*$/i,
      /phone\s*:?\s*$/i,
      /email\s*:?\s*$/i,
      /_+\s*$/,
      /\[\s*\]\s*.*/,
      /☐\s*.*/
    ];

    for (const line of ocrResult.lines) {
      for (const pattern of formPatterns) {
        if (pattern.test(line.text)) {
          formFields.push({
            type: 'FORM_FIELD',
            boundingBox: line.boundingBox,
            confidence: 0.8,
            text: line.text,
            metadata: { pattern: pattern.toString() }
          });
          break;
        }
      }
    }

    return formFields;
  }

  private detectSignatures(ocrResult: OCRResult): LayoutFeature[] {
    const signatures: LayoutFeature[] = [];
    const signatureKeywords = ['sign', 'signature', 'signed', 'x:', '/s/'];

    for (const line of ocrResult.lines) {
      const lowerText = line.text.toLowerCase();
      for (const keyword of signatureKeywords) {
        if (lowerText.includes(keyword)) {
          signatures.push({
            type: 'SIGNATURE',
            boundingBox: line.boundingBox,
            confidence: 0.7,
            text: line.text,
            metadata: { keyword }
          });
          break;
        }
      }
    }

    return signatures;
  }

  private detectLogos(ocrResult: OCRResult): LayoutFeature[] {
    const logos: LayoutFeature[] = [];
    
    for (const region of ocrResult.regions) {
      const isCompanyName = this.isCompanyName(region.text);
      if (isCompanyName.confidence > 0.8 && region.boundingBox.y < 100) {
        logos.push({
          type: 'LOGO',
          boundingBox: region.boundingBox,
          confidence: isCompanyName.confidence,
          text: region.text,
          metadata: { indicators: isCompanyName.indicators }
        });
      }
    }

    return logos;
  }

  private detectBarcodes(ocrResult: OCRResult): LayoutFeature[] {
    const barcodes: LayoutFeature[] = [];
    const barcodePattern = /^[A-Z0-9]{8,}$/;

    for (const line of ocrResult.lines) {
      if (barcodePattern.test(line.text.replace(/\s/g, ''))) {
        barcodes.push({
          type: 'BARCODE',
          boundingBox: line.boundingBox,
          confidence: 0.9,
          text: line.text
        });
      }
    }

    return barcodes;
  }

  private detectTextBlocks(ocrResult: OCRResult): LayoutFeature[] {
    return ocrResult.paragraphs.map(para => ({
      type: 'TEXT_BLOCK' as const,
      boundingBox: para.boundingBox,
      confidence: para.confidence,
      text: para.text
    }));
  }

  private isHeaderText(text: string): { confidence: number; patterns: string[] } {
    const headerPatterns = [
      { pattern: /^[A-Z\s&.,]+$/i, weight: 0.3 },
      { pattern: /company|corporation|inc\.|ltd\.|llc/i, weight: 0.4 },
      { pattern: /statement|report|invoice|contract/i, weight: 0.5 },
      { pattern: /^\d{1,2}\/\d{1,2}\/\d{4}/, weight: -0.3 },
      { pattern: /^page\s+\d+/i, weight: -0.5 }
    ];

    let confidence = 0;
    const matchedPatterns: string[] = [];

    for (const { pattern, weight } of headerPatterns) {
      if (pattern.test(text)) {
        confidence += weight;
        matchedPatterns.push(pattern.toString());
      }
    }

    return { confidence: Math.max(0, Math.min(1, confidence + 0.5)), patterns: matchedPatterns };
  }

  private isFooterText(text: string): { confidence: number; patterns: string[] } {
    const footerPatterns = [
      { pattern: /page\s+\d+/i, weight: 0.6 },
      { pattern: /confidential|proprietary/i, weight: 0.5 },
      { pattern: /copyright|©|\(c\)/i, weight: 0.5 },
      { pattern: /www\.|@|\.com/i, weight: 0.4 },
      { pattern: /^\d{1,2}\/\d{1,2}\/\d{4}/, weight: 0.3 }
    ];

    let confidence = 0;
    const matchedPatterns: string[] = [];

    for (const { pattern, weight } of footerPatterns) {
      if (pattern.test(text)) {
        confidence += weight;
        matchedPatterns.push(pattern.toString());
      }
    }

    return { confidence: Math.max(0, Math.min(1, confidence)), patterns: matchedPatterns };
  }

  private isCompanyName(text: string): { confidence: number; indicators: string[] } {
    const companyIndicators = [
      { pattern: /\b(inc|ltd|llc|corp|corporation|company|co\.)\b/i, weight: 0.5 },
      { pattern: /^[A-Z][a-zA-Z\s&.,]+$/i, weight: 0.3 },
      { pattern: /investment|financial|capital|fund|group/i, weight: 0.4 },
      { pattern: /bank|trust|securities|asset/i, weight: 0.4 }
    ];

    let confidence = 0;
    const indicators: string[] = [];

    for (const { pattern, weight } of companyIndicators) {
      if (pattern.test(text)) {
        confidence += weight;
        indicators.push(pattern.toString());
      }
    }

    return { confidence: Math.max(0, Math.min(1, confidence)), indicators };
  }

  private async extractKeywords(ocrResults: OCRResult[], language: Language): Promise<KeywordMatch[]> {
    const keywords: KeywordMatch[] = [];
    const allDocumentTypeKeywords = new Map<DocumentType, { keywords: string[]; weights: number[] }>();

    allDocumentTypeKeywords.set(DocumentType.TRADE_CONFIRMATION, {
      keywords: ['trade', 'confirmation', 'buy', 'sell', 'shares', 'price', 'commission'],
      weights: [0.9, 0.9, 0.8, 0.8, 0.7, 0.7, 0.6]
    });

    allDocumentTypeKeywords.set(DocumentType.STATEMENT, {
      keywords: ['statement', 'account', 'balance', 'period', 'summary', 'portfolio'],
      weights: [0.9, 0.8, 0.8, 0.7, 0.7, 0.8]
    });

    allDocumentTypeKeywords.set(DocumentType.PROSPECTUS, {
      keywords: ['prospectus', 'fund', 'investment', 'objective', 'risk', 'disclosure'],
      weights: [0.9, 0.8, 0.8, 0.7, 0.8, 0.7]
    });

    for (const ocrResult of ocrResults) {
      for (const [docType, { keywords: typeKeywords, weights }] of allDocumentTypeKeywords) {
        for (let i = 0; i < typeKeywords.length; i++) {
          const keyword = typeKeywords[i];
          const weight = weights[i];
          
          for (const line of ocrResult.lines) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = [...line.text.matchAll(regex)];
            
            for (const match of matches) {
              keywords.push({
                keyword,
                position: line.boundingBox,
                confidence: weight,
                context: line.text,
                importance: weight
              });
            }
          }
        }
      }
    }

    return keywords.sort((a, b) => b.confidence - a.confidence);
  }

  private async performLayoutBasedRecognition(
    structure: DocumentStructure,
    templates: DocumentTemplate[]
  ): Promise<TemplateMatchingScore[]> {
    const scores: TemplateMatchingScore[] = [];

    for (const template of templates) {
      const layoutPatterns = template.templatePatterns.filter(p => p.patternType === 'LAYOUT');
      let layoutScore = 0;

      for (const pattern of layoutPatterns) {
        const matchResult = this.matchLayoutPattern(pattern, structure);
        layoutScore += matchResult * pattern.weight;
      }

      scores.push({
        templateId: template.id,
        totalScore: layoutScore,
        layoutScore,
        keywordScore: 0,
        structureScore: 0,
        contentScore: 0,
        confidenceScore: 0,
        penaltyScore: 0
      });
    }

    return scores.sort((a, b) => b.layoutScore - a.layoutScore);
  }

  private async performKeywordBasedRecognition(
    keywordMatches: KeywordMatch[],
    templates: DocumentTemplate[]
  ): Promise<TemplateMatchingScore[]> {
    const scores: TemplateMatchingScore[] = [];

    for (const template of templates) {
      const keywordPatterns = template.templatePatterns.filter(p => p.patternType === 'KEYWORD');
      let keywordScore = 0;

      for (const pattern of keywordPatterns) {
        const matchCount = keywordMatches.filter(km => 
          new RegExp(pattern.pattern, 'i').test(km.keyword)
        ).length;
        
        if (matchCount > 0) {
          keywordScore += (matchCount / keywordMatches.length) * pattern.weight;
        }
      }

      scores.push({
        templateId: template.id,
        totalScore: keywordScore,
        layoutScore: 0,
        keywordScore,
        structureScore: 0,
        contentScore: 0,
        confidenceScore: 0,
        penaltyScore: 0
      });
    }

    return scores.sort((a, b) => b.keywordScore - a.keywordScore);
  }

  private async performMLBasedRecognition(
    ocrResults: OCRResult[],
    templates: DocumentTemplate[]
  ): Promise<TemplateMatchingScore[]> {
    const scores: TemplateMatchingScore[] = [];

    try {
      const mlModel = this.mlModels.get('document_classifier');
      if (!mlModel) {
        return scores;
      }

      const features = this.extractMLFeatures(ocrResults);
      const predictions = await mlModel.predict(features);

      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const prediction = predictions[i] || 0;

        scores.push({
          templateId: template.id,
          totalScore: prediction,
          layoutScore: 0,
          keywordScore: 0,
          structureScore: 0,
          contentScore: prediction,
          confidenceScore: prediction,
          penaltyScore: 0
        });
      }

    } catch (error) {
      this.logger.warn('ML-based recognition failed', { error: error.message });
    }

    return scores.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private async combineRecognitionScores(
    layoutScores: TemplateMatchingScore[],
    keywordScores: TemplateMatchingScore[],
    mlScores: TemplateMatchingScore[],
    expectedType?: DocumentType
  ): Promise<TemplateMatchingScore[]> {
    const combinedScores = new Map<string, TemplateMatchingScore>();

    const weights = { layout: 0.3, keyword: 0.4, ml: 0.3 };

    for (const score of layoutScores) {
      combinedScores.set(score.templateId, { ...score });
    }

    for (const score of keywordScores) {
      const existing = combinedScores.get(score.templateId);
      if (existing) {
        existing.keywordScore = score.keywordScore;
      } else {
        combinedScores.set(score.templateId, { ...score });
      }
    }

    for (const score of mlScores) {
      const existing = combinedScores.get(score.templateId);
      if (existing) {
        existing.contentScore = score.contentScore;
        existing.confidenceScore = score.confidenceScore;
      } else {
        combinedScores.set(score.templateId, { ...score });
      }
    }

    for (const [templateId, score] of combinedScores) {
      score.totalScore = 
        (score.layoutScore * weights.layout) +
        (score.keywordScore * weights.keyword) +
        (score.confidenceScore * weights.ml);

      if (expectedType) {
        const template = this.templates.get(templateId);
        if (template && template.documentType === expectedType) {
          score.totalScore *= 1.2;
        }
      }
    }

    return Array.from(combinedScores.values()).sort((a, b) => b.totalScore - a.totalScore);
  }

  private async generateClassificationScores(
    templateScores: TemplateMatchingScore[],
    structure: DocumentStructure,
    keywordMatches: KeywordMatch[]
  ): Promise<ClassificationScore[]> {
    const typeScores = new Map<DocumentType, number>();
    const typeFeatures = new Map<DocumentType, string[]>();

    for (const score of templateScores) {
      const template = this.templates.get(score.templateId);
      if (template) {
        const currentScore = typeScores.get(template.documentType) || 0;
        typeScores.set(template.documentType, Math.max(currentScore, score.totalScore));

        const features = typeFeatures.get(template.documentType) || [];
        features.push(`Template: ${template.name}`);
        typeFeatures.set(template.documentType, features);
      }
    }

    const documentTypes = Array.from(typeScores.keys());
    return documentTypes.map(docType => ({
      documentType: docType,
      confidence: typeScores.get(docType) || 0,
      matchingFeatures: typeFeatures.get(docType) || []
    })).sort((a, b) => b.confidence - a.confidence);
  }

  private matchLayoutPattern(pattern: TemplatePattern, structure: DocumentStructure): number {
    switch (pattern.pattern) {
      case 'HAS_HEADER':
        return structure.headers.length > 0 ? 1 : 0;
      case 'HAS_FOOTER':
        return structure.footers.length > 0 ? 1 : 0;
      case 'HAS_TABLE':
        return structure.tables.length > 0 ? 1 : 0;
      case 'HAS_FORM':
        return structure.forms.length > 0 ? 1 : 0;
      case 'HAS_SIGNATURE':
        return structure.signatures.length > 0 ? 1 : 0;
      case 'HAS_LOGO':
        return structure.logos.length > 0 ? 1 : 0;
      default:
        return 0;
    }
  }

  private extractMLFeatures(ocrResults: OCRResult[]): number[] {
    const features: number[] = [];
    
    for (const ocrResult of ocrResults) {
      features.push(
        ocrResult.text.length,
        ocrResult.words.length,
        ocrResult.lines.length,
        ocrResult.confidence,
        ocrResult.regions.length
      );
    }

    while (features.length < 100) {
      features.push(0);
    }

    return features.slice(0, 100);
  }

  private getMatchingPatterns(score: TemplateMatchingScore, template: DocumentTemplate): string[] {
    const patterns: string[] = [];
    
    if (score.layoutScore > 0.5) {
      patterns.push('Layout Match');
    }
    if (score.keywordScore > 0.5) {
      patterns.push('Keyword Match');
    }
    if (score.confidenceScore > 0.5) {
      patterns.push('ML Classification');
    }

    return patterns;
  }

  private async initializeTemplateRecognition(): Promise<void> {
    try {
      await this.loadDefaultTemplates();
      await this.initializeMLModels();
      
      this.logger.info('Template recognition service initialized', {
        templates: this.templates.size,
        models: this.mlModels.size
      });
    } catch (error) {
      this.logger.error('Failed to initialize template recognition', { error: error.message });
    }
  }

  private async loadDefaultTemplates(): Promise<void> {
    const defaultTemplates: DocumentTemplate[] = [
      {
        id: 'trade_confirmation_v1',
        name: 'Trade Confirmation - Standard',
        documentType: DocumentType.TRADE_CONFIRMATION,
        language: Language.ENGLISH,
        version: '1.0',
        templatePatterns: [
          {
            id: 'tc_header',
            patternType: 'KEYWORD',
            pattern: 'trade confirmation',
            weight: 0.9,
            description: 'Trade confirmation header',
            isRequired: true
          },
          {
            id: 'tc_table',
            patternType: 'LAYOUT',
            pattern: 'HAS_TABLE',
            weight: 0.8,
            description: 'Transaction details table',
            isRequired: true
          }
        ],
        extractionRules: [],
        validationRules: [],
        confidence: 0.95,
        lastUpdated: new Date(),
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        id: 'account_statement_v1',
        name: 'Account Statement - Standard',
        documentType: DocumentType.STATEMENT,
        language: Language.ENGLISH,
        version: '1.0',
        templatePatterns: [
          {
            id: 'stmt_header',
            patternType: 'KEYWORD',
            pattern: 'account statement',
            weight: 0.9,
            description: 'Statement header',
            isRequired: true
          },
          {
            id: 'stmt_period',
            patternType: 'REGEX',
            pattern: '\\d{1,2}/\\d{1,2}/\\d{4}\\s*-\\s*\\d{1,2}/\\d{1,2}/\\d{4}',
            weight: 0.7,
            description: 'Statement period',
            isRequired: false
          }
        ],
        extractionRules: [],
        validationRules: [],
        confidence: 0.92,
        lastUpdated: new Date(),
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system'
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }

    this.logger.info('Default templates loaded', { count: defaultTemplates.length });
  }

  private async initializeMLModels(): Promise<void> {
    try {
      this.mlModels.set('document_classifier', {
        predict: async (features: number[]) => {
          return features.map(() => Math.random());
        }
      });

      this.logger.info('ML models initialized for template recognition');
    } catch (error) {
      this.logger.warn('Failed to initialize ML models', { error: error.message });
    }
  }

  private async publishTemplateRecognitionEvent(
    documentId: string,
    tenantId: string,
    result: TemplateRecognitionResult
  ): Promise<void> {
    const event = {
      eventType: 'TEMPLATE_RECOGNITION_COMPLETED',
      documentId,
      tenantId,
      recognizedTemplate: result.recognizedTemplate?.name,
      confidence: result.confidence,
      method: result.recognitionMethod,
      timestamp: new Date().toISOString()
    };

    await this.kafkaService.publishEvent('document-processing', event);
  }
}
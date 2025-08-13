export enum DocumentType {
  TRADE_CONFIRMATION = 'TRADE_CONFIRMATION',
  STATEMENT = 'STATEMENT',
  PROSPECTUS = 'PROSPECTUS',
  OFFERING_MEMORANDUM = 'OFFERING_MEMORANDUM',
  TERM_SHEET = 'TERM_SHEET',
  ANNUAL_REPORT = 'ANNUAL_REPORT',
  QUARTERLY_REPORT = 'QUARTERLY_REPORT',
  TAX_DOCUMENT = 'TAX_DOCUMENT',
  COMPLIANCE_CERTIFICATE = 'COMPLIANCE_CERTIFICATE',
  CONTRACT = 'CONTRACT',
  AMENDMENT = 'AMENDMENT',
  LEGAL_OPINION = 'LEGAL_OPINION',
  AUDIT_REPORT = 'AUDIT_REPORT',
  REGULATORY_FILING = 'REGULATORY_FILING',
  CLIENT_COMMUNICATION = 'CLIENT_COMMUNICATION',
  INVESTMENT_COMMITTEE_MINUTES = 'INVESTMENT_COMMITTEE_MINUTES',
  DUE_DILIGENCE_REPORT = 'DUE_DILIGENCE_REPORT',
  PERFORMANCE_REPORT = 'PERFORMANCE_REPORT',
  RISK_REPORT = 'RISK_REPORT',
  SUBSCRIPTION_AGREEMENT = 'SUBSCRIPTION_AGREEMENT',
  REDEMPTION_NOTICE = 'REDEMPTION_NOTICE',
  TRANSFER_AGREEMENT = 'TRANSFER_AGREEMENT',
  KYC_DOCUMENT = 'KYC_DOCUMENT',
  AML_DOCUMENT = 'AML_DOCUMENT',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  OCR_IN_PROGRESS = 'OCR_IN_PROGRESS',
  CLASSIFICATION_IN_PROGRESS = 'CLASSIFICATION_IN_PROGRESS',
  EXTRACTION_IN_PROGRESS = 'EXTRACTION_IN_PROGRESS',
  VALIDATION_IN_PROGRESS = 'VALIDATION_IN_PROGRESS',
  PROCESSED = 'PROCESSED',
  FILED = 'FILED',
  ARCHIVED = 'ARCHIVED',
  ERROR = 'ERROR',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum DocumentClassification {
  HIGHLY_CONFIDENTIAL = 'HIGHLY_CONFIDENTIAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  INTERNAL = 'INTERNAL',
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED'
}

export enum ProcessingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRY_REQUIRED = 'RETRY_REQUIRED'
}

export enum Language {
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  DUTCH = 'nl',
  RUSSIAN = 'ru',
  CHINESE_SIMPLIFIED = 'zh-CN',
  CHINESE_TRADITIONAL = 'zh-TW',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  ARABIC = 'ar',
  HINDI = 'hi'
}

export interface DocumentTemplate {
  id: string;
  name: string;
  documentType: DocumentType;
  language: Language;
  version: string;
  templatePatterns: TemplatePattern[];
  extractionRules: ExtractionRule[];
  validationRules: ValidationRule[];
  confidence: number;
  lastUpdated: Date;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface TemplatePattern {
  id: string;
  patternType: 'REGEX' | 'LAYOUT' | 'KEYWORD' | 'ML_MODEL';
  pattern: string;
  weight: number;
  description: string;
  isRequired: boolean;
}

export interface ExtractionRule {
  id: string;
  fieldName: string;
  fieldType: 'STRING' | 'NUMBER' | 'DATE' | 'CURRENCY' | 'PERCENTAGE' | 'BOOLEAN';
  extractionMethod: 'REGEX' | 'OCR_REGION' | 'NLP' | 'ML_MODEL';
  pattern: string;
  coordinates?: BoundingBox;
  validationRules: string[];
  isRequired: boolean;
  defaultValue?: any;
}

export interface ValidationRule {
  id: string;
  fieldName: string;
  ruleType: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'CUSTOM';
  rule: string;
  errorMessage: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRResult {
  id: string;
  documentId: string;
  pageNumber: number;
  text: string;
  confidence: number;
  language: Language;
  words: OCRWord[];
  lines: OCRLine[];
  paragraphs: OCRParagraph[];
  regions: OCRRegion[];
  processingTime: number;
  ocrEngine: string;
  ocrVersion: string;
  createdAt: Date;
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface OCRLine {
  text: string;
  confidence: number;
  words: OCRWord[];
  boundingBox: BoundingBox;
}

export interface OCRParagraph {
  text: string;
  confidence: number;
  lines: OCRLine[];
  boundingBox: BoundingBox;
}

export interface OCRRegion {
  text: string;
  confidence: number;
  paragraphs: OCRParagraph[];
  boundingBox: BoundingBox;
}

export interface ExtractedData {
  id: string;
  documentId: string;
  templateId?: string;
  extractionMethod: 'TEMPLATE_BASED' | 'ML_BASED' | 'HYBRID';
  confidence: number;
  fields: ExtractedField[];
  validationResults: ValidationResult[];
  processingTime: number;
  extractedAt: Date;
  extractedBy: string;
}

export interface ExtractedField {
  fieldName: string;
  fieldType: string;
  value: any;
  confidence: number;
  source: 'OCR' | 'NLP' | 'ML_MODEL' | 'MANUAL';
  boundingBox?: BoundingBox;
  alternativeValues?: AlternativeValue[];
}

export interface AlternativeValue {
  value: any;
  confidence: number;
  source: string;
}

export interface ValidationResult {
  fieldName: string;
  isValid: boolean;
  errorMessage?: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  validatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: string;
  filePath: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeDescription: string;
  isCurrentVersion: boolean;
}

export interface DocumentAuditLog {
  id: string;
  documentId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'VIEWED' | 'DOWNLOADED' | 'PROCESSED' | 'CLASSIFIED' | 'EXTRACTED' | 'VALIDATED' | 'FILED' | 'ARCHIVED';
  performedBy: string;
  performedAt: Date;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface DocumentSearchIndex {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, any>;
  extractedFields: Record<string, any>;
  tags: string[];
  language: Language;
  lastIndexed: Date;
  indexVersion: string;
}

export interface Document {
  id: string;
  tenantId: string;
  portfolioId?: string;
  clientId?: string;
  documentType: DocumentType;
  classification: DocumentClassification;
  status: DocumentStatus;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  language: Language;
  pageCount: number;
  title?: string;
  description?: string;
  tags: string[];
  metadata: Record<string, any>;
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  filedAt?: Date;
  archivedAt?: Date;
  expiresAt?: Date;
  versions: DocumentVersion[];
  ocrResults: OCRResult[];
  extractedData: ExtractedData[];
  auditLog: DocumentAuditLog[];
  searchIndex?: DocumentSearchIndex;
  relatedDocuments: string[];
  parentDocumentId?: string;
  childDocumentIds: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface DocumentProcessingJob {
  id: string;
  documentId: string;
  tenantId: string;
  jobType: 'OCR' | 'CLASSIFICATION' | 'EXTRACTION' | 'VALIDATION' | 'INDEXING' | 'FILING';
  status: ProcessingStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  configuration: Record<string, any>;
  results?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentRequest {
  tenantId: string;
  portfolioId?: string;
  clientId?: string;
  documentType: DocumentType;
  classification: DocumentClassification;
  fileName: string;
  mimeType: string;
  language?: Language;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
  parentDocumentId?: string;
  processingOptions?: ProcessingOptions;
}

export interface ProcessingOptions {
  enableOCR: boolean;
  enableClassification: boolean;
  enableExtraction: boolean;
  enableValidation: boolean;
  enableIndexing: boolean;
  autoFile: boolean;
  templateId?: string;
  customExtractionRules?: ExtractionRule[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface DocumentSearchRequest {
  tenantId: string;
  query?: string;
  documentTypes?: DocumentType[];
  classifications?: DocumentClassification[];
  statuses?: DocumentStatus[];
  portfolioIds?: string[];
  clientIds?: string[];
  tags?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
    field: 'uploadedAt' | 'processedAt' | 'filedAt' | 'createdAt';
  };
  language?: Language;
  metadata?: Record<string, any>;
  extractedFields?: Record<string, any>;
  sortBy?: 'relevance' | 'uploadedAt' | 'processedAt' | 'title' | 'fileName';
  sortOrder?: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

export interface DocumentSearchResult {
  documents: Document[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
  suggestions?: string[];
  searchTime: number;
}

export interface SearchFacets {
  documentTypes: FacetCount[];
  classifications: FacetCount[];
  statuses: FacetCount[];
  languages: FacetCount[];
  tags: FacetCount[];
  portfolios: FacetCount[];
  clients: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface DocumentStats {
  tenantId: string;
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  documentsByStatus: Record<DocumentStatus, number>;
  documentsByClassification: Record<DocumentClassification, number>;
  totalFileSize: number;
  averageProcessingTime: number;
  ocrSuccessRate: number;
  extractionSuccessRate: number;
  validationSuccessRate: number;
  generatedAt: Date;
}

export interface DocumentProcessingMetrics {
  tenantId: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startDate: Date;
  endDate: Date;
  documentsProcessed: number;
  ocrJobsCompleted: number;
  extractionJobsCompleted: number;
  validationJobsCompleted: number;
  averageOCRTime: number;
  averageExtractionTime: number;
  averageValidationTime: number;
  errorRate: number;
  throughput: number;
  generatedAt: Date;
}
-- Document Management System Migration
-- This migration creates all tables needed for the comprehensive document management system

-- Document types enum
CREATE TYPE "DocumentType" AS ENUM (
  'TRADE_CONFIRMATION',
  'STATEMENT',
  'PROSPECTUS',
  'OFFERING_MEMORANDUM',
  'TERM_SHEET',
  'ANNUAL_REPORT',
  'QUARTERLY_REPORT',
  'TAX_DOCUMENT',
  'COMPLIANCE_CERTIFICATE',
  'CONTRACT',
  'AMENDMENT',
  'LEGAL_OPINION',
  'AUDIT_REPORT',
  'REGULATORY_FILING',
  'CLIENT_COMMUNICATION',
  'INVESTMENT_COMMITTEE_MINUTES',
  'DUE_DILIGENCE_REPORT',
  'PERFORMANCE_REPORT',
  'RISK_REPORT',
  'SUBSCRIPTION_AGREEMENT',
  'REDEMPTION_NOTICE',
  'TRANSFER_AGREEMENT',
  'KYC_DOCUMENT',
  'AML_DOCUMENT',
  'OTHER'
);

-- Document status enum
CREATE TYPE "DocumentStatus" AS ENUM (
  'PENDING_UPLOAD',
  'UPLOADING',
  'PROCESSING',
  'OCR_IN_PROGRESS',
  'CLASSIFICATION_IN_PROGRESS',
  'EXTRACTION_IN_PROGRESS',
  'VALIDATION_IN_PROGRESS',
  'PROCESSED',
  'FILED',
  'ARCHIVED',
  'ERROR',
  'REJECTED',
  'EXPIRED'
);

-- Document classification enum
CREATE TYPE "DocumentClassification" AS ENUM (
  'HIGHLY_CONFIDENTIAL',
  'CONFIDENTIAL',
  'INTERNAL',
  'PUBLIC',
  'RESTRICTED'
);

-- Processing status enum
CREATE TYPE "ProcessingStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'RETRY_REQUIRED'
);

-- Language enum
CREATE TYPE "Language" AS ENUM (
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'nl',
  'ru',
  'zh-CN',
  'zh-TW',
  'ja',
  'ko',
  'ar',
  'hi'
);

-- Audit action enum
CREATE TYPE "AuditAction" AS ENUM (
  'CREATED',
  'UPDATED',
  'DELETED',
  'VIEWED',
  'DOWNLOADED',
  'PROCESSED',
  'CLASSIFIED',
  'EXTRACTED',
  'VALIDATED',
  'FILED',
  'ARCHIVED'
);

-- Main documents table
CREATE TABLE "documents" (
  "id" VARCHAR(255) PRIMARY KEY,
  "tenant_id" VARCHAR(255) NOT NULL,
  "portfolio_id" VARCHAR(255),
  "client_id" VARCHAR(255),
  "document_type" "DocumentType" NOT NULL,
  "classification" "DocumentClassification" NOT NULL DEFAULT 'INTERNAL',
  "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
  "file_name" VARCHAR(255) NOT NULL,
  "original_file_name" VARCHAR(255) NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" BIGINT NOT NULL DEFAULT 0,
  "mime_type" VARCHAR(100) NOT NULL,
  "checksum" VARCHAR(255) NOT NULL,
  "language" "Language" NOT NULL DEFAULT 'en',
  "page_count" INTEGER DEFAULT 1,
  "title" TEXT,
  "description" TEXT,
  "tags" TEXT[] DEFAULT '{}',
  "metadata" JSONB DEFAULT '{}',
  "uploaded_by" VARCHAR(255) NOT NULL,
  "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "processed_at" TIMESTAMP WITH TIME ZONE,
  "filed_at" TIMESTAMP WITH TIME ZONE,
  "archived_at" TIMESTAMP WITH TIME ZONE,
  "expires_at" TIMESTAMP WITH TIME ZONE,
  "related_documents" TEXT[] DEFAULT '{}',
  "parent_document_id" VARCHAR(255),
  "child_document_ids" TEXT[] DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_by" VARCHAR(255) NOT NULL,
  "updated_by" VARCHAR(255) NOT NULL
);

-- Document versions table
CREATE TABLE "document_versions" (
  "id" VARCHAR(255) PRIMARY KEY,
  "document_id" VARCHAR(255) NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "version_number" VARCHAR(50) NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" BIGINT NOT NULL,
  "checksum" VARCHAR(255) NOT NULL,
  "uploaded_by" VARCHAR(255) NOT NULL,
  "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "change_description" TEXT,
  "is_current_version" BOOLEAN NOT NULL DEFAULT FALSE
);

-- OCR results table
CREATE TABLE "ocr_results" (
  "id" VARCHAR(255) PRIMARY KEY,
  "document_id" VARCHAR(255) NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "page_number" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL,
  "language" "Language" NOT NULL,
  "words" JSONB DEFAULT '[]',
  "lines" JSONB DEFAULT '[]',
  "paragraphs" JSONB DEFAULT '[]',
  "regions" JSONB DEFAULT '[]',
  "processing_time" INTEGER NOT NULL DEFAULT 0,
  "ocr_engine" VARCHAR(50) NOT NULL,
  "ocr_version" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Document templates table
CREATE TABLE "document_templates" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "document_type" "DocumentType" NOT NULL,
  "language" "Language" NOT NULL,
  "version" VARCHAR(20) NOT NULL DEFAULT '1.0',
  "template_patterns" JSONB DEFAULT '[]',
  "extraction_rules" JSONB DEFAULT '[]',
  "validation_rules" JSONB DEFAULT '[]',
  "confidence" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
  "last_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by" VARCHAR(255) NOT NULL,
  "updated_by" VARCHAR(255) NOT NULL
);

-- Extracted data table
CREATE TABLE "extracted_data" (
  "id" VARCHAR(255) PRIMARY KEY,
  "document_id" VARCHAR(255) NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "template_id" VARCHAR(255) REFERENCES "document_templates"("id"),
  "extraction_method" VARCHAR(50) NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL,
  "fields" JSONB DEFAULT '[]',
  "validation_results" JSONB DEFAULT '[]',
  "processing_time" INTEGER NOT NULL DEFAULT 0,
  "extracted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "extracted_by" VARCHAR(255) NOT NULL
);

-- Document processing jobs table
CREATE TABLE "document_processing_jobs" (
  "id" VARCHAR(255) PRIMARY KEY,
  "document_id" VARCHAR(255) NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "tenant_id" VARCHAR(255) NOT NULL,
  "job_type" VARCHAR(50) NOT NULL,
  "status" "ProcessingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP WITH TIME ZONE,
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 3,
  "configuration" JSONB DEFAULT '{}',
  "results" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Document audit log table
CREATE TABLE "document_audit_log" (
  "id" VARCHAR(255) PRIMARY KEY,
  "document_id" VARCHAR(255) NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "action" "AuditAction" NOT NULL,
  "performed_by" VARCHAR(255) NOT NULL,
  "performed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "details" TEXT NOT NULL,
  "ip_address" INET,
  "user_agent" TEXT,
  "metadata" JSONB DEFAULT '{}'
);

-- Document search index table
CREATE TABLE "document_search_index" (
  "id" VARCHAR(255) PRIMARY KEY,
  "document_id" VARCHAR(255) NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "extracted_fields" JSONB DEFAULT '{}',
  "tags" TEXT[] DEFAULT '{}',
  "language" "Language" NOT NULL,
  "last_indexed" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "index_version" VARCHAR(20) NOT NULL DEFAULT '1.0'
);

-- Create indexes for better performance
CREATE INDEX "idx_documents_tenant_id" ON "documents"("tenant_id");
CREATE INDEX "idx_documents_portfolio_id" ON "documents"("portfolio_id");
CREATE INDEX "idx_documents_client_id" ON "documents"("client_id");
CREATE INDEX "idx_documents_document_type" ON "documents"("document_type");
CREATE INDEX "idx_documents_status" ON "documents"("status");
CREATE INDEX "idx_documents_classification" ON "documents"("classification");
CREATE INDEX "idx_documents_uploaded_at" ON "documents"("uploaded_at");
CREATE INDEX "idx_documents_processed_at" ON "documents"("processed_at");
CREATE INDEX "idx_documents_filed_at" ON "documents"("filed_at");
CREATE INDEX "idx_documents_language" ON "documents"("language");
CREATE INDEX "idx_documents_tags" ON "documents" USING GIN("tags");
CREATE INDEX "idx_documents_metadata" ON "documents" USING GIN("metadata");

CREATE INDEX "idx_document_versions_document_id" ON "document_versions"("document_id");
CREATE INDEX "idx_document_versions_current" ON "document_versions"("document_id", "is_current_version");
CREATE INDEX "idx_document_versions_uploaded_at" ON "document_versions"("uploaded_at");

CREATE INDEX "idx_ocr_results_document_id" ON "ocr_results"("document_id");
CREATE INDEX "idx_ocr_results_page_number" ON "ocr_results"("document_id", "page_number");
CREATE INDEX "idx_ocr_results_language" ON "ocr_results"("language");
CREATE INDEX "idx_ocr_results_confidence" ON "ocr_results"("confidence");

CREATE INDEX "idx_document_templates_document_type" ON "document_templates"("document_type");
CREATE INDEX "idx_document_templates_language" ON "document_templates"("language");
CREATE INDEX "idx_document_templates_active" ON "document_templates"("is_active");

CREATE INDEX "idx_extracted_data_document_id" ON "extracted_data"("document_id");
CREATE INDEX "idx_extracted_data_template_id" ON "extracted_data"("template_id");
CREATE INDEX "idx_extracted_data_method" ON "extracted_data"("extraction_method");
CREATE INDEX "idx_extracted_data_confidence" ON "extracted_data"("confidence");
CREATE INDEX "idx_extracted_data_extracted_at" ON "extracted_data"("extracted_at");

CREATE INDEX "idx_processing_jobs_document_id" ON "document_processing_jobs"("document_id");
CREATE INDEX "idx_processing_jobs_tenant_id" ON "document_processing_jobs"("tenant_id");
CREATE INDEX "idx_processing_jobs_status" ON "document_processing_jobs"("status");
CREATE INDEX "idx_processing_jobs_job_type" ON "document_processing_jobs"("job_type");
CREATE INDEX "idx_processing_jobs_priority" ON "document_processing_jobs"("priority");
CREATE INDEX "idx_processing_jobs_created_at" ON "document_processing_jobs"("created_at");

CREATE INDEX "idx_audit_log_document_id" ON "document_audit_log"("document_id");
CREATE INDEX "idx_audit_log_performed_by" ON "document_audit_log"("performed_by");
CREATE INDEX "idx_audit_log_performed_at" ON "document_audit_log"("performed_at");
CREATE INDEX "idx_audit_log_action" ON "document_audit_log"("action");

CREATE INDEX "idx_search_index_document_id" ON "document_search_index"("document_id");
CREATE INDEX "idx_search_index_language" ON "document_search_index"("language");
CREATE INDEX "idx_search_index_content_text" ON "document_search_index" USING GIN(to_tsvector('english', "content"));
CREATE INDEX "idx_search_index_tags" ON "document_search_index" USING GIN("tags");
CREATE INDEX "idx_search_index_metadata" ON "document_search_index" USING GIN("metadata");
CREATE INDEX "idx_search_index_extracted_fields" ON "document_search_index" USING GIN("extracted_fields");

-- Create unique constraints
ALTER TABLE "document_versions" ADD CONSTRAINT "unique_document_current_version" 
  EXCLUDE ("document_id" WITH =) WHERE ("is_current_version" = true);

ALTER TABLE "documents" ADD CONSTRAINT "unique_document_file_path" 
  UNIQUE ("tenant_id", "file_path");

-- Create foreign key constraints
ALTER TABLE "documents" ADD CONSTRAINT "fk_documents_parent" 
  FOREIGN KEY ("parent_document_id") REFERENCES "documents"("id") ON DELETE SET NULL;

-- Add RLS (Row Level Security) policies for multi-tenancy
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ocr_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "extracted_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_processing_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_search_index" ENABLE ROW LEVEL SECURITY;

-- RLS policies for documents
CREATE POLICY "documents_tenant_isolation" ON "documents"
  USING ("tenant_id" = current_setting('app.current_tenant_id', true));

CREATE POLICY "document_versions_tenant_isolation" ON "document_versions"
  USING (EXISTS (
    SELECT 1 FROM "documents" d 
    WHERE d."id" = "document_versions"."document_id" 
    AND d."tenant_id" = current_setting('app.current_tenant_id', true)
  ));

CREATE POLICY "ocr_results_tenant_isolation" ON "ocr_results"
  USING (EXISTS (
    SELECT 1 FROM "documents" d 
    WHERE d."id" = "ocr_results"."document_id" 
    AND d."tenant_id" = current_setting('app.current_tenant_id', true)
  ));

CREATE POLICY "extracted_data_tenant_isolation" ON "extracted_data"
  USING (EXISTS (
    SELECT 1 FROM "documents" d 
    WHERE d."id" = "extracted_data"."document_id" 
    AND d."tenant_id" = current_setting('app.current_tenant_id', true)
  ));

CREATE POLICY "processing_jobs_tenant_isolation" ON "document_processing_jobs"
  USING ("tenant_id" = current_setting('app.current_tenant_id', true));

CREATE POLICY "audit_log_tenant_isolation" ON "document_audit_log"
  USING (EXISTS (
    SELECT 1 FROM "documents" d 
    WHERE d."id" = "document_audit_log"."document_id" 
    AND d."tenant_id" = current_setting('app.current_tenant_id', true)
  ));

CREATE POLICY "search_index_tenant_isolation" ON "document_search_index"
  USING (EXISTS (
    SELECT 1 FROM "documents" d 
    WHERE d."id" = "document_search_index"."document_id" 
    AND d."tenant_id" = current_setting('app.current_tenant_id', true)
  ));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON "documents" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at 
  BEFORE UPDATE ON "document_processing_jobs" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default document templates
INSERT INTO "document_templates" (
  "id", 
  "name", 
  "document_type", 
  "language", 
  "version",
  "template_patterns",
  "extraction_rules",
  "validation_rules",
  "confidence",
  "created_by",
  "updated_by"
) VALUES 
(
  'template_trade_confirmation_en_v1',
  'Trade Confirmation - Standard',
  'TRADE_CONFIRMATION',
  'en',
  '1.0',
  '[
    {"id": "tc_header", "patternType": "KEYWORD", "pattern": "trade confirmation", "weight": 0.9, "description": "Trade confirmation header", "isRequired": true},
    {"id": "tc_table", "patternType": "LAYOUT", "pattern": "HAS_TABLE", "weight": 0.8, "description": "Transaction details table", "isRequired": true}
  ]',
  '[
    {"id": "trade_date", "fieldName": "tradeDate", "fieldType": "DATE", "extractionMethod": "REGEX", "pattern": "Trade Date:\\s*(\\d{1,2}/\\d{1,2}/\\d{4})", "isRequired": true},
    {"id": "symbol", "fieldName": "symbol", "fieldType": "STRING", "extractionMethod": "REGEX", "pattern": "Symbol:\\s*([A-Z]{1,5})", "isRequired": true},
    {"id": "quantity", "fieldName": "quantity", "fieldType": "NUMBER", "extractionMethod": "REGEX", "pattern": "Quantity:\\s*([\\d,]+)", "isRequired": true}
  ]',
  '[
    {"id": "trade_date_required", "fieldName": "tradeDate", "ruleType": "REQUIRED", "rule": "", "errorMessage": "Trade date is required", "severity": "ERROR"},
    {"id": "quantity_positive", "fieldName": "quantity", "ruleType": "RANGE", "rule": "1,999999999", "errorMessage": "Quantity must be positive", "severity": "ERROR"}
  ]',
  0.95,
  'system',
  'system'
),
(
  'template_account_statement_en_v1',
  'Account Statement - Standard',
  'STATEMENT',
  'en',
  '1.0',
  '[
    {"id": "stmt_header", "patternType": "KEYWORD", "pattern": "account statement", "weight": 0.9, "description": "Statement header", "isRequired": true},
    {"id": "stmt_period", "patternType": "REGEX", "pattern": "\\\\d{1,2}/\\\\d{1,2}/\\\\d{4}\\\\s*-\\\\s*\\\\d{1,2}/\\\\d{1,2}/\\\\d{4}", "weight": 0.7, "description": "Statement period", "isRequired": false}
  ]',
  '[
    {"id": "account_number", "fieldName": "accountNumber", "fieldType": "STRING", "extractionMethod": "REGEX", "pattern": "Account Number:\\s*([\\d-]+)", "isRequired": true},
    {"id": "statement_period", "fieldName": "statementPeriod", "fieldType": "STRING", "extractionMethod": "REGEX", "pattern": "Period:\\s*(\\d{1,2}/\\d{1,2}/\\d{4}\\s*-\\s*\\d{1,2}/\\d{1,2}/\\d{4})", "isRequired": true},
    {"id": "ending_balance", "fieldName": "endingBalance", "fieldType": "CURRENCY", "extractionMethod": "REGEX", "pattern": "Ending Balance:\\s*\\$([\\d,]+\\.\\d{2})", "isRequired": true}
  ]',
  '[
    {"id": "account_number_required", "fieldName": "accountNumber", "ruleType": "REQUIRED", "rule": "", "errorMessage": "Account number is required", "severity": "ERROR"},
    {"id": "ending_balance_format", "fieldName": "endingBalance", "ruleType": "FORMAT", "rule": "^\\\\d+\\\\.\\\\d{2}$", "errorMessage": "Invalid balance format", "severity": "WARNING"}
  ]',
  0.92,
  'system',
  'system'
);

-- Add comments for documentation
COMMENT ON TABLE "documents" IS 'Main documents table storing document metadata and references';
COMMENT ON TABLE "document_versions" IS 'Document version history for version control';
COMMENT ON TABLE "ocr_results" IS 'OCR processing results for document text extraction';
COMMENT ON TABLE "document_templates" IS 'Document templates for classification and extraction';
COMMENT ON TABLE "extracted_data" IS 'Extracted structured data from documents';
COMMENT ON TABLE "document_processing_jobs" IS 'Asynchronous document processing job queue';
COMMENT ON TABLE "document_audit_log" IS 'Audit trail for all document operations';
COMMENT ON TABLE "document_search_index" IS 'Full-text search index for documents';

COMMENT ON COLUMN "documents"."metadata" IS 'Flexible JSON metadata storage for document-specific data';
COMMENT ON COLUMN "documents"."tags" IS 'Array of tags for document categorization and search';
COMMENT ON COLUMN "documents"."checksum" IS 'File integrity checksum (SHA-256)';
COMMENT ON COLUMN "document_versions"."is_current_version" IS 'Indicates if this is the current active version';
COMMENT ON COLUMN "ocr_results"."confidence" IS 'OCR confidence score (0.0 to 1.0)';
COMMENT ON COLUMN "extracted_data"."fields" IS 'Array of extracted field data with values and confidence scores';
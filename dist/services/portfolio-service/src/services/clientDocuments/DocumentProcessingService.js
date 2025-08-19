"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentProcessingService = void 0;
const crypto_1 = require("crypto");
const ClientDocuments_1 = require("../../models/clientDocuments/ClientDocuments");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class DocumentProcessingService {
    eventPublisher;
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    async uploadDocument(request) {
        try {
            logger_1.logger.info('Processing document upload', {
                tenantId: request.tenantId,
                clientId: request.clientId,
                fileName: request.file.name
            });
            // Generate document ID
            const documentId = (0, crypto_1.randomUUID)();
            // Extract file metadata
            const metadata = await this.extractFileMetadata(request.file);
            // Store file
            const storageLocation = await this.storeFile(documentId, request.file);
            // Initial classification
            let classification = await this.performInitialClassification(request, metadata);
            // Create document record
            const document = {
                id: documentId,
                tenantId: request.tenantId,
                clientId: request.clientId,
                portfolioId: request.portfolioId,
                accountId: request.accountId,
                title: request.title,
                description: request.description,
                documentNumber: this.generateDocumentNumber(),
                externalReference: request.externalReference,
                fileName: request.file.name,
                originalFileName: request.file.name,
                storageLocation,
                storageProvider: 'S3',
                classification,
                metadata,
                extractedData: [],
                validation: {
                    isValid: true,
                    validationDate: new Date(),
                    validationRules: [],
                    violations: [],
                    validatedBy: 'SYSTEM'
                },
                status: ClientDocuments_1.DocumentStatus.UPLOADED,
                priority: request.priority || 'MEDIUM',
                accessLevel: request.accessLevel || ClientDocuments_1.AccessLevel.CLIENT_ONLY,
                accessControls: [],
                retention: {
                    retentionPeriod: 7, // Default 7 years
                    disposalDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000),
                    legalHold: false
                },
                complianceFlags: [],
                regulatoryTags: [],
                relatedDocuments: [],
                linkedTransactions: [],
                linkedPositions: [],
                currentVersion: '1.0',
                versions: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: request.clientId, // Should be actual user ID
                updatedBy: request.clientId,
                searchableText: '',
                tags: request.tags || [],
                keywords: []
            };
            // Save to database
            await this.saveDocument(document);
            // Create processing jobs
            const processingJobs = {};
            const warnings = [];
            if (request.autoClassify !== false) {
                processingJobs.classificationJobId = await this.createClassificationJob(documentId);
            }
            if (request.autoExtract !== false) {
                processingJobs.extractionJobId = await this.createExtractionJob(documentId);
            }
            if (request.autoValidate !== false) {
                processingJobs.validationJobId = await this.createValidationJob(documentId);
            }
            // Audit log
            await this.createAuditLog({
                id: (0, crypto_1.randomUUID)(),
                documentId,
                action: ClientDocuments_1.DocumentAction.UPLOAD,
                performedBy: request.clientId,
                performedDate: new Date(),
                details: {
                    fileName: request.file.name,
                    fileSize: request.file.size,
                    documentType: request.documentType
                }
            });
            // Publish event
            await this.eventPublisher.publish('document.uploaded', {
                tenantId: request.tenantId,
                documentId,
                clientId: request.clientId,
                documentType: classification.type,
                fileName: request.file.name
            });
            logger_1.logger.info('Document upload completed', {
                documentId,
                fileName: request.file.name,
                status: document.status
            });
            return {
                document,
                processingJobs,
                warnings
            };
        }
        catch (error) {
            logger_1.logger.error('Error uploading document:', error);
            throw error;
        }
    }
    async searchDocuments(request) {
        try {
            logger_1.logger.info('Searching documents', {
                tenantId: request.tenantId,
                clientId: request.clientId,
                query: request.query
            });
            // Mock implementation - replace with actual database query
            const documents = [];
            const totalCount = 0;
            const facets = {
                types: {},
                statuses: {},
                accessLevels: {}
            };
            const suggestions = [];
            return {
                documents,
                totalCount,
                facets,
                suggestions
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching documents:', error);
            throw error;
        }
    }
    async getDocument(tenantId, documentId, userId) {
        try {
            logger_1.logger.info('Retrieving document', { tenantId, documentId, userId });
            // Check access permissions
            const hasAccess = await this.checkDocumentAccess(documentId, userId);
            if (!hasAccess) {
                throw new Error('Access denied');
            }
            // Mock implementation - replace with actual database query
            const document = null;
            if (document) {
                // Log access
                await this.createAuditLog({
                    id: (0, crypto_1.randomUUID)(),
                    documentId,
                    action: ClientDocuments_1.DocumentAction.VIEW,
                    performedBy: userId,
                    performedDate: new Date()
                });
            }
            return document;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving document:', error);
            throw error;
        }
    }
    async deleteDocument(tenantId, documentId, userId) {
        try {
            logger_1.logger.info('Deleting document', { tenantId, documentId, userId });
            // Check permissions
            const hasDeletePermission = await this.checkDocumentPermission(documentId, userId, ClientDocuments_1.DocumentPermission.DELETE);
            if (!hasDeletePermission) {
                throw new Error('Delete permission denied');
            }
            // Check if document has legal hold
            const document = await this.getDocument(tenantId, documentId, userId);
            if (document?.retention.legalHold) {
                throw new Error('Cannot delete document under legal hold');
            }
            // Soft delete - move to archived status
            await this.updateDocumentStatus(documentId, ClientDocuments_1.DocumentStatus.ARCHIVED);
            // Delete physical file (optional, based on retention policy)
            // await this.deletePhysicalFile(document.storageLocation);
            // Audit log
            await this.createAuditLog({
                id: (0, crypto_1.randomUUID)(),
                documentId,
                action: ClientDocuments_1.DocumentAction.DELETE,
                performedBy: userId,
                performedDate: new Date()
            });
            // Publish event
            await this.eventPublisher.publish('document.deleted', {
                tenantId,
                documentId,
                deletedBy: userId
            });
            logger_1.logger.info('Document deleted successfully', { documentId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting document:', error);
            throw error;
        }
    }
    async performBulkOperation(operation) {
        try {
            logger_1.logger.info('Performing bulk operation', {
                operationType: operation.operationType,
                documentCount: operation.documentIds.length
            });
            const results = {
                totalProcessed: operation.documentIds.length,
                successful: 0,
                failed: 0,
                errors: [],
                results: []
            };
            for (const documentId of operation.documentIds) {
                try {
                    switch (operation.operationType) {
                        case 'DELETE':
                            await this.deleteDocument('', documentId, operation.performedBy);
                            break;
                        case 'ARCHIVE':
                            await this.updateDocumentStatus(documentId, ClientDocuments_1.DocumentStatus.ARCHIVED);
                            break;
                        case 'APPROVE':
                            await this.updateDocumentStatus(documentId, ClientDocuments_1.DocumentStatus.APPROVED);
                            break;
                        case 'REJECT':
                            await this.updateDocumentStatus(documentId, ClientDocuments_1.DocumentStatus.REJECTED);
                            break;
                        case 'CHANGE_ACCESS':
                            await this.updateDocumentAccess(documentId, operation.parameters);
                            break;
                    }
                    results.successful++;
                    results.results.push({
                        documentId,
                        success: true
                    });
                }
                catch (error) {
                    results.failed++;
                    results.errors.push({
                        documentId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    results.results.push({
                        documentId,
                        success: false,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            logger_1.logger.info('Bulk operation completed', {
                operationType: operation.operationType,
                successful: results.successful,
                failed: results.failed
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Error performing bulk operation:', error);
            throw error;
        }
    }
    async classifyDocument(documentId) {
        try {
            logger_1.logger.info('Classifying document', { documentId });
            // Mock ML-based classification
            const classification = {
                type: ClientDocuments_1.DocumentType.OTHER,
                category: 'General',
                confidenceScore: 0.85,
                classifiedBy: 'ML_MODEL',
                classificationDate: new Date(),
                reviewRequired: false
            };
            // Save classification
            await this.updateDocumentClassification(documentId, classification);
            // Audit log
            await this.createAuditLog({
                id: (0, crypto_1.randomUUID)(),
                documentId,
                action: ClientDocuments_1.DocumentAction.CLASSIFY,
                performedBy: 'SYSTEM',
                performedDate: new Date(),
                details: { classification }
            });
            return classification;
        }
        catch (error) {
            logger_1.logger.error('Error classifying document:', error);
            throw error;
        }
    }
    async extractDocumentData(documentId) {
        try {
            logger_1.logger.info('Extracting document data', { documentId });
            // Mock OCR and field extraction
            const extractedData = [
                {
                    field: 'documentDate',
                    value: new Date(),
                    confidence: 0.95,
                    extractionMethod: 'OCR',
                    pageNumber: 1
                },
                {
                    field: 'accountNumber',
                    value: '123456789',
                    confidence: 0.90,
                    extractionMethod: 'PATTERN_MATCH',
                    pageNumber: 1
                }
            ];
            // Save extracted data
            await this.updateDocumentExtractedData(documentId, extractedData);
            // Audit log
            await this.createAuditLog({
                id: (0, crypto_1.randomUUID)(),
                documentId,
                action: ClientDocuments_1.DocumentAction.EXTRACT,
                performedBy: 'SYSTEM',
                performedDate: new Date(),
                details: { extractedFieldCount: extractedData.length }
            });
            return extractedData;
        }
        catch (error) {
            logger_1.logger.error('Error extracting document data:', error);
            throw error;
        }
    }
    async validateDocument(documentId) {
        try {
            logger_1.logger.info('Validating document', { documentId });
            // Mock validation
            const validation = {
                isValid: true,
                validationDate: new Date(),
                validationRules: ['REQUIRED_FIELDS', 'FORMAT_CHECK', 'DATA_INTEGRITY'],
                violations: [],
                validatedBy: 'SYSTEM'
            };
            // Save validation results
            await this.updateDocumentValidation(documentId, validation);
            // Audit log
            await this.createAuditLog({
                id: (0, crypto_1.randomUUID)(),
                documentId,
                action: ClientDocuments_1.DocumentAction.VALIDATE,
                performedBy: 'SYSTEM',
                performedDate: new Date(),
                details: { validation }
            });
            return validation;
        }
        catch (error) {
            logger_1.logger.error('Error validating document:', error);
            throw error;
        }
    }
    // Private helper methods
    async extractFileMetadata(file) {
        return {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.mimeType,
            format: this.getDocumentFormat(file.mimeType),
            checksum: this.calculateChecksum(file.content),
            uploadDate: new Date(),
            lastModified: new Date()
        };
    }
    getDocumentFormat(mimeType) {
        if (mimeType.includes('pdf'))
            return ClientDocuments_1.DocumentFormat.PDF;
        if (mimeType.includes('word'))
            return ClientDocuments_1.DocumentFormat.WORD;
        if (mimeType.includes('excel'))
            return ClientDocuments_1.DocumentFormat.EXCEL;
        if (mimeType.includes('image'))
            return ClientDocuments_1.DocumentFormat.IMAGE;
        if (mimeType.includes('text'))
            return ClientDocuments_1.DocumentFormat.TEXT;
        return ClientDocuments_1.DocumentFormat.OTHER;
    }
    calculateChecksum(content) {
        // Mock checksum calculation
        return 'sha256-' + (0, crypto_1.randomUUID)();
    }
    async performInitialClassification(request, metadata) {
        return {
            type: request.documentType || ClientDocuments_1.DocumentType.OTHER,
            category: 'General',
            confidenceScore: request.documentType ? 1.0 : 0.5,
            classifiedBy: request.documentType ? 'MANUAL' : 'AUTO',
            classificationDate: new Date(),
            reviewRequired: !request.documentType
        };
    }
    generateDocumentNumber() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `DOC-${timestamp}-${random}`.toUpperCase();
    }
    async storeFile(documentId, file) {
        // Mock file storage
        return `s3://documents/${documentId}/${file.name}`;
    }
    async saveDocument(document) {
        // Mock database save
        logger_1.logger.info('Document saved to database', { documentId: document.id });
    }
    async createClassificationJob(documentId) {
        const jobId = (0, crypto_1.randomUUID)();
        // Mock job creation
        logger_1.logger.info('Classification job created', { jobId, documentId });
        return jobId;
    }
    async createExtractionJob(documentId) {
        const jobId = (0, crypto_1.randomUUID)();
        // Mock job creation
        logger_1.logger.info('Extraction job created', { jobId, documentId });
        return jobId;
    }
    async createValidationJob(documentId) {
        const jobId = (0, crypto_1.randomUUID)();
        // Mock job creation
        logger_1.logger.info('Validation job created', { jobId, documentId });
        return jobId;
    }
    async createAuditLog(auditLog) {
        // Mock audit log creation
        logger_1.logger.info('Audit log created', {
            documentId: auditLog.documentId,
            action: auditLog.action,
            performedBy: auditLog.performedBy
        });
    }
    async checkDocumentAccess(documentId, userId) {
        // Mock access check
        return true;
    }
    async checkDocumentPermission(documentId, userId, permission) {
        // Mock permission check
        return true;
    }
    async updateDocumentStatus(documentId, status) {
        // Mock status update
        logger_1.logger.info('Document status updated', { documentId, status });
    }
    async updateDocumentAccess(documentId, accessParams) {
        // Mock access update
        logger_1.logger.info('Document access updated', { documentId, accessParams });
    }
    async updateDocumentClassification(documentId, classification) {
        // Mock classification update
        logger_1.logger.info('Document classification updated', { documentId });
    }
    async updateDocumentExtractedData(documentId, extractedData) {
        // Mock extracted data update
        logger_1.logger.info('Document extracted data updated', { documentId, fieldCount: extractedData.length });
    }
    async updateDocumentValidation(documentId, validation) {
        // Mock validation update
        logger_1.logger.info('Document validation updated', { documentId, isValid: validation.isValid });
    }
}
exports.DocumentProcessingService = DocumentProcessingService;

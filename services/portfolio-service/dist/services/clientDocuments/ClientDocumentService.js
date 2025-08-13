"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientDocumentService = void 0;
const crypto_1 = require("crypto");
const ClientDocuments_1 = require("../../models/clientDocuments/ClientDocuments");
const DocumentProcessingService_1 = require("./DocumentProcessingService");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class ClientDocumentService {
    documentProcessingService;
    eventPublisher;
    constructor() {
        this.documentProcessingService = new DocumentProcessingService_1.DocumentProcessingService();
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    async uploadClientDocument(request) {
        try {
            logger_1.logger.info('Uploading client document', {
                tenantId: request.tenantId,
                clientId: request.clientId,
                fileName: request.file.name
            });
            // Validate client exists and user has access
            await this.validateClientAccess(request.tenantId, request.clientId);
            // Check storage quota
            await this.checkStorageQuota(request.tenantId, request.clientId, request.file.size);
            // Process document upload
            const uploadResponse = await this.documentProcessingService.uploadDocument(request);
            // Link document to client relationship
            await this.linkDocumentToClient(uploadResponse.document.id, request.clientId);
            // Apply client-specific document rules
            await this.applyClientDocumentRules(uploadResponse.document);
            // Send notifications if required
            await this.sendDocumentNotifications(uploadResponse.document);
            logger_1.logger.info('Client document uploaded successfully', {
                documentId: uploadResponse.document.id,
                clientId: request.clientId
            });
            return uploadResponse;
        }
        catch (error) {
            logger_1.logger.error('Error uploading client document:', error);
            throw error;
        }
    }
    async getClientDocuments(tenantId, clientId, userId, options = {}) {
        try {
            logger_1.logger.info('Retrieving client documents', { tenantId, clientId, userId });
            // Validate access
            await this.validateClientAccess(tenantId, clientId, userId);
            // Build search request
            const searchRequest = {
                tenantId,
                clientId,
                documentType: options.documentType,
                status: options.status,
                dateFrom: options.dateFrom,
                dateTo: options.dateTo,
                offset: options.offset || 0,
                limit: options.limit || 50,
                sortBy: 'UPDATED_DATE',
                sortOrder: 'DESC'
            };
            // Search documents
            const searchResponse = await this.documentProcessingService.searchDocuments(searchRequest);
            // Filter based on user permissions
            const filteredDocuments = await this.filterDocumentsByPermissions(searchResponse.documents, userId);
            return {
                ...searchResponse,
                documents: filteredDocuments
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving client documents:', error);
            throw error;
        }
    }
    async getClientDocumentById(tenantId, documentId, userId) {
        try {
            logger_1.logger.info('Retrieving client document by ID', { tenantId, documentId, userId });
            const document = await this.documentProcessingService.getDocument(tenantId, documentId, userId);
            if (document) {
                // Check client-specific access
                await this.validateClientAccess(tenantId, document.clientId, userId);
            }
            return document;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving client document:', error);
            throw error;
        }
    }
    async updateClientDocument(tenantId, documentId, updates, userId) {
        try {
            logger_1.logger.info('Updating client document', { tenantId, documentId, userId });
            // Get existing document
            const existingDocument = await this.getClientDocumentById(tenantId, documentId, userId);
            if (!existingDocument) {
                throw new Error('Document not found');
            }
            // Check edit permissions
            const hasEditPermission = await this.checkDocumentPermission(documentId, userId, ClientDocuments_1.DocumentPermission.EDIT);
            if (!hasEditPermission) {
                throw new Error('Edit permission denied');
            }
            // Validate updates
            await this.validateDocumentUpdates(existingDocument, updates);
            // Apply updates
            const updatedDocument = {
                ...existingDocument,
                ...updates,
                updatedAt: new Date(),
                updatedBy: userId
            };
            // Save updates
            await this.saveDocumentUpdates(updatedDocument);
            // Create audit log
            await this.createAuditLog({
                id: (0, crypto_1.randomUUID)(),
                documentId,
                action: ClientDocuments_1.DocumentAction.EDIT,
                performedBy: userId,
                performedDate: new Date(),
                oldValues: existingDocument,
                newValues: updates
            });
            // Publish event
            await this.eventPublisher.publish('client.document.updated', {
                tenantId,
                clientId: existingDocument.clientId,
                documentId,
                updatedBy: userId,
                changes: updates
            });
            logger_1.logger.info('Client document updated successfully', { documentId });
            return updatedDocument;
        }
        catch (error) {
            logger_1.logger.error('Error updating client document:', error);
            throw error;
        }
    }
    async deleteClientDocument(tenantId, documentId, userId, reason) {
        try {
            logger_1.logger.info('Deleting client document', { tenantId, documentId, userId });
            const document = await this.getClientDocumentById(tenantId, documentId, userId);
            if (!document) {
                throw new Error('Document not found');
            }
            // Check compliance restrictions
            await this.checkDeletionCompliance(document);
            // Perform deletion
            await this.documentProcessingService.deleteDocument(tenantId, documentId, userId);
            // Update client document index
            await this.updateClientDocumentIndex(document.clientId, documentId, 'REMOVED');
            // Publish event
            await this.eventPublisher.publish('client.document.deleted', {
                tenantId,
                clientId: document.clientId,
                documentId,
                deletedBy: userId,
                reason
            });
            logger_1.logger.info('Client document deleted successfully', { documentId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting client document:', error);
            throw error;
        }
    }
    async shareDocumentWithClient(tenantId, documentId, recipientClientId, permissions, userId, expirationDate) {
        try {
            logger_1.logger.info('Sharing document with client', {
                tenantId,
                documentId,
                recipientClientId,
                userId
            });
            const document = await this.getClientDocumentById(tenantId, documentId, userId);
            if (!document) {
                throw new Error('Document not found');
            }
            // Check sharing permissions
            const canShare = await this.checkDocumentPermission(documentId, userId, ClientDocuments_1.DocumentPermission.SHARE);
            if (!canShare) {
                throw new Error('Share permission denied');
            }
            // Validate recipient client
            await this.validateClientAccess(tenantId, recipientClientId);
            // Create access record
            await this.createDocumentAccess({
                documentId,
                clientId: recipientClientId,
                permissions,
                grantedBy: userId,
                expirationDate
            });
            // Create audit log
            await this.createAuditLog({
                id: (0, crypto_1.randomUUID)(),
                documentId,
                action: ClientDocuments_1.DocumentAction.SHARE,
                performedBy: userId,
                performedDate: new Date(),
                details: {
                    recipientClientId,
                    permissions,
                    expirationDate
                }
            });
            // Send notification
            await this.sendShareNotification(document, recipientClientId, userId);
            logger_1.logger.info('Document shared successfully', { documentId, recipientClientId });
        }
        catch (error) {
            logger_1.logger.error('Error sharing document:', error);
            throw error;
        }
    }
    async getClientDocumentTemplates(tenantId, documentType) {
        try {
            logger_1.logger.info('Retrieving document templates', { tenantId, documentType });
            // Mock implementation - replace with actual database query
            const templates = [
                {
                    id: (0, crypto_1.randomUUID)(),
                    tenantId,
                    name: 'Client Onboarding Package',
                    description: 'Standard documents required for client onboarding',
                    documentType: ClientDocuments_1.DocumentType.IDENTIFICATION,
                    fields: [
                        {
                            name: 'clientName',
                            type: 'TEXT',
                            required: true
                        },
                        {
                            name: 'dateOfBirth',
                            type: 'DATE',
                            required: true
                        },
                        {
                            name: 'ssn',
                            type: 'TEXT',
                            required: true,
                            validation: '^\\d{3}-\\d{2}-\\d{4}$'
                        }
                    ],
                    usageCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: 'SYSTEM',
                    isActive: true
                }
            ];
            return documentType
                ? templates.filter(t => t.documentType === documentType)
                : templates;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving document templates:', error);
            throw error;
        }
    }
    async performBulkDocumentOperation(tenantId, operation, userId) {
        try {
            logger_1.logger.info('Performing bulk document operation', {
                tenantId,
                operationType: operation.operationType,
                documentCount: operation.documentIds.length,
                userId
            });
            // Validate permissions for each document
            await this.validateBulkOperationPermissions(operation, userId);
            // Perform operation
            const result = await this.documentProcessingService.performBulkOperation({
                ...operation,
                performedBy: userId
            });
            // Create audit logs for successful operations
            for (const docResult of result.results.filter(r => r.success)) {
                await this.createAuditLog({
                    id: (0, crypto_1.randomUUID)(),
                    documentId: docResult.documentId,
                    action: this.mapOperationToAction(operation.operationType),
                    performedBy: userId,
                    performedDate: new Date(),
                    details: {
                        bulkOperation: true,
                        operationType: operation.operationType,
                        parameters: operation.parameters
                    }
                });
            }
            // Publish event
            await this.eventPublisher.publish('client.documents.bulk_operation', {
                tenantId,
                operationType: operation.operationType,
                documentIds: operation.documentIds,
                performedBy: userId,
                result
            });
            logger_1.logger.info('Bulk document operation completed', {
                operationType: operation.operationType,
                successful: result.successful,
                failed: result.failed
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error performing bulk document operation:', error);
            throw error;
        }
    }
    async getClientDocumentStats(tenantId, clientId) {
        try {
            logger_1.logger.info('Retrieving client document statistics', { tenantId, clientId });
            // Mock implementation - replace with actual database queries
            const stats = {
                totalDocuments: 0,
                documentsByType: {},
                documentsByStatus: {},
                storageUsed: 0, // in bytes
                recentActivity: [],
                complianceStatus: {
                    requiredDocuments: [],
                    missingDocuments: [],
                    expiredDocuments: []
                }
            };
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving client document statistics:', error);
            throw error;
        }
    }
    // Private helper methods
    async validateClientAccess(tenantId, clientId, userId) {
        // Mock validation - replace with actual client access check
        logger_1.logger.debug('Validating client access', { tenantId, clientId, userId });
    }
    async checkStorageQuota(tenantId, clientId, fileSize) {
        // Mock quota check - replace with actual quota validation
        logger_1.logger.debug('Checking storage quota', { tenantId, clientId, fileSize });
    }
    async linkDocumentToClient(documentId, clientId) {
        // Mock implementation - replace with actual database operation
        logger_1.logger.debug('Linking document to client', { documentId, clientId });
    }
    async applyClientDocumentRules(document) {
        // Apply tenant and client-specific rules
        logger_1.logger.debug('Applying client document rules', { documentId: document.id });
    }
    async sendDocumentNotifications(document) {
        // Send notifications based on document type and client preferences
        logger_1.logger.debug('Sending document notifications', { documentId: document.id });
    }
    async filterDocumentsByPermissions(documents, userId) {
        // Filter documents based on user permissions
        return documents; // Mock implementation
    }
    async checkDocumentPermission(documentId, userId, permission) {
        // Mock permission check
        return true;
    }
    async validateDocumentUpdates(document, updates) {
        // Validate that updates are allowed
        logger_1.logger.debug('Validating document updates', { documentId: document.id });
    }
    async saveDocumentUpdates(document) {
        // Mock save operation
        logger_1.logger.debug('Saving document updates', { documentId: document.id });
    }
    async checkDeletionCompliance(document) {
        if (document.retention.legalHold) {
            throw new Error('Cannot delete document under legal hold');
        }
        // Check other compliance restrictions
    }
    async updateClientDocumentIndex(clientId, documentId, action) {
        // Update search index
        logger_1.logger.debug('Updating client document index', { clientId, documentId, action });
    }
    async createDocumentAccess(accessData) {
        // Create document access record
        logger_1.logger.debug('Creating document access', accessData);
    }
    async sendShareNotification(document, recipientId, sharedBy) {
        // Send notification about shared document
        logger_1.logger.debug('Sending share notification', {
            documentId: document.id,
            recipientId,
            sharedBy
        });
    }
    async validateBulkOperationPermissions(operation, userId) {
        // Validate permissions for bulk operation
        logger_1.logger.debug('Validating bulk operation permissions', {
            operationType: operation.operationType,
            userId
        });
    }
    mapOperationToAction(operationType) {
        switch (operationType) {
            case 'DELETE': return ClientDocuments_1.DocumentAction.DELETE;
            case 'ARCHIVE': return ClientDocuments_1.DocumentAction.ARCHIVE;
            case 'APPROVE': return ClientDocuments_1.DocumentAction.APPROVE;
            case 'REJECT': return ClientDocuments_1.DocumentAction.REJECT;
            default: return ClientDocuments_1.DocumentAction.EDIT;
        }
    }
    async createAuditLog(auditLog) {
        // Mock audit log creation
        logger_1.logger.info('Document audit log created', {
            documentId: auditLog.documentId,
            action: auditLog.action,
            performedBy: auditLog.performedBy
        });
    }
}
exports.ClientDocumentService = ClientDocumentService;

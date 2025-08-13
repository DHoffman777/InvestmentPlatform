import { randomUUID } from 'crypto';
import { 
  ClientDocument, 
  DocumentUploadRequest, 
  DocumentUploadResponse,
  DocumentSearchRequest,
  DocumentSearchResponse,
  DocumentTemplate,
  DocumentType,
  DocumentStatus,
  AccessLevel,
  DocumentPermission,
  DocumentAction,
  DocumentAuditLog,
  BulkDocumentOperation,
  BulkOperationResult
} from '../../models/clientDocuments/ClientDocuments';
import { DocumentProcessingService } from './DocumentProcessingService';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';
import { prisma } from '../../utils/database';

export class ClientDocumentService {
  private documentProcessingService: DocumentProcessingService;
  private eventPublisher: EventPublisher;

  constructor() {
    this.documentProcessingService = new DocumentProcessingService();
    this.eventPublisher = new EventPublisher();
  }

  async uploadClientDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    try {
      logger.info('Uploading client document', {
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

      logger.info('Client document uploaded successfully', {
        documentId: uploadResponse.document.id,
        clientId: request.clientId
      });

      return uploadResponse;

    } catch (error) {
      logger.error('Error uploading client document:', error);
      throw error;
    }
  }

  async getClientDocuments(
    tenantId: string, 
    clientId: string, 
    userId: string,
    options: {
      documentType?: DocumentType;
      status?: DocumentStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DocumentSearchResponse> {
    try {
      logger.info('Retrieving client documents', { tenantId, clientId, userId });

      // Validate access
      await this.validateClientAccess(tenantId, clientId, userId);

      // Build search request
      const searchRequest: DocumentSearchRequest = {
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
      const filteredDocuments = await this.filterDocumentsByPermissions(
        searchResponse.documents, 
        userId
      );

      return {
        ...searchResponse,
        documents: filteredDocuments
      };

    } catch (error) {
      logger.error('Error retrieving client documents:', error);
      throw error;
    }
  }

  async getClientDocumentById(
    tenantId: string, 
    documentId: string, 
    userId: string
  ): Promise<ClientDocument | null> {
    try {
      logger.info('Retrieving client document by ID', { tenantId, documentId, userId });

      const document = await this.documentProcessingService.getDocument(tenantId, documentId, userId);
      
      if (document) {
        // Check client-specific access
        await this.validateClientAccess(tenantId, document.clientId, userId);
      }

      return document;

    } catch (error) {
      logger.error('Error retrieving client document:', error);
      throw error;
    }
  }

  async updateClientDocument(
    tenantId: string,
    documentId: string,
    updates: Partial<ClientDocument>,
    userId: string
  ): Promise<ClientDocument> {
    try {
      logger.info('Updating client document', { tenantId, documentId, userId });

      // Get existing document
      const existingDocument = await this.getClientDocumentById(tenantId, documentId, userId);
      if (!existingDocument) {
        throw new Error('Document not found');
      }

      // Check edit permissions
      const hasEditPermission = await this.checkDocumentPermission(
        documentId, 
        userId, 
        DocumentPermission.EDIT
      );
      if (!hasEditPermission) {
        throw new Error('Edit permission denied');
      }

      // Validate updates
      await this.validateDocumentUpdates(existingDocument, updates);

      // Apply updates
      const updatedDocument: ClientDocument = {
        ...existingDocument,
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      };

      // Save updates
      await this.saveDocumentUpdates(updatedDocument);

      // Create audit log
      await this.createAuditLog({
        id: randomUUID(),
        documentId,
        action: DocumentAction.EDIT,
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

      logger.info('Client document updated successfully', { documentId });

      return updatedDocument;

    } catch (error) {
      logger.error('Error updating client document:', error);
      throw error;
    }
  }

  async deleteClientDocument(
    tenantId: string,
    documentId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      logger.info('Deleting client document', { tenantId, documentId, userId });

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

      logger.info('Client document deleted successfully', { documentId });

    } catch (error) {
      logger.error('Error deleting client document:', error);
      throw error;
    }
  }

  async shareDocumentWithClient(
    tenantId: string,
    documentId: string,
    recipientClientId: string,
    permissions: DocumentPermission[],
    userId: string,
    expirationDate?: Date
  ): Promise<void> {
    try {
      logger.info('Sharing document with client', {
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
      const canShare = await this.checkDocumentPermission(documentId, userId, DocumentPermission.SHARE);
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
        id: randomUUID(),
        documentId,
        action: DocumentAction.SHARE,
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

      logger.info('Document shared successfully', { documentId, recipientClientId });

    } catch (error) {
      logger.error('Error sharing document:', error);
      throw error;
    }
  }

  async getClientDocumentTemplates(tenantId: string, documentType?: DocumentType): Promise<DocumentTemplate[]> {
    try {
      logger.info('Retrieving document templates', { tenantId, documentType });

      // Mock implementation - replace with actual database query
      const templates: DocumentTemplate[] = [
        {
          id: randomUUID(),
          tenantId,
          name: 'Client Onboarding Package',
          description: 'Standard documents required for client onboarding',
          documentType: DocumentType.IDENTIFICATION,
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

    } catch (error) {
      logger.error('Error retrieving document templates:', error);
      throw error;
    }
  }

  async performBulkDocumentOperation(
    tenantId: string,
    operation: BulkDocumentOperation,
    userId: string
  ): Promise<BulkOperationResult> {
    try {
      logger.info('Performing bulk document operation', {
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
          id: randomUUID(),
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

      logger.info('Bulk document operation completed', {
        operationType: operation.operationType,
        successful: result.successful,
        failed: result.failed
      });

      return result;

    } catch (error) {
      logger.error('Error performing bulk document operation:', error);
      throw error;
    }
  }

  async getClientDocumentStats(tenantId: string, clientId: string): Promise<any> {
    try {
      logger.info('Retrieving client document statistics', { tenantId, clientId });

      // Mock implementation - replace with actual database queries
      const stats = {
        totalDocuments: 0,
        documentsByType: {} as { [key in DocumentType]?: number },
        documentsByStatus: {} as { [key in DocumentStatus]?: number },
        storageUsed: 0, // in bytes
        recentActivity: [],
        complianceStatus: {
          requiredDocuments: [],
          missingDocuments: [],
          expiredDocuments: []
        }
      };

      return stats;

    } catch (error) {
      logger.error('Error retrieving client document statistics:', error);
      throw error;
    }
  }

  // Private helper methods
  private async validateClientAccess(tenantId: string, clientId: string, userId?: string): Promise<void> {
    // Mock validation - replace with actual client access check
    logger.debug('Validating client access', { tenantId, clientId, userId });
  }

  private async checkStorageQuota(tenantId: string, clientId: string, fileSize: number): Promise<void> {
    // Mock quota check - replace with actual quota validation
    logger.debug('Checking storage quota', { tenantId, clientId, fileSize });
  }

  private async linkDocumentToClient(documentId: string, clientId: string): Promise<void> {
    // Mock implementation - replace with actual database operation
    logger.debug('Linking document to client', { documentId, clientId });
  }

  private async applyClientDocumentRules(document: ClientDocument): Promise<void> {
    // Apply tenant and client-specific rules
    logger.debug('Applying client document rules', { documentId: document.id });
  }

  private async sendDocumentNotifications(document: ClientDocument): Promise<void> {
    // Send notifications based on document type and client preferences
    logger.debug('Sending document notifications', { documentId: document.id });
  }

  private async filterDocumentsByPermissions(documents: ClientDocument[], userId: string): Promise<ClientDocument[]> {
    // Filter documents based on user permissions
    return documents; // Mock implementation
  }

  private async checkDocumentPermission(documentId: string, userId: string, permission: DocumentPermission): Promise<boolean> {
    // Mock permission check
    return true;
  }

  private async validateDocumentUpdates(document: ClientDocument, updates: Partial<ClientDocument>): Promise<void> {
    // Validate that updates are allowed
    logger.debug('Validating document updates', { documentId: document.id });
  }

  private async saveDocumentUpdates(document: ClientDocument): Promise<void> {
    // Mock save operation
    logger.debug('Saving document updates', { documentId: document.id });
  }

  private async checkDeletionCompliance(document: ClientDocument): Promise<void> {
    if (document.retention.legalHold) {
      throw new Error('Cannot delete document under legal hold');
    }
    // Check other compliance restrictions
  }

  private async updateClientDocumentIndex(clientId: string, documentId: string, action: string): Promise<void> {
    // Update search index
    logger.debug('Updating client document index', { clientId, documentId, action });
  }

  private async createDocumentAccess(accessData: any): Promise<void> {
    // Create document access record
    logger.debug('Creating document access', accessData);
  }

  private async sendShareNotification(document: ClientDocument, recipientId: string, sharedBy: string): Promise<void> {
    // Send notification about shared document
    logger.debug('Sending share notification', { 
      documentId: document.id, 
      recipientId, 
      sharedBy 
    });
  }

  private async validateBulkOperationPermissions(operation: BulkDocumentOperation, userId: string): Promise<void> {
    // Validate permissions for bulk operation
    logger.debug('Validating bulk operation permissions', { 
      operationType: operation.operationType,
      userId 
    });
  }

  private mapOperationToAction(operationType: string): DocumentAction {
    switch (operationType) {
      case 'DELETE': return DocumentAction.DELETE;
      case 'ARCHIVE': return DocumentAction.ARCHIVE;
      case 'APPROVE': return DocumentAction.APPROVE;
      case 'REJECT': return DocumentAction.REJECT;
      default: return DocumentAction.EDIT;
    }
  }

  private async createAuditLog(auditLog: DocumentAuditLog): Promise<void> {
    // Mock audit log creation
    logger.info('Document audit log created', { 
      documentId: auditLog.documentId,
      action: auditLog.action,
      performedBy: auditLog.performedBy
    });
  }
}
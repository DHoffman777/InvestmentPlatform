import { PrismaClient } from '@prisma/client';
import { ClientDocument, DocumentUploadRequest, DocumentUploadResponse, DocumentSearchResponse, DocumentTemplate, DocumentType, DocumentStatus, DocumentPermission, BulkDocumentOperation, BulkOperationResult } from '../../models/clientDocuments/ClientDocuments';
export declare class ClientDocumentService {
    private prisma;
    private documentProcessingService;
    constructor(prisma: PrismaClient);
    uploadClientDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse>;
    getClientDocuments(tenantId: string, clientId: string, userId: string, options?: {
        documentType?: DocumentType;
        status?: DocumentStatus;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<DocumentSearchResponse>;
    getClientDocumentById(tenantId: string, documentId: string, userId: string): Promise<ClientDocument | null>;
    updateClientDocument(tenantId: string, documentId: string, updates: Partial<ClientDocument>, userId: string): Promise<ClientDocument>;
    deleteClientDocument(tenantId: string, documentId: string, userId: string, reason?: string): Promise<any>;
    shareDocumentWithClient(tenantId: string, documentId: string, recipientClientId: string, permissions: DocumentPermission[], userId: string, expirationDate?: Date): Promise<any>;
    getClientDocumentTemplates(tenantId: string, documentType?: DocumentType): Promise<DocumentTemplate[]>;
    performBulkDocumentOperation(tenantId: string, operation: BulkDocumentOperation, userId: string): Promise<BulkOperationResult>;
    getClientDocumentStats(tenantId: string, clientId: string): Promise<any>;
    private validateClientAccess;
    private checkStorageQuota;
    private linkDocumentToClient;
    private applyClientDocumentRules;
    private sendDocumentNotifications;
    private filterDocumentsByPermissions;
    private checkDocumentPermission;
    private validateDocumentUpdates;
    private saveDocumentUpdates;
    private checkDeletionCompliance;
    private updateClientDocumentIndex;
    private createDocumentAccess;
    private sendShareNotification;
    private validateBulkOperationPermissions;
    private mapOperationToAction;
    private createAuditLog;
}

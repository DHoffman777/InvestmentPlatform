export const __esModule: boolean;
export class ClientDocumentService {
    documentProcessingService: DocumentProcessingService_1.DocumentProcessingService;
    eventPublisher: eventPublisher_1.EventPublisher;
    uploadClientDocument(request: any): Promise<ClientDocuments_1.DocumentUploadResponse>;
    getClientDocuments(tenantId: any, clientId: any, userId: any, options?: {}): Promise<{
        documents: any;
        totalCount: number;
        facets: {
            types: { [key in ClientDocuments_1.DocumentType]?: number; };
            statuses: { [key in ClientDocuments_1.DocumentStatus]?: number; };
            accessLevels: { [key in ClientDocuments_1.AccessLevel]?: number; };
        };
        suggestions: string[];
    }>;
    getClientDocumentById(tenantId: any, documentId: any, userId: any): Promise<ClientDocuments_1.ClientDocument>;
    updateClientDocument(tenantId: any, documentId: any, updates: any, userId: any): Promise<any>;
    deleteClientDocument(tenantId: any, documentId: any, userId: any, reason: any): Promise<void>;
    shareDocumentWithClient(tenantId: any, documentId: any, recipientClientId: any, permissions: any, userId: any, expirationDate: any): Promise<void>;
    getClientDocumentTemplates(tenantId: any, documentType: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        name: string;
        description: string;
        documentType: ClientDocuments_1.DocumentType;
        fields: ({
            name: string;
            type: string;
            required: boolean;
            validation?: undefined;
        } | {
            name: string;
            type: string;
            required: boolean;
            validation: string;
        })[];
        usageCount: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        isActive: boolean;
    }[]>;
    performBulkDocumentOperation(tenantId: any, operation: any, userId: any): Promise<ClientDocuments_1.BulkOperationResult>;
    getClientDocumentStats(tenantId: any, clientId: any): Promise<{
        totalDocuments: number;
        documentsByType: {};
        documentsByStatus: {};
        storageUsed: number;
        recentActivity: any[];
        complianceStatus: {
            requiredDocuments: any[];
            missingDocuments: any[];
            expiredDocuments: any[];
        };
    }>;
    validateClientAccess(tenantId: any, clientId: any, userId: any): Promise<void>;
    checkStorageQuota(tenantId: any, clientId: any, fileSize: any): Promise<void>;
    linkDocumentToClient(documentId: any, clientId: any): Promise<void>;
    applyClientDocumentRules(document: any): Promise<void>;
    sendDocumentNotifications(document: any): Promise<void>;
    filterDocumentsByPermissions(documents: any, userId: any): Promise<any>;
    checkDocumentPermission(documentId: any, userId: any, permission: any): Promise<boolean>;
    validateDocumentUpdates(document: any, updates: any): Promise<void>;
    saveDocumentUpdates(document: any): Promise<void>;
    checkDeletionCompliance(document: any): Promise<void>;
    updateClientDocumentIndex(clientId: any, documentId: any, action: any): Promise<void>;
    createDocumentAccess(accessData: any): Promise<void>;
    sendShareNotification(document: any, recipientId: any, sharedBy: any): Promise<void>;
    validateBulkOperationPermissions(operation: any, userId: any): Promise<void>;
    mapOperationToAction(operationType: any): ClientDocuments_1.DocumentAction.EDIT | ClientDocuments_1.DocumentAction.DELETE | ClientDocuments_1.DocumentAction.APPROVE | ClientDocuments_1.DocumentAction.REJECT | ClientDocuments_1.DocumentAction.ARCHIVE;
    createAuditLog(auditLog: any): Promise<void>;
}
import DocumentProcessingService_1 = require("./DocumentProcessingService");
import eventPublisher_1 = require("../../utils/eventPublisher");
import ClientDocuments_1 = require("../../models/clientDocuments/ClientDocuments");

export const __esModule: boolean;
export class DocumentProcessingService {
    eventPublisher: eventPublisher_1.EventPublisher;
    uploadDocument(request: any): Promise<{
        document: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: any;
            clientId: any;
            portfolioId: any;
            accountId: any;
            title: any;
            description: any;
            documentNumber: string;
            externalReference: any;
            fileName: any;
            originalFileName: any;
            storageLocation: string;
            storageProvider: string;
            classification: {
                type: any;
                category: string;
                confidenceScore: number;
                classifiedBy: string;
                classificationDate: Date;
                reviewRequired: boolean;
            };
            metadata: {
                fileName: any;
                fileSize: any;
                mimeType: any;
                format: ClientDocuments_1.DocumentFormat;
                checksum: string;
                uploadDate: Date;
                lastModified: Date;
            };
            extractedData: any[];
            validation: {
                isValid: boolean;
                validationDate: Date;
                validationRules: any[];
                violations: any[];
                validatedBy: string;
            };
            status: ClientDocuments_1.DocumentStatus;
            priority: any;
            accessLevel: any;
            accessControls: any[];
            retention: {
                retentionPeriod: number;
                disposalDate: Date;
                legalHold: boolean;
            };
            complianceFlags: any[];
            regulatoryTags: any[];
            relatedDocuments: any[];
            linkedTransactions: any[];
            linkedPositions: any[];
            currentVersion: string;
            versions: any[];
            createdAt: Date;
            updatedAt: Date;
            createdBy: any;
            updatedBy: any;
            searchableText: string;
            tags: any;
            keywords: any[];
        };
        processingJobs: {};
        warnings: any[];
    }>;
    searchDocuments(request: any): Promise<{
        documents: any[];
        totalCount: number;
        facets: {
            types: {};
            statuses: {};
            accessLevels: {};
        };
        suggestions: any[];
    }>;
    getDocument(tenantId: any, documentId: any, userId: any): Promise<any>;
    deleteDocument(tenantId: any, documentId: any, userId: any): Promise<void>;
    performBulkOperation(operation: any): Promise<{
        totalProcessed: any;
        successful: number;
        failed: number;
        errors: any[];
        results: any[];
    }>;
    classifyDocument(documentId: any): Promise<{
        type: ClientDocuments_1.DocumentType;
        category: string;
        confidenceScore: number;
        classifiedBy: string;
        classificationDate: Date;
        reviewRequired: boolean;
    }>;
    extractDocumentData(documentId: any): Promise<({
        field: string;
        value: Date;
        confidence: number;
        extractionMethod: string;
        pageNumber: number;
    } | {
        field: string;
        value: string;
        confidence: number;
        extractionMethod: string;
        pageNumber: number;
    })[]>;
    validateDocument(documentId: any): Promise<{
        isValid: boolean;
        validationDate: Date;
        validationRules: string[];
        violations: any[];
        validatedBy: string;
    }>;
    extractFileMetadata(file: any): Promise<{
        fileName: any;
        fileSize: any;
        mimeType: any;
        format: ClientDocuments_1.DocumentFormat;
        checksum: string;
        uploadDate: Date;
        lastModified: Date;
    }>;
    getDocumentFormat(mimeType: any): ClientDocuments_1.DocumentFormat.PDF | ClientDocuments_1.DocumentFormat.WORD | ClientDocuments_1.DocumentFormat.EXCEL | ClientDocuments_1.DocumentFormat.IMAGE | ClientDocuments_1.DocumentFormat.TEXT | ClientDocuments_1.DocumentFormat.OTHER;
    calculateChecksum(content: any): string;
    performInitialClassification(request: any, metadata: any): Promise<{
        type: any;
        category: string;
        confidenceScore: number;
        classifiedBy: string;
        classificationDate: Date;
        reviewRequired: boolean;
    }>;
    generateDocumentNumber(): string;
    storeFile(documentId: any, file: any): Promise<string>;
    saveDocument(document: any): Promise<void>;
    createClassificationJob(documentId: any): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    createExtractionJob(documentId: any): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    createValidationJob(documentId: any): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    createAuditLog(auditLog: any): Promise<void>;
    checkDocumentAccess(documentId: any, userId: any): Promise<boolean>;
    checkDocumentPermission(documentId: any, userId: any, permission: any): Promise<boolean>;
    updateDocumentStatus(documentId: any, status: any): Promise<void>;
    updateDocumentAccess(documentId: any, accessParams: any): Promise<void>;
    updateDocumentClassification(documentId: any, classification: any): Promise<void>;
    updateDocumentExtractedData(documentId: any, extractedData: any): Promise<void>;
    updateDocumentValidation(documentId: any, validation: any): Promise<void>;
}
import eventPublisher_1 = require("../../utils/eventPublisher");
import ClientDocuments_1 = require("../../models/clientDocuments/ClientDocuments");

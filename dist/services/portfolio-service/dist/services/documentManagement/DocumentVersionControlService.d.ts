export const __esModule: boolean;
export class DocumentVersionControlService {
    constructor(prisma: any, logger: any, kafkaService: any);
    prisma: any;
    logger: any;
    kafkaService: any;
    versioningStrategies: Map<any, any>;
    storageStrategies: Map<any, any>;
    retentionPolicies: Map<any, any>;
    auditAnalyzer: AuditAnalyzer;
    manageVersion(request: any): Promise<{
        documentId: any;
        success: boolean;
        currentVersion: any;
        totalVersions: any;
        changesSummary: {
            filesChanged: number;
            bytesChanged: number;
            contentModified: boolean;
            metadataModified: boolean;
            versionIncremented: boolean;
            checksumChanged: boolean;
        };
        auditLogId: string;
        processingTime: number;
        metadata: {
            versioningStrategy: string;
            storageStrategy: string;
            retentionPolicy: string;
            performedAt: Date;
            performedBy: any;
        };
    }>;
    createNewVersion(document: any, request: any): Promise<{
        documentId: any;
        versionId: string;
        success: boolean;
        currentVersion: any;
        totalVersions: any;
        changesSummary: {
            filesChanged: number;
            bytesChanged: number;
            contentModified: boolean;
            metadataModified: boolean;
            versionIncremented: boolean;
            checksumChanged: boolean;
        };
        auditLogId: string;
        processingTime: number;
        metadata: {
            previousVersion: any;
            versioningStrategy: string;
            storageStrategy: string;
            retentionPolicy: string;
            performedAt: Date;
            performedBy: any;
        };
    }>;
    updateDocument(document: any, request: any): Promise<{
        documentId: any;
        versionId: any;
        success: boolean;
        currentVersion: any;
        totalVersions: any;
        changesSummary: {
            filesChanged: number;
            bytesChanged: number;
            contentModified: boolean;
            metadataModified: boolean;
            versionIncremented: boolean;
            checksumChanged: boolean;
        };
        auditLogId: string;
        processingTime: number;
        metadata: {
            versioningStrategy: string;
            storageStrategy: string;
            retentionPolicy: string;
            performedAt: Date;
            performedBy: any;
        };
    }>;
    deleteVersion(document: any, request: any): Promise<{
        documentId: any;
        success: boolean;
        currentVersion: any;
        totalVersions: any;
        changesSummary: {
            filesChanged: number;
            bytesChanged: number;
            contentModified: boolean;
            metadataModified: boolean;
            versionIncremented: boolean;
            checksumChanged: boolean;
        };
        auditLogId: string;
        processingTime: number;
        metadata: {
            versioningStrategy: string;
            storageStrategy: string;
            retentionPolicy: string;
            performedAt: Date;
            performedBy: any;
        };
    }>;
    restoreVersion(document: any, request: any): Promise<{
        documentId: any;
        versionId: string;
        success: boolean;
        currentVersion: any;
        totalVersions: any;
        changesSummary: {
            filesChanged: number;
            bytesChanged: number;
            contentModified: boolean;
            metadataModified: boolean;
            versionIncremented: boolean;
            checksumChanged: boolean;
        };
        auditLogId: string;
        processingTime: number;
        metadata: {
            previousVersion: any;
            branchingPoint: any;
            versioningStrategy: string;
            storageStrategy: string;
            retentionPolicy: string;
            performedAt: Date;
            performedBy: any;
        };
    }>;
    getAuditTrail(request: any): Promise<{
        entries: any;
        totalCount: number;
        page: any;
        limit: any;
        totalPages: number;
        searchCriteria: {
            documentId: any;
            userId: any;
            action: any;
            dateRange: {
                start: any;
                end: any;
            };
        };
        aggregatedStats: {
            totalActions: number;
            uniqueUsers: number;
            uniqueDocuments: number;
            highRiskActions: number;
            complianceViolations: number;
            mostCommonActions: {
                action: string;
                count: number;
                percentage: number;
            }[];
            userActivity: {
                userId: string;
                actionCount: number;
                lastActivity: Date;
                riskScore: number;
            }[];
            timeDistribution: {
                period: string;
                count: number;
                timestamp: Date;
            }[];
        };
    }>;
    compareVersions(request: any): Promise<{
        documentId: any;
        version1: {
            versionNumber: any;
            filePath: any;
            fileSize: any;
            checksum: any;
            createdAt: any;
            createdBy: any;
            changeDescription: any;
        };
        version2: {
            versionNumber: any;
            filePath: any;
            fileSize: any;
            checksum: any;
            createdAt: any;
            createdBy: any;
            changeDescription: any;
        };
        differences: {
            field: string;
            type: string;
            oldValue: any;
            newValue: any;
            significance: string;
            description: string;
        }[];
        similarity: number;
        comparisonSummary: {
            totalDifferences: any;
            significantChanges: any;
            contentChanges: any;
            metadataChanges: any;
            sizeChange: number;
            similarityScore: number;
        };
    }>;
    calculateChanges(document: any, newFilePath: any, previousVersion: any): Promise<{
        filesChanged: number;
        bytesChanged: number;
        contentModified: boolean;
        metadataModified: boolean;
        versionIncremented: boolean;
        checksumChanged: boolean;
    }>;
    createAuditLogEntry(documentId: any, action: any, performedBy: any, details: any, metadata: any): Promise<{
        id: string;
        documentId: any;
        action: any;
        performedBy: any;
        performedAt: Date;
        details: any;
        metadata: any;
    }>;
    queryAuditEntries(request: any): Promise<{
        id: string;
        documentId: any;
        action: string;
        performedBy: string;
        performedAt: Date;
        details: string;
    }[]>;
    enhanceAuditEntries(entries: any, includeMetadata: any): Promise<any>;
    getAuditEntryCount(request: any): Promise<number>;
    calculateAuditStats(request: any): Promise<{
        totalActions: number;
        uniqueUsers: number;
        uniqueDocuments: number;
        highRiskActions: number;
        complianceViolations: number;
        mostCommonActions: {
            action: string;
            count: number;
            percentage: number;
        }[];
        userActivity: {
            userId: string;
            actionCount: number;
            lastActivity: Date;
            riskScore: number;
        }[];
        timeDistribution: {
            period: string;
            count: number;
            timestamp: Date;
        }[];
    }>;
    calculateVersionDifferences(version1: any, version2: any, comparisonType: any): Promise<{
        field: string;
        type: string;
        oldValue: any;
        newValue: any;
        significance: string;
        description: string;
    }[]>;
    calculateSimilarity(differences: any): number;
    generateComparisonSummary(differences: any, version1: any, version2: any): {
        totalDifferences: any;
        significantChanges: any;
        contentChanges: any;
        metadataChanges: any;
        sizeChange: number;
        similarityScore: number;
    };
    createVersionInfo(version: any): {
        versionNumber: any;
        filePath: any;
        fileSize: any;
        checksum: any;
        createdAt: any;
        createdBy: any;
        changeDescription: any;
    };
    generateVisualDiff(version1: any, version2: any): Promise<string>;
    applyRetentionPolicy(document: any): Promise<void>;
    getDocument(documentId: any, tenantId: any): Promise<{
        id: any;
        tenantId: any;
        versions: any[];
        filePath: string;
    }>;
    saveDocument(document: any): Promise<void>;
    saveAuditEntry(entry: any): Promise<void>;
    getFileSize(filePath: any): Promise<number>;
    calculateChecksum(filePath: any): Promise<string>;
    initializeVersionControl(): Promise<void>;
    initializeVersioningStrategies(): void;
    initializeStorageStrategies(): void;
    initializeRetentionPolicies(): void;
    publishVersionControlEvent(documentId: any, tenantId: any, result: any): Promise<void>;
}
declare class AuditAnalyzer {
    calculateRiskScore(entry: any): number;
    analyzeCompliance(entry: any): string[];
}
export {};

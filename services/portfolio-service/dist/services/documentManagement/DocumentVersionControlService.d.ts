import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../infrastructure/KafkaService';
import { DocumentStatus } from '../../models/documentManagement/DocumentManagement';
export interface VersionControlRequest {
    documentId: string;
    tenantId: string;
    action: 'CREATE_VERSION' | 'UPDATE_DOCUMENT' | 'DELETE_VERSION' | 'RESTORE_VERSION';
    newFilePath?: string;
    changeDescription: string;
    performedBy: string;
    metadata?: Record<string, any>;
}
export interface VersionControlResult {
    documentId: string;
    versionId?: string;
    success: boolean;
    currentVersion: string;
    totalVersions: number;
    changesSummary: ChangesSummary;
    auditLogId: string;
    processingTime: number;
    metadata: VersionControlMetadata;
}
export interface ChangesSummary {
    filesChanged: number;
    bytesChanged: number;
    contentModified: boolean;
    metadataModified: boolean;
    versionIncremented: boolean;
    checksumChanged: boolean;
}
export interface VersionControlMetadata {
    previousVersion?: string;
    branchingPoint?: string;
    mergeSource?: string;
    conflictResolution?: string;
    versioningStrategy: 'SEMANTIC' | 'INCREMENTAL' | 'TIMESTAMP';
    storageStrategy: 'FULL_COPY' | 'DELTA' | 'COMPRESSED';
    retentionPolicy: string;
    performedAt: Date;
    performedBy: string;
}
export interface AuditTrailRequest {
    documentId?: string;
    tenantId: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    includeMetadata: boolean;
    page: number;
    limit: number;
}
export interface AuditTrailResult {
    entries: EnhancedAuditEntry[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    searchCriteria: AuditSearchCriteria;
    aggregatedStats: AuditStats;
}
export interface EnhancedAuditEntry {
    id: string;
    documentId: string;
    action: string;
    performedBy: string;
    performedAt: Date;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    documentSnapshot?: DocumentSnapshot;
    relatedEntries?: string[];
    riskScore: number;
    complianceFlags: string[];
}
export interface DocumentSnapshot {
    fileName: string;
    fileSize: number;
    checksum: string;
    status: DocumentStatus;
    classification: string;
    tags: string[];
    version: string;
    capturedAt: Date;
}
export interface AuditSearchCriteria {
    documentId?: string;
    userId?: string;
    action?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    riskScoreThreshold?: number;
}
export interface AuditStats {
    totalActions: number;
    uniqueUsers: number;
    uniqueDocuments: number;
    highRiskActions: number;
    complianceViolations: number;
    mostCommonActions: ActionCount[];
    userActivity: UserActivity[];
    timeDistribution: TimeDistribution[];
}
export interface ActionCount {
    action: string;
    count: number;
    percentage: number;
}
export interface UserActivity {
    userId: string;
    actionCount: number;
    lastActivity: Date;
    riskScore: number;
}
export interface TimeDistribution {
    period: string;
    count: number;
    timestamp: Date;
}
export interface VersionComparisonRequest {
    documentId: string;
    tenantId: string;
    version1: string;
    version2: string;
    comparisonType: 'CONTENT' | 'METADATA' | 'FULL';
}
export interface VersionComparisonResult {
    documentId: string;
    version1: DocumentVersionInfo;
    version2: DocumentVersionInfo;
    differences: VersionDifference[];
    similarity: number;
    comparisonSummary: ComparisonSummary;
    visualDiff?: string;
}
export interface DocumentVersionInfo {
    versionNumber: string;
    filePath: string;
    fileSize: number;
    checksum: string;
    createdAt: Date;
    createdBy: string;
    changeDescription: string;
}
export interface VersionDifference {
    field: string;
    type: 'ADDED' | 'REMOVED' | 'MODIFIED';
    oldValue?: any;
    newValue?: any;
    significance: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
}
export interface ComparisonSummary {
    totalDifferences: number;
    significantChanges: number;
    contentChanges: number;
    metadataChanges: number;
    sizeChange: number;
    similarityScore: number;
}
export declare class DocumentVersionControlService {
    private prisma;
    private logger;
    private kafkaService;
    private versioningStrategies;
    private storageStrategies;
    private retentionPolicies;
    private auditAnalyzer;
    constructor(prisma: PrismaClient, logger: Logger, kafkaService: KafkaService);
    manageVersion(request: VersionControlRequest): Promise<VersionControlResult>;
    private createNewVersion;
    private updateDocument;
    private deleteVersion;
    private restoreVersion;
    getAuditTrail(request: AuditTrailRequest): Promise<AuditTrailResult>;
    compareVersions(request: VersionComparisonRequest): Promise<VersionComparisonResult>;
    private calculateChanges;
    private createAuditLogEntry;
    private queryAuditEntries;
    private enhanceAuditEntries;
    private getAuditEntryCount;
    private calculateAuditStats;
    private calculateVersionDifferences;
    private calculateSimilarity;
    private generateComparisonSummary;
    private createVersionInfo;
    private generateVisualDiff;
    private applyRetentionPolicy;
    private getDocument;
    private saveDocument;
    private saveAuditEntry;
    private getFileSize;
    private calculateChecksum;
    private initializeVersionControl;
    private initializeVersioningStrategies;
    private initializeStorageStrategies;
    private initializeRetentionPolicies;
    private publishVersionControlEvent;
}

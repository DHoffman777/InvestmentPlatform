"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVersionControlService = void 0;
class DocumentVersionControlService {
    prisma;
    logger;
    kafkaService;
    versioningStrategies;
    storageStrategies;
    retentionPolicies;
    auditAnalyzer;
    constructor(prisma, logger, kafkaService) {
        this.prisma = prisma;
        this.logger = logger;
        this.kafkaService = kafkaService;
        this.versioningStrategies = new Map();
        this.storageStrategies = new Map();
        this.retentionPolicies = new Map();
        this.auditAnalyzer = new AuditAnalyzer();
        this.initializeVersionControl();
    }
    async manageVersion(request) {
        try {
            this.logger.info('Starting version control operation', {
                documentId: request.documentId,
                action: request.action,
                performedBy: request.performedBy
            });
            const startTime = Date.now();
            const document = await this.getDocument(request.documentId, request.tenantId);
            if (!document) {
                throw new Error(`Document not found: ${request.documentId}`);
            }
            let result;
            switch (request.action) {
                case 'CREATE_VERSION':
                    result = await this.createNewVersion(document, request);
                    break;
                case 'UPDATE_DOCUMENT':
                    result = await this.updateDocument(document, request);
                    break;
                case 'DELETE_VERSION':
                    result = await this.deleteVersion(document, request);
                    break;
                case 'RESTORE_VERSION':
                    result = await this.restoreVersion(document, request);
                    break;
                default:
                    throw new Error(`Unsupported action: ${request.action}`);
            }
            const auditLogEntry = await this.createAuditLogEntry(request.documentId, request.action, request.performedBy, request.changeDescription, request.metadata);
            result.auditLogId = auditLogEntry.id;
            result.processingTime = Date.now() - startTime;
            await this.publishVersionControlEvent(request.documentId, request.tenantId, result);
            this.logger.info('Version control operation completed', {
                documentId: request.documentId,
                action: request.action,
                success: result.success,
                processingTime: result.processingTime
            });
            return result;
        }
        catch (error) {
            this.logger.error('Version control operation failed', {
                documentId: request.documentId,
                action: request.action,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error.stack
            });
            throw error;
        }
    }
    async createNewVersion(document, request) {
        const strategy = this.versioningStrategies.get('SEMANTIC') || this.versioningStrategies.get('INCREMENTAL');
        const newVersionNumber = strategy.generateNextVersion(document.versions);
        const previousVersion = document.versions.find(v => v.isCurrentVersion);
        const changesSummary = await this.calculateChanges(document, request.newFilePath, previousVersion);
        const newVersion = {
            id: `version_${document.id}_${Date.now()}`,
            documentId: document.id,
            versionNumber: newVersionNumber,
            filePath: request.newFilePath || document.filePath,
            fileSize: await this.getFileSize(request.newFilePath || document.filePath),
            checksum: await this.calculateChecksum(request.newFilePath || document.filePath),
            uploadedBy: request.performedBy,
            uploadedAt: new Date(),
            changeDescription: request.changeDescription,
            isCurrentVersion: true
        };
        if (previousVersion) {
            previousVersion.isCurrentVersion = false;
        }
        document.versions.push(newVersion);
        await this.saveDocument(document);
        const storageStrategy = this.storageStrategies.get('FULL_COPY');
        await storageStrategy.storeVersion(newVersion, document);
        await this.applyRetentionPolicy(document);
        return {
            documentId: document.id,
            versionId: newVersion.id,
            success: true,
            currentVersion: newVersionNumber,
            totalVersions: document.versions.length,
            changesSummary,
            auditLogId: '',
            processingTime: 0,
            metadata: {
                previousVersion: previousVersion?.versionNumber,
                versioningStrategy: 'SEMANTIC',
                storageStrategy: 'FULL_COPY',
                retentionPolicy: 'DEFAULT',
                performedAt: new Date(),
                performedBy: request.performedBy
            }
        };
    }
    async updateDocument(document, request) {
        const currentVersion = document.versions.find(v => v.isCurrentVersion);
        if (!currentVersion) {
            throw new Error('No current version found');
        }
        const changesSummary = await this.calculateChanges(document, request.newFilePath, currentVersion);
        if (request.newFilePath) {
            currentVersion.filePath = request.newFilePath;
            currentVersion.fileSize = await this.getFileSize(request.newFilePath);
            currentVersion.checksum = await this.calculateChecksum(request.newFilePath);
            currentVersion.uploadedAt = new Date();
            currentVersion.uploadedBy = request.performedBy;
        }
        if (request.changeDescription) {
            currentVersion.changeDescription = request.changeDescription;
        }
        await this.saveDocument(document);
        return {
            documentId: document.id,
            versionId: currentVersion.id,
            success: true,
            currentVersion: currentVersion.versionNumber,
            totalVersions: document.versions.length,
            changesSummary,
            auditLogId: '',
            processingTime: 0,
            metadata: {
                versioningStrategy: 'INCREMENTAL',
                storageStrategy: 'DELTA',
                retentionPolicy: 'DEFAULT',
                performedAt: new Date(),
                performedBy: request.performedBy
            }
        };
    }
    async deleteVersion(document, request) {
        const versionToDelete = document.versions.find(v => v.id === request.metadata?.versionId);
        if (!versionToDelete) {
            throw new Error('Version not found');
        }
        if (versionToDelete.isCurrentVersion && document.versions.length > 1) {
            const previousVersion = document.versions
                .filter(v => v.id !== versionToDelete.id)
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
            if (previousVersion) {
                previousVersion.isCurrentVersion = true;
            }
        }
        document.versions = document.versions.filter(v => v.id !== versionToDelete.id);
        await this.saveDocument(document);
        const storageStrategy = this.storageStrategies.get('FULL_COPY');
        await storageStrategy.deleteVersion(versionToDelete);
        const currentVersion = document.versions.find(v => v.isCurrentVersion);
        return {
            documentId: document.id,
            success: true,
            currentVersion: currentVersion?.versionNumber || 'NONE',
            totalVersions: document.versions.length,
            changesSummary: {
                filesChanged: 1,
                bytesChanged: -versionToDelete.fileSize,
                contentModified: false,
                metadataModified: true,
                versionIncremented: false,
                checksumChanged: false
            },
            auditLogId: '',
            processingTime: 0,
            metadata: {
                versioningStrategy: 'INCREMENTAL',
                storageStrategy: 'FULL_COPY',
                retentionPolicy: 'DEFAULT',
                performedAt: new Date(),
                performedBy: request.performedBy
            }
        };
    }
    async restoreVersion(document, request) {
        const versionToRestore = document.versions.find(v => v.id === request.metadata?.versionId);
        if (!versionToRestore) {
            throw new Error('Version to restore not found');
        }
        const currentVersion = document.versions.find(v => v.isCurrentVersion);
        if (currentVersion) {
            currentVersion.isCurrentVersion = false;
        }
        const strategy = this.versioningStrategies.get('SEMANTIC');
        const newVersionNumber = strategy.generateNextVersion(document.versions);
        const restoredVersion = {
            id: `version_${document.id}_${Date.now()}`,
            documentId: document.id,
            versionNumber: newVersionNumber,
            filePath: versionToRestore.filePath,
            fileSize: versionToRestore.fileSize,
            checksum: versionToRestore.checksum,
            uploadedBy: request.performedBy,
            uploadedAt: new Date(),
            changeDescription: `Restored from version ${versionToRestore.versionNumber}: ${request.changeDescription}`,
            isCurrentVersion: true
        };
        document.versions.push(restoredVersion);
        await this.saveDocument(document);
        const storageStrategy = this.storageStrategies.get('FULL_COPY');
        await storageStrategy.restoreVersion(versionToRestore, restoredVersion);
        return {
            documentId: document.id,
            versionId: restoredVersion.id,
            success: true,
            currentVersion: newVersionNumber,
            totalVersions: document.versions.length,
            changesSummary: {
                filesChanged: 1,
                bytesChanged: 0,
                contentModified: true,
                metadataModified: true,
                versionIncremented: true,
                checksumChanged: false
            },
            auditLogId: '',
            processingTime: 0,
            metadata: {
                previousVersion: currentVersion?.versionNumber,
                branchingPoint: versionToRestore.versionNumber,
                versioningStrategy: 'SEMANTIC',
                storageStrategy: 'FULL_COPY',
                retentionPolicy: 'DEFAULT',
                performedAt: new Date(),
                performedBy: request.performedBy
            }
        };
    }
    async getAuditTrail(request) {
        try {
            this.logger.info('Retrieving audit trail', {
                documentId: request.documentId,
                userId: request.userId,
                dateRange: { start: request.startDate, end: request.endDate }
            });
            const auditEntries = await this.queryAuditEntries(request);
            const enhancedEntries = await this.enhanceAuditEntries(auditEntries, request.includeMetadata);
            const totalCount = await this.getAuditEntryCount(request);
            const aggregatedStats = await this.calculateAuditStats(request);
            const result = {
                entries: enhancedEntries,
                totalCount,
                page: request.page,
                limit: request.limit,
                totalPages: Math.ceil(totalCount / request.limit),
                searchCriteria: {
                    documentId: request.documentId,
                    userId: request.userId,
                    action: request.action,
                    dateRange: request.startDate && request.endDate ?
                        { start: request.startDate, end: request.endDate } : undefined
                },
                aggregatedStats
            };
            this.logger.info('Audit trail retrieved', {
                entriesReturned: enhancedEntries.length,
                totalCount,
                page: request.page
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to retrieve audit trail', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error.stack
            });
            throw error;
        }
    }
    async compareVersions(request) {
        try {
            this.logger.info('Comparing document versions', {
                documentId: request.documentId,
                version1: request.version1,
                version2: request.version2
            });
            const document = await this.getDocument(request.documentId, request.tenantId);
            if (!document) {
                throw new Error('Document not found');
            }
            const version1Info = document.versions.find(v => v.versionNumber === request.version1);
            const version2Info = document.versions.find(v => v.versionNumber === request.version2);
            if (!version1Info || !version2Info) {
                throw new Error('One or both versions not found');
            }
            const differences = await this.calculateVersionDifferences(version1Info, version2Info, request.comparisonType);
            const similarity = this.calculateSimilarity(differences);
            const comparisonSummary = this.generateComparisonSummary(differences, version1Info, version2Info);
            const result = {
                documentId: request.documentId,
                version1: this.createVersionInfo(version1Info),
                version2: this.createVersionInfo(version2Info),
                differences,
                similarity,
                comparisonSummary
            };
            if (request.comparisonType === 'CONTENT' || request.comparisonType === 'FULL') {
                result.visualDiff = await this.generateVisualDiff(version1Info, version2Info);
            }
            this.logger.info('Version comparison completed', {
                documentId: request.documentId,
                differencesFound: differences.length,
                similarity
            });
            return result;
        }
        catch (error) {
            this.logger.error('Version comparison failed', {
                documentId: request.documentId,
                error: error.message
            });
            throw error;
        }
    }
    async calculateChanges(document, newFilePath, previousVersion) {
        if (!newFilePath || !previousVersion) {
            return {
                filesChanged: 1,
                bytesChanged: 0,
                contentModified: false,
                metadataModified: true,
                versionIncremented: true,
                checksumChanged: false
            };
        }
        const newFileSize = await this.getFileSize(newFilePath);
        const newChecksum = await this.calculateChecksum(newFilePath);
        return {
            filesChanged: 1,
            bytesChanged: newFileSize - previousVersion.fileSize,
            contentModified: newChecksum !== previousVersion.checksum,
            metadataModified: true,
            versionIncremented: true,
            checksumChanged: newChecksum !== previousVersion.checksum
        };
    }
    async createAuditLogEntry(documentId, action, performedBy, details, metadata) {
        const auditEntry = {
            id: `audit_${documentId}_${Date.now()}`,
            documentId,
            action: action,
            performedBy,
            performedAt: new Date(),
            details,
            metadata
        };
        await this.saveAuditEntry(auditEntry);
        return auditEntry;
    }
    async queryAuditEntries(request) {
        const mockEntries = [
            {
                id: 'audit_1',
                documentId: request.documentId || 'doc_1',
                action: 'CREATED',
                performedBy: 'user_1',
                performedAt: new Date('2024-01-01'),
                details: 'Document created'
            },
            {
                id: 'audit_2',
                documentId: request.documentId || 'doc_1',
                action: 'UPDATED',
                performedBy: 'user_2',
                performedAt: new Date('2024-01-02'),
                details: 'Document updated'
            }
        ];
        return mockEntries.slice((request.page - 1) * request.limit, request.page * request.limit);
    }
    async enhanceAuditEntries(entries, includeMetadata) {
        return entries.map(entry => ({
            id: entry.id,
            documentId: entry.documentId,
            action: entry.action,
            performedBy: entry.performedBy,
            performedAt: entry.performedAt,
            details: entry.details,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            metadata: includeMetadata ? entry.metadata : undefined,
            riskScore: this.auditAnalyzer.calculateRiskScore(entry),
            complianceFlags: this.auditAnalyzer.analyzeCompliance(entry),
            relatedEntries: []
        }));
    }
    async getAuditEntryCount(request) {
        return 100;
    }
    async calculateAuditStats(request) {
        return {
            totalActions: 100,
            uniqueUsers: 5,
            uniqueDocuments: 20,
            highRiskActions: 3,
            complianceViolations: 1,
            mostCommonActions: [
                { action: 'VIEWED', count: 45, percentage: 45 },
                { action: 'UPDATED', count: 30, percentage: 30 },
                { action: 'CREATED', count: 25, percentage: 25 }
            ],
            userActivity: [
                { userId: 'user_1', actionCount: 50, lastActivity: new Date(), riskScore: 0.2 },
                { userId: 'user_2', actionCount: 30, lastActivity: new Date(), riskScore: 0.1 }
            ],
            timeDistribution: [
                { period: '2024-01', count: 40, timestamp: new Date('2024-01-01') },
                { period: '2024-02', count: 35, timestamp: new Date('2024-02-01') },
                { period: '2024-03', count: 25, timestamp: new Date('2024-03-01') }
            ]
        };
    }
    async calculateVersionDifferences(version1, version2, comparisonType) {
        const differences = [];
        if (version1.fileSize !== version2.fileSize) {
            differences.push({
                field: 'fileSize',
                type: 'MODIFIED',
                oldValue: version1.fileSize,
                newValue: version2.fileSize,
                significance: Math.abs(version1.fileSize - version2.fileSize) > 1000000 ? 'HIGH' : 'MEDIUM',
                description: `File size changed from ${version1.fileSize} to ${version2.fileSize} bytes`
            });
        }
        if (version1.checksum !== version2.checksum) {
            differences.push({
                field: 'checksum',
                type: 'MODIFIED',
                oldValue: version1.checksum,
                newValue: version2.checksum,
                significance: 'HIGH',
                description: 'Content checksum changed, indicating file content modification'
            });
        }
        if (version1.changeDescription !== version2.changeDescription) {
            differences.push({
                field: 'changeDescription',
                type: 'MODIFIED',
                oldValue: version1.changeDescription,
                newValue: version2.changeDescription,
                significance: 'LOW',
                description: 'Change description updated'
            });
        }
        return differences;
    }
    calculateSimilarity(differences) {
        if (differences.length === 0)
            return 1.0;
        const totalWeight = differences.reduce((sum, diff) => {
            switch (diff.significance) {
                case 'HIGH': return sum + 0.5;
                case 'MEDIUM': return sum + 0.3;
                case 'LOW': return sum + 0.1;
                default: return sum;
            }
        }, 0);
        return Math.max(0, 1 - totalWeight);
    }
    generateComparisonSummary(differences, version1, version2) {
        const contentChanges = differences.filter(d => d.field === 'checksum' || d.field === 'fileSize').length;
        const metadataChanges = differences.filter(d => d.field !== 'checksum' && d.field !== 'fileSize').length;
        const significantChanges = differences.filter(d => d.significance === 'HIGH').length;
        return {
            totalDifferences: differences.length,
            significantChanges,
            contentChanges,
            metadataChanges,
            sizeChange: version2.fileSize - version1.fileSize,
            similarityScore: this.calculateSimilarity(differences)
        };
    }
    createVersionInfo(version) {
        return {
            versionNumber: version.versionNumber,
            filePath: version.filePath,
            fileSize: version.fileSize,
            checksum: version.checksum,
            createdAt: version.uploadedAt,
            createdBy: version.uploadedBy,
            changeDescription: version.changeDescription
        };
    }
    async generateVisualDiff(version1, version2) {
        return `--- Version ${version1.versionNumber}\n+++ Version ${version2.versionNumber}\n@@ -1,3 +1,3 @@\n-Old content\n+New content\n Changes detected`;
    }
    async applyRetentionPolicy(document) {
        const policy = this.retentionPolicies.get('DEFAULT');
        await policy.apply(document);
    }
    async getDocument(documentId, tenantId) {
        return {
            id: documentId,
            tenantId,
            versions: [],
            filePath: '/path/to/document'
        };
    }
    async saveDocument(document) {
        this.logger.info('Saving document', { documentId: document.id });
    }
    async saveAuditEntry(entry) {
        this.logger.info('Saving audit entry', { entryId: entry.id });
    }
    async getFileSize(filePath) {
        return 1024;
    }
    async calculateChecksum(filePath) {
        return `checksum_${Date.now()}`;
    }
    async initializeVersionControl() {
        try {
            this.initializeVersioningStrategies();
            this.initializeStorageStrategies();
            this.initializeRetentionPolicies();
            this.logger.info('Document version control service initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize version control', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    initializeVersioningStrategies() {
        this.versioningStrategies.set('SEMANTIC', new SemanticVersioningStrategy());
        this.versioningStrategies.set('INCREMENTAL', new IncrementalVersioningStrategy());
        this.versioningStrategies.set('TIMESTAMP', new TimestampVersioningStrategy());
    }
    initializeStorageStrategies() {
        this.storageStrategies.set('FULL_COPY', new FullCopyStorageStrategy());
        this.storageStrategies.set('DELTA', new DeltaStorageStrategy());
        this.storageStrategies.set('COMPRESSED', new CompressedStorageStrategy());
    }
    initializeRetentionPolicies() {
        this.retentionPolicies.set('DEFAULT', new DefaultRetentionPolicy());
        this.retentionPolicies.set('COMPLIANCE', new ComplianceRetentionPolicy());
        this.retentionPolicies.set('AGGRESSIVE', new AggressiveRetentionPolicy());
    }
    async publishVersionControlEvent(documentId, tenantId, result) {
        const event = {
            eventType: 'VERSION_CONTROL_OPERATION',
            documentId,
            tenantId,
            currentVersion: result.currentVersion,
            totalVersions: result.totalVersions,
            success: result.success,
            timestamp: new Date().toISOString()
        };
        await this.kafkaService.publishEvent('document-processing', event);
    }
}
exports.DocumentVersionControlService = DocumentVersionControlService;
class SemanticVersioningStrategy {
    generateNextVersion(versions) {
        if (versions.length === 0)
            return '1.0.0';
        const latestVersion = versions
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
        const [major, minor, patch] = latestVersion.versionNumber.split('.').map(Number);
        return `${major}.${minor}.${patch + 1}`;
    }
}
class IncrementalVersioningStrategy {
    generateNextVersion(versions) {
        return (versions.length + 1).toString();
    }
}
class TimestampVersioningStrategy {
    generateNextVersion(versions) {
        return new Date().toISOString().replace(/[:.]/g, '-');
    }
}
class FullCopyStorageStrategy {
    async storeVersion(version, document) {
        console.log(`Storing full copy of version ${version.versionNumber}`);
    }
    async deleteVersion(version) {
        console.log(`Deleting version ${version.versionNumber}`);
    }
    async restoreVersion(sourceVersion, targetVersion) {
        console.log(`Restoring from ${sourceVersion.versionNumber} to ${targetVersion.versionNumber}`);
    }
}
class DeltaStorageStrategy {
    async storeVersion(version, document) {
        console.log(`Storing delta for version ${version.versionNumber}`);
    }
    async deleteVersion(version) {
        console.log(`Deleting delta for version ${version.versionNumber}`);
    }
    async restoreVersion(sourceVersion, targetVersion) {
        console.log(`Restoring delta from ${sourceVersion.versionNumber} to ${targetVersion.versionNumber}`);
    }
}
class CompressedStorageStrategy {
    async storeVersion(version, document) {
        console.log(`Storing compressed version ${version.versionNumber}`);
    }
    async deleteVersion(version) {
        console.log(`Deleting compressed version ${version.versionNumber}`);
    }
    async restoreVersion(sourceVersion, targetVersion) {
        console.log(`Restoring compressed version from ${sourceVersion.versionNumber} to ${targetVersion.versionNumber}`);
    }
}
class DefaultRetentionPolicy {
    async apply(document) {
        const maxVersions = 10;
        if (document.versions.length > maxVersions) {
            const versionsToDelete = document.versions
                .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
                .slice(0, document.versions.length - maxVersions);
            document.versions = document.versions.filter(v => !versionsToDelete.includes(v));
        }
    }
}
class ComplianceRetentionPolicy {
    async apply(document) {
        const retentionYears = 7;
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);
        document.versions = document.versions.filter(v => new Date(v.uploadedAt) > cutoffDate || v.isCurrentVersion);
    }
}
class AggressiveRetentionPolicy {
    async apply(document) {
        const maxVersions = 3;
        if (document.versions.length > maxVersions) {
            const versionsToKeep = document.versions
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                .slice(0, maxVersions);
            document.versions = versionsToKeep;
        }
    }
}
class AuditAnalyzer {
    calculateRiskScore(entry) {
        let score = 0;
        const highRiskActions = ['DELETED', 'ARCHIVED', 'CLASSIFICATION_CHANGED'];
        if (highRiskActions.includes(entry.action)) {
            score += 0.7;
        }
        const afterHoursTime = new Date(entry.performedAt).getHours();
        if (afterHoursTime < 6 || afterHoursTime > 22) {
            score += 0.3;
        }
        return Math.min(score, 1.0);
    }
    analyzeCompliance(entry) {
        const flags = [];
        if (entry.action === 'DELETED' && !entry.details.includes('approved')) {
            flags.push('UNAUTHORIZED_DELETION');
        }
        if (entry.action === 'DOWNLOADED' && !entry.metadata?.approved) {
            flags.push('UNAPPROVED_ACCESS');
        }
        return flags;
    }
}

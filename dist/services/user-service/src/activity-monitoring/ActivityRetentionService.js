"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityRetentionService = exports.JobStatus = exports.RequestStatus = exports.RequestType = exports.RetentionAction = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var RetentionAction;
(function (RetentionAction) {
    RetentionAction["DELETE"] = "delete";
    RetentionAction["ARCHIVE"] = "archive";
    RetentionAction["COMPRESS"] = "compress";
    RetentionAction["ANONYMIZE"] = "anonymize";
    RetentionAction["MIGRATE"] = "migrate";
    RetentionAction["BACKUP"] = "backup";
})(RetentionAction || (exports.RetentionAction = RetentionAction = {}));
var RequestType;
(function (RequestType) {
    RequestType["ACCESS"] = "access";
    RequestType["RECTIFICATION"] = "rectification";
    RequestType["ERASURE"] = "erasure";
    RequestType["PORTABILITY"] = "portability";
    RequestType["RESTRICTION"] = "restriction";
    RequestType["OBJECTION"] = "objection"; // GDPR Article 21 - Right to object
})(RequestType || (exports.RequestType = RequestType = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["RECEIVED"] = "received";
    RequestStatus["VERIFYING"] = "verifying";
    RequestStatus["PROCESSING"] = "processing";
    RequestStatus["COMPLETED"] = "completed";
    RequestStatus["REJECTED"] = "rejected";
    RequestStatus["ESCALATED"] = "escalated";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "pending";
    JobStatus["RUNNING"] = "running";
    JobStatus["COMPLETED"] = "completed";
    JobStatus["FAILED"] = "failed";
    JobStatus["CANCELLED"] = "cancelled";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
class ActivityRetentionService extends events_1.EventEmitter {
    retentionPolicies = new Map();
    archivedData = new Map();
    complianceRequirements = new Map();
    dataSubjectRequests = new Map();
    retentionJobs = new Map();
    scheduledJobs = [];
    compressionProvider; // Would use actual compression library
    encryptionProvider; // Would use actual encryption library
    storageProvider; // Would use actual storage provider
    constructor() {
        super();
        this.initializeComplianceRequirements();
        this.startRetentionScheduler();
    }
    async createRetentionPolicy(policy) {
        const newPolicy = {
            id: (0, crypto_1.randomUUID)(),
            createdAt: new Date(),
            updatedAt: new Date(),
            appliedCount: 0,
            ...policy
        };
        // Validate policy against compliance requirements
        await this.validatePolicyCompliance(newPolicy);
        this.retentionPolicies.set(newPolicy.id, newPolicy);
        this.emit('policyCreated', newPolicy);
        return newPolicy;
    }
    async updateRetentionPolicy(policyId, updates) {
        const policy = this.retentionPolicies.get(policyId);
        if (!policy)
            return null;
        const updatedPolicy = { ...policy, ...updates, updatedAt: new Date() };
        // Validate updated policy
        await this.validatePolicyCompliance(updatedPolicy);
        this.retentionPolicies.set(policyId, updatedPolicy);
        this.emit('policyUpdated', updatedPolicy);
        return updatedPolicy;
    }
    async deleteRetentionPolicy(policyId) {
        const policy = this.retentionPolicies.get(policyId);
        if (!policy)
            return false;
        // Check if policy has been applied - may need approval for deletion
        if (policy.appliedCount > 0) {
            this.emit('policyDeletionRequested', policy);
            return false; // Require manual approval
        }
        const deleted = this.retentionPolicies.delete(policyId);
        if (deleted) {
            this.emit('policyDeleted', policyId);
        }
        return deleted;
    }
    async applyRetentionPolicies(tenantId, activities) {
        const results = {
            processed: 0,
            archived: 0,
            deleted: 0,
            errors: []
        };
        const applicablePolicies = this.getApplicablePolicies(tenantId);
        for (const activity of activities) {
            try {
                const matchingPolicies = applicablePolicies.filter(policy => this.activityMatchesPolicy(activity, policy));
                if (matchingPolicies.length > 0) {
                    // Apply highest priority policy
                    const policy = matchingPolicies.sort((a, b) => b.priority - a.priority)[0];
                    await this.applyPolicyToActivity(activity, policy);
                    policy.appliedCount++;
                    policy.lastApplied = new Date();
                    results.processed++;
                    // Count by action type
                    policy.rules.forEach(rule => {
                        if (rule.action === RetentionAction.ARCHIVE)
                            results.archived++;
                        if (rule.action === RetentionAction.DELETE)
                            results.deleted++;
                    });
                }
            }
            catch (error) {
                results.errors.push(`Error processing activity ${activity.id}: ${error.message}`);
            }
        }
        this.emit('retentionPoliciesApplied', { tenantId, results });
        return results;
    }
    async archiveActivity(activity, archiveLocation, policyId) {
        // Compress data if required
        let compressedData = activity;
        let compressionRatio;
        const policy = this.retentionPolicies.get(policyId);
        const rule = policy?.rules.find(r => r.compressionEnabled);
        if (rule?.compressionEnabled) {
            const compressed = await this.compressData(activity);
            compressedData = compressed.data;
            compressionRatio = compressed.ratio;
        }
        // Encrypt data if required
        let encryptionKeyId;
        if (rule?.encryptionRequired) {
            const encrypted = await this.encryptData(compressedData);
            compressedData = encrypted.data;
            encryptionKeyId = encrypted.keyId;
        }
        // Calculate checksum
        const checksumHash = await this.calculateChecksum(compressedData);
        // Store in archive location
        await this.storeArchivedData(activity.id, compressedData, archiveLocation);
        const archiveEntry = {
            id: (0, crypto_1.randomUUID)(),
            activityId: activity.id,
            tenantId: activity.tenantId,
            userId: activity.userId,
            originalData: activity,
            archivedAt: new Date(),
            archiveLocation,
            compressionRatio,
            encryptionKeyId,
            retrievalCount: 0,
            retentionPolicyId: policyId,
            complianceTags: rule?.complianceTags || [],
            checksumHash
        };
        this.archivedData.set(archiveEntry.id, archiveEntry);
        this.emit('activityArchived', archiveEntry);
        return archiveEntry;
    }
    async retrieveArchivedActivity(archiveId) {
        const archiveEntry = this.archivedData.get(archiveId);
        if (!archiveEntry)
            return null;
        try {
            // Retrieve from storage
            let data = await this.retrieveArchivedData(archiveEntry.activityId, archiveEntry.archiveLocation);
            // Decrypt if necessary
            if (archiveEntry.encryptionKeyId) {
                data = await this.decryptData(data, archiveEntry.encryptionKeyId);
            }
            // Decompress if necessary
            if (archiveEntry.compressionRatio) {
                data = await this.decompressData(data);
            }
            // Update retrieval statistics
            archiveEntry.retrievalCount++;
            archiveEntry.lastRetrieved = new Date();
            this.emit('activityRetrieved', archiveEntry);
            return data;
        }
        catch (error) {
            this.emit('retrievalError', { archiveId, error: error.message });
            return null;
        }
    }
    async processDataSubjectRequest(request) {
        const newRequest = {
            id: (0, crypto_1.randomUUID)(),
            requestedAt: new Date(),
            status: RequestStatus.RECEIVED,
            processingNotes: [],
            affectedRecords: [],
            ...request
        };
        this.dataSubjectRequests.set(newRequest.id, newRequest);
        this.emit('dataSubjectRequestReceived', newRequest);
        // Start processing automatically
        await this.processDataSubjectRequestAsync(newRequest.id);
        return newRequest;
    }
    async getRetentionPolicies(tenantId) {
        let policies = Array.from(this.retentionPolicies.values());
        if (tenantId) {
            policies = policies.filter(p => p.tenantId === tenantId);
        }
        return policies.sort((a, b) => b.priority - a.priority);
    }
    async getArchivedActivities(filter = {}) {
        let entries = Array.from(this.archivedData.values());
        if (filter.tenantId) {
            entries = entries.filter(e => e.tenantId === filter.tenantId);
        }
        if (filter.userId) {
            entries = entries.filter(e => e.userId === filter.userId);
        }
        if (filter.startDate) {
            entries = entries.filter(e => e.archivedAt >= filter.startDate);
        }
        if (filter.endDate) {
            entries = entries.filter(e => e.archivedAt <= filter.endDate);
        }
        if (filter.policyId) {
            entries = entries.filter(e => e.retentionPolicyId === filter.policyId);
        }
        return entries.sort((a, b) => b.archivedAt.getTime() - a.archivedAt.getTime());
    }
    async getRetentionStatistics(tenantId) {
        const policies = await this.getRetentionPolicies(tenantId);
        const archived = await this.getArchivedActivities({ tenantId });
        const totalPolicies = policies.length;
        const activePolicies = policies.filter(p => p.isActive).length;
        const archivedRecords = archived.length;
        const storageUsed = archived.reduce((sum, entry) => {
            return sum + (entry.compressionRatio ?
                JSON.stringify(entry.originalData).length * entry.compressionRatio :
                JSON.stringify(entry.originalData).length);
        }, 0);
        const compressionSavings = archived.reduce((sum, entry) => {
            if (entry.compressionRatio) {
                const originalSize = JSON.stringify(entry.originalData).length;
                const compressedSize = originalSize * entry.compressionRatio;
                return sum + (originalSize - compressedSize);
            }
            return sum;
        }, 0);
        const complianceStatus = await this.checkComplianceStatus(tenantId);
        return {
            totalPolicies,
            activePolicies,
            archivedRecords,
            deletedRecords: 0, // Would track deleted records
            storageUsed,
            compressionSavings,
            complianceStatus
        };
    }
    async createRetentionJob(policyId, tenantId) {
        const job = {
            id: (0, crypto_1.randomUUID)(),
            policyId,
            tenantId,
            scheduledAt: new Date(),
            status: JobStatus.PENDING,
            recordsProcessed: 0,
            recordsArchived: 0,
            recordsDeleted: 0,
            errors: [],
            progress: 0
        };
        this.retentionJobs.set(job.id, job);
        this.emit('retentionJobCreated', job);
        // Execute job asynchronously
        this.executeRetentionJobAsync(job.id);
        return job;
    }
    async validatePolicyCompliance(policy) {
        const complianceReqs = Array.from(this.complianceRequirements.values())
            .filter(req => req.jurisdiction === 'GLOBAL' || req.jurisdiction === 'US'); // Simplified
        for (const req of complianceReqs) {
            // Check minimum retention period
            const hasValidRetention = policy.rules.some(rule => rule.retentionPeriod >= req.minRetentionPeriod);
            if (!hasValidRetention) {
                throw new Error(`Policy violates ${req.regulation}: Minimum retention period not met`);
            }
            // Check encryption requirements
            if (req.encryptionRequired) {
                const hasEncryption = policy.rules.some(rule => rule.encryptionRequired);
                if (!hasEncryption) {
                    throw new Error(`Policy violates ${req.regulation}: Encryption is required`);
                }
            }
            // Check deletion restrictions
            if (!req.deletionAllowed) {
                const hasDelete = policy.rules.some(rule => rule.action === RetentionAction.DELETE);
                if (hasDelete) {
                    throw new Error(`Policy violates ${req.regulation}: Deletion is not allowed`);
                }
            }
        }
    }
    getApplicablePolicies(tenantId) {
        return Array.from(this.retentionPolicies.values())
            .filter(policy => policy.tenantId === tenantId && policy.isActive)
            .sort((a, b) => b.priority - a.priority);
    }
    activityMatchesPolicy(activity, policy) {
        return policy.rules.some(rule => this.evaluateRetentionCondition(rule.condition, activity));
    }
    evaluateRetentionCondition(condition, activity) {
        let fieldValue;
        // Handle special age conditions
        if (condition.operator === 'age_greater_than' || condition.operator === 'age_less_than') {
            const age = Date.now() - activity.timestamp.getTime();
            fieldValue = age;
        }
        else {
            fieldValue = this.getNestedProperty(activity, condition.field);
        }
        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'not_equals':
                return fieldValue !== condition.value;
            case 'greater_than':
            case 'age_greater_than':
                return Number(fieldValue) > Number(condition.value);
            case 'less_than':
            case 'age_less_than':
                return Number(fieldValue) < Number(condition.value);
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(fieldValue);
            case 'not_in':
                return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
            case 'regex':
                return new RegExp(condition.value).test(String(fieldValue));
            default:
                return false;
        }
    }
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    async applyPolicyToActivity(activity, policy) {
        for (const rule of policy.rules) {
            if (this.evaluateRetentionCondition(rule.condition, activity)) {
                await this.executeRetentionAction(activity, rule, policy.id);
            }
        }
    }
    async executeRetentionAction(activity, rule, policyId) {
        switch (rule.action) {
            case RetentionAction.ARCHIVE:
                await this.archiveActivity(activity, rule.archiveLocation || 'default', policyId);
                break;
            case RetentionAction.DELETE:
                await this.deleteActivity(activity, policyId);
                break;
            case RetentionAction.ANONYMIZE:
                await this.anonymizeActivity(activity, policyId);
                break;
            case RetentionAction.COMPRESS:
                await this.compressActivity(activity, policyId);
                break;
            case RetentionAction.MIGRATE:
                await this.migrateActivity(activity, rule.archiveLocation || 'migration', policyId);
                break;
            case RetentionAction.BACKUP:
                await this.backupActivity(activity, policyId);
                break;
        }
    }
    async deleteActivity(activity, policyId) {
        // Check compliance before deletion
        const canDelete = await this.canDeleteActivity(activity);
        if (!canDelete) {
            throw new Error(`Cannot delete activity ${activity.id}: Compliance restrictions apply`);
        }
        // Create audit record before deletion
        this.emit('activityDeleted', { activityId: activity.id, policyId, timestamp: new Date() });
    }
    async anonymizeActivity(activity, policyId) {
        // Apply anonymization rules
        const anonymized = { ...activity };
        // Remove or hash personal identifiers
        anonymized.userId = this.hashValue(anonymized.userId);
        anonymized.ipAddress = this.anonymizeIP(anonymized.ipAddress);
        if (anonymized.location) {
            anonymized.location.latitude = undefined;
            anonymized.location.longitude = undefined;
            anonymized.location.city = 'ANONYMIZED';
        }
        this.emit('activityAnonymized', { original: activity.id, anonymized, policyId });
    }
    async compressActivity(activity, policyId) {
        const compressed = await this.compressData(activity);
        this.emit('activityCompressed', {
            activityId: activity.id,
            originalSize: JSON.stringify(activity).length,
            compressedSize: JSON.stringify(compressed.data).length,
            ratio: compressed.ratio,
            policyId
        });
    }
    async migrateActivity(activity, destination, policyId) {
        // Migrate to different storage tier or location
        await this.storeArchivedData(activity.id, activity, destination);
        this.emit('activityMigrated', { activityId: activity.id, destination, policyId });
    }
    async backupActivity(activity, policyId) {
        // Create backup copy
        const backupLocation = `backup/${new Date().toISOString().split('T')[0]}`;
        await this.storeArchivedData(`backup_${activity.id}`, activity, backupLocation);
        this.emit('activityBackedUp', { activityId: activity.id, backupLocation, policyId });
    }
    async canDeleteActivity(activity) {
        // Check against compliance requirements
        const applicableReqs = Array.from(this.complianceRequirements.values())
            .filter(req => req.dataTypes.includes(activity.activityType));
        return applicableReqs.every(req => req.deletionAllowed);
    }
    async processDataSubjectRequestAsync(requestId) {
        const request = this.dataSubjectRequests.get(requestId);
        if (!request)
            return;
        try {
            request.status = RequestStatus.PROCESSING;
            this.emit('dataSubjectRequestStatusChanged', request);
            switch (request.type) {
                case RequestType.ACCESS:
                    await this.processAccessRequest(request);
                    break;
                case RequestType.ERASURE:
                    await this.processErasureRequest(request);
                    break;
                case RequestType.PORTABILITY:
                    await this.processPortabilityRequest(request);
                    break;
                // Handle other request types
            }
            request.status = RequestStatus.COMPLETED;
            request.processedAt = new Date();
        }
        catch (error) {
            request.status = RequestStatus.FAILED;
            request.processingNotes.push(`Error: ${error.message}`);
        }
        this.emit('dataSubjectRequestStatusChanged', request);
    }
    async processAccessRequest(request) {
        // Collect all data for the user
        const archivedData = await this.getArchivedActivities({ userId: request.userId });
        request.affectedRecords = archivedData.map(entry => entry.id);
        request.processingNotes.push(`Found ${archivedData.length} archived records`);
        // Generate data export
        this.emit('dataExportReady', { requestId: request.id, recordCount: archivedData.length });
    }
    async processErasureRequest(request) {
        // Find and delete/anonymize user data
        const archivedData = await this.getArchivedActivities({ userId: request.userId });
        for (const entry of archivedData) {
            const canErase = await this.canDeleteActivity(entry.originalData);
            if (canErase) {
                this.archivedData.delete(entry.id);
                request.affectedRecords.push(entry.id);
            }
            else {
                // Anonymize instead of delete
                await this.anonymizeActivity(entry.originalData, 'erasure_request');
                request.processingNotes.push(`Anonymized record ${entry.id} due to compliance restrictions`);
            }
        }
    }
    async processPortabilityRequest(request) {
        // Export user data in portable format
        const archivedData = await this.getArchivedActivities({ userId: request.userId });
        const exportData = {
            userId: request.userId,
            exportedAt: new Date(),
            records: archivedData.map(entry => entry.originalData)
        };
        request.affectedRecords = archivedData.map(entry => entry.id);
        this.emit('portableDataReady', { requestId: request.id, exportData });
    }
    async executeRetentionJobAsync(jobId) {
        const job = this.retentionJobs.get(jobId);
        if (!job)
            return;
        try {
            job.status = JobStatus.RUNNING;
            job.startedAt = new Date();
            this.emit('retentionJobStarted', job);
            const policy = this.retentionPolicies.get(job.policyId);
            if (!policy) {
                throw new Error('Policy not found');
            }
            // Simulate processing activities (in production, would query database)
            const activitiesToProcess = []; // Would fetch from database
            for (let i = 0; i < activitiesToProcess.length; i++) {
                const activity = activitiesToProcess[i];
                try {
                    await this.applyPolicyToActivity(activity, policy);
                    job.recordsProcessed++;
                    // Update progress
                    job.progress = Math.round((i + 1) / activitiesToProcess.length * 100);
                }
                catch (error) {
                    job.errors.push(`Error processing activity ${activity.id}: ${error.message}`);
                }
            }
            job.status = JobStatus.COMPLETED;
            job.completedAt = new Date();
            job.progress = 100;
        }
        catch (error) {
            job.status = JobStatus.FAILED;
            job.errors.push(error.message);
        }
        this.emit('retentionJobCompleted', job);
    }
    startRetentionScheduler() {
        // Check for scheduled retention jobs every hour
        const schedulerInterval = setInterval(() => {
            this.checkScheduledRetention();
        }, 60 * 60 * 1000); // 1 hour
        this.scheduledJobs.push(schedulerInterval);
    }
    async checkScheduledRetention() {
        // Check policies that need to be applied
        for (const policy of this.retentionPolicies.values()) {
            if (policy.isActive && this.shouldRunPolicy(policy)) {
                await this.createRetentionJob(policy.id, policy.tenantId);
            }
        }
    }
    shouldRunPolicy(policy) {
        // Determine if policy should run based on schedule
        // Simplified logic - would implement proper scheduling
        const lastApplied = policy.lastApplied;
        if (!lastApplied)
            return true;
        const daysSinceLastRun = (Date.now() - lastApplied.getTime()) / (24 * 60 * 60 * 1000);
        return daysSinceLastRun >= 1; // Run daily
    }
    async checkComplianceStatus(tenantId) {
        const policies = await this.getRetentionPolicies(tenantId);
        const status = {};
        for (const req of this.complianceRequirements.values()) {
            const compliant = policies.some(policy => this.isPolicyCompliantWith(policy, req));
            status[req.regulation] = compliant;
        }
        return status;
    }
    isPolicyCompliantWith(policy, requirement) {
        // Check if policy meets compliance requirement
        const hasMinRetention = policy.rules.some(rule => rule.retentionPeriod >= requirement.minRetentionPeriod);
        const hasEncryption = !requirement.encryptionRequired ||
            policy.rules.some(rule => rule.encryptionRequired);
        const respectsDeletionRestriction = requirement.deletionAllowed ||
            !policy.rules.some(rule => rule.action === RetentionAction.DELETE);
        return hasMinRetention && hasEncryption && respectsDeletionRestriction;
    }
    initializeComplianceRequirements() {
        const requirements = [
            {
                name: 'SEC Rule 17a-4',
                jurisdiction: 'US',
                regulation: 'SEC Rule 17a-4',
                description: 'Securities and Exchange Commission record retention requirements',
                minRetentionPeriod: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years in milliseconds
                dataTypes: ['trading', 'portfolio_access', 'compliance'],
                deletionAllowed: false,
                archiveRequired: true,
                encryptionRequired: true,
                auditTrailRequired: true,
                geographicRestrictions: ['US']
            },
            {
                name: 'GDPR Article 5',
                jurisdiction: 'EU',
                regulation: 'GDPR',
                description: 'General Data Protection Regulation data retention principles',
                minRetentionPeriod: 0, // No minimum, but must be justified
                maxRetentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years max in most cases
                dataTypes: ['authentication', 'user_interaction'],
                deletionAllowed: true,
                archiveRequired: false,
                encryptionRequired: true,
                auditTrailRequired: true,
                geographicRestrictions: ['EU']
            },
            {
                name: 'SOX Section 404',
                jurisdiction: 'US',
                regulation: 'SOX',
                description: 'Sarbanes-Oxley Act internal control records',
                minRetentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
                dataTypes: ['system_admin', 'compliance', 'trading'],
                deletionAllowed: false,
                archiveRequired: true,
                encryptionRequired: true,
                auditTrailRequired: true,
                geographicRestrictions: ['US']
            }
        ];
        requirements.forEach(req => {
            const requirement = { id: (0, crypto_1.randomUUID)(), ...req };
            this.complianceRequirements.set(requirement.id, requirement);
        });
    }
    // Utility methods for compression, encryption, storage
    async compressData(data) {
        // Placeholder for actual compression
        const originalSize = JSON.stringify(data).length;
        const compressedSize = Math.round(originalSize * 0.7); // Simulated 30% compression
        return {
            data: { compressed: true, originalData: data },
            ratio: compressedSize / originalSize
        };
    }
    async decompressData(data) {
        // Placeholder for actual decompression
        return data.compressed ? data.originalData : data;
    }
    async encryptData(data) {
        const keyId = (0, crypto_1.randomUUID)();
        return {
            data: { encrypted: true, originalData: data, keyId },
            keyId
        };
    }
    async decryptData(data, keyId) {
        return data.encrypted && data.keyId === keyId ? data.originalData : data;
    }
    async calculateChecksum(data) {
        // Placeholder for actual checksum calculation
        return (0, crypto_1.randomUUID)();
    }
    async storeArchivedData(id, data, location) {
        // Placeholder for actual storage implementation
        console.log(`Storing ${id} to ${location}`);
    }
    async retrieveArchivedData(id, location) {
        // Placeholder for actual retrieval implementation
        return { id, location, data: {} };
    }
    hashValue(value) {
        // Placeholder for actual hashing
        return `hash_${value.length}_${(0, crypto_1.randomUUID)().substring(0, 8)}`;
    }
    anonymizeIP(ip) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.xxx.xxx`;
        }
        return 'xxx.xxx.xxx.xxx';
    }
    stop() {
        this.scheduledJobs.forEach(job => clearInterval(job));
        this.scheduledJobs = [];
    }
}
exports.ActivityRetentionService = ActivityRetentionService;

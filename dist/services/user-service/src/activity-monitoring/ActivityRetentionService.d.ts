import { EventEmitter } from 'events';
import { ActivityData } from './ActivityTrackingService';
export interface RetentionPolicy {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    rules: RetentionRule[];
    isActive: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
    appliedCount: number;
    lastApplied?: Date;
}
export interface RetentionRule {
    id: string;
    condition: RetentionCondition;
    action: RetentionAction;
    retentionPeriod: number;
    archiveLocation?: string;
    compressionEnabled: boolean;
    encryptionRequired: boolean;
    complianceTags: string[];
}
export interface RetentionCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'regex' | 'age_greater_than' | 'age_less_than';
    value: any;
}
export declare enum RetentionAction {
    DELETE = "delete",
    ARCHIVE = "archive",
    COMPRESS = "compress",
    ANONYMIZE = "anonymize",
    MIGRATE = "migrate",
    BACKUP = "backup"
}
export interface ArchiveEntry {
    id: string;
    activityId: string;
    tenantId: string;
    userId: string;
    originalData: ActivityData;
    archivedAt: Date;
    archiveLocation: string;
    compressionRatio?: number;
    encryptionKeyId?: string;
    retrievalCount: number;
    lastRetrieved?: Date;
    retentionPolicyId: string;
    complianceTags: string[];
    checksumHash: string;
}
export interface ComplianceRequirement {
    id: string;
    name: string;
    jurisdiction: 'US' | 'EU' | 'UK' | 'GLOBAL';
    regulation: string;
    description: string;
    minRetentionPeriod: number;
    maxRetentionPeriod?: number;
    dataTypes: string[];
    deletionAllowed: boolean;
    archiveRequired: boolean;
    encryptionRequired: boolean;
    auditTrailRequired: boolean;
    geographicRestrictions: string[];
}
export interface DataSubjectRequest {
    id: string;
    type: RequestType;
    userId: string;
    tenantId: string;
    requestedAt: Date;
    processedAt?: Date;
    status: RequestStatus;
    requestDetails: Record<string, any>;
    processingNotes: string[];
    affectedRecords: string[];
    verificationRequired: boolean;
    legalBasisValidated: boolean;
    completedBy?: string;
}
export declare enum RequestType {
    ACCESS = "access",// GDPR Article 15 - Right of access
    RECTIFICATION = "rectification",// GDPR Article 16 - Right to rectification
    ERASURE = "erasure",// GDPR Article 17 - Right to erasure
    PORTABILITY = "portability",// GDPR Article 20 - Right to data portability
    RESTRICTION = "restriction",// GDPR Article 18 - Right to restriction
    OBJECTION = "objection"
}
export declare enum RequestStatus {
    RECEIVED = "received",
    VERIFYING = "verifying",
    PROCESSING = "processing",
    COMPLETED = "completed",
    REJECTED = "rejected",
    ESCALATED = "escalated"
}
export interface RetentionJob {
    id: string;
    policyId: string;
    tenantId: string;
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: JobStatus;
    recordsProcessed: number;
    recordsArchived: number;
    recordsDeleted: number;
    errors: string[];
    progress: number;
}
export declare enum JobStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare class ActivityRetentionService extends EventEmitter {
    private retentionPolicies;
    private archivedData;
    private complianceRequirements;
    private dataSubjectRequests;
    private retentionJobs;
    private scheduledJobs;
    private compressionProvider;
    private encryptionProvider;
    private storageProvider;
    private getErrorMessage;
    constructor();
    createRetentionPolicy(policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt' | 'appliedCount'>): Promise<RetentionPolicy>;
    updateRetentionPolicy(policyId: string, updates: Partial<RetentionPolicy>): Promise<RetentionPolicy | null>;
    deleteRetentionPolicy(policyId: string): Promise<boolean>;
    applyRetentionPolicies(tenantId: string, activities: ActivityData[]): Promise<{
        processed: number;
        archived: number;
        deleted: number;
        errors: string[];
    }>;
    archiveActivity(activity: ActivityData, archiveLocation: string, policyId: string): Promise<ArchiveEntry>;
    retrieveArchivedActivity(archiveId: string): Promise<ActivityData | null>;
    processDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'requestedAt' | 'status' | 'processingNotes' | 'affectedRecords'>): Promise<DataSubjectRequest>;
    getRetentionPolicies(tenantId?: string): Promise<RetentionPolicy[]>;
    getArchivedActivities(filter?: {
        tenantId?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        policyId?: string;
    }): Promise<ArchiveEntry[]>;
    getRetentionStatistics(tenantId: string): Promise<{
        totalPolicies: number;
        activePolicies: number;
        archivedRecords: number;
        deletedRecords: number;
        storageUsed: number;
        compressionSavings: number;
        complianceStatus: Record<string, boolean>;
    }>;
    createRetentionJob(policyId: string, tenantId: string): Promise<RetentionJob>;
    private validatePolicyCompliance;
    private getApplicablePolicies;
    private activityMatchesPolicy;
    private evaluateRetentionCondition;
    private getNestedProperty;
    private applyPolicyToActivity;
    private executeRetentionAction;
    private deleteActivity;
    private anonymizeActivity;
    private compressActivity;
    private migrateActivity;
    private backupActivity;
    private canDeleteActivity;
    private processDataSubjectRequestAsync;
    private processAccessRequest;
    private processErasureRequest;
    private processPortabilityRequest;
    private executeRetentionJobAsync;
    private startRetentionScheduler;
    private checkScheduledRetention;
    private shouldRunPolicy;
    private checkComplianceStatus;
    private isPolicyCompliantWith;
    private initializeComplianceRequirements;
    private compressData;
    private decompressData;
    private encryptData;
    private decryptData;
    private calculateChecksum;
    private storeArchivedData;
    private retrieveArchivedData;
    private hashValue;
    private anonymizeIP;
    stop(): void;
}

import { EventEmitter } from 'events';
export interface ComplianceRecording {
    id: string;
    communicationId: string;
    tenantId: string;
    clientId: string;
    employeeId: string;
    recordingType: 'phone' | 'video' | 'screen_share' | 'meeting' | 'webinar';
    recordingStatus: 'active' | 'completed' | 'failed' | 'paused' | 'stopped';
    startTime: Date;
    endTime?: Date;
    duration: number;
    fileSize: number;
    storageLocation: string;
    encryptionKey: string;
    checksumHash: string;
    transcription?: {
        text: string;
        confidence: number;
        language: string;
        processedAt: Date;
        speakers: Array<{
            speakerId: string;
            name: string;
            duration: number;
            segments: Array<{
                text: string;
                startTime: number;
                endTime: number;
                confidence: number;
            }>;
        }>;
    };
    metadata: {
        audioCodec?: string;
        videoCodec?: string;
        bitrate?: number;
        resolution?: string;
        frameRate?: number;
        channels?: number;
        sampleRate?: number;
        deviceInfo?: Record<string, any>;
        networkInfo?: Record<string, any>;
    };
    retentionPolicy: {
        retentionPeriod: number;
        destructionDate: Date;
        legalHold: boolean;
        complianceFlags: string[];
    };
    accessLog: Array<{
        userId: string;
        action: 'view' | 'download' | 'share' | 'delete' | 'modify';
        timestamp: Date;
        ipAddress: string;
        userAgent: string;
        purpose: string;
    }>;
    complianceMetadata: {
        regulatoryRequirements: string[];
        recordingConsent: boolean;
        consentTimestamp?: Date;
        dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
        geographicRestrictions: string[];
        crossBorderTransfer: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface CompliancePolicy {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    isActive: boolean;
    scope: {
        communicationTypes: string[];
        clientTypes: string[];
        employeeRoles: string[];
        geographicRegions: string[];
    };
    recordingRules: {
        requireRecording: boolean;
        recordingTypes: string[];
        qualitySettings: {
            audioQuality: 'low' | 'medium' | 'high' | 'lossless';
            videoQuality: 'low' | 'medium' | 'high' | 'ultra';
            compressionLevel: number;
        };
        redundancy: {
            enableBackups: boolean;
            backupLocations: string[];
            realTimeReplication: boolean;
        };
    };
    retentionRules: {
        defaultRetentionDays: number;
        extendedRetentionTriggers: string[];
        automaticDeletion: boolean;
        legalHoldSupport: boolean;
    };
    consentRequirements: {
        explicitConsent: boolean;
        consentRecording: boolean;
        consentDocumentation: boolean;
        withdrawalProcess: boolean;
    };
    accessControls: {
        authorizedRoles: string[];
        approvalRequired: boolean;
        auditTrail: boolean;
        timeBasedAccess: boolean;
    };
    exportControls: {
        allowedFormats: string[];
        encryptionRequired: boolean;
        watermarking: boolean;
        downloadLimits: number;
    };
    regulatoryCompliance: {
        frameworks: string[];
        specificRules: Array<{
            framework: string;
            rule: string;
            requirement: string;
            implementation: string;
        }>;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface ComplianceAudit {
    id: string;
    tenantId: string;
    auditType: 'scheduled' | 'random' | 'triggered' | 'investigation';
    scope: {
        startDate: Date;
        endDate: Date;
        recordingIds?: string[];
        clientIds?: string[];
        employeeIds?: string[];
        communicationTypes?: string[];
    };
    findings: Array<{
        recordingId: string;
        findingType: 'missing_recording' | 'policy_violation' | 'retention_breach' | 'access_violation' | 'quality_issue';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        recommendation: string;
        status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
        assignedTo?: string;
        dueDate?: Date;
    }>;
    statistics: {
        totalRecordings: number;
        compliantRecordings: number;
        nonCompliantRecordings: number;
        complianceRate: number;
        avgRecordingQuality: number;
        avgRetentionCompliance: number;
    };
    recommendationsImplemented: Array<{
        recommendation: string;
        implementedAt: Date;
        implementedBy: string;
        effectivenessScore: number;
    }>;
    auditedBy: string;
    auditedAt: Date;
    completedAt?: Date;
    reportGenerated: boolean;
}
export interface ComplianceAlert {
    id: string;
    tenantId: string;
    alertType: 'policy_violation' | 'retention_expiry' | 'consent_missing' | 'access_anomaly' | 'quality_degradation' | 'storage_issue';
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    recordingId?: string;
    clientId?: string;
    employeeId?: string;
    triggerCondition: string;
    autoRemediation?: {
        enabled: boolean;
        actions: string[];
        executedAt?: Date;
        success?: boolean;
    };
    escalation: {
        level: number;
        escalatedTo?: string[];
        escalatedAt?: Date;
        acknowledgedBy?: string;
        acknowledgedAt?: Date;
    };
    resolution: {
        status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
        resolvedBy?: string;
        resolvedAt?: Date;
        resolution?: string;
        preventionMeasures?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface RecordingSession {
    id: string;
    communicationId: string;
    tenantId: string;
    sessionType: 'phone' | 'video' | 'screen_share' | 'meeting' | 'webinar';
    participants: Array<{
        id: string;
        name: string;
        role: 'client' | 'employee' | 'third_party';
        phoneNumber?: string;
        email?: string;
        joinedAt: Date;
        leftAt?: Date;
        consentGiven: boolean;
        consentTimestamp?: Date;
    }>;
    recordingStreams: Array<{
        streamId: string;
        type: 'audio' | 'video' | 'screen' | 'chat';
        codec: string;
        bitrate: number;
        quality: string;
        startTime: Date;
        endTime?: Date;
        fileSize: number;
        storageLocation: string;
    }>;
    status: 'initializing' | 'active' | 'paused' | 'stopped' | 'processing' | 'completed' | 'failed';
    qualityMetrics: {
        averageAudioQuality: number;
        averageVideoQuality: number;
        packetLoss: number;
        latency: number;
        jitter: number;
        dropouts: number;
    };
    technicalIssues: Array<{
        timestamp: Date;
        issueType: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
        resolved: boolean;
        resolution?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ComplianceRecordingConfig {
    enableRecording: boolean;
    defaultRetentionDays: number;
    encryptionEnabled: boolean;
    transcriptionEnabled: boolean;
    realTimeTranscription: boolean;
    qualityMonitoring: boolean;
    consentValidation: boolean;
    storageRedundancy: number;
    compressionLevel: number;
    maxFileSize: number;
    allowedCodecs: string[];
    geographicRestrictions: string[];
    auditFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    alertThresholds: {
        diskSpaceWarning: number;
        qualityDegradation: number;
        retentionExpiry: number;
        consentExpiry: number;
    };
    integrations: {
        storageProviders: string[];
        transcriptionServices: string[];
        archivalSystems: string[];
        complianceTools: string[];
    };
}
export declare class ComplianceRecordingService extends EventEmitter {
    private config;
    private activeRecordings;
    private compliancePolicies;
    private auditHistory;
    private alertQueue;
    private recordingStorage;
    private monitoringIntervals;
    constructor(config: ComplianceRecordingConfig);
    private initializeMonitoring;
    startRecordingSession(communicationId: string, tenantId: string, sessionType: RecordingSession['sessionType'], participants: RecordingSession['participants']): Promise<RecordingSession>;
    stopRecordingSession(sessionId: string, reason?: string): Promise<ComplianceRecording>;
    pauseRecording(sessionId: string): Promise<void>;
    resumeRecording(sessionId: string): Promise<void>;
    createCompliancePolicy(tenantId: string, policyData: Omit<CompliancePolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompliancePolicy>;
    updateCompliancePolicy(policyId: string, updates: Partial<CompliancePolicy>): Promise<CompliancePolicy>;
    performComplianceAudit(tenantId: string, auditType: ComplianceAudit['auditType'], scope: ComplianceAudit['scope']): Promise<ComplianceAudit>;
    generateComplianceReport(tenantId: string, reportType: 'audit' | 'retention' | 'access' | 'quality' | 'comprehensive', period: {
        start: Date;
        end: Date;
    }, options?: {
        includeRecommendations?: boolean;
        includeCharts?: boolean;
        exportFormat?: 'pdf' | 'excel' | 'json';
    }): Promise<{
        reportId: string;
        reportData: any;
        exportUrl?: string;
    }>;
    searchRecordings(tenantId: string, criteria: {
        clientIds?: string[];
        employeeIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        recordingTypes?: string[];
        transcriptionText?: string;
        complianceFlags?: string[];
        retentionStatus?: 'active' | 'expiring' | 'expired';
        accessLevel?: string;
    }): Promise<ComplianceRecording[]>;
    extendRetentionPeriod(recordingId: string, additionalDays: number, reason: string, requestedBy: string): Promise<void>;
    placeRecordingOnLegalHold(recordingId: string, reason: string, requestedBy: string): Promise<void>;
    removeRecordingFromLegalHold(recordingId: string, reason: string, requestedBy: string): Promise<void>;
    private performComplianceMonitoring;
    private monitorRecordingRetention;
    private monitorRecordingQuality;
    private getApplicablePolicy;
    private validateParticipantConsent;
    private initializeRecordingStreams;
    private stopRecordingStreams;
    private pauseRecordingStreams;
    private resumeRecordingStreams;
    private finalizeRecording;
    private getRecordingsInScope;
    private auditRecording;
    private calculateAverageQuality;
    private calculateRetentionCompliance;
    private getRecordingsByPeriod;
    private generateAuditReport;
    private generateRetentionReport;
    private generateAccessReport;
    private generateQualityReport;
    private generateComplianceRecommendations;
    private exportReport;
    private createAlert;
    private checkPolicyViolations;
    private monitorStorageCapacity;
    private checkConsentExpiry;
    private monitorAccessPatterns;
    private deleteExpiredRecording;
    private assessRecordingQuality;
    shutdown(): Promise<void>;
}

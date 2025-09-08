"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceRecordingService = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
class ComplianceRecordingService extends events_1.EventEmitter {
    config;
    activeRecordings = new Map();
    compliancePolicies = new Map();
    auditHistory = new Map();
    alertQueue = [];
    recordingStorage = new Map();
    monitoringIntervals = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeMonitoring();
    }
    initializeMonitoring() {
        // Start periodic compliance monitoring
        const monitoringInterval = setInterval(() => {
            this.performComplianceMonitoring();
        }, 1000 * 60 * 15); // Every 15 minutes
        this.monitoringIntervals.set('compliance', monitoringInterval);
        // Start retention monitoring
        const retentionInterval = setInterval(() => {
            this.monitorRecordingRetention();
        }, 1000 * 60 * 60 * 24); // Daily
        this.monitoringIntervals.set('retention', retentionInterval);
        // Start quality monitoring
        const qualityInterval = setInterval(() => {
            this.monitorRecordingQuality();
        }, 1000 * 60 * 5); // Every 5 minutes
        this.monitoringIntervals.set('quality', qualityInterval);
    }
    async startRecordingSession(communicationId, tenantId, sessionType, participants) {
        // Validate compliance policy
        const policy = await this.getApplicablePolicy(tenantId, sessionType, participants);
        if (!policy || !policy.recordingRules.requireRecording) {
            throw new Error('Recording not required or policy not found');
        }
        // Validate consent
        await this.validateParticipantConsent(participants, policy);
        const sessionId = (0, crypto_1.randomUUID)();
        const session = {
            id: sessionId,
            communicationId,
            tenantId,
            sessionType,
            participants: participants.map(p => ({
                ...p,
                joinedAt: new Date(),
                consentGiven: true,
                consentTimestamp: new Date()
            })),
            recordingStreams: [],
            status: 'initializing',
            qualityMetrics: {
                averageAudioQuality: 0,
                averageVideoQuality: 0,
                packetLoss: 0,
                latency: 0,
                jitter: 0,
                dropouts: 0
            },
            technicalIssues: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.activeRecordings.set(sessionId, session);
        // Initialize recording streams
        await this.initializeRecordingStreams(session, policy);
        // Start recording
        session.status = 'active';
        session.updatedAt = new Date();
        this.emit('recordingStarted', {
            sessionId,
            communicationId,
            tenantId,
            participants: participants.length
        });
        return session;
    }
    async stopRecordingSession(sessionId, reason) {
        const session = this.activeRecordings.get(sessionId);
        if (!session) {
            throw new Error(`Recording session ${sessionId} not found`);
        }
        session.status = 'stopped';
        session.updatedAt = new Date();
        // Stop all recording streams
        await this.stopRecordingStreams(session);
        // Process and finalize recording
        const recording = await this.finalizeRecording(session, reason);
        // Remove from active recordings
        this.activeRecordings.delete(sessionId);
        // Store compliance recording
        this.recordingStorage.set(recording.id, recording);
        this.emit('recordingStopped', {
            sessionId,
            recordingId: recording.id,
            duration: recording.duration,
            fileSize: recording.fileSize
        });
        return recording;
    }
    async pauseRecording(sessionId) {
        const session = this.activeRecordings.get(sessionId);
        if (!session) {
            throw new Error(`Recording session ${sessionId} not found`);
        }
        if (session.status !== 'active') {
            throw new Error(`Cannot pause recording in ${session.status} state`);
        }
        session.status = 'paused';
        session.updatedAt = new Date();
        await this.pauseRecordingStreams(session);
        this.emit('recordingPaused', { sessionId });
    }
    async resumeRecording(sessionId) {
        const session = this.activeRecordings.get(sessionId);
        if (!session) {
            throw new Error(`Recording session ${sessionId} not found`);
        }
        if (session.status !== 'paused') {
            throw new Error(`Cannot resume recording in ${session.status} state`);
        }
        session.status = 'active';
        session.updatedAt = new Date();
        await this.resumeRecordingStreams(session);
        this.emit('recordingResumed', { sessionId });
    }
    async createCompliancePolicy(tenantId, policyData) {
        const policy = {
            id: (0, crypto_1.randomUUID)(),
            ...policyData,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.compliancePolicies.set(policy.id, policy);
        this.emit('policyCreated', { policyId: policy.id, tenantId });
        return policy;
    }
    async updateCompliancePolicy(policyId, updates) {
        const policy = this.compliancePolicies.get(policyId);
        if (!policy) {
            throw new Error(`Compliance policy ${policyId} not found`);
        }
        const updatedPolicy = {
            ...policy,
            ...updates,
            updatedAt: new Date()
        };
        this.compliancePolicies.set(policyId, updatedPolicy);
        this.emit('policyUpdated', { policyId, tenantId: policy.tenantId });
        return updatedPolicy;
    }
    async performComplianceAudit(tenantId, auditType, scope) {
        const auditId = (0, crypto_1.randomUUID)();
        const recordings = await this.getRecordingsInScope(tenantId, scope);
        const findings = [];
        let compliantCount = 0;
        for (const recording of recordings) {
            const issues = await this.auditRecording(recording);
            if (issues.length === 0) {
                compliantCount++;
            }
            else {
                findings.push(...issues);
            }
        }
        const audit = {
            id: auditId,
            tenantId,
            auditType,
            scope,
            findings,
            statistics: {
                totalRecordings: recordings.length,
                compliantRecordings: compliantCount,
                nonCompliantRecordings: recordings.length - compliantCount,
                complianceRate: recordings.length > 0 ? (compliantCount / recordings.length) * 100 : 0,
                avgRecordingQuality: await this.calculateAverageQuality(recordings),
                avgRetentionCompliance: await this.calculateRetentionCompliance(recordings)
            },
            recommendationsImplemented: [],
            auditedBy: 'system',
            auditedAt: new Date(),
            reportGenerated: false
        };
        this.auditHistory.set(auditId, audit);
        this.emit('auditCompleted', {
            auditId,
            tenantId,
            complianceRate: audit.statistics.complianceRate,
            findingsCount: findings.length
        });
        return audit;
    }
    async generateComplianceReport(tenantId, reportType, period, options) {
        const reportId = (0, crypto_1.randomUUID)();
        const recordings = await this.getRecordingsByPeriod(tenantId, period);
        let reportData = {
            reportId,
            tenantId,
            reportType,
            period,
            generatedAt: new Date(),
            summary: {
                totalRecordings: recordings.length,
                totalDuration: recordings.reduce((sum, r) => sum + r.duration, 0),
                totalStorage: recordings.reduce((sum, r) => sum + r.fileSize, 0),
                avgQuality: recordings.length > 0 ?
                    recordings.reduce((sum, r) => sum + (r.metadata.bitrate || 0), 0) / recordings.length : 0
            }
        };
        switch (reportType) {
            case 'audit':
                reportData.auditDetails = await this.generateAuditReport(recordings);
                break;
            case 'retention':
                reportData.retentionDetails = await this.generateRetentionReport(recordings);
                break;
            case 'access':
                reportData.accessDetails = await this.generateAccessReport(recordings);
                break;
            case 'quality':
                reportData.qualityDetails = await this.generateQualityReport(recordings);
                break;
            case 'comprehensive':
                reportData.auditDetails = await this.generateAuditReport(recordings);
                reportData.retentionDetails = await this.generateRetentionReport(recordings);
                reportData.accessDetails = await this.generateAccessReport(recordings);
                reportData.qualityDetails = await this.generateQualityReport(recordings);
                break;
        }
        if (options?.includeRecommendations) {
            reportData.recommendations = await this.generateComplianceRecommendations(recordings);
        }
        this.emit('reportGenerated', { reportId, tenantId, reportType });
        return {
            reportId,
            reportData,
            exportUrl: options?.exportFormat ? await this.exportReport(reportData, options.exportFormat) : undefined
        };
    }
    async searchRecordings(tenantId, criteria) {
        const allRecordings = Array.from(this.recordingStorage.values())
            .filter(r => r.tenantId === tenantId);
        let filteredRecordings = allRecordings;
        if (criteria.clientIds?.length) {
            filteredRecordings = filteredRecordings.filter(r => criteria.clientIds.includes(r.clientId));
        }
        if (criteria.employeeIds?.length) {
            filteredRecordings = filteredRecordings.filter(r => criteria.employeeIds.includes(r.employeeId));
        }
        if (criteria.dateRange) {
            filteredRecordings = filteredRecordings.filter(r => r.startTime >= criteria.dateRange.start &&
                r.startTime <= criteria.dateRange.end);
        }
        if (criteria.recordingTypes?.length) {
            filteredRecordings = filteredRecordings.filter(r => criteria.recordingTypes.includes(r.recordingType));
        }
        if (criteria.transcriptionText) {
            filteredRecordings = filteredRecordings.filter(r => r.transcription?.text.toLowerCase().includes(criteria.transcriptionText.toLowerCase()));
        }
        if (criteria.complianceFlags?.length) {
            filteredRecordings = filteredRecordings.filter(r => criteria.complianceFlags.some(flag => r.retentionPolicy.complianceFlags.includes(flag)));
        }
        if (criteria.retentionStatus) {
            const now = new Date();
            filteredRecordings = filteredRecordings.filter(r => {
                const daysUntilDestruction = Math.ceil((r.retentionPolicy.destructionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                switch (criteria.retentionStatus) {
                    case 'active':
                        return daysUntilDestruction > 30;
                    case 'expiring':
                        return daysUntilDestruction <= 30 && daysUntilDestruction > 0;
                    case 'expired':
                        return daysUntilDestruction <= 0;
                    default:
                        return true;
                }
            });
        }
        return filteredRecordings;
    }
    async extendRetentionPeriod(recordingId, additionalDays, reason, requestedBy) {
        const recording = this.recordingStorage.get(recordingId);
        if (!recording) {
            throw new Error(`Recording ${recordingId} not found`);
        }
        const originalDestructionDate = recording.retentionPolicy.destructionDate;
        recording.retentionPolicy.destructionDate = new Date(originalDestructionDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
        recording.retentionPolicy.retentionPeriod += additionalDays;
        recording.updatedAt = new Date();
        // Log the retention extension
        recording.accessLog.push({
            userId: requestedBy,
            action: 'modify',
            timestamp: new Date(),
            ipAddress: 'system',
            userAgent: 'ComplianceRecordingService',
            purpose: `Retention extended by ${additionalDays} days: ${reason}`
        });
        this.emit('retentionExtended', {
            recordingId,
            originalDate: originalDestructionDate,
            newDate: recording.retentionPolicy.destructionDate,
            reason,
            requestedBy
        });
    }
    async placeRecordingOnLegalHold(recordingId, reason, requestedBy) {
        const recording = this.recordingStorage.get(recordingId);
        if (!recording) {
            throw new Error(`Recording ${recordingId} not found`);
        }
        recording.retentionPolicy.legalHold = true;
        recording.retentionPolicy.complianceFlags.push('LEGAL_HOLD');
        recording.updatedAt = new Date();
        // Log the legal hold placement
        recording.accessLog.push({
            userId: requestedBy,
            action: 'modify',
            timestamp: new Date(),
            ipAddress: 'system',
            userAgent: 'ComplianceRecordingService',
            purpose: `Legal hold placed: ${reason}`
        });
        this.emit('legalHoldPlaced', { recordingId, reason, requestedBy });
    }
    async removeRecordingFromLegalHold(recordingId, reason, requestedBy) {
        const recording = this.recordingStorage.get(recordingId);
        if (!recording) {
            throw new Error(`Recording ${recordingId} not found`);
        }
        recording.retentionPolicy.legalHold = false;
        recording.retentionPolicy.complianceFlags = recording.retentionPolicy.complianceFlags
            .filter(flag => flag !== 'LEGAL_HOLD');
        recording.updatedAt = new Date();
        // Log the legal hold removal
        recording.accessLog.push({
            userId: requestedBy,
            action: 'modify',
            timestamp: new Date(),
            ipAddress: 'system',
            userAgent: 'ComplianceRecordingService',
            purpose: `Legal hold removed: ${reason}`
        });
        this.emit('legalHoldRemoved', { recordingId, reason, requestedBy });
    }
    async performComplianceMonitoring() {
        try {
            // Check for policy violations
            await this.checkPolicyViolations();
            // Monitor storage capacity
            await this.monitorStorageCapacity();
            // Check consent expiry
            await this.checkConsentExpiry();
            // Monitor access patterns
            await this.monitorAccessPatterns();
            this.emit('complianceMonitoringCompleted', { timestamp: new Date() });
        }
        catch (error) {
            this.emit('complianceMonitoringError', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async monitorRecordingRetention() {
        try {
            const now = new Date();
            const expiringRecordings = Array.from(this.recordingStorage.values())
                .filter(r => {
                const daysUntilDestruction = Math.ceil((r.retentionPolicy.destructionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilDestruction <= this.config.alertThresholds.retentionExpiry &&
                    daysUntilDestruction > 0 &&
                    !r.retentionPolicy.legalHold;
            });
            for (const recording of expiringRecordings) {
                await this.createAlert({
                    tenantId: recording.tenantId,
                    alertType: 'retention_expiry',
                    severity: 'warning',
                    title: 'Recording Retention Expiring',
                    description: `Recording ${recording.id} will be automatically deleted on ${recording.retentionPolicy.destructionDate.toISOString()}`,
                    recordingId: recording.id,
                    triggerCondition: 'retention_period_expiring'
                });
            }
            // Auto-delete expired recordings not on legal hold
            const expiredRecordings = Array.from(this.recordingStorage.values())
                .filter(r => r.retentionPolicy.destructionDate <= now &&
                !r.retentionPolicy.legalHold);
            for (const recording of expiredRecordings) {
                await this.deleteExpiredRecording(recording);
            }
            this.emit('retentionMonitoringCompleted', {
                expiringCount: expiringRecordings.length,
                deletedCount: expiredRecordings.length
            });
        }
        catch (error) {
            this.emit('retentionMonitoringError', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async monitorRecordingQuality() {
        try {
            const activeRecordings = Array.from(this.activeRecordings.values());
            for (const session of activeRecordings) {
                const qualityIssues = await this.assessRecordingQuality(session);
                if (qualityIssues.length > 0) {
                    for (const issue of qualityIssues) {
                        await this.createAlert({
                            tenantId: session.tenantId,
                            alertType: 'quality_degradation',
                            severity: issue.severity === 'high' ? 'error' : 'warning',
                            title: 'Recording Quality Issue',
                            description: issue.description,
                            recordingId: session.id,
                            triggerCondition: 'quality_threshold_exceeded'
                        });
                    }
                }
            }
            this.emit('qualityMonitoringCompleted', {
                sessionsMonitored: activeRecordings.length
            });
        }
        catch (error) {
            this.emit('qualityMonitoringError', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    // Private helper methods - mock implementations
    async getApplicablePolicy(tenantId, sessionType, participants) {
        // Mock implementation
        return Array.from(this.compliancePolicies.values())
            .find(p => p.tenantId === tenantId && p.isActive) || null;
    }
    async validateParticipantConsent(participants, policy) {
        // Mock implementation
        if (policy.consentRequirements.explicitConsent) {
            for (const participant of participants) {
                if (!participant.consentGiven) {
                    throw new Error(`Explicit consent required for participant ${participant.id}`);
                }
            }
        }
    }
    async initializeRecordingStreams(session, policy) {
        // Mock implementation - initialize recording streams based on policy
    }
    async stopRecordingStreams(session) {
        // Mock implementation
    }
    async pauseRecordingStreams(session) {
        // Mock implementation
    }
    async resumeRecordingStreams(session) {
        // Mock implementation
    }
    async finalizeRecording(session, reason) {
        const recording = {
            id: (0, crypto_1.randomUUID)(),
            communicationId: session.communicationId,
            tenantId: session.tenantId,
            clientId: session.participants.find(p => p.role === 'client')?.id || '',
            employeeId: session.participants.find(p => p.role === 'employee')?.id || '',
            recordingType: session.sessionType,
            recordingStatus: 'completed',
            startTime: session.createdAt,
            endTime: new Date(),
            duration: Math.floor((Date.now() - session.createdAt.getTime()) / 1000),
            fileSize: 1024 * 1024 * 100, // Mock 100MB
            storageLocation: `/recordings/${session.tenantId}/${session.id}`,
            encryptionKey: (0, crypto_1.randomUUID)(),
            checksumHash: (0, crypto_1.randomUUID)(),
            metadata: {
                audioCodec: 'AAC',
                videoCodec: 'H.264',
                bitrate: 128000,
                resolution: '1920x1080',
                frameRate: 30,
                channels: 2,
                sampleRate: 44100
            },
            retentionPolicy: {
                retentionPeriod: this.config.defaultRetentionDays,
                destructionDate: new Date(Date.now() + (this.config.defaultRetentionDays * 24 * 60 * 60 * 1000)),
                legalHold: false,
                complianceFlags: ['FINRA_COMPLIANT']
            },
            accessLog: [],
            complianceMetadata: {
                regulatoryRequirements: ['FINRA Rule 3110'],
                recordingConsent: true,
                consentTimestamp: session.createdAt,
                dataClassification: 'confidential',
                geographicRestrictions: [],
                crossBorderTransfer: false
            },
            createdAt: session.createdAt,
            updatedAt: new Date()
        };
        return recording;
    }
    async getRecordingsInScope(tenantId, scope) {
        // Mock implementation
        return Array.from(this.recordingStorage.values())
            .filter(r => r.tenantId === tenantId);
    }
    async auditRecording(recording) {
        // Mock implementation
        return [];
    }
    async calculateAverageQuality(recordings) {
        // Mock implementation
        return 85.5;
    }
    async calculateRetentionCompliance(recordings) {
        // Mock implementation
        return 92.3;
    }
    async getRecordingsByPeriod(tenantId, period) {
        // Mock implementation
        return Array.from(this.recordingStorage.values())
            .filter(r => r.tenantId === tenantId);
    }
    async generateAuditReport(recordings) {
        // Mock implementation
        return { complianceScore: 95.5, totalFindings: 3 };
    }
    async generateRetentionReport(recordings) {
        // Mock implementation
        return { avgRetentionDays: 2555, expiringSoon: 12 };
    }
    async generateAccessReport(recordings) {
        // Mock implementation
        return { totalAccesses: 145, suspiciousActivity: 0 };
    }
    async generateQualityReport(recordings) {
        // Mock implementation
        return { avgQuality: 87.2, qualityIssues: 5 };
    }
    async generateComplianceRecommendations(recordings) {
        // Mock implementation
        return [
            'Implement automated quality monitoring',
            'Review retention policies for optimization',
            'Enhance access control mechanisms'
        ];
    }
    async exportReport(reportData, format) {
        // Mock implementation
        return `/exports/compliance_report_${Date.now()}.${format}`;
    }
    async createAlert(alertData) {
        const alert = {
            id: (0, crypto_1.randomUUID)(),
            ...alertData,
            escalation: { level: 1 },
            resolution: { status: 'open' },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.alertQueue.push(alert);
        this.emit('alertCreated', alert);
    }
    async checkPolicyViolations() {
        // Mock implementation
    }
    async monitorStorageCapacity() {
        // Mock implementation
    }
    async checkConsentExpiry() {
        // Mock implementation
    }
    async monitorAccessPatterns() {
        // Mock implementation
    }
    async deleteExpiredRecording(recording) {
        this.recordingStorage.delete(recording.id);
        this.emit('recordingDeleted', {
            recordingId: recording.id,
            reason: 'retention_expired'
        });
    }
    async assessRecordingQuality(session) {
        // Mock implementation
        return [];
    }
    async shutdown() {
        // Clear all intervals
        this.monitoringIntervals.forEach((interval, key) => {
            clearInterval(interval);
        });
        this.monitoringIntervals.clear();
        // Stop all active recordings
        for (const [sessionId] of this.activeRecordings) {
            try {
                await this.stopRecordingSession(sessionId, 'service_shutdown');
            }
            catch (error) {
                console.error(`Error stopping recording ${sessionId}:`, error);
            }
        }
        this.emit('complianceRecordingShutdown');
    }
}
exports.ComplianceRecordingService = ComplianceRecordingService;

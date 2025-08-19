import { EventEmitter } from 'events';
export interface DataRecoveryConfig {
    recoveryId: string;
    organizationId: string;
    recoveryObjectives: {
        rtoMinutes: number;
        rpoMinutes: number;
    };
    dataTypes: {
        transactionData: DataTypeConfig;
        positionData: DataTypeConfig;
        clientData: DataTypeConfig;
        marketData: DataTypeConfig;
        documentData: DataTypeConfig;
        auditLogs: DataTypeConfig;
    };
    backupSources: BackupSource[];
    recoveryProcedures: RecoveryProcedure[];
    validation: ValidationConfig;
    compliance: ComplianceConfig;
}
export interface DataTypeConfig {
    name: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    retentionPeriod: string;
    archivalPolicy: string;
    deletionPolicy: string;
    pointInTimeRecovery: boolean;
    backupFrequency: string;
    encryptionRequired: boolean;
    complianceRequirements: string[];
}
export interface BackupSource {
    sourceId: string;
    name: string;
    type: 'database' | 'filesystem' | 'object-storage' | 'cache';
    connectionString: string;
    backupPath: string;
    compressionType: 'gzip' | 'bzip2' | 'lz4' | 'none';
    encryptionKey?: string;
    verificationMethod: 'checksum' | 'test-restore' | 'integrity-check';
}
export interface RecoveryProcedure {
    procedureId: string;
    name: string;
    scenario: string;
    steps: RecoveryStep[];
    estimatedDuration: number;
    prerequisites: string[];
    rollbackPlan: RecoveryStep[];
    validationSteps: ValidationStep[];
}
export interface RecoveryStep {
    stepNumber: number;
    description: string;
    action: string;
    timeout: number;
    dependencies: number[];
    rollbackAction: string;
    verification: string;
    automationScript?: string;
}
export interface ValidationStep {
    stepNumber: number;
    description: string;
    validationType: 'data-integrity' | 'business-logic' | 'compliance' | 'performance';
    expectedResult: string;
    tolerance: string;
    automatedCheck: boolean;
}
export interface ValidationConfig {
    dataIntegrityChecks: IntegrityCheck[];
    businessLogicValidation: BusinessValidation[];
    complianceVerification: ComplianceCheck[];
    performanceBaseline: PerformanceBaseline;
}
export interface IntegrityCheck {
    checkId: string;
    name: string;
    dataType: string;
    checkType: 'row-count' | 'checksum' | 'foreign-key' | 'business-rule';
    query: string;
    expectedResult: any;
    tolerance: number;
}
export interface BusinessValidation {
    validationId: string;
    name: string;
    description: string;
    businessRule: string;
    validationQuery: string;
    criticalityLevel: 'critical' | 'high' | 'medium' | 'low';
}
export interface ComplianceCheck {
    checkId: string;
    regulation: string;
    requirement: string;
    validationMethod: string;
    frequency: string;
    evidenceRequired: string[];
}
export interface PerformanceBaseline {
    queryResponseTime: number;
    transactionThroughput: number;
    systemAvailability: number;
    dataConsistency: number;
}
export interface ComplianceConfig {
    regulations: string[];
    auditRequirements: string[];
    retentionPolicies: RetentionPolicy[];
    legalHolds: LegalHold[];
    dataClassification: DataClassification[];
}
export interface RetentionPolicy {
    policyId: string;
    dataType: string;
    retentionPeriod: string;
    archivalTrigger: string;
    deletionTrigger: string;
    legalHoldOverride: boolean;
    auditTrail: boolean;
}
export interface LegalHold {
    holdId: string;
    caseNumber: string;
    description: string;
    startDate: Date;
    endDate: Date | null;
    dataTypes: string[];
    preservationScope: string;
}
export interface DataClassification {
    classificationId: string;
    dataType: string;
    sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
    handlingRequirements: string[];
    encryptionRequired: boolean;
}
export interface RecoveryResult {
    recoveryId: string;
    procedureId: string;
    startTime: Date;
    endTime: Date;
    success: boolean;
    rtoAchieved: number;
    rpoAchieved: number;
    dataIntegrityScore: number;
    validationResults: ValidationResult[];
    issues: RecoveryIssue[];
    complianceStatus: ComplianceStatus;
}
export interface ValidationResult {
    stepNumber: number;
    validationType: string;
    passed: boolean;
    actualResult: any;
    expectedResult: any;
    variance: number;
    notes: string;
}
export interface RecoveryIssue {
    issueId: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'data-integrity' | 'performance' | 'compliance' | 'system';
    description: string;
    impact: string;
    resolution: string;
    resolved: boolean;
}
export interface ComplianceStatus {
    compliant: boolean;
    violations: ComplianceViolation[];
    attestations: ComplianceAttestation[];
    auditTrail: AuditEntry[];
}
export interface ComplianceViolation {
    violationId: string;
    regulation: string;
    requirement: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    remediationRequired: boolean;
    timeline: string;
}
export interface ComplianceAttestation {
    attestationId: string;
    regulation: string;
    attestedBy: string;
    attestationDate: Date;
    statement: string;
    evidence: string[];
}
export interface AuditEntry {
    entryId: string;
    timestamp: Date;
    userId: string;
    action: string;
    dataType: string;
    details: any;
    ipAddress: string;
    userAgent: string;
}
export declare class FinancialDataRecoveryManager extends EventEmitter {
    private config;
    private recoveryId;
    private isRecoveryInProgress;
    constructor(config: DataRecoveryConfig);
    executePointInTimeRecovery(targetDateTime: Date, dataTypes: string[], validationRequired?: boolean): Promise<RecoveryResult>;
    executeFullDataRecovery(scenario: string, validationLevel?: 'basic' | 'comprehensive'): Promise<RecoveryResult>;
    validateBackupIntegrity(backupId: string): Promise<{
        valid: boolean;
        checks: IntegrityCheckResult[];
        issues: string[];
    }>;
    generateRecoveryReport(recoveryResult: RecoveryResult, includeCompliance?: boolean): Promise<string>;
    testRecoveryProcedures(): Promise<{
        totalProcedures: number;
        successfulTests: number;
        failedTests: number;
        results: any[];
    }>;
    private validateRecoveryRequest;
    private createRecoveryWorkspace;
    private restoreToPointInTime;
    private validateRestoredData;
    private performComplianceChecks;
    private calculateRPO;
    private calculateCurrentRPO;
    private calculateDataIntegrityScore;
    private executeRecoveryStep;
    private performValidation;
    private performIntegrityCheck;
    private performValidationCheck;
    private performComplianceCheck;
    private performValidationStep;
    private testRecoveryProcedure;
    private generateRecommendations;
    private logRecoveryResult;
    getRecoveryStatus(): {
        inProgress: boolean;
        recoveryId: string;
        config: DataRecoveryConfig;
    };
}
interface IntegrityCheckResult {
    checkId: string;
    passed: boolean;
    actualResult: any;
    expectedResult: any;
    details: string;
}
export {};

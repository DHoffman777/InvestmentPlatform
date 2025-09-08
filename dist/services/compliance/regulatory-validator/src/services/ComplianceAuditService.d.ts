import { EventEmitter } from 'events';
import { ComplianceAuditTrail, ComplianceException, RegulatoryAlert, ComplianceValidationResult, RegulatoryValidatorConfig } from '../types';
export declare class ComplianceAuditService extends EventEmitter {
    private config;
    private redis;
    private auditBuffer;
    private alertBuffer;
    private flushInterval?;
    constructor(config: RegulatoryValidatorConfig);
    private startAuditBufferFlush;
    recordAuditEvent(entityType: string, entityId: string, eventType: 'VALIDATION' | 'RULE_UPDATE' | 'EXCEPTION' | 'REMEDIATION' | 'REVIEW', eventDetails: {
        action: string;
        oldValue?: any;
        newValue?: any;
        triggeredBy: string;
        reason?: string;
    }, complianceStatus: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<any>;
    recordValidationAudit(result: ComplianceValidationResult, triggeredBy: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<any>;
    createException(exception: Omit<ComplianceException, 'id'>): Promise<ComplianceException>;
    updateException(exceptionId: string, updates: Partial<ComplianceException>, updatedBy: string): Promise<ComplianceException | null>;
    getException(exceptionId: string): Promise<ComplianceException | null>;
    getEntityExceptions(entityType: string, entityId: string): Promise<ComplianceException[]>;
    getRuleExceptions(ruleId: string): Promise<ComplianceException[]>;
    createAlert(alertData: Omit<RegulatoryAlert, 'id' | 'timestamp' | 'status' | 'escalationLevel'>): Promise<RegulatoryAlert>;
    updateAlert(alertId: string, updates: Partial<RegulatoryAlert>, updatedBy: string): Promise<RegulatoryAlert | null>;
    getAlert(alertId: string): Promise<RegulatoryAlert | null>;
    getEntityAlerts(entityType: string, entityId: string): Promise<RegulatoryAlert[]>;
    getOpenAlerts(): Promise<RegulatoryAlert[]>;
    getAuditTrail(entityType?: string, entityId?: string, eventType?: string, startDate?: Date, endDate?: Date, limit?: number): Promise<ComplianceAuditTrail[]>;
    private flushAuditBuffer;
    private flushAlertBuffer;
    private sendAlertNotifications;
    private generateAuditId;
    private generateExceptionId;
    private generateAlertId;
    private calculateRetentionDate;
    getComplianceMetrics(startDate: Date, endDate: Date): Promise<{
        totalValidations: number;
        complianceRate: number;
        criticalViolations: number;
        activeExceptions: number;
        openAlerts: number;
        auditEvents: number;
    }>;
    cleanup(): Promise<any>;
}

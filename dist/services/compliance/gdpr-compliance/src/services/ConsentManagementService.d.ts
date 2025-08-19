import { EventEmitter } from 'events';
import { ConsentRecord, GDPRComplianceConfig } from '../types';
export declare class ConsentManagementService extends EventEmitter {
    private config;
    private redis;
    constructor(config: GDPRComplianceConfig);
    recordConsent(dataSubjectId: string, consentData: {
        purposes: string[];
        dataCategories: string[];
        consentText: string;
        consentMethod: 'WEB_FORM' | 'EMAIL' | 'PHONE' | 'PAPER' | 'API';
        ipAddress?: string;
        userAgent?: string;
        location?: string;
        parentalConsent?: boolean;
    }): Promise<ConsentRecord>;
    withdrawConsent(dataSubjectId: string, consentId: string, withdrawalReason?: string): Promise<boolean>;
    updateConsent(dataSubjectId: string, consentId: string, updates: {
        purposes?: string[];
        dataCategories?: string[];
        consentText?: string;
    }): Promise<ConsentRecord>;
    getConsentRecord(consentId: string): Promise<ConsentRecord | null>;
    getDataSubjectConsents(dataSubjectId: string): Promise<ConsentRecord[]>;
    getActiveConsents(dataSubjectId: string): Promise<ConsentRecord[]>;
    checkConsentForPurpose(dataSubjectId: string, purpose: string): Promise<{
        hasConsent: boolean;
        consentRecord?: ConsentRecord;
        reason?: string;
    }>;
    checkConsentForDataCategory(dataSubjectId: string, dataCategory: string): Promise<{
        hasConsent: boolean;
        consentRecord?: ConsentRecord;
        reason?: string;
    }>;
    getExpiredConsents(daysBeforeExpiry?: number): Promise<ConsentRecord[]>;
    renewConsent(dataSubjectId: string, consentId: string, renewalData: {
        consentText: string;
        ipAddress?: string;
        userAgent?: string;
        location?: string;
    }): Promise<ConsentRecord>;
    bulkWithdrawConsents(dataSubjectId: string, purposes?: string[], reason?: string): Promise<{
        withdrawnCount: number;
        failedCount: number;
    }>;
    getConsentStatistics(): Promise<{
        totalConsents: number;
        activeConsents: number;
        withdrawnConsents: number;
        expiredConsents: number;
        consentsByPurpose: Record<string, number>;
        consentsByMethod: Record<string, number>;
        averageConsentDuration: number;
    }>;
    private generateConsentId;
    private generateEvidenceHash;
    private calculateRenewalDate;
    private scheduleRenewalReminder;
    private logConsentWithdrawal;
    validateConsentIntegrity(consentId: string): Promise<{
        isValid: boolean;
        issues: string[];
    }>;
    cleanup(): Promise<void>;
}

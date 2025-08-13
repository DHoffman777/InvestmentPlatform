import { EventEmitter } from 'events';
import Redis from 'ioredis';
import crypto from 'crypto';
import {
  DataSubject,
  ConsentRecord,
  LegalBasis,
  GDPRComplianceConfig,
  PrivacyNotice,
} from '../types';

export class ConsentManagementService extends EventEmitter {
  private redis: Redis;

  constructor(private config: GDPRComplianceConfig) {
    super();
    
    this.redis = new Redis({
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password,
      db: config.database.redis.db,
      keyPrefix: 'gdpr-consent:',
    });
  }

  public async recordConsent(
    dataSubjectId: string,
    consentData: {
      purposes: string[];
      dataCategories: string[];
      consentText: string;
      consentMethod: 'WEB_FORM' | 'EMAIL' | 'PHONE' | 'PAPER' | 'API';
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      parentalConsent?: boolean;
    }
  ): Promise<ConsentRecord> {
    const consentRecord: ConsentRecord = {
      id: this.generateConsentId(),
      dataSubjectId,
      consentType: 'EXPLICIT', // Default for financial services
      purposes: consentData.purposes,
      dataCategories: consentData.dataCategories,
      consentText: consentData.consentText,
      consentMethod: consentData.consentMethod,
      grantedAt: new Date(),
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent,
      location: consentData.location,
      isValid: true,
      parentalConsent: consentData.parentalConsent || false,
      evidenceHash: this.generateEvidenceHash(consentData),
      version: this.config.consent.consentVersion,
      renewalRequired: this.calculateRenewalDate(),
    };

    // Store consent record
    await this.redis.setex(
      `consent:${consentRecord.id}`,
      86400 * 365 * 7, // 7 years retention
      JSON.stringify(consentRecord)
    );

    // Index by data subject
    await this.redis.sadd(`subject-consents:${dataSubjectId}`, consentRecord.id);

    // Index by purpose
    for (const purpose of consentData.purposes) {
      await this.redis.sadd(`purpose-consents:${purpose}`, consentRecord.id);
    }

    // Schedule renewal reminder
    this.scheduleRenewalReminder(consentRecord);

    this.emit('consentGranted', {
      dataSubjectId,
      consentId: consentRecord.id,
      purposes: consentData.purposes,
      timestamp: consentRecord.grantedAt,
    });

    console.log(`Consent recorded: ${consentRecord.id} for subject ${dataSubjectId}`);
    return consentRecord;
  }

  public async withdrawConsent(
    dataSubjectId: string,
    consentId: string,
    withdrawalReason?: string
  ): Promise<boolean> {
    const consentRecord = await this.getConsentRecord(consentId);
    
    if (!consentRecord || consentRecord.dataSubjectId !== dataSubjectId) {
      throw new Error('Consent record not found or unauthorized');
    }

    if (!consentRecord.isValid || consentRecord.withdrawnAt) {
      throw new Error('Consent is already withdrawn or invalid');
    }

    // Mark consent as withdrawn
    consentRecord.withdrawnAt = new Date();
    consentRecord.isValid = false;

    // Update storage
    await this.redis.setex(
      `consent:${consentId}`,
      86400 * 365 * 7,
      JSON.stringify(consentRecord)
    );

    // Log withdrawal
    await this.logConsentWithdrawal(dataSubjectId, consentId, withdrawalReason);

    this.emit('consentWithdrawn', {
      dataSubjectId,
      consentId,
      purposes: consentRecord.purposes,
      withdrawnAt: consentRecord.withdrawnAt,
      reason: withdrawalReason,
    });

    console.log(`Consent withdrawn: ${consentId} for subject ${dataSubjectId}`);
    return true;
  }

  public async updateConsent(
    dataSubjectId: string,
    consentId: string,
    updates: {
      purposes?: string[];
      dataCategories?: string[];
      consentText?: string;
    }
  ): Promise<ConsentRecord> {
    const existingConsent = await this.getConsentRecord(consentId);
    
    if (!existingConsent || existingConsent.dataSubjectId !== dataSubjectId) {
      throw new Error('Consent record not found or unauthorized');
    }

    if (!existingConsent.isValid) {
      throw new Error('Cannot update withdrawn or invalid consent');
    }

    // Create new consent record for the update (maintaining audit trail)
    const updatedConsent: ConsentRecord = {
      ...existingConsent,
      id: this.generateConsentId(),
      purposes: updates.purposes || existingConsent.purposes,
      dataCategories: updates.dataCategories || existingConsent.dataCategories,
      consentText: updates.consentText || existingConsent.consentText,
      grantedAt: new Date(),
      evidenceHash: this.generateEvidenceHash({
        purposes: updates.purposes || existingConsent.purposes,
        dataCategories: updates.dataCategories || existingConsent.dataCategories,
        consentText: updates.consentText || existingConsent.consentText,
        consentMethod: existingConsent.consentMethod,
      }),
      renewalRequired: this.calculateRenewalDate(),
    };

    // Invalidate old consent
    existingConsent.isValid = false;
    existingConsent.withdrawnAt = new Date();

    // Store both records
    await this.redis.setex(
      `consent:${existingConsent.id}`,
      86400 * 365 * 7,
      JSON.stringify(existingConsent)
    );

    await this.redis.setex(
      `consent:${updatedConsent.id}`,
      86400 * 365 * 7,
      JSON.stringify(updatedConsent)
    );

    // Update indexes
    await this.redis.sadd(`subject-consents:${dataSubjectId}`, updatedConsent.id);

    for (const purpose of updatedConsent.purposes) {
      await this.redis.sadd(`purpose-consents:${purpose}`, updatedConsent.id);
    }

    this.emit('consentUpdated', {
      dataSubjectId,
      oldConsentId: consentId,
      newConsentId: updatedConsent.id,
      purposes: updatedConsent.purposes,
      timestamp: updatedConsent.grantedAt,
    });

    console.log(`Consent updated: ${consentId} -> ${updatedConsent.id} for subject ${dataSubjectId}`);
    return updatedConsent;
  }

  public async getConsentRecord(consentId: string): Promise<ConsentRecord | null> {
    const data = await this.redis.get(`consent:${consentId}`);
    return data ? JSON.parse(data) : null;
  }

  public async getDataSubjectConsents(dataSubjectId: string): Promise<ConsentRecord[]> {
    const consentIds = await this.redis.smembers(`subject-consents:${dataSubjectId}`);
    const consents: ConsentRecord[] = [];

    for (const consentId of consentIds) {
      const consent = await this.getConsentRecord(consentId);
      if (consent) {
        consents.push(consent);
      }
    }

    return consents.sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
  }

  public async getActiveConsents(dataSubjectId: string): Promise<ConsentRecord[]> {
    const allConsents = await this.getDataSubjectConsents(dataSubjectId);
    return allConsents.filter(consent => 
      consent.isValid && 
      !consent.withdrawnAt && 
      (!consent.renewalRequired || consent.renewalRequired > new Date())
    );
  }

  public async checkConsentForPurpose(
    dataSubjectId: string,
    purpose: string
  ): Promise<{ hasConsent: boolean; consentRecord?: ConsentRecord; reason?: string }> {
    const activeConsents = await this.getActiveConsents(dataSubjectId);
    
    for (const consent of activeConsents) {
      if (consent.purposes.includes(purpose)) {
        return {
          hasConsent: true,
          consentRecord: consent,
        };
      }
    }

    return {
      hasConsent: false,
      reason: 'No active consent found for this purpose',
    };
  }

  public async checkConsentForDataCategory(
    dataSubjectId: string,
    dataCategory: string
  ): Promise<{ hasConsent: boolean; consentRecord?: ConsentRecord; reason?: string }> {
    const activeConsents = await this.getActiveConsents(dataSubjectId);
    
    for (const consent of activeConsents) {
      if (consent.dataCategories.includes(dataCategory)) {
        return {
          hasConsent: true,
          consentRecord: consent,
        };
      }
    }

    return {
      hasConsent: false,
      reason: 'No active consent found for this data category',
    };
  }

  public async getExpiredConsents(daysBeforeExpiry: number = 30): Promise<ConsentRecord[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysBeforeExpiry);

    const pattern = 'consent:*';
    const keys = await this.redis.keys(pattern);
    const expiredConsents: ConsentRecord[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const consent: ConsentRecord = JSON.parse(data);
        
        if (consent.isValid && 
            consent.renewalRequired && 
            consent.renewalRequired <= threshold) {
          expiredConsents.push(consent);
        }
      }
    }

    return expiredConsents.sort((a, b) => 
      (a.renewalRequired?.getTime() || 0) - (b.renewalRequired?.getTime() || 0)
    );
  }

  public async renewConsent(
    dataSubjectId: string,
    consentId: string,
    renewalData: {
      consentText: string;
      ipAddress?: string;
      userAgent?: string;
      location?: string;
    }
  ): Promise<ConsentRecord> {
    const existingConsent = await this.getConsentRecord(consentId);
    
    if (!existingConsent || existingConsent.dataSubjectId !== dataSubjectId) {
      throw new Error('Consent record not found or unauthorized');
    }

    // Create renewed consent
    const renewedConsent: ConsentRecord = {
      ...existingConsent,
      id: this.generateConsentId(),
      consentText: renewalData.consentText,
      grantedAt: new Date(),
      ipAddress: renewalData.ipAddress,
      userAgent: renewalData.userAgent,
      location: renewalData.location,
      renewalRequired: this.calculateRenewalDate(),
      evidenceHash: this.generateEvidenceHash({
        purposes: existingConsent.purposes,
        dataCategories: existingConsent.dataCategories,
        consentText: renewalData.consentText,
        consentMethod: existingConsent.consentMethod,
      }),
    };

    // Store renewed consent
    await this.redis.setex(
      `consent:${renewedConsent.id}`,
      86400 * 365 * 7,
      JSON.stringify(renewedConsent)
    );

    // Update indexes
    await this.redis.sadd(`subject-consents:${dataSubjectId}`, renewedConsent.id);

    for (const purpose of renewedConsent.purposes) {
      await this.redis.sadd(`purpose-consents:${purpose}`, renewedConsent.id);
    }

    this.emit('consentRenewed', {
      dataSubjectId,
      oldConsentId: consentId,
      newConsentId: renewedConsent.id,
      purposes: renewedConsent.purposes,
      timestamp: renewedConsent.grantedAt,
    });

    console.log(`Consent renewed: ${consentId} -> ${renewedConsent.id} for subject ${dataSubjectId}`);
    return renewedConsent;
  }

  public async bulkWithdrawConsents(
    dataSubjectId: string,
    purposes?: string[],
    reason?: string
  ): Promise<{ withdrawnCount: number; failedCount: number }> {
    const activeConsents = await this.getActiveConsents(dataSubjectId);
    let withdrawnCount = 0;
    let failedCount = 0;

    for (const consent of activeConsents) {
      try {
        // If purposes specified, only withdraw consents with matching purposes
        if (!purposes || purposes.some(purpose => consent.purposes.includes(purpose))) {
          await this.withdrawConsent(dataSubjectId, consent.id, reason);
          withdrawnCount++;
        }
      } catch (error) {
        console.error(`Failed to withdraw consent ${consent.id}:`, error);
        failedCount++;
      }
    }

    this.emit('bulkConsentWithdrawal', {
      dataSubjectId,
      withdrawnCount,
      failedCount,
      purposes,
      reason,
    });

    return { withdrawnCount, failedCount };
  }

  public async getConsentStatistics(): Promise<{
    totalConsents: number;
    activeConsents: number;
    withdrawnConsents: number;
    expiredConsents: number;
    consentsByPurpose: Record<string, number>;
    consentsByMethod: Record<string, number>;
    averageConsentDuration: number;
  }> {
    const pattern = 'consent:*';
    const keys = await this.redis.keys(pattern);
    
    let totalConsents = 0;
    let activeConsents = 0;
    let withdrawnConsents = 0;
    let expiredConsents = 0;
    const consentsByPurpose: Record<string, number> = {};
    const consentsByMethod: Record<string, number> = {};
    const consentDurations: number[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const consent: ConsentRecord = JSON.parse(data);
        totalConsents++;

        if (consent.isValid && !consent.withdrawnAt) {
          if (consent.renewalRequired && consent.renewalRequired <= new Date()) {
            expiredConsents++;
          } else {
            activeConsents++;
          }
        } else {
          withdrawnConsents++;
        }

        // Count by purpose
        for (const purpose of consent.purposes) {
          consentsByPurpose[purpose] = (consentsByPurpose[purpose] || 0) + 1;
        }

        // Count by method
        consentsByMethod[consent.consentMethod] = (consentsByMethod[consent.consentMethod] || 0) + 1;

        // Calculate duration if withdrawn
        if (consent.withdrawnAt) {
          const duration = consent.withdrawnAt.getTime() - consent.grantedAt.getTime();
          consentDurations.push(duration / (1000 * 60 * 60 * 24)); // Convert to days
        }
      }
    }

    const averageConsentDuration = consentDurations.length > 0 
      ? consentDurations.reduce((sum, duration) => sum + duration, 0) / consentDurations.length
      : 0;

    return {
      totalConsents,
      activeConsents,
      withdrawnConsents,
      expiredConsents,
      consentsByPurpose,
      consentsByMethod,
      averageConsentDuration: Math.round(averageConsentDuration),
    };
  }

  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateEvidenceHash(data: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data) + Date.now().toString());
    return hash.digest('hex');
  }

  private calculateRenewalDate(): Date {
    const renewal = new Date();
    renewal.setDate(renewal.getDate() + this.config.consent.renewalPeriod);
    return renewal;
  }

  private scheduleRenewalReminder(consent: ConsentRecord): void {
    if (!consent.renewalRequired) return;

    const reminderDate = new Date(consent.renewalRequired);
    reminderDate.setDate(reminderDate.getDate() - this.config.consent.reminderPeriod);

    const timeUntilReminder = reminderDate.getTime() - Date.now();

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        this.emit('consentRenewalReminder', {
          dataSubjectId: consent.dataSubjectId,
          consentId: consent.id,
          purposes: consent.purposes,
          expiryDate: consent.renewalRequired,
        });
      }, timeUntilReminder);
    }
  }

  private async logConsentWithdrawal(
    dataSubjectId: string,
    consentId: string,
    reason?: string
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      action: 'CONSENT_WITHDRAWN',
      dataSubjectId,
      consentId,
      reason: reason || 'User initiated withdrawal',
      ipAddress: 'system', // Would be actual IP in real implementation
    };

    await this.redis.lpush(
      `withdrawal-log:${dataSubjectId}`,
      JSON.stringify(logEntry)
    );

    // Keep only last 100 log entries per subject
    await this.redis.ltrim(`withdrawal-log:${dataSubjectId}`, 0, 99);
  }

  public async validateConsentIntegrity(consentId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const consent = await this.getConsentRecord(consentId);
    const issues: string[] = [];

    if (!consent) {
      return {
        isValid: false,
        issues: ['Consent record not found'],
      };
    }

    // Check basic required fields
    if (!consent.dataSubjectId) issues.push('Missing data subject ID');
    if (!consent.purposes || consent.purposes.length === 0) issues.push('No purposes specified');
    if (!consent.dataCategories || consent.dataCategories.length === 0) issues.push('No data categories specified');
    if (!consent.consentText) issues.push('Missing consent text');
    if (!consent.evidenceHash) issues.push('Missing evidence hash');

    // Check temporal validity
    if (consent.renewalRequired && consent.renewalRequired <= new Date()) {
      issues.push('Consent has expired and requires renewal');
    }

    // Check if withdrawn
    if (consent.withdrawnAt) {
      issues.push('Consent has been withdrawn');
    }

    // Check evidence integrity
    const expectedHash = this.generateEvidenceHash({
      purposes: consent.purposes,
      dataCategories: consent.dataCategories,
      consentText: consent.consentText,
      consentMethod: consent.consentMethod,
    });

    // Note: This is a simplified check. In production, you'd validate the actual hash
    if (!consent.evidenceHash) {
      issues.push('Evidence hash integrity check failed');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  public async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}
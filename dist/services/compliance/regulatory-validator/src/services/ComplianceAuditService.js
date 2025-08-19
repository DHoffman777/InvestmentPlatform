"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceAuditService = void 0;
const events_1 = require("events");
const ioredis_1 = __importDefault(require("ioredis"));
class ComplianceAuditService extends events_1.EventEmitter {
    config;
    redis;
    auditBuffer = [];
    alertBuffer = [];
    flushInterval;
    constructor(config) {
        super();
        this.config = config;
        this.redis = new ioredis_1.default({
            host: config.database.redis.host,
            port: config.database.redis.port,
            password: config.database.redis.password,
            db: config.database.redis.db,
            keyPrefix: 'compliance-audit:',
        });
        if (config.audit.enabled) {
            this.startAuditBufferFlush();
        }
    }
    startAuditBufferFlush() {
        // Flush audit buffer every 30 seconds
        this.flushInterval = setInterval(async () => {
            await this.flushAuditBuffer();
            await this.flushAlertBuffer();
        }, 30000);
    }
    async recordAuditEvent(entityType, entityId, eventType, eventDetails, complianceStatus, metadata) {
        const auditTrail = {
            id: this.generateAuditId(),
            timestamp: new Date(),
            entityType,
            entityId,
            eventType,
            eventDetails,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            sessionId: metadata?.sessionId,
            complianceStatus,
            retentionDate: this.calculateRetentionDate(),
        };
        if (this.config.audit.enabled) {
            this.auditBuffer.push(auditTrail);
        }
        this.emit('auditEventRecorded', auditTrail);
    }
    async recordValidationAudit(result, triggeredBy, metadata) {
        await this.recordAuditEvent(result.entityType, result.entityId, 'VALIDATION', {
            action: 'compliance_validation',
            newValue: {
                overallStatus: result.overallStatus,
                validatedRules: result.validatedRules.length,
                failedRules: result.summary.failedRules,
                criticalViolations: result.summary.criticalViolations,
            },
            triggeredBy,
            reason: 'Regulatory compliance validation',
        }, result.overallStatus, metadata);
        // Create alerts for critical violations
        for (const ruleResult of result.validatedRules) {
            if (ruleResult.status === 'FAIL' && ruleResult.severity === 'CRITICAL') {
                await this.createAlert({
                    alertType: 'VIOLATION',
                    severity: 'CRITICAL',
                    title: `Critical Compliance Violation: ${ruleResult.ruleName}`,
                    message: ruleResult.message,
                    entityType: result.entityType,
                    entityId: result.entityId,
                    ruleId: ruleResult.ruleId,
                    notificationChannels: ['EMAIL', 'WEBHOOK', 'DASHBOARD'],
                    metadata: {
                        validationRequestId: result.requestId,
                        processingTime: result.metadata.processingTime,
                    },
                });
            }
        }
    }
    async createException(exception) {
        const fullException = {
            ...exception,
            id: this.generateExceptionId(),
        };
        // Store exception
        await this.redis.setex(`exception:${fullException.id}`, 86400 * 365, // 1 year retention
        JSON.stringify(fullException));
        // Index by entity
        await this.redis.sadd(`exceptions:${exception.entityType}:${exception.entityId}`, fullException.id);
        // Index by rule
        await this.redis.sadd(`exceptions:rule:${exception.ruleId}`, fullException.id);
        // Record audit event
        await this.recordAuditEvent(exception.entityType, exception.entityId, 'EXCEPTION', {
            action: 'exception_created',
            newValue: fullException,
            triggeredBy: exception.approvedBy,
            reason: exception.reason,
        }, 'EXCEPTION_GRANTED');
        this.emit('exceptionCreated', fullException);
        return fullException;
    }
    async updateException(exceptionId, updates, updatedBy) {
        const existingData = await this.redis.get(`exception:${exceptionId}`);
        if (!existingData) {
            return null;
        }
        const existingException = JSON.parse(existingData);
        const updatedException = {
            ...existingException,
            ...updates,
        };
        // Store updated exception
        await this.redis.setex(`exception:${exceptionId}`, 86400 * 365, JSON.stringify(updatedException));
        // Record audit event
        await this.recordAuditEvent(existingException.entityType, existingException.entityId, 'EXCEPTION', {
            action: 'exception_updated',
            oldValue: existingException,
            newValue: updatedException,
            triggeredBy: updatedBy,
        }, updatedException.status);
        this.emit('exceptionUpdated', { old: existingException, new: updatedException });
        return updatedException;
    }
    async getException(exceptionId) {
        const data = await this.redis.get(`exception:${exceptionId}`);
        return data ? JSON.parse(data) : null;
    }
    async getEntityExceptions(entityType, entityId) {
        const exceptionIds = await this.redis.smembers(`exceptions:${entityType}:${entityId}`);
        const exceptions = [];
        for (const exceptionId of exceptionIds) {
            const exception = await this.getException(exceptionId);
            if (exception) {
                exceptions.push(exception);
            }
        }
        return exceptions.sort((a, b) => b.approvalDate.getTime() - a.approvalDate.getTime());
    }
    async getRuleExceptions(ruleId) {
        const exceptionIds = await this.redis.smembers(`exceptions:rule:${ruleId}`);
        const exceptions = [];
        for (const exceptionId of exceptionIds) {
            const exception = await this.getException(exceptionId);
            if (exception) {
                exceptions.push(exception);
            }
        }
        return exceptions.sort((a, b) => b.approvalDate.getTime() - a.approvalDate.getTime());
    }
    async createAlert(alertData) {
        const alert = {
            ...alertData,
            id: this.generateAlertId(),
            timestamp: new Date(),
            status: 'OPEN',
            escalationLevel: 0,
        };
        this.alertBuffer.push(alert);
        this.emit('alertCreated', alert);
        // Send immediate notifications for critical alerts
        if (alert.severity === 'CRITICAL') {
            await this.sendAlertNotifications(alert);
        }
        return alert;
    }
    async updateAlert(alertId, updates, updatedBy) {
        const existingData = await this.redis.get(`alert:${alertId}`);
        if (!existingData) {
            return null;
        }
        const existingAlert = JSON.parse(existingData);
        const updatedAlert = {
            ...existingAlert,
            ...updates,
        };
        await this.redis.setex(`alert:${alertId}`, 86400 * 30, // 30 days retention
        JSON.stringify(updatedAlert));
        // Record audit event if entity-related
        if (existingAlert.entityType && existingAlert.entityId) {
            await this.recordAuditEvent(existingAlert.entityType, existingAlert.entityId, 'REVIEW', {
                action: 'alert_updated',
                oldValue: existingAlert,
                newValue: updatedAlert,
                triggeredBy: updatedBy,
            }, updatedAlert.status);
        }
        this.emit('alertUpdated', { old: existingAlert, new: updatedAlert });
        return updatedAlert;
    }
    async getAlert(alertId) {
        const data = await this.redis.get(`alert:${alertId}`);
        return data ? JSON.parse(data) : null;
    }
    async getEntityAlerts(entityType, entityId) {
        const pattern = `alert:*`;
        const keys = await this.redis.keys(pattern);
        const alerts = [];
        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const alert = JSON.parse(data);
                if (alert.entityType === entityType && alert.entityId === entityId) {
                    alerts.push(alert);
                }
            }
        }
        return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async getOpenAlerts() {
        const pattern = `alert:*`;
        const keys = await this.redis.keys(pattern);
        const alerts = [];
        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const alert = JSON.parse(data);
                if (alert.status === 'OPEN') {
                    alerts.push(alert);
                }
            }
        }
        return alerts.sort((a, b) => {
            // Sort by severity first, then by timestamp
            const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            return severityDiff !== 0 ? severityDiff : b.timestamp.getTime() - a.timestamp.getTime();
        });
    }
    async getAuditTrail(entityType, entityId, eventType, startDate, endDate, limit = 100) {
        // In a production environment, you'd use a more sophisticated query system
        // For now, we'll search through stored audit records
        const pattern = `audit:*`;
        const keys = await this.redis.keys(pattern);
        const auditTrails = [];
        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const auditTrail = JSON.parse(data);
                // Apply filters
                if (entityType && auditTrail.entityType !== entityType)
                    continue;
                if (entityId && auditTrail.entityId !== entityId)
                    continue;
                if (eventType && auditTrail.eventType !== eventType)
                    continue;
                if (startDate && auditTrail.timestamp < startDate)
                    continue;
                if (endDate && auditTrail.timestamp > endDate)
                    continue;
                auditTrails.push(auditTrail);
            }
        }
        return auditTrails
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    async flushAuditBuffer() {
        if (this.auditBuffer.length === 0)
            return;
        const batchSize = 100;
        const batch = this.auditBuffer.splice(0, batchSize);
        try {
            const pipeline = this.redis.pipeline();
            for (const auditTrail of batch) {
                const key = `audit:${auditTrail.id}`;
                const ttl = Math.floor((auditTrail.retentionDate.getTime() - Date.now()) / 1000);
                pipeline.setex(key, Math.max(ttl, 3600), JSON.stringify(auditTrail));
                // Index by entity
                pipeline.sadd(`audit-index:${auditTrail.entityType}:${auditTrail.entityId}`, auditTrail.id);
                // Index by event type
                pipeline.sadd(`audit-index:event:${auditTrail.eventType}`, auditTrail.id);
            }
            await pipeline.exec();
            console.log(`Flushed ${batch.length} audit records to storage`);
        }
        catch (error) {
            console.error('Failed to flush audit buffer:', error);
            // Re-add failed records to buffer for retry
            this.auditBuffer.unshift(...batch);
        }
    }
    async flushAlertBuffer() {
        if (this.alertBuffer.length === 0)
            return;
        const batch = this.alertBuffer.splice(0, 50);
        try {
            const pipeline = this.redis.pipeline();
            for (const alert of batch) {
                const key = `alert:${alert.id}`;
                pipeline.setex(key, 86400 * 30, JSON.stringify(alert)); // 30 days retention
                // Index by entity if available
                if (alert.entityType && alert.entityId) {
                    pipeline.sadd(`alert-index:${alert.entityType}:${alert.entityId}`, alert.id);
                }
                // Index by status
                pipeline.sadd(`alert-index:status:${alert.status}`, alert.id);
                // Index by severity
                pipeline.sadd(`alert-index:severity:${alert.severity}`, alert.id);
            }
            await pipeline.exec();
            console.log(`Flushed ${batch.length} alerts to storage`);
        }
        catch (error) {
            console.error('Failed to flush alert buffer:', error);
            this.alertBuffer.unshift(...batch);
        }
    }
    async sendAlertNotifications(alert) {
        try {
            for (const channel of alert.notificationChannels) {
                switch (channel) {
                    case 'EMAIL':
                        if (this.config.notifications.email.enabled) {
                            // Implementation would send email
                            console.log(`Email notification sent for alert: ${alert.id}`);
                        }
                        break;
                    case 'WEBHOOK':
                        if (this.config.notifications.webhook.enabled) {
                            // Implementation would call webhook
                            console.log(`Webhook notification sent for alert: ${alert.id}`);
                        }
                        break;
                    case 'SMS':
                        // Implementation would send SMS
                        console.log(`SMS notification sent for alert: ${alert.id}`);
                        break;
                    case 'DASHBOARD':
                        // Real-time dashboard update would be handled by WebSocket
                        this.emit('dashboardAlert', alert);
                        break;
                }
            }
        }
        catch (error) {
            console.error(`Failed to send notifications for alert ${alert.id}:`, error);
        }
    }
    generateAuditId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateExceptionId() {
        return `exc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    calculateRetentionDate() {
        const retentionDays = this.config.audit.retentionDays;
        return new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
    }
    async getComplianceMetrics(startDate, endDate) {
        // This would be optimized with proper indexing in production
        const auditTrails = await this.getAuditTrail(undefined, undefined, 'VALIDATION', startDate, endDate, 10000);
        const totalValidations = auditTrails.length;
        const compliantValidations = auditTrails.filter(trail => trail.complianceStatus === 'COMPLIANT' || trail.complianceStatus === 'WARNING').length;
        const criticalViolations = auditTrails.filter(trail => trail.eventDetails.newValue?.criticalViolations > 0).length;
        const complianceRate = totalValidations > 0 ? (compliantValidations / totalValidations) * 100 : 0;
        // Get active exceptions count
        const allExceptionKeys = await this.redis.keys('exception:*');
        let activeExceptions = 0;
        for (const key of allExceptionKeys) {
            const data = await this.redis.get(key);
            if (data) {
                const exception = JSON.parse(data);
                if (exception.status === 'APPROVED' &&
                    (!exception.expirationDate || exception.expirationDate > new Date())) {
                    activeExceptions++;
                }
            }
        }
        const openAlerts = (await this.getOpenAlerts()).length;
        return {
            totalValidations,
            complianceRate: Math.round(complianceRate * 100) / 100,
            criticalViolations,
            activeExceptions,
            openAlerts,
            auditEvents: auditTrails.length,
        };
    }
    async cleanup() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        await this.flushAuditBuffer();
        await this.flushAlertBuffer();
        await this.redis.quit();
    }
}
exports.ComplianceAuditService = ComplianceAuditService;

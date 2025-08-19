"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementTimelineTrackingService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class SettlementTimelineTrackingService extends events_1.EventEmitter {
    settlementInstructions;
    settlementMilestones;
    settlementAlerts;
    settlementDelays;
    slaDefinitions;
    performanceMetrics;
    // Standard milestone templates for different security types
    MILESTONE_TEMPLATES = new Map([
        ['EQUITY', [
                { type: 'TRADE_CAPTURE', offsetHours: 0, alertThreshold: 30, responsible: 'INTERNAL' },
                { type: 'TRADE_CONFIRMATION', offsetHours: 0.5, alertThreshold: 60, responsible: 'COUNTERPARTY' },
                { type: 'AFFIRMATION', offsetHours: 1, alertThreshold: 120, responsible: 'COUNTERPARTY' },
                { type: 'ALLOCATION', offsetHours: 2, alertThreshold: 180, responsible: 'INTERNAL' },
                { type: 'SETTLEMENT_INSTRUCTION_SENT', offsetHours: 24, alertThreshold: 60, responsible: 'INTERNAL' },
                { type: 'CUSTODY_CONFIRMATION', offsetHours: 48, alertThreshold: 240, responsible: 'CUSTODIAN' },
                { type: 'CASH_CONFIRMATION', offsetHours: 48, alertThreshold: 240, responsible: 'CUSTODIAN' },
                { type: 'FINAL_SETTLEMENT', offsetHours: 48, alertThreshold: 360, responsible: 'CUSTODIAN' },
                { type: 'RECONCILIATION', offsetHours: 72, alertThreshold: 120, responsible: 'INTERNAL' }
            ]],
        ['CORPORATE_BOND', [
                { type: 'TRADE_CAPTURE', offsetHours: 0, alertThreshold: 30, responsible: 'INTERNAL' },
                { type: 'TRADE_CONFIRMATION', offsetHours: 0.5, alertThreshold: 60, responsible: 'COUNTERPARTY' },
                { type: 'AFFIRMATION', offsetHours: 2, alertThreshold: 180, responsible: 'COUNTERPARTY' },
                { type: 'ALLOCATION', offsetHours: 4, alertThreshold: 240, responsible: 'INTERNAL' },
                { type: 'SETTLEMENT_INSTRUCTION_SENT', offsetHours: 72, alertThreshold: 120, responsible: 'INTERNAL' },
                { type: 'CUSTODY_CONFIRMATION', offsetHours: 72, alertThreshold: 360, responsible: 'CUSTODIAN' },
                { type: 'CASH_CONFIRMATION', offsetHours: 72, alertThreshold: 360, responsible: 'CUSTODIAN' },
                { type: 'FINAL_SETTLEMENT', offsetHours: 72, alertThreshold: 480, responsible: 'CUSTODIAN' },
                { type: 'RECONCILIATION', offsetHours: 96, alertThreshold: 180, responsible: 'INTERNAL' }
            ]],
        ['GOVERNMENT_BOND', [
                { type: 'TRADE_CAPTURE', offsetHours: 0, alertThreshold: 30, responsible: 'INTERNAL' },
                { type: 'TRADE_CONFIRMATION', offsetHours: 0.25, alertThreshold: 30, responsible: 'COUNTERPARTY' },
                { type: 'AFFIRMATION', offsetHours: 0.5, alertThreshold: 60, responsible: 'COUNTERPARTY' },
                { type: 'ALLOCATION', offsetHours: 1, alertThreshold: 90, responsible: 'INTERNAL' },
                { type: 'SETTLEMENT_INSTRUCTION_SENT', offsetHours: 24, alertThreshold: 60, responsible: 'INTERNAL' },
                { type: 'CUSTODY_CONFIRMATION', offsetHours: 24, alertThreshold: 180, responsible: 'CUSTODIAN' },
                { type: 'CASH_CONFIRMATION', offsetHours: 24, alertThreshold: 180, responsible: 'CUSTODIAN' },
                { type: 'FINAL_SETTLEMENT', offsetHours: 24, alertThreshold: 240, responsible: 'CUSTODIAN' },
                { type: 'RECONCILIATION', offsetHours: 48, alertThreshold: 120, responsible: 'INTERNAL' }
            ]]
    ]);
    constructor() {
        super();
        this.settlementInstructions = new Map();
        this.settlementMilestones = new Map();
        this.settlementAlerts = new Map();
        this.settlementDelays = new Map();
        this.slaDefinitions = new Map();
        this.performanceMetrics = new Map();
        this.initializeDefaultSLAs();
        this.startMonitoringTimer();
    }
    initializeDefaultSLAs() {
        const defaultSLAs = [
            {
                securityType: 'EQUITY',
                settlementMethod: 'DVP',
                targetSettlementTime: 48, // T+2
                warningThreshold: 80,
                criticalThreshold: 95,
                maxAllowableDelay: 72
            },
            {
                securityType: 'CORPORATE_BOND',
                settlementMethod: 'DVP',
                targetSettlementTime: 72, // T+3
                warningThreshold: 85,
                criticalThreshold: 95,
                maxAllowableDelay: 120
            },
            {
                securityType: 'GOVERNMENT_BOND',
                settlementMethod: 'DVP',
                targetSettlementTime: 24, // T+1
                warningThreshold: 85,
                criticalThreshold: 95,
                maxAllowableDelay: 48
            }
        ];
        defaultSLAs.forEach(sla => {
            this.slaDefinitions.set(`${sla.securityType}_${sla.settlementMethod}`, sla);
        });
    }
    startMonitoringTimer() {
        // Check for alerts every 5 minutes
        setInterval(() => {
            this.checkForAlerts();
        }, 5 * 60 * 1000);
    }
    async createSettlementInstruction(instructionData) {
        const instruction = {
            ...instructionData,
            id: (0, uuid_1.v4)(),
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.settlementInstructions.set(instruction.id, instruction);
        // Create milestone timeline
        await this.createMilestoneTimeline(instruction);
        this.emit('settlementInstructionCreated', instruction);
        return instruction;
    }
    async createMilestoneTimeline(instruction) {
        const securityType = await this.getSecurityType(instruction.securityId);
        const template = this.MILESTONE_TEMPLATES.get(securityType) || this.MILESTONE_TEMPLATES.get('EQUITY');
        const milestones = template.map(template => {
            const expectedTime = new Date(instruction.tradeDate.getTime() + template.offsetHours * 60 * 60 * 1000);
            return {
                id: (0, uuid_1.v4)(),
                instructionId: instruction.id,
                milestoneType: template.type,
                expectedTime,
                status: 'PENDING',
                responsible: template.responsible,
                alertThreshold: template.alertThreshold,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });
        this.settlementMilestones.set(instruction.id, milestones);
        this.settlementAlerts.set(instruction.id, []);
        this.settlementDelays.set(instruction.id, []);
    }
    async updateMilestoneStatus(instructionId, milestoneType, status, notes) {
        const milestones = this.settlementMilestones.get(instructionId);
        if (!milestones) {
            throw new Error(`Settlement instruction not found: ${instructionId}`);
        }
        const milestone = milestones.find(m => m.milestoneType === milestoneType);
        if (!milestone) {
            throw new Error(`Milestone not found: ${milestoneType} for instruction ${instructionId}`);
        }
        const oldStatus = milestone.status;
        milestone.status = status;
        milestone.actualTime = new Date();
        milestone.updatedAt = new Date();
        if (notes)
            milestone.notes = notes;
        // Update the instruction status based on milestone progress
        await this.updateInstructionStatus(instructionId);
        // Create delay record if milestone is delayed
        if (status === 'DELAYED' && oldStatus !== 'DELAYED') {
            await this.recordMilestoneDelay(instructionId, milestone.id, 'Milestone delayed');
        }
        // Create alert if milestone failed
        if (status === 'FAILED') {
            await this.createAlert(instructionId, milestone.id, 'FAILURE', 'CRITICAL', `Milestone ${milestoneType} failed`);
        }
        this.emit('milestoneStatusUpdated', { instructionId, milestone, oldStatus });
    }
    async updateInstructionStatus(instructionId) {
        const instruction = this.settlementInstructions.get(instructionId);
        const milestones = this.settlementMilestones.get(instructionId);
        if (!instruction || !milestones)
            return;
        const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
        const failedMilestones = milestones.filter(m => m.status === 'FAILED').length;
        const totalMilestones = milestones.length;
        let newStatus;
        if (failedMilestones > 0) {
            newStatus = 'FAILED';
        }
        else if (completedMilestones === totalMilestones) {
            newStatus = 'SETTLED';
        }
        else if (completedMilestones > 0) {
            newStatus = 'PROCESSING';
        }
        else {
            newStatus = 'PENDING';
        }
        const oldStatus = instruction.status;
        instruction.status = newStatus;
        instruction.updatedAt = new Date();
        if (newStatus === 'SETTLED') {
            instruction.actualSettlementTime = new Date();
        }
        this.emit('instructionStatusUpdated', { instructionId, oldStatus, newStatus });
    }
    async recordMilestoneDelay(instructionId, milestoneId, reason, estimatedDuration) {
        const delays = this.settlementDelays.get(instructionId) || [];
        const delay = {
            id: (0, uuid_1.v4)(),
            instructionId,
            milestoneId,
            delayType: this.classifyDelayType(reason),
            delayReason: reason,
            estimatedDuration: estimatedDuration || 60, // Default 1 hour
            impact: this.assessDelayImpact(instructionId, milestoneId),
            mitigation: this.generateMitigationActions(reason),
            createdAt: new Date()
        };
        delays.push(delay);
        this.settlementDelays.set(instructionId, delays);
        // Create alert for delay
        const severity = delay.impact === 'CRITICAL' ? 'CRITICAL' : delay.impact === 'HIGH' ? 'WARNING' : 'INFO';
        await this.createAlert(instructionId, milestoneId, 'DELAY', severity, `Settlement delayed: ${reason}`);
        this.emit('settlementDelayRecorded', delay);
        return delay;
    }
    classifyDelayType(reason) {
        const reasonLower = reason.toLowerCase();
        if (reasonLower.includes('counterparty') || reasonLower.includes('client'))
            return 'COUNTERPARTY';
        if (reasonLower.includes('custodian') || reasonLower.includes('custody'))
            return 'CUSTODIAN';
        if (reasonLower.includes('system') || reasonLower.includes('technical'))
            return 'SYSTEM';
        if (reasonLower.includes('market') || reasonLower.includes('holiday'))
            return 'MARKET';
        if (reasonLower.includes('regulatory') || reasonLower.includes('compliance'))
            return 'REGULATORY';
        return 'OPERATIONAL';
    }
    assessDelayImpact(instructionId, milestoneId) {
        const instruction = this.settlementInstructions.get(instructionId);
        const milestones = this.settlementMilestones.get(instructionId) || [];
        if (!instruction)
            return 'MEDIUM';
        // High priority instructions have higher impact
        if (instruction.priority === 'CRITICAL')
            return 'CRITICAL';
        if (instruction.priority === 'HIGH')
            return 'HIGH';
        // Large trades have higher impact
        const tradeValue = instruction.quantity * instruction.price;
        if (tradeValue > 10000000)
            return 'HIGH'; // >$10M
        if (tradeValue > 1000000)
            return 'MEDIUM'; // >$1M
        // Critical path milestones have higher impact
        const milestone = milestones.find(m => m.id === milestoneId);
        if (milestone && ['FINAL_SETTLEMENT', 'CASH_CONFIRMATION', 'CUSTODY_CONFIRMATION'].includes(milestone.milestoneType)) {
            return 'HIGH';
        }
        return 'MEDIUM';
    }
    generateMitigationActions(reason) {
        const actions = [];
        const reasonLower = reason.toLowerCase();
        if (reasonLower.includes('counterparty')) {
            actions.push('Contact counterparty operations team');
            actions.push('Escalate to counterparty management if needed');
        }
        if (reasonLower.includes('custodian')) {
            actions.push('Contact custodian relationship manager');
            actions.push('Verify account setup and funding');
        }
        if (reasonLower.includes('system')) {
            actions.push('Engage IT support team');
            actions.push('Consider manual processing as backup');
        }
        if (reasonLower.includes('documentation')) {
            actions.push('Verify all required documents are complete');
            actions.push('Resubmit with corrections if needed');
        }
        // Default actions
        if (actions.length === 0) {
            actions.push('Monitor closely for resolution');
            actions.push('Prepare escalation if delay extends');
        }
        return actions;
    }
    async createAlert(instructionId, milestoneId, alertType, severity, message) {
        const alerts = this.settlementAlerts.get(instructionId) || [];
        const alert = {
            id: (0, uuid_1.v4)(),
            instructionId,
            milestoneId,
            alertType,
            severity,
            message,
            acknowledged: false,
            createdAt: new Date()
        };
        alerts.push(alert);
        this.settlementAlerts.set(instructionId, alerts);
        this.emit('settlementAlertCreated', alert);
        return alert;
    }
    checkForAlerts() {
        const now = new Date();
        this.settlementInstructions.forEach((instruction, instructionId) => {
            if (instruction.status === 'SETTLED' || instruction.status === 'CANCELLED')
                return;
            const milestones = this.settlementMilestones.get(instructionId) || [];
            milestones.forEach(milestone => {
                if (milestone.status !== 'PENDING')
                    return;
                const timeDiff = now.getTime() - milestone.expectedTime.getTime();
                const minutesLate = timeDiff / (60 * 1000);
                // Check if milestone is approaching deadline
                if (minutesLate > -30 && minutesLate <= 0) { // 30 minutes before expected time
                    this.createAlert(instructionId, milestone.id, 'DEADLINE_APPROACHING', 'INFO', `Milestone ${milestone.milestoneType} approaching deadline`);
                }
                // Check if milestone is delayed
                if (minutesLate > milestone.alertThreshold) {
                    this.createAlert(instructionId, milestone.id, 'DELAY', 'WARNING', `Milestone ${milestone.milestoneType} is ${Math.round(minutesLate)} minutes late`);
                    this.recordMilestoneDelay(instructionId, milestone.id, `Milestone exceeded threshold by ${Math.round(minutesLate)} minutes`, Math.round(minutesLate));
                }
                // Check for SLA breach
                const slaKey = `${this.getSecurityTypeSync(instruction.securityId)}_${instruction.settlementMethod}`;
                const sla = this.slaDefinitions.get(slaKey);
                if (sla && milestone.milestoneType === 'FINAL_SETTLEMENT') {
                    const hoursLate = timeDiff / (60 * 60 * 1000);
                    const thresholdHours = sla.targetSettlementTime * (sla.criticalThreshold / 100);
                    if (hoursLate > thresholdHours) {
                        this.createAlert(instructionId, milestone.id, 'SLA_BREACH', 'CRITICAL', `Settlement SLA breached by ${hoursLate.toFixed(1)} hours`);
                    }
                }
            });
        });
    }
    getSettlementTimeline(instructionId) {
        const instruction = this.settlementInstructions.get(instructionId);
        const milestones = this.settlementMilestones.get(instructionId);
        const delays = this.settlementDelays.get(instructionId) || [];
        if (!instruction || !milestones)
            return undefined;
        const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
        const overallProgress = (completedMilestones / milestones.length) * 100;
        // Calculate estimated completion based on current progress and delays
        const remainingMilestones = milestones.filter(m => m.status === 'PENDING');
        const avgDelayMinutes = delays.length > 0 ?
            delays.reduce((sum, d) => sum + (d.actualDuration || d.estimatedDuration), 0) / delays.length : 0;
        let estimatedCompletion = instruction.expectedSettlementTime;
        if (remainingMilestones.length > 0) {
            const lastMilestone = remainingMilestones[remainingMilestones.length - 1];
            estimatedCompletion = new Date(lastMilestone.expectedTime.getTime() + avgDelayMinutes * 60 * 1000);
        }
        // Identify critical path (milestones that must complete on time)
        const criticalPath = milestones
            .filter(m => ['TRADE_CONFIRMATION', 'AFFIRMATION', 'SETTLEMENT_INSTRUCTION_SENT', 'FINAL_SETTLEMENT'].includes(m.milestoneType))
            .map(m => m.milestoneType);
        return {
            instructionId,
            milestones: [...milestones],
            currentStatus: instruction.status,
            overallProgress,
            estimatedCompletion,
            delays: [...delays],
            criticalPath,
            lastUpdated: new Date()
        };
    }
    acknowledgeAlert(alertId, acknowledgedBy) {
        for (const alerts of this.settlementAlerts.values()) {
            const alert = alerts.find(a => a.id === alertId);
            if (alert) {
                alert.acknowledged = true;
                alert.acknowledgedBy = acknowledgedBy;
                alert.acknowledgedAt = new Date();
                this.emit('alertAcknowledged', alert);
                return true;
            }
        }
        return false;
    }
    resolveAlert(alertId) {
        for (const alerts of this.settlementAlerts.values()) {
            const alert = alerts.find(a => a.id === alertId);
            if (alert) {
                alert.resolvedAt = new Date();
                this.emit('alertResolved', alert);
                return true;
            }
        }
        return false;
    }
    getActiveAlerts(severity) {
        const allAlerts = [];
        this.settlementAlerts.forEach(alerts => {
            const activeAlerts = alerts.filter(a => !a.resolvedAt);
            allAlerts.push(...activeAlerts);
        });
        if (severity) {
            return allAlerts.filter(a => a.severity === severity);
        }
        return allAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    generatePerformanceReport(period, startDate, endDate) {
        const instructions = Array.from(this.settlementInstructions.values())
            .filter(i => i.createdAt >= startDate && i.createdAt <= endDate);
        const settledInstructions = instructions.filter(i => i.status === 'SETTLED');
        const failedInstructions = instructions.filter(i => i.status === 'FAILED');
        // Calculate settlement times
        const settlementTimes = settledInstructions
            .filter(i => i.actualSettlementTime)
            .map(i => (i.actualSettlementTime.getTime() - i.tradeDate.getTime()) / (60 * 60 * 1000)); // hours
        const averageSettlementTime = settlementTimes.length > 0 ?
            settlementTimes.reduce((sum, time) => sum + time, 0) / settlementTimes.length : 0;
        // SLA compliance calculation
        let onTimeSettlements = 0;
        settledInstructions.forEach(instruction => {
            const slaKey = `${this.getSecurityTypeSync(instruction.securityId)}_${instruction.settlementMethod}`;
            const sla = this.slaDefinitions.get(slaKey);
            if (sla && instruction.actualSettlementTime) {
                const settlementHours = (instruction.actualSettlementTime.getTime() - instruction.tradeDate.getTime()) / (60 * 60 * 1000);
                if (settlementHours <= sla.targetSettlementTime) {
                    onTimeSettlements++;
                }
            }
        });
        const slaCompliance = settledInstructions.length > 0 ?
            (onTimeSettlements / settledInstructions.length) * 100 : 0;
        // Analyze delay reasons
        const allDelays = [];
        this.settlementDelays.forEach(delays => allDelays.push(...delays));
        const delayReasonCounts = new Map();
        allDelays.forEach(delay => {
            const existing = delayReasonCounts.get(delay.delayReason) || { count: 0, totalDelay: 0 };
            existing.count++;
            existing.totalDelay += delay.actualDuration || delay.estimatedDuration;
            delayReasonCounts.set(delay.delayReason, existing);
        });
        const topDelayReasons = Array.from(delayReasonCounts.entries())
            .map(([reason, data]) => ({
            reason,
            count: data.count,
            averageDelay: data.totalDelay / data.count
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Analyze counterparty performance
        const counterpartyPerformance = new Map();
        instructions.forEach(instruction => {
            const existing = counterpartyPerformance.get(instruction.counterpartyId) ||
                { total: 0, late: 0, totalDelay: 0 };
            existing.total++;
            if (instruction.actualSettlementTime && instruction.expectedSettlementTime) {
                const delayMinutes = (instruction.actualSettlementTime.getTime() - instruction.expectedSettlementTime.getTime()) / (60 * 1000);
                if (delayMinutes > 0) {
                    existing.late++;
                    existing.totalDelay += delayMinutes;
                }
            }
            counterpartyPerformance.set(instruction.counterpartyId, existing);
        });
        const worstPerformingCounterparties = Array.from(counterpartyPerformance.entries())
            .filter(([_, performance]) => performance.late > 0)
            .map(([counterpartyId, performance]) => ({
            counterpartyId,
            lateSettlements: performance.late,
            avgDelay: performance.totalDelay / performance.late
        }))
            .sort((a, b) => b.lateSettlements - a.lateSettlements)
            .slice(0, 10);
        const metrics = {
            period,
            totalInstructions: instructions.length,
            settledOnTime: onTimeSettlements,
            settledLate: settledInstructions.length - onTimeSettlements,
            failed: failedInstructions.length,
            averageSettlementTime,
            slaCompliance,
            topDelayReasons,
            worstPerformingCounterparties
        };
        this.performanceMetrics.set(period, metrics);
        return metrics;
    }
    // Helper methods
    async getSecurityType(securityId) {
        // Mock implementation - would typically call market data service
        return 'EQUITY';
    }
    getSecurityTypeSync(securityId) {
        // Mock implementation - would typically call market data service
        return 'EQUITY';
    }
    // Getter methods
    getSettlementInstruction(instructionId) {
        return this.settlementInstructions.get(instructionId);
    }
    getAllSettlementInstructions() {
        return Array.from(this.settlementInstructions.values());
    }
    getInstructionsByStatus(status) {
        return Array.from(this.settlementInstructions.values())
            .filter(instruction => instruction.status === status);
    }
    getInstructionsByCounterparty(counterpartyId) {
        return Array.from(this.settlementInstructions.values())
            .filter(instruction => instruction.counterpartyId === counterpartyId);
    }
    getPendingMilestones() {
        const allMilestones = [];
        this.settlementMilestones.forEach(milestones => {
            const pending = milestones.filter(m => m.status === 'PENDING');
            allMilestones.push(...pending);
        });
        return allMilestones.sort((a, b) => a.expectedTime.getTime() - b.expectedTime.getTime());
    }
    getOverdueMilestones() {
        const now = new Date();
        return this.getPendingMilestones()
            .filter(milestone => milestone.expectedTime < now);
    }
}
exports.SettlementTimelineTrackingService = SettlementTimelineTrackingService;

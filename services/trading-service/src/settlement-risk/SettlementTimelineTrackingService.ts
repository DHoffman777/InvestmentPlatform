import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface SettlementInstruction {
  id: string;
  tradeId: string;
  counterpartyId: string;
  securityId: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  currency: string;
  tradeDate: Date;
  settlementDate: Date;
  expectedSettlementTime: Date;
  actualSettlementTime?: Date;
  status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED' | 'CANCELLED' | 'DELAYED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  settlementMethod: 'DVP' | 'FOP' | 'RVP' | 'CASH';
  custodianId: string;
  clearingHouse?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementMilestone {
  id: string;
  instructionId: string;
  milestoneType: 'TRADE_CAPTURE' | 'TRADE_CONFIRMATION' | 'AFFIRMATION' | 'ALLOCATION' | 
                 'SETTLEMENT_INSTRUCTION_SENT' | 'CUSTODY_CONFIRMATION' | 'CASH_CONFIRMATION' | 
                 'FINAL_SETTLEMENT' | 'RECONCILIATION' | 'REPORTING';
  expectedTime: Date;
  actualTime?: Date;
  status: 'PENDING' | 'COMPLETED' | 'DELAYED' | 'FAILED' | 'SKIPPED';
  responsible: 'INTERNAL' | 'COUNTERPARTY' | 'CUSTODIAN' | 'CLEARING_HOUSE' | 'THIRD_PARTY';
  notes?: string;
  alertThreshold: number; // minutes after expected time to trigger alert
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementAlert {
  id: string;
  instructionId: string;
  milestoneId?: string;
  alertType: 'DELAY' | 'FAILURE' | 'EXCEPTION' | 'DEADLINE_APPROACHING' | 'SLA_BREACH';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  expectedResolution?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface SettlementTimeline {
  instructionId: string;
  milestones: SettlementMilestone[];
  currentStatus: string;
  overallProgress: number; // 0-100
  estimatedCompletion: Date;
  delays: SettlementDelay[];
  criticalPath: string[];
  lastUpdated: Date;
}

export interface SettlementDelay {
  id: string;
  instructionId: string;
  milestoneId: string;
  delayType: 'COUNTERPARTY' | 'CUSTODIAN' | 'SYSTEM' | 'MARKET' | 'REGULATORY' | 'OPERATIONAL';
  delayReason: string;
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface SettlementSLA {
  securityType: string;
  settlementMethod: string;
  targetSettlementTime: number; // hours after trade date
  warningThreshold: number; // percentage of target time
  criticalThreshold: number; // percentage of target time
  maxAllowableDelay: number; // hours
}

export interface SettlementPerformanceMetrics {
  period: string;
  totalInstructions: number;
  settledOnTime: number;
  settledLate: number;
  failed: number;
  averageSettlementTime: number; // hours
  slaCompliance: number; // percentage
  topDelayReasons: { reason: string; count: number; averageDelay: number }[];
  worstPerformingCounterparties: { counterpartyId: string; lateSettlements: number; avgDelay: number }[];
}

export class SettlementTimelineTrackingService extends EventEmitter {
  private settlementInstructions: Map<string, SettlementInstruction>;
  private settlementMilestones: Map<string, SettlementMilestone[]>;
  private settlementAlerts: Map<string, SettlementAlert[]>;
  private settlementDelays: Map<string, SettlementDelay[]>;
  private slaDefinitions: Map<string, SettlementSLA>;
  private performanceMetrics: Map<string, SettlementPerformanceMetrics>;

  // Standard milestone templates for different security types
  private readonly MILESTONE_TEMPLATES = new Map([
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

  private initializeDefaultSLAs(): void {
    const defaultSLAs: SettlementSLA[] = [
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

  private startMonitoringTimer(): void {
    // Check for alerts every 5 minutes
    setInterval(() => {
      this.checkForAlerts();
    }, 5 * 60 * 1000);
  }

  public async createSettlementInstruction(instructionData: Omit<SettlementInstruction, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SettlementInstruction> {
    const instruction: SettlementInstruction = {
      ...instructionData,
      id: uuidv4(),
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

  private async createMilestoneTimeline(instruction: SettlementInstruction): Promise<any> {
    const securityType = await this.getSecurityType(instruction.securityId);
    const template = this.MILESTONE_TEMPLATES.get(securityType) || this.MILESTONE_TEMPLATES.get('EQUITY')!;
    
    const milestones: SettlementMilestone[] = template.map(template => {
      const expectedTime = new Date(instruction.tradeDate.getTime() + template.offsetHours * 60 * 60 * 1000);
      
      return {
        id: uuidv4(),
        instructionId: instruction.id,
        milestoneType: template.type as any,
        expectedTime,
        status: 'PENDING',
        responsible: template.responsible as any,
        alertThreshold: template.alertThreshold,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    this.settlementMilestones.set(instruction.id, milestones);
    this.settlementAlerts.set(instruction.id, []);
    this.settlementDelays.set(instruction.id, []);
  }

  public async updateMilestoneStatus(instructionId: string, milestoneType: string, status: 'COMPLETED' | 'DELAYED' | 'FAILED' | 'SKIPPED', notes?: string): Promise<any> {
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
    if (notes) milestone.notes = notes;

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

  private async updateInstructionStatus(instructionId: string): Promise<any> {
    const instruction = this.settlementInstructions.get(instructionId);
    const milestones = this.settlementMilestones.get(instructionId);
    
    if (!instruction || !milestones) return;

    const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
    const failedMilestones = milestones.filter(m => m.status === 'FAILED').length;
    const totalMilestones = milestones.length;

    let newStatus: SettlementInstruction['status'];

    if (failedMilestones > 0) {
      newStatus = 'FAILED';
    } else if (completedMilestones === totalMilestones) {
      newStatus = 'SETTLED';
    } else if (completedMilestones > 0) {
      newStatus = 'PROCESSING';
    } else {
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

  public async recordMilestoneDelay(instructionId: string, milestoneId: string, reason: string, estimatedDuration?: number): Promise<SettlementDelay> {
    const delays = this.settlementDelays.get(instructionId) || [];
    
    const delay: SettlementDelay = {
      id: uuidv4(),
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

  private classifyDelayType(reason: string): SettlementDelay['delayType'] {
    const reasonLower = reason.toLowerCase();
    
    if (reasonLower.includes('counterparty') || reasonLower.includes('client')) return 'COUNTERPARTY';
    if (reasonLower.includes('custodian') || reasonLower.includes('custody')) return 'CUSTODIAN';
    if (reasonLower.includes('system') || reasonLower.includes('technical')) return 'SYSTEM';
    if (reasonLower.includes('market') || reasonLower.includes('holiday')) return 'MARKET';
    if (reasonLower.includes('regulatory') || reasonLower.includes('compliance')) return 'REGULATORY';
    
    return 'OPERATIONAL';
  }

  private assessDelayImpact(instructionId: string, milestoneId: string): SettlementDelay['impact'] {
    const instruction = this.settlementInstructions.get(instructionId);
    const milestones = this.settlementMilestones.get(instructionId) || [];
    
    if (!instruction) return 'MEDIUM';

    // High priority instructions have higher impact
    if (instruction.priority === 'CRITICAL') return 'CRITICAL';
    if (instruction.priority === 'HIGH') return 'HIGH';

    // Large trades have higher impact
    const tradeValue = instruction.quantity * instruction.price;
    if (tradeValue > 10000000) return 'HIGH'; // >$10M
    if (tradeValue > 1000000) return 'MEDIUM'; // >$1M

    // Critical path milestones have higher impact
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone && ['FINAL_SETTLEMENT', 'CASH_CONFIRMATION', 'CUSTODY_CONFIRMATION'].includes(milestone.milestoneType)) {
      return 'HIGH';
    }

    return 'MEDIUM';
  }

  private generateMitigationActions(reason: string): string[] {
    const actions: string[] = [];
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

  private async createAlert(instructionId: string, milestoneId: string | undefined, alertType: SettlementAlert['alertType'], severity: SettlementAlert['severity'], message: string): Promise<SettlementAlert> {
    const alerts = this.settlementAlerts.get(instructionId) || [];
    
    const alert: SettlementAlert = {
      id: uuidv4(),
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

  private checkForAlerts(): void {
    const now = new Date();

    this.settlementInstructions.forEach((instruction, instructionId) => {
      if (instruction.status === 'SETTLED' || instruction.status === 'CANCELLED') return;

      const milestones = this.settlementMilestones.get(instructionId) || [];
      
      milestones.forEach(milestone => {
        if (milestone.status !== 'PENDING') return;

        const timeDiff = now.getTime() - milestone.expectedTime.getTime();
        const minutesLate = timeDiff / (60 * 1000);

        // Check if milestone is approaching deadline
        if (minutesLate > -30 && minutesLate <= 0) { // 30 minutes before expected time
          this.createAlert(instructionId, milestone.id, 'DEADLINE_APPROACHING', 'INFO', 
            `Milestone ${milestone.milestoneType} approaching deadline`);
        }

        // Check if milestone is delayed
        if (minutesLate > milestone.alertThreshold) {
          this.createAlert(instructionId, milestone.id, 'DELAY', 'WARNING', 
            `Milestone ${milestone.milestoneType} is ${Math.round(minutesLate)} minutes late`);
          
          this.recordMilestoneDelay(instructionId, milestone.id, 
            `Milestone exceeded threshold by ${Math.round(minutesLate)} minutes`, 
            Math.round(minutesLate));
        }

        // Check for SLA breach
        const slaKey = `${this.getSecurityTypeSync(instruction.securityId)}_${instruction.settlementMethod}`;
        const sla = this.slaDefinitions.get(slaKey);
        
        if (sla && milestone.milestoneType === 'FINAL_SETTLEMENT') {
          const hoursLate = timeDiff / (60 * 60 * 1000);
          const thresholdHours = sla.targetSettlementTime * (sla.criticalThreshold / 100);
          
          if (hoursLate > thresholdHours) {
            this.createAlert(instructionId, milestone.id, 'SLA_BREACH', 'CRITICAL', 
              `Settlement SLA breached by ${hoursLate.toFixed(1)} hours`);
          }
        }
      });
    });
  }

  public getSettlementTimeline(instructionId: string): SettlementTimeline | undefined {
    const instruction = this.settlementInstructions.get(instructionId);
    const milestones = this.settlementMilestones.get(instructionId);
    const delays = this.settlementDelays.get(instructionId) || [];

    if (!instruction || !milestones) return undefined;

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

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
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

  public resolveAlert(alertId: string): boolean {
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

  public getActiveAlerts(severity?: SettlementAlert['severity']): SettlementAlert[] {
    const allAlerts: SettlementAlert[] = [];
    
    this.settlementAlerts.forEach(alerts => {
      const activeAlerts = alerts.filter(a => !a.resolvedAt);
      allAlerts.push(...activeAlerts);
    });

    if (severity) {
      return allAlerts.filter(a => a.severity === severity);
    }

    return allAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public generatePerformanceReport(period: string, startDate: Date, endDate: Date): SettlementPerformanceMetrics {
    const instructions = Array.from(this.settlementInstructions.values())
      .filter(i => i.createdAt >= startDate && i.createdAt <= endDate);

    const settledInstructions = instructions.filter(i => i.status === 'SETTLED');
    const failedInstructions = instructions.filter(i => i.status === 'FAILED');
    
    // Calculate settlement times
    const settlementTimes = settledInstructions
      .filter(i => i.actualSettlementTime)
      .map(i => (i.actualSettlementTime!.getTime() - i.tradeDate.getTime()) / (60 * 60 * 1000)); // hours

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
    const allDelays: SettlementDelay[] = [];
    this.settlementDelays.forEach(delays => allDelays.push(...delays));
    
    const delayReasonCounts = new Map<string, { count: number; totalDelay: number }>();
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
    const counterpartyPerformance = new Map<string, { total: number; late: number; totalDelay: number }>();
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

    const metrics: SettlementPerformanceMetrics = {
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
  private async getSecurityType(securityId: string): Promise<string> {
    // Mock implementation - would typically call market data service
    return 'EQUITY';
  }

  private getSecurityTypeSync(securityId: string): string {
    // Mock implementation - would typically call market data service
    return 'EQUITY';
  }

  // Getter methods
  public getSettlementInstruction(instructionId: string): SettlementInstruction | undefined {
    return this.settlementInstructions.get(instructionId);
  }

  public getAllSettlementInstructions(): SettlementInstruction[] {
    return Array.from(this.settlementInstructions.values());
  }

  public getInstructionsByStatus(status: SettlementInstruction['status']): SettlementInstruction[] {
    return Array.from(this.settlementInstructions.values())
      .filter(instruction => instruction.status === status);
  }

  public getInstructionsByCounterparty(counterpartyId: string): SettlementInstruction[] {
    return Array.from(this.settlementInstructions.values())
      .filter(instruction => instruction.counterpartyId === counterpartyId);
  }

  public getPendingMilestones(): SettlementMilestone[] {
    const allMilestones: SettlementMilestone[] = [];
    this.settlementMilestones.forEach(milestones => {
      const pending = milestones.filter(m => m.status === 'PENDING');
      allMilestones.push(...pending);
    });
    return allMilestones.sort((a, b) => a.expectedTime.getTime() - b.expectedTime.getTime());
  }

  public getOverdueMilestones(): SettlementMilestone[] {
    const now = new Date();
    return this.getPendingMilestones()
      .filter(milestone => milestone.expectedTime < now);
  }
}

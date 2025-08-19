import { EventEmitter } from 'events';
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
    milestoneType: 'TRADE_CAPTURE' | 'TRADE_CONFIRMATION' | 'AFFIRMATION' | 'ALLOCATION' | 'SETTLEMENT_INSTRUCTION_SENT' | 'CUSTODY_CONFIRMATION' | 'CASH_CONFIRMATION' | 'FINAL_SETTLEMENT' | 'RECONCILIATION' | 'REPORTING';
    expectedTime: Date;
    actualTime?: Date;
    status: 'PENDING' | 'COMPLETED' | 'DELAYED' | 'FAILED' | 'SKIPPED';
    responsible: 'INTERNAL' | 'COUNTERPARTY' | 'CUSTODIAN' | 'CLEARING_HOUSE' | 'THIRD_PARTY';
    notes?: string;
    alertThreshold: number;
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
    overallProgress: number;
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
    estimatedDuration: number;
    actualDuration?: number;
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    mitigation: string[];
    createdAt: Date;
    resolvedAt?: Date;
}
export interface SettlementSLA {
    securityType: string;
    settlementMethod: string;
    targetSettlementTime: number;
    warningThreshold: number;
    criticalThreshold: number;
    maxAllowableDelay: number;
}
export interface SettlementPerformanceMetrics {
    period: string;
    totalInstructions: number;
    settledOnTime: number;
    settledLate: number;
    failed: number;
    averageSettlementTime: number;
    slaCompliance: number;
    topDelayReasons: {
        reason: string;
        count: number;
        averageDelay: number;
    }[];
    worstPerformingCounterparties: {
        counterpartyId: string;
        lateSettlements: number;
        avgDelay: number;
    }[];
}
export declare class SettlementTimelineTrackingService extends EventEmitter {
    private settlementInstructions;
    private settlementMilestones;
    private settlementAlerts;
    private settlementDelays;
    private slaDefinitions;
    private performanceMetrics;
    private readonly MILESTONE_TEMPLATES;
    constructor();
    private initializeDefaultSLAs;
    private startMonitoringTimer;
    createSettlementInstruction(instructionData: Omit<SettlementInstruction, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SettlementInstruction>;
    private createMilestoneTimeline;
    updateMilestoneStatus(instructionId: string, milestoneType: string, status: 'COMPLETED' | 'DELAYED' | 'FAILED' | 'SKIPPED', notes?: string): Promise<void>;
    private updateInstructionStatus;
    recordMilestoneDelay(instructionId: string, milestoneId: string, reason: string, estimatedDuration?: number): Promise<SettlementDelay>;
    private classifyDelayType;
    private assessDelayImpact;
    private generateMitigationActions;
    private createAlert;
    private checkForAlerts;
    getSettlementTimeline(instructionId: string): SettlementTimeline | undefined;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean;
    resolveAlert(alertId: string): boolean;
    getActiveAlerts(severity?: SettlementAlert['severity']): SettlementAlert[];
    generatePerformanceReport(period: string, startDate: Date, endDate: Date): SettlementPerformanceMetrics;
    private getSecurityType;
    private getSecurityTypeSync;
    getSettlementInstruction(instructionId: string): SettlementInstruction | undefined;
    getAllSettlementInstructions(): SettlementInstruction[];
    getInstructionsByStatus(status: SettlementInstruction['status']): SettlementInstruction[];
    getInstructionsByCounterparty(counterpartyId: string): SettlementInstruction[];
    getPendingMilestones(): SettlementMilestone[];
    getOverdueMilestones(): SettlementMilestone[];
}

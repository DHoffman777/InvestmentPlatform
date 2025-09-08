import { PrismaClient, Prisma } from '@prisma/client';
export interface TradeCapture {
    source: 'MANUAL' | 'BROKER_API' | 'FIX_FEED' | 'FILE_UPLOAD' | 'CUSTODIAN_FEED';
    externalTradeId: string;
    portfolioId: string;
    securityId: string;
    transactionType: 'BUY' | 'SELL';
    quantity: Prisma.Decimal;
    price: Prisma.Decimal;
    tradeDate: Date;
    settleDate?: Date;
    fees?: Prisma.Decimal;
    taxes?: Prisma.Decimal;
    commission?: Prisma.Decimal;
    counterparty?: string;
    orderId?: string;
    executionId?: string;
    venue?: string;
    rawData?: any;
}
export interface TransactionMatch {
    status: 'MATCHED' | 'UNMATCHED' | 'PARTIAL_MATCH' | 'DISCREPANCY';
    systemTransaction?: any;
    externalTransaction?: any;
    differences?: {
        field: string;
        systemValue: any;
        externalValue: any;
    }[];
    confidence: number;
}
export interface SettlementInstruction {
    transactionId: string;
    instructionType: 'DVP' | 'FREE_DELIVERY' | 'CASH_SETTLEMENT';
    deliveryDate: Date;
    settlementAmount: Prisma.Decimal;
    custodian: string;
    account: string;
    status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'SETTLED' | 'FAILED';
    dtcNumber?: string;
    contraParty?: string;
    specialInstructions?: string;
}
export interface FailedTrade {
    transactionId: string;
    failureReason: 'INSUFFICIENT_CASH' | 'INSUFFICIENT_SECURITIES' | 'SYSTEM_ERROR' | 'COMPLIANCE_VIOLATION' | 'SETTLEMENT_FAIL' | 'PRICING_ERROR';
    failureDate: Date;
    resolutionActions: string[];
    assignedTo?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    resolved: boolean;
    resolutionDate?: Date;
    notes?: string;
}
export declare class TransactionService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient);
    captureTradeFromSource(tradeData: TradeCapture): Promise<any>;
    matchTransactions(portfolioId: string, externalTransactions: any[], dateRange: {
        startDate: Date;
        endDate: Date;
    }): Promise<{
        matches: TransactionMatch[];
        unmatched: any[];
        summary: {
            totalExternal: number;
            totalMatched: number;
            totalUnmatched: number;
            totalDiscrepancies: number;
        };
    }>;
    createSettlementInstruction(instruction: SettlementInstruction): Promise<any>;
    updateSettlementStatus(instructionId: string, status: SettlementInstruction['status'], notes?: string): Promise<any>;
    createFailedTrade(failedTrade: FailedTrade): Promise<any>;
    processBulkTransactions(transactions: TradeCapture[]): Promise<{
        successful: any[];
        failed: Array<{
            trade: TradeCapture;
            error: string;
        }>;
        summary: {
            total: number;
            successful: number;
            failed: number;
        };
    }>;
    calculateCashImpact(portfolioId: string, dateRange: {
        startDate: Date;
        endDate: Date;
    }): Promise<{
        totalCashIn: Prisma.Decimal;
        totalCashOut: Prisma.Decimal;
        netCashFlow: Prisma.Decimal;
        transactions: Array<{
            transactionId: string;
            date: Date;
            type: string;
            amount: Prisma.Decimal;
            description: string;
        }>;
    }>;
    private calculateSettlementDate;
    private findPotentialMatches;
    private selectBestMatch;
    private identifyDifferences;
    private storeReconciliationResults;
}

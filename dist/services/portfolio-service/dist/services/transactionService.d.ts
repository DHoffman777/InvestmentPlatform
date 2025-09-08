export const __esModule: boolean;
export class TransactionService {
    constructor(prisma: any);
    prisma: any;
    kafkaService: kafka_mock_1.KafkaService;
    captureTradeFromSource(tradeData: any): Promise<any>;
    matchTransactions(portfolioId: any, externalTransactions: any, dateRange: any): Promise<{
        matches: ({
            status: string;
            externalTransaction: any;
            confidence: number;
            systemTransaction?: undefined;
            differences?: undefined;
        } | {
            status: string;
            systemTransaction: any;
            externalTransaction: any;
            differences: {
                field: string;
                systemValue: any;
                externalValue: any;
            }[];
            confidence: number;
        })[];
        unmatched: any[];
        summary: {
            totalExternal: any;
            totalMatched: number;
            totalUnmatched: number;
            totalDiscrepancies: number;
        };
    }>;
    createSettlementInstruction(instruction: any): Promise<any>;
    updateSettlementStatus(instructionId: any, status: any, notes: any): Promise<any>;
    createFailedTrade(failedTrade: any): Promise<any>;
    processBulkTransactions(transactions: any): Promise<{
        successful: any[];
        failed: any[];
        summary: {
            total: any;
            successful: number;
            failed: number;
        };
    }>;
    calculateCashImpact(portfolioId: any, dateRange: any): Promise<{
        totalCashIn: decimal_js_1.Decimal;
        totalCashOut: decimal_js_1.Decimal;
        netCashFlow: decimal_js_1.Decimal;
        transactions: any;
    }>;
    calculateSettlementDate(tradeDate: any, assetClass: any): Date;
    findPotentialMatches(externalTx: any, systemTransactions: any): any;
    selectBestMatch(externalTx: any, potentialMatches: any): {
        systemTx: any;
        confidence: number;
    };
    identifyDifferences(externalTx: any, systemTx: any): {
        field: string;
        systemValue: any;
        externalValue: any;
    }[];
    storeReconciliationResults(portfolioId: any, matches: any, dateRange: any): Promise<void>;
}
import kafka_mock_1 = require("../utils/kafka-mock");
import decimal_js_1 = require("decimal.js");

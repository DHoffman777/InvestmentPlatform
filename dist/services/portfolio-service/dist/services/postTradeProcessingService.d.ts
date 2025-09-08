export const __esModule: boolean;
export class PostTradeProcessingService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    createTradeConfirmation(request: any, tenantId: any, userId: any): Promise<any>;
    updateTradeConfirmation(request: any, tenantId: any, userId: any): Promise<any>;
    searchTradeConfirmations(request: any, tenantId: any): Promise<{
        confirmations: any;
        total: any;
        hasMore: boolean;
        searchCriteria: any;
    }>;
    createSettlementInstruction(request: any, tenantId: any, userId: any): Promise<any>;
    generateSettlementInstruction(confirmationId: any, tenantId: any, userId: any): Promise<any>;
    createTradeBreak(request: any, tenantId: any, userId: any): Promise<any>;
    resolveTradeBreak(breakId: any, resolutionNotes: any, tenantId: any, userId: any): Promise<any>;
    runTransactionCostAnalysis(request: any, tenantId: any, userId: any): Promise<any>;
    sendCustodianMessage(request: any, tenantId: any, userId: any): Promise<any>;
    createRegulatoryReport(request: any, tenantId: any, userId: any): Promise<any>;
    matchTrade(request: any, tenantId: any, userId: any): Promise<any>;
    getPostTradeProcessingSummary(tenantId: any): Promise<{
        totalTradeConfirmations: any;
        pendingConfirmations: any;
        confirmedTrades: any;
        rejectedTrades: any;
        totalSettlementInstructions: any;
        pendingSettlements: any;
        settledInstructions: any;
        failedSettlements: any;
        totalTradeBreaks: any;
        openBreaks: any;
        criticalBreaks: any;
        averageResolutionTimeHours: number;
        regulatoryReportsThisPeriod: any;
        pendingReports: any;
        submittedReports: any;
    }>;
    generateConfirmationReference(): string;
    getCounterpartyName(counterpartyId: any, tenantId: any): Promise<any>;
    sendTradeConfirmation(confirmationId: any, tenantId: any): Promise<void>;
    sendSettlementInstructionToCustodian(instructionId: any, tenantId: any): Promise<void>;
    calculateBreakPriority(severity: any): 2 | 1 | 4 | 3;
    calculateSlaDeadline(severity: any): Date;
    autoAssignTradeBreak(breakId: any, tenantId: any): Promise<void>;
    sendCriticalBreakNotification(breakId: any, tenantId: any): Promise<void>;
    getMarketDataForTCA(securityId: any, analysisDate: any, tenantId: any): Promise<{
        volatility: number;
        averageDailyVolume: number;
        marketCap: number;
    }>;
    calculateTCABenchmarks(order: any, marketData: any): Promise<{
        arrivalPrice: any;
        vwapPrice: number;
        twapPrice: number;
        closingPrice: number;
    }>;
    calculateTCACosts(order: any, benchmarks: any): Promise<{
        marketImpact: number;
        timing: number;
        spread: number;
        commission: number;
    }>;
    calculateTCAPerformance(order: any, benchmarks: any, costs: any): {
        implementationShortfall: number;
        implementationShortfallBps: number;
        priceImprovementBps: number;
        performanceVsVwap: number;
        performanceVsTwap: number;
        performanceVsArrival: number;
        performanceVsClose: number;
        managerPerformance: number;
        marketMovement: number;
        timingDecision: number;
    };
    calculateDataQualityScore(order: any, marketData: any): number;
    transmitMessageToCustodian(messageId: any, tenantId: any): Promise<void>;
    generateRegulatoryReportContent(reportId: any, tenantId: any): Promise<void>;
    getExternalTradeData(externalTradeId: any): Promise<{}>;
    performTradeMatching(internalTrade: any, externalTrade: any, request: any): {
        status: string;
        confidence: number;
        instrumentMatched: boolean;
        quantityMatched: boolean;
        priceMatched: boolean;
        settlementDateMatched: boolean;
        counterpartyMatched: boolean;
    };
    createTradeBreakFromMatch(matchId: any, matchResult: any, tenantId: any, userId: any): Promise<void>;
    calculateAverageResolutionTime(tenantId: any): Promise<number>;
}

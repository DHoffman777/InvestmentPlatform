export const __esModule: boolean;
export class PerformanceMeasurementService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    calculatePerformance(request: any, tenantId: any, userId: any): Promise<{
        performancePeriod: any;
        attribution: any;
        benchmarkComparison: any;
        warnings: any[];
        calculationTime: number;
    }>;
    calculateTimeWeightedReturn(portfolio: any, beginningValue: any, endingValue: any, periodStart: any, periodEnd: any, cashFlows: any, cashFlowTiming: any): Promise<number>;
    calculateMoneyWeightedReturn(beginningValue: any, endingValue: any, cashFlows: any): Promise<number>;
    calculateModifiedDietz(beginningValue: any, endingValue: any, cashFlows: any, periodStart: any, periodEnd: any): Promise<number>;
    calculateRiskMetrics(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<{
        volatility: number;
        standardDeviation: number;
        downsideDeviation: number;
        maxDrawdown: number;
        maxDrawdownDuration: number;
    }>;
    calculateRiskAdjustedMetrics(portfolioReturn: any, volatility: any, downsideDeviation: any, maxDrawdown: any, tenantId: any): Promise<{
        sharpeRatio: number;
        sortinoRatio: number;
        calmarRatio: number;
        treynorRatio: number;
        jensenAlpha: number;
        beta: number;
    }>;
    calculateBenchmarkComparison(portfolioId: any, benchmarkId: any, periodStart: any, periodEnd: any, portfolioReturn: any, portfolioVolatility: any, tenantId: any, userId: any): Promise<any>;
    calculatePerformanceAttribution(performancePeriodId: any, portfolioId: any, periodStart: any, periodEnd: any, benchmarkId: any, tenantId: any, userId: any): Promise<any>;
    calculateSimpleReturn(beginningValue: any, endingValue: any, netCashFlows: any): number;
    calculateNetReturn(grossReturn: any, fees: any, beginningValue: any): number;
    calculateIRR(cashFlows: any, guess?: number): number;
    calculateMaxDrawdown(returns: any): {
        maxDrawdown: number;
        maxDrawdownDuration: number;
    };
    daysBetween(date1: any, date2: any): number;
    getCashFlowsForDate(flows: any, date: any): any;
    calculateDataQualityScore(portfolio: any, cashFlows: any): number;
    hasSignificantCashFlows(cashFlows: any, beginningValue: any): boolean;
    getPortfolioWithTransactions(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<any>;
    getPortfolioValue(portfolioId: any, date: any, tenantId: any): Promise<any>;
    getCashFlows(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<{
        flows: any;
        totalCashFlows: any;
        netCashFlows: any;
        contributions: any;
        withdrawals: any;
    }>;
    calculateFees(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<{
        managementFees: any;
        performanceFees: any;
        otherFees: any;
    }>;
    getDailyPortfolioValues(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<{
        date: Date;
        value: any;
    }[]>;
    getDailyReturns(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<number[]>;
    getHighWaterMark(portfolioId: any, asOfDate: any, tenantId: any): Promise<any>;
    isRebalancingPeriod(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<boolean>;
    getRiskFreeRate(tenantId: any): Promise<number>;
    getBenchmarkReturn(benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<number>;
    getBenchmarkVolatility(benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<number>;
    calculateTrackingError(portfolioId: any, benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<number>;
    calculateCorrelation(portfolioId: any, benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<number>;
    calculateBeta(portfolioId: any, benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<number>;
    calculateCaptureRatios(portfolioId: any, benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<{
        upCaptureRatio: number;
        downCaptureRatio: number;
    }>;
    calculateHitRate(portfolioId: any, benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<number>;
    calculateSharpeRatio(portfolioReturn: any, volatility: any, tenantId: any): Promise<number>;
    getPortfolioHoldings(portfolioId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<any[]>;
    getBenchmarkHoldings(benchmarkId: any, periodStart: any, periodEnd: any, tenantId: any): Promise<any[]>;
    calculateSectorAttribution(portfolioHoldings: any, benchmarkHoldings: any): Promise<any[]>;
}

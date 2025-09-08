export const __esModule: boolean;
export class OrderManagementService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    createOrder(request: any, tenantId: any, userId: any): Promise<any>;
    modifyOrder(request: any, tenantId: any, userId: any): Promise<any>;
    cancelOrder(request: any, tenantId: any, userId: any): Promise<any>;
    recordExecution(orderId: any, executionPrice: any, executionQuantity: any, executionVenue: any, executionVenueType: any, tenantId: any, reportedBy: any): Promise<any>;
    searchOrders(request: any, tenantId: any): Promise<{
        orders: any;
        total: any;
        hasMore: boolean;
        searchCriteria: any;
    }>;
    getOrderById(orderId: any, tenantId: any): Promise<any>;
    validateOrder(request: any, tenantId: any): Promise<{
        orderId: string;
        isValid: boolean;
        errors: string[];
        warnings: string[];
        riskScore: number;
        estimatedCosts: {
            estimatedCommission: number;
            estimatedFees: number;
            estimatedMarketImpact: number;
            estimatedTotalCost: number;
            priceImpactBps: number;
        };
    }>;
    performPreTradeChecks(orderId: any, tenantId: any): Promise<void>;
    generateBestExecutionReport(orderId: any, tenantId: any): Promise<{
        orderId: any;
        executionQuality: {
            implementation_shortfall: number;
            priceImprovement: number;
            fillRate: number;
            averageExecutionTime: number;
            slippage: number;
        };
        benchmarkComparison: {
            vwap: number;
            twap: number;
            arrivalPrice: number;
            closePrice: number;
            performanceVsVwap: number;
            performanceVsTwap: number;
        };
        venueAnalysis: any[];
        recommendations: string[];
        generatedAt: Date;
    }>;
    generateClientOrderId(): string;
    generateExecutionId(): string;
    generateTradeId(): string;
    getCurrentTradingSession(): "REGULAR" | "PRE_MARKET" | "POST_MARKET";
    getInstrumentCurrency(securityId: any, tenantId: any): Promise<any>;
    canModifyOrder(order: any): boolean;
    canCancelOrder(order: any): boolean;
    calculateSettlementDate(tradeDate: any): Date;
    calculateOrderRiskScore(request: any, portfolio: any, instrument: any, tenantId: any): Promise<number>;
    estimateOrderCosts(request: any, instrument: any, tenantId: any): Promise<{
        estimatedCommission: number;
        estimatedFees: number;
        estimatedMarketImpact: number;
        estimatedTotalCost: number;
        priceImpactBps: number;
    }>;
    getCurrentPosition(portfolioId: any, securityId: any, tenantId: any): Promise<any>;
    getPortfolioValue(portfolioId: any, tenantId: any): Promise<any>;
    getRestrictedInstruments(tenantId: any): Promise<any[]>;
    checkConcentrationLimits(order: any, tenantId: any): Promise<{
        passed: boolean;
        severity: OrderManagement_1.ComplianceSeverity;
        message: string;
    }>;
    createOrderAllocations(orderId: any, allocations: any, tenantId: any): Promise<void>;
    createSmartOrderRouting(orderId: any, routingInstructions: any, tenantId: any): Promise<void>;
    processExecutionAllocations(orderId: any, execution: any, tenantId: any): Promise<void>;
    getHistoricalMarketData(securityId: any, date: any, tenantId: any): Promise<{}>;
    calculateExecutionQuality(order: any, marketData: any): {
        implementation_shortfall: number;
        priceImprovement: number;
        fillRate: number;
        averageExecutionTime: number;
        slippage: number;
    };
    calculateBenchmarkComparison(order: any, marketData: any): {
        vwap: number;
        twap: number;
        arrivalPrice: number;
        closePrice: number;
        performanceVsVwap: number;
        performanceVsTwap: number;
    };
    analyzeVenuePerformance(executions: any): any[];
    generateExecutionRecommendations(executionQuality: any, benchmarkComparison: any, venueAnalysis: any): string[];
}
import OrderManagement_1 = require("../models/trading/OrderManagement");

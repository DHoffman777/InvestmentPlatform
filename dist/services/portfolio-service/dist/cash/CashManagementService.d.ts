export const __esModule: boolean;
export default CashManagementService;
/**
 * Comprehensive Cash Management and Sweep Service
 * Handles cash optimization, sweep programs, and liquidity management
 */
export class CashManagementService extends events_1<[never]> {
    constructor();
    cashAccounts: Map<any, any>;
    sweepPrograms: Map<any, any>;
    transactions: Map<any, any>;
    forecasts: Map<any, any>;
    /**
     * Create new cash account
     */
    createCashAccount(account: any): Promise<any>;
    /**
     * Set up automated sweep program
     */
    createSweepProgram(portfolioId: any, baseCashAccount: any, sweepConfig: any): Promise<any>;
    /**
     * Execute cash sweep for portfolio
     */
    executeCashSweep(portfolioId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        portfolioId: any;
        accountId: any;
        type: string;
        amount: any;
        currency: string;
        description: string;
        transactionDate: Date;
        settlementDate: Date;
        status: string;
        category: string;
        metadata: {
            sweepTransaction: boolean;
            destinationAccount: any;
        };
    }[]>;
    /**
     * Process cash transaction
     */
    processCashTransaction(transaction: any): Promise<any>;
    /**
     * Generate cash flow forecast
     */
    generateCashForecast(portfolioId: any, forecastDays?: number): Promise<{
        portfolioId: any;
        forecastDate: Date;
        projectedBalance: any;
        cashInflows: {
            date: Date;
            amount: number;
            type: string;
            description: string;
            confidence: string;
            category: string;
        }[];
        cashOutflows: {
            date: Date;
            amount: number;
            type: string;
            description: string;
            confidence: string;
            category: string;
        }[];
        netCashFlow: number;
        liquidityNeed: number;
        recommendedActions: ({
            type: string;
            amount: any;
            security: string;
            priority: string;
            description: string;
            estimatedYield?: undefined;
        } | {
            type: string;
            amount: number;
            priority: string;
            description: string;
            estimatedYield: number;
            security?: undefined;
        })[];
    }>;
    /**
     * Analyze liquidity profile
     */
    analyzeLiquidityProfile(portfolioId: any, portfolioPositions: any): {
        portfolioId: any;
        totalCash: any;
        availableCash: any;
        emergencyReserve: number;
        targetCashLevel: number;
        liquidityRatio: number;
        daysOfExpenses: number;
        liquidSecurities: number;
        illiquidSecurities: number;
        liquidityScore: number;
    };
    /**
     * Optimize cash yield
     */
    optimizeCashYield(portfolioId: any): {
        currentYield: number;
        optimizedYield: number;
        potentialIncrease: number;
        recommendations: {
            action: string;
            amount: number;
            fromAccount: any;
            toAccount: string;
            expectedYield: number;
            risk: string;
            liquidity: string;
            timeline: string;
        }[];
        riskLevel: string;
        implementation: string;
    };
    /**
     * Get cash position summary
     */
    getCashPositionSummary(portfolioId: any): {
        totalCash: any;
        availableCash: any;
        pendingTransactions: any;
        accountCount: number;
        averageYield: number;
        fdipCoverage: any;
    };
    performSweep(program: any, excessCash: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        portfolioId: any;
        accountId: any;
        type: string;
        amount: any;
        currency: string;
        description: string;
        transactionDate: Date;
        settlementDate: Date;
        status: string;
        category: string;
        metadata: {
            sweepTransaction: boolean;
            destinationAccount: any;
        };
    }[]>;
    createSweepTransaction(portfolioId: any, fromAccountId: any, toAccountId: any, amount: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        portfolioId: any;
        accountId: any;
        type: string;
        amount: any;
        currency: string;
        description: string;
        transactionDate: Date;
        settlementDate: Date;
        status: string;
        category: string;
        metadata: {
            sweepTransaction: boolean;
            destinationAccount: any;
        };
    }>;
    validateSweepDestinations(destinations: any): Promise<void>;
    calculateMaxSweepAmount(program: any, destination: any): any;
    updateAccountBalance(accountId: any, transactionType: any, amount: any): Promise<void>;
    getTotalCashBalance(portfolioId: any): any;
    getAvailableCashBalance(portfolioId: any): any;
    getHistoricalTransactions(portfolioId: any, days: any): any[];
    projectCashInflows(historical: any, startDate: any, endDate: any): {
        date: Date;
        amount: number;
        type: string;
        description: string;
        confidence: string;
        category: string;
    }[];
    projectCashOutflows(historical: any, startDate: any, endDate: any): {
        date: Date;
        amount: number;
        type: string;
        description: string;
        confidence: string;
        category: string;
    }[];
    calculateLiquidityNeed(portfolioId: any, outflows: any): number;
    generateCashActions(projectedBalance: any, liquidityNeed: any, inflows: any, outflows: any): ({
        type: string;
        amount: any;
        security: string;
        priority: string;
        description: string;
        estimatedYield?: undefined;
    } | {
        type: string;
        amount: number;
        priority: string;
        description: string;
        estimatedYield: number;
        security?: undefined;
    })[];
    isLiquidSecurity(position: any): boolean;
    estimateMonthlyExpenses(portfolioId: any): number;
    calculateLiquidityScore(liquidityRatio: any, daysOfExpenses: any, cashRatio: any): number;
    generateYieldRecommendations(accounts: any): {
        action: string;
        amount: number;
        fromAccount: any;
        toAccount: string;
        expectedYield: number;
        risk: string;
        liquidity: string;
        timeline: string;
    }[];
    assessOptimizationRisk(recommendations: any): "low" | "medium" | "high";
    startSweepScheduler(): void;
    startForecastingEngine(): void;
}
import events_1 = require("events");

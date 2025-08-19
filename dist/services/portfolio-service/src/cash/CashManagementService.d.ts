import { EventEmitter } from 'events';
export interface CashAccount {
    id: string;
    portfolioId: string;
    accountType: 'checking' | 'savings' | 'money_market' | 'sweep' | 'settlement';
    currency: string;
    balance: number;
    availableBalance: number;
    pendingCredits: number;
    pendingDebits: number;
    interestRate: number;
    minimumBalance: number;
    maximumBalance?: number;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    fdic: boolean;
    fdipCoverage: number;
    active: boolean;
    createdAt: Date;
    lastActivity: Date;
}
export interface SweepProgram {
    id: string;
    name: string;
    portfolioId: string;
    baseCashAccount: string;
    sweepAccounts: SweepDestination[];
    sweepThreshold: number;
    targetBalance: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'real_time';
    nextSweepDate: Date;
    active: boolean;
    priority: number;
    restrictions: SweepRestriction[];
}
export interface SweepDestination {
    accountId: string;
    accountType: 'money_market' | 'cd' | 'treasury' | 'savings';
    bankName: string;
    interestRate: number;
    minimumDeposit: number;
    maximumDeposit?: number;
    maturityDays?: number;
    fdip: boolean;
    fdipCoverage: number;
    priority: number;
    active: boolean;
}
export interface SweepRestriction {
    type: 'max_per_bank' | 'max_per_account' | 'min_liquidity' | 'regulatory_limit';
    value: number;
    description: string;
}
export interface CashTransaction {
    id: string;
    portfolioId: string;
    accountId: string;
    type: 'credit' | 'debit' | 'transfer' | 'sweep' | 'interest' | 'fee';
    amount: number;
    currency: string;
    description: string;
    referenceId?: string;
    transactionDate: Date;
    settlementDate: Date;
    status: 'pending' | 'settled' | 'failed' | 'cancelled';
    category: 'trade_settlement' | 'dividend' | 'interest' | 'fee' | 'transfer' | 'deposit' | 'withdrawal';
    metadata: Record<string, any>;
}
export interface CashForecast {
    portfolioId: string;
    forecastDate: Date;
    projectedBalance: number;
    cashInflows: CashFlow[];
    cashOutflows: CashFlow[];
    netCashFlow: number;
    liquidityNeed: number;
    recommendedActions: CashAction[];
}
export interface CashFlow {
    date: Date;
    amount: number;
    type: string;
    description: string;
    confidence: 'high' | 'medium' | 'low';
    category: string;
}
export interface CashAction {
    type: 'sweep' | 'transfer' | 'liquidate' | 'borrow';
    amount: number;
    fromAccount?: string;
    toAccount?: string;
    security?: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedYield?: number;
}
export interface LiquidityProfile {
    portfolioId: string;
    totalCash: number;
    availableCash: number;
    emergencyReserve: number;
    targetCashLevel: number;
    liquidityRatio: number;
    daysOfExpenses: number;
    liquidSecurities: number;
    illiquidSecurities: number;
    liquidityScore: number;
}
export interface YieldOptimization {
    currentYield: number;
    optimizedYield: number;
    potentialIncrease: number;
    recommendations: YieldRecommendation[];
    riskLevel: 'low' | 'medium' | 'high';
    implementation: 'immediate' | 'gradual' | 'long_term';
}
export interface YieldRecommendation {
    action: 'move_to_higher_yield' | 'ladder_cds' | 'treasury_bills' | 'money_market';
    amount: number;
    fromAccount: string;
    toAccount: string;
    expectedYield: number;
    risk: string;
    liquidity: string;
    timeline: string;
}
/**
 * Comprehensive Cash Management and Sweep Service
 * Handles cash optimization, sweep programs, and liquidity management
 */
export declare class CashManagementService extends EventEmitter {
    private cashAccounts;
    private sweepPrograms;
    private transactions;
    private forecasts;
    constructor();
    /**
     * Create new cash account
     */
    createCashAccount(account: Omit<CashAccount, 'id' | 'createdAt' | 'lastActivity'>): Promise<CashAccount>;
    /**
     * Set up automated sweep program
     */
    createSweepProgram(portfolioId: string, baseCashAccount: string, sweepConfig: Omit<SweepProgram, 'id' | 'portfolioId' | 'baseCashAccount'>): Promise<SweepProgram>;
    /**
     * Execute cash sweep for portfolio
     */
    executeCashSweep(portfolioId: string): Promise<CashTransaction[]>;
    /**
     * Process cash transaction
     */
    processCashTransaction(transaction: Omit<CashTransaction, 'id' | 'transactionDate'>): Promise<CashTransaction>;
    /**
     * Generate cash flow forecast
     */
    generateCashForecast(portfolioId: string, forecastDays?: number): Promise<CashForecast>;
    /**
     * Analyze liquidity profile
     */
    analyzeLiquidityProfile(portfolioId: string, portfolioPositions: any[]): LiquidityProfile;
    /**
     * Optimize cash yield
     */
    optimizeCashYield(portfolioId: string): YieldOptimization;
    /**
     * Get cash position summary
     */
    getCashPositionSummary(portfolioId: string): {
        totalCash: number;
        availableCash: number;
        pendingTransactions: number;
        accountCount: number;
        averageYield: number;
        fdipCoverage: number;
    };
    private performSweep;
    private createSweepTransaction;
    private validateSweepDestinations;
    private calculateMaxSweepAmount;
    private updateAccountBalance;
    private getTotalCashBalance;
    private getAvailableCashBalance;
    private getHistoricalTransactions;
    private projectCashInflows;
    private projectCashOutflows;
    private calculateLiquidityNeed;
    private generateCashActions;
    private isLiquidSecurity;
    private estimateMonthlyExpenses;
    private calculateLiquidityScore;
    private generateYieldRecommendations;
    private assessOptimizationRisk;
    private startSweepScheduler;
    private startForecastingEngine;
}
export default CashManagementService;

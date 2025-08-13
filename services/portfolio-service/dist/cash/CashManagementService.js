"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashManagementService = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
/**
 * Comprehensive Cash Management and Sweep Service
 * Handles cash optimization, sweep programs, and liquidity management
 */
class CashManagementService extends events_1.EventEmitter {
    cashAccounts = new Map();
    sweepPrograms = new Map();
    transactions = new Map();
    forecasts = new Map();
    constructor() {
        super();
        this.startSweepScheduler();
        this.startForecastingEngine();
    }
    /**
     * Create new cash account
     */
    async createCashAccount(account) {
        try {
            const accountId = (0, crypto_1.randomUUID)();
            const now = new Date();
            const newAccount = {
                ...account,
                id: accountId,
                createdAt: now,
                lastActivity: now
            };
            this.cashAccounts.set(accountId, newAccount);
            this.emit('cashAccountCreated', {
                accountId,
                portfolioId: account.portfolioId,
                accountType: account.accountType,
                currency: account.currency,
                balance: account.balance,
                timestamp: now
            });
            return newAccount;
        }
        catch (error) {
            this.emit('cashManagementError', {
                operation: 'create_account',
                portfolioId: account.portfolioId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Set up automated sweep program
     */
    async createSweepProgram(portfolioId, baseCashAccount, sweepConfig) {
        try {
            const programId = (0, crypto_1.randomUUID)();
            const sweepProgram = {
                id: programId,
                portfolioId,
                baseCashAccount,
                ...sweepConfig
            };
            // Validate sweep destinations
            await this.validateSweepDestinations(sweepProgram.sweepAccounts);
            this.sweepPrograms.set(programId, sweepProgram);
            this.emit('sweepProgramCreated', {
                programId,
                portfolioId,
                baseCashAccount,
                destinationCount: sweepProgram.sweepAccounts.length,
                sweepThreshold: sweepProgram.sweepThreshold,
                timestamp: new Date()
            });
            return sweepProgram;
        }
        catch (error) {
            this.emit('sweepError', {
                operation: 'create_program',
                portfolioId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Execute cash sweep for portfolio
     */
    async executeCashSweep(portfolioId) {
        try {
            const sweepPrograms = Array.from(this.sweepPrograms.values())
                .filter(p => p.portfolioId === portfolioId && p.active)
                .sort((a, b) => b.priority - a.priority);
            const sweepTransactions = [];
            for (const program of sweepPrograms) {
                const baseAccount = this.cashAccounts.get(program.baseCashAccount);
                if (!baseAccount)
                    continue;
                const excessCash = baseAccount.availableBalance - program.targetBalance;
                if (excessCash > program.sweepThreshold) {
                    const sweepResults = await this.performSweep(program, excessCash);
                    sweepTransactions.push(...sweepResults);
                }
            }
            if (sweepTransactions.length > 0) {
                this.emit('cashSweptCompleted', {
                    portfolioId,
                    transactionCount: sweepTransactions.length,
                    totalSwept: sweepTransactions.reduce((sum, t) => sum + t.amount, 0),
                    timestamp: new Date()
                });
            }
            return sweepTransactions;
        }
        catch (error) {
            this.emit('sweepError', {
                operation: 'execute_sweep',
                portfolioId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Process cash transaction
     */
    async processCashTransaction(transaction) {
        try {
            const transactionId = (0, crypto_1.randomUUID)();
            const now = new Date();
            const newTransaction = {
                ...transaction,
                id: transactionId,
                transactionDate: now
            };
            // Validate account exists and has sufficient balance for debits
            const account = this.cashAccounts.get(transaction.accountId);
            if (!account) {
                throw new Error('Cash account not found');
            }
            if (transaction.type === 'debit' && account.availableBalance < transaction.amount) {
                throw new Error('Insufficient funds');
            }
            // Update account balance
            await this.updateAccountBalance(transaction.accountId, transaction.type, transaction.amount);
            this.transactions.set(transactionId, newTransaction);
            this.emit('cashTransactionProcessed', {
                transactionId,
                portfolioId: transaction.portfolioId,
                accountId: transaction.accountId,
                type: transaction.type,
                amount: transaction.amount,
                timestamp: now
            });
            // Check if sweep is needed after transaction
            if (transaction.type === 'credit') {
                setTimeout(() => this.executeCashSweep(transaction.portfolioId), 1000);
            }
            return newTransaction;
        }
        catch (error) {
            this.emit('transactionError', {
                portfolioId: transaction.portfolioId,
                accountId: transaction.accountId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Generate cash flow forecast
     */
    async generateCashForecast(portfolioId, forecastDays = 30) {
        try {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + forecastDays * 24 * 60 * 60 * 1000);
            // Get historical transactions for pattern analysis
            const historicalTransactions = this.getHistoricalTransactions(portfolioId, 90);
            // Project cash flows
            const cashInflows = this.projectCashInflows(historicalTransactions, startDate, endDate);
            const cashOutflows = this.projectCashOutflows(historicalTransactions, startDate, endDate);
            const netCashFlow = cashInflows.reduce((sum, flow) => sum + flow.amount, 0) -
                cashOutflows.reduce((sum, flow) => sum + flow.amount, 0);
            // Calculate current cash position
            const currentCash = this.getTotalCashBalance(portfolioId);
            const projectedBalance = currentCash + netCashFlow;
            // Assess liquidity needs
            const liquidityNeed = this.calculateLiquidityNeed(portfolioId, cashOutflows);
            // Generate recommendations
            const recommendedActions = this.generateCashActions(projectedBalance, liquidityNeed, cashInflows, cashOutflows);
            const forecast = {
                portfolioId,
                forecastDate: new Date(),
                projectedBalance,
                cashInflows,
                cashOutflows,
                netCashFlow,
                liquidityNeed,
                recommendedActions
            };
            this.forecasts.set(portfolioId, forecast);
            this.emit('forecastGenerated', {
                portfolioId,
                forecastDays,
                projectedBalance,
                netCashFlow,
                liquidityNeed,
                actionCount: recommendedActions.length,
                timestamp: new Date()
            });
            return forecast;
        }
        catch (error) {
            this.emit('forecastError', {
                portfolioId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Analyze liquidity profile
     */
    analyzeLiquidityProfile(portfolioId, portfolioPositions) {
        const totalCash = this.getTotalCashBalance(portfolioId);
        const availableCash = this.getAvailableCashBalance(portfolioId);
        // Calculate liquid vs illiquid securities
        let liquidSecurities = 0;
        let illiquidSecurities = 0;
        for (const position of portfolioPositions) {
            if (this.isLiquidSecurity(position)) {
                liquidSecurities += position.marketValue;
            }
            else {
                illiquidSecurities += position.marketValue;
            }
        }
        const totalPortfolioValue = totalCash + liquidSecurities + illiquidSecurities;
        const liquidityRatio = (totalCash + liquidSecurities) / totalPortfolioValue;
        // Estimate monthly expenses (simplified)
        const monthlyExpenses = this.estimateMonthlyExpenses(portfolioId);
        const daysOfExpenses = monthlyExpenses > 0 ? (availableCash / monthlyExpenses) * 30 : 365;
        // Calculate emergency reserve (3-6 months of expenses)
        const emergencyReserve = monthlyExpenses * 4;
        const targetCashLevel = Math.max(emergencyReserve, totalPortfolioValue * 0.05); // Min 5% in cash
        // Calculate liquidity score (0-100)
        const liquidityScore = this.calculateLiquidityScore(liquidityRatio, daysOfExpenses, availableCash / targetCashLevel);
        return {
            portfolioId,
            totalCash,
            availableCash,
            emergencyReserve,
            targetCashLevel,
            liquidityRatio: liquidityRatio * 100,
            daysOfExpenses,
            liquidSecurities,
            illiquidSecurities,
            liquidityScore
        };
    }
    /**
     * Optimize cash yield
     */
    optimizeCashYield(portfolioId) {
        const cashAccounts = Array.from(this.cashAccounts.values())
            .filter(account => account.portfolioId === portfolioId && account.active);
        let totalCash = 0;
        let currentYield = 0;
        // Calculate current weighted yield
        for (const account of cashAccounts) {
            totalCash += account.balance;
            currentYield += account.balance * account.interestRate;
        }
        currentYield = totalCash > 0 ? currentYield / totalCash : 0;
        // Generate optimization recommendations
        const recommendations = this.generateYieldRecommendations(cashAccounts);
        // Calculate optimized yield
        let optimizedYield = currentYield;
        for (const rec of recommendations) {
            optimizedYield += (rec.amount / totalCash) * (rec.expectedYield - currentYield);
        }
        const potentialIncrease = optimizedYield - currentYield;
        return {
            currentYield: currentYield * 100,
            optimizedYield: optimizedYield * 100,
            potentialIncrease: potentialIncrease * 100,
            recommendations,
            riskLevel: this.assessOptimizationRisk(recommendations),
            implementation: potentialIncrease > 0.005 ? 'immediate' : 'gradual' // 0.5% threshold
        };
    }
    /**
     * Get cash position summary
     */
    getCashPositionSummary(portfolioId) {
        const accounts = Array.from(this.cashAccounts.values())
            .filter(account => account.portfolioId === portfolioId && account.active);
        const totalCash = accounts.reduce((sum, account) => sum + account.balance, 0);
        const availableCash = accounts.reduce((sum, account) => sum + account.availableBalance, 0);
        const pendingTransactions = accounts.reduce((sum, account) => sum + account.pendingCredits + account.pendingDebits, 0);
        const weightedYield = accounts.reduce((sum, account) => sum + account.balance * account.interestRate, 0);
        const averageYield = totalCash > 0 ? weightedYield / totalCash : 0;
        const fdipCoverage = accounts.reduce((sum, account) => sum + (account.fdic ? Math.min(account.balance, account.fdipCoverage) : 0), 0);
        return {
            totalCash,
            availableCash,
            pendingTransactions,
            accountCount: accounts.length,
            averageYield: averageYield * 100,
            fdipCoverage
        };
    }
    // Private helper methods
    async performSweep(program, excessCash) {
        const transactions = [];
        let remainingCash = excessCash;
        // Sort destinations by priority and yield
        const destinations = program.sweepAccounts
            .filter(dest => dest.active)
            .sort((a, b) => b.priority - a.priority || b.interestRate - a.interestRate);
        for (const destination of destinations) {
            if (remainingCash <= 0)
                break;
            // Check destination constraints
            const sweepAmount = Math.min(remainingCash, destination.maximumDeposit || remainingCash, this.calculateMaxSweepAmount(program, destination));
            if (sweepAmount >= destination.minimumDeposit) {
                const transaction = await this.createSweepTransaction(program.portfolioId, program.baseCashAccount, destination.accountId, sweepAmount);
                transactions.push(transaction);
                remainingCash -= sweepAmount;
            }
        }
        return transactions;
    }
    async createSweepTransaction(portfolioId, fromAccountId, toAccountId, amount) {
        const transaction = {
            id: (0, crypto_1.randomUUID)(),
            portfolioId,
            accountId: fromAccountId,
            type: 'transfer',
            amount,
            currency: 'USD', // Would be determined from account
            description: `Automatic cash sweep to ${toAccountId}`,
            transactionDate: new Date(),
            settlementDate: new Date(),
            status: 'settled',
            category: 'transfer',
            metadata: {
                sweepTransaction: true,
                destinationAccount: toAccountId
            }
        };
        this.transactions.set(transaction.id, transaction);
        return transaction;
    }
    async validateSweepDestinations(destinations) {
        for (const dest of destinations) {
            if (dest.minimumDeposit <= 0) {
                throw new Error(`Invalid minimum deposit for destination ${dest.accountId}`);
            }
            if (dest.maximumDeposit && dest.maximumDeposit < dest.minimumDeposit) {
                throw new Error(`Maximum deposit less than minimum for destination ${dest.accountId}`);
            }
        }
    }
    calculateMaxSweepAmount(program, destination) {
        // Apply program restrictions
        let maxAmount = destination.maximumDeposit || Number.MAX_SAFE_INTEGER;
        for (const restriction of program.restrictions) {
            switch (restriction.type) {
                case 'max_per_account':
                    maxAmount = Math.min(maxAmount, restriction.value);
                    break;
                case 'max_per_bank':
                    // Would check total exposure to bank
                    break;
                case 'regulatory_limit':
                    maxAmount = Math.min(maxAmount, restriction.value);
                    break;
            }
        }
        return maxAmount;
    }
    async updateAccountBalance(accountId, transactionType, amount) {
        const account = this.cashAccounts.get(accountId);
        if (!account)
            return;
        switch (transactionType) {
            case 'credit':
                account.balance += amount;
                account.availableBalance += amount;
                break;
            case 'debit':
                account.balance -= amount;
                account.availableBalance -= amount;
                break;
        }
        account.lastActivity = new Date();
        this.cashAccounts.set(accountId, account);
    }
    getTotalCashBalance(portfolioId) {
        return Array.from(this.cashAccounts.values())
            .filter(account => account.portfolioId === portfolioId && account.active)
            .reduce((sum, account) => sum + account.balance, 0);
    }
    getAvailableCashBalance(portfolioId) {
        return Array.from(this.cashAccounts.values())
            .filter(account => account.portfolioId === portfolioId && account.active)
            .reduce((sum, account) => sum + account.availableBalance, 0);
    }
    getHistoricalTransactions(portfolioId, days) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return Array.from(this.transactions.values())
            .filter(t => t.portfolioId === portfolioId && t.transactionDate >= cutoffDate)
            .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
    }
    projectCashInflows(historical, startDate, endDate) {
        // Simplified projection based on historical patterns
        const inflows = [];
        const credits = historical.filter(t => t.type === 'credit');
        // Project dividends (quarterly pattern)
        const avgDividend = credits
            .filter(t => t.category === 'dividend')
            .reduce((sum, t) => sum + t.amount, 0) / Math.max(credits.length, 1);
        if (avgDividend > 0) {
            inflows.push({
                date: new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000),
                amount: avgDividend,
                type: 'dividend',
                description: 'Projected dividend payment',
                confidence: 'medium',
                category: 'dividend'
            });
        }
        return inflows;
    }
    projectCashOutflows(historical, startDate, endDate) {
        // Simplified projection based on historical patterns
        const outflows = [];
        const debits = historical.filter(t => t.type === 'debit');
        // Project fees (monthly pattern)
        const avgFees = debits
            .filter(t => t.category === 'fee')
            .reduce((sum, t) => sum + t.amount, 0) / Math.max(debits.length, 1);
        if (avgFees > 0) {
            outflows.push({
                date: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                amount: avgFees,
                type: 'fee',
                description: 'Projected management fees',
                confidence: 'high',
                category: 'fee'
            });
        }
        return outflows;
    }
    calculateLiquidityNeed(portfolioId, outflows) {
        const totalOutflows = outflows.reduce((sum, flow) => sum + flow.amount, 0);
        const currentCash = this.getAvailableCashBalance(portfolioId);
        return Math.max(0, totalOutflows - currentCash);
    }
    generateCashActions(projectedBalance, liquidityNeed, inflows, outflows) {
        const actions = [];
        if (liquidityNeed > 0) {
            actions.push({
                type: 'liquidate',
                amount: liquidityNeed,
                security: 'most_liquid',
                priority: 'high',
                description: `Liquidate securities to meet cash need of $${liquidityNeed.toLocaleString()}`
            });
        }
        if (projectedBalance > 50000) {
            actions.push({
                type: 'sweep',
                amount: projectedBalance - 25000,
                priority: 'medium',
                description: 'Sweep excess cash to higher-yield account',
                estimatedYield: 4.5
            });
        }
        return actions;
    }
    isLiquidSecurity(position) {
        // Simplified liquidity classification
        const liquidAssetTypes = ['stock', 'etf', 'mutual_fund', 'treasury'];
        return liquidAssetTypes.includes(position.assetType?.toLowerCase());
    }
    estimateMonthlyExpenses(portfolioId) {
        // Simplified calculation based on historical fees and distributions
        const recentTransactions = this.getHistoricalTransactions(portfolioId, 90);
        const monthlyExpenses = recentTransactions
            .filter(t => t.type === 'debit' && ['fee', 'withdrawal'].includes(t.category))
            .reduce((sum, t) => sum + t.amount, 0) / 3; // 90 days / 30 days per month
        return monthlyExpenses;
    }
    calculateLiquidityScore(liquidityRatio, daysOfExpenses, cashRatio) {
        // Weighted scoring algorithm
        const liquidityScore = Math.min(100, liquidityRatio * 60); // 60% weight
        const expenseScore = Math.min(100, (daysOfExpenses / 90) * 25); // 25% weight
        const cashScore = Math.min(100, cashRatio * 15); // 15% weight
        return Math.round(liquidityScore + expenseScore + cashScore);
    }
    generateYieldRecommendations(accounts) {
        const recommendations = [];
        // Find low-yield accounts
        const lowYieldAccounts = accounts.filter(account => account.interestRate < 0.02); // Below 2%
        for (const account of lowYieldAccounts) {
            if (account.balance > 10000) {
                recommendations.push({
                    action: 'move_to_higher_yield',
                    amount: account.balance * 0.8, // Keep 20% for liquidity
                    fromAccount: account.id,
                    toAccount: 'high_yield_money_market',
                    expectedYield: 0.045, // 4.5%
                    risk: 'Low',
                    liquidity: 'High',
                    timeline: 'Immediate'
                });
            }
        }
        return recommendations;
    }
    assessOptimizationRisk(recommendations) {
        // Simple risk assessment based on recommendation types
        const highRiskActions = recommendations.filter(r => ['ladder_cds', 'treasury_bills'].includes(r.action)).length;
        if (highRiskActions > recommendations.length * 0.5)
            return 'high';
        if (highRiskActions > 0)
            return 'medium';
        return 'low';
    }
    startSweepScheduler() {
        // Run sweep operations daily at 9 AM
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 9 && now.getMinutes() === 0) {
                for (const program of this.sweepPrograms.values()) {
                    if (program.active && program.frequency === 'daily') {
                        this.executeCashSweep(program.portfolioId);
                    }
                }
            }
        }, 60000); // Check every minute
    }
    startForecastingEngine() {
        // Update forecasts every 4 hours
        setInterval(() => {
            const portfolios = new Set(Array.from(this.cashAccounts.values()).map(a => a.portfolioId));
            for (const portfolioId of portfolios) {
                this.generateCashForecast(portfolioId);
            }
        }, 4 * 60 * 60 * 1000);
    }
}
exports.CashManagementService = CashManagementService;
exports.default = CashManagementService;

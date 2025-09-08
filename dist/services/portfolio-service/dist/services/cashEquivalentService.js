"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashEquivalentService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const kafka_mock_1 = require("../utils/kafka-mock");
class CashEquivalentService {
    prisma;
    kafkaService;
    constructor(prisma) {
        this.prisma = prisma;
        this.kafkaService = (0, kafka_mock_1.getKafkaService)();
    }
    async createMoneyMarketPosition(request) {
        try {
            // Verify portfolio exists and user has access
            const portfolio = await this.prisma.portfolio.findFirst({
                where: {
                    id: request.portfolioId,
                    tenantId: request.tenantId
                }
            });
            if (!portfolio) {
                throw new Error('Portfolio not found or access denied');
            }
            // Create position in the database
            const position = await this.prisma.position.create({
                data: {
                    portfolioId: request.portfolioId,
                    tenantId: request.tenantId,
                    symbol: request.fundId,
                    securityId: request.fundId,
                    securityType: 'CASH', // We'll extend this enum later
                    quantity: new client_1.Prisma.Decimal(request.shares),
                    marketValue: new client_1.Prisma.Decimal(request.marketValue),
                    costBasis: new client_1.Prisma.Decimal(request.marketValue), // MMFs typically at par
                    averageCost: new client_1.Prisma.Decimal(1.0), // MMFs typically $1 per share
                    lastPrice: new client_1.Prisma.Decimal(1.0),
                    lastPriceDate: new Date(),
                    isActive: true,
                    isLong: true
                }
            });
            // Create enhanced cash equivalent position record
            const cashEquivalentPosition = {
                id: position.id,
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                assetType: 'MONEY_MARKET_FUND',
                assetId: request.fundId,
                symbol: request.fundId,
                shares: request.shares,
                marketValue: request.marketValue,
                currentYield: request.currentYield,
                costBasis: request.marketValue,
                liquidityTier: 'T0', // Money market funds typically same-day liquidity
                isActive: true,
                isPledged: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastPriceUpdate: new Date()
            };
            // Update portfolio cash balance and total value
            await this.updatePortfolioValuation(request.portfolioId, request.marketValue, 'ADD');
            // Publish event
            await this.publishEvent('cash_equivalent.position_created', {
                positionId: position.id,
                portfolioId: request.portfolioId,
                assetType: 'MONEY_MARKET_FUND',
                marketValue: request.marketValue
            });
            logger_1.logger.info(`Money market position created: ${position.id} for portfolio ${request.portfolioId}`);
            return cashEquivalentPosition;
        }
        catch (error) {
            logger_1.logger.error('Error creating money market position:', error);
            throw error;
        }
    }
    async createSweepAccount(request) {
        try {
            // Verify portfolio exists
            const portfolio = await this.prisma.portfolio.findFirst({
                where: {
                    id: request.portfolioId,
                    tenantId: request.tenantId
                }
            });
            if (!portfolio) {
                throw new Error('Portfolio not found or access denied');
            }
            // Create position for sweep account
            const position = await this.prisma.position.create({
                data: {
                    portfolioId: request.portfolioId,
                    tenantId: request.tenantId,
                    symbol: `SWEEP_${request.accountId}`,
                    securityId: request.accountId,
                    securityType: 'CASH',
                    quantity: new client_1.Prisma.Decimal(request.balance),
                    marketValue: new client_1.Prisma.Decimal(request.balance),
                    costBasis: new client_1.Prisma.Decimal(request.balance),
                    averageCost: new client_1.Prisma.Decimal(1.0),
                    lastPrice: new client_1.Prisma.Decimal(1.0),
                    lastPriceDate: new Date(),
                    isActive: true,
                    isLong: true
                }
            });
            // Create enhanced cash equivalent position
            const sweepPosition = {
                id: position.id,
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                assetType: 'SWEEP_ACCOUNT',
                assetId: request.accountId,
                symbol: `SWEEP_${request.accountId}`,
                balance: request.balance,
                marketValue: request.balance,
                currentYield: request.currentRate,
                costBasis: request.balance,
                liquidityTier: 'T0', // Sweep accounts have immediate liquidity
                isActive: true,
                isPledged: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastPriceUpdate: new Date()
            };
            // Update portfolio cash balance
            await this.updatePortfolioValuation(request.portfolioId, request.balance, 'ADD');
            await this.publishEvent('cash_equivalent.sweep_account_created', {
                positionId: position.id,
                portfolioId: request.portfolioId,
                accountId: request.accountId,
                balance: request.balance
            });
            logger_1.logger.info(`Sweep account created: ${position.id} for portfolio ${request.portfolioId}`);
            return sweepPosition;
        }
        catch (error) {
            logger_1.logger.error('Error creating sweep account:', error);
            throw error;
        }
    }
    async executeSweep(request) {
        try {
            // Get sweep account position
            const sweepPosition = await this.prisma.position.findFirst({
                where: {
                    portfolioId: request.portfolioId,
                    tenantId: request.tenantId,
                    symbol: { startsWith: 'SWEEP_' },
                    isActive: true
                }
            });
            if (!sweepPosition) {
                throw new Error('No active sweep account found for portfolio');
            }
            // Create sweep transaction
            const sweepTransaction = await this.prisma.transaction.create({
                data: {
                    portfolioId: request.portfolioId,
                    positionId: sweepPosition.id,
                    tenantId: request.tenantId,
                    transactionType: request.amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
                    symbol: sweepPosition.symbol,
                    quantity: new client_1.Prisma.Decimal(Math.abs(request.amount)),
                    price: new client_1.Prisma.Decimal(1.0),
                    grossAmount: new client_1.Prisma.Decimal(Math.abs(request.amount)),
                    netAmount: new client_1.Prisma.Decimal(Math.abs(request.amount)),
                    tradeDate: new Date(),
                    settlementDate: new Date(), // Immediate settlement for sweeps
                    status: 'SETTLED',
                    isReconciled: true,
                    reconciledAt: new Date(),
                    createdBy: request.executedBy
                }
            });
            // Update position balance
            const newBalance = sweepPosition.quantity.toNumber() + request.amount;
            await this.prisma.position.update({
                where: { id: sweepPosition.id },
                data: {
                    quantity: new client_1.Prisma.Decimal(newBalance),
                    marketValue: new client_1.Prisma.Decimal(newBalance),
                    costBasis: new client_1.Prisma.Decimal(newBalance),
                    updatedAt: new Date()
                }
            });
            // Update portfolio cash balance
            await this.updatePortfolioValuation(request.portfolioId, request.amount, 'ADD');
            const cashEquivalentTransaction = {
                id: sweepTransaction.id,
                portfolioId: request.portfolioId,
                positionId: sweepPosition.id,
                tenantId: request.tenantId,
                transactionType: request.amount > 0 ? 'SWEEP_IN' : 'SWEEP_OUT',
                amount: Math.abs(request.amount),
                price: 1.0,
                tradeDate: new Date(),
                settlementDate: new Date(),
                sweepType: request.sweepType,
                triggerEvent: request.triggerEvent,
                status: 'SETTLED',
                createdAt: new Date(),
                processedAt: new Date(),
                createdBy: request.executedBy
            };
            await this.publishEvent('cash_equivalent.sweep_executed', {
                transactionId: sweepTransaction.id,
                portfolioId: request.portfolioId,
                amount: request.amount,
                sweepType: request.sweepType
            });
            logger_1.logger.info(`Sweep executed: ${sweepTransaction.id} for ${request.amount} in portfolio ${request.portfolioId}`);
            return cashEquivalentTransaction;
        }
        catch (error) {
            logger_1.logger.error('Error executing sweep:', error);
            throw error;
        }
    }
    async processYieldDistribution(request) {
        try {
            // Get the position
            const position = await this.prisma.position.findFirst({
                where: {
                    id: request.positionId,
                    tenantId: request.tenantId,
                    isActive: true
                }
            });
            if (!position) {
                throw new Error('Position not found');
            }
            // Create dividend/interest transaction
            const yieldTransaction = await this.prisma.transaction.create({
                data: {
                    portfolioId: position.portfolioId,
                    positionId: position.id,
                    tenantId: request.tenantId,
                    transactionType: request.distributionType === 'DIVIDEND' ? 'DIVIDEND' : 'INTEREST',
                    symbol: position.symbol,
                    quantity: new client_1.Prisma.Decimal(0), // No shares involved in distributions
                    price: new client_1.Prisma.Decimal(0),
                    grossAmount: new client_1.Prisma.Decimal(request.amount),
                    netAmount: new client_1.Prisma.Decimal(request.amount),
                    tradeDate: request.distributionDate,
                    settlementDate: request.distributionDate,
                    status: 'SETTLED',
                    isReconciled: true,
                    reconciledAt: new Date(),
                    createdBy: request.processedBy
                }
            });
            // Update portfolio cash balance
            await this.updatePortfolioValuation(position.portfolioId, request.amount, 'ADD');
            const distributionTransaction = {
                id: yieldTransaction.id,
                portfolioId: position.portfolioId,
                positionId: position.id,
                tenantId: request.tenantId,
                transactionType: request.distributionType === 'DIVIDEND' ? 'DIVIDEND' : 'INTEREST',
                amount: request.amount,
                tradeDate: request.distributionDate,
                settlementDate: request.distributionDate,
                interestRate: request.yieldRate,
                status: 'SETTLED',
                createdAt: new Date(),
                processedAt: new Date(),
                createdBy: request.processedBy
            };
            await this.publishEvent('cash_equivalent.yield_distributed', {
                transactionId: yieldTransaction.id,
                positionId: request.positionId,
                amount: request.amount,
                distributionType: request.distributionType
            });
            logger_1.logger.info(`Yield distribution processed: ${yieldTransaction.id} for position ${request.positionId}`);
            return distributionTransaction;
        }
        catch (error) {
            logger_1.logger.error('Error processing yield distribution:', error);
            throw error;
        }
    }
    async calculateCurrentYield(positionId, tenantId) {
        try {
            // Get position and recent transactions
            const position = await this.prisma.position.findFirst({
                where: {
                    id: positionId,
                    tenantId,
                    isActive: true
                }
            });
            if (!position) {
                throw new Error('Position not found');
            }
            // Get last 30 days of yield transactions
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const yieldTransactions = await this.prisma.transaction.findMany({
                where: {
                    positionId,
                    tenantId,
                    transactionType: { in: ['DIVIDEND', 'INTEREST'] },
                    tradeDate: { gte: thirtyDaysAgo },
                    status: 'SETTLED'
                },
                orderBy: { tradeDate: 'desc' }
            });
            // Calculate yields
            const totalYieldAmount = yieldTransactions.reduce((sum, tx) => sum + tx.netAmount.toNumber(), 0);
            const marketValue = position.marketValue.toNumber();
            const periodDays = 30;
            const annualizationFactor = 365 / periodDays;
            const currentYield = marketValue > 0 ? (totalYieldAmount / marketValue) * annualizationFactor : 0;
            const effectiveYield = currentYield; // Simplified for cash equivalents
            const compoundYield = Math.pow(1 + (currentYield / 365), 365) - 1;
            const yieldCalculation = {
                positionId,
                calculationDate: new Date(),
                currentYield,
                effectiveYield,
                compoundYield,
                dividendYield: yieldTransactions.filter(tx => tx.transactionType === 'DIVIDEND')
                    .reduce((sum, tx) => sum + tx.netAmount.toNumber(), 0) / marketValue * annualizationFactor,
                interestYield: yieldTransactions.filter(tx => tx.transactionType === 'INTEREST')
                    .reduce((sum, tx) => sum + tx.netAmount.toNumber(), 0) / marketValue * annualizationFactor,
                feeAdjustedYield: currentYield, // Simplified - should account for fees
                periodDays,
                annualizationFactor,
                calculationMethod: 'SIMPLE',
                createdAt: new Date()
            };
            logger_1.logger.info(`Yield calculated for position ${positionId}: ${(currentYield * 100).toFixed(2)}%`);
            return yieldCalculation;
        }
        catch (error) {
            logger_1.logger.error('Error calculating yield:', error);
            throw error;
        }
    }
    async getCashEquivalentPositions(portfolioId, tenantId) {
        try {
            const positions = await this.prisma.position.findMany({
                where: {
                    portfolioId,
                    tenantId,
                    securityType: 'CASH',
                    isActive: true,
                    quantity: { gt: 0 }
                },
                orderBy: { marketValue: 'desc' }
            });
            return positions.map(pos => ({
                id: pos.id,
                portfolioId: pos.portfolioId,
                tenantId: pos.tenantId,
                assetType: pos.symbol.startsWith('SWEEP_') ? 'SWEEP_ACCOUNT' : 'MONEY_MARKET_FUND',
                assetId: pos.securityId || pos.symbol,
                symbol: pos.symbol,
                shares: pos.symbol.startsWith('SWEEP_') ? undefined : pos.quantity.toNumber(),
                balance: pos.symbol.startsWith('SWEEP_') ? pos.quantity.toNumber() : undefined,
                marketValue: pos.marketValue.toNumber(),
                currentYield: 0, // Would need to be calculated separately
                costBasis: pos.costBasis.toNumber(),
                liquidityTier: 'T0',
                isActive: pos.isActive,
                isPledged: false,
                createdAt: pos.createdAt,
                updatedAt: pos.updatedAt,
                lastPriceUpdate: pos.lastPriceDate || pos.updatedAt
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting cash equivalent positions:', error);
            throw error;
        }
    }
    async updatePortfolioValuation(portfolioId, amount, operation) {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId }
        });
        if (!portfolio)
            return;
        const currentCash = portfolio.cashBalance.toNumber();
        const currentTotal = portfolio.totalValue.toNumber();
        const cashChange = operation === 'ADD' ? amount : -amount;
        const newCashBalance = currentCash + cashChange;
        const newTotalValue = currentTotal + cashChange;
        await this.prisma.portfolio.update({
            where: { id: portfolioId },
            data: {
                cashBalance: new client_1.Prisma.Decimal(newCashBalance),
                totalValue: new client_1.Prisma.Decimal(newTotalValue),
                updatedAt: new Date()
            }
        });
    }
    async publishEvent(eventType, data) {
        try {
            if (this.kafkaService.isConnected()) {
                await this.kafkaService.publishMessage('cash-equivalent-events', {
                    eventType,
                    data,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error publishing cash equivalent event:', error);
        }
    }
}
exports.CashEquivalentService = CashEquivalentService;

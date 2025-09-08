"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const kafka_mock_1 = require("../utils/kafka-mock");
class PortfolioService {
    prisma;
    kafkaService;
    constructor(prisma) {
        this.prisma = prisma;
        this.kafkaService = (0, kafka_mock_1.getKafkaService)();
    }
    async getPortfolios(request) {
        const { tenantId, userId, page, limit, status, portfolioType, search } = request;
        try {
            const skip = (page - 1) * limit;
            const whereClause = {
                tenantId,
                AND: [
                    {
                        OR: [
                            { ownerId: userId },
                            { managerId: userId }
                        ]
                    }
                ]
            };
            if (status) {
                whereClause.status = status;
            }
            if (portfolioType) {
                whereClause.portfolioType = portfolioType;
            }
            if (search) {
                whereClause.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [portfolios, total] = await Promise.all([
                this.prisma.portfolio.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        portfolioType: true,
                        status: true,
                        totalValue: true,
                        cashBalance: true,
                        baseCurrency: true,
                        riskProfile: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: {
                                positions: true
                            }
                        }
                    }
                }),
                this.prisma.portfolio.count({ where: whereClause })
            ]);
            return {
                portfolios,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching portfolios:', error);
            throw error;
        }
    }
    async getPortfolioById(id, tenantId, userId) {
        try {
            const portfolio = await this.prisma.portfolio.findFirst({
                where: {
                    id,
                    tenantId,
                    OR: [
                        { ownerId: userId },
                        { managerId: userId }
                    ]
                },
                include: {
                    positions: {
                        where: { quantity: { gt: 0 } },
                        take: 10,
                        orderBy: { marketValue: 'desc' }
                    },
                    _count: {
                        select: {
                            positions: true,
                            transactions: true
                        }
                    }
                }
            });
            return portfolio;
        }
        catch (error) {
            logger_1.logger.error('Error fetching portfolio by ID:', error);
            throw error;
        }
    }
    async createPortfolio(data) {
        try {
            const portfolio = await this.prisma.portfolio.create({
                data: {
                    name: data.name,
                    description: data.description,
                    portfolioType: data.portfolioType,
                    baseCurrency: data.baseCurrency || 'USD',
                    riskProfile: data.riskProfile,
                    investmentObjective: data.investmentObjective,
                    minCashPercentage: data.minCashPercentage ? new client_1.Prisma.Decimal(data.minCashPercentage) : null,
                    maxCashPercentage: data.maxCashPercentage ? new client_1.Prisma.Decimal(data.maxCashPercentage) : null,
                    tenantId: data.tenantId,
                    ownerId: data.ownerId,
                    createdBy: data.createdBy,
                    updatedBy: data.updatedBy,
                    status: 'ACTIVE'
                }
            });
            // Publish portfolio creation event
            await this.publishPortfolioEvent('portfolio.created', portfolio);
            return portfolio;
        }
        catch (error) {
            logger_1.logger.error('Error creating portfolio:', error);
            throw error;
        }
    }
    async updatePortfolio(id, tenantId, userId, data) {
        try {
            // Check if user has access to the portfolio
            const existingPortfolio = await this.getPortfolioById(id, tenantId, userId);
            if (!existingPortfolio) {
                return null;
            }
            const updateData = {
                updatedBy: data.updatedBy,
                updatedAt: new Date()
            };
            if (data.name !== undefined)
                updateData.name = data.name;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.riskProfile !== undefined)
                updateData.riskProfile = data.riskProfile;
            if (data.investmentObjective !== undefined)
                updateData.investmentObjective = data.investmentObjective;
            if (data.minCashPercentage !== undefined) {
                updateData.minCashPercentage = data.minCashPercentage ? new client_1.Prisma.Decimal(data.minCashPercentage) : null;
            }
            if (data.maxCashPercentage !== undefined) {
                updateData.maxCashPercentage = data.maxCashPercentage ? new client_1.Prisma.Decimal(data.maxCashPercentage) : null;
            }
            const portfolio = await this.prisma.portfolio.update({
                where: { id },
                data: updateData
            });
            // Publish portfolio update event
            await this.publishPortfolioEvent('portfolio.updated', portfolio);
            return portfolio;
        }
        catch (error) {
            logger_1.logger.error('Error updating portfolio:', error);
            throw error;
        }
    }
    async deletePortfolio(id, tenantId, userId) {
        try {
            // Check if user has access to the portfolio
            const existingPortfolio = await this.getPortfolioById(id, tenantId, userId);
            if (!existingPortfolio) {
                return false;
            }
            // Check if portfolio has positions
            const positionCount = await this.prisma.position.count({
                where: {
                    portfolioId: id,
                    quantity: { gt: 0 }
                }
            });
            if (positionCount > 0) {
                throw new Error('Cannot delete portfolio with active positions');
            }
            // Soft delete by updating status
            await this.prisma.portfolio.update({
                where: { id },
                data: {
                    status: 'CLOSED',
                    updatedBy: userId,
                    updatedAt: new Date()
                }
            });
            // Publish portfolio deletion event
            await this.publishPortfolioEvent('portfolio.deleted', { id, tenantId, deletedBy: userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting portfolio:', error);
            throw error;
        }
    }
    async getPortfolioSummary(id, tenantId, userId) {
        try {
            const portfolio = await this.getPortfolioById(id, tenantId, userId);
            if (!portfolio) {
                return null;
            }
            // Calculate summary metrics
            const positions = await this.prisma.position.findMany({
                where: {
                    portfolioId: id,
                    quantity: { gt: 0 }
                },
                select: {
                    marketValue: true,
                    unrealizedGainLoss: true,
                    realizedGainLoss: true
                }
            });
            const totalGainLoss = positions.reduce((sum, pos) => sum + (pos.unrealizedGainLoss?.toNumber() || 0), 0);
            // dayChange field not available in schema, using 0
            const totalDayChange = 0;
            const totalValue = portfolio.totalValue.toNumber();
            const totalGainLossPercentage = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;
            const dayChangePercentage = totalValue > 0 ? (totalDayChange / totalValue) * 100 : 0;
            return {
                id: portfolio.id,
                name: portfolio.name,
                totalValue,
                cashBalance: portfolio.cashBalance.toNumber(),
                totalGainLoss,
                totalGainLossPercentage,
                dayChange: totalDayChange,
                dayChangePercentage,
                positionCount: positions.length,
                lastUpdated: portfolio.updatedAt
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching portfolio summary:', error);
            throw error;
        }
    }
    async getPortfolioAllocations(id, tenantId, userId) {
        try {
            const portfolio = await this.getPortfolioById(id, tenantId, userId);
            if (!portfolio) {
                return null;
            }
            const positions = await this.prisma.position.findMany({
                where: {
                    portfolioId: id,
                    quantity: { gt: 0 }
                },
                select: {
                    id: true,
                    symbol: true,
                    marketValue: true,
                    unrealizedGainLoss: true,
                    securityType: true
                }
            });
            // Group positions by asset class
            const allocations = new Map();
            const totalValue = portfolio.totalValue.toNumber();
            positions.forEach(position => {
                const assetClass = position.securityType || 'OTHER';
                const marketValue = position.marketValue?.toNumber() || 0;
                const gainLoss = position.unrealizedGainLoss?.toNumber() || 0;
                if (allocations.has(assetClass)) {
                    const allocation = allocations.get(assetClass);
                    allocation.value += marketValue;
                    allocation.gainLoss += gainLoss;
                }
                else {
                    allocations.set(assetClass, {
                        category: assetClass,
                        value: marketValue,
                        percentage: 0,
                        gainLoss,
                        gainLossPercentage: 0
                    });
                }
            });
            // Calculate percentages
            const allocationArray = Array.from(allocations.values());
            allocationArray.forEach(allocation => {
                allocation.percentage = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;
                allocation.gainLossPercentage = allocation.value > 0 ?
                    (allocation.gainLoss / (allocation.value - allocation.gainLoss)) * 100 : 0;
            });
            // Add cash allocation
            const cashBalance = portfolio.cashBalance.toNumber();
            if (cashBalance > 0) {
                allocationArray.push({
                    category: 'CASH',
                    value: cashBalance,
                    percentage: totalValue > 0 ? (cashBalance / totalValue) * 100 : 0,
                    gainLoss: 0,
                    gainLossPercentage: 0
                });
            }
            return allocationArray.sort((a, b) => b.value - a.value);
        }
        catch (error) {
            logger_1.logger.error('Error fetching portfolio allocations:', error);
            throw error;
        }
    }
    async publishPortfolioEvent(eventType, data) {
        try {
            if (this.kafkaService.isConnected()) {
                await this.kafkaService.publishMessage('portfolio-events', {
                    eventType,
                    data,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error publishing portfolio event:', error);
            // Don't throw error as this is not critical for the operation
        }
    }
}
exports.PortfolioService = PortfolioService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedIncomeService = void 0;
const logger_1 = require("../utils/logger");
class FixedIncomeService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    async getFixedIncomePositions(portfolioId, tenantId) {
        try {
            const positions = await this.prisma.position.findMany({
                where: {
                    portfolioId,
                    tenantId,
                    securityType: {
                        in: ['GOVERNMENT_BOND', 'CORPORATE_BOND', 'MUNICIPAL_BOND', 'TREASURY_BILL', 'AGENCY_BOND']
                    },
                    isActive: true
                },
                include: {
                    transactions: {
                        where: {
                            status: 'SETTLED'
                        },
                        orderBy: {
                            tradeDate: 'desc'
                        }
                    }
                }
            });
            return positions.map(position => this.mapToFixedIncomePosition(position));
        }
        catch (error) {
            logger_1.logger.error('Error fetching fixed income positions:', error);
            throw new Error('Failed to fetch fixed income positions');
        }
    }
    async createFixedIncomePosition(request) {
        try {
            // Calculate derived values
            const marketValue = request.quantity * request.purchasePrice * request.faceValue / 100;
            const costBasis = marketValue;
            const accruedInterest = this.calculateAccruedInterest(request.faceValue * request.quantity, request.couponRate || 0, new Date(), new Date(request.maturityDate));
            // Create position
            const position = await this.prisma.position.create({
                data: {
                    portfolioId: request.portfolioId,
                    tenantId: request.tenantId,
                    securityId: request.cusip,
                    symbol: request.symbol || request.cusip,
                    securityType: request.assetType,
                    quantity: request.quantity,
                    marketValue: marketValue,
                    costBasis: costBasis,
                    unrealizedGainLoss: 0,
                    lastPrice: request.purchasePrice,
                    lastPriceDate: new Date(),
                    isActive: true,
                    createdBy: request.createdBy,
                    metadata: {
                        faceValue: request.faceValue,
                        maturityDate: request.maturityDate,
                        couponRate: request.couponRate || 0,
                        accruedInterest: accruedInterest
                    }
                }
            });
            // Create initial transaction
            await this.createFixedIncomeTransaction({
                portfolioId: request.portfolioId,
                tenantId: request.tenantId,
                transactionType: 'BUY',
                cusip: request.cusip,
                quantity: request.quantity,
                price: request.purchasePrice,
                tradeDate: new Date().toISOString(),
                settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // T+2
                executedBy: request.createdBy
            });
            // Publish event
            if (this.kafkaService) {
                await this.kafkaService.publishEvent('position.fixed_income.created', {
                    positionId: position.id,
                    portfolioId: request.portfolioId,
                    tenantId: request.tenantId,
                    assetType: request.assetType,
                    cusip: request.cusip,
                    quantity: request.quantity,
                    marketValue: marketValue,
                    timestamp: new Date().toISOString()
                });
            }
            return this.mapToFixedIncomePosition(position);
        }
        catch (error) {
            logger_1.logger.error('Error creating fixed income position:', error);
            throw new Error('Failed to create fixed income position');
        }
    }
    async createFixedIncomeTransaction(request) {
        try {
            const faceValue = 1000; // Standard bond face value
            const netAmount = request.quantity * request.price * faceValue / 100;
            const accruedInterest = this.calculateAccruedInterest(faceValue * request.quantity, 0, // Will be updated with actual coupon rate
            new Date(request.tradeDate), new Date(request.settlementDate));
            const transaction = await this.prisma.transaction.create({
                data: {
                    portfolioId: request.portfolioId,
                    tenantId: request.tenantId,
                    transactionType: request.transactionType,
                    securityId: request.cusip,
                    symbol: request.cusip,
                    securityType: 'BOND',
                    quantity: request.quantity,
                    price: request.price,
                    netAmount: request.transactionType === 'BUY' ? -netAmount : netAmount,
                    commission: 0,
                    fees: 0,
                    tradeDate: new Date(request.tradeDate),
                    settlementDate: new Date(request.settlementDate),
                    status: 'SETTLED',
                    createdBy: request.executedBy,
                    metadata: {
                        faceValue: faceValue,
                        accruedInterest: accruedInterest
                    }
                }
            });
            // Update position
            await this.updatePositionFromTransaction(transaction);
            // Publish event
            if (this.kafkaService) {
                await this.kafkaService.publishEvent('transaction.fixed_income.created', {
                    transactionId: transaction.id,
                    portfolioId: request.portfolioId,
                    tenantId: request.tenantId,
                    transactionType: request.transactionType,
                    cusip: request.cusip,
                    quantity: request.quantity,
                    netAmount: netAmount,
                    timestamp: new Date().toISOString()
                });
            }
            return this.mapToFixedIncomeTransaction(transaction);
        }
        catch (error) {
            logger_1.logger.error('Error creating fixed income transaction:', error);
            throw new Error('Failed to create fixed income transaction');
        }
    }
    async processCouponPayment(request) {
        try {
            // Get position details
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
            const faceValue = position.metadata?.faceValue || 1000;
            const paymentAmount = (position.quantity.toNumber() * faceValue * request.couponRate) / 100;
            // Create coupon payment record
            const couponPayment = {
                id: crypto.randomUUID(),
                positionId: request.positionId,
                tenantId: request.tenantId,
                paymentDate: new Date(request.paymentDate),
                recordDate: new Date(request.paymentDate),
                exDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days before
                couponRate: request.couponRate,
                paymentAmount: paymentAmount,
                faceValueHeld: position.quantity.toNumber() * faceValue,
                taxableAmount: paymentAmount, // Simplified - would need tax logic
                taxExemptAmount: 0,
                status: 'PAID',
                createdAt: new Date(),
                processedAt: new Date()
            };
            // Create transaction for coupon payment
            await this.prisma.transaction.create({
                data: {
                    portfolioId: position.portfolioId,
                    tenantId: request.tenantId,
                    transactionType: 'COUPON_PAYMENT',
                    securityId: position.securityId,
                    symbol: position.symbol,
                    securityType: position.securityType,
                    quantity: 0,
                    price: 0,
                    netAmount: paymentAmount,
                    commission: 0,
                    fees: 0,
                    tradeDate: new Date(request.paymentDate),
                    settlementDate: new Date(request.paymentDate),
                    status: 'SETTLED',
                    createdBy: request.processedBy,
                    metadata: {
                        couponRate: request.couponRate,
                        faceValue: faceValue,
                        paymentType: 'COUPON'
                    }
                }
            });
            // Publish event
            if (this.kafkaService) {
                await this.kafkaService.publishEvent('coupon.payment.processed', {
                    positionId: request.positionId,
                    portfolioId: position.portfolioId,
                    tenantId: request.tenantId,
                    paymentAmount: paymentAmount,
                    couponRate: request.couponRate,
                    paymentDate: request.paymentDate,
                    timestamp: new Date().toISOString()
                });
            }
            return couponPayment;
        }
        catch (error) {
            logger_1.logger.error('Error processing coupon payment:', error);
            throw new Error('Failed to process coupon payment');
        }
    }
    async calculateYieldMetrics(positionId, tenantId) {
        try {
            const position = await this.prisma.position.findFirst({
                where: {
                    id: positionId,
                    tenantId: tenantId,
                    isActive: true
                }
            });
            if (!position) {
                throw new Error('Position not found');
            }
            const metadata = position.metadata;
            const currentPrice = position.lastPrice.toNumber();
            const faceValue = metadata?.faceValue || 1000;
            const couponRate = metadata?.couponRate || 0;
            const maturityDate = new Date(metadata?.maturityDate || Date.now() + 365 * 24 * 60 * 60 * 1000);
            // Calculate years to maturity
            const yearsToMaturity = (maturityDate.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000);
            // Simple yield calculations (would use more sophisticated models in production)
            const currentYield = (couponRate * faceValue) / (currentPrice * faceValue / 100);
            const yieldToMaturity = this.approximateYTM(currentPrice, faceValue, couponRate, yearsToMaturity);
            const duration = this.calculateDuration(currentPrice, faceValue, couponRate, yearsToMaturity);
            const modifiedDuration = duration / (1 + yieldToMaturity / 100);
            const convexity = this.calculateConvexity(currentPrice, faceValue, couponRate, yearsToMaturity);
            return {
                currentYield: currentYield,
                yieldToMaturity: yieldToMaturity,
                yieldToWorst: yieldToMaturity, // Simplified
                duration: duration,
                modifiedDuration: modifiedDuration,
                convexity: convexity,
                calculationDate: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating yield metrics:', error);
            throw new Error('Failed to calculate yield metrics');
        }
    }
    async valuatePosition(request) {
        try {
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
            const yieldMetrics = await this.calculateYieldMetrics(request.positionId, request.tenantId);
            const metadata = position.metadata;
            const faceValue = metadata?.faceValue || 1000;
            const currentPrice = position.lastPrice.toNumber();
            const valuation = {
                positionId: request.positionId,
                valuationDate: new Date(request.valuationDate || Date.now()),
                currentPrice: currentPrice,
                marketValue: position.marketValue.toNumber(),
                accruedInterest: this.calculateAccruedInterest(position.quantity.toNumber() * faceValue, metadata?.couponRate || 0, new Date(), new Date(metadata?.maturityDate || Date.now() + 365 * 24 * 60 * 60 * 1000)),
                totalValue: position.marketValue.toNumber() + (metadata?.accruedInterest || 0),
                yieldMetrics: yieldMetrics,
                riskMetrics: {
                    duration: yieldMetrics.duration,
                    modifiedDuration: yieldMetrics.modifiedDuration,
                    convexity: yieldMetrics.convexity,
                    priceVolatility: yieldMetrics.modifiedDuration * 0.01 * 100 // 1bp move
                }
            };
            return valuation;
        }
        catch (error) {
            logger_1.logger.error('Error valuating position:', error);
            throw new Error('Failed to valuate position');
        }
    }
    // Private helper methods
    mapToFixedIncomePosition(position) {
        const metadata = position.metadata || {};
        return {
            id: position.id,
            portfolioId: position.portfolioId,
            tenantId: position.tenantId,
            assetType: position.securityType,
            assetId: position.securityId,
            cusip: position.securityId,
            symbol: position.symbol,
            faceValue: metadata.faceValue || 1000,
            quantity: position.quantity.toNumber(),
            marketValue: position.marketValue.toNumber(),
            costBasis: position.costBasis.toNumber(),
            accruedInterest: metadata.accruedInterest || 0,
            currentYield: 0, // Would be calculated
            yieldToMaturity: 0, // Would be calculated
            duration: 0, // Would be calculated
            modifiedDuration: 0, // Would be calculated
            convexity: 0, // Would be calculated
            purchaseDate: position.createdAt,
            maturityDate: new Date(metadata.maturityDate || Date.now() + 365 * 24 * 60 * 60 * 1000),
            taxLots: [], // Would be populated from separate table
            isActive: position.isActive,
            isPledged: false,
            createdAt: position.createdAt,
            updatedAt: position.updatedAt,
            lastPriceUpdate: position.lastPriceDate || position.updatedAt
        };
    }
    mapToFixedIncomeTransaction(transaction) {
        const metadata = transaction.metadata || {};
        return {
            id: transaction.id,
            portfolioId: transaction.portfolioId,
            tenantId: transaction.tenantId,
            transactionType: transaction.transactionType,
            cusip: transaction.securityId,
            symbol: transaction.symbol,
            assetType: transaction.securityType,
            quantity: transaction.quantity.toNumber(),
            price: transaction.price.toNumber(),
            faceValue: metadata.faceValue || 1000,
            accruedInterest: metadata.accruedInterest || 0,
            netAmount: transaction.netAmount.toNumber(),
            commission: transaction.commission.toNumber(),
            fees: transaction.fees.toNumber(),
            markupMarkdown: 0,
            tradeDate: transaction.tradeDate,
            settlementDate: transaction.settlementDate,
            yieldAtTrade: 0, // Would be calculated
            status: transaction.status,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            createdBy: transaction.createdBy
        };
    }
    calculateAccruedInterest(faceValue, couponRate, settlementDate, lastCouponDate) {
        const daysDiff = Math.abs(settlementDate.getTime() - lastCouponDate.getTime()) / (1000 * 60 * 60 * 24);
        const daysInPeriod = 180; // Semi-annual assumption
        return (faceValue * couponRate / 100) * (daysDiff / daysInPeriod) / 2;
    }
    approximateYTM(price, faceValue, couponRate, yearsToMaturity) {
        // Simplified YTM approximation
        const annualCoupon = faceValue * couponRate / 100;
        const currentPrice = price * faceValue / 100;
        return ((annualCoupon + (faceValue - currentPrice) / yearsToMaturity) / ((faceValue + currentPrice) / 2)) * 100;
    }
    calculateDuration(price, faceValue, couponRate, yearsToMaturity) {
        // Simplified Macaulay duration calculation
        const yieldToMaturity = this.approximateYTM(price, faceValue, couponRate, yearsToMaturity) / 100;
        const paymentsPerYear = 2; // Semi-annual
        // For simplicity, using modified duration approximation
        return yearsToMaturity / (1 + yieldToMaturity / paymentsPerYear);
    }
    calculateConvexity(price, faceValue, couponRate, yearsToMaturity) {
        // Simplified convexity calculation
        const duration = this.calculateDuration(price, faceValue, couponRate, yearsToMaturity);
        const yieldToMaturity = this.approximateYTM(price, faceValue, couponRate, yearsToMaturity) / 100;
        return Math.pow(duration, 2) + duration + (yieldToMaturity * Math.pow(yearsToMaturity, 2));
    }
    async updatePositionFromTransaction(transaction) {
        // Find or create position
        const existingPosition = await this.prisma.position.findFirst({
            where: {
                portfolioId: transaction.portfolioId,
                securityId: transaction.securityId,
                tenantId: transaction.tenantId,
                isActive: true
            }
        });
        if (existingPosition) {
            // Update existing position
            const newQuantity = transaction.transactionType === 'BUY'
                ? existingPosition.quantity.toNumber() + transaction.quantity.toNumber()
                : existingPosition.quantity.toNumber() - transaction.quantity.toNumber();
            await this.prisma.position.update({
                where: { id: existingPosition.id },
                data: {
                    quantity: newQuantity,
                    marketValue: newQuantity * transaction.price.toNumber(),
                    lastPrice: transaction.price,
                    lastPriceDate: new Date(),
                    updatedAt: new Date()
                }
            });
        }
    }
}
exports.FixedIncomeService = FixedIncomeService;

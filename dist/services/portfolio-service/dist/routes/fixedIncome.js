"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const fixedIncomeService_1 = require("../services/fixedIncomeService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const fixedIncomeService = new fixedIncomeService_1.FixedIncomeService(prisma);
// Get all fixed income positions for a portfolio
router.get('/portfolios/:portfolioId/fixed-income', auth_1.authenticateToken, async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const tenantId = req.user.tenantId;
        const positions = await fixedIncomeService.getFixedIncomePositions(portfolioId, tenantId);
        res.json({
            success: true,
            data: positions,
            meta: {
                total: positions.length,
                portfolioId,
                assetTypes: [...new Set(positions.map(p => p.assetType))]
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching fixed income positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch fixed income positions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create a fixed income position (bond purchase)
router.post('/portfolios/:portfolioId/fixed-income', auth_1.authenticateToken, async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const { assetType, cusip, symbol, quantity, purchasePrice, faceValue = 1000, maturityDate, couponRate } = req.body;
        // Validation
        if (!assetType || !cusip || !quantity || !purchasePrice || !maturityDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'assetType, cusip, quantity, purchasePrice, and maturityDate are required'
            });
        }
        const validAssetTypes = ['GOVERNMENT_BOND', 'CORPORATE_BOND', 'MUNICIPAL_BOND', 'TREASURY_BILL', 'AGENCY_BOND'];
        if (!validAssetTypes.includes(assetType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid asset type',
                message: `Asset type must be one of: ${validAssetTypes.join(', ')}`
            });
        }
        if (quantity <= 0 || purchasePrice <= 0 || faceValue <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid values',
                message: 'Quantity, purchase price, and face value must be positive numbers'
            });
        }
        if (new Date(maturityDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid maturity date',
                message: 'Maturity date must be in the future'
            });
        }
        const position = await fixedIncomeService.createFixedIncomePosition({
            portfolioId,
            tenantId,
            assetType,
            cusip,
            symbol,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
            faceValue: Number(faceValue),
            maturityDate,
            couponRate: Number(couponRate) || 0,
            createdBy: userId
        });
        res.status(201).json({
            success: true,
            data: position,
            message: 'Fixed income position created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating fixed income position:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create fixed income position',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Execute a fixed income trade
router.post('/portfolios/:portfolioId/fixed-income/trade', auth_1.authenticateToken, async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const { transactionType, cusip, quantity, price, tradeDate, settlementDate } = req.body;
        // Validation
        if (!transactionType || !cusip || !quantity || !price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'transactionType, cusip, quantity, and price are required'
            });
        }
        if (!['BUY', 'SELL'].includes(transactionType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction type',
                message: 'Transaction type must be either BUY or SELL'
            });
        }
        if (quantity <= 0 || price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid values',
                message: 'Quantity and price must be positive numbers'
            });
        }
        const transaction = await fixedIncomeService.createFixedIncomeTransaction({
            portfolioId,
            tenantId,
            transactionType,
            cusip,
            quantity: Number(quantity),
            price: Number(price),
            tradeDate: tradeDate || new Date().toISOString(),
            settlementDate: settlementDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            executedBy: userId
        });
        res.status(201).json({
            success: true,
            data: transaction,
            message: `Fixed income ${transactionType.toLowerCase()} transaction executed successfully`
        });
    }
    catch (error) {
        logger_1.logger.error('Error executing fixed income trade:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute trade',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Process coupon payment
router.post('/positions/:positionId/coupon-payment', auth_1.authenticateToken, async (req, res) => {
    try {
        const { positionId } = req.params;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const { paymentDate, couponRate, reinvestOption = 'CASH' } = req.body;
        // Validation
        if (!paymentDate || couponRate === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'paymentDate and couponRate are required'
            });
        }
        if (couponRate < 0 || couponRate > 50) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coupon rate',
                message: 'Coupon rate must be between 0% and 50%'
            });
        }
        if (!['CASH', 'REINVEST'].includes(reinvestOption)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid reinvest option',
                message: 'Reinvest option must be either CASH or REINVEST'
            });
        }
        const couponPayment = await fixedIncomeService.processCouponPayment({
            positionId,
            paymentDate,
            couponRate: Number(couponRate),
            reinvestOption,
            tenantId,
            processedBy: userId
        });
        res.status(201).json({
            success: true,
            data: couponPayment,
            message: 'Coupon payment processed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing coupon payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process coupon payment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Calculate yield metrics for a position
router.get('/positions/:positionId/yield-metrics', auth_1.authenticateToken, async (req, res) => {
    try {
        const { positionId } = req.params;
        const tenantId = req.user.tenantId;
        const yieldMetrics = await fixedIncomeService.calculateYieldMetrics(positionId, tenantId);
        res.json({
            success: true,
            data: yieldMetrics,
            message: 'Yield metrics calculated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating yield metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate yield metrics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Valuate a fixed income position
router.get('/positions/:positionId/valuation', auth_1.authenticateToken, async (req, res) => {
    try {
        const { positionId } = req.params;
        const tenantId = req.user.tenantId;
        const { valuationDate, includePricingSources } = req.query;
        const valuation = await fixedIncomeService.valuatePosition({
            positionId,
            tenantId,
            valuationDate: valuationDate,
            includePricingSources: includePricingSources === 'true'
        });
        res.json({
            success: true,
            data: valuation,
            message: 'Position valuation completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error valuating position:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to valuate position',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get detailed fixed income position information
router.get('/positions/:positionId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { positionId } = req.params;
        const tenantId = req.user.tenantId;
        // Get the position from database
        const position = await prisma.position.findFirst({
            where: {
                id: positionId,
                tenantId,
                securityType: 'FIXED_INCOME',
                isActive: true
            },
            include: {
                transactions: {
                    where: {
                        status: 'SETTLED'
                    },
                    orderBy: {
                        tradeDate: 'desc'
                    },
                    take: 10
                }
            }
        });
        if (!position) {
            return res.status(404).json({
                success: false,
                error: 'Position not found',
                message: 'Fixed income position not found or access denied'
            });
        }
        // Get yield metrics
        let yieldMetrics;
        try {
            yieldMetrics = await fixedIncomeService.calculateYieldMetrics(positionId, tenantId);
        }
        catch (yieldError) {
            logger_1.logger.warn('Could not calculate yield metrics for position:', yieldError);
            yieldMetrics = null;
        }
        // Get valuation
        let valuation;
        try {
            valuation = await fixedIncomeService.valuatePosition({
                positionId,
                tenantId
            });
        }
        catch (valuationError) {
            logger_1.logger.warn('Could not valuate position:', valuationError);
            valuation = null;
        }
        const metadata = {}; // metadata property not in Position schema
        const detailedPosition = {
            id: position.id,
            portfolioId: position.portfolioId,
            tenantId: position.tenantId,
            assetType: position.securityType,
            cusip: position.securityId,
            symbol: position.symbol,
            quantity: position.quantity.toNumber(),
            marketValue: position.marketValue.toNumber(),
            costBasis: position.costBasis.toNumber(),
            unrealizedGainLoss: position.unrealizedGainLoss.toNumber(),
            faceValue: metadata.faceValue || 1000,
            couponRate: metadata.couponRate || 0,
            maturityDate: metadata.maturityDate,
            accruedInterest: metadata.accruedInterest || 0,
            currentPrice: position.lastPrice?.toNumber() || 0,
            lastPriceUpdate: position.lastPriceDate || position.updatedAt,
            yieldMetrics: yieldMetrics,
            valuation: valuation,
            isActive: position.isActive,
            isPledged: false,
            createdAt: position.createdAt,
            updatedAt: position.updatedAt,
            recentTransactions: (position.transactions || []).map((tx) => ({
                id: tx.id,
                type: tx.transactionType,
                quantity: tx.quantity.toNumber(),
                price: tx.price.toNumber(),
                netAmount: tx.netAmount.toNumber(),
                tradeDate: tx.tradeDate,
                settlementDate: tx.settlementDate
            }))
        };
        res.json({
            success: true,
            data: detailedPosition
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching fixed income position details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch position details',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get portfolio fixed income summary/analytics
router.get('/portfolios/:portfolioId/fixed-income/summary', auth_1.authenticateToken, async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const tenantId = req.user.tenantId;
        const positions = await fixedIncomeService.getFixedIncomePositions(portfolioId, tenantId);
        // Calculate portfolio-level metrics
        const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        const totalCostBasis = positions.reduce((sum, pos) => sum + pos.costBasis, 0);
        const totalUnrealizedGainLoss = totalMarketValue - totalCostBasis;
        // Asset type breakdown
        const assetTypeBreakdown = positions.reduce((acc, pos) => {
            acc[pos.assetType] = (acc[pos.assetType] || 0) + pos.marketValue;
            return acc;
        }, {});
        // Maturity analysis
        const currentDate = new Date();
        const maturityBuckets = {
            'Under 1 Year': 0,
            '1-3 Years': 0,
            '3-5 Years': 0,
            '5-10 Years': 0,
            'Over 10 Years': 0
        };
        positions.forEach(pos => {
            const yearsToMaturity = (pos.maturityDate.getTime() - currentDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
            if (yearsToMaturity < 1)
                maturityBuckets['Under 1 Year'] += pos.marketValue;
            else if (yearsToMaturity < 3)
                maturityBuckets['1-3 Years'] += pos.marketValue;
            else if (yearsToMaturity < 5)
                maturityBuckets['3-5 Years'] += pos.marketValue;
            else if (yearsToMaturity < 10)
                maturityBuckets['5-10 Years'] += pos.marketValue;
            else
                maturityBuckets['Over 10 Years'] += pos.marketValue;
        });
        const summary = {
            portfolioId,
            totalPositions: positions.length,
            totalMarketValue: totalMarketValue,
            totalCostBasis: totalCostBasis,
            totalUnrealizedGainLoss: totalUnrealizedGainLoss,
            returnPercentage: totalCostBasis > 0 ? (totalUnrealizedGainLoss / totalCostBasis) * 100 : 0,
            assetTypeBreakdown: assetTypeBreakdown,
            maturityAnalysis: maturityBuckets,
            averageYield: positions.length > 0 ? positions.reduce((sum, pos) => sum + pos.currentYield, 0) / positions.length : 0,
            weightedAverageDuration: 0, // Would need to calculate based on positions
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: summary,
            message: 'Fixed income portfolio summary generated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating fixed income summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate portfolio summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'fixed-income',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
exports.default = router;

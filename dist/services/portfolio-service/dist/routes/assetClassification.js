"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const kafka_mock_1 = require("../utils/kafka-mock");
const assetClassificationService_1 = require("../services/assetClassificationService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const assetClassificationService = new assetClassificationService_1.AssetClassificationService(prisma, kafkaService);
// Asset Class Management Routes
// Get all asset classes
router.get('/asset-classes', async (req, res) => {
    try {
        const { assetType, riskLevel, liquidityTier, parentClassId, isActive } = req.query;
        const filters = {};
        if (assetType)
            filters.assetType = assetType;
        if (riskLevel)
            filters.riskLevel = riskLevel;
        if (liquidityTier)
            filters.liquidityTier = liquidityTier;
        if (parentClassId)
            filters.parentClassId = parentClassId;
        if (isActive !== undefined)
            filters.isActive = isActive === 'true';
        const assetClasses = await assetClassificationService.getAssetClasses(req.user.tenantId, filters);
        res.json({
            success: true,
            data: assetClasses,
            total: assetClasses.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching asset classes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch asset classes',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create new asset class
router.post('/asset-classes', async (req, res) => {
    try {
        const { name, code, description, parentClassId, level, assetType, riskLevel, liquidityTier, regulatoryCategory, secClassification, minimumInvestment, typicalHoldingPeriod } = req.body;
        // Validation
        if (!name || !code || !assetType || !riskLevel || !liquidityTier) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, code, assetType, riskLevel, liquidityTier'
            });
        }
        const validAssetTypes = ['EQUITY', 'FIXED_INCOME', 'CASH_EQUIVALENT', 'ALTERNATIVE', 'DERIVATIVE'];
        if (!validAssetTypes.includes(assetType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid asset type. Must be one of: ${validAssetTypes.join(', ')}`
            });
        }
        const validRiskLevels = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
        if (!validRiskLevels.includes(riskLevel)) {
            return res.status(400).json({
                success: false,
                error: `Invalid risk level. Must be one of: ${validRiskLevels.join(', ')}`
            });
        }
        const validLiquidityTiers = ['T0', 'T1', 'T2', 'T3', 'ILLIQUID'];
        if (!validLiquidityTiers.includes(liquidityTier)) {
            return res.status(400).json({
                success: false,
                error: `Invalid liquidity tier. Must be one of: ${validLiquidityTiers.join(', ')}`
            });
        }
        const assetClass = await assetClassificationService.createAssetClass({
            name,
            code,
            description: description || '',
            parentClassId,
            level: level || 1,
            assetType,
            riskLevel,
            liquidityTier,
            regulatoryCategory,
            secClassification,
            minimumInvestment,
            typicalHoldingPeriod,
            isActive: true
        }, req.user.tenantId);
        res.status(201).json({
            success: true,
            data: assetClass,
            message: 'Asset class created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating asset class:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create asset class',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update asset class
router.put('/asset-classes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const assetClass = await assetClassificationService.updateAssetClass(id, updates, req.user.tenantId);
        res.json({
            success: true,
            data: assetClass,
            message: 'Asset class updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating asset class:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update asset class',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Asset Sub-Class Management Routes
// Get asset sub-classes
router.get('/asset-subclasses', async (req, res) => {
    try {
        const { assetClassId } = req.query;
        const subClasses = await assetClassificationService.getAssetSubClasses(req.user.tenantId, assetClassId);
        res.json({
            success: true,
            data: subClasses,
            total: subClasses.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching asset sub-classes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch asset sub-classes',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create asset sub-class
router.post('/asset-subclasses', async (req, res) => {
    try {
        const { assetClassId, name, code, description, characteristics, primaryBenchmark, secondaryBenchmarks, expectedReturn, volatility, sharpeRatio, maxDrawdown, correlationToMarket, correlationToBonds } = req.body;
        // Validation
        if (!assetClassId || !name || !code) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: assetClassId, name, code'
            });
        }
        const subClass = await assetClassificationService.createAssetSubClass({
            assetClassId,
            name,
            code,
            description: description || '',
            characteristics: characteristics || {},
            primaryBenchmark,
            secondaryBenchmarks: secondaryBenchmarks || [],
            expectedReturn,
            volatility,
            sharpeRatio,
            maxDrawdown,
            correlationToMarket,
            correlationToBonds,
            isActive: true
        }, req.user.tenantId);
        res.status(201).json({
            success: true,
            data: subClass,
            message: 'Asset sub-class created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating asset sub-class:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create asset sub-class',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Instrument Classification Routes
// Classify an instrument
router.post('/instruments/:instrumentId/classify', async (req, res) => {
    try {
        const { instrumentId } = req.params;
        const { symbol, instrumentName, instrumentType, additionalData } = req.body;
        // Validation
        if (!instrumentName || !instrumentType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: instrumentName, instrumentType'
            });
        }
        const classification = await assetClassificationService.classifyInstrument({
            securityId: instrumentId,
            symbol,
            instrumentName,
            instrumentType,
            additionalData,
            tenantId: req.user.tenantId,
            classifiedBy: req.user.userId
        });
        res.status(201).json({
            success: true,
            data: classification,
            message: 'Instrument classified successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error classifying instrument:', error);
        const statusCode = error instanceof Error && error.message.includes('already classified') ? 409 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to classify instrument',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get instrument classification
router.get('/instruments/:instrumentId/classification', async (req, res) => {
    try {
        const { instrumentId } = req.params;
        const classification = await assetClassificationService.getInstrumentClassification(instrumentId, req.user.tenantId);
        if (!classification) {
            return res.status(404).json({
                success: false,
                error: 'Instrument classification not found'
            });
        }
        res.json({
            success: true,
            data: classification
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching instrument classification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch instrument classification',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update instrument classification
router.put('/instruments/:instrumentId/classification', async (req, res) => {
    try {
        const { instrumentId } = req.params;
        const { assetClassId, assetSubClassId, classifications, gicsCode, countryCode, marketCapCategory, styleClassification, creditRating, esgScore } = req.body;
        const classification = await assetClassificationService.updateInstrumentClassification({
            securityId: instrumentId,
            assetClassId,
            assetSubClassId,
            classifications,
            gicsCode,
            countryCode,
            marketCapCategory,
            styleClassification,
            creditRating,
            esgScore,
            tenantId: req.user.tenantId,
            updatedBy: req.user.userId
        });
        res.json({
            success: true,
            data: classification,
            message: 'Instrument classification updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating instrument classification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update instrument classification',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Asset Allocation Management Routes
// Get asset allocations
router.get('/allocations', async (req, res) => {
    try {
        const { portfolioId } = req.query;
        const allocations = await assetClassificationService.getAssetAllocations(req.user.tenantId, portfolioId);
        res.json({
            success: true,
            data: allocations,
            total: allocations.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching asset allocations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch asset allocations',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create asset allocation
router.post('/allocations', async (req, res) => {
    try {
        const { portfolioId, name, description, allocations, constraints, riskProfile, timeHorizon, rebalancingThreshold, rebalancingFrequency } = req.body;
        // Validation
        if (!name || !allocations || !Array.isArray(allocations) || allocations.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, allocations (array)'
            });
        }
        const validRiskProfiles = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'VERY_AGGRESSIVE'];
        if (riskProfile && !validRiskProfiles.includes(riskProfile)) {
            return res.status(400).json({
                success: false,
                error: `Invalid risk profile. Must be one of: ${validRiskProfiles.join(', ')}`
            });
        }
        const validTimeHorizons = ['SHORT', 'MEDIUM', 'LONG', 'VERY_LONG'];
        if (timeHorizon && !validTimeHorizons.includes(timeHorizon)) {
            return res.status(400).json({
                success: false,
                error: `Invalid time horizon. Must be one of: ${validTimeHorizons.join(', ')}`
            });
        }
        // Validate allocation percentages
        const totalPercentage = allocations.reduce((sum, alloc) => sum + (alloc.targetPercentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
            return res.status(400).json({
                success: false,
                error: 'Allocation percentages must sum to 100%'
            });
        }
        const allocation = await assetClassificationService.createAssetAllocation({
            portfolioId,
            name,
            description,
            allocations,
            constraints: constraints || [],
            riskProfile: riskProfile || 'MODERATE',
            timeHorizon: timeHorizon || 'MEDIUM',
            rebalancingThreshold,
            rebalancingFrequency,
            tenantId: req.user.tenantId,
            createdBy: req.user.userId
        });
        res.status(201).json({
            success: true,
            data: allocation,
            message: 'Asset allocation created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating asset allocation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create asset allocation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Analytics and Reporting Routes
// Get classification summary
router.get('/summary', async (req, res) => {
    try {
        const summary = await assetClassificationService.getClassificationSummary(req.user.tenantId);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching classification summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch classification summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Analyze portfolio classification
router.get('/portfolios/:portfolioId/analysis', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const analysis = await assetClassificationService.analyzePortfolioClassification(portfolioId, req.user.tenantId);
        res.json({
            success: true,
            data: analysis
        });
    }
    catch (error) {
        logger_1.logger.error('Error analyzing portfolio classification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze portfolio classification',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Bulk classification operations
router.post('/instruments/bulk-classify', async (req, res) => {
    try {
        const { instruments } = req.body;
        if (!Array.isArray(instruments) || instruments.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: instruments (array)'
            });
        }
        const results = [];
        const errors = [];
        for (const instrument of instruments) {
            try {
                const classification = await assetClassificationService.classifyInstrument({
                    securityId: instrument.securityId,
                    symbol: instrument.symbol,
                    instrumentName: instrument.instrumentName,
                    instrumentType: instrument.instrumentType,
                    additionalData: instrument.additionalData,
                    tenantId: req.user.tenantId,
                    classifiedBy: req.user.userId
                });
                results.push(classification);
            }
            catch (error) {
                errors.push({
                    securityId: instrument.securityId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        res.json({
            success: true,
            data: {
                successful: results,
                failed: errors,
                totalProcessed: instruments.length,
                successCount: results.length,
                errorCount: errors.length
            },
            message: `Bulk classification completed: ${results.length} successful, ${errors.length} failed`
        });
    }
    catch (error) {
        logger_1.logger.error('Error in bulk classification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform bulk classification',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Standard asset classes reference
router.get('/standard-classes', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                standardAssetClasses: {
                    EQUITY: {
                        name: 'Equity',
                        description: 'Equity securities including stocks and equity-like instruments',
                        subcategories: {
                            DOMESTIC_LARGE_CAP: 'Domestic Large Cap Equity',
                            DOMESTIC_MID_CAP: 'Domestic Mid Cap Equity',
                            DOMESTIC_SMALL_CAP: 'Domestic Small Cap Equity',
                            INTERNATIONAL_DEVELOPED: 'International Developed Market Equity',
                            EMERGING_MARKETS: 'Emerging Markets Equity',
                            REAL_ESTATE: 'Real Estate Investment Trusts'
                        }
                    },
                    FIXED_INCOME: {
                        name: 'Fixed Income',
                        description: 'Fixed income securities including bonds and money market instruments',
                        subcategories: {
                            GOVERNMENT_BONDS: 'Government Bonds',
                            CORPORATE_BONDS: 'Corporate Bonds',
                            HIGH_YIELD_BONDS: 'High Yield Bonds',
                            MUNICIPAL_BONDS: 'Municipal Bonds',
                            INTERNATIONAL_BONDS: 'International Bonds',
                            TREASURY_BILLS: 'Treasury Bills'
                        }
                    },
                    CASH_EQUIVALENT: {
                        name: 'Cash Equivalents',
                        description: 'Highly liquid, short-term instruments',
                        subcategories: {
                            MONEY_MARKET: 'Money Market Funds',
                            BANK_DEPOSITS: 'Bank Deposits',
                            COMMERCIAL_PAPER: 'Commercial Paper'
                        }
                    },
                    ALTERNATIVE: {
                        name: 'Alternative Investments',
                        description: 'Alternative asset classes including private markets',
                        subcategories: {
                            PRIVATE_EQUITY: 'Private Equity',
                            HEDGE_FUNDS: 'Hedge Funds',
                            COMMODITIES: 'Commodities',
                            INFRASTRUCTURE: 'Infrastructure',
                            PRIVATE_DEBT: 'Private Debt'
                        }
                    }
                },
                riskLevels: ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'],
                liquidityTiers: ['T0', 'T1', 'T2', 'T3', 'ILLIQUID'],
                riskProfiles: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'VERY_AGGRESSIVE'],
                timeHorizons: ['SHORT', 'MEDIUM', 'LONG', 'VERY_LONG']
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching standard asset classes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch standard asset classes',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

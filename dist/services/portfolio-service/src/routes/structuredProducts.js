"use strict";
// Structured Products API Routes
// Phase 4.1 - RESTful API endpoints for structured products management
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const kafka_mock_1 = require("../utils/kafka-mock");
const logger_1 = require("../utils/logger");
const StructuredProductsService_1 = require("../services/structuredProducts/StructuredProductsService");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const structuredProductsService = new StructuredProductsService_1.StructuredProductsService(prisma, kafkaService);
// Apply authentication to all routes
router.use(auth_1.requireAuth);
// Create structured product
router.post('/', async (req, res) => {
    try {
        const request = req.body;
        // Validate required fields
        if (!request.productData) {
            return res.status(400).json({
                success: false,
                error: 'productData is required'
            });
        }
        if (!request.underlyingAssets || request.underlyingAssets.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'underlyingAssets are required'
            });
        }
        const product = await structuredProductsService.createProduct(request, req.user.tenantId, req.user.userId);
        logger_1.logger.info('Structured product created via API', {
            productId: product.id,
            userId: req.user.userId,
            tenantId: req.user.tenantId
        });
        res.status(201).json({
            success: true,
            data: product,
            message: 'Structured product created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating structured product:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get structured product by ID
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await structuredProductsService.getProduct(productId, req.user.tenantId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Structured product not found'
            });
        }
        res.json({
            success: true,
            data: product
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving structured product:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Update structured product
router.put('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const updates = req.body;
        const updatedProduct = await structuredProductsService.updateProduct(productId, updates, req.user.tenantId, req.user.userId);
        logger_1.logger.info('Structured product updated via API', {
            productId,
            userId: req.user.userId
        });
        res.json({
            success: true,
            data: updatedProduct,
            message: 'Structured product updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating structured product:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Search structured products
router.get('/', async (req, res) => {
    try {
        const searchRequest = {
            tenantId: req.user.tenantId,
            productTypes: req.query.productTypes ?
                (Array.isArray(req.query.productTypes) ? req.query.productTypes : [req.query.productTypes]) :
                undefined,
            issuers: req.query.issuers ?
                (Array.isArray(req.query.issuers) ? req.query.issuers : [req.query.issuers]) :
                undefined,
            underlyingTypes: req.query.underlyingTypes ?
                (Array.isArray(req.query.underlyingTypes) ? req.query.underlyingTypes : [req.query.underlyingTypes]) :
                undefined,
            riskLevels: req.query.riskLevels ?
                (Array.isArray(req.query.riskLevels) ? req.query.riskLevels : [req.query.riskLevels]) :
                undefined,
            hasBarrier: req.query.hasBarrier === 'true' ? true :
                req.query.hasBarrier === 'false' ? false : undefined,
            isCallable: req.query.isCallable === 'true' ? true :
                req.query.isCallable === 'false' ? false : undefined,
            hasCapitalProtection: req.query.hasCapitalProtection === 'true' ? true :
                req.query.hasCapitalProtection === 'false' ? false : undefined,
            maturityDateRange: req.query.maturityStartDate && req.query.maturityEndDate ? {
                startDate: new Date(req.query.maturityStartDate),
                endDate: new Date(req.query.maturityEndDate)
            } : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        const searchResults = await structuredProductsService.searchProducts(searchRequest);
        res.json({
            success: true,
            data: searchResults
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching structured products:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Valuate structured product
router.post('/:productId/valuation', async (req, res) => {
    try {
        const { productId } = req.params;
        const { valuationDate, modelType, includeGreeks, scenarioAnalysis, customParameters } = req.body;
        const valuationRequest = {
            productId,
            valuationDate: valuationDate ? new Date(valuationDate) : new Date(),
            modelType,
            includeGreeks: includeGreeks === true,
            scenarioAnalysis: scenarioAnalysis === true,
            customParameters
        };
        const valuationResult = await structuredProductsService.valuateProduct(valuationRequest);
        logger_1.logger.info('Product valuation completed via API', {
            productId,
            theoreticalValue: valuationResult.theoreticalValue,
            userId: req.user.userId
        });
        res.json({
            success: true,
            data: valuationResult,
            message: 'Product valuation completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error valuating structured product:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Batch valuate multiple products
router.post('/batch-valuation', async (req, res) => {
    try {
        const { productIds, valuationDate } = req.body;
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'productIds array is required'
            });
        }
        const results = await structuredProductsService.batchValuateProducts(productIds, valuationDate ? new Date(valuationDate) : new Date(), req.user.tenantId);
        logger_1.logger.info('Batch valuation completed via API', {
            productCount: productIds.length,
            userId: req.user.userId
        });
        res.json({
            success: true,
            data: results,
            message: 'Batch valuation completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error in batch valuation:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Monitor barriers
router.post('/barriers/monitor', async (req, res) => {
    try {
        const { productIds, portfolioIds, alertThreshold, includeHitBarriers } = req.body;
        const monitoringRequest = {
            productIds,
            portfolioIds,
            alertThreshold,
            includeHitBarriers
        };
        const monitoringResult = await structuredProductsService.monitorBarriers(monitoringRequest);
        logger_1.logger.info('Barrier monitoring completed via API', {
            totalBarriers: monitoringResult.summary.totalBarriers,
            newAlerts: monitoringResult.alerts.length,
            userId: req.user.userId
        });
        res.json({
            success: true,
            data: monitoringResult,
            message: 'Barrier monitoring completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error monitoring barriers:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get barrier dashboard
router.get('/barriers/dashboard', async (req, res) => {
    try {
        const dashboardData = await structuredProductsService.barrierMonitoringService.getBarrierDashboard(req.user.tenantId);
        res.json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving barrier dashboard:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get barrier history for a product
router.get('/:productId/barriers/history', async (req, res) => {
    try {
        const { productId } = req.params;
        const { startDate, endDate } = req.query;
        const history = await structuredProductsService.barrierMonitoringService.getBarrierHistory(productId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving barrier history:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Calculate barrier breach probability
router.post('/:productId/barriers/breach-probability', async (req, res) => {
    try {
        const { productId } = req.params;
        const { timeHorizonDays, confidenceLevel } = req.body;
        if (!timeHorizonDays || timeHorizonDays <= 0) {
            return res.status(400).json({
                success: false,
                error: 'timeHorizonDays must be a positive number'
            });
        }
        const probability = await structuredProductsService.barrierMonitoringService.calculateBreachProbability(productId, timeHorizonDays, confidenceLevel);
        res.json({
            success: true,
            data: probability,
            message: 'Barrier breach probability calculated'
        });
    }
    catch (error) {
        logger_1.logger.error('Error calculating barrier breach probability:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Parse document
router.post('/documents/parse', async (req, res) => {
    try {
        const { documentId, documentPath, documentType } = req.body;
        if (!documentId || !documentPath || !documentType) {
            return res.status(400).json({
                success: false,
                error: 'documentId, documentPath, and documentType are required'
            });
        }
        if (!['TERM_SHEET', 'PROSPECTUS', 'MARKETING', 'LEGAL'].includes(documentType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid documentType. Must be one of: TERM_SHEET, PROSPECTUS, MARKETING, LEGAL'
            });
        }
        const parsingResult = await structuredProductsService.parseDocument(documentId, documentPath, documentType, req.user.tenantId);
        logger_1.logger.info('Document parsing completed via API', {
            documentId,
            documentType,
            overallConfidence: parsingResult.overallConfidence,
            requiresReview: parsingResult.requiresReview,
            userId: req.user.userId
        });
        res.json({
            success: true,
            data: parsingResult,
            message: 'Document parsing completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error parsing document:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get document parsing result
router.get('/documents/parse/:documentId', async (req, res) => {
    try {
        const { documentId } = req.params;
        const parsingResult = await structuredProductsService.documentParsingService.getParsingResult(documentId);
        if (!parsingResult) {
            return res.status(404).json({
                success: false,
                error: 'Parsing result not found'
            });
        }
        res.json({
            success: true,
            data: parsingResult
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving parsing result:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Review and correct parsing result
router.post('/documents/parse/:parsingResultId/review', async (req, res) => {
    try {
        const { parsingResultId } = req.params;
        const { corrections } = req.body;
        if (!corrections || typeof corrections !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'corrections object is required'
            });
        }
        const updatedResult = await structuredProductsService.documentParsingService.reviewAndCorrect(parsingResultId, corrections, req.user.userId);
        logger_1.logger.info('Document parsing review completed via API', {
            parsingResultId,
            correctionCount: Object.keys(corrections).length,
            reviewerId: req.user.userId
        });
        res.json({
            success: true,
            data: updatedResult,
            message: 'Parsing review completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error reviewing parsing result:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Create position in structured product
router.post('/:productId/positions', async (req, res) => {
    try {
        const { productId } = req.params;
        const { portfolioId, quantity, acquisitionPrice } = req.body;
        if (!portfolioId || !quantity || !acquisitionPrice) {
            return res.status(400).json({
                success: false,
                error: 'portfolioId, quantity, and acquisitionPrice are required'
            });
        }
        if (quantity <= 0 || acquisitionPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'quantity and acquisitionPrice must be positive'
            });
        }
        const position = await structuredProductsService.createPosition(productId, portfolioId, quantity, acquisitionPrice, req.user.tenantId, req.user.userId);
        logger_1.logger.info('Structured product position created via API', {
            positionId: position.id,
            productId,
            portfolioId,
            userId: req.user.userId
        });
        res.status(201).json({
            success: true,
            data: position,
            message: 'Position created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating position:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get portfolio positions
router.get('/portfolios/:portfolioId/positions', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const positions = await structuredProductsService.getPortfolioPositions(portfolioId, req.user.tenantId);
        res.json({
            success: true,
            data: positions
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving portfolio positions:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get portfolio analytics
router.get('/portfolios/:portfolioId/analytics', async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const analytics = await structuredProductsService.getPortfolioAnalytics(portfolioId, req.user.tenantId);
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving portfolio analytics:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get issuer credit risk
router.get('/issuers/:issuerId/credit-risk', async (req, res) => {
    try {
        const { issuerId } = req.params;
        const creditRisk = await structuredProductsService.getIssuerCreditRisk(issuerId, req.user.tenantId);
        if (!creditRisk) {
            return res.status(404).json({
                success: false,
                error: 'Issuer credit risk data not found'
            });
        }
        res.json({
            success: true,
            data: creditRisk
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving issuer credit risk:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Stress test product
router.post('/:productId/stress-test', async (req, res) => {
    try {
        const { productId } = req.params;
        const { stressScenarios } = req.body;
        if (!stressScenarios || !Array.isArray(stressScenarios) || stressScenarios.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'stressScenarios array is required'
            });
        }
        // Validate stress scenarios
        for (const scenario of stressScenarios) {
            if (!scenario.name || !scenario.underlyingShifts) {
                return res.status(400).json({
                    success: false,
                    error: 'Each scenario must have name and underlyingShifts'
                });
            }
        }
        const stressResults = await structuredProductsService.valuationService.performStressTest(productId, stressScenarios);
        logger_1.logger.info('Stress test completed via API', {
            productId,
            scenarioCount: stressScenarios.length,
            userId: req.user.userId
        });
        res.json({
            success: true,
            data: stressResults,
            message: 'Stress test completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error in stress test:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Start real-time monitoring
router.post('/monitoring/start', async (req, res) => {
    try {
        await structuredProductsService.startRealTimeMonitoring(req.user.tenantId);
        logger_1.logger.info('Real-time monitoring started via API', {
            tenantId: req.user.tenantId,
            userId: req.user.userId
        });
        res.json({
            success: true,
            message: 'Real-time monitoring started successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting real-time monitoring:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        res.json({
            success: true,
            service: 'Structured Products API',
            timestamp: new Date().toISOString(),
            version: '4.1.0'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
exports.default = router;

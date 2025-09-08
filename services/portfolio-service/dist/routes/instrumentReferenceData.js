"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const kafka_mock_1 = require("../utils/kafka-mock");
const instrumentReferenceDataService_1 = require("../services/instrumentReferenceDataService");
const logger_1 = require("../utils/logger");
const InstrumentReferenceData_1 = require("../models/assets/InstrumentReferenceData");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const instrumentService = new instrumentReferenceDataService_1.InstrumentReferenceDataService(prisma, kafkaService);
// Instrument Master Data Routes
// Create new instrument
router.post('/instruments', async (req, res) => {
    try {
        const { securityId, identifiers, name, shortName, description, instrumentType, securityType, issuerName, issuerCountry, primaryExchange, tradingCurrency, dataSource, dataVendor } = req.body;
        // Validation
        if (!securityId || !name || !instrumentType || !securityType || !issuerName || !tradingCurrency) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: securityId, name, instrumentType, securityType, issuerName, tradingCurrency'
            });
        }
        const validInstrumentTypes = [
            'EQUITY', 'BOND', 'MONEY_MARKET', 'MUTUAL_FUND', 'ETF', 'OPTION',
            'FUTURE', 'SWAP', 'FORWARD', 'COMMODITY', 'CURRENCY', 'INDEX', 'WARRANT'
        ];
        if (!validInstrumentTypes.includes(instrumentType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid instrument type. Must be one of: ${validInstrumentTypes.join(', ')}`
            });
        }
        if (!InstrumentReferenceData_1.CURRENCY_CODES.includes(tradingCurrency)) {
            return res.status(400).json({
                success: false,
                error: `Invalid trading currency. Must be one of: ${InstrumentReferenceData_1.CURRENCY_CODES.join(', ')}`
            });
        }
        const instrument = await instrumentService.createInstrument({
            securityId,
            identifiers: identifiers || {},
            name,
            shortName,
            description,
            instrumentType,
            securityType,
            issuerName,
            issuerCountry,
            primaryExchange,
            tradingCurrency,
            dataSource: dataSource || 'Manual Entry',
            dataVendor: dataVendor || 'Internal',
            tenantId: req.user.tenantId,
            createdBy: req.user.userId
        });
        res.status(201).json({
            success: true,
            data: instrument,
            message: 'Instrument created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating instrument:', error);
        const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to create instrument',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Search instruments
router.get('/instruments/search', async (req, res) => {
    try {
        const { query, cusip, isin, sedol, ticker, instrumentType, securityType, exchange, currency, isActive, limit, offset } = req.query;
        const identifiers = {};
        if (cusip)
            identifiers.cusip = cusip;
        if (isin)
            identifiers.isin = isin;
        if (sedol)
            identifiers.sedol = sedol;
        if (ticker)
            identifiers.ticker = ticker;
        const result = await instrumentService.searchInstruments({
            query: query,
            identifiers: Object.keys(identifiers).length > 0 ? identifiers : undefined,
            instrumentType: instrumentType ? instrumentType.split(',') : undefined,
            securityType: securityType ? securityType.split(',') : undefined,
            exchange: exchange ? exchange.split(',') : undefined,
            currency: currency ? currency.split(',') : undefined,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            tenantId: req.user.tenantId
        });
        res.json({
            success: true,
            data: result.instruments,
            pagination: {
                total: result.total,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
                hasMore: result.hasMore
            },
            filters: result.filters
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching instruments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search instruments',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Lookup instrument by identifier
router.get('/instruments/lookup/:identifierType/:identifier', async (req, res) => {
    try {
        const { identifierType, identifier } = req.params;
        const validIdentifierTypes = ['CUSIP', 'ISIN', 'SEDOL', 'TICKER', 'BLOOMBERG', 'RIC'];
        if (!validIdentifierTypes.includes(identifierType.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: `Invalid identifier type. Must be one of: ${validIdentifierTypes.join(', ')}`
            });
        }
        const instrument = await instrumentService.lookupInstrument({
            identifier,
            identifierType: identifierType.toUpperCase(),
            tenantId: req.user.tenantId
        });
        if (!instrument) {
            return res.status(404).json({
                success: false,
                error: 'Instrument not found'
            });
        }
        res.json({
            success: true,
            data: instrument
        });
    }
    catch (error) {
        logger_1.logger.error('Error looking up instrument:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to lookup instrument',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get instrument by ID
router.get('/instruments/:securityId', async (req, res) => {
    try {
        const { securityId } = req.params;
        const instrument = await instrumentService.lookupInstrument({
            identifier: securityId,
            identifierType: 'TICKER', // This is a fallback, we'll need to search more broadly
            tenantId: req.user.tenantId
        });
        if (!instrument) {
            return res.status(404).json({
                success: false,
                error: 'Instrument not found'
            });
        }
        res.json({
            success: true,
            data: instrument
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching instrument:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch instrument',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update instrument
router.put('/instruments/:securityId', async (req, res) => {
    try {
        const { securityId } = req.params;
        const updates = req.body;
        // Remove read-only fields
        delete updates.id;
        delete updates.createdAt;
        delete updates.createdBy;
        const instrument = await instrumentService.updateInstrument({
            securityId,
            updates,
            tenantId: req.user.tenantId,
            updatedBy: req.user.userId
        });
        res.json({
            success: true,
            data: instrument,
            message: 'Instrument updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating instrument:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update instrument',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Bulk update instruments
router.post('/instruments/bulk-update', async (req, res) => {
    try {
        const { instruments } = req.body;
        if (!Array.isArray(instruments) || instruments.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: instruments (array)'
            });
        }
        const result = await instrumentService.bulkUpdateInstruments({
            instruments,
            tenantId: req.user.tenantId,
            updatedBy: req.user.userId
        });
        res.json({
            success: true,
            data: result,
            message: `Bulk update completed: ${result.successful.length} successful, ${result.failed.length} failed`
        });
    }
    catch (error) {
        logger_1.logger.error('Error in bulk update:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform bulk update',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Corporate Actions Routes
// Create corporate action
router.post('/instruments/:securityId/corporate-actions', async (req, res) => {
    try {
        const { securityId } = req.params;
        const { actionType, announcementDate, exDate, recordDate, payableDate, actionDetails, dataSource } = req.body;
        // Validation
        if (!actionType || !announcementDate || !exDate || !recordDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: actionType, announcementDate, exDate, recordDate'
            });
        }
        const validActionTypes = [
            'DIVIDEND', 'STOCK_SPLIT', 'STOCK_DIVIDEND', 'RIGHTS_OFFERING', 'SPINOFF',
            'MERGER', 'ACQUISITION', 'TENDER_OFFER', 'LIQUIDATION', 'BANKRUPTCY',
            'DELISTING', 'NAME_CHANGE', 'TICKER_CHANGE', 'INTEREST_PAYMENT',
            'PRINCIPAL_PAYMENT', 'CALL', 'PUT', 'MATURITY'
        ];
        if (!validActionTypes.includes(actionType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid action type. Must be one of: ${validActionTypes.join(', ')}`
            });
        }
        const corporateAction = await instrumentService.processCorporateAction({
            securityId,
            actionType,
            announcementDate: new Date(announcementDate),
            exDate: new Date(exDate),
            recordDate: new Date(recordDate),
            payableDate: payableDate ? new Date(payableDate) : undefined,
            actionDetails: actionDetails || {},
            dataSource: dataSource || 'Manual Entry',
            tenantId: req.user.tenantId,
            processedBy: req.user.userId
        });
        res.status(201).json({
            success: true,
            data: corporateAction,
            message: 'Corporate action created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating corporate action:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create corporate action',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get corporate actions for instrument
router.get('/instruments/:securityId/corporate-actions', async (req, res) => {
    try {
        const { securityId } = req.params;
        const corporateActions = await instrumentService.getCorporateActions(securityId);
        res.json({
            success: true,
            data: corporateActions,
            total: corporateActions.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching corporate actions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch corporate actions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Market Data Routes
// Update market data
router.post('/instruments/:securityId/market-data', async (req, res) => {
    try {
        const { securityId } = req.params;
        const marketData = req.body;
        // Validate required fields
        const requiredFields = ['dataSource', 'dataVendor'];
        const missingFields = requiredFields.filter(field => !marketData[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        await instrumentService.updateMarketData(securityId, marketData);
        res.json({
            success: true,
            message: 'Market data updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating market data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update market data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get current market data
router.get('/instruments/:securityId/market-data', async (req, res) => {
    try {
        const { securityId } = req.params;
        const marketData = await instrumentService.getMarketData(securityId);
        if (!marketData) {
            return res.status(404).json({
                success: false,
                error: 'Market data not found'
            });
        }
        res.json({
            success: true,
            data: marketData
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching market data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Data Quality and Validation Routes
// Validate instrument data
router.get('/instruments/:securityId/validate', async (req, res) => {
    try {
        const { securityId } = req.params;
        const validation = await instrumentService.validateInstrumentData(securityId, req.user.tenantId);
        res.json({
            success: true,
            data: validation
        });
    }
    catch (error) {
        logger_1.logger.error('Error validating instrument:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate instrument',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Generate data quality report
router.get('/instruments/:securityId/data-quality-report', async (req, res) => {
    try {
        const { securityId } = req.params;
        const report = await instrumentService.generateDataQualityReport(securityId, req.user.tenantId);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating data quality report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate data quality report',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reference Data Routes
// Get standard reference data
router.get('/reference-data', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                instrumentTypes: [
                    'EQUITY', 'BOND', 'MONEY_MARKET', 'MUTUAL_FUND', 'ETF', 'OPTION',
                    'FUTURE', 'SWAP', 'FORWARD', 'COMMODITY', 'CURRENCY', 'INDEX', 'WARRANT'
                ],
                securityTypes: [
                    'COMMON_STOCK', 'PREFERRED_STOCK', 'GOVERNMENT_BOND', 'CORPORATE_BOND',
                    'MUNICIPAL_BOND', 'TREASURY_BILL', 'MONEY_MARKET_FUND', 'MUTUAL_FUND',
                    'ETF', 'REIT', 'MLP', 'ADR', 'GDR', 'CALL_OPTION', 'PUT_OPTION'
                ],
                exchanges: InstrumentReferenceData_1.STANDARD_EXCHANGES,
                currencies: InstrumentReferenceData_1.CURRENCY_CODES,
                dataVendors: InstrumentReferenceData_1.STANDARD_DATA_VENDORS,
                corporateActionTypes: [
                    'DIVIDEND', 'STOCK_SPLIT', 'STOCK_DIVIDEND', 'RIGHTS_OFFERING', 'SPINOFF',
                    'MERGER', 'ACQUISITION', 'TENDER_OFFER', 'LIQUIDATION', 'BANKRUPTCY',
                    'DELISTING', 'NAME_CHANGE', 'TICKER_CHANGE', 'INTEREST_PAYMENT',
                    'PRINCIPAL_PAYMENT', 'CALL', 'PUT', 'MATURITY'
                ],
                identifierTypes: ['CUSIP', 'ISIN', 'SEDOL', 'TICKER', 'BLOOMBERG', 'RIC'],
                dataQualityScores: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNVERIFIED']
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching reference data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reference data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Health check for instrument reference data
router.get('/health', async (req, res) => {
    try {
        // Basic health check - verify database connectivity
        const count = await prisma.instrumentMaster.count();
        res.json({
            success: true,
            status: 'healthy',
            data: {
                totalInstruments: count,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Service unavailable',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

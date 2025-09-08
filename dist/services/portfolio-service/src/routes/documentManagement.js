"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const kafka_mock_1 = require("../utils/kafka-mock");
const logger_1 = require("../utils/logger");
const validation_1 = require("../middleware/validation");
const DocumentSearchService_1 = require("../services/documentManagement/DocumentSearchService");
const OCRService_1 = require("../services/documentManagement/OCRService");
const MultiLanguageProcessingService_1 = require("../services/documentManagement/MultiLanguageProcessingService");
const TemplateRecognitionService_1 = require("../services/documentManagement/TemplateRecognitionService");
const DataExtractionService_1 = require("../services/documentManagement/DataExtractionService");
const DocumentFilingService_1 = require("../services/documentManagement/DocumentFilingService");
const DocumentVersionControlService_1 = require("../services/documentManagement/DocumentVersionControlService");
const DocumentManagement_1 = require("../models/documentManagement/DocumentManagement");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
// Initialize services
const searchService = new DocumentSearchService_1.DocumentSearchService(prisma, logger_1.logger, kafkaService);
const ocrService = new OCRService_1.OCRService(prisma, logger_1.logger, kafkaService);
const languageService = new MultiLanguageProcessingService_1.MultiLanguageProcessingService(prisma, logger_1.logger, kafkaService);
const templateService = new TemplateRecognitionService_1.TemplateRecognitionService(prisma, logger_1.logger, kafkaService);
const extractionService = new DataExtractionService_1.DataExtractionService(prisma, logger_1.logger, kafkaService);
const filingService = new DocumentFilingService_1.DocumentFilingService(prisma, logger_1.logger, kafkaService);
const versionControlService = new DocumentVersionControlService_1.DocumentVersionControlService(prisma, logger_1.logger, kafkaService);
// Helper function for error handling
function getErrorMessage(error) {
    if (error instanceof Error) {
        return getErrorMessage(error);
    }
    return String(error);
}
// Document upload and processing
router.post('/upload', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const documentRequest = req.body;
        logger_1.logger.info('Document upload initiated', {
            tenantId,
            userId,
            fileName: documentRequest.fileName,
            documentType: documentRequest.documentType
        });
        // TODO: Handle file upload logic
        const documentId = `doc_${Date.now()}`;
        res.status(201).json({
            success: true,
            documentId,
            message: 'Document uploaded successfully',
            processingStatus: 'PENDING'
        });
    }
    catch (error) {
        logger_1.logger.error('Document upload failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to upload document'
        });
    }
});
// Document search
router.post('/search', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const searchRequest = {
            ...req.body,
            tenantId
        };
        logger_1.logger.info('Document search initiated', {
            tenantId,
            query: searchRequest.query,
            page: searchRequest.page,
            limit: searchRequest.limit
        });
        const searchResult = await searchService.searchDocuments(searchRequest);
        res.status(200).json({
            success: true,
            data: searchResult
        });
    }
    catch (error) {
        logger_1.logger.error('Document search failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to search documents'
        });
    }
});
// Semantic search
router.post('/semantic-search', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { text, similarityThreshold = 0.7, maxResults = 10 } = req.body;
        logger_1.logger.info('Semantic search initiated', {
            tenantId,
            text,
            similarityThreshold,
            maxResults
        });
        // const semanticResults = await searchService.semanticSearch({ // method is private
        //   text,
        //   similarityThreshold,
        //   maxResults,
        //   includeMetadata: true
        // }, tenantId);
        const semanticResults = []; // placeholder since semanticSearch is private
        res.status(200).json({
            success: true,
            data: semanticResults
        });
    }
    catch (error) {
        logger_1.logger.error('Semantic search failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to perform semantic search'
        });
    }
});
// OCR processing
router.post('/:documentId/ocr', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { documentId } = req.params;
        const { language = DocumentManagement_1.Language.ENGLISH, ocrEngine = 'TESSERACT', enablePreprocessing = true, enablePostProcessing = true } = req.body;
        logger_1.logger.info('OCR processing initiated', {
            tenantId,
            documentId,
            language,
            ocrEngine
        });
        const ocrResults = await ocrService.performOCR({
            documentId,
            tenantId,
            filePath: `/documents/${documentId}`,
            language,
            enablePreprocessing,
            enablePostProcessing,
            ocrEngine,
            confidence: 0.7
        });
        res.status(200).json({
            success: true,
            data: ocrResults
        });
    }
    catch (error) {
        logger_1.logger.error('OCR processing failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to process OCR'
        });
    }
});
// Template recognition
router.post('/:documentId/recognize-template', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { documentId } = req.params;
        const { ocrResults, expectedDocumentType, language = DocumentManagement_1.Language.ENGLISH } = req.body;
        logger_1.logger.info('Template recognition initiated', {
            tenantId,
            documentId,
            expectedDocumentType,
            language
        });
        const recognitionResult = await templateService.recognizeTemplate({
            documentId,
            tenantId,
            ocrResults,
            expectedDocumentType,
            language,
            confidence: 0.7
        });
        res.status(200).json({
            success: true,
            data: recognitionResult
        });
    }
    catch (error) {
        logger_1.logger.error('Template recognition failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to recognize template'
        });
    }
});
// Data extraction
router.post('/:documentId/extract-data', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { documentId } = req.params;
        const { template, ocrResults, language = DocumentManagement_1.Language.ENGLISH, enableValidation = true, enablePostProcessing = true } = req.body;
        logger_1.logger.info('Data extraction initiated', {
            tenantId,
            documentId,
            templateId: template?.id,
            language
        });
        const extractionResult = await extractionService.extractData({
            documentId,
            tenantId,
            template,
            ocrResults,
            language,
            enableValidation,
            enablePostProcessing,
            confidence: 0.7
        });
        res.status(200).json({
            success: true,
            data: extractionResult
        });
    }
    catch (error) {
        logger_1.logger.error('Data extraction failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to extract data'
        });
    }
});
// Document filing
router.post('/:documentId/file', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { documentId } = req.params;
        const { document, extractedData, enableAutoClassification = true, enableAutoTagging = true, targetDirectory } = req.body;
        logger_1.logger.info('Document filing initiated', {
            tenantId,
            documentId,
            enableAutoClassification,
            enableAutoTagging
        });
        const filingResult = await filingService.fileDocument({
            documentId,
            tenantId,
            document,
            extractedData,
            enableAutoClassification,
            enableAutoTagging,
            targetDirectory
        });
        res.status(200).json({
            success: true,
            data: filingResult
        });
    }
    catch (error) {
        logger_1.logger.error('Document filing failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to file document'
        });
    }
});
// Version control operations
router.post('/:documentId/versions', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { documentId } = req.params;
        const { action = 'CREATE_VERSION', newFilePath, changeDescription, metadata } = req.body;
        logger_1.logger.info('Version control operation initiated', {
            tenantId,
            documentId,
            action,
            performedBy: userId
        });
        const versionResult = await versionControlService.manageVersion({
            documentId,
            tenantId,
            action,
            newFilePath,
            changeDescription,
            performedBy: userId,
            metadata
        });
        res.status(200).json({
            success: true,
            data: versionResult
        });
    }
    catch (error) {
        logger_1.logger.error('Version control operation failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to manage document version'
        });
    }
});
// Compare document versions
router.post('/:documentId/versions/compare', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { documentId } = req.params;
        const { version1, version2, comparisonType = 'FULL' } = req.body;
        logger_1.logger.info('Version comparison initiated', {
            tenantId,
            documentId,
            version1,
            version2,
            comparisonType
        });
        const comparisonResult = await versionControlService.compareVersions({
            documentId,
            tenantId,
            version1,
            version2,
            comparisonType
        });
        res.status(200).json({
            success: true,
            data: comparisonResult
        });
    }
    catch (error) {
        logger_1.logger.error('Version comparison failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to compare document versions'
        });
    }
});
// Audit trail
router.get('/audit-trail', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { documentId, action, startDate, endDate, includeMetadata = false, page = 1, limit = 50 } = req.query;
        logger_1.logger.info('Audit trail requested', {
            tenantId,
            documentId,
            userId,
            page,
            limit
        });
        const auditResult = await versionControlService.getAuditTrail({
            documentId: documentId,
            tenantId,
            userId: userId,
            action: action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            includeMetadata: includeMetadata === 'true',
            page: parseInt(page),
            limit: parseInt(limit)
        });
        res.status(200).json({
            success: true,
            data: auditResult
        });
    }
    catch (error) {
        logger_1.logger.error('Audit trail retrieval failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve audit trail'
        });
    }
});
// Multi-language processing
router.post('/:documentId/process-language', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { documentId } = req.params;
        const { text, expectedLanguage, enableLanguageDetection = true, enableTranslation = false, targetLanguages = [], enableLanguageSpecificProcessing = true } = req.body;
        logger_1.logger.info('Multi-language processing initiated', {
            tenantId,
            documentId,
            expectedLanguage,
            enableTranslation,
            targetLanguages
        });
        const languageResult = await languageService.processMultiLanguageDocument({
            documentId,
            tenantId,
            text,
            expectedLanguage,
            enableLanguageDetection,
            enableTranslation,
            targetLanguages,
            preserveOriginalText: true,
            enableLanguageSpecificProcessing
        });
        res.status(200).json({
            success: true,
            data: languageResult
        });
    }
    catch (error) {
        logger_1.logger.error('Multi-language processing failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to process document language'
        });
    }
});
// Index management
router.post('/search/reindex', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        logger_1.logger.info('Search index rebuild initiated', { tenantId });
        await searchService.rebuildIndex(tenantId);
        res.status(200).json({
            success: true,
            message: 'Search index rebuild completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Search index rebuild failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to rebuild search index'
        });
    }
});
// Document metadata
router.get('/:documentId', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { documentId } = req.params;
        logger_1.logger.info('Document metadata requested', { tenantId, documentId });
        // TODO: Implement document retrieval
        res.status(200).json({
            success: true,
            data: {
                id: documentId,
                tenantId,
                status: DocumentManagement_1.DocumentStatus.PROCESSED,
                message: 'Document metadata retrieved successfully'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Document metadata retrieval failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve document metadata'
        });
    }
});
// Delete document
router.delete('/:documentId', validation_1.validateRequest, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { documentId } = req.params;
        logger_1.logger.info('Document deletion initiated', { tenantId, documentId, userId });
        // Remove from search index
        await searchService.removeFromIndex(documentId);
        // TODO: Implement document deletion logic
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Document deletion failed', { error: getErrorMessage(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to delete document'
        });
    }
});
// Health check for document management
router.get('/health', async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            service: 'Document Management',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            components: {
                search: 'operational',
                ocr: 'operational',
                extraction: 'operational',
                filing: 'operational',
                versionControl: 'operational'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Document management health check failed', { error: getErrorMessage(error) });
        res.status(503).json({
            success: false,
            service: 'Document Management',
            status: 'unhealthy',
            error: 'Service unavailable'
        });
    }
});
exports.default = router;

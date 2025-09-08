"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const { body, param, query, validationResult } = require('express-validator');
const ClientDocumentService_1 = require("../services/clientDocuments/ClientDocumentService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const ClientDocuments_1 = require("../models/clientDocuments/ClientDocuments");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const clientDocumentService = new ClientDocumentService_1.ClientDocumentService();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        // Allow common document formats
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/tiff',
            'text/plain',
            'text/csv'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});
// Validation schemas
const clientDocumentUploadSchema = [
    body('clientId').isUUID().withMessage('Valid client ID required'),
    body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('documentType').optional().isIn(Object.values(ClientDocuments_1.DocumentType)).withMessage('Invalid document type'),
    body('accessLevel').optional().isIn(Object.values(ClientDocuments_1.AccessLevel)).withMessage('Invalid access level'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('portfolioId').optional().isUUID().withMessage('Invalid portfolio ID'),
    body('accountId').optional().isUUID().withMessage('Invalid account ID'),
    body('externalReference').optional().isString().withMessage('External reference must be a string'),
    body('autoClassify').optional().isBoolean().withMessage('Auto classify must be boolean'),
    body('autoExtract').optional().isBoolean().withMessage('Auto extract must be boolean'),
    body('autoValidate').optional().isBoolean().withMessage('Auto validate must be boolean')
];
const documentUpdateSchema = [
    param('documentId').isUUID().withMessage('Valid document ID required'),
    body('title').optional().isLength({ min: 1, max: 255 }).withMessage('Title must be less than 255 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('accessLevel').optional().isIn(Object.values(ClientDocuments_1.AccessLevel)).withMessage('Invalid access level'),
    body('status').optional().isIn(Object.values(ClientDocuments_1.DocumentStatus)).withMessage('Invalid status')
];
const documentShareSchema = [
    param('documentId').isUUID().withMessage('Valid document ID required'),
    body('recipientClientId').isUUID().withMessage('Valid recipient client ID required'),
    body('permissions').isArray().withMessage('Permissions array required'),
    body('permissions.*').isIn(Object.values(ClientDocuments_1.DocumentPermission)).withMessage('Invalid permission'),
    body('expirationDate').optional().isISO8601().withMessage('Invalid expiration date')
];
const bulkOperationSchema = [
    body('operationType').isIn(['DELETE', 'ARCHIVE', 'APPROVE', 'REJECT', 'CHANGE_ACCESS']).withMessage('Invalid operation type'),
    body('documentIds').isArray({ min: 1 }).withMessage('Document IDs array required'),
    body('documentIds.*').isUUID().withMessage('All document IDs must be valid UUIDs'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    body('parameters').optional().isObject().withMessage('Parameters must be an object')
];
// Upload client document
router.post('/upload', auth_1.authMiddleware, upload.single('file'), clientDocumentUploadSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        if (!req.file) {
            return res.status(400).json({
                error: 'File is required',
                code: 'FILE_REQUIRED'
            });
        }
        const uploadRequest = {
            tenantId,
            clientId: req.body.clientId,
            portfolioId: req.body.portfolioId,
            accountId: req.body.accountId,
            title: req.body.title,
            description: req.body.description,
            documentType: req.body.documentType,
            file: {
                name: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                content: req.file.buffer
            },
            externalReference: req.body.externalReference,
            tags: req.body.tags,
            accessLevel: req.body.accessLevel,
            priority: req.body.priority,
            autoClassify: req.body.autoClassify,
            autoExtract: req.body.autoExtract,
            autoValidate: req.body.autoValidate
        };
        logger_1.logger.info('Uploading client document', {
            tenantId,
            clientId: uploadRequest.clientId,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            userId
        });
        const result = await clientDocumentService.uploadClientDocument(uploadRequest);
        res.status(201).json({
            success: true,
            data: {
                document: result.document,
                processingJobs: result.processingJobs
            },
            warnings: result.warnings,
            message: 'Document uploaded successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error uploading client document:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'UPLOAD_FAILED'
        });
    }
});
// Get client documents
router.get('/client/:clientId', auth_1.authMiddleware, [
    param('clientId').isUUID().withMessage('Valid client ID required'),
    query('documentType').optional().isIn(Object.values(ClientDocuments_1.DocumentType)).withMessage('Invalid document type'),
    query('status').optional().isIn(Object.values(ClientDocuments_1.DocumentStatus)).withMessage('Invalid status'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { clientId } = req.params;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const options = {
            documentType: req.query.documentType,
            status: req.query.status,
            dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
            dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        };
        logger_1.logger.info('Retrieving client documents', {
            tenantId,
            clientId,
            options,
            userId
        });
        const result = await clientDocumentService.getClientDocuments(tenantId, clientId, userId, options);
        res.json({
            success: true,
            data: result,
            message: 'Client documents retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving client documents:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'RETRIEVAL_FAILED'
        });
    }
});
// Get document by ID
router.get('/:documentId', auth_1.authMiddleware, [param('documentId').isUUID().withMessage('Valid document ID required')], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { documentId } = req.params;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Retrieving document by ID', {
            tenantId,
            documentId,
            userId
        });
        const document = await clientDocumentService.getClientDocumentById(tenantId, documentId, userId);
        if (!document) {
            return res.status(404).json({
                error: 'Document not found',
                code: 'DOCUMENT_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: { document },
            message: 'Document retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving document:', error);
        const statusCode = error instanceof Error && error.message === 'Access denied' ? 403 : 500;
        res.status(statusCode).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: statusCode === 403 ? 'ACCESS_DENIED' : 'RETRIEVAL_FAILED'
        });
    }
});
// Update document
router.put('/:documentId', auth_1.authMiddleware, documentUpdateSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { documentId } = req.params;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Updating document', {
            tenantId,
            documentId,
            updates: req.body,
            userId
        });
        const updatedDocument = await clientDocumentService.updateClientDocument(tenantId, documentId, req.body, userId);
        res.json({
            success: true,
            data: { document: updatedDocument },
            message: 'Document updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating document:', error);
        const statusCode = error instanceof Error && error.message.includes('permission') ? 403 :
            error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: statusCode === 403 ? 'PERMISSION_DENIED' :
                statusCode === 404 ? 'DOCUMENT_NOT_FOUND' : 'UPDATE_FAILED'
        });
    }
});
// Delete document
router.delete('/:documentId', auth_1.authMiddleware, [
    param('documentId').isUUID().withMessage('Valid document ID required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { documentId } = req.params;
        const { reason } = req.body;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Deleting document', {
            tenantId,
            documentId,
            reason,
            userId
        });
        await clientDocumentService.deleteClientDocument(tenantId, documentId, userId, reason);
        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting document:', error);
        const statusCode = error instanceof Error && error.message.includes('permission') ? 403 :
            error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: statusCode === 403 ? 'PERMISSION_DENIED' :
                statusCode === 404 ? 'DOCUMENT_NOT_FOUND' : 'DELETE_FAILED'
        });
    }
});
// Share document
router.post('/:documentId/share', auth_1.authMiddleware, documentShareSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { documentId } = req.params;
        const { recipientClientId, permissions, expirationDate } = req.body;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Sharing document', {
            tenantId,
            documentId,
            recipientClientId,
            permissions,
            userId
        });
        await clientDocumentService.shareDocumentWithClient(tenantId, documentId, recipientClientId, permissions, userId, expirationDate ? new Date(expirationDate) : undefined);
        res.json({
            success: true,
            message: 'Document shared successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error sharing document:', error);
        const statusCode = error instanceof Error && error.message.includes('permission') ? 403 :
            error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: statusCode === 403 ? 'PERMISSION_DENIED' :
                statusCode === 404 ? 'DOCUMENT_NOT_FOUND' : 'SHARE_FAILED'
        });
    }
});
// Get document templates
router.get('/templates', auth_1.authMiddleware, [query('documentType').optional().isIn(Object.values(ClientDocuments_1.DocumentType)).withMessage('Invalid document type')], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const documentType = req.query.documentType;
        logger_1.logger.info('Retrieving document templates', {
            tenantId,
            documentType
        });
        const templates = await clientDocumentService.getClientDocumentTemplates(tenantId, documentType);
        res.json({
            success: true,
            data: { templates },
            message: 'Document templates retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving document templates:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'TEMPLATES_RETRIEVAL_FAILED'
        });
    }
});
// Bulk operations
router.post('/bulk-operation', auth_1.authMiddleware, bulkOperationSchema, validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const operation = {
            operationType: req.body.operationType,
            documentIds: req.body.documentIds,
            parameters: req.body.parameters,
            performedBy: userId,
            reason: req.body.reason
        };
        logger_1.logger.info('Performing bulk document operation', {
            tenantId,
            operationType: operation.operationType,
            documentCount: operation.documentIds.length,
            userId
        });
        const result = await clientDocumentService.performBulkDocumentOperation(tenantId, operation, userId);
        res.json({
            success: true,
            data: { result },
            message: 'Bulk operation completed'
        });
    }
    catch (error) {
        logger_1.logger.error('Error performing bulk operation:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'BULK_OPERATION_FAILED'
        });
    }
});
// Get client document statistics
router.get('/client/:clientId/stats', auth_1.authMiddleware, [param('clientId').isUUID().withMessage('Valid client ID required')], validation_1.validateRequest, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { clientId } = req.params;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Retrieving client document statistics', {
            tenantId,
            clientId
        });
        const stats = await clientDocumentService.getClientDocumentStats(tenantId, clientId);
        res.json({
            success: true,
            data: { stats },
            message: 'Document statistics retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving document statistics:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'STATS_RETRIEVAL_FAILED'
        });
    }
});
exports.default = router;

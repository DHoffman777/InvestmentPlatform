"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kafka_mock_1 = require("../utils/kafka-mock");
const logger_1 = require("../utils/logger");
const HouseholdManagementService_1 = require("../services/clientRelationship/HouseholdManagementService");
const ClientRelationship_1 = require("../models/clientRelationship/ClientRelationship");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const library_1 = require("@prisma/client/runtime/library");
const router = (0, express_1.Router)();
const kafkaService = (0, kafka_mock_1.getKafkaService)();
const householdService = new HouseholdManagementService_1.HouseholdManagementService();
// Validation schemas
const householdSchema = {
    householdName: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 255,
        message: 'Household name is required and must be 1-255 characters'
    },
    primaryClientId: {
        required: true,
        type: 'string',
        message: 'Primary client ID is required'
    },
    description: {
        required: false,
        type: 'string',
        maxLength: 1000
    }
};
const clientRelationshipSchema = {
    primaryClientId: {
        required: true,
        type: 'string',
        message: 'Primary client ID is required'
    },
    relatedClientId: {
        required: true,
        type: 'string',
        message: 'Related client ID is required'
    },
    relationshipType: {
        required: true,
        enum: Object.values(ClientRelationship_1.RelationshipType),
        message: 'Valid relationship type is required'
    },
    percentage: {
        required: false,
        type: 'number',
        min: 0,
        max: 100,
        message: 'Percentage must be between 0 and 100'
    }
};
/**
 * @route POST /api/household-management/households
 * @desc Create a new household group
 * @access Private
 */
router.post('/households', auth_1.authMiddleware, (0, validation_1.validateRequest)(householdSchema), async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const householdRequest = req.body;
        logger_1.logger.info('Creating household group', {
            tenantId,
            householdName: householdRequest.householdName,
            userId
        });
        const result = await householdService.createHousehold(householdRequest, tenantId, userId);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Household group created successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating household group:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'HOUSEHOLD_CREATION_FAILED'
        });
    }
});
/**
 * @route GET /api/household-management/households/:householdId
 * @desc Get household details with members
 * @access Private
 */
router.get('/households/:householdId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { householdId } = req.params;
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Retrieving household details', { householdId, tenantId });
        const result = await householdService.getHousehold(householdId, tenantId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving household:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'HOUSEHOLD_RETRIEVAL_FAILED'
        });
    }
});
/**
 * @route GET /api/household-management/households
 * @desc List households with filtering and pagination
 * @access Private
 */
router.get('/households', auth_1.authMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { page = 1, limit = 20, search, minAssets, riskTolerance } = req.query;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Listing households', { tenantId, filters: req.query });
        const result = await householdService.listHouseholds(tenantId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search: search,
            minAssets: minAssets ? new library_1.Decimal(minAssets) : undefined,
            riskTolerance: riskTolerance
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Error listing households:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'HOUSEHOLDS_LIST_FAILED'
        });
    }
});
/**
 * @route POST /api/household-management/households/:householdId/relationships
 * @desc Add client relationship to household
 * @access Private
 */
router.post('/households/:householdId/relationships', auth_1.authMiddleware, (0, validation_1.validateRequest)(clientRelationshipSchema), async (req, res) => {
    try {
        const { householdId } = req.params;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const relationshipRequest = {
            ...req.body,
            percentage: req.body.percentage ? new library_1.Decimal(req.body.percentage) : undefined,
            expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
        };
        logger_1.logger.info('Adding client relationship', {
            householdId,
            tenantId,
            relationshipType: relationshipRequest.relationshipType,
            userId
        });
        const result = await householdService.addClientRelationship(householdId, relationshipRequest, tenantId, userId);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Client relationship added successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error adding client relationship:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'RELATIONSHIP_CREATION_FAILED'
        });
    }
});
/**
 * @route PUT /api/household-management/relationships/:relationshipId
 * @desc Update client relationship
 * @access Private
 */
router.put('/relationships/:relationshipId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { relationshipId } = req.params;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const updates = {
            ...req.body,
            percentage: req.body.percentage ? new library_1.Decimal(req.body.percentage) : undefined,
            expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
        };
        logger_1.logger.info('Updating client relationship', { relationshipId, tenantId, userId });
        const result = await householdService.updateClientRelationship(relationshipId, updates, tenantId, userId);
        res.json({
            success: true,
            data: result,
            message: 'Client relationship updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating client relationship:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'RELATIONSHIP_UPDATE_FAILED'
        });
    }
});
/**
 * @route DELETE /api/household-management/households/:householdId/clients/:clientId
 * @desc Remove client from household
 * @access Private
 */
router.delete('/households/:householdId/clients/:clientId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { householdId, clientId } = req.params;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Removing client from household', { householdId, clientId, tenantId, userId });
        await householdService.removeClientFromHousehold(householdId, clientId, tenantId, userId);
        res.json({
            success: true,
            message: 'Client removed from household successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error removing client from household:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'CLIENT_REMOVAL_FAILED'
        });
    }
});
/**
 * @route GET /api/household-management/households/:householdId/analytics
 * @desc Get household analytics and insights
 * @access Private
 */
router.get('/households/:householdId/analytics', auth_1.authMiddleware, async (req, res) => {
    try {
        const { householdId } = req.params;
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        logger_1.logger.info('Generating household analytics', { householdId, tenantId });
        const result = await householdService.getHouseholdAnalytics(householdId, tenantId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating household analytics:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
            code: 'ANALYTICS_GENERATION_FAILED'
        });
    }
});
/**
 * @route GET /api/household-management/relationships/types
 * @desc Get available relationship types
 * @access Private
 */
router.get('/relationships/types', auth_1.authMiddleware, async (req, res) => {
    try {
        const relationshipTypes = Object.values(ClientRelationship_1.RelationshipType).map(type => ({
            value: type,
            label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            description: this.getRelationshipTypeDescription(type)
        }));
        res.json({
            success: true,
            data: relationshipTypes
        });
    }
    catch (error) {
        logger_1.logger.error('Error retrieving relationship types:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'RELATIONSHIP_TYPES_FAILED'
        });
    }
});
// Helper function for relationship type descriptions
function getRelationshipTypeDescription(type) {
    const descriptions = {
        [ClientRelationship_1.RelationshipType.PRIMARY]: 'Primary account holder with full control',
        [ClientRelationship_1.RelationshipType.JOINT_OWNER]: 'Joint account holder with shared ownership',
        [ClientRelationship_1.RelationshipType.BENEFICIARY]: 'Named beneficiary of the account',
        [ClientRelationship_1.RelationshipType.TRUSTEE]: 'Trustee managing assets on behalf of others',
        [ClientRelationship_1.RelationshipType.POWER_OF_ATTORNEY]: 'Authorized to act on behalf of account holder',
        [ClientRelationship_1.RelationshipType.GUARDIAN]: 'Legal guardian for minor or incapacitated person',
        [ClientRelationship_1.RelationshipType.CUSTODIAN]: 'Custodian for minor account',
        [ClientRelationship_1.RelationshipType.AUTHORIZED_TRADER]: 'Authorized to execute trades only'
    };
    return descriptions[type] || 'Related party to the account';
}
exports.default = router;

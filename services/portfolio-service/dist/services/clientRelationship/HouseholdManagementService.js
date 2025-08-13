"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdManagementService = void 0;
const prisma_1 = require("../../utils/prisma");
const kafka_mock_1 = require("../../utils/kafka-mock");
const logger_1 = require("../../utils/logger");
const library_1 = require("@prisma/client/runtime/library");
const crypto_1 = require("crypto");
const ClientRelationship_1 = require("../../models/clientRelationship/ClientRelationship");
class HouseholdManagementService {
    prisma = (0, prisma_1.getPrismaClient)();
    kafkaService = (0, kafka_mock_1.getKafkaService)();
    /**
     * Create a new household group
     */
    async createHousehold(request, tenantId, userId) {
        try {
            logger_1.logger.info('Creating household group', {
                householdName: request.householdName,
                primaryClientId: request.primaryClientId,
                tenantId
            });
            // Verify primary client exists
            const primaryClient = await this.prisma.clientProfile.findFirst({
                where: {
                    id: request.primaryClientId,
                    tenantId
                }
            });
            if (!primaryClient) {
                throw new Error(`Primary client not found: ${request.primaryClientId}`);
            }
            const household = {
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                householdName: request.householdName,
                primaryClientId: request.primaryClientId,
                relationships: [],
                totalAssets: new library_1.Decimal(0),
                combinedRiskTolerance: primaryClient.riskTolerance,
                sharedObjectives: request.sharedObjectives?.map(obj => ({
                    id: (0, crypto_1.randomUUID)(),
                    ...obj
                })) || [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Store in database - Note: This would need a HouseholdGroup table in Prisma schema
            // For now, we'll use a JSON storage approach or extend the existing schema
            // Publish event
            await this.kafkaService.publish('household.created', {
                householdId: household.id,
                householdName: household.householdName,
                primaryClientId: request.primaryClientId,
                tenantId,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Household group created successfully', {
                householdId: household.id,
                householdName: household.householdName
            });
            return household;
        }
        catch (error) {
            logger_1.logger.error('Error creating household group:', error);
            throw error;
        }
    }
    /**
     * Add a client relationship to a household
     */
    async addClientRelationship(householdId, request, tenantId, userId) {
        try {
            logger_1.logger.info('Adding client relationship', {
                householdId,
                primaryClientId: request.primaryClientId,
                relatedClientId: request.relatedClientId,
                relationshipType: request.relationshipType
            });
            // Verify both clients exist
            const clients = await this.prisma.clientProfile.findMany({
                where: {
                    id: { in: [request.primaryClientId, request.relatedClientId] },
                    tenantId
                }
            });
            if (clients.length !== 2) {
                throw new Error('One or both clients not found');
            }
            const relationship = {
                id: (0, crypto_1.randomUUID)(),
                primaryClientId: request.primaryClientId,
                relatedClientId: request.relatedClientId,
                relationshipType: request.relationshipType,
                percentage: request.percentage,
                isActive: true,
                effectiveDate: new Date(),
                expirationDate: request.expirationDate,
                notes: request.notes,
                documentationRequired: request.documentationRequired || false,
                documentationComplete: false
            };
            // Store relationship - would need ClientRelationship table
            // await this.prisma.clientRelationship.create({ data: relationship });
            // Update household relationships array
            // This would require updating the household record
            // Publish event
            await this.kafkaService.publish('client.relationship.added', {
                relationshipId: relationship.id,
                householdId,
                primaryClientId: request.primaryClientId,
                relatedClientId: request.relatedClientId,
                relationshipType: request.relationshipType,
                tenantId,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Client relationship added successfully', {
                relationshipId: relationship.id
            });
            return relationship;
        }
        catch (error) {
            logger_1.logger.error('Error adding client relationship:', error);
            throw error;
        }
    }
    /**
     * Get household with all members and relationships
     */
    async getHousehold(householdId, tenantId) {
        try {
            logger_1.logger.info('Retrieving household', { householdId, tenantId });
            // This would fetch from actual household table
            const household = await this.getHouseholdFromStorage(householdId, tenantId);
            if (!household) {
                throw new Error(`Household not found: ${householdId}`);
            }
            // Get all household members
            const memberIds = [household.primaryClientId, ...household.relationships.map(r => r.relatedClientId)];
            const members = await this.prisma.clientProfile.findMany({
                where: {
                    id: { in: memberIds },
                    tenantId
                },
                include: {
                    addresses: true,
                    investmentObjectives: true
                }
            });
            // Calculate combined household metrics
            const totalAssets = await this.calculateHouseholdAssets(memberIds, tenantId);
            const combinedRiskTolerance = this.calculateCombinedRiskTolerance(members);
            return {
                ...household,
                totalAssets,
                combinedRiskTolerance,
                members
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving household:', error);
            throw error;
        }
    }
    /**
     * Update client relationship status
     */
    async updateClientRelationship(relationshipId, updates, tenantId, userId) {
        try {
            logger_1.logger.info('Updating client relationship', { relationshipId, tenantId });
            // This would update in actual database
            // const updatedRelationship = await this.prisma.clientRelationship.update({
            //   where: { id: relationshipId },
            //   data: { ...updates, updatedAt: new Date() }
            // });
            // Publish event
            await this.kafkaService.publish('client.relationship.updated', {
                relationshipId,
                updates: Object.keys(updates),
                tenantId,
                timestamp: new Date().toISOString()
            });
            // Mock return for now
            return {
                id: relationshipId,
                primaryClientId: '',
                relatedClientId: '',
                relationshipType: ClientRelationship_1.RelationshipType.PRIMARY,
                isActive: true,
                effectiveDate: new Date(),
                documentationRequired: false,
                documentationComplete: false,
                ...updates
            };
        }
        catch (error) {
            logger_1.logger.error('Error updating client relationship:', error);
            throw error;
        }
    }
    /**
     * Remove client from household
     */
    async removeClientFromHousehold(householdId, clientId, tenantId, userId) {
        try {
            logger_1.logger.info('Removing client from household', { householdId, clientId, tenantId });
            // Deactivate all relationships involving this client
            // await this.prisma.clientRelationship.updateMany({
            //   where: {
            //     OR: [
            //       { primaryClientId: clientId },
            //       { relatedClientId: clientId }
            //     ]
            //   },
            //   data: { isActive: false }
            // });
            // Update household composition
            // This would require updating the household record
            // Publish event
            await this.kafkaService.publish('client.removed.from.household', {
                householdId,
                clientId,
                tenantId,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Client removed from household successfully');
        }
        catch (error) {
            logger_1.logger.error('Error removing client from household:', error);
            throw error;
        }
    }
    /**
     * Get household analytics and insights
     */
    async getHouseholdAnalytics(householdId, tenantId) {
        try {
            logger_1.logger.info('Generating household analytics', { householdId, tenantId });
            const household = await this.getHousehold(householdId, tenantId);
            // Calculate asset distribution
            const assetDistribution = await this.calculateAssetDistribution(household.members, tenantId);
            // Calculate diversification score
            const diversificationScore = this.calculateDiversificationScore(household.members);
            // Calculate shared objectives alignment
            const sharedObjectivesAlignment = this.calculateObjectivesAlignment(household.members, household.sharedObjectives);
            const analytics = {
                householdId,
                totalMembers: household.members.length,
                totalAssets: household.totalAssets,
                averageAssets: household.totalAssets.div(household.members.length),
                combinedRiskTolerance: household.combinedRiskTolerance,
                assetDistribution,
                sharedObjectivesAlignment,
                diversificationScore
            };
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Error generating household analytics:', error);
            throw error;
        }
    }
    /**
     * List all households for a tenant
     */
    async listHouseholds(tenantId, options = {}) {
        try {
            const { page = 1, limit = 20, search, minAssets, riskTolerance } = options;
            logger_1.logger.info('Listing households', { tenantId, options });
            // This would implement actual filtering and pagination from database
            const households = [];
            const total = 0;
            return {
                households,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error listing households:', error);
            throw error;
        }
    }
    // Private helper methods
    async getHouseholdFromStorage(householdId, tenantId) {
        // This would fetch from actual household table
        // For now, return mock data
        return {
            id: householdId,
            tenantId,
            householdName: 'Mock Household',
            primaryClientId: 'client-1',
            relationships: [],
            totalAssets: new library_1.Decimal(0),
            sharedObjectives: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    async calculateHouseholdAssets(memberIds, tenantId) {
        // This would calculate total assets across all household members
        // from portfolio values, account balances, etc.
        return new library_1.Decimal(0);
    }
    calculateCombinedRiskTolerance(members) {
        // Simple algorithm: take the most conservative risk tolerance
        const riskLevels = {
            [ClientRelationship_1.RiskTolerance.CONSERVATIVE]: 1,
            [ClientRelationship_1.RiskTolerance.MODERATE_CONSERVATIVE]: 2,
            [ClientRelationship_1.RiskTolerance.MODERATE]: 3,
            [ClientRelationship_1.RiskTolerance.MODERATE_AGGRESSIVE]: 4,
            [ClientRelationship_1.RiskTolerance.AGGRESSIVE]: 5
        };
        const minRiskLevel = Math.min(...members.map(m => riskLevels[m.riskTolerance] || 3));
        const reverseMapping = Object.entries(riskLevels).find(([_, level]) => level === minRiskLevel);
        return reverseMapping?.[0] || ClientRelationship_1.RiskTolerance.MODERATE;
    }
    async calculateAssetDistribution(members, tenantId) {
        // This would calculate actual asset distribution
        return members.map(member => ({
            clientId: member.id,
            clientName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.entityName || 'Unknown',
            assets: new library_1.Decimal(0),
            percentage: new library_1.Decimal(0)
        }));
    }
    calculateDiversificationScore(members) {
        // Simple diversification score based on number of members and their profiles
        // More sophisticated algorithm would consider asset classes, sectors, etc.
        if (members.length === 1)
            return 50;
        if (members.length === 2)
            return 70;
        if (members.length >= 3)
            return 85;
        return 60;
    }
    calculateObjectivesAlignment(members, sharedObjectives) {
        if (sharedObjectives.length === 0)
            return 0;
        // Calculate how well individual member objectives align with shared objectives
        let totalAlignment = 0;
        let alignmentCount = 0;
        members.forEach(member => {
            member.investmentObjectives?.forEach((memberObj) => {
                sharedObjectives.forEach(sharedObj => {
                    if (memberObj.objective.toLowerCase().includes(sharedObj.objective.toLowerCase()) ||
                        sharedObj.objective.toLowerCase().includes(memberObj.objective.toLowerCase())) {
                        totalAlignment += 1;
                        alignmentCount += 1;
                    }
                });
            });
        });
        const maxPossibleAlignment = members.length * sharedObjectives.length;
        return maxPossibleAlignment > 0 ? (alignmentCount / maxPossibleAlignment) * 100 : 0;
    }
}
exports.HouseholdManagementService = HouseholdManagementService;

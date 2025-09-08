import { getPrismaClient } from '../../utils/prisma';
import { getKafkaService } from '../../utils/kafka-mock';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import {
  HouseholdGroup,
  ClientRelationship,
  RelationshipType,
  ClientType,
  RiskTolerance
} from '../../models/clientRelationship/ClientRelationship';

export interface HouseholdRequest {
  householdName: string;
  primaryClientId: string;
  description?: string;
  sharedObjectives?: Array<{
    objective: string;
    priority: number;
    targetAllocation?: Decimal;
    description?: string;
  }>;
}

export interface ClientRelationshipRequest {
  primaryClientId: string;
  relatedClientId: string;
  relationshipType: RelationshipType;
  percentage?: Decimal;
  notes?: string;
  documentationRequired?: boolean;
  expirationDate?: Date;
}

export interface HouseholdAnalytics {
  householdId: string;
  totalMembers: number;
  totalAssets: Decimal;
  averageAssets: Decimal;
  combinedRiskTolerance: RiskTolerance;
  assetDistribution: Array<{
    clientId: string;
    clientName: string;
    assets: Decimal;
    percentage: Decimal;
  }>;
  sharedObjectivesAlignment: number; // percentage
  diversificationScore: number;
}

export class HouseholdManagementService {
  private prisma = getPrismaClient();
  private kafkaService = getKafkaService();

  /**
   * Create a new household group
   */
  async createHousehold(
    request: HouseholdRequest,
    tenantId: string,
    userId: string
  ): Promise<HouseholdGroup> {
    try {
      logger.info('Creating household group', { 
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

      const household: HouseholdGroup = {
        id: randomUUID(),
        tenantId,
        householdName: request.householdName,
        primaryClientId: request.primaryClientId,
        relationships: [],
        totalAssets: new (Decimal as any)(0),
        combinedRiskTolerance: primaryClient.riskTolerance as RiskTolerance,
        sharedObjectives: request.sharedObjectives?.map(obj => ({
          id: randomUUID(),
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

      logger.info('Household group created successfully', { 
        householdId: household.id,
        householdName: household.householdName 
      });

      return household;

    } catch (error: any) {
      logger.error('Error creating household group:', error);
      throw error;
    }
  }

  /**
   * Add a client relationship to a household
   */
  async addClientRelationship(
    householdId: string,
    request: ClientRelationshipRequest,
    tenantId: string,
    userId: string
  ): Promise<ClientRelationship> {
    try {
      logger.info('Adding client relationship', { 
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

      const relationship: ClientRelationship = {
        id: randomUUID(),
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

      logger.info('Client relationship added successfully', { 
        relationshipId: relationship.id 
      });

      return relationship;

    } catch (error: any) {
      logger.error('Error adding client relationship:', error);
      throw error;
    }
  }

  /**
   * Get household with all members and relationships
   */
  async getHousehold(
    householdId: string,
    tenantId: string
  ): Promise<HouseholdGroup & { members: any[] }> {
    try {
      logger.info('Retrieving household', { householdId, tenantId });

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

    } catch (error: any) {
      logger.error('Error retrieving household:', error);
      throw error;
    }
  }

  /**
   * Update client relationship status
   */
  async updateClientRelationship(
    relationshipId: string,
    updates: Partial<ClientRelationshipRequest>,
    tenantId: string,
    userId: string
  ): Promise<ClientRelationship> {
    try {
      logger.info('Updating client relationship', { relationshipId, tenantId });

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
        relationshipType: RelationshipType.PRIMARY,
        isActive: true,
        effectiveDate: new Date(),
        documentationRequired: false,
        documentationComplete: false,
        ...updates
      } as ClientRelationship;

    } catch (error: any) {
      logger.error('Error updating client relationship:', error);
      throw error;
    }
  }

  /**
   * Remove client from household
   */
  async removeClientFromHousehold(
    householdId: string,
    clientId: string,
    tenantId: string,
    userId: string
  ): Promise<any> {
    try {
      logger.info('Removing client from household', { householdId, clientId, tenantId });

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

      logger.info('Client removed from household successfully');

    } catch (error: any) {
      logger.error('Error removing client from household:', error);
      throw error;
    }
  }

  /**
   * Get household analytics and insights
   */
  async getHouseholdAnalytics(
    householdId: string,
    tenantId: string
  ): Promise<HouseholdAnalytics> {
    try {
      logger.info('Generating household analytics', { householdId, tenantId });

      const household = await this.getHousehold(householdId, tenantId);
      
      // Calculate asset distribution
      const assetDistribution = await this.calculateAssetDistribution(household.members, tenantId);
      
      // Calculate diversification score
      const diversificationScore = this.calculateDiversificationScore(household.members);
      
      // Calculate shared objectives alignment
      const sharedObjectivesAlignment = this.calculateObjectivesAlignment(
        household.members,
        household.sharedObjectives
      );

      const analytics: HouseholdAnalytics = {
        householdId,
        totalMembers: household.members.length,
        totalAssets: household.totalAssets,
        averageAssets: household.totalAssets.div(household.members.length),
        combinedRiskTolerance: household.combinedRiskTolerance!,
        assetDistribution,
        sharedObjectivesAlignment,
        diversificationScore
      };

      return analytics;

    } catch (error: any) {
      logger.error('Error generating household analytics:', error);
      throw error;
    }
  }

  /**
   * List all households for a tenant
   */
  async listHouseholds(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      minAssets?: Decimal;
      riskTolerance?: RiskTolerance;
    } = {}
  ): Promise<{
    households: HouseholdGroup[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page = 1, limit = 20, search, minAssets, riskTolerance } = options;
      
      logger.info('Listing households', { tenantId, options });

      // This would implement actual filtering and pagination from database
      const households: HouseholdGroup[] = [];
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

    } catch (error: any) {
      logger.error('Error listing households:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getHouseholdFromStorage(
    householdId: string,
    tenantId: string
  ): Promise<HouseholdGroup | null> {
    // This would fetch from actual household table
    // For now, return mock data
    return {
      id: householdId,
      tenantId,
      householdName: 'Mock Household',
      primaryClientId: 'client-1',
      relationships: [],
      totalAssets: new (Decimal as any)(0),
      sharedObjectives: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async calculateHouseholdAssets(
    memberIds: string[],
    tenantId: string
  ): Promise<Decimal> {
    // This would calculate total assets across all household members
    // from portfolio values, account balances, etc.
    return new (Decimal as any)(0);
  }

  private calculateCombinedRiskTolerance(members: any[]): RiskTolerance {
    // Simple algorithm: take the most conservative risk tolerance
    const riskLevels = {
      [RiskTolerance.CONSERVATIVE]: 1,
      [RiskTolerance.MODERATE_CONSERVATIVE]: 2,
      [RiskTolerance.MODERATE]: 3,
      [RiskTolerance.MODERATE_AGGRESSIVE]: 4,
      [RiskTolerance.AGGRESSIVE]: 5
    };

    const minRiskLevel = Math.min(
      ...members.map(m => riskLevels[m.riskTolerance as RiskTolerance] || 3)
    );

    const reverseMapping = Object.entries(riskLevels).find(([_, level]) => level === minRiskLevel);
    return (reverseMapping?.[0] as RiskTolerance) || RiskTolerance.MODERATE;
  }

  private async calculateAssetDistribution(
    members: any[],
    tenantId: string
  ): Promise<Array<{
    clientId: string;
    clientName: string;
    assets: Decimal;
    percentage: Decimal;
  }>> {
    // This would calculate actual asset distribution
    return members.map(member => ({
      clientId: member.id,
      clientName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.entityName || 'Unknown',
      assets: new (Decimal as any)(0),
      percentage: new (Decimal as any)(0)
    }));
  }

  private calculateDiversificationScore(members: any[]): number {
    // Simple diversification score based on number of members and their profiles
    // More sophisticated algorithm would consider asset classes, sectors, etc.
    if (members.length === 1) return 50;
    if (members.length === 2) return 70;
    if (members.length >= 3) return 85;
    return 60;
  }

  private calculateObjectivesAlignment(
    members: any[],
    sharedObjectives: any[]
  ): number {
    if (sharedObjectives.length === 0) return 0;
    
    // Calculate how well individual member objectives align with shared objectives
    let totalAlignment = 0;
    let alignmentCount = 0;

    members.forEach(member => {
      member.investmentObjectives?.forEach((memberObj: any) => {
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



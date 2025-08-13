import { getPrismaClient } from '../../utils/prisma';
import { getKafkaService } from '../../utils/kafka-mock';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import {
  InvestmentObjective,
  InvestmentRestriction,
  RestrictionType,
  AssetClass,
  RiskTolerance
} from '../../models/clientRelationship/ClientRelationship';

export interface InvestmentObjectiveRequest {
  clientId: string;
  objective: string;
  priority: number;
  targetAllocation?: Decimal;
  description?: string;
  timeHorizon?: number;
  expectedReturn?: Decimal;
  riskLevel?: RiskTolerance;
}

export interface InvestmentRestrictionRequest {
  clientId: string;
  restrictionType: RestrictionType;
  description: string;
  appliesTo: string; // Could be asset class, sector, specific security, etc.
  isActive: boolean;
  effectiveDate?: Date;
  expirationDate?: Date;
  threshold?: Decimal;
  violationAction?: 'ALERT' | 'BLOCK' | 'OVERRIDE_REQUIRED';
}

export interface ObjectiveAnalysis {
  clientId: string;
  totalObjectives: number;
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  allocationAlignment: number; // percentage of how well allocations align with objectives
  timeHorizonRange: {
    shortest: number;
    longest: number;
    average: number;
  };
  riskConsistency: number; // how consistent risk levels are across objectives
  recommendations: Array<{
    type: 'ALIGNMENT' | 'DIVERSIFICATION' | 'RISK_ADJUSTMENT' | 'TIME_HORIZON';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    suggestedAction: string;
  }>;
}

export interface RestrictionAnalysis {
  clientId: string;
  totalRestrictions: number;
  restrictionsByType: Record<RestrictionType, number>;
  activeRestrictions: number;
  upcomingExpirations: Array<{
    restrictionId: string;
    expirationDate: Date;
    description: string;
  }>;
  impactAnalysis: {
    estimatedPortfolioImpact: Decimal;
    restrictedUniversePercentage: Decimal;
    diversificationConstraints: string[];
  };
  complianceScore: number; // 0-100 score of how well restrictions are being followed
}

export class InvestmentObjectivesService {
  private prisma = getPrismaClient();
  private kafkaService = getKafkaService();

  /**
   * Create investment objective for a client
   */
  async createInvestmentObjective(
    request: InvestmentObjectiveRequest,
    tenantId: string,
    userId: string
  ): Promise<InvestmentObjective> {
    try {
      logger.info('Creating investment objective', {
        clientId: request.clientId,
        objective: request.objective,
        priority: request.priority,
        tenantId
      });

      // Verify client exists
      const client = await this.prisma.clientProfile.findFirst({
        where: {
          id: request.clientId,
          tenantId
        }
      });

      if (!client) {
        throw new Error(`Client not found: ${request.clientId}`);
      }

      // Validate priority uniqueness (optional business rule)
      const existingObjective = await this.prisma.clientInvestmentObjective.findFirst({
        where: {
          clientId: request.clientId,
          priority: request.priority
        }
      });

      if (existingObjective) {
        logger.warn('Objective with same priority exists, adjusting priorities');
        // Shift other objectives down in priority
        await this.adjustObjectivePriorities(request.clientId, request.priority, tenantId);
      }

      const objective: InvestmentObjective = {
        id: randomUUID(),
        objective: request.objective,
        priority: request.priority,
        targetAllocation: request.targetAllocation,
        description: request.description,
        timeHorizon: request.timeHorizon,
        expectedReturn: request.expectedReturn,
        riskLevel: request.riskLevel,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in database
      await this.prisma.clientInvestmentObjective.create({
        data: {
          id: objective.id,
          clientId: request.clientId,
          objective: objective.objective,
          priority: objective.priority,
          targetAllocation: objective.targetAllocation,
          description: objective.description,
          timeHorizon: objective.timeHorizon,
          expectedReturn: objective.expectedReturn,
          riskLevel: objective.riskLevel,
          isActive: objective.isActive,
          createdAt: objective.createdAt,
          updatedAt: objective.updatedAt
        }
      });

      // Publish event
      await this.kafkaService.publish('investment.objective.created', {
        objectiveId: objective.id,
        clientId: request.clientId,
        objective: objective.objective,
        priority: objective.priority,
        tenantId,
        timestamp: new Date().toISOString()
      });

      // Trigger suitability reassessment
      await this.triggerSuitabilityReview(request.clientId, tenantId, 'OBJECTIVE_ADDED');

      logger.info('Investment objective created successfully', {
        objectiveId: objective.id,
        clientId: request.clientId
      });

      return objective;

    } catch (error) {
      logger.error('Error creating investment objective:', error);
      throw error;
    }
  }

  /**
   * Create investment restriction for a client
   */
  async createInvestmentRestriction(
    request: InvestmentRestrictionRequest,
    tenantId: string,
    userId: string
  ): Promise<InvestmentRestriction> {
    try {
      logger.info('Creating investment restriction', {
        clientId: request.clientId,
        restrictionType: request.restrictionType,
        appliesTo: request.appliesTo,
        tenantId
      });

      // Verify client exists
      const client = await this.prisma.clientProfile.findFirst({
        where: {
          id: request.clientId,
          tenantId
        }
      });

      if (!client) {
        throw new Error(`Client not found: ${request.clientId}`);
      }

      const restriction: InvestmentRestriction = {
        id: randomUUID(),
        restrictionType: request.restrictionType,
        description: request.description,
        appliesTo: request.appliesTo,
        isActive: request.isActive,
        effectiveDate: request.effectiveDate || new Date(),
        expirationDate: request.expirationDate,
        threshold: request.threshold,
        violationAction: request.violationAction || 'ALERT',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in database
      await this.prisma.clientInvestmentRestriction.create({
        data: {
          id: restriction.id,
          clientId: request.clientId,
          restrictionType: restriction.restrictionType,
          description: restriction.description,
          appliesTo: restriction.appliesTo,
          isActive: restriction.isActive,
          effectiveDate: restriction.effectiveDate,
          expirationDate: restriction.expirationDate,
          threshold: restriction.threshold,
          violationAction: restriction.violationAction,
          createdAt: restriction.createdAt,
          updatedAt: restriction.updatedAt
        }
      });

      // Publish event
      await this.kafkaService.publish('investment.restriction.created', {
        restrictionId: restriction.id,
        clientId: request.clientId,
        restrictionType: restriction.restrictionType,
        appliesTo: restriction.appliesTo,
        tenantId,
        timestamp: new Date().toISOString()
      });

      // Trigger compliance check
      await this.triggerComplianceCheck(request.clientId, tenantId, restriction.id);

      logger.info('Investment restriction created successfully', {
        restrictionId: restriction.id,
        clientId: request.clientId
      });

      return restriction;

    } catch (error) {
      logger.error('Error creating investment restriction:', error);
      throw error;
    }
  }

  /**
   * Get all investment objectives for a client
   */
  async getClientObjectives(
    clientId: string,
    tenantId: string
  ): Promise<InvestmentObjective[]> {
    try {
      logger.info('Retrieving client objectives', { clientId, tenantId });

      const objectives = await this.prisma.clientInvestmentObjective.findMany({
        where: {
          clientId: clientId,
          isActive: true
        },
        orderBy: {
          priority: 'asc'
        }
      });

      return objectives.map(obj => ({
        id: obj.id,
        objective: obj.objective,
        priority: obj.priority,
        targetAllocation: obj.targetAllocation,
        description: obj.description,
        timeHorizon: obj.timeHorizon,
        expectedReturn: obj.expectedReturn,
        riskLevel: obj.riskLevel as RiskTolerance,
        isActive: obj.isActive,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt
      }));

    } catch (error) {
      logger.error('Error retrieving client objectives:', error);
      throw error;
    }
  }

  /**
   * Get all investment restrictions for a client
   */
  async getClientRestrictions(
    clientId: string,
    tenantId: string,
    includeInactive: boolean = false
  ): Promise<InvestmentRestriction[]> {
    try {
      logger.info('Retrieving client restrictions', { clientId, tenantId, includeInactive });

      const whereClause = includeInactive 
        ? { clientId: clientId }
        : { clientId: clientId, isActive: true };

      const restrictions = await this.prisma.clientInvestmentRestriction.findMany({
        where: whereClause,
        orderBy: {
          effectiveDate: 'desc'
        }
      });

      return restrictions.map(res => ({
        id: res.id,
        restrictionType: res.restrictionType as RestrictionType,
        description: res.description,
        appliesTo: res.appliesTo,
        isActive: res.isActive,
        effectiveDate: res.effectiveDate,
        expirationDate: res.expirationDate,
        threshold: res.threshold,
        violationAction: res.violationAction as 'ALERT' | 'BLOCK' | 'OVERRIDE_REQUIRED',
        createdAt: res.createdAt,
        updatedAt: res.updatedAt
      }));

    } catch (error) {
      logger.error('Error retrieving client restrictions:', error);
      throw error;
    }
  }

  /**
   * Update investment objective
   */
  async updateObjective(
    objectiveId: string,
    updates: Partial<InvestmentObjectiveRequest>,
    tenantId: string,
    userId: string
  ): Promise<InvestmentObjective> {
    try {
      logger.info('Updating investment objective', { objectiveId, tenantId });

      // Verify objective exists and belongs to tenant
      const existingObjective = await this.prisma.clientInvestmentObjective.findFirst({
        where: {
          id: objectiveId,
          client: {
            tenantId
          }
        }
      });

      if (!existingObjective) {
        throw new Error(`Objective not found: ${objectiveId}`);
      }

      // Handle priority changes
      if (updates.priority && updates.priority !== existingObjective.priority) {
        await this.adjustObjectivePriorities(
          existingObjective.clientId, 
          updates.priority, 
          tenantId,
          objectiveId
        );
      }

      const updatedObjective = await this.prisma.clientInvestmentObjective.update({
        where: { id: objectiveId },
        data: {
          objective: updates.objective,
          priority: updates.priority,
          targetAllocation: updates.targetAllocation,
          description: updates.description,
          timeHorizon: updates.timeHorizon,
          expectedReturn: updates.expectedReturn,
          riskLevel: updates.riskLevel,
          updatedAt: new Date()
        }
      });

      // Publish event
      await this.kafkaService.publish('investment.objective.updated', {
        objectiveId,
        updates: Object.keys(updates),
        tenantId,
        timestamp: new Date().toISOString()
      });

      // Trigger suitability reassessment if significant changes
      if (updates.riskLevel || updates.timeHorizon || updates.expectedReturn) {
        await this.triggerSuitabilityReview(
          existingObjective.clientProfileId, 
          tenantId, 
          'OBJECTIVE_MODIFIED'
        );
      }

      return {
        id: updatedObjective.id,
        objective: updatedObjective.objective,
        priority: updatedObjective.priority,
        targetAllocation: updatedObjective.targetAllocation,
        description: updatedObjective.description,
        timeHorizon: updatedObjective.timeHorizon,
        expectedReturn: updatedObjective.expectedReturn,
        riskLevel: updatedObjective.riskLevel as RiskTolerance,
        isActive: updatedObjective.isActive,
        createdAt: updatedObjective.createdAt,
        updatedAt: updatedObjective.updatedAt
      };

    } catch (error) {
      logger.error('Error updating investment objective:', error);
      throw error;
    }
  }

  /**
   * Update investment restriction
   */
  async updateRestriction(
    restrictionId: string,
    updates: Partial<InvestmentRestrictionRequest>,
    tenantId: string,
    userId: string
  ): Promise<InvestmentRestriction> {
    try {
      logger.info('Updating investment restriction', { restrictionId, tenantId });

      // Verify restriction exists and belongs to tenant
      const existingRestriction = await this.prisma.clientInvestmentRestriction.findFirst({
        where: {
          id: restrictionId,
          client: {
            tenantId
          }
        }
      });

      if (!existingRestriction) {
        throw new Error(`Restriction not found: ${restrictionId}`);
      }

      const updatedRestriction = await this.prisma.clientInvestmentRestriction.update({
        where: { id: restrictionId },
        data: {
          restrictionType: updates.restrictionType,
          description: updates.description,
          appliesTo: updates.appliesTo,
          isActive: updates.isActive,
          effectiveDate: updates.effectiveDate,
          expirationDate: updates.expirationDate,
          threshold: updates.threshold,
          violationAction: updates.violationAction,
          updatedAt: new Date()
        }
      });

      // Publish event
      await this.kafkaService.publish('investment.restriction.updated', {
        restrictionId,
        updates: Object.keys(updates),
        tenantId,
        timestamp: new Date().toISOString()
      });

      // Trigger compliance check if restriction became active or conditions changed
      if (updates.isActive || updates.threshold || updates.appliesTo) {
        await this.triggerComplianceCheck(
          existingRestriction.clientId, 
          tenantId, 
          restrictionId
        );
      }

      return {
        id: updatedRestriction.id,
        restrictionType: updatedRestriction.restrictionType as RestrictionType,
        description: updatedRestriction.description,
        appliesTo: updatedRestriction.appliesTo,
        isActive: updatedRestriction.isActive,
        effectiveDate: updatedRestriction.effectiveDate,
        expirationDate: updatedRestriction.expirationDate,
        threshold: updatedRestriction.threshold,
        violationAction: updatedRestriction.violationAction as 'ALERT' | 'BLOCK' | 'OVERRIDE_REQUIRED',
        createdAt: updatedRestriction.createdAt,
        updatedAt: updatedRestriction.updatedAt
      };

    } catch (error) {
      logger.error('Error updating investment restriction:', error);
      throw error;
    }
  }

  /**
   * Delete investment objective
   */
  async deleteObjective(
    objectiveId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    try {
      logger.info('Deleting investment objective', { objectiveId, tenantId });

      // Verify objective exists and belongs to tenant
      const objective = await this.prisma.clientInvestmentObjective.findFirst({
        where: {
          id: objectiveId,
          client: {
            tenantId
          }
        }
      });

      if (!objective) {
        throw new Error(`Objective not found: ${objectiveId}`);
      }

      // Soft delete by marking as inactive
      await this.prisma.clientInvestmentObjective.update({
        where: { id: objectiveId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Publish event
      await this.kafkaService.publish('investment.objective.deleted', {
        objectiveId,
        clientId: objective.clientId,
        tenantId,
        timestamp: new Date().toISOString()
      });

      logger.info('Investment objective deleted successfully', { objectiveId });

    } catch (error) {
      logger.error('Error deleting investment objective:', error);
      throw error;
    }
  }

  /**
   * Delete investment restriction
   */
  async deleteRestriction(
    restrictionId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    try {
      logger.info('Deleting investment restriction', { restrictionId, tenantId });

      // Verify restriction exists and belongs to tenant
      const restriction = await this.prisma.clientInvestmentRestriction.findFirst({
        where: {
          id: restrictionId,
          client: {
            tenantId
          }
        }
      });

      if (!restriction) {
        throw new Error(`Restriction not found: ${restrictionId}`);
      }

      // Soft delete by marking as inactive
      await this.prisma.clientInvestmentRestriction.update({
        where: { id: restrictionId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Publish event
      await this.kafkaService.publish('investment.restriction.deleted', {
        restrictionId,
        clientId: restriction.clientId,
        tenantId,
        timestamp: new Date().toISOString()
      });

      logger.info('Investment restriction deleted successfully', { restrictionId });

    } catch (error) {
      logger.error('Error deleting investment restriction:', error);
      throw error;
    }
  }

  /**
   * Analyze client's investment objectives
   */
  async analyzeObjectives(
    clientId: string,
    tenantId: string
  ): Promise<ObjectiveAnalysis> {
    try {
      logger.info('Analyzing client objectives', { clientId, tenantId });

      const objectives = await this.getClientObjectives(clientId, tenantId);
      
      if (objectives.length === 0) {
        return {
          clientId,
          totalObjectives: 0,
          priorityDistribution: { high: 0, medium: 0, low: 0 },
          allocationAlignment: 0,
          timeHorizonRange: { shortest: 0, longest: 0, average: 0 },
          riskConsistency: 0,
          recommendations: []
        };
      }

      // Calculate priority distribution
      const priorityDistribution = {
        high: objectives.filter(obj => obj.priority <= 3).length,
        medium: objectives.filter(obj => obj.priority > 3 && obj.priority <= 7).length,
        low: objectives.filter(obj => obj.priority > 7).length
      };

      // Calculate allocation alignment
      const totalTargetAllocation = objectives.reduce((sum, obj) => 
        sum.plus(obj.targetAllocation || new Decimal(0)), new Decimal(0)
      );
      const allocationAlignment = totalTargetAllocation.equals(100) ? 100 : 
        Math.max(0, 100 - Math.abs(totalTargetAllocation.minus(100).toNumber()));

      // Calculate time horizon range
      const timeHorizons = objectives
        .filter(obj => obj.timeHorizon)
        .map(obj => obj.timeHorizon!);
      
      const timeHorizonRange = timeHorizons.length > 0 ? {
        shortest: Math.min(...timeHorizons),
        longest: Math.max(...timeHorizons),
        average: timeHorizons.reduce((sum, th) => sum + th, 0) / timeHorizons.length
      } : { shortest: 0, longest: 0, average: 0 };

      // Calculate risk consistency
      const riskLevels = objectives
        .filter(obj => obj.riskLevel)
        .map(obj => this.getRiskLevelNumber(obj.riskLevel!));
      
      const riskConsistency = riskLevels.length > 0 ?
        Math.max(0, 100 - (Math.max(...riskLevels) - Math.min(...riskLevels)) * 20) : 100;

      // Generate recommendations
      const recommendations = this.generateObjectiveRecommendations(
        objectives,
        allocationAlignment,
        riskConsistency,
        timeHorizonRange
      );

      return {
        clientId,
        totalObjectives: objectives.length,
        priorityDistribution,
        allocationAlignment,
        timeHorizonRange,
        riskConsistency,
        recommendations
      };

    } catch (error) {
      logger.error('Error analyzing client objectives:', error);
      throw error;
    }
  }

  /**
   * Analyze client's investment restrictions
   */
  async analyzeRestrictions(
    clientId: string,
    tenantId: string
  ): Promise<RestrictionAnalysis> {
    try {
      logger.info('Analyzing client restrictions', { clientId, tenantId });

      const restrictions = await this.getClientRestrictions(clientId, tenantId, true);
      const activeRestrictions = restrictions.filter(res => res.isActive);

      // Count restrictions by type
      const restrictionsByType = {} as Record<RestrictionType, number>;
      Object.values(RestrictionType).forEach(type => {
        restrictionsByType[type] = activeRestrictions.filter(res => res.restrictionType === type).length;
      });

      // Find upcoming expirations (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const upcomingExpirations = activeRestrictions
        .filter(res => res.expirationDate && res.expirationDate <= thirtyDaysFromNow)
        .map(res => ({
          restrictionId: res.id,
          expirationDate: res.expirationDate!,
          description: res.description
        }));

      // Calculate impact analysis
      const impactAnalysis = await this.calculateRestrictionImpact(
        activeRestrictions, 
        clientId, 
        tenantId
      );

      // Calculate compliance score (simplified)
      const complianceScore = this.calculateComplianceScore(activeRestrictions);

      return {
        clientId,
        totalRestrictions: restrictions.length,
        restrictionsByType,
        activeRestrictions: activeRestrictions.length,
        upcomingExpirations,
        impactAnalysis,
        complianceScore
      };

    } catch (error) {
      logger.error('Error analyzing client restrictions:', error);
      throw error;
    }
  }

  // Private helper methods

  private async adjustObjectivePriorities(
    clientId: string,
    newPriority: number,
    tenantId: string,
    excludeObjectiveId?: string
  ): Promise<void> {
    // Shift existing objectives with same or higher priority down by 1
    const whereClause = excludeObjectiveId 
      ? { 
          clientId: clientId, 
          priority: { gte: newPriority },
          id: { not: excludeObjectiveId }
        }
      : { 
          clientId: clientId, 
          priority: { gte: newPriority }
        };

    await this.prisma.clientInvestmentObjective.updateMany({
      where: whereClause,
      data: {
        priority: { increment: 1 },
        updatedAt: new Date()
      }
    });
  }

  private async triggerSuitabilityReview(
    clientId: string,
    tenantId: string,
    trigger: string
  ): Promise<void> {
    // Publish event for suitability review
    await this.kafkaService.publish('suitability.review.triggered', {
      clientId,
      trigger,
      tenantId,
      timestamp: new Date().toISOString()
    });
  }

  private async triggerComplianceCheck(
    clientId: string,
    tenantId: string,
    restrictionId: string
  ): Promise<void> {
    // Publish event for compliance check
    await this.kafkaService.publish('compliance.check.triggered', {
      clientId,
      restrictionId,
      tenantId,
      timestamp: new Date().toISOString()
    });
  }

  private getRiskLevelNumber(riskLevel: RiskTolerance): number {
    const riskMap = {
      [RiskTolerance.CONSERVATIVE]: 1,
      [RiskTolerance.MODERATE_CONSERVATIVE]: 2,
      [RiskTolerance.MODERATE]: 3,
      [RiskTolerance.MODERATE_AGGRESSIVE]: 4,
      [RiskTolerance.AGGRESSIVE]: 5
    };
    return riskMap[riskLevel] || 3;
  }

  private generateObjectiveRecommendations(
    objectives: InvestmentObjective[],
    allocationAlignment: number,
    riskConsistency: number,
    timeHorizonRange: { shortest: number; longest: number; average: number }
  ): Array<{
    type: 'ALIGNMENT' | 'DIVERSIFICATION' | 'RISK_ADJUSTMENT' | 'TIME_HORIZON';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    suggestedAction: string;
  }> {
    const recommendations = [];

    // Allocation alignment recommendation
    if (allocationAlignment < 90) {
      recommendations.push({
        type: 'ALIGNMENT' as const,
        priority: 'HIGH' as const,
        description: 'Target allocations do not sum to 100%',
        suggestedAction: 'Review and adjust target allocations to ensure they total 100%'
      });
    }

    // Risk consistency recommendation
    if (riskConsistency < 70) {
      recommendations.push({
        type: 'RISK_ADJUSTMENT' as const,
        priority: 'MEDIUM' as const,
        description: 'Investment objectives have inconsistent risk levels',
        suggestedAction: 'Consider aligning risk levels across objectives or segmenting by time horizon'
      });
    }

    // Time horizon recommendation
    if (timeHorizonRange.longest - timeHorizonRange.shortest > 15) {
      recommendations.push({
        type: 'TIME_HORIZON' as const,
        priority: 'MEDIUM' as const,
        description: 'Wide range of time horizons may require different strategies',
        suggestedAction: 'Consider creating separate investment strategies for different time horizons'
      });
    }

    // Diversification recommendation
    if (objectives.length < 3) {
      recommendations.push({
        type: 'DIVERSIFICATION' as const,
        priority: 'LOW' as const,
        description: 'Limited number of investment objectives',
        suggestedAction: 'Consider adding more diverse investment objectives for better risk management'
      });
    }

    return recommendations;
  }

  private async calculateRestrictionImpact(
    restrictions: InvestmentRestriction[],
    clientId: string,
    tenantId: string
  ): Promise<{
    estimatedPortfolioImpact: Decimal;
    restrictedUniversePercentage: Decimal;
    diversificationConstraints: string[];
  }> {
    // Simplified calculation - in real implementation would analyze against universe
    const restrictedUniversePercentage = new Decimal(restrictions.length * 5); // Rough estimate
    const estimatedPortfolioImpact = restrictedUniversePercentage.div(100).mul(10); // Impact on returns
    
    const diversificationConstraints = restrictions
      .filter(res => res.restrictionType === RestrictionType.ASSET_CLASS_LIMIT)
      .map(res => `Limited ${res.appliesTo} exposure`);

    return {
      estimatedPortfolioImpact,
      restrictedUniversePercentage: restrictedUniversePercentage.gt(100) ? new Decimal(100) : restrictedUniversePercentage,
      diversificationConstraints
    };
  }

  private calculateComplianceScore(restrictions: InvestmentRestriction[]): number {
    // Simplified compliance score calculation
    // In reality, this would check actual portfolio against restrictions
    if (restrictions.length === 0) return 100;
    
    const activeRestrictions = restrictions.filter(res => res.isActive);
    const criticalRestrictions = activeRestrictions.filter(res => 
      res.violationAction === 'BLOCK'
    );
    
    // Base score reduced by number of restrictions
    let score = 100 - (activeRestrictions.length * 2);
    
    // Additional reduction for critical restrictions
    score -= criticalRestrictions.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }
}
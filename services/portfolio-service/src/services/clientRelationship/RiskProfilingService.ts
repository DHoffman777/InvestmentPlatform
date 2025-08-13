import { getPrismaClient } from '../../utils/prisma';
import { getKafkaService } from '../../utils/kafka-mock';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import {
  SuitabilityAssessment,
  SuitabilityAssessmentRequest,
  RiskTolerance,
  InvestmentExperience,
  LiquidityNeeds,
  AssetAllocation
} from '../../models/clientRelationship/ClientRelationship';

export interface RiskProfileQuestionnaire {
  id: string;
  clientId: string;
  questionnaireVersion: string;
  completedDate: Date;
  responses: QuestionResponse[];
  calculatedRiskScore: number;
  recommendedRiskTolerance: RiskTolerance;
  isValid: boolean;
  expirationDate: Date;
  completedBy: string;
}

export interface QuestionResponse {
  questionId: string;
  questionText: string;
  answerValue: number;
  answerText: string;
  weight: number;
  category: 'RISK_CAPACITY' | 'RISK_TOLERANCE' | 'INVESTMENT_KNOWLEDGE' | 'TIME_HORIZON' | 'LIQUIDITY';
}

export interface RiskAssessmentResult {
  clientId: string;
  overallRiskScore: number;
  riskTolerance: RiskTolerance;
  riskCapacity: 'LOW' | 'MODERATE' | 'HIGH';
  componentScores: {
    riskCapacity: number;
    riskTolerance: number;
    investmentKnowledge: number;
    timeHorizon: number;
    liquidity: number;
  };
  recommendations: RiskRecommendation[];
  warnings: RiskWarning[];
  nextReviewDate: Date;
}

export interface RiskRecommendation {
  type: 'ASSET_ALLOCATION' | 'INVESTMENT_STRATEGY' | 'RISK_ADJUSTMENT' | 'EDUCATION';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionItems: string[];
  rationale: string;
}

export interface RiskWarning {
  type: 'MISMATCH' | 'CAPACITY_CONCERN' | 'EXPERIENCE_GAP' | 'REGULATORY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  requiredActions: string[];
  escalationRequired: boolean;
}

export interface SuitabilityReview {
  id: string;
  clientId: string;
  reviewDate: Date;
  reviewType: 'INITIAL' | 'PERIODIC' | 'TRIGGER_EVENT' | 'REGULATORY';
  triggerReason?: string;
  currentPortfolios: PortfolioSuitability[];
  overallSuitabilityScore: number;
  unsuitableHoldings: UnsuitableHolding[];
  requiredActions: SuitabilityAction[];
  reviewedBy: string;
  approvedBy?: string;
  nextReviewDate: Date;
}

export interface PortfolioSuitability {
  portfolioId: string;
  suitabilityScore: number;
  assetAllocationAlignment: number;
  riskAlignment: number;
  objectiveAlignment: number;
  issuesIdentified: string[];
  recommendations: string[];
}

export interface UnsuitableHolding {
  symbol: string;
  quantity: Decimal;
  marketValue: Decimal;
  unsuitabilityReason: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: 'IMMEDIATE_SALE' | 'GRADUAL_REDUCTION' | 'HOLD_MONITOR' | 'REVIEW_REQUIRED';
  timeline: string;
}

export interface SuitabilityAction {
  actionType: 'REBALANCE' | 'LIQUIDATE' | 'DOCUMENTATION' | 'REVIEW' | 'APPROVAL';
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: Date;
  assignedTo: string;
  isCompleted: boolean;
  completedDate?: Date;
}

export interface RiskMonitoringAlert {
  id: string;
  clientId: string;
  alertType: 'PORTFOLIO_DRIFT' | 'RISK_CAPACITY_CHANGE' | 'UNSUITABLE_INVESTMENT' | 'CONCENTRATION_RISK';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  triggeredDate: Date;
  portfolioId?: string;
  holdingSymbol?: string;
  currentValue?: Decimal;
  thresholdValue?: Decimal;
  recommendedAction: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedDate?: Date;
  isResolved: boolean;
  resolvedDate?: Date;
  resolution?: string;
}

export class RiskProfilingService {
  private prisma = getPrismaClient();
  private kafkaService = getKafkaService();

  /**
   * Complete comprehensive risk profiling assessment
   */
  async completeRiskAssessment(
    clientId: string,
    questionnaire: Omit<RiskProfileQuestionnaire, 'id' | 'completedDate' | 'calculatedRiskScore' | 'recommendedRiskTolerance' | 'isValid' | 'expirationDate'>,
    tenantId: string,
    userId: string
  ): Promise<RiskAssessmentResult> {
    try {
      logger.info('Completing risk assessment', { clientId, tenantId });

      // Verify client exists
      const client = await this.prisma.clientProfile.findFirst({
        where: { id: clientId, tenantId }
      });

      if (!client) {
        throw new Error(`Client not found: ${clientId}`);
      }

      // Calculate risk scores
      const riskScores = this.calculateRiskScores(questionnaire.responses);
      const overallRiskScore = this.calculateOverallRiskScore(riskScores);
      const recommendedRiskTolerance = this.determineRiskTolerance(overallRiskScore);
      const riskCapacity = this.assessRiskCapacity(clientId, tenantId);

      // Create questionnaire record
      const completedQuestionnaire: RiskProfileQuestionnaire = {
        id: randomUUID(),
        clientId,
        questionnaireVersion: questionnaire.questionnaireVersion,
        completedDate: new Date(),
        responses: questionnaire.responses,
        calculatedRiskScore: overallRiskScore,
        recommendedRiskTolerance,
        isValid: true,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        completedBy: userId
      };

      // Store questionnaire in database
      await this.prisma.riskProfileQuestionnaire.create({
        data: {
          id: completedQuestionnaire.id,
          clientId: completedQuestionnaire.clientId,
          questionnaireVersion: completedQuestionnaire.questionnaireVersion,
          completedDate: completedQuestionnaire.completedDate,
          responses: JSON.stringify(completedQuestionnaire.responses),
          calculatedRiskScore: completedQuestionnaire.calculatedRiskScore,
          recommendedRiskTolerance: completedQuestionnaire.recommendedRiskTolerance,
          isValid: completedQuestionnaire.isValid,
          expirationDate: completedQuestionnaire.expirationDate,
          completedBy: completedQuestionnaire.completedBy
        }
      });

      // Generate recommendations and warnings
      const recommendations = await this.generateRiskRecommendations(
        clientId, 
        overallRiskScore, 
        recommendedRiskTolerance, 
        await riskCapacity,
        tenantId
      );
      
      const warnings = await this.identifyRiskWarnings(
        clientId, 
        overallRiskScore, 
        recommendedRiskTolerance, 
        await riskCapacity,
        tenantId
      );

      const result: RiskAssessmentResult = {
        clientId,
        overallRiskScore,
        riskTolerance: recommendedRiskTolerance,
        riskCapacity: await riskCapacity,
        componentScores: riskScores,
        recommendations,
        warnings,
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };

      // Update client's risk tolerance if significantly different
      if (client.riskTolerance !== recommendedRiskTolerance) {
        await this.prisma.clientProfile.update({
          where: { id: clientId },
          data: { 
            riskTolerance: recommendedRiskTolerance,
            updatedAt: new Date(),
            updatedBy: userId
          }
        });

        // Publish risk tolerance change event
        await this.kafkaService.publish('client.risk_tolerance.changed', {
          clientId,
          previousRiskTolerance: client.riskTolerance,
          newRiskTolerance: recommendedRiskTolerance,
          assessmentId: completedQuestionnaire.id,
          tenantId,
          timestamp: new Date().toISOString()
        });
      }

      // Publish risk assessment completed event
      await this.kafkaService.publish('client.risk_assessment.completed', {
        clientId,
        assessmentId: completedQuestionnaire.id,
        riskScore: overallRiskScore,
        riskTolerance: recommendedRiskTolerance,
        warnings: warnings.length,
        tenantId,
        timestamp: new Date().toISOString()
      });

      logger.info('Risk assessment completed successfully', {
        clientId,
        assessmentId: completedQuestionnaire.id,
        riskScore: overallRiskScore
      });

      return result;

    } catch (error) {
      logger.error('Error completing risk assessment:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive suitability assessment
   */
  async performSuitabilityAssessment(
    request: SuitabilityAssessmentRequest,
    tenantId: string,
    userId: string
  ): Promise<SuitabilityAssessment> {
    try {
      logger.info('Performing suitability assessment', {
        clientId: request.clientId,
        assessmentType: request.assessmentType,
        tenantId
      });

      // Get client and portfolio information
      const client = await this.prisma.clientProfile.findFirst({
        where: { id: request.clientId, tenantId },
        include: {
          portfolios: {
            include: {
              positions: {
                include: {
                  instrument: true
                }
              }
            }
          }
        }
      });

      if (!client) {
        throw new Error(`Client not found: ${request.clientId}`);
      }

      // Calculate suitability scores
      const overallScore = this.calculateSuitabilityScore(request, client);
      const riskScore = this.calculateRiskAlignment(request.riskTolerance, client.riskTolerance);
      const objectiveAlignment = this.calculateObjectiveAlignment(request.investmentObjectives, client);

      // Generate asset allocation recommendations
      const recommendedAllocation = this.generateAssetAllocation(
        request.riskTolerance,
        request.timeHorizon,
        request.liquidityNeeds,
        request.investmentObjectives
      );

      // Identify unsuitable investments
      const unsuitableInvestments = await this.identifyUnsuitableInvestments(
        request.clientId,
        request.riskTolerance,
        request.investmentObjectives,
        tenantId
      );

      const assessment: SuitabilityAssessment = {
        id: randomUUID(),
        clientId: request.clientId,
        tenantId,
        assessmentDate: new Date(),
        assessmentType: request.assessmentType,
        riskTolerance: request.riskTolerance,
        riskCapacity: this.determineRiskCapacity(request.netWorth, request.annualIncome),
        investmentObjectives: request.investmentObjectives,
        timeHorizon: request.timeHorizon,
        liquidityNeeds: request.liquidityNeeds,
        netWorth: request.netWorth,
        annualIncome: request.annualIncome,
        investmentExperience: request.investmentExperience,
        overallScore,
        riskScore,
        objectiveAlignment,
        recommendedAllocation,
        unsuitableInvestments,
        reviewedBy: userId,
        reviewDate: new Date(),
        nextReviewDate: this.calculateNextReviewDate(request.assessmentType),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      // Store assessment in database
      await this.prisma.suitabilityAssessment.create({
        data: {
          id: assessment.id,
          clientId: assessment.clientId,
          tenantId: assessment.tenantId,
          assessmentDate: assessment.assessmentDate,
          assessmentType: assessment.assessmentType,
          riskTolerance: assessment.riskTolerance,
          riskCapacity: assessment.riskCapacity,
          investmentObjectives: JSON.stringify(assessment.investmentObjectives),
          timeHorizon: assessment.timeHorizon,
          liquidityNeeds: assessment.liquidityNeeds,
          netWorth: assessment.netWorth,
          annualIncome: assessment.annualIncome,
          investmentExperience: assessment.investmentExperience,
          overallScore: assessment.overallScore,
          riskScore: assessment.riskScore,
          objectiveAlignment: assessment.objectiveAlignment,
          recommendedAllocation: JSON.stringify(assessment.recommendedAllocation),
          unsuitableInvestments: JSON.stringify(assessment.unsuitableInvestments),
          reviewedBy: assessment.reviewedBy,
          reviewDate: assessment.reviewDate,
          nextReviewDate: assessment.nextReviewDate,
          createdAt: assessment.createdAt,
          updatedAt: assessment.updatedAt,
          createdBy: assessment.createdBy
        }
      });

      // Publish suitability assessment event
      await this.kafkaService.publish('client.suitability_assessment.completed', {
        assessmentId: assessment.id,
        clientId: request.clientId,
        assessmentType: request.assessmentType,
        overallScore,
        unsuitableInvestmentsCount: unsuitableInvestments.length,
        tenantId,
        timestamp: new Date().toISOString()
      });

      // Trigger portfolio review if significant issues found
      if (overallScore < 70 || unsuitableInvestments.length > 0) {
        await this.triggerPortfolioReview(request.clientId, assessment.id, tenantId);
      }

      logger.info('Suitability assessment completed successfully', {
        assessmentId: assessment.id,
        clientId: request.clientId,
        overallScore
      });

      return assessment;

    } catch (error) {
      logger.error('Error performing suitability assessment:', error);
      throw error;
    }
  }

  /**
   * Monitor ongoing suitability and generate alerts
   */
  async monitorSuitability(
    clientId: string,
    tenantId: string
  ): Promise<RiskMonitoringAlert[]> {
    try {
      logger.info('Monitoring client suitability', { clientId, tenantId });

      const alerts: RiskMonitoringAlert[] = [];

      // Get client and portfolio data
      const client = await this.prisma.clientProfile.findFirst({
        where: { id: clientId, tenantId },
        include: {
          portfolios: {
            include: {
              positions: {
                include: {
                  instrument: true
                }
              }
            }
          }
        }
      });

      if (!client) {
        throw new Error(`Client not found: ${clientId}`);
      }

      // Check for portfolio drift
      const driftAlerts = await this.checkPortfolioDrift(client);
      alerts.push(...driftAlerts);

      // Check for concentration risk
      const concentrationAlerts = await this.checkConcentrationRisk(client);
      alerts.push(...concentrationAlerts);

      // Check for unsuitable investments
      const unsuitableAlerts = await this.checkUnsuitableInvestments(client);
      alerts.push(...unsuitableAlerts);

      // Store new alerts in database
      for (const alert of alerts) {
        await this.prisma.riskMonitoringAlert.create({
          data: {
            id: alert.id,
            clientId: alert.clientId,
            alertType: alert.alertType,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            triggeredDate: alert.triggeredDate,
            portfolioId: alert.portfolioId,
            holdingSymbol: alert.holdingSymbol,
            currentValue: alert.currentValue,
            thresholdValue: alert.thresholdValue,
            recommendedAction: alert.recommendedAction,
            isAcknowledged: alert.isAcknowledged,
            isResolved: alert.isResolved
          }
        });

        // Publish alert event
        await this.kafkaService.publish('client.suitability_alert.created', {
          alertId: alert.id,
          clientId: alert.clientId,
          alertType: alert.alertType,
          severity: alert.severity,
          tenantId,
          timestamp: new Date().toISOString()
        });
      }

      logger.info('Suitability monitoring completed', {
        clientId,
        alertsGenerated: alerts.length
      });

      return alerts;

    } catch (error) {
      logger.error('Error monitoring suitability:', error);
      throw error;
    }
  }

  /**
   * Get client's risk profile history
   */
  async getRiskProfileHistory(
    clientId: string,
    tenantId: string
  ): Promise<RiskProfileQuestionnaire[]> {
    try {
      const questionnaires = await this.prisma.riskProfileQuestionnaire.findMany({
        where: { clientId },
        orderBy: { completedDate: 'desc' }
      });

      return questionnaires.map(q => ({
        id: q.id,
        clientId: q.clientId,
        questionnaireVersion: q.questionnaireVersion,
        completedDate: q.completedDate,
        responses: JSON.parse(q.responses as string),
        calculatedRiskScore: q.calculatedRiskScore,
        recommendedRiskTolerance: q.recommendedRiskTolerance as RiskTolerance,
        isValid: q.isValid,
        expirationDate: q.expirationDate,
        completedBy: q.completedBy
      }));

    } catch (error) {
      logger.error('Error retrieving risk profile history:', error);
      throw error;
    }
  }

  /**
   * Get active suitability alerts for client
   */
  async getActiveSuitabilityAlerts(
    clientId: string,
    tenantId: string
  ): Promise<RiskMonitoringAlert[]> {
    try {
      const alerts = await this.prisma.riskMonitoringAlert.findMany({
        where: {
          clientId,
          isResolved: false
        },
        orderBy: [
          { severity: 'asc' }, // HIGH first
          { triggeredDate: 'desc' }
        ]
      });

      return alerts.map(alert => ({
        id: alert.id,
        clientId: alert.clientId,
        alertType: alert.alertType as any,
        severity: alert.severity as any,
        title: alert.title,
        description: alert.description,
        triggeredDate: alert.triggeredDate,
        portfolioId: alert.portfolioId,
        holdingSymbol: alert.holdingSymbol,
        currentValue: alert.currentValue,
        thresholdValue: alert.thresholdValue,
        recommendedAction: alert.recommendedAction,
        isAcknowledged: alert.isAcknowledged,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedDate: alert.acknowledgedDate,
        isResolved: alert.isResolved,
        resolvedDate: alert.resolvedDate,
        resolution: alert.resolution
      }));

    } catch (error) {
      logger.error('Error retrieving suitability alerts:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateRiskScores(responses: QuestionResponse[]): {
    riskCapacity: number;
    riskTolerance: number;
    investmentKnowledge: number;
    timeHorizon: number;
    liquidity: number;
  } {
    const scores = {
      riskCapacity: 0,
      riskTolerance: 0,
      investmentKnowledge: 0,
      timeHorizon: 0,
      liquidity: 0
    };

    const weights = {
      riskCapacity: 0,
      riskTolerance: 0,
      investmentKnowledge: 0,
      timeHorizon: 0,
      liquidity: 0
    };

    responses.forEach(response => {
      const category = response.category.toLowerCase() as keyof typeof scores;
      if (category === 'risk_capacity') {
        scores.riskCapacity += response.answerValue * response.weight;
        weights.riskCapacity += response.weight;
      } else if (category === 'risk_tolerance') {
        scores.riskTolerance += response.answerValue * response.weight;
        weights.riskTolerance += response.weight;
      } else if (category === 'investment_knowledge') {
        scores.investmentKnowledge += response.answerValue * response.weight;
        weights.investmentKnowledge += response.weight;
      } else if (category === 'time_horizon') {
        scores.timeHorizon += response.answerValue * response.weight;
        weights.timeHorizon += response.weight;
      } else if (category === 'liquidity') {
        scores.liquidity += response.answerValue * response.weight;
        weights.liquidity += response.weight;
      }
    });

    // Normalize scores
    Object.keys(scores).forEach(key => {
      const k = key as keyof typeof scores;
      if (weights[k] > 0) {
        scores[k] = Math.round((scores[k] / weights[k]) * 100) / 100;
      }
    });

    return scores;
  }

  private calculateOverallRiskScore(componentScores: {
    riskCapacity: number;
    riskTolerance: number;
    investmentKnowledge: number;
    timeHorizon: number;
    liquidity: number;
  }): number {
    // Weighted average of component scores
    const weights = {
      riskCapacity: 0.25,
      riskTolerance: 0.30,
      investmentKnowledge: 0.20,
      timeHorizon: 0.15,
      liquidity: 0.10
    };

    const totalScore = Object.keys(componentScores).reduce((sum, key) => {
      const k = key as keyof typeof componentScores;
      return sum + (componentScores[k] * weights[k]);
    }, 0);

    return Math.round(totalScore * 100) / 100;
  }

  private determineRiskTolerance(riskScore: number): RiskTolerance {
    if (riskScore <= 2) return RiskTolerance.CONSERVATIVE;
    if (riskScore <= 3) return RiskTolerance.MODERATE_CONSERVATIVE;
    if (riskScore <= 4) return RiskTolerance.MODERATE;
    if (riskScore <= 4.5) return RiskTolerance.MODERATE_AGGRESSIVE;
    return RiskTolerance.AGGRESSIVE;
  }

  private async assessRiskCapacity(clientId: string, tenantId: string): Promise<'LOW' | 'MODERATE' | 'HIGH'> {
    // Get client financial information
    const client = await this.prisma.clientProfile.findFirst({
      where: { id: clientId, tenantId }
    });

    if (!client) return 'LOW';

    const netWorth = client.netWorth ? client.netWorth.toNumber() : 0;
    const annualIncome = client.annualIncome ? client.annualIncome.toNumber() : 0;

    // Simple risk capacity assessment based on financial metrics
    if (netWorth > 1000000 && annualIncome > 200000) return 'HIGH';
    if (netWorth > 500000 && annualIncome > 100000) return 'MODERATE';
    return 'LOW';
  }

  private async generateRiskRecommendations(
    clientId: string,
    riskScore: number,
    riskTolerance: RiskTolerance,
    riskCapacity: 'LOW' | 'MODERATE' | 'HIGH',
    tenantId: string
  ): Promise<RiskRecommendation[]> {
    const recommendations: RiskRecommendation[] = [];

    // Asset allocation recommendation
    recommendations.push({
      type: 'ASSET_ALLOCATION',
      priority: 'HIGH',
      title: 'Recommended Asset Allocation',
      description: `Based on your ${riskTolerance.toLowerCase()} risk profile, consider the following allocation`,
      actionItems: this.getAssetAllocationRecommendations(riskTolerance),
      rationale: `Your risk score of ${riskScore} indicates a ${riskTolerance.toLowerCase()} risk profile`
    });

    // Risk capacity vs tolerance alignment
    if (riskCapacity === 'LOW' && (riskTolerance === RiskTolerance.MODERATE_AGGRESSIVE || riskTolerance === RiskTolerance.AGGRESSIVE)) {
      recommendations.push({
        type: 'RISK_ADJUSTMENT',
        priority: 'HIGH',
        title: 'Risk Capacity Mismatch',
        description: 'Your risk tolerance exceeds your financial risk capacity',
        actionItems: [
          'Consider reducing portfolio risk to align with financial capacity',
          'Focus on building emergency fund before aggressive investing',
          'Review investment timeline and objectives'
        ],
        rationale: 'Taking excessive risk relative to financial capacity can jeopardize financial security'
      });
    }

    return recommendations;
  }

  private async identifyRiskWarnings(
    clientId: string,
    riskScore: number,
    riskTolerance: RiskTolerance,
    riskCapacity: 'LOW' | 'MODERATE' | 'HIGH',
    tenantId: string
  ): Promise<RiskWarning[]> {
    const warnings: RiskWarning[] = [];

    // Risk capacity vs tolerance mismatch
    if (riskCapacity === 'LOW' && (riskTolerance === RiskTolerance.MODERATE_AGGRESSIVE || riskTolerance === RiskTolerance.AGGRESSIVE)) {
      warnings.push({
        type: 'CAPACITY_CONCERN',
        severity: 'HIGH',
        title: 'Risk Capacity Insufficient',
        description: 'Client\'s financial situation may not support aggressive risk taking',
        requiredActions: [
          'Document risk capacity limitations',
          'Obtain client acknowledgment of risk mismatch',
          'Consider portfolio adjustments'
        ],
        escalationRequired: true
      });
    }

    return warnings;
  }

  private calculateSuitabilityScore(request: SuitabilityAssessmentRequest, client: any): number {
    let score = 100;

    // Risk tolerance alignment (30% weight)
    const riskAlignment = this.calculateRiskAlignment(request.riskTolerance, client.riskTolerance);
    score -= (100 - riskAlignment) * 0.3;

    // Time horizon alignment (25% weight)
    const timeHorizonDiff = Math.abs(request.timeHorizon - (client.timeHorizon || 10));
    const timeHorizonPenalty = Math.min(timeHorizonDiff * 5, 50);
    score -= timeHorizonPenalty * 0.25;

    // Investment experience alignment (25% weight)
    const experienceScore = this.getExperienceScore(request.investmentExperience);
    const clientExperienceScore = this.getExperienceScore(client.investmentExperience);
    const experienceDiff = Math.abs(experienceScore - clientExperienceScore);
    score -= experienceDiff * 5 * 0.25;

    // Liquidity needs alignment (20% weight)
    const liquidityAlignment = this.calculateLiquidityAlignment(request.liquidityNeeds, client.liquidityNeeds);
    score -= (100 - liquidityAlignment) * 0.2;

    return Math.max(0, Math.round(score));
  }

  private calculateRiskAlignment(requestRisk: RiskTolerance, clientRisk: RiskTolerance): number {
    const riskLevels = [
      RiskTolerance.CONSERVATIVE,
      RiskTolerance.MODERATE_CONSERVATIVE,
      RiskTolerance.MODERATE,
      RiskTolerance.MODERATE_AGGRESSIVE,
      RiskTolerance.AGGRESSIVE
    ];

    const requestIndex = riskLevels.indexOf(requestRisk);
    const clientIndex = riskLevels.indexOf(clientRisk);
    const difference = Math.abs(requestIndex - clientIndex);

    return Math.max(0, 100 - (difference * 25));
  }

  private calculateObjectiveAlignment(requestObjectives: string[], client: any): number {
    // Simplified objective alignment calculation
    // In practice, this would compare against client's actual investment objectives
    return 85; // Placeholder
  }

  private generateAssetAllocation(
    riskTolerance: RiskTolerance,
    timeHorizon: number,
    liquidityNeeds: LiquidityNeeds,
    objectives: string[]
  ): AssetAllocation[] {
    // Standard asset allocation models based on risk tolerance
    const allocations: Record<RiskTolerance, AssetAllocation[]> = {
      [RiskTolerance.CONSERVATIVE]: [
        { assetClass: 'Fixed Income', targetPercentage: new Decimal(60), minPercentage: new Decimal(50), maxPercentage: new Decimal(70), rationale: 'Capital preservation focus' },
        { assetClass: 'Equities', targetPercentage: new Decimal(30), minPercentage: new Decimal(20), maxPercentage: new Decimal(40), rationale: 'Limited growth exposure' },
        { assetClass: 'Cash', targetPercentage: new Decimal(10), minPercentage: new Decimal(5), maxPercentage: new Decimal(15), rationale: 'Liquidity buffer' }
      ],
      [RiskTolerance.MODERATE_CONSERVATIVE]: [
        { assetClass: 'Fixed Income', targetPercentage: new Decimal(50), minPercentage: new Decimal(40), maxPercentage: new Decimal(60), rationale: 'Stability with modest growth' },
        { assetClass: 'Equities', targetPercentage: new Decimal(40), minPercentage: new Decimal(30), maxPercentage: new Decimal(50), rationale: 'Moderate growth exposure' },
        { assetClass: 'Cash', targetPercentage: new Decimal(10), minPercentage: new Decimal(5), maxPercentage: new Decimal(15), rationale: 'Liquidity needs' }
      ],
      [RiskTolerance.MODERATE]: [
        { assetClass: 'Fixed Income', targetPercentage: new Decimal(40), minPercentage: new Decimal(30), maxPercentage: new Decimal(50), rationale: 'Balanced approach' },
        { assetClass: 'Equities', targetPercentage: new Decimal(50), minPercentage: new Decimal(40), maxPercentage: new Decimal(60), rationale: 'Growth with stability' },
        { assetClass: 'Alternatives', targetPercentage: new Decimal(5), minPercentage: new Decimal(0), maxPercentage: new Decimal(10), rationale: 'Diversification' },
        { assetClass: 'Cash', targetPercentage: new Decimal(5), minPercentage: new Decimal(2), maxPercentage: new Decimal(10), rationale: 'Tactical opportunities' }
      ],
      [RiskTolerance.MODERATE_AGGRESSIVE]: [
        { assetClass: 'Equities', targetPercentage: new Decimal(65), minPercentage: new Decimal(55), maxPercentage: new Decimal(75), rationale: 'Growth focus' },
        { assetClass: 'Fixed Income', targetPercentage: new Decimal(25), minPercentage: new Decimal(15), maxPercentage: new Decimal(35), rationale: 'Risk mitigation' },
        { assetClass: 'Alternatives', targetPercentage: new Decimal(7), minPercentage: new Decimal(2), maxPercentage: new Decimal(12), rationale: 'Enhanced returns' },
        { assetClass: 'Cash', targetPercentage: new Decimal(3), minPercentage: new Decimal(1), maxPercentage: new Decimal(8), rationale: 'Opportunity fund' }
      ],
      [RiskTolerance.AGGRESSIVE]: [
        { assetClass: 'Equities', targetPercentage: new Decimal(75), minPercentage: new Decimal(65), maxPercentage: new Decimal(85), rationale: 'Maximum growth potential' },
        { assetClass: 'Alternatives', targetPercentage: new Decimal(15), minPercentage: new Decimal(5), maxPercentage: new Decimal(25), rationale: 'Alpha generation' },
        { assetClass: 'Fixed Income', targetPercentage: new Decimal(8), minPercentage: new Decimal(3), maxPercentage: new Decimal(15), rationale: 'Minimal stability' },
        { assetClass: 'Cash', targetPercentage: new Decimal(2), minPercentage: new Decimal(0), maxPercentage: new Decimal(7), rationale: 'Tactical positioning' }
      ]
    };

    return allocations[riskTolerance];
  }

  private async identifyUnsuitableInvestments(
    clientId: string,
    riskTolerance: RiskTolerance,
    objectives: string[],
    tenantId: string
  ): Promise<string[]> {
    // This would analyze client's current holdings against their risk profile
    // For now, return placeholder unsuitable investment types
    const unsuitable: string[] = [];

    if (riskTolerance === RiskTolerance.CONSERVATIVE) {
      unsuitable.push('High-yield bonds', 'Emerging market equities', 'Leveraged ETFs');
    }

    return unsuitable;
  }

  private determineRiskCapacity(netWorth: Decimal, annualIncome: Decimal): 'LOW' | 'MODERATE' | 'HIGH' {
    const netWorthNum = netWorth.toNumber();
    const incomeNum = annualIncome.toNumber();

    if (netWorthNum > 1000000 && incomeNum > 200000) return 'HIGH';
    if (netWorthNum > 500000 && incomeNum > 100000) return 'MODERATE';
    return 'LOW';
  }

  private calculateNextReviewDate(assessmentType: string): Date {
    const now = new Date();
    switch (assessmentType) {
      case 'INITIAL':
        return new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
      case 'PERIODIC':
        return new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
      case 'TRIGGER_EVENT':
        return new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // 3 months
      default:
        return new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
    }
  }

  private async triggerPortfolioReview(clientId: string, assessmentId: string, tenantId: string): Promise<void> {
    await this.kafkaService.publish('portfolio.review.triggered', {
      clientId,
      assessmentId,
      reason: 'Suitability concerns identified',
      tenantId,
      timestamp: new Date().toISOString()
    });
  }

  private getExperienceScore(experience: InvestmentExperience): number {
    const scores = {
      [InvestmentExperience.NOVICE]: 1,
      [InvestmentExperience.LIMITED]: 2,
      [InvestmentExperience.MODERATE]: 3,
      [InvestmentExperience.EXTENSIVE]: 4,
      [InvestmentExperience.PROFESSIONAL]: 5
    };
    return scores[experience] || 3;
  }

  private calculateLiquidityAlignment(requestLiquidity: LiquidityNeeds, clientLiquidity: LiquidityNeeds): number {
    const liquidityLevels = [LiquidityNeeds.LOW, LiquidityNeeds.MODERATE, LiquidityNeeds.HIGH, LiquidityNeeds.IMMEDIATE];
    const requestIndex = liquidityLevels.indexOf(requestLiquidity);
    const clientIndex = liquidityLevels.indexOf(clientLiquidity);
    const difference = Math.abs(requestIndex - clientIndex);

    return Math.max(0, 100 - (difference * 33));
  }

  private getAssetAllocationRecommendations(riskTolerance: RiskTolerance): string[] {
    const recommendations = {
      [RiskTolerance.CONSERVATIVE]: [
        'Focus on high-grade bonds and fixed income (60%)',
        'Limited equity exposure in large-cap stocks (30%)',
        'Maintain adequate cash reserves (10%)'
      ],
      [RiskTolerance.MODERATE_CONSERVATIVE]: [
        'Balanced allocation between bonds (50%) and equities (40%)',
        'Emphasize dividend-paying stocks',
        'Maintain liquidity buffer (10%)'
      ],
      [RiskTolerance.MODERATE]: [
        'Balanced 50/50 equity to fixed income allocation',
        'Consider small allocation to alternatives (5%)',
        'Regular rebalancing important'
      ],
      [RiskTolerance.MODERATE_AGGRESSIVE]: [
        'Growth-focused equity allocation (65%)',
        'Reduced fixed income exposure (25%)',
        'Consider alternative investments (7%)'
      ],
      [RiskTolerance.AGGRESSIVE]: [
        'High equity allocation (75%)',
        'Significant alternatives exposure (15%)',
        'Minimal fixed income (8%)'
      ]
    };

    return recommendations[riskTolerance] || recommendations[RiskTolerance.MODERATE];
  }

  private async checkPortfolioDrift(client: any): Promise<RiskMonitoringAlert[]> {
    // Placeholder implementation for portfolio drift detection
    return [];
  }

  private async checkConcentrationRisk(client: any): Promise<RiskMonitoringAlert[]> {
    // Placeholder implementation for concentration risk detection
    return [];
  }

  private async checkUnsuitableInvestments(client: any): Promise<RiskMonitoringAlert[]> {
    // Placeholder implementation for unsuitable investment detection
    return [];
  }
}
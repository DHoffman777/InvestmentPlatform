import { Decimal } from '@prisma/client/runtime/library';
import { InvestmentObjective, InvestmentRestriction, RiskTolerance } from '../../models/clientRelationship/ClientRelationship';
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
    restrictionType: string;
    description: string;
    appliesTo: string;
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
    allocationAlignment: number;
    timeHorizonRange: {
        shortest: number;
        longest: number;
        average: number;
    };
    riskConsistency: number;
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
    restrictionsByType: Record<string, number>;
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
    complianceScore: number;
}
export declare class InvestmentObjectivesService {
    private prisma;
    private kafkaService;
    /**
     * Create investment objective for a client
     */
    createInvestmentObjective(request: InvestmentObjectiveRequest, tenantId: string, userId: string): Promise<InvestmentObjective>;
    /**
     * Create investment restriction for a client
     */
    createInvestmentRestriction(request: InvestmentRestrictionRequest, tenantId: string, userId: string): Promise<InvestmentRestriction>;
    /**
     * Get all investment objectives for a client
     */
    getClientObjectives(clientId: string, tenantId: string): Promise<InvestmentObjective[]>;
    /**
     * Get all investment restrictions for a client
     */
    getClientRestrictions(clientId: string, tenantId: string, includeInactive?: boolean): Promise<InvestmentRestriction[]>;
    /**
     * Update investment objective
     */
    updateObjective(objectiveId: string, updates: Partial<InvestmentObjectiveRequest>, tenantId: string, userId: string): Promise<InvestmentObjective>;
    /**
     * Update investment restriction
     */
    updateRestriction(restrictionId: string, updates: Partial<InvestmentRestrictionRequest>, tenantId: string, userId: string): Promise<InvestmentRestriction>;
    /**
     * Delete investment objective
     */
    deleteObjective(objectiveId: string, tenantId: string, userId: string): Promise<any>;
    /**
     * Delete investment restriction
     */
    deleteRestriction(restrictionId: string, tenantId: string, userId: string): Promise<any>;
    /**
     * Analyze client's investment objectives
     */
    analyzeObjectives(clientId: string, tenantId: string): Promise<ObjectiveAnalysis>;
    /**
     * Analyze client's investment restrictions
     */
    analyzeRestrictions(clientId: string, tenantId: string): Promise<RestrictionAnalysis>;
    private adjustObjectivePriorities;
    private triggerSuitabilityReview;
    private triggerComplianceCheck;
    private getRiskLevelNumber;
    private generateObjectiveRecommendations;
    private calculateRestrictionImpact;
    private calculateComplianceScore;
}

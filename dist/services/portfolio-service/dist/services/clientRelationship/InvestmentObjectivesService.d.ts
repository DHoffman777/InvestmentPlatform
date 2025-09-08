export const __esModule: boolean;
export class InvestmentObjectivesService {
    prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, library_1.DefaultArgs>;
    kafkaService: kafka_mock_1.KafkaService;
    /**
     * Create investment objective for a client
     */
    createInvestmentObjective(request: any, tenantId: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        objective: any;
        priority: any;
        targetAllocation: any;
        description: any;
        timeHorizon: any;
        expectedReturn: any;
        riskLevel: any;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Create investment restriction for a client
     */
    createInvestmentRestriction(request: any, tenantId: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        restrictionType: any;
        description: any;
        appliesTo: any;
        isActive: any;
        effectiveDate: any;
        expirationDate: any;
        threshold: any;
        violationAction: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Get all investment objectives for a client
     */
    getClientObjectives(clientId: any, tenantId: any): Promise<{
        id: string;
        objective: string;
        priority: number;
        targetAllocation: library_1.Decimal;
        description: string;
        timeHorizon: number;
        expectedReturn: library_1.Decimal;
        riskLevel: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    /**
     * Get all investment restrictions for a client
     */
    getClientRestrictions(clientId: any, tenantId: any, includeInactive?: boolean): Promise<{
        id: string;
        restrictionType: string;
        description: string;
        appliesTo: string;
        isActive: boolean;
        effectiveDate: Date;
        expirationDate: Date;
        threshold: library_1.Decimal;
        violationAction: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    /**
     * Update investment objective
     */
    updateObjective(objectiveId: any, updates: any, tenantId: any, userId: any): Promise<{
        id: string;
        objective: string;
        priority: number;
        targetAllocation: library_1.Decimal;
        description: string;
        timeHorizon: number;
        expectedReturn: library_1.Decimal;
        riskLevel: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Update investment restriction
     */
    updateRestriction(restrictionId: any, updates: any, tenantId: any, userId: any): Promise<{
        id: string;
        restrictionType: string;
        description: string;
        appliesTo: string;
        isActive: boolean;
        effectiveDate: Date;
        expirationDate: Date;
        threshold: library_1.Decimal;
        violationAction: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Delete investment objective
     */
    deleteObjective(objectiveId: any, tenantId: any, userId: any): Promise<void>;
    /**
     * Delete investment restriction
     */
    deleteRestriction(restrictionId: any, tenantId: any, userId: any): Promise<void>;
    /**
     * Analyze client's investment objectives
     */
    analyzeObjectives(clientId: any, tenantId: any): Promise<{
        clientId: any;
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
        recommendations: {
            type: string;
            priority: string;
            description: string;
            suggestedAction: string;
        }[];
    }>;
    /**
     * Analyze client's investment restrictions
     */
    analyzeRestrictions(clientId: any, tenantId: any): Promise<{
        clientId: any;
        totalRestrictions: number;
        restrictionsByType: {};
        activeRestrictions: number;
        upcomingExpirations: {
            restrictionId: string;
            expirationDate: Date;
            description: string;
        }[];
        impactAnalysis: {
            estimatedPortfolioImpact: library_1.Decimal;
            restrictedUniversePercentage: library_1.Decimal;
            diversificationConstraints: any;
        };
        complianceScore: number;
    }>;
    adjustObjectivePriorities(clientId: any, newPriority: any, tenantId: any, excludeObjectiveId: any): Promise<void>;
    triggerSuitabilityReview(clientId: any, tenantId: any, trigger: any): Promise<void>;
    triggerComplianceCheck(clientId: any, tenantId: any, restrictionId: any): Promise<void>;
    getRiskLevelNumber(riskLevel: any): any;
    generateObjectiveRecommendations(objectives: any, allocationAlignment: any, riskConsistency: any, timeHorizonRange: any): {
        type: string;
        priority: string;
        description: string;
        suggestedAction: string;
    }[];
    calculateRestrictionImpact(restrictions: any, clientId: any, tenantId: any): Promise<{
        estimatedPortfolioImpact: library_1.Decimal;
        restrictedUniversePercentage: library_1.Decimal;
        diversificationConstraints: any;
    }>;
    calculateComplianceScore(restrictions: any): number;
}
import library_1 = require("@prisma/client/runtime/library");
import kafka_mock_1 = require("../../utils/kafka-mock");

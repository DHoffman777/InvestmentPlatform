export const __esModule: boolean;
export class RiskProfilingService {
    prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, library_1.DefaultArgs>;
    kafkaService: kafka_mock_1.KafkaService;
    /**
     * Complete comprehensive risk profiling assessment
     */
    completeRiskAssessment(clientId: any, questionnaire: any, tenantId: any, userId: any): Promise<{
        clientId: any;
        overallRiskScore: number;
        riskTolerance: ClientRelationship_1.RiskTolerance;
        riskCapacity: string;
        componentScores: {
            riskCapacity: number;
            riskTolerance: number;
            investmentKnowledge: number;
            timeHorizon: number;
            liquidity: number;
        };
        recommendations: {
            type: string;
            priority: string;
            title: string;
            description: string;
            actionItems: any;
            rationale: string;
        }[];
        warnings: {
            type: string;
            severity: string;
            title: string;
            description: string;
            requiredActions: string[];
            escalationRequired: boolean;
        }[];
        nextReviewDate: Date;
    }>;
    /**
     * Perform comprehensive suitability assessment
     */
    performSuitabilityAssessment(request: any, tenantId: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        clientId: any;
        tenantId: any;
        assessmentDate: Date;
        assessmentType: any;
        riskTolerance: any;
        riskCapacity: string;
        investmentObjectives: any;
        timeHorizon: any;
        liquidityNeeds: any;
        netWorth: any;
        annualIncome: any;
        investmentExperience: any;
        overallScore: number;
        riskScore: number;
        objectiveAlignment: number;
        recommendedAllocation: any;
        unsuitableInvestments: string[];
        reviewedBy: any;
        reviewDate: Date;
        nextReviewDate: Date;
        createdAt: Date;
        updatedAt: Date;
        createdBy: any;
    }>;
    /**
     * Monitor ongoing suitability and generate alerts
     */
    monitorSuitability(clientId: any, tenantId: any): Promise<any[]>;
    /**
     * Get client's risk profile history
     */
    getRiskProfileHistory(clientId: any, tenantId: any): Promise<{
        id: string;
        clientId: string;
        questionnaireVersion: string;
        completedDate: Date;
        responses: any;
        calculatedRiskScore: library_1.Decimal;
        recommendedRiskTolerance: import(".prisma/client").$Enums.RiskTolerance;
        isValid: boolean;
        expirationDate: Date;
        completedBy: string;
    }[]>;
    /**
     * Get active suitability alerts for client
     */
    getActiveSuitabilityAlerts(clientId: any, tenantId: any): Promise<{
        id: string;
        clientId: string;
        alertType: import(".prisma/client").$Enums.RiskAlertType;
        severity: import(".prisma/client").$Enums.AlertSeverity;
        title: string;
        description: string;
        triggeredDate: Date;
        portfolioId: string;
        holdingSymbol: string;
        currentValue: library_1.Decimal;
        thresholdValue: library_1.Decimal;
        recommendedAction: string;
        isAcknowledged: boolean;
        acknowledgedBy: string;
        acknowledgedDate: Date;
        isResolved: boolean;
        resolvedDate: Date;
        resolution: string;
    }[]>;
    calculateRiskScores(responses: any): {
        riskCapacity: number;
        riskTolerance: number;
        investmentKnowledge: number;
        timeHorizon: number;
        liquidity: number;
    };
    calculateOverallRiskScore(componentScores: any): number;
    determineRiskTolerance(riskScore: any): ClientRelationship_1.RiskTolerance;
    assessRiskCapacity(clientId: any, tenantId: any): Promise<"HIGH" | "LOW" | "MODERATE">;
    generateRiskRecommendations(clientId: any, riskScore: any, riskTolerance: any, riskCapacity: any, tenantId: any): Promise<{
        type: string;
        priority: string;
        title: string;
        description: string;
        actionItems: any;
        rationale: string;
    }[]>;
    identifyRiskWarnings(clientId: any, riskScore: any, riskTolerance: any, riskCapacity: any, tenantId: any): Promise<{
        type: string;
        severity: string;
        title: string;
        description: string;
        requiredActions: string[];
        escalationRequired: boolean;
    }[]>;
    calculateSuitabilityScore(request: any, client: any): number;
    calculateRiskAlignment(requestRisk: any, clientRisk: any): number;
    calculateObjectiveAlignment(requestObjectives: any, client: any): number;
    generateAssetAllocation(riskTolerance: any, timeHorizon: any, liquidityNeeds: any, objectives: any): any;
    identifyUnsuitableInvestments(clientId: any, riskTolerance: any, objectives: any, tenantId: any): Promise<string[]>;
    determineRiskCapacity(netWorth: any, annualIncome: any): "HIGH" | "LOW" | "MODERATE";
    calculateNextReviewDate(assessmentType: any): Date;
    triggerPortfolioReview(clientId: any, assessmentId: any, tenantId: any): Promise<void>;
    getExperienceScore(experience: any): any;
    calculateLiquidityAlignment(requestLiquidity: any, clientLiquidity: any): number;
    getAssetAllocationRecommendations(riskTolerance: any): any;
    checkPortfolioDrift(client: any): Promise<any[]>;
    checkConcentrationRisk(client: any): Promise<any[]>;
    checkUnsuitableInvestments(client: any): Promise<any[]>;
}
import library_1 = require("@prisma/client/runtime/library");
import kafka_mock_1 = require("../../utils/kafka-mock");
import ClientRelationship_1 = require("../../models/clientRelationship/ClientRelationship");

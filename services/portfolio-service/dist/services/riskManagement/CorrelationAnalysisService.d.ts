import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../../utils/kafka-mock';
import { CorrelationAnalysisRequest, CorrelationAnalysisResult } from '../../models/riskManagement/RiskManagement';
export declare class CorrelationAnalysisService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: KafkaService);
    analyzeCorrelations(request: CorrelationAnalysisRequest): Promise<CorrelationAnalysisResult>;
    private calculatePositionCorrelations;
    private calculateAssetClassCorrelations;
    private calculateSectorCorrelations;
    private calculateGeographyCorrelations;
    private calculatePearsonCorrelation;
    private performEigenAnalysis;
    private powerIteration;
    private calculateConcentrationMetrics;
    private calculateCategoryConcentration;
    private calculateDiversificationRatio;
    private calculateEffectiveNumberOfBets;
    private calculateRiskContributions;
    private getPortfolioData;
    private getHistoricalReturns;
    private aggregateReturnsByCategory;
    private calculatePortfolioWeights;
    private getAssetVolatilities;
    private storeCorrelationAnalysis;
    private publishCorrelationEvent;
}

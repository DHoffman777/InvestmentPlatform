import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../../utils/kafka-mock';
import { LiquidityRiskRequest, LiquidityRiskResult } from '../../models/riskManagement/RiskManagement';
export declare class LiquidityRiskService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: KafkaService);
    assessLiquidityRisk(request: LiquidityRiskRequest): Promise<LiquidityRiskResult>;
    private calculatePositionLiquidity;
    private assessPositionLiquidity;
    private determineLiquidityCategory;
    private getLiquidityThresholds;
    private calculateLiquidationCost;
    private calculateOverallLiquidityScore;
    private getPositionLiquidityScore;
    private calculateAverageDaysToLiquidate;
    private calculateTotalLiquidationCost;
    private calculateTotalMarketImpact;
    private calculateLiquidityByCategory;
    private calculateLiquidityBySize;
    private performLiquidityStressTesting;
    private applyLiquidityStress;
    private getPortfolioData;
    private getMarketLiquidityData;
    private estimateAverageDailyVolume;
    private estimateBidAskSpread;
    private storeLiquidityRiskResult;
    private publishLiquidityRiskEvent;
}

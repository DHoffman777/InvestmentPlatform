import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../../utils/kafka-mock';
import { StructuredProductValuationRequest, StructuredProductValuationResponse } from '../../models/structuredProducts/StructuredProducts';
export declare class StructuredProductsValuationService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: ReturnType<typeof getKafkaService>);
    valuateProduct(request: StructuredProductValuationRequest): Promise<StructuredProductValuationResponse>;
    private getProductDetails;
    private getMarketData;
    private selectOptimalModel;
    private getValuationModel;
    private executeValuation;
    private monteCarloValuation;
    private binomialValuation;
    private closedFormValuation;
    private generatePricePath;
    private checkBarrierHit;
    private calculatePayoff;
    private calculateGreeks;
    private performScenarioAnalysis;
    private storeValuationResult;
    private publishValuationEvent;
    private randomNormal;
    private cumulativeNormalDistribution;
    private normalPDF;
    valuatePortfolio(productIds: string[], valuationDate: Date, options?: {
        modelType?: string;
        includeGreeks?: boolean;
        scenarioAnalysis?: boolean;
    }): Promise<StructuredProductValuationResponse[]>;
    performStressTest(productId: string, stressScenarios: {
        name: string;
        underlyingShifts: Record<string, number>;
        volatilityShifts?: Record<string, number>;
        rateShifts?: number;
    }[]): Promise<{
        baseValue: number;
        stressResults: {
            scenarioName: string;
            stressedValue: number;
            pnl: number;
            pnlPercent: number;
        }[];
    }>;
}

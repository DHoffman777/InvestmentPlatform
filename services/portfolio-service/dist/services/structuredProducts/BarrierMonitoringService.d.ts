import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../../utils/kafka-mock';
import { StructuredProduct, BarrierAlert, BarrierMonitoringRequest, BarrierMonitoringResponse, BarrierType } from '../../models/structuredProducts/StructuredProducts';
export declare class BarrierMonitoringService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: ReturnType<typeof getKafkaService>);
    monitorBarriers(request: BarrierMonitoringRequest): Promise<BarrierMonitoringResponse>;
    private getProductsToMonitor;
    private getCurrentMarketData;
    private getMockPrice;
    private evaluateBarrier;
    private checkBarrierHit;
    private generateBarrierAlerts;
    private calculateAlertSeverity;
    private isRecoveryScenario;
    private updateBarrierHitStatus;
    private storeMonitoringResults;
    private publishBarrierAlert;
    performRealTimeMonitoring(intervalMinutes?: number): Promise<void>;
    getBarrierHistory(productId: string, startDate?: Date, endDate?: Date): Promise<{
        product: StructuredProduct;
        barrierEvents: {
            barrierId: string;
            eventType: 'HIT' | 'APPROACH' | 'RECOVERY';
            eventTime: Date;
            level: number;
            distance: number;
        }[];
    }>;
    calculateBreachProbability(productId: string, timeHorizonDays: number, confidenceLevel?: number): Promise<{
        productId: string;
        timeHorizonDays: number;
        barrierProbabilities: {
            barrierId: string;
            barrierType: BarrierType;
            breachProbability: number;
            timeToBreachDays?: number;
            confidenceInterval: {
                lower: number;
                upper: number;
            };
        }[];
    }>;
    private cumulativeNormalDistribution;
    getBarrierDashboard(tenantId: string): Promise<{
        summary: {
            totalProducts: number;
            activeBarriers: number;
            approachingBarriers: number;
            hitBarriers: number;
            criticalAlerts: number;
        };
        recentAlerts: BarrierAlert[];
        topRiskProducts: {
            productId: string;
            productName: string;
            riskScore: number;
            closestBarrierDistance: number;
        }[];
        barrierTypesBreakdown: Record<BarrierType, number>;
    }>;
    private calculateRiskScore;
}

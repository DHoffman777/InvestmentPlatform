import { PrismaClient } from '@prisma/client';
import { FixedIncomePosition, FixedIncomeTransaction, CouponPayment, CreateFixedIncomePositionRequest, FixedIncomeTradeRequest, FixedIncomeValuationRequest, CouponProcessingRequest, YieldCalculationResult } from '../models/assets/FixedIncomeAssets';
export declare class FixedIncomeService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService?: any);
    getFixedIncomePositions(portfolioId: string, tenantId: string): Promise<FixedIncomePosition[]>;
    createFixedIncomePosition(request: CreateFixedIncomePositionRequest): Promise<FixedIncomePosition>;
    createFixedIncomeTransaction(request: FixedIncomeTradeRequest): Promise<FixedIncomeTransaction>;
    processCouponPayment(request: CouponProcessingRequest): Promise<CouponPayment>;
    calculateYieldMetrics(positionId: string, tenantId: string): Promise<YieldCalculationResult>;
    valuatePosition(request: FixedIncomeValuationRequest): Promise<any>;
    private mapToFixedIncomePosition;
    private mapToFixedIncomeTransaction;
    private calculateAccruedInterest;
    private approximateYTM;
    private calculateDuration;
    private calculateConvexity;
    private updatePositionFromTransaction;
}

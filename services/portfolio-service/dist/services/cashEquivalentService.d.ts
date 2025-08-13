import { PrismaClient } from '@prisma/client';
import { CashEquivalentPosition, CashEquivalentTransaction, YieldCalculation } from '../models/assets/MoneyMarketAssets';
export interface CreateMoneyMarketPositionRequest {
    portfolioId: string;
    tenantId: string;
    fundId: string;
    shares: number;
    marketValue: number;
    currentYield: number;
    createdBy: string;
}
export interface CreateSweepAccountRequest {
    portfolioId: string;
    tenantId: string;
    accountId: string;
    balance: number;
    currentRate: number;
    sweepThreshold: number;
    autoSweepEnabled: boolean;
    createdBy: string;
}
export interface SweepExecutionRequest {
    portfolioId: string;
    tenantId: string;
    amount: number;
    sweepType: 'AUTO' | 'MANUAL';
    triggerEvent?: string;
    executedBy: string;
}
export interface YieldDistributionRequest {
    positionId: string;
    distributionDate: Date;
    yieldRate: number;
    amount: number;
    distributionType: 'DIVIDEND' | 'INTEREST';
    tenantId: string;
    processedBy: string;
}
export declare class CashEquivalentService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient);
    createMoneyMarketPosition(request: CreateMoneyMarketPositionRequest): Promise<CashEquivalentPosition>;
    createSweepAccount(request: CreateSweepAccountRequest): Promise<CashEquivalentPosition>;
    executeSweep(request: SweepExecutionRequest): Promise<CashEquivalentTransaction>;
    processYieldDistribution(request: YieldDistributionRequest): Promise<CashEquivalentTransaction>;
    calculateCurrentYield(positionId: string, tenantId: string): Promise<YieldCalculation>;
    getCashEquivalentPositions(portfolioId: string, tenantId: string): Promise<CashEquivalentPosition[]>;
    private updatePortfolioValuation;
    private publishEvent;
}

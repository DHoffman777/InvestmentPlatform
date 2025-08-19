import { PrismaClient, Portfolio, Prisma } from '@prisma/client';
export interface CreatePortfolioRequest {
    name: string;
    description?: string;
    portfolioType: 'MANAGED' | 'ADVISORY' | 'DISCRETIONARY' | 'MODEL_BASED' | 'CUSTOM';
    baseCurrency?: string;
    riskProfile: 'CONSERVATIVE' | 'MODERATE_CONSERVATIVE' | 'MODERATE' | 'MODERATE_AGGRESSIVE' | 'AGGRESSIVE';
    investmentObjective?: string;
    minCashPercentage?: number;
    maxCashPercentage?: number;
    tenantId: string;
    ownerId: string;
    createdBy: string;
    updatedBy: string;
}
export interface UpdatePortfolioRequest {
    name?: string;
    description?: string;
    riskProfile?: 'CONSERVATIVE' | 'MODERATE_CONSERVATIVE' | 'MODERATE' | 'MODERATE_AGGRESSIVE' | 'AGGRESSIVE';
    investmentObjective?: string;
    minCashPercentage?: number;
    maxCashPercentage?: number;
    updatedBy: string;
}
export interface GetPortfoliosRequest {
    tenantId: string;
    userId: string;
    page: number;
    limit: number;
    status?: string;
    portfolioType?: string;
    search?: string;
}
export interface PortfolioSummary {
    id: string;
    name: string;
    totalValue: number;
    cashBalance: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
    dayChange: number;
    dayChangePercentage: number;
    positionCount: number;
    lastUpdated: Date;
}
export interface PortfolioAllocation {
    category: string;
    value: number;
    percentage: number;
    gainLoss: number;
    gainLossPercentage: number;
}
export declare class PortfolioService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient);
    getPortfolios(request: GetPortfoliosRequest): Promise<{
        portfolios: {
            id: string;
            description: string | null;
            name: string;
            totalValue: Prisma.Decimal;
            status: import(".prisma/client").$Enums.PortfolioStatus;
            createdAt: Date;
            updatedAt: Date;
            baseCurrency: string;
            portfolioType: import(".prisma/client").$Enums.PortfolioType;
            riskProfile: import(".prisma/client").$Enums.RiskProfile;
            cashBalance: Prisma.Decimal;
            _count: {
                positions: number;
            };
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPortfolioById(id: string, tenantId: string, userId: string): Promise<Portfolio | null>;
    createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio>;
    updatePortfolio(id: string, tenantId: string, userId: string, data: UpdatePortfolioRequest): Promise<Portfolio | null>;
    deletePortfolio(id: string, tenantId: string, userId: string): Promise<boolean>;
    getPortfolioSummary(id: string, tenantId: string, userId: string): Promise<PortfolioSummary | null>;
    getPortfolioAllocations(id: string, tenantId: string, userId: string): Promise<PortfolioAllocation[] | null>;
    private publishPortfolioEvent;
}

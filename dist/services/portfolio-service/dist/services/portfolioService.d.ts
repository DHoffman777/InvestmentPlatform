export const __esModule: boolean;
export class PortfolioService {
    constructor(prisma: any);
    prisma: any;
    kafkaService: kafka_mock_1.KafkaService;
    getPortfolios(request: any): Promise<{
        portfolios: any;
        total: any;
        page: any;
        limit: any;
        totalPages: number;
    }>;
    getPortfolioById(id: any, tenantId: any, userId: any): Promise<any>;
    createPortfolio(data: any): Promise<any>;
    updatePortfolio(id: any, tenantId: any, userId: any, data: any): Promise<any>;
    deletePortfolio(id: any, tenantId: any, userId: any): Promise<boolean>;
    getPortfolioSummary(id: any, tenantId: any, userId: any): Promise<{
        id: any;
        name: any;
        totalValue: any;
        cashBalance: any;
        totalGainLoss: any;
        totalGainLossPercentage: number;
        dayChange: number;
        dayChangePercentage: number;
        positionCount: any;
        lastUpdated: any;
    }>;
    getPortfolioAllocations(id: any, tenantId: any, userId: any): Promise<any[]>;
    publishPortfolioEvent(eventType: any, data: any): Promise<void>;
}
import kafka_mock_1 = require("../utils/kafka-mock");

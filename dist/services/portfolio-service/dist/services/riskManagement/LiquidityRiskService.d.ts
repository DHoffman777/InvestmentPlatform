export const __esModule: boolean;
export class LiquidityRiskService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    assessLiquidityRisk(request: any): Promise<{
        id: string;
        portfolioId: any;
        tenantId: any;
        calculationDate: Date;
        asOfDate: any;
        liquidationTimeframe: any;
        liquidityScore: number;
        averageDaysToLiquidate: number;
        liquidationCost: any;
        marketImpact: number;
        liquidityByAssetClass: {
            category: any;
            percentage: number;
            liquidityCategory: RiskManagement_1.LiquidityCategory;
            averageDaysToLiquidate: number;
            estimatedCost: any;
        }[];
        liquidityBySector: {
            category: any;
            percentage: number;
            liquidityCategory: RiskManagement_1.LiquidityCategory;
            averageDaysToLiquidate: number;
            estimatedCost: any;
        }[];
        liquidityBySize: {
            category: string;
            percentage: number;
            liquidityCategory: RiskManagement_1.LiquidityCategory;
            averageDaysToLiquidate: number;
            estimatedCost: any;
        }[];
        positionLiquidity: {
            positionId: any;
            securityId: any;
            symbol: any;
            marketValue: any;
            liquidityCategory: RiskManagement_1.LiquidityCategory;
            daysToLiquidate: number;
            liquidationCost: number;
            marketImpact: number;
            averageDailyVolume: any;
            bidAskSpread: any;
            marketCapitalization: any;
            floatPercentage: any;
        }[];
        liquidityUnderStress: {
            stressScenario: string;
            liquidityScore: number;
            averageDaysToLiquidate: number;
            totalLiquidationCost: any;
            marketImpact: number;
        }[];
        createdAt: Date;
        calculatedBy: string;
    }>;
    calculatePositionLiquidity(portfolioData: any, marketLiquidityData: any, request: any): Promise<{
        positionId: any;
        securityId: any;
        symbol: any;
        marketValue: any;
        liquidityCategory: RiskManagement_1.LiquidityCategory;
        daysToLiquidate: number;
        liquidationCost: number;
        marketImpact: number;
        averageDailyVolume: any;
        bidAskSpread: any;
        marketCapitalization: any;
        floatPercentage: any;
    }[]>;
    assessPositionLiquidity(position: any, marketLiquidityData: any, request: any): Promise<{
        positionId: any;
        securityId: any;
        symbol: any;
        marketValue: any;
        liquidityCategory: RiskManagement_1.LiquidityCategory;
        daysToLiquidate: number;
        liquidationCost: number;
        marketImpact: number;
        averageDailyVolume: any;
        bidAskSpread: any;
        marketCapitalization: any;
        floatPercentage: any;
    }>;
    determineLiquidityCategory(daysToLiquidate: any, averageDailyVolume: any, bidAskSpread: any, assetClass: any): Promise<RiskManagement_1.LiquidityCategory>;
    getLiquidityThresholds(assetClass: any): any;
    calculateLiquidationCost(marketValue: any, averageDailyVolume: any, bidAskSpread: any, daysToLiquidate: any, marketImpactModel: any): Promise<number>;
    calculateOverallLiquidityScore(positionLiquidity: any): Promise<number>;
    getPositionLiquidityScore(position: any): number;
    calculateAverageDaysToLiquidate(positionLiquidity: any): Promise<number>;
    calculateTotalLiquidationCost(positionLiquidity: any): Promise<any>;
    calculateTotalMarketImpact(positionLiquidity: any): Promise<number>;
    calculateLiquidityByCategory(portfolioData: any, positionLiquidity: any, category: any): Promise<{
        category: any;
        percentage: number;
        liquidityCategory: RiskManagement_1.LiquidityCategory;
        averageDaysToLiquidate: number;
        estimatedCost: any;
    }[]>;
    calculateLiquidityBySize(portfolioData: any, positionLiquidity: any): Promise<{
        category: string;
        percentage: number;
        liquidityCategory: RiskManagement_1.LiquidityCategory;
        averageDaysToLiquidate: number;
        estimatedCost: any;
    }[]>;
    performLiquidityStressTesting(portfolioData: any, positionLiquidity: any, request: any): Promise<{
        stressScenario: string;
        liquidityScore: number;
        averageDaysToLiquidate: number;
        totalLiquidationCost: any;
        marketImpact: number;
    }[]>;
    applyLiquidityStress(positionLiquidity: any, stressScenario: any, request: any): Promise<any>;
    getPortfolioData(portfolioId: any, asOfDate: any): Promise<{
        positionId: string;
        securityId: string;
        symbol: string;
        marketValue: number;
        assetClass: string;
        sector: string;
    }[]>;
    getMarketLiquidityData(portfolioData: any, asOfDate: any): Promise<{
        AAPL: {
            averageDailyVolume: number;
            bidAskSpread: number;
            currentPrice: number;
            marketCapitalization: number;
            floatPercentage: number;
        };
        GOOGL: {
            averageDailyVolume: number;
            bidAskSpread: number;
            currentPrice: number;
            marketCapitalization: number;
            floatPercentage: number;
        };
        BND: {
            averageDailyVolume: number;
            bidAskSpread: number;
            currentPrice: number;
            marketCapitalization: any;
            floatPercentage: number;
        };
        VNQ: {
            averageDailyVolume: number;
            bidAskSpread: number;
            currentPrice: number;
            marketCapitalization: any;
            floatPercentage: number;
        };
    }>;
    estimateAverageDailyVolume(position: any): Promise<any>;
    estimateBidAskSpread(position: any): Promise<any>;
    storeLiquidityRiskResult(result: any): Promise<void>;
    publishLiquidityRiskEvent(eventType: any, result: any): Promise<void>;
}
import RiskManagement_1 = require("../../models/riskManagement/RiskManagement");

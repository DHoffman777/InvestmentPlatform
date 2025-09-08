export const __esModule: boolean;
export class DrillDownService {
    constructor(eventPublisher: any);
    eventPublisher: any;
    hierarchies: Map<Analytics_1.AnalyticsMetricType, {
        level: Analytics_1.DrillDownLevel;
        children: Analytics_1.DrillDownLevel[];
        parentPath: Analytics_1.DrillDownLevel[];
    }[]>;
    performDrillDown(request: any, context: any): Promise<{
        level: any;
        data: {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                id: any;
                type: string;
                totalValue: number;
                performance: string;
                riskScore: string;
                assetCount: number;
                drillDownAvailable: boolean;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                id: string;
                type: string;
                allocation: string;
                riskLevel: string;
                performance: string;
                volatility: string;
                drillDownAvailable: boolean;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                id: string;
                type: string;
                allocation: string;
                performance: string;
                beta: string;
                marketCap: any;
                companyCount: number;
                drillDownAvailable: boolean;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                id: string;
                type: string;
                allocation: string;
                performance: string;
                peRatio: string;
                growthRate: string;
                companyCount: number;
                drillDownAvailable: boolean;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                id: string;
                type: string;
                symbol: string;
                name: string;
                shares: number;
                price: string;
                marketValue: string;
                allocation: string;
                performance: string;
                beta: string;
                peRatio: string;
                dividendYield: string;
                drillDownAvailable: boolean;
            };
        }[] | {
            timestamp: Date;
            value: any;
            label: string;
            metadata: {
                id: string;
                type: string;
                quantity: number;
                averageCost: string;
                currentPrice: string;
                unrealizedGainLoss: string;
                unrealizedGainLossPercent: string;
                acquisitionDate: Date;
                taxLot: string;
                drillDownAvailable: boolean;
            };
        }[];
        breadcrumb: {
            level: any;
            label: any;
            value: any;
        }[];
        availableLevels: Analytics_1.DrillDownLevel[];
    }>;
    generateInteractiveDrillDown(metricType: any, currentLevel: any, parentValue: any, context: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: any;
            type: string;
            totalValue: number;
            performance: string;
            riskScore: string;
            assetCount: number;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            riskLevel: string;
            performance: string;
            volatility: string;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            performance: string;
            beta: string;
            marketCap: any;
            companyCount: number;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            performance: string;
            peRatio: string;
            growthRate: string;
            companyCount: number;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            symbol: string;
            name: string;
            shares: number;
            price: string;
            marketValue: string;
            allocation: string;
            performance: string;
            beta: string;
            peRatio: string;
            dividendYield: string;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: any;
        label: string;
        metadata: {
            id: string;
            type: string;
            quantity: number;
            averageCost: string;
            currentPrice: string;
            unrealizedGainLoss: string;
            unrealizedGainLossPercent: string;
            acquisitionDate: Date;
            taxLot: string;
            drillDownAvailable: boolean;
        };
    }[]>;
    generateDrillDownData(metricType: any, level: any, parentDataPoint: any, context: any, filters: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: any;
            type: string;
            totalValue: number;
            performance: string;
            riskScore: string;
            assetCount: number;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            riskLevel: string;
            performance: string;
            volatility: string;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            performance: string;
            beta: string;
            marketCap: any;
            companyCount: number;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            performance: string;
            peRatio: string;
            growthRate: string;
            companyCount: number;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            symbol: string;
            name: string;
            shares: number;
            price: string;
            marketValue: string;
            allocation: string;
            performance: string;
            beta: string;
            peRatio: string;
            dividendYield: string;
            drillDownAvailable: boolean;
        };
    }[] | {
        timestamp: Date;
        value: any;
        label: string;
        metadata: {
            id: string;
            type: string;
            quantity: number;
            averageCost: string;
            currentPrice: string;
            unrealizedGainLoss: string;
            unrealizedGainLossPercent: string;
            acquisitionDate: Date;
            taxLot: string;
            drillDownAvailable: boolean;
        };
    }[]>;
    generatePortfolioDrillDown(metricType: any, context: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: any;
            type: string;
            totalValue: number;
            performance: string;
            riskScore: string;
            assetCount: number;
            drillDownAvailable: boolean;
        };
    }[]>;
    generateAssetClassDrillDown(metricType: any, parentValue: any, context: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            riskLevel: string;
            performance: string;
            volatility: string;
            drillDownAvailable: boolean;
        };
    }[]>;
    generateSectorDrillDown(metricType: any, parentValue: any, context: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            performance: string;
            beta: string;
            marketCap: any;
            companyCount: number;
            drillDownAvailable: boolean;
        };
    }[]>;
    generateIndustryDrillDown(metricType: any, parentValue: any, context: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            allocation: string;
            performance: string;
            peRatio: string;
            growthRate: string;
            companyCount: number;
            drillDownAvailable: boolean;
        };
    }[]>;
    generateSecurityDrillDown(metricType: any, parentValue: any, context: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            id: string;
            type: string;
            symbol: string;
            name: string;
            shares: number;
            price: string;
            marketValue: string;
            allocation: string;
            performance: string;
            beta: string;
            peRatio: string;
            dividendYield: string;
            drillDownAvailable: boolean;
        };
    }[]>;
    generatePositionDrillDown(metricType: any, parentValue: any, context: any): Promise<{
        timestamp: Date;
        value: any;
        label: string;
        metadata: {
            id: string;
            type: string;
            quantity: number;
            averageCost: string;
            currentPrice: string;
            unrealizedGainLoss: string;
            unrealizedGainLossPercent: string;
            acquisitionDate: Date;
            taxLot: string;
            drillDownAvailable: boolean;
        };
    }[]>;
    generateBreadcrumb(metricType: any, currentLevel: any, dataPoint: any): {
        level: any;
        label: any;
        value: any;
    }[];
    getAvailableLevels(metricType: any, currentLevel: any): Analytics_1.DrillDownLevel[];
    getLevelDisplayName(level: any): any;
    formatMarketCap(value: any): any;
    getVisualization(visualizationId: any): Promise<{
        id: any;
        metricType: Analytics_1.AnalyticsMetricType;
        data: {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                id: string;
            };
        }[];
    }>;
    validateDrillDownLevel(metricType: any, level: any, currentPath: any): boolean;
    getBreadcrumbNavigation(visualizationId: any, currentLevel: any, dataPointId: any): Promise<{
        level: any;
        label: any;
        value: any;
    }[]>;
    getMaxDrillDepth(metricType: any): number;
}
import Analytics_1 = require("../../models/analytics/Analytics");

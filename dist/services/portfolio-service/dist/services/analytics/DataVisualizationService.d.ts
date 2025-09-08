export const __esModule: boolean;
export class DataVisualizationService {
    constructor(eventPublisher: any);
    eventPublisher: any;
    colorSchemes: {
        primary: string[];
        performance: string[];
        risk: string[];
        allocation: string[];
    };
    createVisualization(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        title: any;
        description: string;
        type: any;
        metricType: any;
        data: {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                return: string;
                volatility: string;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                percentage: string;
                color: string;
                absoluteValue: number;
            };
            drillDownData: any;
        }[] | ({
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                unit: string;
                period: string;
                confidence: string;
                method: string;
                calculation?: undefined;
                benchmark?: undefined;
                correlation?: undefined;
                riskFreeRate?: undefined;
            };
        } | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                unit: string;
                period: string;
                calculation: string;
                confidence?: undefined;
                method?: undefined;
                benchmark?: undefined;
                correlation?: undefined;
                riskFreeRate?: undefined;
            };
        } | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                benchmark: string;
                correlation: string;
                unit?: undefined;
                period?: undefined;
                confidence?: undefined;
                method?: undefined;
                calculation?: undefined;
                riskFreeRate?: undefined;
            };
        } | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                riskFreeRate: string;
                period: string;
                unit?: undefined;
                confidence?: undefined;
                method?: undefined;
                calculation?: undefined;
                benchmark?: undefined;
                correlation?: undefined;
            };
        })[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                percentage: string;
                performance: string;
                weight: string;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                asset1: string;
                asset2: string;
                correlation: string;
                significance: string;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                contribution: string;
                type: string;
            };
        }[];
        configuration: {
            showLegend: boolean;
            showTooltip: boolean;
            interactive: boolean;
            drillDownEnabled: boolean;
            aggregationPeriod: Analytics_1.AggregationPeriod;
        };
        filters: any;
        dimensions: {
            id: string;
            name: string;
            field: string;
            type: string;
            aggregationMethods: string[];
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateVisualization(visualizationId: any, updates: any): Promise<any>;
    refreshVisualizationData(visualizationId: any, tenantId: any): Promise<any>;
    performDrillDown(request: any): Promise<{
        level: any;
        data: {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                parentLabel: any;
                weight: string;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                parentLabel: any;
                allocation: string;
            };
        }[] | {
            timestamp: Date;
            value: number;
            label: string;
            metadata: {
                parentLabel: any;
                shares: number;
                price: string;
            };
        }[];
        breadcrumb: {
            level: any;
            label: any;
            value: any;
        }[];
        availableLevels: any;
    }>;
    generateVisualizationData(request: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            return: string;
            volatility: string;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            percentage: string;
            color: string;
            absoluteValue: number;
        };
        drillDownData: any;
    }[] | ({
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            unit: string;
            period: string;
            confidence: string;
            method: string;
            calculation?: undefined;
            benchmark?: undefined;
            correlation?: undefined;
            riskFreeRate?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            unit: string;
            period: string;
            calculation: string;
            confidence?: undefined;
            method?: undefined;
            benchmark?: undefined;
            correlation?: undefined;
            riskFreeRate?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            benchmark: string;
            correlation: string;
            unit?: undefined;
            period?: undefined;
            confidence?: undefined;
            method?: undefined;
            calculation?: undefined;
            riskFreeRate?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            riskFreeRate: string;
            period: string;
            unit?: undefined;
            confidence?: undefined;
            method?: undefined;
            calculation?: undefined;
            benchmark?: undefined;
            correlation?: undefined;
        };
    })[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            percentage: string;
            performance: string;
            weight: string;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            asset1: string;
            asset2: string;
            correlation: string;
            significance: string;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            contribution: string;
            type: string;
        };
    }[]>;
    generatePerformanceData(request: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            return: string;
            volatility: string;
        };
    }[]>;
    generateAssetAllocationData(request: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            percentage: string;
            color: string;
            absoluteValue: number;
        };
        drillDownData: any;
    }[]>;
    generateRiskMetricsData(request: any): Promise<({
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            unit: string;
            period: string;
            confidence: string;
            method: string;
            calculation?: undefined;
            benchmark?: undefined;
            correlation?: undefined;
            riskFreeRate?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            unit: string;
            period: string;
            calculation: string;
            confidence?: undefined;
            method?: undefined;
            benchmark?: undefined;
            correlation?: undefined;
            riskFreeRate?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            benchmark: string;
            correlation: string;
            unit?: undefined;
            period?: undefined;
            confidence?: undefined;
            method?: undefined;
            calculation?: undefined;
            riskFreeRate?: undefined;
        };
    } | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            riskFreeRate: string;
            period: string;
            unit?: undefined;
            confidence?: undefined;
            method?: undefined;
            calculation?: undefined;
            benchmark?: undefined;
            correlation?: undefined;
        };
    })[]>;
    generateSectorAnalysisData(request: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            percentage: string;
            performance: string;
            weight: string;
        };
    }[]>;
    generateCorrelationData(request: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            asset1: string;
            asset2: string;
            correlation: string;
            significance: string;
        };
    }[]>;
    generateAttributionData(request: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            contribution: string;
            type: string;
        };
    }[]>;
    generateConfiguration(visualizationType: any, metricType: any): {
        showLegend: boolean;
        showTooltip: boolean;
        interactive: boolean;
        drillDownEnabled: boolean;
        aggregationPeriod: Analytics_1.AggregationPeriod;
    };
    generateDimensions(metricType: any): {
        id: string;
        name: string;
        field: string;
        type: string;
        aggregationMethods: string[];
    }[];
    generateAllocationDrillDown(assetClass: any): any;
    generateDrillDownData(metricType: any, level: any, parentDataPoint: any, filters: any): Promise<{
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            parentLabel: any;
            weight: string;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            parentLabel: any;
            allocation: string;
        };
    }[] | {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            parentLabel: any;
            shares: number;
            price: string;
        };
    }[]>;
    generateAssetClassDrillDown(parentDataPoint: any): {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            parentLabel: any;
            weight: string;
        };
    }[];
    generateSectorDrillDown(parentDataPoint: any): {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            parentLabel: any;
            allocation: string;
        };
    }[];
    generateSecurityDrillDown(parentDataPoint: any): {
        timestamp: Date;
        value: number;
        label: string;
        metadata: {
            parentLabel: any;
            shares: number;
            price: string;
        };
    }[];
    generateTitle(metricType: any, visualizationType: any): any;
    generateDescription(metricType: any, visualizationType: any): string;
    generateBreadcrumb(level: any, dataPoint: any): {
        level: any;
        label: any;
        value: any;
    }[];
    getAvailableDrillDownLevels(metricType: any, currentLevel: any): any;
    getColorScheme(metricType: any): string[];
    getYAxisLabel(metricType: any): "Value" | "Value ($)" | "Allocation (%)" | "Risk Value";
    getYAxisFormat(metricType: any): "$,.0f" | ".1%" | ".2f";
    extractDateRangeFromFilters(filters: any): {
        startDate: Date;
        endDate: Date;
    };
    getPeriodFromDays(days: any): Analytics_1.AggregationPeriod.DAILY | Analytics_1.AggregationPeriod.WEEKLY | Analytics_1.AggregationPeriod.MONTHLY | Analytics_1.AggregationPeriod.QUARTERLY;
    getStepSize(period: any): 90 | 7 | 1 | 30;
    getVisualization(visualizationId: any): Promise<any>;
    saveVisualization(visualization: any): Promise<void>;
}
import Analytics_1 = require("../../models/analytics/Analytics");

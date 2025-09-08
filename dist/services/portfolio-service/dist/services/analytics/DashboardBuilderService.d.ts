export const __esModule: boolean;
export class DashboardBuilderService {
    constructor(eventPublisher: any);
    eventPublisher: any;
    defaultTemplates: ({
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                timeframe: string;
                showBenchmark: boolean;
                chartType?: undefined;
                showTargets?: undefined;
                metric?: undefined;
                threshold?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                chartType: string;
                showTargets: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                metric?: undefined;
                threshold?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                metric: string;
                threshold: number;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                drillDownEnabled: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                metric?: undefined;
                threshold?: undefined;
            };
        })[];
        filters: any[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    } | {
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                timeframe: string;
                showBenchmark: boolean;
                showDrawdown: boolean;
                period?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                period: string;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                showTargets: boolean;
                showDrift: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                period?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                xAxis: string;
                yAxis: string;
                bubbleSize: string;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                period?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
            };
        })[];
        filters: {
            id: string;
            name: string;
            type: string;
            field: string;
            operator: string;
            value: {
                startDate: Date;
                endDate: Date;
            };
            displayName: string;
        }[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    } | {
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                metric: string;
                confidence: number;
                timeframe: string;
                showLimits?: undefined;
                alertThreshold?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                showLimits: boolean;
                alertThreshold: number;
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                period: string;
                clusterAnalysis: boolean;
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                showLimits?: undefined;
                alertThreshold?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                buckets: string[];
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                showLimits?: undefined;
                alertThreshold?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
            };
        })[];
        filters: any[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    })[];
    createDashboard(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        name: any;
        description: any;
        isDefault: any;
        isTemplate: boolean;
        visualizations: any;
        layout: any;
        filters: any;
        refreshInterval: number;
        createdBy: any;
        sharedWith: any[];
        permissions: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateDashboard(dashboardId: any, updates: any, userId: any): Promise<any>;
    addVisualizationToDashboard(dashboardId: any, visualization: any, userId: any): Promise<any>;
    removeVisualizationFromDashboard(dashboardId: any, visualizationId: any, userId: any): Promise<any>;
    cloneDashboard(dashboardId: any, newName: any, tenantId: any, userId: any): Promise<any>;
    shareDashboard(dashboardId: any, shareWithUserIds: any, permissions: any, sharedBy: any): Promise<any>;
    getAvailableTemplates(category: any): Promise<({
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                timeframe: string;
                showBenchmark: boolean;
                chartType?: undefined;
                showTargets?: undefined;
                metric?: undefined;
                threshold?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                chartType: string;
                showTargets: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                metric?: undefined;
                threshold?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                metric: string;
                threshold: number;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                drillDownEnabled: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                metric?: undefined;
                threshold?: undefined;
            };
        })[];
        filters: any[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    } | {
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                timeframe: string;
                showBenchmark: boolean;
                showDrawdown: boolean;
                period?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                period: string;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                showTargets: boolean;
                showDrift: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                period?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                xAxis: string;
                yAxis: string;
                bubbleSize: string;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                period?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
            };
        })[];
        filters: {
            id: string;
            name: string;
            type: string;
            field: string;
            operator: string;
            value: {
                startDate: Date;
                endDate: Date;
            };
            displayName: string;
        }[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    } | {
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                metric: string;
                confidence: number;
                timeframe: string;
                showLimits?: undefined;
                alertThreshold?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                showLimits: boolean;
                alertThreshold: number;
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                period: string;
                clusterAnalysis: boolean;
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                showLimits?: undefined;
                alertThreshold?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                buckets: string[];
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                showLimits?: undefined;
                alertThreshold?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
            };
        })[];
        filters: any[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    })[]>;
    createTemplate(dashboardId: any, templateData: any, createdBy: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        name: any;
        description: any;
        category: any;
        tags: any;
        layout: any;
        visualizations: any;
        filters: any;
        isPublic: any;
        usageCount: number;
        rating: number;
        createdBy: any;
        createdAt: Date;
    }>;
    validateDashboardLayout(layout: any): Promise<boolean>;
    validateVisualizationPosition(position: any, layout: any): Promise<boolean>;
    applyTemplate(template: any, request: any): Promise<{
        layout: any;
        visualizations: any;
        filters: any[];
    }>;
    createFromScratch(request: any): Promise<{
        layout: any;
        visualizations: any;
        filters: any;
    }>;
    getTemplate(templateId: any): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                timeframe: string;
                showBenchmark: boolean;
                chartType?: undefined;
                showTargets?: undefined;
                metric?: undefined;
                threshold?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                chartType: string;
                showTargets: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                metric?: undefined;
                threshold?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                metric: string;
                threshold: number;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                drillDownEnabled?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                drillDownEnabled: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                metric?: undefined;
                threshold?: undefined;
            };
        })[];
        filters: any[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    } | {
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                timeframe: string;
                showBenchmark: boolean;
                showDrawdown: boolean;
                period?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                period: string;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                showTargets: boolean;
                showDrift: boolean;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                period?: undefined;
                xAxis?: undefined;
                yAxis?: undefined;
                bubbleSize?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                xAxis: string;
                yAxis: string;
                bubbleSize: string;
                timeframe?: undefined;
                showBenchmark?: undefined;
                showDrawdown?: undefined;
                period?: undefined;
                showTargets?: undefined;
                showDrift?: undefined;
            };
        })[];
        filters: {
            id: string;
            name: string;
            type: string;
            field: string;
            operator: string;
            value: {
                startDate: Date;
                endDate: Date;
            };
            displayName: string;
        }[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    } | {
        id: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        visualizations: ({
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                metric: string;
                confidence: number;
                timeframe: string;
                showLimits?: undefined;
                alertThreshold?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                showLimits: boolean;
                alertThreshold: number;
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                period: string;
                clusterAnalysis: boolean;
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                showLimits?: undefined;
                alertThreshold?: undefined;
                buckets?: undefined;
            };
        } | {
            metricType: Analytics_1.AnalyticsMetricType;
            visualizationType: Analytics_1.VisualizationType;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            title: string;
            configuration: {
                buckets: string[];
                metric?: undefined;
                confidence?: undefined;
                timeframe?: undefined;
                showLimits?: undefined;
                alertThreshold?: undefined;
                period?: undefined;
                clusterAnalysis?: undefined;
            };
        })[];
        filters: any[];
        isPublic: boolean;
        usageCount: number;
        rating: number;
        createdBy: string;
        createdAt: Date;
    }>;
    getDashboard(dashboardId: any): Promise<any>;
    saveDashboard(dashboard: any): Promise<void>;
    saveTemplate(template: any): Promise<void>;
    getUserDashboards(tenantId: any, userId: any, options: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        name: string;
        description: string;
        isDefault: boolean;
        isTemplate: boolean;
        visualizations: any[];
        layout: {
            rows: number;
            columns: number;
            gridSize: number;
        };
        filters: any[];
        refreshInterval: number;
        createdBy: any;
        sharedWith: any[];
        permissions: {
            canEdit: boolean;
            canShare: boolean;
            canDelete: boolean;
        };
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
import Analytics_1 = require("../../models/analytics/Analytics");

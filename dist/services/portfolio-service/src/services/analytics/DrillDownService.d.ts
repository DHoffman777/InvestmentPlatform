import { AnalyticsDataPoint, DrillDownLevel, DrillDownRequest, DrillDownResponse, AnalyticsMetricType } from '../../models/analytics/Analytics';
interface DrillDownContext {
    tenantId: string;
    portfolioIds?: string[];
    clientIds?: string[];
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
}
export declare class DrillDownService {
    private eventPublisher;
    private hierarchies;
    constructor();
    performDrillDown(request: DrillDownRequest, context: DrillDownContext): Promise<DrillDownResponse>;
    generateInteractiveDrillDown(metricType: AnalyticsMetricType, currentLevel: DrillDownLevel, parentValue: any, context: DrillDownContext): Promise<AnalyticsDataPoint[]>;
    private generateDrillDownData;
    private generatePortfolioDrillDown;
    private generateAssetClassDrillDown;
    private generateSectorDrillDown;
    private generateIndustryDrillDown;
    private generateSecurityDrillDown;
    private generatePositionDrillDown;
    private generateBreadcrumb;
    private getAvailableLevels;
    private getLevelDisplayName;
    private formatMarketCap;
    getVisualization(visualizationId: string): Promise<any>;
    validateDrillDownLevel(metricType: AnalyticsMetricType, level: DrillDownLevel, currentPath: DrillDownLevel[]): boolean;
    getMaxDrillDepth(metricType: AnalyticsMetricType): number;
}
export {};

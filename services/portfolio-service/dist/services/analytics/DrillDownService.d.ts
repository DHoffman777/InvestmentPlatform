import { AnalyticsDataPoint, DrillDownLevel, DrillDownRequest, DrillDownResponse, AnalyticsMetricType } from '../../models/analytics/Analytics';
import { EventPublisher } from '../../utils/eventPublisher';
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
    constructor(eventPublisher?: EventPublisher);
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
    getBreadcrumbNavigation(visualizationId: string, currentLevel: DrillDownLevel, dataPointId: string): Promise<DrillDownResponse['breadcrumb']>;
    getMaxDrillDepth(metricType: AnalyticsMetricType): number;
}
export {};

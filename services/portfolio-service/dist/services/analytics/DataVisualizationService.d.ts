import { AnalyticsVisualization, VisualizationType, AnalyticsMetricType, AggregationPeriod, DrillDownLevel, AnalyticsFilter, DrillDownRequest, DrillDownResponse } from '../../models/analytics/Analytics';
interface VisualizationRequest {
    tenantId: string;
    metricType: AnalyticsMetricType;
    visualizationType: VisualizationType;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    portfolioIds?: string[];
    clientIds?: string[];
    filters?: AnalyticsFilter[];
    aggregationPeriod?: AggregationPeriod;
    drillDownLevel?: DrillDownLevel;
}
export declare class DataVisualizationService {
    private eventPublisher;
    private colorSchemes;
    constructor();
    createVisualization(request: VisualizationRequest): Promise<AnalyticsVisualization>;
    updateVisualization(visualizationId: string, updates: Partial<AnalyticsVisualization>): Promise<AnalyticsVisualization>;
    refreshVisualizationData(visualizationId: string, tenantId: string): Promise<AnalyticsVisualization>;
    performDrillDown(request: DrillDownRequest): Promise<DrillDownResponse>;
    private generateVisualizationData;
    private generatePerformanceData;
    private generateAssetAllocationData;
    private generateRiskMetricsData;
    private generateSectorAnalysisData;
    private generateCorrelationData;
    private generateAttributionData;
    private generateConfiguration;
    private generateDimensions;
    private generateAllocationDrillDown;
    private generateDrillDownData;
    private generateAssetClassDrillDown;
    private generateSectorDrillDown;
    private generateSecurityDrillDown;
    private generateTitle;
    private generateDescription;
    private generateBreadcrumb;
    private getAvailableDrillDownLevels;
    private getColorScheme;
    private getYAxisLabel;
    private getYAxisFormat;
    private extractDateRangeFromFilters;
    private getPeriodFromDays;
    private getStepSize;
    private getVisualization;
    private saveVisualization;
}
export {};

import { AnalyticsDashboard, AnalyticsDashboardVisualization, AnalyticsFilter, VisualizationType, AnalyticsMetricType } from '../../models/analytics/Analytics';
interface DashboardTemplate {
    id: string;
    name: string;
    description: string;
    category: 'executive' | 'portfolio_manager' | 'risk_analyst' | 'client_facing' | 'compliance';
    tags: string[];
    layout: AnalyticsDashboard['layout'];
    visualizations: DashboardVisualizationTemplate[];
    filters: AnalyticsFilter[];
    isPublic: boolean;
    usageCount: number;
    rating: number;
    createdBy: string;
    createdAt: Date;
}
interface DashboardVisualizationTemplate {
    metricType: AnalyticsMetricType;
    visualizationType: VisualizationType;
    position: {
        row: number;
        column: number;
        width: number;
        height: number;
    };
    title: string;
    configuration: any;
    filters?: AnalyticsFilter[];
}
interface DashboardCreationRequest {
    tenantId: string;
    name: string;
    description?: string;
    templateId?: string;
    layout?: {
        rows: number;
        columns: number;
        gridSize: number;
    };
    visualizations?: DashboardVisualizationTemplate[];
    filters?: AnalyticsFilter[];
    isDefault?: boolean;
    permissions?: {
        canEdit: boolean;
        canShare: boolean;
        canDelete: boolean;
    };
    createdBy: string;
}
interface DashboardUpdateRequest {
    name?: string;
    description?: string;
    layout?: Partial<AnalyticsDashboard['layout']>;
    visualizations?: AnalyticsDashboardVisualization[];
    filters?: AnalyticsFilter[];
    permissions?: Partial<AnalyticsDashboard['permissions']>;
}
export declare class DashboardBuilderService {
    private eventPublisher;
    private defaultTemplates;
    constructor();
    createDashboard(request: DashboardCreationRequest): Promise<AnalyticsDashboard>;
    updateDashboard(dashboardId: string, updates: DashboardUpdateRequest, userId: string): Promise<AnalyticsDashboard>;
    addVisualizationToDashboard(dashboardId: string, visualization: DashboardVisualizationTemplate, userId: string): Promise<AnalyticsDashboard>;
    removeVisualizationFromDashboard(dashboardId: string, visualizationId: string, userId: string): Promise<AnalyticsDashboard>;
    cloneDashboard(dashboardId: string, newName: string, tenantId: string, userId: string): Promise<AnalyticsDashboard>;
    shareDashboard(dashboardId: string, shareWithUserIds: string[], permissions: {
        canEdit: boolean;
        canShare: boolean;
    }, sharedBy: string): Promise<AnalyticsDashboard>;
    getAvailableTemplates(category?: string): Promise<DashboardTemplate[]>;
    createTemplate(dashboardId: string, templateData: {
        name: string;
        description: string;
        category: DashboardTemplate['category'];
        tags: string[];
        isPublic: boolean;
    }, createdBy: string): Promise<DashboardTemplate>;
    validateDashboardLayout(layout: AnalyticsDashboard['layout']): Promise<boolean>;
    validateVisualizationPosition(position: AnalyticsDashboardVisualization['position'], layout: AnalyticsDashboard['layout']): Promise<boolean>;
    private applyTemplate;
    private createFromScratch;
    private getTemplate;
    private getDashboard;
    private saveDashboard;
    private saveTemplate;
}
export {};

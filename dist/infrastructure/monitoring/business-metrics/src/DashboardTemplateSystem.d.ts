import { EventEmitter } from 'events';
import { DashboardTemplate, DashboardWidget, WidgetDataSource } from './BusinessMetricsDataModel';
export interface TemplateEngine {
    id: string;
    name: string;
    version: string;
    supportedWidgetTypes: string[];
    supportedChartTypes: string[];
    customizationOptions: TemplateCustomization[];
}
export interface TemplateCustomization {
    type: 'color' | 'layout' | 'branding' | 'content' | 'permissions' | 'filters';
    name: string;
    description: string;
    options: CustomizationOption[];
    isRequired: boolean;
    defaultValue?: any;
}
export interface CustomizationOption {
    label: string;
    value: any;
    description?: string;
    preview?: string;
}
export interface DashboardTheme {
    id: string;
    name: string;
    description: string;
    colors: ThemeColors;
    typography: ThemeTypography;
    spacing: ThemeSpacing;
    components: ThemeComponents;
}
export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    success: string;
    warning: string;
    error: string;
    info: string;
}
export interface ThemeTypography {
    fontFamily: string;
    headingScale: number[];
    bodySize: number;
    fontWeights: Record<string, number>;
}
export interface ThemeSpacing {
    unit: number;
    scales: number[];
}
export interface ThemeComponents {
    card: ComponentTheme;
    chart: ComponentTheme;
    table: ComponentTheme;
    button: ComponentTheme;
}
export interface ComponentTheme {
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    shadow?: string;
    padding?: number[];
    margin?: number[];
    customStyles?: Record<string, any>;
}
export interface TemplateValidationResult {
    isValid: boolean;
    errors: TemplateValidationError[];
    warnings: TemplateValidationWarning[];
    performance: TemplatePerformanceMetrics;
}
export interface TemplateValidationError {
    type: 'configuration' | 'data' | 'permissions' | 'performance' | 'compatibility';
    field: string;
    message: string;
    severity: 'error' | 'warning';
    context?: Record<string, any>;
}
export interface TemplateValidationWarning {
    type: string;
    message: string;
    suggestion?: string;
}
export interface TemplatePerformanceMetrics {
    expectedLoadTime: number;
    memoryUsage: number;
    networkRequests: number;
    cacheEfficiency: number;
    complexity: number;
}
export interface DashboardInstance {
    id: string;
    templateId: string;
    tenantId: string;
    userId: string;
    name: string;
    customizations: Record<string, any>;
    personalizations: DashboardPersonalization[];
    shareSettings: DashboardShareSettings;
    viewHistory: DashboardView[];
    lastViewed: Date;
    lastModified: Date;
    isPublished: boolean;
    version: number;
}
export interface DashboardPersonalization {
    type: 'widget_position' | 'widget_size' | 'widget_config' | 'filter_defaults' | 'theme';
    configuration: Record<string, any>;
    appliedBy: string;
    appliedAt: Date;
}
export interface DashboardShareSettings {
    isPublic: boolean;
    sharedWith: DashboardSharedUser[];
    accessUrl?: string;
    embedCode?: string;
    expiresAt?: Date;
}
export interface DashboardSharedUser {
    userId: string;
    permission: 'view' | 'edit' | 'admin';
    sharedAt: Date;
    sharedBy: string;
}
export interface DashboardView {
    userId: string;
    timestamp: Date;
    duration: number;
    interactions: ViewInteraction[];
    device: string;
    browser: string;
}
export interface ViewInteraction {
    type: 'widget_click' | 'filter_change' | 'drill_down' | 'export' | 'share';
    widgetId?: string;
    timestamp: Date;
    details: Record<string, any>;
}
export declare class DashboardTemplateSystem extends EventEmitter {
    private templates;
    private instances;
    private themes;
    private engines;
    private metricDefinitions;
    private businessKPIs;
    constructor();
    createTemplate(template: Partial<DashboardTemplate>): Promise<DashboardTemplate>;
    updateTemplate(templateId: string, updates: Partial<DashboardTemplate>): Promise<DashboardTemplate>;
    deleteTemplate(templateId: string): Promise<void>;
    cloneTemplate(templateId: string, newName: string, tenantId: string, userId: string): Promise<DashboardTemplate>;
    createDashboardInstance(templateId: string, tenantId: string, userId: string, name: string, customizations?: Record<string, any>): Promise<DashboardInstance>;
    renderDashboard(instanceId: string, userId: string): Promise<RenderedDashboard>;
    renderWidget(widget: DashboardWidget, instance: DashboardInstance, userId: string): Promise<RenderedWidget>;
    private renderFilter;
    fetchWidgetData(dataSource: WidgetDataSource, instance: DashboardInstance): Promise<any>;
    private fetchMetricData;
    private generateMockMetricData;
    private executeQuery;
    private fetchAPIData;
    validateTemplate(template: DashboardTemplate): Promise<TemplateValidationResult>;
    private calculatePerformanceMetrics;
    private isValidPosition;
    private getWidgetPersonalization;
    private getFilterPersonalization;
    private getEffectiveTheme;
    private getEffectivePermissions;
    private recordDashboardView;
    private initializeDefaultThemes;
    private initializeDefaultEngines;
    private initializeDefaultTemplates;
    private getDefaultLayout;
    private generateId;
    getTemplate(templateId: string): DashboardTemplate | null;
    getTemplates(tenantId?: string, category?: string): DashboardTemplate[];
    getDashboardInstance(instanceId: string): DashboardInstance | null;
    getDashboardInstances(tenantId: string, userId?: string): DashboardInstance[];
    getThemes(): DashboardTheme[];
}
export interface RenderedDashboard {
    instanceId: string;
    templateId: string;
    name: string;
    layout: any;
    widgets: RenderedWidget[];
    filters: RenderedFilter[];
    theme: DashboardTheme;
    permissions: string[];
    metadata: {
        lastModified: Date;
        version: number;
        viewCount: number;
    };
}
export interface RenderedWidget {
    id: string;
    type: string;
    title: string;
    position: any;
    size: any;
    configuration: any;
    data: any;
    isVisible: boolean;
    refreshInterval: number;
    lastUpdated: Date;
    permissions: string[];
}
export interface RenderedFilter {
    id: string;
    name: string;
    type: string;
    field: string;
    options: any[];
    value: any;
    isRequired: boolean;
    isVisible: boolean;
    dependsOn: string[];
}

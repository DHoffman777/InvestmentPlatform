import { EventEmitter } from 'events';
import {
  DashboardTemplate,
  DashboardWidget,
  DashboardFilter,
  WidgetConfiguration,
  WidgetDataSource,
  MetricDefinition,
  BusinessKPI
} from './BusinessMetricsDataModel';

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

export class DashboardTemplateSystem extends EventEmitter {
  private templates: Map<string, DashboardTemplate> = new Map();
  private instances: Map<string, DashboardInstance> = new Map();
  private themes: Map<string, DashboardTheme> = new Map();
  private engines: Map<string, TemplateEngine> = new Map();
  private metricDefinitions: Map<string, MetricDefinition> = new Map();
  private businessKPIs: Map<string, BusinessKPI> = new Map();

  constructor() {
    super();
    this.initializeDefaultThemes();
    this.initializeDefaultEngines();
    this.initializeDefaultTemplates();
  }

  async createTemplate(template: Partial<DashboardTemplate>): Promise<DashboardTemplate> {
    const newTemplate: DashboardTemplate = {
      id: template.id || this.generateId(),
      tenantId: template.tenantId!,
      name: template.name!,
      description: template.description || '',
      category: template.category || 'custom',
      type: template.type || 'analytical',
      layout: template.layout || this.getDefaultLayout(),
      widgets: template.widgets || [],
      filters: template.filters || [],
      permissions: template.permissions || [],
      isPublic: template.isPublic || false,
      isDefault: template.isDefault || false,
      tags: template.tags || [],
      createdBy: template.createdBy!,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validation = await this.validateTemplate(newTemplate);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.templates.set(newTemplate.id, newTemplate);
    this.emit('templateCreated', { templateId: newTemplate.id });
    
    return newTemplate;
  }

  async updateTemplate(templateId: string, updates: Partial<DashboardTemplate>): Promise<DashboardTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    const validation = await this.validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.templates.set(templateId, updatedTemplate);
    this.emit('templateUpdated', { templateId });
    
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const dependentInstances = Array.from(this.instances.values())
      .filter(instance => instance.templateId === templateId);

    if (dependentInstances.length > 0) {
      throw new Error(`Cannot delete template: ${dependentInstances.length} dashboard instances depend on it`);
    }

    this.templates.delete(templateId);
    this.emit('templateDeleted', { templateId });
  }

  async cloneTemplate(templateId: string, newName: string, tenantId: string, userId: string): Promise<DashboardTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const clonedTemplate: DashboardTemplate = {
      ...template,
      id: this.generateId(),
      name: newName,
      tenantId,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
      isPublic: false
    };

    this.templates.set(clonedTemplate.id, clonedTemplate);
    this.emit('templateCloned', { originalId: templateId, cloneId: clonedTemplate.id });
    
    return clonedTemplate;
  }

  async createDashboardInstance(
    templateId: string,
    tenantId: string,
    userId: string,
    name: string,
    customizations: Record<string, any> = {}
  ): Promise<DashboardInstance> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const instance: DashboardInstance = {
      id: this.generateId(),
      templateId,
      tenantId,
      userId,
      name,
      customizations,
      personalizations: [],
      shareSettings: {
        isPublic: false,
        sharedWith: []
      },
      viewHistory: [],
      lastViewed: new Date(),
      lastModified: new Date(),
      isPublished: false,
      version: 1
    };

    this.instances.set(instance.id, instance);
    this.emit('dashboardInstanceCreated', { instanceId: instance.id, templateId });
    
    return instance;
  }

  async renderDashboard(instanceId: string, userId: string): Promise<RenderedDashboard> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Dashboard instance ${instanceId} not found`);
    }

    const template = this.templates.get(instance.templateId);
    if (!template) {
      throw new Error(`Template ${instance.templateId} not found`);
    }

    this.recordDashboardView(instanceId, userId);

    const renderedWidgets = await Promise.all(
      template.widgets.map(widget => this.renderWidget(widget, instance, userId))
    );

    const renderedFilters = template.filters.map(filter => 
      this.renderFilter(filter, instance, userId)
    );

    return {
      instanceId,
      templateId: instance.templateId,
      name: instance.name,
      layout: template.layout,
      widgets: renderedWidgets,
      filters: renderedFilters,
      theme: await this.getEffectiveTheme(instance),
      permissions: await this.getEffectivePermissions(instance, userId),
      metadata: {
        lastModified: instance.lastModified,
        version: instance.version,
        viewCount: instance.viewHistory.length
      }
    };
  }

  async renderWidget(widget: DashboardWidget, instance: DashboardInstance, userId: string): Promise<RenderedWidget> {
    const personalization = this.getWidgetPersonalization(widget.id, instance);
    
    const effectiveConfig = {
      ...widget.configuration,
      ...personalization?.configuration
    };

    const data = await this.fetchWidgetData(widget.dataSource, instance);
    
    return {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      position: personalization?.position || widget.position,
      size: personalization?.size || widget.size,
      configuration: effectiveConfig,
      data,
      isVisible: widget.isVisible,
      refreshInterval: widget.refreshInterval,
      lastUpdated: new Date(),
      permissions: widget.permissions
    };
  }

  private renderFilter(filter: DashboardFilter, instance: DashboardInstance, userId: string): RenderedFilter {
    const personalization = this.getFilterPersonalization(filter.id, instance);
    
    return {
      id: filter.id,
      name: filter.name,
      type: filter.type,
      field: filter.field,
      options: filter.options || [],
      value: personalization?.defaultValue || filter.defaultValue,
      isRequired: filter.isRequired,
      isVisible: filter.isVisible,
      dependsOn: filter.dependsOn || []
    };
  }

  async fetchWidgetData(dataSource: WidgetDataSource, instance: DashboardInstance): Promise<any> {
    switch (dataSource.type) {
      case 'metric':
        return await this.fetchMetricData(dataSource.metricIds || [], instance);
      case 'query':
        return await this.executeQuery(dataSource.query || '', dataSource.parameters);
      case 'api':
        return await this.fetchAPIData(dataSource.apiEndpoint || '', dataSource.parameters);
      case 'static':
        return dataSource.staticData;
      default:
        return null;
    }
  }

  private async fetchMetricData(metricIds: string[], instance: DashboardInstance): Promise<any> {
    const data: Record<string, any> = {};
    
    for (const metricId of metricIds) {
      const metric = this.metricDefinitions.get(metricId);
      if (metric) {
        data[metricId] = await this.generateMockMetricData(metric);
      }
    }
    
    return data;
  }

  private async generateMockMetricData(metric: MetricDefinition): Promise<any> {
    const dataPoints = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      dataPoints.push({
        timestamp: date.toISOString(),
        value: Math.random() * 1000 + 500,
        dimensions: metric.dimensions.reduce((dims, dim) => {
          dims[dim] = `value_${Math.floor(Math.random() * 5)}`;
          return dims;
        }, {} as Record<string, string>)
      });
    }
    
    return {
      metric: metric.name,
      dataPoints,
      summary: {
        current: dataPoints[dataPoints.length - 1]?.value || 0,
        previous: dataPoints[dataPoints.length - 2]?.value || 0,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.random() * 20 - 10
      }
    };
  }

  private async executeQuery(query: string, parameters: Record<string, any>): Promise<any> {
    return { data: [], count: 0 };
  }

  private async fetchAPIData(endpoint: string, parameters: Record<string, any>): Promise<any> {
    try {
      const url = new URL(endpoint);
      Object.entries(parameters).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.emit('widgetDataError', { endpoint, error: error.message });
      return null;
    }
  }

  async validateTemplate(template: DashboardTemplate): Promise<TemplateValidationResult> {
    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationWarning[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push({
        type: 'configuration',
        field: 'name',
        message: 'Template name is required',
        severity: 'error'
      });
    }

    if (template.widgets.length === 0) {
      warnings.push({
        type: 'content',
        message: 'Template has no widgets',
        suggestion: 'Add at least one widget to make the dashboard useful'
      });
    }

    const widgetIds = new Set();
    template.widgets.forEach((widget, index) => {
      if (widgetIds.has(widget.id)) {
        errors.push({
          type: 'configuration',
          field: `widgets[${index}].id`,
          message: `Duplicate widget ID: ${widget.id}`,
          severity: 'error'
        });
      }
      widgetIds.add(widget.id);

      if (!this.isValidPosition(widget.position, template.layout)) {
        errors.push({
          type: 'configuration',
          field: `widgets[${index}].position`,
          message: 'Widget position is outside dashboard layout bounds',
          severity: 'error'
        });
      }
    });

    const performance = this.calculatePerformanceMetrics(template);
    
    if (performance.expectedLoadTime > 5000) {
      warnings.push({
        type: 'performance',
        message: 'Dashboard may load slowly due to complexity',
        suggestion: 'Consider reducing the number of widgets or simplifying data sources'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      performance
    };
  }

  private calculatePerformanceMetrics(template: DashboardTemplate): TemplatePerformanceMetrics {
    const baseLoadTime = 500;
    const widgetLoadTime = template.widgets.length * 200;
    const complexWidgets = template.widgets.filter(w => 
      w.type === 'chart' && 
      (w.dataSource.type === 'query' || w.dataSource.type === 'api')
    ).length;
    
    return {
      expectedLoadTime: baseLoadTime + widgetLoadTime + (complexWidgets * 300),
      memoryUsage: template.widgets.length * 50 + 100,
      networkRequests: template.widgets.filter(w => 
        w.dataSource.type === 'api' || w.dataSource.type === 'metric'
      ).length,
      cacheEfficiency: 0.8,
      complexity: template.widgets.length + template.filters.length
    };
  }

  private isValidPosition(position: any, layout: any): boolean {
    return position.x >= 0 && 
           position.y >= 0 && 
           position.x < layout.columns && 
           position.y < layout.rows;
  }

  private getWidgetPersonalization(widgetId: string, instance: DashboardInstance): any {
    return instance.personalizations.find(p => 
      p.type === 'widget_position' || 
      p.type === 'widget_size' || 
      p.type === 'widget_config'
    );
  }

  private getFilterPersonalization(filterId: string, instance: DashboardInstance): any {
    return instance.personalizations.find(p => p.type === 'filter_defaults');
  }

  private async getEffectiveTheme(instance: DashboardInstance): Promise<DashboardTheme> {
    const themePersonalization = instance.personalizations.find(p => p.type === 'theme');
    const themeId = themePersonalization?.configuration.themeId || 'default';
    return this.themes.get(themeId) || this.themes.get('default')!;
  }

  private async getEffectivePermissions(instance: DashboardInstance, userId: string): Promise<string[]> {
    if (instance.userId === userId) {
      return ['view', 'edit', 'share', 'delete'];
    }
    
    const sharedUser = instance.shareSettings.sharedWith.find(u => u.userId === userId);
    if (sharedUser) {
      return [sharedUser.permission];
    }
    
    if (instance.shareSettings.isPublic) {
      return ['view'];
    }
    
    return [];
  }

  private recordDashboardView(instanceId: string, userId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      const view: DashboardView = {
        userId,
        timestamp: new Date(),
        duration: 0,
        interactions: [],
        device: 'web',
        browser: 'unknown'
      };
      
      instance.viewHistory.push(view);
      instance.lastViewed = new Date();
      
      if (instance.viewHistory.length > 100) {
        instance.viewHistory.shift();
      }
    }
  }

  private initializeDefaultThemes(): void {
    const defaultTheme: DashboardTheme = {
      id: 'default',
      name: 'Default Theme',
      description: 'Clean and professional theme for business dashboards',
      colors: {
        primary: '#1976d2',
        secondary: '#424242',
        accent: '#ff4081',
        background: '#fafafa',
        surface: '#ffffff',
        text: '#212121',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3'
      },
      typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        headingScale: [2.5, 2, 1.5, 1.25, 1.125, 1],
        bodySize: 14,
        fontWeights: {
          light: 300,
          regular: 400,
          medium: 500,
          bold: 700
        }
      },
      spacing: {
        unit: 8,
        scales: [0, 4, 8, 16, 24, 32, 48, 64]
      },
      components: {
        card: {
          backgroundColor: '#ffffff',
          borderColor: '#e0e0e0',
          borderRadius: 4,
          shadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: [16, 16, 16, 16]
        },
        chart: {
          backgroundColor: 'transparent',
          padding: [8, 8, 8, 8]
        },
        table: {
          backgroundColor: '#ffffff',
          borderColor: '#e0e0e0'
        },
        button: {
          borderRadius: 4,
          padding: [8, 16, 8, 16]
        }
      }
    };

    this.themes.set('default', defaultTheme);
  }

  private initializeDefaultEngines(): void {
    const standardEngine: TemplateEngine = {
      id: 'standard',
      name: 'Standard Dashboard Engine',
      version: '1.0.0',
      supportedWidgetTypes: ['chart', 'metric', 'table', 'scorecard', 'gauge', 'text'],
      supportedChartTypes: ['line', 'bar', 'pie', 'area', 'scatter', 'heatmap'],
      customizationOptions: [
        {
          type: 'color',
          name: 'Color Scheme',
          description: 'Choose dashboard color palette',
          options: [
            { label: 'Blue', value: 'blue' },
            { label: 'Green', value: 'green' },
            { label: 'Purple', value: 'purple' }
          ],
          isRequired: false,
          defaultValue: 'blue'
        }
      ]
    };

    this.engines.set('standard', standardEngine);
  }

  private initializeDefaultTemplates(): void {
    const executiveTemplate: DashboardTemplate = {
      id: 'executive_summary',
      tenantId: 'system',
      name: 'Executive Summary',
      description: 'High-level KPIs and metrics for executives',
      category: 'executive',
      type: 'executive',
      layout: {
        columns: 12,
        rows: 8,
        gridSize: 8,
        responsiveBreakpoints: {
          mobile: 480,
          tablet: 768,
          desktop: 1024
        }
      },
      widgets: [
        {
          id: 'aum_metric',
          type: 'scorecard',
          title: 'Assets Under Management',
          position: { x: 0, y: 0, z: 1 },
          size: { width: 3, height: 2 },
          configuration: {
            chartType: 'line',
            colors: ['#1976d2'],
            showLegend: false
          },
          dataSource: {
            type: 'metric',
            metricIds: ['aum'],
            parameters: {},
            transformations: []
          },
          refreshInterval: 300000,
          isVisible: true,
          permissions: []
        },
        {
          id: 'revenue_chart',
          type: 'chart',
          title: 'Revenue Trend',
          position: { x: 3, y: 0, z: 1 },
          size: { width: 6, height: 4 },
          configuration: {
            chartType: 'line',
            colors: ['#4caf50', '#ff9800'],
            showLegend: true
          },
          dataSource: {
            type: 'metric',
            metricIds: ['revenue', 'mgmt_fees'],
            parameters: {},
            transformations: []
          },
          refreshInterval: 300000,
          isVisible: true,
          permissions: []
        }
      ],
      filters: [
        {
          id: 'date_range',
          name: 'Date Range',
          type: 'daterange',
          field: 'date',
          defaultValue: { start: '2024-01-01', end: '2024-12-31' },
          isRequired: true,
          isVisible: true
        }
      ],
      permissions: [],
      isPublic: true,
      isDefault: true,
      tags: ['executive', 'summary', 'kpi'],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set('executive_summary', executiveTemplate);
  }

  private getDefaultLayout() {
    return {
      columns: 12,
      rows: 6,
      gridSize: 8,
      responsiveBreakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
      }
    };
  }

  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTemplate(templateId: string): DashboardTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getTemplates(tenantId?: string, category?: string): DashboardTemplate[] {
    let templates = Array.from(this.templates.values());
    
    if (tenantId) {
      templates = templates.filter(t => t.tenantId === tenantId || t.isPublic);
    }
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    return templates;
  }

  getDashboardInstance(instanceId: string): DashboardInstance | null {
    return this.instances.get(instanceId) || null;
  }

  getDashboardInstances(tenantId: string, userId?: string): DashboardInstance[] {
    let instances = Array.from(this.instances.values())
      .filter(i => i.tenantId === tenantId);
    
    if (userId) {
      instances = instances.filter(i => 
        i.userId === userId || 
        i.shareSettings.sharedWith.some(u => u.userId === userId) ||
        i.shareSettings.isPublic
      );
    }
    
    return instances;
  }

  getThemes(): DashboardTheme[] {
    return Array.from(this.themes.values());
  }
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
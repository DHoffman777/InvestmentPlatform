"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardTemplateSystem = void 0;
const events_1 = require("events");
class DashboardTemplateSystem extends events_1.EventEmitter {
    templates = new Map();
    instances = new Map();
    themes = new Map();
    engines = new Map();
    metricDefinitions = new Map();
    businessKPIs = new Map();
    constructor() {
        super();
        this.initializeDefaultThemes();
        this.initializeDefaultEngines();
        this.initializeDefaultTemplates();
    }
    async createTemplate(template) {
        const newTemplate = {
            id: template.id || this.generateId(),
            tenantId: template.tenantId,
            name: template.name,
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
            createdBy: template.createdBy,
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
    async updateTemplate(templateId, updates) {
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
    async deleteTemplate(templateId) {
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
    async cloneTemplate(templateId, newName, tenantId, userId) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        const clonedTemplate = {
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
    async createDashboardInstance(templateId, tenantId, userId, name, customizations = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        const instance = {
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
    async renderDashboard(instanceId, userId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            throw new Error(`Dashboard instance ${instanceId} not found`);
        }
        const template = this.templates.get(instance.templateId);
        if (!template) {
            throw new Error(`Template ${instance.templateId} not found`);
        }
        this.recordDashboardView(instanceId, userId);
        const renderedWidgets = await Promise.all(template.widgets.map(widget => this.renderWidget(widget, instance, userId)));
        const renderedFilters = template.filters.map(filter => this.renderFilter(filter, instance, userId));
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
    async renderWidget(widget, instance, userId) {
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
    renderFilter(filter, instance, userId) {
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
    async fetchWidgetData(dataSource, instance) {
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
    async fetchMetricData(metricIds, instance) {
        const data = {};
        for (const metricId of metricIds) {
            const metric = this.metricDefinitions.get(metricId);
            if (metric) {
                data[metricId] = await this.generateMockMetricData(metric);
            }
        }
        return data;
    }
    async generateMockMetricData(metric) {
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
                }, {})
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
    async executeQuery(query, parameters) {
        return { data: [], count: 0 };
    }
    async fetchAPIData(endpoint, parameters) {
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
        }
        catch (error) {
            this.emit('widgetDataError', { endpoint, error: error instanceof Error ? error.message : 'Unknown error' });
            return null;
        }
    }
    async validateTemplate(template) {
        const errors = [];
        const warnings = [];
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
    calculatePerformanceMetrics(template) {
        const baseLoadTime = 500;
        const widgetLoadTime = template.widgets.length * 200;
        const complexWidgets = template.widgets.filter(w => w.type === 'chart' &&
            (w.dataSource.type === 'query' || w.dataSource.type === 'api')).length;
        return {
            expectedLoadTime: baseLoadTime + widgetLoadTime + (complexWidgets * 300),
            memoryUsage: template.widgets.length * 50 + 100,
            networkRequests: template.widgets.filter(w => w.dataSource.type === 'api' || w.dataSource.type === 'metric').length,
            cacheEfficiency: 0.8,
            complexity: template.widgets.length + template.filters.length
        };
    }
    isValidPosition(position, layout) {
        return position.x >= 0 &&
            position.y >= 0 &&
            position.x < layout.columns &&
            position.y < layout.rows;
    }
    getWidgetPersonalization(widgetId, instance) {
        return instance.personalizations.find(p => p.type === 'widget_position' ||
            p.type === 'widget_size' ||
            p.type === 'widget_config');
    }
    getFilterPersonalization(filterId, instance) {
        return instance.personalizations.find(p => p.type === 'filter_defaults');
    }
    async getEffectiveTheme(instance) {
        const themePersonalization = instance.personalizations.find(p => p.type === 'theme');
        const themeId = themePersonalization?.configuration.themeId || 'default';
        return this.themes.get(themeId) || this.themes.get('default');
    }
    async getEffectivePermissions(instance, userId) {
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
    recordDashboardView(instanceId, userId) {
        const instance = this.instances.get(instanceId);
        if (instance) {
            const view = {
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
    initializeDefaultThemes() {
        const defaultTheme = {
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
    initializeDefaultEngines() {
        const standardEngine = {
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
    initializeDefaultTemplates() {
        const executiveTemplate = {
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
    getDefaultLayout() {
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
    generateId() {
        return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getTemplate(templateId) {
        return this.templates.get(templateId) || null;
    }
    getTemplates(tenantId, category) {
        let templates = Array.from(this.templates.values());
        if (tenantId) {
            templates = templates.filter(t => t.tenantId === tenantId || t.isPublic);
        }
        if (category) {
            templates = templates.filter(t => t.category === category);
        }
        return templates;
    }
    getDashboardInstance(instanceId) {
        return this.instances.get(instanceId) || null;
    }
    getDashboardInstances(tenantId, userId) {
        let instances = Array.from(this.instances.values())
            .filter(i => i.tenantId === tenantId);
        if (userId) {
            instances = instances.filter(i => i.userId === userId ||
                i.shareSettings.sharedWith.some(u => u.userId === userId) ||
                i.shareSettings.isPublic);
        }
        return instances;
    }
    getThemes() {
        return Array.from(this.themes.values());
    }
}
exports.DashboardTemplateSystem = DashboardTemplateSystem;

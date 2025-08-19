"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardBuilderService = void 0;
const crypto_1 = require("crypto");
const Analytics_1 = require("../../models/analytics/Analytics");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class DashboardBuilderService {
    eventPublisher;
    defaultTemplates = [
        {
            id: 'executive-overview',
            name: 'Executive Overview',
            description: 'High-level portfolio performance and risk metrics for executives',
            category: 'executive',
            tags: ['performance', 'risk', 'summary'],
            layout: { rows: 3, columns: 4, gridSize: 12 },
            visualizations: [
                {
                    metricType: Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE,
                    visualizationType: Analytics_1.VisualizationType.LINE_CHART,
                    position: { row: 0, column: 0, width: 2, height: 1 },
                    title: 'Portfolio Performance',
                    configuration: { timeframe: '1Y', showBenchmark: true }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION,
                    visualizationType: Analytics_1.VisualizationType.PIE_CHART,
                    position: { row: 0, column: 2, width: 2, height: 1 },
                    title: 'Asset Allocation',
                    configuration: { chartType: 'PIE', showTargets: true }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.RISK_METRICS,
                    visualizationType: Analytics_1.VisualizationType.GAUGE,
                    position: { row: 1, column: 0, width: 1, height: 1 },
                    title: 'Risk Score',
                    configuration: { metric: 'VaR', threshold: 2.0 }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.SECTOR_ANALYSIS,
                    visualizationType: Analytics_1.VisualizationType.TREEMAP,
                    position: { row: 1, column: 1, width: 3, height: 2 },
                    title: 'Sector Exposure',
                    configuration: { drillDownEnabled: true }
                }
            ],
            filters: [],
            isPublic: true,
            usageCount: 1250,
            rating: 4.8,
            createdBy: 'system',
            createdAt: new Date('2024-01-01')
        },
        {
            id: 'portfolio-manager',
            name: 'Portfolio Manager Dashboard',
            description: 'Detailed analytics for portfolio managers including attribution and performance',
            category: 'portfolio_manager',
            tags: ['performance', 'attribution', 'holdings', 'detailed'],
            layout: { rows: 4, columns: 6, gridSize: 12 },
            visualizations: [
                {
                    metricType: Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE,
                    visualizationType: Analytics_1.VisualizationType.LINE_CHART,
                    position: { row: 0, column: 0, width: 3, height: 1 },
                    title: 'Performance vs Benchmark',
                    configuration: { timeframe: '3Y', showBenchmark: true, showDrawdown: true }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.ATTRIBUTION_ANALYSIS,
                    visualizationType: Analytics_1.VisualizationType.WATERFALL,
                    position: { row: 0, column: 3, width: 3, height: 1 },
                    title: 'Performance Attribution',
                    configuration: { period: 'YTD' }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION,
                    visualizationType: Analytics_1.VisualizationType.BAR_CHART,
                    position: { row: 1, column: 0, width: 2, height: 1 },
                    title: 'Asset Allocation vs Target',
                    configuration: { showTargets: true, showDrift: true }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.CONCENTRATION_ANALYSIS,
                    visualizationType: Analytics_1.VisualizationType.BUBBLE_CHART,
                    position: { row: 1, column: 2, width: 2, height: 1 },
                    title: 'Position Concentration',
                    configuration: { xAxis: 'weight', yAxis: 'risk', bubbleSize: 'liquidity' }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.CORRELATION_ANALYSIS,
                    visualizationType: Analytics_1.VisualizationType.HEATMAP,
                    position: { row: 1, column: 4, width: 2, height: 1 },
                    title: 'Correlation Matrix',
                    configuration: { period: '1Y' }
                }
            ],
            filters: [
                {
                    id: 'date-range',
                    name: 'Date Range',
                    type: 'date_range',
                    field: 'date',
                    operator: 'between',
                    value: { startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), endDate: new Date() },
                    displayName: 'Time Period'
                }
            ],
            isPublic: true,
            usageCount: 850,
            rating: 4.6,
            createdBy: 'system',
            createdAt: new Date('2024-01-15')
        },
        {
            id: 'risk-analyst',
            name: 'Risk Analyst Dashboard',
            description: 'Comprehensive risk monitoring and analysis tools',
            category: 'risk_analyst',
            tags: ['risk', 'var', 'stress-testing', 'limits'],
            layout: { rows: 3, columns: 4, gridSize: 12 },
            visualizations: [
                {
                    metricType: Analytics_1.AnalyticsMetricType.RISK_METRICS,
                    visualizationType: Analytics_1.VisualizationType.LINE_CHART,
                    position: { row: 0, column: 0, width: 2, height: 1 },
                    title: 'VaR Trend',
                    configuration: { metric: 'VaR', confidence: 95, timeframe: '3M' }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.RISK_METRICS,
                    visualizationType: Analytics_1.VisualizationType.BAR_CHART,
                    position: { row: 0, column: 2, width: 2, height: 1 },
                    title: 'Risk Limits vs Usage',
                    configuration: { showLimits: true, alertThreshold: 0.8 }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.CORRELATION_ANALYSIS,
                    visualizationType: Analytics_1.VisualizationType.HEATMAP,
                    position: { row: 1, column: 0, width: 2, height: 1 },
                    title: 'Asset Correlation',
                    configuration: { period: '6M', clusterAnalysis: true }
                },
                {
                    metricType: Analytics_1.AnalyticsMetricType.LIQUIDITY_ANALYSIS,
                    visualizationType: Analytics_1.VisualizationType.AREA_CHART,
                    position: { row: 1, column: 2, width: 2, height: 1 },
                    title: 'Liquidity Profile',
                    configuration: { buckets: ['1D', '1W', '1M', '3M', '6M', '1Y+'] }
                }
            ],
            filters: [],
            isPublic: true,
            usageCount: 420,
            rating: 4.5,
            createdBy: 'system',
            createdAt: new Date('2024-02-01')
        }
    ];
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    async createDashboard(request) {
        try {
            logger_1.logger.info('Creating custom dashboard', {
                tenantId: request.tenantId,
                name: request.name,
                templateId: request.templateId
            });
            let dashboardConfig;
            if (request.templateId) {
                const template = await this.getTemplate(request.templateId);
                if (!template) {
                    throw new Error(`Template not found: ${request.templateId}`);
                }
                dashboardConfig = await this.applyTemplate(template, request);
            }
            else {
                dashboardConfig = await this.createFromScratch(request);
            }
            const dashboard = {
                id: (0, crypto_1.randomUUID)(),
                tenantId: request.tenantId,
                name: request.name,
                description: request.description || '',
                isDefault: request.isDefault || false,
                isTemplate: false,
                visualizations: dashboardConfig.visualizations || [],
                layout: request.layout || { rows: 3, columns: 4, gridSize: 12 },
                filters: request.filters || [],
                refreshInterval: 300000, // 5 minutes
                createdBy: request.createdBy,
                sharedWith: [],
                permissions: request.permissions || {
                    canEdit: true,
                    canShare: true,
                    canDelete: true
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await this.saveDashboard(dashboard);
            await this.eventPublisher.publish('analytics.dashboard.created', {
                tenantId: request.tenantId,
                dashboardId: dashboard.id,
                name: request.name,
                templateId: request.templateId,
                createdBy: request.createdBy
            });
            return dashboard;
        }
        catch (error) {
            logger_1.logger.error('Error creating dashboard:', error);
            throw error;
        }
    }
    async updateDashboard(dashboardId, updates, userId) {
        try {
            logger_1.logger.info('Updating dashboard', { dashboardId, userId });
            const existingDashboard = await this.getDashboard(dashboardId);
            if (!existingDashboard) {
                throw new Error('Dashboard not found');
            }
            const updatedDashboard = {
                ...existingDashboard,
                ...updates,
                layout: updates.layout ? { ...existingDashboard.layout, ...updates.layout } : existingDashboard.layout,
                permissions: updates.permissions ? { ...existingDashboard.permissions, ...updates.permissions } : existingDashboard.permissions,
                updatedAt: new Date()
            };
            await this.saveDashboard(updatedDashboard);
            await this.eventPublisher.publish('analytics.dashboard.updated', {
                tenantId: existingDashboard.tenantId,
                dashboardId,
                updatedBy: userId,
                changes: Object.keys(updates)
            });
            return updatedDashboard;
        }
        catch (error) {
            logger_1.logger.error('Error updating dashboard:', error);
            throw error;
        }
    }
    async addVisualizationToDashboard(dashboardId, visualization, userId) {
        try {
            logger_1.logger.info('Adding visualization to dashboard', { dashboardId, visualizationType: visualization.visualizationType });
            const dashboard = await this.getDashboard(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }
            const newVisualization = {
                id: (0, crypto_1.randomUUID)(),
                visualizationId: (0, crypto_1.randomUUID)(), // Would be created by DataVisualizationService
                position: visualization.position,
                overrideTitle: visualization.title,
                overrideConfiguration: visualization.configuration,
                filters: visualization.filters
            };
            dashboard.visualizations.push(newVisualization);
            dashboard.updatedAt = new Date();
            await this.saveDashboard(dashboard);
            await this.eventPublisher.publish('analytics.dashboard.visualization.added', {
                tenantId: dashboard.tenantId,
                dashboardId,
                visualizationId: newVisualization.id,
                addedBy: userId
            });
            return dashboard;
        }
        catch (error) {
            logger_1.logger.error('Error adding visualization to dashboard:', error);
            throw error;
        }
    }
    async removeVisualizationFromDashboard(dashboardId, visualizationId, userId) {
        try {
            logger_1.logger.info('Removing visualization from dashboard', { dashboardId, visualizationId });
            const dashboard = await this.getDashboard(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }
            dashboard.visualizations = dashboard.visualizations.filter(v => v.id !== visualizationId);
            dashboard.updatedAt = new Date();
            await this.saveDashboard(dashboard);
            await this.eventPublisher.publish('analytics.dashboard.visualization.removed', {
                tenantId: dashboard.tenantId,
                dashboardId,
                visualizationId,
                removedBy: userId
            });
            return dashboard;
        }
        catch (error) {
            logger_1.logger.error('Error removing visualization from dashboard:', error);
            throw error;
        }
    }
    async cloneDashboard(dashboardId, newName, tenantId, userId) {
        try {
            logger_1.logger.info('Cloning dashboard', { dashboardId, newName });
            const originalDashboard = await this.getDashboard(dashboardId);
            if (!originalDashboard) {
                throw new Error('Dashboard not found');
            }
            const clonedDashboard = {
                ...originalDashboard,
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                name: newName,
                isDefault: false,
                createdBy: userId,
                sharedWith: [],
                visualizations: originalDashboard.visualizations.map(viz => ({
                    ...viz,
                    id: (0, crypto_1.randomUUID)()
                })),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await this.saveDashboard(clonedDashboard);
            await this.eventPublisher.publish('analytics.dashboard.cloned', {
                tenantId,
                originalDashboardId: dashboardId,
                newDashboardId: clonedDashboard.id,
                clonedBy: userId
            });
            return clonedDashboard;
        }
        catch (error) {
            logger_1.logger.error('Error cloning dashboard:', error);
            throw error;
        }
    }
    async shareDashboard(dashboardId, shareWithUserIds, permissions, sharedBy) {
        try {
            logger_1.logger.info('Sharing dashboard', { dashboardId, shareWithUserIds, sharedBy });
            const dashboard = await this.getDashboard(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }
            dashboard.sharedWith = [...new Set([...dashboard.sharedWith, ...shareWithUserIds])];
            dashboard.updatedAt = new Date();
            await this.saveDashboard(dashboard);
            await this.eventPublisher.publish('analytics.dashboard.shared', {
                tenantId: dashboard.tenantId,
                dashboardId,
                sharedWith: shareWithUserIds,
                permissions,
                sharedBy
            });
            return dashboard;
        }
        catch (error) {
            logger_1.logger.error('Error sharing dashboard:', error);
            throw error;
        }
    }
    async getAvailableTemplates(category) {
        try {
            logger_1.logger.info('Retrieving dashboard templates', { category });
            let templates = this.defaultTemplates.filter(t => t.isPublic);
            if (category) {
                templates = templates.filter(t => t.category === category);
            }
            return templates.sort((a, b) => b.rating - a.rating);
        }
        catch (error) {
            logger_1.logger.error('Error retrieving templates:', error);
            throw error;
        }
    }
    async createTemplate(dashboardId, templateData, createdBy) {
        try {
            logger_1.logger.info('Creating dashboard template', { dashboardId, templateName: templateData.name });
            const dashboard = await this.getDashboard(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }
            const template = {
                id: (0, crypto_1.randomUUID)(),
                name: templateData.name,
                description: templateData.description,
                category: templateData.category,
                tags: templateData.tags,
                layout: dashboard.layout,
                visualizations: dashboard.visualizations.map(viz => ({
                    metricType: Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE, // Would be derived from actual visualization
                    visualizationType: Analytics_1.VisualizationType.LINE_CHART, // Would be derived from actual visualization
                    position: viz.position,
                    title: viz.overrideTitle || 'Visualization',
                    configuration: viz.overrideConfiguration || {},
                    filters: viz.filters
                })),
                filters: dashboard.filters,
                isPublic: templateData.isPublic,
                usageCount: 0,
                rating: 0,
                createdBy,
                createdAt: new Date()
            };
            await this.saveTemplate(template);
            await this.eventPublisher.publish('analytics.dashboard.template.created', {
                templateId: template.id,
                dashboardId,
                createdBy
            });
            return template;
        }
        catch (error) {
            logger_1.logger.error('Error creating template:', error);
            throw error;
        }
    }
    async validateDashboardLayout(layout) {
        if (layout.rows < 1 || layout.rows > 10) {
            throw new Error('Dashboard must have between 1 and 10 rows');
        }
        if (layout.columns < 1 || layout.columns > 12) {
            throw new Error('Dashboard must have between 1 and 12 columns');
        }
        if (layout.gridSize < 1 || layout.gridSize > 24) {
            throw new Error('Grid size must be between 1 and 24');
        }
        return true;
    }
    async validateVisualizationPosition(position, layout) {
        if (position.row < 0 || position.row >= layout.rows) {
            throw new Error(`Row must be between 0 and ${layout.rows - 1}`);
        }
        if (position.column < 0 || position.column >= layout.columns) {
            throw new Error(`Column must be between 0 and ${layout.columns - 1}`);
        }
        if (position.width < 1 || position.width > layout.columns) {
            throw new Error(`Width must be between 1 and ${layout.columns}`);
        }
        if (position.height < 1 || position.height > layout.rows) {
            throw new Error(`Height must be between 1 and ${layout.rows}`);
        }
        if (position.column + position.width > layout.columns) {
            throw new Error('Visualization extends beyond dashboard width');
        }
        if (position.row + position.height > layout.rows) {
            throw new Error('Visualization extends beyond dashboard height');
        }
        return true;
    }
    async applyTemplate(template, request) {
        const visualizations = template.visualizations.map(vizTemplate => ({
            id: (0, crypto_1.randomUUID)(),
            visualizationId: (0, crypto_1.randomUUID)(), // Would be created by DataVisualizationService
            position: vizTemplate.position,
            overrideTitle: vizTemplate.title,
            overrideConfiguration: vizTemplate.configuration,
            filters: vizTemplate.filters
        }));
        return {
            layout: template.layout,
            visualizations,
            filters: [...template.filters, ...(request.filters || [])]
        };
    }
    async createFromScratch(request) {
        const visualizations = request.visualizations?.map(vizTemplate => ({
            id: (0, crypto_1.randomUUID)(),
            visualizationId: (0, crypto_1.randomUUID)(), // Would be created by DataVisualizationService
            position: vizTemplate.position,
            overrideTitle: vizTemplate.title,
            overrideConfiguration: vizTemplate.configuration,
            filters: vizTemplate.filters
        })) || [];
        return {
            layout: request.layout || { rows: 3, columns: 4, gridSize: 12 },
            visualizations,
            filters: request.filters || []
        };
    }
    async getTemplate(templateId) {
        return this.defaultTemplates.find(t => t.id === templateId) || null;
    }
    async getDashboard(dashboardId) {
        logger_1.logger.debug('Retrieving dashboard', { dashboardId });
        return null;
    }
    async saveDashboard(dashboard) {
        logger_1.logger.debug('Saving dashboard', { dashboardId: dashboard.id });
    }
    async saveTemplate(template) {
        logger_1.logger.debug('Saving dashboard template', { templateId: template.id });
    }
}
exports.DashboardBuilderService = DashboardBuilderService;

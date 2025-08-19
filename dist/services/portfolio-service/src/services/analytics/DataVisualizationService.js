"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataVisualizationService = void 0;
const crypto_1 = require("crypto");
const Analytics_1 = require("../../models/analytics/Analytics");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class DataVisualizationService {
    eventPublisher;
    colorSchemes = {
        primary: ['#1976D2', '#388E3C', '#F57C00', '#7B1FA2', '#D32F2F', '#0288D1', '#689F38', '#FF8F00'],
        performance: ['#4CAF50', '#FF5722', '#2196F3', '#FF9800', '#9C27B0', '#607D8B'],
        risk: ['#F44336', '#FF9800', '#FFC107', '#4CAF50', '#2196F3'],
        allocation: ['#3F51B5', '#009688', '#FF5722', '#795548', '#607D8B', '#E91E63']
    };
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    async createVisualization(request) {
        try {
            logger_1.logger.info('Creating data visualization', {
                tenantId: request.tenantId,
                metricType: request.metricType,
                visualizationType: request.visualizationType
            });
            const data = await this.generateVisualizationData(request);
            const configuration = this.generateConfiguration(request.visualizationType, request.metricType);
            const visualization = {
                id: (0, crypto_1.randomUUID)(),
                title: this.generateTitle(request.metricType, request.visualizationType),
                description: this.generateDescription(request.metricType, request.visualizationType),
                type: request.visualizationType,
                metricType: request.metricType,
                data,
                configuration,
                filters: request.filters || [],
                dimensions: this.generateDimensions(request.metricType),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await this.eventPublisher.publish('analytics.visualization.created', {
                tenantId: request.tenantId,
                visualizationId: visualization.id,
                metricType: request.metricType,
                visualizationType: request.visualizationType
            });
            return visualization;
        }
        catch (error) {
            logger_1.logger.error('Error creating visualization:', error);
            throw error;
        }
    }
    async updateVisualization(visualizationId, updates) {
        try {
            logger_1.logger.info('Updating visualization', { visualizationId });
            const existingVisualization = await this.getVisualization(visualizationId);
            if (!existingVisualization) {
                throw new Error('Visualization not found');
            }
            const updatedVisualization = {
                ...existingVisualization,
                ...updates,
                updatedAt: new Date()
            };
            await this.saveVisualization(updatedVisualization);
            return updatedVisualization;
        }
        catch (error) {
            logger_1.logger.error('Error updating visualization:', error);
            throw error;
        }
    }
    async refreshVisualizationData(visualizationId, tenantId) {
        try {
            logger_1.logger.info('Refreshing visualization data', { visualizationId, tenantId });
            const visualization = await this.getVisualization(visualizationId);
            if (!visualization) {
                throw new Error('Visualization not found');
            }
            const request = {
                tenantId,
                metricType: visualization.metricType,
                visualizationType: visualization.type,
                dateRange: this.extractDateRangeFromFilters(visualization.filters),
                filters: visualization.filters
            };
            const newData = await this.generateVisualizationData(request);
            const updatedVisualization = await this.updateVisualization(visualizationId, {
                data: newData,
                updatedAt: new Date()
            });
            await this.eventPublisher.publish('analytics.visualization.refreshed', {
                tenantId,
                visualizationId,
                refreshedAt: new Date()
            });
            return updatedVisualization;
        }
        catch (error) {
            logger_1.logger.error('Error refreshing visualization data:', error);
            throw error;
        }
    }
    async performDrillDown(request) {
        try {
            logger_1.logger.info('Performing drill-down analysis', {
                visualizationId: request.visualizationId,
                level: request.level
            });
            const visualization = await this.getVisualization(request.visualizationId);
            if (!visualization) {
                throw new Error('Visualization not found');
            }
            const dataPoint = visualization.data.find(dp => dp.label === request.dataPointId);
            if (!dataPoint) {
                throw new Error('Data point not found');
            }
            const drillDownData = await this.generateDrillDownData(visualization.metricType, request.level, dataPoint, request.filters);
            const breadcrumb = this.generateBreadcrumb(request.level, dataPoint);
            const availableLevels = this.getAvailableDrillDownLevels(visualization.metricType, request.level);
            return {
                level: request.level,
                data: drillDownData,
                breadcrumb,
                availableLevels
            };
        }
        catch (error) {
            logger_1.logger.error('Error performing drill-down:', error);
            throw error;
        }
    }
    async generateVisualizationData(request) {
        switch (request.metricType) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                return this.generatePerformanceData(request);
            case Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION:
                return this.generateAssetAllocationData(request);
            case Analytics_1.AnalyticsMetricType.RISK_METRICS:
                return this.generateRiskMetricsData(request);
            case Analytics_1.AnalyticsMetricType.SECTOR_ANALYSIS:
                return this.generateSectorAnalysisData(request);
            case Analytics_1.AnalyticsMetricType.CORRELATION_ANALYSIS:
                return this.generateCorrelationData(request);
            case Analytics_1.AnalyticsMetricType.ATTRIBUTION_ANALYSIS:
                return this.generateAttributionData(request);
            default:
                throw new Error(`Unsupported metric type: ${request.metricType}`);
        }
    }
    async generatePerformanceData(request) {
        const data = [];
        const { startDate, endDate } = request.dateRange;
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const period = this.getPeriodFromDays(daysDiff);
        const baseValue = 1000000;
        for (let i = 0; i <= daysDiff; i += this.getStepSize(period)) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const volatility = 0.15;
            const dailyReturn = (Math.random() - 0.5) * 2 * volatility / Math.sqrt(252);
            const value = baseValue * Math.exp(dailyReturn * i);
            data.push({
                timestamp: date,
                value: Math.round(value),
                label: date.toISOString().split('T')[0],
                metadata: {
                    return: ((value - baseValue) / baseValue * 100).toFixed(2) + '%',
                    volatility: (volatility * 100).toFixed(1) + '%'
                }
            });
        }
        return data;
    }
    async generateAssetAllocationData(request) {
        const allocations = [
            { name: 'Equities', value: 65, color: '#1976D2' },
            { name: 'Fixed Income', value: 25, color: '#388E3C' },
            { name: 'Real Estate', value: 7, color: '#F57C00' },
            { name: 'Cash', value: 3, color: '#7B1FA2' }
        ];
        return allocations.map((allocation, index) => ({
            timestamp: new Date(),
            value: allocation.value,
            label: allocation.name,
            metadata: {
                percentage: allocation.value + '%',
                color: allocation.color,
                absoluteValue: Math.round(1000000 * allocation.value / 100)
            },
            drillDownData: this.generateAllocationDrillDown(allocation.name)
        }));
    }
    async generateRiskMetricsData(request) {
        return [
            {
                timestamp: new Date(),
                value: 1.85,
                label: 'Value at Risk (95%)',
                metadata: {
                    unit: '%',
                    period: 'Daily',
                    confidence: '95%',
                    method: 'Historical Simulation'
                }
            },
            {
                timestamp: new Date(),
                value: 12.5,
                label: 'Volatility',
                metadata: {
                    unit: '%',
                    period: 'Annualized',
                    calculation: 'Standard Deviation'
                }
            },
            {
                timestamp: new Date(),
                value: 0.85,
                label: 'Beta',
                metadata: {
                    benchmark: 'S&P 500',
                    correlation: '0.78'
                }
            },
            {
                timestamp: new Date(),
                value: 1.25,
                label: 'Sharpe Ratio',
                metadata: {
                    riskFreeRate: '4.5%',
                    period: 'Annualized'
                }
            }
        ];
    }
    async generateSectorAnalysisData(request) {
        const sectors = [
            'Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary',
            'Industrials', 'Energy', 'Utilities', 'Materials', 'Real Estate'
        ];
        return sectors.map((sector, index) => ({
            timestamp: new Date(),
            value: Math.random() * 20 + 5,
            label: sector,
            metadata: {
                percentage: ((Math.random() * 20 + 5)).toFixed(1) + '%',
                performance: (Math.random() * 40 - 20).toFixed(2) + '%',
                weight: (Math.random() * 15 + 2).toFixed(1) + '%'
            }
        }));
    }
    async generateCorrelationData(request) {
        const assets = ['Equities', 'Bonds', 'Real Estate', 'Commodities', 'Cash'];
        const data = [];
        for (let i = 0; i < assets.length; i++) {
            for (let j = 0; j < assets.length; j++) {
                const correlation = i === j ? 1 : (Math.random() * 2 - 1);
                data.push({
                    timestamp: new Date(),
                    value: correlation,
                    label: `${assets[i]}-${assets[j]}`,
                    metadata: {
                        asset1: assets[i],
                        asset2: assets[j],
                        correlation: correlation.toFixed(3),
                        significance: Math.random() > 0.05 ? 'Significant' : 'Not Significant'
                    }
                });
            }
        }
        return data;
    }
    async generateAttributionData(request) {
        return [
            {
                timestamp: new Date(),
                value: 2.45,
                label: 'Asset Allocation',
                metadata: {
                    contribution: '+2.45%',
                    type: 'Positive'
                }
            },
            {
                timestamp: new Date(),
                value: -0.85,
                label: 'Security Selection',
                metadata: {
                    contribution: '-0.85%',
                    type: 'Negative'
                }
            },
            {
                timestamp: new Date(),
                value: 0.25,
                label: 'Interaction Effect',
                metadata: {
                    contribution: '+0.25%',
                    type: 'Positive'
                }
            }
        ];
    }
    generateConfiguration(visualizationType, metricType) {
        const baseConfig = {
            showLegend: true,
            showTooltip: true,
            interactive: true,
            drillDownEnabled: true,
            aggregationPeriod: Analytics_1.AggregationPeriod.DAILY
        };
        switch (visualizationType) {
            case Analytics_1.VisualizationType.LINE_CHART:
                return {
                    ...baseConfig,
                    xAxis: {
                        label: 'Date',
                        type: 'time',
                        format: 'MM-DD-YYYY'
                    },
                    yAxis: {
                        label: this.getYAxisLabel(metricType),
                        type: 'linear',
                        format: this.getYAxisFormat(metricType)
                    },
                    colors: this.getColorScheme(metricType)
                };
            case Analytics_1.VisualizationType.PIE_CHART:
            case Analytics_1.VisualizationType.DONUT_CHART:
                return {
                    ...baseConfig,
                    colors: this.colorSchemes.allocation,
                    showLegend: true
                };
            case Analytics_1.VisualizationType.BAR_CHART:
                return {
                    ...baseConfig,
                    xAxis: {
                        label: 'Category',
                        type: 'category'
                    },
                    yAxis: {
                        label: this.getYAxisLabel(metricType),
                        type: 'linear',
                        format: this.getYAxisFormat(metricType)
                    },
                    colors: this.getColorScheme(metricType)
                };
            case Analytics_1.VisualizationType.HEATMAP:
                return {
                    ...baseConfig,
                    colors: ['#FF5722', '#FF9800', '#FFC107', '#4CAF50', '#2196F3'],
                    showLegend: false
                };
            default:
                return baseConfig;
        }
    }
    generateDimensions(metricType) {
        const baseDimensions = [
            {
                id: 'time',
                name: 'Time',
                field: 'timestamp',
                type: 'time',
                aggregationMethods: ['sum', 'average']
            }
        ];
        switch (metricType) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                return [
                    ...baseDimensions,
                    {
                        id: 'portfolio',
                        name: 'Portfolio',
                        field: 'portfolioId',
                        type: 'category',
                        drillDownLevels: [Analytics_1.DrillDownLevel.PORTFOLIO, Analytics_1.DrillDownLevel.ASSET_CLASS, Analytics_1.DrillDownLevel.SECURITY],
                        aggregationMethods: ['sum', 'average']
                    }
                ];
            case Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION:
                return [
                    ...baseDimensions,
                    {
                        id: 'assetClass',
                        name: 'Asset Class',
                        field: 'assetClass',
                        type: 'category',
                        drillDownLevels: [Analytics_1.DrillDownLevel.ASSET_CLASS, Analytics_1.DrillDownLevel.SECTOR, Analytics_1.DrillDownLevel.SECURITY],
                        aggregationMethods: ['sum']
                    }
                ];
            default:
                return baseDimensions;
        }
    }
    generateAllocationDrillDown(assetClass) {
        const subAllocations = {
            'Equities': ['Large Cap', 'Mid Cap', 'Small Cap', 'International'],
            'Fixed Income': ['Government', 'Corporate', 'Municipal', 'High Yield'],
            'Real Estate': ['REITs', 'Direct Property', 'Real Estate Funds'],
            'Cash': ['Money Market', 'Short-term CDs', 'Treasury Bills']
        };
        const subs = subAllocations[assetClass] || [];
        return subs.map(sub => ({
            timestamp: new Date(),
            value: Math.random() * 30 + 5,
            label: sub,
            metadata: {
                parentCategory: assetClass,
                percentage: (Math.random() * 30 + 5).toFixed(1) + '%'
            }
        }));
    }
    async generateDrillDownData(metricType, level, parentDataPoint, filters) {
        switch (level) {
            case Analytics_1.DrillDownLevel.ASSET_CLASS:
                return this.generateAssetClassDrillDown(parentDataPoint);
            case Analytics_1.DrillDownLevel.SECTOR:
                return this.generateSectorDrillDown(parentDataPoint);
            case Analytics_1.DrillDownLevel.SECURITY:
                return this.generateSecurityDrillDown(parentDataPoint);
            default:
                return [];
        }
    }
    generateAssetClassDrillDown(parentDataPoint) {
        const assetClasses = ['Large Cap Stocks', 'Small Cap Stocks', 'International Stocks', 'Emerging Markets'];
        return assetClasses.map(assetClass => ({
            timestamp: new Date(),
            value: Math.random() * parentDataPoint.value,
            label: assetClass,
            metadata: {
                parentLabel: parentDataPoint.label,
                weight: (Math.random() * 100).toFixed(1) + '%'
            }
        }));
    }
    generateSectorDrillDown(parentDataPoint) {
        const sectors = ['Technology', 'Healthcare', 'Financials', 'Consumer Goods'];
        return sectors.map(sector => ({
            timestamp: new Date(),
            value: Math.random() * parentDataPoint.value * 0.3,
            label: sector,
            metadata: {
                parentLabel: parentDataPoint.label,
                allocation: (Math.random() * 30).toFixed(1) + '%'
            }
        }));
    }
    generateSecurityDrillDown(parentDataPoint) {
        const securities = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        return securities.map(security => ({
            timestamp: new Date(),
            value: Math.random() * parentDataPoint.value * 0.1,
            label: security,
            metadata: {
                parentLabel: parentDataPoint.label,
                shares: Math.floor(Math.random() * 1000),
                price: (Math.random() * 500 + 50).toFixed(2)
            }
        }));
    }
    generateTitle(metricType, visualizationType) {
        const titles = {
            [`${Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE}_${Analytics_1.VisualizationType.LINE_CHART}`]: 'Portfolio Performance Over Time',
            [`${Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION}_${Analytics_1.VisualizationType.PIE_CHART}`]: 'Asset Allocation Distribution',
            [`${Analytics_1.AnalyticsMetricType.RISK_METRICS}_${Analytics_1.VisualizationType.BAR_CHART}`]: 'Risk Metrics Summary',
            [`${Analytics_1.AnalyticsMetricType.SECTOR_ANALYSIS}_${Analytics_1.VisualizationType.BAR_CHART}`]: 'Sector Analysis',
            [`${Analytics_1.AnalyticsMetricType.CORRELATION_ANALYSIS}_${Analytics_1.VisualizationType.HEATMAP}`]: 'Asset Correlation Matrix'
        };
        return titles[`${metricType}_${visualizationType}`] || `${metricType} - ${visualizationType}`;
    }
    generateDescription(metricType, visualizationType) {
        return `Interactive ${visualizationType.toLowerCase().replace('_', ' ')} showing ${metricType.toLowerCase().replace('_', ' ')} analysis`;
    }
    generateBreadcrumb(level, dataPoint) {
        return [
            { level: Analytics_1.DrillDownLevel.PORTFOLIO, label: 'Portfolio', value: 'Total Portfolio' },
            { level: level, label: dataPoint.label || 'Unknown', value: dataPoint.value }
        ];
    }
    getAvailableDrillDownLevels(metricType, currentLevel) {
        const levels = {
            [Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE]: [
                Analytics_1.DrillDownLevel.PORTFOLIO,
                Analytics_1.DrillDownLevel.ASSET_CLASS,
                Analytics_1.DrillDownLevel.SECTOR,
                Analytics_1.DrillDownLevel.SECURITY
            ],
            [Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION]: [
                Analytics_1.DrillDownLevel.ASSET_CLASS,
                Analytics_1.DrillDownLevel.SECTOR,
                Analytics_1.DrillDownLevel.SECURITY
            ]
        };
        const availableLevels = levels[metricType] || [];
        const currentIndex = availableLevels.indexOf(currentLevel);
        return availableLevels.slice(currentIndex + 1);
    }
    getColorScheme(metricType) {
        switch (metricType) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                return this.colorSchemes.performance;
            case Analytics_1.AnalyticsMetricType.RISK_METRICS:
                return this.colorSchemes.risk;
            case Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION:
                return this.colorSchemes.allocation;
            default:
                return this.colorSchemes.primary;
        }
    }
    getYAxisLabel(metricType) {
        switch (metricType) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                return 'Value ($)';
            case Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION:
                return 'Allocation (%)';
            case Analytics_1.AnalyticsMetricType.RISK_METRICS:
                return 'Risk Value';
            default:
                return 'Value';
        }
    }
    getYAxisFormat(metricType) {
        switch (metricType) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                return '$,.0f';
            case Analytics_1.AnalyticsMetricType.ASSET_ALLOCATION:
                return '.1%';
            case Analytics_1.AnalyticsMetricType.RISK_METRICS:
                return '.2f';
            default:
                return '.2f';
        }
    }
    extractDateRangeFromFilters(filters) {
        const dateFilter = filters.find(f => f.type === 'date_range');
        if (dateFilter && dateFilter.value) {
            return {
                startDate: new Date(dateFilter.value.startDate),
                endDate: new Date(dateFilter.value.endDate)
            };
        }
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);
        return {
            startDate: defaultStartDate,
            endDate: defaultEndDate
        };
    }
    getPeriodFromDays(days) {
        if (days <= 30)
            return Analytics_1.AggregationPeriod.DAILY;
        if (days <= 90)
            return Analytics_1.AggregationPeriod.WEEKLY;
        if (days <= 365)
            return Analytics_1.AggregationPeriod.MONTHLY;
        return Analytics_1.AggregationPeriod.QUARTERLY;
    }
    getStepSize(period) {
        switch (period) {
            case Analytics_1.AggregationPeriod.DAILY: return 1;
            case Analytics_1.AggregationPeriod.WEEKLY: return 7;
            case Analytics_1.AggregationPeriod.MONTHLY: return 30;
            case Analytics_1.AggregationPeriod.QUARTERLY: return 90;
            default: return 1;
        }
    }
    async getVisualization(visualizationId) {
        logger_1.logger.debug('Retrieving visualization', { visualizationId });
        return null;
    }
    async saveVisualization(visualization) {
        logger_1.logger.debug('Saving visualization', { visualizationId: visualization.id });
    }
}
exports.DataVisualizationService = DataVisualizationService;

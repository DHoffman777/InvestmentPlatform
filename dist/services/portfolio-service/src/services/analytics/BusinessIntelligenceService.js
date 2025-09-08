"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessIntelligenceService = void 0;
const crypto_1 = require("crypto");
const Analytics_1 = require("../../models/analytics/Analytics");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class BusinessIntelligenceService {
    eventPublisher;
    reports = new Map();
    biIntegrations = new Map();
    reportTemplates = new Map();
    scheduledReports = new Map();
    constructor(eventPublisher) {
        this.eventPublisher = eventPublisher || new eventPublisher_1.EventPublisher('BusinessIntelligenceService');
        this.initializeReportTemplates();
        this.initializeBIIntegrations();
    }
    async generateReport(request) {
        try {
            logger_1.logger.info('Generating BI report', {
                tenantId: request.tenantId,
                category: request.category,
                reportType: request.reportType
            });
            const metrics = await this.gatherMetrics(request);
            const insights = request.includeInsights ? await this.gatherInsights(request) : [];
            const keyFindings = await this.generateKeyFindings(metrics, insights, request);
            const recommendations = await this.generateRecommendations(keyFindings, request);
            const visualizations = await this.createReportVisualizations(request.category, metrics);
            const report = {
                id: (0, crypto_1.randomUUID)(),
                tenantId: request.tenantId,
                name: request.name,
                description: request.description || this.generateReportDescription(request.category),
                category: request.category,
                reportType: request.reportType,
                visualizations,
                metrics,
                insights,
                keyFindings,
                recommendations,
                generatedAt: new Date(),
                periodCovered: request.periodCovered,
                recipients: request.recipients || [],
                deliveryMethod: 'portal',
                format: request.format || 'html'
            };
            // Store report
            this.reports.set(report.id, report);
            // Trigger delivery if scheduled or on-demand
            if (request.reportType !== 'on_demand') {
                await this.scheduleReportDelivery(report);
            }
            await this.eventPublisher.publish('bi.report.generated', {
                tenantId: request.tenantId,
                reportId: report.id,
                category: request.category,
                recipients: request.recipients?.length || 0
            });
            return report;
        }
        catch (error) {
            logger_1.logger.error('Error generating BI report:', error);
            throw error;
        }
    }
    async generateExecutiveSummary(tenantId, period) {
        try {
            logger_1.logger.info('Generating executive summary', { tenantId, period });
            // Gather performance data
            const performanceData = await this.gatherPerformanceData(tenantId, period);
            const riskData = await this.gatherRiskData(tenantId, period);
            const businessData = await this.gatherBusinessData(tenantId, period);
            const alertsData = await this.gatherAlertsData(tenantId, period);
            const summary = {
                period,
                totalAssets: businessData.totalAssets,
                totalClients: businessData.totalClients,
                performanceHighlights: {
                    bestPerforming: performanceData.topPerformers.slice(0, 5),
                    worstPerforming: performanceData.bottomPerformers.slice(0, 3),
                    avgReturn: performanceData.avgReturn,
                    benchmarkComparison: performanceData.benchmarkComparison
                },
                riskMetrics: {
                    avgVaR: riskData.avgVaR,
                    maxDrawdown: riskData.maxDrawdown,
                    volatility: riskData.volatility,
                    sharpeRatio: riskData.sharpeRatio
                },
                keyAlerts: {
                    high: alertsData.filter(a => a.severity === 'high').length,
                    medium: alertsData.filter(a => a.severity === 'medium').length,
                    low: alertsData.filter(a => a.severity === 'low').length
                },
                businessMetrics: {
                    newClients: businessData.newClients,
                    assetsGrowth: businessData.assetsGrowth,
                    revenueGrowth: businessData.revenueGrowth,
                    clientSatisfaction: businessData.clientSatisfaction
                }
            };
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Error generating executive summary:', error);
            throw error;
        }
    }
    async generateMarketIntelligence() {
        try {
            logger_1.logger.info('Generating market intelligence');
            const marketData = await this.gatherMarketData();
            const sectorData = await this.gatherSectorData();
            const economicData = await this.gatherEconomicData();
            const marketAlerts = await this.generateMarketAlerts();
            const intelligence = {
                marketOverview: {
                    marketCondition: marketData.condition,
                    volatilityLevel: marketData.volatilityLevel,
                    majorIndices: marketData.indices
                },
                sectorAnalysis: sectorData,
                economicIndicators: economicData,
                alerts: marketAlerts
            };
            return intelligence;
        }
        catch (error) {
            logger_1.logger.error('Error generating market intelligence:', error);
            throw error;
        }
    }
    async generateClientAnalysis(tenantId, period) {
        try {
            logger_1.logger.info('Generating client analysis', { tenantId, period });
            const demographicsData = await this.gatherClientDemographics(tenantId, period);
            const satisfactionData = await this.gatherSatisfactionMetrics(tenantId, period);
            const engagementData = await this.gatherEngagementMetrics(tenantId, period);
            const opportunitiesData = await this.identifyGrowthOpportunities(tenantId, period);
            const analysis = {
                demographics: demographicsData,
                satisfactionMetrics: satisfactionData,
                engagementMetrics: engagementData,
                growthOpportunities: opportunitiesData
            };
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error generating client analysis:', error);
            throw error;
        }
    }
    async configureBIIntegration(tenantId, config) {
        try {
            logger_1.logger.info('Configuring BI integration', { tenantId, provider: config.provider });
            const fullConfig = {
                ...config,
                lastSync: undefined
            };
            this.biIntegrations.set(tenantId, fullConfig);
            // Test connection
            if (config.enabled) {
                await this.testBIConnection(fullConfig);
            }
            await this.eventPublisher.publish('bi.integration.configured', {
                tenantId,
                provider: config.provider,
                enabled: config.enabled
            });
            return fullConfig;
        }
        catch (error) {
            logger_1.logger.error('Error configuring BI integration:', error);
            throw error;
        }
    }
    async syncWithBITool(tenantId) {
        try {
            const config = this.biIntegrations.get(tenantId);
            if (!config || !config.enabled) {
                throw new Error('BI integration not configured or disabled');
            }
            logger_1.logger.info('Syncing with BI tool', { tenantId, provider: config.provider });
            // Gather data for sync
            const syncData = await this.prepareBISyncData(tenantId);
            // Push data to BI tool
            await this.pushDataToBITool(config, syncData);
            // Update last sync time
            config.lastSync = new Date();
            this.biIntegrations.set(tenantId, config);
            await this.eventPublisher.publish('bi.sync.completed', {
                tenantId,
                provider: config.provider,
                recordsCount: syncData.totalRecords,
                syncTime: new Date()
            });
        }
        catch (error) {
            logger_1.logger.error('Error syncing with BI tool:', error);
            throw error;
        }
    }
    async scheduleAutomatedReports(tenantId, reportConfigs) {
        try {
            logger_1.logger.info('Scheduling automated reports', { tenantId, configCount: reportConfigs.length });
            for (const config of reportConfigs) {
                const scheduleId = `${tenantId}_${config.category}_${config.frequency}`;
                // Clear existing schedule if any
                const existingTimeout = this.scheduledReports.get(scheduleId);
                if (existingTimeout) {
                    clearInterval(existingTimeout);
                }
                // Create new schedule
                const interval = this.getScheduleInterval(config.frequency);
                const timeout = setInterval(async () => {
                    await this.generateScheduledReport(tenantId, config);
                }, interval);
                this.scheduledReports.set(scheduleId, timeout);
            }
            await this.eventPublisher.publish('bi.reports.scheduled', {
                tenantId,
                reportCount: reportConfigs.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error scheduling automated reports:', error);
            throw error;
        }
    }
    async getReportHistory(tenantId, category, limit = 50) {
        let reports = Array.from(this.reports.values()).filter(report => report.tenantId === tenantId);
        if (category) {
            reports = reports.filter(report => report.category === category);
        }
        return reports
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
            .slice(0, limit);
    }
    async exportReport(reportId, format) {
        try {
            const report = this.reports.get(reportId);
            if (!report) {
                throw new Error('Report not found');
            }
            logger_1.logger.info('Exporting report', { reportId, format });
            let content;
            let mimeType;
            let filename;
            switch (format) {
                case 'pdf':
                    content = await this.generatePDFReport(report);
                    mimeType = 'application/pdf';
                    filename = `${report.name}_${report.generatedAt.toISOString().split('T')[0]}.pdf`;
                    break;
                case 'excel':
                    content = await this.generateExcelReport(report);
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    filename = `${report.name}_${report.generatedAt.toISOString().split('T')[0]}.xlsx`;
                    break;
                case 'json':
                    content = JSON.stringify(report, null, 2);
                    mimeType = 'application/json';
                    filename = `${report.name}_${report.generatedAt.toISOString().split('T')[0]}.json`;
                    break;
                case 'html':
                    content = await this.generateHTMLReport(report);
                    mimeType = 'text/html';
                    filename = `${report.name}_${report.generatedAt.toISOString().split('T')[0]}.html`;
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            return { content, mimeType, filename };
        }
        catch (error) {
            logger_1.logger.error('Error exporting report:', error);
            throw error;
        }
    }
    async gatherMetrics(request) {
        // Mock metrics gathering based on report category
        const baseMetrics = [];
        switch (request.category) {
            case 'executive_summary':
                baseMetrics.push(this.createMetric('Total Assets', Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE, 125000000), this.createMetric('Total Clients', Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE, 342), this.createMetric('Average Return', Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE, 8.5), this.createMetric('Risk-Adjusted Return', Analytics_1.AnalyticsMetricType.RISK_METRICS, 1.2));
                break;
            case 'performance_analysis':
                baseMetrics.push(this.createMetric('Portfolio Return', Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE, 9.2), this.createMetric('Benchmark Return', Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE, 7.8), this.createMetric('Alpha', Analytics_1.AnalyticsMetricType.ATTRIBUTION_ANALYSIS, 1.4), this.createMetric('Beta', Analytics_1.AnalyticsMetricType.RISK_METRICS, 0.95));
                break;
            case 'risk_assessment':
                baseMetrics.push(this.createMetric('VaR 95%', Analytics_1.AnalyticsMetricType.RISK_METRICS, -2.1), this.createMetric('Max Drawdown', Analytics_1.AnalyticsMetricType.RISK_METRICS, -5.8), this.createMetric('Volatility', Analytics_1.AnalyticsMetricType.RISK_METRICS, 12.4), this.createMetric('Sharpe Ratio', Analytics_1.AnalyticsMetricType.RISK_METRICS, 1.18));
                break;
        }
        return baseMetrics;
    }
    async gatherInsights(request) {
        // Mock insights gathering - would integrate with ML insights service
        return [
            {
                id: (0, crypto_1.randomUUID)(),
                type: 'optimization_suggestion',
                title: 'Portfolio Rebalancing Opportunity',
                description: 'Analysis suggests rebalancing could improve risk-adjusted returns by 0.3%',
                confidence: 0.85,
                impact: 'medium',
                category: 'performance',
                entities: { portfolios: request.entities?.portfolios || [] },
                insights: [
                    {
                        key: 'expected_improvement',
                        value: 0.3,
                        explanation: 'Expected annual return improvement through rebalancing'
                    }
                ],
                recommendations: [
                    {
                        action: 'Reduce technology allocation by 3%',
                        reasoning: 'Current overweight position increases concentration risk',
                        expectedImpact: 'Risk reduction with minimal return impact',
                        priority: 'medium'
                    }
                ],
                supportingData: {},
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        ];
    }
    async generateKeyFindings(metrics, insights, request) {
        const findings = [];
        // Analyze metrics for key findings
        metrics.forEach(metric => {
            if (metric.changePercent && Math.abs(metric.changePercent) > 10) {
                findings.push({
                    title: `Significant ${metric.name} Change`,
                    description: `${metric.name} changed by ${metric.changePercent.toFixed(1)}% from previous period`,
                    impact: metric.changePercent > 0 ? 'positive' : 'negative',
                    severity: Math.abs(metric.changePercent) > 20 ? 'high' : 'medium'
                });
            }
        });
        // Add insights as findings
        insights.forEach(insight => {
            if (insight.impact === 'high') {
                findings.push({
                    title: insight.title,
                    description: insight.description,
                    impact: 'positive', // Most insights are opportunities
                    severity: 'medium'
                });
            }
        });
        return findings;
    }
    async generateRecommendations(keyFindings, request) {
        const recommendations = [];
        // Generate recommendations based on findings
        keyFindings.forEach(finding => {
            if (finding.impact === 'negative' && finding.severity === 'high') {
                recommendations.push({
                    title: `Address ${finding.title}`,
                    description: `Immediate action required to address ${finding.description.toLowerCase()}`,
                    priority: 'high',
                    timeframe: '1-2 weeks'
                });
            }
            else if (finding.impact === 'positive') {
                recommendations.push({
                    title: `Capitalize on ${finding.title}`,
                    description: `Consider strategies to leverage ${finding.description.toLowerCase()}`,
                    priority: 'medium',
                    timeframe: '2-4 weeks'
                });
            }
        });
        // Add category-specific recommendations
        switch (request.category) {
            case 'performance_analysis':
                recommendations.push({
                    title: 'Quarterly Performance Review',
                    description: 'Schedule detailed performance attribution analysis with portfolio managers',
                    priority: 'medium',
                    timeframe: '2 weeks'
                });
                break;
            case 'risk_assessment':
                recommendations.push({
                    title: 'Risk Limit Review',
                    description: 'Review and update risk limits based on current market conditions',
                    priority: 'high',
                    timeframe: '1 week'
                });
                break;
        }
        return recommendations;
    }
    async createReportVisualizations(category, metrics) {
        // Return visualization IDs that would be created by the visualization service
        const visualizations = [];
        switch (category) {
            case 'executive_summary':
                visualizations.push('exec-dashboard-overview', 'performance-trend-chart', 'asset-allocation-pie', 'risk-gauge');
                break;
            case 'performance_analysis':
                visualizations.push('performance-comparison-chart', 'attribution-waterfall', 'rolling-returns-chart', 'benchmark-tracking');
                break;
            case 'risk_assessment':
                visualizations.push('var-trend-chart', 'risk-contribution-heatmap', 'correlation-matrix', 'stress-test-results');
                break;
        }
        return visualizations;
    }
    createMetric(name, type, value, previousValue) {
        const changeValue = previousValue ? value - previousValue : 0;
        const changePercent = previousValue ? (changeValue / previousValue) * 100 : 0;
        return {
            id: (0, crypto_1.randomUUID)(),
            name,
            type,
            value,
            previousValue,
            changeValue,
            changePercent,
            unit: this.getMetricUnit(type),
            description: `${name} metric for reporting period`,
            calculationMethod: 'Standard calculation',
            lastUpdated: new Date(),
            confidence: 0.95
        };
    }
    getMetricUnit(type) {
        switch (type) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                return '%';
            case Analytics_1.AnalyticsMetricType.RISK_METRICS:
                return type.includes('RATIO') ? 'ratio' : '%';
            default:
                return '';
        }
    }
    generateReportDescription(category) {
        const descriptions = {
            executive_summary: 'High-level overview of portfolio performance, risk metrics, and key business indicators',
            performance_analysis: 'Detailed analysis of portfolio performance including attribution and benchmark comparison',
            risk_assessment: 'Comprehensive risk analysis including VaR, stress testing, and limit monitoring',
            client_analysis: 'Analysis of client demographics, satisfaction, and growth opportunities',
            market_intelligence: 'Market overview, sector analysis, and economic indicator summary'
        };
        return descriptions[category] || 'Business intelligence report';
    }
    async gatherPerformanceData(tenantId, period) {
        // Mock performance data gathering
        return {
            topPerformers: [
                { name: 'Growth Portfolio A', return: 12.5 },
                { name: 'Tech Fund B', return: 11.8 },
                { name: 'International Equity', return: 9.2 }
            ],
            bottomPerformers: [
                { name: 'Conservative Fund', return: 2.1 },
                { name: 'Bond Portfolio', return: 1.8 }
            ],
            avgReturn: 8.5,
            benchmarkComparison: 1.2
        };
    }
    async gatherRiskData(tenantId, period) {
        return {
            avgVaR: -2.1,
            maxDrawdown: -5.8,
            volatility: 12.4,
            sharpeRatio: 1.18
        };
    }
    async gatherBusinessData(tenantId, period) {
        return {
            totalAssets: 125000000,
            totalClients: 342,
            newClients: 28,
            assetsGrowth: 8.5,
            revenueGrowth: 12.3,
            clientSatisfaction: 4.2
        };
    }
    async gatherAlertsData(tenantId, period) {
        return [
            { severity: 'high', type: 'risk_breach' },
            { severity: 'medium', type: 'performance_lag' },
            { severity: 'low', type: 'rebalancing_needed' }
        ];
    }
    async gatherMarketData() {
        return {
            condition: 'bullish',
            volatilityLevel: 'medium',
            indices: [
                { name: 'S&P 500', value: 4200, change: 25, changePercent: 0.6 },
                { name: 'NASDAQ', value: 13500, change: -15, changePercent: -0.1 },
                { name: 'Dow Jones', value: 34000, change: 50, changePercent: 0.15 }
            ]
        };
    }
    async gatherSectorData() {
        return [
            { sector: 'Technology', performance: 15.2, outlook: 'positive', weight: 25.0 },
            { sector: 'Healthcare', performance: 8.7, outlook: 'neutral', weight: 18.5 },
            { sector: 'Financials', performance: 12.1, outlook: 'positive', weight: 15.2 }
        ];
    }
    async gatherEconomicData() {
        return [
            { indicator: 'GDP Growth', value: 2.1, previousValue: 1.8, impact: 'positive' },
            { indicator: 'Inflation Rate', value: 3.2, previousValue: 2.8, impact: 'negative' },
            { indicator: 'Unemployment', value: 3.8, previousValue: 4.1, impact: 'positive' }
        ];
    }
    async generateMarketAlerts() {
        return [
            {
                type: 'opportunity',
                message: 'Small-cap value stocks showing strong momentum',
                priority: 'medium',
                actionRequired: false
            },
            {
                type: 'risk',
                message: 'Rising interest rates may impact bond portfolios',
                priority: 'high',
                actionRequired: true
            }
        ];
    }
    async gatherClientDemographics(tenantId, period) {
        return {
            totalClients: 342,
            newClients: 28,
            clientRetention: 95.2,
            avgAccountSize: 365000,
            clientsByRiskProfile: {
                'Conservative': 125,
                'Moderate': 152,
                'Aggressive': 65
            },
            clientsByAge: {
                '25-35': 45,
                '36-50': 128,
                '51-65': 142,
                '65+': 27
            }
        };
    }
    async gatherSatisfactionMetrics(tenantId, period) {
        return {
            overallSatisfaction: 4.2,
            npsScore: 72,
            responseRate: 68.5,
            keyDrivers: ['Performance', 'Communication', 'Service Quality']
        };
    }
    async gatherEngagementMetrics(tenantId, period) {
        return {
            loginFrequency: 12.5,
            documentViews: 8.2,
            messagesSent: 3.4,
            meetingsScheduled: 1.8
        };
    }
    async identifyGrowthOpportunities(tenantId, period) {
        return {
            crossSelling: [
                { client: 'Client A', opportunity: 'Trust Services', value: 50000 },
                { client: 'Client B', opportunity: 'Tax Planning', value: 25000 }
            ],
            referralPotential: [
                { client: 'Client C', score: 0.85 },
                { client: 'Client D', score: 0.78 }
            ],
            atRiskClients: [
                { client: 'Client E', riskScore: 0.75, reason: 'Low engagement' }
            ]
        };
    }
    async testBIConnection(config) {
        // Mock connection test
        logger_1.logger.info('Testing BI connection', { provider: config.provider });
        return true;
    }
    async prepareBISyncData(tenantId) {
        // Mock data preparation for BI sync
        return {
            portfolios: [],
            clients: [],
            metrics: [],
            totalRecords: 1500
        };
    }
    async pushDataToBITool(config, data) {
        // Mock data push to BI tool
        logger_1.logger.info('Pushing data to BI tool', { provider: config.provider, records: data.totalRecords });
    }
    getScheduleInterval(frequency) {
        const intervals = {
            daily: 24 * 60 * 60 * 1000, // 24 hours
            weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
            monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
            quarterly: 90 * 24 * 60 * 60 * 1000 // 90 days
        };
        return intervals[frequency] || intervals.monthly;
    }
    async generateScheduledReport(tenantId, config) {
        try {
            const now = new Date();
            const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
            const request = {
                tenantId,
                reportType: 'scheduled',
                category: config.category,
                name: `Scheduled ${config.category} Report`,
                periodCovered: { startDate, endDate: now },
                includeInsights: true,
                format: config.format,
                recipients: config.recipients
            };
            await this.generateReport(request);
        }
        catch (error) {
            logger_1.logger.error('Error generating scheduled report:', error);
        }
    }
    async scheduleReportDelivery(report) {
        // Mock report delivery scheduling
        logger_1.logger.info('Scheduling report delivery', { reportId: report.id, recipients: report.recipients.length });
    }
    async generatePDFReport(report) {
        // Mock PDF generation - would use a library like puppeteer or PDFKit
        return 'Mock PDF content';
    }
    async generateExcelReport(report) {
        // Mock Excel generation - would use a library like ExcelJS
        return 'Mock Excel content';
    }
    async generateHTMLReport(report) {
        // Mock HTML generation with embedded charts and styling
        return `
      <html>
        <head><title>${report.name}</title></head>
        <body>
          <h1>${report.name}</h1>
          <p>Generated: ${report.generatedAt.toISOString()}</p>
          <h2>Key Findings</h2>
          ${report.keyFindings.map(f => `<p><strong>${f.title}:</strong> ${f.description}</p>`).join('')}
          <h2>Recommendations</h2>
          ${report.recommendations.map(r => `<p><strong>${r.title}:</strong> ${r.description}</p>`).join('')}
        </body>
      </html>
    `;
    }
    initializeReportTemplates() {
        this.reportTemplates.set('executive_summary', {
            sections: ['overview', 'performance', 'risk', 'recommendations'],
            visualizations: ['dashboard', 'trends', 'allocation'],
            defaultMetrics: ['total_assets', 'avg_return', 'risk_score']
        });
        this.reportTemplates.set('performance_analysis', {
            sections: ['summary', 'attribution', 'benchmark_comparison', 'insights'],
            visualizations: ['performance_chart', 'attribution_waterfall', 'rolling_returns'],
            defaultMetrics: ['total_return', 'alpha', 'beta', 'sharpe_ratio']
        });
    }
    initializeBIIntegrations() {
        // Initialize default BI integration configurations
        this.biIntegrations.set('default', {
            provider: 'power_bi',
            connectionString: 'mock://connection',
            refreshSchedule: '0 6 * * *', // Daily at 6 AM
            dataSetIds: ['portfolio_data', 'client_data', 'market_data'],
            enabled: false,
            autoRefresh: true
        });
    }
}
exports.BusinessIntelligenceService = BusinessIntelligenceService;

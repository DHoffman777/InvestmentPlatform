"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAReportingService = void 0;
const events_1 = require("events");
const SLADataModel_1 = require("./SLADataModel");
class SLAReportingService extends events_1.EventEmitter {
    reports = new Map();
    templates = new Map();
    dashboards = new Map();
    scheduledJobs = new Map();
    config;
    reportGenerationQueue = [];
    constructor(config) {
        super();
        this.config = config;
        this.initializeDefaultTemplates();
        this.initializeDefaultDashboards();
        this.startScheduledReporting();
    }
    async generateReport(request) {
        const template = request.templateId ?
            this.templates.get(request.templateId) :
            this.getDefaultTemplate(request.type);
        if (!template) {
            throw new Error(`Template not found: ${request.templateId}`);
        }
        // Collect data
        const reportData = await this.collectReportData({
            timeRange: request.timeRange,
            slaIds: request.slaIds || [],
            serviceIds: request.serviceIds || [],
            filters: request.filters || []
        });
        // Generate summary
        const summary = this.generateReportSummary(reportData);
        // Generate charts
        const charts = await this.generateReportCharts(template, reportData, request.timeRange);
        // Create report
        const report = {
            id: this.generateReportId(),
            type: request.type,
            title: request.title,
            description: request.description || '',
            timeRange: request.timeRange,
            slaIds: request.slaIds || [],
            serviceIds: request.serviceIds || [],
            data: reportData,
            summary,
            charts,
            recommendations: await this.generateRecommendations(reportData),
            generatedAt: new Date(),
            generatedBy: request.requestedBy,
            format: request.format || this.config.defaultFormats,
            recipients: request.recipients || [],
            deliveryStatus: {}
        };
        // Store report
        this.reports.set(report.id, report);
        // Export in requested formats
        for (const format of report.format) {
            try {
                await this.exportReport(report, { format: format, includeCharts: true, includeRawData: false });
                report.deliveryStatus[format] = 'sent';
            }
            catch (error) {
                report.deliveryStatus[format] = 'failed';
                this.emit('reportExportFailed', { reportId: report.id, format, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }
        this.emit('reportGenerated', { reportId: report.id, report });
        return report;
    }
    async createDashboard(config) {
        const dashboard = {
            id: this.generateDashboardId(),
            name: config.name,
            description: config.description,
            widgets: config.widgets.map(widget => ({
                ...widget,
                id: this.generateWidgetId(),
                dataSource: widget.dataSource || 'default'
            })),
            layout: {
                columns: config.layout.columns || 12,
                rows: Math.ceil(config.widgets.length / (config.layout.columns || 12)),
                gridSize: 50,
                responsive: true
            },
            refreshInterval: config.layout.refreshInterval || 30000,
            permissions: config.permissions.map(p => ({
                userId: p.userId,
                role: p.role
            })),
            filters: [],
            isDefault: config.isDefault || false,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: config.createdBy
        };
        this.dashboards.set(dashboard.id, dashboard);
        this.emit('dashboardCreated', { dashboardId: dashboard.id, dashboard });
        return dashboard;
    }
    async getDashboardData(dashboardId, userId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard ${dashboardId} not found`);
        }
        // Check permissions
        const hasPermission = dashboard.permissions.some(p => p.userId === userId);
        if (!hasPermission) {
            throw new Error(`User ${userId} does not have access to dashboard ${dashboardId}`);
        }
        // Collect data for each widget
        const widgetData = {};
        for (const widget of dashboard.widgets) {
            try {
                widgetData[widget.id] = await this.getWidgetData(widget);
            }
            catch (error) {
                console.warn(`Failed to load data for widget ${widget.id}:`, error instanceof Error ? error.message : 'Unknown error');
                widgetData[widget.id] = { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
        return { dashboard, widgetData };
    }
    async getWidgetData(widget) {
        switch (widget.type) {
            case 'metric_card':
                return this.getMetricCardData(widget);
            case 'chart':
                return this.getChartData(widget);
            case 'table':
                return this.getTableData(widget);
            case 'status_board':
                return this.getStatusBoardData(widget);
            case 'trend_indicator':
                return this.getTrendIndicatorData(widget);
            case 'alert_list':
                return this.getAlertListData(widget);
            default:
                throw new Error(`Unsupported widget type: ${widget.type}`);
        }
    }
    async scheduleReport(templateId, schedule, recipients) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        // Cancel existing schedule if any
        if (this.scheduledJobs.has(templateId)) {
            clearInterval(this.scheduledJobs.get(templateId));
        }
        const interval = this.calculateScheduleInterval(schedule);
        const job = setInterval(async () => {
            try {
                await this.generateScheduledReport(templateId, recipients);
            }
            catch (error) {
                this.emit('scheduledReportFailed', { templateId, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }, interval);
        this.scheduledJobs.set(templateId, job);
        template.scheduling = { ...schedule, lastRun: new Date(), nextRun: new Date(Date.now() + interval) };
        this.emit('reportScheduled', { templateId, schedule });
    }
    async exportReport(report, options) {
        switch (options.format) {
            case 'pdf':
                return this.exportToPDF(report, options);
            case 'html':
                return this.exportToHTML(report, options);
            case 'excel':
                return this.exportToExcel(report, options);
            case 'csv':
                return this.exportToCSV(report, options);
            case 'json':
                return this.exportToJSON(report, options);
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }
    async getReportHistory(options = {}) {
        let reports = Array.from(this.reports.values());
        if (options.type) {
            reports = reports.filter(r => r.type === options.type);
        }
        if (options.generatedBy) {
            reports = reports.filter(r => r.generatedBy === options.generatedBy);
        }
        if (options.timeRange) {
            reports = reports.filter(r => r.generatedAt >= options.timeRange.start &&
                r.generatedAt <= options.timeRange.end);
        }
        reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
        if (options.limit) {
            reports = reports.slice(0, options.limit);
        }
        return reports;
    }
    async collectReportData(request) {
        // This would typically query the SLA tracking service and other data sources
        // For now, return mock data structure
        return {
            slaMetrics: await this.getSLAMetrics(request),
            complianceScores: await this.getComplianceScores(request),
            breaches: await this.getBreaches(request),
            trends: await this.getTrends(request),
            penalties: await this.getPenalties(request),
            customData: {}
        };
    }
    generateReportSummary(data) {
        const totalSLAs = data.slaMetrics.length;
        const compliantSLAs = data.slaMetrics.filter(m => m.status === 'compliant').length;
        const breachedSLAs = data.slaMetrics.filter(m => m.status === 'breached').length;
        const atRiskSLAs = data.slaMetrics.filter(m => m.status === 'at_risk').length;
        const overallComplianceRate = totalSLAs > 0 ? (compliantSLAs / totalSLAs) * 100 : 0;
        const totalBreaches = data.breaches.length;
        const totalPenalties = data.penalties.reduce((sum, p) => sum + (p.amount || 0), 0);
        const responseTimes = data.slaMetrics
            .filter(m => m.unit === 'ms')
            .map(m => m.currentValue);
        const averageResponseTime = responseTimes.length > 0 ?
            responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0;
        const uptimeMetrics = data.slaMetrics
            .filter(m => m.unit === '%' && m.currentValue <= 100)
            .map(m => m.currentValue);
        const uptimePercentage = uptimeMetrics.length > 0 ?
            uptimeMetrics.reduce((sum, up) => sum + up, 0) / uptimeMetrics.length : 0;
        const keyInsights = this.generateKeyInsights(data);
        return {
            totalSLAs,
            compliantSLAs,
            breachedSLAs,
            atRiskSLAs,
            overallComplianceRate,
            totalBreaches,
            totalPenalties,
            averageResponseTime,
            uptimePercentage,
            keyInsights
        };
    }
    async generateReportCharts(template, data, timeRange) {
        const charts = [];
        for (const chartConfig of template.chartConfigurations) {
            const chart = {
                id: chartConfig.id,
                title: chartConfig.title,
                type: (chartConfig.type === 'trend' ? 'line' : chartConfig.type),
                data: await this.generateChartData(chartConfig, data),
                configuration: {
                    xAxis: chartConfig.xAxis,
                    yAxis: chartConfig.yAxis,
                    styling: chartConfig.styling
                },
                timeRange
            };
            charts.push(chart);
        }
        return charts;
    }
    async generateChartData(config, data) {
        switch (config.type) {
            case 'line':
                return this.generateLineChartData(config, data);
            case 'bar':
                return this.generateBarChartData(config, data);
            case 'pie':
                return this.generatePieChartData(config, data);
            case 'gauge':
                return this.generateGaugeChartData(config, data);
            default:
                return [];
        }
    }
    generateLineChartData(config, data) {
        // Generate time series data for compliance rates
        return data.slaMetrics.map(metric => ({
            x: metric.calculatedAt,
            y: metric.compliancePercentage,
            label: metric.slaId
        }));
    }
    generateBarChartData(config, data) {
        // Generate bar chart data for SLA status distribution
        const statusCounts = data.slaMetrics.reduce((acc, metric) => {
            acc[metric.status] = (acc[metric.status] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(statusCounts).map(([status, count]) => ({
            x: status,
            y: count,
            label: status
        }));
    }
    generatePieChartData(config, data) {
        // Generate pie chart data for breach distribution by severity
        const severityCounts = data.breaches.reduce((acc, breach) => {
            acc[breach.severity] = (acc[breach.severity] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(severityCounts).map(([severity, count]) => ({
            label: severity,
            value: count
        }));
    }
    generateGaugeChartData(config, data) {
        // Generate gauge data for overall compliance rate
        const totalSLAs = data.slaMetrics.length;
        const compliantSLAs = data.slaMetrics.filter(m => m.status === 'compliant').length;
        const complianceRate = totalSLAs > 0 ? (compliantSLAs / totalSLAs) * 100 : 0;
        return [{
                value: complianceRate,
                min: 0,
                max: 100,
                threshold: 95,
                label: 'Overall Compliance Rate'
            }];
    }
    async generateRecommendations(data) {
        const recommendations = [];
        // Analyze compliance rates
        const lowComplianceMetrics = data.slaMetrics.filter(m => m.compliancePercentage < 95);
        if (lowComplianceMetrics.length > 0) {
            recommendations.push(`${lowComplianceMetrics.length} SLAs have compliance rates below 95%. Consider reviewing thresholds or improving service performance.`);
        }
        // Analyze breach patterns
        const frequentBreaches = data.breaches.filter(b => {
            const recentBreaches = data.breaches.filter(rb => rb.slaId === b.slaId &&
                rb.startTime.getTime() > (Date.now() - (7 * 24 * 60 * 60 * 1000)));
            return recentBreaches.length > 3;
        });
        if (frequentBreaches.length > 0) {
            recommendations.push(`${frequentBreaches.length} SLAs have frequent breaches (>3 in last 7 days). Investigate root causes and implement preventive measures.`);
        }
        // Analyze response times
        const slowResponseTimes = data.slaMetrics.filter(m => m.unit === 'ms' && m.currentValue > 1000);
        if (slowResponseTimes.length > 0) {
            recommendations.push(`${slowResponseTimes.length} services have response times > 1000ms. Consider performance optimization.`);
        }
        return recommendations;
    }
    generateKeyInsights(data) {
        const insights = [];
        // Top performing SLA
        const bestPerformingSLA = data.slaMetrics.reduce((best, current) => current.compliancePercentage > best.compliancePercentage ? current : best);
        insights.push(`Best performing SLA: ${bestPerformingSLA.slaId} with ${bestPerformingSLA.compliancePercentage.toFixed(1)}% compliance`);
        // Most problematic SLA
        const worstPerformingSLA = data.slaMetrics.reduce((worst, current) => current.compliancePercentage < worst.compliancePercentage ? current : worst);
        insights.push(`Most problematic SLA: ${worstPerformingSLA.slaId} with ${worstPerformingSLA.compliancePercentage.toFixed(1)}% compliance`);
        // Breach trends
        const recentBreaches = data.breaches.filter(b => b.startTime.getTime() > (Date.now() - (24 * 60 * 60 * 1000)));
        insights.push(`${recentBreaches.length} breaches occurred in the last 24 hours`);
        return insights;
    }
    async getMetricCardData(widget) {
        // Mock metric card data
        return {
            value: 99.5,
            unit: '%',
            trend: 'up',
            trendValue: 0.2,
            status: 'good'
        };
    }
    async getChartData(widget) {
        // Mock chart data
        return {
            data: [
                { x: '2024-01-01', y: 99.2 },
                { x: '2024-01-02', y: 99.5 },
                { x: '2024-01-03', y: 99.1 },
                { x: '2024-01-04', y: 99.8 },
                { x: '2024-01-05', y: 99.6 }
            ],
            type: 'line'
        };
    }
    async getTableData(widget) {
        // Mock table data
        return {
            headers: ['SLA', 'Status', 'Compliance', 'Last Breach'],
            rows: [
                ['API Response Time', 'Compliant', '99.5%', '2 days ago'],
                ['System Uptime', 'At Risk', '98.2%', '1 hour ago'],
                ['Data Accuracy', 'Compliant', '99.9%', '1 week ago']
            ]
        };
    }
    async getStatusBoardData(widget) {
        // Mock status board data
        return {
            services: [
                { name: 'API Gateway', status: 'healthy', uptime: '99.9%' },
                { name: 'Database', status: 'warning', uptime: '98.5%' },
                { name: 'Cache', status: 'healthy', uptime: '99.8%' }
            ]
        };
    }
    async getTrendIndicatorData(widget) {
        // Mock trend indicator data
        return {
            current: 99.5,
            previous: 99.2,
            trend: 'improving',
            changePercent: 0.3
        };
    }
    async getAlertListData(widget) {
        // Mock alert list data
        return {
            alerts: [
                { id: '1', severity: 'high', message: 'Response time SLA breached', timestamp: new Date() },
                { id: '2', severity: 'medium', message: 'Uptime approaching threshold', timestamp: new Date() }
            ]
        };
    }
    async getSLAMetrics(request) {
        // Mock SLA metrics - would query actual tracking service
        return [];
    }
    async getComplianceScores(request) {
        // Mock compliance scores
        return [];
    }
    async getBreaches(request) {
        // Mock breaches
        return [];
    }
    async getTrends(request) {
        // Mock trends
        return [];
    }
    async getPenalties(request) {
        // Mock penalties
        return [];
    }
    async exportToPDF(report, options) {
        // Mock PDF export
        console.log(`Exporting report ${report.id} to PDF`);
        return Buffer.from('PDF content');
    }
    async exportToHTML(report, options) {
        // Mock HTML export
        console.log(`Exporting report ${report.id} to HTML`);
        return Buffer.from('<html>HTML content</html>');
    }
    async exportToExcel(report, options) {
        // Mock Excel export
        console.log(`Exporting report ${report.id} to Excel`);
        return Buffer.from('Excel content');
    }
    async exportToCSV(report, options) {
        // Mock CSV export
        console.log(`Exporting report ${report.id} to CSV`);
        return Buffer.from('CSV content');
    }
    async exportToJSON(report, options) {
        // JSON export
        return Buffer.from(JSON.stringify(report, null, 2));
    }
    getDefaultTemplate(type) {
        return Array.from(this.templates.values()).find(t => t.type === type) || null;
    }
    calculateScheduleInterval(schedule) {
        switch (schedule.frequency) {
            case 'daily':
                return 24 * 60 * 60 * 1000; // 24 hours
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000; // 7 days
            case 'monthly':
                return 30 * 24 * 60 * 60 * 1000; // 30 days
            case 'quarterly':
                return 90 * 24 * 60 * 60 * 1000; // 90 days
            default:
                return 24 * 60 * 60 * 1000;
        }
    }
    async generateScheduledReport(templateId, recipients) {
        const template = this.templates.get(templateId);
        if (!template)
            return;
        const endDate = new Date();
        const startDate = new Date();
        // Set time range based on report frequency
        switch (template.type) {
            case SLADataModel_1.SLAReportType.DAILY:
                startDate.setDate(endDate.getDate() - 1);
                break;
            case SLADataModel_1.SLAReportType.WEEKLY:
                startDate.setDate(endDate.getDate() - 7);
                break;
            case SLADataModel_1.SLAReportType.MONTHLY:
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 1);
        }
        await this.generateReport({
            templateId,
            type: template.type,
            title: `Scheduled ${template.name}`,
            timeRange: { start: startDate, end: endDate },
            recipients,
            requestedBy: 'system'
        });
    }
    initializeDefaultTemplates() {
        const defaultTemplates = [
            {
                id: 'daily-summary',
                name: 'Daily SLA Summary',
                type: SLADataModel_1.SLAReportType.DAILY,
                sections: [
                    { id: 'summary', title: 'Executive Summary', type: 'summary', configuration: {}, order: 1 },
                    { id: 'metrics', title: 'Key Metrics', type: 'metrics', configuration: {}, order: 2 },
                    { id: 'breaches', title: 'Breach Analysis', type: 'analysis', configuration: {}, order: 3 }
                ],
                chartConfigurations: [
                    {
                        id: 'compliance-trend',
                        type: 'line',
                        title: 'Compliance Trend',
                        dataQuery: 'sla_metrics',
                        xAxis: 'time',
                        yAxis: 'compliance_percentage',
                        styling: { color: '#2196F3' }
                    }
                ],
                filters: [],
                scheduling: {
                    enabled: true,
                    frequency: 'daily',
                    time: '08:00',
                    timezone: 'UTC'
                },
                recipients: [],
                format: ['pdf', 'html']
            }
        ];
        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }
    initializeDefaultDashboards() {
        // Initialize default executive dashboard
        this.createDashboard({
            name: 'Executive SLA Dashboard',
            description: 'High-level SLA performance overview',
            widgets: [
                {
                    id: 'overall-compliance',
                    type: 'metric_card',
                    title: 'Overall Compliance',
                    size: { width: 3, height: 2 },
                    position: { x: 0, y: 0 },
                    dataSource: 'sla-metrics',
                    configuration: { metric: 'overall_compliance_rate' }
                },
                {
                    id: 'active-breaches',
                    type: 'metric_card',
                    title: 'Active Breaches',
                    size: { width: 3, height: 2 },
                    position: { x: 3, y: 0 },
                    dataSource: 'breach-data',
                    configuration: { metric: 'active_breach_count' }
                }
            ],
            layout: {
                layout: 'grid',
                columns: 12,
                theme: 'light',
                refreshInterval: 30000,
                enableRealTime: true,
                widgets: []
            },
            permissions: [
                { userId: 'admin', role: 'admin' }
            ],
            isDefault: true,
            createdBy: 'system'
        });
    }
    startScheduledReporting() {
        if (!this.config.enableScheduledReports)
            return;
        // Check for scheduled reports every hour
        setInterval(() => {
            for (const [templateId, template] of this.templates) {
                if (template.scheduling.enabled && this.shouldRunScheduledReport(template)) {
                    this.generateScheduledReport(templateId, template.recipients);
                }
            }
        }, 60 * 60 * 1000); // 1 hour
    }
    shouldRunScheduledReport(template) {
        if (!template.scheduling.nextRun)
            return true;
        return new Date() >= template.scheduling.nextRun;
    }
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateDashboardId() {
        return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateWidgetId() {
        return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
        // Cancel all scheduled jobs
        for (const job of this.scheduledJobs.values()) {
            clearInterval(job);
        }
        this.scheduledJobs.clear();
        this.reports.clear();
        this.templates.clear();
        this.dashboards.clear();
        this.emit('shutdown');
    }
}
exports.SLAReportingService = SLAReportingService;

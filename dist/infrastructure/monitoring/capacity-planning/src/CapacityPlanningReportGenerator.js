"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapacityPlanningReportGenerator = void 0;
const events_1 = require("events");
const CapacityPlanningDataModel_1 = require("./CapacityPlanningDataModel");
class CapacityPlanningReportGenerator extends events_1.EventEmitter {
    reports = new Map();
    templates = new Map();
    scheduledReports = new Map();
    config;
    reportRenderer;
    chartGenerator;
    dataAggregator;
    constructor(config) {
        super();
        this.config = config;
        this.reportRenderer = new ReportRenderer(config);
        this.chartGenerator = new ChartGenerator();
        this.dataAggregator = new DataAggregator();
        this.initializeDefaultTemplates();
        this.startScheduledReports();
    }
    async generateReport(reportConfig) {
        const startTime = Date.now();
        const reportId = this.generateReportId();
        this.emit('reportGenerationStarted', { reportId, type: reportConfig.type });
        try {
            const template = reportConfig.templateId
                ? this.getTemplate(reportConfig.templateId)
                : this.getDefaultTemplate(reportConfig.type);
            if (!template) {
                throw new Error(`No template available for report type ${reportConfig.type}`);
            }
            const reportData = await this.collectReportData(reportConfig.scope);
            const content = await this.generateReportContent(template, reportData);
            const charts = await this.generateReportCharts(template, reportData);
            const report = {
                id: reportId,
                name: reportConfig.name,
                type: reportConfig.type,
                scope: reportConfig.scope,
                content: {
                    summary: content.summary,
                    sections: content.sections,
                    charts,
                    recommendations: reportData.recommendations
                },
                format: reportConfig.format,
                recipients: reportConfig.recipients || [],
                generatedAt: new Date(),
                status: CapacityPlanningDataModel_1.ReportStatus.GENERATING
            };
            this.reports.set(reportId, report);
            const renderedReports = await this.renderReport(report);
            report.status = CapacityPlanningDataModel_1.ReportStatus.COMPLETED;
            if (reportConfig.recipients && reportConfig.recipients.length > 0) {
                await this.distributeReport(report, renderedReports);
            }
            const generationTime = Date.now() - startTime;
            this.emit('reportGenerationCompleted', {
                reportId,
                type: reportConfig.type,
                generationTime,
                formats: reportConfig.format.length
            });
            return report;
        }
        catch (error) {
            this.emit('reportGenerationFailed', { reportId, type: reportConfig.type, error: error.message });
            const failedReport = this.reports.get(reportId);
            if (failedReport) {
                failedReport.status = CapacityPlanningDataModel_1.ReportStatus.FAILED;
            }
            throw error;
        }
    }
    async scheduleReport(reportConfig) {
        const scheduleId = this.generateScheduleId();
        const cronExpression = this.convertScheduleToCron(reportConfig.schedule);
        const nextRun = this.calculateNextRun(reportConfig.schedule);
        const timer = setInterval(async () => {
            try {
                const report = await this.generateReport({
                    name: `${reportConfig.name} - ${new Date().toISOString()}`,
                    type: reportConfig.type,
                    scope: reportConfig.scope,
                    format: reportConfig.format,
                    recipients: reportConfig.recipients,
                    templateId: reportConfig.templateId
                });
                this.emit('scheduledReportGenerated', { scheduleId, reportId: report.id });
            }
            catch (error) {
                this.emit('scheduledReportFailed', { scheduleId, error: error.message });
            }
        }, this.getScheduleInterval(reportConfig.schedule));
        this.scheduledReports.set(scheduleId, timer);
        this.emit('reportScheduled', { scheduleId, nextRun });
        return scheduleId;
    }
    async createReportTemplate(template) {
        const newTemplate = {
            id: template.id || this.generateTemplateId(),
            name: template.name || 'Unnamed Template',
            type: template.type,
            sections: template.sections || [],
            defaultFormat: template.defaultFormat || [CapacityPlanningDataModel_1.ReportFormat.PDF],
            parameters: template.parameters || {}
        };
        await this.validateTemplate(newTemplate);
        this.templates.set(newTemplate.id, newTemplate);
        this.emit('templateCreated', { templateId: newTemplate.id, type: newTemplate.type });
        return newTemplate;
    }
    async generateExecutiveSummaryReport(timeRange) {
        return this.generateReport({
            name: 'Executive Summary - Capacity Planning',
            type: CapacityPlanningDataModel_1.ReportType.EXECUTIVE_SUMMARY,
            scope: {
                timeRange,
                resourceTypes: [CapacityPlanningDataModel_1.ResourceType.SERVER, CapacityPlanningDataModel_1.ResourceType.DATABASE, CapacityPlanningDataModel_1.ResourceType.CONTAINER]
            },
            format: [CapacityPlanningDataModel_1.ReportFormat.PDF, CapacityPlanningDataModel_1.ReportFormat.HTML]
        });
    }
    async generateCostOptimizationReport(resourceIds, timeRange) {
        return this.generateReport({
            name: 'Cost Optimization Analysis',
            type: CapacityPlanningDataModel_1.ReportType.COST_OPTIMIZATION,
            scope: {
                resourceIds,
                timeRange
            },
            format: [CapacityPlanningDataModel_1.ReportFormat.EXCEL, CapacityPlanningDataModel_1.ReportFormat.PDF]
        });
    }
    async generatePerformanceTrendsReport(resourceType, timeRange) {
        return this.generateReport({
            name: 'Performance Trends Analysis',
            type: CapacityPlanningDataModel_1.ReportType.PERFORMANCE_TRENDS,
            scope: {
                resourceTypes: [resourceType],
                timeRange
            },
            format: [CapacityPlanningDataModel_1.ReportFormat.HTML, CapacityPlanningDataModel_1.ReportFormat.JSON]
        });
    }
    async collectReportData(scope) {
        const timeRange = scope.timeRange;
        const resourceMetrics = await this.dataAggregator.getResourceMetrics(scope.resourceIds, scope.resourceTypes, timeRange);
        const trends = await this.dataAggregator.getCapacityTrends(scope.resourceIds, scope.resourceTypes, timeRange);
        const recommendations = await this.dataAggregator.getScalingRecommendations(scope.resourceIds, timeRange);
        const costOptimizations = await this.dataAggregator.getCostOptimizations(scope.resourceIds, timeRange);
        const summary = this.generateDataSummary(resourceMetrics, trends, recommendations, costOptimizations);
        return {
            summary,
            resourceMetrics,
            trends,
            recommendations,
            costOptimizations,
            timeRange
        };
    }
    generateDataSummary(metrics, trends, recommendations, costOptimizations) {
        const resourceIds = new Set(metrics.map(m => m.resourceId));
        const totalResources = resourceIds.size;
        const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / metrics.length;
        const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memory.usage, 0) / metrics.length;
        const healthyResources = resourceIds.size * 0.8;
        const atRiskResources = Math.floor(resourceIds.size * 0.15);
        const overUtilized = metrics.filter(m => m.cpu.usage > 80 || m.memory.usage > 85).length;
        const underUtilized = metrics.filter(m => m.cpu.usage < 20 && m.memory.usage < 30).length;
        const costSavingsOpportunity = costOptimizations.reduce((sum, co) => sum + co.savings.amount, 0);
        const performanceImprovementOpportunity = recommendations.filter(r => r.impact.performance > 0).length;
        const keyFindings = [
            `Average CPU utilization: ${avgCpuUsage.toFixed(1)}%`,
            `Average memory utilization: ${avgMemoryUsage.toFixed(1)}%`,
            `${overUtilized} resources over-utilized`,
            `${underUtilized} resources under-utilized`,
            `${trends.filter(t => t.trend.direction === 'increasing').length} resources showing increasing trends`
        ];
        const topRecommendations = recommendations
            .slice(0, 3)
            .map(r => `${r.type}: ${r.reasoning}`);
        return {
            totalResources,
            healthyResources,
            atRiskResources,
            overUtilized,
            underUtilized,
            costSavingsOpportunity,
            performanceImprovementOpportunity,
            keyFindings,
            topRecommendations
        };
    }
    async generateReportContent(template, data) {
        const sections = [];
        for (const templateSection of template.sections.sort((a, b) => a.order - b.order)) {
            const section = await this.generateSection(templateSection, data);
            sections.push(section);
        }
        return {
            summary: data.summary,
            sections
        };
    }
    async generateSection(templateSection, data) {
        const sectionData = this.extractSectionData(templateSection, data);
        const content = await this.renderSectionContent(templateSection, sectionData);
        return {
            id: templateSection.id,
            title: templateSection.title,
            content,
            data: sectionData,
            visualizations: this.getSectionVisualizations(templateSection),
            order: templateSection.order
        };
    }
    extractSectionData(templateSection, data) {
        switch (templateSection.dataSource) {
            case 'resourceMetrics':
                return data.resourceMetrics;
            case 'trends':
                return data.trends;
            case 'recommendations':
                return data.recommendations;
            case 'costOptimizations':
                return data.costOptimizations;
            case 'summary':
                return data.summary;
            default:
                return {};
        }
    }
    async renderSectionContent(templateSection, sectionData) {
        switch (templateSection.type) {
            case 'summary':
                return this.renderSummarySection(sectionData);
            case 'table':
                return this.renderTableSection(sectionData, templateSection.configuration);
            case 'text':
                return this.renderTextSection(sectionData, templateSection.configuration);
            case 'recommendations':
                return this.renderRecommendationsSection(sectionData);
            default:
                return `Section content for ${templateSection.title}`;
        }
    }
    renderSummarySection(summaryData) {
        return `
## Executive Summary

**Resource Overview:**
- Total Resources: ${summaryData.totalResources}
- Healthy Resources: ${summaryData.healthyResources}
- At-Risk Resources: ${summaryData.atRiskResources}
- Over-Utilized: ${summaryData.overUtilized}
- Under-Utilized: ${summaryData.underUtilized}

**Optimization Opportunities:**
- Cost Savings Potential: $${summaryData.costSavingsOpportunity.toLocaleString()}
- Performance Improvement Opportunities: ${summaryData.performanceImprovementOpportunity}

**Key Findings:**
${summaryData.keyFindings.map(finding => `- ${finding}`).join('\n')}

**Top Recommendations:**
${summaryData.topRecommendations.map(rec => `- ${rec}`).join('\n')}
`;
    }
    renderTableSection(data, configuration) {
        if (!Array.isArray(data) || data.length === 0) {
            return 'No data available for this section.';
        }
        const headers = configuration.columns || Object.keys(data[0]);
        const headerRow = `| ${headers.join(' | ')} |`;
        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
        const dataRows = data.slice(0, configuration.maxRows || 10).map(item => {
            const values = headers.map(header => {
                const value = item[header];
                return typeof value === 'number' ? value.toFixed(2) : (value || 'N/A');
            });
            return `| ${values.join(' | ')} |`;
        });
        return [headerRow, separatorRow, ...dataRows].join('\n');
    }
    renderTextSection(data, configuration) {
        const template = configuration.template || 'Default text content';
        return template.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
    }
    renderRecommendationsSection(recommendations) {
        if (recommendations.length === 0) {
            return 'No scaling recommendations at this time.';
        }
        return recommendations.map(rec => `
### ${rec.type.replace(/_/g, ' ').toUpperCase()}
**Resource:** ${rec.resourceId}
**Priority:** ${rec.priority.toUpperCase()}
**Confidence:** ${(rec.confidence * 100).toFixed(1)}%

**Reasoning:** ${rec.reasoning}

**Expected Impact:**
- Performance: ${rec.impact.performance > 0 ? '+' : ''}${rec.impact.performance}%
- Cost: $${rec.impact.cost.toLocaleString()}
- Risk: ${(rec.impact.risk * 100).toFixed(1)}%

**Implementation Steps:**
${rec.timeline.immediate.map(step => `1. ${step.description} (${step.estimatedDuration / 1000}s)`).join('\n')}
${rec.timeline.shortTerm.map(step => `2. ${step.description} (${step.estimatedDuration / 1000}s)`).join('\n')}
`).join('\n---\n');
    }
    getSectionVisualizations(templateSection) {
        return templateSection.configuration.visualizations || [];
    }
    async generateReportCharts(template, data) {
        const charts = [];
        charts.push(await this.chartGenerator.generateResourceUtilizationChart(data.resourceMetrics));
        charts.push(await this.chartGenerator.generateTrendChart(data.trends));
        charts.push(await this.chartGenerator.generateCostOptimizationChart(data.costOptimizations));
        charts.push(await this.chartGenerator.generateRecommendationsPriorityChart(data.recommendations));
        return charts;
    }
    async renderReport(report) {
        const renderedReports = new Map();
        for (const format of report.format) {
            try {
                const rendered = await this.reportRenderer.render(report, format);
                renderedReports.set(format, rendered);
            }
            catch (error) {
                console.error(`Failed to render report in ${format} format:`, error);
            }
        }
        return renderedReports;
    }
    async distributeReport(report, renderedReports) {
        for (const recipient of report.recipients) {
            try {
                await this.sendReportEmail(recipient, report, renderedReports);
                this.emit('reportDistributed', { reportId: report.id, recipient });
            }
            catch (error) {
                this.emit('reportDistributionFailed', { reportId: report.id, recipient, error: error.message });
            }
        }
    }
    async sendReportEmail(recipient, report, renderedReports) {
        console.log(`Sending report ${report.name} to ${recipient}`);
    }
    getTemplate(templateId) {
        return this.templates.get(templateId) || null;
    }
    getDefaultTemplate(reportType) {
        return Array.from(this.templates.values()).find(t => t.type === reportType) || null;
    }
    initializeDefaultTemplates() {
        const templates = [
            {
                type: CapacityPlanningDataModel_1.ReportType.EXECUTIVE_SUMMARY,
                name: 'Executive Summary Template',
                sections: [
                    {
                        id: 'summary',
                        title: 'Executive Summary',
                        type: 'summary',
                        dataSource: 'summary',
                        configuration: {},
                        order: 1
                    },
                    {
                        id: 'recommendations',
                        title: 'Key Recommendations',
                        type: 'recommendations',
                        dataSource: 'recommendations',
                        configuration: { maxItems: 5 },
                        order: 2
                    }
                ]
            },
            {
                type: CapacityPlanningDataModel_1.ReportType.CAPACITY_UTILIZATION,
                name: 'Capacity Utilization Template',
                sections: [
                    {
                        id: 'utilization_table',
                        title: 'Resource Utilization',
                        type: 'table',
                        dataSource: 'resourceMetrics',
                        configuration: {
                            columns: ['resourceId', 'cpu.usage', 'memory.usage', 'disk.usage'],
                            maxRows: 20
                        },
                        order: 1
                    }
                ]
            },
            {
                type: CapacityPlanningDataModel_1.ReportType.COST_OPTIMIZATION,
                name: 'Cost Optimization Template',
                sections: [
                    {
                        id: 'cost_summary',
                        title: 'Cost Optimization Summary',
                        type: 'text',
                        dataSource: 'costOptimizations',
                        configuration: {
                            template: 'Total potential savings: ${totalSavings}'
                        },
                        order: 1
                    }
                ]
            }
        ];
        templates.forEach(template => {
            this.createReportTemplate(template);
        });
    }
    async validateTemplate(template) {
        if (!template.name || template.name.trim().length === 0) {
            throw new Error('Template name is required');
        }
        if (!template.type) {
            throw new Error('Template type is required');
        }
        if (template.sections.length === 0) {
            throw new Error('Template must have at least one section');
        }
    }
    convertScheduleToCron(schedule) {
        const [hour, minute] = schedule.time.split(':').map(Number);
        switch (schedule.frequency) {
            case 'daily':
                return `${minute} ${hour} * * *`;
            case 'weekly':
                return `${minute} ${hour} * * ${schedule.dayOfWeek || 1}`;
            case 'monthly':
                return `${minute} ${hour} ${schedule.dayOfMonth || 1} * *`;
            case 'quarterly':
                return `${minute} ${hour} 1 */3 *`;
            default:
                return `${minute} ${hour} * * *`;
        }
    }
    calculateNextRun(schedule) {
        const now = new Date();
        const [hour, minute] = schedule.time.split(':').map(Number);
        const nextRun = new Date(now);
        nextRun.setHours(hour, minute, 0, 0);
        if (nextRun <= now) {
            switch (schedule.frequency) {
                case 'daily':
                    nextRun.setDate(nextRun.getDate() + 1);
                    break;
                case 'weekly':
                    nextRun.setDate(nextRun.getDate() + 7);
                    break;
                case 'monthly':
                    nextRun.setMonth(nextRun.getMonth() + 1);
                    break;
                case 'quarterly':
                    nextRun.setMonth(nextRun.getMonth() + 3);
                    break;
            }
        }
        return nextRun;
    }
    getScheduleInterval(schedule) {
        switch (schedule.frequency) {
            case 'daily':
                return 24 * 60 * 60 * 1000;
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000;
            case 'monthly':
                return 30 * 24 * 60 * 60 * 1000;
            case 'quarterly':
                return 90 * 24 * 60 * 60 * 1000;
            default:
                return 24 * 60 * 60 * 1000;
        }
    }
    startScheduledReports() {
        if (!this.config.enableScheduledReports) {
            return;
        }
        console.log('Starting scheduled report generation service...');
    }
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateTemplateId() {
        return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateScheduleId() {
        return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getReport(reportId) {
        return this.reports.get(reportId) || null;
    }
    getAllReports() {
        return Array.from(this.reports.values());
    }
    getTemplate(templateId) {
        return this.templates.get(templateId) || null;
    }
    getAllTemplates() {
        return Array.from(this.templates.values());
    }
    async cancelScheduledReport(scheduleId) {
        const timer = this.scheduledReports.get(scheduleId);
        if (timer) {
            clearInterval(timer);
            this.scheduledReports.delete(scheduleId);
            this.emit('scheduledReportCancelled', { scheduleId });
        }
    }
    async shutdown() {
        for (const [scheduleId, timer] of this.scheduledReports) {
            clearInterval(timer);
        }
        this.scheduledReports.clear();
        this.reports.clear();
        this.templates.clear();
        this.emit('shutdown');
    }
}
exports.CapacityPlanningReportGenerator = CapacityPlanningReportGenerator;
class ReportRenderer {
    config;
    constructor(config) {
        this.config = config;
    }
    async render(report, format) {
        switch (format) {
            case CapacityPlanningDataModel_1.ReportFormat.HTML:
                return this.renderHTML(report);
            case CapacityPlanningDataModel_1.ReportFormat.PDF:
                return this.renderPDF(report);
            case CapacityPlanningDataModel_1.ReportFormat.EXCEL:
                return this.renderExcel(report);
            case CapacityPlanningDataModel_1.ReportFormat.JSON:
                return this.renderJSON(report);
            case CapacityPlanningDataModel_1.ReportFormat.CSV:
                return this.renderCSV(report);
            default:
                throw new Error(`Unsupported report format: ${format}`);
        }
    }
    async renderHTML(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        h2 { color: #555; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>${report.name}</h1>
    <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>
    <p><strong>Type:</strong> ${report.type}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Resources:</strong> ${report.content.summary.totalResources}</p>
        <p><strong>Cost Savings Opportunity:</strong> $${report.content.summary.costSavingsOpportunity.toLocaleString()}</p>
    </div>
    
    ${report.content.sections.map(section => `
        <h2>${section.title}</h2>
        <div>${section.content}</div>
    `).join('')}
</body>
</html>`;
    }
    async renderPDF(report) {
        return `PDF content for ${report.name}`;
    }
    async renderExcel(report) {
        return `Excel content for ${report.name}`;
    }
    async renderJSON(report) {
        return JSON.stringify(report, null, 2);
    }
    async renderCSV(report) {
        return `CSV content for ${report.name}`;
    }
}
class ChartGenerator {
    async generateResourceUtilizationChart(metrics) {
        const resourceIds = [...new Set(metrics.map(m => m.resourceId))];
        const cpuData = resourceIds.map(id => {
            const resourceMetrics = metrics.filter(m => m.resourceId === id);
            return resourceMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / resourceMetrics.length;
        });
        return {
            id: 'resource_utilization',
            type: 'bar',
            title: 'Average CPU Utilization by Resource',
            data: {
                labels: resourceIds,
                datasets: [{
                        label: 'CPU Usage (%)',
                        data: cpuData,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
            },
            options: {
                responsive: true,
                legend: true,
                grid: true,
                animations: true,
                colors: ['#36A2EB', '#FF6384', '#4BC0C0', '#FF9F40']
            }
        };
    }
    async generateTrendChart(trends) {
        const trendDirections = trends.reduce((acc, trend) => {
            acc[trend.trend.direction] = (acc[trend.trend.direction] || 0) + 1;
            return acc;
        }, {});
        return {
            id: 'trend_analysis',
            type: 'pie',
            title: 'Capacity Trend Distribution',
            data: {
                labels: Object.keys(trendDirections),
                datasets: [{
                        label: 'Trend Count',
                        data: Object.values(trendDirections),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                        borderWidth: 1
                    }]
            },
            options: {
                responsive: true,
                legend: true,
                grid: false,
                animations: true,
                colors: ['#FF6384', '#36A2EB', '#FFCE56']
            }
        };
    }
    async generateCostOptimizationChart(costOptimizations) {
        return {
            id: 'cost_optimization',
            type: 'bar',
            title: 'Cost Optimization Opportunities',
            data: {
                labels: costOptimizations.map(co => co.resourceId),
                datasets: [{
                        label: 'Potential Savings ($)',
                        data: costOptimizations.map(co => co.savings.amount),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
            },
            options: {
                responsive: true,
                legend: true,
                grid: true,
                animations: true,
                colors: ['#4BC0C0']
            }
        };
    }
    async generateRecommendationsPriorityChart(recommendations) {
        const priorityCount = recommendations.reduce((acc, rec) => {
            acc[rec.priority] = (acc[rec.priority] || 0) + 1;
            return acc;
        }, {});
        return {
            id: 'recommendations_priority',
            type: 'pie',
            title: 'Recommendations by Priority',
            data: {
                labels: Object.keys(priorityCount),
                datasets: [{
                        label: 'Count',
                        data: Object.values(priorityCount),
                        backgroundColor: ['#FF6384', '#FF9F40', '#FFCE56', '#4BC0C0'],
                        borderWidth: 1
                    }]
            },
            options: {
                responsive: true,
                legend: true,
                grid: false,
                animations: true,
                colors: ['#FF6384', '#FF9F40', '#FFCE56', '#4BC0C0']
            }
        };
    }
}
class DataAggregator {
    async getResourceMetrics(resourceIds, resourceTypes, timeRange) {
        return [];
    }
    async getCapacityTrends(resourceIds, resourceTypes, timeRange) {
        return [];
    }
    async getScalingRecommendations(resourceIds, timeRange) {
        return [];
    }
    async getCostOptimizations(resourceIds, timeRange) {
        return [];
    }
}

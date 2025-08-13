import { EventEmitter } from 'events';
import {
  CapacityReport,
  ReportType,
  ReportFormat,
  ReportSummary,
  ReportSection,
  ReportSchedule,
  ReportStatus,
  ResourceType,
  ChartConfiguration,
  ScalingRecommendation,
  CapacityTrend,
  ResourceMetrics,
  CostOptimization
} from './CapacityPlanningDataModel';

export interface ReportGeneratorConfig {
  defaultFormat: ReportFormat[];
  maxReportsPerDay: number;
  reportRetentionDays: number;
  enableScheduledReports: boolean;
  templateDirectory: string;
  outputDirectory: string;
  emailSettings: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    fromAddress: string;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  sections: TemplateSection[];
  defaultFormat: ReportFormat[];
  parameters: Record<string, any>;
}

export interface TemplateSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'text' | 'recommendations';
  dataSource: string;
  configuration: Record<string, any>;
  order: number;
}

export interface ReportData {
  summary: ReportSummary;
  resourceMetrics: ResourceMetrics[];
  trends: CapacityTrend[];
  recommendations: ScalingRecommendation[];
  costOptimizations: CostOptimization[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class CapacityPlanningReportGenerator extends EventEmitter {
  private reports: Map<string, CapacityReport> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();
  private scheduledReports: Map<string, NodeJS.Timeout> = new Map();
  private config: ReportGeneratorConfig;
  private reportRenderer: ReportRenderer;
  private chartGenerator: ChartGenerator;
  private dataAggregator: DataAggregator;

  constructor(config: ReportGeneratorConfig) {
    super();
    this.config = config;
    this.reportRenderer = new ReportRenderer(config);
    this.chartGenerator = new ChartGenerator();
    this.dataAggregator = new DataAggregator();
    this.initializeDefaultTemplates();
    this.startScheduledReports();
  }

  async generateReport(
    reportConfig: {
      name: string;
      type: ReportType;
      scope: {
        resourceIds?: string[];
        resourceTypes?: ResourceType[];
        timeRange: { start: Date; end: Date };
      };
      format: ReportFormat[];
      recipients?: string[];
      templateId?: string;
    }
  ): Promise<CapacityReport> {
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

      const report: CapacityReport = {
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
        status: ReportStatus.GENERATING
      };

      this.reports.set(reportId, report);

      const renderedReports = await this.renderReport(report);
      report.status = ReportStatus.COMPLETED;

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
    } catch (error) {
      this.emit('reportGenerationFailed', { reportId, type: reportConfig.type, error: error.message });
      
      const failedReport = this.reports.get(reportId);
      if (failedReport) {
        failedReport.status = ReportStatus.FAILED;
      }
      
      throw error;
    }
  }

  async scheduleReport(
    reportConfig: {
      name: string;
      type: ReportType;
      scope: any;
      format: ReportFormat[];
      recipients: string[];
      schedule: ReportSchedule;
      templateId?: string;
    }
  ): Promise<string> {
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
      } catch (error) {
        this.emit('scheduledReportFailed', { scheduleId, error: error.message });
      }
    }, this.getScheduleInterval(reportConfig.schedule));

    this.scheduledReports.set(scheduleId, timer);
    
    this.emit('reportScheduled', { scheduleId, nextRun });
    return scheduleId;
  }

  async createReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      id: template.id || this.generateTemplateId(),
      name: template.name || 'Unnamed Template',
      type: template.type!,
      sections: template.sections || [],
      defaultFormat: template.defaultFormat || [ReportFormat.PDF],
      parameters: template.parameters || {}
    };

    await this.validateTemplate(newTemplate);
    this.templates.set(newTemplate.id, newTemplate);
    
    this.emit('templateCreated', { templateId: newTemplate.id, type: newTemplate.type });
    return newTemplate;
  }

  async generateExecutiveSummaryReport(timeRange: { start: Date; end: Date }): Promise<CapacityReport> {
    return this.generateReport({
      name: 'Executive Summary - Capacity Planning',
      type: ReportType.EXECUTIVE_SUMMARY,
      scope: {
        timeRange,
        resourceTypes: [ResourceType.SERVER, ResourceType.DATABASE, ResourceType.CONTAINER]
      },
      format: [ReportFormat.PDF, ReportFormat.HTML]
    });
  }

  async generateCostOptimizationReport(
    resourceIds: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<CapacityReport> {
    return this.generateReport({
      name: 'Cost Optimization Analysis',
      type: ReportType.COST_OPTIMIZATION,
      scope: {
        resourceIds,
        timeRange
      },
      format: [ReportFormat.EXCEL, ReportFormat.PDF]
    });
  }

  async generatePerformanceTrendsReport(
    resourceType: ResourceType,
    timeRange: { start: Date; end: Date }
  ): Promise<CapacityReport> {
    return this.generateReport({
      name: 'Performance Trends Analysis',
      type: ReportType.PERFORMANCE_TRENDS,
      scope: {
        resourceTypes: [resourceType],
        timeRange
      },
      format: [ReportFormat.HTML, ReportFormat.JSON]
    });
  }

  private async collectReportData(scope: any): Promise<ReportData> {
    const timeRange = scope.timeRange;
    
    const resourceMetrics = await this.dataAggregator.getResourceMetrics(
      scope.resourceIds,
      scope.resourceTypes,
      timeRange
    );
    
    const trends = await this.dataAggregator.getCapacityTrends(
      scope.resourceIds,
      scope.resourceTypes,
      timeRange
    );
    
    const recommendations = await this.dataAggregator.getScalingRecommendations(
      scope.resourceIds,
      timeRange
    );
    
    const costOptimizations = await this.dataAggregator.getCostOptimizations(
      scope.resourceIds,
      timeRange
    );

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

  private generateDataSummary(
    metrics: ResourceMetrics[],
    trends: CapacityTrend[],
    recommendations: ScalingRecommendation[],
    costOptimizations: CostOptimization[]
  ): ReportSummary {
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

  private async generateReportContent(template: ReportTemplate, data: ReportData): Promise<{
    summary: ReportSummary;
    sections: ReportSection[];
  }> {
    const sections: ReportSection[] = [];

    for (const templateSection of template.sections.sort((a, b) => a.order - b.order)) {
      const section = await this.generateSection(templateSection, data);
      sections.push(section);
    }

    return {
      summary: data.summary,
      sections
    };
  }

  private async generateSection(templateSection: TemplateSection, data: ReportData): Promise<ReportSection> {
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

  private extractSectionData(templateSection: TemplateSection, data: ReportData): any {
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

  private async renderSectionContent(templateSection: TemplateSection, sectionData: any): Promise<string> {
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

  private renderSummarySection(summaryData: ReportSummary): string {
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

  private renderTableSection(data: any[], configuration: any): string {
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

  private renderTextSection(data: any, configuration: any): string {
    const template = configuration.template || 'Default text content';
    return template.replace(/\{(\w+)\}/g, (match: string, key: string) => data[key] || match);
  }

  private renderRecommendationsSection(recommendations: ScalingRecommendation[]): string {
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

  private getSectionVisualizations(templateSection: TemplateSection): string[] {
    return templateSection.configuration.visualizations || [];
  }

  private async generateReportCharts(template: ReportTemplate, data: ReportData): Promise<ChartConfiguration[]> {
    const charts: ChartConfiguration[] = [];

    charts.push(await this.chartGenerator.generateResourceUtilizationChart(data.resourceMetrics));
    charts.push(await this.chartGenerator.generateTrendChart(data.trends));
    charts.push(await this.chartGenerator.generateCostOptimizationChart(data.costOptimizations));
    charts.push(await this.chartGenerator.generateRecommendationsPriorityChart(data.recommendations));

    return charts;
  }

  private async renderReport(report: CapacityReport): Promise<Map<ReportFormat, string>> {
    const renderedReports = new Map<ReportFormat, string>();

    for (const format of report.format) {
      try {
        const rendered = await this.reportRenderer.render(report, format);
        renderedReports.set(format, rendered);
      } catch (error) {
        console.error(`Failed to render report in ${format} format:`, error);
      }
    }

    return renderedReports;
  }

  private async distributeReport(report: CapacityReport, renderedReports: Map<ReportFormat, string>): Promise<void> {
    for (const recipient of report.recipients) {
      try {
        await this.sendReportEmail(recipient, report, renderedReports);
        this.emit('reportDistributed', { reportId: report.id, recipient });
      } catch (error) {
        this.emit('reportDistributionFailed', { reportId: report.id, recipient, error: error.message });
      }
    }
  }

  private async sendReportEmail(
    recipient: string, 
    report: CapacityReport, 
    renderedReports: Map<ReportFormat, string>
  ): Promise<void> {
    console.log(`Sending report ${report.name} to ${recipient}`);
  }

  private getTemplate(templateId: string): ReportTemplate | null {
    return this.templates.get(templateId) || null;
  }

  private getDefaultTemplate(reportType: ReportType): ReportTemplate | null {
    return Array.from(this.templates.values()).find(t => t.type === reportType) || null;
  }

  private initializeDefaultTemplates(): void {
    const templates = [
      {
        type: ReportType.EXECUTIVE_SUMMARY,
        name: 'Executive Summary Template',
        sections: [
          {
            id: 'summary',
            title: 'Executive Summary',
            type: 'summary' as const,
            dataSource: 'summary',
            configuration: {},
            order: 1
          },
          {
            id: 'recommendations',
            title: 'Key Recommendations',
            type: 'recommendations' as const,
            dataSource: 'recommendations',
            configuration: { maxItems: 5 },
            order: 2
          }
        ]
      },
      {
        type: ReportType.CAPACITY_UTILIZATION,
        name: 'Capacity Utilization Template',
        sections: [
          {
            id: 'utilization_table',
            title: 'Resource Utilization',
            type: 'table' as const,
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
        type: ReportType.COST_OPTIMIZATION,
        name: 'Cost Optimization Template',
        sections: [
          {
            id: 'cost_summary',
            title: 'Cost Optimization Summary',
            type: 'text' as const,
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

  private async validateTemplate(template: ReportTemplate): Promise<void> {
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

  private convertScheduleToCron(schedule: ReportSchedule): string {
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

  private calculateNextRun(schedule: ReportSchedule): Date {
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

  private getScheduleInterval(schedule: ReportSchedule): number {
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

  private startScheduledReports(): void {
    if (!this.config.enableScheduledReports) {
      return;
    }
    
    console.log('Starting scheduled report generation service...');
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getReport(reportId: string): CapacityReport | null {
    return this.reports.get(reportId) || null;
  }

  getAllReports(): CapacityReport[] {
    return Array.from(this.reports.values());
  }

  getTemplate(templateId: string): ReportTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getAllTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  async cancelScheduledReport(scheduleId: string): Promise<void> {
    const timer = this.scheduledReports.get(scheduleId);
    if (timer) {
      clearInterval(timer);
      this.scheduledReports.delete(scheduleId);
      this.emit('scheduledReportCancelled', { scheduleId });
    }
  }

  async shutdown(): Promise<void> {
    for (const [scheduleId, timer] of this.scheduledReports) {
      clearInterval(timer);
    }
    
    this.scheduledReports.clear();
    this.reports.clear();
    this.templates.clear();
    
    this.emit('shutdown');
  }
}

class ReportRenderer {
  private config: ReportGeneratorConfig;

  constructor(config: ReportGeneratorConfig) {
    this.config = config;
  }

  async render(report: CapacityReport, format: ReportFormat): Promise<string> {
    switch (format) {
      case ReportFormat.HTML:
        return this.renderHTML(report);
      case ReportFormat.PDF:
        return this.renderPDF(report);
      case ReportFormat.EXCEL:
        return this.renderExcel(report);
      case ReportFormat.JSON:
        return this.renderJSON(report);
      case ReportFormat.CSV:
        return this.renderCSV(report);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  private async renderHTML(report: CapacityReport): Promise<string> {
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

  private async renderPDF(report: CapacityReport): Promise<string> {
    return `PDF content for ${report.name}`;
  }

  private async renderExcel(report: CapacityReport): Promise<string> {
    return `Excel content for ${report.name}`;
  }

  private async renderJSON(report: CapacityReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  private async renderCSV(report: CapacityReport): Promise<string> {
    return `CSV content for ${report.name}`;
  }
}

class ChartGenerator {
  async generateResourceUtilizationChart(metrics: ResourceMetrics[]): Promise<ChartConfiguration> {
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

  async generateTrendChart(trends: CapacityTrend[]): Promise<ChartConfiguration> {
    const trendDirections = trends.reduce((acc, trend) => {
      acc[trend.trend.direction] = (acc[trend.trend.direction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

  async generateCostOptimizationChart(costOptimizations: CostOptimization[]): Promise<ChartConfiguration> {
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

  async generateRecommendationsPriorityChart(recommendations: ScalingRecommendation[]): Promise<ChartConfiguration> {
    const priorityCount = recommendations.reduce((acc, rec) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  async getResourceMetrics(
    resourceIds?: string[],
    resourceTypes?: ResourceType[],
    timeRange?: { start: Date; end: Date }
  ): Promise<ResourceMetrics[]> {
    return [];
  }

  async getCapacityTrends(
    resourceIds?: string[],
    resourceTypes?: ResourceType[],
    timeRange?: { start: Date; end: Date }
  ): Promise<CapacityTrend[]> {
    return [];
  }

  async getScalingRecommendations(
    resourceIds?: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<ScalingRecommendation[]> {
    return [];
  }

  async getCostOptimizations(
    resourceIds?: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<CostOptimization[]> {
    return [];
  }
}
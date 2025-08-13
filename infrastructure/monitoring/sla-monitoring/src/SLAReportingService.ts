import { EventEmitter } from 'events';
import {
  SLAReport,
  SLAReportType,
  SLAReportData,
  SLAReportSummary,
  SLAChart,
  SLADashboard,
  SLAWidget,
  SLAMetric,
  SLABreach,
  SLAComplianceScore,
  SLADefinition
} from './SLADataModel';

export interface ReportingConfig {
  maxReportsPerDay: number;
  reportRetentionDays: number;
  enableScheduledReports: boolean;
  defaultFormats: string[];
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
  type: SLAReportType;
  sections: ReportSection[];
  chartConfigurations: ChartConfiguration[];
  filters: ReportFilter[];
  scheduling: ReportSchedule;
  recipients: string[];
  format: string[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'metrics' | 'charts' | 'table' | 'analysis' | 'recommendations';
  configuration: Record<string, any>;
  order: number;
}

export interface ChartConfiguration {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'heatmap' | 'gauge' | 'scatter' | 'trend';
  title: string;
  dataQuery: string;
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  timeRange?: { start: string; end: string };
  styling: Record<string, any>;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:mm format
  dayOfWeek?: number; // for weekly
  dayOfMonth?: number; // for monthly
  timezone: string;
  lastRun?: Date;
  nextRun?: Date;
}

export interface DashboardConfiguration {
  layout: 'grid' | 'flex' | 'masonry';
  columns: number;
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  enableRealTime: boolean;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric_card' | 'chart' | 'table' | 'status_board' | 'trend_indicator' | 'alert_list';
  title: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  dataSource: string;
  configuration: Record<string, any>;
  refreshInterval?: number;
}

export interface ExportOptions {
  format: 'pdf' | 'html' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
  compression?: 'zip' | 'gzip';
  password?: string;
}

export class SLAReportingService extends EventEmitter {
  private reports: Map<string, SLAReport> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();
  private dashboards: Map<string, SLADashboard> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private config: ReportingConfig;
  private reportGenerationQueue: Array<{ templateId: string; priority: number; requestedBy: string }> = [];

  constructor(config: ReportingConfig) {
    super();
    this.config = config;
    this.initializeDefaultTemplates();
    this.initializeDefaultDashboards();
    this.startScheduledReporting();
  }

  async generateReport(request: {
    templateId?: string;
    type: SLAReportType;
    title: string;
    description?: string;
    timeRange: { start: Date; end: Date };
    slaIds?: string[];
    serviceIds?: string[];
    filters?: ReportFilter[];
    format?: string[];
    recipients?: string[];
    requestedBy: string;
  }): Promise<SLAReport> {
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
    const report: SLAReport = {
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
        await this.exportReport(report, { format: format as any, includeCharts: true, includeRawData: false });
        report.deliveryStatus[format] = 'sent';
      } catch (error) {
        report.deliveryStatus[format] = 'failed';
        this.emit('reportExportFailed', { reportId: report.id, format, error: error.message });
      }
    }

    this.emit('reportGenerated', { reportId: report.id, report });
    return report;
  }

  async createDashboard(config: {
    name: string;
    description: string;
    widgets: DashboardWidget[];
    layout: DashboardConfiguration;
    permissions: Array<{ userId: string; role: 'viewer' | 'editor' | 'admin' }>;
    isDefault?: boolean;
    createdBy: string;
  }): Promise<SLADashboard> {
    const dashboard: SLADashboard = {
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

  async getDashboardData(dashboardId: string, userId: string): Promise<{
    dashboard: SLADashboard;
    widgetData: Record<string, any>;
  }> {
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
    const widgetData: Record<string, any> = {};
    for (const widget of dashboard.widgets) {
      try {
        widgetData[widget.id] = await this.getWidgetData(widget);
      } catch (error) {
        console.warn(`Failed to load data for widget ${widget.id}:`, error.message);
        widgetData[widget.id] = { error: error.message };
      }
    }

    return { dashboard, widgetData };
  }

  async getWidgetData(widget: DashboardWidget): Promise<any> {
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

  async scheduleReport(templateId: string, schedule: ReportSchedule, recipients: string[]): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Cancel existing schedule if any
    if (this.scheduledJobs.has(templateId)) {
      clearInterval(this.scheduledJobs.get(templateId)!);
    }

    const interval = this.calculateScheduleInterval(schedule);
    const job = setInterval(async () => {
      try {
        await this.generateScheduledReport(templateId, recipients);
      } catch (error) {
        this.emit('scheduledReportFailed', { templateId, error: error.message });
      }
    }, interval);

    this.scheduledJobs.set(templateId, job);
    template.scheduling = { ...schedule, lastRun: new Date(), nextRun: new Date(Date.now() + interval) };
    
    this.emit('reportScheduled', { templateId, schedule });
  }

  async exportReport(report: SLAReport, options: ExportOptions): Promise<Buffer> {
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

  async getReportHistory(options: {
    type?: SLAReportType;
    generatedBy?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  } = {}): Promise<SLAReport[]> {
    let reports = Array.from(this.reports.values());

    if (options.type) {
      reports = reports.filter(r => r.type === options.type);
    }

    if (options.generatedBy) {
      reports = reports.filter(r => r.generatedBy === options.generatedBy);
    }

    if (options.timeRange) {
      reports = reports.filter(r => 
        r.generatedAt >= options.timeRange!.start && 
        r.generatedAt <= options.timeRange!.end
      );
    }

    reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());

    if (options.limit) {
      reports = reports.slice(0, options.limit);
    }

    return reports;
  }

  private async collectReportData(request: {
    timeRange: { start: Date; end: Date };
    slaIds: string[];
    serviceIds: string[];
    filters: ReportFilter[];
  }): Promise<SLAReportData> {
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

  private generateReportSummary(data: SLAReportData): SLAReportSummary {
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

  private async generateReportCharts(
    template: ReportTemplate, 
    data: SLAReportData, 
    timeRange: { start: Date; end: Date }
  ): Promise<SLAChart[]> {
    const charts: SLAChart[] = [];

    for (const chartConfig of template.chartConfigurations) {
      const chart: SLAChart = {
        id: chartConfig.id,
        title: chartConfig.title,
        type: chartConfig.type,
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

  private async generateChartData(config: ChartConfiguration, data: SLAReportData): Promise<any[]> {
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

  private generateLineChartData(config: ChartConfiguration, data: SLAReportData): any[] {
    // Generate time series data for compliance rates
    return data.slaMetrics.map(metric => ({
      x: metric.calculatedAt,
      y: metric.compliancePercentage,
      label: metric.slaId
    }));
  }

  private generateBarChartData(config: ChartConfiguration, data: SLAReportData): any[] {
    // Generate bar chart data for SLA status distribution
    const statusCounts = data.slaMetrics.reduce((acc, metric) => {
      acc[metric.status] = (acc[metric.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      x: status,
      y: count,
      label: status
    }));
  }

  private generatePieChartData(config: ChartConfiguration, data: SLAReportData): any[] {
    // Generate pie chart data for breach distribution by severity
    const severityCounts = data.breaches.reduce((acc, breach) => {
      acc[breach.severity] = (acc[breach.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(severityCounts).map(([severity, count]) => ({
      label: severity,
      value: count
    }));
  }

  private generateGaugeChartData(config: ChartConfiguration, data: SLAReportData): any[] {
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

  private async generateRecommendations(data: SLAReportData): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze compliance rates
    const lowComplianceMetrics = data.slaMetrics.filter(m => m.compliancePercentage < 95);
    if (lowComplianceMetrics.length > 0) {
      recommendations.push(`${lowComplianceMetrics.length} SLAs have compliance rates below 95%. Consider reviewing thresholds or improving service performance.`);
    }

    // Analyze breach patterns
    const frequentBreaches = data.breaches.filter(b => {
      const recentBreaches = data.breaches.filter(rb => 
        rb.slaId === b.slaId && 
        rb.startTime.getTime() > (Date.now() - (7 * 24 * 60 * 60 * 1000))
      );
      return recentBreaches.length > 3;
    });

    if (frequentBreaches.length > 0) {
      recommendations.push(`${frequentBreaches.length} SLAs have frequent breaches (>3 in last 7 days). Investigate root causes and implement preventive measures.`);
    }

    // Analyze response times
    const slowResponseTimes = data.slaMetrics.filter(m => 
      m.unit === 'ms' && m.currentValue > 1000
    );

    if (slowResponseTimes.length > 0) {
      recommendations.push(`${slowResponseTimes.length} services have response times > 1000ms. Consider performance optimization.`);
    }

    return recommendations;
  }

  private generateKeyInsights(data: SLAReportData): string[] {
    const insights: string[] = [];

    // Top performing SLA
    const bestPerformingSLA = data.slaMetrics.reduce((best, current) => 
      current.compliancePercentage > best.compliancePercentage ? current : best
    );
    insights.push(`Best performing SLA: ${bestPerformingSLA.slaId} with ${bestPerformingSLA.compliancePercentage.toFixed(1)}% compliance`);

    // Most problematic SLA
    const worstPerformingSLA = data.slaMetrics.reduce((worst, current) => 
      current.compliancePercentage < worst.compliancePercentage ? current : worst
    );
    insights.push(`Most problematic SLA: ${worstPerformingSLA.slaId} with ${worstPerformingSLA.compliancePercentage.toFixed(1)}% compliance`);

    // Breach trends
    const recentBreaches = data.breaches.filter(b => 
      b.startTime.getTime() > (Date.now() - (24 * 60 * 60 * 1000))
    );
    insights.push(`${recentBreaches.length} breaches occurred in the last 24 hours`);

    return insights;
  }

  private async getMetricCardData(widget: DashboardWidget): Promise<any> {
    // Mock metric card data
    return {
      value: 99.5,
      unit: '%',
      trend: 'up',
      trendValue: 0.2,
      status: 'good'
    };
  }

  private async getChartData(widget: DashboardWidget): Promise<any> {
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

  private async getTableData(widget: DashboardWidget): Promise<any> {
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

  private async getStatusBoardData(widget: DashboardWidget): Promise<any> {
    // Mock status board data
    return {
      services: [
        { name: 'API Gateway', status: 'healthy', uptime: '99.9%' },
        { name: 'Database', status: 'warning', uptime: '98.5%' },
        { name: 'Cache', status: 'healthy', uptime: '99.8%' }
      ]
    };
  }

  private async getTrendIndicatorData(widget: DashboardWidget): Promise<any> {
    // Mock trend indicator data
    return {
      current: 99.5,
      previous: 99.2,
      trend: 'improving',
      changePercent: 0.3
    };
  }

  private async getAlertListData(widget: DashboardWidget): Promise<any> {
    // Mock alert list data
    return {
      alerts: [
        { id: '1', severity: 'high', message: 'Response time SLA breached', timestamp: new Date() },
        { id: '2', severity: 'medium', message: 'Uptime approaching threshold', timestamp: new Date() }
      ]
    };
  }

  private async getSLAMetrics(request: any): Promise<SLAMetric[]> {
    // Mock SLA metrics - would query actual tracking service
    return [];
  }

  private async getComplianceScores(request: any): Promise<SLAComplianceScore[]> {
    // Mock compliance scores
    return [];
  }

  private async getBreaches(request: any): Promise<SLABreach[]> {
    // Mock breaches
    return [];
  }

  private async getTrends(request: any): Promise<any[]> {
    // Mock trends
    return [];
  }

  private async getPenalties(request: any): Promise<any[]> {
    // Mock penalties
    return [];
  }

  private async exportToPDF(report: SLAReport, options: ExportOptions): Promise<Buffer> {
    // Mock PDF export
    console.log(`Exporting report ${report.id} to PDF`);
    return Buffer.from('PDF content');
  }

  private async exportToHTML(report: SLAReport, options: ExportOptions): Promise<Buffer> {
    // Mock HTML export
    console.log(`Exporting report ${report.id} to HTML`);
    return Buffer.from('<html>HTML content</html>');
  }

  private async exportToExcel(report: SLAReport, options: ExportOptions): Promise<Buffer> {
    // Mock Excel export
    console.log(`Exporting report ${report.id} to Excel`);
    return Buffer.from('Excel content');
  }

  private async exportToCSV(report: SLAReport, options: ExportOptions): Promise<Buffer> {
    // Mock CSV export
    console.log(`Exporting report ${report.id} to CSV`);
    return Buffer.from('CSV content');
  }

  private async exportToJSON(report: SLAReport, options: ExportOptions): Promise<Buffer> {
    // JSON export
    return Buffer.from(JSON.stringify(report, null, 2));
  }

  private getDefaultTemplate(type: SLAReportType): ReportTemplate | null {
    return Array.from(this.templates.values()).find(t => t.type === type) || null;
  }

  private calculateScheduleInterval(schedule: ReportSchedule): number {
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

  private async generateScheduledReport(templateId: string, recipients: string[]): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) return;

    const endDate = new Date();
    const startDate = new Date();
    
    // Set time range based on report frequency
    switch (template.type) {
      case SLAReportType.DAILY:
        startDate.setDate(endDate.getDate() - 1);
        break;
      case SLAReportType.WEEKLY:
        startDate.setDate(endDate.getDate() - 7);
        break;
      case SLAReportType.MONTHLY:
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

  private initializeDefaultTemplates(): void {
    const defaultTemplates: ReportTemplate[] = [
      {
        id: 'daily-summary',
        name: 'Daily SLA Summary',
        type: SLAReportType.DAILY,
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

  private initializeDefaultDashboards(): void {
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

  private startScheduledReporting(): void {
    if (!this.config.enableScheduledReports) return;

    // Check for scheduled reports every hour
    setInterval(() => {
      for (const [templateId, template] of this.templates) {
        if (template.scheduling.enabled && this.shouldRunScheduledReport(template)) {
          this.generateScheduledReport(templateId, template.recipients);
        }
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private shouldRunScheduledReport(template: ReportTemplate): boolean {
    if (!template.scheduling.nextRun) return true;
    return new Date() >= template.scheduling.nextRun;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDashboardId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWidgetId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
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
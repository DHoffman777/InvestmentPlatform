import { EventEmitter } from 'events';
import { SLAReport, SLAReportType, SLADashboard } from './SLADataModel';
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
    timeRange?: {
        start: string;
        end: string;
    };
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
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
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
    size: {
        width: number;
        height: number;
    };
    position: {
        x: number;
        y: number;
    };
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
export declare class SLAReportingService extends EventEmitter {
    private reports;
    private templates;
    private dashboards;
    private scheduledJobs;
    private config;
    private reportGenerationQueue;
    constructor(config: ReportingConfig);
    generateReport(request: {
        templateId?: string;
        type: SLAReportType;
        title: string;
        description?: string;
        timeRange: {
            start: Date;
            end: Date;
        };
        slaIds?: string[];
        serviceIds?: string[];
        filters?: ReportFilter[];
        format?: string[];
        recipients?: string[];
        requestedBy: string;
    }): Promise<SLAReport>;
    createDashboard(config: {
        name: string;
        description: string;
        widgets: DashboardWidget[];
        layout: DashboardConfiguration;
        permissions: Array<{
            userId: string;
            role: 'viewer' | 'editor' | 'admin';
        }>;
        isDefault?: boolean;
        createdBy: string;
    }): Promise<SLADashboard>;
    getDashboardData(dashboardId: string, userId: string): Promise<{
        dashboard: SLADashboard;
        widgetData: Record<string, any>;
    }>;
    getWidgetData(widget: DashboardWidget): Promise<any>;
    scheduleReport(templateId: string, schedule: ReportSchedule, recipients: string[]): Promise<any>;
    exportReport(report: SLAReport, options: ExportOptions): Promise<Buffer>;
    getReportHistory(options?: {
        type?: SLAReportType;
        generatedBy?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
        limit?: number;
    }): Promise<SLAReport[]>;
    private collectReportData;
    private generateReportSummary;
    private generateReportCharts;
    private generateChartData;
    private generateLineChartData;
    private generateBarChartData;
    private generatePieChartData;
    private generateGaugeChartData;
    private generateRecommendations;
    private generateKeyInsights;
    private getMetricCardData;
    private getChartData;
    private getTableData;
    private getStatusBoardData;
    private getTrendIndicatorData;
    private getAlertListData;
    private getSLAMetrics;
    private getComplianceScores;
    private getBreaches;
    private getTrends;
    private getPenalties;
    private exportToPDF;
    private exportToHTML;
    private exportToExcel;
    private exportToCSV;
    private exportToJSON;
    private getDefaultTemplate;
    private calculateScheduleInterval;
    private generateScheduledReport;
    private initializeDefaultTemplates;
    private initializeDefaultDashboards;
    private startScheduledReporting;
    private shouldRunScheduledReport;
    private generateReportId;
    private generateDashboardId;
    private generateWidgetId;
    shutdown(): Promise<any>;
}

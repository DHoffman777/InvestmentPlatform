import { EventEmitter } from 'events';
import { CapacityReport, ReportType, ReportFormat, ReportSummary, ReportSchedule, ResourceType, ScalingRecommendation, CapacityTrend, ResourceMetrics, CostOptimization } from './CapacityPlanningDataModel';
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
export declare class CapacityPlanningReportGenerator extends EventEmitter {
    private reports;
    private templates;
    private scheduledReports;
    private config;
    private reportRenderer;
    private chartGenerator;
    private dataAggregator;
    constructor(config: ReportGeneratorConfig);
    generateReport(reportConfig: {
        name: string;
        type: ReportType;
        scope: {
            resourceIds?: string[];
            resourceTypes?: ResourceType[];
            timeRange: {
                start: Date;
                end: Date;
            };
        };
        format: ReportFormat[];
        recipients?: string[];
        templateId?: string;
    }): Promise<CapacityReport>;
    scheduleReport(reportConfig: {
        name: string;
        type: ReportType;
        scope: any;
        format: ReportFormat[];
        recipients: string[];
        schedule: ReportSchedule;
        templateId?: string;
    }): Promise<string>;
    createReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate>;
    generateExecutiveSummaryReport(timeRange: {
        start: Date;
        end: Date;
    }): Promise<CapacityReport>;
    generateCostOptimizationReport(resourceIds: string[], timeRange: {
        start: Date;
        end: Date;
    }): Promise<CapacityReport>;
    generatePerformanceTrendsReport(resourceType: ResourceType, timeRange: {
        start: Date;
        end: Date;
    }): Promise<CapacityReport>;
    private collectReportData;
    private generateDataSummary;
    private generateReportContent;
    private generateSection;
    private extractSectionData;
    private renderSectionContent;
    private renderSummarySection;
    private renderTableSection;
    private renderTextSection;
    private renderRecommendationsSection;
    private getSectionVisualizations;
    private generateReportCharts;
    private renderReport;
    private distributeReport;
    private sendReportEmail;
    private getReportTemplate;
    private getDefaultTemplate;
    private initializeDefaultTemplates;
    private validateTemplate;
    private convertScheduleToCron;
    private calculateNextRun;
    private getScheduleInterval;
    private startScheduledReports;
    private generateReportId;
    private generateTemplateId;
    private generateScheduleId;
    getReport(reportId: string): CapacityReport | null;
    getAllReports(): CapacityReport[];
    getTemplateById(templateId: string): ReportTemplate | null;
    getAllTemplates(): ReportTemplate[];
    cancelScheduledReport(scheduleId: string): Promise<any>;
    shutdown(): Promise<any>;
}

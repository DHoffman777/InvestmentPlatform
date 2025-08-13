import { ReportTemplate, ReportRequest, ReportJob, ReportSchedule, ReportType, ReportFormat, ReportStatus, ReportLibrary, ReportUsageStats, CustomReportBuilder } from '../../models/reporting/ReportingEngine';
export declare class ReportingEngineService {
    private templateService;
    private generationService;
    private eventPublisher;
    constructor();
    createReportTemplate(tenantId: string, templateData: Partial<ReportTemplate>, userId: string): Promise<ReportTemplate>;
    getReportTemplate(tenantId: string, templateId: string): Promise<ReportTemplate | null>;
    getReportTemplates(tenantId: string, options?: {
        reportType?: ReportType;
        category?: string;
        tags?: string[];
        isPublic?: boolean;
        createdBy?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        templates: ReportTemplate[];
        totalCount: number;
    }>;
    updateReportTemplate(tenantId: string, templateId: string, updates: Partial<ReportTemplate>, userId: string): Promise<ReportTemplate>;
    deleteReportTemplate(tenantId: string, templateId: string, userId: string): Promise<void>;
    duplicateReportTemplate(tenantId: string, templateId: string, newName: string, userId: string): Promise<ReportTemplate>;
    shareReportTemplate(tenantId: string, templateId: string, shareWith: string[], userId: string): Promise<void>;
    generateReport(tenantId: string, request: ReportRequest, userId: string): Promise<ReportJob>;
    getReportJob(jobId: string): Promise<ReportJob | null>;
    getReportJobs(tenantId: string, options?: {
        templateId?: string;
        status?: ReportStatus;
        requestedBy?: string;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        jobs: ReportJob[];
        totalCount: number;
    }>;
    cancelReportJob(jobId: string, userId: string): Promise<void>;
    retryReportJob(jobId: string, userId: string): Promise<void>;
    scheduleReport(tenantId: string, scheduleData: Partial<ReportSchedule>, userId: string): Promise<ReportSchedule>;
    executeScheduledReport(scheduleId: string): Promise<void>;
    generatePerformanceReport(tenantId: string, portfolioIds: string[], dateRange: {
        startDate: Date;
        endDate: Date;
    }, format: ReportFormat | undefined, userId: string): Promise<ReportJob>;
    generateHoldingsReport(tenantId: string, portfolioIds: string[], asOfDate: Date, format: ReportFormat | undefined, userId: string): Promise<ReportJob>;
    generateTransactionReport(tenantId: string, portfolioIds: string[], dateRange: {
        startDate: Date;
        endDate: Date;
    }, format: ReportFormat | undefined, userId: string): Promise<ReportJob>;
    generateComplianceReport(tenantId: string, portfolioIds: string[], asOfDate: Date, format: ReportFormat | undefined, userId: string): Promise<ReportJob>;
    buildCustomReport(tenantId: string, builder: CustomReportBuilder, userId: string): Promise<{
        template: ReportTemplate;
        preview: any;
    }>;
    createReportLibrary(tenantId: string, libraryData: Partial<ReportLibrary>, userId: string): Promise<ReportLibrary>;
    getReportUsageStats(tenantId: string, templateId?: string, dateRange?: {
        startDate: Date;
        endDate: Date;
    }): Promise<ReportUsageStats[]>;
    getDashboardMetrics(tenantId: string, userId: string): Promise<any>;
    private validateReportRequest;
    private getOrCreatePerformanceTemplate;
    private getOrCreateHoldingsTemplate;
    private getOrCreateTransactionTemplate;
    private getOrCreateComplianceTemplate;
    private calculateJobStatusBreakdown;
    private getMonthlyUsage;
}

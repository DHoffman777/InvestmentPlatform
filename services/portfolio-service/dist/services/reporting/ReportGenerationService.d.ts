import { ReportRequest, ReportJob, ReportSchedule, ReportStatus } from '../../models/reporting/ReportingEngine';
export declare class ReportGenerationService {
    private reportTemplateService;
    private eventPublisher;
    constructor();
    generateReport(tenantId: string, request: ReportRequest, userId: string): Promise<ReportJob>;
    processReportJob(jobId: string): Promise<void>;
    scheduleReport(tenantId: string, scheduleData: Partial<ReportSchedule>, userId: string): Promise<ReportSchedule>;
    executeScheduledReport(scheduleId: string): Promise<void>;
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
    private extractReportData;
    private processReportData;
    private generateReportOutput;
    private generatePDF;
    private generateExcel;
    private generateCSV;
    private generateHTML;
    private applyFilters;
    private applyAggregation;
    private deliverReport;
    private sendEmailReport;
    private saveReportToLibrary;
    private calculateNextExecution;
    private saveReportJob;
    private saveReportSchedule;
    private queueReportJob;
    private updateJobStatus;
    private completeReportJob;
    private failReportJob;
    private updateJobForRetry;
    private getReportSchedule;
    private registerSchedule;
    private updateScheduleExecution;
    private getFileSize;
}

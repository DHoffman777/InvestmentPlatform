import { ReportRequest, ReportJob, ReportSchedule, ReportStatus } from '../../models/reporting/ReportingEngine';
export declare class ReportGenerationService {
    private reportTemplateService;
    private eventPublisher;
    constructor();
    generateReport(tenantId: string, request: ReportRequest, userId: string): Promise<ReportJob>;
    processReportJob(jobId: string): Promise<any>;
    scheduleReport(tenantId: string, scheduleData: Partial<ReportSchedule>, userId: string): Promise<ReportSchedule>;
    executeScheduledReport(scheduleId: string): Promise<any>;
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
    cancelReportJob(jobId: string, userId: string): Promise<any>;
    retryReportJob(jobId: string, userId: string): Promise<any>;
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

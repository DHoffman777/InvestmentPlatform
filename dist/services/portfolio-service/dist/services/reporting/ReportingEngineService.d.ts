export const __esModule: boolean;
export class ReportingEngineService {
    templateService: ReportTemplateService_1.ReportTemplateService;
    generationService: ReportGenerationService_1.ReportGenerationService;
    eventPublisher: eventPublisher_1.EventPublisher;
    createReportTemplate(tenantId: any, templateData: any, userId: any): Promise<ReportingEngine_1.ReportTemplate>;
    getReportTemplate(tenantId: any, templateId: any): Promise<ReportingEngine_1.ReportTemplate>;
    getReportTemplates(tenantId: any, options?: {}): Promise<{
        templates: ReportingEngine_1.ReportTemplate[];
        totalCount: number;
    }>;
    updateReportTemplate(tenantId: any, templateId: any, updates: any, userId: any): Promise<ReportingEngine_1.ReportTemplate>;
    deleteReportTemplate(tenantId: any, templateId: any, userId: any): Promise<void>;
    duplicateReportTemplate(tenantId: any, templateId: any, newName: any, userId: any): Promise<ReportingEngine_1.ReportTemplate>;
    shareReportTemplate(tenantId: any, templateId: any, shareWith: any, userId: any): Promise<void>;
    generateReport(tenantId: any, request: any, userId: any): Promise<ReportingEngine_1.ReportJob>;
    getReportJob(jobId: any): Promise<ReportingEngine_1.ReportJob>;
    getReportJobs(tenantId: any, options?: {}): Promise<{
        jobs: ReportingEngine_1.ReportJob[];
        totalCount: number;
    }>;
    cancelReportJob(jobId: any, userId: any): Promise<void>;
    retryReportJob(jobId: any, userId: any): Promise<void>;
    scheduleReport(tenantId: any, scheduleData: any, userId: any): Promise<ReportingEngine_1.ReportSchedule>;
    executeScheduledReport(scheduleId: any): Promise<void>;
    generatePerformanceReport(tenantId: any, portfolioIds: any, dateRange: any, format: ReportingEngine_1.ReportFormat, userId: any): Promise<ReportingEngine_1.ReportJob>;
    generateHoldingsReport(tenantId: any, portfolioIds: any, asOfDate: any, format: ReportingEngine_1.ReportFormat, userId: any): Promise<ReportingEngine_1.ReportJob>;
    generateTransactionReport(tenantId: any, portfolioIds: any, dateRange: any, format: ReportingEngine_1.ReportFormat, userId: any): Promise<ReportingEngine_1.ReportJob>;
    generateComplianceReport(tenantId: any, portfolioIds: any, asOfDate: any, format: ReportingEngine_1.ReportFormat, userId: any): Promise<ReportingEngine_1.ReportJob>;
    buildCustomReport(tenantId: any, builder: any, userId: any): Promise<{
        template: ReportingEngine_1.ReportTemplate;
        preview: any;
    }>;
    createReportLibrary(tenantId: any, libraryData: any, userId: any): Promise<ReportingEngine_1.ReportLibrary>;
    getReportUsageStats(tenantId: any, templateId: any, dateRange: any): Promise<ReportingEngine_1.ReportUsageStats[]>;
    getDashboardMetrics(tenantId: any, userId: any): Promise<{
        totalTemplates: number;
        totalJobs: number;
        recentJobs: ReportingEngine_1.ReportJob[];
        popularTemplates: ReportingEngine_1.ReportUsageStats[];
        jobStatusBreakdown: {
            completed: number;
            pending: number;
            generating: number;
            failed: number;
            cancelled: number;
        };
        monthlyUsage: {
            month: string;
            reportCount: number;
            uniqueUsers: number;
        }[];
    }>;
    validateReportRequest(tenantId: any, request: any): Promise<void>;
    getOrCreatePerformanceTemplate(tenantId: any): Promise<ReportingEngine_1.ReportTemplate>;
    getOrCreateHoldingsTemplate(tenantId: any): Promise<ReportingEngine_1.ReportTemplate>;
    getOrCreateTransactionTemplate(tenantId: any): Promise<ReportingEngine_1.ReportTemplate>;
    getOrCreateComplianceTemplate(tenantId: any): Promise<ReportingEngine_1.ReportTemplate>;
    calculateJobStatusBreakdown(jobs: any): {
        completed: number;
        pending: number;
        generating: number;
        failed: number;
        cancelled: number;
    };
    getMonthlyUsage(tenantId: any): Promise<{
        month: string;
        reportCount: number;
        uniqueUsers: number;
    }[]>;
}
import ReportTemplateService_1 = require("./ReportTemplateService");
import ReportGenerationService_1 = require("./ReportGenerationService");
import eventPublisher_1 = require("../../utils/eventPublisher");
import ReportingEngine_1 = require("../../models/reporting/ReportingEngine");

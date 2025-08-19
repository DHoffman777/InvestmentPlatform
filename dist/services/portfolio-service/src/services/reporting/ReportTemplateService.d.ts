import { ReportTemplate, ReportType, ReportLibrary, ReportUsageStats, CustomReportBuilder } from '../../models/reporting/ReportingEngine';
export declare class ReportTemplateService {
    private eventPublisher;
    constructor();
    createReportTemplate(tenantId: string, templateData: Partial<ReportTemplate>, userId: string): Promise<ReportTemplate>;
    updateReportTemplate(tenantId: string, templateId: string, updates: Partial<ReportTemplate>, userId: string): Promise<ReportTemplate>;
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
    deleteReportTemplate(tenantId: string, templateId: string, userId: string): Promise<void>;
    duplicateReportTemplate(tenantId: string, templateId: string, newName: string, userId: string): Promise<ReportTemplate>;
    shareReportTemplate(tenantId: string, templateId: string, shareWith: string[], userId: string): Promise<void>;
    createReportLibrary(tenantId: string, libraryData: Partial<ReportLibrary>, userId: string): Promise<ReportLibrary>;
    getReportUsageStats(tenantId: string, templateId?: string, dateRange?: {
        startDate: Date;
        endDate: Date;
    }): Promise<ReportUsageStats[]>;
    buildCustomReport(tenantId: string, builder: CustomReportBuilder, userId: string): Promise<{
        template: ReportTemplate;
        preview: any;
    }>;
    private validateTemplate;
    private checkTemplatePermissions;
    private getDefaultColumns;
    private getDefaultSections;
    private getDefaultLayout;
    private incrementVersion;
    private saveTemplate;
    private saveLibrary;
    private getUserRoles;
    private sendShareNotifications;
    private validateDataSource;
    private generateColumnsFromSelection;
    private generateSectionsFromBuilder;
    private generateReportPreview;
}

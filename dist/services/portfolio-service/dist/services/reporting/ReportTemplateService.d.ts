export const __esModule: boolean;
export class ReportTemplateService {
    eventPublisher: eventPublisher_1.EventPublisher;
    createReportTemplate(tenantId: any, templateData: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        name: any;
        description: any;
        reportType: any;
        category: any;
        tags: any;
        dataSource: any;
        columns: any;
        sections: any;
        defaultFilters: any;
        defaultSorting: any;
        defaultGrouping: any;
        layout: any;
        isPublic: any;
        allowedRoles: any;
        sharedWith: any;
        createdAt: Date;
        updatedAt: Date;
        createdBy: any;
        updatedBy: any;
        version: string;
        isActive: boolean;
        usageCount: number;
    }>;
    updateReportTemplate(tenantId: any, templateId: any, updates: any, userId: any): Promise<any>;
    getReportTemplate(tenantId: any, templateId: any): Promise<any>;
    getReportTemplates(tenantId: any, options?: {}): Promise<{
        templates: any[];
        totalCount: number;
    }>;
    deleteReportTemplate(tenantId: any, templateId: any, userId: any): Promise<void>;
    duplicateReportTemplate(tenantId: any, templateId: any, newName: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        name: any;
        description: any;
        reportType: any;
        category: any;
        tags: any;
        dataSource: any;
        columns: any;
        sections: any;
        defaultFilters: any;
        defaultSorting: any;
        defaultGrouping: any;
        layout: any;
        isPublic: any;
        allowedRoles: any;
        sharedWith: any;
        createdAt: Date;
        updatedAt: Date;
        createdBy: any;
        updatedBy: any;
        version: string;
        isActive: boolean;
        usageCount: number;
    }>;
    shareReportTemplate(tenantId: any, templateId: any, shareWith: any, userId: any): Promise<void>;
    createReportLibrary(tenantId: any, libraryData: any, userId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        name: any;
        description: any;
        templates: any;
        tags: any;
        category: any;
        isPublic: any;
        allowedRoles: any;
        createdAt: Date;
        updatedAt: Date;
        createdBy: any;
    }>;
    getReportUsageStats(tenantId: any, templateId: any, dateRange: any): Promise<any[]>;
    buildCustomReport(tenantId: any, builder: any, userId: any): Promise<{
        template: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: any;
            name: any;
            description: any;
            reportType: any;
            category: any;
            tags: any;
            dataSource: any;
            columns: any;
            sections: any;
            defaultFilters: any;
            defaultSorting: any;
            defaultGrouping: any;
            layout: any;
            isPublic: any;
            allowedRoles: any;
            sharedWith: any;
            createdAt: Date;
            updatedAt: Date;
            createdBy: any;
            updatedBy: any;
            version: string;
            isActive: boolean;
            usageCount: number;
        };
        preview: {
            headers: any;
            rows: string[][];
            estimatedRowCount: number;
            estimatedSize: string;
        };
    }>;
    validateTemplate(template: any): Promise<void>;
    checkTemplatePermissions(template: any, userId: any, action: any): Promise<void>;
    getDefaultColumns(reportType: any): ({
        id: string;
        name: string;
        displayName: string;
        dataType: string;
        source: string;
        width: number;
        alignment: string;
        sortable: boolean;
        filterable: boolean;
        aggregatable: boolean;
        format?: undefined;
    } | {
        id: string;
        name: string;
        displayName: string;
        dataType: string;
        source: string;
        format: string;
        width: number;
        alignment: string;
        sortable: boolean;
        filterable: boolean;
        aggregatable: boolean;
    })[];
    getDefaultSections(reportType: any): {
        id: string;
        name: string;
        type: string;
        order: number;
        columns: string[];
        filters: any[];
        sorting: {
            columnId: string;
            direction: string;
            priority: number;
        }[];
        grouping: any[];
    }[];
    getDefaultLayout(): {
        orientation: string;
        pageSize: string;
        margins: {
            top: number;
            bottom: number;
            left: number;
            right: number;
        };
        header: {
            content: string;
            height: number;
            showPageNumbers: boolean;
        };
        footer: {
            content: string;
            height: number;
            showTimestamp: boolean;
        };
    };
    incrementVersion(currentVersion: any): string;
    saveTemplate(template: any): Promise<void>;
    saveLibrary(library: any): Promise<void>;
    getUserRoles(userId: any): Promise<string[]>;
    sendShareNotifications(template: any, shareWith: any, sharedBy: any): Promise<void>;
    validateDataSource(dataSource: any): Promise<void>;
    generateColumnsFromSelection(selectedColumns: any): Promise<any>;
    generateSectionsFromBuilder(builder: any): Promise<{
        id: string;
        name: string;
        type: string;
        order: number;
        columns: any;
        filters: any;
        sorting: any;
        grouping: any;
    }[]>;
    generateReportPreview(template: any, builder: any): Promise<{
        headers: any;
        rows: string[][];
        estimatedRowCount: number;
        estimatedSize: string;
    }>;
}
import eventPublisher_1 = require("../../utils/eventPublisher");

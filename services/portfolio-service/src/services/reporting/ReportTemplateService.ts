import { randomUUID } from 'crypto';
import {
  ReportTemplate,
  ReportType,
  ReportColumn,
  ReportSection,
  ReportFilter,
  ReportSort,
  ReportGrouping,
  ReportLibrary,
  ReportUsageStats,
  CustomReportBuilder,
  AggregationLevel
} from '../../models/reporting/ReportingEngine';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

export class ReportTemplateService {
  private eventPublisher: EventPublisher;

  constructor() {
    this.eventPublisher = new EventPublisher('ReportTemplateService');
  }

  async createReportTemplate(
    tenantId: string,
    templateData: Partial<ReportTemplate>,
    userId: string
  ): Promise<ReportTemplate> {
    try {
      logger.info('Creating report template', {
        tenantId,
        templateName: templateData.name,
        reportType: templateData.reportType,
        userId
      });

      const template: ReportTemplate = {
        id: randomUUID(),
        tenantId,
        name: templateData.name || 'Untitled Report',
        description: templateData.description || '',
        reportType: templateData.reportType || ReportType.CUSTOM,
        category: templateData.category || 'General',
        tags: templateData.tags || [],
        
        dataSource: templateData.dataSource || {
          baseEntity: 'portfolio',
          joins: [],
          dateRange: {
            type: 'RELATIVE',
            relativePeriod: 'year_to_date'
          }
        },
        
        columns: templateData.columns || this.getDefaultColumns(templateData.reportType!),
        sections: templateData.sections || this.getDefaultSections(templateData.reportType!),
        
        defaultFilters: templateData.defaultFilters || [],
        defaultSorting: templateData.defaultSorting || [],
        defaultGrouping: templateData.defaultGrouping || [],
        
        layout: templateData.layout || this.getDefaultLayout(),
        
        isPublic: templateData.isPublic || false,
        allowedRoles: templateData.allowedRoles || [],
        sharedWith: templateData.sharedWith || [],
        
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        version: '1.0',
        isActive: true,
        usageCount: 0
      };

      // Validate template
      await this.validateTemplate(template);

      // Save template
      await this.saveTemplate(template);

      // Publish event
      await this.eventPublisher.publish('report.template.created', {
        tenantId,
        templateId: template.id,
        templateName: template.name,
        reportType: template.reportType,
        createdBy: userId
      });

      logger.info('Report template created successfully', {
        templateId: template.id,
        templateName: template.name
      });

      return template;

    } catch (error: any) {
      logger.error('Error creating report template:', error);
      throw error;
    }
  }

  async updateReportTemplate(
    tenantId: string,
    templateId: string,
    updates: Partial<ReportTemplate>,
    userId: string
  ): Promise<ReportTemplate> {
    try {
      logger.info('Updating report template', {
        tenantId,
        templateId,
        userId
      });

      const existingTemplate = await this.getReportTemplate(tenantId, templateId);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      // Check permissions
      await this.checkTemplatePermissions(existingTemplate, userId, 'EDIT');

      // Create new version
      const updatedTemplate: ReportTemplate = {
        ...existingTemplate,
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId,
        version: this.incrementVersion(existingTemplate.version)
      };

      // Validate template
      await this.validateTemplate(updatedTemplate);

      // Save template
      await this.saveTemplate(updatedTemplate);

      // Publish event
      await this.eventPublisher.publish('report.template.updated', {
        tenantId,
        templateId,
        templateName: updatedTemplate.name,
        updatedBy: userId,
        changes: updates
      });

      logger.info('Report template updated successfully', { templateId });

      return updatedTemplate;

    } catch (error: any) {
      logger.error('Error updating report template:', error);
      throw error;
    }
  }

  async getReportTemplate(tenantId: string, templateId: string): Promise<ReportTemplate | null> {
    try {
      logger.info('Retrieving report template', { tenantId, templateId });

      // Mock implementation - replace with actual database query
      return null;

    } catch (error: any) {
      logger.error('Error retrieving report template:', error);
      throw error;
    }
  }

  async getReportTemplates(
    tenantId: string,
    options: {
      reportType?: ReportType;
      category?: string;
      tags?: string[];
      isPublic?: boolean;
      createdBy?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ templates: ReportTemplate[]; totalCount: number }> {
    try {
      logger.info('Retrieving report templates', { tenantId, options });

      // Mock implementation - replace with actual database query
      const templates: ReportTemplate[] = [];
      const totalCount = 0;

      return { templates, totalCount };

    } catch (error: any) {
      logger.error('Error retrieving report templates:', error);
      throw error;
    }
  }

  async deleteReportTemplate(tenantId: string, templateId: string, userId: string): Promise<any> {
    try {
      logger.info('Deleting report template', { tenantId, templateId, userId });

      const template = await this.getReportTemplate(tenantId, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Check permissions
      await this.checkTemplatePermissions(template, userId, 'DELETE');

      // Soft delete - mark as inactive
      await this.updateReportTemplate(tenantId, templateId, { isActive: false }, userId);

      // Publish event
      await this.eventPublisher.publish('report.template.deleted', {
        tenantId,
        templateId,
        templateName: template.name,
        deletedBy: userId
      });

      logger.info('Report template deleted successfully', { templateId });

    } catch (error: any) {
      logger.error('Error deleting report template:', error);
      throw error;
    }
  }

  async duplicateReportTemplate(
    tenantId: string,
    templateId: string,
    newName: string,
    userId: string
  ): Promise<ReportTemplate> {
    try {
      logger.info('Duplicating report template', {
        tenantId,
        templateId,
        newName,
        userId
      });

      const originalTemplate = await this.getReportTemplate(tenantId, templateId);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      // Check permissions
      await this.checkTemplatePermissions(originalTemplate, userId, 'VIEW');

      // Create duplicate
      const duplicateTemplate: Partial<ReportTemplate> = {
        ...originalTemplate,
        name: newName,
        isPublic: false,
        sharedWith: [],
        usageCount: 0,
        lastUsed: undefined
      };

      delete duplicateTemplate.id;
      delete duplicateTemplate.createdAt;
      delete duplicateTemplate.updatedAt;
      delete duplicateTemplate.createdBy;
      delete duplicateTemplate.updatedBy;
      delete duplicateTemplate.version;

      const newTemplate = await this.createReportTemplate(tenantId, duplicateTemplate, userId);

      logger.info('Report template duplicated successfully', {
        originalTemplateId: templateId,
        newTemplateId: newTemplate.id
      });

      return newTemplate;

    } catch (error: any) {
      logger.error('Error duplicating report template:', error);
      throw error;
    }
  }

  async shareReportTemplate(
    tenantId: string,
    templateId: string,
    shareWith: string[],
    userId: string
  ): Promise<any> {
    try {
      logger.info('Sharing report template', {
        tenantId,
        templateId,
        shareWith,
        userId
      });

      const template = await this.getReportTemplate(tenantId, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Check permissions
      await this.checkTemplatePermissions(template, userId, 'SHARE');

      // Update shared users list
      const updatedSharedWith = [...new Set([...template.sharedWith, ...shareWith])];

      await this.updateReportTemplate(
        tenantId,
        templateId,
        { sharedWith: updatedSharedWith },
        userId
      );

      // Send notifications
      await this.sendShareNotifications(template, shareWith, userId);

      logger.info('Report template shared successfully', { templateId });

    } catch (error: any) {
      logger.error('Error sharing report template:', error);
      throw error;
    }
  }

  async createReportLibrary(
    tenantId: string,
    libraryData: Partial<ReportLibrary>,
    userId: string
  ): Promise<ReportLibrary> {
    try {
      logger.info('Creating report library', {
        tenantId,
        libraryName: libraryData.name,
        userId
      });

      const library: ReportLibrary = {
        id: randomUUID(),
        tenantId,
        name: libraryData.name || 'Untitled Library',
        description: libraryData.description || '',
        templates: libraryData.templates || [],
        tags: libraryData.tags || [],
        category: libraryData.category || 'General',
        isPublic: libraryData.isPublic || false,
        allowedRoles: libraryData.allowedRoles || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      // Save library
      await this.saveLibrary(library);

      logger.info('Report library created successfully', {
        libraryId: library.id,
        libraryName: library.name
      });

      return library;

    } catch (error: any) {
      logger.error('Error creating report library:', error);
      throw error;
    }
  }

  async getReportUsageStats(
    tenantId: string,
    templateId?: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<ReportUsageStats[]> {
    try {
      logger.info('Retrieving report usage statistics', {
        tenantId,
        templateId,
        dateRange
      });

      // Mock implementation - replace with actual analytics query
      const stats: ReportUsageStats[] = [];

      return stats;

    } catch (error: any) {
      logger.error('Error retrieving report usage statistics:', error);
      throw error;
    }
  }

  async buildCustomReport(
    tenantId: string,
    builder: CustomReportBuilder,
    userId: string
  ): Promise<{ template: ReportTemplate; preview: any }> {
    try {
      logger.info('Building custom report', { tenantId, userId });

      // Validate data source
      await this.validateDataSource(builder.dataSource);

      // Generate columns from selection
      const columns = await this.generateColumnsFromSelection(builder.selectedColumns);

      // Create sections
      const sections = await this.generateSectionsFromBuilder(builder);

      // Create template
      const template: Partial<ReportTemplate> = {
        name: `Custom Report - ${new Date().toISOString()}`,
        description: 'Custom built report',
        reportType: ReportType.CUSTOM,
        category: 'Custom',
        dataSource: {
          baseEntity: builder.dataSource,
          joins: [],
          dateRange: { type: 'RELATIVE', relativePeriod: 'year_to_date' }
        },
        columns,
        sections,
        defaultFilters: builder.filters,
        defaultSorting: builder.sorting,
        defaultGrouping: builder.grouping,
        layout: this.getDefaultLayout()
      };

      const createdTemplate = await this.createReportTemplate(tenantId, template, userId);

      // Generate preview
      const preview = await this.generateReportPreview(createdTemplate, builder);

      return { template: createdTemplate, preview };

    } catch (error: any) {
      logger.error('Error building custom report:', error);
      throw error;
    }
  }

  // Private helper methods
  private async validateTemplate(template: ReportTemplate): Promise<any> {
    if (!template.name || template.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (!template.dataSource || !template.dataSource.baseEntity) {
      throw new Error('Data source is required');
    }

    if (!template.columns || template.columns.length === 0) {
      throw new Error('At least one column is required');
    }

    // Validate column references in sections
    for (const section of template.sections) {
      if (section.type === 'TABLE' && section.columns) {
        for (const columnId of section.columns) {
          if (!template.columns.find(col => col.id === columnId)) {
            throw new Error(`Invalid column reference: ${columnId}`);
          }
        }
      }
    }
  }

  private async checkTemplatePermissions(
    template: ReportTemplate,
    userId: string,
    action: 'VIEW' | 'EDIT' | 'DELETE' | 'SHARE'
  ): Promise<any> {
    // Check if user is owner
    if (template.createdBy === userId) {
      return;
    }

    // Check if template is public and action is VIEW
    if (template.isPublic && action === 'VIEW') {
      return;
    }

    // Check if user is in shared list
    if (template.sharedWith.includes(userId) && ['VIEW', 'SHARE'].includes(action)) {
      return;
    }

    // Check role-based permissions
    // Mock implementation - replace with actual role check
    const userRoles = await this.getUserRoles(userId);
    const hasRoleAccess = template.allowedRoles.some(role => userRoles.includes(role));
    
    if (hasRoleAccess && ['VIEW', 'SHARE'].includes(action)) {
      return;
    }

    throw new Error(`Access denied for action: ${action}`);
  }

  private getDefaultColumns(reportType: ReportType): ReportColumn[] {
    const commonColumns: ReportColumn[] = [
      {
        id: 'portfolio_name',
        name: 'portfolioName',
        displayName: 'Portfolio Name',
        dataType: 'STRING',
        source: 'portfolio.name',
        width: 200,
        alignment: 'LEFT',
        sortable: true,
        filterable: true,
        aggregatable: false
      },
      {
        id: 'as_of_date',
        name: 'asOfDate',
        displayName: 'As Of Date',
        dataType: 'DATE',
        source: 'portfolio.asOfDate',
        format: 'MM/DD/YYYY',
        width: 120,
        alignment: 'CENTER',
        sortable: true,
        filterable: true,
        aggregatable: false
      }
    ];

    switch (reportType) {
      case ReportType.PERFORMANCE:
        return [
          ...commonColumns,
          {
            id: 'total_return',
            name: 'totalReturn',
            displayName: 'Total Return',
            dataType: 'PERCENTAGE',
            source: 'performance.totalReturn',
            format: '0.00%',
            width: 120,
            alignment: 'RIGHT',
            sortable: true,
            filterable: true,
            aggregatable: true,
            aggregationFunction: 'AVG'
          }
        ];
      
      case ReportType.HOLDINGS:
        return [
          ...commonColumns,
          {
            id: 'symbol',
            name: 'symbol',
            displayName: 'Symbol',
            dataType: 'STRING',
            source: 'position.symbol',
            width: 100,
            alignment: 'LEFT',
            sortable: true,
            filterable: true,
            aggregatable: false
          },
          {
            id: 'market_value',
            name: 'marketValue',
            displayName: 'Market Value',
            dataType: 'CURRENCY',
            source: 'position.marketValue',
            format: '$#,##0.00',
            width: 150,
            alignment: 'RIGHT',
            sortable: true,
            filterable: true,
            aggregatable: true,
            aggregationFunction: 'SUM'
          }
        ];
      
      default:
        return commonColumns;
    }
  }

  private getDefaultSections(reportType: ReportType): ReportSection[] {
    return [
      {
        id: 'main_table',
        name: 'Main Data Table',
        type: 'TABLE',
        order: 1,
        columns: ['portfolio_name', 'as_of_date'],
        filters: [],
        sorting: [{ columnId: 'portfolio_name', direction: 'ASC', priority: 1 }],
        grouping: []
      }
    ];
  }

  private getDefaultLayout() {
    return {
      orientation: 'PORTRAIT' as const,
      pageSize: 'A4' as const,
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      header: {
        content: '{{reportName}} - {{currentDate}}',
        height: 40,
        showPageNumbers: true
      },
      footer: {
        content: 'Generated by Investment Platform',
        height: 30,
        showTimestamp: true
      }
    };
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private async saveTemplate(template: ReportTemplate): Promise<any> {
    // Mock implementation - replace with actual database save
    logger.debug('Saving report template', { templateId: template.id });
  }

  private async saveLibrary(library: ReportLibrary): Promise<any> {
    // Mock implementation - replace with actual database save
    logger.debug('Saving report library', { libraryId: library.id });
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    // Mock implementation - replace with actual role lookup
    return ['USER'];
  }

  private async sendShareNotifications(
    template: ReportTemplate,
    shareWith: string[],
    sharedBy: string
  ): Promise<any> {
    // Mock implementation - replace with actual notification service
    logger.debug('Sending share notifications', { templateId: template.id, shareWith });
  }

  private async validateDataSource(dataSource: string): Promise<any> {
    const validSources = ['portfolio', 'position', 'transaction', 'performance', 'client'];
    if (!validSources.includes(dataSource)) {
      throw new Error(`Invalid data source: ${dataSource}`);
    }
  }

  private async generateColumnsFromSelection(selectedColumns: string[]): Promise<ReportColumn[]> {
    // Mock implementation - generate columns based on selection
    return selectedColumns.map((col, index) => ({
      id: col,
      name: col,
      displayName: col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      dataType: 'STRING',
      source: col,
      width: 150,
      alignment: 'LEFT',
      sortable: true,
      filterable: true,
      aggregatable: false
    }));
  }

  private async generateSectionsFromBuilder(builder: CustomReportBuilder): Promise<ReportSection[]> {
    return [
      {
        id: 'custom_table',
        name: 'Custom Data Table',
        type: 'TABLE',
        order: 1,
        columns: builder.selectedColumns,
        filters: builder.filters,
        sorting: builder.sorting,
        grouping: builder.grouping
      }
    ];
  }

  private async generateReportPreview(
    template: ReportTemplate,
    builder: CustomReportBuilder
  ): Promise<any> {
    // Mock implementation - generate preview data
    return {
      headers: template.columns.map(col => col.displayName),
      rows: [
        ['Sample Portfolio', '2024-12-31', '$1,000,000'],
        ['Test Portfolio', '2024-12-31', '$2,500,000']
      ],
      estimatedRowCount: 150,
      estimatedSize: '2.5 MB'
    };
  }
}


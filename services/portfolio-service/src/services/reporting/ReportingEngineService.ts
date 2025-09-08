import { randomUUID } from 'crypto';
import {
  ReportTemplate,
  ReportRequest,
  ReportJob,
  ReportSchedule,
  ReportType,
  ReportFormat,
  ReportFrequency,
  ReportStatus,
  PerformanceReportData,
  HoldingsReportData,
  TransactionReportData,
  ComplianceReportData,
  ReportLibrary,
  ReportUsageStats,
  CustomReportBuilder
} from '../../models/reporting/ReportingEngine';
import { ReportTemplateService } from './ReportTemplateService';
import { ReportGenerationService } from './ReportGenerationService';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

export class ReportingEngineService {
  private templateService: ReportTemplateService;
  private generationService: ReportGenerationService;
  private eventPublisher: EventPublisher;

  constructor() {
    this.templateService = new ReportTemplateService();
    this.generationService = new ReportGenerationService();
    this.eventPublisher = new EventPublisher('ReportingEngineService');
  }

  // Template Management
  async createReportTemplate(
    tenantId: string,
    templateData: Partial<ReportTemplate>,
    userId: string
  ): Promise<ReportTemplate> {
    return await this.templateService.createReportTemplate(tenantId, templateData, userId);
  }

  async getReportTemplate(tenantId: string, templateId: string): Promise<ReportTemplate | null> {
    return await this.templateService.getReportTemplate(tenantId, templateId);
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
    return await this.templateService.getReportTemplates(tenantId, options);
  }

  async updateReportTemplate(
    tenantId: string,
    templateId: string,
    updates: Partial<ReportTemplate>,
    userId: string
  ): Promise<ReportTemplate> {
    return await this.templateService.updateReportTemplate(tenantId, templateId, updates, userId);
  }

  async deleteReportTemplate(tenantId: string, templateId: string, userId: string): Promise<any> {
    return await this.templateService.deleteReportTemplate(tenantId, templateId, userId);
  }

  async duplicateReportTemplate(
    tenantId: string,
    templateId: string,
    newName: string,
    userId: string
  ): Promise<ReportTemplate> {
    return await this.templateService.duplicateReportTemplate(tenantId, templateId, newName, userId);
  }

  async shareReportTemplate(
    tenantId: string,
    templateId: string,
    shareWith: string[],
    userId: string
  ): Promise<any> {
    return await this.templateService.shareReportTemplate(tenantId, templateId, shareWith, userId);
  }

  // Report Generation
  async generateReport(
    tenantId: string,
    request: ReportRequest,
    userId: string
  ): Promise<ReportJob> {
    try {
      logger.info('Generating report through engine', {
        tenantId,
        templateId: request.templateId,
        format: request.format,
        userId
      });

      // Validate request
      await this.validateReportRequest(tenantId, request);

      // Generate report
      const job = await this.generationService.generateReport(tenantId, request, userId);

      // Publish event
      await this.eventPublisher.publish('reporting.report.requested', {
        tenantId,
        jobId: job.id,
        templateId: request.templateId,
        format: request.format,
        requestedBy: userId
      });

      return job;

    } catch (error: any) {
      logger.error('Error generating report through engine:', error);
      throw error;
    }
  }

  async getReportJob(jobId: string): Promise<ReportJob | null> {
    return await this.generationService.getReportJob(jobId);
  }

  async getReportJobs(
    tenantId: string,
    options: {
      templateId?: string;
      status?: ReportStatus;
      requestedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ jobs: ReportJob[]; totalCount: number }> {
    return await this.generationService.getReportJobs(tenantId, options);
  }

  async cancelReportJob(jobId: string, userId: string): Promise<any> {
    return await this.generationService.cancelReportJob(jobId, userId);
  }

  async retryReportJob(jobId: string, userId: string): Promise<any> {
    return await this.generationService.retryReportJob(jobId, userId);
  }

  // Scheduling
  async scheduleReport(
    tenantId: string,
    scheduleData: Partial<ReportSchedule>,
    userId: string
  ): Promise<ReportSchedule> {
    return await this.generationService.scheduleReport(tenantId, scheduleData, userId);
  }

  async executeScheduledReport(scheduleId: string): Promise<any> {
    return await this.generationService.executeScheduledReport(scheduleId);
  }

  // Pre-built Report Types
  async generatePerformanceReport(
    tenantId: string,
    portfolioIds: string[],
    dateRange: { startDate: Date; endDate: Date },
    format: ReportFormat = ReportFormat.PDF,
    userId: string
  ): Promise<ReportJob> {
    try {
      logger.info('Generating performance report', {
        tenantId,
        portfolioIds,
        dateRange,
        format,
        userId
      });

      // Get or create performance report template
      const template = await this.getOrCreatePerformanceTemplate(tenantId);

      const request: ReportRequest = {
        templateId: template.id,
        name: `Performance Report - ${new Date().toLocaleDateString()}`,
        portfolioIds,
        dateRange,
        format,
        deliveryMethod: 'DOWNLOAD',
        requestedBy: userId,
        requestedAt: new Date(),
        priority: 'MEDIUM'
      };

      return await this.generateReport(tenantId, request, userId);

    } catch (error: any) {
      logger.error('Error generating performance report:', error);
      throw error;
    }
  }

  async generateHoldingsReport(
    tenantId: string,
    portfolioIds: string[],
    asOfDate: Date,
    format: ReportFormat = ReportFormat.EXCEL,
    userId: string
  ): Promise<ReportJob> {
    try {
      logger.info('Generating holdings report', {
        tenantId,
        portfolioIds,
        asOfDate,
        format,
        userId
      });

      // Get or create holdings report template
      const template = await this.getOrCreateHoldingsTemplate(tenantId);

      const request: ReportRequest = {
        templateId: template.id,
        name: `Holdings Report - ${asOfDate.toLocaleDateString()}`,
        portfolioIds,
        dateRange: { startDate: asOfDate, endDate: asOfDate },
        format,
        deliveryMethod: 'DOWNLOAD',
        requestedBy: userId,
        requestedAt: new Date(),
        priority: 'MEDIUM'
      };

      return await this.generateReport(tenantId, request, userId);

    } catch (error: any) {
      logger.error('Error generating holdings report:', error);
      throw error;
    }
  }

  async generateTransactionReport(
    tenantId: string,
    portfolioIds: string[],
    dateRange: { startDate: Date; endDate: Date },
    format: ReportFormat = ReportFormat.CSV,
    userId: string
  ): Promise<ReportJob> {
    try {
      logger.info('Generating transaction report', {
        tenantId,
        portfolioIds,
        dateRange,
        format,
        userId
      });

      // Get or create transaction report template
      const template = await this.getOrCreateTransactionTemplate(tenantId);

      const request: ReportRequest = {
        templateId: template.id,
        name: `Transaction Report - ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`,
        portfolioIds,
        dateRange,
        format,
        deliveryMethod: 'DOWNLOAD',
        requestedBy: userId,
        requestedAt: new Date(),
        priority: 'MEDIUM'
      };

      return await this.generateReport(tenantId, request, userId);

    } catch (error: any) {
      logger.error('Error generating transaction report:', error);
      throw error;
    }
  }

  async generateComplianceReport(
    tenantId: string,
    portfolioIds: string[],
    asOfDate: Date,
    format: ReportFormat = ReportFormat.PDF,
    userId: string
  ): Promise<ReportJob> {
    try {
      logger.info('Generating compliance report', {
        tenantId,
        portfolioIds,
        asOfDate,
        format,
        userId
      });

      // Get or create compliance report template
      const template = await this.getOrCreateComplianceTemplate(tenantId);

      const request: ReportRequest = {
        templateId: template.id,
        name: `Compliance Report - ${asOfDate.toLocaleDateString()}`,
        portfolioIds,
        dateRange: { startDate: asOfDate, endDate: asOfDate },
        format,
        deliveryMethod: 'DOWNLOAD',
        requestedBy: userId,
        requestedAt: new Date(),
        priority: 'HIGH'
      };

      return await this.generateReport(tenantId, request, userId);

    } catch (error: any) {
      logger.error('Error generating compliance report:', error);
      throw error;
    }
  }

  // Custom Report Builder
  async buildCustomReport(
    tenantId: string,
    builder: CustomReportBuilder,
    userId: string
  ): Promise<{ template: ReportTemplate; preview: any }> {
    return await this.templateService.buildCustomReport(tenantId, builder, userId);
  }

  // Library Management
  async createReportLibrary(
    tenantId: string,
    libraryData: Partial<ReportLibrary>,
    userId: string
  ): Promise<ReportLibrary> {
    return await this.templateService.createReportLibrary(tenantId, libraryData, userId);
  }

  // Analytics and Usage
  async getReportUsageStats(
    tenantId: string,
    templateId?: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<ReportUsageStats[]> {
    return await this.templateService.getReportUsageStats(tenantId, templateId, dateRange);
  }

  async getDashboardMetrics(tenantId: string, userId: string): Promise<any> {
    try {
      logger.info('Retrieving dashboard metrics', { tenantId, userId });

      const [
        templates,
        recentJobs,
        usageStats
      ] = await Promise.all([
        this.getReportTemplates(tenantId, { limit: 10 }),
        this.getReportJobs(tenantId, { limit: 10 }),
        this.getReportUsageStats(tenantId)
      ]);

      const metrics = {
        totalTemplates: templates.totalCount,
        totalJobs: recentJobs.totalCount,
        recentJobs: recentJobs.jobs,
        popularTemplates: usageStats
          .sort((a, b) => b.stats.popularityScore - a.stats.popularityScore)
          .slice(0, 5),
        jobStatusBreakdown: this.calculateJobStatusBreakdown(recentJobs.jobs),
        monthlyUsage: await this.getMonthlyUsage(tenantId)
      };

      return metrics;

    } catch (error: any) {
      logger.error('Error retrieving dashboard metrics:', error);
      throw error;
    }
  }

  // Private helper methods
  private async validateReportRequest(tenantId: string, request: ReportRequest): Promise<any> {
    // Validate template exists
    const template = await this.getReportTemplate(tenantId, request.templateId);
    if (!template) {
      throw new Error('Report template not found');
    }

    if (!template.isActive) {
      throw new Error('Report template is inactive');
    }

    // Validate format
    if (!Object.values(ReportFormat).includes(request.format)) {
      throw new Error('Invalid report format');
    }

    // Validate delivery method
    if (request.deliveryMethod === 'EMAIL' && (!request.emailRecipients || request.emailRecipients.length === 0)) {
      throw new Error('Email recipients required for email delivery');
    }
  }

  private async getOrCreatePerformanceTemplate(tenantId: string): Promise<ReportTemplate> {
    // Try to get existing template
    const existing = await this.getReportTemplates(tenantId, {
      reportType: ReportType.PERFORMANCE,
      limit: 1
    });

    if (existing.templates.length > 0) {
      return existing.templates[0];
    }

    // Create new performance template
    const templateData: Partial<ReportTemplate> = {
      name: 'Standard Performance Report',
      description: 'Standard portfolio performance analysis report',
      reportType: ReportType.PERFORMANCE,
      category: 'Performance',
      tags: ['performance', 'returns', 'standard'],
      dataSource: {
        baseEntity: 'performance',
        joins: ['portfolio', 'client'],
        dateRange: { type: 'PROMPT' }
      },
      isPublic: true,
      allowedRoles: ['USER', 'ADVISOR', 'MANAGER']
    };

    return await this.createReportTemplate(tenantId, templateData, 'SYSTEM');
  }

  private async getOrCreateHoldingsTemplate(tenantId: string): Promise<ReportTemplate> {
    // Try to get existing template
    const existing = await this.getReportTemplates(tenantId, {
      reportType: ReportType.HOLDINGS,
      limit: 1
    });

    if (existing.templates.length > 0) {
      return existing.templates[0];
    }

    // Create new holdings template
    const templateData: Partial<ReportTemplate> = {
      name: 'Standard Holdings Report',
      description: 'Standard portfolio holdings and positions report',
      reportType: ReportType.HOLDINGS,
      category: 'Holdings',
      tags: ['holdings', 'positions', 'standard'],
      dataSource: {
        baseEntity: 'position',
        joins: ['portfolio', 'security'],
        dateRange: { type: 'PROMPT' }
      },
      isPublic: true,
      allowedRoles: ['USER', 'ADVISOR', 'MANAGER']
    };

    return await this.createReportTemplate(tenantId, templateData, 'SYSTEM');
  }

  private async getOrCreateTransactionTemplate(tenantId: string): Promise<ReportTemplate> {
    // Try to get existing template
    const existing = await this.getReportTemplates(tenantId, {
      reportType: ReportType.TRANSACTION,
      limit: 1
    });

    if (existing.templates.length > 0) {
      return existing.templates[0];
    }

    // Create new transaction template
    const templateData: Partial<ReportTemplate> = {
      name: 'Standard Transaction Report',
      description: 'Standard portfolio transaction activity report',
      reportType: ReportType.TRANSACTION,
      category: 'Transactions',
      tags: ['transactions', 'activity', 'standard'],
      dataSource: {
        baseEntity: 'transaction',
        joins: ['portfolio', 'security'],
        dateRange: { type: 'PROMPT' }
      },
      isPublic: true,
      allowedRoles: ['USER', 'ADVISOR', 'MANAGER']
    };

    return await this.createReportTemplate(tenantId, templateData, 'SYSTEM');
  }

  private async getOrCreateComplianceTemplate(tenantId: string): Promise<ReportTemplate> {
    // Try to get existing template
    const existing = await this.getReportTemplates(tenantId, {
      reportType: ReportType.COMPLIANCE,
      limit: 1
    });

    if (existing.templates.length > 0) {
      return existing.templates[0];
    }

    // Create new compliance template
    const templateData: Partial<ReportTemplate> = {
      name: 'Standard Compliance Report',
      description: 'Standard portfolio compliance monitoring report',
      reportType: ReportType.COMPLIANCE,
      category: 'Compliance',
      tags: ['compliance', 'violations', 'monitoring'],
      dataSource: {
        baseEntity: 'compliance',
        joins: ['portfolio', 'rule'],
        dateRange: { type: 'PROMPT' }
      },
      isPublic: true,
      allowedRoles: ['COMPLIANCE', 'MANAGER', 'SUPERVISOR']
    };

    return await this.createReportTemplate(tenantId, templateData, 'SYSTEM');
  }

  private calculateJobStatusBreakdown(jobs: ReportJob[]): any {
    const breakdown = {
      completed: 0,
      pending: 0,
      generating: 0,
      failed: 0,
      cancelled: 0
    };

    jobs.forEach(job => {
      switch (job.status) {
        case ReportStatus.COMPLETED:
          breakdown.completed++;
          break;
        case ReportStatus.PENDING:
          breakdown.pending++;
          break;
        case ReportStatus.GENERATING:
          breakdown.generating++;
          break;
        case ReportStatus.FAILED:
          breakdown.failed++;
          break;
        case ReportStatus.CANCELLED:
          breakdown.cancelled++;
          break;
      }
    });

    return breakdown;
  }

  private async getMonthlyUsage(tenantId: string): Promise<any[]> {
    // Mock implementation - replace with actual usage analytics
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      monthlyData.push({
        month: month.toISOString().substring(0, 7), // YYYY-MM format
        reportCount: Math.floor(Math.random() * 100) + 10,
        uniqueUsers: Math.floor(Math.random() * 20) + 5
      });
    }

    return monthlyData;
  }
}


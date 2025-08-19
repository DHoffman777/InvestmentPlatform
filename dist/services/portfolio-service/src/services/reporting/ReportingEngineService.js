"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingEngineService = void 0;
const ReportingEngine_1 = require("../../models/reporting/ReportingEngine");
const ReportTemplateService_1 = require("./ReportTemplateService");
const ReportGenerationService_1 = require("./ReportGenerationService");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class ReportingEngineService {
    templateService;
    generationService;
    eventPublisher;
    constructor() {
        this.templateService = new ReportTemplateService_1.ReportTemplateService();
        this.generationService = new ReportGenerationService_1.ReportGenerationService();
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    // Template Management
    async createReportTemplate(tenantId, templateData, userId) {
        return await this.templateService.createReportTemplate(tenantId, templateData, userId);
    }
    async getReportTemplate(tenantId, templateId) {
        return await this.templateService.getReportTemplate(tenantId, templateId);
    }
    async getReportTemplates(tenantId, options = {}) {
        return await this.templateService.getReportTemplates(tenantId, options);
    }
    async updateReportTemplate(tenantId, templateId, updates, userId) {
        return await this.templateService.updateReportTemplate(tenantId, templateId, updates, userId);
    }
    async deleteReportTemplate(tenantId, templateId, userId) {
        return await this.templateService.deleteReportTemplate(tenantId, templateId, userId);
    }
    async duplicateReportTemplate(tenantId, templateId, newName, userId) {
        return await this.templateService.duplicateReportTemplate(tenantId, templateId, newName, userId);
    }
    async shareReportTemplate(tenantId, templateId, shareWith, userId) {
        return await this.templateService.shareReportTemplate(tenantId, templateId, shareWith, userId);
    }
    // Report Generation
    async generateReport(tenantId, request, userId) {
        try {
            logger_1.logger.info('Generating report through engine', {
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
        }
        catch (error) {
            logger_1.logger.error('Error generating report through engine:', error);
            throw error;
        }
    }
    async getReportJob(jobId) {
        return await this.generationService.getReportJob(jobId);
    }
    async getReportJobs(tenantId, options = {}) {
        return await this.generationService.getReportJobs(tenantId, options);
    }
    async cancelReportJob(jobId, userId) {
        return await this.generationService.cancelReportJob(jobId, userId);
    }
    async retryReportJob(jobId, userId) {
        return await this.generationService.retryReportJob(jobId, userId);
    }
    // Scheduling
    async scheduleReport(tenantId, scheduleData, userId) {
        return await this.generationService.scheduleReport(tenantId, scheduleData, userId);
    }
    async executeScheduledReport(scheduleId) {
        return await this.generationService.executeScheduledReport(scheduleId);
    }
    // Pre-built Report Types
    async generatePerformanceReport(tenantId, portfolioIds, dateRange, format = ReportingEngine_1.ReportFormat.PDF, userId) {
        try {
            logger_1.logger.info('Generating performance report', {
                tenantId,
                portfolioIds,
                dateRange,
                format,
                userId
            });
            // Get or create performance report template
            const template = await this.getOrCreatePerformanceTemplate(tenantId);
            const request = {
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
        }
        catch (error) {
            logger_1.logger.error('Error generating performance report:', error);
            throw error;
        }
    }
    async generateHoldingsReport(tenantId, portfolioIds, asOfDate, format = ReportingEngine_1.ReportFormat.EXCEL, userId) {
        try {
            logger_1.logger.info('Generating holdings report', {
                tenantId,
                portfolioIds,
                asOfDate,
                format,
                userId
            });
            // Get or create holdings report template
            const template = await this.getOrCreateHoldingsTemplate(tenantId);
            const request = {
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
        }
        catch (error) {
            logger_1.logger.error('Error generating holdings report:', error);
            throw error;
        }
    }
    async generateTransactionReport(tenantId, portfolioIds, dateRange, format = ReportingEngine_1.ReportFormat.CSV, userId) {
        try {
            logger_1.logger.info('Generating transaction report', {
                tenantId,
                portfolioIds,
                dateRange,
                format,
                userId
            });
            // Get or create transaction report template
            const template = await this.getOrCreateTransactionTemplate(tenantId);
            const request = {
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
        }
        catch (error) {
            logger_1.logger.error('Error generating transaction report:', error);
            throw error;
        }
    }
    async generateComplianceReport(tenantId, portfolioIds, asOfDate, format = ReportingEngine_1.ReportFormat.PDF, userId) {
        try {
            logger_1.logger.info('Generating compliance report', {
                tenantId,
                portfolioIds,
                asOfDate,
                format,
                userId
            });
            // Get or create compliance report template
            const template = await this.getOrCreateComplianceTemplate(tenantId);
            const request = {
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
        }
        catch (error) {
            logger_1.logger.error('Error generating compliance report:', error);
            throw error;
        }
    }
    // Custom Report Builder
    async buildCustomReport(tenantId, builder, userId) {
        return await this.templateService.buildCustomReport(tenantId, builder, userId);
    }
    // Library Management
    async createReportLibrary(tenantId, libraryData, userId) {
        return await this.templateService.createReportLibrary(tenantId, libraryData, userId);
    }
    // Analytics and Usage
    async getReportUsageStats(tenantId, templateId, dateRange) {
        return await this.templateService.getReportUsageStats(tenantId, templateId, dateRange);
    }
    async getDashboardMetrics(tenantId, userId) {
        try {
            logger_1.logger.info('Retrieving dashboard metrics', { tenantId, userId });
            const [templates, recentJobs, usageStats] = await Promise.all([
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
        }
        catch (error) {
            logger_1.logger.error('Error retrieving dashboard metrics:', error);
            throw error;
        }
    }
    // Private helper methods
    async validateReportRequest(tenantId, request) {
        // Validate template exists
        const template = await this.getReportTemplate(tenantId, request.templateId);
        if (!template) {
            throw new Error('Report template not found');
        }
        if (!template.isActive) {
            throw new Error('Report template is inactive');
        }
        // Validate format
        if (!Object.values(ReportingEngine_1.ReportFormat).includes(request.format)) {
            throw new Error('Invalid report format');
        }
        // Validate delivery method
        if (request.deliveryMethod === 'EMAIL' && (!request.emailRecipients || request.emailRecipients.length === 0)) {
            throw new Error('Email recipients required for email delivery');
        }
    }
    async getOrCreatePerformanceTemplate(tenantId) {
        // Try to get existing template
        const existing = await this.getReportTemplates(tenantId, {
            reportType: ReportingEngine_1.ReportType.PERFORMANCE,
            limit: 1
        });
        if (existing.templates.length > 0) {
            return existing.templates[0];
        }
        // Create new performance template
        const templateData = {
            name: 'Standard Performance Report',
            description: 'Standard portfolio performance analysis report',
            reportType: ReportingEngine_1.ReportType.PERFORMANCE,
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
    async getOrCreateHoldingsTemplate(tenantId) {
        // Try to get existing template
        const existing = await this.getReportTemplates(tenantId, {
            reportType: ReportingEngine_1.ReportType.HOLDINGS,
            limit: 1
        });
        if (existing.templates.length > 0) {
            return existing.templates[0];
        }
        // Create new holdings template
        const templateData = {
            name: 'Standard Holdings Report',
            description: 'Standard portfolio holdings and positions report',
            reportType: ReportingEngine_1.ReportType.HOLDINGS,
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
    async getOrCreateTransactionTemplate(tenantId) {
        // Try to get existing template
        const existing = await this.getReportTemplates(tenantId, {
            reportType: ReportingEngine_1.ReportType.TRANSACTION,
            limit: 1
        });
        if (existing.templates.length > 0) {
            return existing.templates[0];
        }
        // Create new transaction template
        const templateData = {
            name: 'Standard Transaction Report',
            description: 'Standard portfolio transaction activity report',
            reportType: ReportingEngine_1.ReportType.TRANSACTION,
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
    async getOrCreateComplianceTemplate(tenantId) {
        // Try to get existing template
        const existing = await this.getReportTemplates(tenantId, {
            reportType: ReportingEngine_1.ReportType.COMPLIANCE,
            limit: 1
        });
        if (existing.templates.length > 0) {
            return existing.templates[0];
        }
        // Create new compliance template
        const templateData = {
            name: 'Standard Compliance Report',
            description: 'Standard portfolio compliance monitoring report',
            reportType: ReportingEngine_1.ReportType.COMPLIANCE,
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
    calculateJobStatusBreakdown(jobs) {
        const breakdown = {
            completed: 0,
            pending: 0,
            generating: 0,
            failed: 0,
            cancelled: 0
        };
        jobs.forEach(job => {
            switch (job.status) {
                case ReportingEngine_1.ReportStatus.COMPLETED:
                    breakdown.completed++;
                    break;
                case ReportingEngine_1.ReportStatus.PENDING:
                    breakdown.pending++;
                    break;
                case ReportingEngine_1.ReportStatus.GENERATING:
                    breakdown.generating++;
                    break;
                case ReportingEngine_1.ReportStatus.FAILED:
                    breakdown.failed++;
                    break;
                case ReportingEngine_1.ReportStatus.CANCELLED:
                    breakdown.cancelled++;
                    break;
            }
        });
        return breakdown;
    }
    async getMonthlyUsage(tenantId) {
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
exports.ReportingEngineService = ReportingEngineService;

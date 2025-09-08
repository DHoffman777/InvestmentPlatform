"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerationService = void 0;
const crypto_1 = require("crypto");
const ReportingEngine_1 = require("../../models/reporting/ReportingEngine");
const ReportTemplateService_1 = require("./ReportTemplateService");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class ReportGenerationService {
    reportTemplateService;
    eventPublisher;
    constructor() {
        this.reportTemplateService = new ReportTemplateService_1.ReportTemplateService();
        this.eventPublisher = new eventPublisher_1.EventPublisher('ReportGenerationService');
    }
    async generateReport(tenantId, request, userId) {
        try {
            logger_1.logger.info('Starting report generation', {
                tenantId,
                templateId: request.templateId,
                format: request.format,
                userId
            });
            // Get template
            const template = await this.reportTemplateService.getReportTemplate(tenantId, request.templateId);
            if (!template) {
                throw new Error('Report template not found');
            }
            // Create report job
            const job = {
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                templateId: request.templateId,
                request,
                status: ReportingEngine_1.ReportStatus.PENDING,
                progress: 0,
                retryCount: 0,
                maxRetries: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Save job
            await this.saveReportJob(job);
            // Queue for processing
            await this.queueReportJob(job);
            // Publish event
            await this.eventPublisher.publish('report.generation.started', {
                tenantId,
                jobId: job.id,
                templateId: request.templateId,
                requestedBy: userId
            });
            logger_1.logger.info('Report generation job created', { jobId: job.id });
            return job;
        }
        catch (error) {
            logger_1.logger.error('Error starting report generation:', error);
            throw error;
        }
    }
    async processReportJob(jobId) {
        try {
            logger_1.logger.info('Processing report job', { jobId });
            const job = await this.getReportJob(jobId);
            if (!job) {
                throw new Error('Report job not found');
            }
            // Update status to generating
            await this.updateJobStatus(jobId, ReportingEngine_1.ReportStatus.GENERATING, 0);
            const startTime = new Date();
            try {
                // Get template
                const template = await this.reportTemplateService.getReportTemplate(job.tenantId, job.templateId);
                if (!template) {
                    throw new Error('Report template not found');
                }
                // Extract data
                await this.updateJobStatus(jobId, ReportingEngine_1.ReportStatus.GENERATING, 25);
                const reportData = await this.extractReportData(template, job.request);
                // Apply filters and transformations
                await this.updateJobStatus(jobId, ReportingEngine_1.ReportStatus.GENERATING, 50);
                const processedData = await this.processReportData(reportData, template, job.request);
                // Generate output
                await this.updateJobStatus(jobId, ReportingEngine_1.ReportStatus.GENERATING, 75);
                const outputUrl = await this.generateReportOutput(processedData, template, job.request.format);
                // Complete job
                const endTime = new Date();
                const executionTime = endTime.getTime() - startTime.getTime();
                await this.completeReportJob(jobId, {
                    outputFileUrl: outputUrl,
                    outputSize: await this.getFileSize(outputUrl),
                    recordCount: processedData.rows.length,
                    executionTime
                });
                // Handle delivery
                if (job.request.deliveryMethod !== 'DOWNLOAD') {
                    await this.deliverReport(job, outputUrl);
                }
                // Publish completion event
                await this.eventPublisher.publish('report.generation.completed', {
                    tenantId: job.tenantId,
                    jobId,
                    templateId: job.templateId,
                    outputUrl,
                    executionTime
                });
                logger_1.logger.info('Report generation completed successfully', {
                    jobId,
                    executionTime,
                    recordCount: processedData.rows.length
                });
            }
            catch (error) {
                await this.failReportJob(jobId, error instanceof Error ? error.message : 'Unknown error');
                // Publish failure event
                await this.eventPublisher.publish('report.generation.failed', {
                    tenantId: job.tenantId,
                    jobId,
                    templateId: job.templateId,
                    error: error.message
                });
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Error processing report job:', error);
            throw error;
        }
    }
    async scheduleReport(tenantId, scheduleData, userId) {
        try {
            logger_1.logger.info('Creating report schedule', {
                tenantId,
                templateId: scheduleData.templateId,
                frequency: scheduleData.frequency,
                userId
            });
            const schedule = {
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                templateId: scheduleData.templateId,
                name: scheduleData.name || 'Scheduled Report',
                description: scheduleData.description,
                frequency: scheduleData.frequency || ReportingEngine_1.ReportFrequency.MONTHLY,
                schedule: scheduleData.schedule || {
                    dayOfMonth: 1,
                    hour: 9,
                    minute: 0,
                    timezone: 'UTC'
                },
                nextExecution: this.calculateNextExecution(scheduleData.frequency || ReportingEngine_1.ReportFrequency.MONTHLY, scheduleData.schedule || {
                    dayOfMonth: 1,
                    hour: 9,
                    minute: 0,
                    timezone: 'UTC'
                }),
                parameters: scheduleData.parameters || {},
                recipients: scheduleData.recipients || [],
                format: scheduleData.format || ReportingEngine_1.ReportFormat.PDF,
                isActive: true,
                failureCount: 0,
                maxFailures: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId,
                updatedBy: userId
            };
            // Save schedule
            await this.saveReportSchedule(schedule);
            // Register with scheduler
            await this.registerSchedule(schedule);
            logger_1.logger.info('Report schedule created successfully', {
                scheduleId: schedule.id,
                nextExecution: schedule.nextExecution
            });
            return schedule;
        }
        catch (error) {
            logger_1.logger.error('Error creating report schedule:', error);
            throw error;
        }
    }
    async executeScheduledReport(scheduleId) {
        try {
            logger_1.logger.info('Executing scheduled report', { scheduleId });
            const schedule = await this.getReportSchedule(scheduleId);
            if (!schedule || !schedule.isActive) {
                logger_1.logger.warn('Schedule not found or inactive', { scheduleId });
                return;
            }
            // Create report request from schedule
            const request = {
                templateId: schedule.templateId,
                name: `${schedule.name} - ${new Date().toISOString()}`,
                parameters: schedule.parameters,
                format: schedule.format,
                deliveryMethod: 'EMAIL',
                emailRecipients: schedule.recipients,
                requestedBy: 'SYSTEM',
                requestedAt: new Date(),
                priority: 'MEDIUM'
            };
            // Generate report
            const job = await this.generateReport(schedule.tenantId, request, 'SYSTEM');
            // Update schedule
            await this.updateScheduleExecution(scheduleId, true);
            logger_1.logger.info('Scheduled report executed successfully', {
                scheduleId,
                jobId: job.id
            });
        }
        catch (error) {
            logger_1.logger.error('Error executing scheduled report:', error);
            // Update schedule failure count
            await this.updateScheduleExecution(scheduleId, false);
            throw error;
        }
    }
    async getReportJob(jobId) {
        try {
            // Mock implementation - replace with actual database query
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving report job:', error);
            throw error;
        }
    }
    async getReportJobs(tenantId, options = {}) {
        try {
            logger_1.logger.info('Retrieving report jobs', { tenantId, options });
            // Mock implementation - replace with actual database query
            const jobs = [];
            const totalCount = 0;
            return { jobs, totalCount };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving report jobs:', error);
            throw error;
        }
    }
    async cancelReportJob(jobId, userId) {
        try {
            logger_1.logger.info('Cancelling report job', { jobId, userId });
            const job = await this.getReportJob(jobId);
            if (!job) {
                throw new Error('Report job not found');
            }
            if (job.status === ReportingEngine_1.ReportStatus.COMPLETED) {
                throw new Error('Cannot cancel completed job');
            }
            await this.updateJobStatus(jobId, ReportingEngine_1.ReportStatus.CANCELLED);
            // Publish event
            await this.eventPublisher.publish('report.generation.cancelled', {
                tenantId: job.tenantId,
                jobId,
                cancelledBy: userId
            });
            logger_1.logger.info('Report job cancelled successfully', { jobId });
        }
        catch (error) {
            logger_1.logger.error('Error cancelling report job:', error);
            throw error;
        }
    }
    async retryReportJob(jobId, userId) {
        try {
            logger_1.logger.info('Retrying report job', { jobId, userId });
            const job = await this.getReportJob(jobId);
            if (!job) {
                throw new Error('Report job not found');
            }
            if (job.status !== ReportingEngine_1.ReportStatus.FAILED) {
                throw new Error('Can only retry failed jobs');
            }
            if (job.retryCount >= job.maxRetries) {
                throw new Error('Maximum retry attempts exceeded');
            }
            // Reset job status and increment retry count
            await this.updateJobForRetry(jobId);
            // Queue for processing
            await this.queueReportJob(job);
            logger_1.logger.info('Report job queued for retry', { jobId });
        }
        catch (error) {
            logger_1.logger.error('Error retrying report job:', error);
            throw error;
        }
    }
    // Private helper methods
    async extractReportData(template, request) {
        logger_1.logger.info('Extracting report data', {
            templateId: template.id,
            baseEntity: template.dataSource.baseEntity
        });
        // Mock implementation - replace with actual data extraction
        const headers = template.columns.map(col => col.displayName);
        const rows = [
            ['Sample Portfolio', '2024-12-31', '$1,000,000', '5.25%'],
            ['Test Portfolio', '2024-12-31', '$2,500,000', '7.80%'],
            ['Demo Portfolio', '2024-12-31', '$750,000', '3.45%']
        ];
        return {
            headers,
            rows,
            metadata: {
                totalRows: rows.length,
                generatedAt: new Date(),
                executionTime: 0,
                filters: request.filters || [],
                dateRange: request.dateRange
            }
        };
    }
    async processReportData(data, template, request) {
        logger_1.logger.info('Processing report data', {
            templateId: template.id,
            rowCount: data.rows.length
        });
        let processedData = { ...data };
        // Apply filters
        if (request.filters && request.filters.length > 0) {
            processedData = await this.applyFilters(processedData, request.filters);
        }
        // Apply aggregation
        if (request.aggregationLevel) {
            processedData = await this.applyAggregation(processedData, request.aggregationLevel);
        }
        return processedData;
    }
    async generateReportOutput(data, template, format) {
        logger_1.logger.info('Generating report output', {
            templateId: template.id,
            format,
            rowCount: data.rows.length
        });
        switch (format) {
            case ReportingEngine_1.ReportFormat.PDF:
                return await this.generatePDF(data, template);
            case ReportingEngine_1.ReportFormat.EXCEL:
                return await this.generateExcel(data, template);
            case ReportingEngine_1.ReportFormat.CSV:
                return await this.generateCSV(data, template);
            case ReportingEngine_1.ReportFormat.HTML:
                return await this.generateHTML(data, template);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    async generatePDF(data, template) {
        // Mock PDF generation
        const fileName = `report_${template.id}_${Date.now()}.pdf`;
        const fileUrl = `s3://reports/${fileName}`;
        logger_1.logger.info('Generated PDF report', { fileName, fileUrl });
        return fileUrl;
    }
    async generateExcel(data, template) {
        // Mock Excel generation
        const fileName = `report_${template.id}_${Date.now()}.xlsx`;
        const fileUrl = `s3://reports/${fileName}`;
        logger_1.logger.info('Generated Excel report', { fileName, fileUrl });
        return fileUrl;
    }
    async generateCSV(data, template) {
        // Mock CSV generation
        const fileName = `report_${template.id}_${Date.now()}.csv`;
        const fileUrl = `s3://reports/${fileName}`;
        logger_1.logger.info('Generated CSV report', { fileName, fileUrl });
        return fileUrl;
    }
    async generateHTML(data, template) {
        // Mock HTML generation
        const fileName = `report_${template.id}_${Date.now()}.html`;
        const fileUrl = `s3://reports/${fileName}`;
        logger_1.logger.info('Generated HTML report', { fileName, fileUrl });
        return fileUrl;
    }
    async applyFilters(data, filters) {
        // Mock filter application
        logger_1.logger.info('Applying filters', { filterCount: filters.length });
        return data;
    }
    async applyAggregation(data, aggregationLevel) {
        // Mock aggregation
        logger_1.logger.info('Applying aggregation', { aggregationLevel });
        return data;
    }
    async deliverReport(job, outputUrl) {
        logger_1.logger.info('Delivering report', {
            jobId: job.id,
            deliveryMethod: job.request.deliveryMethod
        });
        const delivery = {
            id: (0, crypto_1.randomUUID)(),
            reportJobId: job.id,
            method: job.request.deliveryMethod === 'PRINT' ? 'DOWNLOAD' : job.request.deliveryMethod,
            recipients: job.request.emailRecipients,
            subject: `Report: ${job.request.name || 'Generated Report'}`,
            message: 'Your requested report is ready.',
            deliveryStatus: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        switch (job.request.deliveryMethod) {
            case 'EMAIL':
                await this.sendEmailReport(delivery, outputUrl);
                break;
            case 'SAVE':
                await this.saveReportToLibrary(job, outputUrl);
                break;
            default:
                logger_1.logger.warn('Unknown delivery method', { method: job.request.deliveryMethod });
        }
    }
    async sendEmailReport(delivery, fileUrl) {
        // Mock email sending
        logger_1.logger.info('Sending email report', {
            deliveryId: delivery.id,
            recipients: delivery.recipients
        });
        // Update delivery status
        delivery.deliveryStatus = 'SENT';
        delivery.deliveryTime = new Date();
    }
    async saveReportToLibrary(job, fileUrl) {
        // Mock save to library
        logger_1.logger.info('Saving report to library', {
            jobId: job.id,
            fileUrl
        });
    }
    calculateNextExecution(frequency, schedule) {
        const now = new Date();
        const next = new Date();
        switch (frequency) {
            case ReportingEngine_1.ReportFrequency.DAILY:
                next.setDate(now.getDate() + 1);
                break;
            case ReportingEngine_1.ReportFrequency.WEEKLY:
                next.setDate(now.getDate() + 7);
                break;
            case ReportingEngine_1.ReportFrequency.MONTHLY:
                next.setMonth(now.getMonth() + 1);
                if (schedule.dayOfMonth) {
                    next.setDate(schedule.dayOfMonth);
                }
                break;
            case ReportingEngine_1.ReportFrequency.QUARTERLY:
                next.setMonth(now.getMonth() + 3);
                break;
            case ReportingEngine_1.ReportFrequency.ANNUAL:
                next.setFullYear(now.getFullYear() + 1);
                break;
            default:
                next.setDate(now.getDate() + 1);
        }
        next.setHours(schedule.hour, schedule.minute, 0, 0);
        return next;
    }
    async saveReportJob(job) {
        // Mock implementation
        logger_1.logger.debug('Saving report job', { jobId: job.id });
    }
    async saveReportSchedule(schedule) {
        // Mock implementation
        logger_1.logger.debug('Saving report schedule', { scheduleId: schedule.id });
    }
    async queueReportJob(job) {
        // Mock implementation - queue for background processing
        logger_1.logger.debug('Queuing report job', { jobId: job.id });
        // In a real implementation, this would queue the job for processing
        // For now, we'll process it immediately
        setTimeout(() => this.processReportJob(job.id), 1000);
    }
    async updateJobStatus(jobId, status, progress) {
        logger_1.logger.debug('Updating job status', { jobId, status, progress });
    }
    async completeReportJob(jobId, result) {
        logger_1.logger.debug('Completing report job', { jobId, result });
    }
    async failReportJob(jobId, errorMessage) {
        logger_1.logger.debug('Failing report job', { jobId, errorMessage });
    }
    async updateJobForRetry(jobId) {
        logger_1.logger.debug('Updating job for retry', { jobId });
    }
    async getReportSchedule(scheduleId) {
        // Mock implementation
        return null;
    }
    async registerSchedule(schedule) {
        // Mock implementation - register with scheduler
        logger_1.logger.debug('Registering schedule', { scheduleId: schedule.id });
    }
    async updateScheduleExecution(scheduleId, success) {
        // Mock implementation
        logger_1.logger.debug('Updating schedule execution', { scheduleId, success });
    }
    async getFileSize(fileUrl) {
        // Mock implementation
        return 1024 * 1024; // 1MB
    }
}
exports.ReportGenerationService = ReportGenerationService;
